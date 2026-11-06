/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ogrenmotor-ekran.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ÖĞRENME MOTORU EKRANI — konu seçimi, adım adım seans, kendi konun (AYS, SPİ, ESP).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ogrenmotor-ekran.js`; `python3 tools/ortak.py --yay` ile üç
   arayüze BİREBİR kopyalanır. Biçimi `ogrenmotor.css`; kural `ogrenmotor.js`'te.
   ==================================================================

   Sözler:
   1. EKRAN KARAR VERMEZ. Sıra, aşama ve sonraki adım çekirdekten okunur.
   2. YERİNDE ÇİZER. Tıklama yalnız kendi kökünü yeniden çizer, modülün ekranı
      baştan çizilmez; yazılan metin kaybolmaz, odak yeni adımın başlığına gider.
   3. AZ METİN (§1.10). Teknik adı başlıkta, bir cümle yönerge; ilerleme noktayla,
      sonuç tik sayacıyla çizilir. Süs yok.
   4. HER ADIM GEÇİLEBİLİR. Yazmak zorunlu değildir; yalnız cevap verilen soru kanıt olur.
   5. CEVAP ERKEN GÖRÜNMEZ (motor söz 9). Yanlıştan sonra merdivenin bir basamağı açılır;
      doğru şık yalnız «çözüm» basamağında ya da kişi bulunca gösterilir. */
window.LIFEOS.PARCA.yazilar({
  'ortak.om.baslik':'Öğrenme',
  'ortak.om.tekrar-var':'{n} konu tekrar bekliyor',
  'ortak.om.tekrar-basla':'Karışık tekrara başla',
  'ortak.om.siradaki':'Sıradaki konu: {ad}',
  'ortak.om.basla':'Öğrenmeye başla',
  'ortak.om.tekrar-yok':'Bugün tekrar yok. Yeni bir konu seçebilirsin.',
  'ortak.om.olculdu':'{n} / {t} konu ölçüldü',
  'ortak.om.hata-turleri':'Hataların nereden geliyor?',
  'ortak.om.yeni-konu':'Sistemde olmayan bir konu öğren',
  'ortak.om.yeni-ad':'Konu adı',
  'ortak.om.yeni-metin':'Varsa metni yapıştır (kitap, not, makale)',
  'ortak.om.yeni-ac':'Konuyu aç',
  'ortak.om.sistemde-var':'Bu konu sistemde var: {ad}',
  'ortak.om.sistemde-ac':'Onu aç',
  'ortak.om.yine-de':'Yine de ayrı konu aç',
  'ortak.om.konular':'Konular',
  'ortak.om.geri':'‹ Geri',
  'ortak.om.bu-konunun-sonunda':'Bu konunun sonunda',
  'ortak.om.once-bak':'Bu konu şunlara dayanıyor; kaydı henüz oturmadı:',
  'ortak.om.bicim':'Anlatım biçimi',
  'ortak.om.bicim-parca':'Parça parça',
  'ortak.om.bicim-ornek':'Önce örnek',
  'ortak.om.bicim-ozet':'Kısa özet',
  'ortak.om.ogren':'Adım adım öğren',
  'ortak.om.tekrar-et':'Tekrar et',
  'ortak.om.sonraki-tekrar':'Sıradaki tekrar: {g}',
  'ortak.om.metin-yok':'Bu konunun metni yok. Bir kaynaktan oku, sonra metni buraya yapıştır; soruları kod çıkarır.',
  'ortak.om.kaynak-ac':'Kaynak ara (Vikipedi)',
  'ortak.om.metin-yapistir':'Metin',
  'ortak.om.metni-ekle':'Metni konuya çevir',
  'ortak.om.model-taslak':'Yerel modelden taslak iste',
  'ortak.om.model-taslak-not':'Taslak modelindir ve doğrulanmamıştır; bir kaynakla karşılaştır.',
  'ortak.om.bekliyor':'Model yazıyor…',
  'ortak.om.model-yok':'Model şu an yanıt vermedi. Motor onsuz da çalışır.',
  'ortak.om.model-sayi':'Modelin cevabında metinde olmayan bir sayı vardı; gösterilmedi.',
  'ortak.om.model-kisa':'Modelin cevabı kullanılamayacak kadar kısaydı.',
  'ortak.om.soru-ekle':'Kendi sorunu ekle',
  'ortak.om.soru-metni':'Soru',
  'ortak.om.soru-yaniti':'Cevabı',
  'ortak.om.ekle':'Ekle',
  'ortak.om.sil':'Konuyu sil',
  'ortak.om.sil-emin':'Kayıtlarıyla silinsin',
  'ortak.om.vazgec':'Vazgeç',
  'ortak.om.adim':'Adım {i} / {n}',
  'ortak.om.tahmin':'Önce tahmin et',
  'ortak.om.tahmin-not':'Ölçüm değil. Henüz anlatılmadı; tahmin etmek konuyu daha dikkatli okutur.',
  'ortak.om.bilmiyorum':'Bilmiyorum',
  'ortak.om.tahmin-yanit':'Doğrusu: {c}. Anlatımda nedenini göreceksin.',
  'ortak.om.anladim':'Anladım',
  'ortak.om.anlamadim':'Anlamadım',
  'ortak.om.dinle':'Dinle',
  'ortak.om.durdur':'Durdur',
  'ortak.om.dikkat':'Dikkat:',
  'ortak.om.ornek':'Örnek',
  'ortak.om.sik-hata':'Sık yapılan hata',
  'ortak.om.onkosul-bak':'Önce şuna bak',
  'ortak.om.baska-anlat':'Başka türlü anlat',
  'ortak.om.tur-sade':'Daha sade',
  'ortak.om.tur-benzet':'Benzetmeyle',
  'ortak.om.tur-ornek':'Örnekle',
  'ortak.om.tur-sokrat':'Sorarak',
  'ortak.om.yavas':'Yavaş oku: her cümleden sonra «bu ne demek?» diye sor. Takıldığın kelimeyi aşağıya yaz; sonraki adımda kendi cümlenle dene.',
  'ortak.om.acikla':'Kendi cümlenle',
  'ortak.om.acikla-kendi':'Az önce okuduğunu bakmadan, kendi cümlenle söyle.',
  'ortak.om.acikla-neden':'Bu neden böyle? Bir cümleyle gerekçesini yaz.',
  'ortak.om.acikla-benzet':'Bunu bildiğin neye benzetirsin?',
  'ortak.om.yazi-etiket':'Yazın',
  'ortak.om.devam':'Devam',
  'ortak.om.gec':'Geç',
  'ortak.om.ornek-baslik':'Çözümlü örnek',
  'ortak.om.ornek-not':'Önce kendin dene, sonra adımları tek tek aç.',
  'ortak.om.sonraki-adim':'Sonraki adım',
  'ortak.om.yokla':'Hatırla',
  'ortak.om.yokla-karisik':'Karışık tekrar',
  'ortak.om.ipucu':'İpucu',
  'ortak.om.ne-kadar-emin':'Ne kadar eminsin?',
  'ortak.om.emin':'Eminim',
  'ortak.om.kararsiz':'Kararsızım',
  'ortak.om.tahmin-g':'Tahmin',
  'ortak.om.dogru':'Doğru',
  'ortak.om.yanlis':'Yanlış',
  'ortak.om.karsilastir':'Karşılaştır',
  'ortak.om.senin':'Senin cevabın:',
  'ortak.om.beklenen':'Beklenen:',
  'ortak.om.tuttu':'Tuttu',
  'ortak.om.tutmadi':'Tutmadı',
  'ortak.om.oz':'Öz değerlendirme; eksik gerekçe «tutmadı» sayılır.',
  'ortak.om.emin-yanlis':'Emin olup yanıldın. Bu hata iyi düzelir ama geri dönebilir; yeniden sorulacak.',
  'ortak.om.onar':'Hatayı onar',
  'ortak.om.onar-soru':'Neden yanıldın?',
  'ortak.om.tur-kavram':'Kavramı karıştırdım',
  'ortak.om.tur-islem':'İşlemde kaydım',
  'ortak.om.tur-dikkat':'Dikkatsizlik',
  'ortak.om.tur-bilmiyor':'Bilmiyordum',
  'ortak.om.oneri-tur':'Kayda göre olası: {ad}',
  'ortak.om.onar-kavram':'Kuralı bir daha oku ve soruya uygula.',
  'ortak.om.onar-islem':'Çözüme bakmadan adımları kendin yeniden yaz.',
  'ortak.om.onar-dikkat':'Sorunun kökünde kaçırdığın kelime neydi? Yaz.',
  'ortak.om.onar-bilmiyor':'İlgili parça burada; bu kez bilerek oku.',
  'ortak.om.anlat':'Başkasına anlat',
  'ortak.om.anlat-not':'Konuyu hiç bilmeyen birine yazıyormuş gibi, metne bakmadan birkaç cümleyle anlat.',
  'ortak.om.anlat-sonuc':'Geçen terimler',
  'ortak.om.anlat-eksik':'Anlatımında geçmeyenler:',
  'ortak.om.anlat-tam':'Bütün terimler geçti.',
  'ortak.om.anlat-sinir':'Kod yalnız terimlere bakar, anlamı yargılamaz. Eksikleri ekleyip yeniden anlatabilirsin.',
  'ortak.om.aktar':'Yeni bir durumda kullan',
  'ortak.om.niyet':'Nerede kullanacaksın?',
  'ortak.om.niyet-not':'«… olduğunda … yapacağım» diye tek cümle yaz. Tekrarda sana geri gelir.',
  'ortak.om.bosalt':'Aklında ne kaldı?',
  'ortak.om.bosalt-not':'Bakmadan, aklında kalan her şeyi yaz.',
  'ortak.om.bosalt-ilk':'Ne biliyorsun?',
  'ortak.om.bosalt-ilk-not':'Bu konu hakkında bildiklerini yaz; yanlış olabilir, sorun değil.',
  'ortak.om.gecen-sefer':'Geçen sefer böyle demiştin:',
  'ortak.om.bitir':'Bugünlük bitti',
  'ortak.om.sonuc-etiket':'Doğru',
  'ortak.om.sonuc-yok':'Bu seansta soru cevaplanmadı; kalıcılık kaydı değişmedi.',
  'ortak.om.kapat':'Konulara dön',
  'ortak.om.bugun-tekrar':'Öğrenme: {n} konu tekrar bekliyor',
  'ortak.om.anlatimdan':'Adım adım öğren',
  'ortak.om.derin':'Derinleş',
  'ortak.om.sezgi':'Önce sezgi',
  'ortak.om.dene':'Kendin dene',
  'ortak.om.dogru-ipucu':'Doğru. İpucuyla bulduğun için kalıcılığa sayılmaz; ilk cevabın sayıldı.',
  'ortak.om.cozum-baslik':'Çözüm',
  'ortak.om.tekrar-dene':'Bir daha dene: işaretli şıklar kapandı.',
  'ortak.om.ip-sonraki':'Bir ipucu daha',
  'ortak.om.ip-kodlama':'Kodlama',
  'ortak.om.ip-anlatim':'Anlatımdan',
  'ortak.om.ip-eleme':'Bir yanlış şık kapandı.',
  'ortak.om.kod-kendi':'senin kodlaman',
  'ortak.om.kod-internet':'internetten · doğrulanmadı',
  'ortak.om.kod-bul':'İnternette kodlama ara',
  'ortak.om.kod-ariyor':'Aranıyor…',
  'ortak.om.kod-ekle':'Kodlamalarıma ekle',
  'ortak.om.kod-yok':'Kaynaklı ve cevabı vermeyen bir kodlama bulunamadı.',
  'ortak.om.kod-baglanti':'Arama için HKM açık olmalı.',
  'ortak.om.kod-kaynak':'Kaynak',
  'ortak.om.kod-yaz':'Kendi kodlamanı yaz (kısaltma, kafiye, benzetme)',
  'ortak.om.kod-kaydet':'Kaydet',
  'ortak.om.kod-kaydedildi':'Kaydedildi; bu konuda ipucu olarak gelir.',
  'ortak.om.tempo':'{sn} sn · {ad} temposu {hedef} sn (sistem ayarı)',
  'ortak.om.kartlar':'Kartlar',
  'ortak.om.gorev-sirala':'Sırayı kur',
  'ortak.om.gorev-efsane':'Doğru mu?',
  'ortak.om.gorev-dikte':'Duy ve yaz',
  'ortak.om.gorev-kaynak':'Kaynağı sorgula',
  'ortak.om.sira-not':'Parçalara doğru sırayla dokun.',
  'ortak.om.sira-geri':'Son seçimi geri al',
  'ortak.om.sira-kontrol':'Kontrol et',
  'ortak.om.sira-yeniden':'Yeniden dene',
  'ortak.om.sira-dogru':'Doğru sıra',
  'ortak.om.sira-tam':'Sıra doğru.',
  'ortak.om.sira-yanlis':'İşaretli yerler yanlış. Bir kez daha dene.',
  'ortak.om.efsane-dogru':'Doğru',
  'ortak.om.efsane-yanlis':'Yanlış',
  'ortak.om.efsane-isabet':'İsabetli.',
  'ortak.om.efsane-iskala':'Tersini düşündün.',
  'ortak.om.dikte-not':'Dinle, duyduğunu yaz, sonra karşılaştır.',
  'ortak.om.dikte-sonuc':'Kelimelerin yüzde {y}’i tuttu.',
  'ortak.om.kaynak-sorular':'Kim yazdı, olayın içinde miydi? Ne zaman yazdı? Neden ve kimin için yazdı?',
});

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.OMEKRAN = (function(){
  'use strict';
  const L = () => window.LIFEOS || {};
  const M = () => L().OGRENMOTOR;
  const yazi = (id, d) => L().PARCA.yazi(id, d);
  const kac = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const dizi = v => (Array.isArray(v) ? v : (v ? [v] : []));
  const HARF = 'ABCDE';
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const tarih = iso => { const p = String(iso).split('-').map(Number); return p[2] + ' ' + AYLAR[p[1] - 1]; };

  /* kip: ana | konu | seans. Seans yalnız bellekte; verilen cevaplar anında kayda geçer. */
  let E = { kip:'ana', id:null, s:null, bicim:'parca', yeni:{ ad:'', metin:'', onay:false }, ekle:{ metin:'', soru:'', yanit:'' }, sil:false, not:'', bekle:false, kodYaz:'', kodNot:'' };
  let konusan = null;

  function metin(s){
    const a = M().ayar();
    return a && a.metin ? a.metin(String(s == null ? '' : s)) : kac(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  const para = m => dizi(m).map(x => '<p>' + metin(x) + '</p>').join('');
  const dugme = (v, et, ton, ek) => '<button type="button" class="btn ' + (ton || 'btn--ghost') + '" data-om="' + kac(v) + '"' + (ek || '') + '>' + kac(et) + '</button>';
  const birinci = (v, et) => dugme(v, et, 'btn--primary');
  const alan = (id, etiket, deger, ek) => '<label class="field om-alan"><span>' + kac(etiket) + '</span>'
    + '<textarea rows="' + ((ek && ek.satir) || 3) + '" data-om-yaz="' + kac(id) + '"' + '>' + kac(deger || '') + '</textarea></label>';
  const satirAlan = (id, etiket, deger) => '<label class="field om-alan"><span>' + kac(etiket) + '</span><input type="text" data-om-yaz="' + kac(id) + '" value="' + kac(deger || '') + '"></label>';

  function asamaPill(a){
    if(!a || a.id === 'yok') return '';
    return '<span class="om-asama' + (a.kritik ? ' is-kritik' : '') + '">' + kac(a.ad) + '</span>';
  }

  /* -------------------------------------------------------------- ana */

  function anaHtml(){
    const o = M().oneri(), h = M().harita(), P = L().PANO, U = L().USTA;
    const bas = o.tur === 'tekrar'
      ? '<p class="om-oneri">' + kac(yazi('ortak.om.tekrar-var', { n:o.n })) + '</p>' + birinci('karma', yazi('ortak.om.tekrar-basla'))
      : o.tur === 'yeni'
        ? '<p class="om-oneri">' + kac(yazi('ortak.om.siradaki', { ad:o.ad })) + '</p>' + birinci('konu:' + o.konu, yazi('ortak.om.basla'))
        : '<p class="om-oneri">' + kac(yazi('ortak.om.tekrar-yok')) + '</p>';
    const harita = h.olculen && P && P.yigin
      ? '<div class="om-blok">' + P.yigin({ parcalar:['ogreniyor', 'tutuyor', 'kalici', 'saglam'].map(id => ({ ad:U.adi(id), deger:h.sayi[id], metin:String(h.sayi[id]) })) })
        + '<p class="om-kucuk">' + kac(yazi('ortak.om.olculdu', { n:h.olculen, t:h.toplam })) + '</p></div>' : '';
    const ho = M().hataOzet();
    const hata = ho && P && P.yigin
      ? '<div class="om-blok"><h3 class="om-ara-baslik">' + kac(yazi('ortak.om.hata-turleri')) + '</h3>' + P.yigin({ parcalar:M().TURLER.map(t => ({ ad:yazi('ortak.om.tur-' + t), deger:ho[t], metin:String(ho[t]) })) }) + '</div>' : '';
    return '<div class="om-blok om-bas">' + bas + '</div>' + harita + hata + yeniKonuHtml() + listeHtml();
  }

  function yeniKonuHtml(){
    const y = E.yeni;
    const bulunan = y.onay ? M().ara(y.ad) : null;
    return '<details class="om-blok om-yeni"' + (y.ad || y.metin ? ' open' : '') + '><summary>' + kac(yazi('ortak.om.yeni-konu')) + '</summary>'
      + satirAlan('yeni-ad', yazi('ortak.om.yeni-ad'), y.ad)
      + alan('yeni-metin', yazi('ortak.om.yeni-metin'), y.metin, { satir:4 })
      + (bulunan
        ? '<p class="om-oneri">' + kac(yazi('ortak.om.sistemde-var', { ad:bulunan.ad })) + '</p><div class="om-dugmeler">'
          + birinci('konu:' + bulunan.id, yazi('ortak.om.sistemde-ac')) + dugme('yeni-zorla', yazi('ortak.om.yine-de')) + '</div>'
        : '<div class="om-dugmeler">' + birinci('yeni-ac', yazi('ortak.om.yeni-ac')) + '</div>')
      + '</details>';
  }

  function listeHtml(){
    const gruplar = [], g = {};
    M().konular().forEach(k => {
      const ad = k.grupAd || k.grup || '';
      if(!g[ad]){ g[ad] = []; gruplar.push(ad); }
      g[ad].push(k);
    });
    return '<section class="om-blok"><h2 class="om-ara-baslik">' + kac(yazi('ortak.om.konular')) + '</h2>' + gruplar.map(ad =>
      '<details class="om-grup"><summary>' + kac(ad) + ' <span class="om-kucuk">' + g[ad].length + '</span></summary><ul class="rehber__konular">'
      + g[ad].map(k => '<li><button type="button" class="rehber__satir" data-om="konu:' + kac(k.id) + '"><span class="rehber__satir-ad">' + kac(k.ad) + '</span>'
        + '<span class="rehber__satir-yan">' + asamaPill(M().asama(k.id)) + '</span></button></li>').join('')
      + '</ul></details>').join('') + '</section>';
  }

  /* -------------------------------------------------------------- konu kapağı */

  function konuHtml(){
    const k = M().konu(E.id);
    if(!k) return anaHtml();
    const a = M().asama(k.id);
    const on = M().onKosullar(k);
    const calisir = k.parcalar.length || k.sorular.length || k.acik.length;
    const bic = ['parca', 'ornek', 'ozet'].filter(b => b !== 'ornek' || k.ornekler.length);
    return ustHtml(k.ad, k.etiket, 'ana')
      + '<div class="om-blok">' + asamaPill(a)
      + (a.sonraki ? '<p class="om-kucuk">' + kac(yazi('ortak.om.sonraki-tekrar', { g:tarih(a.sonraki) })) + '</p>' : '')
      + (k.giris ? '<p>' + metin(k.giris) + '</p>' : '')
      + (k.kazanim.length ? '<h3 class="om-ara-baslik">' + kac(yazi('ortak.om.bu-konunun-sonunda')) + '</h3><ul class="om-liste">' + k.kazanim.map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' : '')
      + (on.length ? '<p class="om-kucuk">' + kac(yazi('ortak.om.once-bak')) + '</p><div class="om-dugmeler">' + on.map(x => dugme('konu:' + x.id, x.ad)).join('') + '</div>' : '')
      + '</div>'
      + (calisir && k.parcalar.length ? '<div class="om-blok"><h3 class="om-ara-baslik" id="om-bicim-ad">' + kac(yazi('ortak.om.bicim')) + '</h3><div class="om-dugmeler" role="group" aria-labelledby="om-bicim-ad">'
        + bic.map(b => dugme('bicim:' + b, yazi('ortak.om.bicim-' + b), E.bicim === b ? 'btn--primary' : 'btn--ghost', ' aria-pressed="' + (E.bicim === b) + '"')).join('') + '</div></div>' : '')
      + (calisir ? '<div class="om-dugmeler om-blok">' + birinci('ogren', yazi('ortak.om.ogren'))
        + (a.id !== 'yok' && (k.sorular.length + k.acik.length) ? dugme('tekrar', yazi('ortak.om.tekrar-et')) : '')
        + dugme('derin', yazi('ortak.om.derin')) + '</div>' : '')
      + (k.atolye ? atolyeHtml(k) : '');
  }

  function atolyeHtml(k){
    const x = M().atolyeOf(k.id), e = E.ekle;
    const metinYok = !x.metin;
    return '<div class="om-blok">'
      + (metinYok ? '<p>' + kac(yazi('ortak.om.metin-yok')) + '</p><p><a class="btn btn--ghost" target="_blank" rel="noopener" href="' + kac(M().kaynakBul(k.ad)) + '">' + kac(yazi('ortak.om.kaynak-ac')) + '</a></p>' : '')
      + alan('ekle-metin', yazi('ortak.om.metin-yapistir'), e.metin, { satir:metinYok ? 6 : 3 })
      + '<div class="om-dugmeler">' + dugme('metin-ekle', yazi('ortak.om.metni-ekle'), metinYok ? 'btn--primary' : 'btn--ghost')
      + (M().modelVar() ? dugme('model-taslak', yazi(E.bekle ? 'ortak.om.bekliyor' : 'ortak.om.model-taslak'), null, E.bekle ? ' disabled' : '') : '') + '</div>'
      + (M().modelVar() ? '<p class="om-kucuk">' + kac(yazi('ortak.om.model-taslak-not')) + '</p>' : '')
      + (E.not ? '<p class="om-kucuk" role="status">' + kac(E.not) + '</p>' : '')
      + '</div><div class="om-blok"><h3 class="om-ara-baslik">' + kac(yazi('ortak.om.soru-ekle')) + '</h3>'
      + satirAlan('ekle-soru', yazi('ortak.om.soru-metni'), e.soru) + alan('ekle-yanit', yazi('ortak.om.soru-yaniti'), e.yanit, { satir:2 })
      + '<div class="om-dugmeler">' + dugme('soru-ekle', yazi('ortak.om.ekle')) + '</div></div>'
      + '<div class="om-dugmeler om-blok">' + (E.sil
        ? dugme('sil-evet', yazi('ortak.om.sil-emin'), 'btn--danger') + dugme('sil-hayir', yazi('ortak.om.vazgec'))
        : dugme('sil', yazi('ortak.om.sil'))) + '</div>';
  }

  function ustHtml(ad, etiket, geri){
    return '<p class="om-ust"><button type="button" class="rehber__geri" data-om="' + kac(geri) + '">' + kac(yazi('ortak.om.geri')) + '</button>'
      + '<span class="om-ust__ad">' + kac(ad || '') + '</span>' + (etiket ? '<span class="om-kucuk">' + kac(etiket) + '</span>' : '') + '</p>';
  }

  /* -------------------------------------------------------------- seans */

  function noktalar(s){
    const a = s.adimlar, n = a.length;
    let h = '';
    for(let i = 0; i < n; i++) h += '<i class="kavrat-nokta' + (i <= s.i ? ' is-dolu' : '') + '"></i>';
    return '<div class="om-noktalar" role="img" aria-label="' + kac(yazi('ortak.om.adim', { i:s.i + 1, n })) + '">' + h + '</div>';
  }
  function baslikHtml(id){ return '<h2 class="om-adim" tabindex="-1" data-om-odak>' + kac(yazi(id)) + '</h2>'; }
  const devamD = () => '<div class="om-dugmeler">' + birinci('devam', yazi('ortak.om.devam')) + '</div>';

  /* Seçeneğin metni (işaretler açılır); cevaplanınca doğru ve seçilen ayrılır. */
  function secenekler(q, a, kapali){
    const denenen = a.denenen || [], elenen = a.elenen || [];
    return '<div class="om-secenekler" role="group">' + q.sec.map((x, i) => {
      const h = HARF[i], secili = a.sec === h, cevap = a.bitti;
      const yanlis = denenen.indexOf(h) >= 0 || (cevap && secili && h !== q.dogru), elendi = elenen.indexOf(h) >= 0;
      const dogruGoster = cevap && h === q.dogru;
      const sinif = 'om-sec' + (secili ? ' is-secili' : '') + (dogruGoster ? ' is-dogru' : '') + (yanlis ? ' is-yanlis' : '') + (elendi ? ' is-elendi' : '');
      const isaret = dogruGoster ? ' <span class="om-sec__isaret">✓</span>' : yanlis ? ' <span class="om-sec__isaret">✗</span>' : '';
      return '<button type="button" class="' + sinif + '" data-om="sec:' + h + '" aria-pressed="' + secili + '"' + (cevap || kapali || yanlis || elendi ? ' disabled' : '') + '><b>' + h + '</b><span>' + metin(x) + isaret + '</span></button>';
    }).join('') + '</div>';
  }
  const soruMetni = q => '<div class="om-soru">' + para(q.soru) + (q.gorsel || '') + '</div>';
  const cozumHtml = q => (dizi(q.cozum).length ? '<ol class="om-liste om-cozum">' + q.cozum.map(x => '<li>' + metin(x) + '</li>').join('') + '</ol>' : '');

  function tahminHtml(a){
    const q = a.q;
    return baslikHtml('ortak.om.tahmin') + '<p class="om-kucuk">' + kac(yazi('ortak.om.tahmin-not')) + '</p>' + soruMetni(q) + secenekler(q, a)
      + (a.bitti ? '<p class="om-geri-bildirim">' + yaziMetin('ortak.om.tahmin-yanit', q.sec[HARF.indexOf(q.dogru)]) + '</p>' + devamD()
        : '<div class="om-dugmeler">' + dugme('tahmin-bos', yazi('ortak.om.bilmiyorum')) + '</div>');
  }
  /* {c} işaretli metin taşıyabilir; yazı kaçırılır, c metin() ile açılır. */
  function yaziMetin(id, c){ return kac(yazi(id, { c:'\u0001' })).replace('\u0001', metin(c)); }

  /* Açılan ipucu basamakları; cevabı yalnız «çözüm» basamağı verir. */
  function ipucuHtml(a, k){
    const l = (a.ipler || []).slice(0, a.ip || 0).filter(x => x.tur !== 'cozum');
    if(!l.length) return '';
    return '<div class="om-destek om-ipucu" role="status">' + l.map(x => {
      if(x.tur === 'soru') return '<p>' + metin(x.metin) + '</p>';
      if(x.tur === 'parca') return '<p><b>' + kac(yazi('ortak.om.ip-anlatim')) + ':</b> ' + metin(x.metin) + '</p>';
      if(x.tur === 'eleme') return '<p class="om-kucuk">' + kac(yazi('ortak.om.ip-eleme')) + '</p>';
      return kodlamaHtml(x, a);
    }).join('') + '</div>';
  }
  function kodlamaHtml(x, a){
    const et = y => (y.tur === 'kendi' ? yazi('ortak.om.kod-kendi') : y.tur === 'internet' ? yazi('ortak.om.kod-internet') : '');
    return '<div class="om-kodlama"><p class="om-ara-baslik">' + kac(yazi('ortak.om.ip-kodlama')) + '</p>'
      + x.liste.map(y => '<p>' + metin(y.metin) + (et(y) ? ' <span class="om-kucuk">· ' + kac(et(y)) + '</span>' : '')
        + (y.kaynak ? ' <a class="om-kucuk" href="' + kac(y.kaynak) + '" target="_blank" rel="noopener noreferrer">' + kac(yazi('ortak.om.kod-kaynak')) + '</a>' : '') + '</p>').join('')
      + (a.kodAday ? a.kodAday.map((y, i) => '<div class="om-aday"><p>' + kac(y.metin) + ' <span class="om-kucuk">· ' + kac(yazi('ortak.om.kod-internet')) + '</span> '
          + '<a class="om-kucuk" href="' + kac(y.url) + '" target="_blank" rel="noopener noreferrer">' + kac(y.baslik || yazi('ortak.om.kod-kaynak')) + '</a></p>'
          + (y.eklendi ? '' : '<div class="om-dugmeler">' + dugme('kod-ekle:' + i, yazi('ortak.om.kod-ekle')) + '</div>') + '</div>').join('') : '')
      + (x.ara && !a.kodAday ? '<div class="om-dugmeler">' + dugme('kod-bul', yazi(a.kodBekle ? 'ortak.om.kod-ariyor' : 'ortak.om.kod-bul'), null, a.kodBekle ? ' disabled' : '') + '</div>' : '')
      + (a.kodNot ? '<p class="om-kucuk" role="status">' + kac(a.kodNot) + '</p>' : '') + '</div>';
  }
  function tempoHtml(a, k){
    const t = M().ayar().tempo;
    let h = null;
    try{ h = t && k ? t(k.id) : null; }catch(e){ h = null; }
    return h && h.sn && a.sure ? '<p class="om-kucuk">' + kac(yazi('ortak.om.tempo', { sn:a.sure, ad:h.ad, hedef:h.sn })) + '</p>' : '';
  }
  function yoklaHtml(s, a){
    const q = a.q, k = M().konuOf(s, a);
    const baslik = baslikHtml(a.karisik ? 'ortak.om.yokla-karisik' : s.tur === 'ogren' ? 'ortak.om.dene' : 'ortak.om.yokla');
    if(!q.sec) return baslik + acikHtml(a, k);
    if(!a.bas) a.bas = Date.now();
    if(!a.bitti){
      const kalan = (a.ipler || []).length > (a.ip || 0);
      return baslik + soruMetni(q) + secenekler(q, a)
        + (a.kayit ? '<p class="om-geri-bildirim is-yanlis" role="status">' + kac(yazi('ortak.om.tekrar-dene')) + '</p>' : '')
        + ipucuHtml(a, k)
        + (a.sec && !a.kayit ? '<p class="om-ara-baslik" id="om-guven">' + kac(yazi('ortak.om.ne-kadar-emin')) + '</p><div class="om-dugmeler" role="group" aria-labelledby="om-guven">'
          + birinci('cevap:emin', yazi('ortak.om.emin')) + dugme('cevap:kararsiz', yazi('ortak.om.kararsiz')) + dugme('cevap:tahmin', yazi('ortak.om.tahmin-g')) + '</div>' : '')
        + '<div class="om-dugmeler">' + (!a.ipler || kalan ? dugme('ipucu', yazi(a.ip ? 'ortak.om.ip-sonraki' : 'ortak.om.ipucu')) : '')
        + (a.kayit ? '' : dugme('bos', yazi('ortak.om.bilmiyorum'))) + '</div>';
    }
    const ilk = a.isabet, sonra = !ilk && a.sec === q.dogru;
    return baslik + soruMetni(q) + secenekler(q, a)
      + '<p class="om-geri-bildirim ' + (ilk || sonra ? 'is-dogru' : 'is-yanlis') + '" role="status">'
      + kac(yazi(ilk ? 'ortak.om.dogru' : sonra ? 'ortak.om.dogru-ipucu' : 'ortak.om.cozum-baslik')) + (a.karisik && k ? ' · ' + kac(k.ad) : '') + '</p>'
      + tempoHtml(a, k) + ipucuHtml(a, k) + cozumHtml(q) + devamD();
  }

  /* Açık soru: önce üret, sonra karşılaştır, kararı kişi verir. Boş cevap «tutmadı». */
  function acikHtml(a, k){
    const q = a.q;
    if(!a.goster){
      return soruMetni(q) + alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi)
        + '<div class="om-dugmeler">' + birinci('karsilastir', yazi('ortak.om.karsilastir')) + dugme('bos-acik', yazi('ortak.om.bilmiyorum')) + '</div>';
    }
    return soruMetni(q)
      + (a.yazi ? '<p class="om-kucuk"><b>' + kac(yazi('ortak.om.senin')) + '</b> ' + kac(a.yazi) + '</p>' : '')
      + (q.yanit ? '<p><b>' + kac(yazi('ortak.om.beklenen')) + '</b> ' + metin(q.yanit) + '</p>' : '')
      + (dizi(q.olcut).length ? '<ul class="om-liste">' + q.olcut.map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' : '')
      + (a.bitti ? devamD() : '<p class="om-kucuk">' + kac(yazi('ortak.om.oz')) + '</p><div class="om-dugmeler">'
        + birinci('oz:1', yazi('ortak.om.tuttu')) + dugme('oz:0', yazi('ortak.om.tutmadi')) + '</div>')
;
  }

  function parcaHtml(s, a){
    const k = s.konu, p = k.parcalar[a.i], kv = L().KAVRAT;
    const ses = M().ayar().ses;
    let sesVar = false;
    try{ sesVar = !!(ses && ses.var() && kv); }catch(e){ sesVar = false; }
    const acik = konusan === s.i;
    return '<h2 class="om-adim" tabindex="-1" data-om-odak>' + metin(p.baslik || k.ad) + '</h2>'
      + (sesVar ? '<div class="om-dugmeler">' + dugme('dinle', (acik ? '■ ' : '▶ ') + yazi(acik ? 'ortak.om.durdur' : 'ortak.om.dinle'), null, ' aria-pressed="' + acik + '"') + '</div>' : '')
      + '<div class="om-metin">' + para(p.metin)
      + (kv && p.cizim ? kv.cizimHtml('om:' + k.id + ':' + a.i, p.cizim) : '')
      + (dizi(p.liste).length ? '<ul class="om-liste">' + p.liste.map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' : '')
      + (dizi(p.formul).length ? '<div class="rehber__formul">' + p.formul.map(x => '<div>' + metin(x) + '</div>').join('') + '</div>' : '')
      + (p.dikkat ? '<p class="rehber__dikkat"><b>' + kac(yazi('ortak.om.dikkat')) + '</b> ' + metin(p.dikkat) + '</p>' : '')
      + '</div>'
      + (a.destek ? destekHtml(k, p, a) : '')
      + '<div class="om-dugmeler">' + birinci('devam', yazi('ortak.om.anladim')) + (a.destek ? '' : dugme('anlamadim', yazi('ortak.om.anlamadim'))) + '</div>';
  }

  /* «Anlamadım» basamakları: örnek, sık hata, ön koşul; model bağlıysa başka anlatım. */
  function destekHtml(k, p, a){
    const ornek = p.ornek && p.ornek.soru ? p.ornek : k.ornekler[0];
    const on = M().onKosullar(k);
    const model = M().modelVar();
    const hic = !ornek && !k.hatalar.length && !on.length && !model;
    return '<div class="om-destek">'
      + (ornek ? '<h3 class="om-ara-baslik">' + kac(yazi('ortak.om.ornek')) + '</h3>' + para(ornek.soru) + (dizi(ornek.cozum).length ? '<ol class="om-liste">' + ornek.cozum.map(x => '<li>' + metin(x) + '</li>').join('') + '</ol>' : '') : '')
      + (k.hatalar.length ? '<h3 class="om-ara-baslik">' + kac(yazi('ortak.om.sik-hata')) + '</h3><ul class="om-liste">' + k.hatalar.slice(0, 3).map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' : '')
      + (on.length ? '<h3 class="om-ara-baslik">' + kac(yazi('ortak.om.onkosul-bak')) + '</h3><div class="om-dugmeler">' + on.map(x => dugme('konu:' + x.id, x.ad)).join('') + '</div>' : '')
      + (model ? '<h3 class="om-ara-baslik">' + kac(yazi('ortak.om.baska-anlat')) + '</h3><div class="om-dugmeler">'
        + ['sade', 'benzet', 'ornek', 'sokrat'].map(t => dugme('anlat-tur:' + t, yazi('ortak.om.tur-' + t), null, a.bekle ? ' disabled' : '')).join('') + '</div>' : '')
      + (a.bekle ? '<p class="om-kucuk" role="status">' + kac(yazi('ortak.om.bekliyor')) + '</p>' : '')
      + (a.model ? '<div class="om-model"><p class="om-kucuk">' + kac(a.model.etiket) + '</p>' + para(a.model.metin) + '</div>' : '')
      + (a.modelNot ? '<p class="om-kucuk" role="status">' + kac(a.modelNot) + '</p>' : '')
      + (hic ? '<p>' + kac(yazi('ortak.om.yavas')) + '</p>' : '')
      + '</div>';
  }

  function ozetHtml(s){
    const k = s.konu;
    const ozetler = k.akilda.length ? k.akilda : k.parcalar.map(p => M().cumleler(dizi(p.metin).join(' '))[0]).filter(Boolean);
    return baslikHtml('ortak.om.bicim-ozet') + (k.giris ? '<p>' + metin(k.giris) + '</p>' : '')
      + '<ul class="om-liste">' + ozetler.map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' + devamD();
  }

  function aciklaHtml(a){
    return baslikHtml('ortak.om.acikla') + '<p>' + kac(yazi('ortak.om.acikla-' + a.soru)) + '</p>' + alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi)
      + '<div class="om-dugmeler">' + birinci('devam', yazi('ortak.om.devam')) + '</div>';
  }

  function ornekHtml(a){
    const o = a.o, c = dizi(o.cozum), n = a.n || 0;
    return baslikHtml('ortak.om.ornek-baslik') + para(o.soru)
      + (c.length ? '<p class="om-kucuk">' + kac(yazi('ortak.om.ornek-not')) + '</p>' : '')
      + (n ? '<ol class="om-liste om-cozum">' + c.slice(0, n).map(x => '<li>' + metin(x) + '</li>').join('') + '</ol>' : '')
      + '<div class="om-dugmeler">' + (n < c.length ? birinci('ornek-ac', yazi('ortak.om.sonraki-adim')) + dugme('devam', yazi('ortak.om.gec')) : birinci('devam', yazi('ortak.om.devam'))) + '</div>';
  }

  function onarHtml(s, a){
    const q = a.q, k = M().konuOf(s, a);
    const g = q.sec ? L().OGRET && L().OGRET.teshis({ secilen:a.harf, dogru:q.dogru, secMetin:a.harf ? q.sec[HARF.indexOf(a.harf)] : '', dogruMetin:q.sec[HARF.indexOf(q.dogru)] }) : null;
    const pi = M().ilgiliParca(k, q), p = pi == null ? null : k.parcalar[pi];
    const icerik = a.tur;
    return baslikHtml('ortak.om.onar')
      + (a.guven === 'emin' ? '<p class="om-geri-bildirim is-yanlis">' + kac(yazi('ortak.om.emin-yanlis')) + '</p>' : '')
      + soruMetni(q)
      + (q.sec ? '<p><b>' + kac(yazi('ortak.om.dogru')) + ':</b> ' + metin(q.sec[HARF.indexOf(q.dogru)]) + '</p>' : (q.yanit ? '<p><b>' + kac(yazi('ortak.om.beklenen')) + '</b> ' + metin(q.yanit) + '</p>' : ''))
      + cozumHtml(q)
      + '<h3 class="om-ara-baslik" id="om-onar-ad">' + kac(yazi('ortak.om.onar-soru')) + '</h3>'
      + (g && g.tur && !a.tur ? '<p class="om-kucuk">' + kac(yazi('ortak.om.oneri-tur', { ad:g.ad })) + '</p>' : '')
      + '<div class="om-dugmeler" role="group" aria-labelledby="om-onar-ad">' + M().TURLER.map(t => dugme('hata:' + t, yazi('ortak.om.tur-' + t), a.tur === t ? 'btn--primary' : 'btn--ghost', ' aria-pressed="' + (a.tur === t) + '"')).join('') + '</div>'
      + (icerik ? '<div class="om-destek"><p>' + kac(yazi('ortak.om.onar-' + icerik)) + '</p>'
        + ((icerik === 'kavram' || icerik === 'bilmiyor') && p ? '<div class="om-metin"><h3 class="om-ara-baslik">' + metin(p.baslik || k.ad) + '</h3>' + para(p.metin) + '</div>' : '')
        + (icerik === 'kavram' && k.hatalar.length ? '<ul class="om-liste">' + k.hatalar.slice(0, 2).map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' : '')
        + (icerik === 'islem' || icerik === 'dikkat' ? alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi) : '')
        + '</div>' : '')
      + (a.tur ? devamD() : '<div class="om-dugmeler">' + dugme('devam', yazi('ortak.om.gec')) + '</div>');
  }

  /* Anlatma ve boşaltma aynı karşılaştırmayı kullanır: terimler geçti mi? */
  function kapsamHtml(s, a){
    const k = s.konu;
    if(!a.sonuc) return '';
    const r = a.sonuc, G = L().GRAFIK;
    return '<div class="om-destek">'
      + (G && G.tikHtml && r.toplam <= 12 ? G.tikHtml({ hedef:r.toplam, yapilan:r.gecen.length, etiket:yazi('ortak.om.anlat-sonuc') }) : '')
      + (r.gecmeyen.length ? '<p>' + kac(yazi('ortak.om.anlat-eksik')) + ' <b>' + kac(r.gecmeyen.join(', ')) + '</b></p>' : '<p>' + kac(yazi('ortak.om.anlat-tam')) + '</p>')
      + (k.akilda.length ? '<ul class="om-liste">' + k.akilda.map(x => '<li>' + metin(x) + '</li>').join('') + '</ul>' : '')
      + '<p class="om-kucuk">' + kac(yazi('ortak.om.anlat-sinir')) + '</p></div>';
  }
  function anlatHtml(s, a){
    return baslikHtml('ortak.om.anlat') + '<p class="om-kucuk">' + kac(yazi('ortak.om.anlat-not')) + '</p>' + alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi, { satir:5 })
      + '<div class="om-dugmeler">' + birinci('kapsam', yazi('ortak.om.karsilastir')) + dugme('devam', yazi(a.sonuc ? 'ortak.om.devam' : 'ortak.om.gec')) + '</div>' + kapsamHtml(s, a);
  }
  function bosaltHtml(s, a){
    const k = s.konu;
    const gecen = a.ilk ? [] : M().notlar(k.id, 'anlat').concat(M().notlar(k.id, 'niyet')).slice(-2);
    return baslikHtml(a.ilk ? 'ortak.om.bosalt-ilk' : 'ortak.om.bosalt')
      + '<p class="om-kucuk">' + kac(yazi(a.ilk ? 'ortak.om.bosalt-ilk-not' : 'ortak.om.bosalt-not')) + '</p>'
      + alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi, { satir:4 })
      + '<div class="om-dugmeler">' + (a.ilk ? '' : birinci('kapsam', yazi('ortak.om.karsilastir'))) + dugme('devam', yazi(a.sonuc || a.ilk ? 'ortak.om.devam' : 'ortak.om.gec'), a.ilk ? 'btn--primary' : 'btn--ghost') + '</div>' + kapsamHtml(s, a)
      + (a.sonuc && gecen.length ? '<div class="om-destek"><p class="om-kucuk">' + kac(yazi('ortak.om.gecen-sefer')) + '</p>' + gecen.map(x => '<p>' + kac(x.m) + '</p>').join('') + '</div>' : '');
  }
  function aktarHtml(s, a){ return baslikHtml('ortak.om.aktar') + acikHtml(a, s.konu); }
  function niyetHtml(a){
    return baslikHtml('ortak.om.niyet') + '<p class="om-kucuk">' + kac(yazi('ortak.om.niyet-not')) + '</p>' + alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi, { satir:2 })
      + '<div class="om-dugmeler">' + birinci('devam', yazi('ortak.om.devam')) + '</div>';
  }

  function sezgiHtml(s){
    const k = s.konu, z = k.sezgi, kv = L().KAVRAT;
    const m = z ? (typeof z === 'string' ? z : z.metin) : k.giris;
    return baslikHtml('ortak.om.sezgi')
      + (z && z.cizim && kv ? kv.cizimHtml('om:' + k.id + ':sezgi', z.cizim) : '')
      + '<div class="om-metin">' + para(m) + '</div>' + devamD();
  }
  function kartHtml(s){
    const k = s.konu, kv = L().KAVRAT;
    return baslikHtml('ortak.om.kartlar') + (kv ? kv.kartlarHtml(k.id, M().kartlarOf(k)) : '') + devamD();
  }
  function gorevHtml(s, a){
    const g = a.g, k = s.konu;
    if(g.tur === 'kaynak') return baslikHtml('ortak.om.gorev-kaynak') + acikHtml(Object.assign(a, { q:Object.assign({}, a.q, { soru:[g.belge, yazi('ortak.om.kaynak-sorular')], yanit:g.yanit }) }), k);
    if(g.tur === 'efsane'){
      return baslikHtml('ortak.om.gorev-efsane') + '<div class="om-soru">' + para(g.iddia) + '</div>'
        + (a.bitti ? '<p class="om-geri-bildirim ' + (a.isabet ? 'is-dogru' : 'is-yanlis') + '" role="status">' + kac(yazi(a.isabet ? 'ortak.om.efsane-isabet' : 'ortak.om.efsane-iskala')) + '</p>'
            + '<div class="om-metin">' + para(g.neden) + '</div>' + devamD()
          : '<div class="om-dugmeler">' + dugme('efsane:1', yazi('ortak.om.efsane-dogru')) + dugme('efsane:0', yazi('ortak.om.efsane-yanlis')) + '</div>');
    }
    if(g.tur === 'dikte'){
      const r = a.sonuc;
      return baslikHtml('ortak.om.gorev-dikte') + '<p class="om-kucuk">' + kac(yazi('ortak.om.dikte-not')) + '</p>'
        + '<div class="om-dugmeler">' + dugme('dikte-dinle', '▶ ' + yazi('ortak.om.dinle')) + '</div>'
        + (r ? '<p class="om-dikte" lang="' + kac(g.dil || '') + '">' + r.kelimeler.map(x => '<span class="' + (x.ok ? 'is-dogru' : 'is-yanlis') + '">' + kac(x.w) + '</span>').join(' ') + '</p>'
            + '<p class="om-kucuk">' + kac(yazi('ortak.om.dikte-sonuc', { y:Math.round(r.oran * 100) })) + '</p>' + devamD()
          : alan('adim', yazi('ortak.om.yazi-etiket'), a.yazi, { satir:2 }) + '<div class="om-dugmeler">' + birinci('dikte-karsilastir', yazi('ortak.om.karsilastir')) + '</div>');
    }
    /* sirala */
    const dagit = M().karisik(g.ogeler, g.id), secilen = a.yer || [], r = a.sonuc;
    const et = i => (g.etiketler && g.etiketler[i] ? '<span class="om-kucuk">' + kac(g.etiketler[i]) + ':</span> ' : '');
    const liste = '<ol class="om-liste om-sira">' + secilen.map((x, i) => '<li class="' + (r ? (r.yer[i] ? 'is-dogru' : 'is-yanlis') : '') + '">' + et(i) + metin(x) + (r ? (r.yer[i] ? ' ✓' : ' ✗') : '') + '</li>').join('') + '</ol>';
    const goster = a.bitti && r && !r.isabet;
    return baslikHtml('ortak.om.gorev-sirala') + (g.soru ? '<div class="om-soru">' + para(g.soru) + '</div>' : '')
      + '<p class="om-kucuk">' + kac(yazi('ortak.om.sira-not')) + '</p>' + liste
      + (r ? '<p class="om-geri-bildirim ' + (r.isabet ? 'is-dogru' : 'is-yanlis') + '" role="status">' + kac(yazi(r.isabet ? 'ortak.om.sira-tam' : a.bitti ? 'ortak.om.sira-dogru' : 'ortak.om.sira-yanlis')) + '</p>' : '')
      + (goster ? '<ol class="om-liste">' + g.ogeler.map((x, i) => '<li>' + et(i) + metin(x) + '</li>').join('') + '</ol>' : '')
      + (a.bitti ? devamD()
        : r ? '<div class="om-dugmeler">' + birinci('sira-yeniden', yazi('ortak.om.sira-yeniden')) + '</div>'
        : '<div class="om-dugmeler">' + dagit.filter(x => secilen.indexOf(x) < 0).map(x => dugme('sira-ekle:' + g.ogeler.indexOf(x), duzYazi(x))).join('') + '</div>'
          + '<div class="om-dugmeler">' + (secilen.length ? dugme('sira-geri', yazi('ortak.om.sira-geri')) : '')
          + (secilen.length === g.ogeler.length ? birinci('sira-kontrol', yazi('ortak.om.sira-kontrol')) : '') + '</div>');
  }
  const duzYazi = x => M().duz(x);

  function bitirHtml(s){
    const r = M().sonuc(s), G = L().GRAFIK, o = M().oneri();
    return baslikHtml('ortak.om.bitir')
      + (r.n ? (G && G.tikHtml && r.n <= 16 ? G.tikHtml({ hedef:r.n, yapilan:r.dogru, etiket:yazi('ortak.om.sonuc-etiket') }) : '<p>' + r.dogru + ' / ' + r.n + '</p>') : '<p>' + kac(yazi('ortak.om.sonuc-yok')) + '</p>')
      + '<ul class="om-sonuc">' + r.konular.map(x => '<li><span>' + kac(x.ad) + '</span>' + (x.asama !== 'yok' ? '<span class="om-asama' + (x.kritik ? ' is-kritik' : '') + '">' + kac(x.adi) + '</span>' : '')
        + (x.sonraki ? '<span class="om-kucuk">' + kac(yazi('ortak.om.sonraki-tekrar', { g:tarih(x.sonraki) })) + '</span>' : '') + '</li>').join('') + '</ul>'
      + ((s.konu && s.konu.sinir) || M().ayar().sinir ? '<p class="rehber__sinir">' + kac((s.konu && s.konu.sinir) || M().ayar().sinir) + '</p>' : '')
      + (s.konu ? '<div class="om-blok">' + satirAlan('kodlama-yaz', yazi('ortak.om.kod-yaz'), E.kodYaz)
        + '<div class="om-dugmeler">' + dugme('kod-kaydet', yazi('ortak.om.kod-kaydet')) + '</div>'
        + (E.kodNot ? '<p class="om-kucuk" role="status">' + kac(E.kodNot) + '</p>' : '') + '</div>' : '')
      + '<div class="om-dugmeler">'
      + (o.tur === 'tekrar' ? birinci('karma', yazi('ortak.om.tekrar-basla')) : o.tur === 'yeni' ? birinci('konu:' + o.konu, yazi('ortak.om.siradaki', { ad:o.ad })) : '')
      + dugme('ana', yazi('ortak.om.kapat')) + '</div>';
  }

  function seansHtml(){
    const s = E.s, a = M().adimOf(s);
    if(!a) return anaHtml();
    const k = M().konuOf(s, a);
    /* Karışık tekrarda konu cevaptan önce söylenmez: başlık ipucu olur. */
    const ad = a.karisik && !a.bitti ? '' : (k ? k.ad : '');
    const g = { tahmin:() => tahminHtml(a), parca:() => parcaHtml(s, a), ozet:() => ozetHtml(s), acikla:() => aciklaHtml(a), ornek:() => ornekHtml(a), yokla:() => yoklaHtml(s, a),
      onar:() => onarHtml(s, a), anlat:() => anlatHtml(s, a), aktar:() => aktarHtml(s, a), niyet:() => niyetHtml(a), bosalt:() => bosaltHtml(s, a), bitir:() => bitirHtml(s),
      sezgi:() => sezgiHtml(s), kart:() => kartHtml(s), gorev:() => gorevHtml(s, a) }[a.t];
    return ustHtml(ad, k && !a.karisik ? k.etiket : '', 'seans-cik') + noktalar(s) + '<div class="om-blok om-seans">' + g() + '</div>';
  }

  function html(){
    const m = M();
    if(!m || !m.kuruluMu()) return '';
    const ic = E.kip === 'seans' ? seansHtml() : E.kip === 'konu' ? konuHtml() : anaHtml();
    return '<div class="om" data-om-kok>' + ic + '</div>';
  }

  /* -------------------------------------------------------------- eylem */

  function sesDur(){ konusan = null; try{ const ses = M().ayar().ses; if(ses) ses.dur(); }catch(e){ /* ses yok */ } }

  function seansAc(tur){
    sesDur();
    const s = tur === 'karma' ? M().karma() : M().seans(E.id, tur, E.bicim);
    if(!s) return false;
    E.s = s; E.kip = 'seans'; E.kodYaz = ''; E.kodNot = '';
    return true;
  }
  /* Yazılan metin kayda: hangi adım hangi başlığa gider. */
  async function adimNotu(s, a){
    const k = M().konuOf(s, a), m = String(a.yazi || '').trim();
    if(!m || !k || a.notlu) return;
    a.notlu = true;
    const tur = { acikla:'acikla', anlat:'anlat', niyet:'niyet', bosalt:'bosalt', aktar:'aktar', onar:'onar' }[a.t];
    if(tur) await M().notYaz(k.id, tur, m);
  }

  async function tikla(deger, olay){
    const i = deger.indexOf(':');
    const v = i < 0 ? deger : deger.slice(0, i), d = i < 0 ? '' : deger.slice(i + 1);
    const s = E.s, a = s ? M().adimOf(s) : null;
    let adimDegisti = false;
    switch(v){
      case 'ana': E.kip = 'ana'; E.s = null; E.not = ''; E.sil = false; sesDur(); adimDegisti = true; break;
      case 'seans-cik': sesDur(); E.kip = s && s.id ? 'konu' : 'ana'; E.id = s ? s.id : E.id; E.s = null; adimDegisti = true; break;
      case 'konu': sesDur(); E.kip = 'konu'; E.id = d; E.s = null; E.not = ''; E.sil = false; E.ekle = { metin:'', soru:'', yanit:'' }; adimDegisti = true; break;
      case 'bicim': E.bicim = d; break;
      case 'ogren': if(seansAc('ogren')) adimDegisti = true; break;
      case 'tekrar': if(seansAc('tekrar')) adimDegisti = true; break;
      case 'derin': if(seansAc('derin')) adimDegisti = true; break;
      case 'karma': if(seansAc('karma')) adimDegisti = true; break;
      case 'devam':
        if(a && a.t === 'bitir') break;
        if(a) await adimNotu(s, a);
        sesDur();
        M().ilerle(s); adimDegisti = true;
        break;
      case 'dinle': {
        const ses = M().ayar().ses, kv = L().KAVRAT;
        if(!ses || !kv || !a) break;
        if(konusan === s.i){ sesDur(); break; }
        sesDur();
        konusan = s.i;
        const yer = s.i;
        Promise.resolve(ses.konus(kv.bolumMetni(s.konu.parcalar[a.i]))).catch(() => null).then(() => { if(konusan === yer){ konusan = null; yenile(); } });
        break;
      }
      case 'anlamadim': if(a) a.destek = true; break;
      case 'anlat-tur': {
        if(!a) break;
        a.bekle = true; a.model = null; a.modelNot = ''; yenile();
        const p = s.konu.parcalar[a.i];
        const r = await M().yenidenAnlat(s.konu, M().parcaMetni(p), d);
        a.bekle = false;
        if(r.ok) a.model = r;
        else a.modelNot = yazi(r.neden === 'sayi' ? 'ortak.om.model-sayi' : r.neden === 'kisa' ? 'ortak.om.model-kisa' : 'ortak.om.model-yok');
        break;
      }
      case 'ornek-ac': if(a) a.n = (a.n || 0) + 1; break;
      case 'sec':
        if(!a || a.bitti) break;
        a.sec = d;
        if(a.t === 'tahmin'){ a.bitti = true; await M().isle(s, { isabet:d === a.q.dogru, harf:d }); }
        /* İlk cevap kayda geçtiyse yeniden deneme anında değerlendirilir; kanıt değişmez. */
        else if(a.kayit){
          if(d === a.q.dogru) a.bitti = true;
          else{ (a.denenen = a.denenen || []).push(d); a.sec = null; ipIleri(s, a); }
        }
        break;
      case 'tahmin-bos':
        if(a && !a.bitti){ a.bitti = true; await M().isle(s, { isabet:false }); }
        break;
      case 'ipucu': if(a && !a.bitti) ipIleri(s, a); break;
      case 'cevap':
        if(!a || a.bitti || !a.sec || a.kayit) break;
        a.kayit = true; a.isabet = a.sec === a.q.dogru;
        a.sure = a.bas ? Math.max(1, Math.round((Date.now() - a.bas) / 1000)) : null;
        await M().isle(s, { isabet:a.isabet, guven:d, harf:a.sec, ipucu:!!a.ip });
        if(a.isabet) a.bitti = true;
        else{ a.harf = a.sec; (a.denenen = a.denenen || []).push(a.sec); a.sec = null; a.ipler = null; ipIleri(s, a); }
        break;
      case 'bos':
        if(!a || a.bitti) break;
        if(!a.kayit){
          a.kayit = true; a.isabet = false; a.sec = null;
          await M().isle(s, { isabet:false, ipucu:!!a.ip });
        }
        ipIleri(s, a);
        break;
      case 'kod-bul': {
        if(!a || a.kodBekle) break;
        a.kodBekle = true; a.kodNot = ''; yenile();
        const r = await M().kodlamaAra(M().konuOf(s, a), a.q);
        a.kodBekle = false;
        if(r.ok) a.kodAday = r.adaylar;
        else a.kodNot = yazi(r.neden === 'baglanti' ? 'ortak.om.kod-baglanti' : 'ortak.om.kod-yok');
        break;
      }
      case 'kod-ekle': {
        const y = a && a.kodAday && a.kodAday[Number(d)];
        if(!y || y.eklendi) break;
        const k = M().konuOf(s, a);
        await M().notYaz(k.id, 'kodlama', y.metin, y.url);
        y.eklendi = true;
        break;
      }
      case 'kod-kaydet': {
        const k = s && s.konu, m = String(E.kodYaz || '').trim();
        if(!k || m.length < 3) break;
        await M().notYaz(k.id, 'kodlama', m);
        E.kodYaz = ''; E.kodNot = yazi('ortak.om.kod-kaydedildi');
        break;
      }
      case 'efsane':
        if(!a || a.bitti) break;
        a.bitti = true; a.isabet = (d === '1') === !!a.g.dogru;
        await M().isle(s, { isabet:a.isabet });
        break;
      case 'dikte-dinle': {
        const ses = M().ayar().ses;
        if(ses && a) Promise.resolve(ses.konus(a.g.metin, { lang:a.g.dil })).catch(() => null);
        break;
      }
      case 'dikte-karsilastir':
        if(!a || a.bitti) break;
        a.sonuc = M().dikte(a.yazi, a.g.metin); a.bitti = true;
        await M().isle(s, { isabet:a.sonuc.isabet });
        break;
      case 'sira-ekle': {
        const x = a && a.g.ogeler[Number(d)];
        if(x == null || a.sonuc) break;
        a.yer = (a.yer || []).concat([x]);
        break;
      }
      case 'sira-geri': if(a && !a.sonuc && a.yer) a.yer = a.yer.slice(0, -1); break;
      case 'sira-kontrol':
        if(!a || a.bitti || !a.yer || a.yer.length !== a.g.ogeler.length) break;
        a.sonuc = M().siraDenetle(a.g.ogeler, a.yer);
        a.deneme = (a.deneme || 0) + 1;
        if(a.deneme === 1) await M().isle(s, { isabet:a.sonuc.isabet });
        if(a.sonuc.isabet || a.deneme >= 2) a.bitti = true;
        break;
      case 'sira-yeniden': if(a && !a.bitti){ a.sonuc = null; a.yer = []; } break;
      case 'karsilastir': if(a){ a.goster = true; await adimNotu(s, a); } break;
      case 'bos-acik':
        if(!a || a.bitti) break;
        a.goster = true; a.bitti = true; a.isabet = false; a.yazi = '';
        await M().isle(s, { isabet:false });
        break;
      case 'oz':
        if(!a || a.bitti) break;
        a.bitti = true; a.isabet = d === '1';
        await M().isle(s, { isabet:a.isabet });
        break;
      case 'hata':
        if(!a) break;
        if(a.tur !== d){ if(!a.tur) await M().hataYaz(M().konuOf(s, a).id, d); a.tur = d; }
        break;
      case 'kapsam':
        if(a){ a.sonuc = M().kapsam(a.yazi, s.konu.terimler); }
        break;
      case 'yeni-ac': {
        const y = E.yeni;
        if(String(y.ad).trim().length < 2) break;
        if(!y.onay && M().ara(y.ad)){ y.onay = true; break; }
        await yeniAc();
        adimDegisti = true;
        break;
      }
      case 'yeni-zorla': await yeniAc(); adimDegisti = true; break;
      case 'metin-ekle':
        if(String(E.ekle.metin).trim().length < 40) break;
        await M().atolyeGuncelle(E.id, { metin:E.ekle.metin, kaynak:'metin' });
        E.ekle.metin = ''; E.not = '';
        break;
      case 'model-taslak': {
        E.bekle = true; E.not = ''; yenile();
        const x = M().atolyeOf(E.id);
        const r = await M().modelTaslak(x ? x.ad : '');
        E.bekle = false;
        if(r.ok) await M().atolyeGuncelle(E.id, { metin:r.metin, kaynak:'model' });
        else E.not = yazi(r.neden === 'kisa' ? 'ortak.om.model-kisa' : 'ortak.om.model-yok');
        break;
      }
      case 'soru-ekle':
        if(String(E.ekle.soru).trim().length < 4) break;
        await M().atolyeGuncelle(E.id, { soru:{ soru:E.ekle.soru, yanit:E.ekle.yanit } });
        E.ekle.soru = ''; E.ekle.yanit = '';
        break;
      case 'sil': E.sil = true; break;
      case 'sil-hayir': E.sil = false; break;
      case 'sil-evet': await M().atolyeSil(E.id); E.kip = 'ana'; E.sil = false; adimDegisti = true; break;
      default: break;
    }
    yenile(adimDegisti, olay);
  }
  /* Merdivende bir basamak (motor söz 9). Eleme bir şıkkı kapatır; çözüm basamağı adımı bitirir. */
  function ipIleri(s, a){
    const k = M().konuOf(s, a);
    if(!a.ipler) a.ipler = M().ipuclari(k, a.q, { harf:a.harf, ara:M().kodlamaAraVar() });
    if((a.ip || 0) >= a.ipler.length) return;
    const b = a.ipler[a.ip || 0];
    a.ip = (a.ip || 0) + 1;
    if(b.tur === 'eleme' && a.q.sec){
      const h = M().eleme(a.q, (a.denenen || []).concat(a.elenen || []));
      if(h) (a.elenen = a.elenen || []).push(h);
    }
    if(b.tur === 'cozum') a.bitti = true;
  }
  async function yeniAc(){
    const y = E.yeni;
    const r = await M().atolyeEkle({ ad:y.ad, metin:y.metin });
    if(r.ok){ E.id = r.id; E.kip = 'konu'; E.yeni = { ad:'', metin:'', onay:false }; E.not = ''; E.sil = false; }
  }
  function yazIsle(id, v){
    if(id === 'adim'){ const a = E.s && M().adimOf(E.s); if(a) a.yazi = v; }
    else if(id === 'yeni-ad'){ E.yeni.ad = v; E.yeni.onay = false; }
    else if(id === 'yeni-metin') E.yeni.metin = v;
    else if(id === 'ekle-metin') E.ekle.metin = v;
    else if(id === 'ekle-soru') E.ekle.soru = v;
    else if(id === 'ekle-yanit') E.ekle.yanit = v;
    else if(id === 'kodlama-yaz') E.kodYaz = v;
  }

  /* Yerinde çizim (söz 2). Adım değişince odak başlığa gider, sayfa kökün başına kayar. */
  function yenile(adimDegisti, olay){
    if(typeof document === 'undefined') return;
    const kok = document.querySelector('[data-om-kok]');
    if(!kok) return;
    const sablon = document.createElement('template');
    sablon.innerHTML = html();
    const yeni = sablon.content.firstElementChild;
    if(!yeni) return;
    /* Açık grup ve açık form yeniden çizimde kapanmasın. */
    const acik = {};
    kok.querySelectorAll('details').forEach((x, i) => { if(x.open) acik[i] = 1; });
    kok.replaceWith(yeni);
    if(!adimDegisti) yeni.querySelectorAll('details').forEach((x, i) => { if(acik[i]) x.open = true; });
    const hedef = (adimDegisti && yeni.querySelector('[data-om-odak]')) || (olay && yeni.querySelector('[data-om="' + olay + '"]:not([disabled])'));
    if(hedef) try{ hedef.focus({ preventScroll:true }); }catch(x){ hedef.focus(); }
    if(adimDegisti) try{ yeni.scrollIntoView({ block:'start' }); }catch(x){ /* eski tarayıcı */ }
  }

  /* Başka ekranlardan girişler. */
  function ac(id){ E.kip = 'konu'; E.id = id; E.s = null; E.not = ''; E.sil = false; }
  function tekrarAc(){ E.kip = 'ana'; E.s = null; }
  function goster(){ const a = M().ayar(); if(a && a.git) a.git(); }
  /* Bugün ekranı satırı: yalnız tekrar varken. */
  function bugunSatiri(){
    if(!M() || !M().kuruluMu()) return '';
    const n = M().tekrarSayisi();
    if(!n) return '';
    return '<button type="button" class="om-bugun" data-om-git="ana">' + kac(yazi('ortak.om.bugun-tekrar', { n })) + ' ›</button>';
  }
  /* Anlatım ekranındaki giriş düğmesi. */
  function girisDugmesi(id, ton){
    return '<button type="button" class="btn ' + (ton || 'btn--ghost') + '" data-om-git="konu:' + kac(id) + '">' + kac(yazi('ortak.om.anlatimdan')) + '</button>';
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const g = t.closest('[data-om-git]');
      if(g){
        e.preventDefault();
        const v = g.getAttribute('data-om-git');
        if(v.indexOf('konu:') === 0) ac(v.slice(5)); else tekrarAc();
        goster();
        return;
      }
      const b = t.closest('[data-om]');
      if(!b || b.disabled) return;
      e.preventDefault();
      const v = b.getAttribute('data-om');
      tikla(v, v);
    });
    document.addEventListener('input', e => {
      const a = e.target && e.target.getAttribute ? e.target.getAttribute('data-om-yaz') : null;
      if(a) yazIsle(a, e.target.value);
    });
  }

  function _sifirla(){ E = { kip:'ana', id:null, s:null, bicim:'parca', yeni:{ ad:'', metin:'', onay:false }, ekle:{ metin:'', soru:'', yanit:'' }, sil:false, not:'', bekle:false, kodYaz:'', kodNot:'' }; konusan = null; }

  return { html, tikla, yazIsle, ac, bugunSatiri, girisDugmesi, durum:() => E, _sifirla };
})();
