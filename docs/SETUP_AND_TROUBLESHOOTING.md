# CampusFlow — Local Setup, Deployment & Troubleshooting Guide

This guide provides step-by-step instructions for configuring, installing, running, and troubleshooting the **CampusFlow** web application across local development environments and cloud production platforms.

---

## 1. System Prerequisites

Ensure the following tools are installed on your workstation before starting:

| Tool | Recommended Version | Verification Command | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.x` or `v20.x` LTS | `node -v` | JavaScript runtime environment |
| **npm** | `v9.x` or `v10.x` | `npm -v` | Node package manager |
| **MongoDB** | `v6.x` or `v7.x` (or Atlas Cluster) | `mongod --version` | NoSQL document database |
| **Git** | `v2.30+` | `git --version` | Version control |

---

## 2. Project Architecture & Directory Layout

CampusFlow is organized as an integrated monorepo:

```
campusflow/
├── backend/                  # Express REST API, Mongoose Models, Socket.IO
│   ├── .env.example          # Sample environment variables for backend
│   └── package.json          # Backend dependencies and scripts
├── frontend/                 # React 18 SPA powered by Vite & Tailwind CSS
│   ├── .env.example          # Sample environment variables for frontend
│   └── package.json          # Frontend dependencies and scripts
├── docs/                     # Comprehensive architectural documentation
├── render.yaml               # Render Cloud Blueprint deployment spec
├── railway.json              # Railway Cloud configuration
└── package.json              # Monorepo root orchestrating concurrently & scripts
```

---

## 3. Environment Variable Configuration

CampusFlow requires separate environment configuration files for the backend and frontend.

### Step 1: Backend Environment Configuration (`backend/.env`)
Create a file named `.env` inside the `backend/` directory:

```ini
# Server Execution Environment
PORT=5000
NODE_ENV=development

# Database Connection (Local MongoDB Service)
MONGODB_URI=mongodb://127.0.0.1:27017/campusflow
# For MongoDB Atlas (Cloud), use:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/campusflow?retryWrites=true&w=majority

# JWT Token Secrets (Replace with high-entropy random strings)
JWT_ACCESS_SECRET=campusflow_super_secret_jwt_access_key_2026_secure
JWT_ACCESS_EXPIRES_IN=15m

# Cookie & Session Configuration
COOKIE_SECRET=campusflow_signed_cookie_secret_key_2026_secure
COOKIE_MAX_AGE_DAYS=7

# Allowed Client Origin for CORS
CLIENT_ORIGIN=http://localhost:5173

# Optional Transactional Email (Omit for Dev Console Logging)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@campusflow.edu
# SMTP_PASS=your-app-password
# SMTP_FROM="CampusFlow Notifications <notifications@campusflow.edu>"
```

### Step 2: Frontend Environment Configuration (`frontend/.env`)
Create a file named `.env` inside the `frontend/` directory:

```ini
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api/v1

# Real-Time WebSocket Base URL
VITE_SOCKET_URL=http://localhost:5000
```

---

## 4. Installation & Database Seeding

Open your terminal in the root `campusflow/` workspace:

### Step 1: Install All Dependencies
Execute the monorepo installation script, which installs root, backend, and frontend packages in parallel:

```bash
npm run install:all
```

### Step 2: Seed Demonstration Data
Ensure your MongoDB service is running (or your Atlas URI is configured), then populate the database with realistic sample facilities, user accounts, and reservations:

```bash
npm run seed
```

This populates:
- **Administrator**: `admin@campusflow.edu` / `Admin@CampusFlow2026`
- **Faculty Member**: `faculty.rajan@campusflow.edu` (Prof. Rajesh Rajan) / `Faculty@CampusFlow2026`
- **Student**: `student.manan@campusflow.edu` (Manan Sharma) / `Student@CampusFlow2026`
- **6 Diverse Resources**: Main Auditorium, Robotics Lab, Seminar Hall A, Mac Studio, Conference Room 101, IoT Research Lab.
- Realistic sample bookings, slot reservations, and maintenance schedules.

### Step 3 (Optional): Provision Custom Administrator
To create a custom administrator account interactively via CLI:

```bash
node backend/src/utils/provisionAdmin.js "Dr. A. Sharma" "admin.sharma@campusflow.edu" "SuperSecurePass123!" "Computer Science"
```

---

## 5. Running the Application Locally

Start both the backend API server and the Vite development server with a single command from the project root:

```bash
npm run dev
```

### Active Application Endpoints

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:5173` | React Single-Page Application |
| **Backend REST API** | `http://localhost:5000/api/v1` | Express API Version 1 |
| **API Health Probe** | `http://localhost:5000/api/v1/health` | Uptime, database status, and memory stats |
| **Interactive Swagger Docs**| `http://localhost:5000/api/docs` | OpenAPI 3.0 Interactive Testing Console |

---

## 6. Running Automated Tests

CampusFlow includes full-stack test suites for both backend integration and frontend components:

