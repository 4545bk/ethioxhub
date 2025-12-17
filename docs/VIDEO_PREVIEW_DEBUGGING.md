# Video Hover Preview Debugging Guide

## Overview
This guide helps you understand and troubleshoot the video hover preview feature on your EthioxHub platform.

## How It Works

### 1. **Preview Generation Flow**
When a user hovers over a video card:
1. The `VideoCardWithPreview` component triggers after 500ms of hover
2. The `useVideoPreview` hook attempts to generate a preview URL based on available video metadata
3. If successful, a low-quality, short preview clip plays
4. If it fails, the thumbnail is shown instead

### 2. **Preview URL Priority Order**
The system tries to generate a preview URL in this order:

1. **Explicit Preview URL** - If `video.previewUrl` exists, use it directly
2. **Cloudinary Public ID** - Generate optimized preview from `cloudinaryPublicId`
3. **Cloudinary URL** - Extract public ID from `cloudinaryUrl` and generate preview
4. **Cloudinary HLS URL** - Extract public ID from HLS URL
5. **S3 Videos** - No preview (shows thumbnail only due to S3 limitations)
6. **Thumbnail URL** - Last resort: try to derive video ID from thumbnail URL

### 3. **Preview Transformations**
For Cloudinary videos, the preview is generated with these optimizations:
- **Start Offset**: `so_0` (starts from beginning)
- **Duration**: `du_X` (X = 2-5 seconds, adjusted based on video length)
- **Format**: `f_auto` (automatic format selection)
- **Quality**: `q_auto:low` (low quality for faster loading)
- **Width**: `w_400` (400px width, maintains aspect ratio)

## Debugging Steps

### Check Browser Console
Open your browser's Developer Tools (F12) and look for these log messages:

#### Success Messages:
```
[Preview Debug] { title: "...", provider: "cloudinary", hasCloudinaryPublicId: true, ... }
[Preview] Generated from cloudinaryPublicId: https://res.cloudinary.com/...
```

#### Warning Messages:
```
[Preview] No preview available for video: ...
Preview video failed to load: ...
[Preview] Could not extract ID from thumbnail: ...
```

#### Error Messages:
```
[Preview Error]: ... Video: ...
Preview playback failed for: ... NotAllowedError ...
```

### Common Issues and Solutions

#### Issue 1: Some Videos Work, Others Don't

**Possible Causes:**
1. **Missing Cloudinary Data**: Check if failing videos have `cloudinaryPublicId` or `cloudinaryUrl`
2. **Invalid Video URLs**: The URL might be malformed or use an unsupported format
3. **Very Short Videos**: Videos shorter than 2 seconds might fail
4. **CORS Issues**: Cloudinary might not allow video playback from your domain

**Solution:**
- Check console logs to see which priority level is being used
- Verify video metadata in your database
- For very short videos, the system now adjusts preview duration automatically

#### Issue 2: Preview Doesn't Play (Shows Thumbnail)

**Possible Causes:**
1. **Browser Autoplay Policy**: Browsers block unmuted autoplay
2. **Network Error**: Preview failed to load
3. **Invalid URL**: Generated preview URL is incorrect

**Solution:**
- All previews are muted (this is required for autoplay)
- Check Network tab in DevTools for failed requests
- Look for `404` or `403` errors on preview URLs

#### Issue 3: Preview URL Returns 404

**Possible Causes:**
1. **Public ID Extraction Failed**: Regex didn't match the URL pattern
2. **Video Format Not Supported**: The video might be in an unusual format
3. **Cloudinary Settings**: Videos might be in a different folder structure

**Solution:**
- Check the console log showing the generated preview URL
- Manually test the URL in your browser
- Verify the regex patterns in `useVideoPreview.js` match your URL structure

### Database Video Structure Check

**For a video to have previews, it should have ONE of these:**
```javascript
{
  // Option 1: Best (explicit preview)
  previewUrl: "https://...",
  
  // Option 2: Good (Cloudinary with public ID)
  provider: "cloudinary",
  cloudinaryPublicId: "videos/abc123",
  cloudinaryUrl: "https://res.cloudinary.com/.../videos/abc123.mp4",
  
  // Option 3: Okay (Cloudinary URL only)
  provider: "cloudinary",
  cloudinaryUrl: "https://res.cloudinary.com/.../upload/v123/videos/abc123.mp4",
  
  // Option 4: Fallback (thumbnail)
  thumbnailUrl: "https://res.cloudinary.com/.../upload/v123/videos/abc123.jpg",
  
  // Option 5: No preview (S3)
  provider: "s3",
  s3Key: "...",
  s3Bucket: "..."
}
```

### Testing Individual Videos

To test a specific video's preview generation:

1. **Open Browser Console**
2. **Hover over the video card**
3. **Look for the debug log** with video metadata
4. **Check which priority level was used**
5. **If URL generation failed, check the warning messages**

### Advanced Debugging

#### Enable Detailed Logging
The system now logs:
- Video metadata on first hover (stored in sessionStorage to avoid spam)
- Preview URL generation method used
- Any errors during preview creation or playback

#### Test Preview URL Manually
1. Copy the generated preview URL from console
2. Open it directly in a new browser tab
3. If it doesn't load, the issue is with the URL generation
4. If it loads but doesn't play on hover, the issue is with autoplay/CORS

#### Check Video Duration
Very short videos (< 5 seconds) now use adjusted preview durations:
- Videos < 5s: preview duration = max(2, floor(video.duration))
- Videos >= 5s: preview duration = 5 seconds

## Enhancements Made

### 1. **Better Error Handling**
- Video element now has `onError` handler
- Playback failures automatically fall back to thumbnail
- Error messages include video title for easier debugging

### 2. **Improved URL Extraction**
- Added support for more video formats (avi, flv)
- Multiple regex patterns try to extract public ID from thumbnails
- Better handling of edge cases

### 3. **Dynamic Preview Duration**
- Short videos get shorter preview clips
- Prevents Cloudinary errors for videos < 5 seconds

### 4. **Comprehensive Logging**
- Debug info logged on first hover per video
- All preview generation steps are logged
- Error messages are more descriptive

## What To Look For

When testing, check:
1. ✅ **Console shows preview generation** for each video on first hover
2. ✅ **Preview URL is logged** (should start with `https://res.cloudinary.com/...`)
3. ✅ **No 404 errors** in Network tab when hovering
4. ✅ **Video plays after 500ms hover** (muted, short clip)
5. ✅ **Fallback to thumbnail** if preview fails

## Next Steps

If issues persist after these enhancements:
1. **Check specific failing videos** - what's their metadata structure?
2. **Verify Cloudinary settings** - ensure videos are publicly accessible
3. **Test different browsers** - autoplay policies vary
4. **Check network conditions** - slow connections might timeout

## Performance Notes

- Previews are low quality (400px width) for fast loading
- Each video logs debug info only once (sessionStorage)
- Failed previews automatically fall back to thumbnails
- No impact on page load speed (previews load on hover)
