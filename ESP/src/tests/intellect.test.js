/* Entelektuel skor motoru — EHS, SSK, okunabilirlik, safsata. */

(function(){
  const { describe, it, expect, resetState, withToday,
    pushSession, pushNote, pushBook, pushArgument, pushCard } = ESP.Test;
  const I = ESP.Intellect, S = ESP.S;

  describe('EHS — hacim', () => {

    it('girilmemis gunler toplama GIRMEZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'music', 60);
        const h = I.hoursOf('music', 14);
        expect(h.minutes).toBe(60);
        expect(h.enteredDays).toBe(1);
        expect(h.windowDays).toBe(14);
      });
    });

    it('hic dokunulmamis disiplin «veri yok» doner, sifir degil', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'music', 60);
        expect(I.hoursOf('writing', 14).cert).toBe('missing');
      });
    });

    it('hic kayit yoksa EHS URETILMEZ', () => {
      withToday('2026-09-12', () => {
        resetState();
        const e = I.ehs(14);
        expect(e.cert).toBe('missing');
        expect(e.value).toBe(null);
      });
    });

    it('EHS yaninda kac gunden hesaplandigini tasir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'music', 60);
        pushSession('2026-09-11', 'lang', 30);
        const e = I.ehs(14);
        expect(e.enteredDays).toBe(2);
        expect(e.windowDays).toBe(14);
      });
    });

    it('dokunulmamis disiplinler ayrica bildirilir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'music', 60);
        expect(I.ehs(14).untouched.indexOf('writing') >= 0).toBe(true);
      });
    });

    it('kalite katsayisi olculemezse 1,0 kalir ve bunu SOYLER', () => {
      withToday('2026-09-12', () => {
        resetState();
        const k = I.qualityCoef('diction');
        expect(k.k).toBe(1);
        expect(k.cert).toBe('missing');
        expect(!!k.why).toBe(true);
      });
    });

    it('katsayi [0,85 – 1,15] araliginda kalir', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushCard({ front:'a', reps:5, box:5, interval:21, ease:2.8, due:'2026-09-13' });
        const k = I.qualityCoef('lang');
        expect(k.k >= 0.85 && k.k <= 1.15).toBe(true);
      });
    });
  });

  describe('SSK — sentez', () => {

    it('tek yazarda SIFIRLANMAZ — log(1+n) kullanilir', () => {
      resetState();
      const b = pushBook('Devlet', 'Platon');
      const n1 = pushNote('A', b.id, ['adalet']);
      const n2 = pushNote('B', b.id, ['adalet']);
      n1.links = [{ to:n2.id, why:'' }];
      n2.links = [{ to:n1.id, why:'' }];
      const ss = I.syntopic();
      expect(ss.cert).toBe('derived');
      expect(ss.value > 0).toBe(true);
    });

    it('kaynak yoksa katsayi URETILMEZ ve nedeni yazilir', () => {
      resetState();
      pushNote('A', null, ['adalet']);
      const ss = I.syntopic();
      expect(ss.cert).toBe('missing');
      expect(!!ss.why).toBe(true);
    });

    it('hic veri yoksa sifir degil «veri yok» doner', () => {
      resetState();
      expect(I.syntopic().cert).toBe('missing');
    });

    it('baglanmamis not sayilir', () => {
      resetState();
      const b = pushBook('Devlet', 'Platon');
      pushNote('A', b.id, []);
      pushNote('B', b.id, []);
      expect(I.unlinkedNotes().length).toBe(2);
    });

    it('ortak kavrami olmayan notlar icin oneri URETILMEZ', () => {
      resetState();
      const b = pushBook('Devlet', 'Platon');
      pushNote('A', b.id, ['adalet']);
      pushNote('B', b.id, ['zaman']);
      expect(I.linkSuggestions().length).toBe(0);
    });

    it('farkli kaynaktan gelen oneri once siralanir', () => {
      resetState();
      const b1 = pushBook('Devlet', 'Platon');
      const b2 = pushBook('Etika', 'Spinoza');
      pushNote('A', b1.id, ['ozgurluk']);
      pushNote('B', b1.id, ['ozgurluk']);
      pushNote('C', b2.id, ['ozgurluk']);
      const o = I.linkSuggestions();
      expect(o[0].cross).toBe(true);
    });
  });

  describe('arguman', () => {

    it('14 gunden eski acik tez tikanmis sayilir', () => {
      withToday('2026-09-12', () => {
        resetState();
        const a = pushArgument('X doğrudur.', ['Ya Y?']);
        a.updatedAt = '2026-08-20T00:00:00Z';
        expect(I.stalledArguments(14, '2026-09-12').length).toBe(1);
      });
    });

    it('yeni dokunulmus tez tikanmis sayilmaz', () => {
      withToday('2026-09-12', () => {
        resetState();
        const a = pushArgument('X doğrudur.', ['Ya Y?']);
        a.updatedAt = '2026-09-11T00:00:00Z';
        expect(I.stalledArguments(14, '2026-09-12').length).toBe(0);
      });
    });

    it('safsata denetimi bulgu doner, yargi vermez', () => {
      const hits = I.checkFallacies('Bu adam zaten anlamıyor, cahil.');
      expect(hits.length > 0).toBe(true);
      expect(hits[0].id).toBe('ad-hominem');
    });

    it('temiz metinde safsata bulunmaz', () => {
      expect(I.checkFallacies('Özgürlük, seçenekleri değerlendirme kapasitesidir.').length).toBe(0);
    });

    it('bos metin denetlenmez', () => {
      expect(I.checkFallacies('').length).toBe(0);
    });
  });

  describe('okunabilirlik — Atesman', () => {

    it('Turkce hece sayisi unlu harf sayisidir', () => {
      expect(I.syllables('kitap')).toBe(2);
      expect(I.syllables('üniversite')).toBe(5);
      expect(I.syllables('kırk')).toBe(1);
    });

    it('bos metin olculmez', () => {
      expect(I.readability('').cert).toBe('missing');
    });

    it('kisa ve sade metin uzun ve agir metinden YUKSEK puan alir', () => {
      const sade = I.readability('Kedi geldi. Su içti. Sonra gitti.');
      const agir = I.readability('Kavramsallaştırmanın epistemolojik temellendirilmesi, '
        + 'transandantal öznenin kurucu etkinliğiyle ilişkilendirildiğinde ortaya çıkan '
        + 'metodolojik güçlükler, çağdaş felsefenin tartışmasız merkezinde durmaktadır.');
      expect(sade.value > agir.value).toBe(true);
    });

    it('sayi icindeki nokta cumle sonu SAYILMAZ', () => {
      const r = I.readability('Bu iş 1.500 lira tuttu ve iki gün sürdü.');
      expect(r.sentences).toBe(1);
    });

    it('bant bir not degil bir tariftir ve daima doner', () => {
      const r = I.readability('Kedi geldi. Su içti.');
      expect(!!r.band.label).toBe(true);
      expect(!!r.band.note).toBe(true);
    });
  });

  describe('yazi olcumu', () => {

    it('baglac ve edat tekrar sayilmaz', () => {
      const r = I.repeats('ve ve ve ve bir bir bir bir kitap kitap kitap kitap');
      expect(r.length).toBe(1);
      expect(r[0].word).toBe('kitap');
    });

    it('taslak yoksa oran URETILMEZ', () => {
      resetState();
      expect(I.draftRatio().cert).toBe('missing');
    });

    it('yazi oturumu yoksa kelime sayisi «veri yok» doner', () => {
      withToday('2026-09-12', () => {
        resetState();
        expect(I.wordsWritten(7).cert).toBe('missing');
      });
    });

    it('yazi oturumundaki sayim kelime olarak okunur', () => {
      withToday('2026-09-12', () => {
        resetState();
        pushSession('2026-09-12', 'writing', 40, { count:600, countCert:'measured' });
        const w = I.wordsWritten(7);
        expect(w.value).toBe(600);
        expect(w.cert).toBe('measured');
      });
    });
  });
})();
