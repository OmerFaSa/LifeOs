'use strict';
/* Kabuk başlangıç paketi — tools/kabuk_baslangic.py'nin yardımcısı.
   Tek depodaki eski kayıtları motorların göç bağdaştırıcılarından geçirir (yönlendirme tools/gercek_kosu.js ROTA,
   tek yerde) ve yeni kabuğun deposuna girecek ÇIKTIYI döndürür: not (motor/not.js kaydı), kayıt (motor/kayit.js
   kaydı), kart (motor/tekrar.js kartı; ön ve arka yüzü olan). Plan, Yol ve Soru çıktıları kabuğun bugünkü
   depolarına karşılık gelmez (geçmiş gün planı, konu durumu): sayılır, pakete girmez.
   Girdi (stdin, JSON): [{ rota, alan, kayitlar:[{ yol, govde }] }]. Çıktı (stdout, JSON):
   { notlar, kayitlar, kartlar, say:{ bağdaştırıcı: { girdi, cikti, ret, cokme } }, disarida:{ bağdaştırıcı: n } } */
const path = require('path');
const { ROTA } = require('./gercek_kosu.js');
const Not = require(path.join(__dirname, '..', 'motor', 'not.js'));
const Kayit = require(path.join(__dirname, '..', 'motor', 'kayit.js'));
const liste = x => x == null ? [] : Array.isArray(x) ? x : [x];

function topla(gruplar){
  const out = { notlar:[], kayitlar:[], kartlar:[], say:{}, disarida:{} };
  const gor = { notlar:new Set(), kayitlar:new Set(), kartlar:new Set() };
  const ekle = (ad, o) => { if(o && typeof o.id === 'string' && !gor[ad].has(o.id)){ gor[ad].add(o.id); out[ad].push(o); return true; } return false; };
  (gruplar || []).forEach(g => {
    const kayitlar = g.kayitlar.map(k => ({ govde:k.govde, yol:k.yol, alan:g.alan }));
    (ROTA[g.rota] || []).forEach(([bag, fn]) => {
      const s = out.say[bag] || (out.say[bag] = { girdi:0, cikti:0, ret:0, cokme:0 });
      (fn.liste ? [kayitlar] : kayitlar.map(k => [k])).forEach(grup => {
        s.girdi += grup.length;
        let r;
        try{ r = fn(grup.map(k => k.govde), grup); }
        catch(e){ s.cokme += grup.length; return; }
        s.ret += liste(r.red).length;
        liste(r.cikti).filter(x => x != null).forEach(o => {
          if(bag.indexOf('not.') === 0){ if(!Not.dogrula(o) && ekle('notlar', o)) s.cikti++; else if(Not.dogrula(o)) s.ret++; }
          else if(bag.indexOf('kayit.') === 0){
            // profil gibi kayıt olmayan çıktılar (tur ve gün taşımaz) kabuğun kayıt listesine girmez
            if(o && Kayit.TURLER[o.tur] && typeof o.gun === 'string'){ if(ekle('kayitlar', o)) s.cikti++; }
            else out.disarida[bag] = (out.disarida[bag] || 0) + 1;
          }
          else if(bag.indexOf('tekrar.') === 0){
            if(o && typeof o.on === 'string' && o.on.trim() && typeof o.arka === 'string' && o.arka.trim()){ if(ekle('kartlar', o)) s.cikti++; }
            else out.disarida[bag] = (out.disarida[bag] || 0) + 1;
          }
          else out.disarida[bag] = (out.disarida[bag] || 0) + 1;
        });
      });
    });
  });
  return out;
}

if(require.main === module){
  let ham = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', p => { ham += p; });
  process.stdin.on('end', () => process.stdout.write(JSON.stringify(topla(JSON.parse(ham)))));
}
module.exports = { topla };
