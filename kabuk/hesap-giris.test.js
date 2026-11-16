// Hesap ekranının giriş ve güvenlik uzantısı, saf mantık: node kabuk/hesap-giris.test.js  (✓/✕, çıkış 0/1)
'use strict';
const G = require('./hesap-giris.js');
const B = require('./bilesen.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const S = o => Object.assign({ gorunum: 'giris', taslak: {}, hata: null, ileti: null, is: false, soru: '', yedekKip: false, kuruldu: false, uygulama: false }, o);
const BAG = o => Object.assign({ oturum: null, sunucu: { kurulum: false, yerel: true }, dosya: false, simdi: 0 }, o);
const Gv = o => Object.assign({ ben: { soru_var: true, iki_adim: { acik: false, yedek_kalan: 0 } }, benHata: '', acik: null, kurulum: null, qr: '', tel: false,
  yedekler: null, kopya: '', taslak: {}, hata: null, ileti: null, is: false, rol: 'admin' }, o);
const OT = { ad: 'sahip', rol: 'admin' };
const formlar = h => (h.match(/data-hg-form="[a-z-]+"/g) || []).map(x => x.slice(14, -1));

t('şifre gücü: eski panelin ölçüsü (8 altı, zayıf, iyi, güçlü)', () => {
  esit([G.guc(''), G.guc('kisa'), G.guc('abcdefgh'), G.guc('abcdefgh12'), G.guc('Abcdefgh1!'), G.guc('abcdefghijklmnop')], [0, 0, 1, 1, 2, 3]);
  esit(G.GUC[G.guc('abcdefghijkl')], 'Güç: iyi.');
});
t('denetim: her formun ilk eksik alanı, sunucunun sözleriyle', () => {
  esit(G.denetle('giris', { ad: 'a', parola: 'x' }).alan, 'ad');
  esit(G.denetle('giris', { ad: 'sahip', parola: '' }), { alan: 'parola', metin: 'Şifreni yaz.' });
  esit(G.denetle('giris', { ad: ' Ömer.can ', parola: 'x' }), null, 'Türkçe harf, nokta; boşluk kırpılır');
  esit(G.denetle('kur', { ad: 'sahip', yeni: '1234567', tekrar: '1234567', soru: 'Ne?', cevap: 'x' }).metin, 'Şifre en az 8 karakter olmalı.');
  esit(G.denetle('kur', { ad: 'sahip', yeni: '12345678', tekrar: '12345679', soru: 'Ne?', cevap: 'x' }).metin, 'İki şifre aynı değil.');
  esit(G.denetle('kur', { ad: 'sahip', yeni: '12345678', tekrar: '12345678', soru: 'Ne?', cevap: 'x' }).alan, 'soru');
  esit(G.denetle('kur', { ad: 'sahip', yeni: '12345678', tekrar: '12345678', soru: 'İlk okulum?', cevap: ' x ' }).alan, 'cevap');
  esit(G.denetle('kur', { ad: 'sahip', yeni: '12345678', tekrar: '12345678', soru: 'İlk okulum?', cevap: 'Atatürk' }), null);
  esit([G.denetle('kod', { kod: '123 456' }), G.denetle('kod', { kod: '12345' }).alan, G.denetle('bagla', { kod: 'abcdef' }).alan], [null, 'kod', 'kod']);
  esit([G.denetle('yedekkod', { yedekkod: 'AB12-CD34' }), G.denetle('yedekkod', { yedekkod: 'AB12CD34' }), G.denetle('yedekkod', { yedekkod: 'AB12-CD3' }).alan], [null, null, 'yedekkod']);
  esit([G.denetle('iki-kapat', { parola: 'p', kodya: '123456' }), G.denetle('iki-kapat', { parola: 'p', kodya: 'ab12-cd34' }), G.denetle('iki-kapat', { parola: 'p', kodya: '12' }).alan], [null, null, 'kodya']);
  esit(G.denetle('parola', { eski: '', yeni: 'x', tekrar: 'x' }).metin, 'Şimdiki şifreni yaz.');
});
t('ekranda kalan: yalnız ad, soru, adres; şifre, kod ve cevap saklanmaz', () => {
  esit(G.sakla({ ad: 'sahip', parola: 'GIZLI1', yeni: 'GIZLI2', tekrar: 'GIZLI2', eski: 'GIZLI3', kod: '123456', kodya: 'x', yedekkod: 'y', cevap: 'GIZLI4', soru: 'Ne?', adres: '192.168.0.10' }),
    { ad: 'sahip', soru: 'Ne?', adres: '192.168.0.10' });
});
t('giriş: ad + şifre (type=password, current-password), «Şifremi unuttum», «Kodla bağlan»; adres yalnız telefon uygulamasında', () => {
  const h = G.girisHtml(S({ taslak: { ad: 'sahip' } }), BAG(), B);
  esit(formlar(h), ['giris']);
  dogru(/Bu cihazda giriş yapılmadı/.test(h) && /girişsiz de bilgisayardaki depoya/.test(h), h);
  dogru(/<input type="password"[^>]*name="hg-parola"[^>]*value=""[^>]*autocomplete="current-password"/.test(h), 'şifre alanı');
  dogru(/name="hg-ad"[^>]*value="sahip"[^>]*autocomplete="username"/.test(h), 'ad yeniden çizimde kalır');
  dogru(/type="submit"[^>]*>Giriş yap</.test(h) && /data-hg-ne="unuttum"/.test(h) && /data-hg-ne="bagla"/.test(h));
  dogru(!/hg-adres/.test(h), 'tarayıcıda adres sorulmaz');
  dogru(/name="hg-adres"[^>]*inputmode="url"/.test(G.girisHtml(S({ uygulama: true }), BAG({ sunucu: null }), B)), 'uygulamada adres');
  dogru(!/girişsiz de/.test(G.girisHtml(S(), BAG({ sunucu: { yerel: false } }), B)), 'telefonda bilgisayar notu yok');
});
t('giriş: alan hatası alanın altında (aria-invalid), sunucu hatası formun başında; gönderirken düğme kapalı', () => {
  const h = G.girisHtml(S({ hata: { alan: 'parola', metin: 'Şifreni yaz.' } }), BAG(), B);
  dogru(/name="hg-parola" aria-describedby="b-alan-hg-parola-hata" aria-invalid="true"/.test(h) && /<b>Hata:<\/b> Şifreni yaz\./.test(h), h);
  const s = G.girisHtml(S({ ileti: { tur: 'hata', metin: 'Kullanıcı adı ya da şifre yanlış.' }, is: false }), BAG(), B);
  dogru(/role="alert"[^>]*data-hg-ileti="1"/.test(s) && /şifre yanlış/.test(s));
  dogru(/aria-disabled="true">Bekle…/.test(G.girisHtml(S({ is: true }), BAG(), B)) && !/type="submit"/.test(G.girisHtml(S({ is: true }), BAG(), B)), 'çift gönderim yok');
});
t('ilk hesap: kurulumda yalnız «Hesap kur» (şifre gücü ipucu, tekrar, kendi sorusu); bilgisayar dışında form yok', () => {
  const h = G.girisHtml(S(), BAG({ sunucu: { kurulum: true, yerel: true } }), B);
  esit(formlar(h), ['kur']);
  dogru(/henüz hesap yok/.test(h) && /İlk hesap yönetici olur/.test(h) && /type="submit"[^>]*>Hesap kur</.test(h), h);
  dogru(/type="password"[^>]*name="hg-yeni" data-hg-guc="1" aria-describedby="b-alan-hg-yeni-ipucu"[^>]*autocomplete="new-password"/.test(h), 'güç ipucu bağlı');
  dogru(/id="b-alan-hg-yeni-ipucu">En az 8 karakter\./.test(h) && /name="hg-tekrar"/.test(h) && /name="hg-soru"/.test(h) && /name="hg-cevap"[^>]*value=""/.test(h));
  dogru(!/Şifremi unuttum|Kodla bağlan/.test(h), 'hesap yokken giriş yolları yok');
  const tel = G.girisHtml(S(), BAG({ sunucu: { kurulum: true, yerel: false } }), B);
  esit(formlar(tel), []); dogru(/bilgisayarın kendisinde açılır/.test(tel), tel);
  esit(formlar(G.girisHtml(S({ kuruldu: true }), BAG({ sunucu: { kurulum: true, yerel: true } }), B)), ['giris'], 'kurulduysa eski «kurulum» bilgisi geçmez');
});
t('iki adım girişte: kod (numeric, one-time-code) ya da yedek kod; girişe dönülür', () => {
  const h = G.girisHtml(S({ gorunum: 'kod' }), BAG(), B);
  esit(formlar(h), ['kod']);
  dogru(/name="hg-kod"[^>]*autocomplete="one-time-code" inputmode="numeric"/.test(h) && /Yedek kod kullan/.test(h) && /Girişe dön/.test(h), h);
  esit(formlar(G.girisHtml(S({ gorunum: 'kod', yedekKip: true }), BAG(), B)), ['yedekkod']);
});
t('şifremi unuttum: önce ad, sonra kendi sorusu + cevap + yeni şifre; soru kaçışlı', () => {
  esit(formlar(G.girisHtml(S({ gorunum: 'unuttum' }), BAG(), B)), ['soru']);
  const h = G.girisHtml(S({ gorunum: 'unuttum', soru: 'İlk <okul>?' }), BAG(), B);
  esit(formlar(h), ['kurtar']);
  dogru(/İlk &lt;okul&gt;\?/.test(h) && /name="hg-cevap"/.test(h) && /name="hg-yeni"[^>]*new-password/.test(h) && /Şifreyi yenile/.test(h), h);
});
t('kodla bağlan: altı haneli kod, beş dakika notu; uygulamada adresle', () => {
  const h = G.girisHtml(S({ gorunum: 'bagla', uygulama: true }), BAG(), B);
  esit(formlar(h), ['bagla']);
  dogru(/Yeni cihaz bağla/.test(h) && /5 dakika geçerli/.test(h) && /name="hg-adres"/.test(h) && />Bağlan</.test(h), h);
});
t('dosyadan açılınca giriş yok', () => {
  dogru(/dosyadan açıldı/.test(G.girisHtml(S(), BAG({ dosya: true }), B)) && !formlar(G.girisHtml(S(), BAG({ dosya: true }), B)).length);
});
t('güvenlik: yüklenirken bekler, hata yeniden denenir; satırlar şifre, kurtarma sorusu, iki adım', () => {
  dogru(/aria-busy/.test(G.guvenlikHtml(Gv({ ben: null }), BAG({ oturum: OT }), B)));
  dogru(/data-hg-ac="ben-yenile"/.test(G.guvenlikHtml(Gv({ ben: null, benHata: 'Bilgisayara ulaşılamadı; Başbuğ açık mı?' }), BAG({ oturum: OT }), B)));
  const h = G.guvenlikHtml(Gv(), BAG({ oturum: OT }), B);
  dogru(/aria-labelledby="hg-guvenlik"/.test(h) && /Kapalı: girişte yalnız şifre/.test(h) && /data-hg-ne="iki-ac"/.test(h) && /data-hg-ne="parola"/.test(h), h);
  esit(formlar(h), [], 'formlar kapalıyken çizilmez');
  dogru(/Ayarlı değil/.test(G.guvenlikHtml(Gv({ ben: { soru_var: false, iki_adim: { acik: false } } }), BAG({ oturum: OT }), B)));
});
t('güvenlik: bir form açıkken tek form, öteki düğmeler gizli; Vazgeç var', () => {
  [['parola', ['parola']], ['soru-ayarla', ['soru-ayarla']], ['iki-ac', ['iki-ac']]].forEach(([a, f]) => {
    const h = G.guvenlikHtml(Gv({ acik: a }), BAG({ oturum: OT }), B);
    esit(formlar(h), f, a); dogru(/data-hg-ac="kapat"/.test(h) && !/data-hg-ac="ac"/.test(h), a);
  });
  const p = G.guvenlikHtml(Gv({ acik: 'parola' }), BAG({ oturum: OT }), B);
  dogru(/name="hg-eski"[^>]*current-password/.test(p) && /name="hg-yeni"[^>]*new-password/.test(p) && /name="hg-tekrar"/.test(p));
});
t('iki adım açık: kalan yedek kod, az kalınca uyarı; kapatma ve yenileme onaylı (şifre + kod, «hemen geçersiz»)', () => {
  const ben = { soru_var: true, iki_adim: { acik: true, yedek_kalan: 2 } };
  const h = G.guvenlikHtml(Gv({ ben }), BAG({ oturum: OT }), B);
  dogru(/Açık · 2 yedek kod kaldı · yenilerini al/.test(h) && /data-hg-ne="yedek"/.test(h) && /data-hg-ne="iki-kapat"/.test(h) && /bilgisayarın kendisinden kurtarılır/.test(h) && !/python/.test(h), h);
  dogru(/yönetici Hesap › Kullanıcılar/.test(G.guvenlikHtml(Gv({ ben, rol: 'uye' }), BAG({ oturum: OT }), B)));
  const k = G.guvenlikHtml(Gv({ ben, acik: 'iki-kapat' }), BAG({ oturum: OT }), B);
  esit(formlar(k), ['iki-kapat']); dogru(/name="hg-parola"/.test(k) && /name="hg-kodya"/.test(k) && /yalnız şifre sorulur/.test(k), k);
  const y = G.guvenlikHtml(Gv({ ben, acik: 'yedek' }), BAG({ oturum: OT }), B);
  esit(formlar(y), ['yedek']); dogru(/hemen geçersiz/.test(y));
});
t('iki adım kurulumu: QR, dörtlü anahtar, kod formu; telefonda otpauth bağlantısı (kaçışlı); Vazgeç kurulumu bırakır', () => {
  const k = { sir: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/LifeOS:sahip?secret=JBSWY3DPEHPK3PXP&issuer=LifeOS' };
  const h = G.guvenlikHtml(Gv({ kurulum: k, qr: '<svg class="qr"></svg>' }), BAG({ oturum: OT }), B);
  esit(formlar(h), ['iki-onay']);
  dogru(/<svg class="qr">/.test(h) && /JBSW Y3DP EHPK 3PXP/.test(h) && /Doğrula ve aç/.test(h) && /data-hg-ac="kur-vazgec"/.test(h) && !/href="otpauth/.test(h), h);
  const tel = G.guvenlikHtml(Gv({ kurulum: k, tel: true }), BAG({ oturum: OT }), B);
  dogru(/href="otpauth:\/\/totp\/LifeOS:sahip\?secret=JBSWY3DPEHPK3PXP&amp;issuer=LifeOS"/.test(tel) && /anahtarı elle gir/.test(tel), tel);
  esit(G.sirYaz('ABCDEFGHIJ'), 'ABCD EFGH IJ');
});
t('yedek kodlar: bir kez gösterilir notu, kodlar listede, «Kaydettim»; o sırada başka form yok', () => {
  const h = G.guvenlikHtml(Gv({ ben: { soru_var: true, iki_adim: { acik: true, yedek_kalan: 10 } }, yedekler: ['AB12-CD34', 'EF56-GH78'] }), BAG({ oturum: OT }), B);
  dogru(/bir kez gösterilir/.test(h) && /<code data-hg-yedek>AB12-CD34<\/code> · <code data-hg-yedek>EF56-GH78<\/code>/.test(h) && /data-hg-ac="kaydettim"/.test(h) && /Kodları kopyala/.test(h), h);
  esit(formlar(h), []); dogru(!/data-hg-ac="ac"/.test(h));
});
t('hata cümlesi: ulaşılamıyor (uygulamada Wi-Fi), yoksa sunucunun cümlesi (401 de: yanlış şifre oturum bitti değildir)', () => {
  esit(G.hataMetni({ kod: 0 }), 'Bilgisayara ulaşılamadı; Başbuğ açık mı?');
  dogru(/Wi-Fi/.test(G.hataMetni({ kod: 0 }, true)));
  esit(G.hataMetni({ kod: 401, message: 'Kullanıcı adı ya da şifre yanlış.' }), 'Kullanıcı adı ya da şifre yanlış.');
  esit(G.hataMetni(null), 'İstek yapılamadı.');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
