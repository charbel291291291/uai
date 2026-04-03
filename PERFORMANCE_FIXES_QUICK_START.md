# 🚀 PERFORMANCE FIXES - QUICK START GUIDE

**Priority:** Fix CRITICAL issues first for maximum impact  
**Time Required:** 2-3 hours for Phase 1  
**Expected Impact:** 20-30% faster initial load

---

## 🔴 PHASE 1: CRITICAL FIXES (DO THESE FIRST)

### Fix #1: Remove Duplicate Gemini SDK ⏱️ 5 minutes

**Problem:** Two Gemini SDKs = +80kb wasted

```bash
# Run this command:
npm uninstall @google/generative-ai
```

**Update imports in code:**
```tsx
// OLD - src/pages/ProfileNew.tsx line 7
import { GoogleGenAI } from '@google/generative-ai';

// NEW
import { GoogleGenAI } from '@google/genai';
```

**Files to update:**
- `src/pages/ProfileNew.tsx`
- `src/services/aiService.ts`

---

### Fix #2: Tree-shake Lucide Icons ⏱️ 15 minutes

**Problem:** All icons bundled even if not used (+50kb)

**Before:**
```tsx
// ❌ Imports entire icon library
import { User, Zap, Shield, Sparkles } from 'lucide-react';
```

**After:**
```tsx
// ✅ Imports only specific icons
import User from 'lucide-react/User';
import Zap from 'lucide-react/Zap';
import Shield from 'lucide-react/Shield';
import Sparkles from 'lucide-react/Sparkles';
```

**Alternative (better):**
```tsx
// Use destruct import (tree-shakeable)
import { User, Zap, Shield, Sparkles } from 'lucide-react';
// Vite will tree-shake unused icons automatically
```

**Note:** Modern bundlers tree-shake automatically with named imports. Verify with bundle analyzer.

---

### Fix #3: Add Image Lazy Loading ⏱️ 30 minutes

**File:** `src/pages/Home.tsx`

Add `loading="lazy"` to all below-fold images:

```tsx
// Home.tsx - Around line 140+
{MODE_META.map((mode, idx) => (
  <motion.img
    key={idx}
    src={mode.img}
    alt="Mode preview"
    loading="lazy"        // ✅ ADD THIS
    decoding="async"      // ✅ ADD THIS
    width="400"           // ✅ ADD dimensions
    height="300"          // ✅ ADD dimensions
    className="..."
  />
))}
```

**Do this for ALL images in:**
- `Home.tsx` (all MODE_META, PLAN_META, NFC_META images)
- Any other page with static images

---

### Fix #4: Optimize Images to WebP ⏱️ 1 hour

**Convert PNG images to WebP:**

Option A: Use online tool (manual)
1. Go to https://squoosh.app
2. Upload each image from `/public/images/`
3. Choose WebP format, quality 80
4. Download and replace original files

Option B: Use Sharp CLI (automated)
```bash
# Install sharp globally
npm install -g sharp-cli

# Convert all PNGs to WebP
cd public/images
sharp *.png --format=webp --quality=80 --suffix=.webp
```

Then update references:
```tsx
// Change this:
{ img: '/images/mode-ai.png', color: '#3A86FF' }

// To this:
{ img: '/images/mode-ai.webp', color: '#3A86FF' }
```

**Expected savings:** Each image goes from ~400kb → ~150kb (60% smaller)

---

### Fix #5: Add Prefers-Reduced-Motion ⏱️ 20 minutes

**File:** `src/App.tsx`

```tsx
// Add at component level (around line 45)
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

// Update motion.main (line 62-70)
<motion.main
  key={location.pathname}
  initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
  className="pt-16 pb-20 md:pb-0"
  tabIndex={-1}
>
```

**Also add CSS fallback in `src/index.css`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 🟠 PHASE 2: HIGH IMPACT (NEXT DAY)

### Fix #6: Enhanced Vite Build Config ⏱️ 30 minutes

**File:** `vite.config.ts`

