# 🚀 Typing Speed Challenge

**A comprehensive typing training platform built with Angular 20**

[![Angular](https://img.shields.io/badge/Angular-20.3.0-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

## 📖 Overview

Typing Speed Challenge is a modern, feature-rich web application designed to help users improve their typing speed and accuracy through interactive exercises, comprehensive analytics, and gamification elements. Built with cutting-edge Angular technology, it provides a professional-grade typing training experience.

### 🎯 Key Features

- **🎮 Multiple Game Modes**: Time Attack, Endless Mode, Sprint Challenges, Survival Mode, Perfectionist Mode, Zen Mode, Blind Typing, and Marathon Mode
- **📚 Structured Learning**: Comprehensive typing courses with progressive difficulty levels
- **📊 Advanced Analytics**: Detailed performance tracking with biometric analysis and predictive insights
- **🎯 Interactive Tutorial**: Step-by-step onboarding system for new users
- **⌨️ Visual Keyboard**: Real-time finger placement guidance and interactive keyboard visualization
- **📱 Mobile Support**: Touch typing with virtual keyboards and haptic feedback
- **♿ Accessibility**: Screen reader support, ARIA compliance, and keyboard navigation
- **🌐 Multiplayer**: Real-time competitive typing with chat functionality
- **🏆 Achievements**: Comprehensive achievement system with rewards
- **📈 Performance Tracking**: Heat map analytics and detailed error analysis
- **🎨 Customization**: Theme options, font sizes, and personalized settings
- **📝 Custom Text**: Import and practice with your own texts
- **🔄 PWA Support**: Offline functionality and installable web app

## 🛠️ Technology Stack

### Frontend
- **Angular 20.3.0** - Modern Angular framework with standalone components
- **TypeScript 5.9.2** - Type-safe development with strict mode
- **RxJS 7.8.0** - Reactive programming for state management
- **SCSS** - Advanced styling with component-scoped styles
- **Angular Signals** - Modern reactive state management

### Development Tools
- **Angular CLI 20.3.1** - Project scaffolding and build tools
- **Karma + Jasmine** - Unit testing framework
- **Prettier** - Code formatting
- **ESLint** - Code quality and consistency

### Architecture
- **Single Page Application (SPA)** - Fast, responsive user experience
- **Component-based Architecture** - Modular and reusable components
- **Dependency Injection** - Clean service architecture
- **Reactive Forms** - Type-safe form handling
- **Route Guards** - Navigation security and user flow

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn** package manager
- **Angular CLI** 20.3.1 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd typing_game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```

4. **Open in browser**
   Navigate to `http://localhost:4200/`

### Build for Production

```bash
# Build the application
ng build

# Build with production optimizations
ng build --configuration production
```

Built files will be available in the `dist/` directory.

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── game/           # Main typing game interface
│   │   ├── home/           # Landing page
│   │   ├── profile/        # User analytics dashboard
│   │   ├── courses-overview/ # Typing courses system
│   │   ├── lesson/         # Individual lesson component
│   │   ├── leaderboard/    # Global rankings
│   │   ├── multiplayer/    # Real-time multiplayer
│   │   ├── settings/       # User preferences
│   │   ├── onboarding-tutorial/ # Interactive tutorial
│   │   ├── keyboard-visualization/ # Visual keyboard guide
│   │   ├── mobile-keyboard/ # Touch typing support
│   │   ├── analytics-dashboard/ # Advanced analytics
│   │   ├── error-feedback/ # Real-time error analysis
│   │   ├── loading/        # Loading state components
│   │   └── accessibility-settings/ # Accessibility options
│   ├── services/           # Business logic and data services
│   │   ├── game.ts         # Core game mechanics
│   │   ├── word.ts         # Word generation and categories
│   │   ├── typing-courses.ts # Structured learning system
│   │   ├── advanced-analytics.ts # Performance analysis
│   │   ├── mobile-support.ts # Mobile and touch support
│   │   ├── accessibility.ts # Accessibility features
│   │   ├── onboarding.ts   # Tutorial system
│   │   ├── keyboard.ts     # Keyboard layout and mapping
│   │   ├── error-feedback.ts # Error analysis
│   │   └── loading.ts      # Loading state management
│   ├── app.routes.ts       # Application routing
│   ├── app.config.ts       # Application configuration
│   └── app.ts             # Root component
├── assets/                 # Static assets
├── styles.scss            # Global styles
└── main.ts               # Application entry point
```

## 🎮 Features Deep Dive

### Game Modes

1. **Time Attack** - Race against the clock with customizable time limits
2. **Endless Mode** - Continuous typing with increasing difficulty
3. **Sprint Challenges** - Quick 30-second speed tests
4. **Survival Mode** - One mistake and you're out
5. **Perfectionist Mode** - 100% accuracy required
6. **Zen Mode** - Relaxed typing without time pressure
7. **Blind Typing** - Practice without visual feedback
8. **Marathon Mode** - Extended sessions for endurance training

### Typing Courses System

- **Beginner Basics** - Home row mastery and proper finger placement
- **Intermediate Expansion** - All letters, numbers, and punctuation
- **Advanced Mastery** - Speed building and symbol proficiency
- **Specialized Courses** - Numeric keypad and programming syntax
- **Progressive Difficulty** - Structured learning path with prerequisites
- **Performance Tracking** - Stars, completion rates, and progress analytics

### Advanced Analytics

- **Performance Trends** - WPM, accuracy, and consistency over time
- **Error Analysis** - Detailed breakdown by error type and finger
- **Biometric Analysis** - Typing rhythm and hand coordination
- **Predictive Insights** - Improvement projections and skill ceiling analysis
- **Heat Maps** - Visual representation of keystroke patterns
- **Comparative Analysis** - Ranking against global user base

### Accessibility Features

- **Screen Reader Support** - Full ARIA compliance and live regions
- **Keyboard Navigation** - Complete keyboard-only operation
- **Visual Accessibility** - High contrast mode, large text options
- **Motion Controls** - Reduced motion for vestibular sensitivity
- **Color Blind Support** - Multiple color schemes for different types
- **Focus Indicators** - Enhanced focus visibility

### Mobile Experience

- **Touch Typing** - Virtual keyboard with haptic feedback
- **Responsive Design** - Optimized for all screen sizes
- **Gesture Support** - Swipe actions and touch gestures
- **Device Detection** - Automatic mobile optimizations
- **Orientation Support** - Portrait and landscape modes

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage
```

### End-to-End Tests
```bash
# Run e2e tests
ng e2e
```

## 🔧 Configuration

### Environment Configuration

The application supports multiple environments:

- `environment.ts` - Development environment
- `environment.prod.ts` - Production environment

### Build Configuration

Customize build settings in `angular.json`:

- Bundle budgets for performance optimization
- Asset optimization settings
- Build target configurations

## 🚀 Deployment

### Static Hosting

The application can be deployed to any static hosting service:

1. **Build for production**: `ng build --configuration production`
2. **Deploy the `dist/` folder** to your hosting service

### Recommended Hosting Platforms

- **Netlify** - Automatic deployments with Git integration
- **Vercel** - Optimized for Angular applications
- **GitHub Pages** - Free hosting for open source projects
- **Firebase Hosting** - Google's hosting platform
- **AWS S3 + CloudFront** - Scalable cloud hosting

### PWA Installation

The application supports Progressive Web App features:

- **Offline functionality** with service worker
- **Install to home screen** on mobile devices
- **Background sync** for data synchronization

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the coding standards
4. **Run tests**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Coding Standards

- **TypeScript** - Strict mode enabled with full type safety
- **Angular Style Guide** - Follow official Angular style guidelines
- **Prettier** - Automated code formatting
- **ESLint** - Code quality and consistency rules
- **Component Architecture** - Standalone components with proper separation of concerns

### Code Quality

- **Unit Tests** - Minimum 80% code coverage
- **Type Safety** - No `any` types, strict TypeScript configuration
- **Performance** - Bundle size optimization and lazy loading
- **Accessibility** - WCAG 2.1 AA compliance

## 📊 Performance

### Bundle Analysis

```bash
# Analyze bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### Performance Optimizations

- **Lazy Loading** - Route-based code splitting
- **OnPush Change Detection** - Optimized component updates
- **Track By Functions** - Efficient list rendering
- **Bundle Splitting** - Vendor and application code separation
- **Service Workers** - Caching strategies for faster loading

## 🔒 Security

### Security Features

- **Content Security Policy** - XSS protection
- **HTTPS Enforcement** - Secure data transmission
- **Input Sanitization** - Safe HTML rendering
- **Route Guards** - Access control and navigation security

## 📱 Browser Support

### Supported Browsers

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile Safari** iOS 14+
- **Chrome Mobile** Android 8+

### Progressive Enhancement

- **Core functionality** works on all modern browsers
- **Enhanced features** for browsers with advanced capabilities
- **Graceful degradation** for older browser versions

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use**
```bash
# Use different port
ng serve --port 4201
```

**Memory Issues**
```bash
# Increase Node.js memory limit
node --max-old-space-size=8192 node_modules/@angular/cli/bin/ng serve
```

### Development Tips

- **Hot Reload** - Changes are automatically reflected in the browser
- **Source Maps** - Debug TypeScript code directly in browser
- **Angular DevTools** - Browser extension for debugging Angular applications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team** - For the amazing framework
- **TypeScript Team** - For type-safe JavaScript development
- **Open Source Community** - For the excellent libraries and tools

## 📞 Support

For support and questions:

- **Issues** - Report bugs and feature requests on GitHub
- **Discussions** - Community discussions and help
- **Documentation** - Comprehensive guides and API reference

## 🎯 Roadmap

### Upcoming Features

- **AI-Powered Recommendations** - Personalized typing improvement suggestions
- **Voice Commands** - Accessibility enhancement with voice control
- **Team Competitions** - Group challenges and tournaments
- **API Integration** - Backend services for data synchronization
- **Advanced Themes** - More customization options
- **Internationalization** - Multi-language support

---

**Built with ❤️ using Angular 20**

*Happy Typing! 🚀*
