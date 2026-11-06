/* V5 düzen — ESP (kullanıcı, 2026-09-25: «kaos içinde bir düzeni yok …
   ne olduğu anlaşılmıyor»).

   Kanıtladığı sözler: Dil ve Merdiven ekranlarında seçici sayfa başında
   durur (actions), başlıkla bölümler arasında tek başına asılı kalmaz;
   eylem adı değişmez. Ofis › Uzman masaları kutusu adını bir kez yazar;
   başlık sırasını koruyan h2 yalnız ekran okuyucuya kalır. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }

  describe('V5 düzen — ESP', () => {
    it('Dil: dil seçici sayfa başında; gövdede asılı seçici yok', async () => {
      resetState();
      const bas = yerlestir(ESP.Screens.lang.actions());
      const govde = yerlestir(await ESP.Screens.lang.render());
      try{
        const s = bas.querySelector('select[data-change="deck-lang"]');
        expect(s).toBeTruthy();
        expect(s.getAttribute('aria-label')).toBe('Çalışılan dil');
        expect(govde.querySelector('[data-change="deck-lang"]')).toBeNull();
      }finally{ bas.remove(); govde.remove(); }
    });

    /* 2026-11-06 (kullanıcı): seçici yalnız Basamaklar'ı etkiler, yalnız orada durur. */
    it('Merdiven: disiplin seçici Basamaklar\'ın başında; sayfa başında ve öbür bölümlerde yok', async () => {
      resetState();
      expect(String(ESP.Screens.ladder.actions())).toBe('');
      const govde = yerlestir(await ESP.Screens.ladder.render());
      try{
        const s = govde.querySelectorAll('#lad-disc');
        expect(s.length).toBe(1);
        expect(s[0].closest('.sayfabolum').id).toBe('bl-yol');
        expect(s[0].getAttribute('data-change')).toBe('pick-disc-sel');
      }finally{ govde.remove(); }
    });

    it('Ofis: «Uzman masaları» bir kez görünür; h2 ekran okuyucuya kalır', async () => {
      resetState();
      const d = yerlestir(await ESP.Screens.office.render());
      try{
        const h2 = Array.from(d.querySelectorAll('h2')).filter(h => h.textContent.trim() === 'Uzman masaları');
        expect(h2).toHaveLength(1);
        expect(h2[0].classList.contains('sr-only')).toBe(true);
        expect(d.querySelector('.desks')).toBeTruthy();
      }finally{ d.remove(); }
    });
  });
})();
