# CampusFlow Quality Assurance & Testing Report
**Automated Testing Suite, Concurrency Verification, and Security Auditing**

---

## 1. Testing Strategy & Frameworks

CampusFlow incorporates an automated test suite spanning unit, integration, concurrency, and component testing:

| Layer | Tools | Scope |
|---|---|---|
| **Backend Integration & API** | Vitest + Supertest | Full REST endpoint lifecycle, HTTP headers, authentication, status codes |
| **Concurrency & Collision** | Vitest + Supertest + MongoDB | Race condition collision handling under simultaneous requests |
| **Security & RBAC** | Vitest + Supertest | Privilege escalation prevention, role guards, token lifecycle |
| **Frontend Components** | Vitest + React Testing Library + JSDOM | React component rendering, DOM queries, user interaction |
| **Test Database Isolation** | MongoDB (`campusflow_test_db`) | Isolated sandbox database cleanly purged before and after test suites |

---

## 2. Test Execution Commands

```bash
# Execute entire test suite across workspaces
npm run test

# Execute backend tests only
npm run test:backend

# Execute frontend component tests only
npm run test:frontend
```

---

## 3. Verified Backend Test Suite (`backend/tests/api.test.js`)

The backend testing suite executes 20 automated tests against an isolated MongoDB instance:

### 3.1 Health & Readiness Probe
- `GET /api/v1/health`: Verifies that the server reports healthy status, database connection state is `1` (connected), and process uptime is tracked.

### 3.2 Authentication & Security Tests
- `POST /api/v1/auth/signup`:
  - Successfully registers student account and issues in-memory JWT access token.
  - Verifies presence of rotating `campusflow_refresh` HttpOnly cookie.
  - Rejects duplicate email registrations with `409 Conflict`.
  - Forbids public registration as an administrator (`role: 'admin'`) with `400 Bad Request`.
- `POST /api/v1/auth/login`:
  - Rejects wrong password with generic `401 Unauthorized` message to prevent account enumeration.
- `GET /api/v1/auth/me`:
  - Rejects requests without Bearer token (`401 Unauthorized`).
  - Returns authenticated user profile when valid access token is supplied.

### 3.3 Resource Management & RBAC Permissions
- `GET /api/v1/resources`: Public visitors can browse and search active facilities.
- `POST /api/v1/resources`:
  - Student attempt returns `403 Forbidden` (role boundary enforcement).
  - Administrator request creates facility document (`201 Created`).
- `GET /api/v1/resources/:id/availability`: Computes real-time discrete 30-minute availability slots for any specified calendar date.

### 3.4 Booking Lifecycle & Race-Safe Concurrency

#### Discrete Slot Allocation Test
- A booking request for `10:00 - 11:30` on date `targetDate` creates a `pending` booking and inserts three discrete 30-minute records (`10:00`, `10:30`, `11:00`) in `reservationslots`.

#### Overlapping Conflict Rejection Test
- A subsequent booking request for overlapping time `11:00 - 12:30` on the same date is rejected with `409 Conflict: One or more requested time slots are already booked`.

#### High-Concurrency Collision Guarantee Test
- **Scenario**: Two simultaneous requests (`Promise.all([req1, req2])`) submit identical overlapping times (`14:00 - 15:30`) to the same resource.
- **Result**:
  - Exactly **ONE** request succeeds with `201 Created`.
  - The competing concurrent request fails with `409 Conflict`.
  - Zero double-bookings occur in the database.

#### Approval & Slot Confirmation Test
- `PATCH /api/v1/bookings/:id/approve`: Administrator approval transitions booking to `approved` and confirms all associated reservation slots to status `confirmed`.

#### Cancellation & Slot Release Test
- `PATCH /api/v1/bookings/:id/cancel`: Requester cancellation updates status to `cancelled` and atomically deletes all discrete slot documents from `reservationslots`, freeing them for others.

### 3.5 Maintenance Management & User Protection
- `POST /api/v1/maintenance`:
  - Schedules maintenance blackout on facility.
  - Detects pre-existing approved bookings.
  - Automatically cancels conflicting bookings with documented reason: `Resource scheduled for maintenance: Emergency Electrical Wiring Overhaul`.
  - Emits real-time notification to affected students.

