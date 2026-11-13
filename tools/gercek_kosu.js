'use strict';
/* Göç bağdaştırıcılarını gerçek kayıtla koşar; tools/gercek_kosu.py'nin yardımcısı.
   Girdi (stdin, JSON): [{ no, rota, alan, kayitlar:[{ yol, govde }] }]; rota = '<modül>:<koleksiyon>'.
   Çıktı (stdout, JSON): { no: [{ bag, girdi, cikti, bos, red, eksik, okunmayan, tanimsiz, cokme }] } ya da
   { no: null } (rotanın sahibi motor yok). Çıktıda kayıt içeriği YOK: yalnız sayılar ve bağdaştırıcının
   kendi metinleri, onlar da temiz()'den geçer (rakam → #, kimlik olmayan «…» → «…»). */
const path = require('path');
const M = ad => require(path.join(__dirname, '..', 'motor', ad + '.js'));
const Kayit = M('kayit'), Tekrar = M('tekrar'), Not = M('not'), Soru = M('soru'), Plan = M('plan');

const temiz = s => String(s == null ? '' : s).replace(/«([^»]*)»/g, (t, i) => /^[A-Za-z_]{1,24}$/.test(i) ? t : '«…»')
  .replace(/\d+([.,]\d+)?/g, '#').slice(0, 200);
const KIMLIK_ALAN = /^[A-Za-z_]{1,24}$/;   // yalnız şema adı gibi anahtarlar sayılır; tarih/kimlik anahtarı sayılmaz
const liste = x => x == null ? [] : Array.isArray(x) ? x : [x];
const ZAMAN = Date.UTC(2026, 10, 13);       // göç anı: sabit, çıktı saklanmaz

/* Bir bağdaştırıcıyı bir grup kayıtta koşar. f(kayitlar) → { cikti:[], red:[neden] } ya da atar. */
function kos(bag, fn, kayitlar, eksikOf){
  const s = { bag, girdi:kayitlar.length, cikti:0, bos:0, red:{}, eksik:{}, tanimsiz:{}, cokme:{} };
  const say = (o, k, n) => { o[k] = (o[k] || 0) + (n == null ? 1 : n); };
  (fn.liste ? [kayitlar] : kayitlar.map(k => [k])).forEach(grup => {
    let r;
    try{ r = fn(grup.map(k => k.govde), grup); }
    catch(e){
      const yer = (String(e.stack || '').match(/motor[\\/][a-z]+\.js:\d+/) || ['?'])[0].replace(/\\/g, '/');
      say(s.cokme, temiz(e.name + ': ' + e.message) + ' @ ' + yer, grup.length); return;
    }
    const cikti = liste(r.cikti).filter(x => x != null);
    s.cikti += cikti.length;
    liste(r.red).forEach(n => say(s.red, temiz(n)));
    if(!cikti.length && !liste(r.red).length) s.bos += grup.length;
    cikti.forEach(o => Object.keys(o).forEach(a => { if(o[a] === undefined || (typeof o[a] === 'number' && isNaN(o[a]))) say(s.tanimsiz, a); }));
    liste(eksikOf && eksikOf(r)).forEach(m => say(s.eksik, m, fn.liste ? grup.length : 1));
    Object.entries(r.ekSay || {}).forEach(([k, n]) => { if(n) say(s.eksik, k, n); });
  });
  return s;
}

/* Bağdaştırıcı sarmalayıcıları: her biri { cikti, red, ... } döndürür. kaynak = okuduğu alanları
   saymak için bağdaştırıcının kaynak metni. */
const tekKayit = (ad, ek) => Object.assign(g => {
  const r = Kayit.GOC[ad](g[0]);
  return r && r.kayitlar ? { cikti:r.kayitlar, red:r.reddedilen.map(x => x.tur + ': ' + x.hatalar.join(' ')) } : { cikti:[r] };
}, { kaynak:String(Kayit.GOC[ad]) + (ek || ''), eksik:Kayit.EKSIK[ad] });
const tekrarTek = (ad, cagir) => Object.assign(g => ({ cikti:cagir(g[0]) }), { kaynak:String(Tekrar.GOC[ad]), eksik:Tekrar.EKSIK[ad] });
const notListe = (ad, modulGerek, ek) => Object.assign((govdeler, grup) => {
  const modul = String(grup[0].alan || '').split('/')[0];
  const r = Not.goc[ad](govdeler, Object.assign({ zaman:ZAMAN }, modulGerek ? { modul } : {}, ek));
  return { cikti:r.notlar, red:r.rapor.reddedilen.map(x => x.neden), tasinamayan:r.rapor.tasinamayan,
    ekSay:{ 'bağ belirsiz (birden çok aday)':r.rapor.belirsiz.length, 'bağ kopuk (hedef yok)':r.rapor.kopuk.length, 'zamanı okunamadı (göç anı verildi)':r.rapor.zamanYok } };
}, { liste:true, kaynak:String(Not.goc[ad]) });
const duz = (fn, kaynak) => Object.assign(g => ({ cikti:fn(g[0]) }), { kaynak:String(kaynak) });
const motorDuz = (M, ad) => Object.assign(duz(M.GOC[ad], M.GOC[ad]), { eksik:M.EKSIK[ad] });
const gunNotu = koleksiyon => ['not.gunNotu', notListe('gunNotu', true, { koleksiyon })];

