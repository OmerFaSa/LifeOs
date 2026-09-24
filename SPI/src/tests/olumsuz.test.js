/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/olumsuz.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Olumsuzluk ve kip süzgeci (brand/ortak/olumsuz.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/olumsuz.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler (ekip/HATALAR.md KR-1): olumsuz, ileriye dönük,
   istek, soru ya da belirsiz bir cümle ölçüm diye yazılmaz; olumsuz bir
   istek tersine çevrilmez; komutun KENDİSİ olan olumsuz söz («bugün
   çalışmayacağım») komut olarak kalır; «bacak», «komedi», «tamam» gibi
   kelimeler olumsuz sayılmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const O = () => window.LIFEOS.Olumsuz;

  describe('Olumsuzluk süzgeci — ölçüm', () => {
    it('olumlu, geçmiş zamanlı ölçüm cümlesi geçer', () => {
      ['bugün 40 soru çözdüm', '7 saat uyudum', 'dün 30 dakika yürüdüm', '2 bardak su içtim',
        'matematikten 25 soru çözdüm 20 doğru', 'tamam 40 soru çözdüm', 'bacak antrenmanı 45 dakika',
        'şimdi 8 saat uyudum', 'komedi izledim 2 saat', 'öğleden sonra 2 saat uyudum', 'uyku 7,5 saat',
        'nabız 58', '3 saat çalıştım', 'Bugün 40 Soru Çözdüm', 'yemekten sonra 20 dakika yürüdüm',
        'ocak ayında 3 saat uyudum', 'paragraf 20', '45 dakika yürüdüm']
        .forEach(m => expect([m, O().olcumEngeli(m)]).toEqual([m, null]));
    });

    it('olumsuz cümle ölçüm değildir; kelime cümledeki biçimiyle döner', () => {
      [['bugün 40 soru çözmedim', 'çözmedim'], ['7 saat uyumadım', 'uyumadım'],
        ['40 soru çözemedim', 'çözemedim'], ['7 saat uyuyamadım', 'uyuyamadım'],
        ['30 dakika yürümedim', 'yürümedim'], ['2 bardak su içmedim', 'içmedim'],
        ['40 soru çözmüyorum', 'çözmüyorum'], ['40 soru çözmemişim', 'çözmemişim'],
        ['7 değil 8 saat uyudum', 'değil'], ['bugün paragraf yok', 'yok'],
        ['BUGÜN 40 SORU ÇÖZMEDİM', 'çözmedim'], ['40 soru çözmem', 'çözmem'],
        ['hayır 8 saat uyudum', 'hayır'], ['20 dakika yürüyemedik', 'yürüyemedik']]
        .forEach(([m, k]) => {
          const e = O().olcumEngeli(m);
          expect([m, e && e.neden, e && e.kelime]).toEqual([m, 'olumsuz', k]);
          expect(e.soru).toContain('«' + k + '»');
          expect(e.soru).toContain('ölçüm');
        });
    });

    it('ileriye dönük, istek, soru ve belirsiz cümle ölçüm değildir', () => {
      [['yarın 40 soru çözeceğim', 'gelecek', 'yarın'], ['40 soru çözeceğim', 'gelecek', 'çözeceğim'],
        ['40 soru yapıcam', 'gelecek', 'yapıcam'], ['bu akşam 8 saat uyuyacağım', 'gelecek', 'uyuyacağım'],
        ['8 saat uyumak istiyorum', 'istek', 'istiyorum'], ['40 soru çözmem lazım', 'istek', 'lazım'],
        ['hedefim 8 saat uyku', 'istek', 'hedefim'], ['40 soru çözmeliyim', 'istek', 'çözmeliyim'],
        ['keşke 8 saat uyusam', 'istek', 'keşke'], ['belki 7 saat uyudum', 'belirsiz', 'belki'],
        ['40 soru çözdüm mü', 'soru', ''], ['8 saat uyudum?', 'soru', '']]
        .forEach(([m, n, k]) => {
          const e = O().olcumEngeli(m);
          expect([m, e && e.neden, e && e.kelime]).toEqual([m, n, k]);
          expect(e.soru.length > 20).toBeTruthy();
        });
    });

    it('boş ya da sayı dışı girdi engel değildir', () => {
      expect(O().olcumEngeli('')).toBe(null);
      expect(O().olcumEngeli(null)).toBe(null);
      expect(O().olcumEngeli('123')).toBe(null);
    });
  });

  describe('Olumsuzluk süzgeci — eylem', () => {
    it('olumlu istek geçer; «-mem lazım» bir ihtiyaçtır', () => {
      ['bu hafta ara ver', 'fiziği kapat', 'diksiyonu kapat', 'yazmayı kapat', 'okuma bölümünü aç',
        'günde 4 saat çalışacağım', 'bu hafta ara vermem lazım', 'gitarı tekrar açmak istiyorum',
        'fiziği kapatır mısın', 'sakin bir hafta olsun ara ver', 'günlük taban 45 dakika olsun',
        'bu haftanın soru hedefi 600 olsun']
        .forEach(m => expect([m, O().eylemEngeli(m)]).toEqual([m, null]));
    });

    it('olumsuz istek tersine çevrilmez', () => {
      [['bu hafta ara vermek istemiyorum', 'istemiyorum'], ['diksiyonu kapatma', 'kapatma'],
        ['diksiyonu kapatma lütfen', 'kapatma'], ['bu hafta ara verme', 'verme'],
        ['sakın fiziği kapat', 'sakın'], ['yarın ara vermeyeceğim', 'vermeyeceğim'],
        ['fiziği kapatmayın', 'kapatmayın'], ['bu hafta ara vermem', 'vermem'],
        ['günde 4 saat çalışmak istemiyorum', 'istemiyorum'], ['telafi kapansın istemem', 'istemem'],
        ['gizlensin değil', 'değil']]
        .forEach(([m, k]) => {
          const e = O().eylemEngeli(m);
          expect([m, e && e.neden, e && e.kelime]).toEqual([m, 'olumsuz', k]);
          expect(e.soru).toContain('olumlu');
        });
    });

    it('komutun kendisi olan olumsuz söz hariç tutulur, geri kalanına bakılır', () => {
      const ara = /(çalışmayacağım|çalışmıyorum|çalışamam)/;
      expect(O().eylemEngeli('bugün çalışmayacağım', { haric:ara })).toBe(null);
      expect(O().eylemEngeli('yarın çalışamam', { haric:ara })).toBe(null);
      expect(O().eylemEngeli('bugün çalışmayacağım demedim', { haric:ara }).kelime).toBe('demedim');
      expect(O().eylemEngeli('fiziği istemiyorum', { haric:['istemiyorum'] })).toBe(null);
      expect(O().eylemEngeli('diksiyon istemiyorum demedim', { haric:['istemiyorum'] }).kelime)
        .toBe('demedim');
      /* hariç tutma yalnız bütün kelimeyi siler: «istemiyorum» «istemiyorumdur» değildir */
      expect(O().eylemEngeli('istemiyorumdur', { haric:['istemiyorum'] })).toBeTruthy();
    });

    it('katlama uzunluğu değiştirmez', () => {
      const s = 'çalışmayacağım öğün şişe';
      expect(O().katla(s).length).toBe(s.length);
      expect(O().katla(s)).toBe('calismayacagim ogun sise');
    });
  });
})();
