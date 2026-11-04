#!/usr/bin/env node
/* PİKSEL DENETİMİ — temaya uymayan yumuşak görsel izleri bulur (cam temasının artıkları).

     node tools/piksel_denetim.js            üç modül ve açılır katmanlar, özet ve sınıf listesi
     node tools/piksel_denetim.js --denetle  iz varsa çıkış 1
     --modul AYS   yalnız o modül

   İz sayılanlar: bulanıklık (backdrop-filter, filter: blur), yumuşak gölge (bulanıklığı olan
   box-shadow ve text-shadow), yumuşak geçişli zemin (gradient), yarım saydam yazı (opacity < .75), yazıya yapışık sol şerit.
   Yuvarlaklık sayılmaz: tek kuralla sıfırlanır. Oda tuvali, grafik çizimleri ve İZİN listesi dışarıda. */
const path = require('path');
const KOK = path.resolve(__dirname, '..');
const anaKok = path.resolve(KOK, require('child_process').execSync('git rev-parse --git-common-dir', { cwd:KOK, encoding:'utf8' }).trim(), '..');
const { chromium } = require(path.join(anaKok, 'AYS', 'node_modules', 'playwright'));
const { DOLDUR_KAYNAK } = require('./envanter.js');
const NS = { AYS:'R', SPI:'SP', ESP:'ESP' };
const arg = a => { const i = process.argv.indexOf(a); return i < 0 ? null : process.argv[i + 1]; };
const MODULLER = arg('--modul') ? [arg('--modul')] : Object.keys(NS);

/* Bilerek yumuşak kalanlar: veri çizimi ve kullanıcının fotoğrafı. */
const IZIN = /(^|\s)(siluet|defter__kagit|tema-ornek|kenar|altbant|agentav|agentkare|rutbe|rozet|vk|vk-|kademe|perde|seviye|grafik|gr-|sparkline|isi|minik|piksel-oda|harita|rota-|foto|sk-|skeleton)/;

const TARA = izin => {
  const R = new RegExp(izin), out = {};
  const ekle = (tur, e) => { const k = tur + ' · ' + e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal === undefined ? e.className : '').trim().split(/\s+/).slice(0, 2).join('.'); out[k] = (out[k] || 0) + 1; };
  document.querySelectorAll('body *').forEach(e => {
    if(e.closest('canvas,svg') && e.tagName.toLowerCase() !== 'svg') return;
    const c = String(e.className && e.className.baseVal === undefined ? e.className : '');
    if(R.test(c) || e.closest('.vk,.rutbe,.perde,.tema-ornek')) return;
    const r = e.getBoundingClientRect();
    if(r.width < 4 || r.height < 4) return;
    const s = getComputedStyle(e);
    if(s.visibility === 'hidden' || s.display === 'none') return;
    if(s.backdropFilter && s.backdropFilter !== 'none') ekle('bulanik-arka', e);
    if(/blur/.test(s.filter) || /drop-shadow/.test(s.filter)) ekle('filtre', e);
    if(s.boxShadow !== 'none' && s.boxShadow.split(/,(?![^(]*\))/).some(g => { const n = (g.match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat); return n[2] > 0.5; })) ekle('yumusak-golge', e);
    if(s.textShadow !== 'none' && s.textShadow.split(/,(?![^(]*\))/).some(g => { const n = (g.match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat); return n[2] > 0.5; })) ekle('yazi-golge', e);
    /* Yazıya yapışık sol şerit (2026-11-04: kalan Şerit yüzeyinin izi) */
    if(r.width >= 40 && r.height >= 12 && parseFloat(s.borderLeftWidth) >= 2 && s.borderLeftStyle !== 'none'){
      const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n = null, en = 1e9;
      while((n = w.nextNode())){ if(!n.textContent.trim()) continue; const q = document.createRange(); q.selectNodeContents(n); const b = q.getBoundingClientRect(); if(b.width) en = Math.min(en, b.left - r.left); if(en < 8) break; }
      if(en < 8) ekle('yapisik-serit', e);
    }
    if(/gradient/.test(s.backgroundImage)) ekle('gecis', e);
    if(e.children.length === 0 && (e.textContent || '').trim() && parseFloat(s.opacity) < 0.75) ekle('soluk-yazi', e);
    ['::before', '::after'].forEach(ps => { const q = getComputedStyle(e, ps); if(q.content === 'none' || q.display === 'none') return;
      if(q.backdropFilter && q.backdropFilter !== 'none') ekle('bulanik-arka' + ps, e);
      if(/gradient/.test(q.backgroundImage)) ekle('gecis' + ps, e);
      if(q.boxShadow !== 'none' && q.boxShadow.split(/,(?![^(]*\))/).some(g => { const n = (g.match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat); return n[2] > 0.5; })) ekle('yumusak-golge' + ps, e); });
  });
  /* Çerçeveli kartın kenarına yapışık yazı (2026-11-05). */
  document.querySelectorAll('#main :is(.kutu,.card,.pk,.ledger,.kapak__sayi,.donen,.inc-karar)').forEach(k => {
    if(k.closest('.bugun .bugun__alan,.rutbe,.vk')) return;
    const s = getComputedStyle(k), r = k.getBoundingClientRect();
    if((s.boxShadow === 'none' && parseFloat(s.borderTopWidth) === 0) || r.width < 80 || r.height < 30) return;
    const w = document.createTreeWalker(k, NodeFilter.SHOW_TEXT); let n = null;
    while((n = w.nextNode())){
      const p = n.parentElement;
      if(!n.textContent.trim() || !p.getClientRects().length || getComputedStyle(p).clip !== 'auto') continue;
      const q = document.createRange(); q.selectNodeContents(n); const b = q.getBoundingClientRect();
      if(b.width && b.left - r.left < 5){ ekle('kenara-yapisik', k); break; }
    }
  });
  return out;
};

