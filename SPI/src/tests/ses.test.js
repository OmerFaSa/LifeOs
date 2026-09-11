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

  describe('Ses — uzun metin bölünmesi', () => {
    it('cümle sonundan böler', () => {
      const p = SP.Speak.cumleler('Bir cümle. İkinci cümle! Üçüncü?');
      expect(p).toEqual(['Bir cümle.', 'İkinci cümle!', 'Üçüncü?']);
    });

    it('sayının içindeki nokta cümle sonu sayılmaz', () => {
      /* «13.5 ng» ortadan bölünürse ölçüm iki parçaya ayrılıp yanlış
         okunur. Noktalamadan sonra boşluk aranır. */
      const p = SP.Speak.cumleler('Ferritin 13.5 ng mL ve devamı var.');
      expect(p).toHaveLength(1);
    });

    it('uzun metin parçalara iner ve hiçbir parça sınırı aşmaz', () => {
      const uzun = new Array(40).fill('Bu oldukça uzun bir cümle parçasıdır.').join(' ');
      const p = SP.Speak.parcala(uzun);
      expect(p.length > 1).toBeTruthy();
      p.forEach(x => expect(x.length <= SP.Speak.PARCA).toBeTruthy());
    });

    it('bölünen parçalar metnin tamamını taşır', () => {
      const metin = 'Birinci cümle burada. İkinci cümle şurada. Üçüncü cümle orada.';
      const birlesik = SP.Speak.parcala(metin).join(' ');
      /* Kelime kaybı olmamalı: ses eksik cümle okumaz. */
      expect(birlesik.replace(/\s+/g, ' ')).toBe(metin);
    });

    it('boşluksuz tek uzun kelime bile bölünür', () => {
      const p = SP.Speak.parcala('a'.repeat(500));
      expect(p.length > 1).toBeTruthy();
    });

    it('emniyet süresi uzunlukla artar ve tavanlanır', () => {
      /* onend hiç gelmezse sıra alma döngüsü bu süreyle kurtulur. */
      const kisa = SP.Speak.emniyetMs('kısa', 1);
      const uzun = SP.Speak.emniyetMs('x'.repeat(2000), 1);
      expect(uzun > kisa).toBeTruthy();
      expect(SP.Speak.emniyetMs('x'.repeat(999999), 1) <= 45000).toBeTruthy();
      /* Hızlı okuma daha kısa süre ister. Ölçü GERÇEK parça boyuyla
         yapılır: 1.000 karakterde iki değer de tavana çarpar ve
         karşılaştırma anlamsızlaşır — parçalar zaten PARCA sınırının
         altındadır. */
      const boy = 'x'.repeat(SP.Speak.PARCA);
      expect(SP.Speak.emniyetMs(boy, 2) < SP.Speak.emniyetMs(boy, 1)).toBeTruthy();
      /* Bir parçanın en kötü süresi yarım dakikayı geçmemeli: geçerse
         mikrofon çok uzun kapalı kalır. */
      expect(SP.Speak.emniyetMs(boy, 1) < 30000).toBeTruthy();
    });

    it('boş metin parça üretmez', () => {
      expect(SP.Speak.parcala('')).toHaveLength(0);
      expect(SP.Speak.parcala('   ')).toHaveLength(0);
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
