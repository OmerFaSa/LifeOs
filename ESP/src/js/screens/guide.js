/* Rehber — kullanım, model, veri ve sınırlar.

   Dört sekme. Buradaki metinler pazarlama değil sözleşmedir: sistemin ne
   yaptığını ve NE YAPMADIĞINI söyler. «Yapmayacaklar» listesi, yapacaklar
   listesi kadar önemlidir — bir eksiklik değil, bir karardır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:140, id:'act:backup', kind:'Eylem', label:'Yedek indir',
  hint:'Veri', run:() => { ESP.S.ui.guideTab = 'veri'; ESP.App.go('guide'); } });
window.LIFEOS.PARCA.yazilar({
  'esp.guide.kullanim':'Kullanım',
  'esp.guide.ofis':'Ofis',
  'esp.guide.veri':'Veri',
  'esp.guide.sinirlar':'Sınırlar',
  'esp.guide.dayanak':'Dayanak',
  'esp.guide.nasil-calisir':'Nasıl çalışır',
  'esp.guide.sen-pratigi-girersin':'Sen pratiği girersin.',
  'esp.guide.sure-kart-sayfa-kelime':'Süre, kart, sayfa, kelime — ölçülen ne varsa.',
  'esp.guide.kural-motoru-hesaplar':'Kural motoru hesaplar.',
  'esp.guide.retansiyon-temiz-tempo-sente':'Retansiyon, temiz tempo, sentez katsayısı, okunabilirlik. Sıradaki iş de buradan gelir.',
  'esp.guide.ajanlar-yalnizca-cumleye-cev':'Ajanlar yalnızca cümleye çevirir.',
  'esp.guide.sayi-uretmezler-model-kapali':'Sayı üretmezler; model kapalıysa kural motorunun cümlesi basılır ve sistem kapanmaz.',
  'esp.guide.sifir-surtunme':'Sıfır sürtünme',
  'esp.guide.palete-45-dk-gitar-yazip':'Palete «45 dk gitar» yazıp Enter\'a basmak bir oturum kaydeder. ',
  'esp.guide.kisayollar':'Kısayollar',
  'esp.guide.merdiven':'Merdiven',
  'esp.guide.her-bolumde-sifirdan-ustatli':'Her bölümde sıfırdan üstatlığa beş basamak ve her basamakta ',
  'esp.guide.merdiven-ardisiktir-alttaki':'Merdiven ardışıktır: alttaki basamak atlanarak üsttekine geçilmez. Ölçülemeyen basamak üçüncü bir durumdur — ne geçildi ne kalındı; orada istenen şey çalışmak değil ölçmek.',
  'esp.guide.tezgah':'TEZGÂH',
  'esp.guide.her-bolumun-altinda-ayni-yer':'Her bölümün altında aynı yerde durur ve bölümden bölüme ',
  'esp.guide.bolumler':'Bölümler',
  'esp.guide.calismayacagin-bolumu-kapata':'Çalışmayacağın bölümü kapatabilirsin: gezinmeden kalkar, ',
  'esp.guide.bolumleri-ac-kapat':'Bölümleri aç/kapat',
  'esp.guide.yedi-disiplin':'Yedi disiplin',
  'esp.guide.agirliklar-birbirine-yakin-t':'Ağırlıklar birbirine yakın tutulur: büyük fark, düşük katsayılı ',
  'esp.guide.agirlik':'Ağırlık',
  'esp.guide.ofis-modeli':'Ofis modeli',
  'esp.guide.model-anahtar-ve-butce-tek':'Model, anahtar ve bütçe tek yerde durur: HKM › Modeller › «ESP · Sohbet» (atama yoksa King’in modeli). ',
  'esp.guide.durumu-tazele':'Durumu tazele',
  'esp.guide.bu-cihazda-eski-bir-model':'Bu cihazda eski bir model ayarı var.',
  'esp.guide.merkez-e-ulasilamazsa-yedek':'Merkez’e ulaşılamazsa yedek olarak kullanılır. İstersen sil; anahtar bu tarayıcıdan kalkar.',
  'esp.guide.eski-ayari-sil':'Eski ayarı sil',
  'esp.guide.modele-ne-gider':'Modele ne gider',
  'esp.guide.ham-ses-kaydi-tam-taslak':'Ham ses kaydı, tam taslak metni ve atomik notun kendi cümlesi ',
  'esp.guide.cikti-denetimi':'Çıktı denetimi',
  'esp.guide.denetim-metni-yeni-den-yazma':'Denetim metni YENİDEN YAZMAZ, işaretler. Sessizce düzeltmek anlamı ',
  'esp.guide.dokuz-aylik-ufuk':'Dokuz aylık ufuk',
  'esp.guide.bu-sistem-dokuz-ay-her':'Bu sistem dokuz ay her gün kullanılırsa ne olur? Büyüme hızı ',
  'esp.guide.ne-buyuyor':'Ne büyüyor',
  'esp.guide.toplam-yuzde-hangi-kaydin-si':'Toplam yüzde hangi kaydın şiştiğini söylemez; burada söyler. ',
  'esp.guide.boyut':'Boyut',
  'esp.guide.adet':'Adet',
  'esp.guide.yer-ac':'Yer aç',
  'esp.guide.yalnizca-sistemin-kendi-uret':'Yalnızca sistemin kendi ürettiği kayıtlar listelenir. ',
  'esp.guide.secilenleri-buda':'Seçilenleri buda',
  'esp.guide.budamadan-once-yedek-almak-i':'Budamadan önce yedek almak iyi olur: budanan kayıt geri gelmez.',
  'esp.guide.nerede-duruyor':'Nerede duruyor',
  'esp.guide.yerel-kota':'Yerel kota',
  'esp.guide.depo-anahtari':'Depo anahtarı:',
  'esp.guide.yedek':'Yedek',
  'esp.guide.yedek-dosyasi-sifresizdir-pa':'Yedek dosyası şifresizdir; paylaşılan bir dizine konmaz.',
  'esp.guide.yedek-indir':'Yedek indir',
  'esp.guide.hkm-deki-yedekten-yukle':'HKM’deki yedekten yükle',
  'esp.guide.yedek-dosyasini-buraya-birak':'Yedek dosyasını buraya bırak ya da seç',
  'esp.guide.dikkat':'Dikkat',
  'esp.guide.bu-ice-aktarmayi-geri-al':'Bu içe aktarmayı geri al',
  'esp.guide.her-seyi-sil':'Her şeyi sil',
  'esp.guide.bu-profilin-verisini-sil':'Bu profilin verisini sil',
  'esp.guide.yalnizca-acik-profilin-veris':'Yalnızca açık profilin verisi silinir; diğer profiller kendi anahtarlarında kalır.',
  'esp.guide.ornek-veriyle-dene':'Örnek veriyle dene',
  'esp.guide.karsilama':'Karşılama',
  'esp.guide.pedagojik-sinir':'Pedagojik sınır',
  'esp.guide.doktrin':'Doktrin',
  'esp.guide.oncelik-sirasi':'Öncelik sırası',
  'esp.guide.yapilmayacaklar':'Yapılmayacaklar',
  'esp.guide.bunlar-unutulmadi-reddedildi':'Bunlar unutulmadı; reddedildi.',
  'esp.guide.kardes-projeler':'Kardeş projeler',
  'esp.guide.ucu-ortak-bir-tasarim-dili':'Üçü ortak bir tasarım dili paylaşır ama kodları ayrıdır: farklı ad ',
  'esp.guide.tahmin-tablolari':'Tahmin tabloları',
  'esp.guide.dil-ve-okuma-hedeflerinin-su':'Dil ve okuma hedeflerinin süre hesabı bu tablolara dayanır. Kaynağa bağlanınca hesap ',
  'esp.guide.cefr-tablosunu-kaynaga-bagla':'CEFR tablosunu kaynağa bağla',
  'esp.guide.okuma-hizini-kaynaga-bagla':'Okuma hızını kaynağa bağla',
  'esp.guide.esi-kler-nereden-geli-yor':'EŞİKLER NEREDEN GELİYOR?',
  'esp.guide.kaynak-kesinlik-ve-uygulanab':'Kaynak, kesinlik ve uygulanabilirlik birer bilgi; «yetki» ise ',
  'esp.guide.bu-bir-pedagojik-hiyerarsi-d':'Bu bir pedagojik hiyerarşi değildir',
  'esp.guide.esik':'Eşik',
  'esp.guide.politika-surumu':'Politika sürümü',
  'esp.guide.denetim':'Denetim',
  'esp.guide.kayit-sorunlu':'Kayıt sorunlu',
  'esp.guide.denetim-temiz':'Denetim temiz',
  'esp.guide.dolayli-ya-da-kesinligi-dusu':'Dolaylı ya da kesinliği düşük eşikler',
  'esp.guide.rehber-bolumleri':'Rehber bölümleri',
  'esp.guide.hkm-yedegi-yuklendi-sayfa':'HKM yedeği yüklendi — sayfa yenileniyor',
  'esp.guide.yukleme-basarisiz':'Yükleme başarısız: ',
  'esp.guide.once-budanacak-kaydi-sec':'Önce budanacak kaydı seç.',
  'esp.guide.eski-model-ayari-silindi-ofi':'Eski model ayarı silindi; ofis HKM’nin modelini kullanır.',
  'esp.guide.yedek-indirildi':'Yedek indirildi',
  'esp.guide.geri-alinacak-bir-ice-aktarm':'Geri alınacak bir içe aktarma yok',
  'esp.guide.geri-alindi-yeniden-baslatil':'Geri alındı — yeniden başlatılıyor',
  'esp.guide.dosya-okunamadi':'Dosya okunamadı',
  'esp.guide.yer-olmadigi-icin-bu-ice':'Yer olmadığı için bu içe aktarma geri alınamaz — sayfa yenileniyor',
  'esp.guide.rehber':'Rehber',
});
window.LIFEOS.PARCA.sayfa({ id:'guide', modul:'esp', cekmece:'ayarlar', ad:'Genel', ikon:'guide', sira:20 });

ESP.Screens.guide = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C, P = ESP.Parts;
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const sayiMi = v => typeof v === 'number' && isFinite(v);

  const TABS = [
    { id:'kullanim', label:yz('esp.guide.kullanim') },
    { id:'model',    label:yz('esp.guide.ofis') },
    { id:'veri',     label:yz('esp.guide.veri') },
    { id:'sinirlar', label:yz('esp.guide.sinirlar') },
    { id:'kanit',    label:yz('esp.guide.dayanak') },
  ];

  function usageRows(){
    return [
      K.Entry({
        label:yz('esp.guide.nasil-calisir'),
        meta:'üç cümle',
        body:html`
          <ul class="setup__list">
            <li><b>${yz('esp.guide.sen-pratigi-girersin')}</b> ${yz('esp.guide.sure-kart-sayfa-kelime')}</li>
            <li><b>${yz('esp.guide.kural-motoru-hesaplar')}</b> ${yz('esp.guide.retansiyon-temiz-tempo-sente')}</li>
            <li><b>${yz('esp.guide.ajanlar-yalnizca-cumleye-cev')}</b> ${yz('esp.guide.sayi-uretmezler-model-kapali')}</li>
          </ul>`,
      }),

      K.Entry({
        label:yz('esp.guide.sifir-surtunme'),
        meta:'en hızlı yol',
        note:yz('esp.guide.palete-45-dk-gitar-yazip')
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
        label:yz('esp.guide.kisayollar'),
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
        label:yz('esp.guide.merdiven'), hint:'ladder',
        meta:ESP.LEVELS.length - 1 + ' kademe',
        note:yz('esp.guide.her-bolumde-sifirdan-ustatli')
           + 'ölçülebilir basamaklar. Kademe kişiye değil ÜRETİME verilir: '
           + 'üretim durursa kademe de durur.',
        wide:true,
        body:html`
          ${K.Table({ tight:true, headers:['Kademe', 'Ne demek'],
            rows:ESP.LEVELS.map(l => [l.short + ' · ' + l.label, l.note]) })}
          <p class="small muted mt-8">${yz('esp.guide.merdiven-ardisiktir-alttaki')}</p>`,
      }),

      K.Entry({
        label:yz('esp.guide.tezgah'), hint:'desk',
        meta:ESP.Desk.TABS.length + ' sekme',
        note:yz('esp.guide.her-bolumun-altinda-ayni-yer')
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
        label:yz('esp.guide.bolumler'), hint:'modules',
        meta:ESP.Mod.count() + '/' + ESP.DISCIPLINES.length + ' açık',
        note:yz('esp.guide.calismayacagin-bolumu-kapata')
           + 'reçeteye ve denge hesabına girmez, ofiste masası kapanır.',
        body:html`
          ${K.Notice({ tone:'info',
            body:'Kapatmak SİLMEZ. Altı ay sonra geri açtığında kartların, '
              + 'notların ve kademen olduğu yerde durur — «kapalı» ile «yok» '
              + 'ayrı şeylerdir.' })}
          ${K.Button({ label:yz('esp.guide.bolumleri-ac-kapat'), size:'sm', act:'go',
            data:{ 'data-route':'profile' }, class:'mt-10' })}`,
      }),

      K.Entry({
        label:yz('esp.guide.yedi-disiplin'),
        meta:ESP.DISCIPLINES.length + ' alan',
        note:yz('esp.guide.agirliklar-birbirine-yakin-t')
           + 'disiplini görünmez yapar ve kullanıcı onu bırakır.',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Disiplin', 'Ajan', { label:yz('esp.guide.agirlik'), num:true }, 'Ne ölçülür'],
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

  /* MODEL MERKEZ'DE (2026-10-20): seçim, anahtar ve bütçe HKM › Modeller'de;
     bu satır yalnız durumu söyler. Eski yerel ayar kaldıysa silinebilir. */
  function eskiYerelVar(){
    const s = ESP.Office.settings();
    return (s.provider && s.provider !== 'builtin' && ESP.LLM.ready(ESP.Office.cfgFor('patron')))
      || Object.keys(ESP.PROVIDERS || {}).some(id => ESP.LLM.getKeys(id).length);
  }
  function modelRows(){
    const MM = ESP.Office.merkez ? ESP.Office.merkez() : null;
    const d = MM ? MM.durum() : null;
    const bagli = !!(MM && MM.bagli());
    const durum = !bagli ? 'HKM bağlı değil. Ofis kural motoruyla çalışıyor; HKM’ye bağlanınca oradaki model kullanılır.'
      : !d ? 'HKM’ye soruluyor…'
      : d.ok ? 'Model: ' + (d.model || '—') + (d.provider ? ' (' + d.provider + ')' : '')
        + (d.inherited ? ' · ' + (d.from === 'king' ? 'King’in ayarından' : 'üst kademeden') + ' geliyor' : ' · ESP’ye özel atama')
      : (d.note || 'Merkezde model yok.') + ' Ofis kural motoruyla çalışıyor.';
    return [
      K.Entry({
        label:yz('esp.guide.ofis-modeli'),
        meta:bagli && d && d.ok ? 'Merkez’de hazır' : 'kural motoru',
        note:yz('esp.guide.model-anahtar-ve-butce-tek')
           + 'Model kapalıyken ofis kapanmaz; model bir iyileştirmedir.',
        action:bagli ? K.Button({ label:yz('esp.guide.durumu-tazele'), size:'sm', act:'merkez-tazele' }) : '',
        body:html`<p class="small">${durum}</p>
          ${when(eskiYerelVar(), () => K.Notice({ tone:'warn', class:'mt-10', title:yz('esp.guide.bu-cihazda-eski-bir-model'),
            body:html`${yz('esp.guide.merkez-e-ulasilamazsa-yedek')}
              <div class="mt-8">${K.Button({ label:yz('esp.guide.eski-ayari-sil'), size:'sm', tone:'ghost', act:'eski-model-sil' })}</div>` }))}`,
      }),

      K.Entry({
        label:yz('esp.guide.modele-ne-gider'), hint:'brief',
        meta:'yalnızca brifing',
        note:yz('esp.guide.ham-ses-kaydi-tam-taslak')
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
        label:yz('esp.guide.cikti-denetimi'),
        meta:ESP.GROUNDING.banned.length + ' desen',
        note:yz('esp.guide.denetim-metni-yeni-den-yazma')
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
        label:yz('esp.guide.dokuz-aylik-ufuk'), hint:'storage',
        meta:hukum.title,
        note:yz('esp.guide.bu-sistem-dokuz-ay-her')
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
        label:yz('esp.guide.ne-buyuyor'),
        meta:dagilim.length + ' koleksiyon',
        note:yz('esp.guide.toplam-yuzde-hangi-kaydin-si')
           + '«İçerik» işaretli olanlar senin girdiğin veridir ve sistem '
           + 'onları yer açmak için silmez.',
        wide:true,
        body:K.Table({ tight:true,
          headers:['Kayıt', { label:yz('esp.guide.boyut'), num:true }, { label:yz('esp.guide.adet'), num:true }, 'Tür'],
          rows:dagilim.slice(0, 12).map(r => [
            r.label, dp.fmtBytes(r.bytes), String(r.count),
            r.content ? 'içerik' : (r.prunable ? 'budanabilir' : 'sistem'),
          ]) }),
      }),

      ...(budanabilir.length ? [K.Entry({
        label:yz('esp.guide.yer-ac'),
        meta:dp.fmtBytes(budanabilir.reduce((a, b) => a + b.bytes, 0)) + ' budanabilir',
        note:yz('esp.guide.yalnizca-sistemin-kendi-uret')
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
          ${K.Button({ label:yz('esp.guide.secilenleri-buda'), tone:'danger', act:'prune-storage',
            class:'mt-10' })}
          <p class="tiny dim mt-8">${yz('esp.guide.budamadan-once-yedek-almak-i')}</p>`,
      })] : []),

      K.Entry({
        label:yz('esp.guide.nerede-duruyor'),
        meta:ayak.bytes ? Math.round(ayak.bytes / 1024) + ' KB' : '—',
        note:ESP.PRIVACY.storage,
        body:html`
          ${when(ayak.pct != null, () => K.Meter({ label:yz('esp.guide.yerel-kota'), value:ayak.pct,
            text:'%' + ayak.pct }))}
          <p class="small muted mt-8">${yz('esp.guide.depo-anahtari')} <code>esp.v1.${M.activeProfileId()}</code></p>`,
      }),

      K.Entry({
        label:yz('esp.guide.yedek'),
        meta:(function(){ const n = M.backupAgeDays(); return n == null ? 'hiç' : n + ' gün önce'; })(),
        note:yz('esp.guide.yedek-dosyasi-sifresizdir-pa'),
        body:html`
          ${when((window.LIFEOS || {}).GUVEN, () => raw(window.LIFEOS.GUVEN.yedekHtml({
            damga:(S.meta || {}).lastBackup, boyut:ayak.bytes, bugun:U.todayISO(),
            kayit:ayak.total, iz:(S.meta || {}).yedekIzi })))}
          ${when(VT(), () => raw('<div class="mt-10">' + VT().veriNerede({
            merkezNot:(ESP.Beacon && ESP.Beacon.settings().enabled) ? 'bağlı · teklif yazar, modüle yazmaz' : 'isteğe bağlı · şu an kapalı' })
            + '</div><div class="mt-10">' + VT().disaAktar({ act:'export-data2', sistem:'ESP', not:'tüm kayıt · tek dosya', kayit:ayak.total,
              kb:sayiMi(ayak.bytes) ? Math.round(ayak.bytes / 1024) : null }) + '</div>'))}
          <div class="row wrap">
            ${when(!VT(), () => K.Button({ label:yz('esp.guide.yedek-indir'), act:'export-data2' }))}
            ${when((ESP.Beacon && ESP.Beacon.settings().enabled), () => K.Button({ label:yz('esp.guide.hkm-deki-yedekten-yukle'), act:'restore-hkm' }))}
            ${K.Drop({ id:'restore-drop', act:'restore-file',
              label:yz('esp.guide.yedek-dosyasini-buraya-birak') })}
          </div>
          ${K.Notice({ tone:'warn', class:'mt-10', title:yz('esp.guide.dikkat'),
            body:'Yedekten yükleme mevcut verinin TAMAMINI değiştirir. Yüklemeden '
              + 'önce mevcut veriyi indir; yanlış yükledin diyorsan bir sonraki '
              + 'yükleme veya profil silmeye kadar geri alabilirsin.' })}
          ${when(undo, () => html`<div class="mt-10">${K.Notice({ tone:'warn',
            body:new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki yedekten yükleme mevcut '
               + 'verinin üzerine yazdı.' })}</div>
            <div class="mt-8">${K.Button({ label:yz('esp.guide.bu-ice-aktarmayi-geri-al'), tone:'danger', act:'undo-import' })}</div>`)}`,
      }),

      K.Entry({
        label:yz('esp.guide.her-seyi-sil'),
        meta:'geri alınamaz',
        body:html`
          ${K.Button({ label:yz('esp.guide.bu-profilin-verisini-sil'), act:'wipe-data' })}
          <p class="small muted mt-8">${yz('esp.guide.yalnizca-acik-profilin-veris')}</p>`,
      }),
      when(window.LIFEOS && window.LIFEOS.OrnekKip, () => K.Entry({ label:yz('esp.guide.ornek-veriyle-dene'),
        body:raw(window.LIFEOS.OrnekKip.ayarHtml(!!(ESP.Ornek && ESP.Ornek.acik()))) })),
      /* Karşılama (2026-10-18): girişteki italik selam ve bölümün notu (brand/ortak/karsilama.js). */
      when(window.LIFEOS && window.LIFEOS.KARSILAMA, () => K.Entry({ label:yz('esp.guide.karsilama'), meta:'girişteki selam ve not',
        body:raw(window.LIFEOS.KARSILAMA.ayarHtml('esp')) })),
    ].filter(Boolean);
  }

  function limitRows(){
    return [
      K.Entry({
        label:yz('esp.guide.pedagojik-sinir'), hint:'pedagogic',
        meta:'değişmez',
        body:html`
          ${K.Notice({ tone:'info', body:ESP.PEDAGOGIC.disclaimer })}
          <p class="small muted mt-10">${ESP.PEDAGOGIC.level}</p>`,
      }),

      K.Entry({
        label:yz('esp.guide.doktrin'),
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
        label:yz('esp.guide.oncelik-sirasi'), hint:'precedence',
        meta:ESP.PRECEDENCE.length + ' kural',
        body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Kural', 'Neden'],
          rows:ESP.PRECEDENCE.map(p => [String(p.rank), p.label, p.note]) }),
      }),

      K.Entry({
        label:yz('esp.guide.yapilmayacaklar'),
        meta:'bir eksiklik değil, bir karar',
        note:yz('esp.guide.bunlar-unutulmadi-reddedildi'),
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
        label:yz('esp.guide.kardes-projeler'),
        meta:'aynı depo',
        note:yz('esp.guide.ucu-ortak-bir-tasarim-dili')
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
     olmak anlamina gelmez. "Kart hatırlama >= 0,75" kodda kesindir; 0,75'in
     kendisi bu sistemin secimidir ve bunu gizlemek, bir tasarim tercihini
     bulgu gibi sunmak olurdu. */
  /* Madde 11: hedef paketlerinin tahmin tabloları ve dayanağı. «Kaynağa
     bağla» King'e esp.belge ister; sonuç Bugün'e teklif olarak gelir. */
  function dayanakEntry(){
    const c = ESP.Belge ? ESP.Belge.dayanak('cefr') : null;
    const o = ESP.Belge ? ESP.Belge.dayanak('okumaHizi') : null;
    const T = ESP.Hedefler.cefrTablo();
    return K.Entry({
      label:yz('esp.guide.tahmin-tablolari'), hint:'evidence',
      meta:(c ? 'CEFR kaynaklı' : 'CEFR kaynak bekliyor') + ' · ' + (o ? 'okuma hızı kaynaklı' : 'okuma hızı kaynak bekliyor'),
      note:yz('esp.guide.dil-ve-okuma-hedeflerinin-su')
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
          ${K.Button({ label:yz('esp.guide.cefr-tablosunu-kaynaga-bagla'), size:'sm', act:'dayanak-iste', data:{ 'data-alan':'cefr' } })}
          ${K.Button({ label:yz('esp.guide.okuma-hizini-kaynaga-bagla'), size:'sm', act:'dayanak-iste', data:{ 'data-alan':'okuma_hizi' } })}
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
        label:yz('esp.guide.esi-kler-nereden-geli-yor'), hint:'evidence',
        meta:kapsam.total + ' kayıt',
        note:yz('esp.guide.kaynak-kesinlik-ve-uygulanab')
           + 'ESP\'nin kararıdır — hangi kaynağa dayanarak kademe '
           + 'ilerletebileceğini söyler.',
        wide:true,
        body:html`
          ${(function(){
            /* Uyarının ilk cümlesi görünür; gerekçe bir dokunuşla açılır (§1.2). */
            const c = String(ESP.Ev.policy().disclaimer).split(/(?<=\.)\s+/);
            return K.Notice({ tone:'warn', title:yz('esp.guide.bu-bir-pedagojik-hiyerarsi-d'),
              body:K.Ayrinti({ ozet:c[0], govde:html`${when(c.length > 1, () => html`<p>${c.slice(1).join(' ')}</p>`)}
                <p class="mt-8">${ESP.Ev.policy().rationale}</p>` }) });
          })()}
          ${K.Table({ tight:true,
            headers:['Kaynak türü', 'Tanınan yetki', { label:yz('esp.guide.esik'), num:true }],
            rows:ESP.EVIDENCE_SOURCES.map(src => {
              const y = ESP.EVIDENCE_AUTHORITY.filter(a =>
                a.id === ESP.Ev.policy().defaults[src.id])[0];
              return [src.label, y.label + ' — ' + y.note,
                String(kapsam.bySource[src.id] || 0)];
            }) })}
          <p class="tiny dim mt-8">${yz('esp.guide.politika-surumu')} ${ESP.Ev.policy().version}
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
        label:yz('esp.guide.denetim'),
        meta:denetim.length ? denetim.length + ' sorun' : 'temiz',
        body:html`
          ${denetim.length
            ? K.Notice({ tone:'danger', title:yz('esp.guide.kayit-sorunlu'),
                body:denetim.map(d => d.rule + ' (' + d.kind + ')').join(', ') })
            : K.Notice({ tone:'ok', title:yz('esp.guide.denetim-temiz'),
                body:'Her kayıt çözülebiliyor, her atıf yazılı ve sistem ayarı '
                   + 'olan her eşik gerekçesini taşıyor. Bu denetim testte de '
                   + 'koşar; bozulursa test kırılır.' })}
          ${when(ayrisan.length, () => K.Notice({ tone:'info',
            title:yz('esp.guide.dolayli-ya-da-kesinligi-dusu'),
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

  LIFEOS.PARCA.blok({ id:'guide.rehber-sekmeleri', sayfa:'guide', yer:'y1', sira:10, ad:'Rehber sekmeleri', ciz(){
    return K.Span(12, ESP.Parts.bolumler(null, { act:'guide-tab', aria:yz('esp.guide.rehber-bolumleri'), tabs:TABS, govde:GOVDE }));
  } });
  LIFEOS.PARCA.blok({ id:'guide.kolaylik-pusulasi', sayfa:'guide', yer:'y2', sira:10, ad:'Kolaylık pusulası', ciz(){
    return K.Span(12, html`${raw(window.LIFEOS && window.LIFEOS.PUSULA ? window.LIFEOS.PUSULA.satirHtml() : '')}`);
  } });
  function render(){
    /* Pusula (KOLAY-PLANI §1) sayfanın başında. */
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('guide', 'y2', K, undefined, typeof raw === 'undefined' ? null : raw)}
      ${LIFEOS.PARCA.yer('guide', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
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
            ESP.UI.toast(yz('esp.guide.hkm-yedegi-yuklendi-sayfa'));
            setTimeout(() => location.reload(), 900);
          }catch(e){
            ESP.UI.toast(yz('esp.guide.yukleme-basarisiz') + (e && e.message ? e.message : 'bilinmeyen hata'));
          }
        }, true, 'Bu cihazdaki veriyi yedekle değiştir');
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
      if(!secili.length){ ESP.UI.toast(yz('esp.guide.once-budanacak-kaydi-sec')); return; }
      const r = await ESP.Storage.prune(secili);
      if(!r.ok){ ESP.UI.toast(r.error); return; }
      ESP.UI.toast(ESP.Storage.fmtBytes(r.freed) + ' yer açıldı.');
      ESP.App.render();
    },

    async 'merkez-tazele'(){
      const MM = ESP.Office.merkez ? ESP.Office.merkez() : null;
      if(MM) await MM.tazele();
      ESP.App.render();
    },
    async 'eski-model-sil'(){
      Object.keys(ESP.PROVIDERS || {}).forEach(id => { while(ESP.LLM.getKeys(id).length) ESP.LLM.removeKeyAt(id, 0); });
      await ESP.Office.saveSettings({ provider:'builtin', model:'default', endpoint:'', perAgent:{} });
      ESP.UI.toast(yz('esp.guide.eski-model-ayari-silindi-ofi'));
      ESP.App.render();
    },

    /* 173 yedek kartının düğmesi: aynı dışa aktarma. */
    async 'yedek-al'(){ await handle['export-data2'](); },
    async 'export-data2'(){
      const veri = await ESP.Store.exportAll();
      const blob = new Blob([JSON.stringify(veri, null, 2)], { type:'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'esp-yedek-' + U.todayISO() + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      await M.markBackup();
      ESP.UI.toast(yz('esp.guide.yedek-indirildi'));
      ESP.App.render();
    },

    async 'wipe-data'(){
      const G = (window.LIFEOS || {}).GUVEN;
      if(G && G.kapiAc){
        const yedek = await ESP.Store.exportAll();
        G.kapiAc({ baslik:yz('esp.guide.bu-profilin-verisini-sil'), not:(window.LIFEOS && window.LIFEOS.HESAP ? window.LIFEOS.HESAP.silmeNotu() : null), nesne:'kaydı', sayi:Object.keys(yedek.data || yedek || {}).length,
          sheet:o => ESP.UI.sheet(o), yedekAl:() => handle['export-data2'](),
          sil:async () => { await ESP.Store.clear(); location.reload(); } });
        return;
      }
      ESP.UI.confirmSheet('Bu profilin verisi silinsin mi?',
        'Bütün oturumlar, kartlar, tezler, notlar ve taslaklar kalkar. '
        + 'Bu işlem geri alınamaz.',
        async () => { await ESP.Store.clear(); location.reload(); }, true, 'Bütün veriyi sil');
    },

    async 'undo-import'(){
      const undo = ESP.Store.importUndoInfo();
      if(!undo){ ESP.UI.toast(yz('esp.guide.geri-alinacak-bir-ice-aktarm')); return; }
      ESP.UI.confirmSheet('İçe aktarmayı geri al',
        new Date(undo.at).toLocaleString('tr-TR')+' tarihindeki içe aktarma öncesine dönülecek. '
          + 'Aradan geçen sürede eklediğin her şey kaybolur.',
        async () => {
          try{
            await ESP.Store.undoImport();
            ESP.UI.toast(yz('esp.guide.geri-alindi-yeniden-baslatil'));
            setTimeout(() => location.reload(), 900);
          }catch(e){
            ESP.UI.toast(e && e.message ? e.message : 'Geri alınamadı');
          }
        }, true, 'İçe aktarma öncesine dön');
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
      catch(e){ ESP.UI.toast(yz('esp.guide.dosya-okunamadi')); return; }

      const okuma = ESP.Store.readBackup(obj);
      if(!okuma.ok){ ESP.UI.toast(okuma.error || 'Geçersiz yedek'); return; }

      ESP.UI.confirmSheet('Yedekten yüklensin mi?',
        'Mevcut verinin TAMAMI bu yedekle değişir ve geri alınamaz. '
        + 'Devam etmeden önce mevcut veriyi indirmen önerilir.',
        async () => {
          try{
            const meta = await ESP.Store.importAll(obj);
            if(meta.geriAlinamaz){
              ESP.UI.toast(yz('esp.guide.yer-olmadigi-icin-bu-ice'));
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
        }, true, 'Veriyi yedekle değiştir');
    },
  };

  return {
    id:'guide',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    kucukVarsayilan:['eşikler-nereden-geliyor', 'yayımlanmış-çerçeve', 'öğrenme-araştırması', 'kendi-ölçümün', 'sistem-ayarı', 'denetim', 'tahmin-tabloları', 'kardeş-projeler', 'doktrin'],
    title:yz('esp.guide.rehber'),
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
