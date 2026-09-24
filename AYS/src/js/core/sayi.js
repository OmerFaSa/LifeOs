/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sayi.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* SAYI BİLEŞENİ — ekrandaki her sayının tek kalıbı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sayi.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   Biçimi `brand/ortak/kart.css` içindedir.
   ==================================================================

   NE YAPAR (katalog, ekip/TASARIM-OZELLIKLERI.md §B)

     024  Kesinlik glifleri   sayı dört etiketten birini TAŞIR; yalnız
                              «tahmin» olanın altı kesik çizilir, «veri
                              yok» her yerde «—» yazılır, asla 0.
     025  Köken kartı         sayının üzerine gelince (telefonda basılı
                              tutunca) nereden geldiği açılır: ölçülende
                              kaynak ve ölçüm saati, hesaplananda formül,
                              girdiler ve hesap saati.
     026  Veri tazeliği       eski ölçüm soluklaşır ve yaşını gün olarak
                              yazar. Eşik TEK YERDE: `LIFEOS.SAYI.TAZELIK`.
     028  Anlamlı fark        fark rozetinin rengi İŞARETTEN değil
                              metriğin YÖN tanımından gelir: +41 tekrar
                              borcu kötü, +3 net iyidir.
     015  Son bilinen değer   yenilenirken iskelet değil son değer ve saati;
                              ince, HAREKETSİZ bir tarama çizgisi.
     170  Sesli okuma         ekran okuyucu birimi, etiketi, kesinliği ve
                              farkı duyar (`sesli`, `html(…, { etiket, fark })`).
     018  Şüpheli giriş       dünkü değerden eşik kadar sapan giriş
                              kaydedilmeden önce sorulur; kod en olası
                              düzeltmeyi önerir. Eşik TEK YERDE: `SUPHE`.

   NEDEN TEK DOSYA

   Sayı bu sistemin en çok tekrarlanan öğesi ve deponun en çok
   tekrarlanan kuralı (AGENTS.md §1.2) onun üstünde duruyor. Her ekran
   kendi sayısını kendisi yazsaydı, bir gün birinde «veri yok» 0 olarak
   çizilirdi ve bu ancak iki ekran yan yana konunca görülürdü.

   KARAR KODDA, BİÇİM CSS'TE

   Bu dosya renk yazmaz; sınıf yazar (`fark--iyi`, `sayi--bayat`). Hangi
   sınıfın hangi renge düştüğü T'nin jetonlarıyla `kart.css`'tedir.
   Burada verilen karar yalnız ANLAMDIR: iyi mi, kötü mü, bayat mı. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  /* Kesinliğin zayıflık sırası: soldaki en sağlamı. Bir kutuda birden
     çok sayı varsa kutunun başındaki glif, VAR OLAN sayılar içinde en
     zayıfınınkidir — güçlü olanı göstermek zayıf olanı saklamak olurdu. */
  const SIRA = ['measured', 'computed', 'estimated', 'missing'];

  /* VERİ TAZELİĞİ EŞİKLERİ — gün. Bu tablo bir KARARDIR, ölçüm değil.

       gunluk     kilo, uyku, sabah ölçümü: iki gün aksayabilir; üç gün
                  önceki değer bugünün değeri gibi okunamaz.
       haftalik   haftada bir girilen ölçüler (bel, deneme): iki hafta.
       tahlil     kan tahlili: altı ay. SPİ `core/audit.js`
                  `TAHLIL_ESKI_GUN` ile AYNI sayı; ayrışmasın diye
                  test ikisini yan yana tutar.

     Tür yazılmamış bir sayıya eşik UYDURULMAZ (AGENTS.md §1.7): yaşı
     yine yazılır ama soluklaştırılmaz. */
  const TAZELIK = Object.freeze({ gunluk:3, haftalik:14, tahlil:180 });

  const YON = Object.freeze({ ARTIS_IYI:'artis-iyi', AZALIS_IYI:'azalis-iyi', NOTR:'notr' });

  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
    'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  let sayac = 0;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  function buyukBas(t){
    t = String(t || '');
    return t ? t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1) : t;
  }

  /* Sözleşmedeki alan adı üç biçimde dolaşıyor: `kesinlik` (bu dosya),
     `cert` (modüllerin durum nesneleri), `certainty` (HKM gövdesi).
     Üçü de aynı dört kimliği taşır. */
  function kesinlikOf(s){
    if(!s) return null;
    const k = s.kesinlik != null ? s.kesinlik : (s.cert != null ? s.cert : s.certainty);
    return k == null ? null : String(k);
  }

  function sayiMi(v){
    return typeof v === 'number' && isFinite(v);
  }

  /* Değer VAR mı? «veri yok» etiketi değeri ne olursa olsun ezer: 0
     taşıyan bir `missing` kaydı hâlâ yokluktur. */
  function varMi(s){
    if(!s) return false;
    if(kesinlikOf(s) === 'missing') return false;
    return sayiMi(s.deger) || (typeof s.deger === 'string' && s.deger.trim() !== '');
  }

  /* Türkçe sayı yazımı: ondalık virgül, binlik nokta. */
  function bicim(n, ondalik){
    if(!sayiMi(n)) return '—';
    const od = ondalik == null ? (Number.isInteger(n) ? 0 : 1) : ondalik;
    return n.toLocaleString('tr-TR', { minimumFractionDigits:0, maximumFractionDigits:od });
  }

  /* Birimle birlikte: Türkçede yüzde işareti sayının ÖNÜNDE durur. */
  function birimli(metin, birim){
    if(!birim) return metin;
    return birim === '%' ? '%' + metin : metin + ' ' + birim;
  }

  /* ---------------------------------------------------------- zaman */

  function yerelGun(z){
    if(z == null || z === '') return null;
    if(z instanceof Date) return isNaN(z) ? null : [z.getFullYear(), z.getMonth(), z.getDate()];
    const s = String(z);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if(m){   // yalnız tarih: YEREL gün; bozuk tarih (31 Şubat) kaymaz, reddedilir
      const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? [+m[1], +m[2] - 1, +m[3]] : null;
    }
    const d = new Date(s);
    return isNaN(d) ? null : [d.getFullYear(), d.getMonth(), d.getDate()];
  }

  /* Takvim günü farkı. İki gün UTC'ye SABİTLENEREK çıkarılır: amaç
     UTC'ye geçmek değil, yaz saati geçişinde 23 ya da 25 saatlik bir
     günün sayıyı kaydırmasını önlemek (`yedek.js` ile aynı yol). */
  function yas(zaman, simdi){
    const a = yerelGun(zaman);
    const b = yerelGun(simdi == null ? new Date() : simdi);
    if(!a || !b) return null;
    return Math.round((Date.UTC(b[0], b[1], b[2]) - Date.UTC(a[0], a[1], a[2])) / 864e5);
  }

  function yasMetni(gun){
    if(gun == null) return '';
    if(gun < 0) return 'ileri tarihli';
    if(gun === 0) return 'bugün';
    if(gun === 1) return 'dün';
    return gun + ' gün önce';
  }

  /* «bugün 14:10», «dün 09:30», «12 Eylül 08:40». Saat yoksa yalnız gün. */
  function zamanMetni(zaman, simdi){
    const g = yerelGun(zaman);
    if(!g) return '';
    const s = String(zaman instanceof Date ? zaman.toISOString() : zaman);
    let saat = '';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s)){
      const d = zaman instanceof Date ? zaman : new Date(s);
      saat = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    const f = yas(zaman, simdi);
    const gun = f === 0 ? 'bugün' : f === 1 ? 'dün'
      : g[2] + ' ' + AYLAR[g[1]] + (yerelGun(simdi == null ? new Date() : simdi)[0] !== g[0] ? ' ' + g[0] : '');
    return saat ? gun + ' ' + saat : gun;
  }

  /* 026 — tazelik. Tür verilmezse eşik yok: yaş yazılır, soluklaşmaz. */
  function tazelik(zaman, tur, simdi){
    const gun = yas(zaman, simdi);
    const esik = tur && Object.prototype.hasOwnProperty.call(TAZELIK, tur) ? TAZELIK[tur] : null;
    return {
      gun:gun,
      esik:esik,
      bayat:gun != null && esik != null && gun >= esik,
      metin:yasMetni(gun),
    };
  }

  /* ---------------------------------------------------------- köken */

  function girdiMetni(g){
    const k = L.KESINLIK_ILE ? L.KESINLIK_ILE(kesinlikOf(g)) : null;
    const v = varMi(g) ? birimli(sayiMi(g.deger) ? bicim(g.deger, g.ondalik) : String(g.deger), g.birim) : '—';
    return (g.ad ? g.ad + ': ' : '') + v + (k ? ' (' + k.ad + ')' : '');
  }

  /* 025 — sayının nereden geldiği, satır satır. Eksik alan UYDURULMAZ:
     «kayıtlı değil» yazılır ve `eksik` listesine girer; bir denetim o
     listeye bakıp köken kartı boş kalan sayıyı yakalayabilir. */
  function koken(s, o){
    o = o || {};
    const id = kesinlikOf(s);
    const e = L.KESINLIK_ILE ? L.KESINLIK_ILE(id) : null;
    const satirlar = [];
    const eksik = [];
    const yaz = (ad, deger, alan) => {
      const bos = deger == null || deger === '' || (Array.isArray(deger) && !deger.length);
      if(bos) eksik.push(alan);
      satirlar.push({ ad:ad, deger:bos ? 'kayıtlı değil' : deger });
    };
    const zaman = s && s.zaman ? zamanMetni(s.zaman, o.simdi) : '';

    if(id === 'measured'){
      yaz('Kaynak', s.kaynak, 'kaynak');
      yaz('Ölçüm', zaman, 'zaman');
    }else if(id === 'computed'){
      yaz('Formül', s.formul, 'formul');
      yaz('Girdiler', (s.girdiler || []).map(girdiMetni).join(' · '), 'girdiler');
      yaz('Hesap', zaman, 'zaman');
    }else if(id === 'estimated'){
      yaz('Kaynak', s.kaynak, 'kaynak');
      if(Array.isArray(s.aralik) && s.aralik.length === 2){
        satirlar.push({ ad:'Aralık', deger:birimli(bicim(s.aralik[0], s.ondalik) + '–'
          + bicim(s.aralik[1], s.ondalik), s.birim) });
      }
      if(sayiMi(s.dayanak)) satirlar.push({ ad:'Dayanak', deger:s.dayanak + ' veri' });
      if(zaman) satirlar.push({ ad:'Zaman', deger:zaman });
    }else if(id === 'missing'){
      satirlar.push({ ad:'Durum', deger:e ? e.ozet : 'Kayıt yok.' });
    }
    return {
      tur:id,
      baslik:e ? buyukBas(e.ad) : String(id == null ? 'Etiketsiz' : id),
      satirlar:satirlar,
      eksik:eksik,
    };
  }

  function kokenHtml(s, o){
    o = o || {};
    const k = koken(s, o);
    return '<span class="koken" role="tooltip" data-oz="025"' + (o.id ? ' id="' + kac(o.id) + '"' : '') + '>'
      + '<span class="koken__bas">' + kac(k.baslik) + '</span>'
      + k.satirlar.map(r => '<span class="koken__s"><span class="koken__a">' + kac(r.ad)
        + '</span><span class="koken__v">' + kac(r.deger) + '</span></span>').join('')
      + '</span>';
  }

  /* ---------------------------------------------------------- sayı */

  /* Ekran okuyucunun duyacağı ek. Kesinlik görselde alt çizgiyle ya da
     «—» ile söylenir; kulakta da söylenmesi gerekir. */
  function srEk(id, s){
    if(id === 'missing' || !varMi(s)) return 'veri yok';
    const e = L.KESINLIK_ILE ? L.KESINLIK_ILE(id) : null;
    return e ? e.ad : '';
  }

  /* 024 — sayının markupı.

       s = { deger, birim, kesinlik, ondalik,
             aralik:[alt, ust], dayanak,          (tahmin)
             kaynak, zaman,                         (ölçüldü)
             formul, girdiler:[{ad,deger,birim,kesinlik}], (hesaplandı)
             tazelik:'gunluk'|'haftalik'|'tahlil' } (026)
       o = { koken:false (kartı koyma), simdi:Date (test) }

     Kesinliği olmayan sayı YİNE YAZILIR ama `data-etiketsiz` taşır:
     sayıyı saklamak kullanıcıdan bilgi saklamaktır, işaretlemek ise
     denetimin (`etiketsizler`) onu bulmasını sağlar. */
  function html(s, o){
    s = s || {};
    o = o || {};
    const id = kesinlikOf(s);
    const bilinen = !!(L.KESINLIK_ILE && L.KESINLIK_ILE(id));
    const yok = id === 'missing' || !varMi(s);
    const tur = yok ? 'missing' : (bilinen ? id : null);

    const sinif = ['sayi'];
    if(tur) sinif.push('sayi--' + tur);

    let govde;
    if(yok){
      govde = '<span class="sayi__d" aria-hidden="true">—</span>';
    }else{
      const d = sayiMi(s.deger) ? bicim(s.deger, s.ondalik) : String(s.deger);
      const b = s.birim && s.birim !== '%' ? '<span class="sayi__b">' + kac(s.birim) + '</span>' : '';
      /* Değer ile birim arasındaki boşluk görünmez (inline-flex, gap) ama
         metinde durur: ekran okuyucu «268gün» diye birleşik okumaz (170). */
      govde = '<span class="sayi__d">' + kac(s.birim === '%' ? '%' + d : d) + '</span>' + (b ? ' ' + b : '');
      if(tur === 'estimated' && Array.isArray(s.aralik) && s.aralik.length === 2
        && sayiMi(s.aralik[0]) && sayiMi(s.aralik[1])){
        govde += '<span class="sayi__ar">' + kac(bicim(s.aralik[0], s.ondalik) + '–'
          + bicim(s.aralik[1], s.ondalik)) + '</span>';
      }
    }

    let yasHtml = '';
    if(!yok && s.zaman && s.tazelik){
      const t = tazelik(s.zaman, s.tazelik, o.simdi);
      if(t.bayat){
        sinif.push('sayi--bayat');
        yasHtml = '<span class="sayi__yas" data-oz="026">' + kac(t.metin) + '</span>';
      }
    }

    /* 015 — yenilenirken son bilinen değer ve saati DURUR: ekran boşalıp
       dolmaz, iskelet yok. Tarama çizgisi HAREKETSİZDİR: aynı anda
       hareket eden tek öğe sıradaki iştir (sadelik bütçesi, EKIP-PLANI
       §1.2); yenilenen her sayı nabız atsaydı bütçe aşılırdı. */
    let yenile = '', mesgul = '';
    if(o.yenileniyor){
      sinif.push('sayi--yenileniyor');
      mesgul = ' aria-busy="true"';
      yenile = '<span class="sayi__tarama" data-oz="015" aria-hidden="true"></span>'
        + (!yok && s.zaman && !yasHtml ? '<span class="sayi__yas">' + kac(zamanMetni(s.zaman, o.simdi)) + '</span>' : '');
    }

    /* 170 — ekran okuyucu birimi, etiketi, kesinliği ve farkı duyar. */
    const ek = srEk(tur, s);
    const once = o.etiket ? '<span class="sr-only">' + kac(o.etiket) + ': </span>' : '';
    const sr = (ek ? '<span class="sr-only">, ' + kac(ek) + '</span>' : '')
      + (o.fark ? '<span class="sr-only">, ' + kac(fark(o.fark).sr) + '</span>' : '')
      + (o.yenileniyor ? '<span class="sr-only">, yenileniyor</span>' : '');

    let kart = '', odak = '';
    if(o.koken !== false && tur){
      const kid = 'sayi-k-' + (++sayac);
      kart = kokenHtml(s, { id:kid, simdi:o.simdi });
      odak = ' tabindex="0" aria-describedby="' + kid + '"';
    }

    return '<span class="' + sinif.join(' ') + '" data-oz="024"'
      + ' data-kesinlik="' + kac(tur || '') + '"' + (tur ? '' : ' data-etiketsiz="1"')
      + mesgul + odak + '>' + once + govde + yasHtml + yenile + sr + kart + '</span>';
  }

  /* 170 — sayının SESLİ okunuşu, tek dize: grafik, çip ya da bildirim gibi
     `aria-label` isteyen yerler için. Kesinlik her zaman söylenir (ölçüldü
     de): kulakta alt çizgi yoktur. Etiketsiz sayı etiketsiz diye okunur. */
  function sesli(s, o){
    s = s || {};
    o = o || {};
    const id = kesinlikOf(s);
    const yok = id === 'missing' || !varMi(s);
    let t = o.etiket ? o.etiket + ': ' : '';
    if(yok){
      t += 'veri yok';
    }else{
      t += birimli(sayiMi(s.deger) ? bicim(s.deger, s.ondalik) : String(s.deger), s.birim);
      const e = L.KESINLIK_ILE ? L.KESINLIK_ILE(id) : null;
      t += e ? ', ' + e.ad : ', kesinlik etiketi yok';
      if(id === 'estimated' && Array.isArray(s.aralik) && sayiMi(s.aralik[0]) && sayiMi(s.aralik[1])){
        t += ', ' + bicim(s.aralik[0], s.ondalik) + ' ile ' + bicim(s.aralik[1], s.ondalik) + ' arası';
      }
    }
    if(o.fark) t += ', ' + fark(o.fark).sr;
    if(o.yenileniyor) t += ', yenileniyor';
    return t;
  }

  /* Düz metin: model istemine, bildirime, dışa aktarıma. Etiket yazıda
     da kalır; «268» değil «268 gün (tahmin)». */
  function metin(s){
    const id = kesinlikOf(s);
    if(id === 'missing' || !varMi(s)) return '—';
    const d = birimli(sayiMi(s.deger) ? bicim(s.deger, s.ondalik) : String(s.deger), s.birim);
    const e = L.KESINLIK_ILE ? L.KESINLIK_ILE(id) : null;
    return e && id !== 'measured' ? d + ' (' + e.ad + ')' : d;
  }

  /* Kutunun başındaki glif (özellik 02'nin kesinlik yuvası; T açar, K
     doldurur). Var olan sayıların en zayıfı; hiçbiri yoksa «veri yok». */
  function kutuKesinligi(liste){
    let en = -1;
    (liste || []).forEach(x => {
      const s = typeof x === 'string' ? { kesinlik:x, deger:x === 'missing' ? null : 1 } : x;
      if(!varMi(s)) return;
      const i = SIRA.indexOf(kesinlikOf(s));
      if(i > en) en = i;
    });
    return en < 0 ? 'missing' : SIRA[en];
  }

  function kutuGlifi(liste, o){
    return L.KESINLIK_HTML ? L.KESINLIK_HTML(kutuKesinligi(liste), o) : '';
  }

  /* ---------------------------------------------------------- 028 fark */

  /* f = { deger, yon:'artis-iyi'|'azalis-iyi'|'notr', birim, ek:'dünden',
           esik (bu kadarın altı anlamlı sayılmaz), ondalik }

     Yön yazılmamışsa renk YOKTUR: bir artışın iyi mi kötü mü olduğunu
     tahmin etmek, anlamadığını anlamış gibi yapmaktır. */
  function fark(f){
    f = f || {};
    if(!sayiMi(f.deger)){
      return { anlam:'yok', sinif:'fark fark--yok', metin:'—',
        sr:(f.ek ? f.ek + ' ' : '') + 'karşılaştırılacak değer yok' };
    }
    /* Karar GÖSTERİLEN değerden verilir (ekip/HATALAR.md T2-01): ham 0,3
       ekrana «0» yazılırken «+0, iyi yönde» denmez. Hassasiyet `bicim`'in
       varsayılanıyla aynı; yuvarlama yarımda sıfırdan uzağa, iki yönde eşit. */
    const od = f.ondalik == null ? (Number.isInteger(f.deger) ? 0 : 1) : f.ondalik;
    const kat = Math.pow(10, od);
    const v = (f.deger < 0 ? -1 : 1) * Math.round(Math.abs(f.deger) * kat) / kat;
    const esik = sayiMi(f.esik) ? Math.abs(f.esik) : 0;
    const yonlu = f.yon === YON.ARTIS_IYI || f.yon === YON.AZALIS_IYI;
    let anlam = 'notr';
    if(v !== 0 && yonlu && Math.abs(v) >= esik){
      const artis = v > 0;
      anlam = (f.yon === YON.ARTIS_IYI) === artis ? 'iyi' : 'kotu';
    }
    if(v === 0){
      return { anlam:'notr', sinif:'fark fark--notr', metin:'değişmedi',
        sr:(f.ek ? f.ek + ' ' : '') + 'değişmedi' };
    }
    const mut = bicim(Math.abs(v), od);
    const isaret = v > 0 ? '+' : '−';
    const m = birimli(isaret + mut, f.birim === '%' ? null : f.birim);
    const yazi = (f.birim === '%' ? isaret + '%' + mut : m) + (f.ek ? ' ' + f.ek : '');
    const sr = (f.ek ? f.ek + ' ' : '') + birimli(mut, f.birim) + (v > 0 ? ' arttı' : ' azaldı')
      + (anlam === 'iyi' ? ', iyi yönde' : anlam === 'kotu' ? ', kötü yönde' : '');
    return { anlam:anlam, sinif:'fark fark--' + anlam, metin:yazi, sr:sr };
  }

  function farkHtml(f){
    const r = fark(f);
    return '<span class="' + r.sinif + '" data-oz="028" data-anlam="' + r.anlam + '">'
      + '<span aria-hidden="true">' + kac(r.metin) + '</span>'
      + '<span class="sr-only">' + kac(r.sr) + '</span></span>';
  }

  /* ------------------------------------------------ 018 şüpheli giriş */

  /* ŞÜPHE EŞİKLERİ — dünkü değerden oransal sapma. Bir KARARDIR:
       varsayilan  %50: günlük bir sayının yarısı kadar oynaması olağan
                   değil ama olur; bir basamak kayması (×10) her zaman
                   bu eşiği aşar.
       kilo        %5: bir günde vücut ağırlığının yirmide biri değişmez;
                   değişmiş görünüyorsa büyük olasılıkla yazım hatasıdır.
     Modül kendi metriği için `oran` verebilir; tablo tek yerde durur. */
  const SUPHE = Object.freeze({ varsayilan:0.5, kilo:0.05 });

  const yuvarlaKucuk = n => Math.round(n * 1e6) / 1e6;

  /* Yazım hatasının olası düzeltmeleri: basamak kayması (virgül ya da
     fazladan sıfır) ve iki-üç basamaklı tam sayıda rakamların yer
     değiştirmesi (17 ↔ 71). Uydurma değil: eşiğin İÇİNE düşen aday
     yoksa öneri de yoktur, yalnız soru sorulur. */
  function adaylar(v){
    const out = [10, 100, 1000].reduce((a, k) => a.concat([v / k, v * k]), []);
    const s = String(Math.abs(v));
    if(Number.isInteger(v) && s.length >= 2 && s.length <= 3){
      const t = Number(s.split('').reverse().join(''));
      if(t !== Math.abs(v)) out.push(v < 0 ? -t : t);
    }
    return out.map(yuvarlaKucuk);
  }

  /* 018 — giriş kaydedilmeden ÖNCE çağrılır.
       yeni, dun: sayı; o = { tur:'kilo', oran, birim, ondalik }
     Dünkü değer yoksa (ya da 0 ise) karşılaştırma YAPILMAZ: veri yok
     sıfır değildir ve sıfıra göre her sayı sonsuz sapar. */
  function suphe(yeni, dun, o){
    o = o || {};
    if(!sayiMi(yeni)) return { supheli:false, neden:'deger-yok' };
    if(!sayiMi(dun) || dun === 0) return { supheli:false, neden:'dayanak-yok' };
    const oran = sayiMi(o.oran) ? o.oran
      : (o.tur && Object.prototype.hasOwnProperty.call(SUPHE, o.tur) ? SUPHE[o.tur] : SUPHE.varsayilan);
    const sapma = Math.abs(yeni - dun) / Math.abs(dun);
    if(sapma < oran) return { supheli:false, sapma:sapma, oran:oran };
    let oneri = null, en = Infinity;
    adaylar(yeni).forEach(a => {
      const s = Math.abs(a - dun) / Math.abs(dun);
      if(s < oran && Math.abs(a - dun) < en){ en = Math.abs(a - dun); oneri = a; }
    });
    const b = n => birimli(bicim(n, o.ondalik == null ? (Number.isInteger(n) ? 0 : 1) : o.ondalik), o.birim);
    /* Soru eki («mı/mi/mu») birimin OKUNUŞUNA göre çekimlenir ve kodda
       güvenle kurulamaz; cümle eki gerektirmeyecek biçimde yazıldı. */
    const soru = 'Dün ' + b(dun) + ' idi; ' + b(yeni) + ' çok farklı.'
      + (oneri != null ? ' Hangisini kaydedelim?' : ' Yine de kaydedilsin mi?');
    return { supheli:true, sapma:sapma, oran:oran, dun:dun, yeni:yeni, oneri:oneri, soru:soru,
      secenekler:(oneri != null ? [oneri] : []).concat([yeni]).map(v => ({ deger:v, etiket:b(v) + ' olarak kaydet' })) };
  }

  /* Soru ekranda: kaydeden düğmeler SONUCU söyler («71,4 kg olarak
     kaydet», özellik 22); «Evet» ya da «Tamam» yok. Önerilen düzeltme
     önce gelir; «Düzelt» girişe geri döner, hiçbir şey kaydetmez. */
  function supheHtml(r){
    if(!r || !r.supheli) return '';
    return '<div class="suphe" data-oz="018" role="group" aria-label="Şüpheli giriş">'
      + '<p class="suphe__soru">' + kac(r.soru) + '</p><div class="suphe__eylem">'
      + r.secenekler.map((s, i) => '<button type="button" class="btn btn--sm' + (i === 0 && r.oneri != null ? '' : ' btn--ghost') + '"'
        + ' data-act="suphe-kaydet" data-deger="' + kac(s.deger) + '"><span class="btn__label">'
        + kac(s.etiket) + '</span></button>').join('')
      + '<button type="button" class="btn btn--sm btn--ghost" data-act="suphe-duzelt">'
      + '<span class="btn__label">Düzelt</span></button>'
      + '</div></div>';
  }

  /* ---------------------------------------------------------- DOM */

  /* Köken kartı fareyle ve klavyeyle CSS'ten açılır (`:hover`,
     `:focus-visible`). Dokunmatik ekranda üzerine gelmek yoktur:
     BASILI TUTMAK kartı açar, başka bir yere dokunmak ya da Esc kapatır.
     Bir kez bağlanır; ekranlar yeniden çizildikçe yeniden bağlamak
     gerekmez (olay kökte dinlenir). */
  const BASILI_MS = 450;
  function bagla(kok){
    kok = kok || document;
    if(kok.__sayiBagli) return false;
    kok.__sayiBagli = true;
    let zaman = null;
    const kapat = haric => {
      kok.querySelectorAll('.sayi--acik').forEach(el => { if(el !== haric) el.classList.remove('sayi--acik'); });
    };
    kok.addEventListener('pointerdown', ev => {
      const el = ev.target && ev.target.closest ? ev.target.closest('.sayi[aria-describedby]') : null;
      kapat(el);
      if(!el || ev.pointerType === 'mouse') return;
      clearTimeout(zaman);
      zaman = setTimeout(() => el.classList.add('sayi--acik'), BASILI_MS);
    });
    const birak = () => { clearTimeout(zaman); zaman = null; };
    kok.addEventListener('pointerup', birak);
    kok.addEventListener('pointercancel', birak);
    kok.addEventListener('keydown', ev => { if(ev.key === 'Escape') kapat(null); });
    return true;
  }

  /* Denetim için: kesinliği olmayan sayıların düğümleri. Duman testi
     «bu ekranda etiketsiz sayı yok» cümlesini buna bakarak kurar. */
  function etiketsizler(kok){
    return Array.prototype.slice.call((kok || document).querySelectorAll('.sayi[data-etiketsiz]'));
  }

  L.SAYI = {
    SIRA:SIRA,
    TAZELIK:TAZELIK,
    YON:YON,
    BASILI_MS:BASILI_MS,
    kesinlikOf:kesinlikOf,
    varMi:varMi,
    bicim:bicim,
    birimli:birimli,
    yas:yas,
    yasMetni:yasMetni,
    zamanMetni:zamanMetni,
    tazelik:tazelik,
    koken:koken,
    kokenHtml:kokenHtml,
    html:html,
    metin:metin,
    sesli:sesli,
    kutuKesinligi:kutuKesinligi,
    kutuGlifi:kutuGlifi,
    fark:fark,
    farkHtml:farkHtml,
    SUPHE:SUPHE,
    suphe:suphe,
    supheHtml:supheHtml,
    bagla:bagla,
    etiketsizler:etiketsizler,
    kac:kac,
  };
})();
