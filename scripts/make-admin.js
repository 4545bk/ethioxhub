const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
}

// Minimal schema to match existing collection
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    passwordHash: String,
    roles: [String],
    balance: Number,
    reservedBalance: Number,
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createOrUpdateAdmin(email, password, username) {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        let user = await User.findOne({ email: email.toLowerCase() });
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        if (!user) {
            console.log(`Creating new admin user: ${username} (${email})`);
            user = await User.create({
                username,
                email: email.toLowerCase(),
                passwordHash,
                roles: ['user', 'admin'],
                balance: 0,
                reservedBalance: 0,
                verifiedAge: true
            });
            console.log(`✅ Successfully created admin user ${email}`);
        } else {
            console.log(`Updating existing user: ${email}`);
            user.roles = ['user', 'admin'];
            user.passwordHash = passwordHash;
            await User.updateOne({ _id: user._id }, {
                $set: {
                    roles: user.roles,
                    passwordHash: user.passwordHash
                }
            });
            console.log(`✅ Successfully updated ${email} to be an admin with new password`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createOrUpdateAdmin('abebe@gmail.com', 'Password123', 'abebe');
