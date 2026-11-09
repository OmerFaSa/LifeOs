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

  /* Kullanıcı (2026-11-06): «notun içine "Renkot" adında bir anahtar kelime
     koyduk, bunu sisteme kaydetmeli; üzerine geldiğimizde bilgi kartında
     gözükmeli; yazı, resim ya da belge olabilsin». */
  describe('Defter — sözlük ve bilgi kartı', () => {
    const bekle = ms => new Promise(r => setTimeout(r, ms || 0));
    const bul = (metin, adlar) => D().terimBul(metin, D().terimKalibi(adlar.map((ad, i) => ({ id:'t' + i, ad, es:[] })))).map(b => metin.slice(b.bas, b.son));
    it('kelime: büyük küçük, Türkçe ekler ve kesme işareti tanınır; kelimenin içi işaretlenmez', () => {
      expect(bul('Renkot, RENKOT\'un renkotu renkotlar Renkotlarda', ['Renkot'])).toEqual(['Renkot', 'RENKOT\'un', 'renkotu', 'renkotlar', 'Renkotlarda']);
      expect(bul('Tarenkot ve renkotçu', ['Renkot'])).toEqual([]);
      expect(bul('IŞIK İŞIK ışık', ['ışık'])).toEqual(['IŞIK', 'ışık']);          // Türkçe küçük harf
      expect(bul('ata atı at at\'ı', ['at'])).toEqual(['at', 'at\'ı']);            // kısa kelimede ek sayılmaz
      expect(bul('renk kodu ve renk', ['renk', 'renk kodu'])).toEqual(['renk kodu', 'renk']); // uzun olan önce
      expect(bul('a.b axb (c++)', ['a.b', 'c++'])).toEqual(['a.b', 'c++']);        // düzenli ifade karakteri kaçırılır
    });
    it('kaydet: yazı depoya, aynı ad reddedilir, başka yazılış bulunur; eski notun biçimi değişmez', () => ile(async s => {
      const n = await D().yeni('Eski', 'Renkot sürüldü');
      const onceki = JSON.stringify(s.depo['defter/' + n.id]);
      const t = await D().terimKaydet({ ad:' Renkot ', es:['kaplama, ', 'Renkot'], tanim:'Astar boyası' });
      expect(s.depo['defterterim/' + t.id].ad).toBe('Renkot');
      expect(t.es).toEqual(['kaplama,']);
      let hata = null; try{ await D().terimKaydet({ ad:'renkot', tanim:'x' }); }catch(e){ hata = e.message; }
      expect(hata).toContain('zaten sözlükte');
      hata = null; try{ await D().terimKaydet({ ad:' a ' }); }catch(e){ hata = e.message; }
      expect(hata).toContain('en az iki');
      expect(JSON.stringify(s.depo['defter/' + n.id])).toBe(onceki);
      expect(D().terimGecenler(t).map(x => x.n.id)).toEqual([n.id]);
      D()._sifirla();
      D().kur({ modul:'test', store:{ list:async c => Object.keys(s.depo).filter(k => k.indexOf(c + '/') === 0).map(k => s.depo[k]), set:async () => {}, remove:async () => {} } });
      await D().yukle();
      expect(D().terimler().map(x => x.ad)).toEqual(['Renkot']);
      expect(D().terimNotlari()[0]).toEqual({ id:t.id, baslik:'Renkot', govde:'Astar boyası' });   // King bulur
    }));
    it('resim ve belge cihazda kalır: depoya yalnız kimlik gider; silince medya da silinir', () => ile(async s => {
      const r = await D().medyaEkle(new Blob(['%PDF-gizli'], { type:'application/pdf' }), { ad:'renkot.pdf' });
      const t = await D().terimKaydet({ ad:'Renkot', tanim:'', ekler:[r.kayit.id, '<script>'] });
      expect(t.ekler).toEqual([r.kayit.id]);                                       // kimlik denetlenir
      expect(JSON.stringify(s.depo).indexOf('%PDF-gizli') < 0).toBe(true);
      await D().terimSil(t.id);
      expect(s.m[r.kayit.id]).toBe(undefined);
      expect(s.depo['defterterim/' + t.id]).toBe(undefined);
    }));
    it('yedek: kelime ve eki taşınır; sözlüğü olmayan eski yedek hatasız yüklenir, not kaybolmaz', () => ile(async s => {
      const eskiYedek = { app:'lifeos-defter', surum:1, notlar:[{ id:'neski', baslik:'Eski not', govde:'g', klasor:'Fizik', tur:'belge' }], medya:[] };
      const r0 = await D().yedekYukle(eskiYedek);
      expect([r0.not, r0.terim]).toEqual([1, 0]);
      const n0 = D().notlar().find(x => x.id === 'neski');
      expect([n0.klasor, n0.tur]).toEqual(['Fizik', 'belge']);                     // eskiden düşüyordu
      const m = await D().medyaEkle(new Blob(['png'], { type:'image/png' }), { ad:'k.png' });
      const t = await D().terimKaydet({ ad:'Renkot', tanim:'yazı', ekler:[m.kayit.id] });
      const y = await D().yedekNesnesi();
      expect([y.terimler.length, y.medya.length]).toEqual([1, 1]);
      await D().terimSil(t.id);
      const r = await D().yedekYukle(y);
      expect([r.terim, r.medya]).toEqual([1, 1]);
      expect(D().terimler()[0].tanim).toBe('yazı');
      const r2 = await D().yedekYukle(y);
      expect(r2.terim).toBe(0);                                                    // ezmez, iki kez eklemez
    }));
    it('okuma: kelime işaretlenir; kod ve bağlantı işaretlenmez; metin kaçırılır', () => ile(async () => {
      const t = await D().terimKaydet({ ad:'Renkot', tanim:'<img src=x onerror=alert(1)> astar' });
      const n = await D().yeni('Not', 'Renkot sürüldü `Renkot` [[Renkot]] renkotun');
      D().ac({ id:n.id });
      const el = document.getElementById('defter');
      const isaret = Array.from(el.querySelectorAll('[data-defter-oku] [data-defter-terim]'));
      expect(isaret.map(a => a.textContent)).toEqual(['Renkot', 'renkotun']);
      expect(isaret[0].getAttribute('data-defter-terim')).toBe(t.id);
      /* tıkla: kart açılır, tanım kaçırılmıştır; ikinci kez fareyle kapanır */
      isaret[0].dispatchEvent(new MouseEvent('click', { bubbles:true, detail:1 }));
      await bekle();
      const k = el.querySelector('.defter__kart');
      expect(k.getAttribute('role')).toBe('dialog');
      expect(k.textContent).toContain('astar');
      expect(!!k.querySelector('img')).toBe(false);
      expect(k.textContent).toContain('1 notta geçiyor');
      expect(isaret[0].getAttribute('aria-expanded')).toBe('true');
      isaret[0].dispatchEvent(new MouseEvent('click', { bubbles:true, detail:1 }));
      expect(!!el.querySelector('.defter__kart')).toBe(false);
    }));
    it('derin bağlantı: #defter=<id> o notu açar ve adresten silinir (Bilinç haritası atıfları)', () => ile(async () => {
      const n = await D().yeni('Stoacılık', 'Kontrol edebildiklerin');
      const eski = location.hash;
      location.hash = 'defter=' + n.id;
      D().derinAc();
      await bekle(); await bekle();
      const el = document.getElementById('defter');
      expect(!!el).toBe(true);
      expect(el.textContent).toContain('Stoacılık');
      expect(location.hash).toBe('');
      D().kapat();
      if(eski) location.hash = eski;
    }));
    it('kart: fareyle üstüne gelince açılır, ayrılınca kapanır; Enter karta geçirir, Esc yalnız kartı kapatıp işarete döner', () => ile(async () => {
      await D().terimKaydet({ ad:'Renkot', tanim:'astar' });
      const n = await D().yeni('Not', 'Renkot sürüldü');
      D().ac({ id:n.id });
      const el = document.getElementById('defter');
      const a = el.querySelector('[data-defter-oku] [data-defter-terim]');
      const fare = (h, tur) => h.dispatchEvent(Object.assign(new MouseEvent('pointerover', { bubbles:true }), { pointerType:tur || 'mouse' }));
      fare(a, 'touch');
      await bekle(160);
      expect(!!el.querySelector('.defter__kart')).toBe(false);                    // dokunuş üzerine gelme sayılmaz
      fare(a);
      await bekle(160);
      expect(!!el.querySelector('.defter__kart')).toBe(true);
      fare(el.querySelector('.defter__kart'));
      await bekle(240);
      expect(!!el.querySelector('.defter__kart')).toBe(true);                     // kartın üstünde durur
      fare(el.querySelector('[data-defter-baslik]'));
      await bekle(240);
      expect(!!el.querySelector('.defter__kart')).toBe(false);
      /* fareyle açık kartta odak sayfadadır: Esc yine yalnız kartı kapatır */
      fare(a);
      await bekle(160);
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(!!el.querySelector('.defter__kart')).toBe(false);
      a.focus();
      a.click();                                                                  // klavye Enter'ı: detail 0
      await bekle();
      expect(el.querySelector('.defter__kart').contains(document.activeElement)).toBe(true);
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(!!el.querySelector('.defter__kart')).toBe(false);
      expect(!!document.getElementById('defter')).toBe(true);                     // Defter açık kalır
      expect(document.activeElement).toBe(a);
    }));
    it('form: seçili kelime dolu gelir; ek eklenip vazgeçilirse cihazda yetim kalmaz; kaydedince not işaretlenir', () => ile(async s => {
      const n = await D().yeni('Not', 'Renkot sürüldü');
      D().ac({ id:n.id, duzen:true });
      await bekle();
      const el = document.getElementById('defter');
      const ta = el.querySelector('[data-defter-govde]');
      ta.setSelectionRange(0, 6);
      el.querySelector('[data-defter="terim-yeni"]').click();
      const f = () => el.querySelector('.defter-terim');
      expect(f().querySelector('[data-terim="ad"]').value).toBe('Renkot');
      expect(f().textContent).toContain('yalnız bu cihazda kalır');
      const dosya = f().querySelector('[data-terim="dosya"]');
      const dt = new DataTransfer(); dt.items.add(new File(['x'], 'b.pdf', { type:'application/pdf' }));
      dosya.files = dt.files;
      dosya.dispatchEvent(new Event('change', { bubbles:true }));
      await bekle(20);
      expect(f().querySelector('[data-terim="ekler"]').textContent).toContain('b.pdf');
      expect(Object.keys(s.m).length).toBe(1);
      f().querySelector('[data-terim-is="vazgec"]').click();
      await bekle(20);
      expect(Object.keys(s.m).length).toBe(0);
      expect(D().terimler().length).toBe(0);
      const ta2 = el.querySelector('[data-defter-govde]');
      ta2.setSelectionRange(0, 6);
      el.querySelector('[data-defter="terim-yeni"]').click();
      f().querySelector('[data-terim="tanim"]').value = 'Astar';
      f().querySelector('[data-terim-is="kaydet"]').click();
      await bekle(20);
      expect(!!f()).toBe(false);
      expect(D().terimler()[0].ad).toBe('Renkot');
      expect(el.querySelector('[data-defter-not-terim]').textContent).toContain('Renkot');   // yazarken çip
      el.querySelector('[data-defter="oku"]').click();
      await bekle(20);
      expect(!!el.querySelector('[data-defter-oku] [data-defter-terim]')).toBe(true);
    }));
    it('yazarken: listede Enter sürdürür, boş maddede biter; [[ not adı önerir', () => ile(async () => {
      expect(D().enterDevam('- a', 3)).toEqual({ metin:'- a\n- ', imlec:6 });
      expect(D().enterDevam('- [x] a', 7)).toEqual({ metin:'- [x] a\n- [ ] ', imlec:14 });
      expect(D().enterDevam('3. a', 4)).toEqual({ metin:'3. a\n4. ', imlec:8 });
      expect(D().enterDevam('x\n- ', 4)).toEqual({ metin:'x\n', imlec:2 });
      expect(D().enterDevam('düz yazı', 8)).toBe(null);
      const l = [{ id:'1', baslik:'Türev' }, { id:'2', baslik:'Limit' }, { id:'3', baslik:'' }];
      expect(D().baglantiOneri('bak [[tü', 8, l, null)).toEqual({ bas:6, adaylar:['Türev'] });
      expect(D().baglantiOneri('bak [[', 6, l, '2').adaylar).toEqual(['Türev']);
      expect(D().baglantiOneri('bak [[x]] sonra', 15, l, null)).toBe(null);
      const a = await D().yeni('Türev', '');
      const b = await D().yeni('Yazılan', '[[tü');
      D().ac({ id:b.id, duzen:true });
      await bekle();
      const el = document.getElementById('defter'), ta = el.querySelector('[data-defter-govde]');
      ta.setSelectionRange(4, 4);
      ta.dispatchEvent(new Event('input', { bubbles:true }));
      const oneri = el.querySelector('[data-defter-oneri-sec]');
      expect(oneri.textContent).toBe('Türev');
      oneri.click();
      await bekle();
      expect(ta.value).toBe('[[Türev]]');
      expect(a.id !== b.id).toBe(true);
    }));
    it('başlıkta Enter gövdeye geçer; «Kaydedildi» görünür', () => ile(async s => {
      const n = await D().yeni('A', '');
      D().ac({ id:n.id });
      await bekle();
      const el = document.getElementById('defter');
      const bas = el.querySelector('[data-defter-baslik]');
      bas.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', bubbles:true }));
      expect(document.activeElement).toBe(el.querySelector('[data-defter-govde]'));
      const ta = el.querySelector('[data-defter-govde]');
      ta.value = 'yazı';
      ta.dispatchEvent(new Event('input', { bubbles:true }));
      expect(el.querySelector('[data-defter-durum]').textContent).toContain('Kaydediliyor');
      await bekle(560);
      expect(el.querySelector('[data-defter-durum]').textContent).toBe('Kaydedildi');
      expect(s.depo['defter/' + n.id].govde).toBe('yazı');
    }));
  });

  /* Modüller ayrı kökendir: öbür modülün notu sunucudan salt okunur gelir. */
  describe('Defter — modül gezgini', () => {
    const bekle = ms => new Promise(r => setTimeout(r, ms || 0));
    const H = () => window.LIFEOS.HESAP;
    async function disli(fn){
      const eski = H().defter;
      H().defter = async () => ({ moduller:[
        { modul:'ays', notlar:[], terimler:[] },
        { modul:'spi', notlar:[{ id:'s1', baslik:'Uyku', govde:'Melatonin\n![[medya:mspi1]]\n- [ ] sor\n[[Beslenme]]', klasor:'Sağlık' }, { id:'s2', baslik:'Beslenme', govde:'protein' }],
          terimler:[{ id:'ts', ad:'Melatonin', tanim:'Uyku hormonu', ekler:['mspi2'] }] },
        { modul:'esp', notlar:[], terimler:[] } ] });
      try{
        await ile(async s => {
          D()._sifirla();
          D().kur({ modul:'ays', store:{ set:async (p, d) => { s.depo[p] = JSON.parse(JSON.stringify(d)); }, list:async () => [], remove:async p => { delete s.depo[p]; } } });
          await fn(s);
        });
      }finally{ H().defter = eski; }
    }
    it('gezgin öbür modülleri gösterir; notu açınca yalnız okunur, kutu kilitli, medya «orada» der', () => disli(async s => {
      await D().yeni('Benim', 'Melatonin aldım');
      D().ac();
      await bekle(20);
      const el = document.getElementById('defter');
      const spi = el.querySelector('[data-defter-kapsam="spi"]');
      expect(spi.textContent).toContain('2');
      spi.click();
      await bekle();
      expect(el.querySelector('[data-defter-liste]').textContent).toContain('Uyku');
      expect(el.querySelector('[data-defter-agac]').textContent).toContain('Sağlık');
      el.querySelector('[data-defter-dis-ac="s1"]').click();
      await bekle(20);
      const sag = el.querySelector('[data-defter-sag]');
      expect(sag.textContent).toContain('yalnız okunur');
      expect(!!sag.querySelector('[data-defter-baslik]')).toBe(false);
      expect(!!sag.querySelector('[data-defter-govde]')).toBe(false);
      expect(sag.querySelector('input[type="checkbox"]').disabled).toBe(true);
      expect(sag.textContent).toContain('öteki modülde kayıtlı');
      expect(sag.querySelector('[data-defter-terim]').textContent).toBe('Melatonin');    // öbür modülün sözlüğü
      /* bağlantı orada aranır, bu modülde boş not açılmaz */
      const sayi = D().notlar().length;
      sag.querySelector('[data-defter-git="Beslenme"]').click();
      await bekle();
      expect(sag.textContent).toContain('protein');
      expect(D().notlar().length).toBe(sayi);
      expect(Object.keys(s.depo).some(k => k.indexOf('s1') >= 0)).toBe(false);           // öbür modülün kaydı buraya yazılmaz
    }));
    it('buraya kopyala: metin bu modüle gelir, medya yerine not kalır; kaynak değişmez', () => disli(async () => {
      await D().disYukle();
      const n = await D().disKopyala('spi', 's1');
      expect(n.klasor).toBe("SPİ'den");
      expect(n.govde).toContain('Melatonin');
      expect(n.govde.indexOf('![[medya:') < 0).toBe(true);
      expect(n.govde).toContain('SPİ modülünde kaldı');
      expect(await D().disKopyala('spi', 'yok')).toBe(null);
    }));
    it('arama bütün modüllerde ve sözlükte arar; sunucu yoksa Defter yine açılır ve söyler', () => disli(async () => {
      await D().yeni('Benim', 'melatonin aldım');
      D().ac();
      await bekle(20);
      const el = document.getElementById('defter'), a = el.querySelector('[data-defter-ara]');
      a.value = 'melatonin';
      a.dispatchEvent(new Event('input', { bubbles:true }));
      const l = el.querySelector('[data-defter-liste]');
      expect(!!l.querySelector('[data-defter-terim-ac="ts"]')).toBe(true);
      expect(!!l.querySelector('[data-defter-dis-ac="s1"]')).toBe(true);
      expect(l.textContent).toContain('Benim');
      D().kapat();
      H().defter = async () => { throw new Error('ağ yok'); };
      await D().disYukle();
      D().ac();
      await bekle(20);
      const el2 = document.getElementById('defter');
      expect(!!el2.querySelector('[data-defter-kapsam="spi"]')).toBe(false);
      expect(el2.querySelector('[data-defter-agac]').textContent).toContain('bilgisayarın açıkken');
      expect(!!el2.querySelector('[data-defter-kapsam=""]')).toBe(true);
    }));
    it('taşıma: klasör seçili yeni not orada açılır; kendi modülün gezgininde klasör yönetilir', () => disli(async () => {
      const n = await D().yeni('Taşınacak', 'x', 'not', '');
      await D().klasorEkle('Fizik');
      D().ac({ id:n.id });
      await bekle(20);
      const el = document.getElementById('defter');
      const s = el.querySelector('[data-defter-not-klasor]');
      s.value = 'Fizik';
      s.dispatchEvent(new Event('change', { bubbles:true }));
      await bekle(10);
      expect(D().notlar()[0].klasor).toBe('Fizik');
      expect(el.querySelector('[data-defter-klasor="Fizik"]').textContent).toContain('1');
      /* sürükle bırak */
      const dt = new DataTransfer();
      el.querySelector('[data-defter-ac]').dispatchEvent(new DragEvent('dragstart', { bubbles:true, dataTransfer:dt }));
      el.querySelector('[data-defter-klasor=""]').dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer:dt }));
      await bekle(10);
      expect(D().notlar()[0].klasor).toBe('');
    }));
  });

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
