# CampusFlow — Comprehensive Testing Guide & Quality Assurance Specification

This document details the automated and manual testing methodology, test suite breakdown, concurrency race-condition verification, and regression test checklists implemented for **CampusFlow**.

---

## 1. Testing Philosophy & Technology Stack

CampusFlow enforces test-driven quality assurance using a unified JavaScript testing framework:

```
┌─────────────────────────────────────────────────────────────┐
│ Vitest Test Runner (Next-Generation ESM Test Framework)    │
├──────────────────────────────┬──────────────────────────────┤
│ Backend Integration Suite    │ Frontend Component Suite     │
│  - Supertest (HTTP/REST)     │  - React Testing Library     │
│  - Isolated MongoDB Test DB  │  - JSDOM Browser Simulation  │
│  - Real Mongoose ODM Drivers │  - Vitest Spies & Mocks      │
└──────────────────────────────┴──────────────────────────────┘
```

### Framework Selection Justification
- **Vitest**: Provides fast execution, native ESM support, and compatibility with the Vite build pipeline.
- **Supertest**: Dispatches actual HTTP requests directly into the Express application instance (`app`) without binding to an open network port.
- **Isolated MongoDB Test Database**: Backend integration tests run against an isolated MongoDB instance (`campusflow_test_db`) that is automatically populated and dropped after execution.

---

## 2. Test Execution Commands

Run the test suites using npm scripts defined in the root `package.json`:

```bash
# Execute entire test suite (23 automated tests across backend & frontend)
npm test

# Execute backend integration suite only (20 tests)
npm run test:backend

# Execute frontend component suite only (3 tests)
npm run test:frontend
```

---

## 3. Backend Integration Test Suite Breakdown (`backend/tests/api.test.js`)

The backend integration suite contains **20 automated test cases** organized into 6 functional suites:

### Suite 1: Health & Readiness Probe
- **Test 1**: `GET /api/v1/health`
  - Verifies that the server responds with HTTP `200 OK`.
  - Verifies payload contains `{ status: "healthy", database: { readyState: 1 } }`.

### Suite 2: Authentication & Security Controls
- **Test 2**: `POST /api/v1/auth/signup` (Valid Registration)
  - Registers a new student account (`alice.johnson@campusflow.edu`).
  - Verifies HTTP `201 Created`, user profile returned, JWT access token present, and HttpOnly `set-cookie` header attached.
- **Test 3**: `POST /api/v1/auth/signup` (Duplicate Email Prevention)
  - Attempts to register an identical email address.
  - Verifies server halts duplicate registration with HTTP `409 Conflict`.
- **Test 4**: `POST /api/v1/auth/signup` (Anti-Privilege Escalation Defense)
  - Attempts to pass `{ "role": "admin" }` during public signup.
  - Verifies Zod validation rejects public administrative account creation with HTTP `400 Bad Request`.
- **Test 5**: `POST /api/v1/auth/login` (Invalid Credentials Rejection)
  - Submits an incorrect password for a known email.
  - Verifies HTTP `401 Unauthorized` with a generic message to prevent account enumeration.
- **Test 6**: `GET /api/v1/auth/me` (Unauthorized Rejection)
  - Calls protected profile endpoint without an `Authorization` header.
  - Verifies HTTP `401 Unauthorized` (`Authentication required`).
- **Test 7**: `GET /api/v1/auth/me` (Authorized Identity Resolution)
  - Calls endpoint with `Bearer <studentToken>`.
  - Verifies HTTP `200 OK` and returns student user profile.

### Suite 3: Resource Management & Role-Based Access Control
- **Test 8**: `GET /api/v1/resources` (Public Active Resource Listing)
  - Queries active campus facilities without requiring authentication.
  - Verifies HTTP `200 OK` and array of active resources.
- **Test 9**: `POST /api/v1/resources` (Student Modification Prohibition)
  - A student attempts to create a new laboratory facility.
  - Verifies RBAC middleware rejects student with HTTP `403 Forbidden`.
- **Test 10**: `POST /api/v1/resources` (Admin Resource Creation)
  - An administrator creates a new laboratory (`ADM-LAB-01`).
  - Verifies HTTP `201 Created` and record persisted in MongoDB.
