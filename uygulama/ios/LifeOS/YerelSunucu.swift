// YEREL SUNUCU — bilgisayardaki sistem/sunucu.py'nin telefondaki ikizi.
//
// Uc modul uc kapida (4173 AYS, 4183 SPI, 4193 ESP): ayri koken, ayri
// depo — bilgisayardaki gibi. kabuk.js'in modul gecisi ayni kapi
// numaralarini kullanir, o yuzden uygulamada da aynidir. 127.0.0.1
// tarayici icin «guvenli koken»dir: kamera ve konum burada calisir.
//
// Kurallar:
//   1. YALNIZ TELEFONUN ICI. Dinleyici geri donus arayuzune (loopback)
//      baglidir; ev agindan, hucresel agdan baglanilamaz.
//   2. KOKUN DISI YOK. «..», gizli dosya ve klasor reddedilir; cozulen yol
//      kokun altinda kalmazsa 404.
//   3. ORTAK GORSEL TEK KOPYA. /img/seviye ve /img/marka uc modulde ayni
//      dosyalardir (sunucu.py de ortak klasorden verir).
//   4. PARCA ISTEGI. WebKit videoyu parca parca ister (Range → 206); parca
//      verilmezse video oynamaz.
//   5. ONBELLEK YOK. Her yanit no-store tasir (sunucu.py kural 2).

import Foundation
import Network

final class YerelSunucu {
    struct Modul {
        let ad: String
        let kapi: UInt16
        let klasor: URL
        let sayfa: String
    }

    enum Hata: Error { case zamanAsimi }

    /// Modul tablosu: kapi numaralari brand/ortak/kabuk.js MODULLER ile ayni.
    static let tablo: [(ad: String, kapi: UInt16, sayfa: String)] = [
        ("AYS", 4173, "rota.html"),
        ("SPI", 4183, "spi.html"),
        ("ESP", 4193, "esp.html"),
    ]
    /// Giris sayfasi: bilgisayardaki gibi 4180 (sistem/sunucu.py giris_html, telefon kipi).
    static let giris: (ad: String, kapi: UInt16, sayfa: String) = ("giris", 4180, "index.html")

    let modul: Modul
    let ortak: URL
    private(set) var kapi: UInt16 = 0
    private var dinleyici: NWListener?
    private let kuyruk: DispatchQueue

    init(modul: Modul, ortak: URL) {
        self.modul = modul
        self.ortak = ortak
        self.kuyruk = DispatchQueue(label: "lifeos.sunucu." + modul.ad)
    }

    var calisiyor: Bool {
        if case .ready? = dinleyici?.state { return true }
        return false
    }

    /// istenen: nil → modulun kapisi; 0 → bos bir kapi (testler).
    func baslat(kapi istenen: UInt16? = nil) throws {
        durdur()
        let p = NWParameters.tcp
        p.requiredInterfaceType = .loopback
        p.allowLocalEndpointReuse = true
        let hedef = istenen ?? modul.kapi
        let kapiNo: NWEndpoint.Port = hedef == 0 ? .any : (NWEndpoint.Port(rawValue: hedef) ?? .any)
        let d = try NWListener(using: p, on: kapiNo)
        let hazir = DispatchSemaphore(value: 0)
        var hata: Error?
        var bildirildi = false
        d.stateUpdateHandler = { [weak self, weak d] durum in
            switch durum {
            case .ready:
                self?.kapi = d?.port?.rawValue ?? 0
                if !bildirildi { bildirildi = true; hazir.signal() }
            case .failed(let e):
                hata = e
                if !bildirildi { bildirildi = true; hazir.signal() }
            default:
                break
            }
        }
        d.newConnectionHandler = { [weak self] c in self?.baglanti(c) }
        d.start(queue: kuyruk)
        // 5 sn CI'da bir kez yetmedi (yuklu makine): 15 sn. Telefonda an meselesi.
        if hazir.wait(timeout: .now() + 15) == .timedOut {
            d.cancel()
            throw Hata.zamanAsimi
        }
        if let e = hata {
            d.cancel()
            throw e
        }
        dinleyici = d
    }

    func durdur() {
        dinleyici?.cancel()
        dinleyici = nil
    }

    // MARK: - baglanti

    private func baglanti(_ c: NWConnection) {
        c.start(queue: DispatchQueue(label: "lifeos.baglanti"))
        oku(c, birikim: Data())
    }

