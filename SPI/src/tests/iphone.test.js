/* iPhone planı (belgeler/ekip/IPHONE-PLANI.md) · Faz 2b · SPİ Çalışma.

   Testler · Öğün · Mutfak · Hareket · Bütçe. Sözleşme §2.2: açık kart ≤ 3;
   §2.4: açıklama ⓘ'dedir, ekranda ikinci kez yazılmaz; §2.6: durum
   sayıları küçük dönen kartta, eksik veri sayı değil cümle.

   Gizlemek uygulama düzeyindedir (app.js SADE_GIZLI + ekranın
   kucukVarsayilan'ı); bu testler çizimi gerçek bölümlere ayırıp hangilerinin
   AÇIK kaldığını sayar. Anahtar yanlış yazılırsa bölüm sessizce açık
   kalırdı: bu da burada yakalanır. Bölümlü ekranlarda yalnız varsayılan
   bölüm (ilk sekme) sayılır — ekran açılınca görünen odur. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, pushLab, pushMeal, pushWorkout, pushVitals } = SP.Test;

  /* Ekranı çizer, bölümlerini ayırır: { kok, alan, var, acik, kucuk, gizli } */
  async function bolumle(id, bolum){
    const sc = SP.Screens[id];
    const kok = document.createElement('div');
    kok.innerHTML = String(await sc.render());
    document.body.appendChild(kok);
    const G = window.LIFEOS.Gizle;
    const gizliler = (sc.gizliVarsayilan || []).concat(SP.App.SADE_GIZLI[id] || []);
    const kucukler = sc.kucukVarsayilan || [];
    const alan = bolum ? kok.querySelector('#bl-' + bolum) : kok;
    const var_ = G.bolumler(alan).map(b => b.anahtar);
    return {
      kok, alan, var:var_,
      gizli:var_.filter(a => gizliler.indexOf(a) >= 0),
      kucuk:var_.filter(a => gizliler.indexOf(a) < 0 && kucukler.indexOf(a) >= 0),
      acik:var_.filter(a => gizliler.indexOf(a) < 0 && kucukler.indexOf(a) < 0),
      bitir(){ kok.remove(); },
    };
  }
  const ustler = d => Array.from(d.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());

  describe('iPhone · Faz 2b · SPİ Çalışma', () => {

    it('Testler: açık yalnız sonuçlar; referans bandı gizli, sonraki kontrol şerit', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        pushLab('2026-08-03', { ferritin:22, hgb:13.1, glucose:88 });
        const b = await bolumle('labs', 'sonuc');
        try{
          expect(b.acik.join(',')).toBe('sonuçlar');
          expect(b.gizli.indexOf('referans-bandı') >= 0).toBe(true);
          expect(b.kucuk.indexOf('sonraki-kontrol') >= 0).toBe(true);
          /* Sonuçlar kartı sayfa başının «Test gir»ini ikinci kez taşımaz */
          const kart = b.alan.querySelector('section.lrow');
          expect(kart.querySelectorAll('[data-act="lab-tab"][data-tab="giris"]').length).toBe(0);
          expect(!!kart.querySelector('[data-act="open-doctor"]')).toBe(true);
          /* «Önem sırasına göre…» ekranda değil ⓘ'de */
          expect(b.alan.textContent.indexOf('Önem sırasına göre')).toBe(-1);
          expect(!!kart.querySelector('[data-hint="lab-results"]')).toBe(true);
          expect(SP.HINTS['lab-results'].more).toContain('referans aralığı, hedef bant');
        }finally{ b.bitir(); }
      });
    });

    it('Testler: sınır cümlesi sayfanın içinde tekrar etmez, sayfa sonunda durur (AGENTS §1.5)', async () => {
      resetState();
      pushLab('2026-08-03', { ferritin:22 });
      const b = await bolumle('labs', 'sonuc');
      try{
        expect(b.alan.textContent.indexOf(SP.CLINICAL.disclaimer)).toBe(-1);
        /* sayfa sonu satırı Ayarlar › Genel'in sonunda: o KALIR */
        expect(String(SP.App.footerHtml())).toContain(SP.CLINICAL.disclaimer);
      }finally{ b.bitir(); }
    });

    it('Öğün: açık öğün ekle, sık öğünler ve günün öğünleri; hedef dönen kartta, ayrıntısı şerit', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        /* aynı öğün iki günde: «Sık öğünler» ancak o zaman çizilir */
        pushMeal('2026-10-01', 'ogle', [['yumurta', 100]]);
        pushMeal('2026-10-02', 'ogle', [['yumurta', 100]]);
        const b = await bolumle('meals', 'gunluk');
        try{
          const d = b.alan.querySelector('.donen[aria-label="Öğün"]');
          expect(!!d).toBe(true);
          expect(ustler(d).slice(0, 2).join(',')).toBe('Kalori,Protein');
          /* ev ölçüsünden gelen gram tahmindir: toplam da tahmin etiketli, kaynağı yazılı */
          expect(!!d.querySelector('[data-donen-madde="0"] .sayi--estimated')).toBe(true);
          expect(d.querySelector('[data-donen-madde="0"] .koken').textContent.indexOf('kayıtlı değil')).toBe(-1);
          /* sıkı ölçü (2d): hedefin ayrıntısı dönen kartın tekrarı — gizli */
          expect(b.gizli.indexOf('günlük-hedef') >= 0).toBe(true);
          expect(b.var.indexOf('tabak') >= 0).toBe(true);
          ['tabak', 'öğün-çizelgesi'].filter(a => b.var.indexOf(a) >= 0)
            .forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
          expect(b.acik.indexOf('öğün-ekle') >= 0 && b.acik.indexOf('sık-öğünler') >= 0).toBe(true);
          expect(b.acik.length <= 3).toBe(true);
          /* ev ölçüsü açıklaması ekranda değil ⓘ'de */
          expect(b.alan.textContent.indexOf('Ev ölçüsü tanınır')).toBe(-1);
          expect(SP.HINTS.portion.more).toContain('kase');
        }finally{ b.bitir(); }
      });
    });

    it('Öğün: tartılan öğünde toplam hesaplanır; öğün yokken ve profil eksikken sayı değil cümle', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        pushMeal('2026-10-02', 'ogle', [['yumurta', 100, 'measured']]);
        let b = await bolumle('meals', 'gunluk');
        try{
          const d = b.alan.querySelector('.donen[aria-label="Öğün"]');
          expect(!!d.querySelector('[data-donen-madde="0"] .sayi--computed')).toBe(true);
          expect(d.querySelector('[data-donen-madde="0"] .koken').textContent.indexOf('kayıtlı değil')).toBe(-1);
        }finally{ b.bitir(); }

        resetState();
        b = await bolumle('meals', 'gunluk');
        try{
          const d = b.alan.querySelector('.donen[aria-label="Öğün"]');
          expect(d.querySelectorAll('[data-donen-madde="0"] .sayi').length).toBe(0);
          expect(d.textContent).toContain('Öğün girilmedi.');
        }finally{ b.bitir(); }

        resetState();
        SP.S.profile.weightKg = null;
        b = await bolumle('meals', 'gunluk');
        try{
          const d = b.alan.querySelector('.donen[aria-label="Öğün"]');
          expect(d.querySelectorAll('.sayi').length).toBe(0);
          expect(ustler(d).join(',')).toBe('Kalori,Günlük hedef');
          expect(d.textContent).toContain('Hedef yok.');
          expect(!!d.querySelector('[data-route="family"]')).toBe(true);
        }finally{ b.bitir(); }
      });
    });

    it('Öğün: gramı olmayan kalem «0 kcal» sayılmaz; cümle olur ve eksik kalem yazılır', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        pushMeal('2026-10-02', 'ogle', [['yumurta', undefined]]);
        let b = await bolumle('meals', 'gunluk');
        try{
          const m = b.alan.querySelector('.donen[aria-label="Öğün"] [data-donen-madde="0"]');
          expect(m.querySelectorAll('.sayi').length).toBe(0);
          expect(m.textContent).toContain('Gram girilmedi.');
          expect(m.textContent).toContain('1 kalemin gramı yok');
        }finally{ b.bitir(); }

        resetState();
        pushMeal('2026-10-02', 'ogle', [['yumurta', 100], ['yumurta', undefined]]);
        b = await bolumle('meals', 'gunluk');
        try{
          const m = b.alan.querySelector('.donen[aria-label="Öğün"] [data-donen-madde="0"]');
          expect(m.querySelectorAll('.sayi').length).toBe(1);
          expect(m.textContent).toContain('1 kalemin gramı yok; toplama girmedi.');
        }finally{ b.bitir(); }
      });
    });

    it('Mutfak: açık pişen yemek, paylaştırma ve yemeğin kartı; hane, evde ne var, kendi gıdaların şerit', async () => {
      resetState();
      const b = await bolumle('kitchen');
      try{
        ['evde-ne-var', 'kendi-gıdaların'].forEach(a => expect(b.kucuk.indexOf(a) >= 0).toBe(true));
        /* sıkı ölçü (2d): hane tablosu başvurudur (düzenleme Hane ekranında) — gizli */
        expect(b.gizli.indexOf('hane') >= 0).toBe(true);
        expect(b.acik.indexOf('pişen-yemek') >= 0).toBe(true);
        expect(b.acik.length).toBe(3);
        /* açıklama satırları ekranda değil ⓘ'de; bilgi kaybolmadı */
        ['Tencerede kaç gram', 'Sistemin tablosunda olmayan', 'Genel ev usulü']
          .forEach(t => expect(b.kok.textContent.indexOf(t)).toBe(-1));
        expect(SP.HINTS.household.more).toContain('kaba bir tahmin');
        expect(SP.HINTS['custom-food'].more).toContain('ambalaj');
        expect(SP.HINTS.evdeki.more).toContain('Yağ ve tuz');
        ['custom-food', 'evdeki'].forEach(k => expect(!!b.kok.querySelector('[data-hint="' + k + '"]')).toBe(true));
      }finally{ b.bitir(); }
    });

    it('Mutfak: yemeğin kartı 100 gramın değerini bir kez yazar; bilinmeyen değer «veri yok», sıfır değil', async () => {
      resetState();
      const f = SP.FOOD_BY_ID['kuru-fasulye-etli'];
      const kartOf = b => window.LIFEOS.Gizle.bolumler(b.kok).find(x => x.anahtar === window.LIFEOS.Gizle.anahtar(f.name)).el;
      let b = await bolumle('kitchen');
      try{
        const kart = kartOf(b);
        expect(kart.querySelectorAll('.nutcell').length).toBe(0);
        expect(kart.querySelectorAll('.sidestat').length).toBe(4);
        expect(kart.textContent.indexOf('%100')).toBe(-1);
      }finally{ b.bitir(); }

      const eski = f.micro;
      f.micro = Object.assign({}, eski);
      delete f.micro.iron;
      try{
        b = await bolumle('kitchen');
        const demir = Array.from(kartOf(b).querySelectorAll('.sidestat')).find(x => x.textContent.indexOf('Demir') >= 0);
        expect(demir.textContent).toContain('veri yok');
        expect(demir.querySelector('.sidestat__v').textContent.trim()).toBe('—');
        b.bitir();
      }finally{ f.micro = eski; }
    });

    it('Hareket: yük emri ve hafta tek dönen kartta; açık seans seç ve bugünün seansları; hafta kartları gizli', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        pushVitals('2026-10-02', { sleep:7.5 });
        pushWorkout('2026-09-30', { minutes:40, rpe:6 });
        pushWorkout('2026-10-02', { minutes:20, rpe:5 });
        const b = await bolumle('move', 'bugun');
        try{
          const d = b.alan.querySelector('.donen[aria-label="Hareket"]');
          expect(!!d).toBe(true);
          expect(ustler(d).join(',')).toBe('Günün yük emri,Bu hafta');
          expect(!!d.querySelector('[data-donen-madde="0"] .sayi--computed')).toBe(true);
          d.querySelectorAll('.koken').forEach(k => expect(k.textContent.indexOf('kayıtlı değil')).toBe(-1));
          /* Pazartesi 2026-09-28: Çarşamba 40 dk ve Cuma 20 dk asgari 15 dakikayı geçti */
          expect(d.querySelector('[data-donen-madde="1"]').textContent).toContain('2/7');
          /* sıkı ölçü (2d): emrin ayrıntısı dönen kartta; kırmızı gerekçe orada söylenir — gizli */
          expect(b.gizli.indexOf('günün-yük-emri') >= 0).toBe(true);
          ['bu-hafta-hareket', 'antrenman-haftası'].forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
          expect(b.acik.indexOf('seans-seç') >= 0 && b.acik.indexOf('bugünün-seansları') >= 0).toBe(true);
          expect(b.acik.length <= 3).toBe(true);
          ['Emri toparlanma belirler', 'Öneri toparlanma bandından gelir']
            .forEach(t => expect(b.alan.textContent.indexOf(t)).toBe(-1));
          expect(SP.HINTS['recovery-order'].more).toContain('asla kendiliğinden artıramaz');
          expect(SP.HINTS['session-pick'].b).toContain('toparlanma bandından');
        }finally{ b.bitir(); }
      });
    });

    it('Hareket: ölçüm yokken yük emri sayı değil cümle; kırmızı gerekçe dönen kartta söylenir', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        let b = await bolumle('move', 'bugun');
        try{
          const m = b.alan.querySelector('.donen[aria-label="Hareket"] [data-donen-madde="0"]');
          expect(m.querySelectorAll('.sayi').length).toBe(0);
          expect(m.textContent).toContain('Ölçüm bekliyor.');
          expect(!!m.querySelector('[data-route="today"]')).toBe(true);
        }finally{ b.bitir(); }

        resetState();
        pushVitals('2026-10-02', { sleep:7.5, temp:38.9 });
        b = await bolumle('move', 'bugun');
        try{
          const m = b.alan.querySelector('.donen[aria-label="Hareket"] [data-donen-madde="0"]');
          expect(m.textContent).toContain('Ateş');
        }finally{ b.bitir(); }
      });
    });

    it('Bütçe: açık talep tablosu ve Sedef’in notu; bütçenin yeri ve fiyat kaynağı gizli', async () => {
      resetState();
      const b = await bolumle('basket', 'butce');
      try{
        ['bütçenin-yeri', 'fiyatlar-nereden-geliyor'].forEach(a => expect(b.gizli.indexOf(a) >= 0).toBe(true));
        expect(b.acik.indexOf('talep-tablosu') >= 0 && b.acik.indexOf('sedef-in-notu') >= 0).toBe(true);
        expect(b.acik.length <= 3).toBe(true);
      }finally{ b.bitir(); }
    });

    it('Bütçe: sınır girilince de açık en çok üç; harcama şeritleri şerit', async () => {
      resetState();
      SP.S.basket.monthlyLimit = 3000;
      const b = await bolumle('basket', 'butce');
      try{
        expect(b.var.indexOf('aylık-sınır') >= 0).toBe(true);
        if(b.var.indexOf('harcama-şeritleri') >= 0) expect(b.kucuk.indexOf('harcama-şeritleri') >= 0).toBe(true);
        expect(b.acik.length <= 3).toBe(true);
      }finally{ b.bitir(); }
    });
  });
})();

