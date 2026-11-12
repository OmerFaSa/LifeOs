/* TEKRAR MOTORU — dokuz ayrı tekrar zamanlayıcısının yerine tek FSRS (sadeleşme Faz 3).

   Karar (plan.html «kararlar»): tekrar FSRS; onaysız içerik taslak etiketiyle görünür,
   tekrara girmez. Keşif: belgeler/ekip/sadelesme/not-ve-tekrar.md §4-§5.
   Rapor ve açık sorular: belgeler/ekip/sadelesme/faz3-tekrar.md. Test: motor/tekrar.test.js.

   Formül kaynağı: FSRS-4.5, open-spaced-repetition/awesome-fsrs wiki «The Algorithm»
   (güncelleme formülleri FSRS v4 bölümünden, unutma eğrisi 4.5 bölümünden; G = 1..4 not):
     R(t,S)  = (1 + FACTOR·t/S)^DECAY             DECAY = −0,5   FACTOR = 19/81
     I(r,S)  = S/FACTOR · (r^(1/DECAY) − 1)       r = 0,9 iken I = S
     S0(G)   = w[G−1]                             D0(G) = w4 − (G−3)·w5
     D'(D,G) = w7·D0(3) + (1−w7)·(D − w6·(G−3))
     S'r     = S·(e^w8·(11−D)·S^−w9·(e^(w10·(1−R)) − 1)·w15[G=2]·w16[G=4] + 1)
     S'f     = w11·D^−w12·((S+1)^w13 − 1)·e^(w14·(1−R))
   Wiki'de olmayan iki kısıt (yaygın uygulamalardan, raporda «doğrulanmadı»): D [1,10]
   aralığında tutulur; unutma sonrası S eski S'yi geçmez.

   Sözler:
   1. SAF. Saat okunmaz: `simdi` (ms) hep dışarıdan gelir, yoksa TypeError. Aynı girdi
      aynı çıktı; bulanıklaştırma (fuzz) yok. Girdi kart değiştirilmez, yenisi döner.
   2. TASLAK TEKRARA GİRMEZ. `icerik` alanı varsa ve 'onayli' değilse kart planlanmaz ve
      cevaplanmaz; neden döner. Alanı olmayan kart kişinin kendi kartıdır.
   3. GÖSTERİLEN TAHMİN ETİKETLİDİR (AGENTS §1.2): hatırlama olasılığı 'tahmin', hiç
      sorulmamış kartta 'veri yok'. Göçle gelen S ve D de tahmindir (`goc` alanı söyler).
   4. GÖÇ VADEYİ DEĞİŞTİRMEZ: vade aynen kopyalanır; S, son cevaptan vadeye kalan aralık
      hedef oranda FSRS aralığına eşit olacak biçimde seçilir (ilk gün tekrar çığı olmaz).

   Kart: { id, zorluk (D), kararlilik (S, gün), son (ms), sonraki (ms, vade), tekrar,
           unutma, durum: 'yeni'|'tekrar'|'yeniden', icerik?, kapandi?, goc?, ... } */
