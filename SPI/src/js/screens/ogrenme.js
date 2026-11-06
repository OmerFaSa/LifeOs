/* Kütüphanem › Öğrenme — SPİ bilgisini öğrenme motoruna bağlar (ortak/ogrenmotor.js).

   Kaynak: Anlatımlar (10), öğrenme kavramları (30), hareket kurulumu ve açık soruları (50 soru,
   önceden hiçbir ekrana bağlı değildi), derin analizler (6), spor-beslenme senaryoları (12).
   Hepsi sağlık davranışı bilgisidir: teşhis yok, doz yok (AGENTS §1.5). Reçete alanı
   (`prescription`) bu yüzden kullanılmaz. Kartların uzman incelemesi beklediği etikette yazar. */
window.LIFEOS.PARCA.yazilar({
  'spi.ogrenme.inceleme':'uzman incelemesi bekliyor',
  'spi.ogrenme.hareket':'Hareket kurulumu',
  'spi.ogrenme.kavram':'Kavramlar',
  'spi.ogrenme.analiz':'Veriyi okumak',
  'spi.ogrenme.senaryo':'Senaryolar',
  'spi.ogrenme.durumlar':'Spor ve beslenme durumları',
  'spi.ogrenme.nasil':'Nasıl çalışılır?',
  'spi.ogrenme.nasil-metin':'Her durumda önce neyin bilinmediğini söyle, sonra ne yapılacağını. Bu bilgi tek başına teşhis ya da doz değildir.',
  'spi.ogrenme.baslik':'Kütüphanem',
});

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.sayfa({ id:'ogrenme', modul:'spi', king:{ sira:125, ad:'Öğrenme', es:['öğrenme', 'konu öğren', 'adım adım öğren', 'öğrenme motoru'] }, cekmece:'kutuphane', ad:'Öğrenme', sira:15 });

