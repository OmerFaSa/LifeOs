/* Komut paleti (Ctrl/Cmd+K) ve odak modu.
   Amac: gunluk kullanimda tikla-gezin yerine tek kisayolla is baslatmak. */
window.LIFEOS.PARCA.yazilar({
  'ays.core.palette.ders-notu':'Ders notu',
  'ays.core.palette.adsiz-ders':'Adsız ders',
  'ays.core.palette.bir-sey-sormam-gerek':'Bir şey sormam gerek',
  'ays.core.palette.uygulanamadi':'Uygulanamadı: ',
  'ays.core.palette.cozulen-soru':'Çözülen soru',
  'ays.core.palette.calisma-suresi':'Çalışma süresi',
  'ays.core.palette.sormam-gereken':'Sormam gereken: ',
  'ays.core.palette.kaydedilmeyecek':'Kaydedilmeyecek: «',
  'ays.core.palette.bos-soru-soylenmedigi-icin-d':'Boş soru söylenmediği için doğru = çözülen − yanlış sayıldı',
  'ays.core.palette.kaydet-deyince-yazilir-her-b':'Kaydet deyince yazılır; her biri geri alınabilir.',
  'ays.core.palette.bunu-mu-demek-istedin':'Bunu mu demek istedin?',
  'ays.core.palette.anlasilmayan-satir-atilmaz-s':'Anlaşılmayan satır atılmaz, söylenir.',
  'ays.core.palette.bu-satirlar-yorumlandi-kayde':'Bu satırlar yorumlandı, KAYDEDİLMEDİ. Onaylayınca yazılır ve ',
  'ays.core.palette.hepsini-onayla':'Hepsini onayla',
  'ays.core.palette.komut-paleti':'Komut paleti',
  'ays.core.palette.odak-modu-blok-calisiyorsa':'Odak modu (blok çalışıyorsa)',
  'ays.core.palette.tekrar-ekraninda-karti-cevir':'Tekrar ekranında kartı çevir',
  'ays.core.palette.hatirlamadim-zorlandim-hatir':'Hatırlamadım / Zorlandım / Hatırladım',
  'ays.core.palette.bu-listeyi-ac':'Bu listeyi aç',
  'ays.core.palette.acik-pencereyi-kapat':'Açık pencereyi kapat',
});

window.LIFEOS.PARCA.yazilar({
  'ays.core.palette.hafta':'Hafta ',
  'ays.core.palette.sec':'seç',
  'ays.core.palette.geri-alindi':'Geri alındı',
  'ays.core.palette.tahmin-etmiyorum-soruyorum':'Tahmin etmiyorum, soruyorum:',
  'ays.core.palette.cozemedigim-kisim':'Çözemediğim kısım:',
  'ays.core.palette.vazgec':'Vazgeç',
  'ays.core.palette.tamam':'Tamam',
  'ays.core.palette.icin-sonuc-yok':'” için sonuç yok.',
  'ays.core.palette.konu-deneme-yanlis-kart-ve':'Konu, deneme, yanlış, kart ve hafta içinde de aranır.',
  'ays.core.palette.klavye-kisayollari':'Klavye kısayolları',
  'ays.core.palette.kapat':'Kapat',
  'ays.core.palette.calisan-blok-yok':'Çalışan blok yok',
  'ays.core.palette.odak-modundan-cik':'Odak modundan çık',
  'ays.core.palette.blogu-bitir':'Bloğu bitir',
  'ays.core.palette.arkaplana-al':'Arkaplana al',
});


window.R = window.R || {};

window.LIFEOS.PARCA.komut({ modul:'ays', sira:440, group:'Sistem', label:'Kısayolları göster', icon:'guide', run(){ R.Palette.showShortcuts(); } });

