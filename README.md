# TransitOps

A modern transport operations management platform built with Node.js, Express, PostgreSQL, and React.

## 🚀 Quick Start

### New to the Project?
**[Start Here: Getting Started with Render](GETTING_STARTED_WITH_RENDER.md)** - Complete onboarding guide

### 5-Minute Setup
1. Create a free PostgreSQL database on [Render](https://render.com)
2. See [backend/RENDER_QUICKSTART.md](backend/RENDER_QUICKSTART.md) for setup
3. Start developing!

## 📁 Structure

- **`backend/`** - Node.js/Express/PostgreSQL API server
- **`frontend/`** - React + TypeScript frontend with Material-UI
- **`assets/`** - Design mockups and assets
- **`task/`** - Project planning and task documents

## 🗄️ Database Setup

### Option A: Render PostgreSQL (Recommended)
Cloud-hosted, zero local installation required:
- **Quick Start**: [backend/RENDER_QUICKSTART.md](backend/RENDER_QUICKSTART.md)
- **Detailed Guide**: [backend/RENDER_SETUP.md](backend/RENDER_SETUP.md)
- **Free Tier**: 1GB storage, perfect for development

### Option B: Local PostgreSQL
Install PostgreSQL locally:
- **Setup Guide**: [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)
- **Requirements**: PostgreSQL 14+ installed locally

## 📚 Documentation

### Getting Started
- [Getting Started with Render](GETTING_STARTED_WITH_RENDER.md) - Complete onboarding
- [Backend README](backend/README.md) - API documentation
- [Frontend README](frontend/README.md) - Frontend setup (if available)

### Render Integration
- [Render Quick Start](backend/RENDER_QUICKSTART.md) - 5-minute setup
- [Render Setup Guide](backend/RENDER_SETUP.md) - Comprehensive guide
- [Migration Summary](RENDER_MIGRATION_SUMMARY.md) - Technical changes

### Development
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Project roadmap
- [Phase 2 Tasks](task/phase-2-trip-management.md) - Current development phase
- [Database Setup](backend/DATABASE_SETUP.md) - Local PostgreSQL setup

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ (Render hosted)
- **ORM**: Sequelize
- **Auth**: JWT with bcrypt
- **Security**: Helmet, CORS

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **Build Tool**: Vite
- **State Management**: Context API

## 🚦 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Render account (free) OR PostgreSQL 14+ installed locally

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up environment (copy and edit)
cp .env.example .env
# Add your Render DATABASE_URL

# Test database connection
npm run test:db

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure API URL

# Start development server
npm run dev
```

## 📖 Key Features

- ✅ User authentication with JWT
- ✅ Role-based access control (RBAC)
- ✅ Trip management (CRUD operations)
- ✅ Vehicle and driver management
- ✅ Real-time status tracking
- ✅ Responsive Material-UI interface
- ✅ Cloud-hosted PostgreSQL database
- ✅ Secure API with validation
- 🚧 Maintenance tracking (planned)
- 🚧 Expense management (planned)
- 🚧 Analytics dashboard (planned)

## 🔐 Environment Variables

### Backend (.env)
```env
# Database (Render)
DATABASE_URL=postgres://user:pass@host.render.com:5432/dbname

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:db       # Test database connection
```

### Frontend Tests
```bash
cd frontend
npm test              # Run component tests
```

## 🚀 Deployment

### Backend (Render)
1. Create Web Service on Render
2. Connect your Git repository
3. Set root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

See [backend/RENDER_SETUP.md](backend/RENDER_SETUP.md) for detailed deployment guide.

### Frontend
Deploy to Vercel, Netlify, or Render:
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_URL`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT
