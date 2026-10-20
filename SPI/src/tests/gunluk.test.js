/* SPİ — kullanıcının kendi günü (2026-10-20, gerçek kullanımdan).

   Kanıtlanan:
     1. Öğünlerim (core/ogun.js): ad ve saat kullanıcının; silinen öğün
        geçmiş kayıtta adını korur; saat yazılıysa o saate göre seçilir.
     2. Kısa uyku (core/uyku.js): gece uykusundan ayrı, birden çok; hızlı
        giriş «öğlen 30 dakika uyudum»u kısa uyku, «45 dk yürüyüş»ü seans,
        «7 saat uyudum»u gece uykusu okur.
     3. Alışkanlık sayılıdır ve kayda bağlanabilir: aynı gün iki yürüyüş
        iki sayılır; bağlı madde işaretle değişmez (çift sayım yok).
     4. Plan maddesine ve hareket gününe zaman (dilim ya da saat) verilir;
        bugünün maddeleri zamana göre sıralanır.
     5. Uyku planı üç kiptedir ve planlı kısa uyku taşır. */

(function(){
  const { describe, it, expect, resetState, pushVitals, pushWorkout, withToday, withTodayAsync } = SP.Test;
  const HP = () => SP.HaftaPlan;
  const BUGUN = '2026-10-15';           // Perşembe

  describe('Öğünlerim — ad ve saat kullanıcının', () => {
    it('varsayılan altı öğün; yeniden adlandırma eski kaydı yeni adla okutur', async () => {
      resetState();
      expect(SP.Ogun.liste().map(x => x.id)).toEqual(['kahvalti', 'ara1', 'ogle', 'ara2', 'aksam', 'gece']);
      const l = SP.Ogun.liste().map(x => Object.assign({}, x));
      l[0].label = 'Gün başlangıcı'; l[0].saat = '07:30';
      const r = await SP.Ogun.kaydet(l);
      expect(r.ok).toBe(true);
      expect(SP.Ogun.ad('kahvalti')).toBe('Gün başlangıcı');
      expect(SP.MEAL_SLOTS.find(s => s.id === 'kahvalti').label).toBe('Gün başlangıcı');
      await SP.Ogun.geriAl(r);
      expect(SP.Ogun.ad('kahvalti')).toBe('Kahvaltı');
    });
    it('silinen öğün seçiciden kalkar ama adı geçmişte durur; eski «ara» kaydı «Ara öğün» okunur', async () => {
      resetState();
      const l = SP.Ogun.liste().filter(x => x.id !== 'gece');
      expect((await SP.Ogun.kaydet(l)).ok).toBe(true);
      expect(SP.Ogun.liste().some(x => x.id === 'gece')).toBe(false);
      expect(SP.Ogun.ad('gece')).toBe('Gece');
      expect(SP.Ogun.ad('ara')).toBe('Ara öğün');
    });
    it('saat yazılıysa öğün o saate göre seçilir; saat yoksa eski kural', async () => {
      resetState();
      const saatAt = (h, m) => { const d = new Date(2026, 9, 15, h, m); return d; };
      expect(SP.Ogun.simdiki(saatAt(8, 0))).toBe('kahvalti');
      const l = [SP.Ogun.yeni('Gün başlangıcı', '06:00'), SP.Ogun.yeni('Ana öğün', '14:00'), SP.Ogun.yeni('Akşam tabağı', '20:30')];
      expect((await SP.Ogun.kaydet(l)).ok).toBe(true);
      expect(SP.Ogun.ad(SP.Ogun.simdiki(saatAt(13, 40)))).toBe('Ana öğün');
      expect(SP.Ogun.ad(SP.Ogun.simdiki(saatAt(9, 0)))).toBe('Gün başlangıcı');
      expect(SP.Ogun.ad(SP.Ogun.simdiki(saatAt(23, 0)))).toBe('Akşam tabağı');
    });
    it('boş ad, aynı ad ve bozuk saat yazılmaz', async () => {
      resetState();
      expect((await SP.Ogun.kaydet([SP.Ogun.yeni('', null)])).ok).toBe(false);
      expect((await SP.Ogun.kaydet([SP.Ogun.yeni('A', null), SP.Ogun.yeni('a', null)])).ok).toBe(false);
      expect((await SP.Ogun.kaydet([SP.Ogun.yeni('A', '25:00')])).ok).toBe(false);
      expect(SP.Ogun.ad('kahvalti')).toBe('Kahvaltı');
    });
  });

  describe('Kısa uyku — gece uykusundan ayrı, birden çok', () => {
    it('hızlı giriş: kısa uyku, gece uykusu ve yürüyüş birbirine karışmaz', () => {
      expect(SP.Quick.parse('öğlen 30 dakika uyudum').kind).toBe('nap');
      expect(SP.Quick.parse('yarım saat şekerleme yaptım').data.dk).toBe(30);
      expect(SP.Quick.parse('13:30 20 dk kestirdim').data).toEqual({ dk:20, bas:'13:30' });
      expect(SP.Quick.parse('7 saat uyudum').kind).toBe('vital');
      const y = SP.Quick.parse('45 dk yürüyüş');
      expect(y.kind).toBe('move');
      expect(y.data.exercise.id).toBe('yuruyus');
      expect(SP.Quick.parse('7 saat uyumadım')).toBe(null);
    });
    it('iki kısa uyku ikisi de durur; gece uykusuna eklenmez, günün toplamı hesaplanır', async () => {
      resetState();
      const d = SP.U.todayISO();
      pushVitals(d, { sleep:7 });
      expect((await SP.Uyku.ekle(d, { dk:30, bas:'13:30' })).ok).toBe(true);
      expect((await SP.Uyku.ekle(d, { dk:20 })).ok).toBe(true);
      const g = SP.Uyku.gun(d);
      expect(g.kestirme.length).toBe(2);
      expect(SP.S.vitals[d].sleep).toBe(7);
      expect(g.toplamDk).toBe(7 * 60 + 50);
      expect((await SP.Uyku.ekle(d, { dk:300 })).ok).toBe(false);
      await SP.Uyku.sil(d, g.kestirme[0].id);
      expect(SP.Uyku.liste(d).length).toBe(1);
    });
    it('sohbetten kısa uyku önerisi onaylanır ve geri alınır', async () => {
      resetState();
      const d = SP.U.todayISO();
      const r = SP.Proposals.fromText('dün gece 7 saat uyudum ve öğlen 20 dk kestirdim');
      expect(r.oneriler.map(o => o.action)).toEqual(['vital-yaz', 'kestirme-ekle']);
      const t = await SP.Proposals.talep(Object.assign({ source:'istek' }, r.oneriler[1]));
      if(!t.otomatik) await SP.Proposals.approve(t.row.id);
      expect(SP.Uyku.liste(d).length).toBe(1);
      await SP.Proposals.undo(t.row.id);
      expect(SP.Uyku.liste(d).length).toBe(0);
    });
  });

  describe('Alışkanlık — sayılı, zamanlı, kayda bağlanabilir', () => {
    it('aynı gün iki yürüyüş: bağlı madde 2 / 2 sayar, işaret onu değiştirmez', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('su');
      p.maddeler = [Object.assign(HP().yeniMadde('Yürüyüş'), { id:'y', hedef:2, bag:'yuruyus' })];
      pushWorkout(BUGUN, { minutes:30, items:['yuruyus'] });
      expect(HP().sayim(p, p.maddeler[0], BUGUN)).toEqual({ n:1, hedef:2, tamam:false, kaynak:'kayit' });
      pushWorkout(BUGUN, { minutes:40, items:['yuruyus'] });
      expect(HP().sayim(p, p.maddeler[0], BUGUN).tamam).toBe(true);
      HP().isaretle(p, 'y', BUGUN);
      expect(HP().sayim(p, p.maddeler[0], BUGUN).n).toBe(2);
      expect(HP().bugun(p, BUGUN).metin).toContain('1 / 1 alışkanlık');
    }));
    it('bağsız sayılı madde dokunuşla artar, (−) ile azalır; hedefe ulaşınca tamam', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('serbest', 'Gün');
      p.maddeler = [Object.assign(HP().yeniMadde('Bardak su'), { id:'b', hedef:3 })];
      HP().isaretle(p, 'b', BUGUN); HP().isaretle(p, 'b', BUGUN);
      expect(HP().sayim(p, p.maddeler[0], BUGUN).n).toBe(2);
      HP().isaretle(p, 'b', BUGUN);
      expect(HP().isaretli(p, BUGUN)).toEqual(['b']);
      HP().isaretle(p, 'b', BUGUN, -1);
      expect(HP().isaretli(p, BUGUN)).toEqual([]);
      const g = HP().maddeGecmisi(p, p.maddeler[0], BUGUN);
      expect(g.length).toBe(7);
      expect(g[6].durum).toBe('yok');
    }));
    it('madde zamanı: saat dilimin önüne geçer; bugünün maddeleri zamana göre sıralanır; bozuk hedef yazılmaz', () => withToday(BUGUN, () => {
      const p = HP().yeni('serbest', 'Rutin');
      p.maddeler = [Object.assign(HP().yeniMadde('Kitap'), { id:'k', zaman:{ dilim:'aksam' } }),
        Object.assign(HP().yeniMadde('Vitamin'), { id:'v', zaman:{ dilim:'sabah', saat:'09:15' } }),
        Object.assign(HP().yeniMadde('Esneme'), { id:'e', zaman:{ dilim:'sabah' } })];
      expect(HP().bugunMaddeleri(p, BUGUN).map(m => m.id)).toEqual(['e', 'v', 'k']);
      expect(HP().zamanYaz(p.maddeler[1].zaman)).toBe('09:15');
      expect(HP().zamanYaz(p.maddeler[0].zaman)).toBe('Akşam');
      expect(HP().dogrula(p)).toEqual([]);
      p.maddeler[0].hedef = 0;
      expect(HP().dogrula(p).length > 0).toBe(true);
    }));
    it('hareket gününün zamanı bugünün satırında yazar', () => withToday(BUGUN, () => {
      const p = HP().yeni('hareket');
      p.gunler[3] = { ne:'Yürüyüş', dk:30, zaman:{ dilim:'aksam', saat:null } };
      expect(HP().bugun(p, BUGUN).metin).toBe('Yürüyüş · 30 dk · Akşam');
    }));
  });

  describe('Uyku planı — üç kip ve planlı kısa uyku', () => {
    it('her gün aynı ve gün gün kipleri; planlı kısa uyku bugünün satırında ve uyumda', () => withToday(BUGUN, () => {
      resetState();
      const p = HP().yeni('uyku');
      p.kip = 'her'; p.her = { yat:'23:00', kalk:'07:00' };
      p.kestirmeler = [{ id:'k1', ad:'Öğle uykusu', bas:'13:30', dk:30, gunler:[] }];
      expect(HP().dogrula(p)).toEqual([]);
      expect(HP().bugun(p, BUGUN).metin).toBe('23:00 yat · 07:00 kalk (8 sa) · Öğle uykusu 13:30 · 30 dk');
      pushVitals('2026-10-14', { sleep:8, kestirmeler:[{ id:'x', dk:30, bas:null }] });
      const u = HP().uyum(p, BUGUN);
      expect([u.kayitli, u.tuttu, u.kPlanli, u.kTuttu]).toEqual([1, 1, 7, 1]);
      p.kip = 'gun';
      expect(HP().dogrula(p).length > 0).toBe(true);
      p.gunluk = HP().GUN_KISA.map(() => ({ yat:'00:00', kalk:'08:00' }));
      expect(HP().dogrula(p)).toEqual([]);
    }));
    it('beslenme planı kullanıcının öğün adlarını okur (ad değişince)', async () => withTodayAsync(BUGUN, async () => {
      resetState();
      const l = SP.Ogun.liste().map(x => Object.assign({}, x));
      l[0].label = 'Gün başlangıcı';
      await SP.Ogun.kaydet(l);
      const p = HP().yeni('beslenme');
      p.gunler[3] = { kahvalti:'Yulaf' };
      expect(HP().bugun(p, BUGUN).metin).toBe('Gün başlangıcı: Yulaf');
    }));
  });

  describe('Patron — doğal sohbet, teklif yalnız istenince', () => {
    const O = () => SP.Office;
    it('mesaj sınıflanır: selam, hâl, öneri isteği, kavram, veri', () => {
      expect(O().sohbetTuru('merhaba')).toBe('selam');
      expect(O().sohbetTuru('teşekkürler')).toBe('selam');
      expect(O().sohbetTuru('bugün çok yorgunum')).toBe('hal');
      expect(O().sohbetTuru('peki ne yapayım?')).toBe('oneri');
      expect(O().sohbetTuru('kalori nedir?')).toBe('konu');
      expect(O().sohbetTuru('uykum nasıl?')).toBe('veri');
      expect(O().sohbetTuru('merhaba, uykum nasıl?')).toBe('veri');
    });
    it('selam ve hâl cevabı rapor dökmez, sayı ve «sıradaki hamle» yazmaz; öneri yalnız istenince', async () => {
      resetState();
      const s = await O().ask('patron', 'merhaba', { sohbet:true });
      expect(s.source).toBe('rules');
      expect(/\d/.test(s.text)).toBe(false);
      expect(s.text.indexOf('Sıradaki hamle') < 0).toBe(true);
      const h = await O().ask('patron', 'moralim bozuk', { sohbet:true });
      expect(h.text.indexOf('Önerim') < 0).toBe(true);
      const o = await O().ask('patron', 'ne yapayım?', { sohbet:true });
      expect(o.text).toContain('Önerim şu');
    });
    it('alan sorusu yalnız o alanı cevaplar; kalori ihtiyacı girilen hareketle söylenir', async () => {
      resetState();
      const d = SP.U.todayISO();
      SP.S.workouts = [{ id:'w1', date:d, minutes:30, items:[{ exId:'yuruyus', minutes:30 }] }];
      const r = await O().ask('patron', 'kalori ihtiyacım ne kadar?', { sohbet:true });
      expect(r.text).toContain(SP.U.fmtNum(SP.Nutri.tdee()) + ' kcal');
      expect(r.text).toContain('girdiğin hareket');
    });
    it('toplantı gibi görev çağrısı eski yoldan gider (sınıflanmaz)', async () => {
      resetState();
      const r = await O().ask('patron', 'merhaba');
      expect(r.tur == null).toBe(true);
    });
  });

  describe('Ofis › İnceleme — kayıttan fikir, eşik, tek karar', () => {
    const I = () => SP.Inceleme;
    it('eşiğin altında fikir açılmaz ve kaç gün gerektiği söylenir', () => {
      const r = I().karsilastir({ id:'x', baslik:'Deneme', a:{ ad:'A', l:[1, 2] }, b:{ ad:'B', l:[1, 2, 3, 4] }, birim:'saat' });
      expect(r.acik).toBe(false);
      expect(r.eksik).toBe(I().ESIK - 2);
      expect(r.neden).toContain('en az ' + I().ESIK + ' gün');
    });
    it('açık fikir iki grubun ortalamasını ve gün sayısını yazar; ondalık virgüldür', () => {
      const r = I().karsilastir({ id:'x', baslik:'Deneme', a:{ ad:'A', l:[7, 7, 8, 8] }, b:{ ad:'B', l:[6, 6, 6, 6.5] }, birim:'saat' });
      expect(r.acik).toBe(true);
      expect(r.etiket).toBe('hesaplandı');
      expect(r.metin).toBe('A 7,5 saat (4 gün), B 6,1 saat (4 gün); fark +1,4 saat.');
      expect(r.not).toContain('neden değil');
      expect(I().sayi(94.6, 'puan')).toBe('95');
    });
    it('kayıt yokken rapor sayı uydurmaz; karar kural motorundandır', () => {
      resetState();
      const r = I().rapor();
      expect(r.hafta.find(s => s.ad === 'Gece uykusu ortalaması').etiket).toBe('veri yok');
      expect(r.fikirler.every(f => !f.acik)).toBe(true);
      expect(r.karar.id).toBe(SP.Calc.nextAction().id);
    });
    it('ekran çizilir; eski tur düğmesi yoktur', async () => {
      resetState();
      const d = document.createElement('div');
      d.innerHTML = await SP.Screens.meeting.render();
      expect(d.textContent).toContain('Verinden çıkan fikirler');
      expect(d.textContent).toContain('Tek karar');
      expect(!!d.querySelector('[data-act="run-meeting"]')).toBe(false);
    });
  });

  describe('Bugün başlığı', () => {
    it('hareket girilmiş ama uyku girilmemiş gün «veri girilmedi» demez', async () => withTodayAsync(BUGUN, async () => {
      resetState();
      expect(SP.Screens.today.headline()).toBe('Bugünün verisi henüz girilmedi.');
      pushWorkout(BUGUN, { minutes:30, items:['yuruyus'] });
      expect(SP.Screens.today.headline()).toBe('Uyku girilince toparlanma hesaplanır.');
    }));
  });
})();
