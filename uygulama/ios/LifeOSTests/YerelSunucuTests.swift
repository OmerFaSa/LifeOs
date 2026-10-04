// Yerel sunucu: gercek HTTP istekleriyle (bos bir kapida) ve saf islevlerle.
import XCTest
@testable import LifeOS

final class YerelSunucuTests: XCTestCase {
    private var kok: URL!
    private var sunucu: YerelSunucu!
    private let video = Data((0..<1000).map { UInt8($0 % 256) })

    override func setUpWithError() throws {
        kok = FileManager.default.temporaryDirectory.appendingPathComponent("lifeos-test-" + UUID().uuidString)
        let fm = FileManager.default
        try fm.createDirectory(at: kok.appendingPathComponent("SPI/img/brand"), withIntermediateDirectories: true)
        try fm.createDirectory(at: kok.appendingPathComponent("ortak/seviye"), withIntermediateDirectories: true)
        try Data("<!doctype html><title>SPİ</title>".utf8).write(to: kok.appendingPathComponent("SPI/spi.html"))
        try Data("self.addEventListener('fetch',()=>{})".utf8).write(to: kok.appendingPathComponent("SPI/sw.js"))
        try Data([0x89, 0x50, 0x4E, 0x47]).write(to: kok.appendingPathComponent("SPI/img/brand/favicon.png"))
        try Data("gizli".utf8).write(to: kok.appendingPathComponent("SPI/.gizli"))
        try Data("disarida".utf8).write(to: kok.appendingPathComponent("disarida.txt"))
        try video.write(to: kok.appendingPathComponent("ortak/seviye/kademe.mp4"))
        sunucu = YerelSunucu(modul: .init(ad: "SPI", kapi: 0, klasor: kok.appendingPathComponent("SPI"), sayfa: "spi.html"),
                             ortak: kok.appendingPathComponent("ortak"))
        try sunucu.baslat(kapi: 0)
        XCTAssertNotEqual(sunucu.kapi, 0)
    }

    override func tearDownWithError() throws {
        sunucu.durdur()
        try? FileManager.default.removeItem(at: kok)
    }

    private func al(_ yol: String, yontem: String = "GET", basliklar: [String: String] = [:]) throws
        -> (kod: Int, baslik: [AnyHashable: Any], govde: Data) {
        var r = URLRequest(url: URL(string: "http://127.0.0.1:\(sunucu.kapi)\(yol)")!)
        r.httpMethod = yontem
        r.cachePolicy = .reloadIgnoringLocalCacheData
        basliklar.forEach { r.setValue($0.value, forHTTPHeaderField: $0.key) }
        let bitti = expectation(description: yol)
        var sonuc: (Int, [AnyHashable: Any], Data)?
        URLSession(configuration: .ephemeral).dataTask(with: r) { veri, yanit, _ in
            if let h = yanit as? HTTPURLResponse { sonuc = (h.statusCode, h.allHeaderFields, veri ?? Data()) }
            bitti.fulfill()
        }.resume()
        wait(for: [bitti], timeout: 10)
        let s = try XCTUnwrap(sonuc, "yanit yok: \(yol)")
        return (s.0, s.1, s.2)
    }

    private func baslik(_ h: [AnyHashable: Any], _ ad: String) -> String? {
        h.first { ($0.key as? String)?.lowercased() == ad.lowercased() }?.value as? String
    }

    func testKokModulSayfasiniVerir() throws {
        let r = try al("/")
        XCTAssertEqual(r.kod, 200)
        XCTAssertEqual(baslik(r.baslik, "Content-Type"), "text/html; charset=utf-8")
        XCTAssertTrue(String(decoding: r.govde, as: UTF8.self).contains("SPİ"))
        XCTAssertTrue((baslik(r.baslik, "Cache-Control") ?? "").contains("no-store"))
        XCTAssertEqual(try al("/index.html?x=1#y").kod, 200)
    }

