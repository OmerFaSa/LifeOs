/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/vitrin.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* VİTRİN KARTLARI — kataloğun (ekip/vitrin.html) kartlarını GERÇEK
   veriyle çizen tek kalıp.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/vitrin.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi
   `brand/ortak/vitrin.css`'tedir ve O DA ÜRETİLİR (`tools/vitrin.py`,
   kaynak vitrinin kendisi). Sistem durumları (çevrilmiş kart, giriş
   hücresi) `kart.css` › «VİTRİN DURUMLARI»ndadır.
   ==================================================================

   KURAL

   1. Kartın İŞARETLEMESİ vitrindeki şablonun işaretlemesidir; sınıf
      adları oradan gelir (`x25 .r .br`). Vitrin değişirse burası değişir.
   2. SAYIYI KOD VERİR. Bu dosya hesap yapmaz, yalnız BİÇİMLER: net,
      ortalama, kapsam çağıran modülün kural motorundan gelir. Tek istisna
      çizimin kendi geometrisidir (çubuğun yüzde genişliği).
   3. EKSİK VERİ SIFIR DEĞİLDİR. Gerekli veri yoksa kart çizilmez (boş
      dize döner) ya da o hücre «—» yazar; hiçbir çizim eksiği 0'a çizmez.
   4. Her kartın kökü `<div class="vk" data-oz="NNN">`: katalog numarası
      envanterin «ekranda» sayımıdır.
   5. Ekranda görünen her metin düzgün Türkçedir; büyük harf `tr-TR`. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  /* ------------------------------------------------ yardımcılar */

  function kac(s){
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const sayiMi = v => typeof v === 'number' && isFinite(v);
  const buyuk = s => String(s == null ? '' : s).toLocaleUpperCase('tr-TR');

  /* Sayı biçimi SAYI'nınkiyle aynı (tr-TR, virgül); eksi işareti tipografik. */
  function sayi(n, od){
    if(!sayiMi(n)) return '—';
    const S = L.SAYI;
    const mutlak = Math.abs(n);
    const t = S && S.bicim ? S.bicim(mutlak, od)
      : mutlak.toLocaleString('tr-TR', { maximumFractionDigits:od == null ? (Number.isInteger(mutlak) ? 0 : 1) : od });
    return (n < 0 ? '−' : '') + t;
  }
  function isaretli(n, od){
    if(!sayiMi(n)) return '—';
    if(n === 0) return '0';
    return (n > 0 ? '+' : '−') + sayi(Math.abs(n), od);
  }
  function dkMetni(dk){
    if(!sayiMi(dk)) return '—';
    const d = Math.max(0, Math.round(dk));
    if(d < 60) return d + ' dk';
    const sa = Math.floor(d / 60), kalan = d % 60;
    return sa + ' sa' + (kalan ? ' ' + kalan + ' dk' : '');
  }
  const yuzdeGen = (a, b) => (sayiMi(a) && sayiMi(b) && b > 0) ? Math.max(0, Math.min(100, 100 * a / b)) : 0;
  const px = n => (Math.round(n * 10) / 10) + '%';

  /* Kesinlik: dört etiket, vitrinin dört glifi (o dolu · h yarım · t kesik ·
     y yok). Başka bir etiket YOKTUR; «beyan» gibi bir ad yalnız METİNDİR,
     kesinliği ölçülmüştür (kullanıcı söyledi, kod saydı). */
  const KES = {
    measured:{ g:'o', ad:'ÖLÇÜLDÜ' }, computed:{ g:'h', ad:'HESAPLANDI' },
    estimated:{ g:'t', ad:'TAHMİN' }, missing:{ g:'y', ad:'VERİ YOK' },
  };
  function et(kesinlik, metin){
    const k = KES[kesinlik] || KES.missing;
    return '<span class="et ' + k.g + '" data-kesinlik="' + (KES[kesinlik] ? kesinlik : 'missing') + '">'
      + kac(metin ? buyuk(metin) : k.ad) + '</span>';
  }

  /* Vitrinin simge takımı (16'lık ızgara, çizgi). Sistemin simge.js'i
     ürün simgelerini taşır; bunlar kartın içindeki küçük işaretlerdir. */
  const IKON = {
    oyn:'<path d="M5 3v10l8-5z" fill="currentColor" stroke="none"/>',
    tik:'<path d="M3.5 8.5l3 3 6-7"/>', eksi:'<path d="M4 8h8"/>', arti:'<path d="M8 3v10M3 8h10"/>',
    asagi:'<path d="M4.5 6.5L8 10l3.5-3.5"/>', sag:'<path d="M6 3.5L10.5 8 6 12.5"/>',
    sol:'<path d="M10 3.5L5.5 8l4.5 4.5"/>', kapat:'<path d="M4 4l8 8M12 4l-8 8"/>',
    ok:'<path d="M3 8h10M9 4l4 4-4 4"/>', saat:'<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.2"/>',
    bilgi:'<circle cx="8" cy="8" r="6"/><path d="M8 7.5v3.5M8 5h.01"/>',
    zil:'<path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3"/>',
    kalkan:'<path d="M8 1.8l5 2v4c0 3.2-2.2 5.3-5 6.4C5.2 13.1 3 11 3 7.8v-4z"/><path d="M5.8 8l1.6 1.6 3-3.2"/>',
    kilit:'<rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
    ses:'<path d="M3 6h2.5L9 3v10L5.5 10H3z"/><path d="M11.5 5.5a3.5 3.5 0 0 1 0 5"/>',
    ara:'<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
    yildiz:'<path d="M8 2l1.4 4.1L13.5 7.5 9.4 8.9 8 13l-1.4-4.1L2.5 7.5l4.1-1.4z"/>',
    den:'<path d="M3 13V9M8 13V4M13 13V7"/>',
    bulut:'<path d="M4.5 12.5h7a3 3 0 0 0 .4-6A4 4 0 0 0 4.3 7a2.8 2.8 0 0 0 .2 5.5z"/><path d="M2 2l12 12"/>',
    isaret:'<path d="M4.5 2.5h7v11L8 11l-3.5 2.5z"/>',
    baglanti:'<path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1"/>',
    kopya:'<rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5"/>',
  };
  function ikon(ad, stil){
    return '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"' + (stil ? ' style="' + stil + '"' : '') + '>'
      + (IKON[ad] || '') + '</svg>';
  }

  /* Tik şeridi: her kod bir kutucuk (g geçen · n şimdi · i iyi · k kötü ·
     h taralı · d dolu · «.» boş). */
  function tik(kodlar, o){
    const dizi = Array.isArray(kodlar) ? kodlar : String(kodlar || '').split('');
    o = o || {};
    return '<div data-tik=""' + (o.stil ? ' style="' + o.stil + '"' : '') + ' aria-hidden="true">'
      + dizi.map(c => '<i' + (c && c !== '.' ? ' class="t-' + c + '"' : '') + '></i>').join('') + '</div>';
  }

  /* Kapsam halkası: yüzde verilmezse halka BOŞ çizilmez, kesik çizilir. */
  function hl(p){
    if(!sayiMi(p)) return '<span class="hl hl--yok" aria-hidden="true"></span>';
    return '<span class="hl" style="--p:' + Math.round(Math.max(0, Math.min(100, p))) + '" aria-hidden="true"></span>';
  }

  /* Anlamlı fark rozeti (028'in kararı, vitrinin biçimi): renk işaretten
     değil yönden gelir; eşiğin altındaki fark nötrdür. */
  function fk(deger, o){
    o = o || {};
    if(!sayiMi(deger)) return '<span class="fk n">—</span>';
    const S = L.SAYI;
    const yon = o.yon || 'artis-iyi';
    const r = S && S.fark ? S.fark({ deger, yon, esik:o.esik, ondalik:o.ondalik, birim:o.birim })
      : { anlam:'notr', metin:isaretli(deger, o.ondalik), sr:isaretli(deger, o.ondalik) };
    const g = r.anlam === 'iyi' ? 'i' : r.anlam === 'kotu' ? 'k' : 'n';
    const metin = deger === 0 || r.metin === 'değişmedi' ? '0' : r.metin;
    return '<span class="fk ' + g + '" data-anlam="' + r.anlam + '"><span aria-hidden="true">' + kac(metin)
      + '</span><span class="sr-only">' + kac(r.sr) + '</span></span>';
  }

  function nitelik(o){
    if(!o) return '';
    return Object.keys(o).filter(k => o[k] != null && o[k] !== false).map(k =>
      ' ' + k + (o[k] === true ? '' : '="' + kac(o[k]) + '"')).join('');
  }

  /* Kartın kökü. `ek` kök sınıfına eklenir, `nit` köke nitelik olur. */
  function kok(no, k, ic, o){
    o = o || {};
    return '<div class="vk' + (o.dis ? ' ' + o.dis : '') + '" data-oz="' + no + '"'
      + (o.etiket ? ' role="group" aria-label="' + kac(o.etiket) + '"' : '') + nitelik(o.nit) + '>'
      + '<div class="d ' + k + (o.ek ? ' ' + o.ek : '') + '"' + (o.stil ? ' style="' + kac(o.stil) + '"' : '') + '>' + ic + '</div></div>';
  }

  /* Düğme: vitrinin `.bt` biçimi, sistemin eylem bağı (`data-act`). */
  function dugme(o){
    return '<button type="button" class="bt ' + (o.ton || 'g') + '" data-act="' + kac(o.act) + '"'
      + nitelik(o.data) + (o.aria ? ' aria-label="' + kac(o.aria) + '"' : '')
      + (o.pasif ? ' disabled' : '') + '>' + (o.ikon ? ikon(o.ikon) : '') + kac(o.metin) + '</button>';
  }

  /* Modül rengi sınıfı: kartın --c'si. Bilinmeyen modül AYS'ye düşmez. */
  const MOD = { ays:'c-ays', spi:'c-spi', esp:'c-esp', mer:'c-mer' };
  const renk = m => MOD[m] || '';

  /* ================================================== C · AYS */

  /* 043 GERİ SAYIM ROZETİ — uzakken sakin, son 15 dakikada canlı. Sayı
     çağıranın verdiği kalan dakikadır (süren bloğun planlanan bitişine). */
  function geriSayim(o){
    if(!o || !sayiMi(o.dakika) || o.dakika < 0) return '';
    const d = Math.ceil(o.dakika);
    const c = renk(o.modul || 'ays');
    const canli = d <= 15;
    const ic = canli
      ? '<div class="k ' + c + '"><div class="hk"><svg viewBox="0 0 64 64" aria-hidden="true">'
        + '<circle cx="32" cy="32" r="28" fill="none" stroke="var(--vk-s3)" stroke-width="5"/>'
        + '<circle cx="32" cy="32" r="28" fill="none" stroke="var(--c)" stroke-width="5" stroke-linecap="round"'
        + ' stroke-dasharray="' + (176 * Math.min(15, d) / 15).toFixed(1) + ' 176" transform="rotate(-90 32 32)"/></svg>'
        + '<b>' + d + '</b><span>DK</span></div><span class="cap" style="color:var(--c)">SON 15 DK · CANLI</span></div>'
      : '<div class="k"><span class="pil"><i></i>' + kac(dkMetni(d)) + '</span><span class="cap">UZAKTA · SAKİN</span></div>';
    return kok('043', 'x22v', ic, { ek:'tek' + (canli ? ' is-canli' : ''),
      etiket:(o.ad ? o.ad + ' bloğunun bitişine ' : 'Bitişe ') + dkMetni(d) + ' var' });
  }

  /* 044 NÖTR SORU ŞERİDİ — çözerken yalnız ilerleme; doğru/yanlış rengi
     set bitince açılır. `cevaplar` (çözerken): cevaplı mı; `sonuclar`
     (bitince): 'd' doğru · 'y' yanlış · null boş. */
  function notrSerit(o){
    if(!o) return '';
    if(Array.isArray(o.sonuclar) && o.sonuclar.length){
      const s = o.sonuclar;
      const D = s.filter(x => x === 'd').length, Y = s.filter(x => x === 'y').length, B = s.length - D - Y;
      return kok('044', 'x23', '<div><span class="cap">SET BİTİNCE · ' + D + ' D · ' + Y + ' Y · ' + B + ' B</span>'
        + tik(s.map(x => x === 'd' ? 'i' : x === 'y' ? 'k' : '.')) + '</div>',
        { etiket:D + ' doğru, ' + Y + ' yanlış, ' + B + ' boş' });
    }
    if(Array.isArray(o.cevaplar) && o.cevaplar.length){
      const n = o.cevaplar.filter(Boolean).length;
      return kok('044', 'x23', '<div><span class="cap">ÇÖZERKEN · ' + n + ' / ' + o.cevaplar.length + '</span>'
        + tik(o.cevaplar.map(x => x ? 'g' : '.')) + '</div>',
        { etiket:o.cevaplar.length + ' sorunun ' + n + ' tanesi cevaplı; doğru ve yanlış bölüm bitince görünür' });
    }
    return '';
  }

  /* 045 YANLIŞ KARTI — önde soru, arkada «neden yanlış». Kart kendisi
     düğmedir (çevirmek tek dokunuş); çevrilmiş hâl `cevrik`. */
  function yanlisKarti(o){
    if(!o || !o.on) return '';
    const cevrik = !!o.cevrik;
    const ust = buyuk(o.ust || 'KART');
    const ic = '<div class="kk' + (cevrik ? ' is-cevrik' : '') + '">'
      + '<div class="yz"' + (cevrik ? ' aria-hidden="true"' : '') + '><span class="cap">' + kac(ust) + '</span><b>' + kac(o.on)
      + '</b><span class="cap">ÖN YÜZ</span></div>'
      + '<div class="yz ar"' + (cevrik ? '' : ' aria-hidden="true"') + '><span class="cap" style="color:var(--c,var(--ays))">'
      + kac(buyuk(o.arkaAd || 'CEVAP')) + '</span><b>' + kac(o.arka || '—') + '</b><span class="cap">ARKA YÜZ</span></div></div>';
    return kok('045', 'x24', ic, { ek:renk(o.modul || 'ays'), nit:Object.assign({
      role:'button', tabindex:'0', 'data-act':o.act || null,
      'aria-label':(cevrik ? 'Arka yüz: ' + (o.arka || '') : 'Ön yüz: ' + o.on) + ' — çevirmek için dokun',
      'aria-pressed':cevrik ? 'true' : 'false' }, o.data || {}) });
  }

  /* 046 DENEME KARNESİ — ders başına tek satır; satırın uzunluğu o dersin
     soru sayısıyla orantılı. Net KODDAN gelir (`satir.net`). */
  function denemeKarnesi(o){
    const satirlar = (o && o.satirlar || []).filter(Boolean);
    if(!satirlar.length) return '';
    const n = s => [s.d, s.y, s.b].every(sayiMi) ? s.d + s.y + s.b : null;
    const enCok = Math.max.apply(null, satirlar.map(s => n(s) || 0));
    const ic = satirlar.map(s => {
      const top = n(s);
      if(!top) return '<div class="r"><span>' + kac(s.ad) + '</span><div class="br" aria-hidden="true"></div><em>—</em></div>';
      return '<div class="r"><span>' + kac(s.ad) + '</span><div class="br" style="width:' + px(yuzdeGen(top, enCok)) + '"'
        + ' role="img" aria-label="' + kac(s.ad + ': ' + s.d + ' doğru, ' + s.y + ' yanlış, ' + s.b + ' boş') + '">'
        + '<i class="d" style="width:' + px(100 * s.d / top) + '"></i><i class="y" style="width:' + px(100 * s.y / top) + '"></i>'
        + '<i class="b" style="width:' + px(100 * s.b / top) + '"></i></div><em>' + sayi(s.net, 2) + '</em></div>';
    }).join('');
    return kok('046', 'x25', ic + '<div class="top"><span class="cap">' + kac(buyuk(o.aile || '')) + (o.aile ? ' · ' : '')
      + 'DOĞRU · YANLIŞ · BOŞ</span><b>' + sayi(o.toplam, 2) + '</b></div>');
  }

  /* 047 HIZ ŞERİDİ — her sorunun süresi bir nokta; ortalamanın 1,5 katını
     geçenler öne çıkar. Süreler ÖLÇÜLMÜŞTÜR (oturumun kronometresi). */
  function hizSeridi(o){
    const t = (o && o.sureler || []).filter(v => sayiMi(v) && v > 0);
    if(t.length < 3) return '';
    const kat = (o && o.kat) || 1.5;
    const ort = t.reduce((a, b) => a + b, 0) / t.length;
    const ust = Math.max.apply(null, t) * 1.08;
    const y = v => 94 - v / ust * 84;
    const iki = n => n < 10 ? '0' + n : '' + n;
    const sure = s => Math.floor(s / 60) + ':' + iki(Math.round(s % 60));
    let s = '<line x1="6" x2="254" y1="' + y(ort).toFixed(1) + '" y2="' + y(ort).toFixed(1) + '" stroke="var(--vk-ink4)" stroke-dasharray="3 3"/>'
      + '<text x="254" y="' + (y(ort) - 5).toFixed(1) + '" text-anchor="end" fill="var(--vk-ink3)" style="font:400 9px var(--vk-mono)">ort. ' + sure(ort) + '</text>';
    const uzun = [];
    t.forEach((v, i) => {
      const x = 10 + i * (240 / Math.max(1, t.length - 1));
      if(v >= ort * kat){
        uzun.push(i + 1);
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="7" fill="var(--vk-ink)" opacity=".12"/>'
          + '<circle cx="' + x.toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3.6" fill="var(--vk-ink)"/>';
      }else{
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="2.6" fill="var(--vk-ink3)"/>';
      }
    });
    s += '<line x1="6" y1="98" x2="254" y2="98" stroke="var(--vk-l2)"/>';
    const et2 = t.length + ' soru, ortalama ' + sure(ort) + '; ' + (uzun.length
      ? uzun.length + ' soru ortalamanın ' + sayi(kat, 1) + ' katını geçti (' + uzun.slice(0, 8).join(', ') + ')'
      : 'ortalamanın ' + sayi(kat, 1) + ' katını geçen soru yok');
    return kok('047', 'y12', '<svg class="gr" viewBox="0 0 260 104" role="img" aria-label="' + kac(et2) + '">' + s + '</svg>'
      + '<div class="lg"><span><i style="background:var(--vk-ink3);height:6px;width:6px;border-radius:50%"></i>soru başına süre</span>'
      + '<span><i style="background:var(--vk-ink);height:8px;width:8px;border-radius:50%"></i>ortalamanın ' + sayi(kat, 1) + ' katı</span></div>');
  }

  /* 048 DENEME KARŞILAŞTIRMASI — iki deneme ders ders yan yana, fark
     rozetleriyle. Fark `fk` ile: eşiğin altı nötr (varsayılan 1 net). */
  function denemeKarsilastirma(o){
    const satirlar = (o && o.satirlar || []).filter(Boolean);
    if(!satirlar.length) return '';
    const esik = o.esik == null ? 1 : o.esik;
    const satir = (ad, a, b, top) => '<div class="r' + (top ? ' top' : '') + '"><span>' + kac(ad) + '</span><em class="e">' + sayi(a, 2)
      + '</em>' + ikon('ok') + '<em>' + sayi(b, 2) + '</em>'
      + (sayiMi(a) && sayiMi(b) ? fk(Math.round((b - a) * 100) / 100, { esik, ondalik:2 }) : '<span class="fk n">—</span>') + '</div>';
    return kok('048', 'y13', '<div class="r bs"><span>DERS</span><span style="text-align:right">' + kac(buyuk(o.onceAd))
      + '</span><span></span><span style="text-align:right">' + kac(buyuk(o.sonraAd)) + '</span><span></span></div>'
      + satirlar.map(s => satir(s.ad, s.once, s.sonra)).join('')
      + (o.toplam ? satir('Toplam', o.toplam.once, o.toplam.sonra, true) : ''));
  }

  /* 049 KONU KAPSAM HALKASI — planlanan sorunun ne kadarı çözüldü. Plan
     yoksa oran yoktur: halka kesik, sayı «—». */
  function kapsamHalkasi(o){
    const s = (o && o.satirlar || []).filter(Boolean);
    if(!s.length) return '';
    return kok('049', 'x26', s.map(r => {
      const planVar = sayiMi(r.plan) && r.plan > 0;
      return '<div class="r">' + hl(planVar && sayiMi(r.cozulen) ? 100 * r.cozulen / r.plan : null) + '<span>' + kac(r.ad) + '</span><em>'
        + (planVar ? sayi(sayiMi(r.cozulen) ? r.cozulen : null) + ' / ' + sayi(r.plan) : '— / —') + '</em></div>';
    }).join(''), { ek:renk(o.modul || 'ays') });
  }

  /* 050 KONU ZİNCİRİ — önkoşul sırası ve her halkanın kapsamı; eksik
     önkoşul kesik çerçeveyle işaretli («önce bu»). */
  function konuZinciri(o){
    const h = (o && o.halkalar || []).filter(Boolean);
    if(h.length < 2) return '';
    return kok('050', 'y14', h.map((x, i) => (i ? ikon('ok') : '')
      + '<div class="dg' + (x.eksik ? ' ek' : '') + '">' + hl(x.p) + '<b>' + kac(x.ad) + '</b><span>'
      + (x.eksik ? 'önce bu' : sayiMi(x.p) ? '%' + Math.round(x.p) : '—') + '</span></div>').join(''),
      { ek:renk(o.modul || 'ays'), etiket:'Önkoşul sırası: ' + h.map(x => x.ad + (x.eksik ? ' (eksik önkoşul)' : '')).join(', ') });
  }

  /* 051 40 HAFTA ÇİZGİSİ — sınava kadar her hafta bir tik; ara haftaları
     taralı. `ara`: tamamı ara olan hafta numaraları. */
  function haftaCizgisi(o){
    if(!o || !sayiMi(o.toplam) || o.toplam < 1 || !sayiMi(o.hafta)) return '';
    const ara = o.ara || [];
    const kod = [];
    for(let i = 1; i <= o.toplam; i++) kod.push(ara.indexOf(i) >= 0 ? 'h' : i < o.hafta ? 'g' : i === o.hafta ? 'n' : '.');
    return kok('051', 'x27', '<div class="u"><span class="cap">' + kac(buyuk(o.etiket || 'Hazırlık')) + '</span><span class="cap">'
      + o.hafta + ' / ' + o.toplam + ' HAFTA</span></div>' + tik(kod, { stil:'--c:var(--ays)' })
      + '<div class="lg"><span><i style="background:var(--vk-ink3)"></i>geçen</span><span><i style="background:var(--ays)"></i>bu hafta</span>'
      + (ara.length ? '<span><i style="background:repeating-linear-gradient(135deg,var(--vk-ink4) 0 2px,transparent 2px 4px)"></i>ara haftası</span>' : '') + '</div>',
      { etiket:o.toplam + ' haftanın ' + o.hafta + '. haftası' + (ara.length ? '; ' + ara.length + ' ara haftası' : '') });
  }

  /* 052 HAFTALIK PLAN IZGARASI — yedi gün × yuva; bloklar modül renginde,
     boş yuvalar taralı, bugün çerçeveli. Yuvalar saat DEĞİL, planın
     kendi yuva adlarıdır: bloklara saat yazılmadığı için saat uydurulmaz.
     o = { gunler:['PT',…], bugun:0-6|null, yuvalar:['Ana ders',…],
           bloklar:[{ gun, yuva, modul, gecti, durum }] } */
  function planIzgarasi(o){
    if(!o || !(o.yuvalar || []).length || !(o.gunler || []).length) return '';
    const Y = o.yuvalar.length;
    let s = '<span></span>' + o.gunler.map((g, i) => '<span class="hd' + (i === o.bugun ? ' bu' : '') + '">' + kac(buyuk(g)) + '</span>').join('');
    s += o.yuvalar.map((y, i) => '<span class="sa" style="grid-row:' + (i + 2) + '">' + kac(y) + '</span>').join('');
    s += '<span class="zm"></span>';
    if(sayiMi(o.bugun)) s += '<span class="bgn" style="grid-column:' + (o.bugun + 2) + '"></span>';
    (o.bloklar || []).forEach(b => {
      if(!sayiMi(b.gun) || !sayiMi(b.yuva)) return;
      const d = b.durum === 'skipped' ? ' is-atlandi' : '';
      s += '<i class="bk ' + (b.gecti ? 's ' : '') + (renk(b.modul) || 'c-ays') + d + '" style="grid-column:' + (b.gun + 2)
        + ';grid-row:' + (b.yuva + 2) + '"' + (b.ad ? ' title="' + kac(b.ad) + '"' : '') + '></i>';
    });
    const et2 = o.gunler.length + ' gün, ' + (o.bloklar || []).length + ' blok'
      + ((o.bloklar || []).some(b => b.gecti) ? '; geçen günler soluk' : '');
    return kok('052', 'y15', s, { stil:'grid-template-columns:52px repeat(' + o.gunler.length + ',1fr);grid-template-rows:14px repeat(' + Y + ',22px)',
      nit:{ role:'img', 'aria-label':et2 } });
  }

  /* 053 ARA HAFTASI ÖNİZLEMESİ — etkilenen haftalar çizilir, tek onayla
     uygulanır. `haftalar`: [{ ad, durum:'a' etkilenen | '' }]. */
  function araHaftasi(o){
    const h = (o && o.haftalar || []).filter(Boolean);
    if(!h.length) return '';
    return kok('053', 'x28', '<div class="hf" style="grid-template-columns:repeat(' + h.length + ',1fr)">'
      + h.map(x => '<div' + (x.durum ? ' class="' + x.durum + '"' : '') + '>' + kac(x.ad) + '</div>').join('') + '</div>'
      + '<div class="on"><span class="mod c-mer">' + kac(buyuk(o.seviye || 'orta')) + '</span><span>' + kac(o.ozet || '') + '</span>'
      + (o.act ? dugme({ metin:o.dugme || 'Onayla', ton:'p', act:o.act, data:o.data }) : '') + '</div>',
      { etiket:'Etkilenen haftalar: ' + h.filter(x => x.durum === 'a').map(x => x.ad).join(', ') });
  }

  /* 054 TAŞIMA GÖLGESİ — taşınan blok havada, eski yeri hayalet çizgi;
     bırakınca «Geri al». `bloklar`: [{ ad, not, hayalet, tasinan }]. */
  function tasimaGolgesi(o){
    const b = (o && o.bloklar || []).filter(Boolean);
    if(!b.length) return '';
    return kok('054', 'x29', b.map(x => '<div class="bl' + (x.hayalet ? ' hy' : '') + (x.tasinan ? ' ts' : '') + '">'
      + kac(x.ad) + (x.not ? '<em>' + kac(x.not) + '</em>' : '') + '</div>').join('')
      + (o.act ? dugme({ metin:'Geri al', ton:'g ga', act:o.act, data:o.data }) : ''));
  }

  /* 055 TEK SATIR SORU EKLE — ders · konu · sonuç üç seçim; Enter ile
     kaydedilir. Açılır pencere yok. Seçimler gerçek <select>'tir (klavye
     ve ekran okuyucu için), görünüşleri vitrinin çipleri. */
  function tekSatirSoru(o){
    if(!o) return '';
    const secim = (id, ad, secenekler, deger, sinif) => '<label class="ci' + (sinif ? ' ' + sinif : '') + '">'
      + '<span class="sr-only">' + kac(ad) + '</span><select id="' + kac(id) + '"' + (o.change ? ' data-change="' + kac(o.change) + '"' : '')
      + ' data-alan="' + kac(id) + '">' + secenekler.map(x => '<option value="' + kac(x.value) + '"'
        + (String(x.value) === String(deger == null ? '' : deger) ? ' selected' : '') + '>' + kac(x.label) + '</option>').join('')
      + '</select>' + ikon('asagi') + '</label>';
    const sonuc = (o.sonuclar || []).find(x => String(x.value) === String(o.sonuc)) || {};
    return kok('055', 'x30', '<div class="sat2" data-hizli-satir="">'
      + secim(o.id + '-ders', 'Ders', o.dersler || [], o.ders)
      + secim(o.id + '-konu', 'Konu', o.konular || [], o.konu)
      + secim(o.id + '-sonuc', 'Sonuç', o.sonuclar || [], o.sonuc, sonuc.iyi ? 'i' : '')
      + '<button type="button" class="kbd-d" data-act="' + kac(o.act) + '" aria-label="Kaydet (Enter)"><kbd>↵</kbd></button></div>'
      + '<div class="cap">' + kac(buyuk(o.not || 'Açılır pencere yok · Enter kaydeder')) + '</div>');
  }

  /* 056 YANLIŞ NEDENLERİ — set sonunda her yanlışa tek dokunuşla neden;
     dağılım BEYANDIR (kullanıcı seçti, kod saydı). */
  function yanlisNedenleri(o){
    const n = (o && o.nedenler || []).filter(x => x && sayiMi(x.n) && x.n > 0);
    const toplam = n.reduce((a, x) => a + x.n, 0);
    if(!toplam) return '';
    const TON = [100, 72, 50, 32, 18];
    const r = i => i === 0 ? 'var(--c)' : 'color-mix(in oklab,var(--c) ' + TON[Math.min(i, TON.length - 1)] + '%,var(--vk-s2))';
    return kok('056', 'z10', '<div class="u"><b>' + toplam + ' ' + kac(o.birim || 'yanlış') + '</b>' + et('measured', 'beyan') + '</div>'
      + '<div class="br" role="img" aria-label="' + kac(n.map(x => x.ad + ' ' + x.n).join(', ')) + '">'
      + n.map((x, i) => '<i style="width:' + px(100 * x.n / toplam) + ';background:' + r(i) + '"></i>').join('') + '</div>'
      + '<div class="ls">' + n.map((x, i) => '<div><i style="background:' + r(i) + '"></i>' + kac(x.ad) + '<em>' + x.n + '</em></div>').join('') + '</div>',
      { ek:renk(o.modul || 'ays') });
  }

  /* 057 DENEME TAKVİMİ — denemeler tek çizgide; geçmiş olan netiyle,
     sıradaki parlayarak. `ogeler`: [{ ad, tarih, not, durum:'g'|'y'|'' }];
     `bugun`: çizgideki yeri (0-100). */
  function denemeTakvimi(o){
    const s = (o && o.ogeler || []).filter(Boolean);
    if(s.length < 2) return '';
    const bugun = sayiMi(o.bugun) ? Math.max(0, Math.min(100, o.bugun)) : null;
    return kok('057', 'z11', '<div class="tr"' + (bugun != null ? ' style="--bugun:' + px(bugun) + '"' : '') + '>'
      + (bugun != null ? '<span class="bu"></span>' : '')
      + s.map(x => '<span class="nk' + (x.durum ? ' ' + x.durum : '') + '" style="left:' + px(x.yer) + '"><b>' + kac(x.ad) + '</b><i></i><span>'
        + kac(x.not || '') + '</span></span>').join('') + '</div>'
      + '<div class="lg">' + et(o.kesinlik || 'computed', o.etiketAd || 'planlı') + '<span>çizgi · bugün</span></div>',
      { etiket:s.map(x => x.ad + ' ' + (x.not || '')).join('; ') });
  }

  /* 058 SORU EKRANI — soru numarası, süre ve şıklar; doğru ya da yanlış
     ÇÖZERKEN gösterilmez. Şıklar düğmedir; seçili şık yalnız «seçili». */
  function soruEkrani(o){
    if(!o || !o.soru) return '';
    const HARF = 'ABCDE';
    return kok('058', 'z12', '<div class="u"><b>SORU ' + o.no + ' / ' + o.toplam + '</b>'
      + (o.sure ? '<span class="sr">' + ikon('saat', 'width:12px;height:12px') + kac(o.sure) + '</span>' : '') + '</div>'
      + '<p class="q">' + kac(o.soru) + '</p><div class="sk" role="group" aria-label="Şıklar">'
      + (o.secenekler || []).map((x, i) => '<button type="button" class="sik' + (o.secili === i ? ' on' : '') + '" data-act="' + kac(o.act) + '"'
        + ' data-i="' + i + '" aria-pressed="' + (o.secili === i ? 'true' : 'false') + '"><b>' + HARF[i] + '</b><span>' + kac(x) + '</span></button>').join('')
      + '</div>');
  }

  /* 059 TEKRAR PAKETİ — günün tekrarları konu konu paket; toplam süre
     TAHMİNDİR (kart başına sabit süre × kart sayısı). */
  function tekrarPaketi(o){
    const k = (o && o.konular || []).filter(x => x && x.n > 0);
    if(!k.length) return '';
    const enCok = Math.max.apply(null, k.map(x => x.n));
    const toplam = k.reduce((a, x) => a + x.n, 0);
    return kok('059', 'z13', '<div class="u"><b>' + toplam + ' kart</b><span class="cap">BUGÜNÜN PAKETİ</span></div>'
      + '<div class="ls">' + k.map(x => '<div class="r"><span>' + kac(x.ad) + '</span><i style="width:' + px(100 * x.n / enCok) + '"></i><em>'
        + x.n + (sayiMi(x.dk) ? ' · ' + dkMetni(x.dk) : '') + '</em></div>').join('') + '</div>'
      + '<div class="alt">' + et('estimated', '~' + dkMetni(o.dakika) + ' · tahmin')
      + (o.act ? dugme({ metin:o.dugme || 'Paketi başlat', ton:'m', act:o.act, data:o.data }) : '') + '</div>',
      { ek:renk(o.modul || 'ays') });
  }

  /* 060 BLOK BİTİŞ ÖZETİ — blok bitince üç sayı ve sıradaki iş; tek
     düğmeyle devam. Sayılar bloğun KAYDINDAN gelir. */
  function blokBitis(o){
    if(!o || !o.ad) return '';
    const hucre = (b, s) => '<div><b>' + b + '</b><span>' + kac(s) + '</span></div>';
    return kok('060', 'z14', '<b class="bs">' + kac(o.ad) + ' tamam.</b>'
      + '<div class="uc">' + hucre(sayi(o.soru), 'soru') + hucre(o.dogru == null ? '—' : sayi(o.dogru) + '·' + sayi(o.digerleri), 'D · Y/B')
      + hucre(dkMetni(o.dk), o.planDk ? 'plan ' + o.planDk : 'süre') + '</div>'
      + (o.sonraki ? '<div class="sr">Sıradaki <b>' + kac(o.sonraki.ad) + (o.sonraki.dk ? ' · ' + dkMetni(o.sonraki.dk) : '') + '</b>'
        + (o.sonraki.act ? dugme({ metin:'Başla', ton:'m', act:o.sonraki.act, data:o.sonraki.data }) : '') + '</div>' : ''),
      { ek:'kt', etiket:o.ad + ' bloğu bitti' });
  }

  /* 061 DERS DENGESİ — planlanan ve gerçekleşen ders dağılımı alt alta;
     fark tek rozetle. Paylar yüzde (0-100); harf ders işaretidir. */
  function dersDengesi(o){
    if(!o || !(o.plan || []).length || !(o.gercek || []).length) return '';
    const TON = [100, 72, 46, 26, 16];
    const bg = i => i === 0 ? 'var(--ays)' : 'color-mix(in oklab,var(--ays) ' + TON[Math.min(i, 4)] + '%,var(--vk-s2))';
    const col = i => i >= 3 ? ';color:var(--vk-ink)' : '';
    const serit = (ad, p) => '<div class="r"><span>' + kac(ad) + '</span><div class="br" role="img" aria-label="'
      + kac(ad + ': ' + p.map(x => x.ad + ' %' + Math.round(x.pay)).join(', ')) + '">'
      + p.map((x, i) => x.pay > 0 ? '<i style="width:' + px(x.pay) + ';background:' + bg(i) + col(i) + '">' + (x.pay >= 8 ? kac(x.harf) : '') + '</i>' : '').join('')
      + '</div></div>';
    return kok('061', 'z15', '<span class="cap">' + kac(buyuk(o.baslik || 'Haftalık ders dengesi · dakika')) + '</span>'
      + serit('PLAN', o.plan) + serit('GERÇEK', o.gercek)
      + (o.not ? '<div class="alt"><span>' + kac(o.not) + '</span>' + (sayiMi(o.fark) ? '<span class="fk n">' + isaretli(o.fark) + ' puan</span>' : '') + '</div>' : ''));
  }

  /* 062 DENEME GİRİŞİ — ders ders doğru, yanlış, boş hücreleri; net
     sütununu KOD hesaplar. Hücreler gerçek giriş kutusudur. */
  function denemeGirisi(o){
    const s = (o && o.satirlar || []).filter(Boolean);
    if(!s.length) return '';
    const hucre = (r, alan, ad) => '<i><input type="number" inputmode="numeric" min="0" value="' + (r[alan] == null ? '' : r[alan]) + '"'
      + ' aria-label="' + kac(r.ad + ' ' + ad) + '" data-change="' + kac(o.change) + '" data-i="' + r.i + '" data-field="' + alan + '"/></i>';
    return kok('062', 'w10', '<div class="r bs"><span>DERS</span><span>D</span><span>Y</span><span>B</span><span>NET</span><span>DOĞRULUK</span></div>'
      + s.map(r => '<div class="r"><span>' + kac(r.ad) + (r.not ? '<small>' + kac(r.not) + '</small>' : '') + '</span>'
        + hucre(r, 'correct', 'doğru') + hucre(r, 'wrong', 'yanlış') + hucre(r, 'blank', 'boş')
        + '<b>' + sayi(r.net, 2) + '</b><em' + (r.dogrulukDusuk ? ' class="dusuk"' : '') + (sayiMi(r.dogruluk) ? '' : ' title="veri yok"') + '>'
        + (sayiMi(r.dogruluk) ? '%' + r.dogruluk : '—') + '</em></div>').join('')
      + '<div class="alt">' + et('computed', 'Neti kod hesaplar') + '<b>' + sayi(o.toplam, 2) + '</b></div>', { ek:'genis' });
  }

  /* 063 KONU TABLOSU — TYT/AYT süzgeci; konu, kapsam halkası, son
     çalışma zamanı ve önkoşul işareti. Satır düğmedir (konu formu). */
  function konuTablosu(o){
    const k = (o && o.konular || []).filter(Boolean);
    if(!k.length && !(o && o.suzgec)) return '';
    const sz = (o.suzgec || []).map(x => '<button type="button" class="' + (x.on ? 'on' : '') + '" data-act="' + kac(o.suzgecAct) + '"'
      + ' data-value="' + kac(x.value) + '" aria-pressed="' + (x.on ? 'true' : 'false') + '">' + kac(x.label) + '</button>').join('');
    return kok('063', 'w11', (sz || o.ust ? '<div class="sz">' + sz + (o.ust ? '<span class="cap">' + kac(buyuk(o.ust)) + '</span>' : '') + '</div>' : '')
      + k.map(r => '<button type="button" class="r" data-act="' + kac(r.act || o.act) + '"' + nitelik(r.data) + '>' + hl(r.p)
        + '<b>' + kac(r.ad) + (r.onkosul ? '<span class="uy2">ÖNKOŞUL</span>' : '') + '</b><em>' + kac(r.son || '—') + '</em></button>').join('')
      + (!k.length ? '<p class="bos">' + kac(o.bos || 'Bu süzgece uyan konu yok.') + '</p>' : ''), { ek:renk(o.modul || 'ays') });
  }

  /* 064 HEDEF AYARI — günlük hedef büyük artı/eksi ile; haftalık toplam
     anında yeniden hesaplanır. Küçük aksiyondur: sormadan uygulanır,
     «Geri al» ekranda kalır (AGENTS.md §1.9). */
  function hedefAyari(o){
    if(!o || !sayiMi(o.hedef)) return '';
    const d = (delta, isaret) => dugme({ metin:isaret, act:o.act, data:Object.assign({ 'data-delta':String(delta) }, o.data || {}),
      aria:(o.ad || 'hedef') + ' ' + (delta > 0 ? 'artır' : 'azalt'), pasif:delta < 0 && o.hedef <= (o.min || 0) });
    return kok('064', 'w12', '<div class="u"><span class="cap">' + kac(buyuk(o.etiket || 'Günlük soru hedefi')) + '</span>'
      + '<span class="et">KÜÇÜK · GERİ ALINIR</span></div>'
      + '<div class="st2">' + d(-(o.adim || 1), '−') + '<b aria-live="polite">' + sayi(o.hedef) + '</b>' + d(o.adim || 1, '+') + '</div>'
      + '<div class="alt"><span>' + kac(o.toplamAd || 'Hafta toplamı') + ' <b class="mono">' + sayi(o.haftaToplam) + '</b></span>'
      + et('computed') + '</div>');
  }

  /* 065 TEKRAR TAKVİMİ ÇİZGİSİ — bir kartın tekrar günleri; geçilen
     halkalar dolu, sıradaki parlıyor. Aralıklar KODDAN (`adimlar`). */
  function tekrarTakvimi(o){
    const a = (o && o.adimlar || []).filter(sayiMi);
    if(!a.length || !sayiMi(o.asama)) return '';
    const enUzun = a[a.length - 1];
    const yer = g => 2 + 95 * g / enUzun;
    const ilerleme = o.asama > 0 ? yer(a[Math.min(o.asama, a.length) - 1]) : 0;
    return kok('065', 'w13', '<div class="u"><span style="font-weight:500">' + kac(o.baslik || '') + '</span><span class="cap">'
      + kac(buyuk(o.etiket || '')) + '</span></div>'
      + '<div class="tr" style="--ilerleme:' + px(ilerleme) + '">' + a.map((g, i) => '<span class="nk' + (i < o.asama ? ' b' : i === o.asama ? ' y' : '')
        + '" style="left:' + px(yer(g)) + '"><i></i><em>+' + g + (i === a.length - 1 ? ' gün' : '') + '</em></span>').join('') + '</div>'
      + '<div class="lg">' + et('computed', 'aralık koddan') + '<span>' + kac(o.not || '') + '</span></div>',
      { etiket:'Tekrar aralıkları ' + a.map(g => '+' + g).join(', ') + ' gün; ' + o.asama + ' tekrar geçti' });
  }

  /* 066 HEDEFE KALAN — hedef, bugünkü değer ve haftada gereken artış;
     kalan hafta sayısıyla. Hedef tahminse etiket de tahmindir. */
  function hedefeKalan(o){
    if(!o || !sayiMi(o.simdi) || !sayiMi(o.hedef)) return '';
    return kok('066', 'w14', '<div class="u"><span style="color:var(--vk-ink2)">' + kac(o.ad || 'Hedef') + '</span>'
      + (sayiMi(o.kalanHafta) ? '<span class="cap">' + o.kalanHafta + ' HAFTA KALDI</span>' : '') + '</div>'
      + '<div class="dg3"><b>' + sayi(o.simdi, o.ondalik == null ? 1 : o.ondalik) + '</b><span>/ ' + sayi(o.hedef, o.ondalik == null ? 1 : o.ondalik)
      + ' ' + kac(o.birim || '') + '</span></div>'
      + '<div class="cb ' + (renk(o.modul || 'ays')) + '" role="img" aria-label="' + kac('Hedefin %' + Math.round(yuzdeGen(o.simdi, o.hedef))) + '">'
      + '<i style="width:' + px(yuzdeGen(o.simdi, o.hedef)) + '"></i></div>'
      + '<div class="alt"><span>' + (sayiMi(o.haftalik) ? 'Haftada <b class="mono">' + isaretli(o.haftalik, 2) + '</b> ' + kac(o.birim || '') + ' yeter'
        : kac(o.not || '')) + '</span>' + et(o.kesinlik || 'computed') + '</div>');
  }

  /* 067 DERS İŞARETLERİ — dersler renkle değil harf ve desenle ayrılır:
     dolu, çerçeveli, taralı, kesikli. Renk yalnız modülündür. */
  function dersIsaretleri(o){
    const d = (o && o.dersler || []).filter(Boolean);
    if(!d.length) return '';
    return kok('067', 'w15', '<div class="rw" style="grid-template-columns:repeat(' + Math.min(d.length, 4) + ',1fr)">'
      + d.map((x, i) => '<div><i class="d' + ((i % 4) + 1) + '" aria-hidden="true">' + kac(x.harf) + '</i><span>' + kac(x.ad) + '</span></div>').join('')
      + '</div><span class="cap">DERS RENGİ YOK · RENK YALNIZ MODÜLÜN</span>');
  }


  /* ================================================== D · SPİ */

  /* 068 TOPARLANMA HALKASI — tek sayı ortada; her kaynak ayrı dilim,
     kendi kesinlik etiketiyle. Dilimin boyu kaynağın AĞIRLIĞI (kural
     motorunun), girilmemiş kaynak halkada boş kalır ve «veri yok» der. */
  function toparlanmaHalkasi(o){
    if(!o || !sayiMi(o.deger) || !(o.dilimler || []).length) return '';
    const C = 301.6, bosluk = 6;
    const top = o.dilimler.reduce((a, d) => a + (d.agirlik || 0), 0) || 1;
    const TON = [100, 65, 42, 26];
    let bas = 0, yay = '';
    o.dilimler.forEach((d, i) => {
      const uz = Math.max(0, C * (d.agirlik || 0) / top - bosluk);
      if(d.kesinlik !== 'missing'){
        yay += '<circle cx="60" cy="60" r="48" fill="none" stroke="' + (i ? 'color-mix(in oklab,var(--spi) ' + TON[Math.min(i, 3)] + '%,transparent)' : 'var(--spi)')
          + '" stroke-width="10" stroke-dasharray="' + uz.toFixed(1) + ' ' + C + '" stroke-dashoffset="' + (-bas).toFixed(1)
          + '" stroke-linecap="round" transform="rotate(-90 60 60)"/>';
      }
      bas += uz + bosluk;
    });
    return kok('068', 'x31', '<svg viewBox="0 0 120 120" role="img" aria-label="' + kac('Toparlanma ' + o.deger + (o.bant ? ', ' + o.bant : '')) + '">'
      + '<circle cx="60" cy="60" r="48" fill="none" stroke="var(--vk-s3)" stroke-width="10"/>' + yay
      + '<text x="60" y="68" text-anchor="middle" fill="var(--vk-ink)" style="font:400 30px var(--vk-serif)">' + Math.round(o.deger) + '</text></svg>'
      + '<div class="lg2">' + o.dilimler.map((d, i) => '<div><i style="opacity:' + (d.kesinlik === 'missing' ? '.15' : (TON[Math.min(i, 3)] / 100)) + '"></i>'
        + kac(d.ad) + et(d.kesinlik) + '</div>').join('') + '</div>');
  }

  /* 069 UYKU BANDI — son gece tek şerit, altta haftanın gece dokusu.
     Yatış saati tutulmadığı için şerit SAAT değil SÜRE eksenindedir
     (0–12 sa); uyanma kaydı yoksa uyanma çizilmez. */
  function uykuBandi(o){
    const g = (o && o.geceler || []);
    const son = g.length ? g[g.length - 1] : null;
    if(!son || !sayiMi(son.saat)) return '';
    const EN = 12;
    return kok('069', 'x32', '<div class="ek"><span>0</span><span>3</span><span>6</span><span>9</span><span>12 sa</span></div>'
      + '<div class="bn" role="img" aria-label="' + kac('Son gece ' + sayi(son.saat, 1) + ' saat') + '"><i class="d" style="left:0;width:' + px(100 * Math.min(son.saat, EN) / EN) + '"></i></div>'
      + '<div class="gc" aria-hidden="true">' + g.slice(-7).map(x => sayiMi(x.saat)
        ? '<i style="--o:' + Math.round(100 * Math.min(x.saat, 9) / 9) + '" title="' + kac(x.ad + ' · ' + sayi(x.saat, 1) + ' sa') + '"></i>'
        : '<i class="yok" style="--o:0" title="' + kac(x.ad + ' · veri yok') + '"></i>').join('') + '</div>'
      + '<div class="cap" style="margin-top:8px">' + kac(buyuk((o.sonAd || 'dün') + ' ' + sayi(son.saat, 1) + ' sa · son ' + Math.min(7, g.length) + ' gece')) + '</div>');
  }

  /* 070 HAM + ORTALAMA ÇİZGİSİ — dalgalı ölçümde ham noktalar soluk,
     yedi günlük ortalama çizgi. Eksik gün ne noktaya ne ortalamaya girer. */
  function hamOrtalama(o){
    const v = (o && o.noktalar || []);
    const dolu = v.filter(x => sayiMi(x.deger));
    if(dolu.length < 3) return '';
    const mn = Math.min.apply(null, dolu.map(x => x.deger)), mx = Math.max.apply(null, dolu.map(x => x.deger));
    const pay = (mx - mn) * 0.15 || 0.5, lo = mn - pay, hi = mx + pay;
    const x = i => 8 + i * (244 / Math.max(1, v.length - 1)), y = a => 72 - (a - lo) / (hi - lo) * 64;
    let s = '', yol = '', ilk = true, sonOrt = null;
    v.forEach((a, i) => {
      if(!sayiMi(a.deger)) return;
      s += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(a.deger).toFixed(1) + '" r="2.8" fill="var(--vk-ink4)"/>';
      const dilim = v.slice(Math.max(0, i - 6), i + 1).filter(z => sayiMi(z.deger));
      const ort = dilim.reduce((q, z) => q + z.deger, 0) / dilim.length;
      sonOrt = ort;
      yol += (ilk ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(ort).toFixed(1); ilk = false;
    });
    const son = dolu[dolu.length - 1];
    const od = o.ondalik == null ? 1 : o.ondalik;
    return kok('070', 'y16', '<div class="u"><b>' + sayi(son.deger, od) + '<small>' + kac(o.birim || '') + '</small></b>'
      + et('computed', '7 gün ort. ' + sayi(Math.round(sonOrt * 10) / 10, od)) + '</div>'
      + '<svg class="gr" viewBox="0 0 260 80" role="img" aria-label="' + kac(dolu.length + ' ölçüm; yedi günlük ortalama ' + sayi(Math.round(sonOrt * 10) / 10, od) + ' ' + (o.birim || '')) + '">'
      + s + '<path d="' + yol + '" fill="none" stroke="var(--spi)" stroke-width="2.2" stroke-linejoin="round"/></svg>'
      + '<div class="lg"><span><i style="background:var(--vk-ink4);height:6px;width:6px;border-radius:50%"></i>günlük ölçüm</span>'
      + '<span><i style="background:var(--spi)"></i>7 günlük ortalama</span></div>');
  }

  /* 071 REFERANS BANDI — değer laboratuvar aralığının içinde bir nokta.
     Aralık dışı YALNIZ işaretlenir; yorum yapılmaz, teşhis konmaz. */
  function referansBandi(o){
    const r = (o && o.satirlar || []).filter(x => x && sayiMi(x.deger) && x.ref && sayiMi(x.ref[0]) && sayiMi(x.ref[1]));
    if(!r.length) return '';
    let dis = false;
    const ic = r.map(x => {
      const [a, b] = x.ref, w = (b - a) || 1;
      const lo = Math.min(a - w * 0.45, x.deger - w * 0.1), hi = Math.max(b + w * 0.45, x.deger + w * 0.1);
      const yer = v => 100 * (v - lo) / (hi - lo);
      const disinda = x.deger < a || x.deger > b;
      if(disinda) dis = true;
      return '<div class="r"><span>' + kac(x.ad) + '</span><div class="tr" role="img" aria-label="' + kac(x.ad + ' ' + sayi(x.deger) + ' ' + (x.birim || '')
        + '; aralık ' + sayi(a) + '–' + sayi(b) + (disinda ? '; aralık dışı' : '')) + '"><span class="bd" style="left:' + px(yer(a)) + ';width:' + px(yer(b) - yer(a)) + '"></span>'
        + '<span class="nk' + (disinda ? ' dis' : '') + '" style="left:' + px(yer(x.deger)) + '"></span></div></div>';
    }).join('');
    return kok('071', 'x33', ic + (dis ? '<div class="nt"><i></i>Aralık dışı · hekiminle konuş</div>' : ''));
  }

  /* 072 TABAK GÖRÜNÜMÜ — halka dilimi yerine tabak bölmesi; kalan
     miktar yazılı. Bölmeler hedefin enerji payı (kural motoru). */
  function tabak(o){
    if(!o || !(o.bolmeler || []).length) return '';
    const b = o.bolmeler, top = b.reduce((a, x) => a + (x.pay || 0), 0) || 1;
    const TON = [100, 55, 30];
    let bas = 0;
    const dil = b.map((x, i) => {
      const uz = 100 * x.pay / top;
      const r = (i ? 'color-mix(in oklab,var(--spi) ' + TON[Math.min(i, 2)] + '%,transparent)' : 'var(--spi)') + ' ' + bas.toFixed(1) + '% ' + (bas + uz - 3).toFixed(1) + '%,transparent ' + (bas + uz - 3).toFixed(1) + '% ' + (bas + uz).toFixed(1) + '%';
      bas += uz; return r;
    }).join(',');
    const ana = b[0];
    return kok('072', 'x34', '<div class="tb" style="--tabak:conic-gradient(' + dil + ')" role="img" aria-label="' + kac(ana.ad + ': ' + (sayiMi(ana.kalan) ? sayi(Math.round(ana.kalan)) + ' g kaldı' : 'veri yok')) + '"><b>'
      + (sayiMi(ana.kalan) ? sayi(Math.max(0, Math.round(ana.kalan))) : '—') + '</b></div>'
      + '<div class="lg2">' + b.map((x, i) => '<div><i style="background:' + (i ? 'color-mix(in oklab,var(--spi) ' + TON[Math.min(i, 2)] + '%,transparent)' : 'var(--spi)') + '"></i>'
        + (i === 0 && sayiMi(x.kalan) ? '<span><b>' + sayi(Math.max(0, Math.round(x.kalan))) + ' g</b> ' + kac(x.ad.toLocaleLowerCase('tr-TR')) + ' kaldı</span>'
          : '<span>' + kac(x.ad) + (sayiMi(x.kalan) ? ' · ' + sayi(Math.max(0, Math.round(x.kalan))) + ' g kaldı' : '') + '</span>') + '</div>').join('') + '</div>');
  }

  /* 073 TEK DOKUNUŞ SAYAÇ — küçük kayıt tek dokunuş; «Geri al» şeridi
     sistemin ortak şerididir (toast). Girilmemiş gün boş bardaklardır
     ama «girilmedi» yazar: 0 bardak ölçülmüş değildir. */
  function tekDokunus(o){
    if(!o || !sayiMi(o.hedef) || o.hedef < 1) return '';
    const n = sayiMi(o.adet) ? Math.max(0, Math.floor(o.adet)) : 0;
    const bardak = dolu => '<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M4 3h16l-2 24H6z" fill="' + (dolu ? 'var(--spi)' : 'none')
      + '" stroke="' + (dolu ? 'var(--spi)' : 'var(--vk-ink4)') + '" stroke-width="1.5"/></svg>';
    const b = [];
    for(let i = 0; i < Math.max(o.hedef, n); i++) b.push(bardak(i < n));
    return kok('073', 'x35', '<button type="button" class="bd" data-act="' + kac(o.act) + '" aria-label="' + kac((o.ad || 'Bardak') + ' ekle') + '">' + b.join('') + '</button>'
      + '<div class="sy">' + (sayiMi(o.adet) ? kac(o.metin || (n + ' / ' + o.hedef)) : 'Girilmedi · dokun, bir bardak ekle') + '</div>');
  }

  /* 074 ENERJİ ÖLÇEĞİ — günde bir kez beş noktalı ölçek; seçilen nokta
     büyür. Değer kullanıcının BEYANIDIR (ölçüldü · beyan). */
  function enerjiOlcegi(o){
    if(!o) return '';
    const n = o.adim || 5;
    const ic = [];
    for(let i = 1; i <= n; i++){
      ic.push('<button type="button" class="' + (o.deger === i ? 'on' : '') + '" data-act="' + kac(o.act) + '" data-value="' + i + '"'
        + ' aria-pressed="' + (o.deger === i ? 'true' : 'false') + '" aria-label="' + kac(i + ' · ' + ((o.adlar || [])[i - 1] || '')) + '">' + i + '</button>');
    }
    return kok('074', 'y17', '<span class="cap">' + kac(buyuk(o.soru || 'Bugün enerjin?')) + '</span><div class="ol" role="group" aria-label="' + kac(o.soru || 'Bugün enerjin?') + '">' + ic.join('') + '</div>'
      + '<div class="uc"><span class="cap">' + kac(buyuk(o.alt || 'düşük')) + '</span>' + (o.deger != null ? et('measured', 'ölçüldü · beyan') : et('missing'))
      + '<span class="cap">' + kac(buyuk(o.ust || 'yüksek')) + '</span></div>');
  }

  /* 075 SET KUTUCUKLARI — biten set dolar. Kutucuk düğmedir; dokunmak
     o hareketin bir setini bitirir (tekrar dokunmak geri alır). */
  function setKutucuklari(o){
    const h = (o && o.hareketler || []).filter(x => x && x.set > 0);
    if(!h.length) return '';
    return kok('075', 'x36', h.map(x => {
      const b = [];
      for(let i = 0; i < x.set; i++){
        b.push('<button type="button" class="' + (i < (x.biten || 0) ? 'd' : '') + '" data-act="' + kac(o.act) + '"' + nitelik(Object.assign({ 'data-i':String(x.i), 'data-set':String(i + 1) }, o.data || {}))
          + ' aria-label="' + kac(x.ad + ' ' + (i + 1) + '. set' + (i < (x.biten || 0) ? ', bitti' : '')) + '">' + kac(x.etiket || (i + 1)) + '</button>');
      }
      return '<div class="r"><span>' + kac(x.ad) + '</span><div class="st">' + b.join('') + '</div></div>';
    }).join(''));
  }

  /* 076 HAFTALIK HAREKET HALKALARI — yedi küçük halka; verisi olmayan gün
     kesikli boş halka. p: günün hareket dakikasının asgari güne oranı. */
  function haftaHalkalari(o){
    const g = (o && o.gunler || []);
    if(g.length !== 7) return '';
    const yok = g.filter(x => x.yok).map(x => x.ad);
    return kok('076', 'y18', g.map(x => '<div>' + (x.yok ? '<span class="hl yok" aria-hidden="true"></span>' : hl(x.gelecek ? 0 : x.p))
      + '<span' + (x.bugun ? ' class="bu"' : '') + '>' + kac(buyuk(x.ad)) + '</span></div>').join('')
      + '<div class="alt">' + et('measured') + (yok.length ? et('missing', yok.join(' · ') + ' · veri yok') : '') + '</div>',
      { ek:'c-spi', etiket:g.filter(x => !x.yok && !x.gelecek).map(x => x.ad + ' %' + Math.round(x.p || 0)).join(', ') });
  }

  /* 077 ÖLÇÜM TUŞ TAKIMI — büyük rakam, sabit birim, dünkü değer ipucu
     olarak yanında. ✓ kaydeder; kayıt modülün kendi kapısından geçer
     (şüpheli giriş 018 dahil). */
  function tusTakimi(o){
    if(!o) return '';
    const tus = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'];
    const fark = sayiMi(o.dun) && sayiMi(o.deger) ? Math.round((o.deger - o.dun) * 10) / 10 : null;
    return kok('077', 'x37', '<div><b aria-live="polite">' + kac(o.metin != null && o.metin !== '' ? o.metin : '—') + '<small>' + kac(o.birim || '') + '</small></b>'
      + '<div class="dn">' + (sayiMi(o.dun) ? 'dün ' + sayi(o.dun, 1) + (fark != null ? ' · fark ' + isaretli(fark, 1) : '') : 'dünkü değer yok') + '</div>'
      + '<span style="display:inline-flex;margin-top:10px">' + et(o.metin ? 'measured' : 'missing') + '</span></div>'
      + '<div class="tt" role="group" aria-label="Tuş takımı">' + tus.map(t => '<button type="button" data-act="' + kac(o.act) + '" data-k="' + kac(t) + '"'
        + ' aria-label="' + (t === '⌫' ? 'Sil' : t === ',' ? 'Virgül' : t) + '">' + t + '</button>').join('')
      + '<button type="button" class="on tt-kaydet" data-act="' + kac(o.kaydet) + '" aria-label="Kaydet">✓</button></div>');
  }

  /* 078 SONRAKİ KONTROL KARTI — hatırlatır, yorumlamaz. */
  function sonrakiKontrol(o){
    if(!o || !o.tarih) return '';
    const AY = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(o.tarih);
    if(!m) return '';
    return kok('078', 'y19', '<div class="tk" aria-hidden="true"><span>' + AY[+m[2] - 1] + '</span><b>' + (+m[3]) + '</b></div>'
      + '<div><b class="ad">' + kac(o.ad) + '</b><p>' + kac(o.ne || '') + '</p><small>' + kac(o.not || 'Sonuçları sen girersin; SPİ yorumlamaz.') + '</small></div>');
  }

  /* 079 HARCAMA ŞERİTLERİ — kalem başına şerit ve bütçe çizgisi; aşım
     yalnız çizginin rengiyle. Tutarı bilinmeyen kalem «—», sıfır değil. */
  function harcamaSeritleri(o){
    const r = (o && o.satirlar || []).filter(Boolean);
    if(!r.length || !sayiMi(o.limit) || o.limit <= 0) return '';
    const olcek = Math.max(o.limit, ...r.map(x => sayiMi(x.tutar) ? x.tutar : 0)) * 1.1;
    return kok('079', 'x38', r.map(x => {
      const bilinir = sayiMi(x.tutar), as = bilinir && x.tutar > o.limit;
      return '<div class="r' + (as ? ' as' : '') + '"><span>' + kac(x.ad) + '</span><div class="tr" role="img" aria-label="' + kac(x.ad + ': ' + (bilinir ? sayi(Math.round(x.tutar)) + ' TL, bütçenin %' + Math.round(100 * x.tutar / o.limit) : 'veri yok')) + '">'
        + (bilinir ? '<i style="width:' + px(100 * x.tutar / olcek) + '"></i>' : '') + '<em style="left:' + px(100 * o.limit / olcek) + '"></em></div><em>'
        + (bilinir ? '%' + Math.round(100 * x.tutar / o.limit) : '—') + '</em></div>';
    }).join('') + '<div class="cap" style="margin-top:6px">' + kac(buyuk(o.not || 'Çizgi = bütçe · aşım yalnız çizgide')) + '</div>');
  }

  /* 080 ÖĞÜN ÇİZELGESİ — gün tek şeritte; öğünler nokta (girildiği saat),
     yeme aralığı açık bant. Saat kaydın zamanıdır: ölçüldü. */
  function ogunCizelgesi(o){
    const g = (o && o.ogunler || []).filter(x => x && sayiMi(x.saat));
    if(!g.length) return '';
    const yer = h => 100 * Math.max(0, Math.min(18, h - 6)) / 18;
    const ilk = Math.min.apply(null, g.map(x => x.saat)), son = Math.max.apply(null, g.map(x => x.saat));
    return kok('080', 'z16', '<div class="ek"><span>06</span><span>12</span><span>18</span><span>24</span></div>'
      + '<div class="tr" role="img" aria-label="' + kac(g.length + ' öğün; yeme aralığı ' + sayi(Math.round((son - ilk) * 10) / 10, 1) + ' saat') + '">'
      + (g.length > 1 ? '<span class="pn" style="left:' + px(yer(ilk)) + ';width:' + px(yer(son) - yer(ilk)) + '"></span>' : '')
      + g.map(x => '<span class="og' + (x.kucuk ? ' k' : '') + '" style="left:' + px(yer(x.saat)) + '" title="' + kac(x.ad) + '"></span>').join('')
      + (sayiMi(o.simdi) ? '<span class="an" style="left:' + px(yer(o.simdi)) + '"></span>' : '') + '</div>'
      + '<div class="lg">' + et('measured', g.length + ' öğün girildi') + '<span>' + (g.length > 1 ? 'yeme aralığı ' + sayi(Math.round((son - ilk) * 10) / 10, 1) + ' sa' : 'tek öğün') + '</span></div>');
  }

  /* 081 YOĞUNLUK BÖLGELERİ — antrenman dakikası bölgelere göre; eşikleri
     kod hesaplar. Nabız bölgesi ölçülmemişse kart yoktur. */
  function yogunlukBolgeleri(o){
    const b = (o && o.bolgeler || []).filter(x => x && sayiMi(x.dk));
    if(!b.length) return '';
    const en = Math.max.apply(null, b.map(x => x.dk)) || 1, top = b.reduce((a, x) => a + x.dk, 0);
    return kok('081', 'z17', '<div class="u"><b>' + sayi(top) + ' dk</b>' + et('measured') + '</div>'
      + b.map((x, i) => '<div class="r"><span>' + kac(x.ad) + '</span><i style="width:' + px(100 * x.dk / en) + ';opacity:' + (0.3 + 0.7 * i / Math.max(1, b.length - 1)).toFixed(2) + '"></i><em>' + sayi(x.dk) + ' dk</em></div>').join(''));
  }

  /* 082 HARCAMA TAKVİMİ — ay takvimi; her günün harcaması nokta
     büyüklüğüyle, gelecek günler soluk. Kaydı olmayan gün noktasızdır. */
  function harcamaTakvimi(o){
    const g = (o && o.gunler || []);
    if(!g.length) return '';
    const en = Math.max.apply(null, g.map(x => sayiMi(x.tutar) ? x.tutar : 0)) || 1;
    const bos = [];
    for(let i = 0; i < (o.ilkGun || 0); i++) bos.push('<i class="bs"></i>');
    return kok('082', 'z18', ['PT', 'SA', 'ÇA', 'PE', 'CU', 'CT', 'PZ'].map(h => '<span class="hd">' + h + '</span>').join('') + bos.join('')
      + g.map(x => x.gelecek ? '<i class="gl"></i>' : '<i' + (x.bugun ? ' class="bu"' : '') + ' title="' + kac(x.ad + ' · ' + (sayiMi(x.tutar) ? sayi(x.tutar) + ' TL' : 'kayıt yok')) + '">'
        + (sayiMi(x.tutar) && x.tutar > 0 ? '<b style="width:' + (4 + 12 * x.tutar / en).toFixed(1) + 'px;height:' + (4 + 12 * x.tutar / en).toFixed(1) + 'px"></b>' : '') + '</i>').join(''));
  }

  /* 083 UYKU DÜZENİ — yatış ve kalkış saatleri dikey çubuk; hedef kesik
     çizgi. Saat ölçülmemişse kart yoktur (süreden saat uydurulmaz). */
  function uykuDuzeni(o){
    const g = (o && o.geceler || []).filter(x => x && sayiMi(x.yatis) && sayiMi(x.kalkis));
    if(g.length < 3) return '';
    const yer = h => 100 * (h - 20) / 14;       // 20:00 → ertesi 10:00
    return kok('083', 'z19', '<div class="ch2"><div class="ys"><span>20</span><span>10</span></div><div class="gr2">'
      + (sayiMi(o.hedefYatis) ? '<span class="hd1" style="top:' + px(yer(o.hedefYatis)) + '"></span>' : '')
      + (sayiMi(o.hedefKalkis) ? '<span class="hd1" style="top:' + px(yer(o.hedefKalkis)) + '"></span>' : '')
      + g.map(x => '<div><i style="top:' + px(yer(x.yatis)) + ';height:' + px(yer(x.kalkis) - yer(x.yatis)) + '"></i></div>').join('') + '</div></div>'
      + '<div class="lg">' + et('measured') + '<span>' + g.length + ' gece · kesik çizgi hedef</span></div>');
  }

  /* 084 TAHLİL KARŞILAŞTIRMASI — iki tarihin değeri yan yana, aralıkla;
     aralık dışı yalnız çerçeveyle. Yorum yok. */
  function tahlilKarsilastirma(o){
    const r = (o && o.satirlar || []).filter(Boolean);
    if(!r.length) return '';
    const hucre = (v, ref) => {
      if(!sayiMi(v)) return '<em title="ölçülmedi">—</em>';
      const dis = ref && sayiMi(ref[0]) && sayiMi(ref[1]) && (v < ref[0] || v > ref[1]);
      return '<em' + (dis ? ' class="ds2" title="aralık dışı"' : '') + '>' + sayi(v) + '</em>';
    };
    const disVar = r.some(x => x.ref && [x.once, x.sonra].some(v => sayiMi(v) && (v < x.ref[0] || v > x.ref[1])));
    return kok('084', 'w16', '<div class="r bs"><span>TEST</span><span>' + kac(buyuk(o.onceAd)) + '</span><span>' + kac(buyuk(o.sonraAd)) + '</span><span>ARALIK</span></div>'
      + r.map(x => '<div class="r"><span>' + kac(x.ad) + '</span>' + hucre(x.once, x.ref) + hucre(x.sonra, x.ref)
        + '<small>' + (x.ref ? sayi(x.ref[0]) + '–' + sayi(x.ref[1]) : '—') + '</small></div>').join('')
      + (disVar ? '<div class="nt"><i></i>çerçeve = aralık dışı · yorum yok</div>' : ''));
  }

  /* 085 ÖĞÜN ŞABLONLARI — sık yenen öğünler tek dokunuşluk şablon; bugün
     eklenen işaretli. Şablon kullanıcının KENDİ kaydından çıkar. */
  function ogunSablonlari(o){
    const s = (o && o.sablonlar || []).filter(Boolean);
    if(!s.length) return '';
    return kok('085', 'w17', '<span class="cap">' + kac(buyuk(o.baslik || 'Sık öğünler · tek dokunuş')) + '</span><div class="ls2">'
      + s.map(x => '<button type="button" class="' + (x.on ? 'on' : '') + '" data-act="' + kac(o.act) + '"' + nitelik(x.data)
        + ' aria-label="' + kac(x.ad + ': ' + x.icerik + (x.on ? ' — bugün eklendi' : ' — ekle')) + '"><b>' + kac(x.ad) + '</b><span>' + kac(x.icerik) + '</span><em aria-hidden="true">'
        + (x.on ? '✓' : '+') + '</em></button>').join('') + '</div>');
  }

  /* 086 ANTRENMAN HAFTASI — yedi gün dikey şerit: yapılan dolu, kaydı
     olmayan geçmiş gün taralı («kayıt yok», dinlenme sayılmaz), gelecek
     boş; bugün çerçeveli. Plan tutulmadığı için «planlı» uydurulmaz. */
  function antrenmanHaftasi(o){
    const g = (o && o.gunler || []);
    if(g.length !== 7) return '';
    return kok('086', 'w18', g.map(x => '<div' + (x.bugun ? ' class="bu"' : '') + '><span class="g">' + kac(buyuk(x.ad)) + '</span>'
      + '<i class="' + (x.yapilan ? 'd' : x.gecti ? 'bos' : '') + '">' + kac(x.yapilan || (x.gecti ? 'Kayıt yok' : '')) + '</i></div>').join(''),
      { etiket:g.map(x => x.ad + ': ' + (x.yapilan || (x.gecti ? 'kayıt yok' : 'henüz değil'))).join(', ') });
  }

  /* 087 DÜZENLİ GİDERLER — ayın hangi günü hangi gider; en yakını vurgulu. */
  function duzenliGiderler(o){
    const r = (o && o.giderler || []).filter(x => x && sayiMi(x.gun));
    if(!r.length) return '';
    const bugun = o.bugun || 1;
    const kalan = x => x.gun >= bugun ? x.gun - bugun : null;
    const yakin = r.filter(x => kalan(x) != null).sort((a, b) => a.gun - b.gun)[0];
    const top = r.reduce((a, x) => a + (sayiMi(x.tutar) ? x.tutar : 0), 0);
    return kok('087', 'w19', r.slice().sort((a, b) => a.gun - b.gun).map(x => '<div class="r' + (x === yakin ? ' on' : '') + '"><span class="tr2">' + x.gun + '</span><b>'
      + kac(x.ad) + (x === yakin ? '<small>' + (kalan(x) === 0 ? 'BUGÜN' : kalan(x) + ' GÜN SONRA') + '</small>' : '') + '</b><em>' + (sayiMi(x.tutar) ? sayi(x.tutar) + ' ₺' : '—') + '</em></div>').join('')
      + '<div class="alt"><span class="cap">AYLIK TOPLAM</span><b class="mono">' + sayi(top) + ' ₺</b></div>');
  }

  /* 088 ÖLÇÜM HATIRLATICISI — saatli hatırlatma; bugün ölçüldüyse saati
     yazar. Ölçülmezse boş kalır: tahmin edilmez. */
  function olcumHatirlatici(o){
    if(!o) return '';
    return kok('088', 'w20', '<div class="u"><span class="ik2">' + ikon('zil') + '</span><div><b>' + kac(o.ad || 'Sabah tartısı') + '</b><span>'
      + kac(o.saatler && o.saatler.length ? 'her gün · ' + o.saatler.join(', ') : 'hatırlatma kurulmadı') + '</span></div>'
      + '<button type="button" class="an2' + (o.acik ? ' on' : '') + '" role="switch" aria-checked="' + (o.acik ? 'true' : 'false') + '" data-act="' + kac(o.act) + '"'
      + nitelik(o.data) + ' aria-label="' + kac((o.ad || 'Sabah tartısı') + ' hatırlatması') + '"></button></div>'
      + '<div class="sn2">' + (o.olculdu ? ikon('tik') + kac(o.olculdu) : kac(o.bekliyor || 'Bugün henüz ölçülmedi')) + '</div>'
      + '<span class="cap">ÖLÇÜLMEZSE BOŞ KALIR · TAHMİN EDİLMEZ</span>', { ek:'kt' });
  }


  /* ================================================== E · ESP */

  /* 089 DESTE YIĞINI — kalan kartlar arkada yığın; yığın incelikçe bitiş
     görülür. Üstteki kart düğmedir (dokun · çevir). */
  function desteYigini(o){
    if(!o || !o.on || !sayiMi(o.kalan)) return '';
    const arka = Math.max(0, Math.min(3, o.kalan - 1));
    const kr = [];
    for(let i = 3 - arka; i < 3; i++) kr.push('<span class="kr" style="transform:translate(' + (4 * (3 - i)) + 'px,' + (4 * (3 - i)) + 'px);opacity:' + (0.35 + 0.22 * i).toFixed(2) + '" aria-hidden="true"></span>');
    return kok('089', 'x40', kr.join('') + '<button type="button" class="kr ust-k" data-act="' + kac(o.act) + '" aria-label="' + kac(o.on + ' — karşılığı göster') + '"><b>' + kac(o.on) + '</b>'
      + '<span class="cap">DOKUN · ÇEVİR</span></button><span class="mod c-esp sy">' + o.kalan + ' KART</span>');
  }

  /* 090 SÜRELİ CEVAP DÜĞMELERİ — her düğme kartın bir sonraki görülme
     zamanını söyler; zamanı tekrar motoru hesaplar. */
  function sureliCevap(o){
    const d = (o && o.dugmeler || []).filter(Boolean);
    if(!d.length) return '';
    return kok('090', 'x41', d.map(x => '<button type="button" class="' + (x.on ? 'on' : '') + '" data-act="' + kac(o.act) + '"' + nitelik(x.data)
      + (x.not ? ' title="' + kac(x.not) + '"' : '') + '>' + kac(x.ad) + '<span>' + kac(x.sure) + '</span></button>').join(''),
      { etiket:'Cevap düğmeleri' });
  }

  /* 091 DAKİKA HALKASI — günlük ölçüt halkası; rengi değişmez, yalnız dolar.
     Dokunulmamış disiplin «—», 0 dk değil. */
  function dakikaHalkasi(o){
    if(!o || !sayiMi(o.hedef) || o.hedef <= 0) return '';
    const top = sayiMi(o.toplam) ? o.toplam : 0;
    const C = 276.5;
    return kok('091', 'x42v', '<div class="hk"><svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="44" fill="none" stroke="var(--vk-s3)" stroke-width="9"/>'
      + (top > 0 ? '<circle cx="52" cy="52" r="44" fill="none" stroke="var(--esp)" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (C * Math.min(1, top / o.hedef)).toFixed(1) + ' ' + C + '" transform="rotate(-90 52 52)"/>' : '')
      + '</svg><div><b>' + sayi(Math.round(top)) + '</b><span class="cap">/ ' + sayi(o.hedef) + ' DK</span></div></div>'
      + '<div class="ls">' + (o.satirlar || []).map(x => '<div><i' + (sayiMi(x.dk) ? '' : ' class="b"') + '></i>' + kac(x.ad) + '<em>' + (sayiMi(x.dk) ? sayi(Math.round(x.dk)) + ' dk' : '—') + '</em></div>').join('')
      + '<div class="top"><span></span>Kalan<em>' + sayi(Math.max(0, Math.round(o.hedef - top))) + ' dk</em></div></div>',
      { etiket:'Bugün ' + Math.round(top) + ' / ' + o.hedef + ' dakika' });
  }

  /* 092 UNUTMA EĞRİSİ — hatırlama düşer, tekrar yükseltir; «bugün» noktası
     işaretli. Eğri tekrar motorunun modelidir (R = e^(−t/S)); geleceği
     kesik çizilir, çünkü henüz olmadı. `noktalar`: [{ gun (bugüne göre), r (0-1) }]. */
  function unutmaEgrisi(o){
    const n = (o && o.noktalar || []).filter(x => x && sayiMi(x.gun) && sayiMi(x.r));
    if(n.length < 3) return '';
    const g0 = Math.min.apply(null, n.map(x => x.gun)), g1 = Math.max.apply(null, n.map(x => x.gun));
    const x = g => 6 + 248 * (g - g0) / Math.max(1, g1 - g0), y = r => 14 + (1 - r) * 80;
    const gecmis = n.filter(p => p.gun <= 0), gelecek = n.filter(p => p.gun >= 0);
    const yol = l => l.map((p, i) => (i ? 'L' : 'M') + x(p.gun).toFixed(1) + ' ' + y(p.r).toFixed(1)).join('');
    const bugun = n.find(p => p.gun === 0);
    const esik = sayiMi(o.esik) ? o.esik : 0.5;
    return kok('092', 'x43', '<svg class="gr" viewBox="0 0 260 110" role="img" aria-label="' + kac('Hatırlama bugün %' + (bugun ? Math.round(bugun.r * 100) : '—')) + '">'
      + (gecmis.length > 1 ? '<path d="' + yol(gecmis) + '" fill="none" stroke="var(--esp)" stroke-width="2"/>' : '')
      + (gelecek.length > 1 ? '<path d="' + yol(gelecek) + '" fill="none" stroke="var(--esp)" stroke-width="2" stroke-dasharray="3 3" opacity=".6"/>' : '')
      + '<line x1="6" y1="' + y(esik).toFixed(1) + '" x2="254" y2="' + y(esik).toFixed(1) + '" stroke="var(--vk-ink4)" stroke-dasharray="2 4"/>'
      + '<text x="10" y="' + (y(esik) - 6).toFixed(1) + '" fill="var(--vk-ink3)" style="font:400 9px var(--vk-mono)">eşik %' + Math.round(esik * 100) + '</text>'
      + (bugun ? '<circle cx="' + x(0).toFixed(1) + '" cy="' + y(bugun.r).toFixed(1) + '" r="4" fill="var(--vk-ink)"/><text x="' + x(0).toFixed(1) + '" y="106" text-anchor="middle" fill="var(--vk-ink3)" style="font:400 9.5px var(--vk-mono)">bugün · %' + Math.round(bugun.r * 100) + '</text>' : '')
      + '</svg><div class="lg">' + et('computed', 'model · R = e^(−t/S)') + '<span>kesik = gelecek</span></div>');
  }

  /* 093 MERDİVEN BASAMAKLARI — basamak içerik sırasıdır, derece değil. */
  function merdiven(o){
    const b = (o && o.basamaklar || []).filter(Boolean);
    if(!b.length) return '';
    const on = b.find(x => x.durum === 'current');
    return kok('093', 'x44v', '<div class="st">' + b.map((x, i) => '<div class="' + (x.durum === 'done' ? 'b' : x.durum === 'current' ? 'on' : '') + '" style="height:'
      + px(30 + 64 * i / Math.max(1, b.length - 1)) + '" title="' + kac(x.ad) + '">' + (x.durum === 'done' ? ikon('tik') : '') + x.no + '</div>').join('')
      + (on ? '<div class="ip"><b>Basamak ' + on.no + '</b><span>' + kac(on.not || on.ad) + '</span></div>' : '') + '</div>',
      { etiket:b.map(x => x.no + '. ' + x.ad + (x.durum === 'done' ? ' (geçildi)' : x.durum === 'current' ? ' (şimdi)' : '')).join(', ') });
  }

  /* 094 KÜTÜPHANE RAFI — kitap sırtı; kalınlık sayfa sayısı (tutulmuyorsa
     eşit), alt çizgi okunan oran (bilinmiyorsa çizgi yok). */
  function kutuphaneRafi(o){
    const k = (o && o.kitaplar || []).filter(Boolean);
    if(!k.length) return '';
    return kok('094', 'x45v', '<div class="rf">' + k.map((x, i) => '<i class="' + (x.on ? 'on' : '') + (sayiMi(x.oran) ? '' : ' oransiz') + '" style="--w:' + (sayiMi(x.kalinlik) ? x.kalinlik : 22) + 'px;--p:'
      + (sayiMi(x.oran) ? Math.round(x.oran) : 0) + ';height:' + (66 + (i * 37) % 30) + '%" title="' + kac(x.ad + (x.durum ? ' · ' + x.durum : '')) + '">' + kac(buyuk(x.ad).slice(0, 14)) + '</i>').join('') + '</div>'
      + '<div class="alt"><span class="cap">' + k.length + ' KİTAP · ' + k.filter(x => x.oran === 100).length + ' BİTTİ</span>'
      + (o.not ? '<span class="cap">' + kac(buyuk(o.not)) + '</span>' : '') + '</div>',
      { etiket:k.map(x => x.ad + (x.durum ? ' (' + x.durum + ')' : '')).join(', ') });
  }

  /* 095 OKUMA İLERLEMESİ — kitap içinde ince çizgi ve bölümün kalan süresi. */
  function okumaIlerlemesi(o){
    if(!o || !o.ad || !sayiMi(o.oran)) return '';
    return kok('095', 'y20', '<div class="kp"><i aria-hidden="true"></i><div><b>' + kac(o.ad) + '</b><span>' + kac(o.alt || '') + '</span></div></div>'
      + '<div class="iy" role="img" aria-label="' + kac('%' + Math.round(o.oran) + ' okundu') + '"><i style="width:' + px(o.oran) + '"></i></div>'
      + '<div class="alt"><span class="cap">%' + Math.round(o.oran) + '</span>' + (sayiMi(o.kalanDk) ? et('estimated', 'bu bölüm ~' + dkMetni(o.kalanDk) + ' · tahmin') : '') + '</div>');
  }

  /* 096 ALINTI KARTI — altı çizilen cümle kaynağıyla. */
  function alintiKarti(o){
    if(!o || !o.metin) return '';
    return kok('096', 'y21', '<q>' + kac(o.metin) + '</q><div class="alt"><span>— ' + kac(o.kaynak || 'kaynak yok') + '</span>'
      + (o.act ? dugme({ metin:o.dugme || 'Desteye ekle', act:o.act, data:o.data }) : '') + '</div>');
  }

  /* 097 KELİME SAHNESİ — tek kelime, anlamı, örnek cümle. Başka hiçbir şey. */
  function kelimeSahnesi(o){
    if(!o || !o.kelime) return '';
    return kok('097', 'x46', '<b lang="' + kac(o.dil || 'en') + '">' + kac(o.kelime) + '</b><p>' + kac(o.anlam || '—') + '</p>'
      + (o.ornek ? '<em lang="' + kac(o.dil || 'en') + '">“' + kac(o.ornek) + '”</em>' : ''));
  }

  /* 098 BAĞLAMDA KELİME — metinde hedef kelime altı çizili; anlamı yerinde. */
  function baglamdaKelime(o){
    if(!o || !o.cumle || !o.kelime) return '';
    const i = o.cumle.toLocaleLowerCase('tr-TR').indexOf(o.kelime.toLocaleLowerCase('tr-TR'));
    if(i < 0) return '';
    const c = o.cumle;
    return kok('098', 'y22', '<p lang="' + kac(o.dil || 'en') + '">' + kac(c.slice(0, i)) + '<u>' + kac(c.slice(i, i + o.kelime.length)) + '</u>' + kac(c.slice(i + o.kelime.length)) + '</p>'
      + '<div class="ip"><b>' + kac(o.anlam || '—') + '</b><span>' + kac(o.not || 'kartta var') + '</span></div>');
  }

  /* 099 KONUŞMA DALGA FORMU — ses dalgası ve süre; duraksama boşluk.
     Dalga kaydın kendisinden gelir; yoksa kart yok. */
  function dalgaFormu(o){
    const d = (o && o.genlik || []).filter(sayiMi);
    if(d.length < 8) return '';
    const dur = d.reduce((a, v, i) => a + (v === 0 && d[i - 1] !== 0 ? 1 : 0), 0);
    return kok('099', 'y23', '<div class="dl" aria-hidden="true">' + d.map(v => v === 0 ? '<i class="bos"></i>' : '<i style="height:' + Math.min(100, v * 6) + '%"></i>').join('') + '</div>'
      + '<div class="alt"><span class="kyt"><i></i>' + kac(o.sure || '') + '</span><span class="cap">' + dur + ' DURAKSAMA · ÖLÇÜLDÜ</span></div>');
  }

  /* 100 TARİH ŞERİDİ — yüzyıllar yatay şerit, olaylar nokta; seçili olay yanar. */
  function tarihSeridi(o){
    const e = (o && o.olaylar || []).filter(x => x && sayiMi(x.yil));
    if(!e.length) return '';
    const y0 = Math.floor(Math.min.apply(null, e.map(x => x.yil)) / 100) * 100;
    const y1 = Math.ceil((Math.max.apply(null, e.map(x => x.yil)) + 1) / 100) * 100;
    const yer = y => 2 + 96 * (y - y0) / Math.max(100, y1 - y0);
    const ROMA = n => { const r = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; r.forEach(([v, h]) => { while(n >= v){ s += h; n -= v; } }); return s; };
    const yz = [];
    for(let y = y0; y < y1; y += 100) yz.push('<span style="left:' + px(yer(y + 50)) + '">' + (y >= 0 ? ROMA(y / 100 + 1) : 'MÖ') + '</span>');
    const sec = e.find(x => x.on) || e[e.length - 1];
    return kok('100', 'y24', '<div class="ek">' + (yz.length <= 12 ? yz.join('') : '') + e.map(x => '<i class="' + (x === sec ? 'on' : '') + '" style="left:' + px(yer(x.yil)) + '" title="'
      + kac(x.yil + ' · ' + x.ad) + '"></i>').join('') + '</div><span class="ip"><b>' + sec.yil + '</b>' + kac(sec.ad) + (sec.yil >= 0 ? ' · ' + ROMA(Math.floor(sec.yil / 100) + 1) + '. yüzyıl' : '') + '</span>',
      { etiket:e.length + ' olay, ' + e[0].yil + '–' + e[e.length - 1].yil });
  }

  /* 101 AJANLI DERS KAPAĞI — dersin başında ajan portresi ve tek cümle.
     Cümle KURALDAN gelir; model kapalıyken de aynı. */
  function dersKapagi(o){
    if(!o || !o.ad) return '';
    return kok('101', 'x47', '<span class="av" aria-hidden="true"><b>' + kac(o.harf || o.ad.charAt(0)) + '</b>'
      + (o.gorsel ? '<img src="' + kac(o.gorsel) + '" alt="" loading="lazy" onerror="this.remove()">' : '') + '</span>'
      + '<div><span class="mod c-esp">' + kac(buyuk(o.alan || '')) + '</span><b>' + kac(o.ad) + '</b><p>' + kac(o.cumle || '') + '</p></div>');
  }

  /* 102 OTURUM SONU — kart sayısı, iyi oranı, süre, cevap dağılımı; yarının
     yükü altta. Sayılar oturumun kaydından. */
  function oturumSonu(o){
    if(!o || !sayiMi(o.kart)) return '';
    const d = o.dagilim || {};
    const top = ['again', 'hard', 'good', 'easy'].reduce((a, k) => a + (d[k] || 0), 0);
    const renkler = { again:'var(--vk-ink3)', hard:'color-mix(in oklab,var(--esp) 40%,var(--vk-s2))', good:'var(--esp)', easy:'color-mix(in oklab,var(--esp) 70%,var(--vk-s2))' };
    const iyi = top ? Math.round(100 * ((d.good || 0) + (d.easy || 0)) / top) : null;
    return kok('102', 'z20', '<b class="bs">Oturum bitti.</b><div class="uc"><div><b>' + o.kart + '</b><span>kart</span></div><div><b>' + (iyi == null ? '—' : '%' + iyi) + '</b><span>iyi + kolay</span></div>'
      + '<div><b>' + (sayiMi(o.dk) ? dkMetni(o.dk) : '—') + '</b><span>süre</span></div></div>'
      + (top ? '<div class="dg" role="img" aria-label="' + kac('Tekrar ' + (d.again || 0) + ', zor ' + (d.hard || 0) + ', iyi ' + (d.good || 0) + ', kolay ' + (d.easy || 0)) + '">'
        + ['again', 'hard', 'good', 'easy'].map(k => d[k] ? '<i style="width:' + px(100 * d[k] / top) + ';background:' + renkler[k] + '"></i>' : '').join('') + '</div>' : '')
      + '<div class="yr"><span class="cap">TEKRAR · ZOR · İYİ · KOLAY</span><span>' + (sayiMi(o.yarin) ? 'yarın ' + o.yarin + ' kart' : '') + '</span></div>', { ek:'kt' });
  }

  /* 103 KELİME AĞI — kelime ortada; eş anlamlılar çevresinde, zıt anlamlı
     kesik çerçeveyle. Bağ kaydı yoksa kart yok. */
  function kelimeAgi(o){
    const es = (o && o.es || []).filter(Boolean), zit = (o && o.zit || []).filter(Boolean);
    if(!o || !o.kelime || es.length + zit.length < 2) return '';
    const hepsi = es.map(k => ({ k, z:false })).concat(zit.map(k => ({ k, z:true }))).slice(0, 6);
    const YER = [[18, 18], [82, 20], [20, 84], [80, 82], [50, 12], [50, 90]];
    return kok('103', 'z21', '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g stroke="var(--vk-l2)" stroke-width="1">'
      + hepsi.map((h, i) => '<line x1="50" y1="50" x2="' + YER[i][0] + '" y2="' + YER[i][1] + '" vector-effect="non-scaling-stroke"' + (h.z ? ' stroke-dasharray="3 3"' : '') + '/>').join('') + '</g></svg>'
      + hepsi.map((h, i) => '<span class="n' + (h.z ? ' z' : '') + '" style="left:' + YER[i][0] + '%;top:' + YER[i][1] + '%">' + kac(h.k) + (h.z ? '<small>ZIT</small>' : '') + '</span>').join('')
      + '<span class="n m" style="left:50%;top:50%">' + kac(o.kelime) + '</span>', { etiket:o.kelime + ': eş ' + es.join(', ') + (zit.length ? '; zıt ' + zit.join(', ') : '') });
  }

  /* 104 BAĞLI NOTLAR — not kartının altında ona bağlanan notlar ve kaynak. */
  function bagliNotlar(o){
    if(!o || !o.baslik) return '';
    const b = (o.baglar || []).filter(Boolean);
    return kok('104', 'z22', '<div class="u"><b>' + kac(o.baslik) + '</b><span class="cap">' + kac(buyuk(o.ust || 'not')) + '</span></div>'
      + (o.metin ? '<p class="nt3">' + kac(o.metin) + '</p>' : '')
      + '<div class="bg"><span class="cap">' + (b.length ? b.length + ' BAĞLI NOT' : 'BAĞ YOK') + '</span><div>' + b.map(x => '<span>' + kac(x) + '</span>').join('') + '</div></div>', { ek:'kt' });
  }

  /* 105 DESTE DURUMU — kartlar üç durumda: yeni, öğreniliyor, oturmuş. */
  function desteDurumu(o){
    if(!o || !sayiMi(o.toplam) || o.toplam < 1) return '';
    const s = [['Yeni', o.yeni, 'color-mix(in oklab,var(--esp) 35%,var(--vk-s2))'], ['Öğreniliyor', o.ogreniliyor, 'color-mix(in oklab,var(--esp) 65%,var(--vk-s2))'], ['Oturmuş', o.oturmus, 'var(--esp)']];
    return kok('105', 'w21', '<div class="u"><b>' + o.toplam + ' kart</b>' + et('computed') + '</div>'
      + '<div class="br" role="img" aria-label="' + kac(s.map(x => x[0] + ' ' + (x[1] || 0)).join(', ')) + '">' + s.map(x => x[1] ? '<i style="width:' + px(100 * x[1] / o.toplam) + ';background:' + x[2] + '"></i>' : '').join('') + '</div>'
      + '<div class="ls">' + s.map(x => '<div><i style="background:' + x[2] + '"></i>' + x[0] + '<em>' + (x[1] || 0) + '</em></div>').join('') + '</div>');
  }

  /* 106 CÜMLE KURMA — kelime taşları boş yerlere konur; yerleşen taş renk
     alır. Dokunmak taşı sıradaki boş yere koyar (sürükleme gerekmez). */
  function cumleKurma(o){
    if(!o || !(o.yerlesen || []).length && !(o.taslar || []).length) return '';
    return kok('106', 'w22', '<div class="sl2" aria-live="polite">' + (o.yerlesen || []).map(k => '<span class="ok5">' + kac(k) + '</span>').join('')
      + Array.from({ length:(o.bos || 0) }, () => '<span class="bs5" aria-hidden="true"></span>').join('') + '</div>'
      + '<div class="tas">' + (o.taslar || []).map((k, i) => '<button type="button" class="' + (i === 0 ? 'uc2' : '') + '" data-act="' + kac(o.act) + '" data-k="' + kac(k) + '">' + kac(k) + '</button>').join('') + '</div>'
      + '<span class="cap">' + kac(buyuk(o.not || 'Kelimeye dokun · cümleyi kur')) + '</span>');
  }

  /* 107 METİNLİ DİNLEME — oynatıcı ve metin; okunan cümle büyür. */
  function metinliDinleme(o){
    const c = (o && o.cumleler || []).filter(Boolean);
    if(!c.length) return '';
    const i = sayiMi(o.simdi) ? o.simdi : 0;
    return kok('107', 'w23', '<div class="pl"><button type="button" class="oy" data-act="' + kac(o.act) + '" aria-label="' + (o.caliyor ? 'Durdur' : 'Oynat') + '">' + ikon('oyn') + '</button>'
      + '<div class="il2"><i style="width:' + px(100 * (i + (o.caliyor ? 0.5 : 0)) / c.length) + '"></i></div><span class="mono">' + (i + 1) + ' / ' + c.length + '</span></div>'
      + '<div class="mt2" lang="' + kac(o.dil || 'en') + '">' + c.map((x, k) => '<p' + (k === i ? ' class="on"' : '') + '>' + kac(x) + '</p>').join('') + '</div>');
  }

  /* 108 SORU ZİNCİRİ — sokratik konuşma zincir; her «neden?» bir halka. */
  function soruZinciri(o){
    const h = (o && o.halkalar || []).filter(x => x && x.metin);
    if(!h.length) return '';
    return kok('108', 'w24', h.map(x => x.soru
      ? '<div class="r"><span class="av" aria-hidden="true"><b>' + kac(o.harf || '?') + '</b>' + (o.gorsel ? '<img src="' + kac(o.gorsel) + '" alt="" loading="lazy" onerror="this.remove()">' : '') + '</span><p>' + kac(x.metin) + '</p></div>'
      : '<div class="r b"><p>' + kac(x.metin) + '</p></div>').join(''), { etiket:'Soru zinciri, ' + h.filter(x => x.soru).length + ' soru' });
  }

  /* 109 ÜÇ MADDE ÖZETİ — özet MODELİNDİR ve öyle etiketlenir. */
  function ucMaddeOzet(o){
    const m = (o && o.maddeler || []).filter(Boolean).slice(0, 3);
    if(!m.length) return '';
    return kok('109', 'w25', '<div class="u"><b>' + kac(o.baslik || 'Özet') + '</b><span class="cap">' + kac(buyuk(o.kaynak || '')) + '</span></div>'
      + '<ol>' + m.map(x => '<li>' + kac(x) + '</li>').join('') + '</ol>'
      + '<div class="alt">' + et('estimated', 'model özeti · kontrol et') + (o.act ? dugme({ metin:m.length + ' kart ekle', act:o.act, data:o.data }) : '') + '</div>', { ek:'kt' });
  }


  /* ================================================== H · RÜTBE
     XP KARAR VERMEZ (AGENTS.md §1.6): bu kartlar yalnız görünürlüktür;
     hiçbir plan, uyarı ya da öneri bunlara bakmaz. */

  const RUTBE_RENK = ['bronz', 'gumus', 'altin', 'yakut', 'safir', 'kutsal'];
  const rr = no => 'var(--vk-' + (RUTBE_RENK[no - 1] || 'bronz') + ')';

  /* 141 XP DÖKÜMÜ — bugünkü XP nereden geldi. */
  function xpDokumu(o){
    const r = (o && o.satirlar || []).filter(x => x && x.xp > 0);
    if(!r.length) return '';
    const top = r.reduce((a, x) => a + x.xp, 0);
    return kok('141', 'y31', '<div class="u"><b>+' + sayi(top) + '</b><span class="cap">XP · BUGÜN' + (o.sistem ? ' · ' + kac(buyuk(o.sistem)) : '') + '</span></div>'
      + '<div class="ls">' + r.map(x => '<div class="r"><span>' + kac(x.ad) + '</span><em>' + kac(x.adet || '') + '</em><b>+' + sayi(x.xp) + '</b></div>').join('') + '</div>'
      + '<div class="nt">Hiçbir plan ya da uyarı XP’ye bakmaz.</div>');
  }

  /* 142 KADEME YOLU — altı kademe tek yolda; bulunduğun yer yanar. */
  function kademeYolu(o){
    const k = (o && o.kademeler || []);
    if(!k.length || !sayiMi(o.simdi)) return '';
    const ilerleme = k.length > 1 ? 100 * (o.simdi - 1) / (k.length - 1) : 0;
    return kok('142', 'y32', '<div class="yl" style="--ilerleme-oran:' + (ilerleme / 100).toFixed(3) + ';--yol-renk:' + rr(o.simdi) + '">'
      + k.map(x => '<div class="' + (x.no === o.simdi ? 'on' : x.no > o.simdi ? 'kl' : '') + '" style="--r:' + rr(x.no) + '"><span class="rn" aria-hidden="true"></span><span>' + kac(buyuk(x.ad)) + '</span></div>').join('')
      + '</div>' + (o.etiket ? '<div class="bs"><span class="pil">' + kac(o.etiket) + '</span></div>' : ''),
      { etiket:'Kademe ' + o.simdi + ' / ' + k.length + (o.etiket ? ': ' + o.etiket : '') });
  }

  /* 144 SİSTEM BAŞINA RÜTBE — her sistemin kendi rütbesi. Bilinmeyen
     sistem çizilmez (başka sistemin rütbesi uydurulmaz). */
  function sistemRutbesi(o){
    const s = (o && o.sistemler || []).filter(x => x && sayiMi(x.kademe));
    if(s.length < 2) return '';
    return kok('144', 'x60', s.map(x => '<div class="' + renk(x.modul) + '"><span class="rn" style="--r:' + rr(x.kademe) + '" aria-hidden="true"></span><span><b>'
      + kac(x.ad) + '</b>' + kac(x.etiket || '') + '</span></div>').join(''));
  }

  /* 145 RÜTBE GALERİSİ — kazanılan kademeler renkli, kilitliler siluet. */
  function rutbeGalerisi(o){
    const k = (o && o.kademeler || []);
    if(!k.length || !sayiMi(o.simdi)) return '';
    const kaz = k.filter(x => x.no <= o.simdi).length;
    return kok('145', 'x61', '<div class="rf">' + k.map(x => '<div' + (x.no > o.simdi ? ' class="kl"' : '') + '><span class="rn" style="--r:' + rr(x.no) + '" aria-hidden="true"></span><span>'
      + kac(buyuk(x.ad)) + '</span></div>').join('') + '</div><div class="cap"><span>' + kaz + ' KAZANILDI</span><span>' + (k.length - kaz) + ' KİLİTLİ</span></div>',
      { etiket:kaz + ' kademe kazanıldı, ' + (k.length - kaz) + ' kilitli' });
  }

  /* 146 BAŞARIM ROZETİ — kazanılan altıgen ve renkli; kilitli olanın
     ilerlemesi dilim olarak. */
  function basarimRozeti(o){
    const r = (o && o.rozetler || []).filter(Boolean).slice(0, 2);
    if(!r.length) return '';
    return kok('146', 'z30', r.map(x => '<div class="rz2">' + (x.kazanildi
      ? '<span class="hx" aria-hidden="true">' + ikon('yildiz') + '</span><b>' + kac(x.ad) + '</b><span>KAZANILDI' + (x.tarih ? ' · ' + kac(buyuk(x.tarih)) : '') + '</span>'
      : '<span class="hx kl" style="--p:' + (sayiMi(x.oran) ? (100 * x.oran).toFixed(1) : 0) + '" aria-hidden="true"></span><b>' + kac(x.ad) + '</b><span>' + kac(buyuk(x.ilerleme || '')) + '</span>')
      + '</div>').join(''));
  }

  /* 147 AY ÖZETİ ŞERİDİ — on iki ayın çalışma günleri; kayıt başlamadan
     önceki aylar «veri yok» olarak kesik. */
  function ayOzeti(o){
    const a = (o && o.aylar || []);
    if(a.length !== 12 || !a.some(x => !x.yok)) return '';
    const son = a[11];
    return kok('147', 'z31', '<div class="br" role="img" aria-label="' + kac(a.filter(x => !x.yok).map(x => x.ad + ' ' + x.gun + ' gün').join(', ')) + '">'
      + a.map(x => x.yok ? '<i class="yok"></i>' : '<i' + (x.az ? ' class="az"' : '') + ' style="height:' + px(Math.max(2, 100 * Math.min(1, x.gun / (x.gunSayisi || 30)))) + '"></i>').join('') + '</div>'
      + '<div class="ay">' + a.map(x => '<span>' + kac(buyuk(x.ad)) + '</span>').join('') + '</div>'
      + '<div class="lg">' + et('measured', son.uzun + ' · ' + son.gun + ' gün' + (sayiMi(son.dakika) ? ' · ' + sayi(son.dakika) + ' dk' : '')) + '<span>kesik · veri yok</span></div>',
      { ek:renk(o.modul) });
  }

  /* 148 KUSURSUZ GÜNLER — ayın sayısı ay özetinden; günlük takvim yalnız
     günlük kaydın tutulduğu pencere kadardır (eskisi özete işlenmiştir). */
  function kusursuzGunler(o){
    if(!o || !sayiMi(o.sayi)) return '';
    const g = (o.gunler || []);
    return kok('148', 'w33', '<div class="u"><b>' + o.sayi + '</b><span>kusursuz gün · ' + kac(o.ay || '') + (sayiMi(o.aktif) ? ' · ' + o.aktif + ' aktif gün' : '') + '</span></div>'
      + (g.length ? '<div class="kg" aria-hidden="true">' + g.map(x => '<i class="' + (x.bos ? 'bs' : x.kusursuz ? 'k' : x.aktif ? (x.bugun ? 't' : 'd') : 'y') + '" title="' + kac(x.ad || '') + '"></i>').join('') + '</div>' : '')
      + '<div class="lg">' + et('measured', 'ay özetinden') + '<span>★ kusursuz · kesik = boş gün' + (g.length ? ' · son ' + g.filter(x => !x.bos).length + ' gün' : '') + '</span></div>',
      { ek:renk(o.modul) });
  }


  /* ================================================== G · OFİS
     Ajan KONUŞUR, kural motoru SAYAR (AGENTS.md §1.1): ajanın cümlesindeki
     sayı yalnız kural motorunun cümlesinden geliyorsa çip olur ve
     kaynağını taşır; modelin yazdığı sayı çip yapılmaz. */

  /* Birim uzundan kısaya: «38 gün» «38 g» diye kesilmez; birimden sonra
     harf gelirse birim değildir. */
  const SAYI_RE = /(%\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?(?:\s?(?:dakika|oturum|hafta|saat|kcal|soru|kart|blok|puan|gün|net|kg|ml|dk|sa|ay|TL|XP|g|%|₺)(?![A-Za-zÇĞİÖŞÜçğıöşü]))?)/g;
  function sayiCipleri(metin, kaynak){
    const k = kac(metin);
    return k.replace(SAYI_RE, m => /\d/.test(m) ? '<span class="sc" title="' + kac(kaynak || 'sistem hesapladı') + '">' + m + '</span>' : m);
  }
  function av(a, sinif){
    if(!a) return '';
    return '<span class="av' + (sinif ? ' ' + sinif : '') + '" aria-hidden="true"><b>' + kac(a.harf || (a.ad || '?').charAt(0)) + '</b>'
      + (a.gorsel ? '<img src="' + kac(a.gorsel) + '" alt="" loading="lazy" onerror="this.remove()">' : '') + '</span>';
  }

  /* 128 MASA GÖRÜNÜMÜ — konuşan ajan büyür; diğerleri soluk bekler. */
  function masaGorunumu(o){
    const a = (o && o.ajanlar || []).filter(Boolean);
    if(!a.length) return '';
    const on = a.find(x => x.konusuyor) || a[0];
    return kok('128', 'x54', '<div class="on">' + av(on) + '<div><b>' + kac(on.ad) + '</b><span>' + kac(o.durum || 'konuşuyor') + '</span></div></div>'
      + a.filter(x => x !== on).map(x => av(x)).join(''), { ek:renk(o.modul), etiket:on.ad + ' ' + (o.durum || 'konuşuyor') + '; masada ' + a.length + ' ajan' });
  }

  /* 129 BALONDAKİ SAYI ÇİPİ — kural motorunun cümlesi; sayılar çip. */
  function sayiBalonu(o){
    if(!o || !o.metin) return '';
    const ilk = (String(o.metin).match(SAYI_RE) || []).find(m => /\d/.test(m));
    return kok('129', 'x55', '<div class="bal">' + sayiCipleri(o.metin, o.kaynak) + '</div>'
      + (ilk ? '<div class="kn"><span>' + kac(ilk + ' · ' + (o.kaynak || 'sistem hesapladı')) + '</span></div>' : ''), { ek:renk(o.modul) });
  }

  /* 130 AJAN SINIR KARTI — ne yapar, ne yapmaz (ajanın kendi tanımından). */
  function ajanSinir(o){
    if(!o || !o.ad || !(o.yapar || []).length || !(o.yapmaz || []).length) return '';
    return kok('130', 'y29', '<div class="u">' + av(o) + '<div><b>' + kac(o.ad) + '</b><span>' + kac(o.rol || '') + '</span></div></div>'
      + '<div class="ik"><div class="ev"><span class="cap">YAPAR</span>' + o.yapar.slice(0, 3).map(x => '<p>' + ikon('tik') + kac(x) + '</p>').join('') + '</div>'
      + '<div class="hy"><span class="cap">YAPMAZ</span>' + o.yapmaz.slice(0, 3).map(x => '<p>' + ikon('eksi') + kac(x) + '</p>').join('') + '</div></div>', { ek:renk(o.modul) });
  }

  /* 131 DEVİR GÖSTERGESİ — bir ajan konuyu diğerine aktarınca. */
  function devirGostergesi(o){
    if(!o || !o.kaynak || !o.hedef) return '';
    return kok('131', 'y30', '<div class="dv">' + av(o.kaynak, 'es') + '<span class="ok"><i></i>devir<i></i></span>' + av(o.hedef, 'ye') + '</div>'
      + '<div class="bal"><b>' + kac(o.kaynak.ad) + ':</b> ' + kac(o.metin || '') + '</div>',
      { ek:renk(o.modul), etiket:o.kaynak.ad + ' konuyu ' + o.hedef.ad + '’a aktardı' });
  }

  /* 132 AJAN DURUM HALKASI — çalışıyor (kesik, döner), boşta (sabit),
     kapalı (soluk). «Kapalı» modelin kapalı olmasıdır; ajan kural
     motorunun cümlesini yine söyler. */
  function durumHalkasi(o){
    const a = (o && o.ajanlar || []).filter(Boolean);
    if(!a.length) return '';
    const AD = { cal:'ÇALIŞIYOR', bos:'BOŞTA', kap:'KAPALI' };
    return kok('132', 'x56', a.map(x => '<div><span class="hl2 ' + (AD[x.durum] ? x.durum : 'kap') + '">' + av(x) + '</span><span class="cap">'
      + kac(x.ad) + ' · ' + (AD[x.durum] || 'KAPALI') + '</span></div>').join(''), { ek:renk(o.modul),
      etiket:a.map(x => x.ad + ' ' + (AD[x.durum] || 'kapalı').toLocaleLowerCase('tr-TR')).join(', ') });
  }

  /* 133 HAZIR CEVAP ÇİPLERİ — balonun altında iki üç kısa cevap. */
  function hazirCevap(o){
    const c = (o && o.cevaplar || []).filter(Boolean).slice(0, 3);
    if(!o || !o.soru || !c.length) return '';
    return kok('133', 'x57', '<div class="bal" style="font-size:13px">' + sayiCipleri(o.soru, o.kaynak) + '</div>'
      + '<div class="cp">' + c.map(x => '<button type="button" data-act="' + kac(x.act) + '"' + nitelik(x.data) + '>' + kac(x.metin) + '</button>').join('') + '</div>', { ek:renk(o.modul) });
  }

  /* 135 GÜNÜN TOPLANTISI — Patron her ajandan tek cümle toplar; cümle
     kural motorunun, sayılar çip. */
  function gununToplantisi(o){
    const r = (o && o.satirlar || []).filter(x => x && x.cumle);
    if(!r.length) return '';
    return kok('135', 'z28', '<span class="cap">' + kac(buyuk(o.baslik || 'Patron · günün toplantısı')) + '</span>'
      + r.map(x => '<div class="r">' + av(x) + '<p><b>' + kac(x.ad) + '</b>' + sayiCipleri(x.cumle, o.kaynak) + '</p></div>').join(''), { ek:renk(o.modul) });
  }

  /* 138 KONUŞMA ÖZETİ — kararlar ve açık sorular; konuşma baştan okunmaz. */
  function konusmaOzeti(o){
    if(!o || !o.ajan || !((o.kararlar || []).length + (o.acik || []).length)) return '';
    return kok('138', 'w31', '<div class="u">' + av(o.ajan) + '<div><b>' + kac(o.baslik || 'Dünkü konuşma') + '</b><span>' + kac(o.ajan.ad + (sayiMi(o.mesaj) ? ' · ' + o.mesaj + ' mesaj' : '')) + '</span></div></div>'
      + (o.kararlar || []).map(x => '<div class="r">' + ikon('tik') + kac(x) + '</div>').join('')
      + (o.acik || []).map(x => '<div class="r ac3">' + ikon('bilgi') + 'Açık: ' + kac(x) + '</div>').join(''), { ek:'kt ' + renk(o.modul) });
  }


  /* OFİS BİRLEŞTİRİCİSİ — üç modülün ofis ekranı aynı kartları aynı
     kuralla kurar. o = { modul, acik (açık masanın kimliği), ajanlar:[{ id,
     ad, harf, rol, gorsel, hazir (model açık mı), cumle (KURAL MOTORUNUN
     cümlesi), yapar:[], yapmaz:[], patron }], devir:{ kaynak, hedef, metin },
     act:{ ac, sor } }. Model açıkken de cümle kural motorunundur; balona
     modelin cevabı girmez. */
  function ofis(o){
    const a = (o && o.ajanlar || []).filter(Boolean);
    if(!a.length) return {};
    const patron = a.find(x => x.patron) || a[0];
    const uzman = a.filter(x => x !== patron);
    const acik = a.find(x => x.id === o.acik);
    const konusan = acik || patron;
    const ac = (o.act || {}).ac, sor = (o.act || {}).sor;
    return {
      masa:masaGorunumu({ modul:o.modul, durum:acik ? 'raporu açık' : 'masayı yönetiyor',
        ajanlar:a.map(x => Object.assign({}, x, { konusuyor:x === konusan })) }),
      durum:durumHalkasi({ modul:o.modul, ajanlar:a.map(x => ({ ad:x.ad, harf:x.harf, gorsel:x.gorsel, durum:x.hazir ? 'bos' : 'kap' })) }),
      balon:patron.cumle ? sayiBalonu({ modul:o.modul, metin:patron.cumle, kaynak:'kural motoru hesapladı' }) : '',
      hazir:uzman[0] && uzman[0].cumle && ac ? hazirCevap({ modul:o.modul, soru:uzman[0].ad + ': ' + uzman[0].cumle, kaynak:'kural motoru hesapladı',
        cevaplar:[{ metin:'Raporu aç', act:ac, data:{ 'data-id':uzman[0].id, 'data-agent':uzman[0].id } }].concat(sor ? [{ metin:'Soru sor', act:sor, data:{ 'data-agent':uzman[0].id } }] : []) }) : '',
      toplanti:gununToplantisi({ modul:o.modul, kaynak:'kural motoru hesapladı', baslik:'Patron · günün toplantısı',
        satirlar:uzman.map(x => ({ ad:x.ad, harf:x.harf, gorsel:x.gorsel, cumle:x.cumle })) }),
      sinir:acik ? ajanSinir(Object.assign({ modul:o.modul }, acik)) : '',
      devir:o.devir ? devirGostergesi(Object.assign({ modul:o.modul }, o.devir)) : '',
    };
  }
  /* Kapsam cümlesini maddeye böler: «A, B ve C.» → [A, B, C]. */
  function maddele(metin){
    return String(metin || '').replace(/\.\s*$/, '').split(/,\s*|\s+ve\s+/).map(x => x.trim()).filter(Boolean)
      .map(x => x.charAt(0).toLocaleUpperCase('tr-TR') + x.slice(1));
  }


  /* ================================================== A · GÜN, K · GÜVEN */

  /* 006 GÜNÜN AÇILIŞI — günün ilk açılışında: iş sayısı, toplam süre,
     ilk iş. Cümleyi kod kurar. */
  function gunAcilisi(o){
    if(!o || !sayiMi(o.is) || o.is < 1) return '';
    return kok('006', 'y02', '<div class="cap">GÜNÜN AÇILIŞI' + (o.saat ? ' · ' + kac(o.saat) : '') + '</div>'
      + '<div class="sl"><b>' + o.is + ' iş</b><span>' + kac(dkMetni(o.dk) + (o.not ? ' · ' + o.not : '')) + '</span></div>'
      + (o.ilk ? '<div class="il"><span class="mod ' + (renk(o.modul) || 'c-ays') + '">' + kac(buyuk(o.sistem || o.modul || '')) + '</span><span>' + kac(o.ilk.ad) + '</span>'
        + (o.ilk.not ? '<span class="cap">' + kac(o.ilk.not) + '</span>' : '') + '</div>' : '')
      + '<div class="alt">' + et('computed', 'kod üretir') + (o.act ? dugme({ metin:'Güne başla', ton:'w', act:o.act, data:o.data }) : '') + '</div>', { ek:'kt' });
  }

  /* 007 GÜN KAPANIŞI — üç sayı ve yarının ilk işi. */
  function gunKapanisi(o){
    if(!o || !sayiMi(o.biten) || !sayiMi(o.toplam)) return '';
    const sa = sayiMi(o.dk) ? Math.floor(o.dk / 60) + ':' + String(Math.round(o.dk % 60)).padStart(2, '0') : '—';
    return kok('007', 'y03', '<b class="bs">Bugün kapandı.</b><div class="uc"><div><b>' + o.biten + ' / ' + o.toplam + '</b><span>iş</span></div>'
      + '<div><b>' + sa + '</b><span>sa çalışma</span></div><div><b>' + (sayiMi(o.ertelenen) ? o.ertelenen : '—') + '</b><span>ertelendi</span></div></div>'
      + (o.yarin ? '<div class="yr">' + ikon('ok') + 'Yarın ilk iş <b>' + kac(o.yarin) + '</b></div>' : ''), { ek:'kt' });
  }

  /* 023 YAZILABİLİR GÜN PENCERESİ — bugün ve N gün geri açık; daha eskisi
     kilitli ve taralı. Pencere kodun kuralı (XP ve rozet defterleri). */
  function gunPenceresi(o){
    const g = (o && o.gunler || []);
    if(!g.length) return '';
    const ilkAcik = g.findIndex(x => !x.kilitli);
    const sinif = x => [x.bugun ? 'bu' : '', x.secili ? 'secili' : '', x.kilitli ? 'k' : '', x.dolu ? 'dl' : ''].filter(Boolean).join(' ');
    return kok('023', 'w05', '<div class="gn2" role="group" aria-label="' + kac(o.etiket || 'Gün seç') + '" style="grid-template-columns:repeat(' + g.length + ',minmax(26px,1fr))">'
      + g.map(x => x.act
        ? '<button type="button" class="' + sinif(x) + '" data-act="' + kac(x.act) + '"' + nitelik(x.data) + ' aria-label="' + kac(x.ad || x.gun) + '"'
          + (x.baslik ? ' title="' + kac(x.baslik) + '"' : '') + ' aria-pressed="' + (x.secili ? 'true' : 'false') + '">' + kac(x.gun) + '</button>'
        : '<i class="' + sinif(x) + '"' + (x.kilitli ? ' title="kilitli"' : '') + '>' + kac(x.gun) + '</i>').join('') + '</div>'
      + (ilkAcik > 0 ? '<div class="pn2" style="margin-left:' + px(100 * ilkAcik / g.length) + '"></div>' : '')
      + '<div class="alt"><span class="cap">' + ikon('kilit') + kac(buyuk(o.kilitAd || 'kilitli')) + '</span><span class="cap">'
      + kac(buyuk(o.not || ('Bugün + ' + (o.pencere || 7) + ' gün geri yazılabilir'))) + '</span></div>');
  }

  /* 168 ADIMLI SAYI GİRİŞİ — küçük sayılar için büyük artı/eksi (48 px). */
  function adimliSayi(o){
    if(!o) return '';
    return kok('168', 'w37', '<span class="cap">' + kac(buyuk(o.etiket || '')) + '</span><div class="st3">'
      + dugme({ metin:'−', act:o.act, data:Object.assign({ 'data-delta':'-1' }, o.data || {}), aria:(o.ad || '') + ' azalt', pasif:!sayiMi(o.deger) || o.deger <= (o.min || 0) })
      + '<div><b aria-live="polite">' + (sayiMi(o.deger) ? sayi(o.deger) : '—') + '</b><span>' + kac(o.birim || '') + '</span></div>'
      + dugme({ metin:'+', ton:'w', act:o.act, data:Object.assign({ 'data-delta':'1' }, o.data || {}), aria:(o.ad || '') + ' artır' }) + '</div>'
      + '<span class="cap">' + kac(buyuk(o.not || '48 piksel düğme · tek el')) + '</span>');
  }

  /* 117 GERİ DÖNÜŞ NOKTALARI — büyük ve orta aksiyonlardan önceki hâl;
     birine tek düğmeyle dönülür. */
  function geriDonus(o){
    const r = (o && o.noktalar || []).filter(Boolean);
    if(!r.length) return '';
    return kok('117', 'y28', r.map(x => '<div class="r"><div><b>' + kac(x.ad) + '</b><span>' + kac(buyuk(x.not || '')) + '</span></div>'
      + (x.act ? dugme({ metin:'Dön', act:x.act, data:x.data, aria:x.ad + ' — geri dön' }) : '') + '</div>').join(''));
  }

  /* 174 VERİ NEREDE? — tek şema: cihaz asıl kayıt, yedek senin seçtiğin
     yer, Merkez isteğe bağlı (teklif yazar, modüle yazmaz — §1.4). */
  function veriNerede(o){
    o = o || {};
    return kok('174', 'z39', '<div class="n a"><b>' + kac(o.cihaz || 'Bu cihaz') + '</b><span>' + kac(o.cihazNot || 'asıl kayıt burada') + '</span></div>'
      + '<div class="bg2" aria-hidden="true"><i></i><i class="k"></i></div>'
      + '<div class="sag2"><div class="n"><b>Yedek dosyası</b><span>senin seçtiğin yer</span></div>'
      + '<div class="n c"><b>Merkez</b><span>' + kac(o.merkezNot || 'isteğe bağlı · teklif yazar, modüle yazmaz') + '</span></div></div>',
      { etiket:'Veri bu cihazda; yedek senin seçtiğin yerde; Merkez isteğe bağlı ve modüle yazmaz' });
  }

  /* 175 DIŞA AKTAR — biçim ve ilk satırların önizlemesi. Yalnız VAR OLAN
     biçim çizilir; olmayan seçenek gösterilmez. */
  function disaAktar(o){
    if(!o || !o.act) return '';
    return kok('175', 'z40', '<div class="u"><span class="cap">DIŞA AKTAR' + (o.sistem ? ' · ' + kac(buyuk(o.sistem)) : '') + '</span>'
      + (o.etiketli ? et('computed', 'etiketler dahil') : '<span class="cap">' + kac(buyuk(o.not || 'ham kayıt')) + '</span>') + '</div>'
      + '<div class="sg">' + (o.bicimler || ['JSON']).map((b, i) => '<span' + (i === 0 ? ' class="on"' : '') + '>' + kac(b) + '</span>').join('') + '</div>'
      + (o.onizleme ? '<pre>' + kac(o.onizleme) + '</pre>' : '')
      + '<div class="alt"><span class="cap">' + (sayiMi(o.kayit) ? sayi(o.kayit) + ' KAYIT' : '') + (sayiMi(o.kb) ? ' · ' + sayi(o.kb) + ' KB' : '') + '</span>'
      + dugme({ metin:'Dışa aktar', ton:'w', act:o.act }) + '</div>');
  }

  /* 178'in modeli: yedek mevcut verinin TAMAMINI değiştirir; kod dört
     sayıyı sayar. Karşılaştırma kaydın JSON'u üzerinden (anahtar sırası
     korunarak yazıldığı için aynı kayıt aynı metni verir). */
  function yedekFarki(mevcut, gelen){
    mevcut = mevcut || {}; gelen = gelen || {};
    const r = { ayni:0, yeni:0, degisen:0, silinen:0 };
    const metin = v => { try{ return JSON.stringify(v); }catch(e){ return String(v); } };
    Object.keys(gelen).forEach(k => {
      if(!Object.prototype.hasOwnProperty.call(mevcut, k)) r.yeni++;
      else if(metin(mevcut[k]) === metin(gelen[k])) r.ayni++;
      else r.degisen++;
    });
    Object.keys(mevcut).forEach(k => { if(!Object.prototype.hasOwnProperty.call(gelen, k)) r.silinen++; });
    return r;
  }

  /* 178 İÇE AKTARMA ÖNİZLEMESİ — içe aktarmadan önce aynı, yeni, değişen
     ve (yedek her şeyi değiştirdiği için) silinecek kayıt sayıları. */
  function iceAktarma(o){
    if(!o || !o.dosya) return '';
    const h = (b, s, c) => '<div' + (c ? ' class="' + c + '"' : '') + '><b>' + sayi(b) + '</b><span>' + kac(s) + '</span></div>';
    return kok('178', 'w42', '<div class="fl"><span class="ik3" aria-hidden="true">{ }</span><div><b>' + kac(o.dosya) + '</b><span>' + kac(o.alt || '') + '</span></div></div>'
      + '<div class="sn3" style="grid-template-columns:repeat(4,1fr)">' + h(o.ayni, 'aynı') + h(o.yeni, 'yeni') + h(o.degisen, 'değişen', o.degisen ? 'ck4' : '')
      + h(o.silinen, 'silinecek', o.silinen ? 'ck4' : '') + '</div>'
      + '<div class="alt">' + (o.vazgec ? dugme({ metin:'Vazgeç', act:o.vazgec }) : '<span></span>')
      + (o.act ? dugme({ metin:o.dugme || 'Yedeği yükle', ton:'w', act:o.act }) : '') + '</div>');
  }

  /* ================================================== A · J · F · SON PARTİ */

  /* 020 ETKİN SÜZGEÇ ÇİPLERİ — açık süzgeçler çip; her biri tek dokunuşla
     kalkar, sonuç sayısı altta. Süzgeç yoksa kart yok. */
  function suzgecCipleri(o){
    const c = (o && o.cipler || []).filter(Boolean);
    if(!c.length) return '';
    return kok('020', 'w02', '<div class="u"><span class="cap">ETKİN SÜZGEÇ · ' + c.length + '</span>'
      + (o.temizle ? '<button type="button" class="tz" data-act="' + kac(o.temizle.act) + '"' + nitelik(o.temizle.data) + '>Temizle</button>' : '') + '</div>'
      + '<div class="cp2">' + c.map(x => '<button type="button"' + (renk(x.modul) ? ' class="' + renk(x.modul) + '"' : '') + ' data-act="' + kac(x.act) + '"' + nitelik(x.data)
        + ' aria-label="' + kac(x.ad + ' süzgecini kaldır') + '">' + kac(x.ad) + ikon('kapat') + '</button>').join('') + '</div>'
      + '<div class="sn"><b>' + sayi(o.sonuc) + '</b>' + kac(o.birim || 'sonuç') + '</div>');
  }

  /* 125 TAKVİMDE HAYALET ÖNERİ — önerilen blok kesikli mor; onaysız
     yerleşmez. */
  function hayaletOneri(o){
    const r = (o && o.satirlar || []).filter(Boolean);
    if(!r.some(x => x.hayalet)) return '';
    return kok('125', 'w27', '<div class="gn4">' + r.map(x => '<span class="sa">' + kac(x.saat || '') + '</span>'
      + (x.hayalet ? '<i class="hy2">+ ' + kac(x.ad) + '</i>' : x.ad ? '<i class="bk ' + (renk(x.modul) || 'c-ays') + '">' + kac(x.ad) + '</i>' : '<i class="bos2"></i>')).join('') + '</div>'
      + '<div class="alt"><span class="cap" style="color:var(--mer-ink, var(--mer))">ONAYSIZ YERLEŞMEZ</span>'
      + (o.act ? dugme({ metin:'Yerleştir', ton:'p', act:o.act, data:o.data }) : '') + '</div>');
  }

  /* 134 AJAN SEÇİCİ — «@» ile; rol ve modül yanında, eşleşen harf renkli. */
  function vurgula(ad, q){
    const i = q ? ad.toLocaleLowerCase('tr-TR').indexOf(q.toLocaleLowerCase('tr-TR')) : -1;
    return i < 0 ? kac(ad) : kac(ad.slice(0, i)) + '<u>' + kac(ad.slice(i, i + q.length)) + '</u>' + kac(ad.slice(i + q.length));
  }
  function ajanSecici(o){
    const q = String(o && o.sorgu || '').replace(/^@/, '');
    const liste = (o && o.ajanlar || []).filter(a => a && (!q || a.ad.toLocaleLowerCase('tr-TR').indexOf(q.toLocaleLowerCase('tr-TR')) >= 0
      || String(a.rol || '').toLocaleLowerCase('tr-TR').indexOf(q.toLocaleLowerCase('tr-TR')) >= 0));
    if(!liste.length) return '';
    return kok('134', 'z27', '<div class="ls" role="listbox" aria-label="Ajan seç">' + liste.map((a, i) =>
      '<button type="button" role="option" aria-selected="' + (i === 0 ? 'true' : 'false') + '" class="' + (i === 0 ? 'on ' : '') + (renk(a.modul) || '') + '" data-act="' + kac(o.act) + '" ' + (o.alan || 'data-value') + '="' + kac(a.id) + '">'
      + av(a) + '<b>' + vurgula(a.ad, q) + '</b><span>' + kac(a.rol || '') + '</span><em>' + kac(buyuk(a.sistem || a.modul || '')) + '</em></button>').join('') + '</div>');
  }

  /* 136 ÜSLUP SEÇİMİ — üç seçenekten biri; önizleme anında değişir.
     Önizleme cümlesini KOD kurar (şablon + senin sayın), model değil. */
  function uslupSecimi(o){
    const s = (o && o.secenekler || []).filter(Boolean);
    if(!s.length) return '';
    return kok('136', 'z29', '<div class="u"><span class="cap">' + kac(buyuk(o.baslik || 'Üslup')) + '</span>' + et('measured', 'tercih · geri alınır') + '</div>'
      + '<div class="sg" role="radiogroup" aria-label="' + kac(o.baslik || 'Üslup') + '">' + s.map(x => '<button type="button" role="radio" aria-checked="' + (x.id === o.secili ? 'true' : 'false') + '"'
        + (x.id === o.secili ? ' class="on"' : '') + ' data-act="' + kac(o.act) + '" data-value="' + kac(x.id) + '">' + kac(x.ad) + '</button>').join('') + '</div>'
      + (o.onizleme ? '<div class="bal" aria-live="polite">' + kac(o.onizleme) + '</div>' : '')
      + (o.not ? '<span class="cap" style="display:block;margin-top:8px">' + kac(buyuk(o.not)) + '</span>' : ''));
  }

  /* 143 SAKİN SEVİYE ATLAMA — kısa parlama; ekranı kapatmaz, işi bölmez. */
  function sakinSeviye(o){
    if(!o || !o.ad) return '';
    return kok('143', 'x59v', '<div class="ts2" role="status"><span class="rn" style="--r:' + kac(RUTBE_RENK[o.renk] || RUTBE_RENK.bronz) + '"></span>'
      + '<div><span>' + kac(buyuk(o.ust || 'Yeni rütbe')) + '</span><b>' + kac(o.ad) + '</b></div>' + (o.sistem ? '<em>' + kac(buyuk(o.sistem)) + '</em>' : '') + '</div>',
      { dis:'vk-sakin' });
  }

  /* 157 BIRAKMA ALANI — sürüklenen öğe yaklaşınca kesikliden dolu
     çerçeveye geçer. Kart tek bir hedef satırıdır. */
  function birakmaAlani(o){
    o = o || {};
    return '<div class="vk vk-birak" data-oz="157" data-birak="' + kac(o.sira) + '"' + (o.etiket ? ' aria-label="' + kac(o.etiket) + '"' : '') + '>'
      + '<div class="d w34"><div class="bz2"><span class="cap">' + kac(buyuk(o.metin || 'Buraya bırak')) + '</span></div></div></div>';
  }

  /* 161 KAYDIRARAK İŞARETLE — satırı sağa kaydır: bitti; sola: ertele.
     Kaydırma bir KISAYOLDUR: aynı iki eylem gizli olmayan düğme olarak da
     satırdadır (klavye ve ekran okuyucu). */
  function kaydirIpucu(){
    return kok('161', 'y36', '<div class="ip"><span class="cap">SAĞA · BİTTİ</span><span class="cap">SOLA · ERTELE</span></div>', { dis:'vk-kaydir-ip' });
  }
  let kaydirKurulu = false;
  function kaydirmaKur(belge){
    const d = belge || (typeof document !== 'undefined' ? document : null);
    if(!d || kaydirKurulu) return false;
    kaydirKurulu = true;
    let el = null, x0 = 0, y0 = 0, dx = 0, yatay = null;
    const ESIK = 72;
    d.addEventListener('pointerdown', e => {
      const s = e.target.closest && e.target.closest('[data-kaydir]');
      if(!s || e.button > 0 || e.target.closest('button, a, input, select, textarea')) return;
      el = s; x0 = e.clientX; y0 = e.clientY; dx = 0; yatay = null;
    });
    d.addEventListener('pointermove', e => {
      if(!el) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if(yatay === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) yatay = Math.abs(mx) > Math.abs(my);
      if(!yatay) return;
      dx = mx;
      el.style.setProperty('--kaydir', Math.max(-120, Math.min(120, dx)) + 'px');
      el.dataset.yon = dx > ESIK ? 'sag' : dx < -ESIK ? 'sol' : '';
    });
    const bitir = () => {
      if(!el) return;
      const s = el, yon = s.dataset.yon;
      el = null;
      s.style.removeProperty('--kaydir'); delete s.dataset.yon;
      if(!yon || !s.dataset.kaydir) return;
      /* Eylem uygulamanın OLAĞAN tıklama yolundan geçer: satıra geçici bir
         düğme eklenir, tıklanır, kaldırılır (data-act + satırın verisi). */
      const b = d.createElement('button');
      b.type = 'button'; b.hidden = true;
      b.dataset.act = s.dataset.kaydir; b.dataset.yon = yon;
      Object.keys(s.dataset).forEach(k => { if(k !== 'kaydir' && k !== 'yon' && k !== 'act') b.dataset[k] = s.dataset[k]; });
      s.appendChild(b);
      try{ b.click(); }finally{ b.remove(); }
    };
    d.addEventListener('pointerup', bitir);
    d.addEventListener('pointercancel', () => { if(el){ el.style.removeProperty('--kaydir'); delete el.dataset.yon; el = null; } });
    return true;
  }

  /* 122 SESSİZ SAATLER — gece bandında gelen öneri bekler, sabah ilk
     açılışta görünür. Saatler «SS:DD»; bant gece yarısını geçebilir. */
  const dkOf = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? (+m[1]) * 60 + (+m[2]) : null; };
  function sessizSaatler(o){
    const ss = o && o.sessiz;
    if(!ss) return '';
    const b = dkOf(ss.bas), s = dkOf(ss.bit);
    if(b == null || s == null) return '';
    /* şerit öğlenden öğlene: 12 · 18 · 00 · 06 · 12 */
    const yer = dk => ((dk - 720 + 1440) % 1440) / 1440 * 100;
    const genis = ((s - b + 1440) % 1440) / 1440 * 100;
    const bek = o.bekleyen && dkOf(o.bekleyen.saat);
    return kok('122', 'z25', '<div class="ek" aria-hidden="true"><span>12</span><span>18</span><span>00</span><span>06</span><span>12</span></div>'
      + '<div class="tr" role="img" aria-label="' + kac('Sessiz saatler ' + ss.bas + '–' + ss.bit + (ss.acik ? '' : ' (kapalı)')) + '">'
      + (ss.acik ? '<span class="ss" style="left:' + px(yer(b)) + ';width:' + px(genis) + '"></span>' : '')
      + (bek != null && ss.acik ? '<span class="ok3" style="left:' + px(yer(bek)) + ';width:' + px(((s - bek + 1440) % 1440) / 1440 * 100) + '"></span>'
        + '<span class="on bk" style="left:' + px(yer(bek)) + '">' + ikon('yildiz') + '</span><span class="on" style="left:' + px(yer(s)) + '">' + ikon('yildiz') + '</span>' : '')
      + '</div><div class="alt"><span>' + kac(bek != null && ss.acik ? o.bekleyen.saat + '’daki bildirim ' + ss.bit + '’de gelir'
        : ss.acik ? 'Bu saatlerde bildirim gönderilmez; sabah ilk açılışta görünür' : 'Sessiz saatler kapalı') + '</span>'
      + '<span class="cap">SESSİZ ' + kac(ss.bas.slice(0, 2) + '–' + ss.bit.slice(0, 2)) + '</span></div>');
  }

  /* 180 MODÜL BAZINDA BİLDİRİM — her bildirim türü kendi renginde ayrı
     anahtar; sessiz saatler en altta. Yalnız BU uygulamanın gönderdiği
     türler çizilir: başka bir uygulamanın anahtarı burada iş görmez. */
  function bildirimAyari(o){
    const t = (o && o.turler || []).filter(Boolean);
    if(!t.length) return '';
    return kok('180', 'w44', t.map(x => '<div class="r ' + (renk(x.modul) || 'c-ays') + '"><i aria-hidden="true"></i><span>' + kac(x.ad) + '</span>'
      + '<button type="button" class="an2' + (x.acik ? ' on' : '') + '" role="switch" aria-checked="' + (x.acik ? 'true' : 'false') + '" aria-label="' + kac(x.ad) + '"'
      + ' data-act="' + kac(o.act) + '" data-tur="' + kac(x.id) + '"></button></div>').join('')
      + '<div class="alt"><span class="cap">SESSİZ SAATLER</span>' + (o.sessizGiris || '<b class="mono">' + kac(o.sessiz && o.sessiz.acik ? o.sessiz.bas + ' – ' + o.sessiz.bit : 'kapalı') + '</b>') + '</div>');
  }

  /* 180 + 122 birlikte: bildirim tercih kutusu. Tercihi Pwa okur/yazar;
     burada yalnız çizilir ve eylem çözülür (modül kendi ekranını yeniler). */
  function bildirimKutusu(o){
    const P = L.Pwa;
    if(!P || !P.bildirimAyari || !o || !o.modul) return '';
    const a = P.bildirimAyari(o.modul);
    const ss = a.sessiz;
    const saat = (uc, v) => '<input type="time" step="900" value="' + kac(v) + '" data-change="bildirim-saat" data-uc="' + uc + '" aria-label="'
      + (uc === 'bas' ? 'Sessiz saat başlangıcı' : 'Sessiz saat bitişi') + '">';
    const giris = '<span style="display:inline-flex;align-items:center;gap:6px">'
      + '<button type="button" class="an2' + (ss.acik ? ' on' : '') + '" role="switch" aria-checked="' + (ss.acik ? 'true' : 'false') + '" aria-label="Sessiz saatler" data-act="bildirim-sessiz"></button>'
      + saat('bas', ss.bas) + '–' + saat('bit', ss.bit) + '</span>';
    return bildirimAyari({ act:'bildirim-tur', sessiz:ss, sessizGiris:giris,
      turler:(o.turler || []).map(t => Object.assign({ modul:o.modul, acik:a.turler[t.id] !== false }, t)) })
      + sessizSaatler({ sessiz:ss, bekleyen:o.bekleyen });
  }
  /* Eylem çözücü: { ok, metin } döner; yazma Pwa'da. */
  function bildirimEylem(modul, ad, el){
    const P = L.Pwa;
    if(!P || !P.bildirimAyari) return { ok:false, metin:'Bildirim tercihi bu sürümde yok.' };
    const a = P.bildirimAyari(modul);
    if(ad === 'bildirim-tur'){
      const tur = el && el.dataset.tur;
      if(!tur) return { ok:false };
      const acik = a.turler[tur] === false;
      const r = P.bildirimAyariYaz(modul, { turler:{ [tur]:acik } });
      return { ok:r.ok, metin:r.ok ? (acik ? 'Bildirim açıldı.' : 'Bildirim kapatıldı; ekranda görünmeye devam eder.') : r.why };
    }
    if(ad === 'bildirim-sessiz'){
      const r = P.bildirimAyariYaz(modul, { sessiz:{ acik:!a.sessiz.acik } });
      return { ok:r.ok, metin:r.ok ? (a.sessiz.acik ? 'Sessiz saatler kapandı.' : 'Sessiz saatler açık: ' + a.sessiz.bas + '–' + a.sessiz.bit + '.') : r.why };
    }
    if(ad === 'bildirim-saat'){
      const uc = el && el.dataset.uc;
      if(uc !== 'bas' && uc !== 'bit') return { ok:false };
      const r = P.bildirimAyariYaz(modul, { sessiz:{ [uc]:String(el.value || '') } });
      return { ok:r.ok, metin:r.ok ? 'Sessiz saatler: ' + r.ayar.sessiz.bas + '–' + r.ayar.sessiz.bit + '.' : r.why };
    }
    return { ok:false };
  }

  /* 134'ün bağı: bir yazı kutusunda «@» ile başlayınca listeyi yan kutuya
     çizer. Ekran yeniden çizilmez; kurulum girdi kimliği başına bir kez. */
  const mentionler = {};
  function mentionKur(o){
    if(!o || !o.girdi || mentionler[o.girdi] || typeof document === 'undefined') return false;
    mentionler[o.girdi] = o;
    document.addEventListener('input', e => {
      const b = mentionler[e.target && e.target.id];
      if(!b) return;
      const kutu = document.getElementById(b.kutu);
      const m = /^@(\S*)$/.exec(String(e.target.value || '').trim());
      if(kutu) kutu.innerHTML = m ? ajanSecici({ sorgu:m[1], act:b.act, alan:b.alan, ajanlar:b.ajanlar() }) : '';
    });
    return true;
  }

  /* 143'ün gösterimi: kartı sayfaya ekler, 3 sn sonra çeker. Ekranı
     kapatmaz, odağı çalmaz (role=status, pointer-events yok). */
  function sakinGoster(o, belge){
    const d = belge || (typeof document !== 'undefined' ? document : null);
    const h = sakinSeviye(o);
    if(!d || !d.body || !h) return false;
    const eski = d.querySelector('.vk-sakin');
    if(eski) eski.remove();
    const kap = d.createElement('div');
    kap.innerHTML = h;
    const el = kap.firstChild;
    d.body.appendChild(el);
    setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, (o && o.sure) || 3000);
    return true;
  }

  L.VITRIN = {
    kac, sayi, isaretli, dkMetni, et, ikon, tik, hl, fk, kok, dugme, renk, KES,
    geriSayim, notrSerit, yanlisKarti, denemeKarnesi, hizSeridi, denemeKarsilastirma,
    kapsamHalkasi, konuZinciri, haftaCizgisi, planIzgarasi, araHaftasi, tasimaGolgesi,
    tekSatirSoru, yanlisNedenleri, denemeTakvimi, soruEkrani, tekrarPaketi, blokBitis,
    dersDengesi, denemeGirisi, konuTablosu, hedefAyari, tekrarTakvimi, hedefeKalan,
    dersIsaretleri,
    toparlanmaHalkasi, uykuBandi, hamOrtalama, referansBandi, tabak, tekDokunus, enerjiOlcegi,
    setKutucuklari, haftaHalkalari, tusTakimi, sonrakiKontrol, harcamaSeritleri, ogunCizelgesi,
    yogunlukBolgeleri, harcamaTakvimi, uykuDuzeni, tahlilKarsilastirma, ogunSablonlari,
    antrenmanHaftasi, duzenliGiderler, olcumHatirlatici,
    desteYigini, sureliCevap, dakikaHalkasi, unutmaEgrisi, merdiven, kutuphaneRafi, okumaIlerlemesi,
    alintiKarti, kelimeSahnesi, baglamdaKelime, dalgaFormu, tarihSeridi, dersKapagi, oturumSonu,
    kelimeAgi, bagliNotlar, desteDurumu, cumleKurma, metinliDinleme, soruZinciri, ucMaddeOzet,
    xpDokumu, kademeYolu, sistemRutbesi, rutbeGalerisi, basarimRozeti, ayOzeti, kusursuzGunler,
    sayiCipleri, masaGorunumu, sayiBalonu, ajanSinir, devirGostergesi, durumHalkasi, hazirCevap,
    gununToplantisi, konusmaOzeti, ofis, maddele,
    gunAcilisi, gunKapanisi, gunPenceresi, adimliSayi, geriDonus, veriNerede, disaAktar, iceAktarma, yedekFarki,
    suzgecCipleri, hayaletOneri, ajanSecici, uslupSecimi, sakinSeviye, sakinGoster, birakmaAlani, mentionKur, kaydirIpucu, kaydirmaKur,
    sessizSaatler, bildirimAyari, bildirimKutusu, bildirimEylem,
  };
})();
