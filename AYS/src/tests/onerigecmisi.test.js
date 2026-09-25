/* 119 ÖNERİ GEÇMİŞİ — modül tarafı (ekip/T-DEVIR.md «H → T DEVRİ» 1).

   Hata: bekleyen öneri yokken Onaylar yalnız boş durumu çiziyordu; «Son
   kararlar» (geçilen, geri alınan öneriler) o anda hiç görünmüyordu. En
   çok da tam o anda bakılır: «dün neyi geçmiştim?».

   Kanıtladığı sözler: bekleyen yokken de geçmiş çizilir ve data-oz="119"
   taşır; geçmiş de yoksa boş durum tek başına kalır (veri yokken tek
   eylem); bekleyen varken de geçmiş aynı işareti taşır. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const GECILEN = { id:'og1', action:'block-add', agent:'tyt', status:'rejected', source:'kural',
    at:'2026-10-11T08:00:00Z', gecme:{ neden:'uymuyor', nedenAd:'Bana uymuyor' } };

  describe('119 Öneri geçmişi — AYS Onaylar', () => {
    it('oz-119 bekleyen öneri yokken de «Son kararlar» görünür', async () => {
      resetState();
      R.S.officeProposals = [GECILEN];
      try{
        const k = dom(await R.Screens.onaylar.render());
        expect(k.textContent).toContain('Bekleyen öneri yok');
        const g = k.querySelector('[data-oz="119"]');
        expect(g).toBeTruthy();
        expect(g.querySelector('[data-oz="179"]')).toBeTruthy();
        expect(g.textContent).toContain('Bana uymuyor');
      }finally{ R.S.officeProposals = []; }
    });

    it('oz-119 geçmiş de yoksa boş durum tek başına kalır', async () => {
      resetState();
      R.S.officeProposals = [];
      const k = dom(await R.Screens.onaylar.render());
      expect(k.textContent).toContain('Bekleyen öneri yok');
      expect(k.querySelector('[data-oz="119"]')).toBeNull();
    });

    it('oz-119 bekleyen öneri varken geçmiş aynı işareti taşır', async () => {
      resetState();
      R.S.ui.kingTeklifler = [{ id:7, konu:'Deneme analizi', durum:'bekliyor', secenekler:[{ id:'a', ad:'Kısa', metin:'Kısa özet' }] }];
      R.S.officeProposals = [GECILEN];
      try{
        const k = dom(await R.Screens.onaylar.render());
        expect(k.textContent.indexOf('Bekleyen öneri yok') < 0).toBe(true);
        expect(k.querySelector('[data-oz="119"] [data-oz="179"]')).toBeTruthy();
      }finally{ R.S.ui.kingTeklifler = []; R.S.officeProposals = []; }
    });
  });
})();
