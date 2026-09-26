@echo off
rem LifeOS - cift tikla: main dalindan gunceller ve sistemi yeniden baslatir.
rem Veriye dokunmaz; elle degistirilmis dosya varsa guncellemez, soyler.
cd /d "%~dp0"
where py >nul 2>nul && (py guncelle.py --yeniden & goto son)
where python >nul 2>nul && (python guncelle.py --yeniden & goto son)
echo python bulunamadi. python.org uzerinden Python 3 kurulmali.
:son
pause
