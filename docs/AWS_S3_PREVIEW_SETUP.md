# AWS S3 Video Hover Preview Setup Guide

## Overview
This guide explains how to enable hover previews for videos stored in AWS S3. Unlike Cloudinary, S3 doesn't support video transformations, so we use the full video URL with time-controlled playback.

## How It Works

### For S3 Videos:
1. **Full Video URL** is used (no transformations available)
2. **Time Control** limits playback to first 5 seconds
3. **Manual Looping** resets to 0 when reaching 5 seconds
4. **CORS Support** requires proper S3 bucket configuration

### Differences from Cloudinary:
| Feature | Cloudinary | AWS S3 |
|---------|-----------|--------|
| Preview Type | Optimized 5s clip | Time-controlled full video |
| File Size | Small (low quality) | Full video (larger) |
| Transformations | Supported | Not supported |
| CORS Required | Usually not | **Yes, required** |
| Preview Quality | `q_auto:low` | Original quality |

## S3 Bucket CORS Configuration

### Problem
By default, S3 buckets block cross-origin requests. When your website tries to load S3 videos for hover preview, you'll get CORS errors like:

```
Access to video at 'https://yourbucket.s3.amazonaws.com/video.mp4' from origin 'https://ethioxhub.vercel.app' has been blocked by CORS policy
```

### Solution: Configure CORS on Your S3 Bucket

#### Step 1: Access S3 Bucket Settings
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Select your video bucket
3. Click on the **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**

#### Step 2: Add CORS Configuration

**For Development (Permissive):**
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
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**For Production (Secure):**
```json
[
    {
        "AllowedHeaders": [
            "Authorization",
            "Content-Length",
            "Content-Type"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://ethioxhub.vercel.app",
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type",
            "Accept-Ranges",
            "Content-Range"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

**Important:** Replace `https://ethioxhub.vercel.app` with your actual domain(s).

#### Step 3: Make Videos Publicly Readable

S3 videos also need proper access permissions:

**Option A: Bucket Policy (Recommended)**
1. Go to **Permissions** > **Bucket Policy**
2. Add this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

**Replace `YOUR-BUCKET-NAME`** with your actual bucket name.

**Option B: Individual Object ACL**
- Make each video public when uploading
- Not recommended for automation

#### Step 4: Verify Configuration

Test your CORS setup:

1. **Using Browser Console:**
```javascript
fetch('https://YOUR-BUCKET.s3.YOUR-REGION.amazonaws.com/test-video.mp4', {
    method: 'HEAD',
    mode: 'cors'
})
.then(response => console.log('CORS OK:', response.status))
.catch(error => console.error('CORS Error:', error));
```

2. **Using curl:**
```bash
curl -H "Origin: https://ethioxhub.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://YOUR-BUCKET.s3.YOUR-REGION.amazonaws.com/test-video.mp4 \
     -v
```

Look for `Access-Control-Allow-Origin` in the response headers.

## Video URL Structure

The system tries to find S3 video URLs in this order:

### Priority 1: `videoUrl` field
```javascript
{
    provider: "s3",
    videoUrl: "https://mybucket.s3.us-east-1.amazonaws.com/videos/abc123.mp4"
}
```

### Priority 2: Construct from `s3Key` + `s3Bucket`
```javascript
{
    provider: "s3",
    s3Key: "videos/abc123.mp4",
    s3Bucket: "mybucket"
    // Constructs: https://mybucket.s3.{region}.amazonaws.com/videos/abc123.mp4
}
```

### Priority 3: `url` field (fallback)
```javascript
{
    provider: "s3",
    url: "https://mybucket.s3.amazonaws.com/videos/abc123.mp4"
}
```

## Environment Variables

Add to your `.env.local`:

```env
# AWS S3 Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=your-bucket-name

# S3 Access (for server-side operations)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Debugging S3 Preview Issues

### Check Browser Console

**Success:**
```
[Preview Debug] { provider: "s3", hasVideoUrl: true, ... }
[Preview] Using S3 video URL (time-controlled): https://...
```

**CORS Error:**
```
CORS Error: S3 bucket needs CORS policy. See docs for configuration.
Access to video at '...' has been blocked by CORS policy
```

**No URL Found:**
```
[Preview] S3 video found but no URL available: { hasVideoUrl: false, ... }
```

### Common Issues and Solutions

#### Issue 1: "Access blocked by CORS policy"

**Cause:** S3 bucket CORS not configured

**Solution:**
1. Add CORS configuration (see above)
2. Ensure your domain is in `AllowedOrigins`
3. Check bucket is in correct region
4. Clear browser cache and test again

#### Issue 2: "403 Forbidden"

**Cause:** Video file not publicly accessible

**Solution:**
1. Add bucket policy for public read access
2. Or make individual files public
3. Check bucket ownership settings

#### Issue 3: Preview doesn't appear

**Cause:** Missing video URL fields

**Solution:**
Check your video document has one of:
- `videoUrl`
- `s3Key` AND `s3Bucket`
- `url`

#### Issue 4: Slow loading

**Cause:** S3 videos load full file (no compression)

**Solution:**
- Use smaller preview files if possible
- Enable S3 CloudFront CDN for faster delivery
- Consider creating separate preview clips

## Performance Considerations

### S3 vs Cloudinary Preview Performance

**Cloudinary:**
- ✅ ~100KB for 5-second preview (optimized)
- ✅ Fast loading
- ✅ Low bandwidth usage

**S3:**
- ⚠️ Downloads full video file
- ⚠️ Slower loading for large videos
- ⚠️ Higher bandwidth usage
- ✅ No transformation service needed

### Optimization Tips

1. **Use Smaller Videos:**
   - Keep source videos under 10MB for good hover preview experience
   - Compress videos before uploading

2. **Enable CloudFront:**
   - Set up CloudFront distribution for your S3 bucket
   - Faster delivery, caching at edge locations
   - Update CORS to include CloudFront domain

3. **Lazy Loading:**
   - Previews only load on hover (500ms delay)
   - No impact on initial page load

4. **Create Preview Clips:**
   - Upload separate 5-second preview files
   - Store as `previewUrl` in video document
   - Much faster than loading full video

## Testing Checklist

✅ **Before Going Live:**

- [ ] CORS policy configured on S3 bucket
- [ ] Videos are publicly readable
- [ ] Test from your production domain
- [ ] Check browser console for errors
- [ ] Verify preview plays within 5 seconds
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Check mobile browsers
- [ ] Verify fallback to thumbnail works if preview fails

## CloudFront Setup (Optional but Recommended)

### Benefits:
- Faster global delivery
- Caching reduces costs
- Better performance

### Steps:
1. Create CloudFront distribution pointing to S3 bucket
2. Update video URLs to use CloudFront domain
3. Add CloudFront domain to CORS `AllowedOrigins`
4. Update `.env` with CloudFront URL

Example:
```env
NEXT_PUBLIC_CDN_URL=https://d1234567.cloudfront.net
```

Then construct URLs as:
```javascript
const videoUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${video.s3Key}`;
```

## Troubleshooting Guide

### Test CORS in Browser Console:

```javascript
// Test video accessibility
const testVideo = document.createElement('video');
testVideo.crossOrigin = 'anonymous';
testVideo.src = 'YOUR_S3_VIDEO_URL';
testVideo.onloadeddata = () => console.log('✅ Video loaded successfully');
testVideo.onerror = (e) => console.error('❌ Video failed:', e);
```

### Test S3 Bucket Access:

```bash
# Check if video is accessible
curl -I https://YOUR-BUCKET.s3.YOUR-REGION.amazonaws.com/video.mp4

# Should return 200 OK with Content-Type: video/mp4
```

### Enable Debug Mode:

Open browser DevTools and watch for these logs:
- `[Preview Debug]` - Video metadata
- `[Preview]` - URL generation
- Console errors - CORS or network issues
- Network tab - Check actual HTTP requests

## Summary

**S3 Hover Previews Now Supported! ✅**

- Full video URL used with time control (0-5 seconds)
- Requires CORS configuration on S3 bucket
- CORS errors detected and logged
- Graceful fallback to thumbnail if preview fails
- Same user experience as Cloudinary videos
- Performance depends on video file size

**Next Steps:**
1. Configure S3 bucket CORS
2. Test with one video
3. Monitor browser console
4. Roll out to all S3 videos
5. Consider CloudFront for better performance
