# 🔧 Video Player UI - Troubleshooting Guide

## Common Issues & Solutions

---

## 1. Compilation Errors

### Error: "Cannot find module 'date-fns'"
**Solution:**
```bash
npm install date-fns
```

### Error: "Cannot find module '@/components/video/...'"
**Check:**
- File exists at the correct path
- File has correct export (`export default ComponentName`)
- No typos in import path

**Solution:**
```bash
# Restart dev server
# Press Ctrl+C, then:
npm run dev
```

---

## 2. Video Player Issues

### Video doesn't play / Black screen

**Possible Causes:**
1. `playbackUrl` is null or invalid
2. CORS issues with video URL
3. Video format not supported
4. HLS.js not loaded

**Debug Steps:**
```javascript
// Open console (F12) and check:
console.log('playbackUrl:', playbackUrl);
console.log('videoRef.current:', videoRef.current);
console.log('video.videoUrl:', video.videoUrl);
console.log('canAccess:', data.canAccess);
```

**Solutions:**
- Check video URL is valid (not expired signed URL)
- Check `canAccess` is true (not locked)
- For HLS: Verify `.m3u8` URL is accessible
- Check browser console for network errors

### Controls don't show

**Cause:** CSS issue or controls state not updating

**Solution:**
```javascript
// Add to VideoPlayer.js:
onMouseMove={() => setShowControls(true)}
```

**Check:**
- `showControls` state is updating
- CSS classes applied: `opacity-100` vs `opacity-0`

### Progress bar doesn't seek

**Cause:** Click handler not working or duration is 0

**Debug:**
```javascript
console.log('duration:', duration);
console.log('currentTime:', currentTime);
```

**Solution:**
- Ensure video metadata is loaded (`loadedmetadata` event)
- Check `videoRef.current` is set

---

## 3. Data Not Displaying

### Creator name shows "Unknown"

**Cause:** Video owner not populated

**Check API Response:**
```bash
# In browser DevTools → Network tab:
GET /api/videos/{id}
# Check response:
{
  "video": {
    "owner": { "username": "...", "_id": "..." }
  }
}
```

**Solution:**
Add `.populate('owner', 'username profilePicture')` to API query

### View count shows "0" for all videos

**Cause:** Views not being incremented

**Check:**
- API endpoint increments views on GET
- Database has `views` field
- View counter logic working

### Upload time shows "Invalid Date"

**Cause:** `createdAt` is invalid or missing

**Debug:**
```javascript
console.log('video.createdAt:', video.createdAt);
console.log('new Date(video.createdAt):', new Date(video.createdAt));
```

**Solution:**
- Ensure `createdAt` exists in database
- Check date format is valid ISO string

---

## 4. Related Videos Issues

### Related videos don't load

**Possible Causes:**
1. API fetch failing
2. Category ID invalid
3. No videos in category

**Debug:**
```javascript
// In RelatedVideos component:
console.log('Fetching with categoryId:', categoryId);
console.log('API response:', data);
```

**Check Network Tab:**
```
GET /api/videos?category={categoryId}&limit=5&sort=views
```

**Solutions:**
- Verify API endpoint returns videos
- Check `categoryId` is valid
- If no category, component should fetch general videos

### Related videos show current video

**Cause:** Filter not working

**Check Code:**
```javascript
const filtered = data.videos.filter(v => v._id !== currentVideoId);
```

**Solution:**
- Ensure `currentVideoId` prop is passed correctly
- Check string comparison is working

### Related videos not clickable

**Cause:** Missing `onClick` handler or Next.js Link issue

**Solution:**
```javascript
onClick={() => router.push(`/videos/${video._id}`)}
```

---

## 5. Styling Issues

### Layout broken / Components overlapping

**Possible Causes:**
1. Tailwind CSS not loaded
2. CSS variables not set
3. Conflicting classes

**Check:**
```bash
# Verify Tailwind is working:
# Any class should apply (try adding a obvious class like 'bg-red-500')
```

**Solution:**
```bash
# Rebuild CSS:
npm run dev
# (hard refresh browser: Ctrl+Shift+R)
```

### Colors look wrong / Not using theme

**Check globals.css:**
```css
:root {
  --background: 0 0% 7%;
  --foreground: 0 0% 85%;
  --primary: 32 100% 50%; /* Orange */
  /* ... */
}
```

**Solution:**
- Ensure CSS variables defined
- Use `hsl(var(--primary))` format in Tailwind config
- Hard refresh browser

### Sidebar not showing

**Possible Causes:**
1. Hidden on mobile
2. Flexbox issue
3. Width collapsed

**Check:**
```html
<!-- Should have: -->
className="... hidden md:flex"
```

**Solution:**
- View on desktop (width > 768px)
- Check `flex` container wrapping sidebar

---

## 6. Responsive Issues

### Layout broken on mobile

**Check:**
```css
/* Should have responsive classes: */
lg:flex-row  /* Desktop: horizontal */
flex-col     /* Mobile: vertical */
```

