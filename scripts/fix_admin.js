
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
// Define schema inline
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    roles: [String]
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUser() {
    try {
        if (!process.env.MONGODB_URI) { console.log('No URI'); return; }
        await mongoose.connect(process.env.MONGODB_URI);

        // Find the user 'testuser' or similar. We'll list all admins.
        const admins = await User.find({ roles: 'admin' });
        console.log('Current Admins:', admins.map(u => u.username));

        // Find testuser
        const testUser = await User.findOne({ email: 'test@example.com' });
        if (testUser) {
            console.log(`Test User roles: ${testUser.roles}`);
            if (!testUser.roles.includes('admin')) {
                console.log('Fixing testuser role to admin...');
                testUser.roles.push('admin');
                await testUser.save();
                console.log('Fixed.');
            }
        } else {
            console.log('Test user not found with email test@example.com');
        }

        await mongoose.disconnect();
    } catch (e) { console.error(e); }
}
checkUser();
