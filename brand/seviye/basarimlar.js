/* BAŞARIM KATALOĞU — hangi rozet neyle kazanılır.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/basarimlar.js`; `python3 tools/seviye.py --yay`
   ile AYS/SPİ/ESP'nin `src/js/data/` klasörüne kopyalanır. Kopyaları
   elle düzenleme — bir sonraki yayında kaybolur.

   ------------------------------------------------------------------
   ROZET RÜTBE DEĞİLDİR

   Rütbe (`kademeler.js`) TEK bir merdivendir: XP birikir, basamak
   geçilir, geri dönüş yoktur. Rozet ise BİRBİRİNDEN BAĞIMSIZ eşiklerdir
   ve farklı şeyleri ölçer: kaç saat, kaç gün, kaç görev, en uzun seri.
   İkisi karışmasın diye rozetin XP ile hiçbir ilişkisi kurulmadı —
   XP'yi çoğaltmaz, hızlandırmaz, eşiğini değiştirmez.

   Doktrin aynen geçerli (AGENTS.md §1.6): ROZET DE HİÇBİR KARARI
   VERMEZ. Ne plan, ne reçete, ne uyarı ona bakar. Rozet, kullanıcının
   kendi emeğinin biriktiğini görmesidir.

   ------------------------------------------------------------------
   DÖRT ÖLÇÜ TÜRÜ — ve neden dördü ayrı

   `toplam`   ömür boyu biriken sayı (100 gün, 500 saat, 1000 görev).
              Asla düşmez… ama VERİ SİLİNİRSE düşer, çünkü sayım
              veriden türetilir. Rozet geri alınmaz, sayaç düşer.
   `gunluk`   BİR GÜNE ait en iyi değer (o gün 7 saat odak). Kümülatif
              değildir; dün 7 saat yaptıysan bugün 1 saat yapman onu
              geri almaz — ama bugünün rozeti bugünün değeridir.
   `seri`     kesintisiz AY sayısı. Bir ay «etkin» sayılır: o ayda en az
              bir gün kayıt var. Ay atlanırsa seri sıfırlanır.
   `ozel`     kendi kuralı olan (kusursuz gün/hafta/ay).

   ------------------------------------------------------------------
   «KUSURSUZ» NE DEMEK — ve neden tavan değil

   Kusursuz gün, o modülün GÜNLÜK BEKLENEN işlerinin hepsinin yapıldığı
   gündür. Günlük beklenen işler katalogda `gunluk:true` ile işaretlidir
   (`kademeler.js`, `XP_ETKINLIK`).

   «XP tavanının dolması» denenmedi ve bilerek: tavan bir ÜST SINIRDIR,
   hedef değil. «Bugün 420 XP'ye ulaş» demek, XP'yi bir hedefe çevirmek
   ve §1.6'yı kırmak olurdu. «Bugün beklenen işleri yaptın» ise bir
   gözlemdir.

   Nadir işler (deneme, tahlil, yazı taslağı) kusursuzluğa GİRMEZ: her
   gün deneme çözmek beklenmez, beklenmeyen bir şeyi kusursuzluk şartı
   yapmak rozeti ulaşılamaz değil ANLAMSIZ yapardı.

   ------------------------------------------------------------------
   DOSYA ADI

   `basarim-<aile>-<eşik>.webp`. Eşik sayıysa sayı, değilse kendisi:
       gorev 500   → basarim-gorev-500.webp
       odak 7      → basarim-odak-7.webp
       kusursuz ay → basarim-kusursuz-ay.webp
   Kural tek satırdır (`MEDYA_ADI`, aşağıda) ve başka yerde tekrar
   edilmez. */

window.LIFEOS = window.LIFEOS || {};

/* Kataloğun sürümü. Eşik ya da aile DEĞİŞİRSE artar ve motor
   kazanımları yeniden türetir — defterde yazılı «kazandım» kaydı
   katalogla çelişemez. */
LIFEOS.BASARIM_SURUM = 1;

LIFEOS.BASARIM_AILELER = [
  {
    id:'gorev', ad:'Görev', birim:'görev', olcu:'toplam',
    ozet:'Tamamladığın işlerin toplamı',
    aciklama:'Biten her kayıt bir görevdir: bir blok, bir antrenman, '
      + 'bir kart, bir not. Bitmeyen sayılmaz.',
    esikler:[100, 250, 500, 1000, 2500, 5000],
  },
  {
    id:'gun', ad:'Gün', birim:'gün', olcu:'toplam',
    ozet:'Kayıt girdiğin gün sayısı',
    aciklama:'O güne dair BİR ŞEY girdiysen o gün sayılır. '
      + 'Girilmemiş gün sıfır değil, hiç sayılmaz.',
    esikler:[25, 50, 100, 250, 500, 1000],
  },
  {
    id:'saat', ad:'Saat', birim:'saat', olcu:'toplam',
    ozet:'Ölçülmüş çalışma saatinin toplamı',
    aciklama:'Yalnız SÜRESİ GİRİLMİŞ kayıtlar sayılır. Süresi boş '
      + 'bırakılan bir kayıt «0 dakika» değil, «veri yok»tur.',
    esikler:[100, 250, 500, 1000, 2500, 5000],
  },
  {
    id:'odak', ad:'Odak', birim:'saat', olcu:'gunluk',
    ozet:'BİR GÜNDE ölçülen en uzun çalışma',
    aciklama:'Kümülatif değildir: o günün toplam ölçülmüş süresi. '
      + 'Bir kez kazanılan rozet defterde kalır.',
    esikler:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    id:'istikrar', ad:'İstikrar', birim:'ay', olcu:'seri',
    ozet:'Kesintisiz sürdürdüğün ay sayısı',
    aciklama:'Bir ay, içinde en az bir kayıtlı gün varsa etkindir. '
      + 'Boş geçen ay seriyi sıfırlar.',
    esikler:[1, 3, 6, 9, 12, 24],
  },
  {
    id:'kusursuz', ad:'Kusursuz', birim:null, olcu:'ozel',
    ozet:'Beklenen her işin yapıldığı gün, hafta ve ay',
    aciklama:'Günlük beklenen işlerin HEPSİ yapıldıysa gün kusursuzdur. '
      + 'Yedi kusursuz gün üst üste bir hafta, ayın bütün günleri bir ay eder.',
    esikler:['gun', 'hafta', 'ay'],
    etiketler:{ gun:'Kusursuz gün', hafta:'Kusursuz hafta', ay:'Kusursuz ay' },
  },
];

