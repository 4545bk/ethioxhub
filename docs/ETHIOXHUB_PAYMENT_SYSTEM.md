# EthioxHub Payment & System Architecture Documentation

## Overview
EthioxHub is a premium video streaming platform that utilizes a custom wallet-based payment system. Users deposit funds (ETB - Ethiopian Birr) into their on-platform wallet and use this balance to unlock exclusive content (Videos and Photos).

## 1. Core Architecture

### 1.1 Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes (Serverless functions)
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Custom JWT + Google Auth
- **File Storage**: Cloudinary (Images/Videos)
- **Notifications**: Telegram Bot API + In-App Notifications

### 1.2 Data Models
The payment system relies on three critical models:

1.  **User (`src/models/User.js`)**
    -   `balance`: Stores current funds in **cents** (e.g., 100 ETB = 10000 cents) to handle floating-point precision issues.
    -   `unlockedVideos` / `unlockedPhotos`: Arrays of ObjectIDs referencing purchased content.
    -   `roles`: `['user', 'admin']` determines access to dashboard and approval tools.

2.  **Transaction (`src/models/Transaction.js`)**
    -   Central ledger for **ALL** money movements.
    -   `type`: `'deposit'`, `'purchase'`, `'withdraw'`, etc.
    -   `status`: `'pending'`, `'approved'`, `'rejected'`, `'failed'`.
    -   `amount`: Positive for deposits, negative (conceptually) for debits, always stored as absolute value with direction implied by type.
    -   `metadata`: Contextual info (e.g., `videoId` for purchases, `senderName` for deposits).

3.  **Deposit (Conceptual)**
    -   Handled via `Transaction` model with `type: 'deposit'`.

---

## 2. Payment System Workflows

### 2.1 Deposit Flow (User -> Admin -> Wallet)
This process allows users to load funds into their account manually via bank transfer proof.

1.  **User Initiation**:
    -   User visits `/my-deposits` and clicks "New Deposit".
    -   Enters `amount`, `senderName`, and uploads a screenshot of the bank transfer (Cloudinary).
    -   **API**: `POST /api/deposits/create`
        -   Validates input & rate limits.
        -   Creates a `Transaction` record with status `pending`.
        -   **Telegram Notification**: Sends a rich message to the Admin Telegram Channel with "Approve" and "Reject" buttons.

2.  **Admin Approval**:
    -   Admin reviews the request via Telegram OR Admin Dashboard (`/admin/deposits`).
    -   **API**: `POST /api/admin/deposits/approve`
        -   **Atomic Transaction**: Uses MongoDB sessions to ensure data integrity.
        -   Verifies Admin permissions (or signed Telegram token).
        -   Updates `Transaction` status to `approved`.
        -   Increments `User.balance` by `amount`.
        -   Adds a success notification to `User.notifications`.
        -   Logs the action in `AdminLog`.

3.  **Completion**:
    -   User receives an in-app notification.
    -   Balance is immediately available for use.

### 2.2 Purchase Flow (Wallet -> Content)
This process occurs when a user wants to view a premium video or photo.

1.  **User Action**:
    -   User clicks "Unlock" on a Premium Video/Photo.
    -   **Client**: `VideoPlayerClient.js` checks if `video.isPaid`.

2.  **API Processing**:
    -   **API**: `POST /api/videos/[id]/buy`
    -   **Validation**:
        -   Checks if user is logged in.
        -   Checks if content is already unlocked.
        -   Checks if `User.balance` >= `Content.price`.
    -   **Execution** (Atomic Transaction):
        -   Deducts price from `User.balance`.
        -   Creates a `Transaction` (type: `purchase`, status: `approved`).
        -   Adds `videoId` to `User.unlockedVideos`.
        -   Increments `Video.sales` count.
        -   (Optional) Credits revenue share to Content Creator's wallet.

3.  **Access Granted**:
    -   User interface updates immediately to show the full player/image.

---

## 3. Key Components & Security

### 3.1 Currency Handling
-   **Cent-based Storage**: All monetary values are stored as integers (cents).
    -   Database: `10000`
    -   Frontend Display: `(10000 / 100).toFixed(2)` -> `"100.00 ETB"`
-   **Validation**: Zod schemas (`src/lib/validation.js`) protect all inputs.

### 3.2 Telegram Integration (`src/lib/telegram.js`)
-   Acts as a real-time notification bridge.
-   Allows admins to approve/reject deposits directly from the chat app.
-   Uses secure, time-limited tokens for callback actions to prevent replay attacks.

### 3.3 Security Measures
-   **Authentication**: `requireAuth` and `requireAdmin` middleware.
-   **Rate Limiting**: Prevents spam on deposit creation endpoints.
-   **Atomic Transactions**: MongoDB sessions prevent "double-spend" or partial state updates (e.g., deducting balance but failing to unlock video).

---

## 4. Admin Dashboard
Located at `/admin`, provides comprehensive management:
-   **Analytics**: Real-time charts of views, sales, and traffic.
-   **Pending Deposits**: List of deposits waiting for review.
-   **Content Management**: Upload/Edit Videos and Photos.
-   **User Management**: View user details, balances, and history.

## 5. Maintenance
-   **Logs**: All admin actions are logged to `AdminLog`.
-   **Database**: Ensure MongoDB Replica Set is enabled (required for Transactions).
-   **Environment Variables**:
    -   `MONGODB_URI`: Database connection.
    -   `TELEGRAM_BOT_TOKEN` & `TELEGRAM_ADMIN_CHAT_ID`: Notification routing.
    -   `CLOUDINARY_*`: Media storage configuration.
