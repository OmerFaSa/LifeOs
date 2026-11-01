/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/bicim.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Biçim çekirdeği — sayı, net, süre.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/bicim.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const B = () => window.LIFEOS.BICIM;
  const U = () => (window.R || window.SP || window.ESP).U;

describe('Biçim çekirdeği', () => {
  it('sayı ve net Türkçe biçimde; eksik veri tire', () => {
    expect(B().fmtNum(1234567)).toBe((1234567).toLocaleString('tr-TR'));
    expect(B().fmtNum(1.5)).toBe('1,5');
    expect(B().fmtNet(12.345)).toBe('12,35');
    expect(B().fmtNet(7)).toBe('7,00');
    expect(B().fmtNum(null)).toBe('—');
    expect(B().fmtNet(NaN)).toBe('—');
  });
  it('süre ve saat', () => {
    expect(B().fmtMin(119.6)).toBe('2 sa');
    expect(B().fmtMin(80)).toBe('1 sa 20 dk');
    expect(B().fmtMin(null)).toBe('—');
    expect(B().fmtClock(125)).toBe('02:05');
  });
  it('küçük sayı yardımcıları', () => {
    expect(B().median([3, 1, 2])).toBe(2);
    expect(B().median([])).toBe(null);
    expect(B().pct(1, 3)).toBe(33);
    expect(B().pct(1, 0)).toBe(0);
    expect(B().clamp(12, 0, 10)).toBe(10);
    expect(B().sum([1, '2', null])).toBe(3);
  });
  it('modülün U nesnesi aynı işlevleri kullanır (tek kaynak)', () => {
    ['median', 'round', 'clamp', 'sum', 'pct', 'fmtNet', 'fmtNum', 'fmtMin', 'fmtClock']
      .forEach(a => expect(U()[a] === B()[a]).toBe(true));
  });
});
})();
