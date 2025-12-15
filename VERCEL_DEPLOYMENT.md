# 🚀 VERCEL DEPLOYMENT GUIDE

## ✅ GitHub Successfully Pushed!

Your code is now on GitHub: **https://github.com/4545bk/ethioxhub**

---

## 📋 Next: Deploy to Vercel

### Method 1: Vercel Dashboard (Easiest - RECOMMENDED)

**Step 1:** Go to https://vercel.com/new

**Step 2:** Click "Import Git Repository"

**Step 3:** Select your GitHub repository: `4545bk/ethioxhub`

**Step 4:** Configure Project:
- Framework Preset: **Next.js**
- Root Directory: `./`
- Build Command: `npm run build` (auto-detected)
- Output Directory: `.next` (auto-detected)

**Step 5:** Add Environment Variables (IMPORTANT!)

Click "Environment Variables" and add these:

```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/ethioxhub?retryWrites=true&w=majority

JWT_SECRET=<Generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<Generate with: openssl rand -base64 32>

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name

TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-telegram-chat-id

NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-project-name.vercel.app
```

**Optional (if using AWS S3):**
```
AWS_ACCESS_KEY_ID=your-actual-aws-key
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
```

**Optional (if using Google OAuth):**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Step 6:** Click "Deploy"

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your application
4. Deploy to production

**⏱️ Wait time:** ~3-5 minutes

**Step 7:** Get your live URL!

Your site will be live at: `https://ethioxhub.vercel.app` (or custom name)

---

### Method 2: Vercel CLI (Alternative)

If you prefer command line:

**Step 1:** Install Vercel CLI
```bash
npm install -g vercel
```

**Step 2:** Login
```bash
vercel login
```

**Step 3:** Link to GitHub repo
```bash
vercel --prod
```

**Step 4:** Follow prompts:
- Link to existing project? No
- Project name? ethioxhub
- Directory? ./
- Override settings? No

**Step 5:** Add environment variables in dashboard
Go to: https://vercel.com/your-username/ethioxhub/settings/environment-variables

---

## 🔐 IMPORTANT: Generate JWT Secrets

**Before deploying, generate secure secrets:**

**On Windows (PowerShell):**
```powershell
# Generate JWT Secret
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# Generate Refresh Secret (run again for different value)
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Use different values for each secret!**

---

## ✅ Checklist Before Deploying

- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Cloudinary account set up (cloud name, API key, secret ready)
- [ ] Telegram bot created (bot token and admin chat ID ready)
- [ ] JWT secrets generated (2 different values)
- [ ] All environment variables prepared
- [ ] AWS S3 configured (if using)
- [ ] Google OAuth configured (if using)

---

## 🎯 After Deployment

### 1. Test Your Site
- Visit your Vercel URL
- Try creating an account
- Test login/logout
- Check video display
- Test admin features

### 2. Configure Custom Domain (Optional)
In Vercel Dashboard:
1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS instructions

### 3. Set Up MongoDB Atlas IP Whitelist
1. Go to MongoDB Atlas
2. Network Access
3. Add: `0.0.0.0/0` (allow from anywhere)
   OR add Vercel's IP ranges

### 4. Create First Admin UserAfter deployment:
1. Register a user account
2. Go to MongoDB Atlas
3. Find your user in the `users` collection
4. Update: `{ roles: ["admin"] }`

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check for missing dependencies

### 500 Error
- Check Function Logs in Vercel
- Verify MongoDB connection string
- Check JWT secrets are set

### Can't Connect to Database
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Test connection string in MongoDB Compass

### Videos Not Playing
- Verify Cloudinary credentials
- Check video upload to Cloudinary worked
- Test signed URLs are being generated

---

## 📊 Monitoring

**Vercel Analytics** (Free):
- Automatic performance tracking
- Page views
- Load times

**Optional Additions:**
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics

---

## 🎉 You're Almost There!

1. **Go to:** https://vercel.com/new
2. **Import:** Your GitHub repository
3. **Add:** Environment variables
4. **Deploy:** Click the button
5. **Celebrate:** Your site is live! 🚀

Need help with any step? Let me know!
