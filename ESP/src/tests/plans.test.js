/* Teklif ve plan. Bu dosyanın tamamı tek bir ayrımı korur: ajan TEKLİF
   eder, kural motoru UYGULAR. Ajan hiçbir zaman doğrudan yazmaz. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushCard, pushSession, pushEvent } = ESP.Test;
  const P = () => ESP.Plans;

  describe('teklif · kapsam', () => {

    it('her teklif turunun bir sahibi ve notu vardir', () => {
      P().KINDS.forEach(k => {
        expect(String(k.label || '').length > 0).toBeTruthy();
        expect(String(k.note || '').length > 0).toBeTruthy();
        expect(['own', 'coach'].indexOf(k.scope) >= 0).toBeTruthy();
      });
    });

    /* Maestro hatirlatici kurabilir ama dil unitesi ekleyemez. */
    it('bir masa baska masanin isini teklif edemez', () => {
      resetState();
      expect(P().allowed('maestro', 'reminder')).toBeTruthy();
      expect(P().allowed('maestro', 'unit')).toBeFalsy();
      expect(P().allowed('polyglot', 'unit')).toBeTruthy();
    });

    it('koc isleri yalniz koca ve Patrona acik', () => {
      resetState();
      expect(P().allowed('mnemosyne', 'weekplan')).toBeTruthy();
      expect(P().allowed('patron', 'base')).toBeTruthy();
      expect(P().allowed('maestro', 'weekplan')).toBeFalsy();
      expect(P().allowed('herodot', 'base')).toBeFalsy();
    });

    it('kapali disiplinin masasi teklif uretmez', async () => {
      resetState();
      await ESP.Mod.set('music', false);
      expect(P().allowed('maestro', 'reminder')).toBeFalsy();
      expect(P().proposalsFor('maestro').length).toBe(0);
    });

    it('uretilen her teklif sahibinin kapsamindadir', () => {
      resetState();
      withToday('2026-09-12', () => {
        P().all().forEach(p => expect(P().allowed(p.agentId, p.kind)).toBeTruthy());
      });
    });

    it('bilinmeyen tur hicbir masaya acik degil', () => {
      resetState();
      expect(P().allowed('patron', 'sistemi-sil')).toBeFalsy();
    });
  });

  describe('teklif · uretim', () => {

    it('olculemeyen kapi icin olcum hatirlaticisi teklif edilir', () => {
      resetState();
      withToday('2026-09-12', () => {
        const list = P().proposalsFor('polyglot');
        expect(list.some(p => p.kind === 'reminder')).toBeTruthy();
      });
    });

    it('destesi bos bolum icin unite teklifi cikar', () => {
      resetState();
      withToday('2026-09-12', () => {
        const list = P().proposalsFor('herodot');
        expect(list.some(p => p.kind === 'unit')).toBeTruthy();
      });
    });

    it('reddedilen teklif bir daha uretilmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('polyglot')[0];
        expect(t != null).toBeTruthy();
        await P().decline(t);
        expect(P().proposalsFor('polyglot').some(p => p.id === t.id)).toBeFalsy();
      });
    });

    it('reddedilen teklifin KAYDI silinmez', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('polyglot')[0];
        await P().decline(t);
        expect(ESP.S.proposals.filter(p => p.id === t.id)[0].state).toBe('declined');
      });
    });
  });

  describe('teklif · uygulama', () => {

    it('hatirlatici teklifi onaylanınca gercek hatirlatici olur', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('polyglot').filter(p => p.kind === 'reminder')[0];
        const res = await P().accept(t);
        expect(res.ok).toBeTruthy();
        expect(ESP.S.reminders.length).toBe(1);
        expect(ESP.S.reminders[0].disc).toBe('lang');
      });
    });

    it('unite teklifi onaylanınca kartlar desteye girer', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('herodot').filter(p => p.kind === 'unit')[0];
        const res = await P().accept(t);
        expect(res.ok).toBeTruthy();
        expect(ESP.S.cards.length > 0).toBeTruthy();
        expect(ESP.S.cards[0].lang).toBe(ESP.HISTORY_DECK);
      });
    });

    it('hedef teklifi onaylanınca tarihli hedef acilir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('montaigne').filter(p => p.kind === 'goal')[0];
        expect(t != null).toBeTruthy();
        await P().accept(t);
        expect(ESP.S.goals.length).toBe(1);
        expect(ESP.S.goals[0].disc).toBe('writing');
      });
    });

    it('uygulanan teklif NE YAPTIGINI kaydeder', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('polyglot').filter(p => p.kind === 'reminder')[0];
        await P().accept(t);
        const kayit = ESP.S.proposals.filter(p => p.id === t.id)[0];
        expect(kayit.state).toBe('accepted');
        expect(kayit.applied.kind).toBe('reminder');
        expect(String(kayit.applied.id || '').length > 0).toBeTruthy();
      });
    });

    /* Kapsam disi bir teklif elle uydurulsa bile uygulanmaz. */
    it('kapsam disi teklif uygulanmaz', async () => {
      resetState();
      const sahte = { id:'x', agentId:'maestro', kind:'unit', disc:'lang',
        title:'x', why:'x', payload:{ unitId:'temel-fiil' } };
      const res = await P().accept(sahte);
      expect(res.ok).toBeFalsy();
      expect(ESP.S.cards.length).toBe(0);
    });

    /* Desen TAM KELIME arar. Alt dize aramak yanlis alarm uretir: «nefesi
       KESILmeden» icinde «sil» gecer ve bu bir silme islemi degildir.
       Ayni tuzak bu depoda ucuncu kez cikti; caresi her seferinde ayni:
       ESP.trRe ile Turkce farkinda kelime siniri. */
    it('hicbir teklif SILME islemi onermez', () => {
      resetState();
      const yikici = ESP.trRe('sil|silin|sildir|kaldır|temizle', 'i');
      /* Denetcinin kendisi denetlenir. */
      expect(yikici.test('nefesi kesilmeden okumak')).toBeFalsy();
      expect(yikici.test('bu kaydı sil')).toBeTruthy();
      withToday('2026-09-12', () => {
        P().all().forEach(p => expect(yikici.test(p.title)).toBeFalsy());
      });
    });

    it('gunluk taban teklifi profili degistirir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        ESP.S.profile.dailyMinutes = 120;
        ['2026-09-12', '2026-09-11', '2026-09-10', '2026-09-09']
          .forEach(d => pushSession(d, 'lang', 20));
        const t = P().proposalsFor('mnemosyne').filter(p => p.kind === 'base')[0];
        expect(t != null).toBeTruthy();
        await P().accept(t);
        expect(ESP.S.profile.dailyMinutes < 120).toBeTruthy();
      });
    });
  });

  describe('plan · haftalik', () => {

    it('plan yedi gun tasir ve bugunden baslar', () => {
      resetState();
      withToday('2026-09-12', () => {
        const p = P().weekPlan();
        expect(p.days.length).toBe(7);
        expect(p.days[0].date).toBe('2026-09-12');
      });
    });

    it('plan yalniz acik disiplinleri dagitir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        for(const id of ['music', 'diction', 'history', 'reading', 'writing', 'philo']){
          await ESP.Mod.set(id, false);
        }
        P().weekPlan().days.forEach(d => expect(d.disc).toBe('lang'));
      });
    });

    it('plan kurulmadan bugunun satiri yoktur', () => {
      resetState();
      withToday('2026-09-12', () => {
        expect(P().today()).toBeNull();
      });
    });

    it('kurulan planin bugunku satiri okunur', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await P().savePlan(P().weekPlan());
        const g = P().today();
        expect(g != null).toBeTruthy();
        expect(g.date).toBe('2026-09-12');
        expect(String(g.route || '').length > 0).toBeTruthy();
      });
    });

    it('plan kaldirilabilir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await P().savePlan(P().weekPlan());
        await P().clearPlan();
        expect(P().plan()).toBeNull();
      });
    });

    it('plan teklifi onaylanınca plan kurulur', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('mnemosyne').filter(p => p.kind === 'weekplan')[0];
        expect(t != null).toBeTruthy();
        await P().accept(t);
        expect(P().plan() != null).toBeTruthy();
      });
    });
  });
})();
