/* Kronoloji — tarih masası.

   Beş sekme: Şerit · Olaylar · Kaynaklar · Zincir · Çalışma.

   Ekranın taşıdığı tek iddia şudur: tarih bir liste değildir. Bu yüzden
   sekmeler bir SIRA anlatır — olayı yerleştir, kaynağını eleştir, nedenini
   kur, tekrarla. Sıranın tersi de mümkündür ama ekran sırayı önerir.

   Boş bir kronoloji «%0 kapsam» diye çizilmez: ölçülmemiş bir şeyi ölçülmüş
   gibi göstermek, bu depodaki en pahalı hatanın ta kendisi. Boşken ekran
   yalnızca tohumu önerir. */
window.LIFEOS.PARCA.yazilar({
  'esp.history.bos':'Boş: ',
  'esp.history.butun-donemlerde-olay-var':'Bütün dönemlerde olay var.',
  'esp.history.butun-alanlarda-olay-var':'Bütün alanlarda olay var.',
  'esp.history.butun-bolgelerde-olay-var':'Bütün bölgelerde olay var.',
  'esp.history.mo-icin-eksi-yaz-753':'MÖ için eksi yaz: -753',
  'esp.history.yalniz-son':'Yalnız son ',
  'esp.history.tumu':'Tümü · ',
  'esp.history.kart-hatirlama-henuz-olculem':'Kart hatırlama henüz ölçülemedi: taban için ',
  'esp.history.ne-yapar':'Ne yapar',
  'esp.history.neye-bakar':'Neye bakar',
  'esp.history.ne-yapilir':'Ne yapılır',
  'esp.history.sesli-not-kaydedildi':'Sesli not kaydedildi',
  'esp.history.sesli-not-temizlendi':'Sesli not temizlendi',
  'esp.history.olay-silinsin-mi':'Olay silinsin mi?',
  'esp.history.olayi-ve':'Olayı ve ',
  'esp.history.olayi-sil':'Olayı sil',
  'esp.history.kartlar-zaten-vardi':'Kartlar zaten vardı',
  'esp.history.zaman-seridi-bos':'Zaman şeridi boş.',
  'esp.history.kac-olay-bildigin-degil-kaci':'Kaç olay bildiğin değil, kaçını kaynağıyla açıklayabildiğin sayılır. ',
  'esp.history.kronoloji-iskelet-zincir-ve':'Kronoloji iskelet, zincir ve kaynak ettir.',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:110, id:'act:practice-history', kind:'Eylem', label:'Tarih pratiği başlat',
  hint:'Tarih', run:() => { ESP.S.ui.histTab = 'ogren'; ESP.App.go('history'); } });
window.LIFEOS.PARCA.komut({ modul:'esp', sira:120, id:'act:timeline', kind:'Eylem', label:'Kronolojiye olay ekle',
  hint:'Tarih', run:() => { ESP.S.ui.histTab = 'olaylar'; ESP.App.go('history'); } });
