/* Ses kimliği — ESP.Speak.KIMLIK'in gerçek ESP kadrosuna karşılık geldiğini
   dener. Bu tablo bir zamanlar SPİ'den kopyalanmış (patron/lab/nutri/move/
   money) kalmıştı: dokuz ESP ajanından sekizi styleFor()'da varsayılana
   ({rate:1,pitch:1}) düşüyor, toplantıyı dinleyen kullanıcı kimin konuştuğunu
   ayırt edemiyordu. */

(function(){
  const { describe, it, expect } = ESP.Test;

  describe('Speak · ajan ses kimliği', () => {

    it('KIMLIK gercek ESP kadrosunu tasir, SPI kalintisini degil', () => {
      const kadro = ESP.AGENTS.map(a => a.id);
      kadro.forEach(id => {
        expect(id in ESP.Speak.KIMLIK).toBeTruthy();
      });
      ['lab', 'nutri', 'move', 'money'].forEach(id => {
        expect(id in ESP.Speak.KIMLIK).toBeFalsy();
      });
    });

    it('dokuz ajanin hicbiri varsayilan {rate:1,pitch:1} degerine dusmez', () => {
      ESP.AGENTS.forEach(a => {
        const s = ESP.Speak.styleFor(a.id);
        expect(s.rate === 1 && s.pitch === 1).toBeFalsy();
      });
    });

    it('her ajanin rate/pitch cifti benzersizdir', () => {
      const ciftler = ESP.AGENTS.map(a => {
        const s = ESP.Speak.styleFor(a.id);
        return s.rate + '/' + s.pitch;
      });
      expect(new Set(ciftler).size).toBe(ESP.AGENTS.length);
    });

    it('tanimsiz ajan icin varsayilana duser', () => {
      const s = ESP.Speak.styleFor('yok-boyle-ajan');
      expect(s.rate).toBe(1);
      expect(s.pitch).toBe(1);
    });
  });

  describe('Ajan avatari · baş harf', () => {
    it('dokuz ajanin hicbiri ayni bas harfi paylasmaz', () => {
      /* Patron/Polyglot ikisi de P, Maestro/Montaigne ikisi de M idi —
         portre olmadan avatar dairesindeki tek ayirt edici isaret buydu. */
      const harfler = ESP.AGENTS.map(a => a.initial);
      expect(new Set(harfler).size).toBe(ESP.AGENTS.length);
    });
  });

})();
