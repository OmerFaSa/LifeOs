/* Ofis katları — King, Patron, uzman. İstemin iskeleti.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ofis.test.js`; `tools/ortak.py --yay` ile
   üç arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı üç söz:
     1. Her ajan kimin denetiminde konuştuğunu bilir (Patron → King).
     2. Patron değişmez: profil değişse de istemi «kalırsın» der.
     3. İstemin bölümleri sabit sırada gelir; boş bölüm hiç yazılmaz. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const O = () => window.LIFEOS.Ofis;
  const PATRON = { id:'patron', name:'Patron', role:'Baş danışman', lead:true };
  const UZMAN = { id:'tyt', name:'Tuna', role:'TYT uzmanı' };

  describe('Ofis — katlar', () => {
    it('Patron ve uzman katı ajanın kimliğinden çıkar', () => {
      expect(O().katOf(PATRON)).toBe('patron');
      expect(O().katOf({ id:'patron', name:'Patron' })).toBe('patron');
      expect(O().katOf(UZMAN)).toBe('uzman');
    });

    it('Patron King\'i bilir, değişmeyeceğini bilir, King yokken durmaz', () => {
      const z = O().konum('ays', PATRON, { uzmanSayisi:5 }).join('\n');
      expect(z).toContain('King');
      expect(z).toContain('HKM');
      expect(z).toContain('değişmezsin');
      expect(z).toContain('King kapalıysa');
      expect(z).toContain('5 uzman');
    });

    it('uzman raporunun Patron\'a gittiğini ve iki kat denetimi bilir', () => {
      const z = O().konum('spi', { id:'lab', name:'Kerem', role:'Laboratuvar' }).join('\n');
      expect(z).toContain('Patron');
      expect(z).toContain('King');
      expect(z).toContain('SPİ');
      expect(z).toContain('Kerem');
    });

    it('bilinmeyen modül için konum yazılmaz', () => {
      expect(O().konum('xyz', PATRON)).toEqual([]);
    });

    it('her modülün sınırı ayrı ve açık', () => {
      expect(O().MODULLER.spi.sinir.join(' ')).toContain('Teşhis');
      expect(O().MODULLER.esp.sinir.join(' ')).toContain('Sertifika');
      expect(O().MODULLER.ays.sinir.join(' ')).toContain('garanti');
    });
  });

  describe('Ofis — istem iskeleti', () => {
    it('bölümler sabit sırada gelir', () => {
      const t = O().istem({ modul:'ays', ajan:UZMAN, kimlik:'Sen TYT uzmanısın.',
        yontem:['Önce konu kapanışına bak.', 'Sonra netlere.', 'Tek adım söyle.'],
        kurallar:['Sayı üretme.'], uslup:'Kısa yaz.', hafiza:'HATIRLANANLAR: x',
        brifing:'{"a":1}' });
      const sira = ['KİMLİK', 'KONUMUN', 'NASIL ÇALIŞIRSIN', 'ORTAK İLKELER', 'KURALLAR',
        'ÜSLUP', 'HATIRLANANLAR', 'BRİFİNG'].map(b => t.indexOf(b));
      sira.forEach(i => expect(i >= 0).toBeTruthy());
      expect(sira.slice().sort((a, b) => a - b)).toEqual(sira);
      expect(t).toContain('1. Önce konu kapanışına bak.');
    });

    it('boş bölüm hiç yazılmaz', () => {
      const t = O().istem({ modul:'esp', ajan:PATRON, kimlik:'Sen Patronsun.' });
      expect(t.indexOf('NASIL ÇALIŞIRSIN')).toBe(-1);
      expect(t.indexOf('BRİFİNG')).toBe(-1);
      expect(t).toContain('KONUMUN');
      expect(t).toContain('ORTAK İLKELER');
    });

    it('Patron istemi King\'in notunun nereden geleceğini bilir', () => {
      expect(O().konum('ays', PATRON).join(' ')).toContain('brifingde');
    });

    it('ortak ilkeler kural motorunu, etiketleri ve hafızayı söyler', () => {
      const t = O().ILKELER.join(' ');
      expect(t).toContain('kural motoru');
      expect(t).toContain('veri yok');
      expect(t).toContain('hafızasına yazamazsın');
      expect(t).toContain('katalog');
    });
  });

  /* Patronlar arası kanal: HKM /api/kanal/<modül>. Bellekte durur, bugüne
     ait değilse kullanılmaz; HKM kapalıyken kanal yoktur ve hiçbir şey
     fırlatmaz (AGENTS.md §1.4). */
  describe('Ofis — patronlar arası kanal', () => {
    const BUGUN = '2026-09-23';
    const CEVAP = { ok:true, date:BUGUN, modul:'ays',
      king:{ text:'Bugünkü ağır yükün yarına ertelenmesini öneririm.', state:'proposed', rank:1 },
      moduller:{
        spi:{ verdict:'ANOMALY', bulgular:[{ text:'Uyku 4.5 saat — kritik eşiğin altında.', cert:'measured' },
          { text:'', cert:'measured' }] },
        esp:{ verdict:null, bulgular:[], not:'Bugün bu modülden veri gelmedi.' },
        ays:{ verdict:'APPROVED', bulgular:[] },
      } };
    function kur(ayar, cevap, bugun){
      const giden = [];
      const k = O().kanalKur({
        hkm:() => ({ MODULE:'ays', settings:() => ayar, urlOk:u => /^https?:\/\//.test(u || '') }),
        bugun:() => bugun || BUGUN,
        fetch:async (url, o) => { giden.push({ url, o });
          if(cevap instanceof Error) throw cevap;
          return { status:200, json:async () => cevap }; },
      });
      return { k, giden };
    }
    const ACIK = { enabled:true, token:'jeton', url:'http://127.0.0.1:8787' };

    it('HKM kapalıyken hiçbir şey istenmez, kanal yoktur', async () => {
      const a = kur({ enabled:false }, CEVAP);
      expect(await a.k.cek()).toBe(null);
      expect(a.giden).toHaveLength(0);
      expect(a.k.brifingIcin()).toBe(null);
    });

    it('öteki modüllerin hükmü etiketiyle, King\'in önerisi onay durumuyla gelir', async () => {
      const a = kur(ACIK, CEVAP);
      await a.k.cek();
      expect(a.giden[0].url).toBe('http://127.0.0.1:8787/api/kanal/ays?date=' + BUGUN);
      expect(a.giden[0].o.headers.Authorization).toBe('Bearer jeton');
      const b = a.k.brifingIcin();
      expect(b.moduller['SPİ'].hukum).toBe('eşik kırıldı');
      expect(b.moduller['SPİ'].bulgular).toEqual(['Uyku 4.5 saat — kritik eşiğin altında. (ölçüldü)']);
      expect(b.moduller.ESP.hukum).toBe('bugün veri gelmedi');
      expect(b.moduller.AYS).toBe(undefined);
      expect(b.king_onerisi).toContain('onayını bekliyor');
    });

    it('dünün kanalı bugün kullanılmaz', async () => {
      const a = kur(ACIK, CEVAP, '2026-09-24');
      await a.k.cek();
      expect(a.k.brifingIcin()).toBe(null);
    });

    it('ağ hatası ve bozuk cevap fırlatmaz', async () => {
      expect(await kur(ACIK, new Error('kapalı')).k.cek()).toBe(null);
      expect(await kur(ACIK, { ok:true, date:BUGUN }).k.cek()).toBe(null);
      expect(await kur(ACIK, 'bozuk').k.cek()).toBe(null);
    });
  });
})();
