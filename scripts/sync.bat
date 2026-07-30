@echo off
REM Sync script for Knowledge Base Project
REM Usage: sync.bat (runs from project root)

cd /d "%~dp0"
echo ========================================
echo 🔄 Synchronizing with GitHub...
echo ========================================

REM Check if in git repository
if not exist ".git" (
    echo ❌ Error: Not a Git repository!
    pause
    exit /b 1
)

REM Stage all changes
git add . -A

REM Commit with timestamp
set TIMESTAMP=%DATE% %TIME%
echo %TIMESTAMP% > commit_msg.txt
git commit -F commit_msg.txt -m "Auto-sync: %TIMESTAMP%" 2>nul || (
    echo ⚠️ No changes to commit, skipping commit...
)

REM Push to main branch
echo Uploading changes to GitHub...
git push origin main 2>nul || (
    echo ❌ Push failed. Please check your network and GitHub credentials.
    del commit_msg.txt 2>nul
    pause
    exit /b 1
)

REM Cleanup
del commit_msg.txt 2>nul

echo ========================================
echo ✅ Sync completed successfully!
echo ========================================

pause
