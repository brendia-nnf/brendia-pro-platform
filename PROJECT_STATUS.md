# Brendia Pro - Unified Project Status

**Last Updated:** July 8, 2026

---

## Project Architecture

```
BrendiaPro/
├── brendia-pro/                    # Marketing Website (Next.js)
├── brendia-pro-platform/           # Student Platform (Next.js)
└── brendia_pro_app/                # Mobile App (Flutter)
```

**Shared Infrastructure:** Single Supabase database across all apps

---

## Overall Completion Status

| Component | Status | Notes |
|-----------|--------|-------|
| Marketing Website | ✅ 95% | Missing video files, deployment pending |
| Student Platform | ✅ 90% | TypeScript fixes, email integration pending |
| Mobile App (Flutter) | ✅ 80% | API integration, release prep pending |
| Database/Supabase | ✅ Complete | All migrations ready |
| Payment Gateway | ✅ Complete | Monri integrated (replaced Stripe) |

---

## ✅ COMPLETED

### Marketing Website (brendia-pro/)

- [x] Full marketing website with all pages
- [x] GSAP + Lenis animation infrastructure
- [x] SEO (sitemap, robots.txt, JSON-LD structured data)
- [x] Optimized images from photoshoot
- [x] Contact form with API route
- [x] Responsive design
- [x] Monri payment gateway integration
- [x] Checkout page with full data collection
- [x] Magic link enrollment system
- [x] Newsletter subscriber system
- [x] Onboarding form

### Student Platform (brendia-pro-platform/)

- [x] Database migrations (7 migration files)
- [x] Supabase Auth integration
- [x] All platform API endpoints (auth, user, course, progress, certification, admin)
- [x] Admin panel with real data
- [x] Rate limiting on auth endpoints
- [x] Admin role validation in middleware
- [x] Password change functionality
- [x] Progress tracking from database
- [x] Certificate generation (HTML template)
- [x] Security headers
- [x] Video player with Mux integration
- [x] Device management
- [x] Webshop with products

### Mobile App (brendia_pro_app/)

- [x] Flutter project structure
- [x] Theme and UI components (BpButton, BpCard, BpInput, etc.)
- [x] Authentication (login, register, forgot password)
- [x] Dashboard with all cards
- [x] Course player with Chewie
- [x] Progress tracking (95% = complete)
- [x] Certification screen
- [x] Profile screen
- [x] App icons and splash screen
- [x] Croatian UI text

### Database Functions

- [x] `has_active_enrollment(user_id, course_id)`
- [x] `get_user_progress(user_id)`
- [x] `get_last_watched(user_id)`
- [x] `register_device(...)`
- [x] `update_certification_eligibility(user_id)`
- [x] `generate_certificate_number()`
- [x] `generate_order_number()`
- [x] `validate_coupon(code, subtotal, user_id)`

---

## ❌ REMAINING WORK

### HIGH PRIORITY (Before Launch)

#### Environment & Deployment

| Task | Project | Notes |
|------|---------|-------|
| Run master migration in Supabase | All | `000_master_migration.sql` |
| Configure Monri credentials | Marketing | `MONRI_MERCHANT_KEY`, etc. |
| Configure Resend API key | All | For email sending |
| Deploy marketing site to Vercel | Marketing | Connect GitHub, add env vars |
| Deploy platform to Vercel | Platform | Configure `app.brendiapro.hr` |
| Configure Monri callback URL | Marketing | `https://brendiapro.hr/api/monri/callback` |

#### Platform Fixes

| Task | Location | Notes |
|------|----------|-------|
| TypeScript strict mode fixes | API routes | Add type assertions for Supabase queries |
| Email notifications (Resend) | `lib/email/` | Certification approval/rejection |
| CSP hardening | `middleware.ts` | Remove `unsafe-inline`/`unsafe-eval` |
| Create kit status page | `app/[locale]/(dashboard)/kit/` | Show kit delivery status |

#### Marketing Site

| Task | Location | Notes |
|------|----------|-------|
| Add video files | `public/videos/` | `nikolina-welcome.mp4`, `courses-intro.mp4` |
| Update masterclass dates | `onboarding/page.tsx` | Currently shows old dates |

### MEDIUM PRIORITY

#### Platform

| Task | Notes |
|------|-------|
| Course editing API | Add/edit/delete levels and chapters |
| Zod validation on all routes | Input validation schemas |
| Image upload verification | Content type checks |
| Cart database persistence | Sync cart for logged-in users |
| Loading states/skeletons | All data-fetching components |
| Error boundaries | Graceful error handling |

#### Mobile App

