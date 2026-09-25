/* Hatırlatmaların yüzü (core/hatirlat.js). Bugün ekranında vakti gelenler,
   Özet'te günün listesi, İlaç sekmesinde «Hatırlat» düğmesi — üçü de aynı
   düzenleme sayfasını açar. Eylemler her ekrandan çalışsın diye app.js
   bunları genel eylemlere katar. */

window.SP = window.SP || {};

SP.HatirlatUI = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, when, map } = SP.h;
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
      <span class="small"><b class="num">${r.saat}</b> ${r.ad}
        ${when(r.durum === 'sonra', () => html`<span class="tiny dim"> · saati gelmedi</span>`)}</span>
      ${satirDugme(r)}</div>`;
  }

  /* Bugün ekranının başı: yalnız VAKTİ GELMİŞ, işaretlenmemiş olanlar. */
  function vaktiRow(){
    if(!SP.Hatirlat) return null;
    const l = H().bugun().filter(r => r.durum === 'vakti');
    if(!l.length) return null;
    return K.Entry({ label:'Hatırlatma', meta:l.length + ' bekliyor', wide:true,
      body:html`${map(l, satir)}` });
  }

  /* Özet sekmesi: günün bütün hatırlatmaları + düzenleme. */
  function ozetEntry(){
    if(!SP.Hatirlat) return null;
    const l = H().bugun();
    return K.Entry({ label:'Hatırlatmalar', meta:l.length ? l.length + ' saat' : 'yok',
      note:'Yalnız senin yazdığın saatler. Sistem saat ya da doz önermez.',
      action:K.Button({ label:l.length ? 'Düzenle' : 'Hatırlatma ekle', size:'sm', act:'ht-ac' }),
      body:l.length ? html`${map(l, satir)}`
        : html`<p class="small dim">İlaç ya da takviye, su ve hareket için saat koyabilirsin.</p>` });
  }

  let taslak = { tur:'su', medId:null };

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
        html`<div id="ht-hata" class="small" role="alert"></div>`,
        when(!ilaclar.length, () => html`<p class="tiny dim">İlaç hatırlatması için önce
          Testler › İlaç sekmesinden kullandığın şeyi kaydet.</p>`),
        K.Notice({ tone:'info', body:'Hatırlatma yalnız SPİ açıkken gelir: Bugün ekranında görünür, '
          + 'izin verirsen tarayıcı bildirimi de olur. İlaç adı HKM\'ye gitmediği için Telegram\'dan '
          + 'hatırlatılmaz. «Aldım» bir işarettir; işaretlenmeyen saat «alınmadı» sayılmaz.' }),
        when(H().bildirimSorunu(), () => K.Notice({ tone:'warn', body:H().bildirimSorunu() })),
        when(H().bildirimVar(), () => html`<div class="row wrap gap-6">
          ${d.bildirim && H().bildirimIzinli()
            ? K.Button({ label:'Tarayıcı bildirimini kapat', size:'sm', act:'ht-bildirim', data:{ 'data-v':'0' } })
            : K.Button({ label:'Tarayıcı bildirimini aç', size:'sm', act:'ht-bildirim', data:{ 'data-v':'1' } })}</div>`),
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
      const r = await H().ekle({ tur:taslak.tur, medId:taslak.medId, saatler:e ? e.value : '' });
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
      await H().isaretle(el.dataset.k, el.dataset.v === '1');
      yenile();
    },
    async 'ht-bildirim'(el){
      if(el.dataset.v === '1'){
        const r = await H().bildirimAc();
        UI.toast(r.ok ? 'Bildirim açık · SPİ açıkken saatinde gelir' : r.why, { life:r.ok ? 2000 : 5000 });
      }else{
        await H().bildirimKapat();
        UI.toast('Bildirim kapatıldı');
      }
      sayfa();
    },
  };

  const change = {
    async 'ht-tur'(el){
      const v = String(el.value || '');
      taslak = v.indexOf('ilac:') === 0 ? { tur:'ilac', medId:v.slice(5) } : { tur:v, medId:null };
      sayfa();
    },
  };

  return { vaktiRow, ozetEntry, handle, change };
})();