    func testServiceWorkerJavascriptOlarakGelir() throws {
        let r = try al("/sw.js")
        XCTAssertEqual(r.kod, 200)
        XCTAssertEqual(baslik(r.baslik, "Content-Type"), "application/javascript; charset=utf-8")
    }

    func testModulGorseliVeOrtakVideo() throws {
        XCTAssertEqual(try al("/img/brand/favicon.png").kod, 200)
        let v = try al("/img/seviye/kademe.mp4")
        XCTAssertEqual(v.kod, 200)
        XCTAssertEqual(v.govde, video)
        XCTAssertEqual(baslik(v.baslik, "Content-Type"), "video/mp4")
    }

    func testParcaIstegi206() throws {
        let r = try al("/img/seviye/kademe.mp4", basliklar: ["Range": "bytes=10-19"])
        XCTAssertEqual(r.kod, 206)
        XCTAssertEqual(r.govde, video.subdata(in: 10..<20))
        XCTAssertEqual(baslik(r.baslik, "Content-Range"), "bytes 10-19/1000")
        let son = try al("/img/seviye/kademe.mp4", basliklar: ["Range": "bytes=-5"])
        XCTAssertEqual(son.govde, video.subdata(in: 995..<1000))
    }

    func testOlmayanGizliVeYontem() throws {
        XCTAssertEqual(try al("/yok.js").kod, 404)
        XCTAssertEqual(try al("/.gizli").kod, 404)
        XCTAssertEqual(try al("/img/").kod, 404)
        XCTAssertEqual(try al("/", yontem: "POST").kod, 405)
        let h = try al("/", yontem: "HEAD")
        XCTAssertEqual(h.kod, 200)
        XCTAssertTrue(h.govde.isEmpty)
    }

    /// URLSession «..» parcasini kendisi cozer; kokun disi saf islevle sinanir.
    func testKokunDisinaCikilmaz() {
        XCTAssertNil(sunucu.cozumle("/../disarida.txt"))
        XCTAssertNil(sunucu.cozumle("/%2e%2e/disarida.txt"))
        XCTAssertNil(sunucu.cozumle("/img/seviye/../../disarida.txt"))
        XCTAssertNil(sunucu.cozumle("/img/brand/..%2F..%2F..%2Fdisarida.txt"))
        XCTAssertNil(sunucu.cozumle("\\disarida.txt"))
        XCTAssertNil(sunucu.cozumle("/.gizli"))
        XCTAssertNotNil(sunucu.cozumle("/img/seviye/kademe.mp4"))
    }

    private func ayni(_ deger: String, _ bas: Int64, _ son: Int64, file: StaticString = #filePath, line: UInt = #line) {
        let a = YerelSunucu.aralik(deger, boyut: 10)
        XCTAssertEqual(a?.bas, bas, deger, file: file, line: line)
        XCTAssertEqual(a?.son, son, deger, file: file, line: line)
    }

    func testAralikCozumu() {
        ayni("bytes=0-1", 0, 1)
        ayni("bytes=5-", 5, 9)
        ayni("bytes=-3", 7, 9)
        ayni("bytes=8-99", 8, 9)
        XCTAssertNil(YerelSunucu.aralik("bytes=10-", boyut: 10))
        XCTAssertNil(YerelSunucu.aralik("bytes=5-2", boyut: 10))
        XCTAssertNil(YerelSunucu.aralik("bytes=0-1,4-5", boyut: 10))
        XCTAssertNil(YerelSunucu.aralik("items=0-1", boyut: 10))
    }

    func testKapiTablosuKabukIleAyni() {
        // brand/ortak/kabuk.js MODULLER: ays 4173, spi 4183, esp 4193
        XCTAssertEqual(YerelSunucu.tablo.map { $0.kapi }, [4173, 4183, 4193])
        XCTAssertEqual(YerelSunucu.giris.kapi, 4180)          // sistem/sunucu.py GIRIS_PORT
    }
}
