// LifeOS — telefon kabugu (iOS). Ayrinti: belgeler/UYGULAMA.md
//
// Acilista uc modulun yerel sunucusu baslar, sonra kabuk acilir. On plana
// her donuste duran sunucu yeniden acilir (iOS arka planda dinleyiciyi
// kapatabilir).

import UIKit
import UserNotifications

@main
final class Uygulama: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    let sunucular = SunucuDuzeni()

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        sunucular.baslat()
        let w = UIWindow(frame: UIScreen.main.bounds)
        if let h = sunucular.hata {
            w.rootViewController = HataDenetleyici(metin: h)
        } else {
            let k = KabukDenetleyici()
            // Bildirim temsilcisi acilista baglanir: kapaliyken dokunulan
            // bildirim de uygulamayi o modulde acar.
            UNUserNotificationCenter.current().delegate = k.dokunus
            // Bildirimdeki dugmeler (BildirimKoprusu soz 7) her acilista kaydedilir.
            UNUserNotificationCenter.current().setNotificationCategories(BildirimKoprusu.kategoriler())
            w.rootViewController = k
        }
        w.makeKeyAndVisible()
        window = w
        // Ana ekran kisayoluyla acildiysa o modul; false: iOS performActionFor'u
        // bir daha cagirmasin.
        if let k = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            kisayol(k)
            return false
        }
        return true
    }

    func application(_ application: UIApplication, performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        completionHandler(kisayol(shortcutItem))
    }

    @discardableResult
    private func kisayol(_ k: UIApplicationShortcutItem) -> Bool {
        guard let u = KabukDenetleyici.kisayolAdresi(k.type),
              let d = window?.rootViewController as? KabukDenetleyici else { return false }
        d.modulAc(u)
        return true
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        sunucular.baslat()
    }
}
