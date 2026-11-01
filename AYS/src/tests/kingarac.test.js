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

    it('deneme aracı: ays_deneme önizleme, uygulama ve geri alma', async () => {
      await hazirla();
      const o = await A().onizle('ays_deneme', { islem:'ekle', tur:'TYT', yayinci:'3D Simülasyon', net:95 });
      expect(o.ok).toBe(true);
      expect(o.onizle.metin).toContain('3D Simülasyon');
      const u = await A().uygula({ arac:true, ad:'ays_deneme', param:{ islem:'ekle', tur:'TYT', yayinci:'3D Simülasyon', net:95 } });
      expect(u.ok).toBe(true);
      expect(R.S.exams.some(e => e.publisher === '3D Simülasyon')).toBe(true);
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

    it('etkinlik aracı: ays_etkinlik önizleme, uygulama ve geri alma', async () => {
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
  });
})();
