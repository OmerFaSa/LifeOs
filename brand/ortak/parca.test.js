/* PARÇA — tak-çıkar sözleri. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const P = window.LIFEOS.PARCA;
  const K = {
    Grid:l => 'G[' + l.join('|') + ']',
    Span:(a, x) => a + ':' + x,
    Stack:l => 'S(' + l.join(',') + ')',
    Notice:o => 'N<' + o.body + '>',
  };
  const atar = f => { try{ f(); return false; }catch(e){ return true; } };
  const temiz = ids => ids.forEach(i => P._sil(i));

  describe('Parça: sayfa ve blok', () => {
    it('blok sırasına göre yerine takılır, başka dosyadan da eklenir', () => {
      P.sayfa({ id:'_t.s', modul:'_t', izgara:[{ alan:12, yer:'ust', tek:true }, { alan:6, yer:'sol' }] });
      P.blok({ id:'_t.b2', sayfa:'_t.s', yer:'sol', sira:20, ad:'İki', ciz:() => 'b2' });
      P.blok({ id:'_t.b1', sayfa:'_t.s', yer:'sol', sira:10, ad:'Bir', ciz:() => 'b1' });
      P.blok({ id:'_t.u', sayfa:'_t.s', yer:'ust', ad:'Üst', ciz:() => 'u' });
      expect(P.ciz('_t.s', K)).toBe('G[12:u|6:S(b1,b2)]');
      temiz(['_t.b1']);
      expect(P.ciz('_t.s', K)).toBe('G[12:u|6:S(b2)]');
      temiz(['_t.s', '_t.b2', '_t.u']);
    });
    it('yer: tek blok değeri olduğu gibi döner, çok blok birleşir, boş yer boş döner', () => {
      P.sayfa({ id:'_t.y', modul:'_t' });
      const nesne = { kacis:false };
      P.blok({ id:'_t.y1', sayfa:'_t.y', yer:'a', ad:'A', ciz:b => (b && b.n ? nesne : 'x') });
      expect(P.yer('_t.y', 'a', K, { n:1 })).toBe(nesne);
      P.blok({ id:'_t.y2', sayfa:'_t.y', yer:'a', sira:200, ad:'B', ciz:() => 'y' });
      expect(P.yer('_t.y', 'a', K, {}, v => 'R:' + v)).toBe('R:xy');
      expect(P.yer('_t.y', 'bos', K, {})).toBe('');
      temiz(['_t.y', '_t.y1', '_t.y2']);
    });
    it('kosul: blok yalnız o durumda çizilir', () => {
      P.sayfa({ id:'_t.k2', modul:'_t' });
      P.blok({ id:'_t.k3', sayfa:'_t.k2', yer:'a', ad:'A', kosul:b => b.ac, ciz:() => 'a' });
      P.blok({ id:'_t.k4', sayfa:'_t.k2', yer:'a', ad:'B', kosul:b => !b.ac, ciz:() => 'b' });
      expect(P.yer('_t.k2', 'a', K, { ac:true })).toBe('a');
      expect(P.yer('_t.k2', 'a', K, { ac:false })).toBe('b');
      temiz(['_t.k2', '_t.k3', '_t.k4']);
    });
    it('hata veren parça sayfayı düşürmez, adıyla söyler', () => {
      P.sayfa({ id:'_t.h', modul:'_t', izgara:[{ alan:6, yer:'a' }] });
      P.blok({ id:'_t.k', sayfa:'_t.h', yer:'a', ad:'Bozuk', ciz:() => { throw new Error('x'); } });
      P.blok({ id:'_t.i', sayfa:'_t.h', yer:'a', sira:200, ad:'İyi', ciz:() => 'iyi' });
      const c = P.ciz('_t.h', K);
      expect(c.indexOf('Bozuk') >= 0 && c.indexOf('iyi') >= 0).toBe(true);
      expect(P.hatalar.some(h => h.id === '_t.k')).toBe(true);
      temiz(['_t.h', '_t.k', '_t.i']);
    });
    it('ekran: olaylar ve küçük bölümler bloklardan toplanır, çakışan olay reddedilir', async () => {
      P.sayfa({ id:'_t.e', modul:'_t', ad:'Ad', baslik:'Başlık', izgara:[{ alan:6, yer:'a' }] });
      P.blok({ id:'_t.e1', sayfa:'_t.e', yer:'a', ad:'A', kucuk:'a', ciz:() => 'a', handle:{ git(){} } });
      P.blok({ id:'_t.e2', sayfa:'_t.e', yer:'a', ad:'B', sira:200, ciz:() => 'b', change:{ yaz(){} } });
      const e = P.ekran('_t.e', K);
      expect(e.title).toBe('Başlık');
      expect(e.kucukVarsayilan).toEqual(['a']);
      expect(Object.keys(e.handle)).toEqual(['git']);
      expect(Object.keys(e.change)).toEqual(['yaz']);
      expect(await e.render()).toBe('G[6:S(a,b)]');
      P.blok({ id:'_t.e3', sayfa:'_t.e', yer:'a', ad:'C', ciz:() => 'c', handle:{ git(){} } });
      expect(atar(() => P.ekran('_t.e', K))).toBe(true);
      temiz(['_t.e', '_t.e1', '_t.e2', '_t.e3']);
    });
    it('menü sayfalardan üretilir: sıra, boş çekmece yok, başka modül yok', () => {
      P.sayfa({ id:'_t.m2', modul:'_tm', cekmece:'a', ad:'İki', ikon:'x', sira:20 });
      P.sayfa({ id:'_t.m1', modul:'_tm', cekmece:'a', ad:'Bir', ikon:'y', sira:10 });
      P.sayfa({ id:'_t.m3', modul:'_tb', cekmece:'a', ad:'Üç', ikon:'z' });
      expect(P.menu('_tm', [{ id:'a', ad:'A' }, { id:'b', ad:'B' }])).toEqual([
        { id:'a', label:'A', items:[{ id:'_t.m1', icon:'y', label:'Bir' }, { id:'_t.m2', icon:'x', label:'İki' }] },
      ]);
      expect(P.menu('_tb', [{ id:'a', label:'A', note:'n' }], { alan:'views', kimlik:'route' })).toEqual([
        { id:'a', label:'A', note:'n', views:[{ route:'_t.m3', label:'Üç', icon:'z' }] },
      ]);
      temiz(['_t.m1', '_t.m2', '_t.m3']);
    });
    it('yanlış kayıt sessiz geçmez', () => {
      expect(atar(() => P.blok({ id:'_t.x', sayfa:'y', yer:'z', ciz:() => '' }))).toBe(true);
      expect(atar(() => P.sayfa({ id:'_t.x', modul:'m', cekmece:'a' }))).toBe(true);
      P.sayfa({ id:'_t.c', modul:'m' });
      expect(atar(() => P.sayfa({ id:'_t.c', modul:'m' }))).toBe(true);
      temiz(['_t.c']);
    });
  });

  describe('Parça: yazı ve bilgi', () => {
    it('yazı kimlikle gelir, değer koyar, olmayan kimlik hata atar', () => {
      P.yazilar({ '_t.y':'Kalan {net} net' });
      expect(P.yazi('_t.y', { net:'3,5' })).toBe('Kalan 3,5 net');
      expect(P.yazi('_t.y')).toBe('Kalan {net} net');
      expect(atar(() => P.yazi('_t.yok'))).toBe(true);
      temiz(['_t.y']);
    });
    it('bilgi etiketsiz kaydedilmez; eksik ve hatalı değer «veri yok» olur, sıfır olmaz', () => {
      expect(atar(() => P.bilgi({ id:'_t.b', oku:() => 1 }))).toBe(true);
      expect(atar(() => P.bilgi({ id:'_t.b', etiket:'sanırım', oku:() => 1 }))).toBe(true);
      P.bilgi({ id:'_t.b0', etiket:'ölçüldü', oku:() => 0 });
      P.bilgi({ id:'_t.bn', etiket:'ölçüldü', oku:() => null });
      P.bilgi({ id:'_t.be', etiket:'tahmin', oku:() => { throw new Error('x'); } });
      expect(P.oku('_t.b0')).toEqual({ deger:0, etiket:'ölçüldü' });
      expect(P.oku('_t.bn')).toEqual({ deger:null, etiket:'veri yok' });
      expect(P.oku('_t.be')).toEqual({ deger:null, etiket:'veri yok' });
      temiz(['_t.b0', '_t.bn', '_t.be']);
    });
  });
})();