(async () => {
  const t = await chromium.launch();
  const top = {};
  const kat = o => Object.keys(o).forEach(k => { top[k] = (top[k] || 0) + o[k]; });
  for(const m of MODULLER){
    const ns = NS[m];
    const c = await t.newContext({ viewport:{ width:1600, height:900 }, reducedMotion:'reduce' });
    const p = await c.newPage();
    await p.goto('file:///' + path.join(KOK, m, 'src', 'index.html').replace(/\\/g, '/'));
    await p.waitForFunction(n => window[n] && window[n].S && window[n].S.profile !== undefined && window[n].App, ns, { timeout:25000 });
    await p.evaluate(DOLDUR_KAYNAK[m]);
    await p.waitForTimeout(600);
    const yollar = await p.evaluate(n => Object.keys(window[n].Screens).filter(k => window[n].Screens[k] && window[n].Screens[k].render), ns);
    for(const th of ['light', 'dark']){
      await p.evaluate(a => document.documentElement.setAttribute('data-theme', a), th);
      for(const y of yollar){
        await p.evaluate(([n, r]) => Promise.resolve(window[n].App.go(r)).catch(() => {}), [ns, y]).catch(() => {});
        await p.waitForTimeout(140);
        kat(await p.evaluate(TARA, IZIN.source));
      }
      await p.hover('.site--v5 > .kenar').catch(() => {});
      await p.waitForTimeout(450);
      kat(await p.evaluate(TARA, IZIN.source));
      await p.mouse.move(900, 500);
      for(const sec of ['[data-king-ac]', '.ust__ses', '.ust__hesap', '[data-act="open-appearance"]']){
        await p.evaluate(s => { const e = document.querySelector(s); if(e) e.click(); }, sec).catch(() => {});
        await p.waitForTimeout(400);
        kat(await p.evaluate(TARA, IZIN.source));
        await p.keyboard.press('Escape').catch(() => {});
        await p.waitForTimeout(120);
      }
    }
    await c.close();
  }
  await t.close();
  const l = Object.keys(top).sort((a, b) => top[b] - top[a]);
  const tur = {};
  l.forEach(k => { const x = k.split(' · ')[0]; tur[x] = (tur[x] || 0) + 1; });
  console.log('Farklı iz: ' + l.length + ' · ' + Object.keys(tur).map(k => k + ' ' + tur[k]).join(' · '));
  l.slice(0, Number(arg('--en') || 80)).forEach(k => console.log('  ' + top[k] + '  ' + k));
  process.exit(process.argv.includes('--denetle') && l.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
