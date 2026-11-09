/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/olcu.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ÖLÇÜ SORULARI — «bu hafta kaç soru çözdüm», «TYT net ortalamam kaç», «kilom son
   bir ayda nasıl değişti», «gitar çalışmam son 2 haftada arttı mı».

   King 5 tur 5 (233 günlük simülasyon, 2026-11-08): kayıt eksiksiz yazılıyordu ama
   okuma çöküyordu; veri varken King «veri mevcut değil» diyordu. Kök neden: dönemli
   sayı sorusu küçük modelin doğru aracı seçmesine kalmıştı ve modelin bağlamı yalnız
   hüküm cümleleridir, günlük sayılar değil.

   Burada sayıyı KOD üretir (AGENTS §1): dönem ve ölçü cümleden kuralla okunur, değer
   modülün kendi kaydından hesaplanır. Kayıt olmayan gün sıfır sayılmaz: toplam, kayıtlı
   günlerin toplamıdır ve kaç günde kayıt olduğu söylenir. Kural tutmazsa cümle eskisi
   gibi yoluna gider (model).

   Modül kurar:
     OLCU.kur({ modul, olculer:[{ id, ad, birim, es:RegExp, tur, gun?, olaylar?, anlik?, alt?, ondalik? }] })
       tur 'toplam'   gun(iso) → sayı | null           (soru, dakika)
           'ortalama' gun(iso) → sayı | null           (uyku, su)
           'son'      gun(iso) → sayı | null           (kilo: dönemin ilk ve son ölçümü)
           'olay'     olaylar(alt) → [{ t:iso, v }]    (deneme neti; «son 5 denemede»)
           'anlik'    anlik() → { v, metin } | null    (sınava kalan gün)
       alt: [[ad, RegExp]] — ölçünün alt kırılımı (ders, disiplin); cümlede geçerse seçilir.
   King sorar: OLCU.coz(metin, bugunISO) → { id, cevap, satirlar } | null */
