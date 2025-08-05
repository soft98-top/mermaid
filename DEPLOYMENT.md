# 🚀 Deployment Guide

## GitHub Pages Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions.

### Live URL
**Production**: [https://soft98-top.github.io/mermaid/](https://soft98-top.github.io/mermaid/)

### Deployment Status

[![Deploy to GitHub Pages](https://github.com/soft98-top/mermaid/actions/workflows/deploy.yml/badge.svg)](https://github.com/soft98-top/mermaid/actions/workflows/deploy.yml)

### Deployment Process

1. **Trigger**: Push to `main` branch
2. **Build**: 
   - Install dependencies
   - Run tests
   - Build production bundle
   - Optimize assets
3. **Deploy**: Upload to GitHub Pages
4. **Verify**: Check deployment status

### GitHub Actions Workflows

#### 1. Deploy Workflow (`.github/workflows/deploy.yml`)
- **Purpose**: Build and deploy to GitHub Pages
- **Trigger**: Push to main branch
- **Steps**:
  - Checkout code
  - Setup Node.js 18
  - Install dependencies
  - Run tests
  - Build application
  - Deploy to GitHub Pages

#### 2. CI/CD Pipeline (`.github/workflows/ci.yml`)
- **Purpose**: Code quality and testing
- **Trigger**: Push to main/develop, Pull requests
- **Steps**:
  - Code quality checks (ESLint, TypeScript)
  - Run tests with coverage
  - Security audit
  - Build verification

### Configuration

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/mermaid/' : '/',
  // ... other config
});
```

#### GitHub Pages Settings
- **Source**: GitHub Actions
- **Branch**: `main`
- **Path**: `/` (root)
- **Custom domain**: Not configured

### Environment Variables

No environment variables are required for deployment. All configuration is handled through:
- Build-time configuration in `vite.config.ts`
- Runtime feature detection
- Local storage for user preferences

### Deployment Checklist

Before deploying:
- [ ] All tests pass locally
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Performance is acceptable
- [ ] Accessibility features work
- [ ] Mobile responsiveness verified

### Troubleshooting

#### Common Issues

1. **Build Fails**
   - Check Node.js version (requires 18+)
   - Clear `node_modules` and reinstall
   - Check for TypeScript errors

2. **Assets Not Loading**
   - Verify `base` path in `vite.config.ts`
   - Check GitHub Pages settings
   - Ensure all assets are in `dist/` folder

3. **GitHub Actions Fails**
   - Check workflow logs
   - Verify permissions for GitHub Pages
   - Check if repository settings allow Actions

#### Manual Deployment

If automatic deployment fails, you can deploy manually:

```bash
# Build the project
npm run build

# The dist/ folder contains the built application
# Upload contents to your hosting provider
```

### Performance Optimization

The deployment includes several optimizations:

1. **Code Splitting**: Vendor libraries are split into separate chunks
2. **Asset Optimization**: Images and other assets are optimized
3. **Compression**: Gzip compression is enabled
4. **Caching**: Proper cache headers for static assets

### Monitoring

#### Deployment Metrics
- **Build Time**: ~2-3 minutes
- **Bundle Size**: ~1.1MB (gzipped: ~327KB)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)

#### Health Checks
- Application loads successfully
- All features work as expected
- No console errors
- Responsive design works on all devices

### Security

#### Security Measures
- No sensitive data in repository
- Dependencies are regularly audited
- HTTPS enforced on GitHub Pages
- Content Security Policy headers

#### Security Scanning
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm audit --audit-level=moderate
```

### Rollback Procedure

If a deployment causes issues:

1. **Immediate**: Revert the problematic commit
2. **Push**: Push the revert to trigger new deployment
3. **Verify**: Check that the application works correctly
4. **Investigate**: Debug the issue in a separate branch

### Future Improvements

Planned deployment enhancements:
- [ ] Add staging environment
- [ ] Implement blue-green deployment
- [ ] Add performance monitoring
- [ ] Set up error tracking
- [ ] Add automated accessibility testing

---

**Last Updated**: December 2024
**Deployment Version**: v1.0.0