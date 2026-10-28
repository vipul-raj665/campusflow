# CampusFlow — Smart Campus Resource Booking and Management System

CampusFlow is an enterprise-grade, full-stack MERN platform built to streamline, centralize, and automate academic campus resource reservations. It provides conflict-free booking for computer and science laboratories, seminar auditoriums, smart classrooms, conference rooms, and specialized laboratory equipment.

---

## 🌟 Key Features

- **Race-Safe Booking Engine**: Normalized 30-minute time slots backed by MongoDB unique compound indexes (`{ resource, date, slotTime }`) preventing concurrent double-bookings.
- **Role-Based Access Control (RBAC)**:
  - **Student**: Resource discovery, dynamic filters, booking submissions, real-time status tracking, self-service cancellations.
  - **Faculty**: Department-specific requests, elevated academic priority, multi-hour bookings, event scheduling.
  - **Administrator**: Global analytics dashboard, resource lifecycle management (CRUD, capacity, amenities, operating hours), approval queue with race-safe revalidation, maintenance blackout management, user role promotion, and audit logging.
- **Real-Time Synchronous Notifications**: Authenticated Socket.IO rooms (`user:<id>` and `role:admin`) paired with persistent, indexed database notification models.
- **Maintenance & Blackout Management**: Time-based resource blocks that detect existing booking conflicts, notify affected students/faculty, and release occupied slots safely.
- **Security & Session Management**:
  - In-memory short-lived JWT access tokens (15m).
  - Cryptographically secure rotating refresh tokens in `HttpOnly; SameSite=Lax; Path=/api/v1/auth` cookies.
  - Anti-CSRF verification header (`X-Requested-With`).
  - Rate limiting on sensitive authentication routes.
  - bcrypt password hashing (12 salt rounds) with password strength requirements.
  - Secure single-use hashed password reset tokens.
- **Analytics & Reporting**:
  - Recharts visual charts for booking trends, resource utilization rates, and department statistics.
  - Role-protected CSV export endpoints for booking records and resource utilization data.
  - Tamper-evident administrative audit logging.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18 + Vite | High-performance SPA with client-side routing |
| **Styling** | Tailwind CSS | Curated color system (Deep Navy `#0B1220`, Royal Blue `#2563EB`) |
| **Icons** | Lucide React | Modern stroke iconography |
| **Data Viz** | Recharts | Responsive SVG charts for metrics and utilization |
| **HTTP Client** | Axios | Configured with token refresh interceptors & CSRF protection |
| **Real-time** | Socket.IO Client / Server | WebSocket event pipeline for real-time notifications |
| **Backend** | Node.js + Express.js | Versioned REST API (`/api/v1`) |
| **Database** | MongoDB + Mongoose | Document database with indexed relational references & unique slot constraints |
| **Validation** | Zod | Strict runtime schema validation for request payloads |
| **Security** | Helmet + bcrypt + express-rate-limit | Hardened HTTP headers, password security, and brute-force mitigation |
| **Testing** | Vitest + Supertest + RTL | Unit, integration, and API testing suite |

---

## 📁 Repository Structure

