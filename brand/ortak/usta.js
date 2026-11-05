/* USTALIK ÇEKİRDEĞİ — bir becerinin KALICI olduğunu nasıl biliriz? (AYS, SPİ, ESP)

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/usta.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Testi `usta.test.js`.
   ==================================================================

   Kullanıcı (2026-11-05): «kullanıcıyı o dallarda en profesyonel ve en hızlı
   şekilde usta bir hale getirmenin altyapısını kur». Çekirdek tek soruya bakar:
   beceri, araya zaman girdikten sonra ipucusuz da tutuyor mu? Yeni bir ölçüm
   türü yok; modül kendi kaydını kanıta çevirip verir. Kelime, deneme konusu,
   temiz tempo ya da koşu hedefi aynı biçime iner.

   Kanıt: { g:'YYYY-AA-GG', isabet:bool, guven?:'emin'|'kararsiz'|'tahmin',
            ipucu?:bool, karisik?:bool }

   Dayanak: geri getirme ve aralıklı pratik en güçlü iki teknik (Dunlosky 2013);
   karışık sınama aktarımı artırır (Rohrer 2020); emin olup yanılmak en kolay
   düzelen ama geri dönebilen hatadır (Butterfield-Metcalfe 2001, Butler 2011).

   Sözler:
   1. SAF KURAL. Aynı girdi aynı çıktı; model yok, depo yok, saat yok (AGENTS §1.1).
   2. EKSİK SIFIR DEĞİL. Kanıtsız beceri «veri yok»tur, «öğreniyor» bile değildir;
      güveni işaretlenmemiş cevap isabet oranına girmez (AGENTS §1.2).
   3. ESİKLER SİSTEM AYARIDIR. ARA (1/7/21/60 gün) araştırmadan alınmış bir sayı
      değil, bu sistemin seçimidir; öyle sunulur.
   4. YARGI KAYDA, KİŞİYE DEĞİL. «Sağlam» bu becerinin kaydı için söylenir; kişi
      için yetenek yargısı ya da sertifika üretilmez (AGENTS §1.5). Bu yüzden
      son aşamanın adı «usta» değildir.
   5. XP'YE BAKMAZ, XP VERMEZ (AGENTS §1.6). */
