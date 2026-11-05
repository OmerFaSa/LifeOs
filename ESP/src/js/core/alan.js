/* ALAN SINAMASI — felsefe, tarih, okuma, yazı, ses ve dilde «konuyu gerçekten biliyor muyum?»

   Kullanıcı (2026-11-05): «sadece dil olarak bakma; felsefe ve birçok alanda kaynak nedir,
   en verimli nasıl öğrenilir». 68 konunun öğrenme kartında çalışma sorusu ve aktarım görevi
   zaten vardı ama cevabı bir tık ötede duruyor, hiçbir şey kaydedilmiyordu; konu ilerlemesi
   yalnız beyan (işaret kutusu) idi.

   Sözler:
   1. ÖNCE ÜRET, SONRA BAK. Cevap yazılmadan görünmez; karşılaştırmayı kişi yapar, kod puan
      vermez, model notlamaz (AGENTS §1.1, §1.5). Eksik gerekçe «tutmadı» sayılır.
   2. AŞAMAYI ÇEKİRDEK VERİR (brand/ortak/usta.js). Araya zaman girmeden kalıcı denmez.
      Kalıcı olan konuda soru AKTARIM görevine döner: aynı bilgi yeni bir örnekte.
   3. BEYAN ÖLÇÜM DEĞİLDİR. İşaret kutuları buraya girmez, hiçbir kapı bu kayıtla açılmaz.
   4. KAYNAK SÖYLENİR, ABARTILMAZ. Kaynak konunun bağlamıdır, her cümlenin onayı değildir;
      öğretmen incelemesinden geçmemiş kart öyle yazılır. */
window.LIFEOS.PARCA.yazilar({
  'esp.core.alan.kaynak-baglami':'Konu bağlamı; her cümlenin onayı değil. Öğretmen incelemesi bekliyor.',
});

window.ESP = window.ESP || {};

ESP.Alan = (function(){
  const ANAHTAR = 'meta/alanKanit', SAKLA = 40;

  const KAYNAK = {
    purdue:{ ad:'Purdue OWL', url:'https://owl.purdue.edu/' },
    'sep-logic':{ ad:'Stanford Felsefe Ansiklopedisi', url:'https://plato.stanford.edu/' },
    'sep-ethics':{ ad:'Stanford Felsefe Ansiklopedisi', url:'https://plato.stanford.edu/' },
    ud:{ ad:'Universal Dependencies', url:'https://universaldependencies.org/' },
    'ud-parallel':{ ad:'Universal Dependencies', url:'https://universaldependencies.org/' },
    cefr:{ ad:'Avrupa Konseyi CEFR', url:'https://www.coe.int/en/web/common-european-framework-reference-languages' },
    loc:{ ad:'ABD Kongre Kütüphanesi', url:'https://www.loc.gov/' },
    'omt-scales':{ ad:'Open Music Theory', url:'https://viva.pressbooks.pub/openmusictheory/' },
    'omt-meter':{ ad:'Open Music Theory', url:'https://viva.pressbooks.pub/openmusictheory/' },
    'pugetsound-meter':{ ad:'Puget Sound müzik teorisi', url:'https://musictheory.pugetsound.edu/' },
    nidcd:{ ad:'NIDCD (ABD Ulusal Sağlık Enstitüleri)', url:'https://www.nidcd.nih.gov/' },
    openlibrary:{ ad:'Open Library', url:'https://openlibrary.org/' },
    mutopia:{ ad:'Mutopia Project', url:'https://www.mutopiaproject.org/' },
    'mutopia-all':{ ad:'Mutopia Project', url:'https://www.mutopiaproject.org/' },
  };

  const bugun = () => ESP.U.todayISO();
  function kayit(){
    if(!ESP.S.alanKanit || typeof ESP.S.alanKanit !== 'object') ESP.S.alanKanit = {};
    return ESP.S.alanKanit;
  }
  async function yukle(){
    const d = await ESP.Store.get(ANAHTAR);
    ESP.S.alanKanit = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  }

  const kartOf = id => (ESP.OGRENME_KARTI_BY_TOPIC || {})[id] || null;
  const sinanabilir = t => { const c = kartOf(t.id); return !!(c && c.practice && c.practice.prompt); };
  const asama = id => window.LIFEOS.USTA.asama(kayit()[id] || [], bugun());

  function konular(disc){
    return (disc ? [disc] : ESP.Mod.active().map(d => d.id)).reduce((l, d) =>
      l.concat(ESP.Lesson.topics(d).filter(sinanabilir)), []);
  }
  function beceriler(disc){
    const k = kayit();
    return konular(disc).map(t => ({ id:t.id, grup:t.disc, kanitlar:k[t.id] || [] }));
  }
  function konuOf(id){ return konular().find(t => t.id === id) || null; }

  /* Kalıcı konuda aktarım görevi; yoksa ya da konu henüz oturmadıysa çalışma sorusu. */
  function soru(id){
    const c = kartOf(id);
    if(!c || !c.practice || !c.practice.prompt) return null;
    const a = asama(id);
    const aktarim = (a.id === 'kalici' || a.id === 'saglam') && c.transfer && c.transfer.prompt;
    return {
      aktarim:!!aktarim,
      ornek:(c.worked_example && c.worked_example.text) || null,
      soru:aktarim ? c.transfer.prompt : c.practice.prompt,
      yanit:aktarim ? null : c.practice.expected_answer || null,
      olcut:aktarim ? (c.transfer.rubric || []) : [],
      kaynaklar:kaynaklar(c),
      incelendi:!!c.ready_for_app,
    };
  }

  function kaynaklar(card){
    const gorulen = {};
    return ((card && card.source_ids) || []).map(i => KAYNAK[i]).filter(k => {
      if(!k || gorulen[k.url]) return false;
      gorulen[k.url] = true;
      return true;
    });
  }

  /* Tek kanıt. Güven işaretsizse boş kalır; konu sayfasından gelen sınama konuyu baştan
     söylediği için karışık sayılmaz. */
  async function kaydet(id, isabet, o){
    if(!sinanabilir({ id })) return { ok:false };
    const x = { g:bugun(), isabet:!!isabet };
    if(o && o.guven) x.guven = o.guven;
    if(o && o.karisik) x.karisik = true;
    const k = kayit();
    k[id] = (k[id] || []).concat([x]).slice(-SAKLA);
    await ESP.Store.set(ANAHTAR, k);
    return { ok:true, asama:asama(id) };
  }

  const sira = (n, disc) => window.LIFEOS.USTA.sira(beceriler(disc), bugun(), n);
  const harita = disc => window.LIFEOS.USTA.harita(beceriler(disc), bugun());

  return { KAYNAK, yukle, konular, konuOf, asama, soru, kaynaklar, kaydet, sira, harita };
})();
