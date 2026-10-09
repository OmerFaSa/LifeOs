/* Hatırlatmalar (core/hatirlat.js, fikir 34 + 35). Kanıtladığı sözler:
   saat anlaşılmazsa tahmin edilmez; ilaç hatırlatması ilaç kaydına bağlıdır
   ve ilaç bırakılınca susar; işaretleme günün kaydıdır; bildirim izni
   yokken hiçbir şey gösterilmez. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = SP.Test;
  const H = () => SP.Hatirlat;
  const saat = (iso, hhmm) => { const p = iso.split('-'), q = hhmm.split(':');
    return new Date(+p[0], +p[1] - 1, +p[2], +q[0], +q[1]); };

  describe('Hatırlatmalar', () => {
    it('saatler okunur, sıralanır; anlaşılmayan parça tahmin edilmez', () => {
      expect(H().saatOku('21.30, 8:00 13:15').saatler).toEqual(['08:00', '13:15', '21:30']);
      expect(H().saatOku('8:00, 8.00').saatler).toEqual(['08:00']);
      const r = H().saatOku('08:00, sabah');
      expect(r.ok).toBe(false);
      expect(r.why).toContain('sabah');
      expect(H().saatOku('25:00').ok).toBe(false);
      expect(H().saatOku('').ok).toBe(false);
    });

    it('ilaç hatırlatması kayda bağlıdır; ilaç bırakılınca susar', async () => {
      resetState();
      const m = SP.Model.newMed();
      m.name = 'Demir'; m.dose = 'günde 1×'; m.startDate = '2026-09-01';
      await SP.Model.saveMed(m);
      expect((await H().ekle({ tur:'ilac', medId:'yok', saatler:'08:00' })).ok).toBe(false);
      expect((await H().ekle({ tur:'ilac', medId:m.id, saatler:'21:00, 08:00' })).ok).toBe(true);
      const sabah = H().bugun(saat('2026-09-20', '09:00'));
      expect(sabah.map(r => [r.saat, r.ad, r.durum])).toEqual([['08:00', 'Demir', 'vakti'], ['21:00', 'Demir', 'sonra']]);
      /* doz notu hatırlatmada görünmez */
      expect(JSON.stringify(sabah).indexOf('günde')).toBe(-1);
      await SP.Model.stopMed(m.id, '2026-09-19');
      expect(H().bugun(saat('2026-09-20', '09:00'))).toHaveLength(0);
    });

    it('aynı tür ikinci kez eklenince saatleri güncellenir; işaret günün kaydıdır', async () => {
      resetState();
      await H().ekle({ tur:'su', saatler:'10:00' });
      await H().ekle({ tur:'su', saatler:'10:00, 14:00' });
      expect(H().durum().liste).toHaveLength(1);
      /* Günler BUGÜNE göre: işaretler 14 günden eskiyse temizlenir (kaydet);
         sabit bir tarih (2026-09-20) 2026-10-05'te pencereden düştü. */
      const g1 = SP.U.todayISO(), g2 = SP.U.iso(SP.U.addDays(SP.U.today(), 1));
      const r = H().bugun(saat(g1, '15:00'));
      expect(r.map(x => x.durum)).toEqual(['vakti', 'vakti']);
      await H().isaretle(r[0].anahtar, true, g1);
      expect(H().bugun(saat(g1, '15:00')).map(x => x.durum)).toEqual(['yapildi', 'vakti']);
      expect(H().bugun(saat(g2, '15:00')).map(x => x.durum)).toEqual(['vakti', 'vakti']);
      await H().isaretle(r[0].anahtar, false, g1);
      expect(H().bugun(saat(g1, '15:00'))[0].durum).toBe('vakti');
    });

    it('silinen hatırlatma geri konur', async () => {
      resetState();
      await H().ekle({ tur:'hareket', saatler:'11:00' });
      const id = H().durum().liste[0].id;
      const s = await H().sil(id);
      expect(H().durum().liste).toHaveLength(0);
      await H().geriKoy(s.geri);
      expect(H().durum().liste.map(h => h.tur)).toEqual(['hareket']);
    });

    it('bildirim kapalıyken ya da izin yokken hiçbir şey gösterilmez', async () => {
      resetState();
      await H().ekle({ tur:'su', saatler:'10:00' });
      expect(H().tik(saat('2026-09-20', '10:05'))).toBe(0);
    });
  });
  /* HATALAR O-8: Android Chrome sayfa içinden `new Notification` kurmaya
     izin vermez («Illegal constructor»); hata yutuluyor, izin verilmiş
     görünürken hiçbir hatırlatma gelmiyordu. Önce hizmet çalışanının
     `showNotification`'ı denenir; o da yoksa bu SÖYLENİR. */
  /* TELEFON UYGULAMASI (2026-10-09): saatler iOS yerel bildirimi olarak
     önümüzdeki günlere kurulur (brand/ortak/bildirim.js). Sahte kabuk. */
  describe('Hatırlatmalar — telefon bildirimi', () => {
    function sahteKabuk(durum){
      const giden = [], eski = window.webkit;
      window.webkit = { messageHandlers:{ lifeosBildirim:{ postMessage(m){
        giden.push(JSON.parse(JSON.stringify(m)));
        setTimeout(() => window.LIFEOS.BILDIRIM._cevap(m.istek,
          m.tur === 'kur' ? { kurulan:m.liste.length } : { durum }), 0);
      } } } };
      return { giden, kur:() => giden.filter(m => m.tur === 'kur'),
        birak(){ if(eski === undefined) delete window.webkit; else window.webkit = eski; } };
    }

    it('izin verilince açılır; geçmiş, işaretlenmiş saat ve etkin olmayan ilaç kurulmaz; kapatınca bekleyenler silinir', async () => {
      resetState();
      const k = sahteKabuk('izin');
      try{ await withTodayAsync('2026-09-20', async () => {
        expect(H().telefonMu()).toBe(true);
        expect(H().bildirimVar()).toBe(true);
        const m = SP.Model.newMed();
        m.name = 'Demir'; m.startDate = '2026-09-01'; m.endDate = '2026-09-21';
        await SP.Model.saveMed(m);
        await H().ekle({ tur:'su', saatler:'10:00, 16:00' });
        await H().ekle({ tur:'ilac', medId:m.id, saatler:'21:00' });
        const r = await H().bildirimAc();
        expect([r.ok, r.telefon]).toEqual([true, true]);
        expect(H().bildirimIzinli()).toBe(true);
        const su = H().durum().liste.find(h => h.tur === 'su');
        await H().isaretle(su.id + '@16:00', true, '2026-09-20');
        const l = H().planListesi(saat('2026-09-20', '12:00'));
        const gun = x => x.anahtar.split('|')[0];
        expect(l.some(x => gun(x) === '2026-09-20' && /@10:00$/.test(x.anahtar))).toBe(false);   // geçti
        expect(l.some(x => gun(x) === '2026-09-20' && /@16:00$/.test(x.anahtar))).toBe(false);   // işaretlendi
        expect(l.some(x => gun(x) === '2026-09-21' && /@16:00$/.test(x.anahtar))).toBe(true);
        expect(l.filter(x => x.govde === 'Demir').map(gun)).toEqual(['2026-09-20', '2026-09-21']);  // ilaç bitince susar
        expect(l.every(x => x.anahtar.split('|')[0] <= '2026-09-26')).toBe(true);                // PLAN_GUN
        expect(/^SPİ · \d\d:\d\d$/.test(l[0].baslik)).toBe(true);
        expect(H().tik(saat('2026-09-20', '16:05'))).toBe(0);              // telefonda bildirimi kabuk gösterir
        await H().planBekle();
        expect(k.kur().length > 0).toBe(true);
        expect(k.kur().every(x => x.modul === 'spi')).toBe(true);
        await H().bildirimKapat();
        await H().planBekle();
        expect(k.kur()[k.kur().length - 1].liste).toEqual([]);           // kapandı: bekleyenler gider
      }); }finally{ k.birak(); }
    });

    it('izin reddedilirse açılmaz ve nedeni söylenir', async () => {
      resetState();
      const k = sahteKabuk('red');
      try{
        const r = await H().bildirimAc();
        expect(r.ok).toBe(false);
        expect(r.why).toContain('Ayarlar');
        expect(H().durum().bildirim).toBe(false);
      }finally{ k.birak(); }
    });
  });

  describe('Hatırlatmalar — bildirim gösterilemeyen tarayıcı (O-8)', () => {
    function kur(swKayit){
      const eskiN = window.Notification;
      const sahte = function(){ throw new TypeError('Illegal constructor'); };
      sahte.permission = 'granted';
      sahte.requestPermission = () => Promise.resolve('granted');
      window.Notification = sahte;
      Object.defineProperty(navigator, 'serviceWorker', { configurable:true,
        value:swKayit === undefined ? undefined : { getRegistration:() => Promise.resolve(swKayit) } });
      return () => { window.Notification = eskiN; delete navigator.serviceWorker; };
    }

    it('kurucu yoksa hizmet çalışanıyla gösterilir', async () => {
      resetState();
      const gosterilen = [];
      const geri = kur({ showNotification:(t, o) => { gosterilen.push([t, o.body]); return Promise.resolve(); } });
      try{
        await H().ekle({ tur:'su', saatler:'10:00' });
        expect((await H().bildirimAc()).ok).toBe(true);
        expect(H().tik(saat('2026-09-20', '10:05'))).toBe(1);
        await new Promise(r => setTimeout(r, 20));
        expect(gosterilen).toHaveLength(1);
        expect(H().bildirimSorunu()).toBe(null);
      }finally{ geri(); }
    });

    it('hiçbir yol yoksa sessiz kalınmaz: sorun söylenir', async () => {
      resetState();
      const geri = kur(undefined);
      try{
        await H().ekle({ tur:'su', saatler:'10:00' });
        await H().bildirimAc();
        expect(H().tik(saat('2026-09-20', '10:05'))).toBe(0);
        await new Promise(r => setTimeout(r, 20));
        expect(H().bildirimSorunu()).toContain('Bugün ekranında');
      }finally{ geri(); }
    });
  });

  /* Siri «Bugün ne var?» (hesap sunucu sözü 21): sıradaki hatırlatma
     söylenir; ilaç adı SÖYLENMEZ (yalnız «ilaç ya da takviye»). */
  describe('Bugün — Siri özeti (sesli)', () => {
    it('veri yoksa söyler; sıradaki hatırlatma saatiyle; ilaç adı geçmez', async () => {
      resetState();
      await withTodayAsync('2026-09-20', async () => {
        expect(SP.Screens.today.sesli(saat('2026-09-20', '09:00'))).toBe('Bugünün verisi henüz girilmedi.');
        const m = SP.Model.newMed();
        m.name = 'Gizli İlaç'; m.startDate = '2026-09-01';
        await SP.Model.saveMed(m);
        await H().ekle({ tur:'ilac', medId:m.id, saatler:'08:00, 21:00' });
        await H().ekle({ tur:'su', saatler:'16:00' });
        const c = SP.Screens.today.sesli(saat('2026-09-20', '12:00'));
        expect(c).toContain('Sıradaki hatırlatma 16:00, su.');
        const a = SP.Screens.today.sesli(saat('2026-09-20', '17:00'));
        expect(a).toContain('Sıradaki hatırlatma 21:00, ilaç ya da takviye.');
        expect(a.indexOf('Gizli') < 0).toBe(true);
      });
    });
  });
})();
