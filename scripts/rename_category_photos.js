const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String
}, { strict: false });

// Avoid overwriting if compiled
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Look for 'photos' (case insensitive hopefully unnecessary if we know exact string)
        // We set it to 'photos' in previous migration? Or user replaced "Technology" with "photos".
        // The script Step 1438 renamed "Technology" to "photos" (lowercase).

        const oldName = 'photos';
        const newName = 'Ethiopian';

        const res = await Category.updateOne(
            { name: oldName },
            {
                $set: {
                    name: newName,
                    slug: newName.toLowerCase()
                }
            }
        );

        console.log(`Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);

        if (res.matchedCount > 0) {
            console.log(`Renamed "${oldName}" to "${newName}"`);
        } else {
            console.log(`Category "${oldName}" not found. Checking for "Photos"...`);
            const res2 = await Category.updateOne(
                { name: 'Photos' },
                { $set: { name: newName, slug: newName.toLowerCase() } }
            );
            console.log(`Matched (Photos): ${res2.matchedCount}`);
        }

        console.log('Migration complete');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
