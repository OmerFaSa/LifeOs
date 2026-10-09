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
})();
