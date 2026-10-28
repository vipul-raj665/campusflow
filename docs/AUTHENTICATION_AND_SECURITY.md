# CampusFlow — Authentication & Security Architecture

This document provides a comprehensive analysis of the security posture, authentication patterns, session lifecycle, authorization guards, and defense-in-depth mechanisms implemented across the **CampusFlow** platform.

---

## 1. Authentication Philosophy: Dual-Token Architecture

Many web applications store authentication tokens in `localStorage`. While convenient, `localStorage` is completely accessible to any JavaScript running on the page, making tokens vulnerable to Cross-Site Scripting (XSS) attacks. If an attacker injects a malicious script, they can harvest access tokens from `localStorage` and impersonate users indefinitely.

CampusFlow solves this vulnerability by implementing a **Dual-Token System** combining short-lived in-memory Access Tokens with long-lived HttpOnly Refresh Tokens.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Client Browser                                                         │
│                                                                        │
│  ┌─────────────────────────┐             ┌──────────────────────────┐  │
│  │ In-Memory Access Token  │             │ HttpOnly Session Cookie  │  │
│  │ (15 Minutes Lifespan)   │             │ (7 Days Lifespan)        │  │
│  │ Stored in JS Closure /  │             │ Stored in Browser Cookie │  │
│  │ AuthContext             │             │ Jar with HttpOnly &      │  │
│  │                         │             │ SameSite Protection      │  │
│  │ * Immune to XSS Disk    │             │ * Inaccessible to JS     │  │
│  │   Harvesting            │             │ * Immune to XSS Theft    │  │
│  └───────────┬─────────────┘             └─────────────┬────────────┘  │
└──────────────┼─────────────────────────────────────────┼───────────────┘
               │ Bearer Token in                         │ Automatic Cookie
               │ Authorization Header                    │ on /api/v1/auth/refresh
               ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Express Server Authentication Pipeline                                 │
│                                                                        │
│  1. `authenticate` Middleware          2. `refreshSession` Controller  │
│     - Verifies JWT Signature              - Checks Anti-CSRF Header    │
│     - Validates Expiration                - Hashes incoming token      │
│     - Loads User from DB                  - Verifies not revoked       │
│     - Verifies `isActive === true`        - Revokes old token          │
│                                           - Issues new token pair      │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Token Comparison

| Property | Short-Lived Access Token | Long-Lived Refresh Token |
| :--- | :--- | :--- |
| **Token Format** | Signed JSON Web Token (JWT) | Cryptographically secure 40-byte random hex string |
| **Expiration** | 15 minutes (`config.jwt.accessExpiresIn`) | 7 days (`config.cookie.maxAge`) |
| **Storage Location** | Browser React state / memory closure | Browser Cookie Jar (`httpOnly: true`) |
| **Vulnerability Protection** | Cannot be stolen from `localStorage` or `sessionStorage` | Inaccessible to JavaScript; cannot be read by XSS |
| **Database Storage** | Stateless (not stored in database) | Stored as **SHA-256 hash** in `RefreshToken` collection |
| **Rotation Policy** | Re-issued on demand via refresh endpoint | **Rotated on every use**; old token revoked immediately |

---

## 2. Token Storage and Cryptographic Hashing

### Database Leak Protection
In many systems, refresh tokens or password reset tokens are saved in plain text in the database. If an unauthorized party gains access to a database backup, every active session can be hijacked.

CampusFlow protects against this by applying **one-way SHA-256 hashing** before persisting any token:

```javascript
// backend/src/controllers/authController.js
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
```

- When the server generates a 40-byte random refresh token:
  1. The raw string is sent to the client browser inside an HttpOnly cookie.
  2. Only the SHA-256 digest (`tokenHash`) is written to the `RefreshToken` collection in MongoDB.
- When the client requests a session refresh:
  1. Express receives the raw cookie.
  2. The server hashes the incoming token with SHA-256.
  3. It performs a lookup on `tokenHash`.
- **Security Guarantee:** Even with a full database dump, an attacker cannot recover the raw refresh tokens needed to authenticate.

---

## 3. Refresh Token Rotation & Reuse Detection

To prevent token replay and replay attacks, CampusFlow enforces strict **Single-Use Token Rotation**:

