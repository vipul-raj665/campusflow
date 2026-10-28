# CampusFlow — Technical Glossary of Terms

This glossary defines key software engineering, web development, database, security, and architectural terms used throughout the **CampusFlow** codebase and documentation.

---

## 1. Architectural & Full-Stack Fundamentals

### 1. MERN Stack
- **Definition:** An open-source JavaScript software stack consisting of four key technologies: MongoDB, Express.js, React.js, and Node.js.
- **CampusFlow Application:** The foundational stack of CampusFlow. Enables full-stack JavaScript execution from database queries (Mongoose) to user interface components (React 18).

### 2. Monorepo
- **Definition:** A software development strategy where code for multiple distinct projects or layers (e.g. frontend and backend) is stored in the same repository.
- **CampusFlow Application:** CampusFlow houses both `backend/` and `frontend/` within a single Git repository orchestrated by a root `package.json` for unified development and CI/CD.

### 3. REST (Representational State Transfer)
- **Definition:** An architectural style for networked applications that uses standard stateless HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to manipulate resources represented as JSON documents.
- **CampusFlow Application:** CampusFlow exposes 33 RESTful endpoints organized under the versioned base path `/api/v1/`.

### 4. SPA (Single-Page Application)
- **Definition:** A web application that loads a single HTML shell page and dynamically updates content as the user interacts with the app, without requiring full-page browser reloads.
- **CampusFlow Application:** The React client (`frontend/`) is an SPA powered by Vite and React Router, providing desktop-class transitions between views.

### 5. Separation of Concerns (SoC)
- **Definition:** A software design principle for separating a computer program into distinct sections such that each section addresses a separate concern.
- **CampusFlow Application:** CampusFlow isolates HTTP parsing into Controllers, business and slot calculations into Services, data schemas into Models, and UI rendering into React components.

---

## 2. Backend & Node.js Concepts

### 6. Node.js
- **Definition:** An open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser, built on Google Chrome's V8 engine.
- **CampusFlow Application:** Powers the CampusFlow backend server (`backend/src/server.js`).

### 7. Express.js
- **Definition:** A minimalist, unopinionated web framework for Node.js that provides routing, middleware handling, and HTTP utility methods.
- **CampusFlow Application:** Configures the REST API pipeline and handles route registration in `backend/src/app.js`.

### 8. Middleware
- **Definition:** Software functions that sit between the raw network request and the final controller handler, capable of inspecting, modifying, or terminating requests.
- **CampusFlow Application:** Used for authentication (`authMiddleware.js`), role validation (`authorize`), rate limiting (`rateLimiter.js`), and centralized error handling (`errorMiddleware.js`).

### 9. Asynchronous Non-Blocking I/O
- **Definition:** An execution model where input/output operations (e.g., reading from a database or file system) run in the background without halting the main JavaScript thread.
- **CampusFlow Application:** Enables Node.js to handle hundreds of concurrent booking availability checks without stalling other campus users.

### 10. Reverse Proxy
- **Definition:** A server that sits in front of web servers and forwards client requests to those web servers, providing security, load balancing, and SSL termination.
- **CampusFlow Application:** Cloud hosts (Render, Railway) act as reverse proxies; `app.set('trust proxy', 1)` enables Express to read the real client IP address from `X-Forwarded-For`.

---

## 3. Database & MongoDB Concepts

### 11. MongoDB
- **Definition:** A NoSQL document-oriented database that stores data in flexible, JSON-like BSON (Binary JSON) documents.
- **CampusFlow Application:** Persists all 9 collections (users, bookings, resources, slots, logs) without rigid relational schemas.

### 12. Mongoose ODM
- **Definition:** An Object Data Modeling (ODM) library for MongoDB and Node.js that manages data modeling, schema validation, hooks, and relationships.
- **CampusFlow Application:** Defines schemas in `backend/src/models/` and executes queries across collections.

### 13. Compound Index
- **Definition:** A database index that indexes multiple fields together in a specified order to accelerate multi-field queries and enforce multi-column uniqueness.
- **CampusFlow Application:** The unique compound index on `{ resource: 1, date: 1, slotTime: 1 }` in `ReservationSlot.js` mathematically prevents double-bookings.

### 14. Document & Collection
- **Definition:** In MongoDB, a *document* is a single record of key-value pairs (analogous to a row), and a *collection* is a grouping of documents (analogous to a table).
- **CampusFlow Application:** Every venue is a document inside the `resources` collection; every reservation is a document inside the `bookings` collection.

### 15. Population (`.populate()`)
- **Definition:** The process in Mongoose where reference ObjectIds in one document are automatically replaced with the actual referenced documents from another collection.
- **CampusFlow Application:** When loading a booking, `.populate('resource')` replaces the resource ObjectId with full venue details (name, room number, capacity).

### 16. TTL (Time-To-Live) Index
- **Definition:** A specialized MongoDB single-field index that automatically deletes documents from a collection after a designated period.
- **CampusFlow Application:** Applied to the `expiresAt` field in `RefreshToken.js` and `PasswordResetToken.js` to automatically purge expired tokens.

---

## 4. Concurrency & Slot Engine Concepts

### 17. Race Condition
- **Definition:** A software flaw where the output or state of a system depends on the unpredictable sequence or timing of concurrent execution threads.
- **CampusFlow Application:** Occurs when two users attempt to book the same room at the same time. Prevented in CampusFlow by database-level compound unique indexes.

### 18. Discrete Time Discretization
- **Definition:** The practice of dividing continuous time spans into fixed, uniform intervals (e.g. 30 minutes).
- **CampusFlow Application:** Instead of checking continuous start and end times, CampusFlow converts bookings into discrete 30-minute blocks (e.g., `["09:00", "09:30"]`) stored in `ReservationSlot`.

### 19. Atomic Database Operation
- **Definition:** An operation that completes in its entirety or does not happen at all, guaranteeing that the database is never left in a partially modified state.
- **CampusFlow Application:** `ReservationSlot.insertMany(slotDocs, { ordered: true })` acts atomically: if any slot fails due to duplicate key conflict, insertion halts immediately.

### 20. Rollback
- **Definition:** An operation that restores a database or system to a previous consistent state after an error occurs during a multi-step transaction.
- **CampusFlow Application:** In `bookingController.js`, if slot reservation fails, the newly created booking record is rolled back via `Booking.findByIdAndDelete(createdBooking._id)`.

---

## 5. Security & Authentication Concepts

### 21. JSON Web Token (JWT)
- **Definition:** An open, industry-standard (RFC 7519) compact URL-safe means of representing claims securely between two parties, signed with a secret key.
- **CampusFlow Application:** Used for short-lived 15-minute Access Tokens containing user ID, role, and email.

### 22. In-Memory Access Token
- **Definition:** A token retained only within the volatile RAM of the running JavaScript application rather than written to persistent browser disk storage.
- **CampusFlow Application:** Protects CampusFlow against Cross-Site Scripting (XSS) disk harvesting by keeping access tokens in React closures.

### 23. HttpOnly Cookie
- **Definition:** A flag included in an HTTP `Set-Cookie` response header that directs the browser that the cookie should not be accessible via client-side scripts.
- **CampusFlow Application:** Used to deliver long-lived 7-day Refresh Tokens, making them completely immune to theft by malicious client-side JavaScript.

### 24. SameSite Cookie Attribute
- **Definition:** A cookie attribute that controls whether cookies are sent with cross-site requests, providing defense against Cross-Site Request Forgery (CSRF).
- **CampusFlow Application:** Configured as `SameSite=Lax` in local development and `SameSite=None; Secure` in production cross-origin topologies.

### 25. Bcrypt Password Hashing
- **Definition:** A password-hashing function designed by Niels Provos and David Mazières based on the Blowfish cipher, incorporating a salt to protect against rainbow table attacks.
- **CampusFlow Application:** Applied with 12 salt rounds in `User.js` to hash all user passwords before storage.

### 26. Salt Rounds / Work Factor
- **Definition:** A parameter in bcrypt that dictates the number of hashing rounds ($2^{\text{rounds}}$ iterations), intentionally consuming CPU time to make brute-force cracking computationally impractical.
- **CampusFlow Application:** Set to `12` in CampusFlow (~4,096 iterations), balancing fast login verification with defense against offline dictionary attacks.

### 27. Cross-Site Scripting (XSS)
- **Definition:** A security vulnerability where an attacker injects malicious client-side scripts into web pages viewed by other users.
- **CampusFlow Application:** Mitigated by avoiding `localStorage` for authentication tokens, sanitizing React JSX outputs, and enforcing Helmet headers.

### 28. Cross-Site Request Forgery (CSRF)
- **Definition:** An attack where a malicious website induces a victim's web browser to perform unwanted actions on a trusted site where the victim is authenticated.
- **CampusFlow Application:** Mitigated by requiring custom headers (`X-Requested-With: XMLHttpRequest`) and SameSite cookie attributes via `csrfMiddleware.js`.

### 29. Rate Limiting
- **Definition:** A strategy for limiting network traffic by capping how often a user or IP address can repeat an action within a designated timeframe.
- **CampusFlow Application:** `authLimiter` limits authentication attempts to 20 per 15 minutes; `apiLimiter` caps general requests to 120 per minute.

