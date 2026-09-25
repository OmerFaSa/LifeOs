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

  L.VITRIN = {
    kac, sayi, isaretli, dkMetni, et, ikon, tik, hl, fk, kok, dugme, renk, KES,
    geriSayim, notrSerit, yanlisKarti, denemeKarnesi, hizSeridi, denemeKarsilastirma,
    kapsamHalkasi, konuZinciri, haftaCizgisi, planIzgarasi, araHaftasi, tasimaGolgesi,
    tekSatirSoru, yanlisNedenleri, denemeTakvimi, soruEkrani, tekrarPaketi, blokBitis,
    dersDengesi, denemeGirisi, konuTablosu, hedefAyari, tekrarTakvimi, hedefeKalan,
    dersIsaretleri,
  };
})();
