/* DENEME SORU ANALİZİ — cevap anahtarı + öğrencinin cevapları → soru soru
   sonuç; yanlış ve boş soruların fotoğrafı, konusu ve çözümü; hata kaydı,
   tekrar kartı ve yayın karnesi.

   Kullanıcı (2026-10-10): «denemeyi girdiğimde sistem baksın; yayınları
   analiz edip soruları bakabilecek bir sistem». Sorular öğrencinin kendi
   kitapçığından fotoğraflanır; yayının kitapçığı internetten çekilmez
   (telifli ve uygulama arkasında).

   Sözler:
     1. ANAHTAR VE CEVAP BEYANDIR, SONUÇ HESAPLANIR. Anahtarı ve cevapları
        kullanıcı yazar ya da yapıştırır; D/Y/B ve net kodla hesaplanır
        («hesaplandı»). Net formülü tek yerdedir (R.Model.testNet).
     2. KAYIT KENDİLİĞİNDEN DEĞİŞMEZ. Anahtardan hesaplanan D/Y/B kayıttakinden
        farklıysa fark gösterilir; kaydı güncellemek kullanıcının eylemidir
        ve önceki sayılar saklanıp geri alınabilir.
     3. BELİRSİZ GİRDİ TAHMİN EDİLMEZ (AGENTS §1.7). Soru sayısı tutmayan,
        A–E dışında harf içeren, numarası eksik ya da iki kez yazılmış anahtar
        kaydedilmez; nedeni söylenir. İptal soru anahtara «*» ile yazılır ve
        D/Y/B'ye girmez. Cevapta boş soru «.» ile yazılır.
     4. KONU TAHMİNDİR VE KAPALI KATALOGDAN GELİR. Model sorunun konusunu
        söyler, R.Solver kapalı katalogla eşler; eşleşmeyen ya da testin
        dersinden olmayan konu yazılmaz. Modelin konusu «tahmin», kullanıcının
        seçtiği «elle» etiketlidir ve elle seçileni model ezmez.
     5. DOĞRU CEVABI ANAHTAR BELİRLER. Model soruyu ANAHTARI GÖRMEDEN çözer;
        şıkkı anahtarla kod karşılaştırır: «tutuyor», «tutmuyor» ya da model
        şık bildirmediyse «karşılaştırılamadı». Tutmayan çözüm uyarıyla
        gösterilir, tekrar kartının arkasına yazılmaz.
     6. FOTOĞRAF CİHAZDAN ÇIKMAZ (core/sorufoto.js). Modele yalnız «Çöz»
        denince o tek fotoğraf gider.
     7. HATA KAYDI TEKTİR. Aynı deneme + test + soru için ikinci hata kaydı
        açılmaz; var olana bağlanır. Etiketi ve kök nedeni kullanıcı yazar
        (etiket boş başlar; etiketsiz hata dağılıma girmez).
     8. YAYIN KARNESİ HESAPLANIR, YETERSİZ VERİDE SUSAR. Konusu belli en az
        ESIK hata yoksa sayı değil cümle gösterilir. Yalnız yanlış ve boş
        sorular fotoğraflandığı için «o konudan kaç soru soruldu» bilinmez;
        karne bunu iddia etmez, hataların konu payını söyler. */

window.R = window.R || {};

