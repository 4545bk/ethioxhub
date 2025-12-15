# Video Player UI Integration Plan

## ✅ Current State Assessment

### Existing Components (Already in `/src/components/video/`)
1. ✅ **Sidebar.js** - Navigation sidebar (static icons)
2. ✅ **Header.js** - Search and user profile
3. ✅ **VideoPlayer.js** - Video player with custom controls
4. ✅ **VideoDetails.js** - Video info, likes, stats
5. ✅ **LiveChat.js** - Live chat UI (static data)
6. ✅ **RelatedVideos.js** - Suggested videos (static data)

### Existing Page
- `/src/app/videos/[id]/page.js` - Main video player page

### Existing Data Models
- **Video Model** (`/src/models/Video.js`):
  - `title`, `description`, `owner`, `views`, `likesCount`, `dislikesCount`
  - `isPaid`, `price`, `thumbnailUrl`, `videoUrl`, `duration`
  - `createdAt`, `category`, `tags`, `likedBy`, `dislikedBy`
  
- **User Model** (`/src/models/User.js`):
  - `username`, `email`, `profilePicture`, `balance`, `roles`
  - `unlockedVideos`, `subscriptionExpiresAt`

### Existing Features (MUST PRESERVE)
1. ✅ Video playback (MP4 + HLS with hls.js)
2. ✅ Access control (Free/Purchased/Subscription logic)
3. ✅ Auto-resume & watch progress tracking
4. ✅ Likes/Dislikes (useLikeVideo hook)
5. ✅ Comments (CommentsSection component)
6. ✅ Authentication & token handling (AuthContext)
7. ✅ Purchase modal for VIP content
8. ✅ Quality handling (existing logic)

---

## 🎯 Integration Strategy

### Phase 1: Update Data Bindings
Replace ALL static/placeholder data with real EthioxHub data:

#### 1. **VideoPlayer Component** ✅ (Already integrated)
- ✅ Uses videoRef from parent
- ✅ Receives playbackUrl, poster, duration props
- ✅ Custom controls with progress bar
- ✅ Play/pause, volume, fullscreen controls

#### 2. **VideoDetails Component** (Needs data binding)
**Replace:**
- ❌ Static creator data → Use `video.owner.*`
- ❌ Static subscriber count → Use `video.owner.subscribersCount` (if available)
- ❌ Placeholder views → Use `video.views`
- ❌ Placeholder likes → Use `video.likesCount`
- ❌ Static title/description → Use `video.title`, `video.description`
- ❌ Static upload time → Use `video.createdAt`

**Keep:**
- ✅ useLikeVideo hook (existing logic)
- ✅ Like button functionality

#### 3. **RelatedVideos Component** (Needs API integration)
**Replace:**
- ❌ Static relatedVideos array → Fetch from `/api/videos?category=${video.category}&limit=5`
- ❌ Static thumbnails → Use `video.thumbnailUrl`
- ❌ Static creator → Use `video.owner.username`
- ❌ Static views/time → Use `video.views`, `video.createdAt`

**Add:**
- ✅ Link to video (router.push)
- ✅ Handle loading/error states

#### 4. **Header Component** (Needs user data)
**Replace:**
- ❌ Static user avatar → Use `user.profilePicture` or default
- ❌ Static username "Thomas" → Use `user.username`

**Add:**
- ✅ Connect search to actual search functionality

#### 5. **LiveChat Component** (UI Only per requirements)
**Keep:**
- ✅ Static chat data (as per requirement: "Live chat → UI ONLY")
- ✅ No backend changes for chat

#### 6. **Sidebar Component** (Navigation)
**Add:**
- ✅ Link navigation to actual pages
- ✅ Highlight active page

---

## 🔧 Implementation Checklist

### Step 1: Add Missing User Fields (if needed)
- [ ] Check if User model has `subscribersCount` field
- [ ] If not, create virtual field or calculate dynamically

### Step 2: Create Related Videos API/Logic
- [ ] Use existing `/api/videos` with category filter
- [ ] OR create helper function in page.js

### Step 3: Update Components (One by One)
- [x] ✅ VideoPlayer - Already correct
- [ ] Update VideoDetails with real data props
- [ ] Update RelatedVideos with API fetch
- [ ] Update Header with user data
- [ ] Update Sidebar with navigation links

### Step 4: Update Main Page (page.js)
- [ ] Pass all required props to components
- [ ] Fetch related videos
- [ ] Maintain existing logic (NO CHANGES to playback/access control)

### Step 5: Test All Existing Functionality
- [ ] Video playback (MP4 + HLS)
- [ ] Purchase flow
- [ ] Like/dislike
- [ ] Comments
- [ ] Progress tracking
- [ ] Resume playback

---

## ⚠️ CRITICAL RULES (DO NOT VIOLATE)

### ❌ DO NOT:
1. Change video initialization logic (`initializePlayer`)
2. Modify access control logic (`canAccess`, purchase modal)
3. Change API endpoints or data structures
4. Break auto-resume or progress tracking
5. Modify authentication/token handling
6. Change likes/comments logic
7. Add new quality selector logic (preserve existing)

### ✅ DO:
1. ONLY replace UI text/data bindings
2. Use existing state variables
3. Pass data via props
4. Maintain exact component structure
5. Preserve all event handlers
6. Keep responsive behavior

---

## 📝 Data Mapping Reference

### Video Object
```js
{
  _id: String,
  title: String,
  description: String,
  owner: {
    _id: String,
    username: String,
    profilePicture: String,
    subscribersCount: Number // (may need to add)
  },
  thumbnailUrl: String,
  videoUrl: String, // (from canAccess check)
  views: Number,
  likesCount: Number,
  dislikesCount: Number,
  category: { name: String, slug: String },
  isPaid: Boolean,
  price: Number, // in cents
  duration: Number, // in seconds
  createdAt: Date,
  likedBy: [ObjectId],
  dislikedBy: [ObjectId]
}
```

### User Object (from AuthContext)
```js
{
  _id: String,
  username: String,
  email: String,
  profilePicture: String,
  balance: Number,
  roles: [String],
  unlockedVideos: [ObjectId]
}
```

---

## 🎨 UI Preservation

**Already Configured:**
- ✅ CSS Variables in `globals.css`
- ✅ Tailwind colors in `tailwind.config.js`
- ✅ Video theme colors (video-bg, video-overlay, video-control)

**No Changes Needed:**
- Styling
- Layout
- Animations
- Responsive behavior

---

## 🚀 Next Steps

1. Review existing components and page
2. Identify exact data props needed
3. Update components one by one
4. Test after each change
5. Verify no regressions

---

*Generated for EthioxHub Video Player UI Integration*
*Date: 2025-12-15*
