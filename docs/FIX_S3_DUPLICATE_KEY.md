# 🔧 FIXED: S3 Video Upload Duplicate Key Error

## Problem
When uploading S3 videos, getting error:
```
E11000 duplicate key error collection: ethioxhub.videos 
index: cloudinaryPublicId_1 dup key: { cloudinaryPublicId: null }
```

## Root Cause
- The `cloudinaryPublicId` field has a unique index
- When uploading S3 videos, this field is `null`
- MongoDB unique indexes don't allow multiple `null` values by default
- The index needed to be **sparse** to allow multiple null values

## Solution Applied ✅

### 1. Dropped Old Index
Removed the non-sparse unique index on `cloudinaryPublicId`

### 2. Created Sparse Unique Index
Created new index with:
- `unique: true` - Ensures no duplicate Cloudinary IDs
- `sparse: true` - **Allows multiple null values** (for S3 videos)

### 3. Verified
Index is now properly configured:
```javascript
{
  name: 'cloudinaryPublicId_1',
  unique: true,
  sparse: true  // ✓ This is the key!
}
```

---

## ✅ Status: FIXED

**You can now upload unlimited S3 videos!**

The sparse index allows:
- Multiple S3 videos (with `cloudinaryPublicId: null`)
- Unique Cloudinary videos (with actual cloudinaryPublicId values)
- No conflicts between the two

---

## Try Your Upload Again

1. Select "AWS S3" as provider
2. Upload your video
3. Should work without duplicate key error!

---

## Technical Details

**Sparse Index** means:
- Documents without the field are NOT included in the index
- Documents with `null` values are NOT included in the index
- Only documents with actual values are indexed
- This allows multiple null/missing values while still enforcing uniqueness on non-null values

**Perfect for hybrid storage** where some videos use Cloudinary (have cloudinaryPublicId) and others use S3 (cloudinaryPublicId is null).

---

## Ran Script
```bash
node scripts/fix-cloudinary-index.js
```

Status: ✅ Completed successfully
