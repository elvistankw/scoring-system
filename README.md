# Realtime Scoring System (实时评分系统)

A full-stack web application for managing competitive scoring events with real-time score broadcasting capabilities. Built with Next.js, Express, PostgreSQL, and Redis.

## 🌟 Features

- **Multi-role Architecture**: Separate interfaces for Admin, Judge, and Display roles
- **Real-time Score Broadcasting**: WebSocket-based live score updates to display screens
- **Three Competition Types**: 
  - Individual Stage (5 dimensions)
  - Duo/Team Stage (5 dimensions with interaction)
  - Challenge (3 dimensions)
- **Regional Competition Support**: Organize and filter competitions by geographical regions
- **Responsive Design**: Optimized for tablets (Judge interface) and large displays (Scoreboard)
- **Theme Support**: Light mode for Judge/Admin, Dark mode for Display screens
- **Performance Optimized**: Redis caching, connection pooling, skeleton loading states

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 16.2.3 (React 19.2.4) with App Router
- TypeScript 5.x
- Tailwind CSS 4.x
- SWR for data fetching and caching
- Socket.io-client for WebSocket connections
- Sonner for toast notifications

**Backend:**
- Node.js with Express 5.2.1
- PostgreSQL 8.20.0 (primary database)
- Redis (ioredis 5.10.1) for caching and real-time data
- Socket.io 4.8.3 for WebSocket server
- JWT for authentication

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer (Next.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Admin     │  │    Judge     │  │   Display    │     │
│  │  Interface   │  │  Interface   │  │  Interface   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Express Backend)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  REST API    │  │  WebSocket   │  │     JWT      │     │
│  │  Endpoints   │  │    Server    │  │ Middleware   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                           │
│  ┌──────────────────────────┐  ┌──────────────────────┐    │
│  │      PostgreSQL          │  │       Redis          │    │
│  │  (Persistent Storage)    │  │  (Real-time Cache)   │    │
│  └──────────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js**: v18.x or higher
- **PostgreSQL**: v12.x or higher
- **Redis**: v6.x or higher
- **npm** or **yarn**: Latest stable version

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd scoring-system
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

#### Frontend (.env.local)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

#### Backend (backend/.env)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=scoring
DB_PASSWORD=your_password
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

PORT=5000
NODE_ENV=development
```

### 4. Start Services

#### Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows (WSL)
wsl
sudo service redis-server start
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE scoring;

# Exit
\q
```

#### Run Database Migration

```bash
cd backend
npm run migrate
```

#### Start Backend Server

```bash
cd backend
npm start
```

Backend will run on `http://localhost:5000`

#### Start Frontend Development Server

```bash
# In root directory
npm run dev
```

Frontend will run on `http://localhost:3000`

### 5. Access the Application

- **Admin Interface**: http://localhost:3000/admin-dashboard
- **Judge Interface**: http://localhost:3000/judge-dashboard
- **Display Scoreboard**: http://localhost:3000/scoreboard
- **Display Rankings**: http://localhost:3000/rankings

## 📚 Documentation

### User Guides

- **[Admin Guide](ADMIN_GUIDE.md)**: Complete guide for administrators
- **[Judge Guide](JUDGE_GUIDE.md)**: Complete guide for judges
- **[Display Guide](DISPLAY_GUIDE.md)**: Setup and operation of display screens

### Technical Documentation

- **[API Documentation](API_DOCUMENTATION.md)**: Complete API reference
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment instructions
- **[Database Migration](DATABASE_MIGRATION.md)**: Database setup and migration
- **[Database Schema](backend/DATABASE_SCHEMA.md)**: Database structure reference

### Backend Documentation

- **[Backend Setup](backend/SETUP.md)**: Backend infrastructure setup
- **[Auth API](backend/AUTH_API.md)**: Authentication endpoints
- **[Competition API](backend/COMPETITION_API.md)**: Competition management
- **[Athlete API](backend/ATHLETE_API.md)**: Athlete management
- **[Redis Caching](backend/REDIS_CACHING_GUIDE.md)**: Caching strategy
- **[Security Hardening](backend/SECURITY_HARDENING_REPORT.md)**: Security features
- **[Performance Optimization](backend/PERFORMANCE_OPTIMIZATION.md)**: Performance tuning

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d
```

See [Deployment Guide](DEPLOYMENT.md) for detailed instructions.

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
node test-auth-complete.js
node test-competitions.js
node test-athletes.js
```

## 📁 Project Structure

