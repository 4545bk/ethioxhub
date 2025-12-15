/**
 * Fix Duplicate Key Error for S3 Videos
 * Drops and recreates cloudinaryPublicId index as sparse unique
 * 
 * Usage: node scripts/fix-cloudinary-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixIndex() {
    try {
        console.log('🔄 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const videosCollection = db.collection('videos');

        console.log('📝 Checking existing indexes...');
        const indexes = await videosCollection.indexes();
        console.log('Current indexes:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });
        console.log('');

        // Drop the problematic cloudinaryPublicId index if it exists
        console.log('📝 Dropping old cloudinaryPublicId index...');
        try {
            await videosCollection.dropIndex('cloudinaryPublicId_1');
            console.log('   ✓ Dropped cloudinaryPublicId_1 index\n');
        } catch (err) {
            if (err.code === 27) {
                console.log('   ℹ Index does not exist (already dropped)\n');
            } else {
                throw err;
            }
        }

        // Create new sparse unique index
        console.log('📝 Creating new sparse unique index...');
        await videosCollection.createIndex(
            { cloudinaryPublicId: 1 },
            {
                unique: true,
                sparse: true,  // This allows multiple null values
                name: 'cloudinaryPublicId_1'
            }
        );
        console.log('   ✓ Created sparse unique index on cloudinaryPublicId\n');

        // Verify the new index
        console.log('📝 Verifying new indexes...');
        const newIndexes = await videosCollection.indexes();
        const cloudinaryIndex = newIndexes.find(idx => idx.name === 'cloudinaryPublicId_1');
        if (cloudinaryIndex) {
            console.log('   ✓ Index verified:');
            console.log('     - Name:', cloudinaryIndex.name);
            console.log('     - Unique:', cloudinaryIndex.unique);
            console.log('     - Sparse:', cloudinaryIndex.sparse);
            console.log('');
        }

        console.log('✅ Index fix complete!\n');
        console.log('You can now upload S3 videos without duplicate key errors.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixIndex();
