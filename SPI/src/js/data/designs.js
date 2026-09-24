/* DÜZENLER — 2026-09-24'ten beri TEK düzen (kullanıcı kararı, EKIP-PLANI
   §8-4: paletler ve beş düzen kalktı). Liste, düzeni ölçen araçlar
   (tools/designcheck.js, tasarimcheck.js) ve veri testleri için durur.

   Önce beş düzen vardı (defter, odak, kraft, katmanlı, harita) ve
   `:root[data-design]` altındaki CSS'le (designs.css) iskeleti
   değiştiriyordu. v4 tek iskelettir: brand/ortak/kabuk.css. */

window.SP = window.SP || {};

SP.DESIGNS = [
  { id:'defter', name:'Defter',
    note:'Tek tasarım (v4) — ton ve ince çizgi, renk modülü söyler',
    swatch:'lines' },
];

SP.DEFAULT_DESIGN = 'defter';

SP.DESIGN_BY_ID = SP.DESIGNS.reduce((m, d) => { m[d.id] = d; return m; }, {});
