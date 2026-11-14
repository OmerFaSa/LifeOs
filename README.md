<h1 align="center">LifeOS</h1>

<p align="center">
  Tek kişi, tek sistem, tek veri: öğrenme, sağlık ve gündelik kayıt bir uygulamada.<br/>
  Tarayıcıda ve telefonda çalışır; hesabın ve verin senin bilgisayarında durur.
</p>

## LifeOS nedir?

LifeOS, tek bir kişinin gündelik hayatını yöneten tek bir uygulamadır
(2026-11-12 kararı, `belgeler/ekip/sadelesme/plan.html`). Katmanları:

- **Kabuk** (`kabuk/`): tam ekran çerçeve, gezinme (basılı tut halkası, komut çubuğu),
  Bugün, Ayarlar, Onaylar, Tanışma.
- **Alanlar** (`alan/`): Akademik, Dil, Felsefe, Tarih, Müzik, Okuma ve yazı, Beslenme,
  Hareket, Uyku, Tahlil; her biri aşama, ünite, ders ve kapı olarak JSON içerik.
- **Motorlar** (`motor/`): Yol, Tekrar (FSRS), Soru, Kayıt, Plan, Not.
- **King** (`king/`): niyet, bağlam, on iki kapı, Arama motoru, MCP ucu
  (Claude uygulamasından okur).
- **Çekirdek** (`sistem/`): tek kapı (`sistem/tekkapi.py`, tek adres, tek süreç),
  hesap ve eşitleme, tek depo, göç, ayar; Merkez çekirdeği (`HKM/core`) aynı süreçte
  `/api/hkm/` altında.
- **Kalite** (`kalite/`): on üç eğri, karmaşıklık ve hız bütçesi, katman denetimi.

Ortak kural: **sayıyı ve kararı kod üretir; yapay zekâ yalnız açıklar.** Model
kapalıyken de sistem çalışır.

## Başlarken

| | Ne yapılır |
|---|---|
| **Aç** | `BASLAT.bat` (Windows) ya da `python sistem/baslat.py`. Tarayıcıda <http://127.0.0.1:4180> açılır, kök yeni kabuğa gider. |
| **Hesap, cihazlar, güncelleme** | <http://127.0.0.1:4180/kartlar/> (kabukta Ayarlar › Hesap ve sistem) ya da `GUNCELLE.bat` |
| **Telefon ve tablet** | Yalnız Tailscale: Hesap › Bağlantılar › Her yerden erişim; telefonda Tailscale adresini aç, ana ekrana ekle. |
| **Durdur** | `python sistem/baslat.py --dur` |

## Denetimler

Kabuk, motor, King ve kalite testleri kendi dosyalarında koşar
(`node kabuk/kabuk.test.js`, `python king/niyet_test.py` …); tek kapı
`python tools/tekkapi_test.py`, gerçek tarayıcıda gezi `node tools/kabuk_gez.js`
(önce `cd tools && npm ci`), Merkez çekirdeği `cd HKM && python -m tests.run`,
katman ve bütçe `python kalite/katman.py`, `python kalite/olcum.py --denetle`.
Tam liste: `AGENTS.md` §2, CI: `.github/workflows/ci.yml`.

## Belgeler

`belgeler/TEKNIK.md` (ayrıntı), `belgeler/DIZIN.md` (bütün belgeler),
`tools/DIZIN.md` (araçlar), `AGENTS.md` (ajan kuralları).

## Eski sistem

Dört ayrı sistem (AYS, SPİ, ESP ve HKM yüzü) kapanışta (Faz 7) kalktı; verileri
göçle tek depoya taşındı. Kodları kapanıştan önceki son commit'te durur
(`c293d421`); ayrıntı `belgeler/ekip/sadelesme/faz7-kapanis.md`.
