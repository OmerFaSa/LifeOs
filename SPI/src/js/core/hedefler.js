/* SPİ HEDEFLERİ — genel hedef motorunun (brand/ortak/hedef.js) SPİ paketi.

   Motor alanı bilmez; SPİ'nin bildiği şunlardır:

     ŞU ANKİ KİLO   son ölçümden, etiketiyle. Ölçüm yoksa profildeki değer
                    «tahmin» olarak kullanılır — tarihi bilinmeyen bir
                    değer ölçüm değildir.
     HIZ BANTLARI   kişinin KENDİ ağırlığına oranlı: kayıpta haftada
                    %0,5 (tipik) ve %1 (üst), alımda %0,25 ve %0,5.
                    Bu yaygın bir kılavuz aralığıdır ama kaynağı henüz
                    Araştırma Ofisi'yle bağlanmadı: dayanak «kaynak
                    bekliyor», karar «tahmin»dir (motor sözü 2).
     GÜVENLİK       kodla reddedilir: 18 yaş altı, haftada %1,5'ten hızlı
                    kayıp, VKİ 18,5'in altına inen ya da 30'un üstüne
                    çıkan hedef. 18,5 ve 30, DSÖ'nün VKİ sınıf sınırlarıdır.
     HEKİM KAPISI   riskli bir durum (gebelik, diyabet, böbrek…), aktif bir
                    ilaç ya da sağlık cevabında böyle bir işaret varsa
                    planın hekimle kurulacağı SÖYLENİR. SPİ teşhis koymaz,
                    doz önermez (AGENTS.md §1.5).
     HEKİM TALİMATI kullanıcının getirdiği talimat en yüksek öncelikli
                    kısıttır (ekip/PLAN.md §3.0); plan ona uyar. */

window.SP = window.SP || {};

