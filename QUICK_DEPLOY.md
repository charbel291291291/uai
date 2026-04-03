# 🚀 QUICK DEPLOYMENT GUIDE

## ⚡ 3-Step Security Fix

### Step 1: Add API Key to Vercel (2 minutes)

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   ```
   Name: GEMINI_API_KEY
   Value: [Paste your Gemini API key here]
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
5. Click **Save**

---

### Step 2: Deploy Code (1 minute)

```bash
# Commit and push
git add .
git commit -m "feat: secure AI with edge function"
git push origin main

# Or deploy manually
vercel --prod
```

---

### Step 3: Verify (30 seconds)

After deployment completes:

1. Open your deployed app
2. Navigate to AI chat feature
3. Send a test message
4. Verify you get a response ✅

---

## ✅ That's It!

Your API keys are now secure! 🎉

### What Just Happened:
- ✅ Gemini API key moved to server-side only
- ✅ Frontend can no longer access API key directly
- ✅ All AI requests route through secure edge function
- ✅ Keys stored safely in Vercel environment variables

---

## 🔍 Want to Verify?

Run this in your terminal:
```bash
powershell -ExecutionPolicy Bypass -File scripts/verify-security.ps1
```

Should show:
```
✅ ALL CHECKS PASSED!
```

---

## 🆘 Troubleshooting

**AI not working after deploy?**
- Check Vercel Function logs in dashboard
- Verify `GEMINI_API_KEY` is set correctly
- Try sending another test message

**Still seeing errors?**
- Check browser console for error messages
- Verify `/api/ai/generate` endpoint exists
- Review Vercel deployment logs

---

**Need more help?** See `SECURITY_FIX_API_KEYS.md` for detailed guide.
