/* Onaylar — uzman önerileri disipline göre (screens/onaylar.js AjanKart).

   Depo sahibi (2026-10-16): «yeni bir kullanıcı baktığında aşina olması çok
   zor; sadeleştirelim ama özellik silmeyelim». Boş profilde altı disiplin ×
   dört öneri = 24 kart alt alta duruyordu.

   Kanıtladığı sözler: her disiplinin yalnız EN ÖNDEKİ önerisi açık görünür;
   kalanlar «N öneri daha» altında katlıdır ama DOM'dadır (hiçbiri silinmez);
   toplam sayı değişmez; tek disiplin varsa gruplama yapılmaz. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const oneri = (id, disc) => ({ id, disc, agentId:'patron', kind:'reminder', title:'Öneri ' + id, why:'neden', payload:{} });

  async function ciz(liste){
    const eski = ESP.Plans.all;
    ESP.Plans.all = () => liste;
    try{ return dom(await ESP.Screens.onaylar.render()); }
    finally{ ESP.Plans.all = eski; }
  }

  describe('Onaylar — öneriler disipline göre', () => {
    it('her disiplinde bir öneri açık, kalanı katlı; hiçbiri silinmez', async () => {
      resetState();
      const k = await ciz([oneri('a1', 'lang'), oneri('a2', 'lang'), oneri('a3', 'lang'), oneri('b1', 'philo'), oneri('b2', 'philo')]);
      const gruplar = k.querySelectorAll('.oneri-grup');
      expect(gruplar.length).toBe(2);
      const dahasi = k.querySelectorAll('.oneri-grup__dahasi');
      expect(dahasi.length).toBe(2);
      expect(dahasi[0].hasAttribute('open')).toBe(false);
      expect(dahasi[0].querySelector('summary').textContent).toContain('2 öneri daha');
      ['a1', 'a2', 'a3', 'b1', 'b2'].forEach(id => expect(k.textContent).toContain('Öneri ' + id));
      expect(k.textContent).toContain('5 öneri');
    });

    it('tek disiplin varsa gruplama yok', async () => {
      resetState();
      const k = await ciz([oneri('a1', 'lang'), oneri('a2', 'lang')]);
      expect(k.querySelectorAll('.oneri-grup').length).toBe(0);
      expect(k.textContent).toContain('Öneri a2');
    });
  });
})();
