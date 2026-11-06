/* ÖĞRENME MOTORU — bir konuyu baştan sona öğrenmenin ortak akışı (AYS, SPİ, ESP).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ogrenmotor.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Ekranı
   `ogrenmotor-ekran.js`, testi `ogrenmotor.test.js`.
   Plan ve dayanaklar: `belgeler/ekip/OGRENME-MOTORU.md`.
   ==================================================================

   Kullanıcı (2026-11-06): «kişinin çok rahat anlayacağı, her konuda; sistemdeki
   bilgi ve sistemde olmayan bilgiler dahil anlayıp kavraması için eylemler,
   anlatım biçimi, teknikler». Var olan parçalar ayrı ayrı duruyordu: anlatım
   okunuyor, sorular çözülüyor, kalıcılık ayrı ölçülüyor; aralarında yol yoktu.
   Motor onları tek akışa bağlar: tahmin → anlatım → açıklama → örnek → yoklama →
   onarım → anlatma → aktarım → aralıklı tekrar. Ölçek `usta.js`'indir, yeni ölçek yok.

   Konu biçimi (modülün bağlantısı verir; yalnız `id`, `ad`, `parcalar` şart):
     { id, ad, grup, etiket, giris, kazanim:[…], akilda:[…],
       parcalar:[{ baslik, metin, liste?, formul?, dikkat?, ornek?, cizim? }],
       ornekler:[{ soru, cozum:[…] }], hatalar:[…], onKosul:[id…], terimler:[…],
       sorular:[{ id, soru, sec:[…], dogru:'A'.., ipucu?, cozum:[…], seviye?, gorsel? }],
       acik:[{ id, soru, yanit?, olcut?:[…] }], aktarim:[{ id, soru, olcut:[…] }],
       niyet?:true, sinir? }

   Sözler:
   1. KARAR KODDA (AGENTS §1.1). Aşama, vade, sıra, sonraki adım ve hangi sorunun
      geleceği kodla seçilir. Model yalnız anlatımı başka bir dille yazar; kaynakta
      olmayan sayı getiren cevap gösterilmez (`sayiTemiz`).
   2. MODEL YOKKEN EKSİKSİZ. Bütün adımlar modelsiz çalışır; model düğmeleri
      yalnız bağlantı varsa çıkar.
   3. SORU UYDURULMAZ. Metinden üretilen soru metnin kendi cümlesidir; yalnız bir
      terim boşluk olur, çeldiriciler aynı metnin terimleridir. Çeldirici yetmezse
      soru yoktur (`OGRET.secenek`).
   4. EKSİK SIFIR DEĞİL (§1.2). Kanıtı olmayan konu «veri yok»tur. Ön tahmin ölçüm
      değildir, kanıta girmez: henüz anlatılmamış şeyi bilmemek unutmak sayılmaz.
      İpuçlu cevap aşama kazandırmaz; kişinin kendi notladığı cevap «öz değerlendirme» der.
   5. GÜNDE TEK KANIT. Konunun o günkü kanıtı doğruluğu ESIK'in üstündeyse isabettir:
      tek yanlış konunun bütün zincirini kesmez (AYS quiz.js ile aynı düşünce).
   6. YARGI KAYDA (§1.5). «Sağlam» kaydın durumudur; yetenek yargısı, sertifika,
      sonuç garantisi yok. SPİ'de yalnız sağlık davranışı bilgisi; teşhis ve doz yok.
   7. XP'YE BAKMAZ, PLANA YAZMAZ (§1.6). Kayıtlar yalnız bu motorundur;
      modül isterse kanca ile kendi kaydına da yazar. */
