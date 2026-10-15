/* KONU NOTU — konuyu okurken kendi notun (topics.states[konu].note).

   Kullanıcı (2026-10-15): «öğrenmeyi, not etmeyi ve her şeyi daha kolay
   yapabilmek için sistemi geliştir». Konu notu alanı zaten vardı ama
   yalnız Dersler › konu penceresinde, ayrı bir formla yazılıyordu. Bu dosya
   AYNI alanı her yerden kolay kılar; yeni bir kayıt türü açmaz.

   Sözler:
     1. TEK ALAN. Not, konu durumunun `note` alanıdır (core/state.js); konu
        penceresi, Anlatım, King ve komut paleti aynı metni yazar ve okur.
        Eşitleme ve yedek o alanla zaten gelir.
     2. EKLEMEK EZMEZ. «Nota ekle» (seçili cümle, King, palet) metnin SONUNA
        yeni satır ekler; var olan not silinmez. Not en çok SINIR karakter.
     3. HEDEF SÖYLENİR. King ve palet notu hangi konuya ekleyeceğini önizlemede
        yazar (Öğren'de seçili konu); kullanıcı görmeden yazılmaz.
     4. KART YALNIZ İSTENİNCE. «ön :: arka» satırları tekrar kartı ADAYIdır;
        «Kartlara çevir» denince açılır. Aynı konudan aynı ön yüzlü kart ikinci
        kez açılmaz. Not bir ölçüm değildir; hiçbir sayıyı değiştirmez. */

window.R = window.R || {};

R.KonuNotu = (function(){
  const SINIR = 4000;
  const KAYNAK = 'konunotu';
  const O = () => R.Ogren;
  const M = () => R.Model;

  function oku(subjectId, topicId){
    return String((M().topicState(subjectId, topicId) || {}).note || '');
  }

  async function yaz(subjectId, topicId, metin){
    const m = String(metin == null ? '' : metin).replace(/\r\n/g, '\n').slice(0, SINIR);
    await M().setTopicState(subjectId, topicId, { note:m });
    return m;
  }

  /* Söz 2: sona yeni satır. Döner: yeni metin ya da null (boş satır). */
  async function ekle(subjectId, topicId, satir){
    const s = String(satir || '').replace(/\s+/g, ' ').trim();
    if(!s) return null;
    const eski = oku(subjectId, topicId).replace(/\s+$/, '');
    return yaz(subjectId, topicId, eski ? eski + '\n' + s : s);
  }

  /* Söz 4: «ön :: arka» satırları. */
  function kartAdaylari(metin){
    return String(metin || '').split('\n').map(l => {
      const m = l.match(/^\s*(.+?)\s*::\s*(.+?)\s*$/);
      return m ? { on:m[1].slice(0, 300), arka:m[2].slice(0, 600) } : null;
    }).filter(Boolean);
  }

  function mevcutOnler(topicId){
    const ref = KAYNAK + ':' + topicId;
    return new Set((R.S.cards || []).filter(c => c.sourceRef === ref).map(c => String(c.front).trim()));
  }

  /* Döner: { acilan, vardi }. */
  async function kartlaraCevir(subjectId, topicId){
    const k = O().bul(subjectId, topicId);
    const ad = k && k.topic ? k.topic.name : '';
    const var_ = mevcutOnler(topicId);
    let acilan = 0, vardi = 0;
    for(const a of kartAdaylari(oku(subjectId, topicId))){
      if(var_.has(a.on)){ vardi++; continue; }
      await M().saveCard(M().newCard({ front:a.on, back:a.arka, topic:ad, subjectId,
        source:KAYNAK, sourceRef:KAYNAK + ':' + topicId }));
      var_.add(a.on);
      acilan++;
    }
    return { acilan, vardi };
  }

  /* Söz 3: Öğren'de seçili konu. */
  function hedef(){
    const x = O() && O().secili ? O().secili() : null;
    return x && x.topic ? x : null;
  }

  const NOT_KALIBI = /^\s*not\s*[:：]\s*(.+)$/i;

  /* King'in veri önizlemesi (brand/ortak/king.js söz 3). */
  function onizle(metin){
    const m = String(metin || '').match(NOT_KALIBI);
    if(!m) return null;
    const h = hedef();
    if(!h) return null;
    const satir = m[1].trim();
    return {
      metin:'Not: ' + satir,
      ipucu:'«' + h.topic.name + '» konusunun notuna eklenir',
      async kaydet(){
        await ekle(h.subject.id, h.topic.id, satir);
        return 'Not «' + h.topic.name + '» konusuna eklendi.';
      },
    };
  }

  /* Komut paleti satırı (core/palette.js). */
  function paletKomutu(q){
    const p = onizle(q);
    if(!p) return null;
    return { group:'Not', icon:'plus', label:p.metin, sub:p.ipucu, hint:'Enter',
      async run(){
        const r = await p.kaydet();
        if(R.UI && R.UI.toast) R.UI.toast(r);
        if(R.App && R.App.render) R.App.render();
      } };
  }

  return { SINIR, oku, yaz, ekle, kartAdaylari, kartlaraCevir, hedef, onizle, paletKomutu };
})();
