/* TAKVİM — ESP'nin takvim aboneliğine yayını (sunucu sözü 17).

   Hesap › Takvim aboneliği tek adreste bütün modüllerin takvimini sunar;
   sunucu satırları ANLAMAZ, yalnız birleştirir. ESP'nin oraya koyduğu:

     · etkin hedeflerin son günü (hedef motoru: son tarih ya da planın
       bitişi) — «ESP hedefi son gün: …»
     · tarihli hedefler (koçun «zamana bağlı hedef» teklifiyle kurulanlar)
     · tamamlanmamış hatırlatıcılar, sıradaki günlerinde (gecikmiş olan
       bugünde: ESP'de vadesi geçen hatırlatıcı tamamlanana dek bekler)

   Değişmezler:
     1. GEÇMİŞ YAZILMAZ: son günü geçmiş hedef ve hatırlatıcı takvime
        girmez (takvimi kalabalıklaştırır, bir şey söylemez).
     2. TÜM GÜN ETKİNLİĞİ: ESP saat kurmaz (rota öncelik söyler, takvim
        değil); etkinlik o günün başlığıdır, meşgul göstermez (TRANSPARENT).
     3. UID KALICIDIR: aynı hedef her yayında aynı UID'yi taşır; takvim
        uygulaması onu yeni bir etkinlik sanmaz.
     5. TEKRAR KURALI YAZILMAZ: ESP'de tekrarlı hatırlatıcının sonraki
        günü TAMAMLANDIĞI günden sayılır (state.js completeReminder); bir
        RRULE bunu yanlış söylerdi. Yalnız sıradaki gün yazılır, tamamlanınca
        yayın yenisini taşır.
     4. Satır 75 OKTETTE katlanır (karakter değil): Türkçe harf iki bayttır. */

window.ESP = window.ESP || {};

ESP.Takvim = (function(){
  /* Tembel: sayfada bu dosya utils.js ve state.js'ten önce yüklenir. */
  const U = () => ESP.U, S = () => ESP.S;

  function kacir(s){
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;')
      .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function katla(satir){
    const enc = new TextEncoder();
    const out = [];
    let parca = '', boy = 0;
    for(const ch of satir){
      const b = enc.encode(ch).length;
      if(boy + b > 75){ out.push(parca); parca = ' '; boy = 1; }
      parca += ch;
      boy += b;
    }
    out.push(parca);
    return out.join('\r\n');
  }
  const gunYaz = iso => String(iso).replace(/-/g, '');
  const sonrakiGun = iso => U().iso(U().addDays(U().parse(iso), 1));

  /* etkinlikler: [{ uid, baslik, bas:'YYYY-MM-DD', aciklama? }] */
  function yaz(etkinlikler, ad){
    const damga = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const s = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LifeOS//ESP//TR', 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', 'X-WR-CALNAME:' + kacir(ad || 'ESP')];
    (etkinlikler || []).forEach(e => {
      if(!e || !U().isISO(e.bas)) return;
      s.push('BEGIN:VEVENT', 'UID:' + kacir(e.uid), 'DTSTAMP:' + damga,
        'DTSTART;VALUE=DATE:' + gunYaz(e.bas), 'DTEND;VALUE=DATE:' + gunYaz(sonrakiGun(e.bas)),
        'SUMMARY:' + kacir(e.baslik));
      if(e.aciklama) s.push('DESCRIPTION:' + kacir(e.aciklama));
      s.push('TRANSP:TRANSPARENT', 'END:VEVENT');
    });
    s.push('END:VCALENDAR');
    return s.map(katla).join('\r\n') + '\r\n';
  }

  function disa(bugunISO){
    const bugun = bugunISO || U().todayISO();
    const ad = id => ((ESP.DISCIPLINE_BY_ID || {})[id] || {}).label || '';
    const l = [];
    const H = ESP.Hedefler;
    ((H && H.aktifler && H.aktifler()) || []).forEach(h => {
      const p = ESP.HedefPlan && ESP.HedefPlan.aktif ? ESP.HedefPlan.aktif(h.id) : null;
      const son = h.son_tarih || (p && p.bitis) || null;
      if(U().isISO(son) && son >= bugun) l.push({ uid:'esp-hedef-' + h.id + '@lifeos', bas:son,
        baslik:'ESP hedefi son gün: ' + H.ozet(h),
        aciklama:h.son_tarih ? 'Hedefin son tarihi.' : 'Hedef planının bitişi.' });
    });
    (S().goals || []).forEach(g => {
      if(g.done || !U().isISO(g.date) || g.date < bugun) return;
      l.push({ uid:'esp-tarihli-' + g.id + '@lifeos', bas:g.date,
        baslik:'ESP · ' + (g.label || 'Hedef') + (ad(g.disc) ? ' (' + ad(g.disc) + ')' : '') });
    });
    (S().reminders || []).forEach(r => {
      if(r.done || !U().isISO(r.due)) return;
      const gecikti = r.due < bugun;
      l.push({ uid:'esp-hatirlatici-' + r.id + '@lifeos', bas:gecikti ? bugun : r.due,
        baslik:'ESP · ' + (r.text || 'Hatırlatıcı') + (ad(r.disc) ? ' (' + ad(r.disc) + ')' : ''),
        aciklama:gecikti ? 'Vadesi ' + r.due + ' idi; tamamlanana dek bekler.' : '' });
    });
    l.sort((a, b) => (a.bas < b.bas ? -1 : a.bas > b.bas ? 1 : 0));
    return { metin:yaz(l, 'ESP — gelişim takvimi'), adet:l.length };
  }

  return { yaz, disa, katla };
})();
