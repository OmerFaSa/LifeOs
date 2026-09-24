/* Sayı bileşeni — 024 kesinlik, 025 köken, 026 tazelik, 028 anlamlı fark.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sayi.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kural (ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
   satırıdır ve test adında özelliğin numarası geçer (`oz-024 …`).
   H'nin envanteri B katmanındaki özellikleri bu adlardan sayar. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const S = () => window.LIFEOS.SAYI;

  /* Sabit «şimdi»: testler takvime bağlı kalmaz. Yerel saatle kurulur;
     kosucu Europe/Istanbul'da açar. */
  const SIMDI = new Date(2026, 8, 24, 14, 10);
  const gunOnce = n => {
    const d = new Date(2026, 8, 24 - n, 9, 30);
    return d.toISOString();
  };

  /* Markupı gerçekten sayfaya koyar: biçim (`kart.css`) ancak böyle
     ölçülür. Her test kendi kutusunu kaldırır. */
  function sahne(markup){
    const k = document.createElement('div');
    k.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px';
    k.innerHTML = markup;
    document.body.appendChild(k);
    return k;
  }
  const bekle = ms => new Promise(r => setTimeout(r, ms));

describe('024 · Kesinlik glifleri — sayı bileşeni', () => {

  it('oz-024 Ekrandaki her sayı brand/ortak/kesinlik ile işaretli; «veri yok» olan sayı hiçbir yerde 0 olarak çizilmez.', () => {
    ['measured', 'estimated', 'computed'].forEach(k => {
      const h = S().html({ deger:268, birim:'gün', kesinlik:k });
      expect(h).toContain('data-kesinlik="' + k + '"');
      expect(h).toContain('data-oz="024"');
      expect(h.indexOf('data-etiketsiz') < 0).toBeTruthy();
    });
    /* 0 değer taşıyan bir «veri yok» kaydı bile 0 çizilmez. */
    const yok = S().html({ deger:0, birim:'saat', kesinlik:'missing' });
    expect(yok).toContain('data-kesinlik="missing"');
    expect(yok).toContain('—');
    expect(/>0</.test(yok)).toBeFalsy();
    expect(S().metin({ deger:0, kesinlik:'missing' })).toBe('—');
  });

  it('oz-024 değeri olmayan sayı (null, NaN, boş dize) etiketi ne olursa olsun «—» yazar', () => {
    [null, undefined, NaN, Infinity, ''].forEach(v => {
      const h = S().html({ deger:v, kesinlik:'measured' });
      expect(h).toContain('sayi--missing');
      expect(h).toContain('—');
    });
  });

  it('oz-024 gerçek sıfır ölçülmüşse 0 YAZILIR — yokluk ile sıfır ayrı şeydir', () => {
    const h = S().html({ deger:0, birim:'soru', kesinlik:'measured' });
    expect(h).toContain('>0<');
    expect(h).toContain('sayi--measured');
  });

  it('oz-024 yalnız TAHMİN olan sayının altı kesik çizilir; ölçüldü ve hesaplandı düz', () => {
    const k = sahne(['measured', 'estimated', 'computed'].map(x =>
      S().html({ deger:12, kesinlik:x }, { koken:false })).join(' '));
    try{
      const d = Array.prototype.map.call(k.querySelectorAll('.sayi__d'),
        el => getComputedStyle(el).textDecorationLine + '/' + getComputedStyle(el).textDecorationStyle);
      expect(d[0].indexOf('underline') < 0).toBeTruthy();
      expect(d[1]).toBe('underline/dashed');
      expect(d[2].indexOf('underline') < 0).toBeTruthy();
    }finally{ k.remove(); }
  });

  it('oz-024 tahmin aralığıyla birlikte yazılır', () => {
    const h = S().html({ deger:268, birim:'gün', kesinlik:'estimated', aralik:[250, 290] });
    expect(h).toContain('sayi__ar');
    expect(h).toContain('250–290');
    /* Ölçülen sayıya aralık EKLENMEZ: aralık belirsizliğin işaretidir. */
    expect(S().html({ deger:82, kesinlik:'measured', aralik:[80, 84] }).indexOf('sayi__ar') < 0).toBeTruthy();
  });

  it('oz-024 etiketsiz sayı SAKLANMAZ ama işaretlenir; etiketsizler() onu bulur', () => {
    const h = S().html({ deger:432 });
    expect(h).toContain('432');
    expect(h).toContain('data-etiketsiz="1"');
    const k = sahne(h + S().html({ deger:1, kesinlik:'measured' }));
    try{ expect(S().etiketsizler(k)).toHaveLength(1); }finally{ k.remove(); }
  });

  it('oz-024 bilinmeyen kesinlik kimliğine karşılık uydurulmaz: etiketsiz sayılır', () => {
    const h = S().html({ deger:5, kesinlik:'kesin-gibi' });
    expect(h).toContain('data-etiketsiz="1"');
  });

  it('oz-024 cert ve certainty adları da okunur (modül ve HKM gövdesi)', () => {
    expect(S().html({ deger:1, cert:'computed' })).toContain('sayi--computed');
    expect(S().html({ deger:1, certainty:'estimated' })).toContain('sayi--estimated');
  });

  it('oz-024 ekran okuyucu kesinliği de duyar', () => {
    expect(S().html({ deger:7.5, birim:'saat', kesinlik:'estimated' }, { koken:false }))
      .toContain('<span class="sr-only">, tahmin</span>');
    expect(S().html({ deger:null, kesinlik:'missing' }, { koken:false }))
      .toContain('<span class="sr-only">, veri yok</span>');
  });

  it('oz-024 kutu glifi VAR OLAN sayıların en zayıfıdır; hiçbiri yoksa «veri yok»', () => {
    const k = S().kutuKesinligi;
    expect(k([{ deger:1, kesinlik:'measured' }, { deger:2, kesinlik:'computed' }])).toBe('computed');
    expect(k([{ deger:1, kesinlik:'measured' }, { deger:2, kesinlik:'estimated' },
      { deger:null, kesinlik:'missing' }])).toBe('estimated');
    expect(k([{ deger:null, kesinlik:'missing' }])).toBe('missing');
    expect(k([])).toBe('missing');
    expect(k(['measured', 'computed'])).toBe('computed');
    expect(S().kutuGlifi(['measured', 'estimated'])).toContain('kesinlik--estimated');
  });

  it('oz-024 düz metin etiketi yazıda taşır: «268 gün (tahmin)»', () => {
    expect(S().metin({ deger:268, birim:'gün', kesinlik:'estimated' })).toBe('268 gün (tahmin)');
    expect(S().metin({ deger:82, kesinlik:'measured' })).toBe('82');
    expect(S().metin({ deger:34, birim:'%', kesinlik:'computed' })).toBe('%34 (hesaplandı)');
  });

  it('oz-024 Türkçe yazım: ondalık virgül, binlik nokta, yüzde önde', () => {
    expect(S().bicim(1243)).toBe('1.243');
    expect(S().bicim(7.5)).toBe('7,5');
    expect(S().bicim(7.456, 2)).toBe('7,46');
    expect(S().html({ deger:34, birim:'%', kesinlik:'computed' })).toContain('>%34<');
  });

  it('oz-024 markup kaçışlıdır: birimdeki < > ekrana kod olarak girmez', () => {
    const h = S().html({ deger:1, birim:'<b>', kesinlik:'measured' });
    expect(h.indexOf('<b>') < 0).toBeTruthy();
    expect(h).toContain('&lt;b&gt;');
  });
});

