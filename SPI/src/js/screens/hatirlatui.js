/* Hatırlatmaların yüzü (core/hatirlat.js). Bugün ekranında vakti gelenler,
   Özet'te günün listesi, İlaç sekmesinde «Hatırlat» düğmesi — üçü de aynı
   düzenleme sayfasını açar. Eylemler her ekrandan çalışsın diye app.js
   bunları genel eylemlere katar.

   2026-10-25 sürtünme turu: aynı saate düşen iki ve fazlası hatırlatma
   için tek «Hepsini aldım» (her satır yine kendi «Geri al»ını taşır);
   hazır antrenmana bağlı hareket hatırlatmasında «Yaptım» o seansı ekler
   ve «Geri al» bırakır (core/hatirlat.js söz 5, 6). */

window.SP = window.SP || {};

SP.HatirlatUI = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const K = SP.C;
  const H = () => SP.Hatirlat;

  function satirDugme(r){
    return r.durum === 'yapildi'
      ? html`<span class="tiny dim">${r.eylem.toLocaleLowerCase('tr')} ·
          ${K.Button({ label:'Geri al', size:'sm', act:'ht-isaret',
            data:{ 'data-k':r.anahtar, 'data-v':'0' } })}</span>`
      : K.Button({ label:r.eylem, size:'sm', tone:r.durum === 'vakti' ? 'primary' : '',
          act:'ht-isaret', data:{ 'data-k':r.anahtar, 'data-v':'1' } });
  }

  function satir(r){
    return html`<div class="row between wrap gap-6 mt-6">
      <span class="small"><b class="num">${r.saat}</b> ${r.ad}${when(r.hazirAd, () => html`<span class="dim"> · ${r.hazirAd}</span>`)}
        ${when(r.durum === 'sonra', () => html`<span class="tiny dim"> · saati gelmedi</span>`)}</span>
      ${satirDugme(r)}</div>`;
  }

  /* Aynı saatte işaretlenmemiş iki ve fazlası satır varsa saatin başına tek
     düğme. Yalnız ilaç/takviyeyse «Hepsini aldım», karışıksa «Hepsini
     işaretle». Doz ve sayı gösterilmez. */
  function hepsiDugme(saat, l){
    const bekleyen = l.filter(r => r.durum !== 'yapildi');
    if(bekleyen.length < 2) return '';
    const etiket = bekleyen.every(r => r.tur === 'ilac') ? 'Hepsini aldım' : 'Hepsini işaretle';
    return html`<div class="row between wrap gap-6 mt-6">
      <span class="tiny dim"><b class="num">${saat}</b> · ${bekleyen.length} hatırlatma</span>
      ${K.Button({ label:etiket, size:'sm', tone:bekleyen.some(r => r.durum === 'vakti') ? 'primary' : '', act:'ht-hepsi',
        aria:etiket + ', ' + saat + ', ' + bekleyen.length + ' hatırlatma',
        data:{ 'data-k':bekleyen.map(r => r.anahtar).join(',') } })}</div>`;
  }
  function satirlar(l){
    const saatler = [];
    l.forEach(r => { if(saatler.indexOf(r.saat) < 0) saatler.push(r.saat); });
    return html`${map(saatler, saat => {
      const g = l.filter(r => r.saat === saat);
      return html`${hepsiDugme(saat, g)}${map(g, satir)}`;
    })}`;
  }

  /* Bugün ekranının başı: yalnız VAKTİ GELMİŞ, işaretlenmemiş olanlar. */
  function vaktiRow(){
    if(!SP.Hatirlat) return null;
    const l = H().bugun().filter(r => r.durum === 'vakti');
    if(!l.length) return null;
    return K.Entry({ label:'Hatırlatma', meta:l.length + ' bekliyor', wide:true,
      body:satirlar(l) });
  }

  /* Özet sekmesi: günün bütün hatırlatmaları + düzenleme. */
  function ozetEntry(){
    if(!SP.Hatirlat) return null;
    const l = H().bugun();
    return K.Entry({ label:'Hatırlatmalar', meta:l.length ? l.length + ' saat' : 'yok',
      note:'Yalnız senin yazdığın saatler. Sistem saat ya da doz önermez.',
      action:K.Button({ label:l.length ? 'Düzenle' : 'Hatırlatma ekle', size:'sm', act:'ht-ac' }),
      body:l.length ? satirlar(l)
        : html`<p class="small dim">İlaç ya da takviye, su ve hareket için saat koyabilirsin.</p>` });
  }

  let taslak = { tur:'su', medId:null };
  const hazirlar = () => (SP.Hazir ? SP.Hazir.antrenmanlar() : []);

  function sayfa(){
    const d = H().durum();
    const ilaclar = SP.Meds.activeList();
    const secenek = [{ value:'su', label:'Su' }, { value:'hareket', label:'Hareket molası' }, { value:'olcum', label:'Sabah tartısı' }]
      .concat(ilaclar.map(m => ({ value:'ilac:' + m.id, label:'İlaç / takviye — ' + (m.name || SP.Meds.kindOf(m).name) })));
    const deger = taslak.tur === 'ilac' ? 'ilac:' + taslak.medId : taslak.tur;
    const onceki = d.liste.find(h => h.tur === taslak.tur && (taslak.tur !== 'ilac' || h.medId === taslak.medId));
    UI.sheet({
      title:'Hatırlatmalar', subtitle:'yalnız senin yazdığın saatler', wide:true,
      body:String(K.Stack([
        when(d.liste.length, () => K.Table({ tight:true, headers:['Ne', 'Saatler', ''],
          rows:d.liste.map(h => [H().adOf(h), h.saatler.join(', '),
            K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
              act:'ht-sil', data:{ 'data-id':h.id } })]) })),
        K.Field({ label:'Ne için',
          input:K.Select({ id:'ht-tur', value:deger, change:'ht-tur', options:secenek }) }),
        K.Field({ label:'Saatler', hint:'virgülle ayır — örn. 08:00, 21:00',
          input:K.Input({ id:'ht-saat', value:onceki ? onceki.saatler.join(', ') : '',
            placeholder:taslak.tur === 'su' ? '10:00, 13:00, 16:00' : taslak.tur === 'olcum' ? '07:30' : '08:00' }) }),
        /* Söz 6: hareket hatırlatması isteğe bağlı bir hazır antrenmana bağlanır. */
        when(taslak.tur === 'hareket' && hazirlar().length, () => K.Field({ label:'«Yaptım» deyince ekle',
          hint:'Seçersen Bugün\'de «Yaptım» bu antrenmanı bugüne ekler; «Geri al» kaldırır.',
          input:K.Select({ id:'ht-hazir', value:(onceki && onceki.hazirId) || '',
            options:[{ value:'', label:'Hiçbiri — yalnız işaret' }].concat(hazirlar().map(a => ({ value:a.id, label:a.ad }))) }) })),
        html`<div id="ht-hata" class="small" role="alert"></div>`,
        when(!ilaclar.length, () => html`<p class="tiny dim">İlaç hatırlatması için önce
          Testler › İlaç sekmesinden kullandığın şeyi kaydet.</p>`),
        K.Notice({ tone:'info', body:(H().telefonMu()
            ? 'Telefon bildirimi açıksa saatler önümüzdeki ' + H().PLAN_GUN + ' güne kurulur: SPİ kapalıyken de gelir. '
              + 'Uygulamayı bir hafta açmazsan susar. '
            : 'Hatırlatma yalnız SPİ açıkken gelir: Bugün ekranında görünür, izin verirsen tarayıcı bildirimi de olur. ')
          + 'İlaç adı HKM\'ye gitmediği için Telegram\'dan '
          + 'hatırlatılmaz. «Aldım» bir işarettir; işaretlenmeyen saat «alınmadı» sayılmaz.' }),
        when(H().bildirimSorunu(), () => K.Notice({ tone:'warn', body:H().bildirimSorunu() })),
        when(H().bildirimVar(), () => html`<div class="row wrap gap-6">
          ${d.bildirim && H().bildirimIzinli()
            ? K.Button({ label:(H().telefonMu() ? 'Telefon' : 'Tarayıcı') + ' bildirimini kapat', size:'sm', act:'ht-bildirim', data:{ 'data-v':'0' } })
            : K.Button({ label:(H().telefonMu() ? 'Telefon' : 'Tarayıcı') + ' bildirimini aç', size:'sm', act:'ht-bildirim', data:{ 'data-v':'1' } })}</div>`),
        /* Telefonda kurulu bildirimler (brand/ortak/bildirim.js söz 8). */
        when(H().telefonMu() && d.bildirim, () => html`<div class="row wrap gap-6">${K.Button({ label:'Kurulu bildirimler', size:'sm',
          data:{ 'data-tb-ac':'1', 'data-tb-not':'Tamamen kapatmak için «Telefon bildirimini kapat».' } })}</div>`),
        /* 180/122: tür anahtarı ve sessiz saatler (brand/ortak/pwa.js). */
        when(d.bildirim && H().bildirimIzinli() && VT() && VT().bildirimKutusu, () => raw(VT().bildirimKutusu({ modul:'spi',
          turler:[{ id:'hatirlatma', ad:'SPİ · hatırlatma' }] }))),
      ])),
      footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'ht-kaydet' })}`),
      noFocus:true,
    });
  }

  function yenile(){ SP.App.render(); }

  const handle = {
    async 'ht-ac'(el){
      const tur = el && el.dataset && el.dataset.tur;
      taslak = el && el.dataset && el.dataset.med ? { tur:'ilac', medId:el.dataset.med }
        : { tur:tur && H().TUR[tur] ? tur : 'su', medId:null };
      sayfa();
    },
    async 'ht-kaydet'(){
      const e = document.getElementById('ht-saat');
      const hz = document.getElementById('ht-hazir');
      const r = await H().ekle({ tur:taslak.tur, medId:taslak.medId, saatler:e ? e.value : '',
        hazirId:taslak.tur === 'hareket' && hz ? hz.value : undefined });
      if(!r.ok){
        const h = document.getElementById('ht-hata');
        if(h) h.textContent = r.why;
        return;
      }
      UI.toast('Hatırlatma kaydedildi · ' + r.saatler.join(', '));
      sayfa();
      yenile();
    },
    async 'ht-sil'(el){
      const r = await H().sil(el.dataset.id);
      if(!r.ok) return;
      sayfa();
      yenile();
      UI.toast('Hatırlatma silindi', { undo:async () => { await H().geriKoy(r.geri); yenile(); } });
    },
    async 'ht-isaret'(el){
      if(el.dataset.v === '1'){
        const r = await H().yaptim(el.dataset.k);
        yenile();
        if(r.ok && r.seans) UI.toast('«' + r.seans.ad + '» bugüne eklendi', { undo:async () => { await r.geriAl(); yenile(); } });
        return;
      }
      const kalkti = await H().isaretle(el.dataset.k, false);
      yenile();
      if(kalkti) UI.toast('İşaret ve eklenen seans kaldırıldı');
    },
    async 'ht-hepsi'(el){
      const l = String(el.dataset.k || '').split(',').filter(Boolean);
      const r = await H().isaretleHepsi(l);
      yenile();
      if(!r.isaretlenen.length) return;
      UI.toast(r.isaretlenen.length + ' hatırlatma işaretlendi' + (r.seanslar.length ? ' · seans eklendi' : ''),
        { undo:async () => { await r.geriAl(); yenile(); } });
    },
    async 'bildirim-tur'(el){ bildirimYenile(el, 'bildirim-tur'); },
    async 'bildirim-sessiz'(el){ bildirimYenile(el, 'bildirim-sessiz'); },
    async 'ht-bildirim'(el){
      if(el.dataset.v === '1'){
        const r = await H().bildirimAc();
        UI.toast(r.ok ? (r.telefon ? 'Bildirim açık · saatinde gelir, SPİ kapalıyken de' : 'Bildirim açık · SPİ açıkken saatinde gelir')
          : r.why, { life:r.ok ? 2000 : 5000 });
      }else{
        await H().bildirimKapat();
        UI.toast('Bildirim kapatıldı');
      }
      sayfa();
    },
  };

  function bildirimYenile(el, ad){
    const r = VT() && VT().bildirimEylem ? VT().bildirimEylem('spi', ad, el) : null;
    if(r && r.metin) UI.toast(r.metin);
    sayfa();
    /* Telefonda: sessiz saat ve tür kurulu bildirimlere hemen uyar. */
    if(H().telefonMu()) H().planla();
  }

  const change = {
    async 'bildirim-saat'(el){ bildirimYenile(el, 'bildirim-saat'); },
    async 'ht-tur'(el){
      const v = String(el.value || '');
      taslak = v.indexOf('ilac:') === 0 ? { tur:'ilac', medId:v.slice(5) } : { tur:v, medId:null };
      sayfa();
    },
  };

  return { vaktiRow, ozetEntry, handle, change };
})();
