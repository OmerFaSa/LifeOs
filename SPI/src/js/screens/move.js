/* Hareket — Modül 3'ün ekranı.

   Ekran ALANLARA ayrılır. Kullanıcı gününü planlarken "bugün hangi kalıbı
   çalışayım" diye değil, "kardiyo mu yapayım, kuvvet mi, yoksa dinleneyim
   mi" diye düşünür. Sekmeler o soruyu karşılar:

     Bugün      toparlanmaya göre günün yük emri ve seans kaydı
     Kardiyo    yürüyüş, koşu, evde sprint
     Kuvvet     vücut ağırlığıyla altı kalıp — kendi içinde ikinci şeritle ayrılır
     Esneklik   mobilite akışları
     Dinlenme   yükün diğer yarısı: indirme haftası, boş gün, uyku
     İlerleme   yük eğrisi, son hafta / son ay oranı

   Dinlenmenin kendi sayfası olması kasıtlıdır. Antrenman programlarında
   dinlenme çoğu zaman "yapılmayan şey" olarak geçer ve görünmez olur;
   burada görünür, çünkü yük yönetiminin yarısı odur.

   Ekranın kuralı: sistem yükü kendiliğinden azaltabilir ama asla
   kendiliğinden artıramaz. Artırma kararı hep kullanıcınındır. */
window.LIFEOS.PARCA.yazilar({
  'spi.move.en-iyi':'En iyi',
  'spi.move.goreli-hiz':'Göreli hız',
  'spi.move.yeni-rekor':'Yeni rekor: ',
  'spi.move.onceki':'önceki ',
});

window.LIFEOS.PARCA.yazilar({
  'spi.move.modul-3':'Modül 3',
  'spi.move.bu-bir-geri-adim-degil':'Bu bir geri adım değil, planın parçası. Asgari gün yine geçerli: ',
  'spi.move.bugun-henuz-seans-kaydi-yok':'Bugün henüz seans kaydı yok. Yukarıdan bir seans seç.',
  'spi.move.toparlanma':'Toparlanma ',
  'spi.move.bu-kalipta-tanimli-hareket-y':'Bu kalıpta tanımlı hareket yok.',
  'spi.move.bu-hafta-gecen-haftanin-10':'Bu hafta geçen haftanın %10 üstünü aştı. Süreyi artırmak yerine tempoyu koru.',
  'spi.move.gecen-hafta-kardiyo-kaydi-yo':'Geçen hafta kardiyo kaydı yok; tavan hesaplanmadı. Eksik veri sıfır sayılmaz.',
  'spi.move.kayit-suruyor':'Kayıt sürüyor',
  'spi.move.kaydedilmemis-rota':'Kaydedilmemiş rota',
  'spi.move.kayit-yarida-kaldi':'Kayıt yarıda kaldı',
  'spi.move.ekran-kapaliyken-de-kaydeder':'Ekran kapalıyken de kaydeder; telefon cebinde olabilir.',
  'spi.move.ekran-acik-kalmali-kilitli-e':'Ekran açık kalmalı; kilitli ekranda konum gelmez.',
  'spi.move.ort-hiz':'Ort. hız',
  'spi.move.ort-tempo':'Ort. tempo',
  'spi.move.hareket-bekleniyor':'Hareket bekleniyor…',
  'spi.move.konum-bekleniyor':'Konum bekleniyor…',
  'spi.move.sayfa-kapandigi-icin-kayit-d':'Sayfa kapandığı için kayıt durdu.',
  'spi.move.duraklatildi-aradaki-yol-say':'Duraklatıldı; aradaki yol sayılmaz.',
  'spi.move.ekrani-acik-tut-kilitli-ekra':'Ekranı açık tut; kilitli ekranda konum gelmez.',
  'spi.move.gps-noktalari-arasi-mesafele':'GPS noktaları arası mesafelerin toplamı',
  'spi.move.kaydi-kaydet':'Kaydı kaydet',
  'spi.move.rotayi-ekle':'Rotayı ekle',
  'spi.move.hangi-hareket-oldugunu-sec':'Hangi hareket olduğunu seç.',
  'spi.move.dosyada-tur-yazmiyor':'Dosyada tür yazmıyor',
  'spi.move.tam-dinlenme-gunu-de-bos':'Tam dinlenme günü de boş değildir: asgari gün geçerli — ',
  'spi.move.gecen-haftaya-gore-degisim':'Geçen haftaya göre değişim %',
  'spi.move.fotograftan-analiz-icin-hkm':'Fotoğraftan analiz için HKM › Modeller’de «SPİ · Görsel» (ya da King) için ',
  'spi.move.fotografi-buraya-birak-ya-da':'Fotoğrafı buraya bırak ya da seçmek için tıkla',
  'spi.move.bu-analiz-tibbi-bir-teshis':'Bu analiz tıbbi bir teşhis değildir; fotoğraftan çıkarılan değerler ',
  'spi.move.bu-analiz-tibbi-bir-teshis-2':'Bu analiz tıbbi bir teşhis değildir; fotoğraftan çıkarılan değerler tahmindir. Tanı ve tedavi için hekiminize danışınız.',
  'spi.move.beden-kitle-indeksi':'Beden kitle indeksi',
  'spi.move.bel-boy-orani':'Bel / boy oranı',
  'spi.move.yag-orani':'Yağ oranı',
  'spi.move.yagsiz-kutle':'Yağsız kütle',
  'spi.move.yag-kutlesi':'Yağ kütlesi ',
  'spi.move.kilo-egilimi':'Kilo eğilimi',
  'spi.move.son-7-tartinin-ortalamasi':'Son 7 tartının ortalaması ',
  'spi.move.gunluk-harcama-kaba':'Günlük harcama (kaba)',
  'spi.move.henuz-seans-kaydi-yok':'Henüz seans kaydı yok.',
  'spi.move.seansi-duzenle':'Seansı düzenle',
  'spi.move.tum-vucut':'Tüm vücut',
  'spi.move.kalip':'Kalıp: ',
  'spi.move.genel-kondisyon':'Genel kondisyon',
  'spi.move.setler':'Setler · ',
  'spi.move.bu-hafta-hareket':'Bu hafta hareket',
  'spi.move.antrenman-haftasi':'Antrenman haftası',
  'spi.move.uyku-suresini-yazman-bile-ye':'Uyku süresini yazman bile yeter.',
  'spi.move.yogunluk-son-28-gun':'Yoğunluk · son 28 gün',
  'spi.move.seansin-zorlugu-yazilmadi-ba':'seansın zorluğu yazılmadı; banda girmedi.',
  'spi.move.bu-bolum-su-an-cizilemedi':'Bu bölüm şu an çizilemedi; verin yerinde duruyor.',
  'spi.move.yuk-orani-icin-gecmis-yetmiy':'Yük oranı için geçmiş yetmiyor.',
  'spi.move.analiz-basarisiz':'Analiz başarısız',
  'spi.move.fotograf-bugunun-kaydina-ekl':'Fotoğraf bugünün kaydına eklendi',
  'spi.move.duzeltici-mobilite':'Düzeltici Mobilite',
  'spi.move.kaydi-sil':'Kaydı sil',
  'spi.move.bu-canli-kayit-ve-butun':'Bu canlı kayıt ve bütün konum noktaları silinir; geri alınamaz.',
  'spi.move.seansi-sil':'Seansı sil',
  'spi.move.bu-seans-ve-urettigi-yuk':'Bu seans ve ürettiği yük kaydından silinir.',
  'spi.move.yeni-basamak':'Yeni basamak: ',
  'spi.move.toparlanma-olcumu-bekliyor':'Toparlanma ölçümü bekliyor.',
  'spi.move.bugun-dinlenme-gunu':'Bugün dinlenme günü.',
  'spi.move.bugun-tam-yuk-yapilabilir':'Bugün tam yük yapılabilir.',
  'spi.move.bugun-yuk-hafifletilmeli':'Bugün yük hafifletilmeli.',
  'spi.move.uyku-ve-nabiz-girilince-gunu':'Uyku ve nabız girilince günün yük emri hesaplanır. ',
  'spi.move.olcum-olmadan-yuk-korlemesin':'Ölçüm olmadan yük körlemesine verilmez.',
  'spi.move.olcum-bekliyor-2':'Ölçüm bekliyor',
});


window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'spi', sira:50, id:'act:session', kind:'Eylem', label:'Antrenman seansı ekle', route:'move',
  hint:yz('spi.move.modul-3'), run:() => { SP.App.go('move'); setTimeout(() => {
    const fn = SP.Screens.move.handle['start-session'];
    if(fn) fn({ dataset:{ id:'' } }); }, 120); } });
window.LIFEOS.PARCA.yazilar({
  'spi.move.bugun':'Bugün',
  'spi.move.i-lerleme':'İlerleme',
  'spi.move.tumu':'Tümü',
  'spi.move.gunun-yuk-emri':'Günün yük emri',
  'spi.move.veri-gir':'Veri gir',
  'spi.move.seans-sec':'Seans seç',
  'spi.move.programlar-20':'Programlar (20)',
  'spi.move.met-kalori':'MET Kalori',
  'spi.move.onerilen':'· önerilen',
  'spi.move.dk':'dk ·',
  'spi.move.hareket':'hareket —',
  'spi.move.serbest-seans':'Serbest seans',
  'spi.move.hareketleri-kendin-sec':'Hareketleri kendin seç',
  'spi.move.hazir-antrenmanlar':'Hazır antrenmanlar',
  'spi.move.sil':'Sil',
  'spi.move.hazir-antrenman-yap':'Hazır antrenman yap',
  'spi.move.hareket-sayfasinda-bugun-yap':'Hareket sayfasında «bugün yaptım» diye tek dokunuşla eklenir',
  'spi.move.adi':'Adı',
  'spi.move.zorlanma-puani-ve-not-saklan':'Zorlanma puanı ve not saklanmaz; her gün yeniden sorulur.',
  'spi.move.vazgec':'Vazgeç',
  'spi.move.sakla':'Sakla',
  'spi.move.bugunun-seanslari':'Bugünün seansları',
  'spi.move.zorluk':'· zorluk',
  'spi.move.yuk':'· yük',
  'spi.move.duzenle':'Düzenle',
  'spi.move.ust-basamak-acik':'üst basamak açık',
  'spi.move.teknik-ve-ipuclari':'Teknik ve ipuçları',
  'spi.move.ust-basamaga-gec':'Üst basamağa geç',
  'spi.move.basamak-sec':'Basamak seç',
  'spi.move.haftalik-sure':'Haftalık süre',
  'spi.move.bugun-icin':'Bugün için',
  'spi.move.seans-ekle':'Seans ekle',
  'spi.move.kalip-dengesi':'Kalıp dengesi',
  'spi.move.i-lerleme-kurali':'İlerleme kuralı · ',
  'spi.move.bir-ust-basamak-mevcut-basam':'Bir üst basamak, mevcut basamakta son',
  'spi.move.gunde':'günde',
  'spi.move.seans-yapildiginda-acilir-si':'seans yapıldığında açılır. Sistem basamak atlatmaz: aşırı yüklenmenin en yaygın sebebi budur.',
  'spi.move.bu-hafta':'Bu hafta',
  'spi.move.gecen-hafta':'Geçen hafta',
  'spi.move.bu-haftanin-tavani':'Bu haftanın tavanı',
  'spi.move.gpx-ekle':'GPX ekle',
  'spi.move.hareket-turu':'Hareket türü',
  'spi.move.rotalar':'Rotalar',
  'spi.move.kayda-basla':'Kayda başla',
  'spi.move.rotayi-ac':'Rotayı aç: ',
  'spi.move.hareket-ettikce-rota-haritad':'Hareket ettikçe rota haritada çizilir.',
  'spi.move.ac':'Aç',
  'spi.move.gozden-gecir':'Gözden geçir',
  'spi.move.surdur':'Sürdür',
  'spi.move.bitir':'Bitir',
  'spi.move.baslat':'Başlat',
  'spi.move.canli-rota':'Canlı rota',
  'spi.move.duraklat':'Duraklat',
  'spi.move.gps-noktasi':'GPS noktası',
  'spi.move.rota':'Rota: ',
  'spi.move.mesafe':'Mesafe',
  'spi.move.hareket-suresi':'Hareket süresi',
  'spi.move.ortalama-hiz':'Ortalama hız',
  'spi.move.ortalama-tempo':'Ortalama tempo',
  'spi.move.tirmanis':'Tırmanış',
  'spi.move.yukseklik':'Yükseklik',
  'spi.move.dilimler':'Dilimler',
  'spi.move.kapat':'Kapat',
  'spi.move.isi-haritasi':'Isı haritası',
  'spi.move.isi-haritasi-2':'Isı haritası: ',
  'spi.move.rota-baska-bir-bolgede-bu':'rota başka bir bölgede; bu haritaya alınmadı.',
  'spi.move.eklenecek-rota':'Eklenecek rota',
  'spi.move.bozuk-gps-noktasi-atlandi':'bozuk GPS noktası atlandı.',
  'spi.move.zayif-konum':'zayıf konum (±',
  'spi.move.boyunca-konum-gelmedi-ekran':'boyunca konum gelmedi (ekran kapalı olabilir); o aralık iki uç arasında düz çizgi sayıldı.',
  'spi.move.kaydet':'Kaydet',
  'spi.move.bugun-dinlenmeli-misin':'Bugün dinlenmeli misin?',
  'spi.move.i-ndirme-haftasi':'İndirme haftası',
  'spi.move.son-yedi-gun':'Son yedi gün',
  'spi.move.ust-uste-bos-gecen-gunler':'Üst üste boş geçen günler kondisyonu düşürür; hiç boş geçmeyen haftalar son haftayı son aya göre şişirir. İkisi de aynı ölçüde izlenir.',
  'spi.move.bos-gun':'Boş gün',
  'spi.move.ortalama-uyku':'Ortalama uyku',
  'spi.move.son-hafta-son-ay':'Son hafta / son ay',
  'spi.move.dongu-haftasi':'Döngü haftası',
  'spi.move.fotograftan-beden-ve-durus-a':'Fotoğraftan beden ve duruş analizi',
  'spi.move.boydan-fotograf-ile-bki-duru':'Boydan fotoğraf ile BKİ, duruş (postür) ve tahmini kompozisyon',
  'spi.move.model-bagli-degil':'Model bağlı değil.',
  'spi.move.boydan-vucut-fotografi':'Boydan vücut fotoğrafı',
  'spi.move.boyun-cm':'Boyun (cm)',
  'spi.move.kilon-kg':'Kilon (kg)',
  'spi.move.ek-not-odaklanilacak-alan':'Ek not / odaklanılacak alan',
  'spi.move.one-dogru-hafif-kambur-durus':'Öne doğru hafif kambur duruş hissediyorum…',
  'spi.move.analiz-et':'Analiz et',
  'spi.move.beden-ve-durus-analizi-5':'Beden ve duruş analizi (5 bölüt)',
  'spi.move.fotograftan-tahmini-biyometr':'Fotoğraftan tahmini biyometri ve düzeltici hareket reçetesi',
  'spi.move.1-biyometrik-kompozisyon':'1. Biyometrik Kompozisyon',
  'spi.move.cert-estimated-photo':'Tahmin · fotoğraf',
  'spi.move.tahmini-bki':'Tahmini BKİ',
  'spi.move.beden-tipi':'Beden Tipi:',
  'spi.move.tahmini-yag-orani-araligi':'Tahmini yağ oranı aralığı',
  'spi.move.bel-kalca':'Bel/Kalça:',
  'spi.move.bu-olcumleri-bugunun-gunlugu':'Bu ölçümleri bugünün günlüğüne yaz',
  'spi.move.2-postur-segmentasyonu':'2. Postür Segmentasyonu',
  'spi.move.bolgesel-analiz':'bölgesel analiz',
  'spi.move.omuz-si-metri-si':'OMUZ SİMETRİSİ',
  'spi.move.omurga-hatti':'OMURGA HATTI',
  'spi.move.pelvi-s-hi-zasi':'PELVİS HİZASI',
  'spi.move.3-duzeltici-hareket-recetesi':'3. Düzeltici hareket reçetesi',
  'spi.move.2-dk-esneme':'2 Dk Esneme:',
  'spi.move.guclendirme':'Güçlendirme:',
  'spi.move.gunluk-mola':'Günlük Mola:',
  'spi.move.duzeltici-rutini-seanslara-e':'Düzeltici rutini seanslara ekle (15 dk)',
  'spi.move.doku-onarimi':'doku onarımı',
  'spi.move.5-tibbi-guvenlik-uyarisi-tah':'5. Tıbbi güvenlik uyarısı (tahmin · fotoğraftan)',
  'spi.move.fotografi-bugune-kaydet':'Fotoğrafı bugüne kaydet',
  'spi.move.vucut-analizi':'Vücut analizi',
  'spi.move.eksik-olcu-sifir-sayilmaz':'. Eksik ölçü sıfır sayılmaz; o satır yazılmaz.',
  'spi.move.bel-cm':'Bel (cm)',
  'spi.move.bel-cevresi-cm':'Bel çevresi (cm)',
  'spi.move.boyun-cevresi-cm':'Boyun çevresi (cm)',
  'spi.move.kalca-cm':'Kalça (cm)',
  'spi.move.kalca-cevresi-cm':'Kalça çevresi (cm)',
  'spi.move.olculeri-kaydet':'Ölçüleri kaydet',
  'spi.move.vucut':'Vücut · ',
  'spi.move.vucut-2':'Vücut',
  'spi.move.dakika':'Dakika',
  'spi.move.yuk-2':'Yük',
  'spi.move.sure-dakika':'Süre (dakika)',
  'spi.move.algilanan-zorluk-1-10':'Algılanan zorluk (1–10)',
  'spi.move.hareketler':'Hareketler',
  'spi.move.secili':'seçili',
  'spi.move.not':'Not',
  'spi.move.hedef-kaslar':'Hedef kaslar:',
  'spi.move.ozet':'Özet:',
  'spi.move.uygulama-adimlari':'Uygulama Adımları',
  'spi.move.kurulum-ve-guvenli-k-kontrol':'KURULUM VE GÜVENLİK KONTROLÜ',
  'spi.move.bu-hareketle-seans-baslat':'Bu hareketle seans başlat',
  'spi.move.egitim-programlari':'Eğitim Programları',
  'spi.move.bu-programla-seans-baslat':'Bu programla seans başlat',
  'spi.move.met-ile-aktivite-ve-kalori':'MET ile aktivite ve kalori hesabı',
  'spi.move.2024-adult-compendium-1-111':'2024 Adult Compendium · 1.111 fiziksel aktivite',
  'spi.move.aktivite-ara':'Aktivite ara',
  'spi.move.orn-bisiklet-yuzme-bahce-kos':'örn: bisiklet, yüzme, bahçe, koşu…',
  'spi.move.met':'· MET',
  'spi.move.seansa-ekle':'Seansa ekle',
  'spi.move.eslesen-aktivite-bulunamadi':'Eşleşen aktivite bulunamadı.',
  'spi.move.olcum-bekliyor':'Ölçüm bekliyor.',
  'spi.move.seans-kaydi':'Seans kaydı',
  'spi.move.gun-hareket':'gün hareket.',
  'spi.move.asgari-gun':'Asgari gün ',
  'spi.move.hareket-2':'Hareket',
  'spi.move.hafif-1-3':'Hafif · 1–3',
  'spi.move.orta-4-6':'Orta · 4–6',
  'spi.move.zor-7-8':'Zor · 7–8',
  'spi.move.en-zor-9-10':'En zor · 9–10',
  'spi.move.yuk-egrisi':'Yük eğrisi',
  'spi.move.seans-gecmisi':'Seans geçmişi',
  'spi.move.son-7-gun':'Son 7 gün',
  'spi.move.son-yedi-gunde-seans-yok':'Son yedi günde seans yok. İlk seans girilince günlere dağılır.',
  'spi.move.son-yedi-gunun-hareketi':'Son yedi günün hareketi; ',
  'spi.move.yuk-orani':'Yük oranı',
  'spi.move.yuk-orani-2':'Yük oranı ',
  'spi.move.dosya-cok-buyuk-en-cok':'Dosya çok büyük (en çok 25 MB).',
  'spi.move.bu-rota-zaten-kayitli':'Bu rota zaten kayıtlı: ',
  'spi.move.beden-ve-durus-analiz-ediliy':'Beden ve duruş analiz ediliyor…',
  'spi.move.tahmini-olcum-bugunun-gunlug':'Tahmini ölçüm bugünün günlüğüne yazıldı',
  'spi.move.durus-duzeltici-mobilite':'Duruş düzeltici mobilite',
  'spi.move.duzeltici-hareket-seansi-bug':'Düzeltici hareket seansı bugüne eklendi',
  'spi.move.rota-eklendi':'Rota eklendi',
  'spi.move.sure-gir':'Süre gir',
  'spi.move.seans-kaydedildi':'Seans kaydedildi',
  'spi.move.seans-bulunamadi':'Seans bulunamadı.',
  'spi.move.gecerli-bir-olcu-yazilmadi':'Geçerli bir ölçü yazılmadı.',
  'spi.move.olculer-kaydedildi':'Ölçüler kaydedildi',
  'spi.move.basamak-guncellendi':'Basamak güncellendi',
  'spi.move.bugunku-yuk':'bugünkü yük',
  'spi.move.haftalik-yuk':'haftalık yük',
  'spi.move.hafta-ay':'hafta / ay',
});
window.LIFEOS.PARCA.sayfa({ id:'move', modul:'spi', king:{ sira:40, ad:'Hareket', es:['hareket', 'antrenman', 'egzersiz', 'spor'] }, cekmece:'calisma', ad:'Hareket', sira:40 });

