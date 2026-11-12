#!/usr/bin/env bash
# CI_HATA — bir CI adimini kosar; kalirsa ciktinin ilgili satirlarini TEK bir ::error bildirimine yazar.
# Neden: is kayitlarini indirmek depo yoneticisi yetkisi ister, bildirimler (check-run annotations)
# ise acik API'den okunur; boylece kirmizinin nedeni gh oturumu olmadan da gorulur (2026-11-12).
# Kullanim: bash tools/ci_hata.sh "Baslik" komut [arg...]   (cikis kodu komutunki)
baslik=$1
shift
cikti=$(mktemp)
"$@" 2>&1 | tee "$cikti"
rc=${PIPESTATUS[0]}
if [ "$rc" -ne 0 ]; then
  # once kalan testlerin ve bilinen kirmizi isaretlerin satirlari, sonra son satirlar; HKM istek gunlugu atlanir
  ozet=$( { grep -E '^ *(x |✕ )|KIRMIZI|KAYIP|kayip|BASARISIZ|kaldi|Error|Hata|hata:|! ' "$cikti" | head -n 30; \
            tail -n 12 "$cikti"; } | grep -v '^\[hkm\] "' | tr -d '\r' | sed 's/%/%25/g' | awk 'BEGIN{ORS="%0A"}{print}' )
  echo "::error title=${baslik} (cikis ${rc})::${ozet}"
fi
rm -f "$cikti"
exit "$rc"
