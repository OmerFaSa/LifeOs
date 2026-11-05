// PC'siz web guncellemesi: gercek dosya sistemi, sahte indirme (ag yok).
import XCTest
@testable import LifeOS

final class WebGuncellemeTests: XCTestCase {
    private var kok: URL!
    private var sunucular: [URL: Data] = [:]
    private var istekler: [String] = []

    override func setUpWithError() throws {
        kok = FileManager.default.temporaryDirectory.appendingPathComponent("lifeos-web-" + UUID().uuidString)
        sunucular = [:]
        istekler = []
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: kok)
    }

    private func g(temel: [String: String] = [:], temelSurum: Int = 10, uyum: Int = 1) -> WebGuncelleme {
        WebGuncelleme(kok: kok, temel: temel, temelSurum: temelSurum, uyum: uyum, indir: { [unowned self] u in
            self.istekler.append(u.lastPathComponent)
            guard let d = self.sunucular[u] else { throw URLError(.notConnectedToInternet) }
            return d
        })
    }

    /// Paketi koyar: web_paket.py'nin yaptiginin aynisi (z'siz).
    private func yayinla(surum: Int, uyum: Int = 1, _ dosyalar: [String: Data]) throws {
        var l: [[String: Any]] = []
        for (yol, veri) in dosyalar {
            let s = WebGuncelleme.sha256(veri)
            l.append(["yol": yol, "sha256": s, "boyut": veri.count, "z": false])
            sunucular[WebGuncelleme.adres.appendingPathComponent("w-" + String(s.prefix(16)))] = veri
        }
        sunucular[WebGuncelleme.adres.appendingPathComponent("web-surum.json")] =
            try JSONSerialization.data(withJSONObject: ["surum": surum, "uyum": uyum, "dosyalar": l])
    }

    func testYalnizFarkliDosyalarInerVeGecilir() async throws {
        let ayni = Data("ayni".utf8), yeni = Data("yeni".utf8)
        try yayinla(surum: 11, ["AYS/rota.html": yeni, "ortak/seviye/a.mp4": ayni])
        let w = g(temel: ["ortak/seviye/a.mp4": WebGuncelleme.sha256(ayni)])
        let gecti = try await w.denetle()
        XCTAssertTrue(gecti)
        XCTAssertEqual(istekler.count, 2)                                   // liste + tek dosya
        XCTAssertEqual(try Data(contentsOf: try XCTUnwrap(w.dosya("AYS/rota.html"))), yeni)
        XCTAssertEqual(w.dosya("AYS/rota.html")?.pathExtension, "html")     // sunucu turu uzantidan bilir
        XCTAssertNil(w.dosya("ortak/seviye/a.mp4"))                         // uygulamadaki kullanilir
        XCTAssertEqual(g().simdiki.surum, 11)                               // diske yazildi
    }

    func testBozukDosyaSurumuDegistirmezAgaBaglananlarKalir() async throws {
        let iyi = Data("iyi".utf8), kotu = Data("kotu".utf8)
        try yayinla(surum: 11, ["a.html": iyi, "b.html": kotu])
        sunucular[WebGuncelleme.adres.appendingPathComponent("w-" + String(WebGuncelleme.sha256(kotu).prefix(16)))] = Data("degismis".utf8)
        let w = g()
        do { try await w.denetle(); XCTFail("kabul edilmemeliydi") } catch {}
        XCTAssertEqual(w.simdiki.surum, 0)
        XCTAssertNil(w.dosya("a.html"))
        // Duzeldi: dogrulanmis olan yeniden inmez.
        try yayinla(surum: 11, ["a.html": iyi, "b.html": kotu])
        let once = istekler.filter { $0.hasPrefix("w-") }.count
        let gecti = try await w.denetle()
        XCTAssertTrue(gecti)
        XCTAssertLessThanOrEqual(istekler.filter { $0.hasPrefix("w-") }.count - once, 2)
        XCTAssertNotNil(w.dosya("b.html"))
    }

    func testAgYoksaSessizEskiSurumCalisir() async throws {
        let w = g()
        do { try await w.denetle(); XCTFail("hata beklenirdi") } catch {}
        XCTAssertEqual(w.simdiki, WebGuncelleme.Durum())
    }

    func testUyumsuzVeEskiPaketAlinmaz() async throws {
        try yayinla(surum: 11, uyum: 2, ["a.html": Data("x".utf8)])
        var gecti = try await g().denetle()
        XCTAssertFalse(gecti)                                               // yeni kopru ister: AltStore bekler
        try yayinla(surum: 10, ["a.html": Data("x".utf8)])
        gecti = try await g().denetle()
        XCTAssertFalse(gecti)                                               // uygulamanin kendisi kadar yeni degil
    }

    func testBozukSurumIkiAcilistanSonraGeriAlinirVeAtlanir() async throws {
        try yayinla(surum: 11, ["a.html": Data("x".utf8)])
        let w = g()
        try await w.denetle()
        w.acilis(); w.acilis()
        XCTAssertEqual(w.simdiki.surum, 11)                                 // iki sans
        w.acilis()
        XCTAssertEqual(w.simdiki.surum, 0)
        XCTAssertNil(w.dosya("a.html"))
        let gecti = try await w.denetle()
        XCTAssertFalse(gecti)                                               // ayni surum yeniden denenmez
        try yayinla(surum: 12, ["a.html": Data("y".utf8)])
        let sonraki = try await w.denetle()
        XCTAssertTrue(sonraki)                                              // yenisi denenir
    }

    func testSayfaAyagaKalkincaSurumSaglamSayilir() async throws {
        try yayinla(surum: 11, ["a.html": Data("x".utf8)])
        let w = g()
        try await w.denetle()
        w.onayla()
        for _ in 0..<5 { w.acilis() }
        XCTAssertEqual(w.simdiki.surum, 11)
    }

    func testAltStoredanGelenYeniUygulamaKatmaniKaldirir() async throws {
        try yayinla(surum: 11, ["a.html": Data("x".utf8)])
        try await g().denetle()
        let w = g(temelSurum: 11)
        w.acilis()
        XCTAssertEqual(w.simdiki.surum, 0)
        XCTAssertNil(w.dosya("a.html"))
    }

    func testBozukListeReddedilir() async throws {
        sunucular[WebGuncelleme.adres.appendingPathComponent("web-surum.json")] =
            try JSONSerialization.data(withJSONObject: ["surum": 11, "uyum": 1, "dosyalar": [
                ["yol": "a.html", "sha256": "../../disari", "boyut": 1, "z": false]]])
        do { try await g().denetle(); XCTFail("kabul edilmemeliydi") } catch {}
        XCTAssertNil(g().dosya("a.html"))
    }

    /// Paket Python'da ham DEFLATE ile sikisir (web_paket.py); NSData .zlib bunu acmali.
    func testPythonDeflateAcilir() throws {
        let ham = try XCTUnwrap(Data(base64Encoded: "88lMS/UPVkg/vCcvOTUnJzU3tTjTSuHo/MPbKnNS9QA="))
        let acik = try (ham as NSData).decompressed(using: .zlib) as Data
        XCTAssertEqual(WebGuncelleme.sha256(acik), "b03b4886fb3958391f8d1aa49b2ef88d172aacab470afbe513b085965f967405")
    }

    /// Yerel sunucu once katmana bakar; olmayan uygulamadakine duser. Yol sozluk
    /// anahtari oldugundan disari cikis yoktur.
    func testYerelSunucuKatmaniOnceSorar() throws {
        let web = kok.appendingPathComponent("Web")
        let fm = FileManager.default
        try fm.createDirectory(at: web.appendingPathComponent("SPI"), withIntermediateDirectories: true)
        try fm.createDirectory(at: web.appendingPathComponent("ortak/seviye"), withIntermediateDirectories: true)
        try Data("eski".utf8).write(to: web.appendingPathComponent("SPI/spi.html"))
        try Data("eski".utf8).write(to: web.appendingPathComponent("SPI/sw.js"))
        try Data("v".utf8).write(to: web.appendingPathComponent("ortak/seviye/a.mp4"))
        let yeni = kok.appendingPathComponent("yeni.html")
        try Data("yeni".utf8).write(to: yeni)
        var sorulan: [String] = []
        let s = YerelSunucu(modul: .init(ad: "SPI", kapi: 0, klasor: web.appendingPathComponent("SPI"), sayfa: "spi.html"),
                            ortak: web.appendingPathComponent("ortak"),
                            katman: { sorulan.append($0); return $0 == "SPI/spi.html" ? yeni : nil })
        XCTAssertEqual(s.cozumle("/")?.path, yeni.path)
        XCTAssertTrue(s.cozumle("/sw.js")?.path.hasSuffix("SPI/sw.js") ?? false)
        XCTAssertTrue(s.cozumle("/img/seviye/a.mp4")?.path.hasSuffix("ortak/seviye/a.mp4") ?? false)
        XCTAssertEqual(sorulan, ["SPI/spi.html", "SPI/sw.js", "ortak/seviye/a.mp4"])
        XCTAssertNil(s.cozumle("/../disari"))
        XCTAssertNil(s.cozumle("/.gizli"))
    }

    func testBaglamaBaglantisiYalnizGecerliKoduAlir() {
        XCTAssertEqual(KabukDenetleyici.baglaAdresi(URL(string: "lifeos://bagla?adres=192.168.0.10&kod=123456")!)?.absoluteString,
                       "http://127.0.0.1:4180/?bagla=123456&adres=192.168.0.10")
        XCTAssertNil(KabukDenetleyici.baglaAdresi(URL(string: "lifeos://bagla?adres=192.168.0.10&kod=12x456")!))
        XCTAssertNil(KabukDenetleyici.baglaAdresi(URL(string: "lifeos://bagla?adres=a%22b&kod=123456")!))
        XCTAssertNil(KabukDenetleyici.baglaAdresi(URL(string: "lifeos://baska?kod=123456")!))
    }
}
