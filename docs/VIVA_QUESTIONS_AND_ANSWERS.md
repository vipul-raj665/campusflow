# CampusFlow — Comprehensive Viva Questions, Answers & Project Defense Guide

This guide is designed to prepare students, developers, and presenters to confidently explain, demonstrate, and defend the **CampusFlow** project in academic vivas, capstone project evaluations, and technical interviews.

---

## 1. Quick Presentation Scripts

### A. The 30-Second Elevator Pitch
> *"CampusFlow is a full-stack MERN web application that solves the problem of chaotic, paper-based resource booking in universities. It provides students and faculty with real-time visibility into campus venues like auditoriums, labs, and seminar halls, while providing administrators with a 1-click approval workflow. Most importantly, it implements a race-safe, discrete 30-minute time-slot reservation engine that mathematically prevents double-booking conflicts via MongoDB unique compound indexes."*

---

### B. The 2-Minute Project Overview
> *"Good morning, respected examiners. In most universities today, reserving physical facilities—such as the robotics lab, auditorium, or seminar rooms—relies on manual logbooks, informal verbal agreements, or slow paper requisition forms. This leads to double-bookings, lost requests, lack of accountability, and underutilized campus facilities.*
>
> *To eliminate this friction, I developed **CampusFlow**. CampusFlow is built on the modern MERN stack—MongoDB, Express.js, React 18 with Vite and Tailwind CSS, and Node.js.*
>
> *The application supports three distinct roles: Students can discover facilities and submit reservation requests; Faculty members have higher reservation limits for academic sessions; and Administrators review pending requests, schedule facility maintenance, monitor live utilization analytics, and export regulatory audit logs.*
>
> *From a technical standpoint, the core innovation is our **Discrete Slot Reservation Engine**. Rather than relying on simple time-range queries that suffer from concurrency race conditions, CampusFlow divides venue schedules into discrete 30-minute blocks in a dedicated collection. A unique compound index on the resource, date, and slot time enforces race-safe conflict prevention directly at the database level. Even under simultaneous requests, exactly one request succeeds with HTTP 201, while the competing request is rejected with HTTP 409.*
>
> *For security, we avoided insecure localStorage tokens and implemented a **Dual-Token System**—a short-lived 15-minute access token kept in memory and a rotating 7-day HttpOnly cookie protected by custom anti-CSRF headers and rate limiting. Socket.IO provides instant, bi-directional notification delivery. The entire codebase is backed by 23 automated tests across backend integration and frontend components."*

---

### C. The 5-Minute Technical Architecture Script
*(Use this when the examiner asks: "Walk me through the system architecture and request lifecycle.")*
> *"CampusFlow follows a 3-tier Layered Architecture: the Client Presentation Layer, the API & Business Logic Layer, and the Data Persistence Layer.*
>
> *1. **Presentation Layer:** The frontend is a React 18 Single-Page Application bundled with Vite. Global authentication state is managed via React Context (`AuthContext`). We use Axios with interceptors: when the in-memory access token expires, an Axios response interceptor intercepts the 401 response, transparently calls `/api/v1/auth/refresh`, updates the in-memory token, and replays the original user request without interrupting the user's session.*
>
> *2. **API & Routing Layer:** The Express server starts in `server.js` by binding an HTTP server with Socket.IO. All incoming traffic passes through Helmet for security headers, a dynamic CORS validator supporting cloud deployments, body and cookie parsers, and a global rate limiter. Requests route to `/api/v1`, where Zod schemas parse and validate the payload before hitting the controller.*
>
> *3. **Controller & Service Layer:** We enforce clean separation of concerns. Controllers handle HTTP request/response orchestration, while domain logic lives in dedicated services. For example, `bookingController.js` handles parameter validation and authorization, but delegates slot holding to `slotService.js`, notification dispatch to `notificationService.js`, and immutable auditing to `auditService.js`.*
>
> *4. **Database & Persistence Layer:** MongoDB stores 9 collections. Sensitive tokens (refresh tokens and password reset tokens) are hashed with SHA-256 before storage so that even a database dump reveals zero usable credentials. Concurrency safety is achieved in `ReservationSlot` using the compound index `{ resource: 1, date: 1, slotTime: 1 }`.*
>
> *5. **Real-Time Layer:** During the Socket.IO handshake, the user's JWT is verified. Upon connection, the socket joins a private room named `user:<userId>`. When an administrator approves a booking, the server saves the notification to MongoDB and emits `notification:new` directly to that user's private room, triggering an instant toast and bell update without polling.*
>
> *This design delivers high performance, strong security boundaries, and reliable concurrency control."*