/* MÜHÜRLER — kazanılmaz, BASILIR.

   Rozet bir eşiği geçmenin kaydıdır; mühür bir BELGENİN damgasıdır.
   Aynı listede durmamalarının sebebi bu: birini kazanırsın, öbürünü
   bir rapor taşır. Mühürün eşiği, sayacı, tarihi yoktur. */
LIFEOS.MUHURLER = [
  { id:'egitim',         ad:'Eğitim',          mod:'ays',
    nerede:'AYS dönemsel raporu' },
  { id:'saglik',         ad:'Sağlık',          mod:'spi',
    nerede:'SPİ dönemsel raporu' },
  { id:'entelektuellik', ad:'Entelektüellik',  mod:'esp',
    nerede:'ESP dönemsel raporu' },
  { id:'yonetim',        ad:'Yönetim',         mod:'hkm',
    nerede:'HKM günlük ve dönemsel brifingi' },
  { id:'yonetici',       ad:'Yönetici',        mod:'hkm',
    nerede:'HKM karar ve teklif belgeleri' },
];

/* ONUR — tüm alanların zirvesi. Tek tanedir ve tek yerde durur: HKM
   profili. Bir modülün kendi başına veremeyeceği rozettir, çünkü
   tanımı gereği DÖRDÜNE birden bakar (AGENTS.md §1.4: üç arayüz
   birbirini görmez, toplamı yalnız HKM alır). */
LIFEOS.ONUR = {
  id:'usta', ad:'Sistem Ustası',
  slogan:'Daha iyi bir sen, mümkün.',
  ozet:'LifeOS’un bütün alanlarında istikrarlı ilerleme',
};

/* Dosya adı — TEK kural. `tools/rutbe.py` de aynı adı üretir; ikisi
   ayrışırsa görsel bulunamaz, bu yüzden bir test ikisini karşılaştırır. */
LIFEOS.BASARIM_MEDYA_ADI = function(aile, esik){
  return 'basarim-' + String(aile) + '-' + String(esik);
};

/* Aile ve rozet arama — üç arayüz de bunu kullanır, kendi döngüsünü
   yazmaz (yazılan döngü bir gün diğerinden ayrışır). */
LIFEOS.BASARIM_AILE_ILE = function(id){
  var a = LIFEOS.BASARIM_AILELER;
  for(var i = 0; i < a.length; i++) if(a[i].id === id) return a[i];
  return null;
};

/* Bütün rozetlerin düz listesi — merdiven gibi, sırayla.
   `kod` defterde yazılı olan anahtardır ve ASLA değişmemeli: değişirse
   kullanıcının kazandığı rozet sahipsiz kalır. */
LIFEOS.ROZETLER = (function(){
  var out = [];
  LIFEOS.BASARIM_AILELER.forEach(function(a){
    a.esikler.forEach(function(e, i){
      out.push({
        kod:a.id + '-' + e,
        aile:a.id, aileAd:a.ad, esik:e, sira:i,
        birim:a.birim, olcu:a.olcu,
        /* İKİ AD, İKİ YER. `ad` kutlamada ve ipucunda geçer ve ailesini
           söylemek zorundadır («Saat 500 saat» değil «500 saat» dersek
           kutlamada neyin rozeti olduğu kaybolur). `kisaAd` ise rozet
           ızgarasında ailenin BAŞLIĞI zaten üstte dururken kullanılır;
           orada aileyi tekrar yazmak «Görev 100 görev» okutuyordu. */
        ad:(a.etiketler && a.etiketler[e])
          || (a.ad + ' ' + e + (a.birim ? ' ' + a.birim : '')),
        kisaAd:(a.etiketler && a.etiketler[e])
          || (e + (a.birim ? ' ' + a.birim : '')),
        /* Rozetin üstünde yazan eşik. Sayıysa sayı, değilse ailenin
           kendi etiketi — `AY` diye bağırmak yerine «Ay». */
        etiket:(a.etiketler && a.etiketler[e])
          ? String(a.etiketler[e]).replace(/^Kusursuz\s*/, '')
          : String(e),
        gorsel:LIFEOS.BASARIM_MEDYA_ADI(a.id, e),
      });
    });
  });
  return out;
})();
