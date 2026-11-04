/* Kalici depolama: ortak depo katmanina (brand/ortak/depo.js) bu modulun ayarlari.
   Davranis orada; burada yalniz anahtarlar, ad ve sema surumu durur. */
window.LIFEOS.PARCA.yazilar({
  'spi.core.store.ayarlar-rehber-veri':'Ayarlar → Rehber → Veri',
});

window.LIFEOS.PARCA.yazilar({
  'spi.core.store.spi':'SPİ',
});


window.SP = window.SP || {};

SP.SCHEMA_VERSION = 1;

SP.Store = LIFEOS.Depo.kur({
  ns:SP,
  profilAnahtari:'spi.activeProfile',
  varsayilanProfil:'ben',
  appId:'spi-saglik',
  yerelAnahtar:p => 'spi.v1.' + p,
  ad:yz('spi.core.store.spi'),
  alan:'spi',
  veriYeri:yz('spi.core.store.ayarlar-rehber-veri'),
});