Replace entire config with:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          pure_funcs: ['console.log', 'console.debug'],
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['motion/react'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 200,
    },
    
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
```

---

### Fix #7: Component Memoization ⏱️ 2 hours

**File:** `src/pages/DashboardNew.tsx`

Add useMemo and useCallback:

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';

// Inside Dashboard component:

// ✅ MEMOIZE expensive computations
const filteredLeads = useMemo(() => {
  return leads.filter(lead => {
    if (filter === 'pending') return lead.status === 'pending';
    if (filter === 'approved') return lead.status === 'approved';
    if (filter === 'rejected') return lead.status === 'rejected';
    return true;
  });
}, [leads, filter]);

const sortedServices = useMemo(() => {
  return [...(profile.services || [])].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [profile.services]);

// ✅ MEMOIZE event handlers
const handleSave = useCallback(async () => {
  if (!user) return;
  setIsSaving(true);
  setSaveStatus('idle');

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: profile.username?.toLowerCase(),
      display_name: profile.displayName,
      bio: profile.bio,
      // ... rest of fields
    });

    if (error) throw error;
    setSaveStatus('success');
  } catch (error) {
    console.error('Save error:', error);
    setSaveStatus('error');
  } finally {
    setIsSaving(false);
  }
}, [user, profile]); // Dependencies

const handleTabChange = useCallback((tabId: string) => {
  setActiveTab(tabId);
}, []);

// ✅ WRAP child components with React.memo
const SidebarNav = React.memo(({ activeTab, onTabChange }: {
  activeTab: string;
  onTabChange: (id: string) => void;
}) => {
  return (
    <nav className="...">
      {sidebarItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`... ${activeTab === item.id ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
```

**Apply same pattern to:**
- `ProfileNew.tsx`
- `Admin.tsx`
- `Upgrade.tsx`

---

### Fix #8: Parallel API Calls ⏱️ 30 minutes

**File:** `src/hooks/useProfile.ts`

Current code already uses sequential calls. Make it parallel:

```tsx
const fetchProfile = useCallback(async () => {
  if (!userId) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    // ✅ PARALLEL execution
    const [profileData, leadsData, messagesData] = await Promise.all([
      profileService.getProfileById(userId),
      supabase.from('leads').select('*').eq('profile_id', userId),
      supabase.from('messages').select('*').eq('profile_id', userId),
    ]);

    if (profileData.error) {
      throw new Error(profileData.error.message);
    }

    setProfile(profileData.data);
    setLeads(leadsData.data || []);
    setMessages(messagesData.data || []);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [userId]);
```

---

## 🟡 PHASE 3: MEDIUM IMPROVEMENTS (WEEKEND PROJECT)

### Fix #9: Optimize Supabase Queries ⏱️ 1 hour

**Replace `select('*')` with explicit columns:**

```tsx
// ❌ BEFORE
supabase.from('profiles').select('*');

// ✅ AFTER
supabase.from('profiles').select(`
  id,
  username,
  display_name,
  avatar_url,
  bio,
  theme_color,
  mode,
  created_at
`);

// For nested relations
supabase.from('users').select(`
  id,
  name,
  posts (
    id,
    title,
    created_at
  )
`);
```

**Update these files:**
- `src/pages/DashboardNew.tsx`
- `src/pages/ProfileNew.tsx`
- `src/pages/Explore.tsx`
- `src/hooks/useProfile.ts`

---

### Fix #10: Add DNS Prefetch/Preconnect ⏱️ 15 minutes

**File:** `index.html` (in root)

Add to `<head>` section:

```html
<head>
  <!-- Existing meta tags -->
  
  <!-- Preconnect to Supabase -->
  <link rel="preconnect" href="https://odbegvvmnichrbzvuuwz.supabase.co" crossorigin />
  <link rel="dns-prefetch" href="https://odbegvvmnichrbzvuuwz.supabase.co" />
  
  <!-- Preconnect to Google APIs (if using) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
  
  <!-- Other existing tags -->
</head>
```

---

## ✅ VERIFICATION CHECKLIST

After implementing fixes, verify:

### Bundle Size Check:
```bash
# Build production bundle
npm run build

# Check output sizes
ls -lh dist/assets/*.js
```

**Expected results:**
- Main bundle: <200kb (was ~450kb)
- Vendor chunks: Split into separate files
- No duplicate Gemini SDK

### Performance Test:
```bash
# Start preview server
npm run preview

# Open Chrome DevTools → Lighthouse
# Run performance audit
```

**Target scores:**
- Performance: >90
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.0s

### Mobile Test:
```bash
# Use Chrome DevTools Device Emulation
# Select "Moto G4" or similar low-end device
# Set network to "Slow 3G"
# Load app and measure
```

**Expected:**
- Initial load: <3 seconds
- Interactions: Smooth, no lag
- Scrolling: 60fps

---

## 📊 MONITORING PROGRESS

### Before & After Metrics:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Bundle Size | 450kb | ___ | <200kb |
| LCP | 4.5s | ___ | <2.5s |
| FID | 200ms | ___ | <100ms |
| Image Weight | 3MB | ___ | <500kb |

Fill in your actual results after implementing fixes!

---

## 🆘 TROUBLESHOOTING

### Issue: Build fails after adding manualChunks

**Solution:** Ensure all dependencies are installed
```bash
npm install
npm run build
```

### Issue: Images not loading after WebP conversion

**Solution:** Keep original PNG as fallback
```tsx
<picture>
  <source srcSet="/images/mode-ai.webp" type="image/webp" />
  <img src="/images/mode-ai.png" alt="Mode AI" loading="lazy" />
</picture>
```

### Issue: Animations still janky on mobile

**Solution:** Force disable on low-end devices
```tsx
const isLowEndDevice = navigator.hardwareConcurrency <= 4;

<motion.div
  animate={isLowEndDevice ? {} : { scale: [1, 1.2, 1] }}
>
```

---

## 🎯 WHAT'S NEXT?

After completing Phases 1-3:

1. ✅ Your app will load 60% faster on mobile
2. ✅ Users will save ~70% on data costs
3. ✅ Interactions will be significantly snappier

**Advanced optimizations (optional):**
- Virtual scrolling for long lists
- Image CDN (Cloudinary, Imgix)
- Advanced caching strategies
- Bundle size monitoring in CI/CD

**See `PERFORMANCE_AUDIT_COMPLETE.md` for detailed analysis and advanced recommendations.**

---

**Good luck! Start with Phase 1 today for immediate wins! 🚀**
