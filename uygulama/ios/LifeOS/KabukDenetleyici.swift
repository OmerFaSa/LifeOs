// KABUK — uc modulu yerel sunucudan acan tek web gorunumu.
//
// Uygulama giris sayfasiyla (4180, bilgisayardakiyle ayni kartlar) acilir;
// kullanici: «normal modul secme kismi ile gelse». Modul gecisi (kabuk.js)
// baska bir kapiya gider: ayni gorunumde, ayni uygulamada kalir; depolar
// kapiya gore ayridir (bilgisayardaki gibi). Disari giden ana sayfa
// gezintisi Safari'de acilir; harita karolari gibi alt istekler engellenmez.

import UIKit
import WebKit

final class KabukDenetleyici: UIViewController, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    /// Acilis: giris sayfasi (modul secimi).
    static let baslangic = URL(string: "http://127.0.0.1:\(YerelSunucu.giris.kapi)/")!

    private(set) var web: WKWebView!
    /// Ekran kapaliyken rota (asama 2): navigator.geolocation → CoreLocation.
    let kopru: KonumKoprusu
    private var indirilen: URL?

    init(kopru: KonumKoprusu = KonumKoprusu()) {
        self.kopru = kopru
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("kullanilmaz") }

    override func loadView() {
        let ayar = WKWebViewConfiguration()
        ayar.websiteDataStore = .default()               // kalici depo
        ayar.allowsInlineMediaPlayback = true
        ayar.mediaTypesRequiringUserActionForPlayback = []
        ayar.userContentController.addUserScript(KonumKoprusu.betik)
        ayar.userContentController.add(kopru, name: KonumKoprusu.ad)
        let w = WKWebView(frame: .zero, configuration: ayar)
        kopru.web = w
        w.navigationDelegate = self
        w.uiDelegate = self
        w.allowsBackForwardNavigationGestures = false
        w.isOpaque = false
        w.backgroundColor = .systemBackground
        w.scrollView.backgroundColor = .systemBackground
        if #available(iOS 16.4, *) { w.isInspectable = true }
        web = w
        view = w
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        web.load(URLRequest(url: KabukDenetleyici.baslangic))
    }

    /// Uygulamanin kendi sayfasi mi? (127.0.0.1; giris ya da uc modul kapisi)
    static func icerde(_ u: URL) -> Bool {
        guard u.scheme == "http", u.host == "127.0.0.1", let p = u.port else { return false }
        return (YerelSunucu.tablo + [YerelSunucu.giris]).contains { Int($0.kapi) == p }
    }

    // MARK: - gezinti

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 preferences: WKWebpagePreferences,
                 decisionHandler: @escaping (WKNavigationActionPolicy, WKWebpagePreferences) -> Void) {
        if navigationAction.shouldPerformDownload { return decisionHandler(.download, preferences) }
        guard let u = navigationAction.request.url else { return decisionHandler(.cancel, preferences) }
        if KabukDenetleyici.icerde(u) || ["about", "blob", "data"].contains(u.scheme ?? "") {
            return decisionHandler(.allow, preferences)
        }
        if navigationAction.targetFrame?.isMainFrame ?? true {
            if ["http", "https", "mailto", "tel"].contains(u.scheme ?? "") { UIApplication.shared.open(u) }
            return decisionHandler(.cancel, preferences)
        }
        decisionHandler(.allow, preferences)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
    }

    /// Sayfadan ayriliniyor (modul gecisi, yeniden yukleme): eski sayfanin
    /// konum izleyicileri biter, GPS durur. Ayni sayfa icindeki #rota
    /// degisimi bu yoldan gecmez.
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        kopru.sayfaDegisti()
    }

    /// iOS arka planda web icerigini sonlandirabilir: yeniden yuklenir. Kayit
    /// suruyorsa GPS durmaz; noktalar diske yazilir, yeni sayfa kaydi
    /// sahiplenip kaldigi yerden surdurur (KonumKoprusu, asama 2b).
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        kopru.sayfaOldu()
        webView.load(URLRequest(url: webView.url.flatMap { KabukDenetleyici.icerde($0) ? $0 : nil }
                                ?? KabukDenetleyici.baslangic))
    }

    // MARK: - indirme (yedek dosyasi): paylas menusu → Dosyalar

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let klasor = FileManager.default.temporaryDirectory.appendingPathComponent("indirilen", isDirectory: true)
        try? FileManager.default.createDirectory(at: klasor, withIntermediateDirectories: true)
        let ad = (suggestedFilename as NSString).lastPathComponent
        let hedef = klasor.appendingPathComponent(ad.isEmpty ? "lifeos-dosya" : ad)
        try? FileManager.default.removeItem(at: hedef)
        indirilen = hedef
        completionHandler(hedef)
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard let u = indirilen else { return }
        DispatchQueue.main.async {
            let p = UIActivityViewController(activityItems: [u], applicationActivities: nil)
            p.popoverPresentationController?.sourceView = self.view
            self.present(p, animated: true)
        }
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        DispatchQueue.main.async { self.uyari("İndirme tamamlanamadı.", tamam: {}) }
    }

    // MARK: - pencereler, izinler

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        uyari(message, tamam: completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Vazgeç", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler(true) })
        sun(a, yoksa: { completionHandler(false) })
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: "Vazgeç", style: .cancel) { _ in completionHandler(nil) })
        a.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
        sun(a, yoksa: { completionHandler(nil) })
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let u = navigationAction.request.url {
            if KabukDenetleyici.icerde(u) { webView.load(navigationAction.request) } else { UIApplication.shared.open(u) }
        }
        return nil
    }

    /// Kamera: yalniz uygulamanin kendi sayfalarina (sistem izni ayrica sorulur).
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(origin.host == "127.0.0.1" ? .grant : .deny)
    }

    // MARK: - yardimci

    private func uyari(_ metin: String, tamam: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: metin, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in tamam() })
        sun(a, yoksa: tamam)
    }

    /// Ekranda zaten bir pencere varsa ikincisi acilmaz; cevap yine verilir.
    private func sun(_ a: UIAlertController, yoksa: @escaping () -> Void) {
        guard presentedViewController == nil, view.window != nil else { return yoksa() }
        present(a, animated: true)
    }
}

/// Sunucu acilamazsa duz bir aciklama (beyaz ekran yerine).
final class HataDenetleyici: UIViewController {
    private let metin: String
    init(metin: String) { self.metin = metin; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("kullanilmaz") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let l = UILabel()
        l.text = "LifeOS açılamadı.\n\n" + metin + "\n\nUygulamayı kapatıp yeniden aç."
        l.numberOfLines = 0
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(l)
        NSLayoutConstraint.activate([
            l.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            l.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor),
            l.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor),
        ])
    }
}
