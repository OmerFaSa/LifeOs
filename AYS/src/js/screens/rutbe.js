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

  const TABS = [
    { id:'simdi',    label:'Şu an' },
    { id:'merdiven', label:'Merdiven' },
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

    return K.Stack([
      renkli(k, html`
        <div class="rutbe-kart">
          ${when(sahne, () => html`<img class="rutbe-kart__sahne" src="${sahne}"
            alt="" aria-hidden="true" onerror="this.remove()">`)}
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
    simdi:simdiTab, merdiven:merdivenTab, kazanc:kazancTab, defter:defterTab,
  };

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
    render, handle,
  };
})();