    private func oku(_ c: NWConnection, birikim: Data) {
        c.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] veri, _, bitti, hata in
            guard let self = self else { c.cancel(); return }
            var b = birikim
            if let v = veri { b.append(v) }
            if let son = b.range(of: Data("\r\n\r\n".utf8)) {
                self.cevapla(c, istek: String(decoding: b[b.startIndex..<son.lowerBound], as: UTF8.self))
            } else if bitti || hata != nil || b.count > 64 * 1024 {
                c.cancel()
            } else {
                self.oku(c, birikim: b)
            }
        }
    }

    private func cevapla(_ c: NWConnection, istek: String) {
        let satirlar = istek.components(separatedBy: "\r\n")
        let ilk = (satirlar.first ?? "").split(separator: " ")
        guard ilk.count >= 2 else { return kisa(c, 400, "Bad Request") }
        let yontem = String(ilk[0])
        var basliklar: [String: String] = [:]
        for s in satirlar.dropFirst() {
            guard let i = s.firstIndex(of: ":") else { continue }
            basliklar[s[..<i].trimmingCharacters(in: .whitespaces).lowercased()] =
                s[s.index(after: i)...].trimmingCharacters(in: .whitespaces)
        }
        guard yontem == "GET" || yontem == "HEAD" else { return kisa(c, 405, "Method Not Allowed") }
        guard let url = cozumle(String(ilk[1])),
              let boyut = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.int64Value
        else { return kisa(c, 404, "Not Found") }

        var bas: Int64 = 0, son: Int64 = max(boyut - 1, 0), kod = 200
        if let r = basliklar["range"], let a = YerelSunucu.aralik(r, boyut: boyut) {
            bas = a.bas; son = a.son; kod = 206
        }
        let uzunluk: Int64 = boyut == 0 ? 0 : son - bas + 1
        var h = "HTTP/1.1 \(kod) \(kod == 206 ? "Partial Content" : "OK")\r\n"
        h += "Content-Type: \(YerelSunucu.tur(url.pathExtension))\r\n"
        h += "Content-Length: \(uzunluk)\r\n"
        h += "Accept-Ranges: bytes\r\n"
        h += "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
        h += "Connection: close\r\n"
        if kod == 206 { h += "Content-Range: bytes \(bas)-\(son)/\(boyut)\r\n" }
        h += "\r\n"
        c.send(content: Data(h.utf8), completion: .contentProcessed { [weak self] e in
            guard e == nil, yontem == "GET", uzunluk > 0, let self = self,
                  let fh = try? FileHandle(forReadingFrom: url) else { c.cancel(); return }
            self.gonder(c, fh, konum: bas, kalan: uzunluk)
        })
    }

    /// Dosya 256 KB'lik parcalarla gider: video bellege bir anda alinmaz.
    private func gonder(_ c: NWConnection, _ fh: FileHandle, konum: Int64, kalan: Int64) {
        do { try fh.seek(toOffset: UInt64(konum)) } catch { try? fh.close(); c.cancel(); return }
        let veri = fh.readData(ofLength: Int(min(kalan, 256 * 1024)))
        if veri.isEmpty { try? fh.close(); c.cancel(); return }
        let yeniKalan = kalan - Int64(veri.count)
        c.send(content: veri, completion: .contentProcessed { [weak self] e in
            if e != nil || yeniKalan <= 0 || self == nil { try? fh.close(); c.cancel(); return }
            self?.gonder(c, fh, konum: konum + Int64(veri.count), kalan: yeniKalan)
        })
    }

    private func kisa(_ c: NWConnection, _ kod: Int, _ ad: String) {
        let govde = Data("\(kod) \(ad)\n".utf8)
        let h = "HTTP/1.1 \(kod) \(ad)\r\nContent-Type: text/plain; charset=utf-8\r\n"
            + "Content-Length: \(govde.count)\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n"
        c.send(content: Data(h.utf8) + govde, completion: .contentProcessed { _ in c.cancel() })
    }

    // MARK: - saf islevler (test edilir)

    /// URL hedefi → dosya. Kokun disina cikan, gizli ya da olmayan → nil.
    func cozumle(_ hedef: String) -> URL? {
        let ham = String(hedef.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false).first ?? "")
            .split(separator: "#", maxSplits: 1, omittingEmptySubsequences: false).first.map(String.init) ?? ""
        guard let yol = ham.removingPercentEncoding, yol.hasPrefix("/"),
              !yol.contains("\\"), !yol.contains("\0") else { return nil }
        if yol == "/" || yol == "/index.html" {
            return var_mi(modul.klasor.appendingPathComponent(modul.sayfa), kok: modul.klasor)
        }
        let parca = yol.split(separator: "/").map(String.init)
        guard !parca.isEmpty, !parca.contains(where: { $0.hasPrefix(".") }) else { return nil }
        if parca.count >= 3, parca[0] == "img", parca[1] == "seviye" || parca[1] == "marka" {
            let tam = parca.dropFirst().reduce(ortak) { $0.appendingPathComponent($1) }
            return var_mi(tam, kok: ortak)
        }
        let tam = parca.reduce(modul.klasor) { $0.appendingPathComponent($1) }
        return var_mi(tam, kok: modul.klasor)
    }

    private func var_mi(_ u: URL, kok: URL) -> URL? {
        let yol = u.standardizedFileURL.resolvingSymlinksInPath().path
        let kokYol = kok.standardizedFileURL.resolvingSymlinksInPath().path
        guard yol == kokYol || yol.hasPrefix(kokYol + "/") else { return nil }
        var klasor: ObjCBool = false
        guard FileManager.default.fileExists(atPath: yol, isDirectory: &klasor), !klasor.boolValue else { return nil }
        return URL(fileURLWithPath: yol)
    }

    /// "bytes=A-B" | "bytes=A-" | "bytes=-N" → kapsayici aralik; gecersiz → nil
    /// (gecersiz parca istegi butun dosyayi alir).
    static func aralik(_ deger: String, boyut: Int64) -> (bas: Int64, son: Int64)? {
        guard boyut > 0, deger.lowercased().hasPrefix("bytes=") else { return nil }
        let tanim = deger.dropFirst(6)
        guard !tanim.contains(",") else { return nil }
        let p = tanim.split(separator: "-", omittingEmptySubsequences: false)
        guard p.count == 2 else { return nil }
        let a = p[0].trimmingCharacters(in: .whitespaces), b = p[1].trimmingCharacters(in: .whitespaces)
        if a.isEmpty {
            guard let n = Int64(b), n > 0 else { return nil }
            return (max(0, boyut - n), boyut - 1)
        }
        guard let bas = Int64(a), bas >= 0, bas < boyut else { return nil }
        if b.isEmpty { return (bas, boyut - 1) }
        guard let son = Int64(b), son >= bas else { return nil }
        return (bas, min(son, boyut - 1))
    }

    static func tur(_ uzanti: String) -> String {
        switch uzanti.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs": return "application/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json", "webmanifest": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "gif": return "image/gif"
        case "ico": return "image/x-icon"
        case "mp4": return "video/mp4"
        case "webm": return "video/webm"
        case "mp3": return "audio/mpeg"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        case "txt": return "text/plain; charset=utf-8"
        default: return "application/octet-stream"
        }
    }
}

