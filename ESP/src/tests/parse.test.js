/* Turkce ayristiricilar.

   Uc kazanilmis ders burada kilitlenir: insanlar fiil soyler, takma ad
   dizini uzundan kisaya siralanir, sayi icindeki virgul ayrac degildir.
   Ve degismez kural: emin olunamayan satir ATILMAZ. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const P = ESP.Parse;

  describe('oturum ayristirma', () => {

    it('«45 dakika gitar çalıştım» tek oturum uretir', () => {
      const r = P.parseSession('45 dakika gitar çalıştım');
      expect(r.rows.length).toBe(1);
      expect(r.rows[0].disc).toBe('music');
      expect(r.rows[0].minutes).toBe(45);
    });

    it('«ve» ile ayrilan iki cumle IKI oturum uretir', () => {
      const r = P.parseSession('45 dakika gitar çalıştım ve 20 dakika kelime tekrarı yaptım');
      expect(r.rows.length).toBe(2);
    });

    it('saat dakikaya cevrilir', () => {
      const r = P.parseSession('1 saat felsefe okudum');
      expect(r.rows[0].minutes).toBe(60);
    });

    it('ondalikli saat okunur — virgul ayrac SAYILMAZ', () => {
      const r = P.parseSession('1,5 saat gitar çalıştım');
      expect(r.rows.length).toBe(1);
      expect(r.rows[0].minutes).toBe(90);
    });

    it('«derin okuma» genel «okuma»dan ONCE eslesir', () => {
      const r = P.parseSession('30 dakika derin okuma yaptım');
      expect(r.rows[0].disc).toBe('reading');
    });

    it('ikinci sayi (kelime) ayri alana duser', () => {
      const r = P.parseSession('40 dakika yazı yazdım 600 kelime');
      expect(r.rows[0].disc).toBe('writing');
      expect(r.rows[0].count).toBe(600);
    });

    it('anlasilmayan satir ATILMAZ — «eşleşmedi» olarak doner', () => {
      const r = P.parseSession('bugün hava çok güzeldi');
      expect(r.rows.length).toBe(0);
      expect(r.unmatched.length).toBe(1);
      expect(!!r.unmatched[0].why).toBe(true);
    });

    it('disiplin taniniyor ama sure yoksa satir kaydedilmez, sorulur', () => {
      const r = P.parseSession('bugün gitar çalıştım');
      expect(r.rows.length).toBe(0);
      expect(r.unmatched[0].disc).toBe('music');
    });

    it('sure var ama disiplin yoksa satir kaydedilmez, sorulur', () => {
      const r = P.parseSession('30 dakika uğraştım');
      expect(r.rows.length).toBe(0);
      expect(r.unmatched[0].minutes).toBe(30);
    });

    it('bos metin hicbir sey uretmez', () => {
      const r = P.parseSession('   ');
      expect(r.rows.length).toBe(0);
      expect(r.unmatched.length).toBe(0);
    });
  });

  describe('kelime listesi ayristirma', () => {

    it('uc ayrac da taninir', () => {
      const r = P.parseVocab('a – b\nc = d\ne: f', 'en');
      expect(r.rows.length).toBe(3);
    });

    it('tek kelimelik satirdan kart URETILMEZ ve sebebi yazilir', () => {
      const r = P.parseVocab('kelime', 'en');
      expect(r.rows.length).toBe(0);
      expect(r.unmatched.length).toBe(1);
    });

    it('ayni on yuz iki kez alinmaz ama SESSIZCE atilmaz', () => {
      const r = P.parseVocab('a – b\na – c', 'en');
      expect(r.rows.length).toBe(1);
      expect(r.duplicates.length).toBe(1);
    });

    it('cok kelimeli on yuz «kalıp» sayilir', () => {
      const r = P.parseVocab('make a point – bir noktaya değinmek', 'en');
      expect(r.rows[0].kind).toBe('phrase');
    });

    it('dil etiketi karta tasinir', () => {
      const r = P.parseVocab('trotzdem – yine de', 'de');
      expect(r.rows[0].lang).toBe('de');
    });
  });

  describe('tez ayristirma', () => {

    it('«çünkü» destegi ayirir', () => {
      const r = P.parseArgument('X doğrudur çünkü Y geçerlidir.');
      expect(r.thesis.indexOf('X doğrudur') >= 0).toBe(true);
      expect(r.supports.length).toBe(1);
    });

    it('«ama» itirazi ayirir', () => {
      const r = P.parseArgument('X doğrudur. Ama Z olabilir.');
      expect(r.objections.length).toBe(1);
    });

    it('nereye koyacagini bilemedigi cumleyi SORAR', () => {
      const r = P.parseArgument('X doğrudur. Hava bugün yağmurlu.');
      expect(r.unmatched.length).toBe(1);
    });

    it('bos metin tez uretmez', () => {
      const r = P.parseArgument('');
      expect(r.thesis).toBe('');
    });
  });

  describe('kavram ayikama', () => {

    it('kanonik kavram bulunur', () => {
      const c = P.extractConcepts('Özgürlük ve adalet üzerine.');
      expect(c.length).toBe(2);
    });

    it('esanlamli yazim ayni kavrama duser', () => {
      const c = P.extractConcepts('hürriyet meselesi');
      expect(c.length).toBe(1);
      expect(c[0].id).toBe('ozgurluk');
    });

    it('kanonda olmayan kelime UYDURULMAZ', () => {
      const c = P.extractConcepts('bisiklet ve kahve');
      expect(c.length).toBe(0);
    });

    it('conceptOf bulamazsa null doner', () => {
      expect(ESP.conceptOf('bisiklet')).toBe(null);
    });
  });
})();
