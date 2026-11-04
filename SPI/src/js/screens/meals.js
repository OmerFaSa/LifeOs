/* Öğünler — Modül 2'nin ekranı.

   Giriş sıfır sürtünmelidir: tek satır yazılır, gramaj ev ölçüsünden gelir
   ve «tahmin» olarak işaretlenir. Tartan kullanıcı gramı yazar, «ölçüldü» olur.

   Ekranın ayırt edici tarafı emilim sütunudur: aynı öğünde çay varsa demir
   emilimi yarıya iner ve bu ekranda görünür. */
window.LIFEOS.PARCA.yazilar({
  'spi.meals.modul-2':'Modül 2',
  'spi.meals.fotograftan-ogun-okumak-icin':'Fotoğraftan öğün okumak için HKM › Modeller’de «SPİ · Görsel» (ya da King) için ',
  'spi.meals.fotografi-buraya-birak-ya-da':'Fotoğrafı buraya bırak ya da seçmek için tıkla',
  'spi.meals.fotograftan-gelen-gramaj-her':'Fotoğraftan gelen gramaj her zaman «tahmin» ',
  'spi.meals.bu-gune-henuz-ogun-girilmedi':'Bu güne henüz öğün girilmedi.',
  'spi.meals.ogun-cizelgesi':'Öğün çizelgesi',
  'spi.meals.hazir-ogunler':'Hazır öğünler',
  'spi.meals.ogun-girilmedi':'Öğün girilmedi.',
  'spi.meals.gram-girilmedi':'Gram girilmedi.',
  'spi.meals.kalem-taninmadi':'Kalem tanınmadı.',
  'spi.meals.ev-olcusunden-tahmin':'Ev ölçüsünden tahmin.',
  'spi.meals.tartilan-gramdan':'Tartılan gramdan.',
  'spi.meals.hedef-hesaplanmadi':'Hedef hesaplanmadı.',
  'spi.meals.son-7-gunde-hic-ogun':'Son 7 günde hiç öğün girilmemiş; açık hesaplanamıyor. ',
  'spi.meals.girilmemis-gun-sifir-sayilma':'Girilmemiş gün sıfır sayılmaz, ortalamaya katılmaz.',
  'spi.meals.son-7-gunun-ortalamasi-butun':'Son 7 günün ortalaması bütün hedefleri karşılıyor.',
  'spi.meals.taban-referans':'Taban referans',
  'spi.meals.ust-sinir':'Üst sınır',
  'spi.meals.i-lgili-olcum':'İlgili ölçüm',
  'spi.meals.barkodu-yakindan-cek-ya-da':'Barkodu yakından çek ya da fotoğraf seç',
  'spi.meals.bu-tarayici-fotograftan-bark':'Bu tarayıcı fotoğraftan barkod okuyamıyor; numarayı elle yaz.',
  'spi.meals.bu-gun-hareket-girilmedi-iht':'Bu gün hareket girilmedi; ihtiyaca eklenmedi.',
  'spi.meals.uygulanan-planin-gunluk-fark':'Uygulanan planın günlük farkı',
  'spi.meals.su-an-hicbir-tahlil-sonucu':'Şu an hiçbir tahlil sonucu beslenme hedefini değiştirmiyor. ',
  'spi.meals.olcumler-hedef-bandin-icinde':'Ölçümler hedef bandın içinde.',
  'spi.meals.henuz-test-girilmedi-tahlil':'Henüz test girilmedi. Tahlil sonucu girildiğinde beslenme hedefi ',
  'spi.meals.oneri-icin-en-az-birkac':'Öneri için en az birkaç günlük öğün kaydı gerekir. ',
  'spi.meals.kayit-yoksa-eksik-hesaplanam':'Kayıt yoksa eksik hesaplanamaz — sıfır sayılmaz.',
  'spi.meals.son-yedi-gunun-ortalamasi-bu':'Son yedi günün ortalaması bütün besin ',
  'spi.meals.bu-bolum-su-an-cizilemedi':'Bu bölüm şu an çizilemedi; verin yerinde duruyor.',
  'spi.meals.siradaki':'Sıradaki: ',
  'spi.meals.butun-ogunler-girildi':'Bütün öğünler girildi.',
  'spi.meals.fotograf-okunuyor':'Fotoğraf okunuyor',
  'spi.meals.taninmadi':'Tanınmadı: ',
  'spi.meals.barkod-okunuyor':'Barkod okunuyor',
  'spi.meals.hedef-icin-profil-eksik':'Hedef için profil eksik.',
  'spi.meals.bugun-hic-ogun-girilmedi':'Bugün hiç öğün girilmedi.',
  'spi.meals.bugun-hedefin-ustundesin':'Bugün hedefin üstündesin.',
  'spi.meals.bugun-hedefin-icindesin':'Bugün hedefin içindesin.',
  'spi.meals.gunun':'Günün ',
});


window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'spi', sira:30, id:'act:meal', kind:'Eylem', label:'Öğün ekle', route:'meals',
  hint:yz('spi.meals.modul-2'), run:() => { SP.App.go('meals'); setTimeout(() => {
    const el = document.getElementById('meal-text'); if(el) el.focus(); }, 160); } });
window.LIFEOS.PARCA.yazilar({
  'spi.meals.geri-alindi':'Geri alındı',
  'spi.meals.ogun-ekle':'Öğün ekle',
  'spi.meals.besin-ara':'Besin ara',
  'spi.meals.fotograftan':'Fotoğraftan',
  'spi.meals.ogun':'Öğün',
  'spi.meals.ogunlerimi-duzenle':'Öğünlerimi düzenle',
  'spi.meals.1-tabak-etli-kuru-fasulye':'1 tabak etli kuru fasulye, 2 dilim ekmek, 1 bardak ayran',
  'spi.meals.ogun-metni':'Öğün metni',
  'spi.meals.ekle':'Ekle',
  'spi.meals.tamami':'Tamamı',
  'spi.meals.yarisi':'Yarısı',
  'spi.meals.ceyregi':'Çeyreği',
  'spi.meals.i-ki-tabak':'İki tabak',
  'spi.meals.fotograftan-ogun':'Fotoğraftan öğün',
  'spi.meals.uc-kisa-not-tahmini-belirgin':'Üç kısa not tahmini belirgin ölçüde güçlendirir',
  'spi.meals.model-bagli-degil':'Model bağlı değil.',
  'spi.meals.yemek-fotografi':'Yemek fotoğrafı',
  'spi.meals.ne-kadari-yendi':'Ne kadarı yendi?',
  'spi.meals.kabin-olcusu':'Kabın ölçüsü',
  'spi.meals.24-cm-tabak-cay-bardagi':'24 cm tabak, çay bardağı…',
  'spi.meals.gizli-malzeme':'Gizli malzeme',
  'spi.meals.zeytinyagli-sekerli-tereyagi':'zeytinyağlı, şekerli, tereyağında kavrulmuş…',
  'spi.meals.vazgec':'Vazgeç',
  'spi.meals.oku':'Oku',
  'spi.meals.fotograftan-okunanlar':'Fotoğraftan okunanlar',
  'spi.meals.fotograftan-tahmin':'fotoğraftan tahmin',
  'spi.meals.eslesmeyenler':'Eşleşmeyenler:',
  'spi.meals.ogune-ekle':'Öğüne ekle',
  'spi.meals.ogunlerim':'Öğünlerim',
  'spi.meals.adini-ve-saatini-sen-koy':'Adını ve saatini sen koy; eski kayıtlar yeni adla görünür',
  'spi.meals.gun-baslangici':'Gün başlangıcı',
  'spi.meals.ogun-2':'Öğün ',
  'spi.meals.sil':'Sil',
  'spi.meals.saat-yazarsan-ogun-girerken':'Saat yazarsan öğün girerken o saate en yakın öğün kendiliğinden seçilir. Silinen öğünün eski kayıtları adını korur.',
  'spi.meals.kaydet':'Kaydet',
  'spi.meals.hazir-ogun-yap':'Hazır öğün yap',
  'spi.meals.ogunu-sil':'Öğünü sil',
  'spi.meals.cikar':'Çıkar',
  'spi.meals.besin-degeri-icin-kalemlerin':'Besin değeri için kalemlerin gramı gerekli.',
  'spi.meals.protein':'Protein',
  'spi.meals.g-yag':'g · yağ',
  'spi.meals.g-karbonhidrat':'g · karbonhidrat',
  'spi.meals.g-lif':'g · lif',
  'spi.meals.gun-degistir':'Gün değiştir',
  'spi.meals.bugun':'bugün',
  'spi.meals.karbonhidrat':'Karbonhidrat',
  'spi.meals.yag':'Yağ',
  'spi.meals.senin-hazirladiklarin-tek-do':'senin hazırladıkların · tek dokunuş',
  'spi.meals.sik-ogunler-son-30':'sık öğünler · son 30 gün',
  'spi.meals.ogun-sayfasinda-tek-dokunusl':'Öğün sayfasında tek dokunuşla bugüne eklenir',
  'spi.meals.adi':'Adı',
  'spi.meals.sakla':'Sakla',
  'spi.meals.gunluk-hedef':'Günlük hedef',
  'spi.meals.hesaplanamiyor':'Hesaplanamıyor.',
  'spi.meals.profili-ac':'Profili aç',
  'spi.meals.kalori':'Kalori',
  'spi.meals.lif':'Lif',
  'spi.meals.laboratuvara-gore-yukseltile':'Laboratuvara göre yükseltilen hedefler:',
  'spi.meals.hedef':'Hedef ',
  'spi.meals.ogun-girilince-hesaplanir':'Öğün girilince hesaplanır.',
  'spi.meals.tartilan-kalem':'Tartılan kalem',
  'spi.meals.alindi':'alındı.',
  'spi.meals.hedef-yok':'Hedef yok.',
  'spi.meals.profilde':'Profilde ',
  'spi.meals.profil':'Profil',
  'spi.meals.tahlil-bagi':'Tahlil bağı',
  'spi.meals.yukseltildi':'yükseltildi.',
  'spi.meals.oneri':'Öneri',
  'spi.meals.mikro-besinler':'Mikro besinler',
  'spi.meals.alinan-ve-emilen-ayri-goster':'Alınan ve emilen ayrı gösterilir',
  'spi.meals.alinan':'Alınan',
  'spi.meals.emilen':'Emilen',
  'spi.meals.hedef-2':'Hedef',
  'spi.meals.emilen-sutunu-ogun-icerigine':'Emilen sütunu öğün içeriğine göre hesaplanır: aynı öğündeki C vitamini, çay, kalsiyum ve yağ emilimi değiştirir.',
  'spi.meals.son-7-gun':'Son 7 gün',
  'spi.meals.aciklar':'Açıklar',
  'spi.meals.son-7-gunun-ortalamasi':'Son 7 günün ortalaması · ',
  'spi.meals.kaynaklar':'Kaynaklar',
  'spi.meals.en-yogun-kaynaklar':'En yoğun kaynaklar',
  'spi.meals.100-g-da':'100 g\'da',
  'spi.meals.en-ucuz-kaynaklar':'En ucuz kaynaklar',
  'spi.meals.birim-basi':'Birim başı',
  'spi.meals.kapat':'Kapat',
  'spi.meals.ara-mercimek-somon-yogurt':'Ara: mercimek, somon, yoğurt…',
  'spi.meals.barkod':'Barkod',
  'spi.meals.tum-kategoriler':'Tüm kategoriler',
  'spi.meals.kcal-p':'kcal · P',
  'spi.meals.eslesen-gida-yok':'Eşleşen gıda yok.',
  'spi.meals.ilk-okutmada-bir-gidaya-bagl':'ilk okutmada bir gıdaya bağlanır, sonra doğrudan gelir',
  'spi.meals.barkodun-fotografi':'Barkodun fotoğrafı',
  'spi.meals.barkod-numarasi':'Barkod numarası',
  'spi.meals.bul':'Bul',
  'spi.meals.bu-barkod-hangi-gida':'Bu barkod hangi gıda?',
  'spi.meals.ara-yogurt-ekmek':'Ara: yoğurt, ekmek…',
  'spi.meals.sectigin-gida-bu-barkoda-bag':'Seçtiğin gıda bu barkoda bağlanır; sonraki okutmada doğrudan gelir. Listede yoksa önce gıdayı ekle.',
  'spi.meals.porsiyon-sec-ev-olcusu':'Porsiyon seç · ev ölçüsü tahmindir',
  'spi.meals.kac-porsiyon':'Kaç porsiyon',
  'spi.meals.porsiyon-carpani':'Porsiyon çarpanı',
  'spi.meals.son-girdigin':'Son girdiğin',
  'spi.meals.ya-da-gram-gir-tarttiysan':'Ya da gram gir (tarttıysan)',
  'spi.meals.deger':'Değer',
  'spi.meals.gram-ile-ekle':'Gram ile ekle',
  'spi.meals.ogunler':'Öğünler',
  'spi.meals.besin-degeri':'Besin değeri',
  'spi.meals.gunluk-enerji':'Günlük enerji',
  'spi.meals.profili-tamamla':'Profili tamamla',
  'spi.meals.bazal-metabolizma':'Bazal metabolizma',
  'spi.meals.mifflin-st-jeor-kilo-boy':'Mifflin-St Jeor · kilo, boy, yaş ve cinsiyet',
  'spi.meals.girilen-hareket':'Girilen hareket',
  'spi.meals.hesaba-girmeyen':'Hesaba girmeyen:',
  'spi.meals.i-htiyac':'İhtiyaç',
  'spi.meals.hesaplandi-gunden-gune-degis':'hesaplandı · günden güne değişir',
  'spi.meals.hedef-degistirmek-icin-hane':'Hedef değiştirmek için Hane ekranındaki amaç alanını değiştir.',
  'spi.meals.testler-bolumune-git':'Testler bölümüne git',
  'spi.meals.laboratuvar-bulgusu-beslenme':'Laboratuvar bulgusu beslenme hedefini değiştirdi',
  'spi.meals.hedef-3':'hedef ×',
  'spi.meals.bugun-ne-yenmeli':'Bugün ne yenmeli?',
  'spi.meals.son-yedi-gunun-en-buyuk':'Son yedi günün en büyük eksikleri ve onları taşıyan gıdalar',
  'spi.meals.100-g':'/100 g',
  'spi.meals.bir-gidaya-dokunarak-porsiyo':'Bir gıdaya dokunarak porsiyonuyla öğüne ekleyebilirsin.',
  'spi.meals.enerji-ve-oneri':'Enerji ve öneri',
  'spi.meals.bazal-metabolizmadan-hedefe':'Bazal metabolizmadan hedefe, tahlil bulgusundan tabağa. Her adımın gerekçesi yazar; hiçbir sayı kaynağı olmadan görünmez.',
  'spi.meals.beslenme-ve-emilim-notlari':'Beslenme ve emilim notları',
  'spi.meals.kanita-dayali-sporcu-beslenm':'Kanıta dayalı sporcu beslenmesi ve biyoyararlanım senaryoları',
  'spi.meals.akilli-i-lke':'Akıllı İlke',
  'spi.meals.makrolar':'Makrolar',
  'spi.meals.ogun-girilince-protein-karbo':'Öğün girilince protein, karbonhidrat ve yağ burada çizilir.',
  'spi.meals.protein-2':'Protein ',
  'spi.meals.su-14-gun':'Su · 14 gün',
  'spi.meals.son-14-gunun':'Son 14 günün ',
  'spi.meals.protein-14-gun':'Protein · 14 gün',
  'spi.meals.en-sik-yenenler':'En sık yenenler',
  'spi.meals.ogun-saatlerin':'Öğün saatlerin',
  'spi.meals.ogunlerin-gunun-saatlerine-d':'Öğünlerin günün saatlerine dağılımı',
  'spi.meals.ogun-bulunamadi':'Öğün bulunamadı.',
  'spi.meals.ogun-eklendi':'Öğün eklendi',
  'spi.meals.barkod-baglandi':'Barkod bağlandı',
  'spi.meals.gram-gir':'Gram gir',
  'spi.meals.ogunlerin-kaydedildi':'Öğünlerin kaydedildi',
  'spi.meals.bazal-kcal':'bazal (kcal)',
  'spi.meals.hedef-kcal':'hedef (kcal)',
  'spi.meals.bugun-alinan-veri-yok':'bugün alınan · veri yok',
  'spi.meals.bugun-alinan':'bugün alınan',
  'spi.meals.protein-veri-yok':'protein · veri yok',
  'spi.meals.oneriyi-ac':'Öneriyi aç',
});
window.LIFEOS.PARCA.sayfa({ id:'meals', modul:'spi', king:{ sira:20, ad:'Öğün', es:['öğün', 'besin', 'yemek', 'beslenme'] }, cekmece:'calisma', ad:'Öğün', sira:20 });

