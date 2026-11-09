"""HKM daemon'u, «bugun»u simulasyon gunune sabitleyerek baslatir (core/saat.SABIT).
date.today() kullanan eski yerler gercek gunu gorur: bu da bir bulgudur (HATALAR KO-1)."""
import os, runpy, sys
sys.path.insert(0, os.getcwd())
gun = os.environ.get("SIM_GUN")
if gun:
    from core import saat
    saat.SABIT = gun
sys.argv = ["daemon.py"]
runpy.run_path("daemon.py", run_name="__main__")
