/* Kavratma parçası (brand/ortak/kavrat.js) — üç arayüzde aynı test.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kavrat.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const K = () => window.LIFEOS.KAVRAT;
  const ANAHTAR = 'kavrattest.kavrat.kanit';
  const temizle = () => { try{ localStorage.removeItem(ANAHTAR); }catch(e){ /* depo yok */ } };
  function kur(o){
    K()._sifirla(); temizle();
    K().kur(Object.assign({ modul:'kavrattest', bugun:() => '2026-11-05' }, o || {}));
  }
  const CIZIM = { w:200, h:120, alt:'Bir doğru parçası ve üstünde iki nokta.', adimlar:[
    { o:[['c', 20, 100, 180, 100]], not:'Önce taban çizilir.' },
    { o:[['n', 20, 100], ['t', 20, 112, 'A', 'k']], not:'Sol uçta A noktası.' },
    { o:[['n', 180, 100, 'v'], ['t', 180, 112, 'B', 'kv']], not:'Sağ uçta B noktası vurgulu.' },
  ] };
  const KARTLAR = [{ on:'Birinci kartın önü', arka:'Bir' }, { on:'İkinci kartın önü', arka:'İki' }, { on:'Üçüncü kartın önü', arka:'Üç' }];
  const say = (s, alt) => s.split(alt).length - 1;

describe('Kavrat — denetim', () => {
  it('temiz çizim ve kart setinde kusur yok', () => {
    expect(K().denetle({ cizim:CIZIM, kartlar:KARTLAR }).length).toBe(0);
  });
  it('tek adım, notsuz adım, bilinmeyen öğe yakalanır', () => {
    expect(K().denetle({ cizim:Object.assign({}, CIZIM, { adimlar:[CIZIM.adimlar[0]] }) }).length > 0).toBe(true);
    const notsuz = Object.assign({}, CIZIM, { adimlar:[CIZIM.adimlar[0], { o:[['n', 1, 1]], not:'' }] });
    expect(K().denetle({ cizim:notsuz }).some(h => /not/.test(h))).toBe(true);
    const bozuk = Object.assign({}, CIZIM, { adimlar:[CIZIM.adimlar[0], { o:[['script', 1, 1]], not:'Bozuk bir öğe.' }] });
    expect(K().denetle({ cizim:bozuk }).some(h => /bilinmeyen/.test(h))).toBe(true);
  });
  it('iki kart az, aynı ön yüz iki kez kusurdur', () => {
    expect(K().denetle({ kartlar:KARTLAR.slice(0, 2) }).length > 0).toBe(true);
    expect(K().denetle({ kartlar:KARTLAR.concat([{ on:'Birinci kartın önü', arka:'x' }]) }).some(h => /iki kez/.test(h))).toBe(true);
  });
  it('kusurlu tarif çizilmez', () => {
    kur();
    expect(K().cizimHtml('c0', { w:200, h:120, alt:'kısa', adimlar:[] })).toBe('');
    expect(K().kartlarHtml('k0', KARTLAR.slice(0, 1))).toBe('');
  });
});

describe('Kavrat — adım adım çizim', () => {
  it('önce yalnız ilk adım; ileri gidince eskiler ikincil, son adım vurgulu', () => {
    kur();
    const h1 = K().cizimHtml('c1', CIZIM);
    expect(say(h1, '<g class="kavrat-adim')).toBe(1);
    expect(h1).toContain('Önce taban çizilir.');
    expect(h1).toContain('Adım 1 / 3');
    expect(h1).toContain('disabled');   // ilk adımda «Önceki» kapalı
    K().tikla('ileri:c1');
    const h2 = K().cizimHtml('c1', CIZIM);
    expect(say(h2, '<g class="kavrat-adim')).toBe(2);
    expect(say(h2, 'kavrat-adim is-eski')).toBe(1);
    expect(h2).toContain('Adım 2 / 3');
    expect(say(h2, 'kavrat-nokta is-dolu')).toBe(2);
  });
  it('son adımda «Baştan» çıkar ve başa döner; sınır dışına taşmaz', () => {
    kur();
    K().cizimHtml('c2', CIZIM);
    ['ileri', 'ileri', 'ileri', 'ileri'].forEach(v => K().tikla(v + ':c2'));
    const son = K().cizimHtml('c2', CIZIM);
    expect(son).toContain('Adım 3 / 3');
    expect(son).toContain('bastan:c2');
    K().tikla('bastan:c2');
    expect(K().cizimHtml('c2', CIZIM)).toContain('Adım 1 / 3');
  });
  it('çizimin aria-label\'ı adımı cümleyle söyler; yazı kaçırılır', () => {
    kur();
    const c = JSON.parse(JSON.stringify(CIZIM));
    c.adimlar[0].not = 'Taban <b>çizilir</b> burada.';
    const h = K().cizimHtml('c3', c);
    expect(h).toContain('aria-label="Bir doğru parçası ve üstünde iki nokta. Adım 1 / 3: Taban &lt;b&gt;');
    expect(h.indexOf('<b>çizilir')).toBe(-1);
  });
});

