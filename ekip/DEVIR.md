# Devir notu — sıradaki Claude için (2026-09-23)

Dal: W5 `claude/epic-keller-uz103z` dalında (bu dal `claude/remove-videos-use-images-9bmd1f`'in
ileri sarılmış hâlidir; öteki dal bu commit'e hızlı ileri alınabilir).
Önce `AGENTS.md`'yi oku (doktrin). Kullanıcı Türkçe konuşur; kurallar:
«gereksiz test yapma» (yalnız dokunduğun sistemin birim testleri + gerekiyorsa bir duman),
«kendi fikrini geliştirmeden önce söyle», «lokal ağa karışma», şirket/YouTube ofisi başka
Claude'un işi. PR açma (istenmedi).

## Bitenler (hepsi push edildi)

- **B1 Depolama Bürosu** `HKM/core/depo.py`: her iş önce buradan geçer; konu anahtarı,
  kaynağın cümle izi (`parmak`), canlı güncellik ölçümü (`web.getir(taze=True)`), karar
  `yeni/guncel/guncelle`, günlük depo denetimi (`bam_depo_rapor`, `GET /api/bam/depo`).
- **King araştırmaz** (kullanıcı kararı): sohbette «X'i araştır» → `bam.arastirma` iş emri
  (`core/sohbet.py` `arastirma_konusu/arastirmayi_devret`). King'in web'e tek çıkışı
  `king.bekci` (ritimde, `web.guncellik_gun`=7 günde bir, tikte en çok 1 kayıt).
- **B2 Araştırma Bürosu**: ajan izi (`adim["iz"]`), kaynak türü + kanıt gücü (kod),
  Derin Araştırmacı tek ek tur, güncellemede önceki sürümle fark (`degisiklikler`).
- **B3 Planlama Bürosu v2** `HKM/core/program.py`: `bam.plan` (her konu için haftalık
  program). Sohbette «X için N haftalık plan yap, haftada M saat».
- **B4 Üretim Bürosu** `HKM/core/editor.py`: Editör + Kalite Kontrol (kod); depodaki
  güncel araştırma ürüne «bilgi» olur. Sohbette «X hakkında pankart hazırla» → `bam.urun`.
- Ofis adları «Büro» oldu (id'ler aynı: kayit/arastirma/planlama/uretim).

## Biten: W5 — Telegram'dan istek ve TESLİM

- `king.emir_ac(..., kanal, hedef)`: yalnız telegram/whatsapp saklanır; açık aynı
  emir kanalsızsa soranın kanalı ona yazılır.
- `king._teslim`: eşitleme bitti/kısmen/bekliyor/hata'da metni `emir:<id>:<durum>`
  satırıyla, bitmiş kaydı Telegram'da `emir:<id>:belge` satırıyla (ek: PDF) kuyruğa
  yazar; WhatsApp'ta «belge gönderilemiyor» mesaja eklenir. Depo yolunda yalnız belge.
- `sohbet.konus(..., hedef)` ve üç `*_devret` kanalı geçirir; `gelen.isle` hedef=from.
- Testler `tests/test_urun.py`: Telegram'dan pankart → 2 tik → sendMessage +
  sendDocument; tekrar eşitleme boş; aynı istek depodan → yalnız belge; WhatsApp
  ve ekran emri. HKM 476/476.

## Sıradaki: W6
- Modüller `urun.add` teklifini alsın (AYS/SPİ/ESP beacon INTENT_KINDS; ortak depo
  `brand/ortak/` → `python3 tools/ortak.py --yay`), ürün sandbox iframe'de görünsün.
- HKM web yüzü (`HKM/web/index.html`): Ofis ekranında kayıt indirme (PDF/HTML/SVG,
  `GET /api/bam/kayit/<id>/cikti?bicim=..&indir=1`, fetch+blob), ajan izi (`adimlar[].iz`),
  depo raporu, web ayarları ekranı (açık/kapalı, sağlayıcılar, anahtarlar, günlük sınır,
  `guncellik_gun`, «dene» → `POST /api/web/dene`). Sonra `node tools/yuz.js`.

## Komutlar
- HKM: `cd HKM && python3 -m tests.run` (Chromium: `CHROMIUM_PATH=/opt/pw-browsers/chromium`,
  yüz: `NODE_PATH=/home/user/LifeOs/AYS/node_modules node tools/yuz.js`)
- Modül: `python3 build.py` sonra `node tools/runtests.js` / `node tools/smoke.js`
- Commit sonu: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` +
  `Claude-Session: https://claude.ai/code/session_01GXrLFmG4yrUtHy1w4ZtK5J`
