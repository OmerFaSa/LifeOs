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
     simdi(durum, hedef)?      şu anki değer, etiketiyle
     simdiSoru?                şu anki değeri sormanın kendi cümlesi (metin ya da fn(h))
     simdiOku(metin, hedef)?   o cevabı okur → { deger, birim, etiket } | { hata } | null
     hiz(hedef, durum)?        { tipik, ust, birim, dayanak:{ metin, durum } }
     gerekenSaat(hedef, durum)? { saat, dayanak } — KAPASİTE MODELİ: hedefin
                               toplam kaç saat pratik istediği. Varsa karar
                               hızla değil kullanıcının VAKTİYLE verilir.
     haftalikEk(hedef, durum)? { saat, metin } — her hafta vaktinden SABİT düşen
                               iş (ör. deneme günü). Karar ve senaryolar
                               planla aynı hesabı yapsın diye.
     guvenlik(hedef, durum, s)? { red:true, neden } — bandı ezer
     ekSorular(hedef, durum)?  [{ alan, soru }]
     kapasiteGerekir?          true ise günlük vakit sorulur
     dogrula(hedef, durum)?    metin | null — hedef OLAMAZ (ör. TYT'de 130 net):
                               karar sorulmadan söylenir, «yine de kaydedeyim
                               mi?» denmez. Bilmediği alanda null döner.
     tarihSoru?                son tarihi sormanın kendi cümlesi (metin ya da fn(h))
     tarihOku(metin, h, bugun)? son tarih cevabını paket okur («sınava kadar»)
                               → 'YYYY-MM-DD' | null (null ise genel okuyucu)

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
    const ka = kapasiteAyikla(k, false);
    const k2 = ka.kalan;
    let yon = null, egilim = null, fark = null, hedefDeger = null;
    if(AZALT.test(k2)) egilim = 'azalt';
    else if(ARTIR.test(k2)) egilim = 'artir';
    /* Paketin özel kalıbı yalnız KENDİNE özgü alanı verir; tarih, vakit
       ve yön genel ayrıştırıcıdan tamamlanır. */
    if(typeof paket.tani === 'function'){
      const ozel = paket.tani(k2, bugun);
      if(ozel){
        return Object.assign({ paket:paket.id, yon:'ulas', egilim, fark:null, hedefDeger:null,
          birim:paket.olcut ? paket.olcut.birim : null, son_tarih:tarihAyikla(k2, bugun),
          kapasite:ka.kapasite, cumle:String(metin).trim() }, ozel);
      }
    }
    const birim = paket.birimler || new RegExp(paket.anahtar.source.replace(/\\b/g, ''));
    const miktar = new RegExp(SAYI + '\\s*(?:' + birim.source + ')([a-zçğıöşü\']*)').exec(k2);
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

  /* Paketin özel alanları (ör. `hedefVki`) korunur; ortak alanlar
     üstüne yazılır. */
  function yeni(tani, modul, bugun){
    const t = tani || {};
    return Object.assign({}, t, {
      id:yeniId(), modul, paket:t.paket || null, yon:t.yon || null, egilim:t.egilim || null,
      cumle:t.cumle || '', fark:t.fark == null ? null : t.fark,
      hedefDeger:t.hedefDeger == null ? null : t.hedefDeger, birim:t.birim || null,
      son_tarih:t.son_tarih || null, kapasite:t.kapasite || null, simdi:null,
      hedefHam:t.hedefHam || null,
      kisitlar:[], cevaplar:{}, durum:'taslak', olusturma:bugun, guncelleme:bugun,
    });
  }

  function simdiOf(h, paket, durum){
    if(h.simdi) return h.simdi;
    return (paket && typeof paket.simdi === 'function') ? (paket.simdi(durum || {}, h) || null) : null;
  }

  /* ---------------------------------------------------- netleştirme */

  function eksikler(h, paket, durum){
    if(!paket) return [{ alan:'alan', soru:'Bu hedef hangi alanda? Biraz daha açar mısın?' }];
    const out = [];
    const olcut = (paket.olcut && paket.olcut.ad) || 'değer';
    /* `hedefHam`: başka birimde verilmiş hedef («VKİ 24»); paket onu
       `normalize` ile çevirene kadar «ne kadar?» sorulmaz. */
    if(['azalt', 'artir', 'ulas'].indexOf(h.yon) >= 0 && h.fark == null && h.hedefDeger == null
      && h.hedefHam == null){
      out.push({ alan:'hedef', soru:'Ne kadar? Sayıyla yazar mısın?' });
    }
    if(!h.son_tarih && h.yon !== 'koru'){
      const ozel = typeof paket.tarihSoru === 'function' ? paket.tarihSoru(h) : paket.tarihSoru;
      out.push({ alan:'son_tarih',
        soru:ozel || 'Ne zamana kadar? «3 ay içinde» ya da «31 Aralık’a kadar» gibi yazabilirsin.' });
    }
    if(!simdiOf(h, paket, durum) && h.yon !== 'aliskanlik'){
      const ozel = typeof paket.simdiSoru === 'function' ? paket.simdiSoru(h) : paket.simdiSoru;
      out.push({ alan:'simdi', soru:ozel || ('Şu anki ' + olcut + ' değerin ne? Bilmiyorsan «bilmiyorum» yaz.') });
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

  /* `paket` verilirse şu anki değer paketin kendi okuyucusuyla okunur
     («B1», «hiç bilmiyorum» gibi sayı olmayan cevaplar). */
  function cevapla(h, alan, metin, bugun, paket){
    const k = kucuk(metin).trim();
    const yeniH = Object.assign({}, h, { cevaplar:Object.assign({}, h.cevaplar),
      guncelleme:bugun });
    if(alan === 'son_tarih'){
      const ozel = paket && typeof paket.tarihOku === 'function' ? paket.tarihOku(k, h, bugun) : null;
      const t = ozel || tarihAyikla(k, bugun);
      if(!t || t <= bugun) return { ok:false, why:'Tarihi anlayamadım. «3 ay içinde» ya da «31 Aralık’a kadar» gibi yazabilirsin.' };
      yeniH.son_tarih = t;
    }else if(alan === 'kapasite'){
      const ka = kapasiteAyikla(k, true).kapasite;
      if(!ka || !ka.gunluk_dk) return { ok:false, why:'Vakti anlayamadım. «Günde 30 dakika» ya da «günde 1 saat» gibi yazabilirsin.' };
      yeniH.kapasite = Object.assign({}, h.kapasite || {}, ka);
    }else if(alan === 'simdi' && paket && typeof paket.simdiOku === 'function'){
      const r = paket.simdiOku(metin, h);
      if(!r) return { ok:false, why:paket.simdiHata || 'Değeri anlayamadım; yeniden yazar mısın?' };
      if(r.hata) return { ok:false, why:r.hata };
      yeniH.simdi = Object.assign({ birim:h.birim, tarih:bugun }, r);
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

  /* KAPASİTE MODELİ. Dil, okuma, enstrüman gibi alanlarda karar bir hız
     bandından değil KULLANICININ VAKTİNDEN çıkar: hedef toplam kaç saat
     istiyor, sen haftada kaç saat veriyorsun. Haftalık vakit = günlük
     dakika × haftada gün (verilmediyse 7). Vaktinin 1,5 katına kadar
     «zorlayıcı»dır; ötesi bu sürede olmaz — ve bu vakitle hangi tarihte
     olacağı söylenir. Toplam saatin dayanağı paketindir; kaynaklı değilse
     karar «tahmin»dir. */
  const ZORLAYICI_KAT = 1.5;
  /* Kaynaklı eşik ya da kullanıcının KENDİ ÖLÇÜLMÜŞ verisi «hesaplandı»dır;
     kaynağı beklenen eşik ya da beyana dayanan veri «tahmin». */
  function hesaplandiMi(d){ return !!(d && (d.durum === 'kaynakli' || d.durum === 'olculdu')); }
  function haftalikSaat(kap){
    if(!kap || !(kap.gunluk_dk > 0)) return null;
    return yuvarla(kap.gunluk_dk * (kap.haftalik_gun || 7) / 60, 2);
  }

  function sabitYuk(h, paket, durum){
    const e = typeof paket.haftalikEk === 'function' ? (paket.haftalikEk(h, durum || {}) || {}) : {};
    return e.saat > 0 ? { saat:yuvarla(e.saat), metin:e.metin || '' } : null;
  }

  function kapasiteKarari(h, paket, durum, bugun){
    if(!h.son_tarih) return { bant:null, etiket:'veri_yok', neden:'Tarih olmadan hesaplanamaz.' };
    const gun = gunFarki(bugun, h.son_tarih);
    if(!(gun > 0)) return { bant:null, etiket:'veri_yok', hata:'Hedef tarihi geçmişte.' };
    const haftalik = haftalikSaat(h.kapasite);
    if(haftalik == null){
      return { bant:null, etiket:'veri_yok', neden:'Günde ne kadar vakit ayıracağın bilinmeden karar verilemez.' };
    }
    const g = paket.gerekenSaat(h, durum || {}) || {};
    if(!(g.saat > 0)) return { bant:null, etiket:'veri_yok', neden:g.neden || 'Gereken süre hesaplanamadı.' };
    const hafta = gun / 7;
    const ek = sabitYuk(h, paket, durum);
    const gerekli = yuvarla(g.saat / hafta + (ek ? ek.saat : 0));
    const eps = 1e-9;
    const bant = gerekli <= haftalik + eps ? 'gercekci'
      : gerekli <= haftalik * ZORLAYICI_KAT + eps ? 'zorlayici' : 'gercekci_degil';
    const out = { mod:'kapasite', bant, gerekli, saat:yuvarla(g.saat, 1), hafta:yuvarla(hafta, 1),
      birim:'saat/hafta', tipik:haftalik, ust:yuvarla(haftalik * ZORLAYICI_KAT), dayanak:g.dayanak || null,
      etiket:hesaplandiMi(g.dayanak) ? 'hesaplandi' : 'tahmin', ek };
    if(bant !== 'gercekci'){
      const etkili = haftalik - (ek ? ek.saat : 0);
      out.karsi = etkili > eps ? { son_tarih:gunEkle(bugun, Math.ceil(g.saat / etkili - eps) * 7),
        ulasilabilir:yuvarla(etkili * hafta, 1) } : null;
    }
    return out;
  }

  /* Kapasiteye göre senaryolar: günde 30 dakika, 1 saat ve kullanıcının
     kendi vakti — her birinde hedefin hangi tarihte olacağı. «Bu olmaz,
     şu olur» cümlesinin ikinci yarısı budur. */
  const KAPASITE_SENARYO = [30, 60];
  function kapasiteSenaryolari(h, paket, durum, bugun){
    const g = paket.gerekenSaat(h, durum || {}) || {};
    if(!(g.saat > 0)) return [];
    const ek = sabitYuk(h, paket, durum);
    const gunler = (h.kapasite && h.kapasite.haftalik_gun) || 7;
    const dkler = KAPASITE_SENARYO.slice();
    const kendi = h.kapasite && h.kapasite.gunluk_dk;
    if(kendi && dkler.indexOf(kendi) < 0) dkler.push(kendi);
    dkler.sort((a, b) => a - b);
    return dkler.map(dk => {
      const haftalik = yuvarla(dk * gunler / 60, 2);
      const etkili = haftalik - (ek ? ek.saat : 0);
      if(!(etkili > 1e-9)) return null;          // bu vakit sabit işe bile yetmiyor
      const ad = (dk % 60 === 0 ? 'Günde ' + (dk / 60) + ' saat' : 'Günde ' + dk + ' dakika')
        + (gunler < 7 ? ', haftada ' + gunler + ' gün' : '') + (dk === kendi ? ' (senin vaktin)' : '');
      return { ad, hiz:haftalik, birim:'saat/hafta', kapasite:{ gunluk_dk:dk },
        son_tarih:gunEkle(bugun, Math.ceil(g.saat / etkili - 1e-9) * 7) };
    }).filter(Boolean);
  }

  /* Olamayacak hedef (alanın kendi sınırı: TYT'de 120 netten fazlası,
     bütün konuları zaten kapanmış bir ders) bir BANT değil bir HATADIR. */
  function dogrulaOf(h, paket, durum){
    return (paket && typeof paket.dogrula === 'function') ? (paket.dogrula(h, durum || {}) || null) : null;
  }

  function gerceklik(h, paket, durum, bugun){
    const d = dogrulaOf(h, paket, durum);
    if(d) return { bant:null, etiket:'veri_yok', hata:d };
    if(paket && typeof paket.gerekenSaat === 'function') return kapasiteKarari(h, paket, durum, bugun);
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
      etiket:hesaplandiMi(hz.dayanak) ? 'hesaplandi' : 'tahmin' };
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
    if(paket && typeof paket.gerekenSaat === 'function') return kapasiteSenaryolari(h, paket, durum, bugun);
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
    if(g.mod === 'kapasite') return kapasiteMetni(g);
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

  function kapasiteMetni(g){
    const ger = hizYaz(g.gerekli, g.birim) + (g.ek ? ' (' + (g.ek.metin || 'sabit iş') + ' dahil)' : '');
    const vakit = hizYaz(g.tipik, g.birim);
    const parca = {
      gercekci:'Bu hedef gerçekçi görünüyor: toplam yaklaşık ' + sayiYaz(g.saat) + ' saat, yani '
        + ger + ' gerekiyor; senin vaktin ' + vakit + '.',
      zorlayici:'Bu hedef zorlayıcı: ' + ger + ' gerekiyor, senin vaktin ' + vakit
        + '. Vaktini biraz artırman gerekir.',
      gercekci_degil:'Bu sürede olmaz: toplam yaklaşık ' + sayiYaz(g.saat) + ' saat, yani ' + ger
        + ' gerekiyor; senin vaktin ' + vakit + '.'
        + (g.karsi ? ' Bu vakitle ' + tarihYaz(g.karsi.son_tarih) + ' tarihinde olur.'
          : g.ek ? ' Bu vakit ' + (g.ek.metin || 'sabit işlere') + ' bile yetmiyor.' : ''),
    }[g.bant];
    return parca + ' Bu karar ' + (g.etiket === 'hesaplandi' ? 'hesaplandı' : 'tahmindir')
      + (g.dayanak ? ' (dayanak: ' + g.dayanak.metin + ')' : '') + '.';
  }

  /* ------------------------------------------------------------ sohbet

     `sohbetKur({ paketler, modul, durum:()=>…, bugun:()=>'YYYY-MM-DD',
       kaydet:async h=>…, normalize?(h, durum), notlar?(h, g, durum)=>[metin],
       sonrasi?(h)=>metin, baskaIs?(metin)=>bool })` → { isle(metin) → {text, hedef} | null }

     Soru beklerken gelen cümle CEVAP SANILMAZ, eğer okunamıyorsa ve:
       - yeni bir hedef cümlesiyse: yarım hedef bırakılır, yenisine geçilir;
       - soru ya da uzun bir cümleyse ya da modül onu kendi işi sayıyorsa
         (`baskaIs`): null döner, modülün öteki kapıları işini yapar ve
         soru bekler. Kısa ve okunamayan cevapta yine «anlayamadım» denir.

     Hedef cümlesi gelince eksik alanlar TEK TEK sorulur, sonra karar ve
     tempolar verilir, onayla hedef aktif olur. Hedef olmayan cümleye
     karışılmaz (null): modülün öteki kapıları işini yapar. */
  const EVET = /^(evet|tamam|olur|onaylıyorum|onayla|kaydet)$/;
  /* Cevap denemesi değil: soru cümlesi ya da yedi kelimeden uzun cümle. */
  function cevapDegil(k){ return /\?\s*$/.test(k) || k.split(/\s+/).filter(Boolean).length >= 7; }
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
            : g.mod === 'kapasite'
              ? 'Bir seçenek seç (numarasını yaz), ya da «evet» dersen kendi tarihin ve vaktinle kaydederim.'
              : 'Bir tempo seç («1» ya da «2»), ya da «evet» dersen kendi tarihinle kaydederim.');
      if(g.hata){
        bekleyen = null;
        return { text:g.hata + ' Hedefi yeniden yazabilirsin.', hedef:h };
      }
      bekleyen = { hedef:h, asama:'onay', senaryolar:sen, karar:g };
      return { text:satir.join('\n\n'), hedef:h };
    }

    async function sor(h){
      /* Olamayacak hedef için eksik sorulmaz: önce söylenir. */
      const d = dogrulaOf(h, paketOf(h), durum());
      if(d){
        bekleyen = null;
        return { text:d + ' Hedefi yeniden yazabilirsin.', hedef:h };
      }
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
        if(!x) return { text:'Böyle bir seçenek yok; listedeki numaralardan birini yaz.', hedef:h };
        h.son_tarih = x.son_tarih;
        /* Kapasite senaryosu vakti de değiştirir: «günde 1 saat» seçildiyse
           hedef o vakitle kaydedilir. */
        if(x.kapasite) h.kapasite = Object.assign({}, h.kapasite || {}, x.kapasite);
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
        etiket:g.etiket, dayanak:g.dayanak || null, tarih:bugun(), mod:g.mod || 'hiz',
        saat:g.saat == null ? null : g.saat };
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
        const r = cevapla(bekleyen.hedef, bekleyen.alan, metin, bugun(), paketOf(bekleyen.hedef));
        if(!r.ok){
          const t = cumleden(metin, o.paketler, bugun());
          if(t){
            const eski = gecis(bekleyen.hedef, 'birakildi', bugun());
            bekleyen = null;
            if(eski.ok) await kaydet(eski.hedef);
            const h = normal(yeni(t, o.modul, bugun()));
            await kaydet(h);
            const c = await sor(h);
            return { text:'Yarım kalan önceki hedefi bıraktım; yenisine geçiyorum. ' + c.text, hedef:c.hedef };
          }
          if(cevapDegil(k) || (typeof o.baskaIs === 'function' && o.baskaIs(metin))) return null;
          return { text:r.why, hedef:bekleyen.hedef };
        }
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

  /* ------------------------------------------------------------ uyarlama

     UYARLAMA DÖNGÜSÜ (ekip/PLAN.md §2 adım 9). Plan kontrolde geride
     kalınca hedef BUGÜNÜN verisiyle yeniden değerlendirilir: paket şu
     anki değeri kendisi ölçebiliyorsa (tartı, deneme neti, kapanan konu)
     saklanan eski değer yerine o kullanılır. Karar yine koddur; «bu
     tarihe yetişmez» ise seçenekler sunulur (tarihi uzat ya da vakti
     artır). Seçim kullanıcınındır ve hedefin geçmişine yazılır: «3 ayda
     istedin, 4 aya çektik» her zaman görünür. Plan kendiliğinden
     değişmez; modül eski planı geri alır, yeni plan yine önizleme ve
     onaydan geçer (AGENTS.md §1.9). */
  function uyarla(h, paket, durum, bugun){
    const taze = Object.assign({}, h);
    if(paket && typeof paket.simdi === 'function'){
      const s = paket.simdi(durum || {}, h);
      if(s && s.deger != null) taze.simdi = s;
    }
    const g = gerceklik(taze, paket, durum, bugun);
    let sen = (g.bant && g.bant !== 'gercekci') ? senaryolar(taze, paket, durum, bugun) : [];
    if(paket && typeof paket.guvenlik === 'function'){
      sen = sen.filter(x => {
        const r = paket.guvenlik(taze, durum || {}, { gerekli:x.hiz, fark:null, hafta:null });
        return !(r && r.red);
      });
    }
    return { hedef:taze, karar:g, metin:kararMetni(g), senaryolar:sen };
  }

  /* Seçilen senaryo hedefe yazılır; eski tarih ve vakit geçmişte kalır. */
  function uyarlamaUygula(h, senaryo, paket, durum, bugun){
    const eski = { son_tarih:h.son_tarih || null, kapasite:h.kapasite || null };
    const yeniH = Object.assign({}, h, { guncelleme:bugun });
    if(senaryo && senaryo.son_tarih) yeniH.son_tarih = senaryo.son_tarih;
    if(senaryo && senaryo.kapasite) yeniH.kapasite = Object.assign({}, h.kapasite || {}, senaryo.kapasite);
    const g = gerceklik(yeniH, paket, durum, bugun);
    yeniH.gerceklik = { bant:g.bant, gerekli:g.gerekli, tipik:g.tipik, ust:g.ust, birim:g.birim,
      etiket:g.etiket, dayanak:g.dayanak || null, tarih:bugun, mod:g.mod || 'hiz',
      saat:g.saat == null ? null : g.saat };
    yeniH.uyarlamalar = (h.uyarlamalar || []).concat([{ tarih:bugun, eski,
      yeni:{ son_tarih:yeniH.son_tarih, kapasite:yeniH.kapasite || null }, bant:g.bant || null }]).slice(-20);
    return yeniH;
  }

  /* ------------------------------------------------------- yaşam döngüsü */

  function gecis(h, yeniDurum, bugun){
    if(DURUMLAR.indexOf(yeniDurum) < 0) return { ok:false, why:'Bilinmeyen hedef durumu.' };
    if((GECISLER[h.durum] || []).indexOf(yeniDurum) < 0){
      return { ok:false, why:'Bu hedef «' + h.durum + '» durumunda; «' + yeniDurum + '» yapılamaz.' };
    }
    return { ok:true, hedef:Object.assign({}, h, { durum:yeniDurum, guncelleme:bugun }) };
  }

  return { YONLER, DURUMLAR, BANT_ADI, cumleden, yeni, eksikler, cevapla, gerceklik, dogrulaOf,
    uyarla, uyarlamaUygula,
    senaryolar, gecis, kararMetni, sohbetKur, tarihYaz, sayiYaz, gunEkle, ayEkle, gunFarki,
    haftalikSaat, ZORLAYICI_KAT };
})();