1. **Exchange**: When `/api/v1/auth/refresh` is called, the current token record is looked up.
2. **Verification**: The server checks that `isRevoked === false` and `expiresAt > Date.now()`.
3. **Invalidation**: The existing token record is updated with:
   ```javascript
   tokenRecord.isRevoked = true;
   tokenRecord.replacedByTokenHash = newTokenHash;
   await tokenRecord.save();
   ```
4. **Issuance**: A brand new refresh token is created in MongoDB and set in the cookie response.
5. **Reuse Detection**: If an attacker attempts to replay an already-revoked refresh token, the server detects that `isRevoked === true`, deletes the cookie, and rejects the request with `401 Unauthorized`.

---

## 4. Password Security & Bcrypt Hashing

User passwords are encrypted using **bcryptjs** with an adaptive work factor of **12 salt rounds**:

```javascript
// backend/src/models/User.js
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

- **Salt Rounds (12)**: Balances fast response times for genuine users (~150ms per hash) while making offline dictionary or brute-force attacks computationally prohibitive.
- **Hidden by Default**: The `password` field in `User.js` has `select: false`. It is never returned in queries unless explicitly requested via `.select('+password')` during the login authentication routine.
- **Safe Serialization**: The `toJSON` transform in `User.js` explicitly deletes `password` and `__v` before any user document is sent over the network.

---

## 5. Defense Against Privilege Escalation

A common vulnerability in web applications is allowing users to assign themselves administrative roles by manipulating the signup payload (`{ "role": "admin" }`).

CampusFlow enforces **dual-layer privilege escalation defense**:

### Layer 1: Schema Validation (Zod)
In `backend/src/validators/authValidators.js`, the registration schema restricts the allowed `role` values strictly to `['student', 'faculty']`:

```javascript
role: z.enum(['student', 'faculty'], {
  errorMap: () => ({ message: 'Public registration allows student or faculty accounts only' }),
}),
```

### Layer 2: Controller Sanitization
In `backend/src/controllers/authController.js`, even if a manipulated request bypassed validation, the controller forces role assignment:

```javascript
const assignedRole = role === ROLES.FACULTY ? ROLES.FACULTY : ROLES.STUDENT;
```

**Administrative Account Creation Policy:** Administrator accounts cannot be created via public APIs. They must be provisioned either through the offline CLI script (`node backend/src/utils/provisionAdmin.js`) or created directly by an existing administrator within the Admin Portal (`POST /api/v1/users`).

---

## 6. Role-Based Access Control (RBAC)

Authorization is enforced server-side through express middleware. Frontend UI hiding is treated solely as a UX convenience, never as a security boundary.

### Implementation: `authMiddleware.js`

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};
```

### Route-Level Enforcement Examples

| Route | Method | Required Roles | Enforcing Code |
| :--- | :--- | :--- | :--- |
| `/api/v1/bookings` | `POST` | Any authenticated user (`student`, `faculty`, `admin`) | `authenticate` |
| `/api/v1/bookings/admin/queue` | `GET` | `admin` | `authenticate`, `authorize('admin')` |
| `/api/v1/bookings/:id/approve` | `PATCH` | `admin` | `authenticate`, `authorize('admin')` |
| `/api/v1/resources` | `POST` | `admin` | `authenticate`, `authorize('admin')` |
| `/api/v1/maintenance` | `POST` | `admin` | `authenticate`, `authorize('admin')` |
| `/api/v1/analytics/dashboard` | `GET` | `admin` | `authenticate`, `authorize('admin')` |
| `/api/v1/audit` | `GET` | `admin` | `authenticate`, `authorize('admin')` |
| `/api/v1/users/:id/role` | `PATCH` | `admin` | `authenticate`, `authorize('admin')` |

### Resource-Level Ownership Checks
In addition to role checks, controller methods verify ownership for sensitive records. For example, in `bookingController.js`:

```javascript
// Students and faculty can only view their own bookings
if (req.user.role !== 'admin' && String(booking.user._id) !== String(req.user._id)) {
  return res.status(403).json({
    success: false,
    message: 'Access forbidden: You can only view your own bookings.',
  });
}
```

---

