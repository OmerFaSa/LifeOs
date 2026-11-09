// King-Bench sürücüsü: node bench.js ETIKET SEVIYE.json VERI [--sadece id,id]  (bench.py çağırır; sunucular açık olmalı)
// Senaryo dosyası seviye-N.json: [{ t, saat, modul, m:[{ id, alan, sev, m, b:{...} }] }]
// b: degis:['gün.soru'|'*'] veri artmalı · fark:{'gün.soru':30} tam miktar · degismez:true · icer/icermez:regex · tur:[..] · onay:true (önizleme/yetki gelmeli)
//    hayir:true (onaya «hayır») · dogru:'js ifade' (cevapta bu değer geçmeli) · veriYokOlur:true · ui:true (gerçek kutuya yaz)
const fs = require('fs'), path = require('path');
const KOK = path.resolve(__dirname, '..', '..');
const { chromium } = require(fs.existsSync(path.join(KOK, 'SPI/node_modules/playwright')) ? path.join(KOK, 'SPI/node_modules/playwright') : 'C:/Users/ASUS/LifeOs/SPI/node_modules/playwright');
const { soyle } = require('./surucu');
const G = require('./gercek');
const VERI = process.argv[4];
const CFG = JSON.parse(fs.readFileSync(path.join(VERI, 'config.json'), 'utf8'));
const PORT = { ays:4281, spi:4282, esp:4283 }, NS = { ays:'R', spi:'SP', esp:'ESP' };
const etiket = process.argv[2] || 'deneme';
const si = process.argv.indexOf('--sadece'), SADECE = si > 0 ? new Set(process.argv[si + 1].split(',')) : null;
const SEN = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const CIKTI = path.join(VERI, 'sonuc', 'bench-' + etiket + '.json');
fs.mkdirSync(path.dirname(CIKTI), { recursive:true });