describe('Kavrat — dinle', () => {
  it('okunuş işaretleri konuşmaya çevirir', () => {
    expect(K().okunus('a^{2} + b^{2} = c^{2}')).toBe('a kare + b kare eşittir c kare');
    expect(K().okunus('**Pisagor** ve 3–4–5')).toBe('Pisagor ve 3, 4, 5');
    expect(K().okunus('h^{2} = p · k')).toBe('h kare eşittir p çarpı k');
    expect(K().okunus('H_{2}O ve x^{n}')).toBe('H 2O ve x üssü n');
  });
  it('ses yoksa düğme yok', () => {
    kur();
    expect(K().dinleHtml('d1', { baslik:'Başlık', metin:'Metin.' })).toBe('');
    kur({ ses:{ var:() => false, konus:() => Promise.resolve(), dur:() => {} } });
    expect(K().dinleHtml('d1', { baslik:'Başlık', metin:'Metin.' })).toBe('');
  });
  it('ses varsa bölüm metni okunur; ikinci basış durdurur', () => {
    const okunan = [];
    let durdu = 0;
    kur({ ses:{ var:() => true, konus:m => { okunan.push(m); return new Promise(() => {}); }, dur:() => { durdu++; } } });
    const b = { baslik:'Pisagor bağıntısı', metin:'Dik üçgende geçerlidir', formul:['a^{2} + b^{2} = c^{2}'], dikkat:'Yalnız dik üçgen' };
    expect(K().dinleHtml('d2', b)).toContain('aria-pressed="false"');
    K().tikla('dinle:ses:d2');
    expect(okunan[0]).toBe('Pisagor bağıntısı. Dik üçgende geçerlidir. a kare + b kare eşittir c kare. Dikkat: Yalnız dik üçgen.');
    expect(K().dinleHtml('d2', b)).toContain('aria-pressed="true"');
    K().tikla('dinle:ses:d2');
    expect(okunan.length).toBe(1);
    expect(durdu > 0).toBe(true);
    expect(K().dinleHtml('d2', b)).toContain('aria-pressed="false"');
  });
});

