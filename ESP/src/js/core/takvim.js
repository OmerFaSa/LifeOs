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

  /* TELEFON BİLDİRİMİ (iOS kabuğu, brand/ortak/bildirim.js; 2026-10-09).
     Açıksa (Profil › «Hatırlatıcılar telefonda bildirim olsun») tamamlanmamış
     hatırlatıcı vade gününün BILDIRIM_SAAT'inde bildirim olur, önümüzdeki
     PLAN_GUN gün için. Gecikmiş hatırlatıcı yeniden çaldırılmaz (Bugün
     ekranında durur; borç yazmaz). Her değişiklikte listenin tamamı gider. */
  const BILDIRIM_SAAT = '09:00';
  const PLAN_GUN = 7;
  function bildirimListesi(simdi){
    const b = (window.LIFEOS || {}).BILDIRIM;
    const now = simdi || new Date();
    if(!b) return [];
    const bugun = U().iso(now), son = U().iso(U().addDays(now, PLAN_GUN - 1));
    const ad = id => ((ESP.DISCIPLINE_BY_ID || {})[id] || {}).label || '';
    return (S().reminders || []).filter(r => !r.done && U().isISO(r.due) && r.due >= bugun && r.due <= son
        && (!ESP.Mod || !ESP.Mod.isOn || ESP.Mod.isOn(r.disc)))
      .map(r => ({ anahtar:r.id + '@' + r.due, baslik:'ESP · ' + (ad(r.disc) || 'Hatırlatıcı'),
        govde:String(r.text || 'Hatırlatıcı'), zaman:b.anOf(r.due, BILDIRIM_SAAT), eylem:'Yapıldı' }))
      .filter(x => x.zaman > now.getTime());
  }
  function bildirimAcik(){
    const st = ESP.Office && ESP.Office.settings ? ESP.Office.settings() : {};
    return !!(st && st.telefonBildirim);
  }
  function planla(simdi){
    const b = (window.LIFEOS || {}).BILDIRIM;
    if(!b || !b.var()) return null;
    return b.kur('esp', bildirimAcik() ? bildirimListesi(simdi) : []).catch(() => null);
  }

  /* BİLDİRİMDEKİ «Yapıldı» (brand/ortak/bildirim.js söz 7): kabuk sıraya
     koydu; ESP'nin kendi tamamlama kuralıyla yazılır (tekrarlı olan bir
     sonraki tarihe taşınır). Hatırlatıcı yoksa, kapandıysa ya da vadesi
     değiştiyse (zaten yapıldı) «yok»: ikinci kez tamamlanmaz. */
  async function isaretUygula(o){
    const a = String((o && o.anahtar) || ''), i = a.lastIndexOf('@');
    if(i <= 0) return 'yok';
    const id = a.slice(0, i), due = a.slice(i + 1);
    const r = (S().reminders || []).find(x => x.id === id);
    if(!r || r.done || r.due !== due) return 'yok';
    const z = new Date(Number(o.zaman));
    const res = await ESP.Model.completeReminder(id, isFinite(z.getTime()) ? U().iso(z) : undefined);
    return res && res.ok ? true : 'yok';
  }

  return { yaz, disa, katla, bildirimListesi, bildirimAcik, planla, isaretUygula, BILDIRIM_SAAT, PLAN_GUN };
})();
