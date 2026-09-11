/* Ses katmanı — telaffuz, ajan kimliği, sıra alma ve konuşma belleği.

   En kritik test: ses ekrandaki metinden BAŞKA bir şey söylemez.
   Söyleseydi duyduğun cümle ile gördüğün cümle ayrışırdı ve hangisinin
   doğru olduğu belirsizleşirdi. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync, pushLab } = SP.Test;

  describe('Ses — telaffuz hazırlığı', () => {
    it('anlamı değiştirmez, yalnızca duyulur kılar', () => {
      expect(SP.Speak.konusulacak('Ferritin %40 düştü')).toBe('Ferritin yüzde 40 düştü');
      expect(SP.Speak.konusulacak('14 ng/mL')).toBe('14 ng mL');
      expect(SP.Speak.konusulacak('A · B')).toBe('A, B');
      expect(SP.Speak.konusulacak('Kerem → Nesrin')).toBe('Kerem, Nesrin');
    });

    it('işaretleme okunmaz', () => {
      expect(SP.Speak.konusulacak('**Ferritin** düşük')).toBe('Ferritin düşük');
      expect(SP.Speak.konusulacak('`kod` ve _eğik_')).toBe('kod ve eğik');
    });

    it('sayıya dokunmaz', () => {
      /* Bir ölçümün değeri seste de aynen geçer; yuvarlama yapılmaz. */
      expect(SP.Speak.konusulacak('Ferritin 13,5 ng/mL')).toBe('Ferritin 13,5 ng mL');
    });

    it('boş girdi boş döner', () => {
      expect(SP.Speak.konusulacak('')).toBe('');
      expect(SP.Speak.konusulacak(null)).toBe('');
    });
  });

  describe('Ses — ajan kimliği', () => {
    it('beş ajanın hepsinin bir konuşma biçimi var', () => {
      SP.AGENTS.forEach(a => {
        const st = SP.Speak.styleFor(a.id);
        expect(typeof st.rate).toBe('number');
        expect(typeof st.pitch).toBe('number');
      });
    });

    it('hiçbir iki ajan aynı biçimde konuşmaz', () => {
      const imza = SP.AGENTS.map(a => {
        const s = SP.Speak.styleFor(a.id);
        return s.rate + '/' + s.pitch;
      });
      expect(new Set(imza).size).toBe(SP.AGENTS.length);
    });

    it('Patron en yavaş konuşandır', () => {
      const p = SP.Speak.styleFor('patron').rate;
      SP.AGENTS.filter(a => a.id !== 'patron').forEach(a => {
        expect(SP.Speak.styleFor(a.id).rate > p).toBeTruthy();
      });
    });

    it('bilinmeyen ajan nötr biçim alır', () => {
      const s = SP.Speak.styleFor('yok-boyle-biri');
      expect(s.rate).toBe(1);
      expect(s.pitch).toBe(1);
    });
  });

  describe('Sesli sohbet — döngü sözleşmesi', () => {
    it('ses tanıma yoksa döngü hiç başlamaz', () => {
      const gercek = SP.Voice.supported;
      SP.Voice.supported = () => false;
      const r = SP.Talk.start('patron', {});
      SP.Voice.supported = gercek;
      expect(r.ok).toBeFalsy();
      expect(r.reason).toBe('unsupported');
      expect(SP.Talk.isActive()).toBeFalsy();
    });

    it('kapalıyken durum kapalıdır ve ajan yoktur', () => {
      SP.Talk.stop();
      const d = SP.Talk.durum();
      expect(d.acik).toBeFalsy();
      expect(d.durum).toBe('kapalı');
      expect(d.agentId).toBeNull();
    });

    it('konuşmuyorken söz kesilemez', () => {
      SP.Talk.stop();
      expect(SP.Talk.kes()).toBeFalsy();
    });

    it('sessizlik eşiği bir saniyeden uzundur', () => {
      /* Cümle ortasında düşünmek için bir saniye yetmez. */
      expect(SP.Talk.SESSIZLIK_MS > 1000).toBeTruthy();
    });
  });

  describe('Sohbet belleği', () => {
    it('geçmiş modelin anlayacağı role\'lere çevrilir', () => {
      resetState();
      SP.S.officeChats.lab = [
        { role:'user', text:'ferritinim nasıl?' },
        { role:'agent', text:'Bandın altında.' },
      ];
      const h = SP.Office.historyFor('lab');
      expect(h).toHaveLength(2);
      expect(h[0].role).toBe('user');
      expect(h[1].role).toBe('assistant');
    });

    it('pencere sınırlıdır — eski turlar düşer', () => {
      resetState();
      SP.S.officeChats.lab = [];
      for(let i = 0; i < 30; i++){
        SP.S.officeChats.lab.push({ role:i % 2 ? 'agent' : 'user', text:'m' + i });
      }
      const h = SP.Office.historyFor('lab');
      expect(h.length).toBe(SP.Office.HAFIZA_TUR);
      /* Düşen BAŞTAN düşer: en yeni turlar kalır. */
      expect(h[h.length - 1].text).toBe('m29');
    });

    it('boş metinli tur geçmişe girmez', () => {
      resetState();
      SP.S.officeChats.lab = [
        { role:'user', text:'' },
        { role:'agent', text:'Bir şey var.' },
      ];
      expect(SP.Office.historyFor('lab')).toHaveLength(1);
    });

    it('sohbeti olmayan ajanın geçmişi boştur', () => {
      resetState();
      expect(SP.Office.historyFor('money')).toHaveLength(0);
    });

    it('bir ajanın geçmişi diğerine karışmaz', () => {
      resetState();
      SP.S.officeChats.lab = [{ role:'user', text:'kerem sorusu' }];
      SP.S.officeChats.nutri = [{ role:'user', text:'nesrin sorusu' }];
      expect(SP.Office.historyFor('lab')[0].text).toBe('kerem sorusu');
      expect(SP.Office.historyFor('nutri')[0].text).toBe('nesrin sorusu');
    });

    it('soru geçmişe iki kez girmez', async () => {
      resetState();
      await SP.Office.saveSettings({ provider:'openrouter', model:'' });  // model kapalı
      await withTodayAsync('2026-03-01', async () => {
        await SP.Office.send('lab', 'ilk soru');
        await SP.Office.send('lab', 'ikinci soru');
        const list = SP.S.officeChats.lab.filter(m => m.role === 'user');
        expect(list.map(m => m.text)).toEqual(['ilk soru', 'ikinci soru']);
      });
    });
  });
})();
