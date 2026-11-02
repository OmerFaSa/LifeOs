/* KING · ses ve görüntü: fotoğraf, ekran, kamera, göz, ses, mikrofon, araya girme, uyanma.
   Parça 2/8; yükleme sırası: king.js, king-ses.js, king-kayit.js, king-gorunum.js, king-kart.js, king-arac.js, king-devrim.js, king-yol.js.
   Dosyalar arası ortak adlar ve ortak durum window.LIFEOS.KING_IC'tedir (KI.ad). */

(function(){
  'use strict';

  const KI = window.LIFEOS.KING_IC;

  /* ---------- söz 11: fotoğraf ---------- */
  function fotoIsleri(){ return (KI.ayar && Array.isArray(KI.ayar.foto)) ? KI.ayar.foto.filter(x => x && x.ad && typeof x.is === 'function') : []; }
  function fotoAl(file){
    if(!KI.acik || !file) return false;
    if(!/^image\//.test(file.type || '')){ KI.soyle('Bu bir fotoğraf değil; yalnız görsel alabilirim.'); return false; }
    if(file.size > KI.FOTO_EN_BUYUK){ KI.soyle('Fotoğraf çok büyük (en çok 15 MB). Daha küçük bir kırpma dener misin?'); return false; }
    const fotoUrl = KI.ortam.nesneUrl(file);
    KI.akis.push({ kim:'sen', foto:fotoUrl, metin:'(fotoğraf)' });
    KI.gorselSakla(fotoUrl);
    const l = fotoIsleri();
    /* Söz 37: iş önceden seçildiyse («Tüm işler») doğrudan o işe. */
    if(KI.fotoHedef != null && l[KI.fotoHedef]){ fotoIsle(KI.fotoHedef, file); return true; }
    const gorur = gorebilir();
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null;
    if(!l.length && !gorur){
      KI.bekleyenFoto = null; KI.cipler = null;
      KI.soyle('Fotoğrafı aldım ama ' + (KI.MODUL_AD[KI.ayar.modul] || 'bu modül') + '’de fotoğrafla yapılan bir iş yok. AYS’de soru çözdürebilir, SPİ’de öğün okutabilirim.');
      return true;
    }
    KI.bekleyenFoto = file;
    KI.cipler = l.map((x, i) => ({ ad:x.ad, is:'foto:' + i }))
      .concat(gorur ? [{ ad:'Ne gördüğünü söyle', is:'foto-yorum' }] : [])
      .concat([{ ad:'Vazgeç', is:'vazgec' }]);
    KI.soyle('Fotoğrafı aldım; bu cihazda kalıyor. Ne yapalım?');
    return true;
  }
  /* G: PDF — metnini bilgisayardaki Merkez çıkarır (HKM/core/belge.py, model
     yok; /api/king/belge), King özetler. Belge saklanmaz; Merkez yoksa söylenir. */
  const PDF_EN_BUYUK = 8 * 1024 * 1024, PDF_METIN = 6000;
  async function pdfAl(file){
    if(!KI.acik || !file) return false;
    if(!/pdf$/i.test(file.type || '') && !/\.pdf$/i.test(file.name || '')){ KI.soyle('Bu bir PDF değil; PDF dosyası seç.'); return false; }
    const ad = String(file.name || 'belge.pdf').slice(0, 120);
    KI.akis.push({ kim:'sen', metin:'(PDF) ' + ad });
    if(file.size > PDF_EN_BUYUK){ KI.soyle('PDF çok büyük (en çok 8 MB).'); return false; }
    const k = KI.baglanti();
    if(!k){ KI.soyle('PDF’in metnini bilgisayardaki Merkez çıkarır; Merkez bağlı değil. Bağlanınca yeniden dene.'); return false; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek); KI.ciz(false);
    let g = null, durum = 0;
    try{
      const veri = await KI.ortam.dosyaB64(file);
      const res = await KI.ortam.fetch(k.url + '/api/king/belge', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify({ ad, veri }) });
      durum = res.status;
      try{ g = await res.json(); }catch(e){ g = null; }
    }catch(e){ g = null; }
    if(!g || !g.ok){
      KI.akis = KI.akis.filter(m => m !== bek);
      KI.soyle(durum === 404 ? 'Merkez’in bu sürümü PDF okumuyor; güncelleyince okurum.' : 'PDF okunamadı: ' + String((g && g.note) || 'Merkez cevap vermedi').replace(/[.]$/, '') + '.');
      return false;
    }
    const neden = ['Metni bilgisayardaki Merkez çıkardı (model yok); özeti King yazdı.' + (g.kesildi || String(g.metin || '').length > PDF_METIN ? ' Belge uzundu; baş kısmı okundu.' : '')];
    const r = await KI.merkezeSor('Kullanıcı bir PDF verdi: «' + ad + '»' + (g.sayfa ? ' (' + g.sayfa + ' sayfa)' : '') + '. Metni aşağıda. Türkçe, kısa özetle '
      + '(en çok beş madde) ve LifeOS’ta işine yarayacak sonraki adımı tek cümleyle öner; metinde olmayan sayıyı yazma.\n\n' + String(g.metin || '').slice(0, PDF_METIN));
    KI.akis = KI.akis.filter(m => m !== bek);
    KI.kaynakMetin = { ad, metin:String(g.metin || '') };
    KI.cipler = [{ ad:'Derse çevir', is:'derse-cevir' }];
    KI.soyle(r.ok ? r.text : 'PDF’in metnini okudum (' + (Number(g.kelime) || 0) + ' kelime) ama Merkez özetleyemedi.', null, null, null, { neden });
    return true;
  }
  /* Söz 37: işe görüntü okuma yardımı gider (Merkez'in görsel modeli); iş
     metin döndürürse söylenir (sayfa açtı), { metin, satirlar, arac }
     döndürürse aracın önizlemesi onay kartıyla gösterilir. */
  async function fotoIsle(i, dosya){
    const x = fotoIsleri()[i], f = dosya || KI.bekleyenFoto;
    KI.bekleyenFoto = null; KI.cipler = null; KI.fotoHedef = null;
    if(!x || !f) return;
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek); KI.ciz(false);
    let r = null;
    try{ r = await x.is(f, { gorsel:(soru, yetenek) => gorselOku(f, soru, yetenek), kamera:!!dosya }); }
    catch(e){ KI.akis = KI.akis.filter(m => m !== bek); KI.soyle('Fotoğraf işlenemedi: ' + ((e && e.message) || 'bilinmeyen hata')); return; }
    KI.akis = KI.akis.filter(m => m !== bek);
    if(!r || typeof r !== 'object'){ KI.kucult(); KI.soyle((r && String(r)) || 'Tamam, fotoğrafı yerine koydum.'); return; }
    const on = String(r.metin || '').trim();
    if(r.arac && KI.ARAC()){
      const o = await KI.ARAC().onizle(r.arac.ad, r.arac.param, { metin:'' });
      if(o.ok){ KI.aracKart(o, on, r.satirlar); return; }
      KI.soyle((on ? on + ' ' : '') + String(o.hata || 'Önizlenemedi').replace(/^./, c => c.toLocaleUpperCase('tr-TR')).replace(/[.]?$/, '.'), r.satirlar || null);
      return;
    }
    KI.soyle(on || 'Tamam.', r.satirlar || null);
  }
  /* Görüntü okuma (sessiz): Merkez'in görsel kademesi, yoksa modülün zinciri. */
  async function gorselOku(f, soru, yetenek){
    let resim;
    try{ resim = await KI.ortam.dosyaKare(f); }catch(e){ return { ok:false, note:'görüntü okunamadı' }; }
    const k = KI.baglanti(), z = gorselZincir();
    if(k){ const r = await merkezGorsel(k, soru, resim, yetenek || 'gorsel'); if(r.ok || !z.length) return r; }
    if(!z.length) return { ok:false, note:'Merkez bağlı değil' };
    try{
      const r = await modelKatmani().complete(z, { system:KI.GORSEL_SISTEM, temperature:0.1, maxTokens:900, messages:[{ role:'user', text:String(soru), images:[resim] }] });
      const t = String((r && r.text) || '').trim();
      return t ? { ok:true, text:t } : { ok:false, note:'model boş döndü' };
    }catch(e){ return { ok:false, note:'model yanıt vermedi' }; }
  }
  /* Söz 37: kamera kipinde fotoğraf işi tek düğmeyle — o anki kare dosya olur. */
  function kareDosya(k, ad){
    const b = atob(String(k.data || ''));
    const u = new Uint8Array(b.length);
    for(let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return new File([u], (ad || 'kare') + '.jpg', { type:k.mime || 'image/jpeg' });
  }
  async function kameraIs(i){
    const x = fotoIsleri()[i];
    if(!x || !KI.kameraMi()) return null;
    let kare;
    try{ kare = KI.paylasim.kare(); }catch(e){ KI.soyle('Kameranın karesi alınamadı: ' + ((e && e.message) || 'bilinmeyen hata')); return null; }
    KI.akis.push({ kim:'sen', metin:'(kameradan) ' + x.ad });
    return fotoIsle(i, kareDosya(kare, x.id));
  }
  /* «Tüm işler»den foto işi seçildi: kamerayla ya da fotoğrafla. */
  function fotoIsBaslat(x){
    const i = fotoIsleri().findIndex(f => f.id === x.id);
    if(i < 0){ KI.soyle(x.ad + ' şu an bu sayfada yapılamıyor.'); return; }
    KI.fotoHedef = i; KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null;
    if(KI.kameraMi()){ KI.cipler = [{ ad:x.ad, is:'kam-is:' + i }, { ad:'Vazgeç', is:'vazgec' }]; KI.soyle(x.ad + ': kamerayı tut, hazır olunca düğmeye dokun.'); return; }
    KI.cipler = (KI.ortam.kameraDestek() ? [{ ad:'Kamerayla', is:'is-kamera' }] : []).concat([{ ad:'Fotoğraf seç', is:'foto-sec' }, { ad:'Vazgeç', is:'vazgec' }]);
    KI.soyle(x.ad + (x.ne ? ' (' + x.ne + ')' : '') + '. Kamerayla mı, fotoğrafla mı?');
  }
  async function isKamera(){
    const i = KI.fotoHedef, x = fotoIsleri()[i];
    KI.cipler = null;
    if(!x) return;
    if(!KI.kameraMi()) await kameraAc();
    if(!KI.kameraMi()) return;
    KI.fotoHedef = i;
    KI.cipler = [{ ad:x.ad, is:'kam-is:' + i }, { ad:'Vazgeç', is:'vazgec' }];
    KI.soyle('Kamera açık. ' + x.ad + ' için hazır olunca düğmeye dokun.');
  }
  /* Söz 37: «Tüm işler»den bir iş. Başka modülün işi o modülde açılır. */
  function isSec(n){
    const A = KI.ARAC(), x = A && A.ISLER ? A.ISLER[n] : null;
    if(!x || !KI.ayar) return false;
    if(x.modul !== 'king' && x.modul !== KI.ayar.modul){
      KI.soyle(x.ad + ' ' + KI.MODUL_AD[x.modul] + '’nin işi; oraya geçiyorum.');
      KI.ortam.zamanla(() => KI.git({ modul:x.modul, route:x.route || 'today', ek:{ is:n } }), 650);
      return true;
    }
    if(x.tur === 'foto'){ fotoIsBaslat(x); return true; }
    KI.doldurulacak = String(x.ornek || '');
    KI.ciz(true);
    return true;
  }

  /* ---------- söz 12: ekranı göster ---------- */
  function ekranOku(){
    if(typeof document === 'undefined') return { ad:'', basliklar:[], metin:'' };
    const kok = document.getElementById('app') || document.querySelector('main') || document.body;
    const gor = el => { try{ const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null; }catch(e){ return false; } };
    const basliklar = [];
    kok.querySelectorAll('h1, h2, h3, .kutu__ad, .card__title').forEach(el => {
      if(el.closest('[data-king]') || !gor(el)) return;
      const t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if(t && t.length <= 60 && basliklar.indexOf(t) < 0) basliklar.push(t);
    });
    const metin = String(kok.innerText || '').replace(/\s+/g, ' ').trim().slice(0, KI.EKRAN_EN_COK);
    return { ad:KI.ekranAdi(), basliklar:basliklar.slice(0, 12), metin };
  }
  async function ekranGoster(){
    const e = ekranOku();
    KI.akis.push({ kim:'sen', metin:'(ekranı gösterdi)' });
    KI.cipler = null;
    if(KI.baglanti()){
      const bek = { kim:'king', bekliyor:true, metin:'' };
      KI.akis.push(bek); KI.ciz(false);
      const r = await KI.merkezeSor('Kullanıcı bana bulunduğu ekranı gösteriyor (' + KI.MODUL_AD[KI.ayar.modul] + (e.ad ? ' · ' + e.ad : '')
        + '). Ekrandaki yazılar: «' + e.metin + '». Kısaca ne gördüğünü ve sıradaki en mantıklı adımı söyle; sayı uydurma, ekrandakini kullan.');
      KI.akis = KI.akis.filter(m => m !== bek);
      if(r.ok){ KI.soyle(r.text); return r; }
    }
    KI.soyle((e.ad ? e.ad + ' ekranındasın.' : 'Bu ekranda:') + (e.basliklar.length ? ' Gördüklerim:' : ' Okuyabildiğim bir başlık yok.'),
      e.basliklar.slice(0, 8));
    return e;
  }

  /* ---------- söz 16–17: ekranı paylaş, görüntüyü yorumla ---------- */
  function modelKatmani(){ try{ return KI.ayar && KI.ayar.model ? KI.ayar.model() : null; }catch(e){ return null; } }
  function gorselZincir(){
    const M = modelKatmani();
    try{ return M && M.visionChain ? M.visionChain(null) : []; }catch(e){ return []; }
  }
  /* GÖRÜNTÜ MERKEZ'DE (2026-10-21, kullanıcı: «hâlâ Gemini istiyor»): model
     ayarları yalnız HKM'de durur; modülün kendi zinciri boştur. Merkez'e
     bağlıyken fotoğraf ve ekran karesi HKM'nin modül görsel kademesine
     (<modül>.gorsel, ör. yerel qwen3-vl) gider: /api/ofis/cevap, yetenek
     «gorsel». Bağlı değilse modülde eski bir zincir varsa o denenir. */
  function gorebilir(){ return !!KI.baglanti() || gorselZincir().length > 0; }
  const GORSEL_YOK = 'Görüntüyü yorumlamak için Merkez’e (HKM) bağlı olmam gerekiyor. Merkez açıkken fotoğrafını ve '
    + 'ekranını bilgisayardaki görsel modelle okurum; görüntü internete çıkmaz.';
  const GORSEL_ZAMAN = 120000;   // görsel model ilk istekte belleğe yüklenir
  async function merkezGorsel(k, soru, resim, yetenek, tekrar){
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), GORSEL_ZAMAN) : null;
    try{
      const f = KI.ortam.fetch;
      const res = await f(k.url + '/api/ofis/cevap', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ modul:KI.ayar.modul, yetenek:yetenek || 'gorsel',
          sistem:KI.GORSEL_SISTEM + (KI.kameraMi() ? KI.KAMERA_NOT : '') + (KI.kisiOzeti() ? '\n\n' + KI.kisiOzeti() : ''),
          mesajlar:[{ role:'user', text:String(soru || 'Bu görüntüde ne var?') }], gorseller:[resim] }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      /* Eski jeton (401, sahada 2026-10-21): modül Merkez'e yeniden bağlanır, bir kez daha denenir. */
      if(res.status === 401 && !tekrar){
        const b = KI.ayar.hkm ? KI.ayar.hkm() : null;
        if(b && typeof b.save === 'function' && typeof b.kendiBaglan === 'function'){
          try{ await b.save({ lastStatus:401 }); const e = await b.kendiBaglan(); const k2 = KI.baglanti();
            if(e && e.ok && k2) return merkezGorsel(k2, soru, resim, yetenek, true); }catch(e){ /* bağlanamadı */ }
        }
      }
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && g.ok && String(g.text || '').trim()) return { ok:true, text:String(g.text).trim() };
      return { ok:false, note:(g && g.note) || 'Merkez görüntüye cevap vermedi.' };
    }catch(e){
      return { ok:false, note:e && e.name === 'AbortError' ? 'Görsel model zamanında cevap vermedi.' : 'Merkez’e ulaşılamadı.' };
    }finally{
      if(t) clearTimeout(t);
    }
  }
  async function gorselCevap(soru, resim, yetenek){
    const zincir = gorselZincir();
    const k = KI.baglanti();
    if(!k && !zincir.length){ KI.soyle(GORSEL_YOK); return null; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek); KI.ciz(false);
    if(k){
      const r = await merkezGorsel(k, soru, resim, yetenek);
      if(r.ok || !zincir.length){
        KI.akis = KI.akis.filter(m => m !== bek);
        KI.soyle(r.ok ? r.text : 'Görüntüyü yorumlayamadım: ' + r.note);
        return r.ok ? r : null;
      }
    }
    try{
      const M = modelKatmani();
      const r = await M.complete(zincir, { system:KI.GORSEL_SISTEM + (KI.kameraMi() ? KI.KAMERA_NOT : '') + (KI.kisiOzeti() ? '\n\n' + KI.kisiOzeti() : ''), temperature:0.3, maxTokens:700,
        messages:[{ role:'user', text:String(soru || 'Bu görüntüde ne var?'), images:[resim] }] });
      KI.akis = KI.akis.filter(m => m !== bek);
      KI.soyle(String((r && r.text) || '').trim() || 'Görüntüden bir şey okuyamadım.');
      return r;
    }catch(e){
      KI.akis = KI.akis.filter(m => m !== bek);
      const M = modelKatmani();
      KI.soyle('Görüntüyü yorumlayamadım: ' + ((M && M.errorText && e && e.code) ? M.errorText(e.code) : ((e && e.message) || 'model yanıt vermedi')));
      return null;
    }
  }
  async function paylasimBaslat(){
    if(KI.paylasim && !KI.kameraMi()){ paylasimBitir(); return false; }
    if(KI.paylasim) paylasimKapat();                // ekran ile kamera aynı anda açık olmaz
    if(!KI.ortam.ekranDestek()){
      KI.soyle('Bu cihazda tarayıcı ekran paylaşamıyor (telefonda tarayıcılar buna izin vermiyor). Ekran görüntüsü alıp '
        + 'fotoğraf olarak gönderirsen ne gördüğümü söylerim.');
      return false;
    }
    if(!gorebilir()){ KI.soyle(GORSEL_YOK); return false; }
    const no = ++KI.paylasimNo;
    try{
      const p = await KI.ortam.ekranBaslat(() => { if(KI.paylasim && KI.paylasim === p){ paylasimKapat(); KI.soyle('Ekran paylaşımı bitti.'); } });
      if(no !== KI.paylasimNo || !KI.acik){ try{ p.bitir(); }catch(e){ /* durmuş */ } return false; }   // bu arada kapandı
      p.tur = 'ekran';
      KI.paylasim = p;
    }catch(e){
      if(no !== KI.paylasimNo) return false;
      KI.paylasim = null;
      KI.soyle(e && e.name === 'NotAllowedError' ? 'Ekran paylaşımı iptal edildi.' : 'Ekran paylaşılamadı: ' + ((e && e.message) || 'bilinmeyen hata'));
      return false;
    }
    KI.gozSonIz = '';
    gozKur(KI.GOZ_ILK);
    KI.soyle('Ekranını görüyorum. Ne sorarsan o anki ekranı yorumlarım; ' + (KI.gozAcik() ? 'arada bir de kendim bakıp '
      + 'işine yarayacak bir şey görürsem söylerim.' : 'görüntü yalnız sorduğunda yapay zekâya gider, saklanmaz.'));
    return true;
  }
  async function kameraAc(){
    if(KI.kameraMi()){ paylasimBitir(); return false; }
    if(KI.paylasim) paylasimKapat();
    if(!KI.ortam.kameraDestek()){ KI.soyle('Bu cihazda kameraya ulaşılamıyor.'); return false; }
    /* Söz 37: modülün fotoğraf işi varsa (barkod cihazda okunur) Merkez'siz de açılır. */
    if(!gorebilir() && !fotoIsleri().length){ KI.soyle(GORSEL_YOK); return false; }
    const no = ++KI.paylasimNo;
    try{
      const p = await KI.ortam.kameraBaslat(() => { if(KI.paylasim && KI.paylasim === p){ paylasimKapat(); KI.soyle('Kamera kapandı.'); } }, KI.kamSecili());
      if(no !== KI.paylasimNo || !KI.acik){ try{ p.bitir(); }catch(e){ /* durmuş */ } return false; }   // bu arada kapandı
      p.tur = 'kamera';
      KI.paylasim = p;
    }catch(e){
      if(no !== KI.paylasimNo) return false;
      KI.paylasim = null;
      const ad = e && e.name;
      KI.soyle(ad === 'NotAllowedError' ? 'Kameraya izin verilmedi.' : ad === 'NotFoundError' || ad === 'OverconstrainedError'
        ? 'Kamera bulunamadı; takılı olduğundan emin ol.' : ad === 'NotReadableError' ? 'Kamera başka bir uygulamada açık görünüyor.'
        : 'Kamera açılamadı: ' + ((e && e.message) || 'bilinmeyen hata'));
      return false;
    }
    KI.kamTazele();                                 // izinden sonra kameraların adları gelir
    KI.gozSonIz = '';
    gozKur(KI.GOZ_ILK);
    KI.soyle('Kamerayı görüyorum. Masandaki kâğıdı ya da kitabı gösterip sorabilirsin; ' + (KI.gozAcik() ? 'arada bir de kendim bakıp '
      + 'takıldığın bir yer görürsem yardım teklif ederim.' : 'görüntü yalnız sorduğunda okunur.') + ' Görüntü saklanmaz, bilgisayardan çıkmaz.');
    return true;
  }
  let gozZaman = null;
  function gozKur(ms){
    gozDurdur();
    const no = KI.gozNo; KI.gozVakit = KI.ortam.simdi().getTime() + ms;
    gozZaman = KI.ortam.zamanla(() => { gozZaman = null; gozBak(no); }, ms);
  }
  function gozDurdur(){
    KI.gozNo++;
    if(gozZaman != null){ try{ KI.ortam.zamanIptal(gozZaman); }catch(e){ /* yok */ } gozZaman = null; }
  }
  function gozIz(v){ const s = String(v || ''); let h = 0; for(let i = 0; i < s.length; i += 97) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; }
  async function gozBak(no){
    /* Vakti gelmeden çağrıldıysa (anında çalışan zamanlayıcı) hiçbir şey yapılmaz: döngü kendini beslemez. */
    if(no !== KI.gozNo || !KI.paylasim || !KI.acik || KI.ortam.simdi().getTime() < KI.gozVakit - 1000) return;
    const sonra = () => { if(no === KI.gozNo && KI.paylasim) gozKur(KI.GOZ_ARA); };
    const k = KI.baglanti();
    const mesgul = !!KI.dinleyen || KI.konusuyor > 0 || KI.akis.some(m => m.bekliyor) || KI.ortam.simdi().getTime() - KI.gozSonEtkilesim < 60000;
    if(!KI.gozAcik() || mesgul || !k){ sonra(); return; }
    let kare = null;
    try{ kare = KI.paylasim.kare(); }catch(e){ sonra(); return; }
    const iz = gozIz(kare && kare.data);
    if(iz === KI.gozSonIz){ sonra(); return; }      // ekran değişmemiş: rahatsız etme
    KI.gozSonIz = iz;
    const r = await merkezGorsel(k, KI.kameraMi() ? KI.GOZ_KAMERA : KI.GOZ_SORU, kare, 'ekran');
    if(no !== KI.gozNo || !KI.paylasim) return;
    const cevap = r.ok ? String(r.text || '').trim() : '';
    if(cevap && !/^PAS\b/i.test(cevap) && cevap.length <= 320) KI.soyle(cevap);
    sonra();
  }
  function gozSec(ac){ if(ac) KI.ortam.depo.sil(KI.GOZ); else KI.ortam.depo.yaz(KI.GOZ, false); KI.ciz(false); }
  function paylasimKapat(){
    const p = KI.paylasim;
    KI.paylasim = null;
    KI.paylasimNo++;                                // bekleyen açılış da geçersiz
    gozDurdur();
    if(p) try{ p.bitir(); }catch(e){ /* durmuş */ }
    return p;
  }
  function paylasimBitir(){
    const p = paylasimKapat();
    if(KI.acik) KI.soyle(p && p.tur === 'kamera' ? 'Kamerayı kapattım.' : 'Ekran paylaşımını durdurdum.');
  }
  async function fotoYorumla(){
    const f = KI.bekleyenFoto;
    KI.bekleyenFoto = null; KI.cipler = null;
    if(!f) return null;
    let resim = null;
    try{ resim = await KI.ortam.dosyaKare(f); }catch(e){ KI.soyle('Fotoğraf okunamadı.'); return null; }
    return gorselCevap('Bu fotoğrafta ne var? Kısaca söyle; LifeOS’ta işime yarayacak bir şey (soru, öğün, ölçüm, plan) varsa belirt.', resim);
  }

  /* ---------- söz 13: sesli sohbet ---------- */
  function sohbetDevam(){
    kesiciKapat();
    if(!KI.sesliSohbet || !KI.acik || KI.dinleyen || KI.konusuyor || KI.akis.some(m => m.bekliyor || m.akiyor)) return;
    if(KI.sesKuyruk && KI.sesKuyruk.no === KI.sesNo && !KI.sesKuyruk.kapali) return;   // akan cevap sürüyor
    dinle();
  }
  function sesliSohbetAc(){
    if(!KI.konusabilir()){ KI.soyle('Bu tarayıcı konuşmayı tanımıyor; yazarak devam edebilirsin.'); return false; }
    KI.sesliSohbet = !KI.sesliSohbet;
    KI.sessizSay = 0;
    if(!KI.sesliSohbet){ if(KI.dinleyen){ try{ KI.dinleyen.stop(); }catch(e){ /* kapalı */ } } KI.soyle('Sesli sohbeti bitirdim.'); return false; }
    KI.sesli = true;
    KI.soyle('Seni dinliyorum. Bitirmek için «tamam» de.');
    return true;
  }

  /* ------------------------------------------------------- ses (söz 7) */

  /* Cihazdaki en iyi Türkçe ses. Buluttaki ses (localService false,
     «Online») hiç seçilmez. Saf: testler sınar. */
  function sesSec(liste){
    const tr = (liste || []).filter(v => v && /^tr([-_]|$)/i.test(v.lang || '') && v.localService !== false
      && !/online/i.test(v.name || ''));
    if(!tr.length) return null;
    const puan = v => (/premium|enhanced|gelişmiş|natural|neural/i.test(v.name || '') ? 4 : 0)
      + (/siri|yelda/i.test(v.name || '') ? 2 : 0) + (v.default ? 1 : 0) + KI.cinsiyetPuan(v);
    return tr.slice().sort((a, b) => puan(b) - puan(a))[0];
  }
  /* Kısa parçalar: uzun metinde Chrome okumayı yarıda sessizce keser. */
  function parcala(metin){
    return String(metin || '').replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/).reduce((l, p) => {
      if(!p) return l;
      if(l.length && (l[l.length - 1] + ' ' + p).length <= 180) l[l.length - 1] += ' ' + p; else l.push(p);
      return l;
    }, []);
  }
  function durum(){
    if(KI.uyanik || KI.uyanAralik) uyanKontrol();      // K3: King konuşur ya da dinlerken uyanma dinleyicisi susar
    if(typeof document === 'undefined') return;
    KI.arkadasGuncelle();
    const el = document.querySelector('[data-king]');
    if(!el) return;
    el.classList.toggle('is-dinliyor', !!KI.dinleyen);
    el.classList.toggle('is-konusuyor', KI.konusuyor > 0);
    const m = el.querySelector('.king__mik');
    if(m){
      m.classList.toggle('is-acik', !!KI.dinleyen);
      m.setAttribute('aria-pressed', KI.dinleyen ? 'true' : 'false');
      m.setAttribute('aria-label', KI.dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor');
    }
  }
  function sus(){
    KI.sesNo++;
    kesiciKapat();
    if(KI.calan){ const c = KI.calan; KI.calan = null; try{ c.dur(); }catch(e){ /* durmuş */ } }
    const sz = KI.ortam.sentez();
    if(sz) try{ sz.cancel(); }catch(e){ /* yok */ }
    KI.konusuyor = 0;
    durum();
  }
  /* Söz 28: sesi kim okusun. */
  function sesTercihi(){ const v = KI.ortam.depo.oku(KI.SES); return KI.SES_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  function sesTercihSec(v){
    if(KI.SES_TERCIH.indexOf(v) < 0) return false;
    if(v === 'oto') KI.ortam.depo.sil(KI.SES); else KI.ortam.depo.yaz(KI.SES, v);
    KI.ciz(false);
    return true;
  }
  /* Kısa cümleleri SES_PARCA harfe kadar birleştirir: her parça bir istek. */
  function sesParcalari(metin){
    return parcala(metin).reduce((l, p) => {
      if(l.length && (l[l.length - 1] + ' ' + p).length <= KI.SES_PARCA) l[l.length - 1] += ' ' + p; else l.push(p);
      return l;
    }, []);
  }
  /* K3: akan ses ucu (HKM /api/ses/akis). Eski HKM'de yoksa (404) bir daha denenmez. */
  KI.sesAkisYok = false;
  async function sesGetir(k, metin, tercih){
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), 30000) : null;
    try{
      const f = KI.ortam.fetch;
      const istek = yol => f(k.url + yol, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ metin, tercih:tercih || sesTercihi() }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      /* Okuma hızı 1 değilse parça çalıcı sesi inceltir; o zaman tek WAV. */
      const akisli = !!KI.ortam.pcmCal && !KI.sesAkisYok && KI.hiz() === 1;
      let res = await istek(akisli ? '/api/ses/akis' : '/api/ses');
      if(akisli && (res.status === 404 || res.status === 405)){ KI.sesAkisYok = true; res = await istek('/api/ses'); }
      const baslik = h => (res.headers && res.headers.get && res.headers.get(h)) || '';
      let not = baslik('X-Ses-Not');
      try{ not = decodeURIComponent(not); }catch(e){ /* düz kalır */ }
      if(res.status === 200 && Number(baslik('X-Ses-Hz')) > 0 && res.body && typeof res.body.getReader === 'function'){
        return { akis:res, hz:Number(baslik('X-Ses-Hz')), motor:baslik('X-Ses-Motor'), not };
      }
      if(res.status !== 200 || typeof res.blob !== 'function') return null;
      return { blob:await res.blob(), motor:baslik('X-Ses-Motor'), not };
    }catch(e){
      return null;
    }finally{
      if(t) clearTimeout(t);
    }
  }
  /* Okunmayacak akan cevap bırakılır (HKM yazmayı keser, EMA sıcak kalır). */
  function sesBirak(r){ if(r && r.akis && r.akis.body) try{ const c = r.akis.body.cancel(); if(c && c.catch) c.catch(() => {}); }catch(e){ /* kapalı */ } }

  /* K3: okuma kuyruğu. Akan cevabın cümleleri geldikçe eklenir (ilk cümle
     cevap bitmeden okunur); `kapali` olunca son parçadan sonra King susar. */
  KI.sesKuyruk = null;      // { no, l:[metin], kapali, bekle, cihaz }
  function kuyrukAl(q){
    if(q.l.length) return Promise.resolve(q.l.shift());
    if(q.kapali) return Promise.resolve(null);
    return new Promise(ok => { q.bekle = () => { q.bekle = null; ok(q.l.length ? q.l.shift() : null); }; });
  }
  function kuyrukKapat(q){ if(!q) return; q.kapali = true; if(q.bekle) q.bekle(); }
  /* Doner: true (okundu ya da kesildi) | false (ilk parça bile gelmedi: cihaza düş). */
  async function sunucuSesi(k, q, no){
    const tercih = sesTercihi();
    let kilit = '';            // ses kilidi: ilk parçayı okuyan motor
    const getir = m => (m == null ? null : sesGetir(k, m, kilit || tercih).then(r => ({ m, r })));
    let sonraki = kuyrukAl(q).then(getir);
    for(let i = 0; ; i++){
      const x = await sonraki;
      if(!x) break;
      const m = x.m;
      let r = x.r;
      if(no !== KI.sesNo){ sesBirak(r); return true; }
      if(!r && i > 0 && kilit && kilit !== tercih){
        r = await sesGetir(k, m, tercih);
        if(no !== KI.sesNo){ sesBirak(r); return true; }
      }
      if(r && r.motor){
        if(r.motor !== kilit || r.not) KI.sonNot = r.not || '';
        kilit = r.motor;
      }
      /* Sonraki parça bu çalarken istenir (ses arası boş kalmasın). */
      sonraki = r ? kuyrukAl(q).then(getir) : Promise.resolve(null);
      const s = !r ? 'olmadi' : r.akis ? await KI.ortam.pcmCal(r.akis, r.hz, c => { KI.calan = c; })
        : await KI.ortam.oynat(r.blob, c => { KI.calan = c; }, KI.hiz());
      KI.calan = null;
      if(no !== KI.sesNo){ sonraki.then(y => sesBirak(y && y.r)); return true; }
      if(s !== 'bitti'){
        sonraki.then(y => sesBirak(y && y.r));
        q.cihaz = true;
        const kalan = [m].concat(q.l.splice(0));
        if(i === 0){ q.l = kalan; return false; }
        cihazSesi(kalan.join(' '));
        return true;
      }
      if(r.motor) KI.sonMotor = r.motor;
    }
    if(no !== KI.sesNo) return true;
    KI.konusuyor = 0;
    durum();
    sohbetDevam();
    return true;
  }
  /* `devam`: 'acik' akan cevabın ilk cümlesi (kuyruk açık kalır), 'ek' açık
     kuyruğa yeni cümle, 'son' son parça (kuyruk kapanır). Açık kuyruk yoksa
     'ek' ve 'son' baştan okur. */
  function seslendir(metin, devam){
    const q0 = KI.sesKuyruk;
    if(devam && devam !== 'acik'){
      /* Kesildiyse (sus) akan cevabın kalanı okunmaz. */
      if(!q0 || q0.no !== KI.sesNo || q0.kapali) return;
      if(q0.cihaz){ if(metin) cihazSesi(metin, true); q0.kapali = devam === 'son'; if(q0.kapali && !metin && !KI.konusuyor) sohbetDevam(); return; }
      if(metin) q0.l.push.apply(q0.l, sesParcalari(metin));
      if(devam === 'son') kuyrukKapat(q0); else if(q0.bekle) q0.bekle();
      return;
    }
    if(!metin) return;
    sus();
    const no = KI.sesNo;
    const q = KI.sesKuyruk = { no, l:sesParcalari(metin), kapali:devam !== 'acik', bekle:null, cihaz:false };
    const k = sesTercihi() === 'cihaz' ? null : KI.baglanti();
    if(!k || !KI.ortam.oynat){ q.cihaz = true; cihazSesi(metin); return; }
    KI.konusuyor = 1;
    durum();
    kesiciAc();
    const dus = () => { if(no !== KI.sesNo) return; q.cihaz = true; cihazSesi(q.l.splice(0).join(' ') || metin); };
    sunucuSesi(k, q, no).then(ok => { if(!ok) dus(); }, dus);
  }
  function cihazSesi(metin, ekle){
    const sz = KI.ortam.sentez();
    if(!sz || !metin){ if(!ekle){ KI.konusuyor = 0; durum(); } return; }
    if(!ekle) try{ sz.cancel(); }catch(e){ /* yok */ }
    if(KI.sonMotor !== 'cihaz') KI.sonNot = '';
    KI.sonMotor = 'cihaz';
    const ses = sesSec(sz.getVoices ? sz.getVoices() : []);
    const parcalar = parcala(metin);
    KI.konusuyor = (ekle ? KI.konusuyor : 0) + parcalar.length;
    parcalar.forEach(p => {
      const u = KI.ortam.soz(p);
      try{ if(KI.L.SES && KI.L.SES.duzey) u.volume = KI.L.SES.duzey('king'); }catch(e){ /* düzey yok: tam ses */ }
      u.lang = 'tr-TR';
      if(ses) u.voice = ses;
      u.rate = 1.03 * KI.hiz();
      u.onend = u.onerror = () => { KI.konusuyor = Math.max(0, KI.konusuyor - 1); durum(); if(!KI.konusuyor) sohbetDevam(); };
      try{ sz.speak(u); }catch(e){ KI.konusuyor = 0; }
    });
    durum();
    kesiciAc();
  }

  function dinle(){
    if(KI.dinleyen){ try{ KI.dinleyen.stop(); }catch(e){ /* kapalı */ } return; }
    const hk = !hkmDinlemez() && KI.ortam.kayitAc && KI.algila() !== 'tarayici' ? KI.baglanti() : null;
    if(hk){ kayitDinle(hk); return; }
    const T = KI.ortam.tanima();
    if(!T) return;
    sus();
    let r;
    try{ r = new T(); }catch(e){ return; }
    r.lang = 'tr-TR';
    r.interimResults = true;
    r.continuous = false;
    let son = '', hata = '';
    r.onresult = e => {
      let ara = '', kesin = '';
      for(let i = 0; i < e.results.length; i++){
        const x = e.results[i];
        if(x.isFinal) kesin += x[0].transcript; else ara += x[0].transcript;
      }
      son = (kesin || ara).trim();
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      if(g) g.value = (kesin + ara).trim();
    };
    r.onerror = e => { hata = (e && e.error) || 'hata'; };
    r.onend = () => { KI.dinleyen = null; durum(); tanindi(son, hata); };
    KI.dinleyen = r;
    try{ r.start(); }catch(e){ KI.dinleyen = null; }
    durum();
  }
  /* Tanima bitti (tarayici ya da HKM): metin ya da hata. */
  function tanindi(son, hata){
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      if(son){
        if(g) g.value = '';
        KI.sesli = true;
        KI.sessizSay = 0;
        /* Söz 13: «tamam», «görüşürüz» sesli sohbeti bitirir. */
        if(KI.sesliSohbet && /^(tamam|teşekkürler|teşekkür ederim|görüşürüz|dur|bitti|kapat sesi|yeter)[.!]?$/i.test(KI.kucuk(son))){
          KI.sesliSohbet = false; KI.akis.push({ kim:'sen', metin:son }); KI.soyle('Tamam, sesli sohbeti bitirdim. Yazarak devam edebilirsin.'); return;
        }
        KI.isle(son);
      }else if(KI.sesliSohbet && (!hata || hata === 'no-speech')){
        KI.sessizSay++;
        if(KI.sessizSay >= 2){ KI.sesliSohbet = false; KI.sessizSay = 0; KI.soyle('Sesini duyamadım; sesli sohbeti durdurdum.'); }
        else KI.ortam.zamanla(sohbetDevam, 400);
      }else if(hata === 'not-allowed' || hata === 'service-not-allowed'){
        KI.sesliSohbet = false;
        KI.soyle('Mikrofon izni verilmedi. Tarayıcının adres çubuğundan izin verebilir ya da yazabilirsin.');
      }else if(hata && hata !== 'aborted'){
        /* Sesli sohbette gerçek hata döngüyü DURDURUR (sahada, 2026-10-19:
           masaüstünde tarayıcı tanıması her seferinde hata veriyor, King
           yeniden dinliyor ve «Ses tanınamadı» üst üste yığılıyordu). */
        if(KI.sesliSohbet){ KI.sesliSohbet = false; KI.sessizSay = 0; KI.soyle('Ses tanınamadı; sesli sohbeti durdurdum. Yazarak devam edebilirsin.'); return; }
        KI.soyle(hata === 'no-speech' ? 'Bir şey duyamadım. Yeniden dener misin?' : 'Ses tanınamadı; yazarak da sorabilirsin.');
      }
  }

  /* Söz 29 (2026-10-19): HKM bağlıysa konuşma kaydedilir ve HKM yazıya döker:
     bu PC'de Whisper varsa o (ücretsiz, ses çıkmaz), yoksa Gemini. HKM ikisini
     de bulamazsa bir kez söylenir ve sonraki dinlemeler tarayıcının tanımasıyla
     yapılır. Kayıt sessizlikte (1,4 sn) kendiliğinden biter.
     Tek bir 503 küsmeye yetmez (2026-10-19: Whisper kurulu olduğu halde bir
     hata «Whisper yok» dedirtip HKM'yi kalıcı bırakıyordu): art arda iki
     başarısızlıkta 5 dakika tarayıcıya geçilir; mesaj HKM'nin nedenini yazar. */
  KI.hkmDinlemezBitis = 0;     // bu ana kadar tarayıcının tanıması (0: HKM)
  /* Masaüstü uygulamasında (Electron) tarayıcının tanıması Google'a gidemez ve
     her seferinde düşer (2026-10-21, kullanıcı: «ses yazıya dökülemiyor»).
     Orada tarayıcıya geçilmez; HKM her seferinde yeniden denenir. */
  const masaustu = () => typeof navigator !== 'undefined' && /Electron\//.test(navigator.userAgent || '');
  const hkmDinlemez = () => !masaustu() && KI.hkmDinlemezBitis > KI.ortam.simdi().getTime();
  KI.dinleHata = 0;            // art arda 503 sayısı
  KI.dinleNot = '';            // HKM'nin son «neden yazıya dökülemedi» notu
  const DINLE_ARA = 5 * 60 * 1000;
  function wavYap(pcm, hz){
    const ORAN = 16000, n = Math.max(0, Math.floor(pcm.length * ORAN / hz));
    const v = new DataView(new ArrayBuffer(44 + n * 2));
    const yaz = (o, m) => { for(let i = 0; i < m.length; i++) v.setUint8(o + i, m.charCodeAt(i)); };
    yaz(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); yaz(8, 'WAVEfmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, ORAN, true); v.setUint32(28, ORAN * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); yaz(36, 'data'); v.setUint32(40, n * 2, true);
    for(let i = 0; i < n; i++){
      const x = Math.max(-1, Math.min(1, pcm[Math.min(pcm.length - 1, Math.floor(i * hz / ORAN))] || 0));
      v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    const b = new Uint8Array(v.buffer);
    let ikili = '';
    for(let i = 0; i < b.length; i += 0x8000) ikili += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(ikili);
  }
  async function yaziyaDok(k, wav){
    try{
      const f = KI.ortam.fetch;
      const gonder = () => f(k.url + '/api/dinle', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify({ wav, tercih:KI.algila() }) });
      let res = await gonder();
      if(res.status === 503) res = await gonder();   // Whisper anlık düşebilir (GPU dolu); bir kez daha
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && typeof g.metin === 'string'){ KI.dinleHata = 0; KI.dinleNot = ''; return g.metin; }
      if(res.status === 503){
        KI.dinleNot = g && Array.isArray(g.notlar) ? g.notlar.filter(Boolean).join(' ') : '';
        if(++KI.dinleHata >= 2){
          KI.hkmDinlemezBitis = KI.ortam.simdi().getTime() + DINLE_ARA; KI.dinleHata = 0;
        }
      }
      return null;
    }catch(e){ return null; }
  }
  async function kayitDinle(k, hazir){
    if(!hazir) sus();
    let kayit = null, bitti = false;
    const sonlandir = async () => {
      if(bitti) return;
      bitti = true;
      const r = kayit ? kayit.bitir() : null;
      KI.dinleyen = null;
      durum();
      if(!r || !r.konustu){ tanindi('', 'no-speech'); return; }
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      const eski = g ? g.placeholder : '';
      if(g) g.placeholder = 'Yazıya dökülüyor…';
      const t = await yaziyaDok(k, wavYap(r.pcm, r.hz));
      if(g) g.placeholder = eski;
      if(t === null){
        const neden = KI.dinleNot ? ' (' + KI.dinleNot.replace(/[.\s]+$/, '') + ')' : '';
        KI.soyle(hkmDinlemez() ? 'HKM sesi yazıya dökemedi' + neden + '; birkaç dakika tarayıcının tanımasını deneyeceğim.'
          : masaustu() ? 'Ses yazıya dökülemedi' + neden + '. Yeniden konuşabilir ya da yazabilirsin.'
          : 'Ses yazıya dökülemedi' + neden + '; yazarak da sorabilirsin.');
        return;
      }
      tanindi(t, t ? '' : 'no-speech');
    };
    KI.dinleyen = { stop:sonlandir, abort:() => { bitti = true; if(kayit) try{ kayit.bitir(); }catch(e){} KI.dinleyen = null; durum(); } };
    durum();
    if(hazir){ kayit = hazir; kayit.devral(() => { sonlandir(); }, 0.02); KI.ciz(false); return; }
    try{ kayit = await KI.ortam.kayitAc(() => { sonlandir(); }, KI.mikSecili()); }
    catch(e){ bitti = true; KI.dinleyen = null; durum(); tanindi('', 'not-allowed'); return; }
    if(bitti && kayit) try{ kayit.bitir(); }catch(e){ /* durmus */ }
  }
  async function mikDene(){
    if(KI.mikDeniyor){ const d = KI.mikDeniyor; KI.mikDeniyor = null; d.dur(); return; }
    if(!KI.ortam.kayitAc){
      KI.mikNot = 'Bu tarayıcıda doğrudan mikrofon kaydı desteklenmiyor.';
      KI.ciz(false);
      return;
    }
    sus();
    let kayit = null, bitti = false, sayac = null;
    const sonlandir = async () => {
      if(bitti) return;
      bitti = true;
      if(sayac) clearTimeout(sayac);
      KI.mikDeniyor = null;
      const r = kayit ? kayit.bitir() : null;
      if(!r || !r.konustu){
        KI.mikNot = 'Ses duyulmadı — mikrofona konuşup tekrar dene ya da başka bir mikrofon seç.';
        KI.ciz(false);
        return;
      }
      const hk = KI.algila() !== 'tarayici' ? KI.baglanti() : null;
      if(hk){
        KI.mikNot = 'Ses alındı · yazıya dökülüyor…';
        KI.ciz(false);
        const t = await yaziyaDok(hk, wavYap(r.pcm, r.hz));
        KI.mikNot = t ? 'Mikrofon çalışıyor · «' + t + '»'
          : t === '' ? 'Mikrofon ses aldı, ancak konuşma seçilemedi.'
          : 'Mikrofon ses aldı, ancak HKM yazıya dökemedi.';
      }else{
        KI.mikNot = 'Mikrofon çalışıyor · ses alındı.';
      }
      KI.ciz(false);
    };
    const iptal = () => {
      if(bitti) return;
      bitti = true;
      if(sayac) clearTimeout(sayac);
      KI.mikDeniyor = null;
      if(kayit) try{ kayit.bitir(); }catch(e){ /* durmus */ }
    };
    KI.mikDeniyor = { dur:sonlandir, iptal };
    KI.mikNot = 'Dinliyorum… bir cümle söyle (durunca ya da Bitir’e basınca biter).';
    KI.ciz(false);
    try{
      kayit = await KI.ortam.kayitAc(() => { sonlandir(); }, KI.mikSecili());
      KI.mikTazele();
      sayac = KI.ortam.zamanla(() => { sonlandir(); }, 5000);
    }catch(e){
      bitti = true;
      if(sayac) clearTimeout(sayac);
      KI.mikDeniyor = null;
      KI.mikNot = 'Mikrofon açılamadı — tarayıcı iznini ya da seçili mikrofonu kontrol et.';
      KI.ciz(false);
    }
    if(bitti && kayit) try{ kayit.bitir(); }catch(e){ /* durmus */ }
  }

  /* Söz 15: aynı günün son mesajları bu cihazda. */
  const depoAnahtar = () => 'king.sohbet.' + ((KI.ayar && KI.ayar.modul) || 'x');
  function sakla(){
    if(!KI.ayar) return;
    const l = KI.akis.filter(m => !m.bekliyor).slice(-KI.GUNLUK_EN_COK).map(m => Object.assign({ kim:m.kim, metin:m.foto ? '(fotoğraf)' : (m.metin || ''),
      satirlar:m.satirlar || null, son:m.son || null }, m.arastirma ? { arastirma:m.arastirma } : {},
      /* DEVRİM: ders, yasa ve gün kartları da gün boyu kalır (yeniden açınca başlık tek kalmasın). */
      m.ders ? { ders:m.ders } : {}, m.yasa ? { yasa:m.yasa } : {}, m.gun ? { gun:m.gun } : {}, m.yap ? { yap:true } : {},
      /* KING-4 §H: yardım kartı (bekleyen düzeltme hariç: geri alması bu oturumda) ve «neden şimdi?» satırı. */
      m.yardim && m.yardim.tur !== 'duzelt' ? { yardim:m.yardim } : {}, m.nedenSimdi ? { nedenSimdi:m.nedenSimdi } : {}));
    KI.ortam.depo.yaz(depoAnahtar(), { gun:KI.bugunISO(), akis:l });
    tasimaYaz(l);
  }
  /* Söz 18: açıkken taşınacak durum; kapalıyken yok. */
  function tasimaYaz(l, git){
    if(!KI.ayar) return;
    if(!KI.acik){ KI.ortam.depo.sil(KI.TASIMA); return; }
    const liste = (l || KI.akis.filter(m => !m.bekliyor).slice(-6).map(m => ({ kim:m.kim, metin:m.foto ? '(fotoğraf)' : (m.metin || '') })))
      .slice(-6).map(m => ({ kim:m.kim, metin:String(m.metin || '').slice(0, 200) }));
    KI.ortam.depo.yaz(KI.TASIMA, { acik:true, mini:true, kaynak:KI.ayar.modul, akis:liste, zaman:Date.now(), git:git || null });
  }
  function geriGetir(){
    const v = KI.ortam.depo.oku(depoAnahtar());
    return v && v.gun === KI.bugunISO() && Array.isArray(v.akis) ? v.akis.filter(m => m && m.metin) : [];
  }
  /* Söz 33: Konuş kipinde araya girme. King konuşurken mikrofon yüksek
     eşikle dinlenir; konuşma başlarsa King susar ve seni dinler. */
  /* K3 (sağlam araya girme): kesici kayıt kapatılıp yeni mikrofon açılmaz;
     aynı kayıt devralınır ve konuşmanın başından (0,4 sn önce) yazıya dökülür.
     Eşik yüksek (0,06) ve 0,25 sn sürekli ses ister: King'in kendi sesi yankı
     giderimiyle bastırılır, tek bir tıkırtı kesmez. */
  let kesici = null;
  async function kesiciAc(){
    if(kesici || !(KI.sesliSohbet || KI.uyanTur) || !KI.ortam.kayitAc || KI.konusuyor <= 0) return;
    const no = KI.sesNo;
    kesici = 'aciliyor';
    let k = null;
    try{
      k = await KI.ortam.kayitAc(() => {}, KI.mikSecili(), () => {
        if(no !== KI.sesNo || kesici !== k) return;
        kesici = null;                       // devralındı: kesiciKapat kaydı kapatmasın
        sus();
        kesiciDevral(k);
      }, 0.06);
      if(kesici !== 'aciliyor' || no !== KI.sesNo){ try{ k.bitir(); }catch(e){ /* kapalı */ } if(kesici === 'aciliyor') kesici = null; return; }
      kesici = k;
    }catch(e){ kesici = null; }
  }
  function kesiciDevral(k){
    const hk = KI.baglanti();
    if(!KI.acik || KI.dinleyen || !hk || typeof k.devral !== 'function' || hkmDinlemez() || KI.algila() === 'tarayici'){
      try{ k.bitir(); }catch(e){ /* kapalı */ }
      sohbetDevam();
      return;
    }
    kayitDinle(hk, k);
  }
  function kesiciKapat(){
    const k = kesici;
    kesici = null;
    if(k && k !== 'aciliyor') try{ k.bitir(); }catch(e){ /* kapalı */ }
  }

  /* ------------------------------------------------------- K3: «King» deyince uyanma */
  /* Varsayılan kapalı; ··· menüsünde açılır. Mikrofonu kod dinler (yalnız ses
     seviyesi, model yok); kısa bir konuşma bitince o parça YALNIZ bu
     bilgisayardaki Merkez'e gider ve yerel modelle (Gemma 4, sonra Whisper;
     Gemini asla) yazıya dökülür. Başında «King» yoksa unutulur. Boşa giden
     her parçadan sonra bekleme uzar (televizyon, gürültü GPU'yu yormasın). */
  const UYAN = 'lifeos.king.uyan';
  const UYAN_RE = /^(?:hey|hi|ey|selam|merhaba)?\s*(?:king|kink|kıng|kin|kingg)(?![a-zçğıöşü])\s*(.*)$/;
  KI.uyanik = null; let uyanAciliyor = false; KI.uyanMesgul = false; KI.uyanBekle = 0; KI.uyanKacan = 0; KI.uyanHata = 0; KI.uyanAralik = null;
  KI.uyanTur = false;               // uyanmayla başlayan sesli konuşma sürüyor
  KI.uyanNot = '';
  function uyanAcikMi(){ return KI.ortam.depo.oku(UYAN) === true; }
  const uyanYerel = k => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(k.url);
  /* Saf: yazıya dökülmüş parça «King …» mi? Döner: kalan cümle ('' yalnız King) ya da null. */
  function uyanCumlesi(metin){
    if(typeof metin !== 'string') return null;
    const t = KI.kucuk(metin).replace(/[.,!?;:"'’…«»]+/g, ' ').replace(/\s+/g, ' ').trim();
    const m = t.match(UYAN_RE);
    if(!m) return null;
    return String(metin).replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü]*(?:(?:hey|hi|ey|selam|merhaba)[\s,]+)?\S+[\s,.!?]*/i, '').trim();
  }
  function uyanGerek(){
    if(!KI.ayar || !KI.ortam.uyanikAc || !uyanAcikMi()) return false;
    const k = KI.baglanti();
    if(!k || !uyanYerel(k) || KI.ortam.gizli()) return false;
    if(KI.sesliSohbet || KI.dinleyen || KI.konusuyor > 0 || kesici || KI.mikDeniyor) return false;
    return KI.ortam.simdi().getTime() >= KI.uyanHata;
  }
  async function uyanKontrol(){
    if(!uyanGerek()){
      if(KI.uyanik){ const u = KI.uyanik; KI.uyanik = null; try{ u.bitir(); }catch(e){ /* kapalı */ } }
      return;
    }
    if(KI.uyanik || uyanAciliyor) return;
    uyanAciliyor = true;
    try{
      const u = await KI.ortam.uyanikAc(uyanParca, KI.mikSecili());
      if(uyanGerek() && !KI.uyanik){ KI.uyanik = u; KI.uyanNot = ''; } else u.bitir();
    }catch(e){
      KI.uyanHata = KI.ortam.simdi().getTime() + 60000;        // izin yoksa her saniye sorulmaz
      KI.uyanNot = 'Mikrofon açılamadı; «King» ile uyanma şimdilik çalışmıyor.';
    }
    uyanAciliyor = false;
  }
  async function uyanParca(pcm, hz){
    if(KI.uyanMesgul || KI.ortam.simdi().getTime() < KI.uyanBekle || !uyanGerek()) return;
    const k = KI.baglanti();
    KI.uyanMesgul = true;
    let metin = null;
    try{
      const res = await KI.ortam.fetch(k.url + '/api/dinle', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ wav:wavYap(pcm, hz), tercih:KI.algila() === 'whisper' ? 'whisper' : 'gemma' }) });
      const g = res.status === 200 ? await res.json() : null;
      metin = g && typeof g.metin === 'string' ? g.metin : null;
    }catch(e){ metin = null; }
    KI.uyanMesgul = false;
    const kalan = uyanCumlesi(metin);
    if(kalan === null){
      KI.uyanKacan = Math.min(KI.uyanKacan + 1, 15);
      KI.uyanBekle = KI.ortam.simdi().getTime() + KI.uyanKacan * 2000;
      return;
    }
    KI.uyanKacan = 0; KI.uyanBekle = 0;
    if(!uyanAcikMi() || KI.sesliSohbet || KI.dinleyen) return;
    uyandi(kalan);
  }
  /* Uyanınca: King küçük kutuyla açılır ve sesli konuşma başlar; «tamam» ya da
     iki sessizlik bitirir, sonra King yine «King»i bekler. */
  function uyandi(kalan){
    if(!KI.acik) KI.ac({ mini:true });
    if(!KI.acik) return;
    KI.uyanTur = true; KI.sesliSohbet = true; KI.sessizSay = 0; KI.sesli = true;
    uyanKontrol();
    if(kalan) KI.isle(kalan);
    else KI.soyle('Buyur.');
  }
  function uyanTik(){
    if(!KI.sesliSohbet) KI.uyanTur = false;
    uyanKontrol();
  }
  function uyanKur(){
    const ac_ = uyanAcikMi() && !!KI.ortam.uyanikAc && typeof setInterval === 'function' && typeof document !== 'undefined';
    if(ac_ && !KI.uyanAralik){
      KI.uyanAralik = setInterval(uyanTik, 2000);
      try{ document.addEventListener('visibilitychange', uyanKontrol); }catch(e){ /* yok */ }
    }
    if(!ac_ && KI.uyanAralik){
      clearInterval(KI.uyanAralik); KI.uyanAralik = null;
      try{ document.removeEventListener('visibilitychange', uyanKontrol); }catch(e){ /* yok */ }
    }
    uyanKontrol();
  }
  function uyanSec(ac_){
    if(ac_) KI.ortam.depo.yaz(UYAN, true); else KI.ortam.depo.sil(UYAN);
    KI.uyanHata = 0; KI.uyanNot = '';
    uyanKur();
    KI.ciz(false);
  }
  function uyanHtml(){
    if(!KI.ortam.uyanikAc) return '';
    const a = uyanAcikMi(), k = KI.baglanti();
    const not = !a ? 'Kapalı. Açınca mikrofon dinlemede kalır; «King» dediğin kısa cümle yalnız bu bilgisayardaki Merkez’de yazıya dökülür, başka yere gitmez.'
      : !k || !uyanYerel(k) ? 'Yalnız bu bilgisayarda, Merkez açıkken çalışır.'
      : KI.uyanNot || (KI.uyanik ? 'Dinliyor. «King» de ya da «King, bugün ne var?» diye sor.' : 'King konuşurken ya da dinlerken bekler.');
    return '<div class="king__menu-satir king__menu-anahtar"><span class="king__menu-ad">«King» deyince uyan</span>'
      + '<button type="button" class="king__secim" role="switch" aria-checked="' + (a ? 'true' : 'false') + '" data-king="uyan:' + (a ? '0' : '1') + '" aria-label="«King» deyince uyan">'
      + '<span class="king__anahtar' + (a ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></div>'
      + '<p class="king__menu-not" data-king-uyan-not>' + KI.kac(not) + '</p>';
  }

  Object.assign(KI, { fotoIsleri, fotoAl, PDF_METIN, pdfAl, fotoIsle, kameraIs, isKamera, isSec, ekranOku, ekranGoster, gorselZincir, gorselCevap, paylasimBaslat, kameraAc, gozSec, paylasimKapat, paylasimBitir, fotoYorumla, sohbetDevam, sesliSohbetAc, sesSec, durum, sus, sesTercihi, sesTercihSec, sesParcalari, seslendir, dinle, wavYap, mikDene, depoAnahtar, sakla, tasimaYaz, geriGetir, kesiciKapat, UYAN, uyanAcikMi, uyanCumlesi, uyanKontrol, uyanParca, uyanKur, uyanSec, uyanHtml });
})();
