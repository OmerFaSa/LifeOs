/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/pano.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PANO KARTLARI — görsel dilin ortak parçaları (AGENTS §1.10).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/pano.js`; `python tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi
   `brand/ortak/pano.css`.
   ==================================================================

   Kullanıcı (2026-10-20): «bu temada bir sürü kart ekleyebilirsin»;
   onaylanan katalog: mevcut tema (beyaz kart, ince çerçeve, 14 px köşe,
   modül rengi), her kartın görseli kendi kaydından.

   Sözler:
     1. GÖRSEL VERİ UYDURMAZ. Hedef yoksa halka/eşik çizilmez; değeri
        null olan gün sıfır değil, kesik kutudur. Kaynağı olmayan kart
        `bos` hâliyle çizilir: kesik çerçeve, tek cümle, tek düğme.
     2. HER GÖRSELİN CÜMLESİ VAR. `role="img"` + `aria-label` sayıyı söyler;
        ekranda görünen sayı da metin olarak durur.
     3. RENK ÖLÇÜYÜ AYIRIR. Vurgu modülün rengi (`--primary`); ikinci seri
        aynı rengin açığı. Kırmızı/yeşil yok; eşik aşımı turuncu (`--esp`)
        yalnız yönü bilinen eşikte (`yon`).
     4. HTML DÖNER, OLAY YOK. Düğmeler `data-act` taşır; işleyici modülde. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.PANO = (function(){
  const kac = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const sayiMi = x => typeof x === 'number' && isFinite(x);
  const yuz = x => Math.max(0, Math.min(100, Math.round(x * 1000) / 10));
  const veri = d => Object.keys(d || {}).map(k => ' ' + kac(k) + '="' + kac(d[k]) + '"').join('');

  const SIMGE = {
    uyku:'<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    su:'<path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
    ogun:'<path d="M7 3v7.5M5 3v5a2 2 0 0 0 4 0V3M7 10.5V21M17.5 3c-2 2-2.5 5-2.5 8h2.5v10"/>',
    hareket:'<path d="M3 12.5h4l2.5-6 4.5 12 2.5-6H21"/>',
    kalp:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    saat:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    tik:'<path d="M5 12l4.5 4.5L19 7"/>',
    cubuk:'<path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6"/>',
    egri:'<path d="M4 19V5M4 19h16"/><path d="M7 14l4-4 3 3 5-6"/>',
    satir:'<path d="M4 6h10M4 12h16M4 18h7"/>',
    blok:'<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    takvim:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
    kart:'<rect x="4" y="7" width="12.5" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v11"/>',
    harita:'<path d="M4 4h16v16H4zM4 10h16M10 4v16"/>',
    kitap:'<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    nota:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    kalem:'<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    merdiven:'<path d="M4 20h4v-4h4v-4h4V8h4"/>',
    zil:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    alev:'<path d="M12 3c1 3.6 5 5.6 5 10.2a5 5 0 0 1-10 0c0-2.6 1.5-3.9 2.6-5.1.3 1.6 1 2.6 2 3.1C11.6 8.2 12 5.8 12 3z"/>',
    hedef:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>',
    katman:'<path d="M12 3l8 4.5L12 12 4 7.5zM4 12l8 4.5 8-4.5"/>',
    yildiz:'<path d="M12 3l2.4 5.6L20 9.3l-4.3 3.9 1.3 5.8L12 16l-5 3 1.3-5.8L4 9.3l5.6-.7z"/>',
    klasor:'<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    bos:'<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/>',
  };
  const svg = (ad, cls) => '<svg class="' + (cls || 'pk__simge') + '" viewBox="0 0 24 24" aria-hidden="true">' + (SIMGE[ad] || SIMGE.bos) + '</svg>';

  /* ---------------------------------------------------------- kart
     o = { ad, simge, yuva, govde (html), ayak (html), bos:{ cumle, dugme:{ label, act, data } },
           id, cls, dugme:{ label, act, data } (başlıktaki küçük eylem) } */
  function dugmeHtml(d, cls){
    if(!d || !d.label) return '';
    return '<button type="button" class="' + (cls || 'pk__dugme') + '"' + (d.act ? ' data-act="' + kac(d.act) + '"' : '') + veri(d.data)
      + (d.aria ? ' aria-label="' + kac(d.aria) + '"' : '') + '>' + kac(d.label) + '</button>';
  }
  function kart(o){
    o = o || {};
    const bos = o.bos && !o.govde;
    return '<section class="pk' + (bos ? ' pk--bos' : '') + (o.cls ? ' ' + kac(o.cls) : '') + '"' + (o.id ? ' id="' + kac(o.id) + '"' : '')
      + ' data-pano="' + kac(o.tur || 'kart') + '" aria-label="' + kac(o.ad || '') + '">'
      + '<header class="pk__bas">' + svg(bos ? 'bos' : o.simge) + '<h3 class="pk__ad">' + kac(o.ad || '') + '</h3>'
      + (o.yuva != null && o.yuva !== '' ? '<span class="pk__yuva">' + kac(o.yuva) + '</span>' : '')
      + (o.dugme ? dugmeHtml(o.dugme, 'pk__basdugme') : '') + '</header>'
      + (bos
        ? '<div class="pk__govde pk__govde--bos"><p class="pk__boscumle">' + kac(o.bos.cumle || 'Henüz kayıt yok.') + '</p>'
          + (o.bos.dugme ? dugmeHtml(o.bos.dugme, 'pk__dugme pk__dugme--ikincil') : '') + '</div>'
        : '<div class="pk__govde">' + (o.govde || '') + '</div>')
      + (o.ayak && !bos ? '<footer class="pk__ayak">' + o.ayak + '</footer>' : '')
      + '</section>';
  }

  /* Büyük değer: «6 sa 30 dk», birim küçük. */
  function deger(d, birim, alt){
    return '<div class="pk__deger"><span class="pk__sayi">' + kac(d) + (birim ? '<small>' + kac(birim) + '</small>' : '') + '</span>'
      + (alt ? '<span class="pk__alt">' + kac(alt) + '</span>' : '') + '</div>';
  }
  const not = m => m ? '<p class="pk__not">' + kac(m) + '</p>' : '';

  /* ---------------------------------------------------------- halka
     { oran (0..1+, null: yalnız iz), boy, kalinlik, ic, etiket } */
  function halka(o){
    o = o || {};
    const boy = o.boy || 64, k = o.kalinlik || 6, r = (boy - k) / 2, c = 2 * Math.PI * r;
    const or = sayiMi(o.oran) ? Math.max(0, Math.min(1, o.oran)) : null;
    return '<svg class="pk-halka" width="' + boy + '" height="' + boy + '" viewBox="0 0 ' + boy + ' ' + boy + '"'
      + (o.etiket ? ' role="img" aria-label="' + kac(o.etiket) + '"' : ' aria-hidden="true"') + '>'
      + '<circle class="pk-halka__iz" cx="' + boy / 2 + '" cy="' + boy / 2 + '" r="' + r + '" stroke-width="' + k + '"/>'
      + (or ? '<circle class="pk-halka__dolu" cx="' + boy / 2 + '" cy="' + boy / 2 + '" r="' + r + '" stroke-width="' + k + '" stroke-dasharray="'
        + (c * or).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + boy / 2 + ' ' + boy / 2 + ')"/>' : '')
      + (o.ic != null ? '<text x="50%" y="50%" dy=".35em" text-anchor="middle" class="pk-halka__ic">' + kac(o.ic) + '</text>' : '')
      + '</svg>';
  }

  /* Yarım gösterge (toparlanma): { deger, en:100, etiket, bantlar:[ad,ad,ad], bant } */
  function gosterge(o){
    o = o || {};
    const en = o.en || 100, v = Math.max(0, Math.min(en, o.deger)), uz = Math.PI * 80;
    return '<div class="pk-gosterge"><svg viewBox="0 0 200 112" role="img" aria-label="' + kac(o.etiket || (o.deger + ' / ' + en)) + '">'
      + '<path class="pk-gosterge__iz" d="M20 100 A80 80 0 0 1 180 100"/>'
      + '<path class="pk-gosterge__dolu" d="M20 100 A80 80 0 0 1 180 100" stroke-dasharray="' + (uz * v / en).toFixed(1) + ' ' + uz.toFixed(1) + '"/>'
      + '<text x="100" y="86" text-anchor="middle" class="pk-gosterge__sayi">' + kac(o.deger) + '</text>'
      + '<text x="100" y="105" text-anchor="middle" class="pk-gosterge__en">/ ' + en + '</text></svg>'
      + (o.bantlar ? '<div class="pk-gosterge__bant">' + o.bantlar.map(b => '<span' + (b === o.bant ? ' class="is-on"' : '') + '>' + kac(b) + '</span>').join('') + '</div>' : '')
      + '</div>';
  }

  /* ---------------------------------------------------------- segment
     Küçük tam sayı hedef: { hedef, yapilan, etiket, sutun } (hedef ≤ 60) */
  function segment(o){
    o = o || {};
    const h = Math.max(0, Math.min(60, Math.floor(o.hedef || 0)));
    if(!h) return '';
    const y = sayiMi(o.yapilan) ? Math.max(0, Math.floor(o.yapilan)) : null;
    let s = '';
    for(let i = 0; i < h; i++) s += '<i class="' + (y != null && i < y ? 'is-dolu' : '') + '"></i>';
    const sr = (o.etiket ? o.etiket + ': ' : '') + (y == null ? 'veri yok, hedef ' + h : y + ' / ' + h + (y < h ? ', ' + (h - y) + ' kaldı' : ', tamam'));
    return '<div class="pk-segment' + (y == null ? ' is-yok' : '') + '" role="img" aria-label="' + kac(sr) + '" style="--sutun:' + Math.min(h, o.sutun || h) + '">' + s + '</div>';
  }

  /* ---------------------------------------------------------- eşik çubuğu
     { deger, esik, olcek, etiket, yon:'artis-iyi'|'azalis-iyi', metin } */
  function esik(o){
    o = o || {};
    if(!sayiMi(o.deger) || !sayiMi(o.esik)) return '';
    const ust = sayiMi(o.olcek) && o.olcek > 0 ? o.olcek : Math.max(o.deger, o.esik) * 1.25 || 1;
    const d = yuz(Math.min(o.deger, o.esik) / ust), e = yuz(o.esik / ust), a = o.deger > o.esik ? yuz(o.deger / ust) - e : 0;
    const asimKotu = a > 0 && o.yon === 'azalis-iyi';
    return '<div class="pk-esik" role="img" aria-label="' + kac(o.etiket || '') + '">'
      + '<span class="pk-esik__dolu" style="width:' + d + '%"></span>'
      + (a > 0 ? '<span class="pk-esik__asim' + (asimKotu ? ' is-kotu' : '') + '" style="left:' + e + '%;width:' + a + '%"></span>' : '')
      + '<span class="pk-esik__cizgi" style="left:' + e + '%"></span></div>';
  }

  /* ---------------------------------------------------------- sütunlar
     { degerler:[n|null|[a,b]], etiket, yukseklik, gunler:[ad] } — iç dizi yığın */
  function sutun(o){
    o = o || {};
    const l = o.degerler || [];
    const top = v => Array.isArray(v) ? v.reduce((a, b) => a + (b || 0), 0) : v;
    const en = Math.max(1e-9, ...l.filter(v => v != null).map(top));
    if(!l.some(v => v != null)) return '';
    const h = o.yukseklik || 44;
    const kol = (v, i) => {
      if(v == null) return '<span class="pk-sutun__k is-yok"></span>';
      const son = i === l.length - 1 ? ' is-son' : '';
      if(Array.isArray(v)) return '<span class="pk-sutun__k pk-sutun__k--yigin' + son + '">' + v.map((p, j) => p ? '<i class="pk-sutun__p' + j + '" style="height:' + yuz(p / en) + '%"></i>' : '').join('') + '</span>';
      return '<span class="pk-sutun__k' + son + '"><i style="height:' + Math.max(4, yuz(v / en)) + '%"></i></span>';
    };
    return '<div class="pk-sutun" style="--h:' + h + 'px" role="img" aria-label="' + kac(o.etiket || '') + '">' + l.map(kol).join('') + '</div>'
      + (o.gunler ? '<div class="pk-sutun__ad">' + o.gunler.map(g => '<span>' + kac(g) + '</span>').join('') + '</div>' : '');
  }

  /* ---------------------------------------------------------- yığılmış çubuk
     { parcalar:[{ ad, deger, metin }], etiket } — sıra renk sırası */
  function yigin(o){
    o = o || {};
    const p = (o.parcalar || []).filter(x => sayiMi(x.deger) && x.deger > 0);
    if(!p.length) return '';
    return '<div class="pk-yigin" role="img" aria-label="' + kac(o.etiket || p.map(x => x.ad + ' ' + (x.metin || x.deger)).join(', ')) + '">'
      + p.map((x, i) => '<span class="pk-renk' + i + '" style="flex:' + x.deger + '"></span>').join('') + '</div>'
      + '<div class="pk-lejant">' + p.map((x, i) => '<span><i class="pk-renk' + i + '"></i>' + kac(x.ad) + (x.metin ? ' <b>' + kac(x.metin) + '</b>' : '') + '</span>').join('') + '</div>';
  }

  /* ---------------------------------------------------------- satır çubukları
     { satirlar:[{ ad, oran (0..1), plan (0..1), metin, renk:0|1|2|'n' }], etiket } */
  function cubuklar(o){
    o = o || {};
    const s = (o.satirlar || []);
    if(!s.length) return '';
    return '<div class="pk-cubuklar" role="img" aria-label="' + kac(o.etiket || s.map(x => x.ad + ' ' + (x.metin || '')).join(', ')) + '">'
      + s.map(x => '<div class="pk-cubuklar__s"><span class="pk-cubuklar__ad">' + kac(x.ad) + '</span>'
        + '<span class="pk-cubuklar__iz">' + (sayiMi(x.oran) ? '<i class="pk-renk' + (x.renk == null ? 0 : x.renk) + '" style="width:' + yuz(x.oran) + '%"></i>' : '')
        + (sayiMi(x.plan) ? '<b style="left:' + yuz(x.plan) + '%"></b>' : '') + '</span>'
        + '<span class="pk-cubuklar__m">' + kac(x.metin == null ? '—' : x.metin) + '</span></div>').join('') + '</div>';
  }

  /* ---------------------------------------------------------- kareler
     { durumlar:['dolu'|'yarim'|'bos'|'yok'|'donmus'|'bugun'|0..3], sutun, etiket, boy } */
  function kareler(o){
    o = o || {};
    const l = o.durumlar || [];
    if(!l.length) return '';
    return '<div class="pk-kare' + (o.kucuk ? ' pk-kare--kucuk' : '') + '" style="--sutun:' + (o.sutun || l.length) + '" role="img" aria-label="' + kac(o.etiket || '') + '">'
      + l.map(d => '<i class="' + (typeof d === 'number' ? 'is-s' + Math.max(0, Math.min(3, d)) : 'is-' + kac(d)) + '"></i>').join('') + '</div>';
  }
  /* Isı: değerler → 0..3 seviye (en büyüğe göre); null → kayıt yok. */
  function isi(o){
    o = o || {};
    const l = o.degerler || [];
    const en = Math.max(1e-9, ...l.filter(sayiMi));
    return kareler({ sutun:o.sutun || 7, etiket:o.etiket, durumlar:l.map(v => v == null ? 'yok' : v <= 0 ? 0 : Math.max(1, Math.ceil(v / en * 3))) });
  }

  /* ---------------------------------------------------------- gün çizgisi
     { noktalar:[{ ad, yer (0..1), dolu }], etiket } — öğünler, bloklar */
  function cizgi(o){
    o = o || {};
    const n = o.noktalar || [];
    if(!n.length) return '';
    return '<div class="pk-cizgi" role="img" aria-label="' + kac(o.etiket || n.map(x => x.ad + (x.dolu ? ' girildi' : ' bekliyor')).join(', ')) + '"><span class="pk-cizgi__ray"></span>'
      + n.map(x => '<span class="pk-cizgi__n' + (x.dolu ? ' is-dolu' : '') + '" style="left:' + yuz(x.yer) + '%"><i></i><small>' + kac(x.ad) + '</small></span>').join('') + '</div>';
  }

  /* Süreyle orantılı şerit: { parcalar:[{ ad, sure, durum:'bitti'|'simdi'|'sira' }], etiket } */
  function serit(o){
    o = o || {};
    const p = (o.parcalar || []).filter(x => sayiMi(x.sure) && x.sure > 0);
    if(!p.length) return '';
    return '<div class="pk-serit" role="img" aria-label="' + kac(o.etiket || p.map(x => x.ad + ' ' + x.durum).join(', ')) + '">'
      + p.map(x => '<span class="is-' + kac(x.durum || 'sira') + '" style="flex:' + x.sure + '">' + kac(x.ad) + '</span>').join('') + '</div>';
  }

  /* Liste: { satirlar:[{ sol, ad, not, nokta (0..2|'n'), cizik }] } */
  function liste(o){
    o = o || {};
    const s = o.satirlar || [];
    if(!s.length) return '';
    return '<ul class="pk-liste">' + s.map(x => '<li><span class="pk-liste__sol">' + kac(x.sol || '') + '</span>'
      + (x.nokta != null ? '<i class="pk-renk' + kac(x.nokta) + '"></i>' : '<i class="is-gizli"></i>')
      + '<span class="pk-liste__ad">' + kac(x.ad) + '</span><span class="pk-liste__not">' + kac(x.not || '') + '</span></li>').join('') + '</ul>';
  }

  /* Önce → sonra (öneri): { once, sonra, not } */
  function onceSonra(o){
    o = o || {};
    return '<div class="pk-oncesonra">' + (o.once != null ? '<s>' + kac(o.once) + '</s><span aria-hidden="true">→</span>' : '')
      + '<b>' + kac(o.sonra) + '</b>' + (o.not ? '<small>' + kac(o.not) + '</small>' : '') + '</div>';
  }

  /* Izgara: kartları yan yana diz (ekran genişliğine göre 1–3 sütun). */
  function izgara(kartlar, cls){
    const l = (kartlar || []).filter(Boolean);
    return l.length ? '<div class="pk-izgara' + (cls ? ' ' + kac(cls) : '') + '">' + l.join('') + '</div>' : '';
  }

  /* ---------------------------------------------------------- hedef kartları
     Ortak hedef kaydı (brand/ortak/hedef.js): cümle, oluşturma ve son tarih,
     varsa şu anki değer (`simdi`) ile hedef değer. Zaman çubuğu geçen günün
     payıdır (hesaplandı); değer bilinmiyorsa yalnız zaman çizilir. */
  const GUN = 86400000;
  const tarihOku = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const sayiTr = x => String(Math.round(x * 100) / 100).replace('.', ',');
  function hedefKarti(h, bugun){
    const b = tarihOku(h.olusturma), s = tarihOku(h.son_tarih), t = tarihOku(bugun);
    const ad = String(h.cumle || 'Hedef').replace(/\s+/g, ' ').trim();
    let govde = '';
    if(h.simdi && sayiMi(h.simdi.deger) && sayiMi(h.hedefDeger)){
      govde += deger(sayiTr(h.simdi.deger), h.birim || '', 'hedef ' + sayiTr(h.hedefDeger) + (h.birim ? ' ' + h.birim : ''));
    }
    let yuva = '';
    if(b && s && t && s > b){
      const top = Math.round((s - b) / GUN), gecen = Math.max(0, Math.min(top, Math.round((t - b) / GUN)));
      const kalan = Math.round((s - t) / GUN);
      yuva = kalan >= 0 ? s.getDate() + ' ' + AY[s.getMonth()] + '’e ' + kalan + ' gün' : 'süresi geçti';
      govde += esik({ deger:gecen, esik:gecen, olcek:top, etiket:'Sürenin ' + top + ' gününden ' + gecen + '’i geçti' })
        + not('süre · ' + gecen + ' / ' + top + ' gün geçti');
    }else{
      govde += not(s ? 'son tarih ' + s.getDate() + ' ' + AY[s.getMonth()] : 'son tarihi yok');
    }
    return kart({ tur:'hedef', ad, simge:'hedef', yuva:yuva || (h.durum === 'askida' ? 'askıda' : ''), govde });
  }
  function hedefIzgara(liste, bugun){
    const l = (liste || []).slice(0, 3);
    return l.length ? izgara(l.map(h => hedefKarti(h, bugun))) : '';
  }

  return { SIMGE, svg, kart, deger, not, halka, gosterge, segment, esik, sutun, yigin, cubuklar, kareler, isi, cizgi, serit, liste, onceSonra, izgara, dugmeHtml,
    hedefKarti, hedefIzgara };
})();
