/* ENVANTER — kısa Beş Faktör kişilik envanteri ve üslup gözlemi (KISI-PLANI Faz 4).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/envanter.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   KİŞİLİK: Mini-IPIP (Donnellan, Oswald, Baird ve Lucas, 2006), 20 madde,
   Uluslararası Kişilik Madde Havuzu'ndan (IPIP, ipip.ori.org) — maddeler
   KAMU MALIDIR. Türkçesi bu depoda yapılmıştır; Türkçe sürümün norm
   çalışması yoktur: puanlar yalnız SENİN cevaplarının ortalamasıdır,
   başkalarıyla karşılaştırılmaz.

   Sözler:
     1. KENDİ CEVABIN. Sonuç «senin sözün» katmanına, kişilik alanına
        yazılır; tahmin değil, beyandır — ama bir test sonucu olduğu ve
        günden güne değişebileceği yazılır.
     2. YARGI YOK (AGENTS §1.5). Puan «düşük / orta / yüksek» betimlemesidir;
        hiçbir uç «kötü» değildir. Nörotiklik yerine tersinden «duygusal
        denge» denir; hiçbir sonuç teşhis değildir.
     3. SOHBETLE. King maddeleri tek tek sorar (1–5); istediğin an bırakılır.

   ÜSLUP: King'e yazdığın mesajlardan sayılır (uzunluk, samimi sözler,
   emoji, soru işareti). Yalnız sayaçtır; metin saklanmaz. King üslubu
   çıkarım olarak SORAR (cikarim.js); onaylarsan model istemine girer. */
window.LIFEOS.PARCA.yazilar({
  'ortak.envanter.bir-ortamin-nesesi-olurum':'Bir ortamın neşesi olurum.',
  'ortak.envanter.kendi-duygularimdan-cok-bask':'Kendi duygularımdan çok başkalarının duygularını önemserim.',
  'ortak.envanter.i-slerimi-hemen-hallederim':'İşlerimi hemen hallederim.',
  'ortak.envanter.ruh-halim-sik-sik-degisir':'Ruh hâlim sık sık değişir.',
  'ortak.envanter.canli-bir-hayal-gucum-var':'Canlı bir hayal gücüm var.',
  'ortak.envanter.cok-konusmam':'Çok konuşmam.',
  'ortak.envanter.baskalarinin-sorunlari-beni':'Başkalarının sorunları beni pek ilgilendirmez.',
  'ortak.envanter.esyalari-cogu-zaman-yerine-k':'Eşyaları çoğu zaman yerine koymayı unuturum.',
  'ortak.envanter.cogu-zaman-rahatimdir':'Çoğu zaman rahatımdır.',
  'ortak.envanter.soyut-fikirler-beni-pek-ilgi':'Soyut fikirler beni pek ilgilendirmez.',
  'ortak.envanter.toplantilarda-ve-davetlerde':'Toplantılarda ve davetlerde birçok farklı insanla konuşurum.',
  'ortak.envanter.baskalarinin-duygularini-his':'Başkalarının duygularını hissederim.',
  'ortak.envanter.duzeni-severim':'Düzeni severim.',
  'ortak.envanter.kolay-uzulurum':'Kolay üzülürüm.',
  'ortak.envanter.soyut-fikirleri-anlamakta-zo':'Soyut fikirleri anlamakta zorlanırım.',
  'ortak.envanter.arka-planda-kalmayi-tercih-e':'Arka planda kalmayı tercih ederim.',
  'ortak.envanter.baskalariyla-pek-ilgilenmem':'Başkalarıyla pek ilgilenmem.',
  'ortak.envanter.i-sleri-sik-sik-dagitirim':'İşleri sık sık dağıtırım.',
  'ortak.envanter.nadiren-huzunlenirim':'Nadiren hüzünlenirim.',
  'ortak.envanter.hayal-gucum-pek-guclu-degild':'Hayal gücüm pek güçlü değildir.',
  'ortak.envanter.hic-katilmiyorum':'Hiç katılmıyorum',
  'ortak.envanter.tamamen-katiliyorum':'Tamamen katılıyorum',
});

