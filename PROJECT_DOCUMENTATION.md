# EthioxHub Project Documentation

## 1. Introduction
EthioxHub is a comprehensive video streaming and community platform built with Next.js. It features a robust ecosystem for video creators and consumers, including premium (paid) content, user wallets with deposit functionality, an admin moderation dashboard, and social features like comments and likes.

## 2. Technology Stack

### Core Framework
- **Next.js 14**: App Router architecture for frontend and API routes.
- **React**: Component-based UI library.
- **Node.js**: Server-side runtime.

### Database & Storage
- **MongoDB (via Mongoose)**: NoSQL database for flexible data modeling.
- **Cloudinary**: Primary storage solution for images and videos (with HLS streaming support).
- **AWS S3**: Secondary/Alternative storage option for large video files.

### Authentication & Security
- **JWT (JSON Web Tokens)**: Dual-token system (Access + Refresh tokens).
- **Bcryptjs**: Password hashing.
- **HttpOnly Cookies**: Secure token storage.
- **Rate Limiting**: Custom middleware to prevent abuse.
- **Zod**: Runtime schema validation for API requests.

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Animation library for smooth UI transitions (used in Modals, Sidebar).
- **Lucide React / Heroicons**: Icon sets.

---

## 3. Architecture & Directory Structure

The project follows the standard Next.js App Router structure within the `src` directory:

- **`src/app`**: Contains all pages and API routes.
    - **`(pages)`**: `page.js` files correspond to frontend routes (e.g., `/login`, `/upload`, `/admin`).
    - **`api`**: Backend endpoints (e.g., `/api/auth/login`, `/api/videos/upload`).
    - **`layout.js`**: Global layout (Navbar wrapper).
- **`src/components`**: Reusable UI components (`Navbar`, `AdminSidebar`, `VideoCard`, `SuccessModal`).
- **`src/contexts`**: Global state management (`AuthContext` for user session).
- **`src/hooks`**: Custom React hooks (`useFilterVideos`, `useAuth`).
- **`src/lib`**: Utility functions and configurations.
    - `db.js`: MongoDB connection handler.
    - `auth.js`: Token generation and verification logic.
    - `middleware.js`: Route protection wrappers (`requireAuth`, `requireAdmin`).
- **`src/models`**: Mongoose schema definitions.

---

## 4. Key Database Models

### 1. User (`User.js`)
Stores user account information and wallet balance.
- **Fields**: `username`, `email`, `passwordHash`, `roles` (['user', 'admin']), `balance` (in cents), `profilePicture`.
- **Key Logic**: Tracks `lastLogin` for activity metrics.

### 2. Video (`Video.js`)
The core content model.
- **Fields**: `title`, `description`, `owner` (ref User), `price` (0 for free), `status` (['uploaded', 'pending_moderation', 'approved']).
- **Storage**: Supports multi-provider fields (`cloudinaryUrl`, `s3Key`).
- **Metrics**: `views`, `likesCount`, `dislikesCount`.

### 3. Transaction (`Transaction.js`)
The financial ledger for the platform.
- **Type Enum**: `deposit`, `purchase`, `withdraw`.
- **Status Enum**: `pending`, `approved`, `rejected`.
- **Workflow**: User initiates a `deposit` -> Status `pending` -> Admin reviews -> Status `approved` -> User `balance` increases.

---

## 5. Core Features & Workflows

### A. Authentication
The system uses a secure, stateless authentication mechanism:
1.  **Login**: User posts credentials to `/api/auth/login`.
    - Returns strictly typed `accessToken` (short-lived, 15m).
    - Sets `refreshToken` (long-lived, 30d) in a secure HttpOnly cookie.
2.  **Session**: The frontend (`AuthContext`) automatically refreshes the access token silently when it expires, ensuring seamless user experience.

### B. Video Upload Pipeline
A sophisticated upload flow supporting multiple providers:
1.  **Signature**: Client requests a secure upload signature from `/api/upload/sign`.
2.  **Direct Upload**: Client uploads file directly to Cloudinary or AWS S3 (bypassing the server to save bandwidth).
3.  **Metadata Save**: Only after successful upload, the client sends metadata (URL, Duration) to `/api/admin/videos/upload`.
4.  **Moderation**: Videos enter `pending_moderation` state. They are NOT visible publicly until an Admin approves them via the Dashboard.

### C. Financial System (Deposits)
1.  **User Request**: User visits `/deposit`, enters amount, and uploads a screenshot of their bank transfer.
2.  **Creation**: A `Transaction` record is created with status `pending`.
3.  **Admin Review**: Admin sees the request in Dashboard (`/admin`), verifies the screenshot, and clicks "Approve".
4.  **Balance Update**: The atomic approval process updates the Transaction to `approved` AND increments the User's `balance` atomically.

### D. Admin Dashboard
A comprehensive control panel for platform management:
- **Analytics**: Real-time stats on Revenue, Active Users, and Video Counts (visualized with charts).
- **Deposits Queue**: Review and approve/reject funding requests.
- **Video Moderation**: Review and approve/reject new content.
- **Profile Management**: Update admin credentials and profile.

---

## 6. API Reference (Key Endpoints)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| POST | `/api/auth/login` | Authenticate user & set cookies | Public |
| POST | `/api/auth/register` | Create new account | Public |
| POST | `/api/auth/refresh` | Renew access token | Public (Cookie) |
| **Videos** | | | |
| GET | `/api/videos` | List public videos (with pagination) | Public |
| POST | `/api/admin/videos/upload` | Create video metadata | Admin/Auth |
| GET | `/api/admin/videos/pending` | List videos awaiting review | Admin |
| POST | `/api/admin/videos/[id]/approve` | Publish a video | Admin |
| **Finance** | | | |
| POST | `/api/deposit` | Create deposit request | Auth |
| GET | `/api/admin/deposits/pending` | List pending deposits | Admin |
| POST | `/api/admin/deposits/approve` | Finalize deposit & fund wallet | Admin |
| **Analytics** | | | |
| GET | `/api/admin/analytics` | Get dashboard stats | Admin |

---

## 7. Environmental Variables
The project relies on the following configuration in `.env`:

```bash
# Database
MONGODB_URI=mongodb+srv://...

# Auth Secrets
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Cloudinary (Media)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# AWS S3 (Optional Media)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_REGION=...
```

## 8. Development Commands
- `npm run dev`: Start development server (Port 3000).
- `npm run build`: Build for production.
- `npm run start`: Run production build.

---
*Generated by Antigravity Agent*

## 10. Troubleshooting
### MongoDB Connection Timeout
If you see MongoNetworkTimeoutError, it means your IP is blocked or your ISP is filtering Port 27017.
**Fixes:**
1. Check MongoDB Atlas > Network Access > Add 0.0.0.0/0
2. Check local firewall.
3. Try a VPN if your ISP blocks database ports.
