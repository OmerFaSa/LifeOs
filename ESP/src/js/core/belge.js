/* BAM BELGESİ — tarih ve felsefe için KAYNAKLI malzeme (Part 8f).

   Kullanıcı: «ESP'de yalnız dil değil; felsefe, tarih ve diğer alanlara da
   belge aratacağız: kimisine filozof, kimisine türlü türlü şeyler.»
   Tarih › Kaynaklar ya da Sempozyum › Metinler'den bir konu istenir; King'in
   teklifinden ve onaydan geçer; BAM web kaynaklarından tipli bir kayıt yazar
   (HKM/core/espbelge.py) ve HKM onu `belge.add` teklifi olarak bırakır.

   Sözler:
     1. HKM YAZMAZ, ESP YAZAR. Kayıt HKM'den ÇEKİLİR ve ESP'nin KENDİ
        koduyla yeniden sınanır (yıl aralığı, tür ve bölge ESP'nin
        sözlüğünden, tekrar); onay anında yeniden çekilir, yeniden sınanır.
     2. BELGE KAYNAKTIR. Kaynaksız («doğrulanmadı») kayıt eklenmez; her olay
        kendi kaynağına bağlanır ve kaynak Kaynaklar'a girer. Kaynağın türünü
        KOD verir: ansiklopedi → üçüncül, diğerleri → ikincil.
     3. TEZ BİR TARTIŞMANIN BAŞIDIR. Düşünürün tezi Sempozyum'da AÇIK bir
        argüman olur; destek ve itirazı kullanıcı yazar. Eser Kütüphane'ye
        «henüz başlanmadı» olarak girer: okumadığın kitap okunuyor görünmez.
     4. GERİ ALINIR. Kullanıcının üzerinde çalıştığı kayıt (zincir kurulmuş
        olay, desteği/itirazı yazılmış argüman) geri almada KALIR ve bu
        söylenir. */

window.ESP = window.ESP || {};

