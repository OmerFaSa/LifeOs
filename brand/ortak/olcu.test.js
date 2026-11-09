/* Ölçü soruları (brand/ortak/olcu.js, King 5 tur 5): sayıyı kod üretir; kayıtsız gün sıfır değildir. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const O = () => window.LIFEOS.OLCU;
  const BUGUN = '2026-11-08';   // pazar
  function kur(){
    const soru = { '2026-11-03':40, '2026-11-04':60, '2026-11-08':20, '2026-10-28':30 };
    const kilo = { '2026-10-12':74.6, '2026-10-30':73.8, '2026-11-07':73.1 };
    O().kur({ modul:'deneme', olculer:[
      { id:'kalan', ad:'sınava kalan gün', es:/kaç gün kaldı/, tur:'anlik', anlik:() => ({ v:223, metin:'Sınava 223 gün kaldı.' }) },
      { id:'net', ad:'net', birim:'net', es:/\bnet/, tur:'olay', alt:[['Matematik', /matematik/]],
        olaylar:alt => [{ t:'2026-10-04', v:alt ? 18 : 60 }, { t:'2026-10-18', v:alt ? 20 : 64.5 }, { t:'2026-11-01', v:alt ? 23.25 : 70 }] },
      { id:'soru', ad:'çözülen soru', birim:'soru', es:/soru/, tur:'toplam', gun:g => soru[g] == null ? null : soru[g] },
      { id:'kilo', ad:'kilo', birim:'kg', es:/kilo/, tur:'son', ondalik:true, gun:g => kilo[g] == null ? null : kilo[g] },
    ] });
  }
  describe('Ölçü soruları (King 5 tur 5)', () => {
    it('dönem: bu hafta pazartesiden bugüne, geçen hafta, son N gün, son N deneme', () => {
      expect(O().donem('bu hafta kaç soru', BUGUN)).toEqual({ bas:'2026-11-02', son:'2026-11-08', ad:'bu hafta' });
      expect(O().donem('geçen hafta', BUGUN)).toEqual({ bas:'2026-10-26', son:'2026-11-01', ad:'geçen hafta' });
      expect(O().donem('son 3 gün', BUGUN).bas).toBe('2026-11-06');
      expect(O().donem('son 5 denemede', BUGUN).adet).toBe(5);
    });
    it('toplam kayıtlı günlerden; kayıtsız gün sıfır sayılmaz ve söylenir', () => {
      kur();
      try{
        const r = O().coz('bu hafta kaç soru çözdüm', BUGUN);
        expect(r.cevap).toBe('Bu hafta çözülen soru: 120 soru (3 günde kayıt var).');
        expect(O().coz('dün kaç soru çözdüm', BUGUN).cevap).toContain('kaydı yok');
        /* Kayıt cümlesi soru değildir: King onu veri olarak okur. */
        expect(O().coz('bugün 40 soru çözdüm', BUGUN)).toBe(null);
      }finally{ O()._sifirla(); }
    });
    it('King-Bench tur 6: özel anlık ölçü genel kapılara (hedef, «hangi») takılmaz ve önce seçilir', () => {
      O().kur({ modul:'esp', olculer:[
        { id:'genel', genel:true, ad:'çalışma', birim:'dk', es:/çalış|zaman/, tur:'toplam', gun:() => 10 },
        { id:'hedef', ozel:true, ad:'hedef', es:/hedef\w*.*yüzde/, tur:'anlik', anlik:() => ({ v:40, metin:'Hedefin %40 tamam.' }) },
        { id:'dagilim', ozel:true, ad:'dağılım', es:/zaman\w*.*en çok/, tur:'anlik', anlik:() => ({ v:1, metin:'En çok gitar.' }) },
      ] });
      try{
        expect(O().coz('hedefimin yüzde kaçını tamamladım', BUGUN).cevap).toContain('%40');
        expect(O().coz('zamanımı en çok hangi işe harcıyorum', BUGUN).cevap).toContain('gitar');
      }finally{ O()._sifirla(); }
    });
    it('King-Bench koçluk/içgörü: haftalık değerlendirme aynı günleri kıyaslar; «neden düştü» gün ve tempoya ayrılır', () => {
      const B = '2026-11-12';   // perşembe: bu hafta 4 gün
      const g = n => { const d = new Date(B + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      const soru = {}, uyku = {};
      [0, -1, -2, -3].forEach(n => { soru[g(n)] = 30; uyku[g(n)] = 7; });        // bu hafta: 120 soru
      [-7, -8, -9, -10].forEach(n => { soru[g(n)] = 45; uyku[g(n)] = 7; });      // geçen hafta aynı günler: 180
      soru[g(-4)] = 999;                                                        // geçen haftanın cuması: aynı günlere girmez
      ['2026-10-02', '2026-10-09', '2026-10-16'].forEach(x => { soru[x] = 50; });                       // ekim: 3 gün × 50
      ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07'].forEach(x => { soru[x] = 50; });   // eylül: 6 gün × 50
      O().kur({ modul:'ays', olculer:[
        { id:'soru', ad:'çözülen soru', birim:'soru', es:/soru/, tur:'toplam', gun:x => soru[x] == null ? null : soru[x] },
        { id:'uyku', ad:'uyku', birim:'saat', es:/uyku/, tur:'ortalama', ondalik:true, gun:x => uyku[x] == null ? null : uyku[x] },
      ] });
      try{
        const h = O().coz('bu haftamı değerlendir', B);
        expect(h.id).toBe('hafta');
        expect(h.cevap).toContain('aksayan çözülen soru (−%33)');
        expect(h.cevap).toContain('kalan 3 günde günde yaklaşık 20 soru');
        const n = O().coz('ekimde neden daha az soru çözdüm', '2026-11-12');
        expect(n.cevap).toContain('150 soru (3 kayıtlı gün');
        expect(n.cevap).toContain('kayıtlı gün sayısından: 3 gün daha az');
        expect(O().coz('neden yazdın bunu', B)).toBe(null);
      }finally{ O()._sifirla(); }
    });
    it('değişim: kilo dönemin ilk ve son ölçümü; net olayları ve alt kırılım', () => {
      kur();
      try{
        expect(O().coz('kilom son bir ayda nasıl değişti', BUGUN).cevap).toBe('Son 1 ay kilo 74,6 → 73,1 kg (-1,5 kg, 3 ölçüm).');
        expect(O().coz('TYT net ortalamam kaç', BUGUN).cevap).toContain('ortalaman 64,83 net (3 deneme)');
        expect(O().coz('matematik netim son 2 denemede nasıl değişti', BUGUN).cevap).toContain('20 → 23,25 net (+3,25)');
        expect(O().coz('sınava kaç gün kaldı', BUGUN).cevap).toBe('Sınava 223 gün kaldı.');
        expect(O().coz('bu hafta soru sayım geçen haftaya göre arttı mı', BUGUN).cevap).toContain('geçen hafta 30 soru. Arttı (+90)');
        /* Ay adı: «ekim ayında», «ekimde eylüle göre» (aşama 3: son 7 gün sanılıyordu). */
        expect(O().donem('ekim ayında kaç soru çözdüm', BUGUN)).toEqual({ bas:'2026-10-01', son:'2026-10-31', ad:'ekim' });
        expect(O().coz('ekimde eylüle göre daha çok mu soru çözdüm', BUGUN).cevap).toContain('Karşılaştıracak eylül ayında kayıt yok');
        /* Dönem özeti (aşama 3): modülün ölçüleri tek cevapta. */
        const oz = O().coz('bu ay genel olarak nasıldım', BUGUN);
        expect(oz.id).toBe('ozet');
        expect(oz.satirlar.join(' | ')).toContain('Çözülen soru: 120 soru (3 gün)');
        expect(oz.satirlar.join(' | ')).toContain('net: 1 deneme, 70 → 70');
      }finally{ O()._sifirla(); }
    });
  });
})();
