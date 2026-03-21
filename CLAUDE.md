# CLAUDE.md — Real Estate Media Platform

## What This App Does

A B2B platform for professional real estate photography and videography services. Clients (real estate agents, property managers) book shoots, view delivered media, and download galleries. Admins manage everything. Photographers receive assignments and payouts.

**Core flows:**
1. Client books a shoot → selects package → pays via Stripe
2. Admin assigns a photographer, manages the shoot lifecycle
3. Photographer completes the shoot; admin uploads media to Cloudflare R2
4. Client accesses finished gallery, downloads ZIP
5. Photographer gets paid via Stripe Connect split payout

**Features:** booking management, photographer scheduling/payouts, media upload/delivery, Stripe payments, referral program, support tickets, configurable SMTP email templates, dynamic site content management, admin impersonation of clients.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS 4 |
| Frontend UI | Framer Motion (animations), Lucide React (icons), Sonner (toasts), next-themes |
| Backend | Django 6 + Django REST Framework 3, Python 3 |
| Auth | JWT via `djangorestframework-simplejwt` — email-based login (not username) |
| Database | PostgreSQL (prod via `DATABASE_URL`) / SQLite (local dev fallback) |
| Storage | Cloudflare R2 (S3-compatible) — presigned URLs for direct browser upload |
| Payments | Stripe 14 — payment links for clients, Stripe Connect for photographer payouts |
| Email | Configurable SMTP (stored in DB via `EmailConfiguration` model) + Resend SDK fallback |
| Static files | WhiteNoise (Django serves its own static files) |
| Web server | Gunicorn |

---

## Folder Structure

```
real-estate-media/
├── backend/
│   ├── config/
│   │   ├── settings.py        # All Django config — DB, CORS, JWT, Stripe, R2
│   │   ├── urls.py            # Root URL conf — mounts /api/
│   │   └── wsgi.py
│   ├── api/
│   │   ├── models.py          # All data models (see below)
│   │   ├── views.py           # All ViewSets + custom API endpoints
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # /api/ route definitions
│   │   ├── backends.py        # Email-based auth backend
│   │   ├── admin.py           # Django admin registration
│   │   └── utils/
│   │       ├── r2_utils.py    # Cloudflare R2 / S3 operations, presigned URLs
│   │       ├── email_utils.py # Send emails using DB-configured SMTP
│   │       ├── media_utils.py # Media file helpers
│   │       └── video_utils.py # Video processing
│   ├── migrations/            # Django DB migrations
│   ├── requirements.txt
│   ├── build.sh               # Render deploy script
│   ├── seed_data.json         # Initial fixture data
│   └── seed_media.py          # Seeds site media records
│
└── frontend/
    ├── src/
    │   ├── app/               # Next.js App Router
    │   │   ├── page.tsx                    # Public home page
    │   │   ├── about/, services/, gallery/ # Public marketing pages
    │   │   ├── book/                       # Booking flow
    │   │   ├── login/                      # Auth (client/admin/photographer)
    │   │   ├── shoot/[id]/                 # Public shoot delivery page
    │   │   ├── dashboard/                  # Client portal
    │   │   │   ├── bookings/, billing/, referrals/, support/, profile/
    │   │   ├── admin-portal/               # Admin management (15 pages)
    │   │   │   ├── shoots/, bookings/, photographers/, clients/
    │   │   │   ├── pricing/, gallery/, referrals/
    │   │   │   ├── email-config/, email-templates/
    │   │   │   ├── site-media/, site-settings/, calendar/, admins/
    │   │   └── photographer-portal/        # Photographer view
    │   ├── components/
    │   │   ├── Navbar.tsx, Footer.tsx
    │   │   ├── BookingForm.tsx
    │   │   ├── AdminSidebar.tsx
    │   │   ├── GalleryGrid.tsx
    │   │   ├── ImpersonationBanner.tsx     # Admin impersonating a client
    │   │   ├── CustomModal.tsx, UserSelectionModal.tsx
    │   │   ├── ThemeProvider.tsx, ThemeToggle.tsx
    │   │   └── ScrollReveal.tsx, ImageComparison.tsx
    │   ├── context/
    │   │   └── GlobalSettingsContext.tsx   # Site-wide settings from /api/settings/
    │   └── lib/utils.ts
    ├── next.config.ts         # Whitelisted image domains (Unsplash + R2)
    └── package.json
```

---

## Data Models

All models live in [backend/api/models.py](backend/api/models.py).

| Model | Purpose |
|---|---|
| `Service` | Service offerings (real_estate, commercial, add_on) |
| `GalleryImage` | Portfolio gallery (interior, exterior, twilight, aerial, commercial) |
| `Package` | Booking packages with JSON `features` list and display `order` |
| `Photographer` | Links to Django `User`, stores `share_percentage`, `stripe_account_id`, earnings |
| `PhotographerPayment` | Manual payment records for photographer payouts |
| `PhotographerSlot` | Date/time availability slots per photographer |
| `PhotographerRating` | 5-star ratings submitted post-shoot |
| `BookingRequest` | Initial inquiry from client — gets converted to a `ClientShoot` |
| `ClientShoot` | Core shoot record — links client, photographer, package, media, Stripe payment |
| `MediaItem` | Individual photo/video/tour files attached to a shoot (R2 URLs, watermark URLs) |
| `SiteMedia` | Dynamic website content (hero videos, before/after comparison images, etc.) |
| `EmailConfiguration` | SMTP credentials stored in DB (one active config at a time) |
| `EmailTemplate` | Reusable email templates by `slug` |
| `GlobalSettings` | Site name, logo, referral reward amount/type, admin alert email |
| `Referral` / `ReferralCredit` | Referral tracking and earned rewards |
| `SupportTicket` | Customer support issues |

