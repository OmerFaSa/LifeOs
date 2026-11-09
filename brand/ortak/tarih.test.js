/* Tarih çekirdeği — üç arayüzün tek tarih kaynağı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/tarih.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const T = () => window.LIFEOS.TARIH;

describe('Tarih çekirdeği — ayrıştırma', () => {
  it('geçerli gün yerel gece yarısıdır', () => {
    const d = T().parse('2026-03-05');
    expect(d.getFullYear()).toBe(2026); expect(d.getMonth()).toBe(2); expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(0);
    expect(T().iso(T().parse('2026-05-15T10:00:00'))).toBe('2026-05-15');
  });
  it('takvimde olmayan gün ve metin null; kaydırılmaz', () => {
    expect(T().parse('2026-02-31')).toBe(null);
    expect(T().parse('yarın')).toBe(null);
    expect(T().parse('')).toBe(null);
    expect(T().parse(null)).toBe(null);
    expect(T().parse(new Date(NaN))).toBe(null);
    expect(T().isISO('2028-02-29')).toBe(true);
    expect(T().isISO('2026-02-29')).toBe(false);
  });
  it('dönen Date paylaşılmaz (önbellek bozulmaz)', () => {
    const a = T().parse('2026-01-10'); a.setDate(20);
    expect(T().iso(T().parse('2026-01-10'))).toBe('2026-01-10');
  });
  it('King-Bench: rapor cümlesinin geçmiş günü; «geçen» önceki takvim haftası; ders adı «tarih» gün değil', () => {
    const B = '2026-11-11';   // çarşamba
    const g = m => T().gunSozu(m, B);
    expect(g('dün akşam 2 saat fizik çalıştım')).toBe('2026-11-10');
    expect(g('evvelsi gün 3 saat')).toBe('2026-11-09');
    expect(g('5 gün önce 40 soru')).toBe('2026-11-06');
    expect(g('salı 30 soru')).toBe('2026-11-10');
    expect(g('geçen salı 30 kimya sorusu çözmüştüm')).toBe('2026-11-03');
    expect(g('cumartesi 10 soru')).toBe('2026-11-07');
    expect(g('cuma 5 soru')).toBe('2026-11-06');
    expect(g('pazar günü 20 soru')).toBe('2026-11-08');
    expect(g('bugün 40 soru')).toBe(null);
    expect(g('tarih 30 soru çözdüm')).toBe(null);
    expect(g('pazartesiden beri')).toBe(null);
  });
});

describe('Tarih çekirdeği — hesap ve biçim', () => {
  it('gün farkı; bozuk girdide null, NaN değil', () => {
    expect(T().diffDays('2026-01-01', '2026-03-01')).toBe(59);
    expect(T().diffDays('2026-03-29', '2026-03-30')).toBe(1);   // yaz saati geçişi gün sayısını bozmaz
    expect(T().diffDays('2026-01-01', 'bozuk')).toBe(null);
  });
  it('gün ekleme Date ve dize alır; bozuksa bugünden sayar', () => {
    expect(T().iso(T().addDays('2026-12-31', 1))).toBe('2027-01-01');
    expect(T().iso(T().addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(T().iso(T().addDays('bozuk', 0))).toBe(T().todayISO());
  });
  it('hafta günü Pazartesi 0; biçimler bozukta boş', () => {
    expect(T().weekdayIndex('2026-11-02')).toBe(0);
    expect(T().weekdayIndex('2026-11-01')).toBe(6);
    expect(T().weekdayIndex('x')).toBe(null);
    expect(T().fmtDate('2026-11-01')).toBe('1 Kasım 2026');
    expect(T().fmtShort('2026-08-09')).toBe('9 Ağu');
    expect(T().monthKey('2026-08-09')).toBe('2026-08');
    expect(T().fmtDate('x')).toBe('');
  });
  it('zaman damgası yerel güne iner', () => {
    expect(T().gunOf('2026-09-24')).toBe('2026-09-24');
    expect(T().gunOf(new Date(2026, 8, 24, 1, 30).toISOString())).toBe('2026-09-24');
  });
});
})();
