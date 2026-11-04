/* Danışma — bir ajana doğrudan soru sormak.

   Ajan yalnızca kendi brifingini görür ve alan dışına çıkmaz. Cevabın
   altındaki rozet cümlenin nereden geldiğini söyler: model mi, kural motoru mu.

   Model çıktısı ev kurallarına takılırsa cümle basılmaz; yerine kural
   motorunun cümlesi geçer ve neden engellendiği yazılır. */
window.LIFEOS.PARCA.yazilar({
  'spi.team.sustugunda-sira-ona-gececek':'Sustuğunda sıra ona geçecek',
  'spi.team.brifingi-okuyor-ve-cumleyi-k-2':'Brifingi okuyor ve cümleyi kuruyor',
  'spi.team.bu-tarayicida-sesli-cevap-yo':'Bu tarayıcıda sesli cevap yok. Sıra yine geçer; cevabı okursun.',
  'spi.team.cihazda-turkce-ses-bulunamad':'Cihazda Türkçe ses bulunamadı. Cevap yabancı bir sesle okunur; ',
  'spi.team.cumleleri-bagli-model-kuruyo':'Cümleleri bağlı model kuruyor; sayılar yine kural motorundan.',
  'spi.team.model-bagli-degil-cevaplar-h':'Model bağlı değil: cevaplar hazır kurallardan gelir.',
  'spi.team.alan-disinda':'Alan dışında',
  'spi.team.bu-hafta-neye-odaklanmaliyim':'Bu hafta neye odaklanmalıyım?',
  'spi.team.celiski-varsa-hangisi-onceli':'Çelişki varsa hangisi öncelikli?',
  'spi.team.butce-ile-saglik-hedefi-caki':'Bütçe ile sağlık hedefi çakışıyor mu?',
  'spi.team.hangi-olcumum-en-cok-dikkat':'Hangi ölçümüm en çok dikkat istiyor?',
  'spi.team.egilimi-kotuye-giden-bir-deg':'Eğilimi kötüye giden bir değer var mı?',
  'spi.team.hangi-paneli-yenilemeliyim':'Hangi paneli yenilemeliyim?',
  'spi.team.en-buyuk-acigim-hangisi':'En büyük açığım hangisi?',
  'spi.team.demir-emilimimi-ne-bozuyor':'Demir emilimimi ne bozuyor?',
  'spi.team.bugunku-ogunlerim-hedefi-tut':'Bugünkü öğünlerim hedefi tutturdu mu?',
  'spi.team.bugun-ne-kadar-yuklenmeliyim':'Bugün ne kadar yüklenmeliyim?',
  'spi.team.asiri-yukleniyor-muyum':'Aşırı yükleniyor muyum?',
  'spi.team.hangi-harekette-ust-basamaga':'Hangi harekette üst basamağa geçebilirim?',
  'spi.team.nereden-tasarruf-edebilirim':'Nereden tasarruf edebilirim?',
  'spi.team.sepetim-besin-ihtiyacimi-kar':'Sepetim besin ihtiyacımı karşılıyor mu?',
  'spi.team.toplu-alim-yapmali-miyim':'Toplu alım yapmalı mıyım?',
  'spi.team.geri-alinacak-bir-degisiklig':'Geri alınacak bir değişikliğin yok.',
  'spi.team.geri-aldim':'Geri aldım: ',
  'spi.team.geri-alamadim':'Geri alamadım: ',
  'spi.team.tamam-vazgectim-hicbir-sey-d':'Tamam, vazgeçtim; hiçbir şey değişmedi.',
  'spi.team.uyguladim-geri-almak-isterse':'Uyguladım. Geri almak istersen «geri al» de.',
  'spi.team.uygulayamadim':'Uygulayamadım: ',
  'spi.team.bunu-yapamadim':'Bunu yapamadım: ',
  'spi.team.yaptim':'Yaptım: ',
  'spi.team.anladigim-su':'Anladığım şu: ',
  'spi.team.onayliyor-musun-evet-de-ya':'Onaylıyor musun? «evet» de ya da aşağıdaki kartta onayla.',
  'spi.team.bir-kayit':'Bir kayıt',
  'spi.team.sunu-cozemedim':'Şunu çözemedim: «',
  'spi.team.sesli-sohbet-baslatilamadi':'Sesli sohbet başlatılamadı',
  'spi.team.geri-alindi-2':'Geri alındı',
  'spi.team.geri-alinamadi':'Geri alınamadı',
});


