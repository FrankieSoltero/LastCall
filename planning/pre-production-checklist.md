# Pre-Production Checklist

This document tracks items that need to be addressed before moving to production.

---

## 🎨 UI/UX Improvements

### Time Picker Library Replacement

**Status:** 🟡 Technical Debt

**Current State:**
- Using `@react-native-community/datetimepicker` (works with Expo Go)
- Located in: `app/(app)/generalAvailability.tsx` (and any schedule/availability pages)

**Production Goal:**
- Switch to `react-native-date-picker`
- Reason: Better UX, more customizable, matches design system
- Blocker: Doesn't work with Expo Go (development constraint)

**When to Update:**
- Before submitting to App Store/Play Store
- After moving away from Expo Go to development builds

**Implementation Notes:**
```bash
# Remove community version
npm uninstall @react-native-community/datetimepicker

# Install production version
npm install react-native-date-picker
```

**Files to Update:**
- `app/(app)/generalAvailability.tsx` - General availability time picker
- Any schedule-specific availability pages
- Any shift management pages with time inputs

**Reference:**
- react-native-date-picker: https://github.com/henninghall/react-native-date-picker
- @react-native-community/datetimepicker: https://github.com/react-native-datetimepicker/datetimepicker

---

## 🔐 Security

### Items to Review Before Production

- [ ] Remove any console.log statements with sensitive data
- [ ] Verify all API endpoints use authentication middleware
- [ ] Check rate limiting is properly configured
- [ ] Review CORS settings for production domains
- [ ] Ensure environment variables are properly set in production
- [ ] Remove any hardcoded API URLs (use environment variables)
- [ ] Verify all user input is sanitized and validated

---

## 🚀 Performance

### Items to Optimize Before Production

- [ ] Add proper image optimization/caching
- [ ] Implement pagination for large lists (employees, schedules, etc.)
- [ ] Add loading skeletons instead of blank screens
- [ ] Optimize bundle size (check for unused dependencies)
- [ ] Add error boundaries for better error handling
- [ ] Implement offline support/data caching where applicable

---

## 📱 Platform-Specific

### iOS

- [ ] Configure push notifications
- [ ] Test on various iOS versions (minimum supported version: ?)
- [ ] Configure app signing and provisioning profiles
- [ ] Add App Store screenshots and metadata
- [ ] Test deep linking for invite links

### Android

- [ ] Configure push notifications
- [ ] Test on various Android versions (minimum SDK: ?)
- [ ] Configure app signing (keystore)
- [ ] Add Play Store screenshots and metadata
- [ ] Test deep linking for invite links

---

## 🧪 Testing

### Before Production Launch

- [ ] End-to-end testing of critical flows:
  - [ ] User registration and login
  - [ ] Organization creation
  - [ ] Employee invitation and approval
  - [ ] Schedule creation and publishing
  - [ ] Availability submission
  - [ ] Shift assignment
- [ ] Test on real devices (not just simulators)
- [ ] Test with poor network conditions
- [ ] Load testing on backend
- [ ] Security audit

---

## 📊 Analytics & Monitoring

### Items to Implement

- [ ] Add analytics tracking (Firebase, Mixpanel, etc.)
- [ ] Set up error monitoring (Sentry, Bugsnag, etc.)
- [ ] Add performance monitoring
- [ ] Set up backend logging and monitoring
- [ ] Create admin dashboard for monitoring

---

## 🔄 CI/CD

### Deployment Pipeline

- [ ] Set up automated builds for iOS
- [ ] Set up automated builds for Android
- [ ] Configure staging environment
- [ ] Set up automated backend deployments
- [ ] Add automated testing in CI pipeline
- [ ] Configure release management workflow

---

## 📄 Documentation

### Items to Complete

- [ ] User guide/help documentation
- [ ] Admin guide for organization owners
- [ ] API documentation (if exposing to third parties)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] App Store description and marketing materials

---

## 🎯 Feature Completeness

### Core Features Status

- [x] User authentication (Supabase)
- [x] Organization management
- [x] Employee management
- [x] General availability
- [ ] Schedule-specific availability
- [ ] Schedule creation
- [ ] Shift assignment
- [ ] Role management
- [ ] Push notifications for new schedules
- [ ] Email notifications

---

## Notes

Add any additional notes or observations here as development progresses.

**Last Updated:** 2025-12-19
