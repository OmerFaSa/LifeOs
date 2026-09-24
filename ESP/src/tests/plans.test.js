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

  /* ==================== seviye, geri alma, kullanıcının isteği ====================

     AGENTS.md §1.9. Seviyeyi tür belirler. Kullanıcı istediyse küçük iş
     hemen uygulanır; ajanın kendi teklifi her zaman onay bekler. Her
     uygulanan iş GERİ ALINABİLİR — geri alınamayan küçük sayılamaz. */

  describe('teklif · seviye', () => {
    it('her türün geçerli bir seviyesi vardır', () => {
      P().KINDS.forEach(k => {
        expect(['kucuk', 'orta', 'buyuk'].indexOf(k.level) >= 0).toBeTruthy();
      });
    });

    it('bölüm açıp kapamak orta seviyedir ve yalnız koç/Patron işidir', () => {
      resetState();
      expect(P().KIND_BY_ID.bolum.level).toBe('orta');
      expect(P().allowed('patron', 'bolum')).toBeTruthy();
      expect(P().allowed('maestro', 'bolum')).toBeFalsy();
    });
  });

  describe('teklif · geri alma', () => {
    it('hedef geri alınınca silinir, teklif yeniden üretilebilir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('montaigne').filter(p => p.kind === 'goal')[0];
        await P().accept(t);
        expect(ESP.S.goals.length).toBe(1);
        const g = await P().geriAl(t.id);
        expect(g.ok).toBeTruthy();
        expect(ESP.S.goals.length).toBe(0);
        expect(P().record(t.id).state).toBe('undone');
      });
    });

    it('hatırlatıcı geri alınınca silinir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = P().proposalsFor('polyglot').filter(p => p.kind === 'reminder')[0];
        await P().accept(t);
        await P().geriAl(t.id);
        expect(ESP.S.reminders.length).toBe(0);
      });
    });

    it('günlük taban geri alınınca ESKİ değere döner', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        ESP.S.profile.dailyMinutes = 120;
        ['2026-09-12', '2026-09-11', '2026-09-10', '2026-09-09']
          .forEach(d => pushSession(d, 'lang', 20));
        const t = P().proposalsFor('mnemosyne').filter(p => p.kind === 'base')[0];
        await P().accept(t);
        expect(ESP.S.profile.dailyMinutes < 120).toBeTruthy();
        await P().geriAl(t.id);
        expect(ESP.S.profile.dailyMinutes).toBe(120);
      });
    });

    it('uygulanmamış teklif geri alınamaz', async () => {
      resetState();
      const r = await P().geriAl('yok');
      expect(r.ok).toBeFalsy();
    });
  });

  describe('teklif · kullanıcının isteği', () => {
    it('bölüm kapatma istense de onay bekler; onaylanınca kapanır, geri alınır', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = await P().talep({ kind:'bolum', payload:{ disc:'diction', on:false } });
        expect(t.otomatik).toBe(false);
        expect(ESP.Mod.isOn('diction')).toBe(true);
        expect(P().istekler().map(x => x.id)).toContain(t.row.id);
        const a = await P().accept(t.row.id);
        expect(a.ok).toBeTruthy();
        expect(ESP.Mod.isOn('diction')).toBe(false);
        await P().geriAl(t.row.id);
        expect(ESP.Mod.isOn('diction')).toBe(true);
      });
    });

    it('son açık bölüm kapatılamaz: istek düşer, nedeni söylenir', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await ESP.Mod.setAll(['lang']);
        const t = await P().talep({ kind:'bolum', payload:{ disc:'lang', on:false } });
        expect(t.row).toBe(null);
        expect(t.why.length > 5).toBeTruthy();
      });
    });

    it('küçük istek hemen uygulanır', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const t = await P().talep({ kind:'focus', payload:{ focus:'music' } });
        expect(t.otomatik).toBe(true);
        expect(ESP.S.profile.focus).toBe('music');
        await P().geriAl(t.row.id);
        expect(ESP.S.profile.focus == null || ESP.S.profile.focus !== 'music').toBeTruthy();
      });
    });

    it('«hiçbiri» ayarında küçük istek de bekler', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        await ESP.Office.saveSettings({ otomatikUygula:'hicbiri' });
        const t = await P().talep({ kind:'focus', payload:{ focus:'music' } });
        expect(t.otomatik).toBe(false);
        expect(ESP.S.profile.focus !== 'music').toBeTruthy();
      });
    });
  });

  describe('komut · konuşarak', () => {
    const K = () => ESP.Komut;

    it('«diksiyon çalışmak istemiyorum» bölümü kapatma isteğidir', () => {
      const r = K().anla('diksiyon çalışmak istemiyorum');
      expect(r.oneriler).toHaveLength(1);
      expect(r.oneriler[0]).toEqual({ kind:'bolum', payload:{ disc:'diction', on:false },
        metin:'diksiyon çalışmak istemiyorum' });
    });

    it('açma, gitar ve dil takma adları tanınır', () => {
      expect(K().anla('gitarı tekrar açmak istiyorum').oneriler[0].payload)
        .toEqual({ disc:'music', on:true });
      expect(K().anla('ingilizce bölümünü kapat').oneriler[0].payload)
        .toEqual({ disc:'lang', on:false });
      expect(K().anla('tarih bölümünü aç').oneriler[0].payload)
        .toEqual({ disc:'history', on:true });
    });

    it('günlük taban cümlesi tabana dönüşür', () => {
      expect(K().anla('günlük taban 45 dakika olsun').oneriler[0])
        .toEqual({ kind:'base', payload:{ minutes:45 }, metin:'günlük taban 45 dakika olsun' });
      expect(K().anla('günde 1 saat çalışacağım').oneriler[0].payload).toEqual({ minutes:60 });
    });

    it('hangi bölüm olduğu belli değilse sorulur', () => {
      const r = K().anla('bu bölümü kapat');
      expect(r.oneriler).toHaveLength(0);
      expect(r.sorular.length).toBe(1);
    });

    it('sıradan sohbet komut değildir', () => {
      ['bugün ne çalışayım', 'diksiyonda neden zorlanıyorum', 'merhaba']
        .forEach(m => expect(K().anla(m).komut).toBe(false));
    });

    /* KR-1: «diksiyonu kapatma» kapat önerisi oluyordu. Olumsuz istek
       tersine çevrilmez, sorulur; komutun kendisi olan olumsuz söz
       («istemiyorum», «çalışmayacağım») komut olarak kalır. */
    it('olumsuz istek tersine çevrilmez, sorulur', () => {
      [['diksiyonu kapatma', 'kapatma'], ['diksiyon istemiyorum demedim', 'demedim'],
        ['gitarı aç demedim', 'demedim'], ['felsefeyi kapatmayın', 'kapatmayın'],
        ['günde 1 saat çalışacağım demedim', 'demedim'],
        ['diksiyonu kapat demedim', 'demedim']]
        .forEach(([m, k]) => {
          const r = K().anla(m);
          expect([m, r.oneriler.length]).toEqual([m, 0]);
          expect(r.komut).toBe(true);
          expect(r.sorular[0].soru).toContain('«' + k + '»');
        });
    });

    it('komutun kendisi olan olumsuz söz komut olarak kalır', () => {
      expect(K().anla('diksiyon istemiyorum').oneriler[0].payload).toEqual({ disc:'diction', on:false });
      expect(K().anla('felsefe çalışmayacağım').oneriler[0].payload).toEqual({ disc:'philo', on:false });
      expect(K().anla('yazmayı kapat').oneriler[0].payload).toEqual({ disc:'writing', on:false });
      expect(K().anla('okuma bölümünü aç').oneriler[0].payload).toEqual({ disc:'reading', on:true });
    });

    it('sohbet: istek → onay sorusu → «evet» → «geri al», model çağrılmadan', async () => {
      resetState();
      await withTodayAsync('2026-09-12', async () => {
        const r1 = await ESP.Office.send('patron', 'diksiyon çalışmak istemiyorum');
        expect(r1.source).toBe('rules');
        expect(r1.text).toContain('Anladığım şu');
        expect(ESP.Mod.isOn('diction')).toBe(true);
        const r2 = await ESP.Office.send('patron', 'evet');
        expect(r2.source).toBe('rules');
        expect(ESP.Mod.isOn('diction')).toBe(false);
        const r3 = await ESP.Office.send('patron', 'geri al');
        expect(r3.text).toContain('Geri aldım');
        expect(ESP.Mod.isOn('diction')).toBe(true);
      });
    });
  });
})();
