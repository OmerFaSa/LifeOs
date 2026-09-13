/* Formül sınırları — didik didik geçişin matematik bölümü.

   Burada sınanan şey davranış değil FORMÜLÜN KENDİSİ: uç değerlerde sayı
   hâlâ anlamlı mı? Bir formül orta değerlerde doğru, uçta saçma olabilir ve
   bu saçmalık ekranda «%1400 retansiyon» diye görünür. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync,
    pushCard, pushSession } = ESP.Test;

  describe('formul · SRS zamanlama', () => {

    it('aralik hicbir zaman sifir olmaz (yanlis cevap disinda)', () => {
      ESP.SRS.GRADES.filter(g => g.quality > 0).forEach(g => {
        [1, 2, 3, 4, 5].forEach(box => {
          const n = ESP.SRS.schedule({ box, ease:1.3, reps:3 }, g.id, '2026-09-12');
          expect(n.interval >= 1).toBeTruthy();
        });
      });
    });

    it('kutu 1-5 araliginda kalir', () => {
      const n = ESP.SRS.schedule({ box:5, ease:3.2, reps:9 }, 'easy', '2026-09-12');
      expect(n.box).toBe(5);
      const m = ESP.SRS.schedule({ box:0, ease:2.5 }, 'good', '2026-09-12');
      expect(m.box >= 1).toBeTruthy();
    });

    it('kolaylik tabani ve tavani asilmaz', () => {
      let ease = 2.5;
      for(let i = 0; i < 40; i++){
        ease = ESP.SRS.schedule({ box:3, ease, reps:i }, 'easy', '2026-09-12').ease;
      }
      expect(ease <= ESP.SRS.EASE_MAX).toBeTruthy();
      for(let i = 0; i < 40; i++){
        ease = ESP.SRS.schedule({ box:3, ease, reps:i }, 'again', '2026-09-12').ease;
      }
      expect(ease >= ESP.SRS.EASE_MIN).toBeTruthy();
    });

    /* Bir kez unutulan kart, hic ogrenilmemis kartla ayni muameleyi
       gormemeli: kutu basa doner ama ease TAMAMEN sifirlanmaz. */
    it('yanlis cevap gecmisi silmez', () => {
      const n = ESP.SRS.schedule({ box:5, ease:2.8, reps:10, lapses:1 },
        'again', '2026-09-12');
      expect(n.box).toBe(1);
      expect(n.ease > ESP.SRS.EASE_MIN).toBeTruthy();
      expect(n.lapses).toBe(2);
      expect(n.due).toBe('2026-09-12');       // ayni gun tekrar sorulur
    });

    it('bilinmeyen not zamanlama uretmez', () => {
      expect(ESP.SRS.schedule({ box:1 }, 'mukemmel', '2026-09-12')).toBeNull();
    });

    it('aralik ust uste dogru cevapta buyur, kuculmez', () => {
      let c = { box:1, ease:2.5, reps:0, interval:0 };
      let onceki = 0;
      for(let i = 0; i < 6; i++){
        const n = ESP.SRS.schedule(c, 'good', '2026-09-12');
        expect(n.interval >= onceki).toBeTruthy();
        onceki = n.interval;
        c = Object.assign({}, c, n);
      }
    });
  });

  describe('formul · retansiyon', () => {

    it('retansiyon 0 ile 1 arasindadir', () => {
      resetState();
      withToday('2026-09-12', () => {
        [0, 1, 5, 60, 400].forEach(gecen => {
          pushCard({ front:'k' + gecen, back:'b', lang:'en', reps:3, interval:10,
            ease:2.5, box:3,
            due:ESP.U.iso(ESP.U.addDays(ESP.U.parse('2026-09-12'), 10 - gecen)) });
        });
        const r = ESP.SRS.retention('en');
        expect(r.value > 0 && r.value <= 1).toBeTruthy();
      });
    });

    it('hic sorulmamis kart ortalamaya girmez', () => {
      resetState();
      withToday('2026-09-12', () => {
        pushCard({ front:'a', back:'b', lang:'en', reps:0 });
        const r = ESP.SRS.retention('en');
        expect(r.cert).toBe('missing');
        expect(r.total).toBe(1);
        expect(r.n).toBe(0);
      });
    });

    it('gecen sure buyudukce retansiyon duser', () => {
      const taze = ESP.SRS.retentionOf({ reps:3, interval:10, ease:2.5, box:3,
        due:'2026-09-20' }, '2026-09-12');
      const eski = ESP.SRS.retentionOf({ reps:3, interval:10, ease:2.5, box:3,
        due:'2026-09-13' }, '2026-09-12');
      expect(taze > eski).toBeTruthy();
    });
  });

  describe('formul · okunabilirlik', () => {

    it('Atesman skoru makul bantta kalir', () => {
      const metinler = [
        'Kısa cümle.',
        'Bu cümle biraz daha uzun ve birkaç sözcük içeriyor.',
        'Uzun, karmaşık ve çok sayıda yan cümlecik barındıran, okurun '
          + 'nefesini kesen, gereksiz yere uzatılmış bir cümle örneği.',
      ];
      metinler.forEach(t => {
        const r = ESP.Intellect.readability(t);
        expect(r.value >= 0 && r.value <= 100).toBeTruthy();
        expect(r.band != null).toBeTruthy();
      });
    });

    /* Olcek 0-100 ama FORMUL sinirsiz: iki kelimelik bir cumle 113 uretir.
       Kirpilir — ama kirpildigi gizlenmez. */
    it('olcek disina tasan deger kirpilir ve kirpildigi soylenir', () => {
      const r = ESP.Intellect.readability('Kısa cümle.');
      expect(r.value).toBe(100);
      expect(r.raw > 100).toBeTruthy();
      expect(r.clamped).toBeTruthy();
      const n = ESP.Intellect.readability('Bu cümle normal uzunlukta bir '
        + 'cümledir ve ölçeğin içinde kalır.');
      expect(n.clamped).toBeFalsy();
    });

    it('bos metin sifir degil «veri yok»tur', () => {
      expect(ESP.Intellect.readability('').cert).toBe('missing');
      expect(ESP.Intellect.readability('   ').cert).toBe('missing');
    });

    /* Sayi icindeki nokta cumle ayraci DEGILDIR. */
    it('1.500 lira tek cumle sayilir', () => {
      const r = ESP.Intellect.readability('Bu ay 1.500 lira harcadım.');
      expect(r.sentences).toBe(1);
    });

    it('unlu barindirmayan dize heceye bolunmez', () => {
      expect(ESP.Intellect.syllables('bcd')).toBe(0);
      expect(ESP.Intellect.syllables('İstanbul')).toBe(3);
      expect(ESP.Intellect.syllables('göz')).toBe(1);
    });
  });

  describe('formul · sentopik katsayi', () => {

    it('tek yazarda katsayi sifira cokmez', () => {
      resetState();
      const b = ESP.Test.pushBook('Kitap', 'Tek Yazar');
      const n1 = ESP.Test.pushNote('a', b.id, ['zaman']);
      const n2 = ESP.Test.pushNote('b', b.id, ['zaman']);
      n1.links = [{ to:n2.id, why:'x' }];
      n2.links = [{ to:n1.id, why:'x' }];
      const s = ESP.Intellect.syntopic();
      /* log(1+n) tek yazarin sifir yapmasini engeller. */
      expect(s.value > 0).toBeTruthy();
    });

    it('kaynaksiz notlarda katsayi hesaplanmaz', () => {
      resetState();
      ESP.Test.pushNote('a', null, ['zaman']);
      expect(ESP.Intellect.syntopic().cert).toBe('missing');
    });
  });

  describe('formul · entelektuel hacim', () => {

    it('hic olcum yoksa hacim sifir degil «veri yok»tur', () => {
      resetState();
      expect(ESP.Intellect.ehs(14).cert).toBe('missing');
    });

    /* Katsayi OTURUMUN oznel notundan degil disiplinin kendi olcusunden
       gelir: dilde retansiyon, okumada bagli not orani, muzikte hedefe
       ulasan parca orani. Oznel bir "bugun iyiydi" katsayiyi oynatamaz. */
    it('kalite katsayisi dar bantta kalir', () => {
      resetState();
      withToday('2026-09-12', () => {
        for(let i = 0; i < 8; i++){
          pushCard({ front:'k' + i, back:'b' + i, lang:'en', reps:3, interval:10,
            ease:2.5, box:3, due:'2026-09-20' });
        }
        const k = ESP.Intellect.qualityCoef('lang');
        expect(k.cert).toBe('derived');
        expect(k.k >= 0.85 && k.k <= 1.15).toBeTruthy();
      });
    });

    it('olculmemis kalite katsayiyi 1,0 birakir ve bunu soyler', () => {
      resetState();
      const k = ESP.Intellect.qualityCoef('music');
      expect(k.k).toBe(1);
      expect(k.cert).toBe('missing');
      expect(String(k.why).length > 0).toBeTruthy();
    });

    it('dokunulmamis disiplin hacmi asagi cekmez', () => {
      resetState();
      withToday('2026-09-12', () => {
        pushSession('2026-09-12', 'lang', 60);
        const e = ESP.Intellect.ehs(14);
        expect(e.value > 0).toBeTruthy();
        expect(e.untouched.length > 0).toBeTruthy();   // gorunur ama cezalandirmaz
      });
    });
  });

  describe('formul · CEFR bandi', () => {

    it('iki olcum birden olmadan bant verilmez', () => {
      expect(ESP.cefrOf(null, 0.9).cert).toBe('missing');
      expect(ESP.cefrOf(3000, null).cert).toBe('missing');
    });

    it('bant kisiye degil URETIME verilir', () => {
      const r = ESP.cefrOf(3000, 0.8);
      expect(r.text.indexOf('Ölçülen üretimin') === 0).toBeTruthy();
      expect(r.text.indexOf('resmî sınav yerine geçmez') > 0).toBeTruthy();
    });

    it('esigin altinda bant yok', () => {
      expect(ESP.cefrOf(10, 0.5).band).toBeNull();
    });
  });

  describe('formul · akustik', () => {

    it('temiz esik kendiliginden DUSMEZ', () => {
      resetState();
      withToday('2026-09-12', () => {
        const p = ESP.Test.pushPiece('Gam', { cleanBpm:120 });
        p.attempts = [{ date:'2026-09-11', bpm:80, clean:true }];
        const t = ESP.Acoustic.cleanThreshold(p);
        expect(t.value == null || t.value >= 120).toBeTruthy();
      });
    });

    it('WPM iki olcum istemeden hesaplanmaz', () => {
      resetState();
      ESP.S.recordings.push(ESP.Model.newRecording({ seconds:60,
        secondsCert:'measured' }));
      expect(ESP.Acoustic.wpmOf().cert).toBe('missing');
    });

    /* Hata sayisini kullanici isaretler: olculmus gibi kaydedilse bile
       ORAN daima tahmindir ve oyle etiketlenir. */
    it('hata orani DAIMA tahmindir', () => {
      const e = ESP.Acoustic.errorRateOf({ words:120, wordsCert:'measured',
        errors:3, errorsCert:'measured' });
      expect(e.cert).toBe('estimated');
      expect(e.value).toBeCloseTo(0.025, 3);
    });

    it('kelime sayisi olculmemisse hata orani yok', () => {
      expect(ESP.Acoustic.errorRateOf({ errors:3, errorsCert:'estimated',
        wordsCert:'missing' }).cert).toBe('missing');
    });
  });
})();
