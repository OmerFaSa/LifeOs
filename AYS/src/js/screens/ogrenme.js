/* Öğren › Öğrenme — AYS konularını öğrenme motoruna bağlar (ortak/ogrenmotor.js).

   İçerik değişmez: 184 konunun anlatımı, derin katmanı ve soruları olduğu gibi verilir.
   Motorun cevabı `R.Ogren.cevapla` ile konu kaydına da yazılır, Sorular sekmesi aynı
   soruyu çözülmemiş göstermesin; ilk cevap kilidi orada kalır. Planı ve kapanışı
   etkilemez (ogren.js söz 3). Ön tahmin ölçüm değildir, oraya yazılmaz. */
window.LIFEOS.PARCA.yazilar({
  'ays.ogrenme.kalip-baslik':'Sınavda nasıl sorulur?',
  'ays.ogrenme.kalip-metin':'Bu konu sınavda çoğunlukla şu kalıplarla gelir:',
  'ays.ogrenme.baslik':'Öğrenme',
});

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.sayfa({ id:'ogrenme', modul:'ays', king:{ sira:122, ad:'Öğrenme', es:['öğrenme', 'konu öğren', 'adım adım öğren', 'öğrenme motoru'] }, cekmece:'ogren', ad:'Öğrenme', ikon:'zap', sira:15 });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:35, group:'Git', label:'Öğrenme — adım adım konu, karışık tekrar, kendi konun', icon:'zap', route:'ogrenme', run(){ R.App.go('ogrenme'); } });

R.Screens.ogrenme = (function(){
  const OM = () => window.LIFEOS.OGRENMOTOR;
  const O = () => R.Ogren;
  const SES = { var:() => !!(R.Voice && R.Voice.available()), konus:m => R.Voice.speak(m), dur:() => { if(R.Voice) R.Voice.cancel(); } };

  let dizin = null;
  const konuBul = id => {
    if(!dizin){ dizin = {}; O().konular().forEach(x => { dizin[x.topic.id] = x; }); }
    return dizin[id] || null;
  };

  function konu(id){
    const x = konuBul(id), a = x && O().anlatim(id);
    if(!a) return null;
    const d = O().derin(id) || {};
    const sor = O().sorular(id).map((q, i) => ({ id:String(i), soru:q.soru, sec:q.sec, dogru:q.dogru, ipucu:q.ipucu, cozum:q.cozum, seviye:O().seviye(id, i),
      gorsel:(q.sekil || q.tablo) && R.Sekil ? R.Sekil.svg(q.sekil) + R.Sekil.tablo(q.tablo) : '' }));
    const parcalar = (a.bolumler || []).slice();
    /* Sınav kalıbı anlatımın son parçasıdır: «bu konu nasıl sorulur?» */
    if(d.kaliplar && d.kaliplar.length) parcalar.push({ baslik:yz('ays.ogrenme.kalip-baslik'), metin:yz('ays.ogrenme.kalip-metin'), liste:d.kaliplar });
    return { id, ad:x.topic.name, grup:x.subject.id, grupAd:x.subject.name, etiket:yz('ortak.om.etiket-yazili'), giris:a.giris,
      kazanim:d.kazanim, onKosul:d.onKosul, parcalar, ornekler:d.ornekler, hatalar:d.hatalar, sorular:sor,
      terimler:(O().kavramlar(id) || []).slice(0, 8),
      sezgi:a.sezgi, kartlar:a.kartlar, kodlama:a.kodlama, gorevler:a.gorevler };
  }

  /* Öğren sorularının ilk cevapları ve biten karma testler (yeni kayıt yok). Yenilenen sorunun
     eski cevabı soru ölçümü sayılmaz ama o gün konunun bilindiğini gösterir; burada kalır.
     shortcut: motorun cevabı konu kaydında da durur, o günün oranında iki kez sayılır; eşik orana
     baktığı için karar nadiren değişir, kayıtlar birleşirse tekilleştirilir. */
  function ekKanit(id){
    const x = konuBul(id);
    if(!x) return [];
    const o = R.Model.topicState(x.subject.id, id).ornek;
    const l = o && typeof o === 'object' ? Object.keys(o).map(i => o[i]).filter(v => v && v.at && !v.bak && typeof v.d === 'boolean')
      .map(v => ({ g:R.U.iso(new Date(v.at)), isabet:v.d, ipucu:!!v.ip })) : [];
    return l.concat(R.OgrenTest ? R.OgrenTest.konuKanit(id) : []);
  }

  /* Kurumun temposu: 184 konu YKS'nindir (ÖSYM biçimi). Sayı Öğren'in tempo rozetiyle aynı sistem ayarıdır.
     shortcut: ogren.js tempoRozeti ile aynı iki sayı burada da yazılı; biri değişirse öbürü de değişmeli. */
  function tempo(id){
    const x = konuBul(id);
    if(!x) return null;
    return { sn:String(x.subject.id).indexOf('ayt') === 0 ? 120 : 75, ad:'YKS (ÖSYM)' };
  }

  function hazirla(){
    if(!OM() || OM().kuruluMu()) return;
    OM().kur({ modul:'ays',
      depo:{ oku:k => R.Store.get(k), yaz:(k, v) => R.Store.set(k, v) },
      bugun:() => R.U.todayISO(),
      konular:() => O().konular().map(x => ({ id:x.topic.id, ad:x.topic.name, grup:x.subject.id, grupAd:x.subject.name })),
      konu, ekKanit, ses:SES, tempo,
      ekIdler:() => O().konular().map(x => x.topic.id),
      metin:s => O().metinHtml(s),
      oncelik:() => { const s = O().sonAcilan(); return s ? s.topic.id : null; },
      git:() => R.App.go('ogrenme'),
      async cevapKanca(c){
        const x = konuBul(c.konu);
        if(x && c.kapali && c.harf && /^\d+$/.test(c.soru)) await O().cevapla(x.subject.id, c.konu, Number(c.soru), c.harf, !!c.ipucu);
      },
    });
  }
  hazirla();

  LIFEOS.PARCA.blok({ id:'ogrenme.motor', sayfa:'ogrenme', yer:'ana', ad:'Öğrenme', ciz(){ return window.LIFEOS.OMEKRAN.html(); } });
  function render(){ return LIFEOS.PARCA.yer('ogrenme', 'ana', R.C); }
  return { id:'ogrenme', title:yz('ays.ogrenme.baslik'), subtitle(){ return ''; }, lede(){ return ''; }, actions(){ return ''; }, render, handle:{}, hazirla };
})();
