/* Plan › Planlar — haftalık planlar (core/haftaplan.js).

   Kullanıcı (2026-10-17): «Plan kısmına plan ekle gibi türlü türlü şeyler
   koy: yemek planı …; SPİ'yi profesyonelleştir, minimalistlikten kaçma».

   Tek kutu, iOS gruplu liste: her plan bir satır — adı, bugüne düşen kısmı
   ve son yedi günün kayıttan sayılan uyumu (etiketiyle). Alışkanlık ve
   kendi planının bugünkü maddeleri satırda tek dokunuşla işaretlenir.
   Düzenleme sağdan açılan sayfada; kayıt «Geri al»ı bırakır. Kod hiçbir
   sayı önermez: su, uyku ve süre kullanıcının kendi tercihidir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.planlar = (function(){
  const S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C;
  const HP = () => SP.HaftaPlan;

  const SIMGE = {
    beslenme:'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 2-2 6 0 8v10"/>',
    hareket:'<circle cx="13" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2v4M10.5 15l1-5 4 2 2 3M11.5 10l-3 2-2-1"/>',
    uyku:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    su:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    serbest:'<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6l1 1 1.5-2M4 12l1 1 1.5-2M4 18l1 1 1.5-2"/>',
  };
  const simge = tur => raw('<span class="hp-satir__simge hp-satir__simge--' + tur + '" aria-hidden="true"><svg viewBox="0 0 24 24">' + SIMGE[tur] + '</svg></span>');
  const etiket = e => e ? raw(' <span class="hp-etiket" data-kesinlik="' + e + '">' + e + '</span>') : '';

  /* ---------------------------------------------------------- liste */

  function maddeCipleri(p, iso){
    const m = HP().bugunMaddeleri(p, iso);
    if(!m.length) return '';
    const isa = HP().isaretli(p, iso);
    return html`<div class="hp-maddeler" role="group" aria-label="${p.ad}: bugünün maddeleri">${map(m, x => html`<button type="button"
      class="${'hp-madde' + (isa.indexOf(x.id) >= 0 ? ' is-on' : '')}" data-act="hp-isaret" data-id="${p.id}" data-madde="${x.id}"
      aria-pressed="${isa.indexOf(x.id) >= 0 ? 'true' : 'false'}">${x.metin}</button>`)}</div>`;
  }
  function satir(tur, p){
    const t = HP().TUR_BY_ID[tur];
    const iso = SP.U.todayISO();
    if(!p) return html`<div class="hp-satir hp-satir--bos">
      ${simge(tur)}
      <div class="hp-satir__metin"><b>${t.ad}</b><span>${t.not}</span></div>
      ${K.Button({ label:'Kur', size:'sm', act:'hp-ac', data:{ 'data-tur':tur } })}
    </div>`;
    const b = HP().bugun(p, iso), u = HP().uyum(p, iso);
    return html`<div class="hp-satir">
      ${simge(tur)}
      <div class="hp-satir__metin"><b>${p.ad || t.ad}</b><span>${b.metin}${etiket(b.etiket)}</span>
        <small>${u.metin}${etiket(u.etiket)}</small>
        ${when(tur === 'su' || tur === 'serbest', () => maddeCipleri(p, iso))}</div>
      ${K.Button({ label:'Düzenle', size:'sm', tone:'ghost', act:'hp-ac', data:{ 'data-tur':tur, 'data-id':p.id } })}
    </div>`;
  }

  function render(){
    if(!HP()) return String(K.Kutu({ ad:'Planlar', govde:raw('<p class="small muted">Plan modülü yüklenemedi.</p>') }));
    const yerlesik = HP().TURLER.filter(t => t.tek).map(t => satir(t.id, HP().bul(t.id)));
    const serbest = HP().liste().filter(p => p.tur === 'serbest').map(p => satir('serbest', p));
    return String(K.Kutu({ ad:'Planların',
      govde:html`<div class="hp-liste" data-raf-tam>${yerlesik}${serbest}</div>`,
      ayak:K.Button({ label:'Plan ekle', icon:'plus', size:'sm', tone:'ghost', act:'hp-ac', data:{ 'data-tur':'serbest' } }) }));
  }

  /* ---------------------------------------------------------- düzenleyici */

  function taslak(){ return S.ui.hpTaslak || null; }
  const alan = (ad, input) => K.Field({ label:ad, input });
  const metinAlan = (yol, deger, yer, aria) => K.Input({ value:deger || '', placeholder:yer, aria, data:{ 'data-hp':yol } });

  function gunSecici(gun){
    return K.Segmented({ items:HP().GUN_KISA.map((g, i) => ({ value:i, label:g })), value:gun, act:'hp-gun', aria:'Gün', block:true });
  }
  function govdeBeslenme(p, gun){
    const g = p.gunler[gun];
    return html`${gunSecici(gun)}
      <div class="stack-sm mt-12">${map(HP().OGUNLER, ([k, ad]) => alan(ad, metinAlan('g.' + k, g[k], ad === 'Ara öğün' ? 'Ceviz, yoğurt' : 'Yaz…', HP().GUN_AD[gun] + ' ' + ad)))}</div>
      <p class="mt-10">${K.Button({ label:'Bu günü bütün haftaya kopyala', size:'sm', tone:'ghost', act:'hp-kopyala' })}</p>`;
  }
  function govdeHareket(p, gun){
    const g = p.gunler[gun];
    return html`${gunSecici(gun)}
      <div class="row wrap gap-8 mt-12 hp-hareket">
        ${alan('Ne yapacaksın', metinAlan('g.ne', g && g.ne, 'Yürüyüş, koşu, salon…', HP().GUN_AD[gun] + ' hareket'))}
        ${alan('Dakika', K.Input({ type:'number', numeric:true, min:1, max:600, value:g ? g.dk : '', placeholder:'dk', aria:HP().GUN_AD[gun] + ' dakika', data:{ 'data-hp':'g.dk' } }))}
      </div>
      <p class="mt-10">${K.Button({ label:'Dinlenme günü yap', size:'sm', tone:'ghost', act:'hp-dinlen' })}</p>`;
  }
  function govdeUyku(p){
    const blok = (k, ad) => {
      const x = p[k] || {};
      const dk = HP().uykuDakika(x.yat, x.kalk);
      return html`<div class="stack-xs"><b class="small">${ad}</b>
        <div class="row wrap gap-8">
          ${alan('Yatış', K.Input({ type:'time', value:x.yat || '', aria:ad + ' yatış', data:{ 'data-hp':k + '.yat' } }))}
          ${alan('Kalkış', K.Input({ type:'time', value:x.kalk || '', aria:ad + ' kalkış', data:{ 'data-hp':k + '.kalk' } }))}
        </div>
        <p class="tiny muted">${dk == null ? 'Süre saatler girilince hesaplanır.' : 'Süre ' + HP().sureYaz(dk) + ' (hesaplandı)'}</p></div>`;
    };
    return html`<div class="stack">${blok('haftaici', 'Hafta içi')}${blok('haftasonu', 'Hafta sonu (Cumartesi, Pazar)')}</div>`;
  }
  function maddeListesi(p, gunlu){
    return html`<div class="stack-sm">${map(p.maddeler, (m, i) => html`<div class="hp-madde-satir">
        ${metinAlan('m.' + i, m.metin, 'Sabah esneme', 'Madde ' + (i + 1))}
        ${when(gunlu, () => html`<div class="hp-gunler" role="group" aria-label="Hangi günler">${map(HP().GUN_KISA, (g, j) => html`<button type="button"
          class="${'hp-gun' + ((m.gunler || []).indexOf(j) >= 0 ? ' is-on' : '')}" data-act="hp-madde-gun" data-i="${i}" data-gun="${j}"
          aria-pressed="${(m.gunler || []).indexOf(j) >= 0 ? 'true' : 'false'}">${g}</button>`)}</div>`)}
        ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'hp-madde-sil', data:{ 'data-i':String(i) } })}
      </div>`)}
      <p>${K.Button({ label:'Madde ekle', icon:'plus', size:'sm', tone:'ghost', act:'hp-madde-ekle' })}</p>
      ${when(gunlu, () => html`<p class="tiny muted">Gün seçmezsen madde her gün sorulur.</p>`)}</div>`;
  }
  function govdeSu(p){
    return html`<div class="stack">
      ${alan('Günlük su hedefin (ml)', K.Input({ type:'number', numeric:true, min:1, max:10000, step:50, value:p.suMl == null ? '' : p.suMl, placeholder:'Kendi hedefin', aria:'Günlük su hedefi', data:{ 'data-hp':'suMl' } }))}
      <div><b class="small">Küçük alışkanlıklar</b>${maddeListesi(p, false)}</div></div>`;
  }
  function govdeSerbest(p){
    return html`<div class="stack">
      ${alan('Planın adı', metinAlan('ad', p.ad, 'Sabah rutini', 'Planın adı'))}
      <div><b class="small">Maddeler</b>${maddeListesi(p, true)}</div></div>`;
  }

  function sayfa(){
    const t = taslak();
    if(!t) return;
    const p = t.plan, tur = HP().TUR_BY_ID[p.tur];
    const govde = { beslenme:() => govdeBeslenme(p, t.gun), hareket:() => govdeHareket(p, t.gun), uyku:() => govdeUyku(p),
      su:() => govdeSu(p), serbest:() => govdeSerbest(p) }[p.tur]();
    UI.sheet({ title:p.tur === 'serbest' ? (p.ad || 'Yeni plan') : tur.ad, subtitle:tur.not,
      body:String(html`<div data-hp-kok>${govde}${when(t.hata, () => html`<p class="small hp-hata" role="alert">${t.hata}</p>`)}</div>`),
      footer:String(html`${when(t.varMi, () => K.Button({ label:'Planı sil', tone:'ghost', act:'hp-sil' }))}
        ${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'hp-kaydet' })}`), noFocus:true });
  }

  /* Formdaki alanlar taslağa yazılır (gün değişirken ve kaydederken). */
  function formuOku(){
    const t = taslak(), kok = document.querySelector('[data-hp-kok]');
    if(!t || !kok) return;
    const p = t.plan;
    kok.querySelectorAll('[data-hp]').forEach(el => {
      const yol = el.getAttribute('data-hp'), v = String(el.value || '').trim();
      if(yol.indexOf('g.') === 0){
        const k = yol.slice(2);
        if(p.tur === 'beslenme') p.gunler[t.gun][k] = v;
        if(p.tur === 'hareket'){
          const g = p.gunler[t.gun] || { ne:'', dk:null };
          if(k === 'ne') g.ne = v; else g.dk = v === '' ? null : Number(v.replace(',', '.'));
          p.gunler[t.gun] = !g.ne && g.dk == null ? null : g;
        }
      }else if(yol.indexOf('m.') === 0) p.maddeler[Number(yol.slice(2))].metin = v;
      else if(yol === 'suMl') p.suMl = v === '' ? null : Number(v.replace(',', '.'));
      else if(yol === 'ad') p.ad = v;
      else { const [a, b] = yol.split('.'); p[a] = Object.assign({}, p[a], { [b]:v }); }
    });
  }
  function yenidenCiz(){ formuOku(); sayfa(); }

  const handle = {
    'hp-ac'(el){
      const tur = el.dataset.tur, var_ = el.dataset.id ? HP().bulId(el.dataset.id) : (tur !== 'serbest' ? HP().bul(tur) : null);
      S.ui.hpTaslak = { plan:var_ ? HP().kopya(var_) : HP().yeni(tur, tur === 'serbest' ? '' : undefined),
        gun:HP().gunNo(SP.U.todayISO()), varMi:!!var_, hata:null };
      sayfa();
    },
    'hp-gun'(el){ formuOku(); taslak().gun = Number(el.dataset.value); sayfa(); },
    'hp-kopyala'(){
      formuOku();
      const t = taslak(), g = t.plan.gunler[t.gun];
      t.plan.gunler = t.plan.gunler.map(() => g ? Object.assign({}, g) : null);
      UI.toast('Bu gün bütün haftaya kopyalandı; kaydedince yazılır.');
      sayfa();
    },
    'hp-dinlen'(){ formuOku(); const t = taslak(); t.plan.gunler[t.gun] = null; sayfa(); },
    'hp-madde-ekle'(){ formuOku(); const p = taslak().plan; p.maddeler = (p.maddeler || []).concat([{ id:'m' + Date.now().toString(36), metin:'', gunler:[] }]); sayfa(); },
    'hp-madde-sil'(el){ formuOku(); const p = taslak().plan; p.maddeler.splice(Number(el.dataset.i), 1); sayfa(); },
    'hp-madde-gun'(el){
      formuOku();
      const m = taslak().plan.maddeler[Number(el.dataset.i)], g = Number(el.dataset.gun);
      m.gunler = (m.gunler || []).indexOf(g) >= 0 ? m.gunler.filter(x => x !== g) : (m.gunler || []).concat([g]).sort();
      sayfa();
    },
    async 'hp-kaydet'(){
      formuOku();
      const t = taslak();
      const r = await HP().kaydet(t.plan);
      if(!r.ok){ t.hata = r.why; sayfa(); return; }
      S.ui.hpTaslak = null;
      UI.closeSheet();
      UI.toast((r.plan.ad || 'Plan') + ' kaydedildi', { undo:async () => { await HP().geriAl(r); UI.toast('Geri alındı'); SP.App.render(); } });
      SP.App.render();
    },
    async 'hp-sil'(el){
      const t = taslak();
      if(!t || !t.varMi) return;
      if(el.dataset.onay !== '1'){ el.dataset.onay = '1'; el.textContent = 'Emin misin? Sil'; return; }
      const eski = await HP().sil(t.plan.id);
      S.ui.hpTaslak = null;
      UI.closeSheet();
      UI.toast((eski && eski.ad || 'Plan') + ' silindi', { undo:async () => { await HP().kaydet(eski); SP.App.render(); } });
      SP.App.render();
    },
    async 'hp-isaret'(el){
      const p = HP().bulId(el.dataset.id);
      if(!p) return;
      const r = await HP().kaydet(HP().isaretle(HP().kopya(p), el.dataset.madde, SP.U.todayISO()));
      if(!r.ok) UI.toast(r.why);
      SP.App.render();
    },
  };

  return {
    id:'planlar',
    title:'Planlar',
    subtitle(){ const n = HP() ? HP().liste().length : 0; return n ? n + ' plan' : 'henüz plan yok'; },
    lede(){ return ''; },
    actions(){ return ''; },
    render, handle, _formuOku:formuOku,
  };
})();
