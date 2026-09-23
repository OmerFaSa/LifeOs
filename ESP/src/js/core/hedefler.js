/* ESP HEDEFLERİ — genel hedef motorunun (brand/ortak/hedef.js) ESP paketleri.

   Motor alanı bilmez; ESP'nin bildiği şunlardır:

     DİL (CEFR)    «Bir ayda İngilizcede A2'ye». Karar KAPASİTEYLE verilir:
                   seviyeler arası toplam saat ÷ haftalık vaktin. Saat tablosu
                   yaygın aktarılan rehberli öğrenme saati tahminleridir,
                   kaynağı bağlanmadı: karar «tahmin». CEFR bandı ESP
                   merdiveniyle aynı ölçek DEĞİLDİR ve birbirine çevrilmez
                   (data/evidence.js, lang.cefr); seviye bir öz-değerlendirmedir,
                   sertifika yerine geçmez.
     OKUMA         «Bu yıl 24 kitap». Kitap başına saat KENDİ ÖLÇÜMÜNDEN gelir
                   (bitirdiğin kitapların dönemindeki ölçülmüş okuma dakikası ÷
                   bitirilen kitap, en az iki kitap): karar «hesaplandı». Yoksa
                   ortalama bir kitap için 6 saat tahmini kullanılır.
     ENSTRÜMAN     «Bir yılda gitarda Kalfa'ya». Hedef, merdiven basamağının
                   TEMİZ TEMPO kapısıdır (data/curriculum.js). Hız KENDİ
                   KAYITLARINDAN gelir: son haftalarda temiz tempon haftada kaç
                   BPM arttı. «Temiz» kararı senin beyanın olduğu için karar
                   «tahmin»dir. Geçmiş yoksa karar verilmez ve SÖYLENİR.

   ESP sertifika vermez, yetenek yargısı kurmaz, sonuç garantisi etmez
   (AGENTS.md §1.5). */

window.ESP = window.ESP || {};

