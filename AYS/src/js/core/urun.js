/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/urun.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* BAM ÜRÜNLERİ — modülün HKM'den aldığı özet, rapor, sunum, pankart…

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/urun.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Yol: modül sohbetinde «türev hakkında özet hazırla» → HKM King'e iş
   emri açar (`POST /api/king/urun`; tanıyıcı HKM'dedir) → Üretim Bürosu
   yazar, Editör ve Kalite Kontrol ölçer → modüle `urun.add` teklifi →
   kullanıcı onaylarsa ürün modülün Ofis ekranındaki «BAM ürünleri»
   listesine girer.

   Sözler:
   1. HKM'NİN DENETİMİNE GÜVENİLMEZ. Kayıt modülün KENDİ koduyla sınanır:
      tür, aile ve ürün adı teklifle tutmalı; belge bölümsüz, sunum
      slaytsız olamaz; basılı hâl bir HTML belgesi olmalı ve sınırı aşmamalı.
   2. ÜRÜN KUTUDA AÇILIR. Basılı hâl `sandbox` iframe'de gösterilir (betik
      çalışmaz, modülün sayfasına ve deposuna erişemez).
   3. HKM KAPALIYKEN DE OKUNUR. Ürün eklenirken basılı hâli modülün kendi
      deposuna yazılır; sonra HKM'ye gerek kalmaz.
   4. ETİKET TAŞINIR. «Kaynaklı / çelişkili / doğrulanmadı» ürünün yanında
      durur; kaynaksız ürün «doğrulanmadı»dır.
   5. TANIYICI TEK YERDEDİR. Burada yalnız ÖN SÜZGEÇ var (HKM
      core/urunler.py ile aynı kelimeler — HKM/tests/test_urun.py sınar);
      hangi ürün ve hangi konu olduğuna HKM karar verir. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Urun = (function(){
  /* HKM core/urunler.py URUNLER[*].kelime ile AYNI liste. */
  const KELIMELER = ['özet', 'ozet', 'özetle', 'özetini', 'rapor', 'ders notu', 'not çıkar',
    'notlarını', 'konu anlatımı', 'konu anlatımını', 'sözlük', 'kavram listesi', 'terimler',
    'kavramlar', 'karşılaştır', 'kıyasla', 'farkları', 'karşılaştırma', 'çalışma kağıdı',
    'çalışma kâğıdı', 'etkinlik', 'sık sorulan', 'sss', 'soru cevap', 'sunum', 'slayt', 'sunu',
    'pankart', 'afiş', 'afis', 'poster', 'bilgi kartı', 'infografik', 'zihin haritası',
    'zihin haritasi', 'mind map', 'kavram haritası', 'zaman çizelgesi', 'zaman cizelgesi',
    'kronoloji', 'tarih şeridi'];
  /* HKM core/sohbet.py URUN_FIIL ile aynı: katalog kelimesi TEK BAŞINA ürün
     isteği değildir («özet» günün brifingidir). */
  const FIIL = /(hazırla|oluştur|çıkar|üret|yaz\b|yazar mısın|yap\b|yapar mısın|istiyorum|lazım|tasarla|çiz)/;
  const BICIM = /^\s*[a-zçğıöşü ]{2,25}:\s*\S/;

  const AILELER = ['belge', 'sunum', 'gorsel'];
  const DOGRULUK = { kaynakli:'kaynaklı', celiskili:'çelişkili', dogrulanmadi:'doğrulanmadı' };
  const EN_COK = 20;             // saklanan ürün
  const HTML_SINIR = 300000;     // karakter — dokuz aylık yedek şişmesin
  const SURE = 6000;
  const ANAHTAR = 'meta/bamUrunleri';

  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function bosluk(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /* Ön süzgeç: katalog kelimesi VE üretim fiili (ya da «özet: konu» biçimi). */
  function istekMi(metin){
    const k = kucuk(metin);
    if(!k || k.charAt(0) === '/') return false;
    if(!KELIMELER.some(w => k.indexOf(w) >= 0)) return false;
    return FIIL.test(k) || BICIM.test(k);
  }

  /* Kaydı modülün KENDİ koduyla sınar. Dönüş { ok, why?, urun? }. */
  function sina(kayit, p, html){
    const g = kayit && kayit.govde;
    if(!kayit || typeof kayit !== 'object' || !g) return { ok:false, why:'Kayıt alınamadı.' };
    if(g.tur !== 'urun') return { ok:false, why:'Bu kayıt bir ürün değil.' };
    const kid = Number(kayit.id);
    if(!Number.isInteger(kid) || kid < 1 || kid !== Number(p && p.kayit_id)){
      return { ok:false, why:'Kayıt kimliği teklifle tutmuyor.' };
    }
    if(AILELER.indexOf(g.aile) < 0) return { ok:false, why:'Ürün ailesi tanınmadı.' };
    if(p && p.urun && g.urun !== p.urun) return { ok:false, why:'Ürün türü teklifle tutmuyor.' };
    if(g.aile === 'belge' && !(Array.isArray(g.bolumler) && g.bolumler.length)){
      return { ok:false, why:'Belgenin hiç bölümü yok.' };
    }
    if(g.aile === 'sunum' && !(Array.isArray(g.slaytlar) && g.slaytlar.length)){
      return { ok:false, why:'Sunumun hiç slaytı yok.' };
    }
    const h = String(html || '');
    if(!/<html[\s>]/i.test(h) || !/<\/html>\s*$/i.test(h)){
      return { ok:false, why:'Ürünün basılı hâli bir HTML belgesi değil.' };
    }
    if(h.length > HTML_SINIR) return { ok:false, why:'Ürün saklanamayacak kadar büyük.' };
    const baslik = bosluk(g.baslik || kayit.baslik).slice(0, 160);
    if(baslik.length < 2) return { ok:false, why:'Ürünün başlığı yok.' };
    return { ok:true, urun:{ id:'bam-' + kid, kayitId:kid, urun:String(g.urun || ''),
      urunAd:bosluk(g.urun_ad).slice(0, 60) || 'Ürün', aile:g.aile, baslik,
      dogruluk:DOGRULUK[kayit.dogruluk] ? kayit.dogruluk : 'dogrulanmadi',
      kaynak:Array.isArray(g.kaynaklar) ? g.kaynaklar.length : 0, html:h } };
  }

  /* Basılı hâl KUTUDA: sandbox="" betiği, formu, açılır pencereyi ve üst
     pencereye erişimi kapatır. srcdoc özniteliği kaçışlanır. */
  function cerceve(u){
    const src = String((u && u.html) || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const ad = bosluk(u && u.baslik).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
    return '<iframe class="urun-cerceve" sandbox="" referrerpolicy="no-referrer" title="'
      + ad + '" srcdoc="' + src + '" style="width:100%;min-height:420px;border:1px solid '
      + 'var(--line, #ccc);border-radius:8px;background:#fff"></iframe>';
  }

  function etiketAdi(d){ return DOGRULUK[d] || DOGRULUK.dogrulanmadi; }

  /* `kur({ store:() => Store, hkm:() => Beacon, fetch? })` */
  function kur(ortam){
    let liste_ = [];

    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || !b.urlOk(a.url)) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f, modul:b.MODULE } : null;
    }

    async function cagir(k, yol, secenek){
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), SURE) : null;
      try{
        const f = k.f;          /* fetch bir nesnenin yöntemi olarak çağrılamaz */
        return await f(k.url + yol, Object.assign({ signal:ctrl ? ctrl.signal : undefined,
          headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token } },
        secenek || {}));
      }finally{
        if(t) clearTimeout(t);
      }
    }

    async function yukle(){
      let ham = null;
      try{ ham = await ortam.store().get(ANAHTAR); }catch(e){ ham = null; }
      liste_ = (ham && Array.isArray(ham.items)) ? ham.items.filter(x => x && x.id && x.html) : [];
      return liste_;
    }
    async function yaz(){
      try{ await ortam.store().set(ANAHTAR, { items:liste_ }); }catch(e){ /* yerel */ }
    }

    function liste(){ return liste_.map(u => Object.assign({}, u, { html:undefined })); }
    function bul(id){ return liste_.find(u => u.id === id) || null; }

    async function sil(id){
      const once = liste_.length;
      liste_ = liste_.filter(u => u.id !== id);
      await yaz();
      return { ok:liste_.length < once };
    }

    /* Sohbetteki ürün isteği → King'e iş emri (modül adına). */
    async function iste(metin){
      const k = baglanti();
      if(!k){
        return { ok:false, metin:'Bunu HKM’deki Üretim Bürosu hazırlar ama HKM bağlı değil. '
          + 'HKM’ye bağlanınca yeniden iste.' };
      }
      try{
        const res = await cagir(k, '/api/king/urun', { method:'POST',
          body:JSON.stringify({ modul:k.modul, metin:String(metin || '').slice(0, 600) }) });
        const g = await res.json();
        if(res.status !== 200 || !g || !g.ok){
          return { ok:false, metin:(g && (g.note || g.error)) || 'King iş emrini almadı.' };
        }
        if(!g.tanindi){
          return { ok:false, tanindi:false, metin:'Bunu bir ürün isteği olarak anlamadım. '
            + '«Türev hakkında özet hazırla» ya da «fotosentez zihin haritası çiz» gibi '
            + 'yazarsan King’e iletirim.' };
        }
        return { ok:true, tanindi:true, metin:g.metin };
      }catch(e){
        return { ok:false, metin:'HKM’ye ulaşılamadı; iş emri açılmadı. HKM açıkken yeniden iste.' };
      }
    }

    /* `urun.add` teklifini uygular: kayıt ve basılı hâli HKM'den ÇEKİLİR,
       modülün kendi koduyla sınanır, modülün deposuna yazılır. */
    async function uygula(p){
      const kid = Number(p && p.kayit_id);
      if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Ürün kimliği geçersiz.' };
      if(bul('bam-' + kid)) return { ok:false, error:'Bu ürün zaten eklenmiş.' };
      const k = baglanti();
      if(!k) return { ok:false, error:'HKM bağlantısı kurulmamış; ürün alınamaz.' };
      let kayit = null, html = null;
      try{
        const r1 = await cagir(k, '/api/bam/kayit/' + kid, { method:'GET' });
        if(r1.status === 200){ const g = await r1.json(); kayit = g && g.kayit; }
        const r2 = await cagir(k, '/api/bam/kayit/' + kid + '/cikti?bicim=html', { method:'GET' });
        if(r2.status === 200) html = await r2.text();
      }catch(e){ kayit = null; }
      if(!kayit || html == null){
        return { ok:false, error:'Ürün HKM’den alınamadı; HKM açıkken yeniden dene.' };
      }
      const s = sina(kayit, p, html);
      if(!s.ok) return { ok:false, error:s.why };
      s.urun.eklenme = new Date().toISOString();
      liste_ = [s.urun].concat(liste_).slice(0, EN_COK);
      await yaz();
      return { ok:true, urun:s.urun, note:s.urun.urunAd + ' eklendi («' + s.urun.baslik.slice(0, 60)
        + '», BAM #' + kid + ', ' + etiketAdi(s.urun.dogruluk) + '). Ofis ekranındaki BAM '
        + 'ürünlerinden açarsın.' };
    }

    return { yukle, liste, bul, sil, iste, uygula };
  }

  return { kur, istekMi, sina, cerceve, etiketAdi, KELIMELER, AILELER, EN_COK, HTML_SINIR };
})();
