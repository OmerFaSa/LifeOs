/* Token sayacı — neyin şiştiğini gösteren ölçüm.

   Bu paketin dikkat ettiği şey şu: ölçüm ile tahmin karışmamalı ve
   fiyatı bilinmeyen model, sıfır fiyatlı model gibi görünmemeli. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const Us = R.Usage, S = R.S;

  const TODAY = '2026-11-10';

  async function reset(){
    resetState();
    await Us.clear();
  }

  describe('Sayaç — kayıt', () => {
    it('çağrı gün, ajan ve model kırılımıyla toplanır', async () => {
      await withTodayAsync(TODAY, async () => {
        await reset();
        await Us.record({ provider:'groq', model:'llama-3.3-70b-versatile',
          agent:'patron', inTok:1000, outTok:200, measured:true });
        await Us.record({ provider:'groq', model:'llama-3.3-70b-versatile',
          agent:'analist', inTok:500, outTok:100, measured:true });

        const day = Us.today();
        expect(day.calls).toBe(2);
        expect(day.inTok).toBe(1500);
        expect(day.outTok).toBe(300);
        expect(day.byAgent.patron.inTok).toBe(1000);
        expect(day.byAgent.analist.outTok).toBe(100);
        expect(day.byModel['groq/llama-3.3-70b-versatile'].calls).toBe(2);
      });
    });

    it('tahmini çağrılar ayrı sayılır', async () => {
      await withTodayAsync(TODAY, async () => {
        await reset();
        await Us.record({ provider:'groq', model:'x', agent:'patron',
          inTok:100, outTok:50, measured:true });
        await Us.record({ provider:'groq', model:'x', agent:'patron',
          inTok:100, outTok:50, measured:false });
        /* Olcum ile tahmin karismasin: kac tanesinin tahmin oldugu bilinmeli. */
        expect(Us.today().calls).toBe(2);
        expect(Us.today().estimated).toBe(1);
      });
    });

    it('boş çağrı kaydedilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        await reset();
        expect(await Us.record({ inTok:0, outTok:0 })).toBe(null);
        expect(Us.today().calls).toBe(0);
      });
    });

    it('eski günler atılır', async () => {
      await withTodayAsync(TODAY, async () => {
        await reset();
        const days = {};
        /* Saklama sinirindan fazla gun yaz. */
        for(let i = 0; i < Us.KEEP_DAYS + 10; i++){
          const d = R.U.iso(R.U.addDays(R.U.parse(TODAY), -i));
          days[d] = { date:d, calls:1, inTok:10, outTok:5, estimated:0, byAgent:{}, byModel:{} };
        }
        S.officeUsage = { days };
        await Us.save();
        expect(Object.keys(S.officeUsage.days).length).toBe(Us.KEEP_DAYS);
      });
    });
  });

  describe('Sayaç — aralık', () => {
    it('son n gün toplanır, dışarısı sayılmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        await reset();
        const eski = R.U.iso(R.U.addDays(R.U.parse(TODAY), -40));
        S.officeUsage = { days:{
          [TODAY]:{ date:TODAY, calls:2, inTok:100, outTok:50, estimated:0,
            byAgent:{ patron:{ calls:2, inTok:100, outTok:50 } },
            byModel:{ 'groq/m':{ calls:2, inTok:100, outTok:50 } } },
          [eski]:{ date:eski, calls:9, inTok:900, outTok:400, estimated:0,
            byAgent:{}, byModel:{} },
        } };
        const r = Us.range(30);
        expect(r.calls).toBe(2);
        expect(r.inTok).toBe(100);
        expect(r.byAgent.patron.calls).toBe(2);
      });
    });
  });

  describe('Sayaç — fiyat', () => {
    it('fiyat katalogdan okunur', async () => {
      const p = Us.priceOf('groq', 'llama-3.3-70b-versatile');
      expect(!!p).toBeTruthy();
      expect(p.in > 0).toBeTruthy();
      /* Katalogda fiyati yazmayan model icin fiyat YOK demektir. */
      expect(Us.priceOf('groq', 'openai/gpt-oss-20b')).toBe(null);
      expect(Us.priceOf('yok', 'x')).toBe(null);
    });

    it('tutar milyon token üzerinden hesaplanır', () => {
      /* 1M girdi + 1M cikti, 0,59 / 0,79 fiyatla = 1,38 dolar. */
      const c = Us.costOfModel('groq/llama-3.3-70b-versatile',
        { inTok:1e6, outTok:1e6 });
      expect(c).toBeCloseTo(1.38, 2);
    });

    it('fiyatı bilinmeyen model tutara girmez ama sayılır', async () => {
      await withTodayAsync(TODAY, async () => {
        await reset();
        await Us.record({ provider:'groq', model:'llama-3.3-70b-versatile',
          agent:'patron', inTok:1e6, outTok:0, measured:true });
        await Us.record({ provider:'groq', model:'openai/gpt-oss-20b',
          agent:'patron', inTok:1e6, outTok:0, measured:true });

        const c = Us.cost(Us.today());
        /* Yalniz fiyati bilinen model tutara girer. */
        expect(c.total).toBeCloseTo(0.59, 2);
        expect(c.unknown).toBe(1);
        expect(c.known).toBe(1);
      });
    });

    it('ücretsiz model sıfır tutar üretir', () => {
      const c = Us.costOfModel('openrouter/meta-llama/llama-3.3-70b-instruct:free',
        { inTok:1e6, outTok:1e6 });
      expect(c).toBe(0);
    });
  });

  describe('Sayaç — biçim', () => {
    it('token sayısı okunur biçimde yazılır', () => {
      expect(Us.fmtTokens(500)).toBe('500');
      expect(Us.fmtTokens(1500)).toBe('1,5K');
      expect(Us.fmtTokens(2400000)).toBe('2,4M');
    });

    it('küçük tutarlar sıfır gibi görünmez', () => {
      expect(Us.fmtCost(0)).toBe('$0');
      expect(Us.fmtCost(0.004)).toBe('<$0,01');
      expect(Us.fmtCost(1.5)).toBe('$1,50');
    });

    it('Türkçe metin karakterden kabaca tahmin edilir', () => {
      expect(Us.estimate('')).toBe(0);
      /* Tahmin kaba ama makul bir bantta olmali. */
      const t = Us.estimate('Bu hafta TYT matematikte üslü sayılara dönmen gerekiyor.');
      expect(t > 8 && t < 30).toBeTruthy();
    });
  });
})();
