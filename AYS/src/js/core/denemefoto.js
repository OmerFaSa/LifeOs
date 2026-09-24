/* DENEME SONUCU FOTOĞRAFTAN (fikir 7) — sonuç kâğıdının fotoğrafından
   test başına doğru / yanlış / boş.

   Sözler:
     1. MODEL YALNIZ OKUR, KOD DOĞRULAR. Model sayıları okur; her satır
        şablonun testiyle eşleşmeli, sayılar tam ve negatif olmamalı,
        D + Y + B testin soru sayısını AŞMAMALI. Tutmayan satır doldurulmaz
        ve NEDENİYLE söylenir (AGENTS §1.7: anlaşılmayan tahmin edilmez).
     2. KAYDETMEZ, DOLDURUR. Okunan sayılar «Deneme ekle» formuna yazılır;
        kaydetmek kullanıcının onayıdır ve form zaten önizlemedir.
     3. NET HESAPLANMAZ. Kâğıtta net yazsa da okunmaz: net kodla hesaplanır
        (doğru − yanlış/4). Boş okunamadıysa boş bırakılır; kayıtta soru
        sayısından «hesaplandı» olur (state.js `blankCertainty`).
     4. KÖR TAHMİN KORUNUR. Form doldurulduktan sonra yazılan net tahmini
        «kör değil» sayılır (screens/exams.js). */

window.R = window.R || {};

R.DenemeFoto = (function(){
  const MAX_BYTES = 8 * 1024 * 1024;
  const PROMPT = 'Bu bir deneme sınavı sonuç kâğıdı. Her test için doğru, yanlış ve boş '
    + 'sayısını oku. Yalnız JSON dizisi döndür: [{"test":"Türkçe","dogru":31,"yanlis":5,"bos":4}]. '
    + 'Okuyamadığın sayıyı null yaz, tahmin etme. Net, puan, sıralama ve kişisel bilgi yazma.';

  function tamSayi(x){
    if(x == null || x === '') return null;
    const n = Number(x);
    return Number.isInteger(n) && n >= 0 ? n : NaN;
  }

  /* Şablonun testine eşleme: tam ad, sonra «ad içinde geçer» (Türkçe ↔
     «Türkçe Testi»). İki teste birden uyan ad EŞLEŞMEZ. */
  function eslestir(ad, testler){
    const a = R.U.norm(ad).replace(/\s+/g, ' ').trim();
    if(!a) return -1;
    const tam = testler.findIndex(t => R.U.norm(t.name) === a);
    if(tam >= 0) return tam;
    const aday = testler.map((t, i) => ({ i, n:R.U.norm(t.name) }))
      .filter(x => a.indexOf(x.n) >= 0 || x.n.indexOf(a) >= 0);
    return aday.length === 1 ? aday[0].i : -1;
  }

  /* Saf doğrulama: ham model çıktısı + şablon → dolduralacak satırlar. */
  function dogrula(ham, tmpl){
    const testler = (tmpl && tmpl.tests) || [];
    const satirlar = [], atlanan = [];
    const dolu = {};
    (Array.isArray(ham) ? ham : []).forEach(x => {
      if(!x || typeof x !== 'object') return;
      const ad = String(x.test || '').trim();
      const i = eslestir(ad, testler);
      if(i < 0){ if(ad) atlanan.push({ ad, neden:'bu şablonda böyle bir test yok' }); return; }
      if(dolu[i]) return;
      const t = testler[i];
      const c = tamSayi(x.dogru), w = tamSayi(x.yanlis), b = tamSayi(x.bos);
      if([c, w, b].some(v => Number.isNaN(v))){
        atlanan.push({ ad:t.name, neden:'sayılar tam ve sıfır ya da üstü olmalı' }); return;
      }
      if(c == null || w == null){
        atlanan.push({ ad:t.name, neden:'doğru ya da yanlış okunamadı' }); return;
      }
      if(c + w + (b || 0) > t.q){
        atlanan.push({ ad:t.name, neden:'D + Y + B soru sayısını (' + t.q + ') aşıyor' }); return;
      }
      dolu[i] = true;
      satirlar.push({ i, ad:t.name, c, w, b, q:t.q });
    });
    return { satirlar:satirlar.sort((a, b) => a.i - b.i), atlanan,
      eksik:testler.filter((t, i) => !dolu[i]).map(t => t.name) };
  }

  function hazir(){ return !!(R.Solver && R.Solver.ready(true)); }

  async function oku(file, tmpl){
    if(!file) return { ok:false, note:'Fotoğraf seçilmedi.' };
    if(!/^image\//.test(file.type || '')) return { ok:false, note:'Bu bir görüntü dosyası değil.' };
    if(file.size > MAX_BYTES) return { ok:false, note:'Fotoğraf çok büyük (en fazla 8 MB).' };
    if(!hazir()) return { ok:false, note:'Fotoğraf okumak için görüntü okuyabilen bir model gerekir '
      + '(Ayarlar › Model). Sonuçları elle de yazabilirsin.' };
    let res;
    try{
      const im = await R.Solver.prepareImage(file);
      res = await R.LLM.complete(R.Solver.chainFor(true), {
        system:'Sen bir sınav sonuç kâğıdı okuyucususun. Yalnız JSON döndürürsün.',
        messages:[{ role:'user', text:PROMPT + ' Testler: '
          + tmpl.tests.map(t => t.name + ' (' + t.q + ' soru)').join(', ') + '.',
          images:[{ mime:im.mime, data:im.data }] }],
        maxTokens:600, temperature:0,
      });
    }catch(e){
      return { ok:false, note:'Model okuyamadı: ' + (R.LLM.errorText ? R.LLM.errorText(e && e.code) : 'hata') };
    }
    const metin = String((res && res.text) || '');
    let ham = null;
    try{ const m = metin.match(/\[[\s\S]*\]/); ham = m ? JSON.parse(m[0]) : null; }catch(e){ ham = null; }
    if(!Array.isArray(ham)) return { ok:false, note:'Fotoğraftan sonuç çıkarılamadı; sonuçları elle yaz.' };
    const d = dogrula(ham, tmpl);
    return Object.assign({ ok:d.satirlar.length > 0,
      note:d.satirlar.length ? '' : 'Okunan satırların hiçbiri doğrulamadan geçmedi; elle yaz.' }, d);
  }

  return { dogrula, oku, hazir, eslestir };
})();