/* iPhone planı · Faz 2d · SPİ bölüm turu (sıkı ölçü).

   Ölçü aracı yalnız varsayılan bölümü görür: Testler, Öğün, Hareket ve
   Bütçe'nin öbür bölümleri burada sayılır. Sabit açıklama notu hiçbir
   bölümde kalmaz (öğreti ⓘ'de). İstisna, doktrin gereği: «Birlikte
   okuma»daki «Hiçbiri teşhis değildir» — sağlık çıkarımının hemen yanındaki
   klinik sınırdır (AGENTS §1.5), kalır. */
(function(){
  const { describe, it, expect, resetState, withTodayAsync, pushLab, pushMeal, pushWorkout } = SP.Test;

  async function ciz(id){
    const kok = document.createElement('div');
    kok.innerHTML = String(await SP.Screens[id].render());
    document.body.appendChild(kok);
    return kok;
  }

  describe('iPhone · Faz 2d · SPİ bölüm turu', () => {

    it('Testler, Öğün, Hareket, Bütçe: her bölümde açık en çok üç; aynı başlıklı kart tekrar etmez', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        pushLab('2026-06-03', { ferritin:30, hgb:13.5 });
        pushLab('2026-08-03', { ferritin:22, hgb:13.1, glucose:88 });
        pushMeal('2026-10-02', 'ogle', [['yumurta', 100]]);
        pushWorkout('2026-10-01', { minutes:40, rpe:6 });
        for(const id of ['labs', 'meals', 'move', 'basket']){
          const kok = await ciz(id);
          try{
            const sc = SP.Screens[id];
            const G = window.LIFEOS.Gizle;
            const gizli = (sc.gizliVarsayilan || []).concat(SP.App.SADE_GIZLI[id] || []);
            const kucuk = sc.kucukVarsayilan || [];
            const hepsi = G.bolumler(kok);
            kok.querySelectorAll('section.sayfabolum').forEach(pn => {
              const acik = hepsi.filter(b => pn.contains(b.el)).map(b => b.anahtar)
                .filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0);
              if(acik.length > 3) throw new Error(id + '/' + pn.id + ' açık ' + acik.join(','));
            });
            /* yönetilemeyen kart yok: başlığı başka bir bölümle aynı olan
               kartı gizle.js yok sayar (ilk görülen anahtar kazanır) */
            const say = {};
            kok.querySelectorAll('section.lrow, section.kutu, .card').forEach(el => {
              if(el.parentElement && el.parentElement.closest('section.lrow, section.kutu, .card')) return;
              const b = el.querySelector(':scope > .lrow__side .lrow__label, :scope > .kutu__bas .kutu__ad, :scope > .card__head h3');
              if(!b) return;
              const kopya = b.cloneNode(true);
              kopya.querySelectorAll('.hint, button, svg, .sr-only, [role="tooltip"]').forEach(x => x.remove());
              const k = window.LIFEOS.Gizle.anahtar(kopya.textContent.replace(/\s+/g, ' ').trim());
              say[k] = (say[k] || 0) + 1;
            });
            const iki = Object.keys(say).filter(k => k && say[k] > 1);
            if(iki.length) throw new Error(id + ': aynı anahtarlı kart ' + iki.join(','));
          }finally{ kok.remove(); }
        }
      });
    });

    it('Testler, Hareket, Bütçe: sabit açıklama cümleleri ekranda değil ⓘ’de', async () => {
      await withTodayAsync('2026-10-02', async () => {
        resetState();
        pushLab('2026-06-03', { ferritin:30, hgb:13.5 });
        pushLab('2026-08-03', { ferritin:22, hgb:13.1, glucose:88 });
        const yok = ['Nokta son değer', 'Çerçeve aralık dışını', 'Referans aralığı laboratuvarın normal',
          'Bu ölçümler için hiç değer', 'Aynı tarihe ikinci kez', 'Elindeki rapordaki bütün değerleri',
          'KENDİ geçmişiyle', 'Bir panelin bütünü', 'Tek liste önem sırasına', 'Bu panellerin hiçbir ölçümü',
          'Bir hap ölçümü değiştirir', 'Bırakmak silmek değildir', 'Hekiminin yazdığı talimatı',
          'Fark yazmak kolaydır', 'Kendi ölçümlerinin saçılması', 'Her satır bir test oturumudur',
          'Yürüyüş, koşu ve evde sprint', 'Vücut ağırlığıyla altı temel', 'Mobilite akışları.',
          'Kazanç antrenmanda değil', 'Beş haftada bir yük', 'yapılmayanı da sayar', 'Seans yükü süre ×'];
        /* gizli başvuru kartlarının GÖVDESİ (İlerleme kuralı, Bütçenin yeri) içeriktir, not değil: kalır */
        for(const id of ['labs', 'move', 'basket']){
          const metin = String(await SP.Screens[id].render());
          yok.forEach(t => { if(metin.indexOf(t) >= 0) throw new Error(id + ': «' + t + '» ekranda'); });
        }
        expect(SP.HINTS['lab-entry'].more).toContain('sıfır olarak kaydedilmez');
        expect(SP.HINTS.karsilastir.more).toContain('saçılma');
        expect(SP.HINTS.ilac.more).toContain('Bırakmak silmek değildir');
        expect(SP.HINTS.load.more).toContain('MET');
        expect(SP.HINTS.progression.more).toContain('basamak');
      });
    });
  });
})();

