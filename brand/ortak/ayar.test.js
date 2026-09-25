/* Ayar — T5 (ekip/EKIP-PLANI.md §4.2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ayar.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler (katalog numarasıyla): «Kaydet»li kutuda değişen alan
   noktalanır ve şerit kaç değişiklik olduğunu söyler; anında uygulanan alan
   (`data-change`) sayılmaz; Vazgeç ilk değere döner; yeniden çizimde yazılan
   değer kaybolmaz, «Kaydet»e basıldıktan sonra geri konmaz; Ayarlar dışında
   hiçbiri çalışmaz (21). Varsayılandan farklı alanın altında varsayılan ve
   tek düğme durur; düğme değeri geri koyup alanın kendi olayını atar (182).
   Arama alan adından tam yolu verir, Türkçe harfe duyarsızdır, sonucu
   modüle göre gruplar ve kaçışlar (183). Tema seçici üç örneği yan yana
   çizer, varsayılan dışındayken geri dönüş düğmesini taşır; açık örneğin
   adlı jetonları gerçek açık değerlere eşittir (181). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const A = window.LIFEOS.AYAR;

  function form(){
    const d = document.createElement('div');
    d.innerHTML = '<div class="card">'
      + '<label class="field"><span>Ad</span><input id="t-ad" value="Deniz"></label>'
      + '<label class="field"><span>Kapasite</span><input id="t-kap" type="number" value="20"></label>'
      + '<label class="field"><span>Tema</span><select id="t-tema" data-change="x">'
      +   '<option value="system" selected>Sistem</option><option value="dark">Koyu</option></select></label>'
      + '<button data-act="save-profile">Kaydet</button></div>';
    document.body.appendChild(d);
    return d;
  }
  function seritYazi(){ const s = document.querySelector('.ayar-serit'); return s ? s.textContent : ''; }

  describe('Ayar (T5)', () => {
    it('oz-021 değişen alan noktalanır, şerit sayar; anında uygulanan sayılmaz; Vazgeç geri koyar', () => {
      const d = form();
      try{
        A.sonra(d, { rota:'t-ayar', etkin:true });
        expect(seritYazi()).toBe('');
        d.querySelector('#t-ad').value = 'Ece';
        d.querySelector('#t-tema').value = 'dark';
        expect(A.tara(d)).toBe(1);
        expect(d.querySelector('#t-ad').closest('.field').classList.contains('is-degisti')).toBe(true);
        expect(d.querySelector('#t-tema').closest('.field').classList.contains('is-degisti')).toBe(false);
        expect(seritYazi()).toContain('1 değişiklik kaydedilmedi');
        expect(A.vazgec(d)).toBe(0);
        expect(d.querySelector('#t-ad').value).toBe('Deniz');
        expect(seritYazi()).toBe('');
      }finally{ A.sonra(d, { rota:'t-ayar', etkin:false }); d.remove(); }
    });

    it('oz-021 yeniden çizimde yazılan kaybolmaz; Ayarlar dışında çalışmaz', () => {
      const d = form();
      try{
        A.sonra(d, { rota:'t-ayar2', etkin:true });
        d.querySelector('#t-kap').value = '25';
        A.tara(d);
        const cizim = d.innerHTML;                            // değer özniteliği ilk değerde kalır
        A.once(d);
        d.innerHTML = cizim;                                  // aynı ekran baştan çizildi
        expect(d.querySelector('#t-kap').value).toBe('20');
        expect(A.sonra(d, { rota:'t-ayar2', etkin:true })).toBe(1);
        expect(d.querySelector('#t-kap').value).toBe('25');
        A.vazgec(d);
        d.querySelector('#t-kap').value = '30';
        expect(A.sonra(d, { rota:'t-baska', etkin:false })).toBe(0);
        expect(seritYazi()).toBe('');
      }finally{ A.sonra(d, { rota:'t-ayar2', etkin:false }); d.remove(); }
    });

    it('oz-021 «Kaydet»e basınca değer bir sonraki çizimde geri konmaz', () => {
      const d = form();
      try{
        A.kur();
        A.sonra(d, { rota:'t-ayar3', etkin:true });
        d.querySelector('#t-kap').value = '1.50';
        A.tara(d);
        d.querySelector('[data-act="save-profile"]').click();
        A.once(d);
        d.innerHTML = '<div class="card"><label class="field"><span>Kapasite</span><input id="t-kap" type="number" value="1.5"></label>'
          + '<button data-act="save-profile">Kaydet</button></div>';
        expect(A.sonra(d, { rota:'t-ayar3', etkin:true })).toBe(0);
        expect(d.querySelector('#t-kap').value).toBe('1.5');
      }finally{ A.sonra(d, { rota:'t-ayar3', etkin:false }); d.remove(); }
    });

    it('oz-182 varsayılandan farklı alanın altında varsayılan ve tek düğme; dönüş olay atar', () => {
      const d = document.createElement('div');
      d.innerHTML = '<label class="field"><span>Aralık</span><input id="t-ara" type="number" value="30"'
        + ' data-change="x" data-varsayilan="60" data-varsayilan-ad="60 dakika"></label>'
        + '<label class="field"><span>Kapsam</span><select id="t-kps" data-change="x" data-varsayilan="ozet">'
        + '<option value="ozet" selected>Özet</option><option value="gelismis">Gelişmiş</option></select></label>';
      document.body.appendChild(d);
      let olay = 0;
      d.querySelector('#t-ara').addEventListener('change', () => olay++);
      try{
        expect(A.varsayilanlar(d)).toBe(1);
        const not = d.querySelector('.ayar-varsayilan');
        expect(not.textContent).toContain('Varsayılan: 60 dakika');
        expect(not.querySelectorAll('button').length).toBe(1);
        expect(d.querySelector('#t-ara').closest('.field').classList.contains('is-varsayilandan')).toBe(true);
        expect(A.varsayilanaDon('t-ara')).toBe(true);
        expect(d.querySelector('#t-ara').value).toBe('60');
        expect(olay).toBe(1);
      }finally{ d.remove(); }
    });

    it('oz-183 arama tam yolu verir, Türkçe harfe duyarsız, modüle göre gruplar, kaçışlar', () => {
      const html = '<section class="kutu"><header><h2 class="kutu__ad">HKM işareti<button class="hint">i</button></h2></header>'
        + '<label class="field"><span>En sık kaç dakikada bir</span><input id="x-int"></label>'
        + '<label class="field"><span>Görünüm <span class="hint-text">ipucu</span></span><select id="x-tema"></select></label></section>';
      const d = A.dizin('AYS', [{ route:'guide', ad:'Genel', html }]);
      expect(d.length).toBe(2);
      const s = A.ara(d, 'dakika');
      expect(s.length).toBe(1);
      expect(s[0].yol).toBe('AYS › Ayarlar › Genel › HKM işareti › En sık kaç dakikada bir');
      expect(s[0].alan).toBe('x-int');
      expect(A.ara(d, 'GORUNUM').length).toBe(1);
      expect(A.ara(d, 'g').length).toBe(0);
      const h = A.aramaSonucu(A.ara(d, 'görünüm').concat([{ modul:'<SPİ>', route:'r', alan:'a', ad:'x', yol:'y' }]));
      expect(h).toContain('ayar-ara__modul">AYS');
      expect(h).toContain('&lt;SPİ&gt;');
      expect(A.aramaSonucu([])).toContain('Bu adla bir ayar yok');
      expect(A.aramaKutusu()).toContain('type="search"');
    });

    it('oz-181 tema seçici üç örnek yan yana; varsayılan dışındayken geri dönüş', () => {
      const d = document.createElement('div');
      d.innerHTML = String(NS.C.TemaSecici({ value:'dark', act:'set-theme' }));
      document.body.appendChild(d);
      try{
        const b = d.querySelectorAll('.temasec__secenek');
        expect(b.length).toBe(3);
        expect(d.querySelectorAll('.tema-ornek').length).toBe(3);
        expect(d.querySelector('.is-on').getAttribute('data-theme')).toBe('dark');
        const geri = d.querySelector('.ayar-varsayilan button');
        expect(geri.getAttribute('data-theme')).toBe('system');
        /* 182'nin temizliği bileşenin kendi notunu silmez. */
        A.varsayilanlar(d);
        expect(d.querySelectorAll('.ayar-varsayilan').length).toBe(1);
        expect(geri.getAttribute('data-value')).toBe('system');
        d.innerHTML = String(NS.C.TemaSecici({ value:'system' }));
        expect(d.querySelectorAll('.ayar-varsayilan').length).toBe(0);
      }finally{ d.remove(); }
    });

    it('oz-181 açık örneğin jetonları gerçek açık değerlerle aynı', () => {
      const kok = document.documentElement;
      const eski = kok.getAttribute('data-theme');
      kok.setAttribute('data-theme', 'light');
      try{
        const cs = getComputedStyle(kok);
        const v = ad => cs.getPropertyValue(ad).trim().toLowerCase();
        expect(v('--l-bg')).toBe(v('--bg'));
        expect(v('--l-surface')).toBe(v('--surface'));
        expect(v('--l-text')).toBe(v('--text'));
        expect(v('--l-text-3')).toBe(v('--text-3'));
        expect(v('--l-border')).toBe(v('--border'));
      }finally{ if(eski == null) kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', eski); }
    });
  });
})();
