# 🚀 PRODUCTION DEPLOYMENT GUIDE

## Pre-Deployment Checklist

### ✅ Code & Features
- [x] All features tested and working
- [x] Anti-fraud system implemented
- [x] Security measures in place
- [x] No console errors
- [x] Performance optimized
- [x] Bilingual support (EN/AM)
- [x] Referral system working
- [x] Video hover preview fixed
- [x] Related videos working

### ✅ Configuration

#### 1. Environment Variables (.env.production)

Create `.env.production` with:

```env
# ==================== DATABASE ====================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ethioxhub?retryWrites=true&w=majority

# ==================== JWT SECRETS ====================
# IMPORTANT: Generate unique secrets for production!
# Use: openssl rand -base64 32
JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECRET_STRING_32_CHARS_MIN
JWT_REFRESH_SECRET=CHANGE_THIS_TO_DIFFERENT_RANDOM_SECRET

# ==================== CLOUDINARY ====================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# ==================== AWS S3 (if using) ====================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# ==================== TELEGRAM ====================
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-telegram-chat-id

# ==================== GOOGLE OAUTH ====================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ==================== APPLICATION ====================
NEXT_PUBLIC_API_URL=https://your-domain.com
NODE_ENV=production
PORT=3000

# ==================== RATE LIMITING ====================
RATE_LIMIT_ENABLED=true

# ==================== SECURITY ====================
SECURE_COOKIES=true
```

#### 2. Generate Secure Secrets

**On Linux/Mac:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
# Generate random base64 string
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
# From project root
vercel

# For production
vercel --prod
```

#### Step 4: Configure Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from `.env.production`

#### Step 5: Custom Domain
1. Domains tab in Vercel
2. Add your domain
3. Configure DNS (provided by Vercel)

---

### Option 2: VPS (Ubuntu/Debian)

#### Prerequisites
- Ubuntu 20.04+ or Debian 11+
- Node.js 18+ installed
- MongoDB (local or cloud)
- PM2 for process management

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx
```

#### Step 2: Clone & Setup Project
```bash
# Clone repository
git clone https://github.com/your-repo/ethioxhub.git
cd ethioxhub

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.production
nano .env.production  # Edit with your values

# Build application
npm run build
```

#### Step 3: Start with PM2
```bash
# Start application
pm2 start npm --name "ethioxhub" -- start

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it provides

# Check status
pm2 status
```

#### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/ethioxhub
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ethioxhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 3: Railway

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login & Deploy
```bash
railway login
railway init
railway up
```

#### Step 3: Add Environment Variables
```bash
# In Railway dashboard or via CLI
railway variables set MONGODB_URI="your-connection-string"
railway variables set JWT_SECRET="your-secret"
# ... add all variables
```

---

## Database Setup (MongoDB Atlas)

### Step 1: Create Cluster
1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Username/password authentication
4. Allow access from anywhere (0.0.0.0/0) OR specific IPs

### Step 2: Get Connection String
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ethioxhub?retryWrites=true&w=majority
```

### Step 3: Create Database & Collections
Collections are auto-created, but you can set indexes:

```javascript
// Run in MongoDB Atlas shell or Compass
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.videos.createIndex({ status: 1, createdAt: -1 });
db.videos.createIndex({ category: 1, views: -1 });
```

---

## Post-Deployment Steps

### 1. Verify Deployment
```bash
# Check if site is accessible
curl https://your-domain.com

# Check API
curl https://your-domain.com/api/videos

# Check health (create a health endpoint)
curl https://your-domain.com/api/health
```

### 2. Create Admin Account
```bash
# Method 1: Via API (if you have a special admin-create endpoint)
# Method 2: Manually in database
```

In MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { roles: ["admin"] } }
);
```

### 3. Test Critical Paths
- [ ] User registration
- [ ] User login
- [ ] Video upload (admin)
- [ ] Video purchase
- [ ] Deposit request
- [ ] Deposit approval (Telegram)
- [ ] Referral system
- [ ] Notifications

### 4. Monitor Logs
```bash
# PM2 logs
pm2 logs ethioxhub

# Vercel logs
vercel logs

# Railway logs
railway logs
```

---

## Security Hardening

### 1. Update All Secrets
```bash
# Generate new JWT secrets
# Never use development secrets in production!
```

### 2. Database Security
- [ ] Enable MongoDB authentication
- [ ] Restrict IP whitelist
- [ ] Use connection string with auth
- [ ] Regular backups enabled

### 3. Application Security
- [ ] HTTPS enabled (SSL certificate)
- [ ] Secure cookies (`secure: true`)
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Fraud detection enabled

### 4. Server Security (VPS)
```bash
# Firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Fail2ban (prevent brute force)
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## Monitoring & Maintenance

### Error Tracking
**Recommended:** Sentry.io

```bash
npm install --save @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Performance Monitoring
- Vercel Analytics (built-in)
- Google Analytics
- LogRocket (session replay)

### Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

### Backup Strategy
```bash
# MongoDB Atlas: Automatic backups enabled by default
# Verify in Atlas dashboard: Database → Backup

# Manual backup script (if self-hosted MongoDB)
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)
```

---

## Scaling Considerations

### When to Scale
- Response time > 2 seconds
- CPU > 70% consistently
- Memory > 80% consistently
- Database connections maxing out

### Horizontal Scaling
- Multiple Vercel instances (automatic)
- PM2 cluster mode: `pm2 start npm --name ethioxhub -i max -- start`
- Load balancer (nginx/HAProxy)

### Database Scaling
- MongoDB Atlas: Upgrade tier
- Add read replicas
- Implement caching (Redis)

---

## Troubleshooting

### Issue: 500 Internal Server Error
```bash
# Check logs
pm2 logs ethioxhub --lines 100

# Check environment variables
pm2 env ethioxhub

# Restart application
pm2 restart ethioxhub
```

### Issue: Database Connection Failed
```bash
# Test connection
mongosh "mongodb+srv://..."

# Check IP whitelist
# Verify credentials
# Check network access
```

### Issue: High Memory Usage
```bash
# Check memory
pm2 monit

# Increase memory limit (if needed)
NODE_OPTIONS=--max_old_space_size=4096 pm2 start ...

# Or optimize:
npm run build  # Rebuild optimized version
```

---

## Success Criteria

### ✅ Deployment Successful If:
- [ ] Website loads on custom domain
- [ ] HTTPS enabled (green padlock)
- [ ] Can create user account
- [ ] Can login
- [ ] Videos display correctly
- [ ] Admin can upload videos
- [ ] Payments/deposits work
- [ ] No errors in console
- [ ] Performance acceptable (<2s load)

---

## 🎉 You're Live!

Your EthioxHub platform is now deployed and ready for production use!

**Post-Launch:**
1. Monitor error logs daily
2. Check analytics regularly
3. Review fraud detection logs
4. Backup database weekly
5. Update dependencies monthly
6. Scale as needed

**Support:**
- Documentation: `/docs` folder
- Security: `/docs/SECURITY_ANTI_FRAUD_COMPLETE.md`
- Technical: `TECHNICAL_DOCUMENTATION.md`

**Congratulations!** 🚀
