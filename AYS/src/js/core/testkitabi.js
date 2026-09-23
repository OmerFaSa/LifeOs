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
      bolumler, sonuclar:{}, hatali:[], eklenme:R.U.todayISO(), dusen } };
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
  }

  async function sil(id){
    if(!bul(id)) return { ok:false, why:'Kitap bulunamadı.' };
    if(oturum && oturum.kitapId === id) oturum = null;
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
      return r.ok && r.govde ? r.govde.kayit || null : null;
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
    return { ok:true, toplam:b.sorular.length };
  }

  function aktif(){ return oturum; }

  function mevcut(){
    if(!oturum) return null;
    const k = bul(oturum.kitapId), b = bolumOf(k, oturum.no);
    if(!b) return null;
    return { kitap:k, bolum:b, index:oturum.index, toplam:b.sorular.length,
      soru:b.sorular[oturum.index], secili:oturum.cevaplar[oturum.index],
      cevapli:oturum.cevaplar.filter(x => x != null).length };
  }

  /* Aynı şıkka ikinci dokunuş seçimi kaldırır: boş bırakmak bir seçimdir. */
  function sec(i){
    if(!oturum || !(i >= 0 && i < 5)) return;
    oturum.cevaplar[oturum.index] = oturum.cevaplar[oturum.index] === i ? null : i;
  }

  function git(fark){
    const m = mevcut();
    if(!m) return;
    oturum.index = Math.max(0, Math.min(m.toplam - 1, oturum.index + fark));
  }

  function vazgec(){ oturum = null; }

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
    return sonuc;
  }

  function sonOzet(){
    if(!ozet) return null;
    const k = bul(ozet.kitapId), b = bolumOf(k, ozet.no);
    const s = k && (k.sonuclar || {})[ozet.no];
    return b && s ? { kitap:k, bolum:b, sonuc:s } : null;
  }
  function ozetKapat(){ ozet = null; }

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
    yukle, kaydet, sil, teklifUygula, baslat, aktif, mevcut, sec, git, vazgec, bitir,
    sonOzet, ozetKapat, hataliIsaretle, hesapla, sohbet, HARF };
})();
