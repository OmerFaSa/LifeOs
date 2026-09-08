/* Sablon katmani.

   html`` etiketli sablonu: araya giren her deger varsayilan olarak KAÇIRILIR.
   Yapisal HTML raw() ile isaretlenir; ic ice html`` cagrilari zaten raw doner.

     h.html`<p>${kullaniciMetni}</p>`            → kacirilir
     h.html`<div>${h.raw(baskaHtml)}</div>`      → oldugu gibi
     h.html`${liste.map(x => h.html`<li>${x}</li>`)}`  → dizi otomatik birlesir

   Kural: kullanici verisi ve metin daima kaçırılır, yapısal HTML raw. */

window.R = window.R || {};

R.h = (function(){
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function Raw(s){ this.s = s; }
  Raw.prototype.toString = function(){ return this.s; };

  function raw(s){ return s instanceof Raw ? s : new Raw(s == null ? '' : String(s)); }
  function isRaw(v){ return v instanceof Raw; }

  /* Bir degeri HTML metnine cevirir. */
  function val(v){
    if(v == null || v === false || v === true) return '';
    if(v instanceof Raw) return v.s;
    if(Array.isArray(v)) return v.map(val).join('');
    if(typeof v === 'number') return String(v);
    return esc(v);
  }

  function html(strings, ...vals){
    let out = strings[0];
    for(let i = 0; i < vals.length; i++) out += val(vals[i]) + strings[i+1];
    return new Raw(out);
  }

  /* Kosullu parca: yanlissa hicbir sey uretmez. */
  function when(cond, node){
    if(!cond) return raw('');
    return raw(val(typeof node === 'function' ? node() : node));
  }

  /* Sinif adlarini birlestirir: cls('card', aktif && 'is-active') */
  function cls(){
    return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
  }

  /* Nitelik sozlugu: attrs({ 'data-act':'go', disabled:true, title:null }) */
  function attrs(map){
    const out = [];
    Object.keys(map || {}).forEach(k => {
      const v = map[k];
      if(v == null || v === false) return;
      if(v === true) out.push(k);
      else out.push(k + '="' + esc(v) + '"');
    });
    return raw(out.join(' '));
  }

  /* Liste: map(dizi, fn) — bos dizide bos doner */
  function map(list, fn){
    return raw((list || []).map((item, i) => val(fn(item, i))).join(''));
  }

  return { html, raw, isRaw, val, when, cls, attrs, map, esc };
})();
