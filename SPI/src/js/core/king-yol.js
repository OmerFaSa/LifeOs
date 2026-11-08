/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/king-yol.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KING · yönlendirme ve olaylar: isle, Merkez yolu, yerel King, kayıt, ayar komutları, odak, bağla, kur (son yüklenir).
   Parça 8/8; yükleme sırası: king.js, king-ses.js, king-kayit.js, king-gorunum.js, king-kart.js, king-arac.js, king-devrim.js, king-yol.js.
   Dosyalar arası ortak adlar ve ortak durum window.LIFEOS.KING_IC'tedir (KI.ad). */
window.LIFEOS.PARCA.yazilar({
  'ortak.king-yol.sesi':'Sesi ',
  'ortak.king-yol.bundan-sonra-derin-dusuneceg':'Bundan sonra derin düşüneceğim; cevaplar biraz uzun sürebilir.',
  'ortak.king-yol.bundan-sonra-hizli-cevaplaya':'Bundan sonra hızlı cevaplayacağım.',
  'ortak.king-yol.bundan-sonra-dengeli-dusunec':'Bundan sonra dengeli düşüneceğim.',
  'ortak.king-yol.dusunme-derinligini-mesaja-g':'Düşünme derinliğini mesaja göre ben seçeceğim.',
  'ortak.king-yol.cevaplari-sesli-okuyacagim':'Cevapları sesli okuyacağım.',
  'ortak.king-yol.cevaplari-yalniz-yazili-vere':'Cevapları yalnız yazılı vereceğim.',
  'ortak.king-yol.bundan-sonra-resmi-konusacag':'Bundan sonra resmi konuşacağım.',
  'ortak.king-yol.tamam-samimi-konusuruz':'Tamam, samimi konuşuruz.',
  'ortak.king-yol.bundan-sonra-kisa-ve-oz':'Bundan sonra kısa ve öz konuşacağım.',
  'ortak.king-yol.okuma-hizi':'Okuma hızı ',
  'ortak.king-yol.odak-suresi-doldu':'Odak süresi doldu: ',
  'ortak.king-yol.sure-doldu':'Süre doldu: ',
  'ortak.king-yol.odak-sayacini-durdurdum':'Odak sayacını durdurdum.',
  'ortak.king-yol.calisan-bir-odak-sayaci-yok':'Çalışan bir odak sayacı yok.',
  'ortak.king-yol.bu-buyuk-bir-degisiklik-evet':'Bu büyük bir değişiklik; «evet» yetmez. «Onaylıyorum» yaz ya da düğmeye dokun.',
  'ortak.king-yol.lifeos-ta-odeme-yapan-bir-ar':'LifeOS’ta ödeme yapan bir araç yok; bunu kendi tarayıcında yapman gerekir. Kart bilgini buraya yazma.',
  'ortak.king-yol.satin-alma-ve-kart-islemleri':'Satın alma ve kart işlemleri kapalı (Ayarlar › Hesap). Ödeme, sipariş ya da kart işine girmem; kart bilgini de buraya yazma.',
  'ortak.king-yol.tamam-envanteri-biraktim-ist':'Tamam, envanteri bıraktım; istediğin zaman «kişilik testi» de.',
  'ortak.king-yol.haftalik-degerlendirme':'Haftalık değerlendirme',
  'ortak.king-yol.moduller-arasi-bulgular':'Modüller arası bulgular',
  'ortak.king-yol.anlat-dinliyorum-bitince-gon':'Anlat, dinliyorum. Bitince gönder; Defter’e günlük olarak yazacağım. Vazgeçersen «vazgeç» de.',
  'ortak.king-yol.defter-bu-modulde-kurulu-deg':'Defter bu modülde kurulu değil; günlüğü buraya yazamam.',
  'ortak.king-yol.cikarimlarimi-sohbette-sormu':'Çıkarımlarımı sohbette sormuyorum; Onaylar’da duruyorlar. Şu an ',
  'ortak.king-yol.simdilik-yeni-bir-cikarimim':'Şimdilik yeni bir çıkarımım yok; kayıtların arttıkça Onaylar’a bırakacağım. «Beni nasıl tanıyorsun»da bildiklerimi görebilirsin.',
  'ortak.king-yol.olumsuz-bir-istek-hicbir-sey':'Olumsuz bir istek; hiçbir şeyi değiştirmedim. Ne istediğini olumlu söylersen yaparım.',
  'ortak.king-yol.not-ettim':'Not ettim: «',
  'ortak.king-yol.anlattiklarinda-sunlari-buld':'Anlattıklarında şunları buldum; seçtiklerini kaydedeyim:',
  'ortak.king-yol.siraya-aldim':'Sorunu sıraya aldım; bağlantı gelince kendim soracağım. Sırada ',
  'ortak.king-yol.bugun-icin-henuz-bir-sey':'Bugün için henüz bir şey yok.',
  'ortak.king-yol.bu':'Bu ',
  'ortak.king-yol.henuz-yapmadiysan-yaptiktan':'Henüz yapmadıysan, yaptıktan sonra da söyleyebilirsin.',
  'ortak.king-yol.king-in-modeli-su-an-kapali':'King’in modeli şu an kapalı. ',
  'ortak.king-yol.merkeze-ulasilamadi':'Merkeze şu an ulaşılamadı. ',
  'ortak.king-yol.bunu-anlayamadim-sunlardan-b':'Bunu anlayamadım. Şunlardan birini seçebilir ya da «hareket sayfasına git», «uyku 7», ',
  'ortak.king-yol.kaydedilemedi':'Kaydedilemedi: ',
  'ortak.king-yol.tamam-hicbir-seyi-degistirme':'Tamam, hiçbir şeyi değiştirmedim.',
  'ortak.king-yol.tamam-buradayim':'Tamam, buradayım.',
  'ortak.king-yol.tamam-eklemedim':'Tamam, eklemedim.',
  'ortak.king-yol.tamam-hicbirini-kaydetmedim':'Tamam, hiçbirini kaydetmedim.',
  'ortak.king-yol.hatirlatmayi-iptal-ettim':'Hatırlatmayı iptal ettim.',
  'ortak.king-yol.dikkat':'Dikkat. ',
  'ortak.king-yol.cevabi-kopyala':'Cevabı kopyala',
  'ortak.king-yol.tamam-baska-zaman':'Tamam, başka zaman.',
  'ortak.king-yol.ekranda-ne-goruyorsun-kisaca':'Ekranda ne görüyorsun? Kısaca söyle.',
  'ortak.king-yol.kamerada-ne-goruyorsun-kisac':'Kamerada ne görüyorsun? Kısaca söyle.',
  'ortak.king-yol.buradayim':'Buradayım. ',
  'ortak.king-yol.tamam-sayfa-yenilendi-burada':'Tamam, sayfa yenilendi; buradayım.',
});

window.LIFEOS.PARCA.yazilar({
  'ortak.king-yol.kaydet':'Kaydet',
  'ortak.king-yol.gerek-yok':'Gerek yok',
  'ortak.king-yol.hepsini-onayla':'Hepsini onayla',
  'ortak.king-yol.vazgec':'Vazgeç',
  'ortak.king-yol.geri-al':'Geri al',
  'ortak.king-yol.ekip-ve-gorevler':'Ekip ve görevler',
  'ortak.king-yol.beceriler-ve-sozler':'Beceriler ve sözler',
  'ortak.king-yol.sirayi-gor':'Sırayı gör',
  'ortak.king-yol.evet-ekle':'Evet, ekle',
  'ortak.king-yol.hayir':'Hayır',
});