/* iPhone planı · Faz 3 · Analiz (SPİ). Sıkı ölçü; klinik sınır notu kalır. */
(function(){
  const { describe, it, expect, resetState } = SP.Test;

  /* Bölümlü ekranın her bölümü ayrı sayılır (sıkı ölçü): açık en çok üç. */
  function bolumBolum(NS, id, kok){
    const sc = NS.Screens[id], G = window.LIFEOS.Gizle;
    const gizli = (sc.gizliVarsayilan || []).concat(NS.App.SADE_GIZLI[id] || []);
    const kucuk = sc.kucukVarsayilan || [];
    const bl = Array.from(kok.querySelectorAll('section.sayfabolum'));
    return (bl.length ? bl : [kok]).map(b => ({ id:b.id,
      acik:G.bolumler(b).map(x => x.anahtar).filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0) }));
  }

  describe('iPhone · Faz 3 · Analiz (SPİ)', () => {

    it('Analiz: her bölümde açık en çok üç; dürüstlüğün meta kartları şerit; notlar ⓘ\u2019de', async () => {
      resetState();
      const kok = document.createElement('div');
      kok.innerHTML = String(await SP.Screens.analytics.render());
      document.body.appendChild(kok);
      try{
        bolumBolum(SP, 'analytics', kok).forEach(b => expect(b.id + ':' + (b.acik.length <= 3)).toBe(b.id + ':true'));
        ['denetim-defteri', 'sürtünme', 'gösterge-ayrışması'].forEach(a =>
          expect(SP.Screens.analytics.kucukVarsayilan.indexOf(a) >= 0).toBe(true));
        expect(kok.textContent.indexOf('Tahmin KÖR yazılır')).toBe(-1);
        expect(String(SP.HINTS.calib.b) + ' ' + String(SP.HINTS.calib.more)).toContain('Tahmin KÖR yazılır');
        /* klinik sınır (AGENTS §1.5) ekranda kalır */
        expect(kok.textContent).toContain('Bu denetim teşhis koymaz');
      }finally{ kok.remove(); }
    });

    it('Gösterge ayrışması: önceki pencere sıfırken «%Infinity» değil «sıfırdan»', () => {
      const n = SP.Goodhart.ayrismaNotu({ effortLabel:'antrenman dakikası', outcomeLabel:'toparlanma' }, Infinity, -0.5);
      expect(n).toBe('antrenman dakikası sıfırdan başladı, toparlanma %50 GERİLEDİ.');
      expect(n.indexOf('Infinity')).toBe(-1);
    });
  });
})();

