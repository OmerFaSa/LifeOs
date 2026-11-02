/* ESP.KingOgret (core/kingogret.js) testleri — görev 071. */
(function(){
  const { describe, it, expect } = ESP.Test;
  const K = () => ESP.KingOgret;

  function ornekKartlar(){
    return [
      { id:'c1', front:'apple', back:'elma', lang:'en', box:1, reps:0 },
      { id:'c2', front:'house', back:'ev', lang:'en', box:4, reps:6 },
      { id:'c3', front:'water', back:'su', lang:'en', box:2, reps:2 },
      { id:'c4', front:'book', back:'kitap', lang:'en', box:2, reps:1 },
      { id:'c5', front:'', back:'boş', lang:'en' },
    ];
  }

  function sifirla(){
    localStorage.removeItem('esp.ogret.tekrar');
    localStorage.removeItem('esp.ogret.son');
  }

  describe('King öğretmen (ESP.KingOgret)', () => {
    it('4\'ten az kart null, boş yüzlü kart elenir', () => {
      const eski = ESP.S.cards;
      try{
        ESP.S.cards = [];
        expect(K().soru('')).toBeNull();

        ESP.S.cards = [
          { id:'c1', front:'apple', back:'elma', lang:'en' },
          { id:'c2', front:'house', back:'ev', lang:'en' },
          { id:'c3', front:'water', back:'su', lang:'en' }
        ];
        expect(K().soru('')).toBeNull();

        // 4 kart var ama 1\'inin ön yüzü boş
        ESP.S.cards.push({ id:'c4', front:'', back:'kitap', lang:'en' });
        expect(K().soru('')).toBeNull();
      }finally{
        ESP.S.cards = eski;
      }
    });

    it('seçenekler 4 farklı arka yüz; doğru harf kartın arkası', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        const q = K().soru('');
        expect(q !== null).toBe(true);
        expect(q.sec.length).toBe(4);
        expect(new Set(q.sec).size).toBe(4);
        expect(q.sec.indexOf('boş') < 0).toBe(true);

        const parts = q.id.split('|');
        const kartId = parts[0];
        const harf = parts[1];
        const kart = ESP.S.cards.find(c => c.id === kartId);
        expect(kart !== undefined).toBe(true);
        expect(q.soru).toBe('«' + kart.front + '» ne demek?');
        expect(q.sec['ABCD'.indexOf(harf)]).toBe(kart.back);
        expect(q.konu).toBe('Kelime kartı');
        expect(q.kaynak.indexOf('ESP') >= 0).toBe(true);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('konu eşleşirse o kart, eşleşmezse soru üretmeye devam eder', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        expect(K().soru('house').id.split('|')[0]).toBe('c2');
        expect(K().soru('elma').id.split('|')[0]).toBe('c1');
        const qBilinmeyen = K().soru('uzay gemisi');
        expect(qBilinmeyen !== null).toBe(true);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('yanlış cevap -> motor takvimi (n:0, y:1), son yanlış ve teşhis; kart nesnesi değişmez', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        const kopya = JSON.stringify(ESP.S.cards);

        const q = K().soru('apple');
        const dogruHarf = q.id.split('|')[1];
        const yanlisHarf = 'ABCD'.split('').find(h => h !== dogruHarf);

        const a = K().cevapla(q.id, yanlisHarf);
        expect(a.dogru).toBe(dogruHarf);
        expect(a.not.indexOf('Yarın bu konudan benzer bir soru soracağım.') >= 0).toBe(true);
        expect(a.not.indexOf('Kartın kendi tekrar takvimi değişmez.') >= 0).toBe(true);

        // Reps 0 olduğu için teşhis: 'henüz bilmiyordun'
        expect(a.cozum.some(s => s.indexOf('henüz bilmiyordun') >= 0)).toBe(true);
        expect(a.cozum[a.cozum.length - 1]).toBe('«apple» = elma');

        // Motor takvimine yazıldı mı?
        const tk = JSON.parse(localStorage.getItem('esp.ogret.tekrar') || '{}');
        expect(tk.c1 !== undefined).toBe(true);
        expect(tk.c1.n).toBe(0);
        expect(tk.c1.y).toBe(1);

        // Son yanlışa yazıldı mı?
        const son = JSON.parse(localStorage.getItem('esp.ogret.son') || 'null');
        expect(son !== null).toBe(true);
        expect(son.kavram).toBe('c1');
        expect(son.dogruMetin).toBe('elma');

        // Kart nesneleri hiç değişmedi mi?
        expect(JSON.stringify(ESP.S.cards)).toBe(kopya);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('box >= 3 olan kartta yanlış cevap -> dikkat hatası teşhisi', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar(); // c2: box=4
        const q = K().soru('house');
        const dogruHarf = q.id.split('|')[1];
        const yanlisHarf = 'ABCD'.split('').find(h => h !== dogruHarf);

        const a = K().cevapla(q.id, yanlisHarf);
        expect(a.cozum.some(s => s.indexOf('dikkat hatası') >= 0)).toBe(true);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('takvimde olmayan kartta doğru cevap: takvim açılmaz, kart takvimine yazılmaz', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        const q = K().soru('water');
        const dogruHarf = q.id.split('|')[1];
        const a = K().cevapla(q.id, dogruHarf);

        expect(a.not).toBe('Bu cevap kartın tekrar takvimine yazılmaz.');
        const tk = JSON.parse(localStorage.getItem('esp.ogret.tekrar') || '{}');
        expect(tk.c3 === undefined).toBe(true);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('bilinmeyen kart id: { dogru, cozum:[], not:"" } döner', () => {
      const a = K().cevapla('olmayan|C', 'A');
      expect(a.dogru).toBe('C');
      expect(a.cozum).toEqual([]);
      expect(a.not).toBe('');
    });

    it('vadesi gelen kart önce gelir, not "Tekrar (N. tur)" olur', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        localStorage.setItem('esp.ogret.tekrar', JSON.stringify({
          c3: { n: 1, sonraki: '2000-01-01' }
        }));

        const q = K().soru('');
        expect(q.id.split('|')[0]).toBe('c3');
        expect(/^Tekrar \(2\. tur\)/.test(q.not)).toBe(true);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('üçüncü tekrar doğrusu bitti olarak kapanır', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        // Takvimde n:2 olan kart (3. turu bekliyor)
        localStorage.setItem('esp.ogret.tekrar', JSON.stringify({
          c1: { n: 2, sonraki: '2000-01-01', ogeler: ['c1|A'] }
        }));

        const q = K().soru('apple');
        const dogruHarf = q.id.split('|')[1];
        const a = K().cevapla(q.id, dogruHarf);

        expect(a.not.indexOf('Tekrarları tamamladın; bu konu kapandı.') >= 0).toBe(true);
        expect(a.not.indexOf('Kartın kendi tekrar takvimi değişmez.') >= 0).toBe(true);

        const tk = JSON.parse(localStorage.getItem('esp.ogret.tekrar') || '{}');
        expect(tk.c1.bitti !== undefined).toBe(true);
        expect(tk.c1.n).toBe(3);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });

    it('araçlar: esp_tekrarlarim ve esp_yanlis_teshis, kingarac listesinde yer alır', () => {
      const eski = ESP.S.cards;
      sifirla();
      try{
        ESP.S.cards = ornekKartlar();
        localStorage.setItem('esp.ogret.tekrar', JSON.stringify({
          c2: { n: 0, sonraki: '2000-01-01' }
        }));

        const araclar = K().araclar();
        expect(araclar.map(a => [a.ad, a.tur])).toEqual([
          ['esp_tekrarlarim', 'oku'],
          ['esp_yanlis_teshis', 'oku']
        ]);

        const resTekrar = araclar[0].calistir({});
        expect(resTekrar.satirlar).toEqual(['house · 1. tekrar']);

        // KingArac.liste() içinde var mı?
        const liste = ESP.KingArac.liste();
        expect(liste.some(a => a.ad === 'esp_tekrarlarim')).toBe(true);
        expect(liste.some(a => a.ad === 'esp_yanlis_teshis')).toBe(true);
      }finally{
        ESP.S.cards = eski;
        sifirla();
      }
    });
  });
})();
