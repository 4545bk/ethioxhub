/**
 * Debug Script to Check S3 Video Data
 * Run with: node debug-s3-videos.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkS3Videos() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Import Video model
        const Video = require('./src/models/Video').default;

        // Find all S3 videos
        const s3Videos = await Video.find({ provider: 's3' }).limit(5);

        console.log(`📊 Found ${s3Videos.length} S3 videos\n`);
        console.log('='.repeat(80));

        s3Videos.forEach((video, index) => {
            console.log(`\n🎬 VIDEO ${index + 1}: ${video.title}`);
            console.log('-'.repeat(80));
            console.log(`Provider: ${video.provider}`);
            console.log(`Duration: ${video.duration || '❌ MISSING'}`);
            console.log(`VideoURL: ${video.videoUrl || '❌ MISSING'}`);
            console.log(`S3 Key: ${video.s3Key || '❌ MISSING'}`);
            console.log(`S3 Bucket: ${video.s3Bucket || '❌ MISSING'}`);
            console.log(`URL field: ${video.url || '❌ MISSING'}`);
            console.log(`Thumbnail: ${video.thumbnailUrl || '❌ MISSING'}`);

            // Check which URL would be used
            console.log('\n🔍 URL Detection Logic:');
            if (video.videoUrl) {
                console.log(`✅ Would use: videoUrl = ${video.videoUrl}`);
            } else if (video.s3Key && video.s3Bucket) {
                const constructedUrl = `https://${video.s3Bucket}.s3.eu-north-1.amazonaws.com/${video.s3Key}`;
                console.log(`✅ Would construct: ${constructedUrl}`);
            } else if (video.url) {
                console.log(`✅ Would use: url = ${video.url}`);
            } else {
                console.log(`❌ NO URL AVAILABLE - Preview will NOT work!`);
            }

            console.log('\n' + '='.repeat(80));
        });

        // Summary
        console.log('\n\n📋 SUMMARY:');
        console.log('-'.repeat(80));

        const withVideoUrl = await Video.countDocuments({ provider: 's3', videoUrl: { $exists: true, $ne: null } });
        const withS3Key = await Video.countDocuments({ provider: 's3', s3Key: { $exists: true, $ne: null } });
        const withDuration = await Video.countDocuments({ provider: 's3', duration: { $exists: true, $gt: 0 } });
        const total = await Video.countDocuments({ provider: 's3' });

        console.log(`Total S3 videos: ${total}`);
        console.log(`With videoUrl: ${withVideoUrl} (${Math.round(withVideoUrl / total * 100)}%)`);
        console.log(`With s3Key: ${withS3Key} (${Math.round(withS3Key / total * 100)}%)`);
        console.log(`With duration: ${withDuration} (${Math.round(withDuration / total * 100)}%)`);

        console.log('\n\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(80));

        if (withVideoUrl < total && withS3Key < total) {
            console.log('❌ Missing URL fields! Need to populate videoUrl or s3Key+s3Bucket');
        }
        if (withDuration < total) {
            console.log('❌ Missing duration! Need to populate duration field');
        }

        if (withVideoUrl === total && withDuration === total) {
            console.log('✅ All S3 videos have required fields!');
            console.log('   If previews still not working, check browser console');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n\n✅ Done!');
    }
}

checkS3Videos();
