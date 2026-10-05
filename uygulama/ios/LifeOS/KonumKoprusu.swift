// KONUM KOPRUSU — ekran kapaliyken rota (asama 2).
//
// Tarayici kilitli ekranda konum vermez. Uygulamada sayfanin
// navigator.geolocation'i telefonun kendi konum servisine (CoreLocation)
// baglanir; arka plan konum kipiyle (UIBackgroundModes: location) ekran
// kapaliyken de nokta gelir. SPI'nin canli.js'i DEGISMEZ: ayni arayuzden
// (watchPosition) okur, noktanin kendi zaman damgasini (timestamp) kullanir.
//
// Kurallar:
//   1. ARKA PLANDA BIRIKIR. Uygulama arka plandayken noktalar burada
//      tutulur; one gelince kendi sirasiyla, kendi zamanlariyla verilir.
//   2. YALNIZ KENDI SAYFAMIZ. Istek 127.0.0.1 kokeninden gelmezse yok sayilir.
//   3. IZLEYEN YOKSA GPS KAPALI. Son izleyici birakinca (ya da sayfa
//      degisince) konum servisi durur: pil bosa gitmez.
//   4. SAYFA KIMLIGI. Her sayfa kendine bir kimlik uretir ve her mesaja
//      ekler. Yeni kimlik gelince eskisinin izleyicileri biter; biten
//      kimlikten gelen gec mesaj yok sayilir (yeni sayfanin istegi, eski
//      sayfanin «bitti» bildiriminden once gelebilir — sira garantisi yok).
//   5. KONUM CIHAZDAN CIKMAZ (canli.js soz 6). Kopru agla konusmaz.
//   6. SAYFA «YAZDIM» DEMEDEN NOKTA SILINMEZ (asama 2b). Izlenen her nokta
//      diske de yazilir (KaliciTampon); sayfa depoya yazinca `yazildi` ile
//      bildirir, o kisim silinir. Sayfa acilinca `kurtar` ile sorar.
//   7. WEB SURECI OLURSE KAYIT DURMAZ. iOS web icerigini oldurdugunde izleyen
//      varsa GPS acik kalir, noktalar diske yazilmaya devam eder (sahipsiz);
//      yeniden yuklenen sayfa kaydi sahiplenir ve kaldigi yerden surdurur.
//      Uygulamanin kendisi kapanirsa noktalar diskte kalir; sayfa onlari
//      ekler ve kaydi duraklatilmis getirir.

import CoreLocation
import UIKit
import WebKit

final class KonumKoprusu: NSObject, WKScriptMessageHandler, CLLocationManagerDelegate {
    static let ad = "lifeosKonum"

    weak var web: WKWebView?
    let yonetici: CLLocationManager
    let kalici: KaliciTampon
    private(set) var izleyenler = Set<Int>()
    private(set) var tekler = Set<Int>()
    private(set) var tampon: [[String: Any]] = []
    private(set) var onPlanda = true
    private(set) var sayfa: String?
    /// Web sureci oldu ama kayit suruyordu: GPS acik, noktalar yalniz diske.
    private(set) var sahipsiz = false
    /// Konum servisi istendi mi (izni beklese de); dur() kapatir.
    private(set) var gpsIstendi = false
    /// Olen sayfanin yeniden yuklenmesi: bunun gezintisi GPS'i durdurmaz.
    private var olumYuklemesi = false
    /// Bu acilista konum izni istendi mi: «soruluyor» ile «sorulmadi»yi ayirir.
    private(set) var izinIstendi = false
    /// Bu izlemede CoreLocation'dan gelen konum sayisi (gecersizler dahil).
    private(set) var gelen = 0
    private var biten = Set<String>()

