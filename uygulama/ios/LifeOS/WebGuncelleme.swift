// WEB GUNCELLEME — uygulama web kodunu PC'siz, kendisi indirir.
//
// Kullanici (2026-11-05): «her guncelleme yaptigimda PC baglamam lazim». Swift
// degismedikce AltStore'a gerek yok. Uretici: uygulama/ios/web_paket.py.
//
// Sozler:
//   1. YALNIZ KOD. Bu yol hicbir kayit gondermez; kayitlar WKWebView deposunda
//      durur, koken (127.0.0.1:41x3) degismedigi icin dokunulmaz.
//   2. YALNIZ YESIL DERLEME. Paket CI'da testlerden sonra yayimlanir.
//   3. YARIM SURUM YOK. Her dosya sha256 ile dogrulanir; hepsi inince tek bir
//      JSON yazimiyla gecilir. Yarida kalirsa eski surum calisir, inenler kalir.
//   4. BOZUK SURUM GERI ALINIR. Yeni surum iki acilista sayfayi ayaga
//      kaldiramazsa uygulamanin icindeki surume donulur ve o surum atlanir.
//   5. UYUM. Sayfa yeni bir yerel kopru istiyorsa LifeOSWebUyum artirilir; eski
//      kabuk o paketi almaz, AltStore guncellemesini bekler.
//   6. AG YOKSA SESSIZ. Uygulama icindeki sayfayla calismaya devam eder.

import CryptoKit
import Foundation

struct WebManifest: Decodable {
    struct Dosya: Decodable {
        let yol: String
        let sha256: String
        let boyut: Int64
        let z: Bool
    }
    let surum: Int
    let uyum: Int
    let dosyalar: [Dosya]
}

final class WebGuncelleme {
    typealias Indir = (URL) async throws -> Data

    static let adres = URL(string: "https://github.com/OmerFaSa/LifeOs/releases/download/web-son/")!
    static let enCokBayt: Int64 = 400 * 1024 * 1024
    static let bakisAraligi: TimeInterval = 30 * 60
    static let bozukAcilis = 2

    static let ortak: WebGuncelleme = {
        let bilgi = Bundle.main
        let kok = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("WebGuncel", isDirectory: true)
        var temel: [String: String] = [:]
        if let u = bilgi.url(forResource: "Web", withExtension: nil)?.appendingPathComponent("temel.json"),
           let v = try? Data(contentsOf: u),
           let h = try? JSONDecoder().decode([String: String].self, from: v) {
            temel = h
        }
        return WebGuncelleme(kok: kok, temel: temel,
                             temelSurum: Int(bilgi.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "") ?? 0,
                             uyum: bilgi.object(forInfoDictionaryKey: "LifeOSWebUyum") as? Int ?? 0)
    }()

    struct Durum: Codable, Equatable {
        var surum = 0
        var harita: [String: String] = [:]     // yol → icerik dosyasi; yalniz uygulamadakinden farkli olanlar
        var deneme = false
        var acilis = 0
        var kotu: [Int] = []
    }

    private let kok: URL
    private let temel: [String: String]
    private let temelSurum: Int
    private let uyum: Int
    private let indir: Indir
    private let kilit = NSLock()
    private var durum = Durum()
    private var sonBakis: Date?
    private var bakiliyor = false

    init(kok: URL, temel: [String: String], temelSurum: Int, uyum: Int,
         indir: @escaping Indir = { try await URLSession.shared.data(from: $0).0 }) {
        self.kok = kok
        self.temel = temel
        self.temelSurum = temelSurum
        self.uyum = uyum
        self.indir = indir
        if let v = try? Data(contentsOf: durumYolu), let d = try? JSONDecoder().decode(Durum.self, from: v) {
            durum = d
        }
    }

    private var durumYolu: URL { kok.appendingPathComponent("gecerli.json") }
    private var icerik: URL { kok.appendingPathComponent("icerik", isDirectory: true) }
    var simdiki: Durum { kilit.lock(); defer { kilit.unlock() }; return durum }

    /// Yerel sunucu her istekte sorar. Yol yalniz sozluk anahtaridir: dosya
    /// sistemine gitmez, «..» ile disari cikilamaz.
    func dosya(_ yol: String) -> URL? {
        kilit.lock(); defer { kilit.unlock() }
        guard let ad = durum.harita[yol] else { return nil }
        let u = icerik.appendingPathComponent(ad)
        return FileManager.default.fileExists(atPath: u.path) ? u : nil
    }

    /// Her acilista, sunucular baslamadan. Soz 4 ve AltStore'dan gelen yeni IPA.
    func acilis() {
        kilit.lock(); defer { kilit.unlock() }
        if durum.surum != 0, durum.surum <= temelSurum {
            durum.surum = 0; durum.harita = [:]; durum.deneme = false; durum.acilis = 0
        } else if durum.deneme {
            durum.acilis += 1
            if durum.acilis > WebGuncelleme.bozukAcilis {
                durum.kotu.append(durum.surum)
                durum.surum = 0; durum.harita = [:]; durum.deneme = false; durum.acilis = 0
            }
        }
        kaydet()
    }

