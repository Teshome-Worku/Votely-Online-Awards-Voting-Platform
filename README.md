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

## 4. Administrator Provisioning (Bootstrap Procedure)

To maintain security, no default administrator account exists with hardcoded credentials. A platform administrator must be explicitly bootstrapped using the safe CLI utility:

```bash
npx tsx scripts/bootstrap-admin.ts --email=admin@example.com --password=YourSecurePassword123 --name="Platform Administrator"
```

Alternatively, environment variables can be provided:
```bash
BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
BOOTSTRAP_ADMIN_PASSWORD="YourSecurePassword123"
BOOTSTRAP_ADMIN_NAME="Platform Administrator"
npx tsx scripts/bootstrap-admin.ts
```

- If an account with the specified email does not exist, a new user with `Role: PLATFORM_ADMIN` and `Status: ACTIVE` is created with a bcrypt-hashed password.
- If the account already exists, its role is elevated to `PLATFORM_ADMIN`.

---

## 5. Event Creation & Lifecycle Architecture (Phase 3)

### Data Model
- **`Event` Table:**
  - `id`: Immutable CUID primary key.
  - `organizerId`: References `User.id` (strictly derived from authenticated session).
  - `name`: Awards competition name (3–150 characters).
  - `slug`: Unique URL slug with `@unique` index.
  - `description`: Event description (minimum 10 characters).
  - `bannerUrl` & `logoUrl`: Optional public image asset URLs (documents external URL linking; no arbitrary database blobs).
  - `startDate` & `endDate`: Event date boundary.
  - `votingStartsAt` & `votingEndsAt`: Voting window.
  - `status`: Lifecycle enum defaulting to `DRAFT`.
  - `createdAt` & `updatedAt`: Automatic timestamps.

### Slug Generation & Collision Handling
- Slugs are generated from the event title using transliteration and URL-safe hyphenation (`/events/{slug}`).
- Automatic collision resolution: If an event name produces an already registered slug, sequential suffixes (`-2`, `-3`) are assigned dynamically.

### Schedule & Date Chronology Validation
Server-side validation enforces logical date ordering:
1. `startDate <= votingStartsAt` (voting cannot open before the event begins).
2. `votingStartsAt < votingEndsAt` (voting must have a positive duration).
3. `votingEndsAt <= endDate` (voting cannot end after the event concludes).

### Lifecycle State Machine
```
   ┌──────────┐
   │  DRAFT   │
   └────┬─────┘
        │ 
        ├──────────────────────┐
        ▼                      ▼
  ┌───────────┐          ┌──────────┐
  │ SCHEDULED │ ◄──────► │   LIVE   │
  └───────────┘          └────┬─────┘
                              │
                              ▼
                         ┌──────────┐
                         │  CLOSED  │ ◄─── (Reopen)
                         └────┬─────┘
                              │
                              ▼
                        ┌───────────┐
                        │ FINALIZED │
                        └─────┬─────┘
                              │
                              ▼
                        ┌───────────┐
                        │ ARCHIVED  │
                        └───────────┘
```
- **Allowed Transitions:**
  - `DRAFT` → `SCHEDULED` or `LIVE`
  - `SCHEDULED` → `LIVE` or `DRAFT`
  - `LIVE` → `CLOSED`
  - `CLOSED` → `FINALIZED` or `LIVE` (reopen)
  - `FINALIZED` → `ARCHIVED`
- **Public Visibility Enforcement:**
  - Events with status `LIVE`, `SCHEDULED`, `CLOSED`, or `FINALIZED` are discoverable by public visitors.
  - `DRAFT` events return HTTP 404 to anonymous visitors and unauthorized users. The authenticated event organizer alone can view private Drafts via an "Owner Preview Mode" with a direct management link.

---

## 6. Running Tests & Verification

### Run Automated Security & Event Test Suites
```bash
# In PowerShell:
$env:DATABASE_URL="postgresql://username:password@localhost:5432/votely_test?schema=public"
npx tsx tests/auth.test.ts
npx tsx tests/events.test.ts
$env:DATABASE_URL=$null
```

### Run Lint and Build Checks
```bash
npm run lint
npm run build
```

---

## 7. Project Status & Roadmap

- **Phase 1: Public Website & Brand Foundation:** Complete.
- **Phase 2: Authentication & Organizer Foundation:** Complete.
- **Phase 3: Event Creation and Lifecycle Management:** Complete.
- **Phase 4: Categories & Nominee Management:** Next phase.
- **Phase 5: Voting Rules & SMS OTP Integration:** Upcoming.
- **Phase 6: Results, Standings & Finalization:** Upcoming.
- **Phase 7: Platform Administration & Audit Trail:** Upcoming.
- **Phase 8: Production Readiness:** Upcoming.
