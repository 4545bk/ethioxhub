# S3 CORS Fix - The Real Problem

## The Issue

You're seeing **CORS errors** even though you think you configured CORS. This means one of:

1. **CORS config didn't save** properly in S3
2. **CORS config has wrong format** (JSON vs array)
3. **Browser cache** is showing old errors

## ✅ CORRECT CORS Configuration

AWS S3 CORS configuration must be **JSON ARRAY** format (with square brackets `[]`):

### Go to AWS S3 Console:
1. Open your `ethioxhub` bucket
2. Click **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit**

### Paste EXACTLY this (copy the whole thing including the `[` and `]`):

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://ethioxhub.vercel.app",
            "https://*.vercel.app"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type",
            "Accept-Ranges",
            "Content-Range"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**CRITICAL:** 
- Must start with `[` and end with `]`
- Must be valid JSON
- Click **Save changes**

## Test the Configuration

### Method 1: Use Test Page

1. **Navigate to:** `http://localhost:3000/test-s3-cors`
2. **Get a video URL** from S3:
   - Go to AWS S3 Console
   - Click on a video file
   - Copy the "Object URL"
3. **Paste URL** in the test page
4. **Click both test buttons**
5. **Check results:**
   - ✅ Should show status 200
   - ✅ Should show CORS headers
   - ✅ Video should load

### Method 2: Browser Console Test

Open browser console and paste:

```javascript
// Replace with your actual video URL
const testUrl = 'https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/your-video.mp4';

// Test CORS
fetch(testUrl, { method: 'HEAD', mode: 'cors' })
    .then(r => {
        console.log('✅ Status:', r.status);
        console.log('✅ CORS header:', r.headers.get('access-control-allow-origin'));
    })
    .catch(e => console.error('❌ CORS Error:', e.message));

// Test video element
const video = document.createElement('video');
video.crossOrigin = 'anonymous';
video.src = testUrl;
video.onloadedmetadata = () => console.log('✅ Video loaded, duration:', video.duration);
video.onerror = (e) => console.error('❌ Video error:', e.target.error);
```

## Common CORS Mistakes

### ❌ Wrong Format (Missing Array Brackets):
```json
{
    "AllowedHeaders": ["*"],
    ...
}
```
**Should be:**
```json
[
    {
        "AllowedHeaders": ["*"],
        ...
    }
]
```

### ❌ Wrong Origin Format:
```json
"AllowedOrigins": ["localhost:3000"]  // ❌ Missing http://
```
**Should be:**
```json
"AllowedOrigins": ["http://localhost:3000"]  // ✅ With protocol
```

### ❌ Missing ExposeHeaders:
```json
"ExposeHeaders": []  // ❌ Empty
```
**Should be:**
```json
"ExposeHeaders": ["Content-Length", "Content-Type"]  // ✅ Required headers
```

## After Saving CORS Config

### Clear Browser Cache:
1. **Hard reload:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Or clear cache:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

### Check Network Tab:
1. Open DevTools (F12)
2. Go to **Network** tab
3. **Hover over** an S3 video
4. **Look for** the video request
5. **Click on it**
6. **Check Response Headers:**
   - Should see: `access-control-allow-origin: *` or your domain
   - Should see: `access-control-expose-headers: ...`

## If Still Not Working

### Double-Check S3 URL Format

Your S3 bucket is in `eu-north-1` (Stockholm).

**Correct URL format:**
```
https://ethioxhub.s3.eu-north-1.amazonaws.com/path/to/video.mp4
```

**Also valid (virtual-hosted style):**
```
https://ethioxhub.s3.amazonaws.com/path/to/video.mp4
```

**Both should work with CORS.**

### Verify File Permissions

In S3 Console:
1. Click on a video file
2. Go to **Permissions** tab
3. Check **Object ownership**
4. Should allow public read

### Check Bucket Policy

Make sure you have:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::ethioxhub/*"
        }
    ]
}
```

## Quick Diagnosis

Run this in browser console on your app page:

```javascript
// Check if fetch works (basic access)
fetch('https://ethioxhub.s3.eu-north-1.amazonaws.com/')
    .then(r => console.log('Bucket accessible:', r.ok))
    .catch(e => console.log('Bucket error:', e.message));

// Check if CORS works
fetch('https://ethioxhub.s3.eu-north-1.amazonaws.com/', {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
})
    .then(r => {
        console.log('CORS works!');
        console.log('Headers:', {
            cors: r.headers.get('access-control-allow-origin'),
            expose: r.headers.get('access-control-expose-headers')
        });
    })
    .catch(e => console.log('CORS failed:', e.message));
```

## Summary

**Most Common Issue:** CORS configuration format is wrong or didn't save.

**Fix:**
1. ✅ Go back to S3 CORS settings
2. ✅ Delete everything
3. ✅ Copy-paste the EXACT config from above (including `[` and `]`)
4. ✅ Click Save
5. ✅ Hard reload browser (Ctrl+Shift+R)
6. ✅ Test with test page or console commands

**Then hover previews will work!** ✨
