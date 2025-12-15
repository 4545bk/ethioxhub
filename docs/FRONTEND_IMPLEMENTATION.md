# 🎨 Frontend Implementation - Complete Guide

## ✅ COMPLETED SO FAR

### Custom Hooks (3/3 Complete)
- ✅ `src/hooks/useVideoPreview.js` - Video preview URL management
- ✅ `src/hooks/useFilterVideos.js` - Video filtering state & API calls  
- ✅ `src/hooks/useLikeVideo.js` - Like/Dislike with optimistic UI

### Core Components (1/7)
- ✅ `src/components/VideoCardWithPreview.js` - Card with hover preview

---

## 📋 REMAINING COMPONENTS TO BUILD

### 1. Comments System
**File**: `src/components/CommentsSection.js`
- Display threaded comments
- Reply functionality
- Delete button (owner/admin)
- Bad word moderation display
- Pagination

**File**: `src/components/CommentItem.js`
- Individual comment display
- Reply form toggle
- Like/Delete actions

### 2. Like/Dislike Buttons
**File**: `src/components/LikeDislikeButtons.js`
- Thumbs up/down buttons
- Count display
- Optimistic UI updates using `useLikeVideo` hook
- Loading states

### 3. Filters Sidebar
**File**: `src/components/FiltersSidebar.js`
- Category dropdown
- Free/Paid toggle
- Price range slider
- Duration range
- Sort dropdown
- Reset filters button
- Uses `useFilterVideos` hook

### 4. Continue Watching Section
**File**: `src/components/ContinueWatching.js`
- Horizontal scroll of incomplete videos
- Progress bar overlay
- Auto-resume functionality
- Fetch from `/api/user/continue-watching`

### 5. Watch History Page
**File**: `src/app/history/page.js`
- List of last watched videos
- Clear history button
- Pagination
- Fetch from `/api/user/history`

### 6. Subscription Modal
**File**: `src/components/SubscriptionModal.js`
- Show subscription price (1000 Birr/month)
- Display benefits
- Subscribe button
- Balance check
- Success/error feedback
- Calls `/api/subscribe`

### 7. Pay-Per-View Modal
**File**: `src/components/PurchaseModal.js`
- Show video price
- Display user balance
- Purchase button
- Confirmation flow
- Calls `/api/videos/[id]/purchase`

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Core UI (Essential)
1. **FiltersSidebar** - Enable video discovery
2. **LikeDislikeButtons** - User engagement
3. **CommentsSection** - User interaction

### Phase 2: User Experience
4. **ContinueWatching** - Retention feature
5. **Watch History** - User tracking

### Phase 3: Monetization
6. **SubscriptionModal** - Revenue
7. **PurchaseModal** - Revenue

---

## 📁 COMPONENT STRUCTURE

```
src/
├── hooks/
│   ├── useVideoPreview.js ✅
│   ├── useFilterVideos.js ✅
│   └── useLikeVideo.js ✅
│
├── components/
│   ├── VideoCardWithPreview.js ✅
│   ├── LikeDislikeButtons.js ⏳ TO BUILD
│   ├── CommentsSection.js ⏳ TO BUILD
│   ├── CommentItem.js ⏳ TO BUILD
│   ├── FiltersSidebar.js ⏳ TO BUILD
│   ├── ContinueWatching.js ⏳ TO BUILD
│   ├── SubscriptionModal.js ⏳ TO BUILD
│   └── PurchaseModal.js ⏳ TO BUILD
│
└── app/
    ├── page.js - Home (video grid with filters)
    ├── history/
    │   └── page.js ⏳ TO BUILD
    ├── videos/[id]/
    │   └── page.js - Video player + comments + likes
    └── admin/
        └── videos/upload/
            └── page.js - Enhanced upload form

```

---

## 🎨 DESIGN SYSTEM

### Colors
```css
Background: bg-gray-950
Cards: bg-gray-900
Hover: bg-gray-800
Primary: bg-blue-600
Success: bg-green-500
Warning: bg-yellow-500
Danger: bg-red-500
Premium: bg-gradient-to-r from-yellow-400 to-orange-500
```

### Typography
```css
Headings: font-bold text-white
Body: text-gray-300
Metadata: text-sm text-gray-400
```

### Spacing
```css
Card padding: p-4
Section gap: gap-6
Grid gap: gap-4
```

### Animations (Framer Motion)
```javascript
whileHover={{ scale: 1.05 }}
transition={{ duration: 0.2 }}
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

---

## 🧪 TESTING PLAN

### Unit Tests (Jest)
```
tests/
├── hooks/
│   ├── useVideoPreview.test.js
│   ├── useFilterVideos.test.js
│   └── useLikeVideo.test.js
│
└── components/
    ├── VideoCardWithPreview.test.js
    ├── LikeDislikeButtons.test.js
    ├── CommentsSection.test.js
    └── FiltersSidebar.test.js
```

### Integration Tests (Playwright)
```
e2e/
├── video-preview.spec.js - Test hover preview
├── subscription-flow.spec.js - Test full subscription
├── purchase-flow.spec.js - Test pay-per-view
├── comments.spec.js - Post/reply/delete comments
└── admin-upload.spec.js - Full upload with both providers
```

---

## 📝 EXAMPLE USAGE

### VideoCardWithPreview
```jsx
import VideoCardWithPreview from '@/components/VideoCardWithPreview';

<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {videos.map(video => (
    <VideoCardWithPreview key={video._id} video={video} />
  ))}
</div>
```

### FiltersSidebar (To Be Built)
```jsx
import FiltersSidebar from '@/components/FiltersSidebar';
import { useFilterVideos } from '@/hooks/useFilterVideos';

const { filters, updateFilter, resetFilters } = useFilterVideos();

<FiltersSidebar
  filters={filters}
  onFilterChange={updateFilter}
  onReset={resetFilters}
/>
```

### LikeDislikeButtons (To Be Built)
```jsx
import LikeDislikeButtons from '@/components/LikeDislikeButtons';

<LikeDislikeButtons
  videoId={video._id}
  initialLikes={video.likesCount}
  initialDislikes={video.dislikesCount}
  userLiked={false}
  userDisliked={false}
/>
```

---

## 🚀 NEXT STEPS

Would you like me to continue building:

**Option A**: All remaining components (LikeDislike, Comments, Filters, etc.)
**Option B**: Focus on monetization (Subscription + Purchase modals)
**Option C**: Admin dashboard enhancements
**Option D**: Testing suite first

**Current Status**: 4 of ~15 components built (26% complete)

Let me know your priority and I'll continue building!