R.Palette = (function(){
  const U = R.U, UI = R.UI, S = R.S;

  let active = 0;
  let items = [];

  /* ---------- komut listesi ---------- */
  /* Komutlar parcadir: her satir kendi ekran dosyasinda (P.komut). */
  function commands(){
    const list = window.LIFEOS.PARCA.komutlar('ays');
    /* Gizlenmis bolumun «Git» komutu gorunmez (core/bolum.js). */
    return R.Bolum ? list.filter(c => !(c.route && R.Bolum.gizli(c.route))) : list;
  }
  /* Turkce karakterleri normalize eder: "ogrenme" ile "öğrenme" eslesir. */
  const norm = R.U.norm;
  const { html, raw, when, cls, map } = R.h;
  const K = R.C;

  function score(cmd, q){
    if(!q) return cmd.weight || 1;
    const label = norm(cmd.group+' '+cmd.label+' '+(cmd.keywords || ''));
    const needle = norm(q);
    const base = cmd.weight || 1;
    if(label.indexOf(needle) === 0) return 100 + base;          // bastan tam eslesme
    const wordStart = label.indexOf(' '+needle);
    if(wordStart >= 0) return 60 + base;                        // kelime basi
    if(label.indexOf(needle) >= 0) return 40 + base;            // icinde gecer
    // harf sirasi eslesmesi (fuzzy) — yakinlik kadar puan
    let i = 0, gaps = 0;
    for(const ch of needle){
      const next = label.indexOf(ch, i);
      if(next === -1) return 0;
      gaps += next - i;
      i = next + 1;
    }
    return Math.max(1, 20 - Math.min(18, gaps/2)) + base;
  }

  /* Arama sonuclarinda eslesen bolumu vurgular */
  function markMatch(text, q){
    if(!q) return U.esc(text);
    const nText = norm(text), nQ = norm(q);
    const at = nText.indexOf(nQ);
    if(at < 0) return U.esc(text);
    return U.esc(text.slice(0, at))
      + '<mark class="cmdk__mark">'+U.esc(text.slice(at, at+q.length))+'</mark>'
      + U.esc(text.slice(at+q.length));
  }

  /* Sorgu bazli icerik aramasi: konular, denemeler, hatalar, kartlar, haftalar */
  function searchContent(q){
    if(!q || q.length < 2) return [];
    const S2 = R.S, M2 = R.Model;
    const out = [];
    const nQ = norm(q);
    const hit = txt => txt && norm(txt).indexOf(nQ) >= 0;

    R.SUBJECTS.forEach(s => {
      s.topics.forEach(t => {
        if(hit(t.name) || hit(s.name)){
          const st = M2.topicState(s.id, t.id);
          out.push({ group:'Konu', label:t.name, sub:s.name+' · '+R.TOPIC_STATES[st.state].label,
            icon:'book', weight:6,
            run(){ S2.ui.subjectOpen = s.id; R.App.go('subjects'); setTimeout(()=>{
              const el = document.querySelector('[data-topic="'+t.id+'"]');
              if(el){ el.scrollIntoView({block:'center'}); el.click(); }
            }, 120); } });
        }
      });
    });

    /* Öğren (core/ogren.js): konunun adı ya da anlatımın bölüm başlığı,
       formülü eşleşirse anlatım o konuda açılır; «Pisagor» tm-29’u bulur. */
    if(R.Ogren && R.KONU_ANLATIM){
      R.Ogren.konular().forEach(x => {
        const a = R.KONU_ANLATIM[x.topic.id];
        if(!a) return;
        const b = hit(x.topic.name) ? null : (a.bolumler || []).find(b => hit(b.baslik)
          || (b.formul || []).some(hit) || (b.liste || []).some(hit));
        if(!hit(x.topic.name) && !b) return;
        out.push({ group:'Anlatım', label:x.topic.name, sub:x.subject.name + (b ? ' · ' + b.baslik : ' · anlatım ve örnek sorular'),
          icon:'book', weight:hit(x.topic.name) ? 5 : 4,
          run(){ R.Ogren.sec(x.subject.id, x.topic.id).then(() => R.App.go('anlatim')); } });
      });
    }

    S2.exams.forEach(e => {
      if(hit(e.type) || hit(e.publisher) || hit(e.date)){
        out.push({ group:'Deneme', label:e.type+' · '+U.fmtShort(e.date),
          sub:(e.publisher||'')+' · net '+U.fmtNet(M2.examNet(e)), icon:'exam', weight:5,
          run(){ S2.ui.examOpen = e.id; R.App.go('exams'); } });
      }
    });

    S2.errors.forEach(e => {
      if(hit(e.rootCause) || hit(e.topic) || hit(e.principle)){
        out.push({ group:'Yanlış', label:(e.topic || e.testName || 'Yanlış')+' — '+(e.rootCause||''),
          sub:(e.tag || 'etiketsiz')+' · '+(e.closedAt ? 'kapandı' : 'açık'), icon:'edit', weight:4,
          run(){ S2.ui.cardTab = 'notebook'; R.App.go('cards'); } });
      }
    });

    S2.cards.forEach(c => {
      if(hit(c.front) || hit(c.topic)){
        out.push({ group:'Kart', label:c.front, sub:(c.topic||'')+' · '+U.fmtShort(c.dueAt),
          icon:'cards', weight:3,
          run(){ S2.ui.cardTab = 'all'; S2.ui.cardQuery = c.front.slice(0,24); R.App.go('cards'); } });
      }
    });

    S2.videoNotes.forEach(n => {
      const segHit = n.segments.find(seg => hit(seg.text));
      if(hit(n.title) || segHit){
        out.push({ group:yz('ays.core.palette.ders-notu'), label:n.title || yz('ays.core.palette.adsiz-ders'),
          sub:segHit ? M2.fmtTs(segHit.ts)+' · '+segHit.text.slice(0,60) : M2.noteTopicName(n),
          icon:'play', weight:5,
          run(){ S2.ui.noteOpen = n.id; R.App.go('learn'); } });
      }
    });

    for(let n = 1; n <= R.PLAN.totalWeeks; n++){
      const c = M2.curriculumFor(n);
      if(hit(c.title) || c.topics.some(hit)){
        out.push({ group:'Hafta', label:yz('ays.core.palette.hafta')+n+' — '+c.title, sub:c.topics.join(' · '),
          icon:'week', weight:2,
          run(){ R.S.ui.weekView = n; R.App.go('week'); } });
      }
    }

    Object.keys(R.HINTS).forEach(k => {
      const h = R.HINTS[k];
      if(hit(h.t) || hit(h.b)){
        out.push({ group:'Bilgi', label:h.t, sub:h.b, icon:'guide', weight:1,
          run(){ R.App.render(); setTimeout(()=>{
            const btn = document.querySelector('[data-hint="'+k+'"]');
            if(btn) btn.click(); else R.UI.toast(h.t+' — '+h.b);
          }, 80); } });
      }
    });

    return out.slice(0, 30);
  }

  /* ---------- render ---------- */
  function open(){
    close();
    const el = document.createElement('div');
    el.className = 'cmdk';
    el.id = 'cmdk';
    el.innerHTML = String(html`
      <div class="cmdk__box" role="dialog" aria-label="Komut paleti">
        <input class="cmdk__input" id="cmdk-input" placeholder="Ne yapmak istiyorsun?" autocomplete="off"/>
        <div class="cmdk__list" id="cmdk-list"></div>
        <div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> gez</span>
          <span><kbd>↵</kbd> ${yz('ays.core.palette.sec')}</span><span><kbd>esc</kbd> kapat</span></div>
      </div>`);
    el.addEventListener('mousedown', e => { if(e.target === el) close(); });
    document.getElementById('overlay-root').appendChild(el);

    const input = document.getElementById('cmdk-input');
    input.addEventListener('input', () => { active = 0; renderList(input.value); });
    input.addEventListener('keydown', onKey);
    renderList('');
    setTimeout(() => input.focus(), 20);
  }

  /* ---- konusarak veri girisi ---------------------------------------

     Cumlede VERI varsa once kural motoru cozer; model hic cagrilmaz.
     «matematikten 40 soru cozdum ve 20 paragraf yaptim» iki oneri
     uretir ve ikisi de ayri ayri onaylanir.

     Komut listesinin EN USTUNDE durur: Enter'a basan onu bekler. */
  let bekleyen = null;

  function veriKomutu(q){
    const t = String(q || '').trim();
    if(t.length < 4 || !R.Entry) return null;
    let r;
    try{
      /* Plan komutu («bu hafta ara», «günde 4 saat») ve veri girişi
         («40 soru çözdüm») birlikte çözülür — core/komut.js. */
      r = R.Komut ? R.Komut.anla(t, { date:R.U.todayISO() })
        : R.Entry.fromText(t, { date:R.U.todayISO() });
    }catch(e){ return null; }
    r.sorular = r.sorular || [];
    r.anlasilmayan = r.anlasilmayan || [];
    if(!r.oneriler.length && !r.sorular.length) return null;
    const adlar = r.oneriler.map(o => ETIKET[o.action]
      || (R.ACTION_BY_ID[o.action] || {}).title || o.action);
    /* Küçük ve TAMAMEN anlaşılmış istek sormadan uygulanır (AGENTS.md
       §1.9) — ölçüm yazan eylem hariç, onu otomatikMi() hiçbir ayarda
       geçirmez (KR-1); orta seviye, soru ya da anlaşılmayan parça varsa
       önizleme. */
    const hemen = r.oneriler.length && !r.sorular.length && !r.anlasilmayan.length
      && r.oneriler.every(o => R.Proposals.otomatikMi(
        { level:(R.ACTION_BY_ID[o.action] || {}).level, source:'istek', action:o.action },
        R.Proposals.ayar()));
    return {
      group:'Kayıt', icon:'zap',
      label:adlar.length ? adlar.join(' · ') : yz('ays.core.palette.bir-sey-sormam-gerek'),
      sub:r.sorular.length ? 'anlamadığım kısım var'
        : r.oneriler.length + ' kayıt' + (hemen ? ' · hemen uygulanır, geri alınabilir' : ' · önce önizleme'),
      hint:'Enter',
      run:() => hemen ? hemenUygula(r, t) : onizle(r, t),
    };
  }

  async function hemenUygula(r, metin){
    close();
    const islem = await R.Komut.isle(r, { metin });
    const ids = islem.yapilan.map(k => k.row.id);
    const dusen = islem.dusen.length;
    UI.toast(ids.length
      ? (ids.length === 1 ? islem.yapilan[0].baslik : ids.length + ' kayıt') + ' uygulandı'
        + (dusen ? ' · ' + dusen + ' tanesi uygulanamadı' : '')
      : yz('ays.core.palette.uygulanamadi') + (islem.dusen.map(k => k.why).filter(Boolean).join(' · ') || 'geçersiz'),
      ids.length ? { undo:async () => {
        for(const id of ids) await R.Proposals.undo(id);
        UI.toast(yz('ays.core.palette.geri-alindi'));
        R.App.render();
      } } : {});
    R.App.render();
  }

  const ETIKET = {
    'soru-yaz':yz('ays.core.palette.cozulen-soru'), 'paragraf-yaz':'Paragraf', 'problem-yaz':'Problem',
    'uyku-yaz':'Uyku', 'sure-yaz':yz('ays.core.palette.calisma-suresi'),
  };

  /* King'in veri önizlemesi (brand/ortak/king.js söz 3). Paletle AYNI
     ayrıştırıcı (core/komut.js) ve aynı onay yolu: King'e «matematikten 40
     soru çözdüm» yazmak (ya da söylemek) önizlenir, «Kaydet»le yazılır.
     Kullanıcı (2026-10-15): «veri girmeyi çok daha kolaylaştıralım». */
  function kingOnizle(q){
    const t = String(q || '').trim();
    if(t.length < 4 || !R.Komut) return null;
    let r;
    try{ r = R.Komut.anla(t, { date:R.U.todayISO() }); }catch(e){ return null; }
    r.sorular = r.sorular || [];
    r.anlasilmayan = r.anlasilmayan || [];
    if(!r.oneriler.length) return null;
    const satirlar = r.oneriler.map(o => {
      const ad = ETIKET[o.action] || (R.ACTION_BY_ID[o.action] || {}).title || o.action;
      let pv = null;
      try{ pv = R.Proposals.preview({ action:o.action, agent:'patron', params:o.params }); }catch(e){ pv = null; }
      const deg = pv && pv.ok ? (pv.rows || []).map(x => x.label + ' ' + x.before + ' → ' + x.after).join(', ')
        : pv && pv.why ? pv.why : '';
      return ad + (deg ? ': ' + deg : '');
    });
    const notlar = [];
    if(r.sorular.length) notlar.push(yz('ays.core.palette.sormam-gereken') + r.sorular.map(s => s.soru).join(' '));
    if(r.anlasilmayan.length) notlar.push(yz('ays.core.palette.kaydedilmeyecek') + r.anlasilmayan.join('», «') + '»');
    if(r.oneriler.some(o => o.bosVarsayim)) notlar.push(yz('ays.core.palette.bos-soru-soylenmedigi-icin-d'));
    /* tur: King'in sohbet karşılığı (king.js söz 8). */
    const tur = r.oneriler.every(o => o.action === 'uyku-yaz') ? 'uyku' : 'calisma';
    return {
      tur,
      metin:satirlar.join(' · '),
      ipucu:notlar.join(' · ') || yz('ays.core.palette.kaydet-deyince-yazilir-her-b'),
      async kaydet(){
        const islem = await R.Komut.isle(r, { metin:t });
        const onay = await R.Komut.onayla(islem.bekleyen.map(k => k.row.id));
        const n = islem.yapilan.length + onay.n;
        const dusen = islem.dusen.length + (islem.bekleyen.length - onay.n);
        if(R.App && R.App.render) R.App.render();
        /* Geri alma (giris.js söz 8): uygulanan öneriler sondan başa geri alınır. */
        const ids = islem.yapilan.concat(islem.bekleyen).map(k => k.row && k.row.id).filter(id =>
          id && (R.S.officeProposals || []).some(p => p.id === id && p.status === 'applied'));
        const geriAl = ids.length ? async () => { for(const id of ids.slice().reverse()) await R.Proposals.undo(id); if(R.App && R.App.render) R.App.render(); } : null;
        return { metin:dusen ? n + ' kayıt yazıldı, ' + dusen + ' tanesi yazılamadı.' : n === 1 ? 'Kaydedildi.' : n + ' kayıt yazıldı.', geriAl };
      },
    };
  }

  /* Onizleme: NE anlasildi ve ne degisecek. Kaydedilmeden once
     gorunur — onaysiz hicbir sey yazilmaz. */
  function onizle(r, metin){
    const K = R.C;
    const bloklar = r.oneriler.map(o => {
      const pv = R.Proposals.preview({ action:o.action, agent:'patron', params:o.params });
      const ad = ETIKET[o.action] || (R.ACTION_BY_ID[o.action] || {}).title || o.action;
      return html`
        <div class="qeblok">
          <div class="qeblok__bas"><b>${ad}</b>
            ${when(o.metin, () => html`<span class="tiny dim">«${o.metin}»</span>`)}</div>
          ${when(!pv.ok, () => html`<p class="small" style="color:var(--danger)">${pv.why}</p>`)}
          ${when(pv.ok, () => html`<div class="qeblok__satirlar">
            ${map(pv.rows || [], x => html`<div class="qeblok__satir">
              <span>${x.label}</span><span class="dim">${x.before}</span>
              <span aria-hidden="true">→</span><b>${x.after}</b></div>`)}
          </div>`)}
        </div>`;
    });

    const sorular = r.sorular || [];
    close();
    UI.sheet({
      title:!r.oneriler.length ? yz('ays.core.palette.bir-sey-sormam-gerek')
        : r.oneriler.length === 1 ? yz('ays.core.palette.bunu-mu-demek-istedin')
        : r.oneriler.length + ' kayıt anladım',
      subtitle:metin,
      body:String(html`
        <div class="qebloklar">${map(bloklar, b => b)}</div>
        ${map(sorular, s => K.Notice({ tone:'warn', title:yz('ays.core.palette.tahmin-etmiyorum-soruyorum'), body:s.soru }))}
        ${when(r.anlasilmayan.length, () => K.Notice({ tone:'warn',
          title:yz('ays.core.palette.cozemedigim-kisim'),
          body:'«' + r.anlasilmayan.join('», «') + '» — bu kısım kaydedilmeyecek. '
            + yz('ays.core.palette.anlasilmayan-satir-atilmaz-s') }))}
        ${when(r.oneriler.length, () => K.Notice({ tone:'info',
          body:yz('ays.core.palette.bu-satirlar-yorumlandi-kayde')
            + 'her biri tek tek geri alınabilir.' }))}`),
      footer:String(r.oneriler.length
        ? html`${K.Button({ label:yz('ays.core.palette.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:r.oneriler.length === 1 ? 'Onayla' : yz('ays.core.palette.hepsini-onayla'),
            tone:'primary', act:'veri-kaydet' })}`
        : K.Button({ label:yz('ays.core.palette.tamam'), act:'sheet-close' })),
    });
    bekleyen = Object.assign({}, r, { metin });
  }

  async function veriKaydet(){
    if(!bekleyen) return;
    const metinSon = bekleyen.metin || '';
    let yazilan = 0, dusen = 0;
    if(R.Komut){
      /* Onizlemeyi gorup onaylayan kullanicidir: kucuk olan zaten
         uygulanir, orta olan burada onaylanir. Yetki Patron'dadir,
         gerekceye SENIN cumlen yazilir. */
      const islem = await R.Komut.isle(bekleyen, { metin:metinSon });
      const onay = await R.Komut.onayla(islem.bekleyen.map(k => k.row.id));
      yazilan = islem.yapilan.length + onay.n;
      dusen = islem.dusen.length + (islem.bekleyen.length - onay.n);
    }else{
      for(const o of bekleyen.oneriler){
        const kayit = await R.Proposals.propose({ action:o.action, agent:'patron',
          params:o.params, reason:o.metin || metinSon, source:'istek' });
        if(!kayit){ dusen++; continue; }
        /* approve bayatlamis oneride {ok:false} doner; «yazildi» sayilmaz. */
        const res = await R.Proposals.approve(kayit.id);
        if(res && res.ok) yazilan++; else dusen++;
      }
    }
    bekleyen = null;
    UI.closeSheet();
    UI.toast(dusen ? yazilan + ' kayıt yazıldı, ' + dusen + ' tanesi yazılamadı'
      : yazilan + ' kayıt yazıldı');
    R.App.render();
  }

  function renderList(q){
    /* Komutlar ve icerik sonuclari ortak siralanir.
       Icerik sonuclari zaten gercek eslesmedir; bulanik komut eslesmesinin ustunde durur. */
    const scoredCommands = commands()
      .map(c => ({ c, s:score(c, q) }))
      .filter(x => x.s > 0);
    const scoredContent = searchContent(q)
      .map(c => ({ c, s:50 + (c.weight || 0) }));

    items = scoredCommands.concat(scoredContent)
      .sort((a,b) => b.s - a.s)
      .map(x => x.c)
      .slice(0, 40);
    /* Veri girisi HER ZAMAN en ustte: Enter'a basan onu bekler. */
    const veri = veriKomutu(q);
    if(veri) items = [veri].concat(items).slice(0, 40);
    /* «not: …» — Öğren'de seçili konunun notuna (core/konunotu.js). */
    const not = R.KonuNotu ? R.KonuNotu.paletKomutu(q) : null;
    if(not) items = [not].concat(items).slice(0, 40);
    active = Math.min(active, Math.max(0, items.length-1));

    const list = document.getElementById('cmdk-list');
    if(!items.length){
      list.innerHTML = String(html`<div class="cmdk__empty">“${q}${yz('ays.core.palette.icin-sonuc-yok')}<br/>
        <span class="tiny">${yz('ays.core.palette.konu-deneme-yanlis-kart-ve')}</span></div>`);
      return;
    }

    let lastGroup = null;
    list.innerHTML = String(map(items, (c, i) => {
      const head = c.group !== lastGroup ? html`<div class="cmdk__group">${c.group}</div>` : '';
      lastGroup = c.group;
      return html`${head}
        <button class="${cls('cmdk__item', i === active && 'is-active')}" data-cmd="${i}">
          ${raw(UI.icon(c.icon || 'right'))}
          <span class="cmdk__text"><span class="cmdk__label">${raw(markMatch(c.label, q))}</span>
            ${when(c.sub, () => html`<span class="cmdk__sub">${raw(markMatch(c.sub, q))}</span>`)}</span>
          ${when(c.hint, () => html`<span class="cmdk__hintrow">${c.hint}</span>`)}
        </button>`;
    }));

    list.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => { e.preventDefault(); pick(Number(btn.dataset.cmd)); });
      btn.addEventListener('mousemove', () => {
        const i = Number(btn.dataset.cmd);
        if(i !== active){ active = i; highlight(); }
      });
    });
  }

  function highlight(){
    const list = document.getElementById('cmdk-list');
    if(!list) return;
    list.querySelectorAll('[data-cmd]').forEach(b => {
      b.classList.toggle('is-active', Number(b.dataset.cmd) === active);
      if(Number(b.dataset.cmd) === active && b.scrollIntoView) b.scrollIntoView({ block:'nearest' });
    });
  }

  function onKey(e){
    if(e.key === 'ArrowDown'){ e.preventDefault(); active = Math.min(active+1, items.length-1); highlight(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); active = Math.max(active-1, 0); highlight(); }
    else if(e.key === 'Enter'){ e.preventDefault(); pick(active); }
    else if(e.key === 'Escape'){ e.preventDefault(); close(); }
  }

  function pick(i){
    const cmd = items[i];
    close();
    if(cmd) cmd.run();
  }

  function close(){
    const el = document.getElementById('cmdk');
    if(el) el.remove();
  }
  function isOpen(){ return !!document.getElementById('cmdk'); }

  const SHORTCUTS = [
    [['ctrl', 'k'], yz('ays.core.palette.komut-paleti')],
    [['f'], yz('ays.core.palette.odak-modu-blok-calisiyorsa')],
    [['space'], yz('ays.core.palette.tekrar-ekraninda-karti-cevir')],
    [['1', '2', '3'], yz('ays.core.palette.hatirlamadim-zorlandim-hatir')],
    [['?'], yz('ays.core.palette.bu-listeyi-ac')],
    [['esc'], yz('ays.core.palette.acik-pencereyi-kapat')],
  ];

  function showShortcuts(){
    UI.sheet({
      title:yz('ays.core.palette.klavye-kisayollari'),
      body:String(K.Table({ tight:true, headers:['Tuş', 'İşlev'],
        rows:SHORTCUTS.concat(window.LIFEOS && window.LIFEOS.KISAYOL ? window.LIFEOS.KISAYOL.satirlar() : [])
          .map(s => [map(s[0], k => html`<kbd>${k}</kbd> `), s[1]]) })),
      noFocus:true,
      footer:String(K.Button({ label:yz('ays.core.palette.kapat'), act:'sheet-close' })),
    });
  }

  /* ---------- odak modu ---------- */
  let focusTick = null;

  /* Bugün, sonra dün: gece yarısını geçen blok sürmeye devam eder. */
  function runningBlock(){
    for(const iso of [U.todayISO(), U.iso(U.addDays(U.parse(U.todayISO()), -1))]){
      const b = ((S.days[iso] || {}).blocks || []).find(x => x.startedAt);
      if(b) return b;
    }
    return null;
  }
  function elapsed(b){
    return b && b.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(b.startedAt).getTime())/1000)) : 0;
  }

  function openFocus(){
    const b = runningBlock();
    if(!b){ UI.toast(yz('ays.core.palette.calisan-blok-yok')); return; }
    closeFocus();
    const el = document.createElement('div');
    el.className = 'focusmode';
    el.id = 'focusmode';
    el.setAttribute('data-oz', '014');
    el.innerHTML = String(html`
      ${K.IconButton({ icon:'close', aria:yz('ays.core.palette.odak-modundan-cik'), act:'focus-close', class:'focusmode__esc' })}
      <div class="focusmode__slot">${b.slot}</div>
      <div class="focusmode__topic">${b.topic}</div>
      <div class="focusmode__clock" id="focus-clock">${U.fmtClock(elapsed(b))}</div>
      <div class="focusmode__ring" id="focus-ring"></div>
      <div class="focusmode__target" id="focus-target"></div>
      <div class="focusmode__actions">
        ${K.Button({ label:yz('ays.core.palette.blogu-bitir'), icon:'check', size:'lg', tone:'primary',
          act:'focus-finish', data:{ 'data-block':b.id } })}
        ${K.Button({ label:yz('ays.core.palette.arkaplana-al'), size:'lg', act:'focus-close' })}
      </div>`);
    document.getElementById('overlay-root').appendChild(el);
    paintFocus();
    focusTick = setInterval(paintFocus, 1000);
  }

  function paintFocus(){
    const b = runningBlock();
    const clock = document.getElementById('focus-clock');
    if(!b || !clock){ closeFocus(); return; }
    const secs = elapsed(b);
    clock.textContent = U.fmtClock(secs);
    const pct = b.targetMin ? Math.min(100, 100*(secs/60)/b.targetMin) : 0;
    const ring = document.getElementById('focus-ring');
    if(ring) ring.innerHTML = String(K.Bar({ value:pct, large:true, tone:'' }));
    const target = document.getElementById('focus-target');
    if(target){
      const left = Math.max(0, b.targetMin - Math.floor(secs/60));
      target.textContent = left > 0
        ? 'hedefe '+left+' dakika'+(b.targetQ ? ' · '+b.targetQ+' soru' : '')
        : 'hedef süre doldu — dilediğin kadar devam edebilirsin';
    }
  }

  function closeFocus(){
    if(focusTick){ clearInterval(focusTick); focusTick = null; }
    const el = document.getElementById('focusmode');
    if(el) el.remove();
  }
  function isFocusOpen(){ return !!document.getElementById('focusmode'); }

  return { open, close, isOpen, openFocus, closeFocus, isFocusOpen, showShortcuts, runningBlock, kingOnizle,
    veriKaydet, veriKomutu, commands, searchContent };
})();
