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

    it('uyku saati ondalıklı olabilir', () => {
      expect(R.Entry.parseOne('7,5 saat uyudum').hours).toBe(7.5);
    });

    it('yazıyla sayı da okunur', () => {
      expect(R.Entry.parseOne('on soru çözdüm').count).toBe(10);
    });

    it('dersi bilinmeyen süre kaydedilmez', () => {
      /* Süre nereye yazılacak? Bilinmiyorsa yazılmaz. */
      expect(R.Entry.parseOne('45 dakika çalıştım')).toBeNull();
    });

    it('dersi bilinen süre kaydedilir', () => {
      const p = R.Entry.parseOne('45 dakika kimya çalıştım');
      expect(p.kind).toBe('sure');
      expect(p.minutes).toBe(45);
    });

    it('saat dakikaya çevrilir', () => {
      expect(R.Entry.parseOne('2 saat fizik çalıştım').minutes).toBe(120);
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
})();
