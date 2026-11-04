/* Öğretmen (King, 2026-10-22, KING-4 §D): SPİ'nin öğrenme kavramı King dersi olarak;
   soru, 1/3/7 tekrar ve King araçları ortak öğretme motorundan (brand/ortak/ogret.js).

   Metin data/ogrenme.js'teki kavramın kendisidir (tanım, dikkat, örnek); King
   yazmaz, model çağrılmaz. Kavramın inceleme durumu etikette durur. SPİ teşhis
   koymaz ve doz önermez (AGENTS §1.5): ders ve soru yalnız kavram bilgisidir. */
window.LIFEOS.PARCA.yazilar({
  'spi.core.kingders.spi-kavram':'SPİ · kavram',
  'spi.core.kingders.spi-ogrenme-kavrami':'SPİ öğrenme kavramı',
  'spi.core.kingders.tekrar':'Tekrar (',
  'spi.core.kingders.hangi-kavramin-tanimi':'Hangi kavramın tanımı: «',
  'spi.core.kingders.spi-ogrenme-kavrami-2':'SPİ · öğrenme kavramı',
  'spi.core.kingders.tanim':'Tanım: ',
});


window.SP = window.SP || {};

SP.KingDers = (function(){
  'use strict';

  const TEKRAR_KEY = 'spi.ogret.tekrar';
  const SON_KEY = 'spi.ogret.son';
  const BELLEK = {};

  const getOgret = () => window.LIFEOS && window.LIFEOS.OGRET;
  const tekrarDepo = () => { const OGRET = getOgret(); return OGRET ? OGRET.depo(TEKRAR_KEY) : null; };
  const sonDepo = () => { const OGRET = getOgret(); return OGRET ? OGRET.depo(SON_KEY) : null; };
  const bugunISO = () => SP.U && SP.U.todayISO ? SP.U.todayISO() : new Date().toISOString().slice(0, 10);

  function adayKavramlar(){
    return (SP.OGRENME_KAVRAMLAR || []).filter(c => c && c.title && c.definition);
  }

  function ders(konu){
    const OGRET = getOgret();
    if(!OGRET) return null;
    const l = SP.OGRENME_KAVRAMLAR || [];
    const c = OGRET.bul(l, konu, x => [x.title]);
    if(!c) return null;
    return {
      id: c.id,
      baslik: c.title,
      alt: yz('spi.core.kingders.spi-kavram'),
      giris: '',
      etiket: c.ready_for_app ? yz('spi.core.kingders.spi-ogrenme-kavrami') : 'doğrulanmadı · uzman incelemesi bekliyor',
      sorgu: c.title,
      soruVar: adayKavramlar().length >= 4,
      bolumler: [
        { baslik: 'Tanım', metin: c.definition },
        { baslik: 'Dikkat', metin: c.watch },
        { baslik: 'Örnek', metin: c.example }
      ].filter(b => b.metin)
    };
  }

  function soru(konuMetni){
    const OGRET = getOgret();
    if(!OGRET) return null;
    const adaylar = adayKavramlar();
    if(adaylar.length < 4) return null;

    let c = null, not = '';
    const t = String(konuMetni == null ? '' : konuMetni).trim();

    if(t){
      c = OGRET.bul(adaylar, t, k => [k.title]);
      if(!c) return null;
      not = '';
    }else{
      const td = tekrarDepo();
      const vadeliler = td ? OGRET.vade(td, bugunISO()) : [];
      const gecerli = vadeliler.find(v => adaylar.some(a => a.id === v.kavram));
      if(gecerli){
        c = adaylar.find(a => a.id === gecerli.kavram);
        not = yz('spi.core.kingders.tekrar') + ((gecerli.n || 0) + 1) + '. tur): aynı kavram.';
      }else{
        const tk = td ? td.oku() : {};
        c = adaylar.find(a => !tk[a.id]);
        not = '';
        if(!c){
          c = adaylar[0];
          not = '';
        }
      }
    }

    if(!c) return null;

    const otekiBasliklar = adaylar.filter(a => a.id !== c.id).map(a => a.title);
    const secenekSonuc = OGRET.secenek(c.title, otekiBasliklar);
    if(!secenekSonuc) return null;

    const id = c.id + '|' + secenekSonuc.dogru;
    BELLEK[id] = secenekSonuc.sec;

    return {
      id,
      konu: c.title,
      soru: yz('spi.core.kingders.hangi-kavramin-tanimi') + c.definition + '»',
      sec: secenekSonuc.sec,
      kaynak: yz('spi.core.kingders.spi-ogrenme-kavrami-2') + (c.ready_for_app ? '' : ' · doğrulanmadı, uzman incelemesi bekliyor'),
      not
    };
  }

  function cevapla(id, harf){
    const OGRET = getOgret();
    if(!OGRET || !id || typeof id !== 'string' || !id.includes('|')) return null;

    const parcalar = id.split('|');
    const kavramId = parcalar[0];
    const dogruHarf = parcalar[1];
    if(!kavramId || !dogruHarf) return null;

    const adaylar = adayKavramlar();
    const c = adaylar.find(a => a.id === kavramId);
    if(!c) return null;

    const secenekler = BELLEK[id] || [];
    const secilenHarf = String(harf || '').toUpperCase();
    const idx = secilenHarf.charCodeAt(0) - 65;
    const secMetin = (idx >= 0 && idx < secenekler.length) ? secenekler[idx] : '';

    const td = tekrarDepo(), sd = sonDepo();
    if(!td) return null;

    const res = OGRET.cevap({
      tekrar: td,
      son: sd,
      bugun: bugunISO
    }, {
      id,
      kavram: c.id,
      konu: c.title,
      soru: yz('spi.core.kingders.hangi-kavramin-tanimi') + c.definition + '»',
      secilen: harf,
      dogru: dogruHarf,
      secMetin,
      dogruMetin: c.title,
      cozum: [yz('spi.core.kingders.tanim') + c.definition]
    });

    return {
      dogru: dogruHarf,
      cozum: (res.satirlar || []).concat([yz('spi.core.kingders.tanim') + c.definition]),
      not: res.not
    };
  }

  function araclar(){
    const OGRET = getOgret();
    if(!OGRET) return [];
    const td = tekrarDepo(), sd = sonDepo();
    if(!td) return [];
    return OGRET.araclar({
      modul: 'spi',
      tekrar: td,
      son: sd,
      bugun: bugunISO,
      ad: id => {
        const c = (SP.OGRENME_KAVRAMLAR || []).find(x => x.id === id);
        return c ? c.title : id;
      }
    });
  }

  return { ders, soru, cevapla, araclar };
})();
