/* 119 ÖNERİ GEÇMİŞİ — modül tarafı (ekip/T-DEVIR.md «H → T DEVRİ» 1).

   Hata: bekleyen öneri yokken Onaylar yalnız boş durumu çiziyordu; «Son
   kararlar» (geçilen, geri alınan teklifler) o anda hiç görünmüyordu.

   Kanıtladığı sözler: bekleyen yokken de geçmiş çizilir ve data-oz="119"
   taşır; geçmiş de yoksa boş durum tek başına kalır; bekleyen varken de
   geçmiş aynı işareti taşır. Ajan teklifleri o günün verisinden üretilir;
   bekleyen-yok durumunu kurmak için Plans.all burada boş döndürülür. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const GECILEN = { id:'og1', kind:'daily-target', title:'Günlük hedef', state:'declined', source:'kural',
    at:'2026-10-11T08:00:00Z', gecme:{ neden:'uymuyor', nedenAd:'Bana uymuyor' } };

  async function ciz(bekleyenYok){
    const eski = ESP.Plans.all;
    if(bekleyenYok) ESP.Plans.all = () => [];
    try{ return dom(await ESP.Screens.onaylar.render()); }
    finally{ ESP.Plans.all = eski; }
  }

  describe('119 Öneri geçmişi — ESP Onaylar', () => {
    it('oz-119 bekleyen öneri yokken de «Son kararlar» görünür', async () => {
      resetState();
      ESP.S.proposals = [GECILEN];
      const k = await ciz(true);
      expect(k.textContent).toContain('Bekleyen öneri yok');
      const g = k.querySelector('[data-oz="119"]');
      expect(g).toBeTruthy();
      expect(g.querySelector('[data-oz="179"]')).toBeTruthy();
      expect(g.textContent).toContain('Bana uymuyor');
    });

    it('oz-119 geçmiş de yoksa boş durum tek başına kalır', async () => {
      resetState();
      ESP.S.proposals = [];
      const k = await ciz(true);
      expect(k.textContent).toContain('Bekleyen öneri yok');
      expect(k.querySelector('[data-oz="119"]')).toBeNull();
    });

    it('oz-119 bekleyen öneri varken geçmiş aynı işareti taşır', async () => {
      resetState();
      ESP.S.ui.kingTeklifler = [{ id:7, konu:'Okuma analizi', durum:'bekliyor', secenekler:[{ id:'a', ad:'Kısa', metin:'Kısa özet' }] }];
      ESP.S.proposals = [GECILEN];
      try{
        const k = await ciz(true);
        expect(k.textContent.indexOf('Bekleyen öneri yok') < 0).toBe(true);
        expect(k.querySelector('[data-oz="119"] [data-oz="179"]')).toBeTruthy();
      }finally{ ESP.S.ui.kingTeklifler = []; }
    });
  });
})();