describe('025 · Köken kartı', () => {

  it('oz-025 Hesaplanan her sayının üzerine gelince formül, girdiler ve hesap saati görünür; ölçülen sayıda kaynak ve ölçüm saati.', () => {
    const h = S().koken({ deger:82, kesinlik:'computed', formul:'doğru − yanlış ÷ 4',
      girdiler:[{ ad:'doğru', deger:90, kesinlik:'measured' }, { ad:'yanlış', deger:32, kesinlik:'measured' }],
      zaman:SIMDI.toISOString() }, { simdi:SIMDI });
    expect(h.satirlar.map(r => r.ad).join(',')).toBe('Formül,Girdiler,Hesap');
    expect(h.satirlar[0].deger).toBe('doğru − yanlış ÷ 4');
    expect(h.satirlar[1].deger).toBe('doğru: 90 (ölçüldü) · yanlış: 32 (ölçüldü)');
    expect(h.satirlar[2].deger).toBe('bugün 14:10');
    expect(h.eksik).toHaveLength(0);

    const o = S().koken({ deger:71.4, kesinlik:'measured', kaynak:'Tartı · elle giriş',
      zaman:gunOnce(1) }, { simdi:SIMDI });
    expect(o.satirlar.map(r => r.ad).join(',')).toBe('Kaynak,Ölçüm');
    expect(o.satirlar[0].deger).toBe('Tartı · elle giriş');
    expect(o.satirlar[1].deger).toBe('dün 09:30');
  });

  it('oz-025 eksik köken alanı uydurulmaz: «kayıtlı değil» yazar ve eksik listesine girer', () => {
    const k = S().koken({ deger:3, kesinlik:'computed' }, { simdi:SIMDI });
    expect(k.satirlar[0].deger).toBe('kayıtlı değil');
    expect(k.eksik.join(',')).toBe('formul,girdiler,zaman');
  });

  it('oz-025 tahminin kartı aralığı ve dayanağı söyler; veri yokun kartı yokluğu', () => {
    const t = S().koken({ deger:268, birim:'gün', kesinlik:'estimated', kaynak:'deneme hızı',
      aralik:[250, 290], dayanak:6 }, { simdi:SIMDI });
    expect(t.baslik).toBe('Tahmin');
    expect(t.satirlar.map(r => r.ad + '=' + r.deger).join(' | '))
      .toBe('Kaynak=deneme hızı | Aralık=250–290 gün | Dayanak=6 veri');
    const y = S().koken({ kesinlik:'missing' });
    expect(y.baslik).toBe('Veri yok');
    expect(y.satirlar[0].deger).toContain('Sıfır değil');
  });

  it('oz-025 kart sayıya bağlıdır: aria-describedby kartın kimliğini gösterir', () => {
    const k = sahne(S().html({ deger:1, kesinlik:'measured', kaynak:'x', zaman:'2026-09-24' }));
    try{
      const s = k.querySelector('.sayi');
      const kart = k.querySelector('.koken');
      expect(kart.getAttribute('role')).toBe('tooltip');
      expect(kart.getAttribute('data-oz')).toBe('025');
      expect(s.getAttribute('aria-describedby')).toBe(kart.id);
      expect(s.getAttribute('tabindex')).toBe('0');
    }finally{ k.remove(); }
  });

  it('oz-025 kart kapalı başlar, açılınca görünür (kart.css)', () => {
    const k = sahne(S().html({ deger:1, kesinlik:'measured' }));
    try{
      const s = k.querySelector('.sayi'), kart = k.querySelector('.koken');
      expect(getComputedStyle(kart).display).toBe('none');
      s.classList.add('sayi--acik');
      expect(getComputedStyle(kart).display).toBe('grid');
    }finally{ k.remove(); }
  });

  it('oz-025 dokunmatikte basılı tutmak kartı açar; başka yere dokunmak kapatır', async () => {
    const k = sahne(S().html({ deger:1, kesinlik:'measured' }) + '<i class="bos">x</i>');
    try{
      expect(S().bagla(k)).toBeTruthy();
      expect(S().bagla(k)).toBeFalsy();   // ikinci bağlama yok sayılır
      const s = k.querySelector('.sayi');
      s.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch' }));
      await bekle(S().BASILI_MS + 60);
      expect(s.classList.contains('sayi--acik')).toBeTruthy();
      k.querySelector('.bos').dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch' }));
      expect(s.classList.contains('sayi--acik')).toBeFalsy();
    }finally{ k.remove(); }
  });

  it('oz-025 Esc açık kartı kapatır', async () => {
    /* Kendi belgesinde sınanır: test sayfasında başka bir katman (perde)
       Esc'yi yakalama aşamasında alabilir — üstteki katmanın önce
       kapanması doğru davranıştır, ama bu testin konusu değildir. */
    const f = document.createElement('iframe');
    f.style.cssText = 'position:absolute;left:-9999px;width:400px;height:200px';
    f.srcdoc = '<!doctype html><body><script src="../js/core/kesinlik.js"><\/script>'
      + '<script src="../js/core/sayi.js"><\/script></body>';
    const yuklendi = new Promise(r => f.addEventListener('load', r, { once:true }));
    document.body.appendChild(f);
    try{
      await yuklendi;
      const w = f.contentWindow, d = f.contentDocument;
      d.body.innerHTML = w.LIFEOS.SAYI.html({ deger:1, kesinlik:'measured' });
      w.LIFEOS.SAYI.bagla(d);
      const s = d.querySelector('.sayi');
      s.dispatchEvent(new w.PointerEvent('pointerdown', { bubbles:true, pointerType:'touch' }));
      await bekle(w.LIFEOS.SAYI.BASILI_MS + 60);
      expect(s.classList.contains('sayi--acik')).toBeTruthy();
      d.dispatchEvent(new w.KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(s.classList.contains('sayi--acik')).toBeFalsy();
    }finally{ f.remove(); }
  });

  it('oz-025 kısa dokunuş kartı AÇMAZ (kaydırma ile basılı tutma ayrılır)', async () => {
    const k = sahne(S().html({ deger:1, kesinlik:'measured' }));
    try{
      S().bagla(k);
      const s = k.querySelector('.sayi');
      s.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch' }));
      s.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, pointerType:'touch' }));
      await bekle(S().BASILI_MS + 60);
      expect(s.classList.contains('sayi--acik')).toBeFalsy();
    }finally{ k.remove(); }
  });

  it('oz-025 { koken:false } yoğun tabloda kartı ve odak durağını koymaz', () => {
    const h = S().html({ deger:1, kesinlik:'measured' }, { koken:false });
    expect(h.indexOf('koken') < 0).toBeTruthy();
    expect(h.indexOf('tabindex') < 0).toBeTruthy();
  });
});

