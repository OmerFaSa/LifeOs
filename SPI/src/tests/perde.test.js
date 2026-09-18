/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/perde.test.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* Perde — marka girişi ve seviye kutlaması.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/perde.test.js`; `python3 tools/seviye.py --yay`
   ile üç arayüzün `src/tests/` klasörüne kopyalanır.

   Perde GERÇEK DOM'da sınanır: test koşucusu zaten tarayıcıda çalışıyor,
   sahte bir DOM kurmak sınanan şeyi değiştirmek olurdu.

   VİDEO OYNATILMAZ. Denetim tarayıcısı H.264 çözemez ve bir test
   dosyasını depoya koymak, sınanan şeyi taşıyan dosyayı sınamak olurdu.
   Bu yüzden video BAĞIMLI davranışlar (ses açma kararı gibi) saf
   fonksiyona çıkarılmış hâliyle sınanır; geri kalan her şey —banner,
   Geç, Esc, sıra, odak— videosuz da aynıdır. */

(function(){
  const { describe, it, expect } = SP.Test;
  const P = SP.Perde;
  const L = window.LIFEOS;

  const bekle = ms => new Promise(r => setTimeout(r, ms));

  function perdeler(){ return document.querySelectorAll('.perde'); }
  function acikPerde(){ return document.querySelector('.perde'); }

  function temiz(){
    P.hepsiniKapat();
    try{ localStorage.removeItem(P.SES_ANAHTAR); }catch(e){}
  }

  function banner(kademeNo){
    const k = L.KADEME_ILE(kademeNo);
    return { no:kademeNo, ustyazi:'Yeni kademe', ad:k.ad, etiket:'KADEME ' + kademeNo + '.1',
      slogan:k.slogan, renk:k.renk, isik:k.isik };
  }

  describe('perde — açılır, çizer, kapanır', () => {

    it('videosuz perde banner çizer', () => {
      temiz();
      P.ac({ banner:banner(3), enAz:60000 });
      const el = acikPerde();
      expect(!!el).toBe(true);
      expect(el.querySelector('.perde__banner').textContent).toContain('Altın');
      temiz();
    });

    it('videosuz perdede ses düğmesi yoktur — kapatılacak ses yok', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      expect(acikPerde().querySelector('.perde__ses')).toBeNull();
      temiz();
    });

    it('«Geç» düğmesi halka, sayaç ve yazı taşır', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const gec = acikPerde().querySelector('.perde__gec');
      expect(!!gec.querySelector('.perde__gec-yol')).toBe(true);
      expect(!!gec.querySelector('.perde__gec-sayi')).toBe(true);
      expect(gec.textContent).toContain('Geç');
      temiz();
    });

    it('«Geç» tıklaması perdeyi kaldırır', async () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      acikPerde().querySelector('.perde__gec').click();
      await bekle(520);
      expect(perdeler()).toHaveLength(0);
      temiz();
    });

    it('Esc perdeyi kaldırır', async () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      await bekle(520);
      expect(perdeler()).toHaveLength(0);
      temiz();
    });

    it('kapanınca `bitti` çağrılır — kutlamayı damgalayan kanca budur', async () => {
      temiz();
      let bitti = 0;
      P.ac({ banner:banner(1), enAz:60000, bitti:() => { bitti++; } });
      acikPerde().querySelector('.perde__gec').click();
      await bekle(520);
      expect(bitti).toBe(1);
      temiz();
    });

    it('videosuz perde kendi süresini doldurunca kendiliğinden kapanır', async () => {
      temiz();
      P.ac({ banner:banner(1), enAz:300 });
      await bekle(1200);
      expect(perdeler()).toHaveLength(0);
      temiz();
    });

    it('perde açıkken sayfa kaymaz, kapanınca serbest kalır', async () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      expect(document.documentElement.style.overflow).toBe('hidden');
      acikPerde().querySelector('.perde__gec').click();
      await bekle(520);
      expect(document.documentElement.style.overflow).toBe('');
      temiz();
    });
  });

  describe('aynı anda TEK perde — ikisi üst üste binmez', () => {

    it('ikinci perde sıraya girer, ekranda tek perde kalır', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const ikinci = P.ac({ banner:banner(2), enAz:60000 });
      expect(ikinci.sirada).toBe(true);
      expect(perdeler()).toHaveLength(1);
      expect(acikPerde().querySelector('.perde__banner').textContent).toContain('Bronz');
      temiz();
    });

    it('birincisi kapanınca sıradaki açılır', async () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      P.ac({ banner:banner(2), enAz:60000 });
      acikPerde().querySelector('.perde__gec').click();
      await bekle(560);
      expect(perdeler()).toHaveLength(1);
      expect(acikPerde().querySelector('.perde__banner').textContent).toContain('Gümüş');
      temiz();
    });

    it('sıradaki iptal edilirse hiç açılmaz', async () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const ikinci = P.ac({ banner:banner(2), enAz:60000 });
      ikinci.kapat();
      acikPerde().querySelector('.perde__gec').click();
      await bekle(560);
      expect(perdeler()).toHaveLength(0);
      temiz();
    });
  });

  describe('rütbe medyası — adlar etiketten türer', () => {

    it('kart adresi etiketten üretilir', () => {
      expect(P.kartYolu({ etiket:'5.2', kademe:5 })).toBe('img/seviye/rutbe-5-2.webp');
      expect(P.kartYolu({ etiket:'K300', kademe:6 })).toBe('img/seviye/rutbe-k300.webp');
    });

    it('sahne adresi KADEMEDEN üretilir — üç rütbe aynı sahneyi paylaşır', () => {
      expect(P.sahneYolu({ etiket:'4.1', kademe:4 })).toBe('img/seviye/sahne-4.webp');
      expect(P.sahneYolu({ etiket:'4.3', kademe:4 })).toBe('img/seviye/sahne-4.webp');
    });

    it('kök değiştirilebilir — tek dosya sürümü başka yerden okur', () => {
      expect(P.kartYolu({ etiket:'5.2', kademe:5 }, 'medya/')).toBe('medya/rutbe-5-2.webp');
      expect(P.sahneYolu({ etiket:'5.2', kademe:5 }, 'medya/')).toBe('medya/sahne-5.webp');
    });

    it('idle video bayrak KAPALIYKEN hiç istenmez', () => {
      /* Bayrak kapalıyken her kutlamada bulunamayacağı bilinen bir
         dosya istenirdi. `null` dönmesi, hiç istek yapılmaması
         demektir. */
      const eski = L.RUTBE_VIDEO;
      L.RUTBE_VIDEO = false;
      expect(P.kartVideoYolu({ etiket:'5.2', kademe:5 })).toBeNull();
      L.RUTBE_VIDEO = true;
      expect(P.kartVideoYolu({ etiket:'5.2', kademe:5 })).toBe('img/seviye/rutbe-5-2.mp4');
      L.RUTBE_VIDEO = eski;
    });

    it('yeni kademe daha uzun durur — okunacak bir ad ve slogan vardır', () => {
      expect(P.kutlamaSuresi({ yeniKademe:true }))
        .toBeGreaterThan(P.kutlamaSuresi({ yeniKademe:false }));
    });
  });

  describe('haberci — perdeden ÖNCE çıkar, Space onu geçer', () => {

    const yukselme = no => ({ kademe:no, basamak:1, etiket:no + '.1',
      kademeBilgi:L.KADEME_ILE(no), yeniKademe:true });

    function haberciler(){ return document.querySelectorAll('.haberci'); }

    it('kutlama önce HABERCİ açar, perde AÇMAZ', () => {
      temiz();
      const az = !!(window.matchMedia
        && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const r = P.kutla(yukselme(3));
      if(az){
        expect(r.sessiz).toBe(true);
        expect(haberciler()).toHaveLength(0);
      }else{
        expect(r.haberci).toBe(true);
        expect(haberciler()).toHaveLength(1);
        /* ÖNEMLİ: bu anda perde YOKTUR. Kullanıcı hâlâ kendi
           ekranında; üç saniyesi var. */
        expect(perdeler()).toHaveLength(0);
      }
      temiz();
    });

    it('haberci hangi rütbe olduğunu söyler', () => {
      temiz();
      if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      P.kutla(yukselme(3));
      const metin = document.querySelector('.haberci').textContent;
      expect(metin).toContain('Altın');
      expect(metin).toContain('3.1');
      temiz();
    });

    it('SPACE perdeye HİÇ SOKMAZ ama kutlamayı damgalar', async () => {
      temiz();
      if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let damga = 0;
      P.kutla(yukselme(2), { bitti:() => { damga++; } });
      document.dispatchEvent(new KeyboardEvent('keydown', { key:' ', bubbles:true }));
      await bekle(320);
      /* Perde hiç açılmadı — ve bir daha da açılmayacak. */
      expect(perdeler()).toHaveLength(0);
      expect(haberciler()).toHaveLength(0);
      /* Ama rütbe KAZANILDI: `bitti` çağrılmazsa aynı kutlama her
         açılışta yeniden çıkardı. */
      expect(damga).toBe(1);
      temiz();
    });

    it('«Geç» düğmesi de aynı şeyi yapar — dokunmatikte Space yoktur', async () => {
      temiz();
      if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let damga = 0;
      P.kutla(yukselme(2), { bitti:() => { damga++; } });
      document.querySelector('.haberci__gec').click();
      await bekle(320);
      expect(perdeler()).toHaveLength(0);
      expect(damga).toBe(1);
      temiz();
    });

    it('iki kez geçilse bile damga BİR kez vurulur', async () => {
      temiz();
      if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let damga = 0;
      const r = P.kutla(yukselme(2), { bitti:() => { damga++; } });
      r.kapat();
      r.kapat();
      await bekle(320);
      expect(damga).toBe(1);
      temiz();
    });

    it('geri sayım üç saniyedir', () => {
      expect(P.HABERCI_MS).toBe(3000);
    });
  });

  describe('rütbe perdesi — kart, sahne ve yazı', () => {

    it('kart ve sahne katmanları kurulur', () => {
      temiz();
      P.ac({ sinif:'perde--rutbe', banner:banner(4), enAz:60000,
        kart:'img/seviye/rutbe-4-1.webp', sahne:'img/seviye/sahne-4.webp' });
      const el = acikPerde();
      expect(!!el.querySelector('.perde__kart-gorsel')).toBe(true);
      expect(!!el.querySelector('.perde__sahne')).toBe(true);
      temiz();
    });

    it('kart YOKSA banner tek başına kutlamayı taşır', () => {
      temiz();
      P.ac({ sinif:'perde--rutbe', banner:banner(3), enAz:60000 });
      const el = acikPerde();
      expect(el.querySelector('.perde__kart')).toBeNull();
      expect(el.querySelector('.perde__banner').textContent).toContain('Altın');
      temiz();
    });

    it('banner kademenin adını, etiketini ve sloganını söyler', () => {
      temiz();
      P.ac({ banner:banner(3), enAz:60000 });
      const metin = acikPerde().querySelector('.perde__banner').textContent;
      expect(metin).toContain('Altın');
      expect(metin).toContain(L.KADEME_ILE(3).slogan);
      temiz();
    });

    it('rozet görseli yoksa kademe numarası çizilir', () => {
      temiz();
      P.ac({ banner:banner(4), enAz:60000 });
      const rozet = acikPerde().querySelector('.perde__rozet');
      /* Görsel <img> olarak denenir; yüklenemezse numaraya düşer.
         Test anında ikisinden biri duruyor olmalı — boş bir daire
         «sistem hazır değil» demek olurdu. */
      expect(rozet.children.length).toBeGreaterThan(0);
      temiz();
    });

    it('kutlama yoksa ne haberci ne perde açılır', () => {
      temiz();
      expect(P.kutla(null)).toBeNull();
      expect(perdeler()).toHaveLength(0);
      expect(document.querySelectorAll('.haberci')).toHaveLength(0);
    });
  });

  describe('ses — «Sesi aç» düğmesi sesi AÇAR', () => {

    it('düğmenin üstündeki dokunuş kendiliğinden ses açmaz', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const araclar = acikPerde().querySelector('.perde__araclar');
      const gec = araclar.querySelector('.perde__gec');
      /* Bu satır olmadan düğme TERS çalışıyordu: dokunuş sesi açıyor,
         hemen ardından düğmenin kendi dinleyicisi kapatıyordu. */
      expect(P.kendiliginenAcilsinMi(gec, araclar, true)).toBe(false);
      temiz();
    });

    it('perdenin dışındaki ilk dokunuş sessiz videoyu açar', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const araclar = acikPerde().querySelector('.perde__araclar');
      expect(P.kendiliginenAcilsinMi(document.body, araclar, true)).toBe(true);
      temiz();
    });

    it('video zaten sesliyse dokunuş bir şey yapmaz', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const araclar = acikPerde().querySelector('.perde__araclar');
      expect(P.kendiliginenAcilsinMi(document.body, araclar, false)).toBe(false);
      temiz();
    });

    it('kullanıcı sesi KENDİ kapattıysa dokunuş onu geri açmaz', () => {
      temiz();
      try{ localStorage.setItem(P.SES_ANAHTAR, 'kapali'); }catch(e){}
      P.ac({ banner:banner(1), enAz:60000 });
      const araclar = acikPerde().querySelector('.perde__araclar');
      expect(P.kendiliginenAcilsinMi(document.body, araclar, true)).toBe(false);
      temiz();
    });

    it('tercih yazılmamışken ses AÇIK sayılır', () => {
      temiz();
      expect(P.sesTercihi()).toBe('acik');
    });

    it('tercih üç uygulamada da AYNI anahtarda durur', () => {
      expect(P.SES_ANAHTAR).toBe('lifeos.perde.ses');
    });
  });

  describe('erişilebilirlik — perde bir iletişim kutusudur', () => {

    it('perde ad taşır ve modal olduğunu söyler', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000, baslik:'Seviye atladın' });
      const el = acikPerde();
      expect(el.getAttribute('role')).toBe('dialog');
      expect(el.getAttribute('aria-modal')).toBe('true');
      expect(el.getAttribute('aria-label')).toBe('Seviye atladın');
      temiz();
    });

    it('açılışta odak «Geç» düğmesindedir — klavyeyle gelen kapatabilsin', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      expect(document.activeElement.classList.contains('perde__gec')).toBe(true);
      temiz();
    });

    it('Tab perdenin dışına çıkmaz', () => {
      temiz();
      P.ac({ banner:banner(1), enAz:60000 });
      const el = acikPerde();
      const olay = new KeyboardEvent('keydown', { key:'Tab', bubbles:true });
      let engellendi = false;
      olay.preventDefault = () => { engellendi = true; };
      document.dispatchEvent(olay);
      expect(engellendi).toBe(true);
      expect(el.contains(document.activeElement)).toBe(true);
      temiz();
    });
  });
})();
