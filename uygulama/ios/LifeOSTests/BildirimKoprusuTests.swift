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
    func bekleyenIstekler(_ tamam: @escaping ([UNNotificationRequest]) -> Void) {
        tamam(eklenen.filter { bekleyen.contains($0.identifier) })
    }
    func sil(_ kimlikler: [String]) { bekleyen.removeAll { kimlikler.contains($0) } }
    func ekle(_ istek: UNNotificationRequest) { eklenen.append(istek); bekleyen.append(istek.identifier) }
    var gelmis: [String] = []
    var simge = -1
    func gelmisler(_ tamam: @escaping ([String]) -> Void) { tamam(gelmis) }
    func gelmisSil(_ kimlikler: [String]) { gelmis.removeAll { kimlikler.contains($0) } }
    func rozet(_ n: Int) { simge = n }
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

    /// Soz 5: yalniz bu modulun gelmisleri kalkar; anahtar verildiyse yalniz onlar.
    func testGelmislerKalkar() {
        let m = SahteBildirimMerkezi()
        m.gelmis = ["lifeos.spi.a", "lifeos.spi.b", "lifeos.esp.a", "baska.uygulama"]
        m.bekleyen = ["lifeos.spi.c"]
        let k = BildirimKoprusu(merkez: m)
        var n = -1
        let bir = expectation(description: "anahtarli")
        k.kaldir(modul: "spi", anahtarlar: ["b", "yok"]) { n = $0; bir.fulfill() }
        wait(for: [bir], timeout: 5)
        XCTAssertEqual(n, 1)
        XCTAssertEqual(m.gelmis, ["lifeos.spi.a", "lifeos.esp.a", "baska.uygulama"])
        var cevap: [String: Any] = [:]
        let iki = expectation(description: "hepsi")
        k.isle(["tur": "kaldir"], modul: "spi") { cevap = $0; iki.fulfill() }
        wait(for: [iki], timeout: 5)
        XCTAssertEqual((cevap["kaldirilan"] as? Int), 1)
        XCTAssertEqual(m.gelmis, ["lifeos.esp.a", "baska.uygulama"])
        XCTAssertEqual(m.bekleyen, ["lifeos.spi.c"])                          // bekleyene dokunulmaz
    }

    /// Soz 6: her modul kendi sayisini soyler, simge toplami gosterir; sayi kalici.
    func testRozetToplam() {
        let ad = "lifeos-test-\(UUID().uuidString)"
        let depo = UserDefaults(suiteName: ad)!
        defer { depo.removePersistentDomain(forName: ad) }
        let m = SahteBildirimMerkezi()
        let k = BildirimKoprusu(merkez: m, depo: depo)
        XCTAssertEqual(k.rozet(modul: "spi", sayi: 2), 2)
        XCTAssertEqual(k.rozet(modul: "ays", sayi: 3), 5)
        XCTAssertEqual(k.rozet(modul: "spi", sayi: -7), 3)                    // eksi sayi 0
        XCTAssertEqual(m.simge, 3)
        // Yeni kopru ayni depoyu okur: ESP acilinca AYS'nin sayisi da sayilir.
        let k2 = BildirimKoprusu(merkez: m, depo: depo)
        var cevap: [String: Any] = [:]
        let bitti = expectation(description: "rozet")
        k2.isle(["tur": "rozet", "sayi": NSNumber(value: 1)], modul: "esp") { cevap = $0; bitti.fulfill() }
        wait(for: [bitti], timeout: 5)
        XCTAssertEqual(cevap["toplam"] as? Int, 4)
        XCTAssertEqual(m.simge, 4)
    }

    /// Soz 7: eylemli satir kategori alir; bilinmeyen baslik dugmesiz.
    func testDugmeKategorisi() {
        var x = satir("a", dk: 10)
        x["eylem"] = "Aldım"
        XCTAssertEqual(BildirimKoprusu.istek(x, modul: "spi", simdi: simdi)?.content.categoryIdentifier, "lifeos.eylem.0")
        x["eylem"] = "Uydurma"
        XCTAssertEqual(BildirimKoprusu.istek(x, modul: "spi", simdi: simdi)?.content.categoryIdentifier, "")
        let k = BildirimKoprusu.kategoriler()
        XCTAssertEqual(k.count, BildirimKoprusu.eylemler.count)
        XCTAssertTrue(k.allSatisfy { $0.actions.map { $0.identifier } == [BildirimKoprusu.isaretEylemi, BildirimKoprusu.erteleEylemi] })
        XCTAssertEqual(k.first { $0.identifier == "lifeos.eylem.1" }?.actions.first?.title, "İçtim")
    }

    /// Soz 7: «Aldım» kuyruga girer (ertelenmisten de, «~» duser), sayfa alir, yazinca siler.
    func testIsaretKuyrugu() {
        let ad = "lifeos-test-\(UUID().uuidString)"
        let depo = UserDefaults(suiteName: ad)!
        defer { depo.removePersistentDomain(forName: ad) }
        let k = BildirimKoprusu(merkez: SahteBildirimMerkezi(), depo: depo)
        let icerik = UNMutableNotificationContent()
        let r = UNNotificationRequest(identifier: "lifeos.spi.~2026-10-10|h1@08:00", content: icerik, trigger: nil)
        k.eylem(BildirimKoprusu.isaretEylemi, istek: r, modul: "spi", simdi: simdi)
        k.eylem(BildirimKoprusu.isaretEylemi, istek: r, modul: "spi", simdi: simdi)        // ayni isaret bir kez
        k.eylem(BildirimKoprusu.isaretEylemi, istek: r, modul: "esp", simdi: simdi)        // baska modulun kimligi: yok
        let l = k.isaretler(modul: "spi")
        XCTAssertEqual(l.count, 1)
        XCTAssertEqual(l.first?["anahtar"] as? String, "2026-10-10|h1@08:00")
        XCTAssertEqual((l.first?["zaman"] as? NSNumber)?.doubleValue, simdi.timeIntervalSince1970 * 1000)
        XCTAssertTrue(k.isaretler(modul: "esp").isEmpty)
        var cevap: [String: Any] = [:]
        let bitti = expectation(description: "isaretSil")
        k.isle(["tur": "isaretSil", "anahtarlar": ["2026-10-10|h1@08:00"]], modul: "spi") { cevap = $0; bitti.fulfill() }
        wait(for: [bitti], timeout: 5)
        XCTAssertEqual(cevap["silinen"] as? Int, 1)
        XCTAssertTrue(k.isaretler(modul: "spi").isEmpty)
    }

    /// Soz 7: ertele ayni icerigi 15 dk sonraya «~» ile kurar; «kur» silmez, «yapildi» siler.
    func testErteleVeYapildi() {
        let m = SahteBildirimMerkezi()
        let k = BildirimKoprusu(merkez: m)
        let icerik = UNMutableNotificationContent()
        icerik.title = "SPİ · 08:00"
        let r = UNNotificationRequest(identifier: "lifeos.spi.a", content: icerik, trigger: nil)
        k.eylem(BildirimKoprusu.erteleEylemi, istek: r, modul: "spi")
        XCTAssertEqual(m.bekleyen, ["lifeos.spi.~a"])
        XCTAssertEqual(m.eklenen.last?.content.title, "SPİ · 08:00")
        XCTAssertEqual((m.eklenen.last?.trigger as? UNTimeIntervalNotificationTrigger)?.timeInterval, 900)
        XCTAssertEqual(kur(k, "spi", [satir("b", dk: 30)]), 1)
        XCTAssertEqual(Set(m.bekleyen), ["lifeos.spi.~a", "lifeos.spi.b"])
        m.gelmis = ["lifeos.spi.a", "lifeos.spi.c"]
        k.yapildi(modul: "spi", anahtar: "a")
        XCTAssertEqual(m.bekleyen, ["lifeos.spi.b"])
        XCTAssertEqual(m.gelmis, ["lifeos.spi.c"])
    }

    /// Soz 8: liste yalniz bu modulun kurulularini saat sirasiyla verir; sil ertelenmisi de siler.
    func testListeVeSil() {
        let m = SahteBildirimMerkezi()
        let k = BildirimKoprusu(merkez: m)
        XCTAssertEqual(kur(k, "spi", [satir("b", dk: 60), satir("a", dk: 10)]), 2)
        XCTAssertEqual(kur(k, "esp", [satir("e", dk: 5)]), 1)
        let icerik = UNMutableNotificationContent()
        icerik.title = "SPİ · 08:00"
        k.eylem(BildirimKoprusu.erteleEylemi, istek: UNNotificationRequest(identifier: "lifeos.spi.b", content: icerik, trigger: nil), modul: "spi")
        var l: [[String: Any]] = []
        let bitti = expectation(description: "liste")
        k.isle(["tur": "liste"], modul: "spi") { v in l = v["liste"] as? [[String: Any]] ?? []; bitti.fulfill() }
        wait(for: [bitti], timeout: 5)
        // Ertelenmis gercek saatten 15 dk sonra; satirlar 2027'de: once ertelenmis gelir.
        XCTAssertEqual(l.map { $0["anahtar"] as? String ?? "" }, ["b", "a", "b"])
        XCTAssertEqual(l.map { $0["ertelendi"] as? Bool ?? false }, [true, false, false])
        XCTAssertEqual(l[1]["govde"] as? String, "Su")
        let iki = expectation(description: "sil")
        k.isle(["tur": "sil", "anahtarlar": ["b"]], modul: "spi") { _ in iki.fulfill() }
        wait(for: [iki], timeout: 5)
        XCTAssertEqual(Set(m.bekleyen), ["lifeos.spi.a", "lifeos.esp.e"])
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
        // Soz 5: sayfa acilinca bu modulun gelmisleri kalkar (oteki modulunkiler kalir).
        m.gelmis = ["lifeos.spi.eski", "lifeos.esp.eski"]
        jsCalistir(d.web, "window.__g = null; LIFEOS.BILDIRIM.kaldir().then(function(v){ window.__g = v.kaldirilan; })")
        XCTAssertEqual(jsBekle(d.web, "window.__g === 1", sure: 10) as? Bool, true, "gelmişler kalkmadı")
        XCTAssertEqual(m.gelmis, ["lifeos.esp.eski"])
        // Soz 6: Badging API kopruye bagli.
        XCTAssertEqual(jsBekle(d.web, "typeof navigator.setAppBadge === 'function'") as? Bool, true, "rozet bağlanmadı")
    }
}
