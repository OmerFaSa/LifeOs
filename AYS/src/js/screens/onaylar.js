/* Onaylar — bekleyen her öneri TEK çekmecede (ekip/CEKMECE-HARITASI.md).

   Üç kaynak, tek yer:
     King teklifi   ücretli iş King'in onay kapısında (HKM core/king.py)
     HKM teklifi    Merkez'in kuyruğu (core/beacon.js intents): kayıt,
                    materyal, yük azaltma
     Ofis önerisi   ajanların ve kural motorunun önerisi (core/proposals.js)

   Önce Bugün'de (King, HKM) ve Ofis'te (öneriler) ayrı ayrı duruyorlardı;
   kural «onaylar tek çekmecede». Bugün'ün Öneri alanı yalnız EN ÖNDEKİ
   kartı gösterir, gerisi burada bekler (`oneriAlani`). Hiçbir şey
   kullanıcı görmeden uygulanmaz; uygulayan AYS'nin kendi kodudur. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.onaylar = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const c = R.C;

  function Avatar(agent, size){
    return html`<span class="${cls('agentav', 'agentav--' + agent.id, size === 'sm' && 'agentav--sm')}"
      aria-hidden="true">${R.UI.pp(agent.id)}${agent.initial}</span>`;
  }

  /* ---------- HKM teklifleri ----------

     HKM bu sisteme YAZMAZ: kuyruktan gelen her satir bir TEKLIFTIR ve
     kullanici gormeden hicbir sey uygulanmaz. Uygulayan da HKM degil,
     AYS'in kendi kodudur. Kuyruk bossa bu kart hic cizilmez. */
  /* ---------- King teklifi (Part 8a-3b) ----------

     Ücretli iş King'in onay kapısında bekler (HKM core/king.py). Seçenek
     metni ve sayılar HKM'den gelir; kart yalnız yazar ve onayı iletir. */
  function KingTeklifKart(){
    const liste = S.ui.kingTeklifler || [];
    if(!liste.length) return '';
    return c.Card({ title:'King teklifi', hint:'hkm', sub:liste.length + ' iş onayını bekliyor',
      body:html`
        ${map(liste.filter(t => t.durum === 'ara_onay'), t => html`<div class="mt-8">
          <div><b>${t.konu}</b> <span class="tiny dim">· iş emri #${t.id}</span></div>
          <div class="tiny mt-4">${t.metin}</div>
          <div class="row wrap gap-8 mt-8">
            ${c.Button({ label:'Devam', size:'sm', tone:'primary', act:'king-parca',
              data:{ 'data-id':String(t.id), 'data-karar':'devam' } })}
            ${c.Button({ label:'Dur ve bitir', size:'sm', act:'king-parca',
              data:{ 'data-id':String(t.id), 'data-karar':'dur' } })}
          </div>
        </div>`)}
        ${map(liste.filter(t => t.durum !== 'ara_onay'), t => html`<div class="mt-8">
          <div><b>${t.konu}</b> <span class="tiny dim">· iş emri #${t.id}</span></div>
          ${map(t.secenekler, (x, i) => html`<div class="tiny mt-4">${i + 1}) ${x.metin}</div>`)}
          ${when(t.neden, () => c.Notice({ tone:'info', class:'mt-8',
            body:'Önerim: ' + ((t.secenekler.find(x => x.id === t.oneri) || {}).ad || t.oneri)
              + ' — ' + t.neden + '.' }))}
          <div class="row wrap gap-8 mt-8">
            ${/* Düğme kısa: seçeneğin adı ve sayıları yukarıdaki satırda yazılı;
                  uzun ad 390 pikselde satırdan taşıyordu. */''}
            ${map(t.secenekler, (x, i) => c.Button({ label:(i + 1) + '. seçeneği onayla',
              size:'sm', tone:x.id === (t.oneri || 'tam') ? 'primary' : undefined, act:'king-onayla',
              data:{ 'data-id':String(t.id), 'data-secenek':x.id } }))}
            ${c.Button({ label:'İptal', size:'sm', act:'king-iptal',
              data:{ 'data-id':String(t.id) } })}
          </div>
        </div>`)}
        <p class="tiny dim mt-10">King ücretli bir işi onayın olmadan açmaz. Sınıf, maliyet
          ve süre King’in hesabıdır (tahmin); sen onaylayınca iş BAM’da başlar ve sonucu
          teklif olarak buraya gelir.</p>` });
  }

  function HkmTeklifKart(){
    const liste = S.ui.hkmIntents || [];
    const supheli = S.ui.hkmDoubts || [];
    if(!liste.length && !supheli.length) return '';
    return c.Card({ title:'HKM teklifi', hint:'hkm',
      sub:liste.length ? liste.length + ' teklif bekliyor'
        : supheli.length + ' teklifin sonucu belirsiz',
      body:html`
        ${/* Uygulama yarida kalmis teklif: uydurmak yerine BILMEDIGIMIZI
              soyleriz. Ne tekrar uygulanir ne de olmus sayilir. */''}
        ${map(supheli, d => html`<div class="mt-8">
          ${c.Notice({ tone:'warn', body:'Bir teklif uygulanırken işlem '
            + 'yarıda kaldı; plana yazılıp yazılmadığı bilinmiyor. Planına '
            + 'bakıp doğrula — bu satır, olmamış bir işi olmuş göstermemek '
            + 'için duruyor.' })}
          <div class="row gap-8 mt-8">
            ${c.Button({ label:'Kontrol ettim', size:'sm',
              act:'hkm-doubt-ok', data:{ 'data-id':String(d.id) } })}
          </div>
        </div>`)}
        ${when(topluKayitlar().length >= 2, () => html`<div class="row gap-8 mt-8">
          ${c.Button({ label:'Hepsini kaydet (' + topluKayitlar().length + ')', size:'sm',
            tone:'primary', act:'hkm-toplu' })}
          <span class="tiny dim">Yalnız okunabilen günlük kayıtlar; her biri Ofis ekranından geri alınır.</span>
        </div>`)}
        ${map(liste, n => html`<div class="mt-8">
          ${c.Notice({ tone:'info', body:n.note })}
          ${when(n.kind === 'kayit.add', () => KayitOkuma(n))}
          <div class="row gap-8 mt-8">
            ${/* Uygulanamayan turde «Uygula» CIKMAZ: gorunen eylem,
                  yapilabilen eylemle ayni olmali. */''}
            ${when(R.Beacon.canApply(n), () => c.Button({
              label:({ 'kayit.add':'Kaydet', 'urun.add':'Ekle', 'load.reduce':'Hafiflet' })[n.kind] || 'Uygula',
              size:'sm', tone:'primary', act:'hkm-intent-yes',
              data:{ 'data-id':String(n.id) } }))}
            ${when(!R.Beacon.canApply(n), () => c.Button({ label:'Gördüm',
              size:'sm', tone:'primary', act:'hkm-intent-seen',
              data:{ 'data-id':String(n.id) } }))}
            ${c.Button({ label:'İstemiyorum', size:'sm',
              act:'hkm-intent-no', data:{ 'data-id':String(n.id) } })}
          </div>
        </div>`)}
        <p class="tiny dim mt-10">Bu satırlar birer tekliftir. Onaylarsan
          AYS kendi planına yazar; reddedersen HKM kaydı siler değil
          «istenmedi» diye işaretler — görülmemiş bir teklifle reddedilmiş
          bir teklif ayrı şeylerdir.</p>` });
  }

  /* Gunun kaydi: AYS cumleyi NASIL OKUDU. Onaydan once gorunur; yazilamayan
     ve anlasilmayan parca da SEBEBIYLE yazilir — sessizce dusen bir parca,
     kullanicinin yazildigini sandigi bir kayit olurdu. */
  function KayitOkuma(n){
    const o = n.okuma;
    if(!o) return html`<p class="tiny dim mt-8">AYS bu kaydı okuyamadı.</p>`;
    return html`<div class="mt-8">
      <p class="tiny"><b>AYS şöyle okudu</b> (${o.gun}):</p>
      <ul class="tiny mt-4">
        ${map(o.yazilacak, y => html`<li>${y.baslik}: ${y.satirlar.join('; ')}</li>`)}
        ${map(o.yazilamaz, y => html`<li class="dim">«${y.metin}» — yazılmayacak: ${y.why}</li>`)}
        ${map(o.anlasilmayan, m => html`<li class="dim">«${m}» — anlaşılmadı, yazılmayacak.</li>`)}
      </ul>
      ${when(!o.yazilacak.length, () => html`<p class="tiny dim">Bu cümleden AYS'ye
        yazılacak bir şey çıkmadı; istersen kaydı elle gir.</p>`)}
    </div>`;
  }
  /* TOPLU ONAY yalniz KUCUK tekliflerde: gunluk kayit (kayit.add), AYS'nin
     okuyabildigi ve Ofis'ten geri alinabilen. Plan, materyal, kitap gibi
     orta aksiyonlar tek tek onaylanir (AGENTS.md §1.9). */
  function topluKayitlar(){
    return (S.ui.hkmIntents || []).filter(n => n.kind === 'kayit.add'
      && n.okuma && n.okuma.yazilacak && n.okuma.yazilacak.length && R.Beacon.canApply(n));
  }

  async function hkmToplu(){
    const l = topluKayitlar();
    let yazilan = 0, kalan = 0;
    for(const n of l){
      const r = await R.Beacon.resolveIntent(n, 'apply');
      if(r.ok){
        yazilan++;
        S.ui.hkmIntents = (S.ui.hkmIntents || []).filter(x => x.id !== n.id);
      }else kalan++;
    }
    if(yazilan) R.UI.onayMuhru();
    UI.toast(yazilan + ' kayıt yazıldı' + (kalan ? ', ' + kalan + ' tanesi yazılamadı (kartta duruyor)' : '')
      + '. Yanlış olanı Ofis ekranından geri alabilirsin.');
    R.App.render();
  }

  /* HKM teklifine verilen cevabin TEK yolu. */
  async function hkmCevap(id, action){
    const liste = S.ui.hkmIntents || [];
    const n = liste.filter(x => String(x.id) === String(id))[0];
    if(!n) return;
    const r = await R.Beacon.resolveIntent(n, action);
    /* MUHUR YALNIZ ONAYDA BASILIR. Reddetmek de bir cevaptir ama
       onay degildir; ikisine ayni muhru basmak, muhru anlamsiz
       kilardi. */
    if(r.ok && action !== 'reject' && action !== 'dismiss') R.UI.onayMuhru();
    if(!r.ok){ UI.toast(r.error || 'İşlenemedi'); return; }
    S.ui.hkmIntents = liste.filter(x => x.id !== n.id);
    const bas = r.state === 'applied' ? (r.note || 'Uygulandı')
      : (r.state === 'acknowledged' ? 'Görüldü olarak işaretlendi'
        : 'İstenmedi olarak işaretlendi');
    /* Merkeze ulasilamadiysa bunu SOYLE: kayit yerelde duruyor ve bir
       sonraki baglantida tekrar denenecek. */
    /* Yük azaltma bir istisna yazar; «Geri al» onu kaldırır (gün temele döner). */
    const geri = r.geriAl && R.Istisna ? { undo:async () => {
      await R.Istisna.kaldir(r.geriAl); UI.toast('Geri alındı; gün planına döndü.'); R.App.render();
    } } : undefined;
    UI.toast(r.reported ? bas
      : bas + ' — merkeze bildirilemedi, bağlantı gelince tekrar denenecek.', geri);
    R.App.render();
  }
  function diffRows(rows){
    return html`<div class="diff">${map(rows, r => html`
      <div class="diff__row">
        <span class="diff__label">${r.label}</span>
        <span class="diff__before">${r.before}</span>
        <span class="diff__arrow" aria-hidden="true">→</span>
        <span class="diff__after">${r.after}</span>
      </div>`)}</div>`;
  }

  const KAYNAK_ADI = { istek:'senin isteğin', llm:'ajanın önerisi', kural:'kural motoru buldu' };
  const SEVIYE_ADI = { kucuk:'küçük değişiklik', orta:'orta değişiklik', buyuk:'büyük değişiklik' };

  /* VİTRİN ÖNERİ KARTI (110 · 114 · 121 · 123 · 113): ofisin önerisi ortak
     kartla çizilir; uygulama yine yalnız R.Proposals.approve'dan geçer.
     Ajan, dokunduğu alan ve «Yerini gör» kartın altında kalır. */
  /* 053 ARA HAFTASI ÖNİZLEMESİ (vitrin): «ara ver» önerisinin etkilediği
     haftalar ve bir önce/sonrası. Onay aynı pencerenin düğmesidir; burada
     ikinci bir onay düğmesi yok. */
  function araOnizleme(p){
    const V = (window.LIFEOS || {}).VITRIN;
    const x = p.params || p.payload || p;
    if(!V || p.action !== 'ara-ver' || !x || !x.from || !x.to) return '';
    const h1 = R.Model.weekOf(x.from), h2 = R.Model.weekOf(x.to);
    if(!h1 || !h2) return '';
    const haftalar = [];
    for(let h = Math.max(1, h1 - 1); h <= Math.min(R.PLAN.totalWeeks, h2 + 1); h++) haftalar.push({ ad:'H' + h, durum:h >= h1 && h <= h2 ? 'a' : '' });
    const gun = U.diffDays(x.from, x.to) + 1;
    return V.araHaftasi({ haftalar, seviye:(R.ACTION_BY_ID['ara-ver'] || {}).level || 'orta',
      ozet:gun + ' gün · günlerin blokları boşalır' });
  }

  function kopru(){
    const O = (window.LIFEOS || {}).ONERI;
    if(!O || !O.kopru) return null;
    return O.kopru({
      katalog:R.ACTIONS,
      satirlar:() => R.Proposals.actionable(),
      nesne:p => {
        const def = R.ACTION_BY_ID[p.action] || {};
        return { id:p.id, eylem:p.action, level:p.level, baslik:def.title, kaynak:'modul',
          kapsam:def.level === 'kucuk' ? 'yalnız bugün' : null,
          cumle:p.reason ? { metin:p.reason, kaynak:p.source === 'llm' ? 'model' : 'kural' } : null,
          gerekce:p.gerekce || null, kurallar:p.kurallar || [] };
      },
      uygula:id => handle['office-approve']({ dataset:{ id } }),
      gec:async (id, kayit) => { await R.Proposals.reject(id, kayit); UI.toast('Geçildi; öneri silinmedi, «geçildi» diye yazıldı.'); R.App.render(); },
      onizle:p => ({ govde:araOnizleme(p) + String(diffRows(p.preview.rows)) }),
      pencere:o => UI.sheet({ title:o.baslik, body:o.govde, footer:o.ayak }),
      kapat:() => UI.closeSheet(),
    });
  }

  function oneriKarti(p){
    const k = kopru();
    const kart = k ? k.kart(p) : '';
    if(!kart) return proposalRow(p);
    const def = R.ACTION_BY_ID[p.action];
    const agent = R.AGENT_BY_ID[p.agent] || {};
    /* 127: günlük süre önerisinde süre seçilir (bugün / bu hafta / kalıcı). */
    const O = (window.LIFEOS || {}).ONERI;
    const kapsam = O && O.kapsamHtml && R.Proposals.kapsamOf ? R.Proposals.kapsamOf(p) : null;
    return html`<div class="okart-sar">${raw(kart)}
      ${when(kapsam, () => raw(O.kapsamHtml({ id:p.id, eylem:p.action }, R.ACTIONS, kapsam)))}
      <p class="okart__kim">${agent.name || 'Ofis'} · ${def.touches} · ${KAYNAK_ADI[p.source] || 'kural motoru buldu'}
        ${when(def.route, () => c.Button({ label:'Yerini gör', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':def.route } }))}</p>
    </div>`;
  }

  function proposalRow(p){
    const def = R.ACTION_BY_ID[p.action];
    const agent = R.AGENT_BY_ID[p.agent];
    return html`
      <div class="${cls('prop', 'prop--' + p.agent)}">
        <div class="prop__head">
          ${Avatar(agent, 'sm')}
          <div class="prop__who">
            <b class="prop__title">${def.title}</b>
            <span class="prop__by">${agent.name} · ${def.touches}
              · ${KAYNAK_ADI[p.source] || 'kural motoru buldu'}
              · ${SEVIYE_ADI[p.level] || SEVIYE_ADI.orta}</span>
          </div>
        </div>
        <p class="prop__why">${p.reason || def.summary}</p>
        ${diffRows(p.preview.rows)}
        <div class="prop__acts">
          ${c.Button({ label:'Onayla ve uygula', icon:'check', size:'sm', tone:'primary',
            act:'office-approve', data:{ 'data-id':p.id } })}
          ${c.Button({ label:'Reddet', size:'sm', tone:'ghost',
            act:'office-reject', data:{ 'data-id':p.id } })}
          ${when(def.route, () => c.Button({ label:'Yerini gör', size:'sm', tone:'ghost',
            act:'go', data:{ 'data-route':def.route } }))}
        </div>
      </div>`;
  }

  function appliedRow(p){
    const def = R.ACTION_BY_ID[p.action];
    const agent = R.AGENT_BY_ID[p.agent];
    return html`
      <div class="prop prop--done">
        <div class="prop__head">
          ${Avatar(agent, 'sm')}
          <div class="prop__who">
            <b class="prop__title">${def.title}</b>
            <span class="prop__by">${agent.name} ·
              ${U.relativeDay(String(p.appliedAt || '').slice(0, 10))}
              ${p.otomatik ? 'sormadan uygulandı (küçük değişiklik)' : 'uygulandı'}</span>
          </div>
          ${c.Button({ label:'Geri al', icon:'undo', size:'sm', tone:'ghost',
            act:'office-undo', data:{ 'data-id':p.id } })}
        </div>
      </div>`;
  }

  function ofisKarti(){
    const list = R.Proposals.actionable();
    const done = R.Proposals.applied().slice(-3).reverse();
    if(!list.length && !done.length) return '';

    return c.Card({
      title:'Ofisin önerileri',
      sub:'Ajanlar değişiklik önerir; uygulanıp uygulanmayacağına sen karar verirsin',
      badge:when(list.length, () => c.Badge({ label:String(list.length), tone:'warn' })),
      body:html`
        ${when(list.length, () => html`<div class="props">${map(list, oneriKarti)}</div>`)}
        ${when(done.length, () => html`
          <div class="mt-12">${c.SectionTitle('Uygulananlar')}</div>
          <div class="props">${map(done, appliedRow)}</div>`)}`,
    });
  }

  /* Bekleyen: King + HKM (belirsizler dahil) + ofis önerisi. Kabuğun
     mor sayacı (115) aynı toplamı gösterir. */
  function bekleyen(){
    let n = (S.ui.kingTeklifler || []).length + (S.ui.hkmIntents || []).length
      + (S.ui.hkmDoubts || []).length;
    try{ if(R.Proposals) n += R.Proposals.actionable().length; }catch(e){ console.error(e); }
    return n;
  }

  /* Bugün'ün Öneri alanı: en öndeki TEK kart; fazlası bir satırla
     Onaylar'a gönderir. Sıra: King (parası ödenecek iş bekliyor) → HKM →
     ofis önerisi. */
  function oneriAlani(){
    const toplam = bekleyen();
    if(!toplam) return '';
    let kart = KingTeklifKart();
    let gosterilen = (S.ui.kingTeklifler || []).length;
    if(!kart){
      kart = HkmTeklifKart();
      gosterilen = (S.ui.hkmIntents || []).length + (S.ui.hkmDoubts || []).length;
    }
    if(!kart){
      const l = R.Proposals ? R.Proposals.actionable() : [];
      if(l.length){
        kart = oneriKarti(l[0]);
        gosterilen = 1;
      }
    }
    const kalan = toplam - gosterilen;
    return html`<div class="stack-sm" data-oz="110">
      ${kart}
      ${when(kalan > 0, () => html`<p class="small">${c.Button({ label:'+' + kalan + ' öneri Onaylar\u2019da',
        size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'onaylar' } })}</p>`)}
    </div>`;
  }

  /* ---------- ekran ---------- */

  /* 179 KAYIT GEÇMİŞİ «Son kararlar» (vitrin, pano «Onaylar › Bekleyen»):
     kararın kaynağı ayrılır — sen, öneri (senin onayınla), ayar (sormadan).
     Onay kaydı olmayan öneri değişikliği GİZLENMEZ, uyarıyla yazılır. */
  function sonKararlar(){
    const G = (window.LIFEOS || {}).GUVEN;
    const DURUM = { applied:'uygulandı', accepted:'uygulandı', rejected:'geçildi', declined:'geçildi', undone:'geri alındı' };
    const rows = (S.officeProposals || []).filter(p => DURUM[p.status]);
    if(!G || !rows.length) return '';
    const olay = rows.map(p => {
      const def = R.ACTION_BY_ID[p.action] || {};
      const kendi = p.status === 'rejected' || p.status === 'undone';
      return { zaman:p.undoneAt || p.appliedAt || p.at, alan:def.title || p.action, eski:null,
        yeni:DURUM[p.status] + (p.gecme && p.gecme.nedenAd ? ' · ' + p.gecme.nedenAd : ''),
        kaynak:kendi || p.source === 'istek' ? 'kullanici' : 'ofis',
        onay:kendi ? null : p.otomatik ? { tur:'ayar' } : { tur:'onay' } };
    });
    /* 119: öneri geçmişi; bekleyen yokken de çizilir (render). */
    return c.Kutu({ ad:'Son kararlar', yuva:rows.length + ' kayıt',
      govde:html`<div data-oz="119">${raw(G.gecmisHtml(olay.slice(0, 40)))}</div>` });
  }

  async function render(){
    const kartlar = [KingTeklifKart(), HkmTeklifKart(), ofisKarti()].filter(Boolean);
    const gecmis = sonKararlar();
    if(!kartlar.length){
      /* Boş durum (10): tek eylem. Geçmiş varsa yanında durur (119):
         «dün neyi geçmiştim?» sorusu tam bekleyen yokken sorulur. */
      const bos = c.Kutu({ ad:'Bekleyen öneri yok', govde:html`
        <p class="small muted">Merkez, King ve ofis bir şey önerdiğinde burada durur; sen
          onaylamadan hiçbiri uygulanmaz.</p>
        <div class="mt-10">${c.Button({ label:'Masaları tara', icon:'refresh', size:'sm', act:'office-scan' })}</div>` });
      return String(gecmis ? c.Grid([c.Span(8, bos), c.Span(4, gecmis)]) : c.Grid([c.Span(12, bos)]));
    }
    return String(c.Grid([c.Span(8, c.Stack(kartlar)), c.Span(4, gecmis)]));
  }

  /* ---------- eylemler ---------- */
  const VITRIN_EYLEM = ['oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'];
  const handle = {
    /* 127 kapsam: seçim öneriyi dönüştürür; uygulamaz (onay yine ayrı). */
    async 'oneri-kapsam'(el){
      const id = String(el.name || '').replace(/^kapsam-/, '');
      const r = await R.Proposals.kapsamla(id, el.value);
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast({ bugun:'Yalnız bugün için', hafta:'Bu hafta için', kalici:'Kalıcı olarak' }[el.value]
        + ' önerildi; onaylamadan uygulanmaz.');
      R.App.render();
    },
    /* King'in teklifi (brand/ortak/kingteklif.js): onay ve iptal HKM'nin
       tek kapısına gider; cevabı HKM kurar. */
    async 'king-onayla'(el){
      if(!R.KingTeklif) return;
      el.disabled = true;
      const r = await R.KingTeklif.onayla(el.dataset.id, el.dataset.secenek);
      UI.toast(r.metin);
      S.ui.kingTeklifler = R.KingTeklif.liste();
      R.App.render();
    },
    async 'king-parca'(el){
      if(!R.KingTeklif) return;
      el.disabled = true;
      const r = await R.KingTeklif.parca(el.dataset.id, el.dataset.karar);
      UI.toast(r.metin);
      S.ui.kingTeklifler = R.KingTeklif.liste();
      R.App.render();
    },
    async 'king-iptal'(el){
      if(!R.KingTeklif) return;
      const r = await R.KingTeklif.iptal(el.dataset.id);
      UI.toast(r.metin);
      S.ui.kingTeklifler = R.KingTeklif.liste();
      R.App.render();
    },
    async 'hkm-toplu'(){ await hkmToplu(); },
    async 'hkm-intent-yes'(el){ await hkmCevap(el.dataset.id, 'apply'); },
    async 'hkm-intent-seen'(el){ await hkmCevap(el.dataset.id, 'seen'); },
    async 'hkm-intent-no'(el){ await hkmCevap(el.dataset.id, 'dismiss'); },    async 'hkm-doubt-ok'(el){
      const r = await R.Beacon.clearDoubt(el.dataset.id);
      S.ui.hkmDoubts = (S.ui.hkmDoubts || [])
        .filter(x => String(x.id) !== el.dataset.id);
      UI.toast(r.reported ? 'Kapatıldı; merkeze «belirsiz» diye bildirildi.'
        : 'Kapatıldı; merkeze şimdilik bildirilemedi.');
      R.App.render();
    },
    /* Onay kapisi: uygulama YALNIZ buradan gecer. */
    async 'office-approve'(el){
      const res = await R.Proposals.approve(el.dataset.id);
      if(!res) return;
      UI.toast(res.ok ? 'Uygulandı — istersen geri alabilirsin' : res.why);
      R.App.render();
    },

    async 'office-reject'(el){
      await R.Proposals.reject(el.dataset.id);
      UI.toast('Öneri reddedildi');
      R.App.render();
    },

    async 'office-undo'(el){
      await R.Proposals.undo(el.dataset.id);
      UI.toast('Geri alındı');
      R.App.render();
    },


    /* Kural motoru masaları yeniden okur; model gerekmez, kota harcanmaz. */
    async 'office-scan'(el){ await R.Screens.office.handle['office-scan'](el); },
  };
  VITRIN_EYLEM.forEach(a => { handle[a] = el => { const k = kopru(); return k ? k.handle[a](el) : null; }; });

  return {
    id:'onaylar',
    title:'Onaylar',
    subtitle(){
      const n = bekleyen();
      return n ? n + ' öneri onayını bekliyor' : 'bekleyen öneri yok';
    },
    lede(){ return 'Önerilen her değişiklik burada bekler; sen onaylamadan hiçbiri uygulanmaz.'; },
    actions(){ return ''; },
    render, handle, bekleyen, oneriAlani,
  };
})();
