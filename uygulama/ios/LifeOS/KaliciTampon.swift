// KALICI TAMPON — ekran kapali rotanin diskteki kopyasi (asama 2b).
//
// Arka planda biriken konum yalniz bellekteydi: iOS web surecini oldurunce
// ya da uygulamayi kapatinca kosunun ekran kapali kismi kayboluyordu. Kopru
// her noktayi buraya da yazar; sayfa «buraya kadar depoya yazdim» deyince
// (yazildi) o kisim silinir. Sayfa yeniden acilinca kalanlar `kurtar` ile
// geri verilir (SPI canli.js «uygulamada kurtarma»).
//
// Kurallar:
//   1. YALNIZ SAYFA SILDIRIR. Nokta, sayfa depoya yazdigini bildirmeden ya da
//      izlemeyi kendisi birakmadan silinmez.
//   2. EKLEME UCUZ. Her nokta dosyanin sonuna bir JSON satiri olarak eklenir;
//      dosya yalniz silmede bastan yazilir. Yarim kalan satir (uygulama
//      yazarken kapandi) okunurken atlanir; sonraki ekleme yeni satirda baslar.
//   3. KILITLI EKRANDA YAZILIR. Dosya «ilk kilit acilisindan sonra»
//      korumasiyla durur: ekran kilitliyken de yazilabilir.
//   4. SINIRLI. En cok `sinir` nokta (saniyede bir noktayla ~28 saat);
//      asilirsa en eskisi duser.
//   5. KONUM CIHAZDAN CIKMAZ. Dosya uygulamanin kendi klasorundedir ve
//      yedege (iCloud) girmez.

import Foundation

final class KaliciTampon {
    let dosya: URL
    let sinir: Int
    private(set) var noktalar: [[String: Any]] = []

    init(dosya: URL = KaliciTampon.varsayilan, sinir: Int = 100_000) {
        self.dosya = dosya
        self.sinir = sinir
        noktalar = KaliciTampon.oku(dosya)
    }

    static var varsayilan: URL {
        let kok = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return kok.appendingPathComponent("LifeOS", isDirectory: true)
            .appendingPathComponent("konum-tampon.jsonl")
    }

    /// Noktanin zamani (ms); KonumKoprusu.js bicimi.
    static func zaman(_ n: [String: Any]) -> Double? {
        (n["timestamp"] as? NSNumber)?.doubleValue
    }

    func ekle(_ yeni: [[String: Any]]) {
        guard !yeni.isEmpty else { return }
        noktalar += yeni
        if noktalar.count > sinir {
            noktalar.removeFirst(noktalar.count - sinir)
            bastanYaz()
        } else {
            sonaEkle(yeni)
        }
    }

    /// Sayfa `t` anina kadarki (dahil) noktalari depoya yazdi.
    func yazildi(_ t: Double) {
        let kalan = noktalar.filter { (KaliciTampon.zaman($0) ?? .infinity) > t }
        guard kalan.count != noktalar.count else { return }
        noktalar = kalan
        bastanYaz()
    }

    func temizle() {
        noktalar = []
        try? FileManager.default.removeItem(at: dosya)
    }

    // MARK: - dosya

    static func oku(_ dosya: URL) -> [[String: Any]] {
        guard let veri = try? Data(contentsOf: dosya) else { return [] }
        return veri.split(separator: 0x0A).compactMap { satir -> [String: Any]? in
            guard let n = (try? JSONSerialization.jsonObject(with: Data(satir))) as? [String: Any],
                  zaman(n) != nil else { return nil }
            return n
        }
    }

    private static func satirlar(_ n: [[String: Any]]) -> Data {
        var veri = Data()
        for x in n {
            guard JSONSerialization.isValidJSONObject(x),
                  let j = try? JSONSerialization.data(withJSONObject: x) else { continue }
            veri.append(j)
            veri.append(0x0A)
        }
        return veri
    }

    private func sonaEkle(_ yeni: [[String: Any]]) {
        guard let h = try? FileHandle(forWritingTo: dosya) else { return bastanYaz() }
        defer { try? h.close() }
        // Bastaki satir sonu: onceki yazim yarim kaldiysa yeni satir ona yapismaz.
        var veri = Data([0x0A])
        veri.append(KaliciTampon.satirlar(yeni))
        do {
            try h.seekToEnd()
            try h.write(contentsOf: veri)
        } catch {
            bastanYaz()
        }
    }

    private func bastanYaz() {
        if noktalar.isEmpty {
            try? FileManager.default.removeItem(at: dosya)
            return
        }
        var klasor = dosya.deletingLastPathComponent()
        if !FileManager.default.fileExists(atPath: klasor.path) {
            try? FileManager.default.createDirectory(at: klasor, withIntermediateDirectories: true)
            var ayar = URLResourceValues()
            ayar.isExcludedFromBackup = true
            try? klasor.setResourceValues(ayar)
        }
        try? KaliciTampon.satirlar(noktalar).write(
            to: dosya, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
}
