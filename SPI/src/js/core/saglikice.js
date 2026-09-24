/* SAĞLIK VERİSİ İÇE AKTARMA — telefonun ölçümlerini SPİ'ye (cevaplı madde Y5).

   Kullanıcı: sağlık verisi bütün kaynaklardan; iPhone + Android. Yol, takvim
   içe aktarmasıyla aynı (AYS core/takvim.js): dosya OKUNUR, günlük özet
   ÖNİZLENİR, onaylanınca SPİ kendi koduyla yazar; hiçbir şey kendiliğinden
   yazılmaz.

   Kaynaklar:
     iPhone   Sağlık › profil › «Tüm sağlık verilerini dışa aktar» → export.zip
              (içinde apple_health_export/export.xml). Zip TARAYICININ KENDİ
              DecompressionStream'iyle açılır (sıfır bağımlılık); dosya yüzlerce
              MB olabileceği için XML PARÇA PARÇA okunur.
     Android  Health Connect'in doğrudan dışa aktarma biçimi burada
              DOĞRULANMADI; bunun yerine başka uygulamaların verdiği genel
              CSV okunur: `tarih,olcu,deger` (başlık satırıyla).

   Sözler:
     1. SENİN DEĞERİN EZİLMEZ. O gün o alan doluysa içe aktarılan değer
        yazılmaz; önizlemede «çakışma» olarak görünür.
     2. AYNI ÖLÇÜ DEĞİLSE ALINMAZ. Apple'ın HRV'si SDNN'dir, SPİ'ninki
        RMSSD: ikisi aynı sayı değildir, HRV alınmaz ve bu söylenir. Adım
        için SPİ'de alan yoktur; o da söylenir.
     3. ARALIK DIŞI DÜŞER. Bugün ekranının form sınırları geçerlidir.
     4. UYKU İKİ KEZ SAYILMAZ. Saat ve telefon aynı geceyi yazar: gece başına
        kaynak kaynak toplanır, EN BÜYÜK kaynak alınır (toplanmaz). Uyku,
        uyanılan güne yazılır.
     5. GERİ ALINIR. Yazılan her (gün, alan) kaydedilir; «Geri al» o alanı
        yalnız hâlâ içe aktarılan değeri taşıyorsa boşaltır. */

window.SP = window.SP || {};

