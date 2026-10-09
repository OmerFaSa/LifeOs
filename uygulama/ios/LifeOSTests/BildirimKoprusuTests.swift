// Bildirim koprusu: modul kapisindan bilinir, yalniz kendi bildirimlerine
// dokunur, gecmis zaman kurulmaz, ust sinir tutulur; gercek sayfadan
// (brand/ortak/bildirim.js) istek gider ve cevap doner. Sistem merkezi
// yerine sahtesi: simulatorde izin penceresi acilmaz.
import XCTest
import WebKit
import UserNotifications
@testable import LifeOS

final class SahteBildirimMerkezi: BildirimMerkezi {
    var durum = "izin"
    var bekleyen: [String] = []
    var eklenen: [UNNotificationRequest] = []
    var izinSoruldu = 0
    /// Kac kez «kur» geldi (her kur bekleyenleri bir kez sorar).
    var kurSayisi = 0

    func yetki(_ tamam: @escaping (String) -> Void) { tamam(durum) }
    func izinIste(_ tamam: @escaping (String) -> Void) { izinSoruldu += 1; tamam(durum) }
    func bekleyenler(_ tamam: @escaping ([String]) -> Void) { kurSayisi += 1; tamam(bekleyen) }
    func sil(_ kimlikler: [String]) { bekleyen.removeAll { kimlikler.contains($0) } }
    func ekle(_ istek: UNNotificationRequest) { eklenen.append(istek); bekleyen.append(istek.identifier) }
}

final class BildirimKoprusuTests: XCTestCase {
    private let simdi = Date(timeIntervalSince1970: 1_800_000_000)

    private func satir(_ a: String, dk: Double, baslik: String = "SPİ · 08:00") -> [String: Any] {
        ["anahtar": a, "baslik": baslik, "govde": "Su", "zaman": NSNumber(value: (simdi.timeIntervalSince1970 + dk * 60) * 1000)]
    }

    private func kur(_ k: BildirimKoprusu, _ modul: String, _ liste: [[String: Any]]) -> Int {
        var n = -1
        let bitti = expectation(description: "kur")
        k.kur(modul: modul, liste: liste, simdi: simdi) { n = $0; bitti.fulfill() }
        wait(for: [bitti], timeout: 5)
        return n
    }

    func testKapidanModul() {
        XCTAssertEqual(BildirimKoprusu.kapilar[4183], "spi")
        XCTAssertEqual(BildirimKoprusu.kapilar[4193], "esp")
        XCTAssertEqual(BildirimKoprusu.kapilar[4173], "ays")
        XCTAssertNil(BildirimKoprusu.kapilar[4180])                          // giris sayfasi bildirim kurmaz
        XCTAssertEqual(BildirimKoprusu.adres(modul: "esp")?.absoluteString, "http://127.0.0.1:4193/")
        XCTAssertLessThanOrEqual(BildirimKoprusu.sinir.values.reduce(0, +), 64)   // iOS siniri
    }

    func testYalnizKendiBildirimleriSilinirGecmisKurulmaz() {
        let m = SahteBildirimMerkezi()
        m.bekleyen = ["lifeos.spi.eski", "lifeos.esp.hatirlatici", "baska.uygulama"]
        let k = BildirimKoprusu(merkez: m)
        let n = kur(k, "spi", [satir("a", dk: 10), satir("gecmis", dk: -5), satir("b", dk: 60), ["anahtar": "eksik"]])
        XCTAssertEqual(n, 2)
        XCTAssertEqual(Set(m.bekleyen), ["lifeos.esp.hatirlatici", "baska.uygulama", "lifeos.spi.a", "lifeos.spi.b"])
        let ilk = m.eklenen[0]
        XCTAssertEqual(ilk.content.title, "SPİ · 08:00")
        XCTAssertEqual(ilk.content.body, "Su")
        XCTAssertEqual(ilk.content.userInfo["modul"] as? String, "spi")
        let t = try? XCTUnwrap(ilk.trigger as? UNCalendarNotificationTrigger)
        XCTAssertEqual(t?.repeats, false)
        XCTAssertEqual(t?.nextTriggerDate().map { Int($0.timeIntervalSince1970) }, Int(simdi.timeIntervalSince1970) + 600)
        // Bos liste: bu modulun bekleyenleri gider, otekiler kalir.
        XCTAssertEqual(kur(k, "spi", []), 0)
        XCTAssertEqual(Set(m.bekleyen), ["lifeos.esp.hatirlatici", "baska.uygulama"])
    }

