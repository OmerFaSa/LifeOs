// Hesap yönetimi (kabuk/hesap-yonetim.js) saf mantık ve durum çizimleri: node kabuk/hesap-yonetim.test.js  (✓/✕, çıkış 0/1)
'use strict';
require('./hesap.js');
const Y = require('./hesap-yonetim.js');
const B = require('./bilesen.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const SIMDI = new Date(2026, 10, 14, 15, 30).getTime(), GUN = 86400000;
const ADMIN = { oturum: { ad: 'sahip', gorunen_ad: 'Sahip', rol: 'admin', sunucu: '' }, sunucu: { yerel: true }, dosya: false, simdi: SIMDI };
const UYE = Object.assign({}, ADMIN, { oturum: { ad: 'ece', gorunen_ad: 'Ece', rol: 'uye', sunucu: '' } });
const TELEFON = Object.assign({}, ADMIN, { sunucu: { yerel: false } });
const BEN = { kullanici: { id: 1, ad: 'sahip', gorunen_ad: 'Sahip', renk: 'mor', rol: 'admin', hitap: '', dogum: '', eposta: '' }, renkler: ['mavi', 'mor', 'bilinmez'],
  planlar: [{ id: 'temel', ad: 'Temel' }, { id: 'pro', ad: 'Pro' }], soru_var: false, iki_adim: { acik: false }, ayrinti: { gun: { n: 12, bayt: 2048 } }, yedek: { son: SIMDI - GUN, hata: '' } };
const YEDEK = { yerel: true, klasor: 'C:\\x\\yedek', saklama: { gunluk: 7 }, hata: '', ikinci: { acik: false },
  yedekler: [{ ad: 'hesap-elle-20261114-150000.db', tur: 'elle', zaman: new Date(2026, 10, 14, 15, 0).getTime(), bayt: 40960 }] };
const KUL = [{ id: 1, ad: 'sahip', gorunen_ad: 'Sahip', rol: 'admin', plan: 'temel', plan_ad: 'Temel', son: SIMDI }, { id: 2, ad: 'ece', gorunen_ad: 'Ece', rol: 'uye', plan: 'temel', plan_ad: 'Temel', son: null, iki_adim: true }];
const dolu = (ek) => Object.assign({ ben: BEN, etkinlik: [], cihazlar: [{ id: 7, bu: true, son: SIMDI }], uyari: { liste: [], yeni: [] }, kul: KUL, kayit: true, yedek: YEDEK,
  ileti: null, is: '', acik: {}, taslak: {} }, ek || {});
const metin = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

t('yardımcılar: tarih-saat, boyut, yanlış deneme yalnız son 7 gün', () => {
  esit(Y.tarihSaat(new Date(2026, 10, 2, 8, 5).getTime()), '2 Kasım 2026 · 08:05');
  esit([Y.boyut(512), Y.boyut(40960), Y.boyut(3 * 1048576)], ['512 B', '40 KB', '3 MB']);
  esit(Y.yanlisSayisi([{ tur: 'yanlis', zaman: SIMDI - GUN }, { tur: 'yanlis', zaman: SIMDI - 8 * GUN }, { tur: 'giris', zaman: SIMDI }], SIMDI), 1);
});
t('yedek hatası: alınamadı, iki günden eski, ikinci yer; ilk yedek yokken dikkat yok', () => {
  esit(Y.yedekHatasi({ hata: 'x' }, SIMDI), 'Son yedek alınamadı');
  esit(Y.yedekHatasi({ son: SIMDI - 3 * GUN }, SIMDI), '3 gündür yedek yok');
  esit(Y.yedekHatasi({ son: SIMDI, ikinci_hata: 'y' }, SIMDI), 'İkinci yere yazılamadı');
  esit([Y.yedekHatasi({ son: null }, SIMDI), Y.yedekHatasi(null, SIMDI)], ['', '']);
});
t('güvenlik kontrolü: bilinmeyen kilit yazılmaz; iki adım kapalı ve soru yoksa öneri; yedek satırı yalnız admine', () => {
  esit(Y.kontrol({}, SIMDI), [], 'veri yokken boş');
  const l = Y.kontrol({ ben: BEN, cihazlar: [{ bu: true }, { bu: false, son: SIMDI - 40 * GUN }], etkinlik: [{ tur: 'yanlis', zaman: SIMDI }] }, SIMDI);
  esit(l.map(x => x.ad + ':' + x.dikkat), ['İki adımlı doğrulama:true', 'Kurtarma sorusu:true', 'Oturum açık cihazlar:true', 'Son 7 gün:true', 'Hesap deposunun yedeği:false']);
  esit(l[2].not, '1 cihaz 30 gündür görünmedi');
  const uye = Y.kontrol({ ben: Object.assign({}, BEN, { kullanici: { rol: 'uye' }, iki_adim: { acik: true, yedek_kalan: 2 }, soru_var: false }) }, SIMDI);
  esit(uye.map(x => x.ad + ':' + x.dikkat + ':' + x.not), ['İki adımlı doğrulama:true:2 yedek kod kaldı', 'Kurtarma sorusu:false:Ayarlı değil'], 'iki adım açıkken soru öneri değil');
});
t('etkinlik satırı: tür adı, zaman, cihaz/adres; yanlış deneme işaretli', () => {
  const o = Y.olaySatiri({ tur: 'yanlis', zaman: SIMDI - 60000, cihaz_ad: 'iPhone', ip: '127.0.0.1', ayrinti: '' }, SIMDI);
  esit([o.ad, o.not, o.pul && o.pul.metin], ['Yanlış şifre', 'bugün 15:29 · iPhone · Bu bilgisayar', 'dikkat']);
  esit(Y.olaySatiri({ tur: 'otekiler', zaman: SIMDI, ayrinti: '2', cihaz_ad: 'PC' }, SIMDI).not, 'bugün 15:30 · 2 cihaz · PC');
  esit(Y.olaySatiri({ tur: 'yeni-tur', zaman: SIMDI }, SIMDI).ad, 'yeni-tur', 'bilinmeyen tür adıyla');
});
t('sistem özeti: çalışıyor, güncel, bakılamadı, engel, yenilik (şifreli form)', () => {
  esit(Y.sistemOzet({ calisiyor: true }).tur, 'bilgi');
  esit(Y.sistemOzet({ durum: 'ok', geride: 0, surum: { tarih: '14.11.2026' } }), { tur: 'tamam', metin: 'Güncel', alt: 'sürüm 14.11.2026' });
  dogru(Y.sistemOzet({ durum: 'ok', geride: 0, ag: false }).yeniden, 'ağ yokken «güncel» denmez');
  esit(Y.sistemOzet({ durum: 'ok', geride: 2, engel: 'Yerel değişiklik var' }).alt, 'Yerel değişiklik var');
  const y = Y.sistemOzet({ durum: 'ok', geride: 3, yeni: ['a', 'b', 'c', 'd'] });
  esit([y.metin, y.alt, y.form], ['3 yenilik var', 'a · b · c', true]);
});
t('görünürlük: girişsiz hiçbir şey; üye yönetim bölümlerini görmez; telefondan güncelleme yalnız uzak admin', () => {
  esit(Y.ekran(dolu(), Object.assign({}, ADMIN, { oturum: null }), B, SIMDI), '');
  const a = Y.ekran(dolu(), ADMIN, B, SIMDI), u = Y.ekran(dolu(), UYE, B, SIMDI), tel = Y.ekran(dolu(), TELEFON, B, SIMDI);
  ['hy-profil', 'hy-guvenlik', 'hy-yedek', 'hy-kullanicilar', 'hy-veri'].forEach(id => dogru(a.indexOf('id="' + id + '"') >= 0, id));
  dogru(a.indexOf('hy-sistem') < 0, 'bilgisayarda telefondan güncelleme yok');
  dogru(u.indexOf('hy-yedek') < 0 && u.indexOf('hy-kullanicilar') < 0 && u.indexOf('hy-sistem') < 0 && u.indexOf('hy-profil') >= 0, 'üye');
  dogru(tel.indexOf('id="hy-sistem"') >= 0, 'telefonda admin');
  dogru(!Y.sistemGorunur(Object.assign({}, TELEFON, { sunucu: null })), 'sunucu bilinmiyorken gösterilmez');
});
t('yüklenirken ve hata: «Yükleniyor…», hata «Yeniden dene» ile', () => {
  const h = Y.ekran({ acik: {}, taslak: {} }, ADMIN, B, SIMDI);
  dogru((h.match(/Yükleniyor…/g) || []).length >= 4, 'yükleniyor');
  dogru(!/Hesabın iyi korunuyor/.test(h), 'veri yokken «iyi korunuyor» denmez');
  const e = Y.ekran({ benHata: 'Bilgisayara ulaşılamıyor.', kulHata: 'Kullanıcı listesini yalnız admin görür.', acik: {}, taslak: {} }, ADMIN, B, SIMDI);
  dogru(/Bilgisayara ulaşılamıyor/.test(e) && /yalnız admin görür/.test(e) && /data-hy-ac="yeniden"/.test(e));
});
t('profil: görünen ad, yalnız bilinen renkler, kişisel bilgiler; yazılan taslak korunur', () => {
  const h = Y.ekran(dolu({ taslak: { 'hy-gorunen': 'Yeni ad' } }), ADMIN, B, SIMDI);
  dogru(/data-hy-form="profil"/.test(h) && /value="Yeni ad"/.test(h), 'taslak');
  dogru(/value="mor" checked/.test(h) && !/bilinmez/.test(h), 'renk');
  dogru(/type="email"/.test(h) && /type="date"/.test(h) && /King sana nasıl seslensin/.test(h));
});
t('şifre alanları: type=password, değer hiç taşınmaz; dosya alanı .db', () => {
  const h = Y.ekran(dolu({ silSor: true, taslak: { 'hy-sil-sifre': 'gizli' } }), ADMIN, B, SIMDI);
  dogru(/id="b-alan-hy-sil-sifre"[^>]*type="password"|type="password"[^>]*id="b-alan-hy-sil-sifre"/.test(h), 'sil şifresi');
  dogru(h.indexOf('gizli') < 0, 'şifre taslağa girse bile çizilmez');
  dogru(/autocomplete="new-password"/.test(h), 'geçici şifre new-password');
  dogru(/type="file" accept="\.db/.test(h), 'dosya');
});
t('güvenlik: yeni uyarı «Bendim/İncele»; öneri özeti; öteki cihazlardan çıkış onaylı', () => {
  const u = { liste: [], yeni: [{ id: 5, tur: 'yanlis', zaman: SIMDI, ip: '10.0.0.2' }, { id: 4, tur: 'giris', zaman: SIMDI }] };
  const c = [{ id: 7, bu: true, son: SIMDI }, { id: 9, bu: false, son: SIMDI }];
  const h = metin(Y.ekran(dolu({ uyari: u, cihazlar: c }), ADMIN, B, SIMDI));
  dogru(/Yanlış şifre denemesi/.test(h) && /1 olay daha/.test(h) && /Bendim/.test(h) && /İncele/.test(h), h);
  dogru(/2 öneri var/.test(h), 'iki adım + soru');
  dogru(/Öteki cihazların hepsinden çık/.test(h) && !/Hepsinden çık/.test(h), 'önce soru düğmesi');
  const sor = metin(Y.ekran(dolu({ cihazlar: c, otekiSor: true }), ADMIN, B, SIMDI));
  dogru(/Öteki 1 cihazda oturum kapanır/.test(sor) && /Hepsinden çık/.test(sor) && /Vazgeç/.test(sor));
  dogru(!/hepsinden çık/i.test(metin(Y.ekran(dolu(), ADMIN, B, SIMDI))), 'öteki cihaz yoksa düğme yok');
});
t('yedekler: liste, şimdi yedekle, bilgisayarda indir/geri yükle; uzaktan yalnız liste', () => {
  const h = Y.ekran(dolu(), ADMIN, B, SIMDI), m = metin(h);
  dogru(/14 Kasım 2026 · 15:00/.test(m) && /Elle alındı · 40 KB/.test(m) && /Şimdi yedekle/.test(m), m);
  dogru(/data-hy-ac="indir-sor"/.test(h) && /data-hy-ac="geri-sor"/.test(h) && /İkinci yeri ayarla/.test(m) && /Dosyadan yükle/.test(m));
  const u = Y.ekran(dolu({ yedek: Object.assign({}, YEDEK, { yerel: false, klasor: '' }) }), TELEFON, B, SIMDI);
  dogru(!/indir-sor|geri-sor|data-hy-form="ikinci"|data-hy-form="yukle"/.test(u) && /yalnız bilgisayarın kendisinden/.test(u));
});
t('geri yükleme onayı: ne değişir, önce şimdiki hâlin yedeği, herkes yeniden girer, şifre', () => {
  const g = { ad: 'x.db', zaman: new Date(2026, 10, 14, 15, 0).getTime(), yedek: { kullanici: 1, kayit: 10 }, simdi: { kullanici: 2, kayit: 25 } };
  const m = metin(Y.ekran(dolu({ geriOnay: g }), ADMIN, B, SIMDI));
  dogru(/Hesap deposu 14 Kasım 2026 · 15:00 hâline döner/.test(m) && /Yedekte 1 kullanıcı, 10 kayıt; şimdi 2 kullanıcı, 25 kayıt/.test(m), m);
  dogru(/Önce şimdiki hâlin yedeği alınır/.test(m) && /Bütün cihazlar \(bu cihaz da\) yeniden giriş yapar/.test(m) && /Onay için şifren/.test(m) && /Geri yükle/.test(m) && /Vazgeç/.test(m));
  const i = metin(Y.ekran(dolu({ indirOnay: YEDEK.yedekler[0] }), ADMIN, B, SIMDI));
  dogru(/yedeğini indir/.test(i) && /şifre özetlerini/.test(i) && /Onay için şifren/.test(i));
});
t('kullanıcılar: kayıt aç/kapa, liste (sen işaretli), yönet paneli rol/plan/iki adım; kullanıcı ekle', () => {
  const m = metin(Y.ekran(dolu(), ADMIN, B, SIMDI));
  dogru(/Yeni hesap açılabilir/.test(m) && /Herkes kendi hesabını açar/.test(m) && /@ece · Üye · Temel · son görülme hiç/.test(m) && /sen/.test(m) && /Kullanıcı ekle/.test(m), m);
  const k = Y.ekran(dolu({ kisi: 2 }), ADMIN, B, SIMDI);
  dogru(/data-hy-ac="yonet" data-id="2" data-alan="rol" data-deger="admin"/.test(k) && /aria-pressed="true"[^>]*data-deger="uye"/.test(k), 'rol düğmeleri');
  dogru(/data-alan="plan" data-deger="pro"/.test(k) && /data-hy-ac="iki-kapat"/.test(k), 'plan ve iki adım');
  dogru(!/iki-kapat/.test(Y.ekran(dolu({ kisi: 1, kul: KUL.map(u => Object.assign({}, u, { iki_adim: true })) }), ADMIN, B, SIMDI)), 'kendi iki adımı buradan kapanmaz');
});
t('dışa aktar ve sil: indir satırı kayıt sayısıyla; silme iki adımlı, geri alınamaz der, şifre ister', () => {
  const m = metin(Y.ekran(dolu(), ADMIN, B, SIMDI));
  dogru(/Bilgisayardaki kopyanın tamamı · 12 kayıt · 2 KB · tek JSON dosyası/.test(m) && /Hesabı sil/.test(m) && !/Onay için şifren/.test(m), m);
  const s = metin(Y.ekran(dolu({ silSor: true }), ADMIN, B, SIMDI));
  dogru(/Hesabın kalıcı olarak silinir/.test(s) && /Geri alınamaz/.test(s) && /Silinir: bilgisayardaki kopya \(12 kayıt\), 1 cihazdaki oturum/.test(s) && /Kalır: her cihazdaki veri/.test(s), s);
  dogru(/Hesabı kalıcı olarak sil/.test(s) && /Vazgeç/.test(s));
});
t('telefondan güncelleme: yenilik varsa şifreli form, sonuç hatası, yeniden kontrol', () => {
  const y = metin(Y.ekran(dolu({ sistem: { durum: 'ok', geride: 2, yeni: ['A'] } }), TELEFON, B, SIMDI));
  dogru(/2 yenilik var/.test(y) && /Bilgisayarı güncelle/.test(y) && /Kayıtlarına dokunmaz/.test(y), y);
  const h = metin(Y.ekran(dolu({ sistem: { durum: 'ok', geride: 2, sonuc: { durum: 'hata', mesaj: 'İndirilemedi.' } } }), TELEFON, B, SIMDI));
  dogru(/İndirilemedi/.test(h));
  dogru(/Yeniden kontrol et/.test(metin(Y.ekran(dolu({ sistem: { durum: 'hata', mesaj: 'GitHub yok' } }), TELEFON, B, SIMDI))));
});
t('iş sürerken gönder düğmeleri kapalı (çift gönderim yok); ileti doğru bölümde', () => {
  const h = Y.ekran(dolu({ is: 'profil', ileti: { yer: 'yedek', tur: 'tamam', metin: 'Yedek alındı.' } }), ADMIN, B, SIMDI);
  dogru(!/type="submit"/.test(h) && /aria-disabled="true"/.test(h), 'submit kilitli');
  const yedekBolum = h.slice(h.indexOf('id="hy-yedek"'), h.indexOf('id="hy-kullanicilar"'));
  dogru(/Yedek alındı/.test(yedekBolum) && h.indexOf('Yedek alındı') === h.lastIndexOf('Yedek alındı'));
});
t('göç: admin Yedekler\'de «Bu cihazdakileri tek depoya taşı», gönderince makbuz; üye görmez', () => {
  const a = Y.ekran(dolu(), ADMIN, B, SIMDI), u = Y.ekran(dolu(), UYE, B, SIMDI);
  dogru(/Bu cihazdakileri tek depoya taşı/.test(a) && /data-hy-ac="goc"/.test(a) && /Bilgisayara gönder/.test(a), 'admin görür');
  dogru(!/data-hy-ac="goc"/.test(u), 'üye görmez');
  const m = { profil: 2, kayit: 1200, anahtar: 30, medya: 4, bekleyen: { spi: 3, ays: 1 } };
  esit(Y.gocMakbuz(m), 'Gönderildi · 2 profil, 1.200 kayıt, 30 yan kayıt, 4 dosya · bekleyen 4');
  const g = Y.ekran(dolu({ goc: m }), ADMIN, B, SIMDI);
  dogru(/Yeniden gönder/.test(g) && /1\.200 kayıt/.test(g));
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
