# EthioxHub - Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│  (Browser: Chrome, Firefox, Safari, Mobile)                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                           │
│                   (Vercel / Custom VPS)                          │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Frontend  │  │  API Routes  │  │  Middleware  │           │
│  │  (React 18) │  │  (Next.js)   │  │   (Auth)     │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
└────┬─────────┬──────────┬───────────────┬──────────────────────┘
     │         │          │               │
     │         │          │               │
     ▼         ▼          ▼               ▼
┌─────────┐ ┌──────┐ ┌──────────┐ ┌──────────────┐
│MongoDB  │ │S3    │ │Cloudinary│ │Telegram API  │
│Atlas    │ │      │ │          │ │              │
└─────────┘ └──────┘ └──────────┘ └──────────────┘
```

---

## Data Flow

### 1. User Registration & Login Flow
```
User enters credentials
        ↓
POST /api/auth/register or /login
        ↓
Validate with Zod
        ↓
Hash password (bcrypt)
        ↓
Save to MongoDB
        ↓
Generate JWT access token (15 min)
Generate JWT refresh token (7 days)
        ↓
Return access token to client
Set refresh token as HttpOnly cookie
        ↓
Client stores access token in memory/localStorage
        ↓
All subsequent requests include: Authorization: Bearer {token}
```

---

### 2. Video Upload Flow (Cloudinary)
```
Admin clicks Upload on /admin/videos/upload
        ↓
Selects "Cloudinary" provider
        ↓
GET /api/upload/sign?resource_type=video
        ↓
Server generates signed upload params
        ↓
