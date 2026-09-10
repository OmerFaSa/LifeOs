/* Kaynak (yayin) kaydi ve GERCEK zorluk olcumu.

   Iki ayri sey vardir ve karistirilmamalidir:

     ETIKET  — kaynagin kademesi (temel/orta/ust/resmi). Tohum listeden
               gelir ya da kullanici secer. Bir baslangic noktasidir.
     OLCUM   — o kaynaktan cozdugun sorularda SENIN oranin. Asil bilgi budur.

   Genel olarak %75 cozen ama bir kitapta %45'te kalan biri icin o kitap
   zordur — etiketinde ne yazarsa yazsin. relative() bunu soyler.

   OLCUM TEK OLCUMDEN CIKMAZ. Ev kurali burada da gecerli: alti sorudan
   cikan bir oran gurultudur. R.SOURCE_MIN_SAMPLE altinda oran HIC
   hesaplanmaz, "henuz yeterli kayit yok" denir. Uydurma bir zorluk
   etiketi, etiketsiz birakmaktan kotudur. */

window.R = window.R || {};

R.Sources = (function(){
  const U = R.U, S = R.S;

  function all(){ return (S.sources || []).slice(); }
  function byId(id){ return (S.sources || []).find(x => x.id === id) || null; }

  function newSource(fields){
    return Object.assign({
      id:U.uid('src'),
      name:'',
      level:'orta',
      kind:'banka',
      subjectId:null,      // yalniz bir derse aitse
      note:'',
      from:'',             // tohumdan geldiyse nereden
      addedAt:new Date().toISOString(),
    }, fields || {});
  }

  async function save(src){
    const rec = Object.assign(newSource(), src);
    rec.name = String(rec.name || '').trim().slice(0, 60);
    if(!rec.name) throw Object.assign(new Error('ad gerekli'), { code:'empty' });
    if(!R.SOURCE_LEVELS[rec.level]) rec.level = 'orta';
    if(!R.SOURCE_KINDS[rec.kind]) rec.kind = 'banka';

    S.sources = S.sources || [];
    const i = S.sources.findIndex(x => x.id === rec.id);
    if(i >= 0) S.sources[i] = rec; else S.sources.push(rec);
    await R.Store.set('sources/' + rec.id, rec);
    return rec;
  }

  async function remove(id){
    S.sources = (S.sources || []).filter(x => x.id !== id);
    await R.Store.remove('sources/' + id);
  }

  async function load(){
    const rows = await R.Store.list('sources');
    S.sources = (rows || []).filter(x => x && x.id && x.name);
    return S.sources;
  }

  /* Tohum liste BIR KEZ eklenir ve bir daha dokunulmaz: kullanici bir
     kaynagi sildiyse geri gelmemeli, kademesini degistirdiyse ustune
     yazilmamali. */
  async function seed(){
    if((S.sources || []).length) return S.sources;
    const flag = await R.Store.get('meta/sourceSeed');
    if(flag && flag.done) return S.sources || [];
    for(const row of R.SOURCE_SEED){
      await save(newSource(row));
    }
    await R.Store.set('meta/sourceSeed', { done:true, at:new Date().toISOString() });
    return S.sources;
  }

  /* ---------- olcum ---------- */

  /* Bir kaynaga bagli cozum kayitlari. Deneme kayitlari da sayilir:
     yayin adi eslesen denemeler ayni kaynagin olcumune girer. */
  function recordsOf(id){
    const src = byId(id);
    if(!src) return [];
    const name = U.norm(src.name);
    return (S.solved || []).filter(r =>
      r.sourceId === id || (!r.sourceId && r.sourceName && U.norm(r.sourceName) === name));
  }

  /* Genel oranin: butun kaynaklardaki cozum oranin.
     Karsilastirmanin tabani budur. */
  function overallRate(){
    const rows = (S.solved || []).filter(r => r.result);
    if(rows.length < R.SOURCE_MIN_SAMPLE) return null;
    const ok = rows.filter(R.Solver.solvedOk).length;
    return Math.round(100 * ok / rows.length);
  }

  /* Bir kaynagin olcumu. oran null ise yeterli kayit yok demektir —
     ekran bunu "henuz bilmiyoruz" diye gostermeli, sifir diye degil. */
  function measure(id){
    const rows = recordsOf(id).filter(r => r.result);
    const zor = rows.filter(r => r.difficulty);
    const ok = rows.filter(R.Solver.solvedOk).length;
    const enough = rows.length >= R.SOURCE_MIN_SAMPLE;
    return {
      soru:rows.length,
      cozulen:ok,
      yeterli:enough,
      eksik:Math.max(0, R.SOURCE_MIN_SAMPLE - rows.length),
      oran:enough ? Math.round(100 * ok / rows.length) : null,
      ortZorluk:zor.length ? U.round(zor.reduce((s, r) => s + r.difficulty, 0) / zor.length, 1) : null,
    };
  }

  /* Kaynagin SANA gore zorlugu: genel oranindan sapmasi.
     { durum:'zor'|'kolay'|'dengeli'|'bilinmiyor', fark, oran, genel } */
  function relative(id){
    const m = measure(id);
    const genel = overallRate();
    if(m.oran == null || genel == null){
      return { durum:'bilinmiyor', fark:null, oran:m.oran, genel, olcum:m };
    }
    const fark = m.oran - genel;
    const durum = fark <= -R.SOURCE_DELTA ? 'zor'
      : fark >= R.SOURCE_DELTA ? 'kolay' : 'dengeli';
    return { durum, fark, oran:m.oran, genel, olcum:m };
  }

  /* Ekran icin tek satirlik cumle. Sayiyi yorumlamak ekranin degil
     kural motorunun isi. */
  function sentence(id){
    const r = relative(id);
    const src = byId(id);
    const ad = src ? src.name : 'Bu kaynak';
    if(r.durum === 'bilinmiyor'){
      const m = r.olcum;
      return m.soru
        ? ad + ' için henüz karar verilemez: ' + m.soru + ' soru var, en az '
          + R.SOURCE_MIN_SAMPLE + ' gerekiyor.'
        : ad + ' için henüz çözüm kaydı yok.';
    }
    const yon = r.fark > 0 ? '+' : '';
    if(r.durum === 'zor'){
      return ad + ' sana göre ZOR: burada %' + r.oran + ' çözüyorsun, genel oranın %'
        + r.genel + ' (' + yon + r.fark + ').';
    }
    if(r.durum === 'kolay'){
      return ad + ' sana göre kolay: burada %' + r.oran + ', genel oranın %'
        + r.genel + ' (' + yon + r.fark + ').';
    }
    return ad + ' seviyene denk: %' + r.oran + ', genel oranın %' + r.genel + '.';
  }

  /* Butun kaynaklarin tablosu — en zoru ustte. Olcumu olmayanlar sona. */
  function table(){
    return all().map(src => Object.assign({ src }, relative(src.id)))
      .sort((a, b) => {
        if((a.fark == null) !== (b.fark == null)) return a.fark == null ? 1 : -1;
        if(a.fark == null) return a.src.name.localeCompare(b.src.name, 'tr');
        return a.fark - b.fark;
      });
  }

  /* ---------- merdiven kurali ----------
     Uygulamanin kendi kurali: "Temel oturmadan ust seviye yayina gecilmez."
     Kural motoru kapanis yuzdesini okur; uyari yalnizca VERI onu
     destekliyorsa cikar. */
  function ladderWarning(){
    const closure = R.Calc.overallClosure();
    if(!closure || closure.pct >= 55) return null;

    const recent = (S.solved || []).slice(0, 20);
    const ust = recent.filter(r => {
      const s = r.sourceId ? byId(r.sourceId) : null;
      return s && (s.level === 'ust' || s.level === 'resmi');
    });
    if(ust.length < 3) return null;
    return {
      pct:closure.pct,
      adet:ust.length,
      text:'Konu kapanışın %' + closure.pct + ' iken son ' + recent.length + ' sorunun '
        + ust.length + ' tanesi üst seviye kaynaktan. Ev kuralı: temel oturmadan üst '
        + 'seviye yayına geçilmez — zor kaynağı bitirmek başarı ölçütü değildir.',
    };
  }

  return {
    all, byId, newSource, save, remove, load, seed,
    recordsOf, overallRate, measure, relative, sentence, table, ladderWarning,
  };
})();
