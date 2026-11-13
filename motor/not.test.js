/* Not motoru testleri: node motor/not.test.js  (✓/✕ satırları; temizse çıkış 0, kırmızıysa 1).
   Örnekler kaynak kodun biçimlerinden kuruldu (defter.js, bilinc.js, notum.js, AYS/ESP state.js,
   ogrenmotor.js); içerik uydurmadır, sahibin verisi değildir. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const N = require('./not.js');

let kirmizi = 0, sayi = 0;
function it(ad, f){
  sayi++;
  try{ f(); console.log('✓ ' + ad); }
  catch(e){ kirmizi++; console.log('✕ ' + ad + ' — ' + e.message); }
}
const T0 = Date.UTC(2026, 10, 13, 9, 0, 0);
const GOC = Date.UTC(2026, 10, 13, 12, 0, 0);
const not = (id, o) => N.yeni(Object.assign({ id, baslik:id, olusturma:T0 }, o));
const hepsiGecerli = l => l.forEach(n => assert.strictEqual(N.dogrula(n), '', n.id + ': ' + N.dogrula(n)));
const ids = l => l.map(n => n.id);

/* ------------------------------------------------------------- kayıt */
it('yeni: eksik alanları doldurur, kayıt geçerli', () => {
  const n = not('a', { govde:'metin' });
  assert.deepStrictEqual(Object.keys(n).sort(), N.KAYIT_ALANLARI.slice().sort());
  assert.strictEqual(n.guncelleme, T0);
  assert.strictEqual(n.ozel, false);
  assert.strictEqual(N.dogrula(n), '');
});
it('dogrula: kötü kayıtları Türkçe cümleyle reddeder', () => {
  const iyi = not('a');
  const kotu = [
    [null, 'nesne'],
    [Object.assign({}, iyi, { id:'a b' }), 'kimliği'],
    [Object.assign({}, iyi, { id:'' }), 'kimliği'],
    [Object.assign({}, iyi, { baslik:'', govde:'  ' }), 'boş not'],
    [Object.assign({}, iyi, { tur:'resim' }), 'türü'],
    [Object.assign({}, iyi, { klasor:' Sağlık / Uyku ' }), 'Klasör'],
    [Object.assign({}, iyi, { etiketler:['#felsefe'] }), 'Etiket'],
    [Object.assign({}, iyi, { etiketler:['a', 'a'] }), 'Etiket'],
    [Object.assign({}, iyi, { guncelleme:T0 - 1 }), 'güncelleme'],
    [Object.assign({}, iyi, { olusturma:'2026-11-13' }), 'milisaniye'],
    [Object.assign({}, iyi, { ozel:'evet' }), 'ozel'],
    [Object.assign({}, iyi, { kaynak:{} }), 'Kaynak'],
    [Object.assign({}, iyi, { alan:'Felsefe' }), 'Alan'],
    [Object.assign({}, iyi, { renk:'mavi' }), 'bilinmeyen alan'],
    [Object.assign({}, iyi, { baglam:{ ders:3 } }), 'Bağlam'],
    [Object.assign({}, iyi, { tur:'dusunce', ozellik:{ dusunce:'fikir', kesinlik:7 } }), 'Kesinlik'],
    [Object.assign({}, iyi, { tur:'dusunce', ozellik:{ dusunce:'rüya', kesinlik:3 } }), 'Düşünce türü'],
    [Object.assign({}, iyi, { tur:'tez', ozellik:{ durum:'open' } }), 'Tezin'],
  ];
  kotu.forEach(([n, parca]) => { const h = N.dogrula(n); assert.ok(h && h.indexOf(parca) >= 0, JSON.stringify(n) + ' → «' + h + '»'); assert.ok(/\.$/.test(h)); });
  assert.throws(() => N.yeni({ id:'x', olusturma:T0 }), /boş not/);
});

