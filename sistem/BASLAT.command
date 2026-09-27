#!/bin/sh
# LifeOS — cift tikla calisir. Uc sistem + HKM + giris sayfasi.
cd "$(dirname "$0")/.." || exit 1   # sistem/ -> deponun koku
if command -v python3 >/dev/null 2>&1; then
  python3 sistem/baslat.py
else
  echo "python3 bulunamadi. macOS: xcode-select --install  ·  Linux: sudo apt install python3"
  read -r _
  exit 1
fi