Client uploads video directly to Cloudinary
(POST https://api.cloudinary.com/v1_1/{cloud}/video/upload)
        ↓
Cloudinary starts HLS transcoding
        ↓
Client uploads thumbnail to Cloudinary (optional)
        ↓
Client calls POST /api/admin/videos/upload
with video metadata (cloudinaryUrl, cloudinaryPublicId)
        ↓
Server saves to MongoDB
        ↓
Cloudinary sends webhook on processing complete
        ↓
Video status updated to "approved"
        ↓
Video appears on platform
```

---

### 3. Video Upload Flow (AWS S3)
```
Admin clicks Upload on /admin/videos/upload
        ↓
Selects "AWS S3" provider
        ↓
GET /api/upload/sign?provider=s3&file_name=...&file_type=...
        ↓
Server generates S3 presigned PUT URL (1-hour expiry)
        ↓
Client uploads video directly to S3
(PUT https://bucket.s3.region.amazonaws.com/videos/...)
        ↓
Client uploads thumbnail to Cloudinary (optional)
        ↓
Client calls POST /api/admin/videos/upload
with video metadata (s3Key, s3Bucket, videoUrl)
        ↓
Server saves to MongoDB with provider="s3"
        ↓
Video appears on platform immediately
```

---

### 4. VIP Video Purchase Flow (Atomic)
```
User clicks "Purchase" on VIP video
        ↓
POST /api/videos/{id}/purchase
        ↓
Server validates:
  - User authenticated?
  - Already purchased?
  - Sufficient balance?
        ↓
START MongoDB Transaction (Snapshot Isolation)
    │
    ├─→ Check user balance again (race condition check)
    ├─→ Deduct price from user.balance
    ├─→ Calculate platform fee (10%)
    ├─→ Credit creator.balance (90%)
    ├─→ Add videoId to user.unlockedVideos
    ├─→ Increment video.purchases counter
    ├─→ Update video.earnings
    ├─→ Create Transaction record
    │
    └─→ COMMIT Transaction (all or nothing)
        ↓
Return success + new balance
        ↓
User can now watch video
```

---

### 5. Deposit Flow (Manual with Telegram)
```
User goes to /deposit
        ↓
1. Upload payment screenshot to Cloudinary
   GET /api/upload/sign?resource_type=image
   POST to Cloudinary
        ↓
2. Submit deposit request
   POST /api/deposits/create
   Body: { amount, cloudinaryUrl, cloudinaryId, metadata }
        ↓
3. Server creates Transaction record (status: pending)
   Generates callback token (1-hour expiry)
   Saves to MongoDB
        ↓
4. Send Telegram notification to admin group
   Message: "💰 New Deposit Request..."
   Buttons: [✅ Approve] [❌ Reject]
        ↓
5. Admin clicks button in Telegram
   Telegram sends callback to /api/telegram/webhook
        ↓
6. Server validates:
   - Admin chat ID matches?
   - Token not expired?
   - Transaction still pending?
        ↓
7. If approved:
   START MongoDB Transaction
       ├─→ Update transaction.status = "approved"
       ├─→ Credit user.balance += amount
       ├─→ Set transaction.approvedBy, approvedAt
       ├─→ Create AdminLog entry
       └─→ COMMIT
        ↓
8. Update Telegram message (remove buttons)
   Send confirmation to admin
        ↓
9. User sees updated balance immediately
```

---

### 6. Video Playback Flow

#### Cloudinary HLS
```
User clicks on video
        ↓
GET /api/videos/{id}
        ↓
Server checks access:
  - Free video? → Return cloudinaryHlsUrl
  - Paid video?
    - User owns? → Return cloudinaryHlsUrl
    - User purchased? → Return cloudinaryHlsUrl
    - User subscribed? → Return cloudinaryHlsUrl
    - Else → 402 Payment Required
        ↓
Client plays HLS stream with video.js or hls.js
```

#### AWS S3 Private
```
User clicks on video
        ↓
GET /api/videos/{id}
        ↓
Server checks access (same as above)
        ↓
If allowed:
  Generate signed GET URL (1-hour expiry)
  using AWS SDK getSignedUrl
        ↓
Return signed URL to client
        ↓
Client plays video directly from S3
(URL expires after 1 hour, must re-fetch)
```

---

## Database Schema Relationships

```
┌──────────────┐
│     USER     │
│──────────────│
│ _id          │──┐
│ username     │  │
│ email        │  │
│ balance      │  │  ┌──────────────┐
│ roles[]      │  │  │  TRANSACTION │
│ unlockedVid[]│──┼──│──────────────│
└──────────────┘  │  │ _id          │
                  │  │ user ────────│──┘
      ┌───────────┘  │ type         │
      │              │ status       │
      │              │ amount       │
      │              │ screenshot   │
      │              │ approvedBy ──│──┐
      │              └──────────────┘  │
      │                                │
      │              ┌──────────────┐  │
      │              │    VIDEO     │  │
      │              │──────────────│  │
      └──────────────│ _id          │  │
                     │ owner        │  │
                     │ title        │  │
                     │ provider     │  │
                     │ cloudinaryId │  │
                     │ s3Key        │  │
                     │ isPaid       │  │
                     │ price        │  │
                     │ status       │  │
                     │ purchases    │  │
                     └──────────────┘  │
                                       │
                     ┌──────────────┐  │
                     │  ADMIN LOG   │  │
                     │──────────────│  │
                     │ admin ───────│──┘
                     │ action       │
                     │ target       │
                     │ timestamp    │
                     └──────────────┘
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
└───────┬─────────────────────────────────────────────────────┘
        │
        │ 1. POST /api/auth/login
        │    { email, password }
        ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVER                                │
│                                                              │
│  2. Validate credentials                                     │
│  3. Generate access token (JWT, 15 min)                      │
│  4. Generate refresh token (JWT, 7 days)                     │
│                                                              │
│  5. Return:                                                  │
│     - Access token in JSON response                          │
│     - Refresh token as HttpOnly cookie                       │
└───────┬─────────────────────────────────────────────────────┘
        │
        │ 6. Store access token in localStorage
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  All subsequent requests:                                    │
│  Authorization: Bearer {accessToken}                         │
└───────┬─────────────────────────────────────────────────────┘
        │
        │ After 15 minutes, access token expires
        │
        │ 7. POST /api/auth/refresh (auto by client)
        │    Cookie: refreshToken
        ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVER                                │
│                                                              │
│  8. Validate refresh token from cookie                       │
│  9. Generate new access token (15 min)                       │
│  10. Generate new refresh token (7 days)                     │
│                                                              │
│  11. Return:                                                 │
│      - New access token in JSON                              │
│      - New refresh token as HttpOnly cookie                  │
└───────┬─────────────────────────────────────────────────────┘
        │
        │ 12. Update stored access token
        │
        ▼
    Continue until logout or 7 days pass
```

---

## Atomic Transaction Pattern

### Used in: Deposit Approval, VIP Purchase, Withdrawal

```javascript
┌─────────────────────────────────────────────────────────────┐
│  const session = await mongoose.startSession();              │
│  session.startTransaction({                                  │
│    readConcern: 'snapshot',    // Read consistent snapshot   │
│    writeConcern: 'majority'    // Wait for majority confirm  │
│  });                                                         │
└───────┬─────────────────────────────────────────────────────┘
        │
        │ try {
        ▼
    ┌─────────────────────────────────────────────────────┐
    │  Step 1: Update Transaction status                   │
    │  await Transaction.findByIdAndUpdate(                │
    │    txId,                                             │
    │    { status: 'approved', approvedBy, approvedAt },  │
    │    { session }  // ← Include session                │
    │  );                                                  │
    └─────────┬───────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────────────────────────┐
    │  Step 2: Update User balance                         │
    │  await User.findByIdAndUpdate(                       │
    │    userId,                                           │
    │    { $inc: { balance: amount } },                   │
    │    { session }  // ← Include session                │
    │  );                                                  │
    └─────────┬───────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────────────────────────┐
    │  Step 3: Create Admin Log                            │
    │  await AdminLog.create(                              │
    │    [{ admin, action, target, ... }],                │
    │    { session }  // ← Include session                │
    │  );                                                  │
    └─────────┬───────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────────────────────────┐
    │  await session.commitTransaction();                  │
    │  // ✅ ALL changes committed atomically             │
    └─────────┬───────────────────────────────────────────┘
              │
        } catch (error) {
              │
              ▼
    ┌─────────────────────────────────────────────────────┐
    │  await session.abortTransaction();                   │
    │  // ❌ ALL changes rolled back                      │
    └─────────┬───────────────────────────────────────────┘
              │
        } finally {
              │
              ▼
    ┌─────────────────────────────────────────────────────┐
    │  session.endSession();                               │
    │  // Release session resources                        │
    └─────────────────────────────────────────────────────┘
```

**Key Points**:
- If ANY step fails, ALL changes rollback
- No partial updates (e.g., balance credited but transaction status unchanged)
- Prevents race conditions (snapshot isolation)
- ACID guarantees

---

## File Structure

```
ethioxhub/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # Authentication
│   │   │   │   ├── login/route.js
│   │   │   │   ├── register/route.js
│   │   │   │   ├── refresh/route.js
│   │   │   │   └── me/route.js
│   │   │   ├── videos/               # Video management
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.js      # Get video details
│   │   │   │   │   ├── purchase/route.js
│   │   │   │   │   └── playtoken/route.js
│   │   │   │   └── route.js          # List videos
│   │   │   ├── deposits/             # Deposit system
│   │   │   │   ├── create/route.js
│   │   │   │   └── my-deposits/route.js
│   │   │   ├── admin/                # Admin endpoints
│   │   │   │   ├── deposits/
│   │   │   │   │   ├── pending/route.js
│   │   │   │   │   ├── approve/route.js
│   │   │   │   │   └── [id]/route.js
│   │   │   │   └── videos/
│   │   │   │       └── upload/route.js
│   │   │   ├── upload/
│   │   │   │   └── sign/route.js     # Get upload signature
│   │   │   └── telegram/
│   │   │       └── webhook/route.js  # Telegram callbacks
│   │   │
│   │   ├── (pages)/                  # Page routes
│   │   │   ├── page.js               # Home
│   │   │   ├── login/page.js
│   │   │   ├── register/page.js
│   │   │   ├── deposit/page.js
│   │   │   ├── my-deposits/page.js
│   │   │   ├── videos/[id]/page.js   # Video player
│   │   │   └── admin/
│   │   │       ├── page.js           # Dashboard
│   │   │       └── videos/upload/page.js
│   │   │
│   │   ├── layout.js                 # Root layout
│   │   └── globals.css               # Global styles
│   │
│   ├── components/
│   │   ├── Navbar.js                 # Navigation
│   │   └── VideoCard.js              # Video thumbnail
│   │
│   ├── contexts/
│   │   └── AuthContext.js            # Auth state
│   │
│   ├── lib/
│   │   ├── db.js                     # MongoDB connection
│   │   ├── auth.js                   # JWT utilities
│   │   ├── middleware.js             # Auth middleware
│   │   ├── cloudinary.js             # Cloudinary SDK
│   │   ├── s3.js                     # AWS S3 SDK
│   │   ├── telegram.js               # Telegram bot
│   │   ├── validation.js             # Zod schemas
│   │   └── rateLimit.js              # Rate limiting
│   │
│   └── models/
│       ├── User.js                   # User schema
│       ├── Video.js                  # Video schema
│       ├── Transaction.js            # Transaction schema
│       ├── AdminLog.js               # Admin log schema
│       ├── ModerationLog.js          # Moderation log schema
│       └── Subscription.js           # Subscription schema
│
├── scripts/
│   ├── test-s3.js                    # Test S3 connection
│   └── setup-s3-cors.js              # Auto-config S3 CORS
│
├── docs/
│   ├── COMPLETE_FEATURES.md          # Full documentation
│   ├── QUICK_REFERENCE.md            # Quick guide
│   └── ARCHITECTURE.md               # This file
│
├── .env.local                        # Environment variables
├── .env.example                      # Example env file
├── package.json                      # Dependencies
├── next.config.mjs                   # Next.js config
├── tailwind.config.js                # TailwindCSS config
├── CHANGELOG.md                      # Version history
└── README.md                         # Main readme
```

---

## Deployment Architecture

### Option 1: Vercel (Recommended)
```
┌──────────────┐
│   GitHub     │
│  Repository  │
└──────┬───────┘
       │ Push
       ▼
┌──────────────┐
│   Vercel     │  ← Auto-deploy on push
│   Platform   │  ← Built-in CDN
└──────┬───────┘  ← Serverless functions
       │
       ├──→ MongoDB Atlas (Database)
       ├──→ Cloudinary (Media)
       ├──→ AWS S3 (Optional video storage)
       └──→ Telegram API (Notifications)
```

### Option 2: Custom VPS
```
┌──────────────┐
│   VPS/EC2    │
│   (Ubuntu)   │
│              │
│  ┌────────┐  │
│  │ Nginx  │  │ ← Reverse proxy
│  └────┬───┘  │
│       │      │
│  ┌────▼───┐  │
│  │ Node.js│  │ ← Next.js server (npm start)
│  │ PM2    │  │ ← Process manager
│  └────────┘  │
└──────┬───────┘
       │
       ├──→ MongoDB Atlas (Database)
       ├──→ Cloudinary (Media)
       ├──→ AWS S3 (Optional video storage)
       └──→ Telegram API (Notifications)
```

---

## Scaling Considerations

### Current Capacity (Free Tier)
```
Vercel Free:    100GB/month bandwidth
MongoDB Free:   512MB storage, 10GB transfer/month
Cloudinary Free: 25GB storage, 25GB bandwidth/month
AWS S3:         5GB storage, 20k GET, 2k PUT/month (free tier)
```

### High Traffic Scenario (10,000+ users)
```
┌──────────────────────────────────────────────────┐
│  Load Balancer (Nginx or Cloudflare)             │
└────┬─────────────────────────────────────────────┘
     │
     ├──→ Next.js Instance 1 (Vercel Edge)
     ├──→ Next.js Instance 2 (Vercel Edge)
     └──→ Next.js Instance 3 (Vercel Edge)
           │
           ├──→ Redis (Rate limiting + caching)
           ├──→ MongoDB Cluster (Replica set)
           ├──→ CloudFront CDN (S3 content)
           └──→ BullMQ Workers (Background jobs)
```

---

**Last Updated**: December 12, 2025
