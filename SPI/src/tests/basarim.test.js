/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/basarim.test.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* Başarım motoru — sayım, eşik, defter ve kuyruk.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/basarim.test.js`; `--yay` ile üçe dağıtılır.

   Burada sınanan şey davranış, sayı değil: eşikler katalogdan okunur,
   sabit yazılmaz. Katalog değişirse test kırılmaz — kırılması gereken
   tek şey, motorun katalogla ÇELİŞMESİdir. */

(function(){
  const { describe, it, expect } = SP.Test;

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
  const B = () => SP.Basarim;
  const U = () => SP.U;

  /* Her test temiz defterle başlar: biri ötekinin sayacını miras
     alırsa hangi testin neyi kanıtladığı belirsizleşir. */
  async function sifirla(){
    B().bosalt();
    try{ await SP.Store.set('basarim', null); }catch(e){}
    await B().yukle();
  }

  function sonGunler(n, sayim){
    const out = {};
    for(let i = 0; i < n; i++){
      out[U().iso(U().addDays(U().parse(U().todayISO()), -i))] = sayim;
    }
    return out;
  }

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
    const s = SP.BasarimSayim.gunluk(SP.U.todayISO());
    expect(typeof s.dakika).toBe('number');
    expect(typeof s.gorev).toBe('number');
    expect(s.kusursuz === 0 || s.kusursuz === 1).toBeTruthy();
  });

  it('gün kümesi istenen günlerin hepsini döner', () => {
    const g = [SP.U.todayISO()];
    const out = SP.BasarimSayim.gunler(g);
    expect(Object.keys(out).length).toBe(1);
    expect(out[g[0]]).toBeTruthy();
  });

  it('boş veride sayım sıfırdır, çökmez', () => {
    /* «Veri yok» bir hata değil; sıfır dönmeli ve hiçbir şey patlamamalı. */
    const eski = SP.U.todayISO();
    const s = SP.BasarimSayim.gunluk('1970-01-01');
    expect(s.dakika).toBe(0);
    expect(s.gorev).toBe(0);
    expect(s.kusursuz).toBe(0);
    expect(eski).toBeTruthy();
  });
});

})();
