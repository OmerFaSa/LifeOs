/* King teklifi istemcisi — tek kaynak `brand/ortak/kingteklif.test.js`.

   Kanıtlanan sözler:
     1. HKM bağlı değilse istek yapılmaz; liste boş gelir.
     2. Onay ve iptal HKM'nin tek kapısına gider; cevap HKM'nin sayısıyla.
     3. HKM hata verirse ya da düşerse önceki liste bekliyor gösterilmez.
     4. Yoklama yazılanı silmez: liste hemen konur, çizim kullanıcı
        yazmıyorken (brand/ortak/hesap.js cizIste). */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const K = () => window.LIFEOS.KingTeklif;
  const HESAP = () => window.LIFEOS.HESAP;
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

  /* YAZILAN SİLİNMEZ (2026-10-05). Yoklama (app.js kingTazele: açılışta,
     King'e iş verilince, dakikada bir) liste değişince ekranı baştan
     çiziyordu: Bugün'de yazılıp henüz kaydedilmemiş değer (#v-sleep)
     siliniyor, sonra basılan «Kaydet» boş alanı yazabiliyordu. Liste
     hemen konur; çizim kullanıcı yazmıyorken (hesap.js cizIste). */
  function kirliAlan(){
    const el = document.createElement('input');
    el.type = 'number';
    el.style.cssText = 'display:block;width:40px;height:20px';
    document.body.appendChild(el);
    el.value = '7';                                        // kullanıcı yazdı…
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.blur();                                             // …ve alandan çıktı
    return el;
  }

  describe('King teklifi — yoklama yazılanı silmez', () => {
    it('kirli alan varken liste konur ama çizilmez; alan gidince bir kez çizilir', async () => {
      const h = HESAP(), eski = h._ortam.zamanla, sonra = [];
      h._ortam.zamanla = fn => { sonra.push(fn); return 0; };
      if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
      let el = null;
      try{
        let cevap = [TEKLIF];
        const k = K().kur({ hkm:() => beacon(true), modul:'spi',
          fetch:async () => ({ status:200, json:async () => ({ teklifler:cevap }) }) });
        const ui = {};
        let cizim = 0;
        const tazele = k.tazeleyici({ al:() => ui.liste, koy:l => { ui.liste = l; }, ciz:() => { cizim++; } });
        await tazele();
        expect(cizim).toBe(1);                                   // kimse yazmıyor: hemen
        el = kirliAlan();
        cevap = [TEKLIF, Object.assign({}, TEKLIF, { id:13 })];
        await tazele();
        expect(ui.liste.map(x => x.id)).toEqual([12, 13]);       // veri hemen…
        expect(cizim).toBe(1);                                   // …çizim bekler
        el.remove(); el = null;                                  // kaydedildi, form yeniden çizildi
        sonra.splice(0).forEach(fn => fn());
        expect(cizim).toBe(2);
        await tazele();                                          // aynı liste: çizim yok
        sonra.splice(0).forEach(fn => fn());
        expect(cizim).toBe(2);
      }finally{
        if(el) el.remove();
        h._ortam.zamanla = eski;
        h._sifirla();
      }
    });
  });
})();
