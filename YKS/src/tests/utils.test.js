/* R.U — tarih, sayi ve metin yardimcilari */

(function(){
  const { describe, it, expect } = R.Test;
  const U = R.U;

  describe('U.median', function(){
    it('tek sayida elemanda ortadaki degeri verir', function(){
      expect(U.median([3,1,2])).toBe(2);
    });
    it('cift sayida elemanda ortalamayi verir', function(){
      expect(U.median([1,2,3,4])).toBe(2.5);
    });
    it('bos dizide null doner', function(){
      expect(U.median([])).toBeNull();
    });
    it('NaN ve sayi olmayanlari eler', function(){
      expect(U.median([1, NaN, 3, 'x', null, 5])).toBe(3);
    });
    it('tum elemanlar gecersizse null doner', function(){
      expect(U.median([NaN, null, undefined])).toBeNull();
    });
    it('tek elemanda o elemani verir', function(){
      expect(U.median([7])).toBe(7);
    });
  });

  describe('U.diffDays', function(){
    it('ayni gunde 0 verir', function(){
      expect(U.diffDays('2026-09-14','2026-09-14')).toBe(0);
    });
    it('ertesi gunde 1 verir', function(){
      expect(U.diffDays('2026-09-14','2026-09-15')).toBe(1);
    });
    it('geriye dogru negatif verir', function(){
      expect(U.diffDays('2026-09-15','2026-09-14')).toBe(-1);
    });
    it('ay gecisini dogru hesaplar', function(){
      expect(U.diffDays('2026-09-28','2026-10-04')).toBe(6);
    });
    it('yil gecisini dogru hesaplar', function(){
      expect(U.diffDays('2026-12-28','2027-01-04')).toBe(7);
    });
    it('program basindan sinava kadar olan araligi verir', function(){
      expect(U.diffDays('2026-09-14','2027-06-19')).toBe(278);
    });
  });

  describe('U.weekdayIndex', function(){
    it('Pazartesi icin 0 verir', function(){
      expect(U.weekdayIndex('2026-09-14')).toBe(0);
    });
    it('Cumartesi icin 5 verir', function(){
      expect(U.weekdayIndex('2026-09-19')).toBe(5);
    });
    it('Pazar icin 6 verir', function(){
      expect(U.weekdayIndex('2026-09-20')).toBe(6);
    });
  });

  describe('U.addDays', function(){
    it('ay sonunu asarken dogru tarihe gecer', function(){
      expect(U.iso(U.addDays(U.parse('2026-09-28'), 7))).toBe('2026-10-05');
    });
    it('negatif gun geri gider', function(){
      expect(U.iso(U.addDays(U.parse('2026-10-01'), -1))).toBe('2026-09-30');
    });
    it('artik yil subatini dogru gecer', function(){
      expect(U.iso(U.addDays(U.parse('2028-02-28'), 1))).toBe('2028-02-29');
    });
  });

  describe('U.iso / U.parse', function(){
    it('gidip gelirken degeri korur', function(){
      expect(U.iso(U.parse('2027-06-19'))).toBe('2027-06-19');
    });
    it('tek haneli ay ve gunu sifirla doldurur', function(){
      expect(U.iso(new Date(2027, 0, 5))).toBe('2027-01-05');
    });
  });

  describe('U.esc', function(){
    it('HTML ozel karakterlerini kacar', function(){
      expect(U.esc('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    });
    it('tek tirnagi kacar (attribute injection)', function(){
      expect(U.esc("' onmouseover='alert(1)")).toBe('&#39; onmouseover=&#39;alert(1)');
    });
    it('ampersandi kacar', function(){
      expect(U.esc('a & b')).toBe('a &amp; b');
    });
    it('null ve undefined icin bos string verir', function(){
      expect(U.esc(null)).toBe('');
      expect(U.esc(undefined)).toBe('');
    });
    it('sayiyi metne cevirir', function(){
      expect(U.esc(42)).toBe('42');
    });
  });

  describe('U.round / U.clamp / U.pct', function(){
    it('varsayilan olarak bir ondalige yuvarlar', function(){
      expect(U.round(19.26)).toBe(19.3);
    });
    it('istenen basamaga yuvarlar', function(){
      expect(U.round(19.264, 2)).toBe(19.26);
    });
    it('clamp alt ve ust siniri uygular', function(){
      expect(U.clamp(5, 10, 20)).toBe(10);
      expect(U.clamp(25, 10, 20)).toBe(20);
      expect(U.clamp(15, 10, 20)).toBe(15);
    });
    it('pct yuzdeyi tam sayiya yuvarlar', function(){
      expect(U.pct(1, 3)).toBe(33);
    });
    it('pct sifir paydada 0 verir (bolme hatasi yok)', function(){
      expect(U.pct(5, 0)).toBe(0);
    });
  });

  describe('U.fmtNet', function(){
    it('neti iki ondalikla Turkce bicimde yazar', function(){
      expect(U.fmtNet(19.5)).toBe('19,50');
    });
    it('null icin tire verir', function(){
      expect(U.fmtNet(null)).toBe('—');
    });
    it('negatif neti dogru yazar', function(){
      expect(U.fmtNet(-2.25)).toBe('-2,25');
    });
  });

  describe('U.sum', function(){
    it('sayisal olmayanlari 0 sayar', function(){
      expect(U.sum([1, null, 2, undefined, '3'])).toBe(6);
    });
    it('bos dizide 0 verir', function(){
      expect(U.sum([])).toBe(0);
    });
  });
})();
