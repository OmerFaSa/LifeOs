/* TAKVİM — .ics içe ve dışa aktarma (RFC 5545'in gerektiği kadarı).

   İÇE: okulun ya da telefonun takvimi (.ics) okunur; her etkinlik için
   bir tür ÖNERİLİR (başlıkta «tatil», «bayram» → tatil; «sınav», «yazılı»
   → okul sınavı) ama hiçbir şey kendiliğinden yazılmaz: önizleme satır
   satır gösterilir, türü kullanıcı seçer (ya da «atla»), onaylanınca
   Rehber › İstisnalar'a takvim kaydı olur (R.Model.saveCalendar) ve
   günlerin planı core/istisna.js kuralıyla güncellenir.

   Değişmezler:
     1. TAHMİN SORULUR. Türü tanınmayan etkinlik «atla» ile gelir; öneri
        bir karar değildir, kullanıcı değiştirebilir.
     2. GEÇMİŞE YAZILMAZ. Bitmiş etkinlik alınmaz (istisna geçmişe yazılmaz).
     3. AYNI ŞEY İKİ KEZ GİRMEZ. Aynı UID ya da aynı tarih + tür kaydı
        varsa «zaten var» denir.
     4. ÇOK UZUN ETKİNLİK ALINMAZ. «Güz dönemi» gibi aylarca süren bir
        etkinlik bir istisna değil bir dönemdir; 60 günü aşan satır atlanır.
     5. TEKRAR KURALI (RRULE) OKUNMAZ ve bu SÖYLENİR: yalnız ilk gün gelir.

   DIŞA: takvim istisnaları, TYT/AYT günü ve etkin hedeflerin son tarihleri
   tüm gün etkinliği olarak; telefonun takvimine eklenebilir. */

window.R = window.R || {};

