// Hesap › Bağlantılar ve her yerden erişim, saf mantık ve durum HTML'i: node kabuk/hesap-baglanti.test.js  (✓/✕, çıkış 0/1)
'use strict';
const S = require('./hesap.js');
const B = require('./bilesen.js');
const G = require('./hesap-baglanti.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const SIMDI = new Date(2026, 10, 14, 15, 30).getTime();
const PC = { protocol: 'http:', origin: 'http://127.0.0.1:4180' };
const bag = (o) => Object.assign({ oturum: { ad: 'sahip', rol: 'admin', sunucu: '' }, sunucu: { yerel: true, ev_agi: ['192.168.0.10'] }, dosya: false, simdi: SIMDI }, o || {});
const bos = (o) => Object.assign({ bag: { anahtarlar: [], takvim: { acik: false, yol: null, son: null, yayinlar: [] } }, bagHata: '', takvimSor: null, form: false, formAd: '', formOku: false,
  formHata: '', yeni: null, silSor: null, ileti: null, hata: null, merkezHal: 'yok', merkezMetin: 'Bu cihaz henüz Merkez’e bağlı değil.', android: false, uzak: null, uzakHata: '' }, o || {});
const ciz = (s, b, konum) => { const x = b || bag(); return G.bolumler(s, B, x, G.adresler(x, konum || PC)); };
const ACIK = { acik: true, yol: '/api/hesap/takvim/jeton1.ics', son: new Date(2026, 10, 14, 9, 5).getTime(), yayinlar: [{ ad: 'ays/takvim', adet: 12, zaman: 1 }] };
const ANAHTAR = [{ id: 3, ad: 'iPhone Kısayollar', on_ek: 'lifeos_gIzL', yetki: 'kayit,oku', son: new Date(2026, 10, 13, 9, 5).getTime() }, { id: 4, ad: 'HA', on_ek: 'lifeos_aB', yetki: 'kayit', son: null }];

t('adres: oturum sunucusu > https kökeni > ev ağı; bilgisayarda yerel köken ayrıca, aynıysa tek', () => {
  esit(G.adresler(bag({ oturum: { sunucu: 'https://pc.ts.net/' } }), PC), { ev: 'https://pc.ts.net', pc: 'http://127.0.0.1:4180' });
  esit(G.adresler(bag({ sunucu: { yerel: false } }), { protocol: 'https:', origin: 'https://pc.ts.net' }), { ev: 'https://pc.ts.net', pc: '' });
  esit(G.adresler(bag(), PC), { ev: 'https://192.168.0.10:443', pc: 'http://127.0.0.1:4180' });
  esit(G.adresler(bag({ sunucu: { yerel: true } }), { protocol: 'https:', origin: 'https://pc.ts.net' }), { ev: 'https://pc.ts.net', pc: '' }, 'bilgisayarda https: ikinci adres yok');
  esit(G.adresler(bag({ sunucu: null }), PC), { ev: '', pc: '' });
});
t('tarif isteği: yeni anahtar yazılır, yoksa yer tutucu; ev adresi yoksa elle yazılacak IP', () => {
  esit(G.tarifIstek({ ev: 'https://x:443', pc: '' }, { anahtar: 'lifeos_K' }), { url: 'https://x:443/api/hesap/gelen', pc: '', a: 'lifeos_K' });
  esit(G.tarifIstek({ ev: '', pc: 'http://127.0.0.1:4180' }, null).a, G.YER_TUTUCU);
  dogru(/BİLGİSAYARIN-IP:443\/api\/hesap\/gelen$/.test(G.tarifIstek({ ev: '', pc: '' }, null).url));
});
t('anahtar satırı: ön ek, okuma yetkisi, son kullanım; sil önce sorar', () => {
  const a = G.anahtarSatiri(ANAHTAR[0], SIMDI, null), b = G.anahtarSatiri(ANAHTAR[1], SIMDI, null), sor = G.anahtarSatiri(ANAHTAR[0], SIMDI, 3);
  esit(a.not, 'lifeos_gIzL… · özeti de okur · son kullanım dün 09:05'); esit(b.not, 'lifeos_aB… · hiç kullanılmadı');
  esit(a.eylemler.map(x => x.veri['hb-ac']), ['sil-sor']);
  esit(sor.eylemler.map(x => x.veri['hb-ac'] + ':' + (x.veri.id || '')), ['sil:3', 'vazgec:']);
  [a, b, sor].forEach(x => B.satir(x));
});
t('yükleniyor ve hata: bağlantılar gelmeden «Yükleniyor», hata yeniden denetir', () => {
  dogru(/Yükleniyor/.test(ciz(bos({ bag: null }))));
  const h = ciz(bos({ bag: null, bagHata: 'Bilgisayara ulaşılamıyor.' }));
  dogru(/Bilgisayara ulaşılamıyor/.test(h) && /data-hb-ac="yenile"/.test(h), h);
});
t('takvim kapalı: anlatım ve «Aboneliği aç»; adres yok', () => {
  const h = ciz(bos());
  dogru(/Sınav günlerin takviminde/.test(h) && /data-hb-ac="takvim-ac"/.test(h) && !/jeton/.test(h) && !/AYS|SPİ|ESP/.test(h), h);
});
t('takvim açık: ev ağı ve bilgisayar adresi kopyalanır, son bakış; yenile ve kapat onay ister', () => {
  const h = ciz(bos({ bag: { anahtarlar: [], takvim: ACIK } }));
  dogru(/value="https:\/\/192\.168\.0\.10:443\/api\/hesap\/takvim\/jeton1\.ics"/.test(h) && /value="http:\/\/127\.0\.0\.1:4180\/api\/hesap\/takvim\/jeton1\.ics"/.test(h), 'iki adres');
  dogru(/data-hb-hedef="b-alan-hb-takvim-ev"/.test(h) && /data-hb-hedef="b-alan-hb-takvim-pc"/.test(h), 'kopya düğmeleri alana bağlı');
  dogru(/12 etkinlik/.test(h) && /Takvim en son bugün 09:05 baktı/.test(h) && /Google Takvim/.test(h) && /data-hb-ac="takvim-indir"/.test(h), h);
  dogru(!/data-hb-ac="takvim-yenile"/.test(h) && !/data-hb-ac="takvim-kapat"/.test(h), 'onaysız yenilenmez, kapanmaz');
  const y = ciz(bos({ bag: { anahtarlar: [], takvim: ACIK }, takvimSor: 'yenile' })), k = ciz(bos({ bag: { anahtarlar: [], takvim: ACIK }, takvimSor: 'kapat' }));
  dogru(/Adres yenilensin mi/.test(y) && /data-hb-ac="takvim-yenile"/.test(y) && /data-hb-ac="vazgec"/.test(y), y);
  dogru(/Abonelik kapansın mı/.test(k) && /data-hb-ac="takvim-kapat"/.test(k), k);
  const tel = ciz(bos({ bag: { anahtarlar: [], takvim: ACIK } }), bag({ sunucu: { yerel: false } }), { protocol: 'https:', origin: 'https://pc.ts.net' });
  dogru(/pc\.ts\.net\/api\/hesap\/takvim/.test(tel) && !/hb-takvim-pc/.test(tel), 'telefonda bilgisayar adresi yok');
});
t('anahtar yok: tanıtım, oluştur düğmesi, tarifler yer tutucuyla', () => {
  const h = ciz(bos());
  dogru(/Telefonundan tek satır/.test(h) && /data-hb-ac="form"/.test(h) && /Bearer lifeos_…/.test(h) && /Anahtar oluşturunca burada görünür/.test(h), h);
  dogru(/Home Assistant/.test(h) && /iPhone Kısayollar/.test(h) && /https:\/\/192\.168\.0\.10:443\/api\/hesap\/gelen/.test(h));
});
t('anahtar formu: ad, okuma, parola (type=password); hata gösterilir; parola değeri HTML\'e girmez', () => {
  const h = ciz(bos({ form: true, formAd: 'iPhone', formOku: true, formHata: 'Şifre yanlış.' }));
  dogru(/<form class="b-satir b-satir--form" data-hb-form="anahtar"/.test(h) && /name="hb-ad"[^>]*value="iPhone"/.test(h) && /name="hb-oku"[^>]*checked/.test(h), h);
  dogru(/<input type="password"[^>]*name="hb-parola"[^>]*autocomplete="current-password"/.test(h) && /name="hb-parola"[^>]*value=""/.test(h) && /Şifre yanlış/.test(h) && /type="submit"/.test(h), h);
  dogru(!/data-hb-ac="form"/.test(h), 'açıkken «Anahtar oluştur» yok');
});
t('yeni anahtar bir kez: «hazır», kopya alanı, tarifler dolu; sonra yalnız ön ek', () => {
  const s = bos({ bag: { anahtarlar: ANAHTAR, takvim: ACIK }, yeni: { anahtar: 'lifeos_gIzLiAnAhTaR1', ad: 'iPhone Kısayollar' } });
  const h = ciz(s);
  dogru(/«iPhone Kısayollar» hazır/.test(h) && /bir daha gösterilmez/.test(h) && /id="b-alan-hb-yeni-anahtar"[^>]*value="lifeos_gIzLiAnAhTaR1"[^>]*readonly/.test(h), h);
  dogru(/Bearer lifeos_gIzLiAnAhTaR1/.test(h) && /ozet\.txt/.test(h) && !/Anahtar oluşturunca/.test(h), 'tarif anahtarla dolu');
  dogru(!/data-hb-hedef="[^"]*gIzLi/.test(h) && !/data-[a-z-]+="lifeos_gIzLi/.test(h), 'anahtar data-* niteliğine girmez');
  const sonra = ciz(Object.assign(s, { yeni: null }));
  dogru(!/gIzLiAnAhTaR1/.test(sonra) && /lifeos_gIzL…/.test(sonra) && /özeti de okur/.test(sonra), sonra);
});
t('ileti ve hata kendi bölümünde', () => {
  const h = ciz(bos({ ileti: { yer: 'bag', metin: 'Anahtar silindi; onu kullanan kısayol artık çalışmaz.' }, hata: { yer: 'uzak', metin: 'Ayar yazılamadı.' } }));
  const [b1, b2] = h.split('id="hb-uzak-bolum"');
  dogru(/Anahtar silindi/.test(b1) && !/Ayar yazılamadı/.test(b1) && /Ayar yazılamadı/.test(b2), h);
});
const UZ = { kurulu: true, bagli: true, acik: false, ad: 'pc.tail1.ts.net', funnel: false, acilis: false };
const uz = (s, b) => { const h = ciz(bos(s), b); return h.slice(h.indexOf('id="hb-uzak-bolum"')); };
t('her yerden: Merkez hâli herkese salt okunur, yeniden dene', () => {
  const h = uz({ merkezHal: 'bagli', merkezMetin: 'Bağlı. King bilgisayarındaki modelle konuşuyor.' }, bag({ sunucu: { yerel: false }, oturum: { ad: 'a', rol: 'uye' } }));
  dogru(/b-uyari--tamam/.test(h) && /Bağlı\. King/.test(h) && /data-hb-ac="uzak-bak"/.test(h), h);
  dogru(!/data-hb-ac="uzak-ac"/.test(h) && !/data-hb-ac="acilis"/.test(h) && /bilgisayarın kendisinden, yönetici hesabıyla/.test(h), 'telefonda yönetim yok');
  const and = uz({ merkezHal: 'bilgisayar-kapali', merkezMetin: 'Bilgisayara ulaşılamıyor.', android: true }, bag({ sunucu: { yerel: false } }));
  dogru(/b-uyari--dikkat/.test(and) && /Özel DNS/.test(and), and);
  dogru(/Yükleniyor/.test(uz({ merkezMetin: '' })), 'hâl gelmeden yükleniyor');
});
t('her yerden: bilgisayarda üye yönetemez; admin için kurulu değil, giriş yok, funnel, kapalı, açık', () => {
  dogru(/sahibi \(yönetici\)/.test(uz({ uzak: UZ }, bag({ oturum: { ad: 'u', rol: 'uye' } }))) && !/data-hb-ac="uzak-ac"/.test(uz({ uzak: UZ }, bag({ oturum: { ad: 'u', rol: 'uye' } }))));
  dogru(/Yükleniyor/.test(uz({ uzak: null })), 'durum gelmeden');
  dogru(/İstek yapılamadı/.test(uz({ uzakHata: 'İstek yapılamadı.' })));
  dogru(/Tailscale kurulu değil/.test(uz({ uzak: Object.assign({}, UZ, { kurulu: false }) })));
  dogru(/giriş yapılmamış/.test(uz({ uzak: Object.assign({}, UZ, { bagli: false }) })));
  const f = uz({ uzak: Object.assign({}, UZ, { funnel: true }) });
  dogru(/funnel reset/.test(f) && !/data-hb-ac="uzak-ac"/.test(f), f);
  const k = uz({ uzak: UZ }), a = uz({ uzak: Object.assign({}, UZ, { acik: true, acilis: true }) });
  dogru(/Her yerden erişim · kapalı/.test(k) && /data-hb-ac="uzak-ac"/.test(k) && /aria-pressed="false"[^>]*data-hb-ac="acilis"/.test(k), k);
  dogru(/Her yerden erişim · açık/.test(a) && /pc\.tail1\.ts\.net/.test(a) && /data-hb-ac="uzak-kapat"/.test(a) && /aria-pressed="true"[^>]*data-hb-ac="acilis"/.test(a), a);
});
t('Hesap ekranı: uzantı oturumda Cihazlar\'ın ardına girer, girişsizken yok; jeton çizilmez', () => {
  const L = globalThis.LIFEOS.Kabuk, eski = L.hesapUzanti;
  L.hesapUzanti = [{ ad: 'baglanti', sira: 20, ciz: (b, Bl) => G.bolumler(bos(), Bl, b, G.adresler(b, PC)) }];
  try {
    const durum = { hesap: true, dosya: false, oturum: { ad: 'sahip', rol: 'admin', j: 'GIZLI-JETON', sunucu: '' }, sunucu: { yerel: true }, cihazlar: [], hata: '', cikisSor: false, cikarSor: null,
      bag: null, bagHata: '', qr: '', ileti: '', guncel: null, guncelHata: '', guncelIs: null };
    const h = S.ekran(durum, B, SIMDI);
    dogru(h.indexOf('hs-cihazlar') < h.indexOf('hb-baglantilar') && h.indexOf('hb-baglantilar') < h.indexOf('hb-uzak-bolum') && h.indexOf('hb-uzak-bolum') < h.indexOf('hs-guncel'), 'sıra');
    dogru(!/GIZLI-JETON/.test(h), 'jeton');
    dogru(!/hb-baglantilar/.test(S.ekran(Object.assign({}, durum, { oturum: null }), B, SIMDI)), 'girişsiz');
  } finally { L.hesapUzanti = eski; }
});
t('gelen kutusu: satırlar durumuyla, bekleyen sayılır; boşsa «Henüz bir satır gelmedi»', () => {
  dogru(/Gelen kutusu/.test(ciz(bos())) && /Henüz bir satır gelmedi/.test(ciz(bos())), 'boş kutu');
  const l = [{ id: 1, metin: 'su 250', kaynak: 'iPhone', modul: 'spi', durum: 'onayda', zaman: SIMDI - 60000 },
    { id: 2, metin: '30 dk gitar', modul: 'esp', durum: 'bekliyor', zaman: SIMDI - 120000 },
    { id: 3, metin: 'saçma', modul: 'spi', durum: 'anlasilmadi', zaman: SIMDI - 180000 }];
  const h = ciz(bos({ bag: Object.assign({}, bos().bag, { gelen: l }) }));
  dogru(/3 satır · 1 bekliyor/.test(h), h);
  dogru(/su 250/.test(h) && /Onay bekliyor/.test(h) && /Sırada/.test(h) && !/AYS|SPİ|ESP/.test(h) && /anlaşılmadı/.test(h));
  esit(G.gelenSatiri({ metin: 'x', modul: 'ays', durum: 'onayda', sonuc: 'Kaydedildi' }, SIMDI).not, 'Kaydedildi');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
