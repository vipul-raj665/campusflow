# CampusFlow — Backend Code Walkthrough & Architectural Guide

This document provides a guided tour of the **CampusFlow** backend architecture, directory structure, module responsibilities, middleware pipeline, service layer, and socket infrastructure.

---

## 1. Backend Architecture & High-Level Design

The CampusFlow backend is built on **Node.js** and **Express.js**, following the **Layered Architecture (Controller-Service-Repository)** pattern. This separates HTTP routing and validation from business logic, concurrency control, and direct database queries.

```
Incoming Client Request (HTTP / HTTPS / WSS)
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ Express Server & Global Middleware Pipeline            │
│  - Reverse Proxy Trust (`app.set('trust proxy', 1)`)   │
│  - Helmet HTTP Security Headers                        │
│  - Dynamic CORS Whitelist Validator                    │
│  - Body Parsers (`express.json`, `urlencoded`)         │
│  - Cookie Parser (Signed HttpOnly cookies)             │
│  - Global Rate Limiter (`apiLimiter`)                  │
│  - Swagger UI Documentation (`/api/docs`)              │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ API Version Router (`/api/v1`)                         │
│  - Route-Specific Rate Limiters (`authLimiter`)        │
│  - Authentication Guard (`authenticate`)               │
│  - Role Authorization Guard (`authorize`)              │
│  - Zod Request Schema Validation (`validate`)          │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Controllers Layer (Request/Response Orchestration)     │
│  - Validates business requirements                     │
│  - Invokes Service functions                           │
│  - Sends standardized JSON responses                   │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Services Layer (Core Domain Logic & Concurrency)       │
│  - `slotService.js` (Discrete 30-min slot management)   │
│  - `notificationService.js` (DB & Socket.IO dispatch)  │
│  - `auditService.js` (Sanitized regulatory audit logs) │
│  - `emailService.js` (Transactional alerts/fallbacks)  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Models / ODM Layer (Mongoose)                          │
│  - Schema definitions & data validation                │
│  - Compound indexes & unique constraints               │
│  - Pre-save hooks & schema methods                     │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ MongoDB Database (Local Service / MongoDB Atlas)       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Inventory

```
backend/src/
├── config/
│   ├── constants.js          # System enums (ROLES, STATUS, AUDIT_ACTIONS)
│   ├── db.js                 # Mongoose connection management & retry logic
│   ├── env.js                # Environment variable parsing & safe defaults
│   └── swagger.js            # OpenAPI 3.0 JSDoc configuration
├── controllers/
│   ├── analyticsController.js    # Aggregations for resource utilization & stats
│   ├── auditController.js        # Audit log querying & CSV export
│   ├── authController.js         # Signup, login, refresh, logout, password reset
│   ├── bookingController.js      # Booking lifecycle, approval queue, check-in
│   ├── maintenanceController.js  # Scheduled downtime & slot blocking
│   ├── notificationController.js # Read status, clear, list user alerts
│   ├── resourceController.js     # CRUD for campus resources & availability
│   └── userController.js         # User management, status toggle, role change
├── middleware/
│   ├── authMiddleware.js     # JWT verification & role authorization
│   ├── csrfMiddleware.js     # Custom header validation against cross-site forms
│   ├── errorMiddleware.js    # 404 handler & centralized error handler
│   ├── rateLimiter.js        # Express-rate-limit instances for auth & API
│   └── validateMiddleware.js # Zod schema validation middleware
├── models/
│   ├── AuditLog.js           # Immutable audit trails
│   ├── Booking.js            # Booking requests & status
│   ├── Maintenance.js        # Resource maintenance schedules
│   ├── Notification.js       # User notifications
│   ├── PasswordResetToken.js # Hashed single-use password tokens
│   ├── RefreshToken.js       # Hashed rotating refresh tokens
│   ├── ReservationSlot.js    # 30-minute discrete slots with unique index
│   ├── Resource.js           # Campus facilities, labs, and equipment
│   └── User.js               # User accounts with bcrypt hashing
├── routes/
│   ├── analyticsRoutes.js
│   ├── auditRoutes.js
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── healthRoutes.js       # Uptime and database health probe
│   ├── index.js              # Aggregated v1 route index
│   ├── maintenanceRoutes.js
│   ├── notificationRoutes.js
│   ├── resourceRoutes.js
│   └── userRoutes.js
├── services/
│   ├── auditService.js       # Audit log creator with secret stripping
│   ├── emailService.js       # SMTP dispatcher with development logger
│   ├── notificationService.js# Multi-channel notification pipeline
│   └── slotService.js        # Discrete slot reserving & collision rollback
├── sockets/
│   └── socketHandler.js      # Socket.IO connection & room management
├── utils/
│   ├── provisionAdmin.js     # CLI administrator creation script
│   ├── seedData.js           # Comprehensive sample data seeder
│   └── timeUtils.js          # Time conversion and 30-min slot generator
├── validators/
│   ├── authValidators.js
│   ├── bookingValidators.js
│   ├── maintenanceValidators.js
│   ├── resourceValidators.js
│   └── userValidators.js
├── app.js                    # Express application configuration
└── server.js                 # HTTP server listener & graceful shutdown
```

---

## 3. Server Startup & Express Initialization

### `server.js` — The Process Entry Point
- **HTTP Server Creation**: Wraps the Express application in standard Node.js `http.createServer(app)` to allow **Socket.IO** (`initSocketIO`) to share the same network port and TCP listener.
- **Port Binding**: Binds to `0.0.0.0` using `config.port` (defaults to `5000` or process environment). Binding immediately allows cloud platform port scans (Render, Railway, Heroku) to detect health immediately.
- **Asynchronous Database Connection**: Calls `connectDB()` asynchronously. If MongoDB Atlas has an initial network delay, the server logs a helpful warning with remediation steps (e.g. allowing `0.0.0.0/0` in Atlas Network Access) without crashing the container.
- **Graceful Shutdown**: Listens for OS process signals `SIGINT` (Ctrl+C) and `SIGTERM` (cloud container stop). It invokes `server.close()`, flushes active connections, disconnects Mongoose cleanly via `disconnectDB()`, and exits with code 0.

### `app.js` — Express Pipeline Configuration
- **Reverse Proxy Trust**: `app.set('trust proxy', 1)` ensures that `req.ip` correctly reflects client IP addresses forwarded by load balancers or edge CDNs.
- **Security Headers (`helmet`)**: Enforces secure HTTP headers while configuring `crossOriginResourcePolicy: { policy: 'cross-origin' }` to allow static media and API resource sharing.
- **Dynamic CORS Policy (`cors`)**: The `isOriginAllowed` validator inspects incoming request origins against configured URLs (`CLIENT_ORIGIN`) while automatically allowing cloud preview domains (`*.onrender.com`, `*.up.railway.app`, `*.vercel.app`) and local origins (`localhost`, `127.0.0.1`). It sets `credentials: true` to support secure HttpOnly cookie transmission.
- **Parsers**: Parses JSON bodies up to 5MB, URL-encoded forms, and cookies signed with `config.cookie.secret`.
- **Interactive API Documentation**: Mounts Swagger UI at `/api/docs` generated dynamically from OpenAPI 3.0 JSDoc comments.
- **Static Asset Fallback**: In production, if `frontend/dist` is detected, Express serves static assets and routes unknown non-API requests to `index.html` for single-page client-side routing.
- **Centralized Error Handling**: Any route that throws an unhandled error forwards it to `errorHandler` at the bottom of the middleware stack.

---

## 4. Middleware Deep Dive

### A. Authentication Middleware (`authMiddleware.js`)
1. **`authenticate`**:
   - Reads the `Authorization` header and checks for `Bearer <access_token>`.
   - If missing, immediately returns `401 Unauthorized`.
   - Verifies the signature and expiration against `config.jwt.accessSecret`.
   - If expired, returns a standardized payload with `code: 'TOKEN_EXPIRED'` allowing the client Axios interceptor to trigger transparent session refresh.
   - Loads the user record from MongoDB (`User.findById(decoded.id)`). If the user no longer exists or `user.isActive === false`, rejects the request with `401` or `403`.
   - Attaches the verified Mongoose user document to `req.user` and calls `next()`.
2. **`authorize(...roles)`**:
   - Higher-order middleware factory.
   - Evaluates whether `req.user.role` exists within the passed array of allowed roles.
   - If unauthorized, returns `403 Forbidden` (`Access denied. Requires one of the following roles: [...]`).

### B. Anti-CSRF Middleware (`csrfMiddleware.js`)
- Safe HTTP methods (`GET`, `HEAD`, `OPTIONS`) bypass verification.
- Requests with a `Bearer` token in the `Authorization` header are inherently immune to ambient cookie CSRF and are permitted.
- For requests relying on ambient cookies (such as `POST /api/v1/auth/refresh`), the middleware requires the custom header `X-Requested-With: XMLHttpRequest`. Malicious cross-site scripts or standard HTML `<form>` tags cannot forge custom headers in cross-origin requests.

### C. Rate Limiting Middleware (`rateLimiter.js`)
- **`authLimiter`**: Restricts authentication endpoints (`/login`, `/signup`, `/forgot-password`, `/reset-password`) to **20 attempts per 15-minute window per IP** using `express-rate-limit`. Prevents brute-force credential stuffing.
- **`apiLimiter`**: Restricts all general API endpoints to **120 requests per 1-minute window per IP**, shielding the database against volumetric abuse.

### D. Request Validation Middleware (`validateMiddleware.js`)
- Accepts a **Zod** schema and target source (`'body'`, `'query'`, or `'params'`).
- Executes `schema.parseAsync(req[source])`.
- On validation failure, extracts field paths and user-friendly error messages, returning `400 Bad Request` with structured error keys (`{ success: false, errors: { email: "Invalid email" } }`).

### E. Centralized Error Middleware (`errorMiddleware.js`)
- **`notFoundHandler`**: Catches unmapped routes and emits `404 Not Found` with the HTTP method and requested URL.
- **`errorHandler`**:
  - Detects **Mongoose duplicate key errors** (`err.code === 11000`) and converts them to `409 Conflict`.
  - Detects **Mongoose CastError** (e.g. malformed ObjectId strings) and returns `400 Bad Request`.
  - Detects **JsonWebTokenError** and returns `401 Unauthorized`.
  - In production (`NODE_ENV === 'production'`), sanitizes all unhandled 500 server errors to prevent leaking internal stack traces or database connection details to clients.

---

## 5. Services Layer & Concurrency Engine

### A. Discrete Slot Management (`slotService.js`)
This service is the concurrency core of CampusFlow. Instead of relying on range queries (which suffer from race conditions), CampusFlow discretizes bookings into 30-minute intervals:

1. **`reserveSlots(resourceId, date, startTime, endTime, bookingId, status)`**:
   - Divides the time interval into discrete 30-minute strings (e.g. `["09:00", "09:30", "10:00"]`).
   - Prepares an array of documents for the `ReservationSlot` collection.
   - Executes `ReservationSlot.insertMany(slotDocs, { ordered: true })`.
   - The unique compound index on `{ resource: 1, date: 1, slotTime: 1 }` ensures that if any other transaction reserved even a single 30-minute chunk, MongoDB halts insertion and throws duplicate key error `E11000`.
   - In the `catch` block, any partially inserted slots from that batch are cleaned up via `ReservationSlot.deleteMany({ booking: bookingId })`, and a clean `409 Conflict` error is thrown.
2. **`releaseSlots(bookingId)`**:
   - Deletes all discrete slots associated with a rejected or cancelled booking, instantly returning them to the pool of available resources.
3. **`confirmSlots(bookingId)`**:
   - Updates the status of all slots tied to a booking from `'held'` to `'confirmed'`.
4. **`blockMaintenanceSlots(resourceId, date, startTime, endTime, maintenanceId)`**:
   - Inserts maintenance slots (`status: 'maintenance'`) to prevent user reservations during scheduled downtime.
5. **`getResourceAvailability(resourceId, date)`**:
   - Generates all valid 30-minute intervals across the resource's operating hours (e.g. `08:00` to `20:00`).
   - Queries `ReservationSlot` for that date and maps reserved slots, outputting total slots, available count, booked count, and utilization percentage.

### B. Notification Service (`notificationService.js`)
- **Multi-Channel Delivery**:
  1. Writes a persistent document to the `Notification` collection in MongoDB.
  2. If the user has an active WebSocket connection, pushes real-time event `notification:new` to `user:<userId>`.
- **Admin Broadcasts (`notifyAdmins`)**:
  - Emits real-time event `admin:alert` to the dedicated `role:admin` room.

### C. Regulatory Audit Trail Service (`auditService.js`)
- Records administrative and sensitive actions (`BOOKING_CREATE`, `BOOKING_APPROVE`, `BOOKING_REJECT`, `BOOKING_CANCEL`, `RESOURCE_CREATE`, `USER_UPDATE`).
- **Data Sanitization**: Automatically strips sensitive attributes (`password`, `token`, `refreshToken`, `secret`) from details objects before persisting.
- Records client IP address (accounting for proxies) and user-agent string.

### D. Transactional Email Service (`emailService.js`)
- In production with SMTP credentials configured (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`), utilizes `nodemailer` to dispatch password reset instructions and booking alerts.
- In local development without SMTP, falls back to formatted console logging without throwing errors.

