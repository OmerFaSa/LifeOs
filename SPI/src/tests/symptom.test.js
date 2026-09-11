/* Semptom günlüğü, döngü ve masalar arası devir.

   En kritik test: işaretlenmemiş bir gün "şikâyet yok" DEĞİL "girilmemiş"
   demektir. Eksik veri sıfır sayılmaz kuralının semptom tarafı. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushLab, pushVitals, pushWorkout } = SP.Test;
  const U = SP.U;

  describe('Semptom — sözlük', () => {
    it('her semptom bir gruba ve en az bir ölçüme bağlanır', () => {
      const gruplar = SP.SYMPTOM_GROUPS.map(g => g.id);
      SP.SYMPTOMS.forEach(s => {
        expect(gruplar.indexOf(s.group) >= 0).toBeTruthy();
        expect(Array.isArray(s.markers)).toBeTruthy();
      });
    });

    it('bağlanan her ölçüm biyobelirteç sözlüğünde vardır', () => {
      SP.SYMPTOMS.forEach(s => {
        (s.markers || []).forEach(m => {
          expect(Boolean(SP.BIO_BY_ID[m])).toBeTruthy();
        });
      });
    });

    it('hiçbir ipucu teşhis cümlesi kurmaz', () => {
      /* "…hastalığıdır", "…tanısı" gibi ifadeler sözlükte yasaktır. */
      SP.SYMPTOMS.forEach(s => {
        expect(/tanısı|hastalığıdır|teşhis/i.test(s.hint || '')).toBeFalsy();
      });
    });

    it('ters indeks her ölçüm için semptom listesi verir', () => {
      const list = SP.SYMPTOM_FOR_MARKER.ferritin || [];
      expect(list.length > 0).toBeTruthy();
    });
  });

  describe('Semptom — kayıt ve pencere', () => {
    it('şiddet 1–3 arasına kısılır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        await SP.Symptom.setSymptom('2026-03-01', 'yorgunluk', 9);
        expect(SP.Symptom.ofDay('2026-03-01').yorgunluk).toBe(3);
      });
    });

    it('sıfır şiddet kaydı siler', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        await SP.Symptom.setSymptom('2026-03-01', 'yorgunluk', 2);
        await SP.Symptom.setSymptom('2026-03-01', 'yorgunluk', 0);
        expect(SP.Symptom.ofDay('2026-03-01').yorgunluk).toBe(undefined);
      });
    });

    it('bilinmeyen semptom kaydedilmez', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        expect(await SP.Symptom.setSymptom('2026-03-01', 'uydurma', 2)).toBeNull();
      });
    });

    it('payda pencere değil GİRİLEN GÜN sayısıdır', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        /* Otuz günlük pencerede yalnız üç gün girilmiş; ikisinde şikâyet var. */
        pushVitals('2026-03-10', { symptomsLogged:true });
        pushVitals('2026-03-09', { symptomsLogged:true });
        pushVitals('2026-03-08', { symptomsLogged:true });
        await SP.Symptom.setSymptom('2026-03-10', 'yorgunluk', 2);
        await SP.Symptom.setSymptom('2026-03-09', 'yorgunluk', 1);
        const w = SP.Symptom.window(30);
        expect(w.loggedDays).toBe(3);
        const row = w.rows.find(r => r.id === 'yorgunluk');
        expect(row.days).toBe(2);
        /* %67 — %7 değil. Pencere payda olsaydı ikincisi çıkardı. */
        expect(row.pct).toBe(67);
      });
    });

    it('hiç giriş yoksa pencere ok değildir', () => {
      resetState();
      withToday('2026-03-10', () => {
        expect(SP.Symptom.window(30).ok).toBeFalsy();
      });
    });

    it('bir ölçümle birlikte okunacak şikâyetler ayrı çıkar', async () => {
      resetState();
      await withTodayAsync('2026-03-10', async () => {
        pushVitals('2026-03-10', { symptomsLogged:true });
        await SP.Symptom.setSymptom('2026-03-10', 'yorgunluk', 3);
        const f = SP.Symptom.forMarker('ferritin', 30);
        expect(f.ok).toBeTruthy();
        expect(f.rows.some(r => r.id === 'yorgunluk')).toBeTruthy();
      });
    });
  });

  describe('Semptom — döngü', () => {
    it('erkek profilde döngü hesaplanmaz', () => {
      resetState();
      SP.S.profile.sex = 'male';
      expect(SP.Symptom.cycle().na).toBeTruthy();
    });

    it('kanama işaretlenmemişse ok değildir ama sessiz kalmaz', () => {
      resetState();
      SP.S.profile.sex = 'female';
      const c = SP.Symptom.cycle();
      expect(c.ok).toBeFalsy();
      expect(c.note.length > 20).toBeTruthy();
    });

    it('tek dönem varsayılan uzunluğu kullanır ve bunu SÖYLER', () => {
      resetState();
      SP.S.profile.sex = 'female';
      withToday('2026-03-10', () => {
        pushVitals('2026-03-01', { period:true });
        pushVitals('2026-03-02', { period:true });
        const c = SP.Symptom.cycle();
        expect(c.ok).toBeTruthy();
        expect(c.measured).toBeFalsy();
        expect(c.length).toBe(28);
        expect(/varsayılan/i.test(c.note)).toBeTruthy();
      });
    });

    it('iki dönem ortalama uzunluğu ÖLÇER', () => {
      resetState();
      SP.S.profile.sex = 'female';
      withToday('2026-03-10', () => {
        pushVitals('2026-02-01', { period:true });
        pushVitals('2026-03-01', { period:true });
        const c = SP.Symptom.cycle();
        expect(c.measured).toBeTruthy();
        expect(c.length).toBe(28);
        expect(c.n).toBe(2);
      });
    });

    it('kanamaya yakın alınan demir ölçümüne not düşer', () => {
      resetState();
      SP.S.profile.sex = 'female';
      withToday('2026-03-10', () => {
        pushVitals('2026-03-01', { period:true });
        pushVitals('2026-03-02', { period:true });
        const n = SP.Symptom.cycleNote('ferritin', '2026-03-04');
        expect(n).toBeTruthy();
        expect(/demir deposu/i.test(n.text)).toBeTruthy();
      });
    });

    it('döngüden etkilenmeyen ölçüme not düşmez', () => {
      resetState();
      SP.S.profile.sex = 'female';
      withToday('2026-03-10', () => {
        pushVitals('2026-03-01', { period:true });
        expect(SP.Symptom.cycleNote('tsh', '2026-03-02')).toBeNull();
      });
    });
  });

  describe('Ofis — masalar arası devir', () => {
    it('boş sistemde devir üretilmez', () => {
      resetState();
      withToday('2026-03-01', () => {
        const h = SP.Office.handoffs();
        /* Ölçüm yoksa devredilecek bulgu da yoktur. */
        expect(h.every(x => x.from !== 'lab' || x.id === 'lab-move-flag')).toBeTruthy();
      });
    });

    it('bandın altındaki ölçüm Kerem\'den Nesrin\'e düşer', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:9 });
        const h = SP.Office.handoffs().find(x => /^lab-nutri-/.test(x.id));
        expect(h).toBeTruthy();
        expect(h.from).toBe('lab');
        expect(h.to).toBe('nutri');
        expect(h.fromName).toBe('Kerem');
        expect(h.toName).toBe('Nesrin');
        expect(h.route).toBe('meals');
        expect(/Ferritin/.test(h.finding)).toBeTruthy();
      });
    });

    it('bandın ÜSTÜNDEKİ ölçüm beslenmeye devredilmez', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:900 });
        expect(SP.Office.handoffs().some(x => /^lab-nutri-/.test(x.id))).toBeFalsy();
      });
    });

    it('aynı masaya giden üç ölçüm ÜÇ satır değil bir satır yazar', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:9, vitd:11, b12:160 });
        const rows = SP.Office.handoffs().filter(x => /^lab-nutri-/.test(x.id));
        /* En çok iki satır: açığı olan grup ve olmayan grup. */
        expect(rows.length <= 2).toBeTruthy();
        const hepsi = rows.map(r => r.finding).join(' ');
        expect(/Ferritin/.test(hepsi)).toBeTruthy();
        expect(/D vitamini/.test(hepsi)).toBeTruthy();
      });
    });

    it('açık kırmızı bayrak yük tavanını Barış\'a devreder', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:4 });
        SP.S.flags = SP.Model.evaluateFlags().map(f =>
          Object.assign({ status:'open', ack:false }, f));
        const h = SP.Office.handoffs().find(x => x.id === 'lab-move-flag');
        expect(h).toBeTruthy();
        expect(h.tone).toBe('danger');
        expect(h.to).toBe('move');
      });
    });

    it('toparlanma ölçümü hiç yoksa Barış Kerem\'e devreder', () => {
      resetState();
      withToday('2026-03-01', () => {
        const h = SP.Office.handoffs().find(x => x.id === 'move-lab-vital');
        expect(h).toBeTruthy();
        expect(h.route).toBe('labs');
        expect(h.ui.labTab).toBe('giris');
      });
    });

    it('ölçüm girilince o devir kapanır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushVitals('2026-03-01', { hrv:55, rhr:58 });
        expect(SP.Office.handoffs().some(x => x.id === 'move-lab-vital')).toBeFalsy();
      });
    });

    it('her devir iki AYRI masayı bağlar', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:9, vitd:12 });
        SP.Office.handoffs().forEach(h => {
          expect(h.from === h.to).toBeFalsy();
          expect(Boolean(SP.AGENT_BY_ID[h.from])).toBeTruthy();
          expect(Boolean(SP.AGENT_BY_ID[h.to])).toBeTruthy();
        });
      });
    });

    it('her devir tıklanabilir bir hedef taşır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:9 });
        SP.Office.handoffs().forEach(h => {
          expect(typeof h.route).toBe('string');
          expect(Boolean(SP.Screens[h.route])).toBeTruthy();
          expect(h.cta.length > 2).toBeTruthy();
        });
      });
    });

    it('acil devir listenin başında durur', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:4 });
        SP.S.flags = SP.Model.evaluateFlags().map(f =>
          Object.assign({ status:'open', ack:false }, f));
        const h = SP.Office.handoffs();
        expect(h[0].tone).toBe('danger');
      });
    });

    it('masanın kendi defteri giden ve geleni ayırır', () => {
      resetState();
      withToday('2026-03-01', () => {
        pushLab('2026-03-01', { ferritin:9 });
        const f = SP.Office.handoffsFor('nutri');
        expect(f.in.some(h => h.from === 'lab')).toBeTruthy();
        expect(f.out.every(h => h.from === 'nutri')).toBeTruthy();
      });
    });
  });
})();