/* ------------------------------------------------------------- bağlar */
it('baglar: kimlik bağı, çelişki, adsız bağ; eski [[Başlık]] ve medya gömmesi bağ değildir', () => {
  const b = N.baglar('Bkz. [[not:esp/n1|Stoacılık]] ama [[!not:bilinc/d2|Özgür irade]] ve [[not:x9]]. [[Eski başlık]] ![[medya:abc123]]');
  assert.deepStrictEqual(b.map(x => [x.id, x.ad, x.celiski]), [['esp/n1', 'Stoacılık', false], ['bilinc/d2', 'Özgür irade', true], ['x9', '', false]]);
  assert.strictEqual(N.bagYaz('a', 'Ad [x] | y'), '[[not:a|Ad x y]]');
});
it('yeniden adlandırma: bağ kopmaz, eski adlı görünen metin tazelenir, takma ad kalır', () => {
  const l = [not('a', { baslik:'Işık', govde:'kuram' }),
    not('b', { govde:'Bkz. [[not:a|Işık]] ve [[!not:a|ışık]]' }),
    not('c', { govde:'[[not:a|şu fikir]] [[not:a]]' }),
    not('d', { govde:'bağsız' })];
  const r = N.yenidenAdlandir(l, 'a', 'Işığın doğası', T0 + 5);
  const y = id => r.notlar.find(n => n.id === id);
  assert.strictEqual(y('a').baslik, 'Işığın doğası');
  assert.strictEqual(y('b').govde, 'Bkz. [[not:a|Işığın doğası]] ve [[!not:a|Işığın doğası]]');
  assert.strictEqual(y('c').govde, '[[not:a|şu fikir]] [[not:a]]');
  assert.deepStrictEqual(r.degisen, ['a', 'b']);
  assert.strictEqual(y('b').guncelleme, T0 + 5);
  assert.strictEqual(y('c'), l[2]);
  assert.deepStrictEqual(N.baglar(y('b').govde).map(x => x.id), ['a', 'a']);
  assert.strictEqual(l[1].govde, 'Bkz. [[not:a|Işık]] ve [[!not:a|ışık]]', 'girdi değişmemeli');
  hepsiGecerli(r.notlar);
  assert.throws(() => N.yenidenAdlandir(l, 'yok', 'x', T0), /not yok/);
});
it('geri bağlar: bağ verenler, çelişki işareti, kendisi hariç, kimlik sırası', () => {
  const l = [not('z', { govde:'[[not:a|A]]' }), not('a', { govde:'[[not:a|kendim]]' }), not('m', { govde:'[[!not:a|A]]' }), not('k', { govde:'yok' })];
  assert.deepStrictEqual(N.geriBaglar(l, 'a'), [{ id:'m', ad:'m', celiski:true }, { id:'z', ad:'z', celiski:false }]);
});

/* ------------------------------------------------------------- ağ */
it('ağ: belirlenimci (girdi sırası sonucu değiştirmez), kenar önceliği çelişki > bağ > etiket', () => {
  const l = [not('c', { govde:'[[!not:a|A]] #ahlak', klasor:'Felsefe' }),
    not('a', { govde:'[[not:c|C]] [[not:b|B]] [[not:yok|kopuk]] #ahlak', klasor:'Felsefe/Etik' }),
    not('b', { govde:'#ahlak', etiketler:['erdem'] }),
    not('d', { govde:'yalnız' })];
  const g1 = N.ag(l), g2 = N.ag(l.slice().reverse());
  assert.strictEqual(JSON.stringify(g1), JSON.stringify(g2));
  assert.deepStrictEqual(g1.kenar, [{ a:'a', b:'b', tur:'bag' }, { a:'a', b:'c', tur:'celiski' }, { a:'b', b:'c', tur:'etiket' }]);
  assert.deepStrictEqual(g1.dugum.map(d => [d.id, d.derece]), [['a', 2], ['b', 2], ['c', 2], ['d', 0]]);
  assert.deepStrictEqual(Object.keys(g1.dugum[0]).sort(), ['ad', 'alan', 'derece', 'id', 'klasor', 'ozel', 'tur']);
});
it('ağ: klasör süzgeci (alt klasör dahil), etiket kapalı, 2 adım çevre, bağsızları gizle', () => {
  const l = [not('a', { govde:'[[not:b|B]]', klasor:'Felsefe' }), not('b', { govde:'[[not:c|C]]', klasor:'Felsefe/Etik' }),
    not('c', { govde:'[[not:d|D]]' }), not('d', { govde:'#xy' }), not('e', { govde:'#xy' }), not('f', { govde:'tek' })];
  assert.deepStrictEqual(ids(N.ag(l, { klasor:'Felsefe' }).dugum), ['a', 'b']);
  assert.deepStrictEqual(ids(N.ag(l, { klasor:'' }).dugum), ['c', 'd', 'e', 'f']);
  assert.strictEqual(N.ag(l, { etiket:false }).kenar.filter(e => e.tur === 'etiket').length, 0);
  assert.deepStrictEqual(ids(N.ag(l, { merkez:'a', cevre:2 }).dugum), ['a', 'b', 'c']);
  assert.deepStrictEqual(ids(N.ag(l, { bagsizGizle:true }).dugum), ['a', 'b', 'c', 'd', 'e']);
});
it('ağ: 12\'den kalabalık etiket zincir olur (yumak değil); düşünce düğümü tür ve durum taşır', () => {
  const l = Array.from({ length:13 }, (_, i) => not('n' + String(i).padStart(2, '0'), { govde:'#gunluk' }));
  assert.strictEqual(N.ag(l).kenar.length, 12);
  const d = not('d1', { tur:'dusunce', ozellik:{ dusunce:'catisma', kesinlik:2, durum:'acik' } });
  const g = N.ag([d]).dugum[0];
  assert.strictEqual(g.dusunce, 'catisma');
  assert.strictEqual(g.durum, 'acik');
});