/* iPhone planı · Faz 4 · Ofis ve Danışma (SPİ): «brifing + tek eylem».
   Masa cümleleri toplantıda, Patron'da ve uzman kartında üç kez yazılıyordu;
   açık yalnız iş, gerisi şerit. Sabit notlar ⓘ'de. */
(function(){
  const { describe, it, expect, resetState } = SP.Test;
  async function ciz(id){
    const kok = document.createElement('div');
    kok.innerHTML = String(await SP.Screens[id].render());
    document.body.appendChild(kok);
    return kok;
  }
  function acik(id, kok){
    const sc = SP.Screens[id], G = window.LIFEOS.Gizle;
    const gizli = (sc.gizliVarsayilan || []).concat(SP.App.SADE_GIZLI[id] || []);
    const kucuk = sc.kucukVarsayilan || [];
    return G.bolumler(kok).map(x => x.anahtar).filter(a => gizli.indexOf(a) < 0 && kucuk.indexOf(a) < 0);
  }

  describe('iPhone · Faz 4 · Ofis ve Danışma (SPİ)', () => {
    ['office', 'team'].forEach(id => {
      it(id + ': açık en çok üç; sabit not ekranda yok', async () => {
        resetState();
        const kok = await ciz(id);
        try{
          const a = acik(id, kok);
          expect(id + ':' + a.join(',') + ':' + (a.length <= 3)).toBe(id + ':' + a.join(',') + ':true');
          if(id === 'office') expect(kok.textContent.indexOf('Patron kendi hesabını yapmaz')).toBe(-1);
        }finally{ kok.remove(); }
      });
    });
  });
})();

