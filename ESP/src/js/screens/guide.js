/* Rehber — kullanım, model, veri ve sınırlar.

   Dört sekme. Buradaki metinler pazarlama değil sözleşmedir: sistemin ne
   yaptığını ve NE YAPMADIĞINI söyler. «Yapmayacaklar» listesi, yapacaklar
   listesi kadar önemlidir — bir eksiklik değil, bir karardır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.guide = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'kullanim', label:'Kullanım' },
    { id:'model',    label:'Model' },
    { id:'veri',     label:'Veri' },
    { id:'sinirlar', label:'Sınırlar' },
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
    return [
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

  function render(){
    const tab = S.ui.guideTab || 'kullanim';
    const rows = tab === 'model' ? modelRows()
      : tab === 'veri' ? dataRows()
      : tab === 'sinirlar' ? limitRows()
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
