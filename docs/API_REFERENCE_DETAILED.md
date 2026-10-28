# CampusFlow — Detailed REST API Reference

**Base URL**: `http://localhost:5000/api/v1` (or your cloud production URL)  
**Interactive Swagger UI**: `http://localhost:5000/api/docs`

All API responses follow a uniform JSON response envelope:
```json
{
  "success": true,
  "message": "Human readable summary",
  "data": { ... }
}
```
Errors return:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { "field": "Validation message" }
}
```

---

## 1. Authentication Module (`/auth`)
Implemented in `backend/src/controllers/authController.js` and `backend/src/routes/authRoutes.js`.

### 1.1 `POST /auth/signup`
- **Purpose**: Registers a new student or faculty account.
- **Access**: Public.
- **Rate Limit**: 20 requests per 15 minutes (`authLimiter`).
- **Validation Rules** (`authValidators.js`):
  - `name`: 2 to 100 characters, trimmed.
  - `email`: Valid email format, lowercase.
  - `password`: Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
  - `confirmPassword`: Must match `password`.
  - `role`: Enum `['student', 'faculty']` (Cannot be `'admin'`).
  - `department`: Minimum 2 characters.
- **Request Body**:
  ```json
  {
    "name": "Manan Sharma",
    "email": "student.manan@campusflow.edu",
    "password": "Student@CampusFlow2026",
    "confirmPassword": "Student@CampusFlow2026",
    "department": "Computer Science & Engineering",
    "role": "student",
    "studentOrEmployeeId": "STU-2026-891",
    "phone": "+1 (555) 019-9944"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user profile and in-memory `accessToken`. Sets HttpOnly `campusflow_refresh` cookie.
  - `400 Bad Request`: Validation failure or attempt to pass `role: "admin"`.
  - `409 Conflict`: An account with this email already exists.

### 1.2 `POST /auth/login`
- **Purpose**: Authenticates credentials and starts user session.
- **Access**: Public (`authLimiter`).
- **Request Body**:
  ```json
  {
    "email": "student.manan@campusflow.edu",
    "password": "Student@CampusFlow2026"
  }
  ```
- **Responses**:
  - `200 OK`: Returns user profile, access token, and sets refresh cookie.
  - `401 Unauthorized`: Generic invalid credential message ("Invalid email address or password").
  - `403 Forbidden`: Account is suspended (`isActive: false`).

### 1.3 `POST /auth/refresh`
- **Purpose**: Rotates refresh token and issues a fresh 15-minute access token.
- **Access**: Public (Cookie-authenticated via `campusflow_refresh`).
- **Required Header**: `X-Requested-With: XMLHttpRequest` (Anti-CSRF).
- **Responses**:
  - `200 OK`: Returns `{ user, accessToken }` and sets updated refresh cookie.
  - `401 Unauthorized`: Token expired, missing, or revoked.

### 1.4 `POST /auth/logout`
- **Purpose**: Invalidates the active refresh token and clears session cookie.
- **Access**: Public / Authenticated.
- **Responses**:
  - `200 OK`: Cookie cleared, token hash marked `isRevoked: true` in database.

### 1.5 `GET /auth/me`
- **Purpose**: Returns current profile of logged-in user.
- **Access**: Authenticated (`Bearer <token>`).
- **Responses**:
  - `200 OK`: `{ success: true, data: { user } }`.
  - `401 Unauthorized`: Missing or expired Bearer token.

---

## 2. Resources Module (`/resources`)
Implemented in `backend/src/controllers/resourceController.js` and `backend/src/routes/resourceRoutes.js`.

### 2.1 `GET /resources`
- **Purpose**: Search, filter, and paginate campus facilities.
- **Access**: Public.
- **Query Parameters**:
  - `search` (string): Text search matching name, building, or description.
  - `type` (string): `computer_lab`, `science_lab`, `seminar_hall`, `classroom`, `conference_room`, `equipment`.
  - `building` (string): Partial building name.
  - `minCapacity` (number): Minimum room capacity.
  - `status` (string): Defaults to `active` for public; admins can view all.
  - `page` (number, default: 1), `limit` (number, default: 12).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "resources": [
        {
          "_id": "672000000000000000000010",
          "name": "Alan Turing Advanced Computing Lab",
          "code": "LAB-CS-101",
          "type": "computer_lab",
          "building": "Turing Technology Complex",
          "capacity": 60,
          "status": "active"
        }
      ],
      "pagination": { "total": 8, "page": 1, "limit": 12, "pages": 1 }
    }
  }
  ```

### 2.2 `GET /resources/:id`
- **Purpose**: Retrieves full details of a single facility.
- **Access**: Public.
- **Responses**:
  - `200 OK`: Returns resource object with operating hours, amenities, and duration limits.
  - `404 Not Found`: Resource ID does not exist.

### 2.3 `GET /resources/:id/availability`
- **Purpose**: Returns real-time discrete 30-minute availability slot matrix for a specific calendar date.
- **Access**: Public.
- **Query Parameter**: `date=YYYY-MM-DD` (Required).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "resourceId": "672000000000000000000010",
      "date": "2026-10-30",
      "operatingHours": { "openTime": "08:00", "closeTime": "20:00" },
      "slots": [
        { "time": "08:00", "available": true },
        { "time": "08:30", "available": true },
        { "time": "10:00", "available": false, "status": "confirmed" },
        { "time": "10:30", "available": false, "status": "confirmed" },
        { "time": "14:00", "available": false, "status": "held" }
      ],
      "totalSlots": 24,
      "availableSlotsCount": 21
    }
  }
  ```

