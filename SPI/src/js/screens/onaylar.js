/* Onaylar — bekleyen her öneri TEK çekmecede (belgeler/ekip/CEKMECE-HARITASI.md).

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
  /* KISAYOLLARDAN GELEN ÖNERİ (hesap gelen kutusu, Proposals.disaridan):
     kartın altında nereden geldiği yazar; dün gönderilmiş satır «yalnız
     bugün» diye görünmez, kendi gününü söyler. */
  function gelenMi(o){ return (o.iz || []).some(x => x && x.tur === 'gelen'); }
  function gunAd(iso){
    const n = SP.U.diffDays(SP.U.todayISO(), iso);
    return n === 0 ? 'bugün' : n === -1 ? 'dün' : SP.U.fmtShort(iso);
  }
  function kapsamOf(o, e){
    if(e.level !== 'kucuk') return null;
    const d = o.params && o.params.date;
    return 'yalnız ' + (SP.U.isISO(d) ? gunAd(d) : 'bugün');
  }
  function kimOf(o, pv){
    const l = pv.ok && pv.rows.length ? [pv.rows.map(r => r.alan + ' → ' + r.sonra).join(' · ')] : [];
    if(gelenMi(o)) l.push('Kısayollar’dan' + (o.gelenKaynak ? ' (' + o.gelenKaynak + ')' : ''));
    return l.join(' · ');
  }

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
          kapsam:kapsamOf(o, e),
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
      const pv = SP.Proposals.preview(o), kim = kimOf(o, pv);
      return html`<div class="okart-sar">${raw(kart)}${when(kim, () => html`
        <p class="okart__kim">${kim}</p>`)}</div>`;
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

  /* ---------- TÜRE GÖRE (kullanıcı, 2026-10-17: «onaylar kısmını daha
     profesyonel, kategorilere ayır») ----------
     Her satır bir TÜRE düşer (brand/ortak/oneri.js ONAY_TURLERI) ve seviyesi
     katalogdan gelir. SPİ'nin bekleyen kaydı katalogda ölçümse (olcum:true)
     «Kayıt», değilse «Plan ve ayar». Bugün'ün öneri alanı aynı kalır. */
  const ON = () => (window.LIFEOS || {}).ONERI;
  const HKM_AD = { 'kayit.add':'Günün kaydı', 'plan.apply':'Haftalık program', 'urun.add':'BAM ürünü',
    'besin.add':'Besin bilgisi', 'fiyat.add':'Fiyat bilgisi', 'yer.add':'Yer bilgisi' };

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
        ${when(SP.Bilgi && SP.Bilgi.NIYET[n.kind], () => bilgiOnizleme(n))}`,
      eylem:html`${SP.Beacon.canApply(n)
          ? K.Button({ label:({ 'kayit.add':'Kaydet', 'urun.add':'Ekle', 'besin.add':'Ekle',
            'fiyat.add':'Ekle', 'yer.add':'Ekle' })[n.kind] || 'Planına ekle',
            size:'sm', tone:'primary', act:'hkm-intent-apply', data:{ 'data-id':String(n.id) } })
          : K.Button({ label:'Gördüm', size:'sm', tone:'primary', act:'hkm-intent-yes', data:{ 'data-id':String(n.id) } })}
        ${K.Button({ label:'İstemiyorum', size:'sm', act:'hkm-intent-no', data:{ 'data-id':String(n.id) } })}` });
  }
  /* Yarıda kalan teklif: seviyesi yok, uydurulmaz; yalnız «bilinmiyor». */
  function supheSatir(d){
    return onaySatir({ baslik:'Sonucu belirsiz teklif', ust:'Uygulanırken yarıda kaldı',
      govde:html`<p class="small mt-6">Kaydına yazılıp yazılmadığı bilinmiyor; kaydına bakıp doğrula.</p>`,
      eylem:K.Button({ label:'Kontrol ettim', size:'sm', act:'hkm-doubt-ok', data:{ 'data-id':String(d.id) } }) });
  }
  /* Bekleyen kayıt: vitrin kartı (seviye rozeti kartın içinde); kart
     çizilemezse sade satır, yazan yine yalnız SP.Proposals.approve. */
  function bekleyenSatir(o, k){
    const kart = k ? k.kart(o) : '';
    const pv = SP.Proposals.preview(o);
    if(kart){
      const kim = kimOf(o, pv);
      return html`<div class="okart-sar">${raw(kart)}${when(kim, () => html`<p class="okart__kim">${kim}</p>`)}</div>`;
    }
    const e = SP.Proposals.eylem(o.action) || {};
    return onaySatir({ baslik:e.label || o.action, seviye:o.level || e.level,
      ust:pv.ok && pv.rows.length ? pv.rows.map(r => r.alan + ' → ' + r.sonra).join(' · ') : (pv.why || ''),
      eylem:html`${K.Button({ label:'Kaydet', size:'sm', tone:'primary', act:'bekleyen-onay', data:{ 'data-id':o.id } })}
        ${K.Button({ label:'Vazgeç', size:'sm', act:'bekleyen-ret', data:{ 'data-id':o.id } })}` });
  }
  function onaySatirlari(){
    const l = [];
    (S.ui.kingTeklifler || []).forEach(t => l.push({ tur:'king', html:kingSatir(t) }));
    (S.ui.hkmIntents || []).forEach(n => { const t = ON().hkmTur(n.kind); l.push({ tur:t.tur, html:hkmSatir(n, t.seviye) }); });
    (S.ui.hkmDoubts || []).forEach(d => l.push({ tur:'sistem', html:supheSatir(d) }));
    try{
      const k = kopru();
      (SP.Proposals ? SP.Proposals.pending() : []).forEach(o => {
        const e = SP.Proposals.eylem(o.action) || {};
        l.push({ tur:e.olcum || gelenMi(o) ? 'kayit' : 'plan', html:bekleyenSatir(o, k) });
      });
    }catch(e){ console.error(e); }
    return l;
  }
  function grupKutusu(g){
    const toplu = g.id === 'kayit' ? topluKayitlar().length : 0;
    return K.Kutu({ ad:g.ad, ipucu:g.id === 'king' || g.id === 'sistem' ? 'hkm' : undefined,
      yuva:toplu >= 2 ? K.Button({ label:'Hepsini kaydet (' + toplu + ')', size:'sm', tone:'primary', act:'hkm-toplu' }) : String(g.satirlar.length),
      govde:html`<div class="onay-liste" data-raf-tam>${map(g.satirlar, s => s.html)}</div>` });
  }

  /* Bekleyen: King + HKM (belirsizler dahil) + bekleyen kayıt. Kabuğun
     mor sayacı (115) aynı toplamı gösterir. */
  function bekleyen(){
    let n = (S.ui.kingTeklifler || []).length + (S.ui.hkmIntents || []).length
      + (S.ui.hkmDoubts || []).length;
    try{ if(SP.Proposals) n += SP.Proposals.pending().length; }catch(e){ console.error(e); }
    n += cikarimSayisi();
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
    /* 119: öneri geçmişi; bekleyen yokken de çizilir (render). */
    return K.Kutu({ ad:'Son kararlar', yuva:rows.length + ' kayıt',
      govde:html`<div data-oz="119">${raw(G.gecmisHtml(olay.slice(0, 40)))}</div>` });
  }

  /* Seçici yalnız bekleyen varken (boş Onaylar tek eylemdir, 010); «Son
     kararlar» grupların altında hep görünür (119). */
  /* ÇIKARIMLAR (King söz 23; kullanıcı, 2026-10-18: «çıkarım sohbet arasında
     olmasın, Onaylar denilen yerde olsun»). King'in senin hakkındaki
     tahminleri burada kart olarak durur; kararı sen verirsin. Kart
     brand/ortak/king.js'ten (cikarimKarti), karar cikarimOnayla'dan. */
  function cikarimSayisi(){
    try{ const Kg = (window.LIFEOS || {}).KING; return Kg && Kg.cikarimAdaylari ? Math.min(3, Kg.cikarimAdaylari().length) : 0; }
    catch(e){ return 0; }
  }
  function cikarimKutusu(){
    const Kg = (window.LIFEOS || {}).KING;
    let h = '';
    try{ h = Kg && Kg.cikarimKarti ? Kg.cikarimKarti(3) : ''; }catch(e){ console.error(e); }
    if(!h) return '';
    return String(K.Kutu({ ad:'Çıkarımlar', yuva:String(cikarimSayisi()), govde:html`
      <p class="small muted">King’in senin hakkındaki tahminleri. Doğruysa kaydedilir; yanlışsa bir daha sorulmaz.</p>${raw(h)}` }));
  }

  async function render(){
    const ana = String(await onayRender());
    const ck = cikarimKutusu();
    return ck ? String(html`<div data-oz="cikarim">${raw(ck)}</div><div class="mt-16">${raw(ana)}</div>`) : ana;
  }

  async function onayRender(){
    const l = onaySatirlari();
    const gecmis = sonKararlar();
    if(!l.length){
      /* Boş durum (10): tek eylem. Geçmiş varsa altında durur (119). */
      const bos = K.Kutu({ ad:'Bekleyen öneri yok', govde:html`
        <p class="small muted">Merkez, King ve Danışma bir şey önerdiğinde burada durur; sen
          onaylamadan hiçbiri uygulanmaz.</p>
        <div class="mt-10">${K.Button({ label:'Danışma’ya git', size:'sm', act:'go',
          data:{ 'data-route':'team' } })}</div>` });
      return String(gecmis ? html`<div class="onaylar-raf">${bos}${gecmis}</div>` : bos);
    }
    const say = {};
    l.forEach(x => { say[x.tur] = (say[x.tur] || 0) + 1; });
    let sec = S.ui.onayTur || 'hepsi';
    if(sec !== 'hepsi' && !say[sec]) sec = 'hepsi';
    const gruplar = ON().turlereAyir(l).filter(g => sec === 'hepsi' || g.id === sec).map(grupKutusu);
    return String(html`<div class="onaylar">${raw(ON().turSeciciHtml({ secili:sec, sayilar:say, act:'onay-tur' }))}
      ${gecmis ? html`<div class="onaylar-raf">${K.Stack(gruplar)}${gecmis}</div>` : K.Stack(gruplar)}</div>`);
  }

  /* ---------- eylemler ---------- */
  const handle = {
    'onay-tur'(el){ S.ui.onayTur = el.dataset.value; SP.App.render(); },
    /* Çıkarım kararı: Doğru / Yanlış / kendi cümlenle düzelt. */
    async 'cikarim-karar'(el){
      const Kg = (window.LIFEOS || {}).KING;
      if(!Kg || !Kg.cikarimOnayla) return;
      const id = el.dataset.id, karar = el.dataset.karar;
      let metin = '';
      if(karar === 'kismen'){
        const g = Array.from(document.querySelectorAll('[data-cikarim-metin]')).find(x => x.getAttribute('data-cikarim-metin') === id);
        metin = g ? g.value : '';
      }
      const r = await Kg.cikarimOnayla(id, karar, metin);
      SP.UI.toast(r.metin, r.geriAl ? { undo:async () => { await r.geriAl(); SP.App.render(); } } : undefined);
      if(r.ok) SP.App.render();
    },
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
