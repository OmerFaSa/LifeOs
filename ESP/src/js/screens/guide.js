/* Rehber — kullanım, model, veri ve sınırlar.

   Dört sekme. Buradaki metinler pazarlama değil sözleşmedir: sistemin ne
   yaptığını ve NE YAPMADIĞINI söyler. «Yapmayacaklar» listesi, yapacaklar
   listesi kadar önemlidir — bir eksiklik değil, bir karardır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.guide = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C, P = ESP.Parts;

  const TABS = [
    { id:'kullanim', label:'Kullanım' },
    { id:'model',    label:'Model' },
    { id:'veri',     label:'Veri' },
    { id:'sinirlar', label:'Sınırlar' },
    { id:'kanit',    label:'Dayanak' },
  ];

  function usageRows(){
    return [
      K.Entry({
        label:'NASIL ÇALIŞIR',
        meta:'üç cümle',
        body:html`
          <ul class="setup__list">
            <li><b>Sen pratiği girersin.</b> Süre, kart, sayfa, kelime — ölçülen ne varsa.</li>
            <li><b>Kural motoru hesaplar.</b> Retansiyon, temiz tempo, sentez katsayısı,
              okunabilirlik. Sıradaki iş de buradan gelir.</li>
            <li><b>Ajanlar yalnızca cümleye çevirir.</b> Sayı üretmezler; model kapalıysa
              kural motorunun cümlesi basılır ve sistem kapanmaz.</li>
          </ul>`,
      }),

      K.Entry({
        label:'SIFIR SÜRTÜNME',
        meta:'en hızlı yol',
        note:'Palete «45 dk gitar» yazıp Enter\'a basmak bir oturum kaydeder. '
           + 'Yazmadan önce ne kaydedileceği gösterilir.',
        body:K.Table({ tight:true, headers:['Zorluk', 'ESP çözümü'],
          rows:[
            ['Kelimeyi elle deftere yazmak', 'Listeyi yapıştır — üç ayraç tanınır'],
            ['Uzun deneme formatına zorlamak', 'Tek cümlelik tez; gerisini itirazlar açar'],
            ['Süreyi kronometreyle not etmek', 'Palete tek satır ya da Bugün ekranındaki form'],
            ['Her kitap için ayrı doküman', 'Tek satırlık atomik kart, bağ önerisi otomatik'],
          ] }),
      }),

      K.Entry({
        label:'KISAYOLLAR',
        meta:'klavye',
        body:K.Table({ tight:true, headers:['Tuş', 'İş'],
          rows:[
            ['Ctrl / ⌘ + K', 'Komut paleti'],
            ['?', 'Kısayol listesi'],
            ['Esc', 'Sırayla: palet → ipucu → alt sayfa → kenar çubuğu'],
            ['j / k', 'Listede satır satır gez'],
          ] }),
      }),

      K.Entry({
        label:'MERDİVEN', hint:'ladder',
        meta:ESP.LEVELS.length - 1 + ' kademe',
        note:'Her bölümde sıfırdan üstatlığa beş basamak ve her basamakta '
           + 'ölçülebilir kapılar. Kademe kişiye değil ÜRETİME verilir: '
           + 'üretim durursa kademe de durur.',
        wide:true,
        body:html`
          ${K.Table({ tight:true, headers:['Kademe', 'Ne demek'],
            rows:ESP.LEVELS.map(l => [l.short + ' · ' + l.label, l.note]) })}
          <p class="small muted mt-8">Merdiven ardışıktır: alttaki kapı
            atlanarak üsttekine geçilmez. Ölçülemeyen kapı üçüncü bir
            durumdur — ne geçildi ne kalındı; orada istenen şey çalışmak
            değil ölçmek.</p>`,
      }),

      K.Entry({
        label:'TEZGÂH', hint:'desk',
        meta:ESP.Desk.TABS.length + ' sekme',
        note:'Her bölümün altında aynı yerde durur ve bölümden bölüme '
           + 'değişmez: bir kez öğrenilir, yedi kez değil.',
        wide:true,
        body:K.Table({ tight:true, headers:['Sekme', 'Ne yapar'],
          rows:[
            ['Koç', 'O bölümün uzmanıyla yazılı ya da SESLİ sohbet; cevabı '
              + 'dinleyebilirsin. Danışma ekranıyla aynı yoldan geçer.'],
            ['Harita', 'Bu bölümde nerede durduğun ve sıradaki kapı.'],
            ['Ekler', 'Not, belge, bağlantı ve ses ÖLÇÜMÜ. Koç sayısını, türünü '
              + 've başlığını görür; içeriğini görmez.'],
            ['Hatırlatma', 'Tarihli ve tekrarlı. Kaçırılan hatırlatıcı ceza '
              + 'üretmez; tekrarlı olan bugünden sayılarak taşınır.'],
            ['Plan', 'O masanın teklifleri. Ajan doğrudan yazmaz: teklif eder, '
              + 'sen onaylarsın, uygulamayı kural motoru yapar.'],
          ] }),
      }),

      K.Entry({
        label:'BÖLÜMLER', hint:'modules',
        meta:ESP.Mod.count() + '/' + ESP.DISCIPLINES.length + ' açık',
        note:'Çalışmayacağın bölümü kapatabilirsin: gezinmeden kalkar, '
           + 'reçeteye ve denge hesabına girmez, ofiste masası kapanır.',
        body:html`
          ${K.Notice({ tone:'info',
            body:'Kapatmak SİLMEZ. Altı ay sonra geri açtığında kartların, '
              + 'notların ve kademen olduğu yerde durur — «kapalı» ile «yok» '
              + 'ayrı şeylerdir.' })}
          ${K.Button({ label:'Bölümleri aç/kapat', size:'sm', act:'go',
            data:{ 'data-route':'profile' }, class:'mt-10' })}`,
      }),

      K.Entry({
        label:'YEDİ DİSİPLİN',
        meta:ESP.DISCIPLINES.length + ' alan',
        note:'Ağırlıklar birbirine yakın tutulur: büyük fark, düşük katsayılı '
           + 'disiplini görünmez yapar ve kullanıcı onu bırakır.',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Disiplin', 'Ajan', { label:'Ağırlık', num:true }, 'Ne ölçülür'],
          rows:ESP.DISCIPLINES.map(d => [
            d.label,
            (ESP.AGENT_BY_ID[d.agent] || {}).name || d.agent,
            U.fmtNum(d.weight),
            d.note,
          ]) }),
      }),
    ];
  }

  function modelRows(){
    const s = ESP.Office.settings();
    return [
      K.Entry({
        label:'MODEL SAĞLAYICI',
        meta:ESP.Office.ready('patron') ? 'bağlı' : 'bağlı değil',
        note:'Model kapalıyken ofis kapanmaz. Bu bir yedek plan değil '
           + 'varsayılan plandır; model bir iyileştirmedir.',
        body:html`
          <div class="cols-2">
            ${K.Field({ label:'Sağlayıcı',
              input:K.Select({ id:'md-provider', value:s.provider,
                options:Object.keys(ESP.PROVIDERS || {})
                  .map(id => ({ value:id, label:ESP.PROVIDERS[id].label })) }) })}
            ${K.Field({ label:'Model',
              input:K.Input({ id:'md-model', value:s.model || '' }) })}
          </div>
          ${K.Field({ label:'API anahtarı', hint:'yalnızca bu tarayıcıda saklanır',
            input:K.Input({ id:'md-key', type:'password', placeholder:'sk-…' }) })}
          ${K.Button({ label:'Kaydet', tone:'primary', act:'save-model', class:'mt-10' })}
          ${K.Notice({ tone:'info', class:'mt-10',
            body:'Anahtar uygulama verisinden AYRI bir anahtarda durur: yedeğe girmez, '
              + 'buluta gitmez, modele gönderilmez. Bir sağlayıcıya birden çok anahtar '
              + 'verilebilir; kota anahtar başına sayılır.' })}`,
      }),

      K.Entry({
        label:'MODELE NE GİDER', hint:'brief',
        meta:'yalnızca brifing',
        note:'Ham ses kaydı, tam taslak metni ve atomik notun kendi cümlesi '
           + 'gitmez. Bu bir testle denetlenir.',
        body:html`
          ${K.Table({ tight:true, headers:['Gider', 'Gitmez'],
            rows:[
              ['Ölçülmüş metrikler (süre, kart sayısı, BPM)', 'Ham ses dosyası'],
              ['Durum etiketleri (ölçüldü / veri yok)', 'Tam taslak metni'],
              ['Parça ve teknik adı', 'Kişisel günlük notu'],
              ['Senin açıkça paylaştığın alıntı', 'Ad ve profil bilgisi'],
            ] })}
          <p class="small muted mt-8">Danışma ekranında brifingin ham JSON\'unu
            açabilirsin: ajanın ne gördüğünü tam olarak görmen gerekir.</p>`,
      }),

      K.Entry({
        label:'ÇIKTI DENETİMİ',
        meta:ESP.GROUNDING.banned.length + ' desen',
        note:'Denetim metni YENİDEN YAZMAZ, işaretler. Sessizce düzeltmek anlamı '
           + 'tersine çevirebilir; çağıran ya uyarıyı gösterir ya kural motorunun '
           + 'cümlesine düşer.',
        body:K.Table({ tight:true, headers:['Denetim', 'Ne arar'],
          rows:ESP.PEDAGOGIC.never.map(n => [n.label, n.note]) }),
      }),
    ];
  }

  function dataRows(){
    const ayak = M.dataFootprint();
    const dp = ESP.Storage;
    const hukum = dp.verdict();
    const buyume = dp.growth();
    const ufuk = dp.horizon();
    const dagilim = dp.breakdown();
    const budanabilir = dp.prunable();

    return [
      /* Dokuz aylik ufuk.

         "Depo %80 dolu" tek basina ise yaramaz: ne zaman dolacagini ve
         NEYIN sisdigini soylemez. Ikisi bambaska kararlar gerektirir. */
      K.Entry({
        label:'DOKUZ AYLIK UFUK', hint:'storage',
        meta:hukum.title,
        note:'Bu sistem dokuz ay her gün kullanılırsa ne olur? Büyüme hızı '
           + 'ölçülür, tahmin edilmez: iki ölçümden az varsa hız bilinmiyordur.',
        wide:true,
        body:html`
          ${K.Notice({ tone:hukum.level === 'full' ? 'danger'
            : hukum.level === 'near' ? 'warn'
            : hukum.level === 'watch' ? 'warn' : 'ok',
            title:hukum.title, body:hukum.note })}
          ${K.Table({ tight:true, headers:['Ölçüm', 'Değer'], rows:[
            ['Şu anki boyut', dp.fmtBytes(buyume.bytes)],
            ['Günlük büyüme', buyume.perDay == null ? P.cert('missing')
              : dp.fmtBytes(buyume.perDay) + '/gün'],
            ['Ölçüm günü', String(buyume.samples)
              + (buyume.cert === 'measured' ? ' (ölçüldü)'
                : buyume.cert === 'estimated' ? ' (tahmin)' : '')],
            ['Dolmaya kalan', buyume.daysLeft == null ? '—' : buyume.daysLeft + ' gün'],
            ['270 gün sonra', ufuk.cert === 'missing' ? P.cert('missing')
              : dp.fmtBytes(ufuk.projected) + (ufuk.willFit ? ' (sığar)' : ' (sığmaz)')],
          ] })}`,
      }),

      K.Entry({
        label:'NE BÜYÜYOR',
        meta:dagilim.length + ' koleksiyon',
        note:'Toplam yüzde hangi kaydın şiştiğini söylemez; burada söyler. '
           + '«İçerik» işaretli olanlar senin girdiğin veridir ve sistem '
           + 'onları yer açmak için silmez.',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Kayıt', { label:'Boyut', num:true }, { label:'Adet', num:true }, 'Tür'],
          rows:dagilim.slice(0, 12).map(r => [
            r.label, dp.fmtBytes(r.bytes), String(r.count),
            r.content ? 'içerik' : (r.prunable ? 'budanabilir' : 'sistem'),
          ]) }),
      }),

      ...(budanabilir.length ? [K.Entry({
        label:'YER AÇ',
        meta:dp.fmtBytes(budanabilir.reduce((a, b) => a + b.bytes, 0)) + ' budanabilir',
        note:'Yalnızca sistemin kendi ürettiği kayıtlar listelenir. '
           + 'Girdiğin hiçbir oturum, kart ya da not burada yer almaz — '
           + 'hiçbir koşulda.',
        wide:true,
        body:html`
          ${map(budanabilir, b => html`
            <label class="row wrap gap-8 mt-8">
              <input type="checkbox" data-prune="${b.collection}"/>
              <span><b>${b.label}</b> — ${dp.fmtBytes(b.bytes)}
                <span class="tiny dim">${b.note}</span></span>
            </label>`)}
          ${K.Button({ label:'Seçilenleri buda', tone:'danger', act:'prune-storage',
            class:'mt-10' })}
          <p class="tiny dim mt-8">Budamadan önce yedek almak iyi olur:
            budanan kayıt geri gelmez.</p>`,
      })] : []),

      K.Entry({
        label:'NEREDE DURUYOR',
        meta:ayak.bytes ? Math.round(ayak.bytes / 1024) + ' KB' : '—',
        note:ESP.PRIVACY.storage,
        body:html`
          ${when(ayak.pct != null, () => K.Meter({ label:'Yerel kota', value:ayak.pct,
            text:'%' + ayak.pct }))}
          <p class="small muted mt-8">Depo anahtarı: <code>esp.v1.${M.activeProfileId()}</code></p>`,
      }),

      K.Entry({
        label:'YEDEK',
        meta:(function(){ const n = M.backupAgeDays(); return n == null ? 'hiç' : n + ' gün önce'; })(),
        note:'Yedek dosyası şifresizdir; paylaşılan bir dizine konmaz.',
        body:html`
          <div class="row wrap">
            ${K.Button({ label:'Yedek indir', tone:'primary', act:'export-data2' })}
            ${K.Drop({ id:'restore-drop', act:'restore-file',
              label:'Yedek dosyasını buraya bırak ya da seç' })}
          </div>
          ${K.Notice({ tone:'warn', class:'mt-10', title:'Dikkat',
            body:'Yedekten yükleme mevcut verinin TAMAMINI değiştirir ve şu an '
              + 'geri alınamaz. Yüklemeden önce mevcut veriyi indir.' })}`,
      }),

      K.Entry({
        label:'HER ŞEYİ SİL',
        meta:'geri alınamaz',
        body:html`
          ${K.Button({ label:'Bu profilin verisini sil', act:'wipe-data' })}
          <p class="small muted mt-8">Yalnızca açık profilin verisi silinir;
            diğer profiller kendi anahtarlarında kalır.</p>`,
      }),
    ];
  }

  function limitRows(){
    return [
      K.Entry({
        label:'PEDAGOJİK SINIR', hint:'pedagogic',
        meta:'değişmez',
        body:html`
          ${K.Notice({ tone:'info', body:ESP.PEDAGOGIC.disclaimer })}
          <p class="small muted mt-10">${ESP.PEDAGOGIC.level}</p>`,
      }),

      K.Entry({
        label:'DOKTRİN',
        meta:'dört kural',
        body:K.Table({ tight:true, headers:['Kural', 'Ne demek'],
          rows:[
            ['Kural motoru otoritedir', ESP.GROUNDING.authority],
            ['Karar kural motorundan gelir', ESP.GROUNDING.decision],
            ['Model yoksa ofis kapanmaz', ESP.GROUNDING.noModel],
            ['Girilmemiş alan sıfır değildir', ESP.CERTAINTY.missing.note],
          ] }),
      }),

      K.Entry({
        label:'ÖNCELİK SIRASI', hint:'precedence',
        meta:ESP.PRECEDENCE.length + ' kural',
        body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Kural', 'Neden'],
          rows:ESP.PRECEDENCE.map(p => [String(p.rank), p.label, p.note]) }),
      }),

      K.Entry({
        label:'YAPILMAYACAKLAR',
        meta:'bir eksiklik değil, bir karar',
        note:'Bunlar unutulmadı; reddedildi.',
        body:K.Table({ tight:true, headers:['Yapılmaz', 'Neden'],
          rows:[
            ['Otomatik transkripsiyon', 'Konuşma-metin modeli gerektirir; süre ve '
              + 'öz-değerlendirme elle işaretlenir.'],
            ['Canlı CEFR / müzik teorisi sınavı', 'Sistem çevrimdışıdır ve resmî sınav '
              + 'kurumlarına bağlanmaz.'],
            ['Giyilebilir cihaz entegrasyonu', 'Pratik süresi elle ya da dahili '
              + 'zamanlayıcıyla girilir; hesap zaten eksik girdiye dayanıklı.'],
            ['Ses kaydı saklama', 'Diksiyonda ölçüm saklanır, dosya oluşmaz. '
              + 'Olmayan dosya sızamaz.'],
            ['Seviye ve sertifika', 'Pedagojik sınırın kendisi — yetenek eksiği değil.'],
          ] }),
      }),

      K.Entry({
        label:'KARDEŞ PROJELER',
        meta:'aynı depo',
        note:'Üçü ortak bir tasarım dili paylaşır ama kodları ayrıdır: farklı ad '
           + 'alanı, farklı depo anahtarı, farklı test paketi, farklı port. '
           + 'Biri diğerini import etmez.',
        body:K.Table({ tight:true, headers:['Sistem', 'Alan', 'Ad alanı', 'Port'],
          rows:[
            ['AYS — Akademik Yol Sistemi', 'Sınav hazırlığı ve çalışma düzeni', 'R.*', '4173'],
            ['SPİ — Sağlık Performans İzleyicisi', 'Sağlık, beslenme, hareket', 'SP.*', '4183'],
            ['ESP — Entelektüel Seviye Planlayıcı', 'Dil, felsefe, müzik, okuma, yazı', 'ESP.*', '4193'],
          ] }),
      }),
    ];
  }

  /* ------------------------------------------------------------- kanıt

     Merdivenin butun esiklerinin nereden geldigi tek tabloda.

     Varlik sebebi tek cumle: deterministik olmak, pedagojik olarak dogru
     olmak anlamina gelmez. "Retansiyon >= 0,75" kodda kesindir; 0,75'in
     kendisi bu sistemin secimidir ve bunu gizlemek, bir tasarim tercihini
     bulgu gibi sunmak olurdu. */
  function evidenceRows(){
    const kapsam = ESP.Ev.coverage();
    const denetim = ESP.Ev.audit();
    const ayrisan = ESP.Ev.disputed();
    const kurallar = ESP.EVIDENCE.map(e => ESP.Ev.resolve(e));

    return [
      K.Entry({
        label:'EŞİKLER NEREDEN GELİYOR?', hint:'evidence',
        meta:kapsam.total + ' kayıt',
        note:'Kaynak, kesinlik ve uygulanabilirlik birer bilgi; «yetki» ise '
           + 'ESP\'nin kararıdır — hangi kaynağa dayanarak kademe '
           + 'ilerletebileceğini söyler.',
        wide:true,
        body:html`
          ${K.Notice({ tone:'warn', title:'Bu bir pedagojik hiyerarşi değildir',
            body:ESP.Ev.policy().disclaimer })}
          <p class="small muted mt-8">${ESP.Ev.policy().rationale}</p>
          ${K.Table({ tight:true,
            headers:['Kaynak türü', 'Tanınan yetki', { label:'Eşik', num:true }],
            rows:ESP.EVIDENCE_SOURCES.map(src => {
              const y = ESP.EVIDENCE_AUTHORITY.filter(a =>
                a.id === ESP.Ev.policy().defaults[src.id])[0];
              return [src.label, y.label + ' — ' + y.note,
                String(kapsam.bySource[src.id] || 0)];
            }) })}
          <p class="tiny dim mt-8">Politika sürümü ${ESP.Ev.policy().version}
            (${ESP.Ev.policy().changedAt}).</p>`,
      }),

      ...ESP.EVIDENCE_SOURCES.map(src => {
        const rows = kurallar.filter(r => r.source === src.id);
        if(!rows.length) return null;
        return K.Entry({
          label:src.label.toLocaleUpperCase('tr-TR'),
          meta:rows.length + ' eşik',
          note:src.note,
          wide:true,
          body:K.Table({ tight:true,
            headers:['Eşik', 'Dayanak', 'Kesinlik', 'Uygulanır', 'Yetki'],
            rows:rows.map(r => [
              r.rule,
              html`${r.citation}${when(r.note, () => html`<br><span class="tiny dim">${r.note}</span>`)}`,
              (r.certaintyInfo || {}).label || r.certainty,
              (r.applicabilityInfo || {}).label || r.applicability,
              (r.authorityInfo || {}).label || r.authority,
            ]) }),
        });
      }).filter(Boolean),

      K.Entry({
        label:'DENETİM',
        meta:denetim.length ? denetim.length + ' sorun' : 'temiz',
        body:html`
          ${denetim.length
            ? K.Notice({ tone:'danger', title:'Kayıt sorunlu',
                body:denetim.map(d => d.rule + ' (' + d.kind + ')').join(', ') })
            : K.Notice({ tone:'ok', title:'Denetim temiz',
                body:'Her kayıt çözülebiliyor, her atıf yazılı ve sistem ayarı '
                   + 'olan her eşik gerekçesini taşıyor. Bu denetim testte de '
                   + 'koşar; bozulursa test kırılır.' })}
          ${when(ayrisan.length, () => K.Notice({ tone:'info',
            title:'Dolaylı ya da kesinliği düşük eşikler',
            body:ayrisan.length + ' eşik ya disipline uyarlanırken kayıyor ya '
               + 'da kesinliği düşük. Bunlar kademe değiştirmez, yalnızca '
               + 'bilgilendirir.' }))}`,
      }),
    ];
  }

  function render(){
    const tab = S.ui.guideTab || 'kullanim';
    const rows = tab === 'model' ? modelRows()
      : tab === 'veri' ? dataRows()
      : tab === 'sinirlar' ? limitRows()
      : tab === 'kanit' ? evidenceRows()
      : usageRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'guide-tab', aria:'Rehber sekmeleri', items:TABS }),
      }))}
      ${K.Span(12, K.Ledger(() => rows))}`);
  }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'guide-tab'(el){ S.ui.guideTab = el.dataset.tab; ESP.App.render(); },

    /* Budama. Sistem kullanicinin girdigi veriyi yer acmak icin silmez;
       motor zaten reddeder ama ekran da yalnizca izinli olanlari sunar. */
    async 'prune-storage'(){
      const secili = Array.prototype.slice
        .call(document.querySelectorAll('[data-prune]'))
        .filter(el => el.checked).map(el => el.dataset.prune);
      if(!secili.length){ ESP.UI.toast('Önce budanacak kaydı seç.'); return; }
      const r = await ESP.Storage.prune(secili);
      if(!r.ok){ ESP.UI.toast(r.error); return; }
      ESP.UI.toast(ESP.Storage.fmtBytes(r.freed) + ' yer açıldı.');
      ESP.App.render();
    },

    async 'save-model'(){
      const p = val('md-provider'), m = val('md-model'), k = val('md-key');
      await ESP.Office.saveSettings({ provider:p, model:m });
      if(k && ESP.LLM.setKey) ESP.LLM.setKey(p, k);
      ESP.UI.toast('Kaydedildi');
      ESP.App.render();
    },

    async 'export-data2'(){
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

    async 'wipe-data'(){
      ESP.UI.confirmSheet('Bu profilin verisi silinsin mi?',
        'Bütün oturumlar, kartlar, tezler, notlar ve taslaklar kalkar. '
        + 'Bu işlem geri alınamaz.',
        async () => { await ESP.Store.clear(); location.reload(); }, true);
    },
  };

  const change = {
    /* Dosyadan geri yukleme. Yuklemeden once mevcut veri BASKA bir anahtara
       alinmadigi surece geri donusu yoktur — bu acik borc rehberde de yazar
       ve kullanici uyarilmadan islem yapilmaz. */
    async 'restore-file'(el){
      const f = el.files && el.files[0];
      if(!f) return;
      const metin = await f.text();
      let obj = null;
      try{ obj = JSON.parse(metin); }
      catch(e){ ESP.UI.toast('Dosya okunamadı'); return; }

      const okuma = ESP.Store.readBackup(obj);
      if(!okuma.ok){ ESP.UI.toast(okuma.error || 'Geçersiz yedek'); return; }

      ESP.UI.confirmSheet('Yedekten yüklensin mi?',
        'Mevcut verinin TAMAMI bu yedekle değişir ve geri alınamaz. '
        + 'Devam etmeden önce mevcut veriyi indirmen önerilir.',
        async () => { await ESP.Store.importAll(obj); location.reload(); }, true);
    },
  };

  return {
    id:'guide',
    title:'Rehber',
    headline(){ return 'Sistem ne yapar — ve ne yapmaz.'; },
    lede(){
      return 'Buradaki metinler pazarlama değil sözleşmedir. '
           + '«Yapmayacaklar» listesi, yapacaklar listesi kadar önemlidir.';
    },
    stats(){ return []; },
    subtitle(){ return 'kullanım · model · veri · sınırlar'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
