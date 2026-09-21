/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/rutbe.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* RÜTBE ekranı — kademe, merdiven ve «XP nereden gelir».

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/rutbe.js`; `python3 tools/seviye.py --yay` ile
   AYS/SPİ/ESP'nin `src/js/screens/` klasörüne kopyalanır; ad alanı yer
   tutucusu yayarken her uygulamanın kendi adıyla (R, SP, ESP) değişir.

   ------------------------------------------------------------------
   NEDEN ÜÇ AYRI EKRAN DEĞİL

   Üç sistemin seviyesi AYRI kazanılır ama TANIMI aynıdır: aynı kademe
   adları, aynı eşikler, aynı merdiven. Üç ayrı ekran yazmak, üçünün
   bir gün farklı şeyler söylemesi demekti — biri «Safir» derken
   diğerinin «Hüküm» demesi gibi. Bileşen takımı (K.Card, K.Stat …)
   üçünde de aynı olduğu için tek dosya üçüne de uyar.

   DEĞİŞEN TEK ŞEY VERİDİR: her sistem kendi defterini, kendi
   etkinliklerini ve kendi rotalarını gösterir. O bilgi de burada
   yazılı değil, KATALOGDA (`data/kademeler.js`) durur.

   ------------------------------------------------------------------
   EKRAN NE SÖYLER, NE SÖYLEMEZ

   Söyler:  neredesin · nereye gidiyorsun · bu puan hangi işten geldi ·
            hangi işi NEREDE yaparsan XP kazanırsın
   Söylemez: «geride kaldın», «şunu yapmalısın», bir sıralama, bir seri
            sayacı. XP hiçbir kararı vermez (AGENTS.md §1.2/6) ve bir
            ekranın kullanıcıya ne yapacağını söylemesi karar vermektir.

   «Nereden XP kazanırım» bölümü bir GÖREV LİSTESİ DEĞİLDİR: bir
   fiyat listesidir. Aradaki fark, birinin emir kipi kullanması. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.rutbe = (function(){
  const S = R.S, UI = R.UI, K = R.C;
  const { html, raw, when, map } = R.h;
  const L = function(){ return window.LIFEOS; };
  const XP = function(){ return R.XP; };

  /* Bu ekranın hangi sisteme ait olduğu. Yer tutucu yayarken değişir
     (`tools/seviye.py`) — `xp.js` de aynı yer tutucuyu kullanır ve
     modül kimliği tek yerden gelir. Mühür listesi bununla süzülür:
     ESP'nin ekranında SPİ'nin mührünü göstermek, kullanıcının
     basamayacağı bir damgayı vitrine koymaktı. */
  const MOD_ADI = 'ays';

  const TABS = [
    { id:'simdi',    label:'Şu an' },
    { id:'merdiven', label:'Merdiven' },
    { id:'rozet',    label:'Başarımlar' },
    { id:'kazanc',   label:'XP nereden gelir' },
    { id:'defter',   label:'Defter' },
  ];

  function tab(){
    return TABS.some(t => t.id === S.ui.rutbeTab) ? S.ui.rutbeTab : TABS[0].id;
  }

  /* Kademe rengini CSS'e geçiren sarmal. Ekranın her bölümü o anki
     kademenin rengiyle boyanır; renk katalogdan gelir, ekran kendi
     paletini uydurmaz. */
  function renkli(k, ic, sinif){
    return html`<div class="${'rutbe ' + (sinif || '')}"
      style="${'--kademe-renk:' + (k && k.renk || '#888')
        + ';--kademe-isik:' + (k && k.isik || '#ccc')}">${ic}</div>`;
  }

  /* Kart ve sahne adresleri. Ad kurali katalogda (`LIFEOS.MEDYA_ADI`)
     yazili; burasi yalnizca klasoru onune ekler. Ikisi de dosya
     YOKKEN de cagrilabilir — `onerror` dugumu kaldirir. */
  function kartYolu(etiket){
    return L().MEDYA_ADI ? 'img/seviye/' + L().MEDYA_ADI(etiket) + '.webp' : null;
  }
  function sahneYolu(no){
    return no ? 'img/seviye/sahne-' + no + '.webp' : null;
  }
  function armaYolu(no){
    return no ? 'img/seviye/bant-' + no + '.webp' : null;
  }
  /* Kademenin idle VİDEOSU. Adı POSTER'in adıyla aynı, yalnız uzantısı
     farklı: ikinci bir adlandırma şeması açmak, videonun hangi kademeye
     ait olduğunu ikinci kez yazmaktı. Dosya yoksa `onerror` düğümü
     kaldırır ve altındaki poster görünür kalır. */
  function sahneVideoYolu(no){
    return no ? 'img/seviye/sahne-' + no + '.mp4' : null;
  }

  function yok(){
    return K.Card({ title:'Rütbe',
      body:html`<p class="small dim">Seviye defteri henüz yüklenmedi.</p>` });
  }

  /* ================================================== ŞU AN ========= */

  function simdiTab(){
    const d = XP().durum();
    if(!d || !d.kademeBilgi) return yok();
    const k = d.kademeBilgi;
    const kart = kartYolu(d.etiket);
    const sahne = sahneYolu(d.kademe);

    /* Kart yüklenmezse (henüz üretilmemiş bir rütbe) `onerror` düğümü
       kaldırır ve altındaki daire görünür kalır — kırık resim simgesi
       göstermek, hiç göstermemekten kötüdür. */
    const gorsel = kart ? html`<img class="rutbe-kart__gorsel" src="${kart}" alt=""
      aria-hidden="true" onerror="this.remove()">` : '';

    const ilerleme = d.tamam
      ? K.Notice({ tone:'ok', title:'En üst basamaktasın.',
          body:'XP birikmeye devam ediyor.' })
      : K.Meter({ label:'Bu basamakta', value:Math.round(d.oran * 100),
          text:d.icinde + ' / ' + d.gereken + ' XP',
          note:'Bir sonraki basamağa ' + d.kalan + ' XP' });

    const sahneVideo = sahneVideoYolu(d.kademe);

    /* KADEME SAHNESİ ARTIK OYNUYOR.

       `poster` sahnenin durağan hâlidir ve videonun ilk karesi gelene
       kadar o görünür. Video YÜKLENEMEZSE (dosya yok, tarayıcı H.264
       çözemiyor, veri tasarrufu açık) poster OLDUĞU GİBİ KALIR ve ekran
       hiç bozulmaz — bu yüzden burada `onerror` ile düğüm KALDIRILMAZ.
       Kaldırılıyordu ve ölçüldü: video çözülemeyince poster de onunla
       gidiyor, sahne bütünüyle kayboluyordu.

       `data-dongu` çizimden sonra bağlanır (bkz. afterRender): video
       sonuna gelince başa DEĞİL altıncı saniyeye sarar. İlk altı
       saniye bir açılıştır ve her döngüde tekrar izlenmesi gerekmez;
       kalan dört saniye ise kendi içinde kapanan bir harekettir. */
    const sahneKatmani = sahneVideo
      ? html`<video class="rutbe-kart__sahne" data-dongu="6"
          src="${sahneVideo}" poster="${sahne || ''}"
          muted playsinline autoplay preload="metadata"
          aria-hidden="true" tabindex="-1"></video>`
      : when(sahne, () => html`<img class="rutbe-kart__sahne" src="${sahne}"
          alt="" aria-hidden="true" onerror="this.remove()">`);

    return K.Stack([
      renkli(k, html`
        <div class="rutbe-kart">
          ${sahneKatmani}
          <div class="rutbe-kart__sol">
            ${gorsel}
            <span class="rutbe-kart__no" aria-hidden="true">${d.etiket}</span>
          </div>
          <div class="rutbe-kart__sag">
            <span class="rutbe-kart__ust">${d.tamam ? 'En üst rütbe' : 'Şu anki rütben'}</span>
            <!-- h2, h3 degil: ustunde ekranin h1'inden baska baslik yok.
                 K.Card kendi basligini h3 yazar; burasi h3 olsaydi
                 h1'den h3'e atlardik ve a11ycheck bunu yakalar. -->
            <h2 class="rutbe-kart__ad">${k.ad}</h2>
            <span class="rutbe-kart__etiket">${d.etiket}</span>
            ${when(k.slogan, () => html`<p class="rutbe-kart__slogan">${k.slogan}</p>`)}
          </div>
        </div>`, 'rutbe--kart'),

      /* SAYAÇ SATIRI KENDİ IZGARASINDA.

         Bir süre `K.Grid` kullanılıyordu ve yanlıştı: o ızgara on iki
         sütunludur ve span sınıfı verilmeyen çocuk BİR sütun kaplar.
         Geniş ekranda dört kutu tesadüfen doğru görünüyordu; 390
         pikselde her kutu ekranın on ikide biri oluyor ve «BU / TO /
         KA» diye kesilmiş etiketler üst üste biniyordu.

         `auto-fit` + `minmax`: yer varsa dördü yan yana, yoksa ikişer,
         en dar yerde tek sütun. */
      html`<div class="rutbe-sayaclar">${[
        K.Stat({ label:'Bugün', value:d.bugun || 0, unit:'XP' }),
        K.Stat({ label:'Toplam', value:(d.toplam || 0).toLocaleString('tr-TR'), unit:'XP' }),
        K.Stat({ label:'Kademe', value:d.kademe,
          unit:'/ ' + (L().KADEMELER || []).length }),
        /* «Basamak» tek başına yanıltıcıydı: 1.1'in İÇİNDEYKEN sıfır
           yazıyor ve üstteki «Bronz 1.1» ile çelişiyordu. Sayılan şey
           GEÇİLEN basamaktır; adı da onu söylemeli.
           TEK PARÇA ve BÖLÜNMEZ yazılır: «Geçilen basamak» etiketi ve
           «/ 25» birimi dört sayaçlık bir satırda ayrı ayrı sarıyor,
           kutuyu komşularının iki katı yapıyordu. Aradaki boşluklar
           bölünmez boşluktur (U+00A0); normal boşlukla «11 /» ve «25»
           iki satıra düşüyordu. */
        K.Stat({ label:'Basamak',
          value:d.bitmisBasamak + '\u00a0/\u00a0' + (L().BASAMAKLAR || []).length,
          note:'geçilen' }),
      ]}</div>`,

      K.Card({ title:'İlerleme', body:ilerleme }),
      kademeIciKart(d),
      rozetOzetKart(),
      bugunKart(),
    ]);
  }

  /* BU KADEMEDE NEREDESİN — kademenin kendi basamakları, tek şeritte.

     Merdiven sekmesi ALTI kademeyi birden gösterir; orada kendi
     kademeni bulmak için kaydırmak gerekiyordu. Burası yalnız içinde
     olduğun kademeyi gösterir ve üç soruyu tek bakışta cevaplar:
     hangisini geçtin, hangisindesin, sıradaki hangisi.

     Şeritte nişan kullanılır, kart değil: kart burada da okunmayacak
     kadar küçük kalırdı (bkz. `basamakHtml`).

     ARMA şeridin başında durur — kademenin mührü, basamakların
     başında. Safir ve Kutsal'ın arması henüz gelmedi; `onerror` düğümü
     kaldırır ve şerit armasız başlar. */
  function kademeIciKart(d){
    const satir = (XP().merdiven() || []).filter(b => b.kademe === d.kademe);
    if(satir.length < 2) return '';
    const k = d.kademeBilgi || {};
    const arma = armaYolu(d.kademe);

    return K.Card({
      title:'Bu kademede neredesin',
      body:html`
        <div class="rutbe-serit">
          ${when(arma, () => html`<img class="rutbe-serit__arma" src="${arma}"
            alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">`)}
          <div class="rutbe-serit__basamaklar">
            ${map(satir, b => basamakHtml(b))}
          </div>
        </div>
        ${gecisSeridi(d, k)}`,
    });
  }

  /* BURAYA NASIL GELDİN — kademe geçişinin tam ekran karesi, küçük.

     O kare kutlamada BİR KEZ görünüyor ve bir daha hiç görünmüyordu:
     altı güzel görsel, kullanıcı ömründe toplam altı saniye. Oysa
     «hangi kademeden buraya geldim» sorusunun cevabı tam olarak o
     karede yazılı — «ALTIN → YAKUT».

     Kilitli bir şey göstermez: kullanıcı O KADEMEYE GELDİĞİ için o
     kareyi zaten görmüştür. Burada ikinci kez, sakin hâlde durur.

     `alt` DOLU ve cümle katalogdan kurulur: karenin üstünde iki
     kademenin adı yazılı ve ekran okuyucuya söylenmeyen bir şey
     olmamalı. */
  function gecisSeridi(d, k){
    if(!d.kademe) return '';
    const onceki = d.kademe > 1 ? L().KADEME_ILE(d.kademe - 1) : null;
    const yazi = onceki
      ? (onceki.ad || '') + '\u2019dan ' + (k.ad || '') + '\u2019a ge\u00e7i\u015f'
      : (k.ad || '') + ' \u2014 yolculu\u011fun ba\u015flang\u0131c\u0131';
    return html`
      <div class="rutbe-gecis">
        <img class="rutbe-gecis__kare" src="${'img/seviye/gecis-' + d.kademe + '.webp'}"
          alt="${yazi}" loading="lazy"
          onerror="this.closest('.rutbe-gecis').remove()">
        <p class="rutbe-gecis__yazi">${yazi}. Bu kareyi kademeye geçtiğin
          gün tam ekran gördün; burada durmaya devam ediyor.</p>
      </div>`;
  }

  /* «Şu an» sekmesinde ROZET ÖZETİ.

     Sekme kullanıcının ilk gördüğü yerdir ve rozetlerden hiç
     bahsetmiyordu: otuz yedi rozetlik bir sistem kurulmuş ama ana
     ekranda izi yoktu. Burada TEK SATIR yeter — kaç tanesi kazanıldı
     ve en son hangisi. Ayrıntı Başarımlar sekmesinde.

     Son kazanılan rozet TARİHE göre seçilir, katalog sırasına göre
     değil: «en son ne kazandım» sorusunun cevabı budur. */
  function rozetOzetKart(){
    const B = R.Basarim;
    if(!B) return '';
    const d = B.durum();
    if(!d) return '';

    const kazanilan = B.liste().filter(r => r.kazanildi);
    kazanilan.sort((a, b) => String(b.kazanildi).localeCompare(String(a.kazanildi)));
    const son = kazanilan[0];
    const sirada = B.siradaki(1)[0];

    return K.Card({
      title:'Rozetler',
      actions:K.Button({ label:'Hepsi', size:'sm', act:'rutbe-tab',
        data:{ 'data-tab':'rozet' } }),
      body:K.Stack([
        K.Grid([
          K.Stat({ label:'Kazanılan', value:d.kazanilanSayisi,
            unit:'/ ' + d.toplamRozet }),
          K.Stat({ label:'Toplam saat', value:d.saat, unit:'saat' }),
          K.Stat({ label:'Kesintisiz', value:d.seriAy, unit:'ay' }),
        ]),
        when(son, () => html`<p class="small dim">Son kazanılan:
          <b>${son.ad}</b> · ${son.kazanildi}</p>`),
        when(sirada, () => html`<p class="small dim">Sıradaki:
          <b>${sirada.kisaAd || sirada.ad}</b> —
          ${sirada.kalan.toLocaleString('tr-TR')} ${sirada.birim || ''} kaldı</p>`),
        when(!son && !sirada, () => K.Empty({ text:'Rozetler kayıt girdikçe '
          + 'kendiliğinden açılır; hiçbirini elle almana gerek yok.' })),
      ], 'sm'),
    });
  }

  /* Bugün hangi işten kaç XP çıktı — ve tavanına ne kadar kaldı. */
  function bugunKart(){
    const liste = XP().bugunku().filter(r => r.kazanilan > 0);
    if(!liste.length){
      return K.Card({ title:'Bugün',
        body:K.Empty({ text:'Bugün henüz XP yok. «XP nereden gelir» bölümü, '
          + 'hangi işin ne kazandırdığını ve nerede yapıldığını söyler.' }) });
    }
    liste.sort((a, b) => b.kazanilan - a.kazanilan);
    return K.Card({ title:'Bugün', sub:'İş başına kazanılan',
      body:K.Stack(liste.map(r => K.Meter({
        label:r.ad + (r.adet ? ' · ' + r.adet + ' ' + r.birim : ''),
        value:Math.round(r.oran * 100),
        text:r.kazanilan + ' / ' + r.tavan + ' XP',
        note:r.doldu ? 'Günlük tavan doldu — bu işten bugün daha fazla puan çıkmaz' : null,
        tone:r.doldu ? 'ok' : null,
      })), 'sm') });
  }

  /* ================================================ MERDİVEN ======== */

  function merdivenTab(){
    const d = XP().durum();
    if(!d) return yok();
    const basamaklar = XP().merdiven();
    const kademeler = (L().KADEMELER || []).map(k => ({
      k:k, satir:basamaklar.filter(b => b.kademe === k.no),
    }));

    return K.Stack(kademeler.map(({ k, satir }) => {
      const gecilen = satir.filter(b => b.durum === 'gecildi').length;
      const icinde = satir.some(b => b.durum === 'simdi');
      const hal = gecilen === satir.length ? 'tamam' : (icinde || gecilen ? 'acik' : 'kilitli');
      /* Kilitli kademenin sahnesi de çizilmez: sahne o rütbenin
         dünyasıdır ve gelinmemiş bir dünyayı göstermek kartı
         göstermekle aynı şeydir. */
      const sahne = hal === 'kilitli' ? null : sahneYolu(k.no);
      /* ARMA — kademenin adını taşıyan amblem, mührü gibi sağda durur.
         Kilitli kademede çizilmez: sahneyle aynı gerekçe. Dosyası
         olmayan kademede `onerror` düğümü kaldırır ve bant eskisi gibi
         kalır — Safir ile Kutsal'ın arması henüz gelmedi. */
      const arma = hal === 'kilitli' ? null : armaYolu(k.no);
      /* İKİ KATLI: üstte kademenin SAHNESİ bir bant olarak, altında
         kartlar temiz zeminde. Sahne kartların arkasına yayıldığında
         ikisi birbirini yiyordu — sahne bulanık, kart okunmaz. */
      return renkli(k, html`
        <div class="${'rutbe-kademe rutbe-kademe--' + hal}">
          <div class="rutbe-kademe__bant">
            ${when(sahne, () => html`<img class="rutbe-kademe__sahne" src="${sahne}"
              alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">`)}
            <div class="rutbe-kademe__ust">
              <span class="rutbe-kademe__no">${k.no}</span>
              <div>
                <!-- Kademe adi da h2: merdiven sekmesinde bunlar ekranin
                     birinci duzey basliklaridir (bkz. rutbe-kart__ad). -->
                <h2 class="rutbe-kademe__ad">${k.ad}</h2>
                <span class="rutbe-kademe__slogan">${k.slogan || ''}</span>
              </div>
              ${when(arma, () => html`<img class="rutbe-kademe__arma" src="${arma}"
                alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">`)}
              ${K.Badge({
                tone:hal === 'tamam' ? 'ok' : (hal === 'acik' ? 'info' : 'muted'),
                icon:false,
                label:hal === 'kilitli' ? 'kilitli' : gecilen + ' / ' + satir.length })}
            </div>
          </div>
          <div class="rutbe-kademe__ic">
            <div class="rutbe-basamaklar">
              ${map(satir, b => basamakHtml(b))}
            </div>
            ${kademeKunyesi(k, satir, hal, d)}
          </div>
        </div>`, 'rutbe--kademe');
    }));
  }

  /* KADEME KÜNYESİ — basamak sıralarının sağındaki boşluğu DOLDURUR.

     Boşluk bir tasarım tercihi değildi: kademe başına üç kart var ve
     geniş ekranda satırın sağı yarıya kadar boş kalıyordu. Oraya
     kademenin kendi sayıları konur ve her hâl kendi cümlesini söyler:

       geçilmiş   ne zaman ve kaç XP'ye bitti
       içindesin  bu basamakta neredesin
       kilitli    kaç XP kaldı — «bir gün» değil, SAYI

     KİLİTLİ KADEMEYE SAYI YAZMAK kartı göstermek değildir. Eşik zaten
     merdivende yazılı; burada yazılan, kullanıcının kendi toplamına
     olan FARKTIR ve o fark kullanıcının kendi verisidir. */
  function kademeKunyesi(k, satir, hal, d){
    if(!satir.length) return '';
    const ilk = satir[0], son = satir[satir.length - 1];
    const sayi = n => Number(n || 0).toLocaleString('tr-TR');

    if(hal === 'kilitli'){
      const kalan = Math.max(0, ilk.esik - (d.toplam || 0));
      return html`
        <div class="rutbe-kunye rutbe-kunye--kilit">
          <span class="rutbe-kunye__ust">Açılışa</span>
          <b class="rutbe-kunye__sayi">${sayi(kalan)}</b>
          <span class="rutbe-kunye__alt">XP · eşik ${sayi(ilk.esik)}</span>
        </div>`;
    }

    if(hal === 'tamam'){
      return html`
        <div class="rutbe-kunye rutbe-kunye--tamam">
          <span class="rutbe-kunye__ust">Tamamlandı</span>
          <b class="rutbe-kunye__sayi">${satir.length}</b>
          <span class="rutbe-kunye__alt">basamak · ${sayi(son.esik)} XP'de bitti</span>
        </div>`;
    }

    /* İÇİNDESİN. Yüzde motordan gelir; ekran hesaplamaz. */
    const yuzde = Math.round((d.oran || 0) * 100);
    return html`
      <div class="rutbe-kunye rutbe-kunye--simdi">
        <span class="rutbe-kunye__ust">Bu basamakta</span>
        <b class="rutbe-kunye__sayi">%${yuzde}</b>
        <span class="rutbe-kunye__alt">${sayi(d.kalan)} XP sonra ${
          d.tamam ? 'en üst' : 'sıradaki basamak'}</span>
        <span class="rutbe-kunye__cubuk" aria-hidden="true"
          ><i style="${'width:' + yuzde + '%'}"></i></span>
      </div>`;
  }

  function basamakHtml(b){
    /* GELMEDİĞİN RÜTBE GÖRÜNMEZ — depo sahibinin kararı, iki kez teyit
       edildi. Kart yalnız geçilen ve şu an olunan basamakta çizilir;
       kilitli basamak mühürlü bir kutu olarak durur, etiketi ve eşiği
       okunur. Görülmemiş bir kartın görüntüsünü önden vermek, gelindiği
       gün onu değersizleştiriyordu.

       Dosya yoksa `onerror` düğümü kaldırır ve altındaki etiket görünür
       kalır.

       KART DEĞİL NİŞAN. Bu kutu yüz piksel; kart dokuz yüz piksellik
       bir portre ve burada ne taşı ne yazısı okunuyordu. Nişan aynı
       basamağın bu ölçek için çizilmiş amblemi. K merdiveninde nişan
       yok, orada kart kullanılır (bkz. `xp.js`, `merdiven`).

       KİLİTLİ BASAMAK SİLUET DURUR — rozetteki kuralın aynısı. Nişanın
       dış hattı görünür, taşı ve rengi görünmez. Kilitli basamağı
       bütünüyle boş bırakmak merdiveni kuru bir tablo yapıyordu;
       merdivenin ŞEKLİ görünmeli, içeriği görünmemeli.

       SİLUETİN KAYNAĞINI MOTOR SEÇER (`xp.js`, `merdiven` → `siluet`):
       siluet alfayı korur, yani kaynağın üzerindeki yazı da okunur
       kalır. Kaynak bu yüzden yazısız olmak zorunda — nişan öyledir, K
       madalyonu da öyledir (üzerinde yalnız sayı var), rütbe kartı
       değildir. Karar orada tek yerde yazılı; ekran yalnız çizer. */
    const acik = b.durum !== 'kilitli';
    const kaynak = acik ? (b.nisan || b.kart) : b.siluet;
    const gorsel = kaynak
      ? html`<img class="${acik ? '' : 'siluet'}" src="${kaynak}" alt=""
          aria-hidden="true" loading="lazy" onerror="this.remove()">`
      : '';
    return html`
      <div class="${'rutbe-basamak rutbe-basamak--' + b.durum}"
        title="${b.etiket + ' · ' + b.esik.toLocaleString('tr-TR') + ' XP'}">
        <div class="rutbe-basamak__kutu">
          ${gorsel}
          <span class="rutbe-basamak__etiket">${b.etiket}</span>
        </div>
        <span class="rutbe-basamak__esik">${b.esik.toLocaleString('tr-TR')}</span>
      </div>`;
  }

  /* ================================================ BAŞARIMLAR ====== */

  function rozetTab(){
    const B = R.Basarim;
    if(!B) return yok();
    const d = B.durum();
    if(!d) return yok();
    const liste = B.liste();

    /* Aile aile gruplanır: otuz yedi rozeti tek yığın hâlinde dökmek,
       hangisinin neyi ölçtüğünü okunamaz yapardı. */
    const aileler = (L().BASARIM_AILELER || []).map(a => ({
      a:a, satir:liste.filter(r => r.aile === a.id),
    }));

    /* Sekme kullanıcının KENDİ kademesinin rengini taşır: ilerleme
       çubukları ve rozet oranları `--kademe-renk` okuyor. Renksiz
       bırakıldığında hepsi metin rengine düşüyor ve ekran soluyordu. */
    const kd = (R.XP && R.XP.durum() || {}).kademeBilgi;

    return renkli(kd, K.Stack([
      siradakiKart(B),
      /* Aynı gerekçe: `K.Grid` on iki sütunludur ve span'sız çocuk bir
         sütun kaplar (bkz. `simdiTab`). */
      html`<div class="rutbe-sayaclar">${[
        K.Stat({ label:'Kazanılan', value:d.kazanilanSayisi,
          unit:'/ ' + d.toplamRozet }),
        K.Stat({ label:'Toplam saat', value:d.saat, unit:'saat' }),
        K.Stat({ label:'Toplam görev',
          value:(d.gorev || 0).toLocaleString('tr-TR'), unit:'görev' }),
        K.Stat({ label:'Kayıtlı gün', value:d.gun, unit:'gün' }),
      ]}</div>`,
      ...aileler.map(x => aileKart(x.a, x.satir)),
      muhurKart(),
      K.Card({ title:'Rozet neyi söyler, neyi söylemez', body:html`
        <ul class="rutbe-kural">
          <li><b>Rozet hiçbir kararı vermez.</b> Ne plan, ne reçete, ne
            uyarı ona bakar — XP gibi, yalnızca görünürlüktür.</li>
          <li><b>Sayaç düşebilir, rozet düşmez.</b> Kaydı silersen saat
            ve görev sayısı azalır; ama «şu gün ulaştın» cümlesi doğru
            kalır, o yüzden kazanılmış rozet geri alınmaz.</li>
          <li><b>Ölçülmemiş süre sayılmaz.</b> Süresi boş bırakılan bir
            kayıt «sıfır dakika» değil, «veri yok»tur.</li>
        </ul>` }),
    ]), 'rutbe--rozetler');
  }

  /* SIRADAKİ — en çok yaklaşılan üç rozet, en üstte.

     Otuz yedi rozetlik ızgara «neredeyim» sorusunu cevaplıyordu ama
     «sıradaki ne» sorusunu değil: kullanıcı en dolu çubuğu gözüyle
     aramak zorunda kalıyordu. Sıralama motorda (`Basarim.siradaki`),
     ekran yalnız çiziyor.

     Hepsi kazanılmışsa hiçbir şey çizilmez — bitmiş bir listeye
     «sıradaki» yazmak, olmayan bir şeyi göstermektir. */
  function siradakiKart(B){
    const liste = B.siradaki(3);
    if(!liste.length) return '';
    /* ROZETİN KENDİSİ DE DURUR, yalnız adı değil. Satır bir süre üç
       ince çubuktan ibaretti ve «hangi rozet» sorusunu okuyarak
       cevaplatıyordu; madalya orada dururken onu yazıyla tarif etmek
       gereksiz bir ara katman. Rengi alınmış hâlde durur — henüz
       kazanılmadı (bkz. `rozetHtml`, `.rozet-kilit`). */
    return K.Card({ title:'Sıradaki', body:html`
      <div class="rutbe-sirada">${map(liste, r => html`
        <div class="rutbe-sirada__sat">
          ${when(r.gorsel, () => html`<img class="rutbe-sirada__rozet rozet-kilit"
            src="${'img/seviye/' + r.gorsel + '.webp'}" alt=""
            aria-hidden="true" loading="lazy" onerror="this.remove()">`)}
          <span class="rutbe-sirada__ad">${r.kisaAd || r.ad}
            <span class="dim">· ${r.aileAd}</span></span>
          <span class="rutbe-sirada__kalan">${r.kalan.toLocaleString('tr-TR')}
            ${r.birim || ''} kaldı</span>
          <span class="rutbe-sirada__cubuk" aria-hidden="true"
            ><i style="${'width:' + Math.round(r.oran * 100) + '%'}"></i></span>
        </div>`)}
      </div>` });
  }

  /* BU SİSTEMİN MÜHRÜ — kazanılmaz, BASILIR.

     Mühür listesi yalnız HKM profilinde duruyordu ve üç arayüzün
     kullanıcısı kendi sisteminin hangi belgeye hangi mührü bastığını
     hiç görmüyordu. Burada TEK SATIR yeter: mühür, adı ve nerede
     basıldığı.

     Rozetin YANINDA ama ONUNLA KARIŞMADAN durur — bu yüzden kendi
     kartında ve kendi cümlesiyle: «kazanılmaz, basılır». */
  function muhurKart(){
    const hepsi = L().MUHURLER || [];
    const benim = hepsi.filter(m => m.mod === MOD_ADI);
    if(!benim.length) return '';
    return K.Card({
      title:'Bu sistemin mührü',
      body:html`
        <p class="small dim rutbe-rozet__ozet">Mühür kazanılmaz, basılır.
          Eşiği, sayacı, tarihi yoktur: bir belgenin hangi alandan
          geldiğini söyler.</p>
        <div class="rutbe-muhurler">${map(benim, m => html`
          <div class="rutbe-muhur">
            <img class="rutbe-muhur__gorsel" src="${'img/seviye/muhur-' + m.id + '.webp'}"
              alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">
            <span class="rutbe-muhur__yazi">
              <b>${m.ad}</b>
              <span class="tiny dim">${m.nerede}</span>
            </span>
          </div>`)}
        </div>`,
    });
  }

  function aileKart(a, satir){
    const kazanilan = satir.filter(r => r.kazanildi).length;
    /* Ailenin BUGÜNKÜ değeri ve sıradaki eşik — ekran hesaplamaz,
       motordan okur. */
    const deger = satir.length ? satir[0].deger : null;
    const siradaki = satir.filter(r => !r.kazanildi)[0];

    return K.Card({
      title:a.ad,
      body:K.Stack([
        html`<p class="small dim rutbe-rozet__ozet">${a.ozet}${when(
          deger != null, () => html` · <b>${deger.toLocaleString('tr-TR')} ${a.birim || ''}</b>`)}${when(
          siradaki && typeof siradaki.esik === 'number',
          () => html` · sıradaki ${siradaki.esik.toLocaleString('tr-TR')}`)}<span
          class="rutbe-rozet__say">${kazanilan} / ${satir.length}</span></p>`,
        html`<div class="rutbe-rozetler">${map(satir,
          r => rozetHtml(r, siradaki && r.kod === siradaki.kod))}</div>`,
        rozetAyrinti(satir),
      ], 'sm'),
    });
  }

  /* Seçili rozetin ayrıntısı — KENDİ AİLESİNİN altında açılır.

     Panel tek bir yerde (sayfanın altında) açılsaydı, tıklanan rozet
     ile açılan yazı arasında ekran boyu bir mesafe olurdu; dokunup
     aşağı kaydırmak zorunda kalan biri neye baktığını unutur. */
  function rozetAyrinti(satir){
    const kod = S.ui.rutbeRozet;
    if(!kod) return '';
    const r = satir.filter(x => x.kod === kod)[0];
    if(!r) return '';

    const sayi = n => (n == null ? '—' : Number(n).toLocaleString('tr-TR'));
    const durum = r.kazanildi
      ? html`<b>Kazanıldı</b> · ${r.kazanildi}`
      : (r.deger == null
          ? html`<b>Henüz kazanılmadı</b>`
          : html`<b>${sayi(Math.max(0, r.esik - r.deger))} ${r.birim || ''} kaldı</b>
              · şu an ${sayi(r.deger)} / ${sayi(r.esik)}`);

    return K.Notice({ tone:r.kazanildi ? 'ok' : 'info',
      title:r.ad,
      body:html`<p class="rutbe-ayrinti__ne">${r.ozet || ''}</p>
        <p class="rutbe-ayrinti__durum">${durum}</p>` });
  }

  function rozetHtml(r, sirada){
    /* KAZANILMAMIŞ ROZET SOLUK DURUR — GİZLİ DEĞİL.

       ROZET İLE RÜTBE KARTI AYNI ŞEY DEĞİLDİR ve burada ayrılırlar.

       Rütbe kartı bir AÇILIŞTIR: kademe başına üç tane, büyük, tam
       ekran bir kutlamayla gelir. Onu önden göstermek, geldiği günü
       değersizleştirir — depo sahibinin kuralı budur ve basamaklarda
       aynen uygulanır (bkz. `basamakHtml`, siluet).

       Rozet bir HEDEFTİR: otuz yedi tane, yan yana duran bir duvar ve
       kullanıcı o duvara bakarak nereye çalıştığını görür. Hedefi
       gizlemek, hedefi ortadan kaldırmaktır. Bir süre gizliydi ve
       ölçüldü: yeni bir kullanıcı otuz yedi boş tarama kutusu
       görüyordu; ekran kazanılacak bir şey olduğunu bile söylemiyordu.

       Bu yüzden kilitli rozet KENDİ GÖRSELİYLE ama renksiz ve soluk
       durur (`.rozet-kilit`). Kazanıldığı gün rengine kavuşur ve o
       fark hissedilir. Steam'den Duolingo'ya kadar herkesin yaptığı
       şey bu değil; bu, hedefi görünür tutmanın tek dürüst yolu. */
    const gorsel = r.gorsel
      ? html`<img class="${r.kazanildi ? '' : 'rozet-kilit'}"
          src="${'img/seviye/' + r.gorsel + '.webp'}" alt=""
          aria-hidden="true" loading="lazy" onerror="this.remove()">`
      : '';
    const yuzde = r.oran == null ? null : Math.round(r.oran * 100);
    const baslik = r.ad + (r.kazanildi ? ' · kazanıldı ' + r.kazanildi
      : (yuzde == null ? ' · kilitli' : ' · %' + yuzde));

    /* DÜĞME, div değil. `title` özniteliği masaüstünde iş görüyordu
       ama telefonda hiç çalışmıyor — dokunmanın bir karşılığı yoktu.
       Düğme hem dokunulabilir hem klavyeyle gezilebilir. */
    const acik = S.ui.rutbeRozet === r.kod;
    /* AİLENİN SIRADAKİ ROZETİ işaretlenir: altı rozetlik bir sırada
       «hangisi bir sonraki» sorusu, eşikleri okuyarak cevaplanıyordu.
       İşaret bir halka; renk ya da boyut değil — ikisi de kazanılmış
       rozetin işaretiyle karışırdı. */
    return html`
      <button type="button"
        class="${'rutbe-rozet rutbe-rozet--' + (r.kazanildi ? 'acik' : 'kilitli')
          + (sirada ? ' rutbe-rozet--sirada' : '')
          + (acik ? ' rutbe-rozet--secili' : '')}"
        data-act="rozet-ac" data-kod="${r.kod}"
        aria-expanded="${acik ? 'true' : 'false'}"
        aria-label="${baslik}">
        <span class="rutbe-rozet__kutu">
          ${gorsel}
          <span class="rutbe-rozet__etiket">${r.etiket || r.esik}</span>
        </span>
        <span class="rutbe-rozet__ad">${r.kisaAd || r.ad}</span>
        ${when(!r.kazanildi && yuzde != null, () => html`<span
          class="rutbe-rozet__oran" aria-hidden="true"><i
          style="${'width:' + yuzde + '%'}"></i></span>`)}
      </button>`;
  }

  /* ============================================ XP NEREDEN GELİR ==== */

  function kazancTab(){
    const liste = XP().bugunku();
    if(!liste.length) return yok();
    const tavanToplam = liste.reduce((t, r) => t + r.tavan, 0);

    return K.Stack([
      K.Notice({ tone:'info',
        title:'Bu bir fiyat listesidir, görev listesi değil.',
        body:'XP hiçbir kararı vermez: ne plan, ne uyarı, ne teşhis ona '
           + 'bakar. Aşağıdakiler yalnızca «hangi iş ne kazandırır» '
           + 'sorusunun cevabıdır.' }),

      K.Card({ title:'İşler', sub:'Bugün toplam en çok ' + tavanToplam + ' XP',
        body:K.Stack(liste.map(r => isSatiri(r)), 'sm') }),

      K.Card({ title:'Üç kural', body:html`
        <ul class="rutbe-kural">
          <li><b>Her işin günlük tavanı vardır.</b> Tavansız bir sayaç bir
            gün otuz kez tıklanır ve anlamını kaybeder.</li>
          <li><b>XP tetiklenmez, türetilir.</b> Bir düğmeye basarak puan
            alınmaz; o günün verisinden sayılır. Kaydı silersen puan da
            gider.</li>
          <li><b>Geriye dönük puan toplanmaz.</b> Geleceğe hiç, geçmişe
            en fazla bir hafta yazılır — dünkü kaydı bu sabah girmek
            olağandır, geçen ayın gününe puan yazmak değildir.</li>
        </ul>` }),
    ]);
  }

  function isSatiri(r){
    const doldu = r.doldu;
    return html`
      <div class="${'rutbe-is' + (doldu ? ' rutbe-is--doldu' : '')}">
        <div class="rutbe-is__ust">
          <span class="rutbe-is__ad">${r.ad}</span>
          <span class="rutbe-is__fiyat"><b>${r.xp}</b> XP / ${r.birim}</span>
        </div>
        ${when(r.nasil, () => html`<p class="rutbe-is__nasil">${r.nasil}</p>`)}
        <div class="rutbe-is__alt">
          ${when(r.nerede, () => html`
            <span class="rutbe-is__nerede">${r.nerede}</span>`)}
          <span class="rutbe-is__tavan">
            bugün ${r.kazanilan} / ${r.tavan} XP${doldu ? ' · doldu' : ''}</span>
          ${when(r.rota, () => K.Button({ label:'Git', size:'sm',
            act:'rutbe-git', data:{ 'data-rota':r.rota } }))}
        </div>
        ${K.Bar({ value:Math.round(r.oran * 100), tone:doldu ? 'ok' : null })}
      </div>`;
  }

  /* ================================================== DEFTER ======== */

  function defterTab(){
    const govde = XP().panelHtml ? XP().panelHtml() : '';
    if(!govde) return yok();
    return K.Card({ title:'Defter', sub:'Bu XP hangi işten geldi',
      body:raw(govde) });
  }

  /* ================================================== ekran ========= */

  const TAB_BODY = {
    simdi:simdiTab, merdiven:merdivenTab, rozet:rozetTab,
    kazanc:kazancTab, defter:defterTab,
  };

  /* VİDEO DÖNGÜSÜ — sonuna gelince başa değil `data-dongu` saniyesine.

     `loop` özniteliği kullanılmadı ve kullanılamazdı: o, videoyu hep
     SIFIRDAN başlatır. Sahnenin ilk altı saniyesi bir açılıştır —
     kamera yaklaşır, kademe taşı belirir — ve her on saniyede bir
     yeniden izlenmesi gereken bir şey değil. Kalan dört saniye ise
     kendi içinde kapanan bir harekettir; döngü oradan döner.

     `ended` yalnız `loop` YOKKEN tetiklenir, o yüzden ikisi bir arada
     bulunamaz. `play()` sözü reddedilebilir (otomatik oynatma
     engelliyse, H.264 çözülemiyorsa) ve bu bir hata değildir: poster
     görünür kalır ve ekran hiç bozulmaz.

     Hareket azaltma tercihinde video HİÇ oynatılmaz; poster yeterli
     bilgidir ve dönen bir görüntü, o tercihi isteyen kişinin
     istemediği şeydir. */
  function videolariBagla(){
    var az = false;
    try{
      az = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }catch(e){}

    var hepsi = document.querySelectorAll('#pane-rutbe video[data-dongu]');
    Array.prototype.forEach.call(hepsi, function(v){
      if(v.dataset.bagli) return;
      v.dataset.bagli = '1';
      if(az){ try{ v.pause(); v.removeAttribute('autoplay'); }catch(e){} return; }
      var geri = Number(v.dataset.dongu) || 0;
      v.addEventListener('ended', function(){
        try{
          v.currentTime = (isFinite(v.duration) && geri < v.duration) ? geri : 0;
          var p = v.play();
          if(p && p.catch) p.catch(function(){});
        }catch(e){}
      });
      var p = v.play();
      if(p && p.catch) p.catch(function(){});
    });
  }

  function afterRender(){ videolariBagla(); }

  async function render(){
    const t = tab();
    return String(K.Stack([
      K.Subtabs({ items:TABS, value:t, act:'rutbe-tab', aria:'Rütbe bölümleri' }),
      html`<div id="pane-rutbe">${(TAB_BODY[t] || simdiTab)()}</div>`,
    ]));
  }

  const handle = {
    async 'rutbe-tab'(el){ S.ui.rutbeTab = el.dataset.tab; R.App.render(); },
    /* «Git» kullanıcıyı işin YAPILDIĞI ekrana götürür. Rota katalogdan
       gelir; ekran kendi listesini tutmaz. */
    async 'rutbe-git'(el){
      const rota = el.dataset.rota;
      if(rota) R.App.go(rota);
    },
    /* Aynı rozete tekrar dokunmak KAPATIR: açtığı şeyi kapatmanın yolu
       olmayan bir düğme, kullanıcıyı başka bir yere dokunmaya zorlar. */
    async 'rozet-ac'(el){
      const kod = el.dataset.kod;
      S.ui.rutbeRozet = (S.ui.rutbeRozet === kod) ? null : kod;
      R.App.render();
    },
  };

  return {
    id:'rutbe',
    title:'Rütbe',
    subtitle(){
      const d = R.XP && R.XP.durum();
      if(!d || !d.kademeBilgi) return 'Kademe, merdiven ve XP kaynakları';
      return d.kademeBilgi.ad + ' ' + d.etiket + ' · ' + (d.toplam || 0) + ' XP';
    },
    actions(){ return ''; },
    render, afterRender, handle,
  };
})();
