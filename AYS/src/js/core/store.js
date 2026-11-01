/* Kalici depolama: ortak depo katmanina (brand/ortak/depo.js) bu modulun ayarlari.
   Davranis orada; burada yalniz anahtarlar, ad ve sema surumu durur. */

window.R = window.R || {};

R.SCHEMA_VERSION = 5;

R.Store = LIFEOS.Depo.kur({
  ns:R,
  profilAnahtari:'rota.activeProfile',
  varsayilanProfil:'main',
  appId:'rota-84285',
  yerelAnahtar:p => p === 'main' ? 'rota84285.v2' : 'rota84285.v2.' + p,
  ad:'Rota',
  alan:'ays',
  veriYeri:'Ayarlar → Veri',
});