/* Dalga 3.6 — alt sayfa ve kayan şerit.

   Bir kipli pencerede Tab'ın arkadaki sayfaya çıkabilmesi bir hata değil,
   bir yanıltmadır: görünmeyen bir düğmeye basılabiliyor demektir. */
(function(){
  const { describe, it, expect } = SP.Test;

  describe('Alt sayfa — odak ve kaydırma', () => {
    it('gerekçe satırı gövdenin başında durur', () => {
      SP.UI.sheet({ title:'Sınama', note:'Bu form neden doldurulur.',
        body:'<input id="sn-a"/>', noFocus:true });
      const n = document.querySelector('#sheet .sheet__note');
      expect(Boolean(n)).toBeTruthy();
      expect(n.textContent.indexOf('neden') >= 0).toBeTruthy();
      SP.UI.closeSheet();
    });

    it('açıkken arkadaki sayfa kaymaz, kapanınca eski haline döner', () => {
      const once = document.body.style.overflow;
      SP.UI.sheet({ title:'Sınama', body:'<input id="sn-b"/>', noFocus:true });
      expect(document.body.style.overflow).toBe('hidden');
      SP.UI.closeSheet();
      expect(document.body.style.overflow).toBe(once);
    });

    it('odak alt sayfanın içinde hapsolur', () => {
      SP.UI.sheet({ title:'Sınama',
        body:'<input id="sn-c"/><input id="sn-d"/>', noFocus:true });
      const el = document.getElementById('sheet');
      const list = Array.prototype.filter.call(
        el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]),'
          + ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        n => n.offsetParent !== null);
      /* Kapat düğmesi + iki alan: en az üç durak. */
      expect(list.length >= 3).toBeTruthy();
      const son = list[list.length - 1];
      son.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key:'Tab', bubbles:true }));
      expect(el.contains(document.activeElement)).toBeTruthy();
      SP.UI.closeSheet();
    });

    it('kapanınca odak açan ögeye döner', () => {
      const b = document.createElement('button');
      b.id = 'sn-opener'; b.textContent = 'aç';
      document.body.appendChild(b);
      b.focus();
      SP.UI.sheet({ title:'Sınama', body:'<input id="sn-e"/>', noFocus:true });
      SP.UI.closeSheet();
      expect(document.activeElement.id).toBe('sn-opener');
      b.remove();
    });

    it('ikinci alt sayfa birincinin kaydırma kilidini bırakmaz', () => {
      SP.UI.sheet({ title:'Bir', body:'<input id="sn-f"/>', noFocus:true });
      SP.UI.sheet({ title:'İki', body:'<input id="sn-g"/>', noFocus:true });
      expect(document.body.style.overflow).toBe('hidden');
      SP.UI.closeSheet();
      expect(document.body.style.overflow).toBe('');
    });
  });
})();
