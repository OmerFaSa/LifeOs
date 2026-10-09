/* K2 · AYS Bugün — 004 sayfa başı cümlesi, 042 kahraman, 024 Özet sayıları.

   Kural (belgeler/ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
   satırıdır ve test adında özelliğin numarası geçer (`oz-004 …`). */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    return await R.Model.ensureDay(R.U.today());
  }
  function dom(html){
    const k = document.createElement('div');
    k.innerHTML = String(html);
    return k;
  }

  describe('K2 · AYS Bugün', () => {

    it('oz-004 Sayfa başı cümlesi kural motorundan gelir; dil modeli kapalıyken de aynı cümle görünür.', async () => {
      await withTodayAsync('2026-10-12', async () => {
        const gun = await hazirla();
        const iso = R.U.todayISO();
        const bir = R.Screens.today.cumle(gun, iso);
        expect(/^\d+\/\d+ blok bitti; sırada .+\.$/.test(bir)).toBeTruthy();
        /* Model yokmuş gibi: cümle değişmez (hiç çağrılmıyor). */
        const llm = R.LLM;
        try{
          R.LLM = { complete:() => { throw new Error('model kapalı'); }, ready:() => false };
          expect(R.Screens.today.cumle(gun, iso)).toBe(bir);
        }finally{ R.LLM = llm; }
        /* v5: cümle sayfanın BÜYÜK BAŞLIĞIDIR; tarih üst satırda kalır. */
        expect(R.Screens.today.headline()).toBe(bir);
        expect(dom(R.Screens.today.ust()).textContent.length > 0).toBeTruthy();
        /* Durum satırı tarihsiz: «Hafta 3/40» kalır, gün ve tarih yazılmaz. */
        expect(/\d{4}|Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar/.test(R.Screens.today.ust())).toBe(false);
      });
    });

    it('oz-004 cümle TEK cümledir ve günün durumuna göre kurulur', async () => {
      await withTodayAsync('2026-10-12', async () => {
        const gun = await hazirla();
        const iso = R.U.todayISO();
        const bloklar = gun.blocks.filter(b => b.slot !== 'Dinlenme');
        bloklar[0].startedAt = new Date().toISOString();
        const suren = R.Screens.today.cumle(gun, iso);
        expect(suren.indexOf(' bloğu sürüyor; 0/' + bloklar.length + ' blok bitti') > 0).toBeTruthy();
        bloklar.forEach(b => { b.startedAt = null; b.status = 'done'; });
        expect(R.Screens.today.cumle(gun, iso).indexOf('Bugünün ' + bloklar.length + ' bloğu da kapandı') === 0).toBeTruthy();
        const borc = R.Calc.cardDebt;
        try{
          R.Calc.cardDebt = () => 34;
          expect(R.Screens.today.cumle(gun, iso)).toContain('; tekrar borcu %34.');
        }finally{ R.Calc.cardDebt = borc; }
        [suren, R.Screens.today.cumle(gun, iso)].forEach(c => {
          expect(/\.$/.test(c)).toBeTruthy();
          expect(/[.!?]\s+\S/.test(c)).toBeFalsy();
        });
        expect(R.Screens.today.cumle(Object.assign({}, gun, { ara:true }), iso)).toBe('Bugün ara günü; plan boş.');
        expect(R.Screens.today.cumle(Object.assign({}, gun, { blocks:[] }), iso)).toBe('Bugün için blok yok.');
      });
    });

    it('oz-042 Bugün ekranında en büyük öğe sıradaki blok; 390 pikselde de ilk ekranda görünür.', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        /* 390 px'lik gerçek bir kaba basılır: ölçü uygulamanın CSS'iyle. */
        const kap = document.createElement('div');
        kap.style.cssText = 'position:absolute;left:-10000px;top:0;width:390px';
        kap.innerHTML = String(await R.Screens.today.render());
        document.body.appendChild(kap);
        try{
          const simdi = kap.querySelector('.bugun__alan[aria-label="Şimdi"]');
          const kahraman = simdi.querySelector('.kahraman[data-oz="042"]');
          expect(kahraman.querySelector('.nextup')).toBeTruthy();
          /* Şimdi alanında kahramandan önce yalnız acil uyarı durabilir. */
          /* Alan etiketi (v5 «Şimdi» yazısı) içerik değil, alanın adıdır. */
          const once = Array.prototype.filter.call(simdi.children, el => !el.classList.contains('bugun__etiket')
            && (el.compareDocumentPosition(kahraman) & 4));
          expect(once.length <= 1).toBeTruthy();
          /* En büyük: başlığı ekrandaki her kart başlığından büyük; alanın
             tek dolu düğmesi onun içinde. */
          const px = el => parseFloat(getComputedStyle(el).fontSize);
          const baslik = px(kahraman.querySelector('.nextup__title'));
          const digerleri = Array.prototype.map.call(kap.querySelectorAll('.kutu__ad'), px);
          expect(digerleri.length > 0).toBeTruthy();
          digerleri.forEach(d => expect(baslik > d).toBeTruthy());
          const dolu = simdi.querySelectorAll('.btn--primary');
          expect(dolu).toHaveLength(1);
          expect(kahraman.contains(dolu[0])).toBeTruthy();
          /* Kahraman 390 px'te taşmaz ve tek ekrana sığar (780 px'lik telefon
             ekranının yarısından az). Üst çubuk + sayfa başıyla birlikte ilk
             ekranda olduğu gerçek sayfada ölçülür (layoutcheck, H). */
          const r = kahraman.getBoundingClientRect();
          expect(r.width <= 390).toBeTruthy();
          expect(r.height < 390).toBeTruthy();
        }finally{ kap.remove(); }
      });
    });

    it('Günün ayrıntısında en çok bir dolu düğme: sistem önerisi «Uygula»sı ritüel düğmesiyle yarışmaz', async () => {
      /* Pazar: «Haftayı kapat» önerisi tone:'primary' taşır; ritüel kartının
         kendi dolu düğmesi de vardır. Sadelik bütçesi (tools/sadelik.js)
         ekranda en çok bir dolu düğme ister — Pazar günü iki çıkıyordu. */
      await withTodayAsync('2026-10-11', async () => {
        await hazirla();
        const eski = R.Auto.suggestions;
        R.Auto.suggestions = () => [
          { id:'close-week', icon:'check', title:'Haftayı kapat', why:'x', act:'auto-close-week', tone:'primary' },
          { id:'drift', icon:'warn', title:'Plan sapması', why:'y', act:'go', data:{ 'data-route':'protocols' }, tone:'primary' },
        ];
        try{
          const k = dom(await R.Screens.gun.render());
          const oneri = Array.from(k.querySelectorAll('[data-act="auto-close-week"], .autorow [data-route="protocols"]'));
          expect(oneri).toHaveLength(2);
          oneri.forEach(b => expect(b.classList.contains('btn--primary')).toBe(false));
          expect(k.querySelectorAll('.btn--primary').length <= 1).toBe(true);
        }finally{ R.Auto.suggestions = eski; }
      });
    });

    /* v5 Durum alanı vitrin kartlarıyla kurulur: sayı 024, fark 028,
       çizgi 027, eşik çubuğu 029, tik sayacı 030, terim ipucu 016. */
    /* Kutu adının GÖRÜNEN yazısı: terim ipucunun kartı (tanım) sayılmaz. */
    const adMetni = el => { const c = el.cloneNode(true);
      c.querySelectorAll('.terim__kart').forEach(x => x.remove()); return c.textContent.trim(); };
    const durumKart = (k, ad) => Array.from(k.querySelectorAll('.bugun__alan[aria-label="Durum"] .kutu'))
      .find(x => x.querySelector('.kutu__ad') && adMetni(x.querySelector('.kutu__ad')) === ad);

    it('v5 Durum: günlük sayaç, son deneme, tekrar borcu yan yana; deneme ve kart yoksa «veri yok», sıfır değil', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const exams = R.S.exams, cards = R.S.cards;
        try{
          R.S.exams = []; R.S.cards = [];
          const k = dom(await R.Screens.gun.render());
          const adlar = Array.from(k.querySelectorAll('.bugun__alan[aria-label="Durum"] .kutu__ad')).map(adMetni);
          expect(adlar.slice(0, 3).join(',')).toBe('Günlük sayaç,Son deneme,Tekrar borcu');
          expect(durumKart(k, 'Son deneme').querySelector('.kutu__yuva').textContent.trim()).toBe('veri yok');
          const borc = durumKart(k, 'Tekrar borcu');
          expect(borc.querySelector('.kutu__yuva').textContent.trim()).toBe('veri yok');
          expect(borc.querySelector('[data-oz~="024"]')).toBeTruthy();
          expect(borc.querySelector('.durumkart__sayi').textContent).toContain('—');
          expect(borc.querySelector('[data-oz="029"]')).toBeNull();
          /* Terim ipucu (016): kutunun adı sözlükten gelir. */
          expect(borc.querySelector('.kutu__ad [data-oz="016"]')).toBeTruthy();
        }finally{ R.S.exams = exams; R.S.cards = cards; }
      });
    });

    it('v5 Durum: son deneme neti SAYI ile (024), farkı fark rozetiyle (028), seyri çizgiyle (027)', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const exams = R.S.exams;
        const e = (id, date, correct, wrong) => ({ id, family:'TYT', kind:'full', date, tests:[{ correct, wrong }] });
        try{
          R.S.exams = [e('d1', '2026-10-01', 80, 8), e('d2', '2026-10-08', 84, 6)];
          const son = durumKart(dom(await R.Screens.gun.render()), 'Son deneme');
          expect(son.querySelector('.kutu__yuva').textContent.trim()).toBe('hesaplandı');
          const sayi = son.querySelector('[data-oz~="024"]');
          expect(sayi.textContent).toContain('82,5');
          const fark = son.querySelector('[data-oz="028"]');
          expect(fark).toBeTruthy();
          expect(fark.className).toContain('fark--iyi');
          expect(son.querySelector('svg[data-oz~="027"]')).toBeTruthy();
        }finally{ R.S.exams = exams; }
      });
    });

    it('v5 Durum: tekrar borcu eşik çubuğuyla (029); günlük sayaç tik sayacıyla (030)', async () => {
      await withTodayAsync('2026-10-12', async () => {
        const gun = await hazirla();
        const cards = R.S.cards;
        try{
          R.S.cards = [{ id:'k1', dueAt:'2026-10-01' }, { id:'k2', dueAt:'2026-10-12' }];
          const k = dom(await R.Screens.gun.render());
          const borc = durumKart(k, 'Tekrar borcu');
          expect(borc.querySelector('[data-oz="029"]')).toBeTruthy();
          expect(borc.querySelector('.kutu__yuva').textContent.trim()).toBe('hesaplandı');
          if(Number.isInteger(gun.paragraphTarget) && gun.paragraphTarget <= 30){
            expect(durumKart(k, 'Günlük sayaç').querySelector('[data-oz="030"]')).toBeTruthy();
          }
        }finally{ R.S.cards = cards; }
      });
    });

    /* Dönen Durum (2026-10-02): Bugün'de dört büyük kart yerine tek küçük
       dönen kart; maddeler kural motorundan, eksik veri cümle. */
    it('sadelik: Bugün Durum tek dönen kart; dört kart Ayrıntı\u2019da; eksik veri sıfır değil cümle', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const exams = R.S.exams, cards = R.S.cards;
        try{
          R.S.exams = []; R.S.cards = [];
          const k = dom(await R.Screens.today.render());
          const durum = k.querySelector('.bugun__alan[aria-label="Durum"]');
          /* iki küçük widget: Bugün (sayaç, seri) ve Gidişat (deneme, borç, sınav) */
          expect(Array.from(durum.querySelectorAll('.donen')).map(d => d.getAttribute('aria-label')).join(',')).toBe('Bugün,Gidişat');
          expect(durum.querySelectorAll('.kutu .ozet, .durumkart').length).toBe(0);
          const ust = Array.from(durum.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());
          expect(ust.indexOf('Son deneme') >= 0 && ust.indexOf('Tekrar borcu') >= 0 && ust.indexOf('Sınav') >= 0).toBe(true);
          const metin = durum.textContent;
          expect(metin).toContain('Henüz tam deneme yok.');
          expect(metin).toContain('Tekrar kartı yok.');
          /* Görünmeyen madde odak almaz. */
          expect(durum.querySelectorAll('.donen__madde:not([inert])').length).toBe(2);
          const a = dom(await R.Screens.gun.render());
          const adlar = Array.from(a.querySelectorAll('.bugun__alan[aria-label="Durum"] .kutu__ad')).map(adMetni);
          expect(adlar.slice(0, 3).join(',')).toBe('Günlük sayaç,Son deneme,Tekrar borcu');
        }finally{ R.S.exams = exams; R.S.cards = cards; }
      });
    });

    /* Hafta sade (2026-10-02): ara sıra bakılan bölümler baştan küçük. Anahtar
       yanlış yazılırsa bölüm sessizce açık kalırdı: her anahtar gerçek bir
       bölüme denk gelmeli. */
    it('sadelik: Hafta\u2019nın baştan küçük bölümleri gerçek bölümlere denk gelir', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const kok = document.createElement('div');
        kok.innerHTML = String(await R.Screens.week.render());
        document.body.appendChild(kok);
        try{
          const G = window.LIFEOS.Gizle;
          const var_ = G.bolumler(kok).map(b => b.anahtar);
          (R.Screens.week.kucukVarsayilan || []).forEach(a => expect(var_.indexOf(a) >= 0).toBe(true));
          /* iPhone Faz 1: ara sıra bakılanlar app.js SADE_GIZLI'de (iphone.test.js);
             burada yalnız özet şerittir. */
          expect((R.Screens.week.kucukVarsayilan || []).indexOf('haftanın-özeti') >= 0).toBe(true);
          expect(String(R.Screens.week.actions())).toBe('');
        }finally{ kok.remove(); }
      });
    });

    /* Hafta (2026-10-02): «Hafta özeti» soruyu yalnız bloklardan (208),
       «Haftalık değerlendirme» günün sorusundan (473) sayıyordu. İkisi tek
       kart oldu ve soru TEK TANIMDAN gelir (HATALAR O-5). */
    it('sadelik: Haftanın özeti tek kart; soru günün sorusu tanımından (plan dışı dahil)', async () => {
      await withTodayAsync('2026-10-12', async () => {
        const gun = await hazirla();
        const b = gun.blocks.filter(x => x.slot !== 'Dinlenme')[0];
        b.status = 'done'; b.actualQ = 10; b.correctQ = 8;
        gun.freeQ = 40;
        const n = R.Model.currentWeek();
        const qr = R.Calc.questionRealization(n);
        expect(qr.solved >= 50).toBe(true);
        const k = dom(await R.Screens.week.render());
        const basliklar = Array.from(k.querySelectorAll('.card__title, h3, .kutu__ad')).map(x => x.textContent.trim());
        expect(basliklar.indexOf('Hafta özeti')).toBe(-1);
        expect(basliklar.indexOf('Haftalık değerlendirme')).toBe(-1);
        expect(basliklar.indexOf('Konu kapsamı')).toBe(-1);
        const kart = Array.from(k.querySelectorAll('.card, .lrow')).find(x => /Haftanın özeti/.test(x.textContent));
        expect(!!kart).toBe(true);
        expect(kart.textContent).toContain(R.U.fmtNum(qr.solved));
        expect(!!k.querySelector('[data-oz="049"]')).toBe(true);
      });
    });

    /* Deneme (2026-10-02): sağ sütunun beş kartı tek dönen «Gidişat» kartı.
       Az denemede sıralama sayı değil cümledir. */
    it('sadelik: Deneme sağ sütunu tek dönen kart; az denemede sıralama cümle', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const exams = R.S.exams;
        try{
          R.S.exams = [];
          const k = dom(await R.Screens.exams.render());
          const d = k.querySelector('.donen[aria-label="Gidişat"]');
          expect(!!d).toBe(true);
          const ust = Array.from(d.querySelectorAll('.donen__ust')).map(x => x.textContent.trim());
          expect(ust[0]).toBe('Sıralama');
          expect(d.textContent).toContain('Tahmin için 3 tam deneme gerekir.');
        }finally{ R.S.exams = exams; }
      });
    });

    it('oz-042 kurulum bitmemişse kahraman yerine kurulum kartı', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.profile.setupDone = false;
        const k = dom(await R.Screens.today.render());
        if(R.Setup.needed()) expect(k.querySelector('[data-oz="042"]')).toBeNull();
        R.S.profile.setupDone = true;
      });
    });

    /* SADELİK — aynı bilgi Bugün'de bir kez söylenir (kullanıcı, 2026-10-01:
       «her şey her yerde, hiç anlaşılır değil»). Sıradaki blok başlıkta ve
       kahramanda durur; günün açılışı kartı aynı işi, aynı «başla» eylemini
       üçüncü kez tekrarlıyordu. Özet kutusu Durum'daki sayıları ikinci kez
       yazıyordu ve tekrar borcunu bir yerde «veri yok», öbüründe «%0» diye
       çeliştiriyordu. */
    it('sadelik: günün açılışı (006) Bugün\'de kahramanı tekrarlamaz, Ayrıntı\'da durur', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const k = dom(await R.Screens.today.render());
        expect(k.querySelector('[data-oz="042"]')).toBeTruthy();
        expect(k.querySelector('[data-oz~="006"]')).toBeNull();
        const a = dom(await R.Screens.gun.render());
        if(window.LIFEOS && LIFEOS.VITRIN) expect(a.querySelector('[data-oz~="006"]')).toBeTruthy();
      });
    });

    it('sadelik: yedek hatırlatması Bugün’de durmaz, Ayrıntı’da durur', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const due = R.Model.backupDue;
        try{
          R.Model.backupDue = () => true;
          expect(dom(await R.Screens.today.render()).textContent.indexOf('Yedekleme.')).toBe(-1);
          expect(dom(await R.Screens.gun.render()).textContent).toContain('Yedekleme.');
        }finally{ R.Model.backupDue = due; }
      });
    });

    it('sadelik: Günün akışı planlanan toplam süreyi de söyler', async () => {
      await withTodayAsync('2026-10-12', async () => {
        const gun = await hazirla();
        const bl = gun.blocks.filter(b => b.slot !== 'Dinlenme');
        const dk = bl.reduce((t, b) => t + (Number(b.targetMin) || 0), 0);
        const akis = durumKart(dom(await R.Screens.today.render()), 'Günün akışı');
        const yuva = akis.querySelector('.kutu__yuva').textContent;
        expect(yuva).toContain(bl.length + ' blok · 0 bitti');
        if(dk > 0) expect(yuva).toContain(R.Screens.today.sureMetni(dk));
      });
    });

    it('sadelik: Özet yalnız Durum\'da olmayan sayıları taşır; alan adı kutu adıyla iki kez görünmez', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const k = dom(await R.Screens.gun.render());
        const adlar = Array.from(k.querySelectorAll('.ozet__ad')).map(x => x.textContent.trim());
        expect(adlar.join(',')).toBe('Sınava kalan,Seri');
        /* Özet ayrı bir sağ sütun değil: Durum'un kutularından biri. */
        expect(k.querySelector('.bugun__alan[aria-label="Özet"]')).toBeNull();
        expect(k.querySelector('.bugun__alan[aria-label="Durum"] .ozet')).toBeTruthy();
        expect(dom(await R.Screens.today.render()).querySelector('.bugun__sag')).toBeNull();
      });
    });

    it('oz-024 Ekrandaki her sayı brand/ortak/kesinlik ile işaretli; «veri yok» olan sayı hiçbir yerde 0 olarak çizilmez. (AYS Bugün › Özet)', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.profile.examTytISO = null;
        let k = dom(await R.Screens.gun.render());
        const ozet = k.querySelector('.ozet');
        const sayilar = ozet.querySelectorAll('.sayi');
        expect(sayilar).toHaveLength(2);
        sayilar.forEach(s => {
          expect(s.getAttribute('data-kesinlik').length > 0).toBeTruthy();
          expect(s.hasAttribute('data-etiketsiz')).toBeFalsy();
        });
        /* Sınav tarihi planın varsayılanıyken kalan gün TAHMİNDİR. */
        expect(sayilar[0].getAttribute('data-kesinlik')).toBe('estimated');
        /* Kutunun başındaki glif en zayıf sayınınki. */
        expect(ozet.closest('.kutu').querySelector('.kutu__yuva .kesinlik--estimated')).toBeTruthy();
        R.S.profile.examTytISO = '2027-06-20';
        k = dom(await R.Screens.gun.render());
        expect(k.querySelector('.ozet .sayi').getAttribute('data-kesinlik')).toBe('computed');
        R.S.profile.examTytISO = null;
      });
    });
  });

  /* Siri «Bugün ne var?» (hesap sunucu sözü 21): sesli özet günün cümlesidir;
     gün belgesi yoksa «plan yok» denir, boş dize gitmez. */
  describe('Bugün — Siri özeti (sesli)', () => {
    it('günün cümlesi; plan yoksa söylenir', async () => {
      await withTodayAsync('2026-11-10', async () => {
        resetState();
        expect(R.Screens.today.sesli()).toBe('Bugün için plan yok.');
        const gun = await hazirla();
        expect(R.Screens.today.sesli()).toBe(R.Screens.today.cumle(gun, R.U.todayISO()));
        expect(R.Screens.today.sesli().length > 0).toBe(true);
      });
    });
  });
})();