```bash
# Run all 23 backend and frontend tests
npm test

# Run backend integration tests only
npm run test:backend

# Run frontend React tests only
npm run test:frontend
```

---

## 7. Common Troubleshooting Scenarios & Solutions

### Scenario 1: Port 5000 or 5173 Already in Use (`EADDRINUSE`)
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`
- **Cause**: A previous server instance is still running in the background.
- **Resolution (Windows PowerShell)**:
  ```powershell
  # Find PID using port 5000
  netstat -ano | findstr :5000
  # Terminate the process (replace <PID> with the actual process ID)
  Stop-Process -Id <PID> -Force
  ```
- **Resolution (macOS / Linux)**:
  ```bash
  lsof -ti:5000 | xargs kill -9
  ```

---

### Scenario 2: MongoDB Connection Refused (`ECONNREFUSED 127.0.0.1:27017`)
- **Symptom**: `[Database Error] Connection failed: connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: The local MongoDB service is not started.
- **Resolution (Windows)**:
  ```powershell
  # Start Windows MongoDB Service
  net start MongoDB
  # Or start daemon directly
  mongod --dbpath "C:\data\db"
  ```
- **Resolution (macOS with Homebrew)**:
  ```bash
  brew services start mongodb-community
  ```
- **Resolution (Linux / Ubuntu)**:
  ```bash
  sudo systemctl start mongod
  ```

---

### Scenario 3: MongoDB Atlas IP Access List Blocking (`MongoServerSelectionError`)
- **Symptom**: Server runs, but queries time out with `MongoServerSelectionError: connection timed out`.
- **Cause**: MongoDB Atlas firewall blocks inbound traffic from your current IP address.
- **Resolution**:
  1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com/).
  2. Navigate to **Network Access** in the left sidebar.
  3. Click **Add IP Address**.
  4. Select **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current public IP address.
  5. Wait 60 seconds for the firewall rules to deploy and restart the backend.

---

### Scenario 4: Cross-Origin Request Blocked (CORS Error)
- **Symptom**: Browser console displays `Access to XMLHttpRequest has been blocked by CORS policy`.
- **Cause**: The frontend is sending requests from an origin that does not match `CLIENT_ORIGIN` in `backend/.env`.
- **Resolution**:
  - Open `backend/.env` and verify `CLIENT_ORIGIN=http://localhost:5173`.
  - For multi-client setups, provide a comma-separated list: `CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000`.
  - Note: CampusFlow's dynamic CORS middleware in `backend/src/app.js` automatically allows `localhost`, `127.0.0.1`, `*.onrender.com`, `*.up.railway.app`, and `*.vercel.app`.

---

### Scenario 5: Missing Refresh Cookie on Cross-Origin Cloud Deployments
- **Symptom**: User logs in successfully, but hard refreshing the browser logs them out immediately.
- **Cause**: Modern browsers block third-party cookies if `SameSite=None` is set without `Secure=true`, or when cross-site tracking prevention is enabled.
- **Resolution**:
  - Ensure `NODE_ENV=production` on your cloud server. This automatically sets `secure: true` and `sameSite: 'none'` on the refresh token cookie.
  - Recommended Production Topology: Deploy the frontend and backend under the same parent domain (e.g., `app.campusflow.edu` and `api.campusflow.edu`) so the cookie operates as a first-party cookie.

---

## 8. Cloud Deployment Guide

### Deploying to Render via Blueprint (`render.yaml`)

CampusFlow includes a turnkey Infrastructure-as-Code blueprint (`render.yaml`):

```yaml
services:
  # 1. Backend Express Web Service
  - type: web
    name: campusflow-backend
    runtime: node
    plan: free
    region: oregon
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_ACCESS_SECRET
        generateValue: true
      - key: COOKIE_SECRET
        generateValue: true
      - key: CLIENT_ORIGIN
        sync: false

  # 2. Frontend React Static Site
  - type: web
    name: campusflow-frontend
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        sync: false
      - key: VITE_SOCKET_URL
        sync: false
```

#### Steps to Deploy on Render:
1. Push your repository to GitHub: `git push origin main`.
2. Open your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Select your GitHub repository (`campusflow`).
4. Render detects `render.yaml` automatically and configures both services.
5. In the environment setup screen, provide:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `CLIENT_ORIGIN`: The URL assigned to your frontend static site (e.g. `https://campusflow-frontend.onrender.com`).
   - `VITE_API_URL`: The URL assigned to your backend web service + `/api/v1` (e.g. `https://campusflow-backend.onrender.com/api/v1`).
   - `VITE_SOCKET_URL`: The root backend URL (e.g. `https://campusflow-backend.onrender.com`).
6. Click **Apply**. Render builds the React application into static assets and launches the Node.js API container.

---

### Deploying to Railway (`railway.json`)

1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Add a **MongoDB** plugin database or connect your Atlas database via environment variable `MONGODB_URI`.
3. Set the Root Directory to `/` and start command to `npm run build && npm start`.
4. Railway detects `backend/src/server.js` and serves both the API and the static React bundle from port 5000.
