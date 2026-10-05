// KABUK — uc modulu yerel sunucudan acan tek web gorunumu.
//
// Uygulama giris sayfasiyla (4180, bilgisayardakiyle ayni kartlar) acilir;
// kullanici: «normal modul secme kismi ile gelse». Modul gecisi (kabuk.js)
// baska bir kapiya gider: ayni gorunumde, ayni uygulamada kalir; depolar
// kapiya gore ayridir (bilgisayardaki gibi). Disari giden ana sayfa
// gezintisi Safari'de acilir; harita karolari gibi alt istekler engellenmez.

import UIKit
import WebKit

final class KabukDenetleyici: UIViewController, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate, WKScriptMessageHandler {
    /// Acilis: giris sayfasi (modul secimi).
    static let baslangic = URL(string: "http://127.0.0.1:\(YerelSunucu.giris.kapi)/")!

    private(set) var web: WKWebView!
    /// Ekran kapaliyken rota (asama 2): navigator.geolocation → CoreLocation.
    let kopru: KonumKoprusu
    private var indirilen: URL?
    /// Sayfanin en ustteki rengi (durum cubugunun zemini); gelmeden nil.
    private(set) var ustRenk: (r: Int, g: Int, b: Int)?

    init(kopru: KonumKoprusu = KonumKoprusu()) {
        self.kopru = kopru
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("kullanilmaz") }

    // DURUM CUBUGU (kullanici, 2026-10-05, telefondan: «hafif asagi kaydirinca
    // sikintilar var»). Web gorunumu saatin ve pilin arkasina dek uzaniyordu:
    // iOS kaydirilan sayfayi o bolgede de ciziyor, icerik saatin arkasindan
    // akiyor ve gizli duran «Iceriye atla» baglantisi orada gorunuyordu. Artik
    // sayfa durum cubugunun ALTINDAN baslar; o serit sayfanin en ustteki
    // rengini alir (Menu acilinca Menu'nun), yazisi zemine gore acik ya da koyu.
    override func loadView() {
        let ayar = WKWebViewConfiguration()
        ayar.websiteDataStore = .default()               // kalici depo
        ayar.allowsInlineMediaPlayback = true
        ayar.mediaTypesRequiringUserActionForPlayback = []
        ayar.userContentController.addUserScript(KonumKoprusu.betik)
        ayar.userContentController.add(kopru, name: KonumKoprusu.ad)
        ayar.userContentController.addUserScript(KabukDenetleyici.renkBetigi)
        ayar.userContentController.add(ZayifDinleyici(self), name: KabukDenetleyici.renkAdi)
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

        let kap = UIView()
        kap.backgroundColor = .systemBackground
        w.translatesAutoresizingMaskIntoConstraints = false
        kap.addSubview(w)
        NSLayoutConstraint.activate([
            w.topAnchor.constraint(equalTo: kap.safeAreaLayoutGuide.topAnchor),
            w.leadingAnchor.constraint(equalTo: kap.leadingAnchor),
            w.trailingAnchor.constraint(equalTo: kap.trailingAnchor),
            w.bottomAnchor.constraint(equalTo: kap.bottomAnchor),
        ])
        view = kap
    }

    // MARK: - durum cubugu

    override var preferredStatusBarStyle: UIStatusBarStyle {
        guard let r = ustRenk else { return .default }
        return KabukDenetleyici.koyuMu(r.r, r.g, r.b) ? .lightContent : .darkContent
    }