**Common Issues:**
- Sidebar showing on mobile → add `hidden md:flex`
- Search bar not hiding → add `hidden sm:flex`
- Related videos too wide → check `w-full lg:w-80`

**Solution:**
Test breakpoints:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px+

---

## 7. Functionality Issues

### Likes don't work

**Possible Causes:**
1. `useLikeVideo` hook issue
2. Video ID not passed
3. User not authenticated

**Debug:**
```javascript
// In VideoDetails:
console.log('video._id:', video._id);
console.log('userLiked:', userLiked);
```

**Check:**
- `useLikeVideo` hook is imported
- Props passed correctly
- User is logged in

### Progress doesn't save

**Check console for errors:**
```
POST /api/videos/{id}/progress
```

**Common Issues:**
- Token expired (should auto-refresh)
- Video duration is 0
- API endpoint not found

**Solution:**
- Verify API endpoint exists
- Check token in localStorage
- Ensure video is playing (not paused immediately)

### Comments don't load

**Cause:** CommentsSection component issue (not related to UI integration)

**Check:**
```html
<CommentsSection videoId={video._id} />
```

**Verify:**
- `video._id` is defined
- CommentsSection is imported correctly
- API endpoint working

---

## 8. Performance Issues

### Page slow to load

**Check:**
1. Video file too large
2. Too many API calls
3. Unoptimized images

**Solutions:**
- Use HLS for large videos
- Implement pagination for related videos
- Lazy load components

### Video buffering

**Not related to UI integration**
- Check video encoding
- Check network speed
- Use HLS adaptive streaming

### Memory leak

**Possible Cause:** Event listeners not cleaned up

**Check:**
```javascript
// In useEffect cleanup:
return () => {
  videoElement.removeEventListener(...);
};
```

**Solution:**
- Ensure all event listeners removed on unmount

---

## 9. Build Issues

### Error during `npm run build`

**Common Errors:**

#### "window is not defined"
**Cause:** Using browser APIs during SSR

**Solution:**
```javascript
// Check if window exists:
if (typeof window !== 'undefined') {
  // Browser only code
}
```

#### "Cannot read property 'map' of undefined"
**Cause:** Data not available during initial render

**Solution:**
```javascript
{relatedVideos?.map(...)}  // Add optional chaining
```

---

## 10. Type Errors (if using TypeScript)

### "Property 'videoRef' does not exist..."

**Solution:**
Define proper types for props:
```typescript
interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  playbackUrl: string | null;
  // ... other props
}
```

---

## 🚨 Emergency Fixes

### If everything breaks:

#### 1. Revert to backup
```bash
git checkout HEAD~1 -- src/app/videos/[id]/page.js
```

#### 2. Check git diff
```bash
git diff
```

#### 3. Restart dev server
```bash
# Ctrl+C to stop
npm run dev
```

#### 4. Clear cache
```bash
# Delete .next folder
rm -rf .next
npm run dev
```

#### 5. Reinstall dependencies
```bash
rm -rf node_modules
npm install
npm run dev
```

---

## 📞 Getting Help

### Debugging Checklist:

1. **Check console** for error messages
2. **Check network tab** for failed API calls
3. **Check React DevTools** for component state
4. **Check props** being passed to components
5. **Check CSS** is loading correctly
6. **Check data** from API is correct shape

### Useful Console Commands:

```javascript
// Check video object:
console.log('Full video object:', video);

// Check user:
console.log('Current user:', user);

// Check refs:
console.log('Video ref:', videoRef.current);

// Check state:
console.log('Player state:', { isPlaying, progress, currentTime, duration });
```

---

## 📝 Common Console Messages

### Expected (Good):
```
✅ 🎬 Initializing player with URL: https://...
✅ 📡 Using HLS.js for streaming
✅ ✅ HLS manifest loaded
✅ ✅ Video loaded and ready to play
```

### Warnings (OK):
```
⚠️ Warning: Each child should have a unique "key" prop
⚠️ (Can be ignored if functionality works)
```

### Errors (Need to fix):
```
❌ Failed to fetch related videos: TypeError: ...
❌ Cannot read property '_id' of undefined
❌ ❌ Video error: MEDIA_ERR_SRC_NOT_SUPPORTED
```

---

## ✅ Final Checklist

If you're stuck, go through this:

- [ ] Dev server running (`npm run dev`)
- [ ] No errors in terminal
- [ ] No errors in browser console
- [ ] Video URL is valid
- [ ] User is authenticated (if required)
- [ ] API endpoints returning data
- [ ] Components imported correctly
- [ ] Props passed correctly
- [ ] State updating correctly
- [ ] CSS classes applied correctly
- [ ] Browser cache cleared (Ctrl+Shift+R)

---

**Still having issues?** 
1. Check the integration completion doc for what should be working
2. Compare your code with the examples provided
3. Verify no typos in file names or imports
4. Test in a different browser

Good luck! 🍀