    init(yonetici: CLLocationManager = CLLocationManager(), kalici: KaliciTampon = KaliciTampon()) {
        self.yonetici = yonetici
        self.kalici = kalici
        super.init()
        yonetici.delegate = self
        yonetici.desiredAccuracy = kCLLocationAccuracyBest
        yonetici.activityType = .fitness
        yonetici.distanceFilter = kCLDistanceFilterNone
        yonetici.pausesLocationUpdatesAutomatically = false
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(oneGeldi), name: UIApplication.didBecomeActiveNotification, object: nil)
        nc.addObserver(self, selector: #selector(arkayaGitti), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    /// Sayfaya ilk betikten once eklenir: navigator.geolocation yerele baglanir.
    static var betik: WKUserScript {
        WKUserScript(source: KonumKoprusu.kaynak, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }

    // MARK: - sayfadan gelen

    func userContentController(_ ucc: WKUserContentController, didReceive m: WKScriptMessage) {
        guard m.frameInfo.securityOrigin.host == "127.0.0.1",
              let g = m.body as? [String: Any], let tur = g["tur"] as? String,
              let id = (g["id"] as? NSNumber)?.intValue,
              let sayfaNo = g["sayfa"] as? String else { return }
        istek(tur, id, sayfa: sayfaNo, t: (g["t"] as? NSNumber)?.doubleValue,
              devam: (g["devam"] as? Bool) ?? false)
    }

    func istek(_ tur: String, _ id: Int, sayfa sayfaNo: String, t: Double? = nil, devam: Bool = false) {
        // «Depoya yazdim» her sayfadan gecerlidir: biten sayfanin son yazimi
        // (pagehide) da gercek bir yazimdir; depo kapiya gore ortaktir.
        if tur == "yazildi" {
            if let t = t, t.isFinite { kalici.yazildi(t) }
            return
        }
        if biten.contains(sayfaNo) { return }
        if sayfaNo != sayfa {
            if tur == "birak" { return }
            if let eski = sayfa { biten.insert(eski) }
            izleyenler.removeAll()
            tekler.removeAll()
            tampon.removeAll()
            sayfa = sayfaNo
        }
        switch tur {
        case "izle":
            let sahiplendi = sahipsiz
            izleyenler.insert(id)
            sahipsiz = false
            basla()
            // Kurtarma cevabiyla izleme arasinda gelen nokta da sayfaya gitsin
            // (sayfa zaten isledigini tekrar almaz).
            if sahiplendi {
                if onPlanda { ilet(kalici.noktalar) } else { tampon = kalici.noktalar }
            }
            durumBildir()
        case "tek": tekler.insert(id); basla(); durumBildir()
        case "birak":
            guard izleyenler.remove(id) != nil else { return }
            // Sayfa izlemeyi kendisi birakti (duraklat, sil): taslagini yazdi.
            if izleyenler.isEmpty { kalici.temizle() }
            if izleyenler.isEmpty && tekler.isEmpty { dur() }
        case "kurtar": kurtar(id, devam: devam)
        default: break
        }
    }

    /// Sayfa acildi ve soruyor: diskte ne var, GPS hic durmadi mi? `devam`:
    /// sayfanin yarida kalmis bir kaydi var. Yoksa sahipsiz GPS durur.
    private func kurtar(_ id: Int, devam: Bool) {
        let suruyor = devam && sahipsiz
        if sahipsiz && !suruyor {
            sahipsiz = false
            if izleyenler.isEmpty && tekler.isEmpty { dur() }
        }
        cagir("kurtarildi", [id, ["noktalar": kalici.noktalar, "suruyor": suruyor] as [String: Any]])
    }

    /// Sayfadan ayriliniyor (modul gecisi, yenileme): eski sayfanin
    /// izleyicileri biter, GPS durur. Istisna: olen web surecinin yeniden
    /// yuklenmesi — kayit yeni sayfayi bekler (sayfaOldu). Diskteki noktalar
    /// kalir: sayfa geri gelince ister.
    func sayfaDegisti() {
        sayfaBitti()
        if olumYuklemesi {
            olumYuklemesi = false
            return
        }
        sahipsiz = false
        dur()
    }

    /// iOS web surecini oldurdu: sayfa yok ama kayit surebilir. Izleyen varsa
    /// GPS durmaz, noktalar diske yazilmaya devam eder; yeniden yuklenen
    /// sayfa `kurtar` ile sahiplenir. Izleyen yoksa GPS'e gerek yok.
    func sayfaOldu() {
        if !izleyenler.isEmpty { sahipsiz = true }
        sayfaBitti()
        olumYuklemesi = sahipsiz
        if !sahipsiz { dur() }
    }

    private func sayfaBitti() {
        if let eski = sayfa { biten.insert(eski) }
        sayfa = nil
        izleyenler.removeAll()
        tekler.removeAll()
        tampon.removeAll()
    }

    // MARK: - konum servisi

    private func basla() {
        gpsIstendi = true
        switch yonetici.authorizationStatus {
        case .notDetermined:
            izinIstendi = true
            yonetici.requestWhenInUseAuthorization()       // devami: locationManagerDidChangeAuthorization
        case .denied, .restricted:
            hata(1, "Konum izni verilmedi. Ayarlar › LifeOS › Konum › «Uygulamayı Kullanırken».")
        default:
            yonetici.allowsBackgroundLocationUpdates = !izleyenler.isEmpty || sahipsiz
            yonetici.showsBackgroundLocationIndicator = true
            yonetici.startUpdatingLocation()
        }
    }

    private func dur() {
        gpsIstendi = false
        gelen = 0
        yonetici.stopUpdatingLocation()
        yonetici.allowsBackgroundLocationUpdates = false
    }

    func locationManagerDidChangeAuthorization(_ m: CLLocationManager) {
        guard !izleyenler.isEmpty || !tekler.isEmpty || sahipsiz else { return }
        switch m.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: basla()
        case .denied, .restricted: hata(1, "Konum izni verilmedi. Ayarlar › LifeOS › Konum.")
        default: break
        }
        durumBildir()
    }

    func locationManager(_ m: CLLocationManager, didUpdateLocations l: [CLLocation]) {
        let ilk = gelen == 0
        gelen += l.count
        if ilk && !l.isEmpty { durumBildir() }
        let noktalar = l.filter { $0.horizontalAccuracy >= 0 }.map(KonumKoprusu.js)
        guard !noktalar.isEmpty else { return }
        if !izleyenler.isEmpty || sahipsiz { kalici.ekle(noktalar) }
        if !izleyenler.isEmpty || !tekler.isEmpty {
            if onPlanda { ilet(noktalar) } else { tampon += noktalar }
        }
        if !tekler.isEmpty {
            tekler.removeAll()
            if izleyenler.isEmpty { dur() }
        }
    }

    func locationManager(_ m: CLLocationManager, didFailWithError e: Error) {
        if (e as? CLError)?.code == .denied { hata(1, "Konum izni verilmedi.") }
        // locationUnknown gecicidir: servis denemeye devam eder.
    }

    // MARK: - durum (kullanici, 2026-10-05: «direk konum gelmiyor»)
    //
    // Telefonda ekranda yalniz «Konum bekleniyor…» vardi ve Ayarlar › LifeOS'ta
    // Konum satiri hic yoktu: izin bile sorulmamisti, ama hangi halkada
    // takildigi gorulemiyordu. Kopru artik durumunu sayfaya bildirir; SPI
    // nedenini yazar (izin soruluyor · Konum Servisleri kapali · Kesin Konum
    // kapali · GPS acik, ilk konum bekleniyor). Durum hic gelmezse sayfa
    // «cevap vermedi» der: istek kopruye ulasmamistir.

    func durumSozlugu(servis: Bool?) -> [String: Any] {
        let izin: String
        switch yonetici.authorizationStatus {
        case .notDetermined: izin = izinIstendi ? "soruluyor" : "sorulmadi"
        case .denied: izin = "reddedildi"
        case .restricted: izin = "kisitli"
        default: izin = "izinli"
        }
        var d: [String: Any] = [
            "izin": izin,
            "kesin": yonetici.accuracyAuthorization == .fullAccuracy,
            "gps": gpsIstendi && izin == "izinli",
            "gelen": gelen,
        ]
        if let s = servis { d["servis"] = s }
        return d
    }

    /// Son bilinen Konum Servisleri durumu (ilk cevap gelene dek nil).
    private var servisBilinen: Bool?

    /// Durum HEMEN gider; Konum Servisleri bilgisi sonra eklenir.
    /// locationServicesEnabled konum surecine eszamanli bir sorudur: ana is
    /// parcaciginda cagrilmaz (iOS uyarir) ve yuklu bir CI simulatorunde
    /// saniyeler surebiliyordu — durum onu bekleyince sayfaya gec ulasiyor,
    /// test araliklı kiriliyordu (derleme 33). Bilgi degisirse ikinci mesaj.
    private func durumBildir() {
        cagir("durumGeldi", [durumSozlugu(servis: servisBilinen)])
        DispatchQueue.global(qos: .utility).async { [weak self] in
            let servis = CLLocationManager.locationServicesEnabled()
            DispatchQueue.main.async {
                guard let self = self else { return }
                let degisti = self.servisBilinen != servis
                self.servisBilinen = servis
                if degisti { self.cagir("durumGeldi", [self.durumSozlugu(servis: servis)]) }
            }
        }
    }

    // MARK: - one / arkaya

    @objc func oneGeldi() {
        onPlanda = true
        let t = tampon
        tampon.removeAll()
        ilet(t)
    }

    @objc func arkayaGitti() { onPlanda = false }

    // MARK: - sayfaya giden

    /// Gecerli olmayan olcu (CoreLocation'da eksi deger) null'dir: sifir degil (AGENTS §1.2).
    private static func olcu(_ deger: Double, _ gecerli: Bool) -> Any {
        if gecerli { return deger }
        return NSNull()
    }

    static func js(_ k: CLLocation) -> [String: Any] {
        let coords: [String: Any] = [
            "latitude": k.coordinate.latitude,
            "longitude": k.coordinate.longitude,
            "accuracy": k.horizontalAccuracy,
            "altitude": olcu(k.altitude, k.verticalAccuracy >= 0),
            "altitudeAccuracy": olcu(k.verticalAccuracy, k.verticalAccuracy >= 0),
            "heading": olcu(k.course, k.course >= 0),
            "speed": olcu(k.speed, k.speed >= 0),
        ]
        return [
            "coords": coords,
            "timestamp": (k.timestamp.timeIntervalSince1970 * 1000).rounded(),
        ]
    }

    private func ilet(_ n: [[String: Any]]) {
        guard !n.isEmpty else { return }
        cagir("konum", [n])
    }

    private func hata(_ kod: Int, _ mesaj: String) {
        tekler.removeAll()
        cagir("hata", [kod, mesaj])
    }

    /// Sayfadaki `window.__lifeosKonum.<islev>(...arg)`; arg JSON'dur.
    private func cagir(_ islev: String, _ arg: [Any]) {
        guard let w = web, JSONSerialization.isValidJSONObject(arg),
              let veri = try? JSONSerialization.data(withJSONObject: arg),
              let metin = String(data: veri, encoding: .utf8) else { return }
        w.evaluateJavaScript("window.__lifeosKonum && void window.__lifeosKonum.\(islev).apply(null, \(metin))")
    }

    // MARK: - sayfa betigi

    static let kaynak = """
    (function(){
      if (window.__lifeosKonum) return;
      var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.lifeosKonum;
      if (!h) return;
      var sira = 0, izleyen = {}, tek = {}, kurtaran = {}, sonDurum = null;
      var sayfa = Math.random().toString(36).slice(2) + Date.now().toString(36);
      function yolla(m){ m.sayfa = sayfa; try { h.postMessage(m); } catch (e) {} }
      function nesne(p){ var c = p.coords; return { timestamp: p.timestamp, coords: {
        latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy, altitude: c.altitude,
        altitudeAccuracy: c.altitudeAccuracy, heading: c.heading, speed: c.speed } }; }
      var geo = {
        getCurrentPosition: function(ok, hata){ var id = ++sira; tek[id] = { ok: ok, hata: hata }; yolla({ tur: 'tek', id: id }); },
        watchPosition: function(ok, hata){ var id = ++sira; izleyen[id] = { ok: ok, hata: hata }; yolla({ tur: 'izle', id: id }); return id; },
        clearWatch: function(id){ if (izleyen[id]) { delete izleyen[id]; yolla({ tur: 'birak', id: id }); } }
      };
      window.__lifeosKonum = {
        yerel: true,
        konum: function(liste){
          liste.forEach(function(p){
            var n = nesne(p);
            Object.keys(tek).forEach(function(id){ var t = tek[id]; delete tek[id]; try { t.ok(n); } catch (e) {} });
            Object.keys(izleyen).forEach(function(id){ try { izleyen[id].ok(n); } catch (e) {} });
          });
        },
        hata: function(kod, mesaj){
          var e = { code: kod, message: mesaj, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
          Object.keys(tek).forEach(function(id){ var t = tek[id]; delete tek[id]; if (t.hata) try { t.hata(e); } catch (x) {} });
          Object.keys(izleyen).forEach(function(id){ var w = izleyen[id]; if (w.hata) try { w.hata(e); } catch (x) {} });
        },
        /* Asama 2b: sayfa acilinca telefondaki noktalari ister; depoya yazinca bildirir. */
        kurtar: function(devam, cb){ var id = ++sira; kurtaran[id] = cb; yolla({ tur: 'kurtar', id: id, devam: !!devam }); },
        kurtarildi: function(id, cevap){ var cb = kurtaran[id]; delete kurtaran[id]; if (cb) try { cb(cevap); } catch (e) {} },
        yazildi: function(t){ if (typeof t === 'number' && isFinite(t)) yolla({ tur: 'yazildi', id: 0, t: t }); },
        /* Telefonun konum durumu (izin, kesinlik, servis, GPS); SPI nedenini yazar. */
        durumGeldi: function(d){ sonDurum = d; try { window.dispatchEvent(new CustomEvent('lifeos-konum-durum', { detail: d })); } catch (e) {} },
        durum: function(){ return sonDurum; }
      };
      try { Object.defineProperty(navigator, 'geolocation', { configurable: true, get: function(){ return geo; } }); } catch (e) {}
      window.LIFEOS_YEREL = Object.freeze({ konum: 'arka-plan' });
    })();
    """
}
