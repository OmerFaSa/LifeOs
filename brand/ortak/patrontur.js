/* PATRON TURU — kurulum ve filmden sonra sistemi gezdiren rehberli tur.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/patrontur.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi `patrontur.css`,
   testi `patrontur.test.js`.
   ==================================================================

   Kullanıcı (2026-11-06): «Girişte kendimizi tanıtıyoruz ama sonra bizi bomboş
   bırakıyor. King sistemi tanıtsın, butonlarla oralarda anlatsın; tıklamamızı
   istediği yer aydınlık, diğer yerler karanlık olsun, arka planda konuşsun.
   Her modülü kendi patronu anlatsın. Sonunda işe koyulalım desin.»

   Sözler:
     1. GERÇEK DÜĞME. Spot gerçek bir öğenin üstündedir; «tikla» adımı yalnız
        kullanıcı ona basınca ilerler. Karanlık alan tıklamayı tutar. Öğe bu
        ekranda yoksa (gizlendi, küçük ekran) tur kilitlenmez: «Devam» çıkar.
     2. SES YOKSA DA ÇALIŞIR. Her cümle altyazıdır. Konuşma King'in ses yoludur
        (`KING.seslendir`: Merkez açıksa onun sesi, değilse cihazın Türkçe sesi);
        ses gelmezse cümle okuma süresi kadar durur.
     3. PORT DEĞİŞİR, DURUM KALIR. Kapılar ayrı köken, depoları ayrı; durum
        film gibi kapıya bakmayan çerezdedir, hesap başına.
     4. BİR KEZ, HESAP VE CİHAZ BAŞINA. Yarıda kalan tur kaldığı yerden sürer;
        geçilen ya da biten tur kendiliğinden açılmaz. Menü › Tanışma turu ve
        Ayarlar › Kılavuz yeniden başlatır.
     5. SÜSTÜR. Hiçbir kayıt okumaz ya da yazmaz, sayı göstermez (adım sayacı
        hariç), sonuç vaat etmez. SPİ teşhis ve doz konuşmaz; AYS ve ESP garanti
        vermez (AGENTS §1.5).
     6. YOLDA DURMAZ. Film, kurulum, King ya da başka bir pencere açıksa tur
        susup bekler; kapanınca aynı adımdan sürer. */