---

## 2. Step-by-Step Live Demonstration Sequence

Follow this exact 8-step sequence during your project demonstration:

```
Step 1: Landing Page & Live Status
  └─ Show landing page (http://localhost:5173). Point out responsive design, feature highlights, and role demo cards.

Step 2: Quick Login as Student
  └─ Click "Student (Manan)" demo button. Show automatic filling of student credentials and seamless login into the Student Portal.

Step 3: Browse Catalog & Real-Time Availability
  └─ Open "Explore Facilities" (/resources). Filter by "Computer Lab". Select "Robotics Research Lab".
  └─ Pick tomorrow's date. Show the interactive 30-minute slot matrix (available slots in green, booked slots grayed out).

Step 4: Submit a Reservation
  └─ Select 10:00 AM to 11:30 AM. Enter purpose: "Robotics Team Sensor Calibration". Click "Confirm Reservation".
  └─ Show the instant toast notification and the booking appearing in "My Bookings" with a yellow "Pending Approval" badge.

Step 5: Admin Login in Incognito Window
  └─ Open a private/incognito browser window. Navigate to http://localhost:5173/login and sign in as Administrator (admin@campusflow.edu).
  └─ Point out the Admin Portal badge and admin-only navigation tabs (Approvals, Facilities, Maintenance, Analytics, Audit Logs).

Step 6: Review and Approve Booking
  └─ Navigate to "/admin/bookings". Show Manan's pending request at the top of the queue.
  └─ Click "Approve". Show the badge update to green "Approved".

Step 7: Verify Real-Time Synchronization
  └─ Switch back to the Student window WITHOUT refreshing the page.
  └─ Point out that the notification bell has incremented, a real-time toast alert appeared ("Booking Approved! 🎉"), and the booking status updated to "Approved".

Step 8: Administrative Analytics & CSV Export
  └─ In the Admin window, open "Analytics" (/admin/analytics). Show interactive Recharts graphs for resource utilization and booking distribution.
  └─ Open "Audit Logs" (/admin/audit). Point out that the approval action was immutably recorded with actor ID, IP address, and timestamp. Click "Export CSV" to demonstrate report downloading.
```

---

## 3. 60+ Technical Viva Questions & Answers

### Domain 1: General Concept & Problem Statement

#### Q1: What is CampusFlow and what core problem does it solve?
**Answer:** CampusFlow is a full-stack MERN web application that digitizes the reservation and governance of physical campus assets (auditoriums, labs, seminar halls). It eliminates the manual errors, verbal miscommunications, lost paper requisitions, and double-booking collisions common in traditional college administrations.

#### Q2: Who are the target user personas in CampusFlow?
**Answer:** CampusFlow supports three distinct user roles:
1. **Students:** Can discover available facilities, view real-time availability, submit reservation requests, and track approval status.
2. **Faculty:** Have higher booking allowances and priority access for academic sessions, workshops, and lectures.
3. **Administrators:** Have complete governance over the platform—approving/rejecting requests, adding resources, scheduling maintenance downtime, viewing analytics, and downloading audit logs.

#### Q3: What makes this a full-stack web application?
**Answer:** It implements the complete client-to-database architectural stack: a dynamic Single-Page Application frontend (React 18), an API and business logic backend (Node.js & Express.js), a persistence layer (MongoDB with Mongoose ODM), and a bi-directional real-time communication pipeline (Socket.IO).

#### Q4: Why can't a university simply use Google Calendar for campus bookings?
**Answer:** Google Calendar lacks institutional governance: it cannot enforce physical seating capacity limits, cannot restrict bookings based on user roles (student vs. faculty), does not provide administrative approval workflows with rejection justifications, cannot block emergency maintenance downtime with automated conflict eviction, and lacks regulatory audit logging required for institutional accreditation.

#### Q5: What is the complete lifecycle of a booking in CampusFlow?
**Answer:** The lifecycle follows: `Submitted (Pending)` → Reviewed by Admin → either `Approved` (slots confirmed) or `Rejected` (slots freed) → `Completed` (after event date) or `Cancelled` (by user or due to maintenance).

