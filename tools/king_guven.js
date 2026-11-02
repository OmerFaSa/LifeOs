#!/usr/bin/env node
/* KING GÜVEN DENETİMİ (KING-4 §G): izin kademeleri bütün araçlarda tutarlı mı?

   Kademe: «oku» serbest, «yaz» onaylı, «dis» (bilgisayar, telefon) ayrıca izinli.
   Kurallar (her araç kodunun kaynağıyla birlikte denetlenir):
     1. oku aracı dış dünyaya dokunmaz ve yazmaz: kaynağında /api/dis, eylemYaz, kayıt
        yazan çağrı (save/add/delete/kaydet/setItem/uygula) yok; `dis` taşımaz.
     2. yaz aracının önizlemesi ve uygulaması var (onaysız yazma yok).
     3. dış dünyaya giden (/api/dis ya da disIstek) her araç `dis:true`; `dis` aracı
        tur «yaz» ve seviye «buyuk» («Onaylıyorum» kartı).
   king_kapsam.js her modülün sayfasındaki araç kaydını buna verir (CI). Kendi sınaması:
     node tools/king_guven.js */

const DIS = /\/api\/dis\b|disIstek\(/;
const YAZAN = /\beylemYaz\(|\.(?:save|add|delete|remove|upsert|kaydet|setItem)\w*\(|\.uygula\(/;

function denetle(araclar){
  const bulgu = [];
  araclar.forEach(a => {
    const kod = String(a.kod || '');
    if(a.tur === 'oku'){
      if(a.dis) bulgu.push(a.ad + ': okuma aracı dış dünya işaretli');
      if(DIS.test(kod)) bulgu.push(a.ad + ': okuma aracı dış dünyaya gidiyor');
      if(YAZAN.test(kod)) bulgu.push(a.ad + ': okuma aracı yazıyor (' + kod.match(YAZAN)[0] + ')');
    }else if(a.tur === 'yaz'){
      if(!a.onizle || !a.uygula) bulgu.push(a.ad + ': yazan aracın önizlemesi ya da uygulaması yok');
    }else bulgu.push(a.ad + ': kademesi yok (tur ' + a.tur + ')');
    if(DIS.test(kod) && !a.dis) bulgu.push(a.ad + ': dış dünyaya gidiyor ama dis:true değil');
    if(a.dis && (a.tur !== 'yaz' || a.seviye !== 'buyuk')) bulgu.push(a.ad + ': dış dünya aracı «yaz» ve «buyuk» olmalı');
  });
  return bulgu;
}

/* Sayfada çalışır: araç kaydının denetlenecek biçimi (kullanılamayanlar dahil). */
function sayfadanTopla(){
  const A = LIFEOS.ARAC;
  return A.liste(true).map(a => ({ ad:a.ad, tur:a.tur, dis:!!a.dis, seviye:a.dis ? 'buyuk' : a.seviye || null,
    onizle:typeof a.onizle === 'function', uygula:typeof a.uygula === 'function',
    kod:[a.calistir, a.onizle, a.uygula].filter(f => typeof f === 'function').map(String).join('\n') }));
}

module.exports = { denetle, sayfadanTopla };

if(require.main === module){
  const assert = require('assert');
  assert.deepStrictEqual(denetle([
    { ad:'iyi_oku', tur:'oku', kod:'() => ({ cevap:K.oku() })' },
    { ad:'iyi_yaz', tur:'yaz', onizle:true, uygula:true, kod:'p => M.save(p)' },
    { ad:'iyi_dis', tur:'yaz', dis:true, seviye:'buyuk', onizle:true, uygula:true, kod:"p => disIstek('ac', p)" },
  ]), []);
  assert.deepStrictEqual(denetle([
    { ad:'sinsi_oku', tur:'oku', kod:"() => hkmIstek('/api/dis/ekran', {})" },
    { ad:'yazan_oku', tur:'oku', kod:'() => D().kaydet(x)' },
    { ad:'gizli_dis', tur:'yaz', onizle:true, uygula:true, kod:"p => disIstek('telefon', p)" },
    { ad:'kucuk_dis', tur:'yaz', dis:true, seviye:'orta', onizle:true, uygula:true, kod:'' },
    { ad:'onaysiz', tur:'yaz', kod:'' },
  ]).length, 6);
  console.log('King güven kuralları: temiz.');
}
