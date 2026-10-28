# CampusFlow — Technology Stack & Architectural Decisions

## 1. The Core MERN Stack

CampusFlow is built on the **MERN** stack: **M**ongoDB, **E**xpress.js, **R**eact.js, and **N**ode.js. This section explains each component, its specific role in CampusFlow, and how they interact.

---

### 1.1 MongoDB & Mongoose (Database Tier)

#### What is MongoDB?
MongoDB is an open-source, distributed NoSQL document database. Instead of storing data in rigid two-dimensional tables with rows and columns (as in SQL databases like MySQL or PostgreSQL), MongoDB stores records as flexible, JSON-like **BSON** (Binary JSON) documents.

#### Why MongoDB is Used in CampusFlow
1. **Polymorphic Resource Schemas**: Campus facilities vary widely in specifications. A Computer Lab requires workstation counts and GPU models; a Science Lab requires laser hazard ratings and chemical fume hood specs; portable equipment requires flight case dimensions. MongoDB handles nested JSON arrays (such as `amenities`) without complex SQL join tables.
2. **Atomic Discrete Slices**: CampusFlow prevents double-booking using a separate `ReservationSlot` collection with a unique compound index (`resource + date + slotTime`). MongoDB's high-speed index checking allows microsecond collision detection under concurrent write loads.
3. **Seamless JSON Interoperability**: Data flows natively from MongoDB to Express, through REST endpoints, and into React without requiring manual Object-Relational Mapping (ORM) translation.

#### Mongoose: Schema Definition & Validation
While MongoDB is schema-less by nature, enterprise applications require strict data integrity. CampusFlow uses **Mongoose (v8.9.5)** as an Object Data Modeling (ODM) library:
- **Schemas**: Enforce mandatory fields, string trimming, regex validations (e.g., email format in `User.js`, time format `HH:mm` in `Booking.js`).
- **Pre-Save Hooks**: Automatically hashes passwords using `bcryptjs` before persisting a user document (`userSchema.pre('save', ...)`).
- **Virtuals & Serialization**: The `toJSON` method strips sensitive fields (like password hashes) before sending documents across the network.
- **Relational Population**: Mongoose's `.populate()` links related collections (e.g., `Booking.find().populate('resource').populate('user')`).

---

### 1.2 Express.js (Application Gateway & Routing Tier)

#### What is Express.js?
Express.js (v4.21.2) is a minimal, unopinionated web framework for Node.js. It provides a robust suite of HTTP utilities, middleware pipelines, and routing mechanisms.

#### Role in CampusFlow
Express acts as the application's central nervous system:
1. **Pipeline Execution**: Incoming HTTP requests pass sequentially through a chain of middleware:
   ```
   Incoming Request -> Helmet (Headers) -> CORS (Origin Whitelist) -> Body/Cookie Parsers -> Rate Limiting -> Route Handler -> Error Middleware
   ```
2. **Versioned REST API Routing**: Endpoints are organized under `/api/v1` in modular route files (`authRoutes.js`, `bookingRoutes.js`, etc.).
3. **Separation of Concerns**: Express cleanly isolates routing (URL matching), controllers (request parsing and response formatting), services (core business logic), and models (database access).

---

### 1.3 React.js (Presentation & Client Tier)

#### What is React.js?
React (v18.3.1) is a declarative, component-based frontend JavaScript library developed by Meta.

#### Role in CampusFlow
1. **Single-Page Application (SPA)**: Using `react-router-dom` (v6.28.1), CampusFlow loads a single HTML shell (`frontend/index.html`) and dynamically updates the DOM without full browser refreshes.
2. **Context-Driven Global State**: CampusFlow avoids heavyweight state libraries (like Redux) in favor of three lightweight, native React Contexts:
   - `AuthContext`: Manages user identity, session restoration, and in-memory JWT tokens.
   - `ToastContext`: Displays feedback notifications (success, error, warning).
   - `NotificationContext`: Manages unread counters and real-time alert streams via Socket.IO.
3. **Role-Tailored Dashboards**: Dynamically renders distinct navigation sidebars and pages based on the authenticated user's role (`admin`, `faculty`, or `student`).

---

### 1.4 Node.js (Runtime Environment)

#### What is Node.js?
Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 engine. It executes JavaScript outside the web browser, enabling developers to build server-side applications.

#### Role in CampusFlow
1. **Asynchronous Non-Blocking I/O**: Node.js operates on a single-threaded event loop utilizing non-blocking I/O calls. When CampusFlow queries MongoDB, verifies a bcrypt password hash, or emits a WebSocket frame, Node delegates the task to the libuv thread pool and continues handling other user requests.
2. **Unified Language Ecosystem**: JavaScript is used across the entire application stack: frontend React JSX, backend Express controllers, database validation logic, and test suites.

---

## 2. Additional Technologies & Libraries in the Stack

Every package in the repository has a clear purpose:

| Technology | Category | Purpose in CampusFlow | Key Files | Impact if Removed | Essential vs. Optional |
|---|---|---|---|---|---|
| **Vite (v6.0.7)** | Build Tool & Dev Server | Fast compilation, Hot Module Replacement (HMR), production asset minification. | `frontend/vite.config.js` | Development would require slower Webpack configuration. | Essential for modern frontend |
| **Tailwind CSS (v3.4.17)** | Utility CSS Framework | Modern styling, color palette, responsive grids, and design tokens. | `frontend/tailwind.config.js`, `frontend/src/index.css` | All styles would break; manual raw CSS would be required. | Essential for UI styling |
| **React Router (v6.28.1)** | Client Routing | Declarative routing, nested dashboard layouts, and route permission guards. | `frontend/src/App.jsx`, `frontend/src/layouts/ProtectedRoute.jsx` | SPA navigation breaks; browser would require full page reloads. | Essential for SPA |
| **Axios (v1.7.9)** | HTTP Client | Request/response interceptors, automatic bearer token injection, anti-CSRF header attachment, automatic token refresh. | `frontend/src/services/api.js` | Manual `fetch()` wrappers would be required; interceptor logic must be rewritten. | Essential for API client |
| **Zod (v3.24.1)** | Schema Validation | Type-safe input validation for signup, login, bookings, and facility creation before reaching controllers. | `backend/src/validators/*`, `backend/src/middleware/validateMiddleware.js` | Controller code must write manual `if-else` validation checks; vulnerable to malformed payloads. | Essential for data integrity |
| **jsonwebtoken (v9.0.2)** | Security & Session | Cryptographic generation and verification of signed JWT access tokens with 15-minute expiration. | `backend/src/controllers/authController.js`, `backend/src/middleware/authMiddleware.js` | Stateless API authentication breaks; requires stateful session storage. | Essential for auth |
| **bcryptjs (v2.4.3)** | Cryptography | One-way password hashing using 12 salt rounds before database persistence. | `backend/src/models/User.js`, `backend/src/utils/provisionAdmin.js` | Passwords stored in plain text (catastrophic vulnerability). | Essential for security |
| **Socket.IO (v4.8.1)** | Real-Time Engine | Full-duplex WebSocket connection delivering instant notification toasts and admin alerts without polling. | `backend/src/sockets/socketHandler.js`, `frontend/src/services/socket.js` | Real-time toasts fail; users must refresh to see approvals/alerts. | Highly Recommended |
| **Helmet (v8.0.0)** | HTTP Security | Sets 15+ secure HTTP headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`). | `backend/src/app.js` | API exposed to clickjacking, MIME-sniffing, and cross-site scripting vulnerabilities. | Essential for security |
| **express-rate-limit (v7.5.0)** | Rate Limiting | Throttles brute-force password guessing (20 req / 15 min) and API flooding (120 req / min). | `backend/src/middleware/rateLimiter.js` | API vulnerable to denial-of-service and credential stuffing attacks. | Essential for security |
| **Recharts (v2.15.0)** | Data Visualization | Renders dynamic bar charts, pie charts, and trend lines on the Administrator Dashboard. | `frontend/src/pages/admin/AdminDashboard.jsx` | Admins see raw numbers and tables instead of graphical charts. | Optional / Visual enhancement |
| **Lucide React (v0.469.0)** | Iconography | High-consistency SVG icons across dashboard navigation, status badges, and action buttons. | All frontend pages and components | Icons disappear; text-only UI. | Optional / Visual enhancement |
| **Swagger UI Express (v5.0.1)** | Documentation | Serves interactive OpenAPI specification at `/api/docs` for API exploration. | `backend/src/config/swagger.js`, `backend/src/app.js` | Developers must read Markdown files instead of interactive testing in the browser. | Optional / Developer convenience |
| **Vitest & Supertest** | Testing Suite | Automated test runner and HTTP assertion library verifying 23 backend and frontend tests. | `backend/tests/api.test.js`, `frontend/src/__tests__/App.test.jsx` | No automated verification of regressions or concurrency race conditions. | Essential for QA |

---

## 3. Technology Comparisons & Architectural Trade-offs

### 3.1 MongoDB vs. Relational SQL (PostgreSQL/MySQL)

```
+-----------------------------------------------------------------------------------+
| SQL (PostgreSQL / MySQL)                  | MongoDB (CampusFlow Implementation)   |
+-------------------------------------------+---------------------------------------+
| Fixed relational tables with schema DDL   | Flexible JSON/BSON document modeling  |
| Heavy JOIN queries for nested arrays      | Single document contains nested specs |
| Relational foreign keys enforce integrity | Mongoose ObjectIds + Compound Indexes |
| Horizontal scaling requires sharding setup| Native horizontal scale & clustering  |
+-----------------------------------------------------------------------------------+
```

- **Why MongoDB Fits CampusFlow**: Campus resources have variable attributes (e.g., computer labs require software installed, RAM, GPU; lecture halls require acoustic mic types, podium specifications). In SQL, this requires 4-5 join tables (`resource_amenities`, `resource_specs`, etc.). In MongoDB, this is stored as a native array inside the `resources` document.
- **The Trade-off**: MongoDB does not natively cascade delete foreign keys. For example, if a Resource is deleted, associated Bookings must be cleaned up manually via application logic (`slotService.js` and `bookingController.js`).

---

### 3.2 Single-Page Application (React) vs. Server-Side Rendering (EJS/Next.js)

- **Why React SPA Fits CampusFlow**: Campus resource scheduling is an interactive operational tool. Users click calendar dates, interact with dynamic 30-minute availability grids, toggle filters, and review approval queues without full-page browser reloads.
- **The Trade-off**: An SPA has a slightly larger initial bundle download (~850 KB uncompressed, ~233 KB gzipped) and requires dedicated client-side routing logic compared to traditional server-rendered templates.

---

### 3.3 Dual-Token Authentication vs. Traditional Server Sessions

```
Traditional Session:
Client -> Sends Session ID Cookie -> Server looks up Redis/SQL Session Store -> Verifies User

CampusFlow Dual-Token Architecture:
Client -> Sends In-Memory JWT in Authorization Header -> Server verifies cryptographic signature
       -> Refresh Token sent via HttpOnly Cookie only to /api/v1/auth/refresh for session renewal
```

- **Why Dual-Token Fits CampusFlow**:
  1. **XSS Protection**: The Access Token is stored strictly in JavaScript runtime memory (`let inMemoryToken = null`). It is **never** written to `localStorage` or `sessionStorage`. Malicious scripts injected via XSS cannot harvest the token.
  2. **CSRF Protection**: The Refresh Token is kept in an `HttpOnly` cookie with `SameSite: Lax/None`. The refresh endpoint requires a custom `X-Requested-With: XMLHttpRequest` header, blocking standard cross-origin form submission CSRF attacks.
- **The Trade-off**: If the user reloads the browser tab, the in-memory token is cleared, requiring a silent background handshake (`POST /api/v1/auth/refresh`) to restore the session on application mount.

---

### 3.4 WebSockets (Socket.IO) vs. HTTP Polling

- **Traditional Polling**: The frontend sends an HTTP request every 5 seconds (`GET /api/v1/notifications`). 99% of requests return empty arrays, wasting server CPU cycles and bandwidth.
- **CampusFlow Socket.IO Pipeline**: The frontend establishes a persistent WebSocket connection. When an administrator approves a booking in `bookingController.js`, the server pushes an event directly into the user's private channel (`user:<userId>`). The client instantly renders a toast notification.
