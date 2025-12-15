
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
// Define schema inline to avoid import issues
const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    status: String,
    senderName: String,
    metadata: Object
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkDeposits() {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is missing');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const count = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
        console.log(`Pending Deposits Count: ${count}`);

        const deposits = await Transaction.find({ type: 'deposit', status: 'pending' }).limit(5);
        console.log('Sample Deposits:', JSON.stringify(deposits, null, 2));

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

checkDeposits();