(function(kok){
  'use strict';

  /* FSRS-4.5 yayımlanmış varsayılan 17 ağırlık (aynı wiki, 4.5 bölümü). Kişiye göre
     eniyileme yok: tek kullanıcıda ilk aylarda veri yetmez. */
  const W = Object.freeze([0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
    0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755]);
  const DECAY = -0.5, FACTOR = 19 / 81, GUN = 864e5;
  /* enUzun: FSRS uygulamalarının varsayılan en uzun aralığı (36500 gün). Tavanlar Anki'nin
     varsayılanları (20 yeni, 200 tekrar); sahibine soruldu (rapor, açık sorular). */
  const VARSAYILAN = Object.freeze({ hedef:0.9, enUzun:36500, yeniTavan:20, tekrarTavan:200 });

  /* Göç sabitleri: eski kaynak koddaki değerler; test kaynak dosyadan okuyup karşılaştırır. */
  const KAPANIS_GUN = 7;            // AYS/src/js/data/subjects.js CLOSURE_RULE.gapDays
  const OGRET_ARALIK = [1, 3, 7];   // brand/ortak/ogret.js ARALIK
  const KD_ARALIK = [1, 3, 7];      // brand/ortak/king-devrim.js KD_ARALIK

  const ayarOf = a => Object.assign({}, VARSAYILAN, a || {});
  const sikistir = (x, a, b) => Math.min(b, Math.max(a, x));
  const d0 = G => sikistir(W[4] - (G - 3) * W[5], 1, 10);
  const oran = (t, S) => Math.pow(1 + FACTOR * t / S, DECAY);
  const aralik = (S, r) => S / FACTOR * (Math.pow(r, 1 / DECAY) - 1);
  const tersAralik = (gun, r) => gun * FACTOR / (Math.pow(r, 1 / DECAY) - 1);
  function zaman(simdi){
    if(typeof simdi !== 'number' || !isFinite(simdi)) throw new TypeError('simdi (ms) verilmeli: motor saati kendisi okumaz');
    return simdi;
  }
  /* Göçte son cevap günü bilinmeyen kartta referans: vadeden S'nin aralığı kadar geri. */
  const sonEtkin = (k, a, simdi) => k.son != null ? k.son
    : k.sonraki != null ? k.sonraki - aralik(k.kararlilik, a.hedef) * GUN : simdi;

  function engel(k){
    if(!k || typeof k !== 'object') return 'kart yok';
    if(k.icerik != null && k.icerik !== 'onayli') return 'içerik onaylı değil (' + k.icerik + '): taslak tekrara girmez';
    if(k.kapandi) return 'kapandı';
    return null;
  }

  function yeniKart(id, ek){
    return Object.assign({ id, zorluk:null, kararlilik:null, son:null, sonraki:null, tekrar:0, unutma:0, durum:'yeni' }, ek || {});
  }

  /* Dört notun sonucu birlikte hesaplanır: düğme sırası ancak yan yana kıyasla kesinleşir. */
  function adaylar(k, simdi, a){
    const ilk = k.kararlilik == null || k.zorluk == null, D = k.zorluk, S = k.kararlilik;
    const R = ilk ? 1 : oran(Math.max(0, (simdi - sonEtkin(k, a, simdi)) / GUN), S);
    const c = [null];
    for(let G = 1; G <= 4; G++){
      const D2 = ilk ? d0(G) : sikistir(W[7] * d0(3) + (1 - W[7]) * (D - W[6] * (G - 3)), 1, 10);
      const S2 = ilk ? W[G - 1] : G === 1
        ? Math.min(S, W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R)))
        : S * (Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1)
          * (G === 2 ? W[15] : 1) * (G === 4 ? W[16] : 1) + 1);
      /* Yine: aynı oturumda yeniden sorulur (ESP'nin bugünkü davranışı); motor gün birimiyle çalışır. */
      c.push({ zorluk:D2, kararlilik:S2, gun:G === 1 ? 0 : Math.max(1, Math.round(aralik(S2, a.hedef))) });
    }
    /* Küçük S'de yuvarlama Zor/İyi/Kolay'ı eşitleyebilir; py-fsrs'teki düzeltmeyle kesin sıra. */
    c[2].gun = Math.min(c[2].gun, c[3].gun);
    c[3].gun = Math.max(c[3].gun, c[2].gun + 1);
    c[4].gun = Math.max(c[4].gun, c[3].gun + 1);
    c.forEach(x => { if(x) x.gun = Math.min(x.gun, a.enUzun); });
    return c;
  }

  /* Bir cevap: { ok:true, kart, gun } ya da { ok:false, neden }. not 1-4 = Yine/Zor/İyi/Kolay. */
  function cevapla(k, not, simdi, ayar){
    const neden = engel(k);
    if(neden && neden !== 'kapandı') return { ok:false, neden };
    zaman(simdi);
    if([1, 2, 3, 4].indexOf(not) < 0) return { ok:false, neden:'not 1-4 olmalı (Yine/Zor/İyi/Kolay)' };
    const c = adaylar(k, simdi, ayarOf(ayar))[not];
    const yeni = Object.assign({}, k, {
      zorluk:c.zorluk, kararlilik:c.kararlilik, son:simdi, sonraki:simdi + c.gun * GUN,
      tekrar:(k.tekrar || 0) + 1,
      unutma:(k.unutma || 0) + (not === 1 && k.durum === 'tekrar' ? 1 : 0),   // Anki gibi: yalnız öğrenilmiş kart unutulur
      durum:not === 1 ? 'yeniden' : 'tekrar',
    });
    if(not === 1) delete yeni.kapandi;   // ogret.js'teki gibi: yanlış, kapanmış kavramı yeniden açar
    return { ok:true, kart:yeni, gun:c.gun };
  }

  function hatirlama(k, simdi, ayar){
    zaman(simdi);
    if(!k || k.kararlilik == null) return { deger:null, etiket:'veri yok' };
    const a = ayarOf(ayar);
    return { deger:oran(Math.max(0, (simdi - sonEtkin(k, a, simdi)) / GUN), k.kararlilik), etiket:'tahmin' };
  }

  /* Günün planı. gunSonu (ms, isteğe bağlı): bugün bitmeden vadesi gelen de bugüne sayılır;
     yerel gün sınırını kabuk bilir, motor bilmez. yapilan: bugün zaten yapılan {yeni, tekrar}. */
  function plan(kartlar, simdi, ayar){
    zaman(simdi);
    const a = ayarOf(ayar), sinir = a.gunSonu != null ? a.gunSonu : simdi, yap = a.yapilan || {};
    const disarida = [], yeni = [], tekrar = [];
    (kartlar || []).forEach(k => {
      const neden = engel(k);
      if(neden) return disarida.push({ id:k && k.id, neden });
      if(k.sonraki != null && k.sonraki > sinir) return;
      (k.durum === 'yeni' ? yeni : tekrar).push(k);
    });
    /* Gecikme / kararlılık: aynı gecikme zayıf kartı daha çok unutturur. S bilinmeyen en öne;
       eşitlikte kimlik (belirlenimci). Yeni kartlar verildiği sırada kalır: sırayı Yol bilir. */
    const gecikme = k => k.kararlilik == null ? Infinity : (simdi - (k.sonraki == null ? simdi : k.sonraki)) / GUN / k.kararlilik;
    tekrar.sort((x, y) => (gecikme(y) - gecikme(x)) || (String(x.id) < String(y.id) ? -1 : String(x.id) > String(y.id) ? 1 : 0));
    const ky = Math.max(0, a.yeniTavan - (yap.yeni || 0)), kt = Math.max(0, a.tekrarTavan - (yap.tekrar || 0));
    return { tekrar:tekrar.slice(0, kt), yeni:yeni.slice(0, ky),
      bekleyen:{ tekrar:Math.max(0, tekrar.length - kt), yeni:Math.max(0, yeni.length - ky) }, disarida };
  }

  /* ------------------------------------------------------------- göç
     Her bağdaştırıcı eski kaydı bir FSRS kartına çevirir; vade aynen, sayılar korunur.
     Okunamayan vade → null (göç koşucusu ham kaydı yedekte tutar, AGENTS §1.2: uydurulmaz). */
  const gunMs = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof s === 'string' ? s : '');
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const sonGun = l => l.slice().sort().pop();
  function gocKart(o, ek, ayar){
    const a = ayarOf(ayar), ref = o.ref != null ? o.ref : o.son;
    const gun = o.sonraki != null && ref != null ? (o.sonraki - ref) / GUN : null;
    const S = o.S !== undefined ? o.S : gun > 0 ? tersAralik(gun, a.hedef) : null;
    return Object.assign({
      id:o.id, zorluk:S == null ? null : d0(3), kararlilik:S, son:o.son == null ? null : o.son,
      sonraki:o.sonraki == null ? null : o.sonraki, tekrar:o.tekrar || 0, unutma:o.unutma || 0,
      durum:o.durum || (o.tekrar ? (S == null ? 'yeniden' : 'tekrar') : 'yeni'), goc:o.goc,
    }, o.ek, ek || {});
  }
  const ustaKanit = l => (Array.isArray(l) ? l : []).filter(x => x && x.g && typeof x.isabet === 'boolean');

  const GOC = {
    /* 1 · AYS tekrar kartı — AYS/src/js/core/state.js newCard/schedule; dueAt, lastReviewedAt 'YYYY-AA-GG'. */
    aysKart(c, ek, ayar){
      if(!c || !c.id || gunMs(c.dueAt) == null) return null;
      const h = Array.isArray(c.history) ? c.history : [], son = gunMs(c.lastReviewedAt);
      return gocKart({ goc:'aysKart', id:'ays-kart:' + c.id, sonraki:gunMs(c.dueAt), son,
        tekrar:son == null ? 0 : Math.max(h.length, 1), unutma:h.filter(x => x && x.rating === 'forgot').length,
        ek:{ kaynak:'ays:cards/' + c.id, on:c.front, arka:c.back } }, ek, ayar);
    },
    /* 2 · AYS yanlış defteri → kart (screens/exams.js): kartın kendisi #1; bağ yanlış kaydına. */
    aysYanlis(c, ek, ayar){
      return c && c.source === 'error' ? GOC.aysKart(c, Object.assign({ yanlis:'ays:errors/' + c.sourceRef }, ek), ayar) : null;
    },
    /* 3 · AYS konu kapanış ölçümü — calc.js pendingSecondChecks: vade = firstAt + gapDays. */
    aysKapanis(st, konu, ek, ayar){
      const ilk = st && st.first != null ? gunMs(st.firstAt) : null;
      if(ilk == null) return null;
      const bitti = st.second != null;
      return gocKart({ goc:'aysKapanis', id:'ays-kapanis:' + konu, son:ilk, sonraki:bitti ? null : ilk + KAPANIS_GUN * GUN,
        tekrar:bitti ? 2 : 1, durum:bitti ? 'tekrar' : undefined,
        ek:Object.assign({ kaynak:'ays:topics/' + konu }, bitti ? { kapandi:st.secondAt || true } : {}) }, ek, ayar);
    },
    /* 4 · AYS hedef planı konu tekrarı — hedefplan.js: haftalar[].tekrar (konu adları), yalnız aktif plan. */
    aysHedefTekrar(p, ek, ayar){
      if(!p || p.durum !== 'aktif' || !Array.isArray(p.haftalar)) return [];
      const out = [];
      p.haftalar.forEach(h => (h.tekrar || []).forEach(ad => {
        const v = gunMs(h.bas);
        if(v != null) out.push(gocKart({ goc:'aysHedefTekrar', id:'ays-hedef:' + p.id + ':' + h.n + ':' + ad, sonraki:v,
          ek:{ kaynak:'ays:plan/' + p.id, on:ad } }, ek, ayar));
      }));
      return out;
    },
    /* 5 · ESP Leitner + ease — ESP/src/js/core/srs.js schedule; srs.js'in kendi sözü: «due − interval son cevap günüdür». */
    espKart(c, ek, ayar){
      const due = c ? gunMs(c.due) : null;
      if(!c || !c.id || due == null) return null;
      const iv = Number(c.interval) || 0, reps = Number(c.reps) || 0;
      return gocKart({ goc:'espKart', id:'esp-kart:' + c.id, sonraki:due, son:reps ? due - iv * GUN : null,
        S:reps && iv <= 0 ? W[0] : undefined,   // Yine'den sonra aralık 0: FSRS'in Yine başlangıcı
        tekrar:reps, unutma:Number(c.lapses) || 0,
        ek:{ kaynak:'esp:cards/' + c.id, on:c.front, arka:c.back, deste:c.lang } }, ek, ayar);
    },
    /* 6 · Öğretme motoru — brand/ortak/ogret.js isle: {n, sonraki|bitti, ogeler, y}; son = sonraki − ARALIK[n]. */
    ogret(k, kavram, depo, ek, ayar){
      if(!k || typeof k !== 'object') return null;
      const n = k.n || 0, y = k.y || 0, vade = k.bitti ? null : gunMs(k.sonraki);
      if(!k.bitti && vade == null) return null;
      return gocKart({ goc:'ogret', id:'ogret:' + depo + ':' + kavram, sonraki:vade,
        son:vade == null ? gunMs(k.bitti) : vade - OGRET_ARALIK[Math.min(n, 2)] * GUN,
        tekrar:Math.max(n + y, 1), unutma:y, durum:k.bitti ? 'tekrar' : undefined,
        ek:Object.assign({ kaynak:depo + '/' + kavram, ogeler:(k.ogeler || []).slice() }, k.bitti ? { kapandi:k.bitti } : {}) }, ek, ayar);
    },
    /* 7 · King dersleri — brand/ortak/king-devrim.js kdCevapla: ders.tekrar[i] = {n, sonraki|bitti:true}.
       Sorular model yazımı, sahip onayı yok → içerik taslak (karar: tekrara girmez); ek ile ezilebilir. */
    kingDers(d, ek, ayar){
      if(!d || !d.id || !Array.isArray(d.sorular)) return [];
      return d.sorular.map((q, i) => {
        const t = (d.tekrar || {})[i], vade = t && !t.bitti ? gunMs(t.sonraki) : null;
        return gocKart({ goc:'kingDers', id:'king-ders:' + d.id + ':' + i, sonraki:vade,
          son:vade == null ? null : vade - KD_ARALIK[Math.min(t.n || 0, 2)] * GUN,
          tekrar:t ? Math.max(t.n || 0, 1) : 0, durum:t && t.bitti ? 'tekrar' : undefined,
          ek:Object.assign({ kaynak:'lifeos.king.dersler/' + d.id + '/' + i, on:q && q.soru, icerik:'taslak' },
            t && t.bitti ? { kapandi:true } : {}) }, ek, ayar);
      });
    },
    /* 8 · Ustalık çekirdeği — brand/ortak/usta.js asama(): vade saklanmaz, kanıttan türer. Kural
       kopyalanmasın diye vadeyi çağıran verir: LIFEOS.USTA.asama(kanitlar, bugun).sonraki. */
    usta(id, kanitlar, sonraki, ek, ayar){
      const k = ustaKanit(kanitlar);
      if(!k.length) return null;
      const vade = sonraki == null ? null : gunMs(sonraki);
      const dogru = k.filter(x => x.isabet && !x.ipucu).map(x => x.g);
      return gocKart({ goc:'usta', id, sonraki:vade, son:gunMs(vade == null ? sonGun(k.map(x => x.g)) : sonGun(dogru)),
        tekrar:k.length, unutma:k.filter(x => !x.isabet).length }, ek, ayar);
    },
    /* 9a · Kavrat kartları — brand/ortak/kavrat.js: depo '<modul>.kavrat.kanit' = {konu: {kart.on: [kanıt]}}. */
    kavrat(v, modul, sonrakiOf, ek, ayar){
      const out = [];
      Object.keys(v || {}).forEach(konu => Object.keys(v[konu] || {}).forEach(on => {
        const c = GOC.usta('kavrat:' + modul + ':' + konu + ':' + on, v[konu][on], sonrakiOf(v[konu][on]),
          Object.assign({ goc:'kavrat', kaynak:modul + '.kavrat.kanit/' + konu, on }, ek), ayar);
        if(c) out.push(c);
      }));
      return out;
    },
    /* 9b · Öğrenme motoru — brand/ortak/ogrenmotor.js: kayit.k = {konuId: [kanıt]}. */
    ogrenmotor(k, modul, sonrakiOf, ek, ayar){
      const out = [];
      Object.keys(k || {}).forEach(konu => {
        const c = GOC.usta('ogren:' + modul + ':' + konu, k[konu], sonrakiOf(k[konu]),
          Object.assign({ goc:'ogrenmotor', kaynak:modul + '.ogren/' + konu }, ek), ayar);
        if(c) out.push(c);
      });
      return out;
    },
    /* Yetim · HKM meydan_deste (HKM/core/db.py): vade ISO an; son cevap bilinmez → kalan aralık göç anından. */
    meydan(r, simdi, ek, ayar){
      zaman(simdi);
      const vade = r && !r.silindi ? Date.parse(r.vade) : NaN;
      if(!isFinite(vade)) return null;
      return gocKart({ goc:'meydan', id:'meydan:' + r.anahtar, sonraki:vade, ref:simdi, tekrar:Number(r.tekrar) || 0,
        ek:{ kaynak:'hkm:meydan_deste/' + r.anahtar, on:r.on_yuz, arka:r.arka_yuz, deste:r.dil || r.kaynak } }, ek, ayar);
    },
  };

  /* Her bağdaştırıcının taşıyamadığı (ekranda «göçten tahmin» etiketinin dayanağı). */
  const ORTAK = 'zorluk (D) eski kayıttan çıkarılmadı: varsayılan D0(3), tahmin';
  const USTA_EKSIK = [ORTAK, 'güven, karışık, ipucu ayrıntısı S\'ye girmez', '«emin olup yanıldın» önceliği (kritik) motorda yok'];
  const EKSIK = Object.freeze({
    aysKart:[ORTAK, 'geçmiş 40 cevapla kırpılmış: tekrar/unutma alt sınır, öncesi göremedim',
      'konu riski sırası (prioritizedDue) motorda yok: alanın sıralama kancası'],
    aysYanlis:[ORTAK, 'kök neden, ilke, tarif yanlış kaydında kalır (Soru/Kayıt motoru)'],
    aysKapanis:[ORTAK, 'ölçüm yüzdeleri (first/second) ve 75/70 eşikleri ölçüm kaydında kalır', 'unutma: göremedim'],
    aysHedefTekrar:['30 dk blok süresi taşınmaz', 'vade haftanın ilk günü; geçmiş haftanın bloğu yapıldı mı: göremedim', 'geçmiş yok: durum yeni'],
    espKart:[ORTAK + ' (ease 1,3-2,8 eşlenmedi)', 'kutu (box) taşınmaz', 'geçmiş 50 cevapla kırpılmış (reps/lapses tam)'],
    ogret:[ORTAK, 'toplam cevap sayısı: göremedim; tekrar = n + y alt sınır', 'birleştirilmiş (birlestir) kayıtta son cevap günü yaklaşık'],
    kingDers:[ORTAK, 'unutma sayısı: göremedim (kayıtta yanlış sayısı yok)', 'kapanış günü: göremedim (bitti:true)', 'içerik taslak: onaylanana dek tekrara girmez'],
    usta:USTA_EKSIK, kavrat:USTA_EKSIK.concat('kavrat 30 kanıtla kırpılmış'), ogrenmotor:USTA_EKSIK,
    meydan:[ORTAK, 'son cevap zamanı: göremedim', 'unutma: göremedim', 'adim → meydan.ARALIK: kod silinmiş, göremedim',
      'son_puan anlamı: göremedim', 'vade saat dilimi: göremedim'],
  });

  const Tekrar = Object.freeze({ W, DECAY, FACTOR, VARSAYILAN, yeniKart, cevapla, hatirlama, plan, gunMs, GOC, EKSIK });
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Tekrar = Tekrar;
  if(typeof module !== 'undefined' && module.exports) module.exports = Tekrar;
})(typeof window !== 'undefined' ? window : globalThis);
