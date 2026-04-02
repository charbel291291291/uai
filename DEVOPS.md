# DevOps Documentation

This document provides an overview of the DevOps setup for this project.

## Table of Contents

- [Overview](#overview)
- [Git Configuration](#git-configuration)
- [Docker Setup](#docker-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Local Development](#local-development)
- [Deployment](#deployment)

## Overview

The project includes a complete DevOps setup with:

- **Git**: Comprehensive `.gitignore` for Node.js/Vite projects
- **Docker**: Multi-stage builds for development and production
- **GitHub Actions**: Automated CI/CD pipelines
- **Nginx**: Optimized production web server configuration

## Git Configuration

### .gitignore

The `.gitignore` file excludes:

- Dependencies (`node_modules/`)
- Build outputs (`dist/`, `build/`)
- Environment files (`.env`, `.env.local`, etc.)
- Editor files (`.vscode/`, `.idea/`)
- OS generated files (`.DS_Store`, `Thumbs.db`)
- Cache files and logs

## Docker Setup

### Multi-Stage Dockerfile

The `Dockerfile` includes three stages:

1. **Builder Stage**: Builds the React application
2. **Production Stage**: Serves static files with Nginx
3. **Development Stage**: Runs Vite dev server with hot reload

### Building Docker Images

```bash
# Production build
docker build -t my-app:latest --target production .

# Development build
docker build -t my-app:dev --target development .
```

### Using Docker Compose

```bash
# Start production server
docker-compose up web

# Start development server
docker-compose up dev

# Run in background
docker-compose up -d web
```

### Nginx Configuration

The `nginx.conf` includes:

- Gzip compression for better performance
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- SPA routing support (serves index.html for all routes)
- Static asset caching (1 year for immutable assets)

## CI/CD Pipeline

### Continuous Integration (ci.yml)

Triggered on every push or pull request to main branches:

1. **Lint & Build Job**
   - Tests on Node.js 18.x, 20.x, and 22.x
   - Runs TypeScript type checking
   - Builds the application
   - Uploads build artifacts

2. **Test Job**
   - Runs test suite (if configured)
   - Depends on successful lint/build

3. **Security Audit Job**
   - Runs `npm audit` for vulnerability scanning
   - Checks both development and production dependencies

4. **Docker Build Job**
   - Builds Docker image
   - Tests image configuration
   - Uses GitHub Actions cache for faster builds

### Continuous Deployment (cd.yml)

Triggered on version tags (`v*`) or manual dispatch:

1. **Deploy to Production**
   - Builds and pushes Docker image to GHCR
   - Tags: commit SHA, version tag, latest
   - Generates deployment manifest

2. **Deploy to Staging** (manual only)
   - Separate staging deployment
   - Tags: commit SHA-staging, staging

3. **Notify Deployment**
   - Logs deployment information
   - Can be extended with Slack/email notifications

### Required Secrets

For CD pipeline, configure these GitHub repository secrets:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

Optional secrets for extended functionality:

- `SLACK_WEBHOOK_URL`: For Slack notifications
- `DEPLOY_KEY`: For custom deployment scripts

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (optional)

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Clean build artifacts
npm run clean
```

### Using Docker for Development

```bash
# Start development environment
docker-compose up dev

# Access container shell
docker-compose exec dev sh

# View logs
docker-compose logs -f dev
```

## Deployment

### Manual Deployment

1. Build the Docker image:
   ```bash
   docker build -t my-app:latest --target production .
   ```

2. Run the container:
   ```bash
   docker run -p 80:80 my-app:latest
   ```

3. Access at `http://localhost`

### Automated Deployment

1. Create a new git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions will automatically:
   - Build and test the application
   - Create Docker image
   - Push to GitHub Container Registry
   - Generate deployment manifest

### Pulling from Registry

```bash
# Login to GitHub Container Registry
docker login ghcr.io -u USERNAME --password TOKEN

# Pull image
docker pull ghcr.io/username/repository:latest

# Run container
docker run -p 80:80 ghcr.io/username/repository:latest
```

## Troubleshooting

### Build Fails in Docker

1. Clear Docker cache:
   ```bash
   docker builder prune -a
   ```

2. Rebuild without cache:
   ```bash
   docker build --no-cache -t my-app:latest .
   ```

### CI/CD Pipeline Issues

1. Check workflow runs in GitHub Actions tab
2. Review job logs for specific errors
3. Verify Node.js version compatibility
4. Ensure all dependencies are listed in package.json

### Nginx Routing Issues

If SPA routing doesn't work:

1. Verify `nginx.conf` is copied correctly
2. Check that `try_files` directive is present
3. Ensure build output is in correct directory

## Best Practices

1. **Always use .env.example**: Document required environment variables
2. **Pin dependency versions**: Use exact versions in package.json
3. **Regular security audits**: Run `npm audit` weekly
4. **Monitor Docker image size**: Use multi-stage builds
5. **Keep workflows updated**: Update GitHub Actions versions periodically

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
