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

    /* HATA (2026-10-25): elle giriş aynı tarihteki ilk oturuma yazıp açlığı
       ezerdi: «Bilmiyorum» bilinen «Aç»ı siliyor, «Tok» önceki glukozu tok
       yapıyordu. Yapıştırmayla aynı kural: uyumluya eklenir, bilinmeyen
       bilineni ezmez, çelişirse aynı tarihte ayrı test olur. */
    it('elle giriş bilinen açlığı ezmez; çelişen açlık ayrı test olur', async () => {
      resetState();
      const D = '2026-03-07';
      const ilk = pushLab(D, { glucose:88 });
      ilk.fasting = 'yes';
      const gir = async (fasting, id, deger) => {
        const kap = document.createElement('div');
        kap.innerHTML = '<div class="entryrow"><input data-id="' + id + '"></div><div class="entrybar"><span class="small"></span></div>';
        document.body.appendChild(kap);
        try{
          await L().change['entry-date']({ value:D });
          await L().change['entry-fasting']({ value:fasting });
          const inp = kap.querySelector('input');
          inp.value = deger;
          await L().change['entry-val'](inp);
          await L().handle['entry-save']();
        }finally{ kap.remove(); }
      };
      await sessiz(async () => {
        await gir('unknown', 'ferritin', '28');
        expect(SP.S.labs.length).toBe(1);
        expect(SP.S.labs[0].fasting).toBe('yes');
        expect(SP.S.labs[0].values.ferritin.v).toBe(28);
        await gir('no', 'glucose', '140');
      });
      expect(SP.S.labs.length).toBe(2);
      const once = SP.S.labs.find(l => l.id === ilk.id);
      expect([once.fasting, once.values.glucose.v]).toEqual(['yes', 88]);
      const yeni = SP.S.labs.find(l => l.id !== ilk.id);
      expect([yeni.fasting, yeni.values.glucose.v]).toEqual(['no', 140]);
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
        await L().handle['run-paste']();
        expect(document.getElementById('sheet').textContent).toContain('Ferritin');
        /* 2026-10-25: tarih onizlemede durur ve KAYDETME anında okunur. */
        document.getElementById('pv-date').value = '2026-03-05';
        await L().handle['save-paste']();
      });
      const l = SP.S.labs.find(x => x.date === '2026-03-05');
      expect(!!l).toBe(true);
      expect([l.values.ferritin.v, l.values.glucose.v]).toEqual([22, 91]);
    });

    /* 2026-10-25 veri girisi turu: onizlemede tarih, aclik, birim onayi
       ve eslesmeyen satiri baglama; elle giriste siralama. */
    it('önizleme metindeki tarihi önerir; Tok seçilirse oturum tok yazılır', async () => {
      resetState();
      await sessiz(() => SP.Test.withTodayAsync('2026-10-25', async () => {
        await L().handle['open-paste']();
        document.getElementById('paste-text').value = 'Tarih 12.10.2026\nFerritin 22 ng/mL';
        await L().handle['run-paste']();
        expect(document.getElementById('pv-date').value).toBe('2026-10-12');
        await L().handle['pv-fasting']({ dataset:{ value:'no' } });
        expect(document.querySelector('[data-act="pv-fasting"][data-value="no"]')
          .getAttribute('aria-pressed')).toBe('true');
        /* Yeniden cizim tarihi geri almaz. */
        expect(document.getElementById('pv-date').value).toBe('2026-10-12');
        await L().handle['save-paste']();
      }));
      expect(SP.S.labs.length).toBe(1);
      expect(SP.S.labs[0].date).toBe('2026-10-12');
      expect(SP.S.labs[0].fasting).toBe('no');
    });

    it('birimi uyuşmayan satır önizlemede işaretsiz gelir ve kaydedilmez', async () => {
      resetState();
      await sessiz(async () => {
        await L().handle['open-paste']();
        document.getElementById('paste-text').value = 'Ferritin 28 qux/zud\nGlukoz 91 mg/dL';
        await L().handle['run-paste']();
        const kutular = document.querySelectorAll('#sheet [data-act="toggle-row"]');
        expect([kutular[0].checked, kutular[1].checked]).toEqual([false, true]);
        document.getElementById('pv-date').value = '2026-03-05';
        await L().handle['save-paste']();
      });
      const l = SP.S.labs.find(x => x.date === '2026-03-05');
      expect(l.values.ferritin).toBeUndefined();
      expect(l.values.glucose.v).toBe(91);
    });

    it('eşleşmeyen satır seçilen ölçüme bağlanır; aynı güne yapıştırma mevcut oturuma eklenir', async () => {
      resetState();
      pushLab('2026-03-05', { hgb:13.1 });
      await sessiz(async () => {
        await L().handle['open-paste']();
        document.getElementById('paste-text').value = 'Ferr. 28';
        await L().handle['run-paste']();
        const sec = document.querySelector('#sheet select[data-change="pv-bind"]');
        expect(!!sec).toBe(true);
        expect(!!sec.getAttribute('aria-label')).toBe(true);
        sec.value = 'ferritin';
        await L().change['pv-bind'](sec);
        expect(document.getElementById('sheet').textContent).toContain('Ferritin');
        document.getElementById('pv-date').value = '2026-03-05';
        await L().handle['save-paste']();
      });
      expect(SP.S.labs.length).toBe(1);
      expect(SP.S.labs[0].values.ferritin.v).toBe(28);
      expect(SP.S.labs[0].values.ferritin.cert).toBe('measured');
      expect(SP.S.labs[0].values.hgb.v).toBe(13.1);
    });

    /* 2026-10-25: ayni gune yapistirma kayitli degeri sessizce eziyordu ve
       onizleme once/sonra gostermiyordu. */
    async function yapistir(metin, tarih){
      await L().handle['open-paste']();
      document.getElementById('paste-text').value = metin;
      await L().handle['run-paste']();
      const d = document.getElementById('pv-date');
      d.value = tarih;
      await L().change['pv-date'](d);
    }

    it('kayıtlı değeri değişecek satır «28 → 35» gösterir, işaretsiz gelir; işaretlenmezse 28 kalır', async () => {
      resetState();
      pushLab('2026-03-05', { ferritin:28 });
      await sessiz(async () => {
        await yapistir('Ferritin 35 ng/mL\nGlukoz 91 mg/dL', '2026-03-05');
        const sheet = document.getElementById('sheet');
        expect(sheet.textContent.replace(/\s+/g, ' ')).toContain('28 → 35');
        const kutular = sheet.querySelectorAll('[data-act="toggle-row"]');
        expect([kutular[0].checked, kutular[1].checked]).toEqual([false, true]);
        await L().handle['save-paste']();
      });
      expect(SP.S.labs.length).toBe(1);
      expect(SP.S.labs[0].values.ferritin.v).toBe(28);
      expect(SP.S.labs[0].values.glucose.v).toBe(91);
    });

    it('işaretlenen satır kayıtlı değerin yerine yazılır', async () => {
      resetState();
      pushLab('2026-03-05', { ferritin:28 });
      await sessiz(async () => {
        await yapistir('Ferritin 35 ng/mL', '2026-03-05');
        const kutu = document.querySelector('#sheet [data-act="toggle-row"]');
        kutu.checked = true;
        await L().handle['toggle-row'](kutu);
        expect(document.querySelector('#sheet [data-act="toggle-row"]').checked).toBe(true);
        await L().handle['save-paste']();
      });
      expect(SP.S.labs.length).toBe(1);
      expect(SP.S.labs[0].values.ferritin.v).toBe(35);
    });

    it('açlığı çelişen yapıştırma aynı tarihte ayrı test olur ve önizleme bunu söyler', async () => {
      resetState();
      const ilk = pushLab('2026-03-05', { glucose:88 });
      ilk.fasting = 'yes';
      await sessiz(async () => {
        await yapistir('Glukoz 140 mg/dL', '2026-03-05');
        await L().handle['pv-fasting']({ dataset:{ value:'no' } });
        expect(document.getElementById('sheet').textContent).toContain('ayrı test');
        await L().handle['save-paste']();
      });
      expect(SP.S.labs.length).toBe(2);
      const once = SP.S.labs.find(l => l.id === ilk.id);
      expect(once.fasting).toBe('yes');
      expect(once.values.glucose.v).toBe(88);
    });

    it('elle girişte sabitlenenler ve son testtekiler önce gelir; değerler boş kalır', async () => {
      resetState();
      SP.S.profile = Object.assign({}, SP.S.profile || {}, { pinned:['tsh'] });
      pushLab('2026-01-10', { vitd:20 });
      const h = String(await L().render());
      const sira = Array.from(h.matchAll(/id="e-([^"]+)"/g)).map(m => m[1]);
      expect(sira[0]).toBe('tsh');
      expect(sira[1]).toBe('vitd');
      expect(/id="e-vitd"[^>]*value=""/.test(h)).toBe(true);
      expect(/id="e-vitd"[^>]*placeholder="20"/.test(h)).toBe(true);
    });

    it('hekim özeti PDF olarak kaydedilirken dosya adı tarihli olur, sonra eski başlık döner (fikir 36)', async () => {
      resetState();
      const eskiBaslik = document.title, eskiPrint = window.print;
      let baskidaki = null;
      window.print = () => { baskidaki = document.title; };
      try{
        await sessiz(() => SP.Test.withTodayAsync('2026-03-10', () => L().handle['pdf-doctor']()));
        expect(baskidaki).toBe('SPI-hekim-ozeti-2026-03-10');
        window.dispatchEvent(new Event('afterprint'));
        expect(document.title).toBe(eskiBaslik);
      }finally{ window.print = eskiPrint; document.title = eskiBaslik; }
    });
  });
})();