SP.SaglikIce = (function(){
  const U = () => SP.U;
  const ANAHTAR = 'meta/saglikIceAktarim';
  const ARALIK = { sleep:[0.5, 16], rhr:[30, 140], sbp:[60, 250], dbp:[30, 160], spo2:[70, 100],
    weight:[20, 250], waist:[40, 200], bodyfat:[3, 60], water:[1, 8000] };
  const AD = { sleep:'Uyku (saat)', rhr:'İstirahat nabzı', sbp:'Büyük tansiyon', dbp:'Küçük tansiyon',
    spo2:'Oksijen (%)', weight:'Kilo (kg)', waist:'Bel (cm)', bodyfat:'Yağ oranı (%)', water:'Su (ml)' };
  /* Günlük özetin kuralı: toplam (su), son (kilo, bel, yağ), ortanca (diğerleri). */
  const OZET = { water:'toplam', weight:'son', waist:'son', bodyfat:'son' };

  /* Apple Health tür → SPİ alanı ve birim çevirisi. */
  const APPLE = {
    HKQuantityTypeIdentifierBodyMass:{ alan:'weight', cevir:(v, b) => b === 'lb' ? v * 0.45359237 : (b === 'g' ? v / 1000 : v) },
    HKQuantityTypeIdentifierRestingHeartRate:{ alan:'rhr' },
    HKQuantityTypeIdentifierBloodPressureSystolic:{ alan:'sbp' },
    HKQuantityTypeIdentifierBloodPressureDiastolic:{ alan:'dbp' },
    HKQuantityTypeIdentifierDietaryWater:{ alan:'water',
      cevir:(v, b) => b === 'L' ? v * 1000 : (b === 'fl_oz_us' ? v * 29.5735 : (b === 'mL' ? v : null)) },
    HKQuantityTypeIdentifierWaistCircumference:{ alan:'waist', cevir:(v, b) => b === 'in' ? v * 2.54 : (b === 'm' ? v * 100 : v) },
    HKQuantityTypeIdentifierBodyFatPercentage:{ alan:'bodyfat', cevir:(v, b) => b === '%' && v <= 1 ? v * 100 : v },
    HKQuantityTypeIdentifierOxygenSaturation:{ alan:'spo2', cevir:(v, b) => b === '%' && v <= 1 ? v * 100 : v },
  };
  const ALINMAYAN = {
    HKQuantityTypeIdentifierHeartRateVariabilitySDNN:'HRV (Apple SDNN verir; SPİ’nin HRV’si RMSSD — aynı ölçü değil)',
    HKQuantityTypeIdentifierStepCount:'Adım (SPİ’de adım alanı yok)',
  };
  const UYKU = 'HKCategoryTypeIdentifierSleepAnalysis';

  /* CSV ölçü adları (Türkçe ve İngilizce). */
  const CSV_AD = { uyku:'sleep', sleep:'sleep', nabiz:'rhr', 'istirahat nabzi':'rhr', rhr:'rhr',
    'resting heart rate':'rhr', sistolik:'sbp', 'buyuk tansiyon':'sbp', systolic:'sbp',
    diyastolik:'dbp', 'kucuk tansiyon':'dbp', diastolic:'dbp', oksijen:'spo2', spo2:'spo2',
    kilo:'weight', weight:'weight', bel:'waist', waist:'waist', yag:'bodyfat', 'yag orani':'bodyfat',
    'body fat':'bodyfat', su:'water', water:'water' };

  function tarihOf(s){ const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(s || '')); return m ? m[1] : null; }
  function saatOf(s){
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(String(s || ''));
    return m ? Date.UTC(+m[1].slice(0, 4), +m[1].slice(5, 7) - 1, +m[1].slice(8, 10), +m[2], +m[3]) : null;
  }
  function attr(tag, ad){ const m = new RegExp('\\s' + ad + '="([^"]*)"').exec(tag); return m ? m[1] : null; }

  /* ------------------------------------------------------------ toplayıcı */

  function yeniToplayici(o){
    return { alt:(o && o.alt) || null, deger:{}, uyku:{}, alinmayan:{}, aralikDisi:0, satir:0 };
  }

  function ekle(t, alan, gun, v){
    if(!gun || (t.alt && gun < t.alt) || typeof v !== 'number' || !isFinite(v)) return;
    const k = alan + '|' + gun;
    (t.deger[k] = t.deger[k] || []).push(v);
  }

  /* Tek bir <Record .../> etiketi. */
  function kayitIsle(t, tag){
    const tur = attr(tag, 'type');
    if(!tur) return;
    t.satir++;
    if(ALINMAYAN[tur]){ t.alinmayan[tur] = (t.alinmayan[tur] || 0) + 1; return; }
    if(tur === UYKU){
      const val = attr(tag, 'value') || '';
      if(!/Asleep/.test(val)) return;                 /* yatakta ve uyanık süreler uyku değil */
      const bas = saatOf(attr(tag, 'startDate')), bit = saatOf(attr(tag, 'endDate'));
      const gun = tarihOf(attr(tag, 'endDate'));
      if(bas == null || bit == null || bit <= bas || !gun || (t.alt && gun < t.alt)) return;
      const kay = attr(tag, 'sourceName') || '?';
      const k = gun + '|' + kay;
      t.uyku[k] = (t.uyku[k] || 0) + (bit - bas) / 3600000;
      return;
    }
    const d = APPLE[tur];
    if(!d) return;
    let v = Number(attr(tag, 'value'));
    if(!isFinite(v)) return;
    if(d.cevir){ v = d.cevir(v, attr(tag, 'unit')); if(v == null) return; }
    ekle(t, d.alan, tarihOf(attr(tag, 'startDate')), v);
  }

  /* XML metni PARÇA PARÇA: yarım kalan etiket bir sonraki parçaya devreder. */
  function xmlParca(t, kalan, parca){
    const metin = kalan + parca;
    const re = /<Record\s[^>]*?\/?>/g;
    let m, son = 0;
    while((m = re.exec(metin))){ kayitIsle(t, m[0]); son = re.lastIndex; }
    const ac = metin.lastIndexOf('<');
    return ac >= son ? metin.slice(ac) : '';
  }

  function csvIsle(t, metin){
    const satirlar = String(metin || '').split(/\r?\n/).filter(s => s.trim());
    if(!satirlar.length) return;
    const bas = satirlar[0].toLocaleLowerCase('tr-TR').split(/[,;]/).map(s => s.trim());
    const it = bas.findIndex(s => s === 'tarih' || s === 'date');
    const io = bas.findIndex(s => s === 'olcu' || s === 'ölçü' || s === 'metric');
    const iv = bas.findIndex(s => s === 'deger' || s === 'değer' || s === 'value');
    if(it < 0 || io < 0 || iv < 0) return;
    satirlar.slice(1).forEach(sat => {
      const p = sat.split(/[;,](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ''));
      const alan = CSV_AD[U().norm(p[io] || '')];
      t.satir++;
      if(!alan){ t.alinmayan[p[io] || '?'] = (t.alinmayan[p[io] || '?'] || 0) + 1; return; }
      ekle(t, alan, tarihOf(p[it]), Number(String(p[iv]).replace(',', '.')));
    });
  }

  /* ------------------------------------------------------------ özet ve önizleme */

  function ortanca(l){ const s = l.slice().sort((a, b) => a - b); const n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }

  function gunluk(t){
    const out = [];
    Object.keys(t.deger).forEach(k => {
      const [alan, gun] = k.split('|');
      const l = t.deger[k];
      const v = OZET[alan] === 'toplam' ? l.reduce((a, b) => a + b, 0)
        : OZET[alan] === 'son' ? l[l.length - 1] : ortanca(l);
      out.push({ alan, gun, v });
    });
    const gece = {};
    Object.keys(t.uyku).forEach(k => {
      const gun = k.split('|')[0];
      gece[gun] = Math.max(gece[gun] || 0, t.uyku[k]);
    });
    Object.keys(gece).forEach(gun => out.push({ alan:'sleep', gun, v:gece[gun] }));
    return out;
  }

  function yuvarla(alan, v){
    if(alan === 'water') return Math.round(v);
    if(alan === 'sleep') return Math.round(v * 4) / 4;
    return Math.round(v * 10) / 10;
  }

  /* Toplayıcı → önizleme: alan başına yeni gün, çakışma, aralık dışı. */
  function onizleme(t){
    const yaz = [], cakisma = [], alanlar = {};
    let disi = 0;
    gunluk(t).forEach(x => {
      const a = ARALIK[x.alan];
      const v = yuvarla(x.alan, x.v);
      if(!a || v < a[0] || v > a[1]){ disi++; return; }
      const mevcut = (SP.S.vitals[x.gun] || {})[x.alan];
      const al = alanlar[x.alan] = alanlar[x.alan] || { alan:x.alan, ad:AD[x.alan], yeni:0, cakisma:0, bas:x.gun, bit:x.gun };
      if(x.gun < al.bas) al.bas = x.gun;
      if(x.gun > al.bit) al.bit = x.gun;
      if(mevcut != null){ al.cakisma++; if(Number(mevcut) !== v) cakisma.push({ gun:x.gun, alan:x.alan, mevcut, gelen:v }); return; }
      al.yeni++;
      yaz.push({ gun:x.gun, alan:x.alan, v });
    });
    yaz.sort((a, b) => a.gun < b.gun ? -1 : a.gun > b.gun ? 1 : 0);
    return { ok:yaz.length > 0, yaz, cakisma, aralikDisi:disi, satir:t.satir,
      alanlar:Object.keys(alanlar).map(k => alanlar[k]),
      alinmayan:Object.keys(t.alinmayan).map(k => ({ ad:ALINMAYAN[k] || ('«' + k + '» (tanınmayan ölçü)'), adet:t.alinmayan[k] })),
      why:yaz.length ? null : 'Dosyadan SPİ’ye yazılacak yeni bir ölçüm çıkmadı.' };
  }

  function altSinir(gun){ return gun ? U().iso(U().addDays(U().today(), -gun)) : null; }

  /* Metinden (test ve CSV için): tür dosyanın içeriğinden okunur. */
  function metindenOku(metin, o){
    const t = yeniToplayici({ alt:altSinir(o && o.gun) });
    if(/<HealthData|<Record\s/.test(String(metin).slice(0, 5000)) || /<Record\s/.test(metin)) xmlParca(t, '', metin);
    else csvIsle(t, metin);
    return onizleme(t);
  }

  /* ------------------------------------------------------------ dosya (zip / xml / csv) */

  async function akisOku(akis, t){
    const okuyucu = akis.pipeThrough(new TextDecoderStream()).getReader();
    let kalan = '';
    for(;;){
      const r = await okuyucu.read();
      if(r.done) break;
      kalan = xmlParca(t, kalan, r.value);
    }
  }

  /* Zip'in merkez dizininden export.xml'i bulur (ZIP64 desteklenmez; söylenir). */
  async function zipGirdisi(dosya){
    const son = await dosya.slice(Math.max(0, dosya.size - 65557)).arrayBuffer();
    const d = new DataView(son);
    let eocd = -1;
    for(let i = son.byteLength - 22; i >= 0; i--){ if(d.getUint32(i, true) === 0x06054b50){ eocd = i; break; } }
    if(eocd < 0) return { ok:false, why:'Zip okunamadı.' };
    const adet = d.getUint16(eocd + 10, true);
    const cdBoy = d.getUint32(eocd + 12, true), cdBas = d.getUint32(eocd + 16, true);
    if(cdBas === 0xffffffff || adet === 0xffff) return { ok:false, why:'Bu zip çok büyük (ZIP64). Zip’i telefonda açıp içindeki export.xml’i seç.' };
    const cd = new DataView(await dosya.slice(cdBas, cdBas + cdBoy).arrayBuffer());
    let p = 0;
    for(let i = 0; i < adet && p + 46 <= cd.byteLength; i++){
      const yontem = cd.getUint16(p + 10, true), sikisik = cd.getUint32(p + 20, true);
      const adBoy = cd.getUint16(p + 28, true), ekBoy = cd.getUint16(p + 30, true), yorumBoy = cd.getUint16(p + 32, true);
      const yerel = cd.getUint32(p + 42, true);
      const ad = new TextDecoder().decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, adBoy));
      if(/(^|\/)export\.xml$/.test(ad)){
        const lh = new DataView(await dosya.slice(yerel, yerel + 30).arrayBuffer());
        const veri = yerel + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
        return { ok:true, yontem, parca:dosya.slice(veri, veri + sikisik) };
      }
      p += 46 + adBoy + ekBoy + yorumBoy;
    }
    return { ok:false, why:'Zip’te export.xml yok. iPhone Sağlık › dışa aktar dosyasını seç.' };
  }

  async function dosyadanOku(dosya, o){
    const t = yeniToplayici({ alt:altSinir(o && o.gun) });
    const ad = String(dosya.name || '').toLowerCase();
    try{
      if(ad.endsWith('.zip')){
        const z = await zipGirdisi(dosya);
        if(!z.ok) return { ok:false, why:z.why };
        let akis = z.parca.stream();
        if(z.yontem === 8){
          if(typeof DecompressionStream !== 'function') return { ok:false, why:'Bu tarayıcı zip açamıyor; export.xml’i ayrı seç.' };
          akis = akis.pipeThrough(new DecompressionStream('deflate-raw'));
        }else if(z.yontem !== 0){
          return { ok:false, why:'Zip sıkıştırma yöntemi tanınmadı; export.xml’i ayrı seç.' };
        }
        await akisOku(akis, t);
      }else if(ad.endsWith('.xml')){
        await akisOku(dosya.stream(), t);
      }else if(ad.endsWith('.csv') || ad.endsWith('.txt')){
        csvIsle(t, await dosya.text());
      }else{
        return { ok:false, why:'Dosya türü tanınmadı: iPhone’dan export.zip / export.xml ya da CSV seç.' };
      }
    }catch(e){
      return { ok:false, why:'Dosya okunamadı: ' + String(e && e.message || e).slice(0, 120) };
    }
    return onizleme(t);
  }

  /* ------------------------------------------------------------ yazma ve geri alma */

  async function uygula(o){
    if(!o || !o.ok || !o.yaz.length) return { ok:false, why:'Yazılacak ölçüm yok.' };
    const yazilan = [];
    const gunler = {};
    o.yaz.forEach(x => { (gunler[x.gun] = gunler[x.gun] || {})[x.alan] = x.v; });
    for(const gun of Object.keys(gunler)){
      const mevcut = SP.S.vitals[gun] || {};
      const patch = {};
      Object.keys(gunler[gun]).forEach(alan => { if(mevcut[alan] == null){ patch[alan] = gunler[gun][alan]; yazilan.push({ gun, alan, v:gunler[gun][alan] }); } });
      if(!Object.keys(patch).length) continue;
      patch.iceAktarim = Object.assign({}, mevcut.iceAktarim || {},
        Object.keys(patch).reduce((m, k) => { m[k] = 'telefon'; return m; }, {}));
      await SP.Model.saveVitals(gun, patch);
    }
    const kayit = { id:U().uid('ice'), at:new Date().toISOString(), yazilan };
    let gecmis = [];
    try{ gecmis = ((await SP.Store.get(ANAHTAR)) || {}).liste || []; }catch(e){ gecmis = []; }
    gecmis = [kayit].concat(gecmis).slice(0, 10);
    await SP.Store.set(ANAHTAR, { liste:gecmis });
    return { ok:true, id:kayit.id, adet:yazilan.length,
      gun:Object.keys(gunler).length, note:yazilan.length + ' ölçüm ' + Object.keys(gunler).length + ' güne yazıldı.' };
  }

  async function geriAl(id){
    let gecmis = [];
    try{ gecmis = ((await SP.Store.get(ANAHTAR)) || {}).liste || []; }catch(e){ gecmis = []; }
    const k = gecmis.find(x => x.id === id);
    if(!k) return { ok:false, why:'İçe aktarma kaydı bulunamadı.' };
    let bosalan = 0, kalan = 0;
    const gunler = {};
    k.yazilan.forEach(x => { (gunler[x.gun] = gunler[x.gun] || []).push(x); });
    for(const gun of Object.keys(gunler)){
      const v = SP.S.vitals[gun] || {};
      const patch = {};
      const ice = Object.assign({}, v.iceAktarim || {});
      gunler[gun].forEach(x => {
        if(v[x.alan] === x.v){ patch[x.alan] = null; delete ice[x.alan]; bosalan++; } else kalan++;
      });
      if(Object.keys(patch).length){ patch.iceAktarim = ice; await SP.Model.saveVitals(gun, patch); }
    }
    await SP.Store.set(ANAHTAR, { liste:gecmis.filter(x => x.id !== id) });
    return { ok:true, bosalan, kalan };
  }

  return { metindenOku, dosyadanOku, uygula, geriAl, ARALIK, AD, zipGirdisi };
})();