    func testUstSinir() {
        let m = SahteBildirimMerkezi()
        let k = BildirimKoprusu(merkez: m)
        let liste = (0..<50).map { satir("s\($0)", dk: Double($0 + 1)) }
        XCTAssertEqual(kur(k, "esp", liste), BildirimKoprusu.sinir["esp"])
    }

    func testDurumVeIzin() {
        let m = SahteBildirimMerkezi()
        m.durum = "red"
        let k = BildirimKoprusu(merkez: m)
        var cevap: [String: Any] = [:]
        let bitti = expectation(description: "izin")
        k.isle(["tur": "izin"], modul: "spi") { cevap = $0; bitti.fulfill() }
        wait(for: [bitti], timeout: 5)
        XCTAssertEqual(cevap["durum"] as? String, "red")
        XCTAssertEqual(m.izinSoruldu, 1)
        let bitti2 = expectation(description: "bilinmeyen")
        k.isle(["tur": "uydurma"], modul: "spi") { cevap = $0; bitti2.fulfill() }
        wait(for: [bitti2], timeout: 5)
        XCTAssertNotNil(cevap["hata"])
    }

    /// Gercek SPI sayfasi: bildirim.js koprüyü gorur, durum sorar, liste kurar;
    /// kimlikler sayfanin KAPISINDAN gelen modulun on ekini tasir.
    func testGercekSayfadanKurulur() throws {
        let m = SahteBildirimMerkezi()
        let d = KabukDenetleyici(bildirim: BildirimKoprusu(merkez: m))
        let p = UIWindow(frame: UIScreen.main.bounds)
        p.rootViewController = d
        p.makeKeyAndVisible()
        d.loadViewIfNeeded()
        d.web.load(URLRequest(url: URL(string: "http://127.0.0.1:4183/")!))
        XCTAssertEqual(jsBekle(d.web, "!!(window.LIFEOS && window.LIFEOS.BILDIRIM && window.LIFEOS.BILDIRIM.var())") as? Bool, true,
                       "bildirim.js köprüyü görmedi")
        // SPI acilista izni sorar ve kendi listesini kurar (bildirim kapali: bos
        // liste). Testin kurdugunu sonradan silmesin diye once o beklenir.
        XCTAssertEqual(jsBekle(d.web, "!!(document.querySelector('.site') && window.SP && SP.S && SP.S.hatirlat)") as? Bool, true,
                       "SPİ açılmadı")
        let son = Date().addingTimeInterval(15)
        while m.kurSayisi < 1 && Date() < son { RunLoop.current.run(until: Date().addingTimeInterval(0.1)) }
        XCTAssertGreaterThanOrEqual(m.kurSayisi, 1, "SPİ açılışta bildirimlerini kurmadı")
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        jsCalistir(d.web, "window.__d = null; LIFEOS.BILDIRIM.durum().then(function(v){ window.__d = v; })")
        XCTAssertEqual(jsBekle(d.web, "window.__d === 'izin'", sure: 10) as? Bool, true, "durum cevabı gelmedi")
        jsCalistir(d.web, "window.__k = null; LIFEOS.BILDIRIM.kur('esp', [{ anahtar:'x', baslik:'SPİ · 08:00', govde:'Su', zaman:Date.now() + 3600000 }]).then(function(v){ window.__k = v.kurulan; })")
        XCTAssertEqual(jsBekle(d.web, "window.__k === 1", sure: 10) as? Bool, true, "kurulmadı")
        // Sayfa «esp» dese de SPI kapisindan geldi: spi on eki.
        XCTAssertEqual(m.bekleyen, ["lifeos.spi.x"])
    }
}
