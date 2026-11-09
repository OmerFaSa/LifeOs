/* KING ARAÇLARI — ESP'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: günün ve haftanın çalışma oturumları, kitaplar, dil kartları ve
   yazı taslakları; sayıyı ESP'nin kendi kaydı verir (oturumu olmayan gün
   «veri yok», sıfır değil). ESP sertifika vermez, yetenek yargısı kurmaz
   (AGENTS §1.5): araçlar yalnız kaydı söyler.

   Yazma: oturum (dakika) King'in `kayit_gir` aracıyla ESP'nin kendi
   ayrıştırıcısından girer (ESP.Parse.parseSession). Kitap eklemek yetki
   kataloğundaki modül eylemidir (app.js, `eylem_kitap_ekle`). Burada dil
   kartı eklemek ve kitabı bitirmek durur; ikisi de önizlenir, onayla
   yazılır, «Geri al» kalır.

   Alıntı ve kitap sayfası (King 3.0 K5, 2026-10-21): `esp_alinti_ekle`
   kitaba bağlı bir not yazar (Kütüphane'nin alıntı kartı onu gösterir).
   King'e gelen sayfa fotoğrafı ya da kamera karesi (`sayfaOku`, app.js
   `foto`) Merkez'in ince yazı okuyan görsel modeliyle metne çevrilir; metin
   «görsel model okudu, doğrulanmadı» diye gösterilir ve yalnız onayla
   alıntı olarak kaydolur. Kelime kartı kullanıcının seçtiği kelimeyle
   (`esp_kart_ekle`) girer; model kelime seçmez. */
