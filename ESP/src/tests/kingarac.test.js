/* King araçları — ESP (core/kingarac.js, brand/ortak/arac.js).

   Kanıtlanan: oturumu olmayan gün «veri yok»tur; dil kartı önizlenir,
   onayla eklenir ve geri alınır; kitap adı tek kitaba denk gelmezse
   önizleme kurulmaz (tahmin yok); 19 yeni araç sınanır. */

(function(){
  const { describe, it, expect } = ESP.Test;
  const A = () => window.LIFEOS.ARAC;

  function kur(){
    A()._sifirla();
    A().kur({ modul:'esp', araclar:() => ESP.KingArac.liste() });
  }

  describe('King araçları — ESP', () => {
    it('her araç katalogdan geçer', () => {
      kur();
      expect(A().liste().length).toBe(ESP.KingArac.liste().length);
      expect(A().liste().map(a => a.ad)).toContain('esp_kart_ekle');
      A()._sifirla();
    });

    it('dil kartı: önizleme, onayla ekleme ve geri alma', async () => {
      kur();
      const n0 = (ESP.S.cards || []).length;
      const o = await A().onizle('esp_kart_ekle', { on:'serendipity', arka:'mutlu tesadüf', dil:'en' });
      expect(o.ok).toBe(true);
      expect((ESP.S.cards || []).length).toBe(n0);
      const u = await A().uygula({ arac:true, ad:'esp_kart_ekle', param:{ on:'serendipity', arka:'mutlu tesadüf', dil:'en' } });
      expect(u.ok).toBe(true);
      expect(ESP.S.cards.length).toBe(n0 + 1);
      await u.geriAl();
      expect(ESP.S.cards.length).toBe(n0);
      A()._sifirla();
    });

    it('kitap adı tek kitaba denk gelmezse önizleme yok; oturumsuz gün veri yok', async () => {
      kur();
      const eski = ESP.S.books;
      ESP.S.books = [{ id:'b1', title:'Suç ve Ceza', author:'Dostoyevski', startedAt:'2026-10-01', finishedAt:null },
        { id:'b2', title:'Suçlu', author:'', startedAt:'2026-10-01', finishedAt:null }];
      try{
        expect((await A().onizle('esp_kitap_bitir', { kitap:'suç' })).ok).toBe(false);
        expect((await A().onizle('esp_kitap_bitir', { kitap:'suç ve' })).ok).toBe(true);
        const g = await A().calistir('esp_gun', { tarih:'2001-01-01' });
        expect(g.sonuc.toplam_dakika).toBeNull();
      }finally{ ESP.S.books = eski; A()._sifirla(); }
    });

    /* King 3.0 K5: kitap sayfası fotoğrafı ya da kamera karesi görsel modelle
       okunur; alıntı yalnız onayla, okunan kitaba bağlı not olarak yazılır. */
    it('sayfa okuma ve alıntı: model yoksa söylenir; okunan kitaba bağlanır, onayla yazılır, geri alınır', async () => {
      kur();
      const eski = ESP.S.books;
      ESP.S.books = [{ id:'b1', title:'Suç ve Ceza', author:'Dostoyevski', startedAt:'2026-10-01', finishedAt:null },
        { id:'b2', title:'Budala', author:'', startedAt:null, finishedAt:null }];
      try{
        expect(typeof await ESP.KingArac.sayfaOku(null, {})).toBe('string');
        const r = await ESP.KingArac.sayfaOku(null, { gorsel:async (soru, y) => ({ ok:true, text:'Acı çekmek de bir yetenektir.  \nİkinci satır.' }) });
        expect(r.arac).toEqual({ ad:'esp_alinti_ekle', param:{ metin:'Acı çekmek de bir yetenektir.\nİkinci satır.', kitap:'Suç ve Ceza' } });
        const o = await A().onizle(r.arac.ad, r.arac.param, { metin:'' });
        expect(o.onizle.metin).toBe('«Suç ve Ceza» için alıntı kaydedilecek.');
        const n0 = ESP.S.notes.length;
        const u = await A().uygula({ arac:true, ad:r.arac.ad, param:r.arac.param });
        expect([ESP.S.notes.length, ESP.S.notes[0].bookId]).toEqual([n0 + 1, 'b1']);
        await u.geriAl();
        expect(ESP.S.notes.length).toBe(n0);
        expect((await A().onizle('esp_alinti_ekle', { metin:'x y', kitap:'olmayan kitap' })).ok).toBe(false);
      }finally{ ESP.S.books = eski; A()._sifirla(); }
    });

    it('tek kayıtlı listede adsız silme reddedilir (ad veya id şart)', async () => {
      kur();
      const eskiBooks = ESP.S.books;
      ESP.S.books = [{ id:'b1', title:'Tek Başına', author:'Yazar', startedAt:'2026-10-01' }];
      try {
        const o = await A().onizle('esp_kitap', { islem:'sil' });
        expect(o.ok).toBe(false);
      } finally {
        ESP.S.books = eskiBooks;
        A()._sifirla();
      }
    });

    /* Yeni okuma araçları: merdiven, argumanlar, olaylar, repertuvar */
    it('okuma araçları: boşken veri yok, doluyken doğru sayı', async () => {
      kur();
      const eskiArgs = ESP.S.args, eskiEvents = ESP.S.events, eskiPieces = ESP.S.pieces;
      try{
        /* 'esp_merdiven' */
        const mBos = await A().calistir('esp_merdiven', {});
        expect(mBos.ok).toBe(true);
        expect(mBos.satirlar[0]).toContain('veri yok');

        /* 'esp_argumanlar' */
        ESP.S.args = [];
        const aBos = await A().calistir('esp_argumanlar', {});
        expect(aBos.ok).toBe(true);
        expect(aBos.sonuc.toplam).toBe(0);
        expect(aBos.satirlar[0]).toContain('veri yok');
        ESP.S.args = [{ id:'a1', thesis:'Düşünüyorum o halde varım', status:'open', objections:[] }];
        const aDolu = await A().calistir('esp_argumanlar', { durum:'acik' });
        expect(aDolu.sonuc.filtreli).toBe(1);
        expect(aDolu.satirlar[0]).toContain('Düşünüyorum');

        /* 'esp_olaylar' */
        ESP.S.events = [];
        const oBos = await A().calistir('esp_olaylar', {});
        expect(oBos.ok).toBe(true);
        expect(oBos.sonuc.toplam).toBe(0);
        expect(oBos.satirlar[0]).toContain('veri yok');
        ESP.S.events = [{ id:'ev1', title:'İstanbul’un Fethi', year:1453, era:'ortacag', region:'dunya' }];
        const oDolu = await A().calistir('esp_olaylar', {});
        expect(oDolu.sonuc.toplam).toBe(1);
        expect(oDolu.satirlar[0]).toContain('1453');

        /* 'esp_repertuvar' */
        ESP.S.pieces = [];
        const rBos = await A().calistir('esp_repertuvar', {});
        expect(rBos.ok).toBe(true);
        expect(rBos.sonuc.toplam).toBe(0);
        expect(rBos.satirlar[0]).toContain('veri yok');
        ESP.S.pieces = [{ id:'pc1', name:'Asturias', kind:'piece', cleanBpm:120, targetBpm:140 }];
        const rDolu = await A().calistir('esp_repertuvar', { tur:'piece' });
        expect(rDolu.sonuc.filtreli).toBe(1);
        expect(rDolu.satirlar[0]).toContain('Asturias');
      }finally{
        ESP.S.args = eskiArgs;
        ESP.S.events = eskiEvents;
        ESP.S.pieces = eskiPieces;
        A()._sifirla();
      }
    });

    /* Yeni yazma araçları: oturum, arguman, dosya, eser, hatirlatma, hedef, karar_kapat, kart_sil, kaynak, kitap, not_sil, olay, ses_kaydi, taslak, zincir */
    it('yazma araçları: önizleme, uygulama ve tam geri alma', async () => {
      kur();
      const d = ESP.U.todayISO();

      /* 1. 'esp_oturum' */
      const s0 = await ESP.Model.addSession(d, { disc:'lang', minutes:40, note:'test' });
      const oOturum = await A().onizle('esp_oturum', { islem:'guncelle', id:s0.id, dakika:50 });
      expect(oOturum.ok).toBe(true);
      const uOturum = await A().uygula({ arac:true, ad:'esp_oturum', param:{ islem:'guncelle', id:s0.id, dakika:50 } });
      expect(uOturum.ok).toBe(true);
      expect(ESP.Model.sessionsOf(d).find(x => x.id === s0.id).minutes).toBe(50);
      await uOturum.geriAl();
      expect(ESP.Model.sessionsOf(d).find(x => x.id === s0.id).minutes).toBe(40);
      const uOturumSil = await A().uygula({ arac:true, ad:'esp_oturum', param:{ islem:'sil', id:s0.id } });
      expect(ESP.Model.sessionsOf(d).find(x => x.id === s0.id)).toBeUndefined();
      await uOturumSil.geriAl();
      expect(ESP.Model.sessionsOf(d).find(x => x.id === s0.id).minutes).toBe(40);
      await ESP.Model.deleteSession(d, s0.id);

      /* 2. 'esp_arguman' */
      const oArg = await A().onizle('esp_arguman', { islem:'ekle', tez:'Zaman tek yönlüdür' });
      expect(oArg.ok).toBe(true);
      const nArg = (ESP.S.args || []).length;
      const uArg = await A().uygula({ arac:true, ad:'esp_arguman', param:{ islem:'ekle', tez:'Zaman tek yönlüdür' } });
      expect(uArg.ok).toBe(true);
      expect(ESP.S.args.length).toBe(nArg + 1);
      await uArg.geriAl();
      expect(ESP.S.args.length).toBe(nArg);

      /* 3. 'esp_dosya' */
      const oDosyaHata = await A().onizle('esp_dosya', { islem:'ekle', baslik:'Gramer Notu' });
      expect(oDosyaHata.ok).toBe(false);
      const oDosya = await A().onizle('esp_dosya', { islem:'ekle', baslik:'Gramer Notu', metin:'İçerik', alan:'lang' });
      expect(oDosya.ok).toBe(true);
      const nDosya = (ESP.S.assets || []).length;
      const uDosya = await A().uygula({ arac:true, ad:'esp_dosya', param:{ islem:'ekle', baslik:'Gramer Notu', metin:'İçerik', alan:'lang' } });
      expect(uDosya.ok).toBe(true);
      expect(ESP.S.assets.length).toBe(nDosya + 1);
      await uDosya.geriAl();
      expect(ESP.S.assets.length).toBe(nDosya);

      /* 4. 'esp_eser' */
      const oEser = await A().onizle('esp_eser', { islem:'ekle', ad:'Gam Egzersizi', tur:'technique', hedef_bpm:120 });
      expect(oEser.ok).toBe(true);
      const nEser = (ESP.S.pieces || []).length;
      const uEser = await A().uygula({ arac:true, ad:'esp_eser', param:{ islem:'ekle', ad:'Gam Egzersizi', tur:'technique', hedef_bpm:120 } });
      expect(uEser.ok).toBe(true);
      expect(ESP.S.pieces.length).toBe(nEser + 1);
      await uEser.geriAl();
      expect(ESP.S.pieces.length).toBe(nEser);

      /* 5. 'esp_hatirlatma' */
      const oHatirHata = await A().onizle('esp_hatirlatma', { islem:'ekle', metin:'Kelime tekrarı yap' });
      expect(oHatirHata.ok).toBe(false);
      const oHatir = await A().onizle('esp_hatirlatma', { islem:'ekle', metin:'Kelime tekrarı yap', alan:'lang' });
      expect(oHatir.ok).toBe(true);
      const nHatir = (ESP.S.reminders || []).length;
      const uHatir = await A().uygula({ arac:true, ad:'esp_hatirlatma', param:{ islem:'ekle', metin:'Kelime tekrarı yap', alan:'lang' } });
      expect(uHatir.ok).toBe(true);
      expect(ESP.S.reminders.length).toBe(nHatir + 1);
      await uHatir.geriAl();
      expect(ESP.S.reminders.length).toBe(nHatir);

      /* 6. 'esp_hedef' */
      const oHedefHata = await A().onizle('esp_hedef', { islem:'ekle', hedef:'İspanyolca B2' });
      expect(oHedefHata.ok).toBe(false);
      const oHedef = await A().onizle('esp_hedef', { islem:'ekle', hedef:'İspanyolca B2', alan:'lang' });
      expect(oHedef.ok).toBe(true);
      const nHedef = (ESP.S.goals || []).length;
      const uHedef = await A().uygula({ arac:true, ad:'esp_hedef', param:{ islem:'ekle', hedef:'İspanyolca B2', alan:'lang' } });
      expect(uHedef.ok).toBe(true);
      expect(ESP.S.goals.length).toBe(nHedef + 1);
      await uHedef.geriAl();
      expect(ESP.S.goals.length).toBe(nHedef);

      /* 7. 'esp_karar_kapat' */
      const dec = await ESP.Model.saveDecision({ text:'Toplantı kararı deneme', closedAt:null });
      const oKarar = await A().onizle('esp_karar_kapat', { id:dec.id, sonuc:'Sonuçlandı' });
      expect(oKarar.ok).toBe(true);
      const uKarar = await A().uygula({ arac:true, ad:'esp_karar_kapat', param:{ id:dec.id, sonuc:'Sonuçlandı' } });
      expect(uKarar.ok).toBe(true);
      expect(ESP.S.decisions.find(x => x.id === dec.id).closedAt != null).toBe(true);
      await uKarar.geriAl();
      expect(ESP.S.decisions.find(x => x.id === dec.id).closedAt).toBe(null);
      await ESP.Store.remove('decisions/' + dec.id);
      ESP.S.decisions = ESP.S.decisions.filter(x => x.id !== dec.id);

      /* 8. 'esp_kart_sil' */
      const cSil = await ESP.Model.saveCard(ESP.Model.newCard({ front:'epiphany', back:'aydınlanma' }));
      const nCards = ESP.S.cards.length;
      const oKartSil = await A().onizle('esp_kart_sil', { id:cSil.id });
      expect(oKartSil.ok).toBe(true);
      const uKartSil = await A().uygula({ arac:true, ad:'esp_kart_sil', param:{ id:cSil.id } });
      expect(uKartSil.ok).toBe(true);
      expect(ESP.S.cards.length).toBe(nCards - 1);
      await uKartSil.geriAl();
      expect(ESP.S.cards.length).toBe(nCards);
      await ESP.Model.deleteCard(cSil.id);

      /* 9. 'esp_kaynak' */
      const oKaynak = await A().onizle('esp_kaynak', { islem:'ekle', baslik:'Tarih Üzerine', yazar:'E.H. Carr', yil:1961 });
      expect(oKaynak.ok).toBe(true);
      const nKaynak = (ESP.S.sources || []).length;
      const uKaynak = await A().uygula({ arac:true, ad:'esp_kaynak', param:{ islem:'ekle', baslik:'Tarih Üzerine', yazar:'E.H. Carr', yil:1961 } });
      expect(uKaynak.ok).toBe(true);
      expect(ESP.S.sources.length).toBe(nKaynak + 1);
      await uKaynak.geriAl();
      expect(ESP.S.sources.length).toBe(nKaynak);

      /* 10. 'esp_kitap' */
      const oKitapEkle = await A().onizle('esp_kitap', { islem:'ekle', ad:'Denemeler', yazar:'Montaigne' });
      expect(oKitapEkle.ok).toBe(false);
      const b0 = await ESP.Model.saveBook(ESP.Model.newBook({ title:'Denemeler', author:'Montaigne' }));
      const oKitap = await A().onizle('esp_kitap', { islem:'guncelle', id:b0.id, yazar:'Michel de Montaigne' });
      expect(oKitap.ok).toBe(true);
      const uKitap = await A().uygula({ arac:true, ad:'esp_kitap', param:{ islem:'guncelle', id:b0.id, yazar:'Michel de Montaigne' } });
      expect(uKitap.ok).toBe(true);
      expect(ESP.S.books.find(x => x.id === b0.id).author).toBe('Michel de Montaigne');
      await uKitap.geriAl();
      expect(ESP.S.books.find(x => x.id === b0.id).author).toBe('Montaigne');
      const uKitapSil = await A().uygula({ arac:true, ad:'esp_kitap', param:{ islem:'sil', id:b0.id } });
      expect(uKitapSil.ok).toBe(true);
      expect(ESP.S.books.find(x => x.id === b0.id)).toBeUndefined();
      await uKitapSil.geriAl();
      expect(ESP.S.books.find(x => x.id === b0.id).title).toBe('Denemeler');
      await ESP.Model.deleteBook(b0.id);

      /* 11. 'esp_not_sil' */
      const nSil = await ESP.Model.saveNote(ESP.Model.newNote({ text:'Silinecek felsefi not' }));
      const nNotes = ESP.S.notes.length;
      const oNotSil = await A().onizle('esp_not_sil', { id:nSil.id });
      expect(oNotSil.ok).toBe(true);
      const uNotSil = await A().uygula({ arac:true, ad:'esp_not_sil', param:{ id:nSil.id } });
      expect(uNotSil.ok).toBe(true);
      expect(ESP.S.notes.length).toBe(nNotes - 1);
      await uNotSil.geriAl();
      expect(ESP.S.notes.length).toBe(nNotes);
      await ESP.Model.deleteNote(nSil.id);

      /* 12. 'esp_olay' */
      const oOlay = await A().onizle('esp_olay', { islem:'ekle', baslik:'Yazının İcadı', yil:-3200, tur:'kultur' });
      expect(oOlay.ok).toBe(true);
      const nOlay = (ESP.S.events || []).length;
      const uOlay = await A().uygula({ arac:true, ad:'esp_olay', param:{ islem:'ekle', baslik:'Yazının İcadı', yil:-3200, tur:'kultur' } });
      expect(uOlay.ok).toBe(true);
      expect(ESP.S.events.length).toBe(nOlay + 1);
      await uOlay.geriAl();
      expect(ESP.S.events.length).toBe(nOlay);

      /* 13. 'esp_ses_kaydi' */
      const oSes = await A().onizle('esp_ses_kaydi', { islem:'ekle', saniye:90, kelime:180, hata:1 });
      expect(oSes.ok).toBe(true);
      const nSes = (ESP.S.recordings || []).length;
      const uSes = await A().uygula({ arac:true, ad:'esp_ses_kaydi', param:{ islem:'ekle', saniye:90, kelime:180, hata:1 } });
      expect(uSes.ok).toBe(true);
      expect(ESP.S.recordings.length).toBe(nSes + 1);
      await uSes.geriAl();
      expect(ESP.S.recordings.length).toBe(nSes);

      /* 14. 'esp_taslak' */
      const oTaslak = await A().onizle('esp_taslak', { islem:'ekle', baslik:'Modernizm Üzerine', metin:'Giriş metni...' });
      expect(oTaslak.ok).toBe(true);
      const nTaslak = (ESP.S.drafts || []).length;
      const uTaslak = await A().uygula({ arac:true, ad:'esp_taslak', param:{ islem:'ekle', baslik:'Modernizm Üzerine', metin:'Giriş metni...' } });
      expect(uTaslak.ok).toBe(true);
      expect(ESP.S.drafts.length).toBe(nTaslak + 1);
      await uTaslak.geriAl();
      expect(ESP.S.drafts.length).toBe(nTaslak);

      /* 15. 'esp_zincir' */
      const evZ = await ESP.Model.saveEvent(ESP.Model.newEvent({ title:'Sanayi Devrimi', year:1760 }));
      const oZincir = await A().onizle('esp_zincir', { islem:'ekle', olay_id:evZ.event.id, soru:'Neden?', halka:'Buhar makinesi' });
      expect(oZincir.ok).toBe(true);
      const nZincir = (ESP.S.chains || []).length;
      const uZincir = await A().uygula({ arac:true, ad:'esp_zincir', param:{ islem:'ekle', olay_id:evZ.event.id, soru:'Neden?', halka:'Buhar makinesi' } });
      expect(uZincir.ok).toBe(true);
      expect(ESP.S.chains.length).toBe(nZincir + 1);
      await uZincir.geriAl();
      expect(ESP.S.chains.length).toBe(nZincir);
      await ESP.Model.deleteEvent(evZ.event.id);

      A()._sifirla();
    });
  });
})();
