# UAi Quick Reference

Essential commands and patterns for daily development.

## Table of Contents

- [Quick Start](#quick-start)
- [Common Commands](#common-commands)
- [Code Snippets](#code-snippets)
- [Environment Setup](#environment-setup)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Clone & install
git clone https://github.com/your-org/uai.git
cd uai
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys

# Run
npm run dev
# Open http://localhost:3000
```

---

## Common Commands

### Development

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run preview          # Preview production build
npm run clean            # Clean dist folder
```

### Code Quality

```bash
npm run lint             # Type check
npm run lint:fix         # Fix type errors
npm run format           # Format with Prettier
```

### Docker

```bash
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:dev       # Start Docker dev environment
```

### Git

```bash
git checkout -b feature/name   # Create feature branch
git commit -m "feat: add X"    # Conventional commit
git push origin feature/name   # Push branch
```

---

## Code Snippets

### Component Template

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await someOperation();
      onAction?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2>{title}</h2>
      <Button onClick={handleClick} isLoading={loading}>
        Action
      </Button>
    </div>
  );
}
```

### Hook Template

```tsx
import { useState, useEffect } from 'react';

export function useMyHook(param: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [param]);

  return { data, loading };
}
```

### Service Call Pattern

```typescript
const { data, error, success } = await service.operation(params);

if (success && data) {
  // Handle success
} else if (error) {
  console.error(error.message);
}
```

### Auth Check

```tsx
import { useAuth } from '@/hooks';

function ProtectedComponent() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <LoginPrompt />;

  return <ProtectedContent />;
}
```

---

## Environment Setup

### Required Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### Getting Keys

**Supabase:**
1. Go to supabase.com
2. Select project
3. Settings → API
4. Copy URL and anon key

**Gemini AI:**
1. Go to Google AI Studio
2. Create API key
3. Copy key

---

## Troubleshooting

### Blank Page

```bash
# Check console for errors
# Verify MIME types in nginx.conf
# Ensure build completed successfully
npm run build
```

### Port Already in Use

```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill

# Or change port
npm run dev -- --port 3001
```

### Dependencies Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check types
npm run lint

# Clear cache
rm -rf node_modules/.vite
```

### Docker Issues

```bash
# Rebuild without cache
docker-compose build --no-cache

# View logs
docker-compose logs -f

# Restart
docker-compose down && docker-compose up
```

---

## File Structure

```
src/
├── components/     # UI components
├── hooks/          # React hooks
├── pages/          # Page components
├── services/       # API services
├── types/          # TypeScript types
└── utils/          # Utilities
```

---

## Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables |
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite config |
| `index.css` | Global styles |

---

## Useful Links

- **React Docs:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vite:** https://vitejs.dev/guide
- **Supabase:** https://supabase.com/docs

---

<div align="center">
  <sub>Last updated: April 2026</sub>
</div>
