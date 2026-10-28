# CampusFlow — Frontend Architecture & Page Walkthrough

## 1. Frontend Structure & Application Shell

The frontend is a single-page application (SPA) built with **React 18**, **Vite**, **Tailwind CSS**, and **React Router v6**.

```
frontend/src/
├── main.jsx                     # Vite DOM mount point
├── App.jsx                      # Route definitions & layout wrappers
├── index.css                    # Tailwind directives & design tokens
├── setupTests.js                # JSDOM matchMedia & testing environment
├── components/
│   └── common/
│       ├── Badge.jsx            # Multi-variant status pill (pending, approved, student, etc.)
│       ├── LoadingSpinner.jsx   # Consistent loading indicator
│       └── Modal.jsx            # Accessible overlay dialog with escape key & backdrop click
├── context/
│   ├── AuthContext.jsx          # Session state, login, signup, logout, session restoration
│   ├── ToastContext.jsx         # Ephemeral toast notifications (success, error, info)
│   └── NotificationContext.jsx  # Unread badge counters & real-time Socket.IO listeners
├── layouts/
│   ├── PublicLayout.jsx         # Public navigation header & footer
│   ├── DashboardLayout.jsx      # Authenticated sidebar navigation & top banner
│   └── ProtectedRoute.jsx       # Client-side role authorization & route guard
├── pages/
│   ├── public/                  # LandingPage, ResourcesPage, ResourceDetailPage
│   ├── auth/                    # LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage
│   ├── student/                 # StudentDashboard
│   ├── booking/                 # MyBookingsPage, BookingDetailPage
│   ├── admin/                   # AdminDashboard, AdminResourcesPage, AdminBookingsPage,
│   │                            # AdminMaintenancePage, AdminUsersPage, AdminAuditLogsPage,
│   │                            # AdminReportsPage
│   └── notifications/           # NotificationsPage
└── services/
    ├── api.js                   # Axios instance, token interceptor, anti-CSRF injection
    └── socket.js                # Socket.IO connection manager & channel subscription
```

---

## 2. Navigation Layouts & Route Protection

### 2.1 `ProtectedRoute.jsx` (`frontend/src/layouts/ProtectedRoute.jsx`)
Guards private routes against unauthenticated or unauthorized users:
- **Loading State**: If `AuthContext.loading` is `true` (waiting for session restoration handshake), renders `<LoadingSpinner size="lg" text="Authenticating session..." />`.
- **Unauthenticated**: If `!isAuthenticated`, redirects to `/login`, saving the requested path in `state.from` for post-login redirect.
- **Unauthorized Role**: If `allowedRoles` does not include `user.role`, redirects the user to their permitted home dashboard (`/admin/dashboard`, `/faculty/dashboard`, or `/student/dashboard`).

### 2.2 `DashboardLayout.jsx` (`frontend/src/layouts/DashboardLayout.jsx`)
Wraps all internal authenticated views:
- **Responsive Sidebar**: Collapsible mobile drawer with backdrop overlay; fixed desktop sidebar.
- **Access Scope Badge**: Visual pill displaying current privilege tier (`STUDENT PORTAL`, `FACULTY PORTAL`, `ADMIN PORTAL`).
- **Dynamic Navigation Links**:
  - Student/Faculty: Overview (`/student/dashboard`), Facility Catalog (`/resources`), My Bookings (`/bookings`), Notifications (`/notifications`).
  - Administrator: System Analytics (`/admin/dashboard`), Approvals Queue (`/admin/bookings`), Facility Inventory (`/admin/resources`), Maintenance (`/admin/maintenance`), User Accounts (`/admin/users`), Audit Logs (`/admin/audit-logs`), Reports (`/admin/reports`).
- **Notification Dropdown**: Bell icon with unread badge counter showing real-time alerts.

---

## 3. Page-by-Page Walkthrough

### 3.1 Public Landing Page (`LandingPage.jsx`)
- **Route**: `/` | **Access**: Public.
- **Purpose**: Welcomes visitors, introduces the platform, showcases featured facilities, and provides one-click quick demo login buttons.
- **Key Interactions**:
  - **Quick Demo Launchers**: Instant login buttons for Administrator (`admin@campusflow.edu`), Faculty (`faculty.rajan@campusflow.edu`), and Student (`student.manan@campusflow.edu`).
  - **Featured Grid**: Calls `GET /resources?limit=4` and displays cards with capacity, building, and category tags.
- **States Handled**: Skeleton loader while loading facilities; network error fallback.

### 3.2 Facility Catalog (`ResourcesPage.jsx`)
- **Route**: `/resources` | **Access**: Public / Authenticated.
- **Purpose**: Searchable, filterable directory of all campus rooms and equipment.
- **Key Interactions**:
  - **Live Filter Bar**: Filter by category (`computer_lab`, `science_lab`, `seminar_hall`, etc.), building name, or minimum capacity.
  - **Search Input**: Full-text keyword search debounced to the URL search params.
  - **Pagination Controls**: Previous/Next navigation with page count indicators.
- **Endpoints Called**: `GET /api/v1/resources?search=...&type=...&page=...`.

