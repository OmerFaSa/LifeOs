/* KONUŞARAK PLAN DEĞİŞTİRME — cümleden tipli aksiyona.

   «Bu hafta çalışmayacağım», «gelecek hafta günde 4 saat», «haftalık
   soru hedefi 600 olsun» birer PLAN komutudur. Bu dosya onları MODEL
   ÇAĞIRMADAN kapalı katalogdaki bir aksiyona çevirir (data/actions.js):

     ara       → ara-ver       { from, to }
     süre      → gecici-sure   { from, to, dakika }   tarih varsa
                 gunluk-sure   { dakika }             «günde/artık/her gün»
     hedef     → week-target   { weekN, questionTarget }

   Veri girişi («40 soru çözdüm») core/entry.js'in işidir; aynı cümlede
   ikisi birden olabilir ve ikisi de ayrı öneri olur.

   ─────────────────────────────────────────────────────────────────

   BELİRSİZ CÜMLE TAHMİN EDİLMEZ, SORULUR (AGENTS.md §1.7):

     «ara vereceğim»              ne zaman?
     «4 saat çalışacağım»         sadece bugün mü, her gün mü?
     «bugün matematik çalışmayacağım»   tek ders mi, bütün gün mü?
     «bu hafta 2 gün ara»          hangi iki gün?

   Yanlış tahmin, sorulan sorudan pahalıdır: yanlış kurulmuş bir ara
   haftası, o haftanın bütün planını boşaltır.

   ─────────────────────────────────────────────────────────────────

   ZAMAN KİPİ. «4 saat çalıştım» bir RAPORDUR (geçmiş), «4 saat
   çalışacağım» bir PLANDIR. Geçmiş zaman plan komutu sayılmaz. */
window.LIFEOS.PARCA.yazilar({
  'ays.core.komut.arayi-ne-zaman-vermek-istiyo':'Arayı ne zaman vermek istiyorsun? «bu hafta», «yarın», «3 gün» ya da ',
  'ays.core.komut.yalniz-bir-dersi-mi-birakiyo':'Yalnız bir dersi mi bırakıyorsun, yoksa bütün günü mü? Bütün gün için ',
  'ays.core.komut.hangi-gunler-i-ki-tarih-ifad':'Hangi günler? İki tarih ifadesi birlikte olunca hangisini kastettiğini ',
  'ays.core.komut.kac-saat-gunde-4-saat':'Kaç saat? «günde 4 saat» ya da «gelecek hafta günde 3 saat» gibi söyler misin?',
  'ays.core.komut.hangi-bolumu':'Hangi bölümü ',
  'ays.core.komut.hedef-kac-soru-olsun':'Hedef kaç soru olsun?',
  'ays.core.komut.sadece-bugun-mu-yoksa-bundan':'Sadece bugün mü, yoksa bundan sonra her gün mü ',
  'ays.core.komut.yaptim':'Yaptım: ',
  'ays.core.komut.anladigim-su':'Anladığım şu: ',
  'ays.core.komut.bunu-uygulayamadim':'Bunu uygulayamadım: ',
});


window.R = window.R || {};

