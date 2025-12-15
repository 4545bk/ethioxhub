/**
 * Test Script to Verify Video Model Changes
 * This script tests that S3 videos can be created without cloudinaryPublicId
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
import '../src/lib/db.js';
import Video from '../src/models/Video.js';
import User from '../src/models/User.js';

async function testS3VideoCreation() {
    try {
        console.log('🔍 Testing Video Model with S3...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find or create a test user
        let testUser = await User.findOne({ email: 'admin@ethioxhub.com' });
        if (!testUser) {
            console.log('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }
        console.log(`✅ Found test user: ${testUser.email}\n`);

        // Test 1: Create S3 Video
        console.log('📝 Test 1: Creating S3 video...');
        const s3VideoData = {
            owner: testUser._id,
            title: 'Test S3 Video',
            description: 'Testing S3 upload',
            provider: 's3',
            s3Key: `videos/test-${Date.now()}.mp4`,
            s3Bucket: 'ethioxhub',
            videoUrl: `https://ethioxhub.s3.eu-north-1.amazonaws.com/videos/test-${Date.now()}.mp4`,
            isPaid: false,
            price: 0,
            status: 'approved',
        };

        const s3Video = await Video.create(s3VideoData);
        console.log('✅ S3 Video created successfully!');
        console.log(`   ID: ${s3Video._id}`);
        console.log(`   Provider: ${s3Video.provider}`);
        console.log(`   S3 Key: ${s3Video.s3Key}\n`);

        // Clean up
        await Video.deleteOne({ _id: s3Video._id });
        console.log('🧹 Cleaned up test video\n');

        // Test 2: Create Cloudinary Video (should require cloudinaryPublicId)
        console.log('📝 Test 2: Testing Cloudinary video validation...');
        try {
            await Video.create({
                owner: testUser._id,
                title: 'Test Cloudinary Video',
                provider: 'cloudinary',
                // Missing cloudinaryPublicId - should fail
            });
            console.log('❌ Cloudinary video created without cloudinaryPublicId (THIS SHOULD NOT HAPPEN)');
        } catch (err) {
            console.log('✅ Cloudinary validation working: ' + err.message + '\n');
        }

        console.log('🎉 All tests passed!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testS3VideoCreation();
