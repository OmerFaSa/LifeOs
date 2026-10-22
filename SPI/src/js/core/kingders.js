/* Öğretmen (King, 2026-10-22): SPİ'nin öğrenme kavramı King dersi olarak.

   Metin data/ogrenme.js'teki kavramın kendisidir (tanım, dikkat, örnek); King
   yazmaz, model çağrılmaz. Kavramın inceleme durumu etikette durur. SPİ teşhis
   koymaz ve doz önermez (AGENTS §1.5): ders yalnız kayıt ve kavram anlatır. */

window.SP = window.SP || {};

SP.KingDers = (function(){
  function ders(konu){
    const t = String(konu || '').toLocaleLowerCase('tr').trim();
    if(t.length < 3) return null;
    const l = SP.OGRENME_KAVRAMLAR || [];
    const ad = c => String(c.title || '').toLocaleLowerCase('tr');
    const c = l.find(k => ad(k) === t) || l.find(k => t.includes(ad(k)) || ad(k).includes(t));
    if(!c) return null;
    return { id:c.id, baslik:c.title, alt:'SPİ · kavram', giris:'',
      etiket:c.ready_for_app ? 'SPİ öğrenme kavramı' : 'doğrulanmadı · uzman incelemesi bekliyor',
      sorgu:c.title, soruVar:false,
      bolumler:[{ baslik:'Tanım', metin:c.definition },
        { baslik:'Dikkat', metin:c.watch },
        { baslik:'Örnek', metin:c.example }].filter(b => b.metin) };
  }
  return { ders };
})();
