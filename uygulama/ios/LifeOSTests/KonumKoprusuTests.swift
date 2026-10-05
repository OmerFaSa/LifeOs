// Konum koprusu: ekran kapaliyken rota (asama 2).
import CoreLocation
import WebKit
import XCTest
@testable import LifeOS

final class KonumKoprusuTests: XCTestCase {

    private func nokta(_ sn: TimeInterval, lat: Double = 41.0, dogruluk: Double = 5, yukseklik: Double = 3) -> CLLocation {
        CLLocation(coordinate: CLLocationCoordinate2D(latitude: lat, longitude: 29.0),
                   altitude: 100, horizontalAccuracy: dogruluk, verticalAccuracy: yukseklik,
                   course: -1, speed: 2.8, timestamp: Date(timeIntervalSince1970: 1_790_000_000 + sn))
    }

    /// Her test kendi dosyasini kullanir: uygulamanin gercek tamponuna dokunulmaz.
    private func geciciTampon(sinir: Int = 100_000) -> KaliciTampon {
        let u = FileManager.default.temporaryDirectory.appendingPathComponent("lifeos-konum-\(UUID().uuidString).jsonl")
        return KaliciTampon(dosya: u, sinir: sinir)
    }

    private func yeniKopru() -> KonumKoprusu { KonumKoprusu(kalici: geciciTampon()) }

    private func ms(_ sn: TimeInterval) -> Double { ((1_790_000_000 + sn) * 1000).rounded() }

    // MARK: - saf