describe('Kavrat — kartlar ve aralıklı tekrar', () => {
  it('önce ön yüz ve «hatırla»; çevirince arka; cevap USTA kanıtı olur', () => {
    kur();
    const h = K().kartlarHtml('k1', KARTLAR);
    expect(h).toContain('Birinci kartın önü');
    expect(h).toContain('cevir:kart:k1');
    expect(h.indexOf('>Bir<')).toBe(-1);
    expect(h).toContain('— / 3');   // hiç kanıt yok: «veri yok», sıfır değil (§1.2)
    expect(K().durum('k1', KARTLAR).kalici).toBe(null);
    K().tikla('cevir:kart:k1');
    expect(K().kartlarHtml('k1', KARTLAR)).toContain('>Bir<');
    K().tikla('bildim:kart:k1');
    expect(K().kartlarHtml('k1', KARTLAR)).toContain('0 / 3');   // ölçüldü, henüz kalıcı yok
    const b = K().beceriler('k1', KARTLAR);
    expect(b[0].kanitlar.length).toBe(1);
    expect(b[0].kanitlar[0].g).toBe('2026-11-05');
    expect(b[0].kanitlar[0].isabet).toBe(true);
    expect(K().kartlarHtml('k1', KARTLAR)).toContain('İkinci kartın önü');
    temizle();
  });
  it('hepsi bilinince bugünlük biter ve yarının tarihi söylenir; bilinmeyen yeniden gelir', () => {
    kur();
    K().kartlarHtml('k2', KARTLAR);
    ['bildim', 'bilemedim', 'bildim'].forEach(v => { K().tikla('cevir:kart:k2'); K().tikla(v + ':kart:k2'); });
    const h = K().kartlarHtml('k2', KARTLAR);
    expect(h).toContain('İkinci kartın önü');   // bilemediğin karta yeniden sıra gelir
    K().tikla('cevir:kart:k2'); K().tikla('bildim:kart:k2');
    expect(K().kartlarHtml('k2', KARTLAR)).toContain('6 Kasım');
    temizle();
  });
  it('kalıcı sayacı USTA aşamasından gelir', () => {
    kur();
    localStorage.setItem(ANAHTAR, JSON.stringify({ k3:{ 'Birinci kartın önü':[{ g:'2026-10-01', isabet:true }, { g:'2026-10-09', isabet:true }] } }));
    const d = K().durum('k3', KARTLAR);
    expect(d.kalici).toBe(1);
    expect(d.toplam).toBe(3);
    expect(K().kartlarHtml('k3', KARTLAR)).toContain('1 / 3');
    temizle();
  });
  it('sesli tekrar düğmesi yalnız ses varken çıkar ve ön yüzü okur', () => {
    kur();
    expect(K().kartlarHtml('k4', KARTLAR).indexOf('sesli:kart:k4')).toBe(-1);
    const okunan = [];
    kur({ ses:{ var:() => true, konus:m => { okunan.push(m); return new Promise(() => {}); }, dur:() => {} } });
    expect(K().kartlarHtml('k4', KARTLAR)).toContain('sesli:kart:k4');
    K().tikla('sesli:kart:k4');
    return new Promise(r => setTimeout(r, 20)).then(() => {
      expect(okunan[0]).toBe('Birinci kartın önü');
      K().sesDur(); temizle();
    });
  });
  it('anlatım sayfasındaki eski kart kaydı modülün anahtarına bir kez taşınır, eskisi silinmez', () => {
    const ad = ['spi.rehber.kavrat.kanit', 'spi.kavrat.kanit'], eski = ad.map(k => localStorage.getItem(k));
    try{
      localStorage.removeItem(ad[1]);
      localStorage.setItem(ad[0], JSON.stringify({ 'rehber:kosu':{ 'Koş-yürü nedir?':[{ g:'2026-11-05', isabet:true }] } }));
      K()._sifirla(); K().kur({ modul:'spi', bugun:() => '2026-11-06' });
      expect(JSON.parse(localStorage.getItem(ad[1])).kosu['Koş-yürü nedir?'].length).toBe(1);
      expect(localStorage.getItem(ad[0]) != null).toBe(true);
      /* Yeni kayıt varken bir daha taşınmaz. */
      localStorage.setItem(ad[0], JSON.stringify({ 'rehber:kosu':{ x:[] } }));
      K().kur({ modul:'spi' });
      expect(JSON.parse(localStorage.getItem(ad[1])).kosu.x).toBe(undefined);
    }finally{
      ad.forEach((k, i) => { if(eski[i] == null) localStorage.removeItem(k); else localStorage.setItem(k, eski[i]); });
      K()._sifirla();
    }
  });
  it('aynı bölümün Dinle düğmesi ve çizimi birbirinin yerine geçmez', () => {
    kur({ ses:{ var:() => true, konus:() => new Promise(() => {}), dur:() => {} } });
    const kap = document.createElement('div');
    kap.innerHTML = K().dinleHtml('b1', { baslik:'Başlık', metin:'Metin.' }) + K().cizimHtml('b1', CIZIM);
    document.body.appendChild(kap);
    kap.querySelector('[data-kavrat="ileri:b1"]').click();
    expect(kap.querySelectorAll('.kavrat-cizim').length).toBe(1);
    expect(kap.querySelectorAll('.kavrat-dinle').length).toBe(1);
    kap.querySelector('.kavrat-dinle').click();
    expect(kap.querySelectorAll('.kavrat-cizim').length).toBe(1);
    expect(kap.querySelector('.kavrat-dinle').getAttribute('aria-pressed')).toBe('true');
    K().sesDur(); kap.remove();
  });
  it('tıklama parçayı yerinde yeniden çizer ve odağı korur', () => {
    kur();
    const kap = document.createElement('div');
    kap.innerHTML = K().cizimHtml('c9', CIZIM);
    document.body.appendChild(kap);
    kap.querySelector('[data-kavrat="ileri:c9"]').click();
    expect(kap.querySelectorAll('.kavrat-adim').length).toBe(2);
    expect(document.activeElement && document.activeElement.getAttribute('data-kavrat')).toBe('ileri:c9');
    kap.remove();
  });
});
})();
