/* ÖĞRETME MOTORU — AYS, SPİ ve ESP'nin tek öğretmeni (KING-4 §D, tur 4b).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ogret.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Testi `ogret.test.js`.
   ==================================================================

   Önce: her modül kendi soru kartını, konu eşleştiricisini, çeldiricisini ve
   (yalnız AYS'de) 1/3/7 gün takvimini yazıyordu. Şimdi modül yalnız kendi
   verisini verir (sorular, kavramlar, geçmiş); karar burada.

   Sözler:
   1. TEŞHİS KURALLA, UYDURMA YOK (AGENTS §1). Yanlış cevabın türü dört
      tanedir: kavram, işlem, dikkat, bilmiyor. Her tür bir kurala ve
      modülün verdiği kanıta dayanır (önce doğru yapmıştın → dikkat; seçtiğin
      sayı doğrunun ters işaretlisi, bir fazlası/eksiği, iki katı/yarısı ya
      da bir basamak kayığı → işlem; konuda iki ve üstü
      yanlış → kavram; kart hiç bilinmemiş → bilmiyor; modülün kendi etiketi).
      Kanıt yoksa tür null ve «teşhis için veri yetmiyor»: tahmin edilmez.
   2. SOKRATİK ANLATIM. Kod teşhis satırını ve yönlendiren soruyu kurar;
      doğru cevap ve sayılar modülün verisidir. Model yalnız cümleyi
      güzelleştirir (`neden_yanlis` aracı sonucu Merkez'e gider, HKM sayıyı
      denetler); model yoksa kodun satırları aynen gösterilir.
   3. 1/3/7 GÜN, KAVRAM KAPANIR. Yanlış → kavram yarın; tekrarda doğru → 3,
      sonra 7 gün; üçüncü doğruda kavram kapanır (`bitti`, silinmez). Vadesi
      gelen kavramda AYNI soru değil BENZERİ sorulur (`benzer`).
   4. ESKİ VERİ KAYBOLMAZ. Kayıt biçimi AYS'nin `ays.king.tekrar`ı ve King
      derslerinin `{ n, sonraki | bitti }` biçimiyle aynıdır. Soru kimliğiyle
      tutulan eski kayıt `tasi` ile kavram kimliğine toplanır; ilk göçten önce
      ham değer `<anahtar>.yedek`'e bir kez yazılır, soru kimlikleri
      `ogeler`'de kalır.

   Kayıt: { [kavram]: { n, sonraki:'YYYY-AA-GG' | bitti:'YYYY-AA-GG', ogeler?:[soruId], y?:yanlış sayısı, eski? } } */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.OGRET = (function(){
  'use strict';

  const ARALIK = [1, 3, 7];
  const TURLER = { kavram:'kavram yanılgısı', islem:'işlem hatası', dikkat:'dikkat hatası', bilmiyor:'henüz bilmiyordun' };
  const HARF = 'ABCDE';
  const DOLGU = /^(konu|konusu|konusunda|konudan|soru|sorusu|hakkında|ilgili|bana|bir|biraz)$/;

  const kucuk = s => String(s == null ? '' : s).toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
  function gunEkle(iso, n){
    const p = String(iso).split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2] + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------- konu eşleştirme (önce üç kingDers'te ve kingSoru'da ayrı ayrıydı) ----------
     adlar(x): öğenin adları, ilki başlık. Sıra: başlık aynen → metin adı içerir → ad metni içerir →
     metnin her anlamlı kelimesinin kökü başlıkta → (gevsek) uzun bir kelime bir adda. */
  function bul(liste, metin, adlar, o){
    const t = kucuk(metin).replace(/[.,!?;:«»"']/g, ' ').replace(/\s+/g, ' ').trim();
    if(t.length < 3 || !Array.isArray(liste)) return null;
    const ad = x => (adlar(x) || []).map(kucuk).filter(Boolean);
    const kok = w => w.slice(0, Math.max(4, w.length - 2));
    const kelime = t.split(' ').filter(w => w.length > 3 && !DOLGU.test(w));
    return liste.find(x => ad(x)[0] === t)
      || liste.find(x => ad(x).some(a => t.includes(a))) || liste.find(x => ad(x).some(a => a.includes(t)))
      || (kelime.length ? liste.find(x => kelime.every(w => (ad(x)[0] || '').includes(kok(w)))) : null)
      || (o && o.gevsek ? liste.find(x => kelime.some(w => w.length > 4 && ad(x).some(a => a.includes(w)))) : null)
      || null;
  }

  /* ---------- çoktan seçmeli: doğru + farklı çeldiriciler, karışık ----------
     Çeldirici yetmezse null (açık uçlu kalır, uydurulmaz). */
  function secenek(dogru, havuz, o){
    o = o || {};
    const n = o.n || 3, rastgele = o.rastgele || Math.random, d = String(dogru == null ? '' : dogru).trim();
    if(!d) return null;
    const cel = [];
    karistir((havuz || []).map(x => String(x == null ? '' : x).trim()), rastgele)
      .forEach(x => { if(x && x !== d && cel.length < n && cel.indexOf(x) < 0) cel.push(x); });
    if(cel.length < (o.enAz || n)) return null;
    const sec = karistir(cel.concat([d]), rastgele);
    return { sec, dogru:HARF[sec.indexOf(d)] };
  }
  function karistir(l, rastgele){
    const a = l.slice();
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor((rastgele || Math.random)() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- yanılgı teşhisi (söz 1) ----------
     g: { secilen, dogru, secMetin, dogruMetin, oncekiDogru, oncekiNeden, konuYanlis, yeni, yeniNeden, etiket, etiketNeden } */
  function sayi(s){
    const m = String(s == null ? '' : s).replace(/\s+/g, '').match(/^[^\d-]*(-?\d+(?:[.,]\d+)?)(?:\/(\d+))?[^\d]*$/);
    if(!m) return null;
    const v = Number(m[1].replace(',', '.')) / (m[2] ? Number(m[2]) : 1);
    return isFinite(v) ? v : null;
  }
  function islemMi(a, b){
    const x = sayi(a), y = sayi(b);
    if(x == null || y == null || x === y) return false;
    if(x === -y || Math.abs(x - y) === 1) return true;              // işaret, bir eksik/fazla
    const o = x / y;
    return [2, 0.5, 10, 0.1].some(k => Math.abs(o - k) < 1e-9);     // iki kat, yarım, basamak kayması
  }
  function teshis(g){
    g = g || {};
    const t = (tur, neden) => ({ tur, ad:tur ? TURLER[tur] : '', neden });
    if(g.secilen == null || String(g.secilen).trim() === '') return t('bilmiyor', 'cevap verilmedi');
    if(String(g.secilen).toUpperCase() === String(g.dogru).toUpperCase()) return t(null, 'cevap doğru');
    if(g.oncekiDogru) return t('dikkat', g.oncekiNeden || 'bu soruyu daha önce doğru yapmıştın');
    if(islemMi(g.secMetin, g.dogruMetin)) return t('islem', 'seçtiğin «' + String(g.secMetin).trim() + '» doğru sonuca yakın; yöntem tutuyor, işlem kaymış');
    if(Number(g.konuYanlis) >= 2) return t('kavram', 'bu konuda ' + Number(g.konuYanlis) + ' yanlışın var');
    if(g.yeni) return t('bilmiyor', g.yeniNeden || 'bunu henüz hiç doğru cevaplamadın');
    if(TURLER[g.etiket]) return t(g.etiket, g.etiketNeden || 'modülün kaydındaki etiket');
    return t(null, 'teşhis için veri yetmiyor');
  }

  /* ---------- Sokratik satırlar (söz 2): yalnız verilen bilgiden ---------- */
  function sokratik(g, ts){
    ts = ts || teshis(g);
    if(!ts.tur) return [];
    const konu = String(g.konu || 'bu konu').trim(), sec = String(g.secMetin == null ? '' : g.secMetin).trim();
    const soru = {
      kavram:'Kendine sor: «' + konu + '» konusunun temel kuralı bu soruda neyi söylüyor?',
      islem:'İşlemi adım adım yeniden yap: hangi adımda' + (sec ? ' «' + sec + '»' : ' farklı bir sonuç') + ' çıktı?',
      dikkat:'Soru kökünü yeniden oku: ne soruluyor, sen neyi cevapladın?',
      bilmiyor:'Önce konunun özetine kısaca bak, sonra benzer soruyu yeniden dene.',
    }[ts.tur];
    return ['Teşhis: ' + ts.ad + ' (' + ts.neden + ').', soru];
  }

  /* ---------- kayıt (söz 3, 4) ---------- */
  function depo(anahtar, ls){
    const L = () => ls || (typeof localStorage !== 'undefined' ? localStorage : null);
    return {
      anahtar,
      oku(){ try{ const v = JSON.parse(L().getItem(anahtar) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }catch(e){ return {}; } },
      yaz(v){ try{ L().setItem(anahtar, JSON.stringify(v)); return true; }catch(e){ return false; } },
      yedekle(v){ try{ if(L().getItem(anahtar + '.yedek') == null) L().setItem(anahtar + '.yedek', JSON.stringify(v)); }catch(e){ /* yer yok */ } },
    };
  }
  const birlesim = (a, b) => (a || []).concat(b || []).filter((x, i, l) => x != null && l.indexOf(x) === i);
  function birlestir(a, b){
    if(!a) return b;
    const og = birlesim(a.ogeler, b.ogeler);
    if(a.bitti && b.bitti) return Object.assign({}, a, { bitti:a.bitti > b.bitti ? a.bitti : b.bitti, ogeler:og });
    if(a.bitti || b.bitti) return Object.assign({}, a.bitti ? b : a, { ogeler:og });
    const r = { n:Math.min(a.n || 0, b.n || 0), sonraki:String(a.sonraki) < String(b.sonraki) ? a.sonraki : b.sonraki, ogeler:og };
    if(a.y || b.y) r.y = (a.y || 0) + (b.y || 0);
    if(a.eski && b.eski) r.eski = true;
    return r;
  }
  /* Soru kimliğiyle tutulan eski kaydı kavram kimliğine toplar. Değişiklik
     varsa önce ham değer yedeklenir. Dönüş: yeni kayıt. */
  function tasi(d, kavramOf){
    const v = d.oku(), yeni = {};
    let degisti = false;
    Object.keys(v).forEach(k => {
      const x = v[k];
      if(!x || typeof x !== 'object') return;
      const kv = kavramOf ? kavramOf(k) : k;
      if(!kv || kv === k){ yeni[k] = birlestir(yeni[k], x); return; }
      degisti = true;
      yeni[kv] = birlestir(yeni[kv], Object.assign({}, x, { ogeler:birlesim([k], x.ogeler) }));
    });
    if(degisti){ d.yedekle(v); d.yaz(yeni); }
    return degisti ? yeni : v;
  }
  function isle(d, kavram, isabet, bugun, oge){
    const v = d.oku(), k = v[kavram];
    let not = '', kapandi = false;
    if(!isabet){
      v[kavram] = { n:0, sonraki:gunEkle(bugun, ARALIK[0]), ogeler:birlesim(k && k.ogeler, oge == null ? [] : [oge]), y:((k && k.y) || 0) + 1 };
      not = 'Yarın bu konudan benzer bir soru soracağım.';
    }else if(k && !k.bitti){
      const n = (k.n || 0) + 1;
      const ek = Object.assign({ ogeler:k.ogeler || [] }, k.y ? { y:k.y } : {});
      if(n >= ARALIK.length){ v[kavram] = Object.assign({ n, bitti:bugun }, ek); kapandi = true; not = 'Tekrarları tamamladın; bu konu kapandı.'; }
      else{ v[kavram] = Object.assign({ n, sonraki:gunEkle(bugun, ARALIK[n]) }, ek); not = ARALIK[n] + ' gün sonra bir kez daha soracağım.'; }
    }else return { kayit:k || null, not, kapandi };
    d.yaz(v);
    return { kayit:v[kavram], not, kapandi };
  }
  function vade(d, bugun){
    const v = d.oku();
    return Object.keys(v).filter(k => v[k] && !v[k].bitti && v[k].sonraki && String(v[k].sonraki) <= bugun)
      .sort((a, b) => String(v[a].sonraki).localeCompare(String(v[b].sonraki)))
      .map(k => Object.assign({ kavram:k }, v[k]));
  }
  function ozet(d, bugun){
    const v = d.oku(), l = Object.keys(v).map(k => v[k]).filter(Boolean);
    return { vade:vade(d, bugun).length, acik:l.filter(x => !x.bitti).length, kapanan:l.filter(x => x.bitti).length };
  }
  /* Vadesi gelen kavramda sorulacak soru: yanlış yapılanlardan değil, aynı
     kavramın başka bir sorusu; yoksa yanlış yapılanlardan sırayla. */
  function benzer(adaylar, kayit){
    const l = (adaylar || []).filter(x => x != null);
    if(!l.length) return null;
    const og = (kayit && kayit.ogeler) || [], n = (kayit && kayit.n) || 0;
    const yeni = l.filter(x => og.indexOf(x) < 0), eski = l.filter(x => og.indexOf(x) >= 0);
    return yeni.length ? yeni[n % yeni.length] : eski[n % eski.length];
  }

  /* ---------- tek cevap akışı: kayıt + teşhis + son yanlış ----------
     a: { tekrar:depo, son:depo, bugun?:()=>iso }; g: teshis girdisi + { id, kavram, konu, soru, cozum } */
  function cevap(a, g){
    const bugun = a.bugun ? a.bugun() : isoBugun();
    const isabet = g.secilen != null && String(g.secilen).toUpperCase() === String(g.dogru).toUpperCase();
    /* Kaydın kendisi de kanıttır: tekrarda doğru yapılmış ya da kapanmış konu → dikkat; birikmiş yanlış → kavram. */
    const k = a.tekrar.oku()[g.kavram];
    if(k && !g.oncekiDogru && (k.bitti || k.n > 0)) g = Object.assign({}, g, { oncekiDogru:true, oncekiNeden:k.bitti ? 'bu konuyu tekrarlarla kapatmıştın' : 'bu konunun tekrarında ' + k.n + ' kez doğru yapmıştın' });
    if(k && k.y) g = Object.assign({}, g, { konuYanlis:Math.max(Number(g.konuYanlis) || 0, k.y + 1) });
    const r = isle(a.tekrar, g.kavram, isabet, bugun, g.id);
    if(isabet) return { isabet, not:r.not, kapandi:r.kapandi, teshis:null, satirlar:[] };
    const ts = teshis(g), satirlar = sokratik(g, ts);
    if(a.son) a.son.yaz({ id:g.id, kavram:g.kavram, konu:g.konu || '', soru:String(g.soru || '').slice(0, 400),
      secilen:g.secilen, secMetin:g.secMetin == null ? '' : String(g.secMetin), dogru:g.dogru, dogruMetin:g.dogruMetin == null ? '' : String(g.dogruMetin),
      tur:ts.tur, neden:ts.neden, cozum:(g.cozum || []).map(String).slice(0, 4), satirlar, gun:bugun });
    return { isabet, not:r.not, kapandi:false, teshis:ts, satirlar };
  }
  function isoBugun(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /* ---------- King araçları (arac.js biçimi): «bugünkü tekrarlarım», «neden yanlış yaptım» ----------
     o: { modul, tekrar:depo, son:depo, ad:kavram=>okunur ad, bugun?:()=>iso } */
  function araclar(o){
    const bugun = () => o.bugun ? o.bugun() : isoBugun();
    const adi = k => { try{ return (o.ad && o.ad(k)) || k; }catch(e){ return k; } };
    return [
      { ad:o.modul + '_tekrarlarim', tur:'oku', ozetAd:'Bugünkü tekrarlar', ornek:'bugünkü tekrarlarım',
        anahtar:'tekrarlarım tekrarlarımı vadesi gelen konular',
        aciklama:'Öğretme motorunun bugünkü tekrarları: yanlış yapılan konular 1, 3 ve 7 gün sonra benzer soruyla sorulur; vadesi gelen ve kapanan konular.',
        calistir:() => {
          const b = bugun(), l = vade(o.tekrar, b), oz = ozet(o.tekrar, b);
          const satirlar = l.slice(0, 8).map(x => adi(x.kavram) + ' · ' + (x.n + 1) + '. tekrar');
          return { sonuc:{ bugun:b, vadesi_gelen:l.map(x => ({ konu:adi(x.kavram), tekrar:x.n + 1 })), acik:oz.acik, kapanan:oz.kapanan },
            cevap:l.length ? 'Bugün ' + l.length + ' konunun tekrarı var; «bana soru sor» dersen sırayla sorarım.'
              : 'Bugün vadesi gelen tekrarın yok' + (oz.acik ? ' (' + oz.acik + ' konu takvimde bekliyor).' : '.'),
            satirlar:satirlar.length ? satirlar : null };
        } },
      { ad:o.modul + '_neden_yanlis', tur:'oku', ozetAd:'Son yanlışın teşhisi', ornek:'neden yanlış yaptım',
        anahtar:'neden yanlış yanlışımın nedeni nerede hata yaptım',
        aciklama:'King\'le çözülen son yanlış sorunun teşhisi (kavram, işlem, dikkat ya da bilmiyor) ve kuralı; doğru cevap ve sayılar modülün verisi. Cevabı Sokratik kur: önce yönlendiren soru, doğru cevabı değiştirme.',
        calistir:() => {
          const s = o.son.oku();
          if(!s || !s.id) return { cevap:'King\'le çözdüğün yanlış bir soru yok; önce «bana soru sor» de.' };
          const satirlar = [s.konu ? s.konu + ': ' + s.soru : s.soru, 'Senin cevabın ' + s.secilen + (s.secMetin ? ' («' + s.secMetin + '»)' : '') + ', doğrusu ' + s.dogru + (s.dogruMetin ? ' («' + s.dogruMetin + '»)' : '') + '.']
            .concat(s.satirlar && s.satirlar.length ? s.satirlar : ['Teşhis: ' + s.neden + '.']).concat(s.cozum || []);
          return { sonuc:{ konu:s.konu, soru:s.soru, senin_cevabin:s.secilen, dogru_cevap:s.dogru, tur:s.tur, neden:s.neden, cozum:s.cozum, gun:s.gun,
            yontem:'Sokratik: önce bir yönlendiren soru, sonra kısa açıklama; doğru cevabı ve sayıları aynen kullan' }, satirlar };
        } },
    ];
  }

  return { ARALIK, TURLER, bul, secenek, karistir, sayi, teshis, sokratik, depo, tasi, isle, vade, ozet, benzer, cevap, araclar, gunEkle };
})();