/// Uc modulun sunuculari. Uygulama on plana her donuste duranlar yeniden acilir.
final class SunucuDuzeni {
    private(set) var sunucular: [YerelSunucu] = []
    private(set) var hata: String?

    init(web: URL? = Bundle.main.url(forResource: "Web", withExtension: nil)) {
        guard let web = web else {
            hata = "Uygulamanın içindeki sayfalar bulunamadı (Web klasörü yok)."
            return
        }
        let ortak = web.appendingPathComponent("ortak", isDirectory: true)
        sunucular = (YerelSunucu.tablo + [YerelSunucu.giris]).map {
            YerelSunucu(modul: .init(ad: $0.ad, kapi: $0.kapi,
                                     klasor: web.appendingPathComponent($0.ad, isDirectory: true),
                                     sayfa: $0.sayfa),
                        ortak: ortak)
        }
    }

    func baslat() {
        guard hata == nil || !sunucular.isEmpty else { return }
        var sorun: [String] = []
        for s in sunucular where !s.calisiyor {
            do { try s.baslat() } catch { sorun.append("\(s.modul.ad) (\(s.modul.kapi)): \(error)") }
        }
        hata = sorun.isEmpty ? nil : "Yerel sunucu açılamadı — " + sorun.joined(separator: "; ")
    }
}
