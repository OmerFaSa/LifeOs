/* Gelecek — sınav gününe kadar «bu gidişle» ve «ne olursa» (core/gelecek.js).

   Analiz çekmecesinin bölümü. Üç kart: sınav günü aralığı (net, puan,
   sıra, hedefe göre), gidiş grafiği (geçmiş denemeler ve sınav gününe
   genişleyen aralık), «ne olursa» sürgüsü (yalnız senin verinden ölçülen
   etkiyle). «Nasıl hesaplandı» küçük başlar. Sayıların hepsi kodun;
   ekran yalnız çizer. */
window.LIFEOS.PARCA.yazilar({
  'ays.gelecek.neden-sinav-gunu-degil':'Neden sınav günü değil?',
  'ays.gelecek.gelecek-bolumleri':'Gelecek bölümleri',
  'ays.gelecek.bolum-tahmin':'Tahmin',
  'ays.gelecek.bolum-deney':'Deney',
  'ays.gelecek.bu-gidisle-araligin-tamami-h':'Bu gidişle aralığın tamamı hedefinin içinde.',
  'ays.gelecek.hedefin-bu-araligin-icinde-i':'Hedefin bu aralığın içinde: iyi uçta tutuyor, kötü uçta kaçıyor.',
  'ays.gelecek.bu-gidisle-hedefin-araligin':'Bu gidişle hedefin aralığın dışında; «Ne olursa» neyin kaydırdığını gösterir.',
  'ays.gelecek.siralama-araligi':'Sıralama aralığı',
  'ays.gelecek.o-duzey-siralamada':'O düzey sıralamada',
  'ays.gelecek.net-olculdu':'net (ölçüldü)',
  'ays.gelecek.sonuc-etki':'Sonuç (etki)',
  'ays.gelecek.ara-sonuc':'Ara sonuç',
  'ays.gelecek.yeni-deney':'Yeni deney',
  'ays.gelecek.deneyi-birak':'Deneyi bırak',
  'ays.gelecek.sinav-gunune-kadar-bu-gidisl':'Sınav gününe kadar bu gidişle, ve ne olursa',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'ays.gelecek.sinav-gunu':'Sınav günü',
  'ays.gelecek.sinav-gunune-kadar-cizmek-ic':'Sınav gününe kadar çizmek için daha uzun ölçüm gerekir: gidiş, ölçülen sürenin (',
  'ays.gelecek.gun-en-cok':'gün) en çok',
  'ays.gelecek.kati-kadar-uzatilir-yaklasik':'katı kadar uzatılır. Yaklaşık',
  'ays.gelecek.gun-daha-deneme-girdikce-ufu':'gün daha deneme girdikçe ufuk sınav gününe uzanır.',
  'ays.gelecek.bu-gidisle-tyt-netin':'bu gidişle TYT netin',
  'ays.gelecek.en-olasi':', en olası',
  'ays.gelecek.tyt-net':'TYT net',
  'ays.gelecek.sira':'Sıra',
  'ays.gelecek.hedefin':'Hedefin',
  'ays.gelecek.bu-aralik-ne-olursa-daki-sec':'Bu aralık «Ne olursa»daki seçimle: haftada',
  'ays.gelecek.gidis':'Gidiş',
  'ays.gelecek.noktalar-olculdu-aralik-tahm':'noktalar ölçüldü · aralık tahmin',
  'ays.gelecek.haftada':'Haftada',
  'ays.gelecek.net-gidiyorsun':'net gidiyorsun (',
  'ays.gelecek.denemeden-hesaplandi-ogrenme':'denemeden hesaplandı). Öğrenme zamanla yavaşlayabilir; üst uç bu yüzden iyimserdir.',
  'ays.gelecek.ne-olursa':'Ne olursa',
  'ays.gelecek.haftalik-soru':'haftalık soru',
  'ays.gelecek.uyku-gibi-oteki-degiskenleri':'Uyku gibi öteki değişkenlerin etkisi, kişisel deneyler ölçünce burada açılır.',
  'ays.gelecek.senin-verinden-olculen-etkiy':'senin verinden ölçülen etkiyle',
  'ays.gelecek.en-olasi-tyt-net':'En olası TYT net',
  'ays.gelecek.etki':'Etki',
  'ays.gelecek.deneme-araligindan-hesapland':'deneme aralığından hesaplandı: senin verinde haftada 100 soru fazlası, haftalık net değişimini',
  'ays.gelecek.kaydiriyor-bu-bir-iliskidir':'kaydırıyor. Bu bir ilişkidir; kesin neden-sonuç değildir.',
  'ays.gelecek.kisisel-deney':'Kişisel deney',
  'ays.gelecek.sabah-mi-aksam-mi':'sabah mı akşam mı?',
  'ays.gelecek.gun-boyunca-kod-her-gune':'gün boyunca kod her güne',
  'ays.gelecek.ya-da':'ya da',
  'ays.gelecek.aksam':'akşam',
  'ays.gelecek.yazar-o-gun-calismani-o':'yazar; o gün çalışmanı o saatte yaparsın. Sonunda günlük soru sayın iki koşulda karşılaştırılır. Kaydı olmayan gün sayılmaz.',
  'ays.gelecek.yarin-baslat':'Yarın başlat',
  'ays.gelecek.bugun':'Bugün',
  'ays.gelecek.calis':'çalış ·',
  'ays.gelecek.gun':'. gün',
  'ays.gelecek.yarin-basliyor':'Yarın başlıyor:',
  'ays.gelecek.su-an-sabah':'Şu an sabah',
  'ays.gelecek.aksam-2':', akşam',
  'ays.gelecek.gun-2':'gün.',
  'ays.gelecek.gunlerinde-ortalama':'günlerinde ortalama',
  'ays.gelecek.soru-fazla':'soru fazla',
  'ays.gelecek.95-aralik':'; %95 aralık',
  'ays.gelecek.gun-3':'gün).',
  'ays.gelecek.gun-4':'gün',
  'ays.gelecek.calisirsam':'çalışırsam',
  'ays.gelecek.haftalik-soru-hic':'Haftalık soru, hiç',
  'ays.gelecek.calismadigin-haftaya-gore-ya':'çalışmadığın haftaya göre yaklaşık',
  'ays.gelecek.tahmin':'; tahmin).',
  'ays.gelecek.nasil-hesaplandi':'Nasıl hesaplandı',
  'ays.gelecek.gidis-butun-tam-tyt-denemele':'Gidiş: bütün tam TYT denemelerin ikişer ikişer eğimlerinin ortancası (tek kötü deneme çizgiyi sürüklemez).',
  'ays.gelecek.simdiki-duzey-son-uc-denemen':'Şimdiki düzey son üç denemenin ortancası; aralık eğimlerin çeyreklerinden ve denemelerin dağınıklığından gelir, sınava doğru genişler.',
  'ays.gelecek.puan-ve-sira-bugunku-sira':'Puan ve sıra, bugünkü sıra tahminiyle aynı tablodan ve diploma notu katkısıyla hesaplanır.',
  'ays.gelecek.en-az':'En az',
  'ays.gelecek.tam-deneme-ve':'tam deneme ve',
  'ays.gelecek.gunluk-yayilim-yoksa-gidis-c':'günlük yayılım yoksa gidiş çizilmez; kaydı olmayan gün sıfır sayılmaz.',
  'ays.gelecek.bu-bir-kocluk-araligidir-son':'Bu bir koçluk aralığıdır, sonuç garantisi değildir.',
  'ays.gelecek.konu-kapanisi':'Konu kapanışı:',
  'ays.gelecek.gelecek':'Gelecek',
});
/* Gelecek simülatörü (2026-10-16): sınav gününe kadar «bu gidişle»
ve «ne olursa» (core/gelecek.js). */
window.LIFEOS.PARCA.sayfa({ id:'gelecek', modul:'ays', king:{ sira:110, ad:'Gelecek', es:['gelecek', 'simülatör', 'bu gidişle', 'sınav günü'] }, cekmece:'analiz', ad:'Gelecek', ikon:'target', sira:20 });

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
      return K.Card({ title:yz('ays.gelecek.sinav-gunu'), hint:'gelecek',
        body:K.Empty({ icon:'chart', text:t.why + ' Denemeler eklendikçe gidiş kendiliğinden çizilir.' }) });
    }
    const s = r.sira;
    const konum = r.konum === 'icinde' ? yz('ays.gelecek.bu-gidisle-araligin-tamami-h')
      : r.konum === 'bantta' ? yz('ays.gelecek.hedefin-bu-araligin-icinde-i')
      : r.konum === 'disinda' ? yz('ays.gelecek.bu-gidisle-hedefin-araligin') : '';
    /* Söz 6 (core/gelecek.js): sınav ufkun ötesindeyse sınav günü için
       sayı verilmez; ufuk tarihindeki aralık söylenir. */
    const ne = t.sinavaKadar ? yz('ays.gelecek.sinav-gunu') : U.fmtDate(t.ufukTarih) + ' itibarıyla';
    return K.Card({ title:yz('ays.gelecek.sinav-gunu'), hint:'gelecek', sub:U.fmtDate(r.sinav) + ' · ' + t.kalanGun + ' gün · tahmin',
      body:html`
        <div class="gel-ana">
          <p class="gel-cumle">${ne} ${yz('ays.gelecek.bu-gidisle-tyt-netin')} <b>${net(t.alt)}–${net(t.ust)}</b>${yz('ays.gelecek.en-olasi')} <b>${net(t.olasi)}</b>.</p>
          ${aralik({ alt:t.alt, ust:t.ust, olasi:t.olasi, min:0, max:t.max, dayanak:t.n, dayanakBirim:'deneme', birim:'net', ondalik:1, etiket:yz('ays.gelecek.tyt-net') })}
          ${when(s, () => html`
            <p class="gel-cumle mt-12">${t.sinavaKadar ? yz('ays.gelecek.siralama-araligi') : yz('ays.gelecek.o-duzey-siralamada')} <b>${sayi(s.sira.iyi)}–${sayi(s.sira.kotu)}</b>${yz('ays.gelecek.en-olasi')} <b>${sayi(s.sira.olasi)}</b>.</p>
            ${aralik({ alt:s.sira.iyi, ust:s.sira.kotu, olasi:s.sira.olasi, ters:true, dayanak:t.n, dayanakBirim:'deneme', etiket:yz('ays.gelecek.sira') })}
            ${when(r.hedef, () => html`<p class="small mt-8">${yz('ays.gelecek.hedefin')} ${sayi(r.hedef)}. ${konum}</p>`)}
            ${when(s.yalnizTyt, () => html`<p class="tiny dim mt-4">AYT denemesi yeterli değil: puan yalnız TYT gidişinden; AYT'nin aynı düzeyde geleceği varsayıldı.</p>`)}`)}
          ${when(!t.sinavaKadar, () => K.Ayrinti({ class:'mt-8', etiket:yz('ays.gelecek.neden-sinav-gunu-degil'), govde:html`${yz('ays.gelecek.sinav-gunune-kadar-cizmek-ic')}${t.yayilim} ${yz('ays.gelecek.gun-en-cok')} ${R.Gelecek.UFUK_KAT} ${yz('ays.gelecek.kati-kadar-uzatilir-yaklasik')} ${t.gerekGun} ${yz('ays.gelecek.gun-daha-deneme-girdikce-ufu')}` }))}
          ${when(r.tyt.ekSoru, () => html`<p class="tiny dim mt-8">${yz('ays.gelecek.bu-aralik-ne-olursa-daki-sec')} ${r.tyt.ekSoru > 0 ? '+' : ''}${r.tyt.ekSoru} soru.</p>`)}
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
      + U.fmtShort(n.tarih) + ' · ' + U.fmtNet(n.net) + (' ' + yz('ays.gelecek.net-olculdu') + '</title></circle>')).join('');
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
    return K.Card({ title:yz('ays.gelecek.gidis'), sub:yz('ays.gelecek.noktalar-olculdu-aralik-tahm'),
      body:html`${raw(svg)}<p class="tiny dim mt-8">${yz('ays.gelecek.haftada')} ${t.egimHafta > 0 ? '+' : ''}${U.fmtNet(t.egimHafta)} ${yz('ays.gelecek.net-gidiyorsun')}${t.n} ${yz('ays.gelecek.denemeden-hesaplandi-ogrenme')}</p>` });
  }

  /* ---------- ne olursa ---------- */
  function neOlursa(r){
    const e = r.etki, ek = Number(S.ui.gelecekEkSoru) || 0;
    if(!r.tyt0.ok) return '';
    if(!e.ok){
      return K.Card({ title:yz('ays.gelecek.ne-olursa'), sub:yz('ays.gelecek.haftalik-soru'),
        body:html`<p class="small">${e.why}</p>
          <p class="tiny dim mt-8">${yz('ays.gelecek.uyku-gibi-oteki-degiskenleri')}</p>` });
    }
    const d = r.tyt0.olasi == null ? null : r.tyt.olasi - r.tyt0.olasi;
    return K.Card({ title:yz('ays.gelecek.ne-olursa'), sub:yz('ays.gelecek.senin-verinden-olculen-etkiy'),
      body:html`
        <label class="gel-surgu">
          <span class="small">${yz('ays.gelecek.haftada')} <b>${ek > 0 ? '+' : ''}${ek}</b> soru ${ek ? (ek > 0 ? 'fazla' : 'az') : '(bugünkü tempo)'}</span>
          <input type="range" min="${SURGU.min}" max="${SURGU.max}" step="${SURGU.adim}" value="${ek}"
            data-change="gelecek-ek" aria-label="Haftalık ek soru"/>
        </label>
        ${when(ek, () => html`<p class="small mt-8">${yz('ays.gelecek.en-olasi-tyt-net')} ${d > 0 ? '+' : ''}${U.fmtNet(d)} kayar: ${U.fmtNet(r.tyt0.olasi)} → <b>${U.fmtNet(r.tyt.olasi)}</b> (tahmin).</p>`)}
        <p class="tiny dim mt-8">${yz('ays.gelecek.etki')} ${e.n} ${yz('ays.gelecek.deneme-araligindan-hesapland')}
          ${U.fmtNet(e.alt * 100)}–${U.fmtNet(e.ust * 100)} ${yz('ays.gelecek.kaydiriyor-bu-bir-iliskidir')}</p>` });
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
      return K.Card({ title:yz('ays.gelecek.kisisel-deney'), sub:yz('ays.gelecek.sabah-mi-aksam-mi'), body:html`
        <p class="small">${DENEY.gun} ${yz('ays.gelecek.gun-boyunca-kod-her-gune')} <b>sabah</b> ${yz('ays.gelecek.ya-da')} <b>${yz('ays.gelecek.aksam')}</b> ${yz('ays.gelecek.yazar-o-gun-calismani-o')}</p>
        <div class="row mt-8"><button class="btn btn--primary" data-act="deney-baslat">${yz('ays.gelecek.yarin-baslat')}</button></div>` });
    }
    const s = R.Deney.sonuc(d, deneyOlcumleri(d, bugun), bugun);
    const bugunKosul = R.Deney.ata(d, bugun), gecen = Math.max(0, Math.min(d.gun, U.diffDays(d.baslangic, bugun)));
    const ust = s.durum === 'tamam' ? 'Bitti' : bugunKosul ? html`${yz('ays.gelecek.bugun')} <b>${KOSUL[bugunKosul]}</b> ${yz('ays.gelecek.calis')} ${gecen + 1}/${d.gun}${yz('ays.gelecek.gun')}`
      : html`${yz('ays.gelecek.yarin-basliyor')} <b>${KOSUL[R.Deney.ata(d, U.iso(U.addDays(bugun, 1)))]}</b>`;
    let govde;
    if(s.durum === 'yetersiz') govde = html`<p class="small mt-8">${s.neden} ${yz('ays.gelecek.su-an-sabah')} ${s.n.sabah}${yz('ays.gelecek.aksam-2')} ${s.n.aksam} ${yz('ays.gelecek.gun-2')}</p>`;
    else{
      const iyi = s.fark >= 0 ? 'akşam' : 'sabah', f = Math.abs(s.fark);
      const [a, b] = s.fark >= 0 ? s.aralik : [-s.aralik[1], -s.aralik[0]];
      govde = html`<p class="small mt-8">${s.durum === 'tamam' ? yz('ays.gelecek.sonuc-etki') : yz('ays.gelecek.ara-sonuc')}: ${s.anlamli
          ? html`<b>${iyi}</b> ${yz('ays.gelecek.gunlerinde-ortalama')} <b>${bir(f)}</b> ${yz('ays.gelecek.soru-fazla')}` : 'iki koşul arasında ayırt edilir bir fark yok'}${yz('ays.gelecek.95-aralik')} ${bir(a)} – ${bir(b)} (sabah ${s.n.sabah}${yz('ays.gelecek.aksam-2')} ${s.n.aksam} ${yz('ays.gelecek.gun-3')}</p>
        ${when(R.Deney.surguAcik(s) && s.anlamli, () => deneySurgu(iyi, f, a, b))}`;
    }
    return K.Card({ title:yz('ays.gelecek.kisisel-deney'), sub:yz('ays.gelecek.sabah-mi-aksam-mi'), body:html`
      <p class="small">${ust}</p>${govde}
      <div class="row mt-8"><button class="btn" data-act="deney-bitir">${s.durum === 'tamam' ? yz('ays.gelecek.yeni-deney') : yz('ays.gelecek.deneyi-birak')}</button></div>` });
  }
  /* Sürgü yalnız biten ve ayırt edilen deneyle (Faz 5 kabulü): etki ölçülenle çarpılır, uydurma katsayı yok. */
  function deneySurgu(iyi, f, a, b){
    const g = Math.max(0, Math.min(7, Number(S.ui.deneyGun) || 0));
    return html`<label class="gel-surgu mt-8">
        <span class="small">${yz('ays.gelecek.haftada')} <b>${g}</b> ${yz('ays.gelecek.gun-4')} ${iyi} ${yz('ays.gelecek.calisirsam')}</span>
        <input type="range" min="0" max="7" step="1" value="${g}" data-change="deney-gun" aria-label="Haftada kaç gün ${iyi}"/>
      </label>
      ${when(g, () => html`<p class="small mt-8">${yz('ays.gelecek.haftalik-soru-hic')} ${iyi} ${yz('ays.gelecek.calismadigin-haftaya-gore-ya')} <b>+${bir(f * g)}</b> (${bir(a * g)} – ${bir(b * g)}${yz('ays.gelecek.tahmin')}</p>`)}`;
  }

  /* ---------- nasıl hesaplandı ---------- */
  function yontem(r){
    const k = R.Calc.buHizla ? R.Calc.buHizla() : null;
    return K.Card({ title:yz('ays.gelecek.nasil-hesaplandi'), body:html`<ul class="small gel-yontem">
      <li>${yz('ays.gelecek.gidis-butun-tam-tyt-denemele')}</li>
      <li>${yz('ays.gelecek.simdiki-duzey-son-uc-denemen')}</li>
      <li>${yz('ays.gelecek.puan-ve-sira-bugunku-sira')}</li>
      <li>${yz('ays.gelecek.en-az')} ${R.Gelecek.MIN_DENEME} ${yz('ays.gelecek.tam-deneme-ve')} ${R.Gelecek.MIN_GUN} ${yz('ays.gelecek.gunluk-yayilim-yoksa-gidis-c')}</li>
      <li>${yz('ays.gelecek.bu-bir-kocluk-araligidir-son')}</li>
      ${when(k && k.metin, () => html`<li>${yz('ays.gelecek.konu-kapanisi')} ${k.metin}</li>`)}
    </ul>` });
  }

  LIFEOS.PARCA.blok({ id:'gelecek.deneykarti', sayfa:'gelecek', yer:'y1', sira:10, ad:'Deney kartı', ciz({ r }){
    return deneyKarti();
  } });
  LIFEOS.PARCA.blok({ id:'gelecek.neolursa', sayfa:'gelecek', yer:'y2', sira:10, ad:'Ne olursa', ciz({ r }){
    return neOlursa(r);
  } });
  LIFEOS.PARCA.blok({ id:'gelecek.gelecek-grafigi', sayfa:'gelecek', yer:'y3', sira:10, ad:'Gelecek grafiği', ciz({ r }){
    return raw(String(grafik(r)));
  } });
  LIFEOS.PARCA.blok({ id:'gelecek.sinavkarti', sayfa:'gelecek', yer:'y4', sira:10, ad:'Sınav kartı', ciz({ r }){
    return sinavKarti(r);
  } });
  async function render(){
    const r = R.Gelecek.hesapla({ ekSoru:Number(S.ui.gelecekEkSoru) || 0 });
    const parcaB = { r };
    /* TEK İŞ (2026-11-06): tahmin okunur; kişisel deney ayrı bir iştir, kendi katında. */
    const P = LIFEOS.PARCA;
    return String(K.SayfaBolumleri({ act:'gelecek-tab', aria:yz('ays.gelecek.gelecek-bolumleri'), bolumler:[
      { id:'tahmin', ad:yz('ays.gelecek.bolum-tahmin'), govde:html`${P.yer('gelecek', 'y4', K, parcaB, raw)}${P.yer('gelecek', 'y3', K, parcaB, raw)}${P.yer('gelecek', 'y2', K, parcaB, raw)}${yontem(r)}` },
      { id:'deney', ad:yz('ays.gelecek.bolum-deney'), govde:P.yer('gelecek', 'y1', K, parcaB, raw) },
    ] }));
  }

  const handle = {
    async 'gelecek-tab'(el){ K.bolumeGit(el.dataset.tab); },
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
    title:yz('ays.gelecek.gelecek'),
    subtitle(){ return yz('ays.gelecek.sinav-gunune-kadar-bu-gidisl'); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
