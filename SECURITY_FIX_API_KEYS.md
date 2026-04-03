# 🔐 SECURITY FIX - API Key Migration Guide

## ✅ **FIXES IMPLEMENTED**

### 1. Gemini API Key Removed from Frontend

**Before (INSECURE):**
```typescript
// src/services/aiService.ts - ❌ EXPOSED KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
```

**After (SECURE):**
```typescript
// src/services/aiService.ts - ✅ Calls Edge Function
const AI_API_ENDPOINT = '/api/ai/generate';
const response = await fetch(AI_API_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({ message, conversationHistory }),
});
```

```typescript
// api/ai/generate.ts - ✅ Server-side only
const apiKey = process.env.GEMINI_API_KEY; // Never exposed to client!
```

---

## 🚀 **VERCEL DEPLOYMENT STEPS**

### Step 1: Add Environment Variable to Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Configure:
   ```
   Key: GEMINI_API_KEY
   Value: [Your actual Gemini API key here]
   Environments: 
     ☑️ Production
     ☑️ Preview  
     ☑️ Development
   ```
5. Click **Save**

### Step 2: Deploy the Application

```bash
# Push to Git (if using GitHub integration)
git add .
git commit -m "feat: migrate AI to secure edge function"
git push origin main

# Or deploy manually
vercel --prod
```

### Step 3: Verify Deployment

After deployment, test the AI functionality:
1. Open your deployed app
2. Navigate to AI chat feature
3. Send a message
4. Verify response works correctly

---

## 🔒 **SUPABASE KEY VERIFICATION**

### Current Status: ✅ SAFE

Your `.env` file contains:
```env
VITE_SUPABASE_URL=https://odbegvvmnichrbzvuuwz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_mcYeaYpmJUAGeAwct1m_XQ_KlTCuDJO
```

**This is CORRECT because:**
- ✅ Uses `VITE_` prefix (exposed to frontend intentionally)
- ✅ It's the **ANON/PUBLISHABLE** key (safe for client-side)
- ✅ Works with Row Level Security (RLS) policies

### ⚠️ NEVER Use SERVICE_ROLE Key in Frontend

**WRONG (NEVER DO THIS):**
```env
# ❌ DANGEROUS - Full database access, bypasses RLS
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to Get Correct Keys:**

1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** (gear icon) → **API**
3. You'll see two keys:
   - ✅ **anon public** → Safe for frontend (what you're using)
   - ❌ **service_role** → NEVER expose this!

---

## 📋 **SECURITY CHECKLIST**

### Frontend Security
- [x] ✅ Gemini API key removed from frontend code
- [x] ✅ AI calls routed through secure edge function
- [x] ✅ Supabase ANON key only (not service_role)
- [x] ✅ No hardcoded secrets in source code
- [x] ✅ `.env` file protected by `.gitignore`

### Backend/Edge Security
- [x] ✅ Edge function validates all inputs
- [x] ✅ API key stored in Vercel environment variables only
- [x] ✅ CORS headers configured properly
- [x] ✅ Input length limits prevent DoS attacks
- [x] ✅ Timeout protection (30 seconds max)

### Deployment Security
- [ ] ⏳ Add `GEMINI_API_KEY` to Vercel environment variables
- [ ] ⏳ Redeploy application to Vercel
- [ ] ⏳ Test AI functionality after deployment
- [ ] ⏳ Monitor Vercel logs for any errors

---

## 🛡️ **ARCHITECTURE OVERVIEW**

### Before (INSECURE):
```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ ❌ API Key exposed in JavaScript
       │ ❌ Anyone can view source and steal key
       ▼
┌─────────────┐
│   Gemini    │
│     API     │
└─────────────┘
```

### After (SECURE):
```
┌─────────────┐      ┌──────────────────┐
│   Browser   │      │  Vercel Edge     │
│  (Frontend) │─────▶│  Function        │
└─────────────┘      └────────┬─────────┘
       │                      │
       │ ✅ No API key        │ ✅ API key stored
       │ ✅ Can't be stolen   │    securely
       ▼                      ▼
┌─────────────┐      ┌──────────────────┐
│   Gemini    │◀─────│  process.env     │
│     API     │      │  GEMINI_API_KEY  │
└─────────────┘      └──────────────────┘
```

---

## 🔍 **HOW TO VERIFY KEYS ARE SECURE**

### 1. Check Frontend Bundle

After building, verify no API keys are in the bundle:

```bash
# Build the app
npm run build

# Search for API key patterns in dist folder
grep -r "AIzaSy" dist/  # Should return NOTHING
grep -r "GEMINI" dist/  # Should return NOTHING
```

If you find anything, the key is still exposed!

### 2. Check Network Tab

1. Open browser DevTools → Network tab
2. Use the AI chat feature
3. Look at the request to `/api/ai/generate`
4. Check **Request Payload** - should only contain `message` and `conversationHistory`
5. Check **Response** - should NOT contain any API keys

### 3. View Source Test

1. Right-click on any page → View Page Source
2. Search (Ctrl+F) for:
   - `AIzaSy` → Should NOT appear
   - `GEMINI` → Should NOT appear
   - `apiKey` → Should NOT appear with actual key value

---

## 🚨 **IF YOU ACCIDENTALLY COMMITTED KEYS**

### Immediate Actions:

1. **REVOKE THE KEY IMMEDIATELY**
   - Google Cloud Console → APIs & Services → Credentials
   - Delete the compromised key
   - Create a new one

2. **Remove from Git History**
   ```bash
   # Install BFG Repo-Cleaner
   # Then run:
   bfg --delete-files .env
   
   # Force push (CAREFUL - rewrites history!)
   git push --force
   ```

3. **Rotate All Secrets**
   - Generate new Supabase keys if service_role was exposed
   - Update Vercel environment variables
   - Update local `.env` files

4. **Monitor for Abuse**
   - Check Google Cloud usage metrics
   - Review Supabase query logs
   - Look for unusual traffic patterns

---

## 📞 **TROUBLESHOOTING**

### Error: "AI service unavailable"

**Cause:** Missing `GEMINI_API_KEY` in Vercel

**Fix:**
1. Add environment variable in Vercel dashboard
2. Redeploy: `vercel --prod`

### Error: "Network error - unable to reach AI service"

**Cause:** Edge function not deployed or CORS issue

**Fix:**
1. Check Vercel deployment status
2. Verify `/api/ai/generate` endpoint exists
3. Check browser console for CORS errors

### Error: "Invalid API key configuration"

**Cause:** Wrong key format or expired key

**Fix:**
1. Verify key in Google Cloud Console is active
2. Copy exact key value (no extra spaces)
3. Update in Vercel environment variables
4. Redeploy

---

## ✅ **SUMMARY**

### What Changed:
- ✅ Gemini API key moved from frontend to Vercel Edge Function
- ✅ All AI requests now route through secure server-side endpoint
- ✅ API key never exposed to browser/client
- ✅ Input validation and rate limiting added
- ✅ Proper error handling and logging

### What Stayed the Same:
- ✅ Supabase ANON key usage (already secure)
- ✅ Frontend user experience unchanged
- ✅ Existing authentication flow intact
- ✅ All other features working as before

### Next Steps:
1. Add `GEMINI_API_KEY` to Vercel environment variables
2. Redeploy application
3. Test AI functionality
4. Monitor for any issues

---

**Security is a journey, not a destination!** 🛡️

For questions or concerns, refer to the main security audit report.
