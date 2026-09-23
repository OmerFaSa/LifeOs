/* AYS HEDEFLERİ — genel hedef motorunun (brand/ortak/hedef.js) AYS paketleri.

   Motor alanı bilmez; AYS'nin bildiği şunlardır:

     KONU BİTİRME   «TYT matematiği 100 günde bitirmek istiyorum». Karar
                    KAPASİTEYLE verilir: kalan konuların süresi ÷ haftalık
                    vaktin. Konu süreleri müfredatın kendi tahminleridir
                    (data/subjects.js: «günde 3–4 saatlik düzene göre»), bir
                    PLANLAMA VARSAYIMIDIR ve kaynağı bağlanmadı: karar
                    «tahmin». Kapanan konu, kapanış kuralıyla kapanmıştır
                    (ilk test ≥ %75, 7 gün sonra ≥ %70) — beyanla değil.
     NET HEDEFİ     «TYT'de 90 nete çıkmak istiyorum», «AYT fiziği 10 net».
                    Hız KENDİ DENEMELERİNDEN gelir: son tam denemelerinin
                    net eğimi (medyan eğim; tek kötü deneme hızı bozmaz).
                    Ölçülmüş veri olduğu için karar «hesaplandı». Deneme
                    yoksa ya da azsa karar VERİLMEZ ve bu söylenir.

   Sınırlar: AYS puan ya da sıra garantisi vermez; net bir ölçümdür, bir
   söz değildir. Olamayacak hedef (TYT'de 120'den fazla net) karara
   gitmeden söylenir (motorun `dogrula` kancası). */

window.R = window.R || {};

