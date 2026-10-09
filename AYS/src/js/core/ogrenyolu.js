/* ÖĞRENME YOLU — bir konuyu baştan sona öğrenmenin adımları.

   Kullanıcı (2026-10-09): «kullanıcının o konu ile alakalı her şeyi
   uygulamanın içinde öğrenmesini istiyorum». Konu ekranı notu, kartı,
   yanlışı ve ölçümü zaten bir araya getiriyordu; eksik olan «şimdi ne
   yapayım» cevabıydı. Yol bunu verir.

   Sözler:
     1. YENİ ÖLÇÜM YOK. Her adım sistemin zaten tuttuğu kayıttan okunur;
        «sıradaki adım» kodla seçilir (AGENTS §1.1). Model yoktur.
     2. ETİKET. Her adım nereden bilindiğini söyler: ölçüldü (kayıt var),
        hesaplandı (kayıtlardan türetildi), beyan (kullanıcı «okudum»
        dedi; sistem doğrulayamaz). Bilinmeyen adım «tamam» sayılmaz.
     3. SIRA ÖNERİLİR, KİLİTLENMEZ. Bir adım önce yapılırsa yapılmış
        sayılır; yol yalnız ilk eksik adımı gösterir.
     4. EŞİKLER PLANIN KURALIDIR, ölçüm değil (KURAL); kapanış eşikleri
        R.CLOSURE_RULE'dan okunur. Ekran eşikleri yazar.
   Adımlar:
     ogren     konuya bağlı ders notu (ölçüldü) ya da «okudum» (beyan)
     kartla    bu konunun en az KURAL.kartEnAz tekrar kartı
     coz       son 45 günde bu konuya bağlı bloklarda en az KURAL.pratikEnAz
               soru ve doğruluk ≥ %KURAL.pratikDogruluk (Calc.topicPractice)
     duzelt    bu konudan açık yanlış yok (hiç yanlış yoksa öyle yazılır)
     olc       ilk konu testi ≥ %R.CLOSURE_RULE.first
     pekistir  gapDays gün sonra ikinci test ≥ %R.CLOSURE_RULE.second
               (zamanı gelmediyse «bekle» denir, tarih yazılır) */

window.R = window.R || {};

