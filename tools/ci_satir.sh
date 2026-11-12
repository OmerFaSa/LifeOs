#!/usr/bin/env bash
# CI_SATIR — cok satirli bir CI adiminin (run: |) her satirini ayri kosar; kalan her satiri ci_hata.sh
# ile kendi ::error bildirimine yazar ve ilk kirmizida durmaz. Neden: «Ofis kabul ve birim testleri»
# ajan.py'nin satir ekledigi bir run: | blogudur, ci_hata.sh'a sarilamiyordu; kirmizinin hangi testten
# geldigi is kaydi olmadan gorulmuyordu (2026-11-13).
# Kullanim (adimda):  shell: bash tools/ci_satir.sh {0}    (Actions {0}'a run: metninin dosyasini verir)
rc=0
while IFS= read -r satir || [ -n "$satir" ]; do
  [ -z "${satir// /}" ] && continue
  bash "$(dirname "$0")/ci_hata.sh" "$satir" bash -c "$satir" || rc=1
done < "$1"
exit "$rc"
