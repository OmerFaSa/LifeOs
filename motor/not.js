/* NOT MOTORU — tek not kaydı, tek bağ biçimi, tek ağ (sadeleşme Faz 3, 2026-11-13).

   Bugün on üç not benzeri yapı ve iki ayrı ağ çizimi var
   (belgeler/ekip/sadelesme/not-ve-tekrar.md §2, §3b). Bu dosya hepsinin yerine
   geçecek SAF katmandır: depo yok, ekran yok, saat yok. Zaman ve kimlik
   çağırandan gelir (motor saati ve rastgeleyi kendisi okumaz); aynı girdi
   aynı çıktıyı verir. Rapor: belgeler/ekip/sadelesme/faz3-not.md

   Sözler:
     1. TEK KAYIT. Her not aynı biçimdedir (KAYIT_ALANLARI); dogrula() kötü
        kaydı Türkçe bir cümleyle geri çevirir. Türe özgü birkaç alan
        `ozellik`te durur (düşünce türü, tez itirazları, video parçaları).
     2. BAĞ KİMLİKLE KURULUR. [[not:KİMLİK|Görünen ad]], çelişki
        [[!not:KİMLİK|Ad]]. Ad değişince bağ kopmaz; yenidenAdlandir() yalnız
        eski adı taşıyan görünen metinleri tazeler, kişinin yazdığı takma adı ezmez.
     3. TEK AĞ. ag() düğüm ve kenar verir, yerleşim vermez (çizim ekranın işi);
        sıra kimliğe göredir, girdi sırası sonucu değiştirmez.
     4. KING ÖZEL NOTU GÖRMEZ. kingOkur() özel notları ve kapalı klasörleri
        atar, okunabilir notta özel nota giden bağın adını da siler. King
        yazmaz, önerir: oneriUygula() sahibin onayı olmadan çalışmaz.
     5. GÖÇ TAHMİN ETMEZ. goc.* her eski yapıyı bu kayda çevirir, taşıyamadığını
        rapora yazar; başlıkla kurulmuş bağ tek hedefe çıkıyorsa kimliğe döner,
        birden çoksa «belirsiz» diye raporlanır, seçilmez.

   Test: node motor/not.test.js */
