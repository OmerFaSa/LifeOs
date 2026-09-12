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

  /* ==================== KONUŞARAK VERİ GİRİŞİ ====================

     Yukarıdakiler PLAN eylemleridir: konuyu tekrara al, blok ekle,
     hedefi değiştir — ajanın bir ÖNERİSİDİR.

     Aşağıdakiler ham veri girişidir: «bugün matematikten 40 soru
     çözdüm» cümlesinin karşılığı. Öneren ajan değil KULLANICIDIR;
     yine de aynı kapıdan geçer, çünkü veri girişine ayrı ve daha
     gevşek bir yol açmak sistemin en çok kullanılan yolunu en az
     korunan yol yapardı.

     Yetki Patron'dadır ve bunun bir sebebi var: konuştuğun ajan odur.
     Alt koçlar bu eylemleri öneremez — Tuna senin adına «40 soru
     çözdün» diyemez. Sayı senin cümlenden çıkar, koçun tahmininden
     değil; önerinin gerekçesine SENİN cümlen yazılır. */
  {
    id:'soru-yaz',
    title:'Çözülen soruyu yaz',
    summary:'Söylediğin soru sayısı o günün ilgili bloğuna eklenir.',
    touches:'Gün kaydı',
    icon:'zap',
    route:'today',
    agents:['patron'],
    params:{ count:'number', correct:'number', subjectId:'string', topicId:'string', date:'string' },
    why:'Soru sayısı planın gerçekleşme oranını belirler; girilmeyen soru '
      + 'yapılmamış sayılır.',
  },
  {
    id:'paragraf-yaz',
    title:'Paragraf sayısını yaz',
    summary:'Günün paragraf sayacına eklenir.',
    touches:'Gün kaydı',
    icon:'zap',
    route:'today',
    agents:['patron'],
    params:{ count:'number', date:'string' },
    why:'Paragraf dokuz ay süren bir beceridir; günlük sayaç onu görünür tutar.',
  },
  {
    id:'problem-yaz',
    title:'Problem sayısını yaz',
    summary:'Günün problem sayacına eklenir.',
    touches:'Gün kaydı',
    icon:'zap',
    route:'today',
    agents:['patron'],
    params:{ count:'number', date:'string' },
    why:'Problem günlük rutinin ikinci ayağıdır.',
  },
  {
    id:'uyku-yaz',
    title:'Uyku süresini yaz',
    summary:'O günün uyku saati kaydedilir.',
    touches:'Gün kaydı',
    icon:'moon',
    route:'today',
    agents:['patron'],
    params:{ hours:'number', date:'string' },
    why:'Uyku, ertesi günün kapasitesini belirleyen tek ölçülebilir girdidir.',
  },
  {
    id:'sure-yaz',
    title:'Çalışma süresini yaz',
    summary:'Söylediğin süre o dersin bugünkü bloğuna eklenir.',
    touches:'Gün kaydı',
    icon:'clock',
    route:'today',
    agents:['patron'],
    params:{ minutes:'number', subjectId:'string', date:'string' },
    why:'Planlanan süre ile gerçekleşen süre arasındaki fark, planın '
      + 'gerçekçi olup olmadığını söyler.',
  },
];

R.ACTION_BY_ID = R.ACTIONS.reduce((m, a) => { m[a.id] = a; return m; }, {});

/* Bir ajanin onerebilecegi eylemler — yetki ayrimi burada uygulanir. */
R.actionsFor = function(agentId){
  return R.ACTIONS.filter(a => a.agents.indexOf(agentId) >= 0);
};
