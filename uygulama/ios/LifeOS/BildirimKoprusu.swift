// BILDIRIM — sayfanin yerel bildirim istegi (brand/ortak/bildirim.js).
//
// Depo sahibi (2026-10-09): «iPhone: Apple Saglik ve bildirim». WKWebView'da
// tarayici bildirimi yok: SPI hatirlatmalari uygulamada hic gelmiyordu.
// Sayfa ne zaman ne gelecegini SOYLER (modulun kendi kurali), kabuk iOS'un
// yerel bildirimini kurar; saati gelince uygulama kapaliyken de gelir.
//
// Sozler:
//   1. MODUL SAYFANIN KAPISINDAN bilinir (4173 AYS, 4183 SPI, 4193 ESP);
//      sayfanin «ben suyum» demesine bakilmaz. Her modul yalniz kendi
//      on ekindeki («lifeos.spi.») bildirimleri siler ve kurar.
//   2. LISTENIN TAMAMI gelir: o modulun bekleyenleri silinir, yenileri
//      kurulur. Gecmis zaman kurulmaz; modul basina ust sinir (iOS bir
//      uygulamaya en cok 64 bekleyen bildirim verir).
//   3. IZIN yalniz sayfa isteyince (kullanici dugmeye basinca) sorulur.
//   4. Bildirime dokununca o modul acilir (BildirimDokunusu).
// Cevap, konum koprusundeki gibi sayfaya JS cagrisiyla doner
// (`LIFEOS.BILDIRIM._cevap(istek, {...})`). Yalniz Apple'in kitapliklari.

import Foundation
import UserNotifications
import WebKit

/// UNUserNotificationCenter'in kullanilan kismi: testte sahtesi takilir.
protocol BildirimMerkezi: AnyObject {
    func yetki(_ tamam: @escaping (String) -> Void)
    func izinIste(_ tamam: @escaping (String) -> Void)
    func bekleyenler(_ tamam: @escaping ([String]) -> Void)
    func sil(_ kimlikler: [String])
    func ekle(_ istek: UNNotificationRequest)
}

final class SistemBildirimMerkezi: BildirimMerkezi {
    private let m = UNUserNotificationCenter.current()

    static func ad(_ s: UNAuthorizationStatus) -> String {
        switch s {
        case .authorized, .provisional, .ephemeral: return "izin"
        case .denied: return "red"
        case .notDetermined: return "sorulmadi"
        @unknown default: return "sorulmadi"
        }
    }

    func yetki(_ tamam: @escaping (String) -> Void) {
        m.getNotificationSettings { a in tamam(SistemBildirimMerkezi.ad(a.authorizationStatus)) }
    }

    func izinIste(_ tamam: @escaping (String) -> Void) {
        let m = self.m
        m.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            m.getNotificationSettings { a in tamam(SistemBildirimMerkezi.ad(a.authorizationStatus)) }
        }
    }

    func bekleyenler(_ tamam: @escaping ([String]) -> Void) {
        m.getPendingNotificationRequests { l in tamam(l.map { $0.identifier }) }
    }

    func sil(_ kimlikler: [String]) {
        if !kimlikler.isEmpty { m.removePendingNotificationRequests(withIdentifiers: kimlikler) }
    }

    func ekle(_ istek: UNNotificationRequest) { m.add(istek, withCompletionHandler: nil) }
}

final class BildirimKoprusu: NSObject, WKScriptMessageHandler {
    static let ad = "lifeosBildirim"
    /// Kapi → modul (soz 1).
    static let kapilar: [Int: String] = [4173: "ays", 4183: "spi", 4193: "esp"]
    /// Toplam 62 < 64 (iOS siniri); brand/ortak/bildirim.js SINIR ile ayni.
    static let sinir: [String: Int] = ["spi": 36, "esp": 20, "ays": 6]

    let merkez: BildirimMerkezi

    init(merkez: BildirimMerkezi = SistemBildirimMerkezi()) {
        self.merkez = merkez
        super.init()
    }

    static func onEk(_ modul: String) -> String { "lifeos.\(modul)." }

    func userContentController(_ ucc: WKUserContentController, didReceive m: WKScriptMessage) {
        let koken = m.frameInfo.securityOrigin
        guard m.frameInfo.isMainFrame, koken.host == "127.0.0.1",
              let modul = BildirimKoprusu.kapilar[koken.port],
              let g = m.body as? [String: Any],
              let no = (g["istek"] as? NSNumber)?.intValue else { return }
        let w = m.webView
        isle(g, modul: modul) { [weak self, weak w] v in
            self?.cevapla(w, istek: no, v)
        }
    }

