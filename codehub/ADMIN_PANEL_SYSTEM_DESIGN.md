# CodeHub Admin Panel System Design

## 1. System Architecture Overview

The Admin Panel is a privileged interface built on top of the CodeHub Core API. It uses strict Role-Based Access Control (RBAC) middleware to ensure only authorized personnel can access sensitive data and operations.

### Core Components
1.  **Admin Gateway**: A logically separated set of API routes (`/api/admin/*`) protected by multi-factor authentication and IP allow-listing.
2.  **Audit Logger**: An immutable logging service that records *every* read/write action performed by an admin.
3.  **Operations Controller**: Handles high-risk tasks like system-wide lockdowns, maintenance mode, and global content takedowns.
4.  **Analytic Aggregator**: Asynchronously computes stats from the main database for the dashboard (User Growth, AI Usage, Repo Activity).

---

## 2. Feature List (Categorized)

### A. User Management
*   **Search**: ElasticSearch-powered lookup by username, email, IP history, or regex.
*   **Actions**:
    *   **Ban/Suspend**: Instant session revocation + flag in DB.
    *   **Shadowban**: User can post, but nobody else sees it (spam control).
    *   **Force Password Reset**: Send email requiring reset on next login.
    *   **Impersonation** (Restricted): Login as user (read-only) for support debugging.

### B. Repository & Organization Ops
*   **Repo Takedown**: Disable access to a repo (DMCA/Malware).
*   **Ownership Transfer**: Forcibly move repos between users/orgs.
*   **Organization Lock**: Freeze an entire organization's assets.
*   **Storage Quota Override**: Grant extra space to specific VIP users/orgs.

### C. AI Feature Governance
*   **Switch Board**: Toggle specific AI features (e.g., "Code Review", "Test Gen") globally or per-user.
*   **Cost Control**: Set hard limits on token usage per user/day.
*   **Abuse Shield**: Auto-ban users generating offensive content via AI.
*   **Model Selection**: Admin can switch backend models (Gemini 1.5 -> Gemini 1.5 Pro) centrally.

### D. Security & Moderation
*   **Maintenance Mode**: Reject all non-read requests system-wide.
*   **Kill Switch**: Global logout for ALL users (in case of token compromise).
*   **Report Queue**: Interface for Moderators to review user reports.

---

## 3. Roles & Permissions Matrix

| Permission | Super Admin | Admin | Moderator |
| :--- | :---: | :---: | :---: |
| **Manage Admins** (Promote/Demote) | ✅ | ❌ | ❌ |
| **View System Logs/Audit** | ✅ | ✅ | ❌ |
| **Global System Settings** (Maintenance Mode) | ✅ | ❌ | ❌ |
| **Manage Billing/Plans** | ✅ | ✅ | ❌ |
| **Ban/Suspend Users** | ✅ | ✅ | ✅ |
| **Delete Repositories** | ✅ | ✅ | ❌ (Lock only) |
| **View User PII** (Email, IP) | ✅ | ✅ | ❌ (Redacted) |
| **Handle Reports** | ✅ | ✅ | ✅ |
| **Manage AI Quotas** | ✅ | ✅ | ❌ |

---

## 4. API Endpoint Specification (Admin)

### Authentication
*   `POST /api/admin/login` - Separate login flow (requires 2FA).
*   `POST /api/admin/sudo` - Re-authenticate for sensitive actions (valid for 10 mins).

### User Management
*   `GET /api/admin/users?query=...` - Search users.
*   `GET /api/admin/users/:id/activity` - Get security logs & actions.
*   `POST /api/admin/users/:id/ban` - Ban user (Reason required).
*   `POST /api/admin/users/:id/reset-2fa` - Disable 2FA for recovery.

### Content Operations
*   `POST /api/admin/repos/:id/lock` - Make repo read-only.
*   `DELETE /api/admin/repos/:id` - Hard delete (Super Admin only).
*   `GET /api/admin/reports` - List open abuse reports.
*   `POST /api/admin/reports/:id/resolve` - Close report.

### AI Management
*   `GET /api/admin/ai/stats` - Global usage metrics.
*   `POST /api/admin/ai/config` - Update global prompt templates or models.
*   `POST /api/admin/users/:id/ai-limit` - Override user specific limit.

### System
*   `GET /api/admin/health` - Server stats (CPU, RAM, API latencies).
*   `POST /api/admin/system/maintenance` - Toggle maintenance mode.
*   `GET /api/admin/logs` - Query admin audit logs.

---

## 5. Database Schema (Admin additions)

### AdminAuditLog
*Records every action taken by staff.*
```javascript
const AdminLogSchema = new Schema({
  admin: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'USER_BAN', 'REPO_LOCK'
  targetType: { type: String, enum: ['User', 'Repo', 'System'] },
  targetId: String, 
  reason: String, 
  metadata: Object, // Stores 'before' and 'after' state for rollbacks
  ipAddress: String,
  timestamp: Date
});
```

### Report
*User-submitted abuse reports.*
```javascript
const ReportSchema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, enum: ['Repo', 'User', 'Comment'] },
  targetId: Schema.Types.ObjectId,
  reason: { type: String, enum: ['Spam', 'Abuse', 'Malware', 'Other'] },
  description: String,
  status: { type: String, enum: ['Open', 'UnderReview', 'Resolved', 'Dismissed'], default: 'Open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }, // Mod ID
  resolutionNotes: String,
  createdAt: Date
});
```

### GlobalSystemConfig
*Dynamic settings that don't require code deploy.*
```javascript
const SystemConfigSchema = new Schema({
  maintenanceMode: { type: Boolean, default: false },
  registrationOpen: { type: Boolean, default: true },
  
  aiSettings: {
    enabled: { type: Boolean, default: true },
    globalDailyLimit: Number,
    restrictedModels: [String]
  },
  
  security: {
    maxLoginAttempts: Number,
    required2FAForAdmins: { type: Boolean, default: true }
  }
});
```

---

## 6. Security & Edge Cases

### 1. The "Super Admin" Paradox
*   **Risk**: If a Super Admin account is compromised, the whole platform is lost.
*   **Mitigation**:
    *   Super Admin actions (like deleting backups or other admins) require **Quorum Approval** (2-person rule) in the database.
    *   Alerts sent to an external Slack/Email channel for *any* Super Admin login.

### 2. Immutable Logs
*   Admin logs must NEVER be deletable via the API. They should be piped to an external cold storage (like AWS S3 Glacier) instantly.

### 3. PII Protection
*   Moderators should see "redacted" emails (e.g., `j***@gmail.com`) unless they specifically request "Unmask" which is logged as a separate high-risk event.

### 4. Admin Session Timeout
*   Admin sessions should have a strict timeout (e.g., 30 minutes absolute, 10 minutes idle).
*   Use `sudo` mode (re-entering password) for destructive actions.
