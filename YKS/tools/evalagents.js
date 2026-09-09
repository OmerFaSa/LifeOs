#!/usr/bin/env node
/* Ofis ajanlarini olcer — hangi model bu is icin yeterli?
 *
 * Ucretsiz modeller Turkce'de ve tur disiplininde birbirinden cok farkli
 * davranir. Bu betik sabit senaryolar uzerinde her ajani konusturur ve
 * cikan metni MAKINEYLE puanlar:
 *
 *   sayi sadakati   Ajanin yazdigi her sayi brifingde var mi?  (en agir olcut)
 *   alan ihlali     Uzman kendi masasinin disina cikti mi?
 *   ev kurali       Garanti, kaynak degistirme, uykudan feda, tibbi tavsiye
 *   uzunluk         Ajanin cumle siniri asildi mi?
 *   Turkce          Turkce'ye ozgu harf orani (model Ingilizce'ye kaciyor mu?)
 *   sure            Ilk yanit kac ms
 *
 * Kullanim:
 *   npm i -D playwright
 *   ROTA_PROVIDER=groq ROTA_KEY=gsk_... ROTA_MODEL=llama-3.3-70b-versatile \
 *     node tools/evalagents.js
 *
 * Birden cok model karsilastirmak icin ROTA_MODEL'e virgulle ayrilmis liste ver.
 * Yerel model icin: ROTA_PROVIDER=ollama ROTA_ENDPOINT=http://localhost:11434/v1/chat/completions
 *
 * Anahtar yalnizca tarayiciya yazilir, hicbir yere kaydedilmez.
 * Kota yoneticisi burada da calisir: sinir asilmaz, istekler siraya girer.
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.ROTA_PORT) || 4179;

const PROVIDER = process.env.ROTA_PROVIDER || '';
const KEY = process.env.ROTA_KEY || '';
const MODELS = (process.env.ROTA_MODEL || '').split(',').map(s => s.trim()).filter(Boolean);
const ENDPOINT = process.env.ROTA_ENDPOINT || '';

if(!PROVIDER || !MODELS.length){
  console.error('Kullanim: ROTA_PROVIDER=groq ROTA_KEY=... ROTA_MODEL=model-1,model-2 node tools/evalagents.js');
  process.exit(2);
}

let chromium;
try{ ({ chromium } = require('playwright')); }
catch(e){ console.error('Playwright bulunamadi. Kurulum:  npm i -D playwright'); process.exit(2); }

/* ---------- senaryolar ----------
   Her senaryo uygulamanin durumunu kurar; ajanlar ayni veriye bakar.
   Beklenti sutunu, bir insanin dogru cevabi taniyabilmesi icindir. */
const FIXTURES = [
  {
    id:'borclu',
    title:'Analiz borçlu aday',
    /* Kurulum kodu METIN olarak durur: page.evaluate kapanis degiskeni tasiyamaz,
       bu yuzden tarayicida new Function ile kurulur. */
    setup:`
      await R.Model.ensureWeek(R.Model.currentWeek());
      R.S.exams = [
        R.Test.examWithNet('2026-10-01', 62, 'TYT'),
        R.Test.examWithNet('2026-10-08', 58, 'TYT'),
        R.Test.examWithNet('2026-10-15', 55, 'TYT'),
      ];
      R.S.exams[1].analysisCompletedAt = null;
      R.S.exams[2].analysisCompletedAt = null;
    `,
    beklenti:'Analist borcu öne almalı; TYT medyanındaki düşüşü söylemeli.',
  },
  {
    id:'uykusuz',
    title:'Uykusuz, planı kaymış aday',
    setup:`
      const U = R.U, M = R.Model;
      await M.ensureWeek(M.currentWeek());
      for(let i = 0; i < 7; i++){
        const d = U.addDays(U.today(), -i);
        await M.ensureDay(d);
        const day = R.S.days[U.iso(d)];
        if(day){
          day.sleepHours = 5;
          day.blocks.forEach((b, j) => { b.status = j === 0 ? 'done' : 'skipped'; });
        }
      }
    `,
    beklenti:'Rehber uykuyu öne almalı; net yorumlamamalı.',
  },
  {
    id:'temiz',
    title:'Verisi henüz olmayan aday',
    setup:'',
    beklenti:'Herkes "karar için yeterli kayıt yok" demeli, tahmin yürütmemeli.',
  },
];

function waitForServer(url, tries){
  return new Promise((resolve, reject) => {
    const attempt = n => fetch(url).then(resolve).catch(() => {
      if(n <= 0) return reject(new Error('sunucu acilmadi'));
      setTimeout(() => attempt(n - 1), 200);
    });
    attempt(tries == null ? 40 : tries);
  });
}

