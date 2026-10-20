/* KING ARAÇLARI — AYS'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: ofis ajanlarının da gördüğü veri araçları (core/tools.js). Sonuç
   kişisel alanlardan süzülür (Tools.sanitize); sayıyı AYS'nin kendi hesabı
   üretir, King'in modeli yalnız cümleye çevirir.

   Yazma: plan eylemleri (data/actions.js, core/proposals.js). Önizleme
   Proposals.preview'dur; onaydan sonra Proposals.hemen aynı doğrulama,
   anlık görüntü ve geri almayla uygular. Ölçüm yazan eylemler (`olcum`:
   soru, süre, uyku…) burada YOK: ölçüm kullanıcının cümlesinden King'in
   `kayit_gir` aracıyla, AYS'nin kendi ayrıştırıcısıyla girer (sayı
   kullanıcınındır). `modelYok` eylemler (hedef planı) modelin seçimine
   kapalıdır; kullanıcı Hedeflerim'den yapar. */

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
  };
  const n2 = v => v == null ? 'veri yok' : String(v).replace('.', ',');

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
          if(R.App && R.App.render) R.App.render();
          const id = r.row && r.row.id;
          return { metin:def.title + ': uygulandı.', geriAl:id ? async () => { await R.Proposals.undo(id); if(R.App && R.App.render) R.App.render(); } : null };
        },
      };
    });
  }

  function liste(){ return okuma().concat(yazma()); }

  return { liste, satirlar };
})();
