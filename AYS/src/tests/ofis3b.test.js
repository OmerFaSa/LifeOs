/* 3B ofis (js/core/ofis3b.js + ofis3d/sahne.js). Kanitladigi sozler:
   istege baglidir (hafif gorunum, WebGL yok, dosya yok -> CSS odasi);
   otomasyonda kendiliginden acilmaz; olay kuyrugu tekrar etmez, tasmaz,
   kendine teslim etmez; gercek olay (oneri) uzmani Patron'a yurutur;
   sahne yoksa toplanti beklemeden acilir; sahne gercekten yuklenir,
   gorev kabul eder ve mesgulken ikinciyi reddeder. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const Z = () => R.Ofis3B;

  function sifirla(){
    resetState();
    R.S.office = null;
    const d = Z()._durum;
    d.kuyruk.length = 0; d.gorulen = {}; d.gun = null; d.istendi = false;
    d.hata = null;
  }

  async function cizmeden(fn){
    const A = R.App, r = A.render, g = A.go;
    A.render = async () => {}; A.go = () => {};
    try{ return await fn(); }finally{ A.render = r; A.go = g; }
  }

  describe('3B ofis — ne zaman açılır', () => {
    /* Test tarayıcısında WebGL yazılımla da olsa VARDIR; yoksa aşağıdaki
       sahne ölçümleri hiçbir şey ölçmez ve bu sessizce geçmemeli. */
    it('test ortamında WebGL var (ölçüm boşa geçmesin)', () => {
      expect(Z().destek()).toBe(true);
    });

    it('otomasyonda kendiliğinden açılmaz; açıkça istenince açılır', () => {
      sifirla();
      expect(navigator.webdriver).toBe(true);
      expect(Z().kullanilir()).toBe(false);
      Z().ac();
      expect(Z().kullanilir()).toBe(true);
    });

    it('hafif görünüm seçiliyse ya da yükleme hata verdiyse CSS odası kalır', async () => {
      sifirla();
      Z().ac();
      await R.Office.saveSettings({ sahne3b:'hafif' });
      expect(Z().kullanilir()).toBe(false);
      await R.Office.saveSettings({ sahne3b:'canli' });
      Z()._durum.hata = 'dosya yok';
      expect(Z().kullanilir()).toBe(false);
    });

    it('ekran: canlıda yuva ve masa düğmeleri, hatada not ve CSS odası', async () => {
      sifirla();
      Z().ac();
      const canli = String(await R.Screens.office.render());
      expect(canli.includes('id="ofis3b-yuva"')).toBe(true);
      expect(canli.includes('ofis3b-masalar')).toBe(true);
      Z()._durum.hata = 'Canlı 3B ofis dosyaları bulunamadı (ofis3d/); hafif görünüm gösteriliyor.';
      const hafif = String(await R.Screens.office.render());
      expect(hafif.includes('id="ofis3b-yuva"')).toBe(false);
      expect(hafif.includes('id="room3d"')).toBe(true);
      expect(hafif.includes('hafif görünüm gösteriliyor')).toBe(true);
    });
  });

  describe('3B ofis — olay kuyruğu', () => {
    it('aynı olay günde bir kez; kuyruk en çok üç; kendine teslim yok', () => {
      sifirla();
      const e = Z()._ekle;
      expect(e({ tur:'deliver', kim:0, kime:4, anahtar:'not:a' })).toBe(true);
      expect(e({ tur:'deliver', kim:0, kime:4, anahtar:'not:a' })).toBe(false);
      expect(e({ tur:'deliver', kim:2, kime:2, anahtar:'x' })).toBe(false);
      expect(e({ tur:'deliver', kim:1, kime:4, anahtar:'not:b' })).toBe(true);
      expect(e({ tur:'break', kim:5, anahtar:'hak:koc' })).toBe(true);
      expect(e({ tur:'deliver', kim:3, kime:4, anahtar:'not:c' })).toBe(false);   // dolu
      expect(Z()._durum.kuyruk.length).toBe(3);
    });

    it('gelen öneri, onu yazan uzmanı Patron’a yürütür; Patron’un kendi önerisi yürümez', () => {
      sifirla();
      const n = Z().oneriler([{ id:'p1', agent:'tyt' }, { id:'p2', agent:'patron' }, { id:'p3', agent:'koc' }]);
      expect(n).toBe(2);
      const k = Z()._durum.kuyruk;
      expect(k.map(o => [o.kim, o.kime])).toEqual([[Z().SIRA.indexOf('tyt'), 4], [Z().SIRA.indexOf('koc'), 4]]);
      expect(Z().SIRA[4]).toBe('patron');
      expect(k[0].metin.includes('Tuna')).toBe(true);
    });

    it('sahne yoksa toplantı beklemeden açılır', () => {
      sifirla();
      let gitti = 0;
      const r = Z().toplantiyaGotur(() => { gitti++; });
      expect([r, gitti]).toEqual([false, 1]);
    });
  });

  describe('3B ofis — gerçek sahne', () => {
    it('yüklenir, AYS adlarıyla kurulur, görevi kabul eder, meşgulken reddeder', async () => {
      sifirla();
      Z()._kok('../ofis3d/');
      await Z().yukle();
      expect(typeof window.RotaOfis3B.kur).toBe('function');
      const kok = document.createElement('div');
      kok.innerHTML = '<div class="office-view" style="width:320px;height:200px"></div>'
        + '<p data-status></p><button data-meeting></button><button data-night></button>'
        + '<button data-view="angle"></button><button data-view="top"></button><button data-boss></button>'
        + '<button data-area="archive"></button><button data-area="phone"></button><button data-area="meeting"></button>'
        + '<button data-motion></button><input type="checkbox" data-call><input type="checkbox" data-walls>'
        + '<input type="checkbox" data-auto><input type="checkbox" data-follow>'
        + '<select data-actor><option value="0">a</option></select><select data-job><option value="deliver">d</option></select>'
        + '<select data-recipient><option value="1">b</option></select><select data-speed><option value="1">1</option></select>'
        + '<button data-run></button>';
      document.body.appendChild(kok);
      try{
        const api = window.RotaOfis3B.kur(kok, { adlar:['Tuna', 'Yaman', 'Rana', 'Deniz', 'Patron', 'Kerem'] });
        expect(api.ok).toBe(true);
        expect(api.gorev('deliver', 0, 4)).toBe(true);
        expect(api.mesgul()).toBe(true);
        expect(api.gorev('break', 1, 0)).toBe(false);
        expect(api.durum().gorev.temsili).toBe(false);
        expect(api.gorev('deliver', 2, 2)).toBe(false);
        expect(api.toplanti(true)).toBe(false);          // görev sürerken toplantı yok
      }finally{
        kok.remove();                                    // döngü kendiliğinden durur
      }
    });
  });
})();
