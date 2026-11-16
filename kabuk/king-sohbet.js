/* LIFEOS.Kabuk.KingSohbet — King sayfasında (#/king) LifeOS içinden konuşma (2026-11-15, sahibin isteği:
 * «sistemin içinde de o arayüze istek atıp konuşabilmek istiyorum, arkada açık olması yeterli olsun»).
 * 2026-11-16 (sahibin isteği: «uzun uzun konuşacağım», «King öğretmen gibi dersi anlatsın ya da filozof gibi kendini anlatsın»):
 * mesajlaşma düzeni (sen sağda, King solda, en yeni altta, yazma alanı altta), büyüyen yazma alanı, yenilemede kalan geçmiş,
 * «Yeni konuşma», üç kip (Düşünce ortağı · Öğretmen · Filozof) ve ders bağlamı (ders sayfasındaki «King'le çalış»).
 * kabuk.js'e dokunmaz: King sayfası çizilince bölümü başlığın altına ekler.
 * İstek aynı kökenden /api/kabuk/king'e gider (sistem/tekkapi.py): Merkez jetonu tarayıcıya hiç girmez. Geçmiş modele SUNUCUDAN
 * gider (HKM ambarı, «baslangic»tan bu yana); buradaki kopya yalnız ekran içindir. Ders metnini sunucu içerikten okur.
 * Depo (localStorage, ayar; tek depoya eşitlenmez): lifeos.king.saglayici (seçim; Ayarlar › King yazar), lifeos.king.sohbet (bu cihazdaki konuşma)
 * ve lifeos.king.taslak (yazılıp gönderilmemiş metin: sekme değişince, yenilemede geri gelir; gönderilince silinir, hata alınca geri döner).
 * 2026-11-16 (sahip: «geliştirici dili»): ekranda yalnız kip kalır; cevaplayan seçimi Ayarlar'da, kaynak/model/süre satırı yazılmaz.
 * Jeton ya da parola depoya yazılmaz. Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.KingSohbet, Node'da module.exports (saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var SECIM = { oto: 'Otomatik (Merkez ayarı)', antigravity: 'Antigravity', claude: 'Claude Code' };
  var KIP = { ortak: 'Düşünce ortağı', ogretmen: 'Öğretmen', filozof: 'Filozof' };
  var ANAHTAR = 'lifeos.king.saglayici', SOHBET = 'lifeos.king.sohbet', TASLAK = 'lifeos.king.taslak', EN_COK = 80, EN_UZUN = 20000;
  var ONERI = {
    ortak: ['Bugün ne var?', 'Felsefe yol haritamda neredeyim?', 'Bu hafta nasıl gitti?'],
    ogretmen: ['Bu dersi adım adım anlat', 'Beni bu konudan sına', 'En önemli üç fikir ne?'],
    filozof: ['Kendini anlat', 'Bana bir soru sor', 'Bugün yaşasaydın neyi sorardın?']
  };

  /* ---------------- saf ---------------- */
  function secimGecerli(s) { return Object.prototype.hasOwnProperty.call(SECIM, s) ? s : 'oto'; }
  function kipGecerli(k) { return Object.prototype.hasOwnProperty.call(KIP, k) ? k : 'ortak'; }
  // Ders bağlamı yalnız kimlik taşır (sunucu metni içerikten okur); kimlik «alan.n.u.d» biçiminde olmalı.
  function baglamGecerli(b) {
    var m = b && b.tur === 'ders' && /^([a-z]+)\.\d{1,2}(\.\d{1,3}){1,3}$/.exec(String(b.id || ''));
    return m ? { tur: 'ders', alan: m[1], id: String(b.id), ad: String(b.ad || '').slice(0, 120) } : null;
  }
  // Yerel ISO zaman (sunucu ambarı created_at ile aynı biçim): «yeni konuşma» sunucuda da buradan başlar.
  function yerelIso(t) {
    var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function istekGovdesi(metin, secim, o) {
    var g = { text: String(metin || '').trim(), agent: 'king' };
    if (secimGecerli(secim) !== 'oto') g.saglayici = secim;
    if (o) {
      g.kip = kipGecerli(o.kip);
      if (o.baslangic) g.baslangic = o.baslangic;
      var b = baglamGecerli(o.baglam);
      if (b) g.baglam = { tur: b.tur, alan: b.alan, id: b.id };
    }
    return g;
  }
  // Cevabın satırları: metin + model konuşamadıysa tek kısa not. Hata (sunucu ya da ağ) null döner: çağıran yazılanı kutuya geri koyar.
  function cevapSatirlari(r, kod) {
    if (!r || kod >= 400) return null;
    var l = [r.text || (r.ai && r.ai.note) || 'Cevap yok.'];
    if (r.mode !== 'model') l.push('Şu an yalnız kısa cevap verebiliyorum.');
    return l;
  }
  function hataMetni(r) { return (r && (r.mesaj || r.error)) || 'King şu an cevap veremedi.'; }
  // Depodaki konuşma: bozuksa ya da biçimi tutmuyorsa boş konuşma (geçmiş kaybı, sahte geçmiş değil).
  function sohbetOku(ham, simdi) {
    var v = null;
    try { v = JSON.parse(ham); } catch (e) { v = null; }
    var bos = { baslangic: yerelIso(simdi), kip: 'ortak', baglam: null, mesajlar: [] };
    if (!v || typeof v !== 'object' || !Array.isArray(v.mesajlar)) return bos;
    return {
      baslangic: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v.baslangic) ? v.baslangic : bos.baslangic,
      kip: kipGecerli(v.kip), baglam: baglamGecerli(v.baglam),
      mesajlar: v.mesajlar.filter(function (m) { return m && (m.kim === 'ben' || m.kim === 'king') && typeof m.metin === 'string'; })
        .map(function (m) { return { kim: m.kim, metin: m.metin.slice(0, EN_UZUN), alt: Array.isArray(m.alt) ? m.alt.filter(function (x) { return typeof x === 'string' && !/^Kaynak: /.test(x); }).slice(0, 3) : [] }; })
        .slice(-EN_COK)
    };
  }

  // Güvenli biçim: önce bütün metin kaçırılır, sonra yalnız paragraf, satır sonu, madde, numaralı liste, tablo, **kalın** ve `kod`
  // etikete döner. Bağlantı ve ham HTML yok (model metni sayfaya enjekte edemez).
  function kac(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function satirIci(s) { return kac(s).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`\n]+)`/g, '<code>$1</code>'); }
  function hucre(s) { return s.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (x) { return x.trim(); }); }
  function bicimle(metin) {
    var satirlar = String(metin == null ? '' : metin).replace(/\r\n?/g, '\n').split('\n'), out = [], grup = null;
    function tur(s) {
      if (/^\s*$/.test(s)) return 'bos';
      if (/^\s*[-*•]\s+/.test(s)) return 'ul';
      if (/^\s*\d{1,3}[.)]\s+/.test(s)) return 'ol';
      if (/^\s*\|.*\|\s*$/.test(s)) return 'tablo';
      if (/^\s*#{1,4}\s+/.test(s)) return 'baslik';
      return 'p';
    }
    function kapat() {
      if (!grup) return;
      var g = grup; grup = null;
      if (g.tur === 'ul' || g.tur === 'ol') out.push('<' + g.tur + '>' + g.l.map(function (s) { return '<li>' + satirIci(s.replace(/^\s*([-*•]|\d{1,3}[.)])\s+/, '')) + '</li>'; }).join('') + '</' + g.tur + '>');
      else if (g.tur === 'tablo') {
        var l = g.l.filter(function (s) { return !/^\s*\|?[\s:|-]+\|?\s*$/.test(s); }).map(hucre);
        if (!l.length) return;
        out.push('<div class="king-md-tablo"><table><thead><tr>' + l[0].map(function (h) { return '<th>' + satirIci(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          l.slice(1).map(function (r) { return '<tr>' + r.map(function (h) { return '<td>' + satirIci(h) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
      } else if (g.tur === 'baslik') out.push(g.l.map(function (s) { return '<p class="king-md-baslik"><strong>' + satirIci(s.replace(/^\s*#{1,4}\s+/, '')) + '</strong></p>'; }).join(''));
      else out.push('<p>' + g.l.map(satirIci).join('<br>') + '</p>');
    }
    satirlar.forEach(function (s) {
      var t = tur(s);
      if (t === 'bos') return kapat();
      if (grup && grup.tur === t && t !== 'baslik') grup.l.push(s);
      else { kapat(); grup = { tur: t, l: [s] }; }
    });
    kapat();
    return out.join('');
  }

  /* ---------------- tarayıcı ---------------- */
  var d = { s: null, bekliyor: false, hata: null };
  function depoOku(k) { try { return kok.localStorage.getItem(k); } catch (e) { return null; } }
  function depoYaz(k, v) { try { if (v) kok.localStorage.setItem(k, v); else kok.localStorage.removeItem(k); } catch (e) { /* depo kapalı ya da dolu: bu sekmede kalır */ } }
  function kaydet() { depoYaz(SOHBET, JSON.stringify(d.s)); }
  function yeniKonusma(kip, baglam) {
    d.s = { baslangic: yerelIso(Date.now()), kip: kipGecerli(kip), baglam: baglamGecerli(baglam), mesajlar: [] };
    kaydet();
  }

  function mesajHtml(m) {
    if (m.kim === 'ben') return '<li class="king-msj king-msj--ben"><div class="king-balon">' + bicimle(m.metin) + '</div></li>';
    return '<li class="king-msj king-msj--king"><div class="king-balon">' + bicimle(m.metin) + '</div>' +
      (m.alt.length ? '<p class="king-msj__alt">' + m.alt.map(kac).join(' · ') + '</p>' : '') + '</li>';
  }
  function html(B) {
    var s = d.s, bos = !s.mesajlar.length && !d.bekliyor;
    var kip = '<div class="king-kip" role="group" aria-label="Kip">' + Object.keys(KIP).map(function (k) {
      return '<button type="button" class="king-kip__oge" data-king-kip="' + k + '" aria-pressed="' + (k === s.kip) + '">' + KIP[k] + '</button>'; }).join('') + '</div>';
    var baglam = s.baglam ? '<p class="king-baglam"><span class="king-baglam__ad">Ders: ' + kac(s.baglam.ad || s.baglam.id) + '</span>' +
      '<button type="button" class="king-baglam__kaldir" data-king-baglam-kaldir aria-label="Ders bağlamını kaldır" title="Ders bağlamını kaldır">×</button></p>' : '';
    var ust = '<div class="king-ust">' + kip + baglam + (s.mesajlar.length ? '<button type="button" class="king-yeni" data-king-yeni>Yeni konuşma</button>' : '') + '</div>';
    // ilk açılışta örnek sorular: kutuya ne yazılacağı belli olsun (tıklayınca sorulur)
    var oneri = bos ? '<div class="king-bos"><p class="king-giris">' + (s.baglam ? 'Bu dersi King\'le çalış. Şunlardan biriyle başla ya da aklındakini yaz:' : 'Aklındakini yaz ya da şunlardan biriyle başla:') + '</p>' +
      '<div class="king-oneri" aria-label="Örnek sorular">' + ONERI[s.kip].map(function (q) {
        return '<button type="button" class="king-oneri__oge" data-king-oneri="' + kac(q) + '">' + kac(q) + '</button>'; }).join('') + '</div></div>' : '';
    var akis = bos ? '' : '<ol class="king-akis" aria-label="Konuşma" aria-live="polite">' + s.mesajlar.map(mesajHtml).join('') +
      (d.bekliyor ? '<li class="king-yaziyor" role="status"><span class="gizli">King yazıyor…</span><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i></li>' : '') + '</ol>';
    var hata = d.hata ? B.uyari({ tur: 'hata', metin: d.hata, alt: 'Yazdığın kutuda duruyor.', eylem: { metin: 'Tekrar dene', tur: 'sade', veri: { 'king-tekrar': '' } } }) : '';
    var form = '<form class="king-yaz" data-king-sohbet novalidate>' +
      '<div class="king-yaz__satir"><label class="gizli" for="king-metin">Mesajın</label>' +
      '<textarea id="king-metin" name="metin" rows="1" maxlength="8000" placeholder="King\'e yaz…" aria-describedby="king-ipucu"></textarea>' +
      '<button type="submit" class="king-gonder" aria-label="Gönder"' + (d.bekliyor ? ' disabled' : '') + '><svg aria-hidden="true"><use href="#i-ok"/></svg></button></div>' +
      '<div class="king-yaz__alt"><span id="king-ipucu">Enter gönderir · Shift + Enter yeni satır</span></div></form>';
    return '<section class="king-sohbet" data-king-bolum aria-label="King sohbeti">' + ust + oneri + akis + hata + form + '</section>';
  }
  function bolumEl() { return kok.document.querySelector('[data-king-bolum]'); }
  function boyutla(m) { if (!m) return; m.style.height = 'auto'; m.style.height = Math.min(m.scrollHeight + 2, 240) + 'px'; }
  function ciz(odak) {
    var g = kok.document.querySelector('.govde[data-sayfa="king"]'), B = Kabuk.Bilesen;
    if (!g || !B) return;
    var eski = bolumEl(), yeni = kok.document.createElement('div');
    // yeniden çizim (köprü hâli geldi) yazılmakta olanı silmesin: metin, imleç ve odak korunur
    var em = eski && eski.querySelector('[name="metin"]'), yazilan = em ? em.value : '', odakta = em && kok.document.activeElement === em;
    var imlec = odakta ? [em.selectionStart, em.selectionEnd] : null;
    yeni.innerHTML = html(B);
    var el = yeni.firstChild;
    if (eski) eski.replaceWith(el);
    else { var bas = g.firstElementChild; if (bas && bas.nextSibling) g.insertBefore(el, bas.nextSibling); else g.appendChild(el); }
    var m = el.querySelector('[name="metin"]');
    if (m) m.value = eski ? yazilan : depoOku(TASLAK) || ''; // ilk çizimde gönderilmemiş taslak geri gelir
    boyutla(m);
    var a = el.querySelector('.king-akis');
    if (a) a.scrollTop = a.scrollHeight; // en yeni altta
    if (m && (odak || odakta)) { m.focus({ preventScroll: true }); if (imlec) m.setSelectionRange(imlec[0], imlec[1]); }
  }
  function gonder(form) {
    var metin = form.metin.value.trim();
    if (!metin || d.bekliyor) return;
    var s = d.s, kod = 0, ben = { kim: 'ben', metin: metin.slice(0, EN_UZUN), alt: [] };
    s.mesajlar.push(ben);
    d.bekliyor = true; d.hata = null; form.metin.value = ''; depoYaz(TASLAK, ''); kaydet(); ciz(true); // gönderilen kutuda kalmasın
    kok.fetch('/api/kabuk/king', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-LifeOS': 'king' },
      body: JSON.stringify(istekGovdesi(metin, secimGecerli(depoOku(ANAHTAR)), s)) })
      .then(function (r) { kod = r.status; return r.json().catch(function () { return null; }); })
      .then(function (r) { return { c: cevapSatirlari(r, kod), r: r }; }, function () { return { c: null, r: { mesaj: 'King’e ulaşılamadı. Bilgisayar açık mı?' } }; })
      .then(function (x) {
        d.bekliyor = false;
        if (d.s !== s) return ciz();
        if (!x.c) { // hata: mesaj konuşmadan çıkar, yazılan kutuya ve taslağa geri döner
          s.mesajlar = s.mesajlar.filter(function (m) { return m !== ben; }); d.hata = hataMetni(x.r); depoYaz(TASLAK, metin); kaydet(); ciz(true);
          var m = kok.document.querySelector('form[data-king-sohbet] [name="metin"]'); if (m) { m.value = metin; boyutla(m); }
          return;
        }
        s.mesajlar.push({ kim: 'king', metin: String(x.c[0]).slice(0, EN_UZUN), alt: x.c.slice(1) }); s.mesajlar = s.mesajlar.slice(-EN_COK); kaydet(); ciz(true);
      });
  }
  // Ders sayfasındaki «King'le çalış» (kabuk.js sayfaDers): o dersin bağlamıyla Öğretmen kipinde açılır; başka bir dersten geliyorsa yeni konuşma.
  function dersleCalis(id) {
    var h = kok.document.querySelector('article.ders h1'), b = baglamGecerli({ tur: 'ders', id: id, ad: h ? h.textContent.trim() : '' });
    if (!b) return;
    if (!d.s.baglam || d.s.baglam.id !== b.id) yeniKonusma('ogretmen', b);
    kok.location.hash = '#/king';
  }
  function kur() {
    d.s = sohbetOku(depoOku(SOHBET), Date.now());
    var sayfa = kok.document.getElementById('sayfa');
    if (!sayfa) return;
    new kok.MutationObserver(function () {
      if (kok.document.querySelector('.govde[data-sayfa="king"]') && !bolumEl()) ciz();
    }).observe(sayfa, { childList: true, subtree: true });
    // Enter gönderir (Shift + Enter yeni satır); örnek soru tıklanınca sorulur
    kok.document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing || !t.matches || !t.matches('form[data-king-sohbet] [name="metin"]')) return;
      e.preventDefault(); t.form.requestSubmit();
    });
    kok.document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('form[data-king-sohbet] [name="metin"]')) { boyutla(e.target); depoYaz(TASLAK, e.target.value.trim() ? e.target.value : ''); } });
    kok.document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : null, f = kok.document.querySelector('form[data-king-sohbet]'), b;
      if (!t) return;
      if ((b = t.closest('[data-king-calis]'))) { e.preventDefault(); return dersleCalis(b.getAttribute('data-king-calis')); }
      if (!f) return;
      if (t.closest('[data-king-tekrar]')) return f.requestSubmit();
      if ((b = t.closest('[data-king-oneri]'))) { f.metin.value = b.getAttribute('data-king-oneri'); return f.requestSubmit(); }
      if ((b = t.closest('[data-king-kip]'))) { d.s.kip = kipGecerli(b.getAttribute('data-king-kip')); kaydet(); ciz(); return kok.document.querySelector('[data-king-kip="' + d.s.kip + '"]').focus(); } // yeniden çizimde odak seçili kipte kalır
      if (t.closest('[data-king-baglam-kaldir]')) { d.s.baglam = null; kaydet(); return ciz(true); }
      if (t.closest('[data-king-yeni]') && !d.bekliyor) { yeniKonusma(d.s.kip, d.s.baglam); return ciz(true); }
    });
    kok.document.addEventListener('submit', function (e) {
      if (!e.target.matches || !e.target.matches('form[data-king-sohbet]')) return;
      e.preventDefault(); gonder(e.target);
    });
    if (kok.document.querySelector('.govde[data-sayfa="king"]')) ciz();
  }

  var KingSohbet = { SECIM: SECIM, KIP: KIP, secimGecerli: secimGecerli, kipGecerli: kipGecerli, baglamGecerli: baglamGecerli, yerelIso: yerelIso,
    istekGovdesi: istekGovdesi, cevapSatirlari: cevapSatirlari, hataMetni: hataMetni, sohbetOku: sohbetOku, bicimle: bicimle };
  Kabuk.KingSohbet = KingSohbet;
  if (typeof module !== 'undefined' && module.exports) module.exports = KingSohbet;
  else if (kok.document) { if (kok.document.readyState === 'loading') kok.document.addEventListener('DOMContentLoaded', kur); else kur(); }
})(typeof window !== 'undefined' ? window : globalThis);