## 7. Cross-Site Request Forgery (CSRF) Protection

Because refresh tokens are delivered via ambient cookies, CampusFlow implements two complementary defenses against CSRF attacks:

1. **SameSite Cookie Policy**:
   - In local development: `sameSite: 'lax'` prevents cookies from being attached to cross-site image loads or unauthorized embeds.
   - In production cross-site architectures (e.g. Render backend with separate frontend): `sameSite: 'none'`, `secure: true`.
2. **Custom Anti-CSRF Header (`csrfMiddleware.js`)**:
   - For state-changing requests using ambient cookies (`POST /api/v1/auth/refresh`), the server requires the `X-Requested-With: XMLHttpRequest` header.
   - Web browsers strictly prohibit third-party websites or malicious `<form action="...">` submissions from adding custom headers without explicit CORS preflight permission.

---

## 8. Rate Limiting & Abuse Prevention

Brute-force credential attacks and denial-of-service attempts are mitigated using `express-rate-limit`:

1. **Authentication Limiter (`authLimiter`)**:
   - Scope: `/api/v1/auth/login`, `/api/v1/auth/signup`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`.
   - Window: 15 minutes.
   - Threshold: Maximum **20 requests per IP address**.
   - Violation Response: `429 Too Many Requests` (`Too many authentication attempts from this IP. Please try again after 15 minutes.`).
2. **General API Limiter (`apiLimiter`)**:
   - Scope: All `/api/*` routes.
   - Window: 1 minute.
   - Threshold: Maximum **120 requests per IP address**.
   - Shields the server against volumetric flooding.

---

## 9. Regulatory Audit Logging

For institutional compliance, all administrative actions and security events are logged in an immutable audit ledger (`AuditLog` collection):

- **Actions Logged**: `USER_LOGIN`, `USER_LOGOUT`, `BOOKING_CREATE`, `BOOKING_APPROVE`, `BOOKING_REJECT`, `BOOKING_CANCEL`, `RESOURCE_CREATE`, `RESOURCE_UPDATE`, `RESOURCE_DELETE`, `MAINTENANCE_SCHEDULE`, `MAINTENANCE_CANCEL`.
- **Sensitive Key Stripping**: `auditService.js` automatically purges sensitive properties before database insertion:
  ```javascript
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  delete sanitizedDetails.refreshToken;
  delete sanitizedDetails.secret;
  ```
- **Auditing Context**: Captures actor ID, target entity, timestamp, client IP address, and user-agent string.

---

## 10. Information Disclosure Prevention

1. **Email Enumeration Defense**:
   - During password reset requests (`POST /api/v1/auth/forgot-password`), the server always returns a generic `200 OK` response (`"If an account with that email exists, a password reset link has been dispatched."`), regardless of whether the email exists in the database.
   - Attackers cannot use the password reset endpoint to discover registered campus email addresses.
2. **Production Error Masking**:
   - In production (`NODE_ENV === 'production'`), Express never returns internal stack traces or database driver errors. Clients receive a sanitized message: `"An unexpected server error occurred. Please try again later."`

---

## 11. Known Security Limitations & Production Recommendations

To maintain transparency during technical evaluations and viva examinations, acknowledge these deliberate trade-offs:

1. **Single-Node Rate Limiter Store**:
   - The current `express-rate-limit` configuration uses the default in-memory store.
   - *Limitation*: If the backend is scaled horizontally across multiple server instances (e.g., a multi-container Kubernetes cluster), each instance tracks rate counts independently.
   - *Production Solution*: Use Redis as the backing store via `rate-limit-redis`.
2. **WebSocket Session Revocation**:
   - Socket connections authenticate during the initial handshake. If a user's account is deactivated while their WebSocket connection is active, the socket remains open until the next reconnect or token expiration.
   - *Production Solution*: Implement a heartbeat check or broadcast a disconnect event to `user:<userId>` upon account deactivation.
3. **Single Domain Scope for SameSite**:
   - When deploying frontend and backend on distinct domains (e.g. `frontend.vercel.app` and `backend.onrender.com`), cookies require `SameSite=None; Secure`. In browsers with third-party cookie restrictions enabled, the initial session refresh might require user interaction.
