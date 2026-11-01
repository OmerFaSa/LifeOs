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
     5. TEKRAR KURALI (RRULE) AÇILIR: DAILY, WEEKLY (BYDAY, INTERVAL) ve
        MONTHLY tekrarlar bugün ile 365 gün arasına açılır; COUNT, UNTIL,
        EXDATE ve RECURRENCE-ID uygulanır. Tanınmayan kurallar yalnız ilk
        günüyle gelir ve bu söylenir.

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

  function pad2(n){ return String(n).padStart(2, '0'); }

  function ayinGunSayisi(yil, ay){
    if(ay === 2){
      return (yil % 4 === 0 && (yil % 100 !== 0 || yil % 400 === 0)) ? 29 : 28;
    }
    if(ay === 4 || ay === 6 || ay === 9 || ay === 11) return 30;
    return 31;
  }

  function untilGecti(curISO, basSaatli, basSaat, untilStr){
    if(!untilStr) return false;
    const u = tarihOku(untilStr);
    if(!u) return false;
    if(!u.saatli){
      return curISO > u.iso;
    }
    const eSaat = basSaatli ? basSaat : 0;
    if(curISO > u.iso) return true;
    if(curISO === u.iso && eSaat > u.saat) return true;
    return false;
  }

  function oku(metin, bugunISO){
    const ham = String(metin || '');
    if(!/BEGIN:VCALENDAR/i.test(ham)) return { ok:false, why:'Bu bir .ics takvim dosyası değil.' };
    const bugun = bugunISO || U.todayISO();
    const bitisSinir = U.iso(U.addDays(U.parse(bugun), 365));
    const satirlar = ham.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
    const veventler = [], notlar = [];
    let e = null, bozuk = 0;
    for(const satir of satirlar){
      const i = satir.indexOf(':');
      if(i < 0) continue;
      const sol = satir.slice(0, i), deger = satir.slice(i + 1);
      const ad = sol.split(';')[0].toUpperCase();
      if(ad === 'BEGIN' && /^VEVENT$/i.test(deger.trim())){ e = {}; continue; }
      if(ad === 'END' && /^VEVENT$/i.test(deger.trim())){
        if(e && e.bas){
          veventler.push(e);
        }else if(e){ bozuk++; }
        e = null;
        continue;
      }
      if(!e) continue;
      if(ad === 'UID') e.uid = coz(deger).slice(0, 200);
      else if(ad === 'SUMMARY') e.baslik = coz(deger).slice(0, 160);
      else if(ad === 'DESCRIPTION') e.aciklama = coz(deger).slice(0, 300);
      else if(ad === 'RRULE') e.rrule = deger.trim();
      else if(ad === 'EXDATE'){
        e.exdates = e.exdates || [];
        deger.split(',').forEach(p => { const s = p.trim(); if(s) e.exdates.push(s); });
      }
      else if(ad === 'RECURRENCE-ID') e.recurrence_id = deger.trim();
      else if(ad === 'DTSTART'){
        const t = tarihOku(deger);
        if(t){ e.bas = t.iso; e.basSaatli = t.saatli; e.basSaat = t.saat; }
      }
      else if(ad === 'DTEND'){
        const t = tarihOku(deger);
        if(t) e.son = t;
      }
    }

    veventler.forEach(x => {
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

    const recIdsByUid = {};
    veventler.forEach(x => {
      if(x.uid && x.recurrence_id){
        const t = tarihOku(x.recurrence_id);
        if(t){
          recIdsByUid[x.uid] = recIdsByUid[x.uid] || new Set();
          recIdsByUid[x.uid].add(t.iso);
        }
      }
    });

    const etkinlikler = [];
    let taninmayanTekrar = 0;
    const GUN_KODLARI = { MO:0, TU:1, WE:2, TH:3, FR:4, SA:5, SU:6 };

    for(const o of veventler){
      if(etkinlikler.length >= EN_COK) break;

      // RECURRENCE-ID varsa doğrudan tekil etkinlik olarak eklenir
      if(o.recurrence_id){
        etkinlikler.push({
          uid: o.uid,
          baslik: o.baslik,
          aciklama: o.aciklama,
          bas: o.bas,
          bit: o.bit,
          basSaatli: o.basSaatli,
          tekrar: false
        });
        continue;
      }

      // Tekrarsız etkinlik
      if(!o.rrule){
        etkinlikler.push({
          uid: o.uid,
          baslik: o.baslik,
          aciklama: o.aciklama,
          bas: o.bas,
          bit: o.bit,
          basSaatli: o.basSaatli,
          tekrar: false
        });
        continue;
      }

      // RRULE var: kuralları ayrıştır
      const kurallar = {};
      o.rrule.split(';').forEach(p => {
        const es = p.indexOf('=');
        if(es > 0){
          kurallar[p.slice(0, es).trim().toUpperCase()] = p.slice(es + 1).trim();
        }
      });

      const freq = (kurallar.FREQ || '').toUpperCase();
      if(freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY'){
        taninmayanTekrar++;
        etkinlikler.push({
          uid: o.uid,
          baslik: o.baslik,
          aciklama: o.aciklama,
          bas: o.bas,
          bit: o.bit,
          basSaatli: o.basSaatli,
          tekrar: true
        });
        continue;
      }

      let interval = parseInt(kurallar.INTERVAL, 10);
      if(isNaN(interval) || interval <= 0) interval = 1;

      let count = null;
      if('COUNT' in kurallar){
        count = parseInt(kurallar.COUNT, 10);
        if(isNaN(count) || count < 0) count = 0;
      }

      const untilStr = kurallar.UNTIL || null;
      const sureGun = Math.max(0, U.diffDays(o.bas, o.bit));
      const esikBasi = U.iso(U.addDays(U.parse(bugun), -sureGun));

      const exdateSet = new Set();
      (o.exdates || []).forEach(p => {
        const t = tarihOku(p);
        if(t) exdateSet.add(t.iso);
      });
      if(recIdsByUid[o.uid]){
        recIdsByUid[o.uid].forEach(iso => exdateSet.add(iso));
      }

      if(freq === 'DAILY'){
        let cur = o.bas;
        if(count == null && cur < esikBasi){
          const farkGun = U.diffDays(cur, esikBasi);
          const atla = Math.floor(farkGun / interval) * interval;
          if(atla > 0) cur = U.iso(U.addDays(U.parse(cur), atla));
        }

        let dongu = 50000;
        let toplam = 0;
        while(dongu-- > 0){
          if(untilGecti(cur, o.basSaatli, o.basSaat || 0, untilStr)) break;
          if(count != null && toplam >= count) break;
          if(cur >= bitisSinir) break;

          const cur_bit = sureGun === 0 ? cur : U.iso(U.addDays(U.parse(cur), sureGun));
          toplam++;

          if(cur_bit >= bugun && !exdateSet.has(cur)){
            etkinlikler.push({
              uid: o.uid + '@' + cur,
              baslik: o.baslik,
              aciklama: o.aciklama,
              bas: cur,
              bit: cur_bit,
              basSaatli: o.basSaatli,
              tekrar: true
            });
            if(etkinlikler.length >= EN_COK) break;
          }
          cur = U.iso(U.addDays(U.parse(cur), interval));
        }
      }else if(freq === 'WEEKLY'){
        let byday = [];
        if(kurallar.BYDAY){
          kurallar.BYDAY.toUpperCase().split(',').forEach(g => {
            const kod = g.trim().slice(-2);
            if(kod in GUN_KODLARI && byday.indexOf(GUN_KODLARI[kod]) < 0){
              byday.push(GUN_KODLARI[kod]);
            }
          });
          byday.sort((a, b) => a - b);
        }
        if(!byday.length){
          byday = [U.weekdayIndex(o.bas)];
        }

        let wBasi = U.iso(U.addDays(U.parse(o.bas), -U.weekdayIndex(o.bas)));
        if(count == null){
          const wSonu = U.iso(U.addDays(U.parse(wBasi), 7));
          if(wSonu < esikBasi){
            const farkHafta = Math.floor(U.diffDays(wBasi, esikBasi) / 7);
            const atlaHafta = Math.floor(farkHafta / interval) * interval;
            if(atlaHafta > 0){
              wBasi = U.iso(U.addDays(U.parse(wBasi), atlaHafta * 7));
            }
          }
        }

        let dongu = 50000;
        let toplam = 0;
        let bitti = false;
        while(dongu-- > 0 && !bitti){
          for(const gunIdx of byday){
            const cur = U.iso(U.addDays(U.parse(wBasi), gunIdx));
            if(cur < o.bas) continue;
            if(untilGecti(cur, o.basSaatli, o.basSaat || 0, untilStr)){ bitti = true; break; }
            if(count != null && toplam >= count){ bitti = true; break; }
            if(cur >= bitisSinir){ bitti = true; break; }

            const cur_bit = sureGun === 0 ? cur : U.iso(U.addDays(U.parse(cur), sureGun));
            toplam++;

            if(cur_bit >= bugun && !exdateSet.has(cur)){
              etkinlikler.push({
                uid: o.uid + '@' + cur,
                baslik: o.baslik,
                aciklama: o.aciklama,
                bas: cur,
                bit: cur_bit,
                basSaatli: o.basSaatli,
                tekrar: true
              });
              if(etkinlikler.length >= EN_COK){ bitti = true; break; }
            }
          }
          wBasi = U.iso(U.addDays(U.parse(wBasi), interval * 7));
        }
      }else if(freq === 'MONTHLY'){
        const basD = U.parse(o.bas);
        const basGun = basD.getDate();
        const basYil = basD.getFullYear();
        const basAy = basD.getMonth() + 1;

        let adimAy = 0;
        if(count == null){
          const bugunD = U.parse(bugun);
          const farkAy = (bugunD.getFullYear() - basYil) * 12 + ((bugunD.getMonth() + 1) - basAy);
          if(farkAy > interval){
            adimAy = Math.floor((farkAy - 1) / interval) * interval;
          }
        }

        let dongu = 50000;
        let toplam = 0;
        while(dongu-- > 0){
          const toplamAy = (basYil * 12 + (basAy - 1)) + adimAy;
          const hYil = Math.floor(toplamAy / 12);
          const hAy = (toplamAy % 12) + 1;
          const ayBasi = hYil + '-' + pad2(hAy) + '-01';
          if(ayBasi >= bitisSinir) break;

          const maxGun = ayinGunSayisi(hYil, hAy);
          if(basGun <= maxGun){
            const cur = hYil + '-' + pad2(hAy) + '-' + pad2(basGun);
            if(untilGecti(cur, o.basSaatli, o.basSaat || 0, untilStr)) break;
            if(count != null && toplam >= count) break;
            if(cur >= bitisSinir) break;

            const cur_bit = sureGun === 0 ? cur : U.iso(U.addDays(U.parse(cur), sureGun));
            toplam++;

            if(cur_bit >= bugun && !exdateSet.has(cur)){
              etkinlikler.push({
                uid: o.uid + '@' + cur,
                baslik: o.baslik,
                aciklama: o.aciklama,
                bas: cur,
                bit: cur_bit,
                basSaatli: o.basSaatli,
                tekrar: true
              });
              if(etkinlikler.length >= EN_COK) break;
            }
          }
          adimAy += interval;
        }
      }
    }

    if(taninmayanTekrar) notlar.push(taninmayanTekrar + ' etkinliğin tekrar kuralı desteklenmiyor; yalnız ilk günü gelir.');
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
    const bugun = bugunISO || U.todayISO();
    const r = oku(metin, bugun);
    if(!r.ok) return r;
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
