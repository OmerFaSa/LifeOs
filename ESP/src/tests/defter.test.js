/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/defter.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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

  describe('Defter — klasör, ağ, boş not (2026-10-20)', () => {
    it('klasör adı temizlenir; ağaç üst klasörleri de gösterir; yeni not seçili klasörde açılır', () => ile(async () => {
      expect(D().klasorAdi('  Sağlık / uyku/ ')).toBe('Sağlık/uyku');
      D().klasorSec('Sağlık/Uyku');
      const a = await D().yeni('Uyku notu', 'x');
      D().klasorSec(null);
      await D().yeni('Serbest', 'y', 'not', '');
      expect(a.klasor).toBe('Sağlık/Uyku');
      expect(D().klasorler()).toEqual(['Sağlık', 'Sağlık/Uyku']);
      expect(D().klasordeki('Sağlık').map(n => n.baslik)).toEqual(['Uyku notu']);
      expect(D().klasordeki('').map(n => n.baslik)).toEqual(['Serbest']);
    }));
    it('boş klasör kalır; yeniden adlandırma notları taşır; silmek notu silmez', () => ile(async s => {
      expect(await D().klasorEkle('Okuma')).toBe('Okuma');
      expect(D().klasorler()).toEqual(['Okuma']);
      expect(s.depo['defterklasor/liste'].liste).toEqual(['Okuma']);
      await D().yeni('Kitap', 'z', 'not', 'Okuma');
      expect(await D().klasorTasi('Okuma', 'Kitaplar')).toBe(1);
      expect(D().klasordeki('Kitaplar').length).toBe(1);
      expect(await D().klasorSil('Kitaplar')).toBe(1);
      expect(D().notlar().length).toBe(1);
      expect(D().notlar()[0].klasor).toBe('');
      expect(D().klasorler()).toEqual([]);
    }));
    it('başlığı ve metni boş not silinir, dolu not kalır', () => ile(async () => {
      const b = await D().yeni('', '');
      const d = await D().yeni('Dolu', '');
      expect(await D().bosSil(b.id)).toBe(true);
      expect(await D().bosSil(d.id)).toBe(false);
      expect(D().notlar().map(n => n.baslik)).toEqual(['Dolu']);
    }));
    it('ağ: [[bağlantı]] kenar olur; etiket bağı isteğe bağlı; bağsızları gizle ve çevre süzer; yerleşim tohumludur', () => ile(async () => {
      const a = await D().yeni('Türev', '[[Limit]] #mat');
      const b = await D().yeni('Limit', 'temel #mat');
      const c = await D().yeni('Şiir', 'yalnız');
      const e = await D().yeni('Uzak', '[[Şiir]]');
      let v = D().agVeri({ klasor:null });
      expect(v.dugum.length).toBe(4);
      expect(v.kenar.map(k => k.tur).sort()).toEqual(['bag', 'bag']);
      expect(D().agVeri({ klasor:null, etiket:true }).kenar.length).toBe(2);
      expect(D().agVeri({ klasor:null, cevre:true, merkez:a.id }).dugum.map(d => d.id).sort()).toEqual([a.id, b.id].sort());
      await D().yeni('Tek', 'bağsız');
      expect(D().agVeri({ klasor:null, bagsizGizle:true }).dugum.length).toBe(4);
      const p1 = D().yerlesim(v, 1000, 700), p2 = D().yerlesim(v, 1000, 700);
      expect(p1[c.id]).toEqual(p2[c.id]);
      expect(Number.isFinite(p1[e.id].x) && Number.isFinite(p1[e.id].y)).toBe(true);
    }));
  });

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

  describe('Defter — Faz 1c: tuval, hazır not, yedek', () => {
    it('hazır not: ekler gömülür; aynı başlıkla «ekle» sonuna ekler', () => ile(async s => {
      const b = new Blob(['x'], { type:'image/png' });
      const n = await D().notOlustur({ baslik:'Soru notu · Türev · 1. soru', govde:'> soru\n{{ekler}}\n#soru', ekler:[{ blob:b, ad:'k.png', tur:'cizim' }] });
      expect((n.govde.match(/!\[\[medya:/g) || []).length).toBe(1);
      expect(n.govde.indexOf('{{ekler}}') < 0).toBe(true);
      await D().notOlustur({ baslik:'Soru notu · Türev · 1. soru', ekle:true, govde:'{{ekler}}', ekler:[{ blob:b, ad:'k2.png', tur:'cizim' }] });
      expect(D().notlar()).toHaveLength(1);
      expect((D().notlar()[0].govde.match(/!\[\[medya:/g) || []).length).toBe(2);
    }));
    it('yedek: medya dahil nesne; geri yükleme eksikleri ekler, var olanı ezmez', () => ile(async s => {
      const n = await D().notOlustur({ baslik:'A', govde:'metin\n{{ekler}}', ekler:[{ blob:new Blob(['merhaba'], { type:'text/plain' }), ad:'m.txt' }] });
      const y = await D().yedekNesnesi();
      expect([y.app, y.notlar.length, y.medya.length]).toEqual(['lifeos-defter', 1, 1]);
      expect(y.medya[0].veri).toBe(btoa('merhaba'));
      /* temiz bir cihaz gibi */
      Object.keys(s.m).forEach(k => delete s.m[k]);
      await D().sil(n.id);
      const r = await D().yedekYukle(y);
      expect([r.not, r.medya]).toEqual([1, 1]);
      expect(D().notlar()[0].govde).toContain('metin');
      expect(await (await D().medya.al(y.medya[0].id)).blob.text()).toBe('merhaba');
      const r2 = await D().yedekYukle(y);
      expect([r2.not, r2.medya]).toEqual([0, 0]);                 // ezmez, iki kez eklemez
      let hata = null; try{ await D().yedekYukle({ app:'baska' }); }catch(e){ hata = e.message; }
      expect(hata).toContain('Defter yedeği değil');
    }));
    it('tuval: başlık ve soru üstte; «ekle» kaydeti çağırır', () => ile(async () => {
      let gelen = null;
      D().tuval({ baslik:'Kâğıtta çöz', ust:'f(x)=x²', kagit:'kareli', dugme:'Karalamayı ekle', kaydet:async b => { gelen = b; } });
      const k = document.querySelector('.defter-ciz');
      expect(k.textContent).toContain('f(x)=x²');
      expect(k.querySelector('[data-kagit="kareli"]').classList.contains('is-secili')).toBe(true);
      k.querySelector('[data-ciz="kaydet"]').click();
      for(let i = 0; i < 40 && !gelen; i++) await new Promise(r => setTimeout(r, 25));
      expect(!!gelen && gelen.type === 'image/png').toBe(true);
      expect(!!document.querySelector('.defter-ciz')).toBe(false);
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

  /* Kullanıcı (2026-10-17): «kütüphanenin içinde yeni not oluşturma, belge
     oluşturma, dosya ekleme olsun; yazdığımız şeyleri oraya yazacağız».
     Kütüphanem'in Notlar bölümü Defter'in rafıdır: üç eylem, en yeni beş
     kayıt, fazlası Tümü. Dosya cihazda kalır (söz 1), kaydın metni eşitlenir. */
  describe('Defter — Kütüphanem rafı', () => {
    it('tür saklanır: not, belge, dosya; bilinmeyen tür not sayılır', () => ile(async s => {
      const a = await D().yeni('Hızlı', 'x');
      const b = await D().belgeOlustur();
      expect(a.tur).toBe('not');
      expect(b.tur).toBe('belge');
      expect(b.govde).toContain('## ');
      s.depo['defter/zz'] = { id:'zz', baslik:'Eski', govde:'', tur:'garip' };
      await D().yukle();
      expect(D().notlar().find(n => n.id === b.id).tur).toBe('belge');
      expect(D().notlar().find(n => n.id === 'zz').tur).toBe('not');
    }));
    it('dosya eklemek her dosya için bir kayıt açar; dosyanın kendisi depoya yazılmaz', () => ile(async s => {
      const l = await D().dosyalarEkle([new File(['%PDF-gizli'], 'ders.pdf', { type:'application/pdf' }),
        new File(['abc'], 'liste.txt', { type:'text/plain' })]);
      expect(l.map(n => [n.tur, n.baslik])).toEqual([['dosya', 'ders.pdf'], ['dosya', 'liste.txt']]);
      expect(l[0].govde).toContain('![[medya:');
      expect(Object.keys(s.m).length).toBe(2);
      expect(JSON.stringify(s.depo).indexOf('%PDF-gizli') < 0).toBeTruthy();
    }));
    it('raf: üç eylem, en yeni beş kayıt, fazlası Tümü; boşken sakin cümle', () => ile(async () => {
      let h = D().rafHtml();
      ['data-defter-raf="not"', 'data-defter-raf="belge"', 'data-defter-raf="dosya"', 'Henüz not yok'].forEach(x => expect(h).toContain(x));
      for(let i = 0; i < 7; i++) await D().yeni('Not ' + i, '');
      h = D().rafHtml();
      expect((h.match(/data-defter-ac=/g) || []).length).toBe(5);
      expect(h).toContain('data-defter-raf="tumu"');
      expect(h.indexOf('Not 6') < h.indexOf('Not 2')).toBeTruthy();
      expect(h.indexOf('Not 1') < 0).toBeTruthy();
      await D().yeni('', '## **Türev** kuralları\nçarpım', 'not');
      expect(D().rafHtml()).toContain('<b>Türev kuralları</b>');            // başlıksızsa ilk satır
    }));
    it('raf bağlanır: satır Defter\'i o notta açar; Yeni not yazma kipinde açar', () => ile(async () => {
      const n = await D().yeni('Bul beni', 'içerik');
      const el = document.createElement('div');
      el.innerHTML = D().rafHtml();
      document.body.appendChild(el);
      try{
        D().rafBagla(el);
        el.querySelector('[data-defter-ac="' + n.id + '"]').click();
        await new Promise(r => setTimeout(r, 20));
        expect(document.getElementById('defter').textContent).toContain('Bul beni');
        D().kapat();
        el.querySelector('[data-defter-raf="not"]').click();
        await new Promise(r => setTimeout(r, 20));
        expect(D().notlar().length).toBe(2);
        expect(!!document.querySelector('#defter [data-defter-govde]')).toBe(true);
      }finally{ D().kapat(); el.remove(); }
    }));
    it('pano: not yoksa boş; haftanın notu en çok geri bağlantı alan, etiketler sayılır (2026-10-20)', () => ile(async () => {
      D().klasorSec(null);
      expect(D().panoHtml()).toBe('');
      await D().yeni('Türev', 'kurallar #matematik #ders', 'not', '');
      await D().yeni('Limit', '[[Türev]] öncesi #matematik', 'not', '');
      await D().yeni('Okuma', 'liste #ders', 'not', '');
      const k = document.createElement('div'); k.innerHTML = D().panoHtml();
      expect(k.querySelector('[data-pano="haftanin-notu"] .pk__soru b').textContent).toBe('Türev');
      expect(!!k.querySelector('[data-pano="haftanin-notu"] [data-defter-ac]')).toBe(true);
      expect(k.querySelector('[data-pano="etiketler"]').textContent).toContain('#matematik');
    }));
    it('raf klasörlü: kökte klasör karoları ve klasörsüz kayıtlar; klasörde yol çubuğu ve o klasörün kayıtları (2026-10-20)', () => ile(async () => {
      D().klasorSec(null);
      D().rafKlasorSec('');
      const a = await D().yeni('Kökteki', '', 'not', '');
      const b = await D().yeni('Uyku notu', '', 'not', 'Sağlık/Uyku');
      await D().yeni('Sağlık notu', '', 'not', 'Sağlık');
      let h = D().rafHtml();
      expect(h).toContain('data-defter-raf-git="Sağlık"');
      expect(h).toContain('2 kayıt');                                       // alt klasör dahil
      expect(h).toContain('<b>Kökteki</b>');
      expect(h.indexOf('Uyku notu') < 0).toBeTruthy();                       // klasördeki kökte görünmez
      D().rafKlasorSec('Sağlık');
      h = D().rafHtml();
      expect(h).toContain('defter-raf__yol');
      expect(h).toContain('data-defter-raf-git="Sağlık/Uyku"');
      expect(h).toContain('<b>Sağlık notu</b>');
      expect(h.indexOf('Kökteki') < 0).toBeTruthy();
      await D().notTasi(a.id, 'Sağlık');
      expect(D().notlar().find(n => n.id === a.id).klasor).toBe('Sağlık');
      expect(D().rafHtml()).toContain('<b>Kökteki</b>');
      await D().notTasi(b.id, '');
      expect(D().notlar().find(n => n.id === b.id).klasor).toBe('');
      D().rafKlasorSec('');
    }));
    it('raf: klasörde açılan not o klasöre girer; + Klasör ekler ve içine girer; Taşı seçimle taşır', () => ile(async () => {
      D().klasorSec(null);
      D().rafKlasorSec('');
      const n = await D().yeni('Taşınacak', '', 'not', '');
      const el = document.createElement('div');
      el.innerHTML = D().rafHtml();
      document.body.appendChild(el);
      try{
        D().rafBagla(el);
        el.querySelector('[data-defter-raf="klasor-yeni"]').click();
        await new Promise(r => setTimeout(r, 10));
        el.querySelector('[data-defter-raf-klasor-ad]').value = 'Dersler';
        el.querySelector('[data-defter-raf="klasor-kaydet"]').click();
        await new Promise(r => setTimeout(r, 20));
        expect(D().rafKlasor()).toBe('Dersler');
        expect(el.textContent).toContain('Bu klasör boş');
        el.querySelector('[data-defter-raf="not"]').click();
        await new Promise(r => setTimeout(r, 20));
        expect(D().notlar().filter(x => x.klasor === 'Dersler').length).toBe(1);
        D().kapat();
        el.querySelector('[data-defter-raf-git=""]').click();
        await new Promise(r => setTimeout(r, 10));
        el.querySelector('[data-defter-raf-tasi="' + n.id + '"]').click();
        await new Promise(r => setTimeout(r, 10));
        const s = el.querySelector('[data-defter-raf-tasi-sec="' + n.id + '"]');
        s.value = 'Dersler';
        s.dispatchEvent(new Event('change', { bubbles:true }));
        await new Promise(r => setTimeout(r, 20));
        expect(D().notlar().find(x => x.id === n.id).klasor).toBe('Dersler');
      }finally{ D().kapat(); el.remove(); D().rafKlasorSec(''); }
    }));
  });
})();
