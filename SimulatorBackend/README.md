# 🏥 Simuatech Backend

> **Powering the future of medical education** - A robust, scalable API for AI-driven patient simulations

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-blue.svg)](https://openai.com/)

## ✨ Overview

Simuatech Backend is a high-performance Node.js API that powers realistic medical simulations using advanced AI. Built with Express and MongoDB, it provides secure, scalable endpoints for patient interactions, progress tracking, and comprehensive privacy management.

## 🚀 Key Features

### 🤖 **AI-Powered Simulations**
- **OpenAI Integration** - GPT-4 powered patient responses
- **Real-time Streaming** - Server-Sent Events for live conversations
- **Context Awareness** - Maintains conversation history and patient state
- **Dynamic Scenarios** - Adaptive case progression based on user input

### 🔐 **Security & Privacy**
- **JWT Authentication** - Secure token-based authentication
- **Privacy Controls** - Comprehensive GDPR-compliant privacy management
- **Data Export** - Complete user data portability in multiple formats
- **Account Deletion** - Secure data removal with audit trails
- **Rate Limiting** - Protection against abuse and DoS attacks

### 📊 **Analytics & Performance**
- **Real-time Metrics** - Performance tracking and analytics
- **Progress Monitoring** - Detailed learning progress analysis
- **Leaderboard System** - Privacy-aware competitive features
- **Admin Dashboard** - Comprehensive system management

### 🏗️ **Architecture**
- **RESTful API** - Clean, predictable endpoint design
- **Microservices Ready** - Modular service architecture
- **Database Optimization** - Efficient MongoDB queries with indexing
- **Error Handling** - Comprehensive error management and logging

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ with ES6+ modules
- **Framework**: Express.js for robust API development
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: OpenAI GPT-4 API
- **Logging**: Pino for structured logging
- **Validation**: Custom middleware for request validation
- **Security**: CORS, rate limiting, and input sanitization

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB 6+ (local or cloud instance)
- OpenAI API key

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/simulatorbackend.git
cd SimulatorBackend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

```env
# Server Configuration
PORT=5003
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/simuatech
DB_NAME=simuatech

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# AI Services
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Project Structure

```
src/
├── config/             # Configuration files
│   ├── corsConfig.js
│   ├── db.js
│   └── logger.js
├── controllers/        # Request handlers
│   ├── adminController.js
│   ├── authController.js
│   ├── performanceController.js
│   ├── privacyController.js
│   └── simulationController.js
├── middleware/         # Custom middleware
│   ├── jwtAuthMiddleware.js
│   ├── rateLimiter.js
│   └── validation.js
├── models/            # Database schemas
│   ├── CaseModel.js
│   ├── PerformanceMetricModel.js
│   ├── SessionModel.js
│   ├── UserModel.js
│   └── UserPrivacyModel.js
├── routes/            # API route definitions
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── performanceRoutes.js
│   ├── privacyRoutes.js
│   └── simulationRoutes.js
├── services/          # Business logic
│   ├── aiService.js
│   ├── caseService.js
│   ├── privacyService.js
│   └── simulationService.js
└── utils/             # Utility functions
    └── helpers.js
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/refresh      # Token refresh
POST   /api/auth/logout       # User logout
```

### Simulations
```
GET    /api/simulation/cases           # Get available cases
GET    /api/simulation/case-categories # Get case categories
POST   /api/simulation/start          # Start new simulation
GET    /api/simulation/ask            # Stream patient responses
POST   /api/simulation/end            # End simulation session
```

### Privacy & Data
```
GET    /api/privacy/settings     # Get privacy settings
PUT    /api/privacy/settings     # Update privacy settings
GET    /api/privacy/export       # Export user data
DELETE /api/privacy/account      # Delete user account
GET    /api/privacy/statistics   # Privacy statistics (admin)
```

### Performance & Analytics
```
GET    /api/performance/leaderboard    # Get leaderboard data
GET    /api/performance/metrics/:id    # Get user metrics
POST   /api/performance/evaluate      # Submit performance data
```

### Administration
```
GET    /api/admin/stats         # System statistics
GET    /api/admin/users         # User management
PUT    /api/admin/users/:id     # Update user
DELETE /api/admin/users/:id     # Delete user
```

## 🤖 AI Integration

### OpenAI Configuration
```javascript
// AI Service supports multiple providers
const aiProviders = {
  openai: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  },
  openrouter: {
    model: 'openai/gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  }
};
```

### Patient Simulation Flow
1. **Case Selection** - User chooses medical case
2. **Context Loading** - AI loads patient persona and medical history
3. **Real-time Interaction** - Streaming responses via Server-Sent Events
4. **Performance Evaluation** - AI assesses clinical reasoning
5. **Feedback Generation** - Detailed performance analysis

## 🗄️ Database Schema

### Core Collections
- **users** - User accounts and authentication
- **cases** - Medical case scenarios and metadata
- **sessions** - Simulation session data
- **performancemetrics** - User performance tracking
- **userprivacies** - Privacy settings and preferences

### Indexing Strategy
```javascript
// Optimized indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.cases.createIndex({ "case_metadata.program_area": 1 });
db.sessions.createIndex({ userId: 1, createdAt: -1 });
db.performancemetrics.createIndex({ userId: 1, evaluatedAt: -1 });
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server
npm run build       # Build for production (no-op currently)

# Testing & Quality (Planned)
npm run test        # Test suite (not yet implemented)
npm run test:coverage # Test coverage (not yet implemented)
npm run lint        # Code linting (not yet configured)

# Database (Planned)
npm run db:seed     # Seed database with sample data (not yet implemented)
npm run db:migrate  # Run database migrations (not yet implemented)
npm run db:backup   # Backup database (not yet implemented)

# Deployment
npm run railway:deploy # Deploy to Railway
npm run railway:logs   # View Railway logs
npm run railway:open   # Open Railway dashboard
```

> **Note**: Testing and database management scripts are planned for future implementation.

### Code Quality

- **ESLint**: Code linting with Node.js best practices
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Jest**: Unit and integration testing

## 🚀 Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5003
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/simuatech
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-production-openai-key
```

## 📊 Monitoring & Logging

### Structured Logging
```javascript
// Pino logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});
```

### Health Checks
```
GET /health          # Basic health check
GET /health/detailed # Detailed system status
```

## 🔐 Security Features

- **JWT Authentication** with configurable expiration
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **Input Validation** and sanitization
- **SQL Injection Protection** through Mongoose ODM
- **Privacy Controls** with GDPR compliance

## 📈 Performance Optimization

- **Database Indexing** for fast queries
- **Connection Pooling** for MongoDB
- **Caching Strategy** for frequently accessed data
- **Compression** for API responses
- **Streaming Responses** for real-time interactions

## 🧪 Testing

> **Current Status**: Testing infrastructure is planned for future implementation.

```bash
# Planned testing commands
npm test              # Will run test suite (not yet implemented)
npm run test:coverage # Will generate coverage reports (not yet implemented)

# Current validation
npm run dev          # Manual testing via development server
# Use API testing tools like Postman or Insomnia for endpoint testing
```

**Recommended Testing Setup** (for future implementation):
- **Unit Tests**: Jest or Mocha for service and utility testing
- **Integration Tests**: Supertest for API endpoint testing
- **Database Tests**: MongoDB Memory Server for isolated testing
- **Coverage**: Istanbul/NYC for code coverage reporting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **API Documentation**: [api.simuatech.com/docs](https://api.simuatech.com/docs)
- **Issues**: [GitHub Issues](https://github.com/your-username/simulatorbackend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/simulatorbackend/discussions)

## 🙏 Acknowledgments

- **OpenAI** for providing advanced language models
- **MongoDB** for flexible, scalable data storage
- **Express.js Community** for excellent middleware and tools
- **Medical Professionals** who validated our simulation accuracy

---

**Built with ❤️ for medical education**

*Empowering healthcare education through cutting-edge AI technology and robust backend infrastructure.*