/* Öğrenme akışı: video notu, zaman damgası, meşgale, enerji, mola. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const M = R.Model, U = R.U, S = R.S;

  describe('Video URL çözümleme', function(){
    it('standart YouTube bağlantısından id çıkarır', function(){
      const p = M.parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(p.provider).toBe('youtube');
      expect(p.videoId).toBe('dQw4w9WgXcQ');
    });
    it('kısa bağlantıyı çözer', function(){
      expect(M.parseVideoUrl('https://youtu.be/dQw4w9WgXcQ').videoId).toBe('dQw4w9WgXcQ');
    });
    it('embed, shorts ve live biçimlerini çözer', function(){
      expect(M.parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ').videoId).toBe('dQw4w9WgXcQ');
      expect(M.parseVideoUrl('https://youtube.com/shorts/dQw4w9WgXcQ').videoId).toBe('dQw4w9WgXcQ');
      expect(M.parseVideoUrl('https://youtube.com/live/dQw4w9WgXcQ').videoId).toBe('dQw4w9WgXcQ');
    });
    it('ek parametreli bağlantıyı çözer', function(){
      expect(M.parseVideoUrl('https://www.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ&t=30s').videoId).toBe('dQw4w9WgXcQ');
    });
    it('tanınmayan sağlayıcıda other döner ve URL korunur', function(){
      const p = M.parseVideoUrl('https://ornek.com/ders/12');
      expect(p.provider).toBe('other');
      expect(p.videoId).toBeNull();
      expect(p.url).toBe('https://ornek.com/ders/12');
    });
    it('boş girdi çökmez', function(){
      const p = M.parseVideoUrl('');
      expect(p.provider).toBe('other');
      expect(p.url).toBe('');
    });
  });

  describe('Zaman damgası', function(){
    it('mm:ss saniyeye çevrilir', function(){
      expect(M.parseTs('12:30')).toBe(750);
    });
    it('hh:mm:ss saniyeye çevrilir', function(){
      expect(M.parseTs('1:02:03')).toBe(3723);
    });
    it('tek sayı saniye sayılır', function(){
      expect(M.parseTs('45')).toBe(45);
    });
    it('bozuk girdide null döner', function(){
      expect(M.parseTs('abc')).toBeNull();
      expect(M.parseTs('')).toBeNull();
      expect(M.parseTs('-3:00')).toBeNull();
    });
    it('biçimleme gidip gelirken değeri korur', function(){
      expect(M.fmtTs(750)).toBe('12:30');
      expect(M.fmtTs(3723)).toBe('1:02:03');
      expect(M.fmtTs(5)).toBe('0:05');
    });
    it('zaman damgalı bağlantı üretir', function(){
      const note = M.newVideoNote({ url:'https://youtu.be/dQw4w9WgXcQ' });
      expect(M.tsUrl(note, 750)).toContain('t=750s');
    });
    it('YouTube olmayan notta düz URL döner', function(){
      const note = M.newVideoNote({ url:'https://ornek.com/ders' });
      expect(M.tsUrl(note, 90)).toBe('https://ornek.com/ders');
    });
  });

  describe('Video notu kaydı', function(){
    it('yeni not varsayılan kapları taşır', function(){
      resetState();
      const n = M.newVideoNote({ title:'Paragraf 1' });
      expect(n.segments).toHaveLength(0);
      expect(n.done).toBeFalsy();
      expect(typeof n.id).toBe('string');
    });
    it('kaydedince duruma ve depoya yazılır', async function(){
      resetState();
      const n = await M.saveVideoNote(M.newVideoNote({ title:'Hücre' }));
      expect(S.videoNotes).toHaveLength(1);
      expect(await R.Store.get('videoNotes/'+n.id)).toBeTruthy();
    });
    it('aynı not iki kez eklenmez, güncellenir', async function(){
      resetState();
      const n = await M.saveVideoNote(M.newVideoNote({ title:'A' }));
      n.title = 'B';
      await M.saveVideoNote(n);
      expect(S.videoNotes).toHaveLength(1);
      expect(S.videoNotes[0].title).toBe('B');
    });
    it('silinince durumdan ve depodan çıkar', async function(){
      resetState();
      const n = await M.saveVideoNote(M.newVideoNote({ title:'A' }));
      await M.deleteVideoNote(n.id);
      expect(S.videoNotes).toHaveLength(0);
      expect(await R.Store.get('videoNotes/'+n.id)).toBeNull();
    });
    it('segmentler zaman damgası ve etiket taşır', async function(){
      resetState();
      const n = M.newVideoNote({ title:'A' });
      n.segments.push({ ts:120, text:'önemli kural', tag:'kural' });
      await M.saveVideoNote(n);
      expect(S.videoNotes[0].segments[0].ts).toBe(120);
      expect(S.videoNotes[0].segments[0].tag).toBe('kural');
    });
  });

  describe('Meşgale kataloğu', function(){
    it('katalog en az 15 öge içerir', function(){
      resetState();
      expect(M.activityCatalog().length).toBeGreaterThan(14);
    });
    it('her ögede süre, enerji ve tür vardır', function(){
      M.activityCatalog().forEach(a => {
        expect(typeof a.minutes).toBe('number');
        expect(R.ENERGY_LEVELS[a.energy]).toBeTruthy();
        expect(R.ACTIVITY_KINDS[a.kind]).toBeTruthy();
      });
    });
    it('gizlenen öge katalogdan düşer', async function(){
      resetState();
      const before = M.activityCatalog().length;
      await M.hideActivity('walk-short', true);
      expect(M.activityCatalog().length).toBe(before - 1);
      expect(M.activityById('walk-short')).toBeNull();
    });
    it('kullanıcının eklediği öge katalogda görünür', async function(){
      resetState();
      await M.saveActivity({ id:'my-1', name:'Bisiklet', minutes:20, energy:'high', kind:'beden', custom:true });
      expect(M.activityById('my-1').name).toBe('Bisiklet');
    });
  });

  describe('Enerji ve mola', function(){
    it('enerji 1–5 aralığına kırpılır', async function(){
      resetState();
      const a = await M.saveMood('2026-09-08', { energy:9 });
      const b = await M.saveMood('2026-09-07', { energy:-2 });
      expect(a.energy).toBe(5);
      expect(b.energy).toBe(1);
    });
    it('gün başına tek kayıt tutulur', async function(){
      resetState();
      await M.saveMood('2026-09-08', { energy:2 });
      await M.saveMood('2026-09-08', { energy:4, note:'iyi' });
      expect(Object.keys(S.mood)).toHaveLength(1);
      expect(M.moodOf('2026-09-08').energy).toBe(4);
      expect(M.moodOf('2026-09-08').note).toBe('iyi');
    });
    it('kayıt yokken ortalama null', function(){
      resetState();
      expect(M.energyAverage(7)).toBeNull();
    });
    it('son günlerin ortalamasını verir', async function(){
      await withTodayAsync('2026-09-08', async () => {
        resetState();
        await M.saveMood('2026-09-08', { energy:4 });
        await M.saveMood('2026-09-07', { energy:2 });
        expect(M.energyAverage(7)).toBe(3);
      });
    });
    it('mola kaydı güne bağlanır', async function(){
      await withTodayAsync('2026-09-08', async () => {
        resetState();
        await M.saveBreak({ activityId:'stretch', minutes:5 });
        await M.saveBreak({ activityId:'walk-short', minutes:10, dayISO:'2026-09-07' });
        expect(M.breaksOf('2026-09-08')).toHaveLength(1);
        expect(M.breaksOf('2026-09-07')).toHaveLength(1);
        expect(M.breaksOf('2026-09-08')[0].activityId).toBe('stretch');
      });
    });
  });

  describe('Nottan tekrar kartı', function(){
    function noteWithSeg(){
      return { id:'v1', title:'Paragraf', subjectId:'tyt-turkce', topicId:null,
        segments:[{ ts:120, text:'ana düşünce paragrafın tamamını kapsar', tag:'kural' }] };
    }
    it('mevcut kart şemasını kullanır', function(){
      resetState();
      const c = M.cardFromSegment(noteWithSeg(), noteWithSeg().segments[0]);
      expect(c.stage).toBe(0);
      expect(c.history).toHaveLength(0);
      expect(c.lastReviewedAt).toBeNull();
    });
    it('kaynağı nota bağlar', function(){
      const c = M.cardFromSegment(noteWithSeg(), noteWithSeg().segments[0]);
      expect(c.source).toBe('note');
      expect(c.sourceRef).toBe('v1');
      expect(c.subjectId).toBe('tyt-turkce');
    });
    it('arka yüz not metnidir, ön yüz geri çağırma sorar', function(){
      const c = M.cardFromSegment(noteWithSeg(), noteWithSeg().segments[0]);
      expect(c.back).toBe('ana düşünce paragrafın tamamını kapsar');
      expect(c.front).toContain('kural');
    });
    it('ilk tekrar 1 gün sonradır (SRS aşama 0)', function(){
      R.Test.withToday('2026-09-08', () => {
        resetState();
        expect(M.cardFromSegment(noteWithSeg(), noteWithSeg().segments[0]).dueAt).toBe('2026-09-09');
      });
    });
    it('konu bağlı değilse başlığa düşer', function(){
      const note = { id:'v2', title:'Hücre', subjectId:null, topicId:null, segments:[] };
      expect(M.noteTopicName(note)).toBe('Hücre');
    });
    it('SRS zamanlaması normal kartla aynı işler', function(){
      resetState();
      const c = M.cardFromSegment(noteWithSeg(), noteWithSeg().segments[0]);
      M.schedule(c, 'remembered');
      expect(c.stage).toBe(1);
    });
  });

  describe('Şema göçü', function(){
    it('şema sürümü 4', function(){
      expect(R.SCHEMA_VERSION).toBe(4);
    });
    it('eski sürümden yükseltir, veriyi silmez', async function(){
      resetState();
      S.meta = { lastBackupAt:null, schemaVersion:2 };
      await M.saveVideoNote(M.newVideoNote({ title:'korunmalı' }));
      const res = await M.migrate();
      expect(res.changed).toBeTruthy();
      expect(res.to).toBe(R.SCHEMA_VERSION);
      expect(S.meta.schemaVersion).toBe(R.SCHEMA_VERSION);
      expect(S.videoNotes).toHaveLength(1);
    });
    it('güncel sürümde tekrar göç etmez', async function(){
      resetState();
      S.meta = { schemaVersion:R.SCHEMA_VERSION };
      expect((await M.migrate()).changed).toBeFalsy();
    });
  });
})();