R.Takvim = (function(){
  const U = R.U;
  const EN_COK = 500;              // bir dosyadan okunacak etkinlik
  const EN_UZUN_GUN = 60;
  const TURLER = ['tatil', 'okulSinavi', 'yogun', 'ekstra'];

  /* ------------------------------------------------------------ yazma */

  function kacir(s){
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;')
      .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  /* Satır katlama: 75 OKTET (karakter değil). Türkçe harf iki bayttır;
     karakter sayarak katlamak bazı takvimlerde satırı bozar. */
  function katla(satir){
    const enc = new TextEncoder();
    const out = [];
    let parca = '', boy = 0, sinir = 75;
    for(const ch of satir){
      const b = enc.encode(ch).length;
      if(boy + b > sinir){
        out.push(parca);
        parca = ' ';
        boy = 1;
        sinir = 75;
      }
      parca += ch;
      boy += b;
    }
    out.push(parca);
    return out.join('\r\n');
  }

  function gunYaz(iso){ return String(iso).replace(/-/g, ''); }
  function sonrakiGun(iso){ return U.iso(U.addDays(U.parse(iso), 1)); }

  /* etkinlikler: [{ uid, baslik, bas:'YYYY-MM-DD', bit?:'YYYY-MM-DD' (dahil), aciklama? }] */
  function yaz(etkinlikler, ad){
    const damga = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const s = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LifeOS//AYS//TR', 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', 'X-WR-CALNAME:' + kacir(ad || 'AYS')];
    (etkinlikler || []).forEach(e => {
      if(!e || !U.isISO(e.bas)) return;
      const bit = U.isISO(e.bit) && e.bit >= e.bas ? e.bit : e.bas;
      s.push('BEGIN:VEVENT', 'UID:' + kacir(e.uid), 'DTSTAMP:' + damga,
        'DTSTART;VALUE=DATE:' + gunYaz(e.bas), 'DTEND;VALUE=DATE:' + gunYaz(sonrakiGun(bit)),
        'SUMMARY:' + kacir(e.baslik));
      if(e.aciklama) s.push('DESCRIPTION:' + kacir(e.aciklama));
      s.push('TRANSP:TRANSPARENT', 'END:VEVENT');
    });
    s.push('END:VCALENDAR');
    return s.map(katla).join('\r\n') + '\r\n';
  }

  /* ------------------------------------------------------------ okuma */

  function coz(deger){
    return String(deger || '').replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim();
  }

  /* «20260923», «20260923T090000», «20260923T090000Z» → tarih; bozuksa null. */
  function tarihOku(deger){
    const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(deger || '').trim());
    if(!m) return null;
    const iso = m[1] + '-' + m[2] + '-' + m[3];
    if(!U.isISO(iso)) return null;
    /* Sondaki «Z» UTC'dir: yerel gune ve saate cevrilir. Google Takvim
       saatli etkinligi boyle disa aktarir; «20260619T220000Z» Istanbul'da
       20 Haziran 01:00'dir, 19'u degil (belgeler/ekip/HATALAR.md O-10). */
    if(m[4] && m[7]){
      const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
      if(isNaN(d.getTime())) return null;
      return { iso:U.iso(d), saatli:true, saat:d.getHours() * 60 + d.getMinutes() };
    }
    return { iso, saatli:!!m[4], saat:m[4] ? Number(m[4]) * 60 + Number(m[5]) : 0 };
  }

  function oku(metin){
    const ham = String(metin || '');
    if(!/BEGIN:VCALENDAR/i.test(ham)) return { ok:false, why:'Bu bir .ics takvim dosyası değil.' };
    const satirlar = ham.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
    const etkinlikler = [], notlar = [];
    let e = null, tekrarli = 0, bozuk = 0;
    for(const satir of satirlar){
      const i = satir.indexOf(':');
      if(i < 0) continue;
      const sol = satir.slice(0, i), deger = satir.slice(i + 1);
      const ad = sol.split(';')[0].toUpperCase();
      if(ad === 'BEGIN' && /^VEVENT$/i.test(deger.trim())){ e = {}; continue; }
      if(ad === 'END' && /^VEVENT$/i.test(deger.trim())){
        if(e && e.bas){
          if(etkinlikler.length < EN_COK) etkinlikler.push(e);
        }else if(e){ bozuk++; }
        e = null;
        continue;
      }
      if(!e) continue;
      if(ad === 'UID') e.uid = coz(deger).slice(0, 200);
      else if(ad === 'SUMMARY') e.baslik = coz(deger).slice(0, 160);
      else if(ad === 'DESCRIPTION') e.aciklama = coz(deger).slice(0, 300);
      else if(ad === 'RRULE'){ e.tekrar = true; tekrarli++; }
      else if(ad === 'DTSTART'){ const t = tarihOku(deger); if(t){ e.bas = t.iso; e.basSaatli = t.saatli; } }
      else if(ad === 'DTEND'){ const t = tarihOku(deger); if(t) e.son = t; }
    }
    etkinlikler.forEach(x => {
      /* Tüm gün etkinliğinin DTEND'i HARİÇ tutulur (ertesi gün); saatli
         etkinlik bitiş gününde biter, gece yarısında bitiyorsa önceki gün. */
      if(x.son){
        let bit = x.son.iso;
        if(!x.son.saatli || x.son.saat === 0) bit = U.iso(U.addDays(U.parse(bit), -1));
        x.bit = bit < x.bas ? x.bas : bit;
      }else{
        x.bit = x.bas;
      }
      delete x.son;
      if(!x.baslik) x.baslik = 'Adsız etkinlik';
      if(!x.uid) x.uid = 'ics-' + x.bas + '-' + x.baslik.slice(0, 40);
    });
    if(tekrarli) notlar.push(tekrarli + ' etkinliğin tekrar kuralı okunmadı; yalnız ilk günü gelir.');
    if(bozuk) notlar.push(bozuk + ' etkinliğin tarihi okunamadı; atlandı.');
    return { ok:true, etkinlikler, notlar };
  }

  /* Tür ÖNERİSİ — karar değil. Tanınmayan «atla» ile gelir. */
  function turOner(baslik){
    const k = String(baslik || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
    if(/(tatil|bayram|arife|yılbaşı|izin|ara tatil|yarıyıl|sömestr|resmi tatil|resmî tatil)/.test(k)) return 'tatil';
    if(/(sınav|yazılı|quiz|vize|final|deneme sınavı|ara sınav)/.test(k)) return 'okulSinavi';
    return null;
  }

  /* Önizleme satırları: her etkinlik için durum ve önerilen tür. */
  function onizle(metin, bugunISO){
    const r = oku(metin);
    if(!r.ok) return r;
    const bugun = bugunISO || U.todayISO();
    const kayitli = (R.S.calendar || []);
    const satirlar = r.etkinlikler.map(e => {
      const gun = U.diffDays(e.bas, e.bit) + 1;
      const var_ = kayitli.some(c => (c.icsUid && c.icsUid === e.uid)
        || (c.from === e.bas && (c.to || c.from) === e.bit && c.kind === turOner(e.baslik)));
      const durum = e.bit < bugun ? 'gecmis' : gun > EN_UZUN_GUN ? 'uzun' : var_ ? 'var' : 'yeni';
      return { uid:e.uid, baslik:e.baslik, bas:e.bas, bit:e.bit, gun, tekrar:!!e.tekrar,
        durum, tur:durum === 'yeni' ? turOner(e.baslik) : null };
    }).sort((a, b) => a.bas.localeCompare(b.bas));
    return { ok:true, satirlar, notlar:r.notlar };
  }

  const DURUM_ADI = { gecmis:'geçmiş — alınmaz', uzun:'60 günden uzun — bir dönem, istisna değil',
    var:'zaten var' };

  /* Seçilenleri istisna olarak yazar. `secim`: { uid: tur | null }. */
  async function iceAl(onizleme, secim){
    let eklenen = 0;
    for(const s of (onizleme && onizleme.satirlar) || []){
      const tur = secim && secim[s.uid];
      if(s.durum !== 'yeni' || TURLER.indexOf(tur) < 0) continue;
      await R.Model.saveCalendar({ kind:tur, from:s.bas, to:s.bit === s.bas ? null : s.bit,
        note:s.baslik.slice(0, 120), kaynak:'ics', icsUid:s.uid });
      eklenen++;
    }
    return { eklenen };
  }

  /* ------------------------------------------------------------ dışa */

  function disa(bugunISO){
    const bugun = bugunISO || U.todayISO();
    const alt = U.iso(U.addDays(U.parse(bugun), -30));
    const K = (R.Model && R.Model.CALENDAR_KINDS) || {};
    const l = [];
    (R.S.calendar || []).filter(c => (c.to || c.from) >= alt).forEach(c => l.push({
      uid:'ays-istisna-' + c.id + '@lifeos', bas:c.from, bit:c.to || c.from,
      baslik:'AYS · ' + ((K[c.kind] || {}).label || c.kind) + (c.note ? ': ' + c.note : ''),
      aciklama:'AYS istisnası — plan bu günlerde yük oranında değişir.' }));
    [['TYT', R.PLAN.examTytISO], ['AYT', R.PLAN.examAytISO]].forEach(x => {
      if(x[1] && x[1] >= bugun) l.push({ uid:'ays-sinav-' + x[0] + '-' + x[1] + '@lifeos', bas:x[1],
        baslik:x[0] + ' sınav günü', aciklama:'Profildeki sınav tarihi.' });
    });
    ((R.Hedefler && R.Hedefler.aktifler()) || []).forEach(h => {
      if(h.son_tarih && h.son_tarih >= bugun) l.push({ uid:'ays-hedef-' + h.id + '@lifeos',
        bas:h.son_tarih, baslik:'AYS hedefi son gün: ' + R.Hedefler.ozet(h) });
    });
    return { metin:yaz(l, 'AYS — sınav takvimi'), adet:l.length };
  }

  /* ------------------------------------------------------------ telefon */

  /* TELEFON BİLDİRİMİ (iOS kabuğu, brand/ortak/bildirim.js; 2026-10-09).
     Ofis › Telefon bildirimi açıksa önümüzdeki PLAN_GUN gün içinde:
       · her gün kullanıcının seçtiği saatte «Bugünün planı» — yükü sıfır
         olan istisna günü (tatil, izin) atlanır; okul sınavı ve yoğun gün
         planı küçültür, kaldırmaz;
       · etkin hedefin son günü 09:00'da, bir gün önce 20:00'de (askıdaki
         hedef dürtmez);
       · sınav gününden bir gün önce 20:00'de — YALNIZ kullanıcı tarihi
         profilde değiştirdiyse: planın varsayılan tarihi ÖSYM duyurusuna
         kadar TAHMİNDİR (data/curriculum.js; screens/plan.js aynı kural),
         tahmin edilmiş bir güne «yarın sınav» denmez (AGENTS §1.2).
     Sessiz saat ve tür ayarı (brand/ortak/pwa.js) burada da geçerlidir.
     Her seferinde listenin tamamı gider; kapalıysa boş liste (kabuk
     bekleyenleri siler). */
  const PLAN_GUN = 7;
  const SAAT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  function bildirimAyari(){
    const st = R.Office && R.Office.settings ? R.Office.settings() : {};
    return { acik:!!(st && st.telefonBildirim),
      saat:SAAT_RE.test((st && st.telefonSaat) || '') ? st.telefonSaat : '08:00' };
  }
  function bildirimListesi(simdi){
    const b = (window.LIFEOS || {}).BILDIRIM;
    if(!b) return [];
    const now = simdi || new Date();
    const a = bildirimAyari(), P = (window.LIFEOS || {}).Pwa;
    const bugun = U.iso(now), gun = n => U.iso(U.addDays(now, n));
    const sinir = b.anOf(gun(PLAN_GUN), '00:00');
    const out = [];
    const ekle = (anahtar, g, saat, baslik, govde) => {
      const zaman = b.anOf(g, saat);
      if(zaman <= now.getTime() || zaman >= sinir) return;
      if(P && P.gonderilebilir && !P.gonderilebilir('ays', 'plan', new Date(zaman)).ok) return;
      out.push({ anahtar, baslik, govde, zaman });
    };
    const K = (R.Model && R.Model.CALENDAR_KINDS) || {};
    const bos = g => (R.S.calendar || []).some(c => c.from <= g && (c.to || c.from) >= g
      && Number(c.load != null ? c.load : (K[c.kind] || {}).load) === 0);
    for(let i = 0; i < PLAN_GUN; i++){
      const g = gun(i);
      if(!bos(g)) ekle('plan@' + g, g, a.saat, 'AYS · Bugünün planı', 'Günün blokları Bugün ekranında.');
    }
    ((R.Hedefler && R.Hedefler.aktifler()) || []).forEach(h => {
      const t = h.son_tarih;
      if(h.durum !== 'aktif' || !U.isISO(t) || t < bugun) return;
      const ad = R.Hedefler.ozet(h);
      ekle('hedef@' + h.id + '@' + t, t, '09:00', 'AYS · Hedefin son günü', ad);
      ekle('hedef-once@' + h.id + '@' + t, U.iso(U.addDays(U.parse(t), -1)), '20:00', 'AYS · Hedefin son günü yarın', ad);
    });
    [['TYT', R.PLAN.examTytISO, R.PROGRAM.examTytISO], ['AYT', R.PLAN.examAytISO, R.PROGRAM.examAytISO]].forEach(x => {
      if(!U.isISO(x[1]) || x[1] === x[2] || x[1] <= bugun) return;
      ekle('sinav@' + x[0] + '@' + x[1], U.iso(U.addDays(U.parse(x[1]), -1)), '20:00',
        'AYS · ' + x[0] + ' yarın', 'Sınav günü: ' + U.fmtDate(x[1]) + '.');
    });
    return out;
  }
  function planla(simdi){
    const b = (window.LIFEOS || {}).BILDIRIM;
    if(!b || !b.var()) return null;
    return b.kur('ays', bildirimAyari().acik ? bildirimListesi(simdi) : []).catch(() => null);
  }

  return { yaz, oku, onizle, iceAl, disa, turOner, katla, DURUM_ADI, TURLER, EN_UZUN_GUN,
    bildirimAyari, bildirimListesi, planla, PLAN_GUN };
})();