/* ------------------------------------------------------------- King */
it('King: özel notu ve kapalı klasörü okumaz; özel nota giden bağın adı silinir', () => {
  const l = [not('acik', { govde:'Bkz. [[not:gizli|Annemle kavga]] ve [[not:diger|Diğer]]' }),
    not('gizli', { baslik:'Annemle kavga', ozel:true }), not('diger'),
    not('saglik', { klasor:'Sağlık/Uyku' }), not('klasorsuz')];
  const k = N.kingOkur(l, { kapaliKlasorler:['Sağlık', ''] });
  assert.deepStrictEqual(ids(k), ['acik', 'diger', 'klasorsuz']);
  assert.strictEqual(k[0].govde, 'Bkz. «özel not» ve [[not:diger|Diğer]]');
  assert.ok(JSON.stringify(k).indexOf('Annemle') < 0);
  assert.strictEqual(l[0].govde.indexOf('Annemle') > 0, true, 'girdi değişmemeli');
  assert.deepStrictEqual(ids(N.kingOkur(l)), ['acik', 'diger', 'saglik', 'klasorsuz'], 'varsayılan: King okur (plan kararı)');
  assert.ok(N.ara(N.kingOkur(l), 'kavga').length === 0);
});
it('araç ve sisteme not: King okuma izni varsayılan kapalı; kapalı aracın notu ve özel not King yolundan hiç geçmez', () => {
  const a0 = N.yeniArac({ id:'a-dusunce', ad:'Düşünce defteri', olusturma:T0 });
  assert.deepStrictEqual([a0.klasor, a0.gorunum, a0.sistemNotu], ['Düşünce defteri', 'liste', { kingOkur:false, anlam:'', kullanim:'' }], 'güvenli varsayılan: King okumaz');
  const acik = N.yeniArac({ id:'a-okuma', ad:'Okuma', klasor:'Okuma', gorunum:'ag', olusturma:T0,
    sistemNotu:{ kingOkur:true, anlam:'Kitaplardan alıntılar.', kullanim:'Yalnız birbirine bağlamak için oku, hakkımda çıkarım yapma.' } });
  const ic = N.yeniArac({ id:'a-ic', ad:'İç', klasor:'Düşünce defteri/İç', olusturma:T0, sistemNotu:{ kingOkur:true } });
  const araclar = [a0, acik, ic];
  const l = [not('k1', { klasor:'Okuma', govde:'Bkz. [[not:d1|Gizli düşünce]] ve [[not:oz|Özel]]' }), not('d1', { baslik:'Gizli düşünce', klasor:'Düşünce defteri' }),
    not('d2', { klasor:'Düşünce defteri/İç' }), not('oz', { baslik:'Özel', klasor:'Okuma', ozel:true }), not('serbest')];
  const k = N.kingOkur(l, { araclar });
  assert.deepStrictEqual(ids(k), ['k1', 'serbest'], 'kapalı aracın notu (alt klasörü dahil, açık işaretli iç araç olsa da) ve özel not dışarıda');
  assert.strictEqual(k[0].govde, 'Bkz. «özel not» ve «özel not»', 'kapalı nota giden bağın adı da sızmaz');
  assert.ok(JSON.stringify(k).indexOf('Gizli') < 0 && JSON.stringify(k).indexOf('Özel') < 0);
  assert.strictEqual(N.ara(N.kingOkur(l, { araclar }), 'gizli').length, 0, 'King araması kapalı notu bulamaz');
  assert.deepStrictEqual(N.kingAraclar(araclar).map(a => [a.id, a.kullanim]), [['a-okuma', 'Yalnız birbirine bağlamak için oku, hakkımda çıkarım yapma.']],
    'King yalnız izinli aracın sistem notunu okur; kapalı aracın altındaki araç da kapalı');
  assert.deepStrictEqual(ids(N.kingOkur(l, { araclar:[Object.assign({}, a0, { sistemNotu:{ kingOkur:'evet', anlam:'', kullanim:'' } })] })), ['k1', 'serbest'], 'bozuk izin kapalı sayılır');
  assert.throws(() => N.yeniArac({ id:'x', ad:' ', olusturma:T0 }), /adı yazılmalı/);
  assert.throws(() => N.yeniArac({ id:'x', ad:'A', gorunum:'tablo', olusturma:T0 }), /Görünüm/);
  assert.throws(() => N.yeniArac({ id:'x', ad:'A', olusturma:T0, sistemNotu:{ kingOkur:true, anlam:'x'.repeat(1001), kullanim:'' } }), /1000/);
  assert.match(N.aracDogrula(Object.assign({}, acik, { gizli:1 })), /bilinmeyen alan/);
  assert.strictEqual(N.aracDogrula(acik), '');
});
it('King önerisi: sahibin onayı olmadan uygulanmaz; yasak alan, eski sürüm ve özel hedef reddedilir', () => {
  const l = [not('a', { govde:'eski metin', guncelleme:T0 + 1 }), not('o', { ozel:true })];
  const on = N.oneri({ id:'k1', tur:'degistir', hedef:'a', taban:T0 + 1, zaman:T0 + 2, alanlar:{ etiketler:['stoa'] }, gerekce:'Stoa ile ilgili' });
  assert.strictEqual(on.durum, 'bekliyor');
  assert.throws(() => N.oneriUygula(l, on), /onayı olmadan/);
  assert.throws(() => N.oneriUygula(l, on, { kim:'king', zaman:T0 + 3 }), /onayı olmadan/);
  const r = N.oneriUygula(l, on, { kim:'sahip', zaman:T0 + 3 });
  assert.deepStrictEqual(r.not.etiketler, ['stoa']);
  assert.strictEqual(r.oneri.durum, 'uygulandi');
  assert.deepStrictEqual(l[0].etiketler, [], 'girdi değişmemeli');
  assert.throws(() => N.oneriUygula(l, r.oneri, { kim:'sahip', zaman:T0 + 4 }), /bekleyen/);
  assert.throws(() => N.oneri({ id:'k2', tur:'degistir', hedef:'a', taban:T0, zaman:T0, alanlar:{ ozel:false } }), /öneremez/);
  const eski = N.oneri({ id:'k3', tur:'degistir', hedef:'a', taban:T0, zaman:T0, alanlar:{ govde:'x' } });
  assert.throws(() => N.oneriUygula(l, eski, { kim:'sahip', zaman:T0 + 5 }), /değişti/);
  const ozl = N.oneri({ id:'k4', tur:'degistir', hedef:'o', taban:T0, zaman:T0, alanlar:{ govde:'x' } });
  assert.throws(() => N.oneriUygula(l, ozl, { kim:'sahip', zaman:T0 + 5 }), /kapalı/);
  const y = N.oneriUygula(l, N.oneri({ id:'k5', tur:'yeni', hedef:'n-yeni', zaman:T0, alanlar:{ baslik:'King önerdi', govde:'…' } }), { kim:'sahip', zaman:T0 + 6 });
  assert.deepStrictEqual(y.not.kaynak, { yapi:'king', oneri:'k5' });
  assert.strictEqual(y.notlar.length, 3);
});

