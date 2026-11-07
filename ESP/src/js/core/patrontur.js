/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/patrontur.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
  'ortak.patrontur.oto':'Otomatik',
  'ortak.patrontur.oto-ipucu':'Otomatik: sen dokunmasan da tur kendi ilerler, menüleri kendisi açar.',
  'ortak.patrontur.oto-izle':'Turu otomatik izle',
  'ortak.patrontur.anladin-mi':'Anlamadın mı? Takıldıysan söyle, bir daha anlatayım.',
  'ortak.patrontur.anlamadim':'Anlamadım',
  'ortak.patrontur.tekrar':'Tamam, bir daha ve yavaşça anlatayım.',
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
  /* Piksel araba (bizim çizimimiz): gezgin «araba» yolunda altına biner. */
  const ARABA_SVG = '<svg viewBox="0 0 20 9" width="80" height="36" shape-rendering="crispEdges" aria-hidden="true" focusable="false">'
    + '<path fill="#2a1f2e" d="M3 1h10v1h2v1h3v1h1v3H1V4h1V2h1z"/><path fill="#e0503c" d="M4 2h8v1h3v1h3v2H2V4h2z"/><path fill="#ff8a6a" d="M2 4h16v1H2z"/>'
    + '<path fill="#bfe3ff" d="M5 2.5h3V4H5zm4 0h3V4H9z"/><path fill="#ffe08a" d="M17 5h1v1h-1z"/>'
    + '<path fill="#1c1622" d="M3 6h4v3H3zm10 0h4v3h-4z"/><path fill="#8a8394" d="M4 7h2v1H4zm10 0h2v1h-2z"/></svg>';
  const OTO_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 5l7 7-7 7zM13 5l7 7-7 7z" fill="currentColor"/></svg>';
  const SES_SVG = { acik:'<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 010 6" fill="none"/>', kapali:'<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 10l4 4M20 10l-4 4" fill="none"/>' };

  function kurGorunum(){
    const k = document.createElement('div');
    k.className = 'ptur' + (hareketAz() ? ' is-az' : '');
    k.setAttribute('role', 'dialog'); k.setAttribute('aria-modal', 'false'); k.setAttribute('aria-label', yz('ad'));
    k.innerHTML = '<i class="ptur__perde" aria-hidden="true"></i><i class="ptur__perde" aria-hidden="true"></i><i class="ptur__perde" aria-hidden="true"></i><i class="ptur__perde" aria-hidden="true"></i>'
      + '<i class="ptur__delik" aria-hidden="true"></i>'
      /* Gezgin: konuşan patron sistemin içinde dolaşır (kullanıcı, 2026-11-07: «kutunun içinde sabit durmasın»). */
      + '<div class="ptur__gezgin" aria-hidden="true"><i class="ptur__ag"></i><span class="ptur__arac">' + ARABA_SVG + '</span><span class="ptur__figur"></span></div>'
      + '<section class="ptur__kart">'
      +   '<div class="ptur__kim"><b class="ptur__ad"></b><span class="ptur__sayac"></span></div>'
      +   '<p class="ptur__yazi" aria-live="polite"></p>'
      +   '<p class="ptur__ipucu" hidden>' + yz('ipucu') + '</p>'
      +   '<p class="ptur__soru" hidden>' + yz('anladin-mi') + '</p>'
      +   '<div class="ptur__alt"><button type="button" class="btn btn--ghost btn--sm ptur__ses" data-ptur="ses"></button>'
      +   '<button type="button" class="btn btn--ghost btn--sm ptur__oto" data-ptur="oto" aria-pressed="false" title="' + yz('oto-ipucu') + '">' + OTO_SVG + '<span>' + yz('oto') + '</span></button>'
      +   '<button type="button" class="btn btn--ghost btn--sm" data-ptur="gec">' + yz('gec') + '</button>'
      +   '<button type="button" class="btn btn--ghost btn--sm ptur__anla" data-ptur="anla" hidden>' + yz('anlamadim') + '</button>'
      +   '<button type="button" class="btn btn--primary ptur__devam" data-ptur="devam">' + yz('devam') + '</button></div>'
      + '</section>';
    document.body.appendChild(k);
    /* Turun içindeki tıklama uygulamaya inmez: karanlığa basmak açık kenar penceresini kapatmasın. */
    k.addEventListener('click', e => { e.stopPropagation(); tikla(e); });
    /* Karanlığa ya da kart yazısına basmak odağı spottan almasın: klavyeyle Enter sürsün. */
    k.addEventListener('mousedown', e => { if(!e.target.closest('button')) e.preventDefault(); });
    return k;
  }
  function kimYaz(kim){
    d.kok.style.setProperty('--ptur-renk', RENK[kim] || RENK.king);
    d.kok.querySelector('.ptur__ad').textContent = yz('kim.' + kim);
    const P = L.PIKSEL, f = !P || !P.figurSvg ? '' : kim === 'king' ? P.figurSvg('king_' + (P.kingYuzu ? P.kingYuzu() : 'mochi'), FIGUR) : P.figurSvg(kim, FIGUR);
    d.kok.querySelector('.ptur__figur').innerHTML = f;
  }
  function otoDugmesi(){
    const b = d.kok.querySelector('[data-ptur="oto"]');
    b.setAttribute('aria-pressed', d.oto ? 'true' : 'false');
    b.classList.toggle('is-on', !!d.oto);
  }

  /* ---------- gezgin: yeri ve yolculuğu ----------
     Patron spotun yanına gider; her adımda başka bir yolla (kullanıcı, 2026-11-07: «bazı yerlerde gezsin,
     zıplasın, ışınlansın, arabaya binsin, dev gibi sıçrasın, ağ atıp sallansın»). Biçimler bizimdir; hiçbir
     oyunun ya da karakterin görüntüsü kullanılmaz. Hareket yalnız görseldir: adım mantığı onu beklemez. */
  const FIGUR = 64, YOLLAR = Object.freeze(['yuru', 'zipla', 'isinlan', 'araba', 'dev', 'ag', 'roket']);
  const kenet = (v, a, b) => Math.max(a, Math.min(b, v)), ara = (a, b, t) => a + (b - a) * t, yumus = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  /* Figürün duracağı yer: hedefin sağı, solu, altı, üstü; hedefi örtmeyen ve ekrana sığan ilk yer. Hedef yoksa orta. */
  function durak(el){
    const W = innerWidth, H = innerHeight, P = 14;
    if(!el) return { x:Math.round(W / 2 - FIGUR / 2), y:Math.round(H * .34 - FIGUR / 2) };
    const r = el.getBoundingClientRect(), oy = r.top + r.height / 2 - FIGUR / 2, ox = r.left + r.width / 2 - FIGUR / 2;
    const aday = [[r.right + P, oy], [r.left - P - FIGUR, oy], [ox, r.bottom + P], [ox, r.top - P - FIGUR]];
    const s = aday.find(([x, y]) => x >= 4 && y >= 4 && x + FIGUR <= W - 4 && y + FIGUR <= H - 4);
    const [x, y] = s || [kenet(r.right + P, 4, W - FIGUR - 4), kenet(oy, 4, H - FIGUR - 4)];
    return { x:Math.round(x), y:Math.round(y) };
  }
  function yerKoy(p){
    d.pos = p;
    d.gezgin.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px)';
  }
  /* Kıvılcım: birkaç piksel kare dağılır ve söner (ışınlanma, iniş tozu, roket alevi). */
  function kivilcim(x, y, renk, n, guc){
    if(hareketAz()) return;
    for(let i = 0; i < n; i++){
      const e = document.createElement('i'), a = Math.random() * Math.PI * 2, u = (guc || 30) * (.4 + Math.random() * .8);
      e.className = 'ptur__pk'; e.style.background = renk; e.style.left = x + 'px'; e.style.top = y + 'px';
      d.kok.appendChild(e);
      const an = e.animate([{ transform:'translate(0,0)', opacity:1 }, { transform:'translate(' + Math.cos(a) * u + 'px,' + Math.sin(a) * u + 'px)', opacity:0 }], { duration:450 + Math.random() * 350, easing:'cubic-bezier(.2,.7,.3,1)' });
      an.onfinish = () => e.remove();
    }
  }
  /* Her yol: süre ve t (0..1) → { x, y, s (ölçek), o (saydamlık), ag (ağın ucu) }; kare/son kancaları. */
  function yolTarifi(tur, a, b){
    const u = Math.hypot(b.x - a.x, b.y - a.y), duz = t => ({ x:ara(a.x, b.x, t), y:ara(a.y, b.y, t) });
    const ortaX = a.x + FIGUR / 2, ortaY = a.y + FIGUR / 2, varX = b.x + FIGUR / 2, varY = b.y + FIGUR / 2;
    if(tur === 'zipla'){ const n = Math.max(2, Math.round(u / 150)); return { sure:n * 330, yol:t => { const p = duz(t), k = (t * n) % 1; return { x:p.x, y:p.y - Math.sin(k * Math.PI) * 42, s:1 }; } }; }
    if(tur === 'isinlan') return { sure:950,
      bas:() => kivilcim(ortaX, ortaY, '#b16cff', 14, 34),
      yol:t => t < .35 ? { x:a.x, y:a.y, s:1 - t / .35, o:1 - t / .35 } : t < .65 ? { x:b.x, y:b.y, s:0, o:0, goz:duz((t - .35) / .3) } : { x:b.x, y:b.y, s:(t - .65) / .35, o:1 },
      orta:() => kivilcim(varX, varY, '#b16cff', 16, 38) };
    if(tur === 'araba') return { sure:kenet(u / .7, 650, 1500), sinif:'is-araba', yol:t => { const p = duz(yumus(t)); return { x:p.x, y:p.y - (Math.round(t * 30) % 2) * 2, s:1 }; } };
    if(tur === 'dev'){ const h = Math.max(170, u * .55); return { sure:1050, sinif:'is-dev', yol:t => { const p = duz(yumus(t)); return { x:p.x, y:p.y - Math.sin(t * Math.PI) * h, s:1 + .45 * Math.sin(t * Math.PI) }; },
      son:() => { kivilcim(varX, b.y + FIGUR, '#d9c7a4', 18, 46); d.kok.classList.remove('is-sars'); void d.kok.offsetWidth; d.kok.classList.add('is-sars'); } }; }
    if(tur === 'ag'){
      const cx = (a.x + b.x) / 2, dip = Math.max(a.y, b.y) + Math.min(120, 40 + u * .25), ust = { x:cx + FIGUR / 2, y:Math.max(0, Math.min(a.y, b.y) - Math.max(110, u * .35)) };
      return { sure:1250, sinif:'is-ag', yol:t => {
        if(t < .15) return { x:a.x, y:a.y, s:1, ag:{ ...ust, k:t / .15 } };
        if(t > .88) return { x:b.x, y:b.y, s:1, ag:{ ...ust, k:1 - (t - .88) / .12 } };
        const q = yumus((t - .15) / .73), x = (1 - q) * (1 - q) * a.x + 2 * (1 - q) * q * cx + q * q * b.x, y = (1 - q) * (1 - q) * a.y + 2 * (1 - q) * q * dip + q * q * b.y;
        return { x, y, s:1, r:(q - .5) * 30, ag:{ ...ust, k:1 } };
      } };
    }
    if(tur === 'roket') return { sure:kenet(u / .55, 800, 1600), sinif:'is-roket', yol:t => {
      const kalk = 56, q = t < .2 ? 0 : t > .8 ? 1 : yumus((t - .2) / .6), p = duz(q), y = p.y - kalk * (t < .2 ? t / .2 : t > .8 ? (1 - t) / .2 : 1);
      return { x:p.x, y, s:1, alev:true };
    } };
    /* yürü */
    return { sure:kenet(u / .32, 500, 1800), sinif:'is-yuru', yol:t => { const p = duz(t); return { x:p.x, y:p.y - Math.abs(Math.sin(t * u / 22 * Math.PI)) * 5, s:1 }; } };
  }
  /* Döner: varınca çözülen söz. Azaltılmış harekette ve ilk görünüşte sıçrar. */
  function gez(hedef, tur){
    const x = d, g = x.gezgin, ag = g.querySelector('.ptur__ag'), fig = g.querySelector('.ptur__figur');
    /* Önceki yolculuk (varsa) burada kesilir; yarıda kaldığı yer yeni yolun başıdır. */
    const no = (x.yolNo = (x.yolNo || 0) + 1);
    if(x.yolSinif) g.classList.remove(x.yolSinif);
    x.yolSinif = null;
    fig.style.transform = ''; fig.style.opacity = ''; ag.style.opacity = '0';
    if(x.yolda && x.yerNe) x.pos = x.yerNe;
    if(!x.pos || hareketAz() || Math.hypot(hedef.x - x.pos.x, hedef.y - x.pos.y) < 6){
      x.yolda = false; x.kok.classList.remove('is-yolda'); yerKoy(hedef); return Promise.resolve();
    }
    const a = x.pos, T = yolTarifi(tur, a, hedef), bas = performance.now();
    x.yolda = true;
    x.kok.classList.add('is-yolda');
    x.yolSinif = T.sinif || null;
    if(T.sinif) g.classList.add(T.sinif);
    g.dataset.yon = hedef.x < a.x ? 'sol' : 'sag';
    if(T.bas) T.bas();
    let ortaOldu = false, sonAlev = 0, goz = null;
    return new Promise(bitti => {
      const kare = simdi => {
        /* Yenisi başladıysa (ya da tur kapandıysa) bu yolculuk izini bırakmadan çekilir. */
        if(x !== d || no !== x.yolNo){ if(goz) goz.remove(); bitti(); return; }
        const t = Math.min(1, (simdi - bas) / T.sure), p = T.yol(t);
        x.yerNe = { x:p.x, y:p.y };
        g.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px)';
        fig.style.transform = 'scale(' + (p.s == null ? 1 : p.s).toFixed(3) + ')' + (p.r ? ' rotate(' + p.r.toFixed(1) + 'deg)' : '');
        fig.style.opacity = p.o == null ? '' : String(p.o);
        if(p.ag){
          const fx = p.x + FIGUR / 2, fy = p.y + 6, dx = p.ag.x - fx, dy = p.ag.y - fy;
          ag.style.width = Math.round(Math.hypot(dx, dy) * p.ag.k) + 'px';
          ag.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
          ag.style.opacity = '1';
        }else ag.style.opacity = '0';
        if(p.goz){ if(!goz){ goz = document.createElement('i'); goz.className = 'ptur__goz'; x.kok.appendChild(goz); } goz.style.transform = 'translate(' + Math.round(p.goz.x + FIGUR / 2 - 5) + 'px,' + Math.round(p.goz.y + FIGUR / 2 - 5) + 'px)'; }
        else if(goz){ goz.remove(); goz = null; }
        if(p.alev && simdi - sonAlev > 45){ sonAlev = simdi; kivilcim(p.x + FIGUR / 2, p.y + FIGUR - 4, Math.random() < .5 ? '#ffb347' : '#ff6b3d', 2, 18); }
        if(!ortaOldu && t >= .65 && T.orta){ ortaOldu = true; T.orta(); }
        if(t < 1){ requestAnimationFrame(kare); return; }
        if(goz) goz.remove();
        if(T.sinif) g.classList.remove(T.sinif);
        x.yolSinif = null;
        fig.style.transform = ''; fig.style.opacity = ''; ag.style.opacity = '0';
        x.pos = { x:hedef.x, y:hedef.y };
        if(T.son) T.son();
        x.yolda = false;
        x.kok.classList.remove('is-yolda');
        bitti();
      };
      requestAnimationFrame(kare);
    });
  }
  /* Balon figürün üstünde (sığmazsa altında); hedefi örtmez. Dar ekranda alta yapışık kalır (CSS). */
  function balonKoy(el){
    if(!d || d.yolda || innerWidth < 680) return;
    const k = d.kart, W = innerWidth, H = innerHeight, bw = k.offsetWidth, bh = k.offsetHeight, p = d.pos || durak(null);
    const r = el ? el.getBoundingClientRect() : null, ort = (x, y) => !r || x > r.right || x + bw < r.left || y > r.bottom || y + bh < r.top;
    const x = kenet(p.x + FIGUR / 2 - bw / 2, 12, W - bw - 12);
    const yer = [p.y - bh - 12, p.y + FIGUR + 12, 12, H - bh - 12].map(y => kenet(y, 12, H - bh - 12));
    const y = yer.find(v => ort(x, v)) != null ? yer.find(v => ort(x, v)) : yer[0];
    k.style.left = Math.round(x) + 'px'; k.style.top = Math.round(y) + 'px';
    k.classList.toggle('is-altta', y > p.y);
    k.style.setProperty('--kuyruk', Math.round(kenet(p.x + FIGUR / 2 - x, 18, bw - 18)) + 'px');
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
    /* Anlatıcının sesi EMA (kullanıcı, 2026-11-07); EMA yoksa King'in yolu cihaz sesine düşer. */
    try{ if(K && K.seslendir) K.seslendir(m, undefined, 'ema'); }catch(e){ /* ses yok: yazı yeter */ }
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
    if(x === d && no === x.kusak){ x.kart.classList.add('is-bitti'); x.bittiZaman = Date.now(); }
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
    soruKapat();
    soyle(sozler(a));
    /* Çizim bitsin, öyle ölç; patron spotun yanına kendi yoluyla gider, balon varınca açılır. */
    setTimeout(() => {
      if(!d || d.adim !== a || d.gizli) return;
      const el = bul(a.hedef);
      if(el) kaydir(el);
      olc();
      odakla(a);
      const tur = d.pos ? YOLLAR[i % YOLLAR.length] : 'isinlan';
      if(!d.pos) yerKoy({ x:innerWidth / 2 - FIGUR / 2, y:-FIGUR * 2 });
      gez(durak(el), tur).then(() => { if(d && d.adim === a){ balonKoy(bul(a.hedef)); } });
      balonKoy(el);
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
    soruKapat();
    if(!d.pos) yerKoy({ x:innerWidth / 2 - FIGUR / 2, y:-FIGUR * 2 });
    gez(durak(null), 'isinlan').then(() => { if(d && d.adim === a) balonKoy(null); });
    setTimeout(() => { if(d && d.adim === a) devam.focus({ preventScroll:true }); }, 60);
  }
  function kapiyaGit(m){
    const K = L.KABUK, A = L.ANIMASYON, url = K && K.adres ? K.adres(m) : null;
    if(url){
      const h = A && A.tasimaEkle ? A.tasimaEkle(url) : url, git = () => { window.location.href = h; };
      /* Bulutlu geçişle (animasyon.js gecis): tur da modülden modüle bulutla gider. */
      if(!(A && A.gecis && A.gecis({ modul:m, url:h, git }))) git();
      return true;
    }
    return false;
  }
  function kaydet(){ yaz(d.k, { a:d.adim.id, i:d.ilk, s:d.ses ? 1 : 0, o:d.oto ? 1 : 0 }); }

  /* ---------- boşta kalınca soru, otomatik ilerleme ----------
     Söz bitti, kullanıcı BOS_MS boyunca dokunmadı: patron «Anlamadın mı?» der, altta «Anlamadım» çıkar;
     basınca adımı yavaşça yeniden anlatır ve spot nabız atar. Otomatik açıkken soru sorulmaz: söz bitince
     OTO_MS sonra tur kendi ilerler, «bas» adımında gerçek düğmeye kendisi basar (menüler kendi açılır). */
  const BOS_MS = 18000, OTO_MS = 1700;
  function dokundu(){ if(d){ d.sonDokunus = Date.now(); } }
  function soruKapat(){
    if(!d) return;
    d.soruldu = false;
    d.sonDokunus = Date.now();
    d.kok.querySelector('.ptur__soru').hidden = true;
    d.kok.querySelector('[data-ptur="anla"]').hidden = true;
  }
  function sor(){
    d.soruldu = true;
    d.kok.querySelector('.ptur__soru').hidden = false;
    const b = d.kok.querySelector('[data-ptur="anla"]');
    b.hidden = false;
    d.gezgin.classList.remove('is-sor'); void d.gezgin.offsetWidth; d.gezgin.classList.add('is-sor');
    konus(yz('anladin-mi'));
    balonKoy(bul(d.adim.hedef));
    try{ b.focus({ preventScroll:true }); }catch(e){ /* yok */ }
  }
  function tekrarAnlat(){
    const a = d.adim;
    soruKapat();
    sus();
    d.delik.classList.remove('is-nabiz'); void d.delik.offsetWidth; d.delik.classList.add('is-nabiz');
    soyle([yz('tekrar')].concat(sozler(a), a.tikla ? [yz('ipucu')] : []));
    gez({ x:d.pos.x, y:d.pos.y - 1 }, 'zipla');
    setTimeout(() => { if(d && d.adim === a) balonKoy(bul(a.hedef)); }, 60);
  }
  function otomatikAdim(){
    const a = d.adim;
    d.bittiZaman = 0;
    if(a.modul && a.modul !== d.mod){ sus(); if(!kapiyaGit(a.modul)) kapanisaAtla(); return; }
    if(a.son) return bitir(false);
    const el = a.tikla ? bul(a.hedef) : null;
    if(el){ el.click(); return; }
    ileri(false);
  }
  function ileri(tiklandi){
    const a = d.adim, n = d.akis[d.akis.indexOf(a) + 1];
    sus();
    d.kusak++;
    d.bittiZaman = 0;
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
    document.removeEventListener('pointerdown', dokundu, true);
    document.removeEventListener('keydown', dokundu, true);
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
    }else if(ne === 'oto'){
      d.oto = !d.oto;
      kaydet();
      otoDugmesi();
      soruKapat();
    }else if(ne === 'anla') tekrarAnlat();
    else if(ne === 'devam'){
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
    if(!d.gizli && !d.bekliyor && d.bittiZaman && d.kart.classList.contains('is-bitti')){
      const simdi = Date.now();
      if(d.oto && !d.yolda && simdi - d.bittiZaman > OTO_MS) return otomatikAdim();
      if(!d.oto && !d.soruldu && simdi - Math.max(d.sonDokunus || 0, d.bittiZaman) > BOS_MS) sor();
    }
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
        d.kart.style.left = d.kart.style.top = '';
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
    d = { k, mod, ilk, akis:liste, adim:null, kok:null, ses:durum.s !== 0, oto:durum.o === 1, kusak:0, gizli:false, bekliyor:false, pos:null, sonDokunus:Date.now() };
    d.kok = kurGorunum();
    d.kart = d.kok.querySelector('.ptur__kart');
    d.yazi = d.kok.querySelector('.ptur__yazi');
    d.delik = d.kok.querySelector('.ptur__delik');
    d.gezgin = d.kok.querySelector('.ptur__gezgin');
    d.perdeler = Array.from(d.kok.querySelectorAll('.ptur__perde'));
    sesDugmesi();
    otoDugmesi();
    document.addEventListener('keydown', tus, true);
    document.addEventListener('click', yakala, true);
    document.addEventListener('pointerdown', dokundu, true);
    document.addEventListener('keydown', dokundu, true);
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
  function baslat(oto){
    if(d) bitir(true);
    const k = anahtar(), mod = buModul();
    if(!k || !mod || SIRA.indexOf(mod) < 0) return false;
    const m = document.querySelector('.menusayfa__kapat');
    if(m) m.click();
    return ac(k, mod, oto ? { o:1 } : {});
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
      if(b){ e.preventDefault(); baslat(b.getAttribute('data-patrontur-ac') === 'oto'); }
    });
    if(document.readyState === 'complete') kendiliginden(); else window.addEventListener('load', kendiliginden, { once:true });
  }

  return Object.freeze({ baslat, bitir, acikMi:() => !!d, SIRA, _akis:akis, _sozler:sozler, _oku:oku, _yaz:yaz, _durum:() => d, _ac:ac, _hedefListe:hedefListe });
})(window.LIFEOS);
