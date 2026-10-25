# Votely — Online Awards & Voting Platform

Votely is a specialized online platform allowing organizations and creators to host, manage, and operate professional awards competitions with verified voter participation via SMS OTP and server-enforced voting integrity.

---

## 1. Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Dark navy and violet design identity)
- **Database & ORM:** PostgreSQL & Prisma ORM
- **Authentication & Security:** Bcrypt (12 salt rounds), cryptographically secure session tokens, HTTP-only SameSite cookies, server-side route guards, sliding-window rate limiting.
- **Verification & Privacy:** E.164 phone normalization, SMS OTP challenge flow, single-use token lifecycle, and HMAC-SHA256 pseudonymized ballot recording.

---

## 2. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/votely_dev?schema=public"

# Session cryptographic secret (min 32 characters)
SESSION_SECRET="your-32-character-minimum-random-secret-key"

# Phone privacy HMAC salt secret (min 32 characters)
PHONE_HASH_SECRET="your-32-character-minimum-random-secret-key"

# Production SMS Provider credentials (optional in development/test)
SMS_API_KEY=""
SMS_SENDER_ID="VOTELY"

NODE_ENV="development"
```

> **Security Note:** Never commit secrets, provider API keys, or database credentials to version control. In development/testing, the built-in `DevSmsProvider` captures OTPs in memory without sending carrier SMS.

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
$env:DATABASE_URL="postgresql://postgres:1234@localhost:5432/votely_test?schema=public"
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

## 5. Voting Rules, Phone OTP & Secure Ballot Architecture (Phase 5)

### Supported Voting Rules
- **`ONE_VOTE_PER_CATEGORY` (Default):** Exactly one accepted vote per verified phone number per category per event. Voters may participate in multiple categories across the same event.
- **`ONE_VOTE_PER_EVENT`:** Exactly one accepted vote per verified phone number across the entire awards event.

### Voter Privacy & Ballot Pseudonymization
- **No Plaintext Phone on Ballots:** Raw voter phone numbers are never persisted to the `Vote` table.
- **HMAC-SHA256 Pseudonymization:** Phone numbers are hashed using HMAC-SHA256 salted with `PHONE_HASH_SECRET`. This provides deterministic duplicate enforcement without allowing voter re-identification from ballot queries.
- **Masked Phone Feedback:** UI displays only masked phone numbers (e.g., `+251 ••• ••3344`) during verification.

### Concurrency & Atomic Duplicate Prevention
- **Database Composite Constraint:** The `Vote` table enforces:
  ```prisma
  @@unique([eventId, categoryId, voterPhoneHash])
  ```
- **Transaction Safety:** Server action `submitVoteAction` runs atomic checks inside a transaction. In the event of parallel concurrent requests from the same verified voter, PostgreSQL's unique constraint triggers code `P2002` which is caught gracefully, guaranteeing zero duplicate votes.
- **Safe Retries:** If a voter resubmits for the exact same nominee due to network reconnects, the system detects the existing vote and returns the receipt confirmation idempotently without creating a duplicate row.

### SMS Provider Architecture
- **Provider Interface (`SmsProvider`):** Standard contract requiring `sendOtp(phoneNumber, code)`.
- **`DevSmsProvider`:** Active in non-production environments. Logs simulated delivery codes and stores them in memory for automated test assertions. Strictly blocked in production.
- **`ProductionSmsProvider`:** Requires `SMS_API_KEY` and `SMS_SENDER_ID`. Validates gateway connectivity and reports provider failures cleanly without pretending that an SMS was delivered.
- **Provider Switching:** Provider selection is dynamic via `src/lib/sms/index.ts` based on `NODE_ENV`.

### OTP Challenge Lifecycle & Rate Limiting
- **Expiration:** OTP challenges expire after 5 minutes (`OTP_EXPIRATION_MS = 300,000`).
- **Single-Use:** Challenges are marked verified immediately upon success and cannot be reused.
- **Attempt Throttling:** Maximum 3 verification attempts per challenge before mandatory invalidation.
- **Send Rate Limiting:** Maximum 3 OTP requests per 15 minutes per normalized E.164 phone number.
- **Short-Lived Voter Session:** Successful verification grants a 30-minute high-entropy cryptographic token (`VoterSession`) scoped specifically to the current event.

---

## 6. Running Tests & Verification

### Run Automated Test Suites
```bash
# In PowerShell:
$env:DATABASE_URL="postgresql://postgres:1234@localhost:5432/votely_test?schema=public"
npx tsx tests/auth.test.ts
npx tsx tests/events.test.ts
npx tsx tests/categories-nominees.test.ts
npx tsx tests/voting-otp.test.ts
$env:DATABASE_URL=$null
```

- **Authentication Suite (`tests/auth.test.ts`):** 30 assertions covering registration, normalized emails, bcrypt hashes, login, rate limiting, and role isolation.
- **Events Suite (`tests/events.test.ts`):** 34 assertions covering event persistence, slug generation, collisions, date ordering, and lifecycle transitions.
- **Categories & Nominees Suite (`tests/categories-nominees.test.ts`):** 27 assertions covering category uniqueness, nominee uniqueness, cascading deletions, cross-event mismatch rejection, and lifecycle structural locks.
- **Voting & Phone OTP Suite (`tests/voting-otp.test.ts`):** 42 assertions covering phone normalization, OTP generation, timing-safe verification, rate limiting, provider failures, session issuance, atomic duplicate vote prevention, voting rule enforcement, and lifecycle/schedule verification.
- **Total:** 133 automated tests passing with 0 failures.

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
- **Phase 4: Categories & Nominee Management:** Complete.
- **Phase 5: Voting Rules, Phone OTP & Secure Vote Recording:** Complete.
- **Phase 6: Results, Standings & Finalization:** Upcoming.
- **Phase 7: Platform Administration & Audit Trail:** Upcoming.
- **Phase 8: Production Readiness:** Upcoming.
