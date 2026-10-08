/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/qr.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* QR — tek kaynak `brand/ortak/qr.test.js` (brand/ortak/qr.js).

   Kanıtlanan sözler:
     1. Reed–Solomon artığı standardın «HELLO WORLD» 1-M örneğini verir.
     2. Biçim bitleri standardın tablosuyla aynıdır (L/M, sekiz maske);
        sürüm 7'nin sürüm bitleri 000111110010010100'dır.
     3. Hizalama desenlerinin yeri standardın tablosuyla aynıdır.
     4. GİDİŞ-DÖNÜŞ: çizilen matris, bu dosyadaki BAĞIMSIZ bir okuyucuyla
        okunur — işlev desenlerinin yeri, maske formülleri, zikzak ve blok
        düzeni burada ayrıca yazılıdır; maske biçim bitlerinden okunur,
        her bloğun hata düzeltme baytları denetlenir, bayt kipi çözülür ve
        metin aynen geri gelir (Türkçe harf, uzun otpauth adresi, sürüm
        1–10, sekiz maskenin her biri).
     5. Sığmayan metin için null; SVG açık zeminde koyu modül ve sessiz
        kenarla çizilir. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const Q = () => window.LIFEOS.QR;

  /* ---------------------------------------------- bağımsız okuyucu */

  /* Standardın tablosu (ISO/IEC 18004 Tablo 9): [blok başına ecc, [blok sayısı, veri baytı]...] */
  const BLOK = {
    M:[null, [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]], [16, [4, 27]],
      [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]]],
    L:[null, [7, [1, 19]], [10, [1, 34]], [15, [1, 55]], [20, [1, 80]], [26, [1, 108]], [18, [2, 68]],
      [20, [2, 78]], [24, [2, 97]], [30, [2, 116]], [18, [2, 68], [2, 69]]],
  };
  const HIZA = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const MASKE = [
    (i, j) => (i + j) % 2 === 0, i => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
    (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i * j) % 3 + (i + j) % 2) % 2 === 0,
  ];   // i: satır, j: sütun (standardın yazımı)

  function islevMi(s, n){
    const f = Array.from({ length:n }, () => new Array(n).fill(false));
    const isle = (r0, c0, h, w) => { for(let r = r0; r < r0 + h; r++) for(let c = c0; c < c0 + w; c++) if(r >= 0 && c >= 0 && r < n && c < n) f[r][c] = true; };
    isle(0, 0, 9, 9); isle(0, n - 8, 9, 8); isle(n - 8, 0, 8, 9);      // bulucu + ayraç + biçim
    isle(6, 0, 1, n); isle(0, 6, n, 1);                                 // zamanlama
    const h = HIZA[s], son = h.length - 1;
    h.forEach((r, a) => h.forEach((c, b) => {
      if((a === 0 && b === 0) || (a === 0 && b === son) || (a === son && b === 0)) return;
      isle(r - 2, c - 2, 5, 5);
    }));
    if(s >= 7){ isle(0, n - 11, 6, 3); isle(n - 11, 0, 3, 6); }        // sürüm bilgisi
    return f;
  }

  function oku(m){
    const n = m.length, s = (n - 17) / 4;
    /* Biçim: (8,0..5),(8,7),(8,8),(7,8),(5..0,8) — x sütun, y satır. */
    const yer = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
    let b = 0;
    yer.forEach(([x, y], i) => { if(m[y][x]) b |= 1 << i; });
    b ^= 0x5412;
    const duzey = ({ 1:'L', 0:'M' })[(b >>> 13) & 3];
    const maske = (b >>> 10) & 7;
    if(!duzey) throw new Error('düzey okunamadı');
    const f = islevMi(s, n);
    const bitler = [];
    /* Sütun çiftleri sağdan sola; zamanlama sütunu (6) atlanır; ilk çift
       yukarı okunur, her çiftte yön döner. */
    for(let sag = n - 1, cift = 0; sag >= 1; sag -= 2, cift++){
      if(sag === 6) sag = 5;
      const yukari = cift % 2 === 0;
      for(let k = 0; k < n; k++){
        const r = yukari ? n - 1 - k : k;
        for(const c of [sag, sag - 1]){
          if(f[r][c]) continue;
          bitler.push(m[r][c] !== MASKE[maske](r, c) ? 1 : 0);
        }
      }
    }
    const baytlar = [];
    for(let i = 0; i + 8 <= bitler.length; i += 8){
      let v = 0;
      for(let j = 0; j < 8; j++) v = (v << 1) | bitler[i + j];
      baytlar.push(v);
    }
    /* Blokları çöz: önce veri baytları sırayla örülü, sonra ecc. */
    const [ecc, ...gruplar] = BLOK[duzey][s];
    const bloklar = [];
    gruplar.forEach(([adet, uz]) => { for(let i = 0; i < adet; i++) bloklar.push({ uz, veri:[], ecc:[] }); });
    let p = 0;
    const enUzun = Math.max(...bloklar.map(x => x.uz));
    for(let i = 0; i < enUzun; i++) bloklar.forEach(x => { if(i < x.uz) x.veri.push(baytlar[p++]); });
    for(let i = 0; i < ecc; i++) bloklar.forEach(x => { x.ecc.push(baytlar[p++]); });
    bloklar.forEach((x, i) => {
      if(JSON.stringify(Q()._rs(x.veri, ecc)) !== JSON.stringify(x.ecc)) throw new Error('blok ' + i + ' ecc tutmuyor');
    });
    const veri = [].concat(...bloklar.map(x => x.veri));
    const vb = [];
    veri.forEach(v => { for(let i = 7; i >= 0; i--) vb.push((v >>> i) & 1); });
    let q = 0;
    const al = k => { let v = 0; for(let i = 0; i < k; i++) v = (v << 1) | vb[q++]; return v; };
    if(al(4) !== 4) throw new Error('bayt kipi değil');
    const say = al(s < 10 ? 8 : 16);
    const out = [];
    for(let i = 0; i < say; i++) out.push(al(8));
    return { duzey, maske, surum:s, metin:new TextDecoder().decode(new Uint8Array(out)) };
  }

  describe('QR kodu (brand/ortak/qr.js)', () => {
    it('Reed–Solomon: standardın «HELLO WORLD» 1-M örneği', () => {
      expect(Q()._rs([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10))
        .toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
    });

    it('biçim ve sürüm bitleri standardın tablosuyla aynı', () => {
      const M = ['101010000010010', '101000100100101', '101111001111100', '101101101001011',
        '100010111111001', '100000011001110', '100111110010111', '100101010100000'];
      M.forEach((b, k) => expect(Q()._bicim('M', k).toString(2).padStart(15, '0')).toBe(b));
      expect(Q()._bicim('L', 0).toString(2).padStart(15, '0')).toBe('111011111000100');
      expect(Q()._bicim('L', 7).toString(2).padStart(15, '0')).toBe('110100101110110');
      expect(Q()._surum(7).toString(2).padStart(18, '0')).toBe('000111110010010100');
      expect(Q()._surum(10).toString(2).padStart(18, '0')).toBe('001010010011010011');
    });

    it('hizalama yeri ve veri kapasitesi standardın tablosuyla aynı', () => {
      for(let s = 1; s <= 10; s++){
        expect(Q()._hiza(s)).toEqual(HIZA[s]);
        ['M', 'L'].forEach(d => {
          const t = BLOK[d][s];
          expect(Q()._veriBayti(s, d)).toBe(t.slice(1).reduce((a, [adet, uz]) => a + adet * uz, 0));
        });
      }
    });

    it('gidiş-dönüş: bağımsız okuyucu metni aynen geri okur', () => {
      const metinler = ['LifeOS', 'https://192.168.0.10:5183/?bagla=482913',
        'otpauth://totp/LifeOS:%C3%96mer?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=LifeOS&algorithm=SHA1&digits=6&period=30',
        'Şifre değil: ığüşöç ĞÜŞİÖÇ', 'x'.repeat(150), 'y'.repeat(213)];
      const surumler = new Set();
      metinler.forEach(t => {
        const q = Q().matris(t);
        expect(q.boyut).toBe(q.surum * 4 + 17);
        const r = oku(q.modul);
        expect(r.metin).toBe(t);
        expect([r.duzey, r.maske, r.surum]).toEqual([q.duzey, q.maske, q.surum]);
        surumler.add(q.surum);
      });
      expect(surumler.has(10) && surumler.has(1)).toBe(true);           // sürüm 7+ (sürüm bitli) da sınandı
      const L = Q().matris('LifeOS düzey L', { duzey:'L' });
      expect(oku(L.modul)).toEqual({ duzey:'L', maske:L.maske, surum:L.surum, metin:'LifeOS düzey L' });
    });

    it('sekiz maskenin her biri okunur; seçilen maske en düşük cezalıdır', () => {
      for(let k = 0; k < 8; k++){
        const q = Q().matris('https://192.168.0.10:5183/?bagla=000111', { maske:k });
        expect(q.maske).toBe(k);
        expect(oku(q.modul).metin).toBe('https://192.168.0.10:5183/?bagla=000111');
      }
      const q = Q().matris('otpauth://totp/LifeOS:omer?secret=ABCDEFGHIJKLMNOP');
      expect(q.maske >= 0 && q.maske < 8).toBe(true);
    });

    it('bulucu desenleri, zamanlama ve her zaman koyu modül yerinde', () => {
      const m = Q().matris('LifeOS').modul, n = m.length;
      [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
        for(let i = 0; i < 7; i++){
          expect(m[r][c + i] && m[r + 6][c + i] && m[r + i][c] && m[r + i][c + 6]).toBe(true);
        }
        expect(m[r + 1][c + 1]).toBe(false);
        expect(m[r + 3][c + 3]).toBe(true);
      });
      for(let i = 8; i < n - 8; i++){ expect(m[6][i]).toBe(i % 2 === 0); expect(m[i][6]).toBe(i % 2 === 0); }
      expect(m[n - 8][8]).toBe(true);
    });

    it('sığmayan metin null; SVG açık zeminde koyu, sessiz kenarlı', () => {
      expect(Q().matris('z'.repeat(214))).toBeNull();
      expect(Q().svg('z'.repeat(214))).toBe('');
      const s = Q().svg('LifeOS', { etiket:'Kod <test>' });
      expect(s.indexOf('viewBox="0 0 29 29"') > 0).toBe(true);           // 21 + 2×4
      expect(s.indexOf('fill="#fff"') > 0 && s.indexOf('fill="#000"') > 0).toBe(true);
      expect(s.indexOf('aria-label="Kod &lt;test&gt;"') > 0).toBe(true);
    });
  });
})();
