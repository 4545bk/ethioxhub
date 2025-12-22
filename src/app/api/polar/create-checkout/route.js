/**
 * Polar.sh Checkout Creation API
 * POST /api/polar/create-checkout
 * 
 * PURPOSE: Generate a Polar checkout session for international card payments
 * IMPORTANT: This ONLY creates a session. Balance changes happen via webhook.
 * 
 * INTEGRATION: Additive only - does not modify existing deposit flows
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { priceId, customAmount } = body; // customAmount in cents (e.g., 5000 = $50)

        // Either priceId or customAmount must be provided
        if (!priceId && !customAmount) {
            return NextResponse.json({ error: 'Price ID or custom amount is required' }, { status: 400 });
        }

        // For preset amounts, validate the price ID
        if (priceId) {
            const allowedPrices = [
                process.env.POLAR_PRICE_ID_50,
                process.env.POLAR_PRICE_ID_100,
                process.env.POLAR_PRICE_ID_200,
            ].filter(Boolean);

            if (!allowedPrices.includes(priceId)) {
                return NextResponse.json({ error: 'Invalid price option' }, { status: 400 });
            }
        }

        // For custom amounts, validate minimum
        if (customAmount && customAmount < 100) { // Minimum $1.00
            return NextResponse.json({ error: 'Minimum deposit is $1.00' }, { status: 400 });
        }

        // Determine API endpoint (sandbox or production)
        const apiEndpoint = process.env.POLAR_ACCESS_TOKEN?.includes('sandbox') || process.env.POLAR_ACCESS_TOKEN?.startsWith('polar_oat_2')
            ? 'https://sandbox-api.polar.sh'
            : 'https://api.polar.sh';

        let checkoutPayload;

        if (customAmount) {
            // For custom amounts, create a dynamic product on-the-fly using custom_field_data
            checkoutPayload = {
                payment_processor: 'stripe',
                amount: customAmount, // Amount in cents
                currency: 'USD',
                customer_email: user.email,
                customer_name: user.username,
                customer_billing_address: {
                    country: 'US',
                },
                metadata: {
                    ethioxhub_user_id: user._id.toString(),
                    custom_deposit: 'true',
                },
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/polar/success?session_id={CHECKOUT_ID}`,
            };
        } else {
            // For preset amounts, use the existing price ID
            checkoutPayload = {
                payment_processor: 'stripe',
                product_price_id: priceId,
                customer_email: user.email,
                customer_name: user.username,
                customer_billing_address: {
                    country: 'US',
                },
                metadata: {
                    ethioxhub_user_id: user._id.toString(),
                },
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/polar/success?session_id={CHECKOUT_ID}`,
            };
        }

        // Create Polar checkout session
        const checkoutResponse = await fetch(`${apiEndpoint}/v1/checkouts/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutPayload),
        });

        if (!checkoutResponse.ok) {
            const error = await checkoutResponse.text();
            console.error('Polar checkout creation failed:', error);
            return NextResponse.json(
                { error: 'Failed to create checkout session' },
                { status: 500 }
            );
        }

        const checkout = await checkoutResponse.json();

        return NextResponse.json({
            success: true,
            checkoutUrl: checkout.url,
            checkoutId: checkout.id,
        });

    } catch (error) {
        console.error('Polar checkout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