const ROTA = {
  'spi:vitals':[['kayit.spiVitals', tekKayit('spiVitals')], gunNotu('vitals')],
  'spi:meals':[['kayit.spiOgun', tekKayit('spiOgun')]],
  'spi:workouts':[['kayit.spiAntrenman', tekKayit('spiAntrenman')], gunNotu('workouts')],
  'spi:profile':[['kayit.spiProfil', tekKayit('spiProfil')]],
  'ays:mood':[['kayit.aysMood', tekKayit('aysMood')]],
  'ays:breaks':[['kayit.aysMola', tekKayit('aysMola')]],
  'ays:days':[['kayit.aysGun', tekKayit('aysGun')], ['plan.aysGun', motorDuz(Plan, 'aysGun')], ['soru.aysGun', motorDuz(Soru, 'aysGun')], gunNotu('days')],
  'ays:weeks':[['plan.aysHafta', motorDuz(Plan, 'aysHafta')]],
  'ays:plan':[['plan.aysPlan', motorDuz(Plan, 'aysPlan')]],
  'spi:haftaplan':[['plan.spiHaftaplan', motorDuz(Plan, 'spiHaftaplan')]],
  'esp:days':[['kayit.espGun', tekKayit('espGun')], gunNotu('days')],
  'ays:cards':[['tekrar.aysKart', tekrarTek('aysKart', c => c && c.source === 'error' ? Tekrar.GOC.aysYanlis(c) : Tekrar.GOC.aysKart(c))]],
  'esp:cards':[['tekrar.espKart', tekrarTek('espKart', c => Tekrar.GOC.espKart(c))]],
  'ays:hedefPlanlar':[['tekrar.aysHedefTekrar', tekrarTek('aysHedefTekrar', p => Tekrar.GOC.aysHedefTekrar(p))]],
  'hkm:meydan_deste':[['tekrar.meydan', tekrarTek('meydan', r => Tekrar.GOC.meydan(r, ZAMAN))]],
  'hkm:bam_kayitlar':[['not.bamKayit', notListe('bamKayit', false)]],   // King ve arşiv tabloları Python'da: gercek_kosu.py kos_py
  'ays:topics':[
    ['tekrar.aysKapanis', Object.assign(g => ({ cikti:Object.keys((g[0] && g[0].states) || {}).map(k => Tekrar.GOC.aysKapanis(g[0].states[k], k)) }),
      { kaynak:String(Tekrar.GOC.aysKapanis) + 'states', eksik:Tekrar.EKSIK.aysKapanis })],
    ['not.aysKonu', notListe('aysKonu', false)]],
  'ays:defter':[['not.defter', notListe('defter', true)]], 'spi:defter':[['not.defter', notListe('defter', true)]], 'esp:defter':[['not.defter', notListe('defter', true)]],
  'ays:defterterim':[['not.terim', notListe('terim', true)]], 'spi:defterterim':[['not.terim', notListe('terim', true)]], 'esp:defterterim':[['not.terim', notListe('terim', true)]],
  'ays:notum':[['not.notum', notListe('notum', true)]], 'spi:notum':[['not.notum', notListe('notum', true)]], 'esp:notum':[['not.notum', notListe('notum', true)]],
  'ays:videoNotes':[['not.aysVideo', notListe('aysVideo', false)]],
  'esp:notes':[['not.espNot', notListe('espNot', false)]],
  'esp:args':[['not.espTez', notListe('espTez', false)]],
  'esp:drafts':[['not.espTaslak', notListe('espTaslak', false)]],
  'anahtar:lifeos.bilinc':[['not.bilinc', Object.assign(g => {   // tek belge { dusunceler, izin }, liste değil
    const r = Not.goc.bilinc(g[0], { zaman:ZAMAN });
    return { cikti:r.notlar, red:r.rapor.reddedilen.map(x => x.neden), tasinamayan:r.rapor.tasinamayan,
      ekSay:{ 'bağ belirsiz (birden çok aday)':r.rapor.belirsiz.length, 'bağ kopuk (hedef yok)':r.rapor.kopuk.length } };
  }, { kaynak:String(Not.goc.bilinc) })]],
  'ays:exams':[['soru.aysDeneme', duz(Soru.GOC.aysDeneme, Soru.GOC.aysDeneme)]],
  'ays:errors':[['soru.aysHata', duz(Soru.GOC.aysHata, Soru.GOC.aysHata)]],
};
function isle(gruplar){
  const out = {};
  gruplar.forEach(g => {
    const rl = ROTA[g.rota];
    if(!rl){ out[g.no] = null; return; }
    const kayitlar = g.kayitlar.map(k => ({ govde:k.govde, yol:k.yol, alan:g.alan }));
    const sonuc = rl.map(([bag, fn]) => kos(bag, fn, kayitlar, r => fn.eksik || r.tasinamayan));
    /* Sessiz düşen: rotadaki HİÇBİR bağdaştırıcının okumadığı ve taşınamayan listesinde adıyla söylemediği
       girdi alanı (bir kayıt birkaç motora bölünür: ays:days → Kayıt + Plan). Yalnız üst düzey alanlar. */
    const bilinen = rl.map(([, fn]) => fn.kaynak || '').concat(sonuc.map(s => Object.keys(s.eksik).join(' '))).join('\n');
    sonuc[0].sessiz = {};
    kayitlar.forEach(k => Object.keys(k.govde && typeof k.govde === 'object' ? k.govde : {}).forEach(a => {
      if(KIMLIK_ALAN.test(a) && !new RegExp('(^|[^\\w$])' + a + '([^\\w$]|$)').test(bilinen)) sonuc[0].sessiz[a] = (sonuc[0].sessiz[a] || 0) + 1;
    }));
    out[g.no] = sonuc;
  });
  return out;
}

if(require.main === module){
  let ham = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', p => { ham += p; });
  process.stdin.on('end', () => process.stdout.write(JSON.stringify(isle(JSON.parse(ham)))));
}
module.exports = { isle, temiz, ROTA };
