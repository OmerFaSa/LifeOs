/* Profil — kişi, odak, görünüm ve veri.

   Burada sorulan her alanın karşılığı vardır ve karşılığı yazar. Sorulmayan
   şey de kasıtlıdır: yaş, cinsiyet, kilo. Hiçbir hesap bunlara dayanmaz —
   retansiyon, temiz BPM ve okunabilirlik kişisel ölçüden bağımsızdır.

   Profil geçişi sayfayı yeniden yükler: yarım kalmış bir yazma işleminin
   yanlış profile düşmesi böylece imkânsızdır. */
window.LIFEOS.PARCA.yazilar({
  'esp.profile.danisma-da-hatirla-diye-de':'Uzmana sor ekranında «hatırla: …» diye de yazabilirsin.',
  'esp.profile.kucuk-hatirlatici-hedef-odak':'Küçük: hatırlatıcı, hedef, odak. Bölüm ve günlük taban her zaman önce sorulur.',
  'esp.profile.vade-gunu-saat':'Vade günü saat ',
  'esp.profile.tamamen-kapatmak-icin-yukari':'Tamamen kapatmak için yukarıda «Hayır» seç.',
  'esp.profile.her-profil-kendi-depo-anahta':'Her profil kendi depo anahtarında yaşar (esp.v1.',
  'esp.profile.profil-gecisi-sayfayi-yenide':'Profil geçişi sayfayı yeniden yükler.',
  'esp.profile.model-ayari-hkm-dedir-hkm':'Model ayarı HKM’dedir (HKM › Modeller › «ESP · Sohbet»); bu cihazda anahtar tutulmaz.',
  'esp.profile.henuz-yedek-alinmadi':'Henüz yedek alınmadı.',
  'esp.profile.yerel-kota-bu-tarayicida-olc':'Yerel kota bu tarayıcıda ölçülemiyor. Ölçülemeyen bir ',
  'esp.profile.yedek-otuz-gunden-eski-veri':'Yedek otuz günden eski. Veri bu cihazda tutuluyor; ',
  'esp.profile.son-gonderim-basarili':'Son gönderim başarılı',
  'esp.profile.son-deneme-basarisiz':'Son deneme başarısız',
  'esp.profile.henuz-hic-gonderilmedi':'Henüz hiç gönderilmedi.',
  'esp.profile.bu-adrese-gonderim-yapilmaz':'Bu adrese gönderim yapılmaz: yerel olmayan bir adrese düz http ',
  'esp.profile.govde-sozlesmeyi-gecmiyor':'Gövde sözleşmeyi geçmiyor: ',
  'esp.profile.bu-tur-sormadan-uygulanacak':'Bu tür sormadan uygulanacak; geri alınabilir',
  'esp.profile.bu-tur-her-zaman-once':'Bu tür her zaman önce sorulacak',
  'esp.profile.hkm-isareti-acildi':'HKM işareti açıldı',
  'esp.profile.hkm-isareti-kapatildi':'HKM işareti kapatıldı',
  'esp.profile.gonderilemedi':'Gönderilemedi (',
  'esp.profile.bu-tarihlerde-gunluk-sure-de':'Bu tarihlerde günlük süre değişsin mi?',
  'esp.profile.kaldirildi-o-gunler-temel-su':'Kaldırıldı; o günler temel süreye döndü',
  'esp.profile.bolum-acildi':'Bölüm açıldı',
  'esp.profile.bolum-kapandi-verisi-duruyor':'Bölüm kapandı — verisi duruyor',
  'esp.profile.profil-silinsin-mi':'Profil silinsin mi?',
  'esp.profile.bu-profilin-butun-verisi-bu':'Bu profilin bütün verisi bu cihazdan kalkar ve geri alınamaz.',
  'esp.profile.profili-ve-verisini-sil':'Profili ve verisini sil',
  'esp.profile.bildirim-izni-kapali-iphone':'Bildirim izni kapalı: iPhone Ayarlar › LifeOS › Bildirimler’den aç.',
  'esp.profile.bildirim-izni-alinamadi':'Bildirim izni alınamadı.',
  'esp.profile.acik':'Açık · ',
  'esp.profile.telefon-bildirimi-kapandi':'Telefon bildirimi kapandı',
  'esp.profile.her-istek-once-sorulacak':'Her istek önce sorulacak',
  'esp.profile.senin-istedigin-kucuk-isler':'Senin istediğin küçük işler sormadan uygulanacak',
  'esp.profile.profil-henuz-doldurulmadi':'Profil henüz doldurulmadı.',
  'esp.profile.yas-cinsiyet-ve-kilo-sorulma':'Yaş, cinsiyet ve kilo sorulmaz: hiçbir hesap bunlara dayanmıyor. ',
  'esp.profile.sorulan-tek-sey-ne-calistigi':'Sorulan tek şey ne çalıştığın.',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'esp.profile.hafizam':'Hafızam',
  'esp.profile.ofisin-senin-hakkinda-hatirl':'Ofisin senin hakkında hatırladıkları; bu cihazda durur, HKM bağlıysa King de görür. ',
  'esp.profile.unut':'Unut',
  'esp.profile.hatirlanacak-sey':'Hatırlanacak şey',
  'esp.profile.orn-sabahlari-daha-iyi-okuru':'Örn. Sabahları daha iyi okurum',
  'esp.profile.hatirla':'Hatırla',
  'esp.profile.model-hafizaya-yazamaz-senin':'Model hafızaya yazamaz: «senin sözün»ü yalnız sen yazarsın, «tahmin» etiketli kayıtlar kural motorundan gelir ve silinebilir.',
  'esp.profile.belirli-gunler-icin-farkli-s':'Belirli günler için farklı süre',
  'esp.profile.yogun-ya-da-vakitsiz-gunler':'Yoğun ya da vakitsiz günler için. Temel (',
  'esp.profile.baslangic':'Başlangıç',
  'esp.profile.bitis':'Bitiş',
  'esp.profile.gunluk-sure-dakika':'Günlük süre (dakika)',
  'esp.profile.ekle':'Ekle',
  'esp.profile.kaldir':'Kaldır',
  'esp.profile.kisi':'Kişi',
  'esp.profile.ad-yalnizca-sana-seslenmek-i':'Ad yalnızca sana seslenmek için tutulur ve hiçbir modele gönderilmez.',
  'esp.profile.ad':'Ad',
  'esp.profile.odak':'Odak',
  'esp.profile.enstruman':'Enstrüman',
  'esp.profile.calisilan-dil':'Çalışılan dil',
  'esp.profile.gunluk-pratik-tabani-dakika':'Günlük pratik tabanı (dakika)',
  'esp.profile.kaydet':'Kaydet',
  'esp.profile.bolumler':'Bölümler',
  'esp.profile.kapattigin-bolum-gezinmeden':'Kapattığın bölüm gezinmeden kalkar, reçeteye ve denge hesabına ',
  'esp.profile.en-az-bir-bolum-acik':'En az bir bölüm açık kalmak zorunda: hepsi kapalı bir ESP, açılış ekranından ibaret bir kabuktur.',
  'esp.profile.patron-a-da-soyleyebilirsin':'Patron’a da söyleyebilirsin: «diksiyon çalışmak istemiyorum», «gitarı tekrar aç». Önce ne olacağını söyler, sonra onaylarsın.',
  'esp.profile.kucuk-istekler-sormadan-uygu':'Küçük istekler sormadan uygulansın mı?',
  'esp.profile.yalniz-benim-istediklerim-on':'Yalnız benim istediklerim (önerilir)',
  'esp.profile.hicbiri-her-seyi-once':'Hiçbiri — her şeyi önce sor',
  'esp.profile.tur-tur-actigin-kucuk-tur':'Tür tür: açtığın küçük tür sormadan uygulanır, kapattığın her zaman sorar. Orta ve büyük türler kilitlidir.',
  'esp.profile.hatirlaticilar-telefonda-bil':'Hatırlatıcılar telefonda bildirim olsun mu?',
  'esp.profile.hayir':'Hayır',
  'esp.profile.evet-telefon-bildirimi':'Evet, telefon bildirimi',
  'esp.profile.kurulu-bildirimler':'Kurulu bildirimler',
  'esp.profile.esp-hatirlatici':'ESP · hatırlatıcı',
  'esp.profile.gorunum':'Görünüm',
  'esp.profile.ayni-tercih-ust-cubuktaki-go':'Aynı tercih üst çubuktaki görünüm düğmesinden de açılır ve ikisi aynı ',
  'esp.profile.gizlilik-kilidi':'Gizlilik kilidi',
  'esp.profile.profiller':'Profiller',
  'esp.profile.gec':'Geç',
  'esp.profile.sil':'Sil',
  'esp.profile.yeni-profil-adi':'Yeni profil adı',
  'esp.profile.model':'Model',
  'esp.profile.model-bir-iyilestirmedir-ger':'Model bir iyileştirmedir, gereklilik değil: kapalıyken ofis ',
  'esp.profile.durumu-gor':'Durumu gör',
  'esp.profile.veri':'Veri',
  'esp.profile.yerel-kota':'Yerel kota',
  'esp.profile.yedek-indir':'Yedek indir',
  'esp.profile.yedekten-yukle':'Yedekten yükle',
  'esp.profile.sinir':'Sınır',
  'esp.profile.hkm-isareti':'HKM işareti',
  'esp.profile.bu-anahtar-neyi-acar':'Bu anahtar neyi açar?',
  'esp.profile.i-sareti-ac-varsayilan-kapal':'İşareti aç (varsayılan kapalı)',
  'esp.profile.hkm-adresi':'HKM adresi',
  'esp.profile.yerel-jeton':'Yerel jeton',
  'esp.profile.hkm-jetonu':'HKM jetonu',
  'esp.profile.en-sik-kac-dakikada-bir':'En sık kaç dakikada bir',
  'esp.profile.gonderim-araligi':'Gönderim aralığı',
  'esp.profile.kapsam':'Kapsam',
  'esp.profile.gonderim-kapsami':'Gönderim kapsamı',
  'esp.profile.bugun-ne-gidiyor':'Bugün ne gidiyor',
  'esp.profile.deger':'Değer',
  'esp.profile.gunun-ozetinde-kart-metni-no':'Günün özetinde kart metni, not içeriği ve kitap adı GİTMEZ (tam yedekte vardır). Giden şey bu dört sayıdır; değeri olmayan alan «veri yok» gider, sıfır değil.',
  'esp.profile.baglan':'Bağlan',
  'esp.profile.simdi-gonder':'Şimdi gönder',
  'esp.profile.gecmisi-gonder-60-gun':'Geçmişi gönder (60 gün)',
  'esp.profile.capraz-bulgu-gecmi-s-ister-g':'Çapraz bulgu GEÇMİŞ ister. Geçmiş gönderimi yalnızca geriye dönük hesaplanabilen alanları yollar: retansiyon bugünün kart durumundan türetildiği için dünün tarihiyle gönderilmez.',
  'esp.profile.gecmis-gonderiliyor':'Geçmiş gönderiliyor…',
  'esp.profile.gunluk-sure':'Günlük süre ',
  'esp.profile.ad-bos-olamaz':'Ad boş olamaz',
  'esp.profile.kaydedildi':'Kaydedildi',
  'esp.profile.profil-eklendi':'Profil eklendi',
  'esp.profile.yedek-indirildi':'Yedek indirildi',
  'esp.profile.yedekten-yukleme-rehber-veri':'Yedeği geri yüklemek için Ayarlar’da veri bölümünü aç',
  'esp.profile.profil':'Profil',
  'esp.profile.acik-bolum':'açık bölüm',
  'esp.profile.son-yedek':'son yedek',
});
window.LIFEOS.PARCA.sayfa({ id:'profile', modul:'esp', cekmece:'ayarlar', ad:'Profil', ikon:'sliders', sira:10 });

