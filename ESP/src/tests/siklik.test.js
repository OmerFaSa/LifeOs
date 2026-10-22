/* Sik kelime kapsami (core/siklik.js + data/kelimesiklik.js). */

(function(){
  const { describe, it, expect, resetState, pushCard } = ESP.Test;
  const F = ESP.Siklik;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }

  describe('sik kelime listesi', () => {
    it('ESP dillerinin listesi uretilmis dosyadan gelir; Latince icin liste yok', () => {
      ['en', 'de', 'fr', 'es', 'it', 'ru', 'ar'].forEach(dil => {
        const L = F.liste(dil);
        expect(L && L.kelimeler.length).toBe(ESP.KELIME_SIKLIK.n);
      });
      expect(F.liste('la')).toBe(null);
      expect(ESP.KELIME_SIKLIK.etiket).toBe('hesaplandı');
    });

    it('derlem parcalari ayiklanmis: kesmeli parca, noktalama, tek harf yok', () => {
      const en = F.liste('en').kelimeler;
      expect(en.slice(0, 3)).toEqual(['you', 'i', 'the']);
      expect(en.filter(k => /^'|'$/.test(k) || ['don', 's', 't', 'm'].indexOf(k) !== -1)).toEqual([]);
      expect(F.liste('fr').kelimeler.filter(k => /'$/.test(k))).toEqual([]);
      expect(F.liste('ar').kelimeler.indexOf('،')).toBe(-1);
      ['en', 'de', 'ru'].forEach(dil => {
        const L = F.liste(dil);
        expect(new Set(L.kelimeler).size).toBe(L.kelimeler.length);
      });
    });
  });

  describe('kart on yuzu -> anahtar', () => {
    it('tanimlik ve «to» duser, ilk alternatif alinir, buyuk harf kuculur', () => {
      expect(F.anahtar('to grasp', 'en')).toBe('grasp');
      expect(F.anahtar('The House', 'en')).toBe('house');
      expect(F.anahtar('der Hund', 'de')).toBe('hund');
      expect(F.anahtar('Hund, der', 'de')).toBe('hund');
      expect(F.anahtar('go / went', 'en')).toBe('go');
      expect(F.anahtar("l'homme", 'fr')).toBe('homme');
      expect(F.anahtar('la casa (f.)', 'es')).toBe('casa');
      expect(F.anahtar('Ты!', 'ru')).toBe('ты');
    });

    it('kalip ve cumle tek kelimeye indirgenmez: kapsama girmez', () => {
      expect(F.anahtar('make a point', 'en')).toBe(null);
      expect(F.anahtar('as far as I can tell', 'en')).toBe(null);
      expect(F.anahtar('', 'en')).toBe(null);
      expect(F.anahtar('trotzdem', 'de')).toBe('trotzdem');
    });

    it('sirasi listedeki yeri soyler; listede olmayan null', () => {
      expect(F.sirasi('you', 'en')).toBe(1);
      expect(F.sirasi('make a point', 'en')).toBe(null);
      expect(F.sirasi('zzzqx', 'en')).toBe(null);
    });
  });

  describe('kapsam', () => {
    it('bos deste: bantlar olculur ve destede sifirdir; eksik liste en sik kelimeyle baslar', () => {
      const k = F.kapsam('en', []);
      expect(k.var).toBe(true);
      expect(k.bantlar.map(b => b.ust)).toEqual([100, 500, 1000, 2000]);
      k.bantlar.forEach(b => { expect(b.destede).toBe(0); expect(b.yok).toBe(b.ust); });
      expect(k.eksik.slice(0, 3)).toEqual(['you', 'i', 'the']);
      expect(k.eksik.length).toBe(12);
    });

    it('liste olmayan dilde kapsam uretilmez (sifir degil, olcum yok)', () => {
      expect(F.kapsam('la', [{ front:'amo', lang:'la', box:5 }])).toEqual({ var:false, dil:'la', neden:'liste-yok' });
    });

    it('destede/oturmus kutuya gore ayrilir; ayni kelimenin en saglam karti sayilir', () => {
      const kartlar = [
        { front:'you', lang:'en', box:5 },
        { front:'the', lang:'en', box:2 },
        { front:'The', lang:'en', box:4 },          // ayni kelime: en yuksek kutu
        { front:'to go', lang:'en', box:1 },
        { front:'nevertheless', lang:'en', box:5 },  // ilk 100'de degil
        { front:'make a point', lang:'en', box:5 },  // kalip: girmez
        { front:'you  →  ?', lang:'en', box:5, tags:['hata'] },
        { front:'ich', lang:'de', box:5 },           // baska dil
      ];
      const k = F.kapsam('en', kartlar);
      const ilk100 = k.bantlar[0];
      expect(ilk100.destede).toBe(3);                // you, the, go
      expect(ilk100.oturmus).toBe(2);                // you (5), the (4)
      expect(ilk100.yok).toBe(97);
      expect(k.eksik.indexOf('you')).toBe(-1);
      expect(k.eksik.indexOf('go')).toBe(-1);
      const b2000 = k.bantlar[3];
      expect(b2000.destede >= ilk100.destede).toBe(true);
    });
  });

  describe('Dil ekrani', () => {
    it('Ilerleme bolumu kapsam cubugunu cizer; aria sayiyi cumleyle soyler', async () => {
      resetState();
      ESP.S.ui.langDeck = 'en';
      pushCard({ front:'you', back:'sen', lang:'en', box:5 });
      pushCard({ front:'the', back:'belirli tanımlık', lang:'en', box:2 });
      ESP.Memo.bitir();
      const d = yerlestir(await ESP.Screens.lang.render());
      try{
        const g = d.querySelector('.siklik[role="img"]');
        expect(!!g).toBe(true);
        expect(g.querySelectorAll('.siklik__s').length).toBe(4);
        expect(g.getAttribute('aria-label')).toContain('ilk 100 kelimenin 2 tanesi destede, 1 tanesi oturmuş');
        /* Ekle bolumu: destede olmayan sik kelimeler, ilk 'you' degil. */
        const dug = Array.from(d.querySelectorAll('[data-act="siklik-on"]')).map(b => b.getAttribute('data-word'));
        expect(dug.length).toBe(12);
        expect(dug.indexOf('you')).toBe(-1);
        expect(dug[0]).toBe('i');
      }finally{ d.remove(); }
    });

    it('sik kelimeye dokunmak yalniz on yuzu doldurur, kart eklemez', async () => {
      resetState();
      ESP.S.ui.langDeck = 'en';
      const once = ESP.S.cards.length;
      ESP.S.ui.siklikOn = 'know';
      const d = yerlestir(await ESP.Screens.lang.render());
      try{
        expect(d.querySelector('#c-front').value).toBe('know');
        expect(ESP.S.cards.length).toBe(once);
      }finally{ d.remove(); ESP.S.ui.siklikOn = null; }
    });
  });
})();
