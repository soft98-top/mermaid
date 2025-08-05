# 🎨 Mermaid Renderer - Advanced Diagram Editor

[![Deploy to GitHub Pages](https://github.com/soft98-top/mermaid/actions/workflows/deploy.yml/badge.svg)](https://github.com/soft98-top/mermaid/actions/workflows/deploy.yml)
[![CI/CD Pipeline](https://github.com/soft98-top/mermaid/actions/workflows/ci.yml/badge.svg)](https://github.com/soft98-top/mermaid/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://soft98-top.github.io/mermaid/)

A powerful, feature-rich Mermaid diagram renderer with advanced capabilities including nested diagrams, real-time editing, theme switching, and comprehensive accessibility support.

## ✨ Features

### 🎯 Core Features
- **Real-time Mermaid Rendering**: Instant preview of Mermaid diagrams as you type
- **Nested Diagram Support**: Unique feature to embed diagrams within diagrams
- **Advanced Code Editor**: Monaco-based editor with syntax highlighting and auto-completion
- **Multiple Export Formats**: Export to PNG, SVG, and PDF
- **Performance Optimized**: Efficient rendering with caching and lazy loading

### 🎨 UI & UX Features
- **Theme Switching**: Light, dark, and system theme support
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Comprehensive keyboard navigation and shortcuts
- **Accessibility Support**: Full WCAG 2.1 AA compliance with screen reader support
- **Mobile Optimized**: Touch-friendly interface with gesture support

### 🚀 Advanced Features
- **Performance Monitoring**: Real-time performance metrics and optimization
- **Error Handling**: Intelligent error recovery and user-friendly error messages
- **State Management**: Robust state management with undo/redo support
- **Customizable Layout**: Flexible editor positioning (left, right, hidden)

## 🌐 Live Demo

Visit the live application: **[https://soft98-top.github.io/mermaid/](https://soft98-top.github.io/mermaid/)**

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/soft98-top/mermaid.git
cd mermaid

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Basic Usage

1. **Open the application** in your browser
2. **Write Mermaid diagram code** in the editor panel
3. **See real-time preview** in the canvas panel
4. **Export your diagrams** using the export buttons
5. **Customize the interface** with theme and layout options

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` | Toggle editor position |
| `Ctrl+T` | Switch theme |
| `Ctrl+K` | Show keyboard shortcuts help |
| `Ctrl+R` | Reset canvas view |
| `Ctrl+S` | Save diagram (export) |
| `Escape` | Close dialogs |

### Nested Diagram Syntax

Create complex diagrams with embedded sub-diagrams:

```mermaid
graph TD
    A[Start] --> B{Decision}
    B --> C[Process 1]
    B --> D[{{diagram:nested-flow}}]
    
---diagram:nested-flow---
graph LR
    X[Input] --> Y[Processing]
    Y --> Z[Output]
---end---
```

### Theme Customization

The application supports three theme modes:
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy on the eyes for low-light environments
- **System Theme**: Automatically follows your system preference

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with CSS custom properties
- **State Management**: Zustand
- **Code Editor**: Monaco Editor
- **Diagram Rendering**: Mermaid.js
- **Testing**: Vitest + Testing Library
- **Deployment**: GitHub Actions + GitHub Pages

### Project Structure

```
src/
├── components/          # React components
├── services/           # Business logic services
├── stores/             # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── styles/             # Global styles
```

## 🔧 Development

### Code Quality

The project maintains high code quality through:

- **TypeScript**: Strict type checking
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Vitest**: Comprehensive testing
- **GitHub Actions**: Automated CI/CD

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test -- --coverage
```

### Building

```bash
# Build for production
npm run build

# Analyze bundle size
npm run build -- --analyze
```

## 🚀 Deployment

The application is automatically deployed to GitHub Pages using GitHub Actions:

1. **Push to main branch** triggers the deployment workflow
2. **Tests run** to ensure code quality
3. **Build process** creates optimized production bundle
4. **Deployment** to GitHub Pages happens automatically

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to GitHub Pages (if you have permissions)
npm run deploy
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run tests**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure accessibility compliance
- Test on multiple devices and browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) for the amazing diagram rendering library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the powerful code editor
- [React](https://reactjs.org/) and the React ecosystem
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📊 Project Status

- ✅ Core functionality complete
- ✅ UI/UX optimization complete
- ✅ Accessibility features complete
- ✅ Performance optimization complete
- ✅ Testing coverage > 80%
- ✅ CI/CD pipeline active
- ✅ Documentation complete

---

**Made with ❤️ by the development team**