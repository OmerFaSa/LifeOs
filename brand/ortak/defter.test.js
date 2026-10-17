/* Defter (brand/ortak/defter.js) — NOT-PLANI Faz 1.
   Kanıtlanan: metin önce kaçırılır (XSS yok), yalnız https bağlantı olur;
   biçim; [[bağlantı]], geri bağlantı, #etiket araması; yapılacak kutusu;
   not ekle/kaydet/sil; medya gömülür ve dışa aktarımda adıyla yazılır;
   pencere açılır, yeni not, Esc kapatır. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const D = () => window.LIFEOS.DEFTER;
  function sahne(){
    const depo = {};
    D()._sifirla();
    D().kur({ modul:'test', store:{ set:async (p, d) => { depo[p] = JSON.parse(JSON.stringify(d)); },
      list:async c => Object.keys(depo).filter(k => k.indexOf(c + '/') === 0).map(k => depo[k]),
      remove:async p => { delete depo[p]; } } });
    const m = {};
    const M = D().medya, eski = { koy:M.koy, al:M.al, sil:M.sil };
    M.koy = async k => { m[k.id] = k; return k; }; M.al = async id => m[id] || null; M.sil = async id => { delete m[id]; return true; };
    return { depo, m, birak:() => { Object.assign(M, eski); D()._sifirla(); } };
  }
  async function ile(fn){ const s = sahne(); try{ await fn(s); }finally{ s.birak(); } }

  describe('Defter — biçim ve güvenlik', () => {
    it('metin kaçırılır; javascript: bağlantı olmaz, https olur', () => {
      const h = D().md('<script>alert(1)</script> "x" javascript:alert(1) https://example.com/a?b=1');
      expect(h.indexOf('<script>') < 0).toBe(true);
      expect(h).toContain('&lt;script&gt;');
      expect(h.indexOf('href="javascript') < 0).toBe(true);
      expect(h).toContain('href="https://example.com/a?b=1" target="_blank" rel="noopener noreferrer"');
    });
    it('başlık, kalın, italik, kod, liste, sıralı, ayraç, yapılacak, gömülü', () => {
      const h = D().md('# Baş\n**kalın** *ince* `kod`\n- a\n- b\n1. bir\n---\n- [ ] yap\n- [x] bitti\n![[medya:mabc123]]');
      ['<h2>Baş</h2>', '<strong>kalın</strong>', '<em>ince</em>', '<code>kod</code>', '<ul><li>a</li><li>b</li></ul>', '<ol><li>bir</li></ol>', '<hr/>',
        'data-defter-kutu="6"', 'checked', 'data-defter-medya="mabc123"'].forEach(x => expect(h).toContain(x));
    });
    it('bağlantı, geri bağlantı, etiket, arama, kutu çevirme', () => {
      expect(D().baglantilar('bkz [[Türev]] ve [[İntegral]] [[Türev]]')).toEqual(['Türev', 'İntegral']);
      expect(D().etiketler('#matematik bugün #Tekrar')).toEqual(['matematik', 'tekrar']);
      const l = [{ id:'1', baslik:'Türev', govde:'' }, { id:'2', baslik:'Limit', govde:'önce [[türev]] #matematik' }, { id:'3', baslik:'Şiir', govde:'#edebiyat' }];
      expect(D().geriBaglantilar(l, 'Türev').map(n => n.id)).toEqual(['2']);
      expect(D().ara(l, '#matematik').map(n => n.id)).toEqual(['2']);
      expect(D().ara(l, 'şiir').map(n => n.id)).toEqual(['3']);
      expect(D().kutuCevir('- [ ] a\n- [x] b', 0)).toBe('- [x] a\n- [x] b');
      expect(D().kutuCevir('- [ ] a\n- [x] b', 1)).toBe('- [ ] a\n- [ ] b');
    });
  });

  describe('Defter — Faz 1b: vurgu, alıntı, biçim komutları, şablon, sayım', () => {
    it('==vurgu==, ~~üstü çizili~~, > alıntı', () => {
      const h = D().md('==önemli== ~~eski~~\n> bir söz');
      expect(h).toContain('<mark>önemli</mark>');
      expect(h).toContain('<del>eski</del>');
      expect(h).toContain('<blockquote>bir söz</blockquote>');
    });
    it('seçimi sar ve satır öneki: kalın, başlık; yeniden basınca kalkar', () => {
      const r = D().sar('a b c', 2, 3, '**', '**', 'kalın');
      expect([r.metin, r.bas, r.son]).toEqual(['a **b** c', 4, 5]);
      expect(D().sar('ab', 1, 1, '==', '==', 'vurgu').metin).toBe('a==vurgu==b');
      const b = D().satirOnek('bir\niki', 0, 7, '## ');
      expect(b.metin).toBe('## bir\n## iki');
      expect(D().satirOnek(b.metin, 0, b.metin.length, '## ').metin).toBe('bir\niki');
    });
    it('şablonlar ve kelime sayımı', () => {
      expect(D().SABLONLAR.map(t => t.id)).toEqual(['ders', 'gunluk', 'kitap', 'plan']);
      expect(D().sayim('bir iki üç ![[medya:mabc1]] **dört**')).toEqual({ kelime:4, dakika:1 });
    });
    it('pencere: şablonla başla, Oku | Yaz seçici', () => ile(async () => {
      D().ac();
      const el = document.getElementById('defter');
      el.querySelector('[data-defter="yeni"]').click();
      await new Promise(r => setTimeout(r, 0));
      el.querySelector('[data-defter-sablon="ders"]').click();
      await new Promise(r => setTimeout(r, 0));
      const n = D().notlar()[0];
      expect([n.baslik, n.govde.indexOf('## Önemli noktalar') >= 0]).toEqual(['Ders notu', true]);
      el.querySelector('[data-defter="oku"]').click();
      await new Promise(r => setTimeout(r, 0));
      expect(!!el.querySelector('[data-defter-oku] h3')).toBe(true);
      expect(el.querySelector('.defter__alt').textContent).toContain('kelime');
    }));
  });

  describe('Defter — notlar ve medya', () => {
    it('ekle, kaydet, depodan yükle, sil (gömülü medya da silinir)', () => ile(async s => {
      const n = await D().yeni('Fizik', 'Newton');
      expect(Object.keys(s.depo)).toEqual(['defter/' + n.id]);
      const r = await D().medyaEkle(new Blob(['x'], { type:'image/png' }), { notId:n.id, ad:'a.png' });
      expect(r.gomme).toBe('![[medya:' + r.kayit.id + ']]');
      expect(r.kayit.tur).toBe('resim');
      n.govde += '\n' + r.gomme;
      await D().kaydet(n);
      const md = await D().disaAktarMetni(n);
      expect(md).toContain('# Fizik');
      expect(md).toContain('![a.png](a.png)');
      D()._sifirla();
      D().kur({ modul:'test', store:{ list:async () => Object.values(s.depo), set:async () => {}, remove:async p => { delete s.depo[p]; } } });
      await D().yukle();
      expect(D().notlar().map(x => x.baslik)).toEqual(['Fizik']);
      await D().sil(n.id);
      expect(Object.keys(s.depo)).toHaveLength(0);
      expect(s.m[r.kayit.id]).toBe(undefined);
    }));
    it('çok büyük dosya reddedilir; tür mime türünden', () => ile(async () => {
      const buyuk = { size:400 * 1024 * 1024, type:'video/mp4', name:'v.mp4' };
      let hata = null;
      try{ await D().medyaEkle(buyuk, {}); }catch(e){ hata = e.message; }
      expect(hata).toContain('çok büyük');
      expect((await D().medyaEkle(new Blob(['x'], { type:'audio/webm' }), { ad:'s.webm' })).kayit.tur).toBe('ses');
      expect((await D().medyaEkle(new Blob(['x'], { type:'application/pdf' }), { ad:'d.pdf' })).kayit.tur).toBe('dosya');
    }));
    it('pencere: açılır, yeni not düzenleyicide, başlık yazılır, Esc kapatır', () => ile(async () => {
      expect(D().ac()).toBe(true);
      const el = document.getElementById('defter');
      expect(!!el).toBe(true);
      el.querySelector('[data-defter="yeni"]').click();
      await new Promise(r => setTimeout(r, 0));
      expect(!!el.querySelector('[data-defter-govde]')).toBe(true);
      expect(D().notlar()).toHaveLength(1);
      el.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(!!document.getElementById('defter')).toBe(false);
    }));
  });
})();
