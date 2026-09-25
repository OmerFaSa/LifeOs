/* Onaylar — bekleyen her öneri TEK çekmecede (ekip/CEKMECE-HARITASI.md).

   Dört kaynak, tek yer:
     King teklifi     ücretli iş King'in onay kapısında (HKM core/king.py)
     HKM teklifi      Merkez'in kuyruğu (core/beacon.js intents): kayıt,
                      ürün, BAM bilgisi (besin, fiyat, yer)
     Sonucu belirsiz  uygulanırken yarıda kalmış HKM teklifi (yerel defter)
     Bekleyen kayıt   Danışma'da konuşurken çıkan, onay bekleyen kayıt
                      (core/proposals.js)

   Önce Bugün'ün başında ayrı ayrı duruyorlardı; kural «onaylar tek
   çekmecede». Bugün'ün Öneri alanı yalnız EN ÖNDEKİ kartı gösterir, gerisi
   burada bekler (`oneriAlani`). Hiçbir şey kullanıcı görmeden uygulanmaz;
   uygulayan SPİ'nin kendi kodudur. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.onaylar = (function(){
  const S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C;

  /* ---------- King teklifi (Part 8a-3b) ----------

     Ücretli iş King'in onay kapısında bekler (HKM core/king.py). Seçenek
     metni ve sayılar HKM'den gelir; kart yalnız yazar ve onayı iletir. */
  function KingTeklifKart(){
    const liste = S.ui.kingTeklifler || [];
    if(!liste.length) return '';
    return K.Kutu({ ad:'King teklifi', ipucu:'hkm', yuva:liste.length + ' iş onayını bekliyor',
      govde:html`
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
        ${K.Ayrinti({ ozet:'King ücretli bir işi onayın olmadan açmaz.',
          govde:'Sınıf, maliyet ve süre King’in hesabıdır (tahmin); sen onaylayınca iş BAM’da '
            + 'başlar ve sonucu teklif olarak buraya gelir.' })}` });
  }

  /* ---------- HKM teklifleri ----------

     HKM bu sisteme YAZMAZ: kuyruktan gelen her satır bir TEKLİFTİR ve
     kullanıcı görmeden hiçbir şey uygulanmaz. Uygulayan da HKM değil,
     SPİ'nin kendi kodudur. Kuyruk boşsa kart hiç çizilmez.

     Uygulanırken yarıda kalan teklif de burada durur: plana yazılıp
     yazılmadığını BİLMİYORUZ ve bunu söyleriz — ne yeniden uygulanır ne
     olmuş sayılır. (Bu satırlar açılışta çekiliyordu ama hiçbir ekranda
     çizilmiyordu.) */
  function HkmTeklifKart(){
    const liste = S.ui.hkmIntents || [];
    const supheli = S.ui.hkmDoubts || [];
    if(!liste.length && !supheli.length) return '';
    return K.Kutu({ ad:'HKM teklifi', ipucu:'hkm',
      yuva:liste.length ? liste.length + ' teklif bekliyor'
        : supheli.length + ' teklifin sonucu belirsiz',
      govde:html`
        ${map(supheli, d => html`<div class="mt-8">
          ${K.Notice({ tone:'warn', body:'Bir teklif uygulanırken işlem yarıda kaldı; kaydına '
            + 'yazılıp yazılmadığı bilinmiyor. Kaydına bakıp doğrula.' })}
          <div class="row gap-8 mt-8">
            ${K.Button({ label:'Kontrol ettim', size:'sm',
              act:'hkm-doubt-ok', data:{ 'data-id':String(d.id) } })}
          </div>
        </div>`)}
        ${when(topluKayitlar().length >= 2, () => html`<div class="row gap-8 mt-8">
          ${K.Button({ label:'Hepsini kaydet (' + topluKayitlar().length + ')', size:'sm',
            tone:'primary', act:'hkm-toplu' })}
          <span class="tiny dim">Yalnız okunabilen günlük kayıtlar; her biri Danışma ekranından geri alınır.</span>
        </div>`)}
        ${map(liste, n => html`<div class="mt-8">
          ${K.Notice({ tone:'info', body:n.note })}
          ${when(n.kind === 'kayit.add', () => kayitOkuma(n))}
          ${when(SP.Bilgi && SP.Bilgi.NIYET[n.kind], () => bilgiOnizleme(n))}
          <div class="row gap-8 mt-8">
            ${/* Uygulanamayan türde «Uygula» ÇIKMAZ: görünen eylem,
                  yapılabilen eylemle aynı olmalı. */''}
            ${SP.Beacon.canApply(n)
              ? K.Button({ label:({ 'kayit.add':'Kaydet', 'urun.add':'Ekle', 'besin.add':'Ekle',
                'fiyat.add':'Ekle', 'yer.add':'Ekle' })[n.kind] || 'Planına ekle',
                size:'sm', tone:'primary',
                act:'hkm-intent-apply', data:{ 'data-id':String(n.id) } })
              : K.Button({ label:'Gördüm', size:'sm', tone:'primary',
                act:'hkm-intent-yes', data:{ 'data-id':String(n.id) } })}
            ${K.Button({ label:'İstemiyorum', size:'sm',
              act:'hkm-intent-no', data:{ 'data-id':String(n.id) } })}
          </div>
        </div>`)}
        ${K.Ayrinti({ ozet:'Bu satırlar birer tekliftir.',
          govde:'Onaylarsan SPİ kendi kaydına yazar; reddedersen HKM kaydı silmez, «istenmedi» '
            + 'diye işaretler — görülmemiş bir teklifle reddedilmiş bir teklif ayrı şeylerdir.' })}` });
  }

  /* BAM bilgisi: SPİ kaydı KENDİ koduyla sınadı; ne ekleneceği ya da neden
     eklenemeyeceği onaydan ÖNCE görünür (core/bilgi.js). */
  function bilgiOnizleme(n){
    const b = n.bilgi;
    if(!b) return html`<p class="tiny dim mt-8">SPİ bu kaydı sınayamadı.</p>`;
    if(!b.ok) return html`<p class="tiny dim mt-8">Eklenmeyecek: ${b.why}</p>`;
    const o = b.onizleme;
    return html`<div class="mt-8">
      <p class="tiny"><b>SPİ şunu ekleyecek:</b> ${o.baslik}</p>
      <ul class="tiny mt-4">${map(o.satirlar, s => html`<li>${s}</li>`)}</ul>
      ${map(o.uyari || [], u => html`<p class="tiny dim">${u}</p>`)}
    </div>`;
  }

  /* Günün kaydı: SPİ cümleyi NASIL OKUDU. Onaydan önce görünür; yazılamayan
     ve anlaşılmayan parça da SEBEBİYLE yazılır. */
  function kayitOkuma(n){
    const o = n.okuma;
    if(!o) return html`<p class="tiny dim mt-8">SPİ bu kaydı okuyamadı.</p>`;
    return html`<div class="mt-8">
      <p class="tiny"><b>SPİ şöyle okudu</b> (${o.gun}):</p>
      <ul class="tiny mt-4">
        ${map(o.yazilacak, y => html`<li>${y.baslik}: ${y.satirlar.join('; ')}</li>`)}
        ${map(o.yazilamaz, y => html`<li class="dim">«${y.metin}» — yazılmayacak: ${y.why}</li>`)}
        ${map(o.anlasilmayan, m => html`<li class="dim">«${m}» — anlaşılmadı, yazılmayacak.</li>`)}
      </ul>
      ${when(!o.yazilacak.length, () => html`<p class="tiny dim">Bu cümleden SPİ'ye
        yazılacak bir şey çıkmadı; istersen kaydı elle gir.</p>`)}
    </div>`;
  }

  /* TOPLU ONAY yalnız KÜÇÜK tekliflerde: günlük kayıt (kayit.add), SPİ'nin
     okuyabildiği ve Danışma'dan geri alınabilen (AGENTS.md §1.9). */
  function topluKayitlar(){
    return (S.ui.hkmIntents || []).filter(n => n.kind === 'kayit.add'
      && n.okuma && n.okuma.yazilacak && n.okuma.yazilacak.length && SP.Beacon.canApply(n));
  }

  async function hkmToplu(){
    const l = topluKayitlar();
    let yazilan = 0, kalan = 0;
    for(const n of l){
      const r = await SP.Beacon.resolveIntent(n, 'apply');
      if(r.ok){
        yazilan++;
        S.ui.hkmIntents = (S.ui.hkmIntents || []).filter(x => x.id !== n.id);
      }else kalan++;
    }
    if(yazilan) SP.UI.onayMuhru();
    UI.toast(yazilan + ' kayıt yazıldı' + (kalan ? ', ' + kalan + ' tanesi yazılamadı (kartta duruyor)' : '')
      + '. Yanlış olanı Danışma ekranından geri alabilirsin.');
    SP.App.render();
  }

  /* HKM teklifine verilen cevabın TEK yolu: yerel kayıt AĞDAN ÖNCE
     yazılır, bildirim sonra denenir. «İşaretlendi ama merkeze
     bildirilemedi» hali yutulmaz, SÖYLENİR.

     SPİ'de «Gördüm» bir UYGULAMA değildir: ölçüm de yük de kullanıcının
     kararıdır. Merkeze de öyle bildirilir — «uygulandı» değil «görüldü». */
  async function hkmCevap(id, action){
    const liste = S.ui.hkmIntents || [];
    const n = liste.filter(x => String(x.id) === String(id))[0];
    if(!n) return;
    const r = await SP.Beacon.resolveIntent(n, action);
    /* MÜHÜR YALNIZ ONAYDA BASILIR. Reddetmek de bir cevaptır ama
       onay değildir; ikisine aynı mührü basmak, mührü anlamsız
       kılardı. */
    if(r.ok && action !== 'reject' && action !== 'dismiss') SP.UI.onayMuhru();
    if(!r.ok){ UI.toast(r.error || 'İşlenemedi'); return; }
    S.ui.hkmIntents = liste.filter(x => x.id !== n.id);
    const bas = r.state === 'applied' ? (r.note || 'Uygulandı')
      : r.state === 'acknowledged'
        ? (r.note || 'Görüldü olarak işaretlendi')
        : 'İstenmedi olarak işaretlendi';
    const metin = r.reported ? bas
      : bas + ' — merkeze bildirilemedi, bağlantı gelince tekrar denenecek.';
    /* BAM bilgisi geri alınır: gıda silinir, tahmin fiyat eski hâline döner. */
    if(r.geriAl && SP.Bilgi){
      UI.toast(metin, { undo:async () => { await SP.Bilgi.geriAl(r.geriAl); SP.App.render(); } });
    }else{
      UI.toast(metin);
    }
    SP.App.render();
  }

  /* ---------- bekleyen kayıtlar ----------

     Danışma'da konuşurken üretilen bir kayıt onaylanmadan başka bir ekrana
     geçilirse GÖRÜNMEZ olur ve kullanıcı kaydettiğini sanıyor olabilir:
     onaylanmamış bir kayıt, unutulmuş bir kayıttır. Burada bekler; sayısı
     üst çubuğun mor sayacındadır. */
  /* VİTRİN ÖNERİ KARTI (110 · 123 · 113): bekleyen kayıt ortak kartla
     çizilir; yazan yine yalnız SP.Proposals.approve'dur. Önizleme satırları
     (alan → sonra) kartın altında kalır: neyin yazılacağı onaydan önce görünür. */
  function kopru(){
    const O = (window.LIFEOS || {}).ONERI;
    if(!O || !O.kopru || !SP.Proposals) return null;
    const kat = SP.Proposals.katalogIdleri().map(id => Object.assign({ id, title:(SP.Proposals.eylem(id) || {}).label },
      SP.Proposals.eylem(id)));
    return O.kopru({
      katalog:kat,
      satirlar:() => SP.Proposals.pending(),
      nesne:o => { const e = SP.Proposals.eylem(o.action) || {};
        return { id:o.id, eylem:o.action, level:o.level, baslik:e.label || o.action, kaynak:'modul',
          kapsam:e.level === 'kucuk' ? 'yalnız bugün' : null,
          cumle:o.reason ? { metin:o.reason, kaynak:o.source === 'llm' ? 'model' : 'kural' } : null }; },
      uygula:id => handle['bekleyen-onay']({ dataset:{ id } }),
      gec:async (id, kayit) => { await SP.Proposals.reject(id, kayit); UI.toast('Geçildi; kayıt yazılmadı.'); SP.App.render(); },
      onizle:o => { const pv = SP.Proposals.preview(o);
        return { govde:pv.ok && pv.rows.length ? '<p class="small">' + pv.rows.map(r => SP.U.esc(r.alan + ' → ' + r.sonra)).join(' · ') + '</p>' : '' }; },
      pencere:o => UI.sheet({ title:o.baslik, body:o.govde, footer:o.ayak }),
      kapat:() => UI.closeSheet(),
    });
  }

  function BekleyenKart(){
    const liste = SP.Proposals ? SP.Proposals.pending() : [];
    if(!liste.length) return '';
    const k = kopru();
    const kartlar = k ? liste.map(o => {
      const kart = k.kart(o);
      if(!kart) return null;
      const pv = SP.Proposals.preview(o);
      return html`<div class="okart-sar">${raw(kart)}${when(pv.ok && pv.rows.length, () => html`
        <p class="okart__kim">${pv.rows.map(r => r.alan + ' → ' + r.sonra).join(' · ')}</p>`)}</div>`;
    }) : [];
    if(k && kartlar.every(Boolean)) return html`<div class="stack-sm">${kartlar}</div>`;
    return K.Kutu({ ad:liste.length === 1 ? 'Bir kayıt onayını bekliyor'
      : liste.length + ' kayıt onayını bekliyor', yuva:'Onaylanana kadar hiçbiri yazılmadı',
      govde:html`<div class="bekleyen">${map(liste, o => {
        const e = SP.Proposals.eylem(o.action);
        const pv = SP.Proposals.preview(o);
        return html`<div class="bekleyen__satir">
          <span class="bekleyen__ne">${e ? e.label : o.action}</span>
          <span class="bekleyen__ne2">${pv.ok && pv.rows.length
            ? pv.rows.map(r => r.alan + ' → ' + r.sonra).join(' · ') : (pv.why || '')}</span>
          <span class="bekleyen__dug">
            ${K.Button({ label:'Kaydet', size:'sm', tone:'primary',
              act:'bekleyen-onay', data:{ 'data-id':o.id } })}
            ${K.Button({ label:'Vazgeç', size:'sm', act:'bekleyen-ret', data:{ 'data-id':o.id } })}
          </span>
        </div>`;
      })}</div>` });
  }

  /* Bekleyen: King + HKM (belirsizler dahil) + bekleyen kayıt. Kabuğun
     mor sayacı (115) aynı toplamı gösterir. */
  function bekleyen(){
    let n = (S.ui.kingTeklifler || []).length + (S.ui.hkmIntents || []).length
      + (S.ui.hkmDoubts || []).length;
    try{ if(SP.Proposals) n += SP.Proposals.pending().length; }catch(e){ console.error(e); }
    return n;
  }

  /* Bugün'ün Öneri alanı: en öndeki TEK kart; fazlası bir satırla
     Onaylar'a gönderir. Sıra: King (parası ödenecek iş bekliyor) → HKM →
     bekleyen kayıt. */
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
      kart = BekleyenKart();
      gosterilen = SP.Proposals ? SP.Proposals.pending().length : 0;
    }
    const kalan = toplam - gosterilen;
    return html`<div class="stack-sm" data-oz="110">
      ${kart}
      ${when(kalan > 0, () => html`<p class="small">${K.Button({ label:'+' + kalan + ' öneri Onaylar’da',
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
    const rows = (SP.Proposals ? SP.Proposals.all() : []).filter(p => DURUM[p.status]);
    if(!G || !rows.length) return '';
    const olay = rows.map(p => {
      const e = SP.Proposals.eylem(p.action) || {};
      const kendi = p.status === 'rejected' || p.status === 'undone';
      return { zaman:p.undoneAt || p.appliedAt || p.at, alan:e.label || p.action, eski:null,
        yeni:DURUM[p.status] + (p.gecme && p.gecme.nedenAd ? ' · ' + p.gecme.nedenAd : ''),
        kaynak:kendi || p.source === 'istek' ? 'kullanici' : 'ofis',
        onay:kendi ? null : p.otomatik ? { tur:'ayar' } : { tur:'onay' } };
    });
    return K.Kutu({ ad:'Son kararlar', yuva:rows.length + ' kayıt', govde:raw(G.gecmisHtml(olay.slice(0, 40))) });
  }

  async function render(){
    const kartlar = [KingTeklifKart(), HkmTeklifKart(), BekleyenKart()].filter(Boolean);
    if(!kartlar.length){
      /* Boş durum (10): yalnız veri yokken; tek eylem. */
      return String(K.Kutu({ ad:'Bekleyen öneri yok', govde:html`
        <p class="small muted">Merkez, King ve Danışma bir şey önerdiğinde burada durur; sen
          onaylamadan hiçbiri uygulanmaz.</p>
        <div class="mt-10">${K.Button({ label:'Danışma’ya git', size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` }));
    }
    return String(html`<div class="onaylar-raf">${K.Stack(kartlar)}${sonKararlar()}</div>`);
  }

  /* ---------- eylemler ---------- */
  const handle = {
    /* King'in teklifi (brand/ortak/kingteklif.js): onay ve iptal HKM'nin
       tek kapısına gider; cevabı HKM kurar. */
    async 'king-onayla'(el){
      if(!SP.KingTeklif) return;
      el.disabled = true;
      const r = await SP.KingTeklif.onayla(el.dataset.id, el.dataset.secenek);
      UI.toast(r.metin);
      S.ui.kingTeklifler = SP.KingTeklif.liste();
      SP.App.render();
    },
    async 'king-parca'(el){
      if(!SP.KingTeklif) return;
      el.disabled = true;
      const r = await SP.KingTeklif.parca(el.dataset.id, el.dataset.karar);
      UI.toast(r.metin);
      S.ui.kingTeklifler = SP.KingTeklif.liste();
      SP.App.render();
    },
    async 'king-iptal'(el){
      if(!SP.KingTeklif) return;
      const r = await SP.KingTeklif.iptal(el.dataset.id);
      UI.toast(r.metin);
      S.ui.kingTeklifler = SP.KingTeklif.liste();
      SP.App.render();
    },
    async 'hkm-toplu'(){ await hkmToplu(); },
    async 'hkm-intent-yes'(el){ await hkmCevap(el.dataset.id, 'seen'); },
    async 'hkm-intent-apply'(el){ await hkmCevap(el.dataset.id, 'apply'); },
    async 'hkm-intent-no'(el){ await hkmCevap(el.dataset.id, 'dismiss'); },
    async 'hkm-doubt-ok'(el){
      const r = await SP.Beacon.clearDoubt(el.dataset.id);
      S.ui.hkmDoubts = (S.ui.hkmDoubts || []).filter(x => String(x.id) !== el.dataset.id);
      UI.toast(r && r.reported ? 'Kapatıldı; merkeze «belirsiz» diye bildirildi.'
        : 'Kapatıldı; merkeze şimdilik bildirilemedi.');
      SP.App.render();
    },
    async 'bekleyen-onay'(el){
      const r = await SP.Proposals.approve(el.dataset.id);
      UI.toast(r.ok ? 'Kaydedildi' : (r.why || 'Kaydedilemedi'));
      SP.App.render();
    },
    async 'bekleyen-ret'(el){
      await SP.Proposals.reject(el.dataset.id);
      SP.App.render();
    },
  };
  ['oneri-uygula', 'oneri-gec', 'oneri-gec-neden', 'oneri-onizle'].forEach(a => {
    handle[a] = el => { const k = kopru(); return k ? k.handle[a](el) : null; }; });

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
