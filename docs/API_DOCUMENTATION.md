# CampusFlow REST API Documentation
**Version 1.0.0 — Specification & Endpoint Reference**

Base URL: `http://localhost:5000/api/v1`  
Interactive Swagger UI: `http://localhost:5000/api/docs`

---

## 1. Authentication & Security Headers

### Request Headers
- `Authorization`: `Bearer <jwt_access_token>` (Required for protected routes)
- `Content-Type`: `application/json`
- `X-Requested-With`: `XMLHttpRequest` (Required for CSRF protection on state-changing endpoints)

### Standard Response Format
All JSON responses follow a consistent envelope:
```json
{
  "success": true,
  "message": "Human readable status message",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Specific field validation message"
  }
}
```

---

## 2. Authentication Endpoints (`/auth`)

### 2.1 User Registration
- **Endpoint**: `POST /auth/signup`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@campusflow.edu",
    "password": "SecurePassword@2026",
    "confirmPassword": "SecurePassword@2026",
    "department": "Computer Science & Engineering",
    "role": "student",
    "studentOrEmployeeId": "STU-2026-001",
    "phone": "+1 (555) 019-2831"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user profile, access token, and sets HttpOnly refresh cookie.
  - `400 Bad Request`: Field validation error or weak password.
  - `409 Conflict`: Email address already registered.

### 2.2 User Login
- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane.doe@campusflow.edu",
    "password": "SecurePassword@2026"
  }
  ```
- **Responses**:
  - `200 OK`: Returns user profile and in-memory access token. Sets `campusflow_refresh` cookie.
  - `401 Unauthorized`: Generic invalid credential message.
  - `403 Forbidden`: Account is suspended.

### 2.3 Refresh Session
- **Endpoint**: `POST /auth/refresh`
- **Access**: Public (Cookie Authenticated)
- **Cookie**: `campusflow_refresh`
- **Headers**: `X-Requested-With: XMLHttpRequest`
- **Responses**:
  - `200 OK`: Rotates refresh token in cookie and issues fresh 15-minute access token.
  - `401 Unauthorized`: Token missing, expired, or revoked.

### 2.4 User Logout
- **Endpoint**: `POST /auth/logout`
- **Access**: Authenticated
- **Responses**:
  - `200 OK`: Marks refresh token revoked and clears session cookie.

### 2.5 Current User Profile
- **Endpoint**: `GET /auth/me`
- **Access**: Authenticated (Bearer Token)
- **Responses**:
  - `200 OK`: Returns current authenticated user record.

### 2.6 Forgot Password Request
- **Endpoint**: `POST /auth/forgot-password`
- **Access**: Public
- **Request Body**:
  ```json
  { "email": "jane.doe@campusflow.edu" }
  ```
- **Responses**:
  - `200 OK`: Dispatches single-use reset token (or logs safely in dev console if SMTP not configured).

### 2.7 Reset Password Execution
- **Endpoint**: `POST /auth/reset-password`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "token": "64_character_hex_token",
    "newPassword": "NewSecurePassword@2026",
    "confirmPassword": "NewSecurePassword@2026"
  }
  ```
- **Responses**:
  - `200 OK`: Password updated and all active refresh tokens revoked.

---

## 3. Resource Management (`/resources`)

### 3.1 List & Filter Resources
- **Endpoint**: `GET /resources`
- **Access**: Public
- **Query Parameters**:
  - `search`: String (searches name, code, building, description)
  - `type`: Enum (`computer_lab`, `science_lab`, `seminar_hall`, `classroom`, `conference_room`, `equipment`)
  - `building`: String
  - `minCapacity`: Number
  - `status`: String (`active`, `maintenance`, `inactive`)
  - `page`: Number (default: 1)
  - `limit`: Number (default: 12)
- **Responses**:
  - `200 OK`: Paginated resource list with pagination metadata.

### 3.2 Get Resource by ID
- **Endpoint**: `GET /resources/:id`
- **Access**: Public
- **Responses**:
  - `200 OK`: Detailed resource document with amenities and operating hours.
  - `404 Not Found`: Invalid resource ID.

### 3.3 Check Real-Time Availability
- **Endpoint**: `GET /resources/:id/availability?date=YYYY-MM-DD`
- **Access**: Public
- **Query Parameters**:
  - `date`: String (Format: `YYYY-MM-DD`, required)
- **Response Structure**:
  ```json
  {
    "success": true,
    "data": {
      "resource": { "id": "...", "name": "Alan Turing Lab", "code": "LAB-CS-101" },
      "date": "2026-10-25",
      "summary": {
        "totalSlots": 24,
        "availableSlotsCount": 20,
        "bookedSlotsCount": 4,
        "utilizationPercentage": 17
      },
      "slots": [
        { "time": "08:00", "status": "available", "available": true },
        { "time": "08:30", "status": "available", "available": true },
        { "time": "09:00", "status": "confirmed", "available": false, "bookingNumber": "BK-20261025-XXXX" }
      ]
    }
  }
  ```

### 3.4 Create Resource (Admin Only)
- **Endpoint**: `POST /resources`
- **Access**: Admin
- **Request Body**:
  ```json
  {
    "name": "Robotics Simulation Lab",
    "code": "LAB-ROB-101",
    "type": "computer_lab",
    "building": "Technology Tower",
    "roomNumber": "Room 101",
    "capacity": 40,
    "operatingHours": { "openTime": "08:00", "closeTime": "20:00" },
    "allowedRoles": ["student", "faculty", "admin"],
    "minDurationMinutes": 30,
    "maxDurationMinutes": 240,
    "advanceBookingDaysLimit": 14,
    "amenities": ["Gigabit LAN", "GPU Workstations", "Smart Projector"]
  }
  ```

