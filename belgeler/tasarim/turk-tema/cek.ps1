# Demo sahnesini görünmez Edge ile PNG'ye çeker. Örnek: .\cek.ps1 "tur=kocatepe&vakit=dogum" kocatepe.png
param([string]$adres, [string]$cikti, [int]$sure = 1500)
$edge = @("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", "C:\Program Files\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$yol = Join-Path $PSScriptRoot "cekim\$cikti"
New-Item -ItemType Directory -Force (Split-Path $yol) | Out-Null
& $edge --headless=new --disable-gpu --hide-scrollbars --window-size=1300,900 --virtual-time-budget=$sure "--screenshot=$yol" "http://127.0.0.1:4611/#$adres" 2>$null | Out-Null
$yol
