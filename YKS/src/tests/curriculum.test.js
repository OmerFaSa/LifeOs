/* Mufredat butunlugu, serbest baslangic tarihi ve koc arac katmani. */

(function(){
  const { describe, it, expect, resetState, withToday } = R.Test;
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  describe('Müfredat bütünlüğü', function(){
    it('sekiz ders tanımlı', function(){
      expect(R.SUBJECTS).toHaveLength(8);
    });
    it('TYT Sosyal Bilimler dersi var', function(){
      const s = R.SUBJECTS.find(x => x.id === 'tyt-sosyal');
      expect(!!s).toBeTruthy();
      expect(s.questions).toBe(20);
      expect(s.priority).toBe('support');
    });
    it('TYT testleri 120 soruyu tamamlar', function(){
      const tyt = R.SUBJECTS.filter(s => s.exam === 'TYT').reduce((a,s) => a+s.questions, 0);
      expect(tyt).toBe(120);
    });
    it('AYT SAY testleri 80 soruyu tamamlar', function(){
      const ayt = R.SUBJECTS.filter(s => s.exam === 'AYT').reduce((a,s) => a+s.questions, 0);
      expect(ayt).toBe(80);
    });
    it('her derste en az 13 konu var', function(){
      R.SUBJECTS.forEach(s => {
        if(s.topics.length < 13) throw new Error(s.name+' yalnız '+s.topics.length+' konu');
      });
    });
    it('toplam konu sayısı 150’den fazla', function(){
      const total = R.SUBJECTS.reduce((a,s) => a+s.topics.length, 0);
      expect(total).toBeGreaterThan(150);
    });
    it('her konunun benzersiz id’si var', function(){
      const ids = [];
      R.SUBJECTS.forEach(s => s.topics.forEach(t => ids.push(t.id)));
      const uniq = ids.filter((v,i) => ids.indexOf(v) === i);
      expect(uniq.length).toBe(ids.length);
    });
    it('her konunun sıklık etiketi geçerli', function(){
      R.SUBJECTS.forEach(s => s.topics.forEach(t => {
        if(!R.TOPIC_FREQ[t.freq]) throw new Error(s.name+' / '+t.name+' → geçersiz freq: '+t.freq);
      }));
    });
    it('her konunun sırası ve süresi var', function(){
      R.SUBJECTS.forEach(s => s.topics.forEach(t => {
        if(!t.order || !t.days || !t.name) throw new Error(s.name+' / '+(t.name||t.id)+' eksik alan');
      }));
    });
    it('konu sıraları ders içinde artan', function(){
      R.SUBJECTS.forEach(s => {
        s.topics.forEach((t,i) => {
          if(t.order !== i+1) throw new Error(s.name+' sıra bozuk: '+t.name+' → '+t.order);
        });
      });
    });
    it('kapanış hesabı yeni konu sayısıyla çalışır', function(){
      resetState();
      const c = C.subjectClosure('tyt-sosyal');
      expect(c.total).toBe(30);
      expect(c.pct).toBe(0);
    });
  });

  describe('Serbest başlangıç tarihi', function(){
    it('profil boşken plandaki tarihi kullanır', function(){
      resetState();
      S.profile.startDate = null;
      expect(R.PLAN.startISO).toBe(R.PROGRAM.startISO);
    });
    it('profildeki tarihi kullanır', function(){
      resetState();
      S.profile.startDate = '2027-01-04';
      expect(R.PLAN.startISO).toBe('2027-01-04');
      expect(M.weekStart(1)).toBeTruthy();
      expect(U.iso(M.weekStart(1))).toBe('2027-01-04');
    });
    it('takvim kısaldıkça hafta sayısı düşer', function(){
      resetState();
      S.profile.startDate = '2027-01-04';
      S.profile.examTytISO = '2027-06-19';
      expect(R.PLAN.totalWeeks).toBe(24);
      expect(R.PLAN.compressed).toBeTruthy();
    });
    it('tam takvimde 40 hafta olur', function(){
      resetState();
      S.profile.startDate = '2026-09-14';
      S.profile.examTytISO = '2027-06-19';
      expect(R.PLAN.totalWeeks).toBe(40);
      expect(R.PLAN.compressed).toBeFalsy();
    });
    it('sıkıştırılmış planda ilk hafta kalibrasyon kalır', function(){
      resetState();
      S.profile.startDate = '2027-01-04';
      expect(M.curriculumFor(1).n).toBe(1);
    });
    it('sıkıştırılmış planda son hafta sınav haftasıdır', function(){
      resetState();
      S.profile.startDate = '2027-01-04';
      expect(M.curriculumFor(R.PLAN.totalWeeks).n).toBe(40);
    });
    it('sıkıştırılmış planda haftalar ileri doğru artar', function(){
      resetState();
      S.profile.startDate = '2027-01-04';
      let prev = 0;
      for(let n = 1; n <= R.PLAN.totalWeeks; n++){
        const c = M.curriculumFor(n);
        if(c.n < prev) throw new Error('hafta '+n+' geriye gitti: '+c.n);
        prev = c.n;
      }
    });
    it('tam takvimde müfredat birebir eşleşir', function(){
      resetState();
      S.profile.startDate = '2026-09-14';
      for(const n of [1, 13, 27, 40]) expect(M.curriculumFor(n).n).toBe(n);
    });
    it('başlangıç değişince hafta numarası kayar', function(){
      resetState();
      withToday('2027-01-10', function(){
        S.profile.startDate = '2027-01-04';
        expect(M.currentWeek()).toBe(1);
        S.profile.startDate = '2026-09-14';
        expect(M.currentWeek()).toBeGreaterThan(15);
      });
    });
    it('kurulum önizlemesi hafta sayısını PLAN ile aynı hesaplar', function(){
      resetState();
      S.profile.startDate = '2027-01-04';
      S.profile.examTytISO = '2027-06-19';
      expect(R.Setup.preview('2027-01-04','2027-06-19').weeks).toBe(R.PLAN.totalWeeks);
    });
    it('bir sonraki pazartesiyi doğru bulur', function(){
      expect(R.Setup.nextMonday('2026-09-14')).toBe('2026-09-14');   // zaten pazartesi
      expect(R.Setup.nextMonday('2026-09-15')).toBe('2026-09-21');   // salı → sonraki
      expect(R.Setup.nextMonday('2026-09-20')).toBe('2026-09-21');   // pazar → ertesi gün
    });
    it('çok kısa takvimi uyarır', function(){
      expect(R.Setup.preview('2027-06-01','2027-06-19').tooShort).toBeTruthy();
    });
  });

  describe('Koç araç katmanı', function(){
    it('araçların hepsi adlı, açıklamalı ve çalıştırılabilir', function(){
      expect(R.CoachTools.TOOLS.length).toBeGreaterThan(7);
      R.CoachTools.TOOLS.forEach(t => {
        if(!t.name || !t.description || typeof t.execute !== 'function') throw new Error(t.name+' eksik');
      });
    });
    it('durum özeti temel alanları döndürür', function(){
      resetState();
      withToday('2026-09-21', function(){
        const d = R.CoachTools.durum();
        expect(d.bugun).toBe('2026-09-21');
        expect(typeof d.programHaftasi).toBe('number');
        expect(typeof d.konuKapanisYuzdesi).toBe('number');
      });
    });
    it('araçlar kişisel bilgi sızdırmaz', function(){
      resetState();
      const json = JSON.stringify([R.CoachTools.durum(), R.CoachTools.gunler({gun:3}), R.CoachTools.haftalar({})]);
      expect(json.indexOf('Ömer')).toBe(-1);
      expect(json.indexOf('Adana')).toBe(-1);
    });
    it('deneme aracı kayıtları özetler', function(){
      resetState();
      S.exams = [R.Test.makeExam({ date:'2026-09-19', correct:30, wrong:4 })];
      const list = R.CoachTools.denemeler({});
      expect(list).toHaveLength(1);
      expect(list[0].toplamNet).toBe(29);
    });
    it('hata aracı dağılım ve kayıtları verir', function(){
      resetState();
      S.errors = [{ id:'r1', tag:'K', rootCause:'birim atladım', createdAt:'2026-09-19T10:00:00Z' }];
      const h = R.CoachTools.hatalar({});
      expect(h.dagilim[0].etiket).toBe('K');
      expect(h.kayitlar[0].kokNeden).toBe('birim atladım');
    });
    it('konu aracı belirli dersi filtreler', function(){
      resetState();
      const k = R.CoachTools.konular({ ders:'tyt-sosyal', tumKonular:true });
      expect(k).toHaveLength(1);
      expect(k[0].toplamKonu).toBe(30);
    });
    it('araç hatası çökmeden döner', function(){
      const tools = R.CoachTools.forSample();
      const bad = tools.find(t => t.name === 'konular');
      const out = bad.execute({ ders:'yok-boyle-ders' });
      expect(Array.isArray(out)).toBeTruthy();
    });
    it('sample formatında inputSchema taşır', function(){
      R.CoachTools.forSample().forEach(t => {
        if(!t.inputSchema || t.inputSchema.type !== 'object') throw new Error(t.name+' şema eksik');
      });
    });
  });
})();
