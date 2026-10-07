/* VELİ / KOÇ RAPORU — haftanın yazdırılabilir tek sayfası (DEVIR Y10).

   Kullanıcı 2026-09-23: «veli ya da koç için haftada bir-iki PDF». Alıcı
   sorusu açık kalmıştı; karar (2026-10-07, depo sahibi kararı ajana
   bıraktı): rapor KİMSEYE KENDİLİĞİNDEN GİTMEZ. Kullanıcı Bugün › Günü
   düzenle › «Özeti paylaş»tan açar, tarayıcının «PDF olarak kaydet»iyle
   dosyaya çevirir ve istediğine kendisi verir. PDF'i tarayıcı yazar:
   sıfır bağımlılık (AGENTS §1.3), Türkçe harfler doğru (SPİ hekim özeti
   ile aynı yol).

   Sözler:
   1. SAYI KODDAN. Her satır `calc.js`'in ekranda kullandığı işlevden
      gelir; burada yeniden hesap yok (iki hesap iki gerçek yaratır).
   2. HER SAYININ ETİKETİ VAR (AGENTS §1.2). Ölçülmemiş satır «—» ve
      «veri yok» der; sıfır yazılmaz.
   3. BELGE DEĞİL (AGENTS §1.5). Rapor başarı belgesi, yetenek yargısı ya
      da sonuç tahmini değildir; bu sayfada yazar. «Bu hızla» varsa
      «tahmin» etiketiyle ve dayanağıyla durur. */

window.R = window.R || {};

R.HaftaRapor = (function(){
  const { html, when, map } = R.h;
  const U = R.U, M = R.Model, C = R.Calc;

  const KES = k => (R.CERTAINTY[k] || R.CERTAINTY.missing).label;
  const satir = (ad, deger, kes) => deger == null
    ? { ad, deger:'—', kes:'missing' }
    : { ad, deger:String(deger), kes };

  /* Haftanın verisi; çizimden ayrı ki test sayıya baksın. */
  function veri(n){
    n = n || M.currentWeek();
    const gunler = M.weekDates(n).map(d => U.iso(d));
    const bas = gunler[0], son = gunler[6];
    const kayitli = gunler.filter(t => {
      const d = R.S.days[t];
      return d && (C.gunSorusu(d) > 0 || (d.blocks || []).some(b => b.status && b.status !== 'pending'));
    });
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const tyt = C.medianTrend('TYT'), ayt = C.medianTrend('AYT');
    const kap = C.overallClosure();
    const borc = C.analysisDebt().length;

    const satirlar = [
      satir('Plan tamamlama', comp == null ? null : '%' + comp, 'derived'),
      satir('Çözülen soru', qr ? qr.solved + (qr.target ? ' / ' + qr.target + ' hedef' : '') : null, 'measured'),
      satir('Kayıt girilen gün', kayitli.length ? kayitli.length + ' / 7' : null, 'measured'),
      satir('TYT medyanı (son 3 tam deneme)', tyt.last3 == null ? null : U.fmtNet(tyt.last3) + ' net', 'derived'),
      satir('AYT medyanı (son 3 tam deneme)', ayt.last3 == null ? null : U.fmtNet(ayt.last3) + ' net', 'derived'),
      satir('Konu kapanışı', kap.total ? '%' + kap.pct + ' (' + kap.closed + ' / ' + kap.total + ' konu)' : null, 'derived'),
      satir('Davranış serisi', C.behaviorStreak().streak + ' gün', 'derived'),
      satir('Analizi bekleyen deneme', String(borc), 'derived'),
    ];

    const denemeler = (R.S.exams || [])
      .filter(e => e.date >= bas && e.date <= son)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => ({ tarih:e.date, ad:e.type || e.family || 'Deneme',
        yayin:e.publisher || '', net:U.fmtNet(M.examNet(e)) }));

    return { hafta:n, bas, son, satirlar, denemeler, hiz:C.buHizla(),
      ad:(R.S.profile && R.S.profile.name) || '' };
  }

  function htmlOf(n){
    const v = veri(n);
    return String(html`<div id="print-root" class="printdoc" data-oz="Y10">
      <div class="printdoc__head">
        <div>
          <b class="printdoc__title">Haftalık çalışma raporu</b>
          <span class="printdoc__sub">Hafta ${v.hafta} · ${U.fmtDate(v.bas)} – ${U.fmtDate(v.son)} ·
            ${U.fmtDate(U.todayISO())} tarihinde hazırlandı</span>
        </div>
        ${when(v.ad, () => html`<div class="printdoc__who"><b>${v.ad}</b><span>YKS hazırlığı</span></div>`)}
      </div>

      <p class="printdoc__limit"><b>Bu bir başarı belgesi değildir.</b>
        Yalnız kayda geçen çalışmanın özetidir; yetenek yargısı ya da sınav sonucu
        tahmini içermez.</p>

      <p class="printdoc__key"><b>Kesinlik anahtarı —</b>
        <b>ölçüldü:</b> öğrencinin girdiği kayıt ·
        <b>hesaplandı:</b> kayıtlardan formülle türetildi ·
        <b>veri yok:</b> kayıt girilmedi; sıfır sayılmaz.</p>

      <h3 class="printdoc__h">Hafta</h3>
      <table class="table--tight">
        <thead><tr><th>Gösterge</th><th class="num">Değer</th><th>Kesinlik</th></tr></thead>
        <tbody>${map(v.satirlar, s => html`<tr>
          <td>${s.ad}</td><td class="num">${s.deger}</td><td>${KES(s.kes)}</td></tr>`)}</tbody>
      </table>

      <h3 class="printdoc__h">Bu haftanın denemeleri</h3>
      ${v.denemeler.length
        ? html`<table class="table--tight">
            <thead><tr><th>Tarih</th><th>Deneme</th><th>Yayın</th><th class="num">Net</th></tr></thead>
            <tbody>${map(v.denemeler, d => html`<tr>
              <td>${U.fmtDate(d.tarih)}</td><td>${d.ad}</td><td>${d.yayin || '—'}</td>
              <td class="num">${d.net}</td></tr>`)}</tbody>
          </table>
          <p class="printdoc__note">Netler ölçüldü: doğru − yanlış / 4.</p>`
        : html`<p class="printdoc__note">Bu hafta deneme kaydı yok.</p>`}

      <h3 class="printdoc__h">Bu hızla</h3>
      <p class="printdoc__note">${v.hiz.metin} <b>(${v.hiz.etiket})</b></p>

      <p class="printdoc__foot">AYS · kayıtlar öğrencinin cihazında tutulur; bu sayfa
        yazdırılınca hiçbir yere gönderilmez.</p>
    </div>`);
  }

  return { veri, html:htmlOf };
})();
