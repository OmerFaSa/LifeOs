// Hesap ekranı saf mantık testleri: node kabuk/hesap.test.js  (✓/✕, çıkış 0/1)
'use strict';
const S = require('./hesap.js');
const B = require('./bilesen.js');
const H = require('./harita.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const SIMDI = new Date(2026, 10, 14, 15, 30).getTime();
const bos = () => ({ hesap: true, dosya: false, oturum: null, sunucu: { yerel: true, kurulum: false }, cihazlar: null, hata: '', cikisSor: false, cikarSor: null,
  bag: null, bagHata: '', qr: '', ileti: '', guncel: null, guncelHata: '', guncelIs: null });
const CIHAZ = [{ id: 7, cihaz_ad: 'Windows PC', bu: true, son: SIMDI, olusturma: new Date(2026, 10, 14, 14, 5).getTime() },
  { id: 9, cihaz_ad: 'iPhone', bu: false, son: new Date(2026, 10, 13, 9, 5).getTime() }];

t('zaman: bugün, dün, gün adı; başka yıl yıllı; yoksa «hiç»', () => {
  esit(S.sonMetni(new Date(2026, 10, 14, 9, 5).getTime(), SIMDI), 'bugün 09:05');
  esit(S.sonMetni(new Date(2026, 10, 13, 23, 59).getTime(), SIMDI), 'dün 23:59');
  esit(S.sonMetni(new Date(2026, 10, 2, 8, 0).getTime(), SIMDI), '2 Kasım');
  esit(S.sonMetni(new Date(2025, 0, 3).getTime(), SIMDI), '3 Ocak 2025');
  esit(S.sonMetni(null, SIMDI), 'hiç');
});
t('bağlama kodu: üçe üç yazılır, kalan süre dakika:saniye, eksiye düşmez', () => {
  esit(S.kodYaz('482913'), '482 913');
  esit(S.kalanMetni(SIMDI + 299500, SIMDI), '5:00 kaldı');
  esit(S.kalanMetni(SIMDI + 61000, SIMDI), '1:01 kaldı');
  esit(S.kalanMetni(SIMDI - 5000, SIMDI), '0:00 kaldı');
});
t('QR adresi: oturum sunucusu > https kökeni > Tailscale adı; yerel http\'de yok; kod altı hane olmalı', () => {
  esit(S.bagAdresi('482913', 'https://pc.ts.net', { protocol: 'http:', origin: 'http://127.0.0.1:4180' }, ['x']), 'https://pc.ts.net/?bagla=482913');
  esit(S.bagAdresi('482913', '', { protocol: 'https:', origin: 'https://pc.ts.net' }, []), 'https://pc.ts.net/?bagla=482913');
  esit(S.bagAdresi('482913', '', { protocol: 'http:', origin: 'http://127.0.0.1:4180' }, ['pc.tail.ts.net']), 'https://pc.tail.ts.net:443/?bagla=482913');
  esit(S.bagAdresi('482913', '', { protocol: 'http:', origin: 'http://127.0.0.1:4180' }, []), '');
  esit(S.bagAdresi('48a913"', 'https://pc.ts.net', null, null), '', 'kod biçimsizse adres yok');
});
t('hata cümlesi: 401 yeniden giriş, 0 ulaşılamıyor, yoksa sunucunun cümlesi', () => {
  dogru(/yeniden giriş/.test(S.hataMetni({ kod: 401 })));
  esit(S.hataMetni({ kod: 0 }), 'Bilgisayara ulaşılamıyor.');
  esit(S.hataMetni({ kod: 404, message: 'Bu cihaz artık listede yok.' }), 'Bu cihaz artık listede yok.');
});
t('cihaz satırı: bu cihaz çıkarılmaz; öteki önce sorar, sonra onaylı «Evet, çıkar»', () => {
  const bu = S.cihazSatiri(CIHAZ[0], SIMDI, null), o = S.cihazSatiri(CIHAZ[1], SIMDI, null), sor = S.cihazSatiri(CIHAZ[1], SIMDI, 9);
  dogru(!bu.eylemler && bu.pul.metin === 'bu cihaz' && /bugün 14:05/.test(bu.not), JSON.stringify(bu));
  esit(o.eylemler.map(x => x.veri['hs-ac']), ['cikar-sor']); esit(o.not, 'son görülme dün 09:05');
  esit(sor.eylemler.map(x => x.veri['hs-ac'] + ':' + (x.veri.id || '')), ['cikar:9', 'vazgec:']);
  dogru(/kayıtlar silinmez/.test(sor.not));
  [bu, o, sor].forEach(x => B.satir(x)); // katalog kabul eder
});
t('güncelleme özeti: güncel, yenilik, ayrışmış dal, zip, git yok, bozuk cevap', () => {
  esit(S.guncelOzet({ durum: 'ok', geride: 0, ag: true }).tur, 'tamam');
  esit([S.guncelOzet({ durum: 'ok', geride: 3 }).metin, S.guncelOzet({ durum: 'ok', geride: 3 }).eylem], ['3 yenilik var.', 'guncelle']);
  esit(S.guncelOzet({ durum: 'ok', geride: 2, ileride: 1, yedeklenebilir: true }).eylem, 'yedekle');
  esit(S.guncelOzet({ durum: 'git-degil' }).eylem, 'guncelle');
  esit([S.guncelOzet({ durum: 'git-yok', mesaj: 'm' }).eylem, S.guncelOzet({ durum: 'git-yok' }).tur], [null, 'dikkat']);
  esit(S.guncelOzet(null).tur, 'hata');
  dogru(/GitHub'a ulaşılamadı/.test(S.guncelOzet({ durum: 'ok', geride: 0, ag: false }).alt));
  esit(S.surumMetni({ tarih: '14.11.2026', kisa: 'e20f8b0' }), '14.11.2026 · e20f8b0'); dogru(/zip/.test(S.surumMetni(null)));
});
t('ekran: girişsiz cihaz (giriş uzantısı yokken) giriş yapılmadı der, cihaz bölümü ve eski panel yok', () => {
  const h = S.ekran(bos(), B, SIMDI);
  dogru(/Bu cihazda giriş yapılmadı/.test(h) && !/kartlar/.test(h) && !/hs-cihazlar/.test(h), h);
  dogru(/henüz hesap yok/.test(S.ekran(Object.assign(bos(), { sunucu: { kurulum: true } }), B, SIMDI)));
  dogru(/Güncellemeyi denetle/.test(h));
});
t('ekran: oturumda ad, rol, bu cihaz, çıkış onayı; jeton ve oturumun başka alanı HTML\'e girmez', () => {
  const s = Object.assign(bos(), { oturum: { ad: 'sahip', gorunen_ad: 'Tolga', rol: 'admin', j: 'GIZLI-JETON-123', sunucu: '' }, cihazlar: CIHAZ });
  const h = S.ekran(s, B, SIMDI);
  dogru(/Tolga · @sahip/.test(h) && />Admin</.test(h) && />Windows PC</.test(h), h);
  dogru(!/GIZLI-JETON/.test(h), 'jeton ekrana çizildi');
  dogru(/data-hs-ac="cikis-sor"/.test(h) && !/data-hs-ac="cikis"/.test(h), 'çıkış tek dokunuşla olmamalı');
  dogru(/data-hs-ac="cikis"/.test(S.ekran(Object.assign(s, { cikisSor: true }), B, SIMDI)), 'onay adımı');
});
t('ekran: yeni cihaz kodu, süre ve QR; süresi dolunca yeni kod; bağlanınca ad', () => {
  const s = Object.assign(bos(), { oturum: { ad: 'a', rol: 'uye' }, cihazlar: CIHAZ, bag: { kod: '482913', id: 1, bitis: SIMDI + 120000, durum: 'bekliyor' }, qr: '<svg class="qr"></svg>' });
  const h = S.ekran(s, B, SIMDI);
  dogru(/482 913/.test(h) && /2:00 kaldı/.test(h) && /<svg class="qr">/.test(h) && !/data-hs-ac="bag"/.test(h), h);
  dogru(/her yerden erişimle/.test(S.ekran(Object.assign({}, s, { qr: '' }), B, SIMDI)), 'QR yoksa nedeni söylenir');
  dogru(/Yeni kod/.test(S.ekran(Object.assign({}, s, { bag: { durum: 'bitti' } }), B, SIMDI)));
  dogru(/iPad bağlandı/.test(S.ekran(Object.assign({}, s, { bag: { durum: 'baglandi', cihaz_ad: 'iPad' } }), B, SIMDI)));
});
t('ekran: güncelleme sonucu; güncelle düğmesi yalnız bu bilgisayarda', () => {
  const g = { durum: 'ok', geride: 2, yeni: ['Yeni ekran', 'Düzeltme'], surum: { tarih: '14.11.2026', kisa: 'abc1234' } };
  const pc = S.ekran(Object.assign(bos(), { guncel: g }), B, SIMDI), tel = S.ekran(Object.assign(bos(), { guncel: g, sunucu: { yerel: false } }), B, SIMDI);
  dogru(/14\.11\.2026 · abc1234/.test(pc) && /2 yenilik var/.test(pc) && /data-hs-ac="guncelle"/.test(pc) && /Yeni ekran/.test(pc), pc);
  dogru(!/data-hs-ac="guncelle"/.test(tel) && /bu bilgisayardan başlatılır/.test(tel), tel);
  dogru(/dosyadan açıldı/.test(S.ekran(Object.assign(bos(), { hesap: false, dosya: true }), B, SIMDI)));
});
t('harita: Hesap Ayarlar dalında, yeni; eski panel yeri kalktı, panel Hesap ekranından açılır (kural 5)', () => {
  const y = H.bul('hesap');
  esit([y.dal, y.yol, y.durum, H.bul('eskisistem')], ['ayarlar', '#/hesap', 'yeni', null]);
  dogru(!/kartlar/.test(S.ekran(bos(), B, SIMDI)), 'eski panel bağlantısı kalktı');
  esit(H.denetle(), []);
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
