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

  /* Metindeki küçük işaretler (**kalın**, x^{2}, H_{2}O; iç içe olabilir)
     tek ayrıştırıcıdan geçer: core/ogren.js metinHtml. */
  const fmt = s => raw(O().metinHtml(s));
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
    /* Sorular'ın kipi (Bu konu · Karma test · Yanlışlarım); Öğren'in her
       bölümünden açılabilir. */
    async 'sorular-kip'(el){
      S.ui.ogrenKip = el.dataset.tab || 'konu';
      if(S.ui.ogrenKip !== 'yanlis') S.ui.ogrTekrar = null;
      if(S.route !== 'sorular'){ R.App.go('sorular'); return; }
      window.scrollTo(0, 0);
      R.App.render();
    },
  };

  /* ================================================================
     KONULAR — hangi konudasın, sırada ne var; dersler ve konu listesi.
     ================================================================ */

  /* Konu konu açık yanlış sayısı (core/ogrentest.js söz 5). */
  function acikYanlislar(){
    const say = {};
    if(R.OgrenTest) R.OgrenTest.yanlislar().forEach(y => { say[y.topic.id] = (say[y.topic.id] || 0) + 1; });
    return say;
  }
  const tamamMi = d => !!(d.okundu && d.skor.toplam && d.skor.cevaplanan === d.skor.toplam);

  function devamKarti(yanlisSay){
    const son = O().sonAcilan();
    const x = son || O().secili();
    if(!x.topic) return null;
    const s = O().sirada(x.subject.id, x.topic.id);
    const hedef = s && s.sonraki ? s.sonraki : x;
    const a = R.OgrenTest && R.OgrenTest.aktif();
    const y = Object.keys(yanlisSay).reduce((t, k) => t + yanlisSay[k], 0);
    return html`<div class="ogr-devam">${K.NextUp({ icon:'book', label:son ? 'Kaldığın yer' : 'Başla',
      title:x.topic.name, why:x.subject.name + (s ? ' · sırada: ' + s.ad.toLocaleLowerCase('tr-TR') : ' · bütün adımlar tamam'),
      action:K.Button({ label:son ? 'Devam et' : 'Başla', tone:'primary', size:'sm', act:'ogren-git',
        data:{ 'data-route':s ? s.route : 'anlatim', 'data-subject':hedef.subject.id, 'data-topic':hedef.topic.id } }) })}
      <div class="row wrap gap-6 mt-10">
        ${K.Button({ label:a ? 'Karma teste dön' : 'Karma test', icon:'zap', size:'sm', tone:'ghost', act:'sorular-kip', data:{ 'data-tab':'karma' } })}
        ${when(y, () => K.Button({ label:'Yanlışlarım · ' + y, icon:'list', size:'sm', tone:'ghost', act:'sorular-kip', data:{ 'data-tab':'yanlis' } }))}
      </div></div>`;
  }

  /* Sekiz ders yan yana: kaç konu okundu, örnek soruların kaçı doğru.
     Ders seçici de budur: dokunulan dersin konuları aşağıda listelenir. */
  function derslerKarti(secili){
    const l = R.SUBJECTS.map(s => ({ s, oz:O().dersOzeti(s.id) }));
    const top = l.reduce((a, y) => ({ konu:a.konu + y.oz.konu, okunan:a.okunan + y.oz.okunan, soru:a.soru + y.oz.soru, dogru:a.dogru + y.oz.dogru }),
      { konu:0, okunan:0, soru:0, dogru:0 });
    return K.Card({ title:'Dersler', wide:true,
      sub:top.okunan + ' / ' + top.konu + ' konu okundu' + (top.soru ? ' · ' + top.dogru + ' / ' + top.soru + ' örnek soru doğru' : ''),
      body:html`<div class="ogr-dersler" role="group" aria-label="Ders seç">${map(l, y => html`<button type="button"
          class="${cls('ogr-ders', y.s.id === secili && 'is-on')}" data-act="ogren-liste-sec" data-subject="${y.s.id}"
          aria-pressed="${y.s.id === secili ? 'true' : 'false'}">
        <span class="small strong ogr-ders__ad">${kisaAd(y.s)}</span>
        ${K.Bar({ value:y.oz.konu ? y.oz.okunan * 100 / y.oz.konu : 0 })}
        <span class="tiny dim">${y.oz.okunan} / ${y.oz.konu} okundu${y.oz.soru ? ' · ' + y.oz.dogru + ' / ' + y.oz.soru + ' doğru' : ''}</span>
      </button>`)}</div>` });
  }

  /* Konu süzgeci: kural kodda, adı ekranda. «Yanlışı olan» = konunun
     Yanlışlarım'da en az bir sorusu var (son denemesi doğru değil). */
  const SUZGEC = [
    { id:'hepsi', ad:'Hepsi', f:() => true },
    { id:'okunmadi', ad:'Okunmadı', f:d => !d.okundu },
    { id:'soru', ad:'Soru bekliyor', f:d => d.okundu && d.skor.cevaplanan < d.skor.toplam },
    { id:'yanlis', ad:'Yanlışı olan', f:(d, y) => y > 0 },
    { id:'tamam', ad:'Tamam', f:d => tamamMi(d) },
  ];

  function konuSatiri(subject, t, d, yanlis){
    const parca = [];
    if(d.okundu) parca.push('okundu');
    if(d.skor.cevaplanan) parca.push(d.skor.dogru + '/' + d.skor.toplam + ' soru doğru');
    else if(d.skor.toplam) parca.push(d.skor.toplam + ' örnek soru');
    if(yanlis) parca.push(yanlis + ' yanlış açık');
    if(!d.anlatim) parca.push('anlatım yazılıyor');
    const tamam = tamamMi(d);
    return html`<button class="${cls('listitem listitem--tap ogr-konu', tamam && 'is-tamam')}" data-act="ogren-git"
        data-route="anlatim" data-subject="${subject.id}" data-topic="${t.id}">
      <span class="ogr-konu__no num" aria-hidden="true">${tamam ? raw(UI.icon('check')) : t.order}</span>
      <span class="grow minw0"><span class="small strong ogr-konu__ad">${t.name}</span>
        ${when(parca.length, () => html`<span class="tiny dim">${parca.join(' · ')}</span>`)}</span>
      <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span>
    </button>`;
  }

  function konularKarti(subject, yanlisSay){
    const oz = O().dersOzeti(subject.id);
    const sz = SUZGEC.find(x => x.id === S.ui.ogrenSuzgec) || SUZGEC[0];
    const satirlar = subject.topics.map(t => ({ t, d:O().durum(subject.id, t.id), y:yanlisSay[t.id] || 0 }));
    const gruplar = [];
    satirlar.filter(r => sz.f(r.d, r.y)).forEach(r => {
      const k = r.t.group || '—';
      let g = gruplar.find(y => y.ad === k);
      if(!g){ g = { ad:k, l:[] }; gruplar.push(g); }
      g.l.push(r);
    });
    return K.Card({ title:subject.name, wide:true,
      sub:oz.konu + ' konu · ' + oz.okunan + ' okundu' + (oz.soru ? ' · ' + oz.dogru + '/' + oz.soru + ' örnek soru doğru' : ''),
      body:html`<div class="row wrap gap-6 mb-10" role="group" aria-label="Konu süzgeci">${map(SUZGEC, x =>
          K.Chip({ label:x.ad + ' · ' + satirlar.filter(r => x.f(r.d, r.y)).length, act:'ogren-suzgec', on:x.id === sz.id,
            data:{ 'data-f':x.id, 'aria-pressed':x.id === sz.id ? 'true' : 'false' } }))}</div>
        ${gruplar.length ? html`<div class="stack-sm" data-raf-tam>${map(gruplar, g => html`<div class="ogr-grup">
          ${when(gruplar.length > 1, () => html`<div class="ogr-grup__ad tiny dim">${g.ad}</div>`)}
          <div class="list list--sik">${map(g.l, r => konuSatiri(subject, r.t, r.d, r.y))}</div>
        </div>`)}</div>`
        : html`<p class="small muted">Bu süzgeçte konu yok.</p>`}` });
  }

  R.Screens.ogren = {
    id:'ogren',
    title:'Konular',
    subtitle(){ return 'Konuyu seç; anlatım, örnek soru ve koç aynı konuya bakar'; },
    actions(){ return ''; },
    async render(){
      const x = O().secili();
      const sid = S.ui.ogrenListe || (x.subject ? x.subject.id : R.SUBJECTS[0].id);
      const subject = R.SUBJECTS.find(s => s.id === sid) || R.SUBJECTS[0];
      const y = acikYanlislar();
      return String(K.Grid([K.Span(12, K.Stack([devamKarti(y), derslerKarti(subject.id), konularKarti(subject, y)]))]));
    },
    handle:Object.assign({}, ortakHandle, {
      async 'ogren-liste-sec'(el){ S.ui.ogrenListe = el.dataset.subject; R.App.render(); },
      async 'ogren-suzgec'(el){ S.ui.ogrenSuzgec = el.dataset.f || 'hepsi'; R.App.render(); },
    }),
    change:Object.assign({}, ortakChange),
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

  /* Seviye rozeti: yazarın değerlendirmesi (ölçüm değil). */
  const seviyeRozeti = sv => html`<span class="${cls('ogr-seviye', 'is-' + (sv || 'temel'))}">${O().SEVIYE[sv] || 'Temel'}</span>`;

  /* DERİN BLOKLAR (data/derin-*.js): kazanımlar ve ön koşullar başta;
     çözümlü örnekler, sınav kalıpları ve sık hatalar anlatımın sonunda. */
  function kazanimHtml(d){
    return html`<div class="ders__kazanim" id="ders-kazanim">
      <div class="ders__etiket tiny">Bu konunun sonunda</div>
      <ul class="ders__liste">${map(d.kazanim, m => html`<li>${fmt(m)}</li>`)}</ul>
    </div>`;
  }
  function onKosulHtml(d){
    const l = (d.onKosul || []).map(id => O().konuyuBul(id)).filter(y => y.topic);
    if(!l.length) return '';
    return html`<div class="ders__onkosul"><span class="ders__etiket tiny">Önce bunları bil</span>
      <div class="row wrap gap-6">${map(l, y => {
        const ok = O().durum(y.subject.id, y.topic.id).okundu;
        return K.Chip({ label:(ok ? '✓ ' : '') + y.topic.name, act:'ogren-git',
          data:{ 'data-route':'anlatim', 'data-subject':y.subject.id, 'data-topic':y.topic.id,
            'aria-label':y.topic.name + (ok ? ', okundu' : ', okunmadı') } });
      })}</div></div>`;
  }
  function orneklerHtml(d){
    return html`<section class="ders__bolum ders__ek" id="ders-ornekler">
      <h3 class="ders__baslik">Çözümlü örnekler</h3>
      <p class="small dim">Önce kâğıtta kendin dene; takılınca çözümü aç.</p>
      ${map(d.ornekler, (o, i) => html`<div class="ders__ornek">
        <div class="row between gap-8 mb-6"><span class="ders__etiket tiny">Örnek ${i + 1}</span>${seviyeRozeti(o.seviye)}</div>
        ${soruMetni(o.soru)}
        <details class="ders__cozum"><summary>Çözümü göster</summary>
          <ol class="ders__adimlar">${map(dizi(o.cozum), c => html`<li>${fmt(c)}</li>`)}</ol>
        </details>
      </div>`)}
    </section>`;
  }
  function listeBlogu(id, baslik, l, sinif){
    return html`<section class="${cls('ders__bolum ders__ek', sinif)}" id="${id}">
      <h3 class="ders__baslik">${baslik}</h3>
      <ul class="ders__liste">${map(l, m => html`<li>${fmt(m)}</li>`)}</ul>
    </section>`;
  }

  function dersHtml(a, d){
    return html`<div class="ders__govde">
      ${when(a.giris, () => html`<p class="ders__giris">${fmt(a.giris)}</p>`)}
      ${when(d && d.kazanim, () => kazanimHtml(d))}
      ${when(d && d.onKosul, () => onKosulHtml(d))}
      ${map(a.bolumler, (b, i) => html`<section class="ders__bolum" id="${'ders-b' + (i + 1)}">
        <h3 class="ders__baslik"><span class="ders__no num" aria-hidden="true">${i + 1}</span>${b.baslik}</h3>
        ${map(dizi(b.metin), p => html`<p>${fmt(p)}</p>`)}
        ${when(b.liste, () => html`<ul class="ders__liste">${map(b.liste, m => html`<li>${fmt(m)}</li>`)}</ul>`)}
        ${when(b.formul, () => html`<div class="ders__formul">${map(b.formul, f => html`<div>${fmt(f)}</div>`)}</div>`)}
        ${when(b.ornek, () => ornekHtml(b.ornek))}
        ${when(b.dikkat, () => html`<p class="ders__dikkat"><b>Dikkat:</b> ${fmt(b.dikkat)}</p>`)}
      </section>`)}
      ${when(d && d.ornekler && d.ornekler.length, () => orneklerHtml(d))}
      ${when(d && d.kaliplar && d.kaliplar.length, () => listeBlogu('ders-kaliplar', 'Sınavda nasıl sorulur', d.kaliplar))}
      ${when(d && d.hatalar && d.hatalar.length, () => listeBlogu('ders-hatalar', 'Sık yapılan hatalar', d.hatalar, 'ders__hatalar'))}
    </div>`;
  }

  /* Geniş ekranda sağda «Bu konuda»: bölümler, özet ve sorular. Dar
     ekranda gizlenir (sayfa zaten tek sütun). */
  function icindekiler(x, a){
    const n = O().sorular(x.topic.id).length;
    const d = O().derin(x.topic.id) || {};
    const ek = [['ders-ornekler', 'Çözümlü örnekler', d.ornekler], ['ders-kaliplar', 'Sınavda nasıl sorulur', d.kaliplar],
      ['ders-hatalar', 'Sık yapılan hatalar', d.hatalar]].filter(y => y[2] && y[2].length);
    return html`<nav class="ders__icindekiler" aria-label="Bu konuda">
      <div class="ders__etiket tiny">Bu konuda</div>
      ${map(a ? a.bolumler : [], (b, i) => html`<button type="button" class="ders__git" data-act="ders-git"
        data-hedef="${'ders-b' + (i + 1)}"><span class="num">${i + 1}</span>${b.baslik}</button>`)}
      ${map(ek, y => html`<button type="button" class="ders__git" data-act="ders-git" data-hedef="${y[0]}"><span aria-hidden="true">·</span>${y[1]}</button>`)}
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
          ${a ? dersHtml(a, O().derin(topic.id)) : html`<div class="mb-10">${K.Notice({ tone:'info',
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
     SORULAR — üç kip, aynı soru gövdesi:
       Bu konu      örnek sorular birer birer; ilk cevap ölçümdür.
       Karma test   konular karışık (core/ogrentest.js söz 1–4).
       Yanlışlarım  son denemesi doğru olmayanları yeniden çöz (söz 5).
     Soru kartları başlıksızdır: içinde soru çözülen bir kart gizlenip
     küçültülecek bir bölüm değildir (core/gizle.js başlıklı kartı alır).
     ================================================================ */

  const T = () => R.OgrenTest;
  const DURUM_AD = { bos:'cevaplanmadı', bakildi:'çözüme bakıldı', dogru:'doğru', yanlis:'yanlış' };
  const durumOf = (q, v) => !v ? 'bos' : v.bak ? 'bakildi' : v.h === q.dogru ? 'dogru' : 'yanlis';
  const KAYNAK_AD = { konu:'konu sorusu', test:'karma test', tekrar:'yeniden çözüm' };

  function soruNo(x){
    const l = O().sorular(x.topic.id);
    const i = Math.max(0, Math.min(l.length - 1, Number(S.ui.ogrenSoru) || 0));
    return { l, i };
  }

  /* Kartın kendi başlığı (başlıksız kartın gövdesinde). */
  function kartBasi(ad, alt, eylem){
    return html`<div class="ogr-bas"><div class="minw0"><h2 class="ogr-bas__ad">${ad}</h2>
      ${when(alt, () => html`<p class="small dim">${alt}</p>`)}</div>${eylem || ''}</div>`;
  }

  /* n soru için numaralı noktalar; durum(k) → bos|bakildi|dogru|yanlis. */
  function noktalar(n, i, durum, act){
    const l = [];
    for(let k = 0; k < n; k++) l.push(k);
    return html`<div class="ogr-noktalar" role="group" aria-label="Sorular">${map(l, k => {
      const d = durum(k);
      return html`<button class="${cls('ogr-nokta', 'is-' + d, k === i && 'is-sirada')}" data-act="${act}"
        data-i="${k}" aria-label="${'Soru ' + (k + 1) + ': ' + DURUM_AD[d]}" aria-current="${k === i ? 'true' : 'false'}">${k + 1}</button>`;
    })}</div>`;
  }

  /* Paragraflı soruda son satır soru köküdür: paragraf ayrı, kök kalın. */
  function soruMetni(metin){
    const l = String(metin || '').split('\n');
    const kok = l.pop();
    return html`${map(l, p => html`<p class="ogr-soru__parca">${fmt(p)}</p>`)}<p class="ogr-soru__metin">${l.length ? html`<b>${fmt(kok)}</b>` : fmt(kok)}</p>`;
  }

  /* Üç kipin ortak soru gövdesi. v: { h, bak, ip? } ya da null (cevapsız).
     o: { etiket, seviye?, ipucu?: anahtar, cevapAct, bakAct?, ust?, eylemler }
     İpucu cevaptan önce açılır; açıldıktan sonra verilen cevap «ipucuyla»
     diye yazılır (ölçüm dürüst kalsın). */
  function soruGovdesi(q, v, o){
    const acik = !!v;
    const ipAcik = !!(o.ipucu && S.ui.ipucu === o.ipucu);
    const secenek = (metin, k) => {
      const harf = O().HARFLER[k];
      const durum = !acik ? '' : harf === q.dogru ? 'is-dogru' : v.h === harf ? 'is-yanlis' : 'is-soluk';
      return html`<button class="${cls('secenek', durum)}" data-act="${o.cevapAct}" data-harf="${harf}"
          ${acik ? raw('disabled aria-disabled="true"') : ''}>
        <span class="secenek__harf" aria-hidden="true">${harf}</span><span class="secenek__metin">${fmt(metin)}</span>
        ${when(acik && harf === q.dogru, () => html`<span class="sr-only">doğru cevap</span>`)}
        ${when(acik && v.h === harf && harf !== q.dogru, () => html`<span class="sr-only">senin cevabın</span>`)}
      </button>`;
    };
    const d = durumOf(q, v);
    const sonuc = (d === 'bakildi' ? 'Çözüme bakıldı · doğru cevap ' + q.dogru
      : d === 'dogru' ? 'Doğru' : 'Yanlış · senin cevabın ' + (v && v.h) + ', doğrusu ' + q.dogru) + (v && v.ip ? ' · ipucuyla' : '');
    return html`<div class="ogr-soru" aria-live="polite" data-raf-tam>
      <div class="row between gap-8 mb-6"><span class="ders__etiket tiny">${o.etiket}</span>${when(o.seviye, () => seviyeRozeti(o.seviye))}</div>
      ${soruMetni(q.soru)}
      ${when(q.ipucu && (ipAcik || (acik && v.ip)), () => html`<p class="ogr-ipucu small"><b>İpucu:</b> ${fmt(q.ipucu)}</p>`)}
      <div class="secenekler">${map(q.sec, secenek)}</div>
      ${when(!acik && (o.bakAct || (q.ipucu && o.ipucu && !ipAcik)), () => html`<div class="row wrap gap-6 mt-10">
        ${when(q.ipucu && o.ipucu && !ipAcik, () => K.Button({ label:'İpucu', icon:'info', size:'sm', tone:'ghost', act:'soru-ipucu', data:{ 'data-ip':o.ipucu } }))}
        ${when(o.bakAct, () => K.Button({ label:'Cevaplamadan çözümü gör', size:'sm', tone:'ghost', act:o.bakAct }))}
      </div>`)}
      ${when(acik, () => html`<div class="${cls('ogr-sonuc', 'is-' + d)}">
        <p class="small"><b>${sonuc}</b></p>
        ${o.ust || ''}
        <div class="ders__etiket tiny mt-10">Çözüm</div>
        <ol class="ders__adimlar">${map(dizi(q.cozum), s => html`<li>${fmt(s)}</li>`)}</ol>
        <div class="row wrap gap-6 mt-10">${o.eylemler || ''}</div>
      </div>`)}
    </div>`;
  }

  /* Çözümden sonra: koça sor, karta çevir, yanlışsa deftere ekle. Karma
     ve yeniden çözümde soru, kimliğiyle (data-k: tm-05#2) bilinir. */
  function soruEylemleri(s, v, k){
    const data = k ? { 'data-k':k } : {};
    const yanlis = !!(v && !v.bak && v.h && v.h !== s.q.dogru);
    const defterde = yanlis && O().deftere(s.subject.id, s.topic.id, s.i);
    return html`
      ${K.Button({ label:'Koça sor', icon:'zap', size:'sm', tone:'ghost', act:'soru-koca', data })}
      ${K.Button({ label:'Karta çevir', icon:'cards', size:'sm', tone:'ghost', act:'soru-kart', data })}
      ${when(yanlis, () => defterde
        ? K.Chip('yanlış defterinde')
        : K.Button({ label:'Yanlış defterine ekle', icon:'list', size:'sm', tone:'ghost', act:'soru-defter',
            data:Object.assign({ 'data-h':v.h }, data) }))}`;
  }

  /* ---------- Bu konu ---------- */

  function soruKarti(x){
    const { subject, topic } = x;
    const { l, i } = soruNo(x);
    if(!l.length){
      return K.Card({ wide:true,
        body:html`${kartBasi('Örnek sorular')}${K.Empty({ icon:'search', text:'Bu konunun örnek soruları henüz yazılmadı.',
          action:K.Button({ label:'Koç bir soru sorsun', size:'sm', act:'ogren-git',
            data:{ 'data-route':'koc', 'data-subject':subject.id, 'data-topic':topic.id } }) })}` });
    }
    const q = l[i], c = O().cevaplar(subject.id, topic.id), v = c[i] || null;
    const sk = O().skor(subject.id, topic.id);
    const acik = !!v;
    const sonMu = i === l.length - 1;
    const sonraki = O().komsu(subject.id, topic.id, 1);
    return K.Card({ wide:true,
      body:html`
        ${kartBasi('Örnek sorular', sk.cevaplanan ? sk.dogru + ' / ' + sk.toplam + ' doğru · ölçüldü' : sk.toplam + ' soru · ilk cevabın sayılır',
          when(sk.cevaplanan, () => K.Button({ label:'Baştan çöz', icon:'refresh', size:'sm', tone:'ghost', act:'soru-sifirla' })))}
        ${noktalar(l.length, i, k => durumOf(l[k], c[k]), 'soru-git')}
        ${soruGovdesi(q, v, { etiket:'Soru ' + (i + 1) + ' / ' + l.length, seviye:O().seviye(topic.id, i),
          ipucu:'konu:' + topic.id + '#' + i, cevapAct:'soru-cevap', bakAct:'soru-bak',
          eylemler:soruEylemleri({ subject, topic, i, q }, v, null) })}
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

  /* ---------- Karma test ---------- */

  function kapsamAdi(k){
    const s = R.SUBJECTS.find(x => x.id === (k && k.ders));
    return (s ? s.name : 'Bütün dersler') + ' · ' + (k && k.konular === 'okunan' ? 'okuduğum konular' : 'bütün konular')
      + (k && k.seviye === 'sinav' ? ' · sınav tarzı' : '');
  }
  const tarihAdi = iso => { try{ return U.fmtShort(String(iso).slice(0, 10)); }catch(e){ return String(iso).slice(0, 10); } };
  const DERSLER = () => [{ value:'hepsi', label:'Bütün dersler' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));
  /* Seçilmemişse kapsam: okuduğun konularda yeterli soru varsa onlar. */
  function karmaKapsami(){
    const ders = S.ui.karmaDers || 'hepsi';
    const okunan = T().havuz({ ders, konular:'okunan' }).length;
    return { ders, okunan, konular:S.ui.karmaKonular || (okunan >= T().EN_AZ ? 'okunan' : 'hepsi'),
      seviye:S.ui.karmaSeviye === 'sinav' ? 'sinav' : 'hepsi' };
  }

  function karmaKurulum(){
    const k = karmaKapsami();
    const hepsi = T().havuz({ ders:k.ders, konular:'hepsi' }).length;
    const boy = T().BOYLAR.indexOf(Number(S.ui.karmaBoy)) >= 0 ? Number(S.ui.karmaBoy) : T().BOYLAR[0];
    return K.Card({ wide:true,
      body:html`${kartBasi('Karma test', 'Konular karışık gelir; her sorunun ilk cevabı sayılır')}
        <div class="ogr-kurulum">
          ${K.Field({ label:'Ders', input:K.Select({ id:'karma-ders', options:DERSLER(), value:k.ders, change:'karma-ders', aria:'Ders' }) })}
          <div><span class="ders__etiket tiny">Konular</span>${K.Segmented({ act:'karma-konular', value:k.konular, aria:'Konular', items:[
            { value:'okunan', label:'Okuduklarım · ' + k.okunan }, { value:'hepsi', label:'Hepsi · ' + hepsi }] })}</div>
          <div><span class="ders__etiket tiny">Seviye</span>${K.Segmented({ act:'karma-seviye', value:k.seviye, aria:'Seviye', items:[
            { value:'hepsi', label:'Hepsi' }, { value:'sinav', label:'Sınav tarzı · ' + T().havuz({ ders:k.ders, konular:k.konular, seviye:'sinav' }).length }] })}</div>
          <div><span class="ders__etiket tiny">Soru sayısı</span>${K.Segmented({ act:'karma-boy', value:boy, aria:'Soru sayısı',
            items:T().BOYLAR.map(n => ({ value:n, label:String(n) })) })}</div>
        </div>
        <div class="mt-16">${K.Button({ label:'Testi başlat', icon:'right', tone:'primary', act:'karma-baslat' })}</div>
        <p class="tiny dim mt-12">Seçeneklerdeki sayı havuzdaki soru sayısıdır. Sonuç yalnız burada ölçüm olarak durur: plan, kapanış
          ve konunun örnek soru kaydı ona bakmaz. Yarım kalan test, uygulamayı kapatsan da kaldığın sorudan sürer.</p>` });
  }

  function gecmisKarti(){
    const l = T().gecmis();
    if(!l.length) return null;
    return K.Card({ title:'Geçmiş testler', sub:U.plural(l.length, 'test', 'test') + ' · ölçüldü',
      body:html`<div class="list list--sik">${map(l.slice(0, 8), t => html`<button class="listitem listitem--tap ogr-konu" data-act="karma-sonuc" data-id="${t.id}">
        <span class="grow minw0"><span class="small strong">${t.dogru} / ${t.toplam} doğru</span>
          <span class="tiny dim">${tarihAdi(t.at)} · ${kapsamAdi(t.kapsam)}${t.bos ? ' · ' + t.bos + ' boş' : ''}</span></span>
        <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span></button>`)}</div>` });
  }

  function karmaSoruKarti(){
    const a = T().aktif(), y = T().siradaki(), sy = T().say(a);
    const sonMu = y.sira === y.toplam - 1;
    const durum = k => { const s = T().soruOf(a.sorular[k]); return s ? durumOf(s.q, a.cevaplar[k]) : 'bos'; };
    const bas = kartBasi('Karma test', kapsamAdi(a.kapsam) + ' · ' + sy.cevaplanan + ' / ' + sy.toplam + ' cevaplandı',
      K.Button({ label:'Vazgeç', size:'sm', tone:'ghost', act:'karma-vazgec' }));
    const nav = html`<div class="row between wrap gap-6 mt-16">
      ${y.sira > 0 ? K.Button({ label:'Önceki', icon:'left', size:'sm', tone:'ghost', act:'test-git', data:{ 'data-i':String(y.sira - 1) } }) : html`<span></span>`}
      ${!sonMu ? K.Button({ label:'Sonraki soru', icon:'right', size:'sm', tone:y.v ? 'primary' : null, act:'test-git', data:{ 'data-i':String(y.sira + 1) } })
        : K.Button({ label:'Testi bitir', icon:'check', size:'sm', tone:'primary', act:'karma-bitir' })}
    </div>`;
    const erken = when(!sonMu, () => html`<div class="mt-10">${K.Button({ label:'Testi şimdi bitir', size:'sm', tone:'ghost', act:'karma-bitir' })}</div>`);
    if(!y.s){
      return K.Card({ wide:true, body:html`${bas}${noktalar(y.toplam, y.sira, durum, 'test-git')}
        ${K.Notice({ tone:'info', body:'Bu soru içerikten kaldırıldı; boş sayılır.' })}${nav}${erken}` });
    }
    const ust = y.v ? html`<p class="tiny dim mt-6">Konu: ${y.s.subject.name} · ${y.s.topic.name}</p>` : '';
    return K.Card({ wide:true,
      body:html`${bas}
        ${noktalar(y.toplam, y.sira, durum, 'test-git')}
        ${soruGovdesi(y.s.q, y.v, { etiket:'Soru ' + (y.sira + 1) + ' / ' + y.toplam, seviye:O().seviye(y.s.topic.id, y.s.i),
          ipucu:'test:' + a.id + '#' + y.sira, cevapAct:'test-cevap', bakAct:'test-bak',
          ust, eylemler:soruEylemleri(y.s, y.v, y.s.k) })}
        ${nav}${erken}` });
  }

  function karmaSonucKarti(oz){
    return K.Card({ wide:true,
      body:html`${kartBasi('Test sonucu', tarihAdi(oz.at) + ' · ' + kapsamAdi(oz.kapsam) + ' · ölçüldü',
          K.Button({ label:'Yeni test', size:'sm', tone:'ghost', act:'karma-yeni' }))}
        <div class="ogr-sayilar">
          ${K.Stat({ label:'Doğru', value:oz.dogru, unit:' / ' + oz.toplam })}
          ${K.Stat({ label:'Yanlış', value:oz.yanlis })}
          ${K.Stat({ label:'Boş', value:oz.bos })}
          ${K.Stat({ label:'Çözüme bakıldı', value:oz.bakildi })}
        </div>
        ${when(oz.konular.length, () => html`<div class="ders__etiket tiny mt-16">Konu konu · yanlışı olan önce</div>
          <div class="list list--sik" data-raf-tam>${map(oz.konular, k => html`<div class="listitem ogr-konu">
            <span class="${cls('ogr-konu__no', k.dogru === k.n ? 'is-tamam' : 'is-eksik')}" aria-hidden="true">${raw(UI.icon(k.dogru === k.n ? 'check' : 'close'))}</span>
            <span class="grow minw0"><span class="small strong ogr-konu__ad">${k.topic.name}</span>
              <span class="tiny dim">${k.subject.name} · ${k.dogru} / ${k.n} doğru</span></span>
            ${when(k.dogru < k.n, () => K.Button({ label:'Anlatım', size:'sm', tone:'ghost', act:'ogren-git',
              data:{ 'data-route':'anlatim', 'data-subject':k.subject.id, 'data-topic':k.topic.id } }))}
          </div>`)}</div>`)}
        ${when(oz.yanlis + oz.bakildi, () => html`<div class="mt-16">${K.Button({ label:'Yanlışları yeniden çöz', icon:'right', tone:'primary', size:'sm',
          act:'sorular-kip', data:{ 'data-tab':'yanlis' } })}</div>`)}
        <p class="tiny dim mt-12">Bu sonuç bir ölçümdür; plan ve kapanış ona bakmaz. Boş bırakılan soru yanlış sayılmaz.</p>` });
  }

  function karmaKip(){
    if(T().aktif()) return [karmaSoruKarti()];
    const sid = S.ui.karmaSonuc;
    const oz = sid ? T().gecmis().find(t => t.id === sid) : null;
    return oz ? [karmaSonucKarti(oz), gecmisKarti()] : [karmaKurulum(), gecmisKarti()];
  }

  /* ---------- Yanlışlarım ---------- */

  /* Sıradaki yanlış: en eski deneme önce — yeniden yanlış çözülen soru
     en yeni olur ve sıranın sonuna gider, aynı iki soru arasında dönülmez. */
  const enEski = l => l.reduce((a, b) => (b.son.at < a.son.at ? b : a), l[0]);
  function kisaSoru(q){
    const kok = O().duzMetin(q.soru).split('\n').pop();
    return kok.length > 90 ? kok.slice(0, 89).replace(/\s+\S*$/, '') + '…' : kok;
  }

  function yanlisListesi(){
    const ders = S.ui.yanlisDers || 'hepsi';
    const l = T().yanlislar(ders);
    const hepsi = ders === 'hepsi' ? l.length : T().yanlislar().length;
    return K.Card({ title:'Yanlışlarım', wide:true,
      sub:l.length ? U.plural(l.length, 'soru', 'soru') + ' · son denemesi doğru olmayanlar' : null,
      actions:when(hepsi, () => K.Select({ id:'yanlis-ders', options:DERSLER(), value:ders, change:'yanlis-ders', aria:'Ders', size:'sm' })),
      body:l.length ? html`<div class="stack-sm">
          <div>${K.Button({ label:'Sırayla çöz', icon:'right', tone:'primary', size:'sm', act:'tekrar-ac', data:{ 'data-k':enEski(l).k } })}</div>
          <div class="list list--sik" data-raf-tam>${map(l, y => html`<button class="listitem listitem--tap ogr-konu" data-act="tekrar-ac" data-k="${y.k}">
            <span class="ogr-konu__no num" aria-hidden="true">${y.i + 1}</span>
            <span class="grow minw0"><span class="small strong ogr-konu__ad">${y.topic.name}</span>
              <span class="tiny ogr-konu__ad">${kisaSoru(y.q)}</span>
              <span class="tiny dim">${y.subject.name} · ${y.son.bak ? 'çözüme bakıldı' : 'cevabın ' + y.son.h} · ${KAYNAK_AD[y.son.kaynak]} · ${tarihAdi(y.son.at)}</span></span>
            <span class="ogr-konu__ok" aria-hidden="true">${raw(UI.icon('right'))}</span></button>`)}</div>
          <p class="tiny dim">Bir soru yeniden doğru çözülünce listeden düşer; ilk ölçüm silinmez.</p></div>`
        : K.Empty({ icon:'check', text:hepsi ? 'Bu derste yanlışın yok.'
            : 'Yanlışın yok. Konu sorularında ya da karma testte yanlış çözdüğün, çözümüne baktığın sorular burada toplanır.' }) });
  }

  function tekrarKarti(){
    const t = S.ui.ogrTekrar;
    const s = t && T().soruOf(t.k);
    if(!s){ S.ui.ogrTekrar = null; return yanlisListesi(); }
    const v = t.h ? { h:t.h, ip:t.ip } : null;
    const kalan = T().yanlislar(S.ui.yanlisDers || 'hepsi').filter(y => y.k !== t.k);
    return K.Card({ wide:true,
      body:html`${kartBasi('Yeniden çöz', s.subject.name + ' · ' + s.topic.name + (kalan.length ? ' · ' + kalan.length + ' yanlış daha' : ''),
          K.Button({ label:'Listeye dön', size:'sm', tone:'ghost', act:'tekrar-kapat' }))}
        ${soruGovdesi(s.q, v, { etiket:'Soru ' + (s.i + 1), seviye:O().seviye(s.topic.id, s.i), ipucu:'tekrar:' + s.k, cevapAct:'tekrar-cevap',
          ust:v && v.h === s.q.dogru ? html`<p class="tiny dim mt-6">Doğru çözdün: Yanlışlarım’dan düştü.</p>` : '',
          eylemler:soruEylemleri(s, v, s.k) })}
        ${when(v, () => html`<div class="row between wrap gap-6 mt-16">
          ${K.Button({ label:'Anlatım', icon:'book', size:'sm', tone:'ghost', act:'ogren-git',
            data:{ 'data-route':'anlatim', 'data-subject':s.subject.id, 'data-topic':s.topic.id } })}
          ${kalan.length ? K.Button({ label:'Sıradaki yanlış', icon:'right', size:'sm', tone:'primary', act:'tekrar-ac', data:{ 'data-k':enEski(kalan).k } })
            : K.Button({ label:'Listeye dön', size:'sm', tone:'primary', act:'tekrar-kapat' })}
        </div>`)}` });
  }

  function yanlisKip(){ return [S.ui.ogrTekrar ? tekrarKarti() : yanlisListesi()]; }

  /* ---------- ekran ---------- */

  function kipSekmeleri(kip){
    const a = T().aktif(), n = T().yanlislar().length;
    return K.Subtabs({ act:'sorular-kip', value:kip, aria:'Soru kipi', items:[
      { id:'konu', label:'Bu konu' },
      { id:'karma', label:'Karma test', count:a ? T().say(a).cevaplanan + '/' + a.sorular.length : null },
      { id:'yanlis', label:'Yanlışlarım', count:n || null },
    ] });
  }
  const kipOf = () => ['konu', 'karma', 'yanlis'].indexOf(S.ui.ogrenKip) >= 0 ? S.ui.ogrenKip : 'konu';

  /* Bir sorunun kimliği: data-k varsa o (karma, yeniden çözüm), yoksa
     bu konunun ekrandaki sorusu. */
  function soruRef(el){
    const k = el && el.dataset && el.dataset.k;
    if(k){ const s = T().soruOf(k); return s ? { subject:s.subject, topic:s.topic, i:s.i, q:s.q } : null; }
    const x = O().secili();
    if(!x.topic) return null;
    const { l, i } = soruNo(x);
    return l[i] ? { subject:x.subject, topic:x.topic, i, q:l[i] } : null;
  }

  R.Screens.sorular = {
    id:'sorular',
    title:'Sorular',
    subtitle(){
      const kip = kipOf();
      if(kip === 'karma') return 'Konular karışık; sonuç konu konu';
      if(kip === 'yanlis') return 'Yanlış çözdüklerini yeniden çöz';
      const x = O().secili(); return x.topic ? x.subject.name + ' · ' + x.topic.name : 'Örnek sorular';
    },
    actions(){ return ''; },
    async render(){
      const kip = kipOf();
      const sekme = raw(kipSekmeleri(kip));
      if(kip === 'karma') return String(K.Grid([K.Span(12, K.Stack([sekme].concat(karmaKip())))]));
      if(kip === 'yanlis') return String(K.Grid([K.Span(12, K.Stack([sekme].concat(yanlisKip())))]));
      const x = await hazirla();
      if(!x.topic) return String(K.Card({ body:K.Empty({ icon:'search', text:'Konu yok.' }) }));
      return String(K.Grid([K.Span(12, K.Stack([sekme, raw(konuCubugu(x)), soruKarti(x)]))]));
    },
    handle:Object.assign({}, ortakHandle, {
      /* Bu konu */
      async 'soru-git'(el){ S.ui.ogrenSoru = Number(el.dataset.i) || 0; R.App.render(); },
      async 'soru-cevap'(el){
        const x = O().secili(), { i } = soruNo(x);
        await O().cevapla(x.subject.id, x.topic.id, i, el.dataset.harf, S.ui.ipucu === 'konu:' + x.topic.id + '#' + i);
        R.App.render();
      },
      async 'soru-ipucu'(el){ S.ui.ipucu = el.dataset.ip || null; R.App.render(); },
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
      /* Üç kipte ortak: soruyu koça, karta, deftere. */
      async 'soru-koca'(el){
        const r = soruRef(el);
        if(!r) return;
        const d = O().duzMetin, q = r.q;
        await O().sec(r.subject.id, r.topic.id);
        S.ui.kocParca = { etiket:'Soru ' + (r.i + 1), metin:d(q.soru) + '\n' + q.sec.map((m, k) => O().HARFLER[k] + ') ' + d(m)).join('\n')
          + '\nDoğru cevap: ' + q.dogru + '\nUygulamadaki çözüm: ' + dizi(q.cozum).map(d).join(' ') };
        S.ui.kocTaslak = 'Bu sorunun çözümünü anlamadım; adım adım, başka bir yoldan anlat.';
        R.App.go('koc');
      },
      async 'soru-kart'(el){
        const r = soruRef(el), y = r && O().kartYuzu(r.topic.id, r.i);
        if(!y) return;
        const card = R.Model.newCard({ front:y.front, back:y.back, subjectId:r.subject.id, topic:r.topic.name, source:'ogren' });
        await R.Model.saveCard(card);
        UI.toast('Karta çevrildi · Tekrar’da sorar');
      },
      async 'soru-defter'(el){
        const r = soruRef(el);
        if(!r) return;
        const e = await O().yanlisaEkle(r.subject.id, r.topic.id, r.i, el.dataset.h || null);
        UI.toast(e ? 'Yanlış defterine eklendi · kök nedenini orada yaz' : 'Eklenemedi');
        R.App.render();
      },
      /* Karma test */
      async 'karma-konular'(el){ S.ui.karmaKonular = el.dataset.value; R.App.render(); },
      async 'karma-seviye'(el){ S.ui.karmaSeviye = el.dataset.value; R.App.render(); },
      async 'karma-boy'(el){ S.ui.karmaBoy = Number(el.dataset.value) || T().BOYLAR[0]; R.App.render(); },
      async 'karma-baslat'(){
        const k = karmaKapsami();
        const r = await T().baslat({ ders:k.ders, konular:k.konular, seviye:k.seviye }, S.ui.karmaBoy || T().BOYLAR[0]);
        if(!r.ok){ UI.toast(r.metin, { life:6000 }); return; }
        S.ui.karmaSonuc = null;
        window.scrollTo(0, 0);
        R.App.render();
      },
      async 'test-git'(el){ await T().git(Number(el.dataset.i) || 0); R.App.render(); },
      async 'test-cevap'(el){
        const y = T().siradaki(), a = T().aktif();
        if(y) await T().cevapla(y.sira, el.dataset.harf, S.ui.ipucu === 'test:' + a.id + '#' + y.sira);
        R.App.render();
      },
      async 'test-bak'(){ const y = T().siradaki(); if(y) await T().bak(y.sira); R.App.render(); },
      async 'karma-bitir'(){
        const a = T().aktif();
        if(!a) return;
        const bos = T().say(a).bos;
        const bitir = async () => { const oz = await T().bitir(); S.ui.karmaSonuc = oz ? oz.id : null; window.scrollTo(0, 0); R.App.render(); };
        if(!bos) return bitir();
        UI.confirmSheet('Testi bitir', U.plural(bos, 'soru', 'soru') + ' cevapsız: boş sayılır, yanlış sayılmaz.', bitir, false, 'Bitir');
      },
      async 'karma-vazgec'(){
        UI.confirmSheet('Testten vazgeç', 'Bu test silinir; geçmişe hiçbir şey yazılmaz.',
          async () => { await T().vazgec(); R.App.render(); }, true, 'Vazgeç');
      },
      async 'karma-sonuc'(el){ S.ui.karmaSonuc = el.dataset.id; window.scrollTo(0, 0); R.App.render(); },
      async 'karma-yeni'(){ S.ui.karmaSonuc = null; R.App.render(); },
      /* Yanlışlarım */
      async 'tekrar-ac'(el){ S.ui.ogrTekrar = { k:el.dataset.k, h:null }; window.scrollTo(0, 0); R.App.render(); },
      async 'tekrar-kapat'(){ S.ui.ogrTekrar = null; R.App.render(); },
      async 'tekrar-cevap'(el){
        const t = S.ui.ogrTekrar;
        if(!t || t.h) return;
        const ip = S.ui.ipucu === 'tekrar:' + t.k;
        const r = await T().tekrarCevapla(t.k, el.dataset.harf, ip);
        if(r.ok){ t.h = String(el.dataset.harf).toUpperCase(); t.ip = ip; }
        R.App.render();
      },
    }),
    change:Object.assign({}, ortakChange, {
      async 'karma-ders'(el){ S.ui.karmaDers = el.value; S.ui.karmaKonular = null; R.App.render(); },
      async 'yanlis-ders'(el){ S.ui.yanlisDers = el.value; R.App.render(); },
    }),
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
