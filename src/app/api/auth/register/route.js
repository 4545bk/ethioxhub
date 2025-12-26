/**
 * User Registration API Route
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { checkRateLimit, getIdentifier } from '@/lib/rateLimit';

// Helper function to credit referral bonus
async function creditReferralBonus(referrer, newUsername, Transaction) {
    const bonusAmount = 500; // 5 ETB
    referrer.balance += bonusAmount;
    referrer.referralCount += 1;
    referrer.totalReferralEarnings += bonusAmount;

    // Add notification
    if (!referrer.notifications) referrer.notifications = [];
    referrer.notifications.push({
        type: 'referral',
        message: `Another user joined! You shared ${referrer.referralCount} times.`,
        read: false,
        createdAt: new Date()
    });

    await referrer.save();

    // Create transaction record
    await Transaction.create({
        userId: referrer._id,
        amount: bonusAmount,
        type: 'referral_bonus',
        status: 'approved',
        metadata: {
            notes: `Referral bonus for user registration: ${newUsername}`
        }
    });

    return referrer._id;
}

export async function POST(request) {
    try {
        // Rate limiting
        const identifier = getIdentifier(request);
        const rateCheck = checkRateLimit(identifier, 'auth/register');

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { username, email, password, verifiedAge, referralCode, shareCode } = validation.data;

        // Connect to database
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
            return NextResponse.json(
                { error: `User with this ${field} already exists` },
                { status: 409 }
            );
        }

        // Handle Referral Logic with Fraud Detection
        let referrerId = null;
        if (referralCode) {
            // Assuming referralCode is the referrer's _id
            try {
                const referrer = await User.findById(referralCode);
                if (referrer) {
                    // Anti-Fraud Check
                    const { detectReferralFraud, logSuspiciousActivity, sanitizeInput } = await import('@/lib/security');
                    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

                    const fraudCheck = await detectReferralFraud(referrer._id, null, ipAddress);

                    if (fraudCheck.isFraudulent) {
                        // Log suspicious activity
                        await logSuspiciousActivity('referral_fraud_detected', {
                            referrerId: referrer._id.toString(),
                            indicators: fraudCheck.indicators,
                            severity: fraudCheck.severity,
                            ipAddress,
                            attemptedBy: username
                        });

                        // Still create the user but DON'T credit referral bonus if high severity
                        if (fraudCheck.severity === 'high') {
                            console.warn('[FRAUD] Referral bonus blocked:', fraudCheck.indicators);
                            referrerId = referrer._id; // Link but don't reward
                        } else {
                            // Medium severity: Allow but log
                            referrerId = await creditReferralBonus(referrer, username, Transaction);
                        }
                    } else {
                        // No fraud detected: Process normally
                        referrerId = await creditReferralBonus(referrer, username, Transaction);
                    }
                }
            } catch (refErr) {
                console.warn('Referral processing failed:', refErr);
                // Continue registration even if referral fails
            }
        }

        // Sanitize user inputs before saving
        const { sanitizeInput } = await import('@/lib/security');
        const sanitizedUsername = sanitizeInput(username, 'username');
        const sanitizedEmail = sanitizeInput(email, 'email');

        // Hash password and create user
        const passwordHash = await User.hashPassword(password);

        const user = await User.create({
            username: sanitizedUsername,
            email: sanitizedEmail,
            passwordHash,
            verifiedAge: verifiedAge || false,
            balance: 10000, // 100 ETB Signup Bonus! 🎁
            referredBy: referrerId,
            metadata: {
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                registeredAt: new Date(),
            },
        });

        // Create Transaction for Signup Bonus
        await Transaction.create({
            userId: user._id,
            amount: 10000,
            type: 'deposit', // Treated as a deposit/bonus
            status: 'approved',
            metadata: {
                notes: 'Welcome Bonus: 100 ETB Free'
            }
        });

        // Handle Social Share Rewards
        if (shareCode) {
            try {
                const sharer = await User.findById(shareCode);
                if (sharer && sharer._id.toString() !== user._id.toString()) {
                    // Check if daily limit reached
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    // Reset counter if it's a new day
                    if (sharer.lastShareRewardReset) {
                        const lastReset = new Date(sharer.lastShareRewardReset);
                        const lastResetDay = new Date(
                            lastReset.getFullYear(),
                            lastReset.getMonth(),
                            lastReset.getDate()
                        );

                        if (lastResetDay.getTime() !== today.getTime()) {
                            // New day, reset counter
                            sharer.shareRewardsCount = 0;
                            sharer.lastShareRewardReset = now;
                        }
                    } else {
                        // First time, initialize
                        sharer.shareRewardsCount = 0;
                        sharer.lastShareRewardReset = now;
                    }

                    // Check daily limit (max 5 signups = 15 ETB)
                    const DAILY_SHARE_LIMIT = 5;
                    const SHARE_REWARD = 300; // 3 ETB in cents

                    if (sharer.shareRewardsCount < DAILY_SHARE_LIMIT) {
                        // Award the reward
                        sharer.balance += SHARE_REWARD;
                        sharer.totalShareRewards += SHARE_REWARD;
                        sharer.shareRewardsCount += 1;

                        // Add notification
                        if (!sharer.notifications) sharer.notifications = [];
                        sharer.notifications.push({
                            type: 'success',
                            message: `🎉 Someone signed up from your share! You earned 3.00 ETB. (${sharer.shareRewardsCount}/${DAILY_SHARE_LIMIT} today)`,
                            link: '/',
                            read: false,
                            createdAt: now
                        });

                        await sharer.save();

                        // Create transaction record
                        await Transaction.create({
                            userId: sharer._id,
                            amount: SHARE_REWARD,
                            type: 'referral_bonus',
                            status: 'approved',
                            metadata: {
                                notes: `Share Reward - ${username} signed up via share link`,
                                newUserId: user._id.toString(),
                                dailyCount: sharer.shareRewardsCount,
                            }
                        });

                        console.log(`Share reward awarded: ${sharer.username} earned 3 ETB from ${username} signup`);
                    } else {
                        console.log(`Share reward limit reached for ${sharer.username} today`);
                    }
                }
            } catch (shareErr) {
                console.warn('Share reward processing failed:', shareErr);
                // Continue registration even if share reward fails
            }
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString(), user.roles);
        const refreshToken = generateRefreshToken(user._id.toString());

        // Return tokens (refresh token in HttpOnly cookie)
        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    balance: user.balance,
                    roles: user.roles,
                },
                accessToken,
            },
            { status: 201 }
        );

        // Set refresh token in HttpOnly cookie
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (err) {
        console.error('Registration error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
