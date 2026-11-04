/* KING ARAÇLARI — AYS'nin King'e açtığı işler (brand/ortak/arac.js, King 2.0 B).

   Okuma: ofis ajanlarının da gördüğü veri araçları (core/tools.js). Sonuç
   kişisel alanlardan süzülür (Tools.sanitize); sayıyı AYS'nin kendi hesabı
   üretir, King'in modeli yalnız cümleye çevirir.

   Yazma: plan eylemleri (data/actions.js, core/proposals.js) ve model
   eylemleri (core/state.js, KING-4 A2). Önizleme yapılır; onaydan sonra
   aynı doğrulama, anlık görüntü ve geri almayla uygulanır. Ölçüm yazan
   eylemler (`olcum`: soru, süre, uyku…) burada YOK: ölçüm kullanıcının
   cümlesinden King'in `kayit_gir` aracıyla, AYS'nin kendi ayrıştırıcısıyla
   girer (sayı kullanıcınındır). `modelYok` eylemler (hedef planı) modelin
   seçimine kapalıdır; kullanıcı Hedeflerim'den yapar. */
window.LIFEOS.PARCA.yazilar({
  'ays.core.kingarac.kayitli-deneme-yok':'Kayıtlı deneme yok.',
  'ays.core.kingarac.tahmin-icin-yeterli-deneme-y':'Tahmin için yeterli deneme yok.',
  'ays.core.kingarac.tahmini-puan-bandi':'Tahmini puan bandı: ',
  'ays.core.kingarac.sira-bandi':'Sıra bandı: ',
  'ays.core.kingarac.yanlis-defterinde-kayit-yok':'Yanlış defterinde kayıt yok.',
  'ays.core.kingarac.king-sohbetinde-istendi':'King sohbetinde istendi',
  'ays.core.kingarac.uygulanamadi':'Uygulanamadı: ',
  'ays.core.kingarac.birden-cok':'Birden çok ',
  'ays.core.kingarac.deneme-kaydi':'Deneme kaydı',
  'ays.core.kingarac.deneme-sinavini-kaydeder-gun':'Deneme sınavını kaydeder, günceller ya da siler. Eklemede doğru, yanlış ve boş sayısı zorunludur.',
  'ays.core.kingarac.tarih':'Tarih: ',
  'ays.core.kingarac.yayinci':'Yayıncı: ',
  'ays.core.kingarac.deneme-eklemek-icin-dogru-ya':'Deneme eklemek için doğru, yanlış ve boş sayısı belirtilmelidir; net sayısından doğru veya boş uydurulmaz.',
  'ays.core.kingarac.deneme-kaydedilecek':'Deneme kaydedilecek: ',
  'ays.core.kingarac.tur':'Tür: ',
  'ays.core.kingarac.test':'Test: ',
  'ays.core.kingarac.gecersiz-islem':'Geçersiz işlem: ',
  'ays.core.kingarac.deneme-silindi':'Deneme silindi.',
  'ays.core.kingarac.deneme-guncellendi':'Deneme güncellendi.',
  'ays.core.kingarac.deneme-kaydedildi':'Deneme kaydedildi.',
  'ays.core.kingarac.enerji-kaydi':'Enerji kaydı',
  'ays.core.kingarac.gunun-enerji-duzeyini-1-5-ve':'Günün enerji düzeyini (1-5) ve his notunu kaydeder.',
  'ays.core.kingarac.eski-enerji':'Eski enerji: ',
  'ays.core.kingarac.yeni-enerji':'Yeni enerji: ',
  'ays.core.kingarac.enerji-kaydedildi':'Enerji kaydedildi: ',
  'ays.core.kingarac.etkinlik-mesgale-ekle':'Etkinlik / meşgale ekle',
  'ays.core.kingarac.mesgale-kataloguna-yeni-mola':'Meşgale kataloğuna yeni mola etkinliği ekler ya da günceller.',
  'ays.core.kingarac.sure':'Süre: ',
  'ays.core.kingarac.yeni-etkinlik':'Yeni Etkinlik',
  'ays.core.kingarac.etkinlik-kaydedildi':'Etkinlik kaydedildi: «',
  'ays.core.kingarac.haftalik-degerlendirme':'Haftalık değerlendirme',
  'ays.core.kingarac.bir-program-haftasinin-pazar':'Bir program haftasının pazar değerlendirmesini kaydeder.',
  'ays.core.kingarac.hafta':'Hafta ',
  'ays.core.kingarac.hafta-2':'Hafta: ',
  'ays.core.kingarac.not':'Not: ',
  'ays.core.kingarac.puan':'Puan: ',
  'ays.core.kingarac.tekrar-karti':'Tekrar kartı',
  'ays.core.kingarac.tekrar-karti-ekler-gunceller':'Tekrar kartı ekler, günceller ya da siler.',
  'ays.core.kingarac.tekrar-karti-silinecek':'Tekrar kartı silinecek.',
  'ays.core.kingarac.on':'Ön: ',
  'ays.core.kingarac.arka':'Arka: ',
  'ays.core.kingarac.tekrar-karti-guncellenecek':'Tekrar kartı güncellenecek.',
  'ays.core.kingarac.tekrar-karti-eklenecek':'Tekrar kartı eklenecek: «',
  'ays.core.kingarac.kart-silindi':'Kart silindi.',
  'ays.core.kingarac.kart-guncellendi':'Kart güncellendi.',
  'ays.core.kingarac.kart-eklendi':'Kart eklendi.',
  'ays.core.kingarac.konu-durumu':'Konu durumu',
  'ays.core.kingarac.bir-konunun-calisma-ve-kapan':'Bir konunun çalışma ve kapanış durumunu (not_started, provisional, practicing, closed) ayarlar.',
  'ays.core.kingarac.eski-durum':'Eski durum: ',
  'ays.core.kingarac.konu-durumu-guncellendi':'Konu durumu güncellendi: ',
  'ays.core.kingarac.dikkat-dagilmasi-ekle':'Dikkat dağılması ekle',
  'ays.core.kingarac.gunun-odak-sayacina-dikkat-d':'Günün odak sayacına dikkat dağılması / bölünme çentiği ekler.',
  'ays.core.kingarac.su-anki-bolunme-sayisi':'Şu anki bölünme sayısı: ',
  'ays.core.kingarac.dikkat-dagilmasi-kaydedildi':'Dikkat dağılması kaydedildi (',
  'ays.core.kingarac.mola-kaydet':'Mola kaydet',
  'ays.core.kingarac.gunun-kaydina-verilen-bir-mo':'Günün kaydına verilen bir molayı ve süresini kaydeder.',
  'ays.core.kingarac.mola-kaydedildi':'Mola kaydedildi (',
  'ays.core.kingarac.profil-kaydet-guncelle':'Profil kaydet / güncelle',
  'ays.core.kingarac.profil-ayarlarini-gunceller':'Profil ayarlarını günceller ya da cihaza yeni aday profili ekler.',
  'ays.core.kingarac.yeni-aday-profili-eklenecek':'Yeni aday profili eklenecek: «',
  'ays.core.kingarac.yeni-profil':'Yeni profil',
  'ays.core.kingarac.profil-adi':'Profil adı: ',
  'ays.core.kingarac.profil-ayarlari-guncellenece':'Profil ayarları güncellenecek.',
  'ays.core.kingarac.ad':'Ad: ',
  'ays.core.kingarac.alan':'Alan: ',
  'ays.core.kingarac.hedef-sira':'Hedef sıra: ',
  'ays.core.kingarac.uyku-hedefi':'Uyku hedefi: ',
  'ays.core.kingarac.koc-tonu':'Koç tonu: ',
  'ays.core.kingarac.yeni-profil-eklendi':'Yeni profil eklendi: «',
  'ays.core.kingarac.profil-guncellendi':'Profil güncellendi.',
  'ays.core.kingarac.cihazda-kayitli-aday-profill':'Cihazda kayıtlı aday profillerini ve gözetmen özetlerini listeler.',
  'ays.core.kingarac.kayitli-profil-yok':'Kayıtlı profil yok.',
  'ays.core.kingarac.takvim-istisnasi':'Takvim istisnası',
  'ays.core.kingarac.takvime-tatil-okul-sinavi-yo':'Takvime tatil, okul sınavı, yoğun gün gibi istisnaları ekler, günceller ya da siler.',
  'ays.core.kingarac.takvim-kaydi-silinecek':'Takvim kaydı silinecek.',
  'ays.core.kingarac.takvim-kaydi-guncellenecek':'Takvim kaydı güncellenecek.',
  'ays.core.kingarac.takvim-istisnasi-kaydedilece':'Takvim istisnası kaydedilecek.',
  'ays.core.kingarac.takvim-kaydi-silindi':'Takvim kaydı silindi.',
  'ays.core.kingarac.takvim-kaydi-guncellendi':'Takvim kaydı güncellendi.',
  'ays.core.kingarac.takvim-istisnasi-kaydedildi':'Takvim istisnası kaydedildi.',
  'ays.core.kingarac.telafi-protokolu':'Telafi protokolü',
  'ays.core.kingarac.telafi-protokolunu-hastalik':'Telafi protokolünü (hastalık, kopma, deneme düşüşü vb.) günceller ya da başlatır.',
  'ays.core.kingarac.durum':'Durum: ',
  'ays.core.kingarac.sonuc':'Sonuç: ',
  'ays.core.kingarac.telafi-protokolu-guncellendi':'Telafi protokolü güncellendi.',
  'ays.core.kingarac.video-ders-notu':'Video / ders notu',
  'ays.core.kingarac.video-ders-notu-ekler-guncel':'Video ders notu ekler, günceller ya da siler.',
  'ays.core.kingarac.video-notu-silinecek':'Video notu silinecek: «',
  'ays.core.kingarac.baslik':'Başlık: ',
  'ays.core.kingarac.video-notu-guncellenecek':'Video notu güncellenecek.',
  'ays.core.kingarac.video-notu-kaydedilecek':'Video notu kaydedilecek: «',
  'ays.core.kingarac.basliksiz-not':'Başlıksız not',
  'ays.core.kingarac.ders':'Ders: ',
  'ays.core.kingarac.video-notu-silindi':'Video notu silindi.',
  'ays.core.kingarac.video-notu-guncellendi':'Video notu güncellendi.',
  'ays.core.kingarac.yeni-video-notu':'Yeni Video Notu',
  'ays.core.kingarac.video-notu-kaydedildi':'Video notu kaydedildi.',
  'ays.core.kingarac.yanlis-defteri':'Yanlış defteri',
  'ays.core.kingarac.yanlis-defterine-soru-hatasi':'Yanlış defterine soru hatası ekler, günceller ya da siler.',
  'ays.core.kingarac.yanlis-kaydi-silinecek':'Yanlış kaydı silinecek.',
  'ays.core.kingarac.yanlis-kaydi-guncellenecek':'Yanlış kaydı güncellenecek.',
  'ays.core.kingarac.neden':'Neden: ',
  'ays.core.kingarac.yanlis-defterine-kayit-yazil':'Yanlış defterine kayıt yazılacak.',
  'ays.core.kingarac.yanlis-kaydi-silindi':'Yanlış kaydı silindi.',
  'ays.core.kingarac.yanlis-kaydi-guncellendi':'Yanlış kaydı güncellendi.',
  'ays.core.kingarac.yanlis-kaydi-eklendi':'Yanlış kaydı eklendi.',
});


