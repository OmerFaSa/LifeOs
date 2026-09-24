/* Takvim — .ics içe ve dışa aktarma (core/takvim.js).

   Kanıtladığı sözler:
     1. Yazılan dosya RFC 5545'e uyar: satırlar 75 OKTETTE katlanır (Türkçe
        harf iki bayt), virgül/noktalı virgül kaçırılır, tüm gün
        etkinliğinin DTEND'i ertesi gündür. Okuyucu kendi yazdığını geri okur.
     2. Tür yalnız ÖNERİLİR; tanınmayan etkinlik türsüz gelir.
     3. Geçmiş, 60 günden uzun ve zaten kayıtlı etkinlik alınmaz.
     4. İçe alma yalnız kullanıcının tür seçtiği satırı yazar.
     5. Dışa aktarma istisnaları, sınav günlerini ve hedef son günlerini taşır. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const T = () => R.Takvim;
  const BUGUN = '2026-09-23';

  function ics(olaylar){
    return ['BEGIN:VCALENDAR', 'VERSION:2.0'].concat(olaylar.flatMap(o => ['BEGIN:VEVENT'].concat(o, ['END:VEVENT'])),
      ['END:VCALENDAR']).join('\r\n');
  }

  describe('Takvim — .ics yazma ve okuma', () => {
    it('satırlar 75 oktette katlanır, geri okununca aynı metin gelir', () => {
      const uzun = 'Şğüçöı '.repeat(30).trim();
      const m = T().yaz([{ uid:'a1', baslik:uzun, bas:'2026-10-29' }], 'Deneme');
      const enc = new TextEncoder();
      m.split('\r\n').forEach(s => expect(enc.encode(s).length <= 75).toBe(true));
      const r = T().oku(m);
      expect(r.ok).toBe(true);
      expect(r.etkinlikler).toHaveLength(1);
      expect(r.etkinlikler[0].baslik).toBe(uzun.slice(0, 160));
    });

    it('özel karakterler kaçırılır ve geri çözülür', () => {
      const m = T().yaz([{ uid:'b1', baslik:'Fizik; kuvvet, hareket', bas:'2026-10-01', aciklama:'iki\nsatır' }]);
      expect(m).toContain('SUMMARY:Fizik\\; kuvvet\\, hareket');
      const e = T().oku(m).etkinlikler[0];
      expect(e.baslik).toBe('Fizik; kuvvet, hareket');
      expect(e.aciklama).toBe('iki\nsatır');
    });

    it('tüm gün etkinliğinin bitişi ertesi gündür (hariç tutulur)', () => {
      const m = T().yaz([{ uid:'c1', baslik:'Ara tatil', bas:'2026-11-10', bit:'2026-11-14' }]);
      expect(m).toContain('DTSTART;VALUE=DATE:20261110');
      expect(m).toContain('DTEND;VALUE=DATE:20261115');
      const e = T().oku(m).etkinlikler[0];
      expect(e.bas).toBe('2026-11-10');
      expect(e.bit).toBe('2026-11-14');
    });

    it('saatli etkinlik kendi gününde biter; tekrar kuralı söylenir', () => {
      const r = T().oku(ics([
        ['UID:s1', 'SUMMARY:Matematik yazılısı', 'DTSTART:20261014T090000', 'DTEND:20261014T103000'],
        ['UID:s2', 'SUMMARY:Kulüp', 'DTSTART:20261015T150000Z', 'RRULE:FREQ=WEEKLY'],
        ['UID:s3', 'SUMMARY:Bozuk', 'DTSTART:2026-10-15'],
      ]));
      expect(r.etkinlikler.map(e => [e.uid, e.bas, e.bit])).toEqual([
        ['s1', '2026-10-14', '2026-10-14'], ['s2', '2026-10-15', '2026-10-15']]);
      expect(r.notlar.join(' ')).toContain('tekrar kuralı okunmadı');
      expect(r.notlar.join(' ')).toContain('1 etkinliğin tarihi okunamadı');
    });

    it('takvim olmayan dosya reddedilir', () => {
      const r = T().oku('merhaba');
      expect(r.ok).toBe(false);
      expect(r.why).toContain('.ics');
    });

    it('tür yalnız önerilir; tanınmayan türsüz gelir', () => {
      expect(T().turOner('Kurban Bayramı')).toBe('tatil');
      expect(T().turOner('YARIYIL TATİLİ')).toBe('tatil');
      expect(T().turOner('Kimya yazılısı')).toBe('okulSinavi');
      expect(T().turOner('Veli toplantısı')).toBe(null);
    });
  });

  describe('Takvim — önizleme ve içe alma', () => {
    const DOSYA = ics([
      ['UID:g1', 'SUMMARY:Eski tatil', 'DTSTART;VALUE=DATE:20260901', 'DTEND;VALUE=DATE:20260903'],
      ['UID:u1', 'SUMMARY:Güz dönemi', 'DTSTART;VALUE=DATE:20260915', 'DTEND;VALUE=DATE:20270120'],
      ['UID:v1', 'SUMMARY:Cumhuriyet Bayramı', 'DTSTART;VALUE=DATE:20261029', 'DTEND;VALUE=DATE:20261030'],
      ['UID:y1', 'SUMMARY:Ara tatil', 'DTSTART;VALUE=DATE:20261110', 'DTEND;VALUE=DATE:20261115'],
      ['UID:y2', 'SUMMARY:Fizik yazılısı', 'DTSTART;VALUE=DATE:20261021', 'DTEND;VALUE=DATE:20261022'],
      ['UID:y3', 'SUMMARY:Veli toplantısı', 'DTSTART;VALUE=DATE:20261007', 'DTEND;VALUE=DATE:20261008'],
    ]);

    it('geçmiş, uzun ve kayıtlı etkinlik ayrılır; yenilere tür önerilir', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        await R.Model.saveCalendar({ kind:'tatil', from:'2026-10-29', to:null, note:'Bayram' });
        const o = T().onizle(DOSYA, BUGUN);
        expect(o.ok).toBe(true);
        const d = {};
        o.satirlar.forEach(s => { d[s.uid] = [s.durum, s.tur]; });
        expect(d).toEqual({ g1:['gecmis', null], u1:['uzun', null], v1:['var', null],
          y1:['yeni', 'tatil'], y2:['yeni', 'okulSinavi'], y3:['yeni', null] });
        expect(o.satirlar[0].bas <= o.satirlar[1].bas).toBe(true);
      });
    });

    it('yalnız tür seçilen yeni satır yazılır; ikinci içe almada «zaten var»', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        const o = T().onizle(DOSYA, BUGUN);
        const r = await T().iceAl(o, { y1:'tatil', y2:'okulSinavi', y3:null, g1:'tatil', v1:'uydurma' });
        expect(r.eklenen).toBe(2);
        const c = R.S.calendar.map(x => [x.kind, x.from, x.to, x.kaynak, x.icsUid]);
        expect(c).toEqual([['okulSinavi', '2026-10-21', null, 'ics', 'y2'],
          ['tatil', '2026-11-10', '2026-11-14', 'ics', 'y1']]);
        const tekrar = T().onizle(DOSYA, BUGUN).satirlar.filter(s => s.uid === 'y1' || s.uid === 'y2');
        expect(tekrar.map(s => s.durum)).toEqual(['var', 'var']);
      });
    });
  });

  describe('Takvim — dışa aktarma', () => {
    it('istisnalar, sınav günleri ve hedef son günleri gelir; eskiler gelmez', async () => {
      await withTodayAsync(BUGUN, async () => {
        resetState();
        R.S.profile.examTytISO = '2027-06-19';
        R.S.profile.examAytISO = '2027-06-20';
        await R.Model.saveCalendar({ kind:'yogun', from:'2026-10-05', to:'2026-10-06', note:'Proje haftası' });
        await R.Model.saveCalendar({ kind:'tatil', from:'2026-06-01', to:null, note:'Çok eski' });
        R.S.hedefler = [{ id:'h1', durum:'aktif', paket:'serbest', cumle:'Paragraf hızını artır',
          son_tarih:'2026-12-31' }, { id:'h2', durum:'bitti', cumle:'Bitmiş', son_tarih:'2026-12-01' }];
        const d = T().disa(BUGUN);
        expect(d.adet).toBe(4);
        const r = T().oku(d.metin);
        const b = r.etkinlikler.map(e => [e.baslik, e.bas, e.bit].join(' | '));
        expect(b).toContain('AYS · Yoğun gün: Proje haftası | 2026-10-05 | 2026-10-06');
        expect(b).toContain('TYT sınav günü | 2027-06-19 | 2027-06-19');
        expect(b).toContain('AYT sınav günü | 2027-06-20 | 2027-06-20');
        expect(b).toContain('AYS hedefi son gün: Paragraf hızını artır | 2026-12-31 | 2026-12-31');
        expect(d.metin).toContain('X-WR-CALNAME:AYS — sınav takvimi');
      });
    });
  });
  /* HATALAR O-10: sondaki «Z» (UTC) yakalanıp kullanılmıyordu; İstanbul'da
     20 Haziran 01:00 olan etkinlik 19 Haziran'a düşüyordu. */
  describe('Takvim — UTC saatli etkinlik (O-10)', () => {
    it('UTC saati yerel güne çevrilir; UTC gece yarısı bitişi yerelde 03:00dür', () => {
      const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:u1', 'SUMMARY:Gece dersi',
        'DTSTART:20260619T220000Z', 'DTEND:20260620T000000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const r = T().oku(ics);
      expect(r.ok).toBe(true);
      const e = r.etkinlikler[0];
      expect([e.bas, e.bit]).toEqual(['2026-06-20', '2026-06-20']);
      const yerel = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:u2', 'SUMMARY:Yerel',
        'DTSTART:20260619T220000', 'DTEND:20260620T000000', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const y = T().oku(yerel).etkinlikler[0];
      expect([y.bas, y.bit]).toEqual(['2026-06-19', '2026-06-19']);
    });
  });
})();
