/* Sik kelime kapsami — destenin, dilin en sik kelimelerinden kacini tuttugu.

   Liste data/kelimesiklik.js'tedir (OpenSubtitles sayimi, 'hesaplandı').
   Burada yalniz SAYMA yapilir: kartin on yuzu bir anahtara indirgenir,
   anahtar listede aranir.

   DOKTRIN: bu sayi «bildigin kelime» DEGILDIR (Dil Studyosu basligi:
   bilinen kelime olculemez, hatirlanan kelime olculur). Soylenen iki sey:
     destede    on yuzu bu kelime olan bir kart var
     oturmus    o kartin kutusu 4 ya da 5 (SRS'in «Yerleşti/Sağlam»i)
   Hata kartlari (tags:'hata') kelime kartı degildir, sayilmaz.

   Anahtar: kucuk harf, ilk alternatif («go / went», «Hund, der»), parantez
   ve uc noktalama atilir, bas tanimlik/«to» dusurulur. Sonunda TEK sozcuk
   kalmazsa kart kalip ya da cumledir; kelime kapsamina girmez. */

window.ESP = window.ESP || {};

ESP.Siklik = (function(){
  const BANTLAR = [100, 500, 1000, 2000];
  const OTURMUS_KUTU = 4;

  /* Bas tanimliklar: kart yazarken eklenen, sayimda ayri kelime olan sey. */
  const ON_EK = {
    en:['to', 'a', 'an', 'the'],
    de:['der', 'die', 'das', 'ein', 'eine', 'einen', 'sich'],
    fr:['le', 'la', 'les', 'un', 'une', 'des', 'se'],
    es:['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'se'],
    it:['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una'],
  };
  /* Kesmeyle yapisan tanimlik: l'homme, un'amica, s'appeler. */
  const KESME_EK = { fr:/^(l|s|d|j|m|t|n|qu)['’]/, it:/^(l|un|dell|all|nell|dall|sull)['’]/ };

  const listeler = {};

  function liste(dil){
    if(listeler[dil]) return listeler[dil];
    const ham = ESP.KELIME_SIKLIK && ESP.KELIME_SIKLIK.diller && ESP.KELIME_SIKLIK.diller[dil];
    if(!ham) return null;
    const kelimeler = ham.split(' ');
    const sira = Object.create(null);
    kelimeler.forEach((k, i) => { if(!(k in sira)) sira[k] = i; });
    return (listeler[dil] = { kelimeler, sira });
  }

  function anahtar(on, dil){
    let s = String(on || '').toLocaleLowerCase(dil || 'en');
    s = s.replace(/\([^)]*\)/g, ' ').split(/[,/;|]/)[0];
    s = s.replace(/[.!?¡¿«»"“”:]+/g, ' ').replace(/\s+/g, ' ').trim();
    const ekler = ON_EK[dil] || [];
    let parca = s.split(' ');
    while(parca.length > 1 && ekler.indexOf(parca[0]) !== -1) parca = parca.slice(1);
    if(parca.length !== 1) return null;
    let k = parca[0];
    if(KESME_EK[dil]) k = k.replace(KESME_EK[dil], '');
    return k || null;
  }

  /* Kart listesi -> { anahtar: en yuksek kutu }. Ayni kelimenin iki karti
     varsa en saglami sayilir; kapsam kelime basinadir, kart basina degil. */
  function desteHaritasi(kartlar, dil){
    const h = Object.create(null);
    (kartlar || []).forEach(c => {
      if(!c || (c.lang && c.lang !== dil) || (c.tags || []).indexOf('hata') !== -1) return;
      const k = anahtar(c.front, dil);
      if(k) h[k] = Math.max(h[k] || 0, c.box || 1);
    });
    return h;
  }

  /* { var, dil, n, bantlar:[{ ust, destede, oturmus, yok }], eksik:[kelime] }
     Liste yoksa { var:false } — «sifir kapsam» degil, olcum yok. */
  function kapsam(dil, kartlar, o){
    o = o || {};
    const L = liste(dil);
    if(!L) return { var:false, dil, neden:'liste-yok' };
    const h = desteHaritasi(kartlar, dil);
    const n = L.kelimeler.length;
    const bantlar = BANTLAR.filter(b => b <= n).map(ust => {
      let destede = 0, oturmus = 0;
      for(let i = 0; i < ust; i++){
        const kutu = h[L.kelimeler[i]];
        if(kutu){ destede++; if(kutu >= OTURMUS_KUTU) oturmus++; }
      }
      return { ust, destede, oturmus, yok:ust - destede };
    });
    const eksik = [];
    for(let i = 0; i < n && eksik.length < (o.eksik || 12); i++){
      if(!h[L.kelimeler[i]]) eksik.push(L.kelimeler[i]);
    }
    return { var:true, dil, n, bantlar, eksik };
  }

  /* Bir kelimenin sirasi (1'den baslar); listede yoksa null. */
  function sirasi(kelime, dil){
    const L = liste(dil);
    const k = anahtar(kelime, dil);
    return L && k != null && k in L.sira ? L.sira[k] + 1 : null;
  }

  return { BANTLAR, OTURMUS_KUTU, liste, anahtar, desteHaritasi, kapsam, sirasi };
})();
