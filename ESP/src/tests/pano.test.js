/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/pano.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Pano kartları — görsel dilin ortak parçaları (brand/ortak/pano.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/pano.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const P = () => window.LIFEOS.PANO;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('Pano kartları (2026-10-20)', () => {
    it('kart: başlık, yuva, gövde; metin kaçırılır; boş kart kesik çerçeve, tek cümle, tek düğme', () => {
      let k = dom(P().kart({ ad:'<b>Uyku</b>', simge:'uyku', yuva:'ölçüldü', govde:P().deger('6 sa 30 dk', '', 'plan 8 sa') }));
      expect(k.querySelector('.pk__ad').textContent).toBe('<b>Uyku</b>');
      expect(k.querySelector('.pk__yuva').textContent).toBe('ölçüldü');
      expect(k.querySelector('.pk__sayi').textContent).toBe('6 sa 30 dk');
      k = dom(P().kart({ ad:'Toparlanma', bos:{ cumle:'Uyku girilince hesaplanır.', dugme:{ label:'Uyku gir', act:'go', data:{ 'data-route':'gun' } } } }));
      expect(k.querySelector('.pk').classList.contains('pk--bos')).toBe(true);
      expect(k.querySelector('.pk__boscumle').textContent).toBe('Uyku girilince hesaplanır.');
      expect(k.querySelector('[data-act="go"]').getAttribute('data-route')).toBe('gun');
    });
    it('halka: oran yoksa yalnız iz (hedef uydurulmaz); oran 1i aşsa da halka dolu kalır', () => {
      expect(dom(P().halka({ oran:null })).querySelector('.pk-halka__dolu')).toBe(null);
      expect(!!dom(P().halka({ oran:.5, etiket:'yarısı' })).querySelector('[aria-label="yarısı"]')).toBe(true);
      const d = dom(P().halka({ oran:1.4 })).querySelector('.pk-halka__dolu').getAttribute('stroke-dasharray').split(' ');
      expect(d[0]).toBe(d[1]);
    });
    it('segment: hedef kadar kutu, yapılan dolu; bilinmeyen yapılan kesik, sıfır değil', () => {
      let k = dom(P().segment({ hedef:4, yapilan:3, etiket:'Asgari gün' }));
      expect(k.querySelectorAll('i').length).toBe(4);
      expect(k.querySelectorAll('i.is-dolu').length).toBe(3);
      expect(k.querySelector('[role="img"]').getAttribute('aria-label')).toBe('Asgari gün: 3 / 4, 1 kaldı');
      k = dom(P().segment({ hedef:4, yapilan:null }));
      expect(k.querySelector('.pk-segment').classList.contains('is-yok')).toBe(true);
      expect(P().segment({ hedef:0 })).toBe('');
    });
    it('eşik: değer ya da eşik yoksa çizilmez; aşım yönü bilinince renklenir', () => {
      expect(P().esik({ deger:null, esik:10 })).toBe('');
      const k = dom(P().esik({ deger:15, esik:10, olcek:50, yon:'azalis-iyi', etiket:'borç' }));
      expect(!!k.querySelector('.pk-esik__asim.is-kotu')).toBe(true);
      expect(k.querySelector('.pk-esik__cizgi').getAttribute('style')).toBe('left:20%');
    });
    it('sütun: girilmemiş gün kesik kutu, son gün vurgulu; hiç kayıt yoksa çizilmez', () => {
      const k = dom(P().sutun({ degerler:[10, null, 20], etiket:'üç gün' }));
      expect(k.querySelectorAll('.pk-sutun__k').length).toBe(3);
      expect(k.querySelectorAll('.is-yok').length).toBe(1);
      expect(k.querySelector('.pk-sutun__k:last-child').classList.contains('is-son')).toBe(true);
      expect(P().sutun({ degerler:[null, null] })).toBe('');
    });
    it('kareler ve ısı: durumlar sınıfa döner; ısıda null kayıt yok, sıfır en açık seviye', () => {
      let k = dom(P().kareler({ durumlar:['dolu', 'donmus', 'bugun'], sutun:3 }));
      expect(Array.from(k.querySelectorAll('i')).map(i => i.className)).toEqual(['is-dolu', 'is-donmus', 'is-bugun']);
      k = dom(P().isi({ degerler:[0, null, 30, 60], sutun:4 }));
      expect(Array.from(k.querySelectorAll('i')).map(i => i.className)).toEqual(['is-s0', 'is-yok', 'is-s2', 'is-s3']);
    });
    it('yığın, çubuklar, çizgi, şerit, liste ve önce-sonra veriyle çizilir, boş veride boş döner', () => {
      expect(dom(P().yigin({ parcalar:[{ ad:'Protein', deger:96, metin:'96 g' }, { ad:'Yağ', deger:0 }] })).querySelectorAll('.pk-yigin span').length).toBe(1);
      expect(P().yigin({ parcalar:[] })).toBe('');
      expect(dom(P().cubuklar({ satirlar:[{ ad:'Mat', oran:.5, plan:.6, metin:'5 sa' }] })).querySelector('.pk-cubuklar__iz b').getAttribute('style')).toBe('left:60%');
      expect(dom(P().cizgi({ noktalar:[{ ad:'Kahvaltı', yer:.1, dolu:true }, { ad:'Akşam', yer:.9 }] })).querySelectorAll('.is-dolu').length).toBe(1);
      expect(dom(P().serit({ parcalar:[{ ad:'Mat', sure:2, durum:'bitti' }, { ad:'Fizik', sure:1, durum:'simdi' }] })).querySelectorAll('.is-simdi').length).toBe(1);
      expect(dom(P().liste({ satirlar:[{ sol:'08:10', ad:'Kahvaltı', not:'520 kcal', nokta:0 }] })).querySelector('.pk-liste__not').textContent).toBe('520 kcal');
      expect(dom(P().onceSonra({ once:'7 sa', sonra:'7 sa 30 dk' })).querySelector('s').textContent).toBe('7 sa');
    });
    it('hedef kartı: süre çubuğu geçen günün payı; değer yalnız biliniyorsa yazılır', () => {
      const h = { cumle:'5 km koşmak', olusturma:'2026-10-01', son_tarih:'2026-10-31', simdi:null, hedefDeger:5, birim:'km' };
      let k = dom(P().hedefKarti(h, '2026-10-16'));
      expect(k.querySelector('.pk__ad').textContent).toBe('5 km koşmak');
      expect(k.querySelector('.pk__yuva').textContent).toBe('31 Eki’e 15 gün');
      expect(k.querySelector('.pk-esik__cizgi').getAttribute('style')).toBe('left:50%');
      expect(k.querySelector('.pk__sayi')).toBe(null);                       // şu anki değer bilinmiyor
      k = dom(P().hedefKarti(Object.assign({}, h, { simdi:{ deger:3.5 } }), '2026-10-16'));
      expect(k.querySelector('.pk__sayi').textContent).toBe('3,5km');
      expect(P().hedefIzgara([], '2026-10-16')).toBe('');
    });
  });
})();
