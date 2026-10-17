/* Onaylar — bekleyen her öneri TEK çekmecede (belgeler/ekip/CEKMECE-HARITASI.md).

   Dört kaynak, tek yer:
     King teklifi     ücretli iş King'in onay kapısında (HKM core/king.py)
     HKM teklifi      Merkez'in kuyruğu (core/beacon.js): kayıt, ünite,
                      belge, kart, ürün
     Sonucu belirsiz  uygulanırken yarıda kalmış HKM teklifi
     Ajan teklifi     ofisin ve danışmanın teklifleri (core/plans.js)

   Önce Bugün'ün başında (King, HKM) ve Ofis'te (teklifler) duruyorlardı;
   kural «onaylar tek çekmecede». Bugün'ün Öneri alanı yalnız EN ÖNDEKİ
   kartı gösterir, gerisi burada bekler (`oneriAlani`). Uygulayan ESP'nin
   kendi kodudur; `prop-accept` / `prop-decline` app.js'te geneldir. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.onaylar = (function(){
  const S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  /* ---------- King teklifi (Part 8a-3b) ----------

     Ücretli iş King'in onay kapısında bekler (HKM core/king.py). Seçenek
     metni ve sayılar HKM'den gelir; satır yalnız yazar ve onayı iletir. */
  function KingTeklifKart(){
    const liste = S.ui.kingTeklifler || [];
    if(!liste.length) return '';
    return K.Entry({ label:'King teklifi', hint:'hkm', meta:liste.length + ' iş', wide:true,
      body:html`
        ${map(liste.filter(t => t.durum === 'ara_onay'), t => html`<div class="mt-8">
          <div><b>${t.konu}</b> <span class="tiny dim">· iş emri #${t.id}</span></div>
          <div class="tiny mt-4">${t.metin}</div>
          <div class="row wrap gap-8 mt-8">
            ${K.Button({ label:'Devam', size:'sm', tone:'primary', act:'king-parca',
              data:{ 'data-id':String(t.id), 'data-karar':'devam' } })}
            ${K.Button({ label:'Dur ve bitir', size:'sm', act:'king-parca',
              data:{ 'data-id':String(t.id), 'data-karar':'dur' } })}
          </div>
        </div>`)}
        ${map(liste.filter(t => t.durum !== 'ara_onay'), t => html`<div class="mt-8">
          <div><b>${t.konu}</b> <span class="tiny dim">· iş emri #${t.id}</span></div>
          ${map(t.secenekler, (x, i) => html`<div class="tiny mt-4">${i + 1}) ${x.metin}</div>`)}
          ${when(t.neden, () => K.Notice({ tone:'info', class:'mt-8',
            body:'Önerim: ' + ((t.secenekler.find(x => x.id === t.oneri) || {}).ad || t.oneri)
              + ' — ' + t.neden + '.' }))}
          <div class="row wrap gap-8 mt-8">
            ${/* Düğme kısa: seçeneğin adı ve sayıları yukarıdaki satırda yazılı;
                  uzun ad 390 pikselde satırdan taşıyordu. */''}
            ${map(t.secenekler, (x, i) => K.Button({ label:(i + 1) + '. seçeneği onayla',
              size:'sm', tone:x.id === (t.oneri || 'tam') ? 'primary' : undefined, act:'king-onayla',
              data:{ 'data-id':String(t.id), 'data-secenek':x.id } }))}
            ${K.Button({ label:'İptal', size:'sm', act:'king-iptal',
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
    return K.Entry({ label:'HKM teklifi', hint:'hkm',
      meta:liste.length ? liste.length + ' öneri'
        : supheli.length + ' belirsiz', wide:true,
      body:html`
        ${/* Uygulama yarida kalmis teklif: uydurmak yerine BILMEDIGIMIZI
              soyleriz. Ne tekrar uygulanir ne de olmus sayilir. */''}
        ${map(supheli, d => html`<div class="mt-8">
          ${K.Notice({ tone:'warn', body:'Bir teklif uygulanırken işlem '
            + 'yarıda kaldı; kaydına yazılıp yazılmadığı bilinmiyor. '
            + 'Hatırlatıcılarına bakıp doğrula.' })}
          <div class="row gap-8 mt-8">
            ${K.Button({ label:'Kontrol ettim', size:'sm',
              act:'hkm-doubt-ok', data:{ 'data-id':String(d.id) } })}
          </div>
        </div>`)}
        ${when(topluKayitlar().length >= 2, () => html`<div class="row gap-8 mt-8">
          ${K.Button({ label:'Hepsini kaydet (' + topluKayitlar().length + ')', size:'sm',
            tone:'primary', act:'hkm-toplu' })}
          <span class="tiny dim">Yalnız okunabilen günlük kayıtlar; yanlışsa o günün oturumlarından silinir.</span>
        </div>`)}
        ${map(liste, n => html`<div class="mt-8">
          ${K.Notice({ tone:'info', body:n.note })}
          ${when(n.kind === 'kayit.add', () => kayitOkuma(n))}
          ${when(n.kind === 'unite.add', () => uniteOnizleme(n.unite))}
          ${when(n.kind === 'belge.add', () => uniteOnizleme(n.belge))}
          ${when(n.kind === 'kart.add' && n.kart, () => html`<p class="tiny ${n.kart.ok ? 'dim' : ''} mt-6">${n.kart.ok
            ? '«' + n.kart.on + '» → «' + n.kart.arka + '» · ' + n.kart.dilAd + ' destesine'
            : n.kart.why}</p>`)}
          <div class="row gap-8 mt-8">
            ${when(ESP.Beacon.canApply(n), () => K.Button({
              label:({ 'kayit.add':'Kaydet', 'urun.add':'Ekle', 'unite.add':'Ekle', 'belge.add':'Ekle', 'kart.add':'Ekle' })[n.kind] || 'Uygula',
              size:'sm', tone:'primary', act:'hkm-intent-yes',
              data:{ 'data-id':String(n.id) } }))}
            ${when(!ESP.Beacon.canApply(n), () => K.Button({ label:'Gördüm',
              size:'sm', tone:'primary', act:'hkm-intent-seen',
              data:{ 'data-id':String(n.id) } }))}
            ${K.Button({ label:'İstemiyorum', size:'sm',
              act:'hkm-intent-no', data:{ 'data-id':String(n.id) } })}
          </div>
        </div>`)}
        <p class="tiny dim mt-10">Bu satırlar birer tekliftir. Onaylarsan
          ESP kendi kaydına yazar; reddedersen HKM kaydı silmez,
          «istenmedi» diye işaretler — görülmemiş bir teklifle reddedilmiş
          bir teklif ayrı şeylerdir.</p>` });
  }

  /* Gunun kaydi: ESP cumleyi NASIL OKUDU. Onaydan once gorunur; suresi ya
     da disiplini tanınmayan parca da SEBEBIYLE yazilir. */
  function kayitOkuma(n){
    const o = n.okuma;
    if(!o) return html`<p class="tiny dim mt-8">ESP bu kaydı okuyamadı.</p>`;
    return html`<div class="mt-8">
      <p class="tiny"><b>ESP şöyle okudu</b> (${o.gun}):</p>
      <ul class="tiny mt-4">
        ${map(o.yazilacak, y => html`<li>${y.baslik}: ${y.satirlar.join('; ')}</li>`)}
        ${map(o.yazilamaz, y => html`<li class="dim">«${y.metin}» — yazılmayacak: ${y.why}</li>`)}
        ${map(o.anlasilmayan, m => html`<li class="dim">«${m}» — anlaşılmadı, yazılmayacak.</li>`)}
      </ul>
      ${when(!o.yazilacak.length, () => html`<p class="tiny dim">Bu cümleden ESP'ye
        yazılacak bir şey çıkmadı; istersen oturumu elle gir.</p>`)}
    </div>`;
  }

  /* TOPLU ONAY yalniz KUCUK tekliflerde: gunluk kayit (kayit.add), ESP'nin
     okuyabildigi; yanlissa o gunun oturumlarindan silinir (AGENTS.md §1.9). */
  function topluKayitlar(){
    return (S.ui.hkmIntents || []).filter(n => n.kind === 'kayit.add'
      && n.okuma && n.okuma.yazilacak && n.okuma.yazilacak.length && ESP.Beacon.canApply(n));
  }

  async function hkmToplu(){
    const l = topluKayitlar();
    let yazilan = 0, kalan = 0;
    for(const n of l){
      const r = await ESP.Beacon.resolveIntent(n, 'apply');
      if(r.ok){
        yazilan++;
        S.ui.hkmIntents = (S.ui.hkmIntents || []).filter(x => x.id !== n.id);
      }else kalan++;
    }
    if(yazilan) ESP.UI.onayMuhru();
    ESP.UI.toast(yazilan + ' kayıt yazıldı' + (kalan ? ', ' + kalan + ' tanesi yazılamadı (kartta duruyor)' : '')
      + '. Yanlışsa o günün oturumlarından silebilirsin.');
    ESP.App.render();
  }

  /* BAM ünitesi: ESP kaydı KENDİ koduyla sınadı; ne ekleneceği ya da neden
     eklenemeyeceği onaydan ÖNCE görünür (core/unite.js). */
  function uniteOnizleme(b){
    if(!b) return html`<p class="tiny dim mt-8">ESP bu teklifi sınayamadı.</p>`;
    if(!b.ok) return html`<p class="tiny dim mt-8">Eklenmeyecek: ${b.why}</p>`;
    const o = b.onizleme;
    return html`<div class="mt-8">
      <p class="tiny"><b>ESP şunu ekleyecek:</b> ${o.baslik}</p>
      <ul class="tiny mt-4">${map(o.satirlar, s => html`<li>${s}</li>`)}</ul>
      ${map(o.uyari || [], u => html`<p class="tiny dim">${u}</p>`)}
    </div>`;
  }

  async function hkmCevap(id, action){
    const liste = S.ui.hkmIntents || [];
    const n = liste.filter(x => String(x.id) === String(id))[0];
    if(!n) return;
    const r = await ESP.Beacon.resolveIntent(n, action);
    /* MUHUR YALNIZ ONAYDA BASILIR. Reddetmek de bir cevaptir ama
       onay degildir; ikisine ayni muhru basmak, muhru anlamsiz
       kilardi. */
    if(r.ok && action !== 'reject' && action !== 'dismiss') ESP.UI.onayMuhru();
    if(!r.ok){ ESP.UI.toast(r.error || 'İşlenemedi'); return; }
    S.ui.hkmIntents = liste.filter(x => x.id !== n.id);
    const bas = r.state === 'applied' ? (r.note || 'Uygulandı')
      : (r.state === 'acknowledged' ? 'Görüldü olarak işaretlendi'
        : 'İstenmedi olarak işaretlendi');
    const metin = r.reported ? bas
      : bas + ' — merkeze bildirilemedi, bağlantı gelince tekrar denenecek.';
    /* BAM ünitesi ve belgesi geri alınır; kullanıcının üzerinde çalıştığı
       kayıt kalır (core/unite.js, core/belge.js). */
    const geriModul = n.kind === 'belge.add' ? ESP.Belge
      : n.kind === 'kart.add' ? { geriAl:ESP.Beacon.kartGeriAl } : ESP.Unite;
    if(r.geriAl && geriModul){
      ESP.UI.toast(metin, { undo:async () => { await geriModul.geriAl(r.geriAl); ESP.App.render(); } });
    }else{
      ESP.UI.toast(metin);
    }
    ESP.App.render();
  }


  function AjanKart(){
    const l = ESP.Plans ? ESP.Plans.all() : [];
    if(!l.length) return '';
    return K.Entry({ label:'Uzman önerileri', hint:'proposal', meta:l.length + ' öneri', wide:true, body:ajanGovde(l) });
  }

  /* ---------- TÜRE GÖRE (kullanıcı, 2026-10-17: «onaylar kısmını daha
     profesyonel, kategorilere ayır») ----------
     Her satır bir TÜRE düşer (brand/ortak/oneri.js ONAY_TURLERI) ve seviyesi
     katalogdan gelir. Uzman önerileri «Plan ve ayar»dadır ve disipline göre
     gruplu kalır (2026-10-16 kararı). Bugün'ün öneri alanı aynı kalır. */
  const ON = () => (window.LIFEOS || {}).ONERI;
  const HKM_AD = { 'kayit.add':'Günün kaydı', 'plan.add':'Çalışma bloğu', 'focus.set':'Günün odağı',
    'material.add':'BAM materyali', 'urun.add':'BAM ürünü', 'unite.add':'BAM ünitesi', 'belge.add':'BAM belgesi',
    'kart.add':'Kelime kartı' };

  function onaySatir(o){
    return html`<div class="onay-satir">
      <div class="onay-satir__bas"><b class="onay-satir__ad">${o.baslik}</b>${raw(ON().seviyeEtiketi(o.seviye))}</div>
      ${when(o.ust, () => html`<p class="onay-satir__ust">${o.ust}</p>`)}
      ${o.govde || ''}
      ${when(o.eylem, () => html`<div class="row wrap gap-8 mt-10">${o.eylem}</div>`)}
    </div>`;
  }
  /* King'in işi para harcar: geri alınamaz, küçük sayılmaz (orta). */
  function kingSatir(t){
    if(t.durum === 'ara_onay') return onaySatir({ baslik:t.konu, seviye:'orta', ust:'İş emri #' + t.id + ' · yarıda, devam onayı bekliyor',
      govde:html`<p class="small mt-6">${t.metin}</p>`,
      eylem:html`${K.Button({ label:'Devam', size:'sm', tone:'primary', act:'king-parca', data:{ 'data-id':String(t.id), 'data-karar':'devam' } })}
        ${K.Button({ label:'Dur ve bitir', size:'sm', act:'king-parca', data:{ 'data-id':String(t.id), 'data-karar':'dur' } })}` });
    return onaySatir({ baslik:t.konu, seviye:'orta', ust:'İş emri #' + t.id + ' · ücretli iş',
      govde:html`${map(t.secenekler, (x, i) => html`<p class="small mt-6">${i + 1}) ${x.metin}</p>`)}
        ${when(t.neden, () => K.Notice({ tone:'info', class:'mt-8',
          body:'Önerim: ' + ((t.secenekler.find(x => x.id === t.oneri) || {}).ad || t.oneri) + ' — ' + t.neden + '.' }))}`,
      eylem:html`${map(t.secenekler, (x, i) => K.Button({ label:(i + 1) + '. seçeneği onayla', size:'sm',
          tone:x.id === (t.oneri || 'tam') ? 'primary' : undefined, act:'king-onayla', data:{ 'data-id':String(t.id), 'data-secenek':x.id } }))}
        ${K.Button({ label:'İptal', size:'sm', act:'king-iptal', data:{ 'data-id':String(t.id) } })}` });
  }
  function hkmSatir(n, seviye){
    return onaySatir({ baslik:HKM_AD[n.kind] || 'Merkez teklifi', seviye, ust:'Merkez teklifi',
      govde:html`<p class="small mt-6">${n.note}</p>
        ${when(n.kind === 'kayit.add', () => kayitOkuma(n))}
        ${when(n.kind === 'unite.add', () => uniteOnizleme(n.unite))}
        ${when(n.kind === 'belge.add', () => uniteOnizleme(n.belge))}
        ${when(n.kind === 'kart.add' && n.kart, () => html`<p class="tiny ${n.kart.ok ? 'dim' : ''} mt-6">${n.kart.ok
          ? '«' + n.kart.on + '» → «' + n.kart.arka + '» · ' + n.kart.dilAd + ' destesine'
          : n.kart.why}</p>`)}`,
      eylem:html`${when(ESP.Beacon.canApply(n), () => K.Button({
          label:({ 'kayit.add':'Kaydet', 'urun.add':'Ekle', 'unite.add':'Ekle', 'belge.add':'Ekle', 'kart.add':'Ekle' })[n.kind] || 'Uygula',
          size:'sm', tone:'primary', act:'hkm-intent-yes', data:{ 'data-id':String(n.id) } }))}
        ${when(!ESP.Beacon.canApply(n), () => K.Button({ label:'Gördüm', size:'sm', tone:'primary', act:'hkm-intent-seen', data:{ 'data-id':String(n.id) } }))}
        ${K.Button({ label:'İstemiyorum', size:'sm', act:'hkm-intent-no', data:{ 'data-id':String(n.id) } })}` });
  }
  /* Yarıda kalan teklif: seviyesi yok, uydurulmaz; yalnız «bilinmiyor». */
  function supheSatir(d){
    return onaySatir({ baslik:'Sonucu belirsiz teklif', ust:'Uygulanırken yarıda kaldı',
      govde:html`<p class="small mt-6">Kaydına yazılıp yazılmadığı bilinmiyor; hatırlatıcılarına bakıp doğrula.</p>`,
      eylem:K.Button({ label:'Kontrol ettim', size:'sm', act:'hkm-doubt-ok', data:{ 'data-id':String(d.id) } }) });
  }
  /* Uzman önerileri disipline göre: her disiplinin EN ÖNDEKİ önerisi görünür,
     kalanı «N öneri daha» altında katlı (2026-10-16). */
  function ajanGovde(l){
    const gruplar = [];
    l.forEach(p => {
      const d = p.disc || '';
      let g = gruplar.find(x => x.disc === d);
      if(!g){ g = { disc:d, l:[] }; gruplar.push(g); }
      g.l.push(p);
    });
    const ad = d => ((ESP.DISCIPLINE_BY_ID || {})[d] || {}).label || 'Genel';
    return gruplar.length < 2 ? ESP.Parts.proposalList(l, 'Bekleyen teklif yok.')
      : html`<div class="oneri-gruplar">${map(gruplar, g => html`<section class="oneri-grup" data-disc="${g.disc}">
          <h2 class="oneri-grup__ad">${ad(g.disc)}</h2>
          ${ESP.Parts.proposalList(g.l.slice(0, 1))}
          ${when(g.l.length > 1, () => html`<details class="oneri-grup__dahasi">
            <summary>${g.l.length - 1} öneri daha</summary>
            ${ESP.Parts.proposalList(g.l.slice(1))}
          </details>`)}
        </section>`)}</div>`;
  }
  function onaySatirlari(){
    const l = [];
    (S.ui.kingTeklifler || []).forEach(t => l.push({ tur:'king', html:kingSatir(t) }));
    (S.ui.hkmIntents || []).forEach(n => { const t = ON().hkmTur(n.kind); l.push({ tur:t.tur, html:hkmSatir(n, t.seviye) }); });
    (S.ui.hkmDoubts || []).forEach(d => l.push({ tur:'sistem', html:supheSatir(d) }));
    return l;
  }
  function grupKutusu(g){
    const toplu = g.id === 'kayit' ? topluKayitlar().length : 0;
    return K.Kutu({ ad:g.ad, ipucu:g.id === 'king' || g.id === 'sistem' ? 'hkm' : undefined,
      yuva:toplu >= 2 ? K.Button({ label:'Hepsini kaydet (' + toplu + ')', size:'sm', tone:'primary', act:'hkm-toplu' }) : String(g.sayi || g.satirlar.length),
      govde:g.govde || html`<div class="onay-liste" data-raf-tam>${map(g.satirlar, s => s.html)}</div>` });
  }

  /* Bekleyen: King + HKM (belirsizler dahil) + ajan teklifleri. Kabuğun
     mor sayacı (115) aynı toplamı gösterir. */
  function bekleyen(){
    let n = (S.ui.kingTeklifler || []).length + (S.ui.hkmIntents || []).length
      + (S.ui.hkmDoubts || []).length;
    try{ if(ESP.Plans) n += ESP.Plans.all().length; }catch(e){ console.error(e); }
    return n;
  }

  /* Bugün'ün Öneri alanı: en öndeki TEK kart; fazlası bir satırla
     Onaylar'a gönderir. Sıra: King → HKM → ajan teklifi. */
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
      const l = ESP.Plans ? ESP.Plans.all() : [];
      if(l.length){ kart = ESP.Parts.proposalList([l[0]]); gosterilen = 1; }
    }
    const kalan = toplam - gosterilen;
    return html`<div class="stack-sm" data-oz="110">${kart}
      ${when(kalan > 0, () => K.Button({ label:'+' + kalan + ' öneri Onaylar\u2019da', size:'sm',
        tone:'ghost', act:'go', data:{ 'data-route':'onaylar' } }))}</div>`;
  }

  /* 179 KAYIT GEÇMİŞİ «Son kararlar» (vitrin, pano «Onaylar › Bekleyen»):
     kararın kaynağı ayrılır — sen, öneri (senin onayınla), ayar (sormadan).
     Onay kaydı olmayan öneri değişikliği GİZLENMEZ, uyarıyla yazılır. */
  function sonKararlar(){
    const G = (window.LIFEOS || {}).GUVEN;
    const DURUM = { applied:'uygulandı', accepted:'uygulandı', rejected:'geçildi', declined:'geçildi', undone:'geri alındı' };
    const rows = (S.proposals || []).filter(p => DURUM[p.state]);
    if(!G || !rows.length) return '';
    const olay = rows.map(p => {
      const k = (ESP.Plans.KIND_BY_ID || {})[p.kind] || {};
      const kendi = p.state === 'declined' || p.state === 'undone';
      return { zaman:p.undoneAt || p.decidedAt || p.at, alan:p.title || k.label || p.kind, eski:null,
        yeni:DURUM[p.state] + (p.gecme && p.gecme.nedenAd ? ' · ' + p.gecme.nedenAd : ''),
        kaynak:kendi || p.source === 'istek' ? 'kullanici' : 'ofis',
        onay:kendi ? null : p.otomatik ? { tur:'ayar' } : { tur:'onay' } };
    });
    /* 119: öneri geçmişi; bekleyen yokken de çizilir (render). */
    return K.Entry({ label:'Son kararlar', meta:rows.length + ' kayıt',
      body:html`<div data-oz="119">${raw(G.gecmisHtml(olay.slice(0, 40)))}</div>` });
  }

  /* Seçici yalnız bekleyen varken (boş Onaylar tek eylemdir, 010); «Son
     kararlar» grupların altında hep görünür (119). */
  function render(){
    const l = onaySatirlari();
    const ajan = ESP.Plans ? ESP.Plans.all() : [];
    const gecmis = sonKararlar();
    if(!l.length && !ajan.length){
      /* Boş durum (10): tek eylem. Geçmiş varsa altında durur (119). */
      const bos = K.Kutu({ ad:'Bekleyen öneri yok', govde:html`
        <p class="small muted">Merkez, King ve ajanlar bir şey önerdiğinde burada durur; sen
          onaylamadan hiçbiri uygulanmaz.</p>
        <div class="mt-10">${K.Button({ label:'Danışma’ya git', size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` });
      return gecmis ? html`${bos}<div class="mt-16">${K.Ledger([gecmis])}</div>` : bos;
    }
    const say = {};
    l.forEach(x => { say[x.tur] = (say[x.tur] || 0) + 1; });
    if(ajan.length) say.plan = (say.plan || 0) + ajan.length;
    let sec = S.ui.onayTur || 'hepsi';
    if(sec !== 'hepsi' && !say[sec]) sec = 'hepsi';
    /* Uzman önerileri tek bir satır gibi «Plan ve ayar»a katılır; kutunun
       gövdesi disiplin gruplarıdır. */
    const gruplar = ON().turlereAyir(l.concat(ajan.length ? [{ tur:'plan', ajan:true }] : []))
      .filter(g => sec === 'hepsi' || g.id === sec)
      .map(g => g.id !== 'plan' || !ajan.length ? g : Object.assign({}, g, { sayi:say.plan,
        govde:html`${when(g.satirlar.some(x => !x.ajan), () => html`<div class="onay-liste" data-raf-tam>${map(g.satirlar.filter(x => !x.ajan), x => x.html)}</div>`)}
          <div data-raf-tam>${ajanGovde(ajan)}</div>` }))
      .map(grupKutusu);
    return html`<div class="onaylar">${raw(ON().turSeciciHtml({ secili:sec, sayilar:say, act:'onay-tur' }))}
      ${K.Stack(gruplar.concat([gecmis].filter(Boolean)))}</div>`;
  }

  const handle = {
    'onay-tur'(el){ S.ui.onayTur = el.dataset.value; ESP.App.render(); },
    /* King'in teklifi (brand/ortak/kingteklif.js): onay ve iptal HKM'nin
       tek kapısına gider; cevabı HKM kurar. */
    async 'king-onayla'(el){
      if(!ESP.KingTeklif) return;
      el.disabled = true;
      const r = await ESP.KingTeklif.onayla(el.dataset.id, el.dataset.secenek);
      ESP.UI.toast(r.metin);
      S.ui.kingTeklifler = ESP.KingTeklif.liste();
      ESP.App.render();
    },
    async 'king-parca'(el){
      if(!ESP.KingTeklif) return;
      el.disabled = true;
      const r = await ESP.KingTeklif.parca(el.dataset.id, el.dataset.karar);
      ESP.UI.toast(r.metin);
      S.ui.kingTeklifler = ESP.KingTeklif.liste();
      ESP.App.render();
    },
    async 'king-iptal'(el){
      if(!ESP.KingTeklif) return;
      const r = await ESP.KingTeklif.iptal(el.dataset.id);
      ESP.UI.toast(r.metin);
      S.ui.kingTeklifler = ESP.KingTeklif.liste();
      ESP.App.render();
    },
    async 'hkm-toplu'(){ await hkmToplu(); },
    async 'hkm-intent-yes'(el){ await hkmCevap(el.dataset.id, 'apply'); },
    async 'hkm-intent-seen'(el){ await hkmCevap(el.dataset.id, 'seen'); },
    async 'hkm-intent-no'(el){ await hkmCevap(el.dataset.id, 'dismiss'); },

    async 'hkm-doubt-ok'(el){
      const r = await ESP.Beacon.clearDoubt(el.dataset.id);
      S.ui.hkmDoubts = (S.ui.hkmDoubts || [])
        .filter(x => String(x.id) !== el.dataset.id);
      ESP.UI.toast(r.reported ? 'Kapatıldı; merkeze «belirsiz» diye bildirildi.'
        : 'Kapatıldı; merkeze şimdilik bildirilemedi.');
      ESP.App.render();
    },

  };
  /* Vitrin öneri kartının eylemleri (parts.js köprüsü). */
  ['oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'].forEach(a => {
    handle[a] = el => { const k = ESP.Parts.kopru(); return k ? k.handle[a](el) : null; }; });

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