R.Komut = (function(){
  const U = R.U;

  function kucult(s){ return String(s || '').toLocaleLowerCase('tr'); }
  const HARF = 'a-zçğıöşü';
  const SINIR_ONCE = '(?<![' + HARF + '0-9])';
  const SINIR_SONRA = '(?![' + HARF + '])';

  /* ---------------------------------------------------- komut türü */

  /* «ara» tek başına yalnız cümle SONUNDAYSA komuttur: «ara sıra
     zorlanıyorum» bir ara isteği değildir. «tatil» de yalnız gelecek
     kipinde: «tatilden döndüm» bir rapordur. */
  const ARA_RE = new RegExp(
    '(çalışmayacağım|çalışmayacam|çalışmıyorum|çalışamayacağım|çalışamam|'
    + 'ara ver|mola ver|mola tanımla|tatildeyim|tatile (?:gidiyorum|gideceğim|çıkıyorum)|'
    + 'izinliyim|izin alıyorum|dinleneceğim|'
    + SINIR_ONCE + 'ara(?=\\s*[.!]?\\s*$))');
  /* Ara komutunun KENDİSİ olan olumsuz sözler: «bugün çalışmayacağım» bir
     ara isteğidir. Olumsuzluk süzgeci (LIFEOS.Olumsuz) bunları hariç tutar;
     geri kalan olumsuzluk («ara vermek istemiyorum») isteği durdurur. */
  const ARA_OLUMSUZ_RE = /(çalışmayacağım|çalışmayacam|çalışmıyorum|çalışamayacağım|çalışamam)/;
  const GELECEK_RE = /(çalışacağım|çalışacam|çalışıcam|çalışıcağım|çalışmak istiyorum|çalışayım|olsun|yap|ayarla|çıkar|düşür|indir|yeter)/;   // «kısalt/azalt 30 dk» miktar kadar mı, miktara mı: belirsiz, eklenmez
  const GECMIS_RE = /(çalıştım|çalıştık|çalışmıştım|yaptım|çözdüm|çalışabildim)/;
  const GUNLUK_RE = /(günde|günlük|her gün|artık|bundan sonra|kalıcı)/;
  const HEDEF_RE = /hedef/;

  /* Süre: «4 saat», «3 buçuk saat», «yarım saat», «dört saat», «150 dakika». */
  const SURE_RE = new RegExp('(\\d+(?:[.,]\\d+)?|yarım|[' + HARF + ']+)\\s*(buçuk\\s*)?'
    + '(saat(?:[ae]|in)?|sa|dakika(?:[ny]?[ae])?|dakka|dk)' + SINIR_SONRA, 'g');

  function sureler(t){
    const out = [];
    let m;
    SURE_RE.lastIndex = 0;
    while((m = SURE_RE.exec(t))){
      let n = m[1] === 'yarım' ? 0.5 : R.Entry.sayi(m[1]);
      if(n == null) continue;
      if(m[2]) n += 0.5;
      const dk = /^(saat|sa)/.test(m[3]) ? n * 60 : n;
      out.push({ dk:Math.round(dk), at:m.index });
    }
    return out;
  }

  /* «3 değil 4 saat» → 4. «değil» yoksa son süre. */
  function yeniSure(t){
    const l = sureler(t);
    if(!l.length) return null;
    const d = t.indexOf('değil');
    if(d >= 0){
      const sonra = l.filter(x => x.at > d);
      if(sonra.length) return sonra[0].dk;
    }
    return l[l.length - 1].dk;
  }

  /* Bölüm gizleme: gizlenebilir bir bölümün adı + aç/kapat fiili.
     Bir bölüm HAKKINDA konuşmak («sınamada neden düşük çıkıyorum») istek
     değildir; fiil yoksa komut sayılmaz. */
  const BOLUM_KAPAT_RE = /(kapat|kapansın|gizle|gizlensin|istemiyorum|kullanmıyorum|kullanmayacağım|kaldır)/;
  const BOLUM_OLUMSUZ_RE = /(istemiyorum|kullanmıyorum|kullanmayacağım)/;
  const BOLUM_AC_RE = new RegExp('(' + SINIR_ONCE + 'aç' + SINIR_SONRA + '|açılsın|geri getir|göster|tekrar aç|geri aç)');

  function bolumBul(t){
    const l = (R.Bolum ? R.Bolum.GIZLENEBILIR : []);
    const bulunan = [];
    l.forEach(b => { if(b.takma.some(a => t.indexOf(a) >= 0)) bulunan.push(b.id); });
    return bulunan;
  }

  function turler(t){
    const out = [];
    if((BOLUM_KAPAT_RE.test(t) || BOLUM_AC_RE.test(t))
      && (bolumBul(t).length || /bölüm/.test(t))){
      out.push('bolum');
      return out;
    }
    const gecmis = GECMIS_RE.test(t);
    if(HEDEF_RE.test(t) && /(soru|haftalık|hafta)/.test(t) && /\d/.test(t)) out.push('hedef');
    else if(!gecmis && sureler(t).length && (GELECEK_RE.test(t) || GUNLUK_RE.test(t))) out.push('sure');
    else if(!gecmis && ARA_RE.test(t)) out.push('ara');
    return out;
  }

  /* ----------------------------------------------------------- tarih */

  const GUNLER = [
    ['pazartesi', 0], ['cumartesi', 5], ['çarşamba', 2], ['carsamba', 2],
    ['perşembe', 3], ['persembe', 3], ['salı', 1], ['sali', 1], ['cuma', 4], ['pazar', 6],
  ];
  const GUN_RE = new RegExp(SINIR_ONCE + '(' + GUNLER.map(g => g[0]).join('|') + ')([' + HARF + ']*)', 'g');
  const GUN_IDX = GUNLER.reduce((m, g) => { m[g[0]] = g[1]; return m; }, {});

  function ekle(iso, n){ return U.iso(U.addDays(U.parse(iso), n)); }
  function haftaGunu(iso){ return U.weekdayIndex(U.parse(iso)); }
  function sonraki(iso, idx){ return ekle(iso, (idx - haftaGunu(iso) + 7) % 7); }

  const N_GUN_RE = new RegExp('(\\d+|[' + HARF + ']+)\\s*gün(?!de|lük|luk|dür|dir|den)');

  /* {from,to} | {belirsiz:true} | {gunler:[iso]} (ardışık olmayan liste) | null */
  function tarih(t, bugun){
    const bulunan = [];

    if(/hafta ?sonu/.test(t)){
      const gelecek = /(gelecek|önümüzdeki|sonraki) hafta ?sonu/.test(t);
      let cmt = sonraki(bugun, 5);
      if(haftaGunu(bugun) === 6) cmt = ekle(bugun, -1);      // bugün pazar: bu hafta sonu dün başladı
      if(gelecek) cmt = ekle(cmt, 7);
      const from = cmt < bugun ? bugun : cmt;
      bulunan.push({ from, to:ekle(cmt, 1) });
    }else if(/(gelecek|önümüzdeki|sonraki) hafta|haftaya/.test(t)){
      const pzt = ekle(bugun, 7 - haftaGunu(bugun));
      bulunan.push({ from:pzt, to:ekle(pzt, 6) });
    }else if(/bu hafta/.test(t)){
      bulunan.push({ from:bugun, to:ekle(bugun, 6 - haftaGunu(bugun)) });
    }else if(/bayram/.test(t)){
      const c = (R.S && R.S.calendar || []).find(x => /bayram|tatil/i.test(x.note || x.kind || ''));
      /* Takvimde yoksa tarih uydurulmaz; «ne zaman?» sorulur (§1.7). */
      if(c && c.from) bulunan.push({ from:c.from, to:c.to || c.from });
    }

    const ng = t.match(N_GUN_RE);
    if(ng){
      const n = R.Entry.sayi(ng[1]);
      if(n != null && n >= 1 && n <= 60 && !/haftalığına/.test(ng[0])){
        const bas = /yarından itibaren/.test(t) ? ekle(bugun, 1) : bugun;
        bulunan.push({ from:bas, to:ekle(bas, Math.round(n) - 1) });
      }
    }

    const adlar = [];
    let m;
    GUN_RE.lastIndex = 0;
    while((m = GUN_RE.exec(t))) adlar.push({ idx:GUN_IDX[m[1]], ek:m[2] || '' });
    if(adlar.length){
      const aralik = adlar.length >= 2 && (/^(den|dan|ten|tan)/.test(adlar[0].ek) || /kadar/.test(t));
      if(aralik){
        const from = sonraki(bugun, adlar[0].idx);
        const to = sonraki(from, adlar[adlar.length - 1].idx);
        bulunan.push({ from, to });
      }else if(adlar.length === 1){
        const g = sonraki(bugun, adlar[0].idx);
        bulunan.push({ from:g, to:g });
      }else{
        const gunler = adlar.map(a => sonraki(bugun, a.idx)).sort();
        bulunan.push({ gunler:gunler.filter((g, i) => gunler.indexOf(g) === i) });
      }
    }

    if(!bulunan.length){
      if(/(öbür gün|ertesi gün)/.test(t)) bulunan.push({ from:ekle(bugun, 2), to:ekle(bugun, 2) });
      else if(/yarın/.test(t)) bulunan.push({ from:ekle(bugun, 1), to:ekle(bugun, 1) });
      else if(/bugün/.test(t)) bulunan.push({ from:bugun, to:bugun });
    }

    if(!bulunan.length) return null;
    if(bulunan.length > 1) return { belirsiz:true };
    return bulunan[0];
  }

  /* ---------------------------------------------------- tek komut */

  const SORU = {
    araNe:yz('ays.core.komut.arayi-ne-zaman-vermek-istiyo')
      + '«perşembeden cumartesiye kadar» diyebilirsin.',
    tekDers:yz('ays.core.komut.yalniz-bir-dersi-mi-birakiyo')
      + '«bugün çalışmayacağım» de; tek dersi bugünün bloğundan atlayabilirsin.',
    hangiGun:yz('ays.core.komut.hangi-gunler-i-ki-tarih-ifad')
      + 'bilemiyorum; «perşembe ve cuma» ya da «yarından itibaren 2 gün» gibi söyler misin?',
    sureNe:yz('ays.core.komut.kac-saat-gunde-4-saat'),
  };

  function gunlerdenAralik(gunler){
    /* Ardışık günleri birleştirir: [Per, Cum, Pzt] → [Per–Cum], [Pzt]. */
    const out = [];
    gunler.forEach(g => {
      const son = out[out.length - 1];
      if(son && ekle(son.to, 1) === g) son.to = g;
      else out.push({ from:g, to:g });
    });
    return out;
  }

  /* «X değil Y» bir düzeltmedir, olumsuzluk değil: «3 değil 4 saat». */
  const DUZELTME_RE = new RegExp('değil(?=\\s+(?:\\d|yarım|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|'
    + 'yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz)' + SINIR_SONRA + ')', 'g');
  const HARIC = { ara:ARA_OLUMSUZ_RE, bolum:BOLUM_OLUMSUZ_RE, sure:DUZELTME_RE, hedef:DUZELTME_RE };

  function tekKomut(metin, tur, bugun, tasinanTarih){
    const t = kucult(metin);
    const out = { oneriler:[], sorular:[] };
    const tr = tarih(t, bugun) || tasinanTarih || null;

    /* Olumsuz istek tersine çevrilmez, sorulur (belgeler/ekip/HATALAR.md KR-1). */
    const engel = LIFEOS.Olumsuz.eylemEngeli(metin, { haric:HARIC[tur] });
    if(engel){ out.sorular.push({ metin, soru:engel.soru }); return out; }

    if(tur === 'bolum'){
      const idler = bolumBul(t);
      const kapat = BOLUM_KAPAT_RE.test(t);
      if(!idler.length){
        out.sorular.push({ metin, soru:yz('ays.core.komut.hangi-bolumu') + (kapat ? 'gizleyeyim' : 'açayım')
          + '? «Sınama», «Öğrenme», «Soru çöz», «Telafi», «Analiz» ya da «Rütbe» diyebilirsin.' });
        return out;
      }
      idler.forEach(id => out.oneriler.push({ action:'bolum-ac-kapa',
        params:{ bolum:id, acik:kapat ? 0 : 1 }, metin }));
      return out;
    }

    if(tur === 'hedef'){
      const sayilar = (t.match(/\d+/g) || []).map(Number);
      const d = t.indexOf('değil');
      let q = sayilar.length ? sayilar[sayilar.length - 1] : null;
      if(d >= 0){
        const m = t.slice(d).match(/\d+/);
        if(m) q = Number(m[0]);
      }
      if(q == null){ out.sorular.push({ metin, soru:yz('ays.core.komut.hedef-kac-soru-olsun') }); return out; }
      const n = R.Model.currentWeek() + (/(gelecek|önümüzdeki|sonraki) hafta|haftaya/.test(t) ? 1 : 0);
      out.oneriler.push({ action:'week-target', params:{ weekN:n, questionTarget:q }, metin });
      return out;
    }

    if(tur === 'ara'){
      if(R.Entry.dersBul(metin)){ out.sorular.push({ metin, soru:SORU.tekDers }); return out; }
      if(!tr){ out.sorular.push({ metin, soru:SORU.araNe }); return out; }
      if(tr.belirsiz){ out.sorular.push({ metin, soru:SORU.hangiGun }); return out; }
      const araliklar = tr.gunler ? gunlerdenAralik(tr.gunler) : [tr];
      araliklar.forEach(a => out.oneriler.push({ action:'ara-ver',
        params:{ from:a.from, to:a.to }, metin }));
      return out;
    }

    if(tur === 'sure'){
      const dk = yeniSure(t);
      if(dk == null){ out.sorular.push({ metin, soru:SORU.sureNe }); return out; }
      if(tr && tr.belirsiz){ out.sorular.push({ metin, soru:SORU.hangiGun }); return out; }
      if(tr){
        const araliklar = tr.gunler ? gunlerdenAralik(tr.gunler) : [tr];
        araliklar.forEach(a => out.oneriler.push({ action:'gecici-sure',
          params:{ from:a.from, to:a.to, dakika:dk }, metin }));
        return out;
      }
      if(GUNLUK_RE.test(t)){
        out.oneriler.push({ action:'gunluk-sure', params:{ dakika:dk }, metin });
        return out;
      }
      out.sorular.push({ metin, soru:yz('ays.core.komut.sadece-bugun-mu-yoksa-bundan')
        + dk + ' dakika? «bugün ' + Math.round(dk / 6) / 10 + ' saat» ya da «günde '
        + Math.round(dk / 6) / 10 + ' saat» diyebilirsin.' });
      return out;
    }
    return out;
  }

  /* ------------------------------------------------------ bileşik */

  /* Cümleyi anlar. Dönüş:
       oneriler  [{ action, params, metin }]   katalog aksiyonları
       sorular   [{ metin, soru }]             tahmin edilmeyen kısımlar
       anlasilmayan [metin]                    hiçbir şeye benzemeyen parça
       komut     bool   cümlede bir komut ya da veri var mıydı
     Sıradan sohbet («nasılım?») komut DEĞİLDİR: komut=false döner ve
     cümle ajana gider. */
  function anla(text, opts){
    const o = opts || {};
    const bugun = o.date || U.todayISO();
    let ham = R.Entry && R.Entry.dagit ? R.Entry.dagit(String(text || '').trim()) : String(text || '').trim();
    /* King-Bench organizasyon: «bu hafta yükümü yüzde 30 azalt» — temel günlük sürenin %70'i, geçici (söylenen dönem; yoksa bu hafta). */
    { const yz2 = /(?:yük|plan|çalışma süre|tempo)[a-zçğıöşü]*\s+(?:yüzde|%)\s*(\d{1,2})\s*(?:azalt|düşür|hafiflet|indir)/i.exec(ham);
      const temel = yz2 && R.Istisna && (R.Istisna.temelDakika() || R.Istisna.sablonDakikasi());
      if(temel){ const dk = Math.max(30, Math.round(temel * (1 - Number(yz2[1]) / 100) / 5) * 5);
        const zaman = (ham.toLocaleLowerCase('tr').match(/(bugün|yarın|bu hafta|gelecek hafta|haftaya|önümüzdeki hafta)/) || ['bu hafta'])[0];
        ham = zaman + ' günde ' + dk + ' dakika çalışacağım'; } }
    const sonuc = { oneriler:[], sorular:[], anlasilmayan:[], komut:false };
    if(ham.length < 3) return sonuc;

    const t = kucult(ham);
    const butun = turler(t);
    /* King-Bench seviye 2: rapor cümlesinin günü («dün …», «geçen salı …», brand/ortak/tarih.js gunSozu); yoksa bugün. */
    const T = window.LIFEOS && LIFEOS.TARIH;
    const veriGunu = (T && T.gunSozu && T.gunSozu(ham, bugun)) || bugun;
    const veri = R.Entry ? R.Entry.fromText(ham, { date:veriGunu, bugun }) : { oneriler:[], engellenen:[] };
    const engelli = (veri.engellenen || []).length > 0;
    /* Deneme sonucu tek kayıttır (entry.js parseDeneme): virgüllerinden bölünmez. */
    if(veri.deneme){
      veri.oneriler.forEach(x => sonuc.oneriler.push({ action:x.action, params:x.params, metin:ham }));
      (veri.engellenen || []).forEach(e => sonuc.sorular.push({ metin:e.metin, soru:e.soru, deneme:true }));
      sonuc.komut = true;
      return sonuc;
    }

    /* Tek komut, veri yok: cümlenin TAMAMI tek komuttur. Bölmek, «gelecek
       hafta, günde 4 saat» gibi bir cümlenin tarihini komutundan koparırdı. */
    if(butun.length === 1 && !veri.oneriler.length && !engelli){
      const r = tekKomut(ham, butun[0], bugun, null);
      sonuc.oneriler = r.oneriler;
      sonuc.sorular = r.sorular;
      sonuc.komut = true;
      return sonuc;
    }
    if(!butun.length && !veri.oneriler.length && !engelli) return sonuc;

    /* Birden çok komut ya da veri: yan cümlelere bölünür. Yalnız tarih
       taşıyan parça («gelecek hafta,») tarihini sonraki komuta devreder. */
    let tasinan = null;
    R.Entry.yanCumleler(ham).forEach(parca => {
      const pt = kucult(parca);
      const tur = turler(pt)[0];
      if(tur){
        const r = tekKomut(parca, tur, bugun, tarih(pt, bugun) ? null : tasinan);
        sonuc.oneriler.push.apply(sonuc.oneriler, r.oneriler);
        sonuc.sorular.push.apply(sonuc.sorular, r.sorular);
        tasinan = null;
        return;
      }
      const v = R.Entry.fromText(parca, { date:veriGunu, bugun });
      if(v.oneriler.length || (v.engellenen || []).length){
        v.oneriler.forEach(x => sonuc.oneriler.push({ action:x.action, params:x.params, metin:parca }));
        /* Ölçüm olmayan veri cümlesi yazılmaz, sorulur (KR-1). */
        (v.engellenen || []).forEach(e => sonuc.sorular.push({ metin:e.metin, soru:e.soru }));
        tasinan = null;
        return;
      }
      const tt = tarih(pt, bugun);
      if(tt){ tasinan = tt; return; }
      sonuc.anlasilmayan.push(parca);
    });
    sonuc.komut = !!(sonuc.oneriler.length || sonuc.sorular.length);
    return sonuc;
  }

  /* ------------------------------------------------------- yürütme

     Anlaşılan her öneri ÖNERİ KUTUSUNDAN geçer (core/proposals.js):
     doğrulama, seviye, geri alma kaydı orada. Kullanıcının kendi isteği
     olduğu için kaynak 'istek'tir; öneren Patron'dur — sohbet hangi
     koçla yapılırsa yapılsın sistemi değiştiren katman odur. Önizleme
     UYGULAMADAN ÖNCE alınır: uygulandıktan sonra «hedef zaten bu» der. */
  async function isle(sonuc, opts){
    const o = opts || {};
    const yapilan = [], bekleyen = [], dusen = [];
    for(const x of (sonuc && sonuc.oneriler) || []){
      const p = x.params || {};
      if(x.action === 'week-target' && p.weekN >= 1 && p.weekN <= R.PLAN.totalWeeks){
        await R.Model.ensureWeek(p.weekN);
      }
      if(p.date && U.isISO(p.date) && p.date <= U.todayISO()) await R.Model.ensureDay(p.date);
      const def = R.ACTION_BY_ID[x.action] || {};
      const pv = R.Proposals.preview({ action:x.action, agent:'patron', params:p });
      const t = await R.Proposals.talep({ action:x.action, agent:'patron', source:'istek',
        params:p, reason:x.metin || o.metin || '' });
      const kayit = { baslik:def.title || x.action, satirlar:pv.ok ? pv.rows : [], row:t.row };
      if(!t.row){ dusen.push(Object.assign(kayit, { why:t.why || pv.why || null })); continue; }
      (t.otomatik ? yapilan : bekleyen).push(kayit);
    }
    return { yapilan, bekleyen, dusen, sorular:(sonuc && sonuc.sorular) || [] };
  }

  function satir(k){
    const r = (k.satirlar || []).slice(0, 3)
      .map(x => x.label + ': ' + x.before + ' → ' + x.after).join('; ');
    return k.baslik + (r ? ' (' + r + ')' : '');
  }

  /* Sohbet cevabı — kural motorunun metni. Model bu cümleyi yazmaz:
     yazsaydı «uyguladım» deyip uygulamamış olabilirdi. */
  function yanit(islem){
    const p = [];
    if(islem.yapilan.length){
      p.push(yz('ays.core.komut.yaptim') + islem.yapilan.map(satir).join(' · ')
        + '. Geri almak istersen «geri al» de.');
    }
    if(islem.bekleyen.length){
      p.push(yz('ays.core.komut.anladigim-su') + islem.bekleyen.map(satir).join(' · ')
        + '. Onaylıyor musun? «evet» de ya da aşağıdan onayla.');
    }
    if(islem.dusen.length){
      p.push(yz('ays.core.komut.bunu-uygulayamadim') + islem.dusen.map(k => k.baslik + ' — '
        + (k.why || 'geçersiz')).join(' · '));
    }
    (islem.sorular || []).forEach(s => p.push(s.soru));
    return p.join('\n\n');
  }

  /* «evet», «vazgeç», «geri al» — yalnız KISA mesajda. Uzun bir cümlenin
     başındaki «evet» bir onay değil, sohbettir. */
  function kisaCevap(text){
    const t = kucult(text).replace(/[.!?,]+/g, ' ').replace(/\s+/g, ' ').trim();
    if(!t || t.length > 25) return null;
    if(/^(evet|onayla|onaylıyorum|onaylıyorum tamam|uygula|tamam uygula|olur|tamam|tamamdır)$/.test(t)) return 'evet';
    if(/^(hayır|hayir|vazgeç|vazgec|vazgeçtim|iptal|istemiyorum|boş ver|boşver)$/.test(t)) return 'hayir';
    if(/^(geri al|geri alsana|onu geri al|geri alır mısın|son değişikliği geri al)$/.test(t)) return 'geri';
    return null;
  }

  async function onayla(ids){
    let n = 0;
    const why = [];
    for(const id of ids || []){
      const r = await R.Proposals.approve(id);
      if(r && r.ok) n++;
      else if(r && r.why) why.push(r.why);
    }
    return { n, why };
  }

  async function reddet(ids){
    for(const id of ids || []) await R.Proposals.reject(id);
  }

  /* Kullanıcının istediği SON değişikliği geri alır. Ajanın kendi
     önerisi burada geri alınmaz: «geri al» diyen kişi kendi dediğini
     kastediyor. */
  async function geriAl(){
    const son = R.Proposals.applied()
      .filter(p => p.source === 'istek')
      .sort((a, b) => String(b.appliedAt || '').localeCompare(String(a.appliedAt || '')))[0];
    if(!son) return null;
    await R.Proposals.undo(son.id);
    return son;
  }

  return { anla, tarih, sureler, yeniSure, turler, SORU,
    isle, yanit, kisaCevap, onayla, reddet, geriAl };
})();
