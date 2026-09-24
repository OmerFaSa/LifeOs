/* Testler ekranı (screens/labs.js, borç 18). 1482 satırlık ekranın kapsamı %23'tü:
   yedi sekmenin altısı, alt sayfalar ve giriş akışları hiç koşmuyordu.
   Kanıtladığı sözler: her sekme boş ve dolu durumda çizilir ve çıktıya
   «undefined» ya da «NaN» sızmaz; işaret, hekim özeti, oturum ve ilaç alt
   sayfaları açılır; elle giriş ve yapıştırma «ölçüldü» etiketiyle yazar;
   silinen oturum geri alınabilir. */

(function(){
  const { describe, it, expect, resetState, pushLab } = SP.Test;
  const L = () => SP.Screens.labs;
  const SEKMELER = ['sonuc', 'giris', 'gecmis', 'kiyas', 'panel', 'ilac', 'trend'];

  async function sessiz(fn){
    const eski = SP.App;
    SP.App = Object.assign({}, eski || {}, { render:function(){} });
    let kok = document.getElementById('toast-root');
    const yeni = !kok;
    if(yeni){ kok = document.createElement('div'); kok.id = 'toast-root'; document.body.appendChild(kok); }
    try{ return await fn(); }finally{
      SP.App = eski; SP.UI.closeSheet();
      if(yeni) kok.remove();
    }
  }
  function sizinti(h){ return /\bundefined\b|\bNaN\b/.test(String(h).replace(/<[^>]+>/g, ' ')); }
  function dolu(){
    pushLab('2026-01-10', { ferritin:18, glucose:92, ldl:130, vitd:14, b12:210, tsh:2.1, hgb:12.4 });
    pushLab('2026-03-02', { ferritin:26, glucose:88, ldl:118, vitd:24, b12:260, tsh:1.9, hgb:12.9 });
  }

  describe('Testler ekranı', () => {
    it('yedi sekme boş ve dolu durumda çizilir; undefined/NaN sızmaz', async () => {
      for(const veri of [false, true]){
        resetState();
        if(veri) dolu();
        await SP.Test.withTodayAsync('2026-03-10', async () => {
          for(const t of SEKMELER){
            SP.S.ui.labTab = t;
            if(t === 'trend') SP.S.ui.trendMarker = 'ferritin';
            const h = await L().render();
            expect(String(h).length > 50).toBe(true);
            expect(sizinti(h)).toBe(false);
          }
        });
      }
    });

    it('işaret, hekim özeti, oturum ve ilaç alt sayfaları açılır', async () => {
      resetState();
      dolu();
      await sessiz(async () => {
        const el = (d) => ({ dataset:d });
        await L().handle['open-marker'](el({ id:'ferritin' }));
        expect(document.querySelector('#sheet h3').textContent).toBe(SP.BIO_BY_ID.ferritin.name);
        expect(sizinti(document.getElementById('sheet').innerHTML)).toBe(false);
        await L().handle['open-doctor']();
        expect(document.querySelector('#sheet h3').textContent).toContain('Hekime');
        await L().handle['open-lab'](el({ id:SP.S.labs[0].id }));
        expect(!!document.getElementById('sheet')).toBe(true);
        await L().handle['add-med']();
        expect(document.querySelector('#sheet h3').textContent).toContain('İlaç');
      });
    });

    it('elle giriş «ölçüldü» yazar; boş giriş yazmaz; silinen oturum geri alınır', async () => {
      resetState();
      await sessiz(async () => {
        SP.S.ui.labTab = 'giris';
        const kap = document.createElement('div');
        kap.innerHTML = '<div class="entryrow"><input data-id="ferritin"></div><div class="entrybar"><span class="small"></span></div>';
        document.body.appendChild(kap);
        try{
          await L().handle['entry-save']();
          expect(SP.S.labs.length).toBe(0);
          const inp = kap.querySelector('input');
          inp.value = '31,5';
          await L().change['entry-val'](inp);
          await L().handle['entry-save']();
        }finally{ kap.remove(); }
        expect(SP.S.labs.length).toBe(1);
        expect(SP.S.labs[0].values.ferritin).toEqual({ v:31.5, cert:'measured', unit:SP.BIO_BY_ID.ferritin.unit });
        const id = SP.S.labs[0].id;
        await L().handle['del-lab']({ dataset:{ id } });
        expect(SP.S.labs.length).toBe(0);
        await SP.S.ui.undo.restore();
        expect(SP.S.labs.some(l => l.id === id)).toBe(true);
      });
    });

    it('yapıştırılan tahlil önizlenir ve onayla yazılır', async () => {
      resetState();
      await sessiz(async () => {
        await L().handle['open-paste']();
        document.getElementById('paste-text').value = 'Ferritin 22 ng/mL\nGlukoz 91 mg/dL';
        document.getElementById('paste-date').value = '2026-03-05';
        await L().handle['run-paste']();
        expect(document.getElementById('sheet').textContent).toContain('Ferritin');
        await L().handle['save-paste']();
      });
      const l = SP.S.labs.find(x => x.date === '2026-03-05');
      expect(!!l).toBe(true);
      expect([l.values.ferritin.v, l.values.glucose.v]).toEqual([22, 91]);
    });
  });
})();