    func testIzleBirakVeSayfaKimligi() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        XCTAssertEqual(k.izleyenler, [1])
        k.istek("birak", 1, sayfa: "b")              // baska sayfanin birakisi
        XCTAssertEqual(k.izleyenler, [1])
        k.istek("izle", 1, sayfa: "b")               // yeni sayfa: eskisi biter
        XCTAssertEqual(k.sayfa, "b")
        k.istek("izle", 9, sayfa: "a")               // biten sayfadan gec mesaj
        XCTAssertEqual(k.izleyenler, [1])
        XCTAssertEqual(k.sayfa, "b")
        k.istek("birak", 1, sayfa: "b")
        XCTAssertTrue(k.izleyenler.isEmpty)
        k.istek("izle", 2, sayfa: "b")
        k.sayfaDegisti()
        XCTAssertTrue(k.izleyenler.isEmpty)
        XCTAssertNil(k.sayfa)
        k.istek("izle", 3, sayfa: "b")               // ayrilan sayfa geri gelmez
        XCTAssertTrue(k.izleyenler.isEmpty)
    }

    func testOlcuDonusumu() {
        let j = KonumKoprusu.js(nokta(10, yukseklik: -1))
        let c = j["coords"] as! [String: Any]
        XCTAssertEqual(c["latitude"] as? Double, 41.0)
        XCTAssertEqual(c["accuracy"] as? Double, 5)
        XCTAssertTrue(c["altitude"] is NSNull, "geçersiz yükseklik sıfır değil, null")
        XCTAssertTrue(c["heading"] is NSNull)
        XCTAssertEqual(c["speed"] as? Double, 2.8)
        XCTAssertEqual(j["timestamp"] as? Double, (1_790_000_010.0 * 1000).rounded())
    }

    func testArkaPlandaBirikirOneGelinceBosalir() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        k.arkayaGitti()
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1), nokta(2), nokta(3, dogruluk: -1)])
        XCTAssertEqual(k.tampon.count, 2, "geçersiz nokta (doğruluk < 0) alınmaz")
        k.oneGeldi()
        XCTAssertTrue(k.tampon.isEmpty)
        XCTAssertTrue(k.onPlanda)
    }

    // MARK: - asama 2b: diskteki tampon

    func testKaliciTamponDiskteKalirYazilaniSiler() throws {
        let t = geciciTampon()
        t.ekle([KonumKoprusu.js(nokta(1)), KonumKoprusu.js(nokta(2))])
        t.ekle([KonumKoprusu.js(nokta(3))])
        XCTAssertEqual(KaliciTampon(dosya: t.dosya).noktalar.count, 3, "uygulama yeniden açılınca noktalar diskte")
        t.yazildi(ms(2))
        XCTAssertEqual(t.noktalar.count, 1)
        XCTAssertEqual(KaliciTampon(dosya: t.dosya).noktalar.count, 1, "yazılan kısım diskten de silinir")

        // Uygulama yazarken kapandi: son satir yarim. Okunurken atlanir,
        // sonraki ekleme ona yapismaz.
        let h = try FileHandle(forWritingTo: t.dosya)
        try h.seekToEnd()
        try h.write(contentsOf: Data("{\"coords\":{\"lat".utf8))
        try h.close()
        XCTAssertEqual(KaliciTampon(dosya: t.dosya).noktalar.count, 1, "yarım satır atlanır")
        t.ekle([KonumKoprusu.js(nokta(4))])
        XCTAssertEqual(KaliciTampon(dosya: t.dosya).noktalar.count, 2, "yarım satırdan sonra eklenen kaybolmaz")

        t.temizle()
        XCTAssertFalse(FileManager.default.fileExists(atPath: t.dosya.path))
        XCTAssertTrue(KaliciTampon(dosya: t.dosya).noktalar.isEmpty)
    }

    func testKaliciTamponSinirindaEnEskiDuser() {
        let t = geciciTampon(sinir: 3)
        t.ekle((1...5).map { KonumKoprusu.js(nokta(Double($0))) })
        XCTAssertEqual(t.noktalar.compactMap(KaliciTampon.zaman), [ms(3), ms(4), ms(5)])
        XCTAssertEqual(KaliciTampon(dosya: t.dosya).noktalar.count, 3)
    }

    func testIzlenenNoktaDiskeYazilirSayfaYazdiginiSoyleyinceSilinir() {
        let k = yeniKopru()
        k.istek("tek", 1, sayfa: "a")
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1)])
        XCTAssertTrue(k.kalici.noktalar.isEmpty, "tek konum isteği (izleme yok) diske yazılmaz")
        k.istek("izle", 2, sayfa: "a")
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(2), nokta(3), nokta(4)])
        XCTAssertEqual(k.kalici.noktalar.count, 3)
        k.istek("yazildi", 0, sayfa: "a", t: ms(3))
        XCTAssertEqual(k.kalici.noktalar.compactMap(KaliciTampon.zaman), [ms(4)])
        k.istek("birak", 2, sayfa: "a")                // sayfa izlemeyi bıraktı (duraklat, sil)
        XCTAssertTrue(k.kalici.noktalar.isEmpty)
        XCTAssertFalse(k.gpsIstendi)
    }

    func testBitenSayfaninYazdimBildirimiDeGecerli() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1), nokta(2)])
        k.sayfaDegisti()                                // modül geçişi; pagehide yazımı sonra gelir
        XCTAssertEqual(k.kalici.noktalar.count, 2, "sayfa değişti diye noktalar silinmez")
        k.istek("yazildi", 0, sayfa: "a", t: ms(2))
        XCTAssertTrue(k.kalici.noktalar.isEmpty)
    }

    /// Kok neden (asama 2b): web sureci olunce yeniden yukleme sayfaDegisti'yi
    /// cagiriyordu → tampon silinir, GPS durur; kosunun kalani kaydedilmezdi.
    func testWebSureciOlurseGPSDurmazYeniSayfaKaydiSahiplenir() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        k.arkayaGitti()
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1), nokta(2)])
        k.sayfaOldu()
        XCTAssertTrue(k.sahipsiz)
        XCTAssertTrue(k.gpsIstendi, "web süreci öldü diye GPS durmaz")
        k.sayfaDegisti()                                // ölen sayfanın yeniden yüklenmesi
        XCTAssertTrue(k.sahipsiz)
        XCTAssertTrue(k.gpsIstendi)
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(3)])
        XCTAssertEqual(k.kalici.noktalar.count, 3, "sayfa yokken de diske")
        XCTAssertTrue(k.tampon.isEmpty, "izleyen yok: sayfaya gidecek bir şey birikmez")

        k.istek("kurtar", 1, sayfa: "b", devam: true)
        XCTAssertTrue(k.sahipsiz, "izleme gelene dek sahipsiz")
        k.istek("izle", 2, sayfa: "b")
        XCTAssertFalse(k.sahipsiz)
        XCTAssertEqual(k.izleyenler, [2])
        XCTAssertEqual(k.tampon.count, 3, "arka plandaysa noktalar öne gelince sayfaya gider")
        k.istek("yazildi", 0, sayfa: "b", t: ms(3))
        XCTAssertTrue(k.kalici.noktalar.isEmpty)
    }

    func testSahipsizKayitYarimKaydiOlmayanSayfadaDurur() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1)])
        k.sayfaOldu()
        k.sayfaDegisti()
        k.istek("kurtar", 1, sayfa: "b", devam: false)
        XCTAssertFalse(k.sahipsiz)
        XCTAssertFalse(k.gpsIstendi)
        XCTAssertEqual(k.kalici.noktalar.count, 1, "noktalar silinmez; sahibi sonra ister")
    }

    func testOlumdenSonrakiIkinciGezintiSahipsizligiBitirir() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        k.sayfaOldu()
        k.sayfaDegisti()                                // yeniden yükleme
        k.sayfaDegisti()                                // kullanıcı başka modüle geçti
        XCTAssertFalse(k.sahipsiz)
        XCTAssertFalse(k.gpsIstendi)
    }

    func testIzleyenYokkenWebSureciOlurseGPSDurur() {
        let k = yeniKopru()
        k.istek("tek", 1, sayfa: "a")
        k.sayfaOldu()
        XCTAssertFalse(k.sahipsiz)
        XCTAssertFalse(k.gpsIstendi)
    }

    /// Kullanici (2026-10-05): «direk konum gelmiyor», Ayarlar › LifeOS'ta Konum
    /// satiri yok. Kopru durumunu soyler: izin soruldu mu, kac konum geldi.
    func testDurumIzinIsteginiVeGelenKonumuSoyler() {
        let k = yeniKopru()
        XCTAssertFalse(k.izinIstendi)
        let ilk = k.durumSozlugu(servis: true)
        XCTAssertEqual(ilk["gelen"] as? Int, 0)
        XCTAssertEqual(ilk["servis"] as? Bool, true)
        XCTAssertNotNil(ilk["kesin"] as? Bool)
        let soruldu = k.yonetici.authorizationStatus == .notDetermined
        k.istek("izle", 1, sayfa: "a")
        if soruldu {
            XCTAssertTrue(k.izinIstendi, "izin hiç istenmedi")
            XCTAssertEqual(k.durumSozlugu(servis: nil)["izin"] as? String, "soruluyor")
            XCTAssertEqual(k.durumSozlugu(servis: nil)["gps"] as? Bool, false)
        }
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1), nokta(2, dogruluk: -1)])
        XCTAssertEqual(k.durumSozlugu(servis: nil)["gelen"] as? Int, 2, "geçersiz konum da sayılır: GPS cevap veriyor demektir")
        k.istek("birak", 1, sayfa: "a")
        XCTAssertEqual(k.gelen, 0)
    }

    func testUygulamaYenidenAcilincaNoktalarDiskten() {
        let k = yeniKopru()
        k.istek("izle", 1, sayfa: "a")
        k.arkayaGitti()
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1), nokta(2)])
        let yeni = KonumKoprusu(kalici: KaliciTampon(dosya: k.kalici.dosya))   // uygulama kapandı, açıldı
        XCTAssertEqual(yeni.kalici.noktalar.count, 2)
        XCTAssertFalse(yeni.sahipsiz, "kapanmış uygulamada GPS sürmüyordu")
    }

    // MARK: - uctan uca: gercek kabuk, SPI sayfasi

    private func bekle(_ w: WKWebView, _ ifade: String, sure: TimeInterval = 60) -> Any? {
        jsBekle(w, ifade, sure: sure)
    }

    private func calistir(_ w: WKWebView, _ betik: String) {
        jsCalistir(w, betik)
    }

    private func kabuk(kalici: KaliciTampon? = nil) throws -> KabukDenetleyici {
        let d = KabukDenetleyici(kopru: KonumKoprusu(kalici: kalici ?? geciciTampon()))
        let p = UIWindow(frame: UIScreen.main.bounds)
        p.rootViewController = d
        p.makeKeyAndVisible()
        d.loadViewIfNeeded()
        d.web.load(URLRequest(url: URL(string: "http://127.0.0.1:4183/")!))   // giristen SPI'ye
        XCTAssertEqual(bekle(d.web, "!!(document.querySelector('.site') && window.SP && window.SP.Canli)") as? Bool, true, "SPİ açılmadı")
        return d
    }

    func testSayfaYerelKonumaBagliVeNoktalarSirayla() throws {
        let d = try kabuk()
        XCTAssertEqual(bekle(d.web, "window.LIFEOS_YEREL && window.LIFEOS_YEREL.konum === 'arka-plan' && window.__lifeosKonum.yerel === true", sure: 5) as? Bool, true)
        calistir(d.web, "window.__t = []; navigator.geolocation.watchPosition(function(p){ __t.push(p.timestamp); });")
        let son = Date().addingTimeInterval(5)
        while d.kopru.izleyenler.isEmpty && Date() < son { RunLoop.current.run(until: Date().addingTimeInterval(0.1)) }
        XCTAssertFalse(d.kopru.izleyenler.isEmpty, "watchPosition köprüye ulaşmadı")

        d.kopru.locationManager(d.kopru.yonetici, didUpdateLocations: [nokta(1), nokta(2)])
        XCTAssertEqual(bekle(d.web, "__t.length === 2", sure: 5) as? Bool, true)

        d.kopru.arkayaGitti()
        d.kopru.locationManager(d.kopru.yonetici, didUpdateLocations: [nokta(3), nokta(4), nokta(5)])
        XCTAssertEqual(bekle(d.web, "__t.length === 2", sure: 1) as? Bool, true, "arka planda sayfaya gitmemeli, birikmeli")
        d.kopru.oneGeldi()
        XCTAssertEqual(bekle(d.web, "__t.length === 5 && __t.every(function(t, i){ return i === 0 || t > __t[i - 1]; })", sure: 5) as? Bool, true,
                       "öne gelince biriken noktalar sırayla gelmeli")
    }

    /// SPI'nin canli kaydi yerel konumla calisir; ekran kilidi istemez.
    func testCanliKayitYerelKonumlaRotaCizer() throws {
        let d = try kabuk()
        calistir(d.web, "SP.Canli.sil && SP.Canli.sil(); window.__b = SP.Canli.baslat('kosu');")
        XCTAssertEqual(bekle(d.web, "!!(__b && __b.ok !== false && SP.Canli.durum() && SP.Canli.durum().hal === 'kayitta')", sure: 5) as? Bool, true, "kayıt başlamadı")
        let son = Date().addingTimeInterval(5)
        while d.kopru.izleyenler.isEmpty && Date() < son { RunLoop.current.run(until: Date().addingTimeInterval(0.1)) }
        // Kopru durumunu sayfaya bildirir; SPI onu okur (beklemenin nedeni).
        // Konum Servisleri bilgisi sonra gelir (yavas soru): sart degil.
        XCTAssertEqual(bekle(d.web, "!!(window.__lifeosKonum.durum() && typeof window.__lifeosKonum.durum().izin === 'string'"
            + " && ('bekleme' in SP.Canli.durum()))", sure: 10) as? Bool, true,
            "köprünün konum durumu sayfaya ulaşmadı")
        let simdi = Date().timeIntervalSince1970 - 1_790_000_000
        d.kopru.arkayaGitti()                          // ekran kapali: noktalar birikir
        d.kopru.locationManager(d.kopru.yonetici, didUpdateLocations:
            (0..<30).map { nokta(simdi - 120 + Double($0) * 4, lat: 41.0 + Double($0) * 0.0001) })
        d.kopru.oneGeldi()
        XCTAssertEqual(bekle(d.web, "SP.Canli.durum().nokta >= 10", sure: 10) as? Bool, true, "noktalar rotaya girmedi")
        XCTAssertEqual(bekle(d.web, "SP.Canli.durum().ekran === 'arka-plan'", sure: 2) as? Bool, true, "uygulamada ekran kilidi istenmemeli")
        calistir(d.web, "SP.Canli.sil();")
    }

    /// Kayit baslar, ekran kapanir, noktalar telefonda birikir (sayfaya gitmez).
    private func ekranKapaliKos(_ d: KabukDenetleyici, nokta n: Int) {
        calistir(d.web, "SP.Canli.sil && SP.Canli.sil(); window.__b = SP.Canli.baslat('kosu');")
        XCTAssertEqual(bekle(d.web, "!!(__b && __b.ok !== false && SP.Canli.durum() && SP.Canli.durum().hal === 'kayitta')", sure: 5) as? Bool, true, "kayıt başlamadı")
        let son = Date().addingTimeInterval(5)
        while d.kopru.izleyenler.isEmpty && Date() < son { RunLoop.current.run(until: Date().addingTimeInterval(0.1)) }
        XCTAssertFalse(d.kopru.izleyenler.isEmpty, "watchPosition köprüye ulaşmadı")
        let simdi = Date().timeIntervalSince1970 - 1_790_000_000
        d.kopru.arkayaGitti()
        d.kopru.locationManager(d.kopru.yonetici, didUpdateLocations:
            (0..<n).map { nokta(simdi + 1 + Double($0) * 4, lat: 41.0 + Double($0) * 0.0001) })
        XCTAssertEqual(d.kopru.kalici.noktalar.count, n, "noktalar diske yazılmadı")
    }

    private func diskBosalsin(_ k: KonumKoprusu, sure: TimeInterval = 10) -> Bool {
        let son = Date().addingTimeInterval(sure)
        while !k.kalici.noktalar.isEmpty && Date() < son { RunLoop.current.run(until: Date().addingTimeInterval(0.1)) }
        return k.kalici.noktalar.isEmpty
    }

    /// Asama 2b: iOS web surecini oldurur, uygulama yasar. Kayit durmaz;
    /// yeniden acilan sayfa ekran kapali kismi alir ve kaldigi yerden surer.
    func testWebSureciOlunceKayitKaldigiYerdenSurer() throws {
        let d = try kabuk()
        ekranKapaliKos(d, nokta: 30)
        calistir(d.web, "window.__eski = true;")
        d.webViewWebContentProcessDidTerminate(d.web)
        XCTAssertTrue(d.kopru.sahipsiz)
        XCTAssertEqual(bekle(d.web, "!window.__eski && !!(window.SP && SP.Canli && SP.Canli.durum()) && SP.Canli.durum().hal === 'kayitta' && SP.Canli.durum().nokta === 30", sure: 60) as? Bool, true,
                       "yeniden açılan sayfa kaydı sürdürmedi ya da ekran kapalı kısım gelmedi")
        XCTAssertFalse(d.kopru.sahipsiz, "sayfa kaydı sahiplenmedi")
        XCTAssertFalse(d.kopru.izleyenler.isEmpty)
        XCTAssertEqual(bekle(d.web, "SP.Canli.durum().ekran === 'arka-plan' && !SP.Canli.durum().geriGeldi", sure: 2) as? Bool, true)
        XCTAssertTrue(diskBosalsin(d.kopru), "sayfa yazdığını bildirmedi; disk boşalmadı")
        d.kopru.oneGeldi()
        XCTAssertEqual(bekle(d.web, "SP.Canli.durum().nokta === 30", sure: 2) as? Bool, true, "aynı nokta ikinci kez girmemeli")
        calistir(d.web, "SP.Canli.sil();")
    }

    /// Asama 2b: uygulama kapanir (ya da iOS kapatir). Noktalar diskte kalir;
    /// yeniden acilinca kayda eklenir, kayit duraklatilmis gelir.
    func testUygulamaKapanincaNoktalarKaybolmazKayitDuraklatilmisGelir() throws {
        let d = try kabuk()
        ekranKapaliKos(d, nokta: 30)
        let dosya = d.kopru.kalici.dosya
        d.web.load(URLRequest(url: URL(string: "about:blank")!))      // sayfa da köprü de gider; disk kalır
        XCTAssertEqual(bekle(d.web, "location.href === 'about:blank'", sure: 10) as? Bool, true)
        XCTAssertEqual(KaliciTampon(dosya: dosya).noktalar.count, 30)

        let yeni = try kabuk(kalici: KaliciTampon(dosya: dosya))
        XCTAssertEqual(bekle(yeni.web, "SP.Canli.durum() && SP.Canli.durum().hal === 'duraklat' && SP.Canli.durum().geriGeldi && SP.Canli.durum().nokta === 30", sure: 60) as? Bool, true,
                       "ekran kapalı kısım kayda eklenmedi")
        XCTAssertTrue(yeni.kopru.izleyenler.isEmpty, "kapanmış kayıt kendiliğinden sürmemeli")
        XCTAssertTrue(diskBosalsin(yeni.kopru))
        calistir(yeni.web, "SP.Canli.sil();")
    }
}
