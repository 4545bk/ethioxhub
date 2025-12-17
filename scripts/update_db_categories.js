const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config(); // Loads .env by default
dotenv.config({ path: '.env.local' }); // Overrides with .env.local if exists

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Define minimal Schema inline to avoid import issues
const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
    enabled: Boolean
}, { strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const mapping = {
    'Comedy': 'Live records',
    'Education': 'Fuck',
    'Entertainment': 'Naked',
    'Gaming': 'Unfiltered',
    'Music': 'Behind the scenes',
    'News': 'habesha',
    'Sports': 'secrets',
    'Technology': 'photos'
};

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const [oldName, newName] of Object.entries(mapping)) {
            // Check if old exists
            const oldCat = await Category.findOne({ name: oldName });

            if (oldCat) {
                // Update it
                await Category.updateOne(
                    { _id: oldCat._id },
                    {
                        $set: {
                            name: newName,
                            slug: slugify(newName)
                        }
                    }
                );
                console.log(`Renamed "${oldName}" to "${newName}"`);
            } else {
                // Check if new already exists
                const newCat = await Category.findOne({ name: newName });
                if (!newCat) {
                    // Create it
                    await Category.create({
                        name: newName,
                        slug: slugify(newName),
                        description: newName + ' content',
                        enabled: true
                    });
                    console.log(`Created new category "${newName}"`);
                } else {
                    console.log(`Category "${newName}" already exists`);
                }
            }
        }

        console.log('Migration complete');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
