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

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.rutbe = (function(){
  const S = SP.S, UI = SP.UI, K = SP.C;
  const { html, raw, when, map } = SP.h;
  const L = function(){ return window.LIFEOS; };
  const XP = function(){ return SP.XP; };

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

      K.Grid([
        K.Stat({ label:'Bugün', value:d.bugun || 0, unit:'XP' }),
        K.Stat({ label:'Toplam', value:(d.toplam || 0).toLocaleString('tr-TR'), unit:'XP' }),
        K.Stat({ label:'Kademe', value:d.kademe,
          unit:'/ ' + (L().KADEMELER || []).length }),
        /* «Basamak» tek başına yanıltıcıydı: 1.1'in İÇİNDEYKEN sıfır
           yazıyor ve üstteki «Bronz 1.1» ile çelişiyordu. Sayılan şey
           GEÇİLEN basamaktır; adı da onu söylemeli. */
        K.Stat({ label:'Geçilen basamak', value:d.bitmisBasamak,
          unit:'/ ' + (L().BASAMAKLAR || []).length }),
      ]),

      K.Card({ title:'İlerleme', body:ilerleme }),
      bugunKart(),
    ]);
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
              ${K.Badge({
                tone:hal === 'tamam' ? 'ok' : (hal === 'acik' ? 'info' : 'muted'),
                icon:false,
                label:hal === 'kilitli' ? 'kilitli' : gecilen + ' / ' + satir.length })}
            </div>
          </div>
          <div class="rutbe-basamaklar">
            ${map(satir, b => basamakHtml(b))}
          </div>
        </div>`, 'rutbe--kademe');
    }));
  }

  function basamakHtml(b){
    /* GELMEDİĞİN RÜTBE GÖRÜNMEZ — depo sahibinin kararı, iki kez teyit
       edildi. Kart yalnız geçilen ve şu an olunan basamakta çizilir;
       kilitli basamak mühürlü bir kutu olarak durur, etiketi ve eşiği
       okunur. Görülmemiş bir kartın görüntüsünü önden vermek, gelindiği
       gün onu değersizleştiriyordu.

       Dosya yoksa `onerror` düğümü kaldırır (henüz üretilmemiş K
       kartları böyle) ve altındaki etiket görünür kalır. */
    const gorsel = (b.durum !== 'kilitli' && b.kart)
      ? html`<img src="${b.kart}" alt="" aria-hidden="true" loading="lazy"
          onerror="this.remove()">`
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
    const B = SP.Basarim;
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
    const kd = (SP.XP && SP.XP.durum() || {}).kademeBilgi;

    return renkli(kd, K.Stack([
      siradakiKart(B),
      K.Grid([
        K.Stat({ label:'Kazanılan', value:d.kazanilanSayisi,
          unit:'/ ' + d.toplamRozet }),
        K.Stat({ label:'Toplam saat', value:d.saat, unit:'saat' }),
        K.Stat({ label:'Toplam görev',
          value:(d.gorev || 0).toLocaleString('tr-TR'), unit:'görev' }),
        K.Stat({ label:'Kayıtlı gün', value:d.gun, unit:'gün' }),
      ]),
      ...aileler.map(x => aileKart(x.a, x.satir)),
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
    return K.Card({ title:'Sıradaki', body:html`
      <div class="rutbe-sirada">${map(liste, r => html`
        <div class="rutbe-sirada__sat">
          <span class="rutbe-sirada__ad">${r.kisaAd || r.ad}
            <span class="dim">· ${r.aileAd}</span></span>
          <span class="rutbe-sirada__kalan">${r.kalan.toLocaleString('tr-TR')}
            ${r.birim || ''} kaldı</span>
          <span class="rutbe-sirada__cubuk" aria-hidden="true"
            ><i style="${'width:' + Math.round(r.oran * 100) + '%'}"></i></span>
        </div>`)}
      </div>` });
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
        html`<div class="rutbe-rozetler">${map(satir, r => rozetHtml(r))}</div>`,
      ], 'sm'),
    });
  }

  function rozetHtml(r){
    /* KAZANILMAMIŞ ROZET GÖRÜNMEZ — rütbe kartındaki kuralın aynısı
       (bkz. `basamakHtml`). Görülmemiş bir rozetin görüntüsünü önden
       vermek, kazanıldığı gün onu değersizleştiriyor. Yerinde mühürlü
       bir kutu durur; eşiği ve ne kadar yaklaşıldığı okunur. */
    const gorsel = r.kazanildi
      ? html`<img src="${'img/seviye/' + r.gorsel + '.webp'}" alt=""
          aria-hidden="true" loading="lazy" onerror="this.remove()">`
      : '';
    const yuzde = r.oran == null ? null : Math.round(r.oran * 100);
    const baslik = r.ad + (r.kazanildi ? ' · kazanıldı ' + r.kazanildi
      : (yuzde == null ? ' · kilitli' : ' · %' + yuzde));

    return html`
      <div class="${'rutbe-rozet rutbe-rozet--' + (r.kazanildi ? 'acik' : 'kilitli')}"
        title="${baslik}">
        <div class="rutbe-rozet__kutu">
          ${gorsel}
          <span class="rutbe-rozet__etiket">${r.etiket || r.esik}</span>
        </div>
        <span class="rutbe-rozet__ad">${r.kisaAd || r.ad}</span>
        ${when(!r.kazanildi && yuzde != null, () => html`<span
          class="rutbe-rozet__oran" aria-hidden="true"><i
          style="${'width:' + yuzde + '%'}"></i></span>`)}
      </div>`;
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
    async 'rutbe-tab'(el){ S.ui.rutbeTab = el.dataset.tab; SP.App.render(); },
    /* «Git» kullanıcıyı işin YAPILDIĞI ekrana götürür. Rota katalogdan
       gelir; ekran kendi listesini tutmaz. */
    async 'rutbe-git'(el){
      const rota = el.dataset.rota;
      if(rota) SP.App.go(rota);
    },
  };

  return {
    id:'rutbe',
    title:'Rütbe',
    subtitle(){
      const d = SP.XP && SP.XP.durum();
      if(!d || !d.kademeBilgi) return 'Kademe, merdiven ve XP kaynakları';
      return d.kademeBilgi.ad + ' ' + d.etiket + ' · ' + (d.toplam || 0) + ' XP';
    },
    actions(){ return ''; },
    render, afterRender, handle,
  };
})();
