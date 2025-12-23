require('dotenv').config();

// Force Sandbox URL since verification confirmed token is Sandbox
const API_URL = 'https://sandbox-api.polar.sh/v1/products';
const TOKEN = process.env.POLAR_ACCESS_TOKEN;

async function listProducts() {
    console.log(`\n📡 Fetching products from SANDBOX...`);

    try {
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const data = await res.json();

        console.log(`\n📦 Found ${data.items ? data.items.length : 0} products:\n`);

        if (data.items) {
            data.items.forEach(p => {
                console.log(`🔹 Product: "${p.name}" (ID: ${p.id})`);
                p.prices.forEach(price => {
                    console.log(`   🔸 Price ID: ${price.id}`);
                    console.log(`      Amount: ${price.amount_type === 'custom' ? 'Pay What You Want' : price.price_amount / 100}`);
                });
                console.log('');
            });
        }

        console.log(`\n🛑 IF YOU DON'T SEE YOUR NEW PRODUCT ABOVE:`);
        console.log(`1. You likely created it in the LIVE dashboard instead of Sandbox.`);
        console.log(`2. Go to https://sandbox.polar.sh/dashboard instead of polar.sh`);
        console.log(`3. Create the product THERE.`);
        console.log(`4. Then run this script again.`);
    } catch (e) {
        console.error('Error:', e);
    }
}

listProducts();
