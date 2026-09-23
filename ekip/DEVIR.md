# Devir notu — sıradaki Claude için (2026-09-23)

Dal: `claude/remove-videos-use-images-9bmd1f` · push: `git push -u origin claude/remove-videos-use-images-9bmd1f`
Önce `AGENTS.md`'yi oku (doktrin). Kullanıcı Türkçe konuşur; kurallar:
«gereksiz test yapma» (yalnız dokunduğun sistemin birim testleri + gerekiyorsa bir duman),
«kendi fikrini geliştirmeden önce söyle», «lokal ağa karışma», şirket/YouTube ofisi başka
Claude'un işi. PR açma (istenmedi).

## Bitenler (hepsi push edildi, HKM 474/474)

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

## Yarım kalan: W5 — Telegram'dan istek ve TESLİM

Telegram'dan gelen metin zaten `gelen.isle → sohbet.konus(gorevli="king")` yolundan
geçiyor; yani araştırma/plan/ürün isteği Telegram'dan da emre dönüşüyor. Eksik olan:
**iş bitince sonucun aynı kanala teslimi**.

Yapıldı (son commit, testler yeşil ama teslim henüz bağlı DEĞİL):
- `db.py` göçleri: `is_emirleri.kanal`, `is_emirleri.hedef`, `outbox.ek`.
- `channels.send_document(cfg, name, dosya_adi, bayt, mime, caption, to, transport)` —
  Telegram `sendDocument` (multipart, stdlib); WhatsApp → `reason: unsupported`.
- `outbox.enqueue(..., ek={"kayit_id", "bicim"})`; `flush` ek'li satırı
  `_belge_gonder` ile kayıttan PDF (olmazsa HTML) basıp yollar.

Yapılacak:
1. `king.emir_ac(..., kanal=None, hedef=None)` → INSERT'e iki sütun.
2. `king._teslim(con, e, metin, kayit_id, yalniz_belge=False)`: `e["kanal"]` telegram/whatsapp
   ise `outbox.enqueue(kanal, "emir:%d:%s" % (id, durum), gun, metin, target=hedef)` ve
   bitti + kayıt varsa (telegram) ikinci satır `kind "emir:%d:belge"`, `ek={"kayit_id", "bicim": "pdf"}`,
   text = kısa açıklama (≤1024, caption). `esitle` bitti/kismen/hata/bekliyor'da çağırsın;
   `emir_ac` depo yolunda (hemen bitti) yalnız belge satırı (metin zaten sohbet cevabı).
3. `sohbet.konus(..., hedef=None)`; `plani_devret/urunu_devret/arastirmayi_devret`
   kanal (yalnız telegram/whatsapp; "local" değil) ve hedefi `emir_ac`'a geçirsin.
   `gelen.isle` → `konus(..., hedef=m.get("from"))`.
4. Test (`tests/test_kanal.py` ya da yeni dosya): telegram açık cfg
   (`{"channels": {"telegram": {"enabled": True, "bot_token": "B", "allow_from": ["7"]}}}`),
   `gelen.isle` ile «Osmanlı kuruluşu hakkında pankart hazırla» → emir kanal=telegram;
   sahte model (`tests/test_urun.py::_UrunModel`) ile `bam.ilerlet`+`king.esitle` 2 tik →
   `outbox.flush(transport=sahte)` → sendMessage + sendDocument (%PDF ya da dosya adı).
5. Commit + push; `ekip/PLAN.md`'ye W5 satırı.

## Sonra: W6
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