window.LIFEOS.PARCA.yazilar({
  'ortak.om.etiket-yazili':'elle yazıldı · doğrulanmadı',
  'ortak.om.etiket-model':'model taslağı · doğrulanmadı',
  'ortak.om.etiket-metin':'senin metnin',
  'ortak.om.etiket-yeniden':'model yazdı · doğrulanmadı',
  'ortak.om.grup-kendi':'Kendi konularım',
});

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.OGRENMOTOR = (function(){
  'use strict';
  const L = () => window.LIFEOS || {};
  const ESIK = 2 / 3;              // sistem ayarı: günün kanıtı için doğruluk
  const SAKLA = 80, NOT_SAKLA = 3, NOT_UZUN = 500;
  const METIN_UZUN = 12000, ATOLYE_EN_COK = 40;
  const K_KAYIT = 'meta/omKayit', K_ATOLYE = 'meta/omAtolye';
  const TURLER = ['kavram', 'islem', 'dikkat', 'bilmiyor'];

  let ayar = null;
  let kayit = bosKayit(), atolye = [];

  function bosKayit(){ return { k:{}, n:{}, h:{} }; }
  function nesne(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }

  function kur(o){ ayar = Object.assign({ modul:'ortak' }, o || {}); kayit = bosKayit(); atolye = []; }
  const kuruluMu = () => !!ayar;

  function bugun(){
    if(ayar && ayar.bugun) return ayar.bugun();
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  }

  /* Depo: modülün Store'u (eşitlemeye ve yedeğe girer), yoksa localStorage. */
  async function oku(k){
    if(ayar && ayar.depo) return ayar.depo.oku(k);
    try{ return JSON.parse(localStorage.getItem(ayar.modul + '.' + k) || 'null'); }catch(e){ return null; }
  }
  async function yaz(k, v){
    if(ayar && ayar.depo) return ayar.depo.yaz(k, v);
    try{ localStorage.setItem(ayar.modul + '.' + k, JSON.stringify(v)); }catch(e){ /* depo kapalı */ }
    return true;
  }
  async function yukle(){
    if(!ayar) return;
    const d = nesne(await oku(K_KAYIT)) || {};
    kayit = { k:nesne(d.k) || {}, n:nesne(d.n) || {}, h:nesne(d.h) || {} };
    const a = await oku(K_ATOLYE);
    atolye = Array.isArray(a) ? a.filter(x => x && x.id && x.ad) : [];
  }
  const kaydet = () => yaz(K_KAYIT, kayit);

  /* ---------------------------------------------------------------- metin */

  const kucuk = s => String(s == null ? '' : s).toLocaleLowerCase('tr');
  const duz = s => String(s == null ? '' : s).replace(/\*\*/g, '').replace(/[\^_]\{([^{}]*)\}/g, '$1');
  const dizi = v => (Array.isArray(v) ? v : (v ? [v] : []));
  /* Sayısal özet: aynı girdi aynı çıktı; soru kimliği ve karıştırma için. */
  function ozet(s){
    let h = 5381; s = String(s);
    for(let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function tohumlu(tohum){
    let h = parseInt(ozet(tohum), 36) || 1;
    return () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
  }

  const KISALTMA = /(?:^|[\s(])(vb|vs|örn|bkz|Dr|Prof|Doç|Sn|No|yy|MÖ|MS|sf|s|ör)\.$/;
  /* Lookbehind yok: eski iOS WebView'da sözdizimi hatası bütün dosyayı düşürür. */
  function cumleler(metin){
    const out = [];
    String(metin == null ? '' : metin).split(/\n+/).forEach(sat => {
      let bas = 0;
      for(let i = 0; i < sat.length; i++){
        if('.!?…'.indexOf(sat[i]) < 0) continue;
        const son = sat[i + 1];
        if(son !== undefined && !/\s/.test(son)) continue;
        const parca = sat.slice(bas, i + 1);
        if(sat[i] === '.' && (KISALTMA.test(parca) || /\d\.$/.test(parca) && /^\s+[a-zçğıöşü]/.test(sat.slice(i + 1)))) continue;
        if(parca.trim()) out.push(parca.trim());
        bas = i + 1;
      }
      const kalan = sat.slice(bas).trim();
      if(kalan) out.push(kalan);
    });
    return out;
  }

  const DURAK = new Set(('acaba ama ancak artık aslında aynı ayrıca az bazen bazı belki ben beri beşi bile bir biraz birçok birkaç biri birisi bu buna bunda bundan bunlar bunları bunu bunun çok çünkü da daha dahi de değil diğer diye dolayı edilir eden eder en fakat gibi göre hem hep hepsi her hiç için ile ilgili ise işte kadar karşı kendi kendini ki kim mı mi mu mü nasıl ne neden nerede nedir olan olarak olur oldu olduğu olması olsa on ona ondan onlar onu onun öyle önce sadece sana sen sonra şey şöyle şu şuna şunu tüm üzere var vardır ve veya ya yani yine yok yoksa zaman zaten bunlardan birinin yapılır yapılan yapmak olmak etmek ayrı başka bütün şekilde durumda sayesinde bakımından tarafından arasında üzerinde içinde önemli gerekir gerekli konu konusu örnek örneğin').split(' '));
  const KOK_UZUN = 5;
  const kok = w => (w.length > KOK_UZUN ? w.slice(0, KOK_UZUN) : w);
  const KELIME = /[0-9A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû’'-]+/g;

  /* Yazarın kalın yazdığı terimler: seçimi yazar yapmıştır, en güvenilir kaynak budur. */
  function kalinTerimler(metinler){
    const out = [], gor = {};
    (dizi(metinler).map(String).join('\n').match(/\*\*[^*]+\*\*/g) || []).forEach(x => {
      const t = duz(x).trim().replace(/[.,;:!?]+$/, ''), a = kucuk(t);
      if(t.length >= 4 && t.split(/\s+/).length <= 4 && !gor[a]){ gor[a] = 1; out.push(t); }
    });
    return out;
  }
  /* Tanım cümlesinin öznesi: «Geri yayılım, hatayı … yöntemdir.» ya da «nöron adı verilen birimler».
     Tek geçse de terimdir; yazar onu tanımlıyordur. */
  function tanimTerimleri(metin){
    const out = [];
    const ekle = t => { const x = String(t || '').trim(); if(x.length >= 4 && !DURAK.has(kucuk(x)) && !out.some(y => kucuk(y) === kucuk(x))) out.push(x); };
    cumleler(duz(metin)).forEach(c => {
      const m = c.match(/^([^,:;()]{4,40}),\s.+(?:[dt][ıiuü]r|denir|demektir)[.!?]?$/);
      if(m && m[1].trim().split(/\s+/).length <= 3 && !/^(bu|bir|her|ancak|ama|fakat|oysa|çünkü|yani|ayrıca|sonuç|örneğin)\b/i.test(m[1].trim())) ekle(m[1]);
      (c.match(/([0-9A-Za-zÇĞİÖŞÜçğıöşü]{4,})\s+(?:adı verilen|denilen|denen)\b/g) || []).forEach(x => ekle(x.split(/\s+/)[0]));
    });
    return out;
  }
  /* Fiil gibi biten kelime terim olmaz (kaydet, söylemez, yapılır); kesin değil, eleme amaçlı. */
  const FIIL = /(yor|mak|mek|maz|mez|mış|miş|muş|müş|acak|ecek|abilir|ebilir|dır|dir|dur|dür|tır|tir|tur|tür|lar|ler|ınca|ince|arak|erek|ıyla|iyle)$/;
  /* Metnin terimleri: kalın yazılanlar başta, sonra tekrar eden ya da cümle ortasında
     büyük harfle yazılan kelimeler. Kelime gruplanır (fotosentez, fotosentezi, fotosentezde)
     ve grubun en kısa biçimi terim olur; ek cümlede kalır. */
  function terimler(metinler, en){
    const metin = dizi(metinler).map(String).join('\n');
    const kalin = kalinTerimler(metinler);
    const gruplar = {};
    cumleler(duz(metin)).forEach(c => {
      (c.match(KELIME) || []).forEach((w, i) => {
        const a = kucuk(w).replace(/[’'-].*$/, '');
        if(a.length < 5 || DURAK.has(a) || /^\d/.test(a)) return;
        /* «Fotosentezdir» gibi ekli biçim grubu sayar ama terimi fiil yapmaz: yalnız ek almışsa elenir. */
        const g = gruplar[kok(a)] = gruplar[kok(a)] || { n:0, buyuk:0, en:a, ham:w.replace(/[’'-].*$/, '') };
        g.n++;
        if(i > 0 && /^[A-ZÇĞİÖŞÜ]/.test(w)) g.buyuk++;
        if(a.length < g.en.length){ g.en = a; g.ham = w.replace(/[’'-].*$/, ''); }
      });
    });
    const sik = Object.keys(gruplar).map(k => gruplar[k]).filter(g => (g.n >= 2 || g.buyuk) && (g.buyuk || !FIIL.test(g.en)))
      .sort((a, b) => (b.n + b.buyuk) - (a.n + a.buyuk) || b.en.length - a.en.length || (a.en < b.en ? -1 : 1))
      .map(g => (g.buyuk ? g.ham : g.en));
    const hepsi = kalin.slice();
    tanimTerimleri(metin).forEach(t => { if(!hepsi.some(x => kucuk(x) === kucuk(t))) hepsi.push(t); });
    sik.forEach(t => { if(!hepsi.some(x => kucuk(x).indexOf(kok(kucuk(t))) >= 0)) hepsi.push(t); });
    return hepsi.slice(0, en || 10);
  }

  /* Terimin cümledeki yeri: kelime başında başlamalı (ek sonda kalır). */
  function terimBul(cumle, terim){
    const c = kucuk(cumle), t = kucuk(terim);
    let i = c.indexOf(t);
    while(i >= 0){
      if(i === 0 || !/[0-9a-zçğıöşüâîû]/.test(c[i - 1])) return i;
      i = c.indexOf(t, i + 1);
    }
    return -1;
  }

  /* Boşluklu soru: cümle metnin kendisi, doğru cevap ve çeldiriciler metnin terimleri. */
  function boslukSorulari(metinler, o){
    o = o || {};
    const liste = o.terimler || terimler(metinler, 12);
    const OG = L().OGRET;
    if(!OG || liste.length < 3) return [];
    const kullanilan = {}, out = [];
    const tum = cumleler(dizi(metinler).map(String).join('\n'));
    /* Tanım cümlesi öncelikli: «… denir», «… demektir» cümlesi terimi en iyi sınar. */
    const TANIM = /(?:[dt][ıiuü]r|denir|denilen|adı verilir|anlamına|demektir)(?:[.,:;!?]|\s|$)/;
    const sayili = x => /\d/.test(x);
    liste.forEach(t => {
      const adaylar = tum.map(duz).map(x => x.trim()).filter(x => {
        const n = x.split(/\s+/).length;
        return !kullanilan[x] && !/[:?]$/.test(x) && (x.match(/«/g) || []).length === (x.match(/»/g) || []).length && n >= 6 && n <= 34 && terimBul(x, t) >= 0
          && terimBul(x.slice(terimBul(x, t) + t.length), t) < 0
          && !liste.some(u => u !== t && kucuk(u).indexOf(kucuk(t)) >= 0 && terimBul(x, u) >= 0);
      });
      const c = adaylar.find(x => TANIM.test(x)) || adaylar[0];
      if(!c) return;
      const i = terimBul(c, t);
      const bosluk = c.slice(0, i) + '_____' + c.slice(i + t.length);
      const yuzey = c.slice(i, i + t.length);
      /* Sayılı cevaba sayılı çeldirici: yoksa cevap biçiminden belli olur. */
      const sec = OG.secenek(yuzey, liste.filter(u => kucuk(u) !== kucuk(t) && terimBul(c, u) < 0 && sayili(u) === sayili(t)).map(u => (/^[A-ZÇĞİÖŞÜ]/.test(yuzey) ? ilkBuyuk(u) : u)),
        { n:3, enAz:2, rastgele:tohumlu(c) });
      if(!sec) return;
      kullanilan[c] = 1;
      out.push({ id:'b' + ozet(c + '|' + t), soru:bosluk, sec:sec.sec, dogru:sec.dogru, cozum:[c], seviye:'temel', uretilen:true });
    });
    return out.slice(0, o.en || 8);
  }
  const ilkBuyuk = s => { const x = String(s); return x ? x[0].toLocaleUpperCase('tr') + x.slice(1) : x; };

  /* Anlattığında terimler geçiyor mu? Ek toleranslı kök eşleşmesi; anlamı yargılamaz. */
  function kapsam(metin, liste){
    const yazi = kucuk(duz(metin));
    const kelimeSay = (yazi.match(KELIME) || []).length;
    const geciyor = t => kucuk(t).split(/\s+/).every(w => terimBul(yazi, kok(w)) >= 0);
    const gecen = (liste || []).filter(geciyor);
    return { gecen, gecmeyen:(liste || []).filter(t => gecen.indexOf(t) < 0), toplam:(liste || []).length, kelime:kelimeSay, etiket:'hesaplandı' };
  }

  /* Model, kaynakta olmayan sayı yazdıysa cevap gösterilmez (söz 1). */
  const sayilar = s => (duz(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
  function sayiTemiz(kaynak, cikti){
    const k = sayilar(kaynak);
    return sayilar(cikti).every(x => k.indexOf(x) >= 0);
  }

  /* ---------------------------------------------------------------- konu */

  /* Bir parçanın düz metni (terim ve soru üretimi için). */
  function parcaMetni(p){
    return [p.metin].concat(dizi(p.metin).length ? [] : []).reduce((l, m) => l.concat(dizi(m)), []).concat(dizi(p.dikkat)).join('\n');
  }
  /* Bağlantının verdiği konuyu tamamlar: terim, sorusu az olana metinden soru, parçanın
     örneği ve dikkati. Kaynak içerik değişmez, yalnız eksik yerler doldurulur. */
  function tamamla(k){
    if(!k) return null;
    const parcalar = dizi(k.parcalar);
    const metinler = parcalar.map(parcaMetni);
    const ornekler = dizi(k.ornekler).slice();
    parcalar.forEach(p => { if(p.ornek && p.ornek.soru) ornekler.push(p.ornek); });
    const kalin = kalinTerimler(metinler);
    const terim = dizi(k.terimler).length ? dizi(k.terimler) : (kalin.length >= 3 ? kalin.slice(0, 10) : terimler(metinler, 8));
    let sorular = dizi(k.sorular);
    /* Yazılmış içerikte yalnız yazarın kalın terimleri sorulur: frekansla seçilen kelime
       kötü soru verir («_____ et»). Kişinin yapıştırdığı metinde başka seçenek yoktur. */
    if(sorular.length < 3 && kalin.length >= 3) sorular = sorular.concat(boslukSorulari(metinler, { terimler:kalin }));
    const hatalar = dizi(k.hatalar).length ? dizi(k.hatalar) : parcalar.map(p => p.dikkat).filter(Boolean);
    /* Elle yazılmış açık soru yoksa parçanın dikkat notu sorulur: metin yazarındır. */
    const acikEk = dizi(k.acik).length ? [] : parcalar.map((p, i) => (p.dikkat && p.baslik ? { id:'d' + i, soru:'«' + duz(p.baslik) + '» konusunda neye dikkat edilir?', yanit:p.dikkat } : null)).filter(Boolean);
    return Object.assign({ etiket:'', onKosul:[], kazanim:[], akilda:[] }, k,
      { parcalar, ornekler, terimler:terim, sorular, acik:dizi(k.acik).concat(acikEk), aktarim:dizi(k.aktarim), hatalar, kazanim:dizi(k.kazanim), akilda:dizi(k.akilda), onKosul:dizi(k.onKosul) });
  }

  /* Kişinin verdiği metinden konu (sistemde olmayan bilgi). Model taslağı da buradan geçer:
     model yalnız metin verir, soruyu ve terimi kod çıkarır (söz 3). */
  function metindenKonu(a){
    const paragraf = String(a.metin || '').split(/\n\s*\n+/).map(x => x.trim()).filter(Boolean);
    const parcalar = [];
    paragraf.forEach(p => {
      const c = cumleler(p);
      for(let i = 0; i < c.length; i += 4) parcalar.push({ metin:c.slice(i, i + 4).join(' ') });
    });
    const temizParca = parcalar.slice(0, 12);
    const liste = terimler(temizParca.map(x => x.metin), 12);
    temizParca.forEach((p, i) => { p.baslik = a.ad + (temizParca.length > 1 ? ' · ' + (i + 1) + ' / ' + temizParca.length : ''); });
    const sorular = boslukSorulari(temizParca.map(x => x.metin), { terimler:liste, en:10 });
    const acik = dizi(a.sorular).filter(x => x && x.soru).map((x, i) => ({ id:'k' + i, soru:x.soru, yanit:x.yanit || '' }));
    return { id:a.id, ad:a.ad, grup:'kendi', grupAd:yz('ortak.om.grup-kendi'), atolye:true, kaynak:a.kaynak || 'metin', parcalar:temizParca, ornekler:[], terimler:liste.slice(0, 8), sorular, acik,
      aktarim:[], hatalar:[], onKosul:[], kazanim:[], akilda:[], etiket:!a.metin ? '' : yz(a.kaynak === 'model' ? 'ortak.om.etiket-model' : 'ortak.om.etiket-metin'), yeterli:temizParca.length >= 1 && (sorular.length + acik.length) >= 1 };
  }

  /* Rehber biçimindeki anlatım (brand/ortak/rehber.js) → konu. */
  function rehberKonu(k, ek){
    return Object.assign({ id:k.id, ad:k.ad, grup:k.alan, grupAd:k.alan, etiket:yz('ortak.om.etiket-yazili'), giris:k.giris, kazanim:k.kazanim, akilda:k.akilda, parcalar:k.bolumler }, ek || {});
  }

  const atolyeOf = id => atolye.find(x => x.id === id) || null;
  function konu(id){
    const a = atolyeOf(id);
    if(a) return metindenKonu(a);
    if(!ayar || !ayar.konu) return null;
    try{ return tamamla(ayar.konu(id)); }catch(e){ return null; }
  }
  /* Hafif liste: {id, ad, grup, grupAd?}. Modül içeriği burada yüklemez. */
  function konular(){
    let l = [];
    try{ l = (ayar && ayar.konular && ayar.konular()) || []; }catch(e){ l = []; }
    return l.concat(atolye.map(a => ({ id:a.id, ad:a.ad, grup:'kendi', grupAd:yz('ortak.om.grup-kendi'), atolye:true })));
  }

  /* Sistemde var mı? Yeni konu açmadan önce bakılır. */
  function ara(metin){
    const OG = L().OGRET;
    if(!OG) return null;
    return OG.bul(konular(), metin, x => [x.ad], { gevsek:true });
  }

  async function atolyeEkle(a){
    const ad = String((a && a.ad) || '').trim().slice(0, 100);
    const metin = String((a && a.metin) || '').trim().slice(0, METIN_UZUN);
    if(ad.length < 2) return { ok:false, neden:'ad' };
    const id = 'kendi-' + ozet(ad + '|' + bugun() + '|' + atolye.length);
    const k = { id, ad, metin, kaynak:(a && a.kaynak) || (metin ? 'metin' : 'yok'), sorular:[], at:bugun() };
    atolye = [k].concat(atolye).slice(0, ATOLYE_EN_COK);
    await yaz(K_ATOLYE, atolye);
    return { ok:true, id };
  }
  async function atolyeGuncelle(id, yama){
    const a = atolyeOf(id);
    if(!a) return { ok:false };
    if(yama.metin != null){ a.metin = String(yama.metin).trim().slice(0, METIN_UZUN); a.kaynak = yama.kaynak || 'metin'; }
    if(yama.soru && String(yama.soru.soru || '').trim()){
      a.sorular = dizi(a.sorular).concat([{ soru:String(yama.soru.soru).trim().slice(0, 300), yanit:String(yama.soru.yanit || '').trim().slice(0, 600) }]).slice(-12);
    }
    await yaz(K_ATOLYE, atolye);
    return { ok:true };
  }
  async function atolyeSil(id){
    atolye = atolye.filter(x => x.id !== id);
    delete kayit.k[id]; delete kayit.n[id]; delete kayit.h[id];
    await kaydet();
    await yaz(K_ATOLYE, atolye);
  }
  function kaynakBul(ad){ return 'https://tr.wikipedia.org/w/index.php?search=' + encodeURIComponent(String(ad || '')); }

  /* ---------------------------------------------------------------- kanıt */

  const ham = id => (Array.isArray(kayit.k[id]) ? kayit.k[id] : []);
  function ekKanit(id){
    if(!ayar || !ayar.ekKanit) return [];
    try{ return dizi(ayar.ekKanit(id)); }catch(e){ return []; }
  }
  /* Kanıt listesi (usta.js biçimi), günde tek (söz 5). Ön tahmin girmez (söz 4);
     hepsi ipuçlu olan gün hatırlama ölçmez. */
  function kanitlar(id){
    const gun = {};
    const ekle = x => {
      const g = gun[x.g] = gun[x.g] || { d:0, n:0, temiz:0, kr:false, eminY:false };
      g.n++; if(x.isabet) g.d++;
      if(!x.ipucu) g.temiz++;
      if(x.karisik) g.kr = true;
      if(x.guven === 'emin' && !x.isabet) g.eminY = true;
    };
    ham(id).forEach(x => { if(!x.on) ekle({ g:x.g, isabet:!!x.i, guven:x.gv, karisik:x.kr, ipucu:x.ip }); });
    ekKanit(id).forEach(x => { if(x && x.g && typeof x.isabet === 'boolean') ekle(x); });
    return Object.keys(gun).sort().map(g => {
      const o = gun[g], k = { g, isabet:o.d / o.n >= ESIK };
      if(o.kr) k.karisik = true;
      if(o.eminY && !k.isabet) k.guven = 'emin';
      if(!o.temiz) k.ipucu = true;
      return k;
    });
  }
  function asama(id){ return L().USTA.asama(kanitlar(id), bugun()); }

  /* Cevap: { konu, soru, isabet, guven?, karisik?, ipucu?, on?, harf? }. */
  async function cevapYaz(c){
    const x = { g:bugun(), s:String(c.soru), i:!!c.isabet };
    if(c.guven) x.gv = c.guven;
    if(c.karisik) x.kr = 1;
    if(c.ipucu) x.ip = 1;
    if(c.on) x.on = 1;
    kayit.k[c.konu] = ham(c.konu).concat([x]).slice(-SAKLA);
    await kaydet();
    if(!c.on && ayar && ayar.cevapKanca){
      try{ await ayar.cevapKanca(c); }catch(e){ /* modül kaydı düşse de motor kaydı durur */ }
    }
    return { asama:asama(c.konu) };
  }

  /* Kişinin kendi cümleleri: tekrarda «geçen sefer böyle demiştin» diye geri gelir. */
  async function notYaz(konuId, tur, metin){
    const m = String(metin || '').trim().slice(0, NOT_UZUN);
    if(!m) return;
    const n = kayit.n[konuId] = nesne(kayit.n[konuId]) || {};
    n[tur] = dizi(n[tur]).concat([{ g:bugun(), m }]).slice(-NOT_SAKLA);
    await kaydet();
  }
  function notlar(konuId, tur){ const n = nesne(kayit.n[konuId]); return n ? dizi(n[tur]) : []; }

  async function hataYaz(konuId, tur){
    if(TURLER.indexOf(tur) < 0) return;
    const h = kayit.h[konuId] = nesne(kayit.h[konuId]) || {};
    h[tur] = (h[tur] || 0) + 1;
    await kaydet();
  }
  /* Bütün konularda hata türü dağılımı; hiç işaret yoksa null (veri yok). */
  function hataOzet(){
    const t = { kavram:0, islem:0, dikkat:0, bilmiyor:0 };
    Object.keys(kayit.h).forEach(id => { const h = nesne(kayit.h[id]) || {}; TURLER.forEach(x => { t[x] += Number(h[x]) || 0; }); });
    return TURLER.some(x => t[x]) ? t : null;
  }

  /* ---------------------------------------------------------------- sıra */

  /* Önbellek yok: AYS'de kanıtın bir kısmı modülün kendi kaydındadır, bayatlamasın. */
  const kanitliKonular = () => konular().map(k => ({ id:k.id, grup:k.grup, ad:k.ad, kanitlar:kanitlar(k.id) })).filter(x => x.kanitlar.length);
  /* Bugün tekrar edilecekler: kritik, vadesi gelen, ya da önceki gün tutmamış olan. */
  function gunluk(n){
    const U = L().USTA, g = bugun();
    const b = kanitliKonular().filter(x => {
      const s = x.kanitlar[x.kanitlar.length - 1];
      return s.g < g;      // bugün zaten sınanan bir kez daha gelmez: aynı gün tekrar ara kanıtı değildir
    });
    const l = U.sira(b, g).filter(x => x.asama !== 'yok').map(x => Object.assign(x, { ad:(b.find(y => y.id === x.id) || {}).ad }));
    return n > 0 ? l.slice(0, n) : l;
  }
  /* Bugün satırı için: içeriği yüklemeden, yalnız kanıttan sayar. Modüllerin verisi tembel
     (brand/parcalar.txt): konu listesi açılışta istenirse tembelliğin kazancı gider.
     shortcut: kapatılan bölümün kaydı burada sayılır, liste bilinmediği için; ekran açılınca doğru sayı görünür. */
  function tekrarSayisi(){
    const g = bugun();
    let ek = [];
    try{ ek = (ayar && ayar.ekIdler && ayar.ekIdler()) || []; }catch(e){ ek = []; }
    const b = Object.keys(kayit.k).concat(ek).filter((x, i, l) => l.indexOf(x) === i).map(id => ({ id, kanitlar:kanitlar(id) }))
      .filter(x => x.kanitlar.length && x.kanitlar[x.kanitlar.length - 1].g < g);
    return b.length ? L().USTA.sira(b, g).filter(x => x.asama !== 'yok').length : 0;
  }
  function harita(){
    return L().USTA.harita(konular().map(k => ({ id:k.id, kanitlar:kanitlar(k.id) })), bugun());
  }
  /* Sonraki adım kodla: önce tekrar, sonra öğrenilmekte olan, sonra sıradaki yeni konu. */
  function oneri(){
    const t = gunluk();
    if(t.length) return { tur:'tekrar', n:t.length, konu:t[0].id, ad:t[0].ad };
    const var_ = {};
    kanitliKonular().forEach(x => { var_[x.id] = 1; });
    let sonAcilan = null;
    try{ sonAcilan = ayar && ayar.oncelik ? ayar.oncelik() : null; }catch(e){ sonAcilan = null; }
    const l = konular();
    const yeni = (sonAcilan && !var_[sonAcilan] && l.find(k => k.id === sonAcilan)) || l.find(k => !var_[k.id] && !k.atolye);
    return yeni ? { tur:'yeni', konu:yeni.id, ad:yeni.ad } : { tur:'bos' };
  }

  /* Ön koşul durumu: kaydı «öğreniyor» olan ya da hiç görülmemiş olanlar. Kilit değil, öneri. */
  function onKosullar(k){
    const adlar = {};
    konular().forEach(x => { adlar[x.id] = x.ad; });
    return dizi(k && k.onKosul).filter(id => adlar[id]).map(id => ({ id, ad:adlar[id], asama:asama(id).id }))
      .filter(x => x.asama === 'yok' || x.asama === 'ogreniyor');
  }

  /* ---------------------------------------------------------------- soru secimi */

  const SEVIYE_HEDEF = { yok:['temel', 'orta', 'ileri'], ogreniyor:['temel', 'orta', 'ileri'], tutuyor:['orta', 'temel', 'ileri'],
    kalici:['ileri', 'orta', 'temel'], saglam:['ileri', 'orta', 'temel'] };

  /* Sıra: yanlış yapılan → hiç sorulmayan → en eski. Bugün cevaplanan bugün gelmez: aynı
     soruyu cevabını görmüşken çözmek hatırlama değildir. Seviye aşamadan gelir (ölçülü zorluk). */
  function soruSec(k, n, o){
    o = o || {};
    const g = bugun(), son = {};
    ham(k.id).forEach(x => { son[x.s] = x; });
    const hedef = SEVIYE_HEDEF[asama(k.id).id] || SEVIYE_HEDEF.yok;
    const haric = o.haric || {};
    const puan = q => {
      const s = son[q.id];
      if(s && s.g === g) return null;
      if(haric[q.id]) return null;
      const durum = !s ? 1 : !s.i ? 0 : 2;
      const sv = hedef.indexOf(q.seviye || 'temel');
      return [durum, sv < 0 ? 3 : sv, s ? s.g : '', ozet(g + q.id)];
    };
    const sirala = l => l.map(q => ({ q, p:puan(q) })).filter(x => x.p).sort((a, b) => {
      for(let i = 0; i < 4; i++){ if(a.p[i] < b.p[i]) return -1; if(a.p[i] > b.p[i]) return 1; }
      return 0;
    }).map(x => x.q);
    const kapali = sirala(k.sorular), acik = sirala(k.acik);
    if(o.kapali) return kapali.slice(0, n);
    /* Açık soru üretim ister; birden çok soruda bir tanesi girer. Tek soru (karışık tekrar) kapalıdır; kapalı yoksa açıktır. */
    const secim = n > 1 && acik.length && kapali.length ? kapali.slice(0, Math.max(0, n - 1)).concat(acik.slice(0, 1)) : (kapali.length ? kapali : acik).slice(0, n);
    return secim.concat(kapali.filter(q => secim.indexOf(q) < 0)).slice(0, n);
  }

  /* Bir yanlışın ardından: aynı konudan başka bir soru (benzer soruyla onarım). */
  function benzerSoru(k, q, sorulan){
    const haric = Object.assign({}, sorulan || {}, { [q.id]:1 });
    return soruSec(k, 1, { haric, kapali:!q.yanit && !q.olcut })[0] || null;
  }

  /* Sorunun en ilgili parçası: paylaşılan anlamlı kelime sayısı. */
  function ilgiliParca(k, q){
    const kokler = t => {
      const s = {};
      (kucuk(duz(t)).match(KELIME) || []).forEach(w => { if(w.length >= 4 && !DURAK.has(w)) s[kok(w)] = 1; });
      return s;
    };
    const a = kokler([q.soru].concat(dizi(q.cozum)).join(' '));
    let en = null, enP = 0;
    k.parcalar.forEach((p, i) => {
      const b = kokler(parcaMetni(p) + ' ' + (p.baslik || ''));
      const n = Object.keys(a).filter(x => b[x]).length;
      if(n > enP){ enP = n; en = i; }
    });
    return en;
  }

  /* ---------------------------------------------------------------- akış

     Adımlar: tahmin, parca, acikla, ornek, yokla, onar, anlat, aktar, niyet, bosalt, bitir.
     Plan koda aittir; kişi anlatım biçimini seçer (parca / ornek / ozet), adımı atlayabilir. */
  const ACIKLA = ['kendi', 'neden', 'benzet'];

  function planOgren(k, bicim, sorulan){
    const a = [];
    const yeni = !kanitlar(k.id).length;
    const ilk = yeni ? soruSec(k, 1, { kapali:true })[0] : null;
    if(ilk){ sorulan[ilk.id] = 1; a.push({ t:'tahmin', q:ilk }); }
    else if(yeni && k.parcalar.length > 1) a.push({ t:'bosalt', ilk:true });
    const anlatim = [];
    if(bicim === 'ozet'){
      anlatim.push({ t:'ozet' });
    }else{
      let n = 0;
      k.parcalar.forEach((p, i) => {
        anlatim.push({ t:'parca', i });
        /* İki parçada bir: sürekli yazdırmak okumayı böler. */
        if((i + 1) % 2 === 0 || i === k.parcalar.length - 1) anlatim.push({ t:'acikla', i, soru:ACIKLA[n++ % ACIKLA.length] });
      });
    }
    const ornek = k.ornekler.slice(0, 2).map(o => ({ t:'ornek', o }));
    if(bicim === 'ornek') a.push(...ornek, ...anlatim);
    else a.push(...anlatim, ...ornek);
    soruSec(k, 3, { haric:sorulan }).forEach(q => { sorulan[q.id] = 1; a.push({ t:'yokla', q }); });
    if(k.terimler.length >= 3) a.push({ t:'anlat' });
    k.aktarim.slice(0, 1).forEach(q => a.push({ t:'aktar', q }));
    if(k.niyet) a.push({ t:'niyet' });
    a.push({ t:'bitir' });
    return a;
  }
  /* Tekrar: önce kitabı kapat, aklında kalanı yaz; sonra yeni sorular. Kalıcı konuda aktarım. */
  function planTekrar(k, sorulan){
    const a = [{ t:'bosalt' }];
    soruSec(k, 2, { haric:sorulan }).forEach(q => { sorulan[q.id] = 1; a.push({ t:'yokla', q }); });
    const as = asama(k.id).id;
    if((as === 'kalici' || as === 'saglam') && k.aktarim.length) a.push({ t:'aktar', q:k.aktarim[notlar(k.id, 'aktar').length % k.aktarim.length] });
    a.push({ t:'bitir' });
    return a;
  }

  /* Seans: { tur:'ogren'|'tekrar'|'karma', konu, adimlar, i, sonuc:[], sorulan, bicim } */
  function seans(id, tur, bicim){
    const k = konu(id);
    if(!k) return null;
    const sorulan = {};
    const t = tur || 'ogren';
    return { tur:t, id, konu:k, bicim:bicim || 'parca', sorulan, i:0, sonuc:[], onarim:0,
      adimlar:t === 'tekrar' ? planTekrar(k, sorulan) : planOgren(k, bicim, sorulan) };
  }
  /* Karışık tekrar: vadesi gelen konulardan birer soru, gruplar yan yana gelmez (usta.sira).
     Konu başlığı baştan söylenmez, bu yüzden karışık sınama sayılır. */
  function karma(n){
    const adimlar = [];
    gunluk(n || 8).forEach(x => {
      const k = konu(x.id);
      const q = k && soruSec(k, 1)[0];
      if(q) adimlar.push({ t:'yokla', q, konu:k, karisik:true });
    });
    if(!adimlar.length) return null;
    adimlar.push({ t:'bitir' });
    return { tur:'karma', id:null, konu:null, bicim:'parca', sorulan:{}, i:0, sonuc:[], onarim:0, adimlar };
  }
  const adimOf = s => (s ? s.adimlar[s.i] || null : null);
  const konuOf = (s, a) => (a && a.konu) || (s && s.konu) || null;

  /* Cevap işlendi: seans sonucu ve gerekiyorsa onarım adımı.
     Onarımdan sonra benzer soru hemen değil, araya bir adım girerek gelir. */
  async function isle(s, c){
    const a = adimOf(s), k = konuOf(s, a);
    if(!a || !k) return null;
    const onYok = a.t === 'tahmin';
    const r = await cevapYaz({ konu:k.id, soru:a.q.id, isabet:c.isabet, guven:c.guven, karisik:!!a.karisik, ipucu:c.ipucu, on:onYok, harf:c.harf, kapali:!!a.q.sec });
    if(onYok) return r;
    s.sonuc.push({ konu:k.id, ad:k.ad, soru:a.q.id, isabet:!!c.isabet, guven:c.guven || null, ipucu:!!c.ipucu });
    if(!c.isabet && !a.onarimli){
      s.onarim++;
      const ek = [{ t:'onar', q:a.q, harf:c.harf, konu:a.konu, guven:c.guven }];
      const benzer = s.onarim <= 2 ? benzerSoru(k, a.q, s.sorulan) : null;
      s.adimlar.splice(s.i + 1, 0, ...ek);
      if(benzer){
        s.sorulan[benzer.id] = 1;
        /* Bir sonraki yoklamanın ardına: yanıt gözün önündeyken sorulmasın. */
        let yer = s.i + 2;
        while(yer < s.adimlar.length && s.adimlar[yer].t !== 'yokla' && s.adimlar[yer].t !== 'anlat' && s.adimlar[yer].t !== 'aktar' && s.adimlar[yer].t !== 'niyet' && s.adimlar[yer].t !== 'bitir') yer++;
        if(s.adimlar[yer] && s.adimlar[yer].t === 'yokla') yer++;
        s.adimlar.splice(yer, 0, { t:'yokla', q:benzer, konu:a.konu, karisik:a.karisik, onarimli:true });
      }
    }
    return r;
  }
  const ilerle = s => { if(s && s.i < s.adimlar.length - 1) s.i++; return adimOf(s); };

  /* Sonuç: kod hesaplar; hangi konu yarın, hangisi ne zaman. */
  function sonuc(s){
    const n = s.sonuc.length, d = s.sonuc.filter(x => x.isabet).length;
    const idler = s.sonuc.map(x => x.konu).filter((x, i, l) => l.indexOf(x) === i);
    if(s.konu && idler.indexOf(s.konu.id) < 0) idler.unshift(s.konu.id);
    return { n, dogru:d, eminYanlis:s.sonuc.filter(x => !x.isabet && x.guven === 'emin').length,
      etiket:n ? 'ölçüldü' : 'veri yok',
      konular:idler.map(id => { const as = asama(id), k = konular().find(x => x.id === id); return { id, ad:k ? k.ad : id, asama:as.id, adi:L().USTA.adi(as.id), sonraki:as.sonraki, kritik:as.kritik }; }) };
  }

  /* ---------------------------------------------------------------- model (isteğe bağlı) */

  const K = () => L().KING_IC;
  function modelVar(){
    if(ayar && ayar.model) return true;
    try{ return !!(K() && K().baglanti && K().baglanti() && K().merkezeSor); }catch(e){ return false; }
  }
  async function modelSor(istem){
    if(ayar && ayar.model){
      const m = await ayar.model(istem);
      return typeof m === 'string' ? m : null;
    }
    try{
      const r = await K().merkezeSor(istem, null, { araclar:false });
      return r && r.ok ? String(r.text || '') : null;
    }catch(e){ return null; }
  }
  const ANLATIM = {
    sade:'on iki yaşındaki birine anlatır gibi, kısa cümlelerle ve günlük kelimelerle',
    benzet:'günlük hayattan tek bir benzetmeyle',
    ornek:'somut ve kısa bir örnek üzerinden',
    sokrat:'kişiye adım adım düşündüren üç kısa soruyla; cevabı en sonda ver',
  };
  /* → { ok, metin } ya da { ok:false, neden:'model'|'sayi'|'kisa' } */
  async function yenidenAnlat(k, metin, tur){
    if(!modelVar()) return { ok:false, neden:'model' };
    const kaynak = duz(metin).slice(0, 2500);
    const cikti = await modelSor('Aşağıdaki METNİ ' + (ANLATIM[tur] || ANLATIM.sade) + ' Türkçe yeniden anlat. En çok 6 cümle. '
      + 'Yalnız metindeki bilgiyi kullan; metinde olmayan sayı, tarih, teşhis ya da doz yazma. Başka bir şey ekleme.\n\nKONU: ' + k.ad + '\nMETİN:\n' + kaynak);
    if(cikti == null) return { ok:false, neden:'model' };
    const temiz = String(cikti).trim().slice(0, 1200);
    if(temiz.length < 20) return { ok:false, neden:'kisa' };
    if(!sayiTemiz(kaynak, temiz)) return { ok:false, neden:'sayi' };
    return { ok:true, metin:temiz, etiket:yz('ortak.om.etiket-yeniden') };
  }
  /* Sistemde olmayan konu için taslak. Soruyu yine kod çıkarır; kaynak «model» etiketiyle kalır. */
  async function modelTaslak(ad){
    if(!modelVar()) return { ok:false, neden:'model' };
    const cikti = await modelSor('«' + String(ad).slice(0, 100) + '» konusunu sade Türkçeyle, 8–12 tam cümleyle anlat. Her paragraf bir fikir olsun; '
      + 'önemli terimleri açıkça adlandır. Emin olmadığın sayı ve tarihi yazma, teşhis ve doz yazma. Başlık ve madde işareti kullanma.');
    if(cikti == null) return { ok:false, neden:'model' };
    /* Model «başlık yok» dese de başlık yazabiliyor (gemma4:e2b, 2026-11-06): yalnız başlık olan satır atılır. */
    const temiz = String(cikti).split('\n').filter(x => !/^\s*(#|\*\*[^*]+\*\*\s*$)/.test(x)).join('\n').trim();
    return temiz.length >= 80 ? { ok:true, metin:temiz.slice(0, METIN_UZUN) } : { ok:false, neden:'kisa' };
  }

  /* Konu biçimi denetimi: modül bağlantısının testleri içindir; boş = temiz. */
  function denetle(k){
    const h = [], ad = (k && k.id) || '?';
    if(!k || !k.id || !k.ad) h.push(ad + ': kimlik ya da ad yok');
    if(!k || !k.parcalar || !k.parcalar.length) h.push(ad + ': parça yok');
    const gor = {};
    (k && k.sorular || []).forEach(q => {
      if(gor[q.id]) h.push(ad + ': soru kimliği iki kez ' + q.id);
      gor[q.id] = 1;
      if(!q.soru) h.push(ad + ': soru metni yok ' + q.id);
      if(!Array.isArray(q.sec) || q.sec.length < 3) h.push(ad + ': seçenek az ' + q.id);
      else if(new Set(q.sec.map(String)).size !== q.sec.length) h.push(ad + ': seçenek iki kez ' + q.id);
      if('ABCDE'.indexOf(q.dogru) < 0 || !q.sec || !q.sec['ABCDE'.indexOf(q.dogru)]) h.push(ad + ': doğru seçenek yok ' + q.id);
    });
    (k && k.acik || []).forEach(q => { if(!q.id || !q.soru) h.push(ad + ': açık soru eksik'); });
    return h;
  }

  function _sifirla(){ ayar = null; kayit = bosKayit(); atolye = []; }

  return { ESIK, TURLER, tohumlu, rehberKonu, kur, kuruluMu, yukle, ayar:() => ayar, bugun, cumleler, terimler, boslukSorulari, kapsam, sayiTemiz, tamamla, metindenKonu, konu, konular, ara,
    atolyeEkle, atolyeGuncelle, atolyeSil, atolyeOf, kaynakBul, kanitlar, asama, cevapYaz, notYaz, notlar, hataYaz, hataOzet, gunluk, tekrarSayisi, harita, oneri, onKosullar,
    soruSec, benzerSoru, ilgiliParca, seans, karma, adimOf, konuOf, isle, ilerle, sonuc, modelVar, yenidenAnlat, modelTaslak, denetle, parcaMetni, duz, _sifirla };
})();
