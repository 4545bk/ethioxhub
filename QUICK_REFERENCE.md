# EthioxHub - Quick Reference Guide

## For Developers

### Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start               # Start production server
npm run lint            # Run ESLint

# Database
# MongoDB connection string in .env
```

### Key Files by Feature

| Feature | Files to Check |
|---------|---------------|
| Homepage | `/src/app/page.js` |
| Video Player | `/src/app/videos/[id]/page.js` |
| Authentication | `/src/app/api/auth/*`, `/src/contexts/AuthContext.js` |
| Video Upload | `/src/app/admin/upload/page.js` |
| Admin Dashboard | `/src/app/admin/page.js` |
| Deposits | `/src/app/api/deposits/*` |
| Progress Tracking | `/src/models/WatchProgress.js` |

### API Routes Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/videos` | GET | List videos |
| `/api/videos/[id]` | GET | Get video |
| `/api/videos/[id]/like` | POST | Like/dislike |
| `/api/videos/[id]/progress` | POST | Save progress |
| `/api/admin/deposits/pending` | GET | Get deposits |

---

## For Content Creators

### Upload Video
1. Go to Admin → Upload Video
2. Fill in details (title, description, category)
3. Set price (0 for free)
4. Select video file
5. Wait for upload
6. Video is ready!

### Check Analytics
- Admin Dashboard shows total views
- Each video shows individual stats
- Check earnings in user balance

---

## For Users

### Watch Free Videos
1. Register/Login
2. Browse homepage
3. Click any free video
4. Enjoy!

### Purchase VIP Video
1. Add funds via deposit
2. Browse VIP videos
3. Click "Purchase"
4. Confirm payment
5. Watch unlimited

### Subscribe
1. Go to Pricing page
2. Choose plan
3. Pay via deposit
4. Access all VIP content

---

## Troubleshooting

### Video Won't Play
- Check internet connection
- Try refreshing page
- Clear browser cache
- Try different browser

### Deposit Not Approved
- Wait for admin review (usually 24h)
- Check Telegram for updates
- Contact support if delayed

### Can't Login
- Check email/password
- Try password reset
- Clear cookies
- Contact support

---

## Security Best Practices

### For Developers
- Never commit `.env` files
- Use environment variables
- Keep dependencies updated
- Validate all user input
- Use prepared statements (Mongoose)
- Implement rate limiting

### For Users
- Use strong passwords
- Don't share account
- Logout on public computers
- Verify bank details before deposit

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 404 on API routes | Check API route file names |
| MongoDB connection error | Verify MONGODB_URI in .env |
| Cloudinary upload fails | Check API keys |
| Video streaming issues | Verify HLS.js is loaded |
| Progress not saving | Check authentication token |

---

## Production Checklist

- [ ] Environment variables set
- [ ] Database backups configured
- [ ] HTTPS enabled
- [ ] Error logging active
- [ ] Rate limiting enabled
- [ ] CDN configured
- [ ] SEO meta tags added
- [ ] Analytics integrated
- [ ] Legal pages (Terms, Privacy)
- [ ] Support contact set up

---

**Full Documentation**: See `TECHNICAL_DOCUMENTATION.md`