/* iPhone planı · Faz 5 · Ayarlar (SPİ): iOS Ayarlar listesi. İlk görünür
   bölüm açık, gerisi tek satırlık şerit; Rütbe olduğu gibi kalır. */
(function(){
  const { describe, it, expect, resetState } = SP.Test;
  describe('iPhone · Faz 5 · Ayarlar (SPİ)', () => {
    ['family', 'guide'].forEach(id => {
      it(id + ': ilk bölüm açık, gerisi şerit; gizliler gizli kalır', async () => {
        resetState();
        const sc = SP.Screens[id];
        const kok = document.createElement('div');
        kok.innerHTML = String(await sc.render());
        document.body.appendChild(kok);
        try{
          const G = window.LIFEOS.Gizle;
          const gizli = (sc.gizliVarsayilan || []).concat(SP.App.SADE_GIZLI[id] || []);
          const gorunen = G.bolumler(kok).map(b => b.anahtar).filter(a => gizli.indexOf(a) < 0);
          const serit = SP.App.ayarListesi(sc, kok);
          expect(serit.join(',')).toBe(gorunen.slice(1).join(','));
          expect(gorunen.filter(a => serit.indexOf(a) < 0).length <= 1).toBe(true);
        }finally{ kok.remove(); }
      });
    });
    it('Rütbe ayar listesine girmez (olduğu gibi kalır)', () => {
      expect(SP.App.ayarListesi({ id:'rutbe' }, document.body).length).toBe(0);
    });
  });
})();