---

## API Overview

Base path: `/api/` — all endpoints use JWT Bearer auth.

**Standard CRUD ViewSets:**
- `services/`, `gallery/`, `packages/`, `bookings/`, `shoots/`, `photographers/`
- `media-items/`, `site-media/`, `clients/`, `admins/`
- `email-configuration/`, `email-templates/`, `settings/`
- `photographer-payments/`, `support-tickets/`, `photographer-ratings/`
- `photographer/slots/`

**Custom endpoints:**
- `POST /api/register/` — client registration
- `POST /api/register-admin/` — admin registration
- `GET /api/me/` — current authenticated user
- `POST /api/password-reset/` — password reset
- `GET /api/availability/` — photographer slot availability
- `POST /api/stripe/webhook/` — Stripe webhook handler
- `POST /api/shoots/{id}/generate_invoice/`
- `POST /api/shoots/{id}/verify_payment/`
- `GET /api/shoots/{id}/get_upload_url/` — presigned R2 upload URL
- `POST /api/shoots/{id}/confirm_upload/`
- `GET /api/shoots/{id}/download_zip/`
- `POST /api/photographers/{id}/stripe_connect/`

**Token endpoints** (simplejwt):
- `POST /api/token/` — login → returns access + refresh
- `POST /api/token/refresh/`

---

## Environment Variables

### Backend (Render)
```
DATABASE_URL              # PostgreSQL connection string (Render sets this automatically)
SECRET_KEY                # Django secret key
DEBUG                     # false in production
ALLOWED_HOSTS             # Render app hostname
CORS_ALLOWED_ORIGINS      # Vercel frontend URL (comma-separated)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
AWS_ACCESS_KEY_ID         # Cloudflare R2 key
AWS_SECRET_ACCESS_KEY     # Cloudflare R2 secret
AWS_STORAGE_BUCKET_NAME   # R2 bucket name
AWS_S3_ENDPOINT_URL       # R2 endpoint URL
R2_PUBLIC_DOMAIN          # Public R2 domain for serving files
GCS_BUCKET_NAME           # Google Cloud Storage (optional alternative)
GCS_PROJECT_ID
GCS_CREDENTIALS_JSON
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL       # Backend URL, e.g. https://your-app.onrender.com
```

---

## Deployment

### Architecture
- **Frontend** → Vercel (auto-deploys from `main`)
- **Backend** → Render (web service, gunicorn)
- **Database** → Render managed PostgreSQL
- **Storage** → Cloudflare R2

### Backend deploy ([build.sh](backend/build.sh))
Render runs this on every deploy:
```bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py loaddata seed_data.json
python seed_media.py
```
Start command: `gunicorn config.wsgi:application`

### Frontend deploy
Vercel runs `next build` automatically. No special config beyond setting `NEXT_PUBLIC_API_URL`.

### Image domains
Whitelisted in [frontend/next.config.ts](frontend/next.config.ts):
- `images.unsplash.com` — placeholder/stock images
- `08a7edb7f6eb264d84969fdd077c8aa5.r2.cloudflarestorage.com` — R2 bucket
- `pub-32b76ab83d8e4d1787e427b8e5742a0b.r2.dev` — R2 public domain

---

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver        # runs on :8000, uses SQLite by default
```

**Frontend:**
```bash
cd frontend
npm install
# create .env.local with: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                       # runs on :3000
```

---

## Important Notes

- **Auth is email-based**, not username-based. The custom `EmailBackend` in [backend/api/backends.py](backend/api/backends.py) handles this.
- **CORS**: In development (`DEBUG=True`) all origins are allowed. In production, only origins listed in `CORS_ALLOWED_ORIGINS` env var are permitted.
- **Media uploads go directly to R2** via presigned URLs — the backend issues the URL, the browser uploads directly, then calls `confirm_upload` to register the file.
- **Stripe Connect** is used for photographer payouts — each photographer can have a linked `stripe_account_id`. The `share_percentage` field on `Photographer` controls the split.
- **Email config is stored in the database** (not env vars), managed via the admin portal's email-config page. This allows runtime changes without redeployment.
- **`seed_data.json` runs on every Render deploy** — it uses `loaddata` so it only inserts if records don't exist (natural keys / PKs). Don't add records you don't want re-seeded.
- **Three user roles**: client (default), photographer (has `photographer_profile`), admin (`is_staff=True`). Role is determined by checking these Django model relationships.
- **`GlobalSettingsContext`** in the frontend fetches `/api/settings/` on load and provides site name, logo, referral config etc. to all pages — avoid hardcoding these values in components.
