/* AYS HEDEF PLANI — etkin bir hedefi haftalık bir programa çevirir.

   Plan KURALLA kurulur, model çağrılmaz (AGENTS.md §1.1). İki biçimi var:

     KONU BİTİRME   kalan konular önkoşul sırasıyla haftalara dökülür;
                    haftanın bütçesi senin vaktindir (günlük dakika ×
                    haftada gün). İki haftada bir DENEME günü (tek dersse o
                    dersin branş denemesi, çok dersse tam deneme; çözüm +
                    aynı süre analiz) ve biten her konu için 1 ve 3 hafta
                    sonra 30 dakikalık TEKRAR aynı bütçeden düşülür. Konu
                    süreleri müfredatın tahminidir: plan «tahmin»dir.
     NET HEDEFİ     şu anki netten hedefe doğrusal ara hedefler (dört
                    haftada bir kontrol), haftada bir deneme ve odak
                    konuları (kapanmamış, yüksek sıklıklı konular).

   UYGULAMAK BÜYÜK AKSİYONDUR (AGENTS.md §1.9): öneri kapısından
   (core/proposals.js, 'hedef-plan') ayrıntılı önizleme ve onayla geçer;
   model bu eylemi öneremez. Uygulanan planın etkisi:
     - Bugün › Hedeflerim'de bu haftanın işi ve ilerleme görünür,
     - haftalık sözleşme TASLAĞI önce hedefin bu haftaki konularını alır
       (core/auto.js). İmzalı hafta değişmez; taslak yine senin onayınla
       yazılır.
   Geri almak planı kapatır; hafta taslağı eski sırasına döner. */

window.R = window.R || {};

