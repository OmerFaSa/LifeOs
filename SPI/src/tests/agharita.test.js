/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/agharita.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* AĞ HARİTASI — brand/ortak/agharita.js. Kaynağı brand/ortak/agharita.test.js. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const A = () => window.LIFEOS.AGHARITA;

  describe('Ağ haritası', () => {
    it('veri yoksa çizmez, ne yapılırsa belireceğini söyler', () => {
      expect(A().html({ kumeler:[], bos:'Hedef koyunca belirir.' })).toContain('Hedef koyunca belirir.');
      expect(A().html({ kumeler:[] }).indexOf('<svg')).toBe(-1);
    });
    it('kümenin sıradaki adımı ilk bitmemiş düğümdür; süren varsa o kalır', () => {
      expect(A()._sira([{ durum:'bitti' }, { durum:'bekliyor' }, { durum:'bekliyor' }]).map(d => d.durum)).toEqual(['bitti', 'sirada', 'bekliyor']);
      expect(A()._sira([{ durum:'bitti' }, { durum:'bekliyor' }, { durum:'suruyor' }]).map(d => d.durum)).toEqual(['bitti', 'bekliyor', 'suruyor']);
      expect(A()._sira([{ durum:'uydurma' }]).map(d => d.durum)).toEqual(['sirada']);
    });
    it('çizim: her düğüm bir daire, sayı cümlesi aria-label\'da; az düğümde ad yazılır', () => {
      const d = document.createElement('div');
      d.innerHTML = A().html({ merkez:'Sınav', kumeler:[{ ad:'Türkçe', dugumler:[{ ad:'Sözcük', durum:'bitti' }, { ad:'Cümle', durum:'suruyor', ilerleme:.4 }, { ad:'Paragraf', durum:'bekliyor' }] },
        { ad:'Matematik', dugumler:[{ ad:'Sayılar', durum:'bekliyor' }] }] });
      expect(d.querySelectorAll('.agh__dugum').length).toBe(4);
      expect(d.querySelector('.agh__svg').getAttribute('aria-label')).toBe('Sınav yol haritası: 4 adımdan 1 tamam · 2 yolda · 1 bekliyor');
      expect(d.querySelectorAll('.agh__dugum--sirada').length).toBe(1);                 // Matematik'in ilk adımı
      expect(d.querySelectorAll('.agh__yazi--dugum').length).toBe(4);
      expect(d.querySelectorAll('.agh__dugum--suruyor .agh__ilerleme').length).toBe(1);   // ilerleme biliniyorsa halka kısmen dolu
    });
  });
})();
