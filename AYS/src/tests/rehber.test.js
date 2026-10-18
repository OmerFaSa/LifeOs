/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/rehber.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Rehber — SPİ ve ESP konu anlatımları (brand/ortak/rehber.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/rehber.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kullanıcı (2026-10-18): «SPİ'ye anlatım yükle: spor, kilo, kalori, diyet,
   koşu, yürüyüş, kalistenik, sağlıklı beslenme; ESP'de her alanın kendisiyle
   alakalı orta seviye bir anlatım».

   Kanıtlanan sözler:
     1. Metin önce kaçırılır, sonra **kalın**, x^{2}, H_{2}O açılır (iç içe
        süslü parantez dahil); başka HTML geçmez.
     2. Liste alanlara göre gruplanır; okunan konu işaretlidir.
     3. Konu sayfası: kazanım, numaralı bölümler, çözümü KAPALI örnek,
        dikkat, akılda kalsın, kaynak ve modülün sınır notu; «elle yazıldı
        · doğrulanmadı» damgası.
     4. «Okudum» bu cihazda kalıcıdır; bilinmeyen konu listeye döner.
     5. Biçim denetimi: her konuda giriş, 2–6 bölüm, en az bir örnek ya da
        dikkat, en az bir kaynak. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const RB = () => window.LIFEOS.REHBER;
  const KONULAR = [
    { id:'k1', alan:'Hareket', ad:'Yürüyüş', sure:6, giris:'Yürüyüş en erişilebilir harekettir.',
      kazanim:['Tempoyu ayırt eder.'],
      bolumler:[{ baslik:'Tempo', metin:'Konuşabiliyor ama şarkı söyleyemiyorsan **orta** tempodasın.', liste:['Hafif', 'Orta'],
        ornek:{ soru:'30 dk × 5 gün kaç dakika eder?', cozum:['30 × 5 = 150 dakika.'] }, dikkat:'Ağrı varsa dur.' },
        { baslik:'Su', metin:'H_{2}O ve 2^{x^{2}} gibi işaretler açılır.' }],
      akilda:['Az ama düzenli.'], kaynaklar:['DSÖ 2020 kılavuzu'] },
    { id:'k2', alan:'Beslenme', ad:'Kalori', sure:8, giris:'Enerji dengesi alınan ve harcanan enerjinin farkıdır.',
      bolumler:[{ baslik:'A', metin:'a', dikkat:'d' }, { baslik:'B', metin:'b' }], kaynaklar:['K'] },
  ];
  function sahne(){
    const depo = {};
    RB()._sifirla();
    RB().kur({ modul:'test', konular:() => KONULAR, sinir:'Bu genel bilgidir; teşhis ya da kişisel program değildir.',
      depo:{ oku:k => depo[k] || null, yaz:(k, v) => { depo[k] = v; } } });
    return depo;
  }

  describe('Rehber — konu anlatımı', () => {
    it('metin kaçırılır; kalın, üst ve alt simge (iç içe) açılır', () => {
      const h = RB().metinHtml('<b>x</b> **güçlü** H_{2}O 2^{x^{2}}');
      expect(h).toContain('&lt;b&gt;x&lt;/b&gt;');
      expect(h).toContain('<strong>güçlü</strong>');
      expect(h).toContain('H<sub>2</sub>O');
      expect(h).toContain('2<sup>x<sup>2</sup></sup>');
    });
    it('liste alanlara göre gruplanır; okunan işaretlenir', () => {
      sahne();
      let h = RB().listeHtml();
      expect(h.indexOf('Hareket') < h.indexOf('Beslenme')).toBeTruthy();
      expect(h).toContain('data-rehber="ac:k1"');
      expect(h.indexOf('rehber__okundu') < 0).toBeTruthy();
      RB().okudum('k1');
      h = RB().listeHtml();
      expect(h).toContain('rehber__okundu');
    });
    it('konu sayfası: kazanım, numaralı bölüm, kapalı çözüm, dikkat, akılda kalsın, kaynak, sınır, damga', () => {
      sahne();
      const h = RB().konuHtml('k1');
      ['Bu konunun sonunda', 'Tempoyu ayırt eder.', 'rehber__no', '<details', 'Çözümü göster', '30 × 5 = 150 dakika.',
        'Dikkat', 'Akılda kalsın', 'DSÖ 2020 kılavuzu', 'teşhis ya da kişisel program değildir', 'elle yazıldı · doğrulanmadı', '6 dk']
        .forEach(x => expect(h).toContain(x));
      expect(h.indexOf('<details open') < 0).toBeTruthy();         // çözüm kapalı başlar
      expect(h).toContain('data-rehber="sonraki"');
    });
    it('«Okudum» kalıcıdır; bilinmeyen konu listeye döner; seçim ve geri', () => {
      const depo = sahne();
      RB().okudum('k2');
      expect(JSON.stringify(depo)).toContain('k2');
      RB()._sifirla();
      RB().kur({ modul:'test', konular:() => KONULAR, depo:{ oku:k => depo[k] || null, yaz:(k, v) => { depo[k] = v; } } });
      expect(RB().okunduMu('k2')).toBe(true);
      RB().sec('yok');
      expect(RB().html()).toContain('rehber__liste');
      RB().sec('k2');
      expect(RB().html()).toContain('rehber__konu');
      RB().sec(null);
      expect(RB().html()).toContain('rehber__liste');
    });
    it('alan kartı: yalnız o alanın konuları; satır konuyu seçip okuyucuya götürür', () => {
      const depo = {};
      RB()._sifirla();
      let gidildi = 0;
      RB().kur({ modul:'test', konular:() => [Object.assign({ disc:'lang' }, KONULAR[0]), Object.assign({ disc:'philo' }, KONULAR[1])],
        depo:{ oku:k => depo[k] || null, yaz:(k, v) => { depo[k] = v; } }, git:() => { gidildi++; } });
      const h = RB().alanHtml(['lang']);
      expect(h).toContain('Yürüyüş');
      expect(h.indexOf('Kalori') < 0).toBeTruthy();
      expect(RB().alanHtml(['music'])).toBe('');
      const kap = document.createElement('div');
      kap.innerHTML = h;
      document.body.appendChild(kap);
      try{
        kap.querySelector('[data-rehber="git:k1"]').click();
        expect(RB().secili()).toBe('k1');
        expect(gidildi).toBe(1);
      }finally{ kap.remove(); RB()._sifirla(); }
    });
    it('biçim denetimi: eksik konu yakalanır', () => {
      expect(RB().denetle(KONULAR)).toEqual([]);
      const h = RB().denetle([{ id:'x', alan:'A', ad:'X', giris:'', bolumler:[{ baslik:'a', metin:'b' }], kaynaklar:[] }]);
      expect(h.length >= 3).toBeTruthy();
    });
  });
})();