### 3.3 Resource Detail & Booking Page (`ResourceDetailPage.jsx`)
- **Route**: `/resources/:id` | **Access**: Public viewing, Authenticated booking.
- **Purpose**: Comprehensive view of a facility with real-time 30-minute slot visualizer and interactive reservation form.
- **Key Interactions**:
  - **Interactive Slot Grid**: Calls `GET /api/v1/resources/:id/availability?date=YYYY-MM-DD`. Free slots display green; occupied/held slots display muted grey. Clicking a free slot automatically populates start and end times in the booking form.
  - **Booking Submission**: Submits `POST /api/v1/bookings`. On success, opens a confirmation dialog showing the unique booking identifier (`BK-YYYYMMDD-XXXX`).
  - **Role Enforcement**: If a student attempts to book a faculty-restricted resource, the form displays an inline badge: *"Restricted: Faculty / Admin Only"*.

### 3.4 Student & Faculty Dashboard (`StudentDashboard.jsx`)
- **Route**: `/student/dashboard` & `/faculty/dashboard` | **Access**: Student & Faculty.
- **Purpose**: Personal command center tracking reservations, approval states, and upcoming schedules.
- **Key Components**:
  - **Metric KPI Cards**: Approved bookings count, pending review count, cancelled count.
  - **Upcoming Schedule Table**: Displays approved bookings with date, time, building, and room number.
  - **Quick Actions**: "Book New Facility" button linking to `/resources`.
- **Endpoints Called**: `GET /api/v1/analytics/user-stats`.

### 3.5 My Bookings Page (`MyBookingsPage.jsx`)
- **Route**: `/bookings` | **Access**: Authenticated.
- **Purpose**: Complete personal history of reservations.
- **Key Interactions**:
  - **Status Tabs**: Filter by `All`, `Pending Review`, `Approved`, `Cancelled`, `Rejected`.
  - **Cancellation Modal**: Users can cancel pending or approved bookings. Prompts for an optional reason and releases reservation slots immediately.
- **Endpoints Called**: `GET /api/v1/bookings/my`, `PATCH /api/v1/bookings/:id/cancel`.

### 3.6 Administrator Dashboard (`AdminDashboard.jsx`)
- **Route**: `/admin/dashboard` | **Access**: Admin only.
- **Purpose**: Institutional analytics, queue metrics, and facility utilization graphs.
- **Visualizations (Recharts)**:
  - **Daily Reservations Trend Line**: 7-day volume chart.
  - **Bookings by Department Bar Chart**: Compares utilization across Computer Science, Electrical, Physics, etc.
  - **Facility Type Distribution Pie Chart**: Distribution of computer labs vs. seminar halls vs. equipment.
  - **Top 5 Booked Facilities**: Ranked list of highest-demand campus assets.
- **Endpoints Called**: `GET /api/v1/analytics/dashboard`.

### 3.7 Admin Approvals Queue (`AdminBookingsPage.jsx`)
- **Route**: `/admin/bookings` | **Access**: Admin only.
- **Purpose**: Primary operational queue for processing facility requests.
- **Key Interactions**:
  - **Approve Button**: Calls `PATCH /bookings/:id/approve`. Instantly transitions status to `approved`, confirms database slots, and emits Socket.IO alert.
  - **Reject Button**: Opens rejection dialog requiring an institutional justification (e.g. "Reserved for Syndicate Meeting"). Calls `PATCH /bookings/:id/reject`, releases held slots, and notifies user.

### 3.8 Admin Resource Inventory (`AdminResourcesPage.jsx`)
- **Route**: `/admin/resources` | **Access**: Admin only.
- **Purpose**: Complete CRUD management of campus facilities.
- **Key Interactions**: Add facility modal, edit parameters, toggle status (`active` / `maintenance` / `inactive`), adjust capacity, operating hours, and role permissions.
- **Endpoints Called**: `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id`.

### 3.9 Admin Maintenance Page (`AdminMaintenancePage.jsx`)
- **Route**: `/admin/maintenance` | **Access**: Admin only.
- **Purpose**: Schedule shutdowns and repairs. Automatically detects and cancels conflicting reservations.
- **Endpoints Called**: `POST /maintenance`, `GET /maintenance`, `PATCH /maintenance/:id/cancel`.

### 3.10 Admin User Accounts (`AdminUsersPage.jsx`)
- **Route**: `/admin/users` | **Access**: Admin only.
- **Purpose**: Manage student and faculty accounts.
- **Key Interactions**: Role elevation modal (`student` -> `faculty` -> `admin`), account suspension toggle (`isActive: true/false`). Prevents administrators from demoting or suspending themselves.

### 3.11 Admin Audit Trail (`AdminAuditLogsPage.jsx`)
- **Route**: `/admin/audit-logs` | **Access**: Admin only.
- **Purpose**: Searchable, filterable security log of all administrative decisions with actor IP addresses and timestamps.

### 3.12 Admin Reports & CSV Export (`AdminReportsPage.jsx`)
- **Route**: `/admin/reports` | **Access**: Admin only.
- **Purpose**: Generates and downloads certified operational CSV ledgers for institutional reporting.
- **Endpoints Called**: `GET /analytics/export/bookings`, `GET /analytics/export/utilization`.