window.LIFEOS.KING = (function(){
  'use strict';

  const KI = window.LIFEOS.KING_IC;

  /* «sesi Piper yap», «derin düşün»…: King'in kendi tercihleri (küçük, tekrar söyleyince değişir). */
  function ayarKomutu(t){
    const m = t.match(/(?:sesi|ses olarak)\s+(ema|piper|gemini|cihaz|otomatik)|(ema|piper|gemini|cihaz|otomatik)\s+ses(?:i|ine|le)\s*(?:geç|yap|kullan|olsun|oku)/);
    if(m){ const v = { ema:'ema', piper:'piper', gemini:'gemini', cihaz:'cihaz', otomatik:'oto' }[m[1] || m[2]]; KI.sesTercihSec(v); return yz('ortak.king-yol.sesi') + KI.SES_AD[v] + ' yaptım.'; }
    if(/derin(?:lemesine)? düşün/.test(t)){ KI.derinlikSec('derin'); return yz('ortak.king-yol.bundan-sonra-derin-dusuneceg'); }
    if(/hızlı (?:cevap ver|cevapla|düşün)/.test(t)){ KI.derinlikSec('hizli'); return yz('ortak.king-yol.bundan-sonra-hizli-cevaplaya'); }
    if(/dengeli düşün/.test(t)){ KI.derinlikSec('dengeli'); return yz('ortak.king-yol.bundan-sonra-dengeli-dusunec'); }
    if(/düşünmeyi otomatik/.test(t)){ KI.derinlikSec('oto'); return yz('ortak.king-yol.dusunme-derinligini-mesaja-g'); }
    if(/(?:cevapları|cevabı) sesli (?:oku|ver)|sesli cevap ver/.test(t)){ KI.cevapSec('ses'); return yz('ortak.king-yol.cevaplari-sesli-okuyacagim'); }
    if(/(?:cevapları|cevabı) yazılı ver|yazılı cevap ver|sesli okumayı kapat/.test(t)){ KI.cevapSec('yazi'); return yz('ortak.king-yol.cevaplari-yalniz-yazili-vere'); }
    if(/resmi konuş/.test(t)){ KI.tarzSec('resmi'); return yz('ortak.king-yol.bundan-sonra-resmi-konusacag'); }
    if(/samimi konuş/.test(t)){ KI.tarzSec('samimi'); return yz('ortak.king-yol.tamam-samimi-konusuruz'); }
    if(/(?:kısa ve öz|kısa) konuş/.test(t)){ KI.tarzSec('kisa'); return yz('ortak.king-yol.bundan-sonra-kisa-ve-oz'); }
    if(/daha (hızlı|yavaş) oku/.test(t)){
      const i = KI.HIZLAR.indexOf(KI.hiz()), j = /hızlı/.test(t) ? Math.min(KI.HIZLAR.length - 1, i + 1) : Math.max(0, i - 1);
      KI.ortam.depo.yaz(KI.HIZ, KI.HIZLAR[j]);
      return yz('ortak.king-yol.okuma-hizi') + String(KI.HIZLAR[j]).replace('.', ',') + ' kat.';
    }
    return null;
  }
  const ODAK = 'lifeos.king.odak';      // { bitis, dk, konu }; TASINAN'da
  const ODAK_RE = /(?:(\d{1,3})\s*(?:dk|dakika)(?:lık)?\s*(.*?)\s*(?:çalışalım|çalışayım|odaklanalım|odaklanayım)(?![a-zçğıöşü]))|pomodoro|odak (?:modu|sayacı|zamanlayıcı)(?:nı|sı)? ?(?:başlat|aç)/;
  let odakSaat = null, odakAralik = null;
  function odak(){ const v = KI.ortam.depo.oku(ODAK); return v && v.bitis ? v : null; }
  /* Çalışma oturumu olayı (2026-10-30): müzik «Çalışırken» listesine geçer (muzik.js). */
  const calismaOlayi = acik => { try{ if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lifeos:calisma', { detail:{ acik } })); }catch(e){ /* yok */ } };
  function odakBaslat(dk, konu){
    KI.ortam.depo.yaz(ODAK, { bitis:KI.ortam.simdi().getTime() + dk * 60000, dk, konu:konu || '' });
    calismaOlayi(true);
    odakKur();
    KI.ciz(false);
  }
  function odakTemizle(){
    if(odakSaat) try{ clearTimeout(odakSaat); }catch(e){ /* yok */ }
    if(odakAralik) try{ clearInterval(odakAralik); }catch(e){ /* yok */ }
    odakSaat = null; odakAralik = null;
  }
  function odakKur(){
    odakTemizle();
    const v = odak();
    if(!v) return;
    const kalan = v.bitis - KI.ortam.simdi().getTime();
    if(kalan <= 0){ odakBitti(); return; }
    odakSaat = KI.ortam.zamanla(odakBitti, kalan);
    if(odak() && typeof document !== 'undefined' && typeof setInterval === 'function'){
      odakAralik = setInterval(() => {
        const el = document.querySelector('[data-odak-kalan]');
        const o = odak();
        if(el && o) el.textContent = odakYaz(o.bitis - KI.ortam.simdi().getTime());
      }, 1000);
    }
  }
  function odakYaz(ms){
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function odakBitti(){
    const v = odak();
    odakTemizle();
    if(!v) return;
    KI.ortam.depo.sil(ODAK);
    calismaOlayi(false);
    KI.ortam.depo.yaz(KI.ODAK_SON, { dk:v.dk, konu:v.konu || '', at:KI.ortam.simdi().getTime() });
    if(KI.ortam.bildir) KI.ortam.bildir('King', yz('ortak.king-yol.odak-suresi-doldu') + v.dk + ' dakika.');
    KI.soyle(yz('ortak.king-yol.sure-doldu') + v.dk + ' dakika' + (v.konu ? ' ' + v.konu : '') + ' tamam. Kaydedeyim mi?');
    KI.cipler = [{ ad:yz('ortak.king-yol.kaydet'), is:'odak-kaydet:' + v.dk + ':' + encodeURIComponent(v.konu || '') }, { ad:yz('ortak.king-yol.gerek-yok'), is:'vazgec' }];
    KI.ciz(false);
  }
  function odakDur(){
    const v = odak();
    odakTemizle();
    KI.ortam.depo.sil(ODAK);
    if(v) calismaOlayi(false);
    KI.soyle(v ? yz('ortak.king-yol.odak-sayacini-durdurdum') : yz('ortak.king-yol.calisan-bir-odak-sayaci-yok'));
  }
  function odakHtml(){
    const v = odak();
    if(!v) return '';
    return '<span class="king__odak" role="timer" aria-label="Odak sayacı">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 3h5"/></svg>'
      + '<b data-odak-kalan>' + odakYaz(v.bitis - KI.ortam.simdi().getTime()) + '</b>'
      + '<button type="button" class="king__hap king__hap--simge" data-king="odak-dur" aria-label="Odak sayacını durdur" title="Durdur">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></span>';
  }
  const HAFTA_RE = /(haftalık değerlendirme|haftam nasıl|haftayı değerlendir|bu haftayı özetle)/;
  const CAPRAZ_RE = /(çapraz bulgu|modüller arası|neyi etkiliyor|bağlantıları göster|ilişkileri göster)/;
  async function merkezKomut(metin, komut, baslik){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar;
    let l = [];
    if(komut === 'hafta' && K && typeof K.istatistik === 'function'){
      try{ l = (K.istatistik() || []).filter(x => x && x.ad).map(KI.kartTemiz).slice(0, 4); }catch(e){ l = []; }
    }
    const ek = l.length ? { kartlar:l } : {};
    if(!KI.baglanti()){
      KI.soyle(baslik + ' için Merkez (HKM) bağlı olmalı.' + (l.length ? ' Modülün kendi kartları:' : ''), null, null, null, ek);
      return { tur:'merkez-yok' };
    }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek);
    KI.ciz(false);
    const r = await KI.merkezeSor(komut);
    KI.akis = KI.akis.filter(m => m !== bek);
    KI.soyle(r.ok ? r.text : baslik + ' alınamadı; Merkez cevap vermedi.', null, null, null, Object.assign({ bulgu:true }, ek));
    return { tur:'merkez-komut', komut };
  }

  /* Ödeme cümlesi: satın al, sipariş ver, öde(me yap), kart bilgisi; «ödev» değil. */
  const YAPILACAK_RE = /^(yapılacak(lar)?|yapilacak|hatırlat|hatirlat)(?![a-zçğıöşü])/;   // «yapılacak: fatura öde» bir hatırlatmadır, ödeme değil
  const ODEME = /\s(satın al|satin al|sipariş ver|siparis ver|ödeme yap|odeme yap|öde\s|öder misin|ödeyebilir misin|kredi kart|banka kart|kart numara|kart bilgi|cvv|abone ol|bilet al)/;
  const PLAN_SOZ_RE = /(bugünün|bugünkü|günün) (planı|plan|programı|akışı)/;
  const ILAC_RE = /(hangi ilac|hangi hap|ilaç öner|ilac öner|kaç (?:mg|miligram)|kaç (?:tane|adet) (?:ilaç|hap|ağrı kesici)|(?:ilaç|hap|ağrı kesici)\S* kaç (?:tane|mg)|doz(?:u|unu)? (?:ne|kaç))/;
  const ILISKI_RE = /(ilişki|etkisi|etkiliyor|günler(?:de|i)?\s.*(?:mi|mı|mu|mü)\b)/;
  const OLUMSUZ_GUN_RE = /(hiç çalışmadım|çalışmadım|çalışamadım|hiçbir şey yapmadım|hiç bir şey yapmadım|bir şey yapamadım|boş geçti|hiç çalışasım yok)/;
  const HIS_RE = /(hissediyorum|kötüyüm|mutsuzum|üzgünüm|stresliyim|bunaldım|baskı yapıyor|motivasyon|uyuyamıyorum|başarısız|suçlu|endişeliyim|kaygılıyım|konuşalım mı|konuşabilir miyiz)/;
  const OZET_GUN_RE = /^(?:bana\s+)?(?:bugünün|günün|bugünkü)\s+(?:\S+\s+)?özet(?:i|ini)?(?:\s+(?:çıkar|ver|göster|yaz|nedir|ne))?\s*[?.!]*$/;
  async function isle(metin){
    KI.gozSonEtkilesim = KI.ortam.simdi().getTime();
    if((KI.bolum === 'araclar' || KI.bolum === 'kutuphane')){ KI.bolum = 'sohbet'; KI.kvGiris = true; }     // sayfadayken sorulan sohbette görünür
    /* Söz 8: bekleyen soruya yazıyla cevap («evet», «hayır»). */
    const t0 = KI.kucuk(metin);
    if(!KI.akis.some(m => m.kim === 'sen')) KI.sohbetBasYaz();     // söz 33: yeni sohbet ya da yeni gün
    if(KI.ritim) return KI.ritimIsle(metin);                        // söz 34: haftalık gözden geçirme sürüyor
    if(KI.gunlukBekle) return KI.gunlukIsle(metin);                 // söz 34: günlük metni bekleniyor
    /* İlaç ve doz (AGENTS §1.5; King 5 deneme: «başım ağrıyor, hangi ilacı kaç tane içmeliyim?» yalnız belirti
       olarak önizleniyor, soru sessizce geçiliyordu). Sınır önce ve açıkça söylenir; belirti kaydı bir dokunuş. */
    if(ILAC_RE.test(t0)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null;
      const belirti = String(metin).split(/[,;.]/).map(x => x.trim()).find(x => x && !ILAC_RE.test(KI.kucuk(x)));
      KI.cipler = belirti ? [{ ad:'Belirtiyi kaydet', is:'oner-metin:' + belirti }] : null;
      KI.soyle('İlaç ya da doz öneremem; bunu hekimin ya da eczacın söyler. Şikâyet şiddetliyse, geçmiyorsa ya da ateş, kusma, görme bozukluğu gibi belirtiler eşlik ediyorsa bir sağlık kuruluşuna başvur.'
        + (belirti ? ' İstersen «' + belirti + '» belirtisini kaydedeyim.' : ''));
      return { tur:'ilac-siniri' };
    }
    /* «Bugünün (sağlık) özetini çıkar» yerel özettir (deneme: ücretli araştırma iş emri açılıyordu). */
    if(OZET_GUN_RE.test(t0) && !/^bugünün özeti$/.test(t0)){
      const r = await isle('bugünün özeti');
      const sen = KI.akis.filter(m => m.kim === 'sen' && m.metin === 'bugünün özeti').pop();
      if(sen) sen.metin = String(metin).trim();
      return r;
    }
    /* Söz 20: büyük eylem yalnız açık onayla. */
    if(KI.bekleyenYetki && /^onayl[ıi]yorum[.!]?$/.test(t0)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      await KI.yetkiUygula();
      return { tur:'yetki' };
    }
    /* «Hayır + düzeltme» (King 5 D4, deneme 2026-11-08: «hayır, kalıcı değil sadece bugün için» yalnız
       «hayır» sayılıyor, düzeltme atılıyordu): bekleyen öneri iptal edilir, asıl istek düzeltmeyle
       birlikte yeniden okunur. Akışta kullanıcının kendi cümlesi görünür. */
    const duz = KI.bekleyenYetki ? t0.match(/^(?:hayır|hayir|yok|öyle değil|değil)\s*[,.!:-]?\s+(.+)$/) : null;
    if(duz && duz[1].split(' ').length >= 2 && !KI.HAYIR.test(duz[1])){
      const onceki = KI.akis.filter(m => m.kim === 'sen').pop();
      /* «kalıcı değil» olumsuzluk süzgecine takılıp isteği durduruyordu (canlı deneme): «X değil» atılır,
         düzeltme başa gelir: «sadece bugün için, günde 30 dakika çalışacağım». */
      const ek = duz[1].replace(/(?:^|\s)\S+\s+değil(?=[\s,]|$),?/g, ' ').replace(/\s+/g, ' ').trim();
      if(onceki && onceki.metin && ek){
        const birlesik = ek + ', ' + String(onceki.metin).trim().replace(/[.!]+$/, '');
        vazgec();
        const r = await isle(birlesik);
        const sen = KI.akis.filter(m => m.kim === 'sen' && m.metin === birlesik).pop();
        if(sen) sen.metin = String(metin).trim();
        return r;
      }
    }
    if(KI.bekleyenYetki && (KI.EVET.test(t0) || KI.HAYIR.test(t0))){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      if(KI.HAYIR.test(t0)){ vazgec(); return { tur:'hayir' }; }
      if(KI.bekleyenYetki.seviye === 'buyuk'){
        KI.soyle(yz('ortak.king-yol.bu-buyuk-bir-degisiklik-evet'));
        return { tur:'yetki-bekliyor' };
      }
      await KI.yetkiUygula();
      return { tur:'yetki' };
    }
    /* A3: King'in sorduğu eksik parametreye cevap («Hangi kitap?» → «Sefiller»). */
    if(KI.bekleyenNiyet){
      if(KI.HAYIR.test(t0) || /^vazge[çc]/.test(t0)){ KI.akis.push({ kim:'sen', metin:String(metin).trim() }); vazgec(); return { tur:'hayir' }; }
      return KI.niyetCevap(metin);
    }
    if((KI.bekleyen || KI.bekleyenGit || KI.bekleyenIlet) && (KI.EVET.test(t0) || KI.HAYIR.test(t0))){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      if(KI.EVET.test(t0)){ if(KI.bekleyen) await kaydet(); else if(KI.bekleyenIlet) await KI.ilet(); else KI.gitOnayla(); }
      else vazgec();
      return { tur:KI.EVET.test(t0) ? 'evet' : 'hayir' };
    }
    /* K2: King'in sorduğu soruya (söz, beceri) ilk cevap yerel kurallara takılmadan
       Merkez'e gider; cevabı HKM yakalar, sayı varsa modüle onaylı öneri olur. */
    if(KI.k2Soru && t0 && KI.baglanti() && KI.ortam.simdi().getTime() - KI.k2Soru < 12 * 3600 * 1000){
      KI.k2Soru = 0;
      return merkezYolu(metin, { tur:'bilinmiyor', metin });
    }
    /* SATIN ALMA VE KART (kullanıcı, 2026-10-29: «satın alma ve kart işlemlerini
       açıp kapatabilelim»). Ayarlar › Hesap'taki kilit (lifeos.kilit.odeme,
       varsayılan kapalı). LifeOS'ta ödeme yapan bir araç yoktur: açıkken de King
       bu işi yapmaz, yalnız söyler. Cümle Merkez'e de gitmez (kart bilgisi taşıyabilir). */
    if(ODEME.test(' ' + t0 + ' ') && !YAPILACAK_RE.test(t0)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      let acik = false;
      try{ acik = localStorage.getItem('lifeos.kilit.odeme') === 'acik'; }catch(e){}
      KI.soyle(acik ? yz('ortak.king-yol.lifeos-ta-odeme-yapan-bir-ar')
        : yz('ortak.king-yol.satin-alma-ve-kart-islemleri'));
      return { tur:'odeme' };
    }
    /* Söz 14: «geri al», «sonu sil», «onu sil». */
    if(/^(geri al|son (kaydı|kayıt|girdiyi) (geri al|sil)|onu (sil|geri al)|sil onu|yanlış oldu geri al)[.!]?$/.test(t0)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      await KI.geriAlYap();
      return { tur:'geri-al' };
    }
    /* «King ne yaptı?» (King 5, deneme 2026-11-08: «yanlış soru teşhisi» aracına gidiyordu). Eylem defteri
       kodla okunur: son beş iş, nereden geldiği, geri alınıp alınmadığı. */
    if(/^(?:king\s+)?(?:ne(?:ler)? yaptın|ne yaptı|son yaptıkların|yaptıkların|eylem(?:ler)?(?:in)?)(?:\s+neler)?\s*[?.!]*$/.test(t0)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
      const l = KI.eylemListesi ? KI.eylemListesi().slice(0, 5) : [];
      if(!l.length) KI.soyle('Henüz senin onayınla yaptığım bir iş yok. Önerdiğim her değişiklik önce önizlenir, onaylarsan yapılır ve buraya düşer.');
      else KI.soyle('Son yaptıklarım (yenisi üstte):', l.map(e => KI.tarihYaz(e.zaman) + ' · ' + (e.ozet || e.arac)
        + (e.durum === 'geri_alindi' ? ' · geri alındı' : e.geriYolu ? ' · geri alınabilir' : '')));
      return { tur:'eylem', n:l.length };
    }
    /* Söz 25: üslup sayacı (yalnız sayı) ve envanter. */
    if(KI.ENV() && KI.hafiza()) KI.ortam.depo.yaz(KI.USLUP, KI.ENV().uslupGuncelle(KI.ortam.depo.oku(KI.USLUP), metin));
    if(KI.envanter){
      const c = KI.envanterCevap(metin);
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      if(c != null){ await KI.envanterIlerle(c); return { tur:'envanter' }; }
      if(/^(bırak|dur|vazgeç|sonra)/.test(t0)){ KI.envanter = null; KI.cipler = null; KI.soyle(yz('ortak.king-yol.tamam-envanteri-biraktim-ist')); return { tur:'envanter-dur' }; }
      KI.soyle('1 ile 5 arasında bir sayı seç ya da «Bırak» de.'); return { tur:'envanter' };
    }
    if(KI.ENV_BASLA.test(t0) && KI.hafiza() && KI.ENV()){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyenTanisma = null; KI.cipler = null;
      KI.envanterBasla();
      KI.ciz(false);
      return { tur:'envanter' };
    }
    /* Dersin ipi (KING-5 K5-09, deneme kullanımı 2026-11-08: ders kartından sonra «peki bir örnek ver»
       ilgisiz bir araca gidip iç bir kimlik soruyordu). Son mesaj bir dersse yazılı «devam» ve «örnek/soru»
       kartın kendi düğmeleriyle aynı işi yapar. */
    { const sn = KI.akis.length - 1, sd = KI.akis[sn];
      if(sd && sd.kim === 'king' && sd.ders){
        const s = t0.replace(/[.!?]+$/, '');
        if(/^(?:tamam\s+|peki\s+)?(?:devam|devam et|sonraki|ileri)$/.test(s)){ KI.dersAdim(sn, 1); return { tur:'ders', adim:1 }; }
        if(/^(?:peki|o zaman|tamam|şimdi)?\s*(?:bana\s+)?(?:bir\s+)?(?:örnek|soru|alıştırma)(?:\s+(?:ver|sor|göster|çöz|yap)(?:\s*(?:misin|mısın|lütfen))?)?$/.test(s)){
          if(sd.ders.kd){ KI.cipler = null; KI.kdSoru(sd.ders.id); return { tur:'ders', soru:true }; }
          return isle('bana soru sor ' + sd.ders.sorgu);
        }
      }
    }
    /* Öğretmen (2026-10-22): «türevi anlat» → modülün kendi anlatımından ders
       kartı. Modülde o konu yoksa yol açık kalır (Merkez cevaplar). */
    const DN = KI.dersNiyeti(t0);
    if(DN){ const r = await KI.dersIsle(DN, metin); if(r) return r; }
    if(KI.SOZET_RE.test(t0)) return KI.sesliOzet(metin);
    /* DEVRİM: derse çevir, derslerden soru, kişisel yasalar, günüm. */
    const DC = String(metin || '').trim().match(KI.DERSE_RE);
    if(DC){ KI.akis.push({ kim:'sen', metin:String(metin).trim().slice(0, 160) + (String(metin).length > 160 ? '…' : '') }); KI.cipler = null;
      return KI.derseCevir(DC[1] && DC[1].length >= 400 ? DC[1] : (KI.kaynakMetin && KI.kaynakMetin.metin) || DC[1], DC[1] && DC[1].length >= 400 ? 'yapıştırılan metin' : KI.kaynakMetin && KI.kaynakMetin.ad); }
    if(KI.KD_SORU_RE.test(t0)){ KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null; return KI.kdSoru(null); }
    if(KI.YASA_RE.test(t0)) return KI.yasaIsle(metin);
    if(KI.GUN_KAPAT_RE.test(t0)) return KI.gunIsle(metin, true);
    if(KI.GUN_RE.test(t0)) return KI.gunIsle(metin, false);
    { const AK = KI.aracKutusu(metin, t0); if(AK) return AK; }
    /* Söz 32: kartlar (istatistik, soru); «sorma» komutundan önce. */
    /* KING-4 §H: brifing, «unuttuğun ne var?», haftalık rapor, alışkanlık saati, «onu 30 dk yap». */
    /* Ölçü soruları (brand/ortak/olcu.js): sayıyı kod üretir; modelden ve hafızadan önce. */
    { const O = KI.L.OLCU && KI.L.OLCU.kuruluMu && KI.L.OLCU.kuruluMu() ? KI.L.OLCU.coz(metin, KI.bugunISO()) : null;
      if(O){
        KI.akis.push({ kim:'sen', metin:String(metin).trim() });
        KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenTanisma = null; KI.cipler = null;
        KI.soyle(O.cevap, O.satirlar && O.satirlar.length ? O.satirlar : null);
        return { tur:'olcu', id:O.id };
      }
    const YN = KI.yardimNiyeti(t0);
    if(YN) return KI.yardimIsle(YN, metin);
    const KN = KI.kartNiyeti(t0);
    if(KN) return KI.kartIsle(KN, metin);
    /* Söz 33: King'in kendi ayarları, odak sayacı, Merkez komutları. */
    const AK = ayarKomutu(t0);
    if(AK){ KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null; KI.soyle(AK); return { tur:'ayar' }; }
    if(/(odağı bitir|odak sayacını durdur|sayacı durdur)/.test(t0)){ KI.akis.push({ kim:'sen', metin:String(metin).trim() }); odakDur(); return { tur:'odak-dur' }; }
    const OD = t0.match(ODAK_RE);
    if(OD){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null;
      const dk = Math.max(1, Math.min(180, Number(OD[1]) || 25)), konu = String(OD[2] || '').trim();
      odakBaslat(dk, konu);
      KI.soyle(dk + ' dakikalık odak başladı' + (konu ? ' (' + konu + ')' : '') + '. Süre dolunca haber vereceğim; «sayacı durdur» dersen dururum.');
      return { tur:'odak', dk };
    }
    if(HAFTA_RE.test(t0)) return merkezKomut(metin, 'hafta', yz('ortak.king-yol.haftalik-degerlendirme'));
    if(CAPRAZ_RE.test(t0)) return merkezKomut(metin, 'capraz', yz('ortak.king-yol.moduller-arasi-bulgular'));
    /* Söz 34 */
    /* «bugünün planı ne, neye çalışmalıyım» önce bugünün planıdır (King 5, deneme: «öncelik için veri yok» diyordu). */
    if(KI.ONCELIK_RE.test(t0) && !PLAN_SOZ_RE.test(t0)) return KI.oncelikIsle(metin);
    if(KI.RITIM_RE.test(t0)) return KI.ritimBaslat(metin);
    if(KI.YUK_RE.test(t0)) return KI.yukIsle(metin);
    if(KI.GUNLUK_RE.test(t0)){ KI.akis.push({ kim:'sen', metin:String(metin).trim() }); KI.cipler = null; KI.gunlukBekle = true;
      KI.soyle(KI.D() ? yz('ortak.king-yol.anlat-dinliyorum-bitince-gon') : yz('ortak.king-yol.defter-bu-modulde-kurulu-deg'));
      if(!KI.D()) KI.gunlukBekle = false;
      return { tur:'gunluk' }; }
    if(KI.DENEY_DURUM_RE.test(t0)) return KI.deneyDurum(metin);
    const DB = t0.match(KI.DENEY_RE);
    if(DB) return KI.deneyBaslat(metin, DB[1]);
    if(KI.NOT_RE.test(t0)) return KI.notAra(metin, t0);
    /* Söz 24: «… artık sorma / sor». */
    /* King 5 tur 5: «bana soru sorma artık» tanışma sorularını kapatır («beni tanı» yeniden açar). */
    if(/(bana )?(soru sorma|soru sormayı bırak|sorularını kes|sürekli soru sor)/.test(t0) && !/(bana soru sor\b|soru sor$)/.test(t0.replace(/sorma.*$/, ''))){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyenTanisma = null; KI.cipler = null;
      KI.ortam.depo.yaz(KI.TANISMA, 'kapali');
      KI.soyle('Haklısın, tamam: artık kendiliğimden tanışma sorusu sormayacağım. İstersen bir gün «beni tanı» dersin.');
      return { tur:'tanisma-kapali' };
    }
    if(/^beni tanı\b/.test(t0) && KI.ortam.depo.oku(KI.TANISMA) === 'kapali') KI.ortam.depo.yaz(KI.TANISMA, '');
    const SK = KI.sormaKomutu(metin);
    if(SK && !KI.veriGibi(metin)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyen = null; KI.cipler = null;
      KI.soyle(KI.sormaUygula(SK));
      return { tur:'sorma', sorma:SK.sorma };
    }
    /* King 5 tur 5 (klon simülasyonu): «bugün hiç çalışmadım cuma ya», «dün hiçbir şey yapmadım» teknik
       retle («yapılmış bir işi anlatmıyor») ya da «Bugün açılıyor»la karşılanıyordu. Kayıt yazılmaz;
       King insanca karşılar, planı olan modülde yarını hafifletmeyi önerir. */
    if(OLUMSUZ_GUN_RE.test(t0) && !KI.soruMu(metin) && !/\d/.test(t0)){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.bekleyenTanisma = null;
      const A = KI.ARAC && KI.ARAC();
      const hafif = A && A.bul && A.bul(KI.ayar.modul + '_gecici_sure');
      KI.cipler = hafif ? [{ ad:'Yarını hafiflet', is:'doldur:yarın sadece 90 dakika çalışacağım' }] : null;
      KI.soyle('Olur böyle günler; kayda bir şey yazmadım.' + (hafif ? ' İstersen yarını biraz hafifletelim, tekrar ritme girmek kolaylaşır.' : ' Yarın kaldığın yerden devam ederiz.'));
      return { tur:'olumsuz-gun' };
    }
    }
    /* Söz 22: hafıza komutları. */
    const HK = KI.L.Hafiza && KI.hafiza() ? KI.L.Hafiza.komut(metin) : null;
    if(HK){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyenTanisma = null; KI.cipler = null;
      if(HK.tur === 'liste'){ KI.disKisiTazele().then(() => { if(KI.acik && KI.menu === 'kisi') KI.ciz(false); }); KI.menu = 'kisi'; KI.ciz(false); return { tur:'kisi' }; }
      const r = await KI.hafiza().komutIsle(metin);
      KI.soyle(r ? r.text : 'Anlayamadım.');
      return { tur:'hafiza' };
    }
    /* Hafızadakini soran cümleyi kural cevaplar, model değil (hafiza.js sorudaBul). */
    { const H = KI.L.Hafiza && KI.L.Hafiza.sorudaBul && KI.hafiza();
      const bul = H ? KI.L.Hafiza.sorudaBul(H.liste(), metin) : [];
      if(bul.length){
        KI.akis.push({ kim:'sen', metin:String(metin).trim() });
        KI.bekleyenTanisma = null; KI.cipler = null;
        if(bul.length === 1) KI.soyle('Bana şöyle demiştin: «' + bul[0].metin + '».');
        else KI.soyle('Bana şunları demiştin:', bul.map(x => '«' + x.metin + '»'));
        return { tur:'hafiza-cevap', n:bul.length };
      }
    }
    if(KI.YORUMLA.test(t0) && KI.hafiza() && KI.L.CIKARIM){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyenTanisma = null; KI.cipler = null;
      const n = KI.cikarimAdaylari().length;
      if(n){ KI.soyle(yz('ortak.king-yol.cikarimlarimi-sohbette-sormu') + n + ' tanesi kararını bekliyor.'); return { tur:'cikarim-onaylar', n }; }
      KI.soyle(yz('ortak.king-yol.simdilik-yeni-bir-cikarimim'));
      return { tur:'cikarim-yok' };
    }
    /* Söz 22: tanışma sorusunun cevabı (komut ya da veri değilse). */
    if(KI.bekleyenTanisma){
      const y0 = KI.yorumla(metin);
      /* Cevap içinde sayfa sözü geçebilir («kitap okumak»): yalnız veri
         cümlesi ve açık «aç» komutu cevap sayılmaz. */
      /* Selam, soru ya da tek kelimelik laf cevap DEĞİLDİR (2026-10-18:
         «MERHABA» «senin cümlenle not ettim» diye hafızaya yazılıyordu).
         Soru sessizce bırakılır, mesaj sohbet olarak akar. */
      if(KI.cevapGibi(metin) && !(y0.tur === 'veri' || (y0.tur === 'git' && y0.kaynak === 'komut'))){
        KI.akis.push({ kim:'sen', metin:String(metin).trim() });
        await KI.tanismaCevapla(metin);
        return { tur:'tanisma' };
      }
      KI.cipler = null;
      KI.bekleyenTanisma = null;
    }
    /* Söz 36: «bu sistemde ne var, nerede, nasıl yapılır» — kodun haritası. */
    if(KI.HARITA_RE.test(t0) && !KI.veriGibi(metin)) return KI.haritaIsle(metin);
    /* A3 hızlı yol (KING-4): cümleden parametresi çıkan araç (arac.js söz 4)
       sayfa ve veri tahmininden önce; okuma sorusu sayfa açmaz, sistemden
       cevaplanır. Yazan araç yine önizlenir ve onay ister. */
    const KA = KI.ARAC() && !KI.paylasim && !HIS_RE.test(t0) && !ILISKI_RE.test(t0) ? KI.ARAC().kuralla(metin) : null;   // his cümlesi araca düşmez (King 5 tur 5)
    if(KA){
      const sen = { kim:'sen', metin:String(metin).trim() };
      KI.akis.push(sen);
      KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
      const rk = await KI.aracIsle({ arac:[KA] }, metin);
      if(rk) return rk;
      KI.akis = KI.akis.filter(m => m !== sen);
    }
    /* Söz 20: sistem içindeki değişiklik kataloğa (yetki.js). */
    const Y = KI.yetkiKatalog();
    const yn = Y && !KI.paylasim ? Y.anla(metin) : null;
    if(yn){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.bekleyenYetki = null; KI.cipler = null;
      if(yn.tur === 'hesap'){ KI.soyle(yn.metin); return { tur:'yetki-hesap' }; }
      if(yn.tur === 'olumsuz'){ KI.soyle(yz('ortak.king-yol.olumsuz-bir-istek-hicbir-sey')); return { tur:'yetki-olumsuz' }; }
      if(yn.tur === 'baska'){ KI.soyle(yn.metin); return { tur:'yetki-baska', modul:yn.modul }; }
      if(yn.tur === 'liste'){
        KI.cipler = yn.sayi ? [{ is:'yetki-hepsi', ad:yz('ortak.king-yol.hepsini-onayla') }] : null;
        KI.soyle(yn.metin, yn.satirlar && yn.satirlar.length ? yn.satirlar : null);
        return { tur:'yetki-liste' };
      }
      if(yn.seviye === 'kucuk'){ await KI.yetkiUygula(yn); return { tur:'yetki', seviye:'kucuk' }; }
      KI.bekleyenYetki = yn;
      KI.cipler = [{ is:'yetki-onay', ad:KI.onayAdi(yn) }, { is:'vazgec', ad:yz('ortak.king-yol.vazgec') }];
      KI.soyle(yn.onizle.metin, yn.onizle.satirlar || null, null,
        KI.onaySorusu(yn), { onay:true });
      return { tur:'yetki-bekliyor', seviye:yn.seviye };
    }
    /* Söz 22: açık beyan kendiliğinden yazılır. */
    const bey = KI.KISI() && KI.hafiza() ? KI.KISI().beyan(metin) : null;
    let ogrenilen = null;
    if(bey){
      ogrenilen = await KI.beyanYaz(bey);
      const y1 = KI.yorumla(metin);
      if(ogrenilen && y1.tur !== 'veri'){
        KI.akis.push({ kim:'sen', metin:String(metin).trim() });
        KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
        const H = KI.hafiza(), id = ogrenilen.id;
        KI.sonGeriAl = async () => { await H.unut(id); };
        KI.cipler = [{ is:'geri-al', ad:yz('ortak.king-yol.geri-al') }];
        KI.soyle(yz('ortak.king-yol.not-ettim') + ogrenilen.metin + '». Seni daha iyi tanıyorum.', null, null, KI.KISI().BY_ID[bey.alan] ? KI.KISI().BY_ID[bey.alan].ad : null);
        return { tur:'beyan', alan:bey.alan };
      }
    }
    let y = KI.yorumla(metin);
    if(y.tur === 'bos') return y;
    /* Yorgunluk (King 5 D7, canlı deneme: «bugün çok yorgunum» «Bugün» sayfasını açıyordu). Bir his
       sayfa komutu değildir. Bugünü kısaltan araç varsa King hemen önerir (dakikayı kişi seçer);
       yoksa cümle sohbete gider. */
    if(KI.YORGUN_RE.test(t0) && !KI.soruMu(metin) && y.tur !== 'veri' && !/(kısalt|azalt|süre|dakika|saat)/.test(t0)){   // açık süre isteği kendi yolunda
      const A = KI.ARAC && KI.ARAC();
      if(A && A.bul && A.bul(KI.ayar.modul + '_gecici_sure')){
        KI.akis.push({ kim:'sen', metin:String(metin).trim() });
        KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null;
        KI.cipler = [{ ad:'Bugünü kısalt', is:'doldur:sadece bugün 30 dakika çalışacağım' }];
        KI.soyle('Anladım, yorgunsun. İstersen bugünü hafifletelim: «Bugünü kısalt»a dokun, dakikayı sen seç.');
        return { tur:'yorgun' };
      }
      if(y.tur === 'git') y = { tur:'bilinmiyor' };
    }
    /* Anlatım sorusu sayfa açmaz (King 5, deneme: «Almancada der, die, das farkını kısaca anlat» → «Dil
       açılıyor»). Açık komut («dil sayfasını aç») yine sayfadır. */
    if(y.tur === 'git' && y.kaynak !== 'komut' && /(anlat|açıkla|nedir|ne demek|farkı|nasıl yapılır|neden|örnek ver)/.test(t0)) y = { tur:'bilinmiyor' };
    if(y.tur === 'git' && y.kaynak !== 'komut' && HIS_RE.test(t0)) y = { tur:'bilinmiyor' };
    if(y.tur === 'git' && y.kaynak !== 'komut' && KI.soruMu(metin) && t0.split(' ').length > 4 && !/(aç|göster|git|nerede)/.test(t0)) y = { tur:'bilinmiyor' };
    /* A3 niyet çözücü (arac.js söz 6): kalıbı tutmayan soru ve emir araç
       kaydından seçilir. Sayfa komutu ve kayıt kendi yolunda kalır; veri
       sanılan cümleyi yalnız açık soru ya da emir geçer («… hedefini 500 yap»),
       «… bölümünü aç» sayfa değil bölüm işidir. */
    const NA = KI.ARAC() && !KI.paylasim && !HIS_RE.test(t0) ? KI.ARAC() : null;
    const ns = NA && NA.niyet ? NA.niyetSinif(metin) : null;
    /* Sayfa sözü geçen kısa cümle («haftalık programımı göster») sayfadır; Merkez'e gitme koşuluyla aynı. */
    /* Kısa emir («kitap ekle») ise iş yapar; kısa dilek («diksiyon çalışmak istiyorum») sayfadır. */
    const uzun = KI.soruMu(metin) || KI.kucuk(metin).split(' ').length > 3 || (ns === 'yaz' && !/istiyorum/.test(KI.kucuk(metin)));
    if(ns && (y.tur === 'bilinmiyor' || y.tur === 'ozet' || (y.tur === 'git' && ((y.kaynak !== 'komut' && uzun) || /bölüm/.test(KI.kucuk(metin))))
      || (y.tur === 'veri' && ns !== 'ad'))){
      const N = NA.niyet(metin, ns);
      if(N){
        const sen = { kim:'sen', metin:String(metin).trim() };
        KI.akis.push(sen);
        KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
        const rn = await KI.aracIsle({ arac:[N], niyet:true }, metin) || KI.niyetSor(N);
        if(rn) return rn;
        KI.akis = KI.akis.filter(m => m !== sen);
      }
    }
    /* Söz 16: paylaşım sürerken soru o anın karesiyle; veri cümlesi yerelde. */
    if(KI.paylasim && y.tur !== 'veri' && !(y.tur === 'git' && y.kaynak === 'komut')){
      KI.akis.push({ kim:'sen', metin:String(metin).trim() });
      KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
      let kare = null;
      const tur = KI.kameraMi() ? 'kamera' : 'ekran';
      try{ kare = KI.paylasim.kare(); }catch(e){ KI.soyle((tur === 'kamera' ? 'Kameranın' : 'Ekranın') + ' karesi alınamadı: ' + ((e && e.message) || 'bilinmeyen hata')); return { tur }; }
      await KI.gorselCevap(String(metin).trim(), kare, tur === 'kamera' && KI.INCE_OKU.test(KI.kucuk(metin)) ? 'gorsel' : 'ekran');
      return { tur };
    }
    return merkezYolu(metin, y);
  }
  /* Sohbet: anlatımdaki kayıtlar, modelsiz okuma, sonra HKM'deki King; olmazsa yerel. */
  async function merkezYolu(metin, y){
    const senMesaj = Object.assign({ kim:'sen', metin:String(metin).trim() }, KI.siradanSoru ? { sira:KI.siradanSoru.zaman } : {});
    KI.akis.push(senMesaj);
    KI.bekleyen = null;
    KI.bekleyenGit = null;
    KI.bekleyenIlet = null;
    KI.cipler = null;
    /* Söz 35: anlatımın içindeki kayıtlar tek kartta; sohbet sürer. */
    let bulunan = (y.tur === 'bilinmiyor' || y.tur === 'ozet' || y.tur === 'veri' || (y.tur === 'git' && y.kaynak !== 'komut')) ? KI.sohbettenBul(metin) : null;
    /* Tek kayıtlık cümleyi tek satır kapısı zaten önizler (söz 10); kart yalnız birden çok kayıtta. */
    if(bulunan && y.tur === 'veri' && bulunan.filter(o => o.modul !== 'defter').length < 2) bulunan = null;
    if(bulunan){
      KI.bulunanGoster(bulunan, yz('ortak.king-yol.anlattiklarinda-sunlari-buld'));
      if(!KI.baglanti()) return { tur:'bulunan', n:bulunan.length };
    }
    /* Söz 6: soru, özet ve anlaşılmayan istek HKM'deki King'e. Sayfa adı
       geçen uzun cümle («bugün için motive edici bir şey söyle») komut
       değildir; Merkez cevaplar, Merkez yoksa sayfa açılır (KING-4 A3). */
    const merkeze = !!KI.baglanti() && (!!bulunan || y.tur === 'bilinmiyor' || y.tur === 'ozet'
      || (y.tur === 'git' && y.kaynak !== 'komut' && (KI.soruMu(metin) || (y.kaynak === 'sayfa' && KI.kucuk(metin).split(' ').length > 3))));
    let neden = null, hal = null;
    /* Kapalı olanın adıyla (hesap.js merkezHalMetni); hâl bilinmiyorsa genel cümle. */
    const kopuk = () => (hal && KI.L.HESAP.merkezHalMetni ? KI.L.HESAP.merkezHalMetni(hal) + ' ' : yz('ortak.king-yol.merkeze-ulasilamadi'));
    if(merkeze){
      const bek = { kim:'king', bekliyor:true, metin:'' };
      KI.akis.push(bek);
      KI.ciz(false);
      const r = await KI.merkezeSor(metin, bek, { araclar:!bulunan });
      KI.akis = KI.akis.filter(m => m !== bek);
      /* Söz 36: model bir araç seçti; kod doğrular, okuma çalışır, yazma onay ister. */
      if(r.ok && r.arac){
        const ra = await KI.aracIsle(r, metin);
        if(ra) return ra;
        if(r.text){ KI.soyle(r.text); return { tur:'merkez', mode:'arac' }; }
        return yerel(y, null, metin);
      }
      if(r.ok && r.arastirma){
        /* Söz 38: araştırma kartı; düz metin yalnız kart çizilemezse. */
        KI.soyle('«' + r.arastirma.konu + '» için internette ve YouTube’da baktım.', null, null, null, { arastirma:r.arastirma });
        return { tur:'merkez', mode:r.mode };
      }
      if(r.ok){
        const ek = Object.assign(r.akti ? { yeni:false, okunan:r.okunan } : {}, r.k2 ? { k2:r.k2 } : {});
        KI.soyle(r.text, null, null, null, Object.keys(ek).length ? ek : null);
        /* K1: görev ya da iş kurulduysa rozet hemen tazelenir; pano bir dokunuşta. */
        if(r.mode === 'ekip'){ KI.cipler = [{ ad:yz('ortak.king-yol.ekip-ve-gorevler'), is:'ekip-ac' }]; KI.isYokla(); }
        else if(r.mode === 'beceri') KI.cipler = [{ ad:yz('ortak.king-yol.beceriler-ve-sozler'), is:'beceri-ac' }];
        else KI.cipler = KI.oneriListesi(true);                   // söz 33
        KI.ciz(false);
        /* K2: sözün cevabındaki kayıt bu modülün kutusundaysa hemen onaya sunulur. */
        if(r.k2 && r.k2.kutuya === KI.ayar.modul) KI.kutuyuSun();
        if(r.eylemler) await KI.eylemleriCalistir(r.eylemler.filter(e => e && e.tur !== 'mesaj' && e.tur !== 'soru'));
        return { tur:'merkez', mode:r.mode };
      }
      neden = r.neden;
      hal = r.hal || null;
    }
    /* K4: Merkez kurulu ama ulaşılamıyor; Merkez'e giden soru sıraya girer. */
    if(neden === 'baglanti' && !bulunan && y.tur === 'bilinmiyor'){
      const n = KI.siraEkle(metin);
      /* Sıradan yeniden deneme başarısızsa sohbete hiçbir şey yazılmaz (dakikada bir gürültü olurdu). */
      if(KI.siradanSoru){ KI.akis = KI.akis.filter(m => m !== senMesaj); KI.ciz(false); return { tur:'sira', n, sessiz:true }; }
      KI.cipler = [{ ad:yz('ortak.king-yol.sirayi-gor'), is:'bolum:kutuphane' }];
      KI.soyle(kopuk() + yz('ortak.king-yol.siraya-aldim') + n + ' soru var.');
      KI.siraPlanla();
      return { tur:'sira', n };
    }
    return yerel(y, neden, metin, kopuk);
  }

  /* Yerel King (HKM yoksa ya da cevap veremediyse; sayfa ve kayıt hep burada). */
  function yerel(y, neden, metin, kopuk){
    if(y.tur === 'notlar'){
      KI.kapat();
      /* Defter (NOT-PLANI) kuruluysa o; değilse eski Notlarım paneli. */
      if(KI.L.DEFTER && KI.L.DEFTER.kuruluMu && KI.L.DEFTER.kuruluMu()) KI.L.DEFTER.ac();
      else if(KI.L.NOTUM && KI.L.NOTUM.panelAc) KI.L.NOTUM.panelAc();
      return y;
    }
    if(y.tur === 'ozet'){
      const s = KI.ozetSatirlari();
      KI.soyle(s.length ? (KI.MODUL_AD[KI.ayar.modul] || '') + '’de bugün:' : yz('ortak.king-yol.bugun-icin-henuz-bir-sey'), s);
    }else if(y.tur === 'sor'){
      KI.soyle(y.cevap);
    }else if(y.tur === 'git' && y.kaynak === 'niyet' && y.hedef.modul !== KI.ayar.modul && KI.veriGibi(y.metin)){
      /* Söz 10: öteki modülün VERİSİ («fasulye yedim») tahmin edilmez; iletilir. */
      const s = KI.SAYFALAR.find(x => x.modul === y.hedef.modul && x.route === y.hedef.route);
      const ad = KI.MODUL_AD[y.hedef.modul];
      KI.bekleyenGit = y.hedef;
      const giris = !!(KI.L.HESAP && KI.L.HESAP.durum && KI.L.HESAP.durum().oturum && KI.L.HESAP.gelenBirak);
      KI.bekleyenIlet = giris ? { modul:y.hedef.modul, metin:y.metin } : null;
      KI.cipler = (giris ? [{ ad:ad + '’ye ilet', is:'ilet' }] : []).concat([{ ad:(s ? s.ad : ad) + ' aç', is:'git-onay' }, { ad:yz('ortak.king-yol.gerek-yok'), is:'vazgec' }]);
      KI.soyle(KI.sohbet({ tur:null }, y.metin, false).selam, null, null,
        giris ? yz('ortak.king-yol.bu') + ad + '’nin işi. ' + ad + '’ye ileteyim mi? ' + ad + ' açılınca Onaylar’a düşer, sen onaylayınca yazılır.'
          : yz('ortak.king-yol.bu') + ad + '’nin işi; buradan kaydedemem. ' + ad + '’yi açayım mı? (İletmek için hesaba giriş gerekir.)');
    }else if(y.tur === 'git'){
      KI.soyle(KI.eylemCumlesi(y.hedef, y.cevap));
      KI.ortam.zamanla(() => KI.git(y.hedef), KI.sesli ? 1100 : 650);
    }else if(y.tur === 'veri'){
      KI.bekleyen = y.onizleme;
      const s = y.sohbet || KI.sohbet(y.onizleme, '', !!y.gelecek);
      /* Söz 24: bu tür için «sorma» dendiyse doğrudan kaydet («Geri al» kalır). */
      if(!y.gelecek && KI.sormaMi(y.onizleme.tur)) return kaydet(s.selam).then(() => y);
      KI.cipler = [{ ad:yz('ortak.king-yol.evet-ekle'), is:'kaydet' }, { ad:yz('ortak.king-yol.hayir'), is:'vazgec' }];
      KI.soyle(s.selam, null,
        { metin:y.onizleme.metin, liste:(y.onizleme.parcalar || []).length > 1 ? y.onizleme.parcalar.map(x => x.metin) : null,
          ipucu:y.gelecek ? yz('ortak.king-yol.henuz-yapmadiysan-yaptiktan') : (y.onizleme.ipucu || '') },
        s.soru);
    }else if(KI.SELAM.test(String(metin || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim())){
      /* Selam selamla karşılanır (2026-10-18: «MERHABA»ya «anlayamadım» denmesin). */
      KI.soyle(KI.selam());
    }else{
      const on = neden === 'yok' ? yz('ortak.king-yol.king-in-modeli-su-an-kapali')
        : neden === 'baglanti' ? (kopuk ? kopuk() : yz('ortak.king-yol.merkeze-ulasilamadi')) : '';
      KI.soyle(on + yz('ortak.king-yol.bunu-anlayamadim-sunlardan-b')
        + '«bugünün özeti» gibi yazabilirsin.');
    }
    return y;
  }

  async function kaydet(onEk){
    const p = KI.bekleyen;
    KI.bekleyen = null;
    KI.cipler = null;
    if(!p) return;
    try{
      const r = await p.kaydet();
      const metinR = r && typeof r === 'object' ? r.metin : r;
      KI.sonGeriAl = r && typeof r === 'object' && typeof r.geriAl === 'function' ? r.geriAl : null;
      const m = String((metinR && String(metinR)) || 'Ekledim').trim().replace(/[.!]*$/, '.');
      if(KI.sonGeriAl) KI.cipler = [{ ad:yz('ortak.king-yol.geri-al'), is:'geri-al' }];
      KI.eylemYaz({ arac:'kayit.' + (p.tur || 'veri'), ozet:String(p.metin || metinR || 'Kayıt'), geriAl:KI.sonGeriAl });
      /* Kayıt yazıldı: zeminde tek seferlik ışık (zemin.js nabiz). */
      if(KI.L.ZEMIN && typeof KI.L.ZEMIN.nabiz === 'function'){ try{ KI.L.ZEMIN.nabiz(); }catch(e){ /* süs */ } }
      KI.soyle((onEk ? String(onEk).trim() + ' ' : '') + m + ' Başka bir şey var mı?');
    }catch(e){
      KI.soyle(yz('ortak.king-yol.kaydedilemedi') + ((e && e.message) || 'bilinmeyen hata'));
    }
  }

  function vazgec(){
    const git0 = !!KI.bekleyenGit;
    const foto0 = !!KI.bekleyenFoto || KI.fotoHedef != null;
    const yetki0 = !!KI.bekleyenYetki;
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.bekleyenFoto = null; KI.bekleyenYetki = null; KI.bekleyenNiyet = null; KI.cipler = null; KI.fotoHedef = null;
    KI.soyle(yetki0 ? yz('ortak.king-yol.tamam-hicbir-seyi-degistirme') : git0 || foto0 ? yz('ortak.king-yol.tamam-buradayim') : yz('ortak.king-yol.tamam-eklemedim'));
  }

  /* ------------------------------------------------------- olaylar */

  let bagli = false, sonCtrl = 0, baskaTus = false, basili = null, mikBasili = null;
  /* Sayfa gizlenince kamera durur; ekran paylaşımı sürer (paylaşılan pencereye
     geçmek sayfayı gizler, işin kendisi budur). Sayfa kapanınca ikisi de durur. */
  function gorunurluk(){
    if(!KI.kameraMi() || !KI.ortam.gizli()) return;
    KI.paylasimKapat();
    if(KI.acik) KI.ciz(false);
  }
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('visibilitychange', gorunurluk);
    if(typeof window !== 'undefined') window.addEventListener('pagehide', () => { KI.paylasimKapat(); });
    document.addEventListener('keydown', e => {
      /* Söz 21 ek: boş kutuda ↑ son mesajı geri getirir. */
      if(e.key === 'ArrowUp' && KI.acik && e.target && e.target.matches && e.target.matches('.king__girdi') && !e.target.value){
        const son = KI.akis.filter(m => m.kim === 'sen' && !m.foto && m.metin).slice(-1)[0];
        if(son){ e.preventDefault(); e.target.value = son.metin; try{ e.target.setSelectionRange(son.metin.length, son.metin.length); }catch(er){ /* yok */ } }
        return;
      }
      if(e.key === 'Escape' && KI.acik && KI.menu){ e.preventDefault(); KI.menu = null; KI.silOnay = null; KI.ciz(false); return; }
      if(e.key === 'Escape' && KI.acik){ e.preventDefault(); KI.sesli = false; KI.kapat(); return; }
      if(e.key !== 'Control'){ baskaTus = true; return; }
      if(e.repeat) return;
      const s = Date.now();
      if(!baskaTus && s - sonCtrl < 400){ sonCtrl = 0; !KI.acik ? KI.ac({ mini:true }) : KI.mini ? KI.buyut() : KI.kapat(); return; }   // ada önce
      sonCtrl = s;
      baskaTus = false;
    }, true);
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      /* Kabuktaki «Kartlarım» (sistem menüsü): büyük King, Araçlar › Düzenle. Yayılım sürer: kabuk menüsünü kapatır. */
      if(t.closest('[data-king-kartlarim]')){ e.preventDefault(); KI.ac(); KI.kvDuzen = true; if(!(KI.bolum === 'araclar' && KI.listeGorunur())) KI.bolumSec('araclar'); else KI.ciz(false); return; }
      if(t.closest('[data-king-ac]')){ e.preventDefault(); e.stopPropagation(); KI.ac({ mini:true }); return; }   // ada önce
      /* Söz 9: perde ve dışarısı KAPATMAZ, küçültür; küçükken sayfa serbest. */
      if(t.closest('.king-perde')){ e.preventDefault(); e.stopPropagation(); KI.kucult(); return; }
      /* Dar ekranda açık kenar çubuğu: sohbete dokununca kapanır (söz 26). */
      if(KI.yanAcik && t.closest('.king__ana') && !t.closest('[data-king="yan"]')){ KI.yanAcik = false; KI.ciz(false); return; }
      /* G: dar ekranda çalışma alanı sohbetin üstünde katman; sohbetin boş yerine dokununca kapanır. */
      if(KI.menu && !KI.mini && !KI.ortam.genis() && t.closest('.king__ana') && !t.closest('[data-king]:not(.king)')){ KI.menu = null; KI.ciz(false); return; }
      const k = t.closest('[data-king]');
      if(!k){ if(KI.acik && !KI.mini) KI.kucult(); return; }
      if(KI.konusuyor > 0 && t.closest('.king__kure')){ KI.sus(); return; }
      /* Vitrin: kartın eylemi sohbete döner ve orada çalışır. */
      if(t.closest('[data-king-sohbete]') && KI.bolum === 'kutuphane'){ KI.bolum = 'sohbet'; KI.kvGiris = true; if(!KI.ortam.genis()) KI.yanAcik = false; }
      const vk = t.closest('[data-king-vitrin] [data-king]');
      if(vk && KI.bolum === 'araclar' && !/^kv-/.test(vk.getAttribute('data-king'))){ KI.bolum = 'sohbet'; KI.kvGiris = true; if(!KI.ortam.genis()) KI.yanAcik = false; }
      /* Araçlar: dar ekranda liste sohbetin üstünde; seçince kapanır, sonuç görünür. */
      if(t.closest('[data-king-araclar] [data-king]') && !KI.ortam.genis()) KI.yanAcik = false;
      const h = t.closest('[data-king-hazir]');
      if(h){ KI.hazirSec(Number(h.getAttribute('data-king-hazir'))); return; }
      const c = t.closest('[data-king]:not(.king)');
      if(c){
        const is = c.getAttribute('data-king');
        if(KI.aracAcik && is !== 'arac') KI.aracAcik = false;          // söz 27: menüden seçince kapanır
        if(KI.kipAcik && is !== 'kipler') KI.kipAcik = false;           // kip menüsü de aynı kural
        if(is === 'kipler'){ KI.kipAcik = !KI.kipAcik; KI.aracAcik = false; KI.ciz(false); if(KI.kipAcik) KI.kamTazele(); return; }
        /* G: ray, çalışma alanı, «+» menüsündeki yeni satırlar. */
        if(/^bolum:[a-z]+$/.test(is)){ KI.bolumSec(is.slice(6)); return; }
        if(/^doldur:/.test(is)){ KI.doldurulacak = is.slice(7); KI.ciz(true); return; }
        if(is === 'alan-kapat'){ KI.menu = null; KI.silOnay = null; KI.ciz(false); return; }
        if(is === 'onizle-buyut'){ KI.alanAc('onizle'); return; }
        if(/^ars-ac:\d+$/.test(is)){ KI.alanAc('ars:' + is.slice(7)); return; }
        if(is === 'pdf-sec'){ const f = document.querySelector('[data-king-pdf]'); if(f) f.click(); return; }
        if(is === 'barkod'){ const n = KI.barkodNo(); if(n >= 0) KI.isSec(n); else KI.ciz(false); return; }
        if(/^oner-metin:/.test(is)){ isle(is.slice(11)); return; }
        if(/^bul-sec:\d+:\d+$/.test(is)){ const p = is.split(':'), m = KI.akis[Number(p[1])], o = m && m.bulunan && m.bulunan.ogeler[Number(p[2])];
          if(o && o.durum === 'bekliyor'){ o.secili = !o.secili; KI.ciz(false); } return; }
        if(/^bul-kaydet:\d+$/.test(is)){ KI.bulunanKaydet(Number(is.slice(11))); return; }
        if(/^bul-vazgec:\d+$/.test(is)){ const m = KI.akis[Number(is.slice(11))];
          if(m && m.bulunan){ m.bulunan.ogeler.forEach(o => { if(o.durum === 'bekliyor'){ o.durum = 'vazgecildi'; delete KI.bulunanIs[o.id]; } }); m.bulunan.bitti = true; KI.sakla(); KI.soyle(yz('ortak.king-yol.tamam-hicbirini-kaydetmedim')); } return; }
        if(/^bul-git:(ays|spi|esp):/.test(is)){ const p = is.split(':'); KI.cipler = null; KI.git({ modul:p[1], route:p[2] || 'today' }); return; }
        if(/^sira-ac:\d+:\d+$/.test(is)){ const p = is.split(':'), m = KI.akis[Number(p[1])], x = m && m.sirali && m.sirali[Number(p[2])];
          if(x && KI.ayar.kartlar && KI.ayar.kartlar.oncelikAc){ KI.kucult(); Promise.resolve(KI.ayar.kartlar.oncelikAc(x.ham || x)).catch(() => {}); } return; }
        if(is === 'defter-ac'){ const Df = KI.D(); if(Df){ KI.kucult(); try{ Df.ac(); }catch(e){ /* açılamadı */ } } return; }
        if(/^gunluk-his:[0-5]$/.test(is)){ if(KI.gunlukBekle && KI.gunlukMetin) KI.gunlukBitir(Number(is.slice(11))); return; }
        if(/^deney-olcu:/.test(is)){ KI.deneyOlcuSec(is.slice(11)); return; }
        if(/^tarz:(samimi|resmi|kisa)$/.test(is)){ KI.tarzSec(is.slice(5)); return; }
        if(is === 'odak-dur'){ odakDur(); return; }
        if(/^odak-kaydet:\d+:/.test(is)){ const p = is.split(':'); KI.cipler = null; isle(p[1] + ' dk ' + (decodeURIComponent(p.slice(2).join(':')) || 'çalıştım')); return; }
        if(/^soru-cevap:\d+:[A-E]$/.test(is)){ const p = is.split(':'); KI.soruCevapla(Number(p[1]), p[2]); return; }
        if(/^sozet-dinle:\d+$/.test(is)){ const x = KI.sozetler()[Number(is.slice(12))]; if(x) KI.seslendir(KI.sozetMetni(x)); return; }
        if(/^sira-sil:\d+$/.test(is)){ const l = KI.sira(); l.splice(Number(is.slice(9)), 1); KI.siraYaz(l); KI.ciz(false); return; }
        if(/^ders-(ileri|geri):\d+$/.test(is)){ const p = is.split(':'); KI.dersAdim(Number(p[1]), p[0] === 'ders-ileri' ? 1 : -1); return; }
        if(/^ders-soru:\d+$/.test(is)){ const m = KI.akis[Number(is.slice(10))];
          if(m && m.ders && m.ders.kd){ KI.cipler = null; KI.kdSoru(m.ders.id); return; }
          if(m && m.ders) isle('bana soru sor ' + m.ders.sorgu); return; }
        if(/^yap:/.test(is)){ const l = KI.yapilacaklar(), x = l.find(y => y.id === is.slice(4)); if(x){ x.bitti = !x.bitti; KI.yapYaz(l); KI.ciz(false); } return; }
        if(/^hat-sil:/.test(is)){ KI.hatirYaz(KI.hatirlatmalar().filter(x => x.id !== is.slice(8))); KI.cipler = null; KI.soyle(yz('ortak.king-yol.hatirlatmayi-iptal-ettim')); KI.hatirlatKur(); return; }
        if(/^yasa-deney:\d+:\d+$/.test(is)){ const p = is.split(':'), m = KI.akis[Number(p[1])], y = m && m.yasa && m.yasa.l[Number(p[2])];
          if(y) isle('deney başlat: ' + y.deney); return; }
        if(/^gun-baslat:\d+:\d+$/.test(is)){ const p = is.split(':'), m = KI.akis[Number(p[1])], x = m && m.gun && m.gun.ogeler[Number(p[2])];
          if(x){ KI.cipler = null; odakBaslat(x.dk || 25, x.ad); KI.soyle((x.dk || 25) + ' dakikalık odak başladı (' + x.ad + '). Süre dolunca haber vereceğim.'); } return; }
        if(/^gun-ac:\d+:\d+$/.test(is)){ const p = is.split(':'), m = KI.akis[Number(p[1])], x = m && m.gun && m.gun.ogeler[Number(p[2])];
          if(x && x.route){ KI.cipler = null; KI.git({ modul:m.gun.modul, route:x.route }); } return; }
        if(is === 'derse-cevir'){ if(KI.kaynakMetin){ KI.cipler = null; KI.derseCevir(KI.kaynakMetin.metin, KI.kaynakMetin.ad); } return; }
        if(/^kd-ac:\d+$/.test(is)){ const d = KI.kdDersler()[Number(is.slice(6))]; if(d){ KI.cipler = null; KI.soyle(d.baslik + ' · ders', null, null, null, { ders:KI.kdDersMesaji(d) }); } return; }
        if(/^kut-filtre:[a-z]+$/.test(is)){ KI.kutFiltre = is.slice(11); KI.kutBuyuk = null; if(KI.bolum !== 'kutuphane') KI.bolum = 'kutuphane'; if(!KI.ortam.genis()) KI.yanAcik = false; KI.ciz(false); return; }
        if(/^gorsel-buyut:/.test(is)){ KI.kutBuyuk = is.slice(13) || null; KI.ciz(false); return; }
        if(/^gorsel-sil:/.test(is)){ KI.ortam.depo.yaz(KI.GORSEL, KI.gorseller().filter(x => x.id !== is.slice(11))); KI.kutBuyuk = null; KI.ciz(false); return; }
        if(is === 'kv-duzen'){ KI.kvDuzen = !KI.kvDuzen; KI.kvSecili = null; KI.kvYeni = false; KI.ciz(false); return; }
        if(is === 'kv-yeni'){ const g = document.querySelector('.king__girdi'); KI.kvTaslak = g ? g.value.trim() : ''; KI.kvYeni = true; KI.kvSecili = null; KI.ciz(false);
          const a = document.querySelector('[data-king-kv-form] [name="ad"]'); if(a) try{ a.focus({ preventScroll:true }); a.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(e){ /* eski tarayıcı */ } return; }
        if(is === 'kv-yeni-kapat'){ KI.kvYeni = false; KI.ciz(false); return; }
        if(/^kv-sec:/.test(is)){ const x = is.slice(7); KI.kvSecili = x && KI.kvSecili !== x ? x : null; KI.ciz(false); return; }
        if(/^kv-sabit:/.test(is)){ KI.kartSabitle(is.slice(9)); KI.ciz(false); return; }
        if(/^kv-renk:/.test(is)){ KI.kartSus(KI.kvSecili, 'renk', is.slice(8)); KI.ciz(false); return; }
        if(/^kv-emoji:/.test(is)){ KI.kartSus(KI.kvSecili, 'emoji', is.slice(9)); KI.ciz(false); return; }
        if(/^kv-tasi:-?1$/.test(is)){ KI.kartTasi(KI.kvSecili, Number(is.slice(8))); KI.ciz(false); return; }
        if(/^kv-sil:/.test(is)){ KI.kartSil(is.slice(7)); KI.kvSecili = null; KI.ciz(false); return; }
        if(is === 'kv-varsayilan'){ KI.kartSus(KI.kvSecili, 'renk', ''); KI.kartSus(KI.kvSecili, 'emoji', ''); KI.ciz(false); return; }
        if(is === 'kv-sifirla'){ const A = KI.kartAyar(); A.sabit = null; KI.kartYaz(A); KI.ciz(false); return; }
        if(/^vitrin-git:\d+$/.test(is)){ const el = document.getElementById('kv-' + is.slice(11)); if(el) try{ el.scrollIntoView({ block:'start', behavior:'smooth' }); }catch(e){ /* eski tarayıcı */ } return; }
        if(/^ders-tekrar:\d+$/.test(is)){ KI.dersTekrar(Number(is.slice(12))); return; }
        if(/^ders-dinle:\d+$/.test(is)){ const m = KI.akis[Number(is.slice(11))], b = m && m.ders && m.ders.bolumler[m.ders.adim];
          if(b) KI.seslendir([b.baslik, b.metin].concat(b.liste, b.dikkat ? [yz('ortak.king-yol.dikkat') + b.dikkat] : []).filter(Boolean).join('. ').replace(/\*\*/g, '')); return; }
        if(/^ders-ac:\d+$/.test(is)){ const m = KI.akis[Number(is.slice(8))], K = KI.ayar && KI.ayar.kartlar;
          if(m && m.ders && K && K.dersAc){ KI.kucult(); Promise.resolve(K.dersAc(m.ders.id)).catch(() => {}); } return; }
        if(/^soru-yeni:\d+$/.test(is)){ const m = KI.akis[Number(is.slice(10))]; isle('bana bir soru daha sor' + (m && m.soru && m.soru.sorgu ? ' ' + m.soru.sorgu : '')); return; }
        if(/^derinlik:(oto|hizli|dengeli|derin)$/.test(is)){ KI.derinlikSec(is.slice(9)); return; }
        if(is === 'kapat'){ KI.sesli = false; KI.kapat(); return; }
        if(is === 'dinle'){ if(mikBasili === 'oldu'){ mikBasili = null; return; } KI.dinle(); return; }
        if(is === 'kucult'){ KI.kucult(); return; }
        if(is === 'buyut'){ KI.buyut(); return; }
        if(is === 'deste:eski'){ KI.deste++; KI.ciz(false); return; }
        if(is === 'deste:yeni'){ KI.deste = Math.max(0, KI.deste - 1); KI.ciz(false); return; }
        if(/^ada-kip:(kamera|ekran)$/.test(is)){ KI.buyut(); KI.kipSec(is.slice(8)).then(() => KI.ciz(false)); return; }
        if(is === 'ilet'){ KI.ilet(); return; }
        if(is === 'ekran'){ KI.ekranGoster(); return; }
        if(is === 'paylas'){ KI.paylasimBaslat(); return; }
        if(is === 'paylasim-bitir'){ KI.paylasimBitir(); return; }
        if(is === 'foto-yorum'){ KI.fotoYorumla(); return; }
        if(is === 'sohbet'){ KI.sesliSohbetAc(); KI.ciz(false); return; }
        if(is === 'geri-al'){ KI.geriAlYap(); return; }
        if(/^yardim:[a-z-]+:\d+(:\d+)?$/.test(is)){ KI.yardimTikla(is.slice(7)); return; }
        if(/^eylem-geri:[hy]\d+$/.test(is)){ KI.eylemGeriAl(is.slice(11)); return; }
        if(/^yazma:(yaz|ses):[01]$/.test(is)){ const p = is.split(':'); yazmaSec(p[1], p[2] === '1'); return; }
        if(/^kopyala-mesaj:\d+$/.test(is)){
          const m = KI.akis[Number(is.split(':')[1])];
          if(m){
            const metin = [m.metin].concat(m.satirlar || [], m.onizleme ? [m.onizleme.metin] : [], m.son ? [m.son] : []).filter(Boolean).join('\n');
            Promise.resolve(KI.ortam.kopyala(metin)).then(ok => {
              if(!ok) return;
              c.classList.add('is-kopyalandi'); c.setAttribute('aria-label', 'Kopyalandı');
              setTimeout(() => { c.classList.remove('is-kopyalandi'); c.setAttribute('aria-label', yz('ortak.king-yol.cevabi-kopyala')); }, 1400);
            });
          }
          return;
        }
        if(/^env:[1-5]$/.test(is) && KI.envanter){ KI.akis.push({ kim:'sen', metin:is.slice(4) }); KI.envanterIlerle(Number(is.slice(4))); return; }
        if(is === 'env-dur'){ KI.envanter = null; KI.cipler = null; KI.soyle(yz('ortak.king-yol.tamam-envanteri-biraktim-ist')); return; }
        if(is === 'sorma-sifirla'){ KI.ortam.depo.sil(KI.SORMA); KI.ciz(false); return; }
        if(is === 'tanisma-atla'){ KI.bekleyenTanisma = null; KI.cipler = null; KI.soyle(yz('ortak.king-yol.tamam-baska-zaman')); return; }
        if(is === 'kisi'){ KI.menuAc('kisi'); KI.disKisiTazele().then(() => { if(KI.acik && KI.menu === 'kisi') KI.ciz(false); }); return; }
        if(/^kisi-izin:[a-z]+:(ays|spi|esp)$/.test(is)){
          const p = is.split(':'), K = KI.KISI(), H = KI.hafiza();
          if(K){ K.izinDegistir(p[1], p[2], !K.izinli(p[1], p[2])); if(H && H.hkmeGonder) H.hkmeGonder(); KI.ciz(false); }
          return;
        }
        if(/^kisi-sil:/.test(is)){ const H = KI.hafiza(); if(H) H.unut(is.slice(9)).then(() => KI.ciz(false)); return; }
        if(is === 'kisi-ekle'){
          const H = KI.hafiza(), kt = c.closest('.king__menu');
          const al = kt && kt.querySelector('[data-kisi-alan]'), gi = kt && kt.querySelector('[data-kisi-metin]');
          const alan = al ? al.value : 'sevgi', m = gi ? gi.value.trim() : '';
          if(H && m) H.ekle(m, { katman:'soz', kaynak:'kullanici', alan }).then(() => { KI.kisiYeni = { alan, metin:'' }; KI.ciz(false); });
          return;
        }
        if(is === 'yetki-onay'){ KI.yetkiUygula(); return; }
        if(is === 'yetki-hepsi'){ const Y = KI.yetkiKatalog(); const n = Y && Y.anla('hepsini onayla'); if(n && n.tur === 'eylem') KI.yetkiUygula(n); return; }
        if(is === 'menu'){ KI.menuAc('menu'); return; }
        if(is === 'ekip-ac'){ if(KI.mini) KI.buyut(); KI.cipler = null; KI.ekipAc(); return; }
        if(/^is-iptal:\d+$/.test(is)){ KI.isIptal(Number(is.slice(9))); return; }
        if(/^gorev-onayla:\d+$/.test(is)){ KI.gorevEylem(Number(is.slice(13)), 'onayla'); return; }
        if(/^gorev-iptal:\d+$/.test(is)){ const id = Number(is.slice(12));
          if(KI.gorevIptalOnay === id) KI.gorevEylem(id, 'iptal'); else { KI.gorevIptalOnay = id; KI.ciz(false); } return; }
        if(is === 'uyan:0' || is === 'uyan:1'){ KI.uyanSec(is === 'uyan:1'); return; }
        if(is === 'beceri-ac'){ if(KI.mini) KI.buyut(); KI.cipler = null; KI.beceriAc(); return; }
        if(/^beceri-(ac|kapat):\d+$/.test(is)){ const p = is.split(':'); KI.beceriYap(Number(p[1]), p[0].slice(7)); return; }
        if(/^beceri-sil:\d+$/.test(is)){ const id = Number(is.slice(11));
          if(KI.beceriSilOnay === id) KI.beceriYap(id, 'sil'); else { KI.beceriSilOnay = id; KI.ciz(false); } return; }
        if(/^beceri-duzelt:\d+$/.test(is)){ const id = Number(is.slice(14)); KI.beceriDuzelt = id || null; KI.beceriSilOnay = null; KI.ciz(false);
          const g = document.querySelector('[data-king-beceri-form] [name="ad"]'); if(g) try{ g.focus(); }catch(e){} return; }
        if(/^soz-sil:\d+$/.test(is)){ KI.sozSil(Number(is.slice(8))); return; }
        if(/^k2-soz:\d+:\d+$/.test(is)){ const p = is.split(':'); KI.sozSil(Number(p[1]), Number(p[2])); return; }
        if(/^k2-cevap:\d+:\d+$/.test(is)){ const p = is.split(':'); KI.cevapGeri(Number(p[1]), Number(p[2])); return; }
        if(is === 'beceri-arac'){ const x = KI.bekleyenArac; KI.bekleyenArac = null; KI.cipler = null; if(x) KI.aracIsle({ arac:[x] }, ''); else KI.ciz(false); return; }
        if(is === 'kayitlar'){ KI.menuAc('kayitlar'); return; }
        if(is === 'yeni-sohbet'){ KI.yeniSohbet(); return; }
        if(/^kip:(yaz|dinle|konus|ekran|kamera)$/.test(is)){ KI.aracAcik = false; KI.kipSec(is.slice(4)).then(() => KI.ciz(false)); return; }
        if(is === 'arac'){ KI.aracAcik = !KI.aracAcik; KI.aracSayfa = null; KI.ciz(false); return; }
        if(is === 'isler' || is === 'isler-geri'){ KI.aracAcik = true; KI.aracSayfa = is === 'isler' ? 'isler' : null; KI.ciz(false); return; }
        if(/^is-sec:\d+$/.test(is)){ KI.aracSayfa = null; KI.isSec(Number(is.slice(7))); return; }
        if(/^kam-is:\d+$/.test(is)){ KI.kameraIs(Number(is.slice(7))); return; }
        if(/^ars-dinle:\d+$/.test(is)){ const a = KI.akis[Number(is.slice(10))] && KI.akis[Number(is.slice(10))].arastirma; if(a && a.ozet) KI.seslendir(a.ozet); return; }
        if(/^ars-ekle:\d+$/.test(is)){ KI.arastirmaEkle(Number(is.slice(9))); return; }
        if(is === 'is-kamera'){ KI.isKamera(); return; }
        if(is === 'sus'){ KI.sus(); return; }
        if(is === 'ekran-sor'){ isle(yz('ortak.king-yol.ekranda-ne-goruyorsun-kisaca')); return; }
        if(is === 'kamera-sor'){ isle(yz('ortak.king-yol.kamerada-ne-goruyorsun-kisac')); return; }
        if(is === 'ekran-ses'){ KI.sesliSohbetAc(); KI.ciz(false); return; }
        if(is === 'goz:0' || is === 'goz:1'){ KI.gozSec(is === 'goz:1'); return; }
        if(is === 'klasor-yeni'){ KI.klasorYeni = !KI.klasorYeni; KI.ciz(false); const g = document.querySelector('[data-king-klasor-ad]'); if(g) try{ g.focus(); }catch(e){} return; }
        if(/^klasor-sil:/.test(is)){ KI.klasorSil(is.slice(11)); KI.ciz(false); return; }
        if(/^gecmis-sil:/.test(is)){ KI.kayitSil(is.slice(11)); return; }
        if(/^sabitle:/.test(is)){ KI.kayitSabitle(is.slice(8)); KI.ciz(false); return; }
        if(/^adlandir:/.test(is)){ KI.adlandirilan = is.slice(9); KI.ciz(false); const g = document.querySelector('[data-king-ad]'); if(g) try{ g.focus(); g.select(); }catch(e){} return; }
        if(/^tasi:/.test(is)){ KI.tasinan = KI.tasinan === is.slice(5) ? null : is.slice(5); KI.ciz(false); return; }
        if(/^tasi-yap:/.test(is)){ const p = is.slice(9).split(':'); KI.kayitTasi(p[0], p[1] || null); KI.tasinan = null; KI.ciz(false); return; }
        if(is === 'yan'){ KI.yanDugme(); return; }
        if(/^kayit-ac:/.test(is)){ KI.kayitAc(is.slice(9)); return; }
        if(is === 'foto-sec'){ const f = document.querySelector('[data-king-dosya]'); if(f) f.click(); return; }
        if(is === 'sohbet-kaydet'){ KI.menu = null; KI.sohbetiKaydet(); return; }
        if(is === 'temizle'){ KI.menu = null; KI.sohbetiTemizle(); return; }
        if(is === 'geri-getir'){ KI.sohbetiGeriGetir(); return; }
        if(/^cevap:/.test(is)){ KI.cevapSec(is.slice(6)); return; }
        if(/^ses:/.test(is)){ KI.sesTercihSec(is.slice(4)); return; }
        if(/^algila:/.test(is)){ const v = is.slice(7); if(KI.ALGILA_TERCIH.indexOf(v) >= 0){ if(v === 'oto') KI.ortam.depo.sil(KI.ALGILA); else KI.ortam.depo.yaz(KI.ALGILA, v); KI.hkmDinlemezBitis = 0; } KI.ciz(false); return; }
        if(is === 'mik-dene'){ KI.mikDene(); return; }
        if(/^hiz:/.test(is)){ const v = Number(is.slice(4)); if(KI.HIZLAR.indexOf(v) >= 0) KI.ortam.depo.yaz(KI.HIZ, v); KI.ciz(false); return; }
        if(is === 'hiz-sonraki'){ KI.ortam.depo.yaz(KI.HIZ, KI.HIZLAR[(KI.HIZLAR.indexOf(KI.hiz()) + 1) % KI.HIZLAR.length]); KI.ciz(false); return; }
        if(is === 'ses-sonraki'){ KI.sesTercihSec(KI.SES_TERCIH[(KI.SES_TERCIH.indexOf(KI.sesTercihi()) + 1) % KI.SES_TERCIH.length]); return; }
        if(/^kayit:/.test(is)){ KI.menu = { id:is.slice(6) }; KI.silOnay = null; KI.ciz(false); return; }
        if(/^indir:/.test(is)){ KI.kayitIndir(is.slice(6)); return; }
        if(/^kopyala:/.test(is)){ KI.kayitKopyala(is.slice(8)); return; }
        if(/^sil:/.test(is)){ KI.kayitSil(is.slice(4)); return; }
        if(/^foto:\d+$/.test(is)){ KI.fotoIsle(Number(is.slice(5))); return; }
        if(is === 'kaydet') kaydet();
        else if(is === 'git-onay') KI.gitOnayla();
        else if(is === 'vazgec') vazgec();
      }
    }, true);
    /* Söz 11: fotoğraf — düğme, yapıştır, sürükle-bırak; söz 29: mikrofon seçimi. */
    document.addEventListener('change', e => {
      const m = e.target && e.target.matches && e.target.matches('[data-king-mik]') ? e.target : null;
      if(m){ KI.mikSec(m.value); return; }
      if(e.target && e.target.matches && e.target.matches('[data-king-kam]')){ KI.kamSec(e.target.value); return; }
      if(e.target && e.target.matches && e.target.matches('[data-king-pdf]')){
        const p = e.target.files && e.target.files[0];
        if(p) KI.pdfAl(p);
        e.target.value = '';
        return;
      }
      const d = e.target && e.target.matches && e.target.matches('[data-king-dosya]') ? e.target : null;
      if(!d) return;
      const f = d.files && d.files[0];
      if(f) KI.fotoAl(f);
      d.value = '';
    }, true);
    /* K4: cihaz yeniden çevrimiçi olunca Merkez sırası. */
    if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('online', () => { KI.siraBosalt(); });
    document.addEventListener('paste', e => {
      if(!KI.acik || !e.target || !e.target.closest || !e.target.closest('[data-king]')) return;
      const it = Array.from((e.clipboardData && e.clipboardData.items) || []).find(x => /^image\//.test(x.type));
      const f = it && it.getAsFile ? it.getAsFile() : null;
      if(f){ e.preventDefault(); KI.fotoAl(f); }
    }, true);
    document.addEventListener('dragover', e => {
      if(KI.acik && e.target && e.target.closest && e.target.closest('.king__kutu')) e.preventDefault();
    }, true);
    document.addEventListener('drop', e => {
      if(!KI.acik || !e.target || !e.target.closest || !e.target.closest('.king__kutu')) return;
      const f = Array.from((e.dataTransfer && e.dataTransfer.files) || []).find(x => /^image\//.test(x.type));
      if(f){ e.preventDefault(); KI.fotoAl(f); }
    }, true);
    /* K2: becerinin düzeltme formu. */
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-beceri-form]') : null;
      if(!f) return;
      e.preventDefault();
      KI.beceriKaydet(Number(f.getAttribute('data-king-beceri-form')), f);
    });
    /* Söz 27: yeni klasör formu ve geçmişte arama. */
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-klasor]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('[data-king-klasor-ad]');
      if(KI.klasorEkle(g ? g.value : '')){ KI.klasorYeni = false; KI.ciz(false); }
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-adlandir]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('[data-king-ad]');
      KI.kayitAdlandir(f.getAttribute('data-king-adlandir'), g ? g.value : '');
      KI.adlandirilan = null; KI.ciz(false);
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-kv-form]') : null;
      if(!f) return;
      e.preventDefault();
      const ad = f.querySelector('[name="ad"]'), mt = f.querySelector('[name="metin"]'), gn = f.querySelector('[name="gonder"]:checked');
      if(!ad || !mt || !ad.value.trim() || !mt.value.trim()) return;
      const id = KI.kartEkle(ad.value, mt.value, !gn || gn.value === '1');
      KI.kvYeni = false; KI.kvTaslak = ''; KI.kvDuzen = true; KI.kvSecili = 'o:' + id; KI.ciz(false);
    });
    document.addEventListener('change', e => {
      const t = e.target && e.target.matches && e.target.matches('[data-king-kt-tasi]') ? e.target : null;
      if(t){ KI.kayitTasi(t.getAttribute('data-king-kt-tasi'), t.value || null); KI.ciz(false); }
    });
    document.addEventListener('change', e => {
      const g = e.target && e.target.matches && e.target.matches('[data-king-kv-emoji]') ? e.target : null;
      if(!g || !KI.kvSecili) return;
      KI.kartSus(KI.kvSecili, 'emoji', [...g.value.trim()].slice(0, 4).join('')); KI.ciz(false);
    });
    /* King 5 D7: yazmaya başlamak kesin niyettir; model o an ısınır, yazma süresi soğuk yüklemeyi gizler. */
    document.addEventListener('input', e => {
      if(e.target && e.target.matches && e.target.matches('.king__girdi') && e.target.value) KI.modelIsit(true);
    });
    document.addEventListener('input', e => {
      const g = e.target && e.target.matches && e.target.matches('[data-king-ara-girdi]') ? e.target : null;
      if(!g) return;
      const q = g.value.toLocaleLowerCase('tr').trim();
      document.querySelectorAll('[data-king] [data-king-ara]').forEach(li => { li.hidden = !!q && li.getAttribute('data-king-ara').indexOf(q) < 0; });
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-form]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('.king__girdi');
      const m = g ? g.value : '';
      if(g) g.value = '';
      KI.sesli = false;            // yazıyla sorulana yazıyla
      KI.sus();
      isle(m);
    });
    /* G: mikrofona basılı tutmak sesli sohbeti açar; bırakınca gelen tık dinlemeyi başlatmaz. */
    document.addEventListener('pointerdown', e => {
      const m = KI.acik && e.target && e.target.closest ? e.target.closest('.king__mik') : null;
      if(!m || (e.button != null && e.button !== 0)) return;
      if(mikBasili && mikBasili !== 'oldu') clearTimeout(mikBasili);
      mikBasili = setTimeout(() => { mikBasili = 'oldu'; if(!KI.sesliSohbet) KI.kipSec('konus').then(() => KI.ciz(false)); }, 450);
    }, true);
    const mikBirak = () => {
      if(mikBasili === 'oldu') setTimeout(() => { if(mikBasili === 'oldu') mikBasili = null; }, 400);   // tık gelmezse de unutulur
      else if(mikBasili){ clearTimeout(mikBasili); mikBasili = null; }
    };
    document.addEventListener('pointerup', mikBirak, true);
    document.addEventListener('pointercancel', mikBirak, true);
    document.addEventListener('contextmenu', e => { if(KI.acik && e.target && e.target.closest && e.target.closest('.king__mik')) e.preventDefault(); }, true);
    /* Telefonda «+»ya basılı tutmak: King. */
    document.addEventListener('pointerdown', e => {
      const p = e.target && e.target.closest ? e.target.closest('.hizliekle') : null;
      if(!p) return;
      basili = setTimeout(() => { basili = 'oldu'; KI.ac({ mini:true }); }, 450);
    }, true);
    const birak = e => {
      if(basili === 'oldu'){ basili = null; if(e && e.type === 'pointerup') e.preventDefault(); return; }
      if(basili){ clearTimeout(basili); basili = null; }
    };
    document.addEventListener('pointerup', birak, true);
    document.addEventListener('pointercancel', birak, true);
    document.addEventListener('click', e => {
      if(basili === 'oldu' && e.target && e.target.closest && e.target.closest('.hizliekle')){
        e.preventDefault(); e.stopPropagation(); basili = null;
      }
    }, true);
  }

  function kur(o){
    KI.ayar = Object.assign({ modul:'spi' }, o || {});
    KI.uyanKur();
    /* Söz 36: King'in kendi araçları kataloğa (her çağrıda güncel kurulur). */
    if(KI.L.ARAC){ KI.L.ARAC.modulSec(KI.ayar.modul); KI.L.ARAC.ortakKur(KI.ortakAraclar); }
    if(typeof window !== 'undefined') setTimeout(() => { try{ if(odak()) odakKur(); KI.hatirlatKur(); KI.aliskanlikKur(); }catch(e){ /* yok */ } }, 0);
    bagla();
    KI.disKisi = [];
    if(KI.hafiza()) KI.disKisiTazele();              // söz 22: öbür modüllerde öğrenilen
    /* Söz 18: başka modülden King açık gelindiyse burada küçük kutu olarak
       sohbetiyle açılır; kendi modülünün eski taşıması yalnız silinir. */
    const ts = KI.ortam.depo.oku(KI.TASIMA);
    if(ts) KI.ortam.depo.sil(KI.TASIMA);
    const tasindi = !!(ts && ts.acik && ts.kaynak && (ts.kaynak !== KI.ayar.modul || (ts.yenile && Date.now() - (Number(ts.zaman) || 0) < 60 * 1000))
      && Date.now() - (Number(ts.zaman) || 0) < 12 * 3600 * 1000);
    const onceki = tasindi && Array.isArray(ts.akis) ? ts.akis : null;
    let hedef = null;
    const m = String(KI.ortam.hash() || '').match(/^#king=([a-z]+)(?::([a-z]+))?$/);
    if(m){ KI.ortam.hashSil(); hedef = { route:m[1], sekme:m[2] || null }; }
    else if(tasindi && ts.git && typeof ts.git.route === 'string') hedef = { route:ts.git.route, sekme:ts.git.sekme || null, is:ts.git.is };
    if(hedef && KI.gecerliRota(KI.ayar.modul, hedef.route)){
      KI.ortam.zamanla(() => {
        try{ KI.ayar.git(hedef.route, hedef.sekme ? { sekme:hedef.sekme } : {}); }catch(e){ console.error('King:', e); }
        /* Söz 9: King'le gelindi; burada küçük kutu olarak açık kalır. */
        const s = KI.SAYFALAR.find(x => x.modul === KI.ayar.modul && x.route === hedef.route);
        /* Söz 37: «Tüm işler»den seçilen iş burada açılır. */
        const isVar = Number.isInteger(hedef.is) && KI.ARAC() && KI.ARAC().ISLER[hedef.is] && KI.ARAC().ISLER[hedef.is].modul === KI.ayar.modul;
        KI.ac({ mini:!isVar, onceki, mesaj:isVar ? KI.MODUL_AD[KI.ayar.modul] + '’ye geçtik.' : yz('ortak.king-yol.buradayim') + (s ? s.ad + ' açık; ' : '') + 'yaptığını yaz, kaydedeyim.' });
        if(isVar) KI.isSec(hedef.is);
      }, 60);
      return;
    }
    if(tasindi) KI.ortam.zamanla(() => KI.ac({ mini:true, onceki,
      mesaj:ts.yenile && ts.kaynak === KI.ayar.modul ? yz('ortak.king-yol.tamam-sayfa-yenilendi-burada') : KI.MODUL_AD[KI.ayar.modul] + '’ye geçtik, buradayım.' }), 60);
  }

  function _sifirla(){
    KI.paylasimKapat();
    KI.bekleyenNiyet = null; KI.eylemler = []; KI.eylemHkm = null; KI.harcama = null;
    if(typeof document !== 'undefined'){
      const el = document.querySelector('[data-king]');
      if(el) el.remove();
      document.documentElement.classList.remove('king-acik');
      document.documentElement.classList.remove('king-mini');
    }
    if(KI.ayar) KI.ortam.depo.sil(KI.depoAnahtar());
    KI.ortam.depo.sil(KI.TASIMA);
    KI.ortam.depo.sil(KI.SIRA); KI.ortam.depo.sil(KI.SOZET); KI.ortam.depo.sil(KI.DERSLER); KI.kaynakMetin = null;
    KI.ortam.depo.sil(KI.YAP); KI.ortam.depo.sil(KI.HATIR); KI.sonHatir = null; KI.bekleyenHatir = null; KI.ortam.depo.sil(KI.KART); KI.ortam.depo.sil(KI.GORSEL); KI.kutFiltre = 'hepsi'; KI.kutBuyuk = null; KI.kartOnbellek = null; KI.kvDuzen = false; KI.kvSecili = null; KI.kvYeni = false; KI.kvGiris = true; if(KI.hatirSaat){ try{ clearTimeout(KI.hatirSaat); }catch(e){ /* yok */ } KI.hatirSaat = null; }
    KI.siradanSoru = null; KI.siraCalisiyor = false;
    if(KI.siraSaat){ try{ clearInterval(KI.siraSaat); }catch(e){ /* yok */ } KI.siraSaat = null; }
    if(KI.ayar) KI.ortam.depo.sil(KI.arsivAnahtar());
    KI.ortam.depo.sil(KI.CEVAP); KI.ortam.depo.sil(KI.ALGILA); KI.ortam.depo.sil(KI.MIK); KI.ortam.depo.sil(KI.KAM); KI.kamListe = [];
    KI.menu = null; KI.silOnay = null; KI.silinen = null; KI.bekleyenYetki = null; KI.bekleyenTanisma = null; KI.disKisi = [];
    KI.yanAcik = false; KI.aktifKayit = null; KI.aracAcik = false; KI.kipAcik = false; KI.bolum = 'sohbet'; KI.klasorYeni = false; KI.tasinan = null; KI.adlandirilan = null;
    if(KI.ayar) KI.ortam.depo.sil(KI.klasorAnahtar());
    KI.ortam.depo.sil(KI.CIKARIM_KARAR); KI.ortam.depo.sil(KI.SORMA);
    KI.envanter = null; KI.ortam.depo.sil(KI.USLUP);
    KI.ortam.depo.sil(KI.TANISMA);
    KI.ayar = null; KI.acik = false; KI.mini = false; KI.akis = []; KI.bekleyenFoto = null; KI.fotoHedef = null; KI.aracSayfa = null; KI.doldurulacak = ''; KI.sonGeriAl = null; KI.sesliSohbet = false; KI.sessizSay = 0; KI.cipler = null; KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null;
    if(KI.mikDeniyor){ try{ KI.mikDeniyor.iptal(); }catch(e){ /* durmus */ } KI.mikDeniyor = null; }
    KI.mikListe = []; KI.mikNot = ''; KI.hkmDinlemezBitis = 0; KI.dinleHata = 0; KI.dinleNot = ''; KI.kesiciKapat(); odakTemizle(); KI.ritim = null; KI.gunlukBekle = false; KI.gunlukMetin = ''; KI.deneyTaslak = null;
    if(KI.dinleyen){ try{ KI.dinleyen.onend = KI.dinleyen.onerror = null; KI.dinleyen.abort(); }catch(e){ /* durmus */ } }
    KI.sesli = false; KI.dinleyen = null; KI.konusuyor = 0; KI.sesNo++; KI.calan = null; KI.sonMotor = ''; KI.sonNot = '';
    KI.sesKuyruk = null; KI.sesAkisYok = false;
    if(KI.isZaman){ clearTimeout(KI.isZaman); KI.isZaman = null; }
    KI.isDurum = null; KI.izlenen = {}; KI.ekip = { isler:[], gorevler:[], yuklu:false }; KI.gorevIptalOnay = null;
    KI.beceriV = { beceriler:[], sozler:[], yuklu:false, not:'' }; KI.beceriDuzelt = null; KI.beceriSilOnay = null; KI.bekleyenSon = 0; KI.bekleyenArac = null; KI.k2Soru = 0;
    KI.ortam.depo.sil(KI.ODAK_SON);
    KI.ortam.depo.sil(KI.UYAN); KI.uyanTur = false; KI.uyanNot = ''; KI.uyanHata = 0; KI.uyanBekle = 0; KI.uyanKacan = 0; KI.uyanMesgul = false;
    if(KI.uyanAralik){ clearInterval(KI.uyanAralik); KI.uyanAralik = null; }
    if(KI.uyanik){ try{ KI.uyanik.bitir(); }catch(e){ /* kapalı */ } KI.uyanik = null; }
  }


  Object.assign(KI, { ODAK, odak, odakBaslat, odakTemizle, odakHtml, merkezKomut, isle });
  return {
    kur, ac:KI.ac, kapat:KI.kapat, kucult:KI.kucult, buyut:KI.buyut, ad:KI.ad, adYonelme:KI.adYonelme, AD_ANAHTAR:KI.AD_ANAHTAR, ayarHtml:KI.ayarHtml, ekranDegisti:KI.ekranDegisti, yorumla:KI.yorumla, isle, hazirSec:KI.hazirSec, kaydet, dinle:KI.dinle, sesSec:KI.sesSec, veriGibi:KI.veriGibi,
    isDurumYaz:d => { KI.isDurum = d; }, arkadasHal:KI.arkadasHal, arkadasPoz:KI.arkadasPoz, arkadasEsya:KI.arkadasEsya, ARKADAS_UYKU:KI.ARKADAS_UYKU, yazimSuresi:KI.yazimSuresi,
    GORUNUS_ANAHTAR:KI.GORUNUS, gorunus:KI.gorunus, gorunusAyarla:KI.gorunusAyarla, gorunusSeciciHtml:KI.gorunusSeciciHtml, _sesSec:KI.sesSec, isRozet:KI.isRozet, isYokla:KI.isYokla, ekipAc:KI.ekipAc, ekipHtml:KI.ekipHtml, gorevHtml:KI.gorevHtml, isZamanli:() => !!KI.isZaman,
    beceriAc:KI.beceriAc, beceriPanelHtml:KI.beceriPanelHtml, bekleyenAl:KI.bekleyenAl, eylemleriCalistir:KI.eylemleriCalistir, k2Html:KI.k2Html, ODAK_SON:KI.ODAK_SON,
    uyanCumlesi:KI.uyanCumlesi, uyanSec:KI.uyanSec, uyanAcikMi:KI.uyanAcikMi, uyanParca:KI.uyanParca, uyanKontrol:KI.uyanKontrol, uyanikMi:() => !!KI.uyanik, uyanTurMu:() => KI.uyanTur, UYAN:KI.UYAN,
    fotoAl:KI.fotoAl, fotoIsle:KI.fotoIsle, ekranOku:KI.ekranOku, ekranGoster:KI.ekranGoster, sesliSohbetAc:KI.sesliSohbetAc, geriAlYap:KI.geriAlYap, sesliSohbetMi:() => KI.sesliSohbet,
    paylasimBaslat:KI.paylasimBaslat, paylasimBitir:KI.paylasimBitir, paylasimVar:() => !!KI.paylasim, kameraAc:KI.kameraAc, kamSec:KI.kamSec, kamTazele:KI.kamTazele, KAM:KI.KAM, fotoYorumla:KI.fotoYorumla, GORSEL_SISTEM:KI.GORSEL_SISTEM, TASIMA:KI.TASIMA,
    kisiKayitlari:KI.kisiKayitlari, kisiOzeti:KI.kisiOzeti, disKisiTazele:KI.disKisiTazele, tanismaVar:() => !!KI.bekleyenTanisma,
    cikarimAdaylari:KI.cikarimAdaylari, cikarimKarti:KI.cikarimKarti, cikarimOnayla:KI.cikarimOnayla, SORMA:KI.SORMA, sormaKomutu:KI.sormaKomutu, sormaMi:KI.sormaMi, sormaListesi:KI.sormaListesi,
    USLUP:KI.USLUP, envanterVar:() => !!KI.envanter,
    yetkiUygula:KI.yetkiUygula, bekleyenYetki:() => KI.bekleyenYetki,
    CEVAP:KI.CEVAP, cevapBicimi:KI.cevapBicimi, cevapSec:KI.cevapSec, SES:KI.SES, sesTercihi:KI.sesTercihi, sesTercihSec:KI.sesTercihSec, sesParcalari:KI.sesParcalari, seslendir:KI.seslendir, sus:KI.sus, konusuyorMu:() => KI.konusuyor > 0, wavYap:KI.wavYap, sonMotor:() => KI.sonMotor, sonNot:() => KI.sonNot, YAN:KI.YAN, yanDar:KI.yanDar, yanDarSec:KI.yanDarSec, DERIN:KI.DERIN, derinlik:KI.derinlik, derinlikSec:KI.derinlikSec, kartNiyeti:KI.kartNiyeti, yardimNiyeti:KI.yardimNiyeti, aliskanlikKur:KI.aliskanlikKur, sabahYokla:KI.sabahYokla, eylemListesi:KI.eylemListesi, soruCevapla:KI.soruCevapla, bicimli:KI.bicimli, tarz:KI.tarz, tarzSec:KI.tarzSec, TARZ:KI.TARZ, odak, ODAK, sohbetBas:KI.sohbetBas, BAS:KI.BAS, ayarKomutu, oneriListesi:KI.oneriListesi, cizgi:KI.cizgi, haftaHedefi:KI.haftaHedefi, HEDEF:KI.HEDEF, DENEY:KI.DENEY, deneyOku:KI.deneyOku, notPuanla:KI.notPuanla, parcalaGunluk:KI.parcalaGunluk, sohbettenBul:KI.sohbettenBul, bulunanKaydet:KI.bulunanKaydet, BEKLEYEN_KAYIT:KI.BEKLEYEN_KAYIT,
    MIK:KI.MIK, mikSecili:KI.mikSecili, mikSec:KI.mikSec, mikTazele:KI.mikTazele, mikDene:KI.mikDene, algila:KI.algila,
    sohbetiKaydet:KI.sohbetiKaydet, sohbetiTemizle:KI.sohbetiTemizle, sohbetiGeriGetir:KI.sohbetiGeriGetir, kayitlar:KI.arsivOku, kayitIndir:KI.kayitIndir,
    kayitKopyala:KI.kayitKopyala, kayitSil:KI.kayitSil, kayitMetni:KI.kayitMetni, menuAc:KI.menuAc, menuDurum:() => KI.menu,
    yeniSohbet:KI.yeniSohbet, kayitAc:KI.kayitAc, ARACLAR:KI.ARACLAR, aktifKayit:() => KI.aktifKayit,
    BOLUMLER:KI.BOLUMLER, bolumSec:KI.bolumSec, bolum:() => KI.bolum, listeGorunur:KI.listeGorunur, alanAc:KI.alanAc, pdfAl:KI.pdfAl, nedenSatirlari:KI.nedenSatirlari, yetenekler:KI.yetenekler, dersNiyeti:KI.dersNiyeti, hesapla:KI.hesapla, birimCevir:KI.birimCevir, kartEkle:KI.kartEkle, kartSabitle:KI.kartSabitle, oneCikanlar:KI.oneCikanlar, yapilacaklar:KI.yapilacaklar, hatirlatmalar:KI.hatirlatmalar, hatirCoz:KI.hatirCoz, yasaHesapla:KI.yasaHesapla, kdKur:KI.kdKur, kdDersler:KI.kdDersler, DERSLER:KI.DERSLER, sira:KI.sira, siraBosalt:KI.siraBosalt, SIRA:KI.SIRA, SOZET:KI.SOZET, sozetler:KI.sozetler,
    KIPLER:KI.KIPLER, kip:KI.kip, kipSec:KI.kipSec, klasorler:KI.klasorler, klasorEkle:KI.klasorEkle, klasorSil:KI.klasorSil, kayitTasi:KI.kayitTasi, kayitAdlandir:KI.kayitAdlandir, kayitSabitle:KI.kayitSabitle,
    acikMi:() => KI.acik, miniMi:() => KI.mini, akis:() => KI.akis.slice(),
    SAYFALAR:KI.SAYFALAR, HAZIR:KI.HAZIR, _ortam:KI.ortam, _sifirla, _videoKaynak:KI.videoKaynak, _gorunurluk:gorunurluk,
    aracIsle:KI.aracIsle, ortakAraclar:KI.ortakAraclar, haritaCevap:KI.haritaCevap, HARITA_RE:KI.HARITA_RE,
    isSec:KI.isSec, kameraIs:KI.kameraIs, fotoHedef:() => KI.fotoHedef, arastirmaVeri:KI.arastirmaVeri, arastirmaEkle:KI.arastirmaEkle, cipler:() => (KI.cipler || []).slice(),
  };
})();