| Task | Notes |
|------|-------|
| Connect to real API | Replace `useMockData = true` |
| Token refresh interceptor | For API client |
| `flutter_secure_storage` | Token persistence |
| Real video URL handling | From Mux |
| Progress sync with server | Real-time updates |
| Offline detection banner | `connectivity_plus` |
| Pull-to-refresh | Dashboard |
| Configure iOS signing | Certificates, provisioning |
| Configure Android signing | Keystore |
| App Store screenshots | Croatian |
| TestFlight submission | iOS beta |
| Play Console submission | Android beta |

### LOW PRIORITY (Nice to Have)

| Task | Project | Notes |
|------|---------|-------|
| PDF certificate service | Platform | Use Puppeteer/PDFShift |
| Accessibility improvements | All | ARIA labels, keyboard nav |
| Admin export (CSV/Excel) | Platform | Orders, students |
| Push notifications | Mobile | Firebase |
| Offline video download | Mobile | For course content |
| Dark mode | Mobile | Theme toggle |
| Analytics integration | All | Google Analytics/Plausible |
| Error monitoring | All | Sentry |

---

## Pre-Launch Testing Checklist

### Checkout Flow
- [ ] Test with Monri test cards
- [ ] Complete test purchase (Foundation €3,750)
- [ ] Complete test purchase (Master €5,000)
- [ ] Verify order in Supabase
- [ ] Verify magic link email sent
- [ ] Test activation flow on platform
- [ ] Verify enrollment created

### Platform
- [ ] Registration flow
- [ ] Login/logout
- [ ] Password reset
- [ ] Course access with enrollment
- [ ] Video playback
- [ ] Progress tracking (95% completion)
- [ ] Certification application
- [ ] Admin panel access (admin role only)

### Mobile App
- [ ] Login with test credentials
- [ ] Dashboard loads correctly
- [ ] Video player works
- [ ] Progress saves
- [ ] Profile displays

### Forms
- [ ] Contact form submission
- [ ] Newsletter subscription
- [ ] Onboarding form

### Internationalization
- [ ] All pages work with `/en/`
- [ ] All pages work with `/hr/`
- [ ] Language switcher works

---

## Environment Variables Reference

### Marketing Website (brendia-pro/.env.local)
```env
NEXT_PUBLIC_SITE_URL=https://brendiapro.hr
NEXT_PUBLIC_PLATFORM_URL=https://app.brendiapro.hr
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MONRI_MERCHANT_KEY=
MONRI_AUTHENTICITY_TOKEN=
MONRI_ENVIRONMENT=test
RESEND_API_KEY=
```

### Student Platform (brendia-pro-platform/.env.local)
```env
NEXT_PUBLIC_SITE_URL=https://app.brendiapro.hr
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_SIGNING_KEY=
MUX_SIGNING_KEY_ID=
RESEND_API_KEY=
MOBILE_API_KEY=
```

### Mobile App
```
ENVIRONMENT=production
MOBILE_API_KEY=your-uuid-api-key
```

---

## Courses & Pricing

| Course | Base Price | VAT (25%) | Total | Package |
|--------|------------|-----------|-------|---------|
| Foundation | €3,000 | €750 | €3,750 | basic |
| Master | €4,000 | €1,000 | €5,000 | advanced |
| Artist 1v1 | €2,000 | €500 | €2,500 | basic |
| Master 1v1 | €5,000 | €1,250 | €6,250 | advanced |

---

## Test Credentials

### Monri Test Cards
| Card | Type |
|------|------|
| 4341792000000044 | Visa 3DS |
| 4058400000000005 | Visa |
| 5464000000000008 | Mastercard |

CVV: Any 3 digits, Expiry: Any future date

### Mobile App Mock Mode
**Email:** `ana.horvat@email.hr` or `marija.kovac@email.hr`
**Password:** `demo123`, `test123`, or `123456`

---

## Quick Commands

```bash
# Marketing site dev
cd brendia-pro && npm run dev

# Platform dev
cd brendia-pro-platform && npm run dev

# Mobile app
cd brendia_pro_app && flutter run -d "iPhone"

# Test Monri locally (with ngrok)
ngrok http 3000
# Then configure callback URL in Monri portal
```

---

## Recent Changes (July 8, 2026)

### Platform Security & Features
- Added admin role validation in middleware
- Removed demo controls from certification page
- Added rate limiting to all auth endpoints
- Created coupons CRUD API
- Created order status update API
- Updated all admin components to use real APIs
- Implemented working password change
- Fixed hardcoded 65% progress
- Added certificate generation

### Cleanup
- Removed `@ts-nocheck` from 28+ files
- Consolidated documentation into this file

---

## Important Guidelines

- **DO NOT** use "IBE", "ibe", or "invisible bead extensions"
- **USE** "weft extensions" as the technique terminology
- Brand name: "Brendia Pro" (capital B, capital P)
