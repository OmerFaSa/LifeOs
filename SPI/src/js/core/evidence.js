/* Kanit motoru — bir esigin ne soylemeye yetkili oldugunu belirler.

   data/evidence.js kaynaklari tasir; bu dosya o kaynaklardan BIR KURAL
   cikarir ve kuralin uygulanmasini saglar:

     Yalnizca 'guideline' ve 'consensus' dereceli esikler YONLENDIREBILIR.

   Yonlendirme, kullaniciyi bir eyleme sevk eden cumledir: "hekime basvur",
   "bu degeri dusurmeye calis", "su besini artir". Gozlemsel bir iliskiden
   ya da bu sistemin kendi sectigi bir sayidan boyle bir cumle cikamaz.
   Cikabilecek olan sudur: "bu deger sectigimiz bandin disinda — bandin
   kendisi bir karar esigi degil".

   Uc kural:

   1. KAYNAGI OLMAYAN ESIK YONLENDIREMEZ. Bilinmeyen kaynak, iyi kaynak
      degildir. Bu, deponun "olculmemis veri sifir degildir" kuralinin
      kanit tarafindaki karsiligidir.

   2. KIRMIZI BAYRAK EN AZ 'consensus' OLMAK ZORUNDADIR. Sistemin en sert
      cumlesi ("hekime basvur") en zayif dayanaktan cikamaz. denetim()
      bunu tarar ve testler denetimin bos olmasini bekler.

   3. DERECE GIZLENMEZ. Arayuz esigi gosteriyorsa derecesini de gosterir.
      Kullanicinin "bu sayi nereden geliyor" sorusunun cevabi bir tik
      uzakta olmalidir. */

window.SP = window.SP || {};

SP.Ev = (function(){

  const BY_KEY = (function(){
    const m = {};
    (SP.EVIDENCE || []).forEach(function(e){
      m[e.marker + '/' + e.field] = e;
    });
    return m;
  })();

  function of(markerId, field){
    return BY_KEY[markerId + '/' + field] || null;
  }

  function gradeOf(markerId, field){
    const e = of(markerId, field);
    if(!e) return null;
    return SP.GRADE_BY_ID[e.grade] || null;
  }

  /* Bu esik bir DIREKTIF uretebilir mi?

     Kaynak yoksa hayir. Derecesi dusukse hayir. Ikisi de ayni sebepten:
     sistemin cumlesinin agirligi, dayanaginin agirligini asamaz. */
  function mayDirect(markerId, field){
    const g = gradeOf(markerId, field);
    return !!(g && g.mayDirect);
  }

  /* Bir esik hakkinda kullaniciya gosterilecek tek satir. */
  function line(markerId, field){
    const e = of(markerId, field);
    if(!e){
      return { grade:null, label:'kaynak yok', tone:'warn', mayDirect:false,
        text:'Bu eşiğin kaynağı yazılmamış. Kaynağı bilinmeyen bir eşik '
           + 'yönlendirme üretmez.' };
    }
    const g = SP.GRADE_BY_ID[e.grade] || {};
    return {
      grade:e.grade, label:g.label || e.grade, tone:g.tone || 'info',
      mayDirect:!!g.mayDirect,
      source:e.source, year:e.year || null, population:e.population || null,
      text:e.source + (e.year ? ' (' + e.year + ')' : '')
        + (e.population ? ' · ' + e.population : ''),
      note:e.note || g.note || '',
    };
  }

  /* Bir cumlenin tonunu kanita gore KISAR.

     Cagiran taraf ne demek istedigini `strength` ile soyler:
       'refer'   hekime yonlendirme
       'act'     davranis onerisi
       'observe' gozlem bildirimi

     Kanit yetmiyorsa cumle otomatik olarak 'observe' seviyesine iner ve
     neden indigi acikca yazilir. Sessizce zayiflatmak, kullaniciyi
     yaniltmanin baska bir bicimidir. */
  function temper(markerId, field, strength){
    const g = gradeOf(markerId, field);
    const izin = !!(g && g.mayDirect);
    if(strength === 'observe' || izin){
      return { strength:strength, downgraded:false, grade:g ? g.id : null };
    }
    return {
      strength:'observe', downgraded:true, grade:g ? g.id : null,
      why:g
        ? 'Bu eşik «' + g.label + '» derecesinde: ' + g.note
          + ' Bu yüzden burada yönlendirme değil gözlem bildirilir.'
        : 'Bu eşiğin kaynağı yazılmamış; kaynağı bilinmeyen bir eşikten '
          + 'yönlendirme çıkmaz.',
    };
  }

  /* ------------------------------------------------------------ kapsam */

  /* Kac esik kaynak tasiyor? Bosluklar da bir olcumdur ve gizlenmez. */
  function coverage(){
    const alanlar = ['ref', 'optimal', 'red'];
    let toplam = 0, kaynakli = 0, yonlendirebilen = 0;
    const eksik = [];

    (SP.BIOMARKERS || []).forEach(function(b){
      alanlar.forEach(function(f){
        const varMi = f === 'red'
          ? !!(b.red && (b.red.below != null || b.red.above != null))
          : !!b[f];
        if(!varMi) return;
        toplam++;
        const e = of(b.id, f);
        if(e){
          kaynakli++;
          if(mayDirect(b.id, f)) yonlendirebilen++;
        } else {
          eksik.push({ marker:b.id, name:b.name, field:f });
        }
      });
    });

    return { total:toplam, sourced:kaynakli, mayDirect:yonlendirebilen,
      missing:eksik, pct:toplam ? Math.round(100 * kaynakli / toplam) : 0 };
  }

  /* Denetim: sistemin en sert cumlesi en zayif dayanaktan cikmasin.

     Kirmizi bayragi olup kaynagi olmayan ya da derecesi yetmeyen her esik
     burada listelenir. Bos donmesi beklenir; dolu donmesi bir HATADIR ve
     testte kirilir. */
  function audit(){
    const sorunlar = [];
    (SP.BIOMARKERS || []).forEach(function(b){
      const kirmizi = b.red && (b.red.below != null || b.red.above != null);
      if(!kirmizi) return;
      const g = gradeOf(b.id, 'red');
      if(!g){
        sorunlar.push({ marker:b.id, name:b.name, kind:'no-source',
          note:'Kırmızı bayrak eşiğinin kaynağı yazılmamış.' });
      } else if(!g.mayDirect){
        sorunlar.push({ marker:b.id, name:b.name, kind:'weak-source',
          grade:g.id,
          note:'Kırmızı bayrak «' + g.label + '» derecesine dayanıyor; '
             + 'yönlendirme için yetersiz.' });
      }
    });
    return sorunlar;
  }

  /* Kilavuzlarin AYRISTIGI esikler. Ayrisma gizlenmez: iki kilavuzun ayni
     sayida birlesmemesi, kullanicinin bilmesi gereken bir seydir. */
  function disputed(){
    return (SP.EVIDENCE || []).filter(function(e){
      return /AYRIŞ|ayrış|DEĞİŞİR|değişir/.test(e.note || '')
        || /DEĞİŞİR|değişir/.test(e.population || '');
    });
  }

  return { of, gradeOf, mayDirect, line, temper, coverage, audit, disputed,
    GRADES:SP.EVIDENCE_GRADES };
})();