/* iPhone planı · Faz 6 · Kabuk (SPİ): başlık çekmecenin adıdır, durum
   cümlesi ⓘ'de; sessiz kipte zincirle gelen rozetler tek bildirim. */
(function(){
  const { describe, it, expect, resetState } = SP.Test;
  describe('iPhone · Faz 6 · Kabuk (SPİ)', () => {

    /* Kullanıcı (2026-10-02): «Sınama'daysa üstte Sınama yazıyor; hayır,
       Çalışma kalacak, altındaki değişecek». Başlık çekmecenin adıdır; bölüm
       altındaki çubukta seçilidir; durum cümlesi ⓘ'de. */
    it('başlık çekmecenin adı; bölüm çubukta seçili; kural motorunun cümlesi bilgi kartında', () => {
      resetState();
      const sc = SP.Screens.labs;
      const d = document.createElement('div');
      d.innerHTML = String(SP.App.sayfaBasiHtml(sc));
      expect(d.querySelector('h1').textContent.trim()).toBe('Çalışma');
      const cumle = sc.headline ? sc.headline() : '';
      if(cumle && cumle !== 'Çalışma') expect(d.querySelector('.bilgikart').textContent).toContain(cumle);
    });

    it('menüde olmayan ayrıntı ekranı kendi adını taşır', () => {
      resetState();
      const sc = SP.Screens.gun;
      if(!sc) return;
      const d = document.createElement('div');
      d.innerHTML = String(SP.App.sayfaBasiHtml(sc));
      expect(d.querySelector('h1').textContent.trim()).toBe(String(sc.title));
    });

    it('Bugün’ün başlığı «Bugün»; günün cümlesi (004) bilgi kartının ilk satırında', () => {
      resetState();
      const sc = SP.Screens.today;
      const d = document.createElement('div');
      d.innerHTML = String(SP.App.sayfaBasiHtml(sc));
      expect(d.querySelector('h1').textContent.trim()).toBe('Bugün');
      const cumle = sc.headline ? String(sc.headline()) : '';
      if(cumle && cumle !== 'Bugün'){
        const ilk = d.querySelector('.bilgikart__metin');
        expect(ilk.textContent).toContain(cumle.replace(/<[^>]*>/g, '').trim().slice(0, 12));
        expect(ilk.getAttribute('data-oz')).toBe('004');
      }
    });

    it('zincirle gelen üç rozet tek bildirimdir', async () => {
      const UI = SP.UI, eski = UI.toast, gelen = [];
      UI.toast = t => gelen.push(t);
      try{
        ['A', 'B', 'C'].forEach(x => SP.App.rozetBildir(x, false));
        await new Promise(r => setTimeout(r, 480));
        expect(gelen.join('|')).toBe('3 yeni rozet — A · +2');
      }finally{ UI.toast = eski; }
    });
  });
})();

