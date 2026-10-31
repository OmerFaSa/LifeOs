/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/turkcesayi.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Türkçe sayı ve süre — kullanıcının konuştuğu gibi yazdığı miktar ve süre.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/turkcesayi.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const T = () => window.LIFEOS.TurkceSayi;

describe('Türkçe sayı ve süre — süre', () => {
  it('bileşik süre: saat + dakika toplanır', () => {
    expect(T().dakika('1 saat 20 dk yürüyüş')).toBe(80);
    expect(T().dakika('6 saat 45 dakika uyudum')).toBe(405);
    expect(T().dakika('2 saat ve 15 dakika')).toBe(135);
    expect(T().dakika('bir saat yirmi dakika')).toBe(80);
  });
  it('buçuk, yarım ve çeyrek', () => {
    expect(T().dakika('1 buçuk saat koşu')).toBe(90);
    expect(T().dakika('yedi buçuk saat uyudum')).toBe(450);
    expect(T().dakika('yarım saat')).toBe(30);
    expect(T().dakika('çeyrek saat')).toBe(15);
  });
  it('eski biçimler aynen', () => {
    expect(T().dakika('45 dk')).toBe(45);
    expect(T().dakika('2,5 saat')).toBe(150);
    expect(T().dakika('90 dakika')).toBe(90);
    expect(T().dakika('iki saat')).toBe(120);
  });
  it('süre olmayan şey null; kelimenin içindeki sayı okunmaz', () => {
    expect(T().dakika('onay verdim')).toBe(null);
    expect(T().dakika('40 soru')).toBe(null);
    expect(T().dakika('5 sayfa')).toBe(null);
    expect(T().dakika('birlikte koştuk 30 dk')).toBe(30);
  });
  it('birim: saatle mi dakikayla mı söylendi', () => {
    expect(T().sure('yarım saat').birim).toBe('saat');
    expect(T().sure('1 saat 20 dk').birim).toBe('saat');
    expect(T().sure('30 dk').birim).toBe('dk');
  });
  it('yer bilgisi: eşleşen parça çıkarılabilir', () => {
    const s = T().sure('bugün 1 saat 20 dk koştum');
    expect('bugün 1 saat 20 dk koştum'.slice(s.bas, s.son)).toBe('1 saat 20 dk');
  });
});

describe('Türkçe sayı ve süre — miktar', () => {
  it('buçuklu, yazıyla ve kesirli miktar', () => {
    expect(T().miktar('1 buçuk porsiyon').sayi).toBe(1.5);
    expect(T().miktar('iki buçuk tabak').sayi).toBe(2.5);
    expect(T().miktar('yarım ekmek').sayi).toBe(0.5);
    expect(T().miktar('çeyrek').sayi).toBe(0.25);
    expect(T().miktar('1,5 kase').sayi).toBe(1.5);
  });
  it('miktar yoksa null', () => {
    expect(T().miktar('yumurta')).toBe(null);
  });
});
})();
