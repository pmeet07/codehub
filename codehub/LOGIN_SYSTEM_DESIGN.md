# CodeHub Authentication & Security System Design

## 1. High-Level System Architecture

The authentication system is designed as a modular component within the CodeHub backend. It prioritizes security layers and separates concerns between identity management, access control, and session handling.

### Core Components
1.  **Identity Provider (IdP)**: Manages user credentials, hashing, and social login integrations (Google/GitHub).
2.  **Token Service**: Handles JWT generation, signing, validation, and refresh token rotation.
3.  **Session Manager**: Tracks active devices and geo-locations; handles revocation.
4.  **Security Enforcer**: Manages 2FA (TOTP), rate limiting, account locking, and suspicious activity detection.
5.  **Audit Service**: Asynchronously logs critical security events for compliance and history.

---

## 2. Authentication & Authorization Flow

### A. User Registration (Signup)
1.  User submits `email`, `username`, `password`.
2.  **Validation**: Check uniqueness of email/username. Enforce password complexity (min 12 chars, mixed case, symbols).
3.  **hashing**: Hash password using **Argon2id** (preferred over bcrypt for better GPU resistance) or **bcrypt** (work factor 12).
4.  **Creation**: Create `User` record with `isEmailVerified: false`.
5.  **Verification**: Generate crypto-random token, store hash of token in DB, send magic link via Email Service.
6.  **Completion**: User clicks link -> Verify token -> Set `isEmailVerified: true`.

### B. Secure Login with Token Rotation
1.  **Rate Limit**: Check IP/User attempts (Redis). Block if > 5 failed attempts in 15 mins.
2.  **Credentials**: Validate email/password.
3.  **2FA Check**: If enabled, require TOTP code. Return interim temp-token if 2FA is pending.
4.  **Session Creation**:
    *   Generate `Access Token` (JWT, 15 min expiry).
    *   Generate `Refresh Token` (UUID, 7 day expiry).
    *   Store `Refresh Token` hash in DB with device metadata (IP, User-Agent, OS).
5.  **Response**:
    *   Send `Access Token` in JSON body (for memory storage by client).
    *   Send `Refresh Token` in **HttpOnly, Secure, SameSite=Strict** Cookie.

### C. Token Refresh (Rotation)
1.  Client sends Refresh Token cookie.
2.  Server verifies token existence and expiry.
3.  **Rotation Logic**:
    *   If token is valid: Invalidate old token, issue NEW Access DB & NEW Refresh Token.
    *   **Reuse Detection**: If an *already used/invalidated* token is presented, **revoke ALL sessions** for that user (assumes theft).

---

## 3. Database Schema (MongoDB / Mongoose)

### Users Collection
```javascript
const UserSchema = new Schema({
  username: { type: String, unique: true, index: true },
  email: { type: String, unique: true, lowercase: true },
  passwordHash: { type: String, select: false }, // Argon2 or Bcrypt hash
  isEmailVerified: { type: Boolean, default: false },
  
  // Security
  twoFactor: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, select: false }, // Encryption at rest recommended
    recoveryCodes: [{ code: String, used: Boolean }]
  },
  securitySettings: {
    loginAlertsEnabled: { type: Boolean, default: true },
    lockoutUntil: Date,
    failedLoginAttempts: { type: Number, default: 0 }
  },

  // Developer Features
  sshKeys: [{ label: String, fingerprint: String, publicKey: String, createdAt: Date }],
  
  roles: [{ type: String, enum: ['user', 'admin', 'org_owner'] }],
  createdAt: Date
});
```

### Sessions (Refresh Tokens) Collection
```javascript
const SessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  tokenHash: { type: String, required: true }, // Store hash, not raw token
  expiresAt: { type: Date, required: true, expires: 0 }, // TTL index
  
  // Device Fingerprinting
  ipAddress: String,
  userAgent: String,
  deviceType: String, // 'mobile', 'desktop'
  location: { country: String, city: String },
  lastActive: Date,
  isRevoked: { type: Boolean, default: false }
});
```

### Personal Access Tokens (PAT)
```javascript
const PATSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  tokenHash: String, // Hash provided token
  scopes: [String], // e.g., 'repo:read', 'user:write'
  lastUsed: Date,
  expiresAt: Date
});
```

### Audit Logs
```javascript
const AuditLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  action: String, // 'LOGIN', 'PASSWORD_CHANGE', 'SSH_ADDED'
  status: String, // 'SUCCESS', 'FAILURE'
  ip: String,
  metadata: Object,
  timestamp: { type: Date, default: Date.now }
});
```

---

## 4. API Endpoint Specification

### Authentication
*   `POST /api/auth/register` - Create account.
*   `POST /api/auth/login` - Authenticate & receive tokens.
*   `POST /api/auth/refresh` - Rotate refresh token (cookie based).
*   `POST /api/auth/logout` - Revoke current refresh token & clear cookie.
*   `POST /api/auth/verify-email` - Validate email verification token.

### Security
*   `POST /api/auth/2fa/setup` - Generate QR code (requires password).
*   `POST /api/auth/2fa/verify` - Activate 2FA with first code.
*   `POST /api/auth/password/change` - Change password (requires old password).
*   `POST /api/auth/password/reset-request` - Send reset email.
*   `POST /api/auth/password/reset` - Set new password with token.

### Sessions & Devices
*   `GET /api/user/sessions` - List active sessions (IP, Device, Last Active).
*   `DELETE /api/user/sessions/:sessionId` - Revoke specific session.
*   `DELETE /api/user/sessions` - Revoke ALL other sessions.

### Developer Settings
*   `GET /api/user/keys` - List SSH keys.
*   `POST /api/user/keys` - Add SSH key.
*   `POST /api/user/tokens` - Generate Personal Access Token.

---

## 5. Security Best Practices & Edge Cases

### 1. Password Storage
*   **Never** store plain text.
*   Use **Argon2id** with a unique salt per user.
*   Re-hash passwords if parameters change in the future.

### 2. Token Security
*   **Access Tokens**: Short life (15 mins). Store in memory (not LocalStorage) to prevent XSS theft.
*   **Refresh Tokens**: Long life (7 days). Store in **HttpOnly Cookie** to prevent XSS access. Use **SameSite=Strict** to prevent CSRF.

### 3. Account Locking
*   After 5 failed attempts, verify user identity via email or lock account for 15 minutes.
*   Use exponential backoff for subsequent failures.

### 4. New Device Detection
*   Compare current IP/User-Agent hash with user's history.
*   If new, send email: "Did you just login from Chrome on Windows in New York?".

### 5. Graceful Deletion
*   When user deletes account, soft-delete (set `deletedAt`).
*   Hard delete after 30 days.
*   Retain audit logs for 1 year for legal compliance.

### 6. CSRF Protection
*   For non-GET requests, use CSRF tokens if not using SameSite=Strict cookies exclusively. Or rely on SameSite cookies and standard CORS policies.

### 7. Rate Limiting
*   Implemet `express-rate-limit` + Redis store.
*   Strict limits on `/auth/login` (5/min).
*   Loose limits on API reads (1000/hour).
