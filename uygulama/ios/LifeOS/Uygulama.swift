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
            w.rootViewController = k
        }
        w.makeKeyAndVisible()
        window = w
        return true
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        sunucular.baslat()
    }
}