window.LIFEOS.PARCA.yazilar({
  'esp.core.kingarac.bu-gun-icin-oturum-kaydi':'Bu gün için oturum kaydı yok.',
  'esp.core.kingarac.son':'Son ',
  'esp.core.kingarac.kutuphanede-kitap-yok':'Kütüphanede kitap yok.',
  'esp.core.kingarac.toplam-kart':'Toplam kart: ',
  'esp.core.kingarac.bugun-sirasi-gelen':'Bugün sırası gelen: ',
  'esp.core.kingarac.yazi-taslagi-yok':'Yazı taslağı yok.',
  'esp.core.kingarac.merdiven-verisi-yok-veri-yok':'Merdiven verisi yok (veri yok).',
  'esp.core.kingarac.henuz-olculmus-uretim-yok-ve':'Henüz ölçülmüş üretim yok (veri yok).',
  'esp.core.kingarac.genel-kademe':'Genel kademe: ',
  'esp.core.kingarac.acik':'Açık: ',
  'esp.core.kingarac.kapali':'Kapalı: ',
  'esp.core.kingarac.sempozyumda-kayitli-tez-yok':'Sempozyumda kayıtlı tez yok (veri yok).',
  'esp.core.kingarac.kronolojide-olay-kaydi-yok-v':'Kronolojide olay kaydı yok (veri yok).',
  'esp.core.kingarac.repertuarda-kayit-yok-veri-y':'Repertuarda kayıt yok (veri yok).',
  'esp.core.kingarac.bu-bir-kitap-sayfasi-sayfada':'Bu bir kitap sayfası. Sayfadaki metni satır satır, aynen yaz; düzeltme, özet ve yorum ekleme. Okunamayan yere […] koy.',
  'esp.core.kingarac.sayfayi-okumak-icin-merkez-i':'Sayfayı okumak için Merkez’in görsel modeli gerekiyor; Merkez açıkken yeniden dene.',
  'esp.core.kingarac.sayfadan-okunabilir-bir-meti':'Sayfadan okunabilir bir metin çıkmadı',
  'esp.core.kingarac.sayfadan-okudum-gorsel-model':'Sayfadan okudum (görsel model, doğrulanmadı).',
  'esp.core.kingarac.bir-kelimeyi-karta-eklemek-i':'Bir kelimeyi karta eklemek için «… kelimesini kart yap: anlamı» yaz.',
  'esp.core.kingarac.bir-gunun-esp-calisma-oturum':'Bir günün ESP çalışma oturumları (alan ve dakika).',
  'esp.core.kingarac.son-gunlerde-hangi-alanda-ka':'Son günlerde hangi alanda kaç dakika çalışıldığı.',
  'esp.core.kingarac.kutuphanedeki-kitaplar-ve-du':'Kütüphanedeki kitaplar ve durumları (okunuyor, bitti, başlanmadı).',
  'esp.core.kingarac.dil-kartlari-toplam-bugun-si':'Dil kartları: toplam, bugün sırası gelen, dillere göre.',
  'esp.core.kingarac.yazi-taslaklari-ve-kelime-sa':'Yazı taslakları ve kelime sayıları.',
  'esp.core.kingarac.esp-merdiveni-yedi-disiplini':'ESP merdiveni: yedi disiplinin kademesi, ustalık yüzdesi ve ölçülen disiplinler.',
  'esp.core.kingarac.sempozyumdaki-felsefi-tezler':'Sempozyumdaki felsefi tezler ve argümanlar (açık ve kapalı tezler).',
  'esp.core.kingarac.kronolojideki-tarih-olaylari':'Kronolojideki tarih olayları (yıl, dönem ve bölge).',
  'esp.core.kingarac.muzik-studyosundaki-parca-ve':'Müzik stüdyosundaki parça ve teknikler (temiz BPM eşikleri).',
  'esp.core.kingarac.dil-karti-ekle':'Dil kartı ekle',
  'esp.core.kingarac.dil-destesine-yeni-kelime-ka':'Dil destesine yeni kelime kartı ekler (ön yüz ve karşılığı).',
  'esp.core.kingarac.dil-destesine-kart-eklenecek':'Dil destesine kart eklenecek: «',
  'esp.core.kingarac.karti-ekledim':'Kartı ekledim.',
  'esp.core.kingarac.alinti-kaydet':'Alıntı kaydet',
  'esp.core.kingarac.bir-kitaptan-alintiyi-ya-da':'Bir kitaptan alıntıyı ya da kitap notunu kaydeder; kitap verilmezse okunmakta olan tek kitaba bağlanır.',
  'esp.core.kingarac.kitaba-baglanmamis-not':'Kitaba bağlanmamış not',
  'esp.core.kingarac.notu-kaydettim':'Notu kaydettim.',
  'esp.core.kingarac.kitabi-bitir':'Kitabı bitir',
  'esp.core.kingarac.suc-ve-ceza-yi-bitirdim':'Suç ve Ceza’yı bitirdim',
  'esp.core.kingarac.kutuphanedeki-bir-kitabi-bug':'Kütüphanedeki bir kitabı bugün bitmiş olarak işaretler.',
  'esp.core.kingarac.kitap-bulunamadi-ya-da-zaten':'Kitap bulunamadı ya da zaten bitmiş.',
  'esp.core.kingarac.calisma-oturumunu-guncelle-v':'Çalışma oturumunu güncelle veya sil',
  'esp.core.kingarac.esp-calisma-oturumunu-guncel':'ESP çalışma oturumunu günceller ya da siler.',
  'esp.core.kingarac.oturumu-sildim':'Oturumu sildim.',
  'esp.core.kingarac.oturumu-guncelledim':'Oturumu güncelledim.',
  'esp.core.kingarac.tez-ekle-guncelle-veya-sil':'Tez ekle, güncelle veya sil',
  'esp.core.kingarac.sempozyuma-tez-ekler-guncell':'Sempozyuma tez ekler, günceller ya da siler.',
  'esp.core.kingarac.yeni-tez-eklenecek':'Yeni tez eklenecek: «',
  'esp.core.kingarac.tez-silinecek':'Tez silinecek: «',
  'esp.core.kingarac.tez-guncellenecek':'Tez güncellenecek: «',
  'esp.core.kingarac.tezi-ekledim':'Tezi ekledim: «',
  'esp.core.kingarac.tezi-sildim':'Tezi sildim.',
  'esp.core.kingarac.tezi-guncelledim':'Tezi güncelledim.',
  'esp.core.kingarac.ek-dosya-ekle-veya-sil':'Ek dosya ekle veya sil',
  'esp.core.kingarac.bolume-ek-dosya-not-belge':'Bölüme ek dosya (not, belge, bağlantı, ses) ekler ya da siler.',
  'esp.core.kingarac.ek-dosya-kaydedilecek':'Ek dosya kaydedilecek: «',
  'esp.core.kingarac.ek-dosya-silinecek':'Ek dosya silinecek: «',
  'esp.core.kingarac.bolum-alan-belirtmelisin':'Bölüm (alan) belirtmelisin.',
  'esp.core.kingarac.ek-dosyayi-kaydettim':'Ek dosyayı kaydettim.',
  'esp.core.kingarac.ek-dosyayi-sildim':'Ek dosyayı sildim.',
  'esp.core.kingarac.parca-veya-teknik-ekle-gunce':'Parça veya teknik ekle, güncelle veya sil',
  'esp.core.kingarac.muzik-studyosuna-parca-veya':'Müzik stüdyosuna parça veya teknik ekler, günceller ya da siler.',
  'esp.core.kingarac.yeni-parca-teknik-eklenecek':'Yeni parça/teknik eklenecek: «',
  'esp.core.kingarac.parca-teknik-silinecek':'Parça/teknik silinecek: «',
  'esp.core.kingarac.parca-teknik-guncellenecek':'Parça/teknik güncellenecek: «',
  'esp.core.kingarac.parcayi-ekledim':'Parçayı ekledim: «',
  'esp.core.kingarac.parcayi-sildim':'Parçayı sildim.',
  'esp.core.kingarac.parcayi-guncelledim':'Parçayı güncelledim.',
  'esp.core.kingarac.hatirlatici-ekle-veya-sil':'Hatırlatıcı ekle veya sil',
  'esp.core.kingarac.disipline-bagli-hatirlatici':'Disipline bağlı hatırlatıcı ekler ya da siler.',
  'esp.core.kingarac.hatirlatici-eklenecek':'Hatırlatıcı eklenecek: «',
  'esp.core.kingarac.hatirlatici-silinecek':'Hatırlatıcı silinecek: «',
  'esp.core.kingarac.hatirlaticiyi-kaydettim':'Hatırlatıcıyı kaydettim.',
  'esp.core.kingarac.hatirlaticiyi-sildim':'Hatırlatıcıyı sildim.',
  'esp.core.kingarac.hedef-ekle-veya-sil':'Hedef ekle veya sil',
  'esp.core.kingarac.zamana-bagli-hedef-ekler-ya':'Zamana bağlı hedef ekler ya da siler.',
  'esp.core.kingarac.hedef-eklenecek':'Hedef eklenecek: «',
  'esp.core.kingarac.hedef-silinecek':'Hedef silinecek: «',
  'esp.core.kingarac.hedefi-kaydettim':'Hedefi kaydettim.',
  'esp.core.kingarac.hedefi-sildim':'Hedefi sildim.',
  'esp.core.kingarac.karari-kapat':'Kararı kapat',
  'esp.core.kingarac.ofiste-alinan-acik-bir-karar':'Ofiste alınan açık bir kararı sonuçlandırarak kapatır.',
  'esp.core.kingarac.karar-kapatilacak':'Karar kapatılacak: «',
  'esp.core.kingarac.king-ile-kapatildi':'King ile kapatıldı',
  'esp.core.kingarac.karari-kapattim':'Kararı kapattım: «',
  'esp.core.kingarac.dil-kartini-sil':'Dil kartını sil',
  'esp.core.kingarac.dil-destesinden-kelime-karti':'Dil destesinden kelime kartını siler.',
  'esp.core.kingarac.dil-karti-silinecek':'Dil kartı silinecek: «',
  'esp.core.kingarac.karti-sildim':'Kartı sildim: «',
  'esp.core.kingarac.kaynak-ekle-veya-sil':'Kaynak ekle veya sil',
  'esp.core.kingarac.tarih-masasina-kaynak-ekler':'Tarih masasına kaynak ekler ya da siler.',
  'esp.core.kingarac.tarih-kaynagi-eklenecek':'Tarih kaynağı eklenecek: «',
  'esp.core.kingarac.tarih-kaynagi-silinecek':'Tarih kaynağı silinecek: «',
  'esp.core.kingarac.kaynagi-kaydettim':'Kaynağı kaydettim.',
  'esp.core.kingarac.kaynagi-sildim':'Kaynağı sildim.',
  'esp.core.kingarac.kitabi-guncelle-veya-sil':'Kitabı güncelle veya sil',
  'esp.core.kingarac.kutuphanedeki-kitabi-guncell':'Kütüphanedeki kitabı günceller ya da siler (eklemek için eylem_kitap_ekle eylemini kullan).',
  'esp.core.kingarac.kitap-silinecek':'Kitap silinecek: «',
  'esp.core.kingarac.kitap-guncellenecek':'Kitap güncellenecek: «',
  'esp.core.kingarac.kitap-eklemek-icin-eylem-kit':'Kitap eklemek için eylem_kitap_ekle eylemi kullanılmalı.',
  'esp.core.kingarac.kitabi-sildim':'Kitabı sildim.',
  'esp.core.kingarac.kitabi-guncelledim':'Kitabı güncelledim.',
  'esp.core.kingarac.notu-sil':'Notu sil',
  'esp.core.kingarac.kutuphanedeki-bir-atomik-not':'Kütüphanedeki bir atomik notu veya alıntıyı siler.',
  'esp.core.kingarac.not-silinecek':'Not silinecek: «',
  'esp.core.kingarac.notu-sildim':'Notu sildim.',
  'esp.core.kingarac.tarih-olayi-ekle-guncelle-ve':'Tarih olayı ekle, güncelle veya sil',
  'esp.core.kingarac.kronolojiye-tarih-olayi-ekle':'Kronolojiye tarih olayı ekler, günceller ya da siler.',
  'esp.core.kingarac.tarih-olayi-eklenecek':'Tarih olayı eklenecek: «',
  'esp.core.kingarac.tarih-olayi-silinecek':'Tarih olayı silinecek: «',
  'esp.core.kingarac.tarih-olayi-guncellenecek':'Tarih olayı güncellenecek: «',
  'esp.core.kingarac.olayi-kaydettim':'Olayı kaydettim.',
  'esp.core.kingarac.olayi-sildim':'Olayı sildim.',
  'esp.core.kingarac.olayi-guncelledim':'Olayı güncelledim.',
  'esp.core.kingarac.diksiyon-olcumu-ekle-veya-si':'Diksiyon ölçümü ekle veya sil',
  'esp.core.kingarac.diksiyon-calisma-olcumunu-su':'Diksiyon çalışma ölçümünü (süre, kelime, hata) kaydeder ya da siler.',
  'esp.core.kingarac.diksiyon-olcum-kaydi-eklenec':'Diksiyon ölçüm kaydı eklenecek: ',
  'esp.core.kingarac.diksiyon-olcum-kaydi-silinec':'Diksiyon ölçüm kaydı silinecek: ',
  'esp.core.kingarac.diksiyon-olcumunu-kaydettim':'Diksiyon ölçümünü kaydettim.',
  'esp.core.kingarac.diksiyon-olcumunu-sildim':'Diksiyon ölçümünü sildim.',
  'esp.core.kingarac.yazi-taslagi-ekle-guncelle-v':'Yazı taslağı ekle, güncelle veya sil',
  'esp.core.kingarac.yazi-laboratuvarina-taslak-e':'Yazı laboratuvarına taslak ekler, günceller ya da siler.',
  'esp.core.kingarac.yazi-taslagi-eklenecek':'Yazı taslağı eklenecek: «',
  'esp.core.kingarac.yazi-taslagi-silinecek':'Yazı taslağı silinecek: «',
  'esp.core.kingarac.yazi-taslagi-guncellenecek':'Yazı taslağı güncellenecek: «',
  'esp.core.kingarac.yazi-taslagini-ekledim':'Yazı taslağını ekledim: «',
  'esp.core.kingarac.yazi-taslagini-sildim':'Yazı taslağını sildim.',
  'esp.core.kingarac.yazi-taslagini-guncelledim':'Yazı taslağını güncelledim.',
  'esp.core.kingarac.neden-zinciri-ekle-guncelle':'Neden zinciri ekle, güncelle veya sil',
  'esp.core.kingarac.tarih-olayina-neden-sonuc-zi':'Tarih olayına neden-sonuç zinciri ekler, günceller ya da siler.',
  'esp.core.kingarac.neden-zinciri-eklenecek':'Neden zinciri eklenecek: «',
  'esp.core.kingarac.neden-zinciri-silinecek-id':'Neden zinciri silinecek (ID: ',
  'esp.core.kingarac.neden-zinciri-guncellenecek':'Neden zinciri güncellenecek (ID: ',
  'esp.core.kingarac.zincir-bir-olaya-baglanmadan':'Zincir bir olaya bağlanmadan kaydedilmez.',
  'esp.core.kingarac.neden-zincirini-kaydettim':'Neden zincirini kaydettim.',
  'esp.core.kingarac.neden-zincirini-sildim':'Neden zincirini sildim.',
  'esp.core.kingarac.neden-zincirini-guncelledim':'Neden zincirini güncelledim.',
});


window.ESP = window.ESP || {};

ESP.KingArac = (function(){
  'use strict';

  const U = () => ESP.U, M = () => ESP.Model, S = () => ESP.S;
  const tarihMi = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const alanAd = id => ((ESP.DISCIPLINE_BY_ID || {})[id] || {}).label || id;
  const render = () => { if(ESP.App && ESP.App.render) ESP.App.render(); };
  function gunler(n){ const l = []; for(let i = 0; i < n; i++) l.push(U().iso(U().addDays(U().today(), -i))); return l; }
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').trim();
  const DISCIPLINE_IDS = ['lang', 'philo', 'music', 'diction', 'reading', 'writing', 'history'];

  function adlaBul(liste, id, alan, aranan, ad){
    const l = liste || [];
    if(id){
      const x = l.find(it => it.id === id);
      return x ? { oge:x } : { hata:(ad || 'kayıt') + ' bulunamadı (ID: ' + id + ')' };
    }
    const temiz = String(aranan || '').trim();
    if(!temiz) return { hata:'hangi ' + (ad || 'kayıt') + '? id ya da ad söyle' };
    const k = kucuk(temiz);
    const es = l.filter(it => kucuk(it[alan] || '').indexOf(k) >= 0);
    if(es.length === 0) return { hata:(ad || 'kayıt') + ' bulunamadı' };
    if(es.length > 1) return { hata:'birden çok eşleşen ' + (ad || 'kayıt') + ' bulundu; id belirtmelisin' };
    return { oge:es[0] };
  }

  function oturumBul(d, p){
    const list = M().sessionsOf(d);
    if(p && p.id){
      const s = list.find(x => x.id === p.id);
      return s ? { oge:s } : { hata:'oturum bulunamadı (ID: ' + p.id + ')' };
    }
    if(!p || !p.alan) return { hata:'hangi oturum? id ya da alan söyle' };
    const es = list.filter(s => s.disc === p.alan);
    if(es.length === 0) return { hata:'bu alanda oturum bulunamadı' };
    if(es.length > 1) return { hata:'bu alanda birden çok oturum var; id belirtmelisin' };
    return { oge:es[0] };
  }

  function kararBul(p){
    const aciklar = (S().decisions || []).filter(d => !d.closedAt);
    if(p && p.id){
      const d = aciklar.find(x => x.id === p.id);
      return d ? { oge:d } : { hata:'açık karar bulunamadı (ID: ' + p.id + ')' };
    }
    const temiz = String((p && p.metin) || '').trim();
    if(!temiz) return { hata:'hangi karar? id ya da metin söyle' };
    const aranan = kucuk(temiz);
    const es = aciklar.filter(d => kucuk(d.text).indexOf(aranan) >= 0);
    if(es.length === 0) return { hata:'açık karar bulunamadı' };
    if(es.length > 1) return { hata:'birden çok eşleşen açık karar bulundu; id belirtmelisin' };
    return { oge:es[0] };
  }

  function zincirBul(p){
    const list = S().chains || [];
    if(p && p.id){
      const c = list.find(x => x.id === p.id);
      return c ? { oge:c } : { hata:'neden zinciri bulunamadı (ID: ' + p.id + ')' };
    }
    let evId = p && p.olay_id;
    if(!evId && p && p.olay_baslik){
      const evRes = adlaBul(S().events, null, 'title', p.olay_baslik, 'olay');
      if(evRes.hata) return evRes;
      evId = evRes.oge.id;
    }
    if(!evId) return { hata:'hangi zincir? id ya da olay söyle' };
    const es = list.filter(c => c.eventId === evId);
    if(es.length === 0) return { hata:'bu olaya bağlı zincir bulunamadı' };
    if(es.length > 1) return { hata:'bu olaya bağlı birden çok zincir var; id belirtmelisin' };
    return { oge:es[0] };
  }

  function kayitBul(p){
    const list = S().recordings || [];
    if(p && p.id){
      const r = list.find(x => x.id === p.id);
      return r ? { oge:r } : { hata:'kayıt bulunamadı (ID: ' + p.id + ')' };
    }
    if(!p || !p.tarih) return { hata:'hangi kayıt? id ya da tarih söyle' };
    const es = list.filter(r => r.date === p.tarih);
    if(es.length === 0) return { hata:p.tarih + ' tarihinde ses ölçüm kaydı bulunamadı' };
    if(es.length > 1) return { hata:p.tarih + ' tarihinde birden çok kayıt var; id belirtmelisin' };
    return { oge:es[0] };
  }

  function gun(p){
    const d = tarihMi(p.tarih) ? p.tarih : U().todayISO();
    const l = M().sessionsOf(d).filter(s => s.minutes > 0).map(s => ({ alan:alanAd(s.disc), dakika:s.minutes, not:s.note || '' }));
    return { sonuc:{ tarih:d, oturumlar:l, toplam_dakika:l.length ? l.reduce((a, s) => a + s.dakika, 0) : null },
      satirlar:l.length ? l.map(s => s.alan + ' · ' + s.dakika + ' dk') : [yz('esp.core.kingarac.bu-gun-icin-oturum-kaydi')] };
  }

  function hafta(p){
    const n = p.gun || 7, dk = {};
    let kayitli = 0;
    gunler(n).forEach(d => {
      const ss = M().sessionsOf(d).filter(s => s.minutes > 0);
      if(ss.length) kayitli++;
      ss.forEach(s => { dk[s.disc] = (dk[s.disc] || 0) + s.minutes; });
    });
    const l = Object.keys(dk).sort((a, b) => dk[b] - dk[a]).map(k => ({ alan:alanAd(k), dakika:dk[k] }));
    return { sonuc:{ gun:n, calisilan_gun:kayitli, alanlar:l },
      satirlar:l.length ? [yz('esp.core.kingarac.son') + n + ' gün: ' + kayitli + ' gün çalışıldı'].concat(l.map(x => x.alan + ' · ' + x.dakika + ' dk')) : [yz('esp.core.kingarac.son') + n + ' günde oturum kaydı yok.'] };
  }

  function kitaplar(){
    const l = (S().books || []).map(b => ({ ad:b.title, yazar:b.author || '', durum:(M().bookStatus ? (M().bookStatus(b) || {}).label : '') || '',
      baslangic:b.startedAt || null, bitis:b.finishedAt || null }));
    return { sonuc:{ kitaplar:l.slice(0, 40) }, satirlar:l.length ? l.slice(0, 8).map(b => b.ad + (b.yazar ? ' — ' + b.yazar : '') + (b.durum ? ' · ' + b.durum : '')) : [yz('esp.core.kingarac.kutuphanede-kitap-yok')] };
  }

  function kartlar(){
    const l = S().cards || [];
    const vade = ESP.SRS && ESP.SRS.dueCards ? ESP.SRS.dueCards(U().todayISO()).length : null;
    const dil = {};
    l.forEach(c => { dil[c.lang || '?'] = (dil[c.lang || '?'] || 0) + 1; });
    return { sonuc:{ toplam:l.length, bugun_sirasi_gelen:vade, dillere_gore:dil },
      satirlar:[yz('esp.core.kingarac.toplam-kart') + l.length, yz('esp.core.kingarac.bugun-sirasi-gelen') + (vade == null ? 'veri yok' : vade)] };
  }

  function yazilar(){
    const l = (S().drafts || []).map(d => ({ baslik:d.title || 'Başlıksız', kelime:String(d.text || '').split(/\s+/).filter(Boolean).length, guncel:String(d.updatedAt || '').slice(0, 10) }));
    return { sonuc:{ taslaklar:l.slice(0, 30) }, satirlar:l.length ? l.slice(0, 8).map(d => d.baslik + ' · ' + d.kelime + ' kelime') : [yz('esp.core.kingarac.yazi-taslagi-yok')] };
  }

  function merdiven(){
    const C = ESP.Curriculum;
    if(!C || !C.overall) return { sonuc:{ kademe:null, etiket:'veri yok' }, satirlar:[yz('esp.core.kingarac.merdiven-verisi-yok-veri-yok')] };
    const ov = C.overall();
    const hepsi = (C.all ? C.all() : []).filter(Boolean).map(lv => ({
      alan:alanAd(lv.disc), kademe:(lv.level || {}).label || '', basamak:(lv.level || {}).short || '',
      ustalik:lv.mastery, kesinlik:lv.cert
    }));
    const yok = !ov || ov.cert === 'missing' || !ov.measuredDisciplines;
    return {
      sonuc:{
        genel_kademe:yok ? null : (ov.level || {}).label,
        ustalik:yok ? null : ov.mastery,
        kesinlik:ov ? ov.cert : 'missing',
        olculen_disiplin:ov ? ov.measuredDisciplines : 0,
        disiplinler:hepsi
      },
      satirlar:yok ? [yz('esp.core.kingarac.henuz-olculmus-uretim-yok-ve')] : [
        yz('esp.core.kingarac.genel-kademe') + (ov.level || {}).label + ' (%' + ov.mastery + ')',
        ov.measuredDisciplines + '/' + ov.disciplines + ' disiplinde ölçülmüş üretim var.'
      ].concat(hepsi.slice(0, 6).map(d => d.alan + ': ' + d.kademe + ' (%' + d.ustalik + ')'))
    };
  }

  function argumanlar(p){
    let l = S().args || [];
    if(p && p.durum === 'acik') l = l.filter(a => a.status === 'open');
    else if(p && p.durum === 'kapali') l = l.filter(a => a.status === 'closed');
    const ozet = l.map(a => ({ id:a.id, tez:a.thesis, durum:a.status, itiraz_sayisi:(a.objections || []).length }));
    return {
      sonuc:{ toplam:(S().args || []).length, filtreli:l.length, argumanlar:ozet.slice(0, 30) },
      satirlar:l.length ? l.slice(0, 6).map(a => (a.status === 'open' ? yz('esp.core.kingarac.acik') : yz('esp.core.kingarac.kapali')) + a.thesis.slice(0, 60)) : [yz('esp.core.kingarac.sempozyumda-kayitli-tez-yok')]
    };
  }

  function olaylar(p){
    let l = S().events || [];
    if(p && p.donem) l = l.filter(e => e.era === p.donem);
    const ozet = l.map(e => ({ id:e.id, baslik:e.title, yil:e.year, donem:e.era, bolge:e.region }));
    return {
      sonuc:{ toplam:(S().events || []).length, filtreli:l.length, olaylar:ozet.slice(0, 40) },
      satirlar:l.length ? l.slice(0, 6).map(e => (e.year != null ? e.year + ': ' : '') + e.title) : [yz('esp.core.kingarac.kronolojide-olay-kaydi-yok-v')]
    };
  }

  function repertuvar(p){
    let l = S().pieces || [];
    if(p && p.tur) l = l.filter(x => x.kind === p.tur);
    const ozet = l.map(x => ({ id:x.id, ad:x.name, tur:x.kind, temiz_bpm:x.cleanBpm, hedef_bpm:x.targetBpm }));
    return {
      sonuc:{ toplam:(S().pieces || []).length, filtreli:l.length, parcalar:ozet.slice(0, 30) },
      satirlar:ozet.length ? ozet.slice(0, 8).map(x => x.ad + ' · ' + (x.tur === 'piece' ? 'parça' : 'teknik') + (x.temiz_bpm ? ' · ' + x.temiz_bpm + ' BPM' : '')) : [yz('esp.core.kingarac.repertuarda-kayit-yok-veri-y')]
    };
  }

  function kitapBul(ad){
    const temiz = String(ad || '').trim();
    if(!temiz) return null;
    const k = kucuk(temiz);
    let l = (S().books || []).filter(b => kucuk(b.title).indexOf(k) >= 0);
    /* King-Bench seviye 2: «suç ve cezayı» — Türkçe hâl eki (-yı, -nı, -'yı, -ı …) atılıp yeniden aranır. */
    if(!l.length){
      const kok = k.replace(/['’]?(?:y|n)?[ıiuü]$|['’]?(?:y|n)?[ae]$|['’]?d[ae]$|['’]?n[ıiuü]n$/, '');
      if(kok.length >= 3 && kok !== k) l = (S().books || []).filter(b => kucuk(b.title).indexOf(kok) >= 0);
    }
    return l.length === 1 ? l[0] : null;
  }

  /* Kitap: adı verildiyse o; verilmediyse okunmakta olan TEK kitap. */
  function alintiKitabi(ad){
    if(ad) return kitapBul(ad);
    const l = (S().books || []).filter(b => M().bookStatus && (M().bookStatus(b) || {}).id === 'okunuyor');
    return l.length === 1 ? l[0] : null;
  }
  const SAYFA_SORU = yz('esp.core.kingarac.bu-bir-kitap-sayfasi-sayfada');
  async function sayfaOku(f, y){
    if(!y || typeof y.gorsel !== 'function') return yz('esp.core.kingarac.sayfayi-okumak-icin-merkez-i');
    let r = null;
    try{ r = await y.gorsel(SAYFA_SORU, 'gorsel'); }catch(e){ r = null; }
    const metin = r && r.ok ? String(r.text || '').replace(/[ \t]+\n/g, '\n').trim() : '';
    if(!metin || metin.length < 8) return yz('esp.core.kingarac.sayfadan-okunabilir-bir-meti') + (r && r.note ? ' (' + r.note + ')' : '') + '; daha yakından ve düz çek.';
    const b = alintiKitabi('');
    return { metin:yz('esp.core.kingarac.sayfadan-okudum-gorsel-model'),
      satirlar:[yz('esp.core.kingarac.bir-kelimeyi-karta-eklemek-i')],
      arac:{ ad:'esp_alinti_ekle', param:Object.assign({ metin:metin.slice(0, 1000) }, b ? { kitap:b.title } : {}) } };
  }

  function liste(){
    const temel = [
      { ad:'esp_gun', tur:'oku', aciklama:yz('esp.core.kingarac.bir-gunun-esp-calisma-oturum'), ornek:'günün oturumları', anahtar:'entelektüel pratik süresi seans oturum gündelik günlük',
        parametreler:{ type:'object', properties:{ tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' } } }, calistir:gun },
      { ad:'esp_hafta', tur:'oku', aciklama:yz('esp.core.kingarac.son-gunlerde-hangi-alanda-ka'), ornek:'haftalık süre', anahtar:'haftalık disiplin vakit dağılımı toplam süre saat',
        parametreler:{ type:'object', properties:{ gun:{ type:'integer', minimum:1, maximum:60 } } }, calistir:hafta },
      { ad:'esp_kitaplar', tur:'oku', aciklama:yz('esp.core.kingarac.kutuphanedeki-kitaplar-ve-du'), ornek:'kütüphanedeki eserler', anahtar:'okuduklarım bitirdiklerim liste kütüphanemdeki eserler',
        calistir:kitaplar },
      { ad:'esp_kartlar', tur:'oku', aciklama:yz('esp.core.kingarac.dil-kartlari-toplam-bugun-si'), ornek:'kartlarımın durumu',
        calistir:kartlar },
      { ad:'esp_yazilar', tur:'oku', aciklama:yz('esp.core.kingarac.yazi-taslaklari-ve-kelime-sa'), ornek:'yazı taslaklarım', calistir:yazilar },
      { ad:'esp_merdiven', tur:'oku', aciklama:yz('esp.core.kingarac.esp-merdiveni-yedi-disiplini'), ornek:'seviyem nedir',
        parametreler:{ type:'object', properties:{} }, calistir:merdiven },
      { ad:'esp_argumanlar', tur:'oku', aciklama:yz('esp.core.kingarac.sempozyumdaki-felsefi-tezler'), ornek:'açık tezlerim',
        parametreler:{ type:'object', properties:{ durum:{ type:'string', enum:['acik', 'kapali', 'hepsi'], description:'tez durumu' } } }, calistir:argumanlar },
      { ad:'esp_olaylar', tur:'oku', aciklama:yz('esp.core.kingarac.kronolojideki-tarih-olaylari'), ornek:'kronolojide ne var',
        parametreler:{ type:'object', properties:{ donem:{ type:'string', maxLength:30, description:'tarih dönemi' } } }, calistir:olaylar },
      { ad:'esp_repertuvar', tur:'oku', aciklama:yz('esp.core.kingarac.muzik-studyosundaki-parca-ve'), ornek:'repertuarım',
        parametreler:{ type:'object', properties:{ tur:{ type:'string', enum:['piece', 'technique'], description:'parça veya teknik' } } }, calistir:repertuvar },

      { ad:'esp_kart_ekle', tur:'yaz', ozetAd:yz('esp.core.kingarac.dil-karti-ekle'), ornek:'pragmatik kelimesini kart yap: faydacı',
        aciklama:yz('esp.core.kingarac.dil-destesine-yeni-kelime-ka'),
        parametreler:{ type:'object', properties:{ on:{ type:'string', maxLength:120, description:'kelime ya da ifade' },
          arka:{ type:'string', maxLength:240, description:'karşılığı' }, dil:{ type:'string', enum:['en', 'de', 'fr', 'es', 'it', 'ru', 'ar', 'ja'] } },
          required:['on', 'arka'] },
        onizle:p => ({ metin:yz('esp.core.kingarac.dil-destesine-kart-eklenecek') + p.on + '» → «' + p.arka + '»' + (p.dil ? ' (' + p.dil + ')' : '') + '.' }),
        uygula:async p => {
          const c = await M().saveCard(M().newCard({ front:p.on, back:p.arka, lang:p.dil || (S().ui && S().ui.deckLang) || 'en' }));
          render();
          /* «King ne yaptı» ve «az önce eklediğim kelime» neyin eklendiğini söyleyebilsin (King-Bench diyalog). */
          return { metin:'«' + p.on + '» → «' + p.arka + '» kartını ekledim.', geriAl:c && c.id ? async () => { await M().deleteCard(c.id); render(); } : null };
        } },
      { ad:'esp_alinti_ekle', tur:'yaz', ozetAd:yz('esp.core.kingarac.alinti-kaydet'), ornek:'alıntı: Düşünüyorum öyleyse varım',
        aciklama:yz('esp.core.kingarac.bir-kitaptan-alintiyi-ya-da'),
        parametreler:{ type:'object', properties:{ metin:{ type:'string', maxLength:1000, description:'alıntının metni, aynen' },
          kitap:{ type:'string', maxLength:120, description:'kitabın adı ya da adının bir parçası' } }, required:['metin'] },
        onizle:p => {
          const b = alintiKitabi(p.kitap);
          if(p.kitap && !b) return { hata:'kütüphanede «' + p.kitap + '» adıyla tek bir kitap bulamadım' };
          return { metin:(b ? '«' + b.title + '» için alıntı' : yz('esp.core.kingarac.kitaba-baglanmamis-not')) + ' kaydedilecek.', satirlar:[String(p.metin).slice(0, 280) + (p.metin.length > 280 ? '…' : '')] };
        },
        uygula:async p => {
          const b = alintiKitabi(p.kitap);
          const n = await M().saveNote(M().newNote({ text:p.metin, bookId:b ? b.id : null }));
          render();
          return { metin:b ? '«' + b.title + '» için alıntıyı kaydettim.' : yz('esp.core.kingarac.notu-kaydettim'), geriAl:n && n.id ? async () => { await M().deleteNote(n.id); render(); } : null };
        } },
      { ad:'esp_kitap_bitir', tur:'yaz', ozetAd:yz('esp.core.kingarac.kitabi-bitir'), ornek:yz('esp.core.kingarac.suc-ve-ceza-yi-bitirdim'),
        aciklama:yz('esp.core.kingarac.kutuphanedeki-bir-kitabi-bug'),
        parametreler:{ type:'object', properties:{ kitap:{ type:'string', maxLength:120, description:'kitabın adı ya da adının bir parçası' } }, required:['kitap'] },
        onizle:p => { const b = kitapBul(p.kitap);
          if(!b) return { hata:'kütüphanede «' + p.kitap + '» adıyla tek bir kitap bulamadım' };
          if(b.finishedAt) return { hata:'«' + b.title + '» zaten bitmiş' };
          return { metin:'«' + b.title + '» bugün bitmiş olarak işaretlenecek.' }; },
        uygula:async p => {
          const b = kitapBul(p.kitap);
          if(!b || b.finishedAt) return { ok:false, metin:yz('esp.core.kingarac.kitap-bulunamadi-ya-da-zaten') };
          await M().saveBook(Object.assign({}, b, { finishedAt:U().todayISO() }));
          render();
          return { metin:'«' + b.title + '» bitti olarak işaretlendi.', geriAl:async () => { await M().saveBook(Object.assign({}, b, { finishedAt:null })); render(); } };
        } },

      { ad:'esp_oturum', tur:'yaz', ozetAd:yz('esp.core.kingarac.calisma-oturumunu-guncelle-v'),
        aciklama:yz('esp.core.kingarac.esp-calisma-oturumunu-guncel'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'oturum kimliği' },
          tarih:{ type:'string', maxLength:10, description:'oturum günü (YYYY-AA-GG; boşsa bugün)' },
          dakika:{ type:'number', minimum:1, maximum:600, description:'dakika' },
          alan:{ type:'string', enum:DISCIPLINE_IDS, description:'çalışılan alan' },
          not:{ type:'string', maxLength:200, description:'not' }
        }, required:['islem'] },
        onizle:p => {
          const d = tarihMi(p.tarih) ? p.tarih : U().todayISO();
          const bul = oturumBul(d, p);
          if(bul.hata) return bul;
          const s = bul.oge;
          if(p.islem === 'sil'){
            return { metin: d + ' günündeki ' + alanAd(s.disc) + ' oturumu (' + s.minutes + ' dk) silinecek.' };
          }
          if(p.dakika == null && !p.alan && p.not == null) return { hata: 'güncellenecek alan, dakika ya da not belirtmelisin' };
          return { metin: d + ' günündeki oturum güncellenecek' + (p.dakika != null ? ': ' + p.dakika + ' dk' : '') + '.' };
        },
        uygula:async p => {
          const d = tarihMi(p.tarih) ? p.tarih : U().todayISO();
          const bul = oturumBul(d, p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const s = bul.oge;
          const eski = Object.assign({}, s);
          if(p.islem === 'sil'){
            await M().deleteSession(d, s.id);
            render();
            return {
              metin: yz('esp.core.kingarac.oturumu-sildim'),
              geriAl:async () => {
                const day = M().ensureDay(d);
                day.sessions.push(M().normSession(eski));
                await M().saveDay(d);
                render();
              }
            };
          }
          const patch = {};
          if(p.dakika != null) patch.minutes = p.dakika;
          if(p.alan) patch.disc = p.alan;
          if(p.not != null) patch.note = p.not;
          await M().updateSession(d, s.id, patch);
          render();
          return {
            metin: yz('esp.core.kingarac.oturumu-guncelledim'),
            geriAl:async () => {
              await M().updateSession(d, s.id, eski);
              render();
            }
          };
        } },

      { ad:'esp_arguman', tur:'yaz', ozetAd:yz('esp.core.kingarac.tez-ekle-guncelle-veya-sil'),
        aciklama:yz('esp.core.kingarac.sempozyuma-tez-ekler-guncell'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'tez kimliği' },
          tez:{ type:'string', maxLength:500, description:'tez cümlesi' },
          durum:{ type:'string', enum:['open', 'closed', 'abandoned'], description:'tez durumu' },
          itiraz:{ type:'string', maxLength:300, description:'eklenecek itiraz' },
          destek:{ type:'string', maxLength:300, description:'destekleyen gerekçe' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.tez) return { hata: 'tez cümlesi gerekir' };
            return { metin: yz('esp.core.kingarac.yeni-tez-eklenecek') + p.tez + '»' };
          }
          const bul = adlaBul(S().args, p.id, 'thesis', p.tez, 'tez');
          if(bul.hata) return bul;
          const a = bul.oge;
          if(p.islem === 'sil') return { metin: yz('esp.core.kingarac.tez-silinecek') + a.thesis + '»' };
          return { metin: yz('esp.core.kingarac.tez-guncellenecek') + a.thesis + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const a = await M().saveArgument(M().newArgument({
              thesis: p.tez,
              status: p.durum || 'open',
              supports: p.destek ? [p.destek] : [],
              objections: p.itiraz ? [{ id: U().uid('o'), text: p.itiraz, answered: false }] : []
            }));
            render();
            return {
              metin: yz('esp.core.kingarac.tezi-ekledim') + a.thesis + '».',
              geriAl:async () => { await M().deleteArgument(a.id); render(); }
            };
          }
          const bul = adlaBul(S().args, p.id, 'thesis', p.tez, 'tez');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const a = bul.oge;
          const eski = JSON.parse(JSON.stringify(a));
          if(p.islem === 'sil'){
            await M().deleteArgument(a.id);
            render();
            return {
              metin: yz('esp.core.kingarac.tezi-sildim'),
              geriAl:async () => { await M().saveArgument(eski); render(); }
            };
          }
          const guncel = Object.assign({}, a);
          if(p.tez) guncel.thesis = p.tez;
          if(p.durum) guncel.status = p.durum;
          if(p.destek) guncel.supports = (guncel.supports || []).concat([p.destek]);
          if(p.itiraz) guncel.objections = (guncel.objections || []).concat([{ id: U().uid('o'), text: p.itiraz, answered: false }]);
          await M().saveArgument(guncel);
          render();
          return {
            metin: yz('esp.core.kingarac.tezi-guncelledim'),
            geriAl:async () => { await M().saveArgument(eski); render(); }
          };
        } },

      { ad:'esp_dosya', tur:'yaz', ozetAd:yz('esp.core.kingarac.ek-dosya-ekle-veya-sil'),
        aciklama:yz('esp.core.kingarac.bolume-ek-dosya-not-belge'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'dosya kimliği' },
          alan:{ type:'string', enum:DISCIPLINE_IDS, description:'bölüm/disiplin' },
          tur:{ type:'string', enum:['note', 'doc', 'link', 'audio'], description:'dosya türü' },
          baslik:{ type:'string', maxLength:120, description:'başlık' },
          metin:{ type:'string', maxLength:1000, description:'metin veya özet' },
          url:{ type:'string', maxLength:300, description:'bağlantı adresi' },
          sure:{ type:'integer', minimum:1, maximum:3600, description:'ses süresi (saniye)' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.alan) return { hata: 'bölüm (alan) belirtmelisin' };
            if(!p.baslik && !p.metin) return { hata: 'başlık ya da metin gerekir' };
            return { metin: yz('esp.core.kingarac.ek-dosya-kaydedilecek') + (p.baslik || p.metin) + '» (' + alanAd(p.alan) + ').' };
          }
          const bul = adlaBul(S().assets, p.id, 'title', p.baslik, 'dosya');
          if(bul.hata) return bul;
          return { metin: yz('esp.core.kingarac.ek-dosya-silinecek') + bul.oge.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            if(!p.alan) return { ok:false, metin:yz('esp.core.kingarac.bolum-alan-belirtmelisin') };
            const res = await M().saveAsset(M().newAsset({
              disc: p.alan,
              kind: p.tur || 'note',
              title: p.baslik || '',
              text: p.metin || '',
              url: p.url || '',
              seconds: p.sure || null
            }));
            if(!res.ok) return { ok:false, metin: res.error || 'Kaydedilemedi.' };
            const a = res.asset;
            render();
            return {
              metin: yz('esp.core.kingarac.ek-dosyayi-kaydettim'),
              geriAl:async () => { await M().deleteAsset(a.id); render(); }
            };
          }
          const bul = adlaBul(S().assets, p.id, 'title', p.baslik, 'dosya');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const a = bul.oge;
          const eski = Object.assign({}, a);
          await M().deleteAsset(a.id);
          render();
          return {
            metin: yz('esp.core.kingarac.ek-dosyayi-sildim'),
            geriAl:async () => { await M().saveAsset(eski); render(); }
          };
        } },

      { ad:'esp_eser', tur:'yaz', ozetAd:yz('esp.core.kingarac.parca-veya-teknik-ekle-gunce'),
        aciklama:yz('esp.core.kingarac.muzik-studyosuna-parca-veya'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'eser kimliği' },
          ad:{ type:'string', maxLength:120, description:'parça veya teknik adı' },
          tur:{ type:'string', enum:['piece', 'technique'], description:'tür' },
          hedef_bpm:{ type:'integer', minimum:20, maximum:300, description:'hedef BPM' },
          ton:{ type:'string', maxLength:20, description:'ton veya anahtar' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.ad) return { hata: 'eser adı gerekir' };
            return { metin: yz('esp.core.kingarac.yeni-parca-teknik-eklenecek') + p.ad + '»' + (p.hedef_bpm ? ' (Hedef: ' + p.hedef_bpm + ' BPM)' : '') + '.' };
          }
          const bul = adlaBul(S().pieces, p.id, 'name', p.ad, 'eser');
          if(bul.hata) return bul;
          const pc = bul.oge;
          if(p.islem === 'sil') return { metin: yz('esp.core.kingarac.parca-teknik-silinecek') + pc.name + '»' };
          return { metin: yz('esp.core.kingarac.parca-teknik-guncellenecek') + pc.name + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const pc = await M().savePiece(M().newPiece({
              name: p.ad,
              kind: p.tur || 'piece',
              targetBpm: p.hedef_bpm || null,
              key: p.ton || ''
            }));
            render();
            return {
              metin: yz('esp.core.kingarac.parcayi-ekledim') + pc.name + '».',
              geriAl:async () => { await M().deletePiece(pc.id); render(); }
            };
          }
          const bul = adlaBul(S().pieces, p.id, 'name', p.ad, 'eser');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const pc = bul.oge;
          const eski = JSON.parse(JSON.stringify(pc));
          if(p.islem === 'sil'){
            await M().deletePiece(pc.id);
            render();
            return {
              metin: yz('esp.core.kingarac.parcayi-sildim'),
              geriAl:async () => { await M().savePiece(eski); render(); }
            };
          }
          const guncel = Object.assign({}, pc);
          if(p.ad) guncel.name = p.ad;
          if(p.tur) guncel.kind = p.tur;
          if(p.hedef_bpm != null) guncel.targetBpm = p.hedef_bpm;
          if(p.ton) guncel.key = p.ton;
          await M().savePiece(guncel);
          render();
          return {
            metin: yz('esp.core.kingarac.parcayi-guncelledim'),
            geriAl:async () => { await M().savePiece(eski); render(); }
          };
        } },

      { ad:'esp_hatirlatma', tur:'yaz', ozetAd:yz('esp.core.kingarac.hatirlatici-ekle-veya-sil'),
        aciklama:yz('esp.core.kingarac.disipline-bagli-hatirlatici'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'hatırlatıcı kimliği' },
          metin:{ type:'string', maxLength:200, description:'hatırlatma metni' },
          alan:{ type:'string', enum:DISCIPLINE_IDS, description:'disiplin' },
          tarih:{ type:'string', maxLength:10, description:'vade tarihi (YYYY-AA-GG)' },
          tekrar:{ type:'string', enum:['none', 'daily', 'weekly', 'monthly'], description:'tekrar sıklığı' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.alan) return { hata: 'bölüm (alan) belirtmelisin' };
            if(!p.metin) return { hata: 'hatırlatma metni gerekir' };
            return { metin: yz('esp.core.kingarac.hatirlatici-eklenecek') + p.metin + '» (' + alanAd(p.alan) + (p.tarih ? ', ' + p.tarih : '') + ').' };
          }
          const bul = adlaBul(S().reminders, p.id, 'text', p.metin, 'hatırlatıcı');
          if(bul.hata) return bul;
          return { metin: yz('esp.core.kingarac.hatirlatici-silinecek') + bul.oge.text + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            if(!p.alan) return { ok:false, metin:yz('esp.core.kingarac.bolum-alan-belirtmelisin') };
            const res = await M().saveReminder(M().newReminder({
              disc: p.alan,
              text: p.metin,
              due: p.tarih || U().todayISO(),
              repeat: p.tekrar || 'none'
            }));
            if(!res.ok) return { ok:false, metin: res.error || 'Kaydedilemedi.' };
            const r = res.reminder;
            render();
            return {
              metin: yz('esp.core.kingarac.hatirlaticiyi-kaydettim'),
              geriAl:async () => { await M().deleteReminder(r.id); render(); }
            };
          }
          const bul = adlaBul(S().reminders, p.id, 'text', p.metin, 'hatırlatıcı');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const r = bul.oge;
          const eski = Object.assign({}, r);
          await M().deleteReminder(r.id);
          render();
          return {
            metin: yz('esp.core.kingarac.hatirlaticiyi-sildim'),
            geriAl:async () => { await M().saveReminder(eski); render(); }
          };
        } },

      { ad:'esp_hedef', tur:'yaz', ozetAd:yz('esp.core.kingarac.hedef-ekle-veya-sil'),
        aciklama:yz('esp.core.kingarac.zamana-bagli-hedef-ekler-ya'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'hedef kimliği' },
          hedef:{ type:'string', maxLength:120, description:'hedef tanımı' },
          alan:{ type:'string', enum:DISCIPLINE_IDS, description:'disiplin' },
          tarih:{ type:'string', maxLength:10, description:'hedef tarihi (YYYY-AA-GG)' },
          not:{ type:'string', maxLength:200, description:'açıklama' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.alan) return { hata: 'bölüm (alan) belirtmelisin' };
            if(!p.hedef) return { hata: 'hedef tanımı gerekir' };
            return { metin: yz('esp.core.kingarac.hedef-eklenecek') + p.hedef + '» (' + alanAd(p.alan) + (p.tarih ? ', ' + p.tarih : '') + ').' };
          }
          const bul = adlaBul(S().goals, p.id, 'label', p.hedef, 'hedef');
          if(bul.hata) return bul;
          return { metin: yz('esp.core.kingarac.hedef-silinecek') + bul.oge.label + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            if(!p.alan) return { ok:false, metin:yz('esp.core.kingarac.bolum-alan-belirtmelisin') };
            const g = await M().saveGoal(M().newGoal({
              disc: p.alan,
              label: p.hedef,
              date: p.tarih || null,
              note: p.not || ''
            }));
            render();
            return {
              metin: yz('esp.core.kingarac.hedefi-kaydettim'),
              geriAl:async () => { await M().deleteGoal(g.id); render(); }
            };
          }
          const bul = adlaBul(S().goals, p.id, 'label', p.hedef, 'hedef');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const g = bul.oge;
          const eski = Object.assign({}, g);
          await M().deleteGoal(g.id);
          render();
          return {
            metin: yz('esp.core.kingarac.hedefi-sildim'),
            geriAl:async () => { await M().saveGoal(eski); render(); }
          };
        } },

      { ad:'esp_karar_kapat', tur:'yaz', ozetAd:yz('esp.core.kingarac.karari-kapat'),
        aciklama:yz('esp.core.kingarac.ofiste-alinan-acik-bir-karar'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['kapat'], description:'işlem' },
          id:{ type:'string', maxLength:40, description:'karar kimliği' },
          metin:{ type:'string', maxLength:120, description:'karar metninin parçası' },
          sonuc:{ type:'string', maxLength:300, description:'kapanış sonucu' }
        } },
        onizle:p => {
          const bul = kararBul(p);
          if(bul.hata) return bul;
          return { metin: yz('esp.core.kingarac.karar-kapatilacak') + bul.oge.text + '»' + (p && p.sonuc ? ' (Sonuç: ' + p.sonuc + ')' : '') + '.' };
        },
        uygula:async p => {
          const bul = kararBul(p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const d = bul.oge;
          const eski = Object.assign({}, d);
          await M().closeDecision(d.id, (p && p.sonuc) || yz('esp.core.kingarac.king-ile-kapatildi'));
          render();
          return {
            metin: yz('esp.core.kingarac.karari-kapattim') + d.text + '».',
            geriAl:async () => { await M().saveDecision(eski); render(); }
          };
        } },

      { ad:'esp_kart_sil', tur:'yaz', ozetAd:yz('esp.core.kingarac.dil-kartini-sil'),
        aciklama:yz('esp.core.kingarac.dil-destesinden-kelime-karti'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['sil'], description:'işlem' },
          id:{ type:'string', maxLength:40, description:'kart kimliği' },
          on:{ type:'string', maxLength:120, description:'kartın ön yüzü (kelime)' }
        } },
        onizle:p => {
          const bul = adlaBul(S().cards, p && p.id, 'front', p && p.on, 'kart');
          if(bul.hata) return bul;
          const c = bul.oge;
          return { metin: yz('esp.core.kingarac.dil-karti-silinecek') + c.front + '» → «' + c.back + '»' + (c.lang ? ' (' + c.lang + ')' : '') + '.' };
        },
        uygula:async p => {
          const bul = adlaBul(S().cards, p && p.id, 'front', p && p.on, 'kart');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const c = bul.oge;
          const eski = JSON.parse(JSON.stringify(c));
          await M().deleteCard(c.id);
          render();
          return {
            metin: yz('esp.core.kingarac.karti-sildim') + c.front + '».',
            geriAl:async () => { await M().saveCard(eski); render(); }
          };
        } },

      { ad:'esp_kaynak', tur:'yaz', ozetAd:yz('esp.core.kingarac.kaynak-ekle-veya-sil'),
        aciklama:yz('esp.core.kingarac.tarih-masasina-kaynak-ekler'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'kaynak kimliği' },
          baslik:{ type:'string', maxLength:120, description:'kaynak başlığı' },
          yazar:{ type:'string', maxLength:100, description:'yazar' },
          yil:{ type:'integer', description:'kaynak yılı' },
          tur:{ type:'string', enum:['primary', 'secondary'], description:'birincil ya da ikincil kaynak' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.baslik) return { hata: 'kaynak başlığı gerekir' };
            return { metin: yz('esp.core.kingarac.tarih-kaynagi-eklenecek') + p.baslik + '»' + (p.yazar ? ' — ' + p.yazar : '') + '.' };
          }
          const bul = adlaBul(S().sources, p.id, 'title', p.baslik, 'kaynak');
          if(bul.hata) return bul;
          return { metin: yz('esp.core.kingarac.tarih-kaynagi-silinecek') + bul.oge.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const res = await M().saveSource(M().newSource({
              title: p.baslik,
              author: p.yazar || '',
              year: p.yil || null,
              kind: p.tur || 'secondary'
            }));
            if(!res.ok) return { ok:false, metin: res.error || 'Kaydedilemedi.' };
            const s = res.source;
            render();
            return {
              metin: yz('esp.core.kingarac.kaynagi-kaydettim'),
              geriAl:async () => { await M().deleteSource(s.id); render(); }
            };
          }
          const bul = adlaBul(S().sources, p.id, 'title', p.baslik, 'kaynak');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const s = bul.oge;
          const eski = JSON.parse(JSON.stringify(s));
          await M().deleteSource(s.id);
          render();
          return {
            metin: yz('esp.core.kingarac.kaynagi-sildim'),
            geriAl:async () => { await M().saveSource(eski); render(); }
          };
        } },

      { ad:'esp_kitap', tur:'yaz', ozetAd:yz('esp.core.kingarac.kitabi-guncelle-veya-sil'),
        aciklama:yz('esp.core.kingarac.kutuphanedeki-kitabi-guncell'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'kitap kimliği' },
          ad:{ type:'string', maxLength:120, description:'kitap adı' },
          yazar:{ type:'string', maxLength:100, description:'yazar' },
          tur:{ type:'string', enum:['primary', 'secondary'], description:'primer ya da sekonder metin' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle') return { hata:'kitap eklemek için eylem_kitap_ekle eylemi kullanılmalı' };
          const bul = adlaBul(S().books, p.id, 'title', p.ad, 'kitap');
          if(bul.hata) return bul;
          const b = bul.oge;
          if(p.islem === 'sil') return { metin: yz('esp.core.kingarac.kitap-silinecek') + b.title + '»' };
          return { metin: yz('esp.core.kingarac.kitap-guncellenecek') + b.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle') return { ok:false, metin:yz('esp.core.kingarac.kitap-eklemek-icin-eylem-kit') };
          const bul = adlaBul(S().books, p.id, 'title', p.ad, 'kitap');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const b = bul.oge;
          const eski = Object.assign({}, b);
          if(p.islem === 'sil'){
            await M().deleteBook(b.id);
            render();
            return {
              metin: yz('esp.core.kingarac.kitabi-sildim'),
              geriAl:async () => { await M().saveBook(eski); render(); }
            };
          }
          const guncel = Object.assign({}, b);
          if(p.ad) guncel.title = p.ad;
          if(p.yazar) guncel.author = p.yazar;
          if(p.tur) guncel.kind = p.tur;
          await M().saveBook(guncel);
          render();
          return {
            metin: yz('esp.core.kingarac.kitabi-guncelledim'),
            geriAl:async () => { await M().saveBook(eski); render(); }
          };
        } },

      { ad:'esp_not_sil', tur:'yaz', ozetAd:yz('esp.core.kingarac.notu-sil'),
        aciklama:yz('esp.core.kingarac.kutuphanedeki-bir-atomik-not'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['sil'], description:'işlem' },
          id:{ type:'string', maxLength:40, description:'not kimliği' },
          metin:{ type:'string', maxLength:120, description:'not metninin bir parçası' }
        } },
        onizle:p => {
          const bul = adlaBul(S().notes, p && p.id, 'text', p && p.metin, 'not');
          if(bul.hata) return bul;
          const n = bul.oge;
          return { metin: yz('esp.core.kingarac.not-silinecek') + n.text.slice(0, 100) + (n.text.length > 100 ? '…' : '') + '»' };
        },
        uygula:async p => {
          const bul = adlaBul(S().notes, p && p.id, 'text', p && p.metin, 'not');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const n = bul.oge;
          const eski = JSON.parse(JSON.stringify(n));
          await M().deleteNote(n.id);
          render();
          return {
            metin: yz('esp.core.kingarac.notu-sildim'),
            geriAl:async () => { await M().saveNote(eski); render(); }
          };
        } },

      { ad:'esp_olay', tur:'yaz', ozetAd:yz('esp.core.kingarac.tarih-olayi-ekle-guncelle-ve'),
        aciklama:yz('esp.core.kingarac.kronolojiye-tarih-olayi-ekle'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'olay kimliği' },
          baslik:{ type:'string', maxLength:120, description:'olay başlığı' },
          yil:{ type:'integer', description:'olay yılı' },
          tur:{ type:'string', maxLength:30, description:'olay türü (siyasi, kulturlu, askeri vb.)' },
          bolge:{ type:'string', maxLength:30, description:'bölge (avrupa, dunya, dogu vb.)' },
          aciklama:{ type:'string', maxLength:300, description:'neden/açıklama' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.baslik) return { hata: 'olay başlığı gerekir' };
            if(p.yil == null) return { hata: 'olay yılı gerekir' };
            return { metin: yz('esp.core.kingarac.tarih-olayi-eklenecek') + p.baslik + '» (' + p.yil + ').' };
          }
          const bul = adlaBul(S().events, p.id, 'title', p.baslik, 'olay');
          if(bul.hata) return bul;
          const e = bul.oge;
          if(p.islem === 'sil') return { metin: yz('esp.core.kingarac.tarih-olayi-silinecek') + e.title + '»' };
          return { metin: yz('esp.core.kingarac.tarih-olayi-guncellenecek') + e.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const res = await M().saveEvent(M().newEvent({
              title: p.baslik,
              year: p.yil,
              kind: p.tur || 'siyasi',
              region: p.bolge || 'dunya',
              why: p.aciklama || ''
            }));
            if(!res.ok) return { ok:false, metin: res.error || 'Kaydedilemedi.' };
            const e = res.event;
            render();
            return {
              metin: yz('esp.core.kingarac.olayi-kaydettim'),
              geriAl:async () => { await M().deleteEvent(e.id); render(); }
            };
          }
          const bul = adlaBul(S().events, p.id, 'title', p.baslik, 'olay');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const e = bul.oge;
          const eski = JSON.parse(JSON.stringify(e));
          if(p.islem === 'sil'){
            await M().deleteEvent(e.id);
            render();
            return {
              metin: yz('esp.core.kingarac.olayi-sildim'),
              geriAl:async () => { await M().saveEvent(eski); render(); }
            };
          }
          const guncel = Object.assign({}, e);
          if(p.baslik) guncel.title = p.baslik;
          if(p.yil != null) guncel.year = p.yil;
          if(p.tur) guncel.kind = p.tur;
          if(p.bolge) guncel.region = p.bolge;
          if(p.aciklama) guncel.why = p.aciklama;
          const res = await M().saveEvent(guncel);
          if(!res.ok) return { ok:false, metin: res.error || 'Güncellenemedi.' };
          render();
          return {
            metin: yz('esp.core.kingarac.olayi-guncelledim'),
            geriAl:async () => { await M().saveEvent(eski); render(); }
          };
        } },

      { ad:'esp_ses_kaydi', tur:'yaz', ozetAd:yz('esp.core.kingarac.diksiyon-olcumu-ekle-veya-si'),
        aciklama:yz('esp.core.kingarac.diksiyon-calisma-olcumunu-su'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'kayıt kimliği' },
          tarih:{ type:'string', maxLength:10, description:'kayıt tarihi (YYYY-AA-GG)' },
          saniye:{ type:'integer', minimum:1, maximum:3600, description:'okuma süresi (saniye)' },
          kelime:{ type:'integer', minimum:1, maximum:2000, description:'okunan kelime sayısı' },
          hata:{ type:'integer', minimum:0, maximum:200, description:'işaretlenen hata sayısı' },
          not:{ type:'string', maxLength:200, description:'not' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            return { metin: yz('esp.core.kingarac.diksiyon-olcum-kaydi-eklenec') + (p.saniye ? p.saniye + ' sn' : '') + (p.kelime ? ' · ' + p.kelime + ' kelime' : '') + (p.hata != null ? ' · ' + p.hata + ' hata' : '') + '.' };
          }
          const bul = kayitBul(p);
          if(bul.hata) return bul;
          const r = bul.oge;
          return { metin: yz('esp.core.kingarac.diksiyon-olcum-kaydi-silinec') + r.date + (r.seconds ? ' · ' + r.seconds + ' sn' : '') + '.' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const rec = await M().saveRecording(M().newRecording({
              date: p.tarih || U().todayISO(),
              seconds: p.saniye != null ? p.saniye : null,
              secondsCert: p.saniye != null ? 'measured' : 'missing',
              words: p.kelime != null ? p.kelime : null,
              wordsCert: p.kelime != null ? 'measured' : 'missing',
              errors: p.hata != null ? p.hata : null,
              errorsCert: p.hata != null ? 'estimated' : 'missing',
              note: p.not || ''
            }));
            render();
            return {
              metin: yz('esp.core.kingarac.diksiyon-olcumunu-kaydettim'),
              geriAl:async () => { await M().deleteRecording(rec.id); render(); }
            };
          }
          const bul = kayitBul(p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const r = bul.oge;
          const eski = Object.assign({}, r);
          await M().deleteRecording(r.id);
          render();
          return {
            metin: yz('esp.core.kingarac.diksiyon-olcumunu-sildim'),
            geriAl:async () => { await M().saveRecording(eski); render(); }
          };
        } },

      { ad:'esp_taslak', tur:'yaz', ozetAd:yz('esp.core.kingarac.yazi-taslagi-ekle-guncelle-v'),
        aciklama:yz('esp.core.kingarac.yazi-laboratuvarina-taslak-e'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'taslak kimliği' },
          baslik:{ type:'string', maxLength:120, description:'taslak başlığı' },
          metin:{ type:'string', maxLength:5000, description:'taslak metni' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.baslik) return { hata: 'taslak başlığı gerekir' };
            return { metin: yz('esp.core.kingarac.yazi-taslagi-eklenecek') + p.baslik + '»' };
          }
          const bul = adlaBul(S().drafts, p.id, 'title', p.baslik, 'taslak');
          if(bul.hata) return bul;
          const d = bul.oge;
          if(p.islem === 'sil') return { metin: yz('esp.core.kingarac.yazi-taslagi-silinecek') + d.title + '»' };
          return { metin: yz('esp.core.kingarac.yazi-taslagi-guncellenecek') + d.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const d = await M().saveDraft(M().newDraft({
              title: p.baslik,
              text: p.metin || ''
            }));
            render();
            return {
              metin: yz('esp.core.kingarac.yazi-taslagini-ekledim') + d.title + '».',
              geriAl:async () => { await M().deleteDraft(d.id); render(); }
            };
          }
          const bul = adlaBul(S().drafts, p.id, 'title', p.baslik, 'taslak');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const d = bul.oge;
          const eski = Object.assign({}, d);
          if(p.islem === 'sil'){
            await M().deleteDraft(d.id);
            render();
            return {
              metin: yz('esp.core.kingarac.yazi-taslagini-sildim'),
              geriAl:async () => { await M().saveDraft(eski); render(); }
            };
          }
          const guncel = Object.assign({}, d);
          if(p.baslik) guncel.title = p.baslik;
          if(p.metin != null) guncel.text = p.metin;
          await M().saveDraft(guncel);
          render();
          return {
            metin: yz('esp.core.kingarac.yazi-taslagini-guncelledim'),
            geriAl:async () => { await M().saveDraft(eski); render(); }
          };
        } },

      { ad:'esp_zincir', tur:'yaz', ozetAd:yz('esp.core.kingarac.neden-zinciri-ekle-guncelle'),
        aciklama:yz('esp.core.kingarac.tarih-olayina-neden-sonuc-zi'),
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'zincir kimliği' },
          olay_id:{ type:'string', maxLength:40, description:'olay kimliği' },
          olay_baslik:{ type:'string', maxLength:120, description:'olay başlığı' },
          soru:{ type:'string', maxLength:200, description:'araştırma sorusu' },
          halka:{ type:'string', maxLength:300, description:'nedensellik halkası' },
          halka_tur:{ type:'string', enum:['yapisal', 'tetikleyici', 'kurumsal', 'bireysel'], description:'halka türü' },
          not:{ type:'string', maxLength:200, description:'açıklama' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            let ev = null;
            if(p.olay_id) ev = S().events.find(e => e.id === p.olay_id);
            else if(p.olay_baslik){
              const evRes = adlaBul(S().events, null, 'title', p.olay_baslik, 'olay');
              if(evRes.hata) return evRes;
              ev = evRes.oge;
            }
            if(!ev && !p.olay_id) return { hata: 'zincirin bağlanacağı olay belirtilmeli (olay_id veya olay_baslik)' };
            return { metin: yz('esp.core.kingarac.neden-zinciri-eklenecek') + (ev ? ev.title : p.olay_id) + '» için.' };
          }
          const bul = zincirBul(p);
          if(bul.hata) return bul;
          const c = bul.oge;
          if(p.islem === 'sil') return { metin: yz('esp.core.kingarac.neden-zinciri-silinecek-id') + c.id + ').' };
          return { metin: yz('esp.core.kingarac.neden-zinciri-guncellenecek') + c.id + ').' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            let ev = null;
            if(p.olay_id) ev = S().events.find(e => e.id === p.olay_id);
            else if(p.olay_baslik){
              const evRes = adlaBul(S().events, null, 'title', p.olay_baslik, 'olay');
              if(evRes.hata) return { ok:false, metin:evRes.hata };
              ev = evRes.oge;
            }
            const eventId = p.olay_id || (ev ? ev.id : null);
            if(!eventId) return { ok:false, metin: yz('esp.core.kingarac.zincir-bir-olaya-baglanmadan') };
            const links = p.halka ? [{ id: U().uid('l'), kind: p.halka_tur || 'yapisal', text: p.halka, sourceId: null }] : [];
            const res = await M().saveChain(M().newChain({
              eventId: eventId,
              question: p.soru || '',
              links: links,
              note: p.not || ''
            }));
            if(!res.ok) return { ok:false, metin: res.error || 'Kaydedilemedi.' };
            const c = res.chain;
            render();
            return {
              metin: yz('esp.core.kingarac.neden-zincirini-kaydettim'),
              geriAl:async () => { await M().deleteChain(c.id); render(); }
            };
          }
          const bul = zincirBul(p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const c = bul.oge;
          const eski = JSON.parse(JSON.stringify(c));
          if(p.islem === 'sil'){
            await M().deleteChain(c.id);
            render();
            return {
              metin: yz('esp.core.kingarac.neden-zincirini-sildim'),
              geriAl:async () => { await M().saveChain(eski); render(); }
            };
          }
          const guncel = Object.assign({}, c);
          if(p.soru) guncel.question = p.soru;
          if(p.not) guncel.note = p.not;
          if(p.halka) guncel.links = (guncel.links || []).concat([{ id: U().uid('l'), kind: p.halka_tur || 'yapisal', text: p.halka, sourceId: null }]);
          const res = await M().saveChain(guncel);
          if(!res.ok) return { ok:false, metin: res.error || 'Güncellenemedi.' };
          render();
          return {
            metin: yz('esp.core.kingarac.neden-zincirini-guncelledim'),
            geriAl:async () => { await M().saveChain(eski); render(); }
          };
        } },
    ];
    const ogret = (ESP.KingOgret && ESP.KingOgret.araclar) ? ESP.KingOgret.araclar() : [];
    return temel.concat(ogret);
  }

  /* KING-4 A3 hızlı yol: okuma sorusu sayfa açmaz; kart, alıntı ve bitirme cümleden okunur
     (yazan araç yine önizlenir, onayla yazılır). */
  const KURAL = {
    esp_gun:{ es:/^bugün (?:neler|ne) çalıştım|^dün .*hangi alan.*çalıştım/ },
    esp_hafta:{ es:/(?:bu hafta|son bir hafta|haftada).*(?:çalış|vakit|saat)/ },
    esp_kitaplar:{ es:/(^kitaplarım|kütüphanemde ne var|hangi kitapları okuyorum)/ },
    esp_kartlar:{ es:/(kaç (?:kelime )?kart|kelime kartlarım)/ },
    esp_yazilar:{ es:/(yazı taslak|taslaklarım|yazılarım)/ },
    esp_merdiven:{ es:/(merdiven|kademe|seviye|hangi basamak)/ },
    esp_argumanlar:{ es:/(tezler|argümanlar|sempozyum)/ },
    esp_olaylar:{ es:/(tarih olay|kronoloji|olaylarım)/ },
    esp_repertuvar:{ es:/(repertuvar|çaldığım|parçalarım|tekniklerim)/ },
    esp_kart_ekle:{ kural:(t, m) => { const x = /^(.+?)\s+kelimesini karta? (?:yap|ekle)\s*[:,]\s*(.+)$/i.exec(m);
      return x && x[1].length <= 120 && x[2].length <= 240 ? { on:x[1].trim(), arka:x[2].trim() } : null; } },
    esp_alinti_ekle:{ kural:(t, m) => { const x = /^(?:kitaptan\s+)?alıntı(?:\s+ekle)?\s*[:,]\s*(\S[\s\S]{0,999})$/i.exec(m); return x ? { metin:x[1].trim() } : null; } },
    esp_kitap_bitir:{ kural:(t, m) => { const x = /^(.+?)(?:['’](?:[yn]?[ıiuü]|[ıiuü]))?(?:\s+kitab(?:ı|ını|i|ini))?\s*(?:okumay[ıi])?\s+(?:bitirdim|tamamladım)[.!]?$/i.exec(m);
      const k = x && x[1].trim();
      return k && !/^(kitab[ıi]?|onu|bunu|şunu)$/i.test(k) && k.length <= 120 ? { kitap:k } : null; } },
  };
  const listeKural = () => liste().map(a => Object.assign(a, KURAL[a.ad] || {}));

  return { liste:listeKural, sayfaOku };
})();
