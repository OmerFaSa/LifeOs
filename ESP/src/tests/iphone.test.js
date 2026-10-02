/* iPhone planı (belgeler/ekip/IPHONE-PLANI.md) · Faz 1 · Merdiven.

   Sözleşme §2.2 ve §2.4: açık yalnız bulunduğun yer; açıklama ⓘ'dedir,
   ekranda ikinci kez yazılmaz. Gizlemek uygulama düzeyindedir (ekranın
   kucukVarsayilan'ı); anahtar yanlış yazılırsa bölüm sessizce açık
   kalırdı — her anahtar gerçek bir bölüme denk gelmeli. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }

  describe('iPhone · Faz 1 · Merdiven', () => {

    it('Merdiven: ölçülemeyen kapılar ve kör noktalar şerit; Yol’da yalnız şimdiki kademe açık', async () => {
      resetState();
      ESP.S.ui.curDisc = 'lang';
      const d = yerlestir(await ESP.Screens.ladder.render());
      try{
        const G = window.LIFEOS.Gizle;
        const var_ = G.bolumler(d).map(b => b.anahtar);
        const kucuk = ESP.Screens.ladder.kucukVarsayilan;
        expect(kucuk.indexOf('ölçülemeyen-kapılar') >= 0).toBe(true);
        expect(kucuk.indexOf('bu-merdivenin-göremediği') >= 0).toBe(true);
        kucuk.forEach(a => expect(var_.indexOf(a) >= 0).toBe(true));
        const yol = ESP.Curriculum.roadmap('lang');
        const ad = st => G.anahtar('Kademe ' + ESP.LEVEL_BY_RANK[st.rank].short);
        const simdiki = yol.steps.filter(st => st.state === 'current');
        expect(simdiki.length).toBe(1);
        expect(kucuk.indexOf(ad(simdiki[0]))).toBe(-1);
        yol.steps.filter(st => st.state !== 'current').forEach(st => expect(kucuk.indexOf(ad(st)) >= 0).toBe(true));
      }finally{ d.remove(); }
    });

    it('Merdiven: açıklama paragrafları ekranda değil ⓘ’de', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.ladder.render());
      try{
        const metin = d.textContent;
        ['disiplinlerin ortalaması değildir', 'Kademe ardışıktır', 'en pahalı hatasıdır', 'ölçülemediği için önemsiz değildir']
          .forEach(t => expect(metin.indexOf(t)).toBe(-1));
        /* bilgi kaybolmadı: aynı öğreti ⓘ kartında */
        expect(ESP.HINTS.level.more).toContain('ortalaması değildir');
        expect(ESP.HINTS.ladder.more).toContain('ardışıktır');
        expect(!!d.querySelector('[data-hint="ladder"]')).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();