describe('026 · Veri tazeliği', () => {

  it('oz-026 Ölçümün yaşı eşiği geçince değer soluklaşır ve yaşını gün olarak yazar; eşik kodda tek yerde tanımlı.', () => {
    const esik = S().TAZELIK.gunluk;
    const bayat = S().html({ deger:71.4, birim:'kg', kesinlik:'measured', zaman:gunOnce(12),
      tazelik:'gunluk' }, { simdi:SIMDI, koken:false });
    expect(bayat).toContain('sayi--bayat');
    expect(bayat).toContain('12 gün önce');
    expect(bayat).toContain('data-oz="026"');
    const taze = S().html({ deger:71.4, birim:'kg', kesinlik:'measured', zaman:gunOnce(esik - 1),
      tazelik:'gunluk' }, { simdi:SIMDI, koken:false });
    expect(taze.indexOf('sayi--bayat') < 0).toBeTruthy();
    expect(S().tazelik(gunOnce(esik), 'gunluk', SIMDI).bayat).toBeTruthy();
    expect(Object.isFrozen(S().TAZELIK)).toBeTruthy();
  });

  it('oz-026 tahlil eşiği SPİ audit.js TAHLIL_ESKI_GUN ile aynıdır (180)', () => {
    /* İki eşik ayrışırsa aynı tahlil bir ekranda «eski», öbüründe taze
       görünür. audit.js sabiti kapalı bir kapsamda; sayı burada tutulur. */
    expect(S().TAZELIK.tahlil).toBe(180);
  });

  it('oz-026 türü yazılmamış sayıya eşik uydurulmaz: soluklaşmaz', () => {
    const t = S().tazelik(gunOnce(400), null, SIMDI);
    expect(t.bayat).toBeFalsy();
    expect(t.esik).toBeNull();
    expect(t.metin).toBe('400 gün önce');
    expect(S().tazelik(gunOnce(400), 'uydurma', SIMDI).esik).toBeNull();
  });

  it('oz-026 yaş TAKVİM günüyle sayılır: dün 23:50 → bugün 00:10 «dün»', () => {
    const gece = new Date(2026, 8, 23, 23, 50);
    const sabah = new Date(2026, 8, 24, 0, 10);
    expect(S().yas(gece.toISOString(), sabah)).toBe(1);
    expect(S().yasMetni(S().yas(gece.toISOString(), sabah))).toBe('dün');
    expect(S().yas('2026-09-24', sabah)).toBe(0);
    expect(S().yasMetni(0)).toBe('bugün');
  });

  it('oz-026 ileri tarihli ölçüm «bugün» diye gizlenmez', () => {
    expect(S().yasMetni(S().yas('2026-09-30', SIMDI))).toBe('ileri tarihli');
    expect(S().tazelik('2026-09-30', 'gunluk', SIMDI).bayat).toBeFalsy();
  });

  it('oz-026 soluk değer kart.css\'te sönük renge düşer', () => {
    const k = sahne(S().html({ deger:1, kesinlik:'measured', zaman:gunOnce(30), tazelik:'gunluk' },
      { simdi:SIMDI, koken:false }) + S().html({ deger:1, kesinlik:'measured' }, { koken:false }));
    try{
      const [a, b] = k.querySelectorAll('.sayi__d');
      expect(getComputedStyle(a).color === getComputedStyle(b).color).toBeFalsy();
    }finally{ k.remove(); }
  });
});

