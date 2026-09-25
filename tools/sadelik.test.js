#!/usr/bin/env node
/* sadelik.js 022 KAYNAK KURALININ testi — «varsayilan etiketli onay».
 *
 * `confirmSheet(baslik, mesaj, fn, tehlikeli, onay)` besinci arguman
 * verilmezse dugme «Evet, devam et» yazar; kural bunu kaynakta sayar ve
 * 2026-09-25'ten beri KIRMIZI yapar. Sayac ust duzey virgulleri sayar;
 * bu test onu yanıltabilecek bicimleri tek tek dener: dize ve sablon
 * icindeki virgul, ic ice parantez, yorum, cok satirli cagri, tanimin
 * kendisi.
 *
 *   node tools/sadelik.test.js      (cikis 0 temiz, 1 kirmizi)
 */
'use strict';
const { onaySay } = require('./sadelik.js');

const DURUMLAR = [
  { ad:'üç argüman → sayılır', t:"UI.confirmSheet('Sil', 'Mesaj', () => x());", beklenen:[1] },
  { ad:'dört argüman (tehlikeli) → sayılır', t:"UI.confirmSheet('Sil', 'Mesaj', async () => { a(); }, true);", beklenen:[1] },
  { ad:'beş argüman → sayılmaz', t:"UI.confirmSheet('Sil', 'Mesaj', fn, true, '3 kaydı sil');", beklenen:[] },
  { ad:'dizedeki virgül argüman değildir', t:"UI.confirmSheet('a, b, c', 'd, e', fn);", beklenen:[1] },
  { ad:'şablondaki virgül argüman değildir', t:'UI.confirmSheet(`a, ${b}, c`, "d", fn);', beklenen:[1] },
  { ad:'iç içe çağrıdaki virgül argüman değildir',
    t:"UI.confirmSheet(f(a, b, c), g([1, 2], {x:1, y:2}), fn);", beklenen:[1] },
  { ad:'yorumdaki virgül argüman değildir',
    t:"UI.confirmSheet('a', /* b, c, d */ 'e', fn); // , , ,", beklenen:[1] },
  { ad:'hesaplanan etiket (üçlü) beşinci argümandır',
    t:"UI.confirmSheet('a', 'b', fn, true, n ? n + ' kaydı sil' : 'Sil');", beklenen:[] },
  { ad:'çok satırlı çağrıda satır, çağrının başladığı satırdır',
    t:"x();\n\nUI.confirmSheet('a',\n  'b',\n  () => {\n    y(1, 2);\n  });", beklenen:[3] },
  { ad:'tanımın kendisi sayılmaz', t:'function confirmSheet(title, message, onConfirm){}', beklenen:[] },
  { ad:'iki çağrıdan yalnız eksik olan sayılır',
    t:"UI.confirmSheet('a', 'b', fn, false, 'Profile geç');\nUI.confirmSheet('c', 'd', fn);", beklenen:[2] },
];

let kirmizi = 0;
DURUMLAR.forEach(d => {
  const bulunan = onaySay(d.t);
  const tamam = JSON.stringify(bulunan) === JSON.stringify(d.beklenen);
  if(!tamam) kirmizi++;
  console.log((tamam ? '  ✓ ' : '  ✕ ') + d.ad + (tamam ? '' : ' — beklenen ' + JSON.stringify(d.beklenen)
    + ', bulunan ' + JSON.stringify(bulunan)));
});
console.log(kirmizi ? '\n' + kirmizi + ' durum yanlış sayıldı.' : '\n022 sayacı ' + DURUMLAR.length + ' durumda doğru.');
process.exit(kirmizi ? 1 : 0);
