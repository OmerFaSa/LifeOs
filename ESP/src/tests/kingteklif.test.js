/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/kingteklif.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* King teklifi istemcisi — tek kaynak `brand/ortak/kingteklif.test.js`.

   Kanıtlanan sözler:
     1. HKM bağlı değilse istek yapılmaz; liste boş gelir.
     2. Onay ve iptal HKM'nin tek kapısına gider; cevap HKM'nin sayısıyla.
     3. HKM hata verirse ya da düşerse önceki liste bekliyor gösterilmez. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const K = () => window.LIFEOS.KingTeklif;
  const TEKLIF = { id:12, konu:'Türev özeti', tur:'bam.urun', oneri:'tam', neden:null,
    secenekler:[{ id:'tam', ad:'tam', metin:'tam: düşük sınıf · maliyet ~0,0043 USD' }] };

  function beacon(acik){
    return { settings:() => ({ enabled:acik, token:'t', url:'http://127.0.0.1:4200/' }), urlOk:() => true };
  }
  function hkm(giden, cevaplar){
    return async (url, o) => {
      giden.push({ url, o });
      const c = cevaplar(url, o) || { status:200, govde:{} };
      return { status:c.status, json:async () => c.govde };
    };
  }

  describe('King teklifi', () => {
    it('HKM bağlı değilse istek yapılmaz', async () => {
      const giden = [];
      const k = K().kur({ hkm:() => beacon(false), modul:'ays', fetch:hkm(giden, () => null) });
      expect(await k.cek()).toEqual([]);
      expect((await k.onayla(12, 'tam')).ok).toBe(false);
      expect(giden.length).toBe(0);
    });

    it('teklifler çekilir; onay tek kapıya secenekle gider', async () => {
      const giden = [];
      const k = K().kur({ hkm:() => beacon(true), modul:'esp', fetch:hkm(giden, url => {
        if(url.endsWith('/api/king/teklifler/esp')) return { status:200, govde:{ teklifler:[TEKLIF] } };
        if(url.endsWith('/api/king/emir/12/onayla')){
          return { status:200, govde:{ ok:true, emir:{ id:12, durum:'onaylandi',
            tahmin:{ metin:'yaklaşık 2 dakika' } } } };
        }
        return null;
      }) });
      const l = await k.cek();
      expect(l.map(x => x.id)).toEqual([12]);
      expect(giden[0].url).toBe('http://127.0.0.1:4200/api/king/teklifler/esp');
      const r = await k.onayla(12, 'tam');
      expect(r.ok).toBe(true);
      expect(r.metin.indexOf('#12') >= 0 && r.metin.indexOf('yaklaşık 2 dakika') >= 0).toBe(true);
      expect(JSON.parse(giden[1].o.body)).toEqual({ secenek:'tam' });
      expect(k.liste()).toEqual([]);
    });

    it('onaylanıp açılamayan iş başarı sayılmaz; iptal söylenir', async () => {
      const k = K().kur({ hkm:() => beacon(true), modul:'ays', fetch:hkm([], url => {
        if(url.endsWith('/onayla')) return { status:200, govde:{ ok:true, note:'Bütçe bitti.',
          emir:{ id:3, durum:'reddedildi' } } };
        if(url.endsWith('/iptal')) return { status:200, govde:{ ok:true } };
        return null;
      }) });
      const r = await k.onayla(3, 'tam');
      expect(r.ok).toBe(false);
      expect(r.metin.indexOf('Bütçe bitti.') >= 0).toBe(true);
      expect((await k.iptal(3)).ok).toBe(true);
    });

    it('ara onaya «devam» ya da «dur» iletilir; başka söz iletilmez', async () => {
      const giden = [];
      const k = K().kur({ hkm:() => beacon(true), modul:'ays', fetch:hkm(giden, url =>
        ({ status:200, govde:{ ok:true, note:url.endsWith('/dur')
          ? 'Durduruldu: kitap üretilen bölümlerle bitiyor.' : 'Devam.' } })) });
      expect((await k.parca(5, 'dur')).metin.indexOf('Durduruldu') === 0).toBe(true);
      expect(giden[0].url).toBe('http://127.0.0.1:4200/api/king/emir/5/dur');
      expect((await k.parca(5, 'sil')).ok).toBe(false);
      expect(giden.length).toBe(1);
    });

    it('HKM düşerse önceki liste bekliyor gösterilmez', async () => {
      let dusuk = false;
      const k = K().kur({ hkm:() => beacon(true), modul:'spi', fetch:async () => {
        if(dusuk) throw new Error('ağ yok');
        return { status:200, json:async () => ({ teklifler:[TEKLIF] }) };
      } });
      expect((await k.cek()).length).toBe(1);
      dusuk = true;
      expect(await k.cek()).toEqual([]);
    });
  });
})();
