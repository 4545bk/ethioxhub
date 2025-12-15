# EthioxHub Deployment Guide

## Prerequisites Checklist
- [ ] MongoDB Atlas account created
- [ ] Cloudinary account created
- [ ] Telegram Bot created
- [ ] GitHub repository ready (for Vercel)
- [ ] Domain name (optional but recommended)

---

## Step 1: MongoDB Atlas Setup

### 1.1 Create Cluster
1. Go to [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. Sign up or log in
3. Click **Build a Database**
4. Choose **M0 Free** tier
5. Select region closest to your users
6. Click **Create**

### 1.2 Create Database User
1. Security → Database Access → **Add New Database User**
2. Choose **Password** authentication
3. Username: `ethioxhub_user`
4. Password: Generate secure password (save it!)
5. Database User Privileges: **Read and write to any database**
6. Click **Add User**

### 1.3 Configure Network Access
1. Security → Network Access → **Add IP Address**
2. For Vercel: Click **Allow Access from Anywhere** (`0.0.0.0/0`)
3. For VPS: Add your server's specific IP
4. Click **Confirm**

### 1.4 Get Connection String
1. Deployment → Database → **Connect**
2. Choose **Connect your application**
3. Driver: **Node.js**
4. Copy connection string:
   ```
   mongodb+srv://ethioxhub_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `mongodb+srv://...mongodb.net/ethioxhub?retryWrites=true&w=majority`

---

## Step 2: Cloudinary Setup

### 2.1 Create Account
1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up
3. Verify email

### 2.2 Get API Credentials
1. Go to Dashboard
2. Copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2.3 Create Upload Preset
1. Settings → Upload → **Add upload preset**
2. Preset name: `ethioxhub_uploads`
3. Signing Mode: **Signed**
4. Folder: Leave empty (will be set programmatically)
5. Under **Eager Transformations**, add:
   - Format: `m3u8`
   - Streaming profile: `hd`
6. Click **Save**

### 2.4 Configure Webhook (After Deployment)
1. Settings → Notifications
2. Notification URL: `https://yourdomain.com/api/cloudinary/webhook`
3. Events: Enable **upload** and **eager**
4. Click **Save**

---

## Step 3: Telegram Bot Setup

### 3.1 Create Bot
1. Open Telegram → Search for `@BotFather`
2. Send `/newbot`
3. Enter bot name: `EthioxHub Admin Bot`
4. Enter username: `ethioxhub_admin_bot` (must be unique)
5. Copy bot token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 3.2 Create Admin Group
1. Create a new Telegram group
2. Add your bot to the group
3. Make bot an admin (Settings → Administrators → Add Administrator)

### 3.3 Get Chat ID
1. Forward any message from your group to `@userinfobot`
2. Bot will reply with chat details
3. Copy **id** field (should be negative, e.g., `-1001234567890`)

Alternatively, use this method:
```bash
# Replace <BOT_TOKEN> with your bot token
curl https://api.telegram.org/bot<BOT_TOKEN>/getUpdates

# Send a message in the group, then run again
# Look for "chat":{"id":-1001234567890,...}
```

### 3.4 Set Webhook (After Deployment)
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
```

---

## Step 4: Generate JWT Secrets

Run this in terminal:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output for `.env` file.

---

## Step 5: Vercel Deployment

### 5.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/ethioxhub.git
git push -u origin main
```

### 5.2 Deploy to Vercel
1. Go to [https://vercel.com/](https://vercel.com/)
2. Sign up with GitHub
3. Click **Add New... → Project**
4. Import your GitHub repository
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Leave build settings as default

### 5.3 Add Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ethioxhub
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_ADMIN_CHAT_ID=-1001234567890
JWT_SECRET=your_64_char_hex_from_step4
JWT_REFRESH_SECRET=your_another_64_char_hex
REDIS_URL=redis://...  # Optional, if using Upstash
NEXT_PUBLIC_APP_URL=  # Leave empty, Vercel auto-sets
PLATFORM_FEE_PERCENT=10
NODE_ENV=production
```

Make sure to select **All Environments** (Production, Preview, Development).

### 5.4 Deploy
1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Visit deployment URL: `https://ethioxhub-xxx.vercel.app`

---

## Step 6: Post-Deployment Configuration

### 6.1 Update Cloudinary Webhook
1. Cloudinary Dashboard → Settings → Notifications
2. Notification URL: `https://ethioxhub-xxx.vercel.app/api/cloudinary/webhook`
3. Save

### 6.2 Set Telegram Webhook
Replace `<BOT_TOKEN>` and `<YOUR_DOMAIN>`:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://ethioxhub-xxx.vercel.app/api/telegram/webhook"
```

Verify:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Should return: `"url": "https://ethioxhub-xxx.vercel.app/api/telegram/webhook"`

### 6.3 Create Admin User
1. Register a user via the app OR use MongoDB Compass
2. Connect to your MongoDB Atlas cluster
3. Find your user in `ethioxhub.users` collection
4. Update document:
   ```javascript
   {
     "email": "admin@example.com",
     "roles": ["user", "admin"]  // Add "admin" to roles array
   }
   ```

---

## Step 7: Testing End-to-End

### 7.1 Test Authentication
```bash
# Register
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 7.2 Test Deposit Flow
1. Login as user
2. Request upload signature: `GET /api/upload/sign?purpose=deposit`
3. Upload image to Cloudinary (use Postman or frontend)
4. Create deposit: `POST /api/deposits/create` with screenshot URL
5. Check Telegram admin group → should receive notification
6. Click **Approve** button in Telegram
7. Verify user balance updated: `GET /api/auth/me`

### 7.3 Test Video Upload
1. Request signature: `GET /api/upload/sign?purpose=video`
2. Upload video to Cloudinary
3. Create video: `POST /api/videos/create`
4. Check video status updates via webhook
5. Admin: Approve video in moderation queue

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Domain in Vercel
1. Vercel Dashboard → Project → Settings → Domains
2. Enter your domain: `ethioxhub.com`
3. Follow DNS configuration instructions

### 8.2 Update Environment Variables
1. Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to `https://ethioxhub.com`
3. Redeploy

### 8.3 Update Webhooks
Update Cloudinary and Telegram webhooks with new domain.

---

## Troubleshooting

### Deployment Fails
- **Error**: `Module not found`
  - **Fix**: Check `package.json` dependencies, run `npm install` locally first

- **Error**: `Environment variable not set`
  - **Fix**: Verify all required env vars in Vercel dashboard

### Database Connection Fails
- **Error**: `MongoServerError: bad auth`
  - **Fix**: Check username/password in connection string

- **Error**: `Connection timeout`
  - **Fix**: Ensure IP whitelist includes `0.0.0.0/0` in MongoDB Atlas

### Telegram Not Receiving Messages
- Check bot token is correct
- Ensure bot is admin in group
- Verify chat ID is negative number
- Run: `curl https://api.telegram.org/bot<TOKEN>/getMe` to test bot

### Cloudinary Webhook Not Triggering
- Verify webhook URL is correct
- Check webhook signature verification in logs
- Test manually: send POST to `/api/cloudinary/webhook` with valid signature

---

## Production Checklist

Before going live:
- [ ] All environment variables set in production
- [ ] MongoDB backups enabled
- [ ] Cloudinary webhook configured
- [ ] Telegram webhook configured
- [ ] Admin user created and tested
- [ ] Rate limits tested
- [ ] Deposit flow tested end-to-end
- [ ] VIP purchase flow tested
- [ ] SSL certificate valid (Vercel auto)
- [ ] Error tracking setup (Sentry recommended)
- [ ] Monitoring alerts configured

---

**Ready to scale?** See [README.md#scaling-from-free-to-paid](../README.md#scaling-from-free-to-paid) for upgrade paths.
