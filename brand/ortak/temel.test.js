/* Temel bileşenler — v4 (ekip/EKIP-PLANI.md T1; katalog 02, 162, 165).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/temel.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: kutunun iskeleti her ekranda aynıdır ve sağda K'nin
   dolduracağı kesinlik yuvası hep durur (02); modül renksiz de ayırt edilir
   — renk + harf + şekil (165); alt çekmece telefonda tutamak taşır (162);
   dolu düğme bölümün değil modülün rengindedir (v4 renk sahipliği). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const C = NS.C;

  function yerlestir(htmlMetin){
    const d = document.createElement('div');
    d.innerHTML = String(htmlMetin);
    document.body.appendChild(d);
    return d;
  }

  describe('Temel bileşenler (T1)', () => {
    it('oz-002 kutu iskeleti: simge · ad · sağda kesinlik yuvası', () => {
      const d = yerlestir(C.Kutu({ simge:'check', ad:'Özet', yuva:'bugün', govde:'içerik' }));
      const k = d.querySelector('.kutu');
      expect(k.getAttribute('data-oz')).toBe('002');
      expect(k.querySelector('.kutu__bas .kutu__ad').textContent).toContain('Özet');
      expect(k.querySelector('.kutu__bas .kutu__yuva').textContent).toBe('bugün');
      expect(k.querySelector('.kutu__govde').textContent).toBe('içerik');
      /* Yuva boşken de durur: K'nin kesinlik glifi hep aynı yere düşer. */
      const d2 = yerlestir(C.Kutu({ ad:'Seri', govde:'—' }));
      expect(!!d2.querySelector('.kutu__yuva')).toBe(true);
      /* Kart gölgesi yok (v4): gölge yalnız açılır katmanda. */
      expect(getComputedStyle(k).boxShadow).toBe('none');
      d.remove(); d2.remove();
    });

    it('oz-165 modül renksiz de ayırt edilir: renk + harf + şekil', () => {
      const d = yerlestir(['ays', 'spi', 'esp', 'mer'].map(m => String(C.ModulIsareti(m))).join(''));
      const e = Array.from(d.querySelectorAll('.modis'));
      expect(e.map(x => x.textContent).join('')).toBe('ASEM');
      expect(e.map(x => x.getAttribute('aria-label')).join(',')).toBe('AYS,SPİ,ESP,Merkez');
      expect(e.every(x => x.getAttribute('data-oz') === '165')).toBe(true);
      /* Şekil dört modülde dört farklıdır (kare · daire · karo · altıgen). */
      const sekil = e.map(x => { const s = getComputedStyle(x); return s.borderRadius + '|' + s.clipPath; });
      expect(new Set(sekil).size).toBe(4);
      expect(String(C.ModulIsareti('yok'))).toBe('');
      d.remove();
    });

    it('oz-162 alt çekmece telefonda tutamak taşır', () => {
      let bulundu = false;
      for(const ss of Array.from(document.styleSheets)){
        let kurallar = [];
        try{ kurallar = Array.from(ss.cssRules || []); }catch(e){ continue; }
        for(const r of kurallar){
          if(r.media && /max-width:\s*679px/.test(r.media.mediaText)){
            for(const ic of Array.from(r.cssRules || [])){
              if(/\.sheet::before/.test(ic.selectorText || '')) bulundu = true;
            }
          }
        }
      }
      expect(bulundu).toBe(true);
    });

    it('dolu düğme modülün rengindedir; siyah düğme mürekkep', () => {
      const d = yerlestir(String(C.Button({ label:'Başla', tone:'primary', act:'x' }))
        + String(C.Button({ label:'Ekle', tone:'ink', act:'y' })));
      const [a, b] = d.querySelectorAll('.btn');
      const kok = getComputedStyle(document.documentElement);
      const renk = v => { const t = document.createElement('i'); t.style.color = v; document.body.appendChild(t);
        const c = getComputedStyle(t).color; t.remove(); return c; };
      expect(getComputedStyle(a).backgroundColor).toBe(renk(kok.getPropertyValue('--primary').trim()));
      expect(b.classList.contains('btn--ink')).toBe(true);
      expect(getComputedStyle(b).backgroundColor).toBe(renk(kok.getPropertyValue('--ink').trim()));
      d.remove();
    });

    it('oz-019 iç sekme yok: bölümler alt alta, çubuk sayfa içi bağlantı', () => {
      const d = yerlestir(C.SayfaBolumleri({ act:'x-tab', aria:'Deneme bölümleri', bolumler:[
        { id:'a', ad:'Karşılaştırma', govde:'bir' }, { id:'b', ad:'Hata haritası', govde:'iki', sayi:3 },
        { id:'c', ad:'Boş', govde:'' }] }));
      /* Hiçbir bölüm saklanmaz; boş bölüm (gövdesi yok) çizilmez. */
      const s = d.querySelectorAll('section.sayfabolum');
      expect(s.length).toBe(2);
      expect(Array.from(s).map(x => x.querySelector('h2').textContent).join(',')).toBe('Karşılaştırma,Hata haritası');
      /* Sekme değil: rol yok, sekme sınıfı yok; eski eylem düğmede kalır. */
      expect(d.querySelectorAll('[role="tab"], .subtabs, .segmented').length).toBe(0);
      const b = d.querySelectorAll('.bolumcubugu--sayfa button');
      expect(b.length).toBe(2);
      expect(b[1].getAttribute('data-act')).toBe('x-tab');
      expect(b[1].getAttribute('data-tab')).toBe('b');
      expect(C.bolumeGit('b')).toBe(true);
      expect(document.activeElement.id).toBe('bl-b-ad');
      expect(C.bolumeGit('yok')).toBe(false);
      /* Tek bölümde çubuk çizilmez: tek seçenekli şerit gürültüdür. */
      const t = yerlestir(C.SayfaBolumleri({ act:'x', bolumler:[{ id:'z', ad:'Tek', govde:'g' }] }));
      expect(!!t.querySelector('nav')).toBe(false);
      d.remove(); t.remove();
    });

    it('ayrıntı katmanı: kısa cümle görünür, gerekçe bir dokunuşla açılır', () => {
      const d = yerlestir(C.Ayrinti({ ozet:'Kısa cümle.', govde:'Uzun gerekçe burada durur.' }));
      expect(d.querySelector('.ayrinti__ozet').textContent).toBe('Kısa cümle.');
      const det = d.querySelector('details');
      expect(det.open).toBe(false);
      expect(det.querySelector('summary').textContent).toBe('Neden?');
      /* Kapalıyken gerekçe görünmez ama silinmemiştir. */
      expect(det.querySelector('.ayrinti__govde').textContent).toBe('Uzun gerekçe burada durur.');
      expect(det.querySelector('.ayrinti__govde').checkVisibility()).toBe(false);
      d.remove();
    });

    /* §8-4 (kullanıcı kararı): paletler ve beş düzen kalktı. Bir stil
       sayfası yeniden `[data-palette]`/`[data-design]` kuralı taşırsa, tek
       tasarım sessizce ikiye ayrılır; bölüm rengi (--sec) de modülün
       rengidir, bölüme göre değişmez. */
    it('tek tasarım: palet ve düzen kuralı yok; bölüm rengi modül rengi', () => {
      let kural = 0;
      const tara = liste => Array.from(liste || []).forEach(r => {
        if(/data-(palette|design)/.test(r.selectorText || '')) kural++;
        if(r.cssRules) tara(r.cssRules);
      });
      Array.from(document.styleSheets).forEach(ss => { try{ tara(ss.cssRules); }catch(e){} });
      expect(kural).toBe(0);
      const kok = document.documentElement;
      const v = n => getComputedStyle(kok).getPropertyValue(n).trim();
      const renk = x => { const t = document.createElement('i'); t.style.color = x; document.body.appendChild(t);
        const c = getComputedStyle(t).color; t.remove(); return c; };
      expect(renk(v('--sec'))).toBe(renk(v('--primary')));
    });
  });
})();
