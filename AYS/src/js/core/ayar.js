/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ayar.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* AYAR — T5 (ekip/EKIP-PLANI.md §4.2): ayar ekranlarının ortak davranışı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ayar.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır. Biçimi `ayar.css`.

     21  kaydedilmemiş değişiklik  «Kaydet» düğmesi olan kutudaki alan
                                   değişince yanında nokta; altta «N değişiklik
                                   kaydedilmedi · Vazgeç · Kaydet» şeridi.
                                   Yeniden çizimde ve ekrandan çıkıp dönünce
                                   yazılan değer KAYBOLMAZ (bellekte bekler).
     182 varsayılana dön           `data-varsayilan` taşıyan alan varsayılandan
                                   farklıysa noktalı; altında varsayılan değer
                                   ve tek düğme. Anında uygulanan alan
                                   (`data-change`) dönünce kendi olayını atar.
     183 ayar arama                ayar ekranlarının alan adlarından dizin;
                                   sonuç tam yoluyla: «AYS › Ayarlar › Genel ›
                                   Tema».

   Neyin «kaydedilmemiş» olduğunu tarayıcının kendisi bilir: bir alanın
   çizildiği andaki değeri `defaultValue` / `defaultChecked` /
   `defaultSelected`'dır. Durum ayrıca tutulmaz; ekran kodu bilmek zorunda
   değildir. Anında uygulanan alan (`data-change`) kaydedilmemiş sayılmaz. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.AYAR = (function(){
  const KAYDET = 'button[data-act^="save-"]';
  const KAPSAM = '.card, .kutu, .lrow, form, .sheet';
  const ALAN = 'input, select, textarea';

  /* rota -> { alanId: değer } — ekrandan çıkınca yazılan kaybolmasın. */
  const bekleyen = {};
  let rota = null;
  let etkin = false;
  let serit = null;
  /* «Kaydet»e basıldıysa bir sonraki çizimde bellekteki değer geri
     konmaz: kaydeden ekran değeri biçimlendirmiş olabilir («1,50» →
     «1,5»); eskisini geri koymak kaydedilmiş bir alanı «kaydedilmedi»
     gösterirdi. Doğrulama reddederse ekranın eski davranışı geçerlidir. */
  let kaydetBasildi = false;

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* ------------------------------------------------------------ 21 */

  function izlenir(e){
    if(!e || !e.id || e.disabled) return false;
    if(e.hasAttribute('data-change')) return false;            // anında uygulanır
    if(/^(file|hidden|button|submit|reset|search)$/i.test(e.type || '')) return false;
    if(e.closest('[data-ayar-disi]')) return false;
    return true;
  }
  function kapsamlar(kok){
    const k = new Set();
    if(!kok) return [];
    kok.querySelectorAll(KAYDET).forEach(b => {
      const kap = b.closest(KAPSAM);
      if(kap && kap.querySelector(ALAN)) k.add(kap);
    });
    return Array.from(k);
  }
  function alanlar(kok){
    const a = [];
    kapsamlar(kok).forEach(k => k.querySelectorAll(ALAN).forEach(e => { if(izlenir(e) && a.indexOf(e) < 0) a.push(e); }));
    return a;
  }
  function deger(e){
    if(e.type === 'checkbox' || e.type === 'radio') return e.checked ? '1' : '0';
    return String(e.value);
  }
  function ilkDeger(e){
    if(e.type === 'checkbox' || e.type === 'radio') return e.defaultChecked ? '1' : '0';
    if(e.tagName === 'SELECT'){
      const o = Array.from(e.options).find(x => x.defaultSelected) || e.options[0];
      return o ? String(o.value) : '';
    }
    return String(e.defaultValue);
  }
  function ata(e, v){
    if(e.type === 'checkbox' || e.type === 'radio') e.checked = v === '1';
    else e.value = v;
  }
  function degistiMi(e){ return deger(e) !== ilkDeger(e); }
  function alanKabi(e){ return e.closest('.field') || e.closest('label') || e.parentElement; }

  function degisenler(kok){ return alanlar(kok).filter(degistiMi); }

  /* Değişeni işaretler, şeridi günceller, belleği tazeler. Kaç değişik alan
     olduğunu döndürür. */
  function tara(kok){
    kok = kok || document;
    if(!etkin){
      kok.querySelectorAll('.is-degisti').forEach(e => e.classList.remove('is-degisti'));
      seritCiz([]);
      return 0;
    }
    const hepsi = alanlar(kok);
    const d = hepsi.filter(degistiMi);
    hepsi.forEach(e => { const k = alanKabi(e); if(k) k.classList.toggle('is-degisti', d.indexOf(e) >= 0); });
    if(rota != null){
      const m = {};
      d.forEach(e => { m[e.id] = deger(e); });
      if(d.length) bekleyen[rota] = m; else delete bekleyen[rota];
    }
    seritCiz(d);
    return d.length;
  }

  function seritCiz(d){
    if(!d.length){ if(serit){ serit.remove(); serit = null; } return; }
    if(!serit || !serit.isConnected){
      serit = document.createElement('div');
      serit.className = 'ayar-serit';
      serit.setAttribute('role', 'status');
      document.body.appendChild(serit);
    }
    serit.innerHTML = '<span class="ayar-serit__yazi">' + d.length + ' değişiklik kaydedilmedi</span>'
      + '<button type="button" class="btn btn--sm" data-ayar="vazgec">Vazgeç</button>'
      + '<button type="button" class="btn btn--sm btn--primary" data-ayar="kaydet">Kaydet</button>';
  }

  function vazgec(kok){
    kok = kok || document;
    degisenler(kok).forEach(e => ata(e, ilkDeger(e)));
    if(rota != null) delete bekleyen[rota];
    return tara(kok);
  }
  /* İlk değişen alanın kutusundaki «Kaydet»e basar; kaydetmek ekranın işi. */
  function kaydet(kok){
    kok = kok || document;
    const d = degisenler(kok);
    if(!d.length) return false;
    const kap = d[0].closest(KAPSAM);
    const b = kap && kap.querySelector(KAYDET);
    if(!b) return false;
    b.click();
    return true;
  }

  /* ------------------------------------------------------------ 182 */

  function varsayilanlar(kok){
    if(!kok) return 0;
    /* Yalnız BURADA eklenen not silinir; bileşenin kendi çizdiği not
       (tema seçici) ekranındır. */
    kok.querySelectorAll('.ayar-varsayilan[data-ayar-ek]').forEach(e => e.remove());
    let n = 0;
    kok.querySelectorAll('[data-varsayilan]').forEach(e => {
      if(!/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) return;
      const v = e.getAttribute('data-varsayilan');
      const k = alanKabi(e);
      const farkli = ilkDeger(e) !== v;
      if(k) k.classList.toggle('is-varsayilandan', farkli);
      if(!farkli || !k) return;
      const ad = e.getAttribute('data-varsayilan-ad') || v;
      const p = document.createElement('p');
      p.className = 'ayar-varsayilan';
      p.setAttribute('data-ayar-ek', '');
      p.innerHTML = 'Varsayılan: ' + kac(ad)
        + ' <button type="button" class="linkbtn" data-ayar="varsayilan" data-alan="' + kac(e.id) + '">Varsayılana dön</button>';
      k.insertAdjacentElement('afterend', p);
      n++;
    });
    return n;
  }
  function varsayilanaDon(id){
    const e = id ? document.getElementById(id) : null;
    if(!e || !e.hasAttribute('data-varsayilan')) return false;
    ata(e, e.getAttribute('data-varsayilan'));
    e.dispatchEvent(new Event('input', { bubbles:true }));
    e.dispatchEvent(new Event('change', { bubbles:true }));
    return true;
  }

  /* ------------------------------------------------------------ 183 */

  function duz(s){
    return String(s || '').toLocaleLowerCase('tr-TR')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').trim();
  }
  /* ekranlar: [{ route, ad, html }] — ad «Genel», «Profil»… Kutu/Kart
     başlığı bölüm, alan etiketi ayar adıdır. */
  /* Başlığın düz adı: ipucu düğmesi («i») ve yardımcı yazı ada karışmaz. */
  function yalinAd(el){
    if(!el) return '';
    const k = el.cloneNode(true);
    k.querySelectorAll('button, .hint, .hint-text, [aria-hidden="true"], small').forEach(x => x.remove());
    return k.textContent.replace(/\s+/g, ' ').trim();
  }
  function dizin(modul, ekranlar){
    const d = [];
    (ekranlar || []).forEach(x => {
      const kap = document.createElement('div');
      kap.innerHTML = String(x.html || '');
      kap.querySelectorAll('label.field, .field').forEach(f => {
        const ad = yalinAd(f.querySelector(':scope > span'));
        if(!ad) return;
        const alan = f.querySelector(ALAN);
        const kutu = f.closest('.kutu, .card, .lrow');
        const bolum = kutu ? yalinAd(kutu.querySelector('.kutu__ad, .card__title, .lrow__label, h2, h3')) : '';
        d.push({ modul, route:x.route, ekran:x.ad, bolum, ad, alan:alan ? alan.id : '',
          yol:[modul, 'Ayarlar', x.ad].concat(bolum && bolum !== x.ad ? [bolum] : []).concat([ad]).join(' › ') });
      });
    });
    return d;
  }
  function ara(d, soru){
    const q = duz(soru);
    if(q.length < 2) return [];
    return (d || []).filter(x => duz(x.ad).indexOf(q) >= 0 || duz(x.bolum).indexOf(q) >= 0);
  }
  function aramaSonucu(sonuc){
    if(!sonuc.length) return '<p class="small muted">Bu adla bir ayar yok.</p>';
    const gruplar = {};
    sonuc.forEach(x => { (gruplar[x.modul] = gruplar[x.modul] || []).push(x); });
    return Object.keys(gruplar).map(m => '<div class="ayar-ara__grup"><p class="ayar-ara__modul">' + kac(m) + '</p>'
      + gruplar[m].map(x => '<button type="button" class="ayar-ara__sonuc" data-act="ayar-git"'
        + ' data-route="' + kac(x.route) + '" data-alan="' + kac(x.alan) + '">'
        + '<b>' + kac(x.ad) + '</b><span>' + kac(x.yol) + '</span></button>').join('')
      + '</div>').join('');
  }
  /* Ayarlar çekmecesinin sayfa başında durur. `type=search` olduğu için
     kaydedilmemiş değişiklik sayılmaz (izlenir). */
  function aramaKutusu(){
    return '<div class="ayar-ara" role="search">'
      + '<input type="search" class="input ayar-ara__kutu" id="ayar-ara" data-ayar-ara'
      + ' placeholder="Ayar ara" aria-label="Ayar ara" autocomplete="off" aria-controls="ayar-ara-sonuc">'
      + '<div class="ayar-ara__sonuclar" id="ayar-ara-sonuc" aria-live="polite"></div></div>';
  }
  let dizinFn = null, dizinOnbellek = null;
  async function dizinAl(){
    if(dizinOnbellek) return dizinOnbellek;
    try{ dizinOnbellek = dizinFn ? await dizinFn() : []; }catch(e){ dizinOnbellek = []; }
    return dizinOnbellek;
  }
  async function aramaYaz(kutu){
    const yer = document.getElementById('ayar-ara-sonuc');
    if(!yer) return;
    const q = kutu.value;
    if(duz(q).length < 2){ yer.innerHTML = ''; return; }
    const d = await dizinAl();
    if(kutu.value !== q) return;               // bu arada yazılmaya devam edildi
    yer.innerHTML = aramaSonucu(ara(d, q));
  }

  /* Sonuca basınca: ekrana git, alana kay ve odakla. */
  function alanaGit(id){
    const e = id ? document.getElementById(id) : null;
    if(!e) return false;
    let az = true;
    try{ az = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(x){}
    e.scrollIntoView({ block:'center', behavior:az ? 'auto' : 'smooth' });
    try{ e.focus({ preventScroll:true }); }catch(x){}
    const k = alanKabi(e);
    if(k){ k.classList.add('is-bulundu'); setTimeout(() => k.classList.remove('is-bulundu'), 1600); }
    return true;
  }

  /* ------------------------------------------------------------ bağlama */

  function once(kok){ if(kok && rota != null && !kaydetBasildi) tara(kok); }

  /* o: { rota, etkin } — etkin: ekran Ayarlar çekmecesinde mi. */
  function sonra(kok, o){
    o = o || {};
    rota = o.rota != null ? o.rota : rota;
    etkin = !!o.etkin;
    if(kaydetBasildi){ kaydetBasildi = false; delete bekleyen[rota]; }
    if(!kok) return 0;
    /* Bellekte bekleyen değeri geri koy: yeniden çizim yazılanı silmez. */
    const m = bekleyen[rota];
    if(m && etkin){
      Object.keys(m).forEach(id => {
        const e = document.getElementById(id);
        if(e && kok.contains(e) && izlenir(e)) ata(e, m[id]);
      });
    }
    if(etkin) varsayilanlar(kok);
    return tara(kok);
  }

  let kuruldu = false;
  /* o.dizin: async () => dizin(...) — ayar ekranlarından arama dizini. */
  function kur(o){
    o = o || {};
    if(o.dizin){ dizinFn = o.dizin; dizinOnbellek = null; }
    if(kuruldu) return;
    kuruldu = true;
    document.addEventListener('input', e => {
      if(e.target && e.target.matches && e.target.matches('[data-ayar-ara]')) aramaYaz(e.target);
    });
    document.addEventListener('keydown', e => {
      if(e.key !== 'Escape' || !e.target || !e.target.matches || !e.target.matches('[data-ayar-ara]')) return;
      e.target.value = '';
      const yer = document.getElementById('ayar-ara-sonuc');
      if(yer) yer.innerHTML = '';
    });
    const degisti = e => { if(etkin && e.target && e.target.matches && e.target.matches(ALAN)) tara(document.getElementById('app') || document); };
    document.addEventListener('input', degisti);
    document.addEventListener('change', degisti);
    document.addEventListener('click', e => {
      if(e.target.closest && e.target.closest(KAYDET)){ kaydetBasildi = true; if(rota != null) delete bekleyen[rota]; }
    }, true);
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-ayar]');
      if(!b) return;
      const kok = document.getElementById('app') || document;
      const ne = b.getAttribute('data-ayar');
      if(ne === 'vazgec') vazgec(kok);
      else if(ne === 'kaydet') kaydet(kok);
      else if(ne === 'varsayilan') varsayilanaDon(b.getAttribute('data-alan'));
    });
  }

  return { once, sonra, tara, vazgec, kaydet, degisenler, varsayilanlar, varsayilanaDon,
    dizin, ara, aramaSonucu, aramaKutusu, alanaGit, kur, _bekleyen:bekleyen };
})();
