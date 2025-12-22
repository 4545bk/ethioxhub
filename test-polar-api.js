// Quick script to fetch your Polar products and price IDs
const POLAR_ACCESS_TOKEN = 'polar_oat_2Mj43EjZiirg6imGS2rTejJABclXympbFzh1n2ZbC15';
const POLAR_ORG_ID = 'ethioxhub-test';

async function fetchProducts() {
    try {
        const response = await fetch(`https://sandbox-api.polar.sh/v1/products`, {
            headers: {
                'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Error:', error);
            return;
        }

        const data = await response.json();

        console.log('\n📦 YOUR POLAR PRODUCTS:\n');

        data.items?.forEach(product => {
            console.log(`\n🏷️  Product: ${product.name}`);
            console.log(`   Product ID: ${product.id}`);

            if (product.prices && product.prices.length > 0) {
                product.prices.forEach((price, index) => {
                    console.log(`\n   💰 Price #${index + 1}:`);
                    console.log(`      Price ID: ${price.id} ⬅️ USE THIS`);
                    console.log(`      Amount: $${price.price_amount / 100}`);
                    console.log(`      Type: ${price.type}`);
                });
            } else {
                console.log('   ⚠️  No prices found - you may need to create prices for this product');
            }
            console.log('\n' + '─'.repeat(60));
        });

        console.log('\n\n✅ Copy the "Price ID" values to your .env file\n');

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
    }
}

fetchProducts();