SP.Screens.move = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* Sekmeler: iki genel görünüm ve arada dört faaliyet alanı. */
  const TABS = [{ id:'bugun', label:yz('spi.move.bugun'), icon:'today' }]
    .concat(SP.AREAS.map(a => ({ id:a.id, label:a.label, icon:a.icon })))
    .concat([{ id:'ilerleme', label:yz('spi.move.i-lerleme'), icon:'chart' }]);

  /* Kuvvet alanının ikinci şeridi: hareket kalıpları. Yalnız kuvvette
     çizilir — kardiyoda ve esneklikte kalıp yoktur, orada şerit çizmek
     boş bir seçim sunmak olurdu. */
  function patternTabs(){
    const rows = SP.Move.patternBalance();
    const byId = {};
    rows.forEach(r => { byId[r.pattern.id] = r.count; });
    return [{ id:'all', label:yz('spi.move.tumu'), count:SP.EXERCISES.filter(e => e.kind === 'strength').length }]
      .concat(SP.PATTERNS.map(p => ({ id:p.id, label:p.label, count:byId[p.id] || null })));
  }

  /* Kalıp süzgeci sekme DEĞİL (EKIP-PLANI §1.2): listeyi daraltan basılı/
     basılmamış çipler. Eylem aynı (`pick-pattern-tab`), yalnız biçimi
     değişti; seçili olan `aria-pressed` taşır. */
  function desenSuzgeci(){
    const secili = S.ui.movePattern || 'all';
    return html`<div class="row wrap gap-6 mb-8" role="group" aria-label="Hareket kalıbı">
      ${map(patternTabs(), x => K.Chip({ label:x.label + (x.count ? ' · ' + x.count : ''),
        act:'pick-pattern-tab', on:x.id === secili,
        data:{ 'data-tab':x.id, 'aria-pressed':x.id === secili ? 'true' : 'false' } }))}
    </div>`;
  }

  function exercisesOfArea(areaId){
    const area = SP.AREA_BY_ID[areaId];
    if(!area || !area.kind) return [];
    const list = SP.EXERCISES.filter(e => e.kind === area.kind);
    if(areaId !== 'kuvvet') return list;
    const pat = S.ui.movePattern || 'all';
    return pat === 'all' ? list : list.filter(e => e.pattern === pat);
  }

  /* --------------------------------------------------------------- bugün */

  function orderEntry(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    return K.Entry({
      label:yz('spi.move.gunun-yuk-emri'), hint:'recovery-order',
      meta:rx.factor >= 1 ? 'tam yük' : 'yükün %' + Math.round(rx.factor * 100) + '\u2019i',
      /* «Emri toparlanma belirler…» ⓘ'de (hints: recovery-order). */
      action:when(!r.ok, () => K.Button({ label:yz('spi.move.veri-gir'),
        act:'go', data:{ 'data-route':'today' } })),
      body:html`
        ${when(r.ok, () => html`<div class="row wrap" style="gap:26px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:122,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <p class="grow small" style="min-width:210px">${r.band.order}</p>
        </div>`)}
        <!-- toparlanma gerekcesi gostergenin yaninda yaziyor; ayni cumle
             bir de uyari kutusunda tekrar edilmez -->
        ${map(rx.reasons.filter(x => !(r.ok && x.id === 'readiness')),
          x => K.Notice({ tone:x.kind === 'muted' ? 'info' : x.kind, body:x.text }))}
        ${when(rx.kind === 'rest', () => K.Notice({ tone:'info',
          body:yz('spi.move.bu-bir-geri-adim-degil')
            + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş.' }))}`,
    });
  }

  function pickSessionEntry(){
    const rx = SP.Move.prescription();
    const suggested = rx.suggest.map(t => t.id);
    return K.Entry({
      label:yz('spi.move.seans-sec'), hint:'session-pick',
      meta:SP.SESSION_TEMPLATES.length + ' şablon',
      action:html`${K.Button({ label:yz('spi.move.programlar-20'), act:'open-programs', size:'sm', tone:'ghost' })}
        ${K.Button({ label:yz('spi.move.met-kalori'), act:'open-met-calc', size:'sm', tone:'ghost' })}`,
      body:html`<div class="picks">${map(SP.SESSION_TEMPLATES, t => html`
        <button class="${cls('pickcard', suggested[0] === t.id && 'is-on')}"
          data-act="start-session" data-id="${t.id}">
          <span class="pickcard__box" aria-hidden="true">${suggested[0] === t.id ? raw(UI.icon('check')) : ''}</span>
          <span class="pickcard__body">
            <span class="pickcard__name">${t.name}
              ${when(suggested.indexOf(t.id) >= 0, () => html`<span class="tiny dim"> ${yz('spi.move.onerilen')}</span>`)}</span>
            <span class="pickcard__meta">${t.minutes} ${yz('spi.move.dk')} ${t.items.length} ${yz('spi.move.hareket')} ${t.note}</span>
          </span>
        </button>`)}
        <button class="pickcard" data-act="start-session" data-id="">
          <span class="pickcard__box" aria-hidden="true"></span>
          <span class="pickcard__body">
            <span class="pickcard__name">${yz('spi.move.serbest-seans')}</span>
            <span class="pickcard__meta">${yz('spi.move.hareketleri-kendin-sec')}</span>
          </span>
        </button>
      </div>`,
    });
  }

  /* HAZIR ANTRENMANLAR (core/hazir.js, 2026-10-17): «bugün onu yaptım»
     tek dokunuş. Liste boşsa kutu yok; seans satırındaki işaret saklar. */
  function hazirAntrenmanEntry(){
    if(!SP.Hazir) return null;
    const l = SP.Hazir.antrenmanlar();
    if(!l.length) return null;
    const d = U.todayISO();
    const duzen = !!S.ui.hazirAntDuzen;
    return K.Entry({
      label:yz('spi.move.hazir-antrenmanlar'), meta:duzen ? 'düzenle' : 'tek dokunuşla bugüne',
      action:K.Button({ label:duzen ? 'Bitti' : 'Düzenle', size:'sm', tone:'ghost', act:'hazir-antrenman-duzen' }),
      body:html`<div class="picks">${map(l, h => {
        const yapildi = SP.Hazir.bugunVar(h, d);
        return duzen
          ? html`<div class="pickcard"><span class="pickcard__body"><span class="pickcard__name">${h.ad}</span>
              <span class="pickcard__meta">${SP.Hazir.antrenmanOzet(h)}</span></span>
              ${K.Button({ label:yz('spi.move.sil'), size:'sm', tone:'ghost', act:'hazir-antrenman-sil', data:{ 'data-id':h.id } })}</div>`
          : html`<button class="${cls('pickcard', yapildi && 'is-on')}" data-act="hazir-antrenman-ekle" data-id="${h.id}"
              aria-label="${h.ad + (yapildi ? ': bugün eklendi, bir daha ekle' : ': bugün yaptım')}">
              <span class="pickcard__box" aria-hidden="true">${yapildi ? raw(UI.icon('check')) : raw(UI.icon('plus'))}</span>
              <span class="pickcard__body"><span class="pickcard__name">${h.ad}</span>
                <span class="pickcard__meta">${SP.Hazir.antrenmanOzet(h)}${yapildi ? ' · bugün eklendi' : ''}</span></span>
            </button>`;
      })}</div>`,
    });
  }
  function hazirAntrenmanSheet(w){
    UI.sheet({
      title:yz('spi.move.hazir-antrenman-yap'), subtitle:yz('spi.move.hareket-sayfasinda-bugun-yap'),
      body:String(K.Stack([
        K.Field({ label:yz('spi.move.adi'), input:K.Input({ id:'hazir-antrenman-ad', value:w.name || 'Antrenman' }) }),
        html`<p class="tiny dim">${yz('spi.move.zorlanma-puani-ve-not-saklan')}</p>`,
      ])),
      footer:String(html`${K.Button({ label:yz('spi.move.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.move.sakla'), tone:'primary', act:'hazir-antrenman-kaydet', data:{ 'data-id':w.id } })}`),
    });
  }

  function todaySessionsEntry(){
    const d = U.todayISO();
    const rows = M.workoutsOf(d);
    if(!rows.length){
      return K.Entry({ label:yz('spi.move.bugunun-seanslari'), meta:'kayıt yok',
        body:P.empty(yz('spi.move.bugun-henuz-seans-kaydi-yok')) });
    }
    return K.Entry({
      label:yz('spi.move.bugunun-seanslari'),
      meta:rows.length + ' seans · ' + U.sum(rows.map(SP.Move.sessionLoad)) + ' yük',
      body:html`<div class="list">${map(rows, w => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${w.name}</b>
            <div class="tiny dim">${w.minutes} dk
              ${when(w.rpe, () => html`${yz('spi.move.zorluk')} ${w.rpe}/10`)}
              ${yz('spi.move.yuk')} ${SP.Move.sessionLoad(w)}
              · ${(w.items || []).length} hareket</div>
          </div>
          ${K.Button({ label:yz('spi.move.duzenle'), size:'sm', act:'edit-session', data:{ 'data-id':w.id } })}
          ${when(SP.Hazir, () => K.IconButton({ icon:'bookmark', size:'sm', plain:true, aria:yz('spi.move.hazir-antrenman-yap'),
            act:'hazir-antrenman-sakla', data:{ 'data-id':w.id } }))}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:yz('spi.move.sil'),
            act:'del-session', data:{ 'data-id':w.id } })}
        </div>`)}</div>`,
    });
  }

  function balanceBody(){
    const rows = SP.Move.patternBalance();
    return html`${map(rows, r => html`
      <button class="${cls('minrow', !r.missing && 'is-done')}" style="width:100%"
        data-act="pick-pattern" data-id="${r.pattern.id}">
        <span class="minrow__mark">${r.missing ? '' : '✓'}</span>
        <span class="minrow__label"><b>${r.pattern.label}</b>
          <span class="tiny dim"> · ${r.pattern.note}</span></span>
        <span class="minrow__detail num">${r.count}</span>
      </button>`)}`;
  }

  /* Merdiven artık kart değil: ince çizgiyle ayrılan bir blok. */
  function ladderBlock(ex){
    const pr = SP.Move.progressionCheck(ex.id);
    const cur = M.levelIndex(ex.id);
    const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
    return html`
      <div class="ladderblk">
        <div class="ladderblk__head">
          ${raw(String(SP.FotoUI.kutu({ sahip:'hareket:' + ex.id, ad:ex.name, yon:'user' })))}
          <div class="minw0 grow">
            <b class="ladderblk__name">${ex.name}</b>
            <span class="tiny dim">${pattern ? pattern.label
              : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite'}
              · ${ex.equip === 'yok' ? 'ekipmansız' : ex.equip}</span>
          </div>
          ${pr.ready ? K.Badge({ label:yz('spi.move.ust-basamak-acik'), tone:'ok' })
            : K.Badge({ label:pr.sessions + '/' + pr.needed + ' seans', tone:'muted' })}
        </div>
        <p class="small muted">${ex.cue}</p>
        <div class="ladder">${map(ex.levels, (l, i) => html`
          <div class="${cls('ladderstep', i < cur && 'is-done', i === cur && 'is-current')}">
            <span class="ladderstep__no">${i + 1}</span>
            <span>${l.name}</span>
            <span class="ladderstep__to">${l.to}</span>
          </div>`)}</div>
        <div class="ladderblk__foot">
          <span class="small dim">${pr.note}</span>
          <span class="row-sm">
            ${K.Button({ label:yz('spi.move.teknik-ve-ipuclari'), size:'sm', tone:'ghost', act:'open-ex-detail', data:{ 'data-id':ex.id } })}
            ${when(pr.ready, () => K.Button({ label:yz('spi.move.ust-basamaga-gec'), size:'sm',
              act:'advance', data:{ 'data-id':ex.id } }))}
            ${K.Button({ label:yz('spi.move.basamak-sec'), size:'sm', act:'pick-level', data:{ 'data-id':ex.id } })}
          </span>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------- alanlar */

  /* Bir faaliyet alanının sayfası: alanın ne olduğu, o alandaki hareket
     merdivenleri ve alana özel kural. */
  function areaView(areaId){
    const area = SP.AREA_BY_ID[areaId];
    const list = exercisesOfArea(areaId);
    const rx = SP.Move.prescription();

    return K.Ledger([
      when(areaId === 'kardiyo', () => rotaKarti()),
      when(areaId === 'kardiyo', () => K.Entry({
        label:yz('spi.move.haftalik-sure'), hint:'load', meta:'%10 kuralı', body:cardioBody(),
      })),

      when(areaId === 'esneklik' && rx.kind !== 'full', () => K.Entry({
        label:yz('spi.move.bugun-icin'), meta:'toparlanma bandı',
        body:K.Notice({ tone:'info',
          body:yz('spi.move.toparlanma') + (rx.readiness.ok ? rx.readiness.band.label.toLocaleLowerCase('tr-TR')
            : 'ölçülmedi') + '. Esneklik akışı ağır antrenmanın yerine geçebilir; '
            + 'yük üretmez ama zinciri kırmaz.' }),
      })),

      K.Entry({
        label:area.label, hint:'progression',
        meta:list.length + ' hareket',
        action:K.Button({ label:yz('spi.move.seans-ekle'), icon:'plus',
          act:'start-area', data:{ 'data-area':areaId } }),
        body:html`
          ${when(areaId === 'kuvvet', () => desenSuzgeci())}
          ${when(!list.length, () => P.empty(yz('spi.move.bu-kalipta-tanimli-hareket-y')))}
          <div class="ladders">${map(list, ladderBlock)}</div>`,
      }),

      when(areaId === 'kuvvet', () => K.Entry({
        label:yz('spi.move.kalip-dengesi'), meta:'haftalık', body:balanceBody(),
      })),

      K.Entry({
        /* Üç bölümde aynı kart: başlıkta bölümün adı, yoksa gizle.js yalnız
           ilkini yönetirdi (aynı anahtar). Öğreti ⓘ'de ve künyede; gizli. */
        label:yz('spi.move.i-lerleme-kurali') + area.label, hint:'progression',
        meta:SP.Move.ADVANCE_SESSIONS + ' seans / ' + SP.Move.ADVANCE_WINDOW + ' gün',
        body:html`<p class="small muted">${yz('spi.move.bir-ust-basamak-mevcut-basam')}
          ${SP.Move.ADVANCE_WINDOW} ${yz('spi.move.gunde')} ${SP.Move.ADVANCE_SESSIONS} ${yz('spi.move.seans-yapildiginda-acilir-si')}</p>`,
      }),
    ]);
  }

  function cardioBody(){
    const ids = SP.EXERCISES.filter(e => e.kind === 'cardio').map(e => e.id);
    const days = U.lastDays(14);
    let thisWeek = 0, lastWeek = 0;
    days.forEach((d, i) => {
      const mins = M.workoutsOf(d).filter(w => (w.items || []).some(it => ids.indexOf(it.exId) >= 0))
        .reduce((a, w) => a + (w.minutes || 0), 0);
      if(i >= 7) thisWeek += mins; else lastWeek += mins;
    });
    const cap = Math.round(lastWeek * 1.1);
    return html`
      <div class="cols-3">
        ${K.Stat({ label:yz('spi.move.bu-hafta'), value:String(thisWeek), unit:'dk' })}
        ${K.Stat({ label:yz('spi.move.gecen-hafta'), value:String(lastWeek), unit:'dk' })}
        ${K.Stat({ label:yz('spi.move.bu-haftanin-tavani'), value:lastWeek ? String(cap) : '—', unit:'dk',
          note:lastWeek ? '%10 kuralı' : 'geçen hafta veri yok' })}
      </div>
      ${K.Notice({ tone:lastWeek && thisWeek > cap ? 'warn' : 'info',
        body:lastWeek
          ? (thisWeek > cap
            ? yz('spi.move.bu-hafta-gecen-haftanin-10')
            : SP.LOAD_RULES.weeklyGrowth.note)
          : yz('spi.move.gecen-hafta-kardiyo-kaydi-yo') })}`;
  }

  /* ------------------------------------------------------------ rotalar

     Strava'daki rota haritası (kullanıcı, 2026-10-03: «minimalistliği
     bozmadan»). Ekranda TEK kart: son rotanın haritası ve bir satır özet.
     Dilimler, yükseklik ve ısı haritası karta dokununca açılan kağıtta.
     Rota iki yoldan gelir: hareket ederken canlı kayıt (kullanıcı, aynı
     gün: «rotayı biz hareket ederken çizecek») ya da GPX dosyası.
     Hesap `core/rota.js`, çizim `core/harita.js`, kayıt `core/canli.js`. */
  const Ro = () => SP.Rota;
  const sayiHtml = s => {
    const L = window.LIFEOS || {};
    return L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
  };
  const rotaIzi = w => Ro().coz(w.rota.iz);
  const ROTA_DOSYA_EN_COK = 25 * 1024 * 1024;

  /* «5,24 km · 28:10 · 5:22 dk/km» — bisiklette tempo yerine hız. */
  function rotaSatiri(r, exId){
    const R = Ro();
    const parca = [R.km(r.mesafe) + ' km', R.sureMetni(r.hareket)];
    if(R.hizMi(exId)){
      const h = R.hiz(r.hareket, r.mesafe);
      if(h != null) parca.push(U.fmtNum(Math.round(h * 10) / 10) + ' km/sa');
    }else{
      const t = R.tempo(r.hareket, r.mesafe);
      if(t != null) parca.push(R.sureMetni(t) + ' dk/km');
    }
    return parca.join(' · ');
  }
  function rotaAdi(w){
    return w.name + ' · ' + U.fmtShort(w.rota ? U.iso(new Date(w.rota.bas)) : w.date);
  }

  function gpxDugmesi(){
    return html`<label class="btn btn--sm btn--ghost rota__ekle">
      ${raw(UI.icon('plus'))}<span class="btn__label">${yz('spi.move.gpx-ekle')}</span>
      <input type="file" class="sr-only"
        accept=".gpx,application/gpx+xml,application/xml,text/xml,application/octet-stream"
        data-change="rota-dosya" aria-label="GPX dosyası seç"/>
    </label>`;
  }

  /* Hareket seçicilerinde kısa ad: «Tempolu yürüyüş» telefonda iki satıra
     bölünüyordu. */
  const KISA_AD = { kosu:'Koşu', yuruyus:'Yürüyüş', bisiklet:'Bisiklet' };
  const turSecici = (act, value) => K.Segmented({ act, value:value || '', aria:yz('spi.move.hareket-turu'), block:true,
    items:Ro().HAREKETLER.map(id => ({ value:id, label:KISA_AD[id] || SP.EX_BY_ID[id].name })) });

  /* Kartta tek ana eylem («Kayda başla») ve tek bağlantı («Tümü»). Kayıt
     varken ana eylemin yerinde kaydın durumu durur. GPX ekle ve ısı
     haritası «Tümü» kağıdında; rota yokken GPX ekle kartta kalır. */
  function rotaKarti(){
    const R = Ro(), rotalar = R.liste(S.workouts), son = rotalar[0];
    const c = SP.Canli.durum();
    return K.Entry({
      label:yz('spi.move.rotalar'), hint:'rota', meta:rotalar.length ? rotalar.length + ' rota' : null,
      action:c ? null : K.Button({ label:yz('spi.move.kayda-basla'), icon:'play', size:'sm', act:'canli-ac' }),
      body:html`<div class="rota" data-drop="rota-dosya">
        ${when(c, () => html`<div class="canli-kart" id="canli-kart" data-hal="${c.hal}">${raw(canliKartIc(c))}</div>`)}
        ${son ? html`
        ${raw(SP.Harita.ciz([rotaIzi(son)], { gen:640, yuk:300,
          dugme:{ act:'rota-ac', id:son.id, aria:yz('spi.move.rotayi-ac') + rotaAdi(son) } }).html)}
        <div class="rota__satir">
          <b class="small">${rotaAdi(son)}</b>
          <span class="small dim num">${rotaSatiri(son.rota, R.exOf(son))}</span>
        </div>
        ${when(R.rekorlar(S.workouts, R.exOf(son)).length, () => html`<div class="rota__satir">
          <b class="small">${yz('spi.move.en-iyi')}</b>
          <span class="small dim num">${R.rekorlar(S.workouts, R.exOf(son)).map(x => x.km + ' km ' + R.sureMetni(x.sn)).join(' · ')}</span>
        </div>`)}
        <div class="rota__alt">${K.Button({ label:yz('spi.move.tumu'), size:'sm', tone:'ghost', act:'rota-tumu' })}</div>`
        : when(!c, () => html`<p class="small dim">${yz('spi.move.hareket-ettikce-rota-haritad')}</p>
          <div class="rota__alt">${gpxDugmesi()}</div>`)}
      </div>`,
    });
  }

  /* ------------------------------------------------------- canlı kayıt

     Kayıt motoru ekrandan bağımsızdır (core/canli.js): kağıt kapansa,
     başka ekrana geçilse de sürer. Ekran yalnız gösterir. Saniyede bir
     yalnız METİNLER tazelenir; düğmeler hâl değişince yeniden çizilir
     (her saniye çizilen düğme odağı kullanıcının elinden alır). Harita en
     sık üç saniyede bir çizilir. */
  let canliTur = null, canliSaat = null, canliHal = null;
  let canliCizim = { n:-1, t:0 };

  function canliKartMetni(c){
    const R = Ro(), o = SP.Canli.ozet();
    const ad = c.hal === 'kayitta' ? yz('spi.move.kayit-suruyor') : c.hal === 'bitti' ? yz('spi.move.kaydedilmemis-rota')
      : c.geriGeldi ? yz('spi.move.kayit-yarida-kaldi') : 'Duraklatıldı';
    const km = o ? R.km(o.mesafe) + ' km' : c.nokta ? '0,00 km' : 'konum bekleniyor';
    return String(html`<i class="${cls('canli-kart__isaret', c.hal === 'kayitta' && 'is-canli')}" aria-hidden="true"></i>
      <b class="small">${ad}</b> <span class="small dim num">${R.sureMetni(c.sure)} · ${km}</span>`);
  }
  function canliKartIc(c){
    const dug = c.hal === 'kayitta'
      ? K.Button({ label:yz('spi.move.ac'), size:'sm', act:'canli-ekran' })
      : c.hal === 'bitti'
        ? html`${K.Button({ label:yz('spi.move.gozden-gecir'), size:'sm', tone:'primary', act:'canli-gozden' })}
          ${K.Button({ label:yz('spi.move.sil'), size:'sm', tone:'ghost', act:'canli-sil' })}`
        : html`${K.Button({ label:yz('spi.move.surdur'), icon:'play', size:'sm', tone:'primary', act:'canli-surdur' })}
          ${K.Button({ label:yz('spi.move.bitir'), size:'sm', act:'canli-bitir' })}`;
    return String(html`<span class="canli-kart__ne" id="canli-kart-ne">${raw(canliKartMetni(c))}</span>
      <span class="canli-kart__dug">${dug}</span>`);
  }

  function canliBaslatKagidi(){
    const R = Ro();
    if(!canliTur){ const son = R.liste(S.workouts)[0]; canliTur = (son && R.exOf(son)) || 'kosu'; }
    UI.sheet({
      title:yz('spi.move.kayda-basla'),
      body:String(html`${turSecici('canli-tur', canliTur)}
        <p class="tiny dim">${SP.Canli._ortam.arkaPlan()
          ? yz('spi.move.ekran-kapaliyken-de-kaydeder')
          : yz('spi.move.ekran-acik-kalmali-kilitli-e')}</p>`),
      footer:String(html`${K.Button({ label:yz('spi.move.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.move.baslat'), icon:'play', tone:'primary', act:'canli-basla' })}`),
      noFocus:true,
    });
  }

  function canliSayilar(c){
    const R = Ro(), o = SP.Canli.ozet(), bisiklet = R.hizMi(c.tur);
    const yok = { deger:null, kesinlik:'missing' };
    const hesap = (deger, birim, extra) => Object.assign({ deger, birim, kesinlik:'computed' }, extra);
    const hiz = o && R.hiz(o.hareket, o.mesafe), tempo = o && R.tempo(o.hareket, o.mesafe);
    const kutu = (ad, s) => '<div class="canli__sayi"><span class="tiny dim">' + ad
      + '</span><b class="canli__deger num">' + sayiHtml(s) + '</b></div>';
    return kutu('Süre', { deger:R.sureMetni(c.sure), kesinlik:'measured' })
      + kutu('Mesafe', o ? hesap(o.mesafe / 1000, 'km', { ondalik:2 }) : yok)
      + (bisiklet
        ? kutu(yz('spi.move.ort-hiz'), hiz == null ? yok : hesap(Math.round(hiz * 10) / 10, 'km/sa'))
        : kutu(yz('spi.move.ort-tempo'), tempo == null ? yok : hesap(R.sureMetni(tempo), 'dk/km')));
  }
  function canliHarita(c){
    const o = SP.Canli.ozet();
    const h = o ? SP.Harita.ciz([Ro().sakla(o.iz)], { gen:640, yuk:360, etiket:yz('spi.move.canli-rota') }).html : '';
    return h || '<div class="harita canli__bos" style="aspect-ratio:640 / 360"><span class="small dim">'
      + (c.nokta ? yz('spi.move.hareket-bekleniyor') : yz('spi.move.konum-bekleniyor')) + '</span></div>';
  }
  /* Durum satırı yalnız DİKKAT gerekince konuşur; her şey yolundaysa boş. */
  function canliDurumMetni(c){
    if(c.hal !== 'kayitta'){
      return c.hata || (c.geriGeldi ? yz('spi.move.sayfa-kapandigi-icin-kayit-d') : yz('spi.move.duraklatildi-aradaki-yol-say'));
    }
    if(c.hata) return c.hata;
    if(!c.nokta) return c.bekleme || yz('spi.move.konum-bekleniyor');
    return c.ekran === 'acik' || c.ekran === 'arka-plan' ? '' : yz('spi.move.ekrani-acik-tut-kilitli-ekra');
  }
  function canliDugmeleri(c){
    return String(html`${c.hal === 'kayitta'
      ? K.Button({ label:yz('spi.move.duraklat'), icon:'pause', act:'canli-duraklat' })
      : K.Button({ label:yz('spi.move.surdur'), icon:'play', act:'canli-surdur' })}
      ${K.Button({ label:yz('spi.move.bitir'), icon:'stop', tone:'primary', act:'canli-bitir' })}`);
  }

  function canliEkrani(){
    const c = SP.Canli.durum();
    if(!c) return;
    if(c.hal === 'bitti'){ handle['canli-gozden'](); return; }
    UI.sheet({
      title:c.tur ? KISA_AD[c.tur] : 'Kayıt', wide:true,
      body:String(html`<div class="canli" id="canli-ekran">
        <div class="canli__sayilar" id="canli-sayilar">${raw(canliSayilar(c))}</div>
        <div id="canli-harita">${raw(canliHarita(c))}</div>
        <p class="tiny dim" id="canli-durum" aria-live="polite">${canliDurumMetni(c)}</p>
      </div>`),
      footer:canliDugmeleri(c),
      noFocus:true,
    });
    const ayak = document.querySelector('#sheet .sheet__foot');
    if(ayak) ayak.dataset.hal = c.hal;
    canliCizim = { n:c.nokta, t:Date.now() };
  }

  /* Ekrandaki canlı parçaları yerinde tazeler; çizim yapmaz. */
  function canliTazele(){
    const c = SP.Canli.durum();
    if(!c || c.hal !== 'kayitta'){ clearInterval(canliSaat); canliSaat = null; }
    const kart = document.getElementById('canli-kart');
    if(kart && c){
      if(kart.dataset.hal !== c.hal){ kart.innerHTML = canliKartIc(c); kart.dataset.hal = c.hal; }
      else{ const ne = document.getElementById('canli-kart-ne'); if(ne) ne.innerHTML = canliKartMetni(c); }
    }
    const ekran = document.getElementById('canli-ekran');
    if(!ekran || !c) return;
    document.getElementById('canli-sayilar').innerHTML = canliSayilar(c);
    /* Durum satırı aria-live: yalnız DEĞİŞİNCE yazılır, yoksa ekran
       okuyucu aynı cümleyi her saniye yeniden okur. */
    const dur = document.getElementById('canli-durum'), metin = canliDurumMetni(c);
    if(dur.textContent !== metin) dur.textContent = metin;
    if(c.nokta !== canliCizim.n && (canliCizim.n < 2 || Date.now() - canliCizim.t >= 3000)){
      document.getElementById('canli-harita').innerHTML = canliHarita(c);
      canliCizim = { n:c.nokta, t:Date.now() };
    }
    const ayak = ekran.closest('.sheet').querySelector('.sheet__foot');
    if(ayak && ayak.dataset.hal !== c.hal){ ayak.innerHTML = canliDugmeleri(c); ayak.dataset.hal = c.hal; }
  }
  function canliSaatKur(){
    if(!canliSaat) canliSaat = setInterval(canliTazele, 1000);
  }

  /* Motorun kendi başına değiştirdiği hâl (izin kalktı, kayıt silindi)
     de ekrana yansır; hata cümlesi bildirim olarak söylenir. */
  SP.Canli.dinle(olay => {
    if(olay.tip === 'hata') UI.toast(olay.why);
    const c = SP.Canli.durum(), hal = c ? c.hal : null;
    if(hal === 'kayitta') canliSaatKur();
    if(hal === canliHal) return;
    const kartVardi = canliHal != null;
    canliHal = hal;
    canliTazele();
    /* Kart kabı hâlin VARLIĞINA bağlı: kayıt doğunca ya da silinince
       ekran yeniden çizilir. */
    if(S.route === 'move' && kartVardi !== (hal != null)) SP.App.render();
  });

  function canliOnizle(rota){
    const c = SP.Canli.durum();
    rotaTaslak = { rota, tur:c && c.tur, turYazi:null, canli:true };
    onizleme();
  }

  function rotaKagidi(w){
    const R = Ro(), r = w.rota, exId = R.exOf(w);
    const zaman = U.iso(new Date(r.bas));
    const hesap = (deger, birim, formul) => ({ deger, birim, kesinlik:'computed', zaman, formul,
      girdiler:[{ ad:yz('spi.move.gps-noktasi'), deger:r.nokta, kesinlik:'measured' }] });
    const tempo = R.tempo(r.hareket, r.mesafe), hiz = R.hiz(r.hareket, r.mesafe);
    const tirmanis = r.tirmanis == null
      ? { deger:null, kesinlik:'missing' }
      : hesap(r.tirmanis, 'm', 'yumuşatılmış yükseklikte ' + R.TIRMANIS_ESIK + ' m eşikle toplam çıkış');
    /* Çubuk hızı çizer, sıfırdan başlar: tempoda «küçük daha iyi» çubukta ters okunurdu.
       Sayı aynı satırda olduğu için çubuk ekran okuyucudan gizlenir. Vurgu yalnız en hızlı km. */
    const enHiz = Math.max(0, ...(r.dilimler || []).map(x => R.hiz(x.sn, x.m) || 0));
    const hizCubugu = x => {
      const h = R.hiz(x.sn, x.m);
      return h == null ? '' : raw('<span class="rota-tempo' + (h === enHiz ? ' is-en' : '') + '" style="width:' + Math.round(h / enHiz * 100) + '%" aria-hidden="true"></span>');
    };
    const dilimSatiri = x => [
      x.m >= 1000 ? String(r.dilimler.indexOf(x) + 1) : R.km(x.m),
      R.hizMi(exId)
        ? (R.hiz(x.sn, x.m) == null ? '—' : U.fmtNum(Math.round(R.hiz(x.sn, x.m) * 10) / 10) + ' km/sa')
        : (R.tempo(x.sn, x.m) == null ? '—' : R.sureMetni(R.tempo(x.sn, x.m))),
      hizCubugu(x),
      x.dy == null ? '—' : (x.dy > 0 ? '+' : '') + U.fmtNum(x.dy) + ' m',
    ];
    const kirilan = R.kirilanlar(w, S.workouts);
    UI.sheet({
      title:w.name, wide:true,
      subtitle:U.fmtDate(zaman) + (r.ad ? ' · ' + r.ad : ''),
      /* Tek sarmal: kağıt gövdesi esnek sütundur ve tablo orada büzülür
         (bkz. css/rota.css › .rota-kagit). */
      body:String(html`<div class="rota-kagit">
        ${raw(SP.Harita.ciz([rotaIzi(w)], { gen:640, yuk:360, etiket:yz('spi.move.rota') + rotaAdi(w) }).html)}
        ${when(kirilan.length, () => K.Notice({ tone:'info', class:'mt-16',
          body:yz('spi.move.yeni-rekor') + kirilan.map(x => x.km + ' km ' + R.sureMetni(x.sn) + ' (' + yz('spi.move.onceki') + R.sureMetni(x.onceki) + ')').join(', ') }))}
        <div class="cols-4 mt-16">
          ${K.Stat({ label:yz('spi.move.mesafe'), value:raw(sayiHtml(Object.assign(hesap(r.mesafe / 1000, 'km',
            yz('spi.move.gps-noktalari-arasi-mesafele')), { ondalik:2 }))) })}
          ${K.Stat({ label:yz('spi.move.hareket-suresi'), value:raw(sayiHtml({ deger:R.sureMetni(r.hareket), kesinlik:'computed',
            zaman, formul:'hızın ' + U.fmtNum(R.HAREKET_MS) + ' m/sn üstünde olduğu süre' })),
            note:r.sure - r.hareket >= 60 ? 'toplam ' + R.sureMetni(r.sure) : null })}
          ${R.hizMi(exId)
            ? K.Stat({ label:yz('spi.move.ortalama-hiz'), value:raw(sayiHtml(hiz == null ? { deger:null, kesinlik:'missing' }
              : hesap(Math.round(hiz * 10) / 10, 'km/sa', 'mesafe ÷ hareket süresi'))) })
            : K.Stat({ label:yz('spi.move.ortalama-tempo'), value:raw(sayiHtml(tempo == null ? { deger:null, kesinlik:'missing' }
              : { deger:R.sureMetni(tempo), birim:'dk/km', kesinlik:'computed', zaman,
                formul:'hareket süresi ÷ mesafe' })) })}
          ${K.Stat({ label:yz('spi.move.tirmanis'), value:raw(sayiHtml(tirmanis)),
            note:r.tirmanis == null ? 'dosyada yükseklik yok' : null })}
        </div>
        ${when(r.profil, () => html`<h3 class="section-h mt-24">${yz('spi.move.yukseklik')}</h3>
          ${raw(SP.Harita.profilSvg(r.profil, r.mesafe))}`)}
        ${when((r.dilimler || []).length, () => html`<h3 class="section-h mt-24">${yz('spi.move.dilimler')}</h3>
          ${K.Table({ tight:true,
            headers:['Km', { label:R.hizMi(exId) ? 'Hız' : 'Tempo', num:true }, yz('spi.move.goreli-hiz'), { label:yz('spi.move.yukseklik'), num:true }],
            rows:r.dilimler.map(dilimSatiri) })}`)}
      </div>`),
      footer:String(html`${K.Button({ label:yz('spi.move.sil'), tone:'danger', act:'del-session', data:{ 'data-id':w.id } })}
        ${K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })}`),
      noFocus:true,
    });
  }

  function rotaListesi(){
    const R = Ro(), rotalar = R.liste(S.workouts);
    UI.sheet({
      title:yz('spi.move.rotalar'), subtitle:rotalar.length + ' rota',
      body:String(html`<div class="list">${map(rotalar, w => html`
        <button type="button" class="listitem rota__satirdugme" data-act="rota-ac" data-id="${w.id}">
          <span class="grow">
            <b class="small">${rotaAdi(w)}</b>
            <span class="tiny dim num" style="display:block">${rotaSatiri(w.rota, R.exOf(w))}</span>
          </span>
          ${raw(UI.icon('right'))}
        </button>`)}</div>`),
      footer:String(html`<span class="rota__ayak">${gpxDugmesi()}
        ${when(rotalar.length > 1, () => K.Button({ label:yz('spi.move.isi-haritasi'), size:'sm', tone:'ghost', act:'rota-isi' }))}</span>
        ${K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })}`),
      noFocus:true,
    });
  }

  function isiKagidi(){
    const R = Ro(), b = SP.Harita.bolge(R.liste(S.workouts).map(rotaIzi));
    UI.sheet({
      title:yz('spi.move.isi-haritasi'), wide:true,
      subtitle:b.secilen.length + ' rota üst üste',
      body:String(html`
        ${raw(SP.Harita.ciz(b.secilen, { gen:640, yuk:480, isi:true,
          etiket:yz('spi.move.isi-haritasi-2') + b.secilen.length + ' rota' }).html)}
        ${when(b.disarida, () => html`<p class="tiny dim mt-8">${b.disarida} ${yz('spi.move.rota-baska-bir-bolgede-bu')}</p>`)}`),
      footer:String(K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  /* İçe aktarma ve canlı kaydın sonu: rota ÖNİZLENİR; kayıt yalnız
     «Kaydet»le. Tür bilinmiyorsa seçilmeden kaydedilmez (AGENTS §1.7).
     Canlı kayıtta «Sonra» kaydı silmez: kartta «Kaydedilmemiş rota»
     olarak bekler. */
  let rotaTaslak = null;
  const sureKisa = sn => sn < 60 ? sn + ' sn' : Math.round(sn / 60) + ' dk';
  function onizleme(){
    const R = Ro(), t = rotaTaslak, r = t.rota;
    const bas = new Date(r.bas);
    const saat = String(bas.getHours()).padStart(2, '0') + ':' + String(bas.getMinutes()).padStart(2, '0');
    UI.sheet({
      title:t.canli ? yz('spi.move.kaydi-kaydet') : yz('spi.move.rotayi-ekle'), wide:true,
      subtitle:U.fmtDate(U.iso(bas)) + ' · ' + saat,
      body:String(html`
        ${raw(SP.Harita.ciz([R.coz(r.iz)], { gen:640, yuk:340, etiket:yz('spi.move.eklenecek-rota') }).html)}
        <p class="small num mt-12">${rotaSatiri(r, t.tur)}${r.tirmanis != null
          ? ' · ↑ ' + U.fmtNum(r.tirmanis) + ' m' : ''}</p>
        <div class="mt-16">${turSecici('rota-tur', t.tur)}</div>
        ${when(!t.tur, () => html`<p class="tiny dim mt-8">${t.canli ? yz('spi.move.hangi-hareket-oldugunu-sec')
          : yz('spi.move.dosyada-tur-yazmiyor') + (t.turYazi ? ' («' + t.turYazi + '» tanınmadı)' : '')
            + '; hangisi olduğunu seç.'}</p>`)}
        ${when(r.atlanan, () => html`<p class="tiny dim mt-8">${r.atlanan} ${yz('spi.move.bozuk-gps-noktasi-atlandi')}</p>`)}
        ${when(r.zayif, () => html`<p class="tiny dim mt-8">${r.zayif} ${yz('spi.move.zayif-konum')}${SP.Canli.DOGRULUK_M} m'den kötü) ize alınmadı.</p>`)}
        ${when(r.bosluk, () => html`<p class="tiny dim mt-8">${sureKisa(r.bosluk)} ${yz('spi.move.boyunca-konum-gelmedi-ekran')}</p>`)}`),
      footer:String(html`${K.Button({ label:t.canli ? 'Sonra' : 'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:yz('spi.move.kaydet'), tone:'primary', act:'rota-kaydet', disabled:!t.tur })}`),
      noFocus:true,
    });
  }

  /* ---------------------------------------------------------- dinlenme

     Dinlenme sayfası yeni bir kural icat etmez; var olan kuralların
     dinlenmeye bakan yüzünü tek yerde toplar: toparlanma bandı, indirme
     haftası, son hafta / son ay oranı, uyku ve boş gün sayısı. */
  function restView(){
    const r = SP.Move.readiness();
    const rx = SP.Move.prescription();
    const dl = SP.Move.deloadWeek();
    const a = SP.Move.acwr();
    const days = U.lastDays(7);
    const off = days.filter(d => !M.workoutsOf(d).length).length;
    const sleepVals = days.map(d => (S.vitals[d] || {}).sleep).filter(v => v != null);
    const avgSleep = sleepVals.length ? U.round(U.sum(sleepVals) / sleepVals.length, 1) : null;

    return K.Ledger([
      K.Entry({
        label:yz('spi.move.bugun-dinlenmeli-misin'), hint:'recovery-order',
        meta:rx.kind === 'rest' ? 'evet' : rx.kind === 'full' ? 'hayır' : 'hafiflet',
        action:when(!r.ok, () => K.Button({ label:yz('spi.move.veri-gir'),
          act:'go', data:{ 'data-route':'today' } })),
        body:html`
          ${when(r.ok, () => html`<div class="row wrap" style="gap:26px">
            ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:122,
              bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
            <p class="grow small" style="min-width:210px">${r.band.order}</p>
          </div>`)}
          ${when(!r.ok, () => K.Notice({ tone:'info', body:r.note }))}
          ${when(rx.kind === 'rest', () => K.Notice({ tone:'info',
            body:yz('spi.move.tam-dinlenme-gunu-de-bos')
              + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş ve bir mobilite akışı.' }))}`,
      }),

      K.Entry({
        label:yz('spi.move.i-ndirme-haftasi'), hint:'deload',
        meta:!dl.started ? 'başlamadı' : dl.due ? 'bu hafta' : dl.inCycle + '/' + dl.every,
        body:html`<p class="small">${dl.note}</p>`,
      }),

      K.Entry({
        label:yz('spi.move.son-yedi-gun'), hint:'load', meta:off + ' boş gün',
        body:html`${K.Ayrinti({ govde:html`<p>${yz('spi.move.ust-uste-bos-gecen-gunler')}</p>` })}
          <div class="cols-3">
          ${K.Stat({ label:yz('spi.move.bos-gun'), value:String(off), unit:'/ 7',
            note:off === 0 ? 'hiç boş gün yok' : off >= 5 ? 'çok az seans' : 'dengeli' })}
          ${K.Stat({ label:yz('spi.move.ortalama-uyku'),
            value:avgSleep == null ? '—' : U.fmtNum(avgSleep), unit:'saat',
            note:avgSleep == null ? 'girilmedi' : sleepVals.length + ' gün girildi' })}
          ${K.Stat({ label:yz('spi.move.son-hafta-son-ay'), value:a.ok ? U.fmtNet(a.ratio) : '—',
            tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
            note:a.ok ? (a.zone === 'ok' ? 'normal' : a.zone === 'high' ? 'ağır' : 'hafif')
              : 'veri yetersiz' })}
        </div>`,
      }),
    ]);
  }

  /* ------------------------------------------------------------ ilerleme */

  function loadBody(){
    const series = SP.Move.loadSeries(30);
    const a = SP.Move.acwr();
    const g = SP.Move.weeklyGrowth();
    const dl = SP.Move.deloadWeek();
    const top = Math.max(100, Math.max.apply(null, series.map(s2 => s2.value)) * 1.1);

    return html`
      ${raw(UI.barChart(series.map(s2 => ({ label:U.fmtShort(s2.date), value:s2.value })),
        { max:top, height:170, goodAt:0 }))}
      <div class="cols-3">
        ${K.Stat({ label:yz('spi.move.bu-hafta'), value:U.fmtNum(SP.Move.loadWindow(7)), unit:'yük' })}
        ${K.Stat({ label:yz('spi.move.son-hafta-son-ay'), value:a.ok ? U.fmtNet(a.ratio) : '—',
          tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
          note:a.ok ? (a.zone === 'ok' ? 'normal' : a.zone === 'high' ? 'ağır' : 'hafif')
            : 'veri yetersiz' })}
        ${K.Stat({ label:yz('spi.move.dongu-haftasi'), value:dl.started ? String(dl.week) : '—',
          note:!dl.started ? 'başlamadı' : dl.due ? 'indirme haftası' : dl.inCycle + '/' + dl.every })}
      </div>
      ${K.Notice({ tone:a.ok ? a.tone : 'info', body:a.note })}
      ${when(g.ok, () => K.Notice({ tone:g.over ? 'warn' : 'info',
        body:yz('spi.move.gecen-haftaya-gore-degisim') + Math.round(g.growth * 100) + '. ' + g.note }))}
      ${when(dl.due, () => K.Notice({ tone:'warn', body:dl.note }))}`;
  }

  let bodyPhotoFile = null;
  let lastBodyAnalysis = null;

  function bodyPhotoSheet(){
    UI.sheet({
      title:yz('spi.move.fotograftan-beden-ve-durus-a'),
      subtitle:yz('spi.move.boydan-fotograf-ile-bki-duru'),
      wide:true,
      body:String(K.Stack([
        when(!SP.Extract.modelReady(), () => K.Notice({ tone:'warn',
          title:yz('spi.move.model-bagli-degil'),
          body:yz('spi.move.fotograftan-analiz-icin-hkm')
            + 'görüntü okuyan bir model ata.' })),
        K.Drop({ act:'body-photo-file', label:yz('spi.move.boydan-vucut-fotografi'), icon:'camera',
          accept:'image/*', hint:yz('spi.move.fotografi-buraya-birak-ya-da') }),
        html`<div id="body-photo-name" class="small dim">${bodyPhotoFile ? bodyPhotoFile.name : ''}</div>`,
        html`<div class="cols-2">
          ${K.Field({ label:yz('spi.move.boyun-cm'), hint:'isteğe bağlı',
            input:K.Input({ id:'bp-height', type:'number', placeholder:'178', value:S.profile && S.profile.height ? S.profile.height : '' }) })}
          ${K.Field({ label:yz('spi.move.kilon-kg'), hint:'isteğe bağlı',
            input:K.Input({ id:'bp-weight', type:'number', placeholder:'74', value:S.profile && S.profile.weight ? S.profile.weight : '' }) })}
        </div>`,
        K.Field({ label:yz('spi.move.ek-not-odaklanilacak-alan'), hint:'örn: omuz düşüklüğü, boyun duruşu vb.',
          input:K.Input({ id:'bp-note', placeholder:yz('spi.move.one-dogru-hafif-kambur-durus') }) }),
        K.Notice({ tone:'info', body:yz('spi.move.bu-analiz-tibbi-bir-teshis')
          + 'her zaman «tahmin» olarak etiketlenir.' }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.move.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.move.analiz-et'), tone:'primary', act:'run-body-photo',
          disabled:!bodyPhotoFile || !SP.Extract.modelReady() })}`),
      noFocus:true,
    });
  }

  function bodyPhotoResultSheet(res){
    lastBodyAnalysis = res;
    const bk = res.biyometrikKompozisyon || res.kompozisyon || {};
    const ps = res.posturSegmentasyonu || (typeof res.postur === 'object' ? res.postur : {}) || {};
    const dh = res.duzelticiHareketRecetesi || res.duzelticiHareket || {};
    const bh = res.beslenmeHidrasyonKoprusu || res.beslenme || {};
    const tg = res.tibbiGuvenlikKalkani || res.guvenlik || {};

    const egzersizList = Array.isArray(dh.egzersizler) && dh.egzersizler.length ? dh.egzersizler
      : [dh.esneme2dk, dh.guclendirme].filter(Boolean);

    UI.sheet({
      title:yz('spi.move.beden-ve-durus-analizi-5'),
      subtitle:yz('spi.move.fotograftan-tahmini-biyometr'),
      wide:true,
      body:String(K.Stack([
        /* 1. Bölüt: Biyometrik Kompozisyon */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">${yz('spi.move.1-biyometrik-kompozisyon')}</b>
            <span class="badge badge--info">${yz('spi.move.cert-estimated-photo')}</span>
          </div>
          <div class="cols-2 mb-8">
            <div class="ogrenme__kutu">
              <span class="tiny dim" style="display:block">${yz('spi.move.tahmini-bki')}</span>
              <div class="h2" style="margin:2px 0">${bk.bki != null ? bk.bki : (res.bki != null ? res.bki : '—')} <small class="small">${bk.kategori || res.kategori || ''}</small></div>
              <span class="tiny dim">${yz('spi.move.beden-tipi')} <b>${bk.bedenTipi || res.bedenTipi || 'Dengeli'}</b></span>
            </div>
            <div class="ogrenme__kutu">
              <span class="tiny dim" style="display:block">${yz('spi.move.tahmini-yag-orani-araligi')}</span>
              <div class="h2" style="margin:2px 0">${bk.yagAralik || res.yagAralik || '—'}</div>
              ${when(bk.belKalca, () => html`<span class="tiny dim">${yz('spi.move.bel-kalca')} <b>${bk.belKalca}</b></span>`)}
            </div>
          </div>
          <div class="row justify-end">
            <button type="button" class="btn btn--xs btn--ghost" data-act="save-body-vitals">
              ${yz('spi.move.bu-olcumleri-bugunun-gunlugu')}
            </button>
          </div>
        </div>`,

        /* 2. Bölüt: Postür Segmentasyonu */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">${yz('spi.move.2-postur-segmentasyonu')}</b>
            <span class="badge badge--muted">${yz('spi.move.bolgesel-analiz')}</span>
          </div>
          <div class="stack-xs small">
            ${when(ps.basBoyun, () => html`<div><span class="tiny dim" style="display:block">BAŞ & BOYUN</span>${U.esc(ps.basBoyun)}</div>`)}
            ${when(ps.omuzSimetri, () => html`<div><span class="tiny dim" style="display:block">${yz('spi.move.omuz-si-metri-si')}</span>${U.esc(ps.omuzSimetri)}</div>`)}
            ${when(ps.omurga, () => html`<div><span class="tiny dim" style="display:block">${yz('spi.move.omurga-hatti')}</span>${U.esc(ps.omurga)}</div>`)}
            ${when(ps.pelvis, () => html`<div><span class="tiny dim" style="display:block">${yz('spi.move.pelvi-s-hi-zasi')}</span>${U.esc(ps.pelvis)}</div>`)}
            ${when(typeof res.postur === 'string' && !ps.basBoyun, () => html`<div>${U.esc(res.postur)}</div>`)}
          </div>
        </div>`,

        /* 3. Bölüt: Düzeltici Hareket Reçetesi */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">${yz('spi.move.3-duzeltici-hareket-recetesi')}</b>
            <span class="badge badge--ok">mobilite & güç</span>
          </div>
          <div class="stack-xs small mb-8">
            ${when(dh.esneme2dk, () => html`<div><b>${yz('spi.move.2-dk-esneme')}</b> <span class="dim">${U.esc(dh.esneme2dk)}</span></div>`)}
            ${when(dh.guclendirme, () => html`<div><b>${yz('spi.move.guclendirme')}</b> <span class="dim">${U.esc(dh.guclendirme)}</span></div>`)}
            ${when(dh.adimHedefi, () => html`<div><b>${yz('spi.move.gunluk-mola')}</b> <span class="dim">${U.esc(dh.adimHedefi)}</span></div>`)}
          </div>
          ${when(egzersizList && egzersizList.length, () => html`
            <div class="row wrap gap-4 mb-8">
              ${map(egzersizList, eg => html`<span class="badge badge--muted">${U.esc(eg)}</span>`)}
            </div>`)}
          <div class="row justify-end">
            <button type="button" class="btn btn--xs btn--primary" data-act="save-corrective-session">
              ${yz('spi.move.duzeltici-rutini-seanslara-e')}
            </button>
          </div>
        </div>`,

        /* 4. Bölüt: Beslenme & Hidrasyon Köprüsü */
        html`<div class="ogrenme">
          <div class="row between items-center mb-6">
            <b class="small" style="color:var(--text)">4. Beslenme & Hidrasyon Köprüsü</b>
            <span class="badge badge--muted">${yz('spi.move.doku-onarimi')}</span>
          </div>
          <div class="row wrap gap-8 mb-6">
            ${when(bh.proteinAralik, () => html`<span class="badge badge--info">Protein: ${U.esc(bh.proteinAralik)}</span>`)}
            ${when(bh.suHedefi, () => html`<span class="badge badge--info">Su: ${U.esc(bh.suHedefi)}</span>`)}
          </div>
          ${when(bh.oneri, () => html`<p class="small dim mb-0">${U.esc(bh.oneri)}</p>`)}
        </div>`,

        /* 5. Bölüt: Tıbbi Güvenlik Kalkanı */
        K.Notice({
          tone:'warn',
          title:yz('spi.move.5-tibbi-guvenlik-uyarisi-tah'),
          body: tg.uyari || yz('spi.move.bu-analiz-tibbi-bir-teshis-2')
        }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })}
        ${when(bodyPhotoFile, () => K.Button({ label:yz('spi.move.fotografi-bugune-kaydet'), tone:'primary', act:'save-body-photo-today' }))}`),
      noFocus:true,
    });
  }

  /* Vücut fotoğrafları: kendini zaman içinde görmek için tek satır minik
     kare; ilki bugünündür. Fotoğraftan SAYI ÜRETİLMEZ — kilo, yağ oranı,
     endeks ölçülür, fotoğraftan tahmin edilmez (AGENTS §1.1). */
  /* VÜCUT ANALİZİ (core/vucut.js, KISI-PLANI Faz 6): son ölçülerden BKİ,
     bel/boy, yağ oranı (ölçülen ya da Donanma yöntemi), yağsız kütle, kilo
     eğilimi ve kaba enerji tahmini. Eksik ölçü sıfır sayılmaz: satır yazılmaz,
     neyin eksik olduğu söylenir. Boyun ve kalça burada girilir. */
  function vucutVerisi(){
    const son = {}, kilolar = [];
    let kcal = 0, ogunGun = 0;
    for(let i = 59; i >= 0; i--){
      const d = U.iso(U.addDays(U.today(), -i));
      const v = SP.S.vitals[d] || {};
      ['weight', 'waist', 'bodyfat', 'neck', 'hip'].forEach(k => { if(v[k] != null && v[k] !== '') son[k] = Number(v[k]); });
      if(i < 28 && v.weight != null) kilolar.push({ tarih:d, kg:Number(v.weight) });
      if(i < 28){ const t = SP.Nutri.dayTotals(d); if(!t.empty){ kcal += t.kcal; ogunGun++; } }
    }
    return { profil:S.profile || {}, son, kilolar, ortKcal:ogunGun ? kcal / ogunGun : null, ogunGun };
  }
  function vucutAnalizKutusu(){
    if(!SP.Vucut) return '';
    const a = SP.Vucut.analiz(vucutVerisi());
    const satir = (ad, deger, cert, not) => html`<div class="listitem"><div class="grow"><b class="small">${ad}</b>
      ${when(not, () => html`<div class="tiny dim">${not}</div>`)}</div>
      <span class="num small">${deger}</span>${P.cert(cert)}</div>`;
    const kadin = (S.profile || {}).sex === 'female';
    const vg = x => String(x).replace('.', ',');
    return K.Entry({
      wide:true, label:yz('spi.move.vucut-analizi'), hint:'vucut-analizi', meta:a.eksik.length ? a.eksik.length + ' ölçü eksik' : 'güncel',
      body:html`<div class="list">
        ${when(a.bki, () => satir(yz('spi.move.beden-kitle-indeksi'), vg(a.bki.deger) + ' · ' + a.bki.bant, 'derived', a.bki.not))}
        ${when(a.belBoy, () => satir(yz('spi.move.bel-boy-orani'), String(a.belBoy.deger).replace('.', ','), 'derived', a.belBoy.not))}
        ${when(a.yag, () => satir(yz('spi.move.yag-orani'), '%' + String(a.yag.deger).replace('.', ','), a.yag.etiket === 'ölçüldü' ? 'measured' : 'estimated',
          a.yag.yontem + (a.yag.not ? ' · ' + a.yag.not : '')))}
        ${when(a.yagsiz, () => satir(yz('spi.move.yagsiz-kutle'), vg(a.yagsiz.kutle) + ' kg · FFMI ' + vg(a.yagsiz.ffmiDuz), a.yag && a.yag.etiket === 'ölçüldü' ? 'derived' : 'estimated',
          yz('spi.move.yag-kutlesi') + vg(a.yagsiz.yagKg) + ' kg; FFMI boya göre düzeltilmiş.'))}
        ${a.egilim.ok
          ? satir(yz('spi.move.kilo-egilimi'), (a.egilim.haftalik > 0 ? '+' : '') + String(a.egilim.haftalik).replace('.', ',') + ' kg/hafta · ' + a.egilim.yon, 'derived',
              yz('spi.move.son-7-tartinin-ortalamasi') + vg(a.egilim.ortalama7) + ' kg; günlük oynama ayıklandı (' + a.egilim.tarti + ' tartı).')
          : satir(yz('spi.move.kilo-egilimi'), '—', 'missing', a.egilim.why)}
        ${when(a.enerji, () => satir(yz('spi.move.gunluk-harcama-kaba'), a.enerji.harcama + ' kcal', 'estimated', a.enerji.not))}
      </div>
      ${when(a.eksik.length, () => html`<p class="tiny dim mt-8">Eksik: ${a.eksik.join(', ')}${yz('spi.move.eksik-olcu-sifir-sayilmaz')}</p>`)}
      <div class="cols-3 mt-8">
        ${K.Input({ id:'vucut-bel', size:'sm', numeric:true, type:'number', step:'0.5', placeholder:yz('spi.move.bel-cm'), aria:yz('spi.move.bel-cevresi-cm') })}
        ${K.Input({ id:'vucut-boyun', size:'sm', numeric:true, type:'number', step:'0.5', placeholder:yz('spi.move.boyun-cm'), aria:yz('spi.move.boyun-cevresi-cm') })}
        ${when(kadin, () => K.Input({ id:'vucut-kalca', size:'sm', numeric:true, type:'number', step:'0.5', placeholder:yz('spi.move.kalca-cm'), aria:yz('spi.move.kalca-cevresi-cm') }))}
      </div>
      <div class="row mt-8">${K.Button({ label:yz('spi.move.olculeri-kaydet'), size:'sm', act:'vucut-olcu-kaydet' })}</div>`,
    });
  }

  function vucutKutusu(){
    if(!SP.Foto.var()) return '';
    const bugun = U.todayISO();
    const gunler = SP.Foto.sahipler('vucut:').map(s => s.slice(6)).filter(g => g !== bugun);
    const kare = g => raw(String(SP.FotoUI.kutu({ sahip:'vucut:' + g, ad:yz('spi.move.vucut') + U.fmtShort(g), yon:'user' })));
    return K.Entry({
      label:yz('spi.move.vucut-2'), hint:'vucut-foto', meta:gunler.length ? (gunler.length + 1) + ' gün' : null,
      body:html`<div class="foto-serit">
        <span class="foto-serit__ge">${kare(bugun)}<span class="tiny dim">${yz('spi.move.bugun')}</span></span>
        ${map(gunler.slice(0, 12), g => html`<span class="foto-serit__ge">${kare(g)}<span class="tiny dim">${U.fmtShort(g)}</span></span>`)}
      </div>
      <div class="row mt-8">
        ${K.Button({ label:yz('spi.move.fotograftan-beden-ve-durus-a'), icon:'camera', size:'sm', act:'body-photo-open' })}
      </div>`,
    });
  }

  function historyBody(){
    const rows = S.workouts.slice(-20).reverse();
    if(!rows.length) return P.empty(yz('spi.move.henuz-seans-kaydi-yok'));
    return K.Table({ tight:true,
      headers:['Tarih', 'Seans', { label:yz('spi.move.dakika'), num:true }, { label:yz('spi.move.yuk-2'), num:true }],
      rows:rows.map(w => [U.fmtShort(w.date), w.name, String(w.minutes),
        String(SP.Move.sessionLoad(w))]) });
  }

  /* -------------------------------------------------------------- sheet'ler */

  /* Düzenlenen seans kaydedilene kadar burada bekler. */
  let draft = null;

  function sessionSheet(rec){
    const isNew = !S.workouts.some(w => w.id === rec.id);
    const chosen = (rec.items || []).map(i => i.exId);
    UI.sheet({
      title:isNew ? yz('spi.move.seans-ekle') : yz('spi.move.seansi-duzenle'), subtitle:rec.name, wide:true,
      body:String(K.Stack([
        html`<div class="cols-2">
          ${K.Field({ label:yz('spi.move.sure-dakika'),
            input:K.Input({ id:'w-min', type:'number', numeric:true, min:1, step:'5', value:rec.minutes }) })}
          ${K.Field({ label:yz('spi.move.algilanan-zorluk-1-10'), hint:'boş bırakılırsa MET değerinden hesaplanır',
            input:K.Input({ id:'w-rpe', type:'number', numeric:true, min:1, max:10, step:'1',
              value:rec.rpe == null ? '' : rec.rpe }) })}
        </div>`,
        html`<h3 class="section-h">${yz('spi.move.hareketler')}
          <span class="tiny dim">· ${chosen.length} ${yz('spi.move.secili')}</span></h3>`,
        /* Uzun bir onay listesi yerine seçilebilir kartlar. Kalıp her kartın
           kendi satırında yazar: kalıba göre ayrı ayrı bölmek on bir hareket
           için gereksiz yere uzun bir kağıt üretiyordu. */
        html`<div class="picks">${map(SP.EXERCISES, ex => {
          const lvl = SP.EX_BY_ID[ex.id].levels.find(l => l.id === M.currentLevel(ex.id));
          const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
          const group = pattern ? pattern.label
            : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite';
          return K.PickCard({
            label:ex.name,
            meta:group + ' · ' + (lvl ? lvl.name : '') + ' · hedef ' + (lvl ? lvl.to : '—'),
            on:chosen.indexOf(ex.id) >= 0,
            act:'toggle-ex', data:{ 'data-id':rec.id, 'data-ex':ex.id },
          });
        })}</div>`,
        K.Field({ label:yz('spi.move.not'), input:K.Textarea({ id:'w-note', rows:2, value:rec.note || '' }) }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.move.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.move.kaydet'), tone:'primary', act:'save-session', data:{ 'data-id':rec.id } })}`),
      noFocus:true,
    });
  }

  function exerciseDetailSheet(id){
    const ex = SP.EX_BY_ID[id];
    if(!ex) return;
    const card = (SP.EXERCISE_CARD_BY_ID || {})[id] || {};
    const muscles = (ex.muscles && ex.muscles.length) ? ex.muscles.join(', ') : yz('spi.move.tum-vucut');
    const steps = (ex.steps && ex.steps.length) ? ex.steps : (card.steps_tr || []);
    const setup = ex.setup || card.setup_check || '';
    const summary = ex.cue || card.summary || '';

    UI.sheet({
      title: ex.name,
      subtitle: (ex.name_en ? ex.name_en + ' · ' : '') + (ex.equip || 'Ekipmansız'),
      wide: true,
      body: String(K.Stack([
        html`<div class="row wrap gap-6 mb-8">
          <span class="badge badge--info">${ex.pattern ? (yz('spi.move.kalip') + ex.pattern) : (ex.kind === 'cardio' ? 'Kardiyo' : 'Mobilite')}</span>
          <span class="badge badge--muted">${yz('spi.move.hedef-kaslar')} ${U.esc(muscles)}</span>
          ${when(ex.met, () => html`<span class="badge badge--muted">MET: ${ex.met}</span>`)}
        </div>`,
        when(summary, () => html`<p class="small mb-12"><b>${yz('spi.move.ozet')}</b> ${U.esc(summary)}</p>`),
        when(steps && steps.length, () => html`
          <div class="mb-12">
            <h4 class="small mb-4">${yz('spi.move.uygulama-adimlari')}</h4>
            <ol class="small dim pl-16 mb-0" style="line-height:1.5">
              ${map(steps, s => html`<li>${U.esc(s)}</li>`)}
            </ol>
          </div>`),
        when(setup, () => html`
          <div class="ogrenme">
            <b class="tiny dim" style="display:block;margin-bottom:2px">${yz('spi.move.kurulum-ve-guvenli-k-kontrol')}</b>
            <p class="small mb-0">${U.esc(setup)}</p>
          </div>`),
      ])),
      footer: String(html`
        ${K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.move.bu-hareketle-seans-baslat'), tone:'primary', act:'quick-add-session-ex', data:{ 'data-id':ex.id } })}
      `),
      noFocus: true,
    });
  }

  function programsSheet(){
    const list = SP.PROGRAMLAR || [];
    UI.sheet({
      title: yz('spi.move.egitim-programlari'),
      subtitle: list.length + ' hazır hedef ve takip şablonu',
      wide: true,
      body: String(html`
        <div class="stack-sm">
          ${map(list, prog => html`
            <div class="ogrenme">
              <div class="row between gap-8 mb-4">
                <b class="small" style="color:var(--text)">${U.esc(prog.title)}</b>
                <span class="tiny dim">${prog.focus || yz('spi.move.genel-kondisyon')}</span>
              </div>
              <p class="small dim mb-8" style="line-height:1.4">${U.esc(prog.description || '')}</p>
              ${when(prog.exercises && prog.exercises.length, () => html`
                <div class="row wrap gap-4 mb-8">
                  ${map(prog.exercises, exId => {
                    const e = SP.EX_BY_ID[exId] || (SP.EXERCISE_CARD_BY_ID || {})[exId];
                    return html`<span class="badge badge--muted">${e ? e.name_tr || e.name : exId}</span>`;
                  })}
                </div>`)}
              <div class="row justify-end">
                <button type="button" class="btn btn--xs btn--primary" data-act="load-program-session" data-id="${prog.id}">
                  ${yz('spi.move.bu-programla-seans-baslat')}
                </button>
              </div>
            </div>`)}
        </div>
      `),
      footer: String(K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })),
      noFocus: true,
    });
  }

  let metQ = '', metMin = 30, metCat = 'all';
  function metCalcSheet(){
    const weight = (M.kiloOf() || {}).kg || 70;
    let list = SP.MET_REFS || [];
    if(metCat !== 'all') list = list.filter(r => r.category === metCat);
    if(metQ.trim()){
      const n = U.norm(metQ.trim());
      list = list.filter(r => U.norm(r.description + ' ' + (r.category || '')).indexOf(n) >= 0);
    }
    const cats = [{ id:'all', label:yz('spi.move.tumu') }].concat(Object.keys(SP.MET_CATS || {}).map(k => ({ id:k, label:SP.MET_CATS[k] })));

    UI.sheet({
      title: yz('spi.move.met-ile-aktivite-ve-kalori'),
      subtitle: yz('spi.move.2024-adult-compendium-1-111'),
      wide: true,
      body: String(K.Stack([
        html`<div class="cols-2">
          ${K.Field({ label:yz('spi.move.aktivite-ara'),
            input:K.Input({ id:'met-search-input', value:metQ, placeholder:yz('spi.move.orn-bisiklet-yuzme-bahce-kos'),
              change:'met-search-change' }) })}
          ${K.Field({ label:yz('spi.move.sure-dakika'),
            input:K.Input({ id:'met-min-input', type:'number', min:5, step:5, value:String(metMin),
              change:'met-min-change' }) })}
        </div>`,
        html`<div class="row wrap gap-4 mb-8">
          ${map(cats.slice(0, 8), c => K.Chip({ label:c.label, act:'met-pick-cat', on:c.id === metCat,
            data:{ 'data-cat':c.id } }))}
        </div>`,
        html`<div class="stack-xs" style="max-height:280px;overflow-y:auto">
          ${map(list.slice(0, 15), r => {
            const kcal = Math.round(r.met * weight * (metMin / 60));
            return html`
              <div class="row between gap-8 ogrenme__kutu">
                <div class="minw0 grow">
                  <b class="small" style="display:block">${U.esc(r.description)}</b>
                  <span class="tiny dim">${(SP.MET_CATS || {})[r.category] || r.category} ${yz('spi.move.met')} ${r.met}</span>
                </div>
                <div class="row items-center gap-8">
                  <span class="num small" style="color:var(--accent);font-weight:600">${kcal} kcal</span>
                  <button type="button" class="btn btn--xs btn--ghost" data-act="add-met-workout"
                    data-desc="${U.esc(r.description)}" data-met="${r.met}" data-min="${metMin}" data-cat="${r.category || ''}">
                    ${yz('spi.move.seansa-ekle')}
                  </button>
                </div>
              </div>`;
          })}
          ${when(!list.length, () => html`<p class="small dim">${yz('spi.move.eslesen-aktivite-bulunamadi')}</p>`)}
        </div>`,
      ])),
      footer: String(K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })),
      noFocus: true,
    });
  }

  /* ---------- D · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const vkutu = (ad, yuva, ic) => ic ? K.Kutu({ ad, yuva, class:'vkutu', govde:raw(ic) }) : '';
  const GUN_AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  function haftaGunleri(){
    const b = U.today(), i = (b.getDay() + 6) % 7;
    return Array.from({ length:7 }, (_, k) => U.iso(U.addDays(b, k - i)));
  }
  const exAd = id => { const e = (SP.EXERCISES || []).find(x => x.id === id); return e ? e.name : id; };

  /* 075 SET KUTUCUKLARI: bugünün son seansının hareketleri; biten set
     dolar (dokunuş = bir set bitti, dolu kutuya dokunmak geri alır). */
  function setKutusu(){
    if(!VT()) return '';
    const w = M.workoutsOf(U.todayISO()).slice(-1)[0];
    if(!w || !(w.items || []).length) return '';
    return vkutu(yz('spi.move.setler') + w.name, 'ölçüldü', VT().setKutucuklari({ act:'set-bitti', data:{ 'data-w':w.id },
      hareketler:w.items.map((it, i) => ({ i, ad:exAd(it.exId), set:Number(it.sets) || 0, biten:Number(it.setsDone) || 0,
        etiket:it.reps ? String(it.reps) : it.minutes ? it.minutes + 'dk' : null })) }));
  }

  /* 076 HAFTALIK HAREKET HALKALARI: günün hareket dakikası ÷ asgari gün
     dakikası. O gün hiçbir kaydı olmayan geçmiş gün «veri yok». */
  function halkaKutusu(){
    if(!VT()) return '';
    const bugun = U.todayISO(), esik = SP.LOAD_RULES.minDay.minutes;
    const gunler = haftaGunleri().map((d, k) => {
      const dk = U.sum(M.workoutsOf(d).map(w => w.minutes || 0));
      const kayit = M.workoutsOf(d).length || S.vitals[d] || M.mealsOf(d).length;
      return { ad:GUN_AD[k], bugun:d === bugun, gelecek:d > bugun, yok:d < bugun && !kayit, p:esik ? 100 * dk / esik : null };
    });
    return vkutu(yz('spi.move.bu-hafta-hareket'), 'asgari gün ' + esik + ' dk', VT().haftaHalkalari({ gunler }));
  }

  /* 086 ANTRENMAN HAFTASI: yapılan seans dolu; kaydı olmayan geçmiş gün
     «kayıt yok» (dinlenme sayılmaz); plan tutulmadığı için gelecek boş. */
  function haftaKutusu(){
    if(!VT()) return '';
    const bugun = U.todayISO();
    return vkutu(yz('spi.move.antrenman-haftasi'), 'ölçüldü', VT().antrenmanHaftasi({ gunler:haftaGunleri().map((d, k) => {
      const w = M.workoutsOf(d);
      return { ad:GUN_AD[k], bugun:d === bugun, gecti:d < bugun, yapilan:w.length ? w.map(x => x.name).join(' + ') : null };
    }) }));
  }

  /* iPhone Faz 2b (2026-10-02): günün yük emri ve haftanın hareketi tek
     küçük dönen kartta. Skor ve emir kural motorundan (Move.prescription);
     ölçüm yoksa sayı değil cümle. Kırmızı ya da sarı gerekçe (ateş, aşırı
     yük, indirme haftası) emrin altında söylenir: kart küçüldü diye uyarı
     susmaz. Emrin tamamı «Günün yük emri» şeridinde; haftanın halkaları ve
     antrenman haftası gizli bölümde (app.js SADE_GIZLI). */
  function DonenHareket(){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    const ek = rx.reasons.filter(x => x.id !== 'readiness' && x.id !== 'no-data');
    const onemli = ek.find(x => x.kind === 'danger') || ek.find(x => x.kind === 'warn');
    const yuk = rx.factor === 0 ? 'dinlenme' : rx.factor >= 1 ? 'tam yük' : 'yükün %' + Math.round(rx.factor * 100) + '’i';
    const m = [r.ok
      ? { ust:yz('spi.move.gunun-yuk-emri'), sayi:sayi({ deger:r.score, birim:'/100', kesinlik:'computed', zaman:rx.date,
            formul:'toparlanma: girilen ölçümlerin ağırlıklı ortalaması',
            girdiler:r.parts.filter(p => p.score != null).map(p => ({ ad:p.label, deger:p.value, kesinlik:'measured' })) }),
          cumle:r.band.label.toLocaleLowerCase('tr-TR') + ' · ' + yuk + '.', vurgu:onemli ? onemli.short : r.band.order, sistem:'spi' }
      : { ust:yz('spi.move.gunun-yuk-emri'), cumle:yz('spi.move.olcum-bekliyor'), vurgu:onemli ? onemli.short : yz('spi.move.uyku-suresini-yazman-bile-ye'), sistem:'spi',
          dugme:{ label:yz('spi.move.veri-gir'), act:'go', data:{ 'data-route':'today' } } }];
    const bugun = U.todayISO(), esik = SP.LOAD_RULES.minDay.minutes;
    const gunler = haftaGunleri();
    const tutan = gunler.filter(d => U.sum(M.workoutsOf(d).map(w => w.minutes || 0)) >= esik).length;
    const kayitsiz = gunler.filter(d => d < bugun && !(M.workoutsOf(d).length || S.vitals[d] || M.mealsOf(d).length)).length;
    const seans = gunler.reduce((n, d) => n + M.workoutsOf(d).length, 0);
    m.push({ ust:yz('spi.move.bu-hafta'), sayi:sayi({ deger:tutan + '/7', kesinlik:'computed', zaman:bugun,
        formul:'en az ' + esik + ' dk hareket edilen gün / 7',
        girdiler:[{ ad:yz('spi.move.seans-kaydi'), deger:seans, birim:'seans', kesinlik:'measured' }] }),
      cumle:yz('spi.move.gun-hareket'), vurgu:yz('spi.move.asgari-gun') + esik + ' dk.' + (kayitsiz ? ' ' + kayitsiz + ' geçmiş gün kayıtsız.' : ''), sistem:'spi' });
    return raw(V.donen({ id:'spi-hareket', ad:yz('spi.move.hareket-2'), maddeler:m }));
  }

  /* 081 YOĞUNLUK BÖLGELERİ: son 28 günün seans dakikası, SENİN yazdığın
     zorluğa (1–10) göre dört bantta. Nabız ölçülmediği için bant nabız
     değil zorluk bandıdır; eşikleri kod koyar. Zorluğu yazılmamış seans
     banda girmez, altta ayrıca sayılır — «hafif» sayılmaz. */
  const BANT = [{ ad:yz('spi.move.hafif-1-3'), en:3 }, { ad:yz('spi.move.orta-4-6'), en:6 }, { ad:yz('spi.move.zor-7-8'), en:8 }, { ad:yz('spi.move.en-zor-9-10'), en:10 }];
  function yogunlukBantlari(gun, bitis){
    const son = bitis || U.todayISO();
    const bas = U.iso(U.addDays(U.parse(son), -(gun || 28) + 1));
    const dk = BANT.map(() => 0);
    let zorluksuz = 0;
    (S.workouts || []).filter(w => w.date >= bas && w.date <= son).forEach(w => {
      const m = Number(w.minutes) || 0;
      if(!(m > 0)) return;
      const r = Number(w.rpe);
      if(!(r >= 1 && r <= 10)){ zorluksuz++; return; }
      dk[BANT.findIndex(b => r <= b.en)] += m;
    });
    return { bantlar:BANT.map((b, i) => ({ ad:b.ad, dk:dk[i] })), zorluksuz, toplam:dk.reduce((a, x) => a + x, 0) };
  }
  function yogunlukKutusu(){
    if(!VT()) return '';
    const y = yogunlukBantlari(28);
    if(!y.toplam) return '';
    return vkutu(yz('spi.move.yogunluk-son-28-gun'), 'senin zorluk beyanın', VT().yogunlukBolgeleri({ bolgeler:y.bantlar })
      + (y.zorluksuz ? '<p class="tiny dim mt-6">' + y.zorluksuz + (' ' + yz('spi.move.seansin-zorlugu-yazilmadi-ba') + '</p>') : ''));
  }

  /* --------------------------------------------------------------- ekran */

  /* Sekme yok (EKIP-PLANI §1.2): Bugün, dört alan ve İlerleme alt alta;
     bölüm çubuğu kaydırır, bugünkü seans sayısı çubukta rozet. «Kalıp
     dengesi» eskiden üç sekmede ayrı ayrı çiziliyordu; alt alta durunca
     aynı kart üç kez görünürdü — yalnız Kuvvet'te, kalıpların yanında. */
  const BODIES = {
    bugun:() => html`${K.Ledger([DonenHareket(), hazirAntrenmanEntry(), pickSessionEntry(), todaySessionsEntry(), setKutusu(), orderEntry(), halkaKutusu(), haftaKutusu()])}
      <div class="mt-24">${raw(UI.rail(['recovery-order', 'readiness', 'load', 'progression']))}</div>`,
    ilerleme:() => html`${K.Ledger([
        vucutAnalizKutusu(),
        vucutKutusu(),
        K.Entry({ wide:true, label:yz('spi.move.yuk-egrisi'), hint:'load', meta:'son 30 gün',
          body:loadBody() }),
        yogunlukKutusu(),
        K.Entry({ label:yz('spi.move.seans-gecmisi'), meta:S.workouts.length + ' kayıt',
          body:historyBody() }),
      ])}
      <div class="mt-24">${raw(UI.rail(['load', 'deload', 'recovery-order']))}</div>`,
  };

  function govde(t){
    try{
      if(BODIES[t.id]) return BODIES[t.id]();
      return html`${t.id === 'dinlenme' ? restView() : areaView(t.id)}
        <div class="mt-24">${raw(UI.rail(t.id === 'dinlenme'
          ? ['recovery-order', 'deload', 'load']
          : ['progression', 'load', 'deload']))}</div>`;
    }catch(e){
      console.error('Hareket bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:yz('spi.move.bu-bolum-su-an-cizilemedi') });
    }
  }

  /* PANO KARTI (2026-10-20; brand/ortak/pano.js): bu haftanın hareketi
     türe göre yığılmış sütunlarda (kuvvet, kardiyo, mobilite); seansı
     olmayan gün kesik kutu, sıfır değil. */
  const TUR_AD = { strength:'Kuvvet', cardio:'Kardiyo', mobility:'Mobilite' };
  function PanoHareket(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const gunler = []; for(let i = 6; i >= 0; i--) gunler.push(U.iso(U.addDays(U.today(), -i)));
    const GUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const turler = ['strength', 'cardio', 'mobility'];
    const deger = gunler.map(d => {
      const l = M.workoutsOf(d);
      if(!l.length) return null;
      return turler.map(k => l.filter(w => (w.kind || 'strength') === k).reduce((a, w) => a + (Number(w.minutes) || 0), 0));
    });
    const top = deger.filter(Boolean).reduce((a, x) => a + x[0] + x[1] + x[2], 0);
    if(!deger.some(Boolean)) return '<div class="pk-ust">' + P.izgara([P.kart({ tur:'hafta-hareket', ad:yz('spi.move.son-7-gun'), simge:'hareket',
      bos:{ cumle:yz('spi.move.son-yedi-gunde-seans-yok') } }), yukKarti(P)], 'pk-izgara--iki') + '</div>';
    const kart = P.kart({ tur:'hafta-hareket', ad:yz('spi.move.son-7-gun'), simge:'hareket', yuva:top + ' dk',
      govde:P.sutun({ degerler:deger, yukseklik:64, gunler:gunler.map(d => GUN[U.parse(d).getDay()]),
          etiket:yz('spi.move.son-yedi-gunun-hareketi') + deger.filter(x => x == null).length + ' gün seans yok' })
        + '<div class="pk-lejant">' + turler.map((k, i) => '<span><i class="pk-sutun__p' + i + '"></i>' + TUR_AD[k] + '</span>').join('') + '</div>' });
    return '<div class="pk-ust">' + P.izgara([kart, yukKarti(P)], 'pk-izgara--iki') + '</div>';
  }
  /* Yük oranı: son hafta / son ay ortalaması (core/move.js acwr); denge
     aralığı kuraldan (SP.LOAD_RULES.acwr). Geçmiş yetmezse nedeni yazılır. */
  function yukKarti(P){
    const a = SP.Move.acwr(U.todayISO());
    const r = SP.LOAD_RULES.acwr;
    if(!a.ok) return P.kart({ tur:'yuk-orani', ad:yz('spi.move.yuk-orani'), simge:'cubuk', bos:{ cumle:a.note || yz('spi.move.yuk-orani-icin-gecmis-yetmiy') } });
    const v = x => String(x).replace('.', ',');
    return P.kart({ tur:'yuk-orani', ad:yz('spi.move.yuk-orani'), simge:'cubuk', yuva:'hesaplandı',
      govde:P.deger(v(a.ratio), '', a.zone === 'ok' ? 'denge aralığında' : a.zone === 'high' ? 'son hafta ağır' : 'son hafta hafif')
        + P.esik({ deger:a.ratio, esik:r.high, olcek:2, yon:'azalis-iyi', etiket:yz('spi.move.yuk-orani-2') + v(a.ratio) + ', üst sınır ' + v(r.high) })
        + P.not('son 7 gün ÷ son ayın ortalaması · denge ' + v(r.low) + '–' + v(r.high)) });
  }

  LIFEOS.PARCA.blok({ id:'move.pano', sayfa:'move', yer:'ust', ad:'Hareket özeti', ciz:() => PanoHareket() });
  TABS.forEach(t => LIFEOS.PARCA.blok({ id:'move.' + t.id, sayfa:'move', yer:t.id, ad:t.label, ciz:() => govde(t) }));
  async function render(){
    const done = M.workoutsOf(U.todayISO()).length;
    return String(LIFEOS.PARCA.yer('move', 'ust', K) + K.SayfaBolumleri({ act:'move-tab', aria:'Hareket bölümleri',
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:LIFEOS.PARCA.yer('move', t.id, K),
        sayi:t.id === 'bugun' && done ? done : null })) }));
  }

  /* Başka yerden istenen bölüm çizimden sonra görünür yapılır; istek bir
     kez kullanılır. */
  function afterRender(){
    const t = S.ui.moveTab;
    S.ui.moveTab = null;
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);
  }

  /* GPX dosyası: düğmedeki seçici ya da karta bırakılan dosya. */
  const change = {
    async 'rota-dosya'(el){
      const file = el.files && el.files[0];
      if(el.value) el.value = '';          /* aynı dosya yeniden seçilebilsin */
      if(!file) return;
      if(file.size > ROTA_DOSYA_EN_COK){ UI.toast(yz('spi.move.dosya-cok-buyuk-en-cok')); return; }
      const sonuc = Ro().oku(await file.text(), file.name);
      if(!sonuc.ok){ UI.toast(sonuc.why); return; }
      const var_ = Ro().kayitli(sonuc.rota, S.workouts);
      if(var_){ UI.toast(yz('spi.move.bu-rota-zaten-kayitli') + rotaAdi(var_) + '.'); return; }
      rotaTaslak = { rota:sonuc.rota, tur:sonuc.tur, turYazi:sonuc.turYazi };
      onizleme();
    },
    async 'body-photo-file'(el){
      bodyPhotoFile = (el.files && el.files[0]) || null;
      const n = document.getElementById('body-photo-name');
      if(n) n.textContent = bodyPhotoFile ? bodyPhotoFile.name : '';
      const run = document.querySelector('[data-act="run-body-photo"]');
      if(run) run.disabled = !bodyPhotoFile || !SP.Extract.modelReady();
    },
  };

  const handle = {
    async 'body-photo-open'(){ bodyPhotoFile = null; bodyPhotoSheet(); },
    async 'run-body-photo'(){
      const hEl = document.getElementById('bp-height');
      const wEl = document.getElementById('bp-weight');
      const nEl = document.getElementById('bp-note');
      const hints = {
        boy: hEl ? hEl.value.trim() : '',
        kilo: wEl ? wEl.value.trim() : '',
        not: nEl ? nEl.value.trim() : '',
        cinsiyet: S.profile && S.profile.gender ? S.profile.gender : '',
      };
      UI.toast(yz('spi.move.beden-ve-durus-analiz-ediliy'));
      const res = await SP.Extract.fromBodyPhoto(bodyPhotoFile, hints);
      if(!res.ok){ UI.toast(res.note || yz('spi.move.analiz-basarisiz')); return; }
      bodyPhotoResultSheet(res);
    },
    async 'save-body-photo-today'(){
      if(!bodyPhotoFile) return;
      const r = await SP.Foto.kaydet('vucut:' + U.todayISO(), bodyPhotoFile);
      UI.closeSheet();
      UI.toast(r.ok ? yz('spi.move.fotograf-bugunun-kaydina-ekl') : (r.why || 'Kaydedilemedi'));
      SP.App.render();
    },
    async 'save-body-vitals'(){
      if(!lastBodyAnalysis) return;
      const bk = lastBodyAnalysis.biyometrikKompozisyon || lastBodyAnalysis.kompozisyon || {};
      const patch = {};
      if(bk.yagAralik){
        const nums = bk.yagAralik.match(/(\d+(?:\.\d+)?)/g);
        if(nums && nums.length){
          const sum = nums.reduce((a, b) => a + Number(b), 0);
          patch.bodyfat = U.round(sum / nums.length, 1);
        }
      }
      const bugun = U.todayISO();
      await M.saveVitals(bugun, patch);
      UI.toast(yz('spi.move.tahmini-olcum-bugunun-gunlug'));
      SP.App.render();
    },
    async 'save-corrective-session'(){
      if(!lastBodyAnalysis) return;
      const dh = lastBodyAnalysis.duzelticiHareketRecetesi || lastBodyAnalysis.duzelticiHareket || {};
      const bugun = U.todayISO();
      const egList = Array.isArray(dh.egzersizler) && dh.egzersizler.length ? dh.egzersizler : [yz('spi.move.duzeltici-mobilite')];
      const w = {
        id: U.uid(),
        date: bugun,
        name: yz('spi.move.durus-duzeltici-mobilite'),
        minutes: 15,
        rpe: 4,
        items: egList.map(ad => ({ exId:'corrective', name:ad, minutes:5 })),
        note: [dh.esneme2dk, dh.guclendirme, dh.adimHedefi].filter(Boolean).join(' · '),
      };
      await M.saveWorkout(w);
      UI.toast(yz('spi.move.duzeltici-hareket-seansi-bug'));
      SP.App.render();
    },
    async 'move-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'rota-ac'(el){
      const w = S.workouts.find(x => x.id === el.dataset.id && x.rota);
      if(w) rotaKagidi(w);
    },
    async 'rota-tumu'(){ rotaListesi(); },
    async 'canli-ac'(){ canliTur = null; canliBaslatKagidi(); },
    async 'canli-tur'(el){
      if(Ro().HAREKETLER.indexOf(el.dataset.value) < 0) return;
      canliTur = el.dataset.value;
      canliBaslatKagidi();
    },
    async 'canli-basla'(){
      const r = SP.Canli.baslat(canliTur || 'kosu');
      if(!r.ok){ UI.toast(r.why); return; }
      canliSaatKur();
      canliEkrani();
    },
    async 'canli-ekran'(){ canliEkrani(); },
    async 'canli-duraklat'(){ SP.Canli.duraklat(); },
    async 'canli-surdur'(){
      const r = SP.Canli.surdur();
      if(!r.ok){ UI.toast(r.why); return; }
      if(!document.getElementById('canli-ekran')) canliEkrani();
    },
    async 'canli-bitir'(){
      const r = SP.Canli.bitir();
      if(!r.ok){ UI.toast(r.why); return; }
      canliOnizle(r.rota);
    },
    async 'canli-gozden'(){
      const r = SP.Canli.rota();
      if(!r.ok){ UI.toast(r.why); return; }
      canliOnizle(r.rota);
    },
    async 'canli-sil'(){
      UI.confirmSheet(yz('spi.move.kaydi-sil'), yz('spi.move.bu-canli-kayit-ve-butun'),
        async () => { SP.Canli.sil(); UI.closeSheet(); }, true, yz('spi.move.kaydi-sil'));
    },
    async 'rota-isi'(){ isiKagidi(); },
    async 'rota-tur'(el){
      if(!rotaTaslak || Ro().HAREKETLER.indexOf(el.dataset.value) < 0) return;
      rotaTaslak.tur = el.dataset.value;
      onizleme();
    },
    async 'rota-kaydet'(){
      if(!rotaTaslak || !rotaTaslak.tur) return;
      const canli = rotaTaslak.canli;
      if(Ro().kayitli(rotaTaslak.rota, S.workouts)){
        UI.closeSheet(); rotaTaslak = null;
        if(canli) SP.Canli.sil();
        return;
      }
      const w = Ro().seans(rotaTaslak.rota, rotaTaslak.tur);
      if(!w) return;
      await M.saveWorkout(w);
      /* Taslak ancak seans KAYDEDİLDİKTEN sonra silinir. */
      if(canli) SP.Canli.sil();
      rotaTaslak = null;
      UI.closeSheet();
      UI.toast(yz('spi.move.rota-eklendi'));
      S.ui.moveTab = 'kardiyo';
      SP.App.render();
    },
    async 'set-bitti'(el){
      const w = S.workouts.find(x => x.id === el.dataset.w);
      const it = w && w.items[Number(el.dataset.i)];
      if(!it) return;
      const n = Number(el.dataset.set);
      it.setsDone = (Number(it.setsDone) || 0) >= n ? n - 1 : n;
      await M.saveWorkout(w);
      SP.App.render();
    },
    async 'pick-pattern-tab'(el){ S.ui.movePattern = el.dataset.tab; SP.App.render(); },
    async 'pick-pattern'(el){
      S.ui.moveTab = 'kuvvet';
      S.ui.movePattern = el.dataset.id;
      SP.App.render();
    },
    /* Alandan seans: o alanın şablonu varsa onunla, yoksa serbest başlar. */
    async 'start-area'(el){
      const area = SP.AREA_BY_ID[el.dataset.area];
      const tpl = area && area.kind
        ? SP.SESSION_TEMPLATES.find(t => t.kind === area.kind) : null;
      draft = M.newWorkout(U.todayISO(), tpl ? tpl.id : null);
      sessionSheet(draft);
    },
    async 'start-session'(el){
      draft = M.newWorkout(U.todayISO(), el.dataset.id || null);
      sessionSheet(draft);
    },
    async 'edit-session'(el){
      draft = S.workouts.find(w => w.id === el.dataset.id);
      if(draft) sessionSheet(draft);
    },
    async 'toggle-ex'(el){
      if(!draft) return;
      const exId = el.dataset.ex;
      draft.items = draft.items || [];
      const i = draft.items.findIndex(x => x.exId === exId);
      if(i >= 0) draft.items.splice(i, 1);
      else draft.items.push({ exId, levelId:M.currentLevel(exId), sets:3, reps:null, minutes:null });
      /* Kağıdı yeniden çiz ki seçim anında görünsün; girilen süre ve zorluk
         kaybolmasın diye önce okunur. */
      const min = document.getElementById('w-min');
      const rpe = document.getElementById('w-rpe');
      const note = document.getElementById('w-note');
      if(min) draft.minutes = Number(min.value) || draft.minutes;
      if(rpe) draft.rpe = rpe.value.trim() === '' ? null : Number(rpe.value);
      if(note) draft.note = note.value;
      sessionSheet(draft);
    },
    async 'save-session'(el){
      if(!draft) return;
      const min = document.getElementById('w-min');
      const rpe = document.getElementById('w-rpe');
      const note = document.getElementById('w-note');
      draft.minutes = min ? Number(min.value) || 0 : draft.minutes;
      draft.rpe = rpe && rpe.value.trim() !== '' ? Number(rpe.value) : null;
      draft.note = note ? note.value.trim() : '';
      if(!draft.minutes){ UI.toast(yz('spi.move.sure-gir')); return; }
      await M.saveWorkout(draft);
      draft = null;
      UI.closeSheet();
      UI.toast(yz('spi.move.seans-kaydedildi'));
      SP.App.render();
    },
    'hazir-antrenman-sakla'(el){
      const w = M.workoutsOf(U.todayISO()).find(x => x.id === el.dataset.id) || (SP.S.workouts || []).find(x => x.id === el.dataset.id);
      if(w && SP.Hazir) hazirAntrenmanSheet(w);
    },
    async 'hazir-antrenman-kaydet'(el){
      const w = (SP.S.workouts || []).find(x => x.id === el.dataset.id);
      const g = document.getElementById('hazir-antrenman-ad');
      const r = w ? await SP.Hazir.antrenmanSakla(w, g ? g.value : '') : { ok:false, why:yz('spi.move.seans-bulunamadi') };
      UI.closeSheet();
      UI.toast(r.ok ? '«' + r.kayit.ad + '» hazır antrenmanlara eklendi' : r.why);
      SP.App.render();
    },
    async 'hazir-antrenman-ekle'(el){
      const r = await SP.Hazir.antrenmanEkle(el.dataset.id, U.todayISO());
      if(!r.ok){ UI.toast(r.why); return; }
      SP.App.render();
      { const Z = (window.LIFEOS || {}).ZEMIN; if(Z && Z.nabiz) Z.nabiz(); }
      UI.toast('«' + r.ad + '» bugüne eklendi', { undo:async () => { await r.geriAl(); SP.App.render(); } });
    },
    'hazir-antrenman-duzen'(){ S.ui.hazirAntDuzen = !S.ui.hazirAntDuzen; SP.App.render(); },
    async 'hazir-antrenman-sil'(el){
      const h = SP.Hazir.antrenmanlar().find(x => x.id === el.dataset.id);
      const r = await SP.Hazir.antrenmanSil(el.dataset.id);
      if(!SP.Hazir.antrenmanlar().length) S.ui.hazirAntDuzen = false;
      SP.App.render();
      if(r.ok && h) UI.toast('«' + h.ad + '» silindi', { undo:async () => {
        await M.saveProfile({ hazirAntrenmanlar:[h].concat(SP.Hazir.antrenmanlar()) }); SP.App.render(); } });
    },
    async 'vucut-olcu-kaydet'(){
      const al = (id, min, max) => { const el = document.getElementById(id); const v = el && el.value !== '' ? Number(el.value) : null;
        return v != null && isFinite(v) && v >= min && v <= max ? v : null; };
      const patch = {};
      const bel = al('vucut-bel', 40, 200), boyun = al('vucut-boyun', 20, 70), kalca = al('vucut-kalca', 50, 200);
      if(bel != null) patch.waist = bel;
      if(boyun != null) patch.neck = boyun;
      if(kalca != null) patch.hip = kalca;
      if(!Object.keys(patch).length){ UI.toast(yz('spi.move.gecerli-bir-olcu-yazilmadi')); return; }
      const gun = U.todayISO(), once = Object.assign({}, SP.S.vitals[gun] || {});
      await M.saveVitals(gun, patch);
      SP.App.render();
      UI.toast(yz('spi.move.olculer-kaydedildi'), { undo:async () => {
        const geri = {}; Object.keys(patch).forEach(k => { geri[k] = once[k] == null ? null : once[k]; });
        await M.saveVitals(gun, geri); SP.App.render(); } });
    },
    async 'del-session'(el){
      const id = el.dataset.id;
      UI.confirmSheet(yz('spi.move.seansi-sil'), yz('spi.move.bu-seans-ve-urettigi-yuk'),
        async () => { await M.deleteWorkout(id); UI.closeSheet(); SP.App.render(); }, true, yz('spi.move.seansi-sil'));
    },
    async advance(el){
      const res = await M.advanceLevel(el.dataset.id);
      UI.toast(res.ok ? yz('spi.move.yeni-basamak') + res.level.name : res.error);
      SP.App.render();
    },
    async 'pick-level'(el){
      const ex = SP.EX_BY_ID[el.dataset.id];
      const cur = M.currentLevel(ex.id);
      UI.sheet({ title:ex.name, subtitle:yz('spi.move.basamak-sec'), wide:true,
        body:String(html`
          <p class="small muted">${ex.cue}</p>
          <div class="picks mt-12">${map(ex.levels, (l, i) => K.PickCard({
            label:(i + 1) + '. ' + l.name, meta:'hedef ' + l.to,
            on:l.id === cur,
            act:'set-level', data:{ 'data-id':ex.id, 'data-level':l.id },
          }))}</div>`),
        footer:String(K.Button({ label:yz('spi.move.kapat'), act:'sheet-close' })), noFocus:true });
    },
    async 'set-level'(el){
      await M.setLevel(el.dataset.id, el.dataset.level);
      UI.closeSheet();
      UI.toast(yz('spi.move.basamak-guncellendi'));
      SP.App.render();
    },
    async 'open-programs'(){ programsSheet(); },
    async 'open-met-calc'(){ metCalcSheet(); },
    async 'open-ex-detail'(el){ exerciseDetailSheet(el.dataset.id); },
    async 'met-search-change'(el){ metQ = el.value || ''; metCalcSheet(); },
    async 'met-min-change'(el){ metMin = Number(el.value) || 30; metCalcSheet(); },
    async 'met-pick-cat'(el){ metCat = el.dataset.cat; metCalcSheet(); },
    async 'add-met-workout'(el){
      const desc = el.dataset.desc;
      const met = Number(el.dataset.met) || 4.5;
      const min = Number(el.dataset.min) || 30;
      /* 2026-10-25: tür etkinlikten (core/move.js metTuru); eskiden türsüz
         yazılıp kuvvet sayılıyordu ve var olmayan M.addWorkout çağrılıyordu.
         Zorlanma (RPE) kişinin hissidir: MET'ten türetilmez, boş kalır
         (eskiden round(MET) yazılıp yüke karışıyordu; AGENTS §1.1). */
      const w = SP.Move.metSeans({ ad:desc, met, dk:min, rpe:null, kategori:el.dataset.cat || '' }, U.todayISO());
      await M.saveWorkout(w);
      UI.closeSheet();
      UI.toast(desc + ' (' + min + ' dk) seans olarak eklendi', { undo:async () => { await M.deleteWorkout(w.id); SP.App.render(); } });
      SP.App.render();
    },
    async 'load-program-session'(el){
      const progId = el.dataset.id;
      const prog = (SP.PROGRAMLAR || []).find(p => p.id === progId);
      if(!prog) return;
      UI.closeSheet();
      draft = {
        id: U.uid(),
        date: U.todayISO(),
        name: prog.title,
        minutes: 45,
        rpe: 6,
        items: (prog.exercises || []).map(exId => ({ exId: exId, levelId:M.currentLevel(exId), sets: 3, reps: 10 })),
        note: prog.focus || ''
      };
      sessionSheet(draft);
    },
    async 'quick-add-session-ex'(el){
      const exId = el.dataset.id;
      const ex = SP.EX_BY_ID[exId];
      if(!ex) return;
      UI.closeSheet();
      draft = {
        id: U.uid(),
        date: U.todayISO(),
        name: ex.name + ' Seansı',
        minutes: 30,
        rpe: 6,
        items: [{ exId: ex.id, levelId:M.currentLevel(ex.id), sets: 3, reps: 10 }],
        note: ex.cue || ''
      };
      sessionSheet(draft);
    },
  };

  return {
    id:'move',
    title:yz('spi.move.hareket-2'),
    /* Sıkı ölçü (en çok üç açık kart): vücut analizi gelince seans geçmişi tek satır. */
    kucukVarsayilan:['seans-geçmişi'],
    headline(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return yz('spi.move.toparlanma-olcumu-bekliyor');
      if(rx.kind === 'rest') return yz('spi.move.bugun-dinlenme-gunu');
      if(rx.kind === 'full') return yz('spi.move.bugun-tam-yuk-yapilabilir');
      return yz('spi.move.bugun-yuk-hafifletilmeli');
    },
    lede(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok){
        return yz('spi.move.uyku-ve-nabiz-girilince-gunu')
          + yz('spi.move.olcum-olmadan-yuk-korlemesin');
      }
      return rx.readiness.band.order
        + ' Kardiyo, kuvvet, esneklik ve dinlenme ayrı sayfalardır.';
    },
    stats(){
      const rx = SP.Move.prescription();
      const out = [];
      if(rx.readiness.ok){
        out.push({ value:rx.readiness.score, unit:'/100', label:'toparlanma' });
        out.push({ value:rx.factor >= 1 ? '%100' : '%' + Math.round(rx.factor * 100),
          label:yz('spi.move.bugunku-yuk') });
      }
      out.push({ value:SP.Move.loadWindow(7), label:yz('spi.move.haftalik-yuk') });
      const a = SP.Move.acwr();
      if(a.ok) out.push({ value:U.fmtNet(a.ratio), label:yz('spi.move.hafta-ay') });
      return out;
    },
    subtitle(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return yz('spi.move.olcum-bekliyor-2');
      return rx.readiness.band.label + (rx.factor >= 1 ? ' · tam yük'
        : ' · yükün %' + Math.round(rx.factor * 100) + '\u2019i');
    },
    actions(){
      return String(K.Button({ label:yz('spi.move.seans-ekle'), icon:'plus', size:'sm', tone:'primary',
        act:'start-session', data:{ 'data-id':'' } }));
    },
    yogunlukBantlari, render, afterRender, handle, change,
  };
})();