### 2.4 `POST /resources`
- **Purpose**: Create a new facility record.
- **Access**: Authenticated — **Admin only** (`authorize('admin')`).
- **Request Body**: Full resource schema (`name`, `code`, `type`, `capacity`, `operatingHours`, etc.).
- **Responses**:
  - `201 Created`: Returns newly created resource document.
  - `403 Forbidden`: Non-admin user attempted creation.
  - `409 Conflict`: Facility `code` already exists.

### 2.5 `PUT /resources/:id` & `DELETE /resources/:id`
- **Purpose**: Update specifications or deactivate/delete a facility.
- **Access**: Authenticated — **Admin only**.

---

## 3. Bookings Module (`/bookings`)
Implemented in `backend/src/controllers/bookingController.js` and `backend/src/routes/bookingRoutes.js`.

### 3.1 `POST /bookings`
- **Purpose**: Submit a reservation request. Atomically holds discrete 30-minute slots.
- **Access**: Authenticated (Student, Faculty, Admin).
- **Request Body**:
  ```json
  {
    "resource": "672000000000000000000010",
    "date": "2026-10-30",
    "startTime": "14:00",
    "endTime": "16:00",
    "purpose": "Annual IEEE Algorithm Study Practical",
    "expectedAttendees": 40
  }
  ```
- **Responses**:
  - `201 Created`: Booking created in `pending` status, slots locked as `held`.
  - `400 Bad Request`: Duration out of bounds, attendees exceed capacity, or operating hours violated.
  - `403 Forbidden`: User role not permitted to book this facility.
  - `409 Conflict`: Requested time overlaps with an existing reservation.

### 3.2 `GET /bookings/my`
- **Purpose**: Retrieve personal bookings for current authenticated user.
- **Access**: Authenticated.
- **Query Parameters**: `status` (`pending`, `approved`, `cancelled`, `all`), `page`, `limit`.

### 3.3 `GET /bookings/:id`
- **Purpose**: Single booking details.
- **Access**: Authenticated (Requester or Administrator only).

### 3.4 `PATCH /bookings/:id/cancel`
- **Purpose**: Cancel an active booking and release all discrete reservation slots.
- **Access**: Authenticated (Booking owner or Administrator).
- **Request Body**: `{ "cancellationReason": "Exam rescheduled" }`.
- **Response `200 OK`**: Updates booking status to `cancelled` and deletes slot records.

### 3.5 `GET /bookings/admin/queue`
- **Purpose**: Administrative review queue with attendee counts and purpose statements.
- **Access**: Authenticated — **Admin only**.
- **Query Parameters**: `status=pending`, `page`, `limit`.

### 3.6 `PATCH /bookings/:id/approve`
- **Purpose**: Confirm a pending booking.
- **Access**: Authenticated — **Admin only**.
- **Response `200 OK`**: Updates booking to `approved`, transitions slots to `confirmed`, and emits real-time user notification.

### 3.7 `PATCH /bookings/:id/reject`
- **Purpose**: Decline a pending booking with an institutional reason.
- **Access**: Authenticated — **Admin only**.
- **Request Body**: `{ "rejectionReason": "Facility reserved for University Syndicate Meeting" }`.
- **Response `200 OK`**: Updates status to `rejected`, frees held slots, and notifies requester.

---

## 4. Maintenance Module (`/maintenance`)
Implemented in `backend/src/controllers/maintenanceController.js` and `backend/src/routes/maintenanceRoutes.js`. All routes require `authorize('admin')`.

### 4.1 `GET /maintenance`
- **Purpose**: List scheduled facility blackouts.
- **Query Parameters**: `resource`, `status`, `page`, `limit`.

### 4.2 `POST /maintenance`
- **Purpose**: Schedule facility maintenance. Automatically detects and cancels conflicting active bookings and releases slots.
- **Request Body**:
  ```json
  {
    "resource": "672000000000000000000010",
    "title": "HVAC Central Duct Sanitization",
    "reason": "Annual institutional air quality protocol",
    "startDate": "2026-11-05",
    "endDate": "2026-11-05",
    "startTime": "08:00",
    "endTime": "18:00"
  }
  ```
- **Response `201 Created`**: Returns maintenance record and count of affected bookings cancelled.

### 4.3 `PATCH /maintenance/:id/cancel`
- **Purpose**: Cancel scheduled maintenance and release slot locks.

---

## 5. Notifications Module (`/notifications`)
Implemented in `backend/src/controllers/notificationController.js`. All routes require `authenticate`.

- `GET /notifications`: List recent notifications for current user with total `unreadCount`.
- `PATCH /notifications/:id/read`: Mark a single alert as read.
- `PATCH /notifications/read-all`: Mark all alerts as read.

---

## 6. Administration & Governance Modules

### 6.1 User Management (`/users`) — Admin Only
- `GET /users`: List registered users with search, role, and department filters.
- `PATCH /users/:id/role`: Change role between `student`, `faculty`, and `admin` (Self-demotion blocked).
- `PATCH /users/:id/status`: Suspend or reactivate user account (`isActive: true/false`).

### 6.2 Audit Logs (`/audit-logs`) — Admin Only
- `GET /audit-logs`: Query immutable security events filtered by `action` or `targetModel`.

### 6.3 Analytics & Reports (`/analytics`)
- `GET /analytics/dashboard`: Aggregated KPIs, utilization by department, top booked facilities (Admin only).
- `GET /analytics/user-stats`: Personal usage statistics (Approved, Pending, Cancelled counts) for student/faculty dashboards.
- `GET /analytics/export/bookings`: Stream downloadable CSV reservation ledger (Admin only).
- `GET /analytics/export/utilization`: Stream downloadable CSV capacity utilization metrics (Admin only).

### 6.4 Health Telemetry (`/health`)
- `GET /health`: Unauthenticated readiness probe returning `{ status: "healthy", database: { status: "connected", readyState: 1 }, uptimeSeconds }`.
