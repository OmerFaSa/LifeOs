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

import CoreLocation
import UIKit
import WebKit

final class KonumKoprusu: NSObject, WKScriptMessageHandler, CLLocationManagerDelegate {
    static let ad = "lifeosKonum"

    weak var web: WKWebView?
    let yonetici: CLLocationManager
    private(set) var izleyenler = Set<Int>()
    private(set) var tekler = Set<Int>()
    private(set) var tampon: [[String: Any]] = []
    private(set) var onPlanda = true
    private(set) var sayfa: String?
    private var biten = Set<String>()

    init(yonetici: CLLocationManager = CLLocationManager()) {
        self.yonetici = yonetici
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
        istek(tur, id, sayfa: sayfaNo)
    }

    func istek(_ tur: String, _ id: Int, sayfa sayfaNo: String) {
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
        case "izle": izleyenler.insert(id); basla()
        case "tek": tekler.insert(id); basla()
        case "birak":
            izleyenler.remove(id)
            if izleyenler.isEmpty && tekler.isEmpty { dur() }
        default: break
        }
    }

    /// Sayfadan ayriliniyor: eski sayfanin izleyicileri biter, GPS durur.
    func sayfaDegisti() {
        if let eski = sayfa { biten.insert(eski) }
        sayfa = nil
        izleyenler.removeAll()
        tekler.removeAll()
        tampon.removeAll()
        dur()
    }

    // MARK: - konum servisi

    private func basla() {
        switch yonetici.authorizationStatus {
        case .notDetermined:
            yonetici.requestWhenInUseAuthorization()       // devami: locationManagerDidChangeAuthorization
        case .denied, .restricted:
            hata(1, "Konum izni verilmedi. Ayarlar › LifeOS › Konum › «Uygulamayı Kullanırken».")
        default:
            yonetici.allowsBackgroundLocationUpdates = !izleyenler.isEmpty
            yonetici.showsBackgroundLocationIndicator = true
            yonetici.startUpdatingLocation()
        }
    }

    private func dur() {
        yonetici.stopUpdatingLocation()
        yonetici.allowsBackgroundLocationUpdates = false
    }

    func locationManagerDidChangeAuthorization(_ m: CLLocationManager) {
        guard !izleyenler.isEmpty || !tekler.isEmpty else { return }
        switch m.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: basla()
        case .denied, .restricted: hata(1, "Konum izni verilmedi. Ayarlar › LifeOS › Konum.")
        default: break
        }
    }

    func locationManager(_ m: CLLocationManager, didUpdateLocations l: [CLLocation]) {
        let noktalar = l.filter { $0.horizontalAccuracy >= 0 }.map(KonumKoprusu.js)
        guard !noktalar.isEmpty else { return }
        if onPlanda { ilet(noktalar) } else { tampon += noktalar }
        if !tekler.isEmpty {
            tekler.removeAll()
            if izleyenler.isEmpty { dur() }
        }
    }

    func locationManager(_ m: CLLocationManager, didFailWithError e: Error) {
        if (e as? CLError)?.code == .denied { hata(1, "Konum izni verilmedi.") }
        // locationUnknown gecicidir: servis denemeye devam eder.
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
        guard !n.isEmpty, let w = web,
              let veri = try? JSONSerialization.data(withJSONObject: n),
              let metin = String(data: veri, encoding: .utf8) else { return }
        w.evaluateJavaScript("window.__lifeosKonum && window.__lifeosKonum.konum(\(metin))")
    }

    private func hata(_ kod: Int, _ mesaj: String) {
        guard let w = web, let veri = try? JSONSerialization.data(withJSONObject: [mesaj]),
              let m = String(data: veri, encoding: .utf8) else { return }
        tekler.removeAll()
        w.evaluateJavaScript("window.__lifeosKonum && window.__lifeosKonum.hata(\(kod), \(m)[0])")
    }

    // MARK: - sayfa betigi

    static let kaynak = """
    (function(){
      if (window.__lifeosKonum) return;
      var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.lifeosKonum;
      if (!h) return;
      var sira = 0, izleyen = {}, tek = {};
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
        }
      };
      try { Object.defineProperty(navigator, 'geolocation', { configurable: true, get: function(){ return geo; } }); } catch (e) {}
      window.LIFEOS_YEREL = Object.freeze({ konum: 'arka-plan' });
    })();
    """
}
