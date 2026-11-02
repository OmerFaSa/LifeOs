/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ogret.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Öğretme motoru (brand/ortak/ogret.js) — üç arayüzde aynı test.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ogret.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const O = () => window.LIFEOS.OGRET;
  const bellek = () => { const m = {}; return { getItem:k => (k in m ? m[k] : null), setItem:(k, v) => { m[k] = String(v); }, m }; };

describe('Öğretme motoru — teşhis', () => {
  it('dört tür kuralla; kanıt yoksa null, uydurma yok', () => {
    const t = g => O().teshis(Object.assign({ secilen:'C', dogru:'B' }, g)).tur;
    expect(t({ secilen:'' })).toBe('bilmiyor');
    expect(t({ oncekiDogru:true })).toBe('dikkat');
    expect(t({ secMetin:'-12', dogruMetin:'12' })).toBe('islem');
    expect(t({ secMetin:'x = 8', dogruMetin:'x = 4' })).toBe('islem');
    expect(t({ secMetin:'7', dogruMetin:'4' })).toBe(null);
    expect(t({ secMetin:'30', dogruMetin:'4' })).toBe(null);
    expect(t({ secMetin:'Ankara', dogruMetin:'İzmir', konuYanlis:2 })).toBe('kavram');
    expect(t({ yeni:true })).toBe('bilmiyor');
    expect(t({ etiket:'islem' })).toBe('islem');
    expect(t({ etiket:'uydurma' })).toBe(null);
    expect(O().teshis({ secilen:'B', dogru:'b' }).tur).toBe(null);
    expect(O().teshis({ secilen:'C', dogru:'B' }).neden).toBe('teşhis için veri yetmiyor');
  });
  it('Sokratik satırlar yalnız verilen bilgiden; tür yoksa satır yok', () => {
    const s = O().sokratik({ secilen:'C', dogru:'B', secMetin:'24', dogruMetin:'12', konu:'Türev' });
    expect(s.length).toBe(2);
    expect(s[0]).toContain('işlem hatası');
    expect(s[1]).toContain('«24»');
    expect(O().sokratik({ secilen:'C', dogru:'B' })).toEqual([]);
  });
});

describe('Öğretme motoru — 1/3/7 tekrar', () => {
  it('yanlış yarın; doğrular 3 ve 7 gün; üçüncü doğruda kavram kapanır, silinmez', () => {
    const d = O().depo('t', bellek());
    expect(O().isle(d, 'k', false, '2026-11-02', 'k|0').kayit).toEqual({ n:0, sonraki:'2026-11-03', ogeler:['k|0'], y:1 });
    expect(O().isle(d, 'k', true, '2026-11-03', 'k|1').not).toBe('3 gün sonra bir kez daha soracağım.');
    expect(d.oku().k.sonraki).toBe('2026-11-06');
    expect(O().isle(d, 'k', true, '2026-11-06').not).toBe('7 gün sonra bir kez daha soracağım.');
    const r = O().isle(d, 'k', true, '2026-11-13');
    expect([r.kapandi, r.kayit.bitti, r.kayit.ogeler, r.kayit.y]).toEqual([true, '2026-11-13', ['k|0'], 1]);
    expect(O().isle(d, 'k', true, '2026-11-14').not).toBe('');          // kapalı kavramda doğru: değişmez
    expect(O().vade(d, '2030-01-01')).toEqual([]);
    expect(O().isle(d, 'k', false, '2026-11-14', 'k|2').kayit).toEqual({ n:0, sonraki:'2026-11-15', ogeler:['k|0', 'k|2'], y:2 });   // yanlış yeniden açar
  });
  it('vade sırası ve benzer soru: yanlış yapılan değil, aynı kavramın başkası', () => {
    const d = O().depo('t', bellek());
    d.yaz({ a:{ n:0, sonraki:'2026-11-02' }, b:{ n:1, sonraki:'2026-11-01' }, c:{ n:0, sonraki:'2026-12-01' }, z:{ n:3, bitti:'2026-10-01' } });
    expect(O().vade(d, '2026-11-02').map(x => x.kavram)).toEqual(['b', 'a']);
    expect(O().ozet(d, '2026-11-02')).toEqual({ vade:2, acik:3, kapanan:1 });
    expect(O().benzer(['q0', 'q1', 'q2'], { n:0, ogeler:['q0'] })).toBe('q1');
    expect(O().benzer(['q0', 'q1', 'q2'], { n:1, ogeler:['q0'] })).toBe('q2');
    expect(O().benzer(['q0'], { n:1, ogeler:['q0'] })).toBe('q0');
    expect(O().benzer([], {})).toBe(null);
  });
  it('eski soru kimlikli kayıt kavrama toplanır; ham değer bir kez yedeklenir, kimlik kaybolmaz', () => {
    const ls = bellek(), d = O().depo('ays.king.tekrar', ls);
    const eski = { 's|t|0':{ n:1, sonraki:'2026-11-05' }, 's|t|2':{ n:0, sonraki:'2026-11-03', eski:true }, 's|u|1':{ n:2, sonraki:'2026-11-09' } };
    d.yaz(eski);
    const v = O().tasi(d, k => k.split('|').slice(0, 2).join('|'));
    expect(v['s|t']).toEqual({ n:0, sonraki:'2026-11-03', ogeler:['s|t|0', 's|t|2'] });
    expect(v['s|u']).toEqual({ n:2, sonraki:'2026-11-09', ogeler:['s|u|1'] });
    expect(JSON.parse(ls.getItem('ays.king.tekrar.yedek'))).toEqual(eski);
    expect(O().tasi(d, k => k.split('|').slice(0, 2).join('|'))).toEqual(v);   // ikinci kez: değişmez
    expect(JSON.parse(ls.getItem('ays.king.tekrar.yedek'))).toEqual(eski);
  });
});

