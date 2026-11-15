/* LIFEOS.Kabuk.KingSohbet — King sayfasında (#/king) LifeOS içinden konuşma (2026-11-15, sahibin isteği:
 * «sistemin içinde de o arayüze istek atıp konuşabilmek istiyorum, arkada açık olması yeterli olsun»).
 * kabuk.js'e dokunmaz: King sayfası çizilince bölümü başlığın altına ekler; yalnız B.* taşları (kabuk/bilesen.js).
 * İstek aynı kökenden /api/kabuk/king'e gider (sistem/tekkapi.py): Merkez jetonu tarayıcıya hiç girmez.
 * Sağlayıcı: otomatik (Merkez ayarı) | antigravity | claude. Kapalıysa Merkez söyler ve sıradaki model cevaplar (HKM/core/kopru.py).
 * Depo: yalnız seçim (lifeos.king.saglayici); jeton, parola, cevap metni depoya yazılmaz. Geçmiş bu sekmenin belleğinde.
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.KingSohbet, Node'da module.exports (saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var SECIM = { oto: 'Otomatik (Merkez ayarı)', antigravity: 'Antigravity', claude: 'Claude Code' };
  var ANAHTAR = 'lifeos.king.saglayici', EN_COK = 20;

  /* ---------------- saf ---------------- */
  function secimGecerli(s) { return Object.prototype.hasOwnProperty.call(SECIM, s) ? s : 'oto'; }
  function istekGovdesi(metin, secim) {
    var g = { text: String(metin || '').trim(), agent: 'king' };
    if (secimGecerli(secim) !== 'oto') g.saglayici = secim;
    return g;
  }
  // Seçenek adları köprünün hâliyle: «Antigravity · kapalı». Hâl bilinmiyorsa yalnız ad (uydurma yok).
  function secenekler(kopruler) {
    var o = {};
    Object.keys(SECIM).forEach(function (k) {
      var h = kopruler && kopruler[k];
      o[k] = SECIM[k] + (h ? (h.acik ? ' · hazır' : ' · kapalı') : '');
    });
    return o;
  }
  function sn(v) { return typeof v === 'number' ? String(Math.round(v * 10) / 10).replace('.', ',') + ' sn' : null; }
  // Cevabın satırları: metin + kaynak satırı (hangi sağlayıcı, model, süre) + köprü notu (kapalıysa kim devraldı).
  function cevapSatirlari(r, kod) {
    if (!r || kod >= 400) return [(r && (r.mesaj || r.error)) || 'Merkez cevap vermedi.'];
    var l = [r.text || (r.ai && r.ai.note) || 'Cevap yok.'];
    var kaynak = r.mode === 'model' ? ['Kaynak: ' + (r.provider || 'model'), r.model, sn(r.seconds)].filter(Boolean).join(' · ')
      : 'Kaynak: kural motoru (model cevap vermedi)';
    l.push(kaynak);
    if (r.kopru && r.kopru.not && !r.kopru.kullanildi) l.push(r.kopru.not);
    return l;
  }

  /* ---------------- tarayıcı ---------------- */
  var d = { gecmis: [], bekliyor: false, kopruler: null, secim: 'oto' };
  function depoOku() { try { return kok.localStorage.getItem(ANAHTAR); } catch (e) { return null; } }
  function depoYaz(v) { try { kok.localStorage.setItem(ANAHTAR, v); } catch (e) { /* depo kapalı: seçim bu sekmede kalır */ } }

  function html(B) {
    var gecmis = d.gecmis.map(function (x) { return { soru: x.soru, cevap: x.cevap }; });
    return B.bolum({ baslik: 'Burada konuş', id: 'king-sohbet', veri: { 'king-bolum': '' }, govde: [
      '<p class="soluk">Antigravity ya da Claude Code açıksa onlar cevaplar; kapalıysa sıradaki model devralır.</p>',
      B.sohbet({ ad: 'King sohbeti', gecmis: gecmis, simdi: { form: { 'king-sohbet': '' },
        soru: d.bekliyor ? { metin: 'King cevaplıyor…', canli: true } : null,
        govde: [B.alan({ ad: 'Kim cevaplasın', isim: 'saglayici', tur: 'secim', secenekler: secenekler(d.kopruler), deger: d.secim }),
          B.alan({ ad: 'Mesajın', isim: 'metin', tur: 'cok', enCok: 2000, deger: '' }),
          B.eylemler([{ metin: d.bekliyor ? 'Bekleniyor' : 'Gönder', tur: 'ana', tip: 'submit', kapali: d.bekliyor }])] } })] });
  }
  function bolumEl() { return kok.document.querySelector('[data-king-bolum]'); }
  function ciz(odak) {
    var g = kok.document.querySelector('.govde[data-sayfa="king"]'), B = Kabuk.Bilesen;
    if (!g || !B) return;
    var eski = bolumEl(), yeni = kok.document.createElement('div');
    yeni.innerHTML = html(B);
    var el = yeni.firstChild;
    if (eski) eski.replaceWith(el);
    else { var bas = g.firstElementChild; if (bas && bas.nextSibling) g.insertBefore(el, bas.nextSibling); else g.appendChild(el); }
    if (odak) { var m = el.querySelector('[name="metin"]'); if (m) m.focus(); }
  }
  function durumAl() {
    return kok.fetch('/api/kabuk/king/kopru', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) { d.kopruler = v && v.kopruler || null; ciz(); }, function () { /* Merkez kapalı: hâl bilinmiyor */ });
  }
  function gonder(form) {
    var metin = form.metin.value.trim();
    d.secim = secimGecerli(form.saglayici.value);
    depoYaz(d.secim);
    if (!metin || d.bekliyor) return;
    d.bekliyor = true; ciz();
    var kod = 0;
    kok.fetch('/api/kabuk/king', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-LifeOS': 'king' },
      body: JSON.stringify(istekGovdesi(metin, d.secim)) })
      .then(function (r) { kod = r.status; return r.json().catch(function () { return null; }); })
      .then(function (r) { return cevapSatirlari(r, kod); }, function () { return ['Merkez\'e ulaşılamadı.']; })
      .then(function (c) {
        d.gecmis = d.gecmis.concat([{ soru: metin, cevap: c }]).slice(-EN_COK);
        d.bekliyor = false; ciz(true); durumAl();
      });
  }
  function kur() {
    d.secim = secimGecerli(depoOku());
    var sayfa = kok.document.getElementById('sayfa');
    if (!sayfa) return;
    new kok.MutationObserver(function () {
      if (kok.document.querySelector('.govde[data-sayfa="king"]') && !bolumEl()) { ciz(); durumAl(); }
    }).observe(sayfa, { childList: true, subtree: true });
    kok.document.addEventListener('submit', function (e) {
      if (!e.target.matches || !e.target.matches('form[data-king-sohbet]')) return;
      e.preventDefault(); gonder(e.target);
    });
    if (kok.document.querySelector('.govde[data-sayfa="king"]')) { ciz(); durumAl(); }
  }

  var KingSohbet = { SECIM: SECIM, secimGecerli: secimGecerli, istekGovdesi: istekGovdesi, secenekler: secenekler, cevapSatirlari: cevapSatirlari };
  Kabuk.KingSohbet = KingSohbet;
  if (typeof module !== 'undefined' && module.exports) module.exports = KingSohbet;
  else if (kok.document) { if (kok.document.readyState === 'loading') kok.document.addEventListener('DOMContentLoaded', kur); else kur(); }
})(typeof window !== 'undefined' ? window : globalThis);
