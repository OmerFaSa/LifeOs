/* ESP hedefleri ve hedef planı — dil (CEFR), okuma, enstrüman.

   Genel motor `brand/ortak/hedef.js`'tedir; burada ESP'nin kendi alan
   bilgisi sınanır. Kanıtlanan sözler:
     1. Paketin anahtarı dardır: bölüm isteği («gitarı tekrar aç») hedef
        sayılmaz; CEFR seviyesi ya da basamak adı geçmeyen cümle hedef değildir.
     2. Dil ve okumada karar VAKİTLE verilir; «bu sürede olmaz» denirse bu
        vakitle olacağı tarih söylenir. Saat tablosu kaynaksızsa «tahmin»,
        kendi ölçümünden geliyorsa «hesaplandı».
     3. Enstrümanda hız senin kayıtlarından gelir; kayıt yoksa karar
        verilmez ve bu söylenir. Tempo tek başına basamağı açmaz.
     4. Plan büyük aksiyondur: önizleme yazmaz; uygulama odak, taban, bölüm
        ve tarihli hedefi birlikte değiştirir; geri alma hepsini geri alır
        ve kullanıcının sonraki seçimini ezmez. */

(function(){
  const { describe, it, expect, resetState, pushSession, pushBook, pushPiece, withToday, withTodayAsync } = ESP.Test;
  const HD = () => ESP.Hedefler;
  const HP = () => ESP.HedefPlan;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  function tani(cumle){ return H().cumleden(cumle, HD().PAKETLER, BUGUN); }
  function hedef(cumle, ek){
    const h = Object.assign(H().yeni(tani(cumle), 'esp', BUGUN), { durum:'aktif' }, ek || {});
    ESP.S.hedefler = [h];
    return h;
  }
  function paket(h){ return HD().PAKET_BY_ID[h.paket]; }
  function kur(){ resetState(); HD().sohbet.sifirla(); }

  describe('ESP hedef — tanıma', () => {
    it('dil hedefi: seviye, dil, tarih ve vakit tek cümleden', () => {
      kur();
      const t = tani('Bir ayda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat ayırabilirim');
      expect([t.paket, t.hedefSeviye, t.dil, t.son_tarih, t.kapasite.gunluk_dk])
        .toEqual(['dil', 'A2', 'İngilizce', '2026-10-23', 30]);
    });

    it('enstrüman hedefi: basamağın temiz tempo kapısı merdivenden okunur', () => {
      kur();
      const t = tani('Bir yılda gitarda Kalfa\'ya gelmek istiyorum; günde yarım saat ayırabilirim');
      expect([t.paket, t.hedefDeger, t.hedefKademe, t.son_tarih, t.kapasite.gunluk_dk])
        .toEqual(['enstruman', 110, 3, '2027-09-23', 30]);
      expect(tani('Gitarda 120 bpm\'e çıkmak istiyorum').hedefDeger).toBe(120);
    });

    it('okuma hedefi: sayı ve dönem', () => {
      kur();
      const a = tani('Bu yıl 24 kitap okumak istiyorum');
      expect([a.paket, a.fark, a.son_tarih]).toEqual(['okuma', 24, '2026-12-31']);
      expect(tani('3 ayda 6 kitap okumak istiyorum').son_tarih).toBe('2026-12-23');
      expect(tani('yılda 20 kitap okumak istiyorum').son_tarih).toBe('2027-09-23');
    });

    it('bölüm isteği ya da hedefsiz cümle hedef sayılmaz', () => {
      kur();
      expect(tani('Gitarı tekrar açmak istiyorum')).toBe(null);
      expect(tani('İngilizceyi tekrar açmak istiyorum')).toBe(null);
      expect(tani('Diksiyon çalışmak istemiyorum')).toBe(null);
    });
  });

  describe('ESP hedef — alışkanlık', () => {
    it('açık alışkanlık sözü okuma hedefi değil alışkanlıktır; «her gün» tek başına değil', () => {
      kur();
      const t = tani('Her gün 20 dakika kitap okuma alışkanlığı kazanmak istiyorum');
      expect([t.paket, t.alan, t.kapasite.haftalik_gun, t.kapasite.gunluk_dk])
        .toEqual(['aliskanlik', 'reading', 7, 20]);
      expect(tani('Her gün 30 dakika çalışarak iki ayda İngilizcede B1\'e çıkmak istiyorum').paket).toBe('dil');
      expect(tani('Haftada 4 gün 15 dakika düzenli gitar çalmak istiyorum').alan).toBe('music');
    });

    it('taban ve ilerleme ESP’nin kendi oturum kaydından sayılır', () => {
      kur();
      ['2026-09-20', '2026-09-18', '2026-09-13', '2026-09-11', '2026-09-06', '2026-09-04',
        '2026-08-30', '2026-08-28'].forEach(d => pushSession(d, 'reading', 25));
      pushSession('2026-09-22', 'reading', 30);
      pushSession('2026-09-22', 'music', 60);             // başka disiplin sayılmaz
      const h = hedef('Haftada 3 gün 20 dakika okuma alışkanlığı kazanmak istiyorum',
        { son_tarih:'2026-11-18' });
      const g = H().gerceklik(h, paket(h), {}, BUGUN);
      /* Dünden geriye 28 gün: 20+ dakikalık 9 kayıtlı gün → haftada 2,3. */
      expect([g.bant, g.tipik, g.etiket]).toEqual(['gercekci', 2.3, 'tahmin']);
      const il = HD().ALISKANLIK.ilerleme(h, BUGUN);
      expect([il.bu, il.durum]).toEqual([1, 'yolunda']);
      expect(HD().ozet(h)).toBe('Alışkanlık: Okuma · haftada 3 gün × 20 dk');
      /* Özet bugünü kendi okur: tarih sabitlenmezse test takvime bağlanır
         (2026-09-26'da «geride» döndü). */
      const o = withToday(BUGUN, () => HD().ozetler()).find(x => x.id === h.id);
      expect(o.plan.ilerleme.durum).toBe('yolunda');
    });
  });

  describe('ESP hedef — gerçekçilik', () => {
    it('dil: vakit yetmezse «bu sürede olmaz» ve olacağı tarih; karar tahmin', () => {
      kur();
      const h = hedef('Bir ayda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat ayırabilirim',
        { simdi:{ deger:'A1', etiket:'tahmin' } });
      const g = H().gerceklik(h, paket(h), {}, BUGUN);
      expect([g.bant, g.saat, g.etiket]).toEqual(['gercekci_degil', 100, 'tahmin']);
      const t = H().kararMetni(g);
      expect(t).toContain('Bu sürede olmaz');
      expect(t).toContain('rehberli öğrenme saati');
    });

    it('dil: şu anki seviye paketin sorusuyla sorulur; hedefin üstü reddedilir', () => {
      kur();
      const h = hedef('Bir ayda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat ayırabilirim');
      expect(H().eksikler(h, paket(h), {})[0].soru).toContain('İngilizce için şu anki seviyen');
      expect(H().cevapla(h, 'simdi', 'B1', BUGUN, paket(h)).why).toContain('üstünde');
      expect(H().cevapla(h, 'simdi', 'hiç başlamadım', BUGUN, paket(h)).hedef.simdi.deger).toBe('0');
    });

    it('okuma: kitap başına saat ölçüm yoksa tahmin, iki kitap bitince kendi ölçümün', () => {
      kur();
      const h = hedef('Bu yıl 24 kitap okumak istiyorum', { kapasite:{ gunluk_dk:60 } });
      const a = paket(h).gerekenSaat(h);
      expect([a.saat, a.dayanak.durum]).toEqual([144, 'kaynak_bekliyor']);
      const b1 = pushBook('A', 'X'); b1.startedAt = '2026-08-01'; b1.finishedAt = '2026-08-20';
      const b2 = pushBook('B', 'Y'); b2.startedAt = '2026-08-21'; b2.finishedAt = '2026-09-10';
      pushSession('2026-08-05', 'reading', 300);
      pushSession('2026-08-25', 'reading', 300);
      const k = HD().kitapSaati(BUGUN);
      expect([k.saat, k.etiket]).toEqual([5, 'hesaplandi']);
      const g = H().gerceklik(h, paket(h), {}, BUGUN);
      expect([g.etiket, g.saat]).toEqual(['hesaplandi', 120]);
    });

    it('enstrüman: kayıt yoksa karar verilmez ve nasıl ölçüleceği söylenir', () => {
      kur();
      const h = hedef('Bir yılda gitarda Kalfa\'ya gelmek istiyorum; günde yarım saat ayırabilirim');
      expect(H().eksikler(h, paket(h), {})[0].soru).toContain('BPM');
      h.simdi = { deger:80, etiket:'tahmin' };
      const g = H().gerceklik(h, paket(h), {}, BUGUN);
      expect(g.bant).toBe(null);
      expect(g.neden).toContain('iki hafta');
    });

    it('enstrüman: hız kendi temiz tempo kayıtlarından; öteki kapılar söylenir', () => {
      kur();
      pushPiece('Gam', { attempts:[
        { date:'2026-08-26', bpm:70, clean:true }, { date:'2026-09-09', bpm:78, clean:true },
        { date:'2026-09-23', bpm:86, clean:true }, { date:'2026-09-20', bpm:95, clean:false }] });
      const h = hedef('Bir yılda gitarda Kalfa\'ya gelmek istiyorum; günde yarım saat ayırabilirim');
      expect(paket(h).simdi({}, h).deger).toBe(86);
      const hz = paket(h).hiz(h);
      expect([hz.tipik, hz.birim, hz.dayanak.durum]).toEqual([4, 'BPM/hafta', 'kendi_beyanin']);
      const g = H().gerceklik(h, paket(h), {}, BUGUN);
      expect([g.bant, g.etiket]).toEqual(['gercekci', 'tahmin']);
      expect(HD().notlar(h, g)[0]).toContain('8 parça');
    });

    it('Danışma sohbeti hedefi sorarak kurar; bölüm isteği hedef akışına girmez', async () => {
      kur();
      await withTodayAsync(BUGUN, async () => {
        const a = await ESP.Komut.sohbet('patron', 'Bir ayda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat ayırabilirim');
        expect(a.text).toContain('şu anki seviyen');
        const b = await ESP.Komut.sohbet('patron', 'A1');
        expect(b.text).toContain('Bu sürede olmaz');
        await ESP.Komut.sohbet('patron', '2');
        const h = HD().liste()[0];
        expect([h.durum, h.kapasite.gunluk_dk]).toEqual(['aktif', 60]);
        HD().sohbet.sifirla();
        const c = await ESP.Komut.sohbet('patron', 'Gitarı tekrar açmak istiyorum');
        expect(HD().liste().length).toBe(1);
        expect(c == null || c.text.indexOf('seviyen') < 0).toBe(true);
      });
    });
  });

  describe('ESP — BAM materyali (material.add)', () => {
    async function withFetch(govde, fn){
      const eski = window.fetch;
      const cagri = [];
      window.fetch = function(url){ cagri.push(url); return Promise.resolve({ status:200, json:async () => govde }); };
      try{ await fn(cagri); } finally { window.fetch = eski; }
    }
    function kayit(baslik, konu, maddeler){
      return { kayit:{ id:5, tur:'materyal', baslik, govde:{ tur:'kart', konu, maddeler } } };
    }

    it('deste setin başlığından kuralla okunur; belirsizse tahmin edilmez', () => {
      const d = k => { const r = ESP.Beacon.desteOf(k); return r ? r.deck : null; };
      expect(d({ baslik:'İngilizce fiiller', govde:{} })).toBe('en');
      expect(d({ baslik:'Kartlar', govde:{ konu:'Almanca artikeller' } })).toBe('de');
      expect(d({ baslik:'Osmanlı kronolojisi', govde:{} })).toBe(ESP.HISTORY_DECK);
      expect(d({ baslik:'Rus Devrimi', govde:{} })).toBe(ESP.HISTORY_DECK);
      expect(d({ baslik:'Stoacılık kavramları', govde:{} })).toBe(null);
    });

    it('maddeler ESP’nin kendi denetiminden geçer, desteye bir kez eklenir', async () => {
      kur();
      await ESP.Beacon.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
      const n = { id:3, kind:'material.add', payload:{ kayit_id:5, adet:2 } };
      expect(ESP.Beacon.canApply(n)).toBe(true);
      await withFetch(kayit('İngilizce fiiller', 'İngilizce', [{ on:'to go', arka:'gitmek' },
        { on:'', arka:'boş ön yüz' }]), async cagri => {
        const r = await ESP.Beacon.applyIntent(n);
        expect(r.ok).toBe(true);
        expect(r.note).toContain('1 kart İngilizce destesine');
        expect(cagri[0]).toBe('http://127.0.0.1:4200/api/bam/kayit/5');
        const iki = await ESP.Beacon.applyIntent(n);
        expect(iki.error).toContain('zaten eklenmiş');
      });
      const c = ESP.S.cards.filter(x => (x.tags || []).indexOf('bam:5') >= 0);
      expect(c.map(x => [x.front, x.lang])).toEqual([['to go', 'en']]);
    });

    it('konusu dil ya da tarih olmayan set eklenmez ve nedeni söylenir', async () => {
      kur();
      await ESP.Beacon.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
      await withFetch(kayit('Stoacılık kavramları', 'Felsefe', [{ on:'ataraksia', arka:'dinginlik' }]),
        async () => {
          const r = await ESP.Beacon.applyIntent({ id:4, kind:'material.add', payload:{ kayit_id:5, adet:1 } });
          expect(r.ok).toBe(false);
          expect(r.error).toContain('hangi desteye');
        });
      expect(ESP.S.cards.length).toBe(0);
    });
  });

  describe('ESP hedef planı', () => {
    function dilHedefi(ek){
      return hedef('Bir yılda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat ayırabilirim',
        Object.assign({ simdi:{ deger:'A1', etiket:'tahmin' } }, ek || {}));
    }

    it('önizleme hiçbir şey yazmaz; odak, taban ve kontrol noktaları görünür', () => {
      kur();
      const h = dilHedefi();
      const once = JSON.stringify(ESP.S.profile);
      const r = HP().kur(h, BUGUN);
      expect(r.ok).toBe(true);
      const p = r.plan;
      expect([p.disc, p.odak.sonra, p.taban.once, p.taban.sonra, p.hedef, p.birim])
        .toEqual(['lang', 'lang', 60, 60, 100, 'saat']);
      expect(p.kontrol[0]).toEqual({ tarih:'2026-10-21', hafta:4, beklenen:7.7 });
      expect(p.kontrol[p.kontrol.length - 1].beklenen).toBe(100);
      const rows = HP().onizleme(p);
      expect(rows.find(x => x.alan === 'Odak').sonra).toBe('Dil ağırlıklı');
      expect(rows.find(x => x.alan === 'Günlük taban').sonra).toContain('değişmez');
      expect(JSON.stringify(ESP.S.profile)).toBe(once);
      expect(ESP.S.goals.length).toBe(0);
    });

    it('uygulama odak, bölüm ve tarihli hedefi yazar; geri alma hepsini geri alır', async () => {
      kur();
      await withTodayAsync(BUGUN, async () => {
        await ESP.Mod.set('lang', false);
        const h = dilHedefi({ kapasite:{ gunluk_dk:90 } });
        const r = await HP().uygulaHedef(h.id);
        expect(r.ok).toBe(true);
        expect([ESP.S.profile.focus, ESP.S.profile.dailyMinutes, ESP.Mod.isOn('lang')])
          .toEqual(['lang', 90, true]);
        expect(ESP.S.goals.map(g => g.date)).toEqual(['2027-09-23']);
        const u = HP().uygulamaOf(h.id);
        expect([u.level, u.state]).toEqual(['buyuk', 'accepted']);
        expect((await HP().uygulaHedef(h.id)).why).toContain('uygulanmış bir planı var');
        expect((await HP().geriAlHedef(h.id)).ok).toBe(true);
        expect([ESP.S.profile.focus, ESP.S.profile.dailyMinutes, ESP.Mod.isOn('lang')])
          .toEqual(['balanced', 60, false]);
        expect(ESP.S.goals.length).toBe(0);
        expect(HP().aktif(h.id)).toBe(null);
      });
    });

    it('geri alma kullanıcının sonradan seçtiği odağı ezmez', async () => {
      kur();
      await withTodayAsync(BUGUN, async () => {
        const h = dilHedefi();
        await HP().uygulaHedef(h.id);
        await ESP.Model.saveProfile({ focus:'music' });
        await HP().geriAlHedef(h.id);
        expect(ESP.S.profile.focus).toBe('music');
      });
    });

    it('hedef bırakılınca plan kapanır ve söylenir', async () => {
      kur();
      await withTodayAsync(BUGUN, async () => {
        const h = dilHedefi();
        await HP().uygulaHedef(h.id);
        const r = await HD().durumDegistir(h.id, 'birakildi');
        expect(r.not).toContain('plan');
        expect(ESP.S.profile.focus).toBe('balanced');
        expect(HP().liste()[0].durum).toBe('kapandi');
        expect(ESP.S.goals.length).toBe(0);
      });
    });

    it('hedef planı yalnız senin onayınla uygulanır; model türü öneremez', async () => {
      kur();
      await withTodayAsync(BUGUN, async () => {
        const h = dilHedefi();
        const r = await ESP.Plans.accept({ id:'m1', agentId:'patron', kind:'hedefplan', source:'model',
          payload:{ hedefId:h.id }, at:BUGUN });
        expect(r.ok).toBe(false);
        expect(ESP.Plans.KIND_BY_ID.hedefplan.modelYok).toBe(true);
        expect(ESP.Plans.KIND_BY_ID.hedefplan.level).toBe('buyuk');
      });
    });

    it('ilerleme: dilde ölçülen pratik saati, enstrümanda ölçüm yoksa «veri yok»', async () => {
      kur();
      await withTodayAsync(BUGUN, async () => {
        const h = dilHedefi();
        await HP().uygulaHedef(h.id);
        const p = HP().aktif(h.id);
        expect(HP().ilerleme(p, BUGUN).durum).toBe('veri_yok');
        pushSession('2026-10-01', 'lang', 240);
        const il = HP().ilerleme(p, '2026-10-21');
        expect([il.durum, il.olculen.deger, il.beklenen]).toEqual(['geride', 4, 7.7]);
        expect(il.metin).toContain('gerisindesin');
        pushPiece('Gam', { attempts:[{ date:'2026-09-01', bpm:80, clean:true }] });
        const m = hedef('Bir yılda gitarda Kalfa\'ya gelmek istiyorum; günde yarım saat ayırabilirim',
          { simdi:{ deger:80, etiket:'tahmin' } });
        const mp = HP().kur(m, BUGUN).plan;
        expect(HP().ilerleme(mp, BUGUN).durum).toBe('veri_yok');
      });
    });
  });

  describe('günün dil kartı (fikir 38)', () => {
    it('önce vadeli, sonra en düşük kutu; tarih destesi girmez; kart yoksa gönderilmez', () => {
      ESP.Test.withToday('2026-09-24', () => {
        ESP.Test.resetState();
        const { pushCard } = ESP.Test;
        pushCard({ front:'rahat', back:'easy', lang:'en', box:4, due:'2026-10-10' });
        pushCard({ front:'zor', back:'hard', lang:'en', box:1, due:'2026-10-10' });
        pushCard({ front:'vadeli', back:'due', lang:'en', box:3, due:'2026-09-20' });
        pushCard({ front:'Malazgirt', back:'1071', lang:ESP.HISTORY_DECK, box:1, due:'2026-09-01' });
        const d = ESP.Hedefler.dilKarti();
        expect(d.gun).toBe('2026-09-24');
        expect(d.kartlar.map(k => k.on)).toEqual(['vadeli', 'zor', 'rahat']);
        ESP.S.cards = [];
        expect(ESP.Hedefler.dilKarti()).toBe(null);
      });
    });
  });
})();
