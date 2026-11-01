/* KING ARAÇLARI — SPİ'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: günün kaydı, uyku, antrenman ve tahliller; sayıyı SPİ'nin kendi
   kaydı ve hesabı verir. Kaydı olmayan gün «veri yok»tur, sıfır değil
   (AGENTS §1.2). SPİ teşhis koymaz, doz önermez (§1.5): tahlil aracı yalnız
   değeri ve referans aralığını verir, yorum yapmaz.

   Yazma: ölçüm (uyku, su, öğün, antrenman, kısa uyku, tahlil) King'in
   `kayit_gir` aracıyla SPİ'nin kendi ayrıştırıcısından girer (SP.Quick,
   SP.Hazir): sayı kullanıcının cümlesindendir. Burada yalnız öneri
   kataloğunun ölçüm yazmayan eylemi (bölüm aç/gizle) durur; öneri kuyruğuna
   girer ve aynı doğrulama, anlık görüntü ve geri almayla onaylanır.

   Barkod ve besin (King 3.0 K5, 2026-10-21): `spi_besin` tablodaki bir
   gıdanın 100 gramını okur; `spi_barkod` barkodu önce kişisel defterde,
   yoksa Open Food Facts'te arar (core/barkod.js söz 1; kaynak etiketi
   yazılır, eksik alan «veri yok»); `spi_barkod_ogun` ürünü öğüne ekler:
   gram kullanıcının cümlesinden ya da etiketteki porsiyondan (tahmin),
   ikisi de yoksa yalnız gıda tabloya girer ve barkod bağlanır; gram
   uydurulmaz. Fotoğraf ve kamera bu araca SPİ'nin «Barkodu oku» işinden
   (app.js `foto`) gelir. */

window.SP = window.SP || {};

