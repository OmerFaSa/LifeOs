/* Kalici depolama: ortak depo katmanina (brand/ortak/depo.js) bu modulun ayarlari.
   Davranis orada; burada yalniz anahtarlar, ad ve sema surumu durur. */
window.LIFEOS.PARCA.yazilar({
  'esp.core.store.esp':'ESP',
});


window.ESP = window.ESP || {};

ESP.SCHEMA_VERSION = 1;

ESP.Store = LIFEOS.Depo.kur({
  ns:ESP,
  profilAnahtari:'esp.activeProfile',
  varsayilanProfil:'ben',
  appId:'esp-entelektuel',
  yerelAnahtar:p => 'esp.v1.' + p,
  ad:yz('esp.core.store.esp'),
  alan:'esp',
  veriYeri:'Ayarlar → Rehber → Veri',
});