R.DenemeAnaliz = (function(){
  const HARF = 'ABCDE';
  const ESIK = 5;
  const COZUM_SINIR = 4000;

  const norm = s => (R.U && R.U.norm ? R.U.norm(s) : String(s || '').toLowerCase());
  const M = () => R.Model;

  /* ---------- test → ders ---------- */

  /* Konu seçici ve modelin konusu bu derslerle sınırlıdır. Aile (TYT/AYT)
     «Matematik» gibi iki sınavda da geçen adları ayırır. */
  function dersler(testAdi, aile){
    const n = norm(testAdi);
    const tyt = aile !== 'AYT';
    if(/turkce/.test(n)) return ['tyt-turkce'];
    if(/sosyal/.test(n)) return ['tyt-sosyal'];
    if(/temel matematik/.test(n)) return ['tyt-matematik'];
    if(/matematik/.test(n)) return [tyt ? 'tyt-matematik' : 'ayt-matematik'];
    if(/fizik/.test(n)) return ['ayt-fizik'];
    if(/kimya/.test(n)) return ['ayt-kimya'];
    if(/biyoloji/.test(n)) return ['ayt-biyoloji'];
    if(/fen/.test(n)) return tyt ? ['tyt-fen'] : ['ayt-fizik', 'ayt-kimya', 'ayt-biyoloji'];
    return [];
  }

  function konuSecenekleri(exam, testAdi){
    const ids = dersler(testAdi, exam && exam.family);
    const kume = ids.length ? R.SUBJECTS.filter(s => ids.indexOf(s.id) >= 0) : R.SUBJECTS;
    return [{ value:'', label:'— konu —' }].concat(kume.reduce((acc, s) => acc.concat(s.topics.map(t => ({
      value:s.id + '::' + t.id, label:(kume.length > 1 ? s.name + ' · ' : '') + t.name }))), []));
  }

  function konuBul(topicRef){
    const p = String(topicRef || '').split('::');
    const subject = p.length === 2 ? R.SUBJECTS.find(s => s.id === p[0]) : null;
    const topic = subject ? subject.topics.find(t => t.id === p[1]) : null;
    return topic ? { subject, topic } : null;
  }

  /* ---------- ayrıştırma (söz 3) ---------- */

  /* Metin → q uzunluğunda dizi. tur: 'anahtar' (A–E, iptal «*») ya da
     'cevap' (A–E, boş «.»; «-» ve «_» de boş sayılır).
     İki biçim tanınır: harfler yan yana («ABCDE …», boşluklar yok sayılır)
     ya da numaralı («1-A 2-C», «1) A», «1.A»). */
  function ayristir(metin, q, tur){
    const cevap = tur === 'cevap';
    const s = String(metin == null ? '' : metin).toUpperCase();
    if(!s.trim()) return { ok:false, hata:'boş' };
    const cifts = [];
    const re = /(\d{1,3})\s*[-.):=]?\s*([A-E*.\-_])(?![A-ZÇĞİÖŞÜ])/g;
    let m;
    while((m = re.exec(s)) !== null) cifts.push([Number(m[1]), m[2]]);
    const beklenen = Number(q) || 0;
    const numarali = cifts.length >= Math.max(3, Math.ceil(beklenen / 2));
    let dizi;
    if(numarali){
      if(!beklenen) return { ok:false, hata:'soru sayısı bilinmiyor' };
      const l = new Array(beklenen).fill(null);
      for(const [no, h] of cifts){
        if(no < 1 || no > beklenen) return { ok:false, hata:no + '. soru yok (bu testte ' + beklenen + ' soru var)' };
        if(l[no - 1] != null && l[no - 1] !== h) return { ok:false, hata:no + '. soru iki kez farklı yazılmış' };
        l[no - 1] = h;
      }
      const eksik = l.map((h, i) => h == null ? i + 1 : null).filter(Boolean);
      if(eksik.length && !cevap) return { ok:false, hata:'şu soruların harfi yok: ' + eksik.slice(0, 6).join(', ') + (eksik.length > 6 ? '…' : '') };
      dizi = l.map(h => h == null ? '.' : h).join('');
    }else{
      dizi = s.replace(/[\s,;|]+/g, '');
      const izinli = cevap ? /^[A-E.\-_]$/ : /^[A-E*]$/;
      const kotu = Array.from(dizi).find(c => !izinli.test(c));
      if(kotu){
        const neden = !cevap && /[.\-_]/.test(kotu) ? 'anahtarda boş olmaz; iptal soru için * yaz'
          : cevap && kotu === '*' ? 'cevapta * olmaz; boş için nokta yaz' : '«' + kotu + '» geçersiz';
        return { ok:false, hata:neden };
      }
      if(beklenen && dizi.length !== beklenen) return { ok:false, hata:beklenen + ' soru bekleniyordu, ' + dizi.length + ' harf yazıldı' };
    }
    if(cevap) dizi = dizi.replace(/[\-_]/g, '.');
    if(!cevap && /[.\-_]/.test(dizi)) return { ok:false, hata:'anahtarda boş olmaz; iptal soru için * yaz' };
    return { ok:true, dizi };
  }

  /* ---------- karşılaştırma (söz 1) ---------- */

  function karsilastir(anahtar, cevap){
    const sorular = [];
    let d = 0, y = 0, b = 0, iptal = 0;
    for(let i = 0; i < anahtar.length; i++){
      const a = anahtar[i], c = (cevap || '')[i] || '.';
      let durum;
      if(a === '*'){ durum = 'iptal'; iptal++; }
      else if(c === '.'){ durum = 'bos'; b++; }
      else if(c === a){ durum = 'dogru'; d++; }
      else{ durum = 'yanlis'; y++; }
      sorular.push({ no:i + 1, anahtar:a, cevap:c, durum });
    }
    return { sorular, d, y, b, iptal, net:M().testNet({ correct:d, wrong:y }) };
  }

  /* Testin soru sayısı: şablondan; şablonda yoksa yazılmış anahtarın boyu. */
  function soruSayisi(exam, testAdi){
    const tmpl = (R.EXAM_TEMPLATES || []).find(t => t.id === exam.templateId);
    const t = tmpl && tmpl.tests.find(x => x.name === testAdi);
    if(t) return t.q;
    const a = (exam.anahtar || {})[testAdi];
    return a ? a.length : null;
  }

  function ozet(exam){
    const testler = (exam.tests || []).map(t => {
      const a = (exam.anahtar || {})[t.name], c = (exam.cevaplar || {})[t.name];
      const sonuc = a && c && a.length === c.length ? karsilastir(a, c) : null;
      const fark = !!sonuc && (sonuc.d !== Number(t.correct) || sonuc.y !== Number(t.wrong)
        || (t.blank != null && sonuc.b !== Number(t.blank)));
      return { ad:t.name, q:soruSayisi(exam, t.name), anahtarVar:!!a, cevapVar:!!c, sonuc,
        kayit:{ d:t.correct, y:t.wrong, b:t.blank }, fark };
    });
    return { testler, analizli:testler.some(t => t.sonuc), fark:testler.some(t => t.fark) };
  }

  /* Bir testin girdisini doğrular, yazmaz. Boş anahtar + boş cevap = sil. */
  function dogrula(exam, testAdi, anahtarMetni, cevapMetni){
    const q = soruSayisi(exam, testAdi);
    const bosA = !String(anahtarMetni || '').trim(), bosC = !String(cevapMetni || '').trim();
    if(bosA && bosC) return { ok:true, sil:true };
    if(bosA) return { ok:false, hata:testAdi + ': cevap anahtarı yazılmadı' };
    const a = ayristir(anahtarMetni, q, 'anahtar');
    if(!a.ok) return { ok:false, hata:testAdi + ' anahtarı: ' + a.hata };
    if(bosC) return { ok:true, anahtar:a.dizi, cevap:null };
    const c = ayristir(cevapMetni, a.dizi.length, 'cevap');
    if(!c.ok) return { ok:false, hata:testAdi + ' cevapları: ' + c.hata };
    return { ok:true, anahtar:a.dizi, cevap:c.dizi };
  }

  /* Bütün testleri önce doğrular; biri bozuksa HİÇBİRİ yazılmaz.
     girdiler: [{ test, anahtar, cevap }]. Döner: { ok, hatalar:[…] }. */
  async function girdileriYaz(exam, girdiler){
    const sonuc = (girdiler || []).map(g => Object.assign({ test:g.test }, dogrula(exam, g.test, g.anahtar, g.cevap)));
    const hatalar = sonuc.filter(x => !x.ok).map(x => x.hata);
    if(hatalar.length) return { ok:false, hatalar };
    exam.anahtar = Object.assign({}, exam.anahtar || {});
    exam.cevaplar = Object.assign({}, exam.cevaplar || {});
    sonuc.forEach(x => {
      if(x.sil){ delete exam.anahtar[x.test]; delete exam.cevaplar[x.test]; return; }
      exam.anahtar[x.test] = x.anahtar;
      if(x.cevap) exam.cevaplar[x.test] = x.cevap; else delete exam.cevaplar[x.test];
    });
    await M().saveExam(exam);
    return { ok:true, hatalar:[] };
  }

  /* ---------- kaydı güncelleme (söz 2) ---------- */

  async function kaydiGuncelle(exam){
    const oz = ozet(exam);
    const degisen = oz.testler.filter(t => t.fark);
    if(!degisen.length) return 0;
    exam.anahtarOncesi = { at:new Date().toISOString(),
      tests:exam.tests.map(t => ({ name:t.name, correct:t.correct, wrong:t.wrong, blank:t.blank, blankCert:t.blankCert })) };
    degisen.forEach(x => {
      const t = exam.tests.find(z => z.name === x.ad);
      t.correct = x.sonuc.d; t.wrong = x.sonuc.y; t.blank = x.sonuc.b; t.blankCert = 'measured';
    });
    await M().saveExam(exam);
    return degisen.length;
  }

  async function geriAl(exam){
    const o = exam.anahtarOncesi;
    if(!o) return false;
    o.tests.forEach(x => {
      const t = exam.tests.find(z => z.name === x.name);
      if(t){ t.correct = x.correct; t.wrong = x.wrong; t.blank = x.blank; t.blankCert = x.blankCert; }
    });
    delete exam.anahtarOncesi;
    await M().saveExam(exam);
    return true;
  }

  /* ---------- yanlış ve boş sorular ---------- */

  const anahtarOf = (test, no) => test + '#' + no;
  function bol(key){
    const i = String(key).lastIndexOf('#');
    return [String(key).slice(0, i), Number(String(key).slice(i + 1))];
  }
  const sahip = (exam, key) => 'deneme:' + exam.id + ':' + key;

  function hataOf(exam, test, no){
    return (R.S.errors || []).find(e => e.examId === exam.id && e.testName === test && String(e.questionNo) === String(no)) || null;
  }

  function yanlislar(exam){
    const liste = [];
    ozet(exam).testler.forEach(t => {
      if(!t.sonuc) return;
      t.sonuc.sorular.forEach(s => {
        if(s.durum !== 'yanlis' && s.durum !== 'bos') return;
        const key = anahtarOf(t.ad, s.no);
        liste.push({ test:t.ad, no:s.no, durum:s.durum, cevap:s.cevap, anahtar:s.anahtar, key,
          analiz:(exam.soruAnaliz || {})[key] || null, hata:hataOf(exam, t.ad, s.no) });
      });
    });
    return liste;
  }

  function analizAl(exam, key, olustur){
    if(!exam.soruAnaliz && !olustur) return null;
    exam.soruAnaliz = exam.soruAnaliz || {};
    if(!exam.soruAnaliz[key] && olustur) exam.soruAnaliz[key] = {};
    return exam.soruAnaliz[key] || null;
  }

  /* Bağlı hata kaydının konusu, kullanıcı onu ayrıca değiştirmediyse
     (hâlâ analizin eski konusuysa ya da boşsa) analizle birlikte güncellenir. */
  async function hataKonusunuEsle(exam, key, eskiRef){
    const [test, no] = bol(key);
    const err = hataOf(exam, test, no);
    const a = analizAl(exam, key, false);
    if(!err || !a) return;
    if(err.topicRef && err.topicRef !== eskiRef) return;
    const k = konuBul(a.topicRef);
    err.topicRef = k ? a.topicRef : '';
    err.subjectId = k ? k.subject.id : null;
    err.topicId = k ? k.topic.id : null;
    err.topic = k ? k.topic.name : '';
    await M().saveError(err);
  }

  /* kaynak: 'elle' | 'tahmin'. topicRef boşsa konu silinir. */
  async function konuYaz(exam, key, topicRef, kaynak){
    const [test] = bol(key);
    const a = analizAl(exam, key, true);
    const eski = a.topicRef || '';
    if(!topicRef){
      delete a.topicRef; delete a.konuKaynak;
    }else{
      const k = konuBul(topicRef);
      if(!k) return { ok:false, note:'Bu konu katalogda yok.' };
      const ids = dersler(test, exam.family);
      if(ids.length && ids.indexOf(k.subject.id) < 0) return { ok:false, note:'Bu konu ' + test + ' testinin dersinden değil.' };
      a.topicRef = topicRef;
      a.konuKaynak = kaynak === 'tahmin' ? 'tahmin' : 'elle';
    }
    await M().saveExam(exam);
    await hataKonusunuEsle(exam, key, eski);
    return { ok:true };
  }

  /* ---------- çözdürme (söz 4, 5, 6) ---------- */

  function anahtarHarfi(exam, test, no){
    const a = (exam.anahtar || {})[test];
    return a ? a[no - 1] || null : null;
  }

  function hazir(){ return !!(R.Solver && R.Solver.ready && R.Solver.ready(true)); }

  async function coz(exam, key, opts){
    const o = opts || {};
    const [test, no] = bol(key);
    const blob = R.SoruFoto ? await R.SoruFoto.al(sahip(exam, key)) : null;
    if(!blob) return { ok:false, note:'Önce sorunun fotoğrafını ekle.' };
    if(!hazir()) return { ok:false, note:'Çözmek için görüntü okuyabilen bir model gerekir (Ayarlar › Model). Konuyu elle seçebilirsin.' };
    let im, r;
    try{ im = await R.Solver.prepareImage(blob); }
    catch(e){ return { ok:false, note:'Fotoğraf modele hazırlanamadı.' }; }
    try{
      /* Anahtar modele VERİLMEZ: model anahtarı bilirse çözümü ona uydurur
         ve anahtarla karşılaştırma bir denetim olmaktan çıkar. */
      r = await R.Solver.solve({ image:im,
        note:'Bu soru bir deneme sınavından: ' + test + ' testi, ' + no + '. soru. Beş şıklı bir sorudur; '
          + 'cevabını şık harfiyle (A–E) bildir.' }, { signal:o.signal });
    }catch(e){
      return { ok:false, note:'Model çözemedi: ' + (R.LLM && R.LLM.errorText ? R.LLM.errorText(e && e.code) : 'hata') };
    }
    const m = (r && r.meta) || {};
    const harf = R.Solver.optionLetter ? R.Solver.optionLetter(m.answer || '') : null;
    const dogru = anahtarHarfi(exam, test, no);
    const tutar = harf && dogru && dogru !== '*' ? harf.toUpperCase() === dogru : null;
    const a = analizAl(exam, key, true);
    const eski = a.topicRef || '';
    a.cozum = String((r && r.text) || '').slice(0, COZUM_SINIR);
    a.modelCevap = harf ? harf.toUpperCase() : String(m.answer || '').slice(0, 40);
    a.tutar = tutar;
    a.model = (r && r.model) || '';
    a.cozumAt = new Date().toISOString();
    let konuNotu = '';
    if(m.subjectId && m.topicId){
      const ids = dersler(test, exam.family);
      if(ids.length && ids.indexOf(m.subjectId) < 0) konuNotu = 'Model başka bir dersten konu söyledi; yazılmadı.';
      else if(!(a.topicRef && a.konuKaynak === 'elle')){ a.topicRef = m.subjectId + '::' + m.topicId; a.konuKaynak = 'tahmin'; }
    }else if(m.rawTopic){
      konuNotu = 'Modelin söylediği konu («' + m.rawTopic + '») katalogda yok; konuyu elle seç.';
    }
    await M().saveExam(exam);
    if(a.topicRef !== eski) await hataKonusunuEsle(exam, key, eski);
    return { ok:true, tutar, harf:a.modelCevap, dogru, topicRef:a.topicRef || null, konuNotu };
  }

  /* ---------- hata kaydı (söz 7) ---------- */

  async function hatayaEkle(exam, key){
    const satir = yanlislar(exam).find(x => x.key === key);
    if(!satir) return { ok:false, note:'Bu soru yanlış ya da boş değil.' };
    const [test, no] = bol(key);
    const a = analizAl(exam, key, true);
    const var_ = hataOf(exam, test, no);
    if(var_){
      a.errorId = var_.id;
      await M().saveExam(exam);
      return { ok:true, vardi:true, err:var_ };
    }
    const k = konuBul(a.topicRef);
    const err = {
      id:R.U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null,
      examId:exam.id, examDate:exam.date, publisher:exam.publisher || '',
      testName:test, questionNo:String(no), status:satir.durum === 'bos' ? 'Boş' : 'Yanlış',
      tag:null, seconds:null, rootCause:'', principle:'', similar:'', recipe:'',
      topicRef:k ? a.topicRef : '', subjectId:k ? k.subject.id : null, topicId:k ? k.topic.id : null, topic:k ? k.topic.name : '',
      kaynak:'anahtar', cevap:satir.cevap === '.' ? '' : satir.cevap, dogruCevap:satir.anahtar,
    };
    await M().saveError(err);
    const card = M().newCard({
      front:(err.topic || test) + ' — ' + test + ' ' + no + '. soru' + (exam.publisher ? ' (' + exam.publisher + ')' : ''),
      back:a.tutar === true && a.cozum ? a.cozum.slice(0, 400)
        : 'Doğru cevap: ' + satir.anahtar + '. Çözümü ve ilkeyi hata kaydına yaz.',
      topic:err.topic || test, subjectId:err.subjectId, source:'error', sourceRef:err.id,
    });
    await M().saveCard(card);
    a.errorId = err.id;
    await M().saveExam(exam);
    return { ok:true, vardi:false, err };
  }

  async function hepsiniEkle(exam){
    let n = 0;
    for(const x of yanlislar(exam)){
      if(x.hata) continue;
      const r = await hatayaEkle(exam, x.key);
      if(r.ok && !r.vardi) n++;
    }
    return n;
  }

  /* ---------- yayın karnesi (söz 8) ---------- */

  const yayinAd = s => norm(String(s || '').trim()).replace(/\s+/g, ' ');

  function yayinKarnesi(yayin){
    const n = yayinAd(yayin);
    if(!n) return null;
    const denemeler = (R.S.exams || []).filter(e => yayinAd(e.publisher) === n);
    const hatalar = (R.S.errors || []).filter(e => yayinAd(e.publisher) === n);
    const konulu = hatalar.filter(e => e.topicId);
    const oteki = (R.S.errors || []).filter(e => e.topicId && yayinAd(e.publisher) !== n);
    const say = {};
    konulu.forEach(e => {
      const k = e.subjectId + '::' + e.topicId;
      (say[k] = say[k] || { topicRef:k, subjectId:e.subjectId, topicId:e.topicId, ad:e.topic || e.topicId, n:0 }).n++;
    });
    const pay = (a, b) => b ? Math.round(100 * a / b) : null;
    const konular = Object.keys(say).map(k => say[k])
      .sort((a, b) => b.n - a.n || String(a.ad).localeCompare(String(b.ad), 'tr')).slice(0, 6)
      .map(x => Object.assign(x, { pay:pay(x.n, konulu.length),
        otekiPay:oteki.length >= ESIK ? pay(oteki.filter(e => e.subjectId + '::' + e.topicId === x.topicRef).length, oteki.length) : null }));
    const testler = {};
    denemeler.forEach(ex => ozet(ex).testler.forEach(t => {
      if(!t.sonuc) return;
      const x = testler[t.ad] = testler[t.ad] || { ad:t.ad, d:0, y:0, b:0, deneme:0 };
      x.d += t.sonuc.d; x.y += t.sonuc.y; x.b += t.sonuc.b; x.deneme++;
    }));
    return { yayin:String(yayin).trim(), deneme:denemeler.length, hata:hatalar.length, konulu:konulu.length,
      konular, testler:Object.keys(testler).map(k => testler[k]), yeterli:konulu.length >= ESIK };
  }

  return { ESIK, dersler, konuSecenekleri, konuBul, ayristir, karsilastir, soruSayisi, ozet,
    dogrula, girdileriYaz, kaydiGuncelle, geriAl, yanlislar, sahip, bol, hataOf, konuYaz,
    hazir, coz, hatayaEkle, hepsiniEkle, yayinKarnesi };
})();
