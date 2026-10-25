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

## 6. Results, Standings & Winner Finalization (Phase 6)

### Result Calculation Engine
- **Persisted Vote Aggregation:** Computations are calculated strictly from accepted, confirmed votes stored in PostgreSQL (`Vote` table). Incomplete or rejected attempts are never counted.
- **Participation Metrics:**
  - Event-level total accepted votes.
  - Distinct verified phone voters participating (counted from unique HMAC phone hashes).
  - Category-level vote counts and percentages.
- **Competition Ranking System:** Nominees are ranked according to standard competition ranking (1224 ranking), with highest vote counts receiving Rank #1.
- **Empty Category Protection:** Categories with zero votes record 0% without division-by-zero errors and are formally designated as `NO_VOTES_CAST` with zero winners declared.

### Documented Tie-Handling Policy
- **Co-Winners Transparency:** When two or more leading nominees in a category share the top vote total (> 0 votes), both are assigned Rank #1.
- **Explicit Tie Flag:** The category is explicitly flagged with `isTie: true` and status `CO_WINNERS`.
- **Zero Arbitrary Selection:** The platform strictly forbids silent or randomized tie-breaks; joint winners are documented transparently on the certified ballot record and public results.
- **Subsequent Ranking Skips:** In accordance with standard competition ranking, the subsequent competitor receives rank `1 + N_tied` (e.g. 1st, 1st, 3rd).

### Finalization Preconditions & Workflow
- **Preconditions:**
  1. The event status must strictly be `CLOSED`. Attempting to finalize `LIVE`, `SCHEDULED`, or `DRAFT` events is rejected by server guards.
  2. The acting user must be the authenticated owner of the awards event.
  3. Voting data must be consistent.
- **Durable Snapshot Model (`FinalizedResultSnapshot`):**
  - Finalization generates an immutable, versioned snapshot capturing total votes, verified voters, actor ID, timestamp, and a frozen JSON structure of all category outcomes and winner determinations.
  - Subsequent mutations or recalculations cannot alter the certified historical snapshot.
  - Any authorized correction generates an incremented snapshot version (v2, v3...) while preserving the preceding records intact.
- **Atomic State Transition:** Updating the event status to `FINALIZED`, persisting the snapshot, and writing the audit entry occurs inside a single database transaction (`prisma.$transaction`).

### Controlled Public Publication
- **Separation of Concerns:** Finalization and publication are independent operations.
- **Eligibility:** Only `FINALIZED` events can be published to the public domain.
- **Public Results Route (`/events/[eventSlug]/results`):**
  - When published: Displays certified category winners, co-winners, rankings, vote distributions, and official timestamp.
  - When unpublished: Renders a friendly informational card explaining that results are pending release, without leaking vote tallies or leader standings.
  - Unpublishing is supported: Organizers can toggle visibility off while retaining certified snapshot integrity.

### Audit Infrastructure (`AuditLog`)
- Durably captures actor (`userId`), `action`, timestamp, and metadata payload for:
  - `RESULTS_FINALIZED`
  - `RESULTS_PUBLISHED`
  - `RESULTS_UNPUBLISHED`
  - `RESULTS_CORRECTED`
- Embedded in the organizer dashboard as a live, tamper-evident audit history timeline.

### Voter Privacy Guarantee
- Result queries and API endpoints strictly strip phone numbers, OTP challenges, and voter phone hashes. Public consumers receive only aggregated category rankings and nominee totals.

---

## 7. Running Tests & Verification

### Run Automated Test Suites
```bash
# In PowerShell:
$env:DATABASE_URL="postgresql://postgres:1234@localhost:5432/votely_test?schema=public"
npx tsx tests/auth.test.ts
npx tsx tests/events.test.ts
npx tsx tests/categories-nominees.test.ts
npx tsx tests/voting-otp.test.ts
npx tsx tests/results-finalization.test.ts
$env:DATABASE_URL=$null
```

- **Authentication Suite (`tests/auth.test.ts`):** 30 assertions covering registration, normalized emails, bcrypt hashes, login, rate limiting, and role isolation.
- **Events Suite (`tests/events.test.ts`):** 34 assertions covering event persistence, slug generation, collisions, date ordering, and lifecycle transitions.
- **Categories & Nominees Suite (`tests/categories-nominees.test.ts`):** 27 assertions covering category uniqueness, nominee uniqueness, cascading deletions, cross-event mismatch rejection, and lifecycle structural locks.
- **Voting & Phone OTP Suite (`tests/voting-otp.test.ts`):** 42 assertions covering phone normalization, OTP generation, timing-safe verification, rate limiting, provider failures, session issuance, atomic duplicate vote prevention, voting rule enforcement, and lifecycle/schedule verification.
- **Results & Finalization Suite (`tests/results-finalization.test.ts`):** 72 assertions covering results aggregation, standard competition ranking (1224), tie detection and co-winners assignment, empty category handling (zero votes), voter privacy (zero leaked phone hashes), finalization precondition enforcement (CLOSED required), multi-tenant authorization, atomic durable snapshots (v1), publication controls, unpublication, authorized corrections (v2), and tamper-evident audit logs.
- **Total:** 205 automated tests passing with 0 failures.

### Run Lint and Build Checks
```bash
npm run lint
npm run build
```

---

## 8. Project Status & Roadmap

- **Phase 1: Public Website & Brand Foundation:** Complete.
- **Phase 2: Authentication & Organizer Foundation:** Complete.
- **Phase 3: Event Creation and Lifecycle Management:** Complete.
- **Phase 4: Categories & Nominee Management:** Complete.
- **Phase 5: Voting Rules, Phone OTP & Secure Vote Recording:** Complete.
- **Phase 6: Results, Standings & Winner Finalization:** Complete.
- **Phase 7: Platform Administration & Audit Trail:** Upcoming.
- **Phase 8: Production Readiness:** Upcoming.
