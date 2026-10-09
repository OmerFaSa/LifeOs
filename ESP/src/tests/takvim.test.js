/* Takvim aboneliğine ESP yayını (core/takvim.js; hesap sunucusu söz 17).

   Korunan: tarihli hedef, etkin hedefin son günü ve tamamlanmamış
   hatırlatıcı tüm gün etkinliğidir; geçmiş ve tamamlanan girmez;
   gecikmiş hatırlatıcı bugünde durur; tekrar kuralı yazılmaz (ESP'de
   sonraki gün tamamlandığı günden sayılır); UID kalıcıdır; satır 75
   oktette katlanır. */

(function(){
  const { describe, it, expect, resetState, withToday } = ESP.Test;
  const T = () => ESP.Takvim;
  const blok = (m, uid) => m.split('BEGIN:VEVENT').find(b => b.indexOf('UID:' + uid) >= 0) || '';

  describe('takvim · abonelik yayını', () => {
    it('tarihli hedef ve hatırlatıcı tüm gün; geçmiş ve tamamlanan girmez; gecikmiş hatırlatıcı bugünde, tekrar kuralı yok', () => {
      resetState();
      withToday('2026-09-12', () => {
        ESP.S.goals = [
          { id:'g1', label:'B1 sınavı', disc:'lang', date:'2026-10-01', done:false },
          { id:'g2', label:'Eski hedef', disc:'lang', date:'2026-09-01', done:false },
          { id:'g3', label:'Biten hedef', disc:'lang', date:'2026-10-05', done:true },
        ];
        ESP.S.reminders = [
          { id:'r1', text:'Metronom 80', disc:'music', due:'2026-09-15', repeat:'none', done:false },
          { id:'r2', text:'Kelime tekrarı', disc:'lang', due:'2026-09-10', repeat:'daily', done:false },
          { id:'r3', text:'Biten', disc:'lang', due:'2026-09-20', repeat:'none', done:true },
        ];
        ESP.S.hedefler = [];
        const d = T().disa();
        expect(d.adet).toBe(3);
        const m = d.metin;
        expect(m.indexOf('BEGIN:VCALENDAR')).toBe(0);
        expect(m.slice(-15)).toBe('END:VCALENDAR\r\n');
        const g1 = blok(m, 'esp-tarihli-g1@lifeos');
        expect(g1).toContain('DTSTART;VALUE=DATE:20261001');
        expect(g1).toContain('DTEND;VALUE=DATE:20261002');
        expect(g1).toContain('TRANSP:TRANSPARENT');
        expect(m.indexOf('Eski hedef') < 0).toBe(true);
        expect(m.indexOf('Biten') < 0).toBe(true);
        expect(blok(m, 'esp-hatirlatici-r1@lifeos')).toContain('DTSTART;VALUE=DATE:20260915');
        const r2 = blok(m, 'esp-hatirlatici-r2@lifeos');
        expect(r2).toContain('DTSTART;VALUE=DATE:20260912');      // gecikmiş: bugünde
        expect(r2).toContain('2026-09-10');
        expect(m.indexOf('RRULE') < 0).toBe(true);
        expect(m.split('\r\n').every(s => new TextEncoder().encode(s).length <= 75)).toBe(true);
      });
    });

    it('etkin hedefin son günü girer, biten girmez; UID her yayında aynı; virgül ve noktalı virgül kaçırılır', () => {
      resetState();
      withToday('2026-09-12', () => {
        ESP.S.goals = [{ id:'g9', label:'Gam; arpej, akor', disc:'music', date:'2026-11-01', done:false }];
        ESP.S.reminders = [];
        ESP.S.hedefler = [
          { id:'h1', paket:'okuma', durum:'aktif', hedefDeger:12, son_tarih:'2026-12-31' },
          { id:'h2', paket:'okuma', durum:'tamam', hedefDeger:5, son_tarih:'2026-12-31' },
          { id:'h3', paket:'okuma', durum:'aktif', hedefDeger:3, son_tarih:'2026-09-01' },
        ];
        const a = T().disa(), b = T().disa();
        expect(a.adet).toBe(2);
        const h1 = blok(a.metin, 'esp-hedef-h1@lifeos');
        expect(h1).toContain('DTSTART;VALUE=DATE:20261231');
        expect(h1).toContain('ESP hedefi son gün: 12 kitap');
        expect(a.metin.indexOf('esp-hedef-h2') < 0).toBe(true);
        expect(a.metin.indexOf('esp-hedef-h3') < 0).toBe(true);
        expect(a.metin).toContain('Gam\\; arpej\\, akor');
        const uid = m => m.split('\r\n').filter(s => s.indexOf('UID:') === 0);
        expect(uid(a.metin)).toEqual(uid(b.metin));
      });
    });

    /* 2026-10-09: sayfada takvim.js utils.js'ten ÖNCE yükleniyor (test
       sayfasında sonra); ESP.U yüklenirken okunsaydı yayın sessizce düşerdi. */
    it('yükleme sırasından bağımsız: ESP.U ve ESP.S yüklenirken okunmaz', async () => {
      const kaynak = await (await fetch('../js/core/takvim.js', { cache:'no-store' })).text();
      const sahte = { ESP:{} };
      new Function('window', 'ESP', kaynak)(sahte, sahte.ESP);       // U ve S henüz yok
      sahte.ESP.U = ESP.U;
      sahte.ESP.S = { goals:[{ id:'g1', label:'Sınav', disc:'lang', date:'2026-10-01', done:false }], reminders:[], hedefler:[] };
      expect(sahte.ESP.Takvim.disa('2026-09-12').adet).toBe(1);
    });

    /* TELEFON BİLDİRİMİ (2026-10-09): açıksa hatırlatıcı vade günü
       BILDIRIM_SAAT'te; gecikmiş ve biten çaldırılmaz; kapalı bölümünki yok. */
    it('telefon bildirimi: vade günü sabahı, önümüzdeki günler; gecikmiş, biten ve kapalı bölüm yok; kapalıysa boş liste', async () => {
      resetState();
      const giden = [], eski = window.webkit;
      window.webkit = { messageHandlers:{ lifeosBildirim:{ postMessage(m){
        giden.push(JSON.parse(JSON.stringify(m)));
        setTimeout(() => window.LIFEOS.BILDIRIM._cevap(m.istek, m.tur === 'kur' ? { kurulan:m.liste.length } : { durum:'izin' }), 0);
      } } } };
      try{
        ESP.S.reminders = [
          { id:'r1', text:'Metronom 80', disc:'music', due:'2026-09-12', repeat:'none', done:false },
          { id:'r2', text:'Kelime', disc:'lang', due:'2026-09-14', repeat:'daily', done:false },
          { id:'r3', text:'Gecikmiş', disc:'lang', due:'2026-09-10', repeat:'none', done:false },
          { id:'r4', text:'Biten', disc:'lang', due:'2026-09-13', repeat:'none', done:true },
          { id:'r5', text:'Uzak', disc:'lang', due:'2026-10-30', repeat:'none', done:false },
        ];
        const sabah = new Date(2026, 8, 12, 8, 0), oglen = new Date(2026, 8, 12, 12, 0);
        const l = T().bildirimListesi(sabah);
        expect(l.map(x => x.anahtar)).toEqual(['r1@2026-09-12', 'r2@2026-09-14']);
        expect(l[0]).toEqual({ anahtar:'r1@2026-09-12', baslik:'ESP · ' + ESP.DISCIPLINE_BY_ID.music.label,
          govde:'Metronom 80', zaman:new Date(2026, 8, 12, 9, 0).getTime(), eylem:'Yapıldı' });
        expect(T().bildirimListesi(oglen).map(x => x.anahtar)).toEqual(['r2@2026-09-14']);   // bugünün saati geçti
        await ESP.Mod.set('music', false);
        expect(T().bildirimListesi(sabah).map(x => x.anahtar)).toEqual(['r2@2026-09-14']);
        await ESP.Mod.set('music', true);
        await ESP.Office.saveSettings({ telefonBildirim:false });
        await T().planla(sabah);
        expect(giden[giden.length - 1]).toEqual({ tur:'kur', modul:'esp', istek:giden[giden.length - 1].istek, liste:[] });
        await ESP.Office.saveSettings({ telefonBildirim:true });
        /* Köprü geçmişi GERÇEK saate göre eler: gerçek yarının hatırlatıcısı gider. */
        const yarin = ESP.U.iso(ESP.U.addDays(new Date(), 1));
        ESP.S.reminders = [{ id:'r9', text:'Yarın', disc:'lang', due:yarin, repeat:'none', done:false }];
        await T().planla();
        expect(giden[giden.length - 1].liste.map(x => x.anahtar)).toEqual(['r9@' + yarin]);
      }finally{ if(eski === undefined) delete window.webkit; else window.webkit = eski; }
    });

    /* Bildirimdeki «Yapıldı» (brand/ortak/bildirim.js söz 7): ESP'nin kendi
       tamamlama kuralı; ikinci kez tamamlanmaz. */
    it('bildirimdeki «Yapıldı»: tek seferlik kapanır, tekrarlı ileri taşınır; ikinci kez ve vadesi değişmişse «yok»', async () => {
      resetState();
      ESP.S.reminders = [
        { id:'r1', text:'Metronom', disc:'music', due:'2026-09-12', repeat:'none', done:false },
        { id:'r2', text:'Kelime', disc:'lang', due:'2026-09-12', repeat:'daily', done:false },
      ];
      const zaman = new Date(2026, 8, 12, 9, 5).getTime();
      expect(await T().isaretUygula({ anahtar:'r1@2026-09-12', zaman })).toBe(true);
      expect(ESP.S.reminders.find(r => r.id === 'r1').done).toBe(true);
      expect(await T().isaretUygula({ anahtar:'r1@2026-09-12', zaman })).toBe('yok');      // zaten kapandı
      expect(await T().isaretUygula({ anahtar:'r2@2026-09-12', zaman })).toBe(true);
      expect(ESP.S.reminders.find(r => r.id === 'r2').due).toBe('2026-09-13');               // basıldığı günden sayılır
      expect(await T().isaretUygula({ anahtar:'r2@2026-09-12', zaman })).toBe('yok');      // vade değişti
      expect(await T().isaretUygula({ anahtar:'yok@2026-09-12', zaman })).toBe('yok');
      expect(await T().isaretUygula({ anahtar:'bozuk', zaman })).toBe('yok');
    });

    it('hiçbir şey yoksa boş ama geçerli bir takvim', () => {
      resetState();
      withToday('2026-09-12', () => {
        ESP.S.goals = []; ESP.S.reminders = []; ESP.S.hedefler = [];
        const d = T().disa();
        expect(d.adet).toBe(0);
        expect(d.metin).toContain('X-WR-CALNAME:ESP — gelişim takvimi');
        expect(d.metin.indexOf('BEGIN:VEVENT') < 0).toBe(true);
      });
    });
  });

  /* Siri «Bugün ne var?» (hesap sunucu sözü 21): günün cümlesi ve bugüne
     düşen hatırlatıcı sayısı; kapalı bölümünki sayılmaz. */
  describe('Bugün — Siri özeti (sesli)', () => {
    it('oturum yoksa söylenir; oturum ve bugünkü hatırlatıcılar sayılır', async () => {
      resetState();
      await ESP.Test.withTodayAsync('2026-09-12', async () => {
        const bos = ESP.Screens.today.sesli();
        expect(/^Bugün (henüz oturum yok|için bekleyen bir iş yok)/.test(bos)).toBe(true);
        await ESP.Model.addSession('2026-09-12', { disc:'music', minutes:30 });
        await ESP.Model.addSession('2026-09-12', { disc:'lang', minutes:15 });
        ESP.S.reminders = [
          { id:'r1', text:'Metronom', disc:'music', due:'2026-09-12', repeat:'none', done:false },
          { id:'r2', text:'Kelime', disc:'lang', due:'2026-09-10', repeat:'none', done:false },
          { id:'r3', text:'Yarın', disc:'lang', due:'2026-09-13', repeat:'none', done:false },
        ];
        expect(ESP.Screens.today.sesli()).toBe('2 oturum, toplam ' + ESP.U.fmtMin(45) + '. 2 hatırlatıcı bugün.');
        await ESP.Mod.set('music', false);
        expect(ESP.Screens.today.sesli()).toContain('1 hatırlatıcı bugün.');
        await ESP.Mod.set('music', true);
      });
    });
  });
})();
