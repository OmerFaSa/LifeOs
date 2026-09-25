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

    it('Merdiven: disiplin seçici sayfa başında; gövdede asılı seçici yok', async () => {
      resetState();
      const bas = yerlestir(ESP.Screens.ladder.actions());
      const govde = yerlestir(await ESP.Screens.ladder.render());
      try{
        const s = bas.querySelector('#lad-disc');
        expect(s).toBeTruthy();
        expect(s.getAttribute('data-change')).toBe('pick-disc-sel');
        expect(govde.querySelector('#lad-disc')).toBeNull();
      }finally{ bas.remove(); govde.remove(); }
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
