@echo off
cd /d "%~dp0"
echo Potong berjalan di http://127.0.0.1:4173
echo Tekan Ctrl+C untuk menghentikan server.
start "" http://127.0.0.1:4173
node server.js
pause
