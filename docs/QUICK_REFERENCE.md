# EthioxHub - Quick Reference Guide

## 🚀 Quick Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run test:e2e     # Run E2E tests
```

### Create Admin User
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { roles: ["user", "admin"] } }
)
```

---

## 📋 Key URLs (Development)

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Deposit**: http://localhost:3000/deposit
- **My Deposits**: http://localhost:3000/my-deposits
- **Admin Dashboard**: http://localhost:3000/admin
- **Upload Video**: http://localhost:3000/admin/videos/upload

---

## 🔑 Key Endpoints

### Public
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/videos` - List videos
- `GET /api/videos/[id]` - Video details

### Authenticated
- `POST /api/deposits/create` - Submit deposit
- `GET /api/deposits/my-deposits` - My deposits
- `POST /api/videos/[id]/purchase` - Purchase video
- `GET /api/videos/[id]/playtoken` - Get playback URL

### Admin Only
- `GET /api/admin/deposits/pending` - Pending deposits
- `POST /api/admin/deposits/approve` - Approve deposit
- `POST /api/admin/videos/upload` - Upload video
- `GET /api/admin/videos/pending` - Pending videos

---

## 💡 Common Tasks

### Upload Video (Admin)
1. Go to `/admin/videos/upload`
2. Select storage provider (Cloudinary or AWS S3)
3. Fill in title, description, category
4. Set as Free or Premium (with price)
5. Select video file and thumbnail
6. Click "Upload Video"

### Process Deposit (Admin)
1. User submits deposit at `/deposit`
2. Telegram notification sent to admin group
3. Click "✅ Approve" or "❌ Reject" in Telegram
4. Balance updated automatically
5. User sees updated balance

### Purchase VIP Video (User)
1. Browse videos at `/`
2. Click on premium video
3. Click "Purchase" button
4. Balance deducted, video unlocked
5. Watch with playback token

---

## 🐛 Debugging Tips

### Check Logs
```bash
# In terminal running npm run dev
# All errors and actions are logged to console
```

### Test API Endpoints
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Use returned token for authenticated requests
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### MongoDB Queries
```javascript
// Check user balance
db.users.findOne({ email: "user@example.com" })

// List pending deposits
db.transactions.find({ type: "deposit", status: "pending" })

// List approved videos
db.videos.find({ status: "approved" })
```

---

## 🔧 Troubleshooting

### Token Expired Error
**Solution**: Refresh token or login again
```javascript
// Frontend calls /api/auth/refresh automatically
```

### Upload Failed
**Check**:
1. Cloudinary credentials correct?
2. S3 CORS configured?
3. File size within limits?
4. User has auth token?

### Telegram Not Working
**Check**:
1. Bot token correct?
2. Admin chat ID correct (negative number)?
3. Webhook set?
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### Deposit Not Approved
**Check**:
1. Callback token not expired (1 hour)?
2. Admin verified via chat ID?
3. Transaction status still pending?

---

## 📊 Balance Format

**Always in CENTS**:
- 1 ETB = 100 cents
- 100 ETB = 10,000 cents
- 2,500 cents = 25 ETB

**Convert**:
```javascript
// Cents to ETB (display)
const etb = cents / 100;

// ETB to cents (store)
const cents = etb * 100;
```

---

## 🔐 Roles

### User
- Upload videos (pending moderation)
- Purchase VIP videos
- Submit deposits
- View own history

### Moderator
- Approve/reject videos
- View pending content
- **Cannot** approve deposits

### Admin
- Everything moderator can do
- Approve/reject deposits
- Upload videos (auto-approved)
- Manage users
- View all transactions

---

## 📦 Environment Setup

### Minimal (Development)
```env
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
```

### With S3 (Production)
Add these:
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=ethioxhub
```

---

## 🎬 Video Upload Flow

### Cloudinary
```
1. Get signature from /api/upload/sign
2. Upload directly to Cloudinary from browser
3. Cloudinary processes video (HLS)
4. Webhook updates status to "approved"
5. Video appears on platform
```

### AWS S3
```
1. Get presigned URL from /api/upload/sign?provider=s3
2. PUT video directly to S3 from browser
3. Upload thumbnail to Cloudinary (optional)
4. Save metadata to DB
5. Video appears on platform
6. Playback uses signed GET URLs (1-hour expiry)
```

---

## 💰 Money Flow

### Deposit
```
User → Screenshot → Admin Approves → Balance += Amount
```

### Purchase
```
Buyer.balance -= Price
Creator.balance += (Price × 0.9)
Platform.earnings += (Price × 0.1)
Buyer.unlockedVideos.push(videoId)
```

### Atomicity
```javascript
// All in ONE transaction
session.startTransaction();
  - Update user balance
  - Update creator balance
  - Create transaction record
  - Add to unlocked videos
session.commitTransaction();
// If ANY fails, ALL rollback
```

---

## 🚨 Security Checklist

### Before Going Live
- [ ] Change JWT secrets
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set rate limits aggressively
- [ ] Test deposit approval flow
- [ ] Test purchase atomicity
- [ ] Verify Telegram webhooks
- [ ] Test S3 CORS
- [ ] Set up monitoring (Sentry)
- [ ] Configure database backups
- [ ] Review admin access logs

---

## 📱 Telegram Commands

### Admin Notifications

**Deposit**:
```
💰 New Deposit Request
👤 User: username
💵 Amount: 1,000.00 ETB
[✅ Approve] [❌ Reject]
```

**Video**:
```
🎬 New Video Uploaded
👤 User: username
📹 Title: Video Title
[✅ Approve] [❌ Reject]
```

### Button Actions
- `✅ Approve` → Calls `/api/admin/deposits/approve`
- `❌ Reject` → Calls `/api/admin/deposits/reject`
- Buttons disabled after click
- Token expires after 1 hour

---

## 🔍 Database Queries

### Find User
```javascript
db.users.findOne({ email: "user@example.com" })
```

### Check Balance
```javascript
db.users.findOne(
  { email: "user@example.com" },
  { balance: 1, reservedBalance: 1 }
)
```

### List Pending Deposits
```javascript
db.transactions.find({
  type: "deposit",
  status: "pending"
}).sort({ createdAt: -1 })
```

### List VIP Videos
```javascript
db.videos.find({
  isPaid: true,
  status: "approved"
}).sort({ createdAt: -1 })
```

### Check User Purchases
```javascript
db.users.findOne(
  { email: "user@example.com" },
  { unlockedVideos: 1 }
).populate('unlockedVideos')
```

---

## 🧪 Test Workflows

### 1. Create User → Deposit → Purchase Flow
```bash
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Submit deposit (need screenshot URL first)
curl -X POST http://localhost:3000/api/deposits/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"cloudinaryUrl":"...","cloudinaryId":"...","metadata":{...}}'

# 4. Admin approves (via Telegram or API)

# 5. Purchase video
curl -X POST http://localhost:3000/api/videos/VIDEO_ID/purchase \
  -H "Authorization: Bearer TOKEN"
```

---

## 📚 Learn More

- **Full Documentation**: `docs/COMPLETE_FEATURES.md`
- **README**: `README.md`
- **API Reference**: Check individual route files in `src/app/api/`

---

**Last Updated**: December 12, 2025