SP.Screens.meals = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  function shownDate(){ return S.ui.mealDate || U.todayISO(); }

  /* Saate gore ogun secimi: once kullanicinin kendi ogun saatleri
     (core/ogun.js), saat yoksa gunun saatine gore yerlesik sira. */
  function guessSlot(){ return SP.Ogun ? SP.Ogun.simdiki() : 'kahvalti'; }
  const acikSlotlar = () => SP.MEAL_SLOTS.filter(s => !s.gizli);

  /* ---------------------------------------------------------- giris */

  /* Seçili öğün: kullanıcı seçtiyse o, seçmediyse saate göre (2026-10-25:
     hazır ve sık öğünler de bunu kullanır; eskiden hep saate bakıyordu). */
  const seciliSlot = () => S.ui.mealSlot || guessSlot();

  /* Yerleşik öneri listesi: kişisel veri yetmezse boşluğu bu doldurur. */
  const SLOT_ONERI = {
    kahvalti: ['yumurta', 'lor-peyniri', 'beyaz-peynir', 'yulaf', 'zeytin-siyah', 'omlet'],
    ara1:     ['muz', 'elma', 'badem', 'kefir', 'cilek'],
    ogle:     ['tavuk-gogsu', 'bulgur-pilavi', 'mercimek-corbasi', 'salatalik', 'ayran'],
    ara2:     ['protein-bar', 'fistik-ezmesi', 'ceviz', 'kuru-kayisi'],
    aksam:    ['somon', 'kofte', 'kuru-fasulye-etli', 'haslanmis-patates', 'suzme-yogurt'],
    gece:     ['kazein-protein', 'suzme-yogurt', 'yesil-cay', 'maden-suyu'],
  };
  /* Kişisel öneri için bir gıdanın bu öğünde en az kaç kez girilmiş olması gerekir. */
  const KISISEL_ESIK = 2;

  /* SON PORSİYON (2026-10-25): her gıdanın son 90 günde en son girilen
     gramı ve ev ölçüsü. Ayrı bir kayıt tutulmaz; defterin kendisinden
     okunur, böylece silinen kayıt «hatırlanmaz». Gramı olmayan kalem atlanır. */
  function sonPorsiyonlar(){
    const harita = {};
    for(let i = 0; i < 90; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      const ogunler = M.mealsOf(d);
      for(let j = ogunler.length - 1; j >= 0; j--){
        const items = ogunler[j].items || [];
        for(let k = items.length - 1; k >= 0; k--){
          const it = items[k];
          if(it && it.foodId && !harita[it.foodId] && Number(it.g) > 0){
            harita[it.foodId] = { g:Math.round(Number(it.g)), portion:it.portion || null, date:d };
          }
        }
      }
    }
    return harita;
  }
  /* Son porsiyonun ekrandaki adı: ev ölçüsü gramıyla tutuyorsa ya da
     çarpanlı bir ölçüyse («2 tabak») o, değilse gram. */
  function porsiyonAdi(f, son){
    const p = son.portion;
    if(p){
      const tanim = (f.portions || []).find(x => x.label === p);
      if(tanim && Math.round(tanim.g) === son.g) return p;
      if(!tanim && /^(½|\d+)\s+\S/.test(p) && !/^1\s/.test(p) && !/^\d+\s*g$/.test(p)) return p;
    }
    return son.g + ' g';
  }

  /* KİŞİSEL ÖNERİLER (2026-10-25): bu öğünde son 30 günde en az iki kez
     girilen gıdalar, en sık olan başta. Sayı öğün başına sayılır (aynı
     öğünde iki kez yazılan gıda bir kez); uydurulmaz. */
  function kisiselSik(slot){
    const say = {};
    for(let i = 0; i < 30; i++){
      M.mealsOf(U.iso(U.addDays(U.today(), -i))).forEach(m => {
        if(m.slot !== slot) return;
        const gordu = {};
        (m.items || []).forEach(it => {
          if(!it || !it.foodId || !SP.FOOD_BY_ID[it.foodId] || gordu[it.foodId]) return;
          gordu[it.foodId] = 1;
          say[it.foodId] = (say[it.foodId] || 0) + 1;
        });
      });
    }
    return Object.keys(say).filter(id => say[id] >= KISISEL_ESIK)
      .sort((a, b) => say[b] - say[a] || a.localeCompare(b)).map(id => ({ id, n:say[id] }));
  }

  /* Öneri çipleri: yazı varsa aranan gıdalar, yoksa kişisel liste (eksiği
     yerleşik listeden). Her çip son kullanılan porsiyonla gelir; hiç
     girilmemiş gıda ilk ev ölçüsüyle. Döner: [{ f, g, label, n, son }]. */
  function oneriListesi(slot, q){
    const son = sonPorsiyonlar();
    const cip = (f, n) => {
      const s = son[f.id];
      if(s) return { f, g:s.g, label:porsiyonAdi(f, s), n:n || null, son:true };
      const p = (f.portions || [])[0];
      return { f, g:p ? p.g : 100, label:p ? p.label : '100 g', n:n || null, son:false };
    };
    const metin = String(q || '').trim();
    if(metin.length >= 2){
      const n = U.norm(metin);
      return SP.FOODS.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(n) >= 0)
        .slice(0, 4).map(f => cip(f));
    }
    const liste = kisiselSik(slot).slice(0, 4).map(x => cip(SP.FOOD_BY_ID[x.id], x.n));
    (SLOT_ONERI[slot] || ['yumurta', 'tavuk-gogsu', 'yulaf', 'muz']).forEach(id => {
      const f = SP.FOOD_BY_ID[id];
      if(f && liste.length < 4 && !liste.some(x => x.f.id === id)) liste.push(cip(f));
    });
    return liste;
  }
  function cipDugmeleri(liste){
    return liste.map(x => {
      const baslik = x.f.name + ' · ' + x.f.kcal + ' kcal / 100 g'
        + (x.n ? ' · son 30 günde bu öğünde ' + x.n + ' kez' : '')
        + (x.son ? ' · son girdiğin porsiyon' : '');
      return '<button type="button" class="btn btn--xs btn--ghost chip-sugg" data-act="quick-add-food"'
        + ' data-id="' + U.esc(x.f.id) + '" data-g="' + x.g + '" data-label="' + U.esc(x.label) + '"'
        + ' title="' + U.esc(baslik) + '">+ ' + U.esc(x.f.name)
        + ' <span class="tiny dim">(' + U.esc(x.label) + ')</span></button>';
    }).join('');
  }
  /* Çip kutusu her zaman çizilir; eşleşme yoksa gizlenir (eskiden yeni
     yazı hiçbir gıdayla eşleşmeyince eski çipler ekranda kalıyordu). */
  function mealSuggestionChips(){
    const liste = oneriListesi(seciliSlot(), S.ui.mealDraftQuery);
    return raw('<div class="meal-suggs row wrap gap-6 mt-8" aria-label="Besin önerileri"'
      + (liste.length ? '' : ' hidden') + '>' + cipDugmeleri(liste) + '</div>');
  }
  function cipleriTazele(){
    const kutu = document.querySelector('.meal-suggs');
    if(!kutu) return;
    const liste = oneriListesi(seciliSlot(), S.ui.mealDraftQuery);
    kutu.innerHTML = cipDugmeleri(liste);
    kutu.hidden = !liste.length;
  }

  /* GERİ AL (2026-10-25): her öğün ekleme ve silmesi «Geri al» taşır
     (AGENTS §1.9, küçük aksiyon). Geri alma yalnız o işlemin yazdığını geri alır. */
  function geriAlToast(metin, geriAl){
    UI.toast(metin, { undo:async () => { await geriAl(); UI.toast(yz('spi.meals.geri-alindi')); SP.App.render(); } });
  }

  /* iPhone Faz 2b: ev ölçüsü listesi ve «tarttıysan gramı yaz» ⓘ'de
     (hints: portion); alanın örnek metni biçimi zaten gösteriyor. */
  function quickEntry(){
    return K.Entry({
      label:yz('spi.meals.ogun-ekle'), hint:'portion',
      action:html`${K.Button({ label:yz('spi.meals.besin-ara'), act:'open-search' })}
        ${K.Button({ label:yz('spi.meals.fotograftan'), icon:'camera', act:'open-photo' })}`,
      body:html`
        <div class="quick">
          ${K.Select({ id:'meal-slot', value:S.ui.mealSlot || guessSlot(), aria:yz('spi.meals.ogun'),
            options:acikSlotlar().map(s => ({ value:s.id, label:s.label + (s.saat ? ' · ' + s.saat : '') })), change:'pick-slot' })}
          ${K.IconButton({ icon:'gear', size:'sm', plain:true, aria:yz('spi.meals.ogunlerimi-duzenle'), act:'ogun-duzen' })}
          ${K.Mic({ target:'meal-text' })}
          ${K.Input({ id:'meal-text', placeholder:yz('spi.meals.1-tabak-etli-kuru-fasulye'),
            aria:yz('spi.meals.ogun-metni'), value:S.ui.mealDraftText || '' })}
          ${K.Button({ label:yz('spi.meals.ekle'), tone:'primary', act:'add-meal' })}
        </div>
        ${mealSuggestionChips()}`,
    });
  }

  /* ---------------------------------------------------------- fotograf

     Fotograf tek basina zayif bir kaynaktir: porsiyon buyuklugu
     fotograftan guvenilir cikmaz. Bu yuzden UC KISA NOT sorulur.
     Serbest bir "not" alani degil uc alan -- tahmini guclendiren sey
     tam olarak bu uc bilgidir ve sorulmadan verilmez. */

  let photoFile = null;

  const AMOUNTS = [
    { value:'tamamı',   label:yz('spi.meals.tamami') },
    { value:'yarısı',   label:yz('spi.meals.yarisi') },
    { value:'çeyreği',  label:yz('spi.meals.ceyregi') },
    { value:'iki tabak',label:yz('spi.meals.i-ki-tabak') },
  ];

  function photoSheet(){
    UI.sheet({
      title:yz('spi.meals.fotograftan-ogun'), subtitle:yz('spi.meals.uc-kisa-not-tahmini-belirgin'),
      wide:true,
      body:String(K.Stack([
        when(!SP.Extract.modelReady(), () => K.Notice({ tone:'warn',
          title:yz('spi.meals.model-bagli-degil'),
          body:yz('spi.meals.fotograftan-ogun-okumak-icin')
            + 'görüntü okuyan bir model ata. Öğünü tek satır yazarak '
            + 'modelsiz de girebilirsin.' })),
        K.Drop({ act:'meal-photo', label:yz('spi.meals.yemek-fotografi'), icon:'camera', kamera:{},
          accept:'image/*', hint:yz('spi.meals.fotografi-buraya-birak-ya-da') }),
        html`<div id="photo-name" class="small dim">${photoFile ? photoFile.name : ''}</div>`,
        html`<div class="cols-2">
          ${K.Field({ label:yz('spi.meals.ne-kadari-yendi'),
            input:K.Select({ id:'ph-amount', options:AMOUNTS }) })}
          ${K.Field({ label:yz('spi.meals.kabin-olcusu'), hint:'isteğe bağlı',
            input:K.Input({ id:'ph-vessel', placeholder:yz('spi.meals.24-cm-tabak-cay-bardagi') }) })}
        </div>`,
        K.Field({ label:yz('spi.meals.gizli-malzeme'), hint:'fotoğrafta görünmeyen şeyler',
          input:html`<div class="withmic">
            ${K.Input({ id:'ph-extra', placeholder:yz('spi.meals.zeytinyagli-sekerli-tereyagi') })}
            ${K.Mic({ target:'ph-extra' })}
          </div>` }),
        K.Notice({ tone:'info', body:yz('spi.meals.fotograftan-gelen-gramaj-her')
          + 'olarak işaretlenir. Tartıp düzeltirsen «ölçüldü» olur.' }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.meals.oku'), tone:'primary', act:'run-photo',
          disabled:!photoFile || !SP.Extract.modelReady() })}`),
      noFocus:true,
    });
  }

  function photoPreviewSheet(res){
    UI.sheet({
      title:yz('spi.meals.fotograftan-okunanlar'), subtitle:res.note, wide:true,
      body:String(K.Stack([
        when(res.items.length, () => html`<div>${map(res.items, (it, i) => {
          const f = SP.FOOD_BY_ID[it.foodId];
          return html`<div class="pasterow">
            ${K.Checkbox({ label:'', checked:!it.skip, act:'toggle-photo-row', data:{ 'data-i':i } })}
            <span><b class="small">${f ? f.name : it.foodId}</b>
              ${P.cert('estimated')}</span>
            <span class="pasterow__val num">${it.g} g</span>
            <span class="pasterow__src">${yz('spi.meals.fotograftan-tahmin')}</span>
          </div>`;
        })}</div>`),
        when(!res.items.length, () => K.Notice({ tone:'warn', body:res.note })),
        when(res.unmatched.length, () => K.Notice({ tone:'info',
          title:yz('spi.meals.eslesmeyenler'),
          body:res.unmatched.map(x => x.line).join(' · ')
            + ' — bunlar gıda listemizde yok, kaydedilmedi.' })),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.meals.ogune-ekle'), tone:'primary', act:'save-photo',
          disabled:!res.items.filter(x => !x.skip).length })}`),
      noFocus:true,
    });
  }

  let photoRes = null;

  /* ---------------------------------------------------------- öğünlerim */

  function ogunSheet(){
    const t = S.ui.ogunTaslak;
    if(!t) return;
    UI.sheet({ title:yz('spi.meals.ogunlerim'), subtitle:yz('spi.meals.adini-ve-saatini-sen-koy'),
      body:String(html`<div class="stack-sm" data-ogun-kok>
        ${map(t.liste, (x, i) => html`<div class="row gap-8 ogun-satir">
          ${K.Input({ value:x.label, placeholder:yz('spi.meals.gun-baslangici'), aria:yz('spi.meals.ogun-2') + (i + 1) + ' adı', data:{ 'data-ogun-ad':String(i) } })}
          ${K.Input({ type:'time', value:x.saat || '', aria:yz('spi.meals.ogun-2') + (i + 1) + ' saati', data:{ 'data-ogun-saat':String(i) } })}
          ${K.Button({ label:yz('spi.meals.sil'), size:'sm', tone:'ghost', act:'ogun-sil', data:{ 'data-i':String(i) } })}
        </div>`)}
        <p>${K.Button({ label:yz('spi.meals.ogun-ekle'), icon:'plus', size:'sm', tone:'ghost', act:'ogun-ekle' })}</p>
        <p class="tiny muted">${yz('spi.meals.saat-yazarsan-ogun-girerken')}</p>
        ${when(t.hata, () => html`<p class="small" role="alert">${t.hata}</p>`)}
      </div>`),
      footer:String(html`${K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.meals.kaydet'), tone:'primary', act:'ogun-kaydet' })}`), noFocus:true });
  }
  function ogunOku(){
    const t = S.ui.ogunTaslak, kok = document.querySelector('[data-ogun-kok]');
    if(!t || !kok) return;
    kok.querySelectorAll('[data-ogun-ad]').forEach(el => { const x = t.liste[Number(el.getAttribute('data-ogun-ad'))]; if(x) x.label = el.value.trim(); });
    kok.querySelectorAll('[data-ogun-saat]').forEach(el => { const x = t.liste[Number(el.getAttribute('data-ogun-saat'))]; if(x) x.saat = el.value || null; });
  }

  /* ---------------------------------------------------------- ogunler */

  function mealCard(meal){
    const a = SP.Nutri.absorbMeal(meal.items || []);
    const slot = SP.MEAL_SLOTS.find(s => s.id === meal.slot);
    return html`
      <div class="mealcard">
        <div class="mealcard__head">
          ${raw(UI.icon(slot ? slot.icon : 'meal'))}
          <span class="mealcard__slot">${SP.Ogun ? SP.Ogun.ad(meal.slot) : (slot ? slot.label : meal.slot)}</span>
          <span class="mealcard__kcal num">${(meal.items || []).some(it => Number(it.g) > 0) ? Math.round(a.raw.kcal) + ' kcal' : '— kcal'}</span>
          ${raw(String(SP.FotoUI.kutu({ sahip:'ogun:' + meal.id, sinif:'foto-kutu--sm',
            ad:(SP.Ogun ? SP.Ogun.ad(meal.slot) : (slot ? slot.label : meal.slot)) + ' · ' + U.fmtShort(shownDate()) })))}
          ${when(SP.Hazir && (meal.items || []).length, () => K.IconButton({ icon:'bookmark', size:'sm', plain:true,
            aria:yz('spi.meals.hazir-ogun-yap'), act:'hazir-ogun-sakla', data:{ 'data-id':meal.id } }))}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:yz('spi.meals.ogunu-sil'),
            act:'del-meal', data:{ 'data-id':meal.id } })}
        </div>
        ${map(meal.items || [], (it, i) => {
          const f = SP.FOOD_BY_ID[it.foodId];
          if(!f) return '';
          return html`<div class="mealitem">
            <span class="mealitem__g num">${Number(it.g) > 0 ? it.g + ' g' : '—'}</span>
            <span class="mealitem__name">${f.name}
              ${when(it.portion, () => html`<span class="tiny dim"> · ${it.portion}</span>`)}</span>
            ${P.cert(it.cert)}
            ${K.IconButton({ icon:'close', size:'sm', plain:true, aria:yz('spi.meals.cikar'),
              act:'del-item', data:{ 'data-id':meal.id, 'data-i':i } })}
          </div>`;
        })}
        <div class="row wrap mt-8">
          ${(() => {
            /* Eksik veri sıfır değildir (AGENTS §1.2): gramı girilmemiş kalem
               «Protein 0 g» diye gösterilmez; hesaba girmediği söylenir. */
            const gramli = (meal.items || []).filter(it => Number(it.g) > 0).length;
            const eksik = (meal.items || []).length - gramli;
            if(!gramli) return html`<span class="tiny dim">${yz('spi.meals.besin-degeri-icin-kalemlerin')}</span>`;
            return html`<span class="tiny dim">${yz('spi.meals.protein')} ${Math.round(a.raw.protein)} ${yz('spi.meals.g-yag')} ${Math.round(a.raw.fat)} ${yz('spi.meals.g-karbonhidrat')} ${Math.round(a.raw.carb)} ${yz('spi.meals.g-lif')} ${Math.round(a.raw.fiber)} g${eksik ? ' · ' + eksik + ' kalemin gramı yok, hesaba girmedi' : ''}</span>`;
          })()}
        </div>
        ${map(a.notes, P.absorbNote)}
      </div>`;
  }

  function dayCard(){
    const d = shownDate();
    const rows = M.mealsOf(d);
    const order = SP.MEAL_SLOTS.map(s => s.id);
    const sorted = rows.slice().sort((x, y) => order.indexOf(x.slot) - order.indexOf(y.slot));

    return K.Card({
      title:U.fmtDate(d),
      sub:rows.length ? rows.length + ' öğün' : 'kayıt yok',
      actions:K.Segmented({ act:'shift-day', value:'', aria:yz('spi.meals.gun-degistir'), items:[
        { value:'-1', label:'‹' }, { value:'0', label:yz('spi.meals.bugun') }, { value:'1', label:'›' },
      ] }),
      body:rows.length
        ? html`${map(sorted, mealCard)}`
        : P.empty(yz('spi.meals.bu-gune-henuz-ogun-girilmedi'), yz('spi.meals.ogun-ekle'), 'focus-meal', null, true),
    });
  }

  /* ---------- D · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const vkutu = (ad, yuva, ic) => ic ? K.Kutu({ ad, yuva, class:'vkutu', govde:raw(ic) }) : '';

  /* 072 TABAK: bölmeler hedefin enerji payı; ortada proteinden kalan gram.
     Öğün girilmemişse kalan «—» (yenmedi değil, girilmedi). */
  function tabakKutusu(){
    if(!VT()) return '';
    const t = SP.Nutri.targets();
    if(!t.ok) return '';
    const tot = SP.Nutri.dayTotals(shownDate());
    const k = (hedef, yenen) => tot.empty ? null : hedef - yenen;
    return vkutu('Tabak', tot.empty ? 'girilmedi' : 'kalan', VT().tabak({ bolmeler:[
      { ad:yz('spi.meals.protein'), pay:t.protein.min * 4, kalan:k(t.protein.min, tot.protein) },
      { ad:yz('spi.meals.karbonhidrat'), pay:t.carb.min * 4, kalan:k(t.carb.min, tot.carb) },
      { ad:yz('spi.meals.yag'), pay:t.fat.min * 9, kalan:k(t.fat.min, tot.fat) } ] }));
  }

  /* 080 ÖĞÜN ÇİZELGESİ: öğünün girildiği saat (kayıt anı). */
  function cizelgeKutusu(){
    if(!VT()) return '';
    const d = shownDate();
    const og = M.mealsOf(d).filter(m => m.at && U.iso(new Date(m.at)) === d).map(m => {
      const t = new Date(m.at);
      const sl = SP.MEAL_SLOTS.find(x => x.id === m.slot);
      return { saat:t.getHours() + t.getMinutes() / 60, ad:(SP.Ogun ? SP.Ogun.ad(m.slot) : (sl ? sl.label : m.slot)) + ' · ' + U.pad2(t.getHours()) + ':' + U.pad2(t.getMinutes()),
        kucuk:/^ara/.test(m.slot) };
    });
    const n = new Date();
    return vkutu(yz('spi.meals.ogun-cizelgesi'), 'girildiği saat', VT().ogunCizelgesi({ ogunler:og,
      simdi:d === U.todayISO() ? n.getHours() + n.getMinutes() / 60 : null }));
  }

  /* 085 ÖĞÜN ŞABLONLARI: son 30 günde en az iki kez aynı içerikle girilen
     öğün tek dokunuşla eklenir (küçük aksiyon, «Geri al»). */
  function sablonlar(){
    const say = {};
    for(let i = 0; i < 30; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      M.mealsOf(d).forEach(m => {
        const ids = (m.items || []).map(x => x.foodId).filter(id => SP.FOOD_BY_ID[id]);
        if(!ids.length) return;
        const anahtar = ids.slice().sort().join('+');
        const x = say[anahtar] || (say[anahtar] = { anahtar, n:0, ornek:{ date:d, id:m.id }, slot:m.slot, ids });
        x.n++;
      });
    }
    return Object.keys(say).map(k => say[k]).filter(x => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 3);
  }
  /* HAZIR ÖĞÜNLER (core/hazir.js, 2026-10-17): kullanıcının adını koyduğu
     öğünler üstte, son 30 günün sık öğünleri altta; ikisi de tek dokunuş.
     «Düzenle» yalnız silme listesini açar. */
  function sablonKutusu(){
    if(!VT()) return '';
    const bugun = M.mealsOf(shownDate()).map(m => (m.items || []).map(x => x.foodId).sort().join('+'));
    const anahtar = items => (items || []).map(x => x.foodId).sort().join('+');
    const hazir = SP.Hazir ? SP.Hazir.ogunler() : [];
    const sik = sablonlar().filter(x => !hazir.some(h => anahtar(h.items) === x.anahtar));
    /* DÜNKÜNÜN AYNISI (2026-10-25, core/dunku.js): bir önceki günün bu
       güne girilmemiş öğünleri tek dokunuşla; kopya kendi öğün yerine
       yazılır, «Geri al» kalır. */
    const dk = SP.Dunku ? SP.Dunku.adaylar(shownDate()).ogunler : [];
    if(!hazir.length && !sik.length && !dk.length) return '';
    const duzen = !!S.ui.hazirOgunDuzen && hazir.length;
    const dunkuHtml = dk.length && !duzen ? VT().ogunSablonlari({ act:'ogun-dunku-ekle',
      baslik:(shownDate() === U.todayISO() ? 'dünün aynısı' : 'önceki günün aynısı') + ' · tek dokunuş',
      sablonlar:dk.map(x => ({ ad:x.ad, icerik:x.ozet, on:false, data:{ 'data-id':x.id } })) }) : '';
    const ust = hazir.length ? '<div class="hazir__ust">'
      + String(K.Button({ label:duzen ? 'Bitti' : 'Düzenle', size:'sm', tone:'ghost', act:'hazir-ogun-duzen' })) + '</div>' : '';
    const liste = duzen
      ? '<ul class="hazir__liste">' + hazir.map(h => '<li><span><b>' + U.esc(h.ad) + '</b><small>' + U.esc(SP.Hazir.ogunOzet(h)) + '</small></span>'
        + String(K.Button({ label:yz('spi.meals.sil'), size:'sm', tone:'ghost', act:'hazir-ogun-sil', data:{ 'data-id':h.id } })) + '</li>').join('') + '</ul>'
      : hazir.length ? VT().ogunSablonlari({ act:'hazir-ogun-ekle', baslik:yz('spi.meals.senin-hazirladiklarin-tek-do'), sablonlar:hazir.map(h => ({ ad:h.ad,
        icerik:SP.Hazir.ogunOzet(h), on:bugun.indexOf(anahtar(h.items)) >= 0, data:{ 'data-id':h.id } })) }) : '';
    const sikHtml = sik.length && !duzen ? VT().ogunSablonlari({ act:'sablon-ekle', baslik:yz('spi.meals.sik-ogunler-son-30'), sablonlar:sik.map(x => {
      const sl = SP.MEAL_SLOTS.find(y => y.id === x.slot);
      return { ad:SP.Ogun ? SP.Ogun.ad(x.slot) : (sl ? sl.label : x.slot), icerik:x.ids.map(id => SP.FOOD_BY_ID[id].name.toLocaleLowerCase('tr-TR')).join(' · '),
        on:bugun.indexOf(x.anahtar) >= 0, data:{ 'data-date':x.ornek.date, 'data-id':x.ornek.id } };
    }) }) : '';
    return vkutu(yz('spi.meals.hazir-ogunler'), '', ust + liste + dunkuHtml + sikHtml);
  }
  function hazirOgunSheet(meal){
    UI.sheet({
      title:yz('spi.meals.hazir-ogun-yap'), subtitle:yz('spi.meals.ogun-sayfasinda-tek-dokunusl'),
      body:String(K.Stack([
        K.Field({ label:yz('spi.meals.adi'), input:K.Input({ id:'hazir-ogun-ad', value:SP.Hazir.ogunVarsayilanAd(meal) }) }),
        html`<p class="tiny dim">${SP.Hazir.ogunOzet(meal)}</p>`,
      ])),
      footer:String(html`${K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.meals.sakla'), tone:'primary', act:'hazir-ogun-kaydet', data:{ 'data-id':meal.id } })}`),
    });
  }

  /* ---------------------------------------------------------- hedefler */

  function targetCard(){
    const d = shownDate();
    const t = SP.Nutri.targets(null, d);
    const tot = SP.Nutri.dayTotals(d);

    if(!t.ok){
      return K.Card({ title:yz('spi.meals.gunluk-hedef'),
        body:K.Notice({ tone:'warn', title:yz('spi.meals.hesaplanamiyor'),
          body:yz('spi.meals.profilde') + t.missing.join(', ') + ' eksik. Bu üçü olmadan kalori '
             + 've protein hedefi tahmin edilmez.' }),
        foot:K.Button({ label:yz('spi.meals.profili-ac'), size:'sm',
          act:'go', data:{ 'data-route':'family' } }) });
    }

    return K.Card({
      title:yz('spi.meals.gunluk-hedef'), hint:'macro-target',
      sub:t.goal.label + ' · ' + U.fmtNum(t.tdee) + ' kcal ihtiyaç'
        + (t.need && t.need.hareketYok ? ' (hareket girilmedi)' : ''),
      badge:K.Badge({ label:U.fmtNum(t.kcal) + ' kcal', tone:'info' }),
      body:html`
        <div class="nutgrid">
          ${P.nutCell({ label:yz('spi.meals.kalori'), got:tot.kcal, target:t.kcal, unit:'kcal' })}
          ${P.nutCell({ label:yz('spi.meals.protein'), got:tot.protein, target:t.protein.min, unit:'g',
            note:t.protein.min + '–' + t.protein.max + ' g bandı' })}
          ${P.nutCell({ label:yz('spi.meals.yag'), got:tot.fat, target:t.fat.min, unit:'g',
            note:t.fat.min + '–' + t.fat.max + ' g bandı' })}
          ${P.nutCell({ label:yz('spi.meals.karbonhidrat'), got:tot.carb, target:t.carb.min, unit:'g' })}
          ${P.nutCell({ label:yz('spi.meals.lif'), got:tot.fiber, target:t.fiber, unit:'g' })}
        </div>
        ${when(Object.keys(t.adjustments).length, () => K.Notice({ tone:'info', class:'mt-12',
          title:yz('spi.meals.laboratuvara-gore-yukseltile'),
          body:html`<ul class="bullets small mt-4">${map(Object.keys(t.adjustments), k => html`
            <li><b>${SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k}</b>
              ×${U.fmtNet(t.adjustments[k].mult)} — ${t.adjustments[k].why}</li>`)}</ul>` }))}`,
    });
  }

  /* iPhone Faz 2b (2026-10-02): günün kalorisi ve proteini hedefle birlikte
     küçük dönen kartta; «Günlük hedef» kartı ayrıntısıyla şerittir. Hedef
     hesaplanır (bazal metabolizma). Yenen toplam ev ölçüsünden geldiyse
     TAHMİN, hepsi tartıldıysa HESAPLANDI. Öğün girilmemiş gün ve gramı
     olmayan kalem «0 kcal» değildir: sayı değil cümle, eksik kalem yazılır
     (AGENTS §1.2). Her madde tek söz söyler (satır tek satırdır, sığmayan
     kesilir): eksik kalem Kalori'de, eksik profil kendi maddesinde. */
  function DonenOgun(){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const d = shownDate();
    const gun = d === U.todayISO() ? '' : ' · ' + U.fmtShort(d);
    const tg = SP.Nutri.targets();
    const t = SP.Nutri.dayTotals(d);
    const kalemler = M.mealsOf(d).reduce((a, x) => a.concat(x.items || []), []).filter(it => SP.FOOD_BY_ID[it.foodId]);
    const gramli = kalemler.filter(it => Number(it.g) > 0);
    const eksik = [t.unknownFoods.length ? t.unknownFoods.length + ' kalem tanınmadı' : '',
      kalemler.length > gramli.length ? (kalemler.length - gramli.length) + ' kalemin gramı yok' : ''].filter(Boolean).join(', ');
    const tahmin = gramli.some(it => it.cert !== 'measured');
    const m = [];
    if(!gramli.length){
      m.push({ ust:yz('spi.meals.kalori') + gun, cumle:t.empty ? yz('spi.meals.ogun-girilmedi') : kalemler.length ? yz('spi.meals.gram-girilmedi') : yz('spi.meals.kalem-taninmadi'),
        vurgu:eksik ? eksik + '.' : tg.ok ? yz('spi.meals.hedef') + U.fmtNum(tg.kcal) + ' kcal.' : '', sistem:'spi' });
      if(tg.ok) m.push({ ust:yz('spi.meals.protein') + gun, cumle:yz('spi.meals.hedef') + tg.protein.min + '–' + tg.protein.max + ' g.',
        vurgu:yz('spi.meals.ogun-girilince-hesaplanir'), sistem:'spi' });
    }else{
      /* Köken kartı (025): tahminde kaynak, hesapta formül ve girdi. */
      const kes = tahmin
        ? { kesinlik:'estimated', kaynak:'ev ölçüsünden gram × besin tablosu', zaman:d }
        : { kesinlik:'computed', formul:'tartılan gram × besin tablosu', zaman:d,
            girdiler:[{ ad:yz('spi.meals.tartilan-kalem'), deger:gramli.length, birim:'kalem', kesinlik:'measured' }] };
      m.push({ ust:yz('spi.meals.kalori') + gun, sayi:sayi(Object.assign({ deger:Math.round(t.kcal), birim:'kcal' }, kes)), cumle:yz('spi.meals.alindi'),
        vurgu:eksik ? eksik + '; toplama girmedi.'
          : tg.ok ? yz('spi.meals.hedef') + U.fmtNum(tg.kcal) + ' kcal' + (tahmin ? ' · tahmin.' : '.')
          : tahmin ? yz('spi.meals.ev-olcusunden-tahmin') : yz('spi.meals.tartilan-gramdan'), sistem:'spi' });
      m.push({ ust:yz('spi.meals.protein') + gun, sayi:sayi(Object.assign({ deger:Math.round(t.protein), birim:'g' }, kes)), cumle:yz('spi.meals.alindi'),
        vurgu:tg.ok ? yz('spi.meals.hedef') + tg.protein.min + '–' + tg.protein.max + ' g.' : yz('spi.meals.hedef-hesaplanmadi'), sistem:'spi' });
    }
    if(!tg.ok){
      m.push({ ust:yz('spi.meals.gunluk-hedef'), cumle:yz('spi.meals.hedef-yok'), vurgu:yz('spi.meals.profilde') + tg.missing.join(', ') + ' eksik.', sistem:'spi',
        dugme:{ label:yz('spi.meals.profil'), act:'go', data:{ 'data-route':'family' } } });
    }
    const adj = tg.ok ? Object.keys(tg.adjustments || {}) : [];
    if(adj.length){
      const girdiler = adj.map(k => {
        const mk = tg.adjustments[k].marker, son = M.latestOf(mk), b = SP.BIO_BY_ID[mk];
        return { ad:b ? b.name : mk, deger:son ? son.v : null, birim:b ? b.unit : '', kesinlik:son ? 'measured' : 'missing' };
      });
      m.push({ ust:yz('spi.meals.tahlil-bagi'), sayi:sayi({ deger:adj.length, birim:'hedef', kesinlik:'computed',
          formul:'hedef bandın dışındaki tahlil → besin hedefi çarpanı', girdiler, zaman:U.todayISO() }),
        cumle:yz('spi.meals.yukseltildi'), vurgu:adj.map(k => SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k).join(', ') + '.', sistem:'spi',
        dugme:{ label:yz('spi.meals.oneri'), act:'meal-tab', data:{ 'data-tab':'oneri' } } });
    }
    return raw(V.donen({ id:'spi-ogun', ad:yz('spi.meals.ogun'), maddeler:m }));
  }

  function microCard(){
    const d = shownDate();
    const t = SP.Nutri.targets();
    const tot = SP.Nutri.dayTotals(d);
    if(!t.ok || tot.empty) return null;

    return K.Card({
      title:yz('spi.meals.mikro-besinler'), hint:'bioavailability',
      sub:yz('spi.meals.alinan-ve-emilen-ayri-goster'),
      body:K.Table({ tight:true,
        headers:['Öğe', { label:yz('spi.meals.alinan'), num:true }, { label:yz('spi.meals.emilen'), num:true },
          { label:yz('spi.meals.hedef-2'), num:true }, 'Durum'],
        rows:Object.keys(t.micro).map(id => {
          const n = SP.NUTRI_BY_ID[id];
          const tg = t.micro[id];
          const got = tot.micro[id] || 0;
          const abs = tot.absorbed[id] || 0;
          const pct = U.pct(got, tg.target);
          const tone = tg.limit ? (pct > 100 ? 'danger' : 'ok')
            : pct >= 100 ? 'ok' : pct >= 70 ? 'warn' : 'danger';
          return [
            html`<button class="linkbtn" data-act="open-nutrient" data-id="${id}">${n.name}</button>`,
            U.fmtNum(U.round(got, id === 'omega3' ? 2 : 0)),
            U.fmtNum(U.round(abs, id === 'omega3' ? 2 : 1)),
            U.fmtNum(tg.target) + ' ' + n.unit,
            K.Badge({ label:'%' + pct, tone }),
          ];
        }) }),
      foot:html`<span class="small dim">${yz('spi.meals.emilen-sutunu-ogun-icerigine')}</span>`,
    });
  }

  function gapCard(){
    const g = SP.Nutri.gaps(7);
    if(!g.ok){
      return K.Card({ title:yz('spi.meals.son-7-gun'), hint:'nutri-gap',
        body:K.Notice({ tone:'info', body:yz('spi.meals.son-7-gunde-hic-ogun')
          + yz('spi.meals.girilmemis-gun-sifir-sayilma') }) });
    }
    if(!g.rows.length){
      return K.Card({ title:yz('spi.meals.son-7-gun'), hint:'nutri-gap',
        badge:K.Badge({ label:g.avg.days + ' gün kayıt', tone:'ok' }),
        body:K.Notice({ tone:'ok', body:yz('spi.meals.son-7-gunun-ortalamasi-butun') }) });
    }
    return K.Card({
      title:yz('spi.meals.aciklar'), hint:'nutri-gap',
      sub:yz('spi.meals.son-7-gunun-ortalamasi') + g.avg.days + ' gün kayıt',
      badge:K.Badge({ label:g.rows.length + ' açık', tone:'warn' }),
      body:html`<div class="list">${map(g.rows.slice(0, 8), r => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${r.nutrient ? r.nutrient.name : r.id}</b>
            ${K.Badge({ label:r.kind === 'over' ? 'sınır aşıldı' : '%' + r.pct,
              tone:r.kind === 'over' ? 'danger' : r.pct >= 70 ? 'warn' : 'danger' })}
            <div class="tiny dim">${U.fmtNum(U.round(r.got, 1))} / ${U.fmtNum(r.target)}
              ${r.nutrient ? r.nutrient.unit : ''}${r.why ? ' · ' + r.why : ''}</div>
          </div>
          ${K.Button({ label:yz('spi.meals.kaynaklar'), size:'sm', act:'open-nutrient', data:{ 'data-id':r.id } })}
        </div>`)}</div>`,
    });
  }

  /* ------------------------------------------------------------ sheet'ler */

  function nutrientSheet(id){
    const n = SP.NUTRI_BY_ID[id];
    if(!n) return;
    const sources = SP.Nutri.sourcesFor(id, 8);
    const cheap = SP.Money.costPerNutrient(id, 6);
    const t = SP.Nutri.targets();
    const tg = t.ok ? t.micro[id] : null;

    UI.sheet({
      title:n.name, subtitle:n.note, wide:true,
      body:String(K.Stack([
        when(tg, () => K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          [yz('spi.meals.gunluk-hedef'), U.fmtNum(tg.target) + ' ' + n.unit],
          [yz('spi.meals.taban-referans'), U.fmtNum(tg.base) + ' ' + n.unit],
          ['Çarpan', tg.mult === 1 ? 'yok' : '×' + U.fmtNet(tg.mult) + (tg.why ? ' — ' + tg.why : '')],
          [yz('spi.meals.ust-sinir'), n.ul ? U.fmtNum(n.ul) + ' ' + n.unit : 'tanımlı değil'],
          [yz('spi.meals.i-lgili-olcum'), n.marker && SP.BIO_BY_ID[n.marker] ? SP.BIO_BY_ID[n.marker].name : '—'],
        ] })),
        K.Notice({ tone:'info', title:'Emilim:', body:n.absorb.note }),
        html`<h3 class="section-h">${yz('spi.meals.en-yogun-kaynaklar')}</h3>`,
        K.Table({ tight:true, headers:['Gıda', { label:yz('spi.meals.100-g-da'), num:true }, 'Porsiyon'],
          rows:sources.map(s => [s.food.name, U.fmtNum(U.round(s.per100, 2)) + ' ' + n.unit,
            (s.food.portions || [])[0] ? (s.food.portions[0].label + ' = ' + s.food.portions[0].g + ' g') : '—']) }),
        when(cheap.length, () => html`<h3 class="section-h">${yz('spi.meals.en-ucuz-kaynaklar')}</h3>`),
        when(cheap.length, () => K.Table({ tight:true,
          headers:['Gıda', { label:yz('spi.meals.birim-basi'), num:true }, 'Fiyat'],
          rows:cheap.map(c => [c.food.name,
            U.fmtNet(c.tlPerUnit) + ' TL / ' + n.unit,
            html`${U.fmtNum(c.price.tl)} TL/kg ${P.cert(c.cert)}`]) })),
      ])),
      footer:String(K.Button({ label:yz('spi.meals.kapat'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  function searchSheet(){
    const q = S.ui.foodQuery;
    const cat = S.ui.foodCat;
    let list = SP.FOODS;
    if(cat !== 'all') list = list.filter(f => f.cat === cat);
    if(q) list = list.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(U.norm(q)) >= 0);
    const page = SP.C.paginate(list, S.ui.foodPage, 12);

    UI.sheet({
      title:yz('spi.meals.besin-ara'), subtitle:list.length + ' gıda', wide:true,
      body:String(K.Stack([
        html`<div class="row gap-6">
          ${K.Input({ id:'food-q', value:q, placeholder:yz('spi.meals.ara-mercimek-somon-yogurt'),
            change:'food-query', data:{ 'data-debounce':'200' } })}
          ${K.Button({ label:yz('spi.meals.barkod'), size:'sm', act:'barkod-ac' })}</div>`,
        K.Select({ value:cat, change:'food-cat',
          options:[{ value:'all', label:yz('spi.meals.tum-kategoriler') }]
            .concat(SP.FOOD_CATS.map(c => ({ value:c.id, label:c.label }))) }),
        html`<div class="stack-xs">${map(page.items, f => html`
          <button class="foodrow" data-act="pick-food" data-id="${f.id}">
            <span class="foodrow__name">${f.name}</span>
            <span class="foodrow__meta num">${f.kcal} ${yz('spi.meals.kcal-p')} ${U.fmtNet(f.p)} g</span>
          </button>`)}</div>`,
        when(!page.items.length, () => K.Empty({ text:yz('spi.meals.eslesen-gida-yok') })),
        K.Pager({ page:page.page, pages:page.pages, total:page.total, act:'food-page' }),
      ])),
      footer:String(K.Button({ label:yz('spi.meals.kapat'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  /* Barkod (core/barkod.js, fikir 4): kişisel defter. Bilinen barkod
     doğrudan porsiyona gider; bilinmeyen için gıda SORULUR ve bağlanır. */
  let barkodKod = null;

  function barkodSheet(hata){
    UI.sheet({
      title:yz('spi.meals.barkod'), subtitle:yz('spi.meals.ilk-okutmada-bir-gidaya-bagl'),
      body:String(K.Stack([
        when(SP.Barkod.fotoVar(), () => K.Drop({ act:'barkod-foto', label:yz('spi.meals.barkodun-fotografi'), kamera:{},
          icon:'file', accept:'image/*', hint:yz('spi.meals.barkodu-yakindan-cek-ya-da') })),
        when(!SP.Barkod.fotoVar(), () => K.Notice({ tone:'info',
          body:yz('spi.meals.bu-tarayici-fotograftan-bark') })),
        K.Field({ label:yz('spi.meals.barkod-numarasi'), hint:'8 ya da 13 hane',
          input:K.Input({ id:'barkod-kod', numeric:true, placeholder:'8690000000000' }) }),
        html`<div id="barkod-hata" class="small" role="alert">${hata || ''}</div>`,
      ])),
      footer:String(html`${K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.meals.bul'), tone:'primary', act:'barkod-bul' })}`),
      noFocus:true,
    });
  }

  function barkodBagSheet(){
    const q = S.ui.barkodQ || '';
    let list = SP.FOODS;
    if(q) list = list.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(U.norm(q)) >= 0);
    UI.sheet({
      title:yz('spi.meals.bu-barkod-hangi-gida'), subtitle:barkodKod + ' · henüz bir gıdaya bağlı değil', wide:true,
      body:String(K.Stack([
        K.Input({ id:'barkod-q', value:q, placeholder:yz('spi.meals.ara-yogurt-ekmek'),
          change:'barkod-q', data:{ 'data-debounce':'200' } }),
        html`<div class="stack-xs">${map(list.slice(0, 12), f => html`
          <button class="foodrow" data-act="barkod-bagla" data-id="${f.id}">
            <span class="foodrow__name">${f.name}</span>
            <span class="foodrow__meta num">${f.kcal} ${yz('spi.meals.kcal-p')} ${U.fmtNet(f.p)} g</span>
          </button>`)}</div>`,
        when(!list.length, () => K.Empty({ text:yz('spi.meals.eslesen-gida-yok') })),
        html`<p class="tiny dim">${yz('spi.meals.sectigin-gida-bu-barkoda-bag')}</p>`,
      ])),
      footer:String(K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })),
      noFocus:true,
    });
  }

  async function barkodSonuc(r){
    if(!r.ok){ barkodSheet(r.why); return; }
    barkodKod = r.kod;
    if(r.foodId){ portionSheet(r.foodId); return; }
    S.ui.barkodQ = '';
    barkodBagSheet();
  }

  /* PORSİYON ÇARPANI (2026-10-25): «½ · 1 · 2 · 3» ev ölçüsünü çarpar.
     Çarpılan ölçü yine «tahmin»dir; tartılan gram çarpılmaz. */
  const CARPANLAR = [{ value:'0.5', label:'½' }, { value:'1', label:'1' }, { value:'2', label:'2' }, { value:'3', label:'3' }];
  function carpanliEtiket(label, c){
    if(c === 1) return label;
    const ad = c === 0.5 ? '½' : String(c);
    return /^1\s/.test(label) ? ad + label.slice(1) : ad + ' × ' + label;
  }

  function portionSheet(foodId, carpan){
    const f = SP.FOOD_BY_ID[foodId];
    if(!f) return;
    const c = [0.5, 1, 2, 3].indexOf(Number(carpan)) >= 0 ? Number(carpan) : 1;
    const son = sonPorsiyonlar()[f.id];
    const dugme = (label, g, ekSinif) => {
      const gc = Math.max(1, Math.round(g * c));
      const ad = carpanliEtiket(label, c);
      return K.Button({ label:ad + ' (' + gc + ' g)', size:'sm', tone:ekSinif || undefined,
        act:'add-portion', data:{ 'data-id':f.id, 'data-g':gc, 'data-label':ad } });
    };
    UI.sheet({
      title:f.name, subtitle:yz('spi.meals.porsiyon-sec-ev-olcusu'),
      body:String(K.Stack([
        html`<div class="row wrap gap-8"><span class="small dim">${yz('spi.meals.kac-porsiyon')}</span>
          ${K.Segmented({ act:'porsiyon-carpan', value:String(c), aria:yz('spi.meals.porsiyon-carpani'), items:CARPANLAR,
            data:{ 'data-id':f.id } })}</div>`,
        when(son, () => html`<div class="row wrap gap-6"><span class="small dim">${yz('spi.meals.son-girdigin')}</span>
          ${dugme(son ? porsiyonAdi(f, son) : '', son ? son.g : 0, 'primary')}</div>`),
        html`<div class="row wrap">${map(f.portions || [], p => dugme(p.label, p.g))}</div>`,
        K.Field({ label:yz('spi.meals.ya-da-gram-gir-tarttiysan'),
          input:K.Input({ id:'portion-g', type:'number', numeric:true, min:1, step:'1', placeholder:'150' }) }),
        K.Table({ tight:true, headers:['100 gramda', { label:yz('spi.meals.deger'), num:true }], rows:[
          ['Kalori', f.kcal + ' kcal'], ['Protein', U.fmtNet(f.p) + ' g'],
          ['Yağ', U.fmtNet(f.f) + ' g'], ['Karbonhidrat', U.fmtNet(f.c) + ' g'],
          ['Lif', U.fmtNet(f.fib || 0) + ' g'],
        ] }),
      ])),
      footer:String(html`${K.Button({ label:yz('spi.meals.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.meals.gram-ile-ekle'), tone:'primary', act:'add-grams', data:{ 'data-id':f.id } })}`),
    });
  }

  /* --------------------------------------------------------------- ekran */

  /* ------------------------------------------------------------- öneri

     Bu sayfa yeni bir kural icat etmez. Nesrin'in (beslenme) hedefi zaten
     Kerem'in (laboratuvar) bulgusundan besleniyor: SP.Nutri.labAdjust bir
     tahlil sonucu hedef bandın dışındaysa ilgili besin öğesinin hedefini
     yükseltir. Burada o zincir GÖRÜNÜR hale gelir — hangi ölçüm, hangi
     hedefi, ne kadar değiştirdi ve bunun karşılığı hangi yemektir.

     Zincir: ölçüm → hedef çarpanı → eksik öğe → o öğeyi taşıyan gıda. */

  const TABS = [
    { id:'gunluk', label:yz('spi.meals.ogunler'),      icon:'meal' },
    { id:'oneri',  label:yz('spi.meals.oneri'),        icon:'target' },
    { id:'deger',  label:yz('spi.meals.besin-degeri'), icon:'layers' },
  ];

  /* Bazal metabolizma → hareket → hedef. Her adım ayrı yazılır ki
     çıkan sayının nereden geldiği tartışılabilir olsun. */
  function energyCard(){
    const d = shownDate();
    const tg = SP.Nutri.targets(null, d);
    if(!tg.ok){
      return K.Card({ title:yz('spi.meals.gunluk-enerji'),
        body:K.Notice({ tone:'warn', title:yz('spi.meals.hesaplanamiyor'),
          body:yz('spi.meals.profilde') + tg.missing.join(', ') + ' eksik. Bu üçü olmadan bazal '
             + 'metabolizma tahmin edilmez; uydurulmuş bir sayı yazılmaz.' }),
        foot:K.Button({ label:yz('spi.meals.profili-tamamla'), size:'sm',
          act:'go', data:{ 'data-route':'family' } }) });
    }
    /* Zincir: bazal metabolizma + o gün GİRİLEN hareket = ihtiyaç → hedef.
       Hareket düzeyi çarpanı yok (kullanıcı, 2026-10-20): hareket girilmeyen
       gün ihtiyaç bazal metabolizmadır, tahmin eklenmez. */
    const n = tg.need;
    const seans = n.seanslar.map(s => s.ad + ' ' + s.dakika + ' dk · ' + U.fmtNum(s.kcal) + ' kcal').join(' · ');
    return K.Card({
      title:yz('spi.meals.gunluk-enerji'), hint:'macro-target',
      sub:U.fmtDate(d) + ' · bazal metabolizma ve girilen hareket',
      badge:K.Badge({ label:tg.goal.label, tone:'info' }),
      body:html`
        <div class="chain">
          <div class="chain__step">
            <span class="chain__label">${yz('spi.meals.bazal-metabolizma')}</span>
            <span class="chain__value num">${U.fmtNum(tg.bmr)}<small>kcal</small></span>
            <span class="chain__note">${yz('spi.meals.mifflin-st-jeor-kilo-boy')}</span>
          </div>
          <div class="chain__op">+</div>
          <div class="chain__step">
            <span class="chain__label">${yz('spi.meals.girilen-hareket')}</span>
            <span class="chain__value num">${n.hareketYok ? '—' : U.fmtNum(n.hareket)}<small>kcal</small></span>
            <span class="chain__note">${n.hareketYok ? yz('spi.meals.bu-gun-hareket-girilmedi-iht')
              : seans + ' · net MET (hesaplandı)'}${when(n.eksik.length, () => html` <b>${yz('spi.meals.hesaba-girmeyen')} ${n.eksik.join(', ')}.</b>`)}</span>
          </div>
          <div class="chain__op">=</div>
          <div class="chain__step">
            <span class="chain__label">${yz('spi.meals.i-htiyac')}</span>
            <span class="chain__value num">${U.fmtNum(tg.tdee)}<small>kcal</small></span>
            <span class="chain__note">${yz('spi.meals.hesaplandi-gunden-gune-degis')}</span>
          </div>
          <div class="chain__op">${tg.goal.deficit === 0 ? '=' :
            (tg.goal.deficit > 0 ? '+' : '−') + '%' + Math.abs(Math.round(tg.goal.deficit * 100))}</div>
          <div class="chain__step chain__step--end">
            <span class="chain__label">${yz('spi.meals.hedef-2')}</span>
            <span class="chain__value num">${U.fmtNum(tg.kcal)}<small>kcal</small></span>
            <span class="chain__note">${tg.kcalKaynak === 'plan' ? yz('spi.meals.uygulanan-planin-gunluk-fark') : tg.goal.note}${when(tg.bmrTaban, () => ' · bazal metabolizmanın altına inmez')}</span>
          </div>
        </div>
        <div class="cols-3 mt-16">
          ${K.Stat({ label:yz('spi.meals.protein'), value:tg.protein.min + '–' + tg.protein.max, unit:'g' })}
          ${K.Stat({ label:yz('spi.meals.yag'), value:tg.fat.min + '–' + tg.fat.max, unit:'g' })}
          ${K.Stat({ label:yz('spi.meals.lif'), value:String(tg.fiber), unit:'g' })}
        </div>`,
      foot:html`<span class="small dim">${yz('spi.meals.hedef-degistirmek-icin-hane')}</span>`,
    });
  }

  /* Koçlar arası bağ: Kerem'in bulgusu Nesrin'in hedefini değiştirdiyse
     burada satır satır yazar. Değiştirmediyse bu kart hiç çizilmez —
     olmayan bir bağ için boş kutu göstermek gürültüdür. */
  function labLinkCard(){
    const tg = SP.Nutri.targets();
    const adj = tg.adjustments || {};
    const ids = Object.keys(adj);
    if(!ids.length){
      return K.Card({ title:yz('spi.meals.tahlil-bagi'), hint:'lab-linked-food',
        body:K.Notice({ tone:'info',
          body:SP.Bio.summary().measured
            ? yz('spi.meals.su-an-hicbir-tahlil-sonucu')
              + yz('spi.meals.olcumler-hedef-bandin-icinde')
            : yz('spi.meals.henuz-test-girilmedi-tahlil')
              + 'kendiliğinden ona göre ayarlanır.' }),
        foot:K.Button({ label:yz('spi.meals.testler-bolumune-git'), size:'sm',
          act:'go', data:{ 'data-route':'labs' } }) });
    }
    return K.Card({
      title:yz('spi.meals.tahlil-bagi'), hint:'lab-linked-food',
      sub:yz('spi.meals.laboratuvar-bulgusu-beslenme'),
      badge:K.Badge({ label:ids.length + ' hedef', tone:'warn' }),
      body:html`${map(ids, id => {
        const a = adj[id];
        const n = SP.NUTRI_BY_ID[id];
        const b = SP.BIO_BY_ID[a.marker];
        const last = M.latestOf(a.marker);
        return html`
          <div class="link">
            <div class="link__from">
              ${P.avatar('lab', 'sm')}
              <button class="linkbtn" data-act="open-marker-x" data-id="${a.marker}">
                ${b ? b.name : a.marker}</button>
              ${when(last, () => html`<b class="num small">${U.fmtNum(last.v)}
                <span class="dim">${b ? b.unit : ''}</span></b>`)}
            </div>
            <div class="link__arrow" aria-hidden="true">→</div>
            <div class="link__to">
              ${P.avatar('nutri', 'sm')}
              <b class="small">${n ? n.name : id}</b>
              ${K.Badge({ label:yz('spi.meals.hedef-3') + U.fmtNet(a.mult),
                tone:a.mult > 1 ? 'warn' : 'info' })}
            </div>
            ${K.Katmanli({ metin:a.why, sinif:'link__why' })}
          </div>`;
      })}`,
    });
  }

  /* Eksik öğeyi hangi yemek kapatır? Öneri gıda listesinden gelir,
     modelden değil: kural motoru burada da otoritedir. */
  function suggestCard(){
    const g = SP.Nutri.gaps(7);
    if(!g.ok){
      return K.Card({ title:yz('spi.meals.bugun-ne-yenmeli'),
        body:K.Notice({ tone:'info',
          body:yz('spi.meals.oneri-icin-en-az-birkac')
            + yz('spi.meals.kayit-yoksa-eksik-hesaplanam') }),
        foot:K.Button({ label:yz('spi.meals.ogun-ekle'), size:'sm',
          act:'meal-tab', data:{ 'data-tab':'gunluk' } }) });
    }
    const under = g.rows.filter(r => r.kind === 'under').slice(0, 4);
    if(!under.length){
      return K.Card({ title:yz('spi.meals.bugun-ne-yenmeli'),
        body:K.Notice({ tone:'ok', body:yz('spi.meals.son-yedi-gunun-ortalamasi-bu')
          + 'öğelerinde hedefi karşılıyor. Öneri üretilmedi.' }) });
    }
    return K.Card({
      title:yz('spi.meals.bugun-ne-yenmeli'), hint:'nutri-gap',
      sub:yz('spi.meals.son-yedi-gunun-en-buyuk'),
      body:html`${map(under, r => html`
        <div class="sugg">
          <div class="sugg__head">
            <b class="small">${r.nutrient.name}</b>
            ${K.Badge({ label:'%' + Math.round(r.pct), tone:r.pct < 60 ? 'danger' : 'warn' })}
            <span class="tiny dim">${U.fmtNum(U.round(r.gap, 1))} ${r.nutrient.unit} eksik</span>
          </div>
          <div class="sugg__foods">${map(SP.Nutri.sourcesFor(r.id, 4), sr => html`
            <button class="suggfood" data-act="pick-food" data-id="${sr.food.id}">
              <b>${sr.food.name}</b>
              <span class="num">${U.fmtNum(U.round(sr.per100, 1))} ${r.nutrient.unit}
                <span class="dim">${yz('spi.meals.100-g')}</span></span>
            </button>`)}</div>
          ${when(r.why, () => html`<p class="sugg__why">${r.why}</p>`)}
        </div>`)}`,
      foot:html`<span class="small dim">${yz('spi.meals.bir-gidaya-dokunarak-porsiyo')}</span>`,
    });
  }

  function adviceView(){
    return html`
      <section class="sect">
        <div class="sect__h"><div class="sect__ht">
          <div class="sect__eyebrow">${yz('spi.meals.hedef-2')}</div>
          <h2>${yz('spi.meals.enerji-ve-oneri')}</h2>
          <p>${yz('spi.meals.bazal-metabolizmadan-hedefe')}</p>
        </div></div>
        <div class="grid">
          <div class="span-7"><div class="stack">${[energyCard(), suggestCard()]}</div></div>
          <div class="span-5"><div class="stack">${[labLinkCard(), P.clinicalNote()]}</div></div>
        </div>
      </section>`;
  }

  function akilliBeslenmeKutusu(){
    const list = (SP.SPOR_BESLENME || []).slice(0, 6);
    if(!list.length) return '';
    return K.Card({
      title:yz('spi.meals.beslenme-ve-emilim-notlari'),
      sub:yz('spi.meals.kanita-dayali-sporcu-beslenm'),
      body:html`<div class="stack-sm">${map(list, s => html`
        <div class="ogrenme">
          <div class="row between gap-6 mb-2">
            <b class="small" style="color:var(--text)">${s.situation}</b>
            <span class="tiny dim">${yz('spi.meals.akilli-i-lke')}</span>
          </div>
          <p class="small mb-0" style="line-height:1.4">${s.editor_action}</p>
        </div>`)}</div>`,
    });
  }

  /* Sekme yok (EKIP-PLANI §1.2): üç bölüm alt alta; bölüm çubuğu kaydırır,
     günün öğün sayısı çubukta rozet. Bir bölüm çizilemezse yalnız o bölüm
     sakin bir notla düşer. */
  const BODIES = {
    /* iPhone Faz 2b: sol sütun iş (öğünü yaz, günün öğünleri), sağ sütun
       durum ve kısayol (dönen «Öğün» kartı, sık öğünler); raf DOM sırasıyla
       ikişer dizer. Telefonda tek sütun: önce yazma alanı. */
    gunluk:() => html`${K.Ledger(() => [quickEntry(), DonenOgun(), dayCard(), sablonKutusu(), cizelgeKutusu(), targetCard(), tabakKutusu()])}
      <div class="mt-24">${raw(UI.rail(['portion', 'bioavailability', 'macro-target']))}</div>`,
    oneri:() => html`${K.Ledger(() => [energyCard(), labLinkCard(), suggestCard(), akilliBeslenmeKutusu()])}
      <div class="mt-24">${raw(UI.rail(['macro-target', 'lab-linked-food', 'nutri-gap']))}</div>`,
    deger:() => html`${K.Ledger(() => [microCard(), gapCard()])}
      <div class="mt-24">${raw(UI.rail(['bioavailability', 'nutri-gap']))}</div>`,
  };

  function govde(t){
    try{ return BODIES[t.id](); }
    catch(e){
      console.error('Öğün bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:yz('spi.meals.bu-bolum-su-an-cizilemedi') });
    }
  }

  /* PANO KARTLARI (2026-10-20; brand/ortak/pano.js): öğünlerim günün
     çizgisinde (kendi öğün adların ve saatlerin; girilen öğün dolu nokta)
     ve makrolar tek yığılmış çubukta. Kayıt yoksa boş hâl. */
  function PanoOgun(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P || !SP.Ogun) return '';
    const d = shownDate();
    const ogunler = M.mealsOf(d);
    const slotlar = SP.Ogun.liste();
    const dk = s => /^\d{1,2}:\d{2}$/.test(s || '') ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : null;
    const saatli = slotlar.every(s => dk(s.saat) != null);
    const bas = 5 * 60, bit = 23 * 60;
    const noktalar = slotlar.map((s, i) => ({ ad:s.label, dolu:ogunler.some(m => m.slot === s.id),
      yer:saatli ? Math.max(0, Math.min(1, (dk(s.saat) - bas) / (bit - bas))) : (slotlar.length > 1 ? i / (slotlar.length - 1) : .5) }));
    const girilen = noktalar.filter(n => n.dolu).length;
    const sira = noktalar.find(n => !n.dolu);
    const sirada = sira ? slotlar[noktalar.indexOf(sira)] : null;
    const ogunKart = P.kart({ tur:'ogunlerim', ad:yz('spi.meals.ogunlerim'), simge:'ogun', yuva:girilen + ' / ' + slotlar.length,
      govde:P.cizgi({ noktalar }) + P.not(sirada ? yz('spi.meals.siradaki') + sirada.label + (sirada.saat ? ' · ' + sirada.saat : '') : yz('spi.meals.butun-ogunler-girildi')) });
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets(null, d);
    const g = x => Math.round(Number(x) || 0);
    const makro = t.empty
      ? P.kart({ tur:'makro', ad:yz('spi.meals.makrolar'), simge:'cubuk', bos:{ cumle:yz('spi.meals.ogun-girilince-protein-karbo') } })
      : P.kart({ tur:'makro', ad:yz('spi.meals.makrolar'), simge:'cubuk', yuva:'girilen öğünlerden',
          govde:P.yigin({ parcalar:[{ ad:yz('spi.meals.protein'), deger:g(t.protein), metin:g(t.protein) + ' g' }, { ad:yz('spi.meals.karbonhidrat'), deger:g(t.carb), metin:g(t.carb) + ' g' },
            { ad:yz('spi.meals.yag'), deger:g(t.fat), metin:g(t.fat) + ' g' }] })
            + (tg.ok && tg.protein ? P.esik({ deger:g(t.protein), esik:tg.protein.min, etiket:yz('spi.meals.protein-2') + g(t.protein) + ' gram, hedef en az ' + tg.protein.min, yon:'artis-iyi' })
              + P.not('protein · hedef en az ' + tg.protein.min + ' g') : '') });
    /* Su ve protein serileri: son 14 gün (dolu: eşik/hedef tuttu, yarım:
       girildi ama tutmadı, kesik: kayıt yok). */
    const on4 = []; for(let i = 13; i >= 0; i--) on4.push(U.iso(U.addDays(U.today(), -i)));
    const suDurum = on4.map(g => { const v = S.vitals[g]; const ml = v && v.water != null ? Number(v.water) : null; return ml == null ? 'yok' : ml >= 2000 ? 'dolu' : 'yarim'; });
    const suKart = P.kart({ tur:'su-serisi', ad:yz('spi.meals.su-14-gun'), simge:'su', yuva:suDurum.filter(x => x === 'dolu').length + ' gün 2 L',
      govde:P.kareler({ durumlar:suDurum, sutun:14, etiket:yz('spi.meals.son-14-gunun') + suDurum.filter(x => x === 'dolu').length + '’inde 2 litre içildi' })
        + P.not('dolu: 2 L ve üstü · yarım: girildi · kesik: kayıt yok') });
    const tgP = tg.ok && tg.protein ? tg.protein.min : null;
    const prDurum = on4.map(g => { const x = SP.Nutri.dayTotals(g); return x.empty ? 'yok' : tgP && x.protein >= tgP ? 'dolu' : 'yarim'; });
    const prKart = tgP ? P.kart({ tur:'protein-serisi', ad:yz('spi.meals.protein-14-gun'), simge:'cubuk', yuva:prDurum.filter(x => x === 'dolu').length + ' gün hedefte',
      govde:P.kareler({ durumlar:prDurum, sutun:14, etiket:yz('spi.meals.son-14-gunun') + prDurum.filter(x => x === 'dolu').length + '’inde protein hedefi tuttu' })
        + P.not('dolu: en az ' + tgP + ' g · yarım: öğün var, hedef altında · kesik: öğün yok') }) : '';
    /* En sık yenenler: son 30 günün öğün kalemleri. */
    const say = {};
    for(let i = 0; i < 30; i++){
      M.mealsOf(U.iso(U.addDays(U.today(), -i))).forEach(m => (m.items || []).forEach(it => { if(it.foodId) say[it.foodId] = (say[it.foodId] || 0) + 1; }));
    }
    const sik = Object.keys(say).sort((a, b) => say[b] - say[a]).slice(0, 5);
    const enSik = say[sik[0]] || 1;
    const sikKart = sik.length >= 2 ? P.kart({ tur:'sik-yenenler', ad:yz('spi.meals.en-sik-yenenler'), simge:'ogun', yuva:'son 30 gün',
      govde:P.cubuklar({ satirlar:sik.map(id => ({ ad:(SP.FOOD_BY_ID[id] || {}).name || id, oran:say[id] / enSik, metin:say[id] + ' kez' })) }) }) : '';
    /* Öğün saatleri: son 30 günün öğünleri günün saatlerine göre (girilen
       saat; yoksa kaydın saati). */
    const saat = new Array(24).fill(null);
    for(let i = 0; i < 30; i++){
      M.mealsOf(U.iso(U.addDays(U.today(), -i))).forEach(m => {
        const s = /^(\d{1,2}):/.exec(m.time || '') || /T(\d{2}):/.exec(m.at || '');
        if(s){ const h = Number(s[1]); saat[h] = (saat[h] || 0) + 1; }
      });
    }
    const saatKart = saat.filter(v => v != null).length >= 3 ? P.kart({ tur:'ogun-saatleri', ad:yz('spi.meals.ogun-saatlerin'), simge:'saat', yuva:'son 30 gün',
      govde:P.sutun({ degerler:saat, yukseklik:44, etiket:yz('spi.meals.ogunlerin-gunun-saatlerine-d') })
        + '<div class="pk-saat__ad"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>'
        + P.not('girilen öğün saati; yoksa kaydın saati') }) : '';
    return '<div class="pk-ust">' + P.izgara([ogunKart, makro, suKart, prKart, sikKart, saatKart]) + '</div>';
  }

  LIFEOS.PARCA.blok({ id:'meals.pano', sayfa:'meals', yer:'ust', ad:'Öğün özeti', ciz:() => PanoOgun() });
  TABS.forEach(t => LIFEOS.PARCA.blok({ id:'meals.' + t.id, sayfa:'meals', yer:t.id, ad:t.label, ciz:() => govde(t) }));
  async function render(){
    const n = M.mealsOf(shownDate()).length;
    return String(LIFEOS.PARCA.yer('meals', 'ust', K) + K.SayfaBolumleri({ act:'meal-tab', aria:'Besin bölümleri',
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:LIFEOS.PARCA.yer('meals', t.id, K),
        sayi:t.id === 'gunluk' && n ? n : null })) }));
  }

  /* Başka yerden istenen bölüm (ofis kartının «Besin değeri tablosu» gibi)
     çizimden sonra görünür yapılır; istek bir kez kullanılır. */
  function afterRender(){
    const t = S.ui.mealTab;
    S.ui.mealTab = null;
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);

    const mt = document.getElementById('meal-text');
    if(mt && !mt._hasAutoListener){
      mt._hasAutoListener = true;
      mt.addEventListener('input', (e) => {
        S.ui.mealDraftQuery = e.target.value.trim();
        S.ui.mealDraftText = e.target.value;
        /* 2026-10-25: çipler her harfte yazının kendisini izler; eşleşme
           yoksa kutu boşalır, yazı silinince öğünün önerileri döner. */
        cipleriTazele();
      });
    }
  }

  /* Metinden gelen kalemleri secili ogune yazar. Doner: geri alma bilgisi
     (2026-10-25) -- hangi gun, hangi ogun, yeni mi acildi, hangi kalemler. */
  async function pushItems(items, note){
    const d = shownDate();
    const slot = seciliSlot();
    const rows = M.mealsOf(d).slice();
    let meal = rows.find(m => m.slot === slot);
    const yeni = !meal;
    if(yeni){ meal = M.newMeal(slot); rows.push(meal); }
    const eskiNot = meal.note;
    const eklenen = items.map(x => Object.assign({}, x));
    meal.items = (meal.items || []).concat(eklenen);
    if(note) meal.note = [meal.note, note].filter(Boolean).join(' · ');
    await M.saveMeals(d, rows);
    return { d, mealId:meal.id, yeni, eklenen, eskiNot };
  }
  /* Eklemeyi geri alir: yalniz o eklemenin kalemleri cikar; ogun bu
     eklemeyle acildiysa ve baska kalemi yoksa ogun de gider. Kalem nesnesi
     degistiyse (esitleme) ayni gida ve gram sondan eslenir. */
  async function eklemeyiGeriAl(r){
    const rows = M.mealsOf(r.d).slice();
    const meal = rows.find(m => m.id === r.mealId);
    if(!meal) return;
    let kalan = (meal.items || []).filter(it => r.eklenen.indexOf(it) < 0);
    if(kalan.length === (meal.items || []).length){
      kalan = (meal.items || []).slice();
      r.eklenen.forEach(x => {
        for(let i = kalan.length - 1; i >= 0; i--){
          if(kalan[i].foodId === x.foodId && Number(kalan[i].g) === Number(x.g)){ kalan.splice(i, 1); break; }
        }
      });
    }
    if(r.yeni && !kalan.length){ await M.deleteMeal(r.d, r.mealId); return; }
    meal.items = kalan;
    meal.note = r.eskiNot;
    await M.saveMeals(r.d, rows);
  }

  const handle = {
    async 'open-photo'(){ photoFile = null; photoRes = null; photoSheet(); },
    async 'run-photo'(){
      if(!photoFile) return;
      const hints = {
        amount:(document.getElementById('ph-amount') || {}).value || '',
        vessel:(document.getElementById('ph-vessel') || {}).value || '',
        extra:(document.getElementById('ph-extra') || {}).value || '',
      };
      photoRes = await UI.withBusy(yz('spi.meals.fotograf-okunuyor'),
        'gramaj tahmin edilecek, ölçüm değil',
        () => SP.Extract.fromMealPhoto(photoFile, hints));
      photoPreviewSheet(photoRes);
    },
    async 'toggle-photo-row'(el){
      const i = Number(el.dataset.i);
      if(!photoRes || !photoRes.items[i]) return;
      photoRes.items[i].skip = !el.checked;
      photoPreviewSheet(photoRes);
    },
    async 'save-photo'(){
      if(!photoRes) return;
      const items = photoRes.items.filter(x => !x.skip);
      if(!items.length) return;
      const r = await pushItems(items.map(i => ({ foodId:i.foodId, g:i.g, cert:'estimated',
        portion:'fotoğraf' })), 'fotoğraftan');
      photoRes = null; photoFile = null;
      UI.closeSheet();
      SP.App.render();
      geriAlToast(items.length + ' gıda eklendi · tahmin', () => eklemeyiGeriAl(r));
    },
    async 'meal-tab'(el){ K.bolumeGit(el.dataset.tab); },
    /* Tahlil bagindan olcume gitmek: Testler bolumu o olcumun egilimini acar. */
    async 'open-marker-x'(el){
      S.ui.trendMarker = el.dataset.id;
      S.ui.labTab = 'trend';
      SP.App.go('labs');
    },
    async 'shift-day'(el){
      const n = Number(el.dataset.value);
      S.ui.mealDate = n === 0 ? null : U.iso(U.addDays(U.parse(shownDate()), n));
      if(S.ui.mealDate === U.todayISO()) S.ui.mealDate = null;
      SP.App.render();
    },
    async 'focus-meal'(){
      const el = document.getElementById('meal-text');
      if(el) el.focus();
    },
    async 'quick-add-food'(el){
      const foodId = el.dataset.id;
      const f = SP.FOOD_BY_ID[foodId];
      if(!f) return;
      const g = Number(el.dataset.g) || 100;
      const portion = el.dataset.label || '1 porsiyon';
      const eskiMetin = S.ui.mealDraftText || '';
      const r = await pushItems([{ foodId:f.id, g:g, cert:'estimated', portion:portion }], f.name);
      S.ui.mealDraftText = '';
      S.ui.mealDraftQuery = '';
      SP.App.render();
      geriAlToast(f.name + ' (' + portion + ') eklendi · tahmin', async () => {
        await eklemeyiGeriAl(r);
        S.ui.mealDraftText = eskiMetin; S.ui.mealDraftQuery = eskiMetin.trim();
      });
    },
    /* 2026-10-25: tanınmayan parça atılmaz -- alanda kalır ve bildirimde
       adıyla yazılır; kullanıcı düzeltip yeniden ekler (MIMARI §4). */
    async 'add-meal'(){
      const el = document.getElementById('meal-text');
      if(!el || !el.value.trim()) return;
      const metin = el.value;
      const parsed = SP.Parse.parseMeal(metin);
      const kalan = (parsed.unmatched || []).join(', ');
      if(!parsed.items.length){
        UI.toast(kalan ? yz('spi.meals.taninmadi') + kalan + '. «1 tabak mercimek çorbası» gibi yazmayı dene.' : parsed.note);
        return;
      }
      const r = await pushItems(parsed.items.map(i => ({ foodId:i.foodId, g:i.g, cert:i.cert, portion:i.portion })),
        parsed.items.map(i => i.source).filter(Boolean).join(', '));
      el.value = kalan;
      S.ui.mealDraftText = kalan;
      S.ui.mealDraftQuery = kalan;
      SP.App.render();
      geriAlToast(parsed.items.length + ' gıda eklendi' + (kalan ? ' · Tanınmadı: ' + kalan : ''), async () => {
        await eklemeyiGeriAl(r);
        S.ui.mealDraftText = metin; S.ui.mealDraftQuery = metin.trim();
      });
    },
    'hazir-ogun-sakla'(el){
      const meal = M.mealsOf(shownDate()).find(m => m.id === el.dataset.id);
      if(meal && SP.Hazir) hazirOgunSheet(meal);
    },
    async 'hazir-ogun-kaydet'(el){
      const meal = M.mealsOf(shownDate()).find(m => m.id === el.dataset.id);
      const g = document.getElementById('hazir-ogun-ad');
      const r = meal ? await SP.Hazir.ogunSakla(meal, g ? g.value : '') : { ok:false, why:yz('spi.meals.ogun-bulunamadi') };
      UI.closeSheet();
      UI.toast(r.ok ? '«' + r.kayit.ad + '» hazır öğünlere eklendi' : r.why);
      SP.App.render();
    },
    async 'hazir-ogun-ekle'(el){
      const d = shownDate();
      const r = await SP.Hazir.ogunEkle(el.dataset.id, d, seciliSlot());
      if(!r.ok){ UI.toast(r.why); return; }
      SP.App.render();
      { const Z = (window.LIFEOS || {}).ZEMIN; if(Z && Z.nabiz) Z.nabiz(); }
      UI.toast('«' + r.ad + '» eklendi', { undo:async () => { await r.geriAl(); SP.App.render(); } });
    },
    'hazir-ogun-duzen'(){ S.ui.hazirOgunDuzen = !S.ui.hazirOgunDuzen; SP.App.render(); },
    async 'hazir-ogun-sil'(el){
      const h = SP.Hazir.ogunler().find(x => x.id === el.dataset.id);
      const r = await SP.Hazir.ogunSil(el.dataset.id);
      if(!SP.Hazir.ogunler().length) S.ui.hazirOgunDuzen = false;
      SP.App.render();
      /* Silme geri alınır: kayıt aynen geri saklanır (küçük aksiyon). */
      if(r.ok && h) UI.toast('«' + h.ad + '» silindi', { undo:async () => {
        await M.saveProfile({ hazirOgunler:[h].concat(SP.Hazir.ogunler()) }); SP.App.render(); } });
    },
    async 'sablon-ekle'(el){
      const kaynak = M.mealsOf(el.dataset.date).find(m => m.id === el.dataset.id);
      if(!kaynak) return;
      const yeni = M.newMeal(seciliSlot());
      yeni.items = (kaynak.items || []).map(x => Object.assign({}, x));
      const d = shownDate();
      await M.addMeal(d, yeni);
      SP.App.render();
      UI.toast(yz('spi.meals.ogun-eklendi'), { undo:async () => { await M.deleteMeal(d, yeni.id); SP.App.render(); } });
    },
    async 'ogun-dunku-ekle'(el){
      const d = shownDate();
      const r = await SP.Dunku.ogunKopyala(d, el.dataset.id);
      if(!r.ok){ UI.toast(r.why); return; }
      SP.App.render();
      { const Z = (window.LIFEOS || {}).ZEMIN; if(Z && Z.nabiz) Z.nabiz(); }
      geriAlToast('«' + r.ad + '» dünkü gibi eklendi', () => SP.Dunku.geriAl(d, 'ogun', r.id));
    },
    /* 2026-10-25: silme geri alınır. Öğünün kopyası ve fotoğrafı önce
       alınır; «Geri al» ikisini de yerine koyar (Mutfak'taki gıda silme gibi). */
    async 'del-meal'(el){
      const d = shownDate(), id = el.dataset.id;
      const rows = M.mealsOf(d);
      const sira = rows.findIndex(m => m.id === id);
      if(sira < 0) return;
      const kopya = JSON.parse(JSON.stringify(rows[sira]));
      let foto = null;
      if(SP.Foto){ try{ foto = await SP.Foto.al('ogun:' + id); }catch(e){ foto = null; } }
      await M.deleteMeal(d, id);
      /* Öğünle birlikte fotoğrafı da gider; sahipsiz fotoğraf kalmaz. */
      if(SP.Foto) await SP.Foto.sil('ogun:' + id);
      SP.App.render();
      const ad = SP.Ogun ? SP.Ogun.ad(kopya.slot) : kopya.slot;
      geriAlToast('«' + ad + '» silindi', async () => {
        const r2 = M.mealsOf(d).slice();
        if(!r2.some(m => m.id === kopya.id)) r2.splice(Math.min(sira, r2.length), 0, kopya);
        await M.saveMeals(d, r2);
        if(foto && SP.Foto) await SP.Foto.kaydet('ogun:' + kopya.id, foto);
      });
    },
    async 'del-item'(el){
      const d = shownDate();
      const rows = M.mealsOf(d).slice();
      const meal = rows.find(m => m.id === el.dataset.id);
      if(!meal) return;
      const sira = Number(el.dataset.i);
      const kalem = meal.items[sira];
      if(!kalem) return;
      const ogunKopya = JSON.parse(JSON.stringify(Object.assign({}, meal, { items:[] })));
      meal.items.splice(sira, 1);
      await M.saveMeals(d, rows);
      SP.App.render();
      const f = SP.FOOD_BY_ID[kalem.foodId];
      geriAlToast((f ? f.name : 'Kalem') + ' çıkarıldı', async () => {
        const r2 = M.mealsOf(d).slice();
        let m2 = r2.find(m => m.id === ogunKopya.id);
        if(!m2){ m2 = ogunKopya; r2.push(m2); }
        m2.items.splice(Math.min(sira, m2.items.length), 0, kalem);
        await M.saveMeals(d, r2);
      });
    },
    async 'open-search'(){ S.ui.foodPage = 1; searchSheet(); },
    async 'food-page'(el){ S.ui.foodPage = Number(el.dataset.page); searchSheet(); },
    async 'pick-food'(el){ portionSheet(el.dataset.id); },
    async 'barkod-ac'(){ barkodSheet(); },
    async 'barkod-bul'(){
      const e = document.getElementById('barkod-kod');
      await barkodSonuc(await SP.Barkod.coz(e ? e.value : ''));
    },
    async 'barkod-bagla'(el){
      const r = await SP.Barkod.bagla(barkodKod, el.dataset.id);
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast(yz('spi.meals.barkod-baglandi'));
      portionSheet(el.dataset.id);
    },
    async 'porsiyon-carpan'(el){ portionSheet(el.dataset.id, Number(el.dataset.value)); },
    async 'add-portion'(el){
      const f = SP.FOOD_BY_ID[el.dataset.id];
      const g = Number(el.dataset.g);
      if(!f || !(g > 0)) return;
      const r = await pushItems([{ foodId:f.id, g, cert:'estimated', portion:el.dataset.label }]);
      UI.closeSheet();
      SP.App.render();
      geriAlToast(f.name + ' (' + el.dataset.label + ') eklendi · tahmin', () => eklemeyiGeriAl(r));
    },
    async 'add-grams'(el){
      const input = document.getElementById('portion-g');
      const g = input ? Number(input.value) : 0;
      if(!(g > 0)){ UI.toast(yz('spi.meals.gram-gir')); return; }
      const f = SP.FOOD_BY_ID[el.dataset.id];
      const r = await pushItems([{ foodId:el.dataset.id, g, cert:'measured', portion:null }]);
      UI.closeSheet();
      SP.App.render();
      geriAlToast((f ? f.name + ' ' : '') + g + ' g eklendi · ölçüldü', () => eklemeyiGeriAl(r));
    },
    async 'open-nutrient'(el){ nutrientSheet(el.dataset.id); },
  };

  const change = {
    async 'meal-photo'(el){
      photoFile = (el.files && el.files[0]) || null;
      const n = document.getElementById('photo-name');
      if(n) n.textContent = photoFile ? photoFile.name : '';
      const run = document.querySelector('[data-act="run-photo"]');
      if(run) run.disabled = !photoFile || !SP.Extract.modelReady();
    },
    async 'pick-slot'(el){ S.ui.mealSlot = el.value; cipleriTazele(); },
    /* ÖĞÜNLERİM (core/ogun.js): ad ve saat kullanıcının. */
    'ogun-duzen'(){ S.ui.ogunTaslak = { liste:SP.Ogun.liste().map(x => Object.assign({}, x)), hata:null }; ogunSheet(); },
    'ogun-ekle'(){ ogunOku(); const t = S.ui.ogunTaslak; t.liste.push(SP.Ogun.yeni('', null)); ogunSheet(); },
    'ogun-sil'(el){ ogunOku(); const t = S.ui.ogunTaslak; t.liste.splice(Number(el.dataset.i), 1); ogunSheet(); },
    async 'ogun-kaydet'(){
      ogunOku();
      const t = S.ui.ogunTaslak;
      const r = await SP.Ogun.kaydet(t.liste);
      if(!r.ok){ t.hata = r.why; ogunSheet(); return; }
      S.ui.ogunTaslak = null;
      if(S.ui.mealSlot && !SP.Ogun.liste().some(x => x.id === S.ui.mealSlot)) S.ui.mealSlot = null;
      UI.closeSheet();
      UI.toast(yz('spi.meals.ogunlerin-kaydedildi'), { undo:async () => { await SP.Ogun.geriAl(r); UI.toast(yz('spi.meals.geri-alindi')); SP.App.render(); } });
      SP.App.render();
    },
    async 'food-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; searchSheet(); },
    async 'food-cat'(el){ S.ui.foodCat = el.value; S.ui.foodPage = 1; searchSheet(); },
    async 'barkod-q'(el){ S.ui.barkodQ = el.value; barkodBagSheet(); },
    async 'barkod-foto'(el){
      const f = el.files && el.files[0];
      if(!f) return;
      await barkodSonuc(await UI.withBusy(yz('spi.meals.barkod-okunuyor'), 'fotoğraf bu cihazda okunur',
        () => SP.Barkod.fotodan(f)));
    },
  };

  /* King'den gelen fotoğraf (king.js söz 11): «Fotoğraftan öğün» penceresi
     bu fotoğrafla açılır; okuma yine kullanıcının «Oku»suyla, model bağlıysa. */
  function fotoKoy(file){ photoFile = file || null; photoRes = null; photoSheet(); return !!photoFile; }

  return {
    fotoKoy,
    id:'meals',
    /* Sadelik (açık en çok üç): başvuru notları küçük başlar. */
    kucukVarsayilan:['beslenme-ve-emilim-notları'],
    title:yz('spi.meals.ogunler'),
    headline(){
      const tg = SP.Nutri.targets();
      if(!tg.ok) return yz('spi.meals.hedef-icin-profil-eksik');
      const t = SP.Nutri.dayTotals(shownDate());
      if(t.empty) return yz('spi.meals.bugun-hic-ogun-girilmedi');
      const pct = U.pct(t.kcal, tg.kcal);
      if(pct > 115) return yz('spi.meals.bugun-hedefin-ustundesin');
      if(pct >= 85) return yz('spi.meals.bugun-hedefin-icindesin');
      return yz('spi.meals.gunun') + Math.round(pct) + '%\u2019i tamam.';
    },
    lede(){
      const tg = SP.Nutri.targets();
      if(!tg.ok){
        return yz('spi.meals.profilde') + tg.missing.join(', ') + ' girilince bazal metabolizma ve '
          + 'hedef hesaplanır. Eksik veriden sayı uydurulmaz.';
      }
      const adj = Object.keys(tg.adjustments || {}).length;
      return tg.goal.label.toLocaleLowerCase('tr-TR') + ' hedefi için günde '
        + U.fmtNum(tg.kcal) + ' kcal ve ' + tg.protein.min + ' g protein.'
        + (adj ? ' ' + adj + ' hedef, tahlil sonucuna göre yükseltildi.' : '');
    },
    stats(){
      const tg = SP.Nutri.targets();
      if(!tg.ok) return [];
      const t = SP.Nutri.dayTotals(shownDate());
      /* Öğün girilmemiş gün «0» değildir (AGENTS §1.2, 2026-10-25): değer
         «—», etiket «veri yok» der (Mutfak'taki besin kartıyla aynı düzen). */
      return [
        { value:U.fmtNum(tg.bmr), label:yz('spi.meals.bazal-kcal') },
        { value:U.fmtNum(tg.kcal), label:yz('spi.meals.hedef-kcal') },
        t.empty ? { value:'—', label:yz('spi.meals.bugun-alinan-veri-yok') } : { value:U.fmtNum(Math.round(t.kcal)), label:yz('spi.meals.bugun-alinan') },
        t.empty ? { value:'—', label:yz('spi.meals.protein-veri-yok') } : { value:Math.round(t.protein), unit:'g', label:'protein' },
      ];
    },
    subtitle(){
      const t = SP.Nutri.dayTotals(shownDate());
      const tg = SP.Nutri.targets();
      if(t.empty) return U.fmtDate(shownDate()) + ' · kayıt yok';
      return Math.round(t.kcal) + ' kcal · protein ' + Math.round(t.protein) + ' g'
        + (tg.ok ? ' / ' + tg.protein.min + ' g' : '');
    },
    actions(){
      return String(html`${K.Button({ label:yz('spi.meals.ogun-ekle'), icon:'plus', size:'sm',
        act:'meal-tab', data:{ 'data-tab':'gunluk' } })}
        ${K.Button({ label:yz('spi.meals.oneriyi-ac'), size:'sm', act:'meal-tab', data:{ 'data-tab':'oneri' } })}`);
    },
    render, afterRender, handle, change, guessSlot,
  };
})();
