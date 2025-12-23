require('dotenv').config();

const fetchProducts = async (isSandbox) => {
    const token = process.env.POLAR_ACCESS_TOKEN;
    const envName = isSandbox ? 'SANDBOX' : 'PRODUCTION';
    const baseUrl = isSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

    console.log(`\n🔵 Checking ${envName} (${baseUrl})...`);

    try {
        const response = await fetch(`${baseUrl}/v1/products?limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            console.log(`❌ Token not accepted in ${envName} (401 Unauthorized)`);
            return;
        }

        if (!response.ok) {
            console.log(`❌ Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(text);
            return;
        }

        const data = await response.json();
        console.log(`✅ Success! Found ${data.items ? data.items.length : 0} products.`);

        if (data.items && data.items.length > 0) {
            data.items.forEach(product => {
                console.log(`\n--------------------------------------------------`);
                console.log(`🛒 PRODUCT: ${product.name}`);
                console.log(`   ID: ${product.id}`);

                if (product.prices && product.prices.length > 0) {
                    product.prices.forEach((price, idx) => {
                        const amount = price.amount_type === 'custom'
                            ? 'PAY WHAT YOU WANT'
                            : `$${price.price_amount / 100}`;

                        console.log(`   🏷️  Price #${idx + 1}: [${amount}]`);
                        console.log(`       PRICE ID (Use this one!): ${price.id}`);
                        console.log(`       Type: ${price.amount_type}`);
                    });
                } else {
                    console.log(`   ⚠️  No prices defined for this product.`);
                }
            });
            console.log(`--------------------------------------------------\n`);
        }

    } catch (error) {
        console.error(`❌ Connection failed: ${error.message}`);
    }
};

async function main() {
    console.log('🔍 Searching for Price IDs...');
    // Try both environments to be sure
    await fetchProducts(true);  // Sandbox
    await fetchProducts(false); // Production
}

main();
