/* Sağlamlık: güvenli varsayılanlar, gizlilik süzgeci, gardlar, sayfalama. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const U = R.U, C = R.Calc, S = R.S;

  describe('Güvenli varsayılanlar', function(){
    it('NaN net ekrana tire olarak düşer', function(){
      expect(U.fmtNet(NaN)).toBe('—');
      expect(U.fmtNet(Infinity)).toBe('—');
    });
    it('NaN sayı tire olarak düşer', function(){
      expect(U.fmtNum(NaN)).toBe('—');
    });
    it('yüzde bozuk girdide sıfır verir', function(){
      expect(U.pct(NaN, 10)).toBe(0);
      expect(U.pct(5, NaN)).toBe(0);
      expect(U.pct(5, 0)).toBe(0);
    });
    it('yuvarlama bozuk girdide sıfır verir', function(){
      expect(U.round(NaN)).toBe(0);
      expect(U.round(Infinity, 2)).toBe(0);
    });
    it('boş veriyle KPI’lar çökmez', function(){
      resetState();
      expect(C.medianTrend('TYT').last3).toBeNull();
      expect(C.cardDebt()).toBe(0);
      expect(C.overallClosure().pct).toBe(0);
      expect(C.errorPareto()).toHaveLength(5);
    });
  });

  describe('Gizlilik süzgeci (koç bağlamı)', function(){
    function withProfile(fn){
      resetState();
      S.profile.name = 'Ömer Faruk';
      S.profile.city = 'Adana';
      S.profile.school = 'Falanca Lisesi';
      return fn();
    }
    it('ad ve şehir anahtarlarını siler', function(){
      withProfile(() => {
        const out = R.CoachTools.sanitize({ name:'Ömer Faruk', city:'Adana', net:42 });
        expect(out.name).toBeUndefined();
        expect(out.city).toBeUndefined();
        expect(out.net).toBe(42);
      });
    });
    it('iç içe nesnelerde de siler', function(){
      withProfile(() => {
        const out = R.CoachTools.sanitize({ profil:{ ad:'Ömer Faruk', okul:'X' }, hafta:3 });
        expect(out.profil.ad).toBeUndefined();
        expect(out.profil.okul).toBeUndefined();
        expect(out.hafta).toBe(3);
      });
    });
    it('serbest metin içindeki kişisel değeri maskeler', function(){
      withProfile(() => {
        const out = R.CoachTools.sanitize({ not:'Ömer Faruk bugün Adana’da çalıştı' });
        expect(out.not.indexOf('Ömer Faruk')).toBe(-1);
        expect(out.not.indexOf('Adana')).toBe(-1);
      });
    });
    it('dizileri gezerek temizler', function(){
      withProfile(() => {
        const out = R.CoachTools.sanitize([{ name:'Ömer Faruk' }, { net:10 }]);
        expect(out[0].name).toBeUndefined();
        expect(out[1].net).toBe(10);
      });
    });
    it('araç çıktısı kişisel bilgi taşımaz', function(){
      withProfile(() => {
        const tools = R.CoachTools.forSample();
        const durum = tools.find(t => t.name === 'durum_ozeti').execute({});
        const json = JSON.stringify(durum);
        expect(json.indexOf('Ömer')).toBe(-1);
        expect(json.indexOf('Adana')).toBe(-1);
      });
    });
    it('hedef aracında program adı kalır ama kişisel alan gitmez', function(){
      withProfile(() => {
        S.profile.program = 'Ege Üniversitesi Hemşirelik';
        const tools = R.CoachTools.forSample();
        const hedef = tools.find(t => t.name === 'hedef_ve_net_matrisi').execute({});
        expect(hedef.program).toContain('Hemşirelik');
        expect(JSON.stringify(hedef).indexOf('Adana')).toBe(-1);
      });
    });
    it('araç sonucu aynı çağrıda önbelleğe alınır', function(){
      resetState();
      const tools = R.CoachTools.forSample();
      const t = tools.find(x => x.name === 'durum_ozeti');
      expect(t.execute({}) === t.execute({})).toBeTruthy();
    });
  });

  describe('Koç gardları', function(){
    it('istem sürümü tanımlı', function(){
      expect(typeof R.PROMPTS.version).toBe('number');
    });
    it('ev kuralları tıbbi tavsiye ve garantiyi yasaklar', function(){
      const all = R.PROMPTS.houseRules.join(' ');
      expect(all).toContain('Tıbbi');
      expect(all).toContain('garantisi');
    });
    it('tıbbi tavsiye içeren çıktı işaretlenir', function(){
      resetState();
      const v = R.Coach.validate('Bu durumda bir antidepresan kullanman iyi gelebilir.');
      expect(v.warnings.length).toBeGreaterThan(0);
    });
    it('kesin sıra vaadi işaretlenir', function(){
      resetState();
      const v = R.Coach.validate('Bu tempoyla 60.000 sıraya gireceksin.');
      expect(v.warnings.length).toBeGreaterThan(0);
    });
    it('kurallara uyan yanıt geçer', function(){
      resetState();
      const v = R.Coach.validate('Plan tamamlaman %78; işlem hatası baskın. Üç gün 10 benzer soru çöz.');
      expect(v.warnings).toHaveLength(0);
    });
    it('çevrimdışı şablon kuralları ve veriyi taşır', function(){
      const note = R.PROMPTS.offlineTemplate({ hafta:3 });
      expect(note).toContain('medyan');
      expect(note).toContain('"hafta"');
    });
  });

  describe('Yerel alan uyarısı', function(){
    it('gerçek depo kota yüzeyi verir', function(){
      const q = R.Test.realStore.localQuota();
      expect(q.pct >= 0 && q.pct <= 100).toBeTruthy();
      expect(q.limit).toBeGreaterThan(0);
    });
    it('boş depoda uyarı verilmez', function(){
      resetState();
      const q = R.Store.localQuota();
      expect(q.pct).toBe(0);
      expect(q.near).toBeFalsy();
      expect(q.full).toBeFalsy();
    });
    it('dolu depoda uyarı ve kritik eşik açılır', function(){
      resetState();
      const big = 'x'.repeat(4 * 1024 * 1024);
      R.Store._data['dolgu/big'] = big;
      const q = R.Store.localQuota();
      expect(q.near).toBeTruthy();
      expect(q.pct).toBeGreaterThan(74);
      delete R.Store._data['dolgu/big'];
    });
  });

  describe('Sayfalama', function(){
    it('sayfa dilimi doğru', function(){
      const p = R.C.paginate([1,2,3,4,5,6,7], 2, 3);
      expect(p.items).toEqual([4,5,6]);
      expect(p.pages).toBe(3);
      expect(p.total).toBe(7);
    });
    it('sayfa numarası aralık dışına taşmaz', function(){
      expect(R.C.paginate([1,2,3], 9, 2).page).toBe(2);
      expect(R.C.paginate([1,2,3], -4, 2).page).toBe(1);
    });
    it('boş listede tek sayfa', function(){
      const p = R.C.paginate([], 1, 10);
      expect(p.pages).toBe(1);
      expect(p.items).toHaveLength(0);
    });
    it('tek sayfada gezinme çizilmez', function(){
      expect(String(R.C.Pager({ page:1, pages:1, total:3, act:'x' }))).toBe('');
    });
    it('çok sayfada önceki/sonraki durumu doğru', function(){
      const out = String(R.C.Pager({ page:1, pages:3, total:70, act:'x' }));
      expect(out).toContain('disabled');
      expect(out).toContain('data-page="2"');
    });
  });
})();