/* ------------------------------------------------------------- arama */
it('arama: Türkçe katlama (IŞIK = ışık, İstanbul = istanbul, çğşöü)', () => {
  const l = [not('a', { baslik:'Işık ve gölge', govde:'' }), not('b', { baslik:'İstanbul notları', govde:'Boğaz' }), not('c', { baslik:'Düz', govde:'çiğ süt öğütücü şişe' })];
  assert.deepStrictEqual(ids(N.ara(l, 'IŞIK')), ['a']);
  assert.deepStrictEqual(ids(N.ara(l, 'isik')), ['a']);
  assert.deepStrictEqual(ids(N.ara(l, 'ISTANBUL')), ['b']);
  assert.deepStrictEqual(ids(N.ara(l, 'istanbul boğaz')), ['b']);
  assert.deepStrictEqual(ids(N.ara(l, 'CIG SUT OGUTUCU SISE')), ['c']);
  assert.strictEqual(N.katla('IŞIK İçin ÇĞÖŞÜ âî'), 'isik icin cgosu ai');
});
it('arama: sıralama başlık > etiket > metin, VE anlamı, #etiket süzgeci, boş sorgu', () => {
  const l = [not('m', { baslik:'Günlük', govde:'erdem üzerine erdem' }), not('b', { baslik:'Erdem', govde:'' }),
    not('e', { baslik:'Ahlak', etiketler:['erdem'] }), not('s', { baslik:'Sabit', govde:'erdem', sabit:true })];
  assert.deepStrictEqual(ids(N.ara(l, 'erdem')), ['b', 'e', 'm', 's']);
  assert.deepStrictEqual(ids(N.ara(l, 'erdem ahlak')), ['e']);
  assert.deepStrictEqual(ids(N.ara(l, '#Erdem')), ['e']);
  assert.deepStrictEqual(N.ara(l, '   '), []);
  assert.ok(N.ara(l, 'üzerine')[0].parca.indexOf('üzerine') >= 0);
  assert.strictEqual(JSON.stringify(N.ara(l, 'erdem')), JSON.stringify(N.ara(l.slice().reverse(), 'erdem')));
});

