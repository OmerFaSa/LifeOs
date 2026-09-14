#!/bin/sh
# HKM — cift tikla calisir (macOS: Finder'da cift tik; Linux: calistir).
# Tek is yapar: kendi klasorune gecer ve baslat.py'yi kosturur.
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 baslat.py
else
  echo "python3 bulunamadi. macOS: xcode-select --install  ·  Linux: sudo apt install python3"
  read -r _
  exit 1
fi
