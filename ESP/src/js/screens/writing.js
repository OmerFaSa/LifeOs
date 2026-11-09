/* Yazı Laboratuvarı — taslak, ölçüm ve üslup.

   İki sekme: Taslaklar · Ölçüm.

   Montaigne yargı vermez, ÖLÇER: cümle uzunluğu, tekrar eden kelime,
   okunabilirlik. «Bu deneme yayımlanmaya hazır» demek estetik otorite
   iddiasıdır ve ESP.Office.validate bunu yakalar.

   Okunabilirlik için Ateşman formülü kullanılır. Flesch Türkçede yanlış
   sonuç verir: Türkçe sondan eklemeli bir dildir, kelime başına hece sayısı
   doğal olarak yüksektir ve Flesch her Türkçe metni «çok zor» gösterir. */
window.LIFEOS.PARCA.yazilar({
  'esp.writing.ne-yapar':'Ne yapar',
  'esp.writing.neden-ise-yarar':'Neden işe yarar',
  'esp.writing.olcum-icin-en-az-bir':'Ölçüm için en az bir tam cümle gerekir.',
  'esp.writing.son-7-gunde-yazi-oturumu':'Son 7 günde yazı oturumu girilmemiş. Taslağı açıp kapatmak üretim sayılmaz; ',
  'esp.writing.son-14-gunde-yazi-oturumu':'Son 14 günde yazı oturumu yok.',
  'esp.writing.girilmemis-gun-ortalamaya-ka':'Girilmemiş gün ortalamaya katılmaz.',
  'esp.writing.son-7-gunde-yazi-oturumu-2':'Son 7 günde yazı oturumu girilmemiş.',
  'esp.writing.son-7-gunde':'Son 7 günde ',
  'esp.writing.bir-baslik-ve-bir-paragraf':'Bir başlık ve bir paragraf yeter; ölçüm oradan başlar.',
  'esp.writing.olculen-sey-uslup-degil-uzun':'Ölçülen şey üslup değil: uzunluk, tekrar, akış.',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:70, id:'act:draft', kind:'Eylem', label:'Yeni taslak aç',
  hint:'Yazı', run:() => { ESP.S.ui.writeTab = 'taslaklar'; ESP.App.go('writing'); } });
