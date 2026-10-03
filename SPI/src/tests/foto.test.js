/* Fotoğraf — depo (core/foto.js), geri sayımlı kamera (core/kamera.js)
   ve minik kare (screens/fotoui.js). Testler ayrı bir IndexedDB ile
   çalışır; kamera akışı tuvalden üretilen gerçek bir MediaStream'dir. */

(function(){
  const { describe, it, expect, resetState, pushMeal } = SP.Test;
  const F = SP.Foto, KM = SP.Kamera;
  const TEST_DB = 'spi-foto-test';
  const bekle = ms => new Promise(r => setTimeout(r, ms || 0));
  async function kadar(kosul, ms){
    for(let i = 0; i < (ms || 3000) / 20; i++){ if(kosul()) return true; await bekle(20); }
    return false;
  }

  /* w×h renkli bir görsel → Blob. */
  function gorsel(w, h, tur){
    const t = document.createElement('canvas');
    t.width = w; t.height = h;
    const g = t.getContext('2d');
    g.fillStyle = '#2a7'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.fillRect(w / 4, h / 4, w / 2, h / 2);
    return new Promise(r => t.toBlob(r, tur || 'image/png'));
  }
  async function boyut(blob){
    const b = await createImageBitmap(blob);
    return [b.width, b.height];
  }

  /* Her test temiz bir test deposuyla başlar ve onu bırakır. */
  async function depoyla(fn){
    const eskiAd = F._ortam.dbAd, eskiIdb = F._ortam.idb;
    F._sifirla();
    F._ortam.dbAd = TEST_DB;
    await new Promise(r => { const q = indexedDB.deleteDatabase(TEST_DB); q.onsuccess = q.onerror = q.onblocked = r; });
    try{ await F.hazirla(); await fn(); }
    finally{
      F._sifirla();
      F._ortam.dbAd = eskiAd; F._ortam.idb = eskiIdb;
    }
  }

  describe('Foto — depo', () => {
    it('büyük fotoğraf 1080 piksele küçülür, JPEG olur; geri okunur ve silinir', () => depoyla(async () => {
      const r = await F.kaydet('hareket:squat', await gorsel(2000, 1500));
      expect(r.ok).toBe(true);
      expect(F.url('hareket:squat')).toContain('blob:');
      const b = await F.al('hareket:squat');
      expect(b.type).toBe('image/jpeg');
      expect(await boyut(b)).toEqual([1080, 810]);
      await F.sil('hareket:squat');
      expect(F.url('hareket:squat')).toBeNull();
      expect(await F.al('hareket:squat')).toBeNull();
    }));

    it('küçük fotoğraf büyütülmez; yenisi eskisinin yerine geçer', () => depoyla(async () => {
      await F.kaydet('besin:a', await gorsel(300, 200));
      const ilk = F.url('besin:a');
      await F.kaydet('besin:a', await gorsel(120, 160));
      expect(F.url('besin:a') !== ilk).toBe(true);
      expect(await boyut(await F.al('besin:a'))).toEqual([120, 160]);
    }));

    it('açılışta depo yeniden okunur (sayfa yenilenmiş gibi)', () => depoyla(async () => {
      await F.kaydet('vucut:2026-10-01', await gorsel(50, 50));
      F._sifirla();
      F._ortam.dbAd = TEST_DB;
      await F.hazirla();
      expect(F.url('vucut:2026-10-01')).toContain('blob:');
    }));

    it('profiller karışmaz', () => depoyla(async () => {
      await F.kaydet('hareket:squat', await gorsel(50, 50));
      const eski = localStorage.getItem('spi.activeProfile');
      try{
        localStorage.setItem('spi.activeProfile', 'baska-profil');
        expect(F.url('hareket:squat')).toBeNull();
        expect(F.sahipler('hareket:')).toHaveLength(0);
      }finally{
        if(eski == null) localStorage.removeItem('spi.activeProfile');
        else localStorage.setItem('spi.activeProfile', eski);
      }
      expect(F.url('hareket:squat')).toContain('blob:');
    }));

    it('sahipler en yenisi başta sıralanır', () => depoyla(async () => {
      for(const g of ['2026-09-01', '2026-10-02', '2026-09-15']) await F.kaydet('vucut:' + g, await gorsel(20, 20));
      await F.kaydet('besin:x', await gorsel(20, 20));
      expect(F.sahipler('vucut:')).toEqual(['vucut:2026-10-02', 'vucut:2026-09-15', 'vucut:2026-09-01']);
    }));

    /* «Bütün veriyi sil» fotoğrafları da siler; başka profilinkine dokunmaz. */
    it('temizle yalnız bu profilin fotoğraflarını siler', () => depoyla(async () => {
      const eski = localStorage.getItem('spi.activeProfile');
      const geriKoy = () => { if(eski == null) localStorage.removeItem('spi.activeProfile'); else localStorage.setItem('spi.activeProfile', eski); };
      try{
        localStorage.setItem('spi.activeProfile', 'baska-profil');
        await F.kaydet('hareket:squat', await gorsel(20, 20));
        geriKoy();
        await F.kaydet('hareket:squat', await gorsel(20, 20));
        await F.kaydet('ogun:o1', await gorsel(20, 20));
        expect(await F.temizle()).toBe(2);
        expect(F.url('hareket:squat')).toBeNull();
        localStorage.setItem('spi.activeProfile', 'baska-profil');
        F._sifirla(); F._ortam.dbAd = TEST_DB; await F.hazirla();
        expect(F.url('hareket:squat')).toContain('blob:');
      }finally{ geriKoy(); }
    }));

    it('yedek kartı fotoğrafların yedeğe girmediğini söyler', () => depoyla(async () => {
      resetState();
      /* Sahte depoda sağlık özeti yok; «Veri» bölümü onsuz çizilemez. */
      SP.Store.health = () => ({ mode:'local', cloud:'off', local:'ok', lastError:null, pendingCloudWrites:0 });
      const d = document.createElement('div');
      const html0 = String(await SP.Screens.guide.render());
      expect(html0.indexOf('Kapladığı alan') >= 0).toBe(true);
      expect(html0.indexOf('yedeğe girmez') < 0).toBe(true);
      await F.kaydet('vucut:2026-10-01', await gorsel(20, 20));
      d.innerHTML = String(await SP.Screens.guide.render());
      expect(d.textContent).toContain('Fotoğraf · yedeğe girmez');
    }));

    it('fotoğraf olmayan ya da bozuk dosya söylenir', () => depoyla(async () => {
      expect((await F.kaydet('x', new Blob(['abc'], { type:'text/plain' }))).why).toBe('Bu bir fotoğraf değil.');
      expect((await F.kaydet('x', new Blob(['bozuk'], { type:'image/png' }))).why).toBe('Fotoğraf okunamadı.');
      expect(F.url('x')).toBeNull();
    }));

    it('depo açılamazsa kare çizilmez, kaydetme nedenini söyler', () => depoyla(async () => {
      F._sifirla();
      F._ortam.idb = () => null;
      expect(await F.hazirla()).toBe(false);
      expect(F.var()).toBe(false);
      expect((await F.kaydet('x', await gorsel(20, 20))).why).toContain('saklayamıyor');
      expect(String(SP.FotoUI.kutu({ sahip:'x', ad:'X' }))).toBe('');
    }));
  });

  /* ---------------------------------------------------------- kamera */

  /* Sahte kamera: tuvalden gerçek bir akış. */
  let eskiKamera = null, cizici = null;
  function kameraKur(o){
    o = o || {};
    eskiKamera = Object.assign({}, KM._ortam);
    const bipler = [];
    KM._ortam.bip = f => bipler.push(f);
    KM._ortam.guvenli = () => o.guvenli !== false;
    KM._ortam.bekle = o.bekle || (() => Promise.resolve());
    KM._ortam.medya = () => (o.medya === null ? null : {
      getUserMedia:async () => {
        if(o.red) throw Object.assign(new Error('red'), { name:o.red });
        const t = document.createElement('canvas');
        t.width = 320; t.height = 240;
        const g = t.getContext('2d');
        let n = 0;
        cizici = setInterval(() => { g.fillStyle = n++ % 2 ? '#357' : '#368'; g.fillRect(0, 0, 320, 240); }, 30);
        return t.captureStream(30);
      },
    });
    return bipler;
  }
  function kameraBirak(){
    const a = KM._acik();
    if(a) a.kapat(null);
    clearInterval(cizici);
    Object.assign(KM._ortam, eskiKamera);
    try{ localStorage.removeItem('spi.kamera.sure.arka'); localStorage.removeItem('spi.kamera.sure.on'); }catch(e){}
  }
  async function kameraIle(o, fn){
    const bipler = kameraKur(o);
    try{ await fn(bipler); } finally{ kameraBirak(); }
  }
  const kam = () => document.getElementById('kamera');
  const tikla = sec => kam().querySelector(sec).click();
  const hazirMi = () => kam() && kam().querySelector('.kamera__video').videoWidth > 0;

  describe('Kamera — geri sayım', () => {
    it('3 sn seçilince üç bip, çekişte ince bip; «Kullan» JPEG döner, kamera kapanır', () => kameraIle({}, async bipler => {
      const p = KM.cek({ baslik:'Deneme', yon:'environment' });
      expect(await kadar(hazirMi)).toBe(true);
      const iz = kam().querySelector('.kamera__video').srcObject.getVideoTracks()[0];
      tikla('[data-k="sure"][data-v="3"]');
      expect(kam().querySelector('[data-v="3"]').getAttribute('aria-pressed')).toBe('true');
      tikla('[data-k="cek"]');
      expect(await kadar(() => !kam().querySelector('.kamera__satir--sonuc').hidden)).toBe(true);
      expect(bipler).toEqual([880, 880, 880, 1320]);
      tikla('[data-k="kullan"]');
      const b = await p;
      expect(b.type).toBe('image/jpeg');
      expect(b.size > 0).toBe(true);
      expect(kam()).toBeNull();
      expect(iz.readyState).toBe('ended');
    }));

    it('sayım sırasında ekrana dokunmak sayımı keser, fotoğraf çekilmez', async () => {
      let sal = null;
      await kameraIle({ bekle:() => new Promise(r => { sal = r; }) }, async bipler => {
        const p = KM.cek({ yon:'environment' });
        expect(await kadar(hazirMi)).toBe(true);
        tikla('[data-k="sure"][data-v="10"]');
        tikla('[data-k="cek"]');
        expect(kam().classList.contains('is-sayiyor')).toBe(true);
        expect(kam().querySelector('.kamera__sayi').textContent).toBe('10');
        kam().querySelector('.kamera__video').click();
        sal();
        await bekle(30);
        expect(kam().classList.contains('is-sayiyor')).toBe(false);
        expect(bipler).toEqual([880]);
        expect(kam().querySelector('.kamera__satir--sonuc').hidden).toBe(true);
        tikla('[data-k="kapat"]');
        expect(await p).toBeNull();
      });
    });

    it('«Yeniden» önizlemeyi bırakır, kameraya döner', () => kameraIle({}, async () => {
      KM.cek({ yon:'environment' });
      expect(await kadar(hazirMi)).toBe(true);
      tikla('[data-k="sure"][data-v="0"]');
      tikla('[data-k="cek"]');
      expect(await kadar(() => !kam().querySelector('.kamera__satir--sonuc').hidden)).toBe(true);
      tikla('[data-k="yeniden"]');
      expect(kam().querySelector('.kamera__satir--cek').hidden).toBe(false);
      expect(kam().querySelector('.kamera__onizleme').hidden).toBe(true);
    }));

    it('galeriden seçilen fotoğraf önizlenir ve döner', () => kameraIle({}, async () => {
      const p = KM.cek({ yon:'environment' });
      expect(await kadar(hazirMi)).toBe(true);
      const f = new File([await gorsel(40, 30, 'image/jpeg')], 'g.jpg', { type:'image/jpeg' });
      const dt = new DataTransfer(); dt.items.add(f);
      const girdi = kam().querySelector('.kamera__galeri input');
      girdi.files = dt.files;
      girdi.dispatchEvent(new Event('change', { bubbles:true }));
      tikla('[data-k="kullan"]');
      expect(await p).toBe(f);
    }));

    it('geri sayım seçimi yön başına hatırlanır; ön kamerada varsayılan 5 sn', () => kameraIle({}, async () => {
      KM.cek({ yon:'user' });
      expect(KM._acik()._durum().sure).toBe(5);
      tikla('[data-k="sure"][data-v="10"]');
      tikla('[data-k="kapat"]');
      KM.cek({ yon:'user' });
      expect(KM._acik()._durum().sure).toBe(10);
      tikla('[data-k="kapat"]');
      KM.cek({ yon:'environment' });
      expect(KM._acik()._durum().sure).toBe(0);
    }));

    it('Esc kamerayı kapatır', () => kameraIle({}, async () => {
      const p = KM.cek({ yon:'environment' });
      document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(await p).toBeNull();
      expect(kam()).toBeNull();
    }));
  });

  describe('Kamera — açılamazsa', () => {
    it('güvensiz bağlantıda neden söylenir; telefonun kamerası tek dokunuşta', () => kameraIle({ guvenli:false }, async () => {
      const p = KM.cek({ yon:'user' });
      await bekle(10);
      const m = kam().querySelector('.kamera__mesaj');
      expect(m.hidden).toBe(false);
      expect(m.textContent).toContain('https');
      expect(m.querySelector('input[capture="user"]')).toBeTruthy();
      expect(kam().querySelector('[data-k="cek"]').disabled).toBe(true);
      tikla('[data-k="kapat"]');
      expect(await p).toBeNull();
    }));

    it('izin reddedilirse bu söylenir', () => kameraIle({ red:'NotAllowedError' }, async () => {
      KM.cek({ yon:'environment' });
      expect(await kadar(() => !kam().querySelector('.kamera__mesaj').hidden)).toBe(true);
      expect(kam().querySelector('.kamera__mesaj').textContent).toContain('Kamera izni verilmedi');
    }));
  });

  /* -------------------------------------------------------- ekran bağları */

  describe('Foto — ekranlarda minik kare', () => {
    async function sessiz(fn){
      const ciz = SP.App.render, bil = SP.UI.toast, t = [];
      SP.App.render = () => {}; SP.UI.toast = x => t.push(x);
      try{ await fn(); } finally{ SP.App.render = ciz; SP.UI.toast = bil; }
      return t;
    }
    const kagit = () => document.getElementById('sheet');
    const exId = () => SP.EXERCISES.find(e => e.area === 'kuvvet' || e.kind === 'strength').id;

    it('hareket kartında boş kare kamerayı açar; fotoğraf varsa küçük resim, dokununca büyük', () => depoyla(async () => {
      resetState();
      const id = exId();
      const d = document.createElement('div');
      d.innerHTML = await SP.Screens.move.render();
      expect(d.querySelector('[data-act="foto-cek"][data-sahip="hareket:' + id + '"]')).toBeTruthy();
      await F.kaydet('hareket:' + id, await gorsel(60, 60));
      d.innerHTML = await SP.Screens.move.render();
      const kare = d.querySelector('[data-act="foto-ac"][data-sahip="hareket:' + id + '"]');
      expect(kare.querySelector('img').getAttribute('src')).toContain('blob:');
      expect(kare.getAttribute('aria-label')).toContain('fotoğrafı aç');
      await sessiz(async () => { await SP.FotoUI.handle['foto-ac'](kare); });
      expect(kagit().querySelector('img.foto-buyuk')).toBeTruthy();
      SP.UI.closeSheet();
    }));

    it('boş kare: kamerada çekilen fotoğraf kaydedilir; vazgeçilirse hiçbir şey olmaz', () => depoyla(async () => {
      const eski = KM.cek;
      try{
        KM.cek = async () => null;
        await sessiz(async () => { await SP.FotoUI.handle['foto-cek']({ dataset:{ sahip:'besin:q', ad:'Q', yon:'environment' } }); });
        expect(F.url('besin:q')).toBeNull();
        const b = await gorsel(30, 30);
        KM.cek = async () => b;
        await sessiz(async () => { await SP.FotoUI.handle['foto-cek']({ dataset:{ sahip:'besin:q', ad:'Q', yon:'environment' } }); });
        expect(F.url('besin:q')).toContain('blob:');
      }finally{ KM.cek = eski; }
    }));

    it('silinen fotoğraf «Geri al» ile yerine gelir', () => depoyla(async () => {
      resetState();
      await F.kaydet('vucut:2026-10-01', await gorsel(30, 30));
      const t = await sessiz(async () => {
        await SP.FotoUI.handle['foto-sil']({ dataset:{ sahip:'vucut:2026-10-01', ad:'V', yon:'user' } });
      });
      expect(F.url('vucut:2026-10-01')).toBeNull();
      expect(t[0]).toBe('Fotoğraf silindi');
      await SP.S.ui.undo.restore();
      expect(F.url('vucut:2026-10-01')).toContain('blob:');
    }));

    it('öğün silinince fotoğrafı da silinir', () => depoyla(async () => {
      resetState();
      const m = pushMeal(SP.U.todayISO(), 'kahvalti', [['mercimek-corbasi', 250]]);
      await F.kaydet('ogun:' + m.id, await gorsel(30, 30));
      const d = document.createElement('div');
      SP.S.route = 'meals';
      d.innerHTML = await SP.Screens.meals.render();
      expect(d.querySelector('[data-act="foto-ac"][data-sahip="ogun:' + m.id + '"]')).toBeTruthy();
      await sessiz(async () => { await SP.Screens.meals.handle['del-meal']({ dataset:{ id:m.id } }); });
      expect(F.url('ogun:' + m.id)).toBeNull();
    }));

    it('İlerleme › Vücut: ilk kare bugünündür', () => depoyla(async () => {
      resetState();
      const d = document.createElement('div');
      d.innerHTML = await SP.Screens.move.render();
      expect(d.querySelector('[data-sahip="vucut:' + SP.U.todayISO() + '"][data-yon="user"]')).toBeTruthy();
    }));

    it('kamerayla çekilen fotoğraf ekranın kendi dosya eylemine gider', () => depoyla(async () => {
      resetState();
      const eskiCek = KM.cek, ch = SP.Screens.meals.change, eskiFn = ch['meal-photo'], gelen = [];
      const b = await gorsel(30, 30, 'image/jpeg');
      KM.cek = async () => b;
      ch['meal-photo'] = async el => { gelen.push(el.files[0]); };
      const dug = document.createElement('div');
      dug.innerHTML = String(SP.C.Drop({ act:'meal-photo', label:'Yemek fotoğrafı', accept:'image/*', kamera:{} }));
      document.body.appendChild(dug);
      SP.S.route = 'meals';
      try{
        dug.querySelector('[data-act="kamera-drop"]').click();
        expect(await kadar(() => gelen.length > 0, 2000)).toBe(true);
        expect(gelen[0] instanceof File).toBe(true);
        expect(gelen[0].type).toBe('image/jpeg');
      }finally{
        KM.cek = eskiCek; ch['meal-photo'] = eskiFn; dug.remove(); SP.S.route = 'today';
      }
    }));
  });
})();
