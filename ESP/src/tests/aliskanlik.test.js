/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/aliskanlik.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Alışkanlık — hedef motorunun alışkanlık paketi (brand/ortak/aliskanlik.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/aliskanlik.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler:
     1. Cümle kuralla okunur: alan, sıklık ve süre; genel ayrıştırıcının
        vakti paketin okuduğuyla BİRLEŞİR, silinmez.
     2. Karar tabandan: son dört haftanın kaydı; artış kuralı «tahmin».
     3. Kayıt yoksa karar yok ve söylenir; «sıfır» sayılmaz.
     4. İlerleme kayıtlı günden sayılır; seçenek seçilince sıklık değişir. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const A = () => window.LIFEOS.Aliskanlik;
  const Hd = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';              // çarşamba

  /* Sahte kayıt: { 'YYYY-MM-DD': dakika } yalnız okuma alanı için. */
  function kur(kayit){
    return A().kur({
      alanlar:[{ id:'reading', ad:'Okuma', kelime:/(kitap|okuma)/ },
        { id:'music', ad:'Müzik', kelime:/(gitar|müzik)/ }],
      dakika:(alan, iso) => alan === 'reading' && kayit[iso] != null ? kayit[iso] : null,
    });
  }
  function gun(n){
    const d = new Date(Date.UTC(2026, 8, 23 + n));
    return d.toISOString().slice(0, 10);
  }
  /* Son 28 günde haftada `k` gün, her biri `dk` dakika. */
  function taban(k, dk){
    const out = {};
    for(let w = 0; w < 4; w++) for(let i = 0; i < k; i++) out[gun(-1 - w * 7 - i)] = dk;
    return out;
  }

  describe('Alışkanlık — cümleyi okumak', () => {
    it('sıklık ve süre kuralla okunur', () => {
      expect(A().siklikOku('her gün')).toBe(7);
      expect(A().siklikOku('haftada 3 gün')).toBe(3);
      expect(A().siklikOku('haftada dört kez')).toBe(4);
      expect(A().siklikOku('hafta içi')).toBe(5);
      expect(A().siklikOku('bazen')).toBe(null);
      expect(A().dakikaOku('20 dakika')).toBe(20);
      expect(A().dakikaOku('yarım saat')).toBe(30);
      expect(A().dakikaOku('1 saat')).toBe(60);
    });

    it('açık alışkanlık sözü olmayan cümle alışkanlık değildir', () => {
      expect(A().ANAHTAR.test('her gün 20 dakika kitap okuma alışkanlığı kazanmak istiyorum')).toBe(true);
      expect(A().ANAHTAR.test('haftada 3 gün düzenli spor yapmak istiyorum')).toBe(true);
      expect(A().ANAHTAR.test('her gün 30 dakika çalışarak b2 seviyesine çıkmak istiyorum')).toBe(false);
    });

    it('motor alışkanlığı alan, sıklık ve süreyle kurar; iki vakit birleşir', () => {
      const a = kur({});
      const t = Hd().cumleden('Her gün 20 dakika kitap okuma alışkanlığı kazanmak istiyorum', [a.paket], BUGUN);
      expect(t.paket).toBe('aliskanlik');
      expect(t.yon).toBe('aliskanlik');
      expect(t.alan).toBe('reading');
      expect(t.kapasite).toEqual({ haftalik_gun:7, gunluk_dk:20 });
      /* «haftada 3 gün» genel ayrıştırıcıdan, «30 dakika» paketten gelir. */
      const u = Hd().cumleden('Haftada 3 gün 30 dakika düzenli kitap okumak istiyorum', [a.paket], BUGUN);
      expect(u.kapasite).toEqual({ haftalik_gun:3, gunluk_dk:30 });
    });
  });

  describe('Alışkanlık — karar', () => {
    const h = (n, dk) => Object.assign(Hd().yeni({ paket:'aliskanlik', yon:'aliskanlik', alan:'reading',
      kapasite:{ haftalik_gun:n, gunluk_dk:dk } }, 'esp', BUGUN), { son_tarih:gun(56) });

    it('tabana yakın sıklık gerçekçi, büyük sıçrama değil; karar «tahmin»', () => {
      const a = kur(taban(2, 25));
      const g1 = Hd().gerceklik(h(3, 20), a.paket, {}, BUGUN);
      expect(g1.bant).toBe('gercekci');
      expect(g1.etiket).toBe('tahmin');
      expect(g1.tipik).toBe(2);
      expect(Hd().kararMetni(g1)).toContain('haftada 2 gün');
      expect(Hd().gerceklik(h(6, 20), a.paket, {}, BUGUN).bant).toBe('zorlayici');
      const g3 = Hd().gerceklik(h(7, 20), a.paket, {}, BUGUN);
      expect(g3.bant).toBe('gercekci_degil');
      /* Hedef dakikayı tutmayan gün tabana girmez: 25 dk kayıt, 30 dk hedef. */
      expect(Hd().gerceklik(h(3, 30), a.paket, {}, BUGUN).tipik).toBe(0);
    });

    it('kademeli seçenekler istenenden az günle, aynı süreyle', () => {
      const a = kur(taban(1, 30));
      const s = Hd().senaryolar(h(7, 20), a.paket, {}, BUGUN);
      expect(s.map(x => x.hiz)).toEqual([3, 5]);
      expect(s[0].kapasite).toEqual({ haftalik_gun:3 });
    });

    it('kayıt yoksa karar verilmez ve söylenir', () => {
      const a = kur({});
      const g = Hd().gerceklik(h(5, 20), a.paket, {}, BUGUN);
      expect(g.bant).toBe(null);
      expect(g.etiket).toBe('veri_yok');
      expect(Hd().kararMetni(g)).toContain('kaydın yok');
      expect(Hd().senaryolar(h(5, 20), a.paket, {}, BUGUN)).toHaveLength(0);
    });
  });

  describe('Alışkanlık — ilerleme ve sohbet', () => {
    it('bu hafta ve önceki haftalar kayıtlı günden sayılır', () => {
      /* Bu hafta: pazartesi ve bugün (çarşamba). Geçen hafta: üç gün; ondan
         önceki: bir gün, 10 dakika (hedefi tutmaz). */
      const k = {};
      k[gun(-2)] = 30; k[gun(0)] = 40;
      k[gun(-9)] = 25; k[gun(-7)] = 20; k[gun(-3)] = 45;
      k[gun(-12)] = 10;
      const a = kur(k);
      const h = Hd().yeni({ paket:'aliskanlik', yon:'aliskanlik', alan:'reading',
        kapasite:{ haftalik_gun:3, gunluk_dk:20 } }, 'esp', BUGUN);
      const il = a.ilerleme(h, BUGUN);
      expect(il.bu).toBe(2);
      expect(il.durum).toBe('yolunda');
      expect(il.etiket).toBe('olculdu');
      expect(il.metin).toContain('Bu hafta 2/3 gün');
      expect(il.onceki).toEqual([3, 0, 0, 0]);
      expect(il.seri).toBe(1);
      expect(a.ozet(h)).toBe('Alışkanlık: Okuma · haftada 3 gün × 20 dk');
    });

    it('sohbet eksik tarihi sorar, seçilen seçenekle sıklığı değiştirir', async () => {
      const a = kur(taban(1, 30));
      const kayit = [];
      const s = Hd().sohbetKur({ paketler:[a.paket], modul:'esp', bugun:() => BUGUN,
        kaydet:async x => kayit.push(x), notlar:x => a.notlar(x) });
      const r1 = await s.isle('Her gün 20 dakika kitap okuma alışkanlığı kazanmak istiyorum');
      expect(r1.text).toContain('ne zamana kadar sürdürmek');
      const r2 = await s.isle('8 hafta');
      expect(r2.text).toContain('Birden bu kadar artış zor');
      expect(r2.text).toContain('Lally');
      expect(r2.text).toContain('kendi sıklığınla');
      const r3 = await s.isle('1');
      expect(r3.hedef.durum).toBe('aktif');
      expect(r3.hedef.kapasite).toEqual({ haftalik_gun:3, gunluk_dk:20 });
      expect(r3.hedef.gerceklik.bant).toBe('gercekci');
    });
  });
})();
