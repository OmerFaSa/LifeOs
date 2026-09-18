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

  describe('kutlama — kademe atlamak ile basamak atlamak ayrı çizilir', () => {

    it('yeni kademede o kademenin videosu istenir', () => {
      expect(P.kutlamaVideosu({ kademe:2, yeniKademe:true }))
        .toBe('img/seviye/kademe-2.mp4');
    });

    it('yalnız basamak atlandıysa video İSTENMEZ — her 1.2\'de video izletilmez', () => {
      expect(P.kutlamaVideosu({ kademe:1, yeniKademe:false })).toBeNull();
    });

    it('video kökü değiştirilebilir — tek dosya sürümü başka yerden okur', () => {
      expect(P.kutlamaVideosu({ kademe:5, yeniKademe:true }, 'medya/'))
        .toBe('medya/kademe-5.mp4');
    });

    it('basamak kutlaması banner ile çizilir', () => {
      temiz();
      P.kutla({ kademe:1, basamak:2, etiket:'1.2',
        kademeBilgi:L.KADEME_ILE(1), yeniKademe:false });
      expect(acikPerde().querySelector('.perde__video')).toBeNull();
      expect(acikPerde().querySelector('.perde__banner').textContent).toContain('Yeni basamak');
      temiz();
    });

    it('hareket azaltma tercihinde video oynamaz ama kutlama YAPILIR', () => {
      temiz();
      const az = window.matchMedia
        && matchMedia('(prefers-reduced-motion: reduce)').matches;
      P.kutla({ kademe:2, basamak:1, etiket:'2.1',
        kademeBilgi:L.KADEME_ILE(2), yeniKademe:true });
      const el = acikPerde();
      /* Kutlama her hâlükârda görünür: kademe atladığın bilgisi bir süs
         değil, kutlamanın kendisidir. Video ise tercihe uyar. */
      expect(el.querySelector('.perde__banner').hidden).toBe(!!az ? false : true);
      if(az) expect(el.querySelector('.perde__video')).toBeNull();
      temiz();
    });

    it('kutlama kademenin adını, etiketini ve sloganını söyler', () => {
      temiz();
      P.kutla({ kademe:3, basamak:2, etiket:'3.2',
        kademeBilgi:L.KADEME_ILE(3), yeniKademe:false });
      const metin = acikPerde().querySelector('.perde__banner').textContent;
      expect(metin).toContain('Altın');
      expect(metin).toContain('3.2');
      expect(metin).toContain(L.KADEME_ILE(3).slogan);
      temiz();
    });

    it('rozet görseli yoksa kademe numarası çizilir', () => {
      temiz();
      P.kutla({ kademe:4, basamak:1, etiket:'4.1',
        kademeBilgi:L.KADEME_ILE(4), yeniKademe:false });
      const rozet = acikPerde().querySelector('.perde__rozet');
      /* Görsel <img> olarak denenir; yüklenemezse numaraya düşer.
         Test anında ikisinden biri duruyor olmalı — boş bir daire
         «sistem hazır değil» demek olurdu. */
      expect(rozet.children.length).toBeGreaterThan(0);
      temiz();
    });

    it('kutlama yoksa perde açılmaz', () => {
      temiz();
      expect(P.kutla(null)).toBeNull();
      expect(perdeler()).toHaveLength(0);
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
