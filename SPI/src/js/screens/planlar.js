/* Plan › Planlar — haftalık planlar (core/haftaplan.js).

   Kullanıcı (2026-10-17): «Plan kısmına plan ekle gibi türlü türlü şeyler
   koy: yemek planı …; SPİ'yi profesyonelleştir, minimalistlikten kaçma».

   Tek kutu, iOS gruplu liste: her plan bir satır — adı, bugüne düşen kısmı
   ve son yedi günün kayıttan sayılan uyumu (etiketiyle). Düzenleme sağdan
   açılan sayfada; kayıt «Geri al»ı bırakır. Kod hiçbir sayı önermez: su,
   uyku, süre ve «günde kaç kez» kullanıcının kendi tercihidir.

   Kullanıcı (2026-10-20): «küçük alışkanlıklar listesi daha güzel görünsün;
   sistemle uyumlu küçük ikonlar, daha geniş bir pencerede takip». Satırda
   bugünün maddeleri küçük karolardır (simge, ad, zaman, n / hedef); «Takip»
   geniş pencereyi açar: her madde için bugünkü sayaç ve son yedi gün. */

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
  /* Madde simgeleri — aynı çizgi dili (24'lük kutu, 1,8 kalınlık, yuvarlak uç). */
  const MADDE_SIMGE = {
    yildiz:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    su:SIMGE.su,
    yuruyus:SIMGE.hareket,
    kosu:'<circle cx="15" cy="4.5" r="1.8"/><path d="M6 20l4-5 3 1.5 1.5 3.5M9 12l2-4 4 1.5 2.5 3.5h3M11 8l-4 1-2 3"/>',
    esneme:'<circle cx="12" cy="4.5" r="1.8"/><path d="M4 9l8 2 8-2M12 11v4l-3 6M12 15l3 6"/>',
    kitap:'<path d="M4 5.5c3-1 5.5-1 8 1 2.5-2 5-2 8-1V19c-3-1-5.5-1-8 1-2.5-2-5-2-8-1z"/><path d="M12 6.5V20"/>',
    ilac:'<path d="M10.6 20.4a4.95 4.95 0 0 1-7-7l7-7a4.95 4.95 0 0 1 7 7z"/><path d="M7.1 9.9l7 7"/>',
    meyve:'<path d="M12 7c-4-2-8 1-7 6 1 4.5 4 7.5 7 6 3 1.5 6-1.5 7-6 1-5-3-8-7-6z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
    sebze:'<path d="M5 19c2-6 6-11 12-14-1 7-5 12-12 14z"/><path d="M5 19l7-7"/>',
    gunes:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    uyku:SIMGE.uyku,
    nefes:'<path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/>',
    dis:'<path d="M7 4c-3 0-4 3-3 6 .7 2 1 4 1.5 7 .3 2 2.5 2 3 0l1-4h5l1 4c.5 2 2.7 2 3 0 .5-3 .8-5 1.5-7 1-3 0-6-3-6-2 0-3 1-5 1S9 4 7 4z"/>',
    ekran:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M4 4l16 16"/>',
    kahve:'<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c0 1.5 1 1.5 1 3M12 3.5c0 1.5 1 1.5 1 3"/>',
  };
  const SIMGE_AD = { yildiz:'Yıldız', su:'Su', yuruyus:'Yürüyüş', kosu:'Koşu', esneme:'Esneme', kitap:'Kitap', ilac:'İlaç ya da takviye',
    meyve:'Meyve', sebze:'Sebze', gunes:'Güneş', uyku:'Uyku', nefes:'Nefes', dis:'Diş', ekran:'Ekransız', kahve:'Kahve' };
  const svg = p => raw('<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>');
  const simge = tur => raw('<span class="hp-satir__simge hp-satir__simge--' + tur + '" aria-hidden="true"><svg viewBox="0 0 24 24">' + SIMGE[tur] + '</svg></span>');
  const maddeSimgesi = m => MADDE_SIMGE[m.simge] || MADDE_SIMGE[bagSimgesi(m.bag)] || MADDE_SIMGE.yildiz;
  const bagSimgesi = b => ({ yuruyus:'yuruyus', kosu:'kosu', bisiklet:'kosu', yuzme:'su', hareket:'yuruyus', ogun:'meyve', kestirme:'uyku' })[b] || null;
  const etiket = e => e ? raw(' <span class="hp-etiket" data-kesinlik="' + e + '">' + e + '</span>') : '';

  /* ---------------------------------------------------------- liste */

  function sayacMetni(s){ return s.hedef > 1 || s.kaynak === 'kayit' ? s.n + ' / ' + s.hedef : ''; }

  /* Bugünün maddeleri: küçük karolar. Bağlı madde kayıttan sayılır,
     dokunulmaz (core/haftaplan.js söz 4). */
  function maddeKarolari(p, iso){
    const m = HP().bugunMaddeleri(p, iso);
    if(!m.length) return '';
    return html`<div class="hp-karolar" role="group" aria-label="${p.ad}: bugünün maddeleri">${map(m, x => {
      const s = HP().sayim(p, x, iso);
      const z = HP().zamanYaz(x.zaman);
      const ad = x.metin + (z ? ', ' + z : '') + (s.kaynak === 'kayit' ? ', kayıttan sayılır' : '');
      return html`<button type="button" class="${'hp-karo' + (s.tamam ? ' is-on' : s.n ? ' is-yari' : '') + (s.kaynak === 'kayit' ? ' is-bagli' : '')}"
        data-act="hp-isaret" data-id="${p.id}" data-madde="${x.id}" aria-pressed="${s.tamam ? 'true' : 'false'}"
        aria-label="${ad}: ${s.n} / ${s.hedef}" ${raw(s.kaynak === 'kayit' ? 'aria-disabled="true"' : '')}>
        <span class="hp-karo__simge">${svg(maddeSimgesi(x))}</span>
        <span class="hp-karo__ad">${x.metin}</span>
        ${when(z, () => html`<span class="hp-karo__zaman">${z}</span>`)}
        ${when(sayacMetni(s), () => html`<span class="hp-karo__sayi num">${sayacMetni(s)}</span>`)}
      </button>`;
    })}</div>`;
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
    const maddeli = tur === 'su' || tur === 'serbest';
    return html`<div class="hp-satir">
      ${simge(tur)}
      <div class="hp-satir__metin"><b>${p.ad || t.ad}</b><span>${b.metin}${etiket(b.etiket)}</span>
        <small>${u.metin}${etiket(u.etiket)}</small>
        ${when(maddeli, () => maddeKarolari(p, iso))}</div>
      <div class="hp-satir__dug">
        ${when(maddeli && (p.maddeler || []).length, () => K.Button({ label:'Takip', size:'sm', act:'hp-takip', data:{ 'data-id':p.id } }))}
        ${K.Button({ label:'Düzenle', size:'sm', tone:'ghost', act:'hp-ac', data:{ 'data-tur':tur, 'data-id':p.id } })}
      </div>
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

  /* ---------------------------------------------------------- takip penceresi

     Geniş pencere: her madde bir kart — büyük simge, ad, zaman, bugünkü
     sayaç (dokun = +1, «−» azaltır), son yedi günün noktaları. Bağlı madde
     «kayıttan» yazar ve dokunulmaz. Su planında üstte günün suyu. */
  function gecmisNoktalari(p, m){
    const l = HP().maddeGecmisi(p, m);
    return html`<span class="hp-takip__gecmis" aria-label="Son 7 gün">${map(l, g => html`<i class="${'hp-nokta hp-nokta--' + g.durum}"
      title="${SP.U.fmtShort(g.gun) + ': ' + ({ tamam:'tamam', eksik:'eksik (' + g.n + ')', yok:'kayıt yok', 'gun-degil':'bu gün yok' })[g.durum]}"></i>`)}</span>`;
  }
  function takipKarti(p, m, iso){
    const s = HP().sayim(p, m, iso);
    const z = HP().zamanYaz(m.zaman);
    const oran = Math.min(1, s.hedef ? s.n / s.hedef : 0);
    const bagli = s.kaynak === 'kayit';
    return html`<div class="${'hp-takip__kart' + (s.tamam ? ' is-on' : '')}">
      <span class="hp-takip__simge" style="${'--oran:' + Math.round(oran * 360) + 'deg'}">${svg(maddeSimgesi(m))}</span>
      <div class="hp-takip__metin"><b>${m.metin}</b>
        <small>${[z, s.hedef > 1 ? 'günde ' + s.hedef + ' kez' : 'günde bir kez',
          bagli ? 'kayıttan sayılır (' + HP().BAG_BY_ID[m.bag].ad.toLocaleLowerCase('tr') + ')' : ''].filter(Boolean).join(' · ')}</small>
        ${gecmisNoktalari(p, m)}</div>
      <div class="hp-takip__sayac">
        <span class="num"><b>${s.n}</b> / ${s.hedef}</span>
        ${when(!bagli, () => html`<span class="row gap-4">
          ${when(s.hedef > 1 && s.n > 0, () => K.Button({ label:'−', size:'sm', tone:'ghost', act:'hp-takip-isaret', data:{ 'data-id':p.id, 'data-madde':m.id, 'data-fark':'-1' }, aria:m.metin + ' bir azalt' }))}
          ${K.Button({ label:s.hedef > 1 ? '+1' : (s.tamam ? 'Geri al' : 'Yaptım'), size:'sm', tone:s.tamam ? 'ghost' : 'primary',
            act:'hp-takip-isaret', data:{ 'data-id':p.id, 'data-madde':m.id, 'data-fark':'1' } })}</span>`)}
      </div>
    </div>`;
  }
  function takipAc(id){
    const p = HP().bulId(id);
    if(!p) return;
    const iso = SP.U.todayISO();
    const bugunkuler = HP().bugunMaddeleri(p, iso);
    const digerleri = (p.maddeler || []).filter(m => bugunkuler.indexOf(m) < 0);
    const v = S.vitals && S.vitals[iso];
    const ml = v && v.water != null ? Number(v.water) : null;
    const su = p.tur === 'su' ? html`<div class="hp-takip__su">
      <span class="hp-takip__simge">${svg(MADDE_SIMGE.su)}</span>
      <div class="grow"><b>Su</b>
        <small>${ml == null ? 'bugün kayıt yok · veri yok' : ml.toLocaleString('tr-TR') + ' ml' + (p.suMl ? ' / ' + p.suMl.toLocaleString('tr-TR') + ' ml' : '') + ' · ölçüldü'}</small>
        ${when(p.suMl && ml != null, () => html`<span class="hp-takip__cubuk"><i style="${'width:' + Math.min(100, Math.round(100 * ml / p.suMl)) + '%'}"></i></span>`)}</div>
      ${K.Button({ label:'Bardak ekle', size:'sm', act:'go', data:{ 'data-route':'today' } })}
    </div>` : '';
    UI.sheet({ title:p.ad || HP().TUR_BY_ID[p.tur].ad, subtitle:'Bugün ve son yedi gün', wide:true,
      body:String(html`<div class="hp-takip" data-hp-takip="${p.id}">
        ${su}
        <div class="hp-takip__izgara">${map(bugunkuler, m => takipKarti(p, m, iso))}</div>
        ${when(!bugunkuler.length, () => html`<p class="small muted">Bugüne düşen madde yok.</p>`)}
        ${when(digerleri.length, () => html`<p class="tiny muted mt-12">Bugün olmayan: ${digerleri.map(m => m.metin).join(', ')}</p>`)}
        <p class="tiny muted mt-12">Noktalar dünden geriye yedi gün: dolu tamam, yarım eksik, boş kayıt yok. Kayda bağlı madde kendiliğinden sayılır.</p>
      </div>`),
      footer:String(html`${K.Button({ label:'Düzenle', tone:'ghost', act:'hp-ac', data:{ 'data-tur':p.tur, 'data-id':p.id } })}
        ${K.Button({ label:'Kapat', tone:'primary', act:'sheet-close' })}`) });
  }

  /* ---------------------------------------------------------- düzenleyici */

  function taslak(){ return S.ui.hpTaslak || null; }
  const alan = (ad, input) => K.Field({ label:ad, input });
  const metinAlan = (yol, deger, yer, aria) => K.Input({ value:deger || '', placeholder:yer, aria, data:{ 'data-hp':yol } });

  /* Zaman: dilim (sabah/öğle/akşam/gece) ya da saat; ikisi de isteğe bağlı. */
  function zamanAlani(yol, z, aria){
    const n = HP().zamanNorm(z) || {};
    return html`<span class="hp-zaman">
      ${K.Select({ value:n.dilim || '', aria:aria + ' dilimi', data:{ 'data-hp':yol + '.dilim' },
        options:[{ value:'', label:'Zaman yok' }].concat(HP().DILIMLER.map(d => ({ value:d.id, label:d.ad }))) })}
      ${K.Input({ type:'time', value:n.saat || '', aria:aria + ' saati', data:{ 'data-hp':yol + '.saat' } })}
    </span>`;
  }

  function gunSecici(gun){
    return K.Segmented({ items:HP().GUN_KISA.map((g, i) => ({ value:i, label:g })), value:gun, act:'hp-gun', aria:'Gün', block:true });
  }
  function govdeBeslenme(p, gun){
    const g = p.gunler[gun] || {};
    return html`${gunSecici(gun)}
      <div class="stack-sm mt-12">${map(HP().ogunler(p), ([k, ad]) => alan(ad, metinAlan('g.' + k, g[k], 'Yaz…', HP().GUN_AD[gun] + ' ' + ad)))}</div>
      <p class="mt-10">${K.Button({ label:'Bu günü bütün haftaya kopyala', size:'sm', tone:'ghost', act:'hp-kopyala' })}
        ${K.Button({ label:'Öğünlerimi düzenle', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'meals' } })}</p>
      <p class="tiny muted">Öğünlerin adı ve saati Öğün ekranındaki «Öğünlerim»den gelir.</p>`;
  }
  function govdeHareket(p, gun){
    const g = p.gunler[gun];
    return html`${gunSecici(gun)}
      <div class="row wrap gap-8 mt-12 hp-hareket">
        ${alan('Ne yapacaksın', metinAlan('g.ne', g && g.ne, 'Yürüyüş, koşu, salon…', HP().GUN_AD[gun] + ' hareket'))}
        ${alan('Dakika', K.Input({ type:'number', numeric:true, min:1, max:600, value:g ? g.dk : '', placeholder:'dk', aria:HP().GUN_AD[gun] + ' dakika', data:{ 'data-hp':'g.dk' } }))}
        ${alan('Ne zaman', zamanAlani('g.zaman', g && g.zaman, HP().GUN_AD[gun] + ' hareket'))}
      </div>
      <p class="mt-10">${K.Button({ label:'Bu günü bütün haftaya kopyala', size:'sm', tone:'ghost', act:'hp-kopyala' })}
        ${K.Button({ label:'Dinlenme günü yap', size:'sm', tone:'ghost', act:'hp-dinlen' })}</p>`;
  }
  function uykuBlok(yol, x, ad){
    x = x || {};
    const dk = HP().uykuDakika(x.yat, x.kalk);
    return html`<div class="stack-xs"><b class="small">${ad}</b>
      <div class="row wrap gap-8">
        ${alan('Yatış', K.Input({ type:'time', value:x.yat || '', aria:ad + ' yatış', data:{ 'data-hp':yol + '.yat' } }))}
        ${alan('Kalkış', K.Input({ type:'time', value:x.kalk || '', aria:ad + ' kalkış', data:{ 'data-hp':yol + '.kalk' } }))}
      </div>
      <p class="tiny muted">${dk == null ? 'Süre saatler girilince hesaplanır.' : 'Süre ' + HP().sureYaz(dk) + ' (hesaplandı)'}</p></div>`;
  }
  function govdeUyku(p){
    const kip = HP().uykuKip(p);
    const bloklar = kip === 'her' ? uykuBlok('her', p.her, 'Her gün')
      : kip === 'gun' ? html`<div class="hp-uyku-gunler">${map(HP().GUN_AD, (ad, i) => uykuBlok('gunluk.' + i, (p.gunluk || [])[i], ad))}</div>`
      : html`${uykuBlok('haftaici', p.haftaici, 'Hafta içi')}${uykuBlok('haftasonu', p.haftasonu, 'Hafta sonu (Cumartesi, Pazar)')}`;
    return html`<div class="stack">
      ${K.Segmented({ items:HP().UYKU_KIPLERI.map(k => ({ value:k.id, label:k.ad })), value:kip, act:'hp-uyku-kip', aria:'Uyku planı düzeni', block:true })}
      ${bloklar}
      <div><b class="small">Kısa uykular</b>
        <div class="stack-sm mt-6">${map(p.kestirmeler || [], (k, i) => html`<div class="hp-madde-satir">
          ${metinAlan('k.' + i + '.ad', k.ad, 'Öğle uykusu', 'Kısa uyku ' + (i + 1) + ' adı')}
          ${K.Input({ type:'time', value:k.bas || '', aria:'Kısa uyku ' + (i + 1) + ' saati', data:{ 'data-hp':'k.' + i + '.bas' } })}
          ${K.Input({ type:'number', numeric:true, min:1, max:240, value:k.dk == null ? '' : k.dk, placeholder:'dk', aria:'Kısa uyku ' + (i + 1) + ' süresi', data:{ 'data-hp':'k.' + i + '.dk' } })}
          ${gunCipleri('hp-k-gun', i, k.gunler)}
          ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'hp-k-sil', data:{ 'data-i':String(i) } })}
        </div>`)}</div>
        <p class="mt-6">${K.Button({ label:'Kısa uyku ekle', icon:'plus', size:'sm', tone:'ghost', act:'hp-k-ekle' })}</p>
        <p class="tiny muted">Gün seçmezsen kısa uyku her gün planlanır. Kaydı Bugün › Günün ölçümü › Kısa uyku’dan ya da «öğlen 30 dakika uyudum» yazarak girersin.</p></div>
    </div>`;
  }
  function gunCipleri(act, i, gunler){
    return html`<div class="hp-gunler" role="group" aria-label="Hangi günler">${map(HP().GUN_KISA, (g, j) => html`<button type="button"
      class="${'hp-gun' + ((gunler || []).indexOf(j) >= 0 ? ' is-on' : '')}" data-act="${act}" data-i="${i}" data-gun="${j}"
      aria-pressed="${(gunler || []).indexOf(j) >= 0 ? 'true' : 'false'}">${g}</button>`)}</div>`;
  }
  function simgeSecici(i, sec){
    return html`<div class="hp-simgeler" role="radiogroup" aria-label="${'Madde ' + (i + 1) + ' simgesi'}">${map(HP().SIMGELER, s => html`<button type="button"
      class="${'hp-simge-sec' + (s === (sec || 'yildiz') ? ' is-on' : '')}" role="radio" aria-checked="${s === (sec || 'yildiz') ? 'true' : 'false'}"
      data-act="hp-simge" data-i="${i}" data-simge="${s}" title="${SIMGE_AD[s]}" aria-label="${SIMGE_AD[s]}">${svg(MADDE_SIMGE[s])}</button>`)}</div>`;
  }
  function maddeListesi(p){
    return html`<div class="stack-sm">${map(p.maddeler, (m, i) => html`<div class="hp-madde-kart">
        <div class="hp-madde-satir">
          <span class="hp-karo__simge">${svg(maddeSimgesi(m))}</span>
          ${metinAlan('m.' + i, m.metin, 'Sabah esneme', 'Madde ' + (i + 1))}
          ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'hp-madde-sil', data:{ 'data-i':String(i) } })}
        </div>
        <div class="hp-madde-ayar">
          ${alan('Ne zaman', zamanAlani('m.' + i + '.zaman', m.zaman, 'Madde ' + (i + 1)))}
          ${alan('Günde kaç kez', K.Input({ type:'number', numeric:true, min:1, max:20, value:HP().hedefOf(m), aria:'Madde ' + (i + 1) + ' günde kaç kez', data:{ 'data-hp':'m.' + i + '.hedef' } }))}
          ${alan('Kayıttan say', K.Select({ value:m.bag || '', aria:'Madde ' + (i + 1) + ' kayıt bağı', data:{ 'data-hp':'m.' + i + '.bag' },
            options:[{ value:'', label:'Hayır, ben işaretlerim' }].concat(HP().BAGLAR.map(b => ({ value:b.id, label:b.ad }))) }))}
        </div>
        ${gunCipleri('hp-madde-gun', i, m.gunler)}
        <details class="hp-simge-ac"><summary class="tiny">Simge seç</summary>${simgeSecici(i, m.simge)}</details>
      </div>`)}
      <p>${K.Button({ label:'Madde ekle', icon:'plus', size:'sm', tone:'ghost', act:'hp-madde-ekle' })}</p>
      <p class="tiny muted">Gün seçmezsen madde her gün sorulur. «Kayıttan say» seçilirse madde SPİ’nin kendi kaydından sayılır:
        aynı gün iki yürüyüş girersen iki sayılır, işaretlemen gerekmez.</p></div>`;
  }
  function govdeSu(p){
    return html`<div class="stack">
      ${alan('Günlük su hedefin (ml)', K.Input({ type:'number', numeric:true, min:1, max:10000, step:50, value:p.suMl == null ? '' : p.suMl, placeholder:'Kendi hedefin', aria:'Günlük su hedefi', data:{ 'data-hp':'suMl' } }))}
      <div><b class="small">Küçük alışkanlıklar</b>${maddeListesi(p)}</div></div>`;
  }
  function govdeSerbest(p){
    return html`<div class="stack">
      ${alan('Planın adı', metinAlan('ad', p.ad, 'Sabah rutini', 'Planın adı'))}
      <div><b class="small">Maddeler</b>${maddeListesi(p)}</div></div>`;
  }

  function sayfa(){
    const t = taslak();
    if(!t) return;
    const p = t.plan, tur = HP().TUR_BY_ID[p.tur];
    const govde = { beslenme:() => govdeBeslenme(p, t.gun), hareket:() => govdeHareket(p, t.gun), uyku:() => govdeUyku(p),
      su:() => govdeSu(p), serbest:() => govdeSerbest(p) }[p.tur]();
    UI.sheet({ title:p.tur === 'serbest' ? (p.ad || 'Yeni plan') : tur.ad, subtitle:tur.not, wide:p.tur !== 'beslenme',
      body:String(html`<div data-hp-kok>${govde}${when(t.hata, () => html`<p class="small hp-hata" role="alert">${t.hata}</p>`)}</div>`),
      footer:String(html`${when(t.varMi, () => K.Button({ label:'Planı sil', tone:'ghost', act:'hp-sil' }))}
        ${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'hp-kaydet' })}`), noFocus:true });
  }

  /* Formdaki alanlar taslağa yazılır (gün değişirken ve kaydederken). */
  const sayiOku = v => v === '' ? null : Number(v.replace(',', '.'));
  function zamanYaz(hedef, alt, v){
    const z = Object.assign({}, hedef.zaman || {});
    z[alt] = v || null;
    hedef.zaman = HP().zamanNorm(z);
  }
  function formuOku(){
    const t = taslak(), kok = document.querySelector('[data-hp-kok]');
    if(!t || !kok) return;
    const p = t.plan;
    kok.querySelectorAll('[data-hp]').forEach(el => {
      const yol = el.getAttribute('data-hp'), v = String(el.value || '').trim();
      const parca = yol.split('.');
      if(parca[0] === 'g'){
        const k = parca[1];
        if(p.tur === 'beslenme'){ p.gunler[t.gun] = p.gunler[t.gun] || {}; p.gunler[t.gun][k] = v; }
        if(p.tur === 'hareket'){
          const g = p.gunler[t.gun] || { ne:'', dk:null, zaman:null };
          if(k === 'ne') g.ne = v;
          else if(k === 'dk') g.dk = sayiOku(v);
          else if(k === 'zaman') zamanYaz(g, parca[2], v);
          p.gunler[t.gun] = !g.ne && g.dk == null ? null : g;
        }
      }else if(parca[0] === 'm'){
        const m = p.maddeler[Number(parca[1])];
        if(!m) return;
        if(parca.length === 2) m.metin = v;
        else if(parca[2] === 'hedef') m.hedef = v === '' ? 1 : Math.round(Number(v));
        else if(parca[2] === 'bag') m.bag = v || null;
        else if(parca[2] === 'zaman') zamanYaz(m, parca[3], v);
      }else if(parca[0] === 'k'){
        const k = (p.kestirmeler || [])[Number(parca[1])];
        if(!k) return;
        if(parca[2] === 'dk') k.dk = sayiOku(v); else k[parca[2]] = v;
      }else if(parca[0] === 'gunluk'){
        p.gunluk = p.gunluk || HP().GUN_KISA.map(() => ({ yat:'', kalk:'' }));
        p.gunluk[Number(parca[1])] = Object.assign({}, p.gunluk[Number(parca[1])], { [parca[2]]:v });
      }
      else if(yol === 'suMl') p.suMl = sayiOku(v);
      else if(yol === 'ad') p.ad = v;
      else { p[parca[0]] = Object.assign({}, p[parca[0]], { [parca[1]]:v }); }
    });
  }

  const gunCevir = (l, g) => (l || []).indexOf(g) >= 0 ? l.filter(x => x !== g) : (l || []).concat([g]).sort();

  const handle = {
    'hp-ac'(el){
      const tur = el.dataset.tur, var_ = el.dataset.id ? HP().bulId(el.dataset.id) : (tur !== 'serbest' ? HP().bul(tur) : null);
      const plan = var_ ? HP().kopya(var_) : HP().yeni(tur, tur === 'serbest' ? '' : undefined);
      /* Eski uyku planında yeni alanlar yoktu. */
      if(plan.tur === 'uyku'){
        plan.her = plan.her || { yat:'', kalk:'' };
        plan.gunluk = plan.gunluk || HP().GUN_KISA.map(() => ({ yat:'', kalk:'' }));
        plan.kestirmeler = plan.kestirmeler || [];
      }
      S.ui.hpTaslak = { plan, gun:HP().gunNo(SP.U.todayISO()), varMi:!!var_, hata:null };
      sayfa();
    },
    'hp-takip'(el){ takipAc(el.dataset.id); },
    async 'hp-takip-isaret'(el){
      const p = HP().bulId(el.dataset.id);
      if(!p) return;
      const r = await HP().kaydet(HP().isaretle(HP().kopya(p), el.dataset.madde, SP.U.todayISO(), Number(el.dataset.fark) || 1));
      if(!r.ok) UI.toast(r.why);
      takipAc(el.dataset.id);
      SP.App.render();
    },
    'hp-gun'(el){ formuOku(); taslak().gun = Number(el.dataset.value); sayfa(); },
    'hp-uyku-kip'(el){ formuOku(); taslak().plan.kip = el.dataset.value; sayfa(); },
    'hp-kopyala'(){
      formuOku();
      const t = taslak(), g = t.plan.gunler[t.gun];
      t.plan.gunler = t.plan.gunler.map(() => g ? JSON.parse(JSON.stringify(g)) : (t.plan.tur === 'beslenme' ? {} : null));
      UI.toast('Bu gün bütün haftaya kopyalandı; kaydedince yazılır.');
      sayfa();
    },
    'hp-dinlen'(){ formuOku(); const t = taslak(); t.plan.gunler[t.gun] = null; sayfa(); },
    'hp-madde-ekle'(){ formuOku(); const p = taslak().plan; p.maddeler = (p.maddeler || []).concat([HP().yeniMadde('')]); sayfa(); },
    'hp-madde-sil'(el){ formuOku(); const p = taslak().plan; p.maddeler.splice(Number(el.dataset.i), 1); sayfa(); },
    'hp-madde-gun'(el){
      formuOku();
      const m = taslak().plan.maddeler[Number(el.dataset.i)];
      m.gunler = gunCevir(m.gunler, Number(el.dataset.gun));
      sayfa();
    },
    'hp-simge'(el){ formuOku(); const m = taslak().plan.maddeler[Number(el.dataset.i)]; m.simge = el.dataset.simge; sayfa(); },
    'hp-k-ekle'(){ formuOku(); const p = taslak().plan; p.kestirmeler = (p.kestirmeler || []).concat([HP().yeniKestirme()]); sayfa(); },
    'hp-k-sil'(el){ formuOku(); taslak().plan.kestirmeler.splice(Number(el.dataset.i), 1); sayfa(); },
    'hp-k-gun'(el){
      formuOku();
      const k = taslak().plan.kestirmeler[Number(el.dataset.i)];
      k.gunler = gunCevir(k.gunler, Number(el.dataset.gun));
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
      const m = (p.maddeler || []).find(x => x.id === el.dataset.madde);
      if(m && m.bag){ UI.toast('Bu madde kayıttan sayılır: ' + HP().BAG_BY_ID[m.bag].ad.toLocaleLowerCase('tr') + ' girince kendiliğinden artar.'); return; }
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