---

### Domain 2: MERN Stack & Architecture

#### Q6: Explain what MERN stands for and the role of each component in CampusFlow.
**Answer:**
- **M (MongoDB):** NoSQL document database that persists users, facilities, bookings, slots, and audit logs.
- **E (Express.js):** Minimalist web application framework for Node.js that organizes routing, middleware, and controllers.
- **R (React.js):** Declarative component-based frontend library for rendering responsive, interactive user interfaces.
- **N (Node.js):** Asynchronous JavaScript runtime environment that executes server-side code outside the browser.

#### Q7: Why choose MERN over LAMP (Linux, Apache, MySQL, PHP) or Django/Python?
**Answer:** MERN enables a unified programming language (JavaScript) across both client and server, allowing shared validation logic and data formats (JSON). Node's event-driven, non-blocking I/O model is well-suited for I/O-heavy operations like booking engines and real-time WebSockets compared to thread-per-request architectures.

#### Q8: How is the codebase structured, and why use a monorepo?
**Answer:** The repository is structured into `backend/` and `frontend/` directories managed under a unified root `package.json`. A monorepo simplifies local development by allowing a single command (`npm run dev`) to launch both servers concurrently, simplifies synchronized git versioning, and provides unified CI/CD deployment configuration (`render.yaml`).

#### Q9: What architectural design pattern is used in the backend?
**Answer:** The backend uses the **Layered Architecture (Controller-Service-Repository)** pattern:
- **Routes:** Define URL paths and apply middleware (auth, rate limiting, validation).
- **Controllers:** Parse requests, manage HTTP status codes, and format JSON responses.
- **Services:** Contain business rules, concurrency slot calculations, and notification dispatching.
- **Models (Repository):** Define Mongoose schemas, compound indexes, and database interactions.

#### Q10: How does client-server communication work in CampusFlow?
**Answer:** Dual-channel communication:
1. **RESTful HTTP/HTTPS:** Used for CRUD operations, authentication, and report exports via standard JSON payloads.
2. **WebSocket (WSS):** Used for low-latency, bi-directional event notifications (instant approval toasts and alert badge updates) via Socket.IO.

---

### Domain 3: MongoDB & Database Design

#### Q11: How many collections exist in the CampusFlow database?
**Answer:** 9 collections: `User`, `Resource`, `Booking`, `ReservationSlot`, `Maintenance`, `Notification`, `AuditLog`, `RefreshToken`, and `PasswordResetToken`.

#### Q12: Why did you choose MongoDB over a relational database like PostgreSQL or MySQL?
**Answer:** Campus resources have diverse attributes (e.g., computer labs require workstation counts and OS types; auditoriums require audio/visual specs; seminar halls require projector specifications). MongoDB's flexible JSON-like BSON documents accommodate varying resource metadata without complex table joins. Additionally, MongoDB compound unique indexes provide atomic, race-safe concurrency control.

#### Q13: What is the role of Mongoose in this project?
**Answer:** Mongoose is an Object Data Modeling (ODM) library for MongoDB. It provides strict schema validation, type casting, relationship population (`.populate()`), pre-save middleware hooks (such as bcrypt hashing in `User.js`), and index management.

#### Q14: How are relationships between collections managed in MongoDB?
**Answer:** Through **Reference-based relationships** using MongoDB ObjectIds. For instance, the `Booking` schema references `user: { type: Schema.Types.ObjectId, ref: 'User' }` and `resource: { type: Schema.Types.ObjectId, ref: 'Resource' }`. When reading data, Mongoose's `.populate()` method resolves these references into populated documents.

#### Q15: What indexes are implemented in your schemas and why?
**Answer:**
1. `User`: Unique index on `email` to guarantee unique accounts.
2. `ReservationSlot`: Unique compound index on `{ resource: 1, date: 1, slotTime: 1 }` to prevent double-bookings.
3. `Booking`: Compound index on `{ resource: 1, date: 1, status: 1 }` and `{ user: 1, status: 1 }` to optimize dashboard filtering.
4. `RefreshToken`: Unique index on `tokenHash` and TTL index on `expiresAt` for automatic cleanup.
5. `AuditLog`: Compound index on `{ targetModel: 1, targetId: 1 }` and index on `createdAt` for fast audit timeline generation.

