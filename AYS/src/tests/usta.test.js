/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/usta.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Ustalık çekirdeği (brand/ortak/usta.js) — üç arayüzde aynı test.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/usta.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const U = () => window.LIFEOS.USTA;
  const d = (g, isabet, ek) => Object.assign({ g, isabet }, ek || {});

describe('Ustalık çekirdeği — aşama', () => {
  it('kanıt yoksa veri yok; sıfır ya da öğreniyor değil', () => {
    const a = U().asama([], '2026-11-05');
    expect(a.id).toBe('yok');
    expect(a.etiket).toBe('veri yok');
    expect(a.sonraki).toBe(null);
    expect(U().asama(null, '2026-11-05').id).toBe('yok');
  });
  it('yalnız yanlış öğreniyor; bir doğru tutuyor ve yarına vade', () => {
    expect(U().asama([d('2026-11-01', false)]).id).toBe('ogreniyor');
    const a = U().asama([d('2026-11-01', true)]);
    expect(a.id).toBe('tutuyor');
    expect(a.sonraki).toBe('2026-11-02');
  });
  it('aynı gün art arda doğru kalıcı yapmaz; 7 gün ara yapar', () => {
    expect(U().asama([d('2026-11-01', true), d('2026-11-01', true), d('2026-11-01', true)]).enUzun).toBe(0);
    const a = U().asama([d('2026-10-01', true), d('2026-10-08', true)]);
    expect(a.id).toBe('kalici');
    expect(a.sonraki).toBe('2026-10-29');
  });
  it('sağlam için 21 gün ara VE karışık sınama gerekir', () => {
    const uzun = [d('2026-08-01', true), d('2026-08-25', true)];
    expect(U().asama(uzun).id).toBe('kalici');
    const a = U().asama([d('2026-08-01', true), d('2026-08-25', true, { karisik:true })]);
    expect(a.id).toBe('saglam');
    expect(a.sonraki).toBe('2026-10-24');
  });
  it('yanlış zinciri keser: sağlam bile yeniden öğreniyor olur', () => {
    const k = [d('2026-08-01', true), d('2026-08-25', true, { karisik:true }), d('2026-10-01', false)];
    const a = U().asama(k);
    expect(a.id).toBe('ogreniyor');
    expect(a.enUzun).toBe(0);
    expect(U().asama(k.concat([d('2026-10-02', true)])).id).toBe('tutuyor');
  });
  it('ipuçlu cevap aşama kazandırmaz ve kırmaz', () => {
    expect(U().asama([d('2026-11-01', true, { ipucu:true })]).id).toBe('ogreniyor');
    expect(U().asama([d('2026-10-01', true), d('2026-10-08', true), d('2026-10-09', false, { ipucu:true })]).id).toBe('kalici');
  });
  it('emin olup yanılmak kritiktir; sonraki doğru kaldırır', () => {
    expect(U().asama([d('2026-11-01', false, { guven:'emin' })]).kritik).toBe(true);
    expect(U().asama([d('2026-11-01', false, { guven:'tahmin' })]).kritik).toBe(false);
    expect(U().asama([d('2026-11-01', false, { guven:'emin' }), d('2026-11-02', true)]).kritik).toBe(false);
  });
  it('sıra karışık girse de tarihe göre okunur; geciken gün sayılır', () => {
    const a = U().asama([d('2026-10-08', true), d('2026-10-01', true)], '2026-11-01');
    expect(a.id).toBe('kalici');
    expect(a.gecikti).toBe(3);
  });
  it('bozuk kanıt düşer', () => {
    expect(U().asama([null, { g:'2026-11-01' }, { isabet:true }]).id).toBe('yok');
  });
});

describe('Ustalık çekirdeği — kalibrasyon, sıra, harita', () => {
  it('az kanıtta oran yok; işaretsiz cevap oranı etkilemez', () => {
    const on = []; for(let i = 0; i < 10; i++) on.push(d('2026-11-01', i < 7, { guven:'emin' }));
    on.push(d('2026-11-01', false));
    const k = U().kalibrasyon(on);
    expect(k.emin.n).toBe(10);
    expect(Math.round(k.emin.oran * 100)).toBe(70);
    expect(k.tahmin.oran).toBe(null);
  });
  it('sıra: kritik, vadesi geçen, öğreniyor, yeni; vadesi gelmeyen yok', () => {
    const b = [
      { id:'yeni', kanitlar:[] },
      { id:'erken', kanitlar:[d('2026-11-05', true)] },
      { id:'ogr', kanitlar:[d('2026-11-01', false)] },
      { id:'vade', kanitlar:[d('2026-10-01', true)] },
      { id:'krit', kanitlar:[d('2026-11-04', false, { guven:'emin' })] },
    ];
    expect(U().sira(b, '2026-11-05').map(x => x.id).join()).toBe('krit,vade,ogr,yeni');
    expect(U().sira(b, '2026-11-05', 2).length).toBe(2);
  });
  it('aynı grup yan yana gelmez; tek grup kaldıysa düşmez', () => {
    const y = (id, grup) => ({ id, grup, kanitlar:[] });
    expect(U().sira([y('a', 'mat'), y('b', 'mat'), y('c', 'tur')], '2026-11-05').map(x => x.id).join()).toBe('a,c,b');
    expect(U().sira([y('a', 'mat'), y('b', 'mat')], '2026-11-05').length).toBe(2);
  });
  it('harita ölçülmeyeni ayrı sayar', () => {
    const h = U().harita([{ id:'a', kanitlar:[] }, { id:'b', kanitlar:[d('2026-11-01', true)] }], '2026-11-05');
    expect(h.toplam).toBe(2);
    expect(h.olculen).toBe(1);
    expect(h.sayi.yok).toBe(1);
    expect(h.gecikti).toBe(1);
  });
});
})();
