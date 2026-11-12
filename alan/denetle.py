"""Mufredat denetcisi (yalniz standart kutuphane).

Kullanim: python alan/denetle.py alan/felsefe
Cikis 0 = temiz, 1 = Turkce hata satirlari. Kurallar: alan/SEMA.md.
"""
import json
import os
import sys

DURUM = {"taslak", "onayli"}
YAZAN = {"model", "insan"}
KAYNAK_TUR = {"gemini", "kurum", "kitap", "url", "depo"}
DOGRULAMA = {"dogrulanmamis", "kaynakli", "denetlendi"}
HARF = "ABCDE"


def _bos_metin(x):
    return not isinstance(x, str) or not x.strip()


class Denetci:
    def __init__(self):
        self.hatalar = []
        self.kimlikler = {}  # id -> dosya
        self.onkosul = {}    # id -> [id]
        self.sayi = {"dosya": 0, "asama": 0, "unite": 0, "ders": 0, "alistirma": 0, "kaynak": 0}

    def hata(self, yer, mesaj):
        self.hatalar.append(f"{yer}: {mesaj}")

    def zorunlu(self, yer, nesne, alanlar):
        tamam = True
        for a in alanlar:
            if a not in nesne:
                self.hata(yer, f"zorunlu alan eksik: {a}")
                tamam = False
        return tamam

    def kimlik(self, dosya, nesne, beklenen_onek=None):
        i = nesne.get("id")
        if _bos_metin(i):
            self.hata(dosya, "kimliksiz öğe (id boş ya da yok)")
            return None
        if i in self.kimlikler:
            self.hata(f"{dosya} {i}", f"yinelenen kimlik (ilk geçtiği yer: {self.kimlikler[i]})")
        else:
            self.kimlikler[i] = dosya
        if beklenen_onek and not i.startswith(beklenen_onek + "."):
            self.hata(f"{dosya} {i}", f"kimlik üst öğenin altında değil (beklenen önek: {beklenen_onek}.)")
        return i

    def onkosul_al(self, yer, i, nesne):
        ok = nesne.get("onKosul")
        if not isinstance(ok, list) or not all(isinstance(x, str) for x in ok):
            self.hata(yer, "onKosul bir kimlik listesi olmalı")
            ok = []
        if i:
            self.onkosul[i] = ok

    def icerik_durumu(self, yer, nesne, kaynak_idler, kaynak_sart):
        d = nesne.get("durum")
        if d not in DURUM:
            self.hata(yer, f"durum geçersiz: {d!r} (taslak | onayli)")
        if d == "onayli" and (_bos_metin(nesne.get("onaylayan")) or _bos_metin(nesne.get("onayTarihi"))):
            self.hata(yer, "onayli içerikte onaylayan ve onayTarihi zorunlu")
        if nesne.get("yazan") not in YAZAN:
            self.hata(yer, f"yazan geçersiz: {nesne.get('yazan')!r} (model | insan)")
        k = nesne.get("kaynak")
        if not isinstance(k, list) or not k:
            if kaynak_sart:
                self.hata(yer, "kaynaksız (kaynak listesi boş ya da yok)")
            return
        for x in k:
            if x not in kaynak_idler:
                self.hata(yer, f"bilinmeyen kaynak: {x!r}")

    def alistirma(self, dosya, a, onek, kaynak_idler, kapi=False):
        yer = f"{dosya} {a.get('id', '?')}"
        self.sayi["alistirma"] += 1
        self.kimlik(dosya, a, onek)
        self.zorunlu(yer, a, ["tur", "soru", "durum", "yazan", "kaynak"])
        if _bos_metin(a.get("soru")):
            self.hata(yer, "soru metni boş")
        tur = a.get("tur")
        if kapi and tur != "secmeli":
            self.hata(yer, "kapı sorusu secmeli olmalı (puanlanabilir)")
        if tur == "secmeli":
            sec = a.get("sec")
            if not isinstance(sec, list) or not 2 <= len(sec) <= 5 or any(_bos_metin(s) for s in sec):
                self.hata(yer, "sec 2-5 boş olmayan seçenek olmalı")
                sec = []
            dg = a.get("dogru")
            if dg is None or dg == "":
                self.hata(yer, "cevap anahtarı yok (dogru)")
            elif not (isinstance(dg, str) and len(dg) == 1 and dg in HARF[: len(sec)]):
                self.hata(yer, f"cevap anahtarı seçeneklerle uyuşmuyor: {dg!r}")
        elif tur == "acik":
            if _bos_metin(a.get("dogru")):
                self.hata(yer, "cevap anahtarı yok (dogru: örnek cevap)")
            ol = a.get("olcut")
            if not isinstance(ol, list) or not ol:
                self.hata(yer, "acik alıştırmada olcut listesi zorunlu")
        else:
            self.hata(yer, f"tur geçersiz: {tur!r} (secmeli | acik)")
        self.icerik_durumu(yer, a, kaynak_idler, kaynak_sart=True)

    def kapi(self, dosya, sahip_id, k, kaynak_idler):
        yer = f"{dosya} {sahip_id} kapı"
        if not isinstance(k, dict):
            self.hata(yer, "kapi bir nesne olmalı")
            return
        e = k.get("esik")
        if isinstance(e, bool) or not isinstance(e, (int, float)) or not 0 < e <= 1:
            self.hata(yer, f"esik 0'dan büyük, 1'den küçük ya da eşit olmalı: {e!r}")
        sorular = k.get("sorular")
        if not isinstance(sorular, list) or len(sorular) < 3:
            self.hata(yer, "kapıda en az 3 soru olmalı")
            sorular = sorular if isinstance(sorular, list) else []
        for s in sorular:
            self.alistirma(dosya, s, sahip_id, kaynak_idler, kapi=True)

    def dosya(self, yol):
        ad = os.path.basename(yol)
        self.sayi["dosya"] += 1
        try:
            with open(yol, encoding="utf-8") as f:
                v = json.load(f)
        except (OSError, ValueError) as e:
            self.hata(ad, f"JSON okunamadı: {e}")
            return
        if not isinstance(v, dict):
            self.hata(ad, "kök bir nesne olmalı")
            return
        self.sayi["asama"] += 1
        if not self.zorunlu(ad, v, ["sema", "alan", "id", "sira", "ad", "hedef", "onKosul", "kapi", "kaynaklar", "uniteler"]):
            return
        if v["sema"] != 1:
            self.hata(ad, f"bilinmeyen şema sürümü: {v['sema']!r}")
        aid = self.kimlik(ad, v, v["alan"])
        self.onkosul_al(f"{ad} {aid}", aid, v)
        kaynak_idler = set()
        if not isinstance(v["kaynaklar"], list) or not v["kaynaklar"]:
            self.hata(ad, "kaynaklar listesi boş")
        for k in v["kaynaklar"] or []:
            self.sayi["kaynak"] += 1
            kyer = f"{ad} kaynak {k.get('id', '?')}"
            self.zorunlu(kyer, k, ["id", "ad", "tur", "yol", "dogrulama"])
            if k.get("id") in kaynak_idler:
                self.hata(kyer, "yinelenen kaynak kimliği")
            kaynak_idler.add(k.get("id"))
            if k.get("tur") not in KAYNAK_TUR:
                self.hata(kyer, f"tur geçersiz: {k.get('tur')!r}")
            if k.get("dogrulama") not in DOGRULAMA:
                self.hata(kyer, f"dogrulama geçersiz: {k.get('dogrulama')!r}")
        self.kapi(ad, aid, v["kapi"], kaynak_idler)
        if not isinstance(v["uniteler"], list) or not v["uniteler"]:
            self.hata(ad, "uniteler listesi boş")
            return
        for u in v["uniteler"]:
            self.sayi["unite"] += 1
            uyer = f"{ad} {u.get('id', '?')}"
            if not self.zorunlu(uyer, u, ["id", "ad", "onKosul", "kapi", "dersler"]):
                continue
            uid = self.kimlik(ad, u, aid)
            self.onkosul_al(uyer, uid, u)
            self.kapi(ad, uid, u["kapi"], kaynak_idler)
            if not isinstance(u["dersler"], list) or not u["dersler"]:
                self.hata(uyer, "dersler listesi boş")
                continue
            for d in u["dersler"]:
                self.sayi["ders"] += 1
                dyer = f"{ad} {d.get('id', '?')}"
                self.zorunlu(dyer, d, ["id", "ad", "onKosul", "durum", "yazan", "kaynak", "ozet", "metin", "alistirmalar"])
                did = self.kimlik(ad, d, uid)
                self.onkosul_al(dyer, did, d)
                self.icerik_durumu(dyer, d, kaynak_idler, kaynak_sart=True)
                m = d.get("metin")
                if not isinstance(m, list) or not m or any(_bos_metin(p) for p in m):
                    self.hata(dyer, "metin boş olmayan paragraf listesi olmalı")
                for a in d.get("alistirmalar") or []:
                    self.alistirma(ad, a, did, kaynak_idler)

    def bag_denetimi(self):
        for i, ok in self.onkosul.items():
            for x in ok:
                if x not in self.kimlikler:
                    self.hata(i, f"bilinmeyen önkoşul: {x}")
                elif x == i:
                    self.hata(i, "öğe kendisine önkoşul")
        # dongu: renkli DFS (0 beyaz, 1 gri, 2 siyah)
        renk = {}
        for kok in self.onkosul:
            if renk.get(kok):
                continue
            yigin = [(kok, iter(self.onkosul.get(kok, [])))]
            renk[kok] = 1
            yol = [kok]
            while yigin:
                dugum, it = yigin[-1]
                ileri = next(it, None)
                if ileri is None:
                    renk[dugum] = 2
                    yigin.pop()
                    yol.pop()
                    continue
                if ileri not in self.onkosul:
                    continue
                if renk.get(ileri) == 1:
                    dongu = yol[yol.index(ileri):] + [ileri]
                    self.hata(ileri, "önkoşul döngüsü: " + " → ".join(dongu))
                elif not renk.get(ileri):
                    renk[ileri] = 1
                    yol.append(ileri)
                    yigin.append((ileri, iter(self.onkosul.get(ileri, []))))


def denetle_klasor(klasor):
    d = Denetci()
    if not os.path.isdir(klasor):
        d.hata(klasor, "klasör yok")
        return d.hatalar, d.sayi
    dosyalar = sorted(f for f in os.listdir(klasor) if f.endswith(".json"))
    if not dosyalar:
        d.hata(klasor, "hiç .json aşama dosyası yok")
    for f in dosyalar:
        d.dosya(os.path.join(klasor, f))
    d.bag_denetimi()
    return d.hatalar, d.sayi


def main(argv):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if len(argv) != 2:
        print("Kullanım: python alan/denetle.py <alan klasörü>")
        return 1
    hatalar, s = denetle_klasor(argv[1])
    for h in hatalar:
        print("✕ " + h)
    ozet = (f"{s['dosya']} dosya, {s['asama']} aşama, {s['unite']} ünite, {s['ders']} ders, "
            f"{s['alistirma']} alıştırma, {s['kaynak']} kaynak")
    if hatalar:
        print(f"{len(hatalar)} hata · {ozet}")
        return 1
    print(f"Temiz · {ozet}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
