/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ofis.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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

    it('ortak ilkeler kural motorunu, etiketleri ve hafızayı söyler', () => {
      const t = O().ILKELER.join(' ');
      expect(t).toContain('kural motoru');
      expect(t).toContain('veri yok');
      expect(t).toContain('hafızasına yazamazsın');
      expect(t).toContain('katalog');
    });
  });
})();
