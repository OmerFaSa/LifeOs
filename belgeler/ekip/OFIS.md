# Ofis: Claude Code'un Antigravity ekibi (tek sayfa)

> Bu sayfa bu depoda çalışan **Claude Code** içindir: okuyunca ofisi tek
> seferde kullanabilmelisin. Ayrıntı: `belgeler/ekip/gorevler/README.md`.
> Depo sahibinin kararları (2026-10-31): «Antigravity'yi senin için çalışan
> bir ofis gibi yönet; verimli ol, kaliteden ödün verme; kritik işler ve
> tasarım sende.»

## 1. Ne var

PC'de Antigravity (Pro) açık; `tools/ajan.py` onu yerel dil sunucusundan
sürer. Üç rol, her biri bir Antigravity sohbeti:

| Rol | Komut | Ne yapar |
|---|---|---|
| Uygulayıcı | `baslat NNN` | `belgeler/ekip/gorevler/NNN-*.md`'yi kendi klasöründe yapar, test koşar, `ag/NNN-…` dalını push eder |
| Denetçi | `gozden NNN` (teslimde kendiliğinden) | Dalı senden önce inceler: `KARAR: temiz` ya da AGENTS.md §4 biçiminde bulgu |
| Araştırmacı | `sor "…"` | Salt okunur; kanıtla (dosya:satır) cevap |

Koruma kancası (`tools/ajan_kanca.py`, kullanıcı onayıyla kurulu) ajanı
klasörüne kilitler, main'e, ana klasöre, kişisel veriye ve kullanıcının dış
hesaplarına (Notion, Linear, Netlify, Canva, Figma) dokunmasını engeller, iş
bitmeden durmasına izin vermez. İzleme penceresi: `tools/gorev_takip.py`
(kullanıcı için; sen bakma, `rapor` yeter).

## 2. Maliyet modeli: neden bu kurallar

Senin harcaman ≈ **çağrı sayısı × oturum bağlamı**. Her araç çağrısı ve her
bildirim turu bütün bağlamı yeniden okur. Ofis Antigravity'nin kotasını
harcar, seninkini değil; ama yazma, bekleme ve inceleme senin çağrındır.
Ölçülen: 10 satırlık bir işi (004) ofise vermek ~10–12 çağrı tuttu, kendin
yapmak ~6 tutardı. Takvim tekrarı (001, 355 satır) gibi bir işte ofis
~%60–70 kazandırır.

## 3. Ne ofise, ne sende

**Sende kalır:** tasarım ve görsel her şey; `brand/ortak/`, `sistem/`, King,
AGENTS.md §1'e dokunan karar; ~20 satırın altındaki iş (ofis daha pahalı);
son inceleme, tam denetimler (§2), birleştirme, derleme, push.

**Ofise gider:** tanımı net, ölçütü yazılabilen orta ve büyük işler; ve
**döngü işleri**, yani senin bağlamını tur tur şişirecek olanlar:
- kırmızı testi düzelt, koş, tekrar düzelt döngüsü (görev: «şu testler yeşil
  olsun, şu dosyalara dokunma»);
- aynı kalıbın çok dosyada tekrarı (yeniden adlandırma, toplu ekleme);
- veri ya da belge üretimi, uzun tarama ve listeleme (`sor`);
- uzun süren, çıktısı tek satırla özetlenebilen koşular.
Tek bir grep ya da okuma ile çözülecek soruyu `sor`'a verme; kendin yap.

## 4. Akış (en az çağrıyla)

```
# 1) görev dosyalarını yaz (şablon: belgeler/ekip/gorevler/_SABLON.md), commit + push
python tools/ajan.py baslat 005 && python tools/ajan.py baslat 006   # toplu ver
# 2) TEK arka plan çağrısı; bitince tek bildirim gelir. Yoklama yapma.
python tools/ajan.py bekle 005 006        # run_in_background ile
# 3) her iş için tek çağrı: Sonuç + Denetçi + diff
python tools/ajan.py rapor 005
# 4) bulgu varsa aynı sohbete gönder, sonra yine bekle
python tools/ajan.py mesaj 005 "Denetçi bulgusu: … düzelt, testi önce yaz"
# 5) birleştir (git merge --no-ff, -c kimlik), AGENTS.md §2 denetimleri, push
python tools/ajan.py kapat 005
```

- **Toplu ver, toplu incele:** 3–4 görevi birlikte başlat; tek `bekle`, tek
  inceleme turu. İş başına sabit maliyet ~10 çağrıdan ~4'e iner.
- **Aynı sohbette devam kendiliğinden:** rolün sohbeti boşsa, 3'ten az işi
  varsa ve bağlamı <200 bin ise yeni iş oraya gider (kuralları yeniden okumaz).
- **Efor = model:** düşük `flash_lite` (mekanik iş), orta `flash` (çoğu iş),
  yüksek `pro` (mantık ağır, ör. takvim tekrar kuralları). Görev dosyasında
  `**Efor:**` satırı.
- **Kendi oturumun uzadıysa** (bağlam >~200 bin) kullanıcıya yeni oturum öner:
  her şey dosyada ve hafızada, taze oturum aynı işi ~10 kat ucuza yapar.

## 5. Kalite kuralları (pazarlık yok)

- Denetçi'nin «temiz»i birleştirme izni değildir: diff'i oku, §2 denetimlerini koş.
- Ucuz modelin iddiasını doğrula (Araştırmacı bir aracın testi «yok» dedi, vardı).
- Görev dosyası: «şu girdiyle şu çıktı» biçiminde kabul ölçütü, «Dokunma»
  listesi, koşulacak testler. Belirsiz görev yazma; ajan tahmin eder.
- Bulguyu aynı sohbete geri gönder (001'de RECURRENCE-ID böyle düzeldi).

## 6. Bilinen tuzaklar

- Antigravity'nin kabuğu ajanın klasöründe değil `C:\Users\ASUS\LifeOs`'ta
  açılır; kanca `Set-Location` ekler. Kanca kapalıysa ajan main'e yazabilir
  (2026-10-31'de oldu, geri alındı).
- Kancada PreToolUse'a boş cevap (`{}`) = reddet; bizim olmayan sohbete
  `{"decision":"ask"}`.
- Pro, arka planda testi başlatıp «bekleniyor» deyip durabilir; kanca devam
  ettirir. «turu bitti» ≠ teslim; `rapor` dalı gösterir.
- Ajan worktree'sinde `olucss.py` güvenilmez (derleme dosyası yok); main'de ölç.
- Antigravity kapalıysa komutlar «Antigravity açık değil» der; kullanıcıdan aç.
