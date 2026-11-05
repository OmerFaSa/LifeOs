/* Kullanım kılavuzu: anlattığı yollar gerçek menüde var mı, üç kapıdan açılıyor mu? */
(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;

describe('Kullanım kılavuzu', () => {
  const L = window.LIFEOS, P = L.PARCA, KL = L.KILAVUZ, K = L.KABUK;
  const m = KL.modul();
  const ns = { ays:window.R, spi:window.SP, esp:window.ESP }[m];

  it('her modül sayfayı Ayarlar çekmecesine kaydeder', () => {
    const ayar = P.menu(m, K.CEKMECELER).find(c => c.id === 'ayarlar');
    expect(ayar.items.some(s => s.label === 'Kılavuz')).toBe(true);
  });

  it('bu modül için yazılan her yol menüde gerçekten var', () => {
    const menu = P.menu(m, K.CEKMECELER);
    KL.SISTEMLER.find(s => s.id === m).yollar.forEach(([cekmece, bolum]) => {
      const c = menu.find(x => x.label === cekmece);
      expect(!!(c && c.items.some(s => s.label === bolum))).toBe(true);
    });
  });

  it('ekran bütün bölümleri çizer; iç terim ve dosya adı yok', async () => {
    const d = document.createElement('div');
    d.innerHTML = String(await ns.Screens.kilavuz.render());
    const metin = d.textContent;
    ['İlk gün', 'Her gün', 'Sistemler', 'Telefon', 'Takılırsan', 'King', 'Ne yaptın?', 'Günü kapat'].forEach(t => expect(metin).toContain(t));
    expect(d.querySelectorAll('[data-kilavuz-kart]').length).toBe(4);
    expect(/\.(js|py|bat|json)\b|python|localStorage|\bHKM\b/.test(metin)).toBe(false);
    expect(P.hatalar.filter(h => /^kilavuz/.test(h.id)).length).toBe(0);
  });

  it('her süre tahmin etiketi taşır', () => {
    const d = document.createElement('div');
    d.innerHTML = P.bloklar('kilavuz', 'ana')[0].ciz();
    expect(d.querySelectorAll('.kilavuz__ozet > div').length).toBe(2);
    d.querySelectorAll('.kilavuz__ozet > div').forEach(h => expect(h.querySelector('small').textContent).toBe('tahmin'));
  });

  it('Menü başındaki satır ve komut kılavuza gider', () => {
    const d = document.createElement('div');
    d.innerHTML = K.menuSayfasi({ modul:m, cekmeceler:[] });
    const s = d.querySelector('.menusayfa__kilavuz');
    expect(s.getAttribute('data-route')).toBe('kilavuz');
    expect(s.textContent).toContain('Kullanım kılavuzu');
    /* SPİ ve ESP paleti menüden üretir (ilk test); AYS kendi satırını yazar. */
    if(m === 'ays') expect(P.komutlar(m).some(c => c.route === 'kilavuz')).toBe(true);
  });
});
})();
