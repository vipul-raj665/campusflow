# CampusFlow — Master Project Handover & Technical Documentation Index

Welcome to the **CampusFlow** comprehensive project documentation and technical handover suite.

This repository contains the complete implementation, database schemas, API specifications, security architecture, and academic defense guides for **CampusFlow — Smart Campus Resource Booking & Management System**.

---

## 1. Documentation Index & Recommended Reading Order

Whether you are preparing for a viva examination, conducting a code review, writing an industrial training dissertation, or demonstrating the live software to examiners, read the documentation files in the following recommended order:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RECOMMENDED READING PATH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. docs/PROJECT_OVERVIEW.md                  ← Start Here (Concept & Roles) │
│ 2. docs/TECH_STACK_EXPLAINED.md              ← Deep-dive on MERN & Packages │
│ 3. docs/ARCHITECTURE_AND_DATA_FLOW.md        ← 3-Tier Architecture & Flows  │
│ 4. docs/DATABASE_DEEP_DIVE.md                ← Schemas, 9 Collections & ERD │
│ 5. docs/API_REFERENCE_DETAILED.md            ← All 33 REST API Endpoints    │
│ 6. docs/FRONTEND_WALKTHROUGH.md              ← React 18 SPA & 14 Views      │
│ 7. docs/BACKEND_CODE_WALKTHROUGH.md          ← Express, Services, Sockets   │
│ 8. docs/AUTHENTICATION_AND_SECURITY.md       ← Dual-Token, CSRF, RBAC       │
│ 9. docs/SETUP_AND_TROUBLESHOOTING.md         ← Local Setup, Seeds, Errors   │
│ 10. docs/TESTING_GUIDE.md                    ← 23 Tests & Concurrency Proof │
│ 11. docs/FEATURE_TRACEABILITY_MATRIX.md      ← Full-Stack Mapping Matrix    │
│ 12. docs/VIVA_QUESTIONS_AND_ANSWERS.md       ← 60+ Q&As & Viva Demo Script  │
│ 13. docs/INDUSTRIAL_TRAINING_REPORT_GUIDE.md ← Academic Report Material     │
│ 14. docs/GLOSSARY.md                         ← 45 Technical Definitions     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Summary Table

