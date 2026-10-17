/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/cikarim.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Çıkarım (brand/ortak/cikarim.js) — KISI-PLANI Faz 3.
   Kanıtlanan sözler: ölçülenden ve kanıtıyla; eşiğin altında susar;
   sorulmuş olan bir daha çıkmaz; dil yargısız; Türkçe ekler doğru. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const C = () => window.LIFEOS.CIKARIM;
  const VERI = () => ({
    esp:{ disiplin:{ gun:12, dakika:{ philo:500, lang:200 }, adlar:{ philo:'Felsefe' } },
      kitaplar:[1, 2, 3, 4].map(i => ({ startedAt:'2026-09-01', finishedAt:i < 4 ? '2026-09-20' : null, author:i < 4 ? 'Dostoyevski' : 'Camus' })),
      muzikGun:11 },
    ays:{ dersler:[{ id:'mat', ad:'Matematik', solved:400, correct:300 }, { id:'fiz', ad:'Fizik', solved:150, correct:130 }] },
    spi:{ yatis:Array(12).fill(25.2), yemekKat:{ tatli:8, et:12, sebze:10 }, katAd:{ tatli:'Tatlı ve atıştırmalık' }, antrenman30:9 },
  });

  describe('Çıkarım — kurallar', () => {
    it('ölçülenden ve kanıtıyla; her biri bir alana', () => {
      const l = C().uret(VERI(), {});
      const id = l.map(a => a.id);
      ['esp-disiplin:philo', 'esp-kitap:bitiren', 'esp-yazar:dostoyevski', 'esp-muzik:duzenli', 'ays-isabet:fiz',
        'spi-kronotip:gece', 'spi-yemek:tatli', 'spi-hareket:duzenli'].forEach(x => expect(id.indexOf(x) >= 0).toBe(true));
      l.forEach(a => { expect(!!(a.kanit && a.alan && a.kayit)).toBe(true); expect(window.LIFEOS.KISI.BY_ID[a.alan] != null).toBe(true); });
    });
    it('yeni kaynaklar: zorlayan ders, hata tipi, deneme gidişi, uyku süresi, his–uyku, kahve, çok yönlülük', () => {
      const v = {
        ays:{ dersler:[{ id:'mat', ad:'Matematik', solved:100, correct:50 }, { id:'tr', ad:'Türkçe', solved:100, correct:85 }],
          hatalar:{ D:{ ad:'Dikkat', n:6 }, K:{ ad:'Konu eksiği', n:3 } }, denemeNet:[40, 41, 46, 48] },
        spi:{ uyku:[5.5, 6, 6, 5.8, 6.1, 6], hisUyku:[{ uyku:8, his:5 }, { uyku:8, his:4 }, { uyku:7.5, his:5 }, { uyku:5, his:2 }, { uyku:5.5, his:2 }, { uyku:6, his:3 }], kahveGun:12 },
        esp:{ disiplin:{ gun:6, dakika:{ philo:60, lang:50, music:40, history:30 }, adlar:{} } },
      };
      const id = C().uret(v, {}).map(a => a.id);
      ['ays-zor:mat', 'ays-hata:D', 'ays-gidis:yukari', 'spi-uyku:kisa', 'spi-his-uyku:pozitif', 'spi-kahve:sik', 'esp-cesit:4']
        .forEach(x => expect(id.indexOf(x) >= 0).toBe(true));
    });
    it('eşiğin altında susar', () => {
      expect(C().uret({}, {})).toHaveLength(0);
      const az = { esp:{ disiplin:{ gun:3, dakika:{ philo:500 } }, kitaplar:[{ startedAt:'x', finishedAt:'y', author:'A' }], muzikGun:4 },
        ays:{ dersler:[{ id:'mat', ad:'Matematik', solved:50, correct:40 }] }, spi:{ yatis:[25, 25], yemekKat:{ tatli:5 }, antrenman30:2 } };
      expect(C().uret(az, {})).toHaveLength(0);
    });
    it('sorulmuş olan bir daha çıkmaz', () => {
      const l = C().uret(VERI(), { 'esp-disiplin:philo':'yanlis', 'spi-kronotip:gece':'dogru' });
      expect(l.some(a => a.id === 'esp-disiplin:philo' || a.id === 'spi-kronotip:gece')).toBe(false);
    });
    it('dil yargısız; Türkçe ekler doğru; sayıya ek gelmez', () => {
      const metin = C().uret(VERI(), {}).map(a => a.soru + ' ' + a.kayit).join(' ');
      expect(/teşhis|bağımlı|depresif|yeteneksiz|hastalı/.test(metin)).toBe(false);
      expect(/\d'[a-zçğıöşü]/.test(metin)).toBe(false);          // sayıya ve saate ek gelmez
      expect(['Felsefe', 'Gitar', 'Derin Okuma', 'Tarih', 'Kimya'].map(C().yone)).toEqual(["Felsefe'ye", "Gitar'a", "Derin Okuma'ya", "Tarih'e", "Kimya'ya"]);
    });
    it('cevap okunur; serbest cümle karar sayılmaz', () => {
      expect([C().cevapOku('Evet doğru'), C().cevapOku('kısmen'), C().cevapOku('hiç değil'), C().cevapOku('felsefe değil, tarih')])
        .toEqual(['dogru', 'kismen', 'yanlis', null]);
    });
  });
})();