window.LIFEOS = window.LIFEOS || {};
window.LIFEOS.OLCU = (function(){
  let ayar = null;
  const kucuk = s => String(s || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
  const SORU = /(kaç|ne kadar|ortalama|toplam|değiş|arttı|azaldı|düştü|yükseldi|verdim mi|aldım mı|trend|gidiyor|nasıl gitti|nasıl geçti|nasıl uyu|ilerle|karşılaştır|daha (?:çok|az|fazla)|ne çalıştım|ne yaptım|en zayıf|en güçlü|iyi mi|yeterli mi|hangisi|daha mı|göre|sayı\w* (?:ne|kaç))/;
  const BASKA = /(hedef|kaç bine|sıralama|puan|kart|deste|yüzde kaç|ne işe yar|nedir|ne demek|ilişki|etkisi|günler(?:de|i)?\b|neden|sence|doz|almalıyım|içmeliyim|kaç tane)/;
  const DEGISIM = /(değiş|arttı|azaldı|düştü|yükseldi|verdim mi|aldım mı|trend|ilerle|daha mı|geçen haftaya göre|öncekine göre|karşılaştır|daha (?:çok|az|fazla))/;
  const SAYI = { bir:1, iki:2, üç:3, dört:4, beş:5, altı:6, yedi:7, sekiz:8, dokuz:9, on:10, otuz:30 };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const gunEkle = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const tarihYaz = s => Number(s.slice(8)) + ' ' + AY[Number(s.slice(5, 7)) - 1];
  const yaz = (v, o) => v == null ? '—' : (Math.round(v * (o || 1)) / (o || 1)).toLocaleString('tr-TR');

  function kur(o){ ayar = o && Array.isArray(o.olculer) ? o : null; }

  /* Dönem: { bas, son, ad } ya da { adet, ad } (son N olay). */
  const AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
  const AY_RE = new RegExp('(?:^|\\s)(' + AYLAR.join('|') + ')(?:da|de|ta|te|a|e|ya|ye|ın|in|un|ün|ında|inde|unda|ünde)?(?:\\s+ay[ıi]nda)?(?=\\s|$|[?.!,])', 'g');
  function ayDonem(ay, bugun){
    let y = Number(bugun.slice(0, 4));
    if(ay > Number(bugun.slice(5, 7))) y--;                     // söylenen ay bu yıl henüz gelmediyse geçen yılın ayı
    const bas = y + '-' + String(ay).padStart(2, '0') + '-01';
    const d = new Date(y, ay, 0), son = iso(d) < bugun ? iso(d) : bugun;
    return { bas, son, ad:AYLAR[ay - 1] };
  }
  function donem(t, bugun){
    const n = x => SAYI[x] || Number(x);
    const aylar = [...t.matchAll(AY_RE)].map(m => AYLAR.indexOf(m[1]) + 1).filter(x => x > 0);
    if(aylar.length){ const d = ayDonem(aylar[0], bugun); if(aylar.length > 1) d.once = ayDonem(aylar[1], bugun); return d; }
    let m = t.match(/son (\d+|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on) (deneme|sınav)/);
    if(m) return { adet:n(m[1]), ad:'son ' + n(m[1]) + ' deneme' };
    m = t.match(/son (\d+|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|otuz) (gün|hafta|ay)/);
    if(m){ const k = n(m[1]) * (m[2] === 'gün' ? 1 : m[2] === 'hafta' ? 7 : 30); return { bas:gunEkle(bugun, 1 - k), son:bugun, ad:'son ' + n(m[1]) + ' ' + m[2] }; }
    if(/son bir ay|son 1 ay|bu ay(?!ın)/.test(t) && !/geçen ay/.test(t)){
      if(/bu ay/.test(t)) return { bas:bugun.slice(0, 8) + '01', son:bugun, ad:'bu ay' };
      return { bas:gunEkle(bugun, -29), son:bugun, ad:'son 30 gün' };
    }
    if(/geçen ay/.test(t)){ const d = new Date(bugun.slice(0, 8) + '01T12:00:00'); d.setDate(0); return { bas:iso(d).slice(0, 8) + '01', son:iso(d), ad:'geçen ay' }; }
    const dow = (new Date(bugun + 'T12:00:00').getDay() + 6) % 7;   // pazartesi 0
    if(/bu hafta|haftalık/.test(t)) return { bas:gunEkle(bugun, -dow), son:bugun, ad:'bu hafta' };   // «bu hafta … geçen haftaya göre» bu haftadır
    if(/geçen hafta/.test(t)) return { bas:gunEkle(bugun, -dow - 7), son:gunEkle(bugun, -dow - 1), ad:'geçen hafta' };
    if(/\bdün\b|dünkü/.test(t)) return { bas:gunEkle(bugun, -1), son:gunEkle(bugun, -1), ad:'dün' };
    if(/bugün/.test(t)) return { bas:bugun, son:bugun, ad:'bugün' };
    if(/(bu yaz|yaz nasıl|yazın\b|yaz tatili)/.test(t)) return { bas:bugun.slice(0, 4) + '-06-21', son:bugun < bugun.slice(0, 4) + '-09-22' ? bugun : bugun.slice(0, 4) + '-09-22', ad:'bu yaz' };
    if(/bu yıl|bu sene/.test(t)) return { bas:bugun.slice(0, 4) + '-01-01', son:bugun, ad:'bu yıl' };
    return null;
  }

  function olcuBul(t){
    if(!ayar) return null;
    for(const o of ayar.olculer.filter(o => o.ozel).concat(ayar.olculer.filter(o => !o.ozel))){
      if(!o.es.test(t)) continue;
      const alt = (o.alt || []).find(a => a[1].test(t));
      return { o, alt:alt ? alt[0] : null };
    }
    return null;
  }

  function gunler(bas, son){ const l = []; for(let g = bas; g <= son; g = gunEkle(g, 1)) l.push(g); return l; }
  function topla(o, alt, d){
    const l = gunler(d.bas, d.son).map(g => ({ g, v:o.gun(g, alt) })).filter(x => x.v != null && isFinite(x.v));
    const t = l.reduce((s, x) => s + x.v, 0);
    return { l, deger:!l.length ? null : o.tur === 'ortalama' ? t / l.length : o.tur === 'son' ? l[l.length - 1].v : t };
  }

  const OZET = /(genel olarak|nasıl geçti|nasıldım|nasılım|özetle|özetini çıkar|nasıl gidiyorum)/;
  /* Dönem özeti: modülün ölçüleri (genel olmayan, toplam/ortalama/son ve deneme) tek cevapta. */
  function ozet(t, bugun){
    const kars = /(göre|karşılaştır|kıyasla)/.test(t);
    let d = donem(t, bugun) || { bas:gunEkle(bugun, -29), son:bugun, ad:'son 30 gün' };
    if(kars && /bu ay/.test(t)) d = { bas:bugun.slice(0, 8) + '01', son:bugun, ad:'bu ay' };
    /* King-Bench: «bu ay geçen aya göre» önceki dönemi de yazar (yalnız «geçen ay» okunuyordu). */
    const d0 = !kars ? null : d.ad === 'bu ay' ? donem('geçen ay', bugun) : d.ad === 'bu hafta' ? donem('geçen hafta', bugun) : null;
    const satir = [];
    for(const o of ayar.olculer){
      if(o.tur === 'anlik' || o.komut) continue;
      if(o.tur === 'olay'){
        const l = (o.olaylar(null, t) || []).filter(x => x && x.v != null && x.t >= d.bas && x.t <= d.son).sort((x, y) => x.t < y.t ? -1 : 1);
        if(l.length) satir.push((typeof o.adOf === 'function' ? o.adOf(t) : o.ad) + ': ' + l.length + ' ' + (o.olayAd || 'deneme') + ', ' + yaz(l[0].v, 100) + ' → ' + yaz(l[l.length - 1].v, 100));
        continue;
      }
      const r = topla(o, null, d);
      if(r.deger == null) continue;
      const r0 = d0 ? topla(o, null, d0) : null;
      satir.push(o.ad.charAt(0).toLocaleUpperCase('tr') + o.ad.slice(1) + ': ' + (o.tur === 'ortalama' ? 'ortalama ' : '') + yaz(r.deger, o.ondalik ? 10 : 1) + ' ' + o.birim + ' (' + r.l.length + ' gün)'
        + (r0 && r0.deger != null ? ' · ' + d0.ad + ' ' + yaz(r0.deger, o.ondalik ? 10 : 1) + ' (' + r0.l.length + ' gün)' : ''));
    }
    const bas = d.ad.charAt(0).toLocaleUpperCase('tr') + d.ad.slice(1);
    return { id:'ozet', cevap:satir.length ? bas + ' kayıtlarından:' : bas + ' için kayıt yok.', satirlar:satir.length ? satir : null };
  }

  /* HAFTALIK DEĞERLENDİRME (King-Bench koçluk paketi): bu hafta, geçen haftanın AYNI günleriyle (pazartesi → bugünün
     karşılığı) karşılaştırılır; adil olsun diye yarım hafta tam haftayla kıyaslanmaz. İyi giden = en çok artan,
     aksayan = en çok düşen ya da bu hafta hiç girilmeyen ölçü. Öneri sayıdır: geçen haftayı yakalamak için kalan
     günlerde gün başı ne gerektiği. Kilo gibi yönü kişiye bağlı ölçüler («son») iyi/kötü sayılmaz. */
  const HAFTA_DEG = /(haftamı (?:değerlendir|özetle|incele)|geçen haftaya göre (?:nasıl|ne durumda)|haftayı değerlendir|haftalık değerlendirme|bu hafta(?:m)? nasıl geçti|bu hafta(?:m)? nasıl gidiyor|bu hafta kendime (?:iyi )?bakt|bu hafta nasıl(?:ım|dım)|haftam nasıl)/;
  function haftaDegerlendir(bugun){
    const dow = (new Date(bugun + 'T12:00:00').getDay() + 6) % 7;
    const d = { bas:gunEkle(bugun, -dow), son:bugun }, d0 = { bas:gunEkle(bugun, -dow - 7), son:gunEkle(bugun, -7) };
    const l = [];
    for(const o of ayar.olculer){
      if(o.tur !== 'toplam' && o.tur !== 'ortalama' || o.genel || o.komut || typeof o.gun !== 'function') continue;
      const r = topla(o, null, d), r0 = topla(o, null, d0);
      if(r.deger == null && r0.deger == null) continue;
      l.push({ o, simdi:r.deger, once:r0.deger, gun:r.l.length, gun0:r0.l.length,
        oran:r.deger != null && r0.deger ? (r.deger - r0.deger) / Math.abs(r0.deger) : r.deger != null ? 1 : -1 });
    }
    const gunAd = dow === 0 ? 'bugün (pazartesi)' : 'pazartesiden bugüne ' + (dow + 1) + ' gün';
    if(!l.length) return { id:'hafta', cevap:'Bu hafta ve geçen hafta karşılaştıracak kayıt yok. Birkaç gün kayıt girersen haftanı değerlendiririm.' };
    const on = o => o.ondalik ? 10 : 1;
    const satir = l.map(x => x.o.ad.charAt(0).toLocaleUpperCase('tr') + x.o.ad.slice(1) + ': ' + (x.o.tur === 'ortalama' ? 'ortalama ' : '')
      + yaz(x.simdi, on(x.o)) + ' ' + x.o.birim + ' (geçen hafta aynı günlerde ' + yaz(x.once, on(x.o)) + ')');
    const sirali = l.slice().sort((a, b) => b.oran - a.oran);
    const iyi = sirali[0].oran > 0.05 ? sirali[0] : null;
    const kotu = sirali[sirali.length - 1].oran < -0.05 ? sirali[sirali.length - 1] : null;
    const yuzde = x => x.once ? (x.oran >= 0 ? '+' : '−') + '%' + Math.round(Math.abs(x.oran) * 100) : 'yeni';
    let oneri;
    if(kotu && kotu.o.tur === 'toplam'){
      const kalan = 6 - dow, eksik = (kotu.once || 0) - (kotu.simdi || 0);
      oneri = kalan > 0 && eksik > 0 ? 'Geçen haftanın ' + kotu.o.ad + ' düzeyine yetişmek için kalan ' + kalan + ' günde günde yaklaşık ' + yaz(Math.ceil(eksik / kalan), 1) + ' ' + kotu.o.birim + ' yeter.'
        : 'Hafta bitti sayılır; gelecek hafta ' + kotu.o.ad + ' için her gün küçük bir hedef koy.';
    }else if(kotu){
      oneri = kotu.o.ad.charAt(0).toLocaleUpperCase('tr') + kotu.o.ad.slice(1) + ' ortalaman düştü; bu hafta hedefin geçen haftanın düzeyi: ' + yaz(kotu.once, on(kotu.o)) + ' ' + kotu.o.birim + '.';
    }else oneri = 'Ölçülerinin hiçbiri geçen haftanın gerisinde değil; bu ritmi koru.';
    return { id:'hafta', satirlar:satir,
      cevap:'Bu hafta (' + gunAd + '), geçen haftanın aynı günlerine göre: '
        + (iyi ? 'iyi giden ' + iyi.o.ad + ' (' + yuzde(iyi) + ')' : 'belirgin artış yok')
        + '; ' + (kotu ? 'aksayan ' + kotu.o.ad + ' (' + yuzde(kotu) + (kotu.simdi == null ? ', bu hafta hiç girilmedi' : '') + ')' : 'aksayan yok') + '. ' + oneri };
  }

  /* NEDEN (King-Bench içgörü paketi): «geçen ay neden daha az soru çözdüm». Toplam = kayıtlı gün × gün başı; değişim
     bu iki parçaya ayrılır ve büyük olan söylenir. Bu bir hesaptır, neden-sonuç değil: «tembelsin» gibi yargı yoktur. */
  const NEDEN = /(?:^|\s)(?:neden|niye|niçin)(?=\s).*(?:(?:^|\s)(?:az|çok|fazla)(?=\s|$|[?.!,])|düştü|düşük|azal|arttı|artış|yüksel)/;
  function nedenCoz(t, bugun){
    const b = olcuBul(t);
    if(!b || b.o.tur !== 'toplam' || typeof b.o.gun !== 'function') return null;
    const { o, alt } = b;
    const d = donem(t, bugun) || donem('geçen ay', bugun);
    if(!d.bas) return null;
    let d0;
    if(/ay$/.test(d.ad) || AYLAR.indexOf(d.ad) >= 0){ const x = new Date(d.bas + 'T12:00:00'); x.setDate(0); d0 = { bas:iso(x).slice(0, 8) + '01', son:iso(x) }; }
    else { const n = gunler(d.bas, d.son).length; d0 = { bas:gunEkle(d.bas, -n), son:gunEkle(d.bas, -1) }; }
    const r = topla(o, alt, d), r0 = topla(o, alt, d0);
    const ad = (alt ? alt + ' ' : '') + o.ad;
    if(r.deger == null || r0.deger == null) return { id:o.id + '-neden', cevap:'Karşılaştırmak için iki dönemde de ' + ad + ' kaydı gerekiyor; ' + (r.deger == null ? d.ad : 'önceki dönem') + ' için kayıt yok.' };
    const g = r.l.length, g0 = r0.l.length, p = r.deger / g, p0 = r0.deger / g0;
    const gunEtkisi = (g - g0) * p0, tempoEtkisi = (p - p0) * g;
    const bas = d.ad.charAt(0).toLocaleUpperCase('tr') + d.ad.slice(1);
    const yon = r.deger < r0.deger ? 'düşüşün' : 'artışın';
    const buyuk = Math.abs(gunEtkisi) >= Math.abs(tempoEtkisi)
      ? yon + ' çoğu kayıtlı gün sayısından: ' + Math.abs(g - g0) + ' gün ' + (g < g0 ? 'daha az' : 'daha çok') + ' (≈ ' + yaz(Math.abs(gunEtkisi), 1) + ' ' + o.birim + ')'
      : yon + ' çoğu gün başı tempodan: gün başı ' + yaz(p0, 1) + ' → ' + yaz(p, 1) + ' ' + o.birim + ' (≈ ' + yaz(Math.abs(tempoEtkisi), 1) + ' ' + o.birim + ')';
    return { id:o.id + '-neden', cevap:bas + ' ' + ad + ': ' + yaz(r.deger, 1) + ' ' + o.birim + ' (' + g + ' kayıtlı gün, gün başı ' + yaz(p, 1) + '); önceki dönem '
      + yaz(r0.deger, 1) + ' (' + g0 + ' gün, gün başı ' + yaz(p0, 1) + '). Hesaba göre ' + buyuk + '. Kayıt girilmeyen gün sıfır sayılmaz.' };
  }

  function coz(metin, bugun){
    if(!ayar) return null;
    const t = kucuk(metin);
    if(HAFTA_DEG.test(t)) return haftaDegerlendir(bugun);
    if(NEDEN.test(t)){ const n = nedenCoz(t, bugun); if(n) return n; }
    if(OZET.test(t) && !BASKA.test(t)) return ozet(t, bugun);
    /* Ölçü değil: hedef/puan karşılaştırması, kart sayısı, tanım sorusu («ne işe yarıyor?»). */
    /* `komut`: kısa ad da sorudur («ilaçlarım»). */
    /* Özel soru (King-Bench tur 6): kendi deseni olan «anlık» ölçü («zamanımı en çok hangi işe…», «hedefimin yüzde kaçı»)
       genel kapılara takılmaz; desenin kendisi sorudur. */
    const ozel = ayar.olculer.some(o => o.tur === 'anlik' && o.ozel && o.es.test(t));
    if(!ozel && ((!SORU.test(t) && !ayar.olculer.some(o => o.komut && o.es.test(t))) || BASKA.test(t))) return null;
    const b = olcuBul(t);
    if(!b) return null;
    /* İki ölçü birden («gitar ve dil çalışma saatim»): tek sayıyla cevaplanmaz, yol modülün aracına kalır. */
    if(!b.o.ozel && ayar.olculer.filter(o => !o.genel && !o.ozel && o.es.test(t)).length > 1) return null;
    const { o, alt } = b;
    const ad = (alt ? alt + ' ' : '') + (typeof o.adOf === 'function' ? o.adOf(t) : o.ad);
    const on = o.ondalik ? 10 : 1;
    if(o.tur === 'anlik'){
      const a = o.anlik(t, bugun);
      return a ? { id:o.id, cevap:a.metin } : null;
    }
    const degisim = DEGISIM.test(t);
    if(o.tur === 'olay'){
      let l = (o.olaylar(alt, t) || []).filter(x => x && x.v != null).sort((x, y) => x.t < y.t ? -1 : 1);
      const d = donem(t, bugun);
      if(d && d.adet) l = l.slice(-d.adet);
      else if(d && d.bas) l = l.filter(x => x.t >= d.bas && x.t <= d.son);
      if(!l.length) return { id:o.id, cevap:(d ? d.ad + ' ' : '') + ad + ' için kayıt yok.' };
      const ort = l.reduce((s, x) => s + x.v, 0) / l.length;
      const satirlar = l.slice(-8).map(x => tarihYaz(x.t) + ': ' + yaz(x.v, 100) + ' ' + o.birim);
      if(degisim && l.length >= 2){
        const fark = l[l.length - 1].v - l[0].v;
        return { id:o.id, satirlar, cevap:(d ? d.ad + 'de' : 'Son ' + l.length + ' kayıtta') + ' ' + ad + ' ' + yaz(l[0].v, 100) + ' → ' + yaz(l[l.length - 1].v, 100)
          + ' ' + o.birim + ' (' + (fark >= 0 ? '+' : '') + yaz(fark, 100) + '). Ortalama ' + yaz(ort, 100) + ', ' + l.length + ' ' + (o.olayAd || 'deneme') + '.' };
      }
      return { id:o.id, satirlar, cevap:ad.charAt(0).toLocaleUpperCase('tr') + ad.slice(1) + ' ortalaman ' + yaz(ort, 100) + (o.birim ? ' ' + o.birim : '')
        + ' (' + l.length + ' ' + (o.olayAd || 'deneme') + (d ? ', ' + d.ad : '') + '). Son ' + (o.olayAd || 'deneme') + ': ' + yaz(l[l.length - 1].v, 100) + '.' };
    }
    const d = donem(t, bugun) || (degisim ? { bas:gunEkle(bugun, o.tur === 'son' ? -29 : -13), son:bugun, ad:o.tur === 'son' ? 'son 30 gün' : 'son 14 gün' }
      : { bas:gunEkle(bugun, -6), son:bugun, ad:'son 7 gün' });
    const r = topla(o, alt, d);
    const bas = d.ad.charAt(0).toLocaleUpperCase('tr') + d.ad.slice(1);
    if(r.deger == null && degisim && (d.ad === 'bu hafta' || d.ad === 'bu ay')){
      const r0 = topla(o, alt, donem(d.ad === 'bu hafta' ? 'geçen hafta' : 'geçen ay', bugun));
      if(r0.deger != null) return { id:o.id, cevap:bas + ' henüz ' + ad + ' kaydı yok; ' + (d.ad === 'bu hafta' ? 'geçen hafta' : 'geçen ay') + ' ' + yaz(r0.deger, on) + ' ' + o.birim + '.' };
    }
    if(r.deger == null) return { id:o.id, cevap:bas + ' ' + ad + ' kaydı yok; kayıt girilmeyen gün sıfır sayılmaz.' };
    const satirlar = r.l.length <= 7 ? r.l.map(x => tarihYaz(x.g) + ': ' + yaz(x.v, on) + ' ' + o.birim) : null;
    if(o.tur === 'son'){
      const ilk = r.l[0];
      if(r.l.length < 2) return { id:o.id, satirlar, cevap:bas + ' tek ' + ad + ' ölçümün var: ' + yaz(ilk.v, on) + ' ' + o.birim + ' (' + tarihYaz(ilk.g) + '). Değişimi görmek için bir ölçüm daha gerekiyor.' };
      const fark = r.deger - ilk.v;
      return { id:o.id, satirlar, cevap:bas + ' ' + ad + ' ' + yaz(ilk.v, on) + ' → ' + yaz(r.deger, on) + ' ' + o.birim + ' ('
        + (fark > 0 ? '+' : '') + yaz(fark, on) + ' ' + o.birim + ', ' + r.l.length + ' ölçüm).' };
    }
    const kac = r.l.length + ' günde kayıt var';
    const deger = (o.tur === 'ortalama' ? 'ortalama ' : '') + yaz(r.deger, on) + ' ' + o.birim;
    if(degisim){
      const uzun = gunler(d.bas, d.son).length;
      /* «bu hafta» / «bu ay» tam önceki hafta ve ayla karşılaştırılır (pazartesi günü önceki dönem tek gün oluyordu). */
      const once = d.once ? d.once : d.ad === 'bu hafta' ? donem('geçen hafta', bugun) : d.ad === 'bu ay' ? donem('geçen ay', bugun)
        : { bas:gunEkle(d.bas, -uzun), son:gunEkle(d.bas, -1) };
      const r0 = topla(o, alt, once);
      if(r0.deger == null) return { id:o.id, satirlar, cevap:bas + ' ' + ad + ': ' + deger + ' (' + kac + '). Karşılaştıracak ' + (d.once ? d.once.ad + ' ayında' : 'önceki dönemde') + ' kayıt yok.' };
      const fark = r.deger - r0.deger;
      const yon = Math.abs(fark) < (o.tur === 'ortalama' ? 0.05 * Math.abs(r0.deger || 1) : 0.05 * Math.abs(r0.deger || 1)) ? 'aşağı yukarı aynı' : fark > 0 ? 'arttı' : 'azaldı';
      const onceAd = d.once ? d.once.ad + ' ayında' : d.ad === 'bu hafta' ? 'geçen hafta' : d.ad === 'bu ay' ? 'geçen ay' : 'önceki ' + uzun + ' günde';
      return { id:o.id, satirlar, cevap:bas + ' ' + ad + ': ' + deger + '; ' + onceAd + ' ' + yaz(r0.deger, on) + ' ' + o.birim
        + '. ' + yon.charAt(0).toLocaleUpperCase('tr') + yon.slice(1) + ' (' + (fark >= 0 ? '+' : '') + yaz(fark, on) + ').' };
    }
    return { id:o.id, satirlar, cevap:bas + ' ' + ad + ': ' + deger + ' (' + kac + ').' };
  }

  return { kur, coz, donem, kuruluMu:() => !!ayar, _sifirla:() => { ayar = null; } };
})();
