/* ALIŞKANLIK — hedef motorunun (brand/ortak/hedef.js) alışkanlık paketi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/aliskanlik.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   «Her gün 20 dakika kitap okuma alışkanlığı kazanmak istiyorum»,
   «haftada 3 gün düzenli spor yapmak istiyorum». Motor alanı bilmez;
   modül bu dosyaya iki şey verir: alanlarını (okuma, dil, hareket…) ve
   bir günün o alandaki ÖLÇÜLMÜŞ dakikasını (`dakika(alan, gün)`).

   Sözler:
   1. KARARI KOD VERİR. Taban modülün KENDİ kaydından ölçülür: son dört
      haftada o alanda hedef dakikayı tutan kayıtlı gün sayısı. İstenen
      sıklık tabandan en çok 2 gün/hafta fazlaysa «gerçekçi», 4'e kadar
      «zorlayıcı», ötesi «birden bu kadar artış zor». Bu artış kuralı bir iş
      kuralıdır ve kaynağı bağlanmadı: karar «tahmin»dir.
   2. KAYIT YOKSA KARAR YOK. Son dört haftada o alanda hiç kayıt yoksa taban
      bilinmez; «sıfır» sayılmaz, karar verilmez ve bu SÖYLENİR.
   3. İLERLEME KAYITTAN SAYILIR. «Bu hafta 3/5 gün» kayıtlı günlerdir;
      kaydı olmayan gün «yapılmadı» diye değil «kayıt yok» diye okunur.
   4. OTOMATİKLEŞME SÜRESİ SÖZ DEĞİLDİR. Kişiden kişiye çok değişir; hedef
      tarihi gelince alışkanlık «oldu» sayılmaz, sürdürülür. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Aliskanlik = (function(){
  const H = () => window.LIFEOS.Hedef;
  /* Açık alışkanlık sözü: «alışkanlık», «rutin», «düzenli». Yalnız «her gün»
     yetmez — «her gün 30 dakika çalışarak B2'ye» bir dil hedefidir. */
  const ANAHTAR = /(alışkanl|rutin|düzenli)/;
  const RAHAT = 2;             // gün/hafta artış — iş kuralı, kaynak bekliyor
  const UST = 4;
  const PENCERE_HAFTA = 4;
  const SAYI = '(\\d+(?:[.,]\\d+)?|yarım|bir|iki|üç|dört|beş|altı|yedi|on|on beş|yirmi|otuz|kırk|elli)';
  const SAYILAR = { 'yarım':0.5, bir:1, iki:2, 'üç':3, 'dört':4, 'beş':5, 'altı':6, yedi:7, on:10,
    'on beş':15, yirmi:20, otuz:30, 'kırk':40, elli:50 };

  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function sayi(t){
    const s = String(t || '').trim();
    if(/^\d/.test(s)) return Number(s.replace(',', '.'));
    return SAYILAR[s] != null ? SAYILAR[s] : null;
  }
  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 1 : n); return Math.round(x * k) / k; }
  function sayiYaz(x){ return String(yuvarla(x, 1)).replace('.', ','); }

  /* Sıklık: «her gün» 7, «hafta içi» 5, «hafta sonu» 2, «gün aşırı» 3,
     «haftada 4 gün / kez». Bulamazsa null — tahmin edilmez, sorulur. */
  function siklikOku(metin){
    const k = kucuk(metin);
    const h = new RegExp('haftada\\s+' + SAYI + '\\s*(gün|kez|kere|defa|sefer)').exec(k);
    if(h){ const n = sayi(h[1]); return n >= 1 && n <= 7 ? Math.round(n) : null; }
    if(/hafta\s*içi/.test(k)) return 5;
    if(/hafta\s*sonu/.test(k)) return 2;
    if(/gün\s*aşırı/.test(k)) return 3;
    if(/(her\s*gün|hergün|her\s+sabah|her\s+akşam|her\s+gece|günlük|her\s+öğle)/.test(k)) return 7;
    return null;
  }

  /* Her seferin süresi: «20 dakika», «yarım saat», «1 saat». */
  function dakikaOku(metin){
    const m = new RegExp(SAYI + '\\s*(dk|dakika|saat)').exec(kucuk(metin));
    if(!m) return null;
    const n = sayi(m[1]);
    if(n == null || n <= 0) return null;
    const dk = Math.round(m[2] === 'saat' ? n * 60 : n);
    return dk >= 1 && dk <= 600 ? dk : null;
  }

  function isoOku(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function gunEkle(iso, n){
    const d = isoOku(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
  }
  /* Pazartesi = 0. */
  function haftaGunu(iso){ return (isoOku(iso).getUTCDay() + 6) % 7; }

  /* `kur({ alanlar:[{ id, ad, kelime:RegExp }], dakika:(alanId, 'YYYY-MM-DD') => sayı|null })`
     → motor paketi + { ilerleme(h, bugun), ozet(h), alanOf(h) } */
  function kur(o){
    const alanlar = o.alanlar || [];

    function alanBul(metin){
      const k = kucuk(metin);
      return alanlar.find(a => a.kelime.test(k)) || null;
    }
    function alanOf(h){
      if(!h) return null;
      return alanlar.find(a => a.id === h.alan)
        || (h.cevaplar && h.cevaplar.alan ? alanBul(h.cevaplar.alan) : null);
    }
    function siklikOf(h){
      return (h.kapasite && h.kapasite.haftalik_gun)
        || (h.cevaplar && h.cevaplar.siklik ? siklikOku(h.cevaplar.siklik) : null) || null;
    }
    function dkOf(h){ return (h.kapasite && h.kapasite.gunluk_dk) || null; }

    /* O gün hedef dakikayı tutan bir kayıt var mı? Ölçülmemiş gün sayılmaz. */
    function tuttu(alan, iso, dk){
      const m = o.dakika(alan.id, iso);
      return m != null && m >= dk;
    }
    function kayitVar(alan, iso){
      const m = o.dakika(alan.id, iso);
      return m != null && m > 0;
    }

    /* Taban: dünden geriye dört hafta. Bugün yarım bir gündür, sayılmaz. */
    function taban(alan, dk, bugun){
      let tutan = 0, kayitli = 0;
      for(let i = 1; i <= PENCERE_HAFTA * 7; i++){
        const g = gunEkle(bugun, -i);
        if(kayitVar(alan, g)) kayitli++;
        if(tuttu(alan, g, dk)) tutan++;
      }
      return { tutan, kayitli, gunHafta:yuvarla(tutan / PENCERE_HAFTA, 1) };
    }

    function dayanak(t, alan, dk){
      return { durum:'kaynak_bekliyor', metin:'son ' + PENCERE_HAFTA + ' haftanın kaydı: ' + alan.ad
        + ' için ' + dk + '+ dakikalık ' + t.tutan + ' gün (ölçüldü); haftada en çok '
        + RAHAT + ' gün artış kuralı bir iş kuralıdır, kaynağı bağlanmadı' };
    }

    function karar(h, durum, bugun){
      const alan = alanOf(h), n = siklikOf(h), dk = dkOf(h);
      if(!alan) return { bant:null, etiket:'veri_yok', neden:'Hangi alışkanlık olduğu bilinmeden karar verilemez.' };
      if(!n) return { bant:null, etiket:'veri_yok', neden:'Haftada kaç gün olduğu bilinmeden karar verilemez.' };
      if(!dk) return { bant:null, etiket:'veri_yok', neden:'Her seferin süresi bilinmeden karar verilemez.' };
      if(h.son_tarih && h.son_tarih <= bugun) return { bant:null, etiket:'veri_yok', hata:'Hedef tarihi geçmişte.' };
      const t = taban(alan, dk, bugun);
      const ne = alan.ad + ': haftada ' + n + ' gün, her seferinde ' + dk + ' dakika';
      if(!t.kayitli){
        return { mod:'aliskanlik', bant:null, etiket:'veri_yok',
          neden:'Son ' + PENCERE_HAFTA + ' haftada ' + alan.ad + ' kaydın yok; tabanını bilmeden karar '
            + 'vermem (kayıt olmaması «hiç yapmadım» demek değildir). ' + ne + ' olarak kaydedebilirim; '
            + 'birkaç gün kayıt girince ilerlemeyi ölçerim.' };
      }
      const artis = yuvarla(n - t.gunHafta, 1);
      const bant = artis <= RAHAT ? 'gercekci' : artis <= UST ? 'zorlayici' : 'gercekci_degil';
      const tabanMetni = 'son ' + PENCERE_HAFTA + ' haftada ' + dk + '+ dakikalık kaydın haftada '
        + sayiYaz(t.gunHafta) + ' gün';
      const metin = {
        gercekci:'Bu alışkanlık gerçekçi görünüyor (' + ne + '): ' + tabanMetni + ', artış küçük.',
        zorlayici:'Bu alışkanlık zorlayıcı (' + ne + '): ' + tabanMetni + '. Kademeli başlamak daha kolay olabilir.',
        gercekci_degil:'Birden bu kadar artış zor (' + ne + '): ' + tabanMetni + '. Daha az günle başlayıp '
          + 'artırmak daha gerçekçi.',
      }[bant] + ' Bu karar tahmindir (dayanak: ' + dayanak(t, alan, dk).metin + ').';
      return { mod:'aliskanlik', bant, gerekli:n, tipik:t.gunHafta, ust:yuvarla(t.gunHafta + UST, 1),
        birim:'gün/hafta', dayanak:dayanak(t, alan, dk), etiket:'tahmin', metin, taban:t };
    }

    /* Kademeli seçenekler: tabanın 2 ve 4 gün fazlası (istenenden azsa). */
    function senaryolar(h, durum, bugun){
      const alan = alanOf(h), n = siklikOf(h), dk = dkOf(h);
      if(!alan || !n || !dk) return [];
      const t = taban(alan, dk, bugun);
      if(!t.kayitli) return [];
      const bas = Math.max(1, Math.round(t.gunHafta));
      const out = [];
      [[RAHAT, 'rahat artış'], [UST, 'zorlayıcı artış']].forEach(x => {
        const g = Math.min(7, bas + x[0]);
        if(g < n && !out.some(s => s.hiz === g)){
          out.push({ ad:'Haftada ' + g + ' gün (' + x[1] + ')', hiz:g, birim:'gün/hafta',
            son_tarih:h.son_tarih, kapasite:{ haftalik_gun:g } });
        }
      });
      return out;
    }

    /* Bu hafta (pazartesiden bugüne) ve son dört hafta: kayıtlı gün sayısı. */
    function ilerleme(h, bugun){
      const alan = alanOf(h), n = siklikOf(h), dk = dkOf(h);
      if(!alan || !n || !dk) return { durum:'veri_yok', metin:'Alışkanlığın alanı ya da sıklığı eksik.' };
      const hg = haftaGunu(bugun);
      const pzt = gunEkle(bugun, -hg);
      let bu = 0;
      for(let i = 0; i <= hg; i++) if(tuttu(alan, gunEkle(pzt, i), dk)) bu++;
      const onceki = [];
      for(let w = 1; w <= PENCERE_HAFTA; w++){
        let c = 0;
        for(let i = 0; i < 7; i++) if(tuttu(alan, gunEkle(pzt, -7 * w + i), dk)) c++;
        onceki.push(c);
      }
      let seri = 0;
      for(const c of onceki){ if(c >= n) seri++; else break; }
      const kalan = 6 - hg;
      const durum = bu >= n ? 'onde' : bu + kalan >= n ? 'yolunda' : 'geride';
      const metin = 'Bu hafta ' + bu + '/' + n + ' gün (' + dk + '+ dakikalık kayıt)'
        + (durum === 'geride' ? '; bu hafta hedef tutmayacak' : durum === 'onde' ? '; bu haftanın hedefi tuttu'
          : '; ' + (n - bu) + ' gün daha, ' + kalan + ' gün kaldı')
        + '. Önceki haftalar: ' + onceki.join(', ') + ' gün.'
        + (seri ? ' ' + seri + ' haftadır üst üste tuttu.' : '');
      return { durum, bu, hedef:n, onceki, seri, metin, etiket:'olculdu' };
    }

    function ozet(h){
      const alan = alanOf(h), n = siklikOf(h), dk = dkOf(h);
      return 'Alışkanlık: ' + (alan ? alan.ad : 'alan belirsiz') + (n ? ' · haftada ' + n + ' gün' : '')
        + (dk ? ' × ' + dk + ' dk' : '');
    }

    function notlar(h){
      return ['Alışkanlığın kendiliğinden olması kişiden kişiye çok değişir (bir çalışmada ortanca 66 gün, '
        + '18–254 gün aralığı; Lally ve ark., 2010 — kaynak henüz depoya bağlanmadı). Hedef tarihi '
        + 'gelince «oldu» sayılmaz; sürdürmek asıl iştir.'];
    }

    const paket = {
      id:o.id || 'aliskanlik', ad:'Alışkanlık', olcut:{ ad:'haftada gün', birim:'gün/hafta' },
      anahtar:ANAHTAR, yonler:['aliskanlik'], kapasiteGerekir:true,
      tani(k){
        const alan = alanBul(k), n = siklikOku(k), dk = dakikaOku(k);
        const kap = {};
        if(n) kap.haftalik_gun = n;
        if(dk) kap.gunluk_dk = dk;
        return { yon:'aliskanlik', alan:alan ? alan.id : null, birim:'gün/hafta',
          kapasite:Object.keys(kap).length ? kap : null };
      },
      tarihSoru:'Bu alışkanlığı ne zamana kadar sürdürmek istiyorsun? «8 hafta» ya da «3 ay» gibi yazabilirsin.',
      ekSorular(h){
        const out = [];
        if(!alanOf(h)){
          out.push({ alan:'alan', soru:'Hangi alışkanlık? ' + alanlar.map(a => a.ad).join(', ')
            + ' gibi yazabilirsin.' });
        }
        if(!siklikOf(h)){
          out.push({ alan:'siklik', soru:'Haftada kaç gün? «her gün» ya da «haftada 4 gün» gibi yazabilirsin.' });
        }
        return out;
      },
      karar, senaryolar,
    };

    /* Yarının işi (akşam «yarın şunlar var», HKM): bu haftanın hedefi
       henüz tutmadıysa bir satır. Yarın yeni hafta başlıyorsa sayaç sıfırdan. */
    function yarinIsi(h, bugun){
      const alan = alanOf(h), n = siklikOf(h), dk = dkOf(h);
      if(!alan || !n || !dk) return null;
      if(haftaGunu(bugun) === 6) return { metin:alan.ad + ' alışkanlığı (yeni hafta: 0/' + n + ' gün)', dk };
      const il = ilerleme(h, bugun);
      if(il.bu >= n) return null;
      return { metin:alan.ad + ' alışkanlığı (bu hafta ' + il.bu + '/' + n + ' gün)', dk };
    }

    return { paket, ilerleme, ozet, notlar, alanOf, siklikOf, taban, siklikOku, dakikaOku, yarinIsi };
  }

  return { kur, siklikOku, dakikaOku, ANAHTAR, RAHAT, UST, PENCERE_HAFTA };
})();
