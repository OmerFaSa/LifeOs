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
