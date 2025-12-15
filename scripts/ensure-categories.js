/**
 * Ensure Default Categories Exist
 * Quick script to create default categories if they don't exist
 * 
 * Usage: node scripts/ensure-categories.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const defaultCategories = [
    { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment videos' },
    { name: 'Education', slug: 'education', description: 'Educational content' },
    { name: 'Music', slug: 'music', description: 'Music videos and performances' },
    { name: 'Gaming', slug: 'gaming', description: 'Gaming content' },
    { name: 'Sports', slug: 'sports', description: 'Sports highlights and events' },
    { name: 'News', slug: 'news', description: 'News and current events' },
    { name: 'Technology', slug: 'technology', description: 'Tech reviews and tutorials' },
    { name: 'Comedy', slug: 'comedy', description: 'Comedy and funny videos' },
];

async function ensureCategories() {
    try {
        console.log('🔄 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const categoriesCollection = db.collection('categories');

        console.log('📝 Checking existing categories...');
        const existingCount = await categoriesCollection.countDocuments();
        console.log(`   Found ${existingCount} existing categories\n`);

        if (existingCount === 0) {
            console.log('📝 Creating default categories...');
            const categoriesToInsert = defaultCategories.map(cat => ({
                ...cat,
                enabled: true,
                videoCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            const result = await categoriesCollection.insertMany(categoriesToInsert);
            console.log(`   ✓ Created ${result.insertedCount} categories\n`);
        } else {
            console.log('📝 Ensuring all default categories exist...');
            let addedCount = 0;

            for (const cat of defaultCategories) {
                const existing = await categoriesCollection.findOne({
                    $or: [{ slug: cat.slug }, { name: cat.name }]
                });

                if (!existing) {
                    await categoriesCollection.insertOne({
                        ...cat,
                        enabled: true,
                        videoCount: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    console.log(`   ✓ Added category: ${cat.name}`);
                    addedCount++;
                }
            }

            if (addedCount === 0) {
                console.log('   ℹ All default categories already exist\n');
            } else {
                console.log(`   ✓ Added ${addedCount} missing categories\n`);
            }
        }

        // List all categories
        console.log('📋 Current categories:');
        const allCategories = await categoriesCollection.find({}).toArray();
        allCategories.forEach((cat, i) => {
            console.log(`   ${i + 1}. ${cat.name} (${cat.slug}) - ${cat.enabled ? 'Enabled' : 'Disabled'}`);
        });

        console.log('\n✅ Category check complete!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

ensureCategories();
