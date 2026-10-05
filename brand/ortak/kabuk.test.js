/* Kabuk — v4 üst çubuk, gün şeridi, telefon bandı (belgeler/ekip/EKIP-PLANI.md T2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kabuk.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler (katalog numarasıyla): sekiz çekmece üç modülde aynı
   ad ve sırada; Onaylar'ın sayacı yalnız bekleyen varken ve morda (115);
   modül menüsü dört sistemi kendi işaretiyle gösterir, öteki sistemin
   adresini UYDURMAZ (08); bağlantı noktası kapalıyken «her şey çalışıyor»
   der (118); rütbe çipi bilinmeyen rütbeyi 0 diye çizmez (140); şimdi
   çizgisi saatin yerinde (151); modül şeridi (01); hafta (05); telefonda
   etiket sabit (163); gruplu bildirimler (09); alt bant (169, 166). */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const K = window.LIFEOS.KABUK;

  function yerlestir(htmlMetin){
    const d = document.createElement('div');
    d.innerHTML = String(htmlMetin);
    document.body.appendChild(d);
    return d;
  }
  function kuralVar(medya, secici){
    for(const ss of Array.from(document.styleSheets)){
      let kurallar = [];
      try{ kurallar = Array.from(ss.cssRules || []); }catch(e){ continue; }
      for(const r of kurallar){
        if(r.media && medya.test(r.media.mediaText)){
          for(const ic of Array.from(r.cssRules || [])){
            if(secici.test(ic.selectorText || '')) return ic;
          }
        }
      }
    }
    return null;
  }
  function renk(v){
    const t = document.createElement('i'); t.style.color = v; document.body.appendChild(t);
    const c = getComputedStyle(t).color; t.remove(); return c;
  }
  const kok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  describe('Kabuk (T2)', () => {
    /* Kullanıcı (2026-10-02): «sol üstteki ESP'yi ve o kutucuk işaretini
       sil». Üst şeritte kenar düğmesi yok, konum satırı yalnız ekran
       okuyucuda; kenar hep ince şerittir ve üzerine gelince açılır. */
    it('sol üst boş: kenar düğmesi yok, konum yalnız ekran okuyucuda, kenar ince şerit', () => {
      const eski = document.documentElement.classList.contains('kenar-dar');
      try{
        K.kenarDar(true);
        const d = yerlestir('<div class="site--v5">' + K.ustSerit({ modul:'esp', yol:['Çalışma', 'Okuma'] }) + '</div>');
        expect(!!d.querySelector('.ust__kenar, [data-kenar-ac]')).toBe(false);
        const yol = d.querySelector('.ust__yol');
        expect(!!yol).toBe(true);
        expect(yol.getAttribute('aria-label')).toBe('Konum');
        expect(yol.getBoundingClientRect().width <= 1).toBe(true);
        expect(yol.textContent).toContain('ESP');
        /* Çocuklar da 1×1 okuyucu metni: kendi «…» kesmeleri kırpılan içerik sayılmasın. */
        Array.from(yol.children).forEach(c => expect(c.clientWidth <= 1 && getComputedStyle(c).position === 'absolute').toBe(true));
        /* Dar şeritte görünen ad yok (2026-10-03: kapalıyken display:none,
           açılınca solarak gelir); erişilebilir ad düğmenin kendisinde,
           sayaç varsa adın yanında okunur. */
        const site = yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'ays',
          cekmeceler:[{ id:'bugun', ad:'Bugün', route:'today', on:true }, { id:'onaylar', ad:'Onaylar', route:'onaylar', sayac:3 }] }) + '</div>');
        const cek = site.querySelector('.kenar__cekmece');
        expect(cek.getAttribute('title')).toBe('Bugün');
        expect(cek.getAttribute('aria-label')).toBe('Bugün');
        expect(site.querySelector('[data-cekmece="onaylar"]').getAttribute('aria-label')).toBe('Onaylar, 3 bekleyen');
        if(window.innerWidth >= 680){
          expect(getComputedStyle(site.firstElementChild).gridTemplateColumns.split(' ')[0]).toBe('64px');
        }
        site.remove(); d.remove();
      }finally{ K.kenarDar(eski); try{ localStorage.removeItem('lifeos.kenar'); }catch(e){} }
    });

    it('sade: bölüm listesi yalnız çekmece değişince açılış hareketiyle gelir', () => {
      const ciz = id => yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'ays', cekmeceler:[
        { id:'bugun', ad:'Bugün', route:'today', on:id === 'bugun', bolumler:[{ route:'today', ad:'Genel bakış', on:true }, { route:'gun', ad:'Ayrıntı' }] },
        { id:'plan', ad:'Plan', route:'week', on:id === 'plan', bolumler:[{ route:'week', ad:'Hafta', on:true }, { route:'plan', ad:'Program' }] },
      ] }) + '</div>');
      const yeniMi = d => { const b = d.querySelector('.kenar__bolumler'); const v = b.classList.contains('is-yeni'); d.remove(); return v; };
      yeniMi(ciz('bugun'));
      expect(yeniMi(ciz('bugun'))).toBe(false);
      expect(yeniMi(ciz('plan'))).toBe(true);
      expect(yeniMi(ciz('plan'))).toBe(false);
    });

    /* Kullanıcı (2026-10-03): «şu daha fazla kısmını da kaldır, bir işe
       yaramıyor». Sekiz çekmece kenarda düz listede; hiçbiri kalkmaz. */
    it('sade: sekiz çekmece düz listede, «Daha fazla» yok; hiçbiri kalkmaz', () => {
      const cek = on => K.CEKMECELER.map(c => ({ id:c.id, ad:c.ad, route:c.id, on:c.id === on }));
      const d = yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'ays', cekmeceler:cek('ofis') }) + '</div>');
      try{
        expect(Array.from(d.querySelectorAll('.kenar__nav [data-cekmece]')).map(x => x.dataset.cekmece))
          .toEqual(K.CEKMECELER.map(c => c.id));
        expect(!!d.querySelector('.kenar__dahafazla, .kenar__dahafazla-dugme, .kenar__dahafazla-liste')).toBe(false);
        expect(d.querySelector('[data-cekmece="ofis"]').classList.contains('is-on')).toBe(true);
      }finally{ d.remove(); }
    });

    it('sade: kenar her zaman dar açılır; eski «açık» kaydı da dar (düğmesi yok)', () => {
      expect(K.kenarIlkDar(null)).toBe(true);
      expect(K.kenarIlkDar('dar')).toBe(true);
      expect(K.kenarIlkDar('acik')).toBe(true);
    });

    it('sekiz çekmece: ad ve sıra kullanıcı kararıyla aynı', () => {
      expect(K.CEKMECELER.map(c => c.ad).join(' · '))
        .toBe('Bugün · Plan · Çalışma · Analiz · Onaylar · Ofis · Kütüphanem · Ayarlar');
    });

    it('oz-115 Onaylar sayacı yalnız bekleyen varken ve morda', () => {
      const cek = [{ id:'bugun', ad:'Bugün', route:'today', on:true }, { id:'onaylar', ad:'Onaylar', route:'onaylar', sayac:2 }];
      const d = yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:cek, onay:{ sayi:2 } }));
      const s = d.querySelectorAll('.ust__nav .ust__sayac');
      expect(s.length).toBe(1);
      expect(s[0].textContent).toBe('2');
      expect(getComputedStyle(s[0]).backgroundColor).toBe(renk(kok('--mer-ink')));
      expect(d.querySelector('.ust__cekmece.is-on').getAttribute('aria-current')).toBe('page');
      const bos = yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:[{ id:'onaylar', ad:'Onaylar', route:'onaylar', sayac:0 }], onay:{ sayi:0 } }));
      expect(bos.querySelectorAll('.ust__sayac').length).toBe(0);
      expect(!!bos.querySelector('.ust__onay')).toBe(false);
      d.remove(); bos.remove();
    });

    it('oz-013 arama ⌘K komut paletini açar', () => {
      const d = yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:[] }));
      const a = d.querySelector('[data-oz="013"]');
      expect(a.getAttribute('data-act')).toBe('open-palette');
      expect(a.getAttribute('aria-label')).toContain('Ctrl+K');
      d.remove();
    });

    it('oz-008 modül menüsü dört sistemi gösterir; adresi uydurmaz', () => {
      const tek = { protocol:'http:', hostname:'127.0.0.1', port:'4173' };
      expect(K.adres('spi', tek)).toBe('http://127.0.0.1:4183/');
      expect(K.adres('mer', tek)).toBe('http://127.0.0.1:4200/');
      /* Tek dosya (file://) ya da bilinmeyen bir sunucu: adres YOK. */
      expect(K.adres('spi', { protocol:'file:', hostname:'', port:'' })).toBe(null);
      expect(K.adres('spi', { protocol:'https:', hostname:'ornek.com', port:'' })).toBe(null);

      const d = yerlestir(K.modulMenusu({ modul:'ays', loc:tek }));
      const satir = Array.from(d.querySelectorAll('.kmenu__satir'));
      expect(satir.length).toBe(4);
      expect(satir.map(s => s.querySelector('.modis').textContent).join('')).toBe('ASEM');
      expect(satir[0].classList.contains('is-bu')).toBe(true);
      expect(satir[1].getAttribute('href')).toBe('http://127.0.0.1:4183/');
      expect(satir[1].getAttribute('data-modul-gecis')).toBe('spi');
      const dosya = yerlestir(K.modulMenusu({ modul:'ays', loc:{ protocol:'file:', hostname:'', port:'' } }));
      expect(dosya.querySelectorAll('a.kmenu__satir').length).toBe(0);
      expect(dosya.textContent).toContain('ayrı dosyada açılır');
      d.remove(); dosya.remove();
    });

    it('oz-155 geçişte üst çizgi yeni sistemin rengini alır', () => {
      const d = yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:[] }));
      const ust = d.querySelector('.ust');
      ust.setAttribute('data-gecis', 'spi');
      expect(getComputedStyle(ust, '::before').backgroundColor).toBe(renk(kok('--spi')));
      d.remove();
    });

    it('oz-118 bağlantı noktası: kapalıyken «her şey çalışıyor»', () => {
      const b = durum => yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:[], baglanti:durum }));
      const acik = b({ durum:'bagli', saat:'14:08' });
      expect(acik.querySelector('[data-oz="118"]').getAttribute('aria-label')).toBe('Merkez bağlı · 14:08');
      expect(acik.querySelector('.ust__bag-saat').textContent).toBe('14:08');
      const kapali = b({ durum:'kapali' });
      expect(kapali.querySelector('[data-oz="118"]').getAttribute('aria-label')).toContain('her şey çalışıyor');
      const kopuk = b({ durum:'ulasilamadi', saat:'09:30' });
      expect(kopuk.querySelector('[data-oz="118"]').getAttribute('aria-label')).toContain('her şey çalışıyor');
      expect(!!kopuk.querySelector('.ust__bag-saat')).toBe(false);
      /* Açık ama hiç gönderilmemiş: «bağlı» denmez — ölçülmedi. */
      const yeni = b({ durum:'bekliyor' });
      expect(yeni.querySelector('[data-oz="118"]').getAttribute('aria-label')).toContain('henüz gönderim olmadı');
      acik.remove(); kapali.remove(); kopuk.remove(); yeni.remove();
    });

    it('oz-140 rütbe çipi Ayarlar › Rütbe\'ye açılır; bilinmeyen rütbe çizilmez', () => {
      const d = yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:[],
        rutbe:{ ad:'Bronz', etiket:'1.1', icinde:180, gereken:430, oran:180 / 430, kademe:1, route:'rutbe' } }));
      const r = d.querySelector('[data-oz="140"]');
      expect(r.getAttribute('data-route')).toBe('rutbe');
      expect(r.textContent).toContain('Bronz');
      expect(r.textContent).toContain('180/430');
      expect(r.querySelector('.ust__rutbe-cizgi i').style.width).toBe('42%');
      const yok = yerlestir(K.ustCubuk({ modul:'ays', cekmeceler:[], rutbe:{ etiket:'—' } }));
      expect(!!yok.querySelector('[data-oz="140"]')).toBe(false);
      d.remove(); yok.remove();
    });

    it('telefondaki rütbe düğmesi öteki simgeler gibi tek renk çizgi; renkli daire yok (2026-10-05)', () => {
      /* Kullanıcı: «bu tüm ambiyansı bozuyor, daha minimalist yap» — kademe
         renginde içi dolu daire, çerçevesiz çizgi simgelerin yanında göze
         batıyordu. Kademe adı ve etiketi düğmenin adında kalır. */
      const d = yerlestir(K.ustSerit({ modul:'spi', yol:['Bugün'],
        rutbe:{ ad:'Bronz', etiket:'1.1', renk:'#B87333', route:'rutbe' } }));
      const m = d.querySelector('.ust__madalya');
      expect(!!m).toBe(true);
      expect(!!m.querySelector('svg.kbk-ic')).toBe(true);
      expect(!!m.querySelector('.kenar__madalya')).toBe(false);
      expect(((m.getAttribute('style') || '') + m.innerHTML).indexOf('#B87333')).toBe(-1);
      expect(m.getAttribute('aria-label')).toContain('Bronz');
      expect(m.getAttribute('data-route')).toBe('rutbe');
      d.remove();
    });

    it('oz-151 şimdi çizgisi saatin yerinde; dilim dışında kenarda', () => {
      const saat = (h, m) => { const x = new Date(2026, 8, 24, h, m); return x; };
      expect(K.simdiOrani(saat(15, 0), 6, 24)).toBe(0.5);
      expect(K.simdiOrani(saat(3, 0), 6, 24)).toBe(0);
      expect(K.simdiOrani(saat(23, 59), 6, 22)).toBe(1);
      const d = yerlestir(K.gunSeridi({ tarih:'Per 24 Eyl', simdi:saat(15, 0) }));
      expect(d.querySelector('.gunserit__simdi').style.left).toBe('50%');
      expect(d.querySelector('.gunserit__gecmis').style.width).toBe('50%');
      expect(d.querySelector('.gunserit__simdi').textContent).toBe('15:00');
      d.remove();
    });

    it('oz-001 modül şeridi: bloklar sırayla, süreyle; durum sınıfta', () => {
      const d = yerlestir(K.gunSeridi({ simdi:new Date(2026, 8, 24, 12, 0), kalan:1, seritler:[
        { modul:'ays', ozet:'2/3 blok', bloklar:[{ ad:'Mat', dk:75, durum:'bitti' }, { ad:'Fizik', dk:65, durum:'suruyor' },
          { ad:'Paragraf', dk:40, durum:'bekliyor' }] },
        { modul:'yok', bloklar:[{ ad:'x', dk:10 }] },
      ] }));
      const s = d.querySelectorAll('.gunserit__serit');
      expect(s.length).toBe(1);
      const b = Array.from(s[0].querySelectorAll('.gunserit__blok'));
      expect(b.map(x => x.className.replace('gunserit__blok gunserit__blok--', '')).join(',')).toBe('bitti,suruyor,bekliyor');
      expect(b[0].style.flexGrow).toBe('75');
      expect(d.querySelector('.gunserit__kalan').textContent).toBe('1 iş kaldı');
      /* «kaç iş kaldı» bilinmiyorsa yazılmaz — 0 değildir. */
      const bos = yerlestir(K.gunSeridi({ simdi:new Date(), kalan:null }));
      expect(!!bos.querySelector('.gunserit__kalan')).toBe(false);
      d.remove(); bos.remove();
    });

    it('oz-005 tarihe dokununca yedi gün açılır', () => {
      const gunler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((ad, i) => ({ ad, gun:21 + i,
        bugun:i === 3, gelecek:i > 3, noktalar:[{ modul:'ays', durum:i < 3 ? 'tamam' : (i === 3 ? 'eksik' : 'gelecek') }] }));
      const kapali = yerlestir(K.gunSeridi({ simdi:new Date(), hafta:gunler, haftaAcik:false }));
      expect(kapali.querySelector('[data-act="hafta-ac"]').getAttribute('aria-expanded')).toBe('false');
      expect(!!kapali.querySelector('.gunserit__hafta')).toBe(false);
      const acik = yerlestir(K.gunSeridi({ simdi:new Date(), hafta:gunler, haftaAcik:true }));
      const g = acik.querySelectorAll('.gunserit__gun');
      expect(g.length).toBe(7);
      expect(g[3].getAttribute('aria-current')).toBe('date');
      expect(acik.querySelectorAll('.gunserit__nokta.is-tamam').length).toBe(3);
      kapali.remove(); acik.remove();
    });

    it('oz-163 telefonda şerit kayar, etiket solda sabit', () => {
      const r = kuralVar(/max-width:\s*679px/, /\.gunserit__etiket/);
      expect(!!r).toBe(true);
      expect(r.style.position).toBe('sticky');
    });

    it('oz-009 bildirimler modüle göre gruplu; Merkez ayrı kümede, sonda', () => {
      const d = yerlestir(K.bildirimPaneli({ gruplar:[
        { modul:'mer', satirlar:[{ metin:'2 öneri Onaylar\'da', route:'onaylar' }] },
        { modul:'ays', satirlar:[{ metin:'12 kart bekliyor', route:'cards', acil:true }] },
        { modul:'esp', satirlar:[] },
      ] }));
      const g = Array.from(d.querySelectorAll('.kmenu__grup'));
      expect(g.length).toBe(2);
      expect(g[0].classList.contains('kmenu__grup--ays')).toBe(true);
      expect(g[1].textContent).toContain('Merkez önerileri');
      expect(g[0].querySelector('[data-act="go"]').getAttribute('data-route')).toBe('cards');
      const bos = yerlestir(K.bildirimPaneli({ gruplar:[] }));
      expect(bos.textContent).toContain('Bekleyen bir şey yok.');
      d.remove(); bos.remove();
    });

    /* Kullanıcı (2026-10-03): «bildirim kısmı sol altta sıkışmasın, daha
       güzel tasarla». Kenardan açılınca ekranın boyunca bir yan çekmece. */
    it('bildirimler: başlık ve sayı; kenardan yan çekmece olarak açılır, sıkışmaz', () => {
      const d = yerlestir('<div class="site site--v5" style="position:fixed;inset:0;z-index:1">' + K.kenarCubugu({ modul:'ays', cekmeceler:[] }) + '</div>');
      try{
        const btn = d.querySelector('.kenar__dip [data-act="bildirim-ac"]');
        const p = K.katmanAc('kt-bil', K.bildirimPaneli({ gruplar:[
          { modul:'ays', satirlar:[{ metin:'12 kart bekliyor', route:'cards', acil:true }, { metin:'Deneme gir', route:'exams' }] }] }), btn);
        expect(p.querySelector('.bildirim__bas').textContent).toContain('Bildirimler');
        expect(p.querySelector('.bildirim__sayi').textContent.trim()).toBe('2');
        expect(!!p.querySelector('.kmenu__bildirim.is-acil .bildirim__acil')).toBe(true);
        const r = p.getBoundingClientRect();
        expect(Math.round(r.top)).toBe(12);
        expect(Math.round(window.innerHeight - r.bottom)).toBe(12);
        expect(r.width >= 340).toBe(true);
        expect(r.left >= d.querySelector('.kenar').getBoundingClientRect().left + 200).toBe(true);
      }finally{ K.katmanKapat(); d.remove(); }
    });

    it('oz-169 oz-166 telefonda dört sekme ve sağ altta +', () => {
      const d = yerlestir(K.altBant({ sekmeler:[
        { id:'bugun', ad:'Bugün', route:'today', on:true }, { id:'plan', ad:'Plan', route:'week' },
        { id:'calisma', ad:'Çalışma', route:'subjects' }, { id:'menu', ad:'Menü', act:'toggle-sidebar' }] }));
      const s = d.querySelectorAll('.altbant__sekme');
      expect(s.length).toBe(4);
      expect(s[3].getAttribute('data-act')).toBe('toggle-sidebar');
      expect(s[0].getAttribute('aria-current')).toBe('page');
      expect(d.querySelector('[data-oz="166"]').getAttribute('data-act')).toBe('hizli-ekle');
      expect(!!kuralVar(/max-width:\s*679px/, /^\.altbant$/)).toBe(true);
      d.remove();
    });

    it('Menü: sekiz çekmece ve bölümleri tek listede; kapatma düğmesi var', () => {
      const cek = K.CEKMECELER.map(c => ({ id:c.id, ad:c.ad, sayac:c.id === 'onaylar' ? 3 : 0,
        bolumler:[{ route:c.id + '-r', ad:c.ad, on:c.id === 'plan' }] }));
      const d = yerlestir(K.menuSayfasi({ cekmeceler:cek, ayak:'<p>ayak</p>' }));
      expect(d.querySelectorAll('.menusayfa__cekmece').length).toBe(8);
      expect(d.querySelector('[aria-current="page"]').getAttribute('data-route')).toBe('plan-r');
      expect(d.querySelectorAll('.menusayfa .ust__sayac').length).toBe(1);
      expect(d.querySelector('.menusayfa__kapat').getAttribute('data-act')).toBe('toggle-sidebar');
      expect(d.querySelector('.menusayfa__ayak').textContent).toBe('ayak');
      d.remove();
    });

    it('oz-019 bölüm çubuğu: tek bölümde çizilmez, etkin bölüm işaretli', () => {
      expect(K.bolumCubugu({ cekmece:'Onaylar', bolumler:[{ route:'onaylar', ad:'Bekleyen', on:true }] })).toBe('');
      const d = yerlestir(K.bolumCubugu({ cekmece:'Plan', bolumler:[{ route:'week', ad:'Hafta', on:true },
        { route:'plan', ad:'Program', rozet:{ text:'!', quiet:true } }] }));
      const n = d.querySelector('nav');
      expect(n.getAttribute('aria-label')).toBe('Plan bölümleri');
      expect(n.querySelector('[aria-current="page"]').textContent).toBe('Hafta');
      expect(n.querySelector('.bolumcubugu__rozet').classList.contains('is-sessiz')).toBe(true);
      d.remove();
    });

    /* Tablet (680–1279 px): kenar çubuğu bölümleri göstermez; açık
       çekmecenin bölümleri sayfanın üstündeki çubuktadır. Çubuk yalnız o
       aralıkta görünür (kabuk.css .bolumcubugu--kabuk); masaüstünde kenarda,
       telefonda Menü'de dururlar. Önce tablette Bugün › Ayrıntı gibi
       bölümlere kenardan ulaşılamıyordu. */
    it('oz-019 tablet bölüm çubuğu: kabuk sınıfı yalnız istenince', () => {
      const b = [{ route:'today', ad:'Bugün', on:true }, { route:'gun', ad:'Ayrıntı' }];
      const d = yerlestir(K.bolumCubugu({ kabuk:true, cekmece:'Bugün', bolumler:b }));
      const n = d.querySelector('nav');
      expect(n.classList.contains('bolumcubugu--kabuk')).toBe(true);
      expect([...n.querySelectorAll('[data-route]')].map(x => x.dataset.route)).toEqual(['today', 'gun']);
      d.remove();
      expect(K.bolumCubugu({ cekmece:'Bugün', bolumler:b }).indexOf('bolumcubugu--kabuk')).toBe(-1);
    });

    it('sayfa başı: yol «Plan › Hafta», başlık tek h1; metin kaçışlı', () => {
      const d = yerlestir(K.sayfaBasi({ yol:['Plan', 'Hafta'], baslik:'<b>Hafta</b>' }));
      expect(d.querySelector('.sayfabasi__yol').textContent).toBe('Plan › Hafta');
      expect(d.querySelectorAll('h1').length).toBe(1);
      expect(d.querySelector('h1').textContent).toBe('<b>Hafta</b>');
      const tek = yerlestir(K.sayfaBasi({ yol:['Bugün'], baslik:'Bugün' }));
      expect(!!tek.querySelector('.sayfabasi__yol')).toBe(false);
      d.remove(); tek.remove();
    });

    /* Kullanıcı (2026-10-02): «böyle bilgiler başlığın sağ üstünde hafif bir
       bilgi kartı olsun; "2 Ekim 2026 · veri bekliyor" böyle tarih yazmasın».
       Açıklama ve durum satırı ekranda değil, başlığın yanındaki ⓘ'de. */
    it('sade: açıklama ve durum satırı başlığın yanındaki bilgi kartında; ekranda tarih satırı yok', () => {
      const d = yerlestir(K.sayfaBasi({ ust:'Hafta 3/40', baslik:'Bugün', ozet:'Uyku süresini yazman bile yeter.' }));
      expect(d.querySelector('.sayfabasi__ust')).toBeNull();
      expect(d.querySelector('.sayfabasi__ozet')).toBeNull();
      const btn = d.querySelector('.sayfabasi__bilgi-dugme');
      expect(!!btn).toBe(true);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      const kart = document.getElementById(btn.getAttribute('aria-controls'));
      expect(kart.textContent).toContain('Uyku süresini yazman bile yeter.');
      expect(kart.textContent).toContain('Hafta 3/40');
      expect(getComputedStyle(kart).display).toBe('none');
      btn.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(getComputedStyle(kart).display === 'none').toBe(false);
      document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      d.remove();
      /* Söyleyecek bir şey yoksa düğme de yok. */
      const bos = yerlestir(K.sayfaBasi({ baslik:'Hafta' }));
      expect(bos.querySelector('.sayfabasi__bilgi-dugme')).toBeNull();
      bos.remove();
    });

    /* Kullanıcı (2026-10-02): «AYS ESP SPİ Merkez seçimlerini bir buton ile
       açılan pencerede seçtir». Kenarda tek düğme (bu sistem), dört sistem
       düğmeyle açılan küçük kartta; Esc ve dışarısı kapatır. */
    it('sade: sistem seçimi tek düğme + açılan kart; dört sistem kartta', () => {
      const d = yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'spi', cekmeceler:[] }) + '</div>');
      try{
        const sec = d.querySelector('.kenar__modulsec');
        expect(!!sec).toBe(true);
        expect(sec.textContent).toContain('SPİ');
        expect(sec.getAttribute('aria-expanded')).toBe('false');
        const pen = document.getElementById(sec.getAttribute('aria-controls'));
        expect(pen.querySelectorAll('.kenar__modul').length).toBe(4);
        expect(pen.querySelector('.kenar__modul.is-on').textContent).toContain('SPİ');
        expect(getComputedStyle(pen).visibility).toBe('hidden');
        sec.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        expect(sec.getAttribute('aria-expanded')).toBe('true');
        expect(sec.closest('.kenar__moduller').classList.contains('is-acik')).toBe(true);
        document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
        expect(sec.getAttribute('aria-expanded')).toBe('false');
      }finally{ d.remove(); }
    });

    it('sade: sağ üstte arama yalnız simge; kısayol ve yazı yalnız erişilebilir adda', () => {
      const d = yerlestir(K.ustSerit({ modul:'ays', yol:['Bugün'] }));
      const ara = d.querySelector('.ust__ara');
      expect(ara.querySelector('kbd')).toBeNull();
      expect(ara.querySelector('.ust__ara-yazi')).toBeNull();
      expect(ara.getAttribute('aria-label')).toContain('Ctrl+K');
      d.remove();
    });

    it('katman: tek seferde bir panel; kapanınca çapa işareti düşer', () => {
      const btn = yerlestir('<button id="kt-capa">aç</button>').firstElementChild;
      K.katmanAc('kt-bir', K.bildirimPaneli({ gruplar:[] }), btn);
      expect(K.katmanAcik('kt-bir')).toBe(true);
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      K.katmanAc('kt-iki', K.hizliEkle({ modul:'ays', satirlar:[{ ad:'Deneme ekle', act:'next-action' }] }), btn);
      expect(!!document.getElementById('kt-bir')).toBe(false);
      expect(K.katmanAcik('kt-iki')).toBe(true);
      expect(K.katmanKapat()).toBe(true);
      expect(K.katmanAcik()).toBe(false);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(K.katmanKapat()).toBe(false);
      btn.parentNode.remove();
    });

    /* iPhone §2.4 (2026-10-02): açıklama ⓘ'dedir; sayfa sonundaki «Bu ekran
       nasıl okunur» şeridi bilgi kartına taşınır, terim kaybolmaz. */
    /* Orta başlık ve kaydırmalı seçici (kullanıcı, 2026-10-02: «başlıkları
       ortaya al; ana giriş ortada, sağa sola kaydırırsın»). */
    it('seçici: sığmayan çubukta seçili bölüm ortaya alınır', () => {
      const ad = i => '<button class="bolumcubugu__ad' + (i === 5 ? ' is-on' : '') + '" style="flex:none;width:100px;margin:0">b' + i + '</button>';
      const d = yerlestir('<div class="site--v5"><nav class="bolumcubugu" style="width:240px;display:flex;overflow-x:auto;padding:0;-webkit-mask-image:none;mask-image:none">'
        + [0, 1, 2, 3, 4, 5, 6, 7].map(ad).join('') + '</nav></div>');
      try{
        const c = d.querySelector('.bolumcubugu'), on = d.querySelector('.is-on');
        K.seciciHazirla(d);
        const orta = on.getBoundingClientRect().left + on.offsetWidth / 2;
        const cOrta = c.getBoundingClientRect().left + c.clientWidth / 2;
        expect(Math.abs(orta - cOrta) < 3).toBe(true);
        expect(K.seciciKomsu(c, 1).textContent).toBe('b6');
        expect(K.seciciKomsu(c, -1).textContent).toBe('b4');
      }finally{ d.remove(); }
    });

    it('seçici: sığan çubukta yatay sürükleme komşu bölüme geçirir; dikey kaydırma geçirmez', () => {
      const d = yerlestir('<div class="site--v5"><nav class="bolumcubugu">'
        + '<button class="bolumcubugu__ad">a</button><button class="bolumcubugu__ad is-on">b</button>'
        + '<button class="bolumcubugu__ad">c</button></nav></div>');
      try{
        const c = d.querySelector('.bolumcubugu');
        const tik = [];
        c.querySelectorAll('.bolumcubugu__ad').forEach(b => b.addEventListener('click', () => tik.push(b.textContent)));
        const r = c.getBoundingClientRect(), y = r.top + r.height / 2;
        const sur = (x0, x1, y1) => {
          c.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, clientX:x0, clientY:y }));
          document.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, clientX:x1, clientY:y1 }));
        };
        sur(r.left + 150, r.left + 60, y);           // sola sürükle: sağdaki komşu
        expect(tik.join(',')).toBe('c');
        sur(r.left + 60, r.left + 150, y);           // sağa sürükle: soldaki komşu
        expect(tik.join(',')).toBe('c,a');
        sur(r.left + 100, r.left + 60, y + 120);     // çoğu dikey: geçiş yok
        expect(tik.join(',')).toBe('c,a');
      }finally{ d.remove(); }
    });

    it('sayfa başı: başlık ortada', () => {
      const d = yerlestir('<div class="site--v5">' + K.sayfaBasi({ baslik:'Hafta', ozet:'x' }) + '</div>');
      try{
        expect(getComputedStyle(d.querySelector('.sayfabasi__metin')).textAlign).toBe('center');
        expect(getComputedStyle(d.querySelector('.sayfabasi__satir')).justifyContent).toBe('center');
      }finally{ d.remove(); }
    });

    it('iPhone: «nasıl okunur» şeridi bilgi kartına taşınır; kart yoksa yerinde kalır', () => {
      const serit = '<section class="rail"><button class="rail__toggle" data-act="rail-toggle"><span class="rail__label">Bu ekran nasıl okunur</span></button>'
        + '<div class="rail__body" hidden><button class="railcard" data-act="hint" data-hint="a"><span class="railcard__t">A</span><span class="railcard__b">a</span></button>'
        + '<button class="railcard" data-act="hint" data-hint="b"><span class="railcard__t">B</span><span class="railcard__b">b</span></button></div></section>';
      const d = yerlestir(K.sayfaBasi({ baslik:'Hafta', ozet:'Bu hafta.' }) + '<main id="rb-main">' + serit + '</main>');
      try{
        expect(K.railBilgiye(d.querySelector('#rb-main'))).toBe(true);
        expect(d.querySelector('section.rail')).toBeNull();
        const t = Array.from(d.querySelectorAll('.bilgikart .bilgikart__terimler .railcard'));
        expect(t.map(x => x.getAttribute('data-hint')).join(',')).toBe('a,b');
        t.forEach(x => expect(x.getAttribute('data-act')).toBe('hint'));
        expect(d.querySelector('.bilgikart__terimler').getAttribute('aria-label')).toBe('Bu ekran nasıl okunur');
        expect(K.railBilgiye(d.querySelector('#rb-main'))).toBe(false);
      }finally{ d.remove(); }
      const y = yerlestir(K.sayfaBasi({ baslik:'Boş' }) + '<main id="rb-yok">' + serit + '</main>');
      try{
        expect(K.railBilgiye(y.querySelector('#rb-yok'))).toBe(false);
        expect(!!y.querySelector('section.rail')).toBe(true);
      }finally{ y.remove(); }
    });

    /* Kullanıcı (2026-10-02): «üstteki tamam ama altta bir daha öyle bir şey
       olması kötü». İki seçici iki ayrı dil konuşur: çekmecenin bölümleri
       yazı + nokta; sayfanın bölümleri gri raylı bölümlü seçici (seçili
       hap yüzey renginde). */
    it('iki seçici iki dil: çekmece çubuğu yazı + nokta, sayfa bölümleri raylı bölümlü seçici', () => {
      const d = yerlestir('<div class="site--v5">'
        + K.bolumCubugu({ kabuk:true, cekmece:'Çalışma', bolumler:[{ route:'a', ad:'Dil', on:true }, { route:'b', ad:'Okuma' }] })
        + '<nav class="bolumcubugu bolumcubugu--sayfa" aria-label="Bu sayfada"><button class="bolumcubugu__ad is-on" data-tab="x">Notlar</button>'
        + '<button class="bolumcubugu__ad" data-tab="y">Matris</button></nav></div>');
      try{
        const ust = d.querySelector('.bolumcubugu--kabuk'), alt = d.querySelector('.bolumcubugu--sayfa');
        const saydam = c => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
        if(getComputedStyle(ust).display !== 'none') expect(getComputedStyle(ust.querySelector('.is-on'), '::after').width).toBe('5px');
        expect(saydam(getComputedStyle(alt).backgroundColor)).toBe(false);
        const hap = getComputedStyle(alt.querySelector('.is-on'), '::after');
        expect(saydam(hap.backgroundColor)).toBe(false);
        expect(hap.position).toBe('absolute');
        expect(getComputedStyle(alt).borderRadius).toBe('12px');
      }finally{ d.remove(); }
    });

    /* Hata (2026-10-02, AYS Ayarlar › Genel, 1440 px): aşağı kaydırınca iki
       yapışık çubuk aynı `top`a yapışıyor, «Genel · Profil» yazıları
       «Ayarlar · Takvim istisnaları» rayının üstüne biniyordu. Çekmece
       çubuğu yapışıkken ray onun ALTINA yapışır; bölüme kayınca bölümün
       başı iki çubuğun altında kalır. */
    it('iki yapışık çubuk üst üste binmez: ray çekmece çubuğunun altına yapışır', () => {
      const eski = document.documentElement.classList.contains('kenar-dar');
      let d = null;
      try{
        K.kenarDar(true);
        d = yerlestir('<div class="site--v5"><div class="wrapc sayfa">'
          + K.bolumCubugu({ kabuk:true, cekmece:'Ayarlar', bolumler:[{ route:'guide', ad:'Genel', on:true }, { route:'profil', ad:'Profil' }] })
          + '<main class="content"><div><nav class="bolumcubugu bolumcubugu--sayfa" aria-label="Bu sayfada">'
          + '<button class="bolumcubugu__ad is-on" data-tab="x">Ayarlar</button><button class="bolumcubugu__ad" data-tab="y">Takvim istisnaları</button></nav>'
          + '<div class="sayfabolumler sayfabolumler--kat"><section class="sayfabolum is-on" id="bl-x">x</section></div></div></main></div></div>');
        const ust = d.querySelector('.bolumcubugu--kabuk'), alt = d.querySelector('.bolumcubugu--sayfa');
        const yapisik = el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).position === 'sticky';
        const ustu = el => parseFloat(getComputedStyle(el).top);
        expect(yapisik(alt)).toBe(true);
        if(window.innerWidth >= 680) expect(yapisik(ust)).toBe(true);
        if(yapisik(ust)){
          expect(ust.offsetHeight > 0).toBe(true);
          expect(ustu(alt) - ustu(ust) >= ust.offsetHeight).toBe(true);
        }
        /* Bölüme kayış (bolumeGit, block:'start') bölümün başını rayın altına bırakır. */
        expect(parseFloat(getComputedStyle(d.querySelector('.sayfabolum')).scrollMarginTop) >= ustu(alt) + alt.offsetHeight).toBe(true);
        /* Ray yarı saydam: altından kayan kartın yazısı («Diploma notu»)
           rayın yazısının üstüne çıkmasın diye arkası bulanıklaşır. */
        expect(/blur\(/.test(getComputedStyle(alt).backdropFilter || getComputedStyle(alt).webkitBackdropFilter || '')).toBe(true);
      }finally{
        if(d) d.remove();
        K.kenarDar(eski); try{ localStorage.removeItem('lifeos.kenar'); }catch(e){}
      }
    });

    it('tek yapışık çubuk: çekmece çubuğu yokken ray üst çubuğun hemen altına yapışır', () => {
      const eski = document.documentElement.classList.contains('kenar-dar');
      let d = null;
      try{
        K.kenarDar(true);
        d = yerlestir('<div class="site--v5"><div class="wrapc sayfa"><main class="content"><div>'
          + '<nav class="bolumcubugu bolumcubugu--sayfa" aria-label="Bu sayfada"><button class="bolumcubugu__ad is-on" data-tab="x">A</button>'
          + '<button class="bolumcubugu__ad" data-tab="y">B</button></nav></div></main></div></div>');
        const alt = d.querySelector('.bolumcubugu--sayfa');
        expect(getComputedStyle(alt).top).toBe(getComputedStyle(d.firstElementChild).getPropertyValue('--ust-h').trim());
      }finally{
        if(d) d.remove();
        K.kenarDar(eski); try{ localStorage.removeItem('lifeos.kenar'); }catch(e){}
      }
    });

    it('başlık çekmece değişince yeniden belirir; aynı çekmecede bölüm değişince yerinde durur', () => {
      const k = document.documentElement;
      const ciz = (id, route) => yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'esp', cekmeceler:[
        { id:'calisma', ad:'Çalışma', route:'lang', on:id === 'calisma', bolumler:[{ route:'lang', ad:'Dil', on:route === 'lang' }, { route:'library', ad:'Okuma', on:route === 'library' }] },
        { id:'analiz', ad:'Analiz', route:'analytics', on:id === 'analiz', bolumler:[{ route:'analytics', ad:'Analiz', on:true }] },
      ] }) + '</div>').remove();
      try{
        ciz('calisma', 'lang');
        ciz('calisma', 'library');
        expect(k.classList.contains('sayfa-gecis')).toBe(true);
        expect(k.classList.contains('cekmece-gecis')).toBe(false);
        ciz('analiz', 'analytics');
        expect(k.classList.contains('cekmece-gecis')).toBe(true);
      }finally{ k.classList.remove('sayfa-gecis', 'cekmece-gecis'); }
    });

    it('bilgi kartının ilk satırı katalog numarasını taşıyabilir (004)', () => {
      const d = yerlestir(K.sayfaBasi({ baslik:'Bugün', ozet:'Toparlanma iyi.', bilgiOz:'004' }));
      try{
        expect(d.querySelector('h1').textContent).toBe('Bugün');
        expect(d.querySelector('.bilgikart__metin').getAttribute('data-oz')).toBe('004');
      }finally{ d.remove(); }
    });

    /* Kullanıcı (2026-10-02): «SPİ ve ESP'de AYS kadar sade olmayan, göz
       yoran şeyler var». Uyarı kutusu nötr gri (tonu simge söyler), grafik
       okuma genişliğinden büyümez, seçim kartı çerçevesiz, vitrin serifi
       gövde yazısında. Üç modülde aynı kural. */
    it('sakin içerik: nötr uyarı kutusu, sınırlı grafik, çerçevesiz seçim kartı, serifsiz vitrin', () => {
      const d = yerlestir('<div class="site--v5"><div class="kutu"><div class="notice notice--warn"><svg></svg><div>x</div></div>'
        + '<svg class="grafik" viewBox="0 0 560 120" preserveAspectRatio="none"></svg>'
        + '<button class="pickcard">a</button><div class="vk"><b class="serif">3</b></div></div></div>');
      try{
        const n = d.querySelector('.notice');
        expect(getComputedStyle(n).backgroundColor).toBe(renk(kok('--surface-2')));
        expect(getComputedStyle(d.querySelector('.grafik')).maxWidth).toBe('640px');
        expect(getComputedStyle(d.querySelector('.pickcard')).borderTopColor).toBe('rgba(0, 0, 0, 0)');
        expect(/Newsreader/.test(getComputedStyle(d.querySelector('.vk .serif')).fontFamily)).toBe(false);
      }finally{ d.remove(); }
    });

    it('telefonda da sağ üst sade: zil ve sayfa düzeni çerçevesiz yuvarlak (kutucuk yok)', () => {
      /* Kaskatta SONUNCU kural geçerlidir: eski telefon kuralları önce gelir. */
      let r = null;
      for(const ss of Array.from(document.styleSheets)){
        let kurallar = [];
        try{ kurallar = Array.from(ss.cssRules || []); }catch(e){ continue; }
        kurallar.forEach(m => { if(m.media && /max-width:\s*679px/.test(m.media.mediaText))
          Array.from(m.cssRules || []).forEach(ic => { if(/\.ust__zil(?![-\w])/.test(ic.selectorText || '')) r = ic; }); });
      }
      expect(!!r).toBe(true);
      expect(r.style.boxShadow).toBe('none');
      expect(r.style.borderRadius).toBe('50%');
    });

    /* Kullanıcı (2026-10-02 gece): «sol taraftaki bölüm seçtiğimiz kitap
       ayracı gibi olan kısma hoş bir animasyon ekle». */
    it('ayraç: bölümler sırayla gelir (--i); açık kenarın yeniden çiziminde diziliş tekrar oynamaz', () => {
      const ciz = () => K.kenarCubugu({ modul:'ays', cekmeceler:[
        { id:'calisma', ad:'Çalışma', route:'subjects', on:true, bolumler:[
          { route:'subjects', ad:'Konu çalış', on:true }, { route:'solve', ad:'Soru çöz' }, { route:'quiz', ad:'Sınama' }] }] });
      const d = yerlestir('<div class="site--v5">' + ciz() + '</div>');
      try{
        const b = Array.from(d.querySelectorAll('.kenar__bolum'));
        expect(b.map(x => x.style.getPropertyValue('--i')).join(',')).toBe('0,1,2');
        expect(d.querySelector('.kenar').classList.contains('kenar--acik-kaldi')).toBe(false);
        const yeni = d.querySelector('.kenar__bolumler.is-yeni > .kenar__bolum:not(.is-on)');
        if(yeni) expect(/ayrac-gir|sol-gel/.test(getComputedStyle(yeni).animationName)).toBe(true);
      }finally{ d.remove(); }
    });

    /* Kullanıcı (2026-10-02 gece): «yeşil yerdeki rank ve o kısmı kaldır,
       kırmızı yerdeki simgeleri oraya taşı, üstteki kartı kaldır; sayfanın
       ortasındaki asıl yer hep en ortada olsun». */
    /* Kullanıcı (2026-10-05): «sol kenardaki kartı bir süre sonra
       bulanıklaştıralım, odak dağıtmasın». Durum <html>'de; kenardan katman
       açıkken (tutulu) ya da odak içerideyken sakinleşmez. */
    it('sakin kenar: bir süre sonra solar; tutuluyken solmaz; yaklaşınca netleşir', () => {
      const d = yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'ays', cekmeceler:[], profil:{ ad:'Ömer' } }) + '</div>');
      const kok = document.documentElement;
      try{
        expect(K.SAKIN_MS >= 3000).toBe(true);
        expect(K.kenarSakinlestir()).toBe(true);
        expect(kok.classList.contains('kenar-sakin')).toBe(true);
        K.kenarUyandir();
        expect(kok.classList.contains('kenar-sakin')).toBe(false);
        d.querySelector('.kenar').classList.add('kenar--tutulu');
        expect(K.kenarSakinlestir()).toBe(false);
        expect(kok.classList.contains('kenar-sakin')).toBe(false);
        d.querySelector('.kenar').classList.remove('kenar--tutulu');
        K.kenarSakinlestir();
        d.querySelector('.kenar__dip button').dispatchEvent(new FocusEvent('focusin', { bubbles:true }));
        expect(kok.classList.contains('kenar-sakin')).toBe(false);
      }finally{ K.kenarUyandir(); d.remove(); }
    });

    it('kenarın dibi: ara · sayfa düzeni · radyo · bildirimler · profil; rütbe ve Merkez satırı yok', () => {
      const d = yerlestir('<div class="site--v5">' + K.kenarCubugu({ modul:'ays', cekmeceler:[],
        baglanti:{ durum:'bagli', saat:'14:08' }, rutbe:{ ad:'Bronz', etiket:'1.1', route:'rutbe' },
        bildirim:{ sayi:2 }, profil:{ ad:'Ömer' } }) + '</div>');
      try{
        /* Hesap düğmesi (brand/ortak/hesap.js) yerinde ama sunucu ve oturum
           yokken gizli: görünen sıra değişmez. */
        expect(!!d.querySelector('.kenar__dip .ust__hesap')).toBe(true);
        /* King (brand/ortak/king.js) kenarın dibinde ilk araç. */
        expect(d.querySelector('.kenar__dip button[data-king-ac] .kenar__ad').textContent).toBe('King');
        const a = Array.from(d.querySelectorAll('.kenar__dip button:not([hidden]):not([data-king-ac])'));
        expect(a.map(b => b.querySelector('.kenar__ad').textContent)).toEqual(['Ara', 'Sayfa düzeni', 'Radyo', 'Bildirimler', 'Ömer']);
        expect(a[0].getAttribute('data-act')).toBe('open-palette');
        expect(a[1].classList.contains('ust__gizli')).toBe(true);
        expect(a[2].classList.contains('ust__ses')).toBe(true);
        expect(a[3].getAttribute('data-act')).toBe('bildirim-ac');
        expect(!!a[3].querySelector('.ust__zil-nokta')).toBe(true);
        expect(a[4].getAttribute('data-act')).toBe('open-appearance');
        expect(!!d.querySelector('.kenar__rutbe, .kenar__bag, [data-oz="140"], [data-oz="118"]')).toBe(false);
        /* Erişilebilir ad görünen yazıyı içerir. */
        a.forEach(b => expect(b.getAttribute('aria-label').indexOf(b.querySelector('.kenar__ad').textContent) >= 0).toBe(true));
      }finally{ d.remove(); }
    });

    it('masaüstünde üst şerit yok: araçlar kenarda, yapışık çubuklar ekranın tepesine yapışır', () => {
      const d = yerlestir('<div class="site site--v5">' + K.iskeletV5({ modul:'ays', cekmeceler:[], yol:['Bugün'] })
        + '<div class="site__body"><div class="wrapc sayfa">x</div></div></div>');
      try{
        expect(getComputedStyle(d.querySelector('.ust')).display).toBe('none');
        expect(getComputedStyle(d.querySelector('.site--v5')).getPropertyValue('--ust-h').trim()).toBe('0px');
        expect(getComputedStyle(d.querySelector('.kenar__dip .ust__zil')).display !== 'none').toBe(true);
      }finally{ d.remove(); }
    });

    it('kenar açılıp kapanırken yerleşim zıplamaz: simge yerinde, ad solar, ayraç yükseklikte açılır', async () => {
      const d = yerlestir('<div class="site site--v5">' + K.kenarCubugu({ modul:'ays', cekmeceler:[
        { id:'calisma', ad:'Çalışma', route:'subjects', on:true, bolumler:[
          { route:'subjects', ad:'Konu çalış', on:true }, { route:'solve', ad:'Soru çöz' }] }] }) + '</div>');
      try{
        const kenar = d.querySelector('.kenar');
        const cek = kenar.querySelector('.kenar__cekmece');
        const ad = cek.querySelector('.kenar__ad');
        const liste = kenar.querySelector('.kenar__bolumler');
        const simgeX = () => Math.round(cek.querySelector('.kbk-ic').getBoundingClientRect().left - kenar.getBoundingClientRect().left);
        /* Dikey: kullanıcı (2026-10-03) «açınca ikonlar aşağı kayıyor» — sistem
           seçicinin kapalı listesi açık kenarda 8 px yer tutuyordu. */
        const cekY = () => Math.round(cek.getBoundingClientRect().top - kenar.getBoundingClientRect().top);
        /* Kapalı: ad ve ayraç yok (odaklanmaz, kırpılmış sayılmaz); simge yerinde. */
        expect(getComputedStyle(ad).display).toBe('none');
        expect(getComputedStyle(liste).display).toBe('none');
        /* Sistem seçicinin kapalı listesi de yok: çizili kalınca kırpılmış
           içerik sayılıyor ve dolgusu yer tutuyordu. */
        expect(getComputedStyle(kenar.querySelector('.kenar__modulpencere')).display).toBe('none');
        expect(cek.getAttribute('title')).toBe('Çalışma');
        const kapaliX = simgeX(), kapaliY = cekY();
        kenar.classList.add('kenar--tutulu');
        /* Ad bilerek gecikmeli gelir (önce yer açılır): geçişin bitişini bekle. */
        await new Promise(r => setTimeout(r, 500));
        expect(getComputedStyle(ad).opacity).toBe('1');
        expect(simgeX()).toBe(kapaliX);
        expect(cekY()).toBe(kapaliY);
        expect(parseFloat(getComputedStyle(liste).height) > 0).toBe(true);
        /* Açılış ve kapanış yumuşak eğriyle (kural; süre azaltılmış kipte sıfırlanır). */
        let acilis = null;
        for(const ss of Array.from(document.styleSheets)){
          let kurallar = [];
          try{ kurallar = Array.from(ss.cssRules || []); }catch(e){ continue; }
          kurallar.forEach(m => Array.from(m.cssRules || []).forEach(ic => {
            if(/kenar--tutulu/.test(ic.selectorText || '') && /width/.test(ic.style.transitionProperty || ic.style.transition || '')) acilis = ic; }));
        }
        expect(!!acilis).toBe(true);
        expect(/cubic-bezier/.test(acilis.style.transitionTimingFunction || acilis.style.transition)).toBe(true);
      }finally{ d.remove(); }
    });

    it('kenardan açılan katman kenarı açık tutar, kenarın sağına ve düğmenin hizasına yerleşir', () => {
      /* Gerçekte kenar ekrana yapışıktır: deneme kabuğu da görüş alanında. */
      const d = yerlestir('<div class="site site--v5" style="position:fixed;inset:0;z-index:1">' + K.kenarCubugu({ modul:'ays', cekmeceler:[] }) + '</div>');
      try{
        const kenar = d.querySelector('.kenar');
        const btn = kenar.querySelector('.kenar__dip [data-act="bildirim-ac"]');
        const p = K.katmanAc('kt-kenar', K.bildirimPaneli({ gruplar:[] }), btn);
        expect(kenar.classList.contains('kenar--tutulu')).toBe(true);
        const pr = p.getBoundingClientRect(), kr = kenar.getBoundingClientRect(), br = btn.getBoundingClientRect();
        expect(pr.left >= kr.left + 200).toBe(true);
        expect(Math.abs(pr.bottom - br.bottom) < 2 || Math.round(pr.top) === 12).toBe(true);
        K.katmanKapat();
        expect(kenar.classList.contains('kenar--tutulu')).toBe(false);
      }finally{ K.katmanKapat(); d.remove(); }
    });

    it('orta duruş: kısa sayfa hep dikeyde ortada; uzun sayfa üstten başlar, yukarı taşmaz', () => {
      const kur = boy => yerlestir('<div class="site site--v5">' + K.kenarCubugu({ modul:'ays', cekmeceler:[] })
        + '<div class="site__body"><div class="wrapc sayfa"><main class="content"><div style="height:' + boy + 'px"></div></main></div></div></div>');
      const kisa = kur(120);
      try{
        const b = kisa.querySelector('.site__body').getBoundingClientRect(), s = kisa.querySelector('.sayfa').getBoundingClientRect();
        expect(Math.abs((s.top - b.top) - (b.bottom - s.bottom)) < 2).toBe(true);
        expect(s.top - b.top > 40).toBe(true);
        /* Levhanın içinde de simetrik: içeriğin alt dolgusu .sayfa'nınkine eklenmez. */
        const ic = kisa.querySelector('.content').getBoundingClientRect();
        expect(Math.abs((ic.top - s.top) - (s.bottom - ic.bottom)) < 2).toBe(true);
      }finally{ kisa.remove(); }
      const uzun = kur(3000);
      try{
        const b = uzun.querySelector('.site__body').getBoundingClientRect(), s = uzun.querySelector('.sayfa').getBoundingClientRect();
        expect(Math.abs(s.top - b.top) < 1).toBe(true);
      }finally{ uzun.remove(); }
    });
  });
})();