- **Test 11**: `GET /api/v1/resources/:id/availability` (Real-Time Slot Discovery)
  - Queries available 30-minute intervals for a given date.
  - Verifies HTTP `200 OK` with discrete slot arrays and summary metrics.

### Suite 4: Booking Lifecycle & Race-Safe Concurrency
- **Test 12**: `POST /api/v1/bookings` (Booking Creation & Slot Holding)
  - Student reserves test resource from `10:00` to `11:30` (3 discrete 30-minute slots: 10:00, 10:30, 11:00).
  - Verifies HTTP `201 Created`, status `pending`, and exactly 3 held slots created in `ReservationSlot`.
- **Test 13**: `POST /api/v1/bookings` (Overlapping Request Conflict Rejection)
  - Student attempts a overlapping reservation from `11:00` to `12:30` on the same date.
  - Verifies server detects the conflict on the `11:00` slot and rejects with HTTP `409 Conflict`.
- **Test 14**: `CONCURRENCY TEST` (True Simultaneous Booking Collision)
  - Dispatches **two simultaneous, identical booking requests** concurrently via `Promise.all([req1, req2])`.
  - Verifies that exactly **one request succeeds with 201 Created**, while the competing request is **rejected with 409 Conflict**. Neither request produces duplicate reservations or corrupted slots.
- **Test 15**: `PATCH /api/v1/bookings/:id/approve` (Admin Approval & Slot Confirmation)
  - Admin approves the pending booking.
  - Verifies HTTP `200 OK`, booking status transitions to `approved`, and all related reservation slots transition to `status: "confirmed"`.
- **Test 16**: `PATCH /api/v1/bookings/:id/cancel` (User Cancellation & Slot Release)
  - Student cancels the booking.
  - Verifies HTTP `200 OK`, booking status transitions to `cancelled`, and all discrete reservation slots are deleted from the database.

### Suite 5: Maintenance Scheduling & Conflict Eviction
- **Test 17**: `POST /api/v1/maintenance` (Downtime Slot Blocking & Conflicting Booking Eviction)
  - Creates a student booking from `09:00` to `11:00`.
  - Admin schedules emergency electrical maintenance on the facility from `08:00` to `12:00`.
  - Verifies HTTP `201 Created`, confirms `affectedBookingsCount: 1`, and verifies that the pre-existing booking is automatically cancelled with `cancellationReason: "...maintenance..."`.

### Suite 6: Analytics & Regulatory Audit Logs
- **Test 18**: `GET /api/v1/analytics/dashboard` (Admin KPI Aggregations)
  - Admin requests utilization metrics, active bookings, and category counts.
  - Verifies HTTP `200 OK` with daily trends, resource counts, and utilization rates.
- **Test 19**: `GET /api/v1/analytics/export/bookings` (CSV Report Generation)
  - Admin exports booking history to CSV.
  - Verifies HTTP `200 OK`, `Content-Type: text/csv`, and CSV header columns.
- **Test 20**: `GET /api/v1/analytics/export/bookings` (Student RBAC Restriction)
  - Student attempts to download administrative CSV export.
  - Verifies HTTP `403 Forbidden`.

---

## 4. Frontend Component Test Suite Breakdown (`frontend/src/__tests__/App.test.jsx`)

The frontend test suite validates UI rendering, navigation routes, and role-based entry points without making uncontrolled network requests to external servers:

```javascript
// Mock network APIs and WebSockets to prevent ECONNREFUSED in JSDOM
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));
vi.mock('../services/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn() })),
}));
```

### Implemented Frontend Tests:
1. **Landing Headline Verification**: Ensures `<LandingPage />` renders the brand headline (`Smart Campus Resource Booking & Management System`) cleanly without throwing unhandled lifecycle errors.
2. **Demo Persona Buttons Verification**: Validates that quick-fill demo buttons for **Student (Manan Sharma)**, **Faculty (Prof. Rajesh Rajan)**, and **Administrator** render correctly.
3. **Navigation & CTA Link Verification**: Confirms that primary call-to-action buttons (`Explore Facilities`, `Sign In`, `Sign Up`) render with appropriate routing links.

---

## 5. Concurrency Race-Condition Verification Mechanics

The concurrency test (`Test 14`) verifies thread-safe behavior in high-traffic campus environments:

```javascript
it('CONCURRENCY TEST: Two simultaneous overlapping booking requests must guarantee only ONE succeeds', async () => {
  const concurrentDate = getFutureDate(4);

  // Request 1 from Student
  const req1 = request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      resource: testResource._id.toString(),
      date: concurrentDate,
      startTime: '14:00',
      endTime: '15:30',
      purpose: 'Concurrent Requester 1',
    });

  // Request 2 from Admin (simultaneous)
  const req2 = request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      resource: testResource._id.toString(),
      date: concurrentDate,
      startTime: '14:00',
      endTime: '15:30',
      purpose: 'Concurrent Requester 2',
    });

  // Execute both requests concurrently across the event loop
  const [res1, res2] = await Promise.all([req1, req2]);

  const statuses = [res1.status, res2.status];
  expect(statuses).toContain(201); // Exactly one winner
  expect(statuses).toContain(409); // Exactly one rejected loser
});
```

### Why This Test Passes
1. Both requests arrive at the Node.js event loop within milliseconds.
2. Both controllers pass preliminary validation checks.
3. Both controllers invoke `slotService.reserveSlots()`, attempting to insert discrete 30-minute documents into `ReservationSlot`.
4. MongoDB evaluates the compound index `{ resource: 1, date: 1, slotTime: 1 }`.
5. The first operation lands. The second operation immediately triggers duplicate key error `E11000`.
6. The loser's `catch` block deletes any partial inserts from that transaction and throws a `409 Conflict` error to the client.

---

## 6. Comprehensive Manual Testing Checklist

Use this checklist during final demonstrations and quality assurance reviews:

| # | Feature / Action | Test Steps | Expected Result | Pass / Fail |
|---|---|---|---|:---:|
| 1 | **Landing Page Quick Login** | Click "Student (Manan)" on landing page demo card | Fields populate; clicking login directs to `/dashboard` with Student navigation | [x] Pass |
| 2 | **Resource Directory Search** | In `/resources`, type "Robotics" in search bar | Real-time filter isolates Robotics Lab | [x] Pass |
| 3 | **Filter by Facility Type** | Select "Auditorium" filter | Displays Main Auditorium card only | [x] Pass |
| 4 | **Interactive Slot Selector** | Open resource booking modal, choose tomorrow's date | Available 30-min slots display in green; booked slots appear grayed out | [x] Pass |
| 5 | **Submit Booking Request** | Submit booking from 10:00 to 11:30 | Booking submitted; Toast alert displayed; Status shows `pending` | [x] Pass |
| 6 | **Double-Booking Attempt** | In second incognito window, attempt same resource & slot | System immediately alerts "Time slot conflict" (409) | [x] Pass |
| 7 | **Admin Approval Queue** | Log in as Admin, navigate to `/admin/bookings` | Submitted booking appears at top of pending queue with applicant details | [x] Pass |
| 8 | **Approve Booking Action** | Click "Approve" button on pending request | Booking badge updates to green "Approved"; real-time notification sent | [x] Pass |
| 9 | **Student Real-Time Alert** | Return to Student window without reloading | Notification bell increments; toast shows "Booking Approved! 🎉" | [x] Pass |
| 10 | **Booking Cancellation** | Student clicks "Cancel Booking" and enters reason | Status changes to "Cancelled"; time slots immediately become available again | [x] Pass |
| 11 | **Schedule Maintenance** | Admin schedules maintenance on Seminar Hall for tomorrow | Maintenance badge appears; slots blocked from student booking | [x] Pass |
| 12 | **Analytics & Utilization** | Admin opens `/admin/analytics` | Recharts graphs render utilization rates, daily volume, and resource stats | [x] Pass |
| 13 | **CSV Report Download** | Admin clicks "Export CSV" on bookings or audit logs | Browser triggers `.csv` file download with clean headers and data | [x] Pass |
| 14 | **User Role Toggle** | Admin toggles a user's role or deactivates account | User status updates immediately; deactivated user blocked from login | [x] Pass |
| 15 | **Mobile Responsive Menu** | Open browser DevTools in iPhone/Android viewport | Mobile hamburger menu toggles smoothly; all cards wrap responsively | [x] Pass |
