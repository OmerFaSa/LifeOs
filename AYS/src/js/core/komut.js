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
    + 'ara ver|mola ver|tatildeyim|tatile (?:gidiyorum|gideceğim|çıkıyorum)|'
    + 'izinliyim|izin alıyorum|dinleneceğim|'
    + SINIR_ONCE + 'ara(?=\\s*[.!]?\\s*$))');
  const GELECEK_RE = /(çalışacağım|çalışacam|çalışıcam|çalışıcağım|çalışmak istiyorum|çalışayım|olsun|yap|ayarla|çıkar|düşür|indir)/;
  const GECMIS_RE = /(çalıştım|çalıştık|çalışmıştım|yaptım|çözdüm|çalışabildim)/;
  const GUNLUK_RE = /(günde|günlük|her gün|artık|bundan sonra|kalıcı)/;
  const HEDEF_RE = /hedef/;

  /* Süre: «4 saat», «3 buçuk saat», «yarım saat», «dört saat», «150 dakika». */
  const SURE_RE = new RegExp('(\\d+(?:[.,]\\d+)?|yarım|[' + HARF + ']+)\\s*(buçuk\\s*)?'
    + '(saat|sa|dakika|dk)' + SINIR_SONRA, 'g');

  function sureler(t){
    const out = [];
    let m;
    SURE_RE.lastIndex = 0;
    while((m = SURE_RE.exec(t))){
      let n = m[1] === 'yarım' ? 0.5 : R.Entry.sayi(m[1]);
      if(n == null) continue;
      if(m[2]) n += 0.5;
      const dk = /^(saat|sa)$/.test(m[3]) ? n * 60 : n;
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

  function turler(t){
    const out = [];
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
    araNe:'Arayı ne zaman vermek istiyorsun? «bu hafta», «yarın», «3 gün» ya da '
      + '«perşembeden cumartesiye kadar» diyebilirsin.',
    tekDers:'Yalnız bir dersi mi bırakıyorsun, yoksa bütün günü mü? Bütün gün için '
      + '«bugün çalışmayacağım» de; tek dersi bugünün bloğundan atlayabilirsin.',
    hangiGun:'Hangi günler? İki tarih ifadesi birlikte olunca hangisini kastettiğini '
      + 'bilemiyorum; «perşembe ve cuma» ya da «yarından itibaren 2 gün» gibi söyler misin?',
    sureNe:'Kaç saat? «günde 4 saat» ya da «gelecek hafta günde 3 saat» gibi söyler misin?',
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

  function tekKomut(metin, tur, bugun, tasinanTarih){
    const t = kucult(metin);
    const out = { oneriler:[], sorular:[] };
    const tr = tarih(t, bugun) || tasinanTarih || null;

    if(tur === 'hedef'){
      const sayilar = (t.match(/\d+/g) || []).map(Number);
      const d = t.indexOf('değil');
      let q = sayilar.length ? sayilar[sayilar.length - 1] : null;
      if(d >= 0){
        const m = t.slice(d).match(/\d+/);
        if(m) q = Number(m[0]);
      }
      if(q == null){ out.sorular.push({ metin, soru:'Hedef kaç soru olsun?' }); return out; }
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
      out.sorular.push({ metin, soru:'Sadece bugün mü, yoksa bundan sonra her gün mü '
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
    const ham = String(text || '').trim();
    const sonuc = { oneriler:[], sorular:[], anlasilmayan:[], komut:false };
    if(ham.length < 3) return sonuc;

    const t = kucult(ham);
    const butun = turler(t);
    const veri = R.Entry ? R.Entry.fromText(ham, { date:bugun }) : { oneriler:[] };

    /* Tek komut, veri yok: cümlenin TAMAMI tek komuttur. Bölmek, «gelecek
       hafta, günde 4 saat» gibi bir cümlenin tarihini komutundan koparırdı. */
    if(butun.length === 1 && !veri.oneriler.length){
      const r = tekKomut(ham, butun[0], bugun, null);
      sonuc.oneriler = r.oneriler;
      sonuc.sorular = r.sorular;
      sonuc.komut = true;
      return sonuc;
    }
    if(!butun.length && !veri.oneriler.length) return sonuc;

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
      const v = R.Entry.fromText(parca, { date:bugun });
      if(v.oneriler.length){
        v.oneriler.forEach(x => sonuc.oneriler.push({ action:x.action, params:x.params, metin:parca }));
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
      p.push('Yaptım: ' + islem.yapilan.map(satir).join(' · ')
        + '. Geri almak istersen «geri al» de.');
    }
    if(islem.bekleyen.length){
      p.push('Anladığım şu: ' + islem.bekleyen.map(satir).join(' · ')
        + '. Onaylıyor musun? «evet» de ya da aşağıdan onayla.');
    }
    if(islem.dusen.length){
      p.push('Bunu uygulayamadım: ' + islem.dusen.map(k => k.baslik + ' — '
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