---

## 4. Booking Engine (`/bookings`)

### 4.1 Create Booking Request (Race-Safe)
- **Endpoint**: `POST /bookings`
- **Access**: Student, Faculty, Admin
- **Request Body**:
  ```json
  {
    "resource": "67137f...",
    "date": "2026-10-25",
    "startTime": "10:00",
    "endTime": "12:00",
    "purpose": "ACM Student Chapter Hackathon Practice Session",
    "expectedAttendees": 35
  }
  ```
- **Responses**:
  - `201 Created`: Booking created in status `pending` and discrete 30-minute reservation slots atomically claimed.
  - `400 Bad Request`: Attendee count exceeds capacity, past date, or outside operating hours.
  - `403 Forbidden`: Account role not permitted for this facility.
  - `409 Conflict`: One or more requested discrete time slots are already booked.

### 4.2 My Bookings History
- **Endpoint**: `GET /bookings/my`
- **Access**: Authenticated
- **Query Parameters**: `status`, `page`, `limit`
- **Responses**:
  - `200 OK`: Requester's bookings with populated facility details.

### 4.3 Approvals Queue (Admin Only)
- **Endpoint**: `GET /bookings/admin/queue`
- **Access**: Admin
- **Query Parameters**: `status` (default: `pending`), `page`, `limit`
- **Responses**:
  - `200 OK`: Pending booking requests with requester metadata.

### 4.4 Approve Booking (Admin Only)
- **Endpoint**: `PATCH /bookings/:id/approve`
- **Access**: Admin
- **Responses**:
  - `200 OK`: Transitions booking status to `approved`, confirms held slots, logs audit action, and dispatches real-time WebSocket notification to requester.

### 4.5 Reject Booking (Admin Only)
- **Endpoint**: `PATCH /bookings/:id/reject`
- **Access**: Admin
- **Request Body**:
  ```json
  { "rejectionReason": "Facility reserved for institutional semester examinations." }
  ```
- **Responses**:
  - `200 OK`: Sets status to `rejected`, records rejection reason, releases all held slots, and notifies user.

### 4.6 Cancel Booking
- **Endpoint**: `PATCH /bookings/:id/cancel`
- **Access**: Requester or Admin
- **Request Body**:
  ```json
  { "cancellationReason": "Seminar relocated to virtual meeting." }
  ```
- **Responses**:
  - `200 OK`: Sets status to `cancelled` and releases all discrete reservation slots immediately.

---

## 5. Maintenance Engine (`/maintenance`)

### 5.1 Schedule Facility Maintenance (Admin Only)
- **Endpoint**: `POST /maintenance`
- **Access**: Admin
- **Request Body**:
  ```json
  {
    "resource": "67137f...",
    "title": "HVAC Overhaul & Fiber LAN Recabling",
    "reason": "Scheduled annual facilities inspection and cabling upgrades.",
    "startDate": "2026-10-28",
    "endDate": "2026-10-28",
    "startTime": "08:00",
    "endTime": "18:00"
  }
  ```
- **Responses**:
  - `201 Created`: Inserts maintenance blackout slots. Conflicting approved/pending bookings are safely cancelled, documented, and affected users receive instant notifications.

### 5.2 Cancel Maintenance Period (Admin Only)
- **Endpoint**: `PATCH /maintenance/:id/cancel`
- **Access**: Admin
- **Responses**:
  - `200 OK`: Maintenance cancelled and facility slots unlocked.

---

## 6. Notifications & WebSockets (`/notifications`)

### 6.1 List Notifications
- **Endpoint**: `GET /notifications`
- **Access**: Authenticated
- **Query Parameters**: `unreadOnly=true|false`, `page`, `limit`

### 6.2 Mark Single Notification Read
- **Endpoint**: `PATCH /notifications/:id/read`
- **Access**: Authenticated

### 6.3 Mark All Read
- **Endpoint**: `PATCH /notifications/read-all`
- **Access**: Authenticated

---

## 7. Analytics, Reporting & CSV (`/analytics`)

### 7.1 Administrator Dashboard Analytics
- **Endpoint**: `GET /analytics/dashboard`
- **Access**: Admin
- **Returns**: Aggregated real metrics for total resources, registered users, pending queue count, bookings by resource type, bookings by department, daily trends, and top booked resources.

### 7.2 Export Bookings to CSV
- **Endpoint**: `GET /analytics/export/bookings`
- **Access**: Admin
- **Query Parameters**: `status`, `startDate`, `endDate`
- **Returns**: `Content-Type: text/csv` file attachment.

### 7.3 Export Facility Utilization to CSV
- **Endpoint**: `GET /analytics/export/utilization`
- **Access**: Admin
- **Returns**: `Content-Type: text/csv` file attachment.

---

## 8. Health & Readiness Probe (`/health`)

- **Endpoint**: `GET /health`
- **Access**: Public
- **Response Structure**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-19T13:40:00.000Z",
    "uptimeSeconds": 1420,
    "database": {
      "status": "connected",
      "readyState": 1
    },
    "version": "1.0.0",
    "service": "CampusFlow API"
  }
  ```
