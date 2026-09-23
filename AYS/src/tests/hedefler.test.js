/* AYS hedef paketleri — konu bitirme ve net hedefi (core/hedefler.js).

   Kanıtlanan sözler:
     1. Ders adı takma adından tanınır; sınavla çelişen ders tahmin edilmez, sorulur.
     2. Konu bitirmede karar KAPASİTEYLE verilir; süre müfredatın kendi
        tahmininden gelir ve karar «tahmin»dir. Kapanan konu düşer.
     3. Net hedefinde hız KENDİ denemelerinden gelir (medyan eğim) ve karar
        «hesaplandı»dır; deneme yoksa karar verilmez ve bu söylenir.
     4. Olamayacak hedef (TYT'de 120'den fazla net) karara gitmeden söylenir.
     5. «Sınava kadar» profildeki sınav tarihidir. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, withToday, makeExam } = R.Test;
  const BUGUN = '2026-09-23';
  const Hd = () => R.Hedefler;
  const H = () => window.LIFEOS.Hedef;

  function tani(cumle){
    return withToday(BUGUN, () => H().cumleden(cumle, Hd().PAKETLER, BUGUN));
  }
  function hedef(cumle){
    return H().yeni(tani(cumle), 'ays', BUGUN);
  }
  async function kapat(subjectId, topicId){
    await R.Model.setTopicState(subjectId, topicId, { first:80, firstAt:'2026-09-01', second:75, secondAt:'2026-09-08' });
  }
  function tamTyt(date, net){
    return makeExam({ date, family:'TYT', kind:'full',
      tests:[{ name:'Türkçe', correct:net, wrong:0, blank:0, minutes:null }] });
  }

  describe('AYS hedef — tanıma', () => {
    it('ders takma adından ve süreden konu bitirme hedefi kurulur', () => {
      resetState();
      const t = tani('TYT matematiği 100 günde bitirmek istiyorum');
      expect([t.paket, t.dersler.join(','), t.hedefDeger, t.son_tarih, t.kapsam])
        .toEqual(['konu', 'tyt-matematik', 35, '2027-01-01', 'TYT Temel Matematik']);
    });

    it('sınav adı tek başına o sınavın bütün derslerini kapsar', () => {
      resetState();
      const t = tani('TYT konularını bitirmek istiyorum');
      expect([t.dersler.length, t.kapsam]).toEqual([4, 'TYT konuları']);
      expect(tani('AYT fiziği bitirmek istiyorum').dersler).toEqual(['ayt-fizik']);
    });

    it('sınavla çelişen ders tahmin edilmez: sorulur', async () => {
      resetState();
      const s = Hd().sohbet;
      const r = await withTodayAsync(BUGUN, () => s.isle('TYT fiziği bitirmek istiyorum'));
      expect(r.text).toContain('Hangi dersi kastettiğini anlayamadım');
      expect(s.bekleyen()).toBe(null);
    });

    it('«sınav tarihine kadar» bir ders sayılmaz; tarih profildeki sınav günüdür', () => {
      resetState();
      const t = tani('Sınav tarihine kadar AYT kimyayı bitirmek istiyorum');
      expect(t.dersler).toEqual(['ayt-kimya']);
      const u = tani('TYT Türkçeyi sınava kadar bitirmek istiyorum');
      expect(u.son_tarih).toBe(R.PROGRAM.examTytISO);
    });

    it('net hedefi: sınav, branş ve hedef değer tanınır', () => {
      resetState();
      const a = tani('TYT\'de 90 nete çıkmak istiyorum');
      expect([a.paket, a.aile, a.brans, a.hedefDeger]).toEqual(['net', 'TYT', null, 90]);
      const b = tani('AYT matematik netimi 25\'e çıkarmak istiyorum');
      expect([b.paket, b.aile, b.brans, b.test, b.hedefDeger]).toEqual(['net', 'AYT', 'ayt-matematik', 'Matematik', 25]);
      const c = tani('TYT netimi 5 net artırmak istiyorum');
      expect([c.fark, c.hedefDeger]).toEqual([5, null]);
    });

    it('niyet yoksa hedef değildir: plan komutlarına karışılmaz', async () => {
      resetState();
      expect(tani('haftalık soru hedefi 600 olsun')).toBe(null);
      expect(tani('dün TYT matematikten 40 soru çözdüm')).toBe(null);
      expect(await withTodayAsync(BUGUN, () => Hd().sohbet.isle('bu hafta çalışmayacağım'))).toBe(null);
    });
  });

  describe('AYS hedef — konu bitirme kapasitesi', () => {
    it('kalan konuların süresi müfredattan hesaplanır ve karar «tahmin»dir', () => {
      resetState();
      const h = hedef('TYT matematiği 100 günde bitirmek istiyorum, günde 2 saat ayırabilirim');
      const g = withToday(BUGUN, () => H().gerceklik(h, Hd().KONU, {}, BUGUN));
      expect([g.mod, g.saat, g.tipik, g.bant, g.etiket]).toEqual(['kapasite', 371, 14, 'gercekci_degil', 'tahmin']);
      expect(g.dayanak.metin).toContain('planlama varsayımı');
      expect(g.dayanak.metin).toContain('2 × 30 dk tekrar');
      expect(g.ek.metin).toBe('iki haftada bir Branş — TYT Matematik');
      expect(g.ek.saat).toBeCloseTo(100 / 60 / 2, 2);
      const t = H().kararMetni(g);
      expect(t).toContain('Bu sürede olmaz');
      expect(t).toContain('tahmindir');
    });

    it('vakit yeterse gerçekçi; 1,5 katına kadar zorlayıcı', () => {
      resetState();
      const a = hedef('TYT matematiği 100 günde bitirmek istiyorum, günde 4 saat');
      expect(H().gerceklik(a, Hd().KONU, {}, BUGUN).bant).toBe('gercekci');
      const b = hedef('TYT matematiği 100 günde bitirmek istiyorum, günde 3 saat');
      expect(H().gerceklik(b, Hd().KONU, {}, BUGUN).bant).toBe('zorlayici');
    });

    it('kapanan konu düşer, başlanmış konu yarım sayılır', async () => {
      resetState();
      await kapat('tyt-matematik', 'tm-01');
      const ilk = R.SUBJECTS.find(s => s.id === 'tyt-matematik').topics;
      const k1 = ilk.find(t => t.id === 'tm-01'), k2 = ilk.find(t => t.id === 'tm-02');
      await R.Model.setTopicState('tyt-matematik', 'tm-02', { first:50, firstAt:'2026-09-10' });
      const h = hedef('TYT matematiği 100 günde bitirmek istiyorum, günde 4 saat');
      const g = H().gerceklik(h, Hd().KONU, {}, BUGUN);
      const beklenen = (96 - R.Planner.topicDays(k1.days) - R.Planner.topicDays(k2.days) / 2) * 3.5 + 34;
      expect(g.saat).toBeCloseTo(beklenen, 1);
      expect(Hd().KONU.simdi({}, h).deger).toBe(1);
      expect(Hd().siraliKalan(['tyt-matematik'])[0].topicId).toBe('tm-02');
    });

    it('seviye süreyi ölçekler', () => {
      resetState();
      R.S.profile.level = 'baslangic';
      const h = hedef('AYT kimyayı 6 ayda bitirmek istiyorum, günde 1 saat');
      expect(Hd().KONU.gerekenSaat(h).saat).toBeCloseTo(49 * 3.5 * 1.35 + 13, 1);
    });

    it('sayı söylenirse sıradaki o kadar konu hesaplanır', () => {
      resetState();
      const h = hedef('TYT matematikten 3 konu bitirmek istiyorum');
      expect([h.fark, h.hedefDeger]).toEqual([3, null]);
      const l = Hd().siraliKalan(['tyt-matematik']).slice(0, 3);
      expect(Hd().KONU.gerekenSaat(h).saat).toBeCloseTo(l.reduce((a, k) => a + k.gun * 3.5, 0) + 3, 1);
    });

    it('bütün konular kapanmışsa hedef kurulmaz', async () => {
      resetState();
      for(const t of R.SUBJECTS.find(s => s.id === 'ayt-kimya').topics) await kapat('ayt-kimya', t.id);
      const r = await withTodayAsync(BUGUN, () => Hd().sohbet.isle('AYT kimyayı bitirmek istiyorum'));
      expect(r.text).toContain('bütün konular kapanış kuralıyla zaten kapanmış');
    });
  });

  describe('AYS hedef — net hedefi', () => {
    async function denemeler(){
      const l = [['2026-08-12', 60], ['2026-08-19', 62], ['2026-08-26', 61], ['2026-09-02', 64],
        ['2026-09-09', 66], ['2026-09-16', 67]];
      for(const x of l) await R.Model.saveExam(tamTyt(x[0], x[1]));
    }

    it('şu anki net son üç denemenin medyanıdır ve «hesaplandı»dır', async () => {
      resetState();
      await denemeler();
      const h = hedef('TYT\'de 90 nete çıkmak istiyorum');
      const s = Hd().NET.simdi({}, h);
      expect([s.deger, s.etiket, s.tarih]).toEqual([66, 'hesaplandi', '2026-09-16']);
    });

    it('hız kendi denemelerinin medyan eğimidir; karar «hesaplandı»', async () => {
      resetState();
      await denemeler();
      const t = Hd().netHizi({ aile:'TYT', brans:null });
      expect([t.deneme, t.hafta]).toEqual([6, 5]);
      expect(t.hiz).toBeCloseTo(1.4, 2);
      const h = hedef('TYT\'de 75 nete sınava kadar çıkmak istiyorum');
      const g = withToday(BUGUN, () => H().gerceklik(h, Hd().NET, {}, BUGUN));
      expect([g.bant, g.etiket, g.birim]).toEqual(['gercekci', 'hesaplandi', 'net/hafta']);
      expect(H().kararMetni(g)).toContain('medyan eğim');
    });

    it('hız yetmiyorsa bu tarihe kadar ulaşılabilecek net söylenir', async () => {
      resetState();
      await denemeler();
      const h = hedef('TYT\'de 1 ayda 90 nete çıkmak istiyorum');
      const g = H().gerceklik(h, Hd().NET, {}, BUGUN);
      expect(g.bant).toBe('gercekci_degil');
      expect(g.karsi.ulasilabilir).toBeGreaterThan(0);
      expect(H().kararMetni(g)).toContain('net mümkün');
    });

    it('deneme yoksa karar verilmez ve nedeni söylenir', async () => {
      resetState();
      const s = Hd().sohbet;
      const a = await withTodayAsync(BUGUN, () => s.isle('TYT\'de 3 ayda 80 nete çıkmak istiyorum'));
      expect(a.text).toContain('Son denemelerinde TYT netin');
      const b = await withTodayAsync(BUGUN, () => s.isle('65 civarı'));
      expect(b.text).toContain('Hiç tam TYT denemen yok');
      expect(b.text).toContain('Denemelerini girince');
      expect(b.text).toContain('yine de kaydedeyim mi');
    });

    it('olamayacak net karara gitmeden söylenir', async () => {
      resetState();
      const r = await withTodayAsync(BUGUN, () => Hd().sohbet.isle('TYT\'de 130 nete çıkmak istiyorum'));
      expect(r.text).toContain('TYT en fazla 120 nettir');
      const b = await withTodayAsync(BUGUN, () => Hd().sohbet.isle('AYT fizik netimi 20\'ye çıkarmak istiyorum'));
      expect(b.text).toContain('AYT Fizik en fazla 14 nettir');
    });

    it('branş neti o testin netinden okunur (tam ve branş denemeleri)', async () => {
      resetState();
      await R.Model.saveExam(makeExam({ date:'2026-09-01', family:'AYT', kind:'full',
        tests:[{ name:'Matematik', correct:20, wrong:4, blank:0 }, { name:'Fizik', correct:5, wrong:0, blank:0 }] }));
      await R.Model.saveExam(makeExam({ date:'2026-09-10', family:'AYT', kind:'branch',
        tests:[{ name:'Matematik', correct:22, wrong:0, blank:0 }] }));
      const h = hedef('AYT matematik netimi 30\'a çıkarmak istiyorum');
      expect(Hd().seri(h).map(x => x.net)).toEqual([19, 22]);
      expect(Hd().NET.simdi({}, h).deger).toBe(20.5);
    });
  });

  describe('AYS hedef — sohbet', () => {
    it('eksikler sırayla sorulur, «sınava kadar» okunur, onayla hedef aktif olur', async () => {
      resetState();
      const s = Hd().sohbet;
      const a = await withTodayAsync(BUGUN, () => s.isle('AYT fiziği bitirmek istiyorum'));
      expect(a.text).toContain('«sınava kadar»');
      const b = await withTodayAsync(BUGUN, () => s.isle('sınava kadar'));
      expect(b.text).toContain('günde ne kadar vakit');
      const c = await withTodayAsync(BUGUN, () => s.isle('günde 1 saat'));
      expect(c.text).toContain('gerçekçi');
      expect(c.text).toContain('18 konu kaldı');
      const d = await withTodayAsync(BUGUN, () => s.isle('evet'));
      expect(d.text).toContain('Hedefin kaydedildi ve aktif');
      const h = Hd().liste()[0];
      expect([h.durum, h.paket, h.son_tarih, h.gerceklik.mod]).toEqual(['aktif', 'konu', R.PROGRAM.examAytISO, 'kapasite']);
      expect(R.Store._data['hedefler/' + h.id].durum).toBe('aktif');
      expect(Hd().ozet(h)).toBe('AYT Fizik: 18 konunun hepsini bitir');
    });
  });

  /* ================================================================ PLAN */

  async function aktifHedef(cumle, patch){
    const h = Object.assign(hedef(cumle), { durum:'aktif' }, patch || {});
    await Hd().kaydet(h);
    return h;
  }
  function temizOneri(){ R.S.officeProposals = []; R.S.officeProposalKeys = []; }

  describe('AYS hedef planı — konu bitirme', () => {
    it('konular önkoşul sırasıyla haftalara dökülür, hafta bütçesi aşılmaz', async () => {
      resetState();
      const h = await aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
      const r = withToday(BUGUN, () => R.HedefPlan.kur(h, BUGUN));
      expect(r.ok).toBe(true);
      const p = r.plan;
      expect([p.paket, p.haftalikDk, p.konuSayisi, p.etiket]).toEqual(['konu', 420, 18, 'tahmin']);
      p.haftalar.forEach(w => expect(w.dk <= p.haftalikDk).toBe(true));
      const sira = [];
      p.haftalar.forEach(w => w.konular.forEach(k => { if(k.bitti) sira.push(k.topicId); }));
      const beklenen = R.SUBJECTS.find(x => x.id === 'ayt-fizik').topics.slice()
        .sort((a, b) => a.order - b.order).map(t => t.id);
      expect(sira).toEqual(beklenen);
      const toplam = p.haftalar.reduce((a, w) => a + w.konular.reduce((b, k) => b + k.dk, 0), 0);
      expect(toplam).toBe(Hd().kalanKonular(['ayt-fizik']).reduce((a, k) => a + Math.round(Hd().konuSaati(k) * 60), 0));
      expect(p.konuBitis <= h.son_tarih).toBe(true);
    });

    it('iki haftada bir branş denemesi ve biten konuya 1 ve 3 hafta sonra tekrar', async () => {
      resetState();
      const h = await aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
      const p = R.HedefPlan.kur(h, BUGUN).plan;
      expect(p.deneme).toEqual({ ad:'Branş — AYT Fizik', dk:60, aralik:2 });
      expect([p.haftalar[0].deneme, p.haftalar[1].deneme.ad]).toEqual([null, 'Branş — AYT Fizik']);
      const ilkBiten = p.haftalar.findIndex(w => w.konular.some(k => k.bitti));
      const ad = p.haftalar[ilkBiten].konular.find(k => k.bitti).name;
      expect(p.haftalar[ilkBiten + 1].tekrar).toContain(ad);
      expect(p.haftalar[ilkBiten + 3].tekrar).toContain(ad);
    });

    it('vakit yetmiyorsa plan yine kurulur ama bitiş tarihi açıkça söylenir', async () => {
      resetState();
      const h = await aktifHedef('TYT matematiği 100 günde bitirmek istiyorum, günde 1 saat');
      const p = R.HedefPlan.kur(h, BUGUN).plan;
      expect(p.konuBitis > h.son_tarih).toBe(true);
      expect(p.uyarilar[0]).toContain('haftasında biter; son tarihin');
    });

    it('çok dersli kapsamda deneme tam denemedir; plan iki yılı aşarsa kurulmaz', async () => {
      resetState();
      const a = await aktifHedef('TYT konularını sınava kadar bitirmek istiyorum, günde 4 saat');
      expect(R.HedefPlan.kur(a, BUGUN).plan.deneme.ad).toBe('Tam TYT');
      const b = await aktifHedef('Bütün konuları sınava kadar bitirmek istiyorum, günde 30 dakika');
      expect(R.HedefPlan.kur(b, BUGUN).why).toContain('iki yılı aşıyor');
    });

    it('etkin olmayan hedefe plan kurulmaz', () => {
      resetState();
      const h = hedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
      expect(R.HedefPlan.kur(h, BUGUN).why).toBe('Plan yalnız etkin hedef için kurulur.');
    });
  });

  describe('AYS hedef planı — net hedefi', () => {
    it('ara hedefler doğrusal, son kontrol hedefin kendisi; odak kapanmamış yüksek sıklıklı konular', async () => {
      resetState();
      for(const x of [['2026-08-12', 60], ['2026-08-26', 62], ['2026-09-09', 64], ['2026-09-16', 66]]){
        await R.Model.saveExam(tamTyt(x[0], x[1]));
      }
      await kapat('tyt-turkce', 'tr-01');
      const h = await aktifHedef('TYT\'de 75 nete sınava kadar çıkmak istiyorum');
      const p = withToday(BUGUN, () => R.HedefPlan.kur(h, BUGUN)).plan;
      expect([p.paket, p.baslangic, p.hedef, p.deneme.ad]).toEqual(['net', 64, 75, 'Tam TYT']);
      const son = p.kontroller[p.kontroller.length - 1];
      expect([son.tarih, son.beklenen]).toEqual([h.son_tarih, 75]);
      expect(p.kontroller[0].hafta).toBe(4);
      expect(p.kontroller[0].beklenen).toBeCloseTo(64 + 11 * 4 / p.hafta, 1);
      expect(p.odak.length).toBe(5);
      expect(p.odak.some(k => k.topicId === 'tr-01')).toBe(false);
      p.odak.forEach(k => expect(R.SUBJECTS.find(x => x.id === k.subjectId).topics
        .find(t => t.id === k.topicId).freq).toBe('high'));
    });

    it('şu anki net bilinmeden plan kurulmaz', async () => {
      resetState();
      const h = await aktifHedef('TYT\'de 75 nete sınava kadar çıkmak istiyorum');
      expect(R.HedefPlan.kur(h, BUGUN).why).toContain('önce bir deneme gir');
    });
  });

  describe('AYS hedef planı — büyük aksiyon', () => {
    it('uygula öneri kapısından geçer; ikinci kez uygulanmaz; geri alınır', async () => {
      resetState(); temizOneri();
      await withTodayAsync(BUGUN, async () => {
        const h = await aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
        const r = await R.HedefPlan.uygulaHedef(h.id);
        expect(r.ok).toBe(true);
        const row = R.S.officeProposals.find(x => x.action === 'hedef-plan');
        expect([row.level, row.status, row.source]).toEqual(['buyuk', 'applied', 'istek']);
        expect(R.HedefPlan.aktif(h.id).durum).toBe('aktif');
        expect((await R.HedefPlan.uygulaHedef(h.id)).why).toContain('uygulanmış bir planı var');
        const g = await R.HedefPlan.geriAlHedef(h.id);
        expect(g.ok).toBe(true);
        expect(R.HedefPlan.aktif(h.id)).toBe(null);
        expect(R.S.officeProposals.find(x => x.id === row.id).status).toBe('undone');
      });
    });

    it('önizleme ne değişeceğini satır satır söyler', async () => {
      resetState(); temizOneri();
      const h = await aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
      const pv = withToday(BUGUN, () => R.Proposals.preview({ action:'hedef-plan', agent:'patron', params:{ hedefId:h.id } }));
      expect(pv.ok).toBe(true);
      const l = pv.rows.map(x => x.label);
      expect(l).toContain('Hedef programı');
      expect(l).toContain('Deneme günü');
      expect(l).toContain('Hafta sözleşmesi taslağı');
    });

    it('model bu eylemi öneremez ve istem kataloğunda görmez', async () => {
      resetState();
      const h = await aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
      expect(R.Proposals.fromModel('patron', { eylem:'hedef-plan', parametreler:{ hedefId:h.id } })).toBe(null);
      expect(R.Proposals.catalogPrompt('patron').indexOf('hedef-plan')).toBe(-1);
    });

    it('hafta taslağı önce hedefin konularını alır; geri alınca eski sıraya döner', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState(); temizOneri();
        R.S.profile.setupDone = true;
        await R.Model.ensurePlan(true);
        const n = R.Model.currentWeek();
        await R.Model.ensureWeek(n);
        const once = R.Auto.draftWeek(n).topics.map(t => t.name);
        const h = await aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat');
        await R.HedefPlan.uygulaHedef(h.id);
        const d = R.Auto.draftWeek(n);
        expect([d.topics[0].subjectId, d.topics[0].why]).toEqual(['ayt-fizik', 'hedef programı']);
        await R.HedefPlan.geriAlHedef(h.id);
        expect(R.Auto.draftWeek(n).topics.map(t => t.name)).toEqual(once);
      });
    });

    it('ilerleme kapanış kuralıyla ölçülür; hedef kapanınca plan da kapanır', async () => {
      resetState(); temizOneri();
      const h = await withTodayAsync(BUGUN, () => aktifHedef('AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat'));
      await withTodayAsync(BUGUN, () => R.HedefPlan.uygulaHedef(h.id));
      const p = R.HedefPlan.aktif(h.id);
      const sonra = R.U.iso(R.U.addDays(R.U.parse(BUGUN), 42));
      const a = R.HedefPlan.ilerleme(p, sonra);
      expect([a.durum, a.kapanan]).toEqual(['geride', 0]);
      expect(a.beklenen).toBeGreaterThan(0);
      expect(a.metin).toContain('kapanış kuralıyla');
      const r = await withTodayAsync(BUGUN, () => Hd().durumDegistir(h.id, 'tamam'));
      expect(r.not).toBe('Hedefin planı da kapandı.');
      expect(R.HedefPlan.aktif(h.id)).toBe(null);
    });
  });
})();