window.LIFEOS.PARCA.yazilar({
  'ortak.envanter.disadonukluk':'Dışadönüklük',
  'ortak.envanter.uyumluluk':'Uyumluluk',
  'ortak.envanter.sorumluluk':'Sorumluluk',
  'ortak.envanter.duygusal-denge':'Duygusal denge',
  'ortak.envanter.deneyime-aciklik':'Deneyime açıklık',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.ENVANTER = (function(){
  /* [metin, boyut, yön] — yön −1: ters puanlanır. */
  const MADDELER = Object.freeze([
    [yz('ortak.envanter.bir-ortamin-nesesi-olurum'), 'E', 1],
    [yz('ortak.envanter.kendi-duygularimdan-cok-bask'), 'A', 1],
    [yz('ortak.envanter.i-slerimi-hemen-hallederim'), 'C', 1],
    [yz('ortak.envanter.ruh-halim-sik-sik-degisir'), 'N', 1],
    [yz('ortak.envanter.canli-bir-hayal-gucum-var'), 'O', 1],
    [yz('ortak.envanter.cok-konusmam'), 'E', -1],
    [yz('ortak.envanter.baskalarinin-sorunlari-beni'), 'A', -1],
    [yz('ortak.envanter.esyalari-cogu-zaman-yerine-k'), 'C', -1],
    [yz('ortak.envanter.cogu-zaman-rahatimdir'), 'N', -1],
    [yz('ortak.envanter.soyut-fikirler-beni-pek-ilgi'), 'O', -1],
    [yz('ortak.envanter.toplantilarda-ve-davetlerde'), 'E', 1],
    [yz('ortak.envanter.baskalarinin-duygularini-his'), 'A', 1],
    [yz('ortak.envanter.duzeni-severim'), 'C', 1],
    [yz('ortak.envanter.kolay-uzulurum'), 'N', 1],
    [yz('ortak.envanter.soyut-fikirleri-anlamakta-zo'), 'O', -1],
    [yz('ortak.envanter.arka-planda-kalmayi-tercih-e'), 'E', -1],
    [yz('ortak.envanter.baskalariyla-pek-ilgilenmem'), 'A', -1],
    [yz('ortak.envanter.i-sleri-sik-sik-dagitirim'), 'C', -1],
    [yz('ortak.envanter.nadiren-huzunlenirim'), 'N', -1],
    [yz('ortak.envanter.hayal-gucum-pek-guclu-degild'), 'O', -1],
  ]);
  const CEVAPLAR = Object.freeze([yz('ortak.envanter.hic-katilmiyorum'), 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', yz('ortak.envanter.tamamen-katiliyorum')]);
  const BOYUT = {
    E:{ ad:yz('ortak.envanter.disadonukluk'), yuksek:'insanlarla olmaktan enerji alıyorsun', dusuk:'sakin ve kendi içine dönük ortamlarda daha rahatsın' },
    A:{ ad:yz('ortak.envanter.uyumluluk'), yuksek:'başkalarının duygularını önemseyen, anlayışlı birisin', dusuk:'doğrudan ve kendi yolunu izleyen birisin' },
    C:{ ad:yz('ortak.envanter.sorumluluk'), yuksek:'düzenli ve işini zamanında bitiren birisin', dusuk:'esnek ve kendiliğinden davranmayı seviyorsun' },
    D:{ ad:yz('ortak.envanter.duygusal-denge'), yuksek:'çoğu zaman sakin ve dengelisin', dusuk:'duyguların yoğun ve hızlı değişebiliyor' },
    O:{ ad:yz('ortak.envanter.deneyime-aciklik'), yuksek:'hayal gücü güçlü, fikirlere meraklı birisin', dusuk:'somut ve pratik olanı seviyorsun' },
  };

  /* cevaplar: 20 elemanlı, 1–5 (eksik: null). Döner: boyut puanları. */
  function puanla(cevaplar){
    const top = { E:[], A:[], C:[], N:[], O:[] };
    MADDELER.forEach(([, b, yon], i) => {
      const c = cevaplar && cevaplar[i];
      if(typeof c !== 'number' || c < 1 || c > 5) return;
      top[b].push(yon > 0 ? c : 6 - c);
    });
    const ort = l => l.length ? l.reduce((a, b) => a + b, 0) / l.length : null;
    const p = { E:ort(top.E), A:ort(top.A), C:ort(top.C), O:ort(top.O) };
    const n = ort(top.N);
    p.D = n == null ? null : 6 - n;            // duygusal denge = nörotikliğin tersi
    const eksik = (cevaplar || []).filter(c => typeof c !== 'number').length + Math.max(0, 20 - (cevaplar || []).length);
    return { puan:p, tam:eksik === 0 };
  }
  function seviye(v){ return v == null ? null : v >= 3.67 ? 'yüksek' : v <= 2.33 ? 'düşük' : 'orta'; }
  const vg = v => String(Math.round(v * 10) / 10).replace('.', ',');
  /* Hafızaya girecek satırlar (kişilik alanı). */
  function satirlar(p){
    return ['E', 'A', 'C', 'D', 'O'].filter(k => p[k] != null).map(k => {
      const s = seviye(p[k]), b = BOYUT[k];
      const ac = s === 'yüksek' ? b.yuksek : s === 'düşük' ? b.dusuk : 'iki ucun ortasındasın';
      return b.ad + ': ' + s + ' (' + vg(p[k]) + '/5) — ' + ac + '. Kaynak: kişilik envanteri (Mini-IPIP), kendi cevapların.';
    });
  }

  /* -------------------------------------------------------------- üslup */
  const SAMIMI = /(?<![a-zçğıöşü])(kanka|abi|abla|hocam|reis|kardeşim|ya|valla|harbiden|lan|moruk)(?![a-zçğıöşü])/;
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  function uslupGuncelle(s, metin){
    const o = Object.assign({ n:0, uzunluk:0, samimi:0, emoji:0, soru:0 }, s || {});
    const t = String(metin || '').trim();
    if(!t) return o;
    o.n++; o.uzunluk += t.length;
    if(SAMIMI.test(t.toLocaleLowerCase('tr'))) o.samimi++;
    if(EMOJI.test(t)) o.emoji++;
    if(/\?\s*$/.test(t)) o.soru++;
    return o;
  }
  /* En az 15 mesaj; döner: { kisa, samimi, emoji, ozet } ya da null. */
  function uslupOzeti(s){
    if(!s || s.n < 15) return null;
    const ort = s.uzunluk / s.n;
    const kisa = ort <= 45, samimi = s.samimi / s.n >= 0.15, emoji = s.emoji / s.n >= 0.15;
    const parca = [kisa ? 'kısa' : 'uzun ve ayrıntılı', samimi ? 'samimi (arkadaşça)' : 'ölçülü', emoji ? 'emojili' : null].filter(Boolean);
    return { kisa, samimi, emoji, ort:Math.round(ort), ozet:parca.join(', ') };
  }

  return { MADDELER, CEVAPLAR, BOYUT, puanla, seviye, satirlar, uslupGuncelle, uslupOzeti };
})();
