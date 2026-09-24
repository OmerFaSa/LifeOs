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
        label:'Nasıl çalışır',
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
        label:'Sıfır sürtünme',
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
        label:'Kısayollar',
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
        label:'Merdiven', hint:'ladder',
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
        label:'Bölümler', hint:'modules',
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
        label:'Yedi disiplin',
        meta:ESP.DISCIPLINES.length + ' alan',
        note:'Ağırlıklar birbirine yakın tutulur: büyük fark, düşük katsayılı '
           + 'disiplini görünmez yapar ve kullanıcı onu bırakır.',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Disiplin', 'Ajan', { label:'Ağırlık', num:true }, 'Ne ölçülür'],
          rows:ESP.DISCIPLINES.map(d => [
            /* Amblem burada da: aynı disiplin iki ekranda aynı yüzle
               görünsün (bkz. profile.js, BÖLÜMLER). */
            raw(window.LIFEOS.SIMGELI('disiplin', d.id, d.label)),
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
        label:'Model sağlayıcı',
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
        label:'Modele ne gider', hint:'brief',
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
        label:'Çıktı denetimi',
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
    const undo = ESP.Store.importUndoInfo();

    return [
      /* Dokuz aylik ufuk.

         "Depo %80 dolu" tek basina ise yaramaz: ne zaman dolacagini ve
         NEYIN sisdigini soylemez. Ikisi bambaska kararlar gerektirir. */
      K.Entry({
        label:'Dokuz aylık ufuk', hint:'storage',
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
        label:'Ne büyüyor',
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
        label:'Yer aç',
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
        label:'Nerede duruyor',
        meta:ayak.bytes ? Math.round(ayak.bytes / 1024) + ' KB' : '—',
        note:ESP.PRIVACY.storage,
        body:html`
          ${when(ayak.pct != null, () => K.Meter({ label:'Yerel kota', value:ayak.pct,
            text:'%' + ayak.pct }))}
          <p class="small muted mt-8">Depo anahtarı: <code>esp.v1.${M.activeProfileId()}</code></p>`,
      }),

      K.Entry({
        label:'Yedek',
        meta:(function(){ const n = M.backupAgeDays(); return n == null ? 'hiç' : n + ' gün önce'; })(),
        note:'Yedek dosyası şifresizdir; paylaşılan bir dizine konmaz.',
        body:html`
          <div class="row wrap">
            ${K.Button({ label:'Yedek indir', act:'export-data2' })}
            ${when((ESP.Beacon && ESP.Beacon.settings().enabled), () => K.Button({ label:'HKM’deki yedekten yükle', act:'restore-hkm' }))}
            ${K.Drop({ id:'restore-drop', act:'restore-file',
              label:'Yedek dosyasını buraya bırak ya da seç' })}
          </div>
          ${K.Notice({ tone:'warn', class:'mt-10', title:'Dikkat',
            body:'Yedekten yükleme mevcut verinin TAMAMINI değiştirir. Yüklemeden '
              + 'önce mevcut veriyi indir; yanlış yükledin diyorsan bir sonraki '
              + 'yükleme veya profil silmeye kadar geri alabilirsin.' })}
          ${when(undo, () => html`<div class="mt-10">${K.Notice({ tone:'warn',
            body:new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki yedekten yükleme mevcut '
               + 'verinin üzerine yazdı.' })}</div>
            <div class="mt-8">${K.Button({ label:'Bu içe aktarmayı geri al', tone:'danger', act:'undo-import' })}</div>`)}`,
      }),

      K.Entry({
        label:'Her şeyi sil',
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
        label:'Pedagojik sınır', hint:'pedagogic',
        meta:'değişmez',
        body:html`
          ${K.Notice({ tone:'info', body:ESP.PEDAGOGIC.disclaimer })}
          <p class="small muted mt-10">${ESP.PEDAGOGIC.level}</p>`,
      }),

      K.Entry({
        label:'Doktrin',
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
        label:'Öncelik sırası', hint:'precedence',
        meta:ESP.PRECEDENCE.length + ' kural',
        body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Kural', 'Neden'],
          rows:ESP.PRECEDENCE.map(p => [String(p.rank), p.label, p.note]) }),
      }),

      K.Entry({
        label:'Yapılmayacaklar',
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
        label:'Kardeş projeler',
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
  /* Madde 11: hedef paketlerinin tahmin tabloları ve dayanağı. «Kaynağa
     bağla» King'e esp.belge ister; sonuç Bugün'e teklif olarak gelir. */
  function dayanakEntry(){
    const c = ESP.Belge ? ESP.Belge.dayanak('cefr') : null;
    const o = ESP.Belge ? ESP.Belge.dayanak('okumaHizi') : null;
    const T = ESP.Hedefler.cefrTablo();
    return K.Entry({
      label:'Tahmin tabloları', hint:'evidence',
      meta:(c ? 'CEFR kaynaklı' : 'CEFR kaynak bekliyor') + ' · ' + (o ? 'okuma hızı kaynaklı' : 'okuma hızı kaynak bekliyor'),
      note:'Dil ve okuma hedeflerinin süre hesabı bu tablolara dayanır. Kaynağa bağlanınca hesap '
         + 'yine koddadır ve karar «tahmin» kalır; değişen, dayanağın kaynaklı olmasıdır.',
      wide:true,
      body:html`
        ${K.Table({ tight:true, headers:['Tablo', 'Değer', 'Dayanak'], rows:[
          ['CEFR saatleri (sıfırdan)', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(s => s + ' ' + T[s]).join(' · '),
            c ? 'kaynaklı · ' + (c.kaynak ? c.kaynak.baslik : '') + ' · ' + c.at : 'kaynak bekliyor'],
          ['Okuma hızı', o ? o.kelimeDk + ' kelime/dk' : '≈ 230 kelime/dk (varsayım)',
            o ? 'kaynaklı · ' + (o.kaynak ? o.kaynak.baslik : '') + ' · ' + o.at : 'kaynak bekliyor'],
        ] })}
        <div class="row gap-8 wrap mt-8">
          ${K.Button({ label:'CEFR tablosunu kaynağa bağla', size:'sm', act:'dayanak-iste', data:{ 'data-alan':'cefr' } })}
          ${K.Button({ label:'Okuma hızını kaynağa bağla', size:'sm', act:'dayanak-iste', data:{ 'data-alan':'okuma_hizi' } })}
        </div>`,
    });
  }

  function evidenceRows(){
    const kapsam = ESP.Ev.coverage();
    const denetim = ESP.Ev.audit();
    const ayrisan = ESP.Ev.disputed();
    const kurallar = ESP.EVIDENCE.map(e => ESP.Ev.resolve(e));

    return [
      dayanakEntry(),
      K.Entry({
        label:'EŞİKLER NEREDEN GELİYOR?', hint:'evidence',
        meta:kapsam.total + ' kayıt',
        note:'Kaynak, kesinlik ve uygulanabilirlik birer bilgi; «yetki» ise '
           + 'ESP\'nin kararıdır — hangi kaynağa dayanarak kademe '
           + 'ilerletebileceğini söyler.',
        wide:true,
        body:html`
          ${(function(){
            /* Uyarının ilk cümlesi görünür; gerekçe bir dokunuşla açılır (§1.2). */
            const c = String(ESP.Ev.policy().disclaimer).split(/(?<=\.)\s+/);
            return K.Notice({ tone:'warn', title:'Bu bir pedagojik hiyerarşi değildir',
              body:K.Ayrinti({ ozet:c[0], govde:html`${when(c.length > 1, () => html`<p>${c.slice(1).join(' ')}</p>`)}
                <p class="mt-8">${ESP.Ev.policy().rationale}</p>` }) });
          })()}
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
        label:'Denetim',
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

  /* SEVİYE SEKMESİ BURADAN KALKTI.

     Rehber, sistemin nasıl çalıştığını anlatan yerdir; seviye ise
     bakılacak bir yerdir. Aynı defteri iki ayrı sekmede göstermek
     «hangisi gerçek» sorusunu doğuruyordu. Artık kendi bölümü var:
     üst gezinmede «Rütbe» (screens/rutbe.js) — kademe, merdiven,
     XP kaynakları ve defter orada. */

  /* Sekme yok (EKIP-PLANI §1.2): beş bölüm alt alta. */
  const GOVDE = { kullanim:usageRows, model:modelRows, veri:dataRows, sinirlar:limitRows, kanit:evidenceRows };

  function render(){
    return K.Grid(html`
      ${K.Span(12, ESP.Parts.bolumler(null, { act:'guide-tab', aria:'Rehber bölümleri', tabs:TABS, govde:GOVDE }))}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('guideTab', TABS[0].id); }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    /* Yeni cihaza taşıma (fikir 54): HKM'deki en yeni yedek çekilir,
       okuma denetiminden geçer, onayla uygulanır; «İçe aktarmayı geri al»
       geri dönüş noktasıdır (büyük aksiyon, AGENTS §1.9). */
    async 'restore-hkm'(){
      const r = await LIFEOS.YedekAg.hkmdenCek({ hkm:() => ESP.Beacon, modul:'esp' });
      if(!r.ok){ ESP.UI.toast(r.why, { life:5000 }); return; }
      const c = ESP.Store.readBackup(r.obj);
      if(!c.ok){ ESP.UI.toast(c.error || 'Geçersiz yedek'); return; }
      ESP.UI.confirmSheet('HKM’deki yedek yüklensin mi?',
        r.tarihYazi + ' tarihli yedek' + (r.boyut ? ' (' + r.boyut + ')' : '') + ' bu cihazdaki verinin '
          + 'TAMAMINI değiştirir. Yanlışsa «İçe aktarmayı geri al» ile bir önceki duruma dönebilirsin.',
        async () => {
          try{
            await ESP.Store.importAll(r.obj);
            ESP.UI.toast('HKM yedeği yüklendi — sayfa yenileniyor');
            setTimeout(() => location.reload(), 900);
          }catch(e){
            ESP.UI.toast('Yükleme başarısız: ' + (e && e.message ? e.message : 'bilinmeyen hata'));
          }
        }, true);
    },
    async 'dayanak-iste'(el){
      const alan = el.dataset.alan;
      const r = await ESP.Belge.iste({ alan, konu:alan === 'cefr' ? 'CEFR rehberli öğrenme saatleri'
        : 'yetişkin sessiz okuma hızı' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    async 'guide-tab'(el){ K.bolumeGit(el.dataset.tab); },

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

    async 'undo-import'(){
      const undo = ESP.Store.importUndoInfo();
      if(!undo){ ESP.UI.toast('Geri alınacak bir içe aktarma yok'); return; }
      ESP.UI.confirmSheet('İçe aktarmayı geri al',
        new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki içe aktarma öncesine dönülecek. '
          + 'Aradan geçen sürede eklediğin her şey kaybolur.',
        async () => {
          try{
            await ESP.Store.undoImport();
            ESP.UI.toast('Geri alındı — yeniden başlatılıyor');
            setTimeout(() => location.reload(), 900);
          }catch(e){
            ESP.UI.toast(e && e.message ? e.message : 'Geri alınamadı');
          }
        }, true);
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
        async () => {
          try{
            const meta = await ESP.Store.importAll(obj);
            if(meta.geriAlinamaz){
              ESP.UI.toast('Yer olmadığı için bu içe aktarma geri alınamaz — sayfa yenileniyor');
            }
            if(meta.partialCloud){
              ESP.UI.toast(meta.cloudFailed + ' kayıt buluta yazılamadı; '
                + 'bu cihazda yüklendi — sayfa yenileniyor');
            }
            /* Yerel yazma basarisizsa asagidaki satira HIC gelinmez:
               yenilemek, tamamlanmamis bir islemi tamamlanmis gosterir. */
            setTimeout(() => location.reload(), 900);
          }catch(e){
            ESP.UI.toast(e && e.message ? e.message : 'Yedek yüklenemedi');
          }
        }, true);
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
    render, afterRender, handle, change,
  };
})();
