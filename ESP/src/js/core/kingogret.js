/* KING ÖĞRETMEN — ESP'nin öğretme motoru adaptörü (brand/ortak/ogret.js, KING-4 §D).
   Kelime sorusu, cevabı, teşhisi ve King araçlarını LIFEOS.OGRET ile yapar.
   Kartın kendi SRS takvimi (core/srs.js) DEĞİŞMEZ; motorun takvimi 'esp.ogret.tekrar'da. */

window.ESP = window.ESP || {};

ESP.KingOgret = (function(){
  'use strict';

  const O = () => window.LIFEOS && window.LIFEOS.OGRET;
  const soruSecenekleri = {};

  function bugunISO(){
    return (ESP.U && ESP.U.todayISO) ? ESP.U.todayISO() : (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
  }

  function soru(konu){
    const OGRET = O();
    if(!OGRET) return null;

    const cards = (ESP.S && ESP.S.cards) || [];
    const adaylar = cards.filter(c => c && String(c.front || '').trim() && String(c.back || '').trim());
    if(adaylar.length < 4) return null;

    let secilenKart = null;
    let notMetni = '';

    if(konu && typeof konu === 'string' && konu.trim().length > 0){
      secilenKart = OGRET.bul(adaylar, konu, c => [c.front, c.back]);
    }

    if(!secilenKart){
      const bugun = bugunISO();
      const vadeliler = OGRET.vade(OGRET.depo('esp.ogret.tekrar'), bugun);
      let vadeKarti = null;
      let vadeKayit = null;
      for(let i = 0; i < vadeliler.length; i++){
        const v = vadeliler[i];
        const f = adaylar.find(c => c.id === v.kavram);
        if(f){
          vadeKarti = f;
          vadeKayit = v;
          break;
        }
      }

      if(vadeKarti){
        secilenKart = vadeKarti;
        const n = vadeKayit.n || 0;
        notMetni = 'Tekrar (' + (n + 1) + '. tur): aynı kart.';
      }else{
        const tk = OGRET.depo('esp.ogret.tekrar').oku();
        const takvimdeOlmayanlar = adaylar.filter(c => !tk[c.id] || tk[c.id].bitti);
        const havuz = takvimdeOlmayanlar.length ? takvimdeOlmayanlar : adaylar;
        secilenKart = havuz[Math.floor(Math.random() * havuz.length)];
        notMetni = '';
      }
    }

    if(!secilenKart) return null;

    const otekiArkaYuzler = adaylar.filter(c => c.id !== secilenKart.id).map(c => c.back);
    const opt = OGRET.secenek(secilenKart.back, otekiArkaYuzler);
    if(!opt || !opt.sec || opt.sec.length !== 4) return null;

    const id = secilenKart.id + '|' + opt.dogru;
    const soruMetni = '«' + secilenKart.front + '» ne demek?';

    soruSecenekleri[id] = {
      kartId: secilenKart.id,
      sec: opt.sec,
      soru: soruMetni,
      front: secilenKart.front,
      back: secilenKart.back
    };

    return {
      id: id,
      konu: 'Kelime kartı',
      soru: soruMetni,
      sec: opt.sec,
      kaynak: 'ESP · senin dil kartların',
      not: notMetni
    };
  }

  function cevapla(id, harf){
    const OGRET = O();
    const parts = String(id || '').split('|');
    const dogru = parts[parts.length - 1];
    const kartId = parts[0];

    const cards = (ESP.S && ESP.S.cards) || [];
    const kart = cards.find(c => c && c.id === kartId);
    if(!kart || !OGRET){
      return { dogru: dogru, cozum: [], not: '' };
    }

    const bellek = soruSecenekleri[id];
    const secilen = String(harf || '').toUpperCase();
    const secIndeks = 'ABCD'.indexOf(secilen);
    const secMetin = (bellek && bellek.sec && secIndeks >= 0) ? bellek.sec[secIndeks] : '';
    const soruMetni = (bellek && bellek.soru) || ('«' + kart.front + '» ne demek?');

    const kutuObj = (ESP.SRS && ESP.SRS.BOXES && ESP.SRS.BOXES.find(b => b.box === (kart.box || 1)));
    const kutuAdi = kutuObj ? kutuObj.label : String(kart.box || 1) + '. kutu';

    const g = {
      id: id,
      kavram: kart.id,
      konu: kart.front,
      soru: soruMetni,
      secilen: harf,
      dogru: dogru,
      secMetin: secMetin,
      dogruMetin: kart.back,
      cozum: ['«' + kart.front + '» = ' + kart.back],
      yeni: !kart.reps,
      yeniNeden: 'kart henüz hiç tekrar edilmedi',
      oncekiDogru: (kart.box || 1) >= 3,
      oncekiNeden: 'kart tekrar kutusunda «' + kutuAdi + '» düzeyindeydi'
    };

    const a = {
      tekrar: OGRET.depo('esp.ogret.tekrar'),
      son: OGRET.depo('esp.ogret.son'),
      bugun: bugunISO
    };

    const res = OGRET.cevap(a, g);
    const cozum = (res.satirlar || []).concat(['«' + kart.front + '» = ' + kart.back]);

    let notMetni = '';
    if(res.not){
      notMetni = res.not + ' Kartın kendi tekrar takvimi değişmez.';
    }else{
      notMetni = 'Bu cevap kartın tekrar takvimine yazılmaz.';
    }

    return {
      dogru: dogru,
      cozum: cozum,
      not: notMetni
    };
  }

  function araclar(){
    const OGRET = O();
    if(!OGRET) return [];
    return OGRET.araclar({
      modul: 'esp',
      tekrar: OGRET.depo('esp.ogret.tekrar'),
      son: OGRET.depo('esp.ogret.son'),
      ad: id => {
        const cards = (ESP.S && ESP.S.cards) || [];
        const c = cards.find(x => x && x.id === id);
        return c ? c.front : id;
      },
      bugun: bugunISO
    });
  }

  return {
    soru: soru,
    cevapla: cevapla,
    araclar: araclar
  };
})();