---

### Domain 4: Concurrency & Race-Condition Prevention

#### Q16: What is a race condition in a booking system?
**Answer:** A race condition occurs when two users simultaneously attempt to reserve the same resource for the same time slot. If the system checks availability first and then writes to the database in two non-atomic steps, both requests may see the resource as "available" and both write bookings, resulting in a double-booking.

#### Q17: How does CampusFlow prevent race conditions?
**Answer:** CampusFlow implements a **Discrete Slot Reservation Engine** in `slotService.js`. Rather than querying time ranges, bookings are discretized into 30-minute intervals (e.g., a booking from 10:00 to 11:30 is split into 10:00, 10:30, and 11:00). These slots are inserted into the `ReservationSlot` collection via `ReservationSlot.insertMany(slotDocs, { ordered: true })`.

MongoDB enforces a unique compound index on `{ resource: 1, date: 1, slotTime: 1 }`. If two requests compete for the same slot, the database allows the first insert and immediately throws a duplicate key error (`E11000`) for the second. The server catches this error, rolls back any partial inserts, and returns `409 Conflict`.

#### Q18: Have you verified that this concurrency mechanism works under load?
**Answer:** Yes. In our automated integration suite (`backend/tests/api.test.js`, Test 14), we dispatch two simultaneous booking requests for the exact same resource and time slot using `Promise.all([req1, req2])`. The test confirms that exactly one request succeeds with HTTP 201 Created while the competing request is rejected with HTTP 409 Conflict.

#### Q19: What is the purpose of `{ ordered: true }` in `insertMany`?
**Answer:** It ensures that MongoDB processes slot inserts sequentially within the batch. If any single slot conflicts with an existing reservation, MongoDB halts insertion immediately, preventing partial or inconsistent bookings.

#### Q20: What happens to reservation slots when a booking is rejected or cancelled?
**Answer:** The system calls `releaseSlots(bookingId)` in `slotService.js`, which executes `ReservationSlot.deleteMany({ booking: bookingId })`. This frees the discrete 30-minute slots, making them available for other users.

---

### Domain 5: Authentication & Security

#### Q21: Where are authentication tokens stored on the client, and why?
**Answer:** We implement a **Dual-Token System**:
- **Access Token:** Stored exclusively in JavaScript memory (React state / closure). It is never written to `localStorage` or `sessionStorage`, making it immune to XSS token theft.
- **Refresh Token:** Stored in an `HttpOnly`, `SameSite` browser cookie. Because it has the `httpOnly` flag, JavaScript cannot read or access it.

#### Q22: What is the lifespan of your tokens?
**Answer:** The Access Token is short-lived (**15 minutes**). The Refresh Token has a lifespan of **7 days**.

#### Q23: How are passwords stored securely in the database?
**Answer:** Passwords are never stored in plain text. They are hashed using **bcryptjs** with an adaptive work factor of **12 salt rounds** via a Mongoose pre-save hook in `User.js`.

#### Q24: What is Refresh Token Rotation and how does it prevent replay attacks?
**Answer:** When the client calls `/api/v1/auth/refresh`, the server verifies the incoming refresh token, immediately marks it as revoked (`isRevoked = true`), links it to its successor via `replacedByTokenHash`, and issues a brand new refresh token. If an attacker intercepts and attempts to reuse an old refresh token, the server detects the reuse and invalidates the session.

#### Q25: Why are refresh tokens hashed with SHA-256 in the database?
**Answer:** If an unauthorized party gains access to a database backup, plain-text refresh tokens would allow them to generate valid access tokens for any user. By storing only the SHA-256 hash (`tokenHash`), the database contains no usable credentials.

---

### Domain 6: Authorization & Role-Based Access Control (RBAC)

#### Q26: What is the difference between Authentication and Authorization?
**Answer:**
- **Authentication:** Verifies *who* the user is (e.g., verifying email and password to prove identity).
- **Authorization:** Verifies *what* permissions the authenticated user possesses (e.g., checking if the user has the `admin` role before allowing access to the approval queue).

#### Q27: How is authorization enforced in the backend?
**Answer:** Through the `authorize(...roles)` middleware in `authMiddleware.js`. It inspects `req.user.role` (populated by `authenticate`) and verifies that the role exists within the allowed array. If not, it returns `403 Forbidden`.