R.OgrenYolu = (function(){
  const KURAL = Object.freeze({ kartEnAz:3, pratikEnAz:20, pratikDogruluk:70 });
  const ADLAR = { ogren:'Öğren', kartla:'Kartla', coz:'Soru çöz', duzelt:'Yanlışları kapat',
    olc:'Konu testi', pekistir:'Tekrar test' };

  function bul(subjectId, topicId){
    const subject = (R.SUBJECTS || []).find(s => s.id === subjectId);
    const topic = subject ? subject.topics.find(t => t.id === topicId) : null;
    return { subject, topic };
  }

  /* Yalnız gerçekten bu konuya bağlı olanlar: konusuz kart her konuya sayılmaz. */
  function kartSayisi(subjectId, topic){
    return (R.S.cards || []).filter(c => c.subjectId === subjectId && c.topic
      && (c.topic === topic.name || c.topic.indexOf(topic.name) >= 0)).length;
  }
  function notSayisi(subjectId, topicId){
    return (R.S.videoNotes || []).filter(n => n.subjectId === subjectId && n.topicId === topicId
      && (n.segments || []).length).length;
  }

  /* Adımlar: [{ id, ad, tamam, etiket, ayrinti, bekle }] — sırayla. */
  function adimlar(subjectId, topicId, bugunISO){
    const { topic } = bul(subjectId, topicId);
    if(!topic) return [];
    const U = R.U, rule = R.CLOSURE_RULE;
    const st = R.Model.topicState(subjectId, topicId);
    const bugun = bugunISO || U.todayISO();
    const yeniden = st.state === 'reopened';
    const notlar = notSayisi(subjectId, topicId);
    const kart = kartSayisi(subjectId, topic);
    const p = R.Calc.topicPractice(subjectId, topicId);
    const yanlis = (R.S.errors || []).filter(e => e.subjectId === subjectId && e.topicId === topicId);
    const acik = yanlis.filter(e => !e.closedAt).length;
    const ikinciGun = st.firstAt ? U.iso(U.addDays(U.parse(st.firstAt), rule.gapDays)) : null;
    const birinci = !yeniden && st.first != null && st.first >= rule.first;
    const ikinci = !yeniden && st.second != null && st.second >= rule.second;

    return [
      { id:'ogren', ad:ADLAR.ogren, tamam:!!(notlar || st.okunduAt),
        etiket:notlar ? 'ölçüldü' : st.okunduAt ? 'beyan' : null,
        ayrinti:notlar ? notlar + ' ders notu'
          : st.okunduAt ? 'Okudum dedin (' + U.fmtShort(st.okunduAt.slice(0, 10)) + ').'
          : 'Konuyu bir kaynaktan öğren: ders notu ekle ya da okuduğunu işaretle.' },
      { id:'kartla', ad:ADLAR.kartla, tamam:kart >= KURAL.kartEnAz, etiket:'ölçüldü',
        ayrinti:kart + ' / ' + KURAL.kartEnAz + ' kart' },
      { id:'coz', ad:ADLAR.coz,
        tamam:p.solved >= KURAL.pratikEnAz && p.accuracy != null && p.accuracy >= KURAL.pratikDogruluk,
        etiket:p.solved ? 'hesaplandı' : null,
        ayrinti:p.solved ? p.solved + ' / ' + KURAL.pratikEnAz + ' soru · doğruluk %' + p.accuracy
            + ' (eşik %' + KURAL.pratikDogruluk + ')'
          : 'Bu konuya bağlı blokta soru yok.' },
      { id:'duzelt', ad:ADLAR.duzelt, tamam:acik === 0, etiket:'ölçüldü',
        ayrinti:!yanlis.length ? 'Bu konudan yanlış kaydı yok.' : acik ? acik + ' açık yanlış' : 'Açık yanlış kalmadı.' },
      { id:'olc', ad:ADLAR.olc, tamam:birinci, etiket:st.first != null ? 'ölçüldü' : null,
        ayrinti:yeniden ? 'Konu yeniden açıldı: testi yenile (eşik %' + rule.first + ').'
          : st.first != null ? '%' + st.first + ' (eşik %' + rule.first + ')'
          : 'Konu testini gir (eşik %' + rule.first + ').' },
      { id:'pekistir', ad:ADLAR.pekistir, tamam:ikinci, etiket:st.second != null ? 'ölçüldü' : null,
        bekle:!ikinci && birinci && st.second == null && !!ikinciGun && ikinciGun > bugun,
        ayrinti:yeniden ? 'Konu yeniden açıldı.'
          : st.second != null ? '%' + st.second + ' (eşik %' + rule.second + ')'
          : ikinciGun ? (ikinciGun > bugun ? U.fmtShort(ikinciGun) + ' günü (ilk testten ' + rule.gapDays + ' gün sonra)'
            : 'Zamanı geldi (eşik %' + rule.second + ').')
          : 'İlk testten ' + rule.gapDays + ' gün sonra.' },
    ];
  }

  /* İlk eksik adım (yoksa null: konu kapandı). */
  function siradaki(subjectId, topicId, bugunISO){
    return adimlar(subjectId, topicId, bugunISO).find(a => !a.tamam) || null;
  }

  function ozet(subjectId, topicId, bugunISO){
    const l = adimlar(subjectId, topicId, bugunISO);
    return { tamam:l.filter(a => a.tamam).length, toplam:l.length, siradaki:l.find(a => !a.tamam) || null };
  }

  /* «Okudum» (beyan): konu başlanmadıysa «öğreniliyor»a geçer. İşaret geri
     alınır; konunun durumu ise yalnız «Durumu düzenle»den değişir. */
  async function okundu(subjectId, topicId, deger){
    const st = R.Model.topicState(subjectId, topicId);
    const patch = { okunduAt:deger === false ? null : new Date().toISOString() };
    if(deger !== false && st.state === 'not_started') patch.state = 'learning';
    return R.Model.setTopicState(subjectId, topicId, patch);
  }

  return { KURAL, ADLAR, adimlar, siradaki, ozet, okundu };
})();