(function(kok){
  'use strict';

  /* defter.js:625'in altı türü + öbür yapılardan gelen beş tür. */
  const TURLER = Object.freeze(['not', 'belge', 'dosya', 'siir', 'deneme', 'kitap', 'dusunce', 'terim', 'video', 'tez', 'taslak']);
  const DEFTER_TURLERI = TURLER.slice(0, 6);
  const DUSUNCE_TURLERI = Object.freeze(['fikir', 'inanc', 'soru', 'karar', 'his', 'deger', 'ozellik', 'catisma']);   // bilinc.js:20
  const TEZ_DURUM = Object.freeze({ open:'acik', closed:'kapali', abandoned:'birakildi' });                             // ESP state.js:638
  const KAYIT_ALANLARI = Object.freeze(['id', 'baslik', 'govde', 'alan', 'etiketler', 'kaynak', 'olusturma', 'guncelleme',
    'ozel', 'tur', 'klasor', 'sabit', 'baglam', 'ozellik']);
  const ONERI_ALANLARI = Object.freeze(['baslik', 'govde', 'etiketler', 'klasor', 'alan', 'tur']);
  const SINIR = Object.freeze({ baslik:120, govde:60000, etiket:30, ad:120 });
  const KIMLIK_RE = /^[^\s|\[\]]{1,160}$/;
  const BAG_RE = /\[\[(!?)not:([^\s|\[\]]{1,160})(?:\|([^\[\]\n]{0,120}))?\]\]/g;
  const ESKI_BAG_RE = /\[\[(!?)([^\[\]|\n]{1,120})\]\]/g;                            // [[Başlık]], [[!Başlık]]
  const ETIKET_RE = /(^|\s)#([a-zçğıöşü0-9][a-zçğıöşü0-9_-]{1,30})/gi;               // defter.js:355 ile aynı
  const ONCELIK = { etiket:1, bag:2, celiski:3 };                                      // bilinc.js:107: çelişki bağı ezer, bağ etiketi

  /* ---------------------------------------------------------- yardımcılar */
  const sira = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const tek = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
  /* Türkçe küçük harf, ICU'ya bakmadan: I → ı, İ → i. */
  const kucuk = s => String(s == null ? '' : s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  /* Arama katlaması: büyük/küçük ve ç ğ ı ö ş ü (â î û) farkı yok. «IŞIK» = «ışık» = «isik». */
  const katla = s => kucuk(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  /* «  Sağlık / uyku/ » → «Sağlık/uyku»; defter.js:650 klasorAdi ile aynı. */
  const klasorAdi = k => String(k || '').split('/').map(x => x.replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean).slice(0, 3).join('/');
  const icinde = (n, k) => k == null ? true : k === '' ? !n.klasor : (n.klasor === k || n.klasor.indexOf(k + '/') === 0);   // defter.js:661
  const zamanMi = t => typeof t === 'number' && isFinite(t) && t >= 0 && Math.floor(t) === t;
  const derin = (x, f) => typeof x === 'string' ? f(x) : Array.isArray(x) ? x.map(y => derin(y, f))
    : x && typeof x === 'object' ? Object.keys(x).reduce((o, k) => { o[k] = derin(x[k], f); return o; }, {}) : x;
  const dizgiler = (x, haric) => typeof x === 'string' ? [x] : Array.isArray(x) ? [].concat(...x.map(y => dizgiler(y, haric)))
    : x && typeof x === 'object' ? [].concat(...Object.keys(x).filter(k => k !== haric).map(k => dizgiler(x[k], haric))) : [];
  const siralama = (a, b) => (b.sabit - a.sabit) || (b.guncelleme - a.guncelleme) || sira(a.id, b.id);

  /* Görünen ad: başlık, yoksa gövdenin ilk dolu satırı (md işaretleri ve bağ sözdizimi atılır). */
  function ad(n){
    if(n && tek(n.baslik, 1)) return tek(n.baslik, SINIR.ad);
    const s = String((n && n.govde) || '').split('\n')
      .map(x => x.replace(/\[\[!?not:[^|\]]*\|?/g, '').replace(/\]\]/g, '').replace(/^[#>*\-\s]+/, '').trim()).find(Boolean) || '';
    return s.slice(0, 60) || 'Adsız not';
  }

  /* ---------------------------------------------------------- kayıt */
  function dogrula(n){
    if(!n || typeof n !== 'object' || Array.isArray(n)) return 'Not bir nesne olmalı.';
    const fazla = Object.keys(n).filter(k => KAYIT_ALANLARI.indexOf(k) < 0);
    if(fazla.length) return 'Notta bilinmeyen alan var: «' + fazla[0] + '».';
    if(typeof n.id !== 'string' || !KIMLIK_RE.test(n.id)) return 'Notun kimliği yok ya da boşluk, «|», «[», «]» içeriyor.';
    if(typeof n.baslik !== 'string' || n.baslik.length > SINIR.baslik) return 'Başlık metin olmalı ve 120 karakteri geçmemeli.';
    if(typeof n.govde !== 'string' || n.govde.length > SINIR.govde) return 'Gövde metin olmalı ve 60000 karakteri geçmemeli.';
    if(!n.baslik.trim() && !n.govde.trim()) return 'Başlığı da gövdesi de boş not kaydedilmez.';
    if(TURLER.indexOf(n.tur) < 0) return 'Not türü bilinmiyor: «' + n.tur + '».';
    if(typeof n.alan !== 'string' || !/^[a-zçğıöşü0-9-]{0,40}$/.test(n.alan)) return 'Alan küçük harfli kısa bir ad olmalı (ör. «felsefe»); bilinmiyorsa boş kalır.';
    if(typeof n.klasor !== 'string' || n.klasor !== klasorAdi(n.klasor)) return 'Klasör «Sağlık/Uyku» biçiminde olmalı: en çok 3 kat, her kat en çok 40 karakter.';
    if(!Array.isArray(n.etiketler) || n.etiketler.some((e, i, l) => typeof e !== 'string' || !e.trim() || e.length > SINIR.etiket || /[\n#]/.test(e) || l.indexOf(e) !== i))
      return 'Etiketler tekrarsız, boş olmayan, «#» işaretsiz ve en çok 30 karakterlik metinler olmalı.';
    if(!n.kaynak || typeof n.kaynak !== 'object' || typeof n.kaynak.yapi !== 'string' || !n.kaynak.yapi) return 'Kaynak, en az «yapi» adını taşıyan bir nesne olmalı (ör. { yapi:"defter" }).';
    if(!zamanMi(n.olusturma) || !zamanMi(n.guncelleme) || n.guncelleme < n.olusturma) return 'Oluşturma ve güncelleme milisaniye cinsinden zaman olmalı; güncelleme oluşturmadan önce olamaz.';
    if(typeof n.ozel !== 'boolean' || typeof n.sabit !== 'boolean') return '«ozel» ve «sabit» evet/hayır (true/false) olmalı.';
    if(n.baglam != null && (typeof n.baglam !== 'object' || Object.keys(n.baglam).some(k => typeof n.baglam[k] !== 'string')))
      return 'Bağlam yoksa boş, varsa yalnız metin alanları olan bir nesne olmalı (ör. { ders:"mat", konu:"l-ses" }).';
    const o = n.ozellik;
    if(!o || typeof o !== 'object' || Array.isArray(o)) return 'Özellik alanı bir nesne olmalı (yoksa {}).';
    if(n.tur === 'dusunce' && DUSUNCE_TURLERI.indexOf(o.dusunce) < 0) return 'Düşünce türü bilinmiyor: «' + o.dusunce + '».';
    if(n.tur === 'dusunce' && !(Number.isInteger(o.kesinlik) && o.kesinlik >= 1 && o.kesinlik <= 5)) return 'Kesinlik 1 ile 5 arasında tam sayı olmalı.';
    if(n.tur === 'tez' && ['acik', 'kapali', 'birakildi'].indexOf(o.durum) < 0) return 'Tezin durumu «acik», «kapali» ya da «birakildi» olmalı.';
    if(n.tur === 'video' && typeof o.url !== 'string') return 'Video notunun bağlantısı (url) metin olmalı.';
    return '';
  }

  /* Eksik alanları doldurur, doğrular; kimlik ve oluşturma zamanı çağırandan gelir. */
  function yeni(o){
    const n = Object.assign({ baslik:'', govde:'', alan:'', etiketler:[], kaynak:{ yapi:'not' }, ozel:false, tur:'not', klasor:'',
      sabit:false, baglam:null, ozellik:{} }, o);
    if(n.guncelleme == null) n.guncelleme = n.olusturma;
    const h = dogrula(n);
    if(h) throw new Error(h);
    return n;
  }

  /* ---------------------------------------------------------- bağlar */
  /* Gövdedeki kimlik bağları, sırasıyla; görünür çizim yok. */
  function baglar(govde){
    return Array.from(String(govde || '').matchAll(BAG_RE), m => ({ id:m[2], ad:m[3] == null ? '' : m[3].trim(), celiski:m[1] === '!',
      bas:m.index, son:m.index + m[0].length }));
  }
  const adTemiz = s => tek(s, SINIR.ad).replace(/[\[\]|]/g, ' ').replace(/\s+/g, ' ').trim();
  const bagYaz = (id, gorunen, celiski) => '[[' + (celiski ? '!' : '') + 'not:' + id + (adTemiz(gorunen) ? '|' + adTemiz(gorunen) : '') + ']]';
  /* f(bag) yeni metin döndürürse bağ onunla değişir; null dönerse olduğu gibi kalır. */
  const baglariDegistir = (s, f) => String(s || '').replace(BAG_RE, (tam, c, id, a) => {
    const y = f({ id, ad:a == null ? '' : a.trim(), celiski:c === '!' });
    return y == null ? tam : y;
  });
  const govdeEtiketleri = g => Array.from(String(g || '').matchAll(ETIKET_RE), m => kucuk(m[2]));
  /* Kayıttaki etiketler + gövdedeki #etiketler (defter.js bugün yalnız gövdeden türetiyor). */
  const etiketleri = n => Array.from(new Set((n.etiketler || []).map(kucuk).concat(govdeEtiketleri(n.govde)))).sort();

  /* Bu nota bağ verenler («Bu nota bağlananlar»), kimlik sırasıyla. */
  function geriBaglar(notlar, id){
    return (notlar || []).filter(n => n.id !== id).map(n => {
      const b = baglar(n.govde).filter(x => x.id === id);
      return b.length ? { id:n.id, ad:ad(n), celiski:b.some(x => x.celiski) } : null;
    }).filter(Boolean).sort((a, b) => sira(a.id, b.id));
  }

  /* Yeniden adlandır: bağ kimlikle durduğu için kopmaz. Görünen metni eski ada
     eşit olan bağlar yeni adı alır; kişinin yazdığı takma ad (ör. «şu fikir») kalır. */
  function yenidenAdlandir(notlar, id, baslik, zaman){
    const hedef = (notlar || []).find(n => n.id === id);
    if(!hedef) throw new Error('Yeniden adlandırılacak not yok: «' + id + '».');
    if(!zamanMi(zaman)) throw new Error('Yeniden adlandırma zamanı (ms) verilmeli.');
    const yeniBaslik = tek(baslik, 1000);
    if(yeniBaslik.length > SINIR.baslik) throw new Error('Başlık 120 karakteri geçmemeli.');
    const eski = katla(ad(hedef)), gorunen = ad(Object.assign({}, hedef, { baslik:yeniBaslik })), degisen = [];
    const sonuc = notlar.map(n => {
      let y = n.id === id ? Object.assign({}, n, { baslik:yeniBaslik }) : n;
      const g = baglariDegistir(y.govde, b => b.id === id && b.ad && katla(b.ad) === eski && b.ad !== adTemiz(gorunen) ? bagYaz(id, gorunen, b.celiski) : null);
      if(g !== y.govde) y = Object.assign({}, y, { govde:g });
      if(y !== n){ y.guncelleme = Math.max(zaman, n.guncelleme); degisen.push(n.id); }
      return y;
    });
    if(!hedef.govde.trim() && !yeniBaslik) throw new Error('Başlığı da gövdesi de boş not kaydedilmez.');
    return { notlar:sonuc, degisen:degisen.sort(sira) };
  }

  /* ---------------------------------------------------------- ağ */
  /* Tek ağ: defter.js agVeri (:688) ve bilinc.js ag (:103) ihtiyaçlarının birleşimi.
     o: { klasor?, etiket (varsayılan açık), merkez?, cevre (adım; defter 2 kullanır), bagsizGizle? } */
  function ag(notlar, o){
    o = o || {};
    const l = (notlar || []).filter(n => icinde(n, o.klasor)).sort((a, b) => sira(a.id, b.id));
    const var_ = new Set(l.map(n => n.id)), kenar = new Map();
    const ekle = (a, b, tur) => {
      if(a === b) return;
      const x = a < b ? a : b, y = a < b ? b : a, k = x + '\n' + y, e = kenar.get(k);
      if(!e) kenar.set(k, { a:x, b:y, tur });
      else if(ONCELIK[tur] > ONCELIK[e.tur]) e.tur = tur;
    };
    l.forEach(n => baglar(n.govde).forEach(b => { if(var_.has(b.id)) ekle(n.id, b.id, b.celiski ? 'celiski' : 'bag'); }));
    if(o.etiket !== false){
      const et = new Map();
      l.forEach(n => etiketleri(n).forEach(t => { if(!et.has(t)) et.set(t, []); et.get(t).push(n.id); }));
      /* 12'den kalabalık etiket yumak yapar: zincir olarak bağlanır (defter.js:700; bilinc.js bunları atıyordu). */
      et.forEach(ids => {
        if(ids.length > 12){ for(let i = 1; i < ids.length; i++) ekle(ids[i - 1], ids[i], 'etiket'); return; }
        for(let i = 0; i < ids.length; i++) for(let j = i + 1; j < ids.length; j++) ekle(ids[i], ids[j], 'etiket');
      });
    }
    const kl = Array.from(kenar.values()).sort((x, y) => sira(x.a, y.a) || sira(x.b, y.b)), der = {};
    kl.forEach(e => { der[e.a] = (der[e.a] || 0) + 1; der[e.b] = (der[e.b] || 0) + 1; });
    let dugum = l.map(n => {
      const d = { id:n.id, ad:ad(n), tur:n.tur, klasor:n.klasor, alan:n.alan, ozel:n.ozel, derece:der[n.id] || 0 };
      if(n.tur === 'dusunce'){ d.dusunce = n.ozellik.dusunce; if(n.ozellik.durum) d.durum = n.ozellik.durum; }
      return d;
    });
    if(o.merkez && o.cevre > 0){
      const kom = new Map(), ic = new Set([o.merkez]);
      kl.forEach(e => { (kom.get(e.a) || kom.set(e.a, []).get(e.a)).push(e.b); (kom.get(e.b) || kom.set(e.b, []).get(e.b)).push(e.a); });
      let sinir = [o.merkez];
      for(let adim = 0; adim < o.cevre; adim++){ const s = []; sinir.forEach(x => (kom.get(x) || []).forEach(y => { if(!ic.has(y)){ ic.add(y); s.push(y); } })); sinir = s; }
      dugum = dugum.filter(d => ic.has(d.id));
    }
    if(o.bagsizGizle) dugum = dugum.filter(d => d.derece > 0 || d.id === o.merkez);
    const kalan = new Set(dugum.map(d => d.id));
    return { dugum, kenar:kl.filter(e => kalan.has(e.a) && kalan.has(e.b)) };
  }

  /* ---------------------------------------------------------- King */
  /* King bu notu okuyabilir mi: özel değil ve kapalı bir klasörde (ya da altında) değil. */
  function kingIzin(n, o){
    if(!n || n.ozel) return false;
    const kapali = ((o && o.kapaliKlasorler) || []).map(klasorAdi).filter(Boolean);
    return !kapali.some(k => icinde(n, k));
  }
  /* King'e gidecek notlar: izinliler, kopya olarak; izinsiz nota giden bağın adı silinir (başlık sızmasın). */
  function kingOkur(notlar, o){
    const l = notlar || [], gizli = new Set(l.filter(n => !kingIzin(n, o)).map(n => n.id));
    const sil = s => baglariDegistir(s, b => gizli.has(b.id) ? '«özel not»' : null);
    return l.filter(n => kingIzin(n, o)).map(n => Object.assign({}, n, { govde:sil(n.govde), ozellik:derin(n.ozellik, sil) }));
  }
  /* King'in önerisi: bir kayıt, uygulama değil. hedef = değişecek notun kimliği
     ya da yeni notun alacağı kimlik; taban = King'in okuduğu sürümün güncelleme zamanı. */
  function oneri(o){
    o = o || {};
    if(o.tur !== 'yeni' && o.tur !== 'degistir') throw new Error('Öneri türü «yeni» ya da «degistir» olmalı.');
    if(typeof o.id !== 'string' || !KIMLIK_RE.test(o.id)) throw new Error('Önerinin kimliği eksik.');
    if(typeof o.hedef !== 'string' || !KIMLIK_RE.test(o.hedef)) throw new Error('Öneri hangi nota dokunacağını (hedef kimliği) söylemeli.');
    if(!zamanMi(o.zaman)) throw new Error('Önerinin zamanı (ms) verilmeli.');
    const alanlar = o.alanlar || {}, yasak = Object.keys(alanlar).filter(k => ONERI_ALANLARI.indexOf(k) < 0);
    if(yasak.length) throw new Error('King «' + yasak[0] + '» alanını değiştirmeyi öneremez; yalnız başlık, gövde, etiketler, klasör, alan ve tür.');
    if(!Object.keys(alanlar).length) throw new Error('Öneri boş: değişecek bir şey yok.');
    if(o.tur === 'degistir' && !zamanMi(o.taban)) throw new Error('Değiştirme önerisi, King\'in okuduğu sürümün güncelleme zamanını (taban) taşımalı.');
    return { id:o.id, tur:o.tur, hedef:o.hedef, taban:o.tur === 'degistir' ? o.taban : null, alanlar:JSON.parse(JSON.stringify(alanlar)),
      gerekce:tek(o.gerekce, 400), kim:'king', durum:'bekliyor', olusturma:o.zaman };
  }
  /* Yalnız sahibin onayıyla: onay = { kim:'sahip', zaman }. Girdi dizisi değişmez, yenisi döner. */
  function oneriUygula(notlar, on, onay){
    if(!onay || onay.kim !== 'sahip' || !zamanMi(onay.zaman)) throw new Error('King\'in önerisi sahibinin onayı olmadan uygulanmaz.');
    if(!on || on.kim !== 'king' || on.durum !== 'bekliyor') throw new Error('Bu öneri bekleyen bir King önerisi değil.');
    const l = notlar || [];
    let not;
    if(on.tur === 'yeni'){
      if(l.some(n => n.id === on.hedef)) throw new Error('Bu kimlikle bir not zaten var: «' + on.hedef + '».');
      not = yeni(Object.assign({}, on.alanlar, { id:on.hedef, olusturma:onay.zaman, kaynak:{ yapi:'king', oneri:on.id } }));
    }else{
      const eski = l.find(n => n.id === on.hedef);
      if(!eski || eski.ozel) throw new Error('Önerinin hedef notu yok ya da King\'e kapalı.');
      if(eski.guncelleme !== on.taban) throw new Error('Not, öneri yazıldıktan sonra değişti; öneri yeni sürüme göre yeniden yazılmalı.');
      not = Object.assign({}, eski, JSON.parse(JSON.stringify(on.alanlar)), { guncelleme:Math.max(onay.zaman, eski.guncelleme) });
      const h = dogrula(not);
      if(h) throw new Error(h);
    }
    return { notlar:on.tur === 'yeni' ? l.concat([not]) : l.map(n => n.id === not.id ? not : n), not,
      oneri:Object.assign({}, on, { durum:'uygulandi', onay:{ kim:'sahip', zaman:onay.zaman } }) };
  }

  /* ---------------------------------------------------------- arama */
  const say = (s, k) => { let c = 0, i = s.indexOf(k); while(i >= 0 && c < 5){ c++; i = s.indexOf(k, i + k.length); } return c; };
  const kelimeBasi = (s, k) => { const i = s.indexOf(k); return i === 0 || /[^\p{L}\p{N}]/u.test(s.charAt(i - 1)); };
  /* Gövdede ilk eşleşmenin çevresi; katlama harf sayısını çoğu zaman korur, kaymada yaklaşık kalır. */
  function parca(govde, kelimeler){
    const g = String(govde || ''), k = katla(g), i = Math.min(...kelimeler.map(w => { const j = k.indexOf(w); return j < 0 ? Infinity : j; }));
    if(!isFinite(i)) return '';
    const bas = Math.max(0, i - 40);
    return (bas ? '…' : '') + tek(g.slice(bas, i + 100), 160) + (i + 100 < g.length ? '…' : '');
  }
  /* Saf arama: her kelime başlıkta, etikette ya da metinde geçmeli (VE). Puan: başlık 10
     (+5 kelime başı), etiket 6, metin geçiş başına 1 (en çok 5); tam başlık +30. «#etiket» süzer.
     King'in sohbet geçmişi aranmaz (kişinin yazısı değil). */
  function ara(notlar, sorgu, o){
    const q = katla(tek(sorgu, 200)), sinir = (o && o.sinir) || 20, l = notlar || [];
    if(!q) return [];
    const sonuc = x => ({ id:x.n.id, ad:ad(x.n), puan:x.puan, parca:x.parca });
    if(q.charAt(0) === '#'){
      const t = q.slice(1);
      return l.filter(n => etiketleri(n).some(e => katla(e) === t)).sort(siralama).slice(0, sinir).map(n => sonuc({ n, puan:1, parca:'' }));
    }
    const kelimeler = q.split(/[^\p{L}\p{N}]+/u).filter(Boolean), out = [];
    if(!kelimeler.length) return [];
    l.forEach(n => {
      const b = katla(ad(n)), e = etiketleri(n).map(katla), g = katla([n.govde].concat(dizgiler(n.ozellik, 'sohbet')).join('\n'));
      let puan = 0;
      for(const k of kelimeler){
        const bv = b.indexOf(k) >= 0, ev = e.some(x => x.indexOf(k) >= 0), gs = say(g, k);
        if(!bv && !ev && !gs) return;
        puan += (bv ? 10 + (kelimeBasi(b, k) ? 5 : 0) : 0) + (ev ? 6 : 0) + gs;
      }
      if(b === q) puan += 30;
      out.push({ n, puan, parca:parca(n.govde, kelimeler) });
    });
    return out.sort((x, y) => y.puan - x.puan || siralama(x.n, y.n)).slice(0, sinir).map(sonuc);
  }

  /* ---------------------------------------------------------- göç */
  /* ISO metin ya da ms → ms; okunamazsa yedek (göç anı) ve «yok» işareti. */
  function zamanOku(v, yedek){
    const t = typeof v === 'number' ? v : Date.parse(String(v || ''));
    return isFinite(t) && t >= 0 ? { t:Math.floor(t), yok:false } : { t:yedek, yok:true };
  }
  function gocAyar(o, yapi, modulGerek){
    o = o || {};
    if(!zamanMi(o.zaman)) throw new Error('Göç anı (zaman, ms) verilmeli; motor saati kendisi okumaz.');
    if(modulGerek && !/^(ays|spi|esp)$/.test(o.modul || '')) throw new Error(yapi + ' göçü hangi modülden olduğunu (modul: ays, spi ya da esp) bilmeli.');
    return { zaman:o.zaman, modul:o.modul || '', alan:o.alan || '', konuAdi:o.konuAdi, kavramAdi:o.kavramAdi };
  }
  const rapor = (yapi, tasinamayan) => ({ yapi, sayi:0, tasinamayan, belirsiz:[], kopuk:[], reddedilen:[], zamanYok:0 });
  function koy(r, liste, o){
    if(liste.some(n => n.id === o.id)){ r.reddedilen.push({ id:o.id, neden:'Aynı kimlik ikinci kez geldi; ilki alındı.' }); return; }
    try{ liste.push(yeni(o)); r.sayi++; }catch(e){ r.reddedilen.push({ id:o.id, neden:e.message }); }
  }
  const sonuc = (r, notlar) => ({ notlar, rapor:r });
  const kimlikParca = s => String(s == null ? '' : s).replace(/[\s|\[\]]+/g, '-').slice(0, 60) || '-';
  const etiketTemiz = l => Array.from(new Set((Array.isArray(l) ? l : []).map(e => tek(kucuk(e).replace(/^#+/, ''), SINIR.etiket)).filter(Boolean)));
  /* Küçük harf + boşluk birleştirme: defter.js:358 ve bilinc.js:52 eşleşmesinin ortak hâli. */
  const adAnahtari = s => tek(kucuk(s), 200);
  function adHaritasi(liste, kim, baslikOf){
    const m = new Map();
    liste.forEach(x => { const k = adAnahtari(baslikOf(x)); if(!k) return; if(!m.has(k)) m.set(k, []); m.get(k).push(kim(x)); });
    m.forEach(l => l.sort(sira));
    return m;
  }
  /* [[Başlık]] → [[not:KİMLİK|Başlık]] yalnız tek aday varsa; çok aday «belirsiz», hiç yoksa «kopuk»
     raporlanır ve metin olduğu gibi kalır. celiskiVar: [[!Başlık]] çelişki (Bilinç); Defter'de «!» başlığın parçası. */
  function basliktanBagla(govde, adaylar, notId, r, celiskiVar){
    return String(govde || '').replace(ESKI_BAG_RE, (tam, c, metin) => {
      if(/^(medya|not):/i.test(metin)) return tam;                     // ![[medya:…]] gömme, bağ değil
      const baslik = celiskiVar ? metin : c + metin, l = adaylar.get(adAnahtari(baslik)) || [];
      if(l.length === 1) return bagYaz(l[0], baslik.trim(), celiskiVar && c === '!');
      if(l.length) r.belirsiz.push({ not:notId, metin:tam, adaylar:l.slice() });
      else r.kopuk.push({ not:notId, metin:tam });
      return tam;
    });
  }
  const MEDYA = 'Medya dosyaları (IndexedDB «lifeos-defter-<modül>», yalnız o cihaz): ![[medya:KİMLİK]] başvurusu gövdede kalır, dosyanın kendisi bu kayda girmez.';

  const goc = {
    /* Defter notu, modül başına (defter.js:607 yukle, :628 yeni): { id, baslik, govde, at, guncel, sabit, tur, klasor }; at/guncel ISO. */
    defter(liste, o){
      const g = gocAyar(o, 'Defter', true), out = [], l = (liste || []).filter(x => x && x.id);
      const r = rapor('defter', [MEDYA,
        'Boş klasör listesi (defterklasor/liste) not değil; bu bağdaştırıcı almaz, klasör ağacı notların klasor alanından yeniden çıkar.',
        'Başlık bağı yalnız aynı modülün notlarında aranır (bugünkü davranış: defter.js:691 modülün kendi listesine bakar).']);
      const kim = x => g.modul + '/' + x.id;   // bilinc.js:291 atıfı [[not:esp/ID|Ad]] böylece değişmeden çalışır
      const adlar = adHaritasi(l, kim, x => x.baslik);
      l.forEach(x => {
        const id = kim(x), ol = zamanOku(x.at, g.zaman), gu = zamanOku(x.guncel, ol.t);
        if(ol.yok) r.zamanYok++;
        koy(r, out, { id, baslik:tek(x.baslik, SINIR.baslik), govde:basliktanBagla(x.govde, adlar, id, r, false).slice(0, SINIR.govde),
          alan:g.alan, kaynak:{ yapi:'defter', modul:g.modul, yol:'defter/' + x.id }, olusturma:ol.t, guncelleme:Math.max(gu.t, ol.t),
          tur:DEFTER_TURLERI.indexOf(x.tur) >= 0 ? x.tur : 'not', klasor:klasorAdi(x.klasor), sabit:!!x.sabit });
      });
      return sonuc(r, out);
    },
    /* Defter sözlüğü (defter.js:383 terimTemiz): { id, ad, es[], tanim, ekler[], at, guncel }. */
    terim(liste, o){
      const g = gocAyar(o, 'Sözlük', true), out = [];
      const r = rapor('terim', [MEDYA,
        'Aynı terim birden çok modülde varsa «bu modülün terimi kazanır» önceliği (defter.js:388) kayıtta yok: iki ayrı not olur.']);
      (liste || []).filter(x => x && x.id).forEach(x => {
        const ol = zamanOku(x.at, g.zaman), gu = zamanOku(x.guncel, ol.t);
        if(ol.yok) r.zamanYok++;
        const ekler = (Array.isArray(x.ekler) ? x.ekler : []).map(e => '![[medya:' + e + ']]');
        koy(r, out, { id:'terim/' + g.modul + '/' + x.id, baslik:tek(x.ad, SINIR.baslik), govde:[String(x.tanim || '')].concat(ekler).join('\n').trim(),
          alan:g.alan, kaynak:{ yapi:'defterterim', modul:g.modul, yol:'defterterim/' + x.id }, olusturma:ol.t, guncelleme:Math.max(gu.t, ol.t),
          tur:'terim', ozellik:{ es:(Array.isArray(x.es) ? x.es : []).map(e => tek(e, 60)).filter(Boolean) } });
      });
      return sonuc(r, out);
    },
    /* Notum, bağlam notu (notum.js:63): notum/<bağlam> = { baglam, metin, at }. */
    notum(liste, o){
      const g = gocAyar(o, 'Notum', true), out = [];
      const r = rapor('notum', ['«Bağlam başına tek not» kuralı kayıtta değil: aynı bağlamın notu, baglam alanına bakan bir sorguyla bulunur.',
        'Modül kendi alanına yazdıysa (ayar.kaynak; AYS konu notu) metin burada değildir: goc.aysKonu taşır.']);
      (liste || []).filter(x => x && x.baglam != null && tek(x.metin, 1)).forEach(x => {
        const ol = zamanOku(x.at, g.zaman);
        if(ol.yok) r.zamanYok++;
        koy(r, out, { id:'notum/' + g.modul + '/' + kimlikParca(x.baglam), baslik:tek(x.baglam, SINIR.baslik), govde:String(x.metin || ''), alan:g.alan,
          kaynak:{ yapi:'notum', modul:g.modul, yol:'notum/' + String(x.baglam) }, olusturma:ol.t, baglam:{ modul:g.modul, sayfa:String(x.baglam) } });
      });
      return sonuc(r, out);
    },
    /* AYS konu notu (state.js:457): topics/<ders> = { subjectId, states:{ [konu]: { …, note } } }. */
    aysKonu(belgeler, o){
      const g = gocAyar(o, 'AYS konu notu', false), out = [];
      const r = rapor('ays-konu', ['Notun yazılma zamanı konu durumunda yok (firstAt/secondAt ölçüm zamanıdır): göç anı yazılır.',
        'Konu adı konu durumunda yok (data/subjects.js); çağıran konuAdi(ders, konu) verirse başlık olur, vermezse konu kimliği.',
        'Konu durumu, ölçümler (first/second) ve kapanış kuralı not değildir: Kayıt/Plan motorunda kalır.']);
      (belgeler || []).filter(x => x && x.subjectId && x.states).forEach(b => Object.keys(b.states).sort(sira).forEach(k => {
        const metin = String((b.states[k] || {}).note || '');
        if(!metin.trim()) return;
        r.zamanYok++;
        koy(r, out, { id:'ays-konu/' + kimlikParca(b.subjectId) + '/' + kimlikParca(k), baslik:tek((g.konuAdi && g.konuAdi(b.subjectId, k)) || k, SINIR.baslik),
          govde:metin, alan:g.alan, kaynak:{ yapi:'ays-konu', modul:'ays', yol:'topics/' + b.subjectId + '#' + k }, olusturma:g.zaman,
          baglam:{ modul:'ays', ders:String(b.subjectId), konu:String(k) } });
      }));
      return sonuc(r, out);
    },
    /* Gün ve seans notu: Kayıt/Plan gün bağdaştırıcılarının «Not motoru» dediği alan. AYS days/<gün>.note (state.js:414),
       SPİ vitals/<gün>.note (state.js:612), SPİ workouts/<id>.note (state.js:694), ESP days/<gün>.note ve sessions[].note
       (ESP state.js:359-395). o.koleksiyon kaynak yolunu verir: days (varsayılan), vitals, workouts. */
    gunNotu(liste, o){
      const g = gocAyar(o, 'Gün notu', true), out = [], kol = String((o && o.koleksiyon) || 'days'), seans = kol === 'workouts';
      const r = rapor('gun-notu', ['Notun yazılma anı gün kaydında yok: günün başı (UTC 00:00) yazılır; ESP günü güncelleme anını (updatedAt) taşır.',
        'ESP seans notu ayrı not olmaz: günün notuna seansın disipliniyle (disc) eklenir.']);
      (liste || []).filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.date || '')).forEach(x => {
        const govde = [String(x.note || '')].concat((Array.isArray(x.sessions) ? x.sessions : []).filter(s => s && String(s.note || '').trim())
          .map(s => (s.disc ? s.disc + ': ' : '') + s.note)).map(s => s.trim()).filter(Boolean).join('\n\n');
        if(!govde) return;
        const anahtar = seans ? String(x.id) : x.date, gun = Date.UTC(+x.date.slice(0, 4), +x.date.slice(5, 7) - 1, +x.date.slice(8, 10));
        koy(r, out, { id:'gun/' + g.modul + '/' + kol + '/' + kimlikParca(anahtar), baslik:(seans ? 'Seans notu ' : 'Gün notu ') + x.date, govde, alan:g.alan,
          kaynak:{ yapi:'gun-notu', modul:g.modul, yol:kol + '/' + anahtar }, olusturma:gun, guncelleme:Math.max(zamanOku(x.updatedAt, gun).t, gun),
          baglam:Object.assign({ modul:g.modul, gun:x.date }, seans ? { kayit:'workouts/' + anahtar } : {}) });
      });
      return sonuc(r, out);
    },
    /* AYS video notu (state.js:749 newVideoNote): segments [{ ts, text, tag }] (screens/learn.js:586). */
    aysVideo(liste, o){
      const g = gocAyar(o, 'AYS video notu', false), out = [];
      const r = rapor('ays-video', ['İzlenen dakika (watchedMin), bitti (done) ve source ölçümdür: Kayıt motoruna gider, nota girmez.']);
      (liste || []).filter(x => x && x.id).forEach(x => {
        const ol = zamanOku(x.createdAt, g.zaman), gu = zamanOku(x.updatedAt, ol.t), bg = { modul:'ays' };
        if(ol.yok) r.zamanYok++;
        if(x.subjectId) bg.ders = String(x.subjectId);
        if(x.topicId) bg.konu = String(x.topicId);
        koy(r, out, { id:'ays-video/' + x.id, baslik:tek(x.title || x.url, SINIR.baslik), alan:g.alan, kaynak:{ yapi:'ays-video', modul:'ays', yol:'videoNotes/' + x.id },
          olusturma:ol.t, guncelleme:Math.max(gu.t, ol.t), tur:'video', baglam:bg,
          ozellik:{ url:String(x.url || ''), saglayici:String(x.provider || ''), videoId:x.videoId == null ? '' : String(x.videoId),
            parcalar:(Array.isArray(x.segments) ? x.segments : []).map(s => ({ ts:Number(s.ts) || 0, metin:String(s.text || ''), etiket:String(s.tag || 'not') })),
            dokum:String(x.transcript || ''), seri:String(x.series || ''), sayfa:String(x.page || '') } });
      });
      return sonuc(r, out);
    },
    /* ESP «Not ve kitap» notu (state.js:679 newNote): { id, text, bookId, concepts[], links[{ to, why }], createdAt }. */
    espNot(liste, o){
      const g = gocAyar(o, 'ESP notu', false), out = [], l = (liste || []).filter(x => x && x.id);
      const r = rapor('esp-not', ['Bağ açıklaması (links[].why) ayrı alan değil: gövdede bağın yanına « — açıklama» olarak yazılır; ağ kenarı açıklama taşımaz.',
        'Güncelleme zamanı kaydedilmiyordu (yalnız createdAt): güncelleme = oluşturma.',
        'concepts kavram kimlikleridir (ESP.CONCEPT_BY_ID); çağıran kavramAdi(id) verirse etiket adı olur, vermezse kimlik.']);
      const metni = new Map(l.map(x => [x.id, String(x.text || '')]));
      l.forEach(x => {
        const id = 'esp-not/' + x.id, ol = zamanOku(x.createdAt, g.zaman);
        if(ol.yok) r.zamanYok++;
        const satirlar = (Array.isArray(x.links) ? x.links : []).filter(b => b && b.to).map(b => {
          const why = tek(b.why, 300);
          if(!metni.has(b.to)){ r.kopuk.push({ not:id, metin:'links → ' + b.to }); return '→ (bulunamayan not ' + b.to + ')' + (why ? ' — ' + why : ''); }
          return '→ ' + bagYaz('esp-not/' + b.to, tek(metni.get(b.to), 60)) + (why ? ' — ' + why : '');
        });
        koy(r, out, { id, baslik:'', govde:[String(x.text || '')].concat(satirlar.length ? [''].concat(satirlar) : []).join('\n'), alan:g.alan,
          etiketler:etiketTemiz((Array.isArray(x.concepts) ? x.concepts : []).map(c => (g.kavramAdi && g.kavramAdi(c)) || c)),
          kaynak:{ yapi:'esp-not', modul:'esp', yol:'notes/' + x.id }, olusturma:ol.t,
          baglam:x.bookId ? { modul:'esp', kayit:'books/' + x.bookId } : { modul:'esp' } });
      });
      return sonuc(r, out);
    },
    /* ESP Tezlerim (state.js:632 newArgument, :644 normArgument): supports metin, objections { id, text, answered, answer }. */
    espTez(liste, o){
      const g = gocAyar(o, 'ESP tezi', false), out = [];
      const r = rapor('esp-tez', ['«Cevapsız itirazı olan tez kapanmaz» kuralı (state.js:663 saveArgument) ESP\'nin kuralıdır; motor yalnız durumu taşır.',
        'concepts kavram kimlikleridir; kavramAdi verilmezse etiket kimlik olarak kalır.']);
      (liste || []).filter(x => x && x.id).forEach(x => {
        const ol = zamanOku(x.createdAt, g.zaman), gu = zamanOku(x.updatedAt, ol.t), tez = String(x.thesis || '').trim(), kay = x.sourceId ? String(x.sourceId) : '';
        if(ol.yok) r.zamanYok++;
        koy(r, out, { id:'esp-tez/' + x.id, baslik:tek(tez, SINIR.baslik), govde:tez.length > SINIR.baslik ? tez : '', alan:g.alan,
          etiketler:etiketTemiz((Array.isArray(x.concepts) ? x.concepts : []).map(c => (g.kavramAdi && g.kavramAdi(c)) || c)),
          kaynak:{ yapi:'esp-tez', modul:'esp', yol:'args/' + x.id }, olusturma:ol.t, guncelleme:Math.max(gu.t, ol.t), tur:'tez',
          baglam:kay ? { modul:'esp', kayit:kay.indexOf('/') >= 0 ? kay : 'books/' + kay } : { modul:'esp' },
          ozellik:{ destek:(Array.isArray(x.supports) ? x.supports : []).map(String),
            itiraz:(Array.isArray(x.objections) ? x.objections : []).map(i => ({ id:String(i.id || ''), metin:String(i.text || ''), cevaplandi:!!i.answered, cevap:String(i.answer || '') })),
            durum:TEZ_DURUM[x.status] || 'acik' } });
      });
      return sonuc(r, out);
    },
    /* ESP Taslaklarım (state.js:903 newDraft): { id, title, text, revisions, createdAt, updatedAt }. */
    espTaslak(liste, o){
      const g = gocAyar(o, 'ESP taslağı', false), out = [];
      const r = rapor('esp-taslak', ['Taşınamayan alan yok; revisions sayacı ozellik.revizyon olur.']);
      (liste || []).filter(x => x && x.id).forEach(x => {
        const ol = zamanOku(x.createdAt, g.zaman), gu = zamanOku(x.updatedAt, ol.t);
        if(ol.yok) r.zamanYok++;
        koy(r, out, { id:'esp-taslak/' + x.id, baslik:tek(x.title, SINIR.baslik), govde:String(x.text || ''), alan:g.alan,
          kaynak:{ yapi:'esp-taslak', modul:'esp', yol:'drafts/' + x.id }, olusturma:ol.t, guncelleme:Math.max(gu.t, ol.t), tur:'taslak',
          ozellik:{ revizyon:Math.max(0, Math.floor(Number(x.revisions) || 0)) } });
      });
      return sonuc(r, out);
    },
    /* Öğrenme motoru konu notları (ogrenmotor.js:414 notYaz): kayit.n[konu][tur] = [{ g:'YYYY-AA-GG', m, k? }]. */
    ogren(kayitN, o){
      const g = gocAyar(o, 'Öğrenme notu', true), out = [];
      const r = rapor('ogren', ['Saat yok, yalnız gün (g): oluşturma o günün 00:00 UTC\'si.',
        'Konu ve tür başına en son 3 not saklanıyordu (NOT_SAKLA, ogrenmotor.js:67); öncekiler kaynağında da yok.',
        'Konu adı kayıtta yok (yalnız konu kimliği); çağıran konuAdi(null, konu) verirse başlıkta kullanılır.']);
      const n = kayitN && typeof kayitN === 'object' ? kayitN : {};
      Object.keys(n).sort(sira).forEach(konu => Object.keys(n[konu] || {}).sort(sira).forEach(tur => (Array.isArray(n[konu][tur]) ? n[konu][tur] : []).forEach((x, i) => {
        if(!x || !tek(x.m, 1)) return;
        const ol = zamanOku(x.g, g.zaman);
        if(ol.yok) r.zamanYok++;
        koy(r, out, { id:'ogren/' + g.modul + '/' + kimlikParca(konu) + '/' + kimlikParca(tur) + '/' + i,
          baslik:tek(((g.konuAdi && g.konuAdi(null, konu)) || konu) + ' · ' + tur, SINIR.baslik),
          govde:String(x.m) + (x.k ? '\n\n' + String(x.k) : ''), alan:g.alan, kaynak:{ yapi:'ogrenmotor', modul:g.modul, yol:'n/' + konu + '/' + tur },
          olusturma:ol.t, baglam:{ modul:g.modul, konu:String(konu) }, ozellik:{ ogren:String(tur) } });
      })));
      return sonuc(r, out);
    },
    /* Bilinç haritası (bilinc.js:56 temizDusunce, :89 temiz): { dusunceler:[…], izin }. konu → klasör. */
    bilinc(v, o){
      const g = gocAyar(o, 'Bilinç', false), out = [], l = (v && Array.isArray(v.dusunceler) ? v.dusunceler : []).filter(x => x && x.id);
      const izinKapali = !!(v && v.izin === false);
      const r = rapor('bilinc', [
        'Harita düzeyi «izin» (kişi modeline besleme, bilinc.js:197) not başına bir alan değil: izin kapalıysa bütün düşünceler özel işaretlenir (daha sıkı; açmak sahibin işi).',
        'Kıvılcım soruları (KIVILCIM, bilinc.js:26) not değil, aracın parçası.',
        'King yorumlarının ayrı deposu (lifeos.bilinc.yorum): biçimini göremedim; yalnız düşüncenin içindeki sohbet[] taşınır.']);
      const kim = x => 'bilinc/' + x.id, adlar = adHaritasi(l, kim, x => x.baslik);
      l.forEach(x => {
        const id = kim(x), ol = zamanOku(x.zaman || null, g.zaman), evrim = Array.isArray(x.evrim) ? x.evrim : [];
        if(ol.yok) r.zamanYok++;
        const ke = Math.round(Number(x.kesinlik));   // bilinc.js:54 sayi(n, 1, 5, 3) ile aynı
        const oz = { dusunce:DUSUNCE_TURLERI.indexOf(x.tur) >= 0 ? x.tur : 'fikir', kesinlik:isFinite(ke) ? Math.max(1, Math.min(5, ke)) : 3,
          evrim:evrim.map(e => ({ zaman:Number(e.zaman) || 0, metin:basliktanBagla(e.metin, adlar, id, rapor('', []), true), kesinlik:Number(e.kesinlik) || 3 })),
          sohbet:(Array.isArray(x.sohbet) ? x.sohbet : []).map(m => Object.assign({}, m)) };
        if(x.tur === 'catisma'){ oz.taraf = Array.isArray(x.taraf) ? x.taraf.map(t => Object.assign({}, t)) : []; oz.durum = x.durum === 'cozuldu' ? 'cozuldu' : 'acik'; }
        koy(r, out, { id, baslik:tek(x.baslik, SINIR.baslik), govde:basliktanBagla(x.metin, adlar, id, r, true), alan:g.alan, etiketler:etiketTemiz(x.etiket),
          kaynak:{ yapi:'bilinc', yol:'gun/bilinc#' + x.id }, olusturma:ol.t, guncelleme:Math.max(ol.t, ...evrim.map(e => Number(e.zaman) || 0)),
          ozel:x.ozel === true || izinKapali, tur:'dusunce', klasor:klasorAdi(x.konu), ozellik:oz });
      });
      return sonuc(r, out);
    },
  };

  const Not = Object.freeze({ TURLER, DUSUNCE_TURLERI, SINIR, KAYIT_ALANLARI, dogrula, yeni, ad, kucuk, katla, klasorAdi,
    baglar, bagYaz, etiketleri, geriBaglar, yenidenAdlandir, ag, kingIzin, kingOkur, oneri, oneriUygula, ara, goc });
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Not = Not;
  if(typeof module !== 'undefined' && module.exports) module.exports = Not;
})(typeof window !== 'undefined' ? window : globalThis);

/* HKM BAM araştırma kaydı → Not (sadelesme P6 öncesi HKM sahipliği; belgeler/ekip/sadelesme/faz1-hkm-sahiplik.md).
   Var olan satırlara dokunmadan eklenir; yalnız açık işlevleri (yeni, SINIR) kullanır. Yalnız ek, ayrı blok. */
(function(kok){
  const Not = kok.LIFEOS.Motor.Not;
  const json = v => { if(v && typeof v === 'object') return v; try{ const j = JSON.parse(v); return j && typeof j === 'object' ? j : null; }catch(e){ return null; } };
  /* bam_kayitlar satırı (HKM/core/db.py; bam.py:1376 yazar): { id, tur (arastirma|plan|materyal), baslik, govde (JSON:
     ozet, bulgular[{iddia}], kaynaklar…), dogruluk, etiketler (işin talep cümlesi, bam.py:531), surum, onceki_id,
     is_id, created_at (ISO), anahtar, denetim (JSON) }. Liste alır: { notlar, rapor } (öteki goc.* gibi). */
  Not.goc.bamKayit = function(liste, o){
    if(!o || !(Number.isInteger(o.zaman) && o.zaman >= 0)) throw new Error('Göç anı (zaman, ms) verilmeli; motor saati kendisi okumaz.');
    const r = { yapi:'bam', sayi:0, belirsiz:[], kopuk:[], reddedilen:[], zamanYok:0, tasinamayan:[
      'Sürüm zinciri (onceki_id) bağ değil: her sürüm ayrı not; önceki sürümün kimliği ozellik.bam içinde.',
      'Doğruluk (dogruluk), güncellik denetimi (denetim), konu anahtarı (anahtar) ve kaynakça ozellik.bam içinde; etiket olmaz.',
      'etiketler sütunu etiket değil, işin talep cümlesi: Not etiketi olmaz, ozellik.bam.talep içinde.',
      'BAM işi (is_id) ve köken izi (bam_iz) arşivde (goc.HKM_ARSIV): not yalnız kimliği taşır.'] };
    const notlar = [];
    (liste || []).filter(x => x && x.id != null).forEach(x => {
      const id = 'bam/' + x.id, g = json(x.govde), t = Date.parse(String(x.created_at || ''));
      if(!isFinite(t)) r.zamanYok++;
      const govde = g ? [typeof g.ozet === 'string' ? g.ozet.trim() : ''].concat((Array.isArray(g.bulgular) ? g.bulgular : [])
        .map(b => b && typeof b.iddia === 'string' && b.iddia.trim() ? '- ' + b.iddia.trim() : '')).filter(Boolean).join('\n')
        : String(x.govde == null ? '' : x.govde);
      try{
        if(notlar.some(n => n.id === id)) throw new Error('Aynı kimlik ikinci kez geldi; ilki alındı.');
        notlar.push(Not.yeni({ id, baslik:String(x.baslik == null ? '' : x.baslik).trim().slice(0, Not.SINIR.baslik),
          govde:govde.slice(0, Not.SINIR.govde), tur:'belge', kaynak:{ yapi:'bam', yol:'bam_kayitlar/' + x.id },
          olusturma:isFinite(t) && t >= 0 ? t : o.zaman, ozellik:{ bam:{ tur:x.tur, dogruluk:x.dogruluk, surum:x.surum,
            onceki_id:x.onceki_id, is_id:x.is_id, anahtar:x.anahtar, talep:x.etiketler, denetim:json(x.denetim), govde:g } } }));
        r.sayi++;
      }catch(e){ r.reddedilen.push({ id, neden:e.message }); }
    });
    return { notlar, rapor:r };
  };
})(typeof window !== 'undefined' ? window : globalThis);
