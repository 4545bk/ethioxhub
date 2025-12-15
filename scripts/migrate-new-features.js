/**
 * Migration Script: Add New Fields to Existing Collections
 * Run this once to update existing database with new schema fields
 * 
 * Usage: node scripts/migrate-new-features.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
    try {
        console.log('🔄 Starting migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // 1. Add new fields to Video collection
        console.log('📝 Updating Video collection...');
        const videosResult = await db.collection('videos').updateMany(
            {},
            {
                $set: {
                    likesCount: 0,
                    dislikesCount: 0,
                    commentsCount: 0,
                    likedBy: [],
                    dislikedBy: [],
                }
            }
        );
        console.log(`   ✓ Updated ${videosResult.modifiedCount} videos\n`);

        // 2. Ensure indexes on Video collection
        console.log('📝 Creating indexes on videos...');
        await db.collection('videos').createIndex({ category: 1 });
        await db.collection('videos').createIndex({ likesCount: -1 });
        await db.collection('videos').createIndex({ commentsCount: -1 });
        console.log('   ✓ Indexes created\n');

        // 3. Create Categories collection with default categories
        console.log('📝 Creating default categories...');
        const categoriesExist = await db.collection('categories').countDocuments();

        if (categoriesExist === 0) {
            const defaultCategories = [
                { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment videos', enabled: true, videoCount: 0 },
                { name: 'Education', slug: 'education', description: 'Educational content', enabled: true, videoCount: 0 },
                { name: 'Music', slug: 'music', description: 'Music videos and performances', enabled: true, videoCount: 0 },
                { name: 'Gaming', slug: 'gaming', description: 'Gaming content', enabled: true, videoCount: 0 },
                { name: 'Sports', slug: 'sports', description: 'Sports highlights and events', enabled: true, videoCount: 0 },
                { name: 'News', slug: 'news', description: 'News and current events', enabled: true, videoCount: 0 },
                { name: 'Technology', slug: 'technology', description: 'Tech reviews and tutorials', enabled: true, videoCount: 0 },
                { name: 'Comedy', slug: 'comedy', description: 'Comedy and funny videos', enabled: true, videoCount: 0 },
            ];

            const result = await db.collection('categories').insertMany(
                defaultCategories.map(cat => ({
                    ...cat,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }))
            );
            console.log(`   ✓ Created ${result.insertedCount} default categories\n`);
        } else {
            console.log(`   ℹ Categories already exist (${categoriesExist})\n`);
        }

        // 4. Create indexes for new collections
        console.log('📝 Creating indexes for new collections...');

        // Comments indexes
        await db.collection('comments').createIndex({ videoId: 1, createdAt: -1 });
        await db.collection('comments').createIndex({ userId: 1 });
        await db.collection('comments').createIndex({ videoId: 1, parentId: 1, createdAt: -1 });

        // WatchProgress indexes
        await db.collection('watchprogresses').createIndex({ userId: 1, videoId: 1 }, { unique: true });
        await db.collection('watchprogresses').createIndex({ userId: 1, lastSeenAt: -1 });

        // WatchHistory indexes
        await db.collection('watchhistories').createIndex({ userId: 1, watchedAt: -1 });

        console.log('   ✓ All indexes created\n');

        // 5. Normalize Transaction status field (fix case sensitivity)
        console.log('📝 Normalizing Transaction status fields...');
        await db.collection('transactions').updateMany(
            { status: 'Pending' },
            { $set: { status: 'pending' } }
        );
        await db.collection('transactions').updateMany(
            { status: 'Approved' },
            { $set: { status: 'approved' } }
        );
        await db.collection('transactions').updateMany(
            { status: 'Rejected' },
            { $set: { status: 'rejected' } }
        );
        console.log('   ✓ Status fields normalized\n');

        // 6. Add unlockedVideos array to users who don't have it
        console.log('📝 Ensuring all users have unlockedVideos array...');
        const usersResult = await db.collection('users').updateMany(
            { unlockedVideos: { $exists: false } },
            { $set: { unlockedVideos: [] } }
        );
        console.log(`   ✓ Updated ${usersResult.modifiedCount} users\n`);

        console.log('✅ Migration completed successfully!\n');
        console.log('Summary:');
        console.log('- Video schema updated with engagement fields');
        console.log('- Default categories created');
        console.log('- All indexes created');
        console.log('- Transaction statuses normalized');
        console.log('- User schemas updated\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
