/* BAM ürünleri — modülün aldığı özet, rapor, sunum, pankart.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/urun.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler:
     1. Ön süzgeç katalog kelimesi VE üretim fiili ister; «özet» tek başına
        ürün isteği değildir. Kararı HKM verir.
     2. HKM'den gelen kayıt modülün KENDİ koduyla sınanır; tutmayan eklenmez.
     3. Ürün sandbox iframe'de açılır; betik çalışamaz.
     4. HKM kapalıysa hiçbir şey olmaz ve söylenir; hiçbir şey fırlatmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const U = () => window.LIFEOS.Urun;
  const ACIK = { enabled:true, token:'jeton', url:'http://127.0.0.1:8787/' };
  const HTML = '<!doctype html><html lang="tr"><head></head><body><h1>Türev</h1></body></html>';

  function kayit(ek){
    return Object.assign({ id:12, tur:'materyal', baslik:'Türev', dogruluk:'dogrulanmadi',
      govde:{ tur:'urun', urun:'ozet', aile:'belge', urun_ad:'Konu özeti', baslik:'Türev',
        bolumler:[{ baslik:'Giriş', bloklar:[] }], kaynaklar:[] } }, ek || {});
  }

  /* Bellek içi depo ve sahte HKM: hiçbir test ağa çıkmaz. */
  function kur(ayar, yanit){
    const giden = [];
    let depo = null;
    const u = U().kur({
      store:() => ({ get:async () => depo, set:async (k, v) => { depo = v; } }),
      hkm:() => ({ MODULE:'spi', settings:() => ayar, urlOk:x => /^https?:\/\//.test(x || '') }),
      fetch:async (url, o) => {
        giden.push({ url, o });
        if(yanit instanceof Error) throw yanit;
        const r = yanit(url, o) || { status:404 };
        return { status:r.status, json:async () => r.body, text:async () => r.text };
      },
    });
    return { u, giden, depo:() => depo };
  }
  const HKM = (k, html) => url => (/\/cikti\?bicim=html$/.test(url)
    ? { status:200, text:html == null ? HTML : html }
    : /\/api\/bam\/kayit\/\d+$/.test(url) ? { status:200, body:{ kayit:k } } : null);

  describe('BAM ürünü — ön süzgeç', () => {
    it('katalog kelimesi ve üretim fiili birlikte ister', () => {
      expect(U().istekMi('Türev hakkında özet hazırla')).toBe(true);
      expect(U().istekMi('fotosentez zihin haritası çiz')).toBe(true);
      expect(U().istekMi('özet: Kurtuluş Savaşı')).toBe(true);
      ['özet', 'bugünün özetini ver', 'rapor', 'bugün 40 soru çözdüm', '/özet hazırla']
        .forEach(m => expect(U().istekMi(m)).toBe(false));
    });

    it('BAM yolu ürünü araştırmadan ve sorudan önce tanır', () => {
      expect(window.LIFEOS.Ofis.bamIstegi('kaynaklı rapor hazırla, araştırarak')).toEqual({ tur:'urun' });
      expect(window.LIFEOS.Ofis.bamIstegi('Üslü sayılardan 10 soru hazırla')).toEqual({ tur:'uretim' });
    });
  });

  describe('BAM ürünü — modülün kendi denetimi', () => {
    it('ürün olmayan, teklifle tutmayan ya da boş kayıt geçmez', () => {
      const p = { kayit_id:12, urun:'ozet' };
      expect(U().sina(kayit(), p, HTML).ok).toBe(true);
      expect(U().sina(kayit({ govde:{ tur:'kitap' } }), p, HTML).ok).toBe(false);
      expect(U().sina(kayit(), { kayit_id:13, urun:'ozet' }, HTML).ok).toBe(false);
      expect(U().sina(kayit(), { kayit_id:12, urun:'pankart' }, HTML).ok).toBe(false);
      const bos = kayit();
      bos.govde.bolumler = [];
      expect(U().sina(bos, p, HTML).ok).toBe(false);
      expect(U().sina(kayit(), p, '<p>parça</p>').ok).toBe(false);
      expect(U().sina(kayit(), p, HTML.replace('</body>', 'x'.repeat(U().HTML_SINIR) + '</body>')).ok)
        .toBe(false);
    });

    it('bilinmeyen etiket «doğrulanmadı» sayılır', () => {
      const s = U().sina(kayit({ dogruluk:'kesin' }), { kayit_id:12, urun:'ozet' }, HTML);
      expect(s.urun.dogruluk).toBe('dogrulanmadi');
      expect(U().etiketAdi('kaynakli')).toBe('kaynaklı');
    });

    it('iframe sandbox’lıdır ve kaçışlanır', () => {
      const c = U().cerceve({ baslik:'A "B"', html:'<html><body onload="x()">&</body></html>' });
      expect(c).toContain('sandbox=""');
      expect(c.indexOf('allow-scripts')).toBe(-1);
      expect(c).toContain('onload=&quot;x()&quot;');
      expect(c).toContain('&amp;');
      expect(c).toContain('title="A &quot;B&quot;"');
    });
  });

  describe('BAM ürünü — teklifi uygulamak', () => {
    it('kayıt HKM’den çekilir, sınanır ve modülün deposuna yazılır', async () => {
      const a = kur(ACIK, HKM(kayit()));
      const r = await a.u.uygula({ kayit_id:12, urun:'ozet', baslik:'Türev' });
      expect(r.ok).toBe(true);
      expect(r.note).toContain('Konu özeti');
      expect(a.giden.map(g => g.url)).toEqual(['http://127.0.0.1:8787/api/bam/kayit/12',
        'http://127.0.0.1:8787/api/bam/kayit/12/cikti?bicim=html']);
      expect(a.depo().items).toHaveLength(1);
      expect(a.depo().items[0].html).toBe(HTML);
      /* Liste basılı hâli taşımaz; açarken `bul` verir. */
      expect(a.u.liste()[0].html).toBeUndefined();
      expect(a.u.bul('bam-12').html).toBe(HTML);
      /* İkinci kez eklenmez. */
      expect((await a.u.uygula({ kayit_id:12, urun:'ozet' })).ok).toBe(false);
      await a.u.sil('bam-12');
      expect(a.u.liste()).toHaveLength(0);
    });

    it('denetimi geçmeyen kayıt yazılmaz ve sebebi söylenir', async () => {
      const a = kur(ACIK, HKM(kayit({ govde:{ tur:'kitap' } })));
      const r = await a.u.uygula({ kayit_id:12, urun:'ozet' });
      expect(r.ok).toBe(false);
      expect(r.error).toContain('ürün değil');
      expect(a.depo()).toBe(null);
    });

    it('HKM kapalıysa ya da koptuysa hiçbir şey yazılmaz, fırlatmaz', async () => {
      const kapali = kur({ enabled:false }, HKM(kayit()));
      expect((await kapali.u.uygula({ kayit_id:12, urun:'ozet' })).ok).toBe(false);
      expect(kapali.giden).toHaveLength(0);
      const kopuk = kur(ACIK, new Error('kapalı'));
      const r = await kopuk.u.uygula({ kayit_id:12, urun:'ozet' });
      expect(r.ok).toBe(false);
      expect(r.error).toContain('alınamadı');
    });

    it('depodan yeniden yüklenir: HKM kapalıyken de okunur', async () => {
      const a = kur(ACIK, HKM(kayit()));
      await a.u.uygula({ kayit_id:12, urun:'ozet' });
      const b = U().kur({ store:() => ({ get:async () => a.depo(), set:async () => {} }),
        hkm:() => null });
      await b.yukle();
      expect(b.liste()).toHaveLength(1);
      expect(b.bul('bam-12').baslik).toBe('Türev');
    });
  });

  describe('BAM ürünü — sohbetten istek', () => {
    it('istek King’e modül adına gider; tanınmazsa söylenir', async () => {
      const a = kur(ACIK, (url, o) => ({ status:200, body:JSON.parse(o.body).metin.indexOf('özet') >= 0
        ? { ok:true, tanindi:true, metin:'Konu özeti: «Türev» işini Üretim Bürosu’na verdim (iş emri #3).' }
        : { ok:true, tanindi:false } }));
      const r = await a.u.iste('Türev hakkında özet hazırla');
      expect(r.ok).toBe(true);
      expect(r.metin).toContain('iş emri #3');
      expect(a.giden[0].url).toBe('http://127.0.0.1:8787/api/king/urun');
      expect(JSON.parse(a.giden[0].o.body).modul).toBe('spi');
      const t = await a.u.iste('şunu yap');
      expect(t.ok).toBe(false);
      expect(t.metin).toContain('anlamadım');
    });

    it('HKM bağlı değilse iş açılmaz ve söylenir', async () => {
      const a = kur({ enabled:false }, () => null);
      const r = await a.u.iste('Türev hakkında özet hazırla');
      expect(r.ok).toBe(false);
      expect(r.metin).toContain('HKM bağlı değil');
      expect(a.giden).toHaveLength(0);
    });
  });
})();