ESP.Screens.profile = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  /* HAFIZAM — ofisin senin hakkinda hatirladiklari (core/hafiza.js, ortak).
     Model yazamaz; «senin sozun»u yalniz sen yazarsin. */
  function hafizaEntry(){
    if(!ESP.Hafizam) return '';
    const H = window.LIFEOS.Hafiza;
    const l = ESP.Hafizam.etkin();
    return K.Entry({
      label:yz('esp.profile.hafizam'),
      meta:l.length ? l.length + ' kayıt' : 'boş',
      note:yz('esp.profile.ofisin-senin-hakkinda-hatirl')
         + yz('esp.profile.danisma-da-hatirla-diye-de'),
      wide:true,
      body:html`
        <div class="stack-xs">${map(l, x => html`
          <div class="row gap-8" style="justify-content:space-between;align-items:flex-start">
            <span class="small"><span class="tiny muted">${H.KATMANLAR[x.katman].ad}</span><br/>${x.metin}</span>
            ${K.Button({ label:yz('esp.profile.unut'), size:'sm', tone:'ghost', act:'hafiza-unut', data:{ 'data-id':x.id } })}
          </div>`)}</div>
        <div class="row gap-8 mt-10">
          ${K.Input({ id:'hafiza-yeni', class:'grow', aria:yz('esp.profile.hatirlanacak-sey'),
            placeholder:yz('esp.profile.orn-sabahlari-daha-iyi-okuru') })}
          ${K.Button({ label:yz('esp.profile.hatirla'), size:'sm', act:'hafiza-ekle' })}
        </div>
        <p class="small muted mt-8">${yz('esp.profile.model-hafizaya-yazamaz-senin')}</p>`,
    });
  }

  /* Tarihli günlük süre (core/gunsure.js): yoğun gün ya da az vakitli
     günler. Temel taban değişmez; tarihi geçince kendiliğinden döner. */
  function gunSureEntry(p){
    const G = ESP.GunSure;
    if(!G) return '';
    const bugun = U.todayISO();
    const liste = G.gecerliListe();
    return K.Entry({
      label:yz('esp.profile.belirli-gunler-icin-farkli-s'),
      meta:liste.length ? liste.length + ' kayıt' : 'yok',
      note:yz('esp.profile.yogun-ya-da-vakitsiz-gunler') + U.fmtMin(p.dailyMinutes || 60)
         + ') değişmez; tarih geçince geri gelir.',
      wide:true,
      body:html`
        <div class="cols-3">
          ${K.Field({ label:yz('esp.profile.baslangic'), input:K.Input({ id:'gs-bas', type:'date', value:bugun, min:bugun }) })}
          ${K.Field({ label:yz('esp.profile.bitis'), hint:'tek gün için boş bırak',
            input:K.Input({ id:'gs-bit', type:'date', min:bugun }) })}
          ${K.Field({ label:yz('esp.profile.gunluk-sure-dakika'),
            input:K.Input({ id:'gs-dk', type:'number', numeric:true, min:G.DAKIKA.min, max:G.DAKIKA.max,
              placeholder:String(p.dailyMinutes || 60) }) })}
        </div>
        ${K.Button({ label:yz('esp.profile.ekle'), act:'gunsure-ekle', class:'mt-10' })}
        ${liste.length ? html`<ul class="stack-xs mt-10">${liste.map(k => html`<li class="row between">
          <span class="small">${k.bas === k.bit ? U.fmtDate(k.bas) : U.fmtRange(k.bas, k.bit)} · ${U.fmtMin(k.dakika)}</span>
          ${K.Button({ label:yz('esp.profile.kaldir'), size:'sm', act:'gunsure-sil', data:{ 'data-id':k.id } })}
        </li>`)}</ul>` : ''}`,
    });
  }

  LIFEOS.PARCA.blok({ id:'profile.kisi-bilgileri', sayfa:'profile', yer:'y1', sira:10, ad:'Kişi bilgileri', ciz({ p, ayak, yedek, profiller }){
    return K.Span(12, K.Ledger(() => [

        K.Entry({
          label:yz('esp.profile.kisi'),
          meta:p.name || 'adsız',
          note:yz('esp.profile.ad-yalnizca-sana-seslenmek-i'),
          body:html`
            <div class="cols-3">
              ${K.Field({ label:yz('esp.profile.ad'),
                input:K.Input({ id:'pf-name', value:p.name || '' }) })}
              ${K.Field({ label:yz('esp.profile.odak'), hint:'eşit skorlu iki iş çıkarsa sırayı belirler',
                input:K.Select({ id:'pf-focus', value:p.focus || 'balanced',
                  options:ESP.FOCUS.map(f => ({ value:f.id, label:f.label })) }) })}
              ${K.Field({ label:yz('esp.profile.enstruman'),
                input:K.Input({ id:'pf-instrument', value:p.instrument || '' }) })}
            </div>
            <div class="cols-2 mt-10">
              ${K.Field({ label:yz('esp.profile.calisilan-dil'),
                input:K.Select({ id:'pf-lang', value:(p.langs && p.langs[0]) || 'en',
                  options:ESP.LANGS.map(l => ({ value:l.id, label:l.label })) }) })}
              ${K.Field({ label:yz('esp.profile.gunluk-pratik-tabani-dakika'),
                hint:'alt sınır, hedef değil',
                input:K.Input({ id:'pf-minutes', type:'number', numeric:true, min:10, max:600,
                  value:p.dailyMinutes || 60 }) })}
            </div>
            ${K.Button({ label:yz('esp.profile.kaydet'), tone:'primary', act:'save-profile', class:'mt-10' })}
            <p class="small muted mt-10">
              ${(ESP.FOCUS.find(f => f.id === (p.focus || 'balanced')) || {}).note || ''}</p>`,
        }),

        gunSureEntry(p),

        K.Entry({
          label:yz('esp.profile.bolumler'), hint:'modules',
          meta:ESP.Mod.count() + '/' + ESP.DISCIPLINES.length + ' açık',
          note:yz('esp.profile.kapattigin-bolum-gezinmeden')
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
            <p class="small muted mt-10">${yz('esp.profile.en-az-bir-bolum-acik')}</p>
            <p class="small muted mt-8">${yz('esp.profile.patron-a-da-soyleyebilirsin')}</p>
            <div class="mt-10">${K.Field({ label:yz('esp.profile.kucuk-istekler-sormadan-uygu'),
              hint:yz('esp.profile.kucuk-hatirlatici-hedef-odak'),
              input:K.Select({ id:'pf-otomatik', value:ESP.Office.settings().otomatikUygula || 'istek',
                change:'pick-otomatik', options:[
                  { value:'istek', label:yz('esp.profile.yalniz-benim-istediklerim-on') },
                  { value:'hicbiri', label:yz('esp.profile.hicbiri-her-seyi-once') },
                ] }) })}</div>
            ${when((window.LIFEOS || {}).ONERI, () => html`<div class="mt-12">
              <p class="small muted">${yz('esp.profile.tur-tur-actigin-kucuk-tur')}</p>
              ${raw(window.LIFEOS.ONERI.ayarHtml(ESP.Plans.KINDS.map(k => Object.assign({ title:k.label }, k)),
                { mod:ESP.Office.settings().otomatikUygula || 'istek', turler:ESP.Office.settings().otomatikTurler || {} }))}</div>`)}
            ${when(window.LIFEOS && window.LIFEOS.BILDIRIM && window.LIFEOS.BILDIRIM.var(), () => html`<div class="mt-12">${K.Field({
              label:yz('esp.profile.hatirlaticilar-telefonda-bil'),
              hint:yz('esp.profile.vade-gunu-saat') + ESP.Takvim.BILDIRIM_SAAT + '’da, ESP kapalıyken de. Önümüzdeki '
                + ESP.Takvim.PLAN_GUN + ' gün kurulur; uygulamayı bir hafta açmazsan susar.',
              input:K.Select({ id:'pf-telbildirim', value:ESP.Office.settings().telefonBildirim ? 'acik' : 'kapali',
                change:'pick-telbildirim', options:[
                  { value:'kapali', label:yz('esp.profile.hayir') },
                  { value:'acik', label:yz('esp.profile.evet-telefon-bildirimi') },
                ] }) })}
              ${when(ESP.Office.settings().telefonBildirim, () => html`<div class="mt-10">${K.Button({ label:yz('esp.profile.kurulu-bildirimler'), size:'sm',
                data:{ 'data-tb-ac':'1', 'data-tb-not':yz('esp.profile.tamamen-kapatmak-icin-yukari') } })}</div>
                ${when(window.LIFEOS.VITRIN && window.LIFEOS.VITRIN.bildirimKutusu, () => raw('<div class="mt-10">'
                  + window.LIFEOS.VITRIN.bildirimKutusu({ modul:'esp', turler:[{ id:'hatirlatici', ad:yz('esp.profile.esp-hatirlatici') }] }) + '</div>'))}`)}</div>`)}`,
        }),

        hafizaEntry(),

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
           çağırır — ayrı bir yol açmaz. Paletler ve beş düzen kullanıcı
           kararıyla kalktı (§8-4): yalnız tema kaldı. */
        K.Entry({
          label:yz('esp.profile.gorunum'),
          meta:({ system:'Sistem', light:'Açık', dark:'Koyu' })[p.theme || 'system'] || 'Sistem',
          note:yz('esp.profile.ayni-tercih-ust-cubuktaki-go')
             + 'kaydı kullanır. Tek tasarım: renk modülü söyler.',
          wide:true,
          body:html`
            ${K.SectionTitle('Tema')}
            ${K.TemaSecici({ value:p.theme || 'system', act:'set-theme' })}`,
        }),

        /* Gizlilik kilidi (176, T5): kutu kendi içinde değişir. */
        window.LIFEOS && window.LIFEOS.KILIT ? K.Entry({ label:yz('esp.profile.gizlilik-kilidi'), wide:true,
          meta:window.LIFEOS.KILIT.aktifMi('esp') ? 'açık' : 'kapalı',
          body:raw(window.LIFEOS.KILIT.ayarHtml('esp', { govde:true })) }) : '',

        K.Entry({
          label:yz('esp.profile.profiller'),
          meta:profiller.length + ' profil',
          note:(yz('esp.profile.her-profil-kendi-depo-anahta') + '<profil>). ')
             + yz('esp.profile.profil-gecisi-sayfayi-yenide'),
          body:html`
            ${K.Table({ tight:true, headers:['Profil', 'Durum', ''],
              rows:profiller.map(x => [
                x.name || x.id,
                x.id === M.activeProfileId() ? 'açık' : '—',
                html`${when(x.id !== M.activeProfileId(), () => html`
                  ${K.Button({ label:yz('esp.profile.gec'), size:'sm', act:'switch-profile',
                    data:{ 'data-id':x.id } })}
                  ${K.Button({ label:yz('esp.profile.sil'), size:'sm', act:'remove-profile',
                    data:{ 'data-id':x.id } })}`)}`,
              ]) })}
            <div class="row mt-10">
              ${K.Input({ id:'pf-new', placeholder:yz('esp.profile.yeni-profil-adi'),
                aria:yz('esp.profile.yeni-profil-adi') })}
              ${K.Button({ label:yz('esp.profile.ekle'), act:'add-profile' })}
            </div>`,
        }),

        K.Entry({
          label:yz('esp.profile.model'),
          meta:ESP.Office.ready('patron') ? 'bağlı' : 'bağlı değil',
          note:yz('esp.profile.model-bir-iyilestirmedir-ger')
             + 'kural motorunun cümlesiyle çalışmaya devam eder.',
          action:K.Button({ label:yz('esp.profile.durumu-gor'), size:'sm', act:'go',
            data:{ 'data-route':'guide' } }),
          body:K.Notice({ tone:'info',
            body:yz('esp.profile.model-ayari-hkm-dedir-hkm') }),
        }),

        K.Entry({
          label:yz('esp.profile.veri'),
          meta:ayak.bytes ? Math.round(ayak.bytes / 1024) + ' KB' : '—',
          note:yedek == null ? yz('esp.profile.henuz-yedek-alinmadi')
            : yedek + ' gün önce yedeklendi.',
          body:html`
            ${ayak.pct != null
              ? K.Meter({ label:yz('esp.profile.yerel-kota'), value:ayak.pct, text:'%' + ayak.pct,
                  tone:ayak.full ? 'danger' : (ayak.near ? 'warn' : null),
                  note:ayak.limit
                    ? Math.round(ayak.bytes / 1024) + ' KB / '
                      + Math.round(ayak.limit / 1024) + ' KB'
                    : null })
              : K.Notice({ tone:'info',
                  body:yz('esp.profile.yerel-kota-bu-tarayicida-olc')
                    + 'oran yüzde olarak gösterilmez.' })}
            <div class="row wrap mt-10">
              ${K.Button({ label:yz('esp.profile.yedek-indir'), act:'export-data' })}
              ${K.Button({ label:yz('esp.profile.yedekten-yukle'), act:'import-data' })}
            </div>
            ${when(M.backupDue(), () => K.Notice({ tone:'warn',
              body:yz('esp.profile.yedek-otuz-gunden-eski-veri')
                + 'cihaz kaybolursa veri de kaybolur.' }))}`,
        }),

        /* HKM isareti — dorduncu katman ISTEGE BAGLI ve varsayilan KAPALI.
           Ne gonderildigi acik olsun olmasin satir satir gosterilir:
           gormeden acilan bir gonderim, onay degildir. */
        hkmEntry(),

        K.Entry({
          label:yz('esp.profile.sinir'), hint:'pedagogic',
          meta:'değişmez',
          body:html`
            ${K.Notice({ tone:'info', body:ESP.PEDAGOGIC.disclaimer })}
            <p class="small muted mt-8">${ESP.PEDAGOGIC.level}</p>`,
        }),

      ]));
  } });
  function render(){
    const p = S.profile || {};
    const ayak = M.dataFootprint();
    const yedek = M.backupAgeDays();
    const profiller = M.profileList();

    const parcaB = { p, ayak, yedek, profiller };
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('profile', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)}`);
  }

  function hkmEntry(){
    if(!ESP.Beacon) return '';
    const a = ESP.Beacon.settings();
    const on = ESP.Beacon.preview();
    const durum = a.lastAt
      ? (a.lastStatus === 202 ? yz('esp.profile.son-gonderim-basarili') : yz('esp.profile.son-deneme-basarisiz'))
        + ' — ' + String(a.lastAt).slice(0, 16).replace('T', ' ') + '. '
        + (a.lastNote || '')
      : yz('esp.profile.henuz-hic-gonderilmedi');
    return K.Entry({
      label:yz('esp.profile.hkm-isareti'), hint:'hkm',
      meta:a.enabled ? 'açık' : 'kapalı',
      wide:true,
      body:html`
        ${(function(){
          /* Metin ortak (yedekag.js). Mahremiyet cümlesi (ilk ve son) görünür
             kalır; anahtarın neyi açtığı bir dokunuşla açılır (§1.2). */
          const c = String(window.LIFEOS.YedekAg.kartNotu('ESP')).split(/(?<=\.)\s+/);
          const ozet = c.length > 2 ? c[0] + ' ' + c[c.length - 1] : c.join(' ');
          return c.length > 2
            ? K.Ayrinti({ etiket:yz('esp.profile.bu-anahtar-neyi-acar'), ozet, govde:html`<p>${c.slice(1, -1).join(' ')}</p>` })
            : html`<p class="small">${ozet}</p>`;
        })()}
        ${when(a.baskaProfil, () => html`<p class="small mt-8" role="alert">${window.LIFEOS.HkmBag.not(a.baskaProfil)}</p>`)}
        ${K.Checkbox({ label:yz('esp.profile.i-sareti-ac-varsayilan-kapal'),
          checked:!!a.enabled, act:'hkm-toggle' })}

        <div class="cols-3 mt-12">
          ${K.Field({ label:yz('esp.profile.hkm-adresi'),
            input:K.Input({ id:'hkm-url', value:a.url, change:'hkm-url',
              placeholder:'http://127.0.0.1:4200', aria:yz('esp.profile.hkm-adresi') }) })}
          ${K.Field({ label:yz('esp.profile.yerel-jeton'), hint:'config.json → local_token',
            input:K.Input({ id:'hkm-token', type:'password', value:a.token,
              change:'hkm-token', aria:yz('esp.profile.hkm-jetonu') }) })}
          ${K.Field({ label:yz('esp.profile.en-sik-kac-dakikada-bir'),
            input:K.Input({ id:'hkm-int', type:'number', min:'15', step:'5',
              value:a.intervalMinutes, change:'hkm-interval', data:{ 'data-varsayilan':String(ESP.Beacon.varsayilan().intervalMinutes), 'data-varsayilan-ad':ESP.Beacon.varsayilan().intervalMinutes + ' dakika' },
              aria:yz('esp.profile.gonderim-araligi') }) })}
        </div>

        ${when(!ESP.Beacon.urlOk(a.url), () => K.Notice({ tone:'warn',
          body:yz('esp.profile.bu-adrese-gonderim-yapilmaz')
             + 'ile giderken jeton ağda açık gider. https ya da 127.0.0.1 gerekir.' }))}

        <div class="mt-12">
          ${K.Field({ label:yz('esp.profile.kapsam'), hint:'ne kadarı gönderilsin',
            input:K.Select({ id:'hkm-level', value:ESP.Beacon.levelOf(),
              change:'hkm-level', data:{ 'data-varsayilan':ESP.Beacon.varsayilan().level, 'data-varsayilan-ad':(ESP.Beacon.LEVELS.find(l => l.id === ESP.Beacon.varsayilan().level) || {}).label }, aria:yz('esp.profile.gonderim-kapsami'),
              options:ESP.Beacon.LEVELS.map(l => ({ value:l.id, label:l.label })) }) })}
          <p class="small muted">${(ESP.Beacon.LEVELS.find(l => l.id === ESP.Beacon.levelOf()) || {}).note}</p>
        </div>

        <div class="mt-12">
          <span class="mono-label">${yz('esp.profile.bugun-ne-gidiyor')}</span>
          ${K.Table({ tight:true, headers:['Alan', { label:yz('esp.profile.deger'), num:true }, 'Kaynak'],
              rows:on.rows.map(r => [r.key,
              r.value == null ? '—' : U.fmtNum(r.value),
              /* KAYNAK SÜTUNU — etiketin görseliyle birlikte.
                 Metin `window.LIFEOS.KESINLIK`ten gelir, bu ekran
                 kendi karşılığını YAZMAZ: aynı `measured` üç arayüzde
                 aynı kelimeyi göstermek zorunda. */
              raw(window.LIFEOS.KESINLIK_HTML(r.cert))]) })}
          <p class="small muted mt-8">${yz('esp.profile.gunun-ozetinde-kart-metni-no')}</p>
        </div>

        ${when(on.errors.length, () => K.Notice({ tone:'warn',
          body:yz('esp.profile.govde-sozlesmeyi-gecmiyor') + on.errors[0] + '. Bu hâliyle gönderilmez.' }))}

        <div class="mt-12">
          ${K.Button({ label:yz('esp.profile.baglan'), act:'hkm-pair' })}
          ${K.Button({ label:yz('esp.profile.simdi-gonder'), act:'hkm-send' })}
          ${K.Button({ label:yz('esp.profile.gecmisi-gonder-60-gun'), act:'hkm-backfill' })}
        </div>
        <p class="small muted mt-8">${yz('esp.profile.capraz-bulgu-gecmi-s-ister-g')}</p>
        <p class="small muted mt-8">«Bağlan», jetonu HKM'den doğrudan alır:
          önce HKM yüzünde «Cihazları bağla» de, sonra iki dakika içinde
          buraya bas. Jetonu elle yazmak da çalışır.</p>
        <p class="small muted mt-8">${durum}</p>`,
    });
  }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  /* Telefon bildiriminin türü ve sessiz saati (brand/ortak/pwa.js): küçük
     tercih, anında; kurulu bildirimler hemen yeniden kurulur. */
  function bildirimYenile(el, ad){
    const V = window.LIFEOS && window.LIFEOS.VITRIN;
    if(!V || !V.bildirimEylem) return;
    const r = V.bildirimEylem('esp', ad, el);
    if(r.metin) ESP.UI.toast(r.metin);
    ESP.App.render();
    if(ESP.Takvim && ESP.Takvim.planla) ESP.Takvim.planla();
  }

  const handle = {
    async 'bildirim-tur'(el){ bildirimYenile(el, 'bildirim-tur'); },
    async 'bildirim-sessiz'(el){ bildirimYenile(el, 'bildirim-sessiz'); },
    /* Vitrin 116: tek bir küçük türün sormadan uygulanıp uygulanmayacağı. */
    async 'otomatik-tur'(el){
      const turler = Object.assign({}, ESP.Office.settings().otomatikTurler || {}, { [el.dataset.eylem]:!!el.checked });
      await ESP.Office.saveSettings({ otomatikTurler:turler });
      ESP.UI.toast(el.checked ? yz('esp.profile.bu-tur-sormadan-uygulanacak') : yz('esp.profile.bu-tur-her-zaman-once'));
    },
    async 'hafiza-ekle'(){
      const el = document.getElementById('hafiza-yeni');
      const r = await ESP.Hafizam.ekle(el ? el.value : '', { katman:'soz', kaynak:'kullanici' });
      ESP.UI.toast(r.ok ? 'Hatırlıyorum' : r.why);
      if(r.ok) ESP.App.render();
    },
    async 'hafiza-unut'(el){
      const r = await ESP.Hafizam.unut(el.dataset.id);
      ESP.UI.toast(r.ok ? 'Unuttum' : r.why);
      ESP.App.render();
    },
    async 'hkm-toggle'(){
      const a = ESP.Beacon.settings();
      await ESP.Beacon.save({ enabled:!a.enabled });
      ESP.UI.toast(!a.enabled ? yz('esp.profile.hkm-isareti-acildi') : yz('esp.profile.hkm-isareti-kapatildi'));
      ESP.App.render();
    },
    async 'hkm-pair'(){
      const r = await ESP.Beacon.pair(val('hkm-url'));
      ESP.UI.toast(r.note);
      ESP.App.render();
    },
    async 'hkm-backfill'(){
      ESP.UI.toast(yz('esp.profile.gecmis-gonderiliyor'));
      const r = await ESP.Beacon.backfill(60);
      ESP.UI.toast(r.ok ? r.sent + ' gün gönderildi (' + r.empty + ' gün ölçümsüz)'
        : r.note || yz('esp.profile.gonderilemedi') + (r.reason || r.status) + ')');
      ESP.App.render();
    },
    async 'hkm-send'(){
      const r = await ESP.Beacon.send({ force:true });
      ESP.UI.toast(r.ok ? 'Gönderildi' : (r.note || 'Gönderilemedi'));
      ESP.App.render();
    },
    async 'gunsure-ekle'(){
      const G = ESP.GunSure;
      const bas = val('gs-bas'), bit = val('gs-bit') || bas, dk = Number(val('gs-dk'));
      const hata = G.denetle(bas, bit, dk);
      if(hata){ ESP.UI.toast(hata); return; }
      const uygula = async () => {
        const r = await G.ekle(bas, bit, dk);
        if(!r.ok){ ESP.UI.toast(r.why); return; }
        ESP.UI.toast(yz('esp.profile.gunluk-sure') + (r.seviye === 'kucuk' ? 'o gün için ' : 'bu tarihlerde ')
          + U.fmtMin(r.kayit.dakika), { undo:async () => { await G.kaldir(r.kayit.id); ESP.App.render(); } });
        ESP.App.render();
      };
      /* AGENTS §1.9: tek gün küçük (sormadan, «Geri al»); çok gün orta
         (önizleme + tek onay). */
      if(G.seviye(bas, bit) === 'kucuk') return uygula();
      ESP.UI.confirmSheet(yz('esp.profile.bu-tarihlerde-gunluk-sure-de'), G.onizleme(bas, bit, dk).metin,
        uygula, false, 'Uygula');
    },
    async 'gunsure-sil'(el){
      const r = await ESP.GunSure.kaldir(el.dataset.id);
      ESP.UI.toast(r.ok ? yz('esp.profile.kaldirildi-o-gunler-temel-su') : r.why);
      ESP.App.render();
    },
    async 'save-profile'(){
      const ad = val('pf-name');
      if(!ad){ ESP.UI.toast(yz('esp.profile.ad-bos-olamaz')); return; }
      await M.saveProfile({
        name:ad,
        focus:val('pf-focus') || 'balanced',
        instrument:val('pf-instrument'),
        langs:[val('pf-lang') || 'en'],
        dailyMinutes:Number(val('pf-minutes')) || 60,
      });
      ESP.Memo.bitir();
      ESP.UI.toast(yz('esp.profile.kaydedildi'));
      ESP.App.render();
    },

    async 'toggle-mod'(el){
      const id = el.dataset.id;
      const res = await ESP.Mod.set(id, !ESP.Mod.isOn(id));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      /* Kapatilan bolumun ekraninda durmak mumkun degil; kabuk zaten
         yonlendirmeyi denetliyor ama burada da tazelenmeli. */
      ESP.UI.toast(ESP.Mod.isOn(id) ? yz('esp.profile.bolum-acildi') : yz('esp.profile.bolum-kapandi-verisi-duruyor'));
      ESP.App.render();
    },

    async 'add-profile'(){
      const res = M.addProfile(val('pf-new'));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      ESP.UI.toast(yz('esp.profile.profil-eklendi'));
      ESP.App.render();
    },

    async 'switch-profile'(el){
      M.switchProfile(el.dataset.id);
    },

    async 'remove-profile'(el){
      const id = el.dataset.id;
      ESP.UI.confirmSheet(yz('esp.profile.profil-silinsin-mi'),
        yz('esp.profile.bu-profilin-butun-verisi-bu'),
        () => {
          const res = M.removeProfile(id);
          if(!res.ok){ ESP.UI.toast(res.error); return; }
          ESP.App.render();
        }, true, yz('esp.profile.profili-ve-verisini-sil'));
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
      ESP.UI.toast(yz('esp.profile.yedek-indirildi'));
      ESP.App.render();
    },

    async 'import-data'(){
      ESP.UI.toast(yz('esp.profile.yedekten-yukleme-rehber-veri'));
      S.ui.guideTab = 'veri';
      ESP.App.go('guide');
    },
  };

  const change = {
    /* Telefon bildirimi (iOS kabuğu): izin yalnız burada, kullanıcı
       «Evet» deyince sorulur; reddedilirse ayar açılmaz ve nedeni söylenir. */
    async 'pick-telbildirim'(el){
      const B = window.LIFEOS && window.LIFEOS.BILDIRIM;
      if(!B || !B.var()) return;
      if(el.value === 'acik'){
        const izin = await B.izin();
        if(izin !== 'izin'){
          el.value = 'kapali';
          ESP.UI.toast(izin === 'red' ? yz('esp.profile.bildirim-izni-kapali-iphone')
            : yz('esp.profile.bildirim-izni-alinamadi'), { life:5000 });
          return;
        }
      }
      await ESP.Office.saveSettings({ telefonBildirim:el.value === 'acik' });
      const r = await ESP.Takvim.planla();
      ESP.UI.toast(el.value === 'acik' ? yz('esp.profile.acik') + ((r && r.kurulan) || 0) + ' hatırlatıcı kuruldu' : yz('esp.profile.telefon-bildirimi-kapandi'));
      ESP.App.render();
    },
    /* Sessiz saatin bitişi ve başlangıcı (brand/ortak/vitrin.js bildirimKutusu). */
    async 'bildirim-saat'(el){ bildirimYenile(el, 'bildirim-saat'); },

    async 'pick-otomatik'(el){
      const v = el.value === 'hicbiri' ? 'hicbiri' : 'istek';
      await ESP.Office.saveSettings({ otomatikUygula:v });
      ESP.UI.toast(v === 'hicbiri' ? yz('esp.profile.her-istek-once-sorulacak')
        : yz('esp.profile.senin-istedigin-kucuk-isler'));
    },

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
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    kucukVarsayilan:['bölümler', 'hkm-işareti', 'model'],
    title:yz('esp.profile.profil'),
    headline(){
      const p = S.profile || {};
      return p.name ? p.name + ' — ' + ((ESP.FOCUS.find(f => f.id === p.focus) || {}).label
        || 'dengeli').toLocaleLowerCase('tr-TR') + ' odak.' : yz('esp.profile.profil-henuz-doldurulmadi');
    },
    lede(){
      return yz('esp.profile.yas-cinsiyet-ve-kilo-sorulma')
           + yz('esp.profile.sorulan-tek-sey-ne-calistigi');
    },
    stats(){
      const ayak = M.dataFootprint();
      const yedek = M.backupAgeDays();
      return [
        { value:ESP.Mod.count() + '/' + ESP.DISCIPLINES.length, label:yz('esp.profile.acik-bolum') },
        { value:String(M.profileList().length), label:'profil' },
        { value:ayak.bytes ? String(Math.round(ayak.bytes / 1024)) : '—', unit:'KB', label:'veri' },
        { value:yedek == null ? '—' : String(yedek), unit:'gün', label:yz('esp.profile.son-yedek') },
      ];
    },
    subtitle(){ return M.activeProfileId(); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
