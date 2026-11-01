/* King araçları — AYS (core/kingarac.js, brand/ortak/arac.js).

   Kanıtlanan: okuma araçları ofisin veri araçlarıdır ve kişisel alan
   taşımaz; plan eylemi önizlenir, yalnız onayla Proposals.hemen'le
   uygulanır ve geri alınır; ölçüm yazan ve modele kapalı eylem katalogda
   yoktur; yeni Model araçları önizlenir, uygulanır ve geri alınır. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const A = () => window.LIFEOS.ARAC;

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    R.S.profile.name = 'Gizli Ad';
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    A()._sifirla();
    A().kur({ modul:'ays', araclar:() => R.KingArac.liste() });
  }

  describe('King araçları — AYS', () => {
    it('her araç katalogdan geçer; ölçüm ve modele kapalı eylem yok', async () => {
      await hazirla();
      const ham = R.KingArac.liste(), l = A().liste();
      expect(l.length).toBe(ham.length);
      const adlar = l.map(a => a.ad);
      expect(adlar).toContain('ays_denemeler');
      expect(adlar).toContain('ays_week_target');
      expect(adlar).toContain('ays_ara_ver');
      expect(adlar.indexOf('ays_soru_yaz')).toBe(-1);
      expect(adlar.indexOf('ays_hedef_plan')).toBe(-1);
      A()._sifirla();
    });

    it('okuma sonucu kişisel alan taşımaz; sayıyı AYS hesaplar', async () => {
      await hazirla();
      const r = await A().calistir('ays_hedef_ve_net_matrisi', {});
      expect(r.ok).toBe(true);
      expect(JSON.stringify(r.sonuc).indexOf('Gizli Ad')).toBe(-1);
      const d = await A().calistir('ays_denemeler', { limit:3 });
      expect(d.satirlar).toEqual(['Kayıtlı deneme yok.']);
      A()._sifirla();
    });

    it('haftalık hedef: önizleme, onayla uygulama ve geri alma', async () => {
      await hazirla();
      const n = R.Model.currentWeek(), w = R.S.weeks[R.Model.weekId(n)];
      const eski = w.questionTarget, yeni = eski === 900 ? 950 : 900;
      const o = await A().onizle('ays_week_target', { weekN:n, questionTarget:yeni });
      expect(o.ok).toBe(true);
      expect(o.seviye).toBe('orta');
      expect(o.onizle.satirlar[1]).toContain(yeni + ' soru');
      expect(w.questionTarget).toBe(eski);
      const u = await A().uygula({ arac:true, ad:'ays_week_target', param:{ weekN:n, questionTarget:yeni } });
      expect(u.ok).toBe(true);
      expect(R.S.weeks[R.Model.weekId(n)].questionTarget).toBe(yeni);
      await u.geriAl();
      expect(R.S.weeks[R.Model.weekId(n)].questionTarget).toBe(eski);
      /* AYS'nin kendi doğrulaması: plan dışı hafta önizlenmez. */
      const k = await A().onizle('ays_week_target', { weekN:999, questionTarget:900 });
      expect(k.ok).toBe(false);
      expect(k.hata).toBe('Hafta numarası plan dışında.');
      R.S.officeProposals = [];
      A()._sifirla();
    });

    /* ---------- Yeni Model araçları (KING-4 A2) ---------- */

    it('deneme aracı: ays_deneme doğru/yanlış/boş ile ekleme, önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      /* 1. Yalnız net verilince hata döner (AGENTS §1 veri uydurulmaz) */
      const hatali = await A().onizle('ays_deneme', { islem:'ekle', tur:'TYT', yayinci:'3D Simülasyon', net:95 });
      expect(hatali.ok).toBe(false);
      expect(hatali.hata).toContain('doğru, yanlış ve boş sayısı belirtilmelidir');

      /* 2. Doğru, yanlış ve boş ile tam kayıt */
      const o = await A().onizle('ays_deneme', { islem:'ekle', tur:'TYT', yayinci:'3D Simülasyon', testAdi:'Genel', dogru:100, yanlis:20, bos:0 });
      expect(o.ok).toBe(true);
      expect(o.onizle.metin).toContain('3D Simülasyon');

      const u = await A().uygula({ arac:true, ad:'ays_deneme', param:{ islem:'ekle', tur:'TYT', yayinci:'3D Simülasyon', testAdi:'Genel', dogru:100, yanlis:20, bos:0 } });
      expect(u.ok).toBe(true);
      const ex = R.S.exams.find(e => e.publisher === '3D Simülasyon');
      expect(ex).toBeDefined();
      expect(ex.tests[0].correct).toBe(100);
      expect(ex.tests[0].wrong).toBe(20);
      expect(ex.tests[0].blank).toBe(0);

      await u.geriAl();
      expect(R.S.exams.some(e => e.publisher === '3D Simülasyon')).toBe(false);
      A()._sifirla();
    });

    it('enerji aracı: ays_enerji önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_enerji', { enerji:4, not:'Zinde hissediyorum' });
      expect(o.ok).toBe(true);
      expect(o.onizle.satirlar[1]).toContain('4/5');
      const u = await A().uygula({ arac:true, ad:'ays_enerji', param:{ enerji:4, not:'Zinde hissediyorum' } });
      expect(u.ok).toBe(true);
      expect(R.Model.moodOf().energy).toBe(4);
      await u.geriAl();
      expect(R.Model.moodOf()).toBe(null);
      A()._sifirla();
    });

    it('etkinlik aracı: ays_etkinlik ekleme, önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_etkinlik', { ad:'Gitar pratiği', dakika:15, tur:'yaratici' });
      expect(o.ok).toBe(true);
      expect(o.onizle.satirlar[0]).toContain('15 dk');
      const u = await A().uygula({ arac:true, ad:'ays_etkinlik', param:{ ad:'Gitar pratiği', dakika:15, tur:'yaratici' } });
      expect(u.ok).toBe(true);
      expect(R.S.activities.some(a => a.name === 'Gitar pratiği')).toBe(true);
      await u.geriAl();
      expect(R.S.activities.some(a => a.name === 'Gitar pratiği')).toBe(false);
      A()._sifirla();
    });

    it('etkinlik aracı: ays_etkinlik güncellemede yeni alanlar eski değerin üstüne yazılır', async () => {
      await hazirla();
      // Önce etkinlik ekle
      const u1 = await A().uygula({ arac:true, ad:'ays_etkinlik', param:{ ad:'Nefes Egzersizi', dakika:5, enerji:'low', tur:'zihin' } });
      expect(u1.ok).toBe(true);
      const act = R.S.activities.find(a => a.name === 'Nefes Egzersizi');
      expect(act).toBeDefined();
      expect(act.minutes).toBe(5);

      // Aynı id ile dakikayı 15 yap (eski değer yeninin üstüne yazılmamalı)
      const u2 = await A().uygula({ arac:true, ad:'ays_etkinlik', param:{ id:act.id, dakika:15 } });
      expect(u2.ok).toBe(true);
      const guncel = R.S.activities.find(a => a.id === act.id);
      expect(guncel.minutes).toBe(15);
      expect(guncel.name).toBe('Nefes Egzersizi');

      // Geri alma ile eski 5 dakikaya dönmeli
      await u2.geriAl();
      const eskiHal = R.S.activities.find(a => a.id === act.id);
      expect(eskiHal.minutes).toBe(5);

      await u1.geriAl();
      expect(R.S.activities.some(a => a.id === act.id)).toBe(false);
      A()._sifirla();
    });

    it('hafta değerlendirme aracı: ays_hafta_degerlendirme önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const n = R.Model.currentWeek(), id = R.Model.weekId(n);
      const o = await A().onizle('ays_hafta_degerlendirme', { hafta:n, not:'Plan tuttu', puan:5 });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_hafta_degerlendirme', param:{ hafta:n, not:'Plan tuttu', puan:5 } });
      expect(u.ok).toBe(true);
      expect(R.S.reviews[id].rating).toBe(5);
      await u.geriAl();
      expect(R.S.reviews[id]).toBe(undefined);
      A()._sifirla();
    });

    it('kart aracı: ays_kart önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_kart', { islem:'ekle', on:'Mitoz profaz', arka:'İğ iplikleri oluşur' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_kart', param:{ islem:'ekle', on:'Mitoz profaz', arka:'İğ iplikleri oluşur' } });
      expect(u.ok).toBe(true);
      expect(R.S.cards.some(c => c.front === 'Mitoz profaz')).toBe(true);
      await u.geriAl();
      expect(R.S.cards.some(c => c.front === 'Mitoz profaz')).toBe(false);
      A()._sifirla();
    });

    it('konu durumu aracı: ays_konu_durumu önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_konu_durumu', { dersId:'mat_tyt', konuId:'fonksiyonlar', durum:'closed' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_konu_durumu', param:{ dersId:'mat_tyt', konuId:'fonksiyonlar', durum:'closed' } });
      expect(u.ok).toBe(true);
      expect(R.Model.topicState('mat_tyt', 'fonksiyonlar').state).toBe('closed');
      await u.geriAl();
      expect(R.Model.topicState('mat_tyt', 'fonksiyonlar').state).toBe('not_started');
      A()._sifirla();
    });

    it('meşgale aracı: ays_mesgale_ekle önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const d = R.U.todayISO();
      await R.Model.ensureDay(d);
      const eski = R.S.days[d].distractions || 0;
      const o = await A().onizle('ays_mesgale_ekle', { tarih:d });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_mesgale_ekle', param:{ tarih:d } });
      expect(u.ok).toBe(true);
      expect(R.S.days[d].distractions).toBe(eski + 1);
      await u.geriAl();
      expect(R.S.days[d].distractions).toBe(eski);
      A()._sifirla();
    });

    it('mola aracı: ays_mola önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_mola', { dakika:10 });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_mola', param:{ dakika:10 } });
      expect(u.ok).toBe(true);
      expect(R.S.breaks.some(b => b.minutes === 10)).toBe(true);
      await u.geriAl();
      expect(R.S.breaks.some(b => b.minutes === 10)).toBe(false);
      A()._sifirla();
    });

    it('profil aracı: ays_profil önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_profil', { islem:'yeni_profil', ad:'Kardeş Aday' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_profil', param:{ islem:'yeni_profil', ad:'Kardeş Aday' } });
      expect(u.ok).toBe(true);
      expect(R.S.profiles.some(p => p.name === 'Kardeş Aday')).toBe(true);
      await u.geriAl();
      expect(R.S.profiles.some(p => p.name === 'Kardeş Aday')).toBe(false);
      A()._sifirla();
    });

    it('profiller okuma aracı: ays_profiller liste ve veri yok durumu', async () => {
      await hazirla();
      /* 1. Normal kayıtlı durum */
      const r = await A().calistir('ays_profiller', {});
      expect(r.ok).toBe(true);
      expect(r.sonuc.profiller.length).toBeGreaterThan(0);
      expect(r.satirlar[0]).toContain('Gizli Ad');
      /* 2. Kaydı olmayan durum */
      const origList = R.Model.profileList;
      R.Model.profileList = () => [];
      const bos = await A().calistir('ays_profiller', {});
      expect(bos.ok).toBe(true);
      expect(bos.satirlar).toEqual(['Kayıtlı profil yok.']);
      R.Model.profileList = origList;
      A()._sifirla();
    });

    it('takvim aracı: ays_takvim önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_takvim', { islem:'ekle', tur:'tatil', baslangic:'2026-11-20', not:'Ara Tatil' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_takvim', param:{ islem:'ekle', tur:'tatil', baslangic:'2026-11-20', not:'Ara Tatil' } });
      expect(u.ok).toBe(true);
      expect(R.S.calendar.some(c => c.note === 'Ara Tatil')).toBe(true);
      await u.geriAl();
      expect(R.S.calendar.some(c => c.note === 'Ara Tatil')).toBe(false);
      A()._sifirla();
    });

    it('telafi aracı: ays_telafi önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_telafi', { protoId:'two-weeks-behind', durum:'active', sonuc:'Başlangıç' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_telafi', param:{ protoId:'two-weeks-behind', durum:'active', sonuc:'Başlangıç' } });
      expect(u.ok).toBe(true);
      expect(R.S.protocols.some(p => p.protoId === 'two-weeks-behind')).toBe(true);
      await u.geriAl();
      expect(R.S.protocols.some(p => p.protoId === 'two-weeks-behind')).toBe(false);
      A()._sifirla();
    });

    it('video notu aracı: ays_video_notu önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_video_notu', { islem:'ekle', baslik:'İntegral Alma', url:'https://youtu.be/abc12345678' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_video_notu', param:{ islem:'ekle', baslik:'İntegral Alma', url:'https://youtu.be/abc12345678' } });
      expect(u.ok).toBe(true);
      expect(R.S.videoNotes.some(n => n.title === 'İntegral Alma')).toBe(true);
      await u.geriAl();
      expect(R.S.videoNotes.some(n => n.title === 'İntegral Alma')).toBe(false);
      A()._sifirla();
    });

    it('yanlış aracı: ays_yanlis önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_yanlis', { islem:'ekle', dersId:'fiz_ayt', konu:'Kuvvet', neden:'dikkat', not:'İşlem hatası' });
      expect(o.ok).toBe(true);
      const u = await A().uygula({ arac:true, ad:'ays_yanlis', param:{ islem:'ekle', dersId:'fiz_ayt', konu:'Kuvvet', neden:'dikkat', not:'İşlem hatası' } });
      expect(u.ok).toBe(true);
      expect(R.S.errors.some(e => e.note === 'İşlem hatası')).toBe(true);
      await u.geriAl();
      expect(R.S.errors.some(e => e.note === 'İşlem hatası')).toBe(false);
      A()._sifirla();
    });

    /* ---------- Görev 031: Yazma kuralları ve zorunlu parametreler ---------- */

    it('yazma kuralları: cümleden parametre çıkarma', async () => {
      await hazirla();
      const ham = R.KingArac.liste();
      const byAd = ham.reduce((m, a) => { m[a.ad] = a; return m; }, {});

      /* 1. ays_week_target */
      expect(byAd.ays_week_target.kural).toBeDefined();
      const pWT = byAd.ays_week_target.kural('haftalık soru hedefi 600 olsun', 'haftalık soru hedefi 600 olsun');
      expect(pWT).toBeDefined();
      expect(pWT.questionTarget).toBe(600);

      /* 2. ays_gunluk_sure */
      expect(byAd.ays_gunluk_sure.kural).toBeDefined();
      const pGS = byAd.ays_gunluk_sure.kural('günde 4 saat çalışacağım', 'günde 4 saat çalışacağım');
      expect(pGS).toBeDefined();
      expect(pGS.dakika).toBe(240);

      /* 3. ays_gecici_sure */
      expect(byAd.ays_gecici_sure.kural).toBeDefined();
      const pGec1 = byAd.ays_gecici_sure.kural('bu hafta çalışma süresini 3 saat yap', 'bu hafta çalışma süresini 3 saat yap');
      expect(pGec1).toBeDefined();
      expect(pGec1.from).toBeDefined();
      expect(pGec1.to).toBeDefined();
      expect(pGec1.dakika).toBe(180);

      /* Miktarsız «kısalt» uydurulmaz (§1.7): King sorar. */
      expect(byAd.ays_gecici_sure.kural('bugün çalışma süresini kısalt', 'bugün çalışma süresini kısalt')).toBeNull();

      /* 4. ays_ara_ver */
      expect(byAd.ays_ara_ver.kural).toBeDefined();
      const pAra = byAd.ays_ara_ver.kural('yarın ara ver', 'yarın ara ver');
      expect(pAra).toBeDefined();
      expect(pAra.from).toBeDefined();
      expect(pAra.to).toBeDefined();

      /* 5. ays_bolum_ac_kapa */
      expect(byAd.ays_bolum_ac_kapa.kural).toBeDefined();
      const pBol = byAd.ays_bolum_ac_kapa.kural('analiz bölümünü tekrar aç', 'analiz bölümünü tekrar aç');
      expect([pBol.bolum, pBol.acik]).toEqual(['analytics', 1]);
      /* Kartlar gizlenebilir bölüm değil (bolum.js GIZLENEBILIR): öneri yok. */
      expect(byAd.ays_bolum_ac_kapa.kural('kartlar bölümünü tekrar aç', 'kartlar bölümünü tekrar aç')).toBeNull();

      /* Ekran/sayfa açma bölüm gizleme değildir */
      expect(byAd.ays_bolum_ac_kapa.kural('soru çözüm ekranını aç', 'soru çözüm ekranını aç')).toBeNull();

      /* 6. ays_topic_review */
      expect(byAd.ays_topic_review.kural).toBeDefined();
      const pTop = byAd.ays_topic_review.kural('optik konusunu tekrara al', 'optik konusunu tekrara al');
      expect(pTop).toBeDefined();
      expect(pTop.topicId).toBe('tf-f12');

      /* 7. ays_cards_due_today */
      expect(byAd.ays_cards_due_today.kural).toBeDefined();
      const pCard = byAd.ays_cards_due_today.kural('vadesi geçmiş kartları bugüne aktar', 'vadesi geçmiş kartları bugüne aktar');
      expect(pCard).toBeDefined();

      /* 8. ays_decision_close */
      expect(byAd.ays_decision_close.kural).toBeDefined();
      /* Tek açık karar varsa o; yoksa ya da birden çoksa tahmin yok (sahte kimlik yok). */
      const acik = R.Office.openDecisions();
      const pDec = byAd.ays_decision_close.kural('toplantı kararını yapıldı işaretle', 'toplantı kararını yapıldı işaretle');
      expect(acik.length === 1 ? [pDec.decisionId, pDec.state] : pDec).toEqual(acik.length === 1 ? [acik[0].id, 'yapildi'] : null);

      /* Okuma hızlı yolu kayıt ve başka okuma cümlesini kapmaz. */
      expect(A().kuralla('bugün 10 dakika mola verdim')).toBeNull();
      expect((A().kuralla('geçen haftanın denemeleri nasıldı') || {}).ad === 'ays_haftalar').toBe(false);
      expect(A().kuralla('türev konusu nasıl seyrediyor')).toBeNull();

      A()._sifirla();
    });

    it('zorunlu parametreler: eksik parametrede dogrula reddeder', async () => {
      await hazirla();

      /* 1. ays_week_target: questionTarget zorunlu */
      expect(A().dogrula('ays_week_target', {}).ok).toBe(false);
      expect(A().dogrula('ays_week_target', { weekN:1 }).ok).toBe(false);
      expect(A().dogrula('ays_week_target', { questionTarget:500 }).ok).toBe(true);

      /* 2. ays_gunluk_sure: dakika zorunlu */
      expect(A().dogrula('ays_gunluk_sure', {}).ok).toBe(false);
      expect(A().dogrula('ays_gunluk_sure', { dakika:180 }).ok).toBe(true);

      /* 3. ays_gecici_sure: from ve to zorunlu */
      expect(A().dogrula('ays_gecici_sure', {}).ok).toBe(false);
      expect(A().dogrula('ays_gecici_sure', { from:'2026-11-01' }).ok).toBe(false);
      expect(A().dogrula('ays_gecici_sure', { from:'2026-11-01', to:'2026-11-01' }).ok).toBe(false);
      expect(A().dogrula('ays_gecici_sure', { from:'2026-11-01', to:'2026-11-01', dakika:120 }).ok).toBe(true);

      /* 4. ays_ara_ver: from ve to zorunlu */
      expect(A().dogrula('ays_ara_ver', {}).ok).toBe(false);
      expect(A().dogrula('ays_ara_ver', { from:'2026-11-01' }).ok).toBe(false);
      expect(A().dogrula('ays_ara_ver', { from:'2026-11-01', to:'2026-11-02' }).ok).toBe(true);

      /* 5. ays_bolum_ac_kapa: bolum ve acik zorunlu */
      expect(A().dogrula('ays_bolum_ac_kapa', {}).ok).toBe(false);
      expect(A().dogrula('ays_bolum_ac_kapa', { bolum:'cards' }).ok).toBe(false);
      expect(A().dogrula('ays_bolum_ac_kapa', { bolum:'cards', acik:1 }).ok).toBe(true);

      /* 6. ays_topic_review: topicId zorunlu */
      expect(A().dogrula('ays_topic_review', {}).ok).toBe(false);
      expect(A().dogrula('ays_topic_review', { topicId:'tm-24' }).ok).toBe(true);

      /* 7. ays_decision_close: decisionId zorunlu */
      expect(A().dogrula('ays_decision_close', {}).ok).toBe(false);
      expect(A().dogrula('ays_decision_close', { decisionId:'dec-1', state:'yapildi' }).ok).toBe(true);

      A()._sifirla();
    });
  });
})();
