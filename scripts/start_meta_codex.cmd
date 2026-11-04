@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_meta_codex.ps1" %*
exit /b %ERRORLEVEL%
