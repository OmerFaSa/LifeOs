# King'i Claude uygulamasına bağlamak (salt okur)

King, Claude masaüstü uygulamasında bir MCP sunucusu olarak açılır: Claude sohbetinde LifeOS verini okur, hiçbir
şey yazmaz. Sunucu `king/mcp.py`'dir; yalnız Python ve Node ister (ikisi de bu bilgisayarda kurulu).

## 1. Ekle

Önce bu kodun çalışan kopyaya gelmesi gerekir (`C:\Users\ASUS\LifeOS-Sistem`, «Güncelle»). Sonra Claude
uygulamasında **Ayarlar › Geliştirici › Yapılandırmayı düzenle** (`claude_desktop_config.json` açılır). Dosyada
`mcpServers` varsa yalnız içindeki `lifeos-king` satırlarını ekle; yoksa dosya şu olur:

```json
{
  "mcpServers": {
    "lifeos-king": {
      "command": "C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
      "args": ["C:\\Users\\ASUS\\LifeOS-Sistem\\king\\mcp.py"],
      "env": {
        "LIFEOS_NODE": "C:\\Program Files\\nodejs\\node.exe",
        "PYTHONUTF8": "1"
      }
    }
  }
}
```

Kaydet, Claude uygulamasını tamamen kapat (görev çubuğundaki simgeden «Çık») ve yeniden aç.

İsteğe bağlı ortam değişkenleri (yazılmazsa varsayılan): `LIFEOS_VERI_DB` (tek depo,
`%LOCALAPPDATA%\LifeOS\veri\lifeos.db`), `LIFEOS_HESAP_DB` (`%LOCALAPPDATA%\LifeOS\hesap\hesap.db`),
`LIFEOS_ICERIK` (alan, harita ve kalite dosyalarının okunduğu depo; varsayılan sunucunun kendi deposu),
`LIFEOS_KING_CEVRIMDISI` (`"1"` yazılırsa `arastir` hiç web'e çıkmaz; yalnız notlara ve alan içeriğine bakar).

## 2. Çalışıyor mu

- Komut satırında: `python C:\Users\ASUS\LifeOS-Sistem\king\mcp.py --denetle` her aracı bir kez çağırır ve
  yalnız sayıları yazar (kaynak, kayıt sayısı, not sayısı, ölçüt sayısı). İçerik yazmaz.
- Claude'da: sohbet kutusunun araç menüsünde «lifeos-king» ve on bir araç görünür. «Bugün ne var?» ya da
  «Felsefe yol haritamda neredeyim?» diye sor; Claude aracı çağırmadan önce izin ister.
- Görünmüyorsa: Ayarlar › Geliştirici'de sunucunun günlüğü («Open logs»); en sık neden yanlış Python yolu.

## 3. Ne yapar, ne yapmaz

**Yapar (yalnız okur):** on bir araç.

| Araç | Ne yapar | Motor |
|---|---|---|
| `sistem_haritasi` | Nerede ne var, King hangi veriyi görüyor | Kabuk |
| `kayit_ara`, `kayit_oku` | Kayıt bulur, tek kaydı okur | Kayıt |
| `bugun_ozeti` | Bugünün özeti, planı, Gün kaydı | Kayıt |
| `notlar` | Notlar (özel olanlar hariç) | Not |
| `yol_haritasi` | Alanın öğrenme yolu (kapı soruları hariç) | Yol |
| `tekrar_durumu` | Bugün vadesi gelen kartlar | Tekrar |
| `olcum` | Kalite ölçütleri ve bütçe | Kalite |
| `niyet` | King mesajı nasıl anlar: niyet, kural, masadaki kapılar, derleyeceği bağlam (jeton tahmini, bütçe) | King çekirdeği |
| `kayit_cozumle` | «Bugün 20 dakika yürüdüm» → tipli kayıt **önerisi**; hiçbir şey yazmaz | King çekirdeği (kayıt ayrıştırıcı) |
| `arastir` | Notların, alan içeriği ve web'den kaynaklı cevap; bütçeli, önbellekli | Arama |

Her sayı kesinlik etiketiyle gelir (ölçüldü, tahmin, hesaplandı, veri yok, eski kayıt; araştırmada «kaynakta
birebir» ya da «tahmin»); olmayan veri «veri yok» der.

**Yapmaz:** kayıt, not, onay, ayar yazmaz (yazma, tek süreç kurulduktan sonra gelir; `kayit_cozumle` yalnız
LifeOS'un kaydedeceği biçimi gösterir, kaydı LifeOS'ta sen yaparsın). Özel notları (Bilinç'te özel
işaretli düşünceler; Bilinç haritasının izni kapalıysa hepsi) ve sır adlı alanları (anahtar, jeton, parola) hiç
vermez. Canlı veri dosyasını açmaz: her çağrıda kopyasını okur ve siler. Yeni kabuğun bu tarayıcıdaki notlarını,
kartlarını ve yol ilerlemesini henüz göremez (tek depoya göçten sonra görür).

**Bilmen gereken:** King'in okuduğu her şey o sohbette Claude'a gider, yani Anthropic'in sunucusuna. Özel notlar
ve sırlar gitmez; öbür kayıtlar (ölçümler, plan, notlar) sen sordukça gider. Ağa çıkan tek araç `arastir`:
sorunun konusu Vikipedi aramasına gider (en çok 8 ağ çağrısı, 25 sn; sayfa ve arama önbelleği sunucu açık
kaldıkça bellekte, diske yazılmaz). İstemezsen `LIFEOS_KING_CEVRIMDISI` = `"1"`.
