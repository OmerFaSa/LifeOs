/* Çıkarma katmanı — belge, fotoğraf ve fiş.

   Bu paketin en önemli testi şudur: FOTOĞRAFTAN GELEN GRAMAJ «ÖLÇÜLDÜ»
   OLAMAZ. Model ne kadar emin konuşursa konuşsun, bir fotoğraftan
   okunan porsiyon bir tahmindir ve sistem bunu tahmin olarak işaretler.

   İkincisi: model uydurma kimlik döndüremez. Çıktı bizim tablolarımıza
   eşlenir; eşleşmeyen satır sessizce atılmaz, «eşleşmedi» olarak geri
   döner ve kullanıcı görür. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;

  describe('Extract — JSON ayıklama', () => {
    it('düz JSON dizisini okur', () => {
      const out = SP.Extract.parseJson('[{"ad":"Ferritin","deger":26}]');
      expect(Array.isArray(out)).toBeTruthy();
      expect(out[0].ad).toBe('Ferritin');
    });

    it('kod bloğu içindeki JSON\'u okur', () => {
      const out = SP.Extract.parseJson('İşte sonuç:\n```json\n[{"ad":"B12","deger":288}]\n```\nbu kadar');
      expect(out[0].deger).toBe(288);
    });

    it('etrafındaki lafı atıp JSON\'u bulur', () => {
      const out = SP.Extract.parseJson('Tabii, buyurun: [{"id":"pilav","gram":180}] umarım yardımcı olur');
      expect(out[0].id).toBe('pilav');
    });

    /* Model JSON dondurmediginde HATA degil BOS sonuc: kullanici elle
       girmeye devam eder, akis kirilmaz. */
    it('JSON yoksa null döner, patlamaz', () => {
      expect(SP.Extract.parseJson('bugün hava çok güzel')).toBe(null);
      expect(SP.Extract.parseJson('')).toBe(null);
      expect(SP.Extract.parseJson(null)).toBe(null);
    });

    it('bozuk JSON\'da null döner', () => {
      expect(SP.Extract.parseJson('[{"ad":"Ferritin",}]')).toBe(null);
    });
  });

  describe('Extract — dosya türü tanıma', () => {
    const f = (name, type) => ({ name, type, size:100 });

    it('metin dosyasını tanır', () => {
      expect(SP.Extract.isText(f('rapor.txt', 'text/plain'))).toBeTruthy();
      expect(SP.Extract.isText(f('fiyat.csv', ''))).toBeTruthy();
    });
    it('görüntüyü tanır', () => {
      expect(SP.Extract.isImage(f('tahlil.jpg', 'image/jpeg'))).toBeTruthy();
      expect(SP.Extract.isImage(f('rapor.txt', 'text/plain'))).toBeFalsy();
    });
    it('PDF\'i uzantıdan da tanır', () => {
      expect(SP.Extract.isPdf(f('rapor.pdf', ''))).toBeTruthy();
    });
  });

  describe('Extract — model yokken dürüst davranır', () => {
    it('görüntü için model gerektiğini söyler, sessizce başarısız olmaz', async () => {
      resetState();
      const res = await SP.Extract.fromLabFile({ name:'t.jpg', type:'image/jpeg', size:100 });
      expect(res.rows.length).toBe(0);
      expect(res.note).toContain('model');
    });

    it('öğün fotoğrafında da elle giriş yolunu hatırlatır', async () => {
      resetState();
      const res = await SP.Extract.fromMealPhoto({ name:'y.jpg', type:'image/jpeg', size:100 }, {});
      expect(res.ok).toBeFalsy();
      expect(res.note).toContain('yazarak');
    });

    it('çok büyük dosyayı modele hiç göndermez', async () => {
      resetState();
      const big = { name:'b.jpg', type:'image/jpeg', size:SP.Extract.MAX_BYTES + 1 };
      const res = await SP.Extract.fromLabFile(big);
      expect(res.note).toContain('büyük');
    });

    it('desteklenmeyen türü açıkça söyler', async () => {
      resetState();
      const res = await SP.Extract.fromLabFile({ name:'a.docx', type:'application/msword', size:10 });
      expect(res.note).toContain('okunamıyor');
    });
  });

  describe('Voice — dikte katmanı', () => {
    /* Desteklenmeyen tarayicida katman SESSIZCE yok olur; hata firlatmaz
       ve arayuz calisir kalir. */
    it('destek yoksa çökmeden false döner', () => {
      expect(typeof SP.Voice.supported()).toBe('boolean');
    });

    it('her hata kodu için Türkçe bir karşılık verir', () => {
      ['unsupported', 'not-allowed', 'audio-capture', 'network', 'bilinmeyen']
        .forEach(code => {
          const m = SP.Voice.message(code);
          expect(typeof m).toBe('string');
          expect(m.length > 5).toBeTruthy();
        });
    });

    it('alan yoksa dikte başlatmaz', () => {
      expect(SP.Voice.dictateInto(null)).toBe(null);
    });
  });
})();
