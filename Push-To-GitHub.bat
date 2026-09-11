@echo off
title Push Website Mockup Viewer to GitHub
echo ========================================================
echo   DANG DAY CODE LEN GITHUB: phamvantuyenuit2006-oss
echo ========================================================
cd /d "%~dp0"
git add .
git commit -m "feat: update Website Mockup Viewer" 2>nul
git push -u origin main
echo ========================================================
echo   HOAN TAT!
echo ========================================================
pause
