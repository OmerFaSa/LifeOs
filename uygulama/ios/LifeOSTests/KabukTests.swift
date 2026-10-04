// Kabuk: uygulamanin icindeki gercek sayfalar acilir mi, koken guvenli mi?
// Bu testler uygulamanin kendi yerel sunucusunu (4173/4183/4193) kullanir.
import XCTest
import WebKit
@testable import LifeOS

final class KabukTests: XCTestCase {

    func testIcerdeKurali() {
        XCTAssertTrue(KabukDenetleyici.icerde(URL(string: "http://127.0.0.1:4183/")!))
        XCTAssertTrue(KabukDenetleyici.icerde(URL(string: "http://127.0.0.1:4173/#lifeos=x")!))
        XCTAssertFalse(KabukDenetleyici.icerde(URL(string: "http://127.0.0.1:4200/")!))   // HKM telefonda yok
        XCTAssertFalse(KabukDenetleyici.icerde(URL(string: "https://127.0.0.1:4183/")!))
        XCTAssertFalse(KabukDenetleyici.icerde(URL(string: "http://ornek.com:4183/")!))
    }

    func testBaslangicSonModulVeVarsayilan() {
        let d = UserDefaults(suiteName: "lifeos-test-\(UUID().uuidString)")!
        XCTAssertEqual(KabukDenetleyici.baslangic(d).port, 4183)
        d.set(4193, forKey: KabukDenetleyici.sonKapiAnahtari)
        XCTAssertEqual(KabukDenetleyici.baslangic(d).port, 4193)
        d.set(4200, forKey: KabukDenetleyici.sonKapiAnahtari)
        XCTAssertEqual(KabukDenetleyici.baslangic(d).port, 4183)
    }

    /// Ortak gorseller (rutbe, marka) uygulamanin icinde ve uc kapidan da gelir.
    /// Ilk derlemede git'te olmadiklari icin sessizce disarida kalmislardi.
    func testOrtakGorsellerUygulamadaVeUcKapidanGelir() throws {
        let web = try XCTUnwrap(Bundle.main.url(forResource: "Web", withExtension: nil))
        for o in ["seviye", "marka"] {
            let dosyalar = (try? FileManager.default.contentsOfDirectory(atPath: web.appendingPathComponent("ortak/\(o)").path)) ?? []
            XCTAssertFalse(dosyalar.isEmpty, "uygulamada img/\(o) yok")
            guard let ad = dosyalar.sorted().first,
                  let kodlu = ad.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else { continue }
            for kapi in [4173, 4183, 4193] {
                let bitti = expectation(description: "\(o) \(kapi)")
                var kod = 0
                URLSession(configuration: .ephemeral).dataTask(with: URL(string: "http://127.0.0.1:\(kapi)/img/\(o)/\(kodlu)")!) { _, y, _ in
                    kod = (y as? HTTPURLResponse)?.statusCode ?? 0
                    bitti.fulfill()
                }.resume()
                wait(for: [bitti], timeout: 15)
                XCTAssertEqual(kod, 200, "img/\(o)/\(ad) \(kapi) kapısından gelmedi")
            }
        }
    }

    private func bekle(_ w: WKWebView, _ ifade: String, sure: TimeInterval = 60) -> Any? {
        jsBekle(w, ifade, sure: sure)
    }

    /// Uc modul uygulamanin icinde acilir; koken guvenli (kamera ve konum buna bagli).
    func testUcModulAcilirVeKokenGuvenli() throws {
        let uygulama = try XCTUnwrap(UIApplication.shared.delegate as? Uygulama)
        XCTAssertNil(uygulama.sunucular.hata, uygulama.sunucular.hata ?? "")
        let pencere = UIWindow(frame: UIScreen.main.bounds)
        for (ad, kapi, ns) in [("AYS", 4173, "R"), ("SPI", 4183, "SP"), ("ESP", 4193, "ESP")] {
            let w = WKWebView(frame: pencere.bounds, configuration: WKWebViewConfiguration())
            pencere.addSubview(w)
            pencere.makeKeyAndVisible()
            w.load(URLRequest(url: URL(string: "http://127.0.0.1:\(kapi)/")!))
            let acildi = bekle(w, "!!(document.querySelector('.site') && window.\(ns))")
            XCTAssertEqual(acildi as? Bool, true, "\(ad) açılmadı")
            let guvenli = bekle(w, "window.isSecureContext === true", sure: 5)
            XCTAssertEqual(guvenli as? Bool, true, "\(ad) güvenli köken değil: kamera ve konum çalışmaz")
            let konum = bekle(w, "!!(navigator.geolocation && navigator.geolocation.watchPosition)", sure: 5)
            XCTAssertEqual(konum as? Bool, true, "\(ad): konum arayüzü yok")
            w.removeFromSuperview()
        }
    }
}
