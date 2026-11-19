/* kabuk/ata.js — Atalarımızın piksel portreleri ve Türk devletlerinin yaklaşık sınırlı piksel haritaları (Türk teması 4, 2026-11-19;
 * sahip: «atalarımızın resimleri piksel sanatla», «eski Türklerin sınırları ve başarıları»; örnek: önden bakan, iri pikselli, yaldız çerçeveli tablolar).
 *  - Portre: 32×32 ızgara, her karakter bir piksel; elle kurulur (scratch onden.py), palet portrenin içinde. Çizimde hafif yağlıboya dokusu
 *    (piksel başına sabit, tohumlu parlaklık oynaması) ve 4 piksellik yaldız çerçeve eklenir: 40×40 tablo.
 *    Saygı: Atatürk ağırbaşlı, kalpaklı ve askerî paltolu, al zeminde ay yıldızla; karikatür yok. Portre süstür: konuşmaz, söz uydurmaz.
 *  - Harita: Avrupa–Asya çerçevesi (boylam -10…146, enlem 60…6; piksel 1° × 0,75°). Kıyılar, dağ sıraları ve devlet sınırı çokgen ya da çizgi;
 *    her hücre merkezinden örneklenir (aynı veri aynı resim). Sınırlar YAKLAŞIKTIR: genel tarih atlaslarındaki en geniş hâlin sadeleştirilmiş
 *    çizimi; tarih kaynağıyla yazılır, alan ya da nüfus gibi sayı verilmez.
 * Süstür: veri okumaz, sayı üretmez. Tarayıcıda tuvalden PNG (önbellekli); Node'da yalnız ızgara (sınama). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  // Portreler: ad, palet (p), 32 satır (s). Yeni portre: aynı biçimde bir giriş.
  var PORTRE = {
    mete: { ad: "Mete Han", p: {"k":"#17110c","q":"#e8b892","s":"#d49a72","z":"#b2764f","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","f":"#4e3020","F":"#6c4530","o":"#e3bb55","O":"#9c7426","W":"#f1ebdf","D":"#1e3450","r":"#132238","c":"#7a4a2a","C":"#563219","v":"#96603a","y":"#8a6a48","Y":"#5e4630","a":"#a8322a","A":"#741f1a"}, s: [
      'rrrrrrrrrDDDDDDaaDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDDaaaADDDDDDDrrrrrrr',
      'rrrrrrDDDDDDDaaaaAADDDDDDDrrrrrr',
      'rrrrDDDDDDDDDaaaaAADDDDDDDDDrrrr',
      'rrrDDDDDDDDDaaaaaAAADDDDDDDDDrrr',
      'rrrDDDDDDDDDaaaaaAAADDDDDDDDDrrr',
      'rrDDDDDDDDDooooooooooDDDDDDDDDrr',
      'rDDDDDDDDDDOOOOOOOOOODDDDDDDDDDr',
      'rDDDDDDDFFFFFFFyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFyyyFFyyyyyYYYYYDDDDDDDr',
      'DDDDDDoDyyFyFyyyyyyYYYYYDDDDDDDD',
      'DDDDDODDyFsssssssssszzYYDDDDDDDD',
      'DDDDOWDDyyssqqsssssszzYYDDDDDDDD',
      'DDDODWDDFFsbbbssssbbbzYYDDDDDDDD',
      'DDDODWDDFysqkkbssbkkzzYYDDDDDDDD',
      'DDODDWDDyysqwesqzsewzzYYDDDDDDDD',
      'DoODDWDDyFsqzzsqzsSSzzYYDDDDDDDD',
      'roODDWDDDDsqsssqzsszzzDDDDDDDDDr',
      'roODDWDDDDDszsSzSSsSzDDDDDDDDDDr',
      'roODDWDDDDDsgfggggggzDDDDDDDDDDr',
      'roODDWDDDDDDgsfmmgsgDDDDDDDDDDrr',
      'rrODDWDDDDDDfsffggsgDDDDDDDDDrrr',
      'rrODDWDDDyyygSffggSgyyyDDDDDDrrr',
      'rrrODWDDyyyyfyyfgyygyyyyDDDDrrrr',
      'rrrOrWccyyyygccccCCgYYYYCCrrrrrr',
      'rrrrOcccyyygyccccCCYgYYYCCCCrrrr',
      'rrrcvOcccyyyyybbbbYYYYYCCCCCCrrr',
      'rrccvvoccyyyyybbbbYYYYYCCCCCCCrr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    attila: { ad: "Attila", p: {"k":"#17110c","q":"#e8b892","s":"#d49a72","z":"#b2764f","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","f":"#4e3020","o":"#e3bb55","O":"#9c7426","W":"#f1ebdf","D":"#2a2340","r":"#1b1729","i":"#9aa3ad","I":"#5f6872","a":"#b8352d"}, s: [
      'rrrrrrrrrDDDDDDaaDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDDWiiIDDDDDDDrrrrrrr',
      'rrrrrrDDDDDDDDWiiIDDDDDDDDrrrrrr',
      'rrrrDDDDDDDDDiWiiIIDDDDDDDDDrrrr',
      'rrrDDDDDDDDDiWiiiIIIDDDDDDDDDrrr',
      'rrrDDDDDDDDiiWiiiIIIIDDDDDDDDrrr',
      'rrDDDDDDDDiiiWiiiIIIIIDDDDDDDDrr',
      'rDDDDDDDDDiiiWiiiIIIIIDDDDDDDDDr',
      'rDDDDDDDDiiiiiiiiIIIIIIDDDDDDDDr',
      'rDDDDDDDDokookookookoooDDDDDDDDr',
      'DDDDDDDDDOOOOOOOOOOOOOODDDDDDDDD',
      'DDDDDDDDiIsssssssssszziIDDDDDDDD',
      'DDDDDDDDIissqqsssssszzIiDDDDDDDD',
      'DDDDDDDDiIsbbbssssbbbziIDDDDDDDD',
      'DDDDDDDDIisqkkbssbkkzzIiDDDDDDDD',
      'DDDDDDDDiIsqwesqzsewzziIDDDDDDDD',
      'DDDDDDDDIisqzzsqzsSSzzIiDDDDDDDD',
      'rDDDDDDDiIfqsssqzsszzgiIDDDDDDDr',
      'rDDDDDDDIifszsSzSSsSzgIiDDDDDDDr',
      'rDDDDDDDDDfsgfggggggzgDDDDDDDDDr',
      'rrDDDDDDDDffgffmmgggggDDDDDDDDrr',
      'rrrDDDDDDDDDfffffgggDDDDDDDDDrrr',
      'rrrDDDDDDDDDgffffgggDDDDDDDDDrrr',
      'rrrrDDDDDioofoooooogooiDDDDDrrrr',
      'rrrrrrIIIIOOgOOOOOOgOOIIIIrrrrrr',
      'rrrriiIiiIigIiiIiiIigIIIIIIIrrrr',
      'rrrIoIIIIIIIIIIIIIIIIIIIIIIoIrrr',
      'rrIioIiiIiiIiiIiiIiiIIIIIIIoIIrr',
      'rIIIoIIIIIIIIIIIIIIIIIIIIIIoIIIr',
      'rIiiIiiIiiIiiIiiIiiIIIIIIIIIIIIr',
      'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
      'IiiIiiIiiIiiIiiIiiIiIIIIIIIIIIII',
    ] },
    bumin: { ad: "Bumin Kağan", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","f":"#4e3020","F":"#a69c8e","o":"#e3bb55","O":"#9c7426","D":"#173a40","r":"#0e2629","i":"#8c949c","I":"#555c63","y":"#8a8276","Y":"#5a544b","a":"#2c5585","A":"#1e3a62","l":"#2a1d14","L":"#43301f"}, s: [
      'rrrrrrrrrDDDDDDooDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDaaaaAADDDDDDrrrrrrr',
      'rrrrrrDDDDDDaaaaaAAADDDDDDrrrrrr',
      'rrrrDDDDDDDaaaaaaAAAADDDDDDDrrrr',
      'rrrDDDDDDDDaaaaaaAAAADDDDDDDDrrr',
      'rrrDDDDDDyFyFyyyyyyYYYYDDDDDDrrr',
      'rrDDDDDDyFyyFyFyyyyYYYYYDDDDDDrr',
      'rDDDDDDDyyyFFyyyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFFFFFFFyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFyyyFFyyyyyYYYYYDDDDDDDr',
      'DDDDDDDDDyFyFyyyyyyYYYYDDDDDDDDD',
      'DDDDDDDLlDsssssssssszzDLlDDDDDDD',
      'DDDDDDDlLDssqqsssssszzDlLDDDDDDD',
      'DDDDDDDLlDsbbbssssbbbzDLlDDDDDDD',
      'DDDDDDDlLzsqkkbssbkkzzSlLDDDDDDD',
      'DDDDDDDLlzsqwesqzsewzzSLlDDDDDDD',
      'DDDDDDDlLzsqzzsqzsSSzzSlLDDDDDDD',
      'rDDDDDDLlDsqsssqzsszzzDLlDDDDDDr',
      'rDDDDDDlLDDszsSzSSsSzDDlLDDDDDDr',
      'rDDDDDDLlDDssggggggzzDDLlDDDDDDr',
      'rrDDDDDlLDDDssfmmgszDDDlLDDDDDrr',
      'rrrDDDDLlDDDDsffggsDDDDLlDDDDrrr',
      'rrrDDDDlLDDDDSffggSDDDDlLDDDDrrr',
      'rrrrDDDLliooooofgoooooiLlDDDrrrr',
      'rrrrrrIlLIOOOOOOOOOOOOIlLIrrrrrr',
      'rrrriiILlIiiIiiIiiIiIIILlIIIrrrr',
      'rrrIoIIoLIIIIIIIIIIIIIIloIIoIrrr',
      'rrIioIiLIiiIiiIiiIiiIIIILIIoIIrr',
      'rIIIoIIIIIIIIIIIIIIIIIIIIIIoIIIr',
      'rIiiIiiIiiIiiIiiIiiIIIIIIIIIIIIr',
      'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
      'IiiIiiIiiIiiIiiIiiIiIIIIIIIIIIII',
    ] },
    bilge: { ad: "Bilge Kağan", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","f":"#4e3020","o":"#e3bb55","O":"#9c7426","D":"#173a40","r":"#0e2629","c":"#2c5585","C":"#1e3a62","v":"#3e6aa0","y":"#6e4c2f","Y":"#4a321f","a":"#b8352d","l":"#2a1d14","L":"#43301f"}, s: [
      'rrrrrrrrrDDDDDDDDDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDDDDDDDDDDDDDrrrrrrr',
      'rrrrrrDDDDDDDDDokDDDDDDDDDrrrrrr',
      'rrrrDDDDDDDooooooooooDDDDDDDrrrr',
      'rrrDDDDDDDOooooooooooODDDDDDDrrr',
      'rrrDDDDDDDDDooooOoooDDDDDDDDDrrr',
      'rrDDDDDDDDoDDoDaaDoDDoDDDDDDDDrr',
      'rDDDDDDDDDoDDoDooDoDDoDDDDDDDDDr',
      'rDDDDDDDDOoDOoDooDoODoODDDDDDDDr',
      'rDDDDDDDDoaoaoaoaoaoaooDDDDDDDDr',
      'DDDDDDDDDOOOOOOOOOOOOOODDDDDDDDD',
      'DDDDDDDLlDsssssssssszzDLlDDDDDDD',
      'DDDDDDDlLDssqqsssssszzDlLDDDDDDD',
      'DDDDDDDLlDsbbbssssbbbzDLlDDDDDDD',
      'DDDDDDDlLzsqkkbssbkkzzSlLDDDDDDD',
      'DDDDDDDLlzsqwesqzsewzzSLlDDDDDDD',
      'DDDDDDDlLzsqzzsqzsSSzzSlLDDDDDDD',
      'rDDDDDDLlDfqsssqzsszzgDLlDDDDDDr',
      'rDDDDDDlLDfszsSzSSsSzgDlLDDDDDDr',
      'rDDDDDDLlDfssggggggzzgDLlDDDDDDr',
      'rrDDDDDlLDfffffmmgggggDlLDDDDDrr',
      'rrrDDDDLlDDDfffffgggDDDLlDDDDrrr',
      'rrrDDDDlLyyyyffffggyyyylLDDDDrrr',
      'rrrrDDDLlyyyyyyyyyyyyyyLlDDDrrrr',
      'rrrrrrclLyyyyccccCCYYYYlLCrrrrrr',
      'rrrrcccLlyyyyccccCCYYYYLlCCCrrrr',
      'rrrcvccoLyyyyybbbbYYYYYloCCCCrrr',
      'rrccvvcLcyyyyybbbbYYYYYCLCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    kultigin: { ad: "Kül Tigin", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","o":"#e3bb55","O":"#9c7426","D":"#173a40","r":"#0e2629","i":"#a0a8b0","I":"#5f6872","a":"#3ea0a8","l":"#2a1d14","L":"#43301f"}, s: [
      'rrrrrrrrrDDDDDDDDDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDDDDDDDDDDDDDrrrrrrr',
      'rrrrrrDDDDDDDDDokDDDDDDDDDrrrrrr',
      'rrrrDDDDDDDooooooooooDDDDDDDrrrr',
      'rrrDDDDDDDOooooooooooODDDDDDDrrr',
      'rrrDDDDDDDDDooooOoooDDDDDDDDDrrr',
      'rrDDDDDDDDoDDoDaaDoDDoDDDDDDDDrr',
      'rDDDDDDDDDoDDoDooDoDDoDDDDDDDDDr',
      'rDDDDDDDDOoDOoDooDoODoODDDDDDDDr',
      'rDDDDDDDDoaoaoaoaoaoaooDDDDDDDDr',
      'DDDDDDDDDOOOOOOOOOOOOOODDDDDDDDD',
      'DDDDDDDLlDsssssssssszzDLlDDDDDDD',
      'DDDDDDDlLDssqqsssssszzDlLDDDDDDD',
      'DDDDDDDLlDsbbbssssbbbzDLlDDDDDDD',
      'DDDDDDDlLzsqkksssskkzzSlLDDDDDDD',
      'DDDDDDDLlzsqwesqzsewzzSLlDDDDDDD',
      'DDDDDDDlLzsqzzsqzsSSzzSlLDDDDDDD',
      'rDDDDDDLlDsqsssqzsszzzDLlDDDDDDr',
      'rDDDDDDlLDDszsSzSSsSzDDlLDDDDDDr',
      'rDDDDDDLlDDssggggggzzDDLlDDDDDDr',
      'rrDDDDDlLDDDsszmmzszDDDlLDDDDDrr',
      'rrrDDDDLlDDDDsszSssDDDDLlDDDDrrr',
      'rrrDDDDlLDDDDSSSSSSDDDDlLDDDDrrr',
      'rrrrDDDLliooooooooooooiLlDDDrrrr',
      'rrrrrrIlLIOOOOOOOOOOOOIlLIrrrrrr',
      'rrrriiILlIiiIiiIiiIiIIILlIIIrrrr',
      'rrrIoIIoLIIIIIIIIIIIIIIloIIoIrrr',
      'rrIioIiLIiiIiiIiiIiiIIIILIIoIIrr',
      'rIIIoIIIIIIIIIIIIIIIIIIIIIIoIIIr',
      'rIiiIiiIiiIiiIiiIiiIIIIIIIIIIIIr',
      'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
      'IiiIiiIiiIiiIiiIiiIiIIIIIIIIIIII',
    ] },
    tonyukuk: { ad: "Tonyukuk", p: {"k":"#17110c","q":"#f1c9a2","s":"#d9a07a","z":"#b47a56","S":"#8c583c","b":"#9a948a","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","o":"#e3bb55","O":"#9c7426","W":"#f1ebdf","D":"#173a40","r":"#0e2629","c":"#3d5a3a","C":"#283d26","v":"#527a4e","y":"#6e4c2f","Y":"#4a321f","t":"#ece6d8","T":"#bdb5a4","u":"#d6cfbf","G":"#d9d4c8","H":"#a8a296"}, s: [
      'rrrrrrrrrDDDDtttttTDDDDrrrrrrrrr',
      'rrrrrrrDDDDDttutttTTDDDDDrrrrrrr',
      'rrrrrrDDDDDDttutttTTDDDDDDrrrrrr',
      'rrrrDDDDDDDtttutttTTTDDDDDDDrrrr',
      'rrrDDDDDDDDtttutttTTTDDDDDDDDrrr',
      'rrrDDDDDDDDtttutttTTTDDDDDDDDrrr',
      'rrDDDDDDDDttttutttTTTTDDDDDDDDrr',
      'rDDDDDDDDDttttutttTTTTDDDDDDDDDr',
      'rDDDDDDDDDttttutttTTTTDDDDDDDDDr',
      'rDDDDDDDDooooooooooooooDDDDDDDDr',
      'DDDDDDDDDOOOOOOOOOOOOOODDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzGqzzsqzsSSzHSDDDDDDDDD',
      'rDDDDDDDDDGqsssqzsszzHDDDDDDDDDr',
      'rDDDDDDDDDGszsSzSSsSzHDDDDDDDDDr',
      'rDDDDDDDDDGssGGGGGGzzHDDDDDDDDDr',
      'rrDDDDDDDDGWGGGmmGHHHHDDDDDDDDrr',
      'rrrDDDDDDDGGWGGGGGHHHHDDDDDDDrrr',
      'rrrDDDDDDyGGGGGGGGHHHHyDDDDDDrrr',
      'rrrrDDDDyyyGWGGGGGHHHyyyDDDDrrrr',
      'rrrrrrccyyyGGGGGGGHHHYYYCCrrrrrr',
      'rrrrccccyyyGGWGGGGHHHYYYCCCCrrrr',
      'rrrcvccccyyyGGGGGGHHYYYCCCCCCrrr',
      'rrccvvcccyyyGWGGGGHHYYYCCCCCCCrr',
      'rcccvvccccyyyGGGGGHYYYCCCCCCCCCr',
      'rcccvvccccyyyyWGGGYYYYCCCCCCCCCr',
      'ccccvvcccccyyybGGbYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    alparslan: { ad: "Alp Arslan", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","f":"#4e3020","F":"#6c4530","o":"#e3bb55","O":"#9c7426","W":"#f1ebdf","D":"#11393b","r":"#0a2526","c":"#24557a","C":"#173b57","v":"#3373a3","y":"#4a3626","Y":"#2f2218","a":"#1e5a8a","A":"#123e60","t":"#c9c0ae"}, s: [
      'rrrrrrrrrDDDDDDDDWtDDDDrrrrrrrrr',
      'rrrrorrDDDDDaaaaaWtADDDDDrrrrrrr',
      'rroooooDDDDaaaaWWAAAADDDDDrrrrrr',
      'rrooaooDDDDaaaaooAAAADDDDDDDrrrr',
      'rooaaaooDDaaaaaaaAAAAADDDDDDDrrr',
      'rrooaooDDDaaaaaaaAAAAADDDDDDDrrr',
      'rroooooDDDooooooooooooDDDDDDDDrr',
      'rDDDoDDDyyyFFyyyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFFFFFFFyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFyyyFFyyyyyYYYYYDDDDDDDr',
      'DDDDDDDDDyFyFyyyyyyYYYYDDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDgDDzsqzzsqzsSSzzSDDgDDDDDD',
      'rDDDDDDgDDsqsssqzsszzzDDgDDDDDDr',
      'rDDDDDDDgggszsSzSSsSzgggDDDDDDDr',
      'rDDDDDDDDDDgffgggggggDDDDDDDDDDr',
      'rrDDDDDDDDDDssfmmgszDDDDDDDDDDrr',
      'rrrDDDDDDDDDDsffggsDDDDDDDDDDrrr',
      'rrrDDDDDDyyyySffggSyyyyDDDDDDrrr',
      'rrrrDDDDyyyyyyyfgyyyyyyyDDDDrrrr',
      'rrrrrrccyyyyyccccCCYYYYYCCrrrrrr',
      'rrrrccccyyyyyccccCCYYYYYCCCCrrrr',
      'rrrcvccccyyyyybbbbYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybbbbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    osman: { ad: "Osman Gazi", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","g":"#140b06","f":"#2a1a10","F":"#45301f","o":"#e3bb55","O":"#9c7426","D":"#2c1f16","r":"#1d140e","c":"#2f6b45","C":"#1f4a2f","v":"#3f8a5a","y":"#6b4a2d","Y":"#4a321f","t":"#efe8da","T":"#c9bfab","u":"#ddd3c0","U":"#ab9f8a","a":"#b8352d","A":"#86251f"}, s: [
      'rrrrrrrrrDDDDaaaaAADDDDrrrrrrrrr',
      'rrrrrrrDDDDDaaaaaAAADDDDDrrrrrrr',
      'rrrrrrDDDtttaaaaaAAAtTTDDDrrrrrr',
      'rrrrDDDttttttaaaaAAttTTTTDDDrrrr',
      'rrrDDDuuuuuuuuuuuuuuuUUUUUDDDrrr',
      'rrrDDttttttttttttttttTTTTTTDDrrr',
      'rrDDDuuuuuuuuuuuuuuuuUUUUUUDDDrr',
      'rDDDDttttttttttttttttTTTTTTDDDDr',
      'rDDDDuuuuuuuuuuuuuuuuUUUUUUDDDDr',
      'rDDDDDtttttttttttttttTTTTTDDDDDr',
      'DDDDDDDuuuuuuuuuuuuuuUUUUDDDDDDD',
      'DDDDDDDDtttttttttttttTTTDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzfqzzsqzsSSzgSDDDDDDDDD',
      'rDDDDDDDDDfqsssqzsszzgDDDDDDDDDr',
      'rDDDDDDDDDfszsSzSSsSzgDDDDDDDDDr',
      'rDDDDDDDDDfgffggggggggDDDDDDDDDr',
      'rrDDDDDDDDfgfgggggggggDDDDDDDDrr',
      'rrrDDDDDDDfgFffffgggggDDDDDDDrrr',
      'rrrDDDDDDyfgFffffgggggyDDDDDDrrr',
      'rrrrDDDDyyyffFfffggggyyyDDDDrrrr',
      'rrrrrrccyyyfffFffggggYYYCCrrrrrr',
      'rrrrccccyyyyfffffgggYYYYCCCCrrrr',
      'rrrcvccccyyyyyfffgYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybbbbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    fatih: { ad: "Fatih Sultan Mehmet", p: {"D":"#2c1f16","r":"#1d140e","k":"#17110c","t":"#efe8da","T":"#c9bfab","u":"#d9cfbd","U":"#ab9f8a","a":"#b8352d","A":"#86251f","x":"#d65a4c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","m":"#9a5444","f":"#4e3020","F":"#6c4530","g":"#2e1d13","c":"#a3361f","C":"#742416","v":"#c8552f","y":"#6b4a2d","Y":"#4a321f","R":"#d4ae4f","p":"#e04a5f","P":"#f49aaa","K":"#8e1f2e","n":"#4f7a3a","N":"#79a457"}, s: [
      'rrrrrrrrrDDDDDaaaADDDDDrrrrrrrrr',
      'rrrrrrrDDDDttaaxaaAttDDDDrrrrrrr',
      'rrrrrrDDDttttaaxaAAttTTDDDrrrrrr',
      'rrrrDDDDtttttttttttttTTUDDDDrrrr',
      'rrrDDDDttttttttttttuuUUTTDDDDrrr',
      'rrrDDDDttttttttttuuuuTTTTDDDDrrr',
      'rrDDDDtttttttttuuuuttTTUUUDDDDrr',
      'rDDDDDtttttttuuuuttttUUUUTDDDDDr',
      'rDDDDDtttttuuuuttttUUUUTTTDDDDDr',
      'rDDDDDDttuuuuttttuuUUTTTTDDDDDDr',
      'DDDDDDDDuttttttuuttTTTTTDDDDDDDD',
      'DDDDDDDDDUUUUUUUUUUUUUUDDDDDDDDD',
      'DDDDDDDDDDDsqsssssszzDDDDDDDDDDD',
      'DDDDDDDDDDDsbbbssbbbzDDDDDDDDDDD',
      'DDDDDDDDDDzswksqzskwzSDDDDDDDDDD',
      'DDDDDDDDDDzsqzsqzsSzzSDDDDDDDDDD',
      'DDDDDDDDDDzssssqzsszzSDDDDDDDDDD',
      'rDDDDDDDDDDssssqzsszzDDDDDDDDDDr',
      'rDDDDDDDDDDDssSszSszDDDDDDDDDDDr',
      'rDDDDKpKDDDDsggggggzDDDDDDDDDDDr',
      'rrDDDpPpDDDfgffmmffgfDDDDDDDDDrr',
      'rrrDDDKDDDDfFFfffggggDDDDDDDDrrr',
      'rrrDDNnDDyyffFfffggggyyDDDDDDrrr',
      'rrrrDDnDyyyyfFfffgggyyyyDDDDrrrr',
      'rrrrrrcnyyyyffFffgggYYYYCCrrrrrr',
      'rrrrccsssyyyyfFffggYYYYYCCCCrrrr',
      'rrrcvczzzyyyyyfFfgYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybffbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyRRRRYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyRRRRYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    yavuz: { ad: "Yavuz Sultan Selim", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","g":"#2e1d13","f":"#4e3020","o":"#e3bb55","O":"#9c7426","D":"#2c1f16","r":"#1d140e","c":"#2b3f6b","C":"#1c2a4a","v":"#3a5590","y":"#6b4a2d","Y":"#4a321f","t":"#efe8da","T":"#c9bfab","u":"#ddd3c0","U":"#ab9f8a","a":"#b8352d","A":"#86251f"}, s: [
      'rrrrrrrrrDDDaaaakaaADDDrrrrrrrrr',
      'rrrrrrrDDDttttttkttTTTDDDrrrrrrr',
      'rrrrrrDDDDuuuuuukuuUUUDDDDrrrrrr',
      'rrrrDDDDDDttttttkttTTTDDDDDDrrrr',
      'rrrDDDDDDDuuuuuaouuUUUDDDDDDDrrr',
      'rrrDDDDDDDtttttoottTTTDDDDDDDrrr',
      'rrDDDDDDDDuuuuuuuuuUUUDDDDDDDDrr',
      'rDDDDDDDDDtttttttttTTTDDDDDDDDDr',
      'rDDDDDDDDDuuuuuuuuuUUUDDDDDDDDDr',
      'rDDDDDDDDDtttttttttTTTDDDDDDDDDr',
      'DDDDDDDDDDuuuuuuuuuUUUDDDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzsqzzsqzsSSzzSDDDDDDDDD',
      'rDDDDDDDDDsqsssqzsszzzDDDDDDDDDr',
      'rDDDDDDDDDDszsSzSSsSzDDDDDDDDDDr',
      'rDDDDDDDDDDgffgggggggDDDDDDDDDDr',
      'rrDDDDDDDDDgfggggggggDDDDDDDDDrr',
      'rrrDDDDDDDDgDsszSssDgDDDDDDDDrrr',
      'rrrDDDDDDyygySSSSSSygyyDDDDDDrrr',
      'rrrrDDDDyyyyyyyyyyyyyyyyDDDDrrrr',
      'rrrrrrccyyyyyccccCCYYYYYCCrrrrrr',
      'rrrrccccyyyyyccccCCYYYYYCCCCrrrr',
      'rrrcvccccyyyyybbbbYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybbbbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    kanuni: { ad: "Kanuni Sultan Süleyman", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#3b2c20","f":"#5e4a3a","F":"#8a7460","o":"#e3bb55","O":"#9c7426","D":"#2c1f16","r":"#1d140e","c":"#7a2a1e","C":"#561c14","v":"#9a3a2a","y":"#3a2a1c","Y":"#241910","t":"#f2ece0","T":"#cbc1ad","u":"#ddd3c0","U":"#ab9f8a"}, s: [
      'rrrrrrrrrDDDtttttkttDDDrrrrrrrrr',
      'rrrrrrrDDDttttttgkttTTDDDrrrrrrr',
      'rrrrrrDDttttttttktttTTTTDDrrrrrr',
      'rrrrDDDttttttttgktttTTTTTDDDrrrr',
      'rrrDDDtttttttttgktttTTTTTTDDDrrr',
      'rrrDDDtttttttttgktuuTTTUUTDDDrrr',
      'rrDDDDtttttttttgouttTUUTTTDDDDrr',
      'rDDDDDttttttttuoOttuUTTTUUDDDDDr',
      'rDDDDDDtttttuutttuutTTUUTDDDDDDr',
      'rDDDDDDDttuutttuutttUUTTDDDDDDDr',
      'DDDDDDDDDutttuutttuuTTTDDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzsqzzsqzsSSzzSDDDDDDDDD',
      'rDDDDDDDDDsqsssqzsszzzDDDDDDDDDr',
      'rDDDDDDDDDDszsSzSSsSzDDDDDDDDDDr',
      'rDDDDDDDDDDssggggggzzDDDDDDDDDDr',
      'rrDDDDDDDDDffffmmffffDDDDDDDDDrr',
      'rrrDDDDDDDDfFFfffggggDDDDDDDDrrr',
      'rrrDDDDDDyyffFfffggggyyDDDDDDrrr',
      'rrrrDDDDyyyyfFfffgggyyyyDDDDrrrr',
      'rrrrrrccyyyyffFffgggYYYYCCrrrrrr',
      'rrrrccccyyyyyfFffggYYYYYCCCCrrrr',
      'rrrcvccccyyyyyfFfgYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybffbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    timur: { ad: "Emir Timur", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#4e2614","f":"#7a3e22","F":"#9a5530","o":"#e3bb55","O":"#9c7426","D":"#1b3326","r":"#0f2016","c":"#8a6a2a","C":"#5e481a","v":"#a8843a","y":"#6b4a2d","Y":"#4a321f","n":"#2a7f86","N":"#1b5a60"}, s: [
      'rrrrrrrrrDDDDDDnnDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDDnonNDDDDDDDrrrrrrr',
      'rrrrrrDDDDDDDnnonNNDDDDDDDrrrrrr',
      'rrrrDDDDDDDDnnnonNNNDDDDDDDDrrrr',
      'rrrDDDDDDDDDnnnonNNNDDDDDDDDDrrr',
      'rrrDDDDDDDDnnononNoNNDDDDDDDDrrr',
      'rrDDDDDDDDDnonnonNNoNDDDDDDDDDrr',
      'rDDDDDDDyyyFFyyyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFFFFFFFyyyyYYYYYDDDDDDDr',
      'rDDDDDDDFyyyFFyyyyyYYYYYDDDDDDDr',
      'DDDDDDDDDyFyFyyyyyyYYYYDDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzsqzzsqzsSSzzSDDDDDDDDD',
      'rDDDDDDDDDfqsssqzsszzgDDDDDDDDDr',
      'rDDDDDDDDDfszsSzSSsSzgDDDDDDDDDr',
      'rDDDDDDDDDfsgfggggggzgDDDDDDDDDr',
      'rrDDDDDDDDffgffmmgggggDDDDDDDDrr',
      'rrrDDDDDDDDDfffffgggDDDDDDDDDrrr',
      'rrrDDDDDDyyygffffgggyyyDDDDDDrrr',
      'rrrrDDDDyyyyfyyyyyygyyyyDDDDrrrr',
      'rrrrrrccyyyygccccCCgYYYYCCrrrrrr',
      'rrrrccccyyygyccccCCYgYYYCCCCrrrr',
      'rrrcvccccyyyyybbbbYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybbbbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    babur: { ad: "Babür Şah", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","m":"#9a5444","g":"#2e1d13","f":"#4e3020","o":"#e3bb55","O":"#9c7426","W":"#f1ebdf","D":"#14302c","r":"#0b1e1b","c":"#6a2a4a","C":"#4a1d33","v":"#8a3a60","y":"#6b4a2d","Y":"#4a321f","h":"#e2c27a","H":"#b4944a","j":"#f2dca0","a":"#b8352d","t":"#efe8da"}, s: [
      'rrrrrrrrrDDDDDDDDDDWtDDrrrrrrrrr',
      'rrrrrrrDDDDDDDDDDDDWtDDDDrrrrrrr',
      'rrrrrrDDDDDDDDDDDDDWtDDDDDrrrrrr',
      'rrrrDDDDDDhhhhhhhhaoHHDDDDDDrrrr',
      'rrrDDDDDDhhhhhhhhhooHHHDDDDDDrrr',
      'rrrDDDDDhhhhhhhhhjjHHjjHDDDDDrrr',
      'rrDDDDDDhhhhhhhjjhhjjHHjDDDDDDrr',
      'rDDDDDDDhhhhhjjhhjjHHjjHDDDDDDDr',
      'rDDDDDDDhhhjjhhjjhhjjHHHDDDDDDDr',
      'rDDDDDDDDjjhhjjhhjjHHHHDDDDDDDDr',
      'DDDDDDDDDhhhhhhhhhhHHHHDDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzsqzzsqzsSSzzSDDDDDDDDD',
      'rDDDDDDDDDfqsssqzsszzgDDDDDDDDDr',
      'rDDDDDDDDDfszsSzSSsSzgDDDDDDDDDr',
      'rDDDDDDDDDfssggggggzzgDDDDDDDDDr',
      'rrDDDDDDDDfffffmmgggggDDDDDDDDrr',
      'rrrDDDDDDDDDfffffgggDDDDDDDDDrrr',
      'rrrDDDDDDyyyyffffggyyyyDDDDDDrrr',
      'rrrrDDDDyyyyyyyyyyyyyyyyDDDDrrrr',
      'rrrrrrccyyyyyccccCCYYYYYCCrrrrrr',
      'rrrrccccyyyyyccccCCYYYYYCCCCrrrr',
      'rrrcvccccyyyyybbbbYYYYYCCCCCCrrr',
      'rrccvvcccyyyyybbbbYYYYYCCCCCCCrr',
      'rcccvvccccyyyyooooYYYYCCCCCCCCCr',
      'rcccvvccccyyyybbbbYYYYCCCCCCCCCr',
      'ccccvvcccccyyyOOOOYYYCCCCCCCCCCC',
      'ccccvvcccccyyybbbbYYYCCCCCCCCCCC',
    ] },
    enver: { ad: "Enver Paşa", p: {"k":"#17110c","q":"#f1c9a2","s":"#dda37b","z":"#bb7f5b","S":"#8c583c","b":"#3a2618","w":"#ece2d2","e":"#2b1a10","g":"#2e1d13","f":"#4e3020","o":"#e3bb55","D":"#2a2e1c","r":"#1b1e11","c":"#6f6a46","C":"#4f4b31","v":"#8c865a"}, s: [
      'rrrrrrrrrDDDDDDDDDDDDDDrrrrrrrrr',
      'rrrrrrrDDDDDDDDDDDDDDDDDDrrrrrrr',
      'rrrrrrDDDDDDDDDDDDDDDDDDDDrrrrrr',
      'rrrrDDDDDDccccccvcCkCCDDDDDDrrrr',
      'rrrDDDDDDccccccvcckCCkCDDDDDDrrr',
      'rrrDDDDDDcccccvccvCCkCCDDDDDDrrr',
      'rrDDDDDDDccccvccvcCkCCkDDDDDDDrr',
      'rDDDDDDDDcccvccvcckCCkCDDDDDDDDr',
      'rDDDDDDDDccvccvccvCCkCCDDDDDDDDr',
      'rDDDDDDDDcvccvccvcCkCCCDDDDDDDDr',
      'DDDDDDDDDkkkkkkkkkkkkkkDDDDDDDDD',
      'DDDDDDDDDDsssssssssszzDDDDDDDDDD',
      'DDDDDDDDDDssqqsssssszzDDDDDDDDDD',
      'DDDDDDDDDDsbbbssssbbbzDDDDDDDDDD',
      'DDDDDDDDDzsqkkbssbkkzzSDDDDDDDDD',
      'DDDDDDDDDzsqwesqzsewzzSDDDDDDDDD',
      'DDDDDDDDDzsqzzsqzsSSzzSDDDDDDDDD',
      'rDDDDDDDDDgqsssqzsszzgDDDDDDDDDr',
      'rDDDDDDDDDDgzsSzSSsSgDDDDDDDDDDr',
      'rDDDDDDDDDDsgfggggggzDDDDDDDDDDr',
      'rrDDDDDDDDDDsszsszszDDDDDDDDDDrr',
      'rrrDDDDDDDDDDsszSssDDDDDDDDDDrrr',
      'rrrDDDDDDDDDDSSSSSSDDDDDDDDDDrrr',
      'rrrrDDDDDDDDccccCCCCDDDDDDDDrrrr',
      'rrrrrrDDDDDcccckkCCCcDDDDDrrrrrr',
      'rrrrrrrDDDccccccccccccDDDrrrrrrr',
      'rrrrrrrcccccccccCCCCCCCCCrrrrrrr',
      'rrrrrccccccccccCCCCCCCCCCCCrrrrr',
      'rrrccccccccccccCoCCCCCCCCCCCCrrr',
      'rrcccccccccccccCCCCCCCCCCCCCCCrr',
      'rccccccccccccccCoCCCCCCCCCCCCCCr',
      'rccccccccccccccCCCCCCCCCCCCCCCCr',
    ] },
    ataturk: { ad: "Mustafa Kemal Atatürk", p: {"D":"#8e1c16","r":"#6a130f","W":"#f1ebdf","k":"#141110","h":"#25211e","H":"#38332e","j":"#55504a","q":"#f3cfaa","s":"#e2b08a","z":"#c38a66","S":"#97603f","b":"#3a2a1e","w":"#eee6d8","e":"#5fa3dc","m":"#a05d48","c":"#6f6a46","C":"#4f4b31","v":"#8c865a","R":"#d4ae4f"}, s: [
      'rrrrrrrDDDDDDDDDDDDDDDDDDrrrrrrr',
      'rrrrrDDDDDDhjhhhhhhhhDDDDDDrrrrr',
      'rrrrDDDDDDhhhhhhhhhhhhDDDDDDrrrr',
      'rrrDDDDDDhhHhhjhhhhhhhkDDDDDDrrr',
      'rrDDDDDDDhhhjhhhhhhhhkHDDDDDDDrr',
      'rDDDDDDDDHjhhhhhhhHhkkhDDDDDDDDr',
      'rDDDDDDDDhjhHhjhHhhhHhhDDDDDDDDr',
      'DDDDWWDDDjhhhhhhhhHHhhhDDDDDDDDD',
      'DWWWWWWWWhhjjhhHhhhkhHkDDDDDDDDD',
      'WWWWDDDDDhhjhhjhhhHhkkhDDDDDDDDD',
      'WWWDDDDDDkHkkHkkkHkkHkkDDDDWDDDD',
      'WWWDDDDDDDsssssssssszzDDDDWWWDDD',
      'WWDDDDDDDDssqqsssssszzDDWWWWWWWD',
      'WWDDDDDDDDsbbbssssbbbzDDDWWWWWDD',
      'WWDDDDDDDzsqkkbssbkkzzSDDDWWWDDD',
      'WWDDDDDDDzsqwesqzsewzzSDDWWDWWDD',
      'WWWDDDDDDzsqzzsqzsSSzzSDDWDDDWDD',
      'WWWDDDDDDDsqsssqzsszzzDDDDDDDDDD',
      'WWWWDDDDDDDszsSzSSsSzDDDDDDDDDDD',
      'DWWWWWWWWDDsssmmmmszzDDDDDDDDDDD',
      'rDDDWWDDDDDDsszsszszDDDDDDDDDDDr',
      'rDDDDDDDDDDDDsszSssDDDDDDDDDDDDr',
      'rrDDDDDDDDDDDSSSSSSDDDDDDDDDDDrr',
      'rrrDDDDDDDDDccccCCCCDDDDDDDDDrrr',
      'rrrrDDDDDDDcccckkCCCcDDDDDDDrrrr',
      'rrrrrDDDDDccccccccccccDDDDDrrrrr',
      'rrrrrrrcccccccccCCCCCCCCCrrrrrrr',
      'rrrrrcvccccccccCCCCCCCCCCCCrrrrr',
      'rrrccvvccccccccCRCCCCCCCCCCCCrrr',
      'rrccvvcccccccccCCCCCCCCCCCCCCCrr',
      'rcccvvcccccccccCRCCCCCCCCCCCCCCr',
      'rcccvvcccccccccCCCCCCCCCCCCCCCCr',
    ] },
  };
  // söz kaynağındaki ad → portre (ilk eşleşen)
  var SOZ_PORTRE = [['Atatürk', 'ataturk'], ['Mustafa Kemal', 'ataturk'], ['Fatih', 'fatih'], ['Kül Tigin', 'kultigin'], ['Bilge Kağan', 'bilge'], ['Bumin', 'bumin'],
    ['Tonyukuk', 'tonyukuk'], ['Mete', 'mete'], ['Attila', 'attila'], ['Alp Arslan', 'alparslan'], ['Osman Gazi', 'osman'], ['Yavuz', 'yavuz'], ['Kanuni', 'kanuni'],
    ['Timur', 'timur'], ['Babür', 'babur'], ['Enver', 'enver']];
  // Logo: al mühür, altın halka, dış kuşakta on altı yıldız (on altı büyük Türk devleti), ortada bozkurt başı (scratch logo.py)
  var LOGO = { p: {"O":"#5e430c","o":"#e3bb55","a":"#c8102e","A":"#6e0c18","y":"#f2cf6a","w":"#fff6d8","k":"#1e140c","g":"#9aa3ad","G":"#5f6872","e":"#f0a630"}, s: ["..............OOOO..............","..........OOOAAAyAAOOO..........","........OOyAAAAywyAAAyOO........",".......OAywyAAAAyAAAywyAO.......",".....OOAAAyAooooooooAyAAAOO.....","....OOyAAAoaaaaaaaaaaoAAAyOO....","....OywyooaaaaaaaaaaaaooywyO....","...OAAyoaaaaaaaaaaaaaaaaoyAAO...","..OAAAokaaaaaaaaaaaaaaakaoAAAO..","..OyAAokGkaaaaaaaaaaakGkaoAAyO..",".OywyoakGGkaaaaaaaaakGGkaaoywyO.",".OAyAaakGgGkaakkkaakGgGkaaaAyAO.",".OAAoakgGggGkkgggkkGggGgkaaoAAO.",".AAAoakgggggggggggggggggkaaoAAA.","OAAAoakgggggggggggggggggkaaoAAAO","OAyAoakgwgggggggggggggwgkaaoAyAO","OywyoakgwwkeegggggeekwwgkaaoywyO","OAyAoakgwwwkkgggggkkwwwgkaaoAyAO",".AAAoaakwwwwwgggggwwwwwkaaaoAAA.",".OAAoaakgwwwwwgwgwwwwwgkaaaoAAO.",".OAyAaaakgwwwwwwwwwwwgkaaaaAyAO.",".OywyoaaakgwwwwwwwwwgkaaaaoywyO.","..OyAAoaaakgwwwwwwwgkaaaaoAAyO..","..OAAAoaaaakgwkkkwgkaaaaaoAAAO..","...OAAyoaaaakkkkkkkaaaaaoyAAO...","....OywyooaaaaaaaaaaaaooywyO....","....OOyAAAoaaaaaaaaaaoAAAyOO....",".....OOAAAyAooooooooAyAAAOO.....",".......OAywyAAAAyAAAywyAO.......","........OOyAAAAywyAAAyOO........","..........OOOAAAyAAOOO..........","..............OOOO.............."] };
  // Türk simgeleri: ad, bilgi (tek cümle), palet, 16×16
  var SIMGE = {
    tug: { ad: "Tuğ", bilgi: "At kuyruğundan hükümranlık sancağı; Hunlardan Osmanlı’ya.", p: {"G":"#5a5f68","o":"#e3bb55","b":"#3a2a1e","O":"#9c7426","k":"#1e140c"}, s: ["......kok.......",".....koook......","......kok.......",".....kOoOk......","....kbbbbbk.....","...kbbGbGbbk....","...kbGbGbGbk....","...kbbGbGbbk....","....kbGbGbk.....","....kbbGbbk.....",".....kbGbk......","......kbk.......","......kOk.......","......kOk.......","......kOk.......","......kOk......."] },
    kurt: { ad: "Asena", bilgi: "Göktürk türeyiş destanında soyun atası sayılan dişi kurt.", p: {"G":"#5a5f68","g":"#c9ccd2","k":"#1e140c"}, s: ["................","....G..G........","...GgG.GgG......","...GggGGggG.....","..GggggggggG....","..GgggggkgggG...",".GggggggggggGGG.",".GgggggggggggggG",".Gggggggggggggk.",".GgggggggGGGGG..",".GggggggG.......","..GggggggG......","..GgggggggG.....","...GgggggggG....","...GgggggggggG..","....GGGGGGGGGG.."] },
    sancak: { ad: "Kurt başlı sancak", bilgi: "Çin kaynaklarına göre Göktürk sancağının tepesinde altın kurt başı vardı.", p: {"m":"#2c5585","a":"#c8102e","o":"#e3bb55","O":"#9c7426","M":"#1e3a62","k":"#1e140c"}, s: ["koooook.........","kooaook.........",".kooook.........","..kookkkkkkkkkk.","..kOooooooooommk","..kOmmmmmmmmmmmk","..kOmmmmmmmmkkk.","..kOmmmmmmmmk...","..kOMMMMMMMMkkk.","..kOMMMMMMMMMMMk","..kOMMMMMMMMMMMk","..kOkkkkkkkkkkk.","..kOk...........","..kOk...........","..kOk...........","..kOk..........."] },
    ayyildiz: { ad: "Ay yıldız", bilgi: "Al bayrağın ay ve yıldızı; oranlarını 1936 tarihli Türk Bayrağı Kanunu belirler.", p: {"w":"#f2ece0","a":"#c8102e"}, s: [".aaaaaaaaaaaaaa.","aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaa","aaaaawwwaaaaaaaa","aaawwwaaaaaaaaaa","aawwwaaaaaawaaaa","aawwaaaaaawwwaaa","aawwaaaaawwwwwaa","aawwaaaaaawwwaaa","aawwaaaaaawawaaa","aawwwaaaaaaaaaaa","aaawwwaaaaaaaaaa","aaaaawwwaaaaaaaa","aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaa",".aaaaaaaaaaaaaa."] },
    yildiz8: { ad: "Sekiz köşeli yıldız", bilgi: "Selçuklu ve beylik sanatında çini ve taş işçiliğinin yıldızı.", p: {"o":"#e3bb55","O":"#9c7426","a":"#c8102e"}, s: [".......OO.......","......OooO......",".....OooooO.....","...OOOOOOOOOO...","...OooooooooO...","..OOooooooooOO..",".OoOoooaaoooOoO.","OooOooaaaaooOooO","OooOooaaaaooOooO",".OoOoooaaoooOoO.","..OOooooooooOO..","...OooooooooO...","...OOOOOOOOOO...",".....OooooO.....","......OooO......",".......OO......."] },
    kartal: { ad: "Çift başlı kartal", bilgi: "Anadolu Selçuklu yapılarında görülen hükümranlık simgesi.", p: {"o":"#e3bb55","O":"#9c7426","k":"#1e140c","a":"#c8102e"}, s: ["ok............ko","ook...kkkk...koo","oook.kooook.kooo","ooookOaooaOkoooo","koookkooookkoook","kooookkookkooook",".kooooooooooook.","..kooooooooook..",".kooooooooooook.","kooookooookooook",".kkkkkooookkkkk.","....kooooook....","...kokooookok...","..kokkokkokkok..",".kOkkOk..kOkkOk.","..k..k....k..k.."] },
    yay: { ad: "Yay ve ok", bilgi: "Oğuz Kağan Destanı’nda altın yay ve gümüş oklar Bozok ve Üçok boylarına ad verir.", p: {"a":"#c8102e","o":"#e3bb55","w":"#f2ece0","b":"#3a2a1e","O":"#9c7426","k":"#1e140c"}, s: ["..........o.....",".........Ow.....","........O.w.....",".......O..w.....","......Oo..w.....",".....Oo...w.....","....Oo....w.....","..aaOo....w..k..","..bbbbbbbbbbbbkk","..aaOo....w..k..",".....Oo...w.....","......Oo..w.....",".......O..w.....","........O.w.....",".........Ow.....","..........o....."] },
    kilic: { ad: "Kılıç", bilgi: "Osmanlı’da tahta çıkan padişah kılıç kuşanırdı.", p: {"g":"#8a8f98","o":"#e3bb55","w":"#f2ece0","O":"#9c7426","k":"#1e140c"}, s: ["..............k.","...........kkkwk","..........kwwwk.",".........kwwgggk","........kwwggkk.",".......kwwggk...","......kwwggk....","......kwggk.....",".....kwkgk......","..k.kwkgk.......",".kokkwgk........","..kowkgk........","...kwgk.........","..kOkok.........",".kOk.kok........","kok...k........."] },
    kalkan: { ad: "Kalkan", bilgi: "Yuvarlak kalkanlar kamışın ipekle sarılmasıyla örülürdü.", p: {"o":"#e3bb55","w":"#f2ece0","O":"#9c7426","a":"#c8102e"}, s: ["................","....OOOOOOOO....","...OOaaaaaaOO...","..OaaaaoaaaaaO..",".OOaoaaaaaaoaOO.",".OaaaaooooaaaaO.",".OaaaowOOOoaaaO.",".OaaaoOwOOoaaaO.",".OaoaoOOOOoaoaO.",".OaaaoOOOOoaaaO.",".OaaaaooooaaaaO.",".OOaoaaaaaaoaOO.","..OaaaaaoaaaaO..","...OOaaaaaaOO...","....OOOOOOOO....","................"] },
    kopuz: { ad: "Kopuz", bilgi: "Ozanların telli çalgısı; Dede Korkut onunla anılır.", p: {"o":"#e3bb55","b":"#3a2a1e","O":"#9c7426","k":"#1e140c"}, s: [".....kokkok.....","....kokObkok....",".....koObok.....","......kObk......","......kObk......","......kObk......","......kObk......",".....kkObkk.....","....kooooOOk....","...koooooOOOk...","...koooooOOOk...","...koookkOOOk...","...koookkOOOk...","...koooooOOOk...","....koobbOOk....",".....kkookk....."] },
    otag: { ad: "Otağ", bilgi: "Hükümdarın çadırı; bozkırda devletin merkezi.", p: {"a":"#c8102e","t":"#c9c0ae","o":"#e3bb55","w":"#f2ece0","A":"#8a0f20","O":"#9c7426","k":"#1e140c"}, s: [".......kaaak....",".......kaak.....",".......kak......",".......kk.......","....kkkookkk....","..kkwwwwwtttkk..",".kwwwwwwwtttttk.",".kwwwwwwwtttttk.","kwwwwwwwwttttttk","kwwOwwOwwOttOttk","kwOwwOwaAttOttOk","kOwwOwwaatOttOtk","kwwOwwOaaOttOttk","kwOwwOwaattOttOk","kOwwOwwaatOttOtk","kOOOOOOOOOOOOOOk"] },
    kos: { ad: "Kös", bilgi: "Büyük savaş davulu; mehterin en gür sesi.", p: {"a":"#c8102e","t":"#c9c0ae","o":"#e3bb55","w":"#f2ece0","A":"#8a0f20","O":"#9c7426","k":"#1e140c"}, s: [".kok........kok.","..kOk......kOk..","...kOk....kOk...","....kOk..kOk....","...kkkOkkOkkk...","..kwwwwwwwwwwk..",".kOttttttttttOk.",".kaaaaaaaaAAAAk.",".kaaoaaaoaAAoAk.",".kaoaoaoaoAoAok.",".koaaaoaaaoAAAk.",".kaaaaaaaaAAAAk.",".kaaaaaaaaAAAAk.",".kOOOOOOOOOOOOk.","..kkkkkkkkkkkk..","................"] },
  };
  // Kıyılar (boylam, enlem): kara çokgenleri ve iç sular (Karadeniz, Hazar, Aral, Balkaş, Baykal, Isık Göl, Marmara); yaklaşık
  var KIYI = { kara: [
    [[146,61],[146,59.6],[143,59.3],[141,58.5],[138,56.5],[137,54],[140.5,53.5],[141,53],[140,50],[138,47],[135.5,44],[132,43],[130,42.5],[129.5,40],[129.4,37],[129.3,35.3],[127,34.6],[126.3,34.7],[126.5,36.5],[126.6,37.5],[125,38],[124.4,39.7],[122,39],[121.2,38.8],[122.2,40.4],[121,40.8],[119,39.4],[117.7,38.8],[118.8,37.3],[119.5,37.1],[122.5,37.4],[120.3,36],[119.3,35],[120.5,33],[121.8,31.7],[121.9,30.8],[121.5,28.5],[120,26.5],[119.5,25.5],[117,23.5],[114.2,22.3],[111,21.4],[110,20.3],[109.7,21.6],[108,21.5],[106.6,20.5],[105.8,19],[106.5,17.5],[108.8,15.3],[109.3,13],[108.9,11.3],[107,10.4],[105,8.6],[104.8,10.4],[103,11],[100.9,12.7],[100,13.5],[99.2,10.5],[100.4,7.5],[102.2,5],[100.2,5],[98.4,8],[98.3,10],[98.6,13],[97.6,16.5],[95.4,15.8],[94.3,16],[94.5,18.5],[92.9,20.5],[91.8,22.3],[90.5,22],[89,21.7],[87,21.5],[86.8,20.5],[85,19.4],[82.3,16.6],[80.3,15.5],[80.2,13],[79.8,10.3],[78.5,9],[77.5,8.1],[76.2,9.5],[75.2,12],[74.4,14.8],[73.4,16.5],[72.8,19],[72.8,21],[72.4,21.7],[70.9,20.7],[69,22.4],[68.6,23.3],[67.3,24.3],[66.6,25.4],[64,25.3],[61.6,25.2],[58.8,25.5],[57,27.1],[56.3,27.2],[54,26.6],[51.5,27.9],[50.2,29.8],[48.6,30],[48,29.4],[48.6,28],[50,26.4],[50.8,25.6],[51.6,25.1],[51.2,24.3],[53.5,24.1],[55.5,25.4],[56.3,26.2],[56.4,24.8],[58.6,23.6],[59.8,22.5],[58.6,20.6],[57.7,18.9],[56.6,17.9],[55.1,17],[52.2,15.6],[49,14.1],[45,12.8],[43.5,12.7],[42.7,15],[42.5,16.4],[41,19],[39.2,21.5],[37.5,24.3],[35.8,26.8],[34.9,28.1],[35,29.5],[34.4,28],[34.2,27.7],[33.5,28.4],[32.6,29.9],[32.3,31.2],[34.2,31.3],[34.8,32.3],[35.1,33.1],[35.5,33.9],[35.9,35.4],[35.9,36.3],[36.1,36.6],[35.5,36.6],[34.6,36.8],[33.5,36.2],[32.3,36.1],[30.6,36.8],[29.5,36.2],[28.3,36.7],[27.3,37.1],[26.9,38.2],[26.3,38.6],[26.8,39.3],[26.1,39.6],[26.4,40.2],[26,40.6],[24.5,40.9],[23,40.4],[22.6,40.5],[22.6,39.9],[23,39],[22.5,38.3],[23.5,38],[23.1,36.5],[21.7,36.8],[21.3,37.9],[21.1,38.5],[20.2,39.5],[19.4,40.4],[19.5,41.8],[18.6,42.4],[17.5,43],[16,43.5],[15.2,44.2],[14.5,45.2],[13.6,45.1],[13.7,45.7],[12.3,45.4],[12.4,44.3],[13.6,43.5],[14.7,42],[16,41.5],[18.5,40.2],[17.3,40.4],[16.6,38.9],[16.1,38],[15.6,38.2],[15.6,40],[14.3,40.8],[12.5,41.6],[11,42.5],[10.3,43.6],[8.9,44.4],[7.5,43.8],[6,43.1],[4.8,43.4],[3.1,43.1],[3.2,41.9],[2.2,41.4],[0.9,41],[-0.3,39.4],[0.2,38.7],[-0.7,37.6],[-2.1,36.7],[-4.4,36.7],[-5.6,36],[-6.3,36.5],[-7.4,37.2],[-8.9,37],[-8.8,38.5],[-9.4,39.3],[-8.7,41.1],[-8.9,42.3],[-9.3,43],[-8,43.7],[-5.8,43.6],[-3.8,43.4],[-1.8,43.4],[-1.3,44.5],[-1.2,46],[-2.2,47.1],[-4.4,47.8],[-4.7,48.4],[-3,48.8],[-1.6,48.7],[-1.4,49.6],[0.2,49.4],[1.5,50.1],[1.6,50.9],[2.5,51.1],[3.6,51.4],[4.2,52],[4.7,52.9],[5.5,53.3],[7,53.6],[8.5,53.8],[8.8,54.4],[8.2,55.5],[8.1,56.6],[8.6,57.1],[10.6,57.7],[10.2,57],[10.5,56.2],[9.9,55.7],[9.6,55],[10,54.5],[11,54],[12.5,54.4],[14,54],[16,54.5],[18.5,54.8],[19.6,54.4],[21,55.3],[21.1,56.4],[21,57.4],[22,57.6],[23.5,57],[24.3,57.2],[24.3,58.3],[23.5,58.6],[23.5,59.2],[24.5,59.5],[28,59.6],[30.3,59.9],[30.3,61]],
    [[5,61],[5,59],[5.6,58.3],[7,58],[8.2,58.2],[10.5,59.2],[11.2,58.4],[11.9,57.6],[12.7,56.3],[13,55.4],[14.3,55.6],[14.5,56.2],[16,56.2],[16.6,57.5],[16.8,58.5],[18.5,59.3],[18.9,61]],
    [[11.2,55.2],[12.6,55.6],[12.4,56.1],[11.2,55.9]],
    [[-5.7,50.1],[-3.5,50.3],[-1,50.7],[1.4,51.2],[1.7,52.6],[0.3,53.3],[-0.2,54.1],[-1.3,54.9],[-1.6,55.6],[-2.7,56],[-1.8,57.5],[-3.3,57.7],[-3,58.6],[-5,58.6],[-5.7,57.5],[-5.6,56.5],[-6.2,56],[-5.1,55.4],[-4.6,54.8],[-3.3,54.9],[-3.2,54.2],[-3,53.4],[-4.5,53.3],[-4.2,52.3],[-5.2,51.7],[-3.1,51.5],[-4.5,51.1]],
    [[-6,52],[-6,53.4],[-5.5,54.6],[-6.2,55.3],[-7.3,55.3],[-8.5,54.6],[-8.7,54.2],[-10.5,54.2],[-10.5,51.6],[-8.2,51.6],[-6.4,52.2]],
    [[129.8,33.3],[130.8,34],[131.9,33.3],[131.4,31.4],[130.2,31.2],[129.8,32.6]],
    [[132.5,33.2],[134.7,34],[134.3,33.3],[133,32.7]],
    [[130.9,34.2],[132,35.4],[133.5,35.5],[135.4,35.6],[136,36],[136.8,37.3],[137.3,37.5],[138.5,37.7],[139.6,38.6],[140,39.6],[139.9,40.6],[140.6,41.3],[141.5,41.4],[141.9,39.6],[141.5,38.3],[140.9,37.9],[141,36.9],[140.6,35.7],[139.8,35],[139,34.8],[137.4,34.7],[136.8,34.4],[136.2,33.5],[135.1,33.8],[134.2,34.6],[132.6,34.3],[131.5,34]],
    [[140,41.5],[140,42.7],[141.4,43.4],[141.7,44.4],[141.9,45.4],[143.3,44.5],[145.3,44.3],[145.6,43.3],[143.8,42],[141.2,42.4],[140.5,41.8]],
    [[142,46],[141.8,48],[142.2,51],[141.7,53.4],[142.6,54.3],[143.3,53],[143.2,50],[143.5,49],[144.7,49],[142.6,47.5],[143.4,46.6]],
    [[120.1,23],[120.8,24.6],[121.6,25.3],[122,25],[121.5,23.5],[120.9,22],[120.4,22.5]],
    [[108.6,19.2],[109.6,20.1],[111,19.9],[110.5,18.8],[109.5,18.2]],
    [[79.8,6],[79.8,8.5],[80,9.8],[81,8.5],[81.9,7.2],[81.7,5.9],[80,5.9]],
    [[32.3,34.7],[32.4,35.1],[33,35.4],[34.6,35.7],[34,35],[33.6,34.8]],
    [[23.5,35.3],[24.3,35.4],[25.8,35.3],[26.3,35.1],[24.7,34.9]],
    [[12.4,38],[15.6,38.3],[15.1,36.7],[12.4,37.6]],
    [[8.4,39],[8.2,41],[9.2,41.2],[9.7,40.1],[9.6,39.1]],
    [[8.6,41.5],[8.6,42.5],[9.4,43],[9.5,42],[9.2,41.4]],
    [[-5.9,35.8],[-5.3,35.9],[-2.9,35.3],[-1,35.7],[1,36.5],[3,36.8],[5.5,36.8],[8.6,36.9],[10.2,37.3],[11.1,37.1],[10.5,36.5],[11.1,35.2],[10.1,34.3],[11.2,33.2],[13.2,32.9],[15.4,32.3],[17,31],[18.8,30.4],[20.1,31],[20,32.2],[21.7,32.9],[23.2,32.3],[25,31.6],[27.3,31.4],[29.9,31.2],[31,31.6],[32.3,31.2],[32.6,29.9],[32.6,29.5],[33,28.2],[33.9,27.2],[35,25],[35.6,23.9],[36.9,22],[37.2,21],[37.4,18.8],[38.6,18],[39.7,15.5],[41.2,14],[42.4,13],[43.3,12.4],[44.5,10.4],[46,10.7],[48.9,11.3],[51.2,11.8],[51,10.5],[50.8,9.3],[49.6,7.7],[48.8,5],[-11,5],[-11,29],[-9.8,29.5],[-9.7,31],[-8.5,33.2],[-6.8,34]],
  ], su: [
    [[27.6,42.4],[28.1,43.6],[28.6,44.4],[29.7,45.2],[30.5,46.4],[31.6,46.7],[32.8,46.3],[32.6,45.4],[33.7,44.4],[35.2,44.8],[35.4,45.4],[35.2,46.2],[35.8,46.8],[37.6,47.1],[39.2,47.2],[38.2,46.4],[37.5,45.4],[36.8,45.2],[37.8,44.6],[39,44],[40.1,43.4],[41.6,42.5],[41.6,41.6],[40,40.9],[38.5,40.9],[36.4,41.6],[35,42],[33.4,42],[31.5,41.2],[29.2,41.2],[28.2,41.5]],
    [[46.7,44.7],[47.3,45.6],[49.2,46.6],[51.2,47.1],[53.1,46.9],[53,45.8],[51.3,45.2],[51.3,44.5],[50.5,44.3],[51,43],[52.6,42.6],[52.9,41.3],[53.9,40.6],[53.2,39.9],[53.9,38.9],[53.9,37.3],[51.8,36.8],[50,37.4],[49,38.4],[48.9,39.2],[49.4,40.2],[50.3,40.4],[49.3,41],[48.6,41.8],[47.5,42.9],[47.5,43.8],[46.7,44.3]],
    [[58.3,43.6],[58.6,45],[59.5,46],[61,46.6],[61.9,45.7],[61.2,44.2],[60,43.6],[58.9,43.4]],
    [[74,46.4],[75.8,46.7],[77.5,46.5],[79,46.7],[79.2,46.1],[77.4,45.8],[75.5,45.9],[74,45.7]],
    [[103.8,51.6],[105.5,51.6],[108.5,53.3],[109.8,55.2],[109.4,55.8],[108.2,54.7],[106.4,53],[104.6,52.2]],
    [[76.2,42.3],[78.2,42.7],[78.5,42.1],[76.4,42]],
    [[27,40.4],[29.4,40.4],[29,41],[27.6,40.9]],
  ] };
  // Dağ sıraları (çizgi): Kafkas, Toros, Zagros, Elburz, Hindukuş, Tanrı Dağları, Himalaya, Kunlun, Altay, Hangay, Sayan, Ural, Alpler, Balkan
  var DAG = [[[37.5,44],[42,43],[46,42],[49.5,40.8]],[[29.5,37.2],[33,37],[36,37.6],[40,38.6]],[[44,36.8],[47,34],[50,31],[53,29],[57,27.6]],[[49,36.6],[54,36.6]],[[66,34.8],[71,36.2]],[[69.5,41.5],[75,41.6],[80,42.2],[86,43.2],[93,43]],[[73,35],[78,32.6],[82,30],[88,28],[94,28.4]],[[77,36],[84,36],[92,36],[98,35.4]],[[84,50],[88,49],[92,48],[96,46.4]],[[97,48.2],[101,47.6],[103,47.2]],[[90,52.6],[98,52]],[[58.5,52],[59.2,58.5]],[[6,45],[10,46.6],[14,47.2]],[[22.5,43],[27,42.8]]];
  // Devletler: ad, yıl, zirve (en geniş hâli), başkent [ad, boylam, enlem], sınır (yaklaşık çokgen), kaynak (tarihler için)
  var DEVLET = {
    hun: { ad: "Büyük Hun (Asya Hun) Devleti", yil: "Mete Han · MÖ 209–174", zirve: "En geniş hâli: Mete Han dönemi, Mançurya’dan Tarım havzasına", baskent: ["Ötüken bölgesi",102,47.5], kaynak: "TDV İslâm Ansiklopedisi, «Hunlar» maddesi",
      sinir: [[75,50],[80,53],[90,54.5],[100,55],[110,55],[120,53],[126,48],[124,42.5],[118,40.5],[110,38.5],[104,37.5],[98,38.5],[92,39.5],[88,37],[82,37],[76,38.2],[73,40],[72,44],[73,48]] },
    gokturk: { ad: "Göktürk Kağanlığı", yil: "552–744", zirve: "En geniş hâli: 6. yüzyılın sonu, Mançurya’dan Karadeniz’e", baskent: ["Ötüken",101.5,47.5], kaynak: "TDV İslâm Ansiklopedisi, «Göktürkler» maddesi",
      sinir: [[36,46],[40,49],[45,52],[55,54],[65,55.5],[80,56],[95,56],[105,55.5],[115,53.5],[121,51],[124,47],[121,43],[114,41.5],[106,40.5],[99,40.5],[93,41.5],[87,39.5],[79,38],[73,37.2],[67,37.4],[62,38.3],[57,40],[53,41.3],[49,42.3],[45.5,42.8],[42,43.6],[38.5,44.6],[36,45]] },
    uygur: { ad: "Uygur Kağanlığı", yil: "744–840", zirve: "En geniş hâli: 8. yüzyılın ikinci yarısı, Moğolistan merkezli", baskent: ["Ordubalık",102.6,47.4], kaynak: "TDV İslâm Ansiklopedisi, «Uygurlar» maddesi",
      sinir: [[84,49],[90,52.5],[98,54],[106,53.5],[114,51.5],[119,48.5],[119,45],[114,42.8],[106,41.5],[98,41.5],[91,42],[86,43.5],[83,46]] },
    karahanli: { ad: "Karahanlı Devleti", yil: "840–1212", zirve: "En geniş hâli: 11. yüzyıl başı, Maveraünnehir’den Kaşgar’a", baskent: ["Balasagun",75.2,42.8], kaynak: "TDV İslâm Ansiklopedisi, «Karahanlılar» maddesi",
      sinir: [[59.5,40],[61.5,43],[66,44.5],[70,45.5],[75,46.5],[80,46.5],[85,44.5],[84,41],[81,37.5],[77,36.8],[72,37],[68,37.2],[64,38],[61,38.8]] },
    selcuklu: { ad: "Büyük Selçuklu Devleti", yil: "1040–1157", zirve: "En geniş hâli: Melikşah dönemi (1072–1092), Anadolu’dan Maveraünnehir’e", baskent: ["İsfahan",51.7,32.7], kaynak: "TDV İslâm Ansiklopedisi, «Selçuklular» maddesi",
      sinir: [[29,41],[33,41.6],[37,41.6],[41,41.6],[44,42.2],[48,42.2],[52,42.4],[56,43],[60,44],[66,44.2],[72,43],[75,40],[73,37],[68,36],[63,34],[61,30],[58,26],[56,26],[52,27],[50,29],[48,30],[46,28],[44,26],[42,24],[40,22],[38,24],[36,28],[35,31],[34.5,33],[36,35],[34,36.5],[31,36.7],[29,37.5],[27,38.5],[28,40]] },
    timurlu: { ad: "Timur Devleti", yil: "1370–1507", zirve: "En geniş hâli: 1405, Timur’un ölümünde", baskent: ["Semerkant",67,39.7], kaynak: "TDV İslâm Ansiklopedisi, «Timurlular» maddesi",
      sinir: [[40,41],[45,43],[50,42.6],[54,42],[58,44],[62,45],[68,45],[72,43],[76,41],[74,37],[72,35],[71,32],[68,29],[64,26],[60,25],[57,26],[54,27],[51,28],[49,30],[47,30],[45,31],[43,33],[41,35],[38,37],[39,39]] },
    babur: { ad: "Babür Devleti", yil: "1526–1858", zirve: "En geniş hâli: Evrengzib dönemi, 17. yüzyılın sonu", baskent: ["Delhi",77.2,28.6], kaynak: "TDV İslâm Ansiklopedisi, «Bâbürlüler» maddesi",
      sinir: [[64,32],[67,35],[70,36],[74,36],[77,34],[80,31],[84,28],[88,27],[92,26.5],[93.5,24],[92,22],[89,21.5],[86,20],[84,18],[82,16],[80,13.5],[79,11.5],[77,11],[76,12.2],[75,14],[74,16],[73,18],[72.7,20],[72.5,21.5],[70,21],[68.5,23],[67,24.5],[66,26],[64,28],[62,30],[62,32]] },
    osmanli: { ad: "Osmanlı Devleti", yil: "1299–1922", zirve: "En geniş hâli: 17. yüzyıl, üç kıtada", baskent: ["İstanbul",29,41], kaynak: "TDV İslâm Ansiklopedisi, «Osmanlılar» maddesi",
      sinir: [[-1.5,36],[-1,33],[5,31],[10,30],[15,29],[20,29],[25,28],[30,24],[33,22],[36,22],[39,20],[42,22],[44,26],[47,28],[48.5,30],[48,31.5],[46,33],[46,35],[44.5,37],[44,39.5],[43,41],[42,42],[40,43.5],[39.5,47.3],[36,46.8],[33,46.3],[31,46.6],[30,46.8],[28,48],[26.5,48.6],[24,49],[22,48.6],[20,48.4],[18,48.3],[16.5,47.7],[16,46.5],[15,45],[15.5,44.5],[17,43.5],[18.5,42.5],[19.5,41.5],[19.3,40],[20,39.5],[21,38],[22,36.5],[24,34.8],[27,34.8],[33,34],[35,34.5],[30,33],[25,32.6],[20,32.6],[15,33.5],[11,37.6],[9,37.4],[5,37.2],[1,36.8]] },
  };

  // ---- harita ızgarası ----
  var L0 = -10, B0 = 60, DL = 1, DB = 0.75, HW = 156, HH = 72;
  function ic(p, x, y) {
    var c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      var xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function hucre(lo, la) { return [Math.round((lo - L0) / DL - 0.5), Math.round((B0 - la) / DB - 0.5)]; }
  var karaOnbellek = null;
  function kara() {
    if (karaOnbellek) return karaOnbellek;
    var m = [];
    for (var y = 0; y < HH; y++) for (var x = 0; x < HW; x++) {
      var lo = L0 + (x + 0.5) * DL, la = B0 - (y + 0.5) * DB;
      m.push(KIYI.kara.some(function (p) { return ic(p, lo, la); }) && !KIYI.su.some(function (p) { return ic(p, lo, la); }));
    }
    return (karaOnbellek = m);
  }
  // s derin deniz, S kıyı suyu, w dalga; l kara, L kıyı, n/N dağ (ışık/gölge); d devlet, h devlet taraması, D devlet sınırı,
  // m/M devlet içinde dağ; y/Y/k başkent yıldızı
  function haritaIzgara(ad) {
    var dv = DEVLET[ad]; if (!dv) return null;
    var k = kara(), st = k.map(function (v, i) { return v && ic(dv.sinir, L0 + (i % HW + 0.5) * DL, B0 - (Math.floor(i / HW) + 0.5) * DB); });
    var at = function (m, x, y) { return x < 0 || y < 0 || x >= HW || y >= HH ? null : m[y * HW + x]; }, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], g = [];
    for (var y = 0; y < HH; y++) {
      var s = [];
      for (var x = 0; x < HW; x++) {
        if (!k[y * HW + x]) {
          var yakin = false;
          for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) if (at(k, x + i, y + j)) yakin = true;
          s.push(yakin ? 'S' : (x * 5 + y * 11) % 23 === 0 && x % 2 === 0 ? 'w' : 's'); continue;
        }
        var kiyi = N4.some(function (n) { return at(k, x + n[0], y + n[1]) === false; });
        if (st[y * HW + x]) s.push(N4.some(function (n) { return at(st, x + n[0], y + n[1]) === false; }) ? 'D' : (x + y) % 4 === 0 ? 'h' : 'd');
        else s.push(kiyi ? 'L' : 'l');
      }
      g.push(s);
    }
    // dağ sıraları: çizgi boyunca beş piksellik tepe (sol yamaç ışıkta, sağ yamaç gölgede)
  var TEPE = [[0, -2, 0], [-1, -1, 0], [0, -1, 1], [-2, 0, 0], [-1, 0, 0], [0, 0, 1], [1, 0, 1], [1, -1, 1], [2, 0, 1]];
    DAG.forEach(function (c) {
      for (var i = 1; i < c.length; i++) {
        var a = hucre(c[i - 1][0], c[i - 1][1]), b = hucre(c[i][0], c[i][1]), n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
        for (var t = 0; t <= n; t += 5) {
          var x = Math.round(a[0] + (b[0] - a[0]) * t / n), y = Math.round(a[1] + (b[1] - a[1]) * t / n);
          TEPE.forEach(function (q) {
            var X = x + q[0], Y = y + q[1], v = g[Y] && g[Y][X];
            if (!v || 'lLdhnNmM'.indexOf(v) < 0) return;
            var dv2 = 'dhmM'.indexOf(v) >= 0;
            g[Y][X] = dv2 ? (q[2] ? 'M' : 'm') : (q[2] ? 'N' : 'n');
          });
        }
      }
    });
    if (dv.baskent) {
      var c = hucre(dv.baskent[1], dv.baskent[2]);
      [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]].forEach(function (n) { if (g[c[1] + n[1]]) g[c[1] + n[1]][c[0] + n[0]] = 'k'; });
      [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(function (n) { g[c[1] + n[1]][c[0] + n[0]] = 'Y'; });
      g[c[1]][c[0]] = 'y';
    }
    return g.map(function (r) { return r.join(''); });
  }
  var HARITA_P = { s: '#16263a', S: '#22394f', w: '#2e4a63', l: '#b9a074', L: '#8c7350', n: '#e2d0a2', N: '#6a5233',
    d: '#9e2a20', h: '#b2372b', D: '#4e1410', m: '#cf6658', M: '#5c1612', y: '#fff3c4', Y: '#e9bd4c', k: '#2a1a0a' };

  // ---- çizim: doku, yaldız çerçeve ----
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function titre(x, y) { var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) >>> 0; h = Math.imul(h ^ h >>> 13, 1274126177) >>> 0; return ((h >>> 16) & 255) / 255 - 0.5; }
  // satırları RGBA dizisine boyar; doku: parlaklık oynaması (0.1 = ±%5)
  function boya(d, W, satirlar, pal, ox, oy, doku) {
    var on = {};
    for (var y = 0; y < satirlar.length; y++) for (var x = 0; x < satirlar[y].length; x++) {
      var ch = satirlar[y][x]; if (ch === '.') continue;
      var r = on[ch] || (on[ch] = hx(pal[ch])), f = 1 + titre(x + ox, y + oy) * doku, i = ((y + oy) * W + x + ox) * 4;
      d[i] = Math.min(255, r[0] * f); d[i + 1] = Math.min(255, r[1] * f); d[i + 2] = Math.min(255, r[2] * f); d[i + 3] = 255;
    }
  }
  // dört halkalı yaldız çerçeve: koyu dış kenar, eğimli altın (üst-sol ışıkta), boncuklu süs halkası, resme düşen iç gölge
  var CERCEVE = ['#3a2810', ['#e6c260', '#a67824'], ['#c99a3c', '#f2d57e', '#f7e6a6'], '#22170a'];
  function cerceve(d, W, H) {
    var p = [];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var h = Math.min(x, y, W - 1 - x, H - 1 - y); if (h > 3) continue;
      var c = h === 0 ? CERCEVE[0] : h === 3 ? CERCEVE[3] : h === 1 ? CERCEVE[1][(x === h || y === h) && x < W - 1 - h && y < H - 1 - h ? 0 : 1]
        : ((x <= 3 || x >= W - 4) && (y <= 3 || y >= H - 4)) ? CERCEVE[2][2] : CERCEVE[2][(x + y) % 2];
      p.push([x, y, c]);
    }
    p.forEach(function (q) { var r = hx(q[2]), f = 1 + titre(q[0] + 91, q[1] + 37) * 0.12, i = (q[1] * W + q[0]) * 4; d[i] = Math.min(255, r[0] * f); d[i + 1] = Math.min(255, r[1] * f); d[i + 2] = Math.min(255, r[2] * f); d[i + 3] = 255; });
  }
  var CER = 4;
  // tablo: ızgara + çerçeve → { w, h, d (RGBA) }
  function tablo(satirlar, pal, doku) {
    var w = satirlar[0].length + CER * 2, h = satirlar.length + CER * 2, d = new Uint8ClampedArray(w * h * 4);
    boya(d, w, satirlar, pal, CER, CER, doku); cerceve(d, w, h);
    return { w: w, h: h, d: d };
  }
  var resimOnbellek = {};
  function png(ad, t) {
    if (resimOnbellek[ad]) return resimOnbellek[ad];
    if (typeof document === 'undefined' || !t) return null;
    try {
      var c = document.createElement('canvas'); c.width = t.w; c.height = t.h;
      c.getContext('2d').putImageData(new ImageData(t.d, t.w, t.h), 0, 0);
      return (resimOnbellek[ad] = c.toDataURL('image/png'));
    } catch (e) { return null; }
  }
  function portreTablo(ad) { var p = PORTRE[ad]; return p ? tablo(p.s, p.p, 0.11) : null; }
  function haritaTablo(ad) { var g = haritaIzgara(ad); return g ? tablo(g, HARITA_P, 0.08) : null; }
  function kac(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Portre: yaldız çerçeveli tablo; ad ekran okuyucuya alt metinle (kim olduğu bilgidir)
  function portreHtml(ad, sinif) {
    var p = PORTRE[ad], u = p && png('p-' + ad, portreTablo(ad));
    return u ? '<img class="ata-portre' + (sinif ? ' ' + sinif : '') + '" src="' + u + '" width="40" height="40" alt="' + kac(p.ad + ', piksel portre') + '">' : '';
  }
  // Metindeki addan portre (söz kaynağı, hükümdar adı): «Atatürk, …», «Kül Tigin Yazıtı», «Tuğrul Bey, Alp Arslan»; portresi olmayan metinde boş
  function sozPortresi(kaynak) {
    var k = String(kaynak || '');
    for (var i = 0; i < SOZ_PORTRE.length; i++) if (k.indexOf(SOZ_PORTRE[i][0]) >= 0 && PORTRE[SOZ_PORTRE[i][1]]) return SOZ_PORTRE[i][1];
    return null;
  }
  function haritaHtml(ad) {
    var d = DEVLET[ad]; if (!d) return '';
    var u = png('h-' + ad, haritaTablo(ad));
    return '<figure class="ata-harita"><figcaption class="ata-harita__ust"><span class="ata-harita__etiket">Türk devletleri</span>' +
      '<span class="ata-harita__ad">' + kac(d.ad) + '</span><span class="ata-harita__yil">' + kac(d.yil) + '</span></figcaption>' +
      (u ? '<img class="ata-harita__resim" src="' + u + '" width="' + (HW + CER * 2) + '" height="' + (HH + CER * 2) + '" alt="' + kac(d.ad + ' haritası, ' + d.zirve + '; sınırlar yaklaşık') + '">' : '') +
      '<p class="ata-harita__not">' + kac(d.zirve) + (d.baskent ? ' · <span class="ata-harita__yildiz" aria-hidden="true">✦</span> ' + kac(d.baskent[0]) : '') + '</p>' +
      '<p class="ata-harita__kaynak">Sınırlar yaklaşık, sadeleştirilmiş çizim · Tarihler: ' + kac(d.kaynak) + '</p></figure>';
  }
  function gununHaritasi(t) { var a = Object.keys(DEVLET), n = Math.floor(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 864e5); return a[n % a.length]; }

  // Tarih tabloları (sahip: «pixel artları çok kötü yapıyoruz»): siluet zafer tabloları kalktı; yerine önceki turun elle ayarlanmış sahneleri.
  // Resimler ayrı kabuk/tablo.js'te (açılış yüküne girmez); yüklenene dek çerçeve boş, tabloDoldur doldurur.
  var TABLO = {
    otuken: { ad: 'Ötüken', alt: 'Göktürk Kağanlığı', metin: 'Kağan otağı, önünde altın kurt başlı tuğ; kaplumbağa kaideli Kül Tigin yazıtı ve doğuya uzanan balbal sırası.' },
    kocatepe: { ad: 'Kocatepe', alt: '26 Ağustos 1922 · Büyük Taarruz', metin: 'Başkomutan Mustafa Kemal Paşa taarruzu Kocatepe’den yönetti; 30 Ağustos’ta Başkomutanlık Meydan Muharebesi kazanıldı.' },
    semerkant: { ad: 'Semerkant', alt: 'Timur Devleti · 1370–1507', metin: 'Timur’un başkenti: firuze kubbeli Gur-i Emir, uzakta Bibi Hanım.' }
  };
  function tabloHtml(ad, sinif) {
    var t = TABLO[ad]; if (!t) return '';
    return '<figure class="tablo' + (sinif ? ' ' + sinif : '') + '"><span class="tablo__cerceve"><img class="tablo__resim" data-tablo="' + ad + '" width="420" height="236" alt="' + kac(t.ad + ', ' + t.alt + ', piksel tablo') + '"></span>' +
      '<figcaption><span class="tablo__ad">' + kac(t.ad) + '</span><span class="tablo__alt">' + kac(t.alt) + '</span><span class="tablo__metin">' + kac(t.metin) + '</span></figcaption></figure>';
  }
  function tablolarHtml() {
    return '<section class="tablolar" aria-label="Tarih tabloları"><p class="tablolar__etiket">Tarih tabloları</p><div class="tablolar__izgara">' + Object.keys(TABLO).map(function (k) { return tabloHtml(k); }).join('') + '</div></section>';
  }
  // kabuk/tablo.js yüklüyse boş çerçeveleri doldurur (telefonda küçük, masaüstünde büyük resim); yüklü değilse false
  function tabloDoldur(el) {
    var R = Kabuk.Tablo; if (!R) return false;
    // telefonda 336 piksellik resim 1× (cihazda tam sayı kat), masaüstünde 420'lik resim 2×: pikseller eşit kalır
    var kucuk = kok.matchMedia && kok.matchMedia('(max-width: 640px)').matches;
    el.querySelectorAll('img[data-tablo]:not([src])').forEach(function (i) { var r = R[i.getAttribute('data-tablo')]; if (r) i.src = kucuk ? r.kucuk : r.buyuk; });
    return true;
  }
  // millî günün tablosu (ay-gün → tablo)
  var TABLO_GUN = { '8-26': 'kocatepe', '8-30': 'kocatepe' };
  function gununTablosu(t) { return TABLO_GUN[(t.getMonth() + 1) + '-' + t.getDate()] || null; }
  // Türk simgeleri (16×16): bant (süs) ve kart (adı ve bir cümle bilgi)
  function simgeTablo(ad) { var x = SIMGE[ad]; if (!x) return null; var d = new Uint8ClampedArray(16 * 16 * 4); boya(d, 16, x.s, x.p, 0, 0, 0); return { w: 16, h: 16, d: d }; }
  function simgeHtml(ad, sinif) { var x = SIMGE[ad], u = x && png('s-' + ad, simgeTablo(ad)); return u ? '<img class="simge' + (sinif ? ' ' + sinif : '') + '" src="' + u + '" width="16" height="16" alt="">' : ''; }
  function turkBandi() {
    var a = Object.keys(SIMGE), h = '';
    a.forEach(function (k, i) { h += simgeHtml(k) + (i < a.length - 1 ? '<span class="turk-bant__ara">✦</span>' : ''); });
    return h ? '<div class="turk-bant" aria-hidden="true">' + h + '</div>' : '';
  }
  function simgelerHtml() {
    return '<section class="simgeler" aria-label="Türk simgeleri"><p class="simgeler__etiket">Türk simgeleri</p><ul class="simgeler__liste">' + Object.keys(SIMGE).map(function (k) {
      return '<li>' + simgeHtml(k, 'simgeler__resim') + '<span><b>' + kac(SIMGE[k].ad) + '</b>' + kac(SIMGE[k].bilgi) + '</span></li>'; }).join('') + '</ul></section>';
  }
  // Bütün haritalar: açılır bölümde küçük tablolar (bugünkü hariç)
  function haritalarHtml(haric) {
    return '<details class="ata-haritalar"><summary>Bütün haritalar</summary><ul>' + Object.keys(DEVLET).filter(function (k) { return k !== haric; }).map(function (k) {
      var d = DEVLET[k], u = png('h-' + k, haritaTablo(k));
      return '<li>' + (u ? '<img src="' + u + '" width="' + (HW + CER * 2) + '" height="' + (HH + CER * 2) + '" alt="' + kac(d.ad + ' haritası; sınırlar yaklaşık') + '">' : '') +
        '<span><b>' + kac(d.ad) + '</b> ' + kac(d.yil) + '</span><span>' + kac(d.zirve) + '</span></li>'; }).join('') +
      '</ul><p class="ata-harita__kaynak">Sınırlar yaklaşık, sadeleştirilmiş çizim · Tarihler: TDV İslâm Ansiklopedisi ilgili maddeleri</p></details>';
  }

  // Başbuğ logosu (2026-11-19, sahip: «bir kurdun etrafında Türk devleti sayısı kadar yıldız»): al mühür, on altı yıldız, bozkurt başı; 32×32
  function logoTablo() { var d = new Uint8ClampedArray(32 * 32 * 4); boya(d, 32, LOGO.s, LOGO.p, 0, 0, 0.05); return { w: 32, h: 32, d: d }; }
  function logoHtml(sinif) { var u = png('logo', logoTablo()); return u ? '<img class="' + (sinif || 'logo') + '" src="' + u + '" width="32" height="32" alt="">' : ''; }
  // sekme simgesi: k kat büyütülmüş keskin PNG (tarayıcı küçültürken yumuşatmasın)
  function logoPng(k) {
    if (typeof document === 'undefined') return null;
    try {
      var t = logoTablo(), c = document.createElement('canvas'), b = document.createElement('canvas'); b.width = b.height = 32; b.getContext('2d').putImageData(new ImageData(t.d, 32, 32), 0, 0);
      c.width = c.height = 32 * k; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(b, 0, 0, 32 * k, 32 * k); return c.toDataURL('image/png');
    } catch (e) { return null; }
  }

  var Ata = { LOGO: LOGO, logoTablo: logoTablo, logoHtml: logoHtml, logoPng: logoPng, PORTRE: PORTRE, DEVLET: DEVLET, SIMGE: SIMGE, HW: HW, HH: HH, CER: CER, haritaIzgara: haritaIzgara, portreTablo: portreTablo, haritaTablo: haritaTablo,
    simgeTablo: simgeTablo, portreHtml: portreHtml, sozPortresi: sozPortresi, haritaHtml: haritaHtml, haritalarHtml: haritalarHtml, gununHaritasi: gununHaritasi,
    TABLO: TABLO, tabloHtml: tabloHtml, tablolarHtml: tablolarHtml, tabloDoldur: tabloDoldur, gununTablosu: gununTablosu, simgeHtml: simgeHtml, turkBandi: turkBandi, simgelerHtml: simgelerHtml };
  Kabuk.Ata = Ata;
  if (typeof module !== 'undefined' && module.exports) module.exports = Ata;
})(typeof window !== 'undefined' ? window : globalThis);
