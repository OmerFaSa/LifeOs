'use strict';
/* Kabuk başlangıç paketi — tools/kabuk_baslangic.py'nin yardımcısı.
   Tek depodaki eski kayıtları motorların göç bağdaştırıcılarından geçirir (yönlendirme tools/gercek_kosu.js ROTA,
   tek yerde) ve yeni kabuğun deposuna girecek ÇIKTIYI döndürür:
     not (motor/not.js) · kayıt (motor/kayit.js) · kart (motor/tekrar.js; ön ve arka yüzü olan) ·
     plan { gunler: AYS gün planı, hedefler: hafta hedefi/program/istisna, sablonlar: SPİ hafta şablonu } (motor/plan.js) ·
     soru { denemeler, hatalar, gunler } (motor/soru.js) · yol { 'akademik.1': Yol kaydı parçası } (motor/yol.js GOC.aysKonu).
   Girdi (stdin, JSON): [{ rota, alan, kayitlar:[{ yol, govde }] }] ya da { gruplar, baglam:{ baslangic? } }.
   Çıktı (stdout, JSON): { notlar, kayitlar, kartlar, plan, soru, yol, beden, say:{ bağ: { girdi, cikti, ret, cokme } },
   disarida:{ bağ: n }, eksik:{ bağ: [madde] }, rotasiz:{ rota: n } }. disarida'nın nedeni DISARIDA'da. */
const path = require('path');
const { ROTA } = require('./gercek_kosu.js');
const Not = require(path.join(__dirname, '..', 'motor', 'not.js'));
const Kayit = require(path.join(__dirname, '..', 'motor', 'kayit.js'));
const liste = x => x == null ? [] : Array.isArray(x) ? x : [x];
const YOL_ASAMA = 'akademik.1';   // Yol.GOC.aysKonu'nun eşlediği aşama (gercek_kosu.js AKADEMIK)
const PLAN = { 'plan.aysGun':'gunler', 'plan.aysHafta':'hedefler', 'plan.aysPlan':'hedefler', 'plan.spiHaftaplan':'sablonlar' };
const SORU = { 'soru.aysDeneme':'denemeler', 'soru.aysHata':'hatalar', 'soru.aysGun':'gunler' };
// Pakete girmeyen çıktının nedeni (bağ önekiyle): rapor bunu yazar
const DISARIDA = { kayit:'kayıt olmayan çıktı (tür ya da gün yok)', tekrar:'iki yüzü olmayan kart (kapanış ölçümü, hedef tekrarı): Tekrar ekranı ön ve arka yüz ister',
  plan:'tanınmayan plan çıktısı', soru:'tanınmayan soru çıktısı', not:'not doğrulamasından geçmedi' };
// Plan gün kaydının kimliği yok: kaynak ve günle tekilleşir (kabuk aynı anahtarla birleştirir: kabuk/araclar.js baslangicAnahtar)
const anahtar = o => o && (typeof o.id === 'string' ? o.id : typeof o.gun === 'string' && o.kaynak ? o.kaynak + ':' + o.gun : null);

function topla(girdi){
  const gruplar = Array.isArray(girdi) ? girdi : (girdi && girdi.gruplar) || [], baglam = (girdi && girdi.baglam) || {};
  const out = { notlar:[], kayitlar:[], kartlar:[], plan:{ gunler:[], hedefler:[], sablonlar:[] }, soru:{ denemeler:[], hatalar:[], gunler:[] },
    yol:{}, beden:{}, say:{}, disarida:{}, eksik:{}, rotasiz:{} };
  const gor = {};
  const ekle = (yer, ad, o) => { const k = anahtar(o), g = gor[ad] || (gor[ad] = new Set()); if(k && !g.has(k)){ g.add(k); yer.push(o); return true; } return false; };
  const dis = bag => { out.disarida[bag] = (out.disarida[bag] || 0) + 1; };
  gruplar.forEach(g => {
    const kayitlar = g.kayitlar.map(k => ({ govde:k.govde, yol:k.yol, alan:g.alan }));
    if(!ROTA[g.rota]){ out.rotasiz[g.rota] = (out.rotasiz[g.rota] || 0) + kayitlar.length; return; }
    ROTA[g.rota].forEach(([bag, fn]) => {
      const s = out.say[bag] || (out.say[bag] = { girdi:0, cikti:0, ret:0, cokme:0 });
      if(fn.eksik && !out.eksik[bag]) out.eksik[bag] = liste(fn.eksik).slice();
      (fn.liste ? [kayitlar] : kayitlar.map(k => [k])).forEach(grup => {
        s.girdi += grup.length;
        let r;
        try{ r = fn(grup.map(k => k.govde), grup, baglam); }
        catch(e){ s.cokme += grup.length; return; }
        s.ret += liste(r.red).length;
        if(bag === 'yol.aysKonu' && r.kayit){   // ders başına parça; aşamanın tek kaydında birleşir, ilk gelen kalır
          const y = out.yol[YOL_ASAMA] || (out.yol[YOL_ASAMA] = { dersler:{}, cevaplar:{}, eski:{} });
          ['dersler', 'cevaplar', 'eski'].forEach(a => Object.keys(r.kayit[a] || {}).forEach(k => { if(!(k in y[a])){ y[a][k] = r.kayit[a][k]; if(a === 'eski') s.cikti++; } }));
          return;
        }
        liste(r.cikti).filter(x => x != null).forEach(o => {
          if(bag.indexOf('not.') === 0){ if(!Not.dogrula(o) && ekle(out.notlar, 'notlar', o)) s.cikti++; else if(Not.dogrula(o)) s.ret++; }
          else if(bag.indexOf('kayit.') === 0){
            // profil gibi kayıt olmayan çıktılar (tur ve gün taşımaz) kabuğun kayıt listesine girmez
            if(o && Kayit.TURLER[o.tur] && typeof o.gun === 'string'){ if(ekle(out.kayitlar, 'kayitlar', o)) s.cikti++; }
            else if(bag === 'kayit.spiProfil' && o){
              // eski profil: kabukta Ayarlar › Beden (kabuk/ayar.js lifeos.beden.*). Kilo ayar değil, kayıttır.
              ['cinsiyet', 'boy', 'dogumYili', 'hedef'].forEach(a => { if(o[a] != null && out.beden[a] == null) out.beden[a] = o[a]; });
              s.cikti++;
            }
            else dis(bag);
          }
          else if(bag.indexOf('tekrar.') === 0){
            if(o && typeof o.on === 'string' && o.on.trim() && typeof o.arka === 'string' && o.arka.trim()){ if(ekle(out.kartlar, 'kartlar', o)) s.cikti++; }
            else dis(bag);
          }
          else if(PLAN[bag] && anahtar(o)){ if(ekle(out.plan[PLAN[bag]], 'plan', o)) s.cikti++; }
          else if(SORU[bag] && anahtar(o)){ if(ekle(out.soru[SORU[bag]], 'soru.' + SORU[bag], o)) s.cikti++; }
          else dis(bag);
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
module.exports = { topla, DISARIDA, anahtar };