describe('Öğretme motoru — eşleştirme, seçenek, araçlar', () => {
  it('konu bulma: başlık, içerme, kelime kökü; boş metin yok', () => {
    const l = [{ ad:'Türev' }, { ad:'Olasılık', es:['ihtimal'] }, { ad:'Mantık Kuralları' }];
    const ad = x => [x.ad].concat(x.es || []);
    expect(O().bul(l, 'türev', ad).ad).toBe('Türev');
    expect(O().bul(l, 'ihtimal hesabı', ad).ad).toBe('Olasılık');
    expect(O().bul(l, 'mantık kuralı', ad).ad).toBe('Mantık Kuralları');
    expect(O().bul(l, 'xy', ad)).toBe(null);
    expect(O().bul(l, 'kuantum', ad)).toBe(null);
  });
  it('seçenek: doğru bir kez, çeldiriciler farklı; yetmezse null', () => {
    const r = O().secenek('köpek', ['kedi', 'köpek', 'kuş', 'kedi', 'at'], { rastgele:() => 0.3 });
    expect(r.sec.length).toBe(4);
    expect(r.sec['ABCD'.indexOf(r.dogru)]).toBe('köpek');
    expect(r.sec.filter(x => x === 'köpek').length).toBe(1);
    expect(O().secenek('köpek', ['kedi', 'köpek'])).toBe(null);
  });
  it('cevap: yanlışta teşhis ve son yanlış; araçlar sayıyı kayıttan verir', async () => {
    const ls = bellek(), a = { tekrar:O().depo('x.t', ls), son:O().depo('x.s', ls), bugun:() => '2026-11-02' };
    const r = O().cevap(a, { id:'k|0', kavram:'k', konu:'Türev', soru:'f(x)=x² ise f\'(3)?', secilen:'C', dogru:'B', secMetin:'-6', dogruMetin:'6', cozum:['2x → 6'] });
    expect([r.isabet, r.teshis.tur, r.not]).toEqual([false, 'islem', 'Yarın bu konudan benzer bir soru soracağım.']);
    const [tk, nd] = O().araclar(Object.assign({}, a, { modul:'ays', ad:k => k === 'k' ? 'Türev' : k, bugun:() => '2026-11-03' }));
    expect([tk.ad, nd.ad, tk.tur, nd.tur]).toEqual(['ays_tekrarlarim', 'ays_neden_yanlis', 'oku', 'oku']);
    const t = tk.calistir({});
    expect([t.sonuc.vadesi_gelen, t.satirlar]).toEqual([[{ konu:'Türev', tekrar:1 }], ['Türev · 1. tekrar']]);
    const n = nd.calistir({});
    expect([n.sonuc.tur, n.sonuc.dogru_cevap, n.cevap]).toEqual(['islem', 'B', undefined]);
    expect(n.satirlar[1]).toBe('Senin cevabın C («-6»), doğrusu B («6»).');
    /* Kayıt kanıtı: tekrarda doğru yapılmış konuda yanlış → dikkat; ikinci yanlış → kavram. */
    O().cevap(a, { id:'m|0', kavram:'m', secilen:'A', dogru:'A' });
    a.tekrar.yaz(Object.assign(a.tekrar.oku(), { m:{ n:1, sonraki:'2026-11-05', y:1 } }));
    expect(O().cevap(a, { id:'m|1', kavram:'m', secilen:'B', dogru:'A' }).teshis.neden).toBe('bu konunun tekrarında 1 kez doğru yapmıştın');
    expect(O().cevap(a, { id:'m|1', kavram:'m', secilen:'B', dogru:'A' }).teshis).toEqual({ tur:'kavram', ad:'kavram yanılgısı', neden:'bu konuda 3 yanlışın var' });
    expect(O().araclar({ modul:'esp', tekrar:O().depo('y.t', ls), son:O().depo('y.s', ls) })[1].calistir({}).cevap).toContain('yanlış bir soru yok');
  });
});
})();