    /// Sayfa ayaga kalkti: yeni surum saglam.
    func onayla() {
        kilit.lock(); defer { kilit.unlock() }
        guard durum.deneme else { return }
        durum.deneme = false; durum.acilis = 0
        kaydet()
    }

    /// Arka planda bak; uygulama one her geliste cagrilir, sik bakmaz.
    func arkada() {
        kilit.lock()
        if bakiliyor || (sonBakis.map { Date().timeIntervalSince($0) < WebGuncelleme.bakisAraligi } ?? false) {
            kilit.unlock()
            return
        }
        bakiliyor = true
        kilit.unlock()
        Task.detached(priority: .utility) { [self] in
            bakisBitti((try? await denetle()) != nil)
        }
    }

    private func bakisBitti(_ tamam: Bool) {
        kilit.lock(); defer { kilit.unlock() }
        if tamam { sonBakis = Date() }
        bakiliyor = false
    }

    /// Tek yazim: yeni surum butunuyle gecer (soz 3). Doner: kalacak icerikler.
    private func gec(_ surum: Int, _ harita: [String: String]) -> Set<String> {
        kilit.lock(); defer { kilit.unlock() }
        durum.surum = surum
        durum.harita = harita
        durum.deneme = true
        durum.acilis = 0
        kaydet()
        return Set(harita.values)
    }

    /// Yeni surume gecildiyse true. Hata firlatirsa surum degismemistir.
    @discardableResult
    func denetle() async throws -> Bool {
        let u = WebGuncelleme.adres.appendingPathComponent("web-surum.json")
        let m = try JSONDecoder().decode(WebManifest.self, from: try await indir(u))
        let d = simdiki
        guard m.uyum == uyum, m.surum > max(d.surum, temelSurum), !d.kotu.contains(m.surum) else { return false }

        var harita: [String: String] = [:]
        var lazim: [(WebManifest.Dosya, String)] = []
        var toplam: Int64 = 0
        for f in m.dosyalar where temel[f.yol] != f.sha256 {
            guard WebGuncelleme.ozetGecerli(f.sha256) else { throw Hata.bozukListe }
            let ad = WebGuncelleme.icerikAdi(f)
            harita[f.yol] = ad
            lazim.append((f, ad))
            toplam += f.boyut
        }
        guard toplam <= WebGuncelleme.enCokBayt else { throw Hata.cokBuyuk }
        try FileManager.default.createDirectory(at: icerik, withIntermediateDirectories: true)
        for (f, ad) in lazim {
            let hedef = icerik.appendingPathComponent(ad)
            if FileManager.default.fileExists(atPath: hedef.path) { continue }   // dogrulanmadan yazilmaz
            let isim = "w-" + String(f.sha256.prefix(16)) + (f.z ? ".z" : "")
            var veri = try await indir(WebGuncelleme.adres.appendingPathComponent(isim))
            if f.z { veri = try (veri as NSData).decompressed(using: .zlib) as Data }
            guard Int64(veri.count) == f.boyut, WebGuncelleme.sha256(veri) == f.sha256.lowercased() else { throw Hata.bozukDosya }
            try veri.write(to: hedef, options: .atomic)
        }

        let kalan = gec(m.surum, harita)
        for a in (try? FileManager.default.contentsOfDirectory(atPath: icerik.path)) ?? [] where !kalan.contains(a) {
            try? FileManager.default.removeItem(at: icerik.appendingPathComponent(a))
        }
        return true
    }

    enum Hata: Error { case bozukListe, bozukDosya, cokBuyuk }

    private func kaydet() {
        try? FileManager.default.createDirectory(at: kok, withIntermediateDirectories: true)
        if let v = try? JSONEncoder().encode(durum) { try? v.write(to: durumYolu, options: .atomic) }
    }

    static func sha256(_ d: Data) -> String {
        SHA256.hash(data: d).map { String(format: "%02x", $0) }.joined()
    }

    static func ozetGecerli(_ s: String) -> Bool {
        s.count == 64 && s.allSatisfy { $0.isHexDigit }
    }

    /// Yerel sunucu turu uzantidan bilir; uzanti listeden gelir, yola dokunmaz.
    static func icerikAdi(_ f: WebManifest.Dosya) -> String {
        let uzanti = (f.yol as NSString).pathExtension.lowercased()
        let temiz = uzanti.count <= 8 && uzanti.allSatisfy { $0.isLetter || $0.isNumber }
        return f.sha256.lowercased() + (temiz && !uzanti.isEmpty ? "." + uzanti : "")
    }
}