SP.Screens.ogrenme = (function(){
  const OM = () => window.LIFEOS.OGRENMOTOR;
  const SES = {
    var:() => !!(SP.Speak && SP.Speak.supported() && SP.Speak.hasTurkish()),
    konus:m => SP.Speak.say(m, { agent:'king' }),
    dur:() => { if(SP.Speak) SP.Speak.stop(); },
  };
  const INCELEME = yz('spi.ogrenme.inceleme'), DURUMLAR = yz('spi.ogrenme.durumlar');
  const HAREKET = yz('spi.ogrenme.hareket'), KAVRAM = yz('spi.ogrenme.kavram'), ANALIZ = yz('spi.ogrenme.analiz'), SENARYO = yz('spi.ogrenme.senaryo');

  const desen = p => String(p || 'diğer').replace(/_/g, ' ');
  function hareketGruplari(){
    const g = {};
    (SP.PILOT_EGZERSIZLER || []).forEach(c => {
      const d = c.pattern || 'diger';
      (g[d] = g[d] || []).push(c);
    });
    return g;
  }
  function liste(){
    const l = (SP.REHBER_KONULAR || []).map(k => ({ id:k.id, ad:k.ad, grup:k.alan, grupAd:k.alan }));
    (SP.OGRENME_KAVRAMLAR || []).forEach(c => l.push({ id:c.id, ad:c.title, grup:KAVRAM, grupAd:KAVRAM }));
    (SP.DERIN_ANALIZLER || []).forEach(a => l.push({ id:a.id, ad:a.title, grup:ANALIZ, grupAd:ANALIZ }));
    const g = hareketGruplari();
    Object.keys(g).forEach(d => {
      if((SP.OGRENME_SORULAR || []).some(q => g[d].some(c => c.id === q.card_id))) l.push({ id:'hareket:' + d, ad:desen(d), grup:HAREKET, grupAd:HAREKET });
    });
    if((SP.SPOR_BESLENME || []).length) l.push({ id:'senaryolar', ad:DURUMLAR, grup:SENARYO, grupAd:SENARYO });
    return l;
  }

  function kavramKonu(c){
    const OG = window.LIFEOS.OGRET, r = OM().tohumlu(c.id);
    const diger = (SP.OGRENME_KAVRAMLAR || []).filter(x => x.id !== c.id);
    const sorular = [];
    const a = OG.secenek(c.title, diger.map(x => x.title), { rastgele:r });
    if(a) sorular.push({ id:'ad', soru:'Hangi kavramın tanımı: «' + c.definition + '»', sec:a.sec, dogru:a.dogru, cozum:[c.title + ': ' + c.definition], seviye:'temel' });
    const b = OG.secenek(c.definition, diger.map(x => x.definition), { rastgele:r });
    if(b) sorular.push({ id:'tanim', soru:'«' + c.title + '» nedir?', sec:b.sec, dogru:b.dogru, cozum:[c.definition], seviye:'temel' });
    return { id:c.id, ad:c.title, grup:KAVRAM, grupAd:KAVRAM, etiket:INCELEME, sinir:SP.REHBER_SINIR,
      parcalar:[{ baslik:c.title, metin:c.definition, dikkat:c.watch }], ornekler:c.example ? [{ soru:c.example, cozum:[] }] : [], sorular,
      acik:c.watch ? [{ id:'dikkat', soru:'«' + c.title + '» kaydederken neye dikkat edilir?', yanit:c.watch }] : [], niyet:true };
  }
  function hareketKonu(d){
    const kartlar = hareketGruplari()[d] || [];
    const sorular = (SP.OGRENME_SORULAR || []).filter(q => kartlar.some(c => c.id === q.card_id));
    return { id:'hareket:' + d, ad:desen(d), grup:HAREKET, grupAd:HAREKET, etiket:INCELEME, sinir:SP.REHBER_SINIR, niyet:true,
      parcalar:kartlar.slice(0, 8).map(c => ({ baslik:c.name_tr, metin:c.summary, liste:c.steps_tr, dikkat:c.setup_check })),
      acik:sorular.map(q => ({ id:q.id, soru:q.question, yanit:q.answer, olcut:q.rubric ? [q.rubric] : [] })) };
  }
  function analizKonu(a){
    const l = a.levels || [];
    return { id:a.id, ad:a.title, grup:ANALIZ, grupAd:ANALIZ, etiket:INCELEME, sinir:SP.REHBER_SINIR, giris:a.problem,
      parcalar:l.map(x => ({ baslik:x.name, metin:x.text })),
      aktarim:[{ id:'durum', soru:a.problem + ' Bu durumda neye bakarsın?', olcut:l.map(x => x.text) }] };
  }
  function senaryoKonu(){
    const l = SP.SPOR_BESLENME || [];
    return { id:'senaryolar', ad:DURUMLAR, grup:SENARYO, grupAd:SENARYO, etiket:INCELEME, sinir:SP.REHBER_SINIR,
      parcalar:[{ baslik:yz('spi.ogrenme.nasil'), metin:yz('spi.ogrenme.nasil-metin') }],
      acik:l.reduce((a, s) => a.concat([{ id:s.id + ':eksik', soru:'Durum: ' + s.situation + '. Hangi bilgi eksik?', yanit:s.missing_information },
        { id:s.id + ':eylem', soru:'Durum: ' + s.situation + '. Ne yapılır?', yanit:s.editor_action }]), []) };
  }

  function konu(id){
    const r = (SP.REHBER_KONULAR || []).find(k => k.id === id);
    if(r) return OM().rehberKonu(r, { sinir:SP.REHBER_SINIR, niyet:true });
    if(id === 'senaryolar') return senaryoKonu();
    if(String(id).indexOf('hareket:') === 0) return hareketKonu(String(id).slice(8));
    const c = (SP.OGRENME_KAVRAMLAR || []).find(x => x.id === id);
    if(c) return kavramKonu(c);
    const a = (SP.DERIN_ANALIZLER || []).find(x => x.id === id);
    return a ? analizKonu(a) : null;
  }

  function hazirla(){
    if(!OM() || OM().kuruluMu()) return;
    OM().kur({ modul:'spi',
      depo:{ oku:k => SP.Store.get(k), yaz:(k, v) => SP.Store.set(k, v) },
      bugun:() => SP.U.todayISO(),
      konular:liste, konu, ses:SES, sinir:SP.REHBER_SINIR,
      metin:s => window.LIFEOS.REHBER.metinHtml(s),
      git:() => SP.App.go('ogrenme'),
    });
  }
  hazirla();

  LIFEOS.PARCA.blok({ id:'ogrenme.motor', sayfa:'ogrenme', yer:'ana', ad:'Öğrenme', ciz(){ return window.LIFEOS.OMEKRAN.html(); } });
  function render(){ return LIFEOS.PARCA.yer('ogrenme', 'ana', SP.C); }
  return { id:'ogrenme', title:yz('spi.ogrenme.baslik'), subtitle(){ return ''; }, lede(){ return ''; }, actions(){ return ''; }, render, handle:{}, hazirla };
})();
