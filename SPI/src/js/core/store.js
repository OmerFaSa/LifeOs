/* Kalici depolama: ortak depo katmanina (brand/ortak/depo.js) bu modulun ayarlari.
   Davranis orada; burada yalniz anahtarlar, ad ve sema surumu durur. */

window.SP = window.SP || {};

SP.SCHEMA_VERSION = 1;

SP.Store = LIFEOS.Depo.kur({
  ns:SP,
  profilAnahtari:'spi.activeProfile',
  varsayilanProfil:'ben',
  appId:'spi-saglik',
  yerelAnahtar:p => 'spi.v1.' + p,
  ad:'SPİ',
  alan:'spi',
  veriYeri:'Ayarlar → Rehber → Veri',
});
