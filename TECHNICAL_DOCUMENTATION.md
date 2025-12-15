# EthioxHub - Complete Technical Documentation

## Table of Contents
1. [Layout Change Summary](#layout-change-summary)
2. [Website Overview](#website-overview)
3. [Core Functionalities](#core-functionalities)
4. [Technologies Used](#technologies-used)
5. [Architecture](#architecture)
6. [Key Features Documentation](#key-features-documentation)
7. [Logic Explanation](#logic-explanation)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Security Implementation](#security-implementation)

---

## Layout Change Summary

### Change Implemented
**Addition of spacing between video grid and footer/cookie banner**

**Technical Details:**
- **File Modified**: `/src/app/page.js`
- **Change**: Added `pb-20` (padding-bottom: 5rem) to main container
- **Before**: `className="container mx-auto px-4 py-6"`
- **After**: `className="container mx-auto px-4 py-6 pb-20"`

**Visual Impact:**
- Creates 80px (5rem) of spacing between the last row of videos and the cookie banner
- Improves visual hierarchy and readability
- Prevents content from feeling cramped at the bottom
- Enhances user experience by providing breathing room

**Verification:**
- No existing functionality affected
- All video cards, pagination, and filtering remain intact
- Cookie banner positioning unchanged
- Responsive design maintained across all breakpoints

---

## Website Overview

**EthioxHub** is a comprehensive video-sharing and monetization platform designed specifically for the Ethiopian market. It enables content creators to upload, share, and monetize educational videos while providing viewers with access to premium learning content through either individual purchases or subscription plans.

### Primary Purpose
- **For Creators**: Upload and monetize educational/course content
- **For Viewers**: Access free and premium educational videos
- **For Admins**: Manage platform, approve deposits, monitor content

### Target Audience
- Ethiopian students and lifelong learners
- Content creators and educators
- Educational institutions

### Revenue Model
- Individual video purchases (VIP content)
- Subscription-based access
- Manual deposit system via bank transfer
- Telegram-integrated payment verification

---

## Core Functionalities

### 1. **User Management**
- **Registration & Authentication**
  - Email/password registration
  - JWT-based authentication (access + refresh tokens)
  - Role-based access control (user, creator, admin)
  - Email verification system
  - Password reset functionality
  
- **User Profiles**
  - Profile picture upload (Cloudinary)
  - Username and bio
  - View history tracking
  - watchlist/favorites
  - Balance management (in Ethiopian Birr cents)

### 2. **Video System**
- **Uploaded Content Management**
  - Multi-provider support (Cloudinary, AWS S3)
  - Video quality options (Auto, 1080p, 720p, 480p, 360p)
  - HLS streaming for adaptive bitrate
  - Direct MP4 playback fallback
  - Thumbnail generation
  - Video preview on hover
  
- **Video Metadata**
  - Title, description, category
  - Tags for discoverability
  - Duration tracking
  - View count analytics
  - Like/dislike system
  - Comments section

### 3. **Access Control**
- **Free vs VIP Content**
  - Free videos: Accessible to all authenticated users
  - VIP videos: Requires purchase or active subscription
  - Price setting per video (in ETB cents)
  
- **Purchase System**
  - Individual video purchases
  - Funds deducted from user balance
  - Transaction history
  - Unlocked videos list
  
- **Subscription System**
  - Monthly/yearly plans
  - Access to all VIP content
  - Auto-renewal (manual for now)
  - Subscription expiry tracking

### 4. **Payment & Financial System**
- **Manual Deposit System**
  - Bank transfer to designated account
  - Screenshot upload as proof
  - Telegram notification to admin
  - Admin approval/rejection
  - Automatic balance credit
  
- **Telegram Integration**
  - Instant deposit notifications
  - Inline approve/reject buttons
  - Real-time status updates
  - Admin dashboard sync

### 5. **Video Discovery**
- **Advanced Filtering**
  - Category-based filtering
  - Search functionality (title, description, tags)
  - Sort options: newest, views, likes, premium, free
  - Pagination (12 videos per page)
  
- **Personalization**
  - Continue watching section
  - Watch history
  - Progress tracking and auto-resume
  - Recommended videos (category-based)

### 6. **Engagement Features**
- **Social Interactions**
  - Like/dislike system
  - Comments with replies
  - Share functionality (Web Share API + clipboard)
  - Creator subscription counts
  
- **Progress Tracking**
  - Save watch position every 10 seconds
  - Resume from last position
  - Watch completion percentage
  - History tracking

### 7. **Admin Dashboard**
- **Content Moderation**
  - Video approval/rejection
  - Category management
  - User management
  
- **Financial Management**
  - Pending deposits review
  - Approve/reject deposits
  - Transaction history
  - Revenue analytics
  
- **Analytics**
  - Total users, videos, revenue
  - Popular videos dashboard
  - User activity metrics

### 8. **Creator Dashboard**
- **Upload Management**
  - Direct upload to Cloudinary
  - AWS S3 integration
  - Progress indicators
  - Video processing status
  
- **Analytics**
  - Views per video
  - Earnings tracking
  - Purchase history
  - Engagement metrics

---

## Technologies Used

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (React 18)
- **Styling**: Tailwind CSS 3.x
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: React Context API (AuthContext)
- **Form Handling**: Custom hooks
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod

### Media & Storage
- **Video Storage**: 
  - Cloudinary (primary)
  - AWS S3 (alternative)
- **Image Storage**: Cloudinary
- **Video Streaming**: HLS.js for adaptive streaming

### External Services
- **Notifications**: Telegram Bot API
- **Email**: (configured via env)
- **Payment Verification**: Manual (bank transfer + screenshot)

### DevOps & Deployment
- **Version Control**: Git
- **Package Manager**: npm
- **Environment Variables**: .env.local
- **Deployment**: Vercel (Next.js optimized)

### Development Tools
- **Code Quality**: ESLint
- **CSS Processing**: PostCSS
- **Build Tool**: Next.js built-in bundler (webpack)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Homepage  │  │ Video Player │  │ Admin Panel   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Application Server                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API Routes Layer                    │   │
│  │  /api/auth  /api/videos  /api/admin  /api/...  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Business Logic Layer                   │   │
│  │  Authentication  Authorization  Validation       │   │
│  └─────────────────────────────────────────────────┘   │
└────────┬──────────────────┬──────────────────┬─────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   MongoDB    │   │  Cloudinary  │   │   Telegram   │
│   Database   │   │  (Media CDN) │   │   Bot API    │
└──────────────┘   └──────────────┘   └──────────────┘
```

### Directory Structure

```
ethioxhub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Homepage
│   │   ├── videos/[id]/        # Video player page
│   │   ├── admin/              # Admin dashboard
│   │   ├── login/              # Authentication pages
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Auth endpoints
│   │   │   ├── videos/         # Video CRUD
│   │   │   ├── admin/          # Admin operations
│   │   │   └── deposits/       # Payment handling
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── video/              # Video UI components
│   │   ├── Navbar.js           # Main navigation
│   │   ├── VideoCard.js        # Video display
│   │   └── ...
│   ├── contexts/               # React contexts
│   │   └── AuthContext.js      # Authentication state
│   ├── hooks/                  # Custom hooks
│   │   ├── useLikeVideo.js     # Like functionality
│   │   ├── useFilterVideos.js  # Video filtering
│   │   └── ...
│   ├── models/                 # MongoDB schemas
│   │   ├── User.js             # User model
│   │   ├── Video.js            # Video model
│   │   ├── Transaction.js      # Payment transactions
│   │   └── ...
│   └── lib/                    # Utility functions
│       ├── mongodb.js          # DB connection
│       ├── jwt.js              # Token handling
│       └── ...
├── public/                     # Static assets
├── docs/                       # Documentation
├── .env.local                  # Environment variables
├── package.json                # Dependencies
└── tailwind.config.js          # Tailwind configuration
```

---

## Key Features Documentation

### Feature 1: Video Player with HLS Streaming

**Purpose**: Provide adaptive quality video playback with resume functionality

**Components Involved**:
- `VideoPlayer.js` - UI component
- `/app/videos/[id]/page.js` - Page logic
- `/api/videos/[id]` - Data fetching

**Technical Flow**:
1. Page loads → Fetch video metadata via API
2. Check user access (free/purchased/subscription)
3. If authorized → Get video URL (signed for security)
4. Initialize player:
   - HLS.js for .m3u8 URLs (adaptive streaming)
   - Direct `<video>` for MP4 URLs
5. Track progress every 10 seconds
6. Save position on pause/close
7. Resume from saved position on next visit

**Quality Switching**:
```javascript
// Auto quality
hlsInstance.currentLevel = -1;

// Manual quality (e.g., 720p)
const levelIndex = hlsInstance.levels.findIndex(level => level.height === 720);
hlsInstance.currentLevel = levelIndex;
```

### Feature 2: Deposit System with Telegram Verification

**Purpose**: Enable users to add funds via bank transfer with admin approval

**Workflow**:
```
1. User initiates deposit
   ↓
2. User uploads transfer screenshot
   ↓
3. System creates pending deposit record
   ↓
4. Telegram bot sends notification to admin
   (with inline Approve/Reject buttons)
   ↓
5. Admin reviews in Telegram or dashboard
   ↓
6. Admin approves → Balance credited
   OR
   Admin rejects → User notified
   ↓
7. User sees updated balance
```

**Telegram Integration**:
- Bot token stored in env
- Webhook endpoint: `/api/telegram/webhook`
- Inline buttons for quick approval
- Real-time status updates

### Feature 3: Advanced Video Filtering

**Purpose**: Help users discover content efficiently

**Filter Options**:
- **Search**: Text search in title, description, tags
- **Category**: Filter by predefined categories
- **Sort**: views, newest, likes, premium, free
- **Pagination**: 12 videos per page

**Implementation**:
```javascript
// useFilterVideos hook
const { videos, loading } = useFilterVideos({
  search: 'javascript',
  category: 'programming',
  sort: 'views',
  page: 1
});

// API Query
GET /api/videos?search=javascript&category=programming&sort=views&page=1
```

### Feature 4: Continue Watching

**Purpose**: Users can resume videos from where they left off

**Data Structure**:
```javascript
{
  userId: ObjectId,
  videoId: ObjectId,
  progressPercent: 45.5,
  lastPositionSec: 273,
  watchDurationSec: 273,
  updatedAt: Date
}
```

**Logic**:
1. Save progress every 10 seconds while playing
2. Query user's progress on homepage load
3. Show videos with >5% and <95% completion
4. Display progress bar overlay on thumbnail
5. Click → Resume from saved position

### Feature 5: Like/Dislike System

**Purpose**: Enable user engagement and content ranking

**Technical Implementation**:
```javascript
// useLikeVideo hook
const { liked, likesCount, handleLike } = useLikeVideo({
  liked: userHasLiked,
  disliked: userHasDisliked,
  likesCount: video.likesCount,
  dislikesCount: video.dislikesCount
});

// API Call
POST /api/videos/:id/like
Body: { action: 'like' } // or 'dislike' or 'unlike'

// Update arrays in Video model
video.likedBy.push(userId);  // Add
video.dislikedBy.pull(userId);  // Remove opposite
video.likesCount++;
```

---

## Logic Explanation

### Authentication Flow

**Registration**:
```
1. User submits email, username, password
   ↓
2. Validate input (Zod schema)
   ↓
3. Check email uniqueness
   ↓
4. Hash password (bcrypt, 10 rounds)
   ↓
5. Create user document in MongoDB
   ↓
6. Generate JWT tokens (access + refresh)
   ↓
7. Return tokens to client
   ↓
8. Store in localStorage
   ↓
9. Client redirects to homepage
```

**Login**:
```
1. User submits email + password
   ↓
2. Find user by email
   ↓
3. Compare password hash
   ↓
4. If valid → Generate JWT tokens
   ↓
5. Return tokens
   ↓
6. Client stores and redirects
```

**Token Refresh**:
```
1. Access token expires (15 min)
   ↓
2. API returns 401 Unauthorized
   ↓
3. Client sends refresh token
   ↓
4. Server validates refresh token
   ↓
5. Generate new access token
   ↓
6. Client retries failed request
```

### Video Access Control

**Access Check Logic**:
```javascript
async function canAccessVideo(userId, video) {
  // Free video
  if (!video.isPaid) return true;
  
  // Admin always has access
  if (user.roles.includes('admin')) return true;
  
  // Check if purchased
  if (user.unlockedVideos.includes(video._id)) return true;
  
  // Check active subscription
  if (user.subscriptionExpiresAt > new Date()) return true;
  
  // No access
  return false;
}
```

### Video Purchase Flow

```
1. User clicks "Purchase" button
   ↓
2. Check user balance >= video price
   ↓
3. If insufficient → Show "Deposit Funds" link
   ↓
4. If sufficient → Show confirmation modal
   ↓
5. User confirms purchase
   ↓
6. Transaction starts (MongoDB transaction):
   - Deduct from user.balance
   - Add video to user.unlockedVideos
   - Create Transaction record
   - Increment video.purchases
   - Increment video.earnings
   ↓
7. Commit transaction
   ↓
8. Reload video page → Now has access
```

### Video Upload Process

**Cloudinary Upload**:
```
1. User selects video file
   ↓
2. Calculate Cloudinary signature (server-side)
   ↓
3. Direct upload to Cloudinary from browser
   ↓
4. Cloudinary returns public_id and URL
   ↓
5. Save video metadata to MongoDB:
   - title, description, category
   - videoUrl, thumbnailUrl
   - provider: 'cloudinary'
   - status: 'processing'
   ↓
6. Cloudinary processes (transcoding, thumbnails)
   ↓
7. Webhook updates status to 'ready'
```

**AWS S3 Upload**:
```
1. User selects video file
   ↓
2. Request presigned URL from server
   ↓
3. Server generates presigned URL (valid 1 hour)
   ↓
4. Client uploads directly to S3
   ↓
5. On complete → Save metadata with S3 key
   ↓
6. Optional: Trigger MediaConvert for HLS
```

### Search & Filtering Logic

**Query Building**:
```javascript
// Start with base query
let query = {};

// Add search
if (search) {
  query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { tags: { $in: [new RegExp(search, 'i')] } }
  ];
}

// Add category filter
if (category) {
  query.category = categoryId;
}

// Add payment filter
if (filter === 'premium') {
  query.isPaid = true;
} else if (filter === 'free') {
  query.isPaid = false;
}

// Set sort
let sort = {};
if (sortBy === 'views') sort = { views: -1 };
else if (sortBy === 'newest') sort = { createdAt: -1 };
else if (sortBy === 'likes') sort = { likesCount: -1 };

// Execute with pagination
const videos = await Video.find(query)
  .sort(sort)
  .limit(12)
  .skip((page - 1) * 12)
  .populate('owner', 'username profilePicture');
```

### Progress Tracking Logic

**Save Progress**:
```javascript
// Every 10 seconds while playing
setInterval(async () => {
  if (videoRef.current && videoRef.current.currentTime > 0) {
    const progress = {
      progressPercent: (currentTime / duration) * 100,
      lastPositionSec: currentTime,
      watchDurationSec: currentTime
    };
    
    await fetch(`/api/videos/${videoId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progress)
    });
  }
}, 10000);
```

**Resume Logic**:
```javascript
// On video load
useEffect(() => {
  const fetchProgress = async () => {
    const res = await fetch(`/api/videos/${videoId}/progress`);
    const { progress } = await res.json();
    
    if (progress && videoRef.current) {
      videoRef.current.currentTime = progress.lastPositionSec;
    }
  };
  
  if (searchParams.get('resume') === 'true') {
    fetchProgress();
  }
}, [videoId]);
```

---

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
**Purpose**: Create new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "username": "johndoe",
    "roles": ["user"]
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST `/api/auth/login`
**Purpose**: Authenticate user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "user": { /* user object */ },
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### POST `/api/auth/refresh`
**Purpose**: Get new access token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGc..."
}
```

### Video Endpoints

#### GET `/api/videos`
**Purpose**: List videos with filtering

**Query Parameters**:
- `search` (string): Search term
- `category` (string): Category slug
- `sort` (string): views | newest | likes | premium | free
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)

**Response** (200):
```json
{
  "videos": [
    {
      "_id": "...",
      "title": "Javascript Tutorial",
      "description": "...",
      "thumbnailUrl": "...",
      "views": 1250,
      "likesCount": 45,
      "isPaid": false,
      "price": 0,
      "owner": {
        "_id": "...",
        "username": "teacher1",
        "profilePicture": "..."
      },
      "category": {
        "_id": "...",
        "name": "Programming",
        "slug": "programming"
      },
      "createdAt": "2024-01-15T...",
      "duration": 1843
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "total": 58,
    "limit": 12
  }
}
```

#### GET `/api/videos/[id]`
**Purpose**: Get single video details

**Headers**:
- `Authorization`: Bearer {accessToken} (optional)

**Response** (200):
```json
{
  "video": { /* full video object */ },
  "canAccess": true,
  "purchased": false,
  "subscribed": false
}
```

#### POST `/api/videos/[id]/like`
**Purpose**: Like or dislike video

**Headers**:
- `Authorization`: Bearer {accessToken} (required)

**Request Body**:
```json
{
  "action": "like"  // or "dislike" or "unlike"
}
```

**Response** (200):
```json
{
  "message": "Video liked",
  "likesCount": 46,
  "dislikesCount": 2
}
```

#### POST `/api/videos/[id]/progress`
**Purpose**: Save watch progress

**Headers**:
- `Authorization`: Bearer {accessToken} (required)

**Request Body**:
```json
{
  "progressPercent": 45.5,
  "lastPositionSec": 273,
  "watchDurationSec": 273
}
```

**Response** (200):
```json
{
  "message": "Progress saved"
}
```

### Admin Endpoints

#### GET `/api/admin/deposits/pending`
**Purpose**: Get pending deposits

**Headers**:
- `Authorization`: Bearer {adminAccessToken}

**Response** (200):
```json
{
  "deposits": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "username": "john",
        "email": "john@example.com"
      },
      "amount": 50000,  // in cents (500 ETB)
      "screenshotUrl": "...",
      "status": "pending",
      "createdAt": "2024-01-15T..."
    }
  ]
}
```

#### POST `/api/admin/deposits/[id]/approve`
**Purpose**: Approve deposit

**Headers**:
- `Authorization`: Bearer {adminAccessToken}

**Response** (200):
```json
{
  "message": "Deposit approved",
  "deposit": { /* updated deposit */ }
}
```

---

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  username: String (unique, required),
  password: String (hashed, required),
  profilePicture: String (URL),
  bio: String,
  
  // Financial
  balance: Number (default: 0, in cents),
  unlockedVideos: [ObjectId] (ref: 'Video'),
  
  // Subscription
  subscriptionExpiresAt: Date,
  isSubscribed: Boolean (virtual),
  
  // Roles
  roles: [String] (enum: ['user', 'creator', 'admin']),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}

// Indexes
email: unique
username: unique
```

### Video Model

```javascript
{
  _id: ObjectId,
  
  // Ownership
  owner: ObjectId (ref: 'User', required),
  
  // Content
  title: String (required),
  description: String,
  tags: [String],
  category: ObjectId (ref: 'Category'),
  
  // Media
  videoUrl: String (required),
  thumbnailUrl: String,
  duration: Number (seconds),
  provider: String (enum: ['cloudinary', 's3']),
  
  // Access Control
  isPaid: Boolean (default: false),
  price: Number (cents, default: 0),
  
  // Analytics
  views: Number (default: 0),
  purchases: Number (default: 0),
  earnings: Number (default: 0),
  
  // Engagement
  likesCount: Number (default: 0),
  dislikesCount: Number (default: 0),
  likedBy: [ObjectId] (ref: 'User'),
  dislikedBy: [ObjectId] (ref: 'User'),
  
  // Status
  status: String (enum: ['processing', 'ready', 'failed']),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}

// Indexes
owner: 1
category: 1
createdAt: -1
views: -1
likesCount: -1
```

### Transaction Model

```javascript
{
  _id: ObjectId,
  
  // Parties
  user: ObjectId (ref: 'User', required),
  
  // Transaction Details
  type: String (enum: ['deposit', 'purchase', 'subscription']),
  amount: Number (cents, required),
  
  // Status
  status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  
  // Related
  video: ObjectId (ref: 'Video'),  // if type: 'purchase'
  
  // Metadata
  description: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}

// Indexes
user: 1
type: 1
status: 1
createdAt: -1
```

### WatchProgress Model

```javascript
{
  _id: ObjectId,
  
  // References
  user: ObjectId (ref: 'User', required),
  video: ObjectId (ref: 'Video', required),
  
  // Progress
  progressPercent: Number (0-100),
  lastPositionSec: Number,
  watchDurationSec: Number,
  
  // Timestamps
  updatedAt: Date,
  createdAt: Date
}

// Compound Index
user + video: unique
```

---

## Security Implementation

### 1. **Authentication Security**

**Password Hashing**:
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
```

**JWT Tokens**:
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- Signed with secret from env variable
- Stored in localStorage (consider httpOnly cookies for production)

**Example**:
```javascript
const jwt = require('jsonwebtoken');

const accessToken = jwt.sign(
  { userId: user._id, roles: user.roles },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);
```

### 2. **Authorization**

**Middleware Chain**:
```javascript
// Verify token
const requireAuth = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  return user;
};

// Check admin role
const requireAdmin = async (req) => {
  const user = await requireAuth(req);
  if (!user.roles.includes('admin')) {
    throw new Error('Unauthorized');
  }
  return user;
};
```

### 3. **Input Validation**

**Zod Schemas**:
```javascript
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100)
});

// In API route
const body = registerSchema.parse(await req.json());
```

### 4. **API Rate Limiting**
*(Recommended for production)*
```javascript
// Implement with next-rate-limit or similar
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

### 5. **CORS Configuration**
```javascript
// In middleware
const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];
const origin = req.headers.origin;

if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

### 6. **Content Security**

**Cloudinary Signed URLs**:
```javascript
const cloudinary = require('cloudinary').v2;

const signedUrl = cloudinary.url(publicId, {
  sign_url: true,
  type: 'authenticated',
  expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
});
```

**XSS Prevention**:
- React automatically escapes output
- Sanitize user input in comments
- Use Content Security Policy headers

**SQL Injection Prevention**:
- MongoDB parameterized queries via Mongoose
- No direct string concatenation in queries

---

## Performance Optimizations

### 1. **Image Optimization**
- Next.js Image component with lazy loading
- Cloudinary transformations (resize, format, quality)
- WebP format with fallback

### 2. **Video Optimization**
- HLS adaptive bitrate streaming
- Cloudinary video transcoding
- CDN delivery (Cloudinary CDN)

### 3. **Database Optimization**
- Indexes on frequently queried fields
- Populate only needed fields
- Pagination to limit results
- Aggregation pipelines for analytics

### 4. **Caching**
- Next.js automatic page caching
- API route caching with revalidation
- Browser caching for static assets

### 5. **Code Splitting**
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Lazy loading for below-fold content

---

## Deployment Guide

### Environment Variables Required

```env
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=ethioxhub-videos

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...

# App
NEXT_PUBLIC_APP_URL=https://ethioxhub.com
```

### Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Development
npm run dev
```

### Deployment Platforms

**Vercel (Recommended)**:
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

**Other Options**:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

---

## Maintenance & Monitoring

### Regular Tasks
1. **Database Backups**: Daily automated backups
2. **Log Monitoring**: Check error logs weekly
3. **Security Updates**: Update dependencies monthly
4. **Performance Monitoring**: Check load times
5. **User Feedback**: Review support tickets

### Key Metrics to Track
- Active users (daily/monthly)
- Video views
- Conversion rate (visitor → subscriber)
- Average session duration
- Error rates
- API response times

---

## Future Enhancements

### Planned Features
1. **Live Streaming**: Real-time course sessions
2. **Quizzes**: Interactive assessments
3. **Certificates**: Course completion certificates
4. **Mobile Apps**: iOS and Android apps
5. **Social Features**: User profiles, following
6. **AI Recommendations**: ML-based content suggestions
7. **Analytics Dashboard**: Creator insights
8. **Automated Payments**: Chapa/Stripe integration

---

## Support & Contact

**Documentation**: `/docs` folder
**API Reference**: This document
**Technical Support**: admin@ethioxhub.com
**Bug Reports**: GitHub Issues (if applicable)

---

**Last Updated**: 2025-12-15  
**Version**: 1.0.0  
**Author**: EthioxHub Development Team