SP.KingArac = (function(){
  'use strict';

  const U = () => SP.U, M = () => SP.Model;
  const gun = { type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' };
  const sayiGun = (en, v) => ({ type:'integer', minimum:1, maximum:en, description:'kaç gün geriye (varsayılan ' + v + ')' });
  const tarihMi = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const n1 = v => v == null ? 'veri yok' : String(Math.round(Number(v) * 10) / 10).replace('.', ',');
  function gunler(n){ const l = []; for(let i = 0; i < n; i++) l.push(U().iso(U().addDays(U().today(), -i))); return l; }
  const yemekAdi = it => ((SP.FOOD_BY_ID || {})[it.foodId] || {}).name || it.name || it.foodId || 'besin';
  const egzersizAdi = w => w.title || w.name || ((w.items || []).map(x => ((SP.EX_BY_ID || {})[x.exId] || {}).name).filter(Boolean).slice(0, 3).join(', ')) || 'antrenman';

  function gunKaydi(p){
    const d = tarihMi(p.tarih) ? p.tarih : U().todayISO();
    const v = M().vitalsOf(d) || {};
    const ogun = (M().mealsOf(d) || []).map(m => ({ ogun:m.slot, besinler:(m.items || []).map(yemekAdi) }));
    const ant = (M().workoutsOf(d) || []).map(w => ({ ad:egzersizAdi(w), dakika:Number(w.minutes) || null }));
    const sonuc = { tarih:d, uyku_saat:v.sleep != null ? Number(v.sleep) : null, su_ml:v.water != null ? Number(v.water) : null,
      kilo_kg:v.weight != null ? Number(v.weight) : null, his_1_5:v.soreness != null ? Number(v.soreness) : null, ogunler:ogun, antrenmanlar:ant };
    return { sonuc, satirlar:[
      'Uyku: ' + (sonuc.uyku_saat != null ? n1(sonuc.uyku_saat) + ' sa' : 'veri yok'),
      'Su: ' + (sonuc.su_ml != null ? n1(sonuc.su_ml / 1000) + ' L' : 'veri yok'),
      'Öğün: ' + (ogun.length ? ogun.length + ' (' + ogun.map(o => o.besinler.slice(0, 2).join(', ')).filter(Boolean).join(' · ') + ')' : 'veri yok'),
      'Antrenman: ' + (ant.length ? ant.map(a => a.ad + (a.dakika ? ' ' + a.dakika + ' dk' : '')).join(' · ') : 'veri yok'),
    ] };
  }

  function uyku(p){
    const n = p.gun || 7;
    const l = gunler(n).map(d => { const v = M().vitalsOf(d); return { tarih:d, saat:v && v.sleep != null && isFinite(Number(v.sleep)) ? Number(v.sleep) : null }; });
    const var_ = l.filter(x => x.saat != null);
    const ort = var_.length ? Math.round(var_.reduce((a, x) => a + x.saat, 0) / var_.length * 10) / 10 : null;
    return { sonuc:{ gun:n, kayitli_gece:var_.length, ortalama_saat:ort, geceler:l },
      satirlar:['Son ' + n + ' gün: ' + var_.length + ' gece kayıtlı', 'Ortalama: ' + (ort != null ? n1(ort) + ' sa (hesaplandı)' : 'veri yok')] };
  }

  function antrenmanlar(p){
    const n = p.gun || 14;
    const l = [];
    gunler(n).forEach(d => (M().workoutsOf(d) || []).forEach(w => l.push({ tarih:d, ad:egzersizAdi(w), dakika:Number(w.minutes) || null })));
    return { sonuc:{ gun:n, adet:l.length, antrenmanlar:l.slice(0, 30) },
      satirlar:l.length ? l.slice(0, 6).map(x => x.tarih + ' · ' + x.ad + (x.dakika ? ' · ' + x.dakika + ' dk' : '')) : ['Son ' + n + ' günde antrenman kaydı yok.'] };
  }

  function tahliller(p){
    const labs = (SP.S.labs || []).slice(-(p.limit || 3)).reverse();
    const bm = id => (SP.BIOMARKERS || []).find(b => b.id === id) || {};
    const out = labs.map(l => ({ tarih:l.date, laboratuvar:l.lab || null, degerler:Object.keys(l.values || {}).slice(0, 25).map(k => {
      const b = bm(k), c = l.values[k] || {};
      return { ad:b.name || k, deger:c.v != null ? Number(c.v) : null, birim:b.unit || '', referans:Array.isArray(b.ref) ? b.ref.join('–') : null };
    }) }));
    return { sonuc:{ tahliller:out, not:'Değer ve referans aralığıdır; yorum ve teşhis değildir.' },
      satirlar:out.length ? out.map(t => t.tarih + ' · ' + t.degerler.length + ' değer') : ['Kayıtlı tahlil yok.'] };
  }

  function bolum(){
    const K = SP.Proposals && SP.Proposals.eylem && SP.Proposals.eylem('bolum-ac-kapa');
    if(!K) return [];
    const satir = r => (r.alan || r.label || '') + ': ' + (r.once != null ? r.once : r.before || '—') + ' → ' + (r.sonra != null ? r.sonra : r.after || '—');
    return [{ ad:'spi_bolum_ac_kapa', tur:'yaz', seviye:'orta', ozetAd:K.label,
      aciklama:'SPİ’de bir bölümü gezinmeden kaldırır ya da geri getirir; verisi silinmez.',
      parametreler:{ type:'object', properties:{ bolum:{ type:'string', maxLength:30, description:'bölümün kimliği' },
        acik:{ type:'integer', enum:[0, 1], description:'1 aç, 0 gizle' } }, required:['bolum', 'acik'] },
      onizle:p => { const pr = SP.Proposals.preview({ action:'bolum-ac-kapa', params:p });
        return pr.ok ? { metin:K.label + ' — onayla uygulanır.', satirlar:(pr.rows || []).map(satir) } : { hata:pr.why || 'uygulanamaz' }; },
      uygula:async p => {
        const row = await SP.Proposals.propose({ action:'bolum-ac-kapa', params:p, source:'istek', reason:'King sohbetinde istendi' });
        const r = row ? await SP.Proposals.approve(row.id) : null;
        if(!r || r.ok === false) return { ok:false, metin:'Uygulanamadı' + (r && r.why ? ': ' + r.why : '.') };
        if(SP.App && SP.App.render) SP.App.render();
        return { metin:K.label + ': uygulandı.', geriAl:SP.Proposals.undo ? async () => { await SP.Proposals.undo(row.id); if(SP.App && SP.App.render) SP.App.render(); } : null };
      } }];
  }

  /* ---------- barkod ve besin ---------- */
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').trim();
  const yaz1 = v => v == null ? 'veri yok' : String(Math.round(Number(v) * 10) / 10).replace('.', ',');
  const degerSatiri = v => '100 g: ' + yaz1(v.kcal) + ' kcal · protein ' + yaz1(v.p) + ' g · yağ ' + yaz1(v.f) + ' g · karbonhidrat ' + yaz1(v.c) + ' g';
  const gidaDeger = f => ({ kcal:f.kcal, p:f.p, f:f.f, c:f.c, sat:f.sat, sugar:f.sugar, fib:f.fib });
  const kodSema = { type:'string', maxLength:20, description:'barkod numarası (8, 12 ya da 13 hane)' };
  const disOnbellek = {};
  const render = () => { if(SP.App && SP.App.render) SP.App.render(); };
  /* Defter → Open Food Facts; aynı oturumda ikinci kez sorulmaz. */
  async function barkodBul(kod){
    const d = await SP.Barkod.coz(kod);
    if(!d.ok) return d;
    if(d.foodId){
      const f = SP.FOOD_BY_ID[d.foodId];
      return { ok:true, kod:d.kod, gida:f, ad:f.name, v:gidaDeger(f), porsiyon:(f.portions || [])[0] || null, kaynak:'kişisel barkod defteri' };
    }
    const r = disOnbellek[d.kod] || await SP.Barkod.disBul(d.kod);
    if(!r.ok) return r;
    disOnbellek[d.kod] = r;
    if(!r.urun) return { ok:true, kod:d.kod, yok:true };
    const u = r.urun;
    return { ok:true, kod:d.kod, urun:u, ad:u.ad, marka:u.marka, v:u.v, kaynak:u.kaynak,
      porsiyon:u.porsiyon ? { label:'1 porsiyon' + (u.porsiyon.ad ? ' (' + u.porsiyon.ad + ')' : ''), g:u.porsiyon.g } : null };
  }
  async function barkodOku(p){
    const b = await barkodBul(p.kod);
    if(!b.ok) return { hata:b.why };
    if(b.yok) return { sonuc:{ barkod:b.kod, urun:null, etiket:'veri yok' }, cevap:'Barkod ' + b.kod + ': ne kişisel defterde ne Open Food Facts’te var (veri yok).',
      satirlar:['SPİ › Öğün › Barkod’dan bir gıdaya bağlayabilirsin; sonra doğrudan gelir.'] };
    return { sonuc:{ barkod:b.kod, ad:b.ad, marka:b.marka || '', yuz_gram:b.v, porsiyon_g:b.porsiyon ? b.porsiyon.g : null, kaynak:b.kaynak },
      satirlar:[b.ad + (b.marka ? ' · ' + b.marka : ''), degerSatiri(b.v), b.porsiyon ? b.porsiyon.label + ' = ' + yaz1(b.porsiyon.g) + ' g' : 'Porsiyon: veri yok', 'Kaynak: ' + b.kaynak] };
  }
  function besin(p){
    const id = SP.Parse && SP.Parse.matchFood ? SP.Parse.matchFood(p.besin) : null;
    const f = id && SP.FOOD_BY_ID[id];
    if(!f) return { cevap:'«' + p.besin + '» SPİ’nin gıda tablosunda yok; barkodu varsa okut ya da Öğün’den kendi gıdanı ekle.' };
    return { sonuc:{ ad:f.name, yuz_gram:gidaDeger(f), porsiyonlar:(f.portions || []).slice(0, 4), kaynak:f.custom ? (f.kaynak ? f.kaynak.ad : 'senin eklediğin') : 'SPİ tablosu' },
      satirlar:[f.name, degerSatiri(f)].concat((f.portions || []).slice(0, 3).map(x => x.label + ' = ' + x.g + ' g')) };
  }
  function slotBul(ad){
    const l = SP.Ogun && SP.Ogun.liste ? SP.Ogun.liste() : (SP.MEAL_SLOTS || []);
    const k = kucuk(ad);
    const x = k ? l.find(o => kucuk(o.id) === k || kucuk(o.ad || o.label) === k) : null;
    return x ? x.id : (SP.Ogun && SP.Ogun.simdiki ? SP.Ogun.simdiki() : 'kahvalti');
  }
  /* Gram kullanıcının (cümlesinde geçmeli) ya da etiketin porsiyonu; ikisi de yoksa yalnız gıda girer. */
  async function barkodPlan(p, b){
    const asil = String((b && b.metin) || '');
    if(p.gram != null && !(asil && window.LIFEOS.ARAC.sayiKorunur(asil, String(p.gram)))) return { hata:'gram senin cümlende geçmiyor; kaç gram yediğini yaz' };
    const x = await barkodBul(p.kod);
    if(!x.ok) return { hata:x.why };
    if(x.yok) return { hata:'bu barkod ne kişisel defterde ne Open Food Facts’te var (veri yok); SPİ › Öğün › Barkod’dan bir gıdaya bağlayabilirsin' };
    const g = p.gram != null ? p.gram : x.porsiyon ? x.porsiyon.g : null;
    if(g == null && x.gida) return { hata:'«' + x.ad + '» tablonda var; öğüne eklemek için «' + x.ad + ' 150 gram yedim» gibi yaz' };
    return Object.assign({}, x, { g, cert:p.gram != null ? 'measured' : 'estimated', portion:p.gram != null ? null : x.porsiyon && x.porsiyon.label, slot:slotBul(p.ogun) });
  }
  async function barkodOnizle(p, b){
    const x = await barkodPlan(p, b);
    if(x.hata) return x;
    const satir = [degerSatiri(x.v), 'Kaynak: ' + x.kaynak];
    if(x.g != null && x.v.kcal != null) satir.unshift('Bu miktar: ≈ ' + yaz1(x.g * x.v.kcal / 100) + ' kcal (hesaplandı)');
    if(!x.gida) satir.push('Gıda tablona eklenir, barkod bağlanır; sonraki okutmada doğrudan gelir.');
    return { metin:x.g != null ? '«' + x.ad + '» öğüne eklenecek: ' + yaz1(x.g) + ' g' + (x.cert === 'measured' ? '.' : ' (' + x.portion + ', etiketten tahmin).')
      : '«' + x.ad + '» gıda tablona eklenecek. Porsiyonu bilinmiyor; öğüne eklemek için sonra «' + x.ad + ' 150 gram yedim» gibi yaz.', satirlar:satir };
  }
  async function barkodUygula(p){
    const x = await barkodPlan(p, { metin:p.gram != null ? String(p.gram) : '' });
    if(x.hata) return { ok:false, metin:x.hata };
    let foodId = x.gida ? x.gida.id : null, yeni = null;
    if(!foodId){
      yeni = await SP.Model.saveFood(SP.Barkod.gidaYap(x.urun, x.kod));
      foodId = yeni.id;
      await SP.Barkod.bagla(x.kod, foodId);
    }
    const d = U().todayISO();
    let mealId = null, eklenen = null;
    if(x.g != null){
      const rows = M().mealsOf(d).slice();
      let meal = rows.find(m => m.slot === x.slot);
      if(!meal){ meal = M().newMeal(x.slot); rows.push(meal); }
      eklenen = { foodId, g:x.g, cert:x.cert, portion:x.portion || null };
      meal.items = (meal.items || []).concat([eklenen]);
      mealId = meal.id;
      await M().saveMeals(d, rows);
    }
    render();
    return { metin:x.g != null ? '«' + x.ad + '» öğüne eklendi.' : '«' + x.ad + '» tablona eklendi, barkod bağlandı.',
      geriAl:async () => {
        if(mealId){
          const rows = M().mealsOf(d).slice(), m = rows.find(r => r.id === mealId);
          if(m){
            const i = (m.items || []).map(it => it.foodId === foodId && it.g === eklenen.g).lastIndexOf(true);
            if(i >= 0) m.items.splice(i, 1);
            await M().saveMeals(d, m.items.length ? rows : rows.filter(r => r.id !== mealId));
          }
        }
        if(yeni) await SP.Model.deleteFood(yeni.id);
        render();
      } };
  }
  const barkodAraclari = () => [
    { ad:'spi_besin', tur:'oku', aciklama:'SPİ’nin gıda tablosunda bir gıdanın 100 gramlık besin değeri ve ev ölçüleri.', ornek:'100 gram ceviz kaç kalori',
      parametreler:{ type:'object', properties:{ besin:{ type:'string', maxLength:60 } }, required:['besin'] }, calistir:besin },
    { ad:'spi_barkod', tur:'oku', aciklama:'Barkod numarasıyla ürünün besin değeri: önce kişisel barkod defteri, yoksa Open Food Facts (kaynak etiketiyle).',
      ornek:'8690504033324 besin değerleri', parametreler:{ type:'object', properties:{ kod:kodSema }, required:['kod'] }, calistir:barkodOku },
    { ad:'spi_barkod_ogun', tur:'yaz', ozetAd:'Barkodlu ürünü öğüne ekle', ornek:'4006381333931 barkodlu üründen 40 gram yedim',
      aciklama:'Barkodlu ürünü bugünün öğününe ekler; gram kullanıcının cümlesinden ya da etiketteki porsiyondan. Ürün tabloda yoksa gıda olarak eklenir ve barkod bağlanır.',
      parametreler:{ type:'object', properties:{ kod:kodSema, gram:{ type:'number', minimum:1, maximum:2000, description:'yenen gram (kullanıcı söylediyse)' },
        ogun:{ type:'string', maxLength:20, description:'öğün (kahvaltı, öğle, akşam…); boşsa şu anki' } }, required:['kod'] },
      onizle:barkodOnizle, uygula:barkodUygula },
  ];

  /* ---------- yeni king araçları (022 · KING-4 A2) ---------- */
  function antrenmanSilAraci(){
    function bulAnt(p){
      if(!p.id && !p.tarih && !p.ad) return { eksik:true };
      if(p.id) return (SP.S.workouts || []).find(x => x.id === p.id) || null;
      let l = (SP.S.workouts || []);
      if(p.tarih) l = l.filter(x => x.date === p.tarih);
      if(p.ad){ const k = kucuk(p.ad); l = l.filter(x => kucuk(x.name || egzersizAdi(x)).indexOf(k) >= 0); }
      if(!l.length) return null;
      if(l.length > 1) return { cok:true, sayi:l.length };
      return l[0];
    }
    return {
      ad:'spi_antrenman_sil', tur:'yaz', ozetAd:'Antrenman kaydı sil',
      aciklama:'Bir antrenman kaydını siler; kimlikle ya da tarih ve adla bulur.',
      parametreler:{ type:'object', properties:{
        id:{ type:'string', maxLength:40, description:'antrenman kimliği (id)' },
        tarih:{ type:'string', maxLength:10, description:'tarih (YYYY-AA-GG)' },
        ad:{ type:'string', maxLength:80, description:'antrenman adı' }
      } },
      onizle:p => {
        const w = bulAnt(p);
        if(!w) return { hata:'Silinecek antrenman kaydı bulunamadı.' };
        if(w.eksik) return { hata:'Hangi antrenman? Tarih ya da ad söyleyin.' };
        if(w.cok) return { hata:'Birden çok antrenman eşleşti (' + w.sayi + ' adet); id belirtin.' };
        const ad = w.name || egzersizAdi(w);
        return { metin:'«' + ad + '» antrenmanı silinecek (' + w.date + (w.minutes ? ', ' + w.minutes + ' dk' : '') + ').',
          satirlar:[w.date + ' · ' + ad + (w.minutes ? ' · ' + w.minutes + ' dk' : '')] };
      },
      uygula:async p => {
        const w = bulAnt(p);
        if(!w || w.eksik || w.cok) return { ok:false, metin:(w && w.eksik) ? 'Hangi antrenman? Tarih ya da ad söyleyin.' : ((w && w.cok) ? 'Birden çok antrenman eşleşti; id belirtin.' : 'Antrenman bulunamadı.') };
        const silinen = Object.assign({}, w, { items:(w.items || []).map(it => Object.assign({}, it)) });
        await M().deleteWorkout(silinen.id);
        render();
        return { metin:'«' + (silinen.name || egzersizAdi(silinen)) + '» antrenmanı silindi.',
          geriAl:async () => { await M().saveWorkout(silinen); render(); } };
      }
    };
  }

  function ogunSilAraci(){
    function bulOgun(p){
      if(!p.id && !p.ogun) return { eksik:true };
      const d = tarihMi(p.tarih) ? p.tarih : (p.id ? Object.keys(SP.S.meals || {}).find(g => (SP.S.meals[g] || []).some(m => m.id === p.id)) || U().todayISO() : U().todayISO());
      const meals = M().mealsOf(d);
      if(p.id){
        const m = meals.find(x => x.id === p.id);
        return m ? { m, d } : null;
      }
      if(p.ogun){
        const slot = slotBul(p.ogun);
        const l = meals.filter(x => x.slot === slot || kucuk(x.slot) === kucuk(p.ogun));
        if(!l.length) return null;
        if(l.length > 1) return { cok:true, sayi:l.length };
        return { m:l[0], d };
      }
      return null;
    }
    return {
      ad:'spi_ogun_sil', tur:'yaz', ozetAd:'Öğün kaydı sil',
      aciklama:'Bir öğün kaydını siler; tarih ve öğün türüyle (kahvaltı, öğle...) ya da id ile bulur.',
      parametreler:{ type:'object', properties:{
        id:{ type:'string', maxLength:40, description:'öğün kimliği (id)' },
        tarih:{ type:'string', maxLength:10, description:'tarih (YYYY-AA-GG); boşsa bugün' },
        ogun:{ type:'string', maxLength:30, description:'öğün adı (kahvaltı, öğle, akşam...)' }
      } },
      onizle:p => {
        const r = bulOgun(p);
        if(!r) return { hata:'Silinecek öğün bulunamadı.' };
        if(r.eksik) return { hata:'Hangi öğün? Öğün türü ya da id belirtin.' };
        if(r.cok) return { hata:'Birden çok öğün eşleşti (' + r.sayi + ' adet); id belirtin.' };
        const b = (r.m.items || []).map(yemekAdi);
        return { metin:r.d + ' tarihindeki «' + r.m.slot + '» öğünü silinecek (' + b.length + ' besin).',
          satirlar:b.length ? b.map(x => '· ' + x) : ['(boş öğün)'] };
      },
      uygula:async p => {
        const r = bulOgun(p);
        if(!r || r.eksik || r.cok) return { ok:false, metin:(r && r.eksik) ? 'Hangi öğün? Öğün türü ya da id belirtin.' : ((r && r.cok) ? 'Birden çok öğün eşleşti; id belirtin.' : 'Öğün bulunamadı.') };
        const silinen = Object.assign({}, r.m, { items:(r.m.items || []).map(it => Object.assign({}, it)) });
        await M().deleteMeal(r.d, silinen.id);
        render();
        return { metin:r.d + ' tarihindeki «' + silinen.slot + '» öğünü silindi.',
          geriAl:async () => { await M().addMeal(r.d, silinen); render(); } };
      }
    };
  }

  function tahlilSilAraci(){
    function bulLab(p){
      if(!p.id && !p.tarih) return { eksik:true };
      if(p.id) return (SP.S.labs || []).find(x => x.id === p.id) || null;
      if(p.tarih){
        const l = (SP.S.labs || []).filter(x => x.date === p.tarih);
        if(!l.length) return null;
        if(l.length > 1) return { cok:true, sayi:l.length };
        return l[0];
      }
      return null;
    }
    return {
      ad:'spi_tahlil_sil', tur:'yaz', ozetAd:'Tahlil oturumu sil',
      aciklama:'Bir tahlil oturumunu ve değerlerini siler; tarihle ya da id ile bulur.',
      parametreler:{ type:'object', properties:{
        id:{ type:'string', maxLength:40, description:'tahlil oturum kimliği (id)' },
        tarih:{ type:'string', maxLength:10, description:'tahlil tarihi (YYYY-AA-GG)' }
      } },
      onizle:p => {
        const l = bulLab(p);
        if(!l) return { hata:'Silinecek tahlil oturumu bulunamadı.' };
        if(l.eksik) return { hata:'Hangi tahlil? Tarih ya da id belirtin.' };
        if(l.cok) return { hata:'Bu tarihte birden çok tahlil var (' + l.sayi + ' adet); id belirtin.' };
        const sayi = Object.keys(l.values || {}).length;
        return { metin:l.date + ' tarihli tahlil oturumu silinecek (' + sayi + ' değer).',
          satirlar:[l.date + (l.lab ? ' · ' + l.lab : '') + ' · ' + sayi + ' ölçüm'] };
      },
      uygula:async p => {
        const l = bulLab(p);
        if(!l || l.eksik || l.cok) return { ok:false, metin:(l && l.eksik) ? 'Hangi tahlil? Tarih ya da id belirtin.' : ((l && l.cok) ? 'Birden çok tahlil eşleşti; id belirtin.' : 'Tahlil bulunamadı.') };
        const silinen = Object.assign({}, l, { values:Object.assign({}, l.values) });
        await M().deleteLab(silinen.id);
        render();
        return { metin:silinen.date + ' tarihli tahlil silindi.',
          geriAl:async () => { await M().saveLab(silinen); render(); } };
      }
    };
  }

  function ilacAraci(){
    function bulIlac(p){
      if(!p.id && !p.ad) return { eksik:true };
      if(p.id) return (SP.S.meds || []).find(m => m.id === p.id) || null;
      if(p.ad){
        const k = kucuk(p.ad);
        const l = (SP.S.meds || []).filter(m => kucuk(m.name) === k || kucuk(m.name).indexOf(k) >= 0);
        if(!l.length) return null;
        if(l.length > 1) return { cok:true, sayi:l.length };
        return l[0];
      }
      return null;
    }
    return {
      ad:'spi_ilac', tur:'yaz', ozetAd:'İlaç ve takviye yönetimi',
      aciklama:'Kullanılan ilaç ya da takviyeyi kaydeder, günceller ya da siler. Doz önermez; yalnız kullanıcının söylediğini yazar.',
      parametreler:{ type:'object', properties:{
        islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
        id:{ type:'string', maxLength:40, description:'ilaç kimliği' },
        ad:{ type:'string', maxLength:80, description:'ilaç/takviye adı' },
        doz:{ type:'string', maxLength:60, description:'doz (kullanıcının söylediği)' },
        tur:{ type:'string', maxLength:40, description:'tür (diger, d_vitamini, demir...)' },
        baslangic:{ type:'string', maxLength:10, description:'başlangıç tarihi (YYYY-AA-GG)' },
        bitis:{ type:'string', maxLength:10, description:'bitiş tarihi (YYYY-AA-GG)' },
        not:{ type:'string', maxLength:200, description:'kullanıcı notu' }
      }, required:['islem'] },
      onizle:p => {
        if(p.islem === 'sil'){
          const m = bulIlac(p);
          if(!m) return { hata:'Silinecek ilaç bulunamadı.' };
          if(m.eksik) return { hata:'Hangi ilaç? Ad ya da id belirtin.' };
          if(m.cok) return { hata:'Birden çok ilaç eşleşti (' + m.sayi + ' adet); id belirtin.' };
          return { metin:'«' + m.name + '» ilacı/takviyesi silinecek.', satirlar:[m.name + (m.dose ? ' · ' + m.dose : '') + ' · Başlangıç: ' + (m.startDate || '—')] };
        }
        if(p.islem === 'ekle'){
          if(!p.ad) return { hata:'İlaç adı gerekli.' };
          return { metin:'«' + p.ad + '» ilaç/takviye olarak kaydedilecek.', satirlar:[p.ad + (p.doz ? ' · doz: ' + p.doz : '') + (p.baslangic ? ' · başlama: ' + p.baslangic : '')] };
        }
        if(p.islem === 'guncelle'){
          const m = bulIlac(p);
          if(!m) return { hata:'Güncellenecek ilaç bulunamadı.' };
          if(m.eksik) return { hata:'Hangi ilaç? Ad ya da id belirtin.' };
          if(m.cok) return { hata:'Birden çok ilaç eşleşti (' + m.sayi + ' adet); id belirtin.' };
          return { metin:'«' + m.name + '» ilacı/takviyesi güncellenecek.', satirlar:[m.name + ' → ' + (p.ad || m.name) + (p.doz ? ' · doz: ' + p.doz : '')] };
        }
        return { hata:'Bilinmeyen işlem: ' + p.islem };
      },
      uygula:async p => {
        if(p.islem === 'sil'){
          const m = bulIlac(p);
          if(!m || m.eksik || m.cok) return { ok:false, metin:(m && m.eksik) ? 'Hangi ilaç? Ad ya da id belirtin.' : ((m && m.cok) ? 'Birden çok ilaç eşleşti; id belirtin.' : 'İlaç bulunamadı.') };
          const eski = Object.assign({}, m);
          await M().deleteMed(m.id);
          render();
          return { metin:'«' + eski.name + '» silindi.', geriAl:async () => { await M().saveMed(eski); render(); } };
        }
        if(p.islem === 'ekle'){
          if(!p.ad) return { ok:false, metin:'İlaç adı gerekli.' };
          const m = M().newMed();
          m.name = p.ad;
          if(p.doz) m.dose = p.doz;
          if(p.tur) m.kindId = p.tur;
          if(p.baslangic) m.startDate = p.baslangic;
          if(p.bitis) m.endDate = p.bitis;
          if(p.not) m.note = p.not;
          await M().saveMed(m);
          render();
          return { metin:'«' + m.name + '» kaydedildi.', geriAl:async () => { await M().deleteMed(m.id); render(); } };
        }
        if(p.islem === 'guncelle'){
          const m = bulIlac(p);
          if(!m || m.eksik || m.cok) return { ok:false, metin:(m && m.eksik) ? 'Hangi ilaç? Ad ya da id belirtin.' : ((m && m.cok) ? 'Birden çok ilaç eşleşti; id belirtin.' : 'İlaç bulunamadı.') };
          const eski = Object.assign({}, m);
          const guncel = Object.assign({}, m);
          if(p.ad) guncel.name = p.ad;
          if(p.doz != null) guncel.dose = p.doz;
          if(p.tur) guncel.kindId = p.tur;
          if(p.baslangic) guncel.startDate = p.baslangic;
          if(p.bitis !== undefined) guncel.endDate = p.bitis || null;
          if(p.not != null) guncel.note = p.not;
          await M().saveMed(guncel);
          render();
          return { metin:'«' + guncel.name + '» güncellendi.', geriAl:async () => { await M().saveMed(eski); render(); } };
        }
        return { ok:false, metin:'Geçersiz işlem.' };
      }
    };
  }

  function gidaAraci(){
    function bulGida(p){
      if(!p.id && !p.ad) return { eksik:true };
      if(p.id) return (SP.S.foods || []).find(f => f.id === p.id) || null;
      if(p.ad){
        const k = kucuk(p.ad);
        const l = (SP.S.foods || []).filter(f => kucuk(f.name) === k || kucuk(f.name).indexOf(k) >= 0);
        if(!l.length) return null;
        if(l.length > 1) return { cok:true, sayi:l.length };
        return l[0];
      }
      return null;
    }
    return {
      ad:'spi_gida', tur:'yaz', ozetAd:'Kişisel gıda ve sabitleme',
      aciklama:'Kişisel gıda tablosuna gıda ekler, günceller ya da siler; veya önemli bir ölçümü sabitler/kaldırır.',
      parametreler:{ type:'object', properties:{
        islem:{ type:'string', enum:['ekle', 'guncelle', 'sil', 'sabitle'], description:'yapılacak işlem' },
        id:{ type:'string', maxLength:40, description:'gıda kimliği veya sabitlenecek ölçüm kimliği' },
        ad:{ type:'string', maxLength:80, description:'gıda adı' },
        kategori:{ type:'string', maxLength:30, description:'kategori' },
        kalori:{ type:'number', minimum:0, maximum:1000, description:'100 g kalori (kcal)' },
        protein:{ type:'number', minimum:0, maximum:100, description:'100 g protein (g)' },
        yag:{ type:'number', minimum:0, maximum:100, description:'100 g yağ (g)' },
        karbonhidrat:{ type:'number', minimum:0, maximum:100, description:'100 g karbonhidrat (g)' },
        lif:{ type:'number', minimum:0, maximum:100, description:'100 g lif (g)' }
      }, required:['islem'] },
      onizle:p => {
        if(p.islem === 'sabitle'){
          if(!p.id) return { hata:'Sabitlenecek ölçüm kimliği (id) gerekli.' };
          const bm = SP.BIO_BY_ID && SP.BIO_BY_ID[p.id];
          if(!bm) return { hata:'«' + p.id + '» adında bir biyobelirteç ölçümü yok.' };
          const pinli = M().isPinned(p.id);
          return { metin:'«' + bm.name + '» ölçümü ' + (pinli ? 'sabitlemeden kaldırılacak.' : 'başta sabitlenecek.') };
        }
        if(p.islem === 'sil'){
          const f = bulGida(p);
          if(!f) return { hata:'Silinecek kullanıcı gıdası bulunamadı.' };
          if(f.eksik) return { hata:'Hangi gıda? Ad ya da id belirtin.' };
          if(f.cok) return { hata:'Birden çok gıda eşleşti (' + f.sayi + ' adet); id belirtin.' };
          return { metin:'«' + f.name + '» gıdası tablodan silinecek.', satirlar:[degerSatiri(f)] };
        }
        if(p.islem === 'ekle'){
          if(!p.ad) return { hata:'Gıda adı gerekli.' };
          return { metin:'«' + p.ad + '» gıda tablosuna eklenecek.', satirlar:[p.kalori != null ? '100 g: ' + p.kalori + ' kcal' : 'Değerler sonra girilebilir'] };
        }
        if(p.islem === 'guncelle'){
          const f = bulGida(p);
          if(!f) return { hata:'Güncellenecek kullanıcı gıdası bulunamadı.' };
          if(f.eksik) return { hata:'Hangi gıda? Ad ya da id belirtin.' };
          if(f.cok) return { hata:'Birden çok gıda eşleşti (' + f.sayi + ' adet); id belirtin.' };
          return { metin:'«' + f.name + '» gıdası güncellenecek.' };
        }
        return { hata:'Bilinmeyen işlem: ' + p.islem };
      },
      uygula:async p => {
        if(p.islem === 'sabitle'){
          const r = await M().togglePin(p.id);
          render();
          return { metin:r.note || (r.pinned ? 'Sabitlendi.' : 'Sabitleme kaldırıldı.'), geriAl:async () => { await M().togglePin(p.id); render(); } };
        }
        if(p.islem === 'sil'){
          const f = bulGida(p);
          if(!f || f.eksik || f.cok) return { ok:false, metin:(f && f.eksik) ? 'Hangi gıda? Ad ya da id belirtin.' : ((f && f.cok) ? 'Birden çok gıda eşleşti; id belirtin.' : 'Gıda bulunamadı.') };
          const eski = Object.assign({}, f);
          await M().deleteFood(f.id);
          render();
          return { metin:'«' + eski.name + '» silindi.', geriAl:async () => { await M().saveFood(eski); render(); } };
        }
        if(p.islem === 'ekle'){
          if(!p.ad) return { ok:false, metin:'Gıda adı gerekli.' };
          const f = M().newFood();
          f.name = p.ad;
          if(p.kategori) f.cat = p.kategori;
          if(p.kalori != null) f.kcal = p.kalori;
          if(p.protein != null) f.p = p.protein;
          if(p.yag != null) f.f = p.yag;
          if(p.karbonhidrat != null) f.c = p.karbonhidrat;
          if(p.lif != null) f.fib = p.lif;
          await M().saveFood(f);
          render();
          return { metin:'«' + f.name + '» gıdalara eklendi.', geriAl:async () => { await M().deleteFood(f.id); render(); } };
        }
        if(p.islem === 'guncelle'){
          const f = bulGida(p);
          if(!f || f.eksik || f.cok) return { ok:false, metin:(f && f.eksik) ? 'Hangi gıda? Ad ya da id belirtin.' : ((f && f.cok) ? 'Birden çok gıda eşleşti; id belirtin.' : 'Gıda bulunamadı.') };
          const eski = Object.assign({}, f);
          const guncel = Object.assign({}, f);
          if(p.ad) guncel.name = p.ad;
          if(p.kategori) guncel.cat = p.kategori;
          if(p.kalori != null) guncel.kcal = p.kalori;
          if(p.protein != null) guncel.p = p.protein;
          if(p.yag != null) guncel.f = p.yag;
          if(p.karbonhidrat != null) guncel.c = p.karbonhidrat;
          if(p.lif != null) guncel.fib = p.lif;
          await M().saveFood(guncel);
          render();
          return { metin:'«' + guncel.name + '» güncellendi.', geriAl:async () => { await M().saveFood(eski); render(); } };
        }
        return { ok:false, metin:'Geçersiz işlem.' };
      }
    };
  }

  function haneAraclari(){
    function bulUye(p){
      if(!p.id && !p.ad) return { eksik:true };
      const list = M().householdList();
      if(p.id) return list.find(x => x.id === p.id) || null;
      if(p.ad){
        const k = kucuk(p.ad);
        const l = list.filter(x => kucuk(x.name) === k || kucuk(x.name).indexOf(k) >= 0);
        if(!l.length) return null;
        if(l.length > 1) return { cok:true, sayi:l.length };
        return l[0];
      }
      return null;
    }
    const haneYaz = {
      ad:'spi_hane', tur:'yaz', ozetAd:'Hane üyesi ekle ya da çıkar',
      aciklama:'Hane profil listesine yeni profil ekler ya da var olan bir profili haneden çıkarır.',
      parametreler:{ type:'object', properties:{
        islem:{ type:'string', enum:['ekle', 'sil'], description:'işlem' },
        ad:{ type:'string', maxLength:60, description:'profil adı' },
        id:{ type:'string', maxLength:40, description:'profil kimliği' },
        rol:{ type:'string', enum:['self', 'family'], description:'rol' },
        cinsiyet:{ type:'string', enum:['male', 'female'], description:'cinsiyet' },
        dogumYili:{ type:'integer', minimum:1900, maximum:2026, description:'doğum yılı' }
      }, required:['islem'] },
      onizle:p => {
        if(p.islem === 'ekle'){
          if(!p.ad) return { hata:'Profil adı gerekli.' };
          return { metin:'«' + p.ad + '» hane üyesi olarak eklenecek.', satirlar:['Rol: ' + (p.rol || 'family') + (p.dogumYili ? ' · Doğum: ' + p.dogumYili : '')] };
        }
        if(p.islem === 'sil'){
          const m = bulUye(p);
          if(!m) return { hata:'Haneden çıkarılacak profil bulunamadı.' };
          if(m.eksik) return { hata:'Hangi profil? Profil adı ya da id belirtin.' };
          if(m.cok) return { hata:'Birden çok profil eşleşti (' + m.sayi + ' adet); id belirtin.' };
          if(m.id === M().activeProfileId()) return { hata:'Açık olan aktif profil silinemez.' };
          return { metin:'«' + m.name + '» profili haneden çıkarılacak.' };
        }
        return { hata:'Bilinmeyen işlem: ' + p.islem };
      },
      uygula:async p => {
        if(p.islem === 'ekle'){
          if(!p.ad) return { ok:false, metin:'Profil adı gerekli.' };
          const r = M().addHouseholdMember(p.ad, { role:p.rol, sex:p.cinsiyet, birthYear:p.dogumYili });
          if(!r.ok) return { ok:false, metin:r.error };
          render();
          return { metin:'«' + p.ad + '» haneye eklendi.', geriAl:async () => { M().removeHouseholdMember(r.id); render(); } };
        }
        if(p.islem === 'sil'){
          const m = bulUye(p);
          if(!m || m.eksik || m.cok) return { ok:false, metin:(m && m.eksik) ? 'Hangi profil? Profil adı ya da id belirtin.' : ((m && m.cok) ? 'Birden çok profil eşleşti; id belirtin.' : 'Profil bulunamadı.') };
          if(m.id === M().activeProfileId()) return { ok:false, metin:'Aktif profil silinemez.' };
          const eski = Object.assign({}, m);
          const r = M().removeHouseholdMember(m.id);
          if(!r.ok) return { ok:false, metin:r.error };
          render();
          return { metin:'«' + eski.name + '» haneden çıkarıldı.', geriAl:async () => {
            const list = M().householdList();
            list.push(eski);
            try{ localStorage.setItem('spi.household', JSON.stringify(list)); }catch(e){}
            SP.S.profiles = list;
            render();
          } };
        }
        return { ok:false, metin:'Geçersiz işlem.' };
      }
    };
    const haneOku = {
      ad:'spi_hane_oku', tur:'oku', ozetAd:'Hane profilleri',
      aciklama:'Cihazda kayıtlı hane üyeleri, rolleri ve aktif olan profil.',
      parametreler:{ type:'object', properties:{} },
      calistir:() => {
        const list = M().householdList() || [];
        const aktif = M().activeProfileId();
        if(!list.length) return { sonuc:{ toplam_uye:0, uyeler:[], etiket:'veri yok' }, satirlar:['Kayıtlı hane üyesi yok (veri yok).'] };
        const out = list.map(m => ({ id:m.id, ad:m.name, rol:m.role || 'family', aktif:m.id === aktif }));
        return { sonuc:{ aktif_profil:aktif, toplam_uye:out.length, uyeler:out },
          satirlar:out.map(m => m.ad + ' (' + m.rol + ')' + (m.aktif ? ' · aktif profil' : '')) };
      }
    };
    return [haneYaz, haneOku];
  }

  function marketAraci(){
    function gidaBul(s){
      if(!s) return null;
      if(SP.FOOD_BY_ID && SP.FOOD_BY_ID[s]) return s;
      if(SP.Parse && SP.Parse.matchFood){
        const m = SP.Parse.matchFood(s);
        if(m) return m;
      }
      const k = kucuk(s);
      const f = (SP.FOODS || []).find(x => kucuk(x.id) === k || kucuk(x.name) === k || (x.aliases || []).some(a => kucuk(a) === k));
      return f ? f.id : null;
    }
    return {
      ad:'spi_market', tur:'yaz', ozetAd:'Sepet ve market fiyatı',
      aciklama:'Haftalık sepete ürün ekler, çıkarır, fiyatını kaydeder ya da haftalık bütçe sınırını ayarlar.',
      parametreler:{ type:'object', properties:{
        islem:{ type:'string', enum:['sepet_ekle', 'sepet_sil', 'fiyat_gir', 'sinir_koy'], description:'işlem' },
        gida:{ type:'string', maxLength:60, description:'gıda adı ya da kimliği' },
        kg:{ type:'number', minimum:0, maximum:50, description:'miktar (kg)' },
        fiyat:{ type:'number', minimum:0, maximum:5000, description:'kullanıcı fiyatı (TL/kg)' },
        sinir:{ type:'number', minimum:0, maximum:50000, description:'haftalık sınır (TL)' }
      }, required:['islem'] },
      onizle:p => {
        if(p.islem === 'sinir_koy'){
          if(p.sinir == null) return { hata:'Sınır değeri (TL) gerekli.' };
          return { metin:'Haftalık market bütçe sınırı ' + p.sinir + ' TL olarak ayarlanacak.' };
        }
        const fid = p.gida && gidaBul(p.gida);
        if(!fid) return { hata:'«' + p.gida + '» gıdası tablolarda bulunamadı.' };
        const fname = (SP.FOOD_BY_ID[fid] || {}).name || fid;
        if(p.islem === 'sepet_ekle'){
          if(p.kg == null || p.kg <= 0) return { hata:'Kaç kg?' };
          return { metin:'«' + fname + '» sepete eklenecek: ' + p.kg + ' kg.' };
        }
        if(p.islem === 'sepet_sil'){
          return { metin:'«' + fname + '» sepetten çıkarılacak.' };
        }
        if(p.islem === 'fiyat_gir'){
          if(p.fiyat == null) return { hata:'Fiyat değeri (TL) gerekli.' };
          return { metin:'«' + fname + '» için kullanıcı fiyatı kaydedilecek: ' + p.fiyat + ' TL/kg.' };
        }
        return { hata:'Bilinmeyen işlem: ' + p.islem };
      },
      uygula:async p => {
        if(p.islem === 'sinir_koy'){
          if(p.sinir == null) return { ok:false, metin:'Sınır gerekli.' };
          const eski = SP.S.basket ? SP.S.basket.weeklyLimit : null;
          await M().saveBasket({ weeklyLimit:p.sinir });
          render();
          return { metin:'Haftalık bütçe sınırı ayarlandı: ' + p.sinir + ' TL.', geriAl:async () => { await M().saveBasket({ weeklyLimit:eski }); render(); } };
        }
        const fid = p.gida && gidaBul(p.gida);
        if(!fid) return { ok:false, metin:'Gıda bulunamadı.' };
        const fname = (SP.FOOD_BY_ID[fid] || {}).name || fid;
        if(p.islem === 'sepet_ekle'){
          if(p.kg == null || p.kg <= 0) return { ok:false, metin:'Kaç kg?' };
          const items = (SP.S.basket && SP.S.basket.items) || [];
          const onceki = items.find(x => x.foodId === fid);
          const oncekiKg = onceki ? onceki.kg : 0;
          await M().setBasketItem(fid, p.kg);
          render();
          return { metin:'«' + fname + '» sepete eklendi (' + p.kg + ' kg).', geriAl:async () => { await M().setBasketItem(fid, oncekiKg); render(); } };
        }
        if(p.islem === 'sepet_sil'){
          const items = (SP.S.basket && SP.S.basket.items) || [];
          const onceki = items.find(x => x.foodId === fid);
          const oncekiKg = onceki ? onceki.kg : 0;
          await M().setBasketItem(fid, 0);
          render();
          return { metin:'«' + fname + '» sepetten çıkarıldı.', geriAl:async () => { if(oncekiKg > 0) await M().setBasketItem(fid, oncekiKg); render(); } };
        }
        if(p.islem === 'fiyat_gir'){
          const onceki = SP.S.prices && SP.S.prices[fid] ? SP.S.prices[fid].tl : null;
          await M().setPrice(fid, p.fiyat);
          render();
          return { metin:'«' + fname + '» fiyatı kaydedildi: ' + p.fiyat + ' TL.', geriAl:async () => { await M().setPrice(fid, onceki); render(); } };
        }
        return { ok:false, metin:'Geçersiz işlem.' };
      }
    };
  }

  function butceAraci(){
    return {
      ad:'spi_butce', tur:'oku', ozetAd:'Sağlık ve market bütçesi',
      aciklama:'Haftalık sepet maliyeti, kişi başı tutar ve belirlenen bütçe sınırına göre durum.',
      parametreler:{ type:'object', properties:{} },
      calistir:() => {
        const b = SP.Money && SP.Money.basketTotal ? SP.Money.basketTotal() : { rows:[] };
        if(!b.rows || !b.rows.length){
          return { sonuc:{ sepet_kalem:0, haftalik_toplam_tl:null, sinir_tl:b.limit, kisi_basi_tl:null, etiket:'veri yok' },
            satirlar:['Haftalık sepet boş (veri yok).', b.limit ? 'Haftalık sınır: ' + b.limit + ' TL' : 'Bütçe sınırı belirlenmemiş.'] };
        }
        return { sonuc:{ sepet_kalem:b.rows.length, haftalik_toplam_tl:b.total, sinir_tl:b.limit, kisi_basi_tl:b.perPerson, hane_kisi:b.householdSize, sinir_asildi:b.over },
          satirlar:[
            'Haftalık sepet: ' + b.rows.length + ' kalem · ' + yaz1(b.total) + ' TL' + (b.limit ? ' / ' + b.limit + ' TL' : ''),
            'Kişi başı: ' + yaz1(b.perPerson) + ' TL (' + b.householdSize + ' kişi)',
            b.over ? 'Sınır aşıldı!' : (b.limit ? 'Bütçe sınırının altında.' : 'Bütçe sınırı yok.')
          ] };
      }
    };
  }

  function kararKapatAraci(){
    function bulKarar(p){
      if(p.id) return (SP.S.decisions || []).find(d => d.id === p.id) || null;
      const aciklar = M().openDecisions();
      if(!aciklar.length) return null;
      if(aciklar.length > 1) return { cok:true, sayi:aciklar.length };
      return aciklar[0];
    }
    return {
      ad:'spi_karar_kapat', tur:'yaz', ozetAd:'Ofis kararını kapat ya da kaydet',
      aciklama:'Danışma ve ofis kararlarını kapatır veya yeni karar kaydeder.',
      parametreler:{ type:'object', properties:{
        id:{ type:'string', maxLength:40, description:'karar kimliği' },
        sonuc:{ type:'string', maxLength:200, description:'karar sonucu veya gerekçe' },
        konu:{ type:'string', maxLength:200, description:'yeni karar konusu' }
      } },
      onizle:p => {
        if(p.konu) return { metin:'Yeni ofis kararı kaydedilecek: «' + p.konu + '»' };
        const d = bulKarar(p);
        if(!d) return { hata:'Açık karar bulunamadı.' };
        if(d.cok) return { hata:'Birden çok açık karar var (' + d.sayi + ' adet); karar id belirtin.' };
        return { metin:'Karar kapatılacak: «' + (d.topic || d.text || d.id) + '»', satirlar:[p.sonuc ? 'Sonuç: ' + p.sonuc : 'Durum: kapalı'] };
      },
      uygula:async p => {
        if(p.konu){
          const d = await M().saveDecision({ topic:p.konu, text:p.sonuc || p.konu });
          render();
          return { metin:'Karar kaydedildi.', geriAl:async () => {
            SP.S.decisions = (SP.S.decisions || []).filter(x => x.id !== d.id);
            await SP.Store.remove('decisions/' + d.id);
            render();
          } };
        }
        const d = bulKarar(p);
        if(!d || d.cok) return { ok:false, metin:(d && d.cok) ? 'Birden çok karar var; id belirtin.' : 'Karar bulunamadı.' };
        const eski = Object.assign({}, d);
        await M().closeDecision(d.id, p.sonuc || 'kapatıldı');
        render();
        return { metin:'Karar kapatıldı.', geriAl:async () => {
          const idx = (SP.S.decisions || []).findIndex(x => x.id === eski.id);
          if(idx >= 0) SP.S.decisions[idx] = eski;
          await SP.Store.set('decisions/' + eski.id, eski);
          render();
        } };
      }
    };
  }

  function profilAraci(){
    return {
      ad:'spi_profil', tur:'yaz', ozetAd:'Profil ve hareket seviyesi',
      aciklama:'Kullanıcı profilini (kilo, boy, doğum yılı vb.) günceller ya da hareket merdivenindeki basamağı belirler.',
      parametreler:{ type:'object', properties:{
        islem:{ type:'string', enum:['profil', 'seviye'], description:'işlem (profil veya seviye)' },
        ad:{ type:'string', maxLength:60, description:'ad' },
        boy:{ type:'number', minimum:100, maximum:230, description:'boy (cm)' },
        kilo:{ type:'number', minimum:30, maximum:300, description:'kilo (kg)' },
        dogumYili:{ type:'integer', minimum:1900, maximum:2026, description:'doğum yılı' },
        cinsiyet:{ type:'string', enum:['male', 'female'], description:'cinsiyet' },
        aktivite:{ type:'string', enum:['sedentary', 'light', 'moderate', 'very', 'extra'], description:'aktivite düzeyi' },
        hedef:{ type:'string', maxLength:40, description:'sağlık hedefi' },
        hareketId:{ type:'string', maxLength:40, description:'hareket kimliği' },
        seviyeId:{ type:'string', maxLength:40, description:'seviye kimliği' }
      } },
      onizle:p => {
        if(p.islem === 'seviye' || p.hareketId){
          if(!p.hareketId || !p.seviyeId) return { hata:'hareketId ve seviyeId gerekli.' };
          return { metin:'«' + p.hareketId + '» hareketi için seviye «' + p.seviyeId + '» olarak ayarlanacak.' };
        }
        const satirlar = [];
        if(p.kilo != null) satirlar.push('Kilo: ' + p.kilo + ' kg');
        if(p.boy != null) satirlar.push('Boy: ' + p.boy + ' cm');
        if(p.dogumYili != null) satirlar.push('Doğum yılı: ' + p.dogumYili);
        if(p.cinsiyet) satirlar.push('Cinsiyet: ' + p.cinsiyet);
        return { metin:'Profil bilgileri güncellenecek.', satirlar:satirlar.length ? satirlar : ['Profil güncellenecek.'] };
      },
      uygula:async p => {
        if(p.islem === 'seviye' || p.hareketId){
          if(!p.hareketId || !p.seviyeId) return { ok:false, metin:'hareketId ve seviyeId gerekli.' };
          const onceki = SP.S.progress && SP.S.progress[p.hareketId] ? Object.assign({}, SP.S.progress[p.hareketId]) : null;
          await M().setLevel(p.hareketId, p.seviyeId);
          render();
          return { metin:'Hareket seviyesi ayarlandı.', geriAl:async () => {
            if(onceki) await M().setLevel(p.hareketId, onceki.levelId);
            else { delete SP.S.progress[p.hareketId]; await SP.Store.set('progress', SP.S.progress); }
            render();
          } };
        }
        const onceki = Object.assign({}, SP.S.profile || {});
        const patch = {};
        if(p.ad) patch.name = p.ad;
        if(p.boy != null) patch.heightCm = p.boy;
        if(p.kilo != null) patch.weightKg = p.kilo;
        if(p.dogumYili != null) patch.birthYear = p.dogumYili;
        if(p.cinsiyet) patch.sex = p.cinsiyet;
        if(p.aktivite) patch.activity = p.aktivite;
        if(p.hedef) patch.goal = p.hedef;
        await M().saveProfile(patch);
        render();
        return { metin:'Profil güncellendi.', geriAl:async () => { await M().saveProfile(onceki); render(); } };
      }
    };
  }

  function planlarAraci(){
    return {
      ad:'spi_planlar', tur:'oku', ozetAd:'Haftalık planlar',
      aciklama:'Kullanıcının haftalık planları (beslenme, hareket, uyku, su, alışkanlıklar) ve bugünkü uyum durumu.',
      parametreler:{ type:'object', properties:{
        tur:{ type:'string', enum:['beslenme', 'hareket', 'uyku', 'su', 'serbest'], description:'plan türü' }
      } },
      calistir:p => {
        const list = SP.HaftaPlan ? SP.HaftaPlan.liste() : [];
        const iso = U().todayISO();
        const filtre = p.tur ? list.filter(x => x.tur === p.tur) : list;
        if(!filtre.length){
          return { sonuc:{ toplam:0, planlar:[], etiket:'veri yok' }, satirlar:['Kayıtlı haftalık plan yok (veri yok).'] };
        }
        const out = filtre.map(x => {
          const b = SP.HaftaPlan.bugun ? SP.HaftaPlan.bugun(x, iso) : null;
          const u = SP.HaftaPlan.uyum ? SP.HaftaPlan.uyum(x, iso) : null;
          return { id:x.id, tur:x.tur, ad:x.ad, bugun:b ? b.metin : '—', uyum:u ? u.metin : '—' };
        });
        return { sonuc:{ toplam:out.length, planlar:out }, satirlar:out.map(x => (x.ad || x.tur) + ': ' + x.bugun + ' · ' + x.uyum) };
      }
    };
  }

  function hedeflerAraci(){
    return {
      ad:'spi_hedefler', tur:'oku', ozetAd:'Sağlık hedefleri',
      aciklama:'Kullanıcının etkin sağlık ve kilo hedefleri, yönü ve durumu.',
      parametreler:{ type:'object', properties:{
        durum:{ type:'string', enum:['aktif', 'hepsi'], description:'aktif hedefler veya tümü' }
      } },
      calistir:p => {
        const l = SP.Hedefler ? (p.durum === 'hepsi' ? SP.Hedefler.liste() : SP.Hedefler.aktifler()) : [];
        if(!l.length){
          return { sonuc:{ toplam:0, hedefler:[], etiket:'veri yok' }, satirlar:['Kayıtlı hedef yok (veri yok).'] };
        }
        const out = l.map(h => ({
          id:h.id,
          ozet:SP.Hedefler.ozet ? SP.Hedefler.ozet(h) : (h.cumle || 'Hedef'),
          paket:h.paket,
          durum:h.durum || 'aktif'
        }));
        return { sonuc:{ toplam:out.length, hedefler:out }, satirlar:out.map(h => h.ozet + ' (' + h.durum + ')') };
      }
    };
  }

  function mutfakAraci(){
    return {
      ad:'spi_mutfak', tur:'oku', ozetAd:'Hane mutfak porsiyon paylaşımı',
      aciklama:'Tek tencere yemeğin hane bireylerinin kalori ve protein ihtiyacına göre porsiyon paylaşımı.',
      parametreler:{ type:'object', properties:{
        yemek:{ type:'string', maxLength:60, description:'yemeğin adı veya kimliği' },
        gram:{ type:'number', minimum:100, maximum:10000, description:'toplam tencere gramı' }
      } },
      calistir:p => {
        let fid = null;
        if(p.yemek){
          fid = (SP.FOOD_BY_ID && SP.FOOD_BY_ID[p.yemek]) ? p.yemek : (SP.Parse && SP.Parse.matchFood ? SP.Parse.matchFood(p.yemek) : null);
          if(!fid){
            return { sonuc:{ yemek:null, paylar:[], etiket:'veri yok' }, satirlar:['«' + p.yemek + '» gıdası tablolarda bulunamadı (veri yok).'] };
          }
        } else {
          fid = (SP.S.ui && SP.S.ui.kitchenDish) || null;
          if(!fid){
            return { sonuc:{ yemek:null, paylar:[], etiket:'veri yok' }, satirlar:['Seçili yemek yok (veri yok).'] };
          }
        }
        const f = SP.FOOD_BY_ID && SP.FOOD_BY_ID[fid];
        if(!f) return { sonuc:{ yemek:null, paylar:[], etiket:'veri yok' }, satirlar:['«' + (p.yemek || fid) + '» gıdası tablolarda bulunamadı (veri yok).'] };

        const totalGrams = p.gram || (SP.S.ui && SP.S.ui.kitchenGrams) || null;
        if(!totalGrams || totalGrams <= 0){
          return { sonuc:{ yemek:f.name, toplam_gram:null, paylar:[], etiket:'veri yok' }, satirlar:['Tencere toplam gramı belirtilmemiş (veri yok; kaç gram?).'] };
        }

        const list = M().householdList();
        const me = SP.S.profile;
        const members = list.map(row => row.id === (me && me.id) ? Object.assign({}, me, { self:true, weightKg:(M().kiloOf(me) || {}).kg || null }) : Object.assign({ self:false, weightKg:null, heightCm:null }, row));
        const res = SP.Nutri && SP.Nutri.householdSplit ? SP.Nutri.householdSplit(fid, totalGrams, members) : { ok:false, error:'Nutri modülü yok' };
        if(!res.ok){
          return { sonuc:{ yemek:f.name, toplam_gram:totalGrams, paylar:[], hata:res.error, etiket:'veri yok' }, satirlar:['Mutfak paylaştırması: ' + res.error + ' (veri yok)'] };
        }
        const paylar = res.rows.map(r => ({ ad:r.member.name || 'Adsız', gram:r.share, kcal:Math.round(r.gets.kcal), protein:Math.round(r.gets.protein) }));
        return {
          sonuc:{ yemek:res.food.name, toplam_gram:res.totalGrams, paylar },
          satirlar:[res.food.name + ' · ' + res.totalGrams + ' g'].concat(paylar.map(r => r.ad + ': ' + r.gram + ' g (≈ ' + r.kcal + ' kcal, ' + r.protein + ' g protein)'))
        };
      }
    };
  }

  function liste(){
    return [
      { ad:'spi_gun_kaydi', tur:'oku', aciklama:'Bir günün SPİ kaydı: uyku, su, kilo, his, öğünler ve antrenmanlar.',
        ornek:'dünün özet kaydı', anahtar:'günlük günlüğüm döküm ajanda kaydettiklerim özet',
        parametreler:{ type:'object', properties:{ tarih:gun } }, calistir:gunKaydi },
      { ad:'spi_uyku', tur:'oku', aciklama:'Son günlerin uyku saatleri ve ortalaması (kaydı olmayan gece boş kalır).',
        es:/(uykum nasıl|uyku ortalamam|kaç saat uyu(?:dum|muşum)|ortalama .*uyu|uyku.*dağılım)/, ornek:'haftalık uyku ortalamam',
        anahtar:'süre dağılım uykular dinlenme gece saat',
        parametreler:{ type:'object', properties:{ gun:sayiGun(60, 7) } }, calistir:uyku },
      { ad:'spi_antrenmanlar', tur:'oku', aciklama:'Son günlerin antrenman kayıtları.', ornek:'son antrenmanlarım',
        anahtar:'koşu koşular idman egzersiz seans spor hafta yapılan',
        parametreler:{ type:'object', properties:{ gun:sayiGun(90, 14) } }, calistir:antrenmanlar },
      { ad:'spi_tahliller', tur:'oku', aciklama:'Son tahlillerin değerleri ve referans aralıkları (yorum ve teşhis yok).', ornek:'son tahlillerim',
        parametreler:{ type:'object', properties:{ limit:{ type:'integer', minimum:1, maximum:10 } } }, calistir:tahliller },
    ].concat(
      barkodAraclari(),
      bolum(),
      [
        antrenmanSilAraci(),
        ogunSilAraci(),
        tahlilSilAraci(),
        ilacAraci(),
        gidaAraci(),
        marketAraci(),
        butceAraci(),
        kararKapatAraci(),
        profilAraci(),
        planlarAraci(),
        hedeflerAraci(),
        mutfakAraci(),
      ],
      haneAraclari()
    ).map(a => Object.assign(a, KURAL[a.ad] || {}));
  }

  /* KING-4 A3 hızlı yol: okuma sorusu sayfa açmaz; besin ve barkod cümleden okunur. */
  const yemekBul = w => [w.replace(/['’]?n?[ıiuü]n$/, ''), w.replace(/['’]?n?[dt][ae]$/, ''), w.replace(/s[ıiuü]n?[dt][ae]$/, ''), w]
    .map(x => x.trim()).find(x => x.length >= 2 && SP.Parse && SP.Parse.matchFood && SP.Parse.matchFood(x)) || null;
  const BOLUMLER = [
    { id:'basket', adlar:['market sepeti', 'sepet', 'finans', 'bütçe', 'butce', 'para'] },
    { id:'labs', adlar:['tahlil', 'tahliller', 'test', 'testler', 'laboratuvar'] },
    { id:'kitchen', adlar:['mutfak kileri', 'mutfak', 'kiler', 'tarif'] },
    { id:'meals', adlar:['öğünler', 'öğün', 'ogunler', 'ogun', 'beslenme', 'besin'] },
    { id:'move', adlar:['hareket', 'antrenman', 'spor', 'egzersiz', 'koşu'] },
    { id:'rutbe', adlar:['rütbe', 'rutbe', 'seviye', 'xp'] },
    { id:'planlar', adlar:['planlar', 'plan'] },
    { id:'hedefler', adlar:['hedefler', 'hedef'] },
    { id:'today', adlar:['genel bakış', 'bugün', 'bugun'] },
    { id:'office', adlar:['masalar', 'masa', 'ofis'] },
    { id:'guide', adlar:['genel', 'rehber'] },
    { id:'family', adlar:['profil', 'hane', 'aile'] },
    { id:'analytics', adlar:['analiz'] },
  ];
  const KURAL = {
    spi_gun_kaydi:{ es:/((?:dün|bugün|evvelsi gün) ne (?:yedim|yemişim|içtim)|günün kaydı|neler kaydet|günlüğüm)/ },
    spi_antrenmanlar:{ es:/(son antrenman|antrenmanlarım|antrenman geçmiş|kaç antrenman|koşularım|koşu süresi)/ },
    spi_tahliller:{ es:/(tahlil(?:ler)?im|tahlil sonuç|kaç çıkmış)/ },
    spi_besin:{ kural:t => {
      const m = /^(?:100 ?(?:gram|gr|g) )?(.+?) (?:besin|kalori|protein|yağ|karbonhidrat)(?: (?:ve|ile) (?:besin|kalori|protein|yağ|karbonhidrat))? değer/.exec(t) || /^(?:100 ?(?:gram|gr|g) )?(.+?) besin değer/.exec(t) || /^(?:100 ?(?:gram|gr|g) )?(.+?) kaç (?:gram )?(?:protein|kalori|kcal|yağ|karbonhidrat)/.exec(t);
      const ad = m && yemekBul(m[1]);
      return ad ? { besin:ad } : null; } },
    spi_barkod:{ kural:t => { const m = /(?:^|\s)(\d{8}|\d{12,13})(?=\s|$)/.exec(t);
      return m && /barkod/.test(t) && !/(yedim|içtim|ekle)/.test(t) ? { kod:m[1] } : null; } },
    spi_barkod_ogun:{ kural:t => {
      const bk = /(?:^|\s)(\d{8}|\d{12,13})(?=\s|$)/.exec(t);
      if(!bk || !/barkod/.test(t) || !/(yedim|içtim|ekle|öğün)/.test(t)) return null;
      const res = { kod:bk[1] };
      const gm = /(\d+(?:[.,]\d+)?)\s*(?:gram|gr|g)(?!\w)/.exec(t);
      if(gm) res.gram = Number(gm[1].replace(',', '.'));
      const og = /(kahvalt\w*|öğle\w*|ogle\w*|akşam\w*|aksam\w*|ara öğün\w*|ara\w*|gece\w*)/.exec(t);
      if(og){
        const o = og[1];
        if(/kahvalt/.test(o)) res.ogun = 'kahvaltı';
        else if(/ogle|öğle/.test(o)) res.ogun = 'öğle';
        else if(/aksam|akşam/.test(o)) res.ogun = 'akşam';
        else if(/ara/.test(o)) res.ogun = 'ara';
      }
      return res;
    } },
    spi_bolum_ac_kapa:{ kural:t => {
      if(!/bölüm|bolum/.test(t)) return null;
      const kapat = /(kapat|kapansın|gizle|gizlensin|kaldır|kullanmıyorum)/.test(t);
      const ac = !kapat && /(?:^|\s)(aç|açılsın|göster|geri getir)(?:$|\s)/.test(t);
      if(!kapat && !ac) return null;
      for(const b of BOLUMLER){
        if(b.adlar.some(a => t.includes(a))) return { bolum:b.id, acik:kapat ? 0 : 1 };
      }
      return null;
    } },
    spi_butce:{ es:/(haftalık sepet|market bütçe|bütçem nasıl)/ },
    spi_planlar:{ es:/(haftalık plan|planlarım|haftalık programım)/ },
    spi_hedefler:{ es:/(sağlık hedef|hedeflerim|kilo hedef)/ },
    spi_hane_oku:{ es:/(hane üyeleri|hanede kimler var|aile profilleri)/ },
  };

  return { liste, barkodBul };
})();
