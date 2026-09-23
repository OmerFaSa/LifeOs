/* Otomatik yedek istemcisi — tek kaynak `brand/ortak/yedekag.test.js`.

   Kanıtlanan sözler:
     1. HKM bağlı değilse, bugün yedek alınmışsa ya da korunacak kayıt
        yoksa hiçbir istek yapılmaz.
     2. Hatırlatma ancak HKM aynı bayt sayısını ve aynı SHA-256'yı geri
        söylerse «alındı» sayılır.
     3. HKM hata verirse ya da düşerse hatırlatma olduğu gibi kalır.
     4. Küçülme uyarısı kullanıcıya iletilir. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const Y = () => window.LIFEOS.YedekAg;
  const VERI = { __meta:{ app:'rota-84285' }, data:{ 'days/2026-09-20':{ not:'Çalıştım' } } };

  function beacon(acik){
    return { settings:() => ({ enabled:acik, token:'t', url:'http://127.0.0.1:4200/' }), urlOk:() => true };
  }
  async function sha(metin){
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
    return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  /* HKM'nin yaptığını yapar: gelen baytları sayar ve özetler. */
  function hkm(giden, ek){
    return async (url, o) => {
      giden.push({ url, o });
      const bayt = new TextEncoder().encode(o.body).length;
      return { status:200, json:async () => Object.assign(
        { ok:true, tarih:'2026-09-20', bayt, sha256:await sha(o.body) }, ek || {}) };
    };
  }
  function ortam(o){
    const x = { isaretli:0, bildirilen:[] };
    x.ag = Y().kur(Object.assign({ hkm:() => beacon(true), modul:'ays', disaAktar:() => VERI,
      kayit:() => 12, yas:() => 3, isaretle:async () => { x.isaretli++; },
      bildir:m => x.bildirilen.push(m) }, o));
    return x;
  }

  describe('Otomatik yedek', () => {
    it('bağlantı yok, bugün alınmış ya da kayıt az: istek yapılmaz', async () => {
      const giden = [];
      for(const [ek, neden] of [
        [{ hkm:() => beacon(false) }, 'hkm-yok'],
        [{ yas:() => 0 }, 'bugun-alindi'],
        [{ kayit:() => 2 }, 'az-kayit'],
      ]){
        const x = ortam(Object.assign({ fetch:hkm(giden) }, ek));
        const r = await x.ag.dene();
        expect(r.neden).toBe(neden);
        expect(x.isaretli).toBe(0);
      }
      expect(giden.length).toBe(0);
    });

    it('HKM aynı baytı ve özeti söylerse alındı sayılır', async () => {
      const giden = [];
      const x = ortam({ fetch:hkm(giden), yas:() => null });
      const r = await x.ag.dene();
      expect(r.ok).toBe(true);
      expect(giden[0].url).toBe('http://127.0.0.1:4200/api/yedek/ays');
      expect(JSON.parse(giden[0].o.body)).toEqual(VERI);
      expect(r.bayt).toBe(new TextEncoder().encode(giden[0].o.body).length);
      expect(x.isaretli).toBe(1);
    });

    it('bayt ya da özet tutmazsa alındı sayılmaz', async () => {
      for(const ek of [{ bayt:3 }, { sha256:'0'.repeat(64) }]){
        const x = ortam({ fetch:hkm([], ek) });
        const r = await x.ag.dene();
        expect(r.neden).toBe('dogrulanmadi');
        expect(x.isaretli).toBe(0);
      }
    });

    it('HKM hata verirse ya da düşerse hatırlatma kalır', async () => {
      const x = ortam({ fetch:async () => ({ status:422, json:async () => ({ ok:false }) }) });
      expect((await x.ag.dene()).neden).toBe('hkm-hata');
      const y = ortam({ fetch:async () => { throw new Error('ağ yok'); } });
      expect((await y.ag.dene()).neden).toBe('hkm-hata');
      const z = ortam({ fetch:hkm([]), disaAktar:() => { throw new Error('depo'); } });
      expect((await z.ag.dene()).neden).toBe('hata');
      expect(x.isaretli + y.isaretli + z.isaretli).toBe(0);
    });

    it('küçülme uyarısı kullanıcıya iletilir', async () => {
      const x = ortam({ fetch:hkm([], { uyari:'AYS yedeği bir öncekinin yarısından küçük.' }) });
      const r = await x.ag.dene();
      expect(r.ok).toBe(true);
      expect(x.bildirilen).toEqual(['AYS yedeği bir öncekinin yarısından küçük.']);
    });
  });
})();