#### Q28: How does CampusFlow prevent privilege escalation during user registration?
**Answer:** Through dual-layer defense:
1. **Schema Validation:** Zod validator restricts the registration `role` enum strictly to `['student', 'faculty']`. Passing `admin` returns `400 Bad Request`.
2. **Controller Sanitization:** `authController.js` enforces `const assignedRole = role === ROLES.FACULTY ? ROLES.FACULTY : ROLES.STUDENT;`. Admin accounts can only be created via the offline CLI provisioning script or from inside the authenticated Admin Portal.

#### Q29: Can a student view or cancel another student's booking?
**Answer:** No. In `bookingController.js`, endpoints verify ownership:
```javascript
if (req.user.role !== 'admin' && String(booking.user._id) !== String(req.user._id)) {
  return res.status(403).json({ success: false, message: 'Access forbidden: You can only view your own bookings.' });
}
```
Students can only view or cancel their own bookings; administrators can view and manage all bookings.

#### Q30: What happens if a user's account is deactivated by an administrator?
**Answer:** The `authenticate` middleware checks `if (!user.isActive)` on every request. If false, the server returns `403 Forbidden` (`"Your account has been deactivated. Please contact campus administration."`), revoking access.

---

### Domain 7: Express.js & Backend Architecture

#### Q31: What is Express middleware and how does it function?
**Answer:** Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the `next` function in the application's request-response cycle. They can execute code, modify `req` and `res`, end the request-response cycle, or call `next()` to pass control to the next handler.

#### Q32: What is the execution order of middleware in `app.js`?
**Answer:**
1. `app.set('trust proxy', 1)` (Proxy header resolution)
2. `helmet()` (Security HTTP headers)
3. `cors()` (Cross-Origin Resource Sharing)
4. `express.json()` and `express.urlencoded()` (Body parsers)
5. `cookieParser()` (Signed cookie extraction)
6. `apiLimiter` (Global rate limiter)
7. Swagger documentation (`/api/docs`)
8. Primary API version router (`/api/v1`)
9. Static frontend serving (in production)
10. `notFoundHandler` (404 handler)
11. `errorHandler` (Centralized error handler)

#### Q33: How does centralized error handling work in CampusFlow?
**Answer:** The `errorHandler` middleware in `errorMiddleware.js` receives unhandled errors passed via `next(err)`. It inspects error properties and maps them to appropriate HTTP responses:
- Mongoose duplicate key (`code: 11000`) → `409 Conflict`
- Mongoose CastError (invalid ObjectId) → `400 Bad Request`
- JWT errors (`JsonWebTokenError`, `TokenExpiredError`) → `401 Unauthorized`
- In production, it hides stack traces and returns a clean error message to prevent leaking system details.

#### Q34: What rate limiting policies are in place?
**Answer:**
- **`authLimiter`:** 20 requests per 15 minutes per IP on authentication routes (login, signup, password reset) to prevent brute-force attacks.
- **`apiLimiter`:** 120 requests per minute per IP on general `/api/*` routes to protect against denial-of-service attempts.

#### Q35: How does the server handle graceful shutdown?
**Answer:** In `server.js`, process listeners intercept `SIGINT` and `SIGTERM`. The server stops accepting new connections via `server.close()`, closes the MongoDB connection cleanly via `disconnectDB()`, and exits with code 0.

---

### Domain 8: React.js & Frontend Architecture

#### Q36: How is global state managed in the frontend without Redux?
**Answer:** Global state is managed using **React Context API** (`AuthContext.jsx`). It provides authentication status, the current user object, role information, and login/logout handlers to all components via the custom hook `useAuth()`. For localized UI states (modal visibility, form inputs, table filters), standard React `useState` and `useReducer` hooks are used.

#### Q37: How does the frontend handle token expiration without logging the user out?
**Answer:** Via **Axios Interceptors** in `frontend/src/services/api.js`:
1. When any API call returns `401 Unauthorized` with `code: 'TOKEN_EXPIRED'`, the Axios response interceptor intercepts the failure.
2. It pauses outgoing requests and calls `POST /api/v1/auth/refresh`.
3. The server validates the HttpOnly cookie and returns a new Access Token.
4. The interceptor updates the in-memory token, updates the original request's authorization header, and replays the original request transparently.