window.LIFEOS.PARCA.yazilar({
  'esp.writing.taslaklar':'Taslaklar',
  'esp.writing.olcum':'Ölçüm',
  'esp.writing.araclar':'Araçlar',
  'esp.writing.calis':'Çalış',
  'esp.writing.taslaklarim':'Taslaklarım',
  'esp.writing.ilerleme':'İlerleme',
  'esp.writing.ilk-taslak':'İlk taslağını aç',
  'esp.writing.ilk-taslak-neden':'Bir başlık ve bir paragraf yeter.',
  'esp.writing.son-taslak':'Son taslak',
  'esp.writing.kaldigin-yer':'Kaldığın yerden sür.',
  'esp.writing.ogren':'Öğren',
  'esp.writing.yazi-ornekleri-iste':'Yazı örnekleri iste',
  'esp.writing.konu-deneme-kisa-oyku':'Konu: deneme, kısa öykü…',
  'esp.writing.yazi-konusu':'Yazı konusu',
  'esp.writing.king-e-ilet':'King’e ilet',
  'esp.writing.revizyon-gecisleri':'Revizyon geçişleri',
  'esp.writing.yapi-kaliplari':'Yapı kalıpları',
  'esp.writing.retorik-figurler':'Retorik figürler',
  'esp.writing.taslak':'Taslak',
  'esp.writing.kapat':'Kapat',
  'esp.writing.sil':'Sil',
  'esp.writing.baslik':'Başlık',
  'esp.writing.yazmaya-basla':'Yazmaya başla…',
  'esp.writing.kaydet':'Kaydet',
  'esp.writing.revizyon-olarak-kaydet':'Revizyon olarak kaydet',
  'esp.writing.bugune-oturum-yaz':'Bugüne oturum yaz',
  'esp.writing.revizyon-sayaci-uslup-olcumu':'«Revizyon» sayacı üslup ölçümüne girer: sürekli yeni taslak açıp hiçbirini revize etmemek en yaygın yazı tıkanmasıdır. Sayı bir hedef değil bir aynadır.',
  'esp.writing.okunabilirlik-atesman':'Okunabilirlik (Ateşman)',
  'esp.writing.bant-bir-not-degil-bir':'Bant bir not değil bir tarif: felsefi bir metnin «zor» olması beklenir.',
  'esp.writing.uc-kez-ve-uzeri-gecen':'Üç kez ve üzeri geçen kelimeler:',
  'esp.writing.yeni-taslak':'Yeni taslak',
  'esp.writing.kelime':'Kelime',
  'esp.writing.revizyon':'Revizyon',
  'esp.writing.ac':'Aç',
  'esp.writing.henuz-taslak-yok-bir-baslik':'Henüz taslak yok. Bir başlık ve bir paragraf yeter; ',
  'esp.writing.haftalik-uretim':'Haftalık üretim',
  'esp.writing.olcum-icin-oturum-kaydi-gere':'Ölçüm için oturum kaydı gerekir.',
  'esp.writing.son-7-gun':'Son 7 gün',
  'esp.writing.taslak-revi-zyon':'TASLAK–REVİZYON',
  'esp.writing.henuz-taslak-yok':'Henüz taslak yok.',
  'esp.writing.okunabilirlik':'Okunabilirlik',
  'esp.writing.puan':'Puan',
  'esp.writing.kelime-cumle':'Kelime/cümle',
  'esp.writing.olculecek-metin-yok':'Ölçülecek metin yok.',
  'esp.writing.not-motoruyla-yaz':'Not motoruyla yaz',
  'esp.writing.siir-olarak-yaz':'Şiir olarak yaz',
  'esp.writing.defterde-ac':'Defter’de aç',
  'esp.writing.deftere-bagli':'Bu taslak Defter’deki notuna bağlı: orada [[bağlantı]], sözlük, görsel ve şiir düzeniyle yazarsın; ölçüm oradaki metni okur.',
  'esp.writing.defter-yok':'Defter bu sayfada açılamadı.',
  'esp.writing.pratik-suresi':'Pratik süresi',
  'esp.writing.oturum-girildiginde-olculmey':'Oturum girildiğinde ölçülmeye başlar.',
  'esp.writing.son-14-gun':'Son 14 gün',
  'esp.writing.sinir':'Sınır',
  'esp.writing.konular':'Konular',
  'esp.writing.yazi-bolumleri':'Yazı bölümleri',
  'esp.writing.kaydedildi':'Kaydedildi',
  'esp.writing.revizyon-2':'Revizyon ',
  'esp.writing.yazi-oturumu':'Yazı oturumu',
  'esp.writing.sure-olcumdur-kelime-sayisi':'Süre ölçümdür; kelime sayısı metinden sayıldı.',
  'esp.writing.sure-dakika':'Süre (dakika)',
  'esp.writing.bugune-yaz':'Bugüne yaz',
  'esp.writing.vazgec':'Vazgeç',
  'esp.writing.sure-girilmedi':'Süre girilmedi',
  'esp.writing.bugune-yazildi':'Bugüne yazıldı',
  'esp.writing.yazi-laboratuvari':'Yazı Laboratuvarı',
  'esp.writing.kelime-7g':'kelime / 7g',
});
window.LIFEOS.PARCA.sayfa({ id:'writing', modul:'esp', king:{ sira:200, ad:'Yazı', es:['yazı', 'yazma', 'yazı laboratuvar'] }, cekmece:'calisma', ad:'Yazı', ikon:'quill', ek:{ disc:'writing' }, sira:60 });

