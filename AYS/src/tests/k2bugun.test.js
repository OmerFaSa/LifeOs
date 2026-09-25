/* K2 · AYS Bugün — 004 sayfa başı cümlesi, 042 kahraman, 024 Özet sayıları.

   Kural (ekip/EKIP-PLANI.md §4.1): P1 kartının kabul ölçütü testin İLK
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
          const k = dom(await R.Screens.today.render());
          const adlar = Array.from(k.querySelectorAll('.bugun__alan[aria-label="Durum"] .kutu__ad')).map(adMetni);
          expect(adlar.slice(0, 3).join(',')).toBe('Günlük sayaç,Son deneme,Tekrar borcu');
          expect(adlar).toContain('Günün akışı');
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
          const son = durumKart(dom(await R.Screens.today.render()), 'Son deneme');
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
          const k = dom(await R.Screens.today.render());
          const borc = durumKart(k, 'Tekrar borcu');
          expect(borc.querySelector('[data-oz="029"]')).toBeTruthy();
          expect(borc.querySelector('.kutu__yuva').textContent.trim()).toBe('hesaplandı');
          if(Number.isInteger(gun.paragraphTarget) && gun.paragraphTarget <= 30){
            expect(durumKart(k, 'Günlük sayaç').querySelector('[data-oz="030"]')).toBeTruthy();
          }
        }finally{ R.S.cards = cards; }
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

    it('oz-024 Ekrandaki her sayı brand/ortak/kesinlik ile işaretli; «veri yok» olan sayı hiçbir yerde 0 olarak çizilmez. (AYS Bugün › Özet)', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.profile.examTytISO = null;
        let k = dom(await R.Screens.today.render());
        const ozet = k.querySelector('.ozet');
        const sayilar = ozet.querySelectorAll('.sayi');
        expect(sayilar).toHaveLength(4);
        sayilar.forEach(s => {
          expect(s.getAttribute('data-kesinlik').length > 0).toBeTruthy();
          expect(s.hasAttribute('data-etiketsiz')).toBeFalsy();
        });
        /* Sınav tarihi planın varsayılanıyken kalan gün TAHMİNDİR. */
        expect(sayilar[0].getAttribute('data-kesinlik')).toBe('estimated');
        /* Kutunun başındaki glif en zayıf sayınınki. */
        expect(ozet.closest('.kutu').querySelector('.kutu__yuva .kesinlik--estimated')).toBeTruthy();
        R.S.profile.examTytISO = '2027-06-20';
        k = dom(await R.Screens.today.render());
        expect(k.querySelector('.ozet .sayi').getAttribute('data-kesinlik')).toBe('computed');
        R.S.profile.examTytISO = null;
      });
    });
  });
})();
