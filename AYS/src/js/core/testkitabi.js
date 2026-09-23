/* TEST KİTABI — BAM'ın bölümlü kitabını AYS'de sınav biçiminde çözmek
   (ekip/PLAN.md §3.E ve §3.L; Tur 4).

   Yol: Dersler › Sınav profilleri'nden «Test kitabı iste» → King'e
   `test.kitabi` iş emri → BAM Üretim Ofisi bölüm bölüm üretir, her soruyu
   bağımsız çözümle denetler → AYS'ye `kitap.add` teklifi → onaylanırsa
   kitap buraya alınır ve Sınama ekranında bölüm bölüm çözülür.

   Sözler:
   1. HKM'NİN DENETİMİNE GÜVENİLMEZ. Her soru AYS'nin kendi koduyla yeniden
      sınanır (beş farklı şık, geçerli anahtar); tutmayan düşer.
   2. ZORLUK ETİKETİ MODELİN BEYANIDIR («tahmin»). Gerçek zorluk senin
      çözümünle ölçülür: sonuç «ölçüldü» etiketiyle saklanır.
   3. SINAV BİÇİMİ: cevaplar bölüm bitene kadar gösterilmez; boş bırakmak
      serbesttir. Net ya da puan hesaplanmaz — kuralı sınavdan sınava
      değişir ve resmi puanlama bağlanmadı.
   4. HATALI SORU İŞARETLENİR ve sonuca sayılmaz: kaynaksız bir sorunun
      yanlış anahtarı, senin yanlışın değildir. */

window.R = window.R || {};