    /// Sayfaya cevap: istek numarasiyla, JSON olarak.
    private func cevapla(_ w: WKWebView?, istek: Int, _ v: [String: Any]) {
        guard let w = w, let veri = try? JSONSerialization.data(withJSONObject: v),
              let metin = String(data: veri, encoding: .utf8) else { return }
        w.evaluateJavaScript("window.LIFEOS && window.LIFEOS.BILDIRIM && window.LIFEOS.BILDIRIM._cevap(\(istek), \(metin))",
                             completionHandler: nil)
    }

    /// Asil is; test dogrudan cagirir. Cevap ana is parcaciginda verilir.
    func isle(_ g: [String: Any], modul: String, simdi: Date = Date(), cevap: @escaping ([String: Any]) -> Void) {
        let ver: ([String: Any]) -> Void = { v in DispatchQueue.main.async { cevap(v) } }
        switch g["tur"] as? String ?? "" {
        case "durum":
            merkez.yetki { d in ver(["durum": d]) }
        case "izin":
            merkez.izinIste { d in ver(["durum": d]) }
        case "kur":
            let liste = g["liste"] as? [[String: Any]] ?? []
            kur(modul: modul, liste: liste, simdi: simdi) { n in ver(["kurulan": n]) }
        default:
            ver(["hata": "bilinmeyen istek"])
        }
    }

    /// Modulun bekleyenlerini siler, listedekileri kurar (soz 2).
    func kur(modul: String, liste: [[String: Any]], simdi: Date = Date(), tamam: @escaping (Int) -> Void) {
        let onEk = BildirimKoprusu.onEk(modul)
        let sinir = BildirimKoprusu.sinir[modul] ?? 6
        let merkez = self.merkez
        merkez.bekleyenler { eski in
            merkez.sil(eski.filter { $0.hasPrefix(onEk) })
            var n = 0
            for x in liste {
                if n >= sinir { break }
                guard let istek = BildirimKoprusu.istek(x, modul: modul, simdi: simdi) else { continue }
                merkez.ekle(istek)
                n += 1
            }
            tamam(n)
        }
    }

    /// Listenin bir satiri → bildirim istegi; eksik ya da gecmisse nil.
    static func istek(_ x: [String: Any], modul: String, simdi: Date) -> UNNotificationRequest? {
        guard let anahtar = x["anahtar"] as? String, !anahtar.isEmpty,
              let baslik = x["baslik"] as? String, !baslik.isEmpty,
              let ms = (x["zaman"] as? NSNumber)?.doubleValue else { return nil }
        let tarih = Date(timeIntervalSince1970: ms / 1000)
        guard tarih > simdi else { return nil }
        let icerik = UNMutableNotificationContent()
        icerik.title = String(baslik.prefix(80))
        icerik.body = String(((x["govde"] as? String) ?? "").prefix(160))
        icerik.sound = .default
        icerik.threadIdentifier = modul
        icerik.userInfo = ["modul": modul]
        let bilesen = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: tarih)
        let tetik = UNCalendarNotificationTrigger(dateMatching: bilesen, repeats: false)
        return UNNotificationRequest(identifier: onEk(modul) + String(anahtar.prefix(120)),
                                     content: icerik, trigger: tetik)
    }

    /// Bildirimin modulunun adresi (soz 4).
    static func adres(modul: String) -> URL? {
        guard let kapi = kapilar.first(where: { $0.value == modul })?.key else { return nil }
        return URL(string: "http://127.0.0.1:\(kapi)/")
    }
}

/// Bildirim merkezinin temsilcisi: uygulama ondeyken de gorunur (yoksa iOS
/// sessizce yutar); dokununca o modul acilir.
final class BildirimDokunusu: NSObject, UNUserNotificationCenterDelegate {
    var ac: ((URL) -> Void)?

    func userNotificationCenter(_ c: UNUserNotificationCenter, willPresent n: UNNotification,
                                withCompletionHandler tamam: @escaping (UNNotificationPresentationOptions) -> Void) {
        tamam([.banner, .list, .sound])
    }

    func userNotificationCenter(_ c: UNUserNotificationCenter, didReceive r: UNNotificationResponse,
                                withCompletionHandler tamam: @escaping () -> Void) {
        let modul = r.notification.request.content.userInfo["modul"] as? String
        if let modul = modul, let u = BildirimKoprusu.adres(modul: modul) {
            let ac = self.ac
            DispatchQueue.main.async { ac?(u) }
        }
        tamam()
    }
}