function pad(s, n){ s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function padL(s, n){ s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  let browser;
  let bad = 0;

  try{
    await waitForServer('http://127.0.0.1:' + PORT + '/tests/');
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('sayfa hatasi:', e.message));

    /* Test sayfasi ekranlari yuklemez: motor ve sahte depo hazir gelir. */
    await page.goto('http://127.0.0.1:' + PORT + '/tests/', { waitUntil:'load' });
    await page.waitForFunction(() => window.R && window.R.Office && window.R.Test);

    /* Senaryolari sayfaya kur. */
    await page.evaluate(list => {
      window.__ROTA_FIXTURES__ = {};
      list.forEach(f => {
        /* Senaryolar depoya yazabilsin diye async sarmalanir. */
        window.__ROTA_FIXTURES__[f.id] = {
          setup:new Function('return (async () => {' + f.setup + '})();'),
        };
      });
    }, FIXTURES.map(f => ({ id:f.id, setup:f.setup })));

    for(const model of MODELS){
      console.log('\n══ ' + PROVIDER + ' · ' + model + ' ' + '═'.repeat(Math.max(0, 46 - model.length)));

      for(const fx of FIXTURES){
        const rows = await page.evaluate(async ({ provider, key, model, endpoint, fxId }) => {
          const F = window.__ROTA_FIXTURES__[fxId];
          R.Test.resetState();
          R.S.office = null; R.S.officeChats = {}; R.S.officeMeetings = [];
          R.Quota.reset();
          if(key) R.LLM.setKey(provider, key);
          await R.Office.saveSettings({ provider, model, endpoint, fallback:false });
          await F.setup();
          R.Office.resetBriefs();

          const out = [];
          for(const id of R.AGENT_IDS){
            const agent = R.AGENT_BY_ID[id];
            const brief = R.Office.brief(id);
            const t0 = Date.now();
            let res;
            try{
              res = await R.Office.briefing(id);
            }catch(err){
              out.push({ id, name:agent.name, error:(err && err.code) || 'hata' });
              continue;
            }
            const text = res.text || '';
            const cumle = (text.match(/[.!?…]+(\s|$)/g) || []).length || 1;
            const trHarf = (text.match(/[ıİşŞğĞüÜöÖçÇ]/g) || []).length;
            out.push({
              id, name:agent.name, mode:res.mode,
              ms:Date.now() - t0,
              uzunluk:text.length,
              cumle, cumleSiniri:agent.maxSentences,
              uydurma:R.Office.numberFidelity(text, brief).length,
              alan:R.Office.scopeBreaches(text, agent).length,
              evKurali:R.Office.validate(text).warnings.length,
              trOran:text.length ? Math.round(1000 * trHarf / text.length) / 10 : 0,
              ornek:text.slice(0, 90),
            });
          }
          R.LLM.setKey(provider, '');
          return out;
        }, { provider:PROVIDER, key:KEY, model, endpoint:ENDPOINT, fxId:fx.id });

        console.log('\n  ' + fx.title + '  —  ' + fx.beklenti);
        console.log('  ' + pad('ajan', 10) + padL('sn', 5) + padL('cümle', 8)
          + padL('uydurma', 9) + padL('alan', 6) + padL('kural', 7) + padL('TR%', 7) + '  örnek');
        rows.forEach(r => {
          if(r.error){ console.log('  ' + pad(r.name, 10) + '  HATA: ' + r.error); bad++; return; }
          const flag = (r.uydurma ? '!' : ' ');
          bad += r.uydurma + r.alan + r.evKurali;
          console.log('  ' + pad(r.name, 10)
            + padL((r.ms/1000).toFixed(1), 5)
            + padL(r.cumle + '/' + r.cumleSiniri, 8)
            + padL(r.uydurma + flag, 9)
            + padL(r.alan, 6)
            + padL(r.evKurali, 7)
            + padL(r.trOran, 7)
            + '  ' + r.ornek.replace(/\s+/g, ' '));
        });
      }
    }

    console.log('\n' + (bad
      ? bad + ' ihlal bulundu. "uydurma" sütunu sıfır olmayan model bu iş için güvenilir değil.'
      : 'İhlal yok. Model sayı sadakatine ve alan sınırına uydu.'));
    console.log('Not: TR% düşükse (≈ %3 altı) model Türkçe’ye özgü harfleri kullanmıyor demektir.');
  }catch(err){
    console.error('Kosum hatasi:', err && err.message ? err.message : err);
    bad = bad || 1;
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
  process.exit(bad ? 1 : 0);
})();
