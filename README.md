# Votely — Online Awards & Voting Platform

Votely is a specialized online platform allowing organizations and creators to host, manage, and operate professional awards competitions with verified voter participation via SMS OTP and server-enforced voting integrity.

---

## 1. Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Dark navy and violet design identity)
- **Database & ORM:** PostgreSQL & Prisma ORM
- **Authentication & Security:** Bcrypt (12 salt rounds), cryptographically secure session tokens, HTTP-only SameSite cookies, server-side route guards, sliding-window rate limiting.

---

## 2. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/votely_dev?schema=public"

# Session cryptographic secret (min 32 characters)
SESSION_SECRET="your-32-character-minimum-random-secret-key"

NODE_ENV="development"
```

> **Security Note:** Never commit secrets or database credentials to version control.

---

## 3. Database Setup & Migrations

### Running Migrations
To initialize or apply database migrations:

```bash
# Apply migrations to the development database
npx prisma migrate dev

# Generate the Prisma client
npx prisma generate
```

### Applying Migrations to Test Database
For automated testing against an isolated database:

```bash
# In PowerShell:
$env:DATABASE_URL="postgresql://username:password@localhost:5432/votely_test?schema=public"
npx prisma migrate deploy
$env:DATABASE_URL=$null
```

---

## 4. Category & Nominee Architecture (Phase 4)

### Data Models
- **`Category` Table:**
  - `id`: CUID primary key.
  - `eventId`: Foreign key referencing `Event.id` with `onDelete: Cascade`.
  - `name`: Category name (2–100 characters). Enforces `@@unique([eventId, name])` so category names are unique within each event.
  - `description`: Optional text description of evaluation criteria.
  - `displayOrder`: Integer order index.
  - `nominees`: Relational link to nominees.
- **`Nominee` Table:**
  - `id`: CUID primary key.
  - `eventId`: Foreign key referencing `Event.id` with `onDelete: Cascade`.
  - `categoryId`: Foreign key referencing `Category.id` with `onDelete: Cascade`.
  - `name`: Nominee name (2–100 characters). Enforces `@@unique([categoryId, name])` so nominee names are unique within their category.
  - `description`: Optional bio or project summary.
  - `imageUrl`: Validated public image asset URL (handles missing or invalid images gracefully).
  - `displayOrder`: Integer order index.

### Relational Integrity & Cascade Deletion Safety
- Deleting an event cascades cleanly to all its categories and nominees.
- Deleting a category cascades cleanly to its roster of nominees, preventing orphaned nominee rows.
- Cross-event mismatch protection: Server actions verify that `category.eventId === eventId` and that the authenticated organizer owns the event before creating or updating nominees.

### Lifecycle Deletion & Structural Locking Rules
- **`DRAFT` & `SCHEDULED`:** Organizers have full flexibility to create, edit, reorder, and delete categories and nominees.
- **`LIVE`:** Organizers may roster additional nominees or refine text, but category/nominee deletions are strictly blocked to protect active voter ballots.
- **`FINALIZED` & `ARCHIVED`:** All category and nominee mutations (creation, editing, deletion) are permanently locked on the server to preserve the certified historical audit trail.

---

## 5. Running Tests & Verification

### Run Automated Test Suites
```bash
# In PowerShell:
$env:DATABASE_URL="postgresql://username:password@localhost:5432/votely_test?schema=public"
npx tsx tests/auth.test.ts
npx tsx tests/events.test.ts
npx tsx tests/categories-nominees.test.ts
$env:DATABASE_URL=$null
```

- **Authentication Suite (`tests/auth.test.ts`):** 30 assertions covering registration, normalized emails, bcrypt hashes, login, rate limiting, and role isolation.
- **Events Suite (`tests/events.test.ts`):** 34 assertions covering event persistence, slug generation, collisions, date ordering, and lifecycle transitions.
- **Categories & Nominees Suite (`tests/categories-nominees.test.ts`):** 27 assertions covering category uniqueness, nominee uniqueness, cascading deletions, cross-event mismatch rejection, and lifecycle structural locks.
- **Total:** 91 automated tests passing with 0 failures.

### Run Lint and Build Checks
```bash
npm run lint
npm run build
```

---

## 6. Project Status & Roadmap

- **Phase 1: Public Website & Brand Foundation:** Complete.
- **Phase 2: Authentication & Organizer Foundation:** Complete.
- **Phase 3: Event Creation and Lifecycle Management:** Complete.
- **Phase 4: Categories & Nominee Management:** Complete.
- **Phase 5: Voting Rules & SMS OTP Integration:** Next phase.
- **Phase 6: Results, Standings & Finalization:** Upcoming.
- **Phase 7: Platform Administration & Audit Trail:** Upcoming.
- **Phase 8: Production Readiness:** Upcoming.