describe('028 · Anlamlı fark rozeti', () => {

  it('oz-028 Fark rozetinin rengi metriğin yön tanımından gelir; aynı işaret farklı metrikte farklı renk alabilir.', () => {
    const Y = S().YON;
    const net = S().fark({ deger:3, yon:Y.ARTIS_IYI, ek:'önceki denemeden' });
    const borc = S().fark({ deger:41, yon:Y.AZALIS_IYI, ek:'dünden' });
    expect(net.anlam).toBe('iyi');
    expect(borc.anlam).toBe('kotu');
    expect(net.metin).toBe('+3 önceki denemeden');
    expect(borc.metin).toBe('+41 dünden');
    expect(S().fark({ deger:-2, yon:Y.AZALIS_IYI }).anlam).toBe('iyi');
    expect(S().fark({ deger:-2, yon:Y.ARTIS_IYI }).anlam).toBe('kotu');
  });

  it('oz-028 yönü yazılmamış metrikte renk YOK: artışın iyi mi kötü mü olduğu uydurulmaz', () => {
    expect(S().fark({ deger:41 }).anlam).toBe('notr');
    expect(S().fark({ deger:41, yon:S().YON.NOTR }).anlam).toBe('notr');
  });

  it('oz-028 eşiğin altındaki fark anlamlı sayılmaz', () => {
    const f = S().fark({ deger:0.4, esik:1, yon:S().YON.ARTIS_IYI, ondalik:1 });
    expect(f.anlam).toBe('notr');
    expect(f.metin).toBe('+0,4');
  });

  it('oz-028 sıfır fark «değişmedi», olmayan fark «—»', () => {
    expect(S().fark({ deger:0, yon:S().YON.ARTIS_IYI }).metin).toBe('değişmedi');
    const y = S().fark({ deger:null, ek:'önceki denemeden' });
    expect(y.metin).toBe('—');
    expect(y.anlam).toBe('yok');
  });

  it('oz-028 eksi işareti gerçek eksi (U+2212), yüzde önde', () => {
    expect(S().fark({ deger:-5, birim:'dk' }).metin).toBe('−5 dk');
    expect(S().fark({ deger:2.5, birim:'%', ondalik:1 }).metin).toBe('+%2,5');
  });

  it('oz-028 ekran okuyucu yönü duyar', () => {
    expect(S().fark({ deger:41, yon:S().YON.AZALIS_IYI, ek:'dünden' }).sr).toBe('dünden 41 arttı, kötü yönde');
    const h = S().farkHtml({ deger:3, yon:S().YON.ARTIS_IYI });
    expect(h).toContain('data-oz="028"');
    expect(h).toContain('fark--iyi');
    expect(h).toContain('<span class="sr-only">3 arttı, iyi yönde</span>');
  });

  it('oz-028 yön rengi T\'nin yön jetonundan: kötü --bad-ink, iyi --ok-ink, yönsüz nötr', () => {
    const Y = S().YON;
    const k = sahne(S().farkHtml({ deger:41, yon:Y.AZALIS_IYI }) + S().farkHtml({ deger:3, yon:Y.ARTIS_IYI })
      + S().farkHtml({ deger:3 }));
    try{
      const renk = v => {
        const ref = document.createElement('span');
        ref.style.color = v;
        k.appendChild(ref);
        return getComputedStyle(ref).color;
      };
      const [kotu, iyi, notr] = Array.prototype.map.call(k.querySelectorAll('.fark'), el => getComputedStyle(el).color);
      expect(kotu).toBe(renk('var(--bad-ink)'));
      expect(iyi).toBe(renk('var(--ok-ink)'));
      expect(notr).toBe(renk('var(--text-3)'));
      expect(iyi === kotu).toBeFalsy();
    }finally{ k.remove(); }
  });
});

})();
