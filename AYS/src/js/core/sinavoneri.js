/* SINAV ÖNERİSİ — «hangi sınav bana uygun?» (cevaplı madde Y11).

   Kullanıcı: kariyer esnek; ilk adım akademi — LGS, YKS, KPSS, DGS, ALES, YDS
   önerisi, gerekçeli, karar kullanıcının. Öneri KURAL MOTORUNUNDUR: eğitim
   durumu ve hedef SORULUR (tahmin edilmez), uygunluk bu tablodan okunur,
   her satır gerekçesini taşır. Seçilen sınavın müfredatı mevcut yoldan
   (R.SinavProfil.iste → King → BAM) istenir; öneri hiçbir şeyi DEĞİŞTİRMEZ.

   Sözler:
     1. SORULMAYAN VARSAYILMAZ. Eğitim durumu yoksa öneri yok, soru var.
     2. KURAL GENELDİR, KILAVUZ KESİNDİR. Başvuru şartı her yıl ÖSYM/MEB
        kılavuzunda yazar; bu tablo genel kuraldır ve her satır bunu söyler.
     3. ANA SINAV DEĞİŞMEZ. Önerilen sınav ek profil olur; YKS planına
        dokunmak büyük aksiyondur (madde 10), burada yapılmaz. */

window.R = window.R || {};

R.SinavOneri = (function(){
  const EGITIM = [
    { id:'ortaokul',     ad:'Ortaokul (7–8. sınıf)' },
    { id:'lise',         ad:'Lise öğrencisi' },
    { id:'lise-mezun',   ad:'Lise mezunu' },
    { id:'onlisans',     ad:'Önlisans öğrencisi ya da mezunu' },
    { id:'lisans',       ad:'Lisans öğrencisi' },
    { id:'lisans-son',   ad:'Lisans son sınıf ya da mezunu' },
    { id:'lisansustu',   ad:'Yüksek lisans / doktora' },
  ];
  const HEDEF = [
    { id:'lise',        ad:'Liseye yerleşmek' },
    { id:'universite',  ad:'Üniversiteye (lisansa) yerleşmek' },
    { id:'gecis',       ad:'Önlisanstan lisansa geçmek' },
    { id:'kamu',        ad:'Kamuda çalışmak' },
    { id:'lisansustu',  ad:'Lisansüstü ya da akademik kariyer' },
    { id:'dil',         ad:'Yabancı dil belgesi' },
  ];

  /* Genel kural tablosu. `kimler`: girebilecek eğitim durumları;
     `sonra`: şimdi değil ama ileride girebilecekler. */
  const SINAVLAR = [
    { id:'lgs', ad:'LGS', kurum:'MEB', hedef:['lise'],
      kimler:['ortaokul'], sonra:[],
      ne:'8. sınıf sonunda merkezî sınavla lise yerleştirme.' },
    { id:'yks', ad:'YKS', kurum:'ÖSYM', hedef:['universite'],
      kimler:['lise', 'lise-mezun', 'onlisans', 'lisans', 'lisans-son'], sonra:['ortaokul'],
      ne:'Lisans ve önlisans programlarına yerleştirme (TYT + AYT/YDT).' },
    { id:'dgs', ad:'DGS', kurum:'ÖSYM', hedef:['gecis'],
      kimler:['onlisans'], sonra:['lise', 'lise-mezun'],
      ne:'Önlisans son sınıf öğrencisi ya da mezununun lisansın ara sınıfına geçişi.' },
    { id:'kpss', ad:'KPSS', kurum:'ÖSYM', hedef:['kamu'],
      kimler:['lise-mezun', 'onlisans', 'lisans-son', 'lisansustu'], sonra:['lise', 'lisans'],
      ne:'Kamu kadrolarına yerleştirme; ortaöğretim, önlisans ve lisans düzeyleri ayrıdır.' },
    { id:'ales', ad:'ALES', kurum:'ÖSYM', hedef:['lisansustu'],
      kimler:['lisans-son', 'lisansustu'], sonra:['lisans', 'onlisans', 'lise', 'lise-mezun'],
      ne:'Yüksek lisans, doktora ve akademik kadro başvurularında istenir.' },
    { id:'yds', ad:'YDS', kurum:'ÖSYM', hedef:['dil', 'lisansustu'],
      kimler:['lise-mezun', 'onlisans', 'lisans', 'lisans-son', 'lisansustu'], sonra:['lise', 'ortaokul'],
      ne:'Yabancı dil belgesi; lisansüstü ve akademik başvurularda dil şartını karşılar.' },
  ];
  const KILAVUZ = 'Genel kural; başvuru şartı her yıl ';

  function adOf(liste, id){ const x = liste.find(y => y.id === id); return x ? x.ad : null; }

  /* `oner({ egitim, hedef, etkin })` → { ok, soru? , satirlar } */
  function oner(p){
    const egitim = p && p.egitim;
    if(!adOf(EGITIM, egitim)){
      return { ok:false, soru:'Eğitim durumun ne? Öneri ona göre kurulur; tahmin etmem.' };
    }
    const hedef = adOf(HEDEF, p.hedef) ? p.hedef : null;
    const etkin = (p && p.etkin) || 'yks';
    const satirlar = SINAVLAR.map(s => {
      const uygun = s.kimler.indexOf(egitim) >= 0;
      const sonra = !uygun && s.sonra.indexOf(egitim) >= 0;
      const hedefte = !!hedef && s.hedef.indexOf(hedef) >= 0;
      const durum = uygun ? 'uygun' : (sonra ? 'sonra' : 'uygun değil');
      const gerekce = s.ne + ' '
        + (uygun ? adOf(EGITIM, egitim) + ' bu sınava genel kurala göre girebilir.'
          : sonra ? 'Şu an değil; eğitimin ilerleyince girebilirsin.'
          : adOf(EGITIM, egitim) + ' için bu sınav genel kurala göre uygun değil.')
        + (hedefte ? ' Seçtiğin hedefle («' + adOf(HEDEF, hedef) + '») örtüşüyor.' : '')
        + ' ' + KILAVUZ + s.kurum + ' kılavuzunda yazar.';
      return { id:s.id, ad:s.ad, kurum:s.kurum, durum, hedefte, etkin:s.id === etkin, gerekce,
        puan:(uygun ? 2 : sonra ? 1 : 0) * 10 + (hedefte ? 5 : 0) };
    }).sort((a, b) => b.puan - a.puan);
    return { ok:true, egitim, hedef, satirlar,
      not:hedef ? null : 'Hedefini de seçersen öneri ona göre sıralanır.' };
  }

  return { EGITIM, HEDEF, SINAVLAR, oner };
})();
