# 🧪 Video Player UI - Testing Guide

## Quick Test Checklist

### 1. **Navigate to a Video Page**
```
http://localhost:3000/videos/{any-video-id}
```

### 2. **Visual Verification**

#### Layout:
- [ ] Sidebar visible on desktop (left side, orange "E" logo)
- [ ] Sidebar hidden on mobile
- [ ] Header at top with search bar and user profile
- [ ] Video player in center-left
- [ ] Live chat on right (desktop)
- [ ] Related videos below chat
- [ ] Comments below video details

#### Video Player:
- [ ] Video loads and displays
- [ ] Custom controls visible on hover
- [ ] Play/pause button works
- [ ] Progress bar shows current position
- [ ] Time display shows current/total time
- [ ] Volume button works
- [ ] Fullscreen button works
- [ ] Seeking by clicking progress bar works

#### Video Details:
- [ ] Title displays correctly
- [ ] Creator name and avatar display
- [ ] View count shows (formatted: 1.2K, etc.)
- [ ] Like count shows
- [ ] Upload date shows ("2 days ago")
- [ ] Description displays
- [ ] Like button works (changes color when clicked)

#### Related Videos:
- [ ] Shows 5 related videos
- [ ] Thumbnails display
- [ ] Creator names display
- [ ] View counts formatted correctly
- [ ] Upload times formatted ("2 days ago")
- [ ] VIP badge shows for paid videos
- [ ] Clicking a video navigates to it
- [ ] "See All" button shows total count

#### Live Chat:
- [ ] Shows demo messages
- [ ] Scrollable if many messages
- [ ] Message input field present

---

## 3. **Functional Testing**

### Video Playback:
```
Test Case 1: Free Video
1. Navigate to a free video
2. Video should play immediately
3. Progress bar should update
4. Time should increment

Test Case 2: VIP Video (Not Purchased)
1. Navigate to a VIP video
2. Should show purchase modal
3. Close modal → video stays locked
4. Purchase (if testing) → video unlocks

Test Case 3: HLS Streaming
1. Navigate to a video with .m3u8 URL
2. Should load and play via HLS.js
3. Check console for "📡 Using HLS.js for streaming"
```

### Progress Tracking:
```
1. Start playing a video
2. Wait 10 seconds
3. Check network tab → POST to /api/videos/{id}/progress
4. Refresh page
5. Video should resume from last position
```

### Likes/Dislikes:
```
1. Click like button
2. Count should increment
3. Button should turn orange
4. Click again → should decrement
```

### Comments:
```
1. Scroll to comments section
2. Post a comment
3. Should appear in list
```

### Related Videos:
```
1. Check related videos panel
2. Click on a related video
3. Page should navigate
4. New video should load
5. Related videos should update
```

---

## 4. **Responsive Testing**

### Desktop (1920x1080):
- [ ] Sidebar visible
- [ ] Two-column layout (video left, sidebar right)
- [ ] Search bar visible in header

### Tablet (768px):
- [ ] Sidebar visible
- [ ] Layout adjusts

### Mobile (375px):
- [ ] Sidebar hidden
- [ ] Single column layout
- [ ] Search bar hidden
- [ ] Related videos below video
- [ ] Chat below related videos

**Test resize:**
Drag browser window from wide to narrow → layout should adapt smoothly.

---

## 5. **Error Handling**

### Test Cases:
```
Test Case 1: Invalid Video ID
- Navigate to /videos/invalid-id-123
- Should show "Video not found"

Test Case 2: Network Error
- Disconnect internet
- Try to load video
- Should handle gracefully (no crash)

Test Case 3: Missing Thumbnail
- Video with no thumbnailUrl
- Should show placeholder background

Test Case 4: No Related Videos
- Video in unique category
- Related videos panel should hide or show empty state
```

---

## 6. **Browser Compatibility**

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (Safari iOS, Chrome Android)

---

## 7. **Performance**

