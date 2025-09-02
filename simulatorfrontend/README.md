# 🏥 Simuatech Frontend

> **Where patients build real clinicians** - A cutting-edge medical simulation platform powered by AI

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)

## ✨ Overview

Simuatech Frontend is a modern, responsive web application that provides medical students and professionals with an immersive AI-powered patient simulation experience. Built with React and TypeScript, it offers a seamless interface for practicing clinical skills in a safe, controlled environment.

## 🚀 Key Features

### 🎯 **Core Functionality**
- **AI-Powered Patient Interactions** - Realistic conversations with virtual patients
- **Hierarchical Case Browsing** - Organized by program areas and specialties
- **Real-time Performance Tracking** - Instant feedback and scoring
- **Progressive Learning Path** - Cases from beginner to advanced levels

### 🔐 **Privacy & Security**
- **Comprehensive Privacy Controls** - Granular user privacy settings
- **GDPR Compliance** - Complete data export and deletion capabilities
- **Anonymous Leaderboards** - Privacy-aware competitive features
- **Secure Session Management** - JWT-based authentication with auto-expiry

### 📱 **User Experience**
- **Mobile-Responsive Design** - Optimized for all screen sizes
- **Intuitive Navigation** - Clean, professional interface
- **Real-time Notifications** - Session warnings and system alerts
- **Accessibility Compliant** - WCAG guidelines adherence

### 📊 **Analytics & Progress**
- **Detailed Performance Metrics** - Track learning progress over time
- **Specialty-Specific Analytics** - Progress by medical specialty
- **Leaderboard System** - Gamified learning with privacy controls
- **Export Capabilities** - Download your data in multiple formats

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for responsive, utility-first design
- **State Management**: React Context API with custom hooks
- **Authentication**: JWT-based secure authentication
- **HTTP Client**: Fetch API with custom authentication wrapper
- **Routing**: React Router for client-side navigation

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with ES2020 support

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/simulatorfrontend.git
cd simulatorfrontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

```env
VITE_API_URL=http://localhost:5003
VITE_APP_NAME=Simuatech
VITE_APP_VERSION=1.0.0
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdminUserManagement.tsx
│   ├── DataExportModal.tsx
│   ├── Navbar.tsx
│   ├── PrivacySettings.tsx
│   ├── ProtectedRoute.tsx
│   └── SessionManager.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.tsx
├── pages/              # Page components
│   ├── AdminPage.tsx
│   ├── CaseBrowsingPage.tsx
│   ├── DashboardPage.tsx
│   ├── HomePage.tsx
│   ├── LeaderboardPage.tsx
│   ├── LoginPage.tsx
│   ├── ProgressPage.tsx
│   ├── RegisterPage.tsx
│   ├── SimulationChatPage.tsx
│   └── SimulationPage.tsx
├── services/           # API and external services
│   └── apiService.ts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── sessionUtils.ts
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563EB) - Trust and professionalism
- **Secondary**: Indigo (#4F46E5) - Innovation and technology
- **Success**: Green (#10B981) - Positive feedback
- **Warning**: Yellow (#F59E0B) - Caution and alerts
- **Error**: Red (#EF4444) - Critical issues

### Typography
- **Headings**: Inter font family for clarity
- **Body**: System fonts for optimal readability
- **Code**: Monospace for technical content

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Testing (Planned)
npm run test         # Test suite (not yet implemented)
npm run test:watch   # Test watch mode (not yet implemented)
npm run test:coverage # Test coverage (not yet implemented)
```

> **Note**: Testing infrastructure is planned for future implementation. Currently using TypeScript for compile-time validation.

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting for consistency
- **Husky**: Git hooks for pre-commit checks

## 🚀 Deployment

### Netlify (Recommended)

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_API_URL=https://your-api-domain.com
```

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🔐 Security Features

- **JWT Authentication** with automatic token refresh
- **Session Management** with expiry warnings
- **Privacy Controls** with GDPR compliance
- **Secure API Communication** with authentication headers
- **XSS Protection** through React's built-in sanitization

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.simuatech.com](https://docs.simuatech.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/simulatorfrontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/simulatorfrontend/discussions)

## 🙏 Acknowledgments

- **Medical Educators** who provided case scenarios and feedback
- **React Community** for excellent tooling and resources
- **Tailwind CSS** for the utility-first CSS framework
- **TypeScript Team** for type safety and developer experience

---

**Built with ❤️ for medical education**

*Empowering the next generation of healthcare professionals through innovative simulation technology.*