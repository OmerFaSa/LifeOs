/* Patron turu: akış tutarlı mı, metin sınırı çiğniyor mu, durum korunuyor mu, yalnız gerçek tıklamayla mı ilerliyor? */
(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;

describe('Patron turu', () => {
  const L = window.LIFEOS, T = L.PATRONTUR, CEREZ = 'lifeos_patrontur';
  const cerezSil = () => { document.cookie = CEREZ + '=; Path=/; Max-Age=0; SameSite=Strict'; };
  const hepsi = () => T._akis('ays').concat(T._akis('spi'), T._akis('esp'));
  const sozler = mod => T._akis('ays').filter(a => a.kim === mod).map(a => T._sozler(a).join(' ')).join(' ') + ' ' + L.PARCA.yazi('ortak.patrontur.' + mod + '.kurulum');
  /* Kabuğun yerine geçen en küçük sahne: spotun bulacağı gerçek düğmeler. */
  function sahne(){
    const k = document.createElement('div');
    k.innerHTML = '<button class="kenar__cekmece" data-cekmece="calisma" style="position:fixed;left:0;top:0;width:60px;height:40px">Çalışma</button>'
      + '<button class="kenar__cekmece is-on" data-cekmece="bugun" style="position:fixed;left:0;top:50px;width:60px;height:40px">Bugün</button>';
    document.body.appendChild(k);
    return k;
  }
  const bekle = ms => new Promise(ok => setTimeout(ok, ms));
  const adimaGit = (mod, id) => T._ac('h:test', mod, { a:id, i:mod, s:0 });

  it('King açar, her patron kendi kapısında konuşur, kapanış işe başlatır', () => {
    SIRALAR: for(const ilk of T.SIRA){
      const l = T._akis(ilk);
      expect(l[0].kim).toBe('king');
      expect(l[l.length - 1].id).toBe('son.is');
      expect(l[l.length - 1].son).toBe(true);
      T.SIRA.forEach(m => {
        const a = l.filter(x => x.kim === m);
        expect(a.length >= 6).toBe(true);
        a.forEach(x => expect(x.modul).toBe(m));
        expect(T._sozler(l.find(x => x.id === m + '.tanis'))[0]).toContain('patronuyum');
      });
      /* İlk kapı önce gelir; sırası gelmeden başka kapıya geçilmez. */
      expect(l.find(x => x.kim !== 'king').modul).toBe(ilk);
      continue SIRALAR;
    }
  });

  it('her modül geçişi öncesinde gerçek düğmeye basılır; kapanışta tur son modülde biter', () => {
    const l = T._akis('spi');
    l.forEach((a, i) => {
      const s = l[i + 1];
      if(s && s.modul && a.modul && s.modul !== a.modul){
        expect(a.tikla).toBe(true);
        expect(a.hedef).toBe('sistem:' + s.modul);
      }
    });
    expect(l[l.length - 2].modul).toBe(null);
    expect(T._sozler(l[l.length - 1]).join(' ')).toContain('işe koyulalım');
  });

  it('bütün cümleler kayıtlı ve düzgün; kimlik tekil', () => {
    hepsi().forEach(a => T._sozler(a).forEach(c => {
      expect(c.length > 5).toBe(true);
      expect(/[.!?…]$/.test(c)).toBe(true);
      expect(/ortak\.patrontur/.test(c)).toBe(false);
    }));
    const l = T._akis('ays').map(a => a.id);
    expect(new Set(l).size).toBe(l.length);
  });

  it('sınırlar: SPİ doz ve tedavi konuşmaz; AYS ve ESP garanti vermez; hiçbiri sonuç vaat etmez', () => {
    const spi = sozler('spi').toLocaleLowerCase('tr');
    ['doz ', 'dozu', 'tedavi eder', 'iyileştir', 'zayıflat'].forEach(s => expect(spi.indexOf(s) < 0).toBe(true));
    expect(spi).toContain('teşhis koymam');
    const hep = ['ays', 'spi', 'esp'].map(sozler).join(' ').toLocaleLowerCase('tr');
    ['garanti ederim', 'kazandır', 'başaracaksın', 'kesin sonuç', 'mutlaka '].forEach(s => expect(hep.indexOf(s) < 0).toBe(true));
    expect(sozler('esp').toLocaleLowerCase('tr')).toContain('sertifika vermem');
    expect(sozler('ays').toLocaleLowerCase('tr')).toContain('üniversite önermem');
  });

  it('durum port değişse de okunur: hesap başına çerezde durur, hesaplar karışmaz', () => {
    cerezSil();
    T._yaz('h:bir', { a:'spi.calisma', i:'ays', s:1 });
    T._yaz('h:iki', { b:1 });
    expect(T._oku('h:bir').a).toBe('spi.calisma');
    expect(T._oku('h:iki').b).toBe(1);
    expect(T._oku('h:yok')).toBe(null);
    expect(document.cookie.indexOf(CEREZ + '=') >= 0).toBe(true);
    cerezSil();
  });

  it('bozuk çerez turu düşürmez', () => {
    document.cookie = CEREZ + '=%7Bbozuk; Path=/; SameSite=Strict';
    expect(T._oku('h:bir')).toBe(null);
    cerezSil();
  });

  it('«tikla» adımı karanlığa basınca ilerlemez, gerçek düğmeye basınca ilerler; durum yazılır', async () => {
    cerezSil();
    const s = sahne();
    try{
      expect(adimaGit('ays', 'ays.calisma')).toBe(true);
      await bekle(120);
      const d = T._durum();
      expect(d.adim.id).toBe('ays.calisma');
      expect(d.kok.querySelector('[data-ptur="devam"]').hidden).toBe(true);
      /* Karanlık perdeye tıklama */
      d.perdeler[1].click();
      await bekle(30);
      expect(d.adim.id).toBe('ays.calisma');
      /* Delik gerçek düğmenin üstünde; tıklamayı tutan perde yok */
      const r = s.querySelector('[data-cekmece="calisma"]').getBoundingClientRect();
      expect(document.elementFromPoint(r.left + 10, r.top + 10)).toBe(s.querySelector('[data-cekmece="calisma"]'));
      s.querySelector('[data-cekmece="calisma"]').click();
      expect(d.adim.id).toBe('ays.calisma-ic');
      expect(T._oku('h:test').a).toBe('ays.calisma-ic');
    }finally{ T.bitir(true); s.remove(); cerezSil(); }
  });

  it('hedef ekranda yoksa kilitlenmez: «Devam» çıkar', async () => {
    cerezSil();
    try{
      adimaGit('ays', 'ays.analiz');
      const d = T._durum();
      expect(d.kok.querySelector('[data-ptur="devam"]').hidden).toBe(true);
      await bekle(1500);
      expect(d.kok.querySelector('[data-ptur="devam"]').hidden).toBe(false);
    }finally{ T.bitir(true); cerezSil(); }
  });

  it('Esc turu geçer ve bir daha kendiliğinden açılmaz; ses kapalıysa konuşmaz, altyazı yine görünür', async () => {
    cerezSil();
    const eski = L.KING, soylenen = [];
    L.KING = { seslendir:m => soylenen.push(m), sus(){}, konusuyorMu:() => false };
    try{
      adimaGit('ays', 'ays.tanis');
      await bekle(30);
      const d = T._durum();
      expect(d.yazi.textContent).toContain('patronuyum');
      expect(soylenen.length).toBe(0);
      d.kok.querySelector('[data-ptur="ses"]').click();
      expect(d.ses).toBe(true);
      expect(soylenen.join(' ')).toContain('patronuyum');
      expect(T._oku('h:test').s).toBe(1);
      document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(T.acikMi()).toBe(false);
      expect(T._oku('h:test').b).toBe(1);
      expect(document.querySelector('.ptur')).toBe(null);
    }finally{ L.KING = eski; T.bitir(true); cerezSil(); }
  });

  it('önüne pencere geçince susar, kapanınca aynı adımdan sürer', async () => {
    cerezSil();
    try{
      adimaGit('ays', 'ays.tanis');
      const d = T._durum();
      await bekle(30);
      const p = document.createElement('div');
      p.id = 'cmdk'; p.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:100px';
      document.body.appendChild(p);
      await bekle(260);
      expect(d.kok.hidden).toBe(true);
      expect(d.adim.id).toBe('ays.tanis');
      p.remove();
      await bekle(260);
      expect(d.kok.hidden).toBe(false);
      expect(d.adim.id).toBe('ays.tanis');
    }finally{ T.bitir(true); cerezSil(); }
  });

  it('başka kapıda açılırsa oraya götüren kart çıkar: sayfa zorla değişmez', async () => {
    cerezSil();
    try{
      T._ac('h:test', 'esp', { a:'spi.tanis', i:'ays', s:0 });
      await bekle(30);
      const d = T._durum();
      expect(d.adim.id).toBe('spi.tanis');
      expect(d.yazi.textContent).toContain('SPİ');
      expect(d.kok.querySelector('[data-ptur="devam"]').hidden).toBe(false);
    }finally{ T.bitir(true); cerezSil(); }
  });
});
})();