/* ------------------------------------------------------------- göç */
const DEFTER_ESP = [
  { id:'n1a', baslik:'Stoacılık', govde:'Epiktetos: denetimimizde olan. #felsefe\n![[medya:k3x9a2]]', at:'2026-10-01T08:00:00.000Z', guncel:'2026-10-02T08:00:00.000Z', sabit:true, tur:'deneme', klasor:'Felsefe / Antik ' },
  { id:'n2b', baslik:'Uyku düzeni', govde:'İlk sürüm', at:'2026-10-03T08:00:00.000Z', guncel:'2026-10-03T08:00:00.000Z', sabit:false, tur:'not', klasor:'Sağlık/Uyku' },
  { id:'n3c', baslik:'uyku  düzeni', govde:'İkinci sürüm', at:'2026-10-04T08:00:00.000Z', guncel:'', sabit:false, tur:'garip', klasor:'' },
  { id:'n4d', baslik:'Okuma listesi', govde:'Bkz. [[Stoacılık]], [[Uyku düzeni]] ve [[Yok olan]].', at:'bozuk', guncel:'', sabit:false, tur:'not', klasor:'' },
];
it('göç defter: başlık bağı tek hedefse kimliğe döner, belirsiz ve kopuk raporlanır, medya kalır', () => {
  const { notlar, rapor } = N.goc.defter(DEFTER_ESP, { modul:'esp', zaman:GOC });
  hepsiGecerli(notlar);
  assert.deepStrictEqual(ids(notlar), ['esp/n1a', 'esp/n2b', 'esp/n3c', 'esp/n4d']);
  const ok = notlar[3];
  assert.strictEqual(ok.govde, 'Bkz. [[not:esp/n1a|Stoacılık]], [[Uyku düzeni]] ve [[Yok olan]].');
  assert.deepStrictEqual(rapor.belirsiz, [{ not:'esp/n4d', metin:'[[Uyku düzeni]]', adaylar:['esp/n2b', 'esp/n3c'] }]);
  assert.deepStrictEqual(rapor.kopuk, [{ not:'esp/n4d', metin:'[[Yok olan]]' }]);
  assert.ok(notlar[0].govde.indexOf('![[medya:k3x9a2]]') > 0);
  assert.strictEqual(notlar[0].klasor, 'Felsefe/Antik');
  assert.strictEqual(notlar[0].tur, 'deneme');
  assert.strictEqual(notlar[0].sabit, true);
  assert.strictEqual(notlar[0].olusturma, Date.parse('2026-10-01T08:00:00.000Z'));
  assert.strictEqual(notlar[2].tur, 'not');
  assert.strictEqual(ok.olusturma, GOC);
  assert.strictEqual(rapor.zamanYok, 1);
  assert.deepStrictEqual(N.etiketleri(notlar[0]), ['felsefe']);
  assert.ok(rapor.tasinamayan.length >= 2);
  assert.throws(() => N.goc.defter(DEFTER_ESP, { zaman:GOC }), /modül/);
  assert.throws(() => N.goc.defter(DEFTER_ESP, { modul:'esp' }), /Göç anı/);
});
it('göç defter sözlüğü: terim → tur terim, eş adlar özellikte, ekler medya gömmesi', () => {
  const { notlar, rapor } = N.goc.terim([{ id:'t1', ad:'Ataraksiya', es:['dinginlik'], tanim:'Ruhun sarsılmazlığı.', ekler:['m1abcd'], at:'2026-09-01T00:00:00.000Z', guncel:'2026-09-02T00:00:00.000Z' }], { modul:'esp', zaman:GOC });
  hepsiGecerli(notlar);
  assert.strictEqual(notlar[0].id, 'terim/esp/t1');
  assert.strictEqual(notlar[0].tur, 'terim');
  assert.deepStrictEqual(notlar[0].ozellik.es, ['dinginlik']);
  assert.strictEqual(notlar[0].govde, 'Ruhun sarsılmazlığı.\n![[medya:m1abcd]]');
  assert.ok(rapor.tasinamayan.length);
});
it('göç notum: bağlam notu → bağlamlı not', () => {
  const { notlar } = N.goc.notum([{ baglam:'konu:l-ses', metin:'Ünlü uyumu istisnaları', at:'2026-10-15T10:00:00.000Z' }, { baglam:'kavramlar', metin:'', at:'' }], { modul:'ays', zaman:GOC });
  hepsiGecerli(notlar);
  assert.deepStrictEqual(ids(notlar), ['notum/ays/konu:l-ses']);
  assert.deepStrictEqual(notlar[0].baglam, { modul:'ays', sayfa:'konu:l-ses' });
});
it('göç AYS konu notu: boş notlar atlanır, zaman yok raporlanır, konu adı çağırandan', () => {
  const doc = { subjectId:'tyt-tr', states:{ 'l-ses':{ state:'measured', first:80, firstAt:'2026-10-01', second:null, secondAt:null, note:'Ses olayları: düşme, türeme' }, 'l-yapi':{ state:'not_started', note:'' } } };
  const { notlar, rapor } = N.goc.aysKonu([doc], { zaman:GOC, konuAdi:(d, k) => k === 'l-ses' ? 'Ses bilgisi' : '' });
  hepsiGecerli(notlar);
  assert.deepStrictEqual(ids(notlar), ['ays-konu/tyt-tr/l-ses']);
  assert.strictEqual(notlar[0].baslik, 'Ses bilgisi');
  assert.deepStrictEqual(notlar[0].baglam, { modul:'ays', ders:'tyt-tr', konu:'l-ses' });
  assert.strictEqual(rapor.zamanYok, 1);
});
it('göç AYS video notu: parçalar ve döküm özellikte; izlenen dakika taşınmaz', () => {
  const v = { id:'v9', title:'Türev giriş', url:'https://www.youtube.com/watch?v=abc', provider:'youtube', videoId:'abc', subjectId:'ayt-mat', topicId:'turev',
    segments:[{ ts:95, text:'Limit tanımı', tag:'onemli' }], transcript:'…', watchedMin:42, done:true, source:'video', series:'', page:'', createdAt:'2026-10-05T10:00:00.000Z', updatedAt:'2026-10-06T10:00:00.000Z' };
  const { notlar, rapor } = N.goc.aysVideo([v], { zaman:GOC });
  hepsiGecerli(notlar);
  assert.strictEqual(notlar[0].tur, 'video');
  assert.deepStrictEqual(notlar[0].ozellik.parcalar, [{ ts:95, metin:'Limit tanımı', etiket:'onemli' }]);
  assert.ok(JSON.stringify(notlar[0]).indexOf('watchedMin') < 0 && JSON.stringify(notlar[0]).indexOf('42') < 0);
  assert.ok(/watchedMin/.test(rapor.tasinamayan.join(' ')));
});
it('göç ESP notu: links[].why bağın yanında kalır, kitap bağlamda, olmayan hedef kopuk', () => {
  const l = [{ id:'n1', text:'Erdem bilgidir.', bookId:'b7', concepts:['c-erdem'], links:[{ to:'n2', why:'Sokrates bağlamı' }, { to:'n9', why:'' }], createdAt:'2026-10-07T10:00:00.000Z' },
    { id:'n2', text:'Kimse bile bile kötülük yapmaz.', bookId:null, concepts:[], links:[], createdAt:'2026-10-07T11:00:00.000Z' }];
  const { notlar, rapor } = N.goc.espNot(l, { zaman:GOC, kavramAdi:c => c === 'c-erdem' ? 'Erdem' : '' });
  hepsiGecerli(notlar);
  assert.strictEqual(notlar[0].govde, 'Erdem bilgidir.\n\n→ [[not:esp-not/n2|Kimse bile bile kötülük yapmaz.]] — Sokrates bağlamı\n→ (bulunamayan not n9)');
  assert.deepStrictEqual(notlar[0].etiketler, ['erdem']);
  assert.deepStrictEqual(notlar[0].baglam, { modul:'esp', kayit:'books/b7' });
  assert.deepStrictEqual(rapor.kopuk, [{ not:'esp-not/n1', metin:'links → n9' }]);
  assert.strictEqual(N.ad(notlar[1]), 'Kimse bile bile kötülük yapmaz.');
  assert.deepStrictEqual(N.geriBaglar(notlar, 'esp-not/n2').map(x => x.id), ['esp-not/n1']);
});
it('göç ESP tezi: destek/itiraz/durum özellikte, durum Türkçe', () => {
  const a = { id:'a1', thesis:'Özgür irade bir yanılsamadır.', supports:['Libet deneyi'], objections:[{ id:'o1', text:'Deney kararı değil hazırlığı ölçer', answered:false, answer:'' }],
    sourceId:'b7', concepts:['c-irade'], status:'open', createdAt:'2026-10-08T10:00:00.000Z', updatedAt:'2026-10-09T10:00:00.000Z' };
  const { notlar } = N.goc.espTez([a], { zaman:GOC });
  hepsiGecerli(notlar);
  assert.strictEqual(notlar[0].baslik, 'Özgür irade bir yanılsamadır.');
  assert.deepStrictEqual(notlar[0].ozellik, { destek:['Libet deneyi'], itiraz:[{ id:'o1', metin:'Deney kararı değil hazırlığı ölçer', cevaplandi:false, cevap:'' }], durum:'acik' });
  assert.ok(N.ara(notlar, 'libet').length === 1, 'özellik metni aranır');
});
it('göç ESP taslağı: revizyon sayacı özellikte', () => {
  const { notlar } = N.goc.espTaslak([{ id:'d1', title:'Deneme: Zaman', text:'Zaman akar mı?', revisions:3, createdAt:'2026-10-10T10:00:00.000Z', updatedAt:'2026-10-11T10:00:00.000Z' }], { zaman:GOC });
  hepsiGecerli(notlar);
  assert.strictEqual(notlar[0].tur, 'taslak');
  assert.strictEqual(notlar[0].ozellik.revizyon, 3);
  assert.strictEqual(notlar[0].guncelleme, Date.parse('2026-10-11T10:00:00.000Z'));
});
it('göç öğrenme motoru notları: her cümle bir not, gün tarihi UTC, kaynak bağlantısı gövdede', () => {
  const n = { 'l-ses':{ kavram:[{ g:'2026-11-01', m:'Ünsüz yumuşaması: p, ç, t, k' }], kodlama:[{ g:'2026-11-02', m:'Fıstıkçı Şahap', k:'https://ornek.org/kodlama' }] } };
  const { notlar } = N.goc.ogren(n, { modul:'ays', zaman:GOC });
  hepsiGecerli(notlar);
  assert.deepStrictEqual(ids(notlar), ['ogren/ays/l-ses/kavram/0', 'ogren/ays/l-ses/kodlama/0']);
  assert.strictEqual(notlar[0].olusturma, Date.UTC(2026, 10, 1));
  assert.strictEqual(notlar[1].govde, 'Fıstıkçı Şahap\n\nhttps://ornek.org/kodlama');
});
const BILINC = { izin:true, dusunceler:[
  { id:'d1', baslik:'Özgürlük', metin:'[[Sorumluluk]] olmadan olmaz. [[!Kader]] ile çelişir. Bkz. [[not:esp/n1a|Stoacılık]]', konu:'Felsefe', etiket:['irade'], tur:'inanc', kesinlik:4, zaman:T0 - 1000, ozel:false,
    evrim:[{ zaman:T0 - 500, metin:'Eskiden [[Kader]] diyordum', kesinlik:2 }], sohbet:[{ kim:'king', metin:'Sartre?', zaman:T0 - 400, model:'yerel' }] },
  { id:'d2', baslik:'Sorumluluk', metin:'', konu:'Felsefe', etiket:['irade'], tur:'deger', kesinlik:5, zaman:T0 - 900, ozel:false, evrim:[], sohbet:[] },
  { id:'d3', baslik:'Kader', metin:'Annemle konuştuğumuz şey', konu:'', etiket:[], tur:'catisma', kesinlik:0, zaman:T0 - 800, ozel:true, evrim:[], sohbet:[],
    taraf:[{ ad:'Akıl', ister:'plan', korkar:'kaos' }, { ad:'Kalp', ister:'teslimiyet', korkar:'boşluk' }], durum:'acik' },
  { id:'d4', baslik:'Belirsiz', metin:'[[Tekrar]]', konu:'', etiket:[], tur:'soru', kesinlik:3, zaman:T0 - 700, ozel:false, evrim:[], sohbet:[] },
  { id:'d5', baslik:'Tekrar', metin:'a', konu:'', etiket:[], tur:'fikir', kesinlik:3, zaman:T0 - 600, ozel:false, evrim:[], sohbet:[] },
  { id:'d6', baslik:'tekrar', metin:'b', konu:'', etiket:[], tur:'fikir', kesinlik:3, zaman:T0 - 600, ozel:false, evrim:[], sohbet:[] },
] };
it('göç Bilinç: düşünce türü, çelişki bağı, özel, iç çatışma, evrim ve sohbet taşınır; konu → klasör', () => {
  const { notlar, rapor } = N.goc.bilinc(BILINC, { zaman:GOC });
  hepsiGecerli(notlar);
  const d1 = notlar[0], d3 = notlar[2];
  assert.strictEqual(d1.govde, '[[not:bilinc/d2|Sorumluluk]] olmadan olmaz. [[!not:bilinc/d3|Kader]] ile çelişir. Bkz. [[not:esp/n1a|Stoacılık]]');
  assert.strictEqual(d1.ozellik.evrim[0].metin, 'Eskiden [[not:bilinc/d3|Kader]] diyordum');
  assert.deepStrictEqual([d1.tur, d1.ozellik.dusunce, d1.ozellik.kesinlik, d1.klasor], ['dusunce', 'inanc', 4, 'Felsefe']);
  assert.strictEqual(d1.guncelleme, T0 - 500);
  assert.strictEqual(d1.ozellik.sohbet[0].metin, 'Sartre?');
  assert.deepStrictEqual([d3.ozel, d3.ozellik.durum, d3.ozellik.taraf[1].ad, d3.ozellik.kesinlik], [true, 'acik', 'Kalp', 1]);
  assert.deepStrictEqual(rapor.belirsiz, [{ not:'bilinc/d4', metin:'[[Tekrar]]', adaylar:['bilinc/d5', 'bilinc/d6'] }]);
  const g = N.ag(notlar);
  assert.deepStrictEqual(g.kenar.filter(e => e.a === 'bilinc/d1'), [{ a:'bilinc/d1', b:'bilinc/d2', tur:'bag' }, { a:'bilinc/d1', b:'bilinc/d3', tur:'celiski' }]);
  const k = N.kingOkur(notlar);
  assert.ok(ids(k).indexOf('bilinc/d3') < 0);
  assert.ok(JSON.stringify(k).indexOf('Kader') < 0, 'özel düşüncenin adı King\'e sızmamalı (evrim dahil)');
});
it('göç Bilinç: harita izni kapalıysa bütün düşünceler özel olur', () => {
  const { notlar } = N.goc.bilinc(Object.assign({}, BILINC, { izin:false }), { zaman:GOC });
  assert.ok(notlar.every(n => n.ozel));
  assert.deepStrictEqual(N.kingOkur(notlar), []);
});
it('göç: Bilinç\'in Defter atfı [[not:esp/ID|Ad]] göçten sonra da aynı nota çıkar (tek ağ)', () => {
  const l = N.goc.defter(DEFTER_ESP, { modul:'esp', zaman:GOC }).notlar.concat(N.goc.bilinc(BILINC, { zaman:GOC }).notlar);
  assert.deepStrictEqual(N.geriBaglar(l, 'esp/n1a').map(x => x.id), ['bilinc/d1', 'esp/n4d']);
  assert.ok(N.ag(l).kenar.some(e => e.a === 'bilinc/d1' && e.b === 'esp/n1a' && e.tur === 'bag'));
});
it('göç: her bağdaştırıcı raporu taşıyamadığını söyler; bozuk kayıt reddedilir, düşmez', () => {
  const r = N.goc.espTaslak([{ id:'d1', title:'', text:'' }, { id:'d2', title:'Var', text:'' }, { id:'d2', title:'Kopya', text:'' }], { zaman:GOC });
  assert.deepStrictEqual(ids(r.notlar), ['esp-taslak/d2']);
  assert.strictEqual(r.rapor.reddedilen.length, 2);
  ['defter', 'terim', 'notum', 'aysKonu', 'aysVideo', 'espNot', 'espTez', 'espTaslak', 'ogren', 'bilinc'].forEach(a => {
    const o = { zaman:GOC, modul:'esp' };
    const x = N.goc[a](a === 'bilinc' ? {} : a === 'ogren' ? {} : [], o);
    assert.ok(Array.isArray(x.rapor.tasinamayan) && x.rapor.tasinamayan.length, a);
  });
});
/* Modül boşlukları (faz1-modul-bosluklari.md): Kayıt/Plan gün bağdaştırıcılarının «Not motoru» dediği alanlar; gerçek biçim, uydurma metin. */
it('göç gün notu: AYS günü, SPİ vitals ve seansı, ESP günü ve seans notları; boş not yazılmaz; gün bağlamı ve kaynak yolu', () => {
  const ays = N.goc.gunNotu([{ id:'g1', date:'2026-11-02', note:'Yorgundum', blocks:[] }, { id:'g2', date:'2026-11-03', note:'  ' }], { modul:'ays', zaman:GOC });
  assert.deepStrictEqual(ids(ays.notlar), ['gun/ays/days/2026-11-02']);
  const n = ays.notlar[0];
  assert.deepStrictEqual([n.baslik, n.govde, n.olusturma, n.baglam, n.kaynak], ['Gün notu 2026-11-02', 'Yorgundum', Date.UTC(2026, 10, 2),
    { modul:'ays', gun:'2026-11-02' }, { yapi:'gun-notu', modul:'ays', yol:'days/2026-11-02' }]);
  const spi = N.goc.gunNotu([{ date:'2026-11-02', weight:70, water:0, note:'Baş ağrısı' }], { modul:'spi', zaman:GOC, koleksiyon:'vitals' });
  assert.deepStrictEqual(ids(spi.notlar), ['gun/spi/vitals/2026-11-02']);
  const seans = N.goc.gunNotu([{ id:'w1', date:'2026-11-02', kind:'cardio', minutes:30, note:'Dizim ağrıdı' }], { modul:'spi', zaman:GOC, koleksiyon:'workouts' });
  assert.deepStrictEqual([ids(seans.notlar), seans.notlar[0].baslik, seans.notlar[0].baglam.kayit], [['gun/spi/workouts/w1'], 'Seans notu 2026-11-02', 'workouts/w1']);
  const esp = N.goc.gunNotu([{ date:'2026-11-02', note:'İyi gün', updatedAt:'2026-11-02T20:00:00.000Z',
    sessions:[{ id:'s1', disc:'lang', minutes:30, note:'Fiiller' }, { id:'s2', disc:'math', note:'' }] }, { date:'2026-11-04', note:'', sessions:[{ id:'s3', note:'Yalnız seans' }] }], { modul:'esp', zaman:GOC });
  assert.deepStrictEqual(esp.notlar.map(x => x.govde), ['İyi gün\n\nlang: Fiiller', 'Yalnız seans']);
  assert.strictEqual(esp.notlar[0].guncelleme, Date.parse('2026-11-02T20:00:00.000Z'));
  assert.ok(esp.rapor.tasinamayan.length && !esp.rapor.reddedilen.length);
  assert.throws(() => N.goc.gunNotu([], { zaman:GOC }), /modül/);
});

/* ------------------------------------------------------------- saflık */
it('saflık: motor saati ve rastgeleyi kendisi okumaz; tarayıcıda LIFEOS.Motor.Not', () => {
  const kod = fs.readFileSync(path.join(__dirname, 'not.js'), 'utf8');
  assert.ok(!/Date\.now\(|Math\.random\(|new Date\(/.test(kod));
  assert.strictEqual(globalThis.LIFEOS.Motor.Not, N);
});

console.log((kirmizi ? '✕ ' : '✓ ') + (sayi - kirmizi) + '/' + sayi + ' test geçti');
process.exit(kirmizi ? 1 : 0);
