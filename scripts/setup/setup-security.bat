@echo off
REM ============================================================================
REM INTERCEPTOR Security Setup Script (Windows)
REM ============================================================================
REM This script sets up encryption and security for INTERCEPTOR
REM Run this after initial installation
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         INTERCEPTOR Security Setup                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Step 1: Generate Encryption Key
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 1: Generating Encryption Key
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

for /f "tokens=*" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set ENCRYPTION_KEY=%%i

echo Generated Encryption Key:
echo   %ENCRYPTION_KEY%
echo.

REM Step 2: Create .env.local if it doesn't exist
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 2: Setting up Environment Variables
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if not exist .env.local (
    echo Creating .env.local from template...
    copy .env.security.example .env.local
    echo ✅ Created .env.local
) else (
    echo ⚠️  .env.local already exists, skipping creation
)

REM Add encryption key to .env.local
echo Adding ENCRYPTION_KEY to .env.local...
powershell -Command "(Get-Content .env.local) -replace 'ENCRYPTION_KEY=.*', 'ENCRYPTION_KEY=%ENCRYPTION_KEY%' | Set-Content .env.local"
echo ✅ Updated ENCRYPTION_KEY in .env.local

echo.
echo ⚠️  IMPORTANT: Edit .env.local and add your Cloudinary and Supabase credentials:
echo    - CLOUDINARY_CLOUD_NAME
echo    - CLOUDINARY_API_KEY
echo    - CLOUDINARY_API_SECRET
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_ANON_KEY
echo    - SUPABASE_SERVICE_ROLE_KEY
echo.

REM Step 3: Install dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 3: Installing Security Dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

call npm install bcrypt cloudinary formidable
echo ✅ Security dependencies installed
echo.

REM Step 4: Display next steps
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Setup Complete! Next Steps:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 1. Edit .env.local with your credentials:
echo    notepad .env.local
echo.
echo 2. Run Supabase schema migration:
echo    - Go to Supabase Dashboard
echo    - SQL Editor → New Query
echo    - Copy contents of scripts/setup/supabase_security_schema.sql
echo    - Run
echo.
echo 3. Start your application:
echo    npm run dev
echo.
echo 4. Read the security guide:
echo    type SECURITY_IMPLEMENTATION_GUIDE.md
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ✅ Security setup complete!                                  ║
echo ║  Your encryption key has been generated and stored.           ║
echo ║  Keep .env.local secure and never commit it to git.           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

pause
