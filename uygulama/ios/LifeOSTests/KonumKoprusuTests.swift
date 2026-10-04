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

    // MARK: - saf

    func testIzleBirakVeSayfaKimligi() {
        let k = KonumKoprusu()
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
        let k = KonumKoprusu()
        k.istek("izle", 1, sayfa: "a")
        k.arkayaGitti()
        k.locationManager(k.yonetici, didUpdateLocations: [nokta(1), nokta(2), nokta(3, dogruluk: -1)])
        XCTAssertEqual(k.tampon.count, 2, "geçersiz nokta (doğruluk < 0) alınmaz")
        k.oneGeldi()
        XCTAssertTrue(k.tampon.isEmpty)
        XCTAssertTrue(k.onPlanda)
    }

    // MARK: - uctan uca: gercek kabuk, SPI sayfasi

    private func bekle(_ w: WKWebView, _ ifade: String, sure: TimeInterval = 60) -> Any? {
        jsBekle(w, ifade, sure: sure)
    }

    private func calistir(_ w: WKWebView, _ betik: String) {
        jsCalistir(w, betik)
    }

    private func kabuk() throws -> KabukDenetleyici {
        let d = KabukDenetleyici()
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
        let simdi = Date().timeIntervalSince1970 - 1_790_000_000
        d.kopru.arkayaGitti()                          // ekran kapali: noktalar birikir
        d.kopru.locationManager(d.kopru.yonetici, didUpdateLocations:
            (0..<30).map { nokta(simdi - 120 + Double($0) * 4, lat: 41.0 + Double($0) * 0.0001) })
        d.kopru.oneGeldi()
        XCTAssertEqual(bekle(d.web, "SP.Canli.durum().nokta >= 10", sure: 10) as? Bool, true, "noktalar rotaya girmedi")
        XCTAssertEqual(bekle(d.web, "SP.Canli.durum().ekran === 'arka-plan'", sure: 2) as? Bool, true, "uygulamada ekran kilidi istenmemeli")
        calistir(d.web, "SP.Canli.sil();")
    }
}