ESP.Screens.writing = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'calis',     label:yz('esp.writing.calis') },
    { id:'taslaklar', label:yz('esp.writing.taslaklarim') },
    { id:'ogren',     label:yz('esp.writing.ogren') },
    { id:'olcum',     label:yz('esp.writing.ilerleme') },
  ];

  /* ---------------------------------------------------------------- araçlar

     Burada hiçbir madde «iyi yazı böyle olur» demez ve bu, ESP'nin estetik
     otorite iddia etmeme sınırının (ESP.PEDAGOGIC §aesthetic) tam kenarı.
     Hepsi ARAÇ tanımıdır: aracın ne yaptığı söylenir, kullanılıp
     kullanılmayacağı yazarındır.

     Revizyon listesi de bir kalite ölçütü değil bir GEÇİŞ listesidir:
     işaretlemek metni iyi yapmaz, hangi geçişin yapıldığını kaydeder. */
  function toolRows(){
    const K2 = ESP.C;
    return [
      /* BAM'dan yazı örnekleri (Part 8f-2): üslubu örnek gösterilen yazarlar
         ve eserleri; kaynaklı. Eserler Okuma › Kaynaklar'a «başlanmadı» girer. */
      K2.Entry({
        label:yz('esp.writing.yazi-ornekleri-iste'), hint:'belge',
        meta:'yazı · HKM',
        wide:true,
        body:html`<div class="row gap-8 wrap">
          ${K2.Input({ id:'belge-yazi', placeholder:yz('esp.writing.konu-deneme-kisa-oyku'), aria:yz('esp.writing.yazi-konusu'),
            size:'sm', class:'grow' })}
          ${K2.Button({ label:yz('esp.writing.king-e-ilet'), size:'sm', act:'belge-iste',
            data:{ 'data-alan':'yazi' } })}
        </div>`,
      }),
      K2.Entry({
        label:yz('esp.writing.revizyon-gecisleri'), hint:'revision',
        meta:ESP.REVISION_PASSES.length + ' geçiş',
        wide:true,
        body:K2.Table({ tight:true,
          headers:[{ label:'#', num:true }, 'Geçiş', 'Sorusu', 'Not'],
          rows:ESP.REVISION_PASSES.slice().sort((a, b) => a.order - b.order)
            .map(r => [String(r.order), r.label, r.ask, r.note]) }),
      }),

      K2.Entry({
        label:yz('esp.writing.yapi-kaliplari'), hint:'structure',
        meta:ESP.STRUCTURES.length + ' kalıp',
        wide:true,
        body:html`${map(ESP.STRUCTURES, st => html`
          <div class="toolrow">
            <b>${st.label}</b>
            <span class="toolrow__mid">${st.shape.join('  →  ')}</span>
            <span class="tiny dim">${st.when}</span>
          </div>`)}`,
      }),

      K2.Entry({
        label:yz('esp.writing.retorik-figurler'), hint:'rhetoric',
        meta:ESP.RHETORIC.length + ' figür',
        wide:true,
        body:K2.Table({ tight:true, headers:['Figür', yz('esp.writing.ne-yapar'), yz('esp.writing.neden-ise-yarar'), 'Örnek'],
          rows:ESP.RHETORIC.map(r => [r.label, r.what, r.why, r.ex]) }),
      }),
    ];
  }

  function acikTaslak(){
    const id = S.ui.draftOpen;
    return id ? (S.drafts || []).find(d => d.id === id) : null;
  }

  /* --------------------------------------------------------------- taslaklar */

  function draftRows(){
    const acik = acikTaslak();
    const rows = [];

    if(acik){
      /* Not motoru (2026-11-09): taslak Defter'deki bir nota bagliysa metin oradan gelir. */
      const bagli = bagliNot(acik), metin = bagli ? bagli.govde : acik.text;
      const ok = ESP.Intellect.readability(metin, acik.id + (bagli ? bagli.guncel : acik.updatedAt || ''));
      const tekrar = ESP.Intellect.repeats(metin);
      rows.push(K.Entry({
        label:yz('esp.writing.taslak'),
        meta:acik.title || 'başlıksız',
        note:ok.cert === 'missing' ? yz('esp.writing.olcum-icin-en-az-bir')
          : ok.words + ' kelime · ' + ok.sentences + ' cümle · cümle başına '
            + U.fmtNum(ok.wordsPerSentence) + ' kelime',
        action:html`${K.Button({ label:yz('esp.writing.kapat'), size:'sm', act:'close-draft' })}
          ${K.Button({ label:yz('esp.writing.sil'), size:'sm', act:'del-draft', data:{ 'data-id':acik.id } })}`,
        wide:true,
        body:html`
          ${K.Input({ id:'d-title', value:acik.title, placeholder:yz('esp.writing.baslik') })}
          ${K.Textarea({ id:'d-text', rows:14, value:metin,
            placeholder:yz('esp.writing.yazmaya-basla') })}
          <div class="row wrap mt-10">
            ${K.Button({ label:yz('esp.writing.kaydet'), tone:'primary', act:'save-draft',
              data:{ 'data-id':acik.id } })}
            ${K.Button({ label:yz('esp.writing.revizyon-olarak-kaydet'), act:'save-revision',
              data:{ 'data-id':acik.id } })}
            ${K.Button({ label:yz('esp.writing.bugune-oturum-yaz'), act:'log-writing',
              data:{ 'data-id':acik.id } })}
            ${K.Button({ label:yz(bagli ? 'esp.writing.defterde-ac' : 'esp.writing.not-motoruyla-yaz'), act:'defter-taslak',
              data:{ 'data-id':acik.id, 'data-tur':'deneme' } })}
            ${when(!bagli, () => K.Button({ label:yz('esp.writing.siir-olarak-yaz'), act:'defter-taslak',
              data:{ 'data-id':acik.id, 'data-tur':'siir' } }))}
          </div>
          ${when(bagli, () => html`<p class="small muted mt-8">${yz('esp.writing.deftere-bagli')}</p>`)}
          <p class="small muted mt-8">${yz('esp.writing.revizyon-sayaci-uslup-olcumu')}</p>

          ${when(ok.cert !== 'missing', () => html`
            <div class="mt-12">
              ${K.Meter({ label:yz('esp.writing.okunabilirlik-atesman'), value:Math.max(0, Math.min(100, ok.value)),
                text:U.fmtNum(ok.value) + ' · ' + ok.band.label })}
              <p class="small muted mt-8">${ok.band.note}
                ${yz('esp.writing.bant-bir-not-degil-bir')}</p>
            </div>`)}

          ${when(tekrar.length, () => html`
            <div class="mt-12">
              <p class="small muted">${yz('esp.writing.uc-kez-ve-uzeri-gecen')}</p>
              <div class="row wrap mt-4">
                ${map(tekrar, t => K.Chip({ label:t.word + ' · ' + t.count }))}
              </div>
            </div>`)}`,
      }));
    }

    const liste = S.drafts || [];
    rows.push(K.Entry({
      label:yz('esp.writing.taslaklar'),
      meta:liste.length + ' taslak',
      action:K.Button({ label:yz('esp.writing.yeni-taslak'), tone:'primary', size:'sm', act:'new-draft' }),
      wide:true,
      body:liste.length
        ? K.Table({ tight:true,
            headers:['Başlık', { label:yz('esp.writing.kelime'), num:true }, { label:yz('esp.writing.revizyon'), num:true },
              'Güncellendi', ''],
            rows:liste.map(d => {
              const ok = ESP.Intellect.readability(d.text, d.id + (d.updatedAt || ''));
              return [
                d.title || 'başlıksız',
                ok.cert === 'missing' ? '—' : U.fmtNum(ok.words),
                String(d.revisions || 0),
                U.fmtShort(ESP.U.gunOf((d.updatedAt || ''))),
                K.Button({ label:yz('esp.writing.ac'), size:'sm', act:'open-draft', data:{ 'data-id':d.id } }),
              ];
            }) })
        : K.Empty({ text:yz('esp.writing.henuz-taslak-yok-bir-baslik')
            + 'ölçüm oradan başlar.',
            action:K.Button({ label:yz('esp.writing.yeni-taslak'), tone:'primary', act:'new-draft' }) }),
    }));

    return rows;
  }

  /* ------------------------------------------------------------------ ölçüm */

  function measureRows(){
    const w = ESP.Intellect.wordsWritten(7);
    const r = ESP.Intellect.draftRatio();
    const h = ESP.Intellect.hoursOf('writing', 14);
    const hepsi = (S.drafts || []);
    const olculen = hepsi.map(d => ({ d, ok:ESP.Intellect.readability(d.text, d.id + (d.updatedAt || '')) }))
      .filter(x => x.ok.cert !== 'missing');

    return [
      K.Entry({
        label:yz('esp.writing.haftalik-uretim'),
        meta:w.cert === 'missing' ? 'veri yok' : U.fmtNum(w.value) + ' kelime',
        note:w.cert === 'missing'
          ? yz('esp.writing.son-7-gunde-yazi-oturumu')
            + 'oturumu Bugün ekranından ya da taslak sayfasından yazarsın.'
          : w.windowDays + ' günün ' + w.enteredDays + '\'inde yazı oturumu var.',
        body:w.cert === 'missing'
          ? K.Empty({ text:yz('esp.writing.olcum-icin-oturum-kaydi-gere') })
          : K.Meter({ label:yz('esp.writing.son-7-gun'), value:Math.min(100, w.value / 3500 * 100),
              text:U.fmtNum(w.value) + ' kelime' }),
      }),

      K.Entry({
        label:yz('esp.writing.taslak-revi-zyon'), hint:'draft-ratio',
        meta:r.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(r.value * 10) / 10) + ' / taslak',
        body:r.cert === 'missing'
          ? K.Empty({ text:yz('esp.writing.henuz-taslak-yok') })
          : html`${K.Meter({ label:r.drafts + ' taslak, ' + r.revisions + ' revizyon',
              value:Math.min(100, r.value * 50), text:U.fmtNum(Math.round(r.value * 10) / 10) })}`,
      }),

      K.Entry({
        label:yz('esp.writing.okunabilirlik'), hint:'readability',
        meta:olculen.length + ' taslak ölçüldü',
        wide:true,
        body:olculen.length
          ? K.Table({ tight:true,
              headers:['Taslak', { label:yz('esp.writing.puan'), num:true }, 'Bant',
                { label:yz('esp.writing.kelime-cumle'), num:true }, { label:'Hece/kelime', num:true }],
              rows:olculen.map(x => [
                x.d.title || 'başlıksız',
                U.fmtNum(x.ok.value),
                x.ok.band.label,
                U.fmtNum(x.ok.wordsPerSentence),
                U.fmtNum(x.ok.syllablesPerWord),
              ]) })
          : K.Empty({ text:yz('esp.writing.olculecek-metin-yok') }),
      }),

      K.Entry({
        label:yz('esp.writing.pratik-suresi'),
        meta:h.cert === 'missing' ? 'veri yok' : U.fmtMin(h.minutes),
        note:h.cert === 'missing'
          ? yz('esp.writing.son-14-gunde-yazi-oturumu')
          : h.windowDays + ' günün ' + h.enteredDays + '\'inde kayıt var. '
            + yz('esp.writing.girilmemis-gun-ortalamaya-ka'),
        body:h.cert === 'missing'
          ? K.Empty({ text:yz('esp.writing.oturum-girildiginde-olculmey') })
          : K.Meter({ label:yz('esp.writing.son-14-gun'), value:Math.min(100, h.minutes / 420 * 100),
              text:U.fmtMin(h.minutes) }),
      }),

      K.Entry({
        label:yz('esp.writing.sinir'), hint:'pedagogic',
        meta:'ne söylenmez',
        body:K.Notice({ tone:'info',
          body:'«Kusursuz», «yayımlanmaya hazır», «şaheser» gibi ifadeler estetik '
            + 'otorite iddiasıdır ve ajan çıktısında yakalanır. Ölçülebilen şey '
            + 'söylenir: uzunluk, tekrar, akış.' }),
      }),
    ];
  }

  /* Konu haritası — bu bölümde nelerin çalışılacağı.

     İşaretler beyandır ve öyle etiketlenir; hiçbir kapıyı açmaz. */
  function topicRows(){
    const ozet = ESP.Lesson.topicSummary('writing');
    return [
      K.Entry({
        label:yz('esp.writing.konular'), hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        wide:true,
        body:ESP.Parts.topics('writing'),
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  /* Sekme yok (EKIP-PLANI §1.2): bölümler alt alta, tezgâh en sonda. */
  /* Çalış: taslak yoksa ilk adım, varsa en son dokunduğun taslak. */
  function calisRows(){
    const l = S.drafts || [];
    const son = l.reduce((m, d) => (!m || (d.updatedAt || '') > (m.updatedAt || '')) ? d : m, null);
    return [].concat([ESP.Parts.simdi('writing', son
        ? { etiket:yz('esp.writing.son-taslak'), baslik:son.title || yz('esp.writing.baslik'), neden:yz('esp.writing.kaldigin-yer'),
            dugme:{ label:yz('esp.writing.ac'), act:'son-taslak', data:{ 'data-id':son.id } } }
        : { baslik:yz('esp.writing.ilk-taslak'), neden:yz('esp.writing.ilk-taslak-neden'), dugme:{ label:yz('esp.writing.yeni-taslak'), act:'new-draft' } })],
      son ? [ESP.Parts.recete('writing', { kunyesiz:true })] : [], [ESP.Parts.desk('writing')]);
  }
  const GOVDE = { calis:calisRows, taslaklar:draftRows, olcum:() => [].concat(measureRows(), [ESP.Parts.yol('writing')]),
    ogren:() => [].concat(topicRows(), toolRows()) };

  LIFEOS.PARCA.blok({ id:'writing.yazi-sekmeleri', sayfa:'writing', yer:'y1', sira:10, ad:'Yazı sekmeleri', ciz(){
    return K.Span(12, ESP.Parts.bolumler({ act:'write-tab', aria:yz('esp.writing.yazi-bolumleri'), tabs:TABS,
        govde:GOVDE, sayi:{ taslaklar:(S.drafts || []).length || null } }));
  } });
  function render(){
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('writing', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('writeTab', TABS[0].id); }

  function val(id){ const el = document.getElementById(id); return el ? el.value : ''; }
  function defter(){ const D = window.LIFEOS && window.LIFEOS.DEFTER; return D && D.kuruluMu && D.kuruluMu() ? D : null; }
  function bagliNot(d){ const D = defter(); return d && d.notId && D ? D.notlar().find(n => n.id === d.notId) || null : null; }
  /* Bagli taslak kaydedilince not da guncellenir (tek metin, iki kapi). */
  async function notaYaz(d){ const n = bagliNot(d), D = defter(); if(n && D) await D.kaydet(Object.assign({}, n, { baslik:d.title || n.baslik, govde:d.text })); }

  const handle = {
    async 'belge-iste'(el){
      const k = document.getElementById('belge-' + el.dataset.alan);
      const r = await ESP.Belge.iste({ alan:el.dataset.alan, konu:k ? k.value : '' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    async 'write-tab'(el){ K.bolumeGit(el.dataset.tab); },

    async 'new-draft'(){
      const d = await M.saveDraft(M.newDraft({ title:'', text:'' }));
      S.ui.draftOpen = d.id;
      S.ui.writeTab = 'taslaklar';
      ESP.App.render();
    },

    /* Not motoruyla yaz: taslak Defter'de deneme ya da siir notu olur (Yazilarim klasoru), sonra orada acilir. */
    async 'defter-taslak'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id), D = defter();
      if(!d) return;
      if(!D){ ESP.UI.toast(yz('esp.writing.defter-yok')); return; }
      let n = bagliNot(d);
      if(!n){
        if(document.getElementById('d-text')){ d.title = val('d-title').trim(); d.text = val('d-text'); }
        n = await D.yeni(d.title || (el.dataset.tur === 'siir' ? 'Şiir' : 'Yazı'), d.text || '', el.dataset.tur === 'siir' ? 'siir' : 'deneme', 'Yazılarım');
        d.notId = n.id;
        await M.saveDraft(d);
      }
      D.ac({ id:n.id, duzen:true });
    },

    async 'open-draft'(el){ S.ui.draftOpen = el.dataset.id; ESP.App.render(); },
    async 'son-taslak'(el){ S.ui.draftOpen = el.dataset.id; S.ui.writeTab = 'taslaklar'; ESP.App.render(); },
    async 'close-draft'(){ S.ui.draftOpen = null; ESP.App.render(); },

    async 'save-draft'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id);
      if(!d) return;
      d.title = val('d-title').trim();
      d.text = val('d-text');
      await M.saveDraft(d);
      await notaYaz(d);
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.writing.kaydedildi'));
      ESP.App.render();
    },

    async 'save-revision'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id);
      if(!d) return;
      d.title = val('d-title').trim();
      d.text = val('d-text');
      d.revisions = (d.revisions || 0) + 1;
      await M.saveDraft(d);
      await notaYaz(d);
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.writing.revizyon-2') + d.revisions + ' kaydedildi');
      ESP.App.render();
    },

    async 'log-writing'(el){
      const d = (S.drafts || []).find(x => x.id === el.dataset.id);
      if(!d) return;
      const ok = ESP.Intellect.readability(val('d-text') || d.text);
      ESP.UI.sheet({
        title:yz('esp.writing.yazi-oturumu'),
        body:String(html`
          <p class="small muted">${yz('esp.writing.sure-olcumdur-kelime-sayisi')}</p>
          <div class="cols-2 mt-10">
            ${K.Field({ label:yz('esp.writing.sure-dakika'),
              input:K.Input({ id:'wl-min', type:'number', numeric:true, min:1,
                placeholder:'40' }) })}
            ${K.Field({ label:yz('esp.writing.kelime'),
              input:K.Input({ id:'wl-words', type:'number', numeric:true,
                value:ok.cert === 'missing' ? '' : ok.words }) })}
          </div>`),
        footer:String(K.Button({ label:yz('esp.writing.bugune-yaz'), tone:'primary', act:'do-log-writing' })
          + K.Button({ label:yz('esp.writing.vazgec'), act:'sheet-close' })),
      });
    },

    async 'do-log-writing'(){
      const dk = val('wl-min').trim();
      if(!dk){ ESP.UI.toast(yz('esp.writing.sure-girilmedi')); return; }
      await M.addSession(U.todayISO(), {
        disc:'writing', minutes:dk, count:val('wl-words').trim(), note:'taslak',
      });
      ESP.Memo.bitir();
      ESP.UI.closeSheet();
      ESP.UI.toast(yz('esp.writing.bugune-yazildi'));
      ESP.App.render();
    },

    async 'del-draft'(el){
      await M.deleteDraft(el.dataset.id);
      S.ui.draftOpen = null;
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {};

  return {
    id:'writing',
    /* iPhone Faz 2d (sıkı ölçü): Ölçüm'de üç sayı açık, pratik süresi şerit;
       Araçlar'ın dördü de başvuru (şerit). Sınır kartı gizli: pedagojik
       sınır her sayfanın sonunda ve ⓘ'de (hints: pedagogic). */
    kucukVarsayilan:['uzman-masası', 'yol-haritası', 'pratik-süresi', 'yazı-örnekleri-iste', 'revizyon-geçişleri', 'yapı-kalıpları', 'retorik-figürler'],
    title:yz('esp.writing.yazi-laboratuvari'),
    headline(){
      const w = ESP.Intellect.wordsWritten(7);
      if(!(S.drafts || []).length) return yz('esp.writing.henuz-taslak-yok');
      if(w.cert === 'missing') return yz('esp.writing.son-7-gunde-yazi-oturumu-2');
      return yz('esp.writing.son-7-gunde') + U.fmtNum(w.value) + ' kelime yazıldı.';
    },
    lede(){
      const r = ESP.Intellect.draftRatio();
      if(r.cert === 'missing') return yz('esp.writing.bir-baslik-ve-bir-paragraf');
      return r.drafts + ' taslak, taslak başına '
        + U.fmtNum(Math.round(r.value * 10) / 10) + ' revizyon. '
        + yz('esp.writing.olculen-sey-uslup-degil-uzun');
    },
    stats(){
      const w = ESP.Intellect.wordsWritten(7);
      const r = ESP.Intellect.draftRatio();
      const son = (S.drafts || [])[0];
      const ok = son ? ESP.Intellect.readability(son.text, son.id + (son.updatedAt || '')) : { cert:'missing' };
      return [
        { value:String((S.drafts || []).length), label:'taslak' },
        { value:w.cert === 'missing' ? '—' : U.fmtNum(w.value), label:yz('esp.writing.kelime-7g') },
        { value:r.cert === 'missing' ? '—' : String(r.revisions), label:'revizyon' },
        { value:ok.cert === 'missing' ? '—' : U.fmtNum(ok.value), label:'okunabilirlik' },
      ];
    },
    subtitle(){ return (S.drafts || []).length + ' taslak'; },
    actions(){ return ''; },
    render, afterRender, handle, change,
  };
})();
