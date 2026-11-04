/* Gelecek — sınav gününe kadar «bu gidişle» ve «ne olursa» (core/gelecek.js).

   Analiz çekmecesinin bölümü. Üç kart: sınav günü aralığı (net, puan,
   sıra, hedefe göre), gidiş grafiği (geçmiş denemeler ve sınav gününe
   genişleyen aralık), «ne olursa» sürgüsü (yalnız senin verinden ölçülen
   etkiyle). «Nasıl hesaplandı» küçük başlar. Sayıların hepsi kodun;
   ekran yalnız çizer. */

window.R = window.R || {};
R.Screens = R.Screens || {};
/* Gelecek simülatörü (2026-10-16): sınav gününe kadar «bu gidişle»
ve «ne olursa» (core/gelecek.js). */
window.LIFEOS.PARCA.sayfa({ id:'gelecek', modul:'ays', cekmece:'analiz', ad:'Gelecek', ikon:'target', sira:20 });

R.Screens.gelecek = (function(){
  const U = R.U, S = R.S;
  const { html, raw, when } = R.h;
  const K = R.C;
  const G = () => (window.LIFEOS || {}).GRAFIK;
  const SURGU = { min:-100, max:300, adim:25 };

  const sayi = v => v == null || !isFinite(v) ? '—' : U.fmtNum(Math.round(v));
  const net = v => v == null || !isFinite(v) ? '—' : U.fmtNet(v);

  function aralik(a){
    return G() && G().aralikHtml ? raw(G().aralikHtml(a)) : '';
  }

  /* ---------- sınav günü ---------- */
  function sinavKarti(r){
    const t = r.tyt;
    if(!t.ok){
      return K.Card({ title:'Sınav günü', hint:'gelecek',
        body:K.Empty({ icon:'chart', text:t.why + ' Denemeler eklendikçe gidiş kendiliğinden çizilir.' }) });
    }
    const s = r.sira;
    const konum = r.konum === 'icinde' ? 'Bu gidişle aralığın tamamı hedefinin içinde.'
      : r.konum === 'bantta' ? 'Hedefin bu aralığın içinde: iyi uçta tutuyor, kötü uçta kaçıyor.'
      : r.konum === 'disinda' ? 'Bu gidişle hedefin aralığın dışında; «Ne olursa» neyin kaydırdığını gösterir.' : '';
    /* Söz 6 (core/gelecek.js): sınav ufkun ötesindeyse sınav günü için
       sayı verilmez; ufuk tarihindeki aralık söylenir. */
    const ne = t.sinavaKadar ? 'Sınav günü' : U.fmtDate(t.ufukTarih) + ' itibarıyla';
    return K.Card({ title:'Sınav günü', hint:'gelecek', sub:U.fmtDate(r.sinav) + ' · ' + t.kalanGun + ' gün · tahmin',
      body:html`
        <div class="gel-ana">
          ${when(!t.sinavaKadar, () => html`<p class="small gel-uyari">Sınav gününe kadar çizmek için daha uzun ölçüm gerekir: gidiş, ölçülen sürenin
            (${t.yayilim} gün) en çok ${R.Gelecek.UFUK_KAT} katı kadar uzatılır. Yaklaşık ${t.gerekGun} gün daha deneme girdikçe ufuk sınav gününe uzanır.</p>`)}
          <p class="gel-cumle">${ne} bu gidişle TYT netin <b>${net(t.alt)}–${net(t.ust)}</b>, en olası <b>${net(t.olasi)}</b>.</p>
          ${aralik({ alt:t.alt, ust:t.ust, olasi:t.olasi, min:0, max:t.max, dayanak:t.n, dayanakBirim:'deneme', birim:'net', ondalik:1, etiket:'TYT net' })}
          ${when(s, () => html`
            <p class="gel-cumle mt-12">${t.sinavaKadar ? 'Sıralama aralığı' : 'O düzey sıralamada'} <b>${sayi(s.sira.iyi)}–${sayi(s.sira.kotu)}</b>, en olası <b>${sayi(s.sira.olasi)}</b>.</p>
            ${aralik({ alt:s.sira.iyi, ust:s.sira.kotu, olasi:s.sira.olasi, ters:true, dayanak:t.n, dayanakBirim:'deneme', etiket:'Sıra' })}
            ${when(r.hedef, () => html`<p class="small mt-8">Hedefin ${sayi(r.hedef)}. ${konum}</p>`)}
            ${when(s.yalnizTyt, () => html`<p class="tiny dim mt-4">AYT denemesi yeterli değil: puan yalnız TYT gidişinden; AYT'nin aynı düzeyde geleceği varsayıldı.</p>`)}`)}
          ${when(r.tyt.ekSoru, () => html`<p class="tiny dim mt-8">Bu aralık «Ne olursa»daki seçimle: haftada ${r.tyt.ekSoru > 0 ? '+' : ''}${r.tyt.ekSoru} soru.</p>`)}
        </div>` });
  }

  /* ---------- gidiş grafiği ---------- */
  function grafik(r){
    const t = r.tyt, t0 = r.tyt0;
    if(!t.ok) return '';
    const W = 640, H = 200, P = { l:34, r:12, t:12, b:22 };
    const ilk = t.nokta[0].tarih;
    const xGun = d => U.diffDays(ilk, d);
    const bitis = t.sinavaKadar ? r.sinav : t.ufukTarih;
    const xMax = Math.max(1, xGun(bitis));
    const yv = t.nokta.map(n => n.net).concat([t.alt, t.ust, t0.alt, t0.ust]);
    const yMin = Math.max(0, Math.floor(Math.min.apply(null, yv) / 5) * 5 - 5);
    const yMax = Math.min(t.max, Math.ceil(Math.max.apply(null, yv) / 5) * 5 + 5);
    const X = g => P.l + (W - P.l - P.r) * g / xMax;
    const Y = v => P.t + (H - P.t - P.b) * (1 - (v - yMin) / Math.max(1, yMax - yMin));
    const son = t.nokta.slice(-3).map(n => xGun(n.tarih)).sort((a, b) => a - b)[1] || xGun(t.nokta[t.nokta.length - 1].tarih);
    const yelpaze = (z, sinif) => '<polygon class="' + sinif + '" points="' + X(son).toFixed(1) + ',' + Y(z.duzey).toFixed(1) + ' '
      + X(xMax).toFixed(1) + ',' + Y(z.ust).toFixed(1) + ' ' + X(xMax).toFixed(1) + ',' + Y(z.alt).toFixed(1) + '"/>';
    const izgara = [yMin, Math.round((yMin + yMax) / 2), yMax].map(v =>
      '<line class="gel-g__izgara" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/>'
      + '<text class="gel-g__yazi" x="' + (P.l - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>').join('');
    const noktalar = t.nokta.map(n => '<circle class="gel-g__nokta" r="3.5" cx="' + X(xGun(n.tarih)).toFixed(1) + '" cy="' + Y(n.net).toFixed(1) + '"><title>'
      + U.fmtShort(n.tarih) + ' · ' + U.fmtNet(n.net) + ' net (ölçüldü)</title></circle>').join('');
    const svg = '<svg class="gel-g" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="TYT net gidişi: '
      + t.n + ' deneme ölçüldü; ' + (t.sinavaKadar ? 'sınav gününe' : U.fmtShort(bitis)) + ' kadar ' + U.fmtNet(t.alt) + '–' + U.fmtNet(t.ust) + ' net tahmini">'
      + izgara
      + (t.ekSoru ? yelpaze(t0, 'gel-g__yelpaze gel-g__yelpaze--once') : '')
      + yelpaze(t, 'gel-g__yelpaze')
      + '<line class="gel-g__olasi" x1="' + X(son).toFixed(1) + '" y1="' + Y(t.duzey).toFixed(1) + '" x2="' + X(xMax).toFixed(1) + '" y2="' + Y(t.olasi).toFixed(1) + '"/>'
      + '<line class="gel-g__sinav" x1="' + X(xMax).toFixed(1) + '" x2="' + X(xMax).toFixed(1) + '" y1="' + P.t + '" y2="' + (H - P.b) + '"/>'
      + '<text class="gel-g__yazi" x="' + X(xMax).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="end">' + (t.sinavaKadar ? 'sınav' : U.fmtShort(bitis)) + '</text>'
      + '<text class="gel-g__yazi" x="' + P.l + '" y="' + (H - 6) + '">' + U.fmtShort(ilk) + '</text>'
      + noktalar + '</svg>';
    return K.Card({ title:'Gidiş', sub:'noktalar ölçüldü · aralık tahmin',
      body:html`${raw(svg)}<p class="tiny dim mt-8">Haftada ${t.egimHafta > 0 ? '+' : ''}${U.fmtNet(t.egimHafta)} net gidiyorsun (${t.n} denemeden hesaplandı). Öğrenme zamanla yavaşlayabilir; üst uç bu yüzden iyimserdir.</p>` });
  }

  /* ---------- ne olursa ---------- */
  function neOlursa(r){
    const e = r.etki, ek = Number(S.ui.gelecekEkSoru) || 0;
    if(!r.tyt0.ok) return '';
    if(!e.ok){
      return K.Card({ title:'Ne olursa', sub:'haftalık soru',
        body:html`<p class="small">${e.why}</p>
          <p class="tiny dim mt-8">Uyku gibi öteki değişkenlerin etkisi, kişisel deneyler ölçünce burada açılır.</p>` });
    }
    const d = r.tyt0.olasi == null ? null : r.tyt.olasi - r.tyt0.olasi;
    return K.Card({ title:'Ne olursa', sub:'senin verinden ölçülen etkiyle',
      body:html`
        <label class="gel-surgu">
          <span class="small">Haftada <b>${ek > 0 ? '+' : ''}${ek}</b> soru ${ek ? (ek > 0 ? 'fazla' : 'az') : '(bugünkü tempo)'}</span>
          <input type="range" min="${SURGU.min}" max="${SURGU.max}" step="${SURGU.adim}" value="${ek}"
            data-change="gelecek-ek" aria-label="Haftalık ek soru"/>
        </label>
        ${when(ek, () => html`<p class="small mt-8">En olası TYT net ${d > 0 ? '+' : ''}${U.fmtNet(d)} kayar: ${U.fmtNet(r.tyt0.olasi)} → <b>${U.fmtNet(r.tyt.olasi)}</b> (tahmin).</p>`)}
        <p class="tiny dim mt-8">Etki ${e.n} deneme aralığından hesaplandı: senin verinde haftada 100 soru fazlası, haftalık net değişimini
          ${U.fmtNet(e.alt * 100)}–${U.fmtNet(e.ust * 100)} kaydırıyor. Bu bir ilişkidir; kesin neden-sonuç değildir.</p>` });
  }

  /* ---------- kişisel deney (KOLAY Faz 5, core/deney.js) ----------
     Tek şablon: sabah mı akşam mı? Kod her güne bir koşul yazar (iki
     günde bir ikisi de); ölçü günün sorusu. Kaydı olmayan gün ve bugün
     (gün bitmedi) sayılmaz. «Etki» ve sürgü yalnız biten deneyde. */
  const DENEY = { gun:14, kosullar:['sabah', 'aksam'] };
  const KOSUL = { sabah:'sabah', aksam:'akşam' };
  const bir = v => (Math.round(v * 10) / 10).toLocaleString('tr-TR');

  function deneyOlcumleri(d, bugun){
    return Array.from({ length:d.gun }, (_, i) => U.iso(U.addDays(d.baslangic, i))).filter(t => t < bugun)
      .map(t => ({ tarih:t, deger:S.days[t] ? R.Calc.gunSorusu(S.days[t]) : null }));
  }
  function deneyKarti(){
    if(!R.Deney) return '';
    const d = S.profile && S.profile.deney, bugun = U.todayISO();
    if(!d){
      return K.Card({ title:'Kişisel deney', sub:'sabah mı akşam mı?', body:html`
        <p class="small">${DENEY.gun} gün boyunca kod her güne <b>sabah</b> ya da <b>akşam</b> yazar; o gün çalışmanı o saatte yaparsın.
          Sonunda günlük soru sayın iki koşulda karşılaştırılır. Kaydı olmayan gün sayılmaz.</p>
        <div class="row mt-8"><button class="btn btn--primary" data-act="deney-baslat">Yarın başlat</button></div>` });
    }
    const s = R.Deney.sonuc(d, deneyOlcumleri(d, bugun), bugun);
    const bugunKosul = R.Deney.ata(d, bugun), gecen = Math.max(0, Math.min(d.gun, U.diffDays(d.baslangic, bugun)));
    const ust = s.durum === 'tamam' ? 'Bitti' : bugunKosul ? html`Bugün <b>${KOSUL[bugunKosul]}</b> çalış · ${gecen + 1}/${d.gun}. gün`
      : html`Yarın başlıyor: <b>${KOSUL[R.Deney.ata(d, U.iso(U.addDays(bugun, 1)))]}</b>`;
    let govde;
    if(s.durum === 'yetersiz') govde = html`<p class="small mt-8">${s.neden} Şu an sabah ${s.n.sabah}, akşam ${s.n.aksam} gün.</p>`;
    else{
      const iyi = s.fark >= 0 ? 'akşam' : 'sabah', f = Math.abs(s.fark);
      const [a, b] = s.fark >= 0 ? s.aralik : [-s.aralik[1], -s.aralik[0]];
      govde = html`<p class="small mt-8">${s.durum === 'tamam' ? 'Sonuç (etki)' : 'Ara sonuç'}: ${s.anlamli
          ? html`<b>${iyi}</b> günlerinde ortalama <b>${bir(f)}</b> soru fazla` : 'iki koşul arasında ayırt edilir bir fark yok'};
          %95 aralık ${bir(a)} – ${bir(b)} (sabah ${s.n.sabah}, akşam ${s.n.aksam} gün).</p>
        ${when(R.Deney.surguAcik(s) && s.anlamli, () => deneySurgu(iyi, f, a, b))}`;
    }
    return K.Card({ title:'Kişisel deney', sub:'sabah mı akşam mı?', body:html`
      <p class="small">${ust}</p>${govde}
      <div class="row mt-8"><button class="btn" data-act="deney-bitir">${s.durum === 'tamam' ? 'Yeni deney' : 'Deneyi bırak'}</button></div>` });
  }
  /* Sürgü yalnız biten ve ayırt edilen deneyle (Faz 5 kabulü): etki ölçülenle çarpılır, uydurma katsayı yok. */
  function deneySurgu(iyi, f, a, b){
    const g = Math.max(0, Math.min(7, Number(S.ui.deneyGun) || 0));
    return html`<label class="gel-surgu mt-8">
        <span class="small">Haftada <b>${g}</b> gün ${iyi} çalışırsam</span>
        <input type="range" min="0" max="7" step="1" value="${g}" data-change="deney-gun" aria-label="Haftada kaç gün ${iyi}"/>
      </label>
      ${when(g, () => html`<p class="small mt-8">Haftalık soru, hiç ${iyi} çalışmadığın haftaya göre yaklaşık <b>+${bir(f * g)}</b> (${bir(a * g)} – ${bir(b * g)}; tahmin).</p>`)}`;
  }

  /* ---------- nasıl hesaplandı ---------- */
  function yontem(r){
    const k = R.Calc.buHizla ? R.Calc.buHizla() : null;
    return K.Card({ title:'Nasıl hesaplandı', body:html`<ul class="small gel-yontem">
      <li>Gidiş: bütün tam TYT denemelerin ikişer ikişer eğimlerinin ortancası (tek kötü deneme çizgiyi sürüklemez).</li>
      <li>Şimdiki düzey son üç denemenin ortancası; aralık eğimlerin çeyreklerinden ve denemelerin dağınıklığından gelir, sınava doğru genişler.</li>
      <li>Puan ve sıra, bugünkü sıra tahminiyle aynı tablodan ve diploma notu katkısıyla hesaplanır.</li>
      <li>En az ${R.Gelecek.MIN_DENEME} tam deneme ve ${R.Gelecek.MIN_GUN} günlük yayılım yoksa gidiş çizilmez; kaydı olmayan gün sıfır sayılmaz.</li>
      <li>Bu bir koçluk aralığıdır, sonuç garantisi değildir.</li>
      ${when(k && k.metin, () => html`<li>Konu kapanışı: ${k.metin}</li>`)}
    </ul>` });
  }

  LIFEOS.PARCA.blok({ id:'gelecek.deneykarti', sayfa:'gelecek', yer:'y1', sira:10, ad:'deneyKarti', ciz({ r }){
    return deneyKarti();
  } });
  LIFEOS.PARCA.blok({ id:'gelecek.neolursa', sayfa:'gelecek', yer:'y2', sira:10, ad:'neOlursa', ciz({ r }){
    return neOlursa(r);
  } });
  LIFEOS.PARCA.blok({ id:'gelecek.bolum-3', sayfa:'gelecek', yer:'y3', sira:10, ad:'Bölüm 3', ciz({ r }){
    return raw(String(grafik(r)));
  } });
  LIFEOS.PARCA.blok({ id:'gelecek.sinavkarti', sayfa:'gelecek', yer:'y4', sira:10, ad:'sinavKarti', ciz({ r }){
    return sinavKarti(r);
  } });
  async function render(){
    const r = R.Gelecek.hesapla({ ekSoru:Number(S.ui.gelecekEkSoru) || 0 });
    const parcaB = { r };
    return String(html`${LIFEOS.PARCA.yer('gelecek', 'y4', K, parcaB, typeof raw === 'undefined' ? null : raw)}${LIFEOS.PARCA.yer('gelecek', 'y3', K, parcaB, typeof raw === 'undefined' ? null : raw)}${LIFEOS.PARCA.yer('gelecek', 'y2', K, parcaB, typeof raw === 'undefined' ? null : raw)}${LIFEOS.PARCA.yer('gelecek', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)}${yontem(r)}`);
  }

  const handle = {
    async 'deney-baslat'(){
      S.profile.deney = Object.assign({ id:'sabah-aksam-' + U.todayISO(), baslangic:U.iso(U.addDays(U.todayISO(), 1)) }, DENEY);
      await R.Model.saveProfile(); R.App.render();
    },
    async 'deney-bitir'(){ delete S.profile.deney; await R.Model.saveProfile(); R.App.render(); },
  };

  const change = {
    async 'deney-gun'(el){ S.ui.deneyGun = Math.max(0, Math.min(7, Number(el.value) || 0)); R.App.render(); },
    async 'gelecek-ek'(el){
      const v = Math.max(SURGU.min, Math.min(SURGU.max, Number(el.value) || 0));
      S.ui.gelecekEkSoru = v;
      R.App.render();
    },
  };

  return {
    id:'gelecek',
    kucukVarsayilan:['nasıl-hesaplandı'],
    title:'Gelecek',
    subtitle(){ return 'Sınav gününe kadar bu gidişle, ve ne olursa'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
