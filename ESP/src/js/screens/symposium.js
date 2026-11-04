/* Sempozyum — tez, destek, itiraz ve safsata denetimi.

   Dört sekme: Açık · Kapalı · Ekle · Metinler.

   Sistemin buradaki tek iddiası şu: bir tez ancak cevaplanmamış itirazı
   kalmadığında kapanır. Bunu model değil kural motoru zorlar (Model.
   argumentOpen) — bir tezi «kapandı» diye işaretlemek, itirazı cevaplamanın
   yerine geçmez.

   Socrates cevap yazmaz, soru sorar. Model kapalıyken de sorar: sorular
   data/canon.js içindeki kalıplardan gelir ve kural motorunun kendi
   çıktısıdır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:40, id:'act:arg', kind:'Eylem', label:'Yeni tez yaz',
  hint:'Felsefe', run:() => { ESP.S.ui.philoTab = 'ekle'; ESP.App.go('symposium');
    setTimeout(() => { const el = document.getElementById('arg-text'); if(el) el.focus(); }, 160); } });
window.LIFEOS.PARCA.yazilar({
  'esp.symposium.acik':'Açık',
  'esp.symposium.kapali':'Kapalı',
  'esp.symposium.ekle':'Ekle',
  'esp.symposium.metinler':'Metinler',
  'esp.symposium.deneyler':'Deneyler',
  'esp.symposium.ogren':'Öğren',
  'esp.symposium.dusunce-deneyleri':'Düşünce deneyleri',
  'esp.symposium.alan-suzgeci':'Alan süzgeci',
  'esp.symposium.butun-alanlar':'Bütün alanlar',
  'esp.symposium.tez-yap':'Tez yap',
  'esp.symposium.zorladigi-ayrim':'Zorladığı ayrım:',
  'esp.symposium.arguman-alistirmalari':'Argüman alıştırmaları',
  'esp.symposium.kapat':'Kapat',
  'esp.symposium.sil':'Sil',
  'esp.symposium.destek':'Destek',
  'esp.symposium.henuz-destek-yazilmadi':'Henüz destek yazılmadı.',
  'esp.symposium.destek-ekle':'Destek ekle…',
  'esp.symposium.destek-ekle-2':'Destek ekle',
  'esp.symposium.i-tiraz':'İtiraz',
  'esp.symposium.cevabin':'Cevabın…',
  'esp.symposium.i-tiraza-cevabin':'İtiraza cevabın',
  'esp.symposium.cevapla':'Cevapla',
  'esp.symposium.i-tiraz-yok-en-guclu-karsi':'İtiraz yok. En güçlü karşı tezi sen yazmazsan tez sınanmamış kalır.',
  'esp.symposium.i-tiraz-ekle':'İtiraz ekle…',
  'esp.symposium.i-tiraz-ekle-2':'İtiraz ekle',
  'esp.symposium.safsata-denetimi':'Safsata denetimi',
  'esp.symposium.socrates-e-sor':'Socrates\'e sor',
  'esp.symposium.rastgele-soru':'Rastgele soru',
  'esp.symposium.soru':'Soru',
  'esp.symposium.acik-tez':'Açık tez',
  'esp.symposium.acik-tez-yok-tek-cumlelik':'Açık tez yok. Tek cümlelik bir tez yazmak yeterli; ',
  'esp.symposium.tez-yaz':'Tez yaz',
  'esp.symposium.kapanan-tez':'Kapanan tez',
  'esp.symposium.henuz-kapanan-tez-yok-bir':'Henüz kapanan tez yok. Bir tez ancak cevaplanmamış ',
  'esp.symposium.yeni-tez':'Yeni tez',
  'esp.symposium.tez-metni':'Tez metni',
  'esp.symposium.ozgurluk-yalnizca-secenek-co':'Özgürlük yalnızca seçenek çokluğu değildir çünkü seçenekleri ',
  'esp.symposium.coz':'Çöz',
  'esp.symposium.oldugu-gibi-kaydet':'Olduğu gibi kaydet',
  'esp.symposium.nereye-koyacagimi-anlamadim':'Nereye koyacağımı anlamadım',
  'esp.symposium.kaydet':'Kaydet',
  'esp.symposium.vazgec':'Vazgeç',
  'esp.symposium.sokratik-sorular':'Sokratik sorular',
  'esp.symposium.kaynaklar':'Kaynaklar',
  'esp.symposium.kaynak-listesi-bos':'Kaynak listesi boş.',
  'esp.symposium.belge-iste':'Belge iste',
  'esp.symposium.konu-stoacilik-varolusculuk':'Konu: Stoacılık, varoluşçuluk…',
  'esp.symposium.felsefe-konusu':'Felsefe konusu',
  'esp.symposium.king-e-ilet':'King’e ilet',
  'esp.symposium.kanondan-ekle':'Kanondan ekle',
  'esp.symposium.kanondan-eser-sec':'Kanondan eser seç',
  'esp.symposium.listede-olmayan-bir-kaynagi':'Listede olmayan bir kaynağı elle de ekleyebilirsin.',
  'esp.symposium.eser':'Eser',
  'esp.symposium.baslik':'Başlık',
  'esp.symposium.yazar':'Yazar',
  'esp.symposium.tur':'Tür',
  'esp.symposium.primer-metin':'Primer metin',
  'esp.symposium.yorum':'Yorum',
  'esp.symposium.elle-ekle':'Elle ekle',
  'esp.symposium.konular':'Konular',
  'esp.symposium.acik-tezler':'Açık tezler',
  'esp.symposium.felsefe-bolumleri':'Felsefe bölümleri',
  'esp.symposium.deney-bir-itiraz-olarak-acil':'Deney bir itiraz olarak açıldı — tezi sen yaz',
  'esp.symposium.tez-bulunamadi':'Tez bulunamadı',
  'esp.symposium.tez-kaydedildi':'Tez kaydedildi',
  'esp.symposium.metin-bos':'Metin boş',
  'esp.symposium.cevaplanmamis-itiraz-varken':'Cevaplanmamış itiraz varken tez kapanmaz',
  'esp.symposium.eser-adi-gerekir':'Eser adı gerekir',
  'esp.symposium.sempozyum':'Sempozyum',
  'esp.symposium.acik-tez-2':'açık tez',
  'esp.symposium.acik-itiraz':'açık itiraz',
  'esp.symposium.kapandi':'kapandı',
  'esp.symposium.primer-metin-2':'primer metin',
});
window.LIFEOS.PARCA.sayfa({ id:'symposium', modul:'esp', king:{ sira:210, ad:'Felsefe', es:['felsefe', 'sempozyum'] }, cekmece:'calisma', ad:'Felsefe', ikon:'socratic', ek:{ disc:'philo' }, sira:20 });

ESP.Screens.symposium = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'acik',     label:yz('esp.symposium.acik') },
    { id:'kapali',   label:yz('esp.symposium.kapali') },
    { id:'ekle',     label:yz('esp.symposium.ekle') },
    { id:'metinler', label:yz('esp.symposium.metinler') },
    { id:'deneyler', label:yz('esp.symposium.deneyler') },
    { id:'ogren',     label:yz('esp.symposium.ogren') },
  ];

  /* --------------------------------------------------------------- deneyler

     Bir tez yazmak ile bir tezi SINAMAK ayrı işlerdir. Düşünce deneyi
     sınamanın en ucuz aracıdır: laboratuvar gerektirmez, yalnızca dürüstlük
     ister.

     Deneylerin «doğru cevabı» yazılmadı ve bu bilinçli: cevabı veren bir
     liste, deneyi bir bilgi yarışması sorusuna çevirir. Yazılan tek şey,
     deneyin hangi AYRIMI zorladığı. */
  function experimentRows(){
    const alan = S.ui.expField || 'all';
    const list = (ESP.EXPERIMENTS || [])
      .filter(x => alan === 'all' || x.field === alan);

    return [
      K.Entry({
        label:yz('esp.symposium.dusunce-deneyleri'), hint:'experiment',
        meta:list.length + ' deney',
        action:K.Select({ id:'exp-field', value:alan, change:'exp-field',
          aria:yz('esp.symposium.alan-suzgeci'),
          options:[{ value:'all', label:yz('esp.symposium.butun-alanlar') }]
            .concat(ESP.EXPERIMENT_FIELDS.map(f => ({ value:f.id, label:f.label }))) }),
        wide:true,
        body:html`${map(list, x => html`
          <div class="exprow">
            <div class="exprow__head">
              <b>${x.label}</b>
              ${K.Badge({ label:(ESP.EXPERIMENT_FIELDS.filter(f => f.id === x.field)[0]
                || {}).label || x.field, tone:'muted', icon:false })}
              ${K.Button({ label:yz('esp.symposium.tez-yap'), size:'sm', act:'exp-to-thesis',
                data:{ 'data-id':x.id } })}
            </div>
            <p>${x.setup}</p>
            <p class="small muted"><b>${yz('esp.symposium.zorladigi-ayrim')}</b> ${x.tests}</p>
          </div>`)}`,
      }),

      K.Entry({
        label:yz('esp.symposium.arguman-alistirmalari'), hint:'argument-drill',
        meta:ESP.ARGUMENT_DRILLS.length + ' alıştırma',
        wide:true,
        body:K.Table({ tight:true, headers:['Alıştırma', 'Ne yapılır', 'Neden'],
          rows:ESP.ARGUMENT_DRILLS.map(d => [d.label, d.task, d.note]) }),
      }),
    ];
  }

  /* ---------------------------------------------------------------- tez kartı */

  /* 108 SORU ZİNCİRİ (vitrin): tez, her itiraz bir «neden?» halkası ve
     cevabı. Metin kullanıcının; sıra kaydın sırası. */
  function zincirHtml(a){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !(a.objections || []).length) return '';
    const h = [{ metin:a.thesis, soru:false }];
    (a.objections || []).forEach(o => { h.push({ metin:o.text, soru:true }); if(o.answered && o.answer) h.push({ metin:o.answer, soru:false }); });
    return V.soruZinciri({ halkalar:h, harf:'?' });
  }

  function argRow(a){
    const acikItiraz = (a.objections || []).filter(o => !o.answered);
    const safsata = ESP.Intellect.checkFallacies(
      [a.thesis].concat(a.supports || []).join(' '));
    const yas = U.diffDays(ESP.U.gunOf((a.updatedAt || a.createdAt || '')), U.todayISO());

    return K.Entry({
      label:a.status === 'open' ? 'AÇIK TEZ' : 'KAPANDI',
      meta:U.fmtShort(ESP.U.gunOf((a.updatedAt || a.createdAt || '')))
        + (yas >= 14 && a.status === 'open' ? ' · ' + yas + ' gündür sessiz' : ''),
      note:acikItiraz.length
        ? acikItiraz.length + ' itiraz cevaplanmadı; tez bu yüzden kapanamaz.'
        : (a.status === 'open' ? 'Cevaplanmamış itiraz yok — kapatılabilir.' : ''),
      action:html`${when(a.status === 'open' && !acikItiraz.length,
          () => K.Button({ label:yz('esp.symposium.kapat'), size:'sm', tone:'primary', act:'close-arg',
            data:{ 'data-id':a.id } }))}
        ${K.Button({ label:yz('esp.symposium.sil'), size:'sm', act:'del-arg', data:{ 'data-id':a.id } })}`,
      wide:true,
      body:html`
        <p class="thesis">${a.thesis}</p>
        ${when(zincirHtml(a), () => html`<div class="mt-10">${raw(zincirHtml(a))}</div>`)}

        ${when((a.concepts || []).length, () => html`<div class="row wrap mt-8">
          ${map(a.concepts, c => K.Chip({ label:(ESP.CONCEPT_BY_ID[c] || {}).label || c }))}
        </div>`)}

        <div class="argcols mt-12">
          <div class="argcol">
            <p class="argcol__h">${yz('esp.symposium.destek')}</p>
            ${(a.supports || []).length
              ? html`<ul class="argcol__list">${map(a.supports, s => html`<li>${s}</li>`)}</ul>`
              : html`<p class="small muted">${yz('esp.symposium.henuz-destek-yazilmadi')}</p>`}
            <div class="row mt-8">
              ${K.Input({ id:'sup-' + a.id, placeholder:yz('esp.symposium.destek-ekle'), size:'sm',
                aria:yz('esp.symposium.destek-ekle-2') })}
              ${K.Button({ label:yz('esp.symposium.ekle'), size:'sm', act:'add-support', data:{ 'data-id':a.id } })}
            </div>
          </div>

          <div class="argcol">
            <p class="argcol__h">${yz('esp.symposium.i-tiraz')}</p>
            ${(a.objections || []).length
              ? html`<ul class="argcol__list">${map(a.objections, o => html`
                  <li class="${o.answered ? 'is-answered' : ''}">
                    <span>${o.text}</span>
                    ${o.answered
                      ? html`<em class="argcol__ans">${o.answer}</em>`
                      : html`<div class="row mt-4">
                          ${K.Input({ id:'ans-' + o.id, placeholder:yz('esp.symposium.cevabin'), size:'sm',
                            aria:yz('esp.symposium.i-tiraza-cevabin') })}
                          ${K.Button({ label:yz('esp.symposium.cevapla'), size:'sm', act:'answer-obj',
                            data:{ 'data-id':a.id, 'data-obj':o.id } })}
                        </div>`}
                  </li>`)}</ul>`
              : html`<p class="small muted">${yz('esp.symposium.i-tiraz-yok-en-guclu-karsi')}</p>`}
            <div class="row mt-8">
              ${K.Input({ id:'obj-' + a.id, placeholder:yz('esp.symposium.i-tiraz-ekle'), size:'sm',
                aria:yz('esp.symposium.i-tiraz-ekle-2') })}
              ${K.Button({ label:yz('esp.symposium.ekle'), size:'sm', act:'add-obj', data:{ 'data-id':a.id } })}
            </div>
          </div>
        </div>

        ${when(safsata.length, () => K.Notice({ tone:'info', title:yz('esp.symposium.safsata-denetimi'),
          body:safsata.map(f => '<b>' + f.label + '</b> — ' + f.note).join('<br/>')
            + '<br/><br/>Bu bir yargı değil bir bulgudur: kalıbın yakalanması '
            + 'argümanın yanlış olduğunu göstermez, bakmaya değer olduğunu gösterir.' }))}

        <div class="row mt-12">
          ${K.Button({ label:yz('esp.symposium.socrates-e-sor'), act:'ask-socrates', data:{ 'data-id':a.id } })}
          ${K.Button({ label:yz('esp.symposium.rastgele-soru'), size:'sm', act:'socratic-q',
            data:{ 'data-id':a.id } })}
        </div>
        ${when(S.ui.socraticFor === a.id && S.ui.socraticQ,
          () => K.Notice({ tone:'info', title:yz('esp.symposium.soru'), body:S.ui.socraticQ }))}`,
    });
  }

  /* ------------------------------------------------------------------ sekmeler */

  function openRows(){
    const rows = ESP.Intellect.openArguments();
    if(!rows.length){
      return [K.Entry({ label:yz('esp.symposium.acik-tez'), meta:'yok',
        body:K.Empty({ text:yz('esp.symposium.acik-tez-yok-tek-cumlelik')
          + 'gerisini itirazlar açar.',
          action:K.Button({ label:yz('esp.symposium.tez-yaz'), tone:'primary', act:'tab-ekle' }) }) })];
    }
    return rows.map(argRow);
  }

  function closedRows(){
    const rows = (S.args || []).filter(a => a.status === 'closed');
    if(!rows.length){
      return [K.Entry({ label:yz('esp.symposium.kapanan-tez'), meta:'yok',
        body:K.Empty({ text:yz('esp.symposium.henuz-kapanan-tez-yok-bir')
          + 'itirazı kalmadığında kapanır.' }) })];
    }
    return rows.map(argRow);
  }

  function addRows(){
    const res = S.ui.argParsed;
    return [
      K.Entry({
        label:yz('esp.symposium.yeni-tez'), hint:'argument',
        meta:'tek cümle yeter',
        body:html`
          ${K.Textarea({ id:'arg-text', rows:4, aria:yz('esp.symposium.tez-metni'),
            placeholder:yz('esp.symposium.ozgurluk-yalnizca-secenek-co')
              + 'değerlendirecek ölçüt de gerekir. Ama ölçütü kim koyar?' })}
          <div class="row mt-10">
            ${K.Button({ label:yz('esp.symposium.coz'), act:'parse-arg' })}
            ${K.Button({ label:yz('esp.symposium.oldugu-gibi-kaydet'), act:'save-arg-raw' })}
          </div>
          ${when(res, () => html`
            <div class="mt-10">
              ${K.Table({ tight:true, headers:['Parça', 'İçerik'], rows:[
                ['Tez', res.thesis || '—'],
                ['Destek', (res.supports || []).join(' · ') || '—'],
                ['İtiraz', (res.objections || []).join(' · ') || '—'],
              ] })}
              ${when(res.unmatched.length, () => K.Notice({ tone:'warn',
                title:yz('esp.symposium.nereye-koyacagimi-anlamadim'),
                body:res.unmatched.map(u => '«' + U.esc(u.text) + '»').join('<br/>')
                  + '<br/><br/>Kaydedersen bu cümleler destek sayılır; '
                  + 'istersen metni düzenleyip yeniden çözebilirsin.' }))}
              <div class="row mt-8">
                ${K.Button({ label:yz('esp.symposium.kaydet'), tone:'primary', size:'sm', act:'save-arg' })}
                ${K.Button({ label:yz('esp.symposium.vazgec'), size:'sm', act:'clear-arg' })}
              </div>
            </div>`)}`,
      }),

      K.Entry({
        label:yz('esp.symposium.sokratik-sorular'), hint:'sokratik',
        meta:ESP.SOCRATIC.length + ' kalıp',
        body:K.Table({ tight:true, headers:['Soru'],
          rows:ESP.SOCRATIC.map(q => [q.q]) }),
      }),
    ];
  }

  function textRows(){
    const kitaplar = (S.books || []);
    return [
      K.Entry({
        label:yz('esp.symposium.kaynaklar'), hint:'primary-text',
        meta:kitaplar.length + ' kayıt',
        wide:true,
        body:kitaplar.length
          ? K.Table({ tight:true, headers:['Eser', 'Yazar', 'Tür', 'Başlangıç', ''],
              rows:kitaplar.map(b => [
                b.title, b.author,
                b.kind === 'primary' ? 'primer' : 'yorum',
                b.startedAt ? U.fmtShort(b.startedAt) : 'başlanmadı',
                K.Button({ label:yz('esp.symposium.sil'), size:'sm', act:'del-book', data:{ 'data-id':b.id } }),
              ]) })
          : K.Empty({ text:yz('esp.symposium.kaynak-listesi-bos') }),
      }),

      /* BAM'dan belge (Part 8f): konu → düşünür, eser ve tez; kaynaklı.
         Teklif Bugün'e gelir, ESP kendi koduyla sınamadan eklenmez. */
      K.Entry({
        label:yz('esp.symposium.belge-iste'), hint:'belge',
        meta:'felsefe · HKM',
        body:html`<div class="row gap-8 wrap">
          ${K.Input({ id:'belge-felsefe', placeholder:yz('esp.symposium.konu-stoacilik-varolusculuk'), aria:yz('esp.symposium.felsefe-konusu'),
            size:'sm', class:'grow' })}
          ${K.Button({ label:yz('esp.symposium.king-e-ilet'), size:'sm', act:'belge-iste',
            data:{ 'data-alan':'felsefe' } })}
        </div>`,
      }),

      K.Entry({
        label:yz('esp.symposium.kanondan-ekle'), hint:'kanon',
        meta:ESP.CANON.length + ' eser',
        body:html`
          <div class="row wrap">
            ${K.Select({ id:'canon-pick', aria:yz('esp.symposium.kanondan-eser-sec'),
              options:ESP.CANON.map(c => ({ value:c.id,
                label:c.author + ' — ' + c.title })) })}
            ${K.Button({ label:yz('esp.symposium.ekle'), act:'add-canon' })}
          </div>
          <p class="small muted mt-8">${yz('esp.symposium.listede-olmayan-bir-kaynagi')}</p>
          <div class="cols-3 mt-10">
            ${K.Field({ label:yz('esp.symposium.eser'), input:K.Input({ id:'b-title', placeholder:yz('esp.symposium.baslik') }) })}
            ${K.Field({ label:yz('esp.symposium.yazar'), input:K.Input({ id:'b-author', placeholder:yz('esp.symposium.yazar') }) })}
            ${K.Field({ label:yz('esp.symposium.tur'), input:K.Select({ id:'b-kind', value:'primary',
              options:[{ value:'primary', label:yz('esp.symposium.primer-metin') },
                { value:'secondary', label:yz('esp.symposium.yorum') }] }) })}
          </div>
          ${K.Button({ label:yz('esp.symposium.elle-ekle'), act:'add-book', class:'mt-10' })}`,
      }),
    ];
  }

  /* Konu haritası — bu bölümde nelerin çalışılacağı.

     İşaretler beyandır ve öyle etiketlenir; hiçbir kapıyı açmaz. */
  function topicRows(){
    const ozet = ESP.Lesson.topicSummary('philo');
    return [
      K.Entry({
        label:yz('esp.symposium.konular'), hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        wide:true,
        body:ESP.Parts.topics('philo'),
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  /* Sekme yok (EKIP-PLANI §1.2): bölümler alt alta, tezgâh en sonda. */
  const GOVDE = { acik:openRows, kapali:closedRows, ekle:addRows, metinler:textRows,
    deneyler:experimentRows, ogren:topicRows };

  /* PANO KARTI (2026-10-20): açık tezler ve kaç gündür dokunulmadıkları;
     14 gün ve üstü koyu çubuk. */
  function PanoTez(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const l = ESP.Intellect.openArguments();
    if(!l.length) return '';
    const bugun = U.todayISO();
    const yas = a => { const g = ESP.U.gunOf(a.updatedAt || a.createdAt || ''); return g ? U.diffDays(g, bugun) : null; };
    const s = l.map(a => ({ a, g:yas(a) })).sort((x, y) => (y.g || 0) - (x.g || 0)).slice(0, 6);
    return P.izgara([P.kart({ tur:'acik-tezler', ad:yz('esp.symposium.acik-tezler'), simge:'kalem', yuva:l.length + ' açık',
      govde:P.cubuklar({ satirlar:s.map(x => ({ ad:String(x.a.thesis || 'Tez').slice(0, 60), oran:x.g == null ? null : Math.min(1, x.g / 30),
          renk:x.g != null && x.g >= 14 ? 2 : 0, metin:x.g == null ? '—' : x.g + ' gün' })) })
        + P.not('son dokunuştan bu yana · 14 gün ve üstü koyu') })], 'pk-izgara--iki');
  }

  LIFEOS.PARCA.blok({ id:'symposium.felsefe-sekmeleri', sayfa:'symposium', yer:'y1', sira:10, ad:'Felsefe sekmeleri', ciz(){
    return K.Span(12, ESP.Parts.bolumler('philo', { act:'philo-tab', aria:yz('esp.symposium.felsefe-bolumleri'), tabs:TABS,
        govde:GOVDE, sayi:{ acik:ESP.Intellect.openArguments().length || null } }));
  } });
  LIFEOS.PARCA.blok({ id:'symposium.tez-panosu', sayfa:'symposium', yer:'y2', sira:10, ad:'Tez panosu', ciz(){
    return K.Span(12, raw(PanoTez()));
  } });
  function render(){
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('symposium', 'y2', K, undefined, typeof raw === 'undefined' ? null : raw)}
      ${LIFEOS.PARCA.yer('symposium', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('philoTab', TABS[0].id); }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'belge-iste'(el){
      const k = document.getElementById('belge-' + el.dataset.alan);
      const r = await ESP.Belge.iste({ alan:el.dataset.alan, konu:k ? k.value : '' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    async 'philo-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'tab-ekle'(){ S.ui.philoTab = 'ekle'; ESP.App.render(); },

    /* Deneyi teze çevirmek: deneyin kurgusu tezin YERINE geçmez, tezi
       kullanıcı yazar. Sistem yalnızca boş tezi açar ve deneyi bağlam
       olarak taşır — cevabı uydurmak, argümanı kullanıcının elinden
       almak olurdu. */
    async 'exp-to-thesis'(el){
      const x = (ESP.EXPERIMENTS || []).filter(e => e.id === el.dataset.id)[0];
      if(!x) return;
      const a = await M.saveArgument(M.newArgument({
        thesis:'',
        objections:[{ id:U.uid('o'), text:x.setup, answered:false, answer:'' }],
        concepts:[],
      }));
      S.ui.argOpen = a.id;
      S.ui.philoTab = 'acik';
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.symposium.deney-bir-itiraz-olarak-acil'));
      ESP.App.render();
    },

    async 'parse-arg'(){
      const res = ESP.Parse.parseArgument(val('arg-text'));
      if(!res.thesis){ ESP.UI.toast(yz('esp.symposium.tez-bulunamadi')); return; }
      S.ui.argParsed = res;
      ESP.App.render();
    },

    async 'save-arg'(){
      const res = S.ui.argParsed;
      if(!res) return;
      /* Anlasilmayan cumleler ATILMAZ: destek olarak kaydedilir ve kullanici
         sonradan tasiyabilir. Sessizce dusmesi kullanicinin yazdigini sandigi
         ama sistemde olmayan bir metin demektir. */
      const destekler = (res.supports || []).concat((res.unmatched || []).map(u => u.text));
      await M.saveArgument(M.newArgument({
        thesis:res.thesis,
        supports:destekler,
        objections:(res.objections || []).map(t => ({ id:U.uid('o'), text:t, answered:false })),
        concepts:ESP.Parse.extractConcepts(res.thesis + ' ' + destekler.join(' ')).map(c => c.id),
      }));
      S.ui.argParsed = null;
      S.ui.philoTab = 'acik';
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.symposium.tez-kaydedildi'));
      ESP.App.render();
    },

    async 'save-arg-raw'(){
      const t = val('arg-text');
      if(!t){ ESP.UI.toast(yz('esp.symposium.metin-bos')); return; }
      await M.saveArgument(M.newArgument({ thesis:t,
        concepts:ESP.Parse.extractConcepts(t).map(c => c.id) }));
      S.ui.philoTab = 'acik';
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.symposium.tez-kaydedildi'));
      ESP.App.render();
    },

    async 'clear-arg'(){ S.ui.argParsed = null; ESP.App.render(); },

    async 'add-support'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      const t = val('sup-' + el.dataset.id);
      if(!a || !t) return;
      a.supports = (a.supports || []).concat([t]);
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'add-obj'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      const t = val('obj-' + el.dataset.id);
      if(!a || !t) return;
      a.objections = (a.objections || []).concat([{ id:U.uid('o'), text:t, answered:false }]);
      a.status = 'open';
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'answer-obj'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      if(!a) return;
      const o = (a.objections || []).find(x => x.id === el.dataset.obj);
      const t = val('ans-' + el.dataset.obj);
      if(!o || !t) return;
      o.answered = true; o.answer = t;
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'close-arg'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      if(!a) return;
      if(M.argumentOpen(a)){
        ESP.UI.toast(yz('esp.symposium.cevaplanmamis-itiraz-varken'));
        return;
      }
      a.status = 'closed';
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-arg'(el){
      await M.deleteArgument(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'socratic-q'(el){
      const q = ESP.SOCRATIC[Math.floor(Math.random() * ESP.SOCRATIC.length)];
      S.ui.socraticFor = el.dataset.id;
      S.ui.socraticQ = q.q;
      ESP.App.render();
    },

    /* Tezin METNI burada gider — brifingde degil.

       Fark kasitlidir: brifing her cagride otomatik gider ve icinde yalnizca
       olcum vardir. Tez metni yalnizca kullanici bu dugmeye bastiginda,
       SORUNUN icinde gider. Acikca paylasilan parca. */
    async 'ask-socrates'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      if(!a) return;
      S.ui.officeAgent = 'socrates';
      const soru = 'Tezim: «' + a.thesis + '»'
        + ((a.supports || []).length ? '\nDesteklerim: ' + a.supports.join(' · ') : '')
        + ((a.objections || []).length ? '\nİtirazlar: '
            + a.objections.map(o => o.text + (o.answered ? ' (cevapladım)' : ' (açık)')).join(' · ') : '')
        + '\nBana tek bir soru sor.';
      ESP.App.go('team');
      setTimeout(() => {
        const inp = document.getElementById('chat-input');
        if(inp){ inp.value = soru; inp.focus(); }
      }, 200);
    },

    async 'add-canon'(){
      const id = val('canon-pick');
      const c = ESP.CANON_BY_ID[id];
      if(!c) return;
      await M.saveBook(M.newBook({ title:c.title, author:c.author, kind:c.kind }));
      ESP.Memo.bitir();
      ESP.UI.toast(c.title + ' eklendi');
      ESP.App.render();
    },

    async 'add-book'(){
      const t = val('b-title'), a = val('b-author');
      if(!t){ ESP.UI.toast(yz('esp.symposium.eser-adi-gerekir')); return; }
      await M.saveBook(M.newBook({ title:t, author:a, kind:val('b-kind') || 'primary' }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-book'(el){
      await M.deleteBook(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {
    async 'exp-field'(el){ S.ui.expField = el.value; ESP.App.render(); },
  };

  return {
    id:'symposium',
    /* iPhone Faz 2d (sıkı ölçü): belge isteği, Sokratik soru kalıpları ve iki
       egzersiz kataloğu başvurudur — şerit, dokununca açılır. */
    kucukVarsayilan:['belge-iste', 'sokratik-sorular', 'düşünce-deneyleri', 'argüman-alıştırmaları'],
    title:yz('esp.symposium.sempozyum'),
    headline(){
      const acik = ESP.Intellect.openArguments();
      const tikanan = ESP.Intellect.stalledArguments();
      if(!(S.args || []).length) return 'Henüz tez yok.';
      if(tikanan.length) return tikanan.length + ' tez 14 günden uzun süredir sessiz.';
      const itiraz = acik.reduce((a, x) => a + (x.objections || []).filter(o => !o.answered).length, 0);
      if(itiraz) return itiraz + ' itiraz cevaplanmayı bekliyor.';
      return acik.length + ' tez açık.';
    },
    lede(){
      return 'Bir tez ancak cevaplanmamış itirazı kalmadığında kapanır. '
           + 'Socrates cevap yazmaz, soru sorar.';
    },
    stats(){
      const acik = ESP.Intellect.openArguments();
      const kapali = (S.args || []).filter(a => a.status === 'closed');
      const itiraz = acik.reduce((a, x) => a + (x.objections || []).filter(o => !o.answered).length, 0);
      const primer = (S.books || []).filter(b => b.kind === 'primary');
      return [
        { value:String(acik.length), label:yz('esp.symposium.acik-tez-2') },
        { value:String(itiraz), label:yz('esp.symposium.acik-itiraz') },
        { value:String(kapali.length), label:yz('esp.symposium.kapandi') },
        { value:String(primer.length), label:yz('esp.symposium.primer-metin-2') },
      ];
    },
    subtitle(){ return (S.args || []).length + ' tez'; },
    actions(){ return ''; },
    render, afterRender, handle, change,
  };
})();
