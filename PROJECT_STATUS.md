# Brendia Pro - Unified Project Status

**Last Updated:** July 9, 2026

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
| Marketing Website | ✅ 97% | Deployed to Vercel; missing video files. Email delivery fixed |
| Student Platform | ✅ 97% | Deployed to Vercel; admin panel fixed. Email working |
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
- [x] TypeScript strict mode (all 39 API/component files typed)

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

| Task | Project | Notes | Status |
|------|---------|-------|--------|
| Run master migration in Supabase | All | `000_master_migration.sql` + `009_fix_admin_fk_relationships.sql` | ✅ Done |
| Configure Monri credentials | Marketing | `MONRI_MERCHANT_KEY`, etc. | ✅ Done (test mode) |
| Configure Resend API key | All | For email sending | ✅ Done |
| Deploy marketing site to Vercel | Marketing | Connect GitHub, add env vars | ✅ Done |
| Deploy platform to Vercel | Platform | Configure `app.brendiapro.hr` | ✅ Done |
| Configure Monri callback URL | Marketing | `https://brendiapro.hr/api/monri/callback` | ✅ Done (test) |
| **Switch Monri to production** | Marketing | Set `MONRI_ENVIRONMENT=production` + prod creds + prod callback URL | ⏳ Before go-live |
| Add `RESEND_FROM_EMAIL` to Vercel | Marketing | Optional; `Brendia Pro <info@brendiapro.hr>` (code default now covers it) | ⏳ Optional |

#### Platform Fixes

| Task | Location | Notes |
|------|----------|-------|
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

## Recent Changes (July 9, 2026)

### Email Delivery Fix (Marketing)
- Fixed activation email sender: Monri callback fell back to Resend's test
  domain (`onboarding@resend.dev`), which only delivers to the account owner —
  real customers never received their account-activation link, and the error
  was silently swallowed. Now defaults to verified `info@brendiapro.hr`.
- Confirmed Resend domain (SPF/DKIM/DMARC) and API key are healthy; delivery
  works end-to-end. Root cause of "emails not delivering" was missing env vars
  on Vercel + the test-domain fallback.

### Admin Panel Fixes (Platform)
- **Fixed 500s on `/admin`, `/studenti`, `/certifikati`.** `enrollments.user_id`
  and `certifications.user_id` referenced `auth.users` only, so PostgREST could
  not embed `profiles` (PGRST200). Added migration `009_fix_admin_fk_relationships.sql`
  (backfills profiles + adds FKs to `public.profiles`). Verified live.
- **Fixed `/narudzbe` not showing what was ordered.** Course orders now populate
  an `items` field, and the order detail modal renders a "Stavke narudžbe"
  section. Mapped full `course_id` values (`foundation-certification`, etc.) to
  readable names.

### Deployment
- Both apps deployed to Vercel (push-to-`main` → production deploy).
- Master migration + migration 009 run in Supabase.
- Monri configured in **test** mode (switch to production before go-live).

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

### TypeScript Fixes (39 files)
- Added explicit type interfaces for all Supabase query results
- Fixed 'never' type inference with type assertions
- Added CookieOptions typing to middleware and server client
- Fixed formatDate calls (wrap string dates with new Date())
- Build now passes successfully with strict TypeScript

### Cleanup
- Removed `@ts-nocheck` from 28+ files
- Consolidated documentation into this file

---

## Important Guidelines

- **DO NOT** use "IBE", "ibe", or "invisible bead extensions"
- **USE** "weft extensions" as the technique terminology
- Brand name: "Brendia Pro" (capital B, capital P)