window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'spi', sira:90, uret(){
  return SP.AGENTS.map(a => ({ id:'agent:' + a.id, kind:'Ajan', label:a.name + ' — ' + a.role,
    hint:a.title, run:() => { SP.S.ui.officeAgent = a.id; SP.App.go('team'); } }));
} });
window.LIFEOS.PARCA.yazilar({
  'spi.team.sesli-sohbet':'Sesli sohbet',
  'spi.team.acik':'açık',
  'spi.team.kapali':'kapalı',
  'spi.team.sesli-sohbeti-baslat':'Sesli sohbeti başlat',
  'spi.team.bitir':'Bitir',
  'spi.team.kes':'Kes',
  'spi.team.bu-soru':'Bu soru',
  'spi.team.kurallara-takildi':'kurallara takıldı',
  'spi.team.baglanti-hatasi':'bağlantı hatası',
  'spi.team.brifingi-okuyor-ve-cumleyi-k':'Brifingi okuyor ve cümleyi kuruyor…',
  'spi.team.sor-ya-da-verini-soyle':'Sor ya da verini söyle…',
  'spi.team.soru-ya-da-veri-ornegin':'Soru ya da veri (örneğin: uyku 7 saat ve 45 dakika yürüdüm)',
  'spi.team.bu-uzman-neye-bakar':'Bu uzman neye bakar?',
  'spi.team.modele-ne-gider':'Modele ne gider?',
  'spi.team.uzmanin-gordugu-ozet':'Uzmanın gördüğü özet',
  'spi.team.ajan-hesap-yapmaz-butun-sayi':'Ajan hesap yapmaz: bütün sayılar bu brifingden gelir. Brifingde olmayan bir sayıyı yazamaz.',
  'spi.team.sorabileceklerin':'Sorabileceklerin',
  'spi.team.ajan-onerdi':'ajan önerdi',
  'spi.team.vazgecildi':'vazgeçildi',
  'spi.team.geri-alindi':'geri alındı',
  'spi.team.gecersizlesti':'geçersizleşti',
  'spi.team.kaydet':'Kaydet',
  'spi.team.vazgec':'Vazgeç',
  'spi.team.geri-al':'Geri al',
  'spi.team.su-an-konusmuyor':'Şu an konuşmuyor',
  'spi.team.sohbet-temizlendi':'Sohbet temizlendi',
  'spi.team.danisma':'Danışma',
});
window.LIFEOS.PARCA.sayfa({ id:'team', modul:'spi', cekmece:'ofis', ad:'Danışma', sira:20 });

