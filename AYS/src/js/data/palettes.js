/* Seçilebilir renk paletleri. tokens.css tabanı (indigo) tanımlar,
   palettes.css diğerlerini yeniden yazar. */

window.R = window.R || {};

R.PALETTES = [
  /* SPI ile ayni yedi palet. Kagit varsayilandir: sicak kagit zemini,
     derin yesil vurgu — iki uygulama yan yana acildiginda ayni
     sistemden geldikleri once bu renkten anlasilir. */
  { id:'kagit',   name:'Kâğıt',   note:'Varsayılan — sıcak kâğıt, derin yeşil', swatch:['#1F4E3D', '#E4EBE7'] },
  { id:'indigo',  name:'İndigo',  note:'Soğuk mor-mavi, nötr',             swatch:['#3D3F8F', '#E5E7F5'] },
  { id:'grafit',  name:'Grafit',  note:'En düşük renk yükü, uzun oturum',   swatch:['#3D4E5C', '#E4E8EC'] },
  { id:'okyanus', name:'Okyanus', note:'Soğuk mavi, odak hissi',            swatch:['#1F5D80', '#DFEAF3'] },
  { id:'mor',     name:'Mor',     note:'Yumuşak kontrast, göz yormaz',      swatch:['#54408F', '#E8E4F3'] },
  { id:'bordo',   name:'Bordo',   note:'Sıcak ve yüksek karakter',          swatch:['#7D2E3E', '#F3E4E7'] },
  { id:'orman',   name:'Orman',   note:'1.0 sürümünün yeşili',              swatch:['#2F6B4F', '#E4EDE8'] },
];

R.DEFAULT_PALETTE = 'kagit';