window.R = window.R || {};

R.KingArac = (function(){
  'use strict';

  const PARAM_ACIKLAMA = {
    subjectId:'ders kimliği (ays_konular aracındaki dersId)', topicId:'konu kimliği (ays_konular)',
    minutes:'dakika', dakika:'dakika', limit:'en çok kaç tane', errorId:'yanlış kaydının kimliği (ays_hatalar)',
    weekN:'program haftasının numarası (ays_durum_ozeti: programHaftasi)', questionTarget:'haftalık soru hedefi',
    decisionId:'kararın kimliği', state:'yapildi ya da devredildi', from:'başlangıç günü (YYYY-AA-GG)', to:'bitiş günü (YYYY-AA-GG)',
    bolum:'bölümün kimliği', acik:'1 aç, 0 gizle', hedefId:'hedefin kimliği',
  };
  /* Kural yolu (modelsiz): yalnız sonucu satıra çevrilebilen araçlar. Niyet
     tablosunun sözcüğünü taşıyan cümle («denemelerim» → Deneme sayfası) o
     yoldan gider; burada yalnız sayfası olmayan sorular durur. */
  const ES = {
    puan_tahmini:/(puan tahmin|sıralama tahmin|kaç puan alırım|tahmini puan|kaç bine|sıralamam ne)/,
    hatalar:/(yanlış defterim|hatalar[ıi]m(?:ı| neler)?$|(?:hangi derste|en çok).*yanlış)/,
    /* KING-4 A3 hızlı yol: okuma sorusu sayfa açmaz, araçla cevaplanır. */
    denemeler:/(denemelerim|son deneme|deneme(?:de|lerde|m)? (?:kaç|nasıl)|kaç net)/,
    konu_riski:/(risk altında|riskli konu|konu riski|net (?:kayb|kaçır))/,
    gunler:/((?:bugün|dün)(?: toplam)? kaç (?:dakika|saat|soru)|kaç (?:dakika|saat)(?: ders)? çalıştım|(?:hangi gün|hangi günler) kaç)/,
    konular:/(kapanış yüzde|kapanışım|konularımın durumu|kaç konu|bitirilen konu)/,
    gunun_akisi:/(günün akışı|bugünün akışı)/,
    durum_ozeti:/(sınava (?:kaç gün|ne kadar)|durum özet|genel durum)/,
    kartlar:/((?:tekrar etmem gereken|sırası gelen|geciken) kart|kart borcu)/,
    haftalar:/(?:haftanın|haftalık) review|hafta metni/,
    mesgaleler:/(?:kaç (?:kez|defa)|verilen) mola|mola sayısı/,
    enerji_durumu:/enerji (?:seviye|durum)/,
  };

  const ANAHTAR_OKU = {
    durum_ozeti:'durum özet ilerleme tablo seviye genel görünüm',
    denemeler:'deneme sınav denemeler net netler puan',
    hatalar:'hata yanlış kusur eksik defter soru fire',
    konular:'konu tamamlama bitirme müfredat liste başlık ünite',
    haftalar:'hafta haftalık review değerlendirme bülten geriye dönük',
    gunler:'gün günlük çözülen süre saat dakika soru',
    hedef_ve_net_matrisi:'hedef net matris tablo karşılaştırma ders',
    kartlar:'kart tekrar srs aralıklı ezber hatırlama',
    video_notlari:'video not izleme ders notu kayıt',
    mesgaleler:'meşgale mola kesinti ara duraklama dinlenme',
    enerji_durumu:'enerji yorgunluk zindelik seviye durum güç canlılık',
    gunun_akisi:'akış gün akışı program sıra plan çizelge',
    konu_riski:'risk tehlike net kayıp zayıf açık tehdit',
    puan_tahmini:'puan sıralama derece başarı sıra bant tahmin',
  };

  const REQUIRED = {
    'week-target':['questionTarget'],
    'gunluk-sure':['dakika'],
    'gecici-sure':['from', 'to', 'dakika'],
    'ara-ver':['from', 'to'],
    'bolum-ac-kapa':['bolum', 'acik'],
    'topic-review':['topicId'],
    'decision-close':['decisionId'],
  };

  const ANAHTAR_YAZ = {
    'week-target':'haftalık soru hedefi güncelle sayı hafta hedef',
    'gunluk-sure':'günlük temel çalışma süresi dakika saat süre hedef',
    'gecici-sure':'geçici günlük süre kısalt düşür saat dakika',
    'ara-ver':'ara mola tatil dinlenme ver tanımla izin',
    'bolum-ac-kapa':'bölüm gizle aç göster kapat kaldır modül',
    'topic-review':'konu tekrar gözden geçirme çalışılacak pekiştirme',
    'cards-due-today':'vade geciken geçmiş kart tekrar srs borç',
    'decision-close':'toplantı karar kapat yapıldı devredildi ofis patron',
    'block-add':'blok ekle çalışma oturum süre bugün',
    'card-from-error':'yanlış hata kart üret çıkar',
    'hedef-plan':'hedef plan uygula başlat',
  };

  /* Geçmiş zamanlı kayıt cümlesi («10 dk mola verdim») plan komutu değildir (komut.js ZAMAN KİPİ). */
  const kayitDegilse = f => (t, metin) => {
    const A = window.LIFEOS && window.LIFEOS.ARAC;
    return A && A.niyetSinif && A.niyetSinif(metin) === null ? null : f(t, metin);
  };
  const KURAL_EYLEM = {
    'week-target':(t, metin) => {
      const r = R.Komut ? R.Komut.anla(metin) : null;
      const o = r && (r.oneriler || []).find(x => x.action === 'week-target');
      return o ? o.params : null;
    },
    'gunluk-sure':(t, metin) => {
      const r = R.Komut ? R.Komut.anla(metin) : null;
      const o = r && (r.oneriler || []).find(x => x.action === 'gunluk-sure');
      return o ? o.params : null;
    },
    'gecici-sure':(t, metin) => {
      const r = R.Komut ? R.Komut.anla(metin) : null;
      const o = r && (r.oneriler || []).find(x => x.action === 'gecici-sure');
      return o ? o.params : null;   // miktarsız «kısalt» uydurulmaz; King sorar
    },
    'ara-ver':(t, metin) => {
      const r = R.Komut ? R.Komut.anla(metin) : null;
      const o = r && (r.oneriler || []).find(x => x.action === 'ara-ver');
      return o ? o.params : null;
    },
    'bolum-ac-kapa':(t, metin) => {
      if(/ekran|sayfa/.test(t)) return null;
      if(/aç|göster/.test(t) && !/bölüm|bolum|tekrar|geri/.test(t)) return null;
      const r = R.Komut ? R.Komut.anla(metin) : null;
      const o = r && (r.oneriler || []).find(x => x.action === 'bolum-ac-kapa');
      return o ? o.params : null;
    },
    'topic-review':(t, metin) => {
      if(/(tekrar(?:a|\s+çalışılacaklar[ae]|\s+listesine)?\s*(?:al|ekle)|tekrara)/.test(t)){
        const k = R.Entry && R.Entry.konuBul ? R.Entry.konuBul(metin) : null;
        if(k) return { subjectId:(k.s && k.s.id) || '', topicId:(k.t && k.t.id) || '' };
      }
      return null;
    },
    'cards-due-today':(t) => {
      if(/(vadesi geçmiş|geciken|vadesi dolan).*kart.*(?:bugüne|aktar|çek)|kartları bugüne (?:aktar|çek)/.test(t)){
        return { limit:20 };
      }
      return null;
    },
    'decision-close':(t) => {
      if(/(toplantı\s+)?karar[ıi]n[ıi]\s*(?:yapıldı|devredildi|kapandı)?\s*(?:olarak\s*)?işaretle|kararı kapat/.test(t)){
        /* Yalnız TEK açık karar varsa o; yoksa ya da birden çoksa tahmin yok. */
        const acik = R.Office && R.Office.openDecisions ? R.Office.openDecisions() : [];
        if(acik.length !== 1) return null;
        return { decisionId:acik[0].id, state:/devredildi/.test(t) ? 'devredildi' : 'yapildi' };
      }
      return null;
    },
  };
  const n2 = v => v == null ? 'veri yok' : String(v).replace('.', ',');
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').trim();
  const render = () => { if(R.App && R.App.render) R.App.render(); };

  function satirlar(ad, s){
    if(!s || typeof s !== 'object') return null;
    if(ad === 'denemeler' && Array.isArray(s)){
      return s.length ? s.slice(0, 6).map(e => e.tarih + ' · ' + (e.aile || e.tur || '') + ' · ' + n2(e.toplamNet) + ' net') : [yz('ays.core.kingarac.kayitli-deneme-yok')];
    }
    if(ad === 'puan_tahmini'){
      if(!s.yeterliVeri) return [s.gerekce || yz('ays.core.kingarac.tahmin-icin-yeterli-deneme-y')];
      return [yz('ays.core.kingarac.tahmini-puan-bandi') + n2(s.puanBandi && s.puanBandi[0]) + '–' + n2(s.puanBandi && s.puanBandi[1]),
        yz('ays.core.kingarac.sira-bandi') + n2(s.tahminiSiraBandi && s.tahminiSiraBandi[0]) + '–' + n2(s.tahminiSiraBandi && s.tahminiSiraBandi[1]),
        s.uyari || ''].filter(Boolean);
    }
    if(ad === 'hatalar'){
      const d = s.dagilim || [];
      return d.length ? d.map(x => x.ad + ': ' + x.adet) : [yz('ays.core.kingarac.yanlis-defterinde-kayit-yok')];
    }
    return null;
  }

  function okuma(){
    const T = R.Tools;
    if(!T || !Array.isArray(T.TOOLS)) return [];
    return T.TOOLS.map(t => ({
      ad:'ays_' + t.name, tur:'oku', aciklama:t.description, es:ES[t.name] || undefined,
      anahtar:ANAHTAR_OKU[t.name] || undefined,
      parametreler:t.inputSchema && Object.keys(t.inputSchema.properties || {}).length ? t.inputSchema : undefined,
      calistir:p => {
        const ham = t.execute(p || {});
        const sonuc = ham === undefined ? { sonuc:'veri yok' } : T.sanitize(ham);
        return { sonuc, satirlar:satirlar(t.name, sonuc) };
      },
    }));
  }

  function satir(r){
    const a = r.label || r.alan || '', o = r.before != null ? r.before : r.once, s = r.after != null ? r.after : r.sonra;
    return a + ': ' + (o == null || o === '' ? '—' : o) + ' → ' + (s == null || s === '' ? '—' : s);
  }

  function yazma(){
    return (R.ACTIONS || []).filter(a => !a.modelYok && !a.olcum).map(def => {
      const props = {};
      Object.keys(def.params || {}).forEach(k => {
        const tip = def.params[k] === 'number' ? (k === 'acik' ? 'integer' : 'number') : 'string';
        props[k] = Object.assign({ type:tip }, PARAM_ACIKLAMA[k] ? { description:PARAM_ACIKLAMA[k] } : {},
          k === 'acik' ? { enum:[0, 1] } : {}, k === 'state' ? { enum:['yapildi', 'devredildi'] } : {});
      });
      const parametreler = Object.keys(props).length ? { type:'object', properties:props } : undefined;
      if(parametreler && REQUIRED[def.id]) parametreler.required = REQUIRED[def.id].slice();
      return {
        ad:'ays_' + def.id.replace(/-/g, '_'), tur:'yaz', seviye:def.level, ozetAd:def.title,
        aciklama:def.title + '. ' + def.summary + ' (Onaylar’daki öneriyle aynı eylem; önizlenir, onayla uygulanır.)',
        parametreler,
        anahtar:ANAHTAR_YAZ[def.id] || undefined,
        kural:KURAL_EYLEM[def.id] ? kayitDegilse(KURAL_EYLEM[def.id]) : undefined,
        onizle:p => {
          const pr = R.Proposals.preview({ action:def.id, params:p, agent:def.agents[0] });
          if(!pr.ok) return { hata:pr.why || 'uygulanamaz' };
          return { metin:def.title + ': ' + def.summary, satirlar:(pr.rows || []).map(satir) };
        },
        uygula:async p => {
          const r = await R.Proposals.hemen({ action:def.id, params:p, reason:yz('ays.core.kingarac.king-sohbetinde-istendi') });
          if(!r || !r.ok) return { ok:false, metin:yz('ays.core.kingarac.uygulanamadi') + ((r && r.why) || 'bilinmeyen neden') + '.' };
          render();
          const id = r.row && r.row.id;
          return { metin:def.title + ': uygulandı.', geriAl:id ? async () => { await R.Proposals.undo(id); render(); } : null };
        },
      };
    });
  }

  /* ---------- Tek yardımcı: arama ve tekil eşleşme denetimi ---------- */

  function bul(liste, p, alanlar, ad){
    if(!p) return { hata:ad + ' kimliği ya da adı belirtilmedi.' };
    const l = liste || [];
    if(p.id){
      const k = l.find(x => x.id === p.id);
      if(!k) return { hata:'«' + p.id + '» kimlikli ' + ad + ' bulunamadı.' };
      return { kayit:k };
    }
    const aranan = p.ad || p.on || p.baslik || p.not || p.konu || alanlar.map(f => p[f]).filter(Boolean).join(' ');
    if(aranan){
      const k = kucuk(aranan);
      const bulunan = l.filter(x => {
        const metin = alanlar.map(f => x[f] || '').join(' ');
        return kucuk(metin).indexOf(k) >= 0;
      });
      if(!bulunan.length) return { hata:'«' + aranan + '» ile eşleşen ' + ad + ' bulunamadı.' };
      if(bulunan.length > 1) return { hata:yz('ays.core.kingarac.birden-cok') + ad + ' eşleşti (' + bulunan.length + ' adet); lütfen id belirtin.' };
      return { kayit:bulunan[0] };
    }
    return { hata:ad + ' kimliği ya da adı belirtilmedi.' };
  }

  /* ---------- Model işlevlerini doğrudan çağıran araçlar (KING-4 A2) ---------- */

  function modelAraclari(){
    return [
      /* 1. ays_deneme */
      {
        ad:'ays_deneme', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.deneme-kaydi'),
        aciklama:yz('ays.core.kingarac.deneme-sinavini-kaydeder-gun'),
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'deneme kimliği' },
            ad:{ type:'string', maxLength:100, description:'deneme adı ya da yayıncısı (arama ve silme için)' },
            tarih:{ type:'string', maxLength:10, description:'tarih (YYYY-AA-GG)' },
            tur:{ type:'string', maxLength:40, description:'sınav türü (TYT, AYT, YDT)' },
            yayinci:{ type:'string', maxLength:80, description:'yayıncı / deneme adı' },
            testAdi:{ type:'string', maxLength:60, description:'test adı (Türkçe, Matematik vb.)' },
            dogru:{ type:'integer', minimum:0, maximum:160, description:'doğru sayısı' },
            yanlis:{ type:'integer', minimum:0, maximum:160, description:'yanlış sayısı' },
            bos:{ type:'integer', minimum:0, maximum:160, description:'boş sayısı' },
            net:{ type:'number', minimum:0, maximum:160, description:'net sayısı (eklemede tek başına kabul edilmez)' },
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.exams, p, ['publisher', 'type'], 'deneme');
            if(b.hata) return { hata:b.hata };
            const ex = b.kayit;
            return { metin:'«' + (ex.publisher || ex.type || 'Deneme') + '» denemesi silinecek.',
              satirlar:[ex.date + ' · ' + (ex.type || '') + ' · net: ' + (R.Model.examNet ? R.Model.examNet(ex) : '—')] };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.exams, p, ['publisher', 'type'], 'deneme');
            if(b.hata) return { hata:b.hata };
            const ex = b.kayit;
            return { metin:'«' + (ex.publisher || ex.type || 'Deneme') + '» denemesi güncellenecek.',
              satirlar:[yz('ays.core.kingarac.tarih') + (p.tarih || ex.date), yz('ays.core.kingarac.yayinci') + (p.yayinci || ex.publisher || '—')] };
          }
          if(p.islem === 'ekle'){
            if(p.dogru == null || p.yanlis == null || p.bos == null){
              return { hata:yz('ays.core.kingarac.deneme-eklemek-icin-dogru-ya') };
            }
            const testAdi = p.testAdi || 'Genel';
            const net = Number(p.dogru) - Number(p.yanlis) / 4;
            return { metin:yz('ays.core.kingarac.deneme-kaydedilecek') + (p.yayinci || p.tur || 'TYT'),
              satirlar:[yz('ays.core.kingarac.tarih') + (p.tarih || R.U.todayISO()), yz('ays.core.kingarac.tur') + (p.tur || 'TYT'),
                yz('ays.core.kingarac.test') + testAdi + ' (D:' + p.dogru + ' Y:' + p.yanlis + ' B:' + p.bos + ' · net: ' + net + ')'] };
          }
          return { hata:yz('ays.core.kingarac.gecersiz-islem') + p.islem };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.exams, p, ['publisher', 'type'], 'deneme');
            if(b.hata) return { ok:false, metin:b.hata };
            const ex = b.kayit;
            const bagli = (R.S.errors || []).filter(e => e.examId === ex.id);
            await R.Model.deleteExam(ex.id);
            render();
            return { metin:yz('ays.core.kingarac.deneme-silindi'), geriAl:async () => {
              await R.Model.saveExam(ex);
              for(const item of bagli) await R.Model.saveError(item);
              render();
            }};
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.exams, p, ['publisher', 'type'], 'deneme');
            if(b.hata) return { ok:false, metin:b.hata };
            const ex = b.kayit;
            const eski = JSON.parse(JSON.stringify(ex));
            if(p.tarih) ex.date = p.tarih;
            if(p.tur) ex.type = p.tur;
            if(p.yayinci) ex.publisher = p.yayinci;
            await R.Model.saveExam(ex);
            render();
            return { metin:yz('ays.core.kingarac.deneme-guncellendi'), geriAl:async () => { await R.Model.saveExam(eski); render(); } };
          }
          if(p.islem === 'ekle'){
            if(p.dogru == null || p.yanlis == null || p.bos == null){
              return { ok:false, metin:yz('ays.core.kingarac.deneme-eklemek-icin-dogru-ya') };
            }
            const testAdi = p.testAdi || 'Genel';
            const exam = {
              id:p.id || R.U.uid('e'),
              date:p.tarih || R.U.todayISO(),
              type:p.tur || 'TYT',
              publisher:p.yayinci || p.ad || 'Deneme',
              tests:[{ name:testAdi, correct:Number(p.dogru), wrong:Number(p.yanlis), blank:Number(p.bos), blankCert:'measured' }],
              createdAt:new Date().toISOString(),
            };
            await R.Model.saveExam(exam);
            render();
            return { metin:yz('ays.core.kingarac.deneme-kaydedildi'), geriAl:async () => { await R.Model.deleteExam(exam.id); render(); } };
          }
          return { ok:false, metin:yz('ays.core.kingarac.gecersiz-islem') + p.islem };
        }
      },

      /* 2. ays_enerji */
      {
        ad:'ays_enerji', tur:'yaz', seviye:'kucuk', ozetAd:yz('ays.core.kingarac.enerji-kaydi'),
        aciklama:yz('ays.core.kingarac.gunun-enerji-duzeyini-1-5-ve'),
        parametreler:{
          type:'object',
          properties:{
            enerji:{ type:'integer', minimum:1, maximum:5, description:'enerji seviyesi (1-5)' },
            tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' },
            not:{ type:'string', maxLength:200, description:'enerji / his notu' }
          },
          required:['enerji']
        },
        onizle:p => {
          const d = p.tarih || R.U.todayISO();
          const eski = R.Model.moodOf(d);
          return { metin:d + ' için enerji ' + p.enerji + '/5 olarak kaydedilecek.',
            satirlar:[yz('ays.core.kingarac.eski-enerji') + (eski && eski.energy != null ? eski.energy + '/5' : 'veri yok'),
              yz('ays.core.kingarac.yeni-enerji') + p.enerji + '/5' + (p.not ? ' · ' + p.not : '')] };
        },
        uygula:async p => {
          const d = p.tarih || R.U.todayISO();
          const eski = R.Model.moodOf(d) ? Object.assign({}, R.Model.moodOf(d)) : null;
          await R.Model.saveMood(d, { energy:p.enerji, note:p.not || '' });
          render();
          return { metin:yz('ays.core.kingarac.enerji-kaydedildi') + p.enerji + '/5.', geriAl:async () => {
            if(eski) await R.Model.saveMood(d, eski);
            else { delete R.S.mood[d]; await R.Store.remove('mood/' + d); }
            render();
          }};
        }
      },

      /* 3. ays_etkinlik */
      {
        ad:'ays_etkinlik', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.etkinlik-mesgale-ekle'),
        aciklama:yz('ays.core.kingarac.mesgale-kataloguna-yeni-mola'),
        parametreler:{
          type:'object',
          properties:{
            ad:{ type:'string', maxLength:60, description:'etkinlik adı' },
            dakika:{ type:'integer', minimum:1, maximum:120, description:'tipik süre (dakika)' },
            enerji:{ type:'string', enum:['low', 'mid', 'high'], description:'enerji seviyesi' },
            tur:{ type:'string', enum:['beden', 'zihin', 'yaratici', 'sosyal', 'dinlenme'], description:'etkinlik türü' },
            not:{ type:'string', maxLength:200, description:'açıklama / ipucu notu' },
            id:{ type:'string', maxLength:40, description:'etkinlik kimliği' }
          }
        },
        onizle:p => {
          const id = p && p.id;
          const eski = id ? (R.S.activities || []).find(a => a.id === id) : null;
          const ad = (p && p.ad) || (eski && eski.name) || 'Etkinlik';
          const dk = (p && p.dakika) || (eski && eski.minutes) || 10;
          const en = (p && p.enerji) || (eski && eski.energy) || 'low';
          const tur = (p && p.tur) || (eski && eski.kind) || 'dinlenme';
          return {
            metin:'«' + ad + '» etkinliği ' + (eski ? 'güncellenecek.' : 'kataloğa kaydedilecek.'),
            satirlar:[yz('ays.core.kingarac.sure') + dk + ' dk · Enerji: ' + en + ' · Tür: ' + tur]
          };
        },
        uygula:async p => {
          const id = (p && p.id) || R.U.uid('act');
          const i = (R.S.activities || []).findIndex(a => a.id === id);
          const eski = i >= 0 ? Object.assign({}, R.S.activities[i]) : null;
          const patch = { custom:true };
          if(p && p.ad) patch.name = p.ad;
          if(p && p.dakika) patch.minutes = p.dakika;
          if(p && p.enerji) patch.energy = p.enerji;
          if(p && p.tur) patch.kind = p.tur;
          if(p && p.not != null) patch.note = p.not;
          const varsayilan = { id, name:(p && p.ad) || yz('ays.core.kingarac.yeni-etkinlik'), minutes:(p && p.dakika) || 10, energy:(p && p.enerji) || 'low', kind:(p && p.tur) || 'dinlenme', note:(p && p.not) || '' };
          const rec = Object.assign(varsayilan, eski || {}, patch);
          await R.Model.saveActivity(rec);
          render();
          return { metin:yz('ays.core.kingarac.etkinlik-kaydedildi') + rec.name + '».', geriAl:async () => {
            if(eski) await R.Model.saveActivity(eski);
            else { R.S.activities = (R.S.activities || []).filter(a => a.id !== id); await R.Store.remove('activities/' + id); }
            render();
          }};
        }
      },

      /* 4. ays_hafta_degerlendirme */
      {
        ad:'ays_hafta_degerlendirme', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.haftalik-degerlendirme'),
        aciklama:yz('ays.core.kingarac.bir-program-haftasinin-pazar'),
        parametreler:{
          type:'object',
          properties:{
            hafta:{ type:'integer', minimum:1, maximum:60, description:'program haftası numarası' },
            not:{ type:'string', maxLength:1000, description:'değerlendirme notu' },
            puan:{ type:'integer', minimum:1, maximum:5, description:'hafta puanı (1-5)' }
          },
          required:['hafta']
        },
        onizle:p => {
          const n = p.hafta || R.Model.currentWeek();
          return { metin:yz('ays.core.kingarac.hafta') + n + ' değerlendirmesi kaydedilecek.',
            satirlar:[yz('ays.core.kingarac.hafta-2') + n, yz('ays.core.kingarac.not') + (p.not || '—'), yz('ays.core.kingarac.puan') + (p.puan ? p.puan + '/5' : 'belirtilmedi')] };
        },
        uygula:async p => {
          const n = p.hafta || R.Model.currentWeek();
          const id = R.Model.weekId(n);
          const eski = R.S.reviews[id] ? Object.assign({}, R.S.reviews[id]) : null;
          const data = Object.assign({}, eski || {}, { note:p.not || (eski && eski.note) || '', rating:p.puan || (eski && eski.rating) || null, updatedAt:new Date().toISOString() });
          await R.Model.saveReview(n, data);
          render();
          return { metin:yz('ays.core.kingarac.hafta') + n + ' değerlendirmesi kaydedildi.', geriAl:async () => {
            if(eski) await R.Model.saveReview(n, eski);
            else { delete R.S.reviews[id]; await R.Store.remove('reviews/' + id); }
            render();
          }};
        }
      },

      /* 5. ays_kart */
      {
        ad:'ays_kart', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.tekrar-karti'),
        aciklama:yz('ays.core.kingarac.tekrar-karti-ekler-gunceller'),
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'kart kimliği' },
            on:{ type:'string', maxLength:500, description:'kartın ön yüzü (soru / kavram)' },
            arka:{ type:'string', maxLength:1000, description:'kartın arka yüzü (cevap / açıklama)' },
            konu:{ type:'string', maxLength:100, description:'konu adı' },
            dersId:{ type:'string', maxLength:30, description:'ders kimliği' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.cards, p, ['front'], 'kart');
            if(b.hata) return { hata:b.hata };
            const c = b.kayit;
            return { metin:yz('ays.core.kingarac.tekrar-karti-silinecek'), satirlar:[yz('ays.core.kingarac.on') + c.front, yz('ays.core.kingarac.arka') + (c.back || '—')] };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.cards, p, ['front'], 'kart');
            if(b.hata) return { hata:b.hata };
            const c = b.kayit;
            return { metin:yz('ays.core.kingarac.tekrar-karti-guncellenecek'), satirlar:[yz('ays.core.kingarac.on') + (p.on || c.front), yz('ays.core.kingarac.arka') + (p.arka || c.back || '—')] };
          }
          return { metin:yz('ays.core.kingarac.tekrar-karti-eklenecek') + (p.on || '') + '»', satirlar:[yz('ays.core.kingarac.on') + (p.on || '—'), yz('ays.core.kingarac.arka') + (p.arka || '—')] };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.cards, p, ['front'], 'kart');
            if(b.hata) return { ok:false, metin:b.hata };
            const c = b.kayit;
            await R.Model.deleteCard(c.id);
            render();
            return { metin:yz('ays.core.kingarac.kart-silindi'), geriAl:async () => { await R.Model.saveCard(c); render(); } };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.cards, p, ['front'], 'kart');
            if(b.hata) return { ok:false, metin:b.hata };
            const c = b.kayit;
            const eski = Object.assign({}, c);
            if(p.on) c.front = p.on;
            if(p.arka) c.back = p.arka;
            if(p.konu) c.topic = p.konu;
            if(p.dersId) c.subjectId = p.dersId;
            await R.Model.saveCard(c);
            render();
            return { metin:yz('ays.core.kingarac.kart-guncellendi'), geriAl:async () => { await R.Model.saveCard(eski); render(); } };
          }
          const c = R.Model.newCard({ front:p.on || '', back:p.arka || '', topic:p.konu || '', subjectId:p.dersId || null });
          await R.Model.saveCard(c);
          render();
          return { metin:yz('ays.core.kingarac.kart-eklendi'), geriAl:async () => { await R.Model.deleteCard(c.id); render(); } };
        }
      },

      /* 6. ays_konu_durumu */
      {
        ad:'ays_konu_durumu', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.konu-durumu'),
        aciklama:yz('ays.core.kingarac.bir-konunun-calisma-ve-kapan'),
        parametreler:{
          type:'object',
          properties:{
            dersId:{ type:'string', maxLength:30, description:'ders kimliği (mat_tyt, fiz_ayt vb.)' },
            konuId:{ type:'string', maxLength:50, description:'konu kimliği' },
            durum:{ type:'string', enum:['not_started', 'provisional', 'practicing', 'closed'], description:'konu durumu' },
            not:{ type:'string', maxLength:200, description:'konu notu' }
          },
          required:['dersId', 'konuId', 'durum']
        },
        onizle:p => {
          const cur = R.Model.topicState(p.dersId, p.konuId);
          return { metin:p.dersId + ' › ' + p.konuId + ' durumu değiştirilecek.',
            satirlar:[yz('ays.core.kingarac.eski-durum') + (cur.state || 'not_started') + ' → Yeni durum: ' + p.durum] };
        },
        uygula:async p => {
          const cur = Object.assign({}, R.Model.topicState(p.dersId, p.konuId));
          await R.Model.setTopicState(p.dersId, p.konuId, { state:p.durum, note:p.not || cur.note || '' });
          render();
          return { metin:yz('ays.core.kingarac.konu-durumu-guncellendi') + p.durum + '.', geriAl:async () => {
            await R.Model.setTopicState(p.dersId, p.konuId, cur);
            render();
          }};
        }
      },

      /* 7. ays_mesgale_ekle */
      {
        ad:'ays_mesgale_ekle', tur:'yaz', seviye:'kucuk', ozetAd:yz('ays.core.kingarac.dikkat-dagilmasi-ekle'),
        aciklama:yz('ays.core.kingarac.gunun-odak-sayacina-dikkat-d'),
        parametreler:{
          type:'object',
          properties:{
            tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' }
          }
        },
        onizle:p => {
          const d = (p && p.tarih) || R.U.todayISO();
          const day = R.S.days[d];
          const count = (day && day.distractions) || 0;
          return { metin:d + ' için dikkat dağılması çentiği eklenecek.',
            satirlar:[yz('ays.core.kingarac.su-anki-bolunme-sayisi') + count + ' → ' + (count + 1)] };
        },
        uygula:async p => {
          const d = (p && p.tarih) || R.U.todayISO();
          await R.Model.ensureDay(d);
          const day = R.S.days[d];
          const eski = day.distractions || 0;
          const eskiTracked = day.distractionsTracked;
          await R.Model.addDistraction(d);
          render();
          return { metin:yz('ays.core.kingarac.dikkat-dagilmasi-kaydedildi') + (eski + 1) + ').', geriAl:async () => {
            day.distractions = eski;
            day.distractionsTracked = eskiTracked;
            await R.Model.saveDay(d);
            render();
          }};
        }
      },

      /* 8. ays_mola */
      {
        ad:'ays_mola', tur:'yaz', seviye:'kucuk', ozetAd:yz('ays.core.kingarac.mola-kaydet'),
        aciklama:yz('ays.core.kingarac.gunun-kaydina-verilen-bir-mo'),
        parametreler:{
          type:'object',
          properties:{
            dakika:{ type:'integer', minimum:1, maximum:120, description:'mola süresi (dakika)' },
            etkinlikId:{ type:'string', maxLength:40, description:'yapılan etkinliğin kimliği' },
            tarih:{ type:'string', maxLength:10, description:'gün (YYYY-AA-GG); boşsa bugün' }
          }
        },
        onizle:p => {
          const min = (p && p.dakika) || 5;
          return { metin:min + ' dakikalık mola kaydedilecek.',
            satirlar:[yz('ays.core.kingarac.sure') + min + ' dk' + (p && p.etkinlikId ? ' · Etkinlik: ' + p.etkinlikId : '')] };
        },
        uygula:async p => {
          const min = (p && p.dakika) || 5;
          const d = (p && p.tarih) || R.U.todayISO();
          const rec = await R.Model.saveBreak({ dayISO:d, minutes:min, activityId:(p && p.etkinlikId) || null });
          render();
          return { metin:yz('ays.core.kingarac.mola-kaydedildi') + min + ' dk).', geriAl:async () => {
            R.S.breaks = (R.S.breaks || []).filter(b => b.id !== rec.id);
            await R.Store.remove('breaks/' + rec.id);
            render();
          }};
        }
      },

      /* 9. ays_profil */
      {
        ad:'ays_profil', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.profil-kaydet-guncelle'),
        aciklama:yz('ays.core.kingarac.profil-ayarlarini-gunceller'),
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['guncelle', 'yeni_profil'], description:'işlem türü (guncelle ya da yeni_profil)' },
            ad:{ type:'string', maxLength:60, description:'profil / aday adı' },
            sehir:{ type:'string', maxLength:60, description:'şehir' },
            alan:{ type:'string', enum:['SAY', 'EA', 'SOZ', 'DIL'], description:'alan' },
            hedefSira:{ type:'integer', minimum:1, maximum:3000000, description:'hedef sıralama' },
            uykuHedefi:{ type:'number', minimum:4, maximum:12, description:'uyku hedefi (saat)' },
            kocTonu:{ type:'string', enum:['dengeli', 'sert', 'sevecen', 'akademik'], description:'koç üslubu' }
          }
        },
        onizle:p => {
          if(p && p.islem === 'yeni_profil'){
            return { metin:yz('ays.core.kingarac.yeni-aday-profili-eklenecek') + (p.ad || yz('ays.core.kingarac.yeni-profil')) + '»',
              satirlar:[yz('ays.core.kingarac.profil-adi') + (p.ad || yz('ays.core.kingarac.yeni-profil'))] };
          }
          return { metin:yz('ays.core.kingarac.profil-ayarlari-guncellenece'),
            satirlar:[p && p.ad ? yz('ays.core.kingarac.ad') + p.ad : null, p && p.alan ? yz('ays.core.kingarac.alan') + p.alan : null,
              p && p.hedefSira ? yz('ays.core.kingarac.hedef-sira') + p.hedefSira : null, p && p.uykuHedefi ? yz('ays.core.kingarac.uyku-hedefi') + p.uykuHedefi + ' sa' : null,
              p && p.kocTonu ? yz('ays.core.kingarac.koc-tonu') + p.kocTonu : null].filter(Boolean) };
        },
        uygula:async p => {
          if(p && p.islem === 'yeni_profil'){
            const rec = await R.Model.saveProfileEntry({ name:(p && p.ad) || yz('ays.core.kingarac.yeni-profil') });
            render();
            return { metin:yz('ays.core.kingarac.yeni-profil-eklendi') + rec.name + '».', geriAl:async () => {
              R.S.profiles = (R.S.profiles || []).filter(x => x.id !== rec.id);
              await R.Store.remove('profiles/' + rec.id);
              render();
            }};
          }
          const eski = Object.assign({}, R.S.profile);
          if(p && p.ad) R.S.profile.name = p.ad;
          if(p && p.sehir) R.S.profile.city = p.sehir;
          if(p && p.alan) R.S.profile.track = p.alan;
          if(p && p.hedefSira) R.S.profile.targetRank = p.hedefSira;
          if(p && p.uykuHedefi) R.S.profile.sleepTarget = p.uykuHedefi;
          if(p && p.kocTonu) R.S.profile.coachTone = p.kocTonu;
          await R.Model.saveProfile();
          render();
          return { metin:yz('ays.core.kingarac.profil-guncellendi'), geriAl:async () => {
            Object.assign(R.S.profile, eski);
            await R.Model.saveProfile();
            render();
          }};
        }
      },

      /* 10. ays_profiller */
      {
        ad:'ays_profiller', tur:'oku', aciklama:yz('ays.core.kingarac.cihazda-kayitli-aday-profill'),
        ornek:'cihazdaki profiller',
        calistir:() => {
          const list = R.Model.profileList ? R.Model.profileList() : [];
          const active = R.Model.activeProfileId ? R.Model.activeProfileId() : 'main';
          let snaps = {};
          try{ snaps = JSON.parse(localStorage.getItem('rota.snapshots') || '{}'); }catch(e){}
          const profiller = list.map(p => {
            const s = snaps[p.id] || null;
            return { id:p.id, ad:p.name, aktif:p.id === active, olusturma:p.createdAt,
              hafta:s ? s.week : null, tamamlama:s ? s.completion : null, tytMedyan:s ? s.tytMedian : null };
          });
          const satirlar = profiller.length ? profiller.map(p => p.ad + (p.aktif ? ' (açık profil)' : '') + (p.tamamlama != null ? ' · Plan: %' + p.tamamlama : '')) : [yz('ays.core.kingarac.kayitli-profil-yok')];
          return { sonuc:{ profiller, aktifProfil:active }, satirlar };
        }
      },

      /* 11. ays_takvim */
      {
        ad:'ays_takvim', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.takvim-istisnasi'),
        aciklama:yz('ays.core.kingarac.takvime-tatil-okul-sinavi-yo'),
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'takvim kaydının kimliği' },
            tur:{ type:'string', enum:['tatil', 'okulSinavi', 'yogun', 'ekstra'], description:'istisna türü' },
            baslangic:{ type:'string', maxLength:10, description:'başlangıç tarihi (YYYY-AA-GG)' },
            bitis:{ type:'string', maxLength:10, description:'bitiş tarihi (YYYY-AA-GG)' },
            not:{ type:'string', maxLength:200, description:'istisna notu' },
            ad:{ type:'string', maxLength:100, description:'kaydın adı / notu (arama için)' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.calendar, p, ['note', 'kind'], 'takvim kaydı');
            if(b.hata) return { hata:b.hata };
            const c = b.kayit;
            return { metin:yz('ays.core.kingarac.takvim-kaydi-silinecek'), satirlar:[c.from + (c.to && c.to !== c.from ? '–' + c.to : '') + ' · ' + c.kind + (c.note ? ' · ' + c.note : '')] };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.calendar, p, ['note', 'kind'], 'takvim kaydı');
            if(b.hata) return { hata:b.hata };
            const c = b.kayit;
            return { metin:yz('ays.core.kingarac.takvim-kaydi-guncellenecek'), satirlar:[yz('ays.core.kingarac.tarih') + (p.baslangic || c.from), yz('ays.core.kingarac.tur') + (p.tur || c.kind)] };
          }
          const bg = p.baslangic || R.U.todayISO();
          return { metin:yz('ays.core.kingarac.takvim-istisnasi-kaydedilece'),
            satirlar:[yz('ays.core.kingarac.tarih') + bg + (p.bitis && p.bitis !== bg ? '–' + p.bitis : ''), yz('ays.core.kingarac.tur') + (p.tur || 'tatil'), yz('ays.core.kingarac.not') + (p.not || '—')] };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.calendar, p, ['note', 'kind'], 'takvim kaydı');
            if(b.hata) return { ok:false, metin:b.hata };
            const c = b.kayit;
            await R.Model.deleteCalendar(c.id);
            render();
            return { metin:yz('ays.core.kingarac.takvim-kaydi-silindi'), geriAl:async () => { await R.Model.saveCalendar(c); render(); } };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.calendar, p, ['note', 'kind'], 'takvim kaydı');
            if(b.hata) return { ok:false, metin:b.hata };
            const c = b.kayit;
            const eski = Object.assign({}, c);
            if(p.tur) c.kind = p.tur;
            if(p.baslangic) c.from = p.baslangic;
            if(p.bitis) c.to = p.bitis;
            if(p.not != null) c.note = p.not;
            await R.Model.saveCalendar(c);
            render();
            return { metin:yz('ays.core.kingarac.takvim-kaydi-guncellendi'), geriAl:async () => { await R.Model.saveCalendar(eski); render(); } };
          }
          const bg = p.baslangic || R.U.todayISO();
          const doc = { id:p.id || R.U.uid('k'), kind:p.tur || 'tatil', from:bg, to:p.bitis || bg, note:p.not || '' };
          const eklenen = await R.Model.saveCalendar(doc);
          render();
          return { metin:yz('ays.core.kingarac.takvim-istisnasi-kaydedildi'), geriAl:async () => { await R.Model.deleteCalendar(eklenen.id); render(); } };
        }
      },

      /* 12. ays_telafi */
      {
        ad:'ays_telafi', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.telafi-protokolu'),
        aciklama:yz('ays.core.kingarac.telafi-protokolunu-hastalik'),
        parametreler:{
          type:'object',
          properties:{
            id:{ type:'string', maxLength:40, description:'protokol kimliği' },
            protoId:{ type:'string', maxLength:40, description:'protokol tanım kimliği (two-weeks-behind, ayt-late, math-weak, flat-nets)' },
            durum:{ type:'string', enum:['active', 'completed', 'abandoned'], description:'protokol durumu' },
            sonuc:{ type:'string', maxLength:500, description:'protokol sonuç notu' }
          }
        },
        onizle:p => {
          const rec = p && p.id ? (R.S.protocols || []).find(x => x.id === p.id) : ((R.Model.activeProtocols && R.Model.activeProtocols()[0]) || null);
          const def = p && p.protoId ? (R.RECOVERY_PROTOCOLS || []).find(x => x.id === p.protoId) : null;
          const baslik = (rec && rec.title) || (def && def.title) || yz('ays.core.kingarac.telafi-protokolu');
          return { metin:'«' + baslik + '» güncellenecek.',
            satirlar:[yz('ays.core.kingarac.durum') + ((p && p.durum) || (rec && rec.status) || 'active'), (p && p.sonuc) ? yz('ays.core.kingarac.sonuc') + p.sonuc : null].filter(Boolean) };
        },
        uygula:async p => {
          let rec = p && p.id ? (R.S.protocols || []).find(x => x.id === p.id) : null;
          let yeni = false, eski = null;
          if(!rec && p && p.protoId && R.Model.startProtocol){
            const def = (R.RECOVERY_PROTOCOLS || []).find(x => x.id === p.protoId);
            if(!def) return { ok:false, metin:'«' + p.protoId + '» kimlikli protokol tanımı bulunamadı.' };
            rec = await R.Model.startProtocol(p.protoId);
            yeni = true;
          }
          if(!rec && (R.S.protocols || []).length){
            rec = R.S.protocols[0];
          }
          if(rec){
            eski = JSON.parse(JSON.stringify(rec));
            if(p && p.durum) rec.status = p.durum;
            if(p && p.sonuc) rec.outcome = p.sonuc;
            await R.Model.saveProtocol(rec);
          }
          render();
          return { metin:yz('ays.core.kingarac.telafi-protokolu-guncellendi'), geriAl:async () => {
            if(yeni && rec){
              R.S.protocols = (R.S.protocols || []).filter(x => x.id !== rec.id);
              await R.Store.remove('protocols/' + rec.id);
            }else if(eski){
              await R.Model.saveProtocol(eski);
            }
            render();
          }};
        }
      },

      /* 13. ays_video_notu */
      {
        ad:'ays_video_notu', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.video-ders-notu'),
        aciklama:yz('ays.core.kingarac.video-ders-notu-ekler-guncel'),
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'not kimliği' },
            baslik:{ type:'string', maxLength:120, description:'video / not başlığı' },
            url:{ type:'string', maxLength:300, description:'video linki (YouTube vb.)' },
            dersId:{ type:'string', maxLength:30, description:'ders kimliği' },
            konuId:{ type:'string', maxLength:50, description:'konu kimliği' },
            not:{ type:'string', maxLength:2000, description:'not metni / transkript' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.videoNotes, p, ['title'], 'video notu');
            if(b.hata) return { hata:b.hata };
            const n = b.kayit;
            return { metin:yz('ays.core.kingarac.video-notu-silinecek') + n.title + '»', satirlar:[yz('ays.core.kingarac.baslik') + n.title + (n.url ? ' · ' + n.url : '')] };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.videoNotes, p, ['title'], 'video notu');
            if(b.hata) return { hata:b.hata };
            const n = b.kayit;
            return { metin:yz('ays.core.kingarac.video-notu-guncellenecek'), satirlar:[yz('ays.core.kingarac.baslik') + (p.baslik || n.title), 'URL: ' + (p.url || n.url || '—')] };
          }
          return { metin:yz('ays.core.kingarac.video-notu-kaydedilecek') + (p.baslik || yz('ays.core.kingarac.basliksiz-not')) + '»',
            satirlar:[yz('ays.core.kingarac.baslik') + (p.baslik || yz('ays.core.kingarac.basliksiz-not')), p.url ? 'URL: ' + p.url : null, p.dersId ? yz('ays.core.kingarac.ders') + p.dersId : null].filter(Boolean) };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.videoNotes, p, ['title'], 'video notu');
            if(b.hata) return { ok:false, metin:b.hata };
            const n = b.kayit;
            await R.Model.deleteVideoNote(n.id);
            render();
            return { metin:yz('ays.core.kingarac.video-notu-silindi'), geriAl:async () => { await R.Model.saveVideoNote(n); render(); } };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.videoNotes, p, ['title'], 'video notu');
            if(b.hata) return { ok:false, metin:b.hata };
            const n = b.kayit;
            const eski = Object.assign({}, n);
            if(p.baslik) n.title = p.baslik;
            if(p.url) n.url = p.url;
            if(p.not) n.transcript = p.not;
            if(p.dersId) n.subjectId = p.dersId;
            if(p.konuId) n.topicId = p.konuId;
            await R.Model.saveVideoNote(n);
            render();
            return { metin:yz('ays.core.kingarac.video-notu-guncellendi'), geriAl:async () => { await R.Model.saveVideoNote(eski); render(); } };
          }
          const note = R.Model.newVideoNote({
            title:p.baslik || yz('ays.core.kingarac.yeni-video-notu'),
            url:p.url || '',
            subjectId:p.dersId || null,
            topicId:p.konuId || null,
            transcript:p.not || ''
          });
          await R.Model.saveVideoNote(note);
          render();
          return { metin:yz('ays.core.kingarac.video-notu-kaydedildi'), geriAl:async () => { await R.Model.deleteVideoNote(note.id); render(); } };
        }
      },

      /* 14. ays_yanlis */
      {
        ad:'ays_yanlis', tur:'yaz', seviye:'orta', ozetAd:yz('ays.core.kingarac.yanlis-defteri'),
        aciklama:yz('ays.core.kingarac.yanlis-defterine-soru-hatasi'),
        parametreler:{
          type:'object',
          properties:{
            islem:{ type:'string', enum:['ekle', 'guncelle', 'sil'], description:'yapılacak işlem' },
            id:{ type:'string', maxLength:40, description:'hata kimliği' },
            neden:{ type:'string', enum:['bilgi', 'dikkat', 'sure', 'okuma', 'yorum', 'diger'], description:'hata nedeni' },
            dersId:{ type:'string', maxLength:30, description:'ders kimliği' },
            konu:{ type:'string', maxLength:100, description:'konu adı' },
            not:{ type:'string', maxLength:500, description:'hata / çözüm notu' },
            denemeId:{ type:'string', maxLength:40, description:'bağlı deneme kimliği' }
          },
          required:['islem']
        },
        onizle:p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.errors, p, ['note', 'topic'], 'yanlış kaydı');
            if(b.hata) return { hata:b.hata };
            const err = b.kayit;
            return { metin:yz('ays.core.kingarac.yanlis-kaydi-silinecek'), satirlar:[(err.subjectId || '') + ' · ' + (err.topic || '') + ' · Neden: ' + (err.cause || 'belirtilmedi')] };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.errors, p, ['note', 'topic'], 'yanlış kaydı');
            if(b.hata) return { hata:b.hata };
            const err = b.kayit;
            return { metin:yz('ays.core.kingarac.yanlis-kaydi-guncellenecek'), satirlar:[yz('ays.core.kingarac.ders') + (p.dersId || err.subjectId), yz('ays.core.kingarac.neden') + (p.neden || err.cause || '—')] };
          }
          return { metin:yz('ays.core.kingarac.yanlis-defterine-kayit-yazil'),
            satirlar:[yz('ays.core.kingarac.ders') + (p.dersId || 'mat_tyt'), yz('ays.core.kingarac.neden') + (p.neden || 'bilgi'), yz('ays.core.kingarac.not') + (p.not || '—')] };
        },
        uygula:async p => {
          if(p.islem === 'sil'){
            const b = bul(R.S.errors, p, ['note', 'topic'], 'yanlış kaydı');
            if(b.hata) return { ok:false, metin:b.hata };
            const err = b.kayit;
            await R.Model.deleteError(err.id);
            render();
            return { metin:yz('ays.core.kingarac.yanlis-kaydi-silindi'), geriAl:async () => { await R.Model.saveError(err); render(); } };
          }
          if(p.islem === 'guncelle'){
            const b = bul(R.S.errors, p, ['note', 'topic'], 'yanlış kaydı');
            if(b.hata) return { ok:false, metin:b.hata };
            const err = b.kayit;
            const eski = Object.assign({}, err);
            if(p.neden) err.cause = p.neden;
            if(p.not) err.note = p.not;
            if(p.konu) err.topic = p.konu;
            if(p.dersId) err.subjectId = p.dersId;
            await R.Model.saveError(err);
            render();
            return { metin:yz('ays.core.kingarac.yanlis-kaydi-guncellendi'), geriAl:async () => { await R.Model.saveError(eski); render(); } };
          }
          const err = {
            id:p.id || R.U.uid('err'),
            date:R.U.todayISO(),
            subjectId:p.dersId || 'mat_tyt',
            topic:p.konu || '',
            cause:p.neden || 'bilgi',
            note:p.not || '',
            examId:p.denemeId || null,
            status:'open',
            createdAt:new Date().toISOString()
          };
          await R.Model.saveError(err);
          render();
          return { metin:yz('ays.core.kingarac.yanlis-kaydi-eklendi'), geriAl:async () => { await R.Model.deleteError(err.id); render(); } };
        }
      },
    ];
  }

  /* Öğretme motorunun araçları (core/ogret.js): «bugünkü tekrarlarım», «neden yanlış yaptım». */
  const ogret = () => R.Ogren && R.Ogren.ogretAraclar && window.LIFEOS && window.LIFEOS.OGRET ? R.Ogren.ogretAraclar() : [];
  function liste(){ return okuma().concat(yazma()).concat(modelAraclari()).concat(ogret()); }

  return { liste, satirlar, bul };
})();
