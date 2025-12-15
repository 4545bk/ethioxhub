const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const VideoSchema = new mongoose.Schema({}, { strict: false });
const TransactionSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Video = mongoose.model('Video', VideoSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function checkStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const totalUsers = await User.countDocuments({});
        console.log('Total Users:', totalUsers);

        // Check Transaction Types
        const txTypes = await Transaction.distinct('type');
        console.log('Transaction Types:', txTypes);

        const txStatuses = await Transaction.distinct('status');
        console.log('Transaction Statuses:', txStatuses);

        const deposits = await Transaction.countDocuments({ type: 'deposit', status: 'approved' });
        console.log('Approved Deposits Count:', deposits);

        const depositSum = await Transaction.aggregate([
            { $match: { type: 'deposit', status: 'approved' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log('Deposit Sum (Revenue):', depositSum);

        // Check Video Statuses
        const vStatuses = await Video.distinct('status');
        console.log('Video Statuses:', vStatuses);

        const totalVideos = await Video.countDocuments({});
        console.log('Total Videos:', totalVideos);

        const pendingVideos = await Video.countDocuments({ status: 'pending_moderation' });
        console.log('Pending Moderation Videos:', pendingVideos);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkStats();
