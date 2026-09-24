/* KONUŞARAK SİSTEMİ DEĞİŞTİRME — ESP.

   «Diksiyon çalışmak istemiyorum», «gitarı tekrar aç», «günlük taban 45
   dakika olsun» birer İSTEKTİR. Bu dosya onları MODEL ÇAĞIRMADAN tipli
   bir teklife çevirir (core/plans.js `talep`):

     bölüm aç/kapat   → bolum  { disc, on }     orta: önce sorulur
     günlük taban     → base   { minutes }      orta: önce sorulur

   Sohbet ve sesli sohbet aynı kapıdan geçer (`ESP.Office.send`): istek
   burada yakalanırsa model hiç çağrılmaz ve cevabı KURAL MOTORU yazar.
   Model «kapattım» deyip kapatmamış olamaz.

   Belirsiz cümle tahmin edilmez, sorulur (AGENTS.md §1.7): «bu bölümü
   kapat» hangi bölüm? Bir disiplin hakkında konuşmak («diksiyonda neden
   zorlanıyorum») bir istek değildir. */

window.ESP = window.ESP || {};

ESP.Komut = (function(){
  const U = ESP.U;
  const HARF = 'a-zçğıöşü';
  const ONCE = '(?<![' + HARF + '])';
  const SONRA = '(?![' + HARF + '])';

  function kucult(s){ return String(s || '').toLocaleLowerCase('tr'); }

  /* Disiplin takma adları. Ek almış hâlleri («gitarı», «diksiyonu»)
     kökten yakalanır; «dil» gibi kısa kökler yalnız bilinen eklerle. */
  const TAKMA = [
    ['lang', ['yabancı dil', 'ingilizce', 'almanca', 'fransızca', 'ispanyolca', 'italyanca',
      'rusça', 'japonca', ONCE + 'dil(?:i|e|de|den|ler)?' + SONRA]],
    ['philo', ['felsefe']],
    ['music', ['gitar', 'müzik', 'enstrüman', 'maestro']],
    ['diction', ['diksiyon', 'hitabet', 'artikülasyon']],
    ['reading', ['derin okuma', ONCE + 'okuma(?:yı|ya|da)?' + SONRA]],
    ['writing', ['yazı yazma', ONCE + 'yazı(?:yı|ya|da)?' + SONRA, ONCE + 'yazma(?:yı|ya)?' + SONRA]],
    ['history', [ONCE + 'tarih(?:i|e|te|ten)?' + SONRA + '(?=.*(bölüm|çalış|kapat|aç|iste))']],
  ].map(function(x){
    return { disc:x[0], re:new RegExp('(' + x[1].map(function(a){
      return a.indexOf('(') >= 0 ? a : ONCE + a; }).join('|') + ')') };
  });

  function discBul(t){
    const bulunan = [];
    TAKMA.forEach(function(x){ if(x.re.test(t)) bulunan.push(x.disc); });
    return bulunan;
  }

  const KAPAT_RE = new RegExp('(çalışmak istemiyorum|çalışmayacağım|istemiyorum|kapat|kapansın|gizle|'
    + 'bırakıyorum|bıraktım|ilgilenmiyorum|ilgilenmeyeceğim|' + ONCE + 'kaldır' + ')');
  /* Kapatma isteğinin KENDİSİ olan olumsuz sözler: «diksiyon istemiyorum»
     bir kapatma isteğidir. Olumsuzluk süzgeci (LIFEOS.Olumsuz) bunları
     hariç tutar; geri kalan olumsuzluk («diksiyonu kapatma») isteği
     durdurur ve sorulur (ekip/HATALAR.md KR-1). */
  const KAPAT_OLUMSUZ_RE = /(çalışmak istemiyorum|çalışmayacağım|istemiyorum|ilgilenmiyorum|ilgilenmeyeceğim)/;
  const AC_RE = new RegExp('(' + ONCE + 'aç' + SONRA + '|açılsın|açmak istiyorum|açar mısın|geri getir|'
    + 'başlamak istiyorum|çalışmak istiyorum|devam etmek istiyorum|tekrar aç)');
  const BOLUM_RE = /bölüm/;
  const TABAN_RE = /(günlük taban|taban|günde|günlük)/;
  const GELECEK_RE = /(olsun|çalışacağım|çalışacam|çalışıcam|yap|ayarla|çek|çıkar|düşür)/;
  const SURE_RE = new RegExp('(\\d+(?:[.,]\\d+)?|yarım|bir|iki|üç|dört|beş)\\s*(buçuk\\s*)?(saat|dakika|dk)' + SONRA);
  const SAYI = { yarım:0.5, bir:1, iki:2, 'üç':3, 'dört':4, 'beş':5 };

  function dakika(t){
    const m = t.match(SURE_RE);
    if(!m) return null;
    let n = SAYI[m[1]] != null ? SAYI[m[1]] : Number(String(m[1]).replace(',', '.'));
    if(!isFinite(n)) return null;
    if(m[2]) n += 0.5;
    return Math.round(m[3] === 'saat' ? n * 60 : n);
  }

  function parca(metin){
    const t = kucult(metin);
    const out = { oneriler:[], sorular:[] };
    const kapat = KAPAT_RE.test(t);
    const ac = !kapat && AC_RE.test(t);
    const discler = discBul(t);
    const taban = !kapat && !ac && TABAN_RE.test(t) && GELECEK_RE.test(t);

    if(kapat || ac || taban){
      const engel = LIFEOS.Olumsuz.eylemEngeli(metin, { haric:kapat ? KAPAT_OLUMSUZ_RE : null });
      if(engel){ out.sorular.push({ metin, soru:engel.soru }); return out; }
    }

    if(kapat || ac){
      if(!discler.length){
        if(BOLUM_RE.test(t)){
          out.sorular.push({ metin, soru:'Hangi bölümü ' + (kapat ? 'kapatayım' : 'açayım')
            + '? «diksiyon», «gitar», «felsefe» gibi adını söyler misin?' });
        }
        return out;
      }
      discler.forEach(function(d){
        out.oneriler.push({ kind:'bolum', payload:{ disc:d, on:!kapat }, metin });
      });
      return out;
    }

    if(taban){
      const dk = dakika(t);
      if(dk != null) out.oneriler.push({ kind:'base', payload:{ minutes:dk }, metin });
    }
    return out;
  }

  const AYRAC = /\s+(?:ve|ayrıca|bir de|sonra)\s+|[;]|,(?!\d)/gi;

  function anla(text){
    const ham = String(text || '').trim();
    const sonuc = { oneriler:[], sorular:[], komut:false };
    if(ham.length < 3) return sonuc;
    const parcalar = ham.split(AYRAC).map(function(x){ return String(x || '').trim(); })
      .filter(function(x){ return x.length > 2; });
    const liste = parcalar.length > 1 ? parcalar : [ham];
    liste.forEach(function(p){
      const r = parca(p);
      sonuc.oneriler.push.apply(sonuc.oneriler, r.oneriler);
      sonuc.sorular.push.apply(sonuc.sorular, r.sorular);
    });
    sonuc.komut = !!(sonuc.oneriler.length || sonuc.sorular.length);
    return sonuc;
  }

  /* ------------------------------------------------------- yürütme */

  async function isle(sonuc, opts){
    const o = opts || {};
    const yapilan = [], bekleyen = [], dusen = [];
    for(const x of (sonuc && sonuc.oneriler) || []){
      const t = await ESP.Plans.talep({ kind:x.kind, payload:x.payload, metin:x.metin || o.metin });
      if(!t.row){ dusen.push({ baslik:x.kind, why:t.why }); continue; }
      (t.otomatik ? yapilan : bekleyen).push({ baslik:t.row.title, row:t.row });
    }
    return { yapilan, bekleyen, dusen, sorular:(sonuc && sonuc.sorular) || [] };
  }

  function yanit(islem){
    const p = [];
    if(islem.yapilan.length){
      p.push('Yaptım: ' + islem.yapilan.map(function(k){ return k.baslik; }).join(' · ')
        + '. Geri almak istersen «geri al» de.');
    }
    if(islem.bekleyen.length){
      const bolum = islem.bekleyen.some(function(k){ return k.row && k.row.kind === 'bolum'; });
      p.push('Anladığım şu: ' + islem.bekleyen.map(function(k){ return k.baslik; }).join(' · ') + '. '
        + (bolum ? 'Verisi silinmez; istediğinde geri açılır. ' : '')
        + 'Onaylıyor musun? «evet» de ya da teklif listesinden onayla.');
    }
    if(islem.dusen.length){
      p.push('Bunu yapamadım: ' + islem.dusen.map(function(k){ return k.why || 'geçersiz'; }).join(' · '));
    }
    (islem.sorular || []).forEach(function(s){ p.push(s.soru); });
    return p.join('\n\n');
  }

  function kisaCevap(text){
    const t = kucult(text).replace(/[.!?,]+/g, ' ').replace(/\s+/g, ' ').trim();
    if(!t || t.length > 25) return null;
    if(/^(evet|onayla|onaylıyorum|uygula|tamam uygula|olur|tamam|tamamdır)$/.test(t)) return 'evet';
    if(/^(hayır|hayir|vazgeç|vazgec|vazgeçtim|iptal|istemiyorum|boş ver|boşver)$/.test(t)) return 'hayir';
    if(/^(geri al|geri alsana|onu geri al|geri alır mısın|son değişikliği geri al)$/.test(t)) return 'geri';
    return null;
  }

  /* Sohbet girişi. İstek değilse null döner ve mesaj ajana gider. */
  async function sohbet(agentId, text){
    /* Hafiza komutlari («hatırla: …», «hafızam», «3 unut») HKM ve oteki
       iki uygulamayla ayni dildir. Patron'a iletilmez: hafiza ajanin
       degil senindir, hangi masada soylersen orada yazilir. */
    if(ESP.Hafizam){
      const h = await ESP.Hafizam.komutIsle(text);
      if(h) return { text:h.text, source:'rules', oneriIds:[] };
    }
    /* Hedef sohbeti (core/hedefler.js): hedef cümlesi, sorulan eksiklerin
       cevabı ve seçenek seçimi. Hedef değilse null döner, sıradakine geçilir.
       Paketlerin anahtarı dar tutuldu: «gitarı tekrar açmak istiyorum» bir
       bölüm isteğidir, hedef değil. */
    if(ESP.Hedefler && ESP.Hedefler.sohbet){
      const hd = await ESP.Hedefler.sohbet.isle(text);
      if(hd) return { text:hd.text, source:'rules', oneriIds:[] };
    }
    const onEk = agentId === 'patron' ? '' : 'Patron’a ilettim. ';
    const cevap = function(m, ids){ return { text:onEk + m, source:'rules', oneriIds:ids || [] }; };
    const kisa = kisaCevap(text);

    if(kisa === 'geri'){
      const son = (ESP.S.proposals || [])
        .filter(function(p){ return p.source === 'istek' && p.state === 'accepted'; })
        .sort(function(a, b){ return String(b.decidedAt || '').localeCompare(String(a.decidedAt || '')); })[0];
      if(!son) return cevap('Geri alınacak bir değişikliğin yok.');
      const r = await ESP.Plans.geriAl(son.id);
      return cevap(r.ok ? 'Geri aldım: ' + son.title + '.' : 'Geri alamadım: ' + r.error);
    }
    if(kisa === 'evet' || kisa === 'hayir'){
      const bek = ESP.Plans.istekler();
      if(bek.length){
        if(kisa === 'hayir'){
          for(const p of bek) await ESP.Plans.decline(p.id);
          return cevap('Tamam, vazgeçtim; hiçbir şey değişmedi.');
        }
        let n = 0; const why = [];
        for(const p of bek){
          const r = await ESP.Plans.accept(p.id);
          if(r.ok) n++; else if(r.error) why.push(r.error);
        }
        return cevap(n ? 'Uyguladım. Geri almak istersen «geri al» de.'
          : 'Uygulayamadım: ' + (why.join(' · ') || 'istek geçersizleşmiş.'));
      }
    }

    const s = anla(text);
    if(!s.komut){
      /* «… arastir», «alistirma hazirla» — is HKM'deki BAM'a gider
         (brand/ortak/ofis.js). Model cagrilmaz. */
      if(window.LIFEOS && LIFEOS.Ofis && LIFEOS.Ofis.bamIstegi(text)){
        ESP.Bam = ESP.Bam || LIFEOS.Ofis.bamKur({ hkm:() => ESP.Beacon });
        return cevap((await ESP.Bam.ilet(text)).metin);
      }
      return null;
    }
    const islem = await isle(s, { metin:text });
    return cevap(yanit(islem), islem.bekleyen.map(function(k){ return k.row.id; }));
  }

  return { anla, isle, yanit, kisaCevap, sohbet, discBul, dakika };
})();