/* Kullanıcı kararı (2026-10-02): «3B kampüsü kaldır». SPİ Ofis'te kampüs
   paneli, «3B kampüsü aç» ve kampüste toplantı eylemi yok; masa ve uzman
   masaları yerinde; «Toplantı» doğrudan Toplantı bölümünü açar. */
(function(){
  const { describe, it, expect, resetState } = SP.Test;
  describe('Ofis — kampüssüz (SPİ)', () => {
    it('ekranda 3B kampüs ya da eylemi yok; masalar yerinde', async () => {
      resetState();
      const out = String(await SP.Screens.office.render());
      ['spi-campus', 'office-3d', '3B kampüsü aç'].forEach(x => expect(out.indexOf(x)).toBe(-1));
      expect(!!SP.Ofis3B).toBe(false);
      SP.AGENTS.filter(a => a.id !== 'patron').forEach(a => expect(out).toContain('data-id="' + a.id + '"'));
    });
    it('«Toplantı» sayfa başında ve Toplantı bölümüne gider', () => {
      const ust = String(SP.Screens.office.actions());
      expect(ust).toContain('data-act="go"');
      expect(ust).toContain('data-route="meeting"');
      expect(typeof SP.Screens.office.handle['office-3d']).toBe('undefined');
    });
  });
})();