| Document Path | Document Title | Target Audience | Primary Contents |
| :--- | :--- | :--- | :--- |
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Project Overview & Business Value | Beginners, Evaluators | Problem statement, legacy manual booking flaws, digital workflow, role breakdowns, verified feature status. |
| [`docs/TECH_STACK_EXPLAINED.md`](docs/TECH_STACK_EXPLAINED.md) | Technology Stack Deep-Dive | Developers, Examiners | In-depth breakdown of MERN, Vite, Tailwind CSS, Zod, JWT, bcrypt, Socket.IO, Recharts, and architectural trade-offs. |
| [`docs/ARCHITECTURE_AND_DATA_FLOW.md`](docs/ARCHITECTURE_AND_DATA_FLOW.md) | Architecture & Request Lifecycle | Architects, Examiners | 3-tier architecture diagram, full 12-stage request lifecycle from button click to MongoDB write, Socket.IO pipeline. |
| [`docs/DATABASE_DEEP_DIVE.md`](docs/DATABASE_DEEP_DIVE.md) | Database Schemas & Data Model | Database Evaluators | Complete schema specifications for all 9 collections, compound indexes, sample JSON documents, and Mermaid ERD. |
| [`docs/API_REFERENCE_DETAILED.md`](docs/API_REFERENCE_DETAILED.md) | REST API Specification | API Developers | Full specification for all 33 REST endpoints across all 9 controllers with status codes, Zod validation, and payloads. |
| [`docs/FRONTEND_WALKTHROUGH.md`](docs/FRONTEND_WALKTHROUGH.md) | Frontend Code Walkthrough | Frontend Developers | React 18 SPA structure, Context API, Axios interceptors, route guards, and page-by-page walkthrough of all 14 views. |
| [`docs/BACKEND_CODE_WALKTHROUGH.md`](docs/BACKEND_CODE_WALKTHROUGH.md) | Backend Code Walkthrough | Backend Developers | Server startup, Express pipeline, middleware suite, discrete slot concurrency engine, notification & audit services. |
| [`docs/AUTHENTICATION_AND_SECURITY.md`](docs/AUTHENTICATION_AND_SECURITY.md) | Security Architecture | Security Evaluators | Dual-token session design (in-memory + HttpOnly cookie), SHA-256 token hashing, bcrypt, anti-CSRF, RBAC, rate limiting. |
| [`docs/SETUP_AND_TROUBLESHOOTING.md`](docs/SETUP_AND_TROUBLESHOOTING.md) | Setup & Troubleshooting Guide | Developers, DevOps | Step-by-step Windows setup, seeding commands, common errors (ports, MongoDB, Atlas firewall, CORS), cloud deployment. |
| [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) | Testing & Quality Assurance | QA Engineers | Analysis of 20 backend integration tests, 3 frontend component tests, concurrency race test mechanics, manual checklist. |
| [`docs/FEATURE_TRACEABILITY_MATRIX.md`](docs/FEATURE_TRACEABILITY_MATRIX.md) | Feature Traceability Matrix | Project Managers | End-to-end matrix mapping every feature: UI component → API endpoint → Controller/Service → Model → Test ID → Status. |
| [`docs/VIVA_QUESTIONS_AND_ANSWERS.md`](docs/VIVA_QUESTIONS_AND_ANSWERS.md) | Viva Q&A & Project Defense Guide | Students, Presenters | 60+ viva questions across 12 domains, 30s/2min/5min presentation scripts, 8-step live demo sequence, AI usage defense. |
| [`docs/INDUSTRIAL_TRAINING_REPORT_GUIDE.md`](docs/INDUSTRIAL_TRAINING_REPORT_GUIDE.md) | Academic Report Template | Students, Writers | Academic project report content: Title, Abstract, Problem Statement, Objectives, SRS, 8-Chapter dissertation structure. |
| [`docs/GLOSSARY.md`](docs/GLOSSARY.md) | Technical Glossary | Beginners, Students | 45 software engineering terms defined in simple English with CampusFlow-specific context. |

---

## 3. Quick Reference: Running the Application Locally

```bash
# 1. Install all dependencies across monorepo
npm run install:all

# 2. Seed database with demonstration data (Manan Sharma, Rajesh Rajan, Admin)
npm run seed

# 3. Launch both backend API and frontend Vite servers concurrently
npm run dev

# 4. Execute all 23 automated tests
npm test
```

### Access URLs:
- **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health & Uptime Probe:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Interactive Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 4. Default Seeded Demonstration Credentials

| Role | Person / Account Name | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | **Manan Sharma** | `student.manan@campusflow.edu` | `Student@CampusFlow2026` | Browse catalog, check availability, book facilities, view personal history, cancel reservations. |
| **Faculty** | **Prof. Rajesh Rajan** | `faculty.rajan@campusflow.edu` | `Faculty@CampusFlow2026` | Higher booking duration allowances, priority departmental reservations, personal booking management. |
| **Administrator** | **Campus Admin** | `admin@campusflow.edu` | `Admin@CampusFlow2026` | Review approval queue, approve/reject requests, manage resources, schedule maintenance, view analytics, export audit logs. |

---

## 5. Summary of Engineering Highlights

1. **Race-Safe Concurrency Engine:** Eliminates double-booking conflicts by discretizing reservations into 30-minute blocks in `ReservationSlot` under a unique compound index `{ resource: 1, date: 1, slotTime: 1 }`. Confirmed by automated concurrency test.
2. **Dual-Token Security Architecture:** Protects against XSS disk harvesting by retaining short-lived 15-minute Access Tokens in JavaScript memory while maintaining long-lived 7-day rotating Refresh Tokens in secure `HttpOnly` browser cookies.
3. **Bi-Directional Real-Time Synchronization:** Pushes instant notifications and alert badge updates through authenticated Socket.IO rooms (`user:<userId>` and `role:admin`).
4. **Comprehensive Test Suite:** 23 passing tests (20 backend integration + 3 frontend component) with zero test failures.
5. **Turnkey Cloud Deployment:** Includes Infrastructure-as-Code blueprints for Render (`render.yaml`) and Railway (`railway.json`).
