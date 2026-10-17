/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/envanter.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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

window.LIFEOS = window.LIFEOS || {};

LIFEOS.ENVANTER = (function(){
  /* [metin, boyut, yön] — yön −1: ters puanlanır. */
  const MADDELER = Object.freeze([
    ['Bir ortamın neşesi olurum.', 'E', 1],
    ['Kendi duygularımdan çok başkalarının duygularını önemserim.', 'A', 1],
    ['İşlerimi hemen hallederim.', 'C', 1],
    ['Ruh hâlim sık sık değişir.', 'N', 1],
    ['Canlı bir hayal gücüm var.', 'O', 1],
    ['Çok konuşmam.', 'E', -1],
    ['Başkalarının sorunları beni pek ilgilendirmez.', 'A', -1],
    ['Eşyaları çoğu zaman yerine koymayı unuturum.', 'C', -1],
    ['Çoğu zaman rahatımdır.', 'N', -1],
    ['Soyut fikirler beni pek ilgilendirmez.', 'O', -1],
    ['Toplantılarda ve davetlerde birçok farklı insanla konuşurum.', 'E', 1],
    ['Başkalarının duygularını hissederim.', 'A', 1],
    ['Düzeni severim.', 'C', 1],
    ['Kolay üzülürüm.', 'N', 1],
    ['Soyut fikirleri anlamakta zorlanırım.', 'O', -1],
    ['Arka planda kalmayı tercih ederim.', 'E', -1],
    ['Başkalarıyla pek ilgilenmem.', 'A', -1],
    ['İşleri sık sık dağıtırım.', 'C', -1],
    ['Nadiren hüzünlenirim.', 'N', -1],
    ['Hayal gücüm pek güçlü değildir.', 'O', -1],
  ]);
  const CEVAPLAR = Object.freeze(['Hiç katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Tamamen katılıyorum']);
  const BOYUT = {
    E:{ ad:'Dışadönüklük', yuksek:'insanlarla olmaktan enerji alıyorsun', dusuk:'sakin ve kendi içine dönük ortamlarda daha rahatsın' },
    A:{ ad:'Uyumluluk', yuksek:'başkalarının duygularını önemseyen, anlayışlı birisin', dusuk:'doğrudan ve kendi yolunu izleyen birisin' },
    C:{ ad:'Sorumluluk', yuksek:'düzenli ve işini zamanında bitiren birisin', dusuk:'esnek ve kendiliğinden davranmayı seviyorsun' },
    D:{ ad:'Duygusal denge', yuksek:'çoğu zaman sakin ve dengelisin', dusuk:'duyguların yoğun ve hızlı değişebiliyor' },
    O:{ ad:'Deneyime açıklık', yuksek:'hayal gücü güçlü, fikirlere meraklı birisin', dusuk:'somut ve pratik olanı seviyorsun' },
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
