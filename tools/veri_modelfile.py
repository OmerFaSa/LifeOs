#!/usr/bin/env python3
"""veri/ana_metin.txt -> veri/Modelfile.lifeos-ana (metin degisince yeniden uretmek icin). Ollama'yi calistirmaz."""
from pathlib import Path
KOK = Path(__file__).resolve().parent.parent
t = (KOK / "veri" / "ana_metin.txt").read_text(encoding="utf-8").strip()
assert chr(34) * 3 not in t, "metinde uc tirnak olamaz"
ust = ("# Kullanim (kendiniz calistirin):" + chr(10) + "#   ollama create lifeos-ana -f veri/Modelfile.lifeos-ana" + chr(10) +
       "# Bu dosya python tools/veri_modelfile.py ile uretilir; elle duzenlemeyin." + chr(10) +
       "FROM gemma3:4b" + chr(10) + "PARAMETER temperature 0" + chr(10) + "PARAMETER top_p 0.9" + chr(10) +
       "PARAMETER num_ctx 16384" + chr(10) + "PARAMETER num_predict 2048" + chr(10) + "PARAMETER repeat_penalty 1.05" + chr(10) + chr(10))
(KOK / "veri" / "Modelfile.lifeos-ana").write_text(ust + "SYSTEM " + chr(34) * 3 + chr(10) + t + chr(10) + chr(34) * 3 + chr(10), encoding="utf-8")
print("yazildi: veri/Modelfile.lifeos-ana")