R.TestKitabi = (function(){
  const HARF = 'ABCDE';
  const ZORLUKLAR = ['kolay', 'orta', 'zor', 'belirsiz'];
  const VARSAYILAN = { kolay:30, orta:50, zor:20 };
  const SINIR = { bolum:6, konu:12, adet:10, soruBolum:20 };

  let oturum = null;         /* { kitapId, no, index, cevaplar, basla } */
  let ozet = null;           /* son biten bölümün sonucu (gözden geçirme) */
  /* YARIM BÖLÜM (fikir 27): oturum her adımda depoya yazılır; sayfa yenilense
     de kaldığın sorudan sürer. Geçen süre saklanır ki aradaki mola sonuca
     «çözme süresi» diye girmesin. */
  const YARIM = 'meta/testkitabiOturum';
  let yarimK = null;         /* { kitapId, no, index, cevaplar, gecen_ms } */

  function bosluk(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function kucuk(s){ return bosluk(s).replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr'); }

  function kitaplar(){ return (R.S.testKitaplari || []).slice(); }
  function bul(id){ return kitaplar().find(k => k.id === id) || null; }
  function bolumOf(k, no){ return k ? k.bolumler.find(b => b.no === no) || null : null; }

  /* ------------------------------------------------------------ istek

     Profilin dersleri bölüm olur (en çok 6); her bölüme bitmemiş konular
     önce gider. Zorluk dağılımını HKM kodla hesaplar. */
  function istekGovdesi(profil, adet){
    const biten = profil.bitenler || [];
    const bolumler = profil.dersler.slice(0, SINIR.bolum).map(d => {
      const acik = d.konular.filter(k => biten.indexOf(k.id) < 0);
      const kapali = d.konular.filter(k => biten.indexOf(k.id) >= 0);
      return { ad:d.ad.slice(0, 80), adet:adet || SINIR.adet,
        konular:acik.concat(kapali).slice(0, SINIR.konu).map(k => k.ad.slice(0, 120)) };
    });
    return { baslik:(profil.ad + ' test kitabı').slice(0, 120), bolumler,
      zorluk:Object.assign({}, VARSAYILAN) };
  }

  const KARAR = { onay:'King onayladı', kismi:'King kısmen onayladı', ret:'King reddetti' };

  async function iste(profilId){
    const p = R.SinavProfil && R.SinavProfil.bul(profilId);
    if(!p) return { ok:false, metin:'Önce sınav profilini seç ya da müfredatını iste.' };
    const govde = istekGovdesi(p);
    const r = await R.SinavProfil.istek('/api/king/emir', { modul:'ays', tur:'test.kitabi',
      govde:{ kitap:govde }, neden:'Kullanıcı bu profil için test kitabı istedi.' });
    if(!r.bagli) return { ok:false, metin:'HKM bağlı değil; test kitabı istenemedi. Sorular '
      + 'BAM’da üretilip denetlenir; HKM olmadan kitap kurulmaz.' };
    if(r.ag) return { ok:false, metin:'HKM’ye ulaşılamadı; HKM açıkken yeniden dene.' };
    const g = r.govde || {};
    if(!r.ok || !g.ok){
      return { ok:false, metin:'King iş emrini almadı: '
        + ((g.errors || []).join('; ') || g.note || ('HTTP ' + r.status)) };
    }
    const e = g.emir || {};
    /* Onay kapısı: ücretli iş teklifte bekler; Bugün'deki kart tazelensin. */
    if(window.LIFEOS && LIFEOS.KingTeklif) LIFEOS.KingTeklif.haberVer();
    if(e.durum === 'teklif'){
      return { ok:true, karar:g.karar, emirId:e.id, teklif:true,
        metin:'King bu kitap için teklif hazırladı (iş emri #' + e.id + '). Bugün’deki King '
          + 'teklifi kartında maliyeti, süreyi ve seçenekleri (tam kitap ya da yalnız 1. bölüm) '
          + 'görüp onayla; onaylamadan iş açılmaz.' };
    }
    const eksik = (e.kontrol || []).filter(m => !m.ok).map(m => m.not).join('; ');
    const soru = govde.bolumler.reduce((a, b) => a + b.adet, 0);
    return { ok:g.karar !== 'ret', karar:g.karar, emirId:e.id,
      metin:(g.yeni === false ? 'Bu kitap zaten hazırlanıyor (iş emri #' + e.id + ').'
        : (KARAR[g.karar] || 'King cevap verdi') + ' (iş emri #' + e.id + '): '
          + govde.bolumler.length + ' bölüm, ' + soru + ' soru istendi.')
        + (e.durum === 'bitti' ? ' Kitap depoda hazırdı; teklif olarak geliyor.'
          : (e.tahmin && e.tahmin.metin ? ' Tahmini süre ' + e.tahmin.metin + ' (tahmin).' : ''))
        + (eksik ? ' ' + eksik : '')
        + (g.karar !== 'ret' && e.durum !== 'bitti'
          ? ' Denetimi geçen sorular kitap olarak Bugün’de teklif edilir.' : '') };
  }

  /* ------------------------------------------------ kayıttan kitap */

  function soruTemizle(s){
    if(!s || typeof s !== 'object') return null;
    const metin = bosluk(s.soru);
    const sec = Array.isArray(s.secenekler) ? s.secenekler.map(bosluk) : [];
    if(metin.length < 2 || metin.length > 1500 || sec.length !== 5) return null;
    if(sec.some(x => !x || x.length > 300) || new Set(sec.map(kucuk)).size !== 5) return null;
    const dogru = HARF.indexOf(s.dogru);
    if(typeof s.dogru !== 'string' || s.dogru.length !== 1 || dogru < 0) return null;
    return { soru:metin, secenekler:sec, dogru, cozum:bosluk(s.cozum).slice(0, 2000) || null,
      zorluk:ZORLUKLAR.indexOf(s.zorluk) >= 0 ? s.zorluk : 'belirsiz' };
  }

  /* Kitabı üreten işin maliyeti HKM'nin ÖLÇÜMÜDÜR (depo.kayit_depo);
     AYS hesaplamaz. Ölçüm yoksa «veri yok» kalır, sıfır yazılmaz. */
  function maliyetOku(m){
    if(!m || typeof m !== 'object') return null;
    const usd = typeof m.usd === 'number' && isFinite(m.usd) && m.usd >= 0 ? m.usd : null;
    const cagri = Number.isInteger(m.cagri) && m.cagri >= 0 ? m.cagri : null;
    const etiket = ['olculdu', 'tahmin'].indexOf(m.etiket) >= 0 && usd != null ? m.etiket : 'veri_yok';
    return { usd:etiket === 'veri_yok' ? null : usd, cagri, etiket };
  }

  function kayittan(kayit){
    const g = kayit && kayit.govde;
    if(!kayit || kayit.tur !== 'materyal' || !g || g.tur !== 'kitap'){
      return { ok:false, why:'Kayıt bir test kitabı değil.' };
    }
    const kid = Number(kayit.id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, why:'Kayıt kimliği geçersiz.' };
    let dusen = 0;
    const bolumler = [];
    (Array.isArray(g.bolumler) ? g.bolumler : []).slice(0, SINIR.bolum).forEach(b => {
      const ad = bosluk(b && b.ad).slice(0, 80);
      const ham = Array.isArray(b && b.sorular) ? b.sorular.slice(0, SINIR.soruBolum) : [];
      const sorular = ham.map(soruTemizle).filter(Boolean);
      dusen += ham.length - sorular.length;
      if(ad.length >= 2 && sorular.length) bolumler.push({ no:bolumler.length + 1, ad, sorular });
    });
    if(!bolumler.length) return { ok:false, why:'Kitabın hiçbir sorusu AYS’nin denetimini geçmedi.' };
    return { ok:true, kitap:{ id:'kitap-' + kid, kayitId:kid,
      baslik:bosluk(g.baslik || kayit.baslik).slice(0, 120) || 'Test kitabı',
      dogruluk:kayit.dogruluk === 'kaynakli' ? 'kaynakli' : 'dogrulanmadi',
      bolumler, sonuclar:{}, hatali:[], eklenme:R.U.todayISO(), dusen,
      maliyet:maliyetOku(kayit.maliyet) } };
  }

  /* ------------------------------------------------------------ depo */

  async function kaydet(k){
    R.S.testKitaplari = kitaplar().filter(x => x.id !== k.id).concat([k]);
    await R.Store.set('testkitabi/' + k.id, k);
    return k;
  }

  async function yukle(){
    const l = (await R.Store.list('testkitabi')) || [];
    R.S.testKitaplari = l.filter(k => k && typeof k.id === 'string' && Array.isArray(k.bolumler));
    oturum = null;
    let y = null;
    try{ y = await R.Store.get(YARIM); }catch(e){ y = null; }
    const b = y && bolumOf(bul(y.kitapId), Number(y.no));
    yarimK = b && Array.isArray(y.cevaplar) && y.cevaplar.length === b.sorular.length ? y : null;
  }

  function kalici(){
    const x = oturum ? { kitapId:oturum.kitapId, no:oturum.no, index:oturum.index,
      cevaplar:oturum.cevaplar.slice(), gecen_ms:Math.max(0, Date.now() - oturum.basla) } : null;
    yarimK = x;
    try{
      const p = x ? R.Store.set(YARIM, x) : R.Store.remove(YARIM);
      if(p && typeof p.catch === 'function') p.catch(() => {});
    }catch(e){ /* kalıcı yazım akışı bozmaz */ }
  }

  function yarim(){
    if(!yarimK || oturum) return null;
    const b = bolumOf(bul(yarimK.kitapId), yarimK.no);
    if(!b) return null;
    return { kitapId:yarimK.kitapId, no:yarimK.no, index:yarimK.index, toplam:b.sorular.length,
      cevapli:yarimK.cevaplar.filter(x => x != null).length };
  }

  function devam(){
    const y = yarim();
    if(!y) return { ok:false, why:'Yarım kalmış bir bölüm yok.' };
    oturum = { kitapId:yarimK.kitapId, no:yarimK.no, index:yarimK.index,
      cevaplar:yarimK.cevaplar.slice(), basla:Date.now() - (Number(yarimK.gecen_ms) || 0) };
    ozet = null;
    return { ok:true };
  }

  async function sil(id){
    if(!bul(id)) return { ok:false, why:'Kitap bulunamadı.' };
    if(oturum && oturum.kitapId === id){ oturum = null; kalici(); }
    if(yarimK && yarimK.kitapId === id){ yarimK = null; kalici(); }
    R.S.testKitaplari = kitaplar().filter(k => k.id !== id);
    await R.Store.remove('testkitabi/' + id);
    return { ok:true };
  }

  async function teklifUygula(p, cek){
    const kid = Number(p && p.kayit_id);
    if(!Number.isInteger(kid) || kid < 1) return { ok:false, error:'Kayıt kimliği geçersiz.' };
    if(kitaplar().some(k => k.kayitId === kid)) return { ok:false, error:'Bu kitap zaten eklenmiş.' };
    const kayit = await (cek || (async id => {
      const r = await R.SinavProfil.istek('/api/bam/kayit/' + id);
      const k = r.ok && r.govde ? r.govde.kayit || null : null;
      return k ? Object.assign({}, k, { maliyet:(r.govde.depo || {}).maliyet || null }) : null;
    }))(kid);
    if(!kayit) return { ok:false, error:'Kitap HKM’den alınamadı; HKM açıkken yeniden dene.' };
    const r = kayittan(kayit);
    if(!r.ok) return { ok:false, error:r.why };
    await kaydet(r.kitap);
    const soru = r.kitap.bolumler.reduce((a, b) => a + b.sorular.length, 0);
    return { ok:true, note:'«' + r.kitap.baslik + '» eklendi: ' + r.kitap.bolumler.length + ' bölüm, '
      + soru + ' soru. Sınama ekranında bölüm bölüm çözebilirsin. Kaynaksız; hatalı bulduğun '
      + 'soruyu işaretle, sonuca sayılmaz.' };
  }

  /* ------------------------------------------------------------ oturum */

  function baslat(kitapId, no){
    const b = bolumOf(bul(kitapId), Number(no));
    if(!b) return { ok:false, why:'Bölüm bulunamadı.' };
    oturum = { kitapId, no:b.no, index:0, cevaplar:b.sorular.map(() => null), basla:Date.now() };
    ozet = null;
    kalici();
    return { ok:true, toplam:b.sorular.length };
  }

  function aktif(){ return oturum; }

  function mevcut(){
    if(!oturum) return null;
    const k = bul(oturum.kitapId), b = bolumOf(k, oturum.no);
    if(!b) return null;
    return { kitap:k, bolum:b, index:oturum.index, toplam:b.sorular.length,
      soru:b.sorular[oturum.index], secili:oturum.cevaplar[oturum.index],
      cevaplar:oturum.cevaplar.slice(), cevapli:oturum.cevaplar.filter(x => x != null).length };
  }

  /* Aynı şıkka ikinci dokunuş seçimi kaldırır: boş bırakmak bir seçimdir. */
  function sec(i){
    if(!oturum || !(i >= 0 && i < 5)) return;
    oturum.cevaplar[oturum.index] = oturum.cevaplar[oturum.index] === i ? null : i;
    kalici();
  }

  function git(fark){
    const m = mevcut();
    if(!m) return;
    oturum.index = Math.max(0, Math.min(m.toplam - 1, oturum.index + fark));
    kalici();
  }

  /* Soruya atla (Part 8b): kitapta sayfa çevirir gibi. */
  function gitNo(i){
    const m = mevcut();
    if(!m || !(i >= 0 && i < m.toplam)) return;
    oturum.index = i;
    kalici();
  }

  function vazgec(){ oturum = null; kalici(); }

  function anahtar(no, i){ return no + '-' + i; }

  /* Sonuç ÖLÇÜMDÜR. Hatalı işaretli soru sayılmaz. */
  function hesapla(k, b, cevaplar){
    const z = {};
    ZORLUKLAR.forEach(x => { z[x] = { dogru:0, toplam:0 }; });
    let dogru = 0, yanlis = 0, bos = 0, sayilmayan = 0;
    b.sorular.forEach((s, i) => {
      if((k.hatali || []).indexOf(anahtar(b.no, i)) >= 0){ sayilmayan++; return; }
      const c = cevaplar[i];
      z[s.zorluk].toplam++;
      if(c == null) bos++;
      else if(c === s.dogru){ dogru++; z[s.zorluk].dogru++; }
      else yanlis++;
    });
    return { dogru, yanlis, bos, sayilmayan, zorluk:z };
  }

  async function bitir(){
    const m = mevcut();
    if(!m) return null;
    const h = hesapla(m.kitap, m.bolum, oturum.cevaplar);
    const sonuc = Object.assign({ tarih:R.U.todayISO(), toplam:m.toplam,
      sure_sn:Math.max(1, Math.round((Date.now() - oturum.basla) / 1000)),
      cevaplar:oturum.cevaplar.slice(), etiket:'olculdu' }, h);
    const sonuclar = Object.assign({}, m.kitap.sonuclar || {});
    sonuclar[m.bolum.no] = sonuc;
    await kaydet(Object.assign({}, m.kitap, { sonuclar }));
    ozet = { kitapId:m.kitap.id, no:m.bolum.no };
    oturum = null;
    kalici();
    return sonuc;
  }

  function sonOzet(){
    if(!ozet) return null;
    const k = bul(ozet.kitapId), b = bolumOf(k, ozet.no);
    const s = k && (k.sonuclar || {})[ozet.no];
    return b && s ? { kitap:k, bolum:b, sonuc:s } : null;
  }
  function ozetKapat(){ ozet = null; }

  /* Çözdüklerim (Part 8b): kayıtlı bir bölüm sonucunu yeniden gözden geçir. */
  function ozetAc(kitapId, no){
    const k = bul(kitapId);
    if(!k || !(k.sonuclar || {})[Number(no)]) return { ok:false, why:'Bu bölüm henüz çözülmedi.' };
    ozet = { kitapId, no:Number(no) };
    return { ok:true };
  }

  /* Kitabın kullanımı — HESAPLANDI: çözülen bölüm ve o bölümlerin soruları.
     Çözülmemiş bölüm sıfır doğru sayılmaz; yalnız «çözülmedi»dir. */
  function ilerleme(k){
    const b = (k && k.bolumler) || [];
    const cozulen = b.filter(x => (k.sonuclar || {})[x.no]);
    const soru = b.reduce((a, x) => a + x.sorular.length, 0);
    const cozulenSoru = cozulen.reduce((a, x) => a + x.sorular.length, 0);
    return { bolum:cozulen.length, toplamBolum:b.length, soru:cozulenSoru, toplamSoru:soru,
      yuzde:soru ? Math.round(100 * cozulenSoru / soru) : 0, etiket:'hesaplandi' };
  }

  /* Yanlışlar yanlış defterine (Part 7 madde 9). Yalnız YANLIŞ cevaplar
     (boş ve hatalı işaretli sorular hariç); aynı soru ikinci kez eklenmez.
     Hata ETİKETİ uydurulmaz: boş kalır, kullanıcı defterde seçer —
     etiketsiz kayıt hata dağılımına girmez (calc.js errorDistribution). */
  function yanlislar(kitapId, no){
    const k = bul(kitapId), b = bolumOf(k, Number(no));
    const s = k && (k.sonuclar || {})[Number(no)];
    if(!b || !s) return [];
    return b.sorular.map((q, i) => ({ q, i, c:(s.cevaplar || [])[i] }))
      .filter(x => x.c != null && x.c !== x.q.dogru
        && (k.hatali || []).indexOf(anahtar(b.no, x.i)) < 0);
  }

  function deftereEklendi(kitapId, no, i){
    return (R.S.errors || []).some(e => e.kaynak && e.kaynak.tur === 'testkitabi'
      && e.kaynak.kitapId === kitapId && e.kaynak.no === Number(no) && e.kaynak.i === i);
  }

  async function yanlislariDeftere(kitapId, no){
    const k = bul(kitapId), b = bolumOf(k, Number(no));
    const s = k && (k.sonuclar || {})[Number(no)];
    if(!b || !s) return { ok:false, why:'Bu bölümün sonucu yok.' };
    const yeni = yanlislar(kitapId, no).filter(x => !deftereEklendi(kitapId, b.no, x.i));
    const ids = [];
    for(const x of yeni){
      const err = {
        id:R.U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null,
        examId:null, examDate:s.tarih || R.U.todayISO(), publisher:'BAM test kitabı',
        testName:(k.baslik + ' · ' + b.ad).slice(0, 160), questionNo:String(x.i + 1),
        status:'Yanlış', tag:null, seconds:null, rootCause:'', principle:'', similar:'',
        recipe:'', topicRef:'', subjectId:null, topicId:null,
        topic:(b.konular && b.konular[0]) || b.ad,
        soru:String(x.q.soru).slice(0, 600), senin:HARF[x.c], anahtar:HARF[x.q.dogru],
        kaynak:{ tur:'testkitabi', kitapId, no:b.no, i:x.i },
      };
      await R.Model.saveError(err);
      ids.push(err.id);
    }
    return { ok:true, eklenen:ids.length, ids,
      zaten:yanlislar(kitapId, no).length - ids.length };
  }

  async function defterdenGeriAl(ids){
    for(const id of ids || []) await R.Model.deleteError(id);
  }

  /* Hatalı soru: işaret açılıp kapanır; bölümün son sonucu yeniden sayılır. */
  async function hataliIsaretle(kitapId, no, i){
    const k = bul(kitapId), b = bolumOf(k, Number(no));
    if(!b || !(i >= 0 && i < b.sorular.length)) return { ok:false, why:'Soru bulunamadı.' };
    const a = anahtar(b.no, i);
    const hatali = (k.hatali || []).indexOf(a) >= 0 ? k.hatali.filter(x => x !== a)
      : (k.hatali || []).concat([a]);
    const yeni = Object.assign({}, k, { hatali });
    const s = (k.sonuclar || {})[b.no];
    if(s){
      yeni.sonuclar = Object.assign({}, k.sonuclar);
      yeni.sonuclar[b.no] = Object.assign({}, s, hesapla(yeni, b, s.cevaplar || []));
    }
    await kaydet(yeni);
    return { ok:true, hatali:hatali.indexOf(a) >= 0 };
  }

  /* ------------------------------------------------------------ sohbet

     «KPSS genel kültür test kitabı hazırla»: adı geçen profil bulunur.
     Profil yoksa kitap istenmez; önce müfredat istenir. */
  const TETIK = /test kitab/;

  async function sohbet(metin){
    const k = kucuk(metin);
    if(!TETIK.test(k) || !R.SinavProfil) return null;
    const l = R.SinavProfil.liste();
    const p = l.filter(x => x.kaynak !== 'yerlesik').find(x => k.indexOf(kucuk(x.ad)) >= 0)
      || (/\byks\b|\bsay\b/.test(k) ? l[0] : null);
    if(!p){
      return { text:'Hangi sınav için? Kayıtlı profiller: ' + l.map(x => x.ad).join(', ')
        + '. Başka bir sınavsa önce «… müfredatını çıkar» de; kitabı onun konularından kurarım.' };
    }
    return { text:(await iste(p.id)).metin };
  }

  return { ZORLUKLAR, VARSAYILAN, SINIR, kitaplar, bul, istekGovdesi, iste, kayittan,
    yukle, kaydet, sil, teklifUygula, baslat, aktif, mevcut, sec, git, gitNo, vazgec, bitir,
    yarim, devam,
    sonOzet, ozetKapat, ozetAc, ilerleme, yanlislar, yanlislariDeftere, defterdenGeriAl,
    hataliIsaretle, hesapla, sohbet, maliyetOku, HARF };
})();