#### Q38: How are protected routes implemented in React Router?
**Answer:** Using the `<ProtectedRoute>` wrapper component in `frontend/src/routes/ProtectedRoute.jsx`. It inspects the `user` object from `useAuth()`. If unauthenticated, it redirects to `/login`. If the route specifies required roles (`allowedRoles={['admin']}`) and the user's role is not included, it redirects to an unauthorized page.

#### Q39: What is Vite and why was it chosen over Create React App (CRA)?
**Answer:** Vite is a build tool that leverages native ES modules (ESM) in the browser during development. It provides near-instantaneous Hot Module Replacement (HMR) and uses Rollup for optimized production builds. Create React App is officially deprecated and relies on Webpack, which bundles the entire application before serving, resulting in slower startup times.

#### Q40: How is styling implemented in the frontend?
**Answer:** Using **Tailwind CSS**, a utility-first CSS framework. It allows responsive, accessible, and consistent styling directly within JSX class names without writing custom CSS stylesheets. Lucide React provides modern UI iconography.

---

### Domain 9: Real-Time WebSockets & Socket.IO

#### Q41: Why use WebSockets instead of HTTP polling for notifications?
**Answer:** HTTP polling requires the client to repeatedly send requests to the server (e.g., every 5 seconds), wasting bandwidth and server CPU on empty responses. WebSockets establish a single, persistent TCP connection, allowing the server to push updates to the client the moment an event occurs with minimal latency and overhead.

#### Q42: How does Socket.IO authenticate connections?
**Answer:** In `socketHandler.js`, an `io.use()` middleware intercepts the WebSocket handshake. It extracts the JWT access token from `socket.handshake.auth.token`, verifies it against `config.jwt.accessSecret`, and attaches user identity to the socket instance. Unauthenticated connections are rejected during the handshake.

#### Q43: How does the server prevent broadcasting notifications to the wrong users?
**Answer:** Through **Room-based Segmentation**:
- Upon connection, each socket joins a private room: `user:<userId>`.
- When a booking is approved, `notificationService.js` targets that specific room: `io.to('user:' + booking.user).emit('notification:new', notification)`.
- System administrators join a shared room: `role:admin`. Administrative alerts are pushed only to that room.

#### Q44: What happens if a user is offline when a notification is sent?
**Answer:** The notification is always persisted in the MongoDB `Notification` collection first before any WebSocket emission. When the user logs in later, the frontend fetches all unread notifications via `GET /api/v1/notifications`.

#### Q45: How does the frontend handle WebSocket reconnections?
**Answer:** Socket.IO's client library includes automatic reconnection with exponential backoff. In `frontend/src/services/socket.js`, reconnection logic re-attaches the current access token on reconnect attempts.

---

### Domain 10: Testing, Quality Assurance & Edge Cases

#### Q46: What testing tools are used and how many tests pass?
**Answer:** We use **Vitest** with **Supertest** for backend integration tests, and **React Testing Library** with **JSDOM** for frontend component tests. All **23 automated tests** pass.

#### Q47: How do you test components that make network calls in React?
**Answer:** We mock the API and socket modules using Vitest's mocking utilities (`vi.mock('../services/api')` and `vi.mock('../services/socket')`). This simulates API responses without making network calls, preventing test flakiness and timeout errors.

#### Q48: How does CampusFlow handle facility maintenance?
**Answer:** When an administrator schedules maintenance via `POST /api/v1/maintenance`:
1. The system blocks discrete 30-minute slots in `ReservationSlot` with `status: 'maintenance'`.
2. It checks for existing student/faculty bookings during that window.
3. Conflicting bookings are automatically transitioned to `status: 'cancelled'` with an explanatory cancellation reason.
4. Affected users receive real-time notifications about the cancellation.

#### Q49: What edge cases are handled in booking time validation?
**Answer:**
- Bookings on past dates (rejected with `400`).
- Bookings outside facility operating hours (e.g., trying to book at 11:00 PM when the hall closes at 8:00 PM).
- Bookings exceeding resource capacity (e.g., requesting 100 attendees for a 40-seat lab).
- Durations shorter than `minDurationMinutes` or longer than `maxDurationMinutes`.
- Requests submitted further in advance than `advanceBookingDaysLimit`.

