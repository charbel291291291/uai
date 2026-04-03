#!/bin/bash

# ============================================================================
# SECURITY VERIFICATION SCRIPT
# Checks for exposed API keys and sensitive data
# ============================================================================

echo "🔍 Starting Security Verification..."
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Check for Gemini API Key in Frontend Code
# ============================================================================
echo "📋 Checking for exposed Gemini API keys..."

GEMINI_PATTERN="AIzaSy[A-Za-z0-9_-]{33}"

# Search in src directory
if grep -r "$GEMINI_PATTERN" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Gemini API key found in frontend code!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No Gemini API keys in frontend${NC}"
fi

# ============================================================================
# 2. Check for Service Role Key
# ============================================================================
echo ""
echo "📋 Checking for Supabase service_role key..."

SERVICE_ROLE_PATTERN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.*service_role"

if grep -r "$SERVICE_ROLE_PATTERN" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Supabase service_role key detected!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No service_role keys in frontend${NC}"
fi

# ============================================================================
# 3. Check .env file is in .gitignore
# ============================================================================
echo ""
echo "📋 Checking .gitignore protection..."

if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .env files are protected by .gitignore${NC}"
else
    echo -e "${RED}❌ .env files NOT protected by .gitignore!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# 4. Check if .env was committed to Git
# ============================================================================
echo ""
echo "📋 Checking Git history for .env files..."

if git ls-files | grep -q "^\.env$"; then
    echo -e "${RED}❌ .env file is tracked by Git!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ .env file not tracked by Git${NC}"
fi

# ============================================================================
# 5. Check Edge Function exists
# ============================================================================
echo ""
echo "📋 Checking for secure edge function..."

if [ -f "api/ai/generate.ts" ]; then
    echo -e "${GREEN}✅ Secure edge function found${NC}"
    
    # Verify it uses process.env
    if grep -q "process.env.GEMINI_API_KEY" api/ai/generate.ts; then
        echo -e "${GREEN}  ✅ Edge function uses environment variables${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Edge function might not use env vars correctly${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Edge function not found (api/ai/generate.ts)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# 6. Check frontend calls edge function
# ============================================================================
echo ""
echo "📋 Checking frontend AI service implementation..."

if [ -f "src/services/aiService.ts" ]; then
    if grep -q "/api/ai/generate" src/services/aiService.ts; then
        echo -e "${GREEN}✅ Frontend calls secure edge function${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend might not use edge function${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for direct Gemini usage
    if grep -q "new GoogleGenerativeAI" src/services/aiService.ts; then
        echo -e "${RED}  ❌ Frontend still directly uses Gemini SDK!${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}  ✅ No direct Gemini SDK usage in frontend${NC}"
    fi
fi

# ============================================================================
# 7. Check build output for leaked keys
# ============================================================================
echo ""
echo "📋 Checking build output (dist/) for exposed keys..."

if [ -d "dist/" ]; then
    if grep -r "$GEMINI_PATTERN" dist/ 2>/dev/null; then
        echo -e "${RED}❌ CRITICAL: API keys found in build output!${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ No API keys in build output${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  dist/ folder not found (run 'npm run build' first)${NC}"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "=================================="
echo "📊 SECURITY VERIFICATION SUMMARY"
echo "=================================="

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ FOUND $ERRORS CRITICAL ISSUE(S)${NC}"
    echo "   Please fix immediately!"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  FOUND $WARNINGS WARNING(S)${NC}"
    echo "   Review recommended"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo "   Your application follows security best practices."
fi

echo ""
echo "=================================="

# Exit with error code if critical issues found
if [ $ERRORS -gt 0 ]; then
    exit 1
fi

exit 0