### 30. Role-Based Access Control (RBAC)
- **Definition:** An access governance model where permissions are assigned to specific roles (e.g., student, faculty, admin) rather than to individual users.
- **CampusFlow Application:** Enforced server-side via `authorize('admin')` middleware and client-side via React `<ProtectedRoute>`.

### 31. Anti-Privilege Escalation
- **Definition:** Architectural defenses designed to prevent users from elevating their permission level (e.g., a student turning themselves into an administrator).
- **CampusFlow Application:** Enforced by Zod validation schemas that reject `admin` in public signup payloads, and controller overrides that map roles strictly to student or faculty.

---

## 6. Frontend & React Concepts

### 32. React 18
- **Definition:** A popular JavaScript library for building user interfaces, introducing concurrent rendering, automatic batching, and transitions.
- **CampusFlow Application:** Serves as the UI rendering foundation for the entire frontend single-page application.

### 33. React Hooks
- **Definition:** Functions that let developers "hook into" React state and lifecycle features from functional components without writing ES6 class components.
- **CampusFlow Application:** Heavily utilizes `useState`, `useEffect`, `useContext`, `useCallback`, and custom hooks (`useAuth`).

### 34. Context API (`AuthContext`)
- **Definition:** A built-in React mechanism for sharing global values (such as current user session) across the component tree without passing props manually down every level (prop drilling).
- **CampusFlow Application:** Implemented in `frontend/src/context/AuthContext.jsx` to distribute user identity and login/logout handlers.

### 35. Axios Interceptors
- **Definition:** Functions that Axios calls for every request before it is sent and for every response before it is handled by `.then()` or `.catch()`.
- **CampusFlow Application:** Intercepts outgoing requests to attach Bearer tokens, and intercepts `401 TOKEN_EXPIRED` responses to trigger transparent token refresh.

### 36. Tailwind CSS
- **Definition:** A utility-first CSS framework providing low-level CSS utility classes to compose bespoke designs directly in JSX markup.
- **CampusFlow Application:** Provides the responsive, accessible styling across all 14 pages and components.

### 37. Recharts
- **Definition:** A composable charting library built on React components and SVG elements.
- **CampusFlow Application:** Visualizes daily booking trends, facility utilization rates, and venue distributions in the Admin Analytics dashboard (`AdminAnalyticsPage.jsx`).

---

## 7. Real-Time & Networking Concepts

### 38. WebSocket Protocol
- **Definition:** A full-duplex communication protocol that provides persistent, bi-directional channels over a single TCP connection.
- **CampusFlow Application:** Powers the underlying transport layer for live notification streaming.

### 39. Socket.IO
- **Definition:** A library that enables real-time, bi-directional event-based communication between web clients and servers with fallback to HTTP long-polling if WebSockets are blocked.
- **CampusFlow Application:** Coordinates notifications, connection handshakes, and private rooms in `backend/src/sockets/socketHandler.js`.

### 40. Socket Room
- **Definition:** A server-side concept in Socket.IO that allows grouping sockets into arbitrary channels for targeted message broadcasting.
- **CampusFlow Application:** Used to partition connections into `user:<userId>` (private user alerts) and `role:admin` (administrative alerts).

### 41. CORS (Cross-Origin Resource Sharing)
- **Definition:** A browser security mechanism that uses HTTP headers to tell browsers whether a web application running at one origin can request resources from a different origin.
- **CampusFlow Application:** Configured in `backend/src/app.js` to allow communication between the Vite client (`localhost:5173`) and the Express server (`localhost:5000`).

---

## 8. Quality Assurance & Testing Concepts

### 42. Vitest
- **Definition:** A modern unit and integration test framework designed natively for Vite, featuring fast parallel execution, watch mode, and Jest-compatible assertion syntax.
- **CampusFlow Application:** Executes all 23 backend integration and frontend component tests.

### 43. Supertest
- **Definition:** A high-level abstraction library for testing HTTP servers in Node.js, allowing tests to send simulated HTTP requests directly to Express without binding to an open network port.
- **CampusFlow Application:** Drives all 20 backend integration tests in `backend/tests/api.test.js`.

### 44. React Testing Library (RTL)
- **Definition:** A testing library for React that encourages testing components from the perspective of how end-users interact with the DOM rather than testing implementation details.
- **CampusFlow Application:** Validates landing page rendering, demo buttons, and navigation elements in `frontend/src/__tests__/App.test.jsx`.

### 45. JSDOM
- **Definition:** A pure-JavaScript implementation of standard web standards (DOM and HTML) for use with Node.js, simulating a web browser environment for testing.
- **CampusFlow Application:** Provides the simulated browser DOM environment for executing React component tests in headless terminals.
