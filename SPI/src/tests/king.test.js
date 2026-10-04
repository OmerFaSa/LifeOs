/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/king.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* King — her yerden sade sohbet. Tek kaynak `brand/ortak/king.test.js`.

   Kanıtlanan sözler (brand/ortak/king.js):
     1. Hazır cevaplar ve serbest yazı doğru modülün doğru sayfasına götürür
        («Kolay gelsin»); modüller arası geçiş adresle (#king=rota).
     2. Anlaşılmayan istek tahmin edilmez: hiçbir yere götürülmez.
     3. Veri önce önizlenir; kayıt yalnız «Kaydet»le, «Vazgeç» kaydetmez.
     4. Başka modülden gelinen #king= hedefi yalnız katalogdaysa uygulanır.
     5. Ctrl iki kez açar, Esc kapatır; ışık ve baloncuk tek katmandadır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const K = () => window.LIFEOS.KING;

  let yedek = null;
  function sahne(o){
    o = o || {};
    const k = K();
    k._sifirla();
    yedek = yedek || Object.assign({}, k._ortam);
    const giden = [], gidilen = [];
    Object.assign(k._ortam, {
      git:u => giden.push(u),
      zamanla:fn => fn(),
      hash:() => o.hash || '',
      hashSil:() => { giden.push('hash-silindi'); },
      adres:m => ({ ays:'http://127.0.0.1:4173/', spi:'http://127.0.0.1:4183/', esp:'http://127.0.0.1:4193/' })[m],
      simdi:() => new Date(2026, 9, 5, 9, 0),
    });
    k.kur({ modul:o.modul || 'spi', git:(r, ek) => gidilen.push([r, ek || {}]),
      ozet:o.ozet || (() => ['Toparlanma iyi.', 'Uyku 7 sa · 2 öğün']), veri:o.veri });
    return { k, giden, gidilen };
  }
  function birak(){ const k = K(); k._sifirla(); if(yedek) Object.assign(k._ortam, yedek); }
  async function sahneyle(fn){ try{ await fn(); } finally{ birak(); } }

  describe('King — anlama', () => {
    it('kullanıcının örnekleri doğru modüle ve sayfaya gider', () => sahneyle(async () => {
      const { k } = sahne();
      const h = m => { const y = k.yorumla(m); return y.tur === 'git' ? y.hedef.modul + ':' + y.hedef.route : y.tur; };
      expect(h('antrenman yapacağım')).toBe('spi:move');
      expect(h('Besin gireceğim')).toBe('spi:meals');
      expect(h('test çözeceğim')).toBe('ays:solve');
      expect(h('deneme gireceğim')).toBe('ays:exams');
      expect(h('Dil çalışacağım')).toBe('esp:lang');
      expect(h('İngilizce kelime')).toBe('esp:lang');
      expect(h('koşuya çıkıyorum')).toBe('spi:move');
      expect(h('kan testi sonuçlarım')).toBe('spi:labs');
      expect(h('hareket sayfasına git')).toBe('spi:move');
      expect(h('okuma sayfasını aç')).toBe('esp:library');
      expect(h('bugünün özeti')).toBe('ozet');
      expect(h('nasıl gidiyorum')).toBe('ozet');
      expect(h('xyzzy qwerty')).toBe('bilinmiyor');
      expect(h('   ')).toBe('bos');
      expect(k.yorumla('antrenman yapacağım').hedef.ek.sekme).toBe('kuvvet');
      expect(k.yorumla('koşuya çıkıyorum').hedef.ek.sekme).toBe('kardiyo');
    }));

    it('eşit adda bulunulan modülün sayfası seçilir', () => sahneyle(async () => {
      expect(sahne({ modul:'esp' }).k.yorumla('bugün sayfasına git').hedef.modul).toBe('esp');
      expect(sahne({ modul:'ays' }).k.yorumla('bugün sayfasına git').hedef.modul).toBe('ays');
    }));
  });

  describe('King — eylem', () => {
    it('aynı modülde hazır cevap «Kolay gelsin» der ve sayfaya götürür', () => sahneyle(async () => {
      const { k, gidilen } = sahne();
      k.ac();
      k.hazirSec(0);                                     // Antrenman yapacağım
      expect(k.akis().some(m => m.kim === 'king' && /Kolay gelsin/.test(m.metin))).toBe(true);
      expect(gidilen).toEqual([['move', { sekme:'kuvvet' }]]);
      expect(k.acikMi()).toBe(false);
    }));

    it('öteki modüle adresle geçer (#king=rota)', () => sahneyle(async () => {
      const { k, giden, gidilen } = sahne();
      await k.isle('dil çalışacağım');
      expect(giden).toEqual(['http://127.0.0.1:4193/#king=lang']);
      expect(gidilen).toHaveLength(0);
    }));

    it('anlaşılmayan istek hiçbir yere götürmez, ne yapılabildiğini söyler', () => sahneyle(async () => {
      const { k, giden, gidilen } = sahne();
      await k.isle('bilmem ne şey');
      expect(giden.length + gidilen.length).toBe(0);
      expect(k.akis().slice(-1)[0].metin).toContain('anlayamadım');
    }));

    it('özet modülün kendi satırlarını söyler', () => sahneyle(async () => {
      const { k } = sahne();
      await k.isle('bugünün özeti');
      const son = k.akis().slice(-1)[0];
      expect(son.satirlar).toEqual(['Toparlanma iyi.', 'Uyku 7 sa · 2 öğün']);
      expect(son.metin).toBe('SPİ’de bugün:');
    }));

    it('veri önce önizlenir; Vazgeç kaydetmez, Kaydet kaydeder', () => sahneyle(async () => {
      let kayit = 0;
      const veri = { onizle:t => (/uyku/.test(t) ? { metin:'Uyku 7 sa', ipucu:'Günlük ölçüm',
        kaydet:async () => { kayit++; return 'Uyku kaydedildi'; } } : null) };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      expect(kayit).toBe(0);
      expect(k.akis().slice(-1)[0].satirlar[0]).toContain('Uyku 7 sa');
      document.querySelector('[data-king="vazgec"]').click();
      expect(kayit).toBe(0);
      await k.isle('uyku 7');
      document.querySelector('[data-king="kaydet"]').click();
      await new Promise(r => setTimeout(r, 0));
      expect(kayit).toBe(1);
      expect(k.akis().slice(-1)[0].metin).toBe('Uyku kaydedildi');
    }));
  });

  describe('King — adres ve açılış', () => {
    it('başka modülden gelinen #king= hedefi yalnız katalogdaysa uygulanır', () => sahneyle(async () => {
      let s = sahne({ hash:'#king=move:kardiyo' });
      expect(s.gidilen).toEqual([['move', { sekme:'kardiyo' }]]);
      expect(s.giden).toContain('hash-silindi');
      s = sahne({ hash:'#king=evil' });
      expect(s.gidilen).toHaveLength(0);
      s = sahne({ hash:'#king=lang', modul:'spi' });   // esp rotası spi'de yok
      expect(s.gidilen).toHaveLength(0);
    }));

    it('Ctrl iki kez açar, Esc kapatır; ışık ve baloncuk aynı katmanda', () => sahneyle(async () => {
      const { k } = sahne();
      const tus = key => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles:true }));
      tus('Control'); tus('Control');
      expect(k.acikMi()).toBe(true);
      const el = document.querySelector('[data-king]');
      expect(!!el.querySelector('.king-isik')).toBe(true);
      expect(el.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe('King ile konuş');
      expect(el.textContent).toContain('Ne yapıyoruz?');
      expect(el.querySelectorAll('[data-king-hazir]').length).toBe(5);
      tus('Escape');
      expect(k.acikMi()).toBe(false);
      /* Odak: arka plan perdesi; dokununca kapanır, sayfaya tıklama geçmez. */
      tus('Control'); tus('Control');
      const perde = document.querySelector('[data-king] .king-perde');
      expect(!!perde).toBe(true);
      perde.click();
      expect(k.acikMi()).toBe(false);
      tus('Control'); tus('c'); tus('Control');               // Ctrl+C sonrası açmaz
      expect(k.acikMi()).toBe(false);
    }));
  });
})();
