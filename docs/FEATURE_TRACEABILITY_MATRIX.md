# CampusFlow — Feature Traceability Matrix

This document provides a comprehensive full-stack traceability matrix mapping every feature of **CampusFlow** across the user interface, routing layer, controllers, services, database models, security guards, automated tests, and implementation verification statuses.

---

## 1. Traceability Matrix Legend

- **Status:**
  - `VERIFIED`: Implemented in source code and verified with passing automated test or runtime verification.
  - `IMPLEMENTED`: Implemented in source code and functional, pending dedicated unit test.
  - `PARTIAL`: Core framework implemented, advanced features planned.
  - `PLANNED`: Documented in architectural roadmap for future releases.

---

## 2. Complete End-to-End Traceability Matrix

| Feature ID | Feature Name | Permitted Roles | Frontend Component / Page | HTTP API Endpoint | Backend Controller & Service | Mongoose Models | Middleware & Guards | Automated Test Reference | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Public User Registration | Public | `RegisterPage.jsx` | `POST /api/v1/auth/signup` | `authController.signup` | `User`, `RefreshToken` | `authLimiter`, `validate(signupSchema)` | `api.test.js` (Test 2, 3) | `VERIFIED` |
| **AUTH-02** | Anti-Privilege Escalation | Public | `RegisterPage.jsx` | `POST /api/v1/auth/signup` | `authController.signup` | `User` | `validate(signupSchema)` | `api.test.js` (Test 4) | `VERIFIED` |
| **AUTH-03** | User Authentication (Login) | Public | `LoginPage.jsx` | `POST /api/v1/auth/login` | `authController.login` | `User`, `RefreshToken` | `authLimiter`, `validate(loginSchema)` | `api.test.js` (Test 5) | `VERIFIED` |
| **AUTH-04** | Session Refresh & Token Rotation | Authenticated | `api.js` (Axios Interceptor) | `POST /api/v1/auth/refresh` | `authController.refreshSession` | `RefreshToken`, `User` | `csrfProtection` | Runtime Verified | `VERIFIED` |
| **AUTH-05** | User Session Termination (Logout) | Authenticated | `Navbar.jsx`, `AuthContext.jsx` | `POST /api/v1/auth/logout` | `authController.logout` | `RefreshToken` | `csrfProtection` | Runtime Verified | `VERIFIED` |
| **AUTH-06** | Profile Resolution | Authenticated | `AuthContext.jsx`, `ProfilePage.jsx` | `GET /api/v1/auth/me` | `authController.getMe` | `User` | `authenticate` | `api.test.js` (Test 6, 7) | `VERIFIED` |
| **AUTH-07** | Password Reset Request | Public | `ForgotPasswordPage.jsx` | `POST /api/v1/auth/forgot-password` | `authController.forgotPassword`, `emailService` | `PasswordResetToken`, `User` | `authLimiter`, `validate` | Runtime Verified | `VERIFIED` |
| **AUTH-08** | Password Reset Execution | Public | `ResetPasswordPage.jsx` | `POST /api/v1/auth/reset-password` | `authController.resetPassword` | `PasswordResetToken`, `User`, `RefreshToken` | `authLimiter`, `validate` | Runtime Verified | `VERIFIED` |
| **RESC-01** | Resource Catalog Browsing | Public / All | `ResourcesPage.jsx` | `GET /api/v1/resources` | `resourceController.getResources` | `Resource` | Public / None | `api.test.js` (Test 8) | `VERIFIED` |
| **RESC-02** | Real-Time Slot Availability | Public / All | `ResourceDetailPage.jsx`, `SlotPicker.jsx` | `GET /api/v1/resources/:id/availability` | `resourceController.getAvailability`, `slotService` | `Resource`, `ReservationSlot` | Public / None | `api.test.js` (Test 11) | `VERIFIED` |
| **RESC-03** | Administrative Resource Creation | Admin | `AdminResourcesPage.jsx` | `POST /api/v1/resources` | `resourceController.createResource`, `auditService` | `Resource`, `AuditLog` | `authenticate`, `authorize('admin')`, `validate` | `api.test.js` (Test 9, 10) | `VERIFIED` |
| **RESC-04** | Resource Detail Modification | Admin | `AdminResourcesPage.jsx` | `PUT /api/v1/resources/:id` | `resourceController.updateResource`, `auditService` | `Resource`, `AuditLog` | `authenticate`, `authorize('admin')`, `validate` | Runtime Verified | `VERIFIED` |
| **RESC-05** | Resource Decommissioning | Admin | `AdminResourcesPage.jsx` | `DELETE /api/v1/resources/:id` | `resourceController.deleteResource`, `auditService` | `Resource`, `AuditLog` | `authenticate`, `authorize('admin')` | Runtime Verified | `VERIFIED` |
| **BOOK-01** | Booking Request Submission | Student, Faculty, Admin | `ResourceDetailPage.jsx`, `BookingModal.jsx` | `POST /api/v1/bookings` | `bookingController.createBooking`, `slotService`, `notificationService` | `Booking`, `ReservationSlot`, `Notification`, `AuditLog` | `authenticate`, `validate` | `api.test.js` (Test 12) | `VERIFIED` |
| **BOOK-02** | Race-Safe Overlap Rejection | Student, Faculty, Admin | `ResourceDetailPage.jsx` | `POST /api/v1/bookings` | `slotService.reserveSlots` | `ReservationSlot` | Compound Unique Index | `api.test.js` (Test 13, 14) | `VERIFIED` |
| **BOOK-03** | User Booking History | Student, Faculty, Admin | `MyBookingsPage.jsx` | `GET /api/v1/bookings/my` | `bookingController.getMyBookings` | `Booking` | `authenticate` | Runtime Verified | `VERIFIED` |
| **BOOK-04** | Booking Details Lookup | Owner, Admin | `BookingDetailPage.jsx` | `GET /api/v1/bookings/:id` | `bookingController.getBookingById` | `Booking` | `authenticate`, Ownership Check | Runtime Verified | `VERIFIED` |
| **BOOK-05** | Booking Cancellation | Owner, Admin | `MyBookingsPage.jsx`, `BookingDetailPage.jsx` | `PATCH /api/v1/bookings/:id/cancel` | `bookingController.cancelBooking`, `slotService`, `auditService` | `Booking`, `ReservationSlot`, `AuditLog`, `Notification` | `authenticate`, Ownership Check | `api.test.js` (Test 16) | `VERIFIED` |
| **BOOK-06** | Admin Pending Approval Queue | Admin | `AdminBookingsPage.jsx` | `GET /api/v1/bookings/admin/queue` | `bookingController.getAdminQueue` | `Booking` | `authenticate`, `authorize('admin')` | Runtime Verified | `VERIFIED` |
| **BOOK-07** | Admin Booking Approval | Admin | `AdminBookingsPage.jsx` | `PATCH /api/v1/bookings/:id/approve` | `bookingController.approveBooking`, `slotService`, `notificationService` | `Booking`, `ReservationSlot`, `AuditLog`, `Notification` | `authenticate`, `authorize('admin')` | `api.test.js` (Test 15) | `VERIFIED` |
| **BOOK-08** | Admin Booking Rejection | Admin | `AdminBookingsPage.jsx` | `PATCH /api/v1/bookings/:id/reject` | `bookingController.rejectBooking`, `slotService`, `notificationService` | `Booking`, `ReservationSlot`, `AuditLog`, `Notification` | `authenticate`, `authorize('admin')`, `validate` | Runtime Verified | `VERIFIED` |
| **MAINT-01**| Maintenance Schedule Creation | Admin | `AdminMaintenancePage.jsx` | `POST /api/v1/maintenance` | `maintenanceController.createMaintenance`, `slotService` | `Maintenance`, `ReservationSlot`, `Booking` | `authenticate`, `authorize('admin')`, `validate` | `api.test.js` (Test 17) | `VERIFIED` |
| **MAINT-02**| Conflicting Booking Eviction | System / Admin | Automated | `POST /api/v1/maintenance` | `maintenanceController.createMaintenance` | `Booking`, `Notification` | System Workflow | `api.test.js` (Test 17) | `VERIFIED` |
| **MAINT-03**| Maintenance Listing & History | Admin | `AdminMaintenancePage.jsx` | `GET /api/v1/maintenance` | `maintenanceController.getMaintenance` | `Maintenance` | `authenticate`, `authorize('admin')` | Runtime Verified | `VERIFIED` |
| **NOTIF-01**| WebSocket Real-Time Alerts | All Authenticated | `Navbar.jsx`, `NotificationBell.jsx` | WebSocket `notification:new` | `socketHandler.js`, `notificationService` | In-Memory / WebSocket | Handshake JWT Authentication | Runtime Verified | `VERIFIED` |
| **NOTIF-02**| User Notification Inbox | All Authenticated | `NotificationsPage.jsx` | `GET /api/v1/notifications` | `notificationController.getNotifications` | `Notification` | `authenticate` | Runtime Verified | `VERIFIED` |
| **NOTIF-03**| Notification Read Acknowledgement| All Authenticated | `NotificationsPage.jsx` | `PATCH /api/v1/notifications/:id/read` | `notificationController.markAsRead` | `Notification` | `authenticate` | Runtime Verified | `VERIFIED` |
| **ANALYT-01**| Administrative KPI Dashboard | Admin | `AdminAnalyticsPage.jsx` | `GET /api/v1/analytics/dashboard` | `analyticsController.getDashboardStats` | `Booking`, `Resource`, `ReservationSlot` | `authenticate`, `authorize('admin')` | `api.test.js` (Test 18) | `VERIFIED` |
| **ANALYT-02**| Bookings CSV Export | Admin | `AdminAnalyticsPage.jsx` | `GET /api/v1/analytics/export/bookings` | `analyticsController.exportBookingsCSV` | `Booking` | `authenticate`, `authorize('admin')` | `api.test.js` (Test 19, 20) | `VERIFIED` |
| **AUDIT-01**| Immutable Audit Log Query | Admin | `AdminAuditPage.jsx` | `GET /api/v1/audit` | `auditController.getAuditLogs` | `AuditLog` | `authenticate`, `authorize('admin')` | Runtime Verified | `VERIFIED` |
| **AUDIT-02**| Audit Logs CSV Export | Admin | `AdminAuditPage.jsx` | `GET /api/v1/audit/export` | `auditController.exportAuditCSV` | `AuditLog` | `authenticate`, `authorize('admin')` | Runtime Verified | `VERIFIED` |
| **USER-01** | Administrative User Directory | Admin | `AdminUsersPage.jsx` | `GET /api/v1/users` | `userController.getUsers` | `User` | `authenticate`, `authorize('admin')` | Runtime Verified | `VERIFIED` |
| **USER-02** | User Role Modification | Admin | `AdminUsersPage.jsx` | `PATCH /api/v1/users/:id/role` | `userController.updateUserRole`, `auditService` | `User`, `AuditLog` | `authenticate`, `authorize('admin')`, `validate` | Runtime Verified | `VERIFIED` |
| **USER-03** | User Account Deactivation | Admin | `AdminUsersPage.jsx` | `PATCH /api/v1/users/:id/status` | `userController.toggleUserStatus`, `auditService` | `User`, `AuditLog` | `authenticate`, `authorize('admin')`, `validate` | Runtime Verified | `VERIFIED` |
| **UI-01**   | Landing Page Persona Demo | Public | `LandingPage.jsx` | Client-Side State | Client-Side Pre-population | N/A | React Router | `App.test.jsx` (Test 1, 2, 3) | `VERIFIED` |
| **EXT-01**  | IoT Smart Lock Integration | System | Physical Lock Controller | Planned REST / MQTT Endpoint | Future Service | Future Model | Hardware Bridge | N/A | `PLANNED` |
| **EXT-02**  | Native Mobile Application | Student, Faculty | Mobile App Store | Future Mobile Client | Existing REST Endpoints | Existing Models | Existing JWT Auth | N/A | `PLANNED` |
