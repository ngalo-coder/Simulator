# Virtual Patient Simulation Frontend

A modern React frontend for the Virtual Patient Simulation system, built with TypeScript, Tailwind CSS, and Vite.

## Features

- 🔐 **Authentication System** - Login/Register with JWT tokens
- 🏥 **Patient Cases** - Browse and filter medical simulation cases
- 💬 **Real-time Simulation** - Interactive chat with AI patients
- 📊 **Performance Analytics** - Track progress and scores
- 👨‍💼 **Admin Dashboard** - System management for administrators
- 📱 **Responsive Design** - Works on all device sizes
- ⚡ **Fast Development** - Hot reload with Vite

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd virtual-patient-frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoginForm.tsx
│   ├── Navigation.tsx
│   └── CaseCard.tsx
├── pages/              # Main page components
│   ├── Dashboard.tsx
│   ├── Cases.tsx
│   ├── Performance.tsx
│   ├── Admin.tsx
│   └── Simulation.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
├── App.tsx             # Main app component
└── main.tsx           # Entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_NODE_ENV` - Environment (development/production)

### Backend Integration

The frontend is configured to work with the Virtual Patient Simulation backend at:
`https://simulatorbackend.onrender.com`

To use with a different backend:
1. Update `VITE_API_URL` in `.env`
2. Ensure CORS is configured on your backend
3. Set `USE_MOCK_DATA = false` in `src/services/api.ts`

## Development

### Mock Data Mode

For development without a backend, set `USE_MOCK_DATA = true` in `src/services/api.ts`.

### Adding New Features

1. **New Pages:** Add to `src/pages/` and update routing in `App.tsx`
2. **New Components:** Add to `src/components/`
3. **API Calls:** Add to `src/services/api.ts`
4. **Types:** Define in `src/types/index.ts`

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `build/` directory.

### Deploy Options

- **Netlify:** Drag and drop the `build/` folder
- **Vercel:** Connect your Git repository
- **AWS S3:** Upload the `build/` folder contents
- **GitHub Pages:** Use the build output

### Environment Setup for Production

Make sure to set the correct `VITE_API_URL` for your production backend.

## API Integration

The frontend integrates with the following backend endpoints:

- **Authentication:** `/api/auth/login`, `/api/auth/register`
- **Cases:** `/api/simulation/cases`, `/api/simulation/start`
- **Performance:** `/api/performance/summary/:userId`
- **Admin:** `/api/admin/stats`, `/api/admin/users`
- **Streaming:** `/api/simulation/ask` (Server-Sent Events)

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure your backend allows requests from your frontend domain
   - Check that the API URL is correct

2. **Authentication Issues:**
   - Clear localStorage: `localStorage.clear()`
   - Check that JWT tokens are being sent in headers

3. **Build Errors:**
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript errors with `npm run lint`

### Support

For issues and questions:
1. Check the console for error messages
2. Verify API endpoints are responding
3. Test with mock data mode first

## Recent Updates

### Application Cleanup (Latest)
The codebase has been recently cleaned up to remove obsolete files and improve maintainability:
- Removed 20+ obsolete utility scripts and documentation files
- Consolidated duplicate documentation
- Maintained full application functionality
- See `application-cleanup-report.md` for detailed cleanup summary

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
