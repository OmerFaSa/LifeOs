/* Tek sözlük — 016 terim ipucu, 139 model kapalı kipi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sozluk.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kural (ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
   satırıdır ve test adında özelliğin numarası geçer (`oz-016 …`). */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const Z = () => window.LIFEOS.SOZLUK;

  function sahne(markup){
    const k = document.createElement('div');
    k.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px';
    k.innerHTML = markup;
    document.body.appendChild(k);
    return k;
  }
  const bekle = ms => new Promise(r => setTimeout(r, ms));

describe('016 · Terim ipucu', () => {

  it('oz-016 Sistem terimleri tek sözlükten gelir; aynı terim her ekranda aynı tanımı gösterir.', () => {
    /* İki ayrı yerde çizilen aynı terim aynı tanımı taşır ve tanım
       sözlüğün kendisidir; üç arayüz aynı dosyayı yükler (ortak.py). */
    const k = sahne('<p>' + Z().html('tekrar-borcu') + '</p><p>' + Z().html('tekrar-borcu', 'tekrar borcunu') + '</p>');
    try{
      const t = k.querySelectorAll('.terim');
      expect(t).toHaveLength(2);
      const tanim = Array.prototype.map.call(t, el => el.querySelector('.terim__tanim').textContent);
      expect(tanim[0]).toBe(tanim[1]);
      expect(tanim[0]).toBe(Z().TERIMLER['tekrar-borcu'].tanim);
      expect(t[0].getAttribute('data-oz')).toBe('016');
      /* Çekimli yazı ekranda, terimin adı kartta. */
      expect(t[1].firstChild.textContent).toBe('tekrar borcunu');
      expect(t[1].querySelector('.terim__ad').textContent).toBe('Tekrar borcu');
    }finally{ k.remove(); }
    expect(Object.isFrozen(Z().TERIMLER)).toBeTruthy();
    expect(Object.isFrozen(Z().TERIMLER.net)).toBeTruthy();
  });

  it('oz-016 her tanım TEK cümledir ve kaynağını taşır', () => {
    Object.keys(Z().TERIMLER).forEach(id => {
      const t = Z().TERIMLER[id];
      expect(t.terim.length > 0).toBeTruthy();
      expect(/\.$/.test(t.tanim)).toBeTruthy();
      expect(t.tanim.indexOf('. ') < 0).toBeTruthy();
      expect(t.kaynak.length > 0).toBeTruthy();
    });
  });

  it('oz-016 kesinlik etiketlerinin tanımı kesinlik.js’ten okunur, ikinci kez yazılmaz', () => {
    expect(Z().bul('veri-yok').tanim).toBe(window.LIFEOS.KESINLIK_ILE('missing').ozet);
    expect(Z().bul('olculdu').terim).toBe('Ölçüldü');
    expect(Z().hepsi().length).toBe(Object.keys(Z().TERIMLER).length + 4);
  });

  it('oz-016 bilinmeyen terime tanım UYDURULMAZ: yazı düz kalır ve işaretlenir', () => {
    const h = Z().html('uydurma-terim', 'uydurma');
    expect(h).toContain('data-terim-yok="uydurma-terim"');
    expect(h.indexOf('role="tooltip"') < 0).toBeTruthy();
    expect(Z().bul('uydurma-terim')).toBeNull();
    expect(Z().bul(null)).toBeNull();
  });

  it('oz-016 terimin altı noktalı; kart kapalı başlar, açılınca görünür', () => {
    const k = sahne(Z().html('net'));
    try{
      const t = k.querySelector('.terim'), kart = k.querySelector('.terim__kart');
      expect(getComputedStyle(t).textDecorationStyle).toBe('dotted');
      expect(getComputedStyle(kart).display).toBe('none');
      t.classList.add('terim--acik');
      expect(getComputedStyle(kart).display).toBe('grid');
      expect(t.getAttribute('aria-describedby')).toBe(kart.id);
      expect(t.getAttribute('tabindex')).toBe('0');
    }finally{ k.remove(); }
  });

  it('oz-016 dokunmatikte basılı tutmak açar, başka yere dokunmak kapatır (köken kartıyla aynı)', async () => {
    const k = sahne(Z().html('seri') + '<i class="bos">x</i>');
    try{
      expect(Z().bagla(k)).toBeTruthy();
      expect(Z().bagla(k)).toBeFalsy();
      const t = k.querySelector('.terim');
      t.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch' }));
      await bekle(Z().BASILI_MS + 60);
      expect(t.classList.contains('terim--acik')).toBeTruthy();
      k.querySelector('.bos').dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'touch' }));
      expect(t.classList.contains('terim--acik')).toBeFalsy();
      expect(Z().BASILI_MS).toBe(window.LIFEOS.SAYI.BASILI_MS);
    }finally{ k.remove(); }
  });
});

describe('139 · Model kapalı kipi', () => {

  it('oz-139 Dil modeli kapalıyken ajanlar hazır cümlelerle konuşur ve bunu etiketler; hiçbir ekran kapanmaz.', () => {
    const c = Z().hazir('Tekrar borcu %{borc}; eşik %{esik}.', { borc:34, esik:10 });
    expect(c.metin).toBe('Tekrar borcu %34; eşik %10.');
    expect(c.kaynak).toBe('kural');
    const k = sahne(Z().seritHtml({ acik:false }) + Z().hazirHtml(c));
    try{
      const s = k.querySelector('.modelsiz');
      expect(s.getAttribute('data-oz')).toBe('139');
      expect(s.getAttribute('role')).toBe('status');
      expect(s.querySelector('.modelsiz__bas').textContent).toBe('Dil modeli kapalı');
      const h = k.querySelector('.hazir');
      expect(h.getAttribute('data-kaynak')).toBe('kural');
      expect(h.querySelector('.hazir__etiket').textContent).toBe('hazır cümle');
    }finally{ k.remove(); }
    /* Model açıkken şerit yok; boş girdide hiçbir işlev kırılmaz. */
    expect(Z().seritHtml({ acik:true })).toBe('');
    expect(typeof Z().seritHtml()).toBe('string');
    expect(Z().hazirHtml(null)).toBe('');
    expect(Z().hazir(null).metin).toBe('');
  });

  it('oz-139 değeri olmayan yer «—» olur; «undefined», «null», «NaN» ekrana çıkmaz', () => {
    const c = Z().hazir('Uyku {saat} saat, hedef {hedef} saat.', { saat:null, hedef:7.5 });
    expect(c.metin).toBe('Uyku — saat, hedef 7,5 saat.');
    expect(c.eksik).toEqual(['saat']);
    const d = Z().hazir('{a} {b} {c}', { a:undefined, b:NaN });
    expect(/undefined|null|NaN/.test(d.metin)).toBeFalsy();
    expect(d.eksik).toEqual(['a', 'b', 'c']);
  });

  it('oz-139 şerit nedeni yalnız verilirse yazar; neden uydurulmaz', () => {
    expect(Z().seritHtml({ acik:false, neden:'kota doldu' })).toContain('Neden: kota doldu.');
    expect(Z().seritHtml({ acik:false }).indexOf('Neden') < 0).toBeTruthy();
  });
});

})();