ESP.Hedefler = (function(){
  const H = () => window.LIFEOS.Hedef;
  const U = () => ESP.U;
  const HARF = 'a-zçğıöşü';
  const ONCE = '(?:^|[^' + HARF + '])';

  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }
  function sayiYaz(x, n){ return String(yuvarla(x, n == null ? 1 : n)).replace('.', ','); }

  /* ================================================================ DİL */

  const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  /* Toplam (sıfırdan) rehberli öğrenme saati — yaygın aktarılan aralıkların
     ÜST ucu: A1 90–100, A2 180–200, B1 350–400, B2 500–600, C1 700–800,
     C2 1000–1200. Üst uç seçildi: iyimser bir tablo, «olur» deyip
     olmayacak bir tarihe söz vermek demekti. */
  const CEFR_SAAT = { '0':0, A1:100, A2:200, B1:400, B2:600, C1:800, C2:1200 };
  const DILLER = [['ingilizce', 'İngilizce'], ['almanca', 'Almanca'], ['fransızca', 'Fransızca'],
    ['ispanyolca', 'İspanyolca'], ['italyanca', 'İtalyanca'], ['rusça', 'Rusça'],
    ['japonca', 'Japonca'], ['arapça', 'Arapça'], ['korece', 'Korece'], ['çince', 'Çince'],
    ['portekizce', 'Portekizce'], ['farsça', 'Farsça']];
  const CEFR_RE = new RegExp(ONCE + '([abc][12])(?![0-9])');

  function dilAdi(k){
    const d = DILLER.find(x => k.indexOf(x[0]) >= 0);
    return d ? d[1] : null;
  }

  const DIL = {
    id:'dil', ad:'Dil seviyesi', disc:'lang', olcut:{ ad:'seviye', birim:'saat' },
    /* CEFR seviyesi geçmeyen cümle dil HEDEFİ değildir: «İngilizceyi tekrar
       açmak istiyorum» bir bölüm isteğidir (core/komut.js). */
    anahtar:CEFR_RE,
    yonler:['seviye'], kapasiteGerekir:true,
    tani(k){
      const m = CEFR_RE.exec(k);
      if(!m) return null;
      const hedef = m[1].toUpperCase();
      return { yon:'seviye', hedefSeviye:hedef, dil:dilAdi(k) || 'Yabancı dil',
        hedefHam:{ deger:hedef, birim:'CEFR' }, birim:'saat' };
    },
    simdiSoru(h){
      return (h.dil || 'Bu dil') + ' için şu anki seviyen ne? A1, A2, B1… yaz; hiç '
        + 'başlamadıysan «sıfır» de. Bu bir öz-değerlendirmedir, sınav sonucu gerekmez.';
    },
    simdiOku(metin, h){
      const k = kucuk(metin);
      const m = /([abc][12])/.exec(k);
      let d = m ? m[1].toUpperCase() : /(sıfır|hiç|başlamadım|yeni başlıyorum|başlangıç)/.test(k) ? '0' : null;
      if(d == null) return null;
      if(CEFR_SAAT[d] >= CEFR_SAAT[h.hedefSeviye]){
        return { hata:'Şu anki seviyen hedefinle aynı ya da üstünde. Daha üst bir seviye yazarak '
          + 'hedefi yeniden kurabilirsin.' };
      }
      return { deger:d, birim:'CEFR', etiket:'tahmin' };
    },
    simdiHata:'Seviyeyi anlayamadım; A1, A2, B1, B2, C1, C2 ya da «sıfır» yaz.',
    gerekenSaat(h){
      if(!h.simdi || h.simdi.deger == null) return { neden:'Şu anki seviyen bilinmeden süre hesaplanamaz.' };
      const saat = CEFR_SAAT[h.hedefSeviye] - CEFR_SAAT[h.simdi.deger];
      if(!(saat > 0)) return { neden:'Hedef seviye şu anki seviyenin üstünde olmalı.' };
      return { saat, dayanak:{ durum:'kaynak_bekliyor', metin:'CEFR seviyeleri için yaygın aktarılan '
        + 'rehberli öğrenme saati tahminleri (sıfırdan A1 ≈ 100, A2 ≈ 200, B1 ≈ 400, B2 ≈ 600, '
        + 'C1 ≈ 800, C2 ≈ 1.200 saat); dile ve kişiye göre değişir, kaynağı henüz bağlanmadı' } };
    },
  };

  /* ============================================================== OKUMA */

  const KITAP_SAAT_TAHMIN = 6;
  const KITAP_PENCERE = 365;

  function bitenKitaplar(bugun){
    const alt = U().iso(U().addDays(U().parse(bugun), -KITAP_PENCERE));
    return (ESP.S.books || []).filter(b => b && b.finishedAt && b.finishedAt >= alt
      && b.finishedAt <= bugun && b.startedAt && b.startedAt <= b.finishedAt);
  }

  /* Kitap başına saat: bitirilen kitapların kapsadığı dönemdeki ÖLÇÜLMÜŞ
     okuma dakikası ÷ kitap sayısı. Oturumlar kitaba bağlı değil; bu yüzden
     tek tek kitap değil DÖNEM ölçülür. En az iki kitap: tek kitap bir hız
     değil bir örnektir. */
  function kitapSaati(bugunISO){
    const bugun = bugunISO || U().todayISO();
    const l = bitenKitaplar(bugun);
    if(l.length >= 2){
      const bas = l.map(b => b.startedAt).sort()[0];
      const bit = l.map(b => b.finishedAt).sort().slice(-1)[0];
      let dk = 0;
      Object.keys(ESP.S.days || {}).forEach(d => {
        if(d < bas || d > bit) return;
        (ESP.S.days[d].sessions || []).forEach(s => {
          if(s && s.disc === 'reading' && s.minutesCert === 'measured' && s.minutes > 0) dk += s.minutes;
        });
      });
      if(dk > 0){
        const saat = yuvarla(dk / 60 / l.length, 1);
        return { saat, etiket:'hesaplandi', dayanak:{ durum:'olculdu', metin:'bitirdiğin ' + l.length
          + ' kitabın döneminde ölçülen okuma süresi: kitap başına yaklaşık ' + sayiYaz(saat) + ' saat' } };
      }
    }
    return { saat:KITAP_SAAT_TAHMIN, etiket:'tahmin', dayanak:{ durum:'kaynak_bekliyor',
      metin:'ortalama bir kitap için yaklaşık 6 saat (≈ 80 bin kelime, dakikada ≈ 230 kelime '
        + 'sessiz okuma; yaygın tahmin, kaynağı bağlanmadı). Birkaç kitap bitirince kendi '
        + 'hızından hesaplanır' } };
  }

  const OKUMA = {
    id:'okuma', ad:'Okuma', disc:'reading', olcut:{ ad:'kitap', birim:'kitap' },
    anahtar:/kitap/, birimler:/kitap/,
    yonler:['artir'], kapasiteGerekir:true,
    /* «yılda 24 kitap», «bu yıl 20 kitap»: sayı ve dönem birlikte söylenir.
       Tarih YALNIZ bulunduysa verilir; bulunmazsa motorun genel ayrıştırıcısı
       ya da sorusu devreye girer. */
    tani(k, bugun){
      const m = /(\d{1,3})\s*kitap/.exec(k);
      if(!m) return null;
      const out = { yon:'artir', fark:Number(m[1]), birim:'kitap' };
      /* «3 ayda», «bir yılda» süreyi sayıyla söyler: onu genel ayrıştırıcı
         okur. Yalnız çıplak «yılda / ayda» dönem demektir. */
      const sayili = /(\d+|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on)\s*(gün|hafta|ay|yıl)/.test(k);
      if(/bu yıl|yıl sonuna/.test(k)) out.son_tarih = bugun.slice(0, 4) + '-12-31';
      else if(!sayili && /(?:^|[^a-zçğıöşü])yılda/.test(k)) out.son_tarih = H().ayEkle(bugun, 12);
      else if(!sayili && /(?:^|[^a-zçğıöşü])ayda/.test(k)) out.son_tarih = H().ayEkle(bugun, 1);
      return out;
    },
    /* Sayım bu andan başlar: «24 kitap» bundan sonra okunacak 24 kitaptır. */
    simdi:() => ({ deger:0, birim:'kitap', etiket:'hesaplandi', tarih:null }),
    gerekenSaat(h){
      const n = h.fark != null ? h.fark : h.hedefDeger;
      if(!(n > 0)) return { neden:'Kaç kitap okumak istediğin bilinmeden süre hesaplanamaz.' };
      const k = kitapSaati();
      return { saat:yuvarla(n * k.saat, 1), dayanak:k.dayanak, kitapSaat:k.saat };
    },
  };

  /* ========================================================= ENSTRÜMAN */

  const KADEME = [['acemi', 1], ['çırak', 2], ['kalfa', 3], ['usta', 4], ['üstat', 5]];
  const CALGI = '(gitar|enstrüman|müzik|piyano|keman|bağlama|bateri|çalgı)';
  const KADEME_RE = new RegExp(ONCE + '(acemi|çırak|kalfa|usta|üstat)');
  /* Basamağın temiz tempo eşiği MERDİVENDEN okunur (tek kaynak). 1.
     basamakta tempo kapısı yok; kapanış işi «60 BPM'de temiz» der. */
  function kademeBpm(rank){
    const l = ESP.LADDERS && ESP.LADDERS.music;
    const b = l && (l.levels || []).find(x => x.rank === rank);
    const g = b && (b.gates || []).find(x => x.metric === 'music.cleanBpm');
    return g ? g.min : rank === 1 ? 60 : null;
  }
  function kademeAdi(rank){ return (ESP.LEVEL_BY_RANK && ESP.LEVEL_BY_RANK[rank] || {}).label || String(rank); }

  function temizDenemeler(){
    const out = [];
    (ESP.S.pieces || []).forEach(p => (p.attempts || []).forEach(a => {
      if(a && a.clean && a.bpm > 0 && a.date) out.push({ date:a.date, bpm:a.bpm });
    }));
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  /* Kendi hızın: ilk haftadaki en yüksek temiz tempo ile bugüne kadarki
     en yüksek temiz tempo arasındaki fark ÷ geçen hafta. En az üç temiz
     deneme ve iki hafta gerekir: daha azı bir hız değil bir andır. */
  function temizHiz(){
    const l = temizDenemeler();
    if(l.length < 3) return { neden:l.length ? 'Yalnız ' + l.length + ' temiz deneme kaydın var' : 'Temiz tempo kaydın yok' };
    const ilk = l[0].date, son = l[l.length - 1].date;
    const gun = U().diffDays(ilk, son);
    if(gun < 14) return { neden:'Temiz tempo kayıtların ' + gun + ' günü kapsıyor; en az iki hafta gerekir' };
    const ilkHafta = U().iso(U().addDays(U().parse(ilk), 6));
    const bas = Math.max.apply(null, l.filter(x => x.date <= ilkHafta).map(x => x.bpm));
    const tepe = Math.max.apply(null, l.map(x => x.bpm));
    const hiz = yuvarla((tepe - bas) / (gun / 7), 1);
    if(!(hiz > 0)) return { neden:'Son ' + Math.round(gun / 7) + ' haftada temiz tempon artmadı (tıkanma)' };
    return { hiz, deneme:l.length, hafta:yuvarla(gun / 7, 1), artis:tepe - bas, tepe };
  }

  const ENSTRUMAN = {
    id:'enstruman', ad:'Enstrüman', disc:'music', olcut:{ ad:'temiz tempo', birim:'BPM' },
    /* Basamak adı ya da BPM geçmeyen cümle hedef değildir: «gitarı tekrar
       açmak istiyorum» bir bölüm isteğidir. */
    anahtar:new RegExp(CALGI + '[^.?!]*?' + ONCE + '(acemi|çırak|kalfa|usta|üstat|\\d+\\s*bpm)|'
      + ONCE + '(acemi|çırak|kalfa|usta|üstat|\\d+\\s*bpm)[^.?!]*?' + CALGI),
    birimler:/bpm/,
    yonler:['ulas'], kapasiteGerekir:true,
    tani(k){
      const b = /(\d{2,3})\s*bpm/.exec(k);
      if(b){
        const n = Number(b[1]);
        return n >= 30 && n <= 300 ? { yon:'ulas', egilim:'artir', hedefDeger:n, birim:'BPM' } : null;
      }
      const m = KADEME_RE.exec(k);
      if(!m) return null;
      const rank = (KADEME.find(x => x[0] === m[1]) || [])[1];
      const bpm = kademeBpm(rank);
      if(!bpm) return null;
      return { yon:'ulas', egilim:'artir', hedefDeger:bpm, hedefKademe:rank, birim:'BPM',
        hedefHam:{ deger:kademeAdi(rank), birim:'kademe' } };
    },
    simdi(){
      const l = temizDenemeler();
      if(!l.length) return null;
      const son = l[l.length - 1];
      return { deger:Math.max.apply(null, l.map(x => x.bpm)), birim:'BPM', etiket:'tahmin', tarih:son.date };
    },
    simdiSoru:'Temiz çalabildiğin en yüksek tempo kaç BPM? Bilmiyorsan «bilmiyorum» yaz; '
      + 'Stüdyo’da metronomla ölçebilirsin.',
    simdiOku(metin){
      const k = kucuk(metin);
      const m = /(\d{2,3})/.exec(k);
      if(m && Number(m[1]) >= 30 && Number(m[1]) <= 300) return { deger:Number(m[1]), birim:'BPM', etiket:'tahmin' };
      if(/(bilmiyorum|bilmem|ölçmedim)/.test(k)) return { deger:null, birim:'BPM', etiket:'veri_yok' };
      return null;
    },
    simdiHata:'Tempoyu anlayamadım; sayıyla yaz (ör. 90) ya da «bilmiyorum» de.',
    hiz(){
      const t = temizHiz();
      if(!t.hiz){
        return { neden:t.neden + '. Hızını senin kayıtlarından hesaplıyorum; Stüdyo’da iki hafta '
          + 'metronomla temiz tempo kaydet, sonra kararı veririm.' };
      }
      return { tipik:t.hiz, ust:yuvarla(t.hiz * 1.5, 1), birim:'BPM/hafta',
        dayanak:{ durum:'kendi_beyanin', metin:'senin temiz tempo kayıtların: ' + t.deneme + ' deneme, '
          + sayiYaz(t.hafta) + ' haftada +' + t.artis + ' BPM; «temiz» kararı senin beyanın' } };
    },
  };

  const PAKETLER = [DIL, ENSTRUMAN, OKUMA];
  const PAKET_BY_ID = { dil:DIL, enstruman:ENSTRUMAN, okuma:OKUMA };

  /* ------------------------------------------------------ sohbet notları */

  function notlar(h, g){
    const out = [];
    if(h.paket === 'dil'){
      out.push('Seviye bir öz-değerlendirmedir: CEFR bandı ESP merdiveniyle aynı ölçek değildir '
        + 've sertifika yerine geçmez.');
    }
    if(h.paket === 'enstruman' && h.hedefKademe){
      const l = ESP.LADDERS.music.levels.find(x => x.rank === h.hedefKademe);
      const oteki = (l ? l.gates : []).filter(x => x.metric !== 'music.cleanBpm').map(x => x.label);
      if(oteki.length){
        out.push(kademeAdi(h.hedefKademe) + ' basamağının öteki kapıları: ' + oteki.join(', ')
          + '. Tempo tek başına basamağı açmaz.');
      }
    }
    if(h.paket === 'okuma' && g && g.bant){
      const k = kitapSaati();
      out.push('Kitap başına ' + sayiYaz(k.saat) + ' saat hesaplandı ('
        + (k.etiket === 'hesaplandi' ? 'kendi ölçümün' : 'tahmin') + ').');
    }
    return out;
  }

  /* ------------------------------------------------------------- depo */

  function gecerli(h){ return !!(h && h.id && H().DURUMLAR.indexOf(h.durum) >= 0); }

  async function yukle(){
    ESP.S.hedefler = ((await ESP.Store.list('hedefler')) || []).filter(gecerli);
  }

  async function kaydet(h){
    ESP.S.hedefler = (ESP.S.hedefler || []).filter(x => x.id !== h.id).concat([h]);
    await ESP.Store.set('hedefler/' + h.id, h);
    return h;
  }

  function liste(){ return (ESP.S.hedefler || []).slice(); }
  function aktifler(){ return liste().filter(h => h.durum === 'aktif' || h.durum === 'askida'); }

  async function durumDegistir(id, yeni){
    const h = liste().find(x => x.id === id);
    if(!h) return { ok:false, why:'Hedef bulunamadı.' };
    const r = H().gecis(h, yeni, U().todayISO());
    if(r.ok) await kaydet(r.hedef);
    if(r.ok && (yeni === 'tamam' || yeni === 'birakildi') && ESP.HedefPlan){
      r.not = await ESP.HedefPlan.hedefKapandi(id);
    }
    return r;
  }

  /* Hedefin kısa adı — ekranda ve plan önizlemesinde. */
  function ozet(h){
    if(h.paket === 'dil') return (h.dil || 'Yabancı dil') + ': ' + (h.simdi && h.simdi.deger
      ? (h.simdi.deger === '0' ? 'sıfır' : h.simdi.deger) + ' → ' : '') + h.hedefSeviye;
    if(h.paket === 'okuma') return (h.fark || h.hedefDeger) + ' kitap';
    if(h.paket === 'enstruman') return 'Temiz tempo ' + (h.simdi && h.simdi.deger ? h.simdi.deger + ' → ' : '')
      + h.hedefDeger + ' BPM' + (h.hedefKademe ? ' (' + kademeAdi(h.hedefKademe) + ')' : '');
    return h.cumle;
  }

  const sohbet = window.LIFEOS && LIFEOS.Hedef ? LIFEOS.Hedef.sohbetKur({
    paketler:PAKETLER, modul:'esp', durum:() => ({}), bugun:() => U().todayISO(),
    kaydet, notlar,
  }) : null;

  return { PAKETLER, PAKET_BY_ID, DIL, OKUMA, ENSTRUMAN, CEFR, CEFR_SAAT, KITAP_SAAT_TAHMIN,
    kitapSaati, temizHiz, kademeBpm, kademeAdi, notlar, yukle, kaydet, liste, aktifler,
    durumDegistir, ozet, sohbet };
})();
