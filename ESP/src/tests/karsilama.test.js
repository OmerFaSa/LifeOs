/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/karsilama.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Karşılama ve Bugün kapağı (brand/ortak/karsilama.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/karsilama.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kullanıcı (2026-10-18): «modüle geçerken logo yerine italik bir yazıyla
   hoş geldin, merhaba, bugün zinde misin…; dili ayarlardan seçerim; altına
   küçük yazıyla o bölümün o anki notu; her bölüm için özelleştirilebilir
   mesajlar». Ve: «Bugün kısmı bambaşka, ana sayfa gibi olsun».

   Kanıtlanan sözler:
     1. Selam seçilen dilden ve günün saatinden gelir; modülün kendi
        selamları da havuzdadır. Aynı selam art arda gelmez.
     2. «Kendi selamlarım» seçiliyse yalnız onlar kullanılır.
     3. Alt not yalnız modülün KURAL cümlesinden ya da kullanıcının kendi
        notlarından gelir (§1.1, model yok). Dünden kalan kural cümlesi
        gösterilmez. Kapalıysa boş.
     4. Bozuk ayar varsayılana döner; liste uzunlukları sınırlıdır.
     5. Kapak metni kaçırır; ölçülmemiş sayı «—» yazılır, sıfır değil (§1.2). */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const K = () => window.LIFEOS.KARSILAMA;
  const SABAH = new Date(2026, 9, 18, 8, 30), AKSAM = new Date(2026, 9, 18, 19, 0), GECE = new Date(2026, 9, 18, 23, 40);

  describe('Karşılama — selam', () => {
    it('dil ve saat: sabah Türkçede «Günaydın» havuzda, İngilizcede «Good morning»', () => {
      const tr = K().havuz({ dil:'tr', modul:'spi', simdi:SABAH });
      expect(tr.indexOf('Günaydın') >= 0).toBeTruthy();
      expect(tr.indexOf('Bugün ne yapmayı planlıyorsun?') >= 0).toBeTruthy();   // modülün kendi selamı
      expect(tr.indexOf('İyi akşamlar') < 0).toBeTruthy();
      const en = K().havuz({ dil:'en', modul:'ays', simdi:AKSAM });
      expect(en.indexOf('Good evening') >= 0).toBeTruthy();
      expect(en.indexOf('Günaydın') < 0).toBeTruthy();
      expect(K().havuz({ dil:'tr', modul:'esp', simdi:GECE }).indexOf('Günaydın') < 0).toBeTruthy();
    });
    it('zorlama soru yok; bilinmeyen dil Türkçeye döner', () => {
      K().DILLER.forEach(d => ['ays', 'spi', 'esp'].forEach(m => [SABAH, AKSAM, GECE].forEach(s =>
        K().havuz({ dil:d.id, modul:m, simdi:s }).forEach(x => expect(/iyi misin/i.test(x)).toBe(false)))));
      expect(K().havuz({ dil:'xx', modul:'ays', simdi:SABAH }).indexOf('Günaydın') >= 0).toBeTruthy();
    });
    it('aynı selam art arda gelmez; kendi selamlarım seçiliyse yalnız onlar', () => {
      let once = '';
      for(let i = 0; i < 12; i++){
        const s = K().selam({ ayar:{ dil:'tr' }, modul:'ays', simdi:SABAH, tohum:i, once });
        expect(s === once).toBe(false);
        once = s;
      }
      const ayar = K().ayarOku({ selam:'kendi', kendi:['Selam Altay', 'Hadi bakalım'] });
      for(let i = 0; i < 6; i++) expect(['Selam Altay', 'Hadi bakalım'].indexOf(K().selam({ ayar, modul:'spi', simdi:SABAH, tohum:i })) >= 0).toBeTruthy();
    });
  });

  describe('Karşılama — türlü türlü (kullanıcı, 2026-10-18: «aynısını bir daha görmek zor bir ihtimal olsun»)', () => {
    const PZT = new Date(2026, 9, 19, 8, 30), CRS = new Date(2026, 9, 21, 14, 0);
    it('her modülün (Merkez dahil) Türkçe havuzunda en az 80 selam; birleşik selam tek virgüllü', () => {
      ['ays', 'spi', 'esp', 'hkm'].forEach(m => [PZT, CRS, GECE].forEach(s => {
        const l = K().havuz({ dil:'tr', modul:m, simdi:s });
        expect(l.length >= 80).toBeTruthy();
        expect(new Set(l).size).toBe(l.length);
        l.forEach(x => { expect(x.split(',').length <= 2).toBe(true); expect(x.length <= 60).toBe(true); });
      }));
      expect(K().havuz({ dil:'tr', modul:'ays', simdi:PZT }).indexOf('Günaydın, bugün hangi konu?') >= 0).toBeTruthy();
      expect(K().havuz({ dil:'tr', modul:'hkm', simdi:CRS }).indexOf('Merkeze hoş geldin') >= 0).toBeTruthy();
    });
    it('haftanın günü: pazartesi selamı yalnız pazartesi', () => {
      expect(K().gunTuru(PZT)).toBe('pzt');
      expect(K().havuz({ dil:'tr', modul:'spi', simdi:PZT }).indexOf('Yeni hafta, yeni sayfa') >= 0).toBeTruthy();
      expect(K().havuz({ dil:'tr', modul:'spi', simdi:CRS }).indexOf('Yeni hafta, yeni sayfa') < 0).toBeTruthy();
    });
    it('son görülen 40 selam yeniden gelmez; hepsi görülmüşse yine de bir selam gelir', () => {
      const gorulen = [];
      for(let i = 0; i < K().HATIRA; i++){
        const s = K().selam({ ayar:{ dil:'tr' }, modul:'esp', simdi:CRS, tohum:i * 7, once:gorulen.slice(-K().HATIRA) });
        expect(gorulen.indexOf(s) < 0).toBe(true);
        gorulen.push(s);
      }
      const l = K().havuz({ dil:'tr', modul:'esp', simdi:CRS });
      const s = K().selam({ ayar:{ dil:'tr' }, modul:'esp', simdi:CRS, tohum:3, once:l });
      expect(l.indexOf(s) >= 0 && s !== l[l.length - 1]).toBe(true);
    });
  });

  describe('Karşılama — alt not', () => {
    const BUGUN = '2026-10-18';
    it('sistem notu yalnız bugünün kural cümlesi; dünkü gösterilmez; kapalıysa boş', () => {
      const bugunku = { metin:'2/4 blok bitti; sırada türev.', gun:BUGUN };
      expect(K().not({ ayar:K().ayarOku({}), modul:'ays', onbellek:bugunku, bugun:BUGUN })).toBe('2/4 blok bitti; sırada türev.');
      expect(K().not({ ayar:K().ayarOku({}), modul:'ays', onbellek:{ metin:'eski', gun:'2026-10-17' }, bugun:BUGUN })).toBe('');
      expect(K().not({ ayar:K().ayarOku({ not:'kapali' }), modul:'ays', onbellek:bugunku, bugun:BUGUN })).toBe('');
    });
    it('kendi notlarım modüle göredir; «ikisi» önce sistemi, yoksa kendi notunu söyler', () => {
      const ayar = K().ayarOku({ not:'ikisi', notlar:{ ays:['Matematiği ihmal etme'], spi:['Suyunu iç'] } });
      expect(K().not({ ayar, modul:'spi', onbellek:null, bugun:BUGUN, tohum:0 })).toBe('Suyunu iç');
      expect(K().not({ ayar, modul:'ays', onbellek:{ metin:'Kural cümlesi.', gun:BUGUN }, bugun:BUGUN })).toBe('Kural cümlesi.');
      const kendi = K().ayarOku({ not:'kendi', notlar:{ ays:['Matematiği ihmal etme'] } });
      expect(K().not({ ayar:kendi, modul:'ays', onbellek:{ metin:'Kural cümlesi.', gun:BUGUN }, bugun:BUGUN, tohum:0 })).toBe('Matematiği ihmal etme');
      expect(K().not({ ayar:kendi, modul:'esp', onbellek:null, bugun:BUGUN })).toBe('');
    });
    it('bozuk ayar varsayılana döner; listeler sınırlı ve temiz', () => {
      const a = K().ayarOku({ dil:'xx', selam:'garip', not:'garip', kendi:['', '  Merhaba  ', 'x'.repeat(200)].concat(Array(30).fill('Selam')),
        notlar:{ ays:'metin', hkm:['yok'] } });
      expect([a.dil, a.selam, a.not]).toEqual(['tr', 'karisik', 'sistem']);
      expect(a.kendi[0]).toBe('Merhaba');
      expect(a.kendi.length <= K().EN_COK).toBeTruthy();
      expect(a.kendi.every(x => x.length <= K().EN_UZUN)).toBeTruthy();
      expect(a.notlar.ays).toEqual([]);
      expect(a.notlar.hkm).toBe(undefined);
    });
  });

  describe('Bugün kapağı', () => {
    it('metin kaçırılır; ölçülmemiş sayı «—», sıfır değil', () => {
      const h = K().kapakHtml({ modul:'ays', selam:'<b>Merhaba</b>', cumle:'2/4 blok bitti.',
        sayilar:[{ ad:'Blok', deger:'2/4', kesinlik:'computed' }, { ad:'Tekrar', deger:null }] });
      expect(h.indexOf('<b>Merhaba</b>') < 0).toBeTruthy();
      expect(h).toContain('&lt;b&gt;Merhaba&lt;/b&gt;');
      expect(h).toContain('<h1 class="kapak__cumle hero__title"');   // sayfanın başlığı kapaktadır
      expect(h).toContain('>—<');
      expect(h).toContain('data-kesinlik="veri_yok"');
    });
    it('görsel pano: halka yalnız hedef bilinince; seri sütun, girilmemiş gün nokta; git düğme olur (2026-10-20)', () => {
      const h = K().kapakHtml({ modul:'spi', cumle:'x', sayilar:[
        { ad:'Su', deger:'1.000', birim:'ml', kesinlik:'measured', oran:.5, git:'gun' },
        { ad:'Hareket', deger:40, birim:'dk', kesinlik:'measured', seri:[10, null, 40] },
        { ad:'Uyku', deger:null, halka:true },
        { ad:'Öğün', deger:null } ] });
      const d = document.createElement('div'); d.innerHTML = h;
      const k = Array.from(d.querySelectorAll('.kapak__sayi'));
      expect(k.map(x => x.getAttribute('data-simge'))).toEqual(['su', 'hareket', 'uyku', 'ogun']);
      expect(!!k[0].querySelector('.kapak__halka-dolu')).toBe(true);           // hedefin yarısı
      expect(k[0].tagName).toBe('BUTTON');
      expect(k[0].getAttribute('data-route')).toBe('gun');
      expect(!!k[1].querySelector('.kapak__halka')).toBe(false);               // hedef yok: halka yok
      expect(k[1].querySelectorAll('.kapak__sutun rect').length).toBe(2);
      expect(k[1].querySelectorAll('.kapak__sutun-bos').length).toBe(1);       // girilmemiş gün sıfır değil
      expect(!!k[2].querySelector('.kapak__halka-iz')).toBe(true);             // hedef var, kayıt yok: boş iz
      expect(!!k[2].querySelector('.kapak__halka-dolu')).toBe(false);
      expect(!!k[3].querySelector('.kapak__halka')).toBe(false);
      expect(d.querySelector('.kapak__sayilar').getAttribute('data-adet')).toBe('4');
    });
  });
})();
