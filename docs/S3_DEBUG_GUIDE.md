# Quick S3 Video Debugging Guide

## The Issue

S3 CORS is configured correctly ✅, but:
- Hover preview still not working
- Duration badge not showing

This means the problem is **in your database** - S3 videos are missing required fields.

## Step 1: Check Browser Console

1. **Open your app** in browser (`http://localhost:3000`)
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Hover over an S3 video card**
5. **Look for these messages:**

### What You Should See:

**✅ Good - Video Will Work:**
```
[Preview Debug] {
    provider: "s3",
    hasVideoUrl: true,      // ← Should be true
    duration: 120           // ← Should be a number
}
[Preview] Using S3 video URL (time-controlled): https://ethioxhub.s3.eu-north-1.amazonaws.com/...
```

**❌ Bad - Video Won't Work:**
```
[Preview Debug] {
    provider: "s3",
    hasVideoUrl: false,     // ← Problem!
    hasS3Key: false,        // ← Problem!
    duration: undefined     // ← Problem!
}
[Preview] S3 video found but no URL available
```

## Step 2: Check What's in Your Database

Open MongoDB Compass or Mongo Shell and run:

```javascript
// Find one S3 video
db.videos.findOne({ provider: "s3" })
```

**Check if it has these fields:**

### Required for Hover Preview:
```javascript
{
    provider: "s3",
    
    // OPTION 1: Direct URL (best)
    videoUrl: "https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/xxx.mp4",
    
    // OR OPTION 2: S3 Key + Bucket
    s3Key: "videos/xxx.mp4",
    s3Bucket: "ethioxhub",
    
    // Required for duration badge
    duration: 120  // in seconds
}
```

## Step 3: Fix Missing Fields

### If `videoUrl` is Missing:

You uploaded videos to S3, so they have URLs. You need to add them to MongoDB.

**Option A: Add to existing videos manually**
```javascript
// Update one video
db.videos.updateOne(
    { _id: ObjectId("YOUR_VIDEO_ID") },
    { 
        $set: { 
            videoUrl: "https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/your-video.mp4"
        } 
    }
)
```

**Option B: If you have s3Key, construct videoUrl**
```javascript
// Update all S3 videos that have s3Key but no videoUrl
db.videos.updateMany(
    { 
        provider: "s3",
        s3Key: { $exists: true },
        videoUrl: { $exists: false }
    },
    [
        {
            $set: {
                videoUrl: {
                    $concat: [
                        "https://ethioxhub.s3.eu-north-1.amazonaws.com/",
                        "$s3Key"
                    ]
                }
            }
        }
    ]
)
```

### If `duration` is Missing:

**Option A: Set placeholder for testing**
```javascript
// Set 2-minute duration for all S3 videos without duration
db.videos.updateMany(
    { 
        provider: "s3",
        $or: [
            { duration: { $exists: false } },
            { duration: 0 }
        ]
    },
    { 
        $set: { duration: 120 } 
    }
)
```

**Option B: Get actual duration**

You'll need to extract the actual duration from your video files. This requires:
1. Server-side video processing library (like `ffprobe`)
2. Or get it during upload process
3. Or manually for each video

**For now, use placeholder (Option A) just to test.**

## Step 4: Test After Update

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Clear session storage** (in DevTools: Application → Storage → Session Storage → Clear)
3. **Hover over S3 video again**
4. **Check console:**

**Should now see:**
```
[Preview Debug] {
    provider: "s3",
    hasVideoUrl: true,  ✅
    duration: 120       ✅
}
[Preview] Using S3 video URL (time-controlled): https://...
```

**And:**
- ✅ Smooth preview playback
- ✅ Duration badge visible
- ✅ No black screen

## Step 5: Verify S3 URL is Accessible

Test the URL directly:

1. **Copy the URL from console**
   ```
   https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/xxx.mp4
   ```

2. **Open in new browser tab**

3. **Should:**
   - ✅ Play video directly
   - ✅ No 403 error
   - ✅ No CORS error

If video doesn't play in browser directly:
- Check file actually exists in S3
- Check filename/path is correct
- Check region in URL matches bucket region

## Common Issues

### Issue 1: Wrong Region in URL

Your bucket is in `eu-north-1` (Stockholm).

**Correct URL:**
```
https://ethioxhub.s3.eu-north-1.amazonaws.com/video.mp4
```

**Wrong URLs:**
```
https://ethioxhub.s3.amazonaws.com/video.mp4  ❌ (missing region)
https://ethioxhub.s3.us-east-1.amazonaws.com/video.mp4  ❌ (wrong region)
```

### Issue 2: s3Key has extra slashes

**If your s3Key is:** `videos/test.mp4`

**URL should be:**
```
https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/test.mp4
```

**NOT:**
```
https://ethioxhub.s3.eu-north-1.amazonaws.com//videos/test.mp4  ❌ (double slash)
```

### Issue 3: File doesn't exist

Check in AWS S3 Console:
1. Go to your bucket
2. Navigate to the file
3. Copy the actual object key
4. Use that exact key in your database

## Quick Test in Browser Console

Paste this in browser console (while on your app):

```javascript
// Test if S3 URL works
const testUrl = "https://ethioxhub.s3.eu-north-1.amazonaws.com/YOUR-VIDEO-FILE.mp4";

fetch(testUrl, { method: 'HEAD' })
    .then(r => {
        if (r.ok) {
            console.log('✅ S3 URL works! Status:', r.status);
            console.log('✅ CORS headers:', r.headers.get('access-control-allow-origin'));
        } else {
            console.error('❌ S3 URL failed! Status:', r.status);
        }
    })
    .catch(e => console.error('❌ Network error:', e.message));
```

## What to Check Right Now

1. **Browser Console** - What error messages do you see when hovering?
2. **MongoDB** - Do S3 videos have `videoUrl` or `s3Key`?
3. **MongoDB** - Do S3 videos have `duration` > 0?
4. **S3 Console** - Copy actual file URL and test in browser

## Expected Database Structure

After fixes, your S3 video should look like:

```javascript
{
    "_id": ObjectId("..."),
    "title": "Test Video",
    "provider": "s3",
    "s3Bucket": "ethioxhub",
    "s3Key": "videos/test.mp4",
    "videoUrl": "https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/test.mp4",
    "thumbnailUrl": "https://ethioxhub.s3.eu-north-1.amazonaws.com/thumbnails/test.jpg",
    "duration": 120,  // in seconds
    "owner": ObjectId("..."),
    "createdAt": ISODate("..."),
    // ... other fields
}
```

## Summary

**S3 CORS:** ✅ Done (you configured it)
**S3 Public Access:** ✅ Done (you configured it)

**Still Need:**
- ⏳ Add `videoUrl` (or `s3Key` + `s3Bucket`) to S3 videos in MongoDB
- ⏳ Add `duration` to S3 videos in MongoDB

**Once you do that, everything will work!**

Check browser console and MongoDB, then let me know what you find.