SP.Screens.team = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  let busy = false;

  /* Sesli sohbetin o anki hali. Ekran bunu YENIDEN CIZMEZ, yalnizca
     panelin icini gunceller: her tur yeniden cizim yapilsa mikrofon
     dugmesi DOM'dan gider ve tarayici oturumu keser. */
  let sesli = { acik:false, durum:'kapalı', metin:'', hata:null };

  const DURUM_METNI = {
    'dinliyor':  { t:'Dinliyorum', a:yz('spi.team.sustugunda-sira-ona-gececek') },
    'düşünüyor': { t:'Düşünüyor',  a:yz('spi.team.brifingi-okuyor-ve-cumleyi-k-2') },
    'konuşuyor': { t:'Konuşuyor',  a:'Kesmek için Kes\'e bas ya da boşluk tuşu' },
    'kapalı':    { t:'Kapalı',     a:'' },
  };

  /* Sesli sohbet paneli — sohbet kartinin ustunde durur.

     Ses TANIMA olmadan bu kip hic cizilmez: olmayan bir yetenegin
     dugmesini gostermek, basip bir sey olmamasindan kotudur. */
  function voiceCard(){
    if(!SP.Talk.supported()) return '';
    const a = current();
    const d = DURUM_METNI[sesli.durum] || DURUM_METNI['kapalı'];
    const sessizCevap = !SP.Talk.sesliCevapVar();
    const yabanci = SP.Speak.supported() && !SP.Speak.hasTurkish();

    return K.Card({
      class:'sescard',
      title:yz('spi.team.sesli-sohbet'), sub:a.name + ' ile sıra sırayla',
      badge:sesli.acik ? K.Badge({ label:yz('spi.team.acik'), tone:'info' })
        : K.Badge({ label:yz('spi.team.kapali'), tone:'muted', icon:false }),
      body:html`
        <div class="ses" id="ses-panel" data-durum="${sesli.durum}">
          <div class="ses__hal">
            <span class="ses__isik" aria-hidden="true"></span>
            <div class="minw0">
              <b class="ses__t">${d.t}</b>
              <span class="ses__a">${d.a}</span>
            </div>
          </div>
          <p class="ses__metin" id="ses-metin">${sesli.metin || ''}</p>
        </div>
        ${when(sesli.hata, () => K.Notice({ tone:'warn', class:'mt-10', body:sesli.hata }))}
        ${when(!sesli.acik && sessizCevap, () => K.Notice({ tone:'info', class:'mt-10',
          body:yz('spi.team.bu-tarayicida-sesli-cevap-yo') }))}
        ${when(!sesli.acik && yabanci, () => K.Notice({ tone:'info', class:'mt-10',
          body:yz('spi.team.cihazda-turkce-ses-bulunamad')
             + 'anlaşılmazsa sesli sohbeti kapat.' }))}`,
      foot:html`
        ${when(!sesli.acik, () => K.Button({ label:yz('spi.team.sesli-sohbeti-baslat'),
          icon:'mic', act:'talk-start' }))}
        ${when(sesli.acik, () => html`
          ${K.Button({ label:yz('spi.team.bitir'), act:'talk-stop' })}
          ${K.Button({ label:yz('spi.team.kes'), act:'talk-cut',
            disabled:sesli.durum !== 'konuşuyor' })}`)}`,
    });
  }

  /* Panelin icini YERINDE gunceller. Tam cizim yapilsa mikrofon
     oturumu kopardi. */
  function panelTazele(st){
    sesli = { acik:st.acik, durum:st.durum, metin:st.metin, hata:st.hata };
    const p = document.getElementById('ses-panel');
    if(!p){ SP.App.render(); return; }
    p.setAttribute('data-durum', st.durum);
    const d = DURUM_METNI[st.durum] || DURUM_METNI['kapalı'];
    const t = p.querySelector('.ses__t'), a2 = p.querySelector('.ses__a');
    const m = document.getElementById('ses-metin');
    if(t) t.textContent = d.t;
    if(a2) a2.textContent = d.a;
    if(m) m.textContent = st.metin || '';
  }

  function current(){
    return SP.AGENT_BY_ID[S.ui.officeAgent] || SP.AGENT_BY_ID.patron;
  }

  function tabsCard(){
    return html`<div class="agenttabs">${map(SP.AGENTS, a => html`
      <button class="${cls('agenttab', a.id === S.ui.officeAgent && 'is-on')}"
        data-act="pick-agent" data-id="${a.id}" aria-pressed="${a.id === S.ui.officeAgent}">
        ${P.avatar(a.id, 'sm')}
        <span><b>${a.name}</b><span class="tiny dim"> ${a.title}</span></span>
      </button>`)}</div>`;
  }

  /* Sohbet govdesi ayri durur: sesli turda kart yeniden CIZILMEDEN
     yalnizca bu blok degistirilir (tam cizim mikrofonu koparir). */
  /* Ajan «bu benim alanimda degil» dediginde bunu SOYLEMEKLE kalmasin,
     BAGLASIN. Replik zaten sozlukte yaziliydi (agents.js → redirect)
     ama bir dugmesi yoktu: kullanici sohbeti kapatip sekme degistirip
     soruyu yeniden yazmak zorundaydi.

     Hedef, cevabin icinde gecen ajan ADINDAN bulunur — ajanin kendi
     `redirect` repligi zaten o adi tasir. Ad gecmiyorsa dugme
     cizilmez: olmayan bir devri uydurmayiz. */
  function devirHedefi(a, text){
    if(!text) return null;
    const t = String(text).toLocaleLowerCase('tr-TR');
    for(const x of SP.AGENTS){
      if(x.id === a.id || x.id === 'patron') continue;
      const ad = x.name.toLocaleLowerCase('tr-TR');
      if(t.indexOf(ad) >= 0) return x;
    }
    return null;
  }

  /* Devredilen soru, kullanicinin EN SON sordugu sorudur. */
  function sonSoru(a){
    const list = (S.officeChats[a.id] || []).filter(m => m.role === 'user');
    return list.length ? list[list.length - 1].text : '';
  }

  /* Ofis sohbeti King'in akışıyla ama sade (brand/ortak/ofissohbet.js,
     2026-10-19): ajanın cevabı düz yazı, ad satırında küçük nokta; senin
     sözün gri balon; cevabın altında kaynak ve kopyala. */
  const OS = () => (window.LIFEOS || {}).OFISSOHBET;
  function chatBody(a){
    const msgs = S.officeChats[a.id] || [];
    const bos = !msgs.length && !busy && OS();
    return html`
        <div class="chat osohbet opencere__akis" data-osohbet="${'spi:' + a.id}" aria-live="polite">
          ${when(bos, () => raw(OS().bosHtml({ ad:a.name, bos:{ alt:a.opening,
            cipler:sorular(a).map(q => ({ ad:q, act:'quick-ask', data:{ 'data-q':q } })) } })))}
          ${when(!bos && !msgs.length, () => html`<div class="msg msg--agent">
            <div class="msg__body"><p>${a.opening}</p></div>
          </div>`)}
          ${map(msgs, m => html`
            <div class="${cls('msg', m.role === 'user' ? 'msg--me' : 'msg--agent')}">
              ${when(m.role !== 'user', () => html`<div class="msg__who"><b>${a.name}</b></div>`)}
              <div class="msg__body">
                <p data-osohbet-metin>${m.text}</p>
                ${when(m.role !== 'user' && devirHedefi(a, m.text), () => {
                  const h = devirHedefi(a, m.text);
                  return html`<div class="devirdug">
                    <span class="tiny dim">${yz('spi.team.bu-soru')} ${h.name}'in alanında.</span>
                    ${K.Button({ label:h.name + '\'e geç', size:'sm', tone:'primary',
                      act:'devret', data:{ 'data-id':h.id, 'data-q':sonSoru(a) } })}
                  </div>`;
                })}
              </div>
              ${when(m.role !== 'user', () => html`<div class="osohbet__alt">
                ${P.sourceBadge(m.source)}
                ${when(m.blocked, () => K.Badge({ label:yz('spi.team.kurallara-takildi'), tone:'warn' }))}
                ${when(m.error, () => K.Badge({ label:yz('spi.team.baglanti-hatasi'), tone:'danger' }))}
                ${raw(OS() ? OS().kopyaHtml() : '')}
              </div>`)}
            </div>`)}
          ${when(busy, () => html`<div data-osohbet-bekle><div class="msg msg--agent" role="status">
            <div class="msg__who"><b>${a.name}</b></div>
            <div class="msg__body dim">${yz('spi.team.brifingi-okuyor-ve-cumleyi-k')}</div></div></div>`)}
          ${oneriBlogu()}
        </div>`;
  }

  /* King'in sohbet penceresiyle aynı yerleşim, sade (ofissohbet.js
     pencereHtml, 2026-10-19): solda Yeni sohbet ve geçmiş, başlıkta uzman
     ve kaynak, altta yuvarlak yazma kutusu. */
  function pencere(){
    const a = current();
    const G = (window.LIFEOS || {}).GECMIS;
    const hazir = SP.Office.ready(a.id);
    return OS().pencereHtml({
      anahtar:'spi:' + a.id, ad:a.name, rol:a.role,
      durum:hazir ? 'yapay zekâ' : 'hazır kurallar',
      durumNot:hazir ? yz('spi.team.cumleleri-bagli-model-kuruyo')
        : yz('spi.team.model-bagli-degil-cevaplar-h'),
      gecmisHtml:G ? G.listeHtml('spi', a.id, { ac:'gecmis-ac', sil:'gecmis-sil' }) : '',
      akisHtml:String(chatBody(a)),
      ustHtml:mentionYeri(),
      girdiHtml:String(K.Textarea({ id:'chat-text', rows:1, class:'osohbet-girdi', placeholder:yz('spi.team.sor-ya-da-verini-soyle'),
        aria:yz('spi.team.soru-ya-da-veri-ornegin'), data:{ 'data-osohbet-girdi':'1' } })),
      mikHtml:String(K.Mic({ target:'chat-text' })),
      gonderAct:'send-chat', kapali:busy,
    });
  }

  /* Geçmiş sohbetler (GPT gibi, 2026-10-18): «Yeni sohbet» açık konuşmayı
     geçmişe yazar; geçmişten açılan sohbet oradan sürer (brand/ortak/gecmis.js).
     gecmisAktif: ajan başına geçmişten açılan kaydın kimliği. */
  const gecmisAktif = {};

  function scopeCard(){
    const a = current();
    return K.Card({
      title:yz('spi.team.bu-uzman-neye-bakar'),
      body:html`
        ${K.Table({ tight:true, headers:['Alan', 'Kapsam'], rows:[
          ['Bakar', a.scope],
          ['Bakmaz', a.notScope],
          [yz('spi.team.alan-disinda'), a.redirect],
        ] })}
        ${K.Notice({ tone:'info', class:'mt-10', title:yz('spi.team.modele-ne-gider'),
          body:SP.PRIVACY.model })}`,
    });
  }

  function briefCard(){
    const a = current();
    const b = SP.Office.brief(a.id);
    return K.Collapsible({
      title:yz('spi.team.uzmanin-gordugu-ozet'), meta:'JSON', act:'toggle-brief',
      open:!!S.ui.briefOpen,
      body:html`<pre class="codeblock">${JSON.stringify(b, null, 2)}</pre>
        <p class="small muted mt-8">${yz('spi.team.ajan-hesap-yapmaz-butun-sayi')}</p>`,
    });
  }

  function sorular(a){
    return ({
      patron:[yz('spi.team.bu-hafta-neye-odaklanmaliyim'), yz('spi.team.celiski-varsa-hangisi-onceli'),
        yz('spi.team.butce-ile-saglik-hedefi-caki')],
      lab:[yz('spi.team.hangi-olcumum-en-cok-dikkat'), yz('spi.team.egilimi-kotuye-giden-bir-deg'),
        yz('spi.team.hangi-paneli-yenilemeliyim')],
      nutri:[yz('spi.team.en-buyuk-acigim-hangisi'), yz('spi.team.demir-emilimimi-ne-bozuyor'),
        yz('spi.team.bugunku-ogunlerim-hedefi-tut')],
      move:[yz('spi.team.bugun-ne-kadar-yuklenmeliyim'), yz('spi.team.asiri-yukleniyor-muyum'),
        yz('spi.team.hangi-harekette-ust-basamaga')],
      money:[yz('spi.team.nereden-tasarruf-edebilirim'), yz('spi.team.sepetim-besin-ihtiyacimi-kar'),
        yz('spi.team.toplu-alim-yapmali-miyim')],
    })[a.id] || [];
  }

  function suggestCard(){
    const qs = sorular(current());
    return K.Card({
      title:yz('spi.team.sorabileceklerin'),
      body:html`<div class="stack-xs">${map(qs, q => K.Button({ label:q, size:'sm', block:true,
        act:'quick-ask', data:{ 'data-q':q } }))}</div>`,
    });
  }

  LIFEOS.PARCA.blok({ id:'team.aciklamalar', sayfa:'team', yer:'y1', sira:10, ad:'Açıklamalar', ciz(){
    return raw(UI.rail(['office', 'grounding', 'no-model', 'privacy']));
  } });
  LIFEOS.PARCA.blok({ id:'team.voicecard', sayfa:'team', yer:'y2', sira:10, ad:'Ses', ciz(){
    return voiceCard();
  } });
  LIFEOS.PARCA.blok({ id:'team.scopecard', sayfa:'team', yer:'y2', sira:20, ad:'Kapsam', ciz(){
    return scopeCard();
  } });
  LIFEOS.PARCA.blok({ id:'team.suggestcard', sayfa:'team', yer:'y2', sira:30, ad:'Öneri', ciz(){
    return suggestCard();
  } });
  LIFEOS.PARCA.blok({ id:'team.briefcard', sayfa:'team', yer:'y2', sira:40, ad:'Özet', ciz(){
    return briefCard();
  } });
  LIFEOS.PARCA.blok({ id:'team.ajan-penceresi', sayfa:'team', yer:'y3', sira:10, ad:'Ajan penceresi', ciz(){
    return when(OS(), () => raw(pencere()));
  } });
  LIFEOS.PARCA.blok({ id:'team.tabscard', sayfa:'team', yer:'y4', sira:10, ad:'Sekmeler', ciz(){
    return tabsCard();
  } });
  async function render(){
    return String(html`
      <div class="mb-8">${LIFEOS.PARCA.yer('team', 'y4', K, undefined, typeof raw === 'undefined' ? null : raw)}</div>
      ${LIFEOS.PARCA.yer('team', 'y3', K, undefined, typeof raw === 'undefined' ? null : raw)}
      <div class="mt-16">${K.Ledger(() => LIFEOS.PARCA.liste('team', 'y2', K, undefined)
        .filter(Boolean))}</div>
      <div class="mt-24">${LIFEOS.PARCA.yer('team', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}</div>`);
  }

  /* Sohbet balonlarini yerinde tazeler. Tam cizim mikrofonu kopardigi
     icin sesli turda tam cizim kullanilamaz. */
  function sohbetTazele(){
    const kap = document.querySelector('.chat[data-osohbet]');
    if(!kap){ SP.App.render(); return; }
    kap.outerHTML = String(chatBody(current()));
    const yeni = document.querySelector('.chat[data-osohbet]');
    if(yeni) yeni.scrollTop = yeni.scrollHeight;
  }

  /* ---- oneri kutusu ------------------------------------------------

     Cumlede VERI varsa once kural motoru cozer; model hic cagrilmaz.
     «uyku 7 saat ve 45 dakika yurudum» iki oneri uretir, ikisi de
     ayri ayri onaylanir.

     Onaysiz hicbir sey yazilmaz — bkz. core/proposals.js. */
  function oneriKarti(p){
    const pv = SP.Proposals.preview(p);
    const e = SP.Proposals.eylem(p.action);
    return html`
      <div class="oneri oneri--${p.status}">
        <div class="oneri__bas">
          <b class="oneri__ne">${e ? e.label : p.action}</b>
          ${when(p.kaynak === 'model', () => K.Badge({ label:yz('spi.team.ajan-onerdi'), tone:'info' }))}
          ${when(p.status === 'applied', () => K.Badge({ label:'kaydedildi', tone:'ok' }))}
          ${when(p.status === 'rejected', () => K.Badge({ label:yz('spi.team.vazgecildi'), tone:'muted' }))}
          ${when(p.status === 'undone', () => K.Badge({ label:yz('spi.team.geri-alindi'), tone:'muted' }))}
          ${when(p.status === 'stale', () => K.Badge({ label:yz('spi.team.gecersizlesti'), tone:'warn' }))}
        </div>
        ${when(!pv.ok, () => html`<p class="oneri__hata">${pv.why}</p>`)}
        ${when(pv.ok, () => html`<div class="oneri__satirlar">
          ${map(pv.rows, r => html`<div class="oneri__satir">
            <span class="oneri__alan">${r.alan}</span>
            <span class="oneri__once">${r.once}</span>
            <span class="oneri__ok" aria-hidden="true">→</span>
            <span class="oneri__sonra">${r.sonra}</span>
          </div>`)}
        </div>`)}
        <div class="oneri__dug">
          ${when(p.status === 'pending' && pv.ok, () => html`
            ${K.Button({ label:yz('spi.team.kaydet'), size:'sm', tone:'primary',
              act:'oneri-onay', data:{ 'data-id':p.id } })}
            ${K.Button({ label:yz('spi.team.vazgec'), size:'sm', act:'oneri-ret', data:{ 'data-id':p.id } })}`)}
          ${when(p.status === 'applied', () => K.Button({ label:yz('spi.team.geri-al'), size:'sm',
            act:'oneri-geri', data:{ 'data-id':p.id } }))}
        </div>
      </div>`;
  }

  function oneriBlogu(){
    const liste = SP.Proposals.all().filter(p =>
      p.status === 'pending' || p.status === 'applied' || p.status === 'stale');
    if(!liste.length) return raw('');
    return html`<div class="oneriler">${map(liste.slice(0, 6), oneriKarti)}</div>`;
  }

  function kisaCevap(text){
    const t = String(text || '').toLocaleLowerCase('tr').replace(/[.!?,]+/g, ' ').replace(/\s+/g, ' ').trim();
    if(!t || t.length > 25) return null;
    if(/^(evet|onayla|onaylıyorum|uygula|tamam uygula|olur|tamam|tamamdır)$/.test(t)) return 'evet';
    if(/^(hayır|hayir|vazgeç|vazgec|vazgeçtim|iptal|boş ver|boşver)$/.test(t)) return 'hayir';
    if(/^(geri al|geri alsana|onu geri al|geri alır mısın|son değişikliği geri al)$/.test(t)) return 'geri';
    return null;
  }

  async function sohbeteYaz(a, soru, cevap){
    const list = S.officeChats[a.id] || (S.officeChats[a.id] = []);
    const at = new Date().toISOString();
    list.push({ role:'user', text:soru, at });
    list.push({ role:'agent', source:'rules', at, text:cevap });
    await SP.Store.set('chats/' + a.id, { agentId:a.id, messages:list });
  }

  /* Model cagrilmadan karsilanan istekler. Karsilanmadiysa false. */
  async function kisaIstek(a, t){
    const P = SP.Proposals;
    /* Hafiza komutlari («hatırla: …», «hafızam», «3 unut») HKM ve öteki
       iki uygulamayla aynıdır; cevabı kural motoru yazar. */
    if(SP.Hafizam){
      const h = await SP.Hafizam.komutIsle(t);
      if(h){ await sohbeteYaz(a, t, h.text); return true; }
    }
    /* Hedef sohbeti (core/hedefler.js): hedef cümlesi, sorulan eksiklerin
       cevabı ve tempo seçimi. Hedef değilse null döner, sıradakine geçilir. */
    if(SP.Hedefler && SP.Hedefler.sohbet){
      const hd = await SP.Hedefler.sohbet.isle(t);
      if(hd){ await sohbeteYaz(a, t, hd.text); return true; }
    }
    const kisa = kisaCevap(t);
    if(kisa === 'geri'){
      const son = P.all().filter(p => p.source === 'istek' && p.status === 'applied')
        .sort((x, y) => String(y.appliedAt || '').localeCompare(String(x.appliedAt || '')))[0];
      if(!son){ await sohbeteYaz(a, t, yz('spi.team.geri-alinacak-bir-degisiklig')); return true; }
      const u = await P.undo(son.id);
      const e = P.eylem(son.action);
      await sohbeteYaz(a, t, u.ok ? yz('spi.team.geri-aldim') + (e ? e.label : son.action) + '.' : yz('spi.team.geri-alamadim') + u.why);
      return true;
    }
    if(kisa === 'evet' || kisa === 'hayir'){
      const bek = P.pending().filter(p => p.source === 'istek');
      if(bek.length){
        if(kisa === 'hayir'){
          for(const p of bek) await P.reject(p.id);
          await sohbeteYaz(a, t, yz('spi.team.tamam-vazgectim-hicbir-sey-d'));
          return true;
        }
        let n = 0; const why = [];
        for(const p of bek){ const r = await P.approve(p.id); if(r.ok) n++; else if(r.why) why.push(r.why); }
        await sohbeteYaz(a, t, n ? yz('spi.team.uyguladim-geri-almak-isterse')
          : yz('spi.team.uygulayamadim') + (why.join(' · ') || 'istek geçersizleşmiş.'));
        return true;
      }
    }
    const b = SP.Bolum ? SP.Bolum.anla(t) : { komut:false };
    if(!b.komut){
      /* «… arastir» — is HKM'deki BAM'a gider (brand/ortak/ofis.js). */
      if(window.LIFEOS && LIFEOS.Ofis && LIFEOS.Ofis.bamIstegi(t)){
        SP.Bam = SP.Bam || LIFEOS.Ofis.bamKur({ hkm:() => SP.Beacon });
        await sohbeteYaz(a, t, (await SP.Bam.ilet(t)).metin);
        return true;
      }
      return false;
    }
    const parca = [];
    const bekleyen = [];
    for(const o of b.oneriler){
      const r = await P.talep(Object.assign({ source:'istek' }, o));
      const bl = SP.Bolum.BY_ID[o.params.bolum] || {};
      if(!r.row) parca.push(yz('spi.team.bunu-yapamadim') + (r.why || 'geçersiz'));
      else if(r.otomatik) parca.push(yz('spi.team.yaptim') + bl.ad + (o.params.acik ? ' açıldı.' : ' gizlendi.'));
      else bekleyen.push(bl.ad + (o.params.acik ? ' açılsın' : ' gizlensin'));
    }
    if(bekleyen.length){
      parca.push(yz('spi.team.anladigim-su') + bekleyen.join(' · ') + '. Verisi silinmez; istediğinde geri açılır. '
        + yz('spi.team.onayliyor-musun-evet-de-ya'));
    }
    b.sorular.forEach(s => parca.push(s.soru));
    await sohbeteYaz(a, t, parca.join('\n\n'));
    return true;
  }

  async function send(text){
    const t = String(text || '').trim();
    if(busy || !t) return;
    busy = true;
    SP.App.render();
    try{
      const a = current();

      /* 0) Kisa cevap ve bolum istegi — model gerekmez, cevabi kural
         motoru yazar. «evet» bekleyen istegi onaylar, «vazgec» reddeder,
         «geri al» son yazilani geri alir (sesli sohbette dokunmadan). */
      const cevap = await kisaIstek(a, t);
      if(cevap) return;

      /* 1) Kural motoru: cumlede veri var mi? Model gerekmez. */
      const r = SP.Proposals.fromText(t);
      const engel = r.engellenen || [];

      if(r.oneriler.length || engel.length){
        /* Kullanicinin soyledigi sohbete girer — ne dedigi kayitli kalir. */
        const list = S.officeChats[a.id] || (S.officeChats[a.id] = []);
        list.push({ role:'user', text:t, at:new Date().toISOString() });

        /* Kullanicinin KENDI cumlesi, kural motoru cozdu: kaynak 'istek'.
           Olcum yazan kayit (tek olcum, ogun, seans) otomatikMi() geregi
           onay bekler (belgeler/ekip/HATALAR.md KR-1); tahlil gibi orta kayit da. */
        let yazilan = 0, bekleyen = 0, dusen = 0;
        for(const o of r.oneriler){
          const t = await SP.Proposals.talep(Object.assign({ source:'istek' }, o));
          if(!t.row) dusen++;
          else if(t.otomatik) yazilan++;
          else bekleyen++;
        }

        const parca = [];
        if(yazilan) parca.push((yazilan === 1 ? yz('spi.team.bir-kayit') : yazilan + ' kayıt')
          + ' yazdım; yanlışsa aşağıdan geri al.');
        if(bekleyen) parca.push((bekleyen === 1 ? yz('spi.team.bir-kayit') : bekleyen + ' kayıt')
          + ' hazırladım, onayına bakıyor.');
        if(dusen) parca.push(dusen + ' kaydı uygulayamadım.');
        if(r.anlasilmayan.length) parca.push(yz('spi.team.sunu-cozemedim') + r.anlasilmayan.join('», «') + '».');
        /* Ölçüm olmayan cümle yazılmaz, nedeni söylenir (belgeler/ekip/HATALAR.md KR-1). */
        engel.forEach(e => parca.push(e.soru));
        list.push({ role:'agent', source:'rules', at:new Date().toISOString(),
          text:parca.join(' ') });
        await SP.Store.set('chats/' + a.id, { agentId:a.id, messages:list });
        return;
      }

      /* 2) Veri yok: normal sohbet. */
      await SP.Office.send(a.id, t);
    }finally{
      busy = false;
      SP.App.render();
    }
  }

  /* 134 AJAN SEÇİCİ: «@» ile başlayınca ajanlar rolüyle listelenir. */
  function mentionYeri(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.mentionKur) return '';
    V.mentionKur({ girdi:'chat-text', kutu:'chat-mention', act:'pick-agent', alan:'data-id',
      ajanlar:() => SP.AGENTS.map(a => ({ id:a.id, ad:a.name, harf:a.initial || a.name.charAt(0), rol:a.role, modul:'spi', sistem:'SPİ' })) });
    return '<div id="chat-mention" class="team-mention"></div>';
  }

  const handle = {
    async 'pick-agent'(el){
      /* Ajan degisirse sesli oturum biter: Kerem'e baslayip Nesrin'den
         cevap almak sohbeti degil karisikligi buyutur. */
      if(SP.Talk.isActive()) SP.Talk.stop();
      S.ui.officeAgent = el.dataset.id;
      SP.App.render();
    },

    async 'talk-start'(){
      const r = SP.Talk.start(current().id, {
        onChange:panelTazele,
        /* Her tur bittiginde sohbet listesi buyudu: kartin icini
           tazele ama mikrofon oturumunu koparma. */
        onTurn(){ sohbetTazele(); },
      });
      if(!r.ok){ UI.toast(r.message || yz('spi.team.sesli-sohbet-baslatilamadi')); return; }
      sesli.acik = true;
      SP.App.render();
    },
    async 'talk-stop'(){ SP.Talk.stop(); sesli.acik = false; SP.App.render(); },
    async 'talk-cut'(){ if(!SP.Talk.kes()) UI.toast(yz('spi.team.su-an-konusmuyor')); },

    async 'toggle-brief'(){ S.ui.briefOpen = !S.ui.briefOpen; SP.App.render(); },
    async 'send-chat'(){
      const el = document.getElementById('chat-text');
      if(!el) return;
      const text = el.value;
      el.value = '';
      await send(text);
    },
    async 'quick-ask'(el){ await send(el.dataset.q); },

    async 'oneri-onay'(el){
      const r = await SP.Proposals.approve(el.dataset.id);
      UI.toast(r.ok ? 'Kaydedildi' : (r.why || 'Kaydedilemedi'));
      SP.App.render();
    },
    async 'oneri-ret'(el){
      await SP.Proposals.reject(el.dataset.id);
      SP.App.render();
    },
    async 'oneri-geri'(el){
      const r = await SP.Proposals.undo(el.dataset.id);
      UI.toast(r.ok ? yz('spi.team.geri-alindi-2') : (r.why || yz('spi.team.geri-alinamadi')));
      SP.App.render();
    },

    /* Devir: hedef ajana gec ve AYNI soruyu ona sor. Kullanici soruyu
       ikinci kez yazmaz — devrin sonu bu. */
    async devret(el){
      if(SP.Talk.isActive()) SP.Talk.stop();
      const hedef = el.dataset.id, soru = el.dataset.q || '';
      S.ui.officeAgent = hedef;
      SP.App.render();
      if(soru) await send(soru);
    },
    /* Geçmiş sohbetler (brand/ortak/gecmis.js; 2026-10-18, «GPT gibi»). */
    async 'sohbet-yeni'(){
      const G = (window.LIFEOS || {}).GECMIS, id = current().id;
      if(G) G.arsivle('spi', id, (S.officeChats[current().id] || []), gecmisAktif[id]);
      gecmisAktif[id] = null;
      await SP.Office.clearChat(id);
      SP.App.render();
    },
    async 'gecmis-ac'(el){
      const G = (window.LIFEOS || {}).GECMIS, id = current().id;
      if(!G) return;
      G.arsivle('spi', id, (S.officeChats[current().id] || []), gecmisAktif[id]);
      const k = G.al('spi', id, el.dataset.id);
      if(!k) return;
      await SP.Office.setChat(id, k.mesajlar);
      gecmisAktif[id] = k.id;
      SP.App.render();
    },
    'gecmis-sil'(el){
      const G = (window.LIFEOS || {}).GECMIS;
      if(G) G.sil('spi', current().id, el.dataset.id);
      SP.App.render();
    },
    async 'clear-chat'(){
      await SP.Office.clearChat(current().id);
      UI.toast(yz('spi.team.sohbet-temizlendi'));
      SP.App.render();
    },
  };

  function onKey(e){
    /* Boşluk tuşuyla ajanın sözünü anında kes (barge-in): metin yazmıyorken */
    if(e.key === ' ' && sesli.acik && sesli.durum === 'konuşuyor'){
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if(tag !== 'INPUT' && tag !== 'TEXTAREA'){
        e.preventDefault();
        SP.Talk.kes();
        return;
      }
    }
    if(e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
    const el = document.getElementById('chat-text');
    if(el && document.activeElement === el){
      e.preventDefault();
      handle['send-chat']();
    }
  }

  return {
    id:'team',
    /* iPhone Faz 4: açık sohbet ve ajanın kartı; ajanın tanıtımı, örnek sorular ve brifing şerit. */
    kucukVarsayilan:['bu-uzman-neye-bakar', 'sorabileceklerin', 'uzmanın-gördüğü-özet'],
    title:yz('spi.team.danisma'),
    subtitle(){
      const a = current();
      return a.name + ' · ' + a.title;
    },
    actions(){ return ''; },
    render, handle, onKey,
  };
})();
