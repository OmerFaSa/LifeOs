/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/tekgun.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Tek gün — üç modülün bugünü tek çizelgede. Tek kaynak
   `brand/ortak/tekgun.test.js`. Kanıtlanan sözler (brand/ortak/tekgun.js):
     2. Saat uydurulmaz: saatli blok saatiyle, dilimli diliminde, ikisi de
        yoksa «Gün içinde»; sıralama saat, sonra modül sırası.
     3. Bayat plan bugünmüş gibi çizilmez; yayınlamayan modül söylenir.
     4. Sunucu yoksa yalnız kendi modül ve nedeni.
     5. Öteki modül adresiyle açılır; katalogda olmayan rota Bugün'e.
     Ek: sıradaki iş saatli açık işten seçilir; yayın parçası bugünün JSON'u. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const T = () => window.LIFEOS.TEKGUN;
  const SIMDI = new Date(2026, 9, 16, 9, 0);
  const BUGUN = '2026-10-16';

  function sahne(fn){
    const eski = Object.assign({}, T()._ortam);
    const eskiAyar = T().kuruluMu();
    const gidilen = [];
    T()._sifirla();
    Object.assign(T()._ortam, { simdi:() => SIMDI, girisVar:() => true, tekGun:async () => null,
      adres:m => 'http://pc:41' + ({ ays:'73', spi:'83', esp:'93' })[m] + '/', git:u => gidilen.push(u) });
    T().kur({ modul:'ays', git:r => gidilen.push('ays:' + r),
      bloklar:() => [{ id:'b0', ad:'Türev', alt:'75 dk', durum:'bekliyor', rota:'today' },
                     { id:'b1', ad:'Paragraf', durum:'bitti', rota:'today' }] });
    return Promise.resolve(fn(gidilen)).finally(() => {
      T()._sifirla(); Object.assign(T()._ortam, eski);
      if(eskiAyar){ /* modülün kendi kurulumu bir sonraki çizimde yeniden kurulur */ }
    });
  }
  const sunucu = (o) => ({ tarih:BUGUN, moduller:o });
  const yayin = (modul, bloklar, gun) => ({ modul, gun:gun || BUGUN, bayat:(gun || BUGUN) !== BUGUN, icerik:JSON.stringify({ s:1, bloklar }) });

  describe('Tek gün — birleştirme', () => {
    it('saatli blok saatinde, saatsiz «Gün içinde»; saat uydurulmaz', () => sahne(() => {
      const r = T().birlestir([{ id:'a', ad:'Türev', durum:'bekliyor' }],
        sunucu([yayin('spi', [{ ad:'Su', saat:'16:00', durum:'bekliyor' }, { ad:'Kahvaltı', dilim:'sabah', durum:'bitti' }]),
                yayin('esp', [{ ad:'Dil', saat:'08:30', durum:'bekliyor' }])]), SIMDI, 'ays');
      expect(r.satir.map(b => b.ad)).toEqual(['Dil', 'Kahvaltı', 'Su', 'Türev']);
      expect(r.satir.find(b => b.ad === 'Türev').saat).toBe(null);
      expect(r.satir.find(b => b.ad === 'Türev').dl).toBe('gun');
      expect(r.satir.find(b => b.ad === 'Su').dl).toBe('ogle');
    }));

    it('bayat plan çizilmez; yayınlamayan modül söylenir', () => sahne(() => {
      const r = T().birlestir([], sunucu([yayin('spi', [{ ad:'Su', saat:'16:00' }], '2026-10-15')]), SIMDI, 'ays');
      expect(r.satir.length).toBe(0);
      expect(r.notlar.join(' ')).toContain('SPİ bugün henüz açılmadı');
      expect(r.notlar.join(' ')).toContain('ESP henüz plan yayınlamadı');
    }));

    it('sıradaki: saati gelen ya da yaklaşan açık iş; yoksa saatsiz ilk açık iş', () => sahne(() => {
      let r = T().birlestir([{ ad:'Türev', durum:'bekliyor' }],
        sunucu([yayin('spi', [{ ad:'Su', saat:'08:00', durum:'bitti' }, { ad:'Hareket', saat:'10:00', durum:'bekliyor' }])]), SIMDI, 'ays');
      expect(r.satir.find(b => b.siradaki).ad).toBe('Hareket');
      r = T().birlestir([{ ad:'Türev', durum:'bekliyor' }, { ad:'Rutin', durum:'bitti' }], null, SIMDI, 'ays');
      expect(r.satir.find(b => b.siradaki).ad).toBe('Türev');
      /* Saati geçmiş ve işaretlenmemiş iş («vakti») yaklaşan işten önce gelir. */
      r = T().birlestir([], sunucu([yayin('spi', [{ ad:'Su 07', saat:'07:00', durum:'vakti' }, { ad:'Su 16', saat:'16:00', durum:'bekliyor' }])]), SIMDI, 'ays');
      expect(r.satir.find(b => b.siradaki).ad).toBe('Su 07');
    }));
  });

  describe('Tek gün — kart ve yayın', () => {
    it('öteki modülden iş gelmediyse kart çizilmez (modülün kendi kartının tekrarı olurdu)', () => sahne(() => {
      T()._ortam.girisVar = () => false;
      const k = document.createElement('div');
      k.innerHTML = T().kartHtml();
      const el = k.querySelector('[data-tekgun]');
      expect(el.hasAttribute('hidden')).toBe(true);
      expect(k.querySelectorAll('[data-tekgun-git]').length).toBe(0);
    }));

    it('sunucudan gelen öteki modül çizilir; dokununca adresiyle açılır, katalog dışı rota Bugün', () => sahne(async gidilen => {
      T()._ortam.tekGun = async () => sunucu([yayin('spi', [{ ad:'Su', saat:'16:00', rota:'today' }]), yayin('esp', [{ ad:'Dil', rota:'uydurma' }])]);
      await T().tazele();
      const k = document.createElement('div');
      k.innerHTML = T().kartHtml();
      document.body.appendChild(k);
      try{
        expect(k.textContent).toContain('Su');
        expect(k.textContent).toContain('3 modül');
        k.querySelector('[data-tekgun-git="spi|today"]').click();
        k.querySelector('[data-tekgun-git="esp|uydurma"]').click();
        k.querySelector('[data-tekgun-git="ays|today"]').click();
        expect(gidilen).toEqual(['http://pc:4183/#king=today', 'http://pc:4193/#king=today', 'ays:today']);
      }finally{ k.remove(); }
    }));

    /* Kullanıcı (2026-10-18): «SPİ'nin giriş sayfasında sözcükte anlam,
       bölünebilme kuralı ne alaka? SPİ ile alakalı şeyler olsun; ESP'de de
       aynı». Bugün yalnız o modülün işini gösterir; öteki modülün bloğu
       (AYS konusu, SPİ hatırlatması) Bugün'e girmez. Yayın sürer (Siri,
       Merkez), ekran sürmez. */
    it('Bugün öteki modülün işini göstermez (2026-10-18)', async () => {
      let kurduk = false;
      const eskiGet = T()._ortam.tekGun, eskiGiris = T()._ortam.girisVar;
      const yabanci = ['Sözcükte anlam', 'Bölünebilme kuralları', 'Su hatırlatması', 'Gitar'];
      const bugun = new Date(), gun = bugun.getFullYear() + '-' + String(bugun.getMonth() + 1).padStart(2, '0') + '-' + String(bugun.getDate()).padStart(2, '0');
      const yay = (modul, ad) => ({ modul, gun, bayat:false, icerik:JSON.stringify({ s:1, bloklar:[{ ad, durum:'bekliyor' }] }) });
      T()._ortam.girisVar = () => true;
      T()._ortam.tekGun = async () => ({ tarih:gun, moduller:[yay('ays', yabanci[0]), yay('ays', yabanci[1]), yay('spi', yabanci[2]), yay('esp', yabanci[3])] });
      try{
        const kendi = { R:'ays', SP:'spi', ESP:'esp' }[window.R ? 'R' : window.SP ? 'SP' : 'ESP'];
        kurduk = !T().kuruluMu();
        if(kurduk) T().kur({ modul:kendi, git:() => {}, bloklar:() => [] });
        await T().tazele();
        const h = String(await NS.Screens.today.render());
        expect(h.indexOf('data-tekgun') < 0).toBe(true);
        const oteki = { ays:[0, 1], spi:[2], esp:[3] };
        Object.keys(oteki).filter(m => m !== kendi).forEach(m => oteki[m].forEach(i => expect(h.indexOf(yabanci[i]) < 0).toBe(true)));
      }finally{ T()._ortam.tekGun = eskiGet; T()._ortam.girisVar = eskiGiris; if(kurduk) T()._sifirla(); }
    });

    it('yayın parçası bugünün JSON planı; bilinmeyen alan ve bozuk saat düşer', () => sahne(() => {
      T().kur({ modul:'spi', bloklar:() => [{ ad:'Su', saat:'25:99', durum:'garip', gizli:'ilaç adı' }] });
      const p = T().parca();
      expect(p.gun).toBe(BUGUN);
      const v = JSON.parse(p.metin);
      expect(v.bloklar[0]).toEqual({ id:'Su', ad:'Su', alt:'', saat:null, dilim:null, durum:'bekliyor', rota:null });
    }));
  });
})();