```
scoring-system/
├── app/                          # Next.js app directory
│   ├── [locale]/                 # Internationalization
│   │   ├── (admin)/              # Admin role pages
│   │   ├── (judge)/              # Judge role pages
│   │   ├── (display)/            # Display role pages
│   │   └── (auth)/               # Authentication pages
│   └── globals.css               # Global styles
├── backend/                      # Express backend
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Express middleware
│   ├── migrations/               # Database migrations
│   ├── routes/                   # API routes
│   ├── db.js                     # PostgreSQL connection
│   ├── redis.js                  # Redis connection
│   ├── socket.js                 # WebSocket server
│   └── index.js                  # Server entry point
├── components/                   # React components
│   ├── admin/                    # Admin components
│   ├── judge/                    # Judge components
│   ├── display/                  # Display components
│   ├── auth/                     # Auth components
│   └── shared/                   # Shared components
├── hooks/                        # Custom React hooks
├── interface/                    # TypeScript interfaces
├── lib/                          # Utility libraries
├── public/                       # Static assets
├── docker-compose.yml            # Docker configuration
├── Dockerfile                    # Frontend Docker image
└── README.md                     # This file
```

## 🎯 Competition Types

### Individual Stage (个人赛)

**5 Scoring Dimensions:**
1. Action Difficulty (动作难度) - 0-30 points
2. Stage Artistry (舞台艺术性) - 0-30 points
3. Action Creativity (动作创意性) - 0-30 points
4. Action Fluency (动作流畅性) - 0-30 points
5. Costume Styling (服装造型) - 0-10 points

**Total Maximum:** 130 points

### Duo/Team Stage (双人/团队赛)

**5 Scoring Dimensions:**
1. Action Difficulty (动作难度) - 0-30 points
2. Stage Artistry (舞台艺术性) - 0-30 points
3. Action Interaction (动作互动性) - 0-30 points
4. Action Creativity (动作创意性) - 0-30 points
5. Costume Styling (服装造型) - 0-10 points

**Total Maximum:** 130 points

### Challenge (挑战赛)

**3 Scoring Dimensions:**
1. Action Difficulty (动作难度) - 0-30 points
2. Action Creativity (动作创意性) - 0-30 points
3. Action Fluency (动作流畅性) - 0-30 points

**Total Maximum:** 90 points

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with 10 salt rounds
- **Parameterized Queries**: SQL injection prevention
- **Rate Limiting**: Brute force attack prevention
- **CORS Configuration**: Cross-origin request control
- **Role-Based Access Control**: Admin and Judge roles
- **Security Headers**: Helmet.js middleware

## ⚡ Performance Features

- **Redis Caching**: 1-hour TTL for frequently accessed data
- **Connection Pooling**: PostgreSQL connection pool (max 20)
- **Database Indexes**: Optimized query performance
- **WebSocket**: Real-time updates without polling
- **SWR Caching**: Client-side data caching and revalidation
- **Skeleton Loading**: Improved perceived performance

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |

## 📱 Device Support

- **Desktop**: Full functionality
- **Tablet**: Optimized for judge interface (iPad, Android tablets)
- **Large Displays**: Optimized for scoreboard (1080p, 4K)
- **Mobile**: Basic functionality (not primary target)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation

- [Admin Guide](ADMIN_GUIDE.md) - For administrators
- [Judge Guide](JUDGE_GUIDE.md) - For judges
- [Display Guide](DISPLAY_GUIDE.md) - For display operators
- [API Documentation](API_DOCUMENTATION.md) - For developers

### Troubleshooting

Common issues and solutions are documented in:
- [Deployment Guide - Troubleshooting](DEPLOYMENT.md#troubleshooting)
- [Database Migration - Troubleshooting](DATABASE_MIGRATION.md#troubleshooting)

### Contact

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check existing documentation

## 🎉 Acknowledgments

- Next.js team for the amazing framework
- Express.js for the robust backend framework
- PostgreSQL for reliable data storage
- Redis for high-performance caching
- Socket.io for real-time communication

## 📊 Project Status

- ✅ Core functionality complete
- ✅ Real-time score broadcasting
- ✅ Multi-role authentication
- ✅ Competition management
- ✅ Athlete management
- ✅ Score submission and display
- ✅ Redis caching
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Documentation complete

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support (i18n)
- [ ] Video replay integration
- [ ] Automated score calculation
- [ ] Export to PDF/Excel
- [ ] Email notifications
- [ ] SMS notifications

---

**Built with ❤️ for competitive scoring events**
