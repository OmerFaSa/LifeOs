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

window.ESP = window.ESP || {};

ESP.KingArac = (function(){
  'use strict';

  const U = () => ESP.U, M = () => ESP.Model, S = () => ESP.S;
  const tarihMi = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const alanAd = id => ((ESP.DISCIPLINE_BY_ID || {})[id] || {}).label || id;
  const render = () => { if(ESP.App && ESP.App.render) ESP.App.render(); };
  function gunler(n){ const l = []; for(let i = 0; i < n; i++) l.push(U().iso(U().addDays(U().today(), -i))); return l; }
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').trim();

  function gun(p){
    const d = tarihMi(p.tarih) ? p.tarih : U().todayISO();
    const l = M().sessionsOf(d).filter(s => s.minutes > 0).map(s => ({ alan:alanAd(s.disc), dakika:s.minutes, not:s.note || '' }));
    return { sonuc:{ tarih:d, oturumlar:l, toplam_dakika:l.length ? l.reduce((a, s) => a + s.dakika, 0) : null },
      satirlar:l.length ? l.map(s => s.alan + ' · ' + s.dakika + ' dk') : ['Bu gün için oturum kaydı yok.'] };
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
      satirlar:l.length ? ['Son ' + n + ' gün: ' + kayitli + ' gün çalışıldı'].concat(l.map(x => x.alan + ' · ' + x.dakika + ' dk')) : ['Son ' + n + ' günde oturum kaydı yok.'] };
  }

  function kitaplar(){
    const l = (S().books || []).map(b => ({ ad:b.title, yazar:b.author || '', durum:(M().bookStatus ? (M().bookStatus(b) || {}).label : '') || '',
      baslangic:b.startedAt || null, bitis:b.finishedAt || null }));
    return { sonuc:{ kitaplar:l.slice(0, 40) }, satirlar:l.length ? l.slice(0, 8).map(b => b.ad + (b.yazar ? ' — ' + b.yazar : '') + (b.durum ? ' · ' + b.durum : '')) : ['Kütüphanede kitap yok.'] };
  }

  function kartlar(){
    const l = S().cards || [];
    const vade = ESP.SRS && ESP.SRS.dueCards ? ESP.SRS.dueCards(U().todayISO()).length : null;
    const dil = {};
    l.forEach(c => { dil[c.lang || '?'] = (dil[c.lang || '?'] || 0) + 1; });
    return { sonuc:{ toplam:l.length, bugun_sirasi_gelen:vade, dillere_gore:dil },
      satirlar:['Toplam kart: ' + l.length, 'Bugün sırası gelen: ' + (vade == null ? 'veri yok' : vade)] };
  }

  function yazilar(){
    const l = (S().drafts || []).map(d => ({ baslik:d.title || 'Başlıksız', kelime:String(d.text || '').split(/\s+/).filter(Boolean).length, guncel:String(d.updatedAt || '').slice(0, 10) }));
    return { sonuc:{ taslaklar:l.slice(0, 30) }, satirlar:l.length ? l.slice(0, 8).map(d => d.baslik + ' · ' + d.kelime + ' kelime') : ['Yazı taslağı yok.'] };
  }

  function kitapBul(ad){
    const k = kucuk(ad);
    const l = (S().books || []).filter(b => kucuk(b.title).indexOf(k) >= 0);
    return l.length === 1 ? l[0] : null;
  }

  /* Kitap: adı verildiyse o; verilmediyse okunmakta olan TEK kitap. */
  function alintiKitabi(ad){
    if(ad) return kitapBul(ad);
    const l = (S().books || []).filter(b => M().bookStatus && (M().bookStatus(b) || {}).id === 'okunuyor');
    return l.length === 1 ? l[0] : null;
  }
  const SAYFA_SORU = 'Bu bir kitap sayfası. Sayfadaki metni satır satır, aynen yaz; düzeltme, özet ve yorum ekleme. Okunamayan yere […] koy.';
  async function sayfaOku(f, y){
    if(!y || typeof y.gorsel !== 'function') return 'Sayfayı okumak için Merkez’in görsel modeli gerekiyor; Merkez açıkken yeniden dene.';
    let r = null;
    try{ r = await y.gorsel(SAYFA_SORU, 'gorsel'); }catch(e){ r = null; }
    const metin = r && r.ok ? String(r.text || '').replace(/[ \t]+\n/g, '\n').trim() : '';
    if(!metin || metin.length < 8) return 'Sayfadan okunabilir bir metin çıkmadı' + (r && r.note ? ' (' + r.note + ')' : '') + '; daha yakından ve düz çek.';
    const b = alintiKitabi('');
    return { metin:'Sayfadan okudum (görsel model, doğrulanmadı).',
      satirlar:['Bir kelimeyi karta eklemek için «… kelimesini kart yap: anlamı» yaz.'],
      arac:{ ad:'esp_alinti_ekle', param:Object.assign({ metin:metin.slice(0, 1000) }, b ? { kitap:b.title } : {}) } };
  }

  function liste(){
    return [
      { ad:'esp_gun', tur:'oku', aciklama:'Bir günün ESP çalışma oturumları (alan ve dakika).', ornek:'bugün ne çalıştım',
        parametreler:{ type:'object', properties:{ tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' } } }, calistir:gun },
      { ad:'esp_hafta', tur:'oku', aciklama:'Son günlerde hangi alanda kaç dakika çalışıldığı.', ornek:'bu hafta ne kadar çalıştım',
        parametreler:{ type:'object', properties:{ gun:{ type:'integer', minimum:1, maximum:60 } } }, calistir:hafta },
      { ad:'esp_kitaplar', tur:'oku', aciklama:'Kütüphanedeki kitaplar ve durumları (okunuyor, bitti, başlanmadı).', ornek:'kitaplarım',
        calistir:kitaplar },
      { ad:'esp_kartlar', tur:'oku', aciklama:'Dil kartları: toplam, bugün sırası gelen, dillere göre.', ornek:'kaç kelime kartım var',
        calistir:kartlar },
      { ad:'esp_yazilar', tur:'oku', aciklama:'Yazı taslakları ve kelime sayıları.', ornek:'yazı taslaklarım', calistir:yazilar },
      { ad:'esp_kart_ekle', tur:'yaz', ozetAd:'Dil kartı ekle', ornek:'serendipity kelimesini kart yap: tesadüfen güzel bir şey bulmak',
        aciklama:'Dil destesine yeni kelime kartı ekler (ön yüz ve karşılığı).',
        parametreler:{ type:'object', properties:{ on:{ type:'string', maxLength:120, description:'kelime ya da ifade' },
          arka:{ type:'string', maxLength:240, description:'karşılığı' }, dil:{ type:'string', enum:['en', 'de', 'fr', 'es', 'it', 'ru', 'ar', 'ja'] } },
          required:['on', 'arka'] },
        onizle:p => ({ metin:'Dil destesine kart eklenecek: «' + p.on + '» → «' + p.arka + '»' + (p.dil ? ' (' + p.dil + ')' : '') + '.' }),
        uygula:async p => {
          const c = await M().saveCard(M().newCard({ front:p.on, back:p.arka, lang:p.dil || (S().ui && S().ui.deckLang) || 'en' }));
          render();
          return { metin:'Kartı ekledim.', geriAl:c && c.id ? async () => { await M().deleteCard(c.id); render(); } : null };
        } },
      { ad:'esp_alinti_ekle', tur:'yaz', ozetAd:'Alıntı kaydet', ornek:'alıntı: Bir insanın değeri, sevdiği şeylerin değeridir',
        aciklama:'Bir kitaptan alıntıyı ya da kitap notunu kaydeder; kitap verilmezse okunmakta olan tek kitaba bağlanır.',
        parametreler:{ type:'object', properties:{ metin:{ type:'string', maxLength:1000, description:'alıntının metni, aynen' },
          kitap:{ type:'string', maxLength:120, description:'kitabın adı ya da adının bir parçası' } }, required:['metin'] },
        onizle:p => {
          const b = alintiKitabi(p.kitap);
          if(p.kitap && !b) return { hata:'kütüphanede «' + p.kitap + '» adıyla tek bir kitap bulamadım' };
          return { metin:(b ? '«' + b.title + '» için alıntı' : 'Kitaba bağlanmamış not') + ' kaydedilecek.', satirlar:[String(p.metin).slice(0, 280) + (p.metin.length > 280 ? '…' : '')] };
        },
        uygula:async p => {
          const b = alintiKitabi(p.kitap);
          const n = await M().saveNote(M().newNote({ text:p.metin, bookId:b ? b.id : null }));
          render();
          return { metin:b ? '«' + b.title + '» için alıntıyı kaydettim.' : 'Notu kaydettim.', geriAl:n && n.id ? async () => { await M().deleteNote(n.id); render(); } : null };
        } },
      { ad:'esp_kitap_bitir', tur:'yaz', ozetAd:'Kitabı bitir', ornek:'Suç ve Ceza’yı bitirdim',
        aciklama:'Kütüphanedeki bir kitabı bugün bitmiş olarak işaretler.',
        parametreler:{ type:'object', properties:{ kitap:{ type:'string', maxLength:120, description:'kitabın adı ya da adının bir parçası' } }, required:['kitap'] },
        onizle:p => { const b = kitapBul(p.kitap);
          if(!b) return { hata:'kütüphanede «' + p.kitap + '» adıyla tek bir kitap bulamadım' };
          if(b.finishedAt) return { hata:'«' + b.title + '» zaten bitmiş' };
          return { metin:'«' + b.title + '» bugün bitmiş olarak işaretlenecek.' }; },
        uygula:async p => {
          const b = kitapBul(p.kitap);
          if(!b || b.finishedAt) return { ok:false, metin:'Kitap bulunamadı ya da zaten bitmiş.' };
          await M().saveBook(Object.assign({}, b, { finishedAt:U().todayISO() }));
          render();
          return { metin:'«' + b.title + '» bitti olarak işaretlendi.', geriAl:async () => { await M().saveBook(Object.assign({}, b, { finishedAt:null })); render(); } };
        } },
    ];
  }

  return { liste, sayfaOku };
})();
