# UAi Deployment Guide

Complete guide for deploying the UAi platform to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [CI/CD Setup](#cicd-setup)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Docker** (optional, for containerized deployment) ([Download](https://www.docker.com/))

### Optional Tools

- **Docker Compose** (included with Docker Desktop)
- **GitHub CLI** (for CI/CD management) ([Download](https://cli.github.com/))

---

## Environment Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-here
```

### Optional Variables

```env
# Application Settings
VITE_APP_NAME=UAi
VITE_APP_URL=https://yourdomain.com
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_CHAT=true

# API Rate Limiting
VITE_API_RATE_LIMIT=100
```

### Getting API Keys

#### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing
3. Navigate to **Settings** > **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

#### Google Gemini AI

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API Key**
4. Copy the key → `GEMINI_API_KEY`

---

## Local Development

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/uai.git
cd uai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start development server
npm run dev
```

Access at: `http://localhost:3000`

### Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

### Using Docker for Local Development

```bash
# Start development environment
docker-compose up dev

# Access in browser: http://localhost:3000
# Hot reload enabled - changes reflect immediately
```

**Benefits:**
- Consistent environment across team
- No local Node.js installation needed
- Isolated dependencies

---

## Docker Deployment

### Build Options

#### Option 1: Direct Docker Build

```bash
# Build production image
docker build -t uai-app:latest --target production .

# Run container
docker run -p 80:80 uai-app:latest
```

#### Option 2: Docker Compose (Recommended)

```bash
# Production
docker-compose up web -d

# View logs
docker-compose logs -f web

# Stop
docker-compose down
```

#### Option 3: Multi-Stage Build for Testing

```bash
# Build all stages
docker build -t uai-dev:latest --target development .

# Run with volume mounting
docker run -p 3000:3000 -v $(pwd):/app uai-dev:latest
```

### Docker Configuration Files

#### Dockerfile

The multi-stage Dockerfile includes:

1. **Builder Stage**: Installs dependencies and builds app
2. **Production Stage**: Serves with Nginx (optimized)
3. **Development Stage**: Runs Vite dev server

```dockerfile
# Production build (~50MB)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Nginx serving (~25MB final)
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

Production Nginx configuration:

- Gzip compression enabled
- Security headers configured
- SPA routing support
- Static asset caching (1 year)

#### docker-compose.yml

Services:
- `web`: Production Nginx server (port 80)
- `dev`: Development Vite server (port 3000)

### Customizing Docker Build

#### Add Custom Nginx Config

```dockerfile
COPY custom-nginx.conf /etc/nginx/conf.d/default.conf
```

#### Add Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider http://localhost/ || exit 1
```

#### Environment Variables in Docker

```bash
docker run -p 80:80 \
  -e VITE_SUPABASE_URL=https://... \
  -e VITE_SUPABASE_ANON_KEY=... \
  -e GEMINI_API_KEY=... \
  uai-app:latest
```

**Note:** For security, use Docker secrets or mount `.env.local` as volume instead of passing via `-e`.

---

## Cloud Deployment

### Platform-Specific Guides

#### Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure
# Add environment variables in Vercel dashboard
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Or connect Git repo for auto-deploy
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

#### Google Cloud Run

```bash
# Build Docker image
docker build -t gcr.io/your-project/uai:latest .

# Push to Container Registry
docker push gcr.io/your-project/uai:latest

# Deploy to Cloud Run
gcloud run deploy uai \
  --image gcr.io/your-project/uai:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create uai-app

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git push heroku main

# Set environment variables
heroku config:set VITE_SUPABASE_URL=...
```

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables
5. Deploy automatically on push

### Database Setup (Supabase)

All platforms work seamlessly with Supabase:

1. Create project at [supabase.com](https://supabase.com)
2. Get credentials from Settings > API
3. Add as environment variables in your hosting platform
4. Update Row Level Security policies in Supabase dashboard

---

## CI/CD Setup

### GitHub Actions

The project includes pre-configured workflows:

#### Continuous Integration (`.github/workflows/ci.yml`)

Runs on every push/PR:

1. **Lint & Build** (Node 18.x, 20.x, 22.x)
2. **Test Suite**
3. **Security Audit**
4. **Docker Build Verification**

#### Continuous Deployment (`.github/workflows/cd.yml`)

Triggered by version tags:

1. **Build & Push Docker Image** to GHCR
2. **Deploy to Production**
3. **Generate Deployment Manifest**

### Manual Deployment Trigger

```bash
# Tag release
git tag v1.0.0
git push origin v1.0.0

# Or trigger manually from GitHub Actions tab
# Select "Run workflow" → Choose environment
```

### Custom Deployment Script

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Your deployment commands here
          echo "Deploying..."
```

### Deployment Strategies

#### Blue-Green Deployment

Maintain two identical production environments:

1. Deploy to inactive environment (green)
2. Test thoroughly
3. Switch traffic from blue to green
4. Keep blue as fallback

#### Canary Releases

Gradually roll out changes:

1. Deploy to small percentage of users (5%)
2. Monitor metrics
3. Gradually increase to 25%, 50%, 100%
4. Rollback if issues detected

#### Rolling Updates

Update servers incrementally:

1. Update 1 server at a time
2. Health check after each update
3. Continue if successful
4. Rollback on failure

---

## Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates set up
- [ ] Domain DNS configured
- [ ] CDN enabled (recommended)
- [ ] Monitoring tools integrated

### Security

- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] API keys secured (not in code)
- [ ] Dependencies audited (`npm audit`)
- [ ] Error logging configured

### Performance

- [ ] Build optimized (`npm run build`)
- [ ] Images compressed
- [ ] Code splitting implemented
- [ ] Caching headers set
- [ ] Gzip/Brotli enabled
- [ ] Lazy loading implemented

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests completed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] Load testing completed

### Monitoring

- [ ] Analytics tracking enabled
- [ ] Error reporting configured (Sentry, etc.)
- [ ] Uptime monitoring active
- [ ] Performance monitoring enabled
- [ ] Log aggregation set up
- [ ] Alert thresholds configured

### Backup & Recovery

- [ ] Database backups scheduled
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure defined

---

## Troubleshooting

### Common Issues

#### Build Fails

**Error:** `Module not found`

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Docker Build Fails

**Error:** `Cannot find module`

```dockerfile
# Ensure package*.json copied before source
COPY package*.json ./
RUN npm ci
COPY . .
```

#### Blank Page After Deploy

**Cause:** MIME type errors

**Solution:**
- Verify `nginx.conf` has correct MIME types
- Check SPA routing configuration
- Ensure build output in correct directory

#### Environment Variables Not Working

**Check:**
- File named `.env.local` (not `.env`)
- Variables prefixed with `VITE_`
- Restart dev server after changes
- In Docker, ensure variables are passed or mounted

#### Supabase Connection Errors

**Verify:**
- `VITE_SUPABASE_URL` is correct (no trailing slash)
- `VITE_SUPABASE_ANON_KEY` is valid
- Row Level Security policies configured
- Network allows outbound connections

#### Docker Container Won't Start

```bash
# Check logs
docker-compose logs web

# Verify port not in use
lsof -i :80

# Restart container
docker-compose restart web
```

### Debugging Tips

#### Enable Verbose Logging

```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

#### Docker Debug Mode

```bash
# Run interactively
docker run -it --entrypoint /bin/sh uai-app:latest

# Inspect image
docker inspect uai-app:latest
```

#### Network Inspection

```bash
# Check container network
docker network inspect uai_default

# Test connectivity
docker exec -it <container_id> wget http://localhost
```

### Getting Help

- **Logs:** `docker-compose logs -f`
- **GitHub Issues:** Report bugs with reproduction steps
- **Discussions:** Ask questions in GitHub Discussions
- **Documentation:** Check `/docs` folder

---

<div align="center">
  <sub>Last updated: April 2026</sub>
</div>