window.LIFEOS.PARCA.yazilar({
  'esp.history.serit':'Şerit',
  'esp.history.olaylar':'Olaylar',
  'esp.history.kaynaklar':'Kaynaklar',
  'esp.history.zincir':'Zincir',
  'esp.history.ogren':'Öğren',
  'esp.history.calisma':'Çalışma',
  'esp.history.bos-serit':'Boş şerit',
  'esp.history.zaman-seridinde-hic-olay-yok':'Zaman şeridinde hiç olay yok.',
  'esp.history.tohumu-yukle':'Tohumu yükle · ',
  'esp.history.donemler':'Dönemler',
  'esp.history.tartismali':'Tartışmalı:',
  'esp.history.suzgeci-kaldir':'Süzgeci kaldır',
  'esp.history.yuzyil-bosluklari':'Yüzyıl boşlukları',
  'esp.history.yuzyil':'Yüzyıl',
  'esp.history.kapsanan-aralikta-uc-yuzyild':'Kapsanan aralıkta üç yüzyıldan uzun boşluk yok.',
  'esp.history.dagilim':'Dağılım',
  'esp.history.olay':'Olay',
  'esp.history.kapsam':'Kapsam',
  'esp.history.donem':'Dönem',
  'esp.history.donem-kapsandi':'dönem kapsandı.',
  'esp.history.alan':'Alan',
  'esp.history.bolge':'Bölge',
  'esp.history.bolge-2':'bölge.',
  'esp.history.yuzyil-boslugu':'Yüzyıl boşluğu',
  'esp.history.kor-nokta':'kör nokta.',
  'esp.history.bosluk-yok':'Boşluk yok.',
  'esp.history.uc-yuzyildan-uzun-sessizlik':'Üç yüzyıldan uzun sessizlik yok.',
  'esp.history.olay-ekle':'Olay ekle',
  'esp.history.tohumu-yukle-2':'Tohumu yükle',
  'esp.history.malazgirt-savasi':'Malazgirt Savaşı',
  'esp.history.olayin-adi':'Olayın adı',
  'esp.history.yil':'Yıl',
  'esp.history.olayin-yili':'Olayın yılı',
  'esp.history.olayin-alani':'Olayın alanı',
  'esp.history.olayin-bolgesi':'Olayın bölgesi',
  'esp.history.neden-donum-noktasi':'Neden dönüm noktası?',
  'esp.history.olayin-onemi':'Olayın önemi',
  'esp.history.anadolu-nun-turklesme-sureci':'Anadolu\'nun Türkleşme sürecinin açılışı.',
  'esp.history.olayi-ekle':'Olayı ekle',
  'esp.history.suzgece-uyan-olay-yok':'Süzgece uyan olay yok.',
  'esp.history.olay-ara':'Olay ara…',
  'esp.history.olay-ara-2':'Olay ara',
  'esp.history.sesli-not':'Sesli not',
  'esp.history.dinle':'Dinle',
  'esp.history.eszamanli':'Eşzamanlı',
  'esp.history.zincir-kur':'Zincir kur',
  'esp.history.karta-cevir':'Karta çevir',
  'esp.history.sil':'Sil',
  'esp.history.50-yil':'± 50 yıl',
  'esp.history.tarihin-en-ogretici-sorusu':'— tarihin en öğretici sorusu: aynı anda başka yerde ne oluyordu?',
  'esp.history.bu-aralikta-baska-olay-giril':'Bu aralıkta başka olay girilmemiş.',
  'esp.history.kapat':'Kapat',
  'esp.history.belge-iste':'Belge iste',
  'esp.history.konu-osmanli-nin-kurulusu-fr':'Konu: Osmanlı’nın kuruluşu, Fransız Devrimi…',
  'esp.history.tarih-konusu':'Tarih konusu',
  'esp.history.king-e-ilet':'King’e ilet',
  'esp.history.kaynak-ekle':'Kaynak ekle',
  'esp.history.kaynak':'Kaynak',
  'esp.history.tevarih-i-al-i-osman':'Tevârîh-i Âl-i Osman',
  'esp.history.kaynagin-adi':'Kaynağın adı',
  'esp.history.yazar':'Yazar',
  'esp.history.asikpasazade':'Âşıkpaşazâde',
  'esp.history.tur':'Tür',
  'esp.history.kaynagin-turu':'Kaynağın türü',
  'esp.history.kaynagin-yili':'Kaynağın yılı',
  'esp.history.tarih-yazimi-okulu':'Tarih yazımı okulu',
  'esp.history.kaynagi-ekle':'Kaynağı ekle',
  'esp.history.denge':'Denge',
  'esp.history.henuz-kaynak-degerlendirilme':'Henüz kaynak değerlendirilmedi.',
  'esp.history.birincil-oran':'Birincil oran',
  'esp.history.elestiriyi-kaydet':'Eleştiriyi kaydet',
  'esp.history.neden-zinciri':'Neden zinciri',
  'esp.history.zincirin-olayi':'Zincirin olayı',
  'esp.history.soru-bu-neden-oldu':'Soru: bu neden oldu?',
  'esp.history.zincirin-sorusu':'Zincirin sorusu',
  'esp.history.zincir-ac':'Zincir aç',
  'esp.history.once-bir-olay-ekle-zincir':'Önce bir olay ekle: zincir olaysız kurulmaz.',
  'esp.history.kaldir':'Kaldır',
  'esp.history.halkanin-turu':'Halkanın türü',
  'esp.history.halka-ne-neden':'Halka: ne, neden?',
  'esp.history.halkanin-metni':'Halkanın metni',
  'esp.history.halkanin-kaynagi':'Halkanın kaynağı',
  'esp.history.kaynaksiz':'Kaynaksız',
  'esp.history.halka-ekle':'Halka ekle',
  'esp.history.bugunun-egzersizi':'Bugünün egzersizi',
  'esp.history.bu-egzersiz-olculen-aciga-go':'Bu egzersiz, ölçülen açığa göre seçildi.',
  'esp.history.egzersiz-listesi-bos':'Egzersiz listesi boş.',
  'esp.history.tarih-destesi':'Tarih destesi',
  'esp.history.kart-hatirlama':'Kart hatırlama',
  'esp.history.tekrara-basla':'Tekrara başla',
  'esp.history.anakronizm-tuzaklari':'Anakronizm tuzakları',
  'esp.history.tarih-yazimi-okullari':'Tarih yazımı okulları',
  'esp.history.egzersiz-katalogu':'Egzersiz kataloğu',
  'esp.history.kademe':'Kademe',
  'esp.history.pratik':'Pratik',
  'esp.history.konular':'Konular',
  'esp.history.uniteler':'Üniteler',
  'esp.history.tarih-bolumleri':'Tarih bölümleri',
  'esp.history.olay-kronolojiye-girdi':'Olay kronolojiye girdi',
  'esp.history.sesli-not-2':'Sesli Not · ',
  'esp.history.sesli-not-metni-mikrofonla-d':'Sesli not metni (mikrofonla dikte veya klavye):',
  'esp.history.tarihi-olayla-ilgili-sesli-n':'Tarihî olayla ilgili sesli notunuz…',
  'esp.history.sesli-not-3':'Sesli Not',
  'esp.history.kaydet':'Kaydet',
  'esp.history.dinle-herodot':'Dinle (Herodot)',
  'esp.history.notu-sil':'Notu Sil',
  'esp.history.sesli-not-silindi':'Sesli not silindi',
  'esp.history.seslendirilecek-sesli-not-yo':'Seslendirilecek sesli not yok',
  'esp.history.sesli-not-bulunamadi':'Sesli not bulunamadı',
  'esp.history.elestiri-kaydedildi':'Eleştiri kaydedildi',
  'esp.history.halkanin-metni-bos-olamaz':'Halkanın metni boş olamaz',
  'esp.history.kronoloji':'Kronoloji',
  'esp.history.donem-2':'dönem',
  'esp.history.birincil-kaynak':'birincil kaynak',
});
window.LIFEOS.PARCA.sayfa({ id:'history', modul:'esp', king:{ sira:220, ad:'Tarih', es:['tarih', 'kronoloji'] }, cekmece:'calisma', ad:'Tarih', ikon:'book', ek:{ disc:'history' }, sira:30 });