SP.Hedefler = (function(){
  const H = () => window.LIFEOS.Hedef;

  const RISK = /(gebe|hamile|emzir|yeme bozukluğu|anoreksi|bulimi|böbrek|diyaliz|diyabet|şeker hastalığı|insülin|kalp|kanser|kemoterapi|tiroid|karaciğer|ameliyat)/;
  const KAYIP = { tipik:0.005, ust:0.01, sinir:0.015 };
  const ALIM = { tipik:0.0025, ust:0.005 };
  const VKI = { zayif:18.5, obez:30 };

  function kucuk(s){
    return String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr');
  }
  function yuvarla(x, n){ const k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }

  /* ---------------------------------------------------- durum profili */

  function sonKilo(){
    const gunler = Object.keys(SP.S.vitals || {}).sort().reverse();
    for(const d of gunler){
      const v = SP.S.vitals[d];
      if(v && v.weight != null && isFinite(Number(v.weight))){
        return { deger:Number(v.weight), birim:'kg', etiket:'olculdu', tarih:d };
      }
    }
    const p = SP.S.profile || {};
    if(p.weightKg != null && isFinite(Number(p.weightKg))){
      return { deger:Number(p.weightKg), birim:'kg', etiket:'tahmin', tarih:null };
    }
    return null;
  }

  function boyCm(h){
    const p = SP.S.profile || {};
    if(p.heightCm) return Number(p.heightCm);
    const c = h && h.cevaplar && h.cevaplar.boy;
    const m = c && /(\d{3})/.exec(c);
    const n = m ? Number(m[1]) : null;
    return n && n >= 100 && n <= 230 ? n : null;
  }

  function yas(){
    const p = SP.S.profile || {};
    return p.birthYear ? new Date().getFullYear() - Number(p.birthYear) : null;
  }

  function aktifIlaclar(){
    const bugun = SP.U.todayISO();
    return (SP.S.meds || []).filter(m => m && (!m.endDate || m.endDate >= bugun));
  }

  /* Hedefin yönü: azalt ya da artır (ulaş ise şimdiki değere göre). */
  function yonOf(h, simdi){
    if(h.yon === 'azalt' || h.yon === 'artir') return h.yon;
    if(h.egilim) return h.egilim;
    if(h.hedefDeger != null && simdi && simdi.deger != null){
      return h.hedefDeger < simdi.deger ? 'azalt' : 'artir';
    }
    return 'azalt';
  }

  function hedefKilo(h, simdi){
    if(h.hedefDeger != null) return h.hedefDeger;
    if(h.fark != null && simdi && simdi.deger != null){
      return yonOf(h, simdi) === 'azalt' ? simdi.deger - h.fark : simdi.deger + h.fark;
    }
    return null;
  }

  /* ------------------------------------------------------------ paket */

  const KILO = {
    id:'kilo', ad:'Kilo', olcut:{ ad:'kilo', birim:'kg' },
    anahtar:/\b(kilo|kg|vki|vücut kitle|bmi)\b/,
    birimler:/(?:kilo|kg)/,
    yonler:['azalt', 'artir', 'ulas', 'koru'],

    /* «VKİ'mi 24'e indirmek», «VKİ 24 olsun»: hedef VKİ biriminde gelir;
       `normalize` onu boyla kiloya çevirir. */
    tani(k){
      const i = k.search(/(vki|vücut kitle|bmi)/);
      if(i < 0) return null;
      const arka = k.slice(i);
      const m = /(\d+(?:[.,]\d+)?)\s*'?y?[ae](?![a-zçğıöşü])/.exec(arka)
        || /^(?:vki|vücut kitle|bmi)[^0-9]{0,12}(\d+(?:[.,]\d+)?)(?!\s*(?:gün|hafta|ay|yıl))/.exec(arka);
      const n = m ? Number(m[1].replace(',', '.')) : null;
      if(!(n >= 12 && n <= 60)) return null;
      return { yon:'ulas', hedefVki:n, hedefHam:{ deger:n, birim:'VKİ' }, birim:'kg' };
    },

    simdi:() => sonKilo(),

    hiz(h){
      const s = h.simdi || sonKilo();
      if(!s || s.deger == null) return { neden:'Şu anki kilon bilinmeden güvenli hız hesaplanamaz.' };
      const kayip = yonOf(h, s) === 'azalt';
      const b = kayip ? KAYIP : ALIM;
      return { tipik:yuvarla(s.deger * b.tipik), ust:yuvarla(s.deger * b.ust), birim:'kg/hafta',
        dayanak:{ durum:'kaynak_bekliyor', metin:kayip
          ? 'haftada vücut ağırlığının %0,5–1’i; yaygın kılavuz aralığı, kaynağı henüz bağlanmadı'
          : 'haftada vücut ağırlığının %0,25–0,5’i; yaygın kılavuz aralığı, kaynağı henüz bağlanmadı' } };
    },

    guvenlik(h, durum, x){
      const y = yas();
      if(y != null && y < 18){
        return { red:true, neden:'18 yaşından küçükler için kilo hedefi hekim ya da diyetisyenle '
          + 'birlikte kurulmalı; bu hedefi ben kuramam.' };
      }
      const s = h.simdi || sonKilo();
      const kayip = yonOf(h, s) === 'azalt';
      if(kayip && s && s.deger != null && x && x.gerekli != null && x.gerekli > s.deger * KAYIP.sinir){
        return { red:true, neden:'haftada vücut ağırlığının %1,5’inden hızlı kilo kaybı güvenli '
          + 'kabul edilmez.' };
      }
      const b = boyCm(h);
      const hk = hedefKilo(h, s);
      if(b && hk != null){
        const vki = hk / Math.pow(b / 100, 2);
        if(kayip && vki < VKI.zayif){
          return { red:true, neden:'hedef kilo boyuna göre VKİ ' + String(yuvarla(vki, 1)).replace('.', ',')
            + ' eder; bu, zayıflık sınırı olan VKİ 18,5’in altıdır.' };
        }
        if(!kayip && vki >= VKI.obez){
          return { red:true, neden:'hedef kilo boyuna göre VKİ ' + String(yuvarla(vki, 1)).replace('.', ',')
            + ' eder; bu, obezite sınırı olan VKİ 30’un üstüdür.' };
        }
      }
      return null;
    },

    ekSorular(h){
      const out = [];
      if(h.hedefHam && h.hedefDeger == null && !boyCm(h)){
        out.push({ alan:'boy', soru:'VKİ hedefini kiloya çevirmem için boyunu bilmem gerek. '
          + 'Boyun kaç santimetre?' });
      }
      out.push({ alan:'saglik', soru:'Bilinen bir sağlık durumun, kullandığın bir ilaç ya da '
        + 'hekiminin verdiği bir talimat var mı? Yoksa «yok» yaz.' });
      return out;
    },
  };

  const PAKETLER = [KILO];

  function normalize(h){
    if(h && h.hedefVki && h.hedefDeger == null){
      const b = boyCm(h);
      if(b) return Object.assign({}, h, { hedefDeger:yuvarla(h.hedefVki * Math.pow(b / 100, 2), 1) });
    }
    return h;
  }

  /* ---------------------------------------------------- hekim kapısı */

  function hekimKapisi(h){
    const p = SP.S.profile || {};
    const nedenler = [];
    const durumlar = (p.conditions || []).map(String).filter(c => RISK.test(kucuk(c)));
    if(durumlar.length) nedenler.push('bildirdiğin durum (' + durumlar.join(', ') + ')');
    const ilac = aktifIlaclar();
    if(ilac.length) nedenler.push('kullandığın ilaç');
    const cevap = kucuk(h && h.cevaplar && h.cevaplar.saglik);
    if(cevap && RISK.test(cevap)) nedenler.push('sağlık cevabın');
    return { gerekli:nedenler.length > 0, nedenler };
  }

  /* ------------------------------------------------- hekim talimatları */

  function talimatlar(){ return (SP.S.hekim || []).slice().sort((a, b) =>
    String(b.tarih || '').localeCompare(String(a.tarih || ''))); }

  async function talimatEkle(metin, tarih){
    const m = String(metin || '').trim();
    if(!m) return { ok:false, why:'Talimat metni boş.' };
    if(m.length > 2000) return { ok:false, why:'Talimat 2000 karakteri geçemez.' };
    const kayit = { id:SP.U.uid('hk'), metin:m, tarih:SP.U.isISO(tarih) ? tarih : SP.U.todayISO(),
      kaynak:'kullanici', eklenme:new Date().toISOString() };
    SP.S.hekim = (SP.S.hekim || []).concat([kayit]);
    await SP.Store.set('hekim/' + kayit.id, kayit);
    return { ok:true, kayit };
  }

  async function talimatSil(id){
    SP.S.hekim = (SP.S.hekim || []).filter(x => x.id !== id);
    await SP.Store.remove('hekim/' + id);
  }

  /* ---------------------------------------------------- sohbet notları */

  function sayiYaz(x){ return String(yuvarla(x, 1)).replace('.', ','); }

  function notlar(h){
    const out = [];
    if(h.hedefVki && h.hedefDeger != null){
      out.push('VKİ ' + sayiYaz(h.hedefVki) + ' hedefi boyuna göre ' + sayiYaz(h.hedefDeger) + ' kg eder.');
    }
    const k = hekimKapisi(h);
    if(k.gerekli){
      out.push('Bu hedefin planını hekiminle birlikte kurmalıyız (' + k.nedenler.join(', ') + '). '
        + 'Hekimin bir talimat verdiyse «Tahliller › Hekim talimatları»na ekle; plan ona uyar. '
        + 'Teşhis koymam, ilaç ya da doz önermem.');
    }
    const t = talimatlar();
    if(t.length){
      out.push('Kayıtlı ' + t.length + ' hekim talimatın var; hazırlanacak plan onlara uyar.');
    }
    return out;
  }

  /* ------------------------------------------------------------ depo */

  function gecerli(h){ return !!(h && h.id && H().DURUMLAR.indexOf(h.durum) >= 0); }

  async function yukle(){
    SP.S.hedefler = ((await SP.Store.list('hedefler')) || []).filter(gecerli);
    SP.S.hekim = ((await SP.Store.list('hekim')) || []).filter(x => x && x.id && x.metin);
  }

  async function kaydet(h){
    const l = (SP.S.hedefler || []).filter(x => x.id !== h.id);
    SP.S.hedefler = l.concat([h]);
    await SP.Store.set('hedefler/' + h.id, h);
    return h;
  }

  function liste(){ return (SP.S.hedefler || []).slice(); }
  function aktifler(){ return liste().filter(h => h.durum === 'aktif' || h.durum === 'askida'); }

  /* Hedef kapanınca (tamam / bırakıldı) uygulanmış planı da kapanır
     (core/plan.js); bu sessiz değildir, dönen `not` ekranda gösterilir. */
  async function durumDegistir(id, yeni){
    const h = liste().find(x => x.id === id);
    if(!h) return { ok:false, why:'Hedef bulunamadı.' };
    const r = H().gecis(h, yeni, SP.U.todayISO());
    if(r.ok) await kaydet(r.hedef);
    if(r.ok && (yeni === 'tamam' || yeni === 'birakildi') && SP.Plan){
      r.not = await SP.Plan.hedefKapandi(id);
    }
    return r;
  }

  /* Motorun sohbet akışı SPİ paketiyle. Model çağrılmaz. */
  const sohbet = window.LIFEOS && LIFEOS.Hedef ? LIFEOS.Hedef.sohbetKur({
    paketler:PAKETLER, modul:'spi', durum:() => ({}), bugun:() => SP.U.todayISO(),
    kaydet, normalize, notlar,
  }) : null;

  return { PAKETLER, KILO, VKI, sonKilo, boyCm, hekimKapisi, normalize, notlar,
    talimatlar, talimatEkle, talimatSil, yukle, kaydet, liste, aktifler, durumDegistir, sohbet };
})();