---

## 6. Real-Time WebSocket Infrastructure (`socketHandler.js`)

CampusFlow uses **Socket.IO** for live notification streaming:
- **Connection Handshake**: Intercepts initial WebSocket upgrade request and validates JWT access token from `socket.handshake.auth.token` or authorization headers.
- **Socket Authentication**: Invalid or missing tokens are rejected immediately during handshake.
- **Room Segmentation**:
  - Every authenticated client joins a private room: `user:<userId>`.
  - If `socket.user.role === 'admin'`, the socket also joins `role:admin`.
- This ensures users only receive notifications intended for them, preventing cross-user data leakage.

---

## 7. Controllers & API Request Lifecycle

Every controller adheres to a consistent structure:
1. Extract validated data from `req.body`, `req.query`, or `req.params`.
2. Perform business checks (e.g., verifying capacity, operating hours, role authorization).
3. Call database or service operations.
4. Record audit logs for auditable actions.
5. Dispatch asynchronous real-time notifications.
6. Return standardized JSON response:
   ```json
   {
     "success": true,
     "message": "Human readable confirmation",
     "data": { ... }
   }
   ```
7. Pass unexpected errors to `next(error)` for centralized handling.

---

## 8. Summary Table of Backend Endpoints by Controller

| Controller | Major Endpoints | Key Middleware Used | Primary Database Model |
|------------|-----------------|---------------------|------------------------|
| `authController` | `POST /signup`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`, `POST /forgot-password`, `POST /reset-password` | `authLimiter`, `csrfProtection`, `authenticate` | `User`, `RefreshToken`, `PasswordResetToken` |
| `bookingController` | `POST /bookings`, `GET /bookings/my`, `GET /bookings/:id`, `PATCH /bookings/:id/cancel`, `GET /bookings/admin/queue`, `PATCH /bookings/:id/approve`, `PATCH /bookings/:id/reject` | `authenticate`, `authorize`, `validate` | `Booking`, `ReservationSlot`, `Resource` |
| `resourceController` | `GET /resources`, `GET /resources/:id`, `GET /resources/:id/availability`, `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id` | `authenticate`, `authorize('admin')`, `validate` | `Resource`, `ReservationSlot` |
| `maintenanceController` | `GET /maintenance`, `POST /maintenance`, `PATCH /maintenance/:id/complete`, `DELETE /maintenance/:id` | `authenticate`, `authorize('admin')`, `validate` | `Maintenance`, `ReservationSlot` |
| `analyticsController` | `GET /analytics/dashboard`, `GET /analytics/utilization`, `GET /analytics/export` | `authenticate`, `authorize('admin')` | `Booking`, `Resource`, `ReservationSlot` |
| `auditController` | `GET /audit`, `GET /audit/export` | `authenticate`, `authorize('admin')` | `AuditLog` |
| `notificationController` | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id` | `authenticate` | `Notification` |
| `userController` | `GET /users`, `GET /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/status` | `authenticate`, `authorize('admin')`, `validate` | `User` |
