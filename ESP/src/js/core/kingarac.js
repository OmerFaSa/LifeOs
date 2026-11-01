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

  function tekBul(liste, filtre, ad){
    const es = (liste || []).filter(filtre);
    if(es.length === 0) return { hata: (ad || 'kayıt') + ' bulunamadı' };
    if(es.length > 1) return { hata: 'birden çok eşleşen ' + (ad || 'kayıt') + ' bulundu; id belirtmelisin' };
    return { oge: es[0] };
  }

  function kararBul(p){
    const aciklar = (S().decisions || []).filter(d => !d.closedAt);
    if(p && p.id){
      const d = aciklar.find(x => x.id === p.id);
      return d ? { oge: d } : { hata: 'açık karar bulunamadı (ID: ' + p.id + ')' };
    }
    if(p && p.metin){
      const aranan = kucuk(p.metin);
      const es = aciklar.filter(d => kucuk(d.text).indexOf(aranan) >= 0);
      if(es.length === 0) return { hata: 'açık karar bulunamadı' };
      if(es.length > 1) return { hata: 'birden çok eşleşen açık karar bulundu; id belirtmelisin' };
      return { oge: es[0] };
    }
    if(aciklar.length === 1) return { oge: aciklar[0] };
    if(aciklar.length === 0) return { hata: 'açık karar yok' };
    return { hata: 'birden çok açık karar var; kapatılacak kararın metni ya da id belirtilmeli' };
  }

  function kartBul(p){
    const list = S().cards || [];
    if(p && p.id){
      const c = list.find(x => x.id === p.id);
      return c ? { oge: c } : { hata: 'kart bulunamadı (ID: ' + p.id + ')' };
    }
    if(!p || !p.on) return { hata: 'silinecek kartın ön yüzü ya da id belirtilmeli' };
    const aranan = kucuk(p.on);
    const es = list.filter(c => kucuk(c.front) === aranan || kucuk(c.front).indexOf(aranan) >= 0);
    if(es.length === 0) return { hata: 'kart bulunamadı' };
    if(es.length > 1) return { hata: 'birden çok eşleşen kart bulundu; id belirtmelisin' };
    return { oge: es[0] };
  }

  function notBul(p){
    const list = S().notes || [];
    if(p && p.id){
      const n = list.find(x => x.id === p.id);
      return n ? { oge: n } : { hata: 'not bulunamadı (ID: ' + p.id + ')' };
    }
    if(!p || !p.metin) return { hata: 'silinecek notun metni ya da id belirtilmeli' };
    const aranan = kucuk(p.metin);
    const es = list.filter(n => kucuk(n.text).indexOf(aranan) >= 0);
    if(es.length === 0) return { hata: 'not bulunamadı' };
    if(es.length > 1) return { hata: 'birden çok eşleşen not bulundu; id belirtmelisin' };
    return { oge: es[0] };
  }

  function zincirBul(p){
    const list = S().chains || [];
    if(p && p.id){
      const c = list.find(x => x.id === p.id);
      return c ? { oge: c } : { hata: 'neden zinciri bulunamadı (ID: ' + p.id + ')' };
    }
    let evId = p && p.olay_id;
    if(!evId && p && p.olay_baslik){
      const aranan = kucuk(p.olay_baslik);
      const evler = (S().events || []).filter(e => kucuk(e.title).indexOf(aranan) >= 0);
      if(evler.length === 1) evId = evler[0].id;
      else if(evler.length > 1) return { hata: 'birden çok eşleşen olay bulundu; olay_id belirtmelisin' };
      else return { hata: '«' + p.olay_baslik + '» adıyla olay bulunamadı' };
    }
    if(!evId) return { hata: 'zincir id veya olay belirtilmeli' };
    const es = list.filter(c => c.eventId === evId);
    if(es.length === 0) return { hata: 'bu olaya bağlı zincir bulunamadı' };
    if(es.length > 1) return { hata: 'bu olaya bağlı birden çok zincir var; id belirtmelisin' };
    return { oge: es[0] };
  }

  function kayitBul(p){
    const list = S().recordings || [];
    if(p && p.id){
      const r = list.find(x => x.id === p.id);
      return r ? { oge: r } : { hata: 'kayıt bulunamadı (ID: ' + p.id + ')' };
    }
    const d = p && p.tarih ? p.tarih : U().todayISO();
    const es = list.filter(r => r.date === d);
    if(es.length === 0) return { hata: d + ' tarihinde ses ölçüm kaydı bulunamadı' };
    if(es.length > 1) return { hata: d + ' tarihinde birden çok kayıt var; id belirtmelisin' };
    return { oge: es[0] };
  }

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

  function merdiven(){
    const C = ESP.Curriculum;
    if(!C || !C.overall) return { sonuc:{ kademe:null, etiket:'veri yok' }, satirlar:['Merdiven verisi yok (veri yok).'] };
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
      satirlar:yok ? ['Henüz ölçülmüş üretim yok (veri yok).'] : [
        'Genel kademe: ' + (ov.level || {}).label + ' (%' + ov.mastery + ')',
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
      satirlar:l.length ? l.slice(0, 6).map(a => (a.status === 'open' ? 'Açık: ' : 'Kapalı: ') + a.thesis.slice(0, 60)) : ['Sempozyumda kayıtlı tez yok (veri yok).']
    };
  }

  function olaylar(p){
    let l = S().events || [];
    if(p && p.donem) l = l.filter(e => e.era === p.donem);
    const ozet = l.map(e => ({ id:e.id, baslik:e.title, yil:e.year, donem:e.era, bolge:e.region }));
    return {
      sonuc:{ toplam:(S().events || []).length, filtreli:l.length, olaylar:ozet.slice(0, 40) },
      satirlar:l.length ? l.slice(0, 6).map(e => (e.year != null ? e.year + ': ' : '') + e.title) : ['Kronolojide olay kaydı yok (veri yok).']
    };
  }

  function repertuvar(p){
    let l = S().pieces || [];
    if(p && p.tur) l = l.filter(x => x.kind === p.tur);
    const ozet = l.map(x => ({ id:x.id, ad:x.name, tur:x.kind, temiz_bpm:x.cleanBpm, hedef_bpm:x.targetBpm }));
    return {
      sonuc:{ toplam:(S().pieces || []).length, filtreli:l.length, parcalar:ozet.slice(0, 30) },
      satirlar:ozet.length ? ozet.slice(0, 8).map(x => x.ad + ' · ' + (x.tur === 'piece' ? 'parça' : 'teknik') + (x.temiz_bpm ? ' · ' + x.temiz_bpm + ' BPM' : '')) : ['Repertuarda kayıt yok (veri yok).']
    };
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
      { ad:'esp_merdiven', tur:'oku', aciklama:'ESP merdiveni: yedi disiplinin kademesi, ustalık yüzdesi ve ölçülen disiplinler.', ornek:'seviyem nedir',
        parametreler:{ type:'object', properties:{} }, calistir:merdiven },
      { ad:'esp_argumanlar', tur:'oku', aciklama:'Sempozyumdaki felsefi tezler ve argümanlar (açık ve kapalı tezler).', ornek:'açık tezlerim',
        parametreler:{ type:'object', properties:{ durum:{ type:'string', enum:['acik', 'kapali', 'hepsi'], description:'tez durumu' } } }, calistir:argumanlar },
      { ad:'esp_olaylar', tur:'oku', aciklama:'Kronolojideki tarih olayları (yıl, dönem ve bölge).', ornek:'kronolojide ne var',
        parametreler:{ type:'object', properties:{ donem:{ type:'string', maxLength:30, description:'tarih dönemi' } } }, calistir:olaylar },
      { ad:'esp_repertuvar', tur:'oku', aciklama:'Müzik stüdyosundaki parça ve teknikler (temiz BPM eşikleri).', ornek:'repertuarım',
        parametreler:{ type:'object', properties:{ tur:{ type:'string', enum:['piece', 'technique'], description:'parça veya teknik' } } }, calistir:repertuvar },

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

      { ad:'esp_oturum', tur:'yaz', ozetAd:'Çalışma oturumunu güncelle veya sil',
        aciklama:'ESP çalışma oturumunu günceller ya da siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'oturum kimliği' },
          tarih:{ type:'string', maxLength:10, description:'oturum günü (YYYY-AA-GG; boşsa bugün)' },
          dakika:{ type:'number', minimum:1, maximum:600, description:'dakika' },
          alan:{ type:'string', maxLength:20, description:'çalışılan alan' },
          not:{ type:'string', maxLength:200, description:'not' }
        }, required:['islem'] },
        onizle:p => {
          const d = tarihMi(p.tarih) ? p.tarih : U().todayISO();
          const list = M().sessionsOf(d);
          const bul = p.id ? tekBul(list, s => s.id === p.id, 'oturum') : (p.alan ? tekBul(list, s => s.disc === p.alan, 'oturum') : tekBul(list, () => true, 'oturum'));
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
          const list = M().sessionsOf(d);
          const bul = p.id ? tekBul(list, s => s.id === p.id, 'oturum') : (p.alan ? tekBul(list, s => s.disc === p.alan, 'oturum') : tekBul(list, () => true, 'oturum'));
          if(bul.hata) return { ok:false, metin: bul.hata };
          const s = bul.oge;
          const eski = Object.assign({}, s);
          if(p.islem === 'sil'){
            await M().deleteSession(d, s.id);
            render();
            return {
              metin: 'Oturumu sildim.',
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
            metin: 'Oturumu güncelledim.',
            geriAl:async () => {
              await M().updateSession(d, s.id, eski);
              render();
            }
          };
        } },

      { ad:'esp_arguman', tur:'yaz', ozetAd:'Tez ekle, güncelle veya sil',
        aciklama:'Sempozyuma tez ekler, günceller ya da siler.',
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
            return { metin: 'Yeni tez eklenecek: «' + p.tez + '»' };
          }
          const bul = p.id ? tekBul(S().args, a => a.id === p.id, 'tez') : tekBul(S().args, a => kucuk(a.thesis).indexOf(kucuk(p.tez)) >= 0, 'tez');
          if(bul.hata) return bul;
          const a = bul.oge;
          if(p.islem === 'sil') return { metin: 'Tez silinecek: «' + a.thesis + '»' };
          return { metin: 'Tez güncellenecek: «' + a.thesis + '»' };
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
              metin: 'Tezi ekledim: «' + a.thesis + '».',
              geriAl:async () => { await M().deleteArgument(a.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().args, x => x.id === p.id, 'tez') : tekBul(S().args, x => kucuk(x.thesis).indexOf(kucuk(p.tez)) >= 0, 'tez');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const a = bul.oge;
          const eski = JSON.parse(JSON.stringify(a));
          if(p.islem === 'sil'){
            await M().deleteArgument(a.id);
            render();
            return {
              metin: 'Tezi sildim.',
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
            metin: 'Tezi güncelledim.',
            geriAl:async () => { await M().saveArgument(eski); render(); }
          };
        } },

      { ad:'esp_dosya', tur:'yaz', ozetAd:'Ek dosya ekle veya sil',
        aciklama:'Bölüme ek dosya (not, belge, bağlantı, ses) ekler ya da siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'dosya kimliği' },
          alan:{ type:'string', maxLength:20, description:'bölüm/disiplin' },
          tur:{ type:'string', enum:['note', 'doc', 'link', 'audio'], description:'dosya türü' },
          baslik:{ type:'string', maxLength:120, description:'başlık' },
          metin:{ type:'string', maxLength:1000, description:'metin veya özet' },
          url:{ type:'string', maxLength:300, description:'bağlantı adresi' },
          sure:{ type:'integer', minimum:1, maximum:3600, description:'ses süresi (saniye)' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.baslik && !p.metin) return { hata: 'başlık ya da metin gerekir' };
            return { metin: 'Ek dosya kaydedilecek: «' + (p.baslik || p.metin) + '»' };
          }
          const bul = p.id ? tekBul(S().assets, a => a.id === p.id, 'dosya') : tekBul(S().assets, a => kucuk(a.title).indexOf(kucuk(p.baslik)) >= 0, 'dosya');
          if(bul.hata) return bul;
          return { metin: 'Ek dosya silinecek: «' + bul.oge.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const res = await M().saveAsset(M().newAsset({
              disc: p.alan || 'lang',
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
              metin: 'Ek dosyayı kaydettim.',
              geriAl:async () => { await M().deleteAsset(a.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().assets, a => a.id === p.id, 'dosya') : tekBul(S().assets, a => kucuk(a.title).indexOf(kucuk(p.baslik)) >= 0, 'dosya');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const a = bul.oge;
          const eski = Object.assign({}, a);
          await M().deleteAsset(a.id);
          render();
          return {
            metin: 'Ek dosyayı sildim.',
            geriAl:async () => { await M().saveAsset(eski); render(); }
          };
        } },

      { ad:'esp_eser', tur:'yaz', ozetAd:'Parça veya teknik ekle, güncelle veya sil',
        aciklama:'Müzik stüdyosuna parça veya teknik ekler, günceller ya da siler.',
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
            return { metin: 'Yeni parça/teknik eklenecek: «' + p.ad + '»' + (p.hedef_bpm ? ' (Hedef: ' + p.hedef_bpm + ' BPM)' : '') + '.' };
          }
          const bul = p.id ? tekBul(S().pieces, x => x.id === p.id, 'eser') : tekBul(S().pieces, x => kucuk(x.name).indexOf(kucuk(p.ad)) >= 0, 'eser');
          if(bul.hata) return bul;
          const pc = bul.oge;
          if(p.islem === 'sil') return { metin: 'Parça/teknik silinecek: «' + pc.name + '»' };
          return { metin: 'Parça/teknik güncellenecek: «' + pc.name + '»' };
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
              metin: 'Parçayı ekledim: «' + pc.name + '».',
              geriAl:async () => { await M().deletePiece(pc.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().pieces, x => x.id === p.id, 'eser') : tekBul(S().pieces, x => kucuk(x.name).indexOf(kucuk(p.ad)) >= 0, 'eser');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const pc = bul.oge;
          const eski = JSON.parse(JSON.stringify(pc));
          if(p.islem === 'sil'){
            await M().deletePiece(pc.id);
            render();
            return {
              metin: 'Parçayı sildim.',
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
            metin: 'Parçayı güncelledim.',
            geriAl:async () => { await M().savePiece(eski); render(); }
          };
        } },

      { ad:'esp_hatirlatma', tur:'yaz', ozetAd:'Hatırlatıcı ekle veya sil',
        aciklama:'Disipline bağlı hatırlatıcı ekler ya da siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'hatırlatıcı kimliği' },
          metin:{ type:'string', maxLength:200, description:'hatırlatma metni' },
          alan:{ type:'string', maxLength:20, description:'disiplin' },
          tarih:{ type:'string', maxLength:10, description:'vade tarihi (YYYY-AA-GG)' },
          tekrar:{ type:'string', enum:['none', 'daily', 'weekly', 'monthly'], description:'tekrar sıklığı' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.metin) return { hata: 'hatırlatma metni gerekir' };
            return { metin: 'Hatırlatıcı eklenecek: «' + p.metin + '»' + (p.tarih ? ' (' + p.tarih + ')' : '') + '.' };
          }
          const bul = p.id ? tekBul(S().reminders, r => r.id === p.id, 'hatırlatıcı') : tekBul(S().reminders, r => kucuk(r.text).indexOf(kucuk(p.metin)) >= 0, 'hatırlatıcı');
          if(bul.hata) return bul;
          return { metin: 'Hatırlatıcı silinecek: «' + bul.oge.text + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const res = await M().saveReminder(M().newReminder({
              text: p.metin,
              disc: p.alan || 'lang',
              due: p.tarih || U().todayISO(),
              repeat: p.tekrar || 'none'
            }));
            if(!res.ok) return { ok:false, metin: res.error || 'Kaydedilemedi.' };
            const r = res.reminder;
            render();
            return {
              metin: 'Hatırlatıcıyı kaydettim.',
              geriAl:async () => { await M().deleteReminder(r.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().reminders, r => r.id === p.id, 'hatırlatıcı') : tekBul(S().reminders, r => kucuk(r.text).indexOf(kucuk(p.metin)) >= 0, 'hatırlatıcı');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const r = bul.oge;
          const eski = Object.assign({}, r);
          await M().deleteReminder(r.id);
          render();
          return {
            metin: 'Hatırlatıcıyı sildim.',
            geriAl:async () => { await M().saveReminder(eski); render(); }
          };
        } },

      { ad:'esp_hedef', tur:'yaz', ozetAd:'Hedef ekle veya sil',
        aciklama:'Zamana bağlı hedef ekler ya da siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'hedef kimliği' },
          hedef:{ type:'string', maxLength:120, description:'hedef tanımı' },
          alan:{ type:'string', maxLength:20, description:'disiplin' },
          tarih:{ type:'string', maxLength:10, description:'hedef tarihi (YYYY-AA-GG)' },
          not:{ type:'string', maxLength:200, description:'açıklama' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.hedef) return { hata: 'hedef tanımı gerekir' };
            return { metin: 'Hedef eklenecek: «' + p.hedef + '»' + (p.tarih ? ' (' + p.tarih + ')' : '') + '.' };
          }
          const bul = p.id ? tekBul(S().goals, g => g.id === p.id, 'hedef') : tekBul(S().goals, g => kucuk(g.label).indexOf(kucuk(p.hedef)) >= 0, 'hedef');
          if(bul.hata) return bul;
          return { metin: 'Hedef silinecek: «' + bul.oge.label + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const g = await M().saveGoal(M().newGoal({
              label: p.hedef,
              disc: p.alan || 'lang',
              date: p.tarih || null,
              note: p.not || ''
            }));
            render();
            return {
              metin: 'Hedefi kaydettim.',
              geriAl:async () => { await M().deleteGoal(g.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().goals, g => g.id === p.id, 'hedef') : tekBul(S().goals, g => kucuk(g.label).indexOf(kucuk(p.hedef)) >= 0, 'hedef');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const g = bul.oge;
          const eski = Object.assign({}, g);
          await M().deleteGoal(g.id);
          render();
          return {
            metin: 'Hedefi sildim.',
            geriAl:async () => { await M().saveGoal(eski); render(); }
          };
        } },

      { ad:'esp_karar_kapat', tur:'yaz', ozetAd:'Kararı kapat',
        aciklama:'Ofiste alınan açık bir kararı sonuçlandırarak kapatır.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['kapat'], description:'işlem' },
          id:{ type:'string', maxLength:40, description:'karar kimliği' },
          metin:{ type:'string', maxLength:120, description:'karar metninin parçası' },
          sonuc:{ type:'string', maxLength:300, description:'kapanış sonucu' }
        } },
        onizle:p => {
          const bul = kararBul(p);
          if(bul.hata) return bul;
          return { metin: 'Karar kapatılacak: «' + bul.oge.text + '»' + (p && p.sonuc ? ' (Sonuç: ' + p.sonuc + ')' : '') + '.' };
        },
        uygula:async p => {
          const bul = kararBul(p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const d = bul.oge;
          const eski = Object.assign({}, d);
          await M().closeDecision(d.id, (p && p.sonuc) || 'King ile kapatıldı');
          render();
          return {
            metin: 'Kararı kapattım: «' + d.text + '».',
            geriAl:async () => { await M().saveDecision(eski); render(); }
          };
        } },

      { ad:'esp_kart_sil', tur:'yaz', ozetAd:'Dil kartını sil',
        aciklama:'Dil destesinden kelime kartını siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['sil'], description:'işlem' },
          id:{ type:'string', maxLength:40, description:'kart kimliği' },
          on:{ type:'string', maxLength:120, description:'kartın ön yüzü (kelime)' }
        } },
        onizle:p => {
          const bul = kartBul(p);
          if(bul.hata) return bul;
          const c = bul.oge;
          return { metin: 'Dil kartı silinecek: «' + c.front + '» → «' + c.back + '»' + (c.lang ? ' (' + c.lang + ')' : '') + '.' };
        },
        uygula:async p => {
          const bul = kartBul(p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const c = bul.oge;
          const eski = JSON.parse(JSON.stringify(c));
          await M().deleteCard(c.id);
          render();
          return {
            metin: 'Kartı sildim: «' + c.front + '».',
            geriAl:async () => { await M().saveCard(eski); render(); }
          };
        } },

      { ad:'esp_kaynak', tur:'yaz', ozetAd:'Kaynak ekle veya sil',
        aciklama:'Tarih masasına kaynak ekler ya da siler.',
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
            return { metin: 'Tarih kaynağı eklenecek: «' + p.baslik + '»' + (p.yazar ? ' — ' + p.yazar : '') + '.' };
          }
          const bul = p.id ? tekBul(S().sources, s => s.id === p.id, 'kaynak') : tekBul(S().sources, s => kucuk(s.title).indexOf(kucuk(p.baslik)) >= 0, 'kaynak');
          if(bul.hata) return bul;
          return { metin: 'Tarih kaynağı silinecek: «' + bul.oge.title + '»' };
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
              metin: 'Kaynağı kaydettim.',
              geriAl:async () => { await M().deleteSource(s.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().sources, s => s.id === p.id, 'kaynak') : tekBul(S().sources, s => kucuk(s.title).indexOf(kucuk(p.baslik)) >= 0, 'kaynak');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const s = bul.oge;
          const eski = JSON.parse(JSON.stringify(s));
          await M().deleteSource(s.id);
          render();
          return {
            metin: 'Kaynağı sildim.',
            geriAl:async () => { await M().saveSource(eski); render(); }
          };
        } },

      { ad:'esp_kitap', tur:'yaz', ozetAd:'Kitap ekle, güncelle veya sil',
        aciklama:'Kütüphaneye kitap ekler, günceller ya da siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'kitap kimliği' },
          ad:{ type:'string', maxLength:120, description:'kitap adı' },
          yazar:{ type:'string', maxLength:100, description:'yazar' },
          tur:{ type:'string', enum:['primary', 'secondary'], description:'primer ya da sekonder metin' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.ad) return { hata: 'kitap adı gerekir' };
            return { metin: 'Kitap eklenecek: «' + p.ad + '»' + (p.yazar ? ' — ' + p.yazar : '') + '.' };
          }
          const bul = p.id ? tekBul(S().books, b => b.id === p.id, 'kitap') : tekBul(S().books, b => kucuk(b.title).indexOf(kucuk(p.ad)) >= 0, 'kitap');
          if(bul.hata) return bul;
          const b = bul.oge;
          if(p.islem === 'sil') return { metin: 'Kitap silinecek: «' + b.title + '»' };
          return { metin: 'Kitap güncellenecek: «' + b.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const b = await M().saveBook(M().newBook({
              title: p.ad,
              author: p.yazar || '',
              kind: p.tur || 'primary'
            }));
            render();
            return {
              metin: 'Kitabı ekledim: «' + b.title + '».',
              geriAl:async () => { await M().deleteBook(b.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().books, b => b.id === p.id, 'kitap') : tekBul(S().books, b => kucuk(b.title).indexOf(kucuk(p.ad)) >= 0, 'kitap');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const b = bul.oge;
          const eski = Object.assign({}, b);
          if(p.islem === 'sil'){
            await M().deleteBook(b.id);
            render();
            return {
              metin: 'Kitabı sildim.',
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
            metin: 'Kitabı güncelledim.',
            geriAl:async () => { await M().saveBook(eski); render(); }
          };
        } },

      { ad:'esp_not_sil', tur:'yaz', ozetAd:'Notu sil',
        aciklama:'Kütüphanedeki bir atomik notu veya alıntıyı siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['sil'], description:'işlem' },
          id:{ type:'string', maxLength:40, description:'not kimliği' },
          metin:{ type:'string', maxLength:120, description:'not metninin bir parçası' }
        } },
        onizle:p => {
          const bul = notBul(p);
          if(bul.hata) return bul;
          const n = bul.oge;
          return { metin: 'Not silinecek: «' + n.text.slice(0, 100) + (n.text.length > 100 ? '…' : '') + '»' };
        },
        uygula:async p => {
          const bul = notBul(p);
          if(bul.hata) return { ok:false, metin: bul.hata };
          const n = bul.oge;
          const eski = JSON.parse(JSON.stringify(n));
          await M().deleteNote(n.id);
          render();
          return {
            metin: 'Notu sildim.',
            geriAl:async () => { await M().saveNote(eski); render(); }
          };
        } },

      { ad:'esp_olay', tur:'yaz', ozetAd:'Tarih olayı ekle, güncelle veya sil',
        aciklama:'Kronolojiye tarih olayı ekler, günceller ya da siler.',
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
            return { metin: 'Tarih olayı eklenecek: «' + p.baslik + '» (' + p.yil + ').' };
          }
          const bul = p.id ? tekBul(S().events, e => e.id === p.id, 'olay') : tekBul(S().events, e => kucuk(e.title).indexOf(kucuk(p.baslik)) >= 0, 'olay');
          if(bul.hata) return bul;
          const e = bul.oge;
          if(p.islem === 'sil') return { metin: 'Tarih olayı silinecek: «' + e.title + '»' };
          return { metin: 'Tarih olayı güncellenecek: «' + e.title + '»' };
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
              metin: 'Olayı kaydettim.',
              geriAl:async () => { await M().deleteEvent(e.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().events, e => e.id === p.id, 'olay') : tekBul(S().events, e => kucuk(e.title).indexOf(kucuk(p.baslik)) >= 0, 'olay');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const e = bul.oge;
          const eski = JSON.parse(JSON.stringify(e));
          if(p.islem === 'sil'){
            await M().deleteEvent(e.id);
            render();
            return {
              metin: 'Olayı sildim.',
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
            metin: 'Olayı güncelledim.',
            geriAl:async () => { await M().saveEvent(eski); render(); }
          };
        } },

      { ad:'esp_ses_kaydi', tur:'yaz', ozetAd:'Diksiyon ölçümü ekle veya sil',
        aciklama:'Diksiyon çalışma ölçümünü (süre, kelime, hata) kaydeder ya da siler.',
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
            return { metin: 'Diksiyon ölçüm kaydı eklenecek: ' + (p.saniye ? p.saniye + ' sn' : '') + (p.kelime ? ' · ' + p.kelime + ' kelime' : '') + (p.hata != null ? ' · ' + p.hata + ' hata' : '') + '.' };
          }
          const bul = kayitBul(p);
          if(bul.hata) return bul;
          const r = bul.oge;
          return { metin: 'Diksiyon ölçüm kaydı silinecek: ' + r.date + (r.seconds ? ' · ' + r.seconds + ' sn' : '') + '.' };
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
              metin: 'Diksiyon ölçümünü kaydettim.',
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
            metin: 'Diksiyon ölçümünü sildim.',
            geriAl:async () => { await M().saveRecording(eski); render(); }
          };
        } },

      { ad:'esp_taslak', tur:'yaz', ozetAd:'Yazı taslağı ekle, güncelle veya sil',
        aciklama:'Yazı laboratuvarına taslak ekler, günceller ya da siler.',
        parametreler:{ type:'object', properties:{
          islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
          id:{ type:'string', maxLength:40, description:'taslak kimliği' },
          baslik:{ type:'string', maxLength:120, description:'taslak başlığı' },
          metin:{ type:'string', maxLength:5000, description:'taslak metni' }
        }, required:['islem'] },
        onizle:p => {
          if(p.islem === 'ekle'){
            if(!p.baslik) return { hata: 'taslak başlığı gerekir' };
            return { metin: 'Yazı taslağı eklenecek: «' + p.baslik + '»' };
          }
          const bul = p.id ? tekBul(S().drafts, d => d.id === p.id, 'taslak') : tekBul(S().drafts, d => kucuk(d.title).indexOf(kucuk(p.baslik)) >= 0, 'taslak');
          if(bul.hata) return bul;
          const d = bul.oge;
          if(p.islem === 'sil') return { metin: 'Yazı taslağı silinecek: «' + d.title + '»' };
          return { metin: 'Yazı taslağı güncellenecek: «' + d.title + '»' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const d = await M().saveDraft(M().newDraft({
              title: p.baslik,
              text: p.metin || ''
            }));
            render();
            return {
              metin: 'Yazı taslağını ekledim: «' + d.title + '».',
              geriAl:async () => { await M().deleteDraft(d.id); render(); }
            };
          }
          const bul = p.id ? tekBul(S().drafts, d => d.id === p.id, 'taslak') : tekBul(S().drafts, d => kucuk(d.title).indexOf(kucuk(p.baslik)) >= 0, 'taslak');
          if(bul.hata) return { ok:false, metin: bul.hata };
          const d = bul.oge;
          const eski = Object.assign({}, d);
          if(p.islem === 'sil'){
            await M().deleteDraft(d.id);
            render();
            return {
              metin: 'Yazı taslağını sildim.',
              geriAl:async () => { await M().saveDraft(eski); render(); }
            };
          }
          const guncel = Object.assign({}, d);
          if(p.baslik) guncel.title = p.baslik;
          if(p.metin != null) guncel.text = p.metin;
          await M().saveDraft(guncel);
          render();
          return {
            metin: 'Yazı taslağını güncelledim.',
            geriAl:async () => { await M().saveDraft(eski); render(); }
          };
        } },

      { ad:'esp_zincir', tur:'yaz', ozetAd:'Neden zinciri ekle, güncelle veya sil',
        aciklama:'Tarih olayına neden-sonuç zinciri ekler, günceller ya da siler.',
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
            const ev = S().events.find(e => e.id === p.olay_id || (p.olay_baslik && kucuk(e.title).indexOf(kucuk(p.olay_baslik)) >= 0));
            if(!ev && !p.olay_id) return { hata: 'zincirin bağlanacağı olay bulunamadı' };
            return { metin: 'Neden zinciri eklenecek: «' + (ev ? ev.title : p.olay_id) + '» için.' };
          }
          const bul = zincirBul(p);
          if(bul.hata) return bul;
          const c = bul.oge;
          if(p.islem === 'sil') return { metin: 'Neden zinciri silinecek (ID: ' + c.id + ').' };
          return { metin: 'Neden zinciri güncellenecek (ID: ' + c.id + ').' };
        },
        uygula:async p => {
          if(p.islem === 'ekle'){
            const ev = S().events.find(e => e.id === p.olay_id || (p.olay_baslik && kucuk(e.title).indexOf(kucuk(p.olay_baslik)) >= 0));
            const eventId = p.olay_id || (ev ? ev.id : null);
            if(!eventId) return { ok:false, metin: 'Zincir bir olaya bağlanmadan kaydedilmez.' };
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
              metin: 'Neden zincirini kaydettim.',
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
              metin: 'Neden zincirini sildim.',
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
            metin: 'Neden zincirini güncelledim.',
            geriAl:async () => { await M().saveChain(eski); render(); }
          };
        } },
    ];
  }

  /* KING-4 A3 hızlı yol: okuma sorusu sayfa açmaz; kart, alıntı ve bitirme cümleden okunur
     (yazan araç yine önizlenir, onayla yazılır). */
  const KURAL = {
    esp_gun:{ es:/^bugün (?:ne|neler) çalıştım/ },
    esp_hafta:{ es:/((?:bu hafta|son bir hafta|haftada) ne kadar çalıştım)/ },
    esp_kitaplar:{ es:/(^kitaplarım|kütüphanemde ne var|hangi kitapları okuyorum)/ },
    esp_kartlar:{ es:/(kaç (?:kelime )?kart|kelime kartlarım)/ },
    esp_yazilar:{ es:/(yazı taslak|taslaklarım|yazılarım)/ },
    esp_merdiven:{ es:/(merdiven|kademe|seviye|hangi basamak)/ },
    esp_argumanlar:{ es:/(tezler|argümanlar|sempozyum)/ },
    esp_olaylar:{ es:/(tarih olay|kronoloji|olaylarım)/ },
    esp_repertuvar:{ es:/(repertuvar|çaldığım|parçalarım|tekniklerim)/ },
    esp_kart_ekle:{ kural:(t, m) => { const x = /^(.+?)\s+kelimesini karta? (?:yap|ekle)\s*[:,]\s*(.+)$/i.exec(m);
      return x && x[1].length <= 120 && x[2].length <= 240 ? { on:x[1].trim(), arka:x[2].trim() } : null; } },
    esp_alinti_ekle:{ kural:(t, m) => { const x = /^alıntı\s*[:,]\s*(\S[\s\S]{0,999})$/i.exec(m); return x ? { metin:x[1].trim() } : null; } },
    esp_kitap_bitir:{ kural:(t, m) => { const x = /^(.+?)['’]?(?:y[ıiuü])? bitirdim[.!]?$/i.exec(m);
      const k = x && x[1].trim();
      return k && !/^(kitab[ıi]?|onu|bunu|şunu)$/i.test(k) && k.length <= 120 ? { kitap:k } : null; } },
  };
  const listeKural = () => liste().map(a => Object.assign(a, KURAL[a.ad] || {}));

  return { liste:listeKural, sayfaOku };
})();