```
campusflow/
├── frontend/                   # Frontend Vite + React + Tailwind CSS application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Common, layout, booking, resource, dashboard components
│   │   ├── pages/              # Public, auth, student, faculty, and admin pages
│   │   ├── context/            # AuthContext, NotificationContext, SocketContext
│   │   ├── services/           # Axios API services and Socket client
│   │   ├── utils/              # Formatting, date helpers, validation rules
│   │   ├── App.jsx             # Main router and route guards
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/                    # Backend Node.js + Express.js + MongoDB API application
│   ├── src/
│   │   ├── config/             # DB connection, env validation, constants
│   │   ├── models/             # Mongoose schemas (User, Resource, Booking, Slot, etc.)
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # Versioned express route modules
│   │   ├── middleware/         # Auth, RBAC, error handling, validation middleware
│   │   ├── services/           # Concurrency slot allocator, audit logger, mailer
│   │   ├── validators/         # Zod schemas for incoming data
│   │   ├── sockets/            # Socket.IO connection and room management
│   │   ├── utils/              # Seed scripts, admin provisioning, helpers
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # HTTP + Socket.IO server startup
│   ├── tests/                  # Automated integration & concurrency tests
│   └── package.json
├── docs/                       # Comprehensive documentation
│   ├── ARCHITECTURE.md         # Full architectural design & concurrency mechanics
│   ├── DATABASE_SCHEMA.md      # Collection schemas, indexes, and relationship diagram
│   ├── API_DOCUMENTATION.md    # OpenAPI/REST endpoint specifications
│   ├── TESTING.md              # Test plan, concurrency testing, and execution guide
│   └── INDUSTRIAL_TRAINING_REPORT_OUTLINE.md # Academic & industrial training report
├── .gitignore
├── package.json                # Monorepo root scripts
├── README.md
└── PROJECT_PLAN.md             # Master project plan and milestone specifications
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v24.x tested and supported)
- **npm**: v9.0.0 or higher
- **MongoDB**: v5.0 or higher running locally on port 27017 or a MongoDB Atlas URI

### 1. Installation

From the project root folder, install dependencies across both workspaces:

```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Alternatively, install individually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Environment Configuration

Backend configuration:
```bash
# In backend/ directory
cp .env.example .env
```
Ensure `backend/.env` contains valid values (defaults work for local development):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/campusflow
CLIENT_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=your_super_secret_access_jwt_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_at_least_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_signing_secret_min_32_chars
```

Frontend configuration:
```bash
# In frontend/ directory
cp .env.example .env
```
Ensure `frontend/.env` points to the backend server:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed Demonstration Data & Provision Admin

CampusFlow includes an idempotent seed script that populates realistic campus resources (computer labs, physics labs, seminar halls, smart classrooms, conference rooms, 4K projectors) and demonstration accounts:

```bash
# Run the database seeder from the root folder
npm run seed
```

To securely provision or reset an administrator account with custom credentials:
```bash
# Interactive or environment-based admin provisioning
ADMIN_NAME="System Administrator" ADMIN_EMAIL="admin@campusflow.edu" ADMIN_PASSWORD="Admin@CampusFlow2026" npm run seed:admin
```

> **Default Seed Accounts for Demonstration / Testing**:
> - **Administrator**: `admin@campusflow.edu` / `Admin@CampusFlow2026`
> - **Faculty**: `faculty.smith@campusflow.edu` / `Faculty@CampusFlow2026`
> - **Student**: `student.jane@campusflow.edu` / `Student@CampusFlow2026`

### 4. Running the Application

To run both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

- **Frontend Client**: Accessible at [http://localhost:5173](http://localhost:5173)
- **Backend API**: Accessible at [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Swagger API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🧪 Running Automated Tests

Run backend tests, concurrency checks, and frontend component tests:

```bash
# Run all tests
npm run test

# Run backend tests only (API, Auth, RBAC, Concurrency)
npm run test:backend

# Run frontend tests only (Vitest + React Testing Library)
npm run test:frontend
```

---

## 🛡️ Concurrency & Double-Booking Prevention Details

CampusFlow implements a deterministic **Slot Reservation Engine**:
1. All requested reservation intervals `[start, end]` are converted into discrete 30-minute intervals.
2. The `ReservationSlot` Mongoose collection enforces a compound unique index:
   ```javascript
   { resource: 1, date: 1, slotTime: 1 } -> UNIQUE
   ```
3. Attempting to book or approve a booking creates discrete slot documents in a single atomic database operation.
4. If two concurrent users attempt to book overlapping slots, MongoDB's unique key constraint causes one request to immediately fail with error code `11000` (Duplicate Key).
5. The application catches this error, rolls back unconfirmed slots, and returns `409 Conflict: One or more requested time slots are already booked`.

---

## 📄 License

This project is licensed under the ISC License.