ESP.Belge = (function(){
  const U = () => ESP.U;
  const YIL = [-3500, 2100];
  const SURE = 5000;

  function bosluk(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function metin(x, az, cok){ const t = bosluk(x); return t.length >= az && t.length <= cok ? t : null; }
  function yilOk(y){ return typeof y === 'number' && Number.isInteger(y) && y >= YIL[0] && y <= YIL[1]; }
  function yilYaz(y){ return y < 0 ? 'MÖ ' + (-y) : String(y); }

  /* ------------------------------------------------------------ HKM */

  function baglanti(){
    const b = ESP.Beacon;
    const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
    if(!b || !a.enabled || !a.token || !b.urlOk(a.url)) return null;
    return { url:String(a.url).replace(/\/$/, ''), token:a.token };
  }

  async function istek(yol, govde){
    const k = baglanti();
    if(!k) return { ok:false, bagli:false };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const zaman = ctrl ? setTimeout(() => ctrl.abort(), SURE) : null;
    try{
      const res = await fetch(k.url + yol, {
        method:govde === undefined ? 'GET' : 'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:govde === undefined ? undefined : JSON.stringify(govde),
        signal:ctrl ? ctrl.signal : undefined,
      });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { ok:res.status === 200, status:res.status, bagli:true, govde:g };
    }catch(e){
      return { ok:false, bagli:true, ag:true };
    }finally{
      if(zaman) clearTimeout(zaman);
    }
  }

  function istekTemizle(o){
    const alan = o && o.alan;
    if(['tarih', 'felsefe', 'okuma', 'yazi', 'cefr', 'okuma_hizi', 'diksiyon'].indexOf(alan) < 0) return { ok:false, why:'Alan tarih, felsefe, okuma, yazı ya da diksiyon olmalı.' };
    const konu = bosluk(o.konu);
    if(konu.length < 2 || konu.length > 80) return { ok:false, why:'Konu 2–80 karakter olmalı.' };
    return { ok:true, belge:{ alan, konu } };
  }

  async function iste(o){
    const t = istekTemizle(o);
    if(!t.ok) return { ok:false, metin:t.why };
    const r = await istek('/api/king/emir', { modul:'esp', tur:'esp.belge', konu:'',
      neden:'ESP ' + ({ tarih:'Tarih', felsefe:'Sempozyum', okuma:'Okuma', yazi:'Yazı',
        cefr:'Rehber › Dayanak', okuma_hizi:'Rehber › Dayanak', diksiyon:'Stüdyo › Diksiyon' })[t.belge.alan] + ' ekranından belge istendi.',
      govde:{ belge:t.belge } });
    if(!r.bagli) return { ok:false, metin:'Belgeyi HKM’deki Araştırma Bürosu kaynaklardan çıkarır ama HKM '
      + 'bağlı değil. Rehber › HKM’den bağlanınca yeniden iste.' };
    if(r.ag) return { ok:false, metin:'HKM’ye ulaşılamadı; iş emri açılmadı. HKM açıkken yeniden iste.' };
    const g = r.govde || {};
    if(!r.ok || !g.ok){
      return { ok:false, metin:'King iş emrini almadı: ' + ((g.errors || []).join('; ') || g.note || ('HTTP ' + r.status)) };
    }
    if(window.LIFEOS && LIFEOS.KingTeklif) LIFEOS.KingTeklif.haberVer();
    const e = g.emir || {};
    return { ok:true, emir:e.id, metin:g.yeni === false
      ? 'Bu istek zaten açık (iş emri #' + e.id + ').'
      : 'King teklif hazırladı (iş emri #' + e.id + '). Onaylarsan Araştırma Bürosu kaynakları '
        + 'tarar; belge Bugün’e teklif olarak gelir. Web kapalıysa belge yazılmaz.' };
  }

  async function kayitCek(kid){
    const r = await istek('/api/bam/kayit/' + kid);
    return r.ok && r.govde && r.govde.kayit ? r.govde.kayit : null;
  }

  /* ------------------------------------------------------------ sınama (saf) */

  function kaynakKaydi(k, kid){
    return ESP.Model.newSource({ title:metin(k.baslik, 2, 160) || String(k.url || 'Web kaynağı').slice(0, 160),
      author:'', year:null, kind:k.tur === 'ansiklopedi' ? 'tertiary' : 'secondary',
      url:String(k.url || '').slice(0, 400), bam:{ kayitId:kid, n:k.n } });
  }

  function sina(kayit, p){
    const g = kayit && kayit.govde;
    const kid = Number(kayit && kayit.id);
    if(!g || !Number.isInteger(kid) || kid < 1 || kid !== Number(p && p.kayit_id)){
      return { ok:false, why:'Kayıt teklifle eşleşmiyor.' };
    }
    if(['tarih', 'felsefe', 'okuma', 'yazi', 'cefr', 'okuma_hizi', 'diksiyon'].indexOf(g.tur) < 0) return { ok:false, why:'Kayıt ESP belgesi biçiminde değil.' };
    if(kayit.dogruluk !== 'kaynakli') return { ok:false, why:'Kaynaksız belge eklenmez: belge kaynaktır.' };
    if(g.tur === 'cefr' || g.tur === 'okuma_hizi') return dayanakSina(g, kid, kayit);
    if(g.tur === 'diksiyon') return diksiyonSina(g, kid);
    const hepsi = [].concat(ESP.S.events || [], ESP.S.sources || [], ESP.S.books || [], ESP.S.args || []);
    if(hepsi.some(x => x && x.bam && x.bam.kayitId === kid)) return { ok:false, why:'Bu belge zaten eklenmiş.' };
    const kaynaklar = {};
    (Array.isArray(g.kaynaklar) ? g.kaynaklar : []).forEach(k => { if(k && Number.isInteger(k.n)) kaynaklar[k.n] = k; });
    let dusen = 0, atlanan = 0;

    if(g.tur === 'tarih'){
      const var_ = {};
      (ESP.S.events || []).forEach(e => { var_[U().norm(e.title) + '|' + e.year] = 1; });
      const kaynakYeni = {}, events = [];
      (Array.isArray(g.olaylar) ? g.olaylar : []).slice(0, 24).forEach(x => {
        const title = metin(x && x.baslik, 2, 120);
        const k = x && kaynaklar[x.kaynak];
        if(!title || !yilOk(x.yil) || !ESP.EVENT_KIND_BY_ID[x.tur]
          || !(ESP.REGIONS || []).some(r => r.id === x.bolge) || !k){ dusen++; return; }
        if(var_[U().norm(title) + '|' + x.yil]){ atlanan++; return; }
        var_[U().norm(title) + '|' + x.yil] = 1;
        if(!kaynakYeni[k.n]) kaynakYeni[k.n] = kaynakKaydi(k, kid);
        events.push(ESP.Model.newEvent({ title, year:x.yil, kind:x.tur, region:x.bolge,
          why:metin(x.neden, 2, 240) || '', note:'BAM #' + kid + ' · kaynaklı',
          sourceIds:[kaynakYeni[k.n].id], bam:{ kayitId:kid } }));
      });
      if(!events.length) return { ok:false, why:'Belgeden Kronoloji’ye eklenecek yeni olay çıkmadı.' };
      const sources = Object.keys(kaynakYeni).map(n => kaynakYeni[n]);
      const uyari = [];
      if(dusen) uyari.push(dusen + ' olay ESP’nin denetimini geçmedi (yıl, tür, bölge ya da kaynak).');
      if(atlanan) uyari.push(atlanan + ' olay Kronoloji’de zaten var; yeniden eklenmeyecek.');
      return { ok:true, tur:'tarih', events, sources, kayitId:kid,
        onizleme:{ baslik:bosluk(g.konu) + ' — ' + events.length + ' olay, ' + sources.length + ' kaynak (kaynaklı)',
          satirlar:events.map(e => yilYaz(e.year) + ' · ' + e.title + (e.why ? ' — ' + e.why : '')),
          uyari } };
    }

    const kitapVar = {};
    (ESP.S.books || []).forEach(b => { kitapVar[U().norm(b.title) + '|' + U().norm(b.author)] = b; });

    /* OKUMA ve YAZI: eser listesi → Kütüphane (başlanmadı). BAM'ın notu
       kitabın üstünde durur; kullanıcının atomik notlarına YAZILMAZ (notlar
       senin fikrindir ve sentez ölçüsüne girer). */
    if(g.tur === 'okuma' || g.tur === 'yazi'){
      const yeni = [];
      (Array.isArray(g.eserler) ? g.eserler : []).slice(0, 20).forEach(x => {
        const yazar = metin(x && x.yazar, 2, 80), eser = metin(x && x.eser, 2, 120);
        if(!yazar || !eser || !(x && kaynaklar[x.kaynak]) || (x.yil != null && !yilOk(x.yil))){ dusen++; return; }
        const anahtar = U().norm(eser) + '|' + U().norm(yazar);
        if(kitapVar[anahtar]){ atlanan++; return; }
        const b = ESP.Model.newBook({ title:eser, author:yazar, kind:'primary', startedAt:null,
          year:x.yil == null ? null : x.yil,
          bam:{ kayitId:kid, alan:g.tur, not:metin(x.not, 4, 240) } });
        kitapVar[anahtar] = b;
        yeni.push(b);
      });
      if(!yeni.length) return { ok:false, why:'Belgeden Kütüphane’ye eklenecek yeni eser çıkmadı.' };
      const uyari = [];
      if(dusen) uyari.push(dusen + ' eser ESP’nin denetimini geçmedi (yazar, ad, yıl ya da kaynak).');
      if(atlanan) uyari.push(atlanan + ' eser Kütüphane’de zaten var; yeniden eklenmeyecek.');
      uyari.push('Eserler Okuma › Kaynaklar’a «başlanmadı» olarak girer.');
      return { ok:true, tur:g.tur, books:yeni, args:[], kayitId:kid,
        onizleme:{ baslik:bosluk(g.konu) + ' — ' + yeni.length + ' eser (' + (g.tur === 'okuma'
            ? 'okuma listesi' : 'yazı örnekleri') + ', kaynaklı)',
          satirlar:yeni.map(b => b.author + ' — ' + b.title + (b.year != null ? ' (' + yilYaz(b.year) + ')' : '')
            + (b.bam.not ? ': ' + b.bam.not : '')), uyari } };
    }
    const tezVar = {};
    (ESP.S.args || []).forEach(a => { tezVar[U().norm(a.thesis)] = 1; });
    const books = [], args = [];
    (Array.isArray(g.dusunurler) ? g.dusunurler : []).slice(0, 16).forEach(x => {
      const ad = metin(x && x.ad, 2, 80), eser = metin(x && x.eser, 2, 120), tez = metin(x && x.tez, 10, 300);
      if(!ad || !eser || !tez || !(x && kaynaklar[x.kaynak]) || (x.yil != null && !yilOk(x.yil))){ dusen++; return; }
      if(tezVar[U().norm(tez)]){ atlanan++; return; }
      tezVar[U().norm(tez)] = 1;
      const anahtar = U().norm(eser) + '|' + U().norm(ad);
      let b = kitapVar[anahtar];
      if(!b){
        b = ESP.Model.newBook({ title:eser, author:ad, kind:'primary', startedAt:null,
          year:x.yil == null ? null : x.yil, bam:{ kayitId:kid } });
        kitapVar[anahtar] = b;
        books.push(b);
      }
      const kav = (Array.isArray(x.kavramlar) ? x.kavramlar : []).map(k => metin(k, 2, 40)).filter(Boolean).slice(0, 5);
      args.push(ESP.Model.newArgument({ thesis:ad + ': ' + tez, sourceId:b.id, concepts:kav,
        status:'open', bam:{ kayitId:kid } }));
    });
    if(!args.length) return { ok:false, why:'Belgeden Sempozyum’a eklenecek yeni tez çıkmadı.' };
    const uyari = [];
    if(dusen) uyari.push(dusen + ' düşünür ESP’nin denetimini geçmedi (ad, eser, tez ya da kaynak).');
    if(atlanan) uyari.push(atlanan + ' tez Sempozyum’da zaten var; yeniden eklenmeyecek.');
    uyari.push('Tezler açık tartışma olarak açılır: destek ve itirazı sen yazarsın. Eserler Kütüphane’ye '
      + '«henüz başlanmadı» olarak girer.');
    return { ok:true, tur:'felsefe', books, args, kayitId:kid,
      onizleme:{ baslik:bosluk(g.konu) + ' — ' + args.length + ' tez, ' + books.length + ' yeni eser (kaynaklı)',
        satirlar:args.map(a => a.thesis), uyari } };
  }

  /* ------------------------------------------------------------ diksiyon

     Kullanıcı 2026-09-24: diksiyon belgesi «ikisi birden». Telaffuz KURALI
     Stüdyo › Diksiyon'da kaynağıyla durur; okuma PARÇASI çalışma metinlerine
     katılır (HKM parçayı kaynakta BİREBİR bulmuştu; burada uzunluk, kaynak
     bağı ve tekrar yeniden sınanır). Tekerleme gibi parçanın da süresi ve
     hatası kullanıcının ölçümüdür. */
  const DIKSIYON_ANAHTAR = 'meta/diksiyon';
  function diksiyon(){
    const d = ESP.S.diksiyon;
    if(!d || !Array.isArray(d.kurallar) || !Array.isArray(d.parcalar)) ESP.S.diksiyon = { kurallar:[], parcalar:[] };
    return ESP.S.diksiyon;
  }
  async function diksiyonYukle(){
    let d = null;
    try{ d = await ESP.Store.get(DIKSIYON_ANAHTAR); }catch(e){ d = null; }
    ESP.S.diksiyon = d && Array.isArray(d.kurallar) && Array.isArray(d.parcalar) ? d : { kurallar:[], parcalar:[] };
  }
  function kelimeSay(t){ return bosluk(t).split(' ').filter(Boolean).length; }

  function diksiyonSina(g, kid){
    const d = diksiyon();
    if(d.kurallar.concat(d.parcalar).some(x => x.bam && x.bam.kayitId === kid)) return { ok:false, why:'Bu belge zaten eklenmiş.' };
    const var_ = {};
    d.kurallar.forEach(k => { var_[U().norm(k.kural)] = 1; });
    d.parcalar.forEach(p => { var_[U().norm(p.text)] = 1; });
    let dusen = 0, atlanan = 0;
    const kurallar = [], parcalar = [];
    (Array.isArray(g.kurallar) ? g.kurallar : []).slice(0, 24).forEach(x => {
      const kural = metin(x && x.kural, 10, 300), k = kural && kaynakAdi(g, x.kaynak);
      if(!kural || !k){ dusen++; return; }
      if(var_[U().norm(kural)]){ atlanan++; return; }
      var_[U().norm(kural)] = 1;
      kurallar.push({ id:U().uid('dk'), kural, ornek:metin(x.ornek, 1, 120), kaynak:k, bam:{ kayitId:kid } });
    });
    (Array.isArray(g.parcalar) ? g.parcalar : []).slice(0, 12).forEach(x => {
      const t = metin(x && x.metin, 40, 600), k = t && kaynakAdi(g, x.kaynak);
      if(!t || !k){ dusen++; return; }
      if(var_[U().norm(t)]){ atlanan++; return; }
      var_[U().norm(t)] = 1;
      parcalar.push({ id:U().uid('dp'), text:t, words:kelimeSay(t), yazar:metin(x.yazar, 2, 80),
        kaynak:k, bam:{ kayitId:kid } });
    });
    if(!kurallar.length && !parcalar.length) return { ok:false, why:'Belgeden eklenecek yeni kural ya da parça çıkmadı.' };
    const uyari = [];
    if(dusen) uyari.push(dusen + ' satır ESP’nin denetimini geçmedi (uzunluk ya da kaynak).');
    if(atlanan) uyari.push(atlanan + ' satır zaten var; yeniden eklenmeyecek.');
    uyari.push('Kurallar Stüdyo › Diksiyon’da kaynağıyla durur; parçalar çalışma metinlerine katılır.');
    return { ok:true, tur:'diksiyon', kurallar, parcalar, kayitId:kid,
      onizleme:{ baslik:bosluk(g.konu) + ' — ' + kurallar.length + ' kural, ' + parcalar.length + ' okuma parçası (kaynaklı)',
        satirlar:kurallar.map(k => k.kural + (k.ornek ? ' (örnek: ' + k.ornek + ')' : ''))
          .concat(parcalar.map(p => '«' + p.text.slice(0, 80) + (p.text.length > 80 ? '…' : '') + '»')),
        uyari } };
  }

  /* Çalışma metinleri: yerleşik tekerlemeler + kaynaklı okuma parçaları. */
  function calismaMetinleri(){
    return (ESP.TONGUE_TWISTERS || []).concat(diksiyon().parcalar.map(p => ({ id:p.id, level:null,
      target:null, words:p.words, text:p.text, kaynak:p.kaynak, yazar:p.yazar })));
  }

  /* ------------------------------------------------------------ dayanak (madde 11)

     Hedef paketlerinin TAHMİN TABLOLARI (core/hedefler.js): CEFR saatleri ve
     okuma hızı. Kaynaklı değer tablonun yerine geçer; HESABI yine kod yapar
     ve karar «tahmin» kalır — değişen, dayanağın kaynaklı olmasıdır. */
  const CEFR_SIRA = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const DAYANAK_ANAHTAR = 'meta/dayanaklar';

  function kaynakAdi(g, n){
    const k = (Array.isArray(g.kaynaklar) ? g.kaynaklar : []).find(x => x && x.n === n);
    return k ? { baslik:metin(k.baslik, 2, 160) || 'web kaynağı', url:String(k.url || '').slice(0, 400) } : null;
  }

  function dayanakSina(g, kid, kayit){
    const at = String(kayit.created_at || '').slice(0, 10) || U().todayISO();
    if(g.tur === 'cefr'){
      const saat = {}, kaynak = {};
      (Array.isArray(g.seviyeler) ? g.seviyeler : []).forEach(x => {
        if(!x || CEFR_SIRA.indexOf(x.seviye) < 0 || saat[x.seviye]) return;
        if(!Number.isInteger(x.saat_ust) || x.saat_ust < 10 || x.saat_ust > 3000) return;
        const k = kaynakAdi(g, x.kaynak);
        if(!k) return;
        saat[x.seviye] = x.saat_ust; kaynak[x.seviye] = k;
      });
      const sv = CEFR_SIRA.filter(s => saat[s]);
      if(!sv.length) return { ok:false, why:'Belgede kaynaklı CEFR saati yok.' };
      /* Birleşik tablo (kaynaklı + varsayılan) seviye arttıkça artmalı. */
      const tablo = Object.assign({}, ESP.Hedefler ? ESP.Hedefler.CEFR_VARSAYILAN : {}, saat);
      for(let i = 1; i < CEFR_SIRA.length; i++){
        if(tablo[CEFR_SIRA[i]] <= tablo[CEFR_SIRA[i - 1]]){
          return { ok:false, why:'Kaynaklı saatler seviye sırasıyla artmıyor; tablo tutarsız, eklenmedi.' };
        }
      }
      const ilk = kaynak[sv[0]];
      return { ok:true, tur:'dayanak', anahtar:'cefr', kayitId:kid,
        deger:{ saat, kaynak:ilk, at, kayitId:kid },
        onizleme:{ baslik:'CEFR saat tablosu — ' + sv.length + '/6 seviye kaynaklı',
          satirlar:sv.map(s => s + ': ' + saat[s] + ' saat (kaynağın üst ucu)'),
          uyari:['Kaynak: ' + ilk.baslik + '. Kaynakta olmayan seviyeler varsayılan tabloda kalır. '
            + 'Karar yine «tahmin»dir; değişen dayanaktır.'] } };
    }
    const hizlar = (Array.isArray(g.hizlar) ? g.hizlar : [])
      .filter(x => x && Number.isInteger(x.kelime_dk) && x.kelime_dk >= 50 && x.kelime_dk <= 1000 && kaynakAdi(g, x.kaynak));
    if(!hizlar.length) return { ok:false, why:'Belgede kaynaklı okuma hızı yok.' };
    const d = U().median(hizlar.map(x => x.kelime_dk));
    const k = kaynakAdi(g, hizlar[0].kaynak);
    return { ok:true, tur:'dayanak', anahtar:'okumaHizi', kayitId:kid,
      deger:{ kelimeDk:Math.round(d), kaynak:k, at, kayitId:kid },
      onizleme:{ baslik:'Okuma hızı — dakikada ' + Math.round(d) + ' kelime (kaynaklı, ' + hizlar.length + ' değerin ortancası)',
        satirlar:hizlar.map(x => x.kelime_dk + ' kelime/dk' + (x.ne ? ' — ' + x.ne : '')),
        uyari:['Kitap başına süre bu hızdan hesaplanır; kitap uzunluğu (≈ 80 bin kelime) yine '
          + 'varsayımdır. Birkaç kitap bitirince kendi ölçümün bunun yerine geçer.'] } };
  }

  async function dayanakYukle(){
    let d = null;
    try{ d = await ESP.Store.get(DAYANAK_ANAHTAR); }catch(e){ d = null; }
    ESP.S.dayanaklar = d && typeof d === 'object' ? d : {};
  }
  function dayanak(ad){ return (ESP.S.dayanaklar || {})[ad] || null; }

  /* ------------------------------------------------------------ yazma */

  async function onizle(n){
    if(!n || n.kind !== 'belge.add') return null;
    const kayit = await kayitCek(Number(n.payload && n.payload.kayit_id));
    if(!kayit) return { ok:false, why:'Belge HKM’den alınamadı; HKM açıkken yeniden dene.' };
    return sina(kayit, n.payload || {});
  }

  async function uygula(p){
    const kid = Number(p && p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Kayıt kimliği geçersiz.' };
    if(!baglanti()) return { ok:false, error:'HKM bağlantısı kurulmamış; belge alınamaz.' };
    const kayit = await kayitCek(kid);
    if(!kayit) return { ok:false, error:'Belge HKM’den alınamadı; HKM açıkken yeniden dene.' };
    const s = sina(kayit, p);
    if(!s.ok) return { ok:false, error:s.why };
    if(s.tur === 'dayanak'){
      ESP.S.dayanaklar = ESP.S.dayanaklar || {};
      const onceki = ESP.S.dayanaklar[s.anahtar] || null;
      ESP.S.dayanaklar[s.anahtar] = s.deger;
      await ESP.Store.set(DAYANAK_ANAHTAR, ESP.S.dayanaklar);
      return { ok:true, note:(s.anahtar === 'cefr' ? 'CEFR saat tablosu' : 'Okuma hızı')
        + ' artık kaynaklı; dil ve okuma hedefleri bu dayanakla hesaplanır.',
        geriAl:{ kayitId:kid, dayanak:s.anahtar, onceki } };
    }
    if(s.tur === 'diksiyon'){
      const d = diksiyon();
      d.kurallar = d.kurallar.concat(s.kurallar);
      d.parcalar = d.parcalar.concat(s.parcalar);
      await ESP.Store.set(DIKSIYON_ANAHTAR, d);
      return { ok:true, note:s.kurallar.length + ' telaffuz kuralı ve ' + s.parcalar.length
        + ' okuma parçası Stüdyo › Diksiyon’a eklendi (kaynaklı).', geriAl:{ kayitId:kid, diksiyon:true } };
    }
    if(s.tur === 'tarih'){
      for(const k of s.sources){ const r = await ESP.Model.saveSource(k); if(!r.ok) return { ok:false, error:r.error }; }
      for(const e of s.events){ const r = await ESP.Model.saveEvent(e); if(!r.ok) return { ok:false, error:r.error }; }
      return { ok:true, note:s.events.length + ' olay Kronoloji’ye, ' + s.sources.length + ' kaynak Kaynaklar’a '
        + 'eklendi (kaynaklı).', geriAl:{ kayitId:kid } };
    }
    for(const b of s.books) await ESP.Model.saveBook(b);
    for(const a of s.args) await ESP.Model.saveArgument(a);
    if(s.tur !== 'felsefe'){
      return { ok:true, note:s.books.length + ' eser Okuma › Kaynaklar’a «başlanmadı» olarak eklendi.',
        geriAl:{ kayitId:kid } };
    }
    return { ok:true, note:s.args.length + ' tez Sempozyum’a açık tartışma olarak, ' + s.books.length
      + ' eser Kütüphane’ye eklendi.', geriAl:{ kayitId:kid } };
  }

  function bamOf(x, kid){ return x && x.bam && x.bam.kayitId === kid; }

  async function geriAl(g){
    const kid = g && g.kayitId;
    if(g && g.dayanak){
      ESP.S.dayanaklar = ESP.S.dayanaklar || {};
      if(g.onceki) ESP.S.dayanaklar[g.dayanak] = g.onceki; else delete ESP.S.dayanaklar[g.dayanak];
      await ESP.Store.set(DAYANAK_ANAHTAR, ESP.S.dayanaklar);
      return { ok:true, silinen:1, kalan:0 };
    }
    if(g && g.diksiyon){
      const d = diksiyon();
      const once = d.kurallar.length + d.parcalar.length;
      d.kurallar = d.kurallar.filter(x => !bamOf(x, kid));
      d.parcalar = d.parcalar.filter(x => !bamOf(x, kid));
      await ESP.Store.set(DIKSIYON_ANAHTAR, d);
      const silinen = once - d.kurallar.length - d.parcalar.length;
      return { ok:silinen > 0, silinen, kalan:0 };
    }
    let kalan = 0, silinen = 0;
    const S = ESP.S;
    for(const a of (S.args || []).filter(x => bamOf(x, kid))){
      if((a.supports || []).length || (a.objections || []).length){ kalan++; continue; }
      await ESP.Model.deleteArgument(a.id); silinen++;
    }
    for(const b of (S.books || []).filter(x => bamOf(x, kid))){
      if((S.args || []).some(a => a.sourceId === b.id) || b.startedAt
        || (S.notes || []).some(n => n.bookId === b.id)){ kalan++; continue; }
      await ESP.Model.deleteBook(b.id); silinen++;
    }
    for(const e of (S.events || []).filter(x => bamOf(x, kid))){
      if((S.chains || []).some(c => c.eventId === e.id)){ kalan++; continue; }
      await ESP.Model.deleteEvent(e.id); silinen++;
    }
    for(const s of (S.sources || []).filter(x => bamOf(x, kid))){
      if((S.events || []).some(e => (e.sourceIds || []).indexOf(s.id) >= 0)){ kalan++; continue; }
      await ESP.Model.deleteSource(s.id); silinen++;
    }
    return { ok:silinen + kalan > 0, silinen, kalan };
  }

  return { istekTemizle, iste, kayitCek, sina, onizle, uygula, geriAl, yilYaz, dayanak, dayanakYukle,
    diksiyon, diksiyonYukle, calismaMetinleri };
})();
