# ============================================================================
# SECURITY VERIFICATION SCRIPT (PowerShell)
# Checks for exposed API keys and sensitive data
# ============================================================================

Write-Host "🔍 Starting Security Verification..." -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# ============================================================================
# 1. Check for Gemini API Key in Frontend Code
# ============================================================================
Write-Host "📋 Checking for exposed Gemini API keys..."

$GeminiPattern = "AIzaSy[A-Za-z0-9_-]{33}"

$GeminiFiles = Get-ChildItem -Path "src" -Include "*.ts","*.tsx","*.js","*.jsx" -Recurse -ErrorAction SilentlyContinue | 
    Select-String -Pattern $GeminiPattern

if ($GeminiFiles) {
    Write-Host "❌ CRITICAL: Gemini API key found in frontend code!" -ForegroundColor Red
    Write-Host "   Found in:" -ForegroundColor Yellow
    $GeminiFiles | ForEach-Object { Write-Host "   - $($_.Path):$($_.LineNumber)" }
    $Errors++
} else {
    Write-Host "✅ No Gemini API keys in frontend" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# 2. Check for Service Role Key
# ============================================================================
Write-Host "📋 Checking for Supabase service_role key..."

$ServiceRolePattern = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.*service_role"

$ServiceFiles = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse -ErrorAction SilentlyContinue | 
    Select-String -Pattern $ServiceRolePattern

if ($ServiceFiles) {
    Write-Host "❌ CRITICAL: Supabase service_role key detected!" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "✅ No service_role keys in frontend" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# 3. Check .env file is in .gitignore
# ============================================================================
Write-Host "📋 Checking .gitignore protection..."

$GitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
if ($GitignoreContent -match "^\.env$") {
    Write-Host "✅ .env files are protected by .gitignore" -ForegroundColor Green
} else {
    Write-Host "❌ .env files NOT protected by .gitignore!" -ForegroundColor Red
    $Errors++
}

Write-Host ""

# ============================================================================
# 4. Check if .env was committed to Git
# ============================================================================
Write-Host "📋 Checking Git history for .env files..."

$GitTrackedEnv = git ls-files 2>$null | Where-Object { $_ -eq ".env" }
if ($GitTrackedEnv) {
    Write-Host "❌ .env file is tracked by Git!" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "✅ .env file not tracked by Git" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# 5. Check Edge Function exists
# ============================================================================
Write-Host "📋 Checking for secure edge function..."

if (Test-Path "api/ai/generate.ts") {
    Write-Host "✅ Secure edge function found" -ForegroundColor Green
    
    $EdgeFunctionContent = Get-Content "api/ai/generate.ts" -Raw
    if ($EdgeFunctionContent -match "process\.env\.GEMINI_API_KEY") {
        Write-Host "  ✅ Edge function uses environment variables" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Edge function might not use env vars correctly" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "⚠️  Edge function not found (api/ai/generate.ts)" -ForegroundColor Yellow
    $Warnings++
}

Write-Host ""

# ============================================================================
# 6. Check frontend calls edge function
# ============================================================================
Write-Host "📋 Checking frontend AI service implementation..."

if (Test-Path "src/services/aiService.ts") {
    $AIServiceContent = Get-Content "src/services/aiService.ts" -Raw
    
    if ($AIServiceContent -match "/api/ai/generate") {
        Write-Host "✅ Frontend calls secure edge function" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend might not use edge function" -ForegroundColor Yellow
        $Warnings++
    }
    
    if ($AIServiceContent -match "new GoogleGenerativeAI") {
        Write-Host "  ❌ Frontend still directly uses Gemini SDK!" -ForegroundColor Red
        $Errors++
    } else {
        Write-Host "  ✅ No direct Gemini SDK usage in frontend" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# 7. Check build output for leaked keys
# ============================================================================
Write-Host "📋 Checking build output (dist/) for exposed keys..."

if (Test-Path "dist") {
    $DistGemini = Get-ChildItem -Path "dist" -Recurse -File -ErrorAction SilentlyContinue | 
        Select-String -Pattern $GeminiPattern
    
    if ($DistGemini) {
        Write-Host "❌ CRITICAL: API keys found in build output!" -ForegroundColor Red
        $Errors++
    } else {
        Write-Host "✅ No API keys in build output" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  dist/ folder not found (run 'npm run build' first)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "=================================="
Write-Host "📊 SECURITY VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "=================================="

if ($Errors -gt 0) {
    Write-Host "❌ FOUND $Errors CRITICAL ISSUE(S)" -ForegroundColor Red
    Write-Host "   Please fix immediately!" -ForegroundColor Yellow
}

if ($Warnings -gt 0) {
    Write-Host "⚠️  FOUND $Warnings WARNING(S)" -ForegroundColor Yellow
    Write-Host "   Review recommended" -ForegroundColor Gray
}

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "   Your application follows security best practices." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=================================="

# Exit with error code if critical issues found
if ($Errors -gt 0) {
    exit 1
}

exit 0
