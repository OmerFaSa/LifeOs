/* KING ARAÇLARI — AYS'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: ofis ajanlarının da gördüğü veri araçları (core/tools.js). Sonuç
   kişisel alanlardan süzülür (Tools.sanitize); sayıyı AYS'nin kendi hesabı
   üretir, King'in modeli yalnız cümleye çevirir.

   Yazma: plan eylemleri (data/actions.js, core/proposals.js) ve model
   eylemleri (core/state.js, KING-4 A2). Önizleme yapılır; onaydan sonra
   aynı doğrulama, anlık görüntü ve geri almayla uygulanır. Ölçüm yazan
   eylemler (`olcum`: soru, süre, uyku…) burada YOK: ölçüm kullanıcının
   cümlesinden King'in `kayit_gir` aracıyla, AYS'nin kendi ayrıştırıcısıyla
   girer (sayı kullanıcınındır). `modelYok` eylemler (hedef planı) modelin
   seçimine kapalıdır; kullanıcı Hedeflerim'den yapar. */

window.R = window.R || {};

R.KingArac = (function(){
  'use strict';

  const PARAM_ACIKLAMA = {
    subjectId:'ders kimliği (ays_konular aracındaki dersId)', topicId:'konu kimliği (ays_konular)',
    minutes:'dakika', dakika:'dakika', limit:'en çok kaç tane', errorId:'yanlış kaydının kimliği (ays_hatalar)',
    weekN:'program haftasının numarası (ays_durum_ozeti: programHaftasi)', questionTarget:'haftalık soru hedefi',
    decisionId:'kararın kimliği', state:'yapildi ya da devredildi', from:'başlangıç günü (YYYY-AA-GG)', to:'bitiş günü (YYYY-AA-GG)',
    bolum:'bölümün kimliği', acik:'1 aç, 0 gizle', hedefId:'hedefin kimliği',
  };
  /* Kural yolu (modelsiz): yalnız sonucu satıra çevrilebilen araçlar. Niyet
     tablosunun sözcüğünü taşıyan cümle («denemelerim» → Deneme sayfası) o
     yoldan gider; burada yalnız sayfası olmayan sorular durur. */
  const ES = {
    puan_tahmini:/(puan tahmin|sıralama tahmin|kaç puan alırım|tahmini puan)/,
    hatalar:/(yanlış defterim|hatalar[ıi]m(?:ı| neler)?$)/,
    /* KING-4 A3 hızlı yol: okuma sorusu sayfa açmaz, araçla cevaplanır. */
    denemeler:/(denemelerim|son deneme|deneme(?:de|lerde|m)? (?:kaç|nasıl)|kaç net)/,
    konu_riski:/(risk altında|riskli konu|konu riski)/,
    gunler:/((?:bugün|dün) kaç (?:dakika|saat|soru)|kaç (?:dakika|saat) çalıştım)/,
    konular:/(kapanış yüzde|kapanışım|konularımın durumu)/,
    gunun_akisi:/(günün akışı|bugünün akışı)/,
    durum_ozeti:/(sınava kaç gün|sınava ne kadar)/,
    kartlar:/((?:tekrar etmem gereken|sırası gelen|geciken) kart|kart borcu)/,
  };
  const n2 = v => v == null ? 'veri yok' : String(v).replace('.', ',');
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').trim();
  const render = () => { if(R.App && R.App.render) R.App.render(); };

  function satirlar(ad, s){
    if(!s || typeof s !== 'object') return null;
    if(ad === 'denemeler' && Array.isArray(s)){
      return s.length ? s.slice(0, 6).map(e => e.tarih + ' · ' + (e.aile || e.tur || '') + ' · ' + n2(e.toplamNet) + ' net') : ['Kayıtlı deneme yok.'];
    }
    if(ad === 'puan_tahmini'){
      if(!s.yeterliVeri) return [s.gerekce || 'Tahmin için yeterli deneme yok.'];
      return ['Tahmini puan bandı: ' + n2(s.puanBandi && s.puanBandi[0]) + '–' + n2(s.puanBandi && s.puanBandi[1]),
        'Sıra bandı: ' + n2(s.tahminiSiraBandi && s.tahminiSiraBandi[0]) + '–' + n2(s.tahminiSiraBandi && s.tahminiSiraBandi[1]),
        s.uyari || ''].filter(Boolean);
    }
    if(ad === 'hatalar'){
      const d = s.dagilim || [];
      return d.length ? d.map(x => x.ad + ': ' + x.adet) : ['Yanlış defterinde kayıt yok.'];
    }
    return null;
  }

  function okuma(){
    const T = R.Tools;
    if(!T || !Array.isArray(T.TOOLS)) return [];
    return T.TOOLS.map(t => ({
      ad:'ays_' + t.name, tur:'oku', aciklama:t.description, es:ES[t.name] || undefined,
      parametreler:t.inputSchema && Object.keys(t.inputSchema.properties || {}).length ? t.inputSchema : undefined,
      calistir:p => {
        const ham = t.execute(p || {});
        const sonuc = ham === undefined ? { sonuc:'veri yok' } : T.sanitize(ham);
        return { sonuc, satirlar:satirlar(t.name, sonuc) };
      },
    }));
  }

  function satir(r){
    const a = r.label || r.alan || '', o = r.before != null ? r.before : r.once, s = r.after != null ? r.after : r.sonra;
    return a + ': ' + (o == null || o === '' ? '—' : o) + ' → ' + (s == null || s === '' ? '—' : s);
  }

  function yazma(){
    return (R.ACTIONS || []).filter(a => !a.modelYok && !a.olcum).map(def => {
      const props = {};
      Object.keys(def.params || {}).forEach(k => {
        const tip = def.params[k] === 'number' ? (k === 'acik' ? 'integer' : 'number') : 'string';
        props[k] = Object.assign({ type:tip }, PARAM_ACIKLAMA[k] ? { description:PARAM_ACIKLAMA[k] } : {},
          k === 'acik' ? { enum:[0, 1] } : {}, k === 'state' ? { enum:['yapildi', 'devredildi'] } : {});
      });
      return {
        ad:'ays_' + def.id.replace(/-/g, '_'), tur:'yaz', seviye:def.level, ozetAd:def.title,
        aciklama:def.title + '. ' + def.summary + ' (Onaylar’daki öneriyle aynı eylem; önizlenir, onayla uygulanır.)',
        parametreler:Object.keys(props).length ? { type:'object', properties:props } : undefined,
        onizle:p => {
          const pr = R.Proposals.preview({ action:def.id, params:p, agent:def.agents[0] });
          if(!pr.ok) return { hata:pr.why || 'uygulanamaz' };
          return { metin:def.title + ': ' + def.summary, satirlar:(pr.rows || []).map(satir) };
        },
        uygula:async p => {
          const r = await R.Proposals.hemen({ action:def.id, params:p, reason:'King sohbetinde istendi' });
          if(!r || !r.ok) return { ok:false, metin:'Uygulanamadı: ' + ((r && r.why) || 'bilinmeyen neden') + '.' };
          render();
          const id = r.row && r.row.id;
          return { metin:def.title + ': uygulandı.', geriAl:id ? async () => { await R.Proposals.undo(id); render(); } : null };
        },
      };
    });
  }

  /* ---------- Arama / bulma yardımcıları ---------- */

  function denemeBul(p){
    if(p.id) return (R.S.exams || []).find(e => e.id === p.id) || null;
    if(p.ad){
      const k = kucuk(p.ad);
      const l = (R.S.exams || []).filter(e => kucuk((e.publisher || '') + ' ' + (e.type || '')).indexOf(k) >= 0);
      return l.length === 1 ? l[0] : null;
    }
    return null;
  }
  function denemeBulHata(p){
    if(p.id) return '«' + p.id + '» kimlikli deneme bulunamadı.';
    if(p.ad){
      const k = kucuk(p.ad);
      const l = (R.S.exams || []).filter(e => kucuk((e.publisher || '') + ' ' + (e.type || '')).indexOf(k) >= 0);
      if(!l.length) return '«' + p.ad + '» adıyla deneme bulunamadı.';
      return 'Birden çok deneme eşleşti (' + l.length + ' adet); lütfen id belirtin.';
    }
    return 'Deneme kimliği ya da adı belirtilmedi.';
  }

  function kartBul(p){
    if(p.id) return (R.S.cards || []).find(c => c.id === p.id) || null;
    if(p.on){
      const k = kucuk(p.on);
      const l = (R.S.cards || []).filter(c => kucuk(c.front).indexOf(k) >= 0);
      return l.length === 1 ? l[0] : null;
    }
    return null;
  }
  function kartBulHata(p){
    if(p.id) return '«' + p.id + '» kimlikli kart bulunamadı.';
    if(p.on){
      const k = kucuk(p.on);
      const l = (R.S.cards || []).filter(c => kucuk(c.front).indexOf(k) >= 0);
      if(!l.length) return '«' + p.on + '» ile eşleşen kart bulunamadı.';
      return 'Birden çok kart eşleşti (' + l.length + ' adet); lütfen id belirtin.';
    }
    return 'Kart kimliği ya da ön yüzü belirtilmedi.';
  }

  function takvimBul(p){
    if(p.id) return (R.S.calendar || []).find(x => x.id === p.id) || null;
    const aranan = p.ad || p.not;
    if(aranan){
      const k = kucuk(aranan);
      const l = (R.S.calendar || []).filter(x => kucuk((x.note || '') + ' ' + (x.kind || '')).indexOf(k) >= 0);
      return l.length === 1 ? l[0] : null;
    }
    return null;
  }
  function takvimBulHata(p){
    if(p.id) return '«' + p.id + '» kimlikli takvim kaydı bulunamadı.';
    const aranan = p.ad || p.not;
    if(aranan){
      const k = kucuk(aranan);
      const l = (R.S.calendar || []).filter(x => kucuk((x.note || '') + ' ' + (x.kind || '')).indexOf(k) >= 0);
      if(!l.length) return '«' + aranan + '» ile eşleşen takvim kaydı bulunamadı.';
      return 'Birden çok takvim kaydı eşleşti (' + l.length + ' adet); lütfen id belirtin.';
    }
    return 'Takvim kaydı kimliği ya da adı belirtilmedi.';
  }

  function videoNotuBul(p){
    if(p.id) return (R.S.videoNotes || []).find(n => n.id === p.id) || null;
    if(p.baslik){
      const k = kucuk(p.baslik);
      const l = (R.S.videoNotes || []).filter(n => kucuk(n.title).indexOf(k) >= 0);
      return l.length === 1 ? l[0] : null;
    }
    return null;
  }
  function videoNotuBulHata(p){
    if(p.id) return '«' + p.id + '» kimlikli video notu bulunamadı.';
    if(p.baslik){
      const k = kucuk(p.baslik);
      const l = (R.S.videoNotes || []).filter(n => kucuk(n.title).indexOf(k) >= 0);
      if(!l.length) return '«' + p.baslik + '» ile eşleşen video notu bulunamadı.';
      return 'Birden çok video notu eşleşti (' + l.length + ' adet); lütfen id belirtin.';
    }
    return 'Video notu kimliği ya da başlığı belirtilmedi.';
  }

  function yanlisBul(p){
    if(p.id) return (R.S.errors || []).find(e => e.id === p.id) || null;
    const aranan = p.not || p.konu;
    if(aranan){
      const k = kucuk(aranan);
      const l = (R.S.errors || []).filter(e => kucuk((e.note || '') + ' ' + (e.topic || '')).indexOf(k) >= 0);
      return l.length === 1 ? l[0] : null;
    }
    return null;
  }
  function yanlisBulHata(p){
    if(p.id) return '«' + p.id + '» kimlikli yanlış kaydı bulunamadı.';
    const aranan = p.not || p.konu;
    if(aranan){
      const k = kucuk(aranan);
      const l = (R.S.errors || []).filter(e => kucuk((e.note || '') + ' ' + (e.topic || '')).indexOf(k) >= 0);
      if(!l.length) return '«' + aranan + '» ile eşleşen yanlış kaydı bulunamadı.';
      return 'Birden çok yanlış kaydı eşleşti (' + l.length + ' adet); lütfen id belirtin.';
    }
    return 'Yanlış kaydı kimliği ya da açıklaması belirtilmedi.';
  }

  /* ---------- Model işlevlerini doğrudan çağıran araçlar (KING-4 A2) ---------- */

  function modelAraclari(){
    return [
      /* 1. ays_deneme */
      {
        ad:'ays_deneme', tur:'yaz', seviye:'orta', ozetAd:'Deneme kaydı',
        aciklama:'Deneme sınavını kaydeder, günceller ya da siler.',
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'deneme kimliği' },
            ad:{ type:'string', maxLength:100, description:'deneme adı ya da yayıncısı (arama ve silme için)' },
            tarih:{ type:'string', maxLength:10, description:'tarih (YYYY-AA-GG)' },
            tur:{ type:'string', maxLength:40, description:'sınav türü (TYT, AYT, YDT)' },
            yayinci:{ type:'string', maxLength:80, description:'yayıncı / deneme adı' },
            net:{ type:'number', minimum:0, maximum:160, description:'toplam net (ekle için)' },
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const ex = denemeBul(p);
            if(!ex) return { hata:denemeBulHata(p) };
            return { metin:'«' + (ex.publisher || ex.type || 'Deneme') + '» denemesi silinecek.',
              satirlar:[ex.date + ' · ' + (ex.type || '') + ' · net: ' + (R.Model.examNet ? R.Model.examNet(ex) : '—')] };
          }
          if(p.islem === 'guncelle'){
            const ex = denemeBul(p);
            if(!ex) return { hata:denemeBulHata(p) };
            return { metin:'«' + (ex.publisher || ex.type || 'Deneme') + '» denemesi güncellenecek.',
              satirlar:['Tarih: ' + (p.tarih || ex.date), 'Yayıncı: ' + (p.yayinci || ex.publisher || '—')] };
          }
          return { metin:'Deneme kaydedilecek: ' + (p.yayinci || p.tur || 'TYT'),
            satirlar:['Tarih: ' + (p.tarih || R.U.todayISO()), 'Tür: ' + (p.tur || 'TYT'), p.net != null ? 'Net: ' + p.net : null].filter(Boolean) };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const ex = denemeBul(p);
            if(!ex) return { ok:false, metin:denemeBulHata(p) };
            const bagli = (R.S.errors || []).filter(e => e.examId === ex.id);
            await R.Model.deleteExam(ex.id);
            render();
            return { metin:'Deneme silindi.', geriAl:async () => {
              await R.Model.saveExam(ex);
              for(const b of bagli) await R.Model.saveError(b);
              render();
            }};
          }
          if(p.islem === 'guncelle'){
            const ex = denemeBul(p);
            if(!ex) return { ok:false, metin:denemeBulHata(p) };
            const eski = JSON.parse(JSON.stringify(ex));
            if(p.tarih) ex.date = p.tarih;
            if(p.tur) ex.type = p.tur;
            if(p.yayinci) ex.publisher = p.yayinci;
            await R.Model.saveExam(ex);
            render();
            return { metin:'Deneme güncellendi.', geriAl:async () => { await R.Model.saveExam(eski); render(); } };
          }
          const exam = {
            id:p.id || R.U.uid('e'),
            date:p.tarih || R.U.todayISO(),
            type:p.tur || 'TYT',
            publisher:p.yayinci || p.ad || 'Deneme',
            tests:p.net != null ? [{ name:'Genel', correct:p.net, wrong:0, blank:0, blankCert:'measured' }] : [],
            createdAt:new Date().toISOString(),
          };
          await R.Model.saveExam(exam);
          render();
          return { metin:'Deneme kaydedildi.', geriAl:async () => { await R.Model.deleteExam(exam.id); render(); } };
        }
      },

      /* 2. ays_enerji */
      {
        ad:'ays_enerji', tur:'yaz', seviye:'kucuk', ozetAd:'Enerji kaydı',
        aciklama:'Günün enerji düzeyini (1-5) ve his notunu kaydeder.',
        parametreler:{
          type:'object',
          properties:{
            enerji:{ type:'integer', minimum:1, maximum:5, description:'enerji seviyesi (1-5)' },
            tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' },
            not:{ type:'string', maxLength:200, description:'enerji / his notu' }
          },
          required:['enerji']
        },
        onizle:p => {
          const d = p.tarih || R.U.todayISO();
          const eski = R.Model.moodOf(d);
          return { metin:d + ' için enerji ' + p.enerji + '/5 olarak kaydedilecek.',
            satirlar:['Eski enerji: ' + (eski && eski.energy != null ? eski.energy + '/5' : 'veri yok'),
              'Yeni enerji: ' + p.enerji + '/5' + (p.not ? ' · ' + p.not : '')] };
        },
        uygula:async p => {
          const d = p.tarih || R.U.todayISO();
          const eski = R.Model.moodOf(d) ? Object.assign({}, R.Model.moodOf(d)) : null;
          await R.Model.saveMood(d, { energy:p.enerji, note:p.not || '' });
          render();
          return { metin:'Enerji kaydedildi: ' + p.enerji + '/5.', geriAl:async () => {
            if(eski) await R.Model.saveMood(d, eski);
            else { delete R.S.mood[d]; await R.Store.remove('mood/' + d); }
            render();
          }};
        }
      },

      /* 3. ays_etkinlik */
      {
        ad:'ays_etkinlik', tur:'yaz', seviye:'orta', ozetAd:'Etkinlik / meşgale ekle',
        aciklama:'Meşgale kataloğuna yeni mola etkinliği ekler ya da günceller.',
        parametreler:{
          type:'object',
          properties:{
            ad:{ type:'string', maxLength:60, description:'etkinlik adı' },
            dakika:{ type:'integer', minimum:1, maximum:120, description:'tipik süre (dakika)' },
            enerji:{ type:'string', enum:['low', 'mid', 'high'], description:'enerji seviyesi' },
            tur:{ type:'string', enum:['beden', 'zihin', 'yaratici', 'sosyal', 'dinlenme'], description:'etkinlik türü' },
            not:{ type:'string', maxLength:200, description:'açıklama / ipucu notu' },
            id:{ type:'string', maxLength:40, description:'etkinlik kimliği' }
          },
          required:['ad']
        },
        onizle:p => ({
          metin:'«' + p.ad + '» etkinliği kataloğa kaydedilecek.',
          satirlar:['Süre: ' + (p.dakika || 10) + ' dk · Enerji: ' + (p.enerji || 'low') + ' · Tür: ' + (p.tur || 'dinlenme')]
        }),
        uygula:async p => {
          const id = p.id || R.U.uid('act');
          const i = (R.S.activities || []).findIndex(a => a.id === id);
          const eski = i >= 0 ? Object.assign({}, R.S.activities[i]) : null;
          const rec = Object.assign({ id, name:p.ad, minutes:p.dakika || 10, energy:p.enerji || 'low', kind:p.tur || 'dinlenme', note:p.not || '', custom:true }, p.id ? (eski || {}) : {});
          await R.Model.saveActivity(rec);
          render();
          return { metin:'Etkinlik kaydedildi: «' + p.ad + '».', geriAl:async () => {
            if(eski) await R.Model.saveActivity(eski);
            else { R.S.activities = (R.S.activities || []).filter(a => a.id !== id); await R.Store.remove('activities/' + id); }
            render();
          }};
        }
      },

      /* 4. ays_hafta_degerlendirme */
      {
        ad:'ays_hafta_degerlendirme', tur:'yaz', seviye:'orta', ozetAd:'Haftalık değerlendirme',
        aciklama:'Bir program haftasının pazar değerlendirmesini kaydeder.',
        parametreler:{
          type:'object',
          properties:{
            hafta:{ type:'integer', minimum:1, maximum:60, description:'program haftası numarası' },
            not:{ type:'string', maxLength:1000, description:'değerlendirme notu' },
            puan:{ type:'integer', minimum:1, maximum:5, description:'hafta puanı (1-5)' }
          },
          required:['hafta']
        },
        onizle:p => {
          const n = p.hafta || R.Model.currentWeek();
          return { metin:'Hafta ' + n + ' değerlendirmesi kaydedilecek.',
            satirlar:['Hafta: ' + n, 'Not: ' + (p.not || '—'), 'Puan: ' + (p.puan ? p.puan + '/5' : 'belirtilmedi')] };
        },
        uygula:async p => {
          const n = p.hafta || R.Model.currentWeek();
          const id = R.Model.weekId(n);
          const eski = R.S.reviews[id] ? Object.assign({}, R.S.reviews[id]) : null;
          const data = Object.assign({}, eski || {}, { note:p.not || (eski && eski.note) || '', rating:p.puan || (eski && eski.rating) || null, updatedAt:new Date().toISOString() });
          await R.Model.saveReview(n, data);
          render();
          return { metin:'Hafta ' + n + ' değerlendirmesi kaydedildi.', geriAl:async () => {
            if(eski) await R.Model.saveReview(n, eski);
            else { delete R.S.reviews[id]; await R.Store.remove('reviews/' + id); }
            render();
          }};
        }
      },

      /* 5. ays_kart */
      {
        ad:'ays_kart', tur:'yaz', seviye:'orta', ozetAd:'Tekrar kartı',
        aciklama:'Tekrar kartı ekler, günceller ya da siler.',
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'kart kimliği' },
            on:{ type:'string', maxLength:500, description:'kartın ön yüzü (soru / kavram)' },
            arka:{ type:'string', maxLength:1000, description:'kartın arka yüzü (cevap / açıklama)' },
            konu:{ type:'string', maxLength:100, description:'konu adı' },
            dersId:{ type:'string', maxLength:30, description:'ders kimliği' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const c = kartBul(p);
            if(!c) return { hata:kartBulHata(p) };
            return { metin:'Tekrar kartı silinecek.', satirlar:['Ön: ' + c.front, 'Arka: ' + (c.back || '—')] };
          }
          if(p.islem === 'guncelle'){
            const c = kartBul(p);
            if(!c) return { hata:kartBulHata(p) };
            return { metin:'Tekrar kartı güncellenecek.', satirlar:['Ön: ' + (p.on || c.front), 'Arka: ' + (p.arka || c.back || '—')] };
          }
          return { metin:'Tekrar kartı eklenecek: «' + (p.on || '') + '»', satirlar:['Ön: ' + (p.on || '—'), 'Arka: ' + (p.arka || '—')] };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const c = kartBul(p);
            if(!c) return { ok:false, metin:kartBulHata(p) };
            await R.Model.deleteCard(c.id);
            render();
            return { metin:'Kart silindi.', geriAl:async () => { await R.Model.saveCard(c); render(); } };
          }
          if(p.islem === 'guncelle'){
            const c = kartBul(p);
            if(!c) return { ok:false, metin:kartBulHata(p) };
            const eski = Object.assign({}, c);
            if(p.on) c.front = p.on;
            if(p.arka) c.back = p.arka;
            if(p.konu) c.topic = p.konu;
            if(p.dersId) c.subjectId = p.dersId;
            await R.Model.saveCard(c);
            render();
            return { metin:'Kart güncellendi.', geriAl:async () => { await R.Model.saveCard(eski); render(); } };
          }
          const c = R.Model.newCard({ front:p.on || '', back:p.arka || '', topic:p.konu || '', subjectId:p.dersId || null });
          await R.Model.saveCard(c);
          render();
          return { metin:'Kart eklendi.', geriAl:async () => { await R.Model.deleteCard(c.id); render(); } };
        }
      },

      /* 6. ays_konu_durumu */
      {
        ad:'ays_konu_durumu', tur:'yaz', seviye:'orta', ozetAd:'Konu durumu',
        aciklama:'Bir konunun çalışma ve kapanış durumunu (not_started, provisional, practicing, closed) ayarlar.',
        parametreler:{
          type:'object',
          properties:{
            dersId:{ type:'string', maxLength:30, description:'ders kimliği (mat_tyt, fiz_ayt vb.)' },
            konuId:{ type:'string', maxLength:50, description:'konu kimliği' },
            durum:{ type:'string', enum:['not_started', 'provisional', 'practicing', 'closed'], description:'konu durumu' },
            not:{ type:'string', maxLength:200, description:'konu notu' }
          },
          required:['dersId', 'konuId', 'durum']
        },
        onizle:p => {
          const cur = R.Model.topicState(p.dersId, p.konuId);
          return { metin:p.dersId + ' › ' + p.konuId + ' durumu değiştirilecek.',
            satirlar:['Eski durum: ' + (cur.state || 'not_started') + ' → Yeni durum: ' + p.durum] };
        },
        uygula:async p => {
          const cur = Object.assign({}, R.Model.topicState(p.dersId, p.konuId));
          await R.Model.setTopicState(p.dersId, p.konuId, { state:p.durum, note:p.not || cur.note || '' });
          render();
          return { metin:'Konu durumu güncellendi: ' + p.durum + '.', geriAl:async () => {
            await R.Model.setTopicState(p.dersId, p.konuId, cur);
            render();
          }};
        }
      },

      /* 7. ays_mesgale_ekle */
      {
        ad:'ays_mesgale_ekle', tur:'yaz', seviye:'kucuk', ozetAd:'Dikkat dağılması ekle',
        aciklama:'Günün odak sayacına dikkat dağılması / bölünme çentiği ekler.',
        parametreler:{
          type:'object',
          properties:{
            tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' }
          }
        },
        onizle:p => {
          const d = (p && p.tarih) || R.U.todayISO();
          const day = R.S.days[d];
          const count = (day && day.distractions) || 0;
          return { metin:d + ' için dikkat dağılması çentiği eklenecek.',
            satirlar:['Şu anki bölünme sayısı: ' + count + ' → ' + (count + 1)] };
        },
        uygula:async p => {
          const d = (p && p.tarih) || R.U.todayISO();
          await R.Model.ensureDay(d);
          const day = R.S.days[d];
          const eski = day.distractions || 0;
          const eskiTracked = day.distractionsTracked;
          await R.Model.addDistraction(d);
          render();
          return { metin:'Dikkat dağılması kaydedildi (' + (eski + 1) + ').', geriAl:async () => {
            day.distractions = eski;
            day.distractionsTracked = eskiTracked;
            await R.Model.saveDay(d);
            render();
          }};
        }
      },

      /* 8. ays_mola */
      {
        ad:'ays_mola', tur:'yaz', seviye:'kucuk', ozetAd:'Mola kaydet',
        aciklama:'Günün kaydına verilen bir molayı ve süresini kaydeder.',
        parametreler:{
          type:'object',
          properties:{
            dakika:{ type:'integer', minimum:1, maximum:120, description:'mola süresi (dakika)' },
            etkinlikId:{ type:'string', maxLength:40, description:'yapılan etkinliğin kimliği' },
            tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' }
          }
        },
        onizle:p => {
          const min = (p && p.dakika) || 5;
          return { metin:min + ' dakikalık mola kaydedilecek.',
            satirlar:['Süre: ' + min + ' dk' + (p && p.etkinlikId ? ' · Etkinlik: ' + p.etkinlikId : '')] };
        },
        uygula:async p => {
          const min = (p && p.dakika) || 5;
          const d = (p && p.tarih) || R.U.todayISO();
          const rec = await R.Model.saveBreak({ dayISO:d, minutes:min, activityId:(p && p.etkinlikId) || null });
          render();
          return { metin:'Mola kaydedildi (' + min + ' dk).', geriAl:async () => {
            R.S.breaks = (R.S.breaks || []).filter(b => b.id !== rec.id);
            await R.Store.remove('breaks/' + rec.id);
            render();
          }};
        }
      },

      /* 9. ays_profil */
      {
        ad:'ays_profil', tur:'yaz', seviye:'orta', ozetAd:'Profil kaydet / güncelle',
        aciklama:'Profil ayarlarını günceller ya da cihaza yeni aday profili ekler.',
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['guncelle', 'yeni_profil'], description:'işlem türü (guncelle ya da yeni_profil)' },
            ad:{ type:'string', maxLength:60, description:'profil / aday adı' },
            sehir:{ type:'string', maxLength:60, description:'şehir' },
            alan:{ type:'string', enum:['SAY', 'EA', 'SOZ', 'DIL'], description:'alan' },
            hedefSira:{ type:'integer', minimum:1, maximum:3000000, description:'hedef sıralama' },
            uykuHedefi:{ type:'number', minimum:4, maximum:12, description:'uyku hedefi (saat)' },
            kocTonu:{ type:'string', enum:['dengeli', 'sert', 'sevecen', 'akademik'], description:'koç üslubu' }
          }
        },
        onizle:p => {
          if(p && p.islem === 'yeni_profil'){
            return { metin:'Yeni aday profili eklenecek: «' + (p.ad || 'Yeni profil') + '»',
              satirlar:['Profil adı: ' + (p.ad || 'Yeni profil')] };
          }
          return { metin:'Profil ayarları güncellenecek.',
            satirlar:[p && p.ad ? 'Ad: ' + p.ad : null, p && p.alan ? 'Alan: ' + p.alan : null,
              p && p.hedefSira ? 'Hedef sıra: ' + p.hedefSira : null, p && p.uykuHedefi ? 'Uyku hedefi: ' + p.uykuHedefi + ' sa' : null,
              p && p.kocTonu ? 'Koç tonu: ' + p.kocTonu : null].filter(Boolean) };
        },
        uygula:async p => {
          if(p && p.islem === 'yeni_profil'){
            const rec = await R.Model.saveProfileEntry({ name:(p && p.ad) || 'Yeni profil' });
            render();
            return { metin:'Yeni profil eklendi: «' + rec.name + '».', geriAl:async () => {
              R.S.profiles = (R.S.profiles || []).filter(x => x.id !== rec.id);
              await R.Store.remove('profiles/' + rec.id);
              render();
            }};
          }
          const eski = Object.assign({}, R.S.profile);
          if(p && p.ad) R.S.profile.name = p.ad;
          if(p && p.sehir) R.S.profile.city = p.sehir;
          if(p && p.alan) R.S.profile.track = p.alan;
          if(p && p.hedefSira) R.S.profile.targetRank = p.hedefSira;
          if(p && p.uykuHedefi) R.S.profile.sleepTarget = p.uykuHedefi;
          if(p && p.kocTonu) R.S.profile.coachTone = p.kocTonu;
          await R.Model.saveProfile();
          render();
          return { metin:'Profil güncellendi.', geriAl:async () => {
            Object.assign(R.S.profile, eski);
            await R.Model.saveProfile();
            render();
          }};
        }
      },

      /* 10. ays_profiller */
      {
        ad:'ays_profiller', tur:'oku', aciklama:'Cihazda kayıtlı aday profillerini ve gözetmen özetlerini listeler.',
        ornek:'cihazdaki profiller',
        calistir:() => {
          const list = R.Model.profileList ? R.Model.profileList() : [];
          const active = R.Model.activeProfileId ? R.Model.activeProfileId() : 'main';
          let snaps = {};
          try{ snaps = JSON.parse(localStorage.getItem('rota.snapshots') || '{}'); }catch(e){}
          const profiller = list.map(p => {
            const s = snaps[p.id] || null;
            return { id:p.id, ad:p.name, aktif:p.id === active, olusturma:p.createdAt,
              hafta:s ? s.week : null, tamamlama:s ? s.completion : null, tytMedyan:s ? s.tytMedian : null };
          });
          const satirlar = profiller.length ? profiller.map(p => p.ad + (p.aktif ? ' (açık profil)' : '') + (p.tamamlama != null ? ' · Plan: %' + p.tamamlama : '')) : ['Kayıtlı profil yok.'];
          return { sonuc:{ profiller, aktifProfil:active }, satirlar };
        }
      },

      /* 11. ays_takvim */
      {
        ad:'ays_takvim', tur:'yaz', seviye:'orta', ozetAd:'Takvim istisnası',
        aciklama:'Takvime tatil, okul sınavı, yoğun gün gibi istisnaları ekler, günceller ya da siler.',
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'takvim kaydının kimliği' },
            tur:{ type:'string', enum:['tatil', 'okulSinavi', 'yogun', 'ekstra'], description:'istisna türü' },
            baslangic:{ type:'string', maxLength:10, description:'başlangıç tarihi (YYYY-AA-GG)' },
            bitis:{ type:'string', maxLength:10, description:'bitiş tarihi (YYYY-AA-GG)' },
            not:{ type:'string', maxLength:200, description:'istisna notu' },
            ad:{ type:'string', maxLength:100, description:'kaydın adı / notu (arama için)' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const c = takvimBul(p);
            if(!c) return { hata:takvimBulHata(p) };
            return { metin:'Takvim kaydı silinecek.', satirlar:[c.from + (c.to && c.to !== c.from ? '–' + c.to : '') + ' · ' + c.kind + (c.note ? ' · ' + c.note : '')] };
          }
          if(p.islem === 'guncelle'){
            const c = takvimBul(p);
            if(!c) return { hata:takvimBulHata(p) };
            return { metin:'Takvim kaydı güncellenecek.', satirlar:['Tarih: ' + (p.baslangic || c.from), 'Tür: ' + (p.tur || c.kind)] };
          }
          const b = p.baslangic || R.U.todayISO();
          return { metin:'Takvim istisnası kaydedilecek.',
            satirlar:['Tarih: ' + b + (p.bitis && p.bitis !== b ? '–' + p.bitis : ''), 'Tür: ' + (p.tur || 'tatil'), 'Not: ' + (p.not || '—')] };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const c = takvimBul(p);
            if(!c) return { ok:false, metin:takvimBulHata(p) };
            await R.Model.deleteCalendar(c.id);
            render();
            return { metin:'Takvim kaydı silindi.', geriAl:async () => { await R.Model.saveCalendar(c); render(); } };
          }
          if(p.islem === 'guncelle'){
            const c = takvimBul(p);
            if(!c) return { ok:false, metin:takvimBulHata(p) };
            const eski = Object.assign({}, c);
            if(p.tur) c.kind = p.tur;
            if(p.baslangic) c.from = p.baslangic;
            if(p.bitis) c.to = p.bitis;
            if(p.not != null) c.note = p.not;
            await R.Model.saveCalendar(c);
            render();
            return { metin:'Takvim kaydı güncellendi.', geriAl:async () => { await R.Model.saveCalendar(eski); render(); } };
          }
          const b = p.baslangic || R.U.todayISO();
          const doc = { id:p.id || R.U.uid('k'), kind:p.tur || 'tatil', from:b, to:p.bitis || b, note:p.not || '' };
          const eklenen = await R.Model.saveCalendar(doc);
          render();
          return { metin:'Takvim istisnası kaydedildi.', geriAl:async () => { await R.Model.deleteCalendar(eklenen.id); render(); } };
        }
      },

      /* 12. ays_telafi */
      {
        ad:'ays_telafi', tur:'yaz', seviye:'orta', ozetAd:'Telafi protokolü',
        aciklama:'Telafi protokolünü (hastalık, kopma, deneme düşüşü vb.) günceller ya da başlatır.',
        parametreler:{
          type:'object',
          properties:{
            id:{ type:'string', maxLength:40, description:'protokol kimliği' },
            protoId:{ type:'string', maxLength:40, description:'protokol tanım kimliği (two-weeks-behind, ayt-late, math-weak, flat-nets)' },
            durum:{ type:'string', enum:['active', 'completed', 'abandoned'], description:'protokol durumu' },
            sonuc:{ type:'string', maxLength:500, description:'protokol sonuç notu' }
          }
        },
        onizle:p => {
          const rec = p && p.id ? (R.S.protocols || []).find(x => x.id === p.id) : ((R.Model.activeProtocols && R.Model.activeProtocols()[0]) || null);
          const def = p && p.protoId ? (R.RECOVERY_PROTOCOLS || []).find(x => x.id === p.protoId) : null;
          const baslik = (rec && rec.title) || (def && def.title) || 'Telafi protokolü';
          return { metin:'«' + baslik + '» güncellenecek.',
            satirlar:['Durum: ' + ((p && p.durum) || (rec && rec.status) || 'active'), (p && p.sonuc) ? 'Sonuç: ' + p.sonuc : null].filter(Boolean) };
        },
        uygula:async p => {
          let rec = p && p.id ? (R.S.protocols || []).find(x => x.id === p.id) : null;
          let yeni = false, eski = null;
          if(!rec && p && p.protoId && R.Model.startProtocol){
            const def = (R.RECOVERY_PROTOCOLS || []).find(x => x.id === p.protoId);
            if(!def) return { ok:false, metin:'«' + p.protoId + '» kimlikli protokol tanımı bulunamadı.' };
            rec = await R.Model.startProtocol(p.protoId);
            yeni = true;
          }
          if(!rec && (R.S.protocols || []).length){
            rec = R.S.protocols[0];
          }
          if(rec){
            eski = JSON.parse(JSON.stringify(rec));
            if(p && p.durum) rec.status = p.durum;
            if(p && p.sonuc) rec.outcome = p.sonuc;
            await R.Model.saveProtocol(rec);
          }
          render();
          return { metin:'Telafi protokolü güncellendi.', geriAl:async () => {
            if(yeni && rec){
              R.S.protocols = (R.S.protocols || []).filter(x => x.id !== rec.id);
              await R.Store.remove('protocols/' + rec.id);
            }else if(eski){
              await R.Model.saveProtocol(eski);
            }
            render();
          }};
        }
      },

      /* 13. ays_video_notu */
      {
        ad:'ays_video_notu', tur:'yaz', seviye:'orta', ozetAd:'Video / ders notu',
        aciklama:'Video ders notu ekler, günceller ya da siler.',
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'not kimliği' },
            baslik:{ type:'string', maxLength:120, description:'video / not başlığı' },
            url:{ type:'string', maxLength:300, description:'video linki (YouTube vb.)' },
            dersId:{ type:'string', maxLength:30, description:'ders kimliği' },
            konuId:{ type:'string', maxLength:50, description:'konu kimliği' },
            not:{ type:'string', maxLength:2000, description:'not metni / transkript' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const n = videoNotuBul(p);
            if(!n) return { hata:videoNotuBulHata(p) };
            return { metin:'Video notu silinecek: «' + n.title + '»', satirlar:['Başlık: ' + n.title + (n.url ? ' · ' + n.url : '')] };
          }
          if(p.islem === 'guncelle'){
            const n = videoNotuBul(p);
            if(!n) return { hata:videoNotuBulHata(p) };
            return { metin:'Video notu güncellenecek.', satirlar:['Başlık: ' + (p.baslik || n.title), 'URL: ' + (p.url || n.url || '—')] };
          }
          return { metin:'Video notu kaydedilecek: «' + (p.baslik || 'Başlıksız not') + '»',
            satirlar:['Başlık: ' + (p.baslik || 'Başlıksız not'), p.url ? 'URL: ' + p.url : null, p.dersId ? 'Ders: ' + p.dersId : null].filter(Boolean) };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const n = videoNotuBul(p);
            if(!n) return { ok:false, metin:videoNotuBulHata(p) };
            await R.Model.deleteVideoNote(n.id);
            render();
            return { metin:'Video notu silindi.', geriAl:async () => { await R.Model.saveVideoNote(n); render(); } };
          }
          if(p.islem === 'guncelle'){
            const n = videoNotuBul(p);
            if(!n) return { ok:false, metin:videoNotuBulHata(p) };
            const eski = Object.assign({}, n);
            if(p.baslik) n.title = p.baslik;
            if(p.url) n.url = p.url;
            if(p.not) n.transcript = p.not;
            if(p.dersId) n.subjectId = p.dersId;
            if(p.konuId) n.topicId = p.konuId;
            await R.Model.saveVideoNote(n);
            render();
            return { metin:'Video notu güncellendi.', geriAl:async () => { await R.Model.saveVideoNote(eski); render(); } };
          }
          const note = R.Model.newVideoNote({
            title:p.baslik || 'Yeni Video Notu',
            url:p.url || '',
            subjectId:p.dersId || null,
            topicId:p.konuId || null,
            transcript:p.not || ''
          });
          await R.Model.saveVideoNote(note);
          render();
          return { metin:'Video notu kaydedildi.', geriAl:async () => { await R.Model.deleteVideoNote(note.id); render(); } };
        }
      },

      /* 14. ays_yanlis */
      {
        ad:'ays_yanlis', tur:'yaz', seviye:'orta', ozetAd:'Yanlış defteri',
        aciklama:'Yanlış defterine soru hatası ekler, günceller ya da siler.',
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'hata kimliği' },
            neden:{ type:'string', enum:['bilgi', 'dikkat', 'sure', 'okuma', 'yorum', 'diger'], description:'hata nedeni' },
            dersId:{ type:'string', maxLength:30, description:'ders kimliği' },
            konu:{ type:'string', maxLength:100, description:'konu adı' },
            not:{ type:'string', maxLength:500, description:'hata / çözüm notu' },
            denemeId:{ type:'string', maxLength:40, description:'bağlı deneme kimliği' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const err = yanlisBul(p);
            if(!err) return { hata:yanlisBulHata(p) };
            return { metin:'Yanlış kaydı silinecek.', satirlar:[(err.subjectId || '') + ' · ' + (err.topic || '') + ' · Neden: ' + (err.cause || 'belirtilmedi')] };
          }
          if(p.islem === 'guncelle'){
            const err = yanlisBul(p);
            if(!err) return { hata:yanlisBulHata(p) };
            return { metin:'Yanlış kaydı güncellenecek.', satirlar:['Ders: ' + (p.dersId || err.subjectId), 'Neden: ' + (p.neden || err.cause || '—')] };
          }
          return { metin:'Yanlış defterine kayıt yazılacak.',
            satirlar:['Ders: ' + (p.dersId || 'mat_tyt'), 'Neden: ' + (p.neden || 'bilgi'), 'Not: ' + (p.not || '—')] };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const err = yanlisBul(p);
            if(!err) return { ok:false, metin:yanlisBulHata(p) };
            await R.Model.deleteError(err.id);
            render();
            return { metin:'Yanlış kaydı silindi.', geriAl:async () => { await R.Model.saveError(err); render(); } };
          }
          if(p.islem === 'guncelle'){
            const err = yanlisBul(p);
            if(!err) return { ok:false, metin:yanlisBulHata(p) };
            const eski = Object.assign({}, err);
            if(p.neden) err.cause = p.neden;
            if(p.not) err.note = p.not;
            if(p.konu) err.topic = p.konu;
            if(p.dersId) err.subjectId = p.dersId;
            await R.Model.saveError(err);
            render();
            return { metin:'Yanlış kaydı güncellendi.', geriAl:async () => { await R.Model.saveError(eski); render(); } };
          }
          const err = {
            id:p.id || R.U.uid('err'),
            date:R.U.todayISO(),
            subjectId:p.dersId || 'mat_tyt',
            topic:p.konu || '',
            cause:p.neden || 'bilgi',
            note:p.not || '',
            examId:p.denemeId || null,
            status:'open',
            createdAt:new Date().toISOString()
          };
          await R.Model.saveError(err);
          render();
          return { metin:'Yanlış kaydı eklendi.', geriAl:async () => { await R.Model.deleteError(err.id); render(); } };
        }
      },
    ];
  }

  function liste(){ return okuma().concat(yazma()).concat(modelAraclari()); }

  return { liste, satirlar };
})();
