/* GİZLİLİK KİLİDİ — katalog 176 (T5, ekip/EKIP-PLANI.md §4.2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kilit.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır. Biçimi `kilit.css`.

   Uygulama açılırken dört haneli kod sorulur; kilit ekranında sistemin
   simgesi de durur (hangi sistemin kilidi olduğu karışmaz).

   NE OLDUĞU, NE OLMADIĞI — kullanıcıya da aynen söylenir:
   Bu bir PERDEDİR, kasa değil. Sağlık ve para verisi yanındaki birinin
   gözünün önünde açılmasın diye vardır. Veriyi ŞİFRELEMEZ: veri yine bu
   tarayıcının deposunda durur. Kod düz yazılmaz; tuzlu SHA-256 özeti
   tutulur (tarayıcı desteklemiyorsa basit bir özet — ikisi de perde için
   yeterli, kasa için değil).

   KODU UNUTAN KİLİTLİ KALMAZ: «Kodu unuttum» beş dakika bekletir, sonra
   kilidi kaldırır ve uygulamayı açar. Verisine ulaşamayan bir kullanıcı,
   verisini kaybetmiş bir kullanıcıdır — perde bunun bedeli olamaz.

   Süre K'nin kararı (EKIP-PLANI §8-12): bir dakika, yanındaki meraklı
   birinin bekleyip geçeceği kadar kısaydı; beş dakika kasıtlı bir bekleyiş
   ister, unutan için bir kerelik bir bedeldir. Kilit bu yolla kalkarsa İZ
   kalır (`lifeos.kilit.<modül>.iz`): Ayarlar'daki kutu kilidin ne zaman
   «Kodu unuttum» ile kaldırıldığını söyler; kilit yeniden kurulunca silinir.
   Sessizce kalkan perde, sahibinin haberi olmadan açılmış perdedir. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.KILIT = (function(){
  const UZUNLUK = 4;
  const UNUTTUM_SN = 300;
  const BEKLE_SN = 5;          // üç yanlıştan sonra
  const AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  function anahtar(modul){ return 'lifeos.kilit.' + String(modul || 'genel'); }
  function oku(modul){
    try{ const v = window.localStorage.getItem(anahtar(modul)); return v ? JSON.parse(v) : null; }
    catch(e){ return null; }
  }
  function yaz(modul, v){
    try{ window.localStorage.setItem(anahtar(modul), JSON.stringify(v)); return true; }catch(e){ return false; }
  }
  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  function gecerliMi(kod){ return new RegExp('^\\d{' + UZUNLUK + '}$').test(String(kod || '')); }

  async function ozetle(tuz, kod){
    const metin = String(tuz) + ':' + String(kod);
    try{
      if(window.crypto && window.crypto.subtle && window.TextEncoder){
        const b = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
        return 'sha256:' + Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
      }
    }catch(e){ /* güvenli bağlam yok: aşağıdaki özet */ }
    let h = 2166136261;
    for(let i = 0; i < metin.length; i++){ h ^= metin.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 'fnv:' + h.toString(16);
  }
  function tuzUret(){
    try{
      const a = new Uint8Array(8); window.crypto.getRandomValues(a);
      return Array.from(a).map(x => x.toString(16).padStart(2, '0')).join('');
    }catch(e){ return String(Date.now()) + Math.random().toString(16).slice(2); }
  }

  function aktifMi(modul){ const v = oku(modul); return !!(v && v.ozet); }
  async function kur(modul, kod){
    if(!gecerliMi(kod)) return { ok:false, neden:'Kod dört rakam olmalı.' };
    const tuz = tuzUret();
    const ok = yaz(modul, { surum:1, tuz, ozet:await ozetle(tuz, kod) });
    if(ok) izSil(modul);
    return ok ? { ok:true } : { ok:false, neden:'Bu tarayıcı kilidi saklayamıyor (site verisi kapalı).' };
  }
  function kaldir(modul){ try{ window.localStorage.removeItem(anahtar(modul)); }catch(e){} }

  /* İz: kilit «Kodu unuttum» ile kalktıysa ne zaman. */
  function izAnahtar(modul){ return anahtar(modul) + '.iz'; }
  function izOku(modul){
    try{ const v = window.localStorage.getItem(izAnahtar(modul)); return v ? JSON.parse(v) : null; }
    catch(e){ return null; }
  }
  function izSil(modul){ try{ window.localStorage.removeItem(izAnahtar(modul)); }catch(e){} }
  function unutuldu(modul, zaman){
    kaldir(modul);
    try{ window.localStorage.setItem(izAnahtar(modul),
      JSON.stringify({ tur:'unutuldu', zaman:(zaman || new Date()).toISOString() })); }catch(e){}
  }

  /* «4 dakika 59 saniye» — geri sayım ve ayar metni için. */
  function sureMetni(sn){
    sn = Math.max(0, Math.round(Number(sn) || 0));
    const dk = Math.floor(sn / 60), s = sn % 60;
    if(!dk) return s + ' saniye';
    return dk + ' dakika' + (s ? ' ' + s + ' saniye' : '');
  }
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos',
    'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function zamanMetni(iso){
    const d = new Date(iso);
    if(isNaN(d.getTime())) return '';
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear() + ' · '
      + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  async function dogrula(modul, kod){
    const v = oku(modul);
    if(!v) return true;
    if(!gecerliMi(kod)) return false;
    return (await ozetle(v.tuz, kod)) === v.ozet;
  }

  /* ------------------------------------------------------------ ekran */

  function ekranHtml(modul, isaret){
    return '<div class="kilit" id="kilit" role="dialog" aria-modal="true" aria-labelledby="kilit-ad" data-oz="176">'
      + '<div class="kilit__kutu">'
      +   '<div class="kilit__isaret" aria-hidden="true">' + (isaret || '') + '</div>'
      +   '<h1 class="kilit__ad" id="kilit-ad">' + kac(AD[modul] || modul) + ' kilitli</h1>'
      +   '<label class="kilit__etiket" for="kilit-kod">Dört haneli kod</label>'
      +   '<input class="input kilit__kod" id="kilit-kod" type="password" inputmode="numeric"'
      +     ' autocomplete="off" maxlength="' + UZUNLUK + '" pattern="\\d*" aria-describedby="kilit-not">'
      +   '<p class="kilit__not" id="kilit-not" role="status" aria-live="polite"></p>'
      +   '<button type="button" class="linkbtn kilit__unuttum" data-kilit="unuttum">Kodu unuttum</button>'
      + '</div></div>';
  }

  /* Açılışta çağrılır; kilit yoksa hemen döner. Kod doğru girilince ya da
     «unuttum» süresi dolunca çözülür. */
  function ac(modul, o){
    o = o || {};
    if(!aktifMi(modul)) return Promise.resolve('kilit-yok');
    return new Promise(coz => {
      const kap = document.createElement('div');
      kap.innerHTML = ekranHtml(modul, o.isaret);
      const el = kap.firstElementChild;
      document.body.appendChild(el);
      const app = document.getElementById('app');
      if(app){ app.setAttribute('inert', ''); app.setAttribute('aria-hidden', 'true'); }
      const kod = el.querySelector('#kilit-kod');
      const not = el.querySelector('#kilit-not');
      let yanlis = 0, beklemede = false, sayac = null;

      const bitir = neden => {
        clearInterval(sayac);
        el.remove();
        if(app){ app.removeAttribute('inert'); app.removeAttribute('aria-hidden'); }
        coz(neden);
      };
      kod.addEventListener('input', async () => {
        kod.value = kod.value.replace(/\D/g, '').slice(0, UZUNLUK);
        if(beklemede || kod.value.length < UZUNLUK) return;
        if(await dogrula(modul, kod.value)){ bitir('acildi'); return; }
        yanlis++;
        kod.value = '';
        el.classList.remove('is-yanlis'); void el.offsetWidth; el.classList.add('is-yanlis');
        if(yanlis >= 3){
          beklemede = true; kod.disabled = true;
          not.textContent = 'Üç kez yanlış. ' + BEKLE_SN + ' saniye bekle.';
          setTimeout(() => { beklemede = false; yanlis = 0; kod.disabled = false; not.textContent = ''; kod.focus(); }, BEKLE_SN * 1000);
        }else{
          not.textContent = 'Kod yanlış.';
        }
      });
      el.addEventListener('click', e => {
        const b = e.target.closest && e.target.closest('[data-kilit="unuttum"]');
        if(!b || sayac) return;
        let kalan = UNUTTUM_SN;
        b.disabled = true;
        const yaz = () => { not.textContent = 'Kilit ' + sureMetni(kalan) + ' sonra kalkacak; uygulama açılacak, kilit yeniden kurulana kadar kapalı kalacak ve Ayarlar kaldırıldığını yazacak.'; };
        yaz();
        sayac = setInterval(() => {
          kalan--;
          if(kalan <= 0){ unutuldu(modul); bitir('unutuldu'); return; }
          yaz();
        }, 1000);
      });
      setTimeout(() => { try{ kod.focus(); }catch(e){} }, 30);
    });
  }

  /* ------------------------------------------------------------ ayar */

  /* Ayarlar'daki kutu. Kod kurulurken iki kez yazılır; kutu kendi içinde
     değişir (yeniden çizim beklemez). */
  /* o.govde: yalnız gövde — ekran kendi kutusuna (Entry, Card) koyar. */
  function ayarHtml(modul, o){
    o = o || {};
    const acik = aktifMi(modul);
    const iz = izOku(modul);
    const m = kac(modul);
    const govde = '<div class="kilit-ayar" data-kilit-ayar="' + m + '"' + (o.govde ? ' data-kilit-govde' : '') + '>'
      + '<p class="small">Açılışta dört haneli kod sorar. Veriyi şifrelemez: yanındaki birinin gözünden korur.'
      +   ' Şu an <b>' + (acik ? 'açık' : 'kapalı') + '</b>.</p>'
      + '<div class="kilit-ayar__form" hidden>'
      +   '<label class="field"><span>Yeni kod</span><input class="input" id="kilit-yeni-' + m + '" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>'
      +   '<label class="field"><span>Yeniden</span><input class="input" id="kilit-tekrar-' + m + '" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>'
      +   '<p class="small kilit-ayar__not" role="status" aria-live="polite"></p>'
      + '</div>'
      + '<div class="row wrap gap-8 mt-8">'
      +   (acik
        ? '<button type="button" class="btn btn--sm" data-kilit="degistir">Kodu değiştir</button>'
          + '<button type="button" class="btn btn--sm" data-kilit="kaldir">Kilidi kaldır</button>'
        : '<button type="button" class="btn btn--sm" data-kilit="kur">Kilidi kur</button>')
      +   '<button type="button" class="btn btn--sm" data-kilit="kaydet" hidden>Kodu kaydet</button>'
      +   '<button type="button" class="btn btn--sm" data-kilit="vazgec" hidden>Vazgeç</button>'
      + '</div>'
      + (!acik && iz && iz.tur === 'unutuldu'
        ? '<p class="small kilit-ayar__iz mt-8" data-kilit-iz>Kilit «Kodu unuttum» ile kaldırıldı · ' + kac(zamanMetni(iz.zaman)) + '. Sen değilsen kodu yeniden kur.</p>'
        : '')
      + '<p class="tiny dim mt-8">Kodu unutursan kilit ekranındaki «Kodu unuttum» beş dakika sonra kilidi kaldırır; kaldırıldığı burada yazar.</p>'
      + '</div>';
    if(o.govde) return govde;
    return '<section class="kutu" data-oz="176"><header class="kutu__bas"><h2 class="kutu__ad">Gizlilik kilidi</h2>'
      + '<span class="kutu__yuva"></span></header><div class="kutu__govde">' + govde + '</div></section>';
  }

  function ayarYenile(kutu){
    const modul = kutu.getAttribute('data-kilit-ayar');
    const k = document.createElement('div');
    k.innerHTML = ayarHtml(modul, { govde:true });
    kutu.replaceWith(k.firstElementChild);
  }

  async function ayarEylem(b){
    const kutu = b.closest('[data-kilit-ayar]');
    if(!kutu) return false;
    const modul = kutu.getAttribute('data-kilit-ayar');
    const form = kutu.querySelector('.kilit-ayar__form');
    const not = kutu.querySelector('.kilit-ayar__not');
    const goster = acik => {
      form.hidden = !acik;
      kutu.querySelectorAll('[data-kilit="kaydet"], [data-kilit="vazgec"]').forEach(x => { x.hidden = !acik; });
      kutu.querySelectorAll('[data-kilit="kur"], [data-kilit="degistir"], [data-kilit="kaldir"]').forEach(x => { x.hidden = acik; });
      if(acik){ const i = form.querySelector('input'); if(i) i.focus(); }
    };
    const ne = b.getAttribute('data-kilit');
    if(ne === 'kur' || ne === 'degistir'){ goster(true); return true; }
    if(ne === 'vazgec'){ form.querySelectorAll('input').forEach(i => { i.value = ''; }); not.textContent = ''; goster(false); return true; }
    if(ne === 'kaldir'){ kaldir(modul); ayarYenile(kutu); return true; }
    if(ne === 'kaydet'){
      const a = form.querySelectorAll('input')[0].value, t = form.querySelectorAll('input')[1].value;
      if(!gecerliMi(a)){ not.textContent = 'Kod dört rakam olmalı.'; return false; }
      if(a !== t){ not.textContent = 'İki kod aynı değil.'; return false; }
      const r = await kur(modul, a);
      if(!r.ok){ not.textContent = r.neden; return false; }
      ayarYenile(kutu);
      return true;
    }
    return false;
  }

  let kuruldu = false;
  function kurDinle(){
    if(kuruldu) return;
    kuruldu = true;
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-kilit-ayar] [data-kilit]');
      /* Kilit ekranının «unuttum»u kendi dinleyicisindedir. */
      if(b) ayarEylem(b);
    });
  }

  return { UZUNLUK, UNUTTUM_SN, aktifMi, kur, kaldir, dogrula, ozetle, ekranHtml, ac,
    ayarHtml, ayarEylem, kurDinle, unutuldu, izOku, izSil, sureMetni };
})();
