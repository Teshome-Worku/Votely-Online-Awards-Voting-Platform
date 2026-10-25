# Votely — Online Awards & Voting Platform

Votely is a specialized online platform allowing organizations and creators to host, manage, and operate professional awards competitions with verified voter participation via SMS OTP and server-enforced voting integrity.

---

## 1. Technology Stack

- **Framework:** Next.js (App Router, Turbopack)
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

## 5. Authentication & Access Control Architecture

### User Roles
- **`ORGANIZER`**: Standard user role assigned automatically upon public registration. Organizers can access `/dashboard` to manage their awards events. Public registration inputs cannot elevate accounts to `PLATFORM_ADMIN`.
- **`PLATFORM_ADMIN`**: Elevated system role provisioned exclusively via administrative bootstrapping or platform governance. Admins can access `/admin` for user oversight and platform management.

### Session Management
- **Token Generation:** 256-bit cryptographically secure random token (`crypto.randomBytes(32)`).
- **Session Storage:** Persisted in PostgreSQL `sessions` table with an expiration timestamp (default: 7 days) and user linkage.
- **Cookies:** Stored in an `httpOnly`, `secure` (in production), `sameSite: "lax"`, `path: "/"` cookie named `votely_session`.
- **Expiration & Cleanup:** Tokens older than the expiration timestamp or belonging to suspended accounts are automatically rejected and purged from the database.
- **Revocation:** Logging out instantly deletes the session record from the database.

### Rate Limiting
- **Registration:** Sliding window limit (10 attempts per hour per IP).
- **Login:** Sliding window limit (5 failed attempts per 15 minutes per IP/email pair). Counters reset upon successful authentication.

### Route Protection
- **Middleware (`src/middleware.ts`):** Edge-level route protection redirecting unauthenticated visitors to `/login?next=...`.
- **Server Component Guards (`src/lib/guard.ts`):**
  - `requireOrganizer()`: Verifies authenticated user session; redirects to `/login`.
  - `requirePlatformAdmin()`: Verifies authenticated user session and enforces `role === "PLATFORM_ADMIN"`. Non-admin authenticated users are redirected to `/access-denied` (HTTP 403 equivalent).

---

## 6. Running Tests & Verification

### Run Automated Security Test Suite
```bash
# In PowerShell:
$env:DATABASE_URL="postgresql://username:password@localhost:5432/votely_test?schema=public"
npx tsx tests/auth.test.ts
$env:DATABASE_URL=$null
```

The test suite covers:
1. Successful organizer registration with normalized email and bcrypt password hash.
2. Duplicate email rejection (case-insensitive).
3. Field validation (name length, email syntax, password complexity).
4. Successful login & session generation.
5. Incorrect password rejection.
6. Logout and session invalidation.
7. Unauthenticated access detection.
8. Strict role isolation (organizer forbidden from `/admin`).
9. Privilege escalation prevention during registration.
10. Session expiration purging and suspended account handling.

### Run Lint and Build Checks
```bash
npm run lint
npm run build
```

---

## 7. Project Status & Roadmap

- **Phase 1: Public Website & Brand Foundation:** Complete.
- **Phase 2: Authentication & Organizer Foundation:** Complete.
- **Phase 3: Event Creation and Lifecycle Management:** Next phase.
- **Phase 4: Categories & Nominee Management:** Upcoming.
- **Phase 5: Voting Rules & SMS OTP Integration:** Upcoming.
- **Phase 6: Results, Standings & Finalization:** Upcoming.
- **Phase 7: Platform Administration & Audit Trail:** Upcoming.
- **Phase 8: Production Readiness:** Upcoming.
