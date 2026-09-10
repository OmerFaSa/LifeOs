/* Ajanlarin onerebilecegi eylemler — KAPALI katalog.

   Ofis bugune kadar yalnizca OKUYORDU. Artik yazabilir; ama yazma yetkisi
   sinirsiz degil, sayili ve onaya bagli:

     ajan onerir  →  kural motoru dogrular  →  SEN onaylarsin  →  motor uygular

   Uc kural bu dosyayi ayakta tutar:

   1. KAPALI KATALOG. Ajan yalnizca buradaki bir eylemi onerebilir. Serbest
      metin hicbir yoldan eyleme donusmez — ajan defterindeki "kapali olcut
      listesi" ile ayni doktrin.
   2. YAPISAL PARAMETRE. Her eylemin parametreleri burada adiyla ve turuyle
      yazilidir. Fazladan alan gelirse oneri dusurulur, uydurulmus deger
      kural motorunda dogrulanamaz ve gecmez.
   3. GERI ALINABILIRLIK. Uygulanan her eylem oncesi durumun anlik goruntusunu
      birakir; kullanici tek dokunusla geri alir.

   Yetki ayrimi burada da gecerlidir: Tuna AYT konusunu tekrara alamaz,
   Rana net ile ilgili bir eylem oneremez. `agents` alani bunu kilitler.

   Eylem eklemek: buraya bir kayit yaz, core/proposals.js icindeki IMPL'e
   ayni id ile check/preview/apply/undo ekle, testine bir satir ekle. */

window.R = window.R || {};

R.ACTIONS = [
  {
    id:'topic-review',
    title:'Konuyu tekrara al',
    /* Kullaniciya "ne olacak" tek satirda soylenir. */
    summary:'Kapanmış görünen konunun durumu “çalışılıyor”a döner.',
    touches:'Konu durumu',
    icon:'refresh',
    route:'subjects',
    agents:['tyt', 'ayt'],
    params:{ subjectId:'string', topicId:'string' },
    why:'Kapanmış sayılan bir konu denemede net kaybettiriyorsa kapanış '
      + 'gerçek değildir; konu tekrar listesine döner.',
  },

  {
    id:'block-add',
    title:'Bugüne tekrar bloğu ekle',
    summary:'Günün planına yeni bir çalışma bloğu eklenir.',
    touches:'Bugünün planı',
    icon:'plus',
    route:'today',
    agents:['rehber', 'tyt', 'ayt'],
    params:{ subjectId:'string', topicId:'string', minutes:'number' },
    why:'Bir konu açık kaldıysa plana girmeden kapanmaz.',
  },

  {
    id:'cards-due-today',
    title:'Geciken tekrarları bugüne çek',
    summary:'Tarihi geçmiş tekrar kartları bugüne alınır.',
    touches:'Tekrar kartları',
    icon:'layers',
    route:'cards',
    agents:['analist'],
    params:{ limit:'number' },
    why:'Biriken tekrar borcu ertelendikçe büyür; bugüne çekilirse kapanır.',
  },

  {
    id:'card-from-error',
    title:'Açık yanlıştan kart üret',
    summary:'Yanlış defterindeki kayıttan bir tekrar kartı oluşturulur.',
    touches:'Tekrar kartları',
    icon:'plus',
    route:'cards',
    agents:['analist'],
    params:{ errorId:'string' },
    why:'Kök nedeni yazılmış ama karta dönmemiş yanlış, tekrar edilmediği '
      + 'için yine yapılır.',
  },

  {
    id:'week-target',
    title:'Haftalık soru hedefini güncelle',
    summary:'Bu haftanın soru hedefi değiştirilir.',
    touches:'Haftalık hedef',
    icon:'target',
    route:'week',
    agents:['patron', 'rehber'],
    params:{ weekN:'number', questionTarget:'number' },
    why:'Hedef sürekli tutmuyorsa sorun hedeftedir; gerçekçi hedef tutar.',
  },

  {
    id:'decision-close',
    title:'Açık kararı kapat',
    summary:'Takipteki karar “yapıldı” ya da “devredildi” olarak kapanır.',
    touches:'Karar takibi',
    icon:'check',
    route:'office',
    agents:['patron'],
    params:{ decisionId:'string', state:'string' },
    why:'Kapanmayan karar bir sonraki toplantının önüne düşer.',
  },
];

R.ACTION_BY_ID = R.ACTIONS.reduce((m, a) => { m[a.id] = a; return m; }, {});

/* Bir ajanin onerebilecegi eylemler — yetki ayrimi burada uygulanir. */
R.actionsFor = function(agentId){
  return R.ACTIONS.filter(a => a.agents.indexOf(agentId) >= 0);
};
