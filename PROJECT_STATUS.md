# Brendia Pro - Unified Project Status

**Last Updated:** July 13, 2026

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
| **Run migration 010 in Supabase** | Platform | `010_photo_submissions.sql` (photo submissions feature) | ✅ Done |
| **Run migration 011 in Supabase** | Platform | `011_kit_status.sql` (kit status fields) | ✅ Done |
| **Run migration 012 in Supabase** | Platform | `012_course_restructure.sql` (Artist 8ch / Advanced) | ⏳ To do |
| Verify `NEXT_PUBLIC_APP_URL` on Vercel | Platform | Needed for correct Monri success/callback URLs | ⏳ To do |
| Configure Mux credentials | Platform | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY`, `MUX_SIGNING_KEY_ID` in Vercel | ⏳ To do |
| Upload course videos to Mux | Platform | Signed playback policy; paste playback IDs in `/admin/sadrzaj` | ⏳ To do |
| Mark practical chapters in admin | Platform | Toggle "Fotografije rada" per chapter in `/admin/sadrzaj` | ⏳ After 010 |
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
| Photo submission flow | 3-photo upload after practical chapters (gate is enforced server-side, so app must handle 403 `photos_required` from progress API) |
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

## Recent Changes (July 13, 2026 — part 3)

### Course Restructure: Artist / Advanced
- **Migration `012_course_restructure.sql`** (⏳ RUN IN SUPABASE):
  - Level 1 = **Brendia Pro® Artist** (basic, 8 chapters — one per filmed video;
    old L2's first 3 chapters merged in, rest deleted).
  - Level 2 = **Advanced Brendia Pro® Artist** (advanced package), **unpublished**
    until its videos are filmed (publish via the eye toggle in /admin/sadrzaj).
  - Certification eligibility is now package-based: all published chapters in
    basic-package levels watched + photo sets approved.
- Platform access checks are now `required_package`-based (no more hardcoded
  "level 3 = advanced"), so levels can be added/renumbered freely.
- Admin course editor: chapter **edit modal** (title/EN title/description/
  duration/publish), level **publish toggle** (eye icon), plus existing video +
  photo toggles. Admins see unpublished levels/chapters; students never do.

### Advanced Purchase Gating (marketing site)
- `/api/checkout`: **master-certification is rejected unless the buyer's email
  belongs to a platform account with an APPROVED certification** (Croatian
  error message shown in the checkout form).
- Monri callback: Advanced purchases **skip the activation flow** — the
  advanced enrollment is created directly on the existing account and the
  student gets an "access unlocked" email (no password reset).
- Course display names renamed everywhere: Foundation Certification →
  "Brendia Pro® Artist", Master Certification → "Advanced Brendia Pro® Artist"
  (course IDs unchanged for data continuity).

### Monri Single-URL Problem — Solved Properly
- Monri's dashboard allows only ONE success URL and ONE callback URL per
  merchant. Fixes:
  - Both sites now send **`success_url_override` / `cancel_url_override`**
    per transaction (Monri ignores plain `success_url`), so platform webshop
    buyers return to the platform and course buyers to the marketing site.
  - The dashboard callback URL stays pointed at the **marketing site**
    (`/api/monri/callback`). Orders it doesn't recognize (webshop, `BW-...`
    prefix — new) are **forwarded to the platform callback** as JSON, signed
    with SHA512(merchant_key + body) in an `x-forward-digest` header; the
    platform callback verifies the signature before processing.
  - Platform webshop order numbers now use the `BW-` prefix (was `BP-`,
    colliding with course orders).
- Email template links (dashboard buttons etc.) are now env-driven
  (`NEXT_PUBLIC_APP_URL`) instead of hardcoded to app.brendiapro.hr, so
  test-phase emails link to the Vercel test domain.

### Webshop Success URL Fix
- `lib/monri/config.ts` now falls back `NEXT_PUBLIC_APP_URL` →
  `NEXT_PUBLIC_SITE_URL` → localhost. **Verify `NEXT_PUBLIC_APP_URL` is set on
  the platform's Vercel project** — if it was missing, Monri fell back to the
  portal-configured (marketing) success URL, and webshop callbacks may have
  gone to the marketing callback (check for stuck "pending" webshop orders).

---

## Recent Changes (July 13, 2026 — part 2)

### Mock Data Eliminated (student side is now fully real)
- `useProgress` hook rewired to `/api/progress` + `/api/certification` +
  `/api/course/levels`. Dashboard progress cards, sidebar level links (now real
  UUIDs — old links pointed to nonexistent mock IDs), and the certification
  banner (only shows when status is `eligible`) are all data-driven.
- Profile: DeviceManagement → `/api/user/devices` (with real logout),
  PurchaseHistory → `/api/user/purchases` (course-id name map fixed to real ids).
- `lib/mock-data/` **deleted** — nothing imports it anymore.

### Mux Playback Ready
- Chapter API now generates **signed, expiring Mux HLS URLs** from stored
  playback IDs (`generateSignedPlaybackUrl`, viewer_id = user id). Direct
  http(s) URLs still pass through for testing.
- VideoPlayer supports HLS via lazy-loaded `hls.js` (Chrome/Firefox; Safari native).
- Admin: video icon per chapter in `/admin/sadrzaj` opens a modal to paste the
  Mux playback ID; "Bez videa" badge marks chapters without video.
- **To go live with videos:** create Mux account → set 4 MUX_* env vars in
  Vercel → upload videos (signed playback policy) → paste playback IDs in admin.

### Kit Status (real, admin-managed)
- **Migration `011_kit_status.sql`** (⏳ RUN IN SUPABASE): `kit_status`,
  `kit_tracking_number`, `kit_shipped_at` on enrollments.
- Student dashboard kit card now fetches `/api/user/kit` (was hardcoded "shipped");
  shows tracking number; hidden when no enrollment.
- Admin: Kit column in `/admin/studenti` with modal (status + tracking number);
  setting "Poslan" emails the student (`welcomeBoxShippedEmail`).

---

## Recent Changes (July 13, 2026)

### Photo Submissions (Student Work) — NEW FEATURE
After each **practical** chapter, students must submit 3 photos of their work
(front, left, right) before the next chapter unlocks. Nikolina reviews each
submission (approve / request redo with feedback). Certification eligibility
now also requires all required photo sets to be **approved**.

- **Migration `010_photo_submissions.sql`** (⏳ RUN IN SUPABASE): `photo_submissions`
  table, `chapters.requires_photos` flag, private `student-work` storage bucket,
  `can_start_chapter()` gate function, updated `update_certification_eligibility()`.
- **Student APIs:** `POST /api/photo-submissions/upload` (private bucket, signed
  URLs), `GET/POST /api/photo-submissions`. Sequential unlock now enforced
  **server-side** in `POST /api/progress/[chapterId]` (mobile app can't bypass).
- **Admin APIs:** `GET /api/admin/photo-submissions` (queue),
  `PATCH /api/admin/photo-submissions/[id]` (approve/redo + Resend email to
  student), `PATCH /api/admin/chapters/[id]` (toggle `requiresPhotos`).
- **Student UI:** course player (`/tecaj/...`) rewired from mock data to real
  course/progress APIs; new `PhotoSubmissionPanel` (3 camera slots, status
  banners, redo feedback); photo-aware `CompletionModal`; new sidebar chapter
  states (awaiting photos / in review / redo requested).
- **Admin UI:** new `/admin/radovi` page (pending/approved/redo tabs, review
  modal with 3 photos side-by-side + attempt history); camera toggle per
  chapter in course editor (`/admin/sadrzaj`).
- **After running the migration:** toggle "Fotografije rada" ON for each
  practical chapter in `/admin/sadrzaj` (defaults to off for all chapters).
- Note: dashboard progress widgets (`useProgress` hook) still use mock data —
  pre-existing gap, next candidate for rewiring.

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