/* Kullanıcı (2026-10-02): «SPİ'de AYS kadar sade olmayan, göz yoran şeyler
   var». Bugün'ün dört ölçüm alanı simgesiz; kartlarda sabit açıklama
   satırı yok — iki cümle ekranın ⓘ kartında (lede), kaybolmadı. */
(function(){
  const { describe, it, expect, resetState } = SP.Test;
  describe('Sade (SPİ) · Bugün', () => {
    it('günün ölçümü simgesiz; «boş alan» ve «ev ölçüsü» cümleleri ⓘ kartında', async () => {
      resetState();
      const d = document.createElement('div');
      d.innerHTML = String(await SP.Screens.today.render());
      const kutu = Array.from(d.querySelectorAll('.kutu')).find(k => /Günün ölçümü/.test(k.textContent));
      expect(!!kutu).toBe(true);
      expect(kutu.querySelectorAll('img').length).toBe(0);
      expect(d.textContent.indexOf('Boş bıraktığın alan sıfır sayılmaz')).toBe(-1);
      expect(d.textContent.indexOf('Ev ölçüsü «tahmin»')).toBe(-1);
      const b = document.createElement('div');
      b.innerHTML = String(SP.App.sayfaBasiHtml(SP.Screens.today));
      expect(b.querySelector('.bilgikart').textContent).toContain('sıfır sayılmaz');
      expect(b.querySelector('.bilgikart').textContent).toContain('«tahmin»');
    });
  });
})();

/* Kullanıcı (2026-10-02 gece): «bu yazıları kaldırıp sayfayı biraz daha
   ortala». Sınır cümlesi, mahremiyet satırı ve derleme damgası («tazele»)
   her ekranın dibinde değil, yalnız Ayarlar › Genel'in sonunda. */
(function(){
  const { describe, it, expect } = SP.Test;
  describe('Sayfa sonu yalnız Genel’de', () => {
    it('Genel’de çizilir, öteki ekranlarda çizilmez; «tazele» kaybolmaz', () => {
      expect(SP.App.sayfaSonuRota('guide')).toBe(true);
      ['today', 'rutbe', 'onaylar'].forEach(r => expect(SP.App.sayfaSonuRota(r)).toBe(false));
    });
  });
})();
