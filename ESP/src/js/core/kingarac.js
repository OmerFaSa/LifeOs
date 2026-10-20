/* KING ARAÇLARI — ESP'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: günün ve haftanın çalışma oturumları, kitaplar, dil kartları ve
   yazı taslakları; sayıyı ESP'nin kendi kaydı verir (oturumu olmayan gün
   «veri yok», sıfır değil). ESP sertifika vermez, yetenek yargısı kurmaz
   (AGENTS §1.5): araçlar yalnız kaydı söyler.

   Yazma: oturum (dakika) King'in `kayit_gir` aracıyla ESP'nin kendi
   ayrıştırıcısından girer (ESP.Parse.parseSession). Kitap eklemek yetki
   kataloğundaki modül eylemidir (app.js, `eylem_kitap_ekle`). Burada dil
   kartı eklemek ve kitabı bitirmek durur; ikisi de önizlenir, onayla
   yazılır, «Geri al» kalır. */

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

  return { liste };
})();
