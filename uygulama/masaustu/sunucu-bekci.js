// Sunucu bekçisi (saf mantık, Electron'a bağlı değil: tools/bekci_test.js sınar).
// Her `aralik` ms'de yoklar; sunucu ölmüşse `baslat()` ile sessizce yeniden başlatır. Art arda `azami` kez
// başlatma işe yaramazsa vazgeçer (`vazgec`) ve bir daha denemez; her başarısız denemede bekleme ikiye katlanır.
function bekci({ yokla, baslat, bekle, vazgec = () => {}, aralik = 30000, azami = 4, tavan = 300000, zamanla = setTimeout }) {
  let basarisiz = 0, durdu = false, zk = null;
  async function tur() {
    if (durdu) return 'durdu';
    if (await yokla()) { basarisiz = 0; return 'saglam'; }
    if (durdu) return 'durdu';
    await baslat();
    if (await bekle()) { basarisiz = 0; return 'yeniden-baslatildi'; }
    if (++basarisiz >= azami) { durdu = true; vazgec(basarisiz); return 'vazgecildi'; }
    return 'basarisiz';
  }
  const gecikme = () => Math.min(tavan, aralik * 2 ** basarisiz);
  function dongu() {
    zk = zamanla(async () => { try { await tur(); } catch (e) { /* bekçi uygulamayı düşürmez */ } if (!durdu) dongu(); }, gecikme());
    if (zk && zk.unref) zk.unref();
  }
  return { tur, gecikme, basla: () => { if (!zk && !durdu) dongu(); }, dur: () => { durdu = true; if (zk) clearTimeout(zk); } };
}
module.exports = { bekci };
