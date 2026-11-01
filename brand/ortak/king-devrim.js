/* KING · devrim ve King 3.0: yasalar, günüm, derse çevir, Merkez sırası, öğretmen, K1 ekip, K2 beceriler.
   Parça 7/8; yükleme sırası: king.js, king-ses.js, king-kayit.js, king-gorunum.js, king-kart.js, king-arac.js, king-devrim.js, king-yol.js.
   Dosyalar arası ortak adlar ve ortak durum window.LIFEOS.KING_IC'tedir (KI.ad). */

(function(){
  'use strict';

  const KI = window.LIFEOS.KING_IC;

  /* ======================================================================
     DEVRİM (kullanıcı, 2026-10-22: «devrimsel bir şey»; belgeler/ekip/
     KING-DEVRIM.md). Üç yetenek, hepsinde sayıyı KOD üretir:
       1. Kişisel yasalar — modülün günlük ölçülerinden (kartlar.olcu)
          medyan bölmesi ve etki büyüklüğü; ilişki, neden değil.
       2. Günüm — modülün bugünkü maddeleri (kartlar.gun); şimdi, sırada,
          bitti; «Başlat» odak sayacını kurar. Yazma yok.
       3. Derse çevir — Merkez kaynaktan ders ve soru yazar; KOD her bölümün
          ve sorunun alıntısını kaynakta arar, bulamadığını atar.
     ====================================================================== */
  const YASA_RE = /(yasalarım|kişisel yasa|beni ne etkiliyor|bana ne iyi geliyor|neyin işe yaradığı)/;
  const YASA_GUN = 120, YASA_EN_AZ = 8, YASA_ETKI = 0.5;
  function gunGeri(n){
    const d = KI.ortam.simdi();
    const g = new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
    return g.getFullYear() + '-' + String(g.getMonth() + 1).padStart(2, '0') + '-' + String(g.getDate()).padStart(2, '0');
  }
  const ortalama = l => l.reduce((a, b) => a + b, 0) / l.length;
  function medyan(l){ const s = l.slice().sort((a, b) => a - b), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; }
  /* Saf: { var, yasalar:[{ a, b, gecikme, esik, ust, alt, nUst, nAlt, etki }] }. */
  function yasaHesapla(olcu){
    if(!olcu || !Array.isArray(olcu.liste) || typeof olcu.deger !== 'function' || olcu.liste.length < 2)
      return { var:false, neden:olcu && Array.isArray(olcu.liste) && olcu.liste.length === 1 ? 'tek-olcu' : 'olcu-yok' };
    const gunler = [];
    for(let i = 1; i <= YASA_GUN; i++) gunler.push(gunGeri(i));            // [0] dün, en eskisi sonda
    const seri = {};
    olcu.liste.forEach(x => {
      seri[x.id] = gunler.map(g => { let v = null; try{ v = olcu.deger(x.id, g); }catch(e){ v = null; } return typeof v === 'number' && isFinite(v) ? v : null; });
    });
    const out = [];
    olcu.liste.forEach(A => olcu.liste.forEach(B => {
      if(A.id === B.id) return;
      [0, 1].forEach(gecikme => {
        const ciftler = [];
        for(let k = gecikme; k < gunler.length; k++){
          const a = seri[A.id][k], b = seri[B.id][k - gecikme];       // gecikme 1: B, A'nın ertesi günü
          if(a != null && b != null) ciftler.push([a, b]);
        }
        if(ciftler.length < 2 * YASA_EN_AZ) return;
        const esik = medyan(ciftler.map(c => c[0]));
        const ust = ciftler.filter(c => c[0] > esik).map(c => c[1]), alt = ciftler.filter(c => c[0] < esik).map(c => c[1]);
        if(ust.length < YASA_EN_AZ || alt.length < YASA_EN_AZ) return;
        const mU = ortalama(ust), mA = ortalama(alt);
        const v = l => { const m = ortalama(l); return l.reduce((s, x) => s + (x - m) * (x - m), 0) / (l.length - 1); };
        const sd = Math.sqrt(((ust.length - 1) * v(ust) + (alt.length - 1) * v(alt)) / (ust.length + alt.length - 2));
        if(!(sd > 0)) return;
        const etki = (mU - mA) / sd;
        if(Math.abs(etki) < YASA_ETKI) return;
        out.push({ a:A, b:B, gecikme, esik, ust:mU, alt:mA, nUst:ust.length, nAlt:alt.length, etki });
      });
    }));
    out.sort((x, y) => Math.abs(y.etki) - Math.abs(x.etki));
    return { var:true, yasalar:out.slice(0, 6), gun:YASA_GUN };
  }
  const sayiYaz = (x, d) => (Math.round(x * Math.pow(10, d == null ? 1 : d)) / Math.pow(10, d == null ? 1 : d)).toLocaleString('tr-TR');
  const birimli = (x, b) => sayiYaz(x) + (b ? ' ' + b : '');
  function yasaCumlesi(y){
    return y.a.ad + ' ' + birimli(y.esik, y.a.birim) + ' üstündeyken' + (y.gecikme ? ' ertesi gün ' : ' ') + y.b.ad.toLocaleLowerCase('tr')
      + ' ortalama ' + birimli(Math.abs(y.ust - y.alt), y.b.birim) + (y.ust > y.alt ? ' daha yüksek' : ' daha düşük') + '.';
  }
  function yasaIsle(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar, ad = KI.MODUL_AD[KI.ayar && KI.ayar.modul] || 'Bu modül';
    const r = yasaHesapla(K && K.olcu);
    const capraz = KI.baglanti() ? [{ ad:'Modüller arası', is:'oner-metin:çapraz bulgu' }] : [];
    if(!r.var){
      KI.cipler = capraz.length ? capraz : null;
      KI.soyle(r.neden === 'tek-olcu' ? ad + '’de tek bir günlük ölçü var; yasa için en az iki ölçü gerekir.' + (capraz.length ? ' Modüller arası bulguyu Merkez’den getirebilirim.' : '')
        : ad + ' günlük ölçü vermiyor; kişisel yasa çıkaramam.');
      return { tur:'yasa', n:0 };
    }
    if(!r.yasalar.length){
      KI.cipler = capraz.length ? capraz : null;
      KI.soyle('Son ' + r.gun + ' günde ' + ad + '’nin ölçüleri arasında belirgin bir bağ yok (ya da her grupta en az ' + YASA_EN_AZ + ' gün yok). Ölçtükçe yeniden bakarım.');
      return { tur:'yasa', n:0 };
    }
    KI.cipler = capraz.length ? capraz : null;
    KI.soyle('Senin yasaların · ' + ad, null, null, null, { yasa:{ gun:r.gun, l:r.yasalar.map(y => ({
      cumle:yasaCumlesi(y), ust:y.ust, alt:y.alt, nUst:y.nUst, nAlt:y.nAlt, birim:y.b.birim, aAd:y.a.ad, bAd:y.b.ad,
      deney:y.a.ad + ' ' + (y.ust > y.alt ? 'artınca' : 'azalınca') + ' ' + y.b.ad.toLocaleLowerCase('tr') + ' iyileşir mi' })) } });
    return { tur:'yasa', n:r.yasalar.length };
  }
  function yasaHtml(m, n){
    const y = m.yasa;
    if(!y) return '';
    return '<div class="king__yasa" role="list" aria-label="Kişisel yasalar">' + y.l.map((x, i) => {
      const en = Math.max(Math.abs(x.ust), Math.abs(x.alt)) || 1;
      const cubuk = (deger, ad) => '<span class="king__yasa-cubuk"><small>' + KI.kac(ad) + '</small><i style="width:' + Math.max(4, Math.round(Math.abs(deger) / en * 100)) + '%"></i>'
        + '<b>' + KI.kac(birimli(deger, x.birim)) + '</b></span>';
      return '<div class="king__yasa-s" role="listitem"><p>' + KI.kac(x.cumle) + '</p>'
        + '<div class="king__yasa-cubuklar" role="img" aria-label="' + KI.kac(x.aAd + ' üstünde ' + x.nUst + ' gün ortalama ' + birimli(x.ust, x.birim) + ', altında ' + x.nAlt + ' gün ortalama ' + birimli(x.alt, x.birim)) + '">'
        + cubuk(x.ust, 'üstünde · ' + x.nUst + ' gün') + cubuk(x.alt, 'altında · ' + x.nAlt + ' gün') + '</div>'
        + '<div class="king__yasa-alt"><small>hesaplandı · ilişki, neden değil · son ' + y.gun + ' gün</small>'
        + '<button type="button" class="king__cip" data-king="yasa-deney:' + n + ':' + i + '">Deneye çevir</button></div></div>';
    }).join('') + '</div>';
  }

  const GUN_RE = /^(günüm|günümü (?:göster|kur|planla)|günü kur|bugün ne yapayım|bugünkü planım|günüm nasıl)\s*[?.!]*$/;
  const GUN_KAPAT_RE = /^(günü kapat|günü bitir|gün sonu)\s*[?.!]*$/;
  const GUN_DURUM = ['bitti', 'simdi', 'sirada', 'atlandi'];
  function gunIsle(metin, kapat){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar, ad = KI.MODUL_AD[KI.ayar && KI.ayar.modul] || 'Bu modül';
    let g = null;
    try{ g = K && typeof K.gun === 'function' ? K.gun() : null; }catch(e){ g = null; }
    const yazi = (v, k) => String(v == null ? '' : v).trim().slice(0, k);
    const ogeler = (g && Array.isArray(g.ogeler) ? g.ogeler : []).filter(x => x && x.ad).slice(0, 12).map(x => ({
      ad:yazi(x.ad, 80), alt:yazi(x.alt, 80), durum:GUN_DURUM.indexOf(x.durum) >= 0 ? x.durum : 'sirada',
      dk:typeof x.dk === 'number' && x.dk > 0 ? Math.round(x.dk) : null, route:x.route ? String(x.route) : null }));
    if(!ogeler.length){
      KI.soyle(g && g.not ? String(g.not) : ad + '’de bugün için planlanmış madde yok.');
      return { tur:'gun', n:0 };
    }
    let siradaki = ogeler.findIndex(x => x.durum === 'simdi');
    if(siradaki < 0) siradaki = ogeler.findIndex(x => x.durum === 'sirada');
    const bekleyenN = ogeler.filter(x => x.durum === 'sirada' || x.durum === 'simdi').length;
    const saat = KI.ortam.simdi().getHours();
    /* Uyarlama kuraldır: akşam çok madde bekliyorsa modülün sırasıyla öne alınacak tek madde. */
    const not = kapat ? (bekleyenN ? bekleyenN + ' madde kaldı; yarına kalırlar, modülün planı onları yeniden dağıtır.' : 'Bugünün bütün maddeleri tamam.')
      : saat >= 18 && bekleyenN >= 3 ? 'Akşam oldu ve ' + bekleyenN + ' madde bekliyor; önce «' + ogeler[siradaki].ad + '».' : (g && g.not ? yazi(g.not, 160) : '');
    if(kapat) KI.cipler = [{ ad:'Sesli özet', is:'oner-metin:sesli özet' }];
    KI.soyle(kapat ? 'Günün kapanışı · ' + ad : 'Bugün · ' + ad, null, null, null, { gun:{ ogeler, siradaki:kapat ? -1 : siradaki, not, modul:KI.ayar.modul } });
    return { tur:'gun', n:ogeler.length, siradaki };
  }
  const GUN_DURUM_AD = { bitti:'bitti', simdi:'şimdi', sirada:'sırada', atlandi:'atlandı' };
  function gunKartHtml(m, n){
    const g = m.gun;
    if(!g) return '';
    const bitti = g.ogeler.filter(x => x.durum === 'bitti').length;
    return '<div class="king__gunum">' + '<div class="king__ders-ilerleme">' + cubukHtml(Math.round(bitti * 100 / g.ogeler.length), bitti + ' / ' + g.ogeler.length + ' madde bitti')
      + '<small>' + bitti + ' / ' + g.ogeler.length + '</small></div>'
      + '<ol class="king__gunum-l">' + g.ogeler.map((x, i) => '<li class="king__gunum-s is-' + x.durum + (i === g.siradaki ? ' is-siradaki' : '') + '">'
        + '<i class="king__gunum-nokta" aria-hidden="true"></i><span class="king__gunum-ad"><b>' + KI.kac(x.ad) + '</b>'
        + (x.alt || x.dk ? '<small>' + KI.kac([x.alt, x.dk ? x.dk + ' dk' : ''].filter(Boolean).join(' · ')) + '</small>' : '') + '</span>'
        + '<span class="king__gunum-durum">' + (i === g.siradaki ? 'sıradaki' : GUN_DURUM_AD[x.durum]) + '</span>'
        + (i === g.siradaki ? '<span class="king__gunum-eylem"><button type="button" class="king__cip king__cip--ana" data-king="gun-baslat:' + n + ':' + i + '">Başlat</button>'
          + (x.route ? '<button type="button" class="king__cip" data-king="gun-ac:' + n + ':' + i + '">Modülde aç</button>' : '') + '</span>' : '')
        + '</li>').join('') + '</ol>'
      + (g.not ? '<p class="king__gunum-not">' + KI.kac(g.not) + '</p>' : '') + '</div>';
  }

  const DERSLER = 'lifeos.king.dersler';
  const DERSE_RE = /^(?:bunu |bu belgeyi |belgeyi |pdf'?i )?derse çevir\s*:?\s*([\s\S]*)$/;
  const KD_SORU_RE = /derslerimden (?:bir )?soru/;
  const KD_ARALIK = [1, 3, 7];
  KI.kaynakMetin = null;                          // son PDF'in ya da yapıştırılan metnin kendisi (saklanmaz)
  function kdDersler(){ const l = KI.ortam.depo.oku(DERSLER); return Array.isArray(l) ? l.filter(x => x && x.id && Array.isArray(x.bolumler)) : []; }
  function kdYaz(l){ KI.ortam.depo.yaz(DERSLER, l.slice(0, 20)); }
  const kdNorm = s => KI.kucuk(String(s || '')).replace(/[’'`´“”"«»]/g, '').replace(/\s+/g, ' ').trim();
  function kdDogrula(alinti, kaynakN){
    const a = kdNorm(alinti);
    return a.length >= 20 && a.length <= 500 && kaynakN.indexOf(a) >= 0;
  }
  function kdJson(metin){
    const s = String(metin || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
    if(i < 0 || j <= i) return null;
    try{ return JSON.parse(s.slice(i, j + 1)); }catch(e){ return null; }
  }
  /* Saf: modelin JSON'u + kaynak metin → doğrulanmış ders ya da { hata }. */
  function kdKur(j, kaynak, ad){
    const kn = kdNorm(kaynak);
    const yazi = (v, k) => String(v == null ? '' : v).trim().slice(0, k);
    if(!j || typeof j !== 'object') return { hata:'Merkez ders biçiminde cevap vermedi.' };
    const bolumler = (Array.isArray(j.bolumler) ? j.bolumler : []).filter(b => b && b.metin && kdDogrula(b.alinti, kn)).slice(0, 8)
      .map(b => ({ baslik:yazi(b.baslik, 100) || 'Bölüm', metin:yazi(b.metin, 1400), liste:[], dikkat:'', alinti:yazi(b.alinti, 500) }));
    const sorular = (Array.isArray(j.sorular) ? j.sorular : []).filter(q => q && q.soru && Array.isArray(q.secenekler)
      && q.secenekler.length >= 3 && q.secenekler.length <= 5 && 'ABCDE'.slice(0, q.secenekler.length).indexOf(String(q.dogru || '').toUpperCase()) >= 0
      && kdDogrula(q.alinti, kn)).slice(0, 10)
      .map(q => ({ soru:yazi(q.soru, 400), sec:q.secenekler.map(x => yazi(x, 160)), dogru:String(q.dogru).toUpperCase(), alinti:yazi(q.alinti, 500) }));
    const atilan = (Array.isArray(j.bolumler) ? j.bolumler.length : 0) - bolumler.length;
    if(bolumler.length < 2) return { hata:'Kaynakla doğrulanabilen bölüm çıkmadı (alıntılar metinde bulunamadı); ders kurmadım.' };
    return { ders:{ id:'kd' + KI.ortam.simdi().getTime(), baslik:yazi(j.baslik, 100) || ad, kaynak:yazi(ad, 120), zaman:KI.ortam.simdi().toISOString(),
      bolumler, sorular, tekrar:{} }, atilan };
  }
  function kdDersMesaji(d){
    return { id:d.id, baslik:d.baslik, alt:'Kaynak: ' + d.kaynak, giris:'', etiket:'Merkez yazdı · her bölüm kaynaktan alıntıyla doğrulandı',
      sorgu:'kd:' + d.id, soruVar:d.sorular.length > 0, acilir:false, bolumler:d.bolumler, adim:0, kd:true };
  }
  async function derseCevir(metin, kaynakAd){
    const kaynak = String(metin || '').trim();
    if(kaynak.length < 400){ KI.soyle('Derse çevirmek için en az bir paragraflık kaynak gerekir: bir PDF ver ya da «derse çevir:» deyip metni yapıştır.'); return { tur:'kd', n:0 }; }
    if(!KI.baglanti()){ KI.soyle('Dersi Merkez’deki model yazar, kod kaynağa karşı doğrular; Merkez bağlı değil.'); return { tur:'kd', n:0 }; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    KI.akis.push(bek); KI.ciz(false);
    const r = await KI.merkezeSor('Aşağıdaki KAYNAK METİN’den Türkçe kısa bir ders kur. YALNIZ JSON döndür, başka hiçbir şey yazma:\n'
      + '{"baslik":"…","bolumler":[{"baslik":"…","metin":"2-4 cümle anlatım","alinti":"kaynaktan AYNEN kopyalanmış bir cümle"}],'
      + '"sorular":[{"soru":"…","secenekler":["…","…","…","…"],"dogru":"A","alinti":"cevabın geçtiği cümle, kaynaktan AYNEN"}]}\n'
      + '3-6 bölüm, 3-6 soru. Her «alinti» kaynakta harfi harfine geçmeli; kaynakta olmayan bilgi ve sayı yazma.\n\nKAYNAK METİN:\n' + kaynak.slice(0, KI.PDF_METIN),
      bek, { araclar:false });
    KI.akis = KI.akis.filter(m => m !== bek);
    if(!r.ok){ KI.soyle('Merkez’e ulaşılamadı; ders kurulamadı.'); return { tur:'kd', n:0 }; }
    const k = kdKur(kdJson(r.text), kaynak, kaynakAd || 'yapıştırılan metin');
    if(k.hata){ KI.soyle(k.hata); return { tur:'kd', n:0 }; }
    kdYaz([k.ders].concat(kdDersler()));
    KI.cipler = k.ders.sorular.length ? [{ ad:'Bu dersten soru sor', is:'oner-metin:derslerimden soru sor' }] : null;
    KI.soyle(k.ders.baslik + ' · ders' + (k.atilan > 0 ? ' (' + k.atilan + ' bölüm kaynakta doğrulanamadığı için atıldı)' : ''), null, null, null, { ders:kdDersMesaji(k.ders) });
    return { tur:'kd', n:k.ders.bolumler.length, soru:k.ders.sorular.length };
  }
  /* Derslerden sıradaki soru: vadesi gelen (yanlış 1, doğru 3 ve 7 gün), yoksa hiç sorulmamış. */
  function kdSoru(dersId){
    const bugun = KI.bugunISO();
    const l = kdDersler().filter(d => !dersId || d.id === dersId);
    let sec = null;
    l.forEach(d => d.sorular.forEach((q, i) => {
      const tk = d.tekrar[i];
      const puan = tk ? (tk.bitti ? -1 : String(tk.sonraki) <= bugun ? 2 : -1) : 1;
      if(puan > 0 && (!sec || puan > sec.puan)) sec = { d, i, q, puan };
    }));
    if(!sec){ KI.soyle(l.length ? 'Derslerinde şu an sorulacak soru yok; vadesi gelince sorarım.' : 'Henüz dersin yok. Bir PDF ver ya da «derse çevir:» deyip metin yapıştır.'); return { tur:'kd-soru', n:0 }; }
    const soru = { id:'kd:' + sec.d.id + ':' + sec.i, konu:sec.d.baslik, soru:sec.q.soru, sec:sec.q.sec, kaynak:'Kaynak: ' + sec.d.kaynak, not:'', sorgu:'kd:' + sec.d.id };
    KI.soyle(sec.d.baslik + ' · soru', null, null, null, { soru });
    return { tur:'kd-soru', id:soru.id };
  }
  function kdCevapla(m, harf){
    const p = m.soru.id.split(':'), l = kdDersler(), d = l.find(x => x.id === p[1]), i = Number(p[2]), q = d && d.sorular[i];
    if(!q) return null;
    const isabet = harf === q.dogru, tk = d.tekrar[i];
    let not = '';
    if(!isabet){ d.tekrar[i] = { n:0, sonraki:gunIleri(KD_ARALIK[0]) }; not = 'Yarın bu soruyu yeniden soracağım.'; }
    else{
      const n = tk ? tk.n + 1 : 1;
      if(n >= KD_ARALIK.length){ d.tekrar[i] = { n, bitti:true }; not = 'Tekrarları tamamladın.'; }
      else{ d.tekrar[i] = { n, sonraki:gunIleri(KD_ARALIK[n]) }; not = KD_ARALIK[n] + ' gün sonra bir kez daha soracağım.'; }
    }
    kdYaz(l);
    m.soru.cevap = { harf, dogru:q.dogru, isabet, cozum:['Kaynakta: «' + q.alinti + '»'], not };
    return m.soru.cevap;
  }
  function gunIleri(n){
    const d = KI.ortam.simdi();
    const g = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    return g.getFullYear() + '-' + String(g.getMonth() + 1).padStart(2, '0') + '-' + String(g.getDate()).padStart(2, '0');
  }

  /* ---------- K4 (kullanıcı, 2026-10-22): MERKEZ SIRASI ve SESLİ ÖZET ----------
     Merkez'e ulaşılamadığında (telefon dışarıda) Merkez'e giden soru
     kaybolmaz: cihazda sıraya girer (lifeos.king.merkez-sira; TASINAN'da,
     modül değişse de taşınır). King açılınca, cihaz yeniden çevrimiçi olunca
     ve King açıkken dakikada bir yoklanır; Merkez'e ulaşınca sıra eskiden
     yeniye sorulur ve cevap sohbete «sıradan» diye düşer. Sırada en çok 20
     soru; 7 günden eskisi sorulmaz. Yalnız Merkez'e giden soru sıraya girer:
     yerel kuralla cevaplanan ve kayıt olan cümle girmez. Merkez hiç
     kurulmamışsa bekleyecek bir şey yoktur, sıra da yoktur.
     SESLİ ÖZET: «sesli özet», «günümü özetle» → modülün günlük cümleleri ve
     değeri olan kartları (sayıyı modül üretir, etiketiyle) sesli okunur,
     Kütüphane › Sesli özetler'de kalır (son 20). */
  const SIRA = 'lifeos.king.merkez-sira';
  const SIRA_EN_COK = 20, SIRA_GUN = 7;
  KI.siradanSoru = null; KI.siraCalisiyor = false; KI.siraSaat = null;
  function sira(){
    const l = KI.ortam.depo.oku(SIRA), sinir = KI.ortam.simdi().getTime() - SIRA_GUN * 864e5;
    return (Array.isArray(l) ? l : []).filter(x => x && x.metin && Date.parse(x.zaman) >= sinir);
  }
  function siraYaz(l){ if(l.length) KI.ortam.depo.yaz(SIRA, l.slice(-SIRA_EN_COK)); else KI.ortam.depo.sil(SIRA); }
  /* Sıradan sorulan yine ulaşamazsa başa geri döner, zamanı korunur. */
  function siraEkle(metin){
    const l = sira();
    if(KI.siradanSoru) l.unshift(KI.siradanSoru);
    else l.push({ metin:String(metin).trim(), zaman:KI.ortam.simdi().toISOString(), modul:KI.ayar && KI.ayar.modul });
    siraYaz(l);
    return sira().length;
  }
  async function siraBosalt(){
    if(KI.siraCalisiyor || !KI.acik || !KI.baglanti() || !sira().length) return 0;
    KI.siraCalisiyor = true;
    let n = 0;
    try{
      while(sira().length){
        const x = sira()[0];
        siraYaz(sira().slice(1));
        KI.siradanSoru = x;
        const r = await KI.isle(x.metin);
        KI.siradanSoru = null;
        if(r && r.tur === 'sira') break;                   // hâlâ ulaşılamıyor; başa döndü
        n++;
      }
    }finally{ KI.siraCalisiyor = false; KI.siradanSoru = null; }
    return n;
  }
  function siraPlanla(){
    if(KI.siraSaat){ try{ clearInterval(KI.siraSaat); }catch(e){ /* yok */ } KI.siraSaat = null; }
    if(typeof setInterval !== 'function' || !sira().length) return;
    KI.siraSaat = setInterval(() => { if(!KI.acik || !sira().length){ clearInterval(KI.siraSaat); KI.siraSaat = null; return; } siraBosalt(); }, 60000);
  }
  const SOZET = 'lifeos.king.sesli-ozet';
  const SOZET_RE = /(sesli özet|günü(?:mü)? özetle|özetimi (?:oku|söyle)|günün özetini (?:oku|söyle)|bana günümü anlat)/;
  function sozetler(){ const l = KI.ortam.depo.oku(SOZET); return Array.isArray(l) ? l.filter(x => x && Array.isArray(x.satirlar)) : []; }
  function sozetMetni(x){ return [(KI.MODUL_AD[x.modul] || '') + '’de ' + KI.tarihYaz(x.zaman)].concat(x.satirlar).join('. '); }
  function sesliOzet(metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar, ad = KI.MODUL_AD[KI.ayar && KI.ayar.modul] || 'Bu modül';
    let kart = [];
    try{ kart = (K && typeof K.istatistik === 'function' ? K.istatistik() : []) || []; }catch(e){ kart = []; }
    kart = kart.filter(x => x && x.ad).map(KI.kartTemiz).filter(x => x.deger != null).slice(0, 4);
    const satirlar = KI.ozetSatirlari().concat(kart.map(x => x.ad + ': ' + x.deger + (x.birim ? ' ' + x.birim : '') + ' (' + x.etiket + ')'));
    if(!satirlar.length){ KI.soyle(ad + ' için bugün özetlenecek bir şey yok.'); return { tur:'sesli-ozet', n:0 }; }
    const x = { zaman:KI.ortam.simdi().toISOString(), modul:KI.ayar.modul, satirlar };
    KI.ortam.depo.yaz(SOZET, [x].concat(sozetler()).slice(0, 20));
    KI.cipler = [{ ad:'Yeniden dinle', is:'sozet-dinle:0' }];
    const okunacak = !KI.sesleMi();
    KI.soyle(ad + '’de bugün:', satirlar);
    if(okunacak) KI.seslendir(sozetMetni(x));                 // yazı kipinde de: istenen şey sesli özet
    return { tur:'sesli-ozet', n:satirlar.length };
  }
  /* ---------- ÖĞRETMEN (kullanıcı, 2026-10-22: «King'i öğretmen yap») ----------
     «türevi anlat», «bana olasılığı öğret», «ders: paragraf» → modülün KENDİ
     anlatımı (kartlar.ders; AYS konu anlatımı, ESP öğrenme kartları) bölüm
     bölüm bir ders kartında. Metni King yazmaz, model çağrılmaz; modülün
     etiketi («elle yazıldı · doğrulanmadı») kartta durur. Sonunda «Anladım,
     soru sor» modülün bankasından o konunun sorusunu getirir (söz 32 yolu);
     yanlış cevapta «Konuyu yeniden anlat» önerilir, cevabı yine modül yazar
     (AYS'de yanlış soru 1, 3, 7 gün sonra tekrar gelir). Modülde konu yoksa
     ders kurulmaz ve mesaj olağan yoluna (Merkez) devam eder. */
  const DERS_RE = /(?:^|\s)(?:anlat(?:ır m[ıi]s[ıi]n|abilir misin|sana)?|öğret(?:ir misin|sene)?|ders(?:i)? (?:ver|yap|anlat)|konu anlatımı)\s*[?.!]*\s*$|^(?:ders|konu anlatımı)\s*:/;
  const DERS_DOLGU = /(^|\s)(bana|bir|biraz|kısaca|lütfen|king|konusunu|konusu|konu|ders|dersi|anlatımı|anlat\S*|öğret\S*|ver|yap|mısın|misin|musun|hakkında|bu|şu)(?=\s|$)/g;
  function dersNiyeti(t){
    if(!DERS_RE.test(t)) return null;
    const konu = t.replace(/[.,!?;:]/g, ' ').replace(DERS_DOLGU, ' ').replace(DERS_DOLGU, ' ').replace(/\s+/g, ' ').trim();
    if(konu.length < 3 || /^(bunu|şunu|onu|daha|bunları|onları|neden|niye)(\s|$)/.test(konu)) return null;
    return { konu };
  }
  async function dersIsle(n, metin){
    const K = KI.ayar && KI.ayar.kartlar;
    if(!K || typeof K.ders !== 'function') return null;
    let d = null;
    try{ d = await K.ders(n.konu); }catch(e){ d = null; }
    const yazi = (v, k) => String(v == null ? '' : v).trim().slice(0, k);
    const bolumler = d && Array.isArray(d.bolumler) ? d.bolumler.filter(b => b && (b.metin || (b.liste && b.liste.length))).slice(0, 10)
      .map(b => ({ baslik:yazi(b.baslik, 120), metin:yazi(b.metin, 1600), liste:(b.liste || []).slice(0, 10).map(x => yazi(x, 400)), dikkat:yazi(b.dikkat, 500) })) : [];
    if(!d || !d.baslik || !bolumler.length) return null;
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    const ders = { id:String(d.id || ''), baslik:yazi(d.baslik, 120), alt:yazi(d.alt, 120), giris:yazi(d.giris, 900),
      etiket:yazi(d.etiket, 80), sorgu:yazi(d.sorgu || d.baslik, 120), soruVar:!!d.soruVar && typeof K.soru === 'function',
      acilir:typeof K.dersAc === 'function', bolumler, adim:0 };
    KI.soyle(ders.baslik + ' · ders', null, null, null, { ders });
    return { tur:'ders', bolum:bolumler.length };
  }
  function dersHtml(m, n){
    const d = m.ders;
    if(!d) return '';
    const b = d.bolumler[d.adim] || d.bolumler[0], son = d.adim >= d.bolumler.length - 1;
    return '<div class="king__ders" role="group" aria-label="Ders: ' + KI.kac(d.baslik) + '">'
      + '<div class="king__ders-bas"><span>' + KI.kac(d.alt) + '</span>' + (d.etiket ? '<small>' + KI.kac(d.etiket) + '</small>' : '') + '</div>'
      + (d.adim === 0 && d.giris ? '<p class="king__ders-giris">' + KI.bicimli(d.giris) + '</p>' : '')
      + '<div class="king__ders-ilerleme">' + cubukHtml(Math.round((d.adim + 1) * 100 / d.bolumler.length), 'Bölüm ' + (d.adim + 1) + ' / ' + d.bolumler.length)
      + '<small>' + (d.adim + 1) + ' / ' + d.bolumler.length + '</small></div>'
      + '<h4 class="king__ders-baslik">' + KI.kac(b.baslik) + '</h4>'
      + (b.metin ? '<p>' + KI.bicimli(b.metin) + '</p>' : '')
      + (b.liste.length ? '<ul class="king__ders-liste">' + b.liste.map(x => '<li>' + KI.bicimli(x) + '</li>').join('') + '</ul>' : '')
      + (b.dikkat ? '<p class="king__ders-dikkat"><b>Dikkat</b> ' + KI.bicimli(b.dikkat) + '</p>' : '')
      + (b.alinti ? '<p class="king__ders-alinti"><b>Kaynakta</b> «' + KI.kac(b.alinti) + '»</p>' : '')
      + '<div class="king__ders-eylem">'
      + (d.adim > 0 ? '<button type="button" class="king__cip" data-king="ders-geri:' + n + '">Önceki</button>' : '')
      + (!son ? '<button type="button" class="king__cip' + (son ? '' : ' king__cip--ana') + '" data-king="ders-ileri:' + n + '">Devam</button>' : '')
      + (d.soruVar ? '<button type="button" class="king__cip' + (son ? ' king__cip--ana' : '') + '" data-king="ders-soru:' + n + '">Anladım, soru sor</button>' : '')
      + (KI.ortam.sentez() ? '<button type="button" class="king__cip" data-king="ders-dinle:' + n + '">Dinle</button>' : '')
      + (d.acilir ? '<button type="button" class="king__cip" data-king="ders-ac:' + n + '">Modülde aç</button>' : '')
      + '</div></div>';
  }
  function dersAdim(n, fark){
    const m = KI.akis[n];
    if(!m || !m.ders) return false;
    m.ders.adim = Math.max(0, Math.min(m.ders.bolumler.length - 1, m.ders.adim + fark));
    KI.sakla();
    KI.ciz(false);
    return true;
  }
  /* Yanlış cevaptan sonra: aynı konunun en son dersi yeniden, ilk bölümden. */
  function dersBul(sorgu){
    const s = KI.kucuk(sorgu || '');
    for(let i = KI.akis.length - 1; i >= 0; i--) if(KI.akis[i].ders && s && KI.kucuk(KI.akis[i].ders.sorgu) === s) return i;
    return -1;
  }
  function dersTekrar(n){
    const m = KI.akis[n];
    if(!m || !m.ders) return false;
    KI.cipler = null;
    KI.soyle('Bir daha bakalım: ' + m.ders.baslik, null, null, null, { ders:Object.assign({}, m.ders, { adim:0 }) });
    return true;
  }

  /* Modülün tek çağrısı (app.js, model yüklendikten sonra). Başka bir
     modülden King'le gelindiyse (#king=rota[:sekme]) oraya gidilir. */
  /* ------------------------------------------------------- King 3.0 K1: ekip, işler, görevler */
  /* Veri HKM'den gelir (/api/king/isler, /api/king/gorevler; belgeler/ekip/KING-EKIP.md).
     Sayıyı ve durumu HKM'nin kodu yazar; burada yalnız çizilir. Yoklama yalnız
     King açıkken: açık iş varken 5 sn'de, yokken 20 sn'de bir; King kapalıyken hiç. */
  const AJAN_AD = { akademik:'Akademik', beden:'Beden', zihin:'Zihin', arastirmaci:'Araştırmacı' };
  const ACIK_IS = ['bekliyor', 'calisiyor'];
  KI.isDurum = null;                 // HKM'nin ekran satırı ({ acik, metin, … }); boşken null
  KI.isZaman = null;                 // sonraki yoklamanın zamanlayıcısı
  KI.izlenen = {};                   // açık görülen işler: id → true (bitince haber verilir)
  KI.ekip = { isler:[], gorevler:[], yuklu:false };
  KI.gorevIptalOnay = null;          // iptali sorulan görevin kimliği
  async function kingIstek(yol, yontem){
    const k = KI.baglanti();
    if(!k) return null;
    try{
      const o = { headers:{ 'Authorization':'Bearer ' + k.token } };
      if(yontem === 'POST'){ o.method = 'POST'; o.headers['Content-Type'] = 'application/json'; o.body = '{}'; }
      const res = await KI.ortam.fetch(k.url + yol, o);
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { status:res.status, g };
    }catch(e){ return null; }
  }
  function isAjanAd(i){ return (i && i.sonuc && i.sonuc.ad) || AJAN_AD[i && i.ajan] || 'Ekip'; }
  /* Biten işin kısa haberi: sohbet akışına King'in sözü (okunmaz), uygulama
     arkadaysa sistem bildirimi. İptal edilen iş haber edilmez (kullanıcı yaptı). */
  function isBitti(i){
    if(i.durum === 'iptal') return;
    const ad = isAjanAd(i), ozet = String((i.sonuc && i.sonuc.ozet) || '').trim();
    let metin;
    if(i.durum === 'hata') metin = '«' + i.baslik + '» yarıda kaldı (' + ad + ')' + (i.hata ? ': ' + i.hata : '.');
    else if(i.tur === 'gorev_adim') metin = 'Görev adımı bitti: «' + i.baslik + '» (' + ad + ').' + (ozet ? '\n' + ozet : '');
    else metin = ad + ' raporu (iş #' + i.id + '): ' + (ozet || 'rapor boş geldi.');
    const kaynak = (i.sonuc && Array.isArray(i.sonuc.kaynaklar) ? i.sonuc.kaynaklar : [])
      .filter(x => x && KI.LINK_RE.test(String(x.url || ''))).slice(0, 5);
    if(kaynak.length) metin += '\n' + kaynak.map(x => '• ' + String(x.baslik || x.url).replace(/\s+/g, ' ').slice(0, 90) + ' ' + x.url).join('\n');
    if(i.sonuc && i.sonuc.etiket) metin += '\n(' + i.sonuc.etiket + ')';
    KI.akis.forEach(m => { m.yeni = false; });
    KI.akis.push({ kim:'king', metin, yeni:true, bulgu:true });
    KI.akis = KI.akis.slice(-KI.GUNLUK_EN_COK);
    KI.sakla();
    if(KI.ortam.gizli()) KI.ortam.bildir('King', metin.split('\n')[0]);
  }
  async function isYokla(){
    if(KI.isZaman){ clearTimeout(KI.isZaman); KI.isZaman = null; }
    if(!KI.acik) return;
    const r = KI.baglanti() ? await kingIstek('/api/king/isler?limit=12') : null;
    if(!KI.acik) return;
    const v = r && r.status === 200 && r.g ? r.g : null;
    const isler = v && Array.isArray(v.isler) ? v.isler.filter(i => i && i.id != null) : null;
    const yeni = v && v.durum && v.durum.acik ? v.durum : null;
    let degisti = JSON.stringify(yeni) !== JSON.stringify(KI.isDurum);
    KI.isDurum = yeni;
    if(isler){
      isler.forEach(i => {
        if(ACIK_IS.indexOf(i.durum) >= 0) KI.izlenen[i.id] = true;
        else if(KI.izlenen[i.id]){ delete KI.izlenen[i.id]; isBitti(i); degisti = true; }
      });
      if(KI.menu === 'ekip' || KI.bolum === 'gorev'){ KI.ekip.isler = isler; degisti = true; }
    }
    if(KI.menu === 'ekip' || KI.bolum === 'gorev'){
      const gr = await kingIstek('/api/king/gorevler');
      if(gr && gr.status === 200 && gr.g && Array.isArray(gr.g.gorevler)){ KI.ekip.gorevler = gr.g.gorevler; KI.ekip.yuklu = true; }
      else if(KI.bolum === 'gorev' && KI.menu !== 'ekip'){ KI.ekip.yuklu = true; degisti = true; }
    }
    if(degisti && KI.acik) KI.ciz(false);
    /* K2: bekleyen mesajlar King açılınca ve dakikada bir. */
    if(KI.acik && KI.baglanti() && KI.ortam.simdi().getTime() - KI.bekleyenSon >= 55000) await bekleyenAl();
    isPlanla(KI.isDurum ? 5000 : 20000);
  }
  function isPlanla(ms){
    if(KI.isZaman) clearTimeout(KI.isZaman);
    KI.isZaman = KI.acik && KI.baglanti() && typeof setTimeout === 'function' ? setTimeout(isYokla, ms) : null;
  }
  async function ekipAc(){
    KI.gorevIptalOnay = null;
    KI.alanAc('ekip');
    await isYokla();
    KI.ekip.yuklu = true;
    if(KI.acik && KI.menu === 'ekip') KI.ciz(false);
  }
  async function isIptal(id){
    await kingIstek('/api/king/is/' + id + '/iptal', 'POST');
    await isYokla();
  }
  async function gorevEylem(id, eylem){
    KI.gorevIptalOnay = null;
    const r = await kingIstek('/api/king/gorev/' + id + '/' + eylem, 'POST');
    if(!r || r.status !== 200){ KI.soyle(eylem === 'onayla' ? 'Görevi başlatamadım; Merkez cevap vermedi.' : 'Görevi iptal edemedim; Merkez cevap vermedi.'); return; }
    KI.menu = 'ekip';
    await isYokla();
  }
  function isRozet(){
    if(!KI.isDurum || !(KI.isDurum.acik > 0)) return '';
    /* G: başlıkta kısa «2 iş»; cümlesi aria-label'da ve ipucunda. */
    return '<button type="button" class="king__is-rozet" data-king="ekip-ac" title="' + KI.kac(KI.isDurum.metin || '') + '" aria-label="King şu an '
      + KI.kac(KI.isDurum.acik) + ' iş yapıyor. İşleri göster"><i class="king__is-nabiz" aria-hidden="true"></i>' + KI.kac(KI.isDurum.acik) + ' iş</button>';
  }
  /* İnce ilerleme çubuğu (AGENTS §10): yüzde HKM'nin; sayı aria-label'da cümleyle. */
  function cubukHtml(yuzde, etiket){
    const y = Math.max(0, Math.min(100, Math.round(Number(yuzde) || 0)));
    return '<svg class="king__cubuk" viewBox="0 0 100 4" preserveAspectRatio="none" role="img" aria-label="' + KI.kac(etiket) + '">'
      + '<rect class="king__cubuk-zemin" width="100" height="4" rx="2"/>' + (y ? '<rect class="king__cubuk-dolu" width="' + y + '" height="4" rx="2"/>' : '') + '</svg>';
  }
  function isSatirHtml(i){
    const acikMi = ACIK_IS.indexOf(i.durum) >= 0;
    return '<li class="king__is is-' + KI.kac(i.durum) + '"><div class="king__is-ust"><b>' + KI.kac(i.baslik) + '</b>'
      + (acikMi ? '<button type="button" class="king__cip king__cip--tehlike" data-king="is-iptal:' + Number(i.id) + '">İptal</button>' : '') + '</div>'
      + '<small>' + KI.kac(isAjanAd(i)) + ' · ' + KI.kac(i.durum_ad || i.durum) + (acikMi && i.adim ? ' · ' + KI.kac(i.adim) : '') + '</small>'
      + (i.durum === 'calisiyor' ? cubukHtml(i.ilerleme, i.baslik + ': yüzde ' + (Number(i.ilerleme) || 0)) : '') + '</li>';
  }
  function gorevHtml(g){
    const adim = no => (g.adimlar || [])[no - 1];
    const il = g.ilerleme || {};
    const gunler = Array.isArray(g.gunler) ? g.gunler : [];
    /* Açık gün: bitmemiş adımı olan ilk gün; yalnız onun adımları adıyla yazılır. */
    const simdi = gunler.find(d => (d.adimlar || []).some(n => { const a = adim(n); return a && ['bitti', 'iptal'].indexOf(a.durum) < 0; }));
    const nokta = a => '<i class="king__adim-nokta is-' + KI.kac(a.durum) + '" title="' + KI.kac(a.baslik + ' · ' + a.ajan_ad + ' · ' + a.durum_ad) + '"></i>';
    const gunHtml = d => {
      const l = (d.adimlar || []).map(adim).filter(Boolean);
      return '<li class="king__gun' + (d === simdi ? ' is-simdi' : '') + '"><span class="king__gun-ad">' + KI.kac(d.gun_ad) + '</span>'
        + '<span class="king__gun-noktalar" role="img" aria-label="' + KI.kac(d.gun_ad) + ': ' + l.filter(a => a.durum === 'bitti').length + '/' + l.length + ' adım bitti">' + l.map(nokta).join('') + '</span>'
        + (d === simdi && g.durum !== 'iptal' ? '<ul class="king__adimlar">' + l.map(a => '<li class="is-' + KI.kac(a.durum) + '">' + nokta(a)
          + '<span>' + KI.kac(a.baslik) + '</span><small>' + KI.kac(a.ajan_ad) + ' · ' + KI.kac(a.durum_ad)
          + (a.durum === 'calisiyor' && a.ilerleme ? ' · %' + Number(a.ilerleme) : '') + '</small></li>').join('') + '</ul>' : '') + '</li>';
    };
    const id = Number(g.id);
    return '<section class="king__gorev is-' + KI.kac(g.durum) + '" aria-label="Görev: ' + KI.kac(g.hedef) + '">'
      + '<div class="king__gorev-bas"><b>' + KI.kac(g.hedef) + '</b><span>' + KI.kac(g.modul_ad) + ' · ' + KI.kac(g.ajan_ad) + ' · ' + KI.kac(g.durum_ad) + '</span></div>'
      + cubukHtml(il.yuzde, (il.bitti || 0) + '/' + (il.toplam || 0) + ' adım bitti')
      + '<small class="king__gorev-alt">' + (il.bitti || 0) + '/' + (il.toplam || 0) + ' adım · ' + (Number(g.gun_sayisi) || gunler.length) + ' gün'
      + (g.gunluk_dk ? ' · günde ' + Number(g.gunluk_dk) + ' dk' : '') + '</small>'
      + (gunler.length ? '<ol class="king__gunler">' + gunler.map(gunHtml).join('') + '</ol>' : '')
      + (g.teklif_sayisi > 0 ? '<p class="king__menu-not">' + Number(g.teklif_sayisi) + ' plan teklifi ' + KI.kac(g.modul_ad) + '’nin Onaylar ekranında onayını bekliyor; sen onaylamadan bir şey yazılmaz.</p>' : '')
      + (g.durum === 'taslak' ? '<div class="king__cipler"><button type="button" class="king__cip king__cip--ana" data-king="gorev-onayla:' + id + '">Başlat</button>'
          + '<button type="button" class="king__cip" data-king="gorev-iptal:' + id + '">' + (KI.gorevIptalOnay === id ? 'Emin misin? Vazgeç' : 'Vazgeç') + '</button></div>'
        : g.durum === 'suruyor' ? '<div class="king__cipler"><button type="button" class="king__cip king__cip--tehlike" data-king="gorev-iptal:' + id + '">'
          + (KI.gorevIptalOnay === id ? 'Emin misin? İptal et' : 'İptal') + '</button></div>' : '')
      + '</section>';
  }
  function ekipHtml(){
    const sira = { suruyor:0, taslak:1, bitti:2, iptal:3 };
    const gorevler = KI.ekip.gorevler.slice().sort((a, b) => (sira[a.durum] - sira[b.durum]) || (b.id - a.id))
      .filter((g, i) => g.durum === 'suruyor' || g.durum === 'taslak' || i < 3);
    const isler = KI.ekip.isler.filter(i => i.tur !== 'gorev_adim' || ACIK_IS.indexOf(i.durum) >= 0).slice(0, 8);
    return '<div class="king__menu king__ekip" role="group" aria-label="Ekip ve görevler">'
      + (!KI.baglanti() ? '<p class="king__menu-bos">Ekip Merkez’de (HKM) çalışır; Merkez bağlı değil.</p>'
        : !KI.ekip.yuklu ? '<p class="king__menu-not" role="status">Yükleniyor…</p>'
        : '<h3 class="king__menu-bolum">Görevler</h3>'
          + (gorevler.length ? gorevler.map(gorevHtml).join('') : '<p class="king__menu-bos">Görev yok. «Bu hafta B1’e hazırla beni» gibi yazarsan King adım adım bir görev kurar; sen başlatmadan başlamaz.</p>')
          + '<h3 class="king__menu-bolum">İşler</h3>'
          + (isler.length ? '<ul class="king__isler">' + isler.map(isSatirHtml).join('') + '</ul>'
            : '<p class="king__menu-bos">Arka planda iş yok. «Arka planda … araştır» dersen ekibe veririm; sen konuşmaya devam edersin.</p>'))
      + '</div>';
  }

  /* ------------------------------------------------------- King 3.0 K2: beceriler, sözler, bekleyen */
  /* Veri HKM'den (belgeler/ekip/KING-BECERI.md). Tetiği, vadeyi ve eylemi HKM'nin
     kodu çıkarır; burada listelenir, açılıp kapanır, düzeltilir, silinir. Yazan
     eylem (kayıt, yazan araç) yine modülün onay kartından geçer. */
  const ODAK_SON = 'lifeos.king.odak-son';   // son biten odak sayacı { dk, konu, at }: «süreyi yaz» eylemi için
  const GUN_AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  KI.beceriV = { beceriler:[], sozler:[], yuklu:false, not:'' };
  KI.beceriDuzelt = null; KI.beceriSilOnay = null; KI.bekleyenSon = 0; KI.bekleyenArac = null;
  KI.k2Soru = 0;                     // King'in bekleyen sorusu ne zaman soruldu (0: yok)
  async function beceriTazele(){
    const [b, s] = await Promise.all([kingIstek('/api/king/beceriler'), kingIstek('/api/king/sozler')]);
    if(b && b.status === 200 && b.g && Array.isArray(b.g.beceriler)) KI.beceriV.beceriler = b.g.beceriler;
    if(s && s.status === 200 && s.g && Array.isArray(s.g.sozler)) KI.beceriV.sozler = s.g.sozler;
    KI.beceriV.yuklu = true;
    if(KI.acik && (KI.menu === 'beceri' || KI.bolum === 'rutin')) KI.ciz(false);
  }
  async function beceriAc(){
    KI.beceriDuzelt = null; KI.beceriSilOnay = null; KI.beceriV.not = '';
    KI.alanAc('beceri');
    await beceriTazele();
  }
  async function beceriEylem(yol, govde){
    const k = KI.baglanti();
    if(!k) return null;
    try{
      const res = await KI.ortam.fetch(k.url + yol, { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify(govde || {}) });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { status:res.status, g };
    }catch(e){ return null; }
  }
  async function beceriYap(id, eylem){
    KI.beceriSilOnay = null; KI.beceriV.not = '';
    const r = await beceriEylem('/api/king/beceriler/' + id + '/' + eylem);
    if(!r || r.status !== 200) KI.beceriV.not = 'Merkez cevap vermedi; değişmedi.';
    await beceriTazele();
  }
  async function sozSil(id, n){
    const r = await beceriEylem('/api/king/sozler/' + id + '/sil');
    const m = n != null ? KI.akis[n] : null;
    if(m && m.k2){ m.k2.bitti = r && r.status === 200 ? 'Söz silindi; sormayacağım.' : 'Söz silinemedi; Merkez cevap vermedi.'; KI.sakla(); }
    if(KI.menu === 'beceri' || KI.bolum === 'rutin') await beceriTazele(); else KI.ciz(false);
  }
  async function cevapGeri(id, n){
    const r = await beceriEylem('/api/king/bekleyen/' + id + '/geri');
    const m = KI.akis[n];
    if(m && m.k2) m.k2.bitti = r && r.status === 200 ? 'Tamam, cevap sayılmadı; soru açık.' : 'Geri alınamadı; Merkez cevap vermedi.';
    KI.ciz(false);
  }
  /* Düzelt: ad, (zaman tetiğinde) saat ve mesaj/soru cümleleri. Doğrulamayı HKM yapar. */
  async function beceriKaydet(id, f){
    const b = KI.beceriV.beceriler.find(x => x.id === id);
    if(!b) return;
    const deger = ad => { const el = f.querySelector('[name="' + ad + '"]'); return el ? String(el.value || '').trim() : ''; };
    const govde = {};
    if(deger('ad') && deger('ad') !== b.ad) govde.ad = deger('ad');
    if(b.tetik && b.tetik.tur === 'zaman' && /^\d{2}:\d{2}$/.test(deger('saat')) && deger('saat') !== b.tetik.saat) govde.tetik = Object.assign({}, b.tetik, { saat:deger('saat') });
    const el = (b.eylemler || []).map((e, i) => (e.tur === 'mesaj' || e.tur === 'soru') && deger('e' + i) ? Object.assign({}, e, { metin:deger('e' + i) }) : e);
    if(JSON.stringify(el) !== JSON.stringify(b.eylemler)) govde.eylemler = el;
    if(!Object.keys(govde).length){ KI.beceriDuzelt = null; KI.ciz(false); return; }
    const r = await beceriEylem('/api/king/beceriler/' + id, govde);
    if(r && r.status === 200){ KI.beceriDuzelt = null; KI.beceriV.not = ''; }
    else KI.beceriV.not = (r && r.g && (r.g.note || r.g.error)) || 'Merkez cevap vermedi; değişmedi.';
    await beceriTazele();
  }
  function tetikMetni(t){
    if(!t) return '';
    if(t.tur === 'soz') return '«' + t.kalip + '» deyince';
    const g = Array.isArray(t.gunler) ? t.gunler : [];
    return (g.length === 0 || g.length === 7 ? 'Her gün' : g.map(i => GUN_AD[i] || '').join(', ')) + ' · ' + (t.saat || '');
  }
  function beceriHtml(b){
    const id = Number(b.id), duzelt = KI.beceriDuzelt === id;
    const ust = '<div class="king__is-ust"><b>' + KI.kac(b.ad) + '</b>'
      + '<button type="button" class="king__secim" role="switch" aria-checked="' + (b.acik ? 'true' : 'false') + '" data-king="beceri-' + (b.acik ? 'kapat' : 'ac') + ':' + id
      + '" aria-label="' + KI.kac(b.ad) + (b.acik ? ' açık' : ' kapalı') + '"><span class="king__anahtar' + (b.acik ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></div>';
    if(duzelt) return '<li class="king__is king__beceri"><form class="king__beceri-form" data-king-beceri-form="' + id + '">'
      + '<input type="text" name="ad" aria-label="Becerinin adı" value="' + KI.kac(b.ad) + '" autocomplete="off" data-ayar-disi/>'
      + (b.tetik && b.tetik.tur === 'zaman' ? '<label>Saat <input type="time" name="saat" value="' + KI.kac(b.tetik.saat || '') + '" data-ayar-disi/></label>' : '')
      + (b.eylemler || []).map((e, i) => e.tur === 'mesaj' || e.tur === 'soru'
        ? '<input type="text" name="e' + i + '" aria-label="' + (e.tur === 'soru' ? 'Soru' : 'Mesaj') + '" value="' + KI.kac(e.metin) + '" autocomplete="off" data-ayar-disi/>' : '').join('')
      + '<div class="king__cipler"><button type="submit" class="king__cip king__cip--ana">Kaydet</button>'
      + '<button type="button" class="king__cip" data-king="beceri-duzelt:0">Vazgeç</button></div></form></li>';
    return '<li class="king__is king__beceri' + (b.acik ? '' : ' is-kapali') + '">' + ust
      + '<small>' + KI.kac(tetikMetni(b.tetik)) + (b.calisma ? ' · ' + Number(b.calisma) + ' kez çalıştı' : '') + '</small>'
      + '<p class="king__beceri-ozet">' + KI.kac(b.ozet || '') + '</p>'
      + '<div class="king__cipler"><button type="button" class="king__cip" data-king="beceri-duzelt:' + id + '">Düzelt</button>'
      + '<button type="button" class="king__cip king__cip--tehlike" data-king="beceri-sil:' + id + '">' + (KI.beceriSilOnay === id ? 'Emin misin? Sil' : 'Sil') + '</button></div></li>';
  }
  function sozHtml(s){
    const acikMi = s.durum === 'bekliyor' || s.durum === 'soruldu';
    return '<li class="king__is' + (acikMi ? '' : ' is-kapali') + '"><div class="king__is-ust"><b>' + KI.kac(s.metin) + '</b>'
      + (acikMi ? '<button type="button" class="king__cip king__cip--tehlike" data-king="soz-sil:' + Number(s.id) + '">Sil</button>' : '') + '</div>'
      + '<small>' + KI.kac(s.durum_ad || s.durum) + (s.vade_metin && acikMi ? ' · ' + KI.kac(s.vade_metin) : '') + '</small>'
      + (s.soru ? '<p class="king__beceri-ozet">' + KI.kac(s.soru) + (s.cevap ? ' → ' + KI.kac(typeof s.cevap === 'string' ? s.cevap : (s.cevap.metin || '')) : '') + '</p>' : '') + '</li>';
  }
  function beceriPanelHtml(){
    const sozler = KI.beceriV.sozler.filter(s => s.durum === 'bekliyor' || s.durum === 'soruldu')
      .concat(KI.beceriV.sozler.filter(s => s.durum === 'kapandi').slice(0, 3));
    return '<div class="king__menu king__ekip" role="group" aria-label="Beceriler ve sözler">'
      + (!KI.baglanti() ? '<p class="king__menu-bos">Beceriler ve sözler Merkez’de (HKM) durur; Merkez bağlı değil.</p>'
        : !KI.beceriV.yuklu ? '<p class="king__menu-not" role="status">Yükleniyor…</p>'
        : (KI.beceriV.not ? '<p class="king__menu-not" role="status">' + KI.kac(KI.beceriV.not) + '</p>' : '')
          + '<h3 class="king__menu-bolum">Beceriler</h3>'
          + (KI.beceriV.beceriler.length ? '<ul class="king__isler">' + KI.beceriV.beceriler.map(beceriHtml).join('') + '</ul>'
            : '<p class="king__menu-bos">Henüz beceri yok. «Her pazartesi bana deneme hatırlat» ya da «‘ders bitti’ deyince 5 dakikalık mola aç» diye öğretebilirsin.</p>')
          + '<h3 class="king__menu-bolum">Sözler</h3>'
          + (sozler.length ? '<ul class="king__isler">' + sozler.map(sozHtml).join('') + '</ul>'
            : '<p class="king__menu-bos">Açık söz yok. «Yarın fizik sınavım var» dersen zamanı gelince nasıl geçtiğini sorarım.</p>'))
      + '</div>';
  }
  /* King'in balonundaki K2 satırı: «söz aldım» / «cevap olarak not aldım» ve geri düğmesi. */
  function k2Html(m, n){
    const x = m.k2;
    if(!x) return '';
    if(x.bitti) return '<p class="king__k2" role="status">' + KI.kac(x.bitti) + '</p>';
    return '<p class="king__k2">' + KI.kac(x.not || '') + '</p>'
      + (x.soz_id != null || x.bekleyen_id != null ? '<div class="king__cipler">'
        + (x.soz_id != null ? '<button type="button" class="king__cip" data-king="k2-soz:' + Number(x.soz_id) + ':' + n + '">Söz yapma</button>' : '')
        + (x.bekleyen_id != null ? '<button type="button" class="king__cip" data-king="k2-cevap:' + Number(x.bekleyen_id) + ':' + n + '">Cevap değil</button>' : '')
        + '</div>' : '');
  }
  /* HKM cevabındaki K2 alanları (merkezeSor). Not metinden ayrılır, ayrı satırda durur. */
  function k2Oku(g){
    if(!g || !(g.k2_not || g.soz || g.cevap)) return null;
    return { not:String(g.k2_not || ''), soz_id:g.soz && g.soz.id != null ? g.soz.id : null,
      bekleyen_id:g.cevap && g.cevap.bekleyen_id != null ? g.cevap.bekleyen_id : null, kutuya:(g.cevap && g.cevap.kutuya) || null };
  }
  /* Beceri eylemleri (mesaj ve soru zaten metinde): sayaç açılır; kayıt ve yazan araç onay kartıyla. */
  async function eylemleriCalistir(l){
    for(const e of (Array.isArray(l) ? l : []).slice(0, 6)){
      if(!e || typeof e !== 'object') continue;
      if(e.tur === 'sayac'){ const dk = Math.round(Number(e.dakika)); if(dk >= 1 && dk <= 180) KI.odakBaslat(dk, String(e.ad || 'Sayaç')); }
      else if(e.tur === 'kayit') await eylemKayit(e);
      else if(e.tur === 'arac' && e.ad){
        const A = KI.ARAC(), d = A ? A.dogrula(e.ad, e.param || {}) : null;
        if(d && d.ok && d.arac.tur !== 'yaz' && e.yaz){
          KI.bekleyenArac = { ad:d.arac.ad, param:d.param };
          KI.soyle('Beceri «' + d.arac.ad + '» aracını çalıştırmak istiyor. Yapayım mı?');
          KI.cipler = [{ ad:'Yap', is:'beceri-arac' }, { ad:'Gerek yok', is:'vazgec' }];
          KI.ciz(false);
        }else await KI.aracIsle({ arac:[{ ad:e.ad, param:e.param || {} }] }, '');
      }
    }
  }
  async function eylemKayit(e){
    let metin = String(e.metin || '').trim();
    if(!metin || !KI.ayar) return;
    if(e.alan === 'sure'){
      const s = KI.ortam.depo.oku(ODAK_SON);
      if(s && s.dk && KI.ortam.simdi().getTime() - Number(s.at || 0) < 6 * 3600 * 1000) metin = s.dk + ' dk ' + metin;
      else { KI.soyle('«' + metin + '» için süreyi bilmiyorum (biten bir odak sayacı yok). Kaç dakika sürdü? «45 dk ' + metin + '» gibi yaz.'); return; }
    }
    const m = e.modul && KI.MODUL_AD[e.modul] ? e.modul : KI.ayar.modul;
    if(m !== KI.ayar.modul){
      const ok = await KI.kutuyaBirak(m, metin);
      KI.soyle(ok ? '«' + metin + '» ' + KI.MODUL_AD[m] + ' açılınca onayına sunulacak.' : '«' + metin + '» ' + KI.MODUL_AD[m] + '’ye iletilemedi; orada yazabilirsin.');
      return;
    }
    const veri = KI.veriKapisi();
    let p = null;
    if(veri) try{ p = veri.onizle(metin); }catch(er){ p = null; }
    if(!p || !p.metin){ KI.soyle('Beceri «' + metin + '» kaydını istedi ama anlayamadım; kendin yazabilirsin.'); return; }
    KI.bulunanGoster([KI.yeniOge({ modul:KI.ayar.modul, metin:String(p.metin), kaynak:metin }, p)], 'Beceri bir kayıt istiyor; onaylarsan yazılır:');
  }
  /* Bekleyen mesajlar: saati gelen beceri ve vadesi gelen söz. Alınan bir daha gelmez. */
  async function bekleyenAl(){
    KI.bekleyenSon = KI.ortam.simdi().getTime();
    if(!KI.ayar) return 0;
    const r = await kingIstek('/api/king/bekleyen?modul=' + KI.ayar.modul);
    const l = r && r.status === 200 && r.g && Array.isArray(r.g.mesajlar) ? r.g.mesajlar.filter(x => x && x.metin) : [];
    if(!l.length || !KI.acik) return 0;
    for(const x of l){
      KI.akis.forEach(m => { m.yeni = false; });
      KI.akis.push({ kim:'king', metin:String(x.metin), yeni:true });
      KI.akis = KI.akis.slice(-KI.GUNLUK_EN_COK);
      KI.sakla();
      KI.ciz(false);
      if(KI.ortam.gizli()) KI.ortam.bildir('King', String(x.metin));
      if(x.soru) KI.k2Soru = KI.ortam.simdi().getTime();
      await eylemleriCalistir((x.eylemler || []).filter(e => e && e.tur !== 'mesaj' && e.tur !== 'soru'));
    }
    return l.length;
  }

  Object.assign(KI, { YASA_RE, yasaHesapla, yasaIsle, yasaHtml, GUN_RE, GUN_KAPAT_RE, gunIsle, gunKartHtml, DERSLER, DERSE_RE, KD_SORU_RE, kdDersler, kdKur, kdDersMesaji, derseCevir, kdSoru, kdCevapla, SIRA, sira, siraYaz, siraEkle, siraBosalt, siraPlanla, SOZET, SOZET_RE, sozetler, sozetMetni, sesliOzet, dersNiyeti, dersIsle, dersHtml, dersAdim, dersBul, dersTekrar, ACIK_IS, isAjanAd, isYokla, isPlanla, ekipAc, isIptal, gorevEylem, isRozet, cubukHtml, gorevHtml, ekipHtml, ODAK_SON, beceriTazele, beceriAc, beceriYap, sozSil, cevapGeri, beceriKaydet, tetikMetni, beceriPanelHtml, k2Html, k2Oku, eylemleriCalistir, bekleyenAl });
})();
