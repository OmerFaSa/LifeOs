/* GÜNÜ KAPAT — akşam tek ekran: doğru olanı tek dokunuşla kaydet (KOLAY-PLANI Faz 1).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/gunukapat.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `gunukapat.css`.
   ==================================================================

   Depo sahibi (2026-10-25): «Günü kapat özelliği için ölçümlü bir plan
   hazırla» → kararlar: «ölçüm satırları toplu onaylanmaz, tek satırla
   yazılır; süre pusulada tahmin etiketiyle ölçülür».

   SÖZLEŞME — modül bir kez bağlar:
       GUNUKAPAT.kur({ modul, satirlar(gun) → [Satır], bildir(metin, geriAl), yenile(), olcumOrnek })
       Satır = { id, ad, tur:'beyan'|'olcum', yazildi?, oneri?:{ metin, kaynak:'plan'|'kalip'|'dun'|'son' },
                 ipucu?, yaz?(gun) → metin | { metin, geriAl } | { atlandi:true } }

   Sözler:
     1. İKİ TÜR SATIR. BEYAN satırı (su hedefi, kalıptan öğün, hatırlatma
        işareti, plandaki işin «yapıldı»sı) önerisiyle gelir ve «Hepsi doğru»
        ile yazılır: kullanıcının beyanıdır (KOLAY §2.1). ÖLÇÜM satırı (kilo,
        nabız, uyku, soru, doğru) ASLA toplu yazılmaz: son değer yalnız ipucu
        olarak görünür; ölçüm ekrandaki tek satıra yazılır ve modülün kendi
        tek satır ayrıştırıcısından (giris.js) geçer (AGENTS §1.1).
     2. DOKUNULMAYAN YAZILMAZ. Önerisi olmayan, zaten yazılmış ya da
        kullanıcının işaretini kaldırdığı satır yazılmaz; gün «girilmedi»
        kalır, sıfır sayılmaz (AGENTS §1.2).
     3. HEPSİ YA DA HİÇBİRİ. Ölçüm satırında anlaşılmayan parça varsa hiçbir
        şey yazılmaz ve nedeni söylenir (giris söz 2). Yazarken bir satır
        hata verirse o ana kadar yazılanlar geri alınır.
     4. TEK «GERİ AL». Bütün yazılanlar tek dokunuşla, sondan başa geri
        alınır (küçük aksiyon, AGENTS §1.9). «Emin misin?» sorulmaz.
     5. SATIRI MODÜL YAZAR. Bu dosya karar üretmez ve hiçbir depoya
        yazmaz; her satırın yaz()'ı modülün kendi kodudur (KOLAY §2.6).
     6. KALIP ÖLÇÜLÜR, UYDURULMAZ. «Her zamanki» önerisi yalnız son 7 günün
        en az 4'ünde aynı kayıttan gelir (kalip(); KOLAY §2.4). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.GUNUKAPAT = (function(){
  'use strict';

  let ayar = null;
  let bagli = false;
  const atla = {};        // gun → { satırId:true }  (kullanıcı işaretini kaldırdı)
  const sonMesaj = {};    // gun → { tur, metin }
  const suruyor = {};     // gun → true  (kapat sürüyor; ikinci çağrı yazmaz)

  const KAYNAK = { plan:'plan', kalip:'her zamanki', dun:'dünkü', son:'son değer' };

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const metinOf = r => r && typeof r === 'object' ? String(r.metin || '') : (r ? String(r) : '');
  const geriAlOf = r => r && typeof r === 'object' && typeof r.geriAl === 'function' ? r.geriAl : null;

  function satirlar(gun){
    if(!ayar || typeof ayar.satirlar !== 'function') return [];
    try{ return (ayar.satirlar(gun) || []).filter(s => s && s.id && s.ad); }
    catch(e){ console.error('Günü kapat: satırlar', e); return []; }
  }
  /* Söz 1–2: «Hepsi doğru»nun yazacağı beyan satırları. */
  function yazilacaklar(gun){
    const a = atla[gun] || {};
    return satirlar(gun).filter(s => s.tur === 'beyan' && !s.yazildi && s.oneri && typeof s.yaz === 'function' && !a[s.id]);
  }

  /* Söz 6: son `pencere` günün (bugün hariç) en az `esik`inde görülen anahtarlar.
     kayitlar: [{ gun:'YYYY-AA-GG', anahtar }]; bir gün bir anahtarı bir kez sayar. */
  function kalip(kayitlar, bugun, o){
    o = Object.assign({ pencere:7, esik:4 }, o || {});
    const b = new Date(String(bugun) + 'T12:00:00');
    if(isNaN(b)) return [];
    const gunler = new Set();
    for(let i = 1; i <= o.pencere; i++){
      const d = new Date(b); d.setDate(b.getDate() - i);
      gunler.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    }
    const say = {};
    (kayitlar || []).forEach(k => {
      if(!k || !gunler.has(k.gun) || k.anahtar == null || k.anahtar === '') return;
      (say[k.anahtar] = say[k.anahtar] || new Set()).add(k.gun);
    });
    return Object.keys(say).filter(a => say[a].size >= o.esik).sort((x, y) => say[y].size - say[x].size);
  }

  function satirHtml(s, gun){
    const a = atla[gun] || {};
    if(s.tur === 'olcum'){
      return '<li class="gk__satir gk__satir--olcum">'
        + '<span class="gk__ad">' + kac(s.ad) + '</span>'
        + '<span class="gk__oneri">' + kac(s.ipucu || 'ölçtüysen aşağıya yaz') + '</span>'
        + (s.yazildi ? '<span class="gk__durum">girildi</span>' : '<span class="gk__kaynak">ölçüm · toplu yazılmaz</span>')
        + '</li>';
    }
    if(s.yazildi){
      return '<li class="gk__satir is-yazildi"><span class="gk__ad">' + kac(s.ad) + '</span>'
        + '<span class="gk__oneri">' + kac((s.oneri && s.oneri.metin) || s.ipucu || '') + '</span>'
        + '<span class="gk__durum">kaydedildi</span></li>';
    }
    if(!s.oneri || typeof s.yaz !== 'function'){
      return '<li class="gk__satir is-bos"><span class="gk__ad">' + kac(s.ad) + '</span>'
        + '<span class="gk__oneri">' + kac(s.ipucu || 'öneri yok · girmezsen boş kalır') + '</span></li>';
    }
    const sec = !a[s.id];
    return '<li class="gk__satir' + (sec ? '' : ' is-atla') + '">'
      + '<label class="gk__sec"><input type="checkbox" data-gk-sec="' + kac(s.id) + '"' + (sec ? ' checked' : '')
      + ' aria-label="' + kac(s.ad + ': ' + s.oneri.metin + (sec ? ', kaydedilecek' : ', kaydedilmeyecek')) + '"/>'
      + '<span class="gk__ad">' + kac(s.ad) + '</span>'
      + '<span class="gk__oneri">' + kac(s.oneri.metin) + '</span>'
      + '<span class="gk__kaynak">' + kac(KAYNAK[s.oneri.kaynak] || s.oneri.kaynak || '') + '</span></label></li>';
  }

  /* Modülün ekranı ya da alt sayfası bunu çizer. */
  function cizim(gun){
    if(!ayar) return '';
    bagla();
    const l = satirlar(gun);
    const n = yazilacaklar(gun).length;
    const m = sonMesaj[gun];
    const ornek = ayar.olcumOrnek ? 'Örneğin: ' + ayar.olcumOrnek : 'Ölçtüğünü yaz';
    return '<section class="gunukapat" data-gunukapat data-gun="' + kac(gun) + '" aria-label="Günü kapat">'
      + '<p class="gk__not">Doğru olanı tek dokunuşla kaydet. Farklı olanın işaretini kaldır; ölçümleri aşağıya yaz.</p>'
      + (l.length ? '<ul class="gk__liste">' + l.map(s => satirHtml(s, gun)).join('') + '</ul>'
        : '<p class="gk__bos">Bugün için önerilecek bir şey yok.</p>')
      + '<form class="gk__form" data-gk-form data-ayar-disi>'
      + '<label class="gk__etiket" for="gk-olcum">Ölçümler</label>'
      + '<input class="gk__girdi" id="gk-olcum" type="text" autocomplete="off" enterkeyhint="done" placeholder="' + kac(ornek) + '"/>'
      + '<button type="submit" class="btn btn--primary gk__kapat" data-gk="kapat"><span class="btn__label">'
      + (n ? 'Hepsi doğru · kaydet (' + n + ')' : 'Kaydet') + '</span></button>'
      + '</form>'
      + '<div class="gk__sonuc" data-gk-sonuc aria-live="polite">'
      + (m ? '<p class="gk__mesaj gk__mesaj--' + m.tur + '" role="status">' + kac(m.metin) + '</p>' : '') + '</div>'
      + '</section>';
  }

  /* Söz 1–4. olcumMetni boşsa yalnız beyanlar yazılır. Aynı gün için
     ikinci çağrı birincisi bitmeden yazmaz (çift Enter iki kez eklerdi). */
  async function kapat(gun, o){
    if(!ayar) return { ok:false, neden:'Günü kapat kurulmadı.' };
    if(suruyor[gun]) return { ok:false, neden:'Kayıt sürüyor.' };
    suruyor[gun] = true;
    try{ return await kapatIc(gun, o || {}); }finally{ delete suruyor[gun]; }
  }
  /* Geri almaları sondan başa, her biri ayrı: biri bozulsa da ötekiler koşar. */
  async function hepsiniGeriAl(geri){
    let bozuk = 0;
    for(const g of geri.slice().reverse()){ try{ await g(); }catch(e){ bozuk++; } }
    return bozuk;
  }
  async function kapatIc(gun, o){
    const metin = String(o.olcumMetni || '').trim();
    const geri = [];
    const yazilan = [];
    let geriAlinamaz = false;
    const G = window.LIFEOS.GIRIS;
    let p = null;
    if(metin){
      if(!G || !G.kuruluMu || !G.kuruluMu()) return sonuc(gun, { ok:false, neden:'Ölçüm satırı bu modülde okunamıyor; hiçbir şey yazılmadı.' });
      p = G.onizle(metin);
      if(!p) return sonuc(gun, { ok:false, neden:'Ölçüm satırını anlayamadım; hiçbir şey yazılmadı.' });
      if(p.kalan && p.kalan.length){
        return sonuc(gun, { ok:false, neden:'Anlaşılmadı: «' + p.kalan.join('», «') + '». Hiçbir şey yazılmadı; düzeltip yeniden kaydet.' });
      }
    }
    const beyanlar = yazilacaklar(gun);
    if(!p && !beyanlar.length) return sonuc(gun, { ok:false, neden:'Kaydedilecek bir şey yok.' });
    try{
      if(p){
        const r = await p.kaydet();
        /* Modül yazamadığını { ok:false } ile söylerse ölçüm yazılmamıştır:
           beyanlar da yazılmaz (hepsi ya da hiçbiri). */
        if(r && typeof r === 'object' && r.ok === false) throw new Error(r.neden || r.metin || 'ölçüm satırı yazılamadı');
        const g = geriAlOf(r); if(g) geri.push(g); else geriAlinamaz = true;
        yazilan.push(p.metin || metinOf(r));
      }
      for(const s of beyanlar){
        const r = await s.yaz(gun);
        /* Satır yazmamayı seçebilir ({ atlandi:true }): ölçüm satırı aynı işi
           az önce ölçülmüş olarak yazdıysa tahmini tekrar yazılmaz, sayılmaz. */
        if(r && typeof r === 'object' && r.atlandi) continue;
        const g = geriAlOf(r); if(g) geri.push(g); else geriAlinamaz = true;
        yazilan.push(s.ad);
      }
    }catch(e){
      /* Söz 3: yarıda kalan yazım geri alınır. */
      const bozuk = await hepsiniGeriAl(geri);
      const durum = !geri.length && !geriAlinamaz ? 'Hiçbir şey yazılmadı.'
        : bozuk || geriAlinamaz ? 'Yazılanın bir kısmı geri alınamadı.' : 'Yazılan geri alındı.';
      return sonuc(gun, { ok:false, neden:'Kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata') + '. ' + durum });
    }
    const geriAl = geri.length ? async () => {
      const bozuk = await hepsiniGeriAl(geri);
      sonMesaj[gun] = bozuk ? { tur:'uyari', metin:'Bir kısmı geri alınamadı.' } : { tur:'ok', metin:'Geri alındı.' };
      if(ayar && typeof ayar.yenile === 'function') ayar.yenile();
    } : null;
    const yazi = 'Gün kapatıldı: ' + yazilan.length + ' kayıt.' + (geriAlinamaz ? ' Bir kısmı geri alınamaz.' : '');
    return sonuc(gun, { ok:true, metin:yazi, yazilan, geriAl });
  }
  function sonuc(gun, r){
    sonMesaj[gun] = r.ok ? { tur:'ok', metin:r.metin } : { tur:'uyari', metin:r.neden };
    if(r.ok){
      delete atla[gun];
      if(ayar && typeof ayar.bildir === 'function'){ try{ ayar.bildir(r.metin, r.geriAl); }catch(e){ /* bildirim yok */ } }
      if(ayar && typeof ayar.yenile === 'function'){ try{ ayar.yenile(); }catch(e){ /* çizim yok */ } }
    }else tazele(gun);
    return r;
  }
  function tazele(gun){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-gunukapat]').forEach(k => {
      if(k.getAttribute('data-gun') !== gun) return;
      const s = k.querySelector('[data-gk-sonuc]');
      const m = sonMesaj[gun];
      if(s) s.innerHTML = m ? '<p class="gk__mesaj gk__mesaj--' + m.tur + '" role="status">' + kac(m.metin) + '</p>' : '';
      const b = k.querySelector('.gk__kapat .btn__label');
      const n = yazilacaklar(gun).length;
      if(b) b.textContent = n ? 'Hepsi doğru · kaydet (' + n + ')' : 'Kaydet';
    });
  }

  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('change', e => {
      const c = e.target && e.target.closest ? e.target.closest('[data-gk-sec]') : null;
      if(!c) return;
      const k = c.closest('[data-gunukapat]');
      const gun = k ? k.getAttribute('data-gun') : '';
      const id = c.getAttribute('data-gk-sec');
      atla[gun] = atla[gun] || {};
      if(c.checked) delete atla[gun][id]; else atla[gun][id] = true;
      const li = c.closest('.gk__satir');
      if(li) li.classList.toggle('is-atla', !c.checked);
      tazele(gun);
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-gk-form]') : null;
      if(!f) return;
      e.preventDefault();
      const k = f.closest('[data-gunukapat]');
      const g = f.querySelector('.gk__girdi');
      const b = f.querySelector('.gk__kapat');
      if(b) b.disabled = true;
      kapat(k ? k.getAttribute('data-gun') : '', { olcumMetni:g ? g.value : '' })
        .finally(() => { if(b) b.disabled = false; });
    });
  }

  function kur(o){
    ayar = Object.assign({ modul:'', olcumOrnek:'' }, o || {});
    bagla();
  }
  function _sifirla(){ ayar = null; Object.keys(suruyor).forEach(k => delete suruyor[k]); Object.keys(atla).forEach(k => delete atla[k]); Object.keys(sonMesaj).forEach(k => delete sonMesaj[k]); }

  return { kur, cizim, kapat, kalip, yazilacaklar, satirlar, KAYNAK, kuruluMu:() => !!ayar, _sifirla };
})();