### 3.6 Analytics & Report Export Permissions
- `GET /api/v1/analytics/dashboard`: Administrator receives complete aggregated KPIs and utilization metrics.
- `GET /api/v1/analytics/export/bookings`: Administrator downloads `text/csv` attachment; student request is blocked with `403 Forbidden`.

---

## 4. Test Execution Results (Verified Terminal Output)

```
 RUN  v3.2.7 C:/Users/Lenovo/Desktop/campusflow/backend

 ✓ tests/api.test.js > 1. Health & Readiness Probe > GET /api/v1/health should return healthy status and database info
 ✓ tests/api.test.js > 2. Authentication & Security Tests > POST /api/v1/auth/signup - should register a new student account
 ✓ tests/api.test.js > 2. Authentication & Security Tests > POST /api/v1/auth/signup - should reject duplicate email address
 ✓ tests/api.test.js > 2. Authentication & Security Tests > POST /api/v1/auth/signup - should forbid public registration as admin
 ✓ tests/api.test.js > 2. Authentication & Security Tests > POST /api/v1/auth/login - should fail with generic invalid credential message on wrong password
 ✓ tests/api.test.js > 2. Authentication & Security Tests > GET /api/v1/auth/me - should reject request without authorization token
 ✓ tests/api.test.js > 2. Authentication & Security Tests > GET /api/v1/auth/me - should return profile for authenticated user
 ✓ tests/api.test.js > 3. Resource Management & RBAC Tests > GET /api/v1/resources - public should list active resources
 ✓ tests/api.test.js > 3. Resource Management & RBAC Tests > POST /api/v1/resources - student should be forbidden (403)
 ✓ tests/api.test.js > 3. Resource Management & RBAC Tests > POST /api/v1/resources - admin should create resource successfully
 ✓ tests/api.test.js > 3. Resource Management & RBAC Tests > GET /api/v1/resources/:id/availability - should return real-time slots
 ✓ tests/api.test.js > 4. Booking Lifecycle & Race-Safe Concurrency > POST /api/v1/bookings - should create a booking and hold discrete slots
 ✓ tests/api.test.js > 4. Booking Lifecycle & Race-Safe Concurrency > POST /api/v1/bookings - should reject overlapping booking request with 409 Conflict
 ✓ tests/api.test.js > 4. Booking Lifecycle & Race-Safe Concurrency > CONCURRENCY TEST: Two simultaneous overlapping booking requests must guarantee only ONE succeeds
 ✓ tests/api.test.js > 4. Booking Lifecycle & Race-Safe Concurrency > PATCH /api/v1/bookings/:id/approve - admin approves booking and confirms slots
 ✓ tests/api.test.js > 4. Booking Lifecycle & Race-Safe Concurrency > PATCH /api/v1/bookings/:id/cancel - student cancels booking and releases slots
 ✓ tests/api.test.js > 5. Maintenance Management & User Protection > POST /api/v1/maintenance - should schedule maintenance and detect/cancel conflicting bookings
 ✓ tests/api.test.js > 6. Analytics & CSV Report Exporting > GET /api/v1/analytics/dashboard - admin receives complete aggregated metrics
 ✓ tests/api.test.js > 6. Analytics & CSV Report Exporting > GET /api/v1/analytics/export/bookings - admin can export bookings CSV
 ✓ tests/api.test.js > 6. Analytics & CSV Report Exporting > GET /api/v1/analytics/export/bookings - student should be forbidden (403)

 Test Files  1 passed (1)
      Tests  20 passed (20)
```

Frontend Component Tests:
```
 RUN  v3.2.7 C:/Users/Lenovo/Desktop/campusflow/frontend

 ✓ src/__tests__/App.test.jsx (3 tests) 233ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Production Build:
```
✓ built in 9.98s
dist/index.html                   1.05 kB
dist/assets/index-CsPOAncI.css   40.94 kB
dist/assets/index-D7CNR6l0.js   852.54 kB
```
