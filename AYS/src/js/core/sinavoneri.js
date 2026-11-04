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
window.LIFEOS.PARCA.yazilar({
  'ays.core.sinavoneri.ortaokul-7-8-sinif':'Ortaokul (7–8. sınıf)',
  'ays.core.sinavoneri.lise-ogrencisi':'Lise öğrencisi',
  'ays.core.sinavoneri.lise-mezunu':'Lise mezunu',
  'ays.core.sinavoneri.onlisans-ogrencisi-ya-da-mez':'Önlisans öğrencisi ya da mezunu',
  'ays.core.sinavoneri.lisans-ogrencisi':'Lisans öğrencisi',
  'ays.core.sinavoneri.lisans-son-sinif-ya-da':'Lisans son sınıf ya da mezunu',
  'ays.core.sinavoneri.yuksek-lisans-doktora':'Yüksek lisans / doktora',
  'ays.core.sinavoneri.liseye-yerlesmek':'Liseye yerleşmek',
  'ays.core.sinavoneri.universiteye-lisansa-yerlesm':'Üniversiteye (lisansa) yerleşmek',
  'ays.core.sinavoneri.onlisanstan-lisansa-gecmek':'Önlisanstan lisansa geçmek',
  'ays.core.sinavoneri.kamuda-calismak':'Kamuda çalışmak',
  'ays.core.sinavoneri.lisansustu-ya-da-akademik-ka':'Lisansüstü ya da akademik kariyer',
  'ays.core.sinavoneri.yabanci-dil-belgesi':'Yabancı dil belgesi',
  'ays.core.sinavoneri.lgs':'LGS',
  'ays.core.sinavoneri.yks':'YKS',
  'ays.core.sinavoneri.dgs':'DGS',
  'ays.core.sinavoneri.kpss':'KPSS',
  'ays.core.sinavoneri.ales':'ALES',
  'ays.core.sinavoneri.yds':'YDS',
});


window.R = window.R || {};

R.SinavOneri = (function(){
  const EGITIM = [
    { id:'ortaokul',     ad:yz('ays.core.sinavoneri.ortaokul-7-8-sinif') },
    { id:'lise',         ad:yz('ays.core.sinavoneri.lise-ogrencisi') },
    { id:'lise-mezun',   ad:yz('ays.core.sinavoneri.lise-mezunu') },
    { id:'onlisans',     ad:yz('ays.core.sinavoneri.onlisans-ogrencisi-ya-da-mez') },
    { id:'lisans',       ad:yz('ays.core.sinavoneri.lisans-ogrencisi') },
    { id:'lisans-son',   ad:yz('ays.core.sinavoneri.lisans-son-sinif-ya-da') },
    { id:'lisansustu',   ad:yz('ays.core.sinavoneri.yuksek-lisans-doktora') },
  ];
  const HEDEF = [
    { id:'lise',        ad:yz('ays.core.sinavoneri.liseye-yerlesmek') },
    { id:'universite',  ad:yz('ays.core.sinavoneri.universiteye-lisansa-yerlesm') },
    { id:'gecis',       ad:yz('ays.core.sinavoneri.onlisanstan-lisansa-gecmek') },
    { id:'kamu',        ad:yz('ays.core.sinavoneri.kamuda-calismak') },
    { id:'lisansustu',  ad:yz('ays.core.sinavoneri.lisansustu-ya-da-akademik-ka') },
    { id:'dil',         ad:yz('ays.core.sinavoneri.yabanci-dil-belgesi') },
  ];

  /* Genel kural tablosu. `kimler`: girebilecek eğitim durumları;
     `sonra`: şimdi değil ama ileride girebilecekler. */
  const SINAVLAR = [
    { id:'lgs', ad:yz('ays.core.sinavoneri.lgs'), kurum:'MEB', hedef:['lise'],
      kimler:['ortaokul'], sonra:[],
      ne:'8. sınıf sonunda merkezî sınavla lise yerleştirme.' },
    { id:'yks', ad:yz('ays.core.sinavoneri.yks'), kurum:'ÖSYM', hedef:['universite'],
      kimler:['lise', 'lise-mezun', 'onlisans', 'lisans', 'lisans-son'], sonra:['ortaokul'],
      ne:'Lisans ve önlisans programlarına yerleştirme (TYT + AYT/YDT).' },
    { id:'dgs', ad:yz('ays.core.sinavoneri.dgs'), kurum:'ÖSYM', hedef:['gecis'],
      kimler:['onlisans'], sonra:['lise', 'lise-mezun'],
      ne:'Önlisans son sınıf öğrencisi ya da mezununun lisansın ara sınıfına geçişi.' },
    { id:'kpss', ad:yz('ays.core.sinavoneri.kpss'), kurum:'ÖSYM', hedef:['kamu'],
      kimler:['lise-mezun', 'onlisans', 'lisans-son', 'lisansustu'], sonra:['lise', 'lisans'],
      ne:'Kamu kadrolarına yerleştirme; ortaöğretim, önlisans ve lisans düzeyleri ayrıdır.' },
    { id:'ales', ad:yz('ays.core.sinavoneri.ales'), kurum:'ÖSYM', hedef:['lisansustu'],
      kimler:['lisans-son', 'lisansustu'], sonra:['lisans', 'onlisans', 'lise', 'lise-mezun'],
      ne:'Yüksek lisans, doktora ve akademik kadro başvurularında istenir.' },
    { id:'yds', ad:yz('ays.core.sinavoneri.yds'), kurum:'ÖSYM', hedef:['dil', 'lisansustu'],
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
