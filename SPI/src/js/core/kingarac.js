/* KING ARAÇLARI — SPİ'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: günün kaydı, uyku, antrenman ve tahliller; sayıyı SPİ'nin kendi
   kaydı ve hesabı verir. Kaydı olmayan gün «veri yok»tur, sıfır değil
   (AGENTS §1.2). SPİ teşhis koymaz, doz önermez (§1.5): tahlil aracı yalnız
   değeri ve referans aralığını verir, yorum yapmaz.

   Yazma: ölçüm (uyku, su, öğün, antrenman, kısa uyku, tahlil) King'in
   `kayit_gir` aracıyla SPİ'nin kendi ayrıştırıcısından girer (SP.Quick,
   SP.Hazir): sayı kullanıcının cümlesindendir. Burada yalnız öneri
   kataloğunun ölçüm yazmayan eylemi (bölüm aç/gizle) durur; öneri kuyruğuna
   girer ve aynı doğrulama, anlık görüntü ve geri almayla onaylanır. */

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
    ].concat(bolum());
  }

  return { liste };
})();
