/* Analiz — türetilmiş okumalar tek yerde.

   İlerleme ekranı karar verir (KPI, kapı); bu ekran soru sorar:
   ne değişti, hangi konu hangi hatayı üretiyor, hız mı isabet mi,
   uyku ne yapıyor, söylenen kapasite gerçek mi.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'ays.analytics.karsilastirma':'Karşılaştırma',
  'ays.analytics.hata-haritasi':'Hata haritası',
  'ays.analytics.sira-gecmisi':'Sıra geçmişi',
  'ays.analytics.hiz-ve-isabet':'Hız ve isabet',
  'ays.analytics.konu-degeri':'Konu değeri',
  'ays.analytics.aliskanlik':'Alışkanlık',
  'ays.analytics.denetim':'Denetim',
  'ays.analytics.durustluk':'Dürüstlük',
  'ays.analytics.sira-ve-hiz':'Sıra ve hız',
  'ays.analytics.aliskanlik-ve-denetim':'Alışkanlık ve denetim',
  'ays.analytics.deneme-ekle':'Deneme ekle',
  'ays.analytics.i-ki-denemeyi-yan-yana-koy':'İki denemeyi yan yana koy',
  'ays.analytics.onceki':'Önceki',
  'ays.analytics.sonraki':'Sonraki',
  'ays.analytics.once':'Önce',
  'ays.analytics.sonra':'Sonra',
  'ays.analytics.fark':'Fark',
  'ays.analytics.dogruluk':'Doğruluk',
  'ays.analytics.bos':'Boş',
  'ays.analytics.ders-ders-deneme':'Ders ders deneme',
  'ays.analytics.son-net':'Son net',
  'ays.analytics.gidis':'Gidiş',
  'ays.analytics.birakilan':'Bırakılan',
  'ays.analytics.dogru':'Doğru',
  'ays.analytics.son-net-son-uc-denemenin':'Son net: son üç denemenin ortancası; gidiş: deneme başına net (Theil–Sen); bırakılan: soru sayısı − son net.',
  'ays.analytics.bos-birakma':'Boş bırakma',
  'ays.analytics.bos-birakma-stratejisi':'Boş bırakma stratejisi',
  'ays.analytics.ort':'ort. ',
  'ays.analytics.en-iyi-deneme':'En iyi deneme',
  'ays.analytics.en-dusuk':'En düşük',
  'ays.analytics.yayin-etkisi':'Yayın etkisi',
  'ays.analytics.yayin-zorluk-farki':'Yayın zorluk farkı',
  'ays.analytics.fark-2':'fark ',
  'ays.analytics.deneme':'Deneme',
  'ays.analytics.medyan':'Medyan',
  'ays.analytics.sapma':'Sapma',
  'ays.analytics.yanlis-defterine-git':'Yanlış defterine git',
  'ays.analytics.konu-hata-tipi':'Konu × hata tipi',
  'ays.analytics.toplam':'Toplam',
  'ays.analytics.yapiskan-kartlar':'Yapışkan kartlar',
  'ays.analytics.unutuldu':'× unutuldu',
  'ays.analytics.bu-kartlari-yeniden-yaz-tek':'Bu kartları yeniden yaz: tek şey sorsun, cevabı tek cümle olsun.',
  'ays.analytics.yapiskan-kart-yok-kartlarin':'Yapışkan kart yok. Kartların iyi yazılmış.',
  'ays.analytics.tahmini-sira-zaman-icinde':'Tahmini sıra zaman içinde',
  'ays.analytics.son-tahmin':'Son tahmin',
  'ays.analytics.tahmini-puan':'Tahmini puan',
  'ays.analytics.i-lk-tahmin':'İlk tahmin',
  'ays.analytics.degisim':'Değişim',
  'ays.analytics.bant-tablosu':'Bant tablosu',
  'ays.analytics.puan':'Puan',
  'ays.analytics.i-yimser-sira':'İyimser sıra',
  'ays.analytics.kotumser-sira':'Kötümser sıra',
  'ays.analytics.bu-bir-osym-hesabi-degildir':'Bu bir ÖSYM hesabı değildir.',
  'ays.analytics.hiz-isabet-dengesi':'Hız–isabet dengesi',
  'ays.analytics.hedef':'Hedef',
  'ays.analytics.isinma':'Isınma',
  'ays.analytics.i-lk-20-dk':'İlk 20 dk',
  'ays.analytics.sonrasi':'Sonrası',
  'ays.analytics.sureli-deneme-baslat':'Süreli deneme başlat',
  'ays.analytics.sureli-oturumlar':'Süreli oturumlar',
  'ays.analytics.henuz-sureli-deneme-oturumu':'Henüz süreli deneme oturumu yok. ',
  'ays.analytics.isaret':'işaret',
  'ays.analytics.konu-net-katkisi':'Konu net katkısı',
  'ays.analytics.potansiyel':'Potansiyel',
  'ays.analytics.kazanilan':'Kazanılan',
  'ays.analytics.acik':'Açık',
  'ays.analytics.veri-yok':'veri yok',
  'ays.analytics.nasil-hesaplanir':'Nasıl hesaplanır?',
  'ays.analytics.aradaki-fark-o-konuya-ayrila':'Aradaki fark, o konuya ayrılacak zamanın karşılığıdır.',
  'ays.analytics.potansiyel-dersin-soru-sayis':'Potansiyel, dersin soru sayısı ile konunun frekans payından çıkar. Kazanılan, kapanış durumu ve gerçek çözüm doğruluğundan gelir.',
  'ays.analytics.mansetteki-toplam-yalniz-en':'Manşetteki toplam yalnız en az bir kez çalışılmış konuları sayar; hiç çalışılmamış konunun boşluğu tahmindir ve toplama girmez.',
  'ays.analytics.uyku-ve-net':'Uyku ve net',
  'ays.analytics.yeterli-uyku':'Yeterli uyku',
  'ays.analytics.yetersiz-uyku':'Yetersiz uyku',
  'ays.analytics.unutma-egrisi':'Unutma eğrisi',
  'ays.analytics.tekrar':'Tekrar',
  'ays.analytics.hatirlama':'Hatırlama',
  'ays.analytics.kapasite-gerceklik-kontrolu':'Kapasite gerçeklik kontrolü',
  'ays.analytics.yazdigin':'Yazdığın',
  'ays.analytics.calistigin':'Çalıştığın',
  'ays.analytics.kapasiteyi-duzelt':'Kapasiteyi düzelt',
  'ays.analytics.dikkat-dagilmasi':'Dikkat dağılması',
  'ays.analytics.denetim-defteri':'Denetim defteri',
  'ays.analytics.bu-sayfa-gerekli-mi':'Bu sayfa gerekli mi?',
  'ays.analytics.acik-soru':'Açık soru',
  'ays.analytics.sayi':'Sayı',
  'ays.analytics.adet':'Adet',
  'ays.analytics.ayrisma-kapandi':'Ayrışma kapandı',
  'ays.analytics.surtunme':'Sürtünme',
  'ays.analytics.yonetim':'Yönetim',
  'ays.analytics.dk-gun':'dk/gün',
  'ays.analytics.calisma':'Çalışma',
  'ays.analytics.yonetim-payi':'Yönetim payı',
  'ays.analytics.gosterge-ayrismasi':'Gösterge ayrışması',
  'ays.analytics.yon-sutunu-sonucun-hangi-tar':'«Yön» sütunu sonucun hangi tarafa gitmesinin iyi sayıldığını söyler. Yönü tanımsız bir çift değerlendirilmez: sistem yüksek olanın iyi olduğunu VARSAYMAZ.',
  'ays.analytics.pencere':'Pencere ',
  'ays.analytics.asgari-caba-her-cift-icin':'Asgari çaba her çift için ayrıdır. Bu sayılar bir bulgu değil bu yazılımın ayarıdır:',
  'ays.analytics.ayrisma-yok-nobetcinin-konus':'Ayrışma yok. Nöbetçinin konuşmadığı gün, iyi gündür.',
  'ays.analytics.kalibrasyon':'Kalibrasyon',
  'ays.analytics.tahmin-kor-yazilir-net-ekran':'Tahmin KÖR yazılır: net ekranda dururken yazılan tahmin, tahmin değil kopyadır.',
  'ays.analytics.kendi-netini-onceden-kestire':'Kendi netini önceden kestirebilmek bir süs değil, sınav becerisidir: hangi testte zaman harcayacağını, hangi soruyu bırakacağını ve bir denemenin kötü mü yoksa zor mu olduğunu o kestirim söyler.',
  'ays.analytics.defter-kendini-tanimayi-olcm':'Defter «kendini tanımayı» ölçmez: yalnızca kayıtlı türlerde kör tahminlerinin kayıtlı sayıya ne kadar yaklaştığını ölçer. Net ile dakika ayrı ailelerdir, tek ortalamada toplanmazlar.',
  'ays.analytics.ne-tahmin-ediyorsun':'Ne tahmin ediyorsun?',
  'ays.analytics.tahmin-turu':'Tahmin türü',
  'ays.analytics.tahmini-kaydet':'Tahmini kaydet',
  'ays.analytics.kapat':'Kapat',
  'ays.analytics.tahmin':'Tahmin',
  'ays.analytics.gercek':'Gerçek',
  'ays.analytics.bakim-borcu':'Bakım borcu',
  'ays.analytics.ac':'Aç',
  'ays.analytics.veri-dolulugu':'Veri doluluğu',
  'ays.analytics.ays':'AYS',
  'ays.analytics.bu-haftanin-birikimi':'Bu haftanın birikimi',
  'ays.analytics.haftalik-soru':'Haftalık soru',
  'ays.analytics.calisma-saatlerin':'Çalışma saatlerin',
  'ays.analytics.bitmis-bloklarin-basladigi-s':'Bitmiş blokların başladığı saatler; en çok ',
  'ays.analytics.analiz-bolumleri':'Analiz bölümleri',
  'ays.analytics.tahmin-deftere-yazildi':'Tahmin deftere yazıldı',
  'ays.analytics.ayrintili-analiz':'Ayrıntılı analiz',
});
window.LIFEOS.PARCA.sayfa({ id:'analytics', modul:'ays', cekmece:'analiz', ad:'Ayrıntı', ikon:'search', sira:30 });

R.Screens.analytics = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const A = () => R.Analytics;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const TABS = [
    { id:'compare', label:yz('ays.analytics.karsilastirma') },
    { id:'errors',  label:yz('ays.analytics.hata-haritasi') },
    { id:'rank',    label:yz('ays.analytics.sira-gecmisi') },
    { id:'speed',   label:yz('ays.analytics.hiz-ve-isabet') },
    { id:'value',   label:yz('ays.analytics.konu-degeri') },
    { id:'habits',  label:yz('ays.analytics.aliskanlik') },
    { id:'denetim', label:yz('ays.analytics.denetim') },
    { id:'durust',  label:yz('ays.analytics.durustluk') },
  ];

  /* Sade sekme (2026-10-16, «AYS'de çok şey iç içe, göz kalabalığı»):
     sekiz sekme yan yana duruyordu. Yakın okumalar tek sekmede alt alta:
     sıra ve hız birlikte, kendi verini denetleyen üç okuma birlikte. Hiçbir
     okuma kalkmadı; başka ekrandan eski kimlikle gelen (örn. 'speed')
     içinde bulunduğu sekmeye açılır. */
  const GRUPLAR = [
    { id:'compare', label:yz('ays.analytics.karsilastirma'), ic:['compare'] },
    { id:'errors',  label:yz('ays.analytics.hata-haritasi'), ic:['errors'] },
    { id:'rank',    label:yz('ays.analytics.sira-ve-hiz'), ic:['rank', 'speed'] },
    { id:'value',   label:yz('ays.analytics.konu-degeri'), ic:['value'] },
    { id:'habits',  label:yz('ays.analytics.aliskanlik-ve-denetim'), ic:['habits', 'denetim', 'durust'] },
  ];
  const grupOf = id => GRUPLAR.find(g => g.ic.indexOf(id) >= 0) || null;

  function empty(text, action){
    return K.Card({ body:K.Empty({ icon:'chart', text, action }) });
  }
  /* Bölümler alt alta durduğu için boş durumların eylemi dolu değildir:
     sekiz dolu «Deneme ekle» düğmesi, ekranın tek ana eylemini boğardı
     (sadelik bütçesi: dolu düğme en çok 1). */
  const addExam = K.Button({ label:yz('ays.analytics.deneme-ekle'), size:'sm',
    act:'go', data:{ 'data-route':'exams' } });

  /* ---------- karşılaştırma ---------- */

  function compareTab(){
    const list = S.exams.slice().sort((a, b) => b.date.localeCompare(a.date));
    if(list.length < 2) return empty('Karşılaştırma için en az iki deneme gerekir.', addExam);

    const opts = list.map(e => ({ value:e.id, label:U.fmtShort(e.date)+' · '+e.type }));
    const a = S.ui.compareA || list[1].id;
    const b = S.ui.compareB || list[0].id;
    const cmp = A().compareExams(a, b);

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({ hint:'not-iki-denemeyi-yan-yana-koy', title:yz('ays.analytics.i-ki-denemeyi-yan-yana-koy'),           body:html`
            ${K.Cols(2, [
              K.Field({ label:yz('ays.analytics.onceki'), input:K.Select({ options:opts, value:a, change:'cmp-a' }) }),
              K.Field({ label:yz('ays.analytics.sonraki'), input:K.Select({ options:opts, value:b, change:'cmp-b' }) }),
            ])}` }),

        when(cmp, () => K.Card({
          title:cmp.delta > 0 ? 'Net arttı' : cmp.delta < 0 ? 'Net düştü' : 'Net aynı',
          sub:U.fmtShort(cmp.a.date)+' → '+U.fmtShort(cmp.b.date),
          badge:K.Badge({ label:(cmp.delta > 0 ? '+' : '')+U.fmtNet(cmp.delta)+' net',
            tone:cmp.delta > 0 ? 'ok' : cmp.delta < 0 ? 'danger' : 'muted' }),
          body:html`
            ${K.Table({ tight:true,
              headers:['Test', { label:yz('ays.analytics.once'), num:true }, { label:yz('ays.analytics.sonra'), num:true },
                { label:yz('ays.analytics.fark'), num:true }, { label:yz('ays.analytics.dogruluk'), num:true }, { label:yz('ays.analytics.bos'), num:true }],
              rows:cmp.rows.map(r => [
                r.name,
                html`<span class="num">${r.netA == null ? '—' : U.fmtNet(r.netA)}</span>`,
                html`<span class="num">${r.netB == null ? '—' : U.fmtNet(r.netB)}</span>`,
                html`<span class="${r.delta > 0 ? 'num is-up' : r.delta < 0 ? 'num is-down' : 'num dim'}">${
                  r.delta == null ? '—' : (r.delta > 0 ? '+' : '')+U.fmtNet(r.delta)}</span>`,
                html`<span class="num dim">${r.accA == null ? '—' : '%'+r.accA} → ${r.accB == null ? '—' : '%'+r.accB}</span>`,
                html`<span class="num dim">${r.blankA == null ? '—' : r.blankA} → ${r.blankB == null ? '—' : r.blankB}</span>`,
              ]) })}
            <div class="mt-12">${K.Notice({ tone:'info', body:cmp.note })}</div>` })),
        dersCard(),
      ])),
      K.Span(4, K.Stack([blankCard(), publisherCard(), raw(UI.rail(['median', 'base-score', 'net']))])),
    ]);
  }

  /* Ders ders deneme (core/analytics.js dersAnalizi, Kişi planı Faz 7). */
  function dersCard(){
    const d = A().dersAnalizi('TYT');
    if(!d.ok) return K.Card({ title:yz('ays.analytics.ders-ders-deneme'), body:K.Notice({ tone:'info', body:d.why }) });
    const ok = e => e == null ? html`<span class="num dim">—</span>`
      : html`<span class="${e >= 0.5 ? 'num is-up' : e <= -0.5 ? 'num is-down' : 'num dim'}">${(e > 0 ? '+' : '') + U.fmtNet(e)}</span>`;
    return K.Card({
      title:yz('ays.analytics.ders-ders-deneme'), sub:d.deneme + ' tam TYT denemesinden',
      body:html`
        ${K.Table({ tight:true,
          headers:['Test', { label:yz('ays.analytics.son-net'), num:true }, { label:yz('ays.analytics.gidis'), num:true }, { label:yz('ays.analytics.birakilan'), num:true },
            { label:yz('ays.analytics.dogru'), num:true }, { label:yz('ays.analytics.bos'), num:true }],
          rows:d.rows.map(r => [
            r.test + (r.az ? ' · az veri' : ''),
            html`<span class="num">${U.fmtNet(r.sonMedyan)}</span>`,
            ok(r.egim),
            html`<b class="num ${r.kayip != null && r.kayip >= 8 ? 'is-down' : ''}">${r.kayip == null ? '—' : U.fmtNet(r.kayip)}</b>`,
            html`<span class="num dim">${r.dogruOrani == null ? '—' : '%' + r.dogruOrani}</span>`,
            html`<span class="num dim">${r.bosOrani == null ? '—' : '%' + r.bosOrani}</span>`,
          ]) })}
        <p class="tiny dim mt-8">${d.note} ${yz('ays.analytics.son-net-son-uc-denemenin')}</p>`,
    });
  }

  function blankCard(){
    const b = A().blankStrategy('TYT');
    if(!b.ok) return K.Card({ title:yz('ays.analytics.bos-birakma'), body:K.Notice({ tone:'info', body:b.why }) });
    return K.Card({
      hint:'not-bos-birakma-stratejisi', title:yz('ays.analytics.bos-birakma-stratejisi'),       badge:K.Badge({ label:yz('ays.analytics.ort')+b.avgBlank+' boş', tone:'muted' }),
      body:html`
        ${K.Cols(2, [
          K.Stat({ label:yz('ays.analytics.en-iyi-deneme'), value:U.fmtNet(b.best.net), note:b.best.blank+' boş' }),
          K.Stat({ label:yz('ays.analytics.en-dusuk'), value:U.fmtNet(b.worst.net), note:b.worst.blank+' boş' }),
        ])}
        <div class="mt-12">${K.Notice({ tone:b.dir === 'same' || b.dir === 'az-veri' ? 'info' : 'ok', body:b.note })}</div>
        <p class="tiny dim mt-8">${b.kapsam}</p>`,
    });
  }

  function publisherCard(){
    const p = A().publisherAdjust('TYT');
    if(!p.ok) return K.Card({ title:yz('ays.analytics.yayin-etkisi'), body:K.Notice({ tone:'info', body:p.why }) });
    return K.Card({
      hint:'not-yayin-zorluk-farki', title:yz('ays.analytics.yayin-zorluk-farki'),       badge:K.Badge({ label:yz('ays.analytics.fark-2')+U.fmtNet(p.spread), tone:p.spread >= 6 ? 'warn' : 'muted' }),
      body:html`
        ${K.Table({ tight:true, headers:['Yayın', { label:yz('ays.analytics.deneme'), num:true },
          { label:yz('ays.analytics.medyan'), num:true }, { label:yz('ays.analytics.sapma'), num:true }],
          rows:p.rows.map(r => [r.publisher, r.count,
            html`<span class="num">${U.fmtNet(r.median)}</span>`,
            html`<span class="${r.offset > 0 ? 'num is-up' : r.offset < 0 ? 'num is-down' : 'num dim'}">${
              (r.offset > 0 ? '+' : '')+U.fmtNet(r.offset)}</span>`]) })}
        <p class="tiny dim mt-10">${p.note}</p>`,
    });
  }

  /* ---------- hata haritası ---------- */

  function errorsTab(){
    const h = A().errorHeatmap(14);
    if(!h.rows.length) return empty('Yanlış defterine kayıt girildikçe konu × hata haritası burada oluşur.',
      K.Button({ label:yz('ays.analytics.yanlis-defterine-git'), size:'sm', tone:'primary', act:'go', data:{ 'data-route':'cards' } }));

    const cell = (v) => {
      if(!v) return html`<span class="heat heat--0">·</span>`;
      const lvl = h.max <= 1 ? 3 : Math.max(1, Math.min(4, Math.ceil(4 * v / h.max)));
      return html`<span class="heat heat--${lvl}">${v}</span>`;
    };

    return K.Grid([
      K.Span(8, K.Card({
        hint:'not-konu-hata-tipi', title:yz('ays.analytics.konu-hata-tipi'),         body:html`
          ${K.Table({ tight:true,
            headers:['Konu'].concat(h.tags.map(t => ({ label:t, num:true })))
              .concat([{ label:yz('ays.analytics.toplam'), num:true }]),
            rows:h.rows.map(r => [
              html`<span class="small">${r.topic}</span>`,
            ].concat(h.tags.map(t => cell(r.cells[t])))
              .concat([html`<b class="num">${r.total}</b>`])) })}
          <div class="mt-12">${K.Notice({ tone:'info',
            body:'K kavram, İ işlem, Y yorum, S süre, D dikkat. Bir konuda İ baskınsa çözüm '
               + 'daha çok konu tekrarı değil, işlem rutini kurmaktır.' })}</div>`,
      })),
      K.Span(4, K.Stack([leechCard(), raw(UI.rail(['pareto', 'error-tags', 'notebook']))])),
    ]);
  }

  function leechCard(){
    const rows = A().leechCards(4);
    return K.Card({
      hint:'not-yapiskan-kartlar', title:yz('ays.analytics.yapiskan-kartlar'),       badge:rows.length ? K.Badge({ label:String(rows.length), tone:'warn' }) : null,
      body:rows.length
        ? html`<div class="stack-xs">${map(rows.slice(0, 8), c => html`
            <div class="row between">
              <span class="small truncate">${c.front}</span>
              <span class="tiny dim num">${c.forgot}${yz('ays.analytics.unutuldu')}</span>
            </div>`)}</div>
          <p class="tiny dim mt-10">${yz('ays.analytics.bu-kartlari-yeniden-yaz-tek')}</p>`
        : K.Empty({ icon:'cards', text:yz('ays.analytics.yapiskan-kart-yok-kartlarin') }),
    });
  }

  /* ---------- sıra geçmişi ---------- */

  function rankTab(){
    const hist = A().rankHistory();
    if(hist.length < 2) return empty('Sıra geçmişi için en az dört tam deneme gerekir.', addExam);

    const target = (S.profile && S.profile.targetRank) || R.PROGRAM.refRank;
    const series = hist.map(h => h.score);
    const labels = hist.map(h => U.fmtShort(h.date));
    const last = hist[hist.length-1];
    const first = hist[0];
    const moved = last.rank && first.rank ? first.rank - last.rank : 0;

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({
          title:yz('ays.analytics.tahmini-sira-zaman-icinde'), hint:'estimate',
          badge:raw(UI.provenance('estimate')),
          body:html`
            ${when((window.LIFEOS || {}).GRAFIK, () => {
              const G = window.LIFEOS.GRAFIK;
              const netler = C.fullExams('TYT').map(M.examNet);
              return html`<div class="sira-bas">
                ${raw(G.aralikHtml({ etiket:yz('ays.analytics.son-tahmin'), alt:last.rankBest, ust:last.rankWorst, olasi:last.rank,
                  min:1, max:Math.round(Math.max(first.rankWorst || 0, last.rankWorst || 0, target) * 1.15), ters:true,
                  dayanak:hist.length + 2, dayanakBirim:'tam deneme' }))}
                ${raw(G.egilimHtml(netler, { yon:'artis-iyi', birim:'net' }))}</div>
                ${raw(G.cumleHtml(series.map(v => ({ deger:v })), { etiket:yz('ays.analytics.tahmini-puan'), gunMetni:'son ' + series.length + ' tahminde', birim:'puan' }))}`;
            })}
            ${raw(UI.lineChart([{ data:series }], { labels, height:210 }))}
            ${K.Cols(3, [
              K.Stat({ label:yz('ays.analytics.i-lk-tahmin'), value:U.fmtNum(first.rank), note:U.fmtShort(first.date) }),
              K.Stat({ label:yz('ays.analytics.son-tahmin'), value:U.fmtNum(last.rank), note:U.fmtShort(last.date),
                tone:last.rank <= target ? 'ok' : null }),
              K.Stat({ label:yz('ays.analytics.degisim'), value:(moved > 0 ? '−' : '+')+U.fmtNum(Math.abs(moved)),
                note:moved > 0 ? 'sıra iyileşti' : 'sıra geriledi',
                tone:moved > 0 ? 'ok' : moved < 0 ? 'warn' : null }),
            ])}` }),

        K.Card({ hint:'not-bant-tablosu', title:yz('ays.analytics.bant-tablosu'),           body:K.Table({ tight:true,
            headers:['Tarih', { label:yz('ays.analytics.puan'), num:true }, { label:yz('ays.analytics.i-yimser-sira'), num:true },
              { label:yz('ays.analytics.kotumser-sira'), num:true }],
            rows:hist.slice().reverse().map(h => [
              U.fmtShort(h.date),
              (window.LIFEOS || {}).GRAFIK
                ? raw(window.LIFEOS.GRAFIK.hucreHtml({ deger:h.score, olcek:560, birim:'puan', kesinlik:'estimated', ondalik:1 }))
                : html`<span class="num">${U.fmtNet(h.score)}</span>`,
              html`<span class="num">${U.fmtNum(h.rankBest)}</span>`,
              html`<span class="num dim">${U.fmtNum(h.rankWorst)}</span>`,
            ]) }) }),
      ])),
      K.Span(4, K.Stack([
        K.Notice({ tone:'warn', title:yz('ays.analytics.bu-bir-osym-hesabi-degildir'),
          body:'Puan standart sapmaya göre normalize edilir ve aday dağılımı her yıl değişir. '
             + 'Buradaki aralık son yılların sonuçlarından çıkarılmış koçluk bandıdır.' }),
        raw(UI.rail(['rank', 'tiers', 'certainty'])),
      ])),
    ]);
  }

  /* ---------- hız ve isabet ---------- */

  function speedTab(){
    const sp = A().speedAccuracy('TYT');
    const w = A().warmup();

    return K.Grid([
      K.Span(7, K.Stack([
        sp.ok
          ? K.Card({ hint:'not-hiz-isabet-dengesi', title:yz('ays.analytics.hiz-isabet-dengesi'),               body:html`
                ${K.Table({ tight:true, headers:['Test', { label:'sn/soru', num:true }, { label:yz('ays.analytics.hedef'), num:true },
                  { label:yz('ays.analytics.dogruluk'), num:true }, 'Profil'],
                  rows:sp.rows.map(r => [
                    r.test,
                    html`<span class="num">${r.secPerQ}</span>`,
                    html`<span class="num dim">${r.hedefSn}</span>`,
                    html`<span class="${r.accuracy >= 70 ? 'num' : 'num is-down'}">%${r.accuracy}</span>`,
                    K.Badge({ label:r.profile === 'ideal' ? 'dengede'
                        : r.profile === 'fast-wrong' ? 'hızlı–isabetsiz'
                        : r.profile === 'slow-right' ? 'doğru–yavaş' : 'karışık',
                      tone:r.profile === 'ideal' ? 'ok' : r.profile === 'mixed' ? 'muted' : 'warn' }),
                  ]) })}
                <div class="stack-xs mt-12">${map(sp.rows.filter(r => r.profile !== 'ideal'), r => html`
                  <div class="small muted"><b>${r.test}:</b> ${r.note}</div>`)}</div>` })
          : empty(sp.why, addExam),

        K.Card({ title:yz('ays.analytics.isinma'), hint:'quiz',           body:w.ok
            ? html`${K.Cols(3, [
                K.Stat({ label:yz('ays.analytics.i-lk-20-dk'), value:'%'+w.early }),
                K.Stat({ label:yz('ays.analytics.sonrasi'), value:'%'+w.late }),
                K.Stat({ label:yz('ays.analytics.fark'), value:(w.diff > 0 ? '+' : '')+w.diff, tone:w.diff >= 15 ? 'warn' : 'ok' }),
              ])}
              <div class="mt-12">${K.Notice({ tone:w.diff >= 15 ? 'warn' : 'ok', body:w.note })}</div>`
            : K.Empty({ icon:'clock', text:w.why,
                action:K.Button({ label:yz('ays.analytics.sureli-deneme-baslat'), size:'sm',
                  act:'go', data:{ 'data-route':'exams' } }) }) }),
      ])),
      K.Span(5, K.Stack([sessionsCard(), raw(UI.rail(['time-drift', 'net']))])),
    ]);
  }

  function sessionsCard(){
    const list = S.sessions.filter(s => s.status === 'done');
    if(!list.length){
      return K.Card({ title:yz('ays.analytics.sureli-oturumlar'),
        body:K.Empty({ icon:'clock', text:yz('ays.analytics.henuz-sureli-deneme-oturumu')
          + 'Deneme ekranından “Süreli oturum” ile başlatabilirsin.' }) });
    }
    return K.Card({
      title:yz('ays.analytics.sureli-oturumlar'), sub:list.length+' prova',
      body:html`<div class="stack-sm">${map(list.slice(0, 6), s => html`
        <div class="row between">
          <div class="minw0">
            <b class="small">${U.fmtShort(s.date)}</b>
            <div class="tiny dim">${U.fmtClock(s.totalSeconds)} · ${s.marks ? s.marks.length : 0} ${yz('ays.analytics.isaret')}</div>
          </div>
          ${K.Badge({ label:(s.overtime > 0 ? '+' : '')+Math.round(s.overtime/60)+' dk',
            tone:s.overtime > 300 ? 'danger' : s.overtime > 0 ? 'warn' : 'ok' })}
        </div>`)}</div>`,
    });
  }

  /* ---------- konu değeri ---------- */

  function valueTab(){
    const rows = A().topicValue(16);
    /* «~X net açık» ONCE etiketsizdi: hic calisilmamis bir konunun
       ("veri yok") boslugu ile olculmus %0 dogrulugun boslugu AYNI
       toplama giriyordu ve rozet bunu kesin bir sayiymis gibi
       sunuyordu. Artik yalnizca DOKUNULMUS konular toplama girer;
       dokunulmamis olanlarin sayisi ayrica soylenir. */
    const dokunulmus = rows.filter(r => r.cert !== 'missing');
    const dokunulmamis = rows.length - dokunulmus.length;
    const totalGap = U.round(U.sum(dokunulmus.map(r => r.gap)), 1);
    return K.Grid([
      K.Span(8, K.Card({
        hint:'not-konu-net-katkisi', title:yz('ays.analytics.konu-net-katkisi'),         badge:K.Badge({ label:'~'+U.fmtNet(totalGap)+' net açık'
          + (dokunulmamis ? ' · ' + dokunulmamis + ' konu hiç çalışılmadı' : ''),
          tone:'warn' }),
        body:html`
          ${K.Table({ tight:true,
            headers:['Konu', 'Ders', { label:yz('ays.analytics.potansiyel'), num:true },
              { label:yz('ays.analytics.kazanilan'), num:true }, { label:yz('ays.analytics.acik'), num:true }],
            rows:rows.map(r => [
              html`<span class="small">${r.topicName}</span>`,
              html`<span class="tiny dim">${r.subjectName}</span>`,
              html`<span class="num dim">${U.fmtNet(r.potential)}</span>`,
              r.cert === 'missing'
                ? html`<span class="num dim tiny">${yz('ays.analytics.veri-yok')}</span>`
                : html`<span class="num">${U.fmtNet(r.earned)}</span>`,
              html`<b class="num ${r.gap > 1 ? 'is-down' : ''}">${U.fmtNet(r.gap)}</b>`,
            ]) })}
          <div class="mt-12">${K.Ayrinti({ etiket:yz('ays.analytics.nasil-hesaplanir'),
            ozet:yz('ays.analytics.aradaki-fark-o-konuya-ayrila'),
            govde:html`<p>${yz('ays.analytics.potansiyel-dersin-soru-sayis')}</p>
              <p>${yz('ays.analytics.mansetteki-toplam-yalniz-en')}</p>` })}</div>`,
      })),
      K.Span(4, raw(UI.rail(['closure', 'risk', 'second-check']))),
    ]);
  }

  /* ---------- alışkanlık ---------- */

  function habitsTab(){
    const sleep = A().sleepImpact();
    const cap = A().capacityReality();
    const curve = A().forgettingCurve();
    const dist = A().distractionTrend();

    return K.Grid([
      K.Span(6, K.Stack([
        K.Card({ title:yz('ays.analytics.uyku-ve-net'), hint:'sleep',           body:sleep.ok
            ? html`${K.Cols(3, [
                K.Stat({ label:yz('ays.analytics.yeterli-uyku'), value:U.fmtNet(sleep.goodMedian), note:sleep.goodCount+' deneme' }),
                K.Stat({ label:yz('ays.analytics.yetersiz-uyku'), value:U.fmtNet(sleep.badMedian), note:sleep.badCount+' deneme' }),
                K.Stat({ label:yz('ays.analytics.fark'), value:(sleep.diff > 0 ? '+' : '')+U.fmtNet(sleep.diff),
                  tone:sleep.diff >= 2 ? 'ok' : null }),
              ])}
              <div class="mt-12">${K.Notice({ tone:'info', body:sleep.note })}</div>`
            : K.Empty({ icon:'moon', text:sleep.why }) }),

        K.Card({ title:yz('ays.analytics.unutma-egrisi'), hint:'srs',           body:curve.ok
            ? html`
              ${K.Table({ tight:true, headers:['Aralık', { label:yz('ays.analytics.tekrar'), num:true }, { label:yz('ays.analytics.hatirlama'), num:true }],
                rows:curve.rows.map(r => [r.gap, r.total,
                  html`<span class="${r.rate >= 70 ? 'num' : 'num is-down'}">%${r.rate}</span>`]) })}
              <p class="tiny dim mt-10">${curve.note}</p>`
            : K.Empty({ icon:'cards', text:curve.note }) }),
      ])),

      K.Span(6, K.Stack([
        K.Card({ hint:'not-kapasite-gerceklik-kontrolu', title:yz('ays.analytics.kapasite-gerceklik-kontrolu'),           badge:cap.ok ? K.Badge({ label:'%'+cap.ratio,
            tone:cap.status === 'gercekci' ? 'ok' : cap.status === 'iyimser' ? 'warn' : 'danger' }) : null,
          body:cap.ok
            ? html`${K.Cols(2, [
                K.Stat({ label:yz('ays.analytics.yazdigin'), value:cap.claimed, unit:' sa' }),
                K.Stat({ label:yz('ays.analytics.calistigin'), value:cap.actualAvg, unit:' sa',
                  tone:cap.ratio >= 85 ? 'ok' : 'warn' }),
              ])}
              <div class="mt-12">${K.Notice({ tone:cap.status === 'gercekci' ? 'ok' : 'warn', body:cap.note })}</div>
              ${when(cap.status !== 'gercekci', () => K.Button({ label:yz('ays.analytics.kapasiteyi-duzelt'), size:'sm',
                class:'mt-10', act:'setup-open' }))}`
            : K.Empty({ icon:'clock', text:cap.why }) }),

        K.Card({ hint:'not-dikkat-dagilmasi', title:yz('ays.analytics.dikkat-dagilmasi'),           body:dist.ok
            ? html`${raw(UI.barChart(dist.rows.map(r => ({ label:U.fmtShort(r.date).split(' ')[0], value:r.count })),
                { goodAt:0 }))}
              <div class="mt-12">${K.Notice({ tone:dist.avg >= 5 ? 'warn' : 'info', body:dist.note })}</div>
              <p class="tiny dim mt-8">${dist.kapsam}</p>`
            : K.Empty({ icon:'warn', text:dist.why }) }),
      ])),
    ]);
  }


  /* ---------------------------------------------------------- dürüstlük

     Bu sekme sistemin KENDİSİNİ ölçer. Üç soru sorar:

       Sürtünme      Sistemi yönetmek, çalışmanın yerine mi geçiyor?
       Ayrışma       Bir gösterge, temsil ettiği şeyden koptu mu?
       Kalibrasyon   Aday kayıtlı türlerde kendi sayısını kestirebiliyor mu?

     Üçü de kötü çıkabilir; bu bir arıza değil, ölçüldüğü için görünür
     olmasıdır. Sınav salonunda hiçbir ekran yoktur — orada yalnızca
     üçüncüsü işe yarar. */


  /* Bu sayfanın KENDİ gerekliliği.

     Gelen eleştiri şuydu: «Nöbetçi kullanıcıya görünmeden kaldırıldığında
     karar kalitesi düşüyor mu? Cevap hayırsa ekran gereksizdir.»

     Cevabı tahmin etmek yerine ölçüyoruz. Asıl iş Bugün ekranına düşen tek
     soruda (core/signals.js); burası o soruların defteri — ve defterin ilk
     satırı, defterin kendisinin işe yarayıp yaramadığı.

     «Kaç anomali yakaladı» bir fayda ölçüsü DEĞİLDİR. Ölçülen şey zincir:
     tespit → farkındalık → cevap → sonraki pencerede ayrışma kapandı mı. */
  function SignalLedger(){
    const e = R.Signals.efficacy();
    const h = R.Signals.screenVerdict();
    const acik = R.Signals.current();
    const kapali = R.Signals.closed().slice(-8).reverse();

    return K.Card({ title:yz('ays.analytics.denetim-defteri'), hint:'signal',
      sub:e.opened ? e.answered + '/' + e.opened + ' cevaplandı' : 'sinyal yok',
      body:html`
        ${K.Notice({ tone:h.level === 'used' ? 'ok' : h.level === 'unknown' ? 'info' : 'warn',
          title:yz('ays.analytics.bu-sayfa-gerekli-mi'), body:h.text })}
        ${when(acik, () => html`<div class="mt-8">${K.Notice({ tone:'info',
          title:yz('ays.analytics.acik-soru'), body:acik.question + ' (Bugün ekranında cevaplanabilir.)' })}</div>`)}
        <div class="mt-12">${K.Table({ tight:true,
          headers:['Zincir', { label:yz('ays.analytics.sayi'), num:true }], rows:[
            ['Açılan sinyal', String(e.opened)],
            ['Görüldü', String(e.seen)],
            ['Cevaplandı', String(e.answered)],
            ['«Bana uymuyor» denildi', String(e.dismissed)],
            ['Kapandı', String(e.closed)],
          ] })}</div>
        ${when(e.cert === 'observed', () => html`<div class="mt-12">${K.Table({ tight:true,
          headers:['Kapanan sinyal', { label:yz('ays.analytics.adet'), num:true }, { label:yz('ays.analytics.ayrisma-kapandi'), num:true }],
          rows:[
            ['Cevaplananlar', String(e.answeredClosed),
              e.answeredRate == null ? '—' : '%' + e.answeredRate],
            ['Cevaplanmayanlar', String(e.unansweredClosed),
              e.unansweredRate == null ? '—' : '%' + e.unansweredRate],
          ] })}</div>`)}
        <p class="tiny dim mt-8">${e.note}</p>
        ${when(kapali.length, () => html`<div class="mt-12">${K.Table({ tight:true,
          headers:['Soru', 'Cevap', 'Sonuç'],
          rows:kapali.map(sg => [sg.title, sg.answer ? sg.answer.slice(0, 60) : '—',
            sg.outcome === 'realigned' ? 'ayrışma kapandı'
              : sg.outcome === 'still-decoupled' ? 'sürüyor'
              : sg.outcome === 'dismissed' ? 'geçersiz bulundu' : 'ölçülemedi',
          ]) })}</div>`)}`,
    });
  }

  function durustTab(){
    const f = R.Friction.verdict();
    const rahat = R.Friction.relief();
    const cifts = R.Goodhart.scan();
    const ayrisan = cifts.filter(p => p.status === 'decoupled');
    const puan = R.Calib.score();
    const vade = R.Calib.due();

    return K.Grid([
      K.Span(12, SignalLedger()),
      K.Span(6, K.Stack([
        K.Card({ title:yz('ays.analytics.surtunme'), hint:'friction',
          body:html`
            ${K.Notice({ tone:f.level === 'high' ? 'warn' : 'info', body:f.title + ' — ' + f.note })}
            ${when(f.cert === 'measured' || f.cert === 'estimated', () => html`
              <div class="mt-12">${K.Cols(3, [
                K.Stat({ label:yz('ays.analytics.yonetim'), value:String(f.window.perDay), note:yz('ays.analytics.dk-gun') }),
                K.Stat({ label:yz('ays.analytics.calisma'),
                  value:String(Math.round(f.window.work / Math.max(1, f.window.measuredDays))),
                  note:f.cert === 'estimated' ? 'dk/gün · tahmin' : 'dk/gün' }),
                K.Stat({ label:yz('ays.analytics.yonetim-payi'),
                  value:f.window.ratio == null ? '—' : '%' + Math.round(f.window.ratio * 100),
                  tone:f.level === 'high' ? 'warn' : null }),
              ])}</div>`)}
            ${when(rahat.length, () => html`<div class="mt-12">
              ${map(rahat, r => html`<div class="mt-8">
                ${K.Notice({ tone:'info', body:r.label + ' — ' + r.note })}
              </div>`)}</div>`)}` }),

        K.Card({ title:yz('ays.analytics.gosterge-ayrismasi'), hint:'goodhart',
          body:html`
            ${K.Table({ tight:true, headers:['Çift', 'Yön', 'Çaba', 'Sonuç', 'Durum'],
              rows:cifts.map(p => [
                p.effortLabel + ' → ' + p.outcomeLabel,
                (R.Goodhart.DIRECTIONS[p.direction] || {}).label || 'tanımsız',
                p.effortChange == null ? '—'
                  : (p.effortChange === Infinity ? 'yeni' : '%' + Math.round(p.effortChange * 100)),
                p.outcomeChange == null ? '—'
                  : (p.outcomeChange === Infinity ? 'yeni' : '%' + Math.round(p.outcomeChange * 100)),
                p.status === 'decoupled' ? 'ayrıştı'
                  : p.status === 'aligned' ? 'birlikte'
                  : p.status === 'unknown' ? 'ölçülmedi' : 'sessiz',
              ]) })}
            <p class="tiny dim mt-8">${yz('ays.analytics.yon-sutunu-sonucun-hangi-tar')}</p>
            ${(function(){
              const pol = R.Goodhart.policy();
              return html`<div class="mt-8">${K.Ayrinti({
                /* Asgari çaba tek sayı değildir: her çiftin kendi eşiği var
                   (soru, dakika ya da deneme). Politikada tek bir değer yoktu
                   ve ekranda boş kalıyordu; uydurulmaz. */
                ozet:yz('ays.analytics.pencere') + pol.windowDays + ' gün · çaba artışı eşiği %'
                  + Math.round(pol.effortRiseThreshold * 100) + ' · sonuç durgunluk eşiği %'
                  + Math.round(pol.stagnationThreshold * 100) + '.',
                govde:html`<p>${yz('ays.analytics.asgari-caba-her-cift-icin')} ${pol.rationale}</p>` })}</div>`;
            })()}
            ${map(ayrisan, p => html`<div class="mt-12">
              ${K.Notice({ tone:'warn', body:p.note })}
              ${K.Notice({ tone:'info', body:p.question })}
            </div>`)}
            ${when(!ayrisan.length, () => html`<p class="tiny dim mt-10">
              ${yz('ays.analytics.ayrisma-yok-nobetcinin-konus')}</p>`)}` }),
      ])),

      K.Span(6, K.Stack([
        K.Card({ title:yz('ays.analytics.kalibrasyon'), hint:'calib',
          body:html`
            ${K.Notice({ tone:'info', body:puan.note })}
            ${when(puan.bias.cert === 'measured',
              () => html`<div class="mt-8">${K.Notice({ tone:'info', body:puan.bias.note })}</div>`)}
            <div class="mt-10">${K.Ayrinti({
              ozet:yz('ays.analytics.tahmin-kor-yazilir-net-ekran'),
              govde:html`<p>${yz('ays.analytics.kendi-netini-onceden-kestire')}</p>
                <p>${yz('ays.analytics.defter-kendini-tanimayi-olcm')}</p>` })}</div>

            <div class="mt-12">
              ${K.Field({ label:yz('ays.analytics.ne-tahmin-ediyorsun'),
                input:K.Select({ id:'ay-calib-kind', value:S.ui.calibKind || 'week-minutes',
                  change:'calib-kind', aria:yz('ays.analytics.tahmin-turu'),
                  options:R.CALIB_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
              ${(function(){
                const k = R.Calib.kindOf(S.ui.calibKind || 'week-minutes');
                return html`<p class="tiny dim">${k.ask}</p>
                  ${K.Field({ label:k.type === 'binary' ? 'Olasılık (0–1)' : 'Tahminin'
                      + (k.unit ? ' (' + k.unit + ')' : ''),
                    input:K.Input({ id:'ay-calib-guess', type:'number',
                      step:k.type === 'binary' ? '0.05' : 'any' }) })}`;
              })()}
              ${K.Button({ label:yz('ays.analytics.tahmini-kaydet'), act:'calib-open' })}
            </div>

            ${when(vade.length, () => html`<div class="mt-12">
              ${map(vade, fo => html`<div class="mt-8">
                ${K.Field({ label:(R.Calib.kindOf(fo.kind) || {}).label
                    + ' — tahminin: ' + U.fmtNum(fo.guess),
                  input:K.Input({ id:'ay-calib-actual-' + fo.id, type:'number', step:'any' }) })}
                ${K.Button({ label:yz('ays.analytics.kapat'), size:'sm', act:'calib-settle',
                  data:{ 'data-id':fo.id } })}
              </div>`)}</div>`)}

            ${when(R.Calib.settled().length, () => html`<div class="mt-12">
              ${K.Table({ tight:true,
                headers:['Tür', { label:yz('ays.analytics.tahmin'), num:true }, { label:yz('ays.analytics.gercek'), num:true },
                  { label:yz('ays.analytics.sapma'), num:true }],
                rows:R.Calib.settled().slice(0, 10).map(fo => {
                  /* Sapma TEK YERDE biçimlenir: burası `abs` hatasını
                     (net farkı) oran sanıp 100 ile çarpıyordu. */
                  return [(R.Calib.kindOf(fo.kind) || {}).label || fo.kind,
                    U.fmtNum(fo.guess), U.fmtNum(fo.actual),
                    R.Calib.errorText(fo) || '—'];
                }) })}</div>`)}` }),
      ])),
    ]);
  }


  /* ------------------------------------------------------------ denetim

     Bes alanda birikmis bakim borcu: deneme, konu, tekrar, yanlis
     defteri, plan. Plan NEREDE olunacagini, siradaki is NE yapilacagini
     soyler; bu, "bir sey ters gidiyor mu?" sorusunu cevaplar. */
  function denetimTab(){
    const hepsi = R.Audit.all();
    const ciddi = hepsi.filter(f => f.severity !== 'none');

    return K.Grid([
      K.Span(12, K.Card({ title:yz('ays.analytics.bakim-borcu'), hint:'audit',
        sub:ciddi.length ? ciddi.length + ' bulgu' : 'temiz',
        body:html`
          ${when(!ciddi.length, () => K.Notice({ tone:'ok',
            body:'Beş alanda da bakım borcu görünmüyor.' }))}` })),

      ...R.Audit.AREAS.map(function(a){
        const bulgular = R.Audit.of(a.id);
        if(!bulgular.length) return '';
        return K.Span(6, K.Card({ title:a.label,
          sub:bulgular.filter(f => f.severity !== 'none').length + ' bulgu',
          body:html`${map(bulgular, f => html`
            <div class="mt-12">
              ${K.Notice({ tone:f.severity === 'warn' ? 'warn' : 'info',
                title:f.title, body:f.note })}
              ${when((f.items || []).length, () => K.Table({ tight:true,
                headers:['Kayıt', 'Durum'],
                rows:f.items.map(x => [x.label, x.meta || '—']) }))}
              ${when(f.route, () => K.Button({ label:yz('ays.analytics.ac'), size:'sm', act:'go',
                data:{ 'data-route':f.route }, class:'mt-8' }))}
            </div>`)}` }));
      }).filter(Boolean),
    ]);
  }

  const BODIES = { compare:compareTab, errors:errorsTab, rank:rankTab,
    speed:speedTab, value:valueTab, habits:habitsTab,
    denetim:denetimTab, durust:durustTab };

  /* Sekme yok (EKIP-PLANI §1.2): sekiz okuma alt alta durur, üstteki
     bölüm çubuğu sayfa içinde o okumaya kaydırır. Bir bölüm çizilemezse
     yalnız o bölüm sakin bir notla düşer; öteki yedisi durur. */
  function govde(t){
    try{ return (BODIES[t.id] || compareTab)(); }
    catch(e){
      console.error('Analiz bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:'Bu okuma şu an çizilemedi; verin yerinde duruyor.' });
    }
  }

  /* ANALİZ BAŞI (vitrin 041 veri doluluğu, 040 birikim eğrisi): önce
     «neye dayanıyor», sonra ne gösteriyor. Kaydı olmayan gün sıfır değildir. */
  function analizBasi(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G) return '';
    const kayitli = Object.keys(S.days || {}).filter(t => {
      const d = S.days[t];
      return d && (C.gunSorusu(d) > 0 || (d.blocks || []).some(b => b.status && b.status !== 'pending'));
    });
    const hafta = M.weekDates(M.currentWeek()).map(d => U.iso(d));
    const gunluk = [], plan = [];
    hafta.forEach(t => {
      const d = S.days[t];
      if(!d) return;
      const hedef = U.sum((d.blocks || []).map(b => Number(b.targetQ) || 0));
      if(hedef) plan.push({ tarih:t, deger:hedef });
      if(kayitli.indexOf(t) >= 0) gunluk.push({ tarih:t, deger:C.gunSorusu(d) });
    });
    return K.Grid([K.Span(12, html`<div class="analizbasi">
      ${K.Kutu({ ad:yz('ays.analytics.veri-dolulugu'), yuva:'son 7 gün', govde:raw(G.dolulukHtml([{ modul:'ays', ad:yz('ays.analytics.ays'), gunler:kayitli }], { gun:7 })) })}
      ${K.Kutu({ ad:yz('ays.analytics.bu-haftanin-birikimi'), yuva:'soru', govde:raw(G.birikimSvg(gunluk, plan, { bugun:U.todayISO(), birim:'soru', etiket:yz('ays.analytics.haftalik-soru') })) })}
    </div>`)]);
  }

  /* PANO KARTI (2026-10-20, üçüncü tur): son 30 günün bloklarının başladığı
     saat; başlama saati olmayan blok sayılmaz. */
  function calismaSaatleri(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const saat = new Array(24).fill(null);
    for(let i = 0; i < 30; i++){
      const g = S.days[U.iso(U.addDays(U.today(), -i))];
      ((g && g.blocks) || []).forEach(b => {
        const m = /T(\d{2}):/.exec(b.startedAt || '');
        if(m && (b.status === 'done' || b.status === 'partial')){ const h = Number(m[1]); saat[h] = (saat[h] || 0) + (Number(b.actualMin != null ? b.actualMin : b.targetMin) || 0); }
      });
    }
    if(saat.filter(v => v != null).length < 2) return '';
    const en = saat.reduce((m, v, i) => v != null && (m < 0 || v > saat[m]) ? i : m, -1);
    return '<div class="pk-izgara pk-izgara--iki">' + P.kart({ tur:'calisma-saatleri', ad:yz('ays.analytics.calisma-saatlerin'), simge:'saat', yuva:'son 30 gün',
      govde:P.deger(String(en).padStart(2, '0') + ':00', '', 'en çok dakika bu saatte başlayan bloklarda')
        + P.sutun({ degerler:saat, yukseklik:48, etiket:yz('ays.analytics.bitmis-bloklarin-basladigi-s') + en + ':00' })
        + '<div class="pk-saat__ad"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>' }) + '</div>';
  }

  LIFEOS.PARCA.blok({ id:'analytics.bolum-1', sayfa:'analytics', yer:'y1', sira:10, ad:'Bölüm 1', ciz(){
    return K.SayfaBolumleri({ act:'analytics-tab', aria:yz('ays.analytics.analiz-bolumleri'),
      bolumler:GRUPLAR.map(g => ({ id:g.id, ad:g.label, govde:html`${map(g.ic, id => govde({ id }))}` })) });
  } });
  LIFEOS.PARCA.blok({ id:'analytics.bolum-2', sayfa:'analytics', yer:'y2', sira:10, ad:'Bölüm 2', ciz(){
    return raw(calismaSaatleri());
  } });
  LIFEOS.PARCA.blok({ id:'analytics.analizbasi', sayfa:'analytics', yer:'y3', sira:10, ad:'analizBasi', ciz(){
    return analizBasi();
  } });
  async function render(){
    return String(html`${LIFEOS.PARCA.yer('analytics', 'y3', K, undefined, typeof raw === 'undefined' ? null : raw)}${LIFEOS.PARCA.yer('analytics', 'y2', K, undefined, typeof raw === 'undefined' ? null : raw)}${LIFEOS.PARCA.yer('analytics', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
  }

  /* Açılışta istenen bölüm (başka ekrandan «Hata haritası»na gelmek gibi)
     çizimden sonra görünür yapılır. */
  function afterRender(){
    const t = S.ui.analyticsTab;
    S.ui.analyticsTab = null;
    const g = t ? grupOf(t) : null;
    if(g && g.id !== GRUPLAR[0].id) K.bolumeGit(g.id);
  }

  const handle = {
    async 'analytics-tab'(el){ const g = grupOf(el.dataset.tab); K.bolumeGit(g ? g.id : el.dataset.tab); },

    /* Tahmin KÖR açılır: gerçek değer burada hesaplanmaz. */
    async 'calib-open'(){
      const kind = S.ui.calibKind || 'week-minutes';
      const el = document.getElementById('ay-calib-guess');
      const r = await R.Calib.open(kind, el ? el.value : null, { dueAt:vadeFor(kind) });
      if(!r.ok){ UI.toast(r.error); return; }
      if(el) el.value = '';
      UI.toast(yz('ays.analytics.tahmin-deftere-yazildi'));
      R.App.render();
    },

    async 'calib-settle'(el){
      const id = el.dataset.id;
      const inp = document.getElementById('ay-calib-actual-' + id);
      const r = await R.Calib.settle(id, inp ? inp.value : null);
      if(!r.ok){ UI.toast(r.error); return; }
      /* Burası doğruydu ama yalnız `ape` türünü gösteriyordu: net
         sapması hiç yazılmıyordu. Tek biçimlendirici üçünü de yazar. */
      const yazi = R.Calib.errorText(r.forecast);
      UI.toast(yazi ? ('Kapandı — sapma ' + yazi) : 'Kapandı');
      R.App.render();
    },
  };

  /* Haftalık sayılar hafta bitmeden kapanmaz; deneme tahmini denemeyi
     okurken kapanır, vadesi yoktur. */
  function vadeFor(kind){
    const bugun = U.parse(U.todayISO());
    if(kind === 'week-minutes' || kind === 'week-plan') return U.iso(U.addDays(bugun, 7));
    return null;
  }

  const change = {
    async 'cmp-a'(el){ S.ui.compareA = el.value; R.App.render(); },
    async 'cmp-b'(el){ S.ui.compareB = el.value; R.App.render(); },
    async 'calib-kind'(el){ S.ui.calibKind = el.value; R.App.render(); },
  };

  return {
    id:'analytics',
    /* iPhone Faz 3: her bölümde açık yalnız işin kendisi; ikincil analiz ve
       dürüstlüğün üç meta kartı şerit (kalibrasyon girişi açık). */
    get kucukVarsayilan(){
      const G = (window.LIFEOS || {}).Gizle;
      /* Denetim'de özet açık; beş alanın bulgu kartları şerit. */
      const alanlar = G && R.Audit ? R.Audit.AREAS.map(a => G.anahtar(a.label)) : [];
      return ['boş-bırakma-stratejisi', 'boş-bırakma', 'yayın-zorluk-farkı', 'yayın-etkisi', 'yapışkan-kartlar',
        'bant-tablosu', 'unutma-eğrisi', 'dikkat-dağılması', 'denetim-defteri', 'sürtünme', 'gösterge-ayrışması',
        /* Alışkanlık ve denetim tek sekme (2026-10-16): açık en çok üç kalsın diye. */
        'bakım-borcu'].concat(alanlar);
    },
    title:yz('ays.analytics.ayrintili-analiz'),
    subtitle(){ return 'Denemelerden ve kayıtlardan türetilen okumalar'; },
    actions(){ return ''; },
    render, afterRender, handle, change,
  };
})();