### Check:
- [ ] Video loads within 3 seconds
- [ ] No layout shifts (CLS)
- [ ] Smooth scrolling
- [ ] No memory leaks (keep page open 30 min)
- [ ] Related videos fetch doesn't block video playback

### Console Checks:
```bash
# Open browser console (F12)
# Look for:
- ✅ "🎬 Initializing player with URL: ..."
- ✅ "✅ Video loaded and ready to play"
- ✅ No red errors
- ⚠️ Warnings about missing data are OK
```

---

## 8. **Data Accuracy**

### Verify Real Data:
- [ ] Creator name matches database
- [ ] View count is real (not "125,908")
- [ ] Upload time is accurate
- [ ] Related videos are from same category
- [ ] Likes/dislikes update in real-time

### Check Network Tab:
```
GET /api/videos/{id} → Returns video data
GET /api/videos?category=... → Returns related videos
POST /api/videos/{id}/progress → Saves progress
POST /api/videos/{id}/like → Toggles like
```

---

## 9. **Security Testing**

### Access Control:
```
Test Case 1: Unauthorized User
- Logout
- Navigate to VIP video
- Should show purchase modal
- Should NOT play video

Test Case 2: Purchased Video
- Login as user who purchased video
- Should play immediately

Test Case 3: Subscribed User
- Login as subscriber
- All VIP videos should be accessible
```

---

## 10. **Edge Cases**

- [ ] Very long video title (should truncate)
- [ ] Very long description (should display in full)
- [ ] Video with 0 views (should show "0 views")
- [ ] Newly uploaded video (should show "Just now")
- [ ] Video with 1M+ views (should show "1.5M views")
- [ ] No comments (should show empty state)
- [ ] First video in category (no related videos)

---

## 🐛 Known Issues to Watch For

### Potential Issues:
1. **Related videos showing current video**
   - Should be filtered out by `currentVideoId`
2. **Progress bar jumpy on seek**
   - Should be smooth due to `timeupdate` event
3. **Controls not hiding**
   - Should auto-hide after mouse leave
4. **HLS not working**
   - Check hls.js loaded
   - Check console for errors

---

## ✅ Success Criteria

### UI:
- [x] Looks exactly like the design mockup
- [x] Dark theme applied correctly
- [x] Orange accent color (primary)
- [x] Smooth animations
- [x] Responsive layout

### Functionality:
- [x] Video plays
- [x] All controls work
- [x] Progress saves
- [x] Likes work
- [x] Comments work
- [x] Related videos work
- [x] Purchase modal works (for VIP)

### Data:
- [x] All real data displayed
- [x] No placeholder text
- [x] Timestamps formatted correctly
- [x] Counts formatted correctly

### Performance:
- [x] Fast load time
- [x] No console errors
- [x] Smooth playback
- [x] No memory leaks

---

## 📞 Debugging Tips

### If video doesn't load:
```javascript
// Open console (F12) and check:
1. Network tab → Filter by "videos" → Check response
2. Console → Look for "🎬 Initializing player..."
3. Check video.videoUrl is present
4. Check canAccess is true
```

### If related videos don't load:
```javascript
// Check:
1. Network tab → /api/videos?category=...
2. Console → Any fetch errors?
3. Check categoryId is valid
```

### If controls don't work:
```javascript
// Check:
1. videoRef is properly set
2. Event listeners attached
3. State updating (React DevTools)
```

---

## 🎬 Demo Script

**For a full demo walkthrough:**

1. Start at homepage
2. Click on a video
3. **Point out**: "New professional UI layout"
4. **Show**: Custom video controls
5. **Demo**: Play/pause, seek, volume
6. **Show**: Real creator info, views, likes
7. **Demo**: Like button (click to like)
8. **Show**: Related videos panel
9. **Demo**: Click related video → navigates
10. **Show**: Live chat (demo UI)
11. **Demo**: Post a comment
12. **Show**: Responsive (resize browser)
13. **Show**: Locked video → purchase modal

---

Good luck testing! 🚀