R.HedefPlan = (function(){
  const U = () => R.U;
  const Hd = () => R.Hedefler;
  const H = () => window.LIFEOS.Hedef;

  const DENEME_ARALIK = 2;          // hafta
  const TEKRAR_ARALIK = [1, 3];     // konu bittikten kaç hafta sonra
  const TEKRAR_DK = 30;
  const EN_COK_HAFTA = 104;
  const KONTROL_ARALIK = 4;         // net: dört haftada bir kontrol
  const ODAK_SAYI = 5;

  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 1 : n); return Math.round(x * k) / k; }
  function sayiYaz(x, n){ return String(yuvarla(x, n)).replace('.', ','); }
  function gunEkle(iso, n){ return U().iso(U().addDays(U().parse(iso), n)); }
  function tarihYaz(iso){ return U().fmtDate(iso); }
  function dkYaz(dk){
    const s = Math.floor(dk / 60), d = Math.round(dk % 60);
    return s ? (s + ' sa' + (d ? ' ' + d + ' dk' : '')) : d + ' dk';
  }
  function sablon(id){ return (R.EXAM_TEMPLATES || []).find(t => t.id === id) || null; }

  /* Deneme şablonu: tek dersse o dersin branş denemesi, birden çok
     dersse ailenin tam denemesi (data/reference.js). */
  function denemeOf(dersler){
    const l = (dersler || []).map(id => (R.SUBJECTS || []).find(s => s.id === id)).filter(Boolean);
    if(!l.length) return null;
    if(l.length === 1){
      const test = Hd().DERS_TEST[l[0].id];
      const t = (R.EXAM_TEMPLATES || []).find(x => x.kind === 'branch'
        && x.tests.length === 1 && x.tests[0].name === test);
      if(t) return { ad:t.name, dk:t.duration * 2, sablon:t.id };
    }
    const t = sablon(l[0].exam === 'AYT' ? 'ayt-full' : 'tyt-full');
    return t ? { ad:t.name, dk:t.duration * 2, sablon:t.id } : null;
  }

  function yeniId(){ return 'hp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ====================================================== KONU PLANI */

  function konuPlani(h, bugun){
    const gunluk = h.kapasite && h.kapasite.gunluk_dk;
    if(!(gunluk > 0)) return { ok:false, why:'Günde ne kadar vakit ayıracağın bilinmeden plan kurulamaz.' };
    const haftalikGun = (h.kapasite && h.kapasite.haftalik_gun) || 7;
    const haftalikDk = Math.round(gunluk * haftalikGun);
    let kalan = Hd().siraliKalan(h.dersler);
    if(h.fark != null) kalan = kalan.slice(0, h.fark);
    if(!kalan.length) return { ok:false, why:'Bu hedefte kalan konu yok.' };
    const deneme = denemeOf(h.dersler);
    const kuyruk = kalan.map(k => {
      const dk = Math.max(15, Math.round(Hd().konuSaati(k) * 60));
      return { subjectId:k.subjectId, topicId:k.topicId, name:k.name, subjectName:k.subjectName, dk, kalanDk:dk };
    });
    const tekrarlar = {};
    const haftalar = [];
    let konuBitis = null;
    for(let w = 1; w <= EN_COK_HAFTA; w++){
      const bekleyenTekrar = Object.keys(tekrarlar).some(x => Number(x) >= w);
      if(!kuyruk.length && !bekleyenTekrar) break;
      const bas = gunEkle(bugun, (w - 1) * 7), bit = gunEkle(bugun, w * 7 - 1);
      let butce = haftalikDk;
      const d = kuyruk.length && deneme && w % DENEME_ARALIK === 0 ? deneme : null;
      if(d) butce -= d.dk;
      const tekrar = tekrarlar[w] || [];
      butce -= tekrar.length * TEKRAR_DK;
      const konular = [];
      while(kuyruk.length && butce > 0){
        const k = kuyruk[0];
        const al = Math.min(k.kalanDk, butce);
        konular.push({ subjectId:k.subjectId, topicId:k.topicId, name:k.name, subjectName:k.subjectName,
          dk:al, bas:k.kalanDk === k.dk, bitti:al === k.kalanDk });
        k.kalanDk -= al; butce -= al;
        if(k.kalanDk <= 0){
          kuyruk.shift();
          konuBitis = bit;
          TEKRAR_ARALIK.forEach(a => { (tekrarlar[w + a] = tekrarlar[w + a] || []).push(k.name); });
        }
      }
      haftalar.push({ n:w, bas, bit, konular, deneme:d ? { ad:d.ad, dk:d.dk } : null, tekrar,
        dk:haftalikDk - Math.max(0, butce), asim:butce < 0 ? -butce : 0 });
    }
    if(kuyruk.length){
      return { ok:false, why:'Bu vakitle plan iki yılı aşıyor; günlük vakti artır ya da kapsamı daralt.' };
    }
    const uyarilar = [];
    if(h.son_tarih && konuBitis > h.son_tarih){
      uyarilar.push('Bu vakitle konular ' + tarihYaz(konuBitis) + ' haftasında biter; son tarihin '
        + tarihYaz(h.son_tarih) + '. Denemeler ve tekrarlar da vakit ister.');
    }
    const rutin = (h.dersler || []).some(id => ((R.SUBJECTS || []).find(s => s.id === id) || { topics:[] })
      .topics.some(t => /(sürekli|rutin)/i.test(t.days)));
    if(rutin){
      uyarilar.push('Süreklilik isteyen beceriler (ör. paragrafta çıkarım) plana konu olarak girmez; '
        + 'günlük rutinde kalır.');
    }
    return { ok:true, plan:{ id:yeniId(), hedefId:h.id, paket:'konu', kurulus:bugun, ozet:Hd().ozet(h),
      gunlukDk:gunluk, haftalikGun, haftalikDk, haftalar, konuSayisi:kalan.length,
      konuBitis, bitis:haftalar.length ? haftalar[haftalar.length - 1].bit : bugun,
      deneme:deneme ? { ad:deneme.ad, dk:deneme.dk, aralik:DENEME_ARALIK } : null,
      tekrar:{ araliklar:TEKRAR_ARALIK.slice(), dk:TEKRAR_DK },
      etiket:'tahmin', uyarilar, durum:'taslak' } };
  }

  /* ======================================================= NET PLANI */

  function netPlani(h, bugun){
    const simdi = h.simdi && h.simdi.deger != null ? h.simdi
      : Hd().NET.simdi({}, h);
    if(!simdi || simdi.deger == null){
      return { ok:false, why:'Şu anki netin bilinmeden plan kurulamaz; önce bir deneme gir.' };
    }
    if(!h.son_tarih) return { ok:false, why:'Son tarih olmadan plan kurulamaz.' };
    const hedef = h.hedefDeger != null ? h.hedefDeger : simdi.deger + (h.fark || 0);
    if(!(hedef > simdi.deger)) return { ok:false, why:'Hedef net şu anki netinin üstünde olmalı.' };
    const gun = U().diffDays(bugun, h.son_tarih);
    if(!(gun > 0)) return { ok:false, why:'Hedef tarihi geçmişte.' };
    const toplam = Math.max(1, Math.ceil(gun / 7));
    const kontroller = [];
    for(let w = KONTROL_ARALIK; w < toplam; w += KONTROL_ARALIK){
      kontroller.push({ hafta:w, tarih:gunEkle(bugun, w * 7),
        beklenen:yuvarla(simdi.deger + (hedef - simdi.deger) * w / toplam, 1) });
    }
    kontroller.push({ hafta:toplam, tarih:h.son_tarih, beklenen:yuvarla(hedef, 1) });
    const dersler = h.brans ? [h.brans] : (R.SUBJECTS || []).filter(s => s.exam === h.aile).map(s => s.id);
    const deneme = h.brans ? denemeOf([h.brans]) : denemeOf(dersler);
    const odak = Hd().siraliKalan(dersler).filter(k => k.freq === 'high').slice(0, ODAK_SAYI)
      .map(k => ({ subjectId:k.subjectId, topicId:k.topicId, name:k.name, subjectName:k.subjectName }));
    const uyarilar = [];
    if(!odak.length) uyarilar.push('Bu kapsamda kapanmamış yüksek sıklıklı konu kalmadı; net artışı deneme analizinden ve yanlış defterinden gelir.');
    return { ok:true, plan:{ id:yeniId(), hedefId:h.id, paket:'net', kurulus:bugun, ozet:Hd().ozet(h),
      ad:Hd().netAdi(h), baslangic:yuvarla(simdi.deger, 2), hedef:yuvarla(hedef, 2), birim:'net',
      hafta:toplam, bitis:h.son_tarih, kontroller, odak,
      deneme:deneme ? { ad:deneme.ad, dk:deneme.dk, aralik:1 } : null,
      etiket:(h.gerceklik && h.gerceklik.etiket) || 'tahmin', uyarilar, durum:'taslak' } };
  }

  /* ================================================================= */

  function kur(h, bugun){
    if(!h) return { ok:false, why:'Hedef bulunamadı.' };
    if(h.durum !== 'aktif') return { ok:false, why:'Plan yalnız etkin hedef için kurulur.' };
    if(h.paket === 'konu') return konuPlani(h, bugun);
    if(h.paket === 'net') return netPlani(h, bugun);
    return { ok:false, why:'Bu hedef türü için plan kuralı yok.' };
  }

  /* Önizleme satırları: ne değişecek (önce → sonra). */
  function onizleme(p){
    const out = [];
    if(p.paket === 'konu'){
      out.push({ alan:'Hedef programı', once:'yok', sonra:p.haftalar.length + ' hafta, ' + p.konuSayisi
        + ' konu; konular ' + tarihYaz(p.konuBitis) + ' haftasında biter' });
      out.push({ alan:'Haftalık vakit', once:'—', sonra:dkYaz(p.haftalikDk) + ' (günde ' + p.gunlukDk + ' dk'
        + (p.haftalikGun < 7 ? ', haftada ' + p.haftalikGun + ' gün' : '') + ')' });
      if(p.deneme) out.push({ alan:'Deneme günü', once:'—', sonra:'iki haftada bir: ' + p.deneme.ad
        + ' (çözüm + analiz ' + dkYaz(p.deneme.dk) + ')' });
      out.push({ alan:'Tekrar', once:'—', sonra:'biten her konu ' + p.tekrar.araliklar.join(' ve ')
        + ' hafta sonra, ' + p.tekrar.dk + ' dk' });
    }else{
      out.push({ alan:'Hedef', once:sayiYaz(p.baslangic, 2) + ' net', sonra:sayiYaz(p.hedef, 2) + ' net, '
        + tarihYaz(p.bitis) });
      out.push({ alan:'Kontrol noktaları', once:'—', sonra:p.kontroller.length + ' kontrol, dört haftada bir' });
      if(p.deneme) out.push({ alan:'Deneme', once:'—', sonra:'haftada bir: ' + p.deneme.ad });
      if(p.odak.length) out.push({ alan:'Odak konuları', once:'—', sonra:p.odak.map(x => x.name).join(' · ') });
    }
    out.push({ alan:'Hafta sözleşmesi taslağı', once:'plandaki sıra', sonra:'önce hedefin bu haftaki konuları' });
    return out;
  }

  /* ----------------------------------------------------------- depo */

  function gecerli(p){ return !!(p && p.id && p.hedefId && (p.paket === 'konu' || p.paket === 'net')); }

  async function yukle(){
    R.S.hedefPlanlar = ((await R.Store.list('hedefPlanlar')) || []).filter(gecerli);
  }
  async function kaydet(p){
    R.S.hedefPlanlar = (R.S.hedefPlanlar || []).filter(x => x.id !== p.id).concat([p]);
    await R.Store.set('hedefPlanlar/' + p.id, p);
    if(R.Hedefler && R.Hedefler.ag) R.Hedefler.ag.planla();
    return p;
  }
  function liste(){ return (R.S.hedefPlanlar || []).slice(); }
  function aktif(hedefId){ return liste().find(p => p.hedefId === hedefId && p.durum === 'aktif') || null; }
  function aktifler(){ return liste().filter(p => p.durum === 'aktif'); }

  /* Öneri kapısının apply/revert'ü bunları çağırır. */
  async function uygula(plan){
    const p = Object.assign({}, plan, { durum:'aktif', uygulama:U().todayISO() });
    await kaydet(p);
    return p;
  }
  async function geriAl(planId){
    const p = liste().find(x => x.id === planId);
    if(!p || p.durum !== 'aktif') return { ok:false, why:'Uygulanmış bir plan bulunamadı.' };
    await kaydet(Object.assign({}, p, { durum:'geri_alindi', geriAlma:U().todayISO() }));
    return { ok:true };
  }

  /* Hedeflerim'deki «Planı uygula»: önizleme ekranda görüldü, düğme onayın
     kendisidir. Yine de ÖNERİ KAPISINDAN geçer: doğrulama, geri alma kaydı
     ve iz tek yerde tutulur. */
  async function uygulaHedef(hedefId){
    const t = await R.Proposals.talep({ action:'hedef-plan', agent:'patron', source:'istek',
      params:{ hedefId }, reason:'Hedeflerim › Planı uygula' });
    if(!t.row) return { ok:false, why:t.why || 'Plan uygulanamadı.' };
    const r = await R.Proposals.approve(t.row.id);
    if(!r || !r.ok) return { ok:false, why:(r && r.why) || 'Plan uygulanamadı.' };
    return { ok:true, plan:aktif(hedefId) };
  }
  async function geriAlHedef(hedefId){
    const p = aktif(hedefId);
    if(!p) return { ok:false, why:'Uygulanmış bir plan yok.' };
    const row = (R.S.officeProposals || []).find(x => x.action === 'hedef-plan' && x.status === 'applied'
      && x.undo && x.undo.planId === p.id);
    if(row){ await R.Proposals.undo(row.id); return { ok:true }; }
    return await geriAl(p.id);
  }

  /* Hedef tamamlanınca ya da bırakılınca planı da kapanır. */
  async function hedefKapandi(hedefId){
    const p = aktif(hedefId);
    if(!p) return '';
    await kaydet(Object.assign({}, p, { durum:'bitti', bitisGunu:U().todayISO() }));
    return 'Hedefin planı da kapandı.';
  }

  /* ------------------------------------------------------- takvim */

  function haftaOf(p, iso){
    if(p.paket !== 'konu') return null;
    const g = U().diffDays(p.kurulus, iso);
    if(g < 0) return null;
    return p.haftalar[Math.floor(g / 7)] || null;
  }

  /* Hafta sözleşmesi taslağı için: o tarihin haftasında etkin planların
     konuları. Konu planında haftanın konuları; net planında kapanmamış
     odak konuları. Kapanmış konu taslağa girmez. */
  function haftaKonulari(iso){
    const out = [];
    const seen = {};
    const ekle = (k, why) => {
      const key = k.subjectId + ':' + k.topicId;
      if(seen[key]) return;
      if((R.Model.topicState(k.subjectId, k.topicId) || {}).state === 'closed') return;
      seen[key] = true;
      out.push({ name:k.name, subjectId:k.subjectId, topicId:k.topicId, why });
    };
    aktifler().forEach(p => {
      if(p.paket === 'konu'){
        const w = haftaOf(p, iso);
        (w ? w.konular : []).forEach(k => ekle(k, 'hedef programı'));
      }else{
        (p.odak || []).slice(0, 2).forEach(k => ekle(k, 'net hedefinin odağı'));
      }
    });
    return out;
  }

  /* ------------------------------------------------------ ilerleme */

  /* Konu planı: bugüne kadar BİTMİŞ olması gereken konular (bitiş
     haftası geçmiş) ile kapanış kuralıyla gerçekten kapanmış olanlar.
     Net planı: son geçen kontrol noktasının beklenen neti ile son üç
     denemenin medyanı. İkisi de ölçümdür; eksik veri sıfır sayılmaz. */
  function ilerleme(p, bugun){
    if(p.paket === 'konu'){
      const tum = [], gereken = [];
      p.haftalar.forEach(w => w.konular.forEach(k => {
        if(!k.bitti) return;
        tum.push(k);
        if(w.bit < bugun) gereken.push(k);
      }));
      const kapali = k => (R.Model.topicState(k.subjectId, k.topicId) || {}).state === 'closed';
      const kapanan = tum.filter(kapali).length;
      const beklenen = gereken.length;
      const w = haftaOf(p, bugun);
      const durum = kapanan >= beklenen ? 'yolunda' : 'geride';
      const metin = (beklenen ? 'Bugüne kadar ' + beklenen + ' konunun bitmesi planlanmıştı; '
        + kapanan + ' konu kapanış kuralıyla kapandı.' : 'Plan yeni başladı; ' + kapanan + ' konu kapandı.')
        + (durum === 'geride' ? ' Plan geride: sıradaki konuları bu haftaya al ya da vakti artır.' : '');
      return { durum, kapanan, beklenen, toplam:tum.length, hafta:w, metin };
    }
    const kontrol = p.kontroller.filter(k => k.tarih <= bugun).slice(-1)[0] || null;
    const sonraki = p.kontroller.find(k => k.tarih > bugun) || null;
    const h = (R.S.hedefler || []).find(x => x.id === p.hedefId);
    const s = h ? Hd().NET.simdi({}, h) : null;
    if(!s || s.deger == null){
      return { durum:'veri_yok', sonraki, metin:'Deneme girilmedi; ilerleme ölçülemiyor.' };
    }
    if(!kontrol){
      return { durum:'yolunda', sonraki, simdi:s.deger, metin:'İlk kontrol ' + tarihYaz(sonraki.tarih)
        + '; beklenen ' + sayiYaz(sonraki.beklenen, 1) + ' net. Şu an ' + sayiYaz(s.deger, 2) + ' net ('
        + (s.kaynak || 'son denemeler') + ').' };
    }
    const durum = s.deger >= kontrol.beklenen ? 'yolunda' : 'geride';
    return { durum, sonraki, simdi:s.deger, metin:'Kontrol (' + tarihYaz(kontrol.tarih) + '): beklenen '
      + sayiYaz(kontrol.beklenen, 1) + ' net, şu an ' + sayiYaz(s.deger, 2) + ' net.'
      + (durum === 'geride' ? ' Plan geride: odak konulara ve deneme analizine ağırlık ver.' : '') };
  }

  return { DENEME_ARALIK, TEKRAR_ARALIK, TEKRAR_DK, KONTROL_ARALIK, kur, onizleme, denemeOf,
    yukle, kaydet, liste, aktif, aktifler, uygula, geriAl, uygulaHedef, geriAlHedef, hedefKapandi,
    haftaOf, haftaKonulari, ilerleme, dkYaz };
})();