window.LIFEOS.PARCA.yazilar({
  'ortak.patrontur.ad':'LifeOS tanışma turu',
  'ortak.patrontur.menu':'Tanışma turu',
  'ortak.patrontur.yeniden':'Tanışma turunu baştan başlat',
  'ortak.patrontur.devam':'Devam',
  'ortak.patrontur.gec':'Turu geç',
  'ortak.patrontur.basla':'Başlayalım',
  'ortak.patrontur.ses-ac':'Sesi aç',
  'ortak.patrontur.ses-kapa':'Sesi kapat',
  'ortak.patrontur.ipucu':'Aydınlık yere bas.',
  'ortak.patrontur.gecildi':'Tur kapandı. Ayarlar › Kılavuz’dan yeniden başlatabilirsin.',
  'ortak.patrontur.kim.king':'King',
  'ortak.patrontur.kim.ays':'AYS patronu',
  'ortak.patrontur.kim.spi':'SPİ patronu',
  'ortak.patrontur.kim.esp':'ESP patronu',
  'ortak.patrontur.uzak':'Kaldığımız yer {ad}. Devam dersen oraya geçelim.',

  'ortak.patrontur.king.ac.1':'Hoş geldin. Ben King, bu mahallenin büyüğüyüm.',
  'ortak.patrontur.king.ac.2':'Kapıda tanıştık; şimdi seni ortada bırakmak olmaz.',
  'ortak.patrontur.king.ac.3':'Gel, içeriyi birlikte gezelim. Her evi kendi patronu anlatsın.',
  'ortak.patrontur.king.cagir.1':'Önce beni nerede bulacağını göstereyim.',
  'ortak.patrontur.king.cagir.2':'Takıldığın an buraya dokun, ne dersen dinlerim.',
  'ortak.patrontur.king.cagir.3':'Sayıyı ben uydurmam; hesabı kod yapar, ben anlatırım. Şimdi sözü patrona bırakıyorum.',

  'ortak.patrontur.ays.tanis.1':'Merhaba, ben AYS’nin patronuyum.',
  'ortak.patrontur.ays.tanis.2':'Sınav yolundaki masanın başındayım; ekibimin raporlarını okur, sana tek bir karar çıkarırım.',
  'ortak.patrontur.ays.tanis.3':'Meslek seçmem, üniversite önermem. O kararlar senin.',
  'ortak.patrontur.ays.giris.1':'En çok uğrayacağın yer burası.',
  'ortak.patrontur.ays.giris.2':'Ne yaptıysan tek cümleyle yaz: «matematikten 40 soru çözdüm» gibi. Ne anladığımı gösteririm, doğruysa kaydedersin.',
  'ortak.patrontur.ays.calisma.1':'Şimdi şuna bas, çalışma masamı göstereyim.',
  'ortak.patrontur.ays.calisma-ic.1':'Tekrarların ve denemelerin burada toplanır.',
  'ortak.patrontur.ays.calisma-ic.2':'Bugün neye oturacağını bilmiyorsan önce buraya bak; sıranı hazır tutarım.',
  'ortak.patrontur.ays.analiz.1':'Bir de şuna bas, gidişine birlikte bakalım.',
  'ortak.patrontur.ays.analiz-ic.1':'Netlerin nasıl gidiyor, burada görürsün.',
  'ortak.patrontur.ays.analiz-ic.2':'Boş geçen gün sıfır sayılmaz; girilmemiştir, o kadar. Telaş yok.',
  'ortak.patrontur.ays.devir.1':'Benden bu kadar; kapım hep açık.',

  'ortak.patrontur.spi.kurulum':'Ben SPİ’nin patronuyum. Önce seni biraz tanıyayım; birkaç kısa soru. İstersen «Şimdilik atla» de, kapım sonra da açık.',
  'ortak.patrontur.spi.tanis.1':'Merhaba, ben SPİ’nin patronuyum.',
  'ortak.patrontur.spi.tanis.2':'Uykun, öğünün, hareketin: ekibim bunları izler, ben de haftanın tek işini seçerim.',
  'ortak.patrontur.spi.tanis.3':'Baştan söyleyeyim: teşhis koymam, ilaç önermem. O iş hekimindir.',
  'ortak.patrontur.spi.giris.1':'Gün içinde buraya yazman yeter.',
  'ortak.patrontur.spi.giris.2':'«7 saat uyudum, 2 yumurta yedim» gibi. Ne anladığımı gösteririm, doğruysa kaydedersin.',
  'ortak.patrontur.spi.calisma.1':'Şimdi şuna bas, mutfağa ve spor salonuna uğrayalım.',
  'ortak.patrontur.spi.calisma-ic.1':'Öğünlerin, antrenmanın, tahlil sonuçların burada durur.',
  'ortak.patrontur.spi.calisma-ic.2':'Hepsini aynı gün doldurmak zorunda değilsin; ne varsa onunla başlarız.',
  'ortak.patrontur.spi.analiz.1':'Bir de şuna bas, kendi verine bakalım.',
  'ortak.patrontur.spi.analiz-ic.1':'Neyin iyi gittiğini burada görürsün.',
  'ortak.patrontur.spi.analiz-ic.2':'Ölçmediğini tahmin etmem, girmediğin günü sıfır saymam. Karar senin ve hekiminin.',
  'ortak.patrontur.spi.devir.1':'Benden bu kadar; kendine iyi bak.',

  'ortak.patrontur.esp.kurulum':'Ben ESP’nin patronuyum. Önce adını öğreneyim, gerisi kolay. İstersen «Şimdilik atla» de, kapım sonra da açık.',
  'ortak.patrontur.esp.tanis.1':'Merhaba, ben ESP’nin patronuyum.',
  'ortak.patrontur.esp.tanis.2':'Merakın neredeyse oradan başlarız: dil, felsefe, müzik, okuma, yazı, tarih.',
  'ortak.patrontur.esp.tanis.3':'Sertifika vermem, yeteneğin hakkında hüküm kurmam, sonuç da vaat etmem. Yolu birlikte yürürüz.',
  'ortak.patrontur.esp.giris.1':'Yaptığını buraya yaz.',
  'ortak.patrontur.esp.giris.2':'«45 dakika gitar, 20 dakika kelime» gibi. Ne anladığımı gösteririm, doğruysa kaydedersin.',
  'ortak.patrontur.esp.calisma.1':'Şimdi şuna bas, çalışma odasını açayım.',
  'ortak.patrontur.esp.calisma-ic.1':'Kelimelerin, okuduğun kitaplar, her alanın kendi köşesi burada.',
  'ortak.patrontur.esp.calisma-ic.2':'Hepsine birden koşma; bir tanesini seç, gerisi seni bekler.',
  'ortak.patrontur.esp.analiz.1':'Bir de şuna bas, yoluna bakalım.',
  'ortak.patrontur.esp.analiz-ic.1':'Hangi alanda ne kadar yürüdüğün burada görünür.',
  'ortak.patrontur.esp.analiz-ic.2':'Kıyas yok; sen ve dünkü sen varsınız.',
  'ortak.patrontur.esp.devir.1':'Benden bu kadar; merakın eksik olmasın.',

  'ortak.patrontur.ays.kurulum':'Ben AYS’nin patronuyum. Önce seni biraz tanıyayım; birkaç kısa soru. Sen hazır olunca buradayım.',
  'ortak.patrontur.devir.ays':'Seni AYS’nin patronuna bırakıyorum. Şuraya bas, kapıyı aç.',
  'ortak.patrontur.devir.spi':'Seni SPİ’nin patronuna bırakıyorum. Şuraya bas, kapıyı aç.',
  'ortak.patrontur.devir.esp':'Seni ESP’nin patronuna bırakıyorum. Şuraya bas, kapıyı aç.',
  'ortak.patrontur.gec.ays':'AYS’ye şuradan geçilir.',
  'ortak.patrontur.gec.spi':'SPİ’ye şuradan geçilir.',
  'ortak.patrontur.gec.esp':'ESP’ye şuradan geçilir.',

  'ortak.patrontur.son.bugun.1':'Patronlarla tanıştın. Son bir adım kaldı: Bugün’e dön.',
  'ortak.patrontur.son.is.1':'Ee, hadi bakalım. Tanışma bitti, işe koyulalım.',
  'ortak.patrontur.son.is.2':'İlk cümleni şuraya yaz; küçük olsun, yeter. Biz buradayız.',
});

