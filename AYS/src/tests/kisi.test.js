/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/kisi.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Kişi modeli (brand/ortak/kisi.js) — belgeler/ekip/KISI-PLANI.md.
   Kanıtlanan sözler: yalnız açık beyan alınır (soru, başkası, veri, geçici
   his alınmaz); cümle olduğu gibi saklanır; tanışma günde bir ve en az
   bilinen alandan; özet etiketli ve ajan izniyle süzülür. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const K = () => window.LIFEOS.KISI;

  describe('Kişi — açık beyan', () => {
    it('alanıyla ve cümlenin kendisiyle alınır', () => {
      const v = m => { const b = K().beyan(m); return b ? [b.alan, b.metin] : null; };
      expect(v('Balığı hiç sevmem')).toEqual(['sevgi', 'Balığı hiç sevmem']);
      expect(v('hobim satranç ve yüzme')).toEqual(['hobi', 'Hobim satranç ve yüzme']);
      expect(v('Matematikten nefret ediyorum.')).toEqual(['sevgi', 'Matematikten nefret ediyorum']);
      expect(v('Ben gece insanıyım')).toEqual(['ritim', 'Ben gece insanıyım']);
      expect(v('Hedefim tıp fakültesi')).toEqual(['kimlik', 'Hedefim tıp fakültesi']);
      expect(v('Sınavlar beni çok strese sokuyor')).toEqual(['ruh', 'Sınavlar beni çok strese sokuyor']);
      expect(v('Telefon için para biriktiriyorum')).toEqual(['maddiyat', 'Telefon için para biriktiriyorum']);
      expect(v('Kahveyi çok severim. 2 bardak içtim')).toEqual(['sevgi', 'Kahveyi çok severim']);
    });
    it('soru, başkası hakkındaki cümle, veri ve geçici his alınmaz', () => {
      ['Balık sever misin?', 'Annem balık sevmez', '2 yumurta yedim', 'Bugün yorgunum', 'antrenman yapacağım', '']
        .forEach(m => expect(K().beyan(m)).toBe(null));
    });
  });

  describe('Kişi — ajan izinleri (Faz 5)', () => {
    it('varsayılan: inanç yalnız King; sevgi herkes; değişiklik saklanır', () => {
      let eski = null;
      try{ eski = localStorage.getItem(K().IZIN); localStorage.removeItem(K().IZIN); }catch(e){}
      try{
        expect(K().izinli('deger', 'spi')).toBe(false);
        expect(K().izinli('sevgi', 'ays')).toBe(true);
        expect(K().izinli(null, 'esp')).toBe(true);                  // alansız eski kayıt
        K().izinDegistir('deger', 'spi', true);
        expect(K().gorenler('deger')).toEqual(['spi']);
        K().izinDegistir('sevgi', 'ays', false);
        expect(K().izinli('sevgi', 'ays')).toBe(false);
        const H = window.LIFEOS.Hafiza;
        const l = [{ id:'a', metin:'Balığı sevmem', katman:'sohbet', kaynak:'kural', alan:'sevgi', durum:'etkin', at:'1' },
          { id:'b', metin:'Allaha inanıyorum', katman:'sohbet', kaynak:'kural', alan:'deger', durum:'etkin', at:'2' }];
        expect(H.baglam(l, { ajan:'ays' }).indexOf('Balığı') < 0).toBe(true);
        expect(H.baglam(l, { ajan:'spi' })).toContain('inanıyorum');
        expect(H.baglam(l)).toContain('Balığı');                       // King: hepsi
      }finally{ try{ if(eski == null) localStorage.removeItem(K().IZIN); else localStorage.setItem(K().IZIN, eski); }catch(e){} }
    });
  });

  describe('Kişi — tanışma ve özet', () => {
    it('tanışma günde bir; en az bilinen alandan', () => {
      const kayit = K().ALANLAR.filter(a => a.id !== 'hobi').map(a => ({ alan:a.id, metin:'x', katman:'soz' }));
      const q = K().tanismaSorusu(kayit, '2026-10-17', null);
      expect(q.alan).toBe('hobi');
      expect(K().tanismaSorusu(kayit, '2026-10-17', '2026-10-17')).toBe(null);
      expect(K().cevapMetni('Boş zamanında ne yapmayı seversin?', '  kitap okurum ')).toBe('Boş zamanında ne yapmayı seversin → kitap okurum');
    });
    it('özet etiketli; ajan yalnız izinli alanı görür, King hepsini', () => {
      const kayit = [{ alan:'deger', metin:'Allaha inanıyorum', katman:'sohbet' }, { alan:'sevgi', metin:'Balığı sevmem', katman:'sohbet' }];
      const king = K().ozet(kayit);
      expect(king).toContain('Allaha inanıyorum (sohbetten)');
      expect(king).toContain('teşhis ya da yargı kurma');
      const ays = K().ozet(kayit, { ajan:'ays' });
      expect(ays.indexOf('inanıyorum') < 0).toBe(true);
      expect(ays).toContain('Balığı sevmem');
    });
  });
})();
