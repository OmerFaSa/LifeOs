/* Konu haritaları — veri bütünlüğü ve BEYAN sınırı.

   En önemli kural tek cümle: konu işareti bir ÖLÇÜM DEĞİLDİR. Hiçbir
   kapıyı açmaz, hiçbir kademeyi değiştirmez, hiçbir hesaba girmez. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const L = () => ESP.Lesson;

  describe('konu · veri', () => {

    it('her disiplinin konu haritasi vardir', () => {
      const eksik = ESP.DISCIPLINES.filter(d => !L().topics(d.id).length);
      expect(eksik.map(d => d.id).join(',')).toBe('');
    });

    it('her konunun hedefi ve en az uc maddesi vardir', () => {
      const kotu = [];
      ESP.TOPIC_LIST.forEach(t => {
        if(!String(t.title || '').trim()) kotu.push(t.id + ':baslik');
        if(!String(t.goal || '').trim()) kotu.push(t.id + ':hedef');
        if((t.items || []).length < 3) kotu.push(t.id + ':madde');
      });
      expect(kotu.join(',')).toBe('');
    });

    it('konu kimlikleri tekildir', () => {
      const idler = ESP.TOPIC_LIST.map(t => t.id);
      expect(idler.length).toBe(idler.filter((x, i) => idler.indexOf(x) === i).length);
    });

    it('her konunun kademesi merdiven basamaklarindan biridir', () => {
      const kotu = ESP.TOPIC_LIST.filter(t => !(t.level >= 1 && t.level <= 5));
      expect(kotu.map(t => t.id).join(',')).toBe('');
    });

    it('dil konulari gercek CEFR bandi tasir', () => {
      const bantlar = ESP.CEFR.map(b => b.label);
      const kotu = L().topics('lang').filter(t => t.band && bantlar.indexOf(t.band) < 0);
      expect(kotu.map(t => t.id).join(',')).toBe('');
    });

    /* Cerceve baskasindan alindiysa NEREDEN alindigi yazar. Kaynagi
       yazilmayan bir cerceve, uydurulmus bir cerceveden ayirt edilemez. */
    it('disaridan alinan cerceveler kaynagini tasir', () => {
      const beklenen = ['l-aracilik', 'l-cevrimici', 'd-retorik', 'r-duzey',
        'r-analitik', 'r-sentopik', 'w-retorik'];
      const eksik = beklenen.filter(id => {
        const t = ESP.TOPIC_LIST.filter(x => x.id === id)[0];
        return !t || !String(t.source || '').trim();
      });
      expect(eksik.join(',')).toBe('');
    });

    it('hicbir konu sure vaat etmez', () => {
      const vaat = ESP.trRe('ayda|haftada|gunde|saatte', 'i');
      const kotu = ESP.TOPIC_LIST.filter(t =>
        vaat.test(t.goal) || (t.items || []).some(x => vaat.test(x)));
      expect(kotu.map(t => t.id).join(',')).toBe('');
    });

    it('konu sayisi bolum basina en az alti', () => {
      ESP.DISCIPLINES.forEach(d => {
        expect(L().topics(d.id).length >= 6).toBeTruthy();
      });
    });
  });

  describe('konu · beyan siniri', () => {

    it('isaretsiz konunun kesinligi «veri yok»tur', () => {
      resetState();
      const t = L().topics('music')[0];
      expect(L().topicProgress(t).cert).toBe('missing');
    });

    /* Isaret DAIMA tahmindir: sistem dogrulayamaz. */
    it('isaretlenen konu «tahmin» etiketi tasir', async () => {
      resetState();
      const t = L().topics('music')[0];
      await L().markTopic(t.id, 0);
      const p = L().topicProgress(t);
      expect(p.marked).toBe(1);
      expect(p.cert).toBe('estimated');
    });

    it('isaret geri alinabilir', async () => {
      resetState();
      const t = L().topics('philo')[0];
      await L().markTopic(t.id, 2);
      await L().markTopic(t.id, 2);
      expect(L().topicProgress(t).marked).toBe(0);
    });

    /* En onemlisi: beyan hicbir kapiyi acmaz. */
    it('butun konular isaretlense bile kademe degismez', async () => {
      resetState();
      const once = ESP.Curriculum.levelOf('music').rank;
      for(const t of L().topics('music')){
        for(let i = 0; i < t.items.length; i++) await L().markTopic(t.id, i);
      }
      ESP.Memo.bitir();
      expect(ESP.Curriculum.levelOf('music').rank).toBe(once);
    });

    it('beyan merdiven olculerine girmez', async () => {
      resetState();
      const t = L().topics('reading')[0];
      await L().markTopic(t.id, 0);
      ESP.Memo.bitir();
      expect(ESP.Curriculum.measure('reading.notes').value).toBe(0);
    });

    it('ozet isaretli madde sayisini dogru toplar', async () => {
      resetState();
      const list = L().topics('writing');
      await L().markTopic(list[0].id, 0);
      await L().markTopic(list[1].id, 1);
      const o = L().topicSummary('writing');
      expect(o.marked).toBe(2);
      expect(o.topics).toBe(list.length);
      expect(o.cert).toBe('estimated');
    });
  });
})();
