/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/seri.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* SERİ DONDURMA ve TATİL MODU — dondurulmuş günler (fikir 50, 56).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/seri.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır.

   Hasta olduğun gün ya da tatil haftası, bir alışkanlık serisini
   kırmamalı: seriyi kıran şey vazgeçmektir, hastalık değil. Ama dondurma
   bir BAHANE makinesi de olmamalı.

   Sözler:
     1. KULLANICI İŞARETLER. Sistem kendiliğinden gün dondurmaz; «dün de
        hastaydım» denebilir ama en çok GERI_GUN gün geriye.
     2. DONDURULAN GÜN SERİYİ BOZMAZ, SAYILMAZ DA. O gün kayıt girildiyse
        seri yine sayar; girilmediyse seri o günü atlar. «Donmuş» bir ölçüm
        değildir: veri yok gününe sıfır yazılmaz, «tamamlandı» da yazılmaz.
     3. SINIRLI. Tek kayıt en çok EN_UZUN gün; bir takvim ayında en çok
        AYLIK_HASTA hasta/izin günü (tatil ayrı sayılır, kendi sınırıyla).
        Ay dönümünü geçen kayıt DOKUNDUĞU HER AYIN sınırına bakar. Tatil
        bir takvim yılında en çok YILLIK_TATIL gün (HATALAR D-19: önce
        21 günlük tatiller art arda eklenebiliyordu). Bu sınır KULLANICININ
        ayarıdır (0–365; kullanıcı kararı 2026-09-24): düşürmek var olan
        kaydı silmez, yalnız yeni kaydı sınırlar.
     4. GERİ ALINIR. Her kayıt kimliğiyle silinir; geçmiş sessizce
        değişmez, «çöz» denince seri yeniden hesaplanır.
     5. HKM'YE YALNIZ TATİLİN TARİHİ GİDER (hedefag.js): tatildeyken HKM
        soru sormaz; dönüşte yük azaltma teklifi bırakır. Neden gitmez. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Seri = (function(){
  const NEDEN = { hasta:'Hasta', izin:'İzin', tatil:'Tatil' };
  const EN_UZUN = 21;
  const GERI_GUN = 7;
  const AYLIK_HASTA = 6;
  const YILLIK_TATIL = 2 * EN_UZUN;        /* 42 gün: iki tam tatil */
  const AY_AD = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
    'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const ANAHTAR = 'meta/seriDondurma';
  const DONUS_BILDIR = 3;

  function isoOku(iso){ const p = String(iso).split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function isoYaz(d){ return d.toISOString().slice(0, 10); }
  function gunEkle(iso, n){ const d = isoOku(iso); d.setUTCDate(d.getUTCDate() + n); return isoYaz(d); }
  function fark(a, b){ return Math.round((isoOku(b) - isoOku(a)) / 86400000); }
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  function gecerli(x){
    return x && typeof x.id === 'string' && ISO.test(x.bas || '') && ISO.test(x.bit || '')
      && x.bas <= x.bit && NEDEN[x.neden];
  }

  /* `kur({ store:() => Store, bugun:() => iso })` */
  function kur(o){
    let liste = [];
    let yillikAyar = null;                /* null: varsayılan YILLIK_TATIL */

    function gecerliSinir(n){ return Number.isInteger(n) && n >= 0 && n <= 365; }

    async function yukle(){
      try{
        const d = await o.store().get(ANAHTAR);
        liste = d && Array.isArray(d.liste) ? d.liste.filter(gecerli) : [];
        yillikAyar = d && gecerliSinir(d.yillikTatil) ? d.yillikTatil : null;
      }catch(e){ liste = []; yillikAyar = null; }
      return liste;
    }
    async function yaz(){
      const govde = { liste };
      if(yillikAyar != null) govde.yillikTatil = yillikAyar;
      await o.store().set(ANAHTAR, govde);
    }

    function yillikTatil(){ return yillikAyar == null ? YILLIK_TATIL : yillikAyar; }

    /* Küçük aksiyon: tek ayar, geri alınır (dönen `onceki` ile). */
    async function yillikTatilAyarla(n){
      if(!gecerliSinir(n)) return { ok:false, why:'Yıllık tatil sınırı 0 ile 365 arasında tam gün olmalı.' };
      const onceki = yillikTatil();
      yillikAyar = n;
      await yaz();
      return { ok:true, onceki, sinir:n };
    }

    function kayitOf(iso){ return liste.find(x => x.bas <= iso && iso <= x.bit) || null; }
    function donmusMu(iso){ return !!kayitOf(iso); }

    /* Bir dönemde (ay 'yyyy-aa' ya da yıl 'yyyy') verilen türden kaç gün donmuş. */
    function donemGunu(onek, tatilMi){
      let n = 0;
      liste.filter(x => (x.neden === 'tatil') === tatilMi).forEach(x => {
        for(let d = x.bas; d <= x.bit; d = gunEkle(d, 1)) if(d.indexOf(onek) === 0) n++;
      });
      return n;
    }

    /* Yeni kaydın dönemlere düşen günleri: { 'yyyy-aa' | 'yyyy': gün }. */
    function donemler(bas, bit, uzunluk){
      const out = {};
      for(let d = bas; d <= bit; d = gunEkle(d, 1)){
        const k = d.slice(0, uzunluk);
        out[k] = (out[k] || 0) + 1;
      }
      return out;
    }

    async function dondur(bas, bit, neden){
      const bugun = o.bugun();
      bit = bit || bas;
      if(!ISO.test(String(bas)) || !ISO.test(String(bit)) || bas > bit) return { ok:false, why:'Tarih geçersiz.' };
      if(!NEDEN[neden]) return { ok:false, why:'Neden hasta, izin ya da tatil olmalı.' };
      if(fark(bas, bugun) > GERI_GUN) return { ok:false, why:'En çok ' + GERI_GUN + ' gün geriye işaretlenebilir.' };
      const gun = fark(bas, bit) + 1;
      if(gun > EN_UZUN) return { ok:false, why:'Tek seferde en çok ' + EN_UZUN + ' gün.' };
      if(neden !== 'tatil' && neden !== 'izin' && gun > 3) return { ok:false, why:'Hasta günü tek seferde en çok 3 gün; daha uzunsa tatil/izin seç.' };
      for(let d = bas; d <= bit; d = gunEkle(d, 1)) if(donmusMu(d)) return { ok:false, why:d + ' zaten dondurulmuş.' };
      if(neden !== 'tatil'){
        /* Ay dönümünü geçen kayıt dokunduğu HER ayın sınırına bakar (D-19). */
        const aylar = donemler(bas, bit, 7);
        for(const ay of Object.keys(aylar)){
          if(donemGunu(ay, false) + aylar[ay] > AYLIK_HASTA){
            const ad = ay === bas.slice(0, 7) ? 'Bu ay' : AY_AD[Number(ay.slice(5, 7)) - 1] + ' ayında';
            return { ok:false, why:ad + ' en çok ' + AYLIK_HASTA + ' hasta/izin günü dondurulabilir.' };
          }
        }
      } else {
        const yillar = donemler(bas, bit, 4);
        const sinir = yillikTatil();
        for(const yil of Object.keys(yillar)){
          if(donemGunu(yil, true) + yillar[yil] > sinir){
            return { ok:false, why:yil + ' yılında en çok ' + sinir + ' tatil günü dondurulabilir; '
              + 'kalan: ' + kalanTatil(yil) + ' gün. Sınırı Tatil modu satırından değiştirebilirsin.' };
          }
        }
      }
      const kayit = { id:'sd-' + bas + '-' + Math.random().toString(36).slice(2, 7), bas, bit, neden,
        at:new Date().toISOString() };
      liste = liste.concat([kayit]);
      await yaz();
      return { ok:true, kayit, gun };
    }

    async function coz(id){
      const k = liste.find(x => x.id === id);
      if(!k) return { ok:false, why:'Kayıt bulunamadı.' };
      liste = liste.filter(x => x.id !== id);
      await yaz();
      return { ok:true, kayit:k };
    }

    /* Tatili bugün BİTİR: geçmiş günler donmuş kalır, yarın ve sonrası çözülür. */
    async function tatiliBitir(){
      const t = aktifTatil();
      if(!t) return { ok:false, why:'Etkin bir tatil yok.' };
      const bugun = o.bugun();
      if(t.bas >= bugun) liste = liste.filter(x => x !== t);
      else t.bit = gunEkle(bugun, -1) < t.bas ? t.bas : gunEkle(bugun, -1);
      await yaz();
      return { ok:true, kayit:t };
    }

    function kalanTatil(yil){
      return Math.max(0, yillikTatil() - donemGunu(String(yil || o.bugun().slice(0, 4)), true));
    }

    function aktifTatil(iso){
      const g = iso || o.bugun();
      return liste.find(x => x.neden === 'tatil' && x.bas <= g && g <= x.bit) || null;
    }

    /* HKM'ye giden: yalnız tatilin TARİHİ (hedefag.js) — etkin, yaklaşan ya da
       son DONUS_BILDIR gün içinde biten. Biteni de bildirmek gerekir: HKM
       dönüş sabahı yük azaltma teklifi bırakır; erken bitirilen tatilin
       yeni bitişini ancak böyle öğrenir. */
    function hkmTatil(){
      const g = o.bugun();
      const alt = gunEkle(g, -DONUS_BILDIR);
      const l = liste.filter(x => x.neden === 'tatil' && x.bit >= alt);
      const t = l.find(x => x.bas <= g && g <= x.bit)
        || l.filter(x => x.bas > g).sort((a, b) => a.bas.localeCompare(b.bas))[0]
        || l.sort((a, b) => b.bit.localeCompare(a.bit))[0];
      return t ? { bas:t.bas, bit:t.bit } : null;
    }

    return { yukle, dondur, coz, tatiliBitir, donmusMu, kayitOf, aktifTatil, hkmTatil,
      yillikTatil, yillikTatilAyarla, kalanTatil,
      liste:() => liste.slice(), gunEkle };
  }

  return { kur, NEDEN, EN_UZUN, GERI_GUN, AYLIK_HASTA, YILLIK_TATIL, ANAHTAR };
})();
