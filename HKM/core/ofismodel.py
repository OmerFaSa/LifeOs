# -*- coding: utf-8 -*-
"""OFIS MODELI — modullerin ofis ajanlari dil modelini HKM'den kullanir.

Kullanici (2026-10-20): «SPI ve ESP: model ayarlari modulun kendi
ayarlarinda da var. Bu tur ayarlarin hepsi HKM'de olmali.» Model, anahtar
ve butce TEK yerde durur: HKM › Modeller. Modul anahtar tutmaz; ofis
sohbetinin cumlesini HKM'ye sordurur.

Sozler:
  1. ROL SUNUCUDA SABITTIR. Modul yalniz adini soyler («spi»); kullanilan
     kademe «<modul>.sohbet»tir ve atama yoksa ustune (alt patron, sonra
     King) bakar (core/models.py resolve). Istemci rol secemez.
  2. BUTCE VE DEFTER AYNI. Cagri ai.ask'ten gecer: tavan, harcama defteri,
     merdiven ve «olcum uydurma» denetimi King'inkiyle aynidir. Baglam
     modulun kural motoru brifingidir; cevaptaki sayi onunla denetlenir.
  3. HKM YAZMAZ. Bu yol yalniz cumle doner; hicbir module ve hicbir
     kayda yazmaz (AGENTS §1.4). Model yoksa ya da cagri dusarse sebep
     doner, modul kendi kural cumlesine duser.
  4. SINIRLI GOVDE. Istem, mesaj sayisi ve uzunlugu kesilir: buyuk govde
     butceyi ve bellegi sessizce yemesin."""

from core import ai, models

MODULLER = ("ays", "spi", "esp")
# Ofisin kullanabilecegi yetenekler (core/models.py YETENEKLER). «gorsel»
# fis, ogun fotografi, tahlil gibi GORUNTU OKUMA isidir: cikti modulun
# kendi kodunda dogrulanan bir JSON'dur, bu yuzden belge denetiminden gecer
# (sayi goruntunun kendisinden gelir; «olcum uydurma» denetimi onu dusururdu).
YETENEKLER = ("sohbet", "gorsel")
EN_UZUN_SISTEM = 24000
EN_UZUN_MESAJ = 4000
EN_COK_MESAJ = 12


def rol_of(modul, yetenek="sohbet"):
    m = str(modul or "").lower()
    y = yetenek if yetenek in YETENEKLER else None
    return "%s.%s" % (m, y) if m in MODULLER and y else None


def durum(cfg, modul, yetenek="sohbet"):
    """Modulun ofis modeli hazir mi; hangi model, nereden (miras)."""
    rol = rol_of(modul, yetenek)
    if not rol:
        return {"ok": False, "reason": "modul", "note": "Bilinmeyen modül."}
    h = ai.hazir_mi(cfg, rol)
    a = models.resolve(cfg, rol) or {}
    return {"ok": bool(h.get("ok")), "reason": h.get("reason", ""), "note": h.get("note", ""),
            "rol": rol, "model": a.get("model", ""), "provider": a.get("provider_label", ""),
            "inherited": bool(a.get("inherited")), "from": a.get("from") or ""}


def _mesajlar(ham):
    out = []
    for m in list(ham or [])[-EN_COK_MESAJ:]:
        if not isinstance(m, dict):
            continue
        rol = "assistant" if m.get("role") in ("assistant", "agent") else "user"
        metin = str(m.get("text") or m.get("content") or "")[:EN_UZUN_MESAJ]
        if metin.strip():
            out.append({"role": rol, "content": metin})
    return out


def cevap(con, cfg, govde, transport=None):
    """Ofis ajaninin cumlesi. Doner: { ok, text, model, provider } ya da
    { ok:False, reason, note }."""
    g = govde or {}
    yetenek = g.get("yetenek") or "sohbet"
    rol = rol_of(g.get("modul"), yetenek)
    if not rol:
        return {"ok": False, "reason": "modul", "note": "Bilinmeyen modül."}
    mesajlar = _mesajlar(g.get("mesajlar"))
    if not mesajlar or mesajlar[-1]["role"] != "user":
        return {"ok": False, "reason": "bos", "note": "Son mesaj kullanıcıdan olmalı."}
    sistem = str(g.get("sistem") or "")[:EN_UZUN_SISTEM]
    baglam = str(g.get("baglam") or "")[:EN_UZUN_SISTEM]
    gorseller = g.get("gorseller") if yetenek == "gorsel" else None
    if yetenek == "gorsel" and not gorseller:
        return {"ok": False, "reason": "gorsel", "note": "Görsel yok."}
    r = ai.ask(con, cfg, rol, "ofis-" + yetenek, mesajlar, baglam=baglam, sistem=sistem,
               transport=transport, gorseller=gorseller,
               denetim="belge" if yetenek == "gorsel" else "olcum")
    return {k: r.get(k) for k in ("ok", "text", "model", "provider", "reason", "note", "truncated")}