window.LIFEOS.PARCA.yazilar({
  'ortak.usta.ogreniyor':'Öğreniyor',
  'ortak.usta.tutuyor':'Tutuyor',
  'ortak.usta.kalici':'Kalıcı',
  'ortak.usta.saglam':'Sağlam',
  'ortak.usta.veri-yok':'Veri yok',
});

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.USTA = (function(){
  'use strict';

  /* Sıradaki kanıt, kanıtlanmış en uzun aradan bir üst basamağa gider. */
  const ARA = { ilk:1, kalici:7, saglam:21, koru:60 };
  const ASAMALAR = ['yok', 'ogreniyor', 'tutuyor', 'kalici', 'saglam'];
  const ADLAR = () => ({ yok:yz('ortak.usta.veri-yok'), ogreniyor:yz('ortak.usta.ogreniyor'), tutuyor:yz('ortak.usta.tutuyor'),
    kalici:yz('ortak.usta.kalici'), saglam:yz('ortak.usta.saglam') });
  const EN_AZ_GUVEN = 10;

  const zaman = iso => { const p = String(iso).split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); };
  const fark = (a, b) => Math.round((zaman(b) - zaman(a)) / 864e5);
  function gunEkle(iso, n){ return new Date(zaman(iso) + n * 864e5).toISOString().slice(0, 10); }
  const sirali = k => (k || []).filter(x => x && x.g && typeof x.isabet === 'boolean')
    .map((x, i) => [x, i]).sort((a, b) => zaman(a[0].g) - zaman(b[0].g) || a[1] - b[1]).map(x => x[0]);

  /* Aşama. Yanlış zinciri keser: son ölçüm kazanır, eski başarı yeni unutmayı örtmez.
     Aynı gündeki ikinci doğru ara kanıtı sayılmaz (ara 0). İpuçlu cevap aşama
     kazandırmaz ve kırmaz: görülmüş cevap hatırlama ölçmez. */
  function asama(kanitlar, bugun){
    const k = sirali(kanitlar);
    if(!k.length) return { id:'yok', ad:ADLAR().yok, etiket:'veri yok', enUzun:0, sonraki:null, gecikti:0, kritik:false, n:0 };
    const temiz = k.filter(x => !x.ipucu);
    let son = null, enUzun = 0, karisik = false, kritik = false;
    temiz.forEach(x => {
      if(!x.isabet){ son = null; enUzun = 0; karisik = false; kritik = x.guven === 'emin'; return; }
      if(son) enUzun = Math.max(enUzun, fark(son, x.g));
      if(x.karisik) karisik = true;
      son = x.g; kritik = false;
    });
    const id = !son ? 'ogreniyor'
      : enUzun >= ARA.saglam && karisik ? 'saglam'
      : enUzun >= ARA.kalici ? 'kalici' : 'tutuyor';
    const hedef = id === 'saglam' ? ARA.koru : enUzun >= ARA.kalici ? ARA.saglam : enUzun >= ARA.ilk ? ARA.kalici : ARA.ilk;
    const sonraki = son ? gunEkle(son, hedef) : null;
    return { id, ad:ADLAR()[id], etiket:'hesaplandı', enUzun, sonraki, kritik, n:k.length,
      gecikti:sonraki && bugun && sonraki < bugun ? fark(sonraki, bugun) : 0 };
  }

  /* Güven isabeti: «emin» dediklerinde ne kadar tutuyor? Üstbiliş sinyalidir, puan
     değildir. Az kanıtta oran üretilmez. */
  function kalibrasyon(kanitlar){
    const cikti = {};
    ['emin', 'kararsiz', 'tahmin'].forEach(g => {
      const l = (kanitlar || []).filter(x => x && x.guven === g && typeof x.isabet === 'boolean');
      cikti[g] = { n:l.length, oran:l.length >= EN_AZ_GUVEN ? l.filter(x => x.isabet).length / l.length : null };
    });
    return cikti;
  }

  /* Sıradaki iş: önce emin olup yanıldıkların, sonra vadesi en çok geçenler,
     sonra öğrenilmekte olanlar, en son yeniler. Vadesi gelmemiş beceri sorulmaz. */
  function sira(beceriler, bugun, n){
    const puan = a => a.kritik ? 0 : a.sonraki && a.sonraki <= bugun ? 1 : a.id === 'ogreniyor' ? 2 : a.id === 'yok' ? 3 : null;
    const adaylar = (beceriler || []).map(b => ({ b, a:asama(b.kanitlar, bugun) }))
      .map(x => Object.assign(x, { p:puan(x.a) })).filter(x => x.p != null)
      .sort((x, y) => x.p - y.p || y.a.gecikti - x.a.gecikti);
    return karistir(adaylar).slice(0, n > 0 ? n : adaylar.length)
      .map(x => ({ id:x.b.id, grup:x.b.grup, asama:x.a.id, kritik:x.a.kritik, gecikti:x.a.gecikti }));
  }

  /* Aynı gruptan ikisi yan yana gelmesin (grup açık kalırsa sınavdaki gibi konu başlığı
     ipucu olur). Önceliği en az bozan aday seçilir; olmuyorsa yan yana kalır. */
  function karistir(l){
    const kalan = l.slice(), cikti = [];
    while(kalan.length){
      const onceki = cikti.length ? cikti[cikti.length - 1].b.grup : null;
      const i = kalan.findIndex(x => x.b.grup == null || x.b.grup !== onceki);
      cikti.push(kalan.splice(i < 0 ? 0 : i, 1)[0]);
    }
    return cikti;
  }

  /* Harita: kaç beceri hangi aşamada ve kaçı ölçüldü. */
  function harita(beceriler, bugun){
    const sayi = { yok:0, ogreniyor:0, tutuyor:0, kalici:0, saglam:0 };
    let kritik = 0, gecikti = 0;
    (beceriler || []).forEach(b => {
      const a = asama(b.kanitlar, bugun);
      sayi[a.id]++;
      if(a.kritik) kritik++;
      if(a.gecikti) gecikti++;
    });
    const toplam = (beceriler || []).length;
    return { sayi, toplam, olculen:toplam - sayi.yok, kritik, gecikti };
  }

  return { ARA, ASAMALAR, asama, kalibrasyon, sira, harita, gunEkle };
})();
