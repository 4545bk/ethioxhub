/**
 * Input Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string()
        .email('Invalid email address'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters'),
    verifiedAge: z.boolean().optional(),
    referralCode: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Deposit schemas
export const createDepositSchema = z.object({
    amount: z.number()
        .min(100, 'Minimum deposit is 1 ETB (100 cents)')
        .max(10000000, 'Maximum deposit is 100,000 ETB')
        .int('Amount must be in cents (integer)'),
    cloudinaryUrl: z.string().url('Invalid image URL'),
    cloudinaryId: z.string(),
    senderName: z.string().optional(),
    metadata: z.object({
        senderName: z.string().optional(),
        transactionCode: z.string().optional(),
        phone: z.string().optional(),
        rawText: z.string().optional(),
    }).optional(),
});

export const approveDepositSchema = z.object({
    txId: z.string(),
    adminNote: z.string().optional(),
    token: z.string(),
});

export const rejectDepositSchema = z.object({
    txId: z.string(),
    adminNote: z.string().min(1, 'Rejection reason is required'),
    token: z.string(),
});

// Video schemas
export const createVideoSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters'),
    description: z.string()
        .max(2000, 'Description must be less than 2000 characters')
        .optional(),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
    visibility: z.enum(['public', 'unlisted', 'private', 'vip']),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    cloudinaryPublicId: z.string(),
    thumbnailUrl: z.string().url().optional(),
});

// Admin schemas
export const adjustBalanceSchema = z.object({
    amount: z.number().int('Amount must be in cents'),
    reason: z.string().min(5, 'Reason is required (min 5 characters)'),
});

export const banUserSchema = z.object({
    reason: z.string().min(5, 'Ban reason is required'),
});

// Pagination schema
export const paginationSchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

// Video query schema
export const videoQuerySchema = paginationSchema.extend({
    tags: z.string().optional(),
    visibility: z.enum(['public', 'unlisted', 'private', 'vip']).optional(),
    search: z.string().optional(),
});
