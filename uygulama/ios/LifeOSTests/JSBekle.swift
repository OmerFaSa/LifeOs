// Web gorunumunde JS beklemek. XCTest beklentisi (expectation) KULLANILMAZ:
// sayfa yuklenirken tek bir yavas cevap, dongu beklemeye devam edecekken
// testi aninda dusuruyordu (CI, 00fd13be: «Exceeded timeout of 5 seconds»).
import WebKit
import XCTest

extension XCTestCase {
    /// Tek degerlendirme; sure dolarsa (bitti: false).
    func jsDegerlendir(_ w: WKWebView, _ ifade: String, sure: TimeInterval = 20) -> (bitti: Bool, deger: Any?) {
        var bitti = false
        var deger: Any?
        w.evaluateJavaScript(ifade) { v, _ in deger = v; bitti = true }
        let son = Date().addingTimeInterval(sure)
        while !bitti && Date() < son {
            RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
        }
        return (bitti, deger)
    }

    /// Ifade true olana kadar bekler; olmazsa son degeri doner (assert cagirani yapar).
    func jsBekle(_ w: WKWebView, _ ifade: String, sure: TimeInterval = 60) -> Any? {
        let son = Date().addingTimeInterval(sure)
        var deger: Any?
        repeat {
            deger = jsDegerlendir(w, ifade, sure: max(1, son.timeIntervalSinceNow)).deger
            if let b = deger as? Bool, b { return b }
            RunLoop.current.run(until: Date().addingTimeInterval(0.3))
        } while Date() < son
        return deger
    }

    func jsCalistir(_ w: WKWebView, _ betik: String) {
        _ = jsDegerlendir(w, betik, sure: 20)
    }
}
