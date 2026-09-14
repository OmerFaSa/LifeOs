@echo off
rem HKM - cift tikla calisir (Windows).
cd /d "%~dp0"
where py >nul 2>nul && (py baslat.py & goto son)
where python >nul 2>nul && (python baslat.py & goto son)
echo python bulunamadi. python.org uzerinden Python 3 kurulmali.
pause
:son