ESP.Screens.history = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'serit',     label:yz('esp.history.serit') },
    { id:'olaylar',   label:yz('esp.history.olaylar') },
    { id:'kaynaklar', label:yz('esp.history.kaynaklar') },
    { id:'zincir',    label:yz('esp.history.zincir') },
    { id:'ogren',     label:yz('esp.history.ogren') },
    { id:'calisma',   label:yz('esp.history.calisma') },
  ];

  function evs(){ return S.events || []; }
  function srcs(){ return S.sources || []; }
  function chs(){ return S.chains || []; }
  function eventOf(id){ return evs().filter(e => e.id === id)[0] || null; }
  function sourceOf(id){ return srcs().filter(s => s.id === id)[0] || null; }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function num(id){
    const v = val(id);
    if(v === '') return null;
    const n = Number(v.replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /* ------------------------------------------------------------------ şerit */

  function seritRows(){
    const st = ESP.Chrono.status();
    const rows = [];

    /* iPhone Faz 2c: boş şeridin ve tohumun açıklaması ⓘ'de (hints: chrono);
       tohumun kaç olay taşıdığı düğmenin üstünde. */
    if(!evs().length){
      rows.push(K.Entry({
        label:yz('esp.history.bos-serit'), hint:'chrono',
        meta:'olay yok',
        body:html`
          ${K.Empty({ text:yz('esp.history.zaman-seridinde-hic-olay-yok') })}
          ${K.Button({ label:yz('esp.history.tohumu-yukle') + (ESP.SEED_EVENTS || []).length + ' olay', tone:'primary',
            act:'seed', class:'mt-10' })}`,
      }));
      return rows;
    }

    rows.push(DonenKapsam(st));

    /* 100 TARİH ŞERİDİ (vitrin): yüzyıllar yatay, olaylar nokta; en son
       eklenen olay yanar. Yıl kaydın kendisinden; yılsız olay çizilmez. */
    const V = (window.LIFEOS || {}).VITRIN;
    /* En yeni olay bir kez bulunur: her olay için listeyi yeniden sıralamak
       beş yıllık veride (2 010 olay) karesel büyüyordu (loadcheck). */
    const enYeni = evs().reduce((m, e) => (!m || (e.createdAt || '') > (m.createdAt || '')) ? e : m, null);
    const seritHtml = V ? V.tarihSeridi({ olaylar:evs().filter(e => typeof e.year === 'number').slice()
      .sort((a, b) => a.year - b.year).map(e => ({ yil:e.year, ad:e.title, on:e === enYeni })) }) : '';
    if(seritHtml) rows.push(K.Entry({ label:yz('esp.history.serit'), meta:evs().length + ' olay', wide:true, body:raw(seritHtml) }));

    /* Dönem şeridi — her dönem kendi olay sayısıyla. */
    const donem = ESP.Chrono.spread('era');
    rows.push(K.Entry({
      label:yz('esp.history.donemler'), hint:'era',
      meta:st.eras.covered + '/' + st.eras.total + ' kapsandı',
      wide:true,
      body:html`<div class="erastrip">${map(donem.buckets, b => {
        const e = ESP.ERA_BY_ID[b.id];
        return html`
          <button class="${cls('eracell', b.n === 0 && 'is-empty',
              S.ui.histEra === b.id && 'is-active')}"
            data-act="pick-era" data-id="${b.id}"
            aria-pressed="${S.ui.histEra === b.id ? 'true' : 'false'}">
            <span class="eracell__label">${b.label}</span>
            <span class="eracell__span">${ESP.yearLabel(e.from)} – ${ESP.yearLabel(e.to)}</span>
            <span class="eracell__n num">${b.n}</span>
          </button>`;
      })}</div>
      ${when(S.ui.histEra !== 'all', () => {
        const e = ESP.ERA_BY_ID[S.ui.histEra];
        return e ? html`<div class="eranote">
            <p>${e.note}</p>
            <p class="small muted"><b>${yz('esp.history.tartismali')}</b> ${e.disputed}</p>
            ${K.Button({ label:yz('esp.history.suzgeci-kaldir'), size:'sm', act:'pick-era',
              data:{ 'data-id':'all' } })}
          </div>` : '';
      })}`,
    }));

    /* Yüzyıl boşlukları. */
    rows.push(K.Entry({
      label:yz('esp.history.yuzyil-bosluklari'), hint:'gap',
      meta:st.gaps.length ? st.gaps.length + ' boşluk' : 'yok',
      body:st.gaps.length
        ? K.Table({ tight:true, headers:['Aralık', { label:yz('esp.history.yuzyil'), num:true }],
            rows:st.gaps.map(g => [
              ESP.centuryLabel(g.from) + ' – ' + ESP.centuryLabel(g.to),
              String(g.length),
            ]) })
        : K.Empty({ text:yz('esp.history.kapsanan-aralikta-uc-yuzyild') }),
    }));

    /* Dağılım: alan ve bölge. */
    rows.push(K.Entry({
      label:yz('esp.history.dagilim'), hint:'coverage',
      meta:st.kinds.covered + '/' + st.kinds.total + ' alan',
      wide:true,
      body:html`
        <div class="cols-2">
          <div>
            ${K.SectionTitle('Alan')}
            ${map(ESP.Chrono.spread('kind').buckets, b => K.Meter({
              label:b.label, value:b.pct, text:b.n + ' olay',
              tone:b.n === 0 ? 'warn' : null }))}
          </div>
          <div>
            ${K.SectionTitle('Bölge')}
            ${map(ESP.Chrono.spread('region').buckets, b => K.Meter({
              label:b.label, value:b.pct, text:b.n + ' olay',
              tone:b.n === 0 ? 'warn' : null }))}
          </div>
        </div>`,
    }));

    return rows;
  }

  /* iPhone Faz 2c (2026-10-02): kapsamın üç ekseni ve yüzyıl boşluğu tek
     küçük dönen kartta; Dönemler şerit, Yüzyıl boşlukları ve Dağılım gizli
     (app.js SADE_GIZLI). Sayılar Chrono.status'tan: hesaplandı. Boş eksen
     adıyla yazılır; boşluk yoksa sayı değil cümle. */
  function DonenKapsam(st){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const girdiler = [{ ad:yz('esp.history.olay'), deger:st.events, birim:'olay', kesinlik:'measured' }];
    const oran = (o, ad) => sayi({ deger:o.covered + '/' + o.total, kesinlik:'computed',
      formul:'olayı olan ' + ad + ' / ' + ad, girdiler, zaman:U.todayISO() });
    const bos = (o, tam) => o.empty.length ? yz('esp.history.bos') + o.empty.join(', ') + '.' : tam;
    return raw(V.donen({ id:'esp-kapsam', ad:yz('esp.history.kapsam'), maddeler:[
      { ust:yz('esp.history.donem'), sayi:oran(st.eras, 'dönem'), cumle:yz('esp.history.donem-kapsandi'), vurgu:bos(st.eras, yz('esp.history.butun-donemlerde-olay-var')), sistem:'esp' },
      { ust:yz('esp.history.alan'), sayi:oran(st.kinds, 'alan'), cumle:'alan.', vurgu:bos(st.kinds, yz('esp.history.butun-alanlarda-olay-var')), sistem:'esp' },
      { ust:yz('esp.history.bolge'), sayi:oran(st.regions, 'bölge'), cumle:yz('esp.history.bolge-2'), vurgu:bos(st.regions, yz('esp.history.butun-bolgelerde-olay-var')), sistem:'esp' },
      st.gaps.length
        ? { ust:yz('esp.history.yuzyil-boslugu'), sayi:sayi({ deger:st.gaps.length, birim:'boşluk', kesinlik:'computed',
              formul:'üst üste üç yüzyıldan uzun boş aralık', girdiler, zaman:U.todayISO() }),
            cumle:yz('esp.history.kor-nokta'), vurgu:st.gaps.map(g => ESP.centuryLabel(g.from) + ' – ' + ESP.centuryLabel(g.to)).join(', ') + '.',
            sistem:'esp' }
        : { ust:yz('esp.history.yuzyil-boslugu'), cumle:yz('esp.history.bosluk-yok'), vurgu:yz('esp.history.uc-yuzyildan-uzun-sessizlik'), sistem:'esp' },
    ] }));
  }

  /* ---------------------------------------------------------------- olaylar */

  function filteredEvents(){
    const q = U.norm(S.ui.histQuery || '');
    return evs()
      .filter(e => S.ui.histEra === 'all' || !S.ui.histEra || e.era === S.ui.histEra)
      .filter(e => !q || U.norm(e.title).indexOf(q) >= 0);
  }

  /* iPhone sıkı ölçü (2026-10-02): uzun liste en yeni 5 + «Tümü». Beş yıllık
     veride 2 010 olayın her biri dört düğmeyle çiziliyordu (Tarih 631 ms,
     loadcheck eşiği 400). Arama ya da dönem süzgeci açıkken kesilmez; açık
     olay her zaman listededir. */
  const ILK_OLAY = 5;
  function gorunenOlaylar(list){
    const suzgec = !!(S.ui.histQuery || (S.ui.histEra && S.ui.histEra !== 'all'));
    if(S.ui.olayTumu || suzgec || list.length <= ILK_OLAY) return list;
    const yeni = list.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, ILK_OLAY);
    const acik = S.ui.eventOpen && list.find(e => e.id === S.ui.eventOpen);
    if(acik && yeni.indexOf(acik) < 0) yeni.push(acik);
    return yeni;
  }

  function olayRows(){
    const list = filteredEvents();
    const gorunen = gorunenOlaylar(list);
    const suzgec = !!(S.ui.histQuery || (S.ui.histEra && S.ui.histEra !== 'all'));
    const rows = [];

    rows.push(K.Entry({
      label:yz('esp.history.olay-ekle'), hint:'event',
      meta:'yıl zorunlu',
      /* Tohum olanı atlar, eksik olanı ekler: ara sıra bir eylem. Eskiden her
         bölümün üstünde ayrı bir satırdı; olay eklemenin yanında durur. */
      action:K.Button({ label:yz('esp.history.tohumu-yukle-2'), size:'sm', act:'seed' }),
      body:html`
        <div class="cols-2">
          ${K.Field({ label:yz('esp.history.olay'),
            input:K.Input({ id:'ev-title', placeholder:yz('esp.history.malazgirt-savasi'),
              aria:yz('esp.history.olayin-adi') }) })}
          ${K.Field({ label:yz('esp.history.yil'), hint:yz('esp.history.mo-icin-eksi-yaz-753'),
            input:K.Input({ id:'ev-year', type:'number', numeric:true,
              placeholder:'1071', aria:yz('esp.history.olayin-yili') }) })}
        </div>
        <div class="cols-2 mt-10">
          ${K.Field({ label:yz('esp.history.alan'),
            input:K.Select({ id:'ev-kind', value:'siyasi', aria:yz('esp.history.olayin-alani'),
              options:ESP.EVENT_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
          ${K.Field({ label:yz('esp.history.bolge'),
            input:K.Select({ id:'ev-region', value:'anadolu', aria:yz('esp.history.olayin-bolgesi'),
              options:ESP.REGIONS.map(r => ({ value:r.id, label:r.label })) }) })}
        </div>
        ${K.Field({ label:yz('esp.history.neden-donum-noktasi'), class:'mt-10',
          input:K.Input({ id:'ev-why', aria:yz('esp.history.olayin-onemi'),
            placeholder:yz('esp.history.anadolu-nun-turklesme-sureci') }) })}
        ${K.Button({ label:yz('esp.history.olayi-ekle'), tone:'primary', act:'add-event', class:'mt-10' })}`,
    }));

    if(!list.length){
      rows.push(K.Entry({ label:yz('esp.history.olaylar'), meta:'yok',
        body:K.Empty({ text:yz('esp.history.suzgece-uyan-olay-yok') }) }));
      return rows;
    }

    rows.push(K.Entry({
      label:yz('esp.history.olaylar'),
      meta:list.length + ' olay',
      action:K.Input({ id:'ev-q', value:S.ui.histQuery || '', size:'sm',
        placeholder:yz('esp.history.olay-ara'), change:'hist-query', aria:yz('esp.history.olay-ara-2') }),
      wide:true,
      body:html`${map(gorunen, e => {
        const a = ESP.Chrono.explained(e.id);
        const era = ESP.ERA_BY_ID[e.era];
        return html`
          <div class="evrow">
            <span class="evrow__year num">${ESP.yearLabel(e.year)}</span>
            <div class="evrow__body">
              <b>${e.title}</b>
              ${when(e.why, () => html`<p class="small muted">${e.why}</p>`)}
              ${when(e.voiceNote, () => html`<div class="row items-center gap-6 mt-4"><span class="badge badge--muted">${yz('esp.history.sesli-not')}</span><span class="small">${e.voiceNote}</span></div>`)}
              <div class="evrow__meta">
                ${when(era, () => K.Badge({ label:era.label, tone:'muted', icon:false }))}
                ${K.Badge({ label:(ESP.EVENT_KIND_BY_ID[e.kind] || {}).label || e.kind,
                  tone:'muted', icon:false })}
                ${K.Badge({ label:a.state === 'balanced' ? 'dengeli zincir'
                    : (a.state === 'thin' ? 'zayıf zincir' : 'zincirsiz'),
                  tone:a.state === 'balanced' ? 'ok' : (a.state === 'thin' ? 'warn' : 'muted') })}
                ${when(e.voiceNote, () => K.Button({ label:yz('esp.history.dinle'), size:'sm', act:'listen-voice-note',
                  data:{ 'data-id':e.id } }))}
                ${K.Button({ label:e.voiceNote ? 'Düzenle' : yz('esp.history.sesli-not-3'), size:'sm', act:'edit-voice-note',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:yz('esp.history.eszamanli'), size:'sm', act:'contemp',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:yz('esp.history.zincir-kur'), size:'sm', act:'new-chain',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:yz('esp.history.karta-cevir'), size:'sm', act:'to-cards',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:yz('esp.history.sil'), size:'sm', act:'del-event',
                  data:{ 'data-id':e.id } })}
              </div>
              ${when(S.ui.eventOpen === e.id, () => esZamanli(e))}
            </div>
          </div>`;
      })}
      ${when(!suzgec && list.length > ILK_OLAY, () => K.Button({ size:'sm', tone:'ghost', act:'olay-tumu', class:'mt-8',
        label:S.ui.olayTumu ? yz('esp.history.yalniz-son') + ILK_OLAY : yz('esp.history.tumu') + list.length + ' olay' }))}`,
    }));

    return rows;
  }

  function esZamanli(e){
    const list = ESP.Chrono.contemporaries(e.year, 50).filter(x => x.id !== e.id);
    return html`<div class="contemp">
      <p class="small"><b>${ESP.yearLabel(e.year)} ${yz('esp.history.50-yil')}</b> ${yz('esp.history.tarihin-en-ogretici-sorusu')}</p>
      ${list.length
        ? html`<ul class="contemp__list">${map(list, x => html`<li>
            <span class="num">${ESP.yearLabel(x.year)}</span>
            <span>${x.title}</span>
            <em class="tiny dim">${(ESP.REGIONS.filter(r => r.id === x.region)[0] || {}).label || ''}</em>
          </li>`)}</ul>`
        : K.Empty({ text:yz('esp.history.bu-aralikta-baska-olay-giril') })}
      ${K.Button({ label:yz('esp.history.kapat'), size:'sm', act:'contemp', data:{ 'data-id':'' } })}
    </div>`;
  }

  /* -------------------------------------------------------------- kaynaklar */

  function kaynakRows(){
    const b = ESP.Chrono.sourceBalance();
    const rows = [];

    /* BAM'dan belge (Part 8f): konu → olaylar ve kaynakları; yıl alıntıda
       doğrulanır. Teklif Bugün'e gelir, ESP kendi koduyla sınamadan eklemez. */
    rows.push(K.Entry({
      label:yz('esp.history.belge-iste'), hint:'belge',
      meta:'tarih · HKM',
      body:html`<div class="row gap-8 wrap">
        ${K.Input({ id:'belge-tarih', placeholder:yz('esp.history.konu-osmanli-nin-kurulusu-fr'),
          aria:yz('esp.history.tarih-konusu'), size:'sm', class:'grow' })}
        ${K.Button({ label:yz('esp.history.king-e-ilet'), size:'sm', act:'belge-iste',
          data:{ 'data-alan':'tarih' } })}
      </div>`,
    }));

    rows.push(K.Entry({
      label:yz('esp.history.kaynak-ekle'), hint:'source',
      meta:'birincil / ikincil',
      body:html`
        <div class="cols-2">
          ${K.Field({ label:yz('esp.history.kaynak'),
            input:K.Input({ id:'sr-title', placeholder:yz('esp.history.tevarih-i-al-i-osman'),
              aria:yz('esp.history.kaynagin-adi') }) })}
          ${K.Field({ label:yz('esp.history.yazar'),
            input:K.Input({ id:'sr-author', placeholder:yz('esp.history.asikpasazade'), aria:yz('esp.history.yazar') }) })}
        </div>
        <div class="cols-3 mt-10">
          ${K.Field({ label:yz('esp.history.tur'),
            input:K.Select({ id:'sr-kind', value:'secondary', aria:yz('esp.history.kaynagin-turu'),
              options:ESP.SOURCE_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
          ${K.Field({ label:yz('esp.history.yil'),
            input:K.Input({ id:'sr-year', type:'number', numeric:true, aria:yz('esp.history.kaynagin-yili') }) })}
          ${K.Field({ label:yz('esp.history.tarih-yazimi-okulu'),
            input:K.Select({ id:'sr-school', value:'', aria:yz('esp.history.tarih-yazimi-okulu'),
              options:[{ value:'', label:'(belirsiz)' }]
                .concat(ESP.HISTORIOGRAPHY.map(h => ({ value:h.id, label:h.label }))) }) })}
        </div>
        ${K.Button({ label:yz('esp.history.kaynagi-ekle'), act:'add-source', class:'mt-10' })}`,
    }));

    rows.push(K.Entry({
      label:yz('esp.history.denge'), hint:'balance',
      meta:b.cert === 'missing' ? 'veri yok'
        : b.primary + '/' + b.total + ' birincil',
      body:b.cert === 'missing'
        ? K.Empty({ text:yz('esp.history.henuz-kaynak-degerlendirilme') })
        : html`
          ${K.Meter({ label:yz('esp.history.birincil-oran'), value:Math.round(b.ratio * 100),
            text:'%' + Math.round(b.ratio * 100) })}
          ${when(b.note, () => K.Notice({ tone:'info', body:b.note }))}`,
    }));

    if(srcs().length){
      rows.push(K.Entry({
        label:yz('esp.history.kaynaklar'), meta:srcs().length + ' kaynak', wide:true,
        body:html`${map(srcs(), s => {
          const d = M.critiqueDepth(s);
          const okul = ESP.SCHOOL_BY_ID[s.school];
          return html`
            <div class="srcrow">
              <div class="srcrow__head">
                <b>${s.title}</b>
                <span class="tiny dim">${s.author || '—'}${s.year ? ' · ' + ESP.yearLabel(s.year) : ''}</span>
                ${K.Badge({ label:(ESP.SOURCE_KINDS.filter(k => k.id === s.kind)[0] || {}).label || s.kind,
                  tone:s.kind === 'primary' ? 'info' : 'muted', icon:false })}
                ${when(okul, () => K.Badge({ label:okul.label, tone:'muted', icon:false }))}
                ${K.Badge({ label:d.answered + '/' + d.total + ' soru',
                  tone:d.answered === d.total ? 'ok' : (d.answered ? 'warn' : 'muted') })}
                ${K.Button({ label:S.ui.sourceOpen === s.id ? 'Kapat' : 'Eleştir',
                  size:'sm', act:'open-source', data:{ 'data-id':s.id } })}
                ${K.Button({ label:yz('esp.history.sil'), size:'sm', act:'del-source', data:{ 'data-id':s.id } })}
              </div>
              ${when(S.ui.sourceOpen === s.id, () => critiqueForm(s))}
            </div>`;
        })}`,
      }));
    }

    return rows;
  }

  function critiqueForm(s){
    return html`<div class="critique">
      ${map(ESP.SOURCE_CRITIQUE, q => html`
        <div class="critique__q">
          <label for="cq-${q.id}"><b>${q.q}</b></label>
          <p class="tiny dim">${q.note}</p>
          ${K.Textarea({ id:'cq-' + q.id, rows:2, value:(s.answers || {})[q.id] || '',
            aria:q.q })}
        </div>`)}
      ${K.Button({ label:yz('esp.history.elestiriyi-kaydet'), tone:'primary', size:'sm',
        act:'save-critique', data:{ 'data-id':s.id } })}
    </div>`;
  }

  /* ----------------------------------------------------------------- zincir */

  function zincirRows(){
    const rows = [];
    const acik = S.ui.chainOpen ? chs().filter(c => c.id === S.ui.chainOpen)[0] : null;

    rows.push(K.Entry({
      label:yz('esp.history.neden-zinciri'), hint:'causal',
      meta:chs().length + ' zincir',
      body:evs().length
        ? html`
          <div class="row wrap">
            ${K.Select({ id:'ch-event', aria:yz('esp.history.zincirin-olayi'),
              options:evs().map(e => ({ value:e.id,
                label:ESP.yearLabel(e.year) + ' — ' + e.title })) })}
            ${K.Input({ id:'ch-q', placeholder:yz('esp.history.soru-bu-neden-oldu'),
              aria:yz('esp.history.zincirin-sorusu') })}
            ${K.Button({ label:yz('esp.history.zincir-ac'), act:'add-chain' })}
          </div>`
        : K.Empty({ text:yz('esp.history.once-bir-olay-ekle-zincir') }),
    }));

    chs().forEach(c => {
      const e = eventOf(c.eventId);
      const b = M.chainBalance(c);
      rows.push(K.Entry({
        label:(e ? ESP.yearLabel(e.year) : '—'),
        meta:b.links + ' halka',
        note:c.question || (e ? e.title : ''),
        action:html`${K.Button({ label:acik && acik.id === c.id ? 'Kapat' : 'Aç', size:'sm',
            act:'open-chain', data:{ 'data-id':c.id } })}
          ${K.Button({ label:yz('esp.history.sil'), size:'sm', act:'del-chain', data:{ 'data-id':c.id } })}`,
        wide:true,
        body:html`
          <div class="row wrap">
            ${K.Badge({ label:b.balanced ? 'dengeli' : 'dengesiz',
              tone:b.balanced ? 'ok' : 'warn' })}
            ${K.Badge({ label:b.sourced + '/' + b.links + ' kaynaklı',
              tone:b.sourced === b.links && b.links ? 'ok' : 'muted' })}
          </div>
          ${when(b.why, () => K.Notice({ tone:'warn', body:b.why }))}
          ${when(c.links.length, () => html`<ul class="chain">${map(c.links, l => {
            const src = sourceOf(l.sourceId);
            const kind = ESP.CAUSE_KINDS.filter(k => k.id === l.kind)[0] || {};
            return html`<li class="${cls('chain__link', 'chain__link--' + l.kind)}">
              <span class="chain__kind">${kind.label || l.kind}</span>
              <span class="chain__text">${l.text}</span>
              <span class="tiny dim">${src ? src.title : 'kaynaksız'}</span>
              ${K.Button({ label:yz('esp.history.kaldir'), size:'sm', act:'del-link',
                data:{ 'data-c':c.id, 'data-l':l.id } })}
            </li>`;
          })}</ul>`)}
          ${when(acik && acik.id === c.id, () => html`
            <div class="linkform mt-10">
              ${K.Select({ id:'cl-kind', value:'yapisal', aria:yz('esp.history.halkanin-turu'),
                options:ESP.CAUSE_KINDS.map(k => ({ value:k.id, label:k.label })) })}
              ${K.Input({ id:'cl-text', placeholder:yz('esp.history.halka-ne-neden'),
                aria:yz('esp.history.halkanin-metni') })}
              ${K.Select({ id:'cl-src', value:'', aria:yz('esp.history.halkanin-kaynagi'),
                options:[{ value:'', label:yz('esp.history.kaynaksiz') }]
                  .concat(srcs().map(s => ({ value:s.id, label:s.title }))) })}
              ${K.Button({ label:yz('esp.history.halka-ekle'), tone:'primary', size:'sm',
                act:'add-link', data:{ 'data-id':c.id } })}
            </div>`)}`,
      }));
    });

    return rows;
  }

  /* ---------------------------------------------------------------- çalışma */

  function calismaRows(){
    const rows = [];
    const drill = ESP.Chrono.drill();
    const r = ESP.Chrono.retention();
    const due = ESP.SRS.dueCards().filter(c => c.lang === ESP.HISTORY_DECK);

    rows.push(K.Entry({
      label:yz('esp.history.bugunun-egzersizi'), hint:'drill',
      meta:drill ? 'kademe ' + drill.level : '—',
      body:drill
        ? K.NextUp({ icon:'zap', label:drill.label, title:drill.task,
            why:yz('esp.history.bu-egzersiz-olculen-aciga-go') })
        : K.Empty({ text:yz('esp.history.egzersiz-listesi-bos') }),
    }));

    rows.push(K.Entry({
      label:yz('esp.history.tarih-destesi'), hint:'srs',
      meta:due.length ? due.length + ' kartın sırası geldi' : 'vadesi gelen yok',
      body:html`
        ${r.cert === 'missing'
          ? K.Notice({ tone:'info', body:yz('esp.history.kart-hatirlama-henuz-olculem')
              + 'en az ' + ESP.Planner.RETENTION_MIN_CARDS + ' cevaplanmış kart gerekir.' })
          : K.Meter({ label:yz('esp.history.kart-hatirlama'), value:Math.round(r.value * 100),
              text:'%' + Math.round(r.value * 100),
              tone:r.value < ESP.Planner.RETENTION_FLOOR ? 'danger' : 'ok',
              note:r.n + ' karttan hesaplandı' })}
        ${when(due.length, () => K.Button({ label:yz('esp.history.tekrara-basla'),
          act:'go-cards', class:'mt-10' }))}`,
    }));

    rows.push(K.Entry({
      label:yz('esp.history.anakronizm-tuzaklari'), hint:'anachronism',
      meta:ESP.ANACHRONISMS.length + ' tuzak',
      body:K.Table({ tight:true, headers:['Tuzak', yz('esp.history.ne-yapar')],
        rows:ESP.ANACHRONISMS.map(a => [a.label, a.note]) }),
    }));

    rows.push(K.Entry({
      label:yz('esp.history.tarih-yazimi-okullari'), hint:'school',
      meta:ESP.HISTORIOGRAPHY.length + ' okul',
      wide:true,
      body:K.Table({ tight:true, headers:['Okul', yz('esp.history.neye-bakar'), 'Sorusu'],
        rows:ESP.HISTORIOGRAPHY.map(h => [h.label, h.note, h.asks]) }),
    }));

    rows.push(K.Entry({
      label:yz('esp.history.egzersiz-katalogu'),
      meta:ESP.HISTORY_DRILLS.length + ' egzersiz',
      wide:true,
      body:K.Table({ tight:true,
        headers:[{ label:yz('esp.history.kademe'), num:true }, 'Egzersiz', yz('esp.history.ne-yapilir')],
        rows:ESP.HISTORY_DRILLS.slice().sort((a, b) => a.level - b.level)
          .map(d => [String(d.level), d.label, d.task]) }),
    }));

    return rows;
  }

  /* ------------------------------------------------------------------ öğren

     Tarih ünitesi kendi olay listesini taşımaz: tohum olaylardan döneme,
     bölgeye ya da alana göre süzer. İki yerde iki liste tutmak, birinin
     eskimesi demektir. */
  function learnRows(){
    return [
      K.Entry({
        label:yz('esp.history.pratik'), hint:'tarih-pratik',
        meta:S.ui.practice && S.ui.practice.deck === ESP.HISTORY_DECK
          ? 'oturum açık' : ESP.PRACTICE_LENGTH + ' soru',
        wide:true,
        body:ESP.Parts.practice(ESP.HISTORY_DECK),
      }),

      K.Entry({
        label:yz('esp.history.konular'), hint:'topic',
        meta:ESP.Lesson.topicSummary('history').topics + ' konu · '
          + ESP.Lesson.topicSummary('history').items + ' madde',
        wide:true,
        body:ESP.Parts.topics('history'),
      }),

      K.Entry({
        label:yz('esp.history.uniteler'), hint:'unit',
        meta:ESP.Lesson.units('history').length + ' ünite',
        wide:true,
        body:ESP.Parts.units('history'),
      }),
    ];
  }

  /* ----------------------------------------------------------------- çizim */

  /* Sekme yok (EKIP-PLANI §1.2): bölümler alt alta, tezgâh en sonda. */
  const GOVDE = { serit:seritRows, olaylar:olayRows, kaynaklar:kaynakRows, zincir:zincirRows,
    ogren:learnRows, calisma:calismaRows };

  LIFEOS.PARCA.blok({ id:'history.tarih-sekmeleri', sayfa:'history', yer:'y1', sira:10, ad:'Tarih sekmeleri', ciz(){
    return K.Span(12, ESP.Parts.bolumler('history', { act:'pick-tab', aria:yz('esp.history.tarih-bolumleri'), tabs:TABS,
        govde:GOVDE }));
  } });
  function render(){
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('history', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('histTab', TABS[0].id); }

  /* ----------------------------------------------------------------- eylem */

  const handle = {
    async 'olay-tumu'(){ S.ui.olayTumu = !S.ui.olayTumu; ESP.App.render(); },
    async 'belge-iste'(el){
      const k = document.getElementById('belge-' + el.dataset.alan);
      const r = await ESP.Belge.iste({ alan:el.dataset.alan, konu:k ? k.value : '' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    async 'pick-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'pick-era'(el){
      S.ui.histEra = el.dataset.id === S.ui.histEra ? 'all' : el.dataset.id;
      ESP.App.render();
    },

    async 'seed'(){
      const res = await M.seedEvents();
      ESP.Memo.bitir();
      ESP.UI.toast(res.added + ' olay eklendi'
        + (res.skipped ? ', ' + res.skipped + ' tanesi zaten vardı' : ''));
      ESP.App.render();
    },

    async 'add-event'(){
      const res = await M.saveEvent(M.newEvent({
        title:val('ev-title'), year:num('ev-year'),
        kind:val('ev-kind') || 'siyasi', region:val('ev-region') || 'dunya',
        why:val('ev-why'),
      }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.history.olay-kronolojiye-girdi'));
      ESP.App.render();
    },

    async 'edit-voice-note'(el){
      const e = eventOf(el.dataset.id);
      if(!e) return;
      ESP.UI.sheet({
        title:yz('esp.history.sesli-not-2') + e.title,
        subtitle:ESP.yearLabel(e.year),
        body:String(html`
          <div class="stack">
            <div class="row between align-center mb-6">
              <label for="ev-voice-text" class="small muted">${yz('esp.history.sesli-not-metni-mikrofonla-d')}</label>
              ${K.Mic({ target:'ev-voice-text' })}
            </div>
            ${K.Textarea({ id:'ev-voice-text', rows:4, value:e.voiceNote || '',
              placeholder:yz('esp.history.tarihi-olayla-ilgili-sesli-n'), aria:yz('esp.history.sesli-not-3') })}
            <div class="row wrap gap-8 mt-10">
              ${K.Button({ label:yz('esp.history.kaydet'), tone:'primary', size:'sm', act:'save-voice-note', data:{ 'data-id':e.id } })}
              ${when(e.voiceNote, () => K.Button({ label:yz('esp.history.dinle-herodot'), size:'sm', act:'speak-voice-note', data:{ 'data-id':e.id } }))}
              ${when(e.voiceNote, () => K.Button({ label:yz('esp.history.notu-sil'), tone:'ghost', size:'sm', act:'clear-voice-note', data:{ 'data-id':e.id } }))}
            </div>
          </div>`),
        footer:String(K.Button({ label:yz('esp.history.kapat'), act:'sheet-close' }))
      });
    },

    async 'save-voice-note'(el){
      const e = eventOf(el.dataset.id);
      if(!e) return;
      const text = val('ev-voice-text');
      await M.saveEvent(Object.assign({}, e, { voiceNote:text }));
      ESP.Memo.bitir();
      ESP.UI.closeSheet();
      ESP.UI.toast(text ? yz('esp.history.sesli-not-kaydedildi') : yz('esp.history.sesli-not-temizlendi'));
      ESP.App.render();
    },

    async 'clear-voice-note'(el){
      const e = eventOf(el.dataset.id);
      if(!e) return;
      await M.saveEvent(Object.assign({}, e, { voiceNote:'' }));
      ESP.Memo.bitir();
      ESP.UI.closeSheet();
      ESP.UI.toast(yz('esp.history.sesli-not-silindi'));
      ESP.App.render();
    },

    async 'speak-voice-note'(el){
      const e = eventOf(el.dataset.id);
      const text = (document.getElementById('ev-voice-text') ? val('ev-voice-text') : '') || (e ? e.voiceNote : '');
      if(!text){
        ESP.UI.toast(yz('esp.history.seslendirilecek-sesli-not-yo'));
        return;
      }
      if(ESP.Speak && ESP.Speak.isSpeaking()){
        ESP.Speak.stop();
      } else if(ESP.Speak){
        ESP.Speak.say(text, { agent:'herodot' });
      }
    },

    async 'listen-voice-note'(el){
      const e = eventOf(el.dataset.id);
      if(!e || !e.voiceNote){
        ESP.UI.toast(yz('esp.history.sesli-not-bulunamadi'));
        return;
      }
      if(ESP.Speak && ESP.Speak.isSpeaking()){
        ESP.Speak.stop();
      } else if(ESP.Speak){
        ESP.Speak.say(e.voiceNote, { agent:'herodot' });
      }
    },

    async 'del-event'(el){
      const id = el.dataset.id;
      const e = eventOf(id);
      const zincir = chs().filter(c => c.eventId === id).length;
      ESP.UI.confirmSheet(yz('esp.history.olay-silinsin-mi'),
        (e ? '«' + e.title + '» ' : '') + 've bu olaya bağlı neden zincirleri kalkar.',
        async () => {
          await M.deleteEvent(id);
          ESP.Memo.bitir();
          ESP.App.render();
        }, true, zincir ? yz('esp.history.olayi-ve') + zincir + ' zinciri sil' : yz('esp.history.olayi-sil'));
    },

    async 'contemp'(el){
      S.ui.eventOpen = el.dataset.id || null;
      ESP.App.render();
    },

    /* Bir olaydan iki kart cikar: "olay -> yil" ve "yil -> olay".
       Ikisi ayri hatirlama isidir; biri bilinirken oteki bilinmeyebilir. */
    async 'to-cards'(el){
      const e = eventOf(el.dataset.id);
      if(!e) return;
      const kartlar = ESP.Chrono.cardsFor(e);
      let eklenen = 0;
      for(const k of kartlar){
        const var_ = (S.cards || []).some(c => c.lang === ESP.HISTORY_DECK
          && U.norm(c.front) === U.norm(k.front));
        if(var_) continue;
        await M.saveCard(M.newCard(k));
        eklenen++;
      }
      ESP.Memo.bitir();
      ESP.UI.toast(eklenen ? eklenen + ' kart eklendi' : yz('esp.history.kartlar-zaten-vardi'));
      ESP.App.render();
    },

    async 'go-cards'(){
      S.ui.langDeck = ESP.HISTORY_DECK;
      S.ui.langTab = 'calis';
      ESP.App.go('lang');
    },

    async 'add-source'(){
      const res = await M.saveSource(M.newSource({
        title:val('sr-title'), author:val('sr-author'), year:num('sr-year'),
        kind:val('sr-kind') || 'secondary', school:val('sr-school') || null,
      }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'open-source'(el){
      S.ui.sourceOpen = S.ui.sourceOpen === el.dataset.id ? null : el.dataset.id;
      ESP.App.render();
    },

    async 'save-critique'(el){
      const s = sourceOf(el.dataset.id);
      if(!s) return;
      const cevaplar = {};
      ESP.SOURCE_CRITIQUE.forEach(q => {
        const v = val('cq-' + q.id);
        if(v) cevaplar[q.id] = v;
      });
      await M.saveSource(Object.assign({}, s, { answers:cevaplar }));
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.history.elestiri-kaydedildi'));
      ESP.App.render();
    },

    async 'del-source'(el){
      await M.deleteSource(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'add-chain'(){
      const res = await M.saveChain(M.newChain({
        eventId:val('ch-event'), question:val('ch-q'),
      }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      S.ui.chainOpen = res.chain.id;
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'new-chain'(el){
      const res = await M.saveChain(M.newChain({ eventId:el.dataset.id }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      S.ui.chainOpen = res.chain.id;
      S.ui.histTab = 'zincir';
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'open-chain'(el){
      S.ui.chainOpen = S.ui.chainOpen === el.dataset.id ? null : el.dataset.id;
      ESP.App.render();
    },

    async 'add-link'(el){
      const c = chs().filter(x => x.id === el.dataset.id)[0];
      if(!c) return;
      const metin = val('cl-text');
      if(!metin){ ESP.UI.toast(yz('esp.history.halkanin-metni-bos-olamaz')); return; }
      const links = (c.links || []).concat([{
        id:U.uid('l'), kind:val('cl-kind') || 'yapisal', text:metin,
        sourceId:val('cl-src') || null,
      }]);
      await M.saveChain(Object.assign({}, c, { links }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-link'(el){
      const c = chs().filter(x => x.id === el.dataset.c)[0];
      if(!c) return;
      await M.saveChain(Object.assign({}, c,
        { links:(c.links || []).filter(l => l.id !== el.dataset.l) }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-chain'(el){
      await M.deleteChain(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {
    async 'hist-query'(el){ S.ui.histQuery = el.value; ESP.App.render(); },
  };

  return {
    id:'history',
    /* iPhone Faz 2c: Şerit'te iş zaman şeridinin kendisi; dönem kutuları
       ara sıra açılan süzgeç (şerit), boşluk ve dağılım dönen kartta.
       Öbür bölümlerde belge isteği ve iki başvuru tablosu şerit. */
    kucukVarsayilan:['dönemler', 'belge-iste', 'anakronizm-tuzakları', 'tarih-yazımı-okulları'],
    title:yz('esp.history.kronoloji'),
    headline(){
      const st = ESP.Chrono.status();
      if(st.cert === 'missing') return yz('esp.history.zaman-seridi-bos');
      if(st.chains.unbalanced) return st.chains.unbalanced + ' zincirde yapısal koşul yok.';
      if(!st.chains.total) return st.events + ' olay var, hiçbiri zincirle açıklanmamış.';
      if(st.kinds.empty.length) return st.kinds.empty.join(', ') + ' alanından olay yok.';
      return st.events + ' olay, ' + st.chains.total + ' zincir.';
    },
    lede(){
      return yz('esp.history.kac-olay-bildigin-degil-kaci')
           + yz('esp.history.kronoloji-iskelet-zincir-ve');
    },
    stats(){
      const st = ESP.Chrono.status();
      return [
        { value:String(st.events), label:'olay' },
        { value:st.eras.covered + '/' + st.eras.total, label:yz('esp.history.donem-2') },
        { value:String(st.chains.total), label:'zincir' },
        { value:st.sources.total ? st.sources.primary + '/' + st.sources.total : '—',
          label:yz('esp.history.birincil-kaynak') },
      ];
    },
    subtitle(){
      const st = ESP.Chrono.status();
      return st.cert === 'missing' ? 'boş şerit'
        : ESP.yearLabel(st.firstYear) + ' – ' + ESP.yearLabel(st.lastYear);
    },
    actions(){ return ''; },
    render, afterRender, handle, change,
  };
})();
