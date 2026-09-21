/* Profil — kişi, odak, görünüm ve veri.

   Burada sorulan her alanın karşılığı vardır ve karşılığı yazar. Sorulmayan
   şey de kasıtlıdır: yaş, cinsiyet, kilo. Hiçbir hesap bunlara dayanmaz —
   retansiyon, temiz BPM ve okunabilirlik kişisel ölçüden bağımsızdır.

   Profil geçişi sayfayı yeniden yükler: yarım kalmış bir yazma işleminin
   yanlış profile düşmesi böylece imkânsızdır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.profile = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  function render(){
    const p = S.profile || {};
    const ayak = M.dataFootprint();
    const yedek = M.backupAgeDays();
    const profiller = M.profileList();

    return K.Grid(html`
      ${K.Span(12, K.Ledger(() => [

        K.Entry({
          label:'KİŞİ',
          meta:p.name || 'adsız',
          note:'Ad yalnızca sana seslenmek için tutulur ve hiçbir modele gönderilmez.',
          body:html`
            <div class="cols-3">
              ${K.Field({ label:'Ad',
                input:K.Input({ id:'pf-name', value:p.name || '' }) })}
              ${K.Field({ label:'Odak', hint:'eşit skorlu iki iş çıkarsa sırayı belirler',
                input:K.Select({ id:'pf-focus', value:p.focus || 'balanced',
                  options:ESP.FOCUS.map(f => ({ value:f.id, label:f.label })) }) })}
              ${K.Field({ label:'Enstrüman',
                input:K.Input({ id:'pf-instrument', value:p.instrument || '' }) })}
            </div>
            <div class="cols-2 mt-10">
              ${K.Field({ label:'Çalışılan dil',
                input:K.Select({ id:'pf-lang', value:(p.langs && p.langs[0]) || 'en',
                  options:ESP.LANGS.map(l => ({ value:l.id, label:l.label })) }) })}
              ${K.Field({ label:'Günlük pratik tabanı (dakika)',
                hint:'hedef değil ölçüt',
                input:K.Input({ id:'pf-minutes', type:'number', numeric:true, min:10, max:600,
                  value:p.dailyMinutes || 60 }) })}
            </div>
            ${K.Button({ label:'Kaydet', tone:'primary', act:'save-profile', class:'mt-10' })}
            <p class="small muted mt-10">
              ${(ESP.FOCUS.find(f => f.id === (p.focus || 'balanced')) || {}).note || ''}</p>`,
        }),

        K.Entry({
          label:'BÖLÜMLER', hint:'modules',
          meta:ESP.Mod.count() + '/' + ESP.DISCIPLINES.length + ' açık',
          note:'Kapattığın bölüm gezinmeden kalkar, reçeteye ve denge hesabına '
             + 'girmez, ofiste masası kapanır. Verisi SİLİNMEZ: geri açtığında '
             + 'kartların, notların ve kademen olduğu yerde durur.',
          wide:true,
          body:html`
            <div class="picks picks--disc">${map(ESP.DISCIPLINES, d => K.PickCard({
              /* DİSİPLİNİN AMBLEMİ — kimlikten türer (brand/ortak/simge.js).
                 Yedi kart yan yana yedi kutuydu; hangisinin hangi alan
                 olduğu yalnız yazıdan okunuyordu. Amblem kartı bir
                 saniyede bulunur hâle getiriyor.

                 Müziğin amblemi HENÜZ YOK: teslimatta altı disiplin geldi,
                 katalogda yedi var. Simge boş döner, yazı kalır. */
              label:raw(window.LIFEOS.SIMGELI('disiplin', d.id, d.label)),
              on:ESP.Mod.isOn(d.id),
              meta:d.covers + ' · ' + (ESP.Mod.footprint(d.id) || '')
                + (ESP.Mod.isOn(d.id) ? '' : ' · KAPALI'),
              act:'toggle-mod', data:{ 'data-id':d.id } }))}</div>
            <p class="small muted mt-10">En az bir bölüm açık kalmak zorunda:
              hepsi kapalı bir ESP, açılış ekranından ibaret bir kabuktur.</p>`,
        }),

        /* GÖRÜNÜM — üç hata birden buradaydı ve üçü de sessizdi:

           1. Seçenekler `x.label` okuyordu; palet ve düzen verisinde o alan
              `name`. Etiket undefined kalınca Select nesnenin kendisini
              yazıyor, ekranda «[object Object]» görünüyordu.
           2. Ekran `prefs.theme/palette/design` yazıyordu; kabuk ise
              `profile`'dan okuyor. Yani buradan yapılan hiçbir görünüm
              değişikliği UYGULANMIYORDU.
           3. İki ayrı yer, iki ayrı doğru: üst çubuktaki palet düğmesi
              profile yazıyor, bu ekran prefs'e. Aynı ayarın iki kaydı,
              hangisinin doğru olduğu sorusunu doğuruyor.

           Tek kaynak: `profile`. Bu ekran üst çubuğun kullandığı EYLEMLERİ
           çağırır — ayrı bir yol açmaz. */
        K.Entry({
          label:'GÖRÜNÜM',
          meta:(ESP.PALETTES.filter(x => x.id === ((p.palette) || ESP.DEFAULT_PALETTE))[0]
            || {}).name || 'Kâğıt',
          note:'Aynı üç tercih üst çubuktaki palet düğmesinden de açılır ve '
             + 'ikisi aynı kaydı kullanır. Palet rengi, düzen iskeleti '
             + 'değiştirir; durum renkleri ikisinden de etkilenmez.',
          wide:true,
          body:html`
            ${K.SectionTitle('Tema')}
            <div class="picks picks--disc">${map([
                { id:'system', label:'Sistem', note:'Cihazın ayarına uyar' },
                { id:'light', label:'Açık', note:'Her zaman açık' },
                { id:'dark', label:'Koyu', note:'Her zaman koyu' }],
              x => K.PickCard({ label:x.label, meta:x.note,
                on:(p.theme || 'system') === x.id,
                act:'set-theme', data:{ 'data-theme':x.id } }))}</div>
            <div class="mt-10">
              ${K.SectionTitle('Palet')}
              <div class="picks picks--disc">${map(ESP.PALETTES, x => K.PickCard({
                label:x.name, meta:x.note,
                on:(p.palette || ESP.DEFAULT_PALETTE) === x.id,
                act:'set-palette', data:{ 'data-palette':x.id } }))}</div>
            </div>
            <div class="mt-10">
              ${K.SectionTitle('Düzen')}
              <div class="picks picks--disc">${map(ESP.DESIGNS, x => K.PickCard({
                label:x.name, meta:x.note,
                on:(p.design || 'defter') === x.id,
                act:'set-design', data:{ 'data-design':x.id } }))}</div>
            </div>`,
        }),

        K.Entry({
          label:'PROFİLLER',
          meta:profiller.length + ' profil',
          note:'Her profil kendi depo anahtarında yaşar (esp.v1.<profil>). '
             + 'Profil geçişi sayfayı yeniden yükler.',
          body:html`
            ${K.Table({ tight:true, headers:['Profil', 'Durum', ''],
              rows:profiller.map(x => [
                x.name || x.id,
                x.id === M.activeProfileId() ? 'açık' : '—',
                html`${when(x.id !== M.activeProfileId(), () => html`
                  ${K.Button({ label:'Geç', size:'sm', act:'switch-profile',
                    data:{ 'data-id':x.id } })}
                  ${K.Button({ label:'Sil', size:'sm', act:'remove-profile',
                    data:{ 'data-id':x.id } })}`)}`,
              ]) })}
            <div class="row mt-10">
              ${K.Input({ id:'pf-new', placeholder:'Yeni profil adı',
                aria:'Yeni profil adı' })}
              ${K.Button({ label:'Ekle', act:'add-profile' })}
            </div>`,
        }),

        K.Entry({
          label:'MODEL',
          meta:ESP.Office.ready('patron') ? 'bağlı' : 'bağlı değil',
          note:'Model bir iyileştirmedir, gereklilik değil: kapalıyken ofis '
             + 'kural motorunun cümlesiyle çalışmaya devam eder.',
          action:K.Button({ label:'Rehberde ayarla', size:'sm', act:'go',
            data:{ 'data-route':'guide' } }),
          body:K.Notice({ tone:'info',
            body:'API anahtarı yalnızca tarayıcıda, uygulama verisinden ayrı bir '
              + 'anahtarda durur. Yedeğe girmez, buluta gitmez, modele gönderilmez.' }),
        }),

        K.Entry({
          label:'VERİ',
          meta:ayak.bytes ? Math.round(ayak.bytes / 1024) + ' KB' : '—',
          note:yedek == null ? 'Henüz yedek alınmadı.'
            : yedek + ' gün önce yedeklendi.',
          body:html`
            ${ayak.pct != null
              ? K.Meter({ label:'Yerel kota', value:ayak.pct, text:'%' + ayak.pct,
                  tone:ayak.full ? 'danger' : (ayak.near ? 'warn' : null),
                  note:ayak.limit
                    ? Math.round(ayak.bytes / 1024) + ' KB / '
                      + Math.round(ayak.limit / 1024) + ' KB'
                    : null })
              : K.Notice({ tone:'info',
                  body:'Yerel kota bu tarayıcıda ölçülemiyor. Ölçülemeyen bir '
                    + 'oran yüzde olarak gösterilmez.' })}
            <div class="row wrap mt-10">
              ${K.Button({ label:'Yedek indir', act:'export-data' })}
              ${K.Button({ label:'Yedekten yükle', act:'import-data' })}
            </div>
            ${when(M.backupDue(), () => K.Notice({ tone:'warn',
              body:'Yedek otuz günden eski. Veri bu cihazda tutuluyor; '
                + 'cihaz kaybolursa veri de kaybolur.' }))}`,
        }),

        /* HKM isareti — dorduncu katman ISTEGE BAGLI ve varsayilan KAPALI.
           Ne gonderildigi acik olsun olmasin satir satir gosterilir:
           gormeden acilan bir gonderim, onay degildir. */
        hkmEntry(),

        K.Entry({
          label:'SINIR', hint:'pedagogic',
          meta:'değişmez',
          body:html`
            ${K.Notice({ tone:'info', body:ESP.PEDAGOGIC.disclaimer })}
            <p class="small muted mt-8">${ESP.PEDAGOGIC.level}</p>`,
        }),

      ]))}`);
  }

  function hkmEntry(){
    if(!ESP.Beacon) return '';
    const a = ESP.Beacon.settings();
    const on = ESP.Beacon.preview();
    const durum = a.lastAt
      ? (a.lastStatus === 202 ? 'Son gönderim başarılı' : 'Son deneme başarısız')
        + ' — ' + String(a.lastAt).slice(0, 16).replace('T', ' ') + '. '
        + (a.lastNote || '')
      : 'Henüz hiç gönderilmedi.';
    return K.Entry({
      label:'HKM İŞARETİ', hint:'hkm',
      meta:a.enabled ? 'açık' : 'kapalı',
      note:'ESP, HKM\'nin var olduğunu bilmez. İşaret tek yönlüdür, hiçbir '
         + 'çizimde çalışmaz ve hiçbir kaydı bekletmez: HKM kapalıyken ESP '
         + 'olduğu gibi çalışır.',
      wide:true,
      body:html`
        ${K.Checkbox({ label:'İşareti aç (varsayılan kapalı)',
          checked:!!a.enabled, act:'hkm-toggle' })}

        <div class="cols-3 mt-12">
          ${K.Field({ label:'HKM adresi',
            input:K.Input({ id:'hkm-url', value:a.url, change:'hkm-url',
              placeholder:'http://127.0.0.1:4200', aria:'HKM adresi' }) })}
          ${K.Field({ label:'Yerel jeton', hint:'config.json → local_token',
            input:K.Input({ id:'hkm-token', type:'password', value:a.token,
              change:'hkm-token', aria:'HKM jetonu' }) })}
          ${K.Field({ label:'En sık kaç dakikada bir',
            input:K.Input({ id:'hkm-int', type:'number', min:'15', step:'5',
              value:a.intervalMinutes, change:'hkm-interval',
              aria:'Gönderim aralığı' }) })}
        </div>

        ${when(!ESP.Beacon.urlOk(a.url), () => K.Notice({ tone:'warn',
          body:'Bu adrese gönderim yapılmaz: yerel olmayan bir adrese düz http '
             + 'ile giderken jeton ağda açık gider. https ya da 127.0.0.1 gerekir.' }))}

        <div class="mt-12">
          ${K.Field({ label:'Kapsam', hint:'ne kadarı gönderilsin',
            input:K.Select({ id:'hkm-level', value:ESP.Beacon.levelOf(),
              change:'hkm-level', aria:'Gönderim kapsamı',
              options:ESP.Beacon.LEVELS.map(l => ({ value:l.id, label:l.label })) }) })}
          <p class="small muted">${(ESP.Beacon.LEVELS.find(l => l.id === ESP.Beacon.levelOf()) || {}).note}</p>
        </div>

        <div class="mt-12">
          <span class="mono-label">Bugün ne gidiyor</span>
          ${K.Table({ tight:true, headers:['Alan', { label:'Değer', num:true }, 'Kaynak'],
              rows:on.rows.map(r => [r.key,
              r.value == null ? '—' : U.fmtNum(r.value),
              /* KAYNAK SÜTUNU — etiketin görseliyle birlikte.
                 Metin `window.LIFEOS.KESINLIK`ten gelir, bu ekran
                 kendi karşılığını YAZMAZ: aynı `measured` üç arayüzde
                 aynı kelimeyi göstermek zorunda. */
              raw(window.LIFEOS.KESINLIK_HTML(r.cert))]) })}
          <p class="small muted mt-8">Kart metni, not içeriği ve kitap adı GİTMEZ.
            Giden şey bu dört sayıdır; değeri olmayan alan «veri yok» gider,
            sıfır değil.</p>
        </div>

        ${when(on.errors.length, () => K.Notice({ tone:'warn',
          body:'Gövde sözleşmeyi geçmiyor: ' + on.errors[0] + '. Bu hâliyle gönderilmez.' }))}

        <div class="mt-12">
          ${K.Button({ label:'Bağlan', act:'hkm-pair', tone:'primary' })}
          ${K.Button({ label:'Şimdi gönder', act:'hkm-send' })}
          ${K.Button({ label:'Geçmişi gönder (60 gün)', act:'hkm-backfill' })}
        </div>
        <p class="small muted mt-8">Çapraz bulgu GEÇMİŞ ister. Geçmiş
          gönderimi yalnızca geriye dönük hesaplanabilen alanları yollar:
          retansiyon bugünün kart durumundan türetildiği için dünün
          tarihiyle gönderilmez.</p>
        <p class="small muted mt-8">«Bağlan», jetonu HKM'den doğrudan alır:
          önce HKM yüzünde «Cihazları bağla» de, sonra iki dakika içinde
          buraya bas. Jetonu elle yazmak da çalışır.</p>
        <p class="small muted mt-8">${durum}</p>`,
    });
  }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'hkm-toggle'(){
      const a = ESP.Beacon.settings();
      await ESP.Beacon.save({ enabled:!a.enabled });
      ESP.UI.toast(!a.enabled ? 'HKM işareti açıldı' : 'HKM işareti kapatıldı');
      ESP.App.render();
    },
    async 'hkm-pair'(){
      const r = await ESP.Beacon.pair(val('hkm-url'));
      ESP.UI.toast(r.note);
      ESP.App.render();
    },
    async 'hkm-backfill'(){
      ESP.UI.toast('Geçmiş gönderiliyor…');
      const r = await ESP.Beacon.backfill(60);
      ESP.UI.toast(r.ok ? r.sent + ' gün gönderildi (' + r.empty + ' gün ölçümsüz)'
        : 'Gönderilemedi (' + (r.reason || r.status) + ')');
      ESP.App.render();
    },
    async 'hkm-send'(){
      const r = await ESP.Beacon.send({ force:true });
      ESP.UI.toast(r.ok ? 'Gönderildi' : (r.note || 'Gönderilemedi'));
      ESP.App.render();
    },
    async 'save-profile'(){
      const ad = val('pf-name');
      if(!ad){ ESP.UI.toast('Ad boş olamaz'); return; }
      await M.saveProfile({
        name:ad,
        focus:val('pf-focus') || 'balanced',
        instrument:val('pf-instrument'),
        langs:[val('pf-lang') || 'en'],
        dailyMinutes:Number(val('pf-minutes')) || 60,
      });
      ESP.Memo.bitir();
      ESP.UI.toast('Kaydedildi');
      ESP.App.render();
    },

    async 'toggle-mod'(el){
      const id = el.dataset.id;
      const res = await ESP.Mod.set(id, !ESP.Mod.isOn(id));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      /* Kapatilan bolumun ekraninda durmak mumkun degil; kabuk zaten
         yonlendirmeyi denetliyor ama burada da tazelenmeli. */
      ESP.UI.toast(ESP.Mod.isOn(id) ? 'Bölüm açıldı' : 'Bölüm kapandı — verisi duruyor');
      ESP.App.render();
    },

    async 'add-profile'(){
      const res = M.addProfile(val('pf-new'));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      ESP.UI.toast('Profil eklendi');
      ESP.App.render();
    },

    async 'switch-profile'(el){
      M.switchProfile(el.dataset.id);
    },

    async 'remove-profile'(el){
      const id = el.dataset.id;
      ESP.UI.confirmSheet('Profil silinsin mi?',
        'Bu profilin bütün verisi bu cihazdan kalkar ve geri alınamaz.',
        () => {
          const res = M.removeProfile(id);
          if(!res.ok){ ESP.UI.toast(res.error); return; }
          ESP.App.render();
        }, true);
    },

    async 'export-data'(){
      const veri = await ESP.Store.exportAll();
      const blob = new Blob([JSON.stringify(veri, null, 2)], { type:'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'esp-yedek-' + U.todayISO() + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      await M.markBackup();
      ESP.UI.toast('Yedek indirildi');
      ESP.App.render();
    },

    async 'import-data'(){
      ESP.UI.toast('Yedekten yükleme Rehber → Veri sekmesinde');
      S.ui.guideTab = 'veri';
      ESP.App.go('guide');
    },
  };

  const change = {
    async 'hkm-url'(el){ await ESP.Beacon.save({ url:el.value.trim() }); ESP.App.render(); },
    async 'hkm-token'(el){ await ESP.Beacon.save({ token:el.value.trim() }); },
    async 'hkm-interval'(el){
      const n = Math.max(ESP.Beacon.ASGARI_ARA_DK, Number(el.value) || 60);
      await ESP.Beacon.save({ intervalMinutes:n });
    },
    async 'hkm-level'(el){ await ESP.Beacon.save({ level:el.value }); ESP.App.render(); },
  };

  return {
    id:'profile',
    title:'Profil',
    headline(){
      const p = S.profile || {};
      return p.name ? p.name + ' — ' + ((ESP.FOCUS.find(f => f.id === p.focus) || {}).label
        || 'dengeli').toLocaleLowerCase('tr-TR') + ' odak.' : 'Profil henüz doldurulmadı.';
    },
    lede(){
      return 'Yaş, cinsiyet ve kilo sorulmaz: hiçbir hesap bunlara dayanmıyor. '
           + 'Sorulan tek şey ne çalıştığın.';
    },
    stats(){
      const ayak = M.dataFootprint();
      const yedek = M.backupAgeDays();
      return [
        { value:ESP.Mod.count() + '/' + ESP.DISCIPLINES.length, label:'açık bölüm' },
        { value:String(M.profileList().length), label:'profil' },
        { value:ayak.bytes ? String(Math.round(ayak.bytes / 1024)) : '—', unit:'KB', label:'veri' },
        { value:yedek == null ? '—' : String(yedek), unit:'gün', label:'son yedek' },
      ];
    },
    subtitle(){ return M.activeProfileId(); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
