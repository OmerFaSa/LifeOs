/* Konu anlatımı ve örnek sorular (data/anlatim-*.js). Kanıtladığı sözler:
     1. Her anlatım gerçek bir konuya aittir ve biçimi tutar: giriş, 2–6
        bölüm, bölümde başlık ve metin, liste ya da formülden en az biri;
        çift boşluk yok, işaretler kapalı.
     2. Her soru ÖSYM biçimindedir: beş farklı seçenek, A–E arası tek doğru,
        boş olmayan çözüm.
     3. Doğru cevaplar harflere dağılır: yazarın «hep C» alışkanlığı sınavda
        ezber yaratır (bir ders içinde hiçbir harf %40'ı geçmez).
     4. Bitmiş derslerde hiçbir konunun anlatımı ve en az üç sorusu eksik
        değildir; R.SUBJECTS'e yeni konu eklenirse anlatımı da yazılır. */

(function(){
  const { describe, it, expect } = R.Test;
  /* Anlatımı bitmiş dersler (her bitişte buraya eklenir). */
  const TAM = ['tyt-turkce', 'tyt-matematik', 'tyt-fen', 'tyt-sosyal'];

  const HARF = ['A', 'B', 'C', 'D', 'E'];
  const dizi = x => x == null ? [] : Array.isArray(x) ? x : [x];
  function metinDenetle(k, ad, m, bozuk){
    const s = String(m == null ? '' : m);
    if(!s.trim()) bozuk.push(k + ' ' + ad + ': boş');
    if(/ {2,}/.test(s)) bozuk.push(k + ' ' + ad + ': çift boşluk');
    if((s.match(/\*\*/g) || []).length % 2) bozuk.push(k + ' ' + ad + ': kalın işareti kapanmamış');
    if(/[\^_]\{[^}]*$/.test(s)) bozuk.push(k + ' ' + ad + ': üst/alt simge kapanmamış');
  }

  describe('Konu anlatımı', () => {
    it('her anlatım gerçek bir konuya ait ve biçimi tutar', () => {
      const ids = new Set();
      R.SUBJECTS.forEach(s => s.topics.forEach(t => ids.add(t.id)));
      expect(Object.keys(R.KONU_ANLATIM).filter(k => !ids.has(k))).toEqual([]);
      const bozuk = [];
      Object.keys(R.KONU_ANLATIM).forEach(k => {
        const a = R.KONU_ANLATIM[k];
        metinDenetle(k, 'giriş', a.giris, bozuk);
        if(!Array.isArray(a.bolumler) || a.bolumler.length < 2 || a.bolumler.length > 6) bozuk.push(k + ': bölüm sayısı');
        (a.bolumler || []).forEach((b, i) => {
          const ad = 'bölüm ' + (i + 1);
          metinDenetle(k, ad + ' başlık', b.baslik, bozuk);
          if(!dizi(b.metin).length && !dizi(b.liste).length && !dizi(b.formul).length) bozuk.push(k + ' ' + ad + ': içerik yok');
          dizi(b.metin).concat(dizi(b.liste), dizi(b.formul), b.dikkat ? [b.dikkat] : [])
            .forEach(m => metinDenetle(k, ad, m, bozuk));
          if(b.ornek){
            metinDenetle(k, ad + ' örnek', b.ornek.soru, bozuk);
            if(!dizi(b.ornek.cozum).length) bozuk.push(k + ' ' + ad + ': örneğin çözümü yok');
          }
        });
      });
      expect(bozuk).toEqual([]);
    });

    it('her soru beş farklı seçenekli, tek doğrulu ve çözümlü', () => {
      const bozuk = [];
      Object.keys(R.KONU_ANLATIM).forEach(k => {
        const l = R.KONU_ANLATIM[k].sorular;
        if(!Array.isArray(l) || l.length < 3 || l.length > 6) bozuk.push(k + ': soru sayısı');
        (l || []).forEach((q, i) => {
          const ad = 'soru ' + (i + 1);
          metinDenetle(k, ad, q.soru, bozuk);
          if(!Array.isArray(q.sec) || q.sec.length !== 5) bozuk.push(k + ' ' + ad + ': beş seçenek değil');
          else{
            if(new Set(q.sec.map(x => String(x).trim())).size !== 5) bozuk.push(k + ' ' + ad + ': aynı seçenek iki kez');
            q.sec.forEach(x => metinDenetle(k, ad + ' seçenek', x, bozuk));
          }
          if(HARF.indexOf(q.dogru) < 0) bozuk.push(k + ' ' + ad + ': doğru harf');
          if(!dizi(q.cozum).length) bozuk.push(k + ' ' + ad + ': çözüm yok');
          dizi(q.cozum).forEach(x => metinDenetle(k, ad + ' çözüm', x, bozuk));
        });
      });
      expect(bozuk).toEqual([]);
    });

    it('doğru cevaplar harflere dağılır', () => {
      const yigin = [];
      R.SUBJECTS.forEach(s => {
        const say = { A:0, B:0, C:0, D:0, E:0 };
        let n = 0;
        s.topics.forEach(t => ((R.KONU_ANLATIM[t.id] || {}).sorular || []).forEach(q => { say[q.dogru]++; n++; }));
        if(n < 20) return;
        HARF.forEach(h => { if(say[h] / n > 0.4) yigin.push(s.id + ': ' + h + ' ' + say[h] + '/' + n); });
      });
      expect(yigin).toEqual([]);
    });

    it('bitmiş derslerde her konunun anlatımı ve en az üç sorusu var', () => {
      const eksik = [];
      TAM.forEach(sid => R.SUBJECTS.find(s => s.id === sid).topics.forEach(t => {
        const a = R.KONU_ANLATIM[t.id];
        if(!a || !Array.isArray(a.sorular) || a.sorular.length < 3) eksik.push(t.id);
      }));
      expect(eksik).toEqual([]);
    });
  });
})();