R.Hedefler = (function(){
  const H = () => window.LIFEOS.Hedef;
  const U = () => R.U;
  const HARF = 'a-zçğıöşü';
  const ONCE = '(?:^|[^' + HARF + '])';

  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }
  function sayiYaz(x, n){ return String(yuvarla(x, n == null ? 1 : n)).replace('.', ','); }
  function kacis(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  /* Ünsüz yumuşaması: «fizik» → «fiziği», «matematik» → «matematiği».
     Takma adın son sert ünsüzü yumuşağıyla da eşleşir. */
  const YUMUSAK = { k:'[kğ]', p:'[pb]', t:'[td]', 'ç':'[çc]' };
  function takmaDesen(a){
    const k = kacis(kucuk(a));
    const son = k.slice(-1);
    return YUMUSAK[son] ? k.slice(0, -1) + YUMUSAK[son] : k;
  }

  /* --------------------------------------------------- ders tanıma */

  /* Takma adlar data/subjects.js'ten gelir, UZUNDAN KISAYA sıralıdır.
     Eşleşen parça MASKELENİR: «tyt matematik» bulunduktan sonra aynı
     yerdeki «matematik» ikinci bir ders sayılmaz. Kelimenin yalnız başı
     sabitlenir; ek serbesttir («matematiği», «fizikte»). */
  function dersleriBul(k){
    let metin = ' ' + kucuk(k) + ' ';
    const bulunan = [];
    (R.SUBJECT_ALIASES || []).forEach(a => {
      const re = new RegExp('([^' + HARF + '])' + takmaDesen(a.alias), 'g');
      let m;
      while((m = re.exec(metin))){
        const sonra = metin.slice(m.index + m[0].length);
        /* «sınav tarihine kadar» bir derse işaret etmez. */
        if(a.alias === 'tarih' && /^(i|in|ine|inde|e kadar|te)(?![a-zçğıöşü])/.test(sonra)) continue;
        if(bulunan.indexOf(a.subject.id) < 0) bulunan.push(a.subject.id);
        metin = metin.slice(0, m.index + 1) + ' '.repeat(m[0].length - 1) + sonra;
        re.lastIndex = m.index + 1;
      }
    });
    return bulunan;
  }
  function aileOf(k){
    const t = kucuk(k);
    if(new RegExp(ONCE + 'ayt').test(t)) return 'AYT';
    if(new RegExp(ONCE + 'tyt').test(t)) return 'TYT';
    return null;
  }
  function ders(id){ return (R.SUBJECTS || []).find(s => s.id === id) || null; }

  /* Cümlenin kapsamı: söylenen dersler; sınav adı söylenip ders
     söylenmediyse o sınavın bütün dersleri; ikisi de yoksa ve «konu»
     geçiyorsa bütün müfredat. Sınav adıyla çelişen ders («TYT fizik»:
     fizik bir AYT dersi, TYT'de Fen Bilimleri'nin parçası) TAHMİN
     EDİLMEZ: `belirsiz` döner ve sorulur. */
  function kapsamBul(k){
    let dersler = dersleriBul(k);
    const aile = aileOf(k);
    if(aile && dersler.length){
      const uyan = dersler.filter(id => ders(id).exam === aile);
      if(!uyan.length) return { belirsiz:true };
      dersler = uyan;
    }
    if(!dersler.length && aile) dersler = (R.SUBJECTS || []).filter(s => s.exam === aile).map(s => s.id);
    if(!dersler.length && /konu/.test(kucuk(k))) dersler = (R.SUBJECTS || []).map(s => s.id);
    return dersler.length ? { dersler } : null;
  }
  const BELIRSIZ = 'Hangi dersi kastettiğini anlayamadım; «TYT Fen Bilimleri» ya da «AYT Fizik» gibi '
    + 'dersin adıyla yazar mısın?';
  function aliasDesen(){
    return (R.SUBJECT_ALIASES || []).map(a => takmaDesen(a.alias)).join('|');
  }

  /* «sınava kadar», «sınavda»: tarih kullanıcının KENDİ profilindeki
     sınav tarihidir (profil › sınav günü), tahmin edilmez. */
  function sinavTarihi(aile){
    const p = R.PROGRAM || {};
    return aile === 'AYT' ? p.examAytISO : p.examTytISO;
  }
  function sinavaKadar(k, aile, bugun){
    if(!/sınav(a kadar|da|ın|a)|sınav (gününe|tarihine)/.test(kucuk(k))) return null;
    const t = sinavTarihi(aile);
    return t && t > bugun ? t : null;
  }
  const TARIH_SORU = 'Ne zamana kadar? «100 günde», «sınava kadar» ya da «31 Mart’a kadar» gibi yazabilirsin.';

  /* ======================================================== KONU BİTİRME */

  /* Bir «gün» konu süresi = 3,5 saat (data/subjects.js: süreler günde 3–4
     saatlik düzene göredir). Başlanmış konu YARIM sayılır: öğretimi
     büyük ölçüde yapılmış, kalan iş test ve kapanıştır. */
  const SAAT_GUN = 3.5;
  const BASLANMIS_KAT = 0.5;
  const RUTIN_RE = /(sürekli|surekli|rutin)/i;

  function konular(dersler){
    const out = [];
    (dersler || []).forEach(id => {
      const s = ders(id);
      if(!s) return;
      s.topics.forEach(t => {
        if(RUTIN_RE.test(t.days)) return;         // dokuz ay süren beceri «biten» bir konu değildir
        out.push({ subjectId:s.id, subjectName:s.name, exam:s.exam, topicId:t.id, name:t.name,
          order:t.order, freq:t.freq, gun:R.Planner.topicDays(t.days) });
      });
    });
    return out;
  }
  function durumOf(k){ return (R.Model.topicState(k.subjectId, k.topicId) || {}).state || 'not_started'; }
  function kalanKonular(dersler){ return konular(dersler).filter(k => durumOf(k) !== 'closed'); }
  /* Kalan konular çalışılacak SIRAYLA: dersler sırayla, ders içinde önkoşul
     sırası (order). Başlanmış konu önce gelir: yarım işi bitirmek, yenisini
     açmaktan önce gelir. */
  function siraliKalan(dersler){
    const dSira = {};
    (dersler || []).forEach((id, i) => { dSira[id] = i; });
    return kalanKonular(dersler).sort((a, b) => {
      const ba = durumOf(a) === 'not_started' ? 1 : 0, bb = durumOf(b) === 'not_started' ? 1 : 0;
      if(ba !== bb) return ba - bb;
      if(dSira[a.subjectId] !== dSira[b.subjectId]) return dSira[a.subjectId] - dSira[b.subjectId];
      return a.order - b.order;
    });
  }
  function tempo(){
    const lv = R.Planner.level(R.S.profile && R.S.profile.level);
    return { kat:lv.pace, ad:lv.name };
  }
  function konuSaati(k){
    const t = tempo();
    return k.gun * SAAT_GUN * t.kat * (durumOf(k) === 'not_started' ? 1 : BASLANMIS_KAT);
  }
  function kapsamAdi(dersler){
    const l = (dersler || []).map(ders).filter(Boolean);
    const aile = ['TYT', 'AYT'].find(a => {
      const hepsi = (R.SUBJECTS || []).filter(s => s.exam === a).map(s => s.id);
      return hepsi.length === l.length && hepsi.every(id => dersler.indexOf(id) >= 0);
    });
    if(aile) return aile + ' konuları';
    if(l.length === (R.SUBJECTS || []).length) return 'Bütün konular';
    return l.map(s => s.name).join(', ');
  }

  const KONU = {
    id:'konu', ad:'Konu bitirme', olcut:{ ad:'kapanan konu', birim:'konu' },
    /* Ders ya da sınav adı + bitirme fiili. «kapat» bilerek YOK: «konu
       anlatımını kapatmak istiyorum» bir bölüm isteğidir (core/komut.js). */
    get anahtar(){
      return new RegExp(ONCE + '(tyt|ayt|konu|' + aliasDesen() + ')[^.?!]*?(bitir|tamamla|yetiştir)');
    },
    birimler:/konu/,
    yonler:['ulas'], kapasiteGerekir:true,
    tani(k, bugun){
      const d = kapsamBul(k);
      if(!d) return null;
      if(d.belirsiz) return { yon:'ulas', egilim:'artir', birim:'konu', belirsiz:true };
      const out = { yon:'ulas', egilim:'artir', dersler:d.dersler, kapsam:kapsamAdi(d.dersler),
        birim:'konu', aile:ders(d.dersler[0]).exam, hedefDeger:null, fark:null };
      /* «3 konu bitirmek»: sayı söylendiyse o kadar konu; yoksa kapsamın hepsi. */
      const m = /(\d{1,3})\s*konu/.exec(k);
      if(m) out.fark = Number(m[1]);
      else out.hedefDeger = konular(d.dersler).length;
      const t = sinavaKadar(k, out.aile, bugun);
      if(t) out.son_tarih = t;
      return out;
    },
    simdi(durum, h){
      const l = konular(h.dersler);
      return { deger:l.filter(k => durumOf(k) === 'closed').length, birim:'konu', etiket:'hesaplandi', tarih:null };
    },
    dogrula(h){
      if(h.belirsiz) return BELIRSIZ;
      const l = konular(h.dersler);
      if(!l.length) return 'Bu kapsamda bitirilecek konu bulamadım.';
      const kalan = l.filter(k => durumOf(k) !== 'closed').length;
      if(h.fark != null && h.fark > kalan && kalan > 0){
        return h.kapsam + ' içinde ' + kalan + ' konu kaldı; ' + h.fark + ' konu bitirilemez.';
      }
      if(l.every(k => durumOf(k) === 'closed')){
        return h.kapsam + ': bütün konular kapanış kuralıyla zaten kapanmış (ilk test ≥ %'
          + R.CLOSURE_RULE.first + ', ' + R.CLOSURE_RULE.gapDays + ' gün sonra ≥ %' + R.CLOSURE_RULE.second + ').';
      }
      return null;
    },
    tarihSoru:TARIH_SORU,
    tarihOku(k, h, bugun){ return sinavaKadar(k, h.aile, bugun); },
    gerekenSaat(h){
      const kalan = siraliKalan(h.dersler);
      if(!kalan.length) return { neden:'Kalan konu yok.' };
      /* Sayı söylendiyse SIRADAKİ o kadar konu (ders içi önkoşul sırası). */
      const l = h.fark != null ? kalan.slice(0, h.fark) : kalan;
      const saat = yuvarla(l.reduce((a, k) => a + konuSaati(k), 0), 1);
      const t = tempo();
      return { saat, kalan:l.length, dayanak:{ durum:'kaynak_bekliyor', metin:'AYS müfredatındaki '
        + 'konu süreleri (günde 3–4 saatlik düzene göre öğretim ve ilk soru; planlama varsayımı, '
        + 'kaynağı bağlanmadı) × seviyen («' + t.ad + '» ×' + sayiYaz(t.kat, 2) + '); başlanmış konu '
        + 'yarım sayıldı' } };
    },
  };

  /* ========================================================= NET HEDEFİ */

  /* Deneme testlerinin adları (data/reference.js, R.EXAM_TEMPLATES). */
  const DERS_TEST = { 'tyt-turkce':'Türkçe', 'tyt-matematik':'Temel Matematik', 'tyt-fen':'Fen Bilimleri',
    'tyt-sosyal':'Sosyal Bilimler', 'ayt-matematik':'Matematik', 'ayt-fizik':'Fizik',
    'ayt-kimya':'Kimya', 'ayt-biyoloji':'Biyoloji' };
  const EN_AZ_DENEME = 4;
  const EN_AZ_GUN = 21;
  const PENCERE = 10;

  function azami(h){
    if(h.brans) return (ders(h.brans) || {}).questions || null;
    return (R.SUBJECTS || []).filter(s => s.exam === h.aile).reduce((a, s) => a + (s.questions || 0), 0) || null;
  }
  function netAdi(h){ return h.brans ? (ders(h.brans) || {}).name : h.aile; }

  /* Seri: tam denemeler (ailenin toplam neti) ya da branşta o testin neti
     (tam + branş denemeleri). Tarih sırasıyla. */
  function seri(h){
    const out = [];
    (R.S.exams || []).forEach(e => {
      if(!e || !e.date || e.family !== h.aile) return;
      if(!h.brans){
        if(e.kind === 'full') out.push({ date:e.date, net:R.Model.examNet(e) });
        return;
      }
      if(e.kind !== 'full' && e.kind !== 'branch') return;
      const t = (e.tests || []).find(x => x && x.name === h.test);
      if(t) out.push({ date:e.date, net:R.Model.testNet(t) });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  /* Medyan eğim (Theil–Sen): her deneme çiftinin haftalık net farkının
     medyanı. Tek bir kötü ya da şanslı deneme hızı savurmaz. */
  function netHizi(h){
    const l = seri(h).slice(-PENCERE);
    if(l.length < EN_AZ_DENEME){
      return { neden:(l.length ? 'Yalnız ' + l.length + ' ' + (h.brans ? '' : 'tam ') + 'denemen var'
        : 'Hiç ' + (h.brans ? '' : 'tam ') + netAdi(h) + ' denemen yok') };
    }
    const gun = U().diffDays(l[0].date, l[l.length - 1].date);
    if(gun < EN_AZ_GUN) return { neden:'Denemelerin ' + gun + ' günü kapsıyor; en az üç hafta gerekir' };
    const egimler = [];
    for(let i = 0; i < l.length; i++){
      for(let j = i + 1; j < l.length; j++){
        const d = U().diffDays(l[i].date, l[j].date);
        if(d > 0) egimler.push((l[j].net - l[i].net) / d * 7);
      }
    }
    const hiz = yuvarla(U().median(egimler), 2);
    if(!(hiz > 0)){
      return { neden:'Son ' + l.length + ' denemende netin artmadı (haftada ' + sayiYaz(hiz, 2)
        + ' net); bu gidişle bir tarih hesaplanamaz' };
    }
    return { hiz, deneme:l.length, hafta:yuvarla(gun / 7, 1) };
  }

  const NET = {
    id:'net', ad:'Net hedefi', olcut:{ ad:'net', birim:'net' },
    get anahtar(){
      const d = '(tyt|ayt|' + aliasDesen() + ')';
      return new RegExp(ONCE + d + '[^.?!]*?' + ONCE + 'net|' + ONCE + 'net[^.?!]*?' + ONCE + d);
    },
    birimler:/net/,
    yonler:['ulas'],
    tani(k, bugun){
      const aile0 = aileOf(k);
      let dersler = dersleriBul(k);
      if(aile0 && dersler.length){
        const uyan = dersler.filter(id => ders(id).exam === aile0);
        if(!uyan.length) return { yon:'ulas', egilim:'artir', birim:'net', belirsiz:true };
        dersler = uyan;
      }
      if(dersler.length > 1) return { yon:'ulas', egilim:'artir', birim:'net', cokDers:dersler };
      const brans = dersler.length === 1 ? dersler[0] : null;
      const aile = brans ? ders(brans).exam : aile0;
      if(!aile) return null;
      const out = { yon:'ulas', egilim:'artir', birim:'net', aile, brans, test:brans ? DERS_TEST[brans] : null,
        hedefDeger:null, fark:null };
      const m = new RegExp('(\\d{1,3}(?:[.,]\\d+)?)\\s*net([' + HARF + '\']*)').exec(k);
      const m2 = new RegExp('net[' + HARF + ']*\\s+(\\d{1,3}(?:[.,]\\d+)?)\\s*\'?(y?[ae])?(?![0-9])').exec(k);
      if(m){
        const n = Number(m[1].replace(',', '.'));
        if(/^'?y?[ae]$/.test(m[2])) out.hedefDeger = n; else out.fark = n;
      }else if(m2){
        out.hedefDeger = Number(m2[1].replace(',', '.'));
      }
      const t = sinavaKadar(k, aile, bugun);
      if(t) out.son_tarih = t;
      return out;
    },
    simdi(durum, h){
      const l = seri(h);
      if(!l.length) return null;
      const son = l.slice(-3).map(x => x.net);
      return { deger:yuvarla(U().median(son), 2), birim:'net', etiket:'hesaplandi', tarih:l[l.length - 1].date,
        kaynak:'son ' + son.length + ' denemenin medyanı' };
    },
    simdiSoru(h){
      return 'Son denemelerinde ' + netAdi(h) + ' netin kaç civarı? Deneme girmediysen «bilmiyorum» yaz.';
    },
    simdiOku(metin, h){
      const k = kucuk(metin);
      const m = /(\d{1,3}(?:[.,]\d+)?)/.exec(k);
      if(m){
        const n = Number(m[1].replace(',', '.'));
        const ust = azami(h);
        if(ust != null && n > ust) return { hata:netAdi(h) + ' en fazla ' + ust + ' nettir; yeniden yazar mısın?' };
        return { deger:n, birim:'net', etiket:'tahmin' };
      }
      if(/(bilmiyorum|bilmem|girmedim|yok)/.test(k)) return { deger:null, birim:'net', etiket:'veri_yok' };
      return null;
    },
    simdiHata:'Neti anlayamadım; sayıyla yaz (ör. 72,5) ya da «bilmiyorum» de.',
    dogrula(h){
      if(h.belirsiz) return BELIRSIZ;
      if(h.cokDers){
        return 'Net hedefi tek bir ders ya da TYT/AYT toplamı için kurulur; «'
          + h.cokDers.map(id => ders(id).name).join(', ') + '» için ayrı ayrı yazabilirsin.';
      }
      const ust = azami(h);
      if(ust == null) return null;
      if(h.hedefDeger != null && h.hedefDeger > ust) return netAdi(h) + ' en fazla ' + ust + ' nettir; hedef bunu aşıyor.';
      const s = h.simdi && h.simdi.deger;
      if(h.fark != null && s != null && s + h.fark > ust){
        return netAdi(h) + ' en fazla ' + ust + ' nettir; şu anki ' + sayiYaz(s, 2) + ' netinle +'
          + sayiYaz(h.fark, 2) + ' bunu aşıyor.';
      }
      return null;
    },
    tarihSoru:TARIH_SORU,
    tarihOku(k, h, bugun){ return sinavaKadar(k, h.aile, bugun); },
    hiz(h){
      const t = netHizi(h);
      if(!t.hiz){
        return { neden:t.neden + '. Hızını senin denemelerinden hesaplıyorum; en az ' + EN_AZ_DENEME
          + (h.brans ? ' deneme' : ' tam deneme') + ' ve üç hafta gerekir. Denemelerini girince kararı veririm.' };
      }
      return { tipik:t.hiz, ust:yuvarla(t.hiz * H().ZORLAYICI_KAT, 2), birim:'net/hafta',
        dayanak:{ durum:'olculdu', metin:'senin son ' + t.deneme + (h.brans ? ' denemendeki ' + h.test + ' netin'
          : ' tam ' + h.aile + ' denemen') + ', ' + sayiYaz(t.hafta) + ' hafta: haftada +' + sayiYaz(t.hiz, 2)
          + ' net (medyan eğim)' } };
    },
  };

  const PAKETLER = [NET, KONU];
  const PAKET_BY_ID = { konu:KONU, net:NET };

  /* ------------------------------------------------------ sohbet notları */

  function notlar(h, g){
    const out = [];
    if(h.paket === 'konu' && g && g.bant){
      const kalan = kalanKonular(h.dersler).length;
      const cap = Number(R.S.profile && R.S.profile.capacityHoursPerWeek);
      out.push(kalan + ' konu kaldı; «kapandı» sayılması için kapanış kuralı geçer (ilk test ≥ %'
        + R.CLOSURE_RULE.first + ', ' + R.CLOSURE_RULE.gapDays + ' gün sonra ≥ %' + R.CLOSURE_RULE.second + ').');
      if(cap > 0) out.push('Toplam çalışma kapasiten haftada ' + sayiYaz(cap) + ' saat; bu hedefe ayırdığın vakit onun bir parçasıdır.');
    }
    if(h.paket === 'net' && g && g.bant){
      out.push('Net bir ölçümdür, bir söz değildir: puan ya da sıra garantisi vermem.');
    }
    return out;
  }

  /* ------------------------------------------------------------- depo */

  function gecerli(h){ return !!(h && h.id && H().DURUMLAR.indexOf(h.durum) >= 0); }

  async function yukle(){
    R.S.hedefler = ((await R.Store.list('hedefler')) || []).filter(gecerli);
  }

  async function kaydet(h){
    R.S.hedefler = (R.S.hedefler || []).filter(x => x.id !== h.id).concat([h]);
    await R.Store.set('hedefler/' + h.id, h);
    if(ag) ag.planla();
    return h;
  }

  function liste(){ return (R.S.hedefler || []).slice(); }
  function aktifler(){ return liste().filter(h => h.durum === 'aktif' || h.durum === 'askida'); }

  async function durumDegistir(id, yeni){
    const h = liste().find(x => x.id === id);
    if(!h) return { ok:false, why:'Hedef bulunamadı.' };
    const r = H().gecis(h, yeni, U().todayISO());
    if(r.ok) await kaydet(r.hedef);
    if(r.ok && (yeni === 'tamam' || yeni === 'birakildi') && R.HedefPlan){
      r.not = await R.HedefPlan.hedefKapandi(id);
    }
    return r;
  }

  /* Hedefin kısa adı — ekranda ve plan önizlemesinde. */
  function ozet(h){
    if(h.paket === 'konu') return (h.kapsam || 'Konular') + ': ' + (h.fark != null ? h.fark + ' konu bitir'
      : h.hedefDeger + ' konunun hepsini bitir');
    if(h.paket === 'net'){
      const s = h.simdi && h.simdi.deger != null ? sayiYaz(h.simdi.deger, 2) + ' → ' : '';
      return netAdi(h) + ' neti: ' + s + (h.hedefDeger != null ? sayiYaz(h.hedefDeger, 2)
        : '+' + sayiYaz(h.fark, 2));
    }
    return h.cumle;
  }

  /* Hedef ağı (brand/ortak/hedefag.js): etkin hedeflerin ÖZETİ HKM'ye,
     zaman bütçesinin cümlesi geri. HKM kapalıysa hiçbir şey olmaz. */
  function ozetler(){
    return aktifler().map(h => {
      const p = R.HedefPlan ? R.HedefPlan.aktif(h.id) : null;
      return LIFEOS.HedefAg.ozet(h, { ozet:ozet(h), plan:p ? { bitis:p.bitis } : null,
        ilerleme:p ? R.HedefPlan.ilerleme(p, U().todayISO()) : null });
    });
  }
  const ag = window.LIFEOS && LIFEOS.HedefAg
    ? LIFEOS.HedefAg.kur({ hkm:() => R.Beacon, modul:'ays', ozetler }) : null;

  const sohbet = window.LIFEOS && LIFEOS.Hedef ? LIFEOS.Hedef.sohbetKur({
    paketler:PAKETLER, modul:'ays', durum:() => ({}), bugun:() => U().todayISO(),
    kaydet, notlar,
    /* Soru beklerken gelen plan komutu («bu hafta ara») ya da BAM isteği
       cevap sanılmaz. */
    baskaIs:m => !!(R.Komut && R.Komut.anla(m).komut) || !!(window.LIFEOS && LIFEOS.Ofis && LIFEOS.Ofis.bamIstegi && LIFEOS.Ofis.bamIstegi(m)),
  }) : null;

  return { PAKETLER, PAKET_BY_ID, KONU, NET, SAAT_GUN, DERS_TEST, EN_AZ_DENEME,
    dersleriBul, kapsamBul, konular, kalanKonular, siraliKalan, durumOf, konuSaati, seri, netHizi, azami, netAdi, sinavTarihi,
    notlar, yukle, kaydet, liste, aktifler, durumDegistir, ozet, sohbet, ozetler, ag };
})();
