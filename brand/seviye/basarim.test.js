/* Başarım motoru — sayım, eşik, defter ve kuyruk.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/basarim.test.js`; `--yay` ile üçe dağıtılır.

   Burada sınanan şey davranış, sayı değil: eşikler katalogdan okunur,
   sabit yazılmaz. Katalog değişirse test kırılmaz — kırılması gereken
   tek şey, motorun katalogla ÇELİŞMESİdir. */

(function(){
  const { describe, it, expect, withTodayAsync } = __NS__.Test;

describe('Başarım — katalog', () => {
  const L = () => window.LIFEOS;

  it('her rozetin kodu, görseli ve ailesi var', () => {
    L().ROZETLER.forEach(r => {
      expect(typeof r.kod).toBe('string');
      expect(r.kod.length > 0).toBeTruthy();
      expect(typeof r.gorsel).toBe('string');
      expect(L().BASARIM_AILE_ILE(r.aile)).toBeTruthy();
    });
  });

  it('kodlar benzersizdir', () => {
    /* Aynı kod iki rozete verilirse biri ötekinin kazanımını yer. */
    const gorulen = {};
    L().ROZETLER.forEach(r => {
      expect(gorulen[r.kod]).toBeFalsy();
      gorulen[r.kod] = 1;
    });
  });

  it('görsel adı katalogdaki kuralla birebir aynıdır', () => {
    /* `tools/rutbe.py` de aynı adı üretir. İkisi ayrışırsa görsel
       bulunamaz ve ekranda sessizce boşluk kalır. */
    L().ROZETLER.forEach(r => {
      expect(r.gorsel).toBe(L().BASARIM_MEDYA_ADI(r.aile, r.esik));
    });
  });

  it('sayısal eşikler artan sıradadır', () => {
    L().BASARIM_AILELER.forEach(a => {
      if(a.olcu === 'ozel') return;
      for(let i = 1; i < a.esikler.length; i++){
        expect(a.esikler[i] > a.esikler[i - 1]).toBeTruthy();
      }
    });
  });

  it('beş mühür vardır ve her biri bir modüle bağlıdır', () => {
    expect(L().MUHURLER.length).toBe(5);
    L().MUHURLER.forEach(m => {
      expect(['ays', 'spi', 'esp', 'hkm'].indexOf(m.mod) >= 0).toBeTruthy();
      expect(typeof m.nerede).toBe('string');
    });
  });
});

describe('Başarım — motor', () => {
  const B = () => __NS__.Basarim;
  const L = () => window.LIFEOS;
  const U = () => __NS__.U;

  /* Her test temiz defterle başlar: biri ötekinin sayacını miras
     alırsa hangi testin neyi kanıtladığı belirsizleşir. */
  async function sifirla(){
    B().bosalt();
    try{ await __NS__.Store.set('basarim', null); }catch(e){}
    await B().yukle();
  }

  function sonGunler(n, sayim){
    const out = {};
    for(let i = 0; i < n; i++){
      out[U().iso(U().addDays(U().parse(U().todayISO()), -i))] = sayim;
    }
    return out;
  }

  it('günün odak rozeti GEÇİLEN EN YÜKSEK eşiği gösterir', () => {
    /* Üç saat çalışıldıysa 3H rozeti çıkar, 1H değil. Aksi hâlde
       rozet hep en alttaki eşikte kalır ve ilerlemeyi hiç göstermez.

       Bu yardımcı üç uygulamanın günlük raporunda kullanılıyor
       («odak günün raporlarında, eylemlerin yanında») ama hiç
       sınanmamıştı: rozet yalnız 60 dakikadan sonra çıktığı için
       duman testi de onu hiç görmüyor. */
    const B = __NS__.Basarim;
    expect(B.gununOdagi(0)).toBeNull();
    expect(B.gununOdagi(59)).toBeNull();     /* saat dolmadı */
    expect(B.gununOdagi(60).esik).toBe(1);
    expect(B.gununOdagi(200).esik).toBe(3);  /* 3 saat 20 dk → 3H */
  });

  it('tavanı aşan gün EN ÜST rozeti alır ve aştığını SÖYLER', () => {
    /* «10 saat» yazıp 13 saati gizlemek, ölçülen şeyi saklamaktır. */
    const B = __NS__.Basarim;
    const ust = L().BASARIM_AILE_ILE('odak').esikler.slice(-1)[0];
    const o = B.gununOdagi(800);             /* 13 saat 20 dk */
    expect(o.esik).toBe(ust);
    expect(o.saat).toBe(13);
    expect(o.asti).toBeTruthy();
    expect(B.gununOdagi(ust * 60).asti).toBeFalsy();   /* tam tavan: aşmadı */
  });

  it('odak rozetinin görsel adı katalog kuralıyla aynıdır', () => {
    /* Ad ayrışırsa rapor sessizce görselsiz kalır. */
    const B = __NS__.Basarim;
    expect(B.gununOdagi(200).gorsel).toBe(L().BASARIM_MEDYA_ADI('odak', 3));
  });

  it('rozet yokken HTML de BOŞTUR', () => {
    /* Boş bir `<span>` döndürmek, raporda görünmez bir boşluk
       bırakırdı — satır aralığı sebepsiz açılırdı. */
    const B = __NS__.Basarim;
    expect(B.odakHtml(0)).toBe('');
    expect(B.odakHtml(59)).toBe('');
    expect(B.odakHtml(60).indexOf('odak-rozet') >= 0).toBeTruthy();
  });

  it('«en uzun odak» BİR GÜNÜ aşamaz — merkez sözleşmesi öyle diyor', async () => {
    /* Bir gün 1440 dakikadır. Daha büyük bir sayı bir ölçüm değil bir
       GİRİŞ HATASIDIR (48 yerine 480 yazmak gibi) ve dışarı çıkarsa
       sonucu orantısız:

         `isaret()` HKM'ye `badge_focus_hours` gönderir
         HKM sözleşmesi bu alanı 0–24 ile sınırlar (`sync_engine.py`,
             RANGES — «bir günde en uzun odak» olduğu için DOĞRU bir
             sınır)
         sınır aşılırsa HKM BÜTÜN gövdeyi 422 ile reddeder; o günün
             saat, görev ve gün sayaçları da merkeze hiç ulaşmaz

       Yani tek bir yanlış alan, günün tamamının eşitlemesini sessizce
       düşürüyordu. Sınır fiziksel: günün uzunluğu. */
    await sifirla();
    const gun = U().todayISO();
    await B().esitleCok({ [gun]:{ dakika:1800, gorev:3, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(24);
    expect(B().isaret().badge_focus_hours).toBe(24);
    /* Toplam dakika KIRPILMAZ: orası bir gün değil, günlerin toplamı. */
    expect(B().durum().dakika).toBe(1800);
  });

  it('aynı gün İKİ KEZ eşitlenince kusursuz sayacı ŞİŞMEZ', async () => {
    /* «Tekrar çalışması zararsızdır — eşitleme iki kez çağrılabilir»
       bu motorun kendi başlığında yazılı bir SÖZ ve bir yerde
       tutulmuyordu.

       Gün kaydı YALNIZ dakika ya da görev varsa saklanıyordu. Kusursuz
       ama sayısız bir gün saklanmıyor, ay özetine ise işleniyordu;
       ikinci eşitlemede «eski» kayıt bulunamadığı için fark yeniden
       ekleniyordu:

         1. çağrı   kusursuz 0 → 1   ay özeti: 1
         2. çağrı   kusursuz 0 → 1   ay özeti: 2   ← aynı gün, iki kez

       Sayaç her eşitlemede bir artıyordu; uygulama her açılışta ve her
       kayıtta eşitler, yani artış kullanıcının bir şey yapmasını bile
       beklemiyordu. Ayda başka kayıtlı gün varsa sonucu şuydu: tek bir
       gün, ayın gün sayısı kadar eşitlenince ay «kusursuz» ilan
       ediliyordu — hiç yaşanmamış bir ay için rozet. */
    await sifirla();
    const gun = U().todayISO();
    const sayim = { dakika:0, gorev:0, kusursuz:1 };
    await B().esitleCok({ [gun]:sayim });
    expect(B().durum().kusursuzGun).toBe(1);
    /* Kusursuz bir gün, kayıtlı bir gündür: sayısı sıfır olsa da o gün
       YAŞANMIŞTIR. Kaydı silmek, hem onu hem tutarlılığı siliyordu. */
    expect(B().durum().gun).toBe(1);
    await B().esitleCok({ [gun]:sayim });
    await B().esitleCok({ [gun]:sayim });
    expect(B().durum().kusursuzGun).toBe(1);
    expect(B().durum().gun).toBe(1);
  });

  it('yazılabilir pencere XP ile AYNI uzunluktadır', () => {
    /* Uygulama her eşitlemede `XP.pencere()` günlerini başarım
       defterine yazar (bkz. `app.js`). İki pencere ayrışırsa:

         başarım penceresi DAHA KISA → XP'nin gönderdiği en eski
             günler sessizce reddedilir, o günün rozetleri hiç sayılmaz
         başarım penceresi DAHA UZUN → o günler hiç gönderilmez ve
             defterde eskimiş bir kırılım birikir

       İkisi de sessizdir; bu yüzden ilişki burada çivilenir. */
    expect(__NS__.Basarim.PENCERE_GUN + 1).toBe(__NS__.XP.pencere().length);
  });

  it('boş defterde hiçbir rozet kazanılmamıştır', async () => {
    await sifirla();
    const d = B().durum();
    expect(d.kazanilanSayisi).toBe(0);
    expect(d.gun).toBe(0);
    expect(d.saat).toBe(0);
  });

  it('gün, saat ve görev sayılır', async () => {
    await sifirla();
    await B().esitleCok(sonGunler(3, { dakika:120, gorev:10, kusursuz:0 }));
    const d = B().durum();
    expect(d.gun).toBe(3);
    expect(d.saat).toBe(6);         /* 3 × 120 dk */
    expect(d.gorev).toBe(30);
  });

  it('aynı sayımı ikinci kez eşitlemek hiçbir şeyi değiştirmez', async () => {
    await sifirla();
    const s = sonGunler(3, { dakika:60, gorev:5, kusursuz:0 });
    await B().esitleCok(s);
    const once = JSON.stringify(B().durum());
    const r = await B().esitleCok(s);
    expect(r.degisti).toBeFalsy();
    expect(JSON.stringify(B().durum())).toBe(once);
  });

  it('kayıt silinince sayaç DÜŞER', async () => {
    await sifirla();
    await B().esitleCok(sonGunler(2, { dakika:60, gorev:5, kusursuz:0 }));
    const gun = U().todayISO();
    await B().esitleCok({ [gun]:{ dakika:0, gorev:0, kusursuz:0 } });
    const d = B().durum();
    expect(d.gun).toBe(1);
    expect(d.gorev).toBe(5);
  });

  it('yanlış girilen gün DÜZELTİLİNCE «en uzun odak» da düzelir', async () => {
    /* «Bir günde en uzun odak» bir SAYAÇTIR ve sayaç düşebilir
       (bkz. bir alttaki test: düşmeyen şey ROZETtir).

       Bir süre düşmüyordu: `enIyi.odakDakika` yalnız büyüyen bir
       işaretti. 70 dakika yerine 700 yazılan bir gün, düzeltilse bile
       ekranda «bir günde en uzun odak: 11 saat» yazmaya devam ediyor
       ve on saatlik rozet artık var olmayan bir veriyle kazanılmış
       kalıyordu — ölçülmemiş bir şeyi ölçülmüş gibi göstermek
       (AGENTS.md §1.2). */
    await sifirla();
    const gun = U().todayISO();
    await B().esitleCok({ [gun]:{ dakika:700, gorev:1, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(11);
    await B().esitleCok({ [gun]:{ dakika:70, gorev:1, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(1);
  });

  it('«en uzun odak» pencerenin EN BÜYÜĞÜdür, sonuncusu değil', async () => {
    /* Düzeltme yapılan gün rekoru tutan gün DEĞİLSE, rekor yerinde
       kalmalı: bugünü sıfırlamak dünkü altı saatlik oturumu silmez. */
    await sifirla();
    const bugun = U().todayISO();
    const dun = U().iso(U().addDays(U().parse(bugun), -1));
    await B().esitleCok({ [dun]:{ dakika:360, gorev:1, kusursuz:0 },
                          [bugun]:{ dakika:120, gorev:1, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(6);
    await B().esitleCok({ [bugun]:{ dakika:0, gorev:0, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(6);
  });

  it('budanan günün rekoru TABANDA saklanır', async () => {
    /* Pencere 120 gün; ondan eskisi silinir ve bir daha okunamaz.
       Rekoru o gün tutuyorsa, silmeden önce tabana yazılmalı — yoksa
       rekor sessizce kaybolur ve ekran «en uzun odak 1 saat» der,
       oysa beş saatlik bir gün yaşanmıştır. */
    await sifirla();
    await withTodayAsync('2026-01-10', async () => {
      await B().esitleCok({ '2026-01-10':{ dakika:300, gorev:2, kusursuz:0 } });
      expect(B().durum().odakSaat).toBe(5);
    });
    /* Sekiz ay sonra: o gün pencereden çıktı ve budandı. */
    await withTodayAsync('2026-09-10', async () => {
      await B().esitleCok({ '2026-09-10':{ dakika:60, gorev:1, kusursuz:0 } });
      expect(B().durum().odakSaat).toBe(5);
    });
  });

  it('rekor TABANIN altına düşemez', async () => {
    /* Taban budanmış geçmişten gelir ve düzeltilemez: o günler artık
       yok. Penceredeki bir düzeltme rekoru ancak tabana kadar
       indirebilir. */
    await sifirla();
    await withTodayAsync('2026-01-10', async () => {
      await B().esitleCok({ '2026-01-10':{ dakika:300, gorev:2, kusursuz:0 } });
    });
    await withTodayAsync('2026-09-10', async () => {
      await B().esitleCok({ '2026-09-10':{ dakika:400, gorev:1, kusursuz:0 } });
      expect(B().durum().odakSaat).toBe(6);         /* 400 dk */
      await B().esitleCok({ '2026-09-10':{ dakika:30, gorev:1, kusursuz:0 } });
      expect(B().durum().odakSaat).toBe(5);         /* tabana iner, altına DEĞİL */
    });
  });

  it('eski defter göçerken taban ÖLÇÜLÜR, uydurulmaz', async () => {
    /* `odakTaban` alanı olmayan bir defter iki hâlde olabilir ve
       ikisi ayrı davranmalı:

         rekoru tutan gün PENCEREDE  → taban yok, düzeltme çalışır
         rekoru tutan gün BUDANMIŞ   → kayıtlı değer taban olur

       Körlemesine «taban = rekor» yazmak kolaydı ama birinci hâli de
       düzeltilemez yapıyordu. */
    const gun = U().todayISO();

    /* 1) Rekor pencerede: taban 0 olmalı, düzeltme tam çalışmalı. */
    B().bosalt();
    await __NS__.Store.set('basarim', {
      surum:window.LIFEOS.BASARIM_SURUM, aylar:{}, kazanilan:{}, bekleyen:[],
      gunler:{ [gun]:{ dakika:300, gorev:2, kusursuz:0 } },
      enIyi:{ odakDakika:300 },
    });
    await B().yukle();
    expect(B().durum().odakSaat).toBe(5);
    await B().esitleCok({ [gun]:{ dakika:60, gorev:2, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(1);

    /* 2) Rekor pencerede YOK: kayıtlı değer taban olmalı. */
    B().bosalt();
    await __NS__.Store.set('basarim', {
      surum:window.LIFEOS.BASARIM_SURUM, aylar:{}, kazanilan:{}, bekleyen:[],
      gunler:{ [gun]:{ dakika:60, gorev:2, kusursuz:0 } },
      enIyi:{ odakDakika:300 },
    });
    await B().yukle();
    expect(B().durum().odakSaat).toBe(5);
    await B().esitleCok({ [gun]:{ dakika:30, gorev:2, kusursuz:0 } });
    expect(B().durum().odakSaat).toBe(5);
  });

  it('katalog sürümü değişince rozetler AÇILIŞTA geri gelir', async () => {
    /* Sürüm artınca `normalize` kazanımları siler — doğru: eşik
       değişmiş olabilir ve çelişen iki kaynaktan doğru olan
       KATALOGtur. Ama silinen kazanımları YENİDEN TÜRETEN kimse
       yoktu.

       Türetmenin tek yolu `esitleCok` ve o, hiçbir gün değişmediyse
       ilk satırda dönüyor:

         uygulama açılır → aynı sekiz gün eşitlenir → «değişen yok»
         → tarama hiç koşmaz → rozetler YOK

       Veri değişene kadar da öyle kalıyordu; hiçbir şey girmeyen bir
       kullanıcı için TEMELLİ. Motorun kendi sözünün tam tersi:
       «kazanılmış rozet geri alınmaz». */
    await sifirla();
    const gun = U().todayISO();
    const sayim = { dakika:600, gorev:200, kusursuz:1 };
    await B().esitleCok({ [gun]:sayim });
    /* Kutlama sırası boşaltılır: kazanımlar gösterilmiş sayılsın. */
    let bek;
    while((bek = B().bekleyen())) await B().gorundu(bek.kod);
    const onceki = B().liste().filter(r => r.kazanildi)
      .map(r => ({ kod:r.kod, gun:r.kazanildi }));
    expect(onceki.length > 0).toBeTruthy();

    /* Katalog sürümü artmış gibi yap. */
    const ham = await __NS__.Store.get('basarim');
    ham.surum = window.LIFEOS.BASARIM_SURUM + 1;
    await __NS__.Store.set('basarim', ham);
    B().bosalt();
    await B().yukle();

    /* Rozetler geri gelmiş olmalı — hem de KENDİ TARİHLERİYLE. */
    expect(B().durum().kazanilanSayisi).toBe(onceki.length);
    const simdi = {};
    B().liste().forEach(r => { if(r.kazanildi) simdi[r.kod] = r.kazanildi; });
    onceki.forEach(r => { expect(simdi[r.kod]).toBe(r.gun); });

    /* Ve YENİDEN KUTLANMAMIŞ olmalı: kazanılmış bir anı ikinci kez
       kutlamak, ilkini değersizleştirir. */
    expect(B().bekleyen()).toBeNull();
  });

  it('göçte hak edilmeyen rozet geri GELMEZ', async () => {
    /* Göç taraması kayıtlı listeyi körlemesine geri yazmaz; eşikleri
       KATALOGTAN yeniden ölçer. Defterde duran ama bugünkü katalogda
       karşılığı olmayan bir kod geri gelmemeli — yoksa «katalog
       otoritedir» sözü, göçün olmadığı bir sözleşmeye dönerdi. */
    const gun = U().todayISO();
    B().bosalt();
    await __NS__.Store.set('basarim', {
      surum:window.LIFEOS.BASARIM_SURUM + 1,
      aylar:{}, gunler:{}, enIyi:{ odakDakika:0, odakTaban:0 },
      kazanilan:{ 'yok-boyle-bir-rozet':gun }, bekleyen:[],
    });
    await B().yukle();
    expect(B().durum().kazanilanSayisi).toBe(0);
  });

  it('kazanılmış rozet sayaç düşse de GERİ ALINMAZ', async () => {
    /* Rozet bir durum değil bir OLAYdır: «şu gün ulaştın» cümlesi
       sonradan veri silinse de doğru kalır. */
    await sifirla();
    await B().esitleCok(sonGunler(1, { dakika:600, gorev:200, kusursuz:0 }));
    const once = B().durum().kazanilanSayisi;
    expect(once > 0).toBeTruthy();
    await B().esitleCok({ [U().todayISO()]:{ dakika:0, gorev:0, kusursuz:0 } });
    expect(B().durum().kazanilanSayisi).toBe(once);
  });

  it('eşik geçilince rozet kazanılır ve kuyruğa girer', async () => {
    await sifirla();
    const r = await B().esitleCok(sonGunler(1, { dakika:180, gorev:120, kusursuz:0 }));
    expect(r.yeni.indexOf('gorev-100') >= 0).toBeTruthy();
    expect(r.yeni.indexOf('odak-3') >= 0).toBeTruthy();
    const bekleyen = B().bekleyen();
    expect(bekleyen).toBeTruthy();
    expect(typeof bekleyen.ad).toBe('string');
  });

  it('gösterilen rozet kuyruktan çıkar', async () => {
    await sifirla();
    await B().esitleCok(sonGunler(1, { dakika:180, gorev:120, kusursuz:0 }));
    let n = 0;
    let k = B().bekleyen();
    while(k && n < 50){ await B().gorundu(k.kod); k = B().bekleyen(); n++; }
    expect(n > 0).toBeTruthy();
    expect(B().bekleyen()).toBeFalsy();
  });

  it('odak rozeti BİR GÜNÜN değeridir, toplamın değil', async () => {
    /* Üç gün × 1 saat, 3 saatlik odak rozeti VERMEZ. */
    await sifirla();
    await B().esitleCok(sonGunler(3, { dakika:60, gorev:1, kusursuz:0 }));
    expect(B().durum().odakSaat).toBe(1);
    expect(B().durum().saat).toBe(3);
  });

  it('yedi ardışık kusursuz gün kusursuz haftayı açar', async () => {
    await sifirla();
    const r = await B().esitleCok(sonGunler(7, { dakika:60, gorev:5, kusursuz:1 }));
    expect(r.yeni.indexOf('kusursuz-gun') >= 0).toBeTruthy();
    expect(r.yeni.indexOf('kusursuz-hafta') >= 0).toBeTruthy();
  });

  it('altı kusursuz gün haftayı AÇMAZ', async () => {
    await sifirla();
    const r = await B().esitleCok(sonGunler(6, { dakika:60, gorev:5, kusursuz:1 }));
    expect(r.yeni.indexOf('kusursuz-hafta') < 0).toBeTruthy();
  });

  it('gelecek güne yazılmaz', async () => {
    await sifirla();
    const yarin = U().iso(U().addDays(U().parse(U().todayISO()), 1));
    const r = await B().esitleCok({ [yarin]:{ dakika:600, gorev:900, kusursuz:1 } });
    expect(r.degisti).toBeFalsy();
    expect(B().durum().gun).toBe(0);
  });

  it('HKM işareti bütün sayaçları taşır', async () => {
    await sifirla();
    await B().esitleCok(sonGunler(2, { dakika:90, gorev:7, kusursuz:0 }));
    const i = B().isaret();
    expect(i.badge_days).toBe(2);
    expect(i.badge_hours).toBe(3);
    expect(i.badge_tasks).toBe(14);
    expect(typeof i.badge_streak_months).toBe('number');
  });

  it('sıradaki rozetler ORANA göre sıralanır, eşiğe göre değil', async () => {
    /* 90 saatlik biri için «100 saat» (%90), «250 görev» (%12)
       rozetinden daha yakındır — eşiği daha büyük olsa bile. */
    await sifirla();
    await B().esitleCok(sonGunler(1, { dakika:60 * 90, gorev:30, kusursuz:0 }));
    const s = B().siradaki(3);
    expect(s.length > 0).toBeTruthy();
    for(let i = 1; i < s.length; i++){
      expect(s[i - 1].oran >= s[i].oran).toBeTruthy();
    }
    expect(s[0].aile).toBe('saat');
  });

  it('sıradakiler AİLE BAŞINA BİR TANEDİR', async () => {
    /* Ölçüldü: sıralama tek başına bırakılınca üçü de aynı aileden
       geliyordu — «3 saat, 4 saat, 5 saat odak» tek hedeftir ve diğer
       beş aileyi gizler. */
    await sifirla();
    await B().esitleCok(sonGunler(3, { dakika:200, gorev:40, kusursuz:1 }));
    const s = B().siradaki(3);
    const gorulen = {};
    s.forEach(r => {
      expect(gorulen[r.aile]).toBeFalsy();
      gorulen[r.aile] = 1;
    });
  });

  it('sıradaki KAZANILMIŞ rozeti göstermez', async () => {
    await sifirla();
    await B().esitleCok(sonGunler(1, { dakika:180, gorev:120, kusursuz:0 }));
    B().siradaki(6).forEach(r => expect(r.kazanildi).toBeFalsy());
  });

  it('sıradaki KALAN miktarı doğru söyler', async () => {
    await sifirla();
    await B().esitleCok(sonGunler(1, { dakika:60 * 40, gorev:10, kusursuz:0 }));
    const saat = B().siradaki(6).filter(r => r.aile === 'saat')[0];
    expect(saat).toBeTruthy();
    expect(saat.kalan).toBe(saat.esik - saat.deger);
  });

  it('boş defterde sıradaki yine de bir yön gösterir', async () => {
    /* Hiç veri yokken de «ilk hedef ne» sorusunun cevabı olmalı. */
    await sifirla();
    expect(B().siradaki(3).length > 0).toBeTruthy();
  });

  it('liste bütün rozetleri durumuyla döner', async () => {
    await sifirla();
    const l = B().liste();
    expect(l.length).toBe(window.LIFEOS.ROZETLER.length);
    l.forEach(r => {
      expect(typeof r.kod).toBe('string');
      expect(r.oran === null || (r.oran >= 0 && r.oran <= 1)).toBeTruthy();
    });
  });
});

describe('Başarım sayımı — veriden türetilir', () => {
  it('sayım üç alanı da döner', () => {
    const s = __NS__.BasarimSayim.gunluk(__NS__.U.todayISO());
    expect(typeof s.dakika).toBe('number');
    expect(typeof s.gorev).toBe('number');
    expect(s.kusursuz === 0 || s.kusursuz === 1).toBeTruthy();
  });

  it('gün kümesi istenen günlerin hepsini döner', () => {
    const g = [__NS__.U.todayISO()];
    const out = __NS__.BasarimSayim.gunler(g);
    expect(Object.keys(out).length).toBe(1);
    expect(out[g[0]]).toBeTruthy();
  });

  it('boş veride sayım sıfırdır, çökmez', () => {
    /* «Veri yok» bir hata değil; sıfır dönmeli ve hiçbir şey patlamamalı. */
    const eski = __NS__.U.todayISO();
    const s = __NS__.BasarimSayim.gunluk('1970-01-01');
    expect(s.dakika).toBe(0);
    expect(s.gorev).toBe(0);
    expect(s.kusursuz).toBe(0);
    expect(eski).toBeTruthy();
  });
});

})();
