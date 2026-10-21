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
    { ad:'spi_besin', tur:'oku', aciklama:'SPİ’nin gıda tablosunda bir gıdanın 100 gramlık besin değeri ve ev ölçüleri.', ornek:'yulafın besin değeri',
      parametreler:{ type:'object', properties:{ besin:{ type:'string', maxLength:60 } }, required:['besin'] }, calistir:besin },
    { ad:'spi_barkod', tur:'oku', aciklama:'Barkod numarasıyla ürünün besin değeri: önce kişisel barkod defteri, yoksa Open Food Facts (kaynak etiketiyle).',
      ornek:'4006381333931 barkodu ne', parametreler:{ type:'object', properties:{ kod:kodSema }, required:['kod'] }, calistir:barkodOku },
    { ad:'spi_barkod_ogun', tur:'yaz', ozetAd:'Barkodlu ürünü öğüne ekle', ornek:'4006381333931 barkodlu üründen 40 gram yedim',
      aciklama:'Barkodlu ürünü bugünün öğününe ekler; gram kullanıcının cümlesinden ya da etiketteki porsiyondan. Ürün tabloda yoksa gıda olarak eklenir ve barkod bağlanır.',
      parametreler:{ type:'object', properties:{ kod:kodSema, gram:{ type:'number', minimum:1, maximum:2000, description:'yenen gram (kullanıcı söylediyse)' },
        ogun:{ type:'string', maxLength:20, description:'öğün (kahvaltı, öğle, akşam…); boşsa şu anki' } }, required:['kod'] },
      onizle:barkodOnizle, uygula:barkodUygula },
  ];

  function liste(){
    return [
      { ad:'spi_gun_kaydi', tur:'oku', aciklama:'Bir günün SPİ kaydı: uyku, su, kilo, his, öğünler ve antrenmanlar.',
        ornek:'dün ne yedim',
        parametreler:{ type:'object', properties:{ tarih:gun } }, calistir:gunKaydi },
      { ad:'spi_uyku', tur:'oku', aciklama:'Son günlerin uyku saatleri ve ortalaması (kaydı olmayan gece boş kalır).',
        es:/(uykum nasıl|uyku ortalamam)/, ornek:'son bir haftada uykum nasıl',
        parametreler:{ type:'object', properties:{ gun:sayiGun(60, 7) } }, calistir:uyku },
      { ad:'spi_antrenmanlar', tur:'oku', aciklama:'Son günlerin antrenman kayıtları.', ornek:'son antrenmanlarım',
        parametreler:{ type:'object', properties:{ gun:sayiGun(90, 14) } }, calistir:antrenmanlar },
      { ad:'spi_tahliller', tur:'oku', aciklama:'Son tahlillerin değerleri ve referans aralıkları (yorum ve teşhis yok).', ornek:'son tahlillerim',
        parametreler:{ type:'object', properties:{ limit:{ type:'integer', minimum:1, maximum:10 } } }, calistir:tahliller },
    ].concat(barkodAraclari(), bolum());
  }

  return { liste, barkodBul };
})();
