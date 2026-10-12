# White Lotus: Property Showcase & Inquiry Manager

An internal tool for the White Lotus sales team: browse and filter luxury listings with buyers, capture buyer inquiries from each property page, and manage listings and inquiries from a key-protected sales desk.

**Stack:** React 19 + TypeScript + Tailwind CSS (Vite) · FastAPI (Python) · PostgreSQL · SQLAlchemy + Alembic

| Area | What's there |
| --- | --- |
| Listings | Grid with photo, name, location, price, size, bedrooms and short description. Filter by location and minimum bedrooms, sort by price, size or newest. Filters live in the URL, so a filtered view can be shared. |
| Detail page | Full description, spec list (incl. price per sq ft), inquiry form |
| Inquiries | Name, email, phone, message; stored in Postgres and listed for the sales team with the property each one relates to |
| Sales desk (`/admin`) | Add, edit and delete listings with validation; inquiries table filterable by residence |
| Schema | Alembic migration in `backend/alembic/versions/`, plain SQL in `backend/db/schema.sql` |

---

## Run it locally

**Prerequisites:** Python 3.11+, Node.js 20.19+ (or 22.12+), and Docker (for Postgres).

No Docker? Install PostgreSQL 16+ directly (on Windows, the installer from postgresql.org), set the `postgres` user's password to `postgres` during setup, then create the database with `psql -U postgres -c "CREATE DATABASE whitelotus;"`. The defaults in `.env.example` and the tests then work unchanged.

### 1. Database

```bash
docker compose up -d          # Postgres 16 on localhost:5432, user/password postgres/postgres
```

### 2. Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
alembic upgrade head          # creates the tables
python -m app.seed            # 8 sample Bengaluru listings (skips if data exists)
uvicorn app.main:app --reload
```

Interactive API docs: http://localhost:8000/docs

### 3. Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

In development Vite proxies `/api` to `localhost:8000`, so no extra config is needed.

**Sales desk:** open http://localhost:5173/admin and enter the `ADMIN_API_KEY` from `backend/.env` (default `change-me`).

### Tests

```bash
cd backend
pytest
```

Tests run against a real Postgres database, `whitelotus_test`, which they create if it's missing, so CHECK constraints and foreign-key behaviour are tested as they run in production. Override the connection with `TEST_DATABASE_URL`.

---

## API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/properties?location=&min_bedrooms=&min_price=&max_price=&sort=` | public | List with filters; `sort` is `newest`, `price_asc`, `price_desc` or `size_desc` |
| GET | `/api/properties/locations` | public | Distinct locations for the filter dropdown |
| GET | `/api/properties/{id}` | public | One property |
| POST | `/api/properties/{id}/inquiries` | public | Submit an inquiry |
| POST / PUT / DELETE | `/api/properties[/{id}]` | admin | Create / update / delete |
| GET | `/api/inquiries?property_id=` | admin | Inquiries with property name, newest first |

Admin endpoints need an `X-Admin-Key` header. Validation errors return `422` with `{"detail": "...", "errors": {"field": "message"}}`.

---

## Architecture and design decisions

The repo is split into `backend/` (FastAPI) and `frontend/` (React SPA) that talk over a small REST API, so each can be deployed and scaled on its own. On the backend, Pydantic schemas are the single place request validation lives (positive price, required fields, URL, email and phone shape). Database CHECK constraints back them up, so bad data can't get in even if the API is bypassed. I chose PostgreSQL because the data is relational: an inquiry belongs to a property. The foreign key uses `ON DELETE SET NULL` rather than `CASCADE`, so deleting a listing never destroys sales leads; the dashboard shows them as "Listing removed". Price is stored as whole rupees in a `BIGINT` to avoid floating-point rounding, and the UI formats it the way buyers read it (₹7.25 Cr, ₹7,25,00,000). Sorting uses a whitelist of named options rather than raw column names, which keeps the API safe and predictable. The frontend keeps all HTTP in one typed client (`src/api.ts`) and one `useApi` hook for loading, error and retry. Every screen has explicit loading, empty and error states, and forms validate on the client for quick feedback while still showing the server's field errors.

**Trade-offs given the 24-hour limit:**

- **Admin auth is one shared key**, not real user accounts. It's enough to keep buyers out of the sales desk, but there's no per-person login or audit trail.
- **No pagination.** It's fine for a boutique portfolio of tens of listings, but it would need adding at scale.
- **One image per property, by URL**, rather than uploads or a gallery.
- **Filtering and sorting happen in SQL**, but inquiry filtering on the dashboard is client-side, since the list is small.

## What I'd do next with more time

1. Proper staff login (e.g. OAuth with the company's Google Workspace) with roles, and an audit log of who edited what.
2. Image uploads to object storage (S3/R2) with multiple photos per property and a gallery on the detail page.
3. Inquiry workflow: status (new → contacted → site visit → closed), assignment to a sales rep, notes, and an email alert to the team on new inquiries.
4. Pagination, plus a price-range filter in the UI (the API already supports `min_price` and `max_price`).
5. Spam protection on the public inquiry form (rate limiting, honeypot field or CAPTCHA).
6. Frontend tests (React Testing Library for forms, Playwright for the main buyer flow) and CI to run both test suites on every push.

---

## Deployment

**API + database on Render.** In the Render dashboard choose *New → Blueprint* and select this repo. `render.yaml` creates a free Postgres database and the API service, which runs migrations and seeds on start. After the first deploy:

- copy the generated `ADMIN_API_KEY` from the service's Environment tab, and
- set `CORS_ORIGINS` to the frontend URL (below).

Render's free tier sleeps when idle, so the first request after a while can take 30–60 seconds, and free Postgres databases have a time limit. Check Render's current free-tier terms.

**Frontend on Vercel.** Import the repo, set **Root Directory** to `frontend`, and add the environment variable `VITE_API_URL` = your Render API URL (e.g. `https://white-lotus-api.onrender.com`). `vercel.json` rewrites all routes to `index.html` so deep links like `/properties/3` work.

Live demo: _add link here_

---

## Project structure

```
backend/
  app/
    main.py          FastAPI app, CORS, 422 error formatting
    config.py        settings from environment variables
    database.py      engine and per-request session
    models.py        Property, Inquiry tables
    schemas.py       Pydantic request/response models (validation)
    deps.py          admin-key guard
    routers/         properties.py, inquiries.py
    seed.py          sample data
  alembic/           migrations
  db/schema.sql      plain-SQL schema
  tests/             pytest API tests
frontend/
  src/
    api.ts           typed API client
    useApi.ts        loading/error/retry hook
    format.ts        ₹ Cr / lakh formatting
    components/      Layout, InquiryForm, Field, PropertyImage, States
    pages/           ListingsPage, PropertyDetailPage, admin/*
```

See [AI_USAGE.md](AI_USAGE.md) for how AI tools were used.