#### Q50: How does the system handle booking cancellations?
**Answer:** When a booking is cancelled:
1. Ownership or admin authorization is verified.
2. The booking record is marked `cancelled` with a recorded reason.
3. Associated reservation slots are deleted from `ReservationSlot`.
4. An immutable audit log entry is written.
5. The slots become immediately available for other users to book.

---

### Domain 11: Deployment & Cloud Infrastructure

#### Q51: How is CampusFlow deployed to the cloud?
**Answer:** The repository includes turnkey deployment configurations:
- **Render (`render.yaml`):** Deploys the backend as a Node.js Web Service and the frontend as a global edge-hosted Static Site.
- **Railway (`railway.json`):** Alternative multi-service container deployment.
- **MongoDB Atlas:** Cloud database cluster with automated failover and encryption at rest.

#### Q52: Why does Render prohibit a `region` setting on static sites?
**Answer:** Render static sites are deployed directly to a global Content Delivery Network (CDN) with edge nodes worldwide. Because they are distributed globally rather than hosted in a single regional datacenter, Render's schema validation rejects a `region` parameter on static sites.

#### Q53: How does CORS work across separate cloud domains?
**Answer:** When frontend and backend run on different domains (e.g., `campusflow.onrender.com` and `campusflow-api.onrender.com`), the browser sends an HTTP `OPTIONS` preflight request. The backend's dynamic CORS middleware checks the `Origin` header against allowed domains, sets `Access-Control-Allow-Credentials: true`, and returns allowed methods and headers.

#### Q54: Why is `app.set('trust proxy', 1)` needed in cloud deployments?
**Answer:** Cloud platforms like Render, Railway, and Heroku place applications behind reverse proxies and load balancers. Enabling `trust proxy` tells Express to trust the `X-Forwarded-For` header, ensuring `req.ip` reflects the actual client's IP address rather than the load balancer's internal IP.

#### Q55: How are environment secrets managed in production?
**Answer:** Secrets are never committed to version control. In local environments, they are stored in git-ignored `.env` files. In cloud production environments, they are injected securely through the hosting platform's environment variable dashboard.

---

### Domain 12: System Limitations & Future Scope

#### Q56: What are the current limitations of CampusFlow?
**Answer:**
1. **Single-Node Rate Limiter:** The default rate limiter runs in Node.js process memory. In a multi-server cluster, it would require a centralized Redis store.
2. **Physical Access Integration:** The application does not currently interface directly with physical electronic door locks or turnstiles.
3. **No Native Mobile App:** While fully mobile-responsive in web browsers, it lacks native iOS/Android applications.

#### Q57: How would you scale CampusFlow to handle 100,000+ students?
**Answer:**
1. **Database:** Implement MongoDB database sharding based on `department` or `resourceId`, and add read-replicas for analytical queries.
2. **Backend:** Deploy multiple stateless Node.js containers behind an NGINX load balancer or cloud ingress controller.
3. **Caching:** Integrate Redis to cache frequently read resource catalogs and user session states.
4. **WebSocket Adapter:** Implement `@socket.io/redis-adapter` so WebSocket events broadcast across multiple server instances.

#### Q58: What future enhancements are planned for CampusFlow?
**Answer:**
1. **IoT Smart Locks:** Integrate MQTT-enabled door controllers to unlock venues automatically during approved reservation windows.
2. **Campus RFID/NFC Tapping:** Allow students to check in by tapping student ID cards at room entrances.
3. **Calendar Integration:** Provide two-way synchronization with Google Calendar and Microsoft Outlook via `.ics` exports.
4. **AI-Driven Optimization:** Implement predictive algorithms to suggest optimal room allocations based on historical attendance patterns.

#### Q59: How did you approach developing this project?
**Answer:** *"I approached the project with standard software engineering practices: starting with problem definition and user persona identification, designing the database schema and compound indexes, implementing clean layered architecture with separation of concerns, enforcing defensive security practices, and backing critical paths with automated test suites."*

#### Q60: If asked about using AI tools during development:
**Answer:** *"I utilized modern development tools, including AI coding assistants, to accelerate documentation, write boilerplate test assertions, and audit code quality. However, every architectural decision—including the discrete slot concurrency engine, the compound unique index design, the dual-token session architecture, and the RBAC middleware—was designed, verified, and debugged to ensure full functionality and code ownership."*
