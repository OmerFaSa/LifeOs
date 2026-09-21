/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/xp.test.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* Seviye ve XP — sözleşme.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/xp.test.js`; `python3 tools/seviye.py --yay` ile
   üç arayüzün `src/tests/` klasörüne kopyalanır; ad alanı yer tutucusu
   yayarken her uygulamanın kendi adıyla değiştirilir.

   Test adları birer CÜMLEDİR: bu liste okunduğunda seviye sisteminin
   sözleşmesi okunmuş olmalı. Testler, hangi sistemde koştuğunu
   BİLMEZ — etkinlikleri `XP.etkinlikler()` ile kendi sisteminden sorar.
   Böylece aynı dosya üçünde de aynı şeyi ispat eder.

   İKİ AYRI KATMAN, İKİ AYRI SINAMA BİÇİMİ

     EŞİK MATEMATİĞİ  `XP.konum(n)` saf bir fonksiyondur; deftere de
                      depoya da dokunmaz. On sekiz basamağın hepsi tek
                      tek, anında sınanır.
     DEFTER DAVRANIŞI `kazan/geriAl/buda` gerçek yazma yoludur ve gün
                      gün ilerletilerek sınanır.

   Önce ikisi de `kazan()` ile sınanıyordu: tepe basamağa ulaşmak için
   binlerce ardışık depo yazması gerekiyor, üstelik sınanan şey eşik
   matematiği değil yazma yolu oluyordu. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const XP = R.XP;
  const L = window.LIFEOS;

  const BAS = '2026-01-01';

  /* Bu sistemin tavansız (günde bir) ve tavanlı etkinlikleri. */
  function tavansiz(){
    return XP.etkinlikler().filter(e => e.tavan == null)[0];
  }
  function tavanli(){
    return XP.etkinlikler().filter(e => e.tavan != null)[0];
  }
  /* Bir günde en çok XP veren etkinlik — testin gün sayısını azaltır. */
  function enVerimli(){
    return XP.etkinlikler().slice()
      .sort((a, b) => XP.gunlukTavan(b) - XP.gunlukTavan(a))[0];
  }

  async function temiz(){
    resetState();
    await XP.sifirla();
  }

  /* Gün gün ilerleyerek XP topla.

     `gun` parametresi vermek yerine «bugün»ü ilerletiyoruz: motor artık
     bir haftadan eski güne yazmayı reddediyor (geriye dönük puan
     toplamak, ölçmeyi oyuna çevirir) ve gerçek kullanım da böyle olur —
     her gün o günün puanı yazılır. */
  async function gunGecir(i, fn){
    return withTodayAsync(XP.gunKaydir(BAS, i), fn);
  }

  /* En az `hedef` XP.

     `sonGun` de döner: budama TAKVİME göre çalıştığı için, geçmişe
     kurulmuş bir defterle devam eden testin «bugün»ü de o güne
     çekmesi gerekir. Yoksa bir sonraki yazma, kurulan bütün günleri
     yüz yirmi günden eski sayıp arşive atar — ki bu motorun DOĞRU
     davranışıdır, testin kurgusu yanlıştır. */
  async function xpTopla(hedef){
    const e = enVerimli();
    const gunluk = XP.gunlukTavan(e);
    const kere = Math.ceil(gunluk / e.xp);
    const gun = Math.ceil(hedef / gunluk);
    let son = null;
    for(let i = 0; i < gun; i++){
      son = await gunGecir(i, () => XP.kazan(e.id, { adet:kere }));
    }
    son.sonGun = XP.gunKaydir(BAS, gun - 1);
    son.gunlukKere = kere;
    son.etkinlik = e;
    return son;
  }

  /* En çok `hedef` XP — eşiğin ALTINDA kalmak için. */
  async function xpTamAlti(hedef){
    const e = enVerimli();
    const gunluk = XP.gunlukTavan(e);
    let kalan = hedef, i = 0, son = null;
    while(kalan >= e.xp && i < 400){
      const bugunluk = Math.min(gunluk, kalan - (kalan % e.xp));
      const kere = Math.floor(bugunluk / e.xp);
      son = await gunGecir(i, () => XP.kazan(e.id, { adet:kere }));
      kalan -= kere * e.xp;
      i++;
    }
    return son;
  }

  describe('seviye kataloğu — beşi noktalı, altıncısı sonsuz', () => {

    it('altı kademe vardır', () => {
      expect(L.KADEMELER).toHaveLength(6);
    });

    it('noktalı kademeler üç basamak taşır', () => {
      L.KADEMELER.filter(k => !k.etiketler)
        .forEach(k => expect(k.basamak).toHaveLength(L.BASAMAK_SAYISI));
    });

    it('KUTSAL on K basamağı taşır ve her etiketin bir maliyeti vardır', () => {
      const kutsal = L.KADEME_ILE(6);
      expect(kutsal.etiketler).toHaveLength(10);
      /* Etiket listesi ile maliyet listesi AYRI iki dizidir; biri
         diğerinden uzun kalırsa adı olan ama fiyatı olmayan (ya da
         tersi) bir basamak doğar ve merdiven sessizce eksilir. */
      expect(kutsal.basamak).toHaveLength(kutsal.etiketler.length);
    });

    it('toplam yirmi beş basamak üretilir', () => {
      expect(L.BASAMAKLAR).toHaveLength(25);
    });

    it('eşikler kesintisiz artar — bir basamak öncekinden ucuz olamaz', () => {
      let onceki = 0;
      L.BASAMAKLAR.forEach(b => {
        expect(b.esik).toBeGreaterThan(onceki);
        onceki = b.esik;
      });
    });

    it('etiket noktalı kademelerde kademe.basamak biçimindedir', () => {
      expect(L.BASAMAKLAR[0].etiket).toBe('1.1');
      expect(L.BASAMAKLAR[14].etiket).toBe('5.3');
    });

    it('KUTSAL etiketleri noktasızdır — K100 ile başlar, K1000 ile biter', () => {
      const k = L.BASAMAKLAR.filter(b => b.kademe === 6).map(b => b.etiket);
      expect(k[0]).toBe('K100');
      expect(k[k.length - 1]).toBe('K1000');
      /* Kutsal'da nokta ARANMAZ: bir gün «6.1» üretilirse hem ekranda
         hem dosya adında yanlış bir şey belirir. */
      k.forEach(e => expect(e.indexOf('.')).toBe(-1));
    });

    it('beşinci kademe SAFİR\'dir', () => {
      const s = L.KADEME_ILE(5);
      expect(s.ad).toBe('Safir');
      expect(s.id).toBe('safir');
    });

    it('zorluk eğrisi kademeden kademeye SERTLEŞİR', () => {
      /* Depo sahibinin tarifi: «bronz çok kolay, gümüş gene kolay,
         altın orta, yakut zor, safir çok zor, kutsal çok nadir».
         Sayıyı değil EĞRİYİ sınıyoruz: eşikler ayarlanabilir, ama bir
         kademe bir öncekinden ucuza gelemez. Önceki eğri düzdü ve
         Safir'e dört buçuk ayda geliniyordu. */
      const biten = n => {
        const b = L.BASAMAKLAR.filter(x => x.kademe === n);
        return b[b.length - 1].esik;
      };
      for(let n = 2; n <= 6; n++){
        const bu = biten(n) - (n > 1 ? biten(n - 1) : 0);
        const onceki = biten(n - 1) - (n > 2 ? biten(n - 2) : 0);
        /* Her kademe bir öncekinden EN AZ iki kat pahalı. */
        expect(bu >= onceki * 2).toBeTruthy();
      }
    });

    it('bir basamak bir gün-hafta işidir, bir kademe değil', () => {
      /* Kademeler arası fark hissedilmeli AMA basamaklar arası
         hissedilmemeli: basamak aylarca sürerse ilerleme durur ve
         merdiven işe yaramaz. İlk üç kademenin her basamağı, günlük
         tavanla en çok bir ayda geçilmeli. */
      const tavan = Math.max(L.GUNLUK_TAVAN('ays'), L.GUNLUK_TAVAN('spi'),
        L.GUNLUK_TAVAN('esp'));
      L.BASAMAKLAR.filter(b => b.kademe <= 3).forEach((b, i, hepsi) => {
        const onceki = i > 0 ? hepsi[i - 1].esik : 0;
        expect((b.esik - onceki) / tavan <= 31).toBeTruthy();
      });
    });

    it('Bronz ÇOK KOLAY: günlük tavanla bir haftadan kısa', () => {
      const tavan = Math.max(L.GUNLUK_TAVAN('ays'), L.GUNLUK_TAVAN('spi'),
        L.GUNLUK_TAVAN('esp'));
      const bronz = L.BASAMAKLAR.filter(b => b.kademe === 1);
      expect(bronz[bronz.length - 1].esik / tavan < 7).toBeTruthy();
    });

    it('Kutsal ÇOK NADİR: günlük tavanla bir yıldan uzun', () => {
      const tavan = Math.max(L.GUNLUK_TAVAN('ays'), L.GUNLUK_TAVAN('spi'),
        L.GUNLUK_TAVAN('esp'));
      const kutsal = L.BASAMAKLAR.filter(b => b.kademe === 6)[0];
      expect(kutsal.esik / tavan / 365 > 1).toBeTruthy();
    });

    it('kart adı kuralı — merkezdeki Python kopyasıyla AYNI', () => {
      /* Aynı örnekler `HKM/tests/test_profil.py` içinde de sınanıyor.
         Kural tek kaynaktan yayılıyor (`brand/seviye/ortak_kart.py`)
         ama iki dil iki ayrı yerde koşuyor; ayrışırlarsa önce bu iki
         test kırılır. */
      expect(L.MEDYA_ADI('1.1')).toBe('rutbe-1-1');
      expect(L.MEDYA_ADI('3.2')).toBe('rutbe-3-2');
      expect(L.MEDYA_ADI('5.3')).toBe('rutbe-5-3');
      expect(L.MEDYA_ADI('K100')).toBe('rutbe-k100');
      expect(L.MEDYA_ADI('K300')).toBe('rutbe-k300');
      expect(L.MEDYA_ADI('K1000')).toBe('rutbe-k1000');
    });

    it('K1000 bir ömürde ulaşılamaz — bilerek', () => {
      /* Ölçüt keyfi değil: bir sistemin GÜNLÜK TAVANI katalogdan
         okunur. Tavanın tamamını HER GÜN alan biri bile otuz yıldan
         önce göremiyorsa, merdivenin tepesi görünmüyor demektir. */
      const tavan = Math.max(L.GUNLUK_TAVAN('ays'), L.GUNLUK_TAVAN('spi'),
        L.GUNLUK_TAVAN('esp'));
      const gun = L.TOPLAM_XP / tavan;
      expect(gun / 365).toBeGreaterThan(30);
    });

    it('her etkinlik NEREDE yapıldığını söyler', () => {
      /* Rütbe ekranının «XP nereden gelir» bölümü bu alanlarla çalışır.
         Biri eksik kalırsa kullanıcı puanı görür ama nereye gideceğini
         göremez — yani listenin yarısı işe yaramaz. */
      L.XP_ETKINLIK.forEach(e => {
        expect(typeof e.rota).toBe('string');
        expect(e.rota.length).toBeGreaterThan(0);
        expect(e.nerede.length).toBeGreaterThan(0);
        expect(e.nasil.length).toBeGreaterThan(0);
      });
    });

    it('merdiven bütün basamakları durumuyla verir', () => {
      const m = XP.merdiven();
      expect(m).toHaveLength(L.BASAMAKLAR.length);
      /* Her basamak üç durumdan birinde olmalı; dördüncü bir değer
         ekranda sessizce sınıfsız bir kutu çizerdi. */
      m.forEach(b => {
        expect(['gecildi', 'simdi', 'kilitli'].indexOf(b.durum))
          .toBeGreaterThan(-1);
      });
      /* İçinde bulunulan basamak EN ÇOK BİR tanedir. */
      expect(m.filter(b => b.durum === 'simdi').length).toBeLessThan(2);
    });

    it('merdivendeki kart adresi medya kuralıyla aynıdır', () => {
      const m = XP.merdiven();
      const safir = m.filter(b => b.etiket === '5.2')[0];
      expect(safir.kart).toBe('img/seviye/rutbe-5-2.webp');
      const kutsal = m.filter(b => b.etiket === 'K300')[0];
      expect(kutsal.kart).toBe('img/seviye/rutbe-k300.webp');
    });

    it('nişan KADEME ve BASAMAK numarasından türer', () => {
      /* Nişan kartın küçük kardeşidir ve merdivendeki yüz piksellik
         kutu için çizilmiştir; kart orada ne taşı ne yazısı okunacak
         kadar küçülüyordu. */
      const m = XP.merdiven();
      expect(m.filter(b => b.etiket === '1.1')[0].nisan)
        .toBe('img/seviye/nisan-1-1.webp');
      expect(m.filter(b => b.etiket === '5.3')[0].nisan)
        .toBe('img/seviye/nisan-5-3.webp');
    });

    it('KUTSAL merdiveninde nişan YOKTUR ve olmaması doğrudur', () => {
      /* K basamakları kademe içinde 1..10 diye sayılmaz, kendi
         adlarıyla (K100, K200) durur. `null` dönmesi ekranın kartı
         kullanması demektir — uydurma bir ad üretmek, olmayan bir
         dosyayı istemek olurdu. */
      const m = XP.merdiven();
      m.filter(b => b.kademe === 6).forEach(b => {
        expect(b.nisan).toBeNull();
      });
      /* Altıncı kademe DIŞINDA hepsinin nişanı vardır. */
      m.filter(b => b.kademe !== 6).forEach(b => {
        expect(typeof b.nisan).toBe('string');
      });
    });

    it('nişan kökü de değiştirilebilir — tek dosya sürümü için', () => {
      const m = XP.merdiven({ kok:'medya/' });
      expect(m.filter(b => b.etiket === '3.2')[0].nisan).toBe('medya/nisan-3-2.webp');
    });

    it('medya adı etiketten türer — nokta tireye döner, harf küçülür', () => {
      expect(L.MEDYA_ADI('5.2')).toBe('rutbe-5-2');
      expect(L.MEDYA_ADI('1.1')).toBe('rutbe-1-1');
      expect(L.MEDYA_ADI('K300')).toBe('rutbe-k300');
    });

    it('her basamağın medya adı benzersizdir', () => {
      const adlar = L.BASAMAKLAR.map(b => L.MEDYA_ADI(b.etiket));
      expect(new Set(adlar).size).toBe(adlar.length);
    });

    it('kademe kimlikleri benzersizdir — defter kimlikle yazılır', () => {
      const idler = L.KADEMELER.map(k => k.id);
      expect(new Set(idler).size).toBe(idler.length);
    });

    it('her kademenin adı, rengi ve sloganı vardır', () => {
      L.KADEMELER.forEach(k => {
        expect(typeof k.ad === 'string' && k.ad.length > 0).toBe(true);
        expect(/^#[0-9A-Fa-f]{6}$/.test(k.renk)).toBe(true);
        expect(/^#[0-9A-Fa-f]{6}$/.test(k.isik)).toBe(true);
        expect(typeof k.slogan === 'string' && k.slogan.length > 0).toBe(true);
      });
    });

    it('etkinlik kimlikleri benzersizdir', () => {
      const idler = L.XP_ETKINLIK.map(e => e.id);
      expect(new Set(idler).size).toBe(idler.length);
    });

    it('her etkinlik pozitif XP verir ve bir modüle aittir', () => {
      const modlar = ['ays', 'spi', 'esp', 'hkm'];
      L.XP_ETKINLIK.forEach(e => {
        expect(e.xp).toBeGreaterThan(0);
        expect(modlar.indexOf(e.mod) >= 0).toBe(true);
      });
    });

    it('hiçbir etkinliğin günlük tavanı tek seferliğinden küçük olamaz', () => {
      L.XP_ETKINLIK.forEach(e => {
        expect(XP.gunlukTavan(e)).toBeGreaterThan(e.xp - 1);
      });
    });

    it('üç sistemin günlük tavanı birbirine YAKIN — aynı kademe aynı emeği ister', () => {
      /* Aynı «Altın» birinde iki kat yavaş kazanılıyorsa ad aynıdır ama
         anlam aynı değildir. Ölçüm burada durur ki dengeyi bozan bir
         düzenleme sessizce geçmesin. */
      const tavanlar = L.MODULLER.map(m => L.GUNLUK_TAVAN(m));
      const en = Math.max.apply(null, tavanlar);
      const az = Math.min.apply(null, tavanlar);
      expect(az).toBeGreaterThan(0);
      expect(en / az).toBeLessThan(1.25);
    });

    it('SPİ hiçbir SONUCU ödüllendirmez — yalnız kaydı', () => {
      /* Sonucu kullanıcı kendi giriyor. Sonuca puan vermek, ona kendi
         sağlık verisini güzelleştirmesi için sebep vermektir. */
      const spi = L.XP_ETKINLIK.filter(e => e.mod === 'spi');
      expect(spi.length).toBeGreaterThan(0);
      spi.forEach(e => {
        expect(/hedef|tutturma|uyan|başar/i.test(e.ad)).toBe(false);
      });
    });

    it('HKM\'nin XP\'si yoktur — üçünün üstünde değil yanındadır', () => {
      expect(L.XP_ETKINLIK.filter(e => e.mod === 'hkm')).toHaveLength(0);
    });

    it('bu sistemin en az bir tavansız ve bir tavanlı etkinliği vardır', () => {
      expect(!!tavansiz()).toBe(true);
      expect(!!tavanli()).toBe(true);
    });
  });

  describe('eşik matematiği — konum() saf bir fonksiyondur', () => {

    it('sıfır XP 1.1 basamağının İÇİNDEDİR, 1.1 bitmiş değildir', () => {
      const k = XP.konum(0);
      expect(k.kademe).toBe(1);
      expect(k.basamak).toBe(1);
      expect(k.bitmisBasamak).toBe(0);
      expect(k.oran).toBe(0);
    });

    it('her basamağın eşiği o basamağı BİTİRİR', () => {
      L.BASAMAKLAR.forEach((b, i) => {
        expect(XP.konum(b.esik).bitmisBasamak).toBe(i + 1);
      });
    });

    it('her eşiğin bir altı o basamağı bitirmez', () => {
      L.BASAMAKLAR.forEach((b, i) => {
        expect(XP.konum(b.esik - 1).bitmisBasamak).toBe(i);
      });
    });

    it('bir basamağı bitiren bir sonrakinin içindedir', () => {
      const ilk = L.BASAMAKLAR[0];
      const k = XP.konum(ilk.esik);
      expect(k.etiket).toBe('1.2');
      expect(k.icinde).toBe(0);
    });

    it('üçüncü basamağı bitirmek ikinci kademeyi açar', () => {
      const k = XP.konum(L.BASAMAKLAR[2].esik);
      expect(k.kademe).toBe(2);
      expect(k.basamak).toBe(1);
    });

    it('oran basamağın içinde doğrusaldır', () => {
      const b = L.BASAMAKLAR[0];
      expect(XP.konum(Math.floor(b.esik / 2)).oran).toBeCloseTo(0.5, 1);
    });

    it('en üst basamakta oran 1 kalır ve XP birikmeye devam eder', () => {
      const k = XP.konum(L.TOPLAM_XP + 50000);
      expect(k.tamam).toBe(true);
      expect(k.etiket).toBe('K1000');
      expect(k.oran).toBe(1);
      expect(k.kalan).toBe(0);
      expect(k.toplam).toBeGreaterThan(L.TOPLAM_XP);
    });

    it('kalan, bir sonraki eşiğe olan mesafedir', () => {
      const b = L.BASAMAKLAR[0];
      expect(XP.konum(b.esik - 10).kalan).toBe(10);
    });
  });

  describe('defter — yüklenmemiş defter sıfır değildir', () => {

    it('yüklenmemiş defterde durum null döner, sıfır değil', () => {
      resetState();
      XP.bosalt();
      expect(XP.durum()).toBeNull();
    });

    it('yüklenmemiş defterde rozet HİÇ çizilmez', () => {
      resetState();
      XP.bosalt();
      expect(XP.rozetHtml()).toBe('');
    });

    it('yükleme sonrası boş defter 1.1 basamağının içindedir', async () => {
      await temiz();
      const d = XP.durum();
      expect(d.toplam).toBe(0);
      expect(d.etiket).toBe('1.1');
      expect(d.bitmisBasamak).toBe(0);
    });

    it('rozet yüklü defterde etiketi taşır', async () => {
      await temiz();
      expect(XP.rozetHtml()).toContain('1.1');
    });

    it('aynı anda iki yükleme tek defter üretir — biri diğerini ezmez', async () => {
      resetState();
      await XP.sifirla();
      XP.bosalt();
      const [a, b] = await Promise.all([XP.yukle(), XP.yukle()]);
      expect(a === b).toBe(true);
    });
  });

  describe('kazanma — tavan, kapsam ve gün penceresi', () => {

    it('XP kazanmak toplamı artırır', async () => {
      await temiz();
      const e = tavansiz();
      const r = await XP.kazan(e.id);
      expect(r.kazanilan).toBe(e.xp);
      expect(XP.durum().toplam).toBe(e.xp);
    });

    it('TAVANSIZ etkinlik günde BİR KEZ sayılır — «sınırsız» demek değildir', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id, { adet:1000 });
      expect(XP.durum().toplam).toBe(e.xp);
    });

    it('aynı gün tavanı aşan tekrar XP getirmez', async () => {
      await temiz();
      const e = tavanli();
      await XP.kazan(e.id, { adet:Math.ceil(e.tavan / e.xp) + 5 });
      expect(XP.durum().toplam).toBe(e.tavan);
    });

    it('tavan GÜN BAŞINADIR — ertesi gün yeniden dolar', async () => {
      await temiz();
      const e = tavanli();
      const kac = Math.ceil(e.tavan / e.xp) + 5;
      await gunGecir(0, () => XP.kazan(e.id, { adet:kac }));
      await gunGecir(1, () => XP.kazan(e.id, { adet:kac }));
      expect(XP.durum().toplam).toBe(e.tavan * 2);
    });

    it('başka bir sistemin etkinliği bu deftere yazılmaz', async () => {
      await temiz();
      const yabanci = L.XP_ETKINLIK.filter(e => e.mod !== XP.MOD)[0];
      const r = await XP.kazan(yabanci.id);
      expect(r.yabanci).toBe(true);
      expect(XP.durum().toplam).toBe(0);
    });

    it('bilinmeyen etkinlik sessizce yok sayılmaz, işaretlenir', async () => {
      await temiz();
      const r = await XP.kazan('yok.boyle.bir.sey');
      expect(r.bilinmeyen).toBe(true);
      expect(r.kazanilan).toBe(0);
    });

    it('GELECEĞE puan yazılmaz', async () => {
      await temiz();
      const e = tavansiz();
      const r = await XP.kazan(e.id, { gun:XP.gunKaydir(R.U.todayISO(), 1) });
      expect(r.gecersizGun).toBe(true);
      expect(XP.durum().toplam).toBe(0);
    });

    it('pencereden eski güne puan yazılmaz — geriye dönük puan toplanmaz', async () => {
      await temiz();
      const e = tavansiz();
      const eski = XP.gunKaydir(R.U.todayISO(), -(XP.GERI_GUN + 1));
      const r = await XP.kazan(e.id, { gun:eski });
      expect(r.gecersizGun).toBe(true);
      expect(XP.durum().toplam).toBe(0);
    });

    it('pencerenin içindeki düne puan yazılır — dünkü antrenman bu sabah girilir', async () => {
      await temiz();
      const e = tavansiz();
      const dun = XP.gunKaydir(R.U.todayISO(), -1);
      const r = await XP.kazan(e.id, { gun:dun });
      expect(r.kazanilan).toBe(e.xp);
    });

    it('tarih olmayan gün reddedilir — defterde çöp anahtar oluşmaz', async () => {
      await temiz();
      const e = tavansiz();
      const r = await XP.kazan(e.id, { gun:'dün' });
      expect(r.gecersizGun).toBe(true);
      expect(Object.keys(XP._defter().gunler)).toHaveLength(0);
    });

    it('adet verilmezse bir kez sayılır, negatif adet bire yuvarlanır', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id, { adet:-9 });
      expect(XP.durum().toplam).toBe(e.xp);
    });
  });

  describe('defter kazanılanı yazar — geçmiş yeniden fiyatlanmaz', () => {

    it('her kayıt [adet, kazanılan XP] tutar', async () => {
      await temiz();
      const e = tavanli();
      await XP.kazan(e.id, { adet:3 });
      const kayit = XP._defter().gunler[R.U.todayISO()][e.id];
      expect(Array.isArray(kayit)).toBe(true);
      expect(kayit[0]).toBe(3);
      expect(kayit[1]).toBe(Math.min(3 * e.xp, e.tavan));
    });

    it('katalog fiyatı değişse de yazılmış gün DEĞİŞMEZ', async () => {
      await temiz();
      const e = tavanli();
      await XP.kazan(e.id, { adet:1 });
      const yazilan = XP.gunToplami(R.U.todayISO());
      const gercekXP = e.xp;
      try{
        e.xp = gercekXP * 10;          /* katalogda fiyat on katına çıktı */
        expect(XP.gunToplami(R.U.todayISO())).toBe(yazilan);
        expect(XP.durum().toplam).toBe(yazilan);
      }finally{ e.xp = gercekXP; }
    });

    it('kırılım + arşiv = toplam, fiyat değişse bile', async () => {
      await temiz();
      const e = tavanli();
      await XP.kazan(e.id, { adet:2 });
      const gercekXP = e.xp;
      try{
        e.xp = gercekXP * 7;
        const k = XP.kirilim();
        const detay = Object.keys(k.etkinlik).reduce((t, id) => t + k.etkinlik[id], 0);
        expect(detay + k.arsiv).toBe(XP.durum().toplam);
      }finally{ e.xp = gercekXP; }
    });

    it('katalogdan KALKMIŞ bir iş yabancı sayılmaz — geçmiş emek yok olmaz', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id);
      /* Bir zamanlar bizdeydi, sonra katalogdan kalktı. */
      const d = XP._defter();
      d.gunler[R.U.todayISO()]['esp.eski.bir.is'] = [1, 33];
      d.toplam += 33;
      expect(XP.gunToplami(R.U.todayISO())).toBe(e.xp + 33);
      const k = XP.kirilim();
      expect(k.etkinlik['esp.eski.bir.is']).toBe(33);
      expect(k.arsiv).toBe(0);
    });

    it('yarısını geri almak o günün YARISINI geri alır', async () => {
      await temiz();
      const e = tavanli();
      const kac = Math.ceil(e.tavan / e.xp);
      await XP.kazan(e.id, { adet:kac });
      const tam = XP.durum().toplam;
      await XP.geriAl(e.id, { adet:Math.floor(kac / 2) });
      const kalan = XP.durum().toplam;
      expect(kalan).toBeLessThan(tam);
      expect(kalan).toBeGreaterThan(0);
      /* Tavana takılmış bir günde bugünün fiyatıyla yeniden hesaplamak
         yanlış sonuç verirdi; pay ORANTILI alınır. */
      expect(Math.abs(kalan - Math.round(tam * (kac - Math.floor(kac / 2)) / kac)))
        .toBeLessThan(2);
    });
  });

  describe('eşitle — XP veriden türer, olaydan değil', () => {

    it('sayımı yazar ve toplamı artırır', async () => {
      await temiz();
      const e = tavanli();
      const r = await XP.esitle(null, { [e.id]:3 });
      expect(r.degisti).toBe(true);
      expect(XP.durum().toplam).toBe(Math.min(3 * e.xp, e.tavan));
    });

    it('İKİNCİ KEZ çağırmak hiçbir şey değiştirmez', async () => {
      await temiz();
      const e = tavanli();
      await XP.esitle(null, { [e.id]:3 });
      const once = XP.durum().toplam;
      const r = await XP.esitle(null, { [e.id]:3 });
      expect(r.degisti).toBe(false);
      expect(r.fark).toBe(0);
      expect(XP.durum().toplam).toBe(once);
    });

    it('sayım DÜŞERSE XP de düşer — silinen kayıt puanını bırakmaz', async () => {
      await temiz();
      const e = tavanli();
      await XP.esitle(null, { [e.id]:4 });
      const dolu = XP.durum().toplam;
      const r = await XP.esitle(null, { [e.id]:1 });
      expect(r.fark).toBeLessThan(0);
      expect(XP.durum().toplam).toBeLessThan(dolu);
      expect(XP.durum().toplam).toBe(Math.min(1 * e.xp, e.tavan));
    });

    it('sayım sıfırlanınca satır deftere hiç kalmaz', async () => {
      await temiz();
      const e = tavanli();
      await XP.esitle(null, { [e.id]:2 });
      await XP.esitle(null, { [e.id]:0 });
      expect(XP.durum().toplam).toBe(0);
      expect(Object.keys(XP._defter().gunler)).toHaveLength(0);
    });

    it('VERİLMEYEN kimliğe dokunmaz — kazan() ile girmiş satır silinmez', async () => {
      await temiz();
      const [a, b] = XP.etkinlikler().filter(x => x.tavan != null).slice(0, 2);
      await XP.kazan(a.id, { adet:1 });
      const aXP = XP.durum().toplam;
      await XP.esitle(null, { [b.id]:1 });
      const satir = XP._defter().gunler[R.U.todayISO()];
      expect(satir[a.id][1]).toBe(aXP);                 /* dokunulmadı */
      expect(XP.durum().toplam).toBe(aXP + Math.min(b.xp, b.tavan));
    });

    it('yabancı sistemin kimliği eşitlemeye girmez', async () => {
      await temiz();
      const yabanci = L.XP_ETKINLIK.filter(e => e.mod !== XP.MOD)[0];
      const r = await XP.esitle(null, { [yabanci.id]:99 });
      expect(r.degisti).toBe(false);
      expect(XP.durum().toplam).toBe(0);
    });

    it('eşik geçilirse yükselme doğurur', async () => {
      await temiz();
      const e = enVerimli();
      const gerek = L.BASAMAKLAR[0].esik;
      const gunluk = XP.gunlukTavan(e);
      let son = null;
      for(let i = 0; i < Math.ceil(gerek / gunluk); i++){
        son = await gunGecir(i, () => XP.esitle(null, { [e.id]:Math.ceil(gunluk / e.xp) }));
      }
      expect(son.yukselme.etiket).toBe('1.1');
    });

    it('veri silinip seviye düşerse kutlama yeniden kazanılabilir', async () => {
      await temiz();
      const e = enVerimli();
      const gunluk = XP.gunlukTavan(e);
      const kere = Math.ceil(gunluk / e.xp);
      const gun = Math.ceil(L.BASAMAKLAR[0].esik / gunluk);
      for(let i = 0; i < gun; i++){
        await gunGecir(i, () => XP.esitle(null, { [e.id]:kere }));
      }
      await gunGecir(gun - 1, async () => {
        await XP.kutlandi();
        await XP.esitle(null, { [e.id]:0 });          /* o günün kaydı silindi */
      });
      expect(XP.durum().bitmisBasamak).toBe(0);
      expect(XP.bekleyenKutlama()).toBeNull();
    });

    it('pencereden eski güne eşitleme yapılmaz', async () => {
      await temiz();
      const e = tavanli();
      const eski = XP.gunKaydir(R.U.todayISO(), -(XP.GERI_GUN + 2));
      const r = await XP.esitle(eski, { [e.id]:5 });
      expect(r.gecersizGun).toBe(true);
      expect(XP.durum().toplam).toBe(0);
    });
  });

  describe('sayım ile katalog birbirini tutar', () => {

    /* Bu iki test, kataloğun ve sayımın birlikte yaşamasını zorunlu
       kılar. Biri diğerinden önce değişirse test kırmızıya döner:
         · Katalogda olup sayımda olmayan iş, HİÇ KAZANILAMAYAN puandır.
         · Sayımda olup katalogda olmayan kimlik, sessizce yok sayılır. */

    it('katalogdaki her iş sayımda karşılık bulur', () => {
      resetState();
      const sayim = R.XPSayim.gunluk(R.U.todayISO());
      const eksik = XP.etkinlikler().map(e => e.id)
        .filter(id => !(id in sayim));
      expect(eksik).toEqual([]);
    });

    it('sayımdaki her kimlik bu sistemin kataloğunda vardır', () => {
      resetState();
      const sayim = R.XPSayim.gunluk(R.U.todayISO());
      const bilinen = XP.etkinlikler().map(e => e.id);
      const fazla = Object.keys(sayim).filter(id => bilinen.indexOf(id) < 0);
      expect(fazla).toEqual([]);
    });

    it('boş durumda her sayım sıfırdır — girilmemiş alan sıfır sayılmaz', () => {
      resetState();
      const sayim = R.XPSayim.gunluk(R.U.todayISO());
      Object.keys(sayim).forEach(id => {
        expect(typeof sayim[id]).toBe('number');
        expect(sayim[id]).toBe(0);
      });
    });

    it('gün kümesi ile tek gün AYNI sonucu verir', () => {
      resetState();
      /* ESP'de bu iki yol ayrı kodlar: `gunler` koleksiyonu tek geçişte
         tarar, `gunluk` tek günü sorar. Ayrışırlarsa XP sessizce yanlış
         olur — bu yüzden ikisi aynı cevabı vermek zorunda. */
      const gunler = XP.pencere();
      const kume = R.XPSayim.gunler(gunler);
      expect(Object.keys(kume).sort()).toEqual(gunler.slice().sort());
      gunler.forEach(g => {
        expect(kume[g]).toEqual(R.XPSayim.gunluk(g));
      });
    });

    it('gün kümesi boş çağrılırsa bugünü verir', () => {
      resetState();
      const kume = R.XPSayim.gunler();
      expect(Object.keys(kume)).toEqual([R.U.todayISO()]);
    });

    it('boş durumda eşitleme hiçbir şey yazmaz', async () => {
      await temiz();
      const gun = R.U.todayISO();
      const r = await XP.esitle(gun, R.XPSayim.gunluk(gun));
      expect(r.degisti).toBe(false);
      expect(XP.durum().toplam).toBe(0);
    });
  });

  describe('pencere — dün girilen kayıt da sayılır', () => {

    it('pencere bugünü ve geriye yazılabilir günleri kapsar', () => {
      const p = XP.pencere();
      expect(p).toHaveLength(XP.GERI_GUN + 1);
      expect(p[0]).toBe(R.U.todayISO());
      expect(XP.yazilabilirGun(p[p.length - 1])).toBe(true);
    });

    it('penceredeki her gün yazılabilir, bir öncesi değil', () => {
      const p = XP.pencere();
      p.forEach(g => expect(XP.yazilabilirGun(g)).toBe(true));
      expect(XP.yazilabilirGun(XP.gunKaydir(p[p.length - 1], -1))).toBe(false);
    });

    it('çok günlü eşitleme hepsini TEK turda yazar', async () => {
      await temiz();
      const e = tavanli();
      const bugun = R.U.todayISO();
      const dun = XP.gunKaydir(bugun, -1);
      const r = await XP.esitleCok({
        [bugun]:{ [e.id]:1 },
        [dun]:{ [e.id]:2 },
      });
      expect(r.degisti).toBe(true);
      expect(XP.gunToplami(bugun)).toBe(Math.min(e.xp, e.tavan));
      expect(XP.gunToplami(dun)).toBe(Math.min(2 * e.xp, e.tavan));
      expect(XP.durum().toplam).toBe(XP.gunToplami(bugun) + XP.gunToplami(dun));
    });

    it('DÜN girilen kayıt bugün eşitlenince puanını alır', async () => {
      await temiz();
      const e = tavanli();
      const dun = XP.gunKaydir(R.U.todayISO(), -1);
      /* Dünün verisi bugün giriliyor: tarama penceresi onu yakalar. */
      const harita = {};
      XP.pencere().forEach(g => { harita[g] = (g === dun) ? { [e.id]:1 } : {}; });
      await XP.esitleCok(harita);
      expect(XP.durum().toplam).toBe(Math.min(e.xp, e.tavan));
      expect(XP.durum().bugun).toBe(0);      /* bugüne değil düne yazıldı */
    });

    it('pencere dışındaki gün sessizce atlanır, tur bozulmaz', async () => {
      await temiz();
      const e = tavanli();
      const bugun = R.U.todayISO();
      const eski = XP.gunKaydir(bugun, -(XP.GERI_GUN + 3));
      const r = await XP.esitleCok({ [eski]:{ [e.id]:5 }, [bugun]:{ [e.id]:1 } });
      expect(r.degisti).toBe(true);
      expect(XP.durum().toplam).toBe(Math.min(e.xp, e.tavan));
      expect(XP._defter().gunler[eski]).toBeUndefined();
    });

    it('hiçbir gün değişmediyse hiç yazılmaz', async () => {
      await temiz();
      const e = tavanli();
      const harita = {};
      XP.pencere().forEach(g => { harita[g] = { [e.id]:0 }; });
      const r = await XP.esitleCok(harita);
      expect(r.degisti).toBe(false);
    });
  });

  describe('göç — sürüm 1 defteri kaybolmaz', () => {

    it('eski biçimli defterin TOPLAMI korunur, kırılımı arşive düşer', async () => {
      resetState();
      await R.Store.set(XP.YOL, {
        surum:1, toplam:5000, gorulen:2,
        gunler:{ '2026-05-01':{ 'esp.kart':30 }, '2026-05-02':{ 'ays.soru':10 } },
      });
      XP.bosalt();
      await XP.yukle();
      const d = XP._defter();
      expect(d.surum).toBe(L.SEVIYE_SURUM);
      expect(d.toplam).toBe(5000);              /* seviye DEĞİŞMEZ */
      expect(Object.keys(d.gunler)).toHaveLength(0);
      expect(d.gocler.length).toBe(1);
      expect(d.gocler[0].from).toBe(1);
      expect(d.gocler[0].to).toBe(L.SEVIYE_SURUM);
    });

    it('göçten sonra kırılım + arşiv yine toplamı verir', async () => {
      resetState();
      await R.Store.set(XP.YOL, {
        surum:1, toplam:5000, gunler:{ '2026-05-01':{ 'esp.kart':30 } },
      });
      XP.bosalt();
      await XP.yukle();
      const k = XP.kirilim();
      const detay = Object.keys(k.etkinlik).reduce((t, id) => t + k.etkinlik[id], 0);
      expect(detay + k.arsiv).toBe(5000);
      expect(k.arsiv).toBe(5000);
    });

    it('güncel sürümlü defter göçe uğramaz', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id);
      XP.bosalt();
      await XP.yukle();
      expect(XP._defter().gocler).toHaveLength(0);
      expect(Object.keys(XP._defter().gunler).length).toBe(1);
    });
  });

  describe('yükselme — kademe atlamak ile basamak atlamak ayrı şeylerdir', () => {

    it('ilk basamağı bitirmek yükselme doğurur ve YENİ KADEMEDİR', async () => {
      await temiz();
      const son = await xpTopla(L.BASAMAKLAR[0].esik);
      expect(!!son.yukselme).toBe(true);
      expect(son.yukselme.etiket).toBe('1.1');
      expect(son.yukselme.yeniKademe).toBe(true);
    });

    it('aynı kademe içinde basamak atlamak yeni kademe DEĞİLDİR', async () => {
      await temiz();
      const son = await xpTopla(L.BASAMAKLAR[1].esik);
      expect(son.yukselme.etiket).toBe('1.2');
      expect(son.yukselme.yeniKademe).toBe(false);
    });

    it('üçüncü basamağı bitirmek ikinci kademeyi açar', async () => {
      await temiz();
      const son = await xpTopla(L.BASAMAKLAR[2].esik);
      expect(son.yukselme.etiket).toBe('1.3');
      expect(son.yukselme.yeniKademe).toBe(false);
      expect(XP.durum().kademe).toBe(2);
    });

    it('eşiğin altında yükselme yoktur', async () => {
      await temiz();
      const son = await xpTamAlti(L.BASAMAKLAR[0].esik - 1);
      expect(son.yukselme).toBeNull();
      expect(XP.durum().bitmisBasamak).toBe(0);
    });
  });

  describe('kutlama — kapalıyken atlanan seviye kaybolmaz', () => {

    it('yükselmeden sonra bekleyen kutlama vardır', async () => {
      await temiz();
      await xpTopla(L.BASAMAKLAR[0].esik);
      expect(XP.bekleyenKutlama().etiket).toBe('1.1');
    });

    it('kutlandı damgası aynı kutlamayı bir daha göstermez', async () => {
      await temiz();
      await xpTopla(L.BASAMAKLAR[0].esik);
      await XP.kutlandi();
      expect(XP.bekleyenKutlama()).toBeNull();
    });

    it('dinleyici yükselmeyi anında duyar', async () => {
      await temiz();
      const gorulen = [];
      const birak = XP.dinle(y => gorulen.push(y.etiket));
      await xpTopla(L.BASAMAKLAR[0].esik);
      birak();
      expect(gorulen).toContain('1.1');
    });

    it('bozuk defterdeki ileri «görülen» damgası kutlamayı susturmaz', async () => {
      await temiz();
      /* Elle düzenlenmiş bir depoyu taklit et: hiç XP yokken 6.3 görülmüş. */
      await R.Store.set(XP.YOL, { toplam:0, gorulen:18, gunler:{} });
      XP.bosalt();
      await XP.yukle();
      expect(XP._defter().gorulen).toBe(0);
    });
  });

  describe('geri alma — silinen kayıt puanı da geri alır', () => {

    it('geri almak toplamı düşürür', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id);
      await XP.geriAl(e.id);
      expect(XP.durum().toplam).toBe(0);
    });

    it('kazanılmamış puan geri alınmaz — toplam eksiye düşmez', async () => {
      await temiz();
      const r = await XP.geriAl(tavansiz().id);
      expect(r.geriAlinan).toBe(0);
      expect(XP.durum().toplam).toBe(0);
    });

    it('seviye düşerse kutlama yeniden kazanılabilir', async () => {
      await temiz();
      const son = await xpTopla(L.BASAMAKLAR[0].esik);
      /* Kutlama ve geri alma, defterin kurulduğu günde yapılır. */
      await withTodayAsync(son.sonGun, async () => {
        await XP.kutlandi();
        const r = await XP.geriAl(son.etkinlik.id,
          { gun:son.sonGun, adet:son.gunlukKere });
        expect(r.geriAlinan).toBeGreaterThan(0);
      });
      expect(XP.durum().bitmisBasamak).toBe(0);
      expect(XP.bekleyenKutlama()).toBeNull();
    });
  });

  describe('defter büyümesi — dokuz aylık ufuk', () => {

    it('kırılım YAŞA göre budanır, kayıt sayısına göre değil', async () => {
      await temiz();
      const e = tavansiz();
      /* Üç günde bir kaydeden biri: 60 kayıt, 180 günlük takvim. Sayıya
         göre budayan bir motor 60 kaydın hepsini tutardı. */
      for(let i = 0; i < 60; i++){
        await gunGecir(i * 3, () => XP.kazan(e.id));
      }
      const gunler = Object.keys(XP._defter().gunler);
      const enEski = gunler.sort()[0];
      const bugun = XP.gunKaydir(BAS, 59 * 3);
      expect(enEski >= XP.gunKaydir(bugun, -(XP.DETAY_GUN - 1))).toBe(true);
      expect(gunler.length).toBeLessThan(60);
    });

    it('budama TOPLAM XP\'ye dokunmaz — seviye geçmiş silindi diye düşmez', async () => {
      await temiz();
      const e = tavansiz();
      const gun = XP.DETAY_GUN + 30;
      for(let i = 0; i < gun; i++){
        await gunGecir(i, () => XP.kazan(e.id));
      }
      expect(XP.durum().toplam).toBe(gun * e.xp);
      expect(Object.keys(XP._defter().gunler).length).toBe(XP.DETAY_GUN);
    });

    it('kırılım + arşiv = toplam — katalog ne olursa olsun', async () => {
      await temiz();
      const e = enVerimli();
      const kere = Math.ceil(XP.gunlukTavan(e) / e.xp);
      for(let i = 0; i < XP.DETAY_GUN + 20; i++){
        await gunGecir(i, () => XP.kazan(e.id, { adet:kere }));
      }
      const k = XP.kirilim();
      let kirilimToplam = k.arsiv;
      Object.keys(k.etkinlik).forEach(id => { kirilimToplam += k.etkinlik[id]; });
      expect(kirilimToplam).toBe(XP.durum().toplam);
      expect(k.arsiv).toBeGreaterThan(0);
    });

    it('katalogdan kalkmış bir etkinliğin XP\'si arşivde kaybolmaz', async () => {
      await temiz();
      const e = tavansiz();
      for(let i = 0; i < XP.DETAY_GUN + 10; i++){
        await gunGecir(i, () => XP.kazan(e.id));
      }
      /* Kataloğu değiştirmeden aynı ispatı yapmanın yolu: arşiv
         SAKLANMIYOR, çıkarılıyor. Detay toplamı ne olursa olsun
         kırılım + arşiv toplamı verir. */
      const k = XP.kirilim();
      const detay = Object.keys(k.etkinlik)
        .reduce((t, id) => t + k.etkinlik[id], 0);
      expect(detay + k.arsiv).toBe(XP.durum().toplam);
    });
  });

  describe('okuma — veri olmayan gün sıfır değildir', () => {

    it('kayıtsız gün null döner, sıfır değil', async () => {
      await withTodayAsync('2026-03-10', async () => {
        await temiz();
        const seri = XP.sonGunler(3);
        expect(seri).toHaveLength(3);
        expect(seri[0].xp).toBeNull();
      });
    });

    it('kayıtlı gün toplamı taşır', async () => {
      await withTodayAsync('2026-03-10', async () => {
        await temiz();
        const e = tavansiz();
        await XP.kazan(e.id);
        expect(XP.sonGunler(3)[2].xp).toBe(e.xp);
      });
    });

    it('günün toplamı YABANCI sistemin puanını saymaz', async () => {
      await withTodayAsync('2026-03-10', async () => {
        await temiz();
        const e = tavansiz();
        const yabanci = L.XP_ETKINLIK.filter(x => x.mod !== XP.MOD)[0];
        await XP.kazan(e.id);
        /* Geri yüklenen bir yedek ya da elle düzenlenmiş depo taklidi:
           yabancı kimlik deftere DIŞARIDAN girer. */
        XP._defter().gunler['2026-03-10'][yabanci.id] = [1, 50];
        expect(XP.gunToplami('2026-03-10')).toBe(e.xp);
        expect(XP.durum().bugun).toBe(e.xp);
      });
    });

    it('kırılım yalnız bu sistemin etkinliklerini sayar', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id);
      const k = XP.kirilim();
      expect(k.mod).toBe(XP.MOD);
      expect(k.etkinlik[e.id]).toBe(e.xp);
    });
  });
})();
