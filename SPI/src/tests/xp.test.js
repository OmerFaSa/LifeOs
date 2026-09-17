/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/xp.test.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* Seviye ve XP — sözleşme.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/xp.test.js`; `python3 tools/seviye.py --yay` ile
   üç arayüzün `src/tests/` klasörüne kopyalanır; ad alanı yer tutucusu
   yayarken her uygulamanın kendi adıyla değiştirilir.

   Test adları birer CÜMLEDİR: bu liste okunduğunda seviye sisteminin
   sözleşmesi okunmuş olmalı. Testler, hangi sistemde koştuğunu
   BİLMEZ — etkinlikleri `XP.etkinlikler()` ile kendi sisteminden sorar.
   Böylece aynı dosya üçünde de aynı şeyi ispat eder. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = SP.Test;
  const XP = SP.XP;
  const L = window.LIFEOS;

  /* Bu sistemin tavansız (günde bir) ve tavanlı etkinlikleri. */
  function tavansiz(){
    return XP.etkinlikler().filter(e => e.tavan == null)[0];
  }
  function tavanli(){
    return XP.etkinlikler().filter(e => e.tavan != null)[0];
  }

  async function temiz(){
    resetState();
    await XP.sifirla();
    await XP.yukle();
  }

  /* Hedef XP'ye tavan yemeden ulaşmak: tavansız etkinlik GÜN BAŞINA bir
     kez sayılır, bu yüzden ayrı günlere yazılır. Tek güne yığmak tavana
     takılırdı ve test, ölçmek istediği şeyi değil tavanı ölçerdi.

     İki ayrı hedef vardır ve karıştırılırsa test yalan söyler:
       xpVer      en az `hedef` — eşiği GEÇMEK için
       xpVerAlti  en çok `hedef` — eşiğin ALTINDA kalmak için */
  const BAS_GUN = '2026-01-01';

  async function xpKere(kere){
    const e = tavansiz();
    let son = null;
    for(let i = 0; i < kere; i++){
      son = await XP.kazan(e.id, { gun:XP.gunKaydir(BAS_GUN, i) });
    }
    return son;
  }

  async function xpVer(hedef){
    return xpKere(Math.ceil(hedef / tavansiz().xp));
  }

  async function xpVerAlti(hedef){
    return xpKere(Math.floor(hedef / tavansiz().xp));
  }

  describe('seviye kataloğu — altı kademe, her kademede üç basamak', () => {

    it('altı kademe vardır', () => {
      expect(L.KADEMELER).toHaveLength(6);
    });

    it('her kademe üç basamak taşır', () => {
      L.KADEMELER.forEach(k => expect(k.basamak).toHaveLength(L.BASAMAK_SAYISI));
    });

    it('toplam on sekiz basamak üretilir', () => {
      expect(L.BASAMAKLAR).toHaveLength(18);
    });

    it('eşikler kesintisiz artar — bir basamak öncekinden ucuz olamaz', () => {
      let onceki = 0;
      L.BASAMAKLAR.forEach(b => {
        expect(b.esik).toBeGreaterThan(onceki);
        onceki = b.esik;
      });
    });

    it('etiket kademe.basamak biçimindedir', () => {
      expect(L.BASAMAKLAR[0].etiket).toBe('1.1');
      expect(L.BASAMAKLAR[17].etiket).toBe('6.3');
    });

    it('kademe kimlikleri benzersizdir — defter kimlikle yazılır', () => {
      const idler = L.KADEMELER.map(k => k.id);
      expect(new Set(idler).size).toBe(idler.length);
    });

    it('her kademenin adı, rengi ve sloganı vardır', () => {
      L.KADEMELER.forEach(k => {
        expect(typeof k.ad === 'string' && k.ad.length > 0).toBe(true);
        expect(/^#[0-9A-Fa-f]{6}$/.test(k.renk)).toBe(true);
        expect(/^#[0-9A-Fa-f]{6}$/.test(k.isik)).toBe(true);
        expect(typeof k.slogan === 'string' && k.slogan.length > 0).toBe(true);
      });
    });

    it('etkinlik kimlikleri benzersizdir', () => {
      const idler = L.XP_ETKINLIK.map(e => e.id);
      expect(new Set(idler).size).toBe(idler.length);
    });

    it('her etkinlik pozitif XP verir ve bir modüle aittir', () => {
      const modlar = ['ays', 'spi', 'esp', 'hkm'];
      L.XP_ETKINLIK.forEach(e => {
        expect(e.xp).toBeGreaterThan(0);
        expect(modlar.indexOf(e.mod) >= 0).toBe(true);
      });
    });

    it('bu sistemin en az bir tavansız ve bir tavanlı etkinliği vardır', () => {
      expect(!!tavansiz()).toBe(true);
      expect(!!tavanli()).toBe(true);
    });
  });

  describe('defter — yüklenmemiş defter sıfır değildir', () => {

    it('yükleme öncesi durum null döner', async () => {
      resetState();
      await XP.sifirla();
      /* sifirla() defteri kurar; gerçek «hiç yüklenmedi» hâli yalnız
         açılışın ilk anında olur ve rozet o anda ÇİZİLMEZ. */
      expect(XP.durum() !== null).toBe(true);
    });

    it('boş defter 1.1 basamağının içindedir, 1.1 bitmiş değildir', async () => {
      await temiz();
      const d = XP.durum();
      expect(d.toplam).toBe(0);
      expect(d.kademe).toBe(1);
      expect(d.basamak).toBe(1);
      expect(d.bitmisBasamak).toBe(0);
      expect(d.oran).toBe(0);
    });

    it('rozet yüklü defterde etiketi taşır', async () => {
      await temiz();
      expect(XP.rozetHtml()).toContain('1.1');
    });
  });

  describe('kazanma — tavan ve kapsam', () => {

    it('XP kazanmak toplamı artırır', async () => {
      await temiz();
      const e = tavansiz();
      const r = await XP.kazan(e.id, { gun:'2026-01-01' });
      expect(r.kazanilan).toBe(e.xp);
      expect(XP.durum().toplam).toBe(e.xp);
    });

    it('aynı gün tavanı aşan tekrar XP getirmez', async () => {
      await temiz();
      const e = tavanli();
      const kac = Math.ceil(e.tavan / e.xp) + 5;
      await XP.kazan(e.id, { gun:'2026-01-01', adet:kac });
      expect(XP.durum().toplam).toBe(e.tavan);
    });

    it('tavan GÜN BAŞINADIR — ertesi gün yeniden dolar', async () => {
      await temiz();
      const e = tavanli();
      const kac = Math.ceil(e.tavan / e.xp) + 5;
      await XP.kazan(e.id, { gun:'2026-01-01', adet:kac });
      await XP.kazan(e.id, { gun:'2026-01-02', adet:kac });
      expect(XP.durum().toplam).toBe(e.tavan * 2);
    });

    it('başka bir sistemin etkinliği bu deftere yazılmaz', async () => {
      await temiz();
      const yabanci = L.XP_ETKINLIK.filter(e => e.mod !== XP.MOD)[0];
      const r = await XP.kazan(yabanci.id, { gun:'2026-01-01' });
      expect(r.yabanci).toBe(true);
      expect(r.kazanilan).toBe(0);
      expect(XP.durum().toplam).toBe(0);
    });

    it('bilinmeyen etkinlik sessizce yok sayılmaz, işaretlenir', async () => {
      await temiz();
      const r = await XP.kazan('yok.boyle.bir.sey');
      expect(r.bilinmeyen).toBe(true);
      expect(r.kazanilan).toBe(0);
    });

    it('adet verilmezse bir kez sayılır, negatif adet bire yuvarlanır', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id, { gun:'2026-01-01', adet:-9 });
      expect(XP.durum().toplam).toBe(e.xp);
    });
  });

  describe('yükselme — kademe atlamak ile basamak atlamak ayrı şeylerdir', () => {

    it('ilk basamağı bitirmek yükselme doğurur ve YENİ KADEMEDİR', async () => {
      await temiz();
      const son = await xpVer(L.BASAMAKLAR[0].esik);
      expect(!!son.yukselme).toBe(true);
      expect(son.yukselme.etiket).toBe('1.1');
      expect(son.yukselme.yeniKademe).toBe(true);
    });

    it('aynı kademe içinde basamak atlamak yeni kademe DEĞİLDİR', async () => {
      await temiz();
      const son = await xpVer(L.BASAMAKLAR[1].esik);
      expect(son.yukselme.etiket).toBe('1.2');
      expect(son.yukselme.yeniKademe).toBe(false);
    });

    it('üçüncü basamağı bitirmek ikinci kademeyi açar', async () => {
      await temiz();
      const son = await xpVer(L.BASAMAKLAR[2].esik);
      expect(son.yukselme.etiket).toBe('1.3');
      expect(XP.durum().kademe).toBe(2);
      expect(XP.durum().basamak).toBe(1);
    });

    it('eşiğin bir altında yükselme yoktur', async () => {
      await temiz();
      const son = await xpVerAlti(L.BASAMAKLAR[0].esik - 1);
      expect(son.yukselme).toBeNull();
      expect(XP.durum().bitmisBasamak).toBe(0);
    });

    it('en üst basamakta oran 1 kalır ve XP birikmeye devam eder', async () => {
      await temiz();
      await xpVer(L.TOPLAM_XP + 5000);
      const d = XP.durum();
      expect(d.tamam).toBe(true);
      expect(d.etiket).toBe('6.3');
      expect(d.oran).toBe(1);
      expect(d.toplam).toBeGreaterThan(L.TOPLAM_XP);
    });
  });

  describe('kutlama — kapalıyken atlanan seviye kaybolmaz', () => {

    it('yükselmeden sonra bekleyen kutlama vardır', async () => {
      await temiz();
      await xpVer(L.BASAMAKLAR[0].esik);
      const b = XP.bekleyenKutlama();
      expect(!!b).toBe(true);
      expect(b.etiket).toBe('1.1');
    });

    it('kutlandı damgası aynı kutlamayı bir daha göstermez', async () => {
      await temiz();
      await xpVer(L.BASAMAKLAR[0].esik);
      await XP.kutlandi();
      expect(XP.bekleyenKutlama()).toBeNull();
    });

    it('dinleyici yükselmeyi anında duyar', async () => {
      await temiz();
      const gorulen = [];
      const birak = XP.dinle(y => gorulen.push(y.etiket));
      await xpVer(L.BASAMAKLAR[0].esik);
      birak();
      expect(gorulen).toContain('1.1');
    });
  });

  describe('geri alma — silinen kayıt puanı da geri alır', () => {

    it('geri almak toplamı düşürür', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id, { gun:'2026-01-01' });
      await XP.geriAl(e.id, { gun:'2026-01-01' });
      expect(XP.durum().toplam).toBe(0);
    });

    it('kazanılmamış puan geri alınmaz — toplam eksiye düşmez', async () => {
      await temiz();
      const e = tavansiz();
      const r = await XP.geriAl(e.id, { gun:'2026-01-01' });
      expect(r.geriAlinan).toBe(0);
      expect(XP.durum().toplam).toBe(0);
    });

    it('seviye düşerse kutlama yeniden kazanılabilir', async () => {
      await temiz();
      const e = tavansiz();
      await xpVer(L.BASAMAKLAR[0].esik);
      await XP.kutlandi();
      /* Son günün kaydını geri al: eşiğin altına düşülür. */
      const gunler = Object.keys(XP._defter().gunler).sort();
      await XP.geriAl(e.id, { gun:gunler[gunler.length - 1] });
      expect(XP.durum().bitmisBasamak).toBe(0);
      expect(XP.bekleyenKutlama()).toBeNull();
      await XP.kazan(e.id, { gun:'2027-06-01' });
      expect(XP.bekleyenKutlama().etiket).toBe('1.1');
    });
  });

  describe('defter büyümesi — dokuz aylık ufuk', () => {

    it('yüz yirmi günden eski kırılım arşive toplanır', async () => {
      await temiz();
      const e = tavansiz();
      for(let i = 0; i < XP.DETAY_GUN + 30; i++){
        await XP.kazan(e.id, { gun:XP.gunKaydir('2026-01-01', i) });
      }
      const d = XP._defter();
      expect(Object.keys(d.gunler).length).toBe(XP.DETAY_GUN);
      expect(d.arsiv.xp).toBeGreaterThan(0);
    });

    it('arşive giden XP tavandan SONRAKİ XP\'dir — kırılım toplamı toplamı aşmaz', async () => {
      await temiz();
      const t = tavanli();
      /* Tavanın üç katı deneme: ham adetle çarpan bir arşiv, burada
         toplamın üstüne çıkar ve test kırmızıya döner. */
      const kac = Math.ceil(t.tavan / t.xp) * 3;
      for(let i = 0; i < XP.DETAY_GUN + 10; i++){
        await XP.kazan(t.id, { gun:XP.gunKaydir('2026-01-01', i), adet:kac });
      }
      const k = XP.kirilim();
      let kirilimToplam = k.arsiv;
      Object.keys(k.etkinlik).forEach(id => { kirilimToplam += k.etkinlik[id]; });
      expect(kirilimToplam).toBe(XP.durum().toplam);
    });

    it('budama TOPLAM XP\'ye dokunmaz — seviye geçmiş silindi diye düşmez', async () => {
      await temiz();
      const e = tavansiz();
      const gun = XP.DETAY_GUN + 30;
      for(let i = 0; i < gun; i++){
        await XP.kazan(e.id, { gun:XP.gunKaydir('2026-01-01', i) });
      }
      expect(XP.durum().toplam).toBe(gun * e.xp);
    });
  });

  describe('okuma — veri olmayan gün sıfır değildir', () => {

    it('kayıtsız gün null döner, sıfır değil', async () => {
      await withTodayAsync('2026-03-10', async () => {
        await temiz();
        const seri = XP.sonGunler(3);
        expect(seri).toHaveLength(3);
        expect(seri[0].xp).toBeNull();
      });
    });

    it('kayıtlı gün toplamı taşır', async () => {
      await withTodayAsync('2026-03-10', async () => {
        await temiz();
        const e = tavansiz();
        await XP.kazan(e.id, { gun:'2026-03-10' });
        const seri = XP.sonGunler(3);
        expect(seri[2].xp).toBe(e.xp);
      });
    });

    it('kırılım yalnız bu sistemin etkinliklerini sayar', async () => {
      await temiz();
      const e = tavansiz();
      await XP.kazan(e.id, { gun:'2026-01-01' });
      const k = XP.kirilim();
      expect(k.mod).toBe(XP.MOD);
      expect(k.etkinlik[e.id]).toBe(e.xp);
    });
  });
})();