    /// Zemin koyu mu: beyaz yazi siyahtan daha cok karsitlik veriyorsa
    /// (WCAG goreli parlaklik). Durum cubugu yazisi buna gore secilir.
    static func koyuMu(_ r: Int, _ g: Int, _ b: Int) -> Bool {
        func kanal(_ c: Int) -> Double {
            let s = Double(max(0, min(255, c))) / 255
            return s <= 0.03928 ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4)
        }
        let l = 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b)
        return 1.05 / (l + 0.05) > (l + 0.05) / 0.05
    }

    func userContentController(_ ucc: WKUserContentController, didReceive m: WKScriptMessage) {
        guard m.name == KabukDenetleyici.renkAdi, m.frameInfo.isMainFrame,
              let a = m.body as? [NSNumber], a.count >= 3 else { return }
        let r = (r: a[0].intValue, g: a[1].intValue, b: a[2].intValue)
        let eskiKoyu = ustRenk.map { KabukDenetleyici.koyuMu($0.r, $0.g, $0.b) }
        ustRenk = r
        let renk = UIColor(red: CGFloat(r.r) / 255, green: CGFloat(r.g) / 255, blue: CGFloat(r.b) / 255, alpha: 1)
        UIView.animate(withDuration: 0.2) { self.view.backgroundColor = renk }
        if eskiKoyu != KabukDenetleyici.koyuMu(r.r, r.g, r.b) { setNeedsStatusBarAppearanceUpdate() }
    }

    static let renkAdi = "lifeosRenk"

    /// Sayfanin en ust satirinda GORUNEN rengi olcer: o noktadaki ogeler
    /// ustten alta, saydamliklariyla ust uste bindirilir (Menu'nun karartmasi
    /// da dahil). Renk degisince bildirir; ayni renk iki kez gitmez.
    static var renkBetigi: WKUserScript {
        WKUserScript(source: renkKaynak, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
    }

    static let renkKaynak = """
    (function(){
      var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.lifeosRenk;
      if (!h || window.__lifeosRenk) return;
      window.__lifeosRenk = true;
      var tuval = null, son = '', bekliyor = false;
      function rgba(c){
        if (!c || c === 'transparent') return [0, 0, 0, 0];
        if (!tuval) { tuval = document.createElement('canvas'); tuval.width = tuval.height = 1; }
        var x = tuval.getContext('2d');
        x.clearRect(0, 0, 1, 1);
        x.fillStyle = 'rgba(0,0,0,0)';
        x.fillStyle = c;
        x.fillRect(0, 0, 1, 1);
        var d = x.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      }
      function olc(){
        bekliyor = false;
        var ogeler = document.elementsFromPoint ? document.elementsFromPoint(window.innerWidth / 2, 1) : [];
        var r = 0, g = 0, b = 0, kalan = 1;
        for (var i = 0; i < ogeler.length && kalan > 0.01; i++) {
          var c = rgba(getComputedStyle(ogeler[i]).backgroundColor);
          var a = c[3] * kalan;
          r += c[0] * a; g += c[1] * a; b += c[2] * a; kalan -= a;
        }
        if (kalan > 0.01) {
          var z = rgba(getComputedStyle(document.documentElement).backgroundColor);
          if (z[3] < 0.5) z = matchMedia('(prefers-color-scheme: dark)').matches ? [0, 0, 0, 1] : [255, 255, 255, 1];
          r += z[0] * kalan; g += z[1] * kalan; b += z[2] * kalan;
        }
        var s = [Math.round(r), Math.round(g), Math.round(b)];
        if (s.join() === son) return;
        son = s.join();
        try { h.postMessage(s); } catch (e) {}
      }
      function iste(){
        if (bekliyor) return;
        bekliyor = true;
        setTimeout(function(){ requestAnimationFrame(olc); }, 80);
      }
      new MutationObserver(iste).observe(document.documentElement,
        { attributes: true, childList: true, subtree: true, attributeFilter: ['class', 'style', 'data-theme', 'hidden', 'open'] });
      window.addEventListener('load', iste);
      window.addEventListener('scroll', iste, { passive: true });
      window.addEventListener('resize', iste);
      try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', iste); } catch (e) {}
      document.addEventListener('transitionend', iste, true);
      document.addEventListener('animationend', iste, true);
      iste();
    })();
    """

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

/// WKUserContentController dinleyicisini guclu tutar; denetleyici dogrudan
/// verilirse kendini birakamaz (dongu). Arada zayif bir araci durur.
private final class ZayifDinleyici: NSObject, WKScriptMessageHandler {
    weak var hedef: WKScriptMessageHandler?
    init(_ h: WKScriptMessageHandler) { hedef = h }
    func userContentController(_ ucc: WKUserContentController, didReceive m: WKScriptMessage) {
        hedef?.userContentController(ucc, didReceive: m)
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
