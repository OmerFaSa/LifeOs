/* ÖĞREN çekmecesi — Konular · Anlatım · Sorular · Koç (Ders notları
   screens/learn.js'te, aynı çekmecede).

   Kullanıcı (2026-10-09): «konu öğrenmek başlığı altında sol tarafa bölüm
   aç; ders notları, örnek sorular, daha detaylı anlatım olsun, koçla da
   orada iletişim olsun; daha anlaşılır bir ekran olsun».

   Dört bölüm aynı konuya bakar (core/ogren.js söz 2); üstteki konu çubuğu
   konuyu değiştirir, ‹ › bir önceki ya da sonraki konuya geçer. Her
   bölümün tek işi var: Konular seçtirir, Anlatım okutur, Sorular
   çözdürür, Koç anlatır. Ölçüm ve kapanış Çalışma › Konu çalış'tadır;
   burada yalnız okunur.

   Yazım biçimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};

(function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const K = R.C;
  const O = () => R.Ogren;

  /* ---------- ortak ---------- */

  /* Metindeki küçük işaretler: **kalın**, x^{2} üst simge, H_{2}O alt
     simge. Önce kaçırılır, sonra yalnız bu üç işaret açılır. */
  function fmt(s){
    const t = U.esc(String(s == null ? '' : s))
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>')
      .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>');
    return raw(t);
  }
  const dizi = x => x == null ? [] : Array.isArray(x) ? x : [x];
  const kisaAd = s => s.name;

  /* Konu çubuğu: ‹ ders · konu › — dört bölümde aynı. Uçta ok yerine boşluk. */
  function konuCubugu(x){
    const { subject, topic } = x;
    const once = O().komsu(subject.id, topic.id, -1), sonra = O().komsu(subject.id, topic.id, 1);
    const ok = (k, yon, ad) => k
      ? K.IconButton({ icon:yon < 0 ? 'left' : 'right', plain:true, act:'ogren-komsu', data:{ 'data-yon':String(yon) },
          aria:ad + ': ' + k.topic.name, title:ad + ': ' + k.topic.name })
      : html`<span class="ogr-cubuk__bos" aria-hidden="true"></span>`;
    return html`<div class="ogr-cubuk" role="group" aria-label="Konu seçimi">
      ${ok(once, -1, 'Önceki konu')}
      <span class="ogr-cubuk__secim">
        ${K.Select({ id:'ogren-ders', options:R.SUBJECTS.map(s => ({ value:s.id, label:kisaAd(s) })),
          value:subject.id, change:'ogren-ders', aria:'Ders' })}
        ${K.Select({ id:'ogren-konu', options:subject.topics.map(t => ({ value:t.id, label:t.order + '. ' + t.name })),
          value:topic.id, change:'ogren-konu', aria:'Konu' })}
      </span>
      ${ok(sonra, 1, 'Sonraki konu')}
    </div>`;
  }

  /* Seçili konuyu bölüm açılırken kesinleştirir (son açılan yazılır). */
  async function hazirla(){
    const x = O().secili();
    if(x.topic) await O().sec(x.subject.id, x.topic.id);
    return x;
  }

  const ortakChange = {
    async 'ogren-ders'(el){
      const s = R.SUBJECTS.find(x => x.id === el.value);
      if(!s) return;
      const st = O().sonAcilan();
      const t = st && st.subject.id === s.id ? st.topic : s.topics[0];
      await O().sec(s.id, t.id);
      R.App.render();
    },
    async 'ogren-konu'(el){
      await O().sec(S.ui.ogrenDers, el.value);
      R.App.render();
    },
  };
  const ortakHandle = {
    async 'ogren-komsu'(el){
      const x = O().secili();
      const k = x.topic && O().komsu(x.subject.id, x.topic.id, Number(el.dataset.yon) || 1);
      if(!k) return;
      await O().sec(k.subject.id, k.topic.id);
      window.scrollTo(0, 0);
      R.App.render();
    },
  };

  /* ================================================================
     KONULAR — hangi konudasın, sırada ne var; ders ders konu listesi.
     ================================================================ */

  function devamKarti(){
    const son = O().sonAcilan();
    const x = son || O().secili();
    if(!x.topic) return null;
    const s = O().sirada(x.subject.id, x.topic.id);
    const hedef = s && s.sonraki ? s.sonraki : x;
    return html`<div class="ogr-devam">${K.NextUp({ icon:'book', label:son ? 'Kaldığın yer' : 'Başla',
      title:x.topic.name, why:x.subject.name + (s ? ' · sırada: ' + s.ad.toLocaleLowerCase('tr-TR') : ' · bütün adımlar tamam'),
      action:K.Button({ label:son ? 'Devam et' : 'Başla', tone:'primary', size:'sm', act:'ogren-git',
        data:{ 'data-route':s ? s.route : 'anlatim', 'data-subject':hedef.subject.id, 'data-topic':hedef.topic.id } }) })}</div>`;
  }

  function konuSatiri(subject, t){
    const d = O().durum(subject.id, t.id);
    const parca = [];
    if(d.okundu) parca.push('okundu');
    if(d.skor.cevaplanan) parca.push(d.skor.dogru + '/' + d.skor.toplam + ' soru doğru');
    else if(d.skor.toplam) parca.push(d.skor.toplam + ' örnek soru');
    if(!d.anlatim) parca.push('anlatım yazılıyor');
    const tamam = d.okundu && d.skor.toplam && d.skor.cevaplanan === d.skor.toplam;
    return html`<button class="${cls('listitem listitem--tap ogr-konu', tamam && 'is-tamam')}" data-act="ogren-git"
        data-route="anlatim" data-subject="${subject.id}" data-topic="${t.id}">
      <span class="ogr-konu__no num" aria-hidden="true">${tamam ? raw(UI.icon('check')) : t.order}</span>
      <span class="grow minw0"><span class="small strong ogr-konu__ad">${t.name}</span>
        ${when(parca.length, () => html`<span class="tiny dim">${parca.join(' · ')}</span>`)}</span>
      <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span>
    </button>`;
  }

  function konularKarti(){
    const x = O().secili();
    const sid = S.ui.ogrenListe || (x.subject ? x.subject.id : R.SUBJECTS[0].id);
    const subject = R.SUBJECTS.find(s => s.id === sid) || R.SUBJECTS[0];
    const oz = O().dersOzeti(subject.id);
    const gruplar = [];
    subject.topics.forEach(t => {
      const k = t.group || '—';
      let g = gruplar.find(y => y.ad === k);
      if(!g){ g = { ad:k, l:[] }; gruplar.push(g); }
      g.l.push(t);
    });
    return K.Card({ title:'Konular', wide:true,
      sub:oz.konu + ' konu · ' + oz.okunan + ' okundu' + (oz.soru ? ' · ' + oz.dogru + '/' + oz.soru + ' örnek soru doğru' : ''),
      actions:K.Select({ id:'ogren-liste', options:R.SUBJECTS.map(s => ({ value:s.id, label:kisaAd(s) })),
        value:subject.id, change:'ogren-liste', aria:'Ders', size:'sm' }),
      body:html`<div class="stack-sm" data-raf-tam>${map(gruplar, g => html`<div class="ogr-grup">
        ${when(gruplar.length > 1, () => html`<div class="ogr-grup__ad tiny dim">${g.ad}</div>`)}
        <div class="list list--sik">${map(g.l, t => konuSatiri(subject, t))}</div>
      </div>`)}</div>` });
  }

  R.Screens.ogren = {
    id:'ogren',
    title:'Konular',
    subtitle(){ return 'Konuyu seç; anlatım, örnek soru ve koç aynı konuya bakar'; },
    actions(){ return ''; },
    async render(){
      return String(K.Grid([K.Span(12, K.Stack([devamKarti(), konularKarti()]))]));
    },
    handle:Object.assign({}, ortakHandle),
    change:Object.assign({}, ortakChange, {
      async 'ogren-liste'(el){ S.ui.ogrenListe = el.value; R.App.render(); },
    }),
  };

  /* ================================================================
     ANLATIM — konunun ayrıntılı ders notu, uygulamanın içinde.
     ================================================================ */

  function ornekHtml(o){
    return html`<div class="ders__ornek">
      <div class="ders__etiket tiny">Örnek</div>
      <p>${fmt(o.soru)}</p>
      <div class="ders__etiket tiny mt-10">Çözüm</div>
      <ol class="ders__adimlar">${map(dizi(o.cozum), c => html`<li>${fmt(c)}</li>`)}</ol>
    </div>`;
  }

  function dersHtml(a){
    return html`<div class="ders__govde">
      ${when(a.giris, () => html`<p class="ders__giris">${fmt(a.giris)}</p>`)}
      ${map(a.bolumler, (b, i) => html`<section class="ders__bolum" id="${'ders-b' + (i + 1)}">
        <h3 class="ders__baslik"><span class="ders__no num" aria-hidden="true">${i + 1}</span>${b.baslik}</h3>
        ${map(dizi(b.metin), p => html`<p>${fmt(p)}</p>`)}
        ${when(b.liste, () => html`<ul class="ders__liste">${map(b.liste, m => html`<li>${fmt(m)}</li>`)}</ul>`)}
        ${when(b.formul, () => html`<div class="ders__formul">${map(b.formul, f => html`<div>${fmt(f)}</div>`)}</div>`)}
        ${when(b.ornek, () => ornekHtml(b.ornek))}
        ${when(b.dikkat, () => html`<p class="ders__dikkat"><b>Dikkat:</b> ${fmt(b.dikkat)}</p>`)}
      </section>`)}
    </div>`;
  }

  /* Geniş ekranda sağda «Bu konuda»: bölümler, özet ve sorular. Dar
     ekranda gizlenir (sayfa zaten tek sütun). */
  function icindekiler(x, a){
    const n = O().sorular(x.topic.id).length;
    return html`<nav class="ders__icindekiler" aria-label="Bu konuda">
      <div class="ders__etiket tiny">Bu konuda</div>
      ${map(a ? a.bolumler : [], (b, i) => html`<button type="button" class="ders__git" data-act="ders-git"
        data-hedef="${'ders-b' + (i + 1)}"><span class="num">${i + 1}</span>${b.baslik}</button>`)}
      ${when((R.KONU_OZET || {})[x.topic.id], () => html`<button type="button" class="ders__git" data-act="ders-git"
        data-hedef="ders-akilda"><span aria-hidden="true">·</span>Akılda kalsın</button>`)}
      ${when(n, () => html`<button type="button" class="ders__git" data-act="ogren-git" data-route="sorular"
        data-subject="${x.subject.id}" data-topic="${x.topic.id}"><span aria-hidden="true">›</span>${n} örnek soru</button>`)}
    </nav>`;
  }

  function akildaKarti(topic){
    const o = (R.KONU_OZET || {})[topic.id];
    if(!o) return '';
    return html`<div class="ders__akilda" id="ders-akilda">
      <div class="ders__etiket tiny">Akılda kalsın</div>
      <ul class="ders__liste">${map(o.ana, m => html`<li>${fmt(m)}</li>`)}</ul>
      ${when(o.dikkat, () => html`<p class="ders__dikkat"><b>Dikkat:</b> ${fmt(o.dikkat)}</p>`)}
      ${when(o.ornek, () => html`<p class="small mt-6"><b>Örnek:</b> ${fmt(o.ornek)}</p>`)}
    </div>`;
  }

  function anlatimKarti(x){
    const { subject, topic } = x;
    const a = O().anlatim(topic.id);
    const d = O().durum(subject.id, topic.id);
    const eylem = K.Row([
      d.okundu
        ? K.Button({ label:'Okundu', icon:'check', size:'sm', tone:'ghost', act:'ogren-okundu-geri', title:'İşareti kaldır' })
        : K.Button({ label:'Okudum', icon:'check', size:'sm', tone:'primary', act:'ogren-okundu' }),
      when(d.skor.toplam, () => K.Button({ label:'Sorulara geç', icon:'right', size:'sm', tone:d.okundu ? 'primary' : null,
        act:'ogren-git', data:{ 'data-route':'sorular', 'data-subject':subject.id, 'data-topic':topic.id } })),
      K.Button({ label:'Koça sor', icon:'zap', size:'sm', tone:'ghost', act:'ogren-git',
        data:{ 'data-route':'koc', 'data-subject':subject.id, 'data-topic':topic.id } }),
    ], { wrap:true });
    /* Başlıksız geniş satır: konu adı gövdede büyük başlık olur. Uzun
       anlatım raf düzeninde kısaltılmaz (data-raf-tam): okunacak metin. */
    return K.Card({ wide:true,
      body:html`<div class="ders-duzen">
        <article class="ders" data-raf-tam aria-labelledby="ders-baslik">
          <header class="ders__bas">
            <h2 id="ders-baslik">${topic.name}</h2>
            <p class="small dim">${subject.name + (topic.group ? ' · ' + topic.group : '')} · elle yazıldı · doğrulanmadı</p>
          </header>
          ${a ? dersHtml(a) : html`<div class="mb-10">${K.Notice({ tone:'info',
            body:'Bu konunun ayrıntılı anlatımı henüz yazılmadı. Aşağıda kısa özeti var; derin anlatım için «Konu anlatımı iste» ya da koça sor.' })}</div>`}
          ${akildaKarti(topic)}
          <div class="ders__ayak">${eylem}
            <p class="tiny dim mt-10">Ders kitabının yerini tutmaz: bir tanım ya da formül kritikse kitabınla karşılaştır.
              «Okudum» bir beyandır; öğrenme yolunun ilk adımına sayılır.</p></div>
        </article>
        ${icindekiler(x, a)}
      </div>`,
    });
  }

  /* Bu konuya bağlı kendi ders notların (screens/learn.js'in kaydı). */
  function notlarKarti(subject, topic){
    const notlar = (S.videoNotes || []).filter(n => n.subjectId === subject.id && n.topicId === topic.id);
    const seg = [];
    notlar.forEach(n => (n.segments || []).forEach(s => seg.push({ n, s })));
    return K.Card({ title:'Senin notların',
      sub:seg.length ? U.plural(seg.length, 'not', 'not') + ' · ' + notlar.length + ' ders' : null,
      actions:K.Button({ label:'Ders notu ekle', icon:'plus', size:'sm', tone:'ghost', act:'ogren-not' }),
      body:seg.length ? html`<div class="stack-xs">${map(seg.slice(0, 8), y => html`<div class="row-top gap-8">
          <a class="seg-row__ts num" href="${R.Model.tsUrl(y.n, y.s.ts)}" target="_blank" rel="noopener">${R.Model.fmtTs(y.s.ts)}</a>
          <span class="small">${y.s.text}</span></div>`)}</div>`
        : html`<p class="small muted">Bu konuya bağlı ders notun yok. Bir ders izlerken zaman damgalı not alırsan burada, anlatımın yanında durur.</p>` });
  }

  /* KONUNUN MALZEMELERİ (BAM; brand/ortak/urun.js söz 6). «Konu anlatımı
     iste» kaynaklı derin anlatımı ister; kavram sözlüğü ve çalışma kâğıdı
     ayrı. Her istek King'in onay kapısından geçer (model kotası harcar);
     ürün Onaylar'dan gelir ve burada, konusunun yanında açılır. HKM
     kapalıyken gelmiş olanlar okunur. Etiket modülün kendi bağıdır. */
  const MALZEME = [
    { tur:'ders_notu', ad:'Konu anlatımı' },
    { tur:'sozluk', ad:'Kavram sözlüğü' },
    { tur:'calisma_kagidi', ad:'Çalışma kâğıdı' },
  ];
  function etiketOf(subject, topic){ return 'ays:konu:' + subject.id + '/' + topic.id; }
  function malzemeler(subject, topic){
    const Ur = R.Urunler;
    if(!Ur || !Ur.etiketli) return null;
    const et = etiketOf(subject, topic);
    return { urunler:Ur.etiketli(et), bekleyen:Ur.bekleyen(et) };
  }
  function malzemeKarti(subject, topic){
    const m = malzemeler(subject, topic);
    if(!m) return null;
    const var_ = tur => m.urunler.some(u => u.urun === tur);
    const istendi = tur => m.bekleyen.some(y => y.tur === tur);
    const eksik = MALZEME.filter(y => !var_(y.tur));
    return K.Card({ title:'Daha derin', hint:'ogren-bam',
      sub:m.urunler.length ? m.urunler.length + ' malzeme · internetsiz de açılır' : 'BAM bu konu için kaynaklı yazar',
      body:html`
        ${when(m.urunler.length, () => html`<div class="stack-xs">${map(m.urunler, u => html`
          <div class="row between gap-8">
            <span class="small minw0"><b>${u.urunAd}</b> <span class="dim">${u.baslik}</span>
              <span class="tiny dim">· ${LIFEOS.Urun.etiketAdi(u.dogruluk)}</span></span>
            ${K.Button({ label:'Aç', size:'sm', act:'konu-urun-ac', data:{ 'data-id':u.id } })}
          </div>`)}</div>`)}
        ${when(eksik.length, () => html`<div class="row wrap gap-6 ${m.urunler.length ? 'mt-12' : ''}">${map(eksik, y => istendi(y.tur)
          ? K.Chip(y.ad + ' · istendi')
          : K.Button({ label:y.tur === 'ders_notu' ? 'Konu anlatımı iste' : y.ad, icon:y.tur === 'ders_notu' ? 'book' : null,
              size:'sm', tone:'ghost', act:'konu-malzeme', data:{ 'data-tur':y.tur } }))}</div>`)}`,
    });
  }

  R.Screens.anlatim = {
    id:'anlatim',
    title:'Anlatım',
    subtitle(){ const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : 'Konu anlatımı'; },
    actions(){ return ''; },
    async render(){
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'book', text:'Konu yok.' }) }));
      return String(K.Grid([K.Span(12, K.Stack([
        raw(konuCubugu(x)),
        anlatimKarti(x),
        notlarKarti(x.subject, x.topic),
        malzemeKarti(x.subject, x.topic),
      ]))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'ders-git'(el){
        const h = document.getElementById(el.dataset.hedef);
        if(h) h.scrollIntoView({ behavior:'smooth', block:'start' });
      },
      async 'ogren-okundu'(){
        const x = O().secili();
        if(!x.topic) return;
        await R.OgrenYolu.okundu(x.subject.id, x.topic.id, true);
        UI.toast('Okundu · ' + (O().skor(x.subject.id, x.topic.id).toplam ? 'sırada örnek sorular' : 'öğrenme yoluna sayıldı'));
        R.App.render();
      },
      async 'ogren-okundu-geri'(){
        const x = O().secili();
        if(!x.topic) return;
        await R.OgrenYolu.okundu(x.subject.id, x.topic.id, false);
        UI.toast('«Okudum» işareti kaldırıldı');
        R.App.render();
      },
      async 'ogren-not'(){
        const x = O().secili();
        S.ui.noteOpen = null;
        R.App.go('learn');
        setTimeout(() => R.Screens.learn.handle['note-new']({ dataset:{
          subject:x.subject ? x.subject.id : '', topic:x.topic ? x.topic.id : '' } }), 80);
      },
      /* «Konu anlatımı iste» ve öteki malzemeler: açık istek, konu etiketiyle. */
      async 'konu-malzeme'(el){
        const { subject, topic } = O().secili();
        const m = MALZEME.find(y => y.tur === el.dataset.tur);
        if(!subject || !topic || !m || !R.Urunler) return;
        const sinav = subject.id.indexOf('ayt') === 0 ? 'AYT' : 'TYT';
        const konu = topic.name + ' (' + subject.name + ')';
        const ayrinti = 'YKS ' + sinav + ' hazırlığı: ' + subject.name + (topic.group ? ' › ' + topic.group : '')
          + ' › ' + topic.name + '. Lise düzeyinde; tanımlar, adım adım çözülmüş örnekler, sık yapılan hatalar '
          + 've ÖSYM soru tarzına uygun kısa alıştırmalar.';
        const r = await R.Urunler.iste(m.ad + ': ' + konu, { tur:m.tur, konu, ayrinti, etiket:etiketOf(subject, topic) });
        UI.toast(r.metin || (r.ok ? 'King’e iletildi.' : 'İletilemedi.'), { life:r.ok ? 5000 : 6000 });
        R.App.render();
      },
      /* Malzeme KUTUDA açılır (brand/ortak/urun.js söz 2): betik çalışmaz. */
      async 'konu-urun-ac'(el){
        const u = R.Urunler && R.Urunler.bul(el.dataset.id);
        if(!u) return;
        UI.sheet({ title:u.baslik, wide:true,
          subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
          note:u.dogruluk === 'dogrulanmadi' ? 'Doğrulanmadı: kaynaksız, modelin bilgisidir. '
            + 'Karar vermeden önce bir kaynağa bak.' : null,
          body:LIFEOS.Urun.cerceve(u) });
      },
    }),
    change:Object.assign({}, ortakChange),
    malzemeler, etiketOf,
  };

  /* ================================================================
     SORULAR — örnek sorular, birer birer; ilk cevap ölçümdür.
     ================================================================ */

  function soruNo(x){
    const l = O().sorular(x.topic.id);
    const i = Math.max(0, Math.min(l.length - 1, Number(S.ui.ogrenSoru) || 0));
    return { l, i };
  }

  function noktalar(x, l, i, c){
    return html`<div class="ogr-noktalar" role="group" aria-label="Sorular">${map(l, (q, k) => {
      const v = c[k];
      const durum = !v ? 'bos' : v.bak ? 'bakildi' : v.h === q.dogru ? 'dogru' : 'yanlis';
      const ad = { bos:'cevaplanmadı', bakildi:'çözüme bakıldı', dogru:'doğru', yanlis:'yanlış' }[durum];
      return html`<button class="${cls('ogr-nokta', 'is-' + durum, k === i && 'is-sirada')}" data-act="soru-git"
        data-i="${k}" aria-label="${'Soru ' + (k + 1) + ': ' + ad}" aria-current="${k === i ? 'true' : 'false'}">${k + 1}</button>`;
    })}</div>`;
  }

  /* Paragraflı soruda son satır soru köküdür: paragraf ayrı, kök kalın. */
  function soruMetni(metin){
    const l = String(metin || '').split('\n');
    const kok = l.pop();
    return html`${map(l, p => html`<p class="ogr-soru__parca">${fmt(p)}</p>`)}<p class="ogr-soru__metin">${l.length ? html`<b>${fmt(kok)}</b>` : fmt(kok)}</p>`;
  }

  function soruKarti(x){
    const { subject, topic } = x;
    const { l, i } = soruNo(x);
    if(!l.length){
      return K.Card({ title:'Örnek sorular', wide:true,
        body:K.Empty({ icon:'search', text:'Bu konunun örnek soruları henüz yazılmadı.',
          action:K.Button({ label:'Koç bir soru sorsun', size:'sm', act:'ogren-git',
            data:{ 'data-route':'koc', 'data-subject':subject.id, 'data-topic':topic.id } }) }) });
    }
    const q = l[i], c = O().cevaplar(subject.id, topic.id), v = c[i];
    const sk = O().skor(subject.id, topic.id);
    const acik = !!v;
    const secenek = (metin, k) => {
      const harf = O().HARFLER[k];
      const durum = !acik ? '' : harf === q.dogru ? 'is-dogru' : v.h === harf ? 'is-yanlis' : 'is-soluk';
      return html`<button class="${cls('secenek', durum)}" data-act="soru-cevap" data-harf="${harf}"
          ${acik ? raw('disabled aria-disabled="true"') : ''}>
        <span class="secenek__harf" aria-hidden="true">${harf}</span><span class="secenek__metin">${fmt(metin)}</span>
        ${when(acik && harf === q.dogru, () => html`<span class="sr-only">doğru cevap</span>`)}
        ${when(acik && v.h === harf && harf !== q.dogru, () => html`<span class="sr-only">senin cevabın</span>`)}
      </button>`;
    };
    const sonuc = !v ? null : v.bak ? 'Çözüme bakıldı · doğru cevap ' + q.dogru
      : v.h === q.dogru ? 'Doğru' : 'Yanlış · senin cevabın ' + v.h + ', doğrusu ' + q.dogru;
    const ton = !v ? '' : v.bak ? 'bakildi' : v.h === q.dogru ? 'dogru' : 'yanlis';
    const sonMu = i === l.length - 1;
    const sonraki = O().komsu(subject.id, topic.id, 1);
    const defterde = v && !v.bak && v.h !== q.dogru && O().deftere(subject.id, topic.id, i);
    return K.Card({ title:'Örnek sorular', wide:true,
      sub:sk.cevaplanan ? sk.dogru + ' / ' + sk.toplam + ' doğru · ölçüldü' : sk.toplam + ' soru · ilk cevabın sayılır',
      actions:when(sk.cevaplanan, () => K.Button({ label:'Baştan çöz', icon:'refresh', size:'sm', tone:'ghost', act:'soru-sifirla' })),
      body:html`
        ${noktalar(x, l, i, c)}
        <div class="ogr-soru" aria-live="polite" data-raf-tam>
          <div class="ders__etiket tiny">Soru ${i + 1} / ${l.length}</div>
          ${soruMetni(q.soru)}
          <div class="secenekler">${map(q.sec, secenek)}</div>
          ${when(!acik, () => html`<div class="mt-10">${K.Button({ label:'Cevaplamadan çözümü gör', size:'sm', tone:'ghost', act:'soru-bak' })}</div>`)}
          ${when(acik, () => html`<div class="${cls('ogr-sonuc', 'is-' + ton)}">
            <p class="small"><b>${sonuc}</b></p>
            <div class="ders__etiket tiny mt-10">Çözüm</div>
            <ol class="ders__adimlar">${map(dizi(q.cozum), s => html`<li>${fmt(s)}</li>`)}</ol>
            <div class="row wrap gap-6 mt-10">
              ${K.Button({ label:'Koça sor', icon:'zap', size:'sm', tone:'ghost', act:'soru-koca' })}
              ${K.Button({ label:'Karta çevir', icon:'cards', size:'sm', tone:'ghost', act:'soru-kart' })}
              ${when(v.h && v.h !== q.dogru, () => defterde
                ? K.Chip('yanlış defterinde')
                : K.Button({ label:'Yanlış defterine ekle', icon:'list', size:'sm', tone:'ghost', act:'soru-defter' }))}
            </div>
          </div>`)}
        </div>
        <div class="row between wrap gap-6 mt-16">
          ${i > 0 ? K.Button({ label:'Önceki', icon:'left', size:'sm', tone:'ghost', act:'soru-git', data:{ 'data-i':String(i - 1) } }) : html`<span></span>`}
          ${!sonMu ? K.Button({ label:'Sonraki soru', icon:'right', size:'sm', tone:acik ? 'primary' : null, act:'soru-git', data:{ 'data-i':String(i + 1) } })
            : sonraki ? K.Button({ label:'Sonraki konu', icon:'right', size:'sm', tone:acik ? 'primary' : null, act:'ogren-git',
                data:{ 'data-route':'anlatim', 'data-subject':sonraki.subject.id, 'data-topic':sonraki.topic.id } })
            : html`<span></span>`}
        </div>
        <p class="tiny dim mt-12">Sorular elle yazıldı, doğrulanmadı. İlk cevabın bu konunun kaydına yazılır; hiçbir plan ya da kapanış
          ona bakmaz — kapanış Konu çalış’taki testle ölçülür.</p>`,
    });
  }

  R.Screens.sorular = {
    id:'sorular',
    title:'Sorular',
    subtitle(){ const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : 'Örnek sorular'; },
    actions(){ return ''; },
    async render(){
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'search', text:'Konu yok.' }) }));
      return String(K.Grid([K.Span(12, K.Stack([raw(konuCubugu(x)), soruKarti(x)]))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'soru-git'(el){ S.ui.ogrenSoru = Number(el.dataset.i) || 0; R.App.render(); },
      async 'soru-cevap'(el){
        const x = O().secili(), { i } = soruNo(x);
        await O().cevapla(x.subject.id, x.topic.id, i, el.dataset.harf);
        R.App.render();
      },
      async 'soru-bak'(){
        const x = O().secili(), { i } = soruNo(x);
        await O().bak(x.subject.id, x.topic.id, i);
        R.App.render();
      },
      async 'soru-sifirla'(){
        const x = O().secili();
        UI.confirmSheet('Baştan çöz', 'Bu konudaki örnek soru cevapların silinir; yeniden çözdüğünde yeni ilk cevabın sayılır.',
          async () => { await O().sifirla(x.subject.id, x.topic.id); S.ui.ogrenSoru = 0; R.App.render(); }, false, 'Baştan çöz');
      },
      async 'soru-koca'(){
        const x = O().secili(), { l, i } = soruNo(x), q = l[i];
        if(!q) return;
        S.ui.kocParca = { etiket:'Soru ' + (i + 1), metin:q.soru + '\n' + q.sec.map((m, k) => O().HARFLER[k] + ') ' + m).join('\n')
          + '\nDoğru cevap: ' + q.dogru + '\nUygulamadaki çözüm: ' + dizi(q.cozum).join(' ') };
        S.ui.kocTaslak = 'Bu sorunun çözümünü anlamadım; adım adım, başka bir yoldan anlat.';
        R.App.go('koc');
      },
      async 'soru-kart'(){
        const x = O().secili(), { l, i } = soruNo(x), q = l[i];
        if(!q) return;
        const dogru = q.sec[O().HARFLER.indexOf(q.dogru)];
        const card = R.Model.newCard({ front:q.soru.slice(0, 200), back:(q.dogru + ') ' + dogru + ' — ' + dizi(q.cozum).join(' ')).slice(0, 300),
          subjectId:x.subject.id, topic:x.topic.name, source:'ogren' });
        await R.Model.saveCard(card);
        UI.toast('Karta çevrildi · Tekrar’da sorar');
      },
      async 'soru-defter'(){
        const x = O().secili(), { i } = soruNo(x);
        const e = await O().yanlisaEkle(x.subject.id, x.topic.id, i);
        UI.toast(e ? 'Yanlış defterine eklendi · kök nedenini orada yaz' : 'Eklenemedi');
        R.App.render();
      },
    }),
    change:Object.assign({}, ortakChange),
  };

  /* ================================================================
     KOÇ — bu konunun içinde anlatan koç (core/konusor.js).
     ================================================================ */

  const HAZIR = [
    { ad:'Daha basit anlat', metin:'Bu konuyu en baştan, çok basit bir dille ve günlük hayattan bir örnekle anlat.' },
    { ad:'Bir örnek daha', metin:'Bu konudan ÖSYM tarzında bir örnek soru yaz ve adım adım çöz.' },
    { ad:'Beni sına', metin:'Bana bu konudan tek bir kısa soru sor. Cevabı hemen söyleme; ben cevaplayınca söyle.' },
    { ad:'Sık yapılan hatalar', metin:'Bu konuda en sık yapılan hataları ve onlardan nasıl kaçınacağımı söyle.' },
    { ad:'Formülleri özetle', metin:'Bu konunun kurallarını ve formüllerini madde madde, kısa özetle.' },
  ];
  let kocBusy = false;

  function kocKarti(x){
    const { subject, topic } = x;
    const KS = R.KonuSor;
    if(!KS || !KS.hazir()){
      return K.Card({ title:'Koç', wide:true,
        body:html`${K.Notice({ tone:'info', title:'Model bağlı değil.',
          body:'Ofis ayarlarından ücretsiz bir sağlayıcı bağlarsan koç bu konunun içinde, anlamadığın yeri anlatır. '
            + 'Anlatım ve örnek sorular modelsiz de çalışır.' })}
          <div class="row wrap gap-6 mt-12">
            ${K.Button({ label:'Ofis ayarlarını aç', icon:'gear', size:'sm', tone:'primary', act:'koc-ayar' })}
            ${K.Button({ label:'Anlatıma dön', size:'sm', tone:'ghost', act:'ogren-git',
              data:{ 'data-route':'anlatim', 'data-subject':subject.id, 'data-topic':topic.id } })}
          </div>` });
    }
    const l = KS.konusmaOf(subject.id, topic.id);
    const ciftler = [];
    for(let k = 0; k + 1 < l.length; k += 2) ciftler.push({ soru:l[k].metin, cevap:l[k + 1].metin, i:k / 2 });
    const parca = S.ui.kocParca;
    return K.Card({ title:'Koç', wide:true, sub:topic.name + ' · koçun modeli bu konunun içinde anlatır',
      actions:when(ciftler.length, () => K.Button({ label:'Yeni konuşma', size:'sm', tone:'ghost', act:'konusor-unut' })),
      body:html`
        <div class="sohbet" aria-live="polite" data-raf-tam>
          ${when(!ciftler.length, () => html`<p class="small muted">Anlamadığın yeri yaz ya da aşağıdan birini seç. Koç yalnız
            bu konuyu, uygulamadaki özetle aynı dilde anlatır.</p>`)}
          ${map(ciftler, c => html`
            <div class="sohbet__sen"><p class="small">${c.soru}</p></div>
            <div class="sohbet__koc">
              <p class="small konusor__cevap">${c.cevap}</p>
              <div class="row between gap-6 mt-6"><span class="tiny dim">doğrulanmadı · modelin anlatımı</span>
                ${K.Button({ label:'Karta çevir', icon:'cards', size:'sm', tone:'ghost', act:'konusor-kart', data:{ 'data-i':String(c.i) } })}</div>
            </div>`)}
          <div id="konusor-akis" class="sohbet__koc small konusor__cevap"></div>
        </div>
        <div class="row wrap gap-6 mt-12" role="group" aria-label="Hazır sorular">${map(HAZIR, (h, k) =>
          K.Chip({ label:h.ad, act:'koc-hazir', data:{ 'data-i':String(k) } }))}</div>
        ${when(parca, () => html`<div class="ogr-parca mt-12"><span class="tiny dim">Bağlam: ${parca.etiket}</span>
          <button type="button" class="linkbtn tiny" data-act="koc-parca-kaldir">kaldır</button></div>`)}
        <div class="mt-12">${K.Field({ label:ciftler.length ? 'Devam et' : 'Neyi anlamadın?',
          input:K.Textarea({ id:'konusor-soru', rows:3, aria:'Anlamadığın yer', value:S.ui.kocTaslak || '',
            placeholder:'Anlamadığın yeri yaz ya da anlatımdan yapıştır…' }) })}</div>
        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:kocBusy ? 'Anlatıyor…' : 'Sor', icon:'zap', size:'sm', tone:'primary', act:'konusor-sor', disabled:kocBusy })}
        </div>
        <p class="tiny dim mt-10">Cevap kaynaksızdır ve kaydedilmez; konuşma bu açılışta durur. Bir tanım ya da formül kritikse
          kitabınla karşılaştır.</p>`,
    });
  }

  async function sor(metin){
    const x = O().secili();
    if(!x.topic || kocBusy || !R.KonuSor) return;
    if(String(metin || '').trim().length < 3){ UI.toast('Neyi anlamadığını bir cümleyle yaz.'); return; }
    kocBusy = true;
    S.ui.kocTaslak = '';
    const akis = document.getElementById('konusor-akis');
    if(akis) akis.textContent = 'Anlatıyor…';
    let r = null;
    try{
      r = await R.KonuSor.sor(x.subject.id, x.topic.id, metin, { parca:S.ui.kocParca ? S.ui.kocParca.metin : null,
        onText:t => { if(akis) akis.textContent = t; } });
    }finally{ kocBusy = false; }
    if(r && !r.ok) UI.toast(r.metin, { life:6000 });
    R.App.render();
  }

  R.Screens.koc = {
    id:'koc',
    title:'Koç',
    subtitle(){ const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : 'Konunun koçu'; },
    actions(){ return ''; },
    async render(){
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'zap', text:'Konu yok.' }) }));
      return String(K.Grid([K.Span(12, K.Stack([raw(konuCubugu(x)), kocKarti(x)]))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'konusor-sor'(){
        const kutu = document.getElementById('konusor-soru');
        await sor(kutu ? kutu.value : '');
      },
      async 'koc-hazir'(el){
        const h = HAZIR[Number(el.dataset.i) || 0];
        if(h) await sor(h.metin);
      },
      async 'koc-parca-kaldir'(){ S.ui.kocParca = null; R.App.render(); },
      async 'koc-ayar'(){
        R.App.go('office');
        setTimeout(() => R.Screens.office && R.Screens.office.handle['office-settings']({ dataset:{} }), 80);
      },
      async 'konusor-kart'(el){
        const x = O().secili();
        if(!x.topic) return;
        const k = await R.KonuSor.kartYap(x.subject.id, x.topic.id, Number(el.dataset.i) || 0);
        UI.toast(k ? 'Karta çevrildi · modelin anlatımı, yanlışsa düzelt' : 'Kart yapılamadı');
        R.App.render();
      },
      async 'konusor-unut'(){
        const x = O().secili();
        if(x.topic) R.KonuSor.unut(x.subject.id, x.topic.id);
        S.ui.kocParca = null;
        R.App.render();
      },
    }),
    change:Object.assign({}, ortakChange),
  };
})();
