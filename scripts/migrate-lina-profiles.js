/**
 * Lina Profiles Migration Script
 * 
 * PURPOSE: Migrate profiles from old Formlina database to EthioxHub LinaProfile collection
 * 
 * USAGE:
 * 1. Set FORMLINA_MONGODB_URI in .env (the old database connection string)
 * 2. Run: node scripts/migrate-lina-profiles.js
 * 3. Verify: Check /lina-girls page
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Old Formlina Profile Schema
const OldProfileSchema = new mongoose.Schema({
    name: String,
    age: Number,
    country: String,
    city: String,
    neighborhood: String,
    localSalary: Boolean,
    intlSalary: Boolean,
    photoUrl: String,
    additionalPhotos: [String],
    contactInfo: String,
    voiceId: String,
    isUnlocked: Boolean,
    unlockedBy: String,
}, { collection: 'profiles' });

// New EthioxHub LinaProfile Schema
const NewLinaProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 18 },
    country: { type: String, required: true },
    city: { type: String },
    neighborhood: { type: String },
    localSalary: { type: Boolean, default: false },
    intlSalary: { type: Boolean, default: false },
    photoUrl: { type: String, required: true },
    additionalPhotos: [{ type: String }],
    contactInfo: { type: String, required: true },
    voiceId: { type: String, default: 'voice1' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'linaprofiles', timestamps: true });

async function migrate() {
    console.log('🚀 Starting Lina Profiles Migration...\n');

    // Validate environment variables
    const ethioxhubDB = process.env.MONGODB_URI;
    const formlinaDB = process.env.FORMLINA_MONGODB_URI;

    if (!ethioxhubDB) {
        console.error('❌ Error: MONGODB_URI not found in .env');
        process.exit(1);
    }

    if (!formlinaDB) {
        console.error('❌ Error: FORMLINA_MONGODB_URI not found in .env');
        console.log('\n📝 Please add to your .env file:');
        console.log('FORMLINA_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/formlina-db\n');
        process.exit(1);
    }

    try {
        // Connect to OLD Formlina database
        console.log('📡 Connecting to Formlina database...');
        const oldConn = await mongoose.createConnection(formlinaDB, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).asPromise();
        console.log('✅ Connected to Formlina DB\n');

        const OldProfile = oldConn.model('Profile', OldProfileSchema);

        // Connect to NEW EthioxHub database
        console.log('📡 Connecting to EthioxHub database...');
        const newConn = await mongoose.createConnection(ethioxhubDB, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).asPromise();
        console.log('✅ Connected to EthioxHub DB\n');

        const NewLinaProfile = newConn.model('LinaProfile', NewLinaProfileSchema);

        // Fetch all profiles from old database
        console.log('📥 Fetching profiles from Formlina...');
        const oldProfiles = await OldProfile.find().lean();
        console.log(`✅ Found ${oldProfiles.length} profiles\n`);

        if (oldProfiles.length === 0) {
            console.log('⚠️  No profiles to migrate. Exiting.\n');
            await oldConn.close();
            await newConn.close();
            process.exit(0);
        }

        // Check if already migrated
        const existingCount = await NewLinaProfile.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Warning: ${existingCount} profiles already exist in EthioxHub.`);
            console.log('This script will skip duplicates based on contactInfo.\n');
        }

        // Migrate each profile
        let migrated = 0;
        let skipped = 0;

        for (const oldProfile of oldProfiles) {
            try {
                // Check if already migrated (by contact info)
                const exists = await NewLinaProfile.findOne({
                    contactInfo: oldProfile.contactInfo
                });

                if (exists) {
                    console.log(`⏭️  Skipped: ${oldProfile.name} (already exists)`);
                    skipped++;
                    continue;
                }

                // Create new profile
                const newProfile = new NewLinaProfile({
                    name: oldProfile.name,
                    age: oldProfile.age,
                    country: oldProfile.country,
                    city: oldProfile.city || '',
                    neighborhood: oldProfile.neighborhood || '',
                    localSalary: oldProfile.localSalary || false,
                    intlSalary: oldProfile.intlSalary || false,
                    photoUrl: oldProfile.photoUrl,
                    additionalPhotos: oldProfile.additionalPhotos || [],
                    contactInfo: oldProfile.contactInfo,
                    voiceId: oldProfile.voiceId || 'voice1',
                    isActive: true
                });

                await newProfile.save();
                console.log(`✅ Migrated: ${oldProfile.name}`);
                migrated++;

            } catch (error) {
                console.error(`❌ Error migrating ${oldProfile.name}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Migration Complete!');
        console.log('='.repeat(50));
        console.log(`✅ Migrated: ${migrated} profiles`);
        console.log(`⏭️  Skipped: ${skipped} profiles`);
        console.log(`📊 Total in EthioxHub: ${migrated + existingCount}\n`);

        // Close connections
        await oldConn.close();
        await newConn.close();

        console.log('✅ Database connections closed.');
        console.log('\n🚀 Next Steps:');
        console.log('1. Visit http://localhost:3000/lina-girls');
        console.log('2. You should see the migrated profiles!\n');

    } catch (error) {
        console.error('\n❌ Migration Error:', error);
        process.exit(1);
    }
}

// Run migration
migrate();
