/* Rehber ve ayarlar.

   Dört sekme: kullanım, model ayarları, veri (yedek) ve sınırlar.
   Sınırlar sekmesi süs değildir: sistemin ne yapmayacağı, verinin nereye
   gittiği ve kırmızı bayrak protokolü orada açıkça yazar. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.guide = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'kullanim', label:'Kullanım', icon:'guide' },
    { id:'model',    label:'Model',    icon:'zap' },
    { id:'veri',     label:'Veri',     icon:'layers' },
    { id:'sinir',    label:'Sınırlar', icon:'shield' },
  ];

  /* ------------------------------------------------------------ kullanim */

  function howCard(){
    const rows = [
      ['Öğün girmek', 'Besin → Öğünler sayfasında tek satır yaz: «1 tabak etli kuru fasulye, 1 bardak ayran». '
        + 'Ev ölçüsü tanınır ve gramaj tahmin olarak işaretlenir.'],
      ['Test girmek', 'Testler → Rapor yapıştır ya da Test gir. Laboratuvar metnini olduğu gibi yapıştır; '
        + 'eşleşen değerler listelenir, eşleşmeyen satırlar da gösterilir.'],
      ['Günlük ölçüm', 'Günlük ölçüm ekranında uyku, nabız ve hissettiğin hâl. '
        + 'Hepsi zorunlu değil: eksik girdi sıfır sayılmaz.'],
      ['Antrenman', 'Hareket bölümü kardiyo, kuvvet, esneklik ve dinlenme sayfalarına ayrılır; Bugün sayfası günün yük emrini verir. Emri toparlanma belirler, istek değil.'],
      ['Bütçe', 'Finans → Sepet sayfasına haftalık alışverişi gir; Bütçe sayfası koçların talebini toplar. Fiyatı kendi fişinden düzeltince '
        + 'hesap tahminden ölçüme geçer.'],
      ['Ofis', 'Beş ajan kendi alanına bakar. Danışma ekranından birine doğrudan soru sorabilirsin.'],
    ];
    return K.Card({ title:'Nasıl kullanılır', body:K.Table({ tight:true,
      headers:['İş', 'Yol'], rows:rows.map(r => [html`<b>${r[0]}</b>`, html`<span class="small">${r[1]}</span>`]) }) });
  }

  function moduleCard(){
    return K.Card({
      title:'Beş modül',
      body:html`<div class="list">${map(SP.AGENTS, a => html`
        <div class="listitem">
          ${P.avatar(a.id, 'sm')}
          <div class="grow">
            <b class="small">${a.title} — ${a.name}</b>
            <div class="tiny dim">${a.scope}</div>
            <div class="tiny dim">Bakmaz: ${a.notScope}</div>
          </div>
        </div>`)}</div>`,
    });
  }

  function precedenceCard(){
    return K.Card({
      title:'Öncelik sırası', hint:'office',
      sub:'Üstteki alttakini her zaman yener',
      body:K.Table({ tight:true, headers:['Sıra', 'Kural', 'Neden'],
        rows:SP.PRECEDENCE.map(p => [String(p.rank), html`<b>${p.label}</b>`,
          html`<span class="small">${p.note}</span>`]) }),
    });
  }

  /* --------------------------------------------------------------- model */

  function modelCard(){
    const s = SP.Office.settings();
    const provider = SP.PROVIDERS[s.provider];
    const models = provider ? provider.models : [];
    return K.Card({
      title:'Model ayarları', hint:'no-model',
      sub:'Ofis modelsiz de çalışır',
      badge:SP.LLM.ready({ provider:s.provider, model:s.model })
        ? K.Badge({ label:'hazır', tone:'ok' }) : K.Badge({ label:'kapalı', tone:'muted' }),
      body:html`
        ${K.Notice({ tone:'info', body:SP.GROUNDING.noModel + ' ' + SP.GROUNDING.authority })}
        <div class="grid-form mt-12">
          ${K.Field({ label:'Sağlayıcı',
            input:K.Select({ id:'m-provider', value:s.provider, change:'pick-provider',
              options:Object.keys(SP.PROVIDERS).map(id => ({ value:id, label:SP.PROVIDERS[id].label })) }) })}
          ${K.Field({ label:'Model',
            input:K.Select({ id:'m-model', value:s.model,
              options:models.map(m => ({ value:m.id, label:m.label })) }) })}
        </div>
        ${when(provider && provider.note, () => html`<p class="small muted mt-8">${provider.note}</p>`)}
        <div class="mt-12">${K.Field({ label:'Küçük kayıtlar sormadan yazılsın mı?',
          hint:'Küçük: tek ölçüm, bir öğün, bir seans. Tahlil değerleri her zaman önce sorulur.',
          input:K.Select({ id:'m-otomatik', value:s.otomatikUygula || 'istek', change:'pick-otomatik',
            options:[
              { value:'istek', label:'Yalnız benim yazdıklarım (önerilir)' },
              { value:'hepsi', label:'Modelin okuduğu küçük kayıtlar da' },
              { value:'hicbiri', label:'Hiçbiri — her şeyi önce sor' },
            ] }) })}</div>
        ${when(provider && provider.needsKey, () => html`<div class="mt-12">
          ${K.Field({ label:'API anahtarı', hint:provider.keyHint || '',
            input:K.Input({ id:'m-key', type:'password',
              placeholder:SP.LLM.getKeys(provider.id).length
                ? SP.LLM.maskKeys(provider.id).join(', ') : 'anahtar yapıştır' }) })}
          <p class="small muted mt-4">Anahtar yalnızca bu tarayıcıda, uygulama verisinden ayrı bir
            anahtarda durur. Yedeğe girmez, buluta gitmez, modele gönderilmez.</p>
        </div>`)}`,
      foot:html`${K.Button({ label:'Kaydet', size:'sm', tone:'primary', act:'save-model' })}
        ${K.Button({ label:'Bağlantıyı dene', size:'sm', act:'test-model' })}`,
    });
  }

  /* Bolumler — kullanilmayan alani gizle; verisi silinmez (core/bolum.js). */
  function bolumCard(){
    if(!SP.Bolum) return null;
    return K.Card({
      title:'Bölümler', sub:'Kullanmadığın alanı gizle; verisi silinmez',
      body:html`
        <div class="stack-xs">${map(SP.Bolum.liste(), b => html`
          <label class="${b.acik ? 'check is-done' : 'check'}">
            <input type="checkbox" ${b.acik ? raw('checked') : ''} data-act="bolum-toggle" data-id="${b.id}"/>
            <span>${b.ad}${b.acik ? '' : ' — gizli'}</span>
          </label>`)}</div>
        <p class="tiny dim mt-8">Günlük, Testler, Ofis, Hane ve Rehber gizlenemez.
          Danışma’da da söyleyebilirsin: «finans bölümünü kapat».</p>`,
    });
  }

  function hafizaCard(){
    if(!SP.Hafizam) return null;
    const H = window.LIFEOS.Hafiza;
    const l = SP.Hafizam.etkin();
    return K.Card({
      title:'Hafızam', sub:'Ofisin senin hakkında hatırladıkları — bu cihazda; HKM bağlıysa King de görür',
      body:html`
        ${when(!l.length, () => html`<p class="small dim">Henüz bir şey yok. Aşağıya yaz ya da
          Danışma’da «hatırla: laktoz bana dokunuyor» de.</p>`)}
        <div class="stack-xs">${map(l, x => html`
          <div class="row gap-8" style="justify-content:space-between;align-items:flex-start">
            <span class="small"><span class="tiny dim">${H.KATMANLAR[x.katman].ad}</span><br/>${x.metin}</span>
            ${K.Button({ label:'Unut', size:'sm', tone:'ghost', act:'hafiza-unut', data:{ 'data-id':x.id } })}
          </div>`)}</div>
        <div class="row gap-8 mt-10">
          ${K.Input({ id:'hafiza-yeni', class:'grow', aria:'Hatırlanacak şey',
            placeholder:'Örn. Akşam 8’den sonra yemem' })}
          ${K.Button({ label:'Hatırla', size:'sm', tone:'primary', act:'hafiza-ekle' })}
        </div>
        <p class="tiny dim mt-8">Model hafızaya yazamaz: «senin sözün»ü yalnız sen yazarsın,
          «tahmin» etiketli kayıtlar kural motorundan gelir ve silinebilir.</p>`,
    });
  }

  function quotaCard(){
    const s = SP.Office.settings();
    const st = SP.Quota.status({ provider:s.provider, model:s.model });
    if(!st) return null;
    return K.Card({
      title:'Kullanım hakkı',
      body:html`
        ${when(!st.known, () => K.Notice({ tone:'info',
          body:'Bu sağlayıcı/model için tanımlı bir kullanım sınırı yok. '
             + 'Bilinmeyen sınır, sınırsız demek değildir: sistem yalnızca '
             + 'kendi saydığı çağrıyı bilir.' }))}
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Son dakikada', st.lastMinute == null ? '—' : String(st.lastMinute)],
          ['Bugün kullanılan', String(st.usedToday)],
          ['Bugün kalan', !st.known ? 'bilinmiyor'
            : st.remainingToday == null ? 'sınırsız' : String(st.remainingToday)],
        ] })}`,
      foot:html`<span class="small dim">Ofis günde bir brifing, toplantı başına beş çağrı harcar.</span>`,
    });
  }

  /* ---------------------------------------------------------------- veri */


  /* ------------------------------------------------------- dokuz aylık ufuk

     "Depo %80 dolu" tek basina ise yaramaz: ne zaman dolacagini ve NEYIN
     sisdigini soylemez, ikisi bambaska kararlar gerektirir. Buyume hizi
     her acilistaki bir olcumden HESAPLANIR; iki olcumden az varsa hiz
     bilinmiyordur ve bilinmeyen hiz sifir hiz degildir. */
  function storageHorizonCard(){
    const dp = SP.Storage;
    const hukum = dp.verdict();
    const buyume = dp.growth();
    const ufuk = dp.horizon();
    const dagilim = dp.breakdown();
    const budanabilir = dp.prunable();

    return K.Card({
      title:'Dokuz aylık ufuk', hint:'storage', sub:hukum.title,
      body:html`
        ${K.Notice({ tone:hukum.level === 'full' ? 'danger'
          : (hukum.level === 'near' || hukum.level === 'watch') ? 'warn' : 'ok',
          title:hukum.title, body:hukum.note })}

        ${K.Table({ tight:true, headers:['Ölçüm', 'Değer'], rows:[
          ['Şu anki boyut', dp.fmtBytes(buyume.bytes)],
          ['Günlük büyüme', buyume.perDay == null ? 'veri yok'
            : dp.fmtBytes(buyume.perDay) + '/gün'],
          ['Ölçüm günü', String(buyume.samples)
            + (buyume.cert === 'measured' ? ' (ölçüldü)'
              : buyume.cert === 'estimated' ? ' (tahmin)' : '')],
          ['Dolmaya kalan', buyume.daysLeft == null ? '—' : buyume.daysLeft + ' gün'],
          ['270 gün sonra', ufuk.cert === 'missing' ? 'veri yok'
            : dp.fmtBytes(ufuk.projected) + (ufuk.willFit ? ' (sığar)' : ' (sığmaz)')],
        ] })}

        <div class="mt-12">${K.SectionTitle('Ne büyüyor')}</div>
        ${K.Table({ tight:true,
          headers:['Kayıt', { label:'Boyut', num:true }, { label:'Adet', num:true }, 'Tür'],
          rows:dagilim.slice(0, 10).map(r => [r.label, dp.fmtBytes(r.bytes),
            String(r.count), r.content ? 'içerik' : (r.prunable ? 'budanabilir' : 'sistem')]) })}

        ${when(budanabilir.length, () => html`
          <div class="mt-12">${K.SectionTitle('Yer aç')}</div>
          <p class="tiny dim">Yalnızca sistemin kendi ürettiği kayıtlar listelenir.
            Girdiğin hiçbir veri burada yer almaz — hiçbir koşulda.</p>
          ${map(budanabilir, b => html`
            <label class="row wrap gap-8 mt-8">
              <input type="checkbox" data-prune="${b.collection}"/>
              <span><b>${b.label}</b> — ${dp.fmtBytes(b.bytes)}
                <span class="tiny dim">${b.note}</span></span>
            </label>`)}
          ${K.Button({ label:'Seçilenleri buda', tone:'danger', size:'sm',
            act:'prune-storage', class:'mt-10' })}`)}`,
    });
  }

  /* -------------------------------------------------------- HKM isareti

     Dorduncu katman ISTEGE BAGLIDIR ve varsayilan olarak KAPALIDIR.
     Saglik verisinin en kucuk kumesi bile bir sorumluluktur: bu yuzden
     kart, acik olsun olmasin, gidecek gövdenin TAMAMINI satir satir
     gosterir. Tahlil degeri, ilac adi, semptom ve ogun GITMEZ. */
  function hkmCard(){
    if(!SP.Beacon) return '';
    const a = SP.Beacon.settings();
    const on = SP.Beacon.preview();
    const durum = a.lastAt
      ? (a.lastStatus === 202 ? 'Son gönderim başarılı' : 'Son deneme başarısız')
        + ' — ' + String(a.lastAt).slice(0, 16).replace('T', ' ') + '. '
        + (a.lastNote || '')
      : 'Henüz hiç gönderilmedi.';
    return K.Card({
      title:'HKM işareti', hint:'hkm',
      sub:'İsteğe bağlı dördüncü katmana günün özeti',
      badge:a.enabled ? K.Badge({ label:'açık', tone:'ok' })
        : K.Badge({ label:'kapalı', tone:'warn' }),
      body:html`
        ${K.Notice({ tone:'info', body:'SPİ, HKM\'nin var olduğunu bilmez. '
          + 'İşaret tek yönlüdür, hiçbir çizimde çalışmaz ve hiçbir kaydı '
          + 'bekletmez: HKM kapalıyken SPİ olduğu gibi çalışır.' })}

        <div class="mt-12">
          ${K.Checkbox({ label:'İşareti aç (varsayılan kapalı)',
            checked:!!a.enabled, act:'hkm-toggle' })}
        </div>

        <div class="mt-12">
          ${K.Field({ label:'HKM adresi',
            input:K.Input({ id:'sp-hkm-url', value:a.url, change:'hkm-url',
              placeholder:'http://127.0.0.1:4200', aria:'HKM adresi' }) })}
          ${K.Field({ label:'Yerel jeton', hint:'config.json → local_token',
            input:K.Input({ id:'sp-hkm-token', type:'password', value:a.token,
              change:'hkm-token', aria:'HKM jetonu' }) })}
          ${K.Field({ label:'En sık kaç dakikada bir',
            input:K.Input({ id:'sp-hkm-int', type:'number', min:'15', step:'5',
              value:a.intervalMinutes, change:'hkm-interval',
              aria:'Gönderim aralığı' }) })}
        </div>

        ${when(!SP.Beacon.urlOk(a.url), () => K.Notice({ tone:'warn', class:'mt-10',
          body:'Bu adrese gönderim yapılmaz: yerel olmayan bir adrese düz http '
             + 'ile giderken jeton ağda açık gider. https ya da 127.0.0.1 gerekir.' }))}

        <div class="mt-12">
          ${K.Field({ label:'Kapsam', hint:'ne kadarı gönderilsin',
            input:K.Select({ id:'sp-hkm-level', value:SP.Beacon.levelOf(),
              change:'hkm-level', aria:'Gönderim kapsamı',
              options:SP.Beacon.LEVELS.map(l => ({ value:l.id, label:l.label })) }) })}
          <p class="tiny dim">${(SP.Beacon.LEVELS.find(l => l.id === SP.Beacon.levelOf()) || {}).note}
            Gelişmiş kapsamda bile tahlil değeri, ilaç adı ve semptomun kendisi
            GİTMEZ — semptom yalnızca sayı olarak gider.</p>
        </div>

        <div class="mt-12">${K.SectionTitle('Bugün ne gidiyor')}</div>
        ${K.Table({ tight:true, headers:['Alan', { label:'Değer', num:true }, 'Kaynak'],
          rows:on.rows.map(r => [r.key,
            r.value == null ? '—' : U.fmtNum(r.value),
            /* KAYNAK SÜTUNU — etiketin görseliyle birlikte.
               Metin `window.LIFEOS.KESINLIK`ten gelir, bu ekran
               kendi karşılığını YAZMAZ: aynı `measured` üç arayüzde
               aynı kelimeyi göstermek zorunda. */
            raw(window.LIFEOS.KESINLIK_HTML(r.cert))]) })}
        <p class="tiny dim mt-8">Tahlil değeri, ilaç adı, semptom ve öğün GİTMEZ.
          Giden şey yük kararını etkileyen dört sayıdır; değeri olmayan alan
          «veri yok» gider, sıfır değil. Klinik sınır burada da geçerlidir.</p>

        ${when(on.errors.length, () => K.Notice({ tone:'warn', class:'mt-10',
          body:'Gövde sözleşmeyi geçmiyor: ' + on.errors[0] + '. Bu hâliyle gönderilmez.' }))}

        <p class="tiny dim mt-10">«Bağlan», jetonu HKM'den doğrudan alır:
          önce HKM yüzünde «Cihazları bağla» de, sonra iki dakika içinde
          buraya bas. Jetonu elle yazmak da çalışır.</p>
        <p class="tiny dim mt-10">${durum}</p>`,
      foot:html`${K.Button({ label:'Bağlan', size:'sm', tone:'primary',
          act:'hkm-pair' })}
        ${K.Button({ label:'Şimdi gönder', size:'sm', act:'hkm-send' })}
        ${K.Button({ label:'Geçmişi gönder (60 gün)', size:'sm', act:'hkm-backfill' })}`,
    });
  }

  function dataCard(){
    const f = M.dataFootprint();
    const age = M.backupAgeDays();
    const undo = SP.Store.importUndoInfo();
    return K.Card({
      title:'Veri ve yedek', hint:'backup',
      badge:M.backupDue() ? K.Badge({ label:'yedek gerekiyor', tone:'warn' })
        : K.Badge({ label:'yedek güncel', tone:'ok' }),
      body:html`
        ${K.Table({ tight:true, headers:['Kayıt', { label:'Adet', num:true }], rows:[
          ['Tahlil oturumu', String(f.labs)],
          ['Ölçüm günü', String(f.vitalDays)],
          ['Öğün günü', String(f.mealDays)],
          ['Antrenman', String(f.workouts)],
          ['Kapladığı alan', U.fmtNum(Math.round(f.bytes / 1024)) + ' KB · %' + f.pct],
        ] })}
        ${when(f.near, () => K.Notice({ tone:'warn', class:'mt-10',
          body:'Tarayıcı depolama alanının %' + f.pct + '\'i dolu. Yedek al ve eski kayıtları temizle.' }))}
        ${K.Notice({ tone:'info', class:'mt-10',
          body:age == null ? 'Henüz yedek alınmadı.' : 'Son yedek ' + age + ' gün önce.' })}
        ${when(undo, () => K.Notice({ tone:'warn', class:'mt-10',
          body:new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki yedekten yükleme mevcut '
             + 'verinin üzerine yazdı. Yanlışsa bir önceki duruma dönebilirsin — bu imkan yalnız '
             + 'bu içe aktarma için geçerli.' }))}`,
      foot:html`${K.Button({ label:'Yedek indir', size:'sm', tone:'primary', act:'backup' })}
        ${K.Button({ label:'Yedek yükle', size:'sm', act:'restore' })}
        ${when((SP.Beacon && SP.Beacon.settings().enabled), () => K.Button({ label:'HKM’deki yedekten yükle', size:'sm', act:'restore-hkm' }))}
        ${when(undo, () => K.Button({ label:'İçe aktarmayı geri al', size:'sm', tone:'danger', act:'undo-import' }))}
        ${K.Button({ label:'Bütün veriyi sil', size:'sm', tone:'danger', act:'wipe' })}`,
    });
  }

  /* TELEFONDAN SAĞLIK VERİSİ (Y5, core/saglikice.js). iPhone'un dışa
     aktarması (export.zip / export.xml) ya da Android uygulamalarının CSV'si
     okunur; önce önizlenir, onayla yazılır, «Geri al» kalır. Senin girdiğin
     değer ezilmez. */
  function saglikCard(){
    return K.Card({
      title:'Telefondan sağlık verisi', hint:'backup',
      body:html`<p class="small muted">iPhone: Sağlık › profil › «Tüm sağlık verilerini dışa
        aktar» ile gelen export.zip. Android: Health Connect verisini dışa aktaran bir uygulamanın
        CSV’si (tarih, ölçü, değer). Alınanlar: uyku, kilo, istirahat nabzı, tansiyon, oksijen, bel,
        yağ oranı, su. Önce ne yazılacağını görürsün; senin girdiğin değer ezilmez.</p>`,
      foot:K.Button({ label:'Dosya seç ve önizle', size:'sm', tone:'primary', act:'saglik-ac' }),
    });
  }

  let saglikDosya = null, saglikOnizleme = null;

  function saglikOnizlemeBody(o){
    return String(K.Stack([
      K.Table({ tight:true, headers:['Ölçü', { label:'Yeni gün', num:true }, { label:'Dolu gün', num:true }, 'Aralık'],
        rows:o.alanlar.map(a => [a.ad, String(a.yeni), String(a.cakisma), a.bas + ' → ' + a.bit]) }),
      when(o.cakisma.length, () => K.Notice({ tone:'info', title:'Senin değerin kalır:',
        body:o.cakisma.slice(0, 5).map(c => c.gun + ' ' + SP.SaglikIce.AD[c.alan] + ': sende ' + c.mevcut
          + ', dosyada ' + c.gelen).join(' · ') + (o.cakisma.length > 5 ? ' …' : '') })),
      when(o.aralikDisi, () => K.Notice({ tone:'warn', body:o.aralikDisi + ' günlük değer olası aralığın '
        + 'dışında olduğu için alınmadı.' })),
      when(o.alinmayan.length, () => K.Notice({ tone:'info', title:'Alınmayanlar:',
        body:o.alinmayan.map(x => x.ad + ' (' + x.adet + ' kayıt)').join(' · ') })),
      html`<p class="small muted">${o.satir} kayıt okundu. Yazılacak: ${o.yaz.length} ölçüm.
        İçe aktarılan değer «ölçüldü» sayılır (cihazın ölçümü).</p>`,
    ]));
  }

  function storageCard(){
    const h = SP.Store.health();
    return K.Card({
      title:'Kayıt durumu',
      body:K.Table({ tight:true, headers:['Alan', 'Durum'], rows:[
        ['Kip', h.mode === 'cloud' ? 'hesaba bağlı kopya açık' : 'bu cihaz'],
        ['Bu cihaz', h.local === 'ok' ? K.Badge({ label:'çalışıyor', tone:'ok' })
          : K.Badge({ label:'hata', tone:'danger' })],
        ['Bulut', h.cloud === 'ok' ? K.Badge({ label:'çalışıyor', tone:'ok' })
          : h.cloud === 'off' ? K.Badge({ label:'kapalı', tone:'muted' })
          : K.Badge({ label:'hata', tone:'danger' })],
        ['Profil anahtarı', M.activeProfileId()],
      ] }),
    });
  }


  /* ------------------------------------------------------------- kanit

     Sistemin en sert cumlesi ("hekime basvur") en zayif dayanaktan
     cikamaz. Bu kart, o kuralin KENDI KARNESIDIR: kac esik kaynak
     tasiyor, kaci yonlendirebiliyor, hangileri hala bos. Bosluklari
     gostermek, onlari gizlemekten her zaman iyidir. */
  function evidenceCard(){
    const k = SP.Ev.coverage();
    const denetim = SP.Ev.audit();
    const ayrisan = SP.Ev.disputed();

    return K.Entry({
      label:'Eşiklerin dayanağı', hint:'evidence',
      meta:'%' + k.pct + ' kaynaklı',
      body:html`
        <p class="small muted">Deterministik olmak, bilimsel olarak doğru olmak
          değildir. Bir eşik kodda ne kadar kesin yazılırsa yazılsın, eşiğin
          kendisi yanlış seçilmişse sistem çok güvenilir görünen yanlış bir
          sonuç üretir. Bu yüzden her eşik kendi kaynağını taşır ve kaynağının
          derecesi, o eşiğin ne kadar güçlü konuşabileceğini belirler.</p>

        ${K.Notice({ tone:'warn', title:'Bu bir kanıt hiyerarşisi değildir',
          body:SP.Ev.policy().disclaimer })}

        ${K.Table({ tight:true, headers:['Kaynak türü', 'SPİ\'nin tanıdığı yetki'],
          rows:SP.EVIDENCE_SOURCES.map(src => {
            const y = SP.AUTHORITY_BY_ID[SP.Ev.policy().defaults[src.id]];
            return [src.label, y.label + ' — ' + y.note];
          }) })}

        <p class="tiny dim mt-8">Politika sürümü ${SP.Ev.policy().version}
          (${SP.Ev.policy().changedAt}). ${SP.Ev.policy().rationale}</p>

        ${K.Table({ tight:true, headers:['Ölçüm', { label:'Sayı', num:true }], rows:[
          ['Tanımlı eşik', String(k.total)],
          ['Kaynağı yazılmış', String(k.sourced)],
          ['Yönlendirmeye yetkili', String(k.mayDirect)],
          ['Kaynağı eksik', String(k.missing.length)],
        ] })}

        ${denetim.length
          ? K.Notice({ tone:'danger', title:'Dayanaksız kırmızı bayrak',
              body:denetim.map(d => d.name).join(', ') })
          : K.Notice({ tone:'ok', title:'Denetim temiz',
              body:'Her kırmızı bayrak en az uzlaşı derecesinde bir dayanağa '
                 + 'oturuyor. Bu denetim testte de koşar; bozulursa test kırılır.' })}

        ${when(ayrisan.length, () => K.Notice({ tone:'info',
          title:'Kılavuzların ayrıştığı eşikler',
          body:ayrisan.length + ' eşikte kaynaklar tek bir sayıda birleşmiyor '
             + 'ya da eşik popülasyona göre kayıyor. Ayrışma gizlenmez: '
             + 'ölçümün kendi sayfasında hangi kaynağa dayandığı yazar.' }))}

        ${when(k.missing.length, () => html`
          <p class="tiny dim mt-8">Kaynağı yazılmamış eşikler:
            ${k.missing.slice(0, 12).map(m => m.name).join(', ')}${k.missing.length > 12 ? '…' : ''}.
            Bu eşikler yönlendirme üretmez.</p>`)}`,
    });
  }

  /* -------------------------------------------------------------- sinirlar */

  function clinicalCard(){
    return K.Card({
      title:'Klinik sınır',
      body:html`
        ${K.Notice({ tone:'warn', body:SP.CLINICAL.disclaimer })}
        <h3 class="section-h mt-12">Sistemin asla yapmayacağı şeyler</h3>
        <div class="list">${map(SP.CLINICAL.never, n => html`
          <div class="listitem"><div class="grow"><b class="small">${n.label}</b>
            <div class="tiny dim">${n.note}</div></div></div>`)}</div>
        <p class="small muted mt-10">${SP.CLINICAL.supplement}</p>`,
    });
  }

  function redFlagCard(){
    return K.Card({
      title:'Kırmızı bayrak protokolü', hint:'red-flag',
      body:html`
        <p class="small">${SP.RED_FLAGS.lead}</p>
        <h3 class="section-h mt-12">Birden fazla ölçümle tetiklenen örüntüler</h3>
        ${K.Table({ tight:true, headers:['Örüntü', 'Ne demek'],
          rows:SP.RED_FLAGS.patterns.map(p => [html`<b>${p.label}</b>`,
            html`<span class="small">${p.detail}</span>`]) })}
        <p class="small muted mt-10">Tek ölçümle tetiklenen eşikler her biyobelirtecin kendi
          tanımındadır ve Testler bölümünde görülebilir. Bayrak
          ${SP.RED_FLAGS.window} gün açık kalır; kapansa da kayıtta durur.</p>`,
    });
  }

  function privacyCard(){
    return K.Card({
      title:'Veri mahremiyeti', hint:'privacy',
      body:K.Table({ tight:true, headers:['Alan', 'Kural'], rows:[
        ['Saklama', SP.PRIVACY.storage],
        ['Model eğitimi', SP.PRIVACY.training],
        ['Modele giden', SP.PRIVACY.model],
        ['Yedek dosyası', SP.PRIVACY.export],
      ] }),
    });
  }

  function groundingCard(){
    return K.Card({
      title:'Halüsinasyon engeli', hint:'grounding',
      body:html`
        ${K.Table({ tight:true, headers:['Alan', 'Kural'], rows:[
          ['Otorite', SP.GROUNDING.authority],
          ['Karar', SP.GROUNDING.decision],
          ['Kaynak', SP.GROUNDING.sources],
          ['Model yoksa', SP.GROUNDING.noModel],
        ] })}
        <h3 class="section-h mt-12">Çıktı denetimi</h3>
        <p class="small muted">Model çıktısı basılmadan önce aşağıdaki desenlere karşı denetlenir.
          Bir ihlal bulunursa çıktı basılmaz; yerine kural motorunun cümlesi geçer.</p>
        ${K.Table({ tight:true, headers:['Denetim', 'Ne arar'],
          rows:SP.GROUNDING.banned.map(b => [html`<b>${b.why}</b>`,
            html`<code class="tiny">${String(b.re)}</code>`]) })}`,
    });
  }

  /* --------------------------------------------------------------- ekran */

  /* SEVİYE SEKMESİ BURADAN KALKTI.

     Rehber, sistemin nasıl çalıştığını anlatan yerdir; seviye ise
     bakılacak bir yerdir. Aynı defteri iki ayrı sekmede göstermek
     «hangisi gerçek» sorusunu doğuruyordu. Artık kendi bölümü var:
     üst gezinmede «Rütbe» (screens/rutbe.js) — kademe, merdiven,
     XP kaynakları ve defter orada. */

  async function render(){
    const tab = S.ui.guideTab;
    const head = html`<div class="mb-8">${K.Subtabs({ items:TABS, value:tab,
      act:'guide-tab', aria:'Rehber görünümü' })}</div>`;

    if(tab === 'model'){
      return String(html`${head}
        ${K.Ledger(() => [modelCard(), bolumCard(), hafizaCard(), quotaCard()])}
        <div class="mt-24">${raw(UI.rail(['no-model', 'grounding', 'privacy']))}</div>`);
    }
    if(tab === 'veri'){
      return String(html`${head}
        ${K.Ledger(() => [dataCard(), saglikCard(), storageHorizonCard(), storageCard(), hkmCard()])}
        <div class="mt-24">${raw(UI.rail(['backup', 'privacy', 'profiles']))}</div>`);
    }
    if(tab === 'sinir'){
      return String(html`${head}
        ${K.Ledger(() => [clinicalCard(), redFlagCard(), evidenceCard(), privacyCard(), groundingCard()])}
        <div class="mt-24">${raw(UI.rail(['red-flag', 'grounding', 'privacy', 'certainty']))}</div>`);
    }
    return String(html`${head}
      ${K.Ledger(() => [howCard(), moduleCard(), precedenceCard(),
        K.Entry({ label:'Asgari gün', hint:'minimum-day', meta:'kötü günün alt sınırı',
          body:html`<ul class="bullets small muted">
            <li>${SP.MINIMUM_DAY.protein}</li><li>${SP.MINIMUM_DAY.water}</li>
            <li>${SP.MINIMUM_DAY.move}</li><li>${SP.MINIMUM_DAY.sleep}</li></ul>` }),
      ])}
      <div class="mt-24">${raw(UI.rail(['minimum-day', 'next-action', 'certainty']))}</div>`);
  }

  const handle = {
    async 'saglik-ac'(){
      saglikDosya = null; saglikOnizleme = null;
      UI.sheet({ title:'Telefondan sağlık verisi', subtitle:'önce önizleme, sonra onay', wide:true,
        body:String(K.Stack([
          K.Drop({ act:'saglik-dosya', label:'export.zip, export.xml ya da CSV', icon:'upload',
            accept:'.zip,.xml,.csv,.txt' }),
          html`<div id="saglik-ad" class="small dim"></div>`,
          K.Field({ label:'Ne kadar geriye', input:K.Select({ id:'saglik-gun', value:'90',
            options:[{ value:'30', label:'Son 30 gün' }, { value:'90', label:'Son 90 gün' },
              { value:'365', label:'Son 1 yıl' }] }) }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Oku', tone:'primary', act:'saglik-oku' })}`) });
    },

    async 'saglik-oku'(){
      if(!saglikDosya){ UI.toast('Önce bir dosya seç'); return; }
      const g = document.getElementById('saglik-gun');
      const o = await UI.withBusy('Dosya okunuyor', 'büyük dosyada bir dakika sürebilir',
        () => SP.SaglikIce.dosyadanOku(saglikDosya, { gun:Number(g ? g.value : 90) || 90 }));
      if(!o.ok && !(o.alanlar || []).length){ UI.toast(o.why); return; }
      saglikOnizleme = o;
      UI.sheet({ title:'İçe aktarma önizlemesi', subtitle:saglikDosya.name, wide:true,
        body:saglikOnizlemeBody(o),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${when(o.yaz.length, () => K.Button({ label:'Yaz (' + o.yaz.length + ' ölçüm)', tone:'primary',
            act:'saglik-yaz' }))}`) });
    },

    async 'saglik-yaz'(){
      if(!saglikOnizleme) return;
      const r = await SP.SaglikIce.uygula(saglikOnizleme);
      saglikOnizleme = null;
      UI.closeSheet();
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast(r.note, { undo:async () => { await SP.SaglikIce.geriAl(r.id); SP.App.render(); } });
      SP.App.render();
    },
    /* Ayarlardan elle acip kapatmak da oneri kutusundan gecer ki Danisma'da
       «geri al» ile geri alinabilsin. Kutuyu isaretleyen kullanicidir:
       onay burada verilmis sayilir. */
    async 'hafiza-ekle'(){
      const el = document.getElementById('hafiza-yeni');
      const r = await SP.Hafizam.ekle(el ? el.value : '', { katman:'soz', kaynak:'kullanici' });
      UI.toast(r.ok ? 'Hatırlıyorum' : r.why);
      if(r.ok) SP.App.render();
    },
    async 'hafiza-unut'(el){
      const r = await SP.Hafizam.unut(el.dataset.id);
      UI.toast(r.ok ? 'Unuttum' : r.why);
      SP.App.render();
    },
    async 'bolum-toggle'(el){
      const id = el.dataset.id;
      const acik = SP.Bolum.gizli(id) ? 1 : 0;
      const t = await SP.Proposals.talep({ action:'bolum-ac-kapa', source:'istek', params:{ bolum:id, acik } });
      let ok = !!(t.row && t.otomatik);
      if(t.row && !t.otomatik){ const r = await SP.Proposals.approve(t.row.id); ok = !!r.ok; }
      const ad = (SP.Bolum.BY_ID[id] || {}).ad || id;
      UI.toast(ok ? ad + (acik ? ' açıldı' : ' gizlendi — verisi duruyor') : (t.why || 'Değiştirilemedi'));
      SP.App.render();
    },
    async 'hkm-toggle'(){
      const a = SP.Beacon.settings();
      await SP.Beacon.save({ enabled:!a.enabled });
      UI.toast(!a.enabled ? 'HKM işareti açıldı' : 'HKM işareti kapatıldı');
      SP.App.render();
    },
    async 'hkm-pair'(){
      const el = document.getElementById('sp-hkm-url');
      const r = await SP.Beacon.pair(el ? el.value.trim() : null);
      UI.toast(r.note);
      SP.App.render();
    },
    async 'hkm-backfill'(){
      UI.toast('Geçmiş gönderiliyor…');
      const r = await SP.Beacon.backfill(60);
      UI.toast(r.ok ? r.sent + ' gün gönderildi (' + r.empty + ' gün ölçümsüz)'
        : 'Gönderilemedi (' + (r.reason || r.status) + ')');
      SP.App.render();
    },
    async 'hkm-send'(){
      const r = await SP.Beacon.send({ force:true });
      UI.toast(r.ok ? 'Gönderildi' : (r.note || 'Gönderilemedi'));
      SP.App.render();
    },

    /* Budama. Motor kullanicinin girdigi veriyi reddeder; ekran da
       yalnizca izinli olanlari sunar. */
    async 'prune-storage'(){
      const secili = Array.prototype.slice
        .call(document.querySelectorAll('[data-prune]'))
        .filter(el => el.checked).map(el => el.dataset.prune);
      if(!secili.length){ UI.toast('Önce budanacak kaydı seç.'); return; }
      const r = await SP.Storage.prune(secili);
      if(!r.ok){ UI.toast(r.error); return; }
      UI.toast(SP.Storage.fmtBytes(r.freed) + ' yer açıldı.');
      SP.App.render();
    },

    async 'guide-tab'(el){ S.ui.guideTab = el.dataset.tab; SP.App.render(); },
    async 'save-model'(){
      const provider = (document.getElementById('m-provider') || {}).value;
      const model = (document.getElementById('m-model') || {}).value;
      const key = (document.getElementById('m-key') || {}).value;
      if(key && key.trim()) SP.LLM.addKey(provider, key.trim());
      await SP.Office.saveSettings({ provider, model });
      UI.toast('Kaydedildi');
      SP.App.render();
    },
    async 'test-model'(){
      const s = SP.Office.settings();
      UI.toast('Deneniyor…');
      try{
        const res = await SP.LLM.test({ provider:s.provider, model:s.model });
        UI.toast(res && res.ok !== false ? 'Bağlantı çalışıyor' : 'Bağlantı kurulamadı');
      }catch(e){
        UI.toast('Hata: ' + (SP.LLM.errorText ? SP.LLM.errorText(e) : String(e && e.message || e)));
      }
      SP.App.render();
    },
    async backup(){
      const data = SP.Store.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'spi-yedek-' + U.todayISO() + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      await M.markBackup();
      UI.toast('Yedek indirildi');
      SP.App.render();
    },
    /* Yeni cihaza taşıma (fikir 54): HKM'deki en yeni yedek çekilir,
       okuma denetiminden geçer, onayla uygulanır; «İçe aktarmayı geri al»
       geri dönüş noktasıdır (büyük aksiyon, AGENTS §1.9). */
    async 'restore-hkm'(){
      const r = await LIFEOS.YedekAg.hkmdenCek({ hkm:() => SP.Beacon, modul:'spi' });
      if(!r.ok){ UI.toast(r.why, { life:5000 }); return; }
      const c = SP.Store.readBackup(r.obj);
      if(!c.ok){ UI.toast(c.error || 'Geçersiz yedek'); return; }
      UI.confirmSheet('HKM’deki yedek yüklensin mi?',
        r.tarihYazi + ' tarihli yedek' + (r.boyut ? ' (' + r.boyut + ')' : '') + ' bu cihazdaki verinin '
          + 'TAMAMINI değiştirir. Yanlışsa «İçe aktarmayı geri al» ile bir önceki duruma dönebilirsin.',
        async () => {
          try{
            await SP.Store.importAll(r.obj);
            UI.toast('HKM yedeği yüklendi — sayfa yenileniyor');
            setTimeout(() => location.reload(), 900);
          }catch(e){
            UI.toast('Yükleme başarısız: ' + (e && e.message ? e.message : 'bilinmeyen hata'));
          }
        }, true);
    },
    async restore(){
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if(!file) return;
        try{
          const text = await file.text();
          const meta = await SP.Store.importAll(JSON.parse(text));
          if(meta.partialCloud){
            UI.toast('Yedek bu cihaza yüklendi ama ' + meta.cloudFailed
              + ' kayıt buluta yazılamadı — sayfa yenileniyor');
          }else{
            UI.toast('Yedek yüklendi (şema ' + meta.schemaVersion + ') — sayfa yenileniyor');
          }
          setTimeout(() => location.reload(), 900);
        }catch(e){
          /* Yerel yazma basarisizsa sayfa YENILENMEZ. */
          UI.toast(e && e.message ? e.message : 'Yedek okunamadı');
        }
      };
      input.click();
    },
    async 'undo-import'(){
      const undo = SP.Store.importUndoInfo();
      if(!undo){ UI.toast('Geri alınacak bir içe aktarma yok'); return; }
      UI.confirmSheet('İçe aktarmayı geri al',
        new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki içe aktarma öncesine dönülecek. '
          + 'Aradan geçen sürede eklediğin her şey kaybolur.',
        async () => {
          try{
            await SP.Store.undoImport();
            UI.closeSheet();
            UI.toast('Geri alındı — yeniden başlatılıyor');
            setTimeout(() => location.reload(), 900);
          }catch(e){
            UI.toast('Geri alınamadı: '+(e.message || 'bilinmeyen hata'));
          }
        }, true);
    },
    async wipe(){
      UI.confirmSheet('Bütün veriyi sil',
        'Bu profildeki tahliller, ölçümler, öğünler ve antrenmanlar silinir. '
        + 'Geri alınamaz. Önce yedek al.',
        async () => {
          await SP.Store.clear();
          UI.closeSheet();
          location.reload();
        }, true);
    },
  };

  const change = {
    async 'saglik-dosya'(el){
      saglikDosya = (el.files && el.files[0]) || null;
      const g = document.getElementById('saglik-ad');
      if(g) g.textContent = saglikDosya ? saglikDosya.name : '';
    },
    async 'hkm-url'(el){ await SP.Beacon.save({ url:el.value.trim() }); SP.App.render(); },
    async 'hkm-token'(el){ await SP.Beacon.save({ token:el.value.trim() }); },
    async 'hkm-interval'(el){
      const n = Math.max(SP.Beacon.ASGARI_ARA_DK, Number(el.value) || 60);
      await SP.Beacon.save({ intervalMinutes:n });
    },
    async 'hkm-level'(el){ await SP.Beacon.save({ level:el.value }); SP.App.render(); },
    async 'pick-otomatik'(el){
      const v = SP.Proposals.MODLAR.indexOf(el.value) >= 0 ? el.value : 'istek';
      await SP.Office.saveSettings({ otomatikUygula:v });
      SP.UI.toast(v === 'hicbiri' ? 'Her kayıt önce sorulacak'
        : v === 'hepsi' ? 'Modelin okuduğu küçük kayıtlar da sormadan yazılacak'
        : 'Yalnız senin yazdığın küçük kayıtlar sormadan yazılacak');
    },

    async 'pick-provider'(el){
      const p = SP.PROVIDERS[el.value];
      const first = p && p.models && p.models[0] ? p.models[0].id : '';
      await SP.Office.saveSettings({ provider:el.value, model:first });
      SP.App.render();
    },
  };

  return {
    id:'guide',
    title:'Rehber',
    subtitle(){
      const s = SP.Office.settings();
      return SP.LLM.ready({ provider:s.provider, model:s.model })
        ? 'Model açık · ' + (SP.PROVIDERS[s.provider] || {}).label
        : 'Model kapalı · kural motoru çalışıyor';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
