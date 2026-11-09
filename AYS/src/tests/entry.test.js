/* Konuşarak veri girişi — cümleden kayda.

   En kritik test: ONAYSIZ HİÇBİR ŞEY YAZILMAZ ve önizlemenin verdiği
   söz tutulur. Önizleme «doğru: 32 yazılacak» diyorsa 32 yazılmalıdır;
   yazılmazsa kullanıcı kaydettiğini sanır ve veri sessizce kaybolur. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync } = R.Test;

  describe('Giriş — bileşik cümle', () => {
    it('bağlaçtan yan cümlelere bölünür', () => {
      expect(R.Entry.yanCumleler('40 soru çözdüm ve 20 paragraf yaptım'))
        .toEqual(['40 soru çözdüm', '20 paragraf yaptım']);
    });

    it('sayının içindeki virgül ayraç değildir', () => {
      expect(R.Entry.yanCumleler('7,5 saat uyudum')).toHaveLength(1);
      /* 2026-10-19: doğru/yanlış/boş ile başlayan parça öncekine bağlanır. */
      expect(R.Entry.yanCumleler("matematikten 40 soru çözdüm, 32'si doğru ve 20 paragraf yaptım"))
        .toEqual(["matematikten 40 soru çözdüm, 32'si doğru", '20 paragraf yaptım']);
      const y = R.Entry.parseOne('türevden 20 soru çözdüm, 4 yanlışım var');
      expect([y.count, y.correct, y.bosVarsayim]).toEqual([20, 16, true]);
      const b = R.Entry.parseOne('20 soru çözdüm 4 yanlış 2 boş');
      expect([b.correct, b.bosVarsayim]).toEqual([14, false]);
      expect(R.Entry.parseOne('10 soru çözdüm 12 yanlış').correct).toBe(null);
    });
  });

  describe('Giriş — kalıplar', () => {
    it('çözülen soru sayısı', () => {
      const p = R.Entry.parseOne('10 soru çözdüm');
      expect(p.kind).toBe('soru');
      expect(p.count).toBe(10);
    });

    it('ders adı çekimli hâliyle bulunur', () => {
      /* İnsanlar «tyt-matematik» demez, «matematikten» der. */
      expect(R.Entry.parseOne('matematikten 40 soru çözdüm').subject.id).toBe('tyt-matematik');
      expect(R.Entry.parseOne('fizikten 25 soru çözdüm').subject.id).toBe('ayt-fizik');
      expect(R.Entry.parseOne('türkçeden 30 soru').subject.id).toBe('tyt-turkce');
    });

    it('özgül ders adı genelden ÖNCE denenir', () => {
      /* «ayt matematik» hem «matematik» hem kendisiyle eşleşebilir. */
      expect(R.Entry.parseOne('ayt matematik 20 soru').subject.id).toBe('ayt-matematik');
    });

    it('doğru sayısı okunur', () => {
      const p = R.Entry.parseOne('40 soru çözdüm 32 doğru');
      expect(p.count).toBe(40);
      expect(p.correct).toBe(32);
    });

    it('doğru sayısı çözülenden fazlaysa ALINMAZ', () => {
      /* Yanlış okunmuştur; uydurulmuş bir sayıyı kaydetmek, hiç
         kaydetmemekten kötüdür. */
      expect(R.Entry.parseOne('10 soru çözdüm 40 doğru').correct).toBeNull();
    });

    it('paragraf ve problem ayrı sayaçlardır', () => {
      expect(R.Entry.parseOne('20 paragraf yaptım').kind).toBe('paragraf');
      expect(R.Entry.parseOne('15 problem çözdüm').kind).toBe('problem');
    });

    it('paragraf genel soru sayısından ÖNCE bakılır', () => {
      /* «20 paragraf çözdüm» hem paragraf sayacı hem soru gibi görünür. */
      expect(R.Entry.parseOne('20 paragraf çözdüm').kind).toBe('paragraf');
    });

    it('kısa kayıt: sayı sayaçtan SONRA da gelir («soru 40»)', () => {
      /* Telegram'dan tek kelime kayıt (HKM kısa kayıt). Birim kelimenin
         kendisidir: «soru 40» kırk soru demektir, tahmin yoktur. */
      expect(R.Entry.parseOne('soru 40').count).toBe(40);
      expect(R.Entry.parseOne('paragraf 20').kind).toBe('paragraf');
      expect(R.Entry.parseOne('problem 5').count).toBe(5);
      const m = R.Entry.parseOne('matematik soru 30');
      expect(m.count).toBe(30);
      expect(m.subject && m.subject.id).toBe(R.Entry.dersBul('matematik').id);
      /* Ardından süre birimi gelen sayı sayaç değildir. */
      expect(R.Entry.parseOne('soru 40 dakika')).toBeNull();
      /* Dersle çıplak sayı («matematik 90») dakika mı soru mu bilinmez: okunmaz. */
      expect(R.Entry.parseOne('matematik 90')).toBeNull();
    });

    it('uyku saati ondalıklı olabilir', () => {
      expect(R.Entry.parseOne('7,5 saat uyudum').hours).toBe(7.5);
    });

    it('yazıyla sayı da okunur', () => {
      expect(R.Entry.parseOne('on soru çözdüm').count).toBe(10);
    });

    it('dersi bilinmeyen süre günün plan dışı süresine gider (King-Bench tur 6); çalışma sözü yoksa yazılmaz', () => {
      /* «bugün 2 saat ders çalıştım» kayboluyordu; ders ayrımsız plan dışı dakikaya yazılır. */
      expect(R.Entry.parseOne('45 dakika çalıştım')).toEqual({ kind:'sure', minutes:45, subject:null });
      expect(R.Entry.parseOne('45 dakika')).toBeNull();
    });

    it('dersi bilinen süre kaydedilir', () => {
      const p = R.Entry.parseOne('45 dakika kimya çalıştım');
      expect(p.kind).toBe('sure');
      expect(p.minutes).toBe(45);
    });

    it('saat dakikaya çevrilir', () => {
      expect(R.Entry.parseOne('2 saat fizik çalıştım').minutes).toBe(120);
    });

    it('uyku saat+dakika, buçuk ve yazıyla sayı tanınır', () => {
      expect(R.Entry.parseOne('7 saat 30 dk uyudum').hours).toBe(7.5);
      expect(R.Entry.parseOne('7 buçuk saat uyudum').hours).toBe(7.5);
      expect(R.Entry.parseOne('yedi buçuk saat uyudum').hours).toBe(7.5);
      expect(R.Entry.parseOne('6 saat 45 dakika uyudum').hours).toBe(6.75);
      expect(R.Entry.parseOne('5 saat uyuyabildim').hours).toBe(5);
      expect(R.Entry.parseUyku('uyudum')).toBeNull();
    });

    it('çalışma süresinde bileşik, yarım, çeyrek ve buçuk tanınır', () => {
      const b1 = R.Entry.parseOne('1 saat 15 dk matematik çalıştım');
      expect([b1.kind, b1.minutes, b1.subject.id]).toEqual(['sure', 75, 'tyt-matematik']);
      const y = R.Entry.parseOne('yarım saat fizik çalıştım');
      expect([y.kind, y.minutes, y.subject.id]).toEqual(['sure', 30, 'ayt-fizik']);
      const buc = R.Entry.parseOne('bir buçuk saat matematik');
      expect([buc.kind, buc.minutes, buc.subject.id]).toEqual(['sure', 90, 'tyt-matematik']);
      const c = R.Entry.parseOne('çeyrek saat matematik');
      expect([c.kind, c.minutes, c.subject.id]).toEqual(['sure', 15, 'tyt-matematik']);
      expect(R.Entry.parseSure('matematik çalıştım')).toBeNull();
      /* Sayaç içeren cümle süre sayılmaz: soru kaydına gider. */
      expect(R.Entry.parseSure('30 soru matematik 45 dakika')).toBeNull();
      expect(R.Entry.parseOne('30 soru matematik 45 dakika').kind).toBe('soru');
    });

    it('veri taşımayan cümle öneri üretmez', () => {
      const r = R.Entry.fromText('bugün hava çok güzeldi', { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(0);
      expect(r.anlasilmayan.length).toBe(1);
    });

    it('bileşik cümle İKİ öneri üretir', () => {
      const r = R.Entry.fromText('fizikten 25 soru çözdüm ve 20 paragraf yaptım',
        { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(2);
      expect(r.oneriler.map(o => o.action).sort()).toEqual(['paragraf-yaz', 'soru-yaz']);
    });

    it('anlaşılmayan yan cümle SESSİZCE DÜŞMEZ', () => {
      const r = R.Entry.fromText('20 paragraf yaptım ve canım sıkkındı',
        { date:'2026-03-01' });
      expect(r.oneriler).toHaveLength(1);
      expect(r.anlasilmayan.length).toBe(1);
    });
  });

  describe('Giriş — katalog ve yetki', () => {
    it('her veri eylemi kapalı katalogda kayıtlı', () => {
      ['soru-yaz', 'paragraf-yaz', 'problem-yaz', 'uyku-yaz', 'sure-yaz'].forEach(id => {
        expect(Boolean(R.ACTION_BY_ID[id])).toBeTruthy();
      });
    });

    it('veri eylemlerini yalnız Patron önerebilir', () => {
      /* Bir koç senin adına «40 soru çözdün» diyemez: sayı senin
         cümlenden çıkar, koçun tahmininden değil. */
      ['soru-yaz', 'paragraf-yaz', 'problem-yaz', 'uyku-yaz', 'sure-yaz'].forEach(id => {
        expect(R.ACTION_BY_ID[id].agents).toEqual(['patron']);
      });
    });

    it('alt koç önerirse doğrulama geçmez', () => {
      const c = R.Proposals.check({ action:'paragraf-yaz', agent:'tyt',
        params:{ count:10, date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });

    it('katalog dışı eylem reddedilir', () => {
      expect(R.Proposals.check({ action:'her-seyi-sil', agent:'patron', params:{} }).ok)
        .toBeFalsy();
    });

    it('akıl dışı sayı reddedilir ve NEDENİ söylenir', () => {
      const c = R.Proposals.check({ action:'soru-yaz', agent:'patron',
        params:{ count:5000, date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
      expect(c.why.length > 10).toBeTruthy();
    });

    it('olmayan ders reddedilir', () => {
      const c = R.Proposals.check({ action:'sure-yaz', agent:'patron',
        params:{ minutes:30, subjectId:'uydurma-ders', date:'2026-03-01' } });
      expect(c.ok).toBeFalsy();
    });
  });

  /* King 5 tur 5: deneme sonucu sohbetten (tur 4 açığı: «78 net: Türkçe 30 …» Deneme sayfasını açıyordu). */
  describe('Giriş — deneme sonucu', () => {
    const D = '2026-11-10';
    it('çok testli cümle tek deneme önerisidir, virgülden bölünmez', () => {
      const r = R.Komut.anla('TYT denemesi: Türkçe 32 doğru 6 yanlış, Matematik 25/5, Fen 12 doğru 4 yanlış 4 boş', { date:D });
      expect(r.oneriler.length).toBe(1);
      expect(r.oneriler[0].action).toBe('deneme-yaz');
      expect(r.oneriler[0].params.testler).toBe('Türkçe:32:6:;Temel Matematik:25:5:;Fen Bilimleri:12:4:4');
      /* «deneme» sözü olmadan da iki testin doğru/yanlışı denemedir; AYT dersi aileyi seçer. */
      const a = R.Entry.parseDeneme('matematik 30 doğru 6 yanlış, fizik 9 doğru 3 yanlış');
      expect([a.aile, a.testler.length]).toEqual(['AYT', 2]);
    });
    it('yalnız net söylenirse yazılmaz, ne eksik olduğu sorulur', () => {
      const r = R.Komut.anla('78 net yaptım denemede: Türkçe 30, Matematik 25, Sosyal 12, Fen 11', { date:D });
      expect(r.oneriler.length).toBe(0);
      expect(r.sorular[0].deneme).toBe(true);
      expect(/doğru ve yanlış/.test(r.sorular[0].soru)).toBe(true);
      expect(R.Palette.kingSor('78 net yaptım denemede: Türkçe 30, Matematik 25, Sosyal 12, Fen 11')).toBe(r.sorular[0].soru);
      /* Soru sayısından fazla doğru+yanlış kabul edilmez. */
      expect(/40 soru var/.test(R.Entry.parseDeneme('deneme: türkçe 38 doğru 5 yanlış').engel.soru)).toBe(true);
    });
    it('virgülsüz iki sayaç ya da iki ders ayrı kayıttır; hiçbiri düşmez', () => {
      const a = R.Entry.fromText('paragraf 20 problem 15', { date:D });
      expect(a.oneriler.map(o => o.action + ':' + o.params.count)).toEqual(['paragraf-yaz:20', 'problem-yaz:15']);
      const b = R.Entry.fromText('mat 35 türkçe 40 soru çözdüm', { date:D });
      expect(b.oneriler.map(o => o.action + ':' + o.params.count + ':' + o.params.subjectId)).toEqual(['soru-yaz:35:tyt-matematik', 'soru-yaz:40:tyt-turkce']);
      expect(R.Entry.fromText('matematikten 40 soru çözdüm 32 doğru', { date:D }).oneriler.length).toBe(1);
    });
    it('tek ders soru kaydı deneme sanılmaz', () => {
      expect(R.Entry.parseDeneme('matematikten 40 soru çözdüm 32 doğru 8 yanlış')).toBe(null);
      expect(R.Entry.parseDeneme('TYT matematikten 40 soru çözdüm')).toBe(null);
      expect(R.Komut.anla('matematikten 40 soru çözdüm 32 doğru', { date:D }).oneriler[0].action).toBe('soru-yaz');
    });
    it('King-Bench: sayı sözleri, iki gün tek cümlede, başkasının sayısı, tutarsız doğru+yanlış', () => {
      const dun = R.U.iso(R.U.addDays(R.U.parse(D), -1));
      const a = R.Komut.anla('ııı şey bugün matematikten otuz beş soru çözdüm otuzu doğruydu', { date:D }).oneriler[0];
      expect([a.params.count, a.params.correct]).toEqual([35, 30]);
      const iki = R.Komut.anla('dün 40 bugün 30 soru çözdüm', { date:D }).oneriler.map(o => o.params.date + ':' + o.params.count);
      expect(iki).toEqual([dun + ':40', D + ':30']);
      expect(R.Komut.anla('arkadaşım 50 soru çözmüş ben 20', { date:D }).oneriler.map(o => o.params.count)).toEqual([20]);
      const dag = R.Komut.anla('dün ve bugün ikişer saat kimya çalıştım', { date:D }).oneriler.map(o => o.params.date + ':' + o.params.minutes);
      expect(dag).toEqual([dun + ':120', D + ':120']);
      expect(R.Komut.anla('40 soru çözdüm 32 doğru 12 yanlış', { date:D }).oneriler.length).toBe(0);
    });
    it('King-Bench: «dün …» rapor cümlesi dünün gününe yazılır', () => {
      const r = R.Komut.anla('dün matematikten 40 soru çözdüm', { date:D });
      expect(r.oneriler[0].params.date).toBe(R.U.iso(R.U.addDays(R.U.parse(D), -1)));
    });
    it('önizleme, kayıt ve geri al', async () => {
      resetState();
      await withTodayAsync(D, async () => {
        const once = (R.S.exams || []).length;
        const p = R.Palette.kingOnizle('TYT denemesi: Türkçe 32 doğru 6 yanlış, Matematik 25 doğru 5 yanlış');
        expect(p.tur).toBe('veri');
        expect(/Toplam net/.test(p.metin)).toBe(true);
        expect((R.S.exams || []).length).toBe(once);           // önizleme yazmaz
        const k = await p.kaydet();
        const ex = R.S.exams[R.S.exams.length - 1];
        expect([R.S.exams.length, ex.family, ex.templateId, ex.tests.length]).toEqual([once + 1, 'TYT', 'tyt-cut', 2]);
        expect([ex.tests[0].blank, ex.tests[0].blankCert]).toEqual([2, 'derived']);
        expect(R.Model.examNet(ex)).toBe(54.25);
        await k.geriAl();
        expect(R.S.exams.length).toBe(once);
      });
    });
  });
})();