window.LIFEOS.PATRONTUR = (function(L){
  'use strict';
  const yz = id => L.PARCA.yazi('ortak.patrontur.' + id);
  const CEREZ = 'lifeos_patrontur', SIRA = Object.freeze(['ays', 'spi', 'esp']);
  const AD = Object.freeze({ ays:'AYS', spi:'SPİ', esp:'ESP' });
  const RENK = Object.freeze({ king:'#ffd166', ays:'#5a84ea', spi:'#ff7d8f', esp:'#ffb44d' });
  /* Spotun aranacağı yerler: masaüstü kenar çubuğu, sonra telefonun alt bandı. İlk görünen seçilir. */
  const HEDEF = {
    giris:['.giris'],
    girdi:['.giris__girdi', '.giris'],
    bugun:['.kenar__cekmece[data-cekmece="bugun"]', '.altbant__sekme:nth-child(1)'],
    calisma:['.kenar__cekmece[data-cekmece="calisma"]', '.altbant__sekme:nth-child(2)'],
    analiz:['.kenar__cekmece[data-cekmece="analiz"]', '.altbant__sekme:nth-child(3)'],
    sistemac:['.kenar__modulsec', '.altbant__sekme:last-child'],
    king:['.ust__king', () => Array.from(document.querySelectorAll('.kisayol__d')).find(b => /King/.test(b.textContent))],
  };
  const hedefListe = ad => (ad.indexOf('sistem:') === 0
    ? ['a.kenar__modul[data-modul-gecis="' + ad.slice(7) + '"]', 'a.menusayfa__sistem[data-modul-gecis="' + ad.slice(7) + '"]']
    : HEDEF[ad] || []);

  /* ---------- akış: tek kaynak, saf ---------- */
  /* kim: konuşan · modul: hangi kapıda geçer (null: bulunduğun yerde) · soz: cümle sayısı
     hedef: spot · tikla: gerçek düğmeye basmadan ilerlemez · cekmece: adım bu çekmecede geçer */
  function akis(ilk){
    const sira = [ilk].concat(SIRA.filter(m => m !== ilk));
    const l = [
      { id:'king.ac', kim:'king', modul:ilk, soz:3, cekmece:'bugun' },
      { id:'king.cagir', kim:'king', modul:ilk, soz:3, hedef:'king', cekmece:'bugun' },
    ];
    sira.forEach((m, i) => {
      const a = o => l.push(Object.assign({ kim:m, modul:m, soz:1 }, o, { id:m + '.' + o.id }));
      a({ id:'tanis', soz:3, cekmece:'bugun' });
      a({ id:'giris', soz:2, hedef:'giris', cekmece:'bugun' });
      a({ id:'calisma', hedef:'calisma', tikla:true });
      a({ id:'calisma-ic', soz:2, cekmece:'calisma' });
      a({ id:'analiz', hedef:'analiz', tikla:true });
      a({ id:'analiz-ic', soz:2, cekmece:'analiz' });
      const s = sira[i + 1];
      if(s){
        a({ id:'devir', soz:1, ekSoz:'devir.' + s, hedef:'sistemac', tikla:true });
        a({ id:'gec', soz:0, ekSoz:'gec.' + s, hedef:'sistem:' + s, tikla:true, once:'sistemac' });
      }
    });
    l.push({ id:'son.bugun', kim:'king', modul:null, soz:1, hedef:'bugun', tikla:true, cekmeceDegilse:'bugun' });
    l.push({ id:'son.is', kim:'king', modul:null, soz:2, hedef:'girdi', cekmece:'bugun', son:true });
    return l;
  }
  const sozler = a => {
    const l = [];
    for(let i = 1; i <= a.soz; i++) l.push(yz(a.id + '.' + i));
    if(a.ekSoz) l.push(yz(a.ekSoz));
    return l;
  };

  /* ---------- durum: hesap başına, kapıya bakmayan çerez ---------- */
  function cerezler(){
    const m = String(document.cookie || '').match(new RegExp('(?:^|;\\s*)' + CEREZ + '=([^;]*)'));
    if(!m || !m[1]) return {};
    try{ const o = JSON.parse(decodeURIComponent(m[1])); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }catch(e){ return {}; }
  }
  const anahtar = () => (L.SINEMATIK && L.SINEMATIK.hesapAnahtari ? L.SINEMATIK.hesapAnahtari() : null);
  function oku(k){ const o = cerezler()[k]; return o && typeof o === 'object' ? o : null; }
  function yaz(k, deger){
    const o = cerezler();
    delete o[k];
    o[k] = deger;
    const son = Object.keys(o).slice(-8).reduce((x, a) => { x[a] = o[a]; return x; }, {}), guvenli = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = CEREZ + '=' + encodeURIComponent(JSON.stringify(son)) + '; Path=/; Max-Age=34560000; SameSite=Strict' + guvenli;
  }
  const buModul = () => { const k = document.querySelector('.kenar[data-modul], .ust[data-modul]'); return k ? k.getAttribute('data-modul') : null; };

  /* ---------- hedef ve engel ---------- */
  function gorunur(el){
    if(!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if(r.width < 2 || r.height < 2) return false;
    const c = getComputedStyle(el);
    return c.visibility !== 'hidden' && c.display !== 'none';
  }
  function bul(ad){
    if(!ad) return null;
    const l = hedefListe(ad);
    for(let i = 0; i < l.length; i++){
      const el = typeof l[i] === 'function' ? l[i]() : document.querySelector(l[i]);
      if(gorunur(el)) return el;
    }
    return null;
  }
  /* Tur açıkken önüne geçen pencere. Hedef pencerenin içindeyse (telefonda Menü) engel sayılmaz. */
  const PENCERE = '.sinematik, #marka-perde, .overlay .sheet, #cmdk, #notlar-panel, .menusayfa, .katman, [role="dialog"][aria-modal="true"]:not([hidden])';
  function engel(hedefEl){
    if(document.documentElement.classList.contains('king-acik')) return true;
    return Array.from(document.querySelectorAll(PENCERE)).some(el => !(hedefEl && el.contains(hedefEl)) && gorunur(el));
  }
  const kurulumAcik = () => !!document.querySelector('.overlay .sheet [data-kurulum], .overlay .sheet [data-tanitim]');

  /* ---------- görünüm ---------- */
  let d = null;   // açık turun durumu; kapalıyken null
  const hareketAz = () => document.documentElement.getAttribute('data-hareket') === 'az' || !!(L.hareketAz && L.hareketAz());
  const SES_SVG = { acik:'<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 010 6" fill="none"/>', kapali:'<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 10l4 4M20 10l-4 4" fill="none"/>' };

  function kurGorunum(){
    const k = document.createElement('div');
    k.className = 'ptur' + (hareketAz() ? ' is-az' : '');
    k.setAttribute('role', 'dialog'); k.setAttribute('aria-modal', 'false'); k.setAttribute('aria-label', yz('ad'));
    k.innerHTML = '<i class="ptur__perde" aria-hidden="true"></i><i class="ptur__perde" aria-hidden="true"></i><i class="ptur__perde" aria-hidden="true"></i><i class="ptur__perde" aria-hidden="true"></i>'
      + '<i class="ptur__delik" aria-hidden="true"></i>'
      + '<section class="ptur__kart">'
      +   '<div class="ptur__kim"><span class="ptur__yuz" aria-hidden="true"></span><b class="ptur__ad"></b><span class="ptur__sayac"></span></div>'
      +   '<p class="ptur__yazi" aria-live="polite"></p>'
      +   '<p class="ptur__ipucu" hidden>' + yz('ipucu') + '</p>'
      +   '<div class="ptur__alt"><button type="button" class="btn btn--ghost btn--sm ptur__ses" data-ptur="ses"></button>'
      +   '<button type="button" class="btn btn--ghost btn--sm" data-ptur="gec">' + yz('gec') + '</button>'
      +   '<button type="button" class="btn btn--primary ptur__devam" data-ptur="devam">' + yz('devam') + '</button></div>'
      + '</section>';
    document.body.appendChild(k);
    /* Turun içindeki tıklama uygulamaya inmez: karanlığa basmak açık kenar penceresini kapatmasın. */
    k.addEventListener('click', e => { e.stopPropagation(); tikla(e); });
    return k;
  }
  function kimYaz(kim){
    d.kok.style.setProperty('--ptur-renk', RENK[kim] || RENK.king);
    d.kok.querySelector('.ptur__ad').textContent = yz('kim.' + kim);
    const P = L.PIKSEL, f = !P || !P.figurSvg ? '' : kim === 'king' ? P.figurSvg('king_' + (P.kingYuzu ? P.kingYuzu() : 'mochi'), 40) : P.figurSvg(kim, 40);
    d.kok.querySelector('.ptur__yuz').innerHTML = f;
  }
  function sesDugmesi(){
    const b = d.kok.querySelector('[data-ptur="ses"]');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' + SES_SVG[d.ses ? 'acik' : 'kapali'] + '</svg>';
    b.setAttribute('aria-label', yz(d.ses ? 'ses-kapa' : 'ses-ac'));
    b.setAttribute('aria-pressed', d.ses ? 'true' : 'false');
  }
  /* Delik ölçülür: perdeler deliğin çevresini tutar, delik yalnız görsel (tıklama geçer). */
  function olc(){
    if(!d || d.gizli) return;
    const a = d.adim, el = a ? bul(a.hedef) : null, [ust, alt, sol, sag] = d.perdeler, W = innerWidth, H = innerHeight, D = d.delik;
    const koy = (e, x, y, w, h) => { e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = Math.max(0, w) + 'px'; e.style.height = Math.max(0, h) + 'px'; };
    if(!el){
      D.classList.add('is-bos');
      koy(D, W / 2, H / 2, 0, 0);
      koy(ust, 0, 0, W, H); koy(alt, 0, 0, 0, 0); koy(sol, 0, 0, 0, 0); koy(sag, 0, 0, 0, 0);
      d.kok.classList.add('is-ortada');
      return;
    }
    d.kok.classList.remove('is-ortada');
    D.classList.remove('is-bos');
    /* Kenar çubuğu düğmesi kenarın dışına taşar ama kırpılır: spot görünen kadardır. */
    const b = el.getBoundingClientRect(), kap = el.closest('.kenar'), sinir = kap ? kap.getBoundingClientRect().right : b.right;
    const r = { left:b.left, top:b.top, right:Math.min(b.right, sinir), bottom:b.bottom, width:Math.min(b.right, sinir) - b.left, height:b.height }, PAY = 4;
    koy(D, r.left - PAY, r.top - PAY, r.width + PAY * 2, r.height + PAY * 2);
    if(a.tikla){
      koy(ust, 0, 0, W, r.top); koy(alt, 0, r.bottom, W, H - r.bottom);
      koy(sol, 0, r.top, r.left, r.height); koy(sag, r.right, r.top, W - r.right, r.height);
    }else{
      koy(ust, 0, 0, W, H); koy(alt, 0, 0, 0, 0); koy(sol, 0, 0, 0, 0); koy(sag, 0, 0, 0, 0);
    }
    /* Kart spotun üstüne binmesin: spot alt yarıdaysa kart üste çıkar. */
    d.kok.classList.toggle('is-ustte', r.top + r.height / 2 > H * 0.55);
  }
  function kaydir(el){
    const r = el.getBoundingClientRect();
    if(r.top < 64 || r.bottom > innerHeight - 200){
      try{ el.scrollIntoView({ block:'center', behavior:hareketAz() ? 'auto' : 'smooth' }); }catch(e){ /* eski tarayıcı */ }
    }
  }

  /* ---------- konuşma ---------- */
  function sus(){ const K = L.KING; try{ if(K && K.sus) K.sus(); }catch(e){ /* yok */ } }
  function konus(m){
    if(!d.ses) return;
    const K = L.KING;
    try{ if(K && K.seslendir) K.seslendir(m); }catch(e){ /* ses yok: yazı yeter */ }
  }
  const konusuyor = () => { const K = L.KING; try{ return !!(K && K.konusuyorMu && K.konusuyorMu()); }catch(e){ return false; } };
  const uyu = ms => new Promise(ok => setTimeout(ok, ms));
  /* Söz kuşağı: yeni adım gelince eskisi kendiliğinden düşer. Okuma süresi sesin yedeğidir. */
  async function soyle(l){
    const no = ++d.kusak, x = d;
    x.kart.classList.remove('is-bitti');
    for(let i = 0; i < l.length; i++){
      if(x !== d || no !== x.kusak) return;
      x.yazi.textContent = l[i];
      x.yazi.classList.remove('is-yeni'); void x.yazi.offsetWidth; x.yazi.classList.add('is-yeni');
      konus(l[i]);
      const bas = Date.now(), en_az = Math.max(1300, l[i].length * 50), emniyet = en_az * 3 + 6000;
      while(x === d && no === x.kusak && Date.now() - bas < emniyet && (Date.now() - bas < en_az || (x.ses && konusuyor()))) await uyu(120);
    }
    if(x === d && no === x.kusak) x.kart.classList.add('is-bitti');
  }

  /* ---------- adım ---------- */
  function goster(a){
    if(!d) return;
    d.adim = a;
    clearTimeout(d.yedek);
    if(a.modul && a.modul !== d.mod) return uzakGoster(a);
    d.gizli = false;
    d.kok.hidden = false;
    d.kok.classList.remove('is-bekle');
    kimYaz(a.kim);
    /* Yarıda kalan adım doğru ekranda sürsün: gerekiyorsa çekmece açılır. */
    if(a.cekmece){ const b = bul(a.cekmece); if(b && !b.classList.contains('is-on')) b.click(); }
    kenarTut(a);
    onceAc(a);
    const i = d.akis.indexOf(a);
    d.kok.querySelector('.ptur__sayac').textContent = (i + 1) + ' / ' + d.akis.length;
    const devam = d.kok.querySelector('[data-ptur="devam"]'), ipucu = d.kok.querySelector('.ptur__ipucu');
    devam.textContent = yz(a.son ? 'basla' : 'devam');
    devam.hidden = !!a.tikla;
    ipucu.hidden = !a.tikla;
    soyle(sozler(a));
    /* Çizim bitsin, öyle ölç ve odakla. */
    setTimeout(() => {
      if(!d || d.adim !== a || d.gizli) return;
      const el = bul(a.hedef);
      if(el) kaydir(el);
      olc();
      odakla(a);
    }, 80);
    /* Hedef bu ekranda yoksa kilitlenmez. */
    if(a.tikla) d.yedek = setTimeout(() => { if(d && d.adim === a && !bul(a.hedef)){ devam.hidden = false; ipucu.hidden = true; odakla(a); } }, 1400);
  }
  /* Kenar yalnız fare üstündeyken açıktır; fare artık perdede: spot sürerken açık tutulur. */
  function kenarTut(a){
    const k = document.querySelector('.kenar');
    if(k) k.classList.toggle('kenar--tutulu', !!(a && a.tikla && /^(sistem|calisma|analiz|bugun)/.test(a.hedef || '')));
  }
  /* Sistem penceresi kapalıysa (yeniden yükleme, dışarı tıklama) açılır. Düğme aç-kapa olduğu için önce bakılır. */
  function onceAc(a){
    if(!a.once || bul(a.hedef) || document.querySelector('.kenar__moduller.is-acik, .menusayfa')) return;
    const b = bul(a.once);
    if(b) b.click();
  }
  function odakla(a){
    const el = a.tikla ? bul(a.hedef) : null;
    const hedef = el || d.kok.querySelector('[data-ptur="devam"]:not([hidden])');
    if(hedef && hedef.focus) try{ hedef.focus({ preventScroll:true }); }catch(e){ /* yok */ }
  }
  /* Kaldığımız yer başka kapıda: oraya götüren kart. */
  function uzakGoster(a){
    d.gizli = false;
    d.kok.hidden = false;
    kimYaz(a.kim);
    d.kok.querySelector('.ptur__sayac').textContent = '';
    const devam = d.kok.querySelector('[data-ptur="devam"]');
    devam.textContent = yz('devam'); devam.hidden = false;
    d.kok.querySelector('.ptur__ipucu').hidden = true;
    soyle([yz('uzak').replace('{ad}', AD[a.modul])]);
    d.delik.classList.add('is-bos');
    d.kok.classList.add('is-ortada');
    d.adim = a;
    d.perdeler.forEach((e, n) => { e.style.left = e.style.top = '0'; e.style.width = n ? '0' : '100%'; e.style.height = n ? '0' : '100%'; });
    d.delik.style.left = '50%'; d.delik.style.top = '50%'; d.delik.style.width = d.delik.style.height = '0';
    setTimeout(() => { if(d && d.adim === a) devam.focus({ preventScroll:true }); }, 60);
  }
  function kapiyaGit(m){
    const K = L.KABUK, A = L.ANIMASYON, url = K && K.adres ? K.adres(m) : null;
    if(url){ window.location.href = A && A.tasimaEkle ? A.tasimaEkle(url) : url; return true; }
    return false;
  }
  function kaydet(){ yaz(d.k, { a:d.adim.id, i:d.ilk, s:d.ses ? 1 : 0 }); }
  function ileri(tiklandi){
    const a = d.adim, n = d.akis[d.akis.indexOf(a) + 1];
    sus();
    d.kusak++;
    if(!n) return bitir(false);
    d.adim = n;
    kaydet();
    if(n.modul && n.modul !== d.mod){
      /* Gerçek bağlantı sayfayı değiştiriyor: kart çekilir; gitmezse yine görünür. */
      if(tiklandi){ d.gizli = true; d.kok.hidden = true; d.yedek = setTimeout(() => { if(d && d.adim === n) goster(n); }, 6000); return; }
      if(a.modul !== n.modul && a.modul === d.mod && !kapiyaGit(n.modul)) return kapanisaAtla();
      return;
    }
    /* Düğme ekranı değiştirirken kısa bekleme: yeni çizime ölçülsün. */
    d.gizli = tiklandi;
    if(tiklandi) d.kok.hidden = true;
    setTimeout(() => { if(d && d.adim === n) goster(n); }, tiklandi ? 260 : 0);
  }
  /* Öteki kapıya gidilemiyorsa (tek dosya sürümü) tur burada kapanır: yarım bırakmaz. */
  function kapanisaAtla(){
    const n = d.akis.find(x => x.modul === null);
    d.adim = n;
    kaydet();
    goster(n);
  }
  function bitir(gecildi){
    const x = d;
    if(!x) return;
    sus();
    yaz(x.k, { b:1 });
    clearInterval(x.dongu); clearTimeout(x.yedek);
    document.removeEventListener('keydown', tus, true);
    document.removeEventListener('click', yakala, true);
    window.removeEventListener('resize', olc);
    window.removeEventListener('scroll', olc, true);
    x.kok.remove();
    d = null;
    kenarTut(null);
    if(gecildi){
      const NS = { ays:window.R, spi:window.SP, esp:window.ESP }[x.mod];
      try{ if(NS && NS.UI && NS.UI.toast) NS.UI.toast(yz('gecildi')); }catch(e){ /* mesaj süs */ }
    }else{
      const g = bul('girdi');
      if(g && g.focus) try{ g.focus({ preventScroll:false }); }catch(e){ /* yok */ }
    }
  }

  /* ---------- olaylar ---------- */
  function tikla(e){
    const b = e.target.closest && e.target.closest('[data-ptur]');
    if(!b || !d) return;
    const ne = b.getAttribute('data-ptur');
    if(ne === 'gec') bitir(true);
    else if(ne === 'ses'){
      d.ses = !d.ses;
      kaydet();
      if(!d.ses) sus(); else if(d.yazi.textContent) konus(d.yazi.textContent);
      sesDugmesi();
    }else if(ne === 'devam'){
      const a = d.adim;
      if(a.modul && a.modul !== d.mod){ sus(); if(!kapiyaGit(a.modul)) kapanisaAtla(); return; }
      ileri(false);
    }
  }
  /* Gerçek düğmeye gerçek tıklama: ilerler, olayı uygulamaya bırakır. */
  function yakala(e){
    if(!d || d.gizli || !d.adim || !d.adim.tikla) return;
    const el = bul(d.adim.hedef);
    if(el && e.target && el.contains(e.target)) ileri(true);
  }
  /* Klavye: sekme yalnız spot ile kart arasında döner; Esc turu geçer. */
  function tus(e){
    if(!d || d.gizli) return;
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); bitir(true); return; }
    if(e.key !== 'Tab') return;
    const a = d.adim, el = a && a.tikla ? bul(a.hedef) : null;
    const l = (el ? [el] : []).concat(Array.from(d.kok.querySelectorAll('button:not([hidden])')));
    if(!l.length) return;
    const i = l.indexOf(document.activeElement), n = l.length, s = i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + n) % n;
    e.preventDefault();
    l[s].focus({ preventScroll:true });
  }
  /* Önüne pencere geçince tur susar, kapanınca aynı adımdan sürer. */
  function nabiz(){
    if(!d || !d.adim) return;
    const a = d.adim;
    if(a.modul && a.modul !== d.mod) return;
    if(!d.gizli){ kenarTut(a); onceAc(a); }
    const e = engel(bul(a.hedef));
    if(e && !d.bekliyor){
      d.bekliyor = true;
      sus();
      d.kusak++;
      if(kurulumAcik() && a.modul === d.mod && !d.kurulumDendi && yaziVar(a.kim + '.kurulum')){
        d.kurulumDendi = true;
        d.gizli = true;
        d.kok.hidden = false;
        d.kok.classList.add('is-bekle');
        kimYaz(a.kim);
        d.kok.querySelector('.ptur__sayac').textContent = '';
        d.kok.querySelector('.ptur__ipucu').hidden = true;
        d.kok.querySelector('[data-ptur="devam"]').hidden = true;
        soyle([yz(a.kim + '.kurulum')]);
      }else{
        d.gizli = true;
        d.kok.hidden = !kurulumAcik() || !d.kok.classList.contains('is-bekle');
      }
    }else if(!e && d.bekliyor){
      d.bekliyor = false;
      goster(a);
    }else if(d.bekliyor && !kurulumAcik()){
      d.kok.hidden = true;
    }
    olc();
  }
  const yaziVar = id => { try{ return !!L.PARCA.yazi('ortak.patrontur.' + id); }catch(e){ return false; } };

  function ac(k, mod, durum){
    if(d) return false;
    const ilk = durum.i && SIRA.indexOf(durum.i) >= 0 ? durum.i : mod;
    const liste = akis(ilk), x = liste.find(a => a.id === durum.a) || liste[0];
    d = { k, mod, ilk, akis:liste, adim:null, kok:null, ses:durum.s !== 0, kusak:0, gizli:false, bekliyor:false };
    d.kok = kurGorunum();
    d.kart = d.kok.querySelector('.ptur__kart');
    d.yazi = d.kok.querySelector('.ptur__yazi');
    d.delik = d.kok.querySelector('.ptur__delik');
    d.perdeler = Array.from(d.kok.querySelectorAll('.ptur__perde'));
    sesDugmesi();
    document.addEventListener('keydown', tus, true);
    document.addEventListener('click', yakala, true);
    window.addEventListener('resize', olc);
    window.addEventListener('scroll', olc, true);
    d.adim = x;
    kaydet();
    d.dongu = setInterval(nabiz, 180);
    if(engel(bul(x.hedef))){ d.gizli = true; d.kok.hidden = true; d.bekliyor = false; nabiz(); }
    else goster(x);
    return true;
  }
  /* Baştan başlat: Menü ya da Kılavuz. Geçmiş silinir, bulunduğun modül ilk olur. */
  function baslat(){
    if(d) bitir(true);
    const k = anahtar(), mod = buModul();
    if(!k || !mod || SIRA.indexOf(mod) < 0) return false;
    const m = document.querySelector('.menusayfa__kapat');
    if(m) m.click();
    return ac(k, mod, {});
  }
  /* Kendiliğinden: film görülmüş, kurulum kapanmış, tur bitmemiş. */
  function kendiliginden(){
    if(navigator.webdriver || /\/tests\//.test(location.pathname)) return;
    const dene = () => {
      if(d) return;
      const k = anahtar(), mod = buModul();
      if(!k || !mod || SIRA.indexOf(mod) < 0) return;
      const s = oku(k);
      if(s && s.b) return;
      if(L.SINEMATIK && L.SINEMATIK.gerekli && L.SINEMATIK.gerekli()) return setTimeout(dene, 600);
      /* Yarım tur beklemez, kurulum kartında da konuşur; ilk açılış pencereler kapanınca. */
      if(!s && engel(null)) return setTimeout(dene, 600);
      ac(k, mod, s || {});
    };
    setTimeout(dene, 1500);
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest && e.target.closest('[data-patrontur-ac]');
      if(b){ e.preventDefault(); baslat(); }
    });
    if(document.readyState === 'complete') kendiliginden(); else window.addEventListener('load', kendiliginden, { once:true });
  }

  return Object.freeze({ baslat, bitir, acikMi:() => !!d, SIRA, _akis:akis, _sozler:sozler, _oku:oku, _yaz:yaz, _durum:() => d, _ac:ac, _hedefListe:hedefListe });
})(window.LIFEOS);