// Her vakada geçerli kusurlar (vaka izin vermedikçe)
const KUSUR = [
  [/\w+\(\w+=|Önizleme hazırlandı|<\/?(tool|arac)/i, 'iç metin sızdı'],
  [/işlem ne olsun/i, '«işlem ne olsun?»'],
  [/yapmak istedim ama olmadı|hiçbir şeyi değiştirmedim/i, 'teknik ret'],
  [/daha iyi tanıyorum|tanımak istiyorum/i, 'tanışma yuttu'],
  [/HKM'nin|modülü(nde|ne)?\b/i, 'iç ad'],
];
const VERIYOK = /veri (yok|mevcut değil|bulunmuyor)|kayıt (mevcut değil|bulunmamaktadır)|erişimim yok|hesaplayamam|spesifik bir veri|bilgim yok/i;

function puanla(x, o){
  const b = x.b || {}, c = [o.cevap, o.cevap2, o.cevapEvet, o.yoksa && o.yoksa.cevap].filter(Boolean).join(' ¶ ');
  const d = Object.assign({}, o.degisim || {}), neden = [];
  ['officeBriefings', 'usage', 'kingLog', 'beacon'].forEach(k => delete d[k]);  // King'in işi olmayan arka plan yazımları
  if(o.hata) neden.push('hata: ' + o.hata);
  for(const [re, ad] of KUSUR) if(re.test(c) && !(b.hayir && ad === 'teknik ret')) neden.push(ad);
  if(!b.veriYokOlur && VERIYOK.test(c)) neden.push('«veri yok»');
  if(o.iddiaBos && !b.ustune) neden.push('«yaptım» dedi, değişen yok');
  // Birim dönüşümü kusur değil: 1,5 litre → 1.500 ml, 1 saat → 60 dk
  const on = String(o.onizleme || '').replace(/\./g, '');
  // Düzeltmede («50 değil 45») eski sayı önizlemede olmaz: «değil»den önceki sayılar sayılmaz.
  const saat = (String(x.m).match(/(\d{1,2})(?=\s*(?:'?[dt][ae]\b|:\d\d))/g) || []);  // «2de yattım 9da kalktım» süreye çevrilir
  const eski = saat.concat((String(x.m).match(/(\d+(?:[.,]\d+)?)\s*(?:değil|yerine)/g) || []).map(s => s.match(/\d+(?:[.,]\d+)?/)[0]));
  const kusku = (o.onizlemeKusku || []).filter(n => eski.indexOf(n) < 0).filter(n => { const v = parseFloat(n.replace(',', '.')); return [1000, 60].every(k => on.indexOf(String(Math.round(v * k))) < 0); });
  if(kusku.length) neden.push('önizlemede sayı yok: ' + kusku.join(','));
  if(o.gitSoruldu && !b.git) neden.push('sayfa açmayı önerdi');
  if(b.degis) for(const k of b.degis){
    const ok = k === '*' ? Object.values(d).some(v => v > 0) : (d[k] || 0) > 0;
    if(!ok) neden.push('veri değişmedi: ' + k);
  }
  // fark: tam miktar («30 soru» yazıldıysa gün toplamı tam 30 artmalı; düzeltmede tam fark)
  if(b.fark) for(const k of Object.keys(b.fark)) if((d[k] || 0) !== b.fark[k]) neden.push(k + ' farkı ' + (d[k] || 0) + ' ≠ ' + b.fark[k]);
  if(b.degismez && Object.keys(d).length) neden.push('veri değişti: ' + JSON.stringify(d));
  if(b.icer && !new RegExp(b.icer, 'i').test(c)) neden.push('beklenen yok: /' + b.icer + '/');
  if(b.icermez && new RegExp(b.icermez, 'i').test(c)) neden.push('olmaması gereken: /' + b.icermez + '/');
  if(b.tur && !b.tur.includes(o.tur) && !b.tur.includes(o.tur2)) neden.push('tür ' + o.tur + ' ≠ ' + b.tur.join('|'));
  if(b.onay && !(o.onizleme || o.yetki)) neden.push('onaya sunmadı');
  if(b.git && !(o.gitSoruldu || o.tur === 'git')) neden.push('sayfaya götürmedi');
  if(o.dogru != null){
    const v = String(o.dogru), v2 = v.replace('.', ',');
    if(c.indexOf(v) < 0 && c.indexOf(v2) < 0) neden.push('doğru değer ' + v + ' yok');
  }
  return neden;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(path.join(VERI, 'is', 'profil'), { headless:true, serviceWorkers:'block', viewport:{ width:1280, height:820 }, timezoneId:'Europe/Istanbul', locale:'tr-TR' });
  const sonuc = [], ilk = {};
  try{
    for(const z of SEN){
      const vakalar = z.m.filter(x => !SADECE || SADECE.has(x.id));
      if(!vakalar.length) continue;
      const page = await ctx.newPage();
      await page.clock.install({ time:new Date(z.t + 'T' + z.saat + ':00+03:00') });
      await page.goto('http://127.0.0.1:' + PORT[z.modul] + '/index.html', { waitUntil:'load' });
      await page.waitForFunction(() => window.LIFEOS && LIFEOS.KING_IC && LIFEOS.KING_IC.ayar, null, { timeout:60000 });
      await page.evaluate(([ns, url, token]) => window[ns].Beacon.save({ enabled:true, token, url }), [NS[z.modul], 'http://127.0.0.1:4290', CFG.local_token]);
      // Günlük otomatik geçmiş gönderimi (tur 6) 233 günde HKM'yi doldururdu: ilk ziyarette bir kez aynısı.
      if(!ilk[z.modul]){ ilk[z.modul] = 1; await page.evaluate(ns => window[ns].Beacon.backfill(240), NS[z.modul]).catch(() => null); }
      await page.evaluate(async () => { LIFEOS.KING.ac(); await new Promise(r => setTimeout(r, 2000)); });
      for(const x of vakalar){
        const b = x.b || {};
        let o, iz0 = {};
        const t0 = Date.now();
        let dogru = null;
        try{
        iz0 = await G.izAl(page);
        dogru = b.dogru ? await page.evaluate(b.dogru).catch(() => null) : null;
        if(b.ui){
          const cv = await G.kutuyaYaz(page, x.m);
          o = { yol:'kutu', metin:x.m, cevap:cv || '' };
          const bk = await page.evaluate(() => { const KI = LIFEOS.KING_IC; const on = LIFEOS.KING.akis().filter(m => m.kim === 'king' && m.onizleme).pop(); return { veri:KI.bekleyen ? String((on && on.onizleme.metin) || KI.bekleyen.metin || '') : null, yetki:KI.bekleyenYetki ? (KI.bekleyenYetki.seviye || 'evet') : null }; });
          if(bk.veri != null){ o.onizleme = bk.veri; o.cevapEvet = await G.kutuyaYaz(page, b.hayir ? 'hayır' : 'evet'); }
          else if(bk.yetki){ o.yetki = bk.yetki; o.cevapEvet = await G.kutuyaYaz(page, b.hayir ? 'hayır' : bk.yetki === 'buyuk' ? 'onaylıyorum' : 'evet'); }
        }else{
          o = await soyle(page, { metin:x.m, yol:'king', hayir:b.hayir });
        }
        o.ms = Date.now() - t0;
        G.denetle(o, iz0, await G.izAl(page), x.m);
        }catch(e){
          /* Sağlamlık: King'in bir işi sayfayı yeniden yüklerse (ör. ayar değişikliği) koşu çökmez; vaka nedeniyle kalır,
             sayfa yeniden kurulur ve sıradaki vakaya geçilir. */
          o = Object.assign(o || {}, { hata:'sayfa yeniden yüklendi ya da koptu: ' + String(e.message || e).slice(0, 120), cevap:(o && o.cevap) || '', degisim:{}, secilen:(o && o.secilen) || [], ms:Date.now() - t0 });
          await page.waitForLoadState('load').catch(() => null);
          await page.waitForFunction(() => window.LIFEOS && LIFEOS.KING_IC && LIFEOS.KING_IC.ayar, null, { timeout:60000 }).catch(() => null);
          await page.evaluate(async () => { try{ LIFEOS.KING.ac(); }catch(e){} await new Promise(r => setTimeout(r, 1500)); }).catch(() => null);
        }
        if(dogru != null) o.dogru = dogru;
        const neden = puanla(x, o);
        const s = { id:x.id, alan:x.alan, sev:x.sev, modul:z.modul, m:x.m, gecti:!neden.length, neden, tur:o.tur, ms:o.ms,
          chat:o.chat, secilen:o.secilen, degisim:o.degisim, onizleme:o.onizleme, dogru:o.dogru,
          gitSoruldu:o.gitSoruldu, yetki:o.yetki, hata:o.hata, cevap:[o.cevap, o.cevapEvet].filter(Boolean).join(' ¶ ').slice(0, 400) };
        sonuc.push(s);
        console.log((s.gecti ? '✓' : '✕') + ' ' + x.id + ' [' + x.alan + '] ' + x.m + (s.gecti ? '' : '\n     ' + neden.join(' · ') + '\n     → ' + s.cevap.slice(0, 160)));
        fs.writeFileSync(CIKTI, JSON.stringify(sonuc, null, 1));
      }
      await page.close();
    }
  }finally{ await ctx.close(); }
  const grup = k => { const g = {}; sonuc.forEach(s => { const a = g[s[k]] || (g[s[k]] = [0, 0]); a[1]++; if(s.gecti) a[0]++; }); return g; };
  const top = sonuc.filter(s => s.gecti).length;
  console.log('\nKing-Bench ' + etiket + ': ' + top + '/' + sonuc.length + ' (%' + Math.round(100 * top / sonuc.length) + ')');
  for(const k of ['alan', 'sev', 'modul']) console.log(k + ': ' + Object.entries(grup(k)).map(([a, [g, n]]) => a + ' ' + g + '/' + n).join(' · '));
  const ms = sonuc.map(s => s.ms).sort((a, b) => a - b);
  console.log('süre: ortanca ' + ms[ms.length >> 1] + ' ms, en çok ' + ms[ms.length - 1] + ' ms');
  // Verim: modele gitmeden (kural/kod) çözülen oran — hızlı, ucuz, uydurmaz.
  const kod = sonuc.filter(s => !s.chat).length;
  console.log('verim: modelsiz cevap %' + Math.round(100 * kod / sonuc.length) + ' · modelsiz başarı ' + sonuc.filter(s => !s.chat && s.gecti).length + ' · modelli başarı ' + sonuc.filter(s => s.chat && s.gecti).length + '/' + sonuc.filter(s => s.chat).length);
})().catch(e => { console.error('HATA', e); process.exit(1); });
