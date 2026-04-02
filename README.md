<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # UAi - Your Digital AI Twin
  
  A modern, AI-powered platform for creating digital twins, NFC-enabled profiles, and intelligent chat experiences.
  
  [![Build Status](https://img.shields.io/github/actions/workflow/status/your-org/uai/ci.yml?branch=main)](https://github.com/your-org/uai/actions)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Code Style](#code-style)
  - [Testing](#testing)
- [Deployment](#deployment)
  - [Docker Deployment](#docker-deployment)
  - [Production Build](#production-build)
  - [CI/CD](#cicd)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## Overview

UAi is a cutting-edge web application that combines AI-powered conversations, NFC-enabled digital business cards, and comprehensive profile management into a single, seamless experience. Built with modern web technologies, it provides users with tools to create their digital presence while leveraging AI for enhanced interactions.

### Key Capabilities

- **AI Chat**: Intelligent conversation powered by Google's Gemini AI
- **NFC Integration**: Create and manage NFC-enabled digital business cards
- **Profile Management**: Comprehensive user profiles with analytics
- **Authentication**: Secure OAuth-based authentication system
- **Analytics**: Real-time tracking and insights
- **Responsive Design**: Modern glass-morphism UI that works on all devices

---

## Features

### 🎨 Modern UI/UX
- Glass-morphism design system with backdrop blur effects
- Smooth animations using Framer Motion
- Responsive layout for mobile, tablet, and desktop
- Dark theme optimized for reduced eye strain
- Customizable components with Tailwind CSS

### 🤖 AI Integration
- Powered by Google Gemini AI
- Context-aware conversations
- Real-time message streaming
- Conversation history management
- Multi-language support

### 🔐 Authentication & Security
- OAuth 2.0 (Google provider)
- Session management with Supabase Auth
- Protected routes and role-based access
- Secure API communication
- Password reset functionality

### 📊 Analytics Dashboard
- Profile view tracking
- User engagement metrics
- NFC tap analytics
- CTA click tracking
- Daily aggregation reports

### 💳 NFC & Payments
- NFC card ordering system
- Payment request management
- Order status tracking
- Shipping address management
- Payment approval workflow

---

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool and dev server
- **Tailwind CSS 4.1** - Utility-first styling
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **React Router 7** - Client-side routing
- **Recharts** - Data visualization

### Backend & Services
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage
- **Google Generative AI** - AI chat functionality

### DevOps & Tools
- **Docker** - Containerization
- **GitHub Actions** - CI/CD automation
- **Nginx** - Production web server
- **ESLint/Prettier** - Code quality

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Git** - Version control
- **Docker** (optional) - For containerized deployment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/uai.git
   cd uai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm run doctor
   ```

### Environment Setup

1. **Copy the environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure environment variables**
   
   Edit `.env.local` and add your credentials:
   
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Gemini API Key
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. **Obtain API Keys**
   
   - **Supabase**: Create a project at [supabase.com](https://supabase.com) and get your URL and anon key from Settings > API
   - **Gemini API**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Running the App

1. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

2. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Hot reload**
   
   Changes to your code will automatically refresh the page

---

## Project Structure

```
uai/
├── .github/                    # GitHub configuration
│   └── workflows/              # CI/CD pipelines
├── dist/                       # Production build output
├── node_modules/               # Dependencies
├── public/                     # Static assets
│   ├── favicon.ico
│   └── manifest.json
├── src/                        # Source code
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Shared components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # Base UI components
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useProfile.ts       # Profile management hook
│   │   └── useSubscription.ts  # Subscription hook
│   ├── pages/                  # Page components
│   │   ├── DashboardNew.tsx    # Main dashboard
│   │   ├── ProfileNew.tsx      # User profile page
│   │   ├── Explore.tsx         # Discovery page
│   │   ├── Admin.tsx           # Admin panel
│   │   ├── AdminNFC.tsx        # NFC management
│   │   ├── Upgrade.tsx         # Subscription page
│   │   └── Login.tsx           # Authentication page
│   ├── services/               # API service layer
│   │   ├── apiClient.ts        # Base API client
│   │   ├── authService.ts      # Authentication
│   │   ├── profileService.ts   # Profile operations
│   │   ├── orderService.ts     # Orders & payments
│   │   ├── aiService.ts        # AI chat
│   │   ├── analyticsService.ts # Analytics tracking
│   │   └── index.ts            # Service exports
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global styles
│   └── i18n.ts                 # Internationalization
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose
├── nginx.conf                  # Nginx configuration
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
└── vite.config.ts              # Vite configuration
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Run TypeScript type checking |
| `npm run lint:fix` | Fix linting errors |
| `npm run format` | Format code with Prettier |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |
| `npm run docker:dev` | Start Docker dev environment |

### Code Style

This project uses:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Tailwind CSS** for styling

**Example component structure:**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui';

interface MyComponentProps {
  title: string;
  onSubmit?: (data: string) => void;
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    onSubmit?.(value);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
}
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.ts
```

---

## Deployment

### Docker Deployment

**Quick deploy with Docker Compose:**

```bash
# Production environment
docker-compose up web

# Development environment
docker-compose up dev

# View logs
docker-compose logs -f
```

**Manual Docker build:**

```bash
# Build image
docker build -t uai-app:latest --target production .

# Run container
docker run -p 80:80 uai-app:latest
```

Access the app at `http://localhost`

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview locally**
   ```bash
   npm run preview
   ```

3. **Deploy `dist/` folder** to your hosting provider

### CI/CD

The project includes GitHub Actions workflows for automated CI/CD:

**Continuous Integration** (`.github/workflows/ci.yml`):
- Runs on every push/PR
- Lints and builds the application
- Runs security audits
- Builds and tests Docker images

**Continuous Deployment** (`.github/workflows/cd.yml`):
- Triggered by version tags (`v*`)
- Deploys to production automatically
- Pushes Docker images to GHCR

**Deploy with a tag:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

See [DEVOPS.md](DEVOPS.md) for detailed deployment instructions.

---

## API Documentation

### Service Layer Architecture

The application uses a centralized service layer to handle all API operations:

```
Components → Hooks → Services → Supabase
```

### Core Services

#### Authentication Service

```typescript
import { authService, signInWithOAuth, signOut } from '@/services';

// Sign in with OAuth
const { url, error } = await signInWithOAuth({ 
  provider: 'google',
  redirectTo: '/dashboard'
});

// Sign out
const { success, error } = await signOut();

// Get current session
const { user, error } = await authService.getSession();
```

#### Profile Service

```typescript
import { profileService, updateProfile } from '@/services';

// Get profile
const { data, error } = await profileService.getProfileById(userId);

// Update profile
const { data, error } = await updateProfile(userId, {
  displayName: 'New Name',
  bio: 'Updated bio text',
  avatarUrl: 'https://...'
});

// Search profiles
const { data, error } = await profileService.searchProfiles('john');
```

#### AI Service

```typescript
import { aiService, sendMessageToAI } from '@/services';

// Send message to AI
const { data, error } = await sendMessageToAI('Hello!');
console.log(data?.message);

// Get conversation history
const history = await aiService.getConversationHistory();

// Clear history
await aiService.clearConversationHistory();
```

#### Order Service

```typescript
import { orderService, createOrder } from '@/services';

// Create NFC order
const { data, error } = await createOrder({
  userId: 'user-id',
  productType: 'card',
  quantity: 2,
  shippingAddress: {
    street: '123 Main St',
    city: 'New York',
    zip: '10001'
  },
  totalAmount: 30
});
```

### Response Format

All services return a standardized response:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

interface ApiError {
  message: string;
  code: string;
  details?: any;
}
```

### Usage Pattern

```typescript
const { data, error, success } = await profileService.getProfileById(userId);

if (success && data) {
  // Handle successful response
  console.log(data.displayName);
} else if (error) {
  // Handle error
  console.error(error.message);
}
```

### React Hooks

Services are consumed through custom hooks:

```typescript
import { useAuth, useProfile, useSubscription } from '@/hooks';

function MyComponent() {
  const { user, signInWithOAuth } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { subscription, hasFeature } = useSubscription(user?.id);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1>Welcome, {profile?.displayName}</h1>
      {hasFeature('ai-mode') && <AIChat />}
    </div>
  );
}
```

See [src/services/README.md](src/services/README.md) for complete API documentation.

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow existing code style
- Ensure linting passes (`npm run lint`)

---

## Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/your-org/uai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/uai/discussions)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by the UAi Team</sub>
</div>
