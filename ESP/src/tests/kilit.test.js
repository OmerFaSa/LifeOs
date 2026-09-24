/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/kilit.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Gizlilik kilidi — katalog 176 (T5).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kilit.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: kod dört rakamdır; kod düz yazılmaz (tuzlu özet);
   doğru kod açar, yanlış açmaz; kilit yokken açılış hemen döner; kilit
   varken ekran uygulamayı perdeler ve doğru kodla kalkar; ayar kutusu iki
   kodun aynı olmasını ister ve kurunca «açık» der; kilit ekranı veriyi
   şifrelemediğini saklamaz (ayar metni söyler) ve «Kodu unuttum» vardır. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const L = window.LIFEOS.KILIT;
  const M = 'test-kilit';
  const bekle = ms => new Promise(r => setTimeout(r, ms));

  describe('Gizlilik kilidi (176)', () => {
    it('kod dört rakam; düz yazılmaz; doğru açar, yanlış açmaz', async () => {
      L.kaldir(M);
      try{
        expect((await L.kur(M, '12a4')).ok).toBe(false);
        expect((await L.kur(M, '123')).ok).toBe(false);
        expect((await L.kur(M, '1234')).ok).toBe(true);
        expect(L.aktifMi(M)).toBe(true);
        const ham = localStorage.getItem('lifeos.kilit.' + M);
        expect(ham.indexOf('1234') < 0).toBe(true);
        expect(await L.dogrula(M, '1234')).toBe(true);
        expect(await L.dogrula(M, '4321')).toBe(false);
      }finally{ L.kaldir(M); }
      expect(L.aktifMi(M)).toBe(false);
    });

    it('kilit yokken açılış hemen döner; varken perdeler, doğru kodla kalkar', async () => {
      L.kaldir(M);
      expect(await L.ac(M)).toBe('kilit-yok');
      await L.kur(M, '2468');
      const app = document.getElementById('app');
      try{
        const bekleyen = L.ac(M, { isaret:'<svg></svg>' });
        await bekle(20);
        const el = document.getElementById('kilit');
        expect(!!el).toBe(true);
        expect(el.getAttribute('data-oz')).toBe('176');
        expect(!!el.querySelector('[data-kilit="unuttum"]')).toBe(true);
        if(app) expect(app.hasAttribute('inert')).toBe(true);
        const kod = el.querySelector('#kilit-kod');
        kod.value = '1111'; kod.dispatchEvent(new Event('input'));
        await bekle(60);
        expect(!!document.getElementById('kilit')).toBe(true);
        expect(el.querySelector('#kilit-not').textContent).toContain('yanlış');
        kod.value = '2468'; kod.dispatchEvent(new Event('input'));
        expect(await bekleyen).toBe('acildi');
        expect(!!document.getElementById('kilit')).toBe(false);
        if(app) expect(app.hasAttribute('inert')).toBe(false);
      }finally{ L.kaldir(M); const k = document.getElementById('kilit'); if(k) k.remove(); }
    });

    it('ayar kutusu iki kodu ister, kurunca açık der, kaldırınca kapalı', async () => {
      L.kaldir(M);
      const d = document.createElement('div');
      d.innerHTML = L.ayarHtml(M, { govde:true });
      document.body.appendChild(d);
      try{
        expect(d.textContent).toContain('Veriyi şifrelemez');
        await L.ayarEylem(d.querySelector('[data-kilit="kur"]'));
        const i = d.querySelectorAll('.kilit-ayar__form input');
        i[0].value = '1357'; i[1].value = '1358';
        expect(await L.ayarEylem(d.querySelector('[data-kilit="kaydet"]'))).toBe(false);
        expect(d.querySelector('.kilit-ayar__not').textContent).toContain('aynı değil');
        i[1].value = '1357';
        expect(await L.ayarEylem(d.querySelector('[data-kilit="kaydet"]'))).toBe(true);
        expect(L.aktifMi(M)).toBe(true);
        expect(d.textContent).toContain('açık');
        await L.ayarEylem(d.querySelector('[data-kilit="kaldir"]'));
        expect(L.aktifMi(M)).toBe(false);
        expect(d.textContent).toContain('kapalı');
      }finally{ L.kaldir(M); d.remove(); }
    });

    /* K'nin kararı (EKIP-PLANI §8-12): unutan kilitli KALMAZ (veri kaybı
       olmaz) ama kapı yanındaki birinin bekleyip geçeceği kadar kısa da
       değildir; kilit bu yolla kalkarsa sahibi bunu Ayarlar'da görür. */
    it('oz-176 «Kodu unuttum» beş dakika bekletir; kaldırılan kilit iz bırakır, yeniden kurulunca iz silinir', async () => {
      L.kaldir(M); L.izSil(M);
      try{
        expect(L.UNUTTUM_SN).toBe(300);
        expect(L.sureMetni(300)).toBe('5 dakika');
        expect(L.sureMetni(299)).toBe('4 dakika 59 saniye');
        expect(L.sureMetni(45)).toBe('45 saniye');
        await L.kur(M, '1122');
        L.unutuldu(M, new Date(2026, 8, 24, 21, 30));
        expect(L.aktifMi(M)).toBe(false);
        expect(L.izOku(M).tur).toBe('unutuldu');
        const d = document.createElement('div');
        d.innerHTML = L.ayarHtml(M, { govde:true });
        try{
          const iz = d.querySelector('[data-kilit-iz]');
          expect(iz.textContent).toContain('«Kodu unuttum» ile kaldırıldı');
          expect(iz.textContent).toContain('24 Eylül');
          expect(iz.textContent).toContain('21:30');
          expect(d.textContent).toContain('beş dakika');
        }finally{ d.remove(); }
        await L.kur(M, '3344');
        expect(L.izOku(M)).toBeNull();
        const e = document.createElement('div');
        e.innerHTML = L.ayarHtml(M, { govde:true });
        expect(e.querySelector('[data-kilit-iz]')).toBeNull();
      }finally{ L.kaldir(M); L.izSil(M); }
    });
  });
})();
