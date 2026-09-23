/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hedef.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* HEDEF MOTORU — herhangi bir hedefi alan genel çerçeve.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hedef.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   ==================================================================

   Motor örneklere göre değil, söylenebilecek HER hedef için kurulur.
   Alanı bilmez: alanı modülün PAKETİ bilir. Paket eklemek motoru
   değiştirmez. (ekip/PLAN.md §3.0)

   PAKET — modülün verdiği nesne:
     id, ad, olcut:{ ad, birim }, anahtar:RegExp, yonler:[…]
     birimler:RegExp?          miktarın yanındaki birim (yoksa anahtar)
     tani(metin, bugun)?       özel kalıp («VKİ'mi 24'e») — varsa önce o
     simdi(durum)?             şu anki değer, etiketiyle
     hiz(hedef, durum)?        { tipik, ust, birim, dayanak:{ metin, durum } }
     guvenlik(hedef, durum, s)? { red:true, neden } — bandı ezer
     ekSorular(hedef, durum)?  [{ alan, soru }]
     kapasiteGerekir?          true ise günlük vakit sorulur

   Sözler:
   1. KARARI KOD VERİR. Model yalnız anlatır (AGENTS.md §1.1).
   2. DAYANAĞI OLMAYAN EŞİĞİN KARARI «TAHMİN»DİR. Kaynaklı eşik
      «hesaplandı» olur; kaynağı beklenen eşik bunu saklamaz.
   3. KURALI OLMAYAN ALAN REDDEDİLMEZ. Karar veremediği söylenir;
      Araştırma Ofisi değerlendirme önerebilir.
   4. EKSİK SORULUR, TAHMİN EDİLMEZ (AGENTS.md §1.7).
   5. GÜVENLİK REDDİ BANDI EZER ama güvenli karşı teklif bırakır. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Hedef = (function(){
  const YONLER = { azalt:'azalt', artir:'artır', ulas:'ulaş', koru:'koru',
    seviye:'seviye', aliskanlik:'alışkanlık' };
  const DURUMLAR = ['taslak', 'aktif', 'askida', 'tamam', 'birakildi'];
  const GECISLER = { taslak:['aktif', 'birakildi'], aktif:['askida', 'tamam', 'birakildi'],
    askida:['aktif', 'birakildi'], tamam:[], birakildi:[] };
  const BANT_ADI = { gercekci:'gerçekçi', zorlayici:'zorlayıcı',
    gercekci_degil:'bu sürede gerçekçi değil', guvensiz:'güvenli değil' };

  /* ---------------------------------------------------------- yardımcılar */

  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function isoOku(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function isoYaz(d){ return d.toISOString().slice(0, 10); }
  function gunEkle(iso, n){
    const d = isoOku(iso); d.setUTCDate(d.getUTCDate() + n); return isoYaz(d);
  }
  function ayEkle(iso, n){
    const d = isoOku(iso);
    const gun = d.getUTCDate();
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
    const son = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(gun, son));
    return isoYaz(d);
  }
  function gunFarki(a, b){ return Math.round((isoOku(b) - isoOku(a)) / 86400000); }
  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }

  /* Sayı: rakam ya da yazı. «yarım», «bir buçuk», «on beş» de sayıdır. */
  const BIRLER = { bir:1, iki:2, 'üç':3, 'dört':4, 'beş':5, 'altı':6, yedi:7, sekiz:8, dokuz:9 };
  const ONLAR = { on:10, yirmi:20, otuz:30, 'kırk':40, elli:50 };
  const SAYI = '(\\d+(?:[.,]\\d+)?|yarım|(?:on|yirmi|otuz|kırk|elli)(?:\\s+(?:bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz))?'
    + '|(?:bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz)(?:\\s+buçuk)?)';
  function sayiOku(t){
    const s = String(t || '').trim();
    if(/^\d/.test(s)) return Number(s.replace(',', '.'));
    if(s === 'yarım') return 0.5;
    const p = s.split(/\s+/);
    if(ONLAR[p[0]] != null) return ONLAR[p[0]] + (BIRLER[p[1]] || 0);
    if(BIRLER[p[0]] != null) return BIRLER[p[0]] + (p[1] === 'buçuk' ? 0.5 : 0);
    return null;
  }

  /* --------------------------------------------------- tarih ve kapasite */

  const AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos',
    'eylül', 'ekim', 'kasım', 'aralık'];

  /* Kapasite: «günde yarım saat», «günde 45 dakika», «haftada 4 gün».
     Eşleşen parça metinden SİLİNİR ki «4 gün» süre sanılmasın. */
  function kapasiteAyikla(k, cevapMi){
    const out = {};
    let kalan = k;
    const gun = new RegExp((cevapMi ? '(?:günde\\s+)?' : 'günde\\s+') + SAYI + '\\s*(dk|dakika|saat)');
    const g = gun.exec(kalan);
    if(g){
      const n = sayiOku(g[1]);
      if(n != null) out.gunluk_dk = Math.round(g[2] === 'saat' ? n * 60 : n);
      kalan = kalan.replace(g[0], ' ');
    }
    const h = new RegExp('haftada\\s+' + SAYI + '\\s*gün').exec(kalan);
    if(h){
      const n = sayiOku(h[1]);
      if(n != null && n >= 1 && n <= 7) out.haftalik_gun = n;
      kalan = kalan.replace(h[0], ' ');
    }
    return { kapasite:Object.keys(out).length ? out : null, kalan };
  }

  function tarihAyikla(k, bugun){
    if(/yıl sonuna kadar/.test(k)) return bugun.slice(0, 4) + '-12-31';
    if(/ay sonuna kadar/.test(k)){
      const d = isoOku(bugun);
      return isoYaz(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
    }
    const ad = new RegExp('(\\d{1,2})\\s+(' + AYLAR.join('|') + ')').exec(k);
    if(ad){
      const yil = Number(bugun.slice(0, 4));
      const ay = AYLAR.indexOf(ad[2]) + 1;
      let t = yil + '-' + String(ay).padStart(2, '0') + '-' + String(Number(ad[1])).padStart(2, '0');
      if(!isoOku(t)) return null;
      if(t <= bugun) t = (yil + 1) + t.slice(4);
      return t;
    }
    const s = new RegExp(SAYI + '\\s*(gün|hafta|ay|yıl)(?=da|de|ta|te|\\s+içinde|\\s+sonra|\\b)').exec(k);
    if(!s) return null;
    const n = sayiOku(s[1]);
    if(n == null || n <= 0) return null;
    if(s[2] === 'gün') return gunEkle(bugun, Math.round(n));
    if(s[2] === 'hafta') return gunEkle(bugun, Math.round(n * 7));
    if(s[2] === 'ay') return ayEkle(bugun, Math.round(n));
    return ayEkle(bugun, Math.round(n * 12));
  }

  /* ---------------------------------------------------------- tanıma */

  /* Hedef işareti olmayan cümle hedef değildir: «bugün 80 kiloyum»,
     «dün 3 kilo verdim» bir ölçüm ya da geçmiş cümlesidir. */
  const NIYET = /(istiyorum|isterim|hedefim|hedefliyorum|planlıyorum|niyetindeyim|amacım|olmak istiyorum)/;
  /* Kelime BAŞINDA aranır: «kalmak» içindeki «almak» artırma değildir. */
  const BAS = '(?:^|[^a-zçğıöşü])';
  const AZALT = new RegExp(BAS + '(vermek|vermeyi|ver(?![a-zçğıöşü])|düşür|azalt|zayıfla|inmek|inmeyi|indir)');
  const ARTIR = new RegExp(BAS + '(almak|almayı|al(?![a-zçğıöşü])|artır|arttır|kazan|çıkmak|çıkarmak|yüksel)');

  /* Türkçe eklemeli bir dildir: «kilo», «kiloya», «kilomu» aynı kelimedir.
     Anahtarın yalnız BAŞI sabitlenir; sonundaki \b atılır. */
  function eksiz(re){ return new RegExp(re.source.replace(/\\b$/, ''), re.flags); }
  function paketBul(k, paketler){
    return (paketler || []).find(p => p.anahtar && eksiz(p.anahtar).test(k)) || null;
  }

  function cumleden(metin, paketler, bugun){
    const k = kucuk(metin).trim();
    if(!k || !NIYET.test(k)) return null;
    const paket = paketBul(k, paketler);
    if(!paket) return null;
    if(typeof paket.tani === 'function'){
      const ozel = paket.tani(k, bugun);
      if(ozel) return Object.assign({ paket:paket.id, cumle:String(metin).trim() }, ozel);
    }
    const ka = kapasiteAyikla(k, false);
    const k2 = ka.kalan;
    const birim = paket.birimler || new RegExp(paket.anahtar.source.replace(/\\b/g, ''));
    const miktar = new RegExp(SAYI + '\\s*(?:' + birim.source + ')([a-zçğıöşü\']*)').exec(k2);
    let yon = null, egilim = null, fark = null, hedefDeger = null;
    if(AZALT.test(k2)) egilim = 'azalt';
    else if(ARTIR.test(k2)) egilim = 'artir';
    if(miktar){
      const n = sayiOku(miktar[1]);
      const ek = miktar[miktar.length - 1] || '';
      /* «80 kiloya», «24'e»: yönelme eki hedef DEĞERİ anlatır. */
      if(/^'?y?[ae]$/.test(ek)){ yon = 'ulas'; hedefDeger = n; }
      else fark = n;
    }
    if(!yon) yon = egilim || (paket.yonler && paket.yonler[0]) || 'artir';
    if(paket.yonler && paket.yonler.indexOf(yon) < 0) yon = paket.yonler[0];
    return { paket:paket.id, yon, egilim, fark, hedefDeger,
      birim:paket.olcut ? paket.olcut.birim : null,
      son_tarih:tarihAyikla(k2, bugun), kapasite:ka.kapasite, cumle:String(metin).trim() };
  }

  /* ------------------------------------------------------- hedef kaydı */

  function yeniId(){ return 'hd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function yeni(tani, modul, bugun){
    const t = tani || {};
    return {
      id:yeniId(), modul, paket:t.paket || null, yon:t.yon || null, egilim:t.egilim || null,
      cumle:t.cumle || '', fark:t.fark == null ? null : t.fark,
      hedefDeger:t.hedefDeger == null ? null : t.hedefDeger, birim:t.birim || null,
      son_tarih:t.son_tarih || null, kapasite:t.kapasite || null, simdi:null,
      kisitlar:[], cevaplar:{}, durum:'taslak', olusturma:bugun, guncelleme:bugun,
    };
  }

  function simdiOf(h, paket, durum){
    if(h.simdi) return h.simdi;
    return (paket && typeof paket.simdi === 'function') ? (paket.simdi(durum || {}) || null) : null;
  }

  /* ---------------------------------------------------- netleştirme */

  function eksikler(h, paket, durum){
    if(!paket) return [{ alan:'alan', soru:'Bu hedef hangi alanda? Biraz daha açar mısın?' }];
    const out = [];
    const olcut = (paket.olcut && paket.olcut.ad) || 'değer';
    if(['azalt', 'artir', 'ulas'].indexOf(h.yon) >= 0 && h.fark == null && h.hedefDeger == null){
      out.push({ alan:'hedef', soru:'Ne kadar? Sayıyla yazar mısın?' });
    }
    if(!h.son_tarih && h.yon !== 'koru'){
      out.push({ alan:'son_tarih',
        soru:'Ne zamana kadar? «3 ay içinde» ya da «31 Aralık’a kadar» gibi yazabilirsin.' });
    }
    if(!simdiOf(h, paket, durum) && h.yon !== 'aliskanlik'){
      out.push({ alan:'simdi', soru:'Şu anki ' + olcut + ' değerin ne? Bilmiyorsan «bilmiyorum» yaz.' });
    }
    if(paket.kapasiteGerekir && !(h.kapasite && h.kapasite.gunluk_dk)){
      out.push({ alan:'kapasite',
        soru:'Bu hedefe günde ne kadar vakit ayırabilirsin? «Günde 30 dakika» gibi yazabilirsin.' });
    }
    if(typeof paket.ekSorular === 'function'){
      (paket.ekSorular(h, durum || {}) || []).forEach(s => {
        if(s && s.alan && !(s.alan in (h.cevaplar || {}))) out.push(s);
      });
    }
    return out;
  }

  const BILMIYORUM = /(bilmiyorum|bilmem|ölçmedim|yok)/;

  function cevapla(h, alan, metin, bugun){
    const k = kucuk(metin).trim();
    const yeniH = Object.assign({}, h, { cevaplar:Object.assign({}, h.cevaplar),
      guncelleme:bugun });
    if(alan === 'son_tarih'){
      const t = tarihAyikla(k, bugun);
      if(!t || t <= bugun) return { ok:false, why:'Tarihi anlayamadım. «3 ay içinde» ya da «31 Aralık’a kadar» gibi yazabilirsin.' };
      yeniH.son_tarih = t;
    }else if(alan === 'kapasite'){
      const ka = kapasiteAyikla(k, true).kapasite;
      if(!ka || !ka.gunluk_dk) return { ok:false, why:'Vakti anlayamadım. «Günde 30 dakika» ya da «günde 1 saat» gibi yazabilirsin.' };
      yeniH.kapasite = Object.assign({}, h.kapasite || {}, ka);
    }else if(alan === 'simdi'){
      const m = new RegExp(SAYI).exec(k);
      if(m && sayiOku(m[1]) != null){
        yeniH.simdi = { deger:sayiOku(m[1]), birim:h.birim, etiket:'olculdu', tarih:bugun };
      }else if(BILMIYORUM.test(k)){
        yeniH.simdi = { deger:null, birim:h.birim, etiket:'veri_yok', tarih:bugun };
      }else{
        return { ok:false, why:'Değeri anlayamadım; sayıyla yaz ya da «bilmiyorum» de.' };
      }
    }else if(alan === 'hedef'){
      const m = new RegExp(SAYI).exec(k);
      const n = m ? sayiOku(m[1]) : null;
      if(n == null || n <= 0) return { ok:false, why:'Miktarı anlayamadım; sayıyla yazar mısın?' };
      if(h.yon === 'ulas') yeniH.hedefDeger = n; else yeniH.fark = n;
    }else{
      yeniH.cevaplar[alan] = String(metin || '').trim().slice(0, 1000);
    }
    return { ok:true, hedef:yeniH };
  }

  /* ---------------------------------------------------- gerçekçilik */

  function farkOf(h, simdi){
    if(h.fark != null) return { fark:Math.abs(h.fark) };
    if(h.hedefDeger == null || !simdi || simdi.deger == null) return { fark:null };
    const d = h.hedefDeger - simdi.deger;
    const istenen = h.yon === 'ulas' ? h.egilim : h.yon;
    if((istenen === 'azalt' && d > 0) || (istenen === 'artir' && d < 0)){
      return { hata:'Hedef değer yönle çelişiyor: şu an ' + simdi.deger + ', hedef ' + h.hedefDeger + '.' };
    }
    return { fark:Math.abs(d) };
  }

  function gerceklik(h, paket, durum, bugun){
    if(!paket || typeof paket.hiz !== 'function'){
      return { bant:null, etiket:'veri_yok',
        neden:'Bu alan için bir gerçekçilik kuralı yok; kod karar veremez. İstersen BAM '
          + 'araştırıp bir değerlendirme önerir, o da «tahmin» olarak gelir.' };
    }
    if(!h.son_tarih) return { bant:null, etiket:'veri_yok', neden:'Tarih olmadan hız hesaplanamaz.' };
    const gun = gunFarki(bugun, h.son_tarih);
    if(!(gun > 0)) return { bant:null, etiket:'veri_yok', hata:'Hedef tarihi geçmişte.' };
    const simdi = simdiOf(h, paket, durum);
    const f = farkOf(h, simdi);
    if(f.hata) return { bant:null, etiket:'veri_yok', hata:f.hata };
    if(f.fark == null){
      return { bant:null, etiket:'veri_yok',
        neden:'Şu anki değer bilinmeden gereken hız hesaplanamaz.' };
    }
    const hafta = gun / 7;
    const hz = paket.hiz(h, durum || {}) || {};
    if(!(hz.tipik > 0)){
      return { bant:null, etiket:'veri_yok',
        neden:hz.neden || 'Bu hedef için hız eşiği hesaplanamadı.' };
    }
    const gerekli = yuvarla(f.fark / hafta);
    const eps = 1e-9;
    let bant = gerekli <= hz.tipik + eps ? 'gercekci'
      : gerekli <= hz.ust + eps ? 'zorlayici' : 'gercekci_degil';
    const out = { bant, gerekli, fark:f.fark, hafta:yuvarla(hafta, 1), birim:hz.birim,
      tipik:hz.tipik, ust:hz.ust, dayanak:hz.dayanak || null,
      etiket:hz.dayanak && hz.dayanak.durum === 'kaynakli' ? 'hesaplandi' : 'tahmin' };
    const g = typeof paket.guvenlik === 'function'
      ? paket.guvenlik(h, durum || {}, { gerekli, fark:f.fark, hafta, simdi }) : null;
    if(g && g.red){ out.bant = 'guvensiz'; out.neden = g.neden; bant = 'guvensiz'; }
    if(bant !== 'gercekci' && hz.tipik > 0){
      out.karsi = { son_tarih:gunEkle(bugun, Math.ceil(f.fark / hz.tipik - eps) * 7),
        ulasilabilir:yuvarla(hz.tipik * hafta) };
    }
    return out;
  }

  /* İki tempo: tipik hız (rahat) ve üst sınır (zorlayıcı). Paketin kendi
     senaryosu varsa (ör. kapasiteye göre saat modeli) o kullanılır. */
  function senaryolar(h, paket, durum, bugun){
    if(paket && typeof paket.senaryolar === 'function') return paket.senaryolar(h, durum || {}, bugun);
    if(!paket || typeof paket.hiz !== 'function') return [];
    const f = farkOf(h, simdiOf(h, paket, durum));
    if(f.fark == null) return [];
    const hz = paket.hiz(h, durum || {}) || {};
    const out = [];
    if(hz.tipik > 0){
      out.push({ ad:'Rahat tempo (tipik hız)', hiz:hz.tipik, birim:hz.birim,
        son_tarih:gunEkle(bugun, Math.ceil(f.fark / hz.tipik - 1e-9) * 7) });
    }
    if(hz.ust > 0 && hz.ust !== hz.tipik){
      out.push({ ad:'Hızlı tempo (zorlayıcı)', hiz:hz.ust, birim:hz.birim,
        son_tarih:gunEkle(bugun, Math.ceil(f.fark / hz.ust - 1e-9) * 7) });
    }
    return out;
  }

  /* ------------------------------------------------------------ metin */

  const AY_ADI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos',
    'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function sayiYaz(x){ return String(yuvarla(x, 2)).replace('.', ','); }
  function tarihYaz(iso){
    const d = isoOku(iso);
    return d ? d.getUTCDate() + ' ' + AY_ADI[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : '';
  }
  function hizYaz(x, birim){
    const b = String(birim || '');
    return /\/hafta$/.test(b) ? 'haftada ' + sayiYaz(x) + ' ' + b.replace(/\/hafta$/, '')
      : sayiYaz(x) + ' ' + b;
  }

  /* Kararı cümleye çeviren KOD'dur; model değil. */
  function kararMetni(g){
    if(g.hata) return g.hata;
    if(g.bant == null) return g.neden;
    const k = hizYaz(g.gerekli, g.birim);
    const parca = {
      gercekci:'Bu hedef gerçekçi görünüyor: ' + k + ' gerekiyor; tipik tempo '
        + hizYaz(g.tipik, g.birim) + '.',
      zorlayici:'Bu hedef zorlayıcı: ' + k + ' gerekiyor; tipik tempo ' + hizYaz(g.tipik, g.birim)
        + ', üst sınır ' + hizYaz(g.ust, g.birim) + '.',
      gercekci_degil:'Bu hedef bu sürede gerçekçi değil: ' + k + ' gerekiyor, üst sınır '
        + hizYaz(g.ust, g.birim) + '.'
        + (g.karsi ? ' Bu tarihe kadar tipik tempoyla ' + sayiYaz(g.karsi.ulasilabilir) + ' '
          + String(g.birim || '').replace(/\/hafta$/, '') + ' mümkün.' : ''),
      guvensiz:'Bu hedef bu haliyle güvenli değil: ' + (g.neden || '') ,
    }[g.bant];
    return parca + ' Bu karar ' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmindir')
      + (g.dayanak ? ' (dayanak: ' + g.dayanak.metin + ')' : '') + '.';
  }

  /* ------------------------------------------------------------ sohbet

     `sohbetKur({ paketler, modul, durum:()=>…, bugun:()=>'YYYY-MM-DD',
       kaydet:async h=>…, normalize?(h, durum), notlar?(h, g, durum)=>[metin],
       sonrasi?(h)=>metin })` → { isle(metin) → {text, hedef} | null }

     Hedef cümlesi gelince eksik alanlar TEK TEK sorulur, sonra karar ve
     tempolar verilir, onayla hedef aktif olur. Hedef olmayan cümleye
     karışılmaz (null): modülün öteki kapıları işini yapar. */
  const EVET = /^(evet|tamam|olur|onaylıyorum|onayla|kaydet)$/;
  const VAZGEC = /^(vazgeç|vazgeçtim|hayır|iptal|boşver|bırak)$/;

  function sohbetKur(o){
    let bekleyen = null;
    const bugun = () => o.bugun();
    const durum = () => (o.durum ? o.durum() : {}) || {};
    const paketOf = h => (o.paketler || []).find(p => p.id === h.paket) || null;
    const normal = h => (typeof o.normalize === 'function' ? (o.normalize(h, durum()) || h) : h);

    async function kaydet(h){ if(o.kaydet) await o.kaydet(h); return h; }

    function guvenliSenaryolar(h, paket){
      return senaryolar(h, paket, durum(), bugun()).filter(x => {
        if(typeof paket.guvenlik !== 'function') return true;
        const g = paket.guvenlik(h, durum(), { gerekli:x.hiz, fark:null, hafta:null });
        return !(g && g.red);
      });
    }

    async function degerlendir(h){
      const paket = paketOf(h);
      const g = gerceklik(h, paket, durum(), bugun());
      const sen = (g.bant && g.bant !== 'gercekci') ? guvenliSenaryolar(h, paket) : [];
      const satir = [kararMetni(g)];
      if(sen.length){
        satir.push(sen.map((x, i) => (i + 1) + ') ' + x.ad + ': son tarih ' + tarihYaz(x.son_tarih)
          + ' (' + hizYaz(x.hiz, x.birim) + ')').join('\n'));
      }
      if(typeof o.notlar === 'function') (o.notlar(h, g, durum()) || []).forEach(n => n && satir.push(n));
      satir.push(g.bant === 'guvensiz'
        ? 'Bu tarihle kaydedemem. Bir tempo seç («1» ya da «2») ya da «vazgeç» de.'
        : g.bant === 'gercekci'
          ? 'Onaylıyor musun? «evet» dersen hedef aktif olur; «vazgeç» dersen bırakırım.'
          : g.bant == null
            ? 'Hedefi yine de kaydedeyim mi? «evet» ya da «vazgeç».'
            : 'Bir tempo seç («1» ya da «2»), ya da «evet» dersen kendi tarihinle kaydederim.');
      if(g.hata){
        bekleyen = null;
        return { text:g.hata + ' Hedefi yeniden yazabilirsin.', hedef:h };
      }
      bekleyen = { hedef:h, asama:'onay', senaryolar:sen, karar:g };
      return { text:satir.join('\n\n'), hedef:h };
    }

    async function sor(h){
      const e = eksikler(h, paketOf(h), durum());
      if(e.length){
        bekleyen = { hedef:h, asama:'soru', alan:e[0].alan };
        return { text:e[0].soru, hedef:h };
      }
      return await degerlendir(h);
    }

    async function birak(h){
      const r = gecis(h, 'birakildi', bugun());
      bekleyen = null;
      if(r.ok) await kaydet(r.hedef);
      return { text:'Tamam, bu hedefi bıraktım.', hedef:r.hedef || h };
    }

    async function onayla(metin){
      const b = bekleyen;
      let h = Object.assign({}, b.hedef);
      const k = kucuk(metin).trim().replace(/[.!]+$/, '');
      if(VAZGEC.test(k)) return await birak(h);
      const secim = /^\d$/.test(k) ? Number(k) : null;
      if(secim != null){
        const x = b.senaryolar[secim - 1];
        if(!x) return { text:'Böyle bir tempo yok; listedeki numaralardan birini yaz.', hedef:h };
        h.son_tarih = x.son_tarih;
      }else if(EVET.test(k)){
        if(b.karar.bant === 'guvensiz'){
          return { text:'Bu tarihle kaydedemem; güvenli bir tempo seç («1» ya da «2») ya da «vazgeç» de.',
            hedef:h };
        }
      }else{
        return null;
      }
      const g = gerceklik(h, paketOf(h), durum(), bugun());
      /* Kaydedilen karar SEÇİLEN tarihin kararıdır; kullanıcının ilk
         istediği hedefin kararı da ayrıca saklanır («3 haftada istedin,
         6 haftaya çektik» görünsün). */
      h.gerceklik = { bant:g.bant, gerekli:g.gerekli, tipik:g.tipik, ust:g.ust, birim:g.birim,
        etiket:g.etiket, dayanak:g.dayanak || null, tarih:bugun() };
      h.ilkKarar = b.karar.bant || null;
      const r = gecis(h, 'aktif', bugun());
      bekleyen = null;
      await kaydet(r.hedef);
      const son = typeof o.sonrasi === 'function' ? o.sonrasi(r.hedef) : '';
      return { text:'Hedefin kaydedildi ve aktif' + (r.hedef.son_tarih ? ': son tarih '
        + tarihYaz(r.hedef.son_tarih) : '') + '.' + (son ? ' ' + son : ''), hedef:r.hedef };
    }

    async function isle(metin){
      const k = kucuk(metin).trim();
      if(bekleyen && bekleyen.asama === 'soru'){
        if(VAZGEC.test(k.replace(/[.!]+$/, ''))) return await birak(bekleyen.hedef);
        const r = cevapla(bekleyen.hedef, bekleyen.alan, metin, bugun());
        if(!r.ok) return { text:r.why, hedef:bekleyen.hedef };
        const h = normal(r.hedef);
        await kaydet(h);
        return await sor(h);
      }
      if(bekleyen && bekleyen.asama === 'onay'){
        const r = await onayla(metin);
        if(r) return r;
      }
      const t = cumleden(metin, o.paketler, bugun());
      if(!t) return null;
      const h = normal(yeni(t, o.modul, bugun()));
      await kaydet(h);
      return await sor(h);
    }

    return { isle, bekleyen:() => bekleyen, sifirla:() => { bekleyen = null; } };
  }

  /* ------------------------------------------------------- yaşam döngüsü */

  function gecis(h, yeniDurum, bugun){
    if(DURUMLAR.indexOf(yeniDurum) < 0) return { ok:false, why:'Bilinmeyen hedef durumu.' };
    if((GECISLER[h.durum] || []).indexOf(yeniDurum) < 0){
      return { ok:false, why:'Bu hedef «' + h.durum + '» durumunda; «' + yeniDurum + '» yapılamaz.' };
    }
    return { ok:true, hedef:Object.assign({}, h, { durum:yeniDurum, guncelleme:bugun }) };
  }

  return { YONLER, DURUMLAR, BANT_ADI, cumleden, yeni, eksikler, cevapla, gerceklik,
    senaryolar, gecis, kararMetni, sohbetKur, tarihYaz, sayiYaz, gunEkle, ayEkle, gunFarki };
})();
