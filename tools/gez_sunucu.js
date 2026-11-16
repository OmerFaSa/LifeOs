// Gezi/ölçüm betikleri için ortak sunucu açıcı: boş port seçer (sabit port dolu çıkınca sessizce yanlış sunucuya
// bağlanmasın), sunucuyu geçici veriyle açar, çıktısını biriktirir ve açılmazsa o çıktıyı gösterip durur.
//   const { sunucuAc } = require('./gez_sunucu.js');
//   const S = await sunucuAc({ kok, env, ad: 'hareket-gez' });   // S.port, S.T, S.srv, S.cikti()
//   await S.hazir();   // açılmazsa Error (sunucu çıktısıyla); S.kapat() çıkışta
// GEZ_PORT=NNNN ortam değişkeni portu sabitler; doluysa açık hatayla durur. Sahibin portlarına (4173/4180/4183/4193/4200/51xx) inmez.
const net = require('net'), http = require('http'), path = require('path'), { spawn } = require('child_process');
const YASAK = p => [4173, 4180, 4183, 4193, 4200].includes(p) || (p >= 5100 && p < 5200);

const bosMu = port => new Promise(res => { const s = net.createServer(); s.once('error', () => res(false)); s.listen(port, '127.0.0.1', () => s.close(() => res(true))); });
async function bosPort() {
  for (let i = 0; i < 20; i++) {
    const p = await new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const x = s.address().port; s.close(() => res(x)); }); });
    if (!YASAK(p)) return p;
  }
  throw new Error('boş port bulunamadı');
}

async function sunucuAc({ kok, env, ad = 'gezi', ek = ['--hkm-ayri'] }) {
  const istenen = +process.env.GEZ_PORT || 0;
  if (istenen && (YASAK(istenen) || !(await bosMu(istenen)))) throw new Error(ad + ': GEZ_PORT=' + istenen + ' dolu ya da sahibin portu; başka bir port ver.');
  const port = istenen || await bosPort();
  const T = 'http://127.0.0.1:' + port;
  const srv = spawn(process.platform === 'win32' ? 'python' : 'python3', [path.join(kok, 'sistem/tekkapi.py'), '--port', String(port), ...ek],
    { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let tampon = '', cikti = false;
  const al = b => { tampon = (tampon + b).slice(-4000); };
  srv.stdout.on('data', al); srv.stderr.on('data', al);
  srv.on('exit', k => { cikti = true; al('\n[sunucu çıktı: ' + k + ']'); });
  const hazir = () => new Promise((res, rej) => {
    const son = Date.now() + 40000;
    (function dene() {
      if (cikti) return rej(new Error(ad + ': sunucu açılırken kapandı (port ' + port + ').\n' + tampon));
      http.get(T + '/kabuk/', r => { r.resume(); res(); }).on('error', () => Date.now() > son ? rej(new Error(ad + ': sunucu 40 sn içinde açılmadı (port ' + port + ').\n' + tampon)) : setTimeout(dene, 300));
    })();
  });
  return { port, T, srv, hazir, cikti: () => tampon, kapat: () => { try { srv.kill(); } catch (e) { /* zaten kapalı */ } } };
}
module.exports = { sunucuAc, bosPort };
