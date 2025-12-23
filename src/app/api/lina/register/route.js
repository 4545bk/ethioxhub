import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import cloudinary from '@/lib/cloudinary';

export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();

        const name = formData.get('name');
        const age = parseInt(formData.get('age'));
        const country = formData.get('country');
        const city = formData.get('city') || '';
        const neighborhood = formData.get('neighborhood') || '';
        const localSalary = formData.get('localSalary') === 'true';
        const intlSalary = formData.get('intlSalary') === 'true';
        const contactInfo = formData.get('contactInfo');
        const telegramUsername = formData.get('telegramUsername') || '';

        // Main photo (required)
        const mainPhoto = formData.get('mainPhoto');

        // Additional photos (optional, up to 3)
        const additionalPhotos = [];
        for (let i = 1; i <= 3; i++) {
            const photo = formData.get(`additionalPhoto${i}`);
            if (photo) additionalPhotos.push(photo);
        }

        // Validation
        if (!name || !age || !country || !contactInfo || !mainPhoto) {
            return NextResponse.json({
                error: 'Missing required fields: name, age, country, contactInfo, mainPhoto'
            }, { status: 400 });
        }

        if (age < 18) {
            return NextResponse.json({
                error: 'Age must be 18 or older'
            }, { status: 400 });
        }

        // Upload main photo to Cloudinary
        const mainPhotoBuffer = Buffer.from(await mainPhoto.arrayBuffer());
        const mainPhotoUpload = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'lina-profiles', resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(mainPhotoBuffer);
        });

        // Upload additional photos
        const additionalPhotoUrls = [];
        for (const photo of additionalPhotos) {
            const buffer = Buffer.from(await photo.arrayBuffer());
            const upload = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'lina-profiles', resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(buffer);
            });
            additionalPhotoUrls.push(upload.secure_url);
        }

        // Create profile
        const profile = new LinaProfile({
            name,
            age,
            country,
            city,
            neighborhood,
            localSalary,
            intlSalary,
            photoUrl: mainPhotoUpload.secure_url,
            additionalPhotos: additionalPhotoUrls,
            contactInfo,
            telegramUsername,
            isActive: true // Auto-activate (can be moderated by admin later)
        });

        await profile.save();

        return NextResponse.json({
            success: true,
            message: 'Profile registered successfully! It will be visible on the site shortly.',
            profileId: profile._id
        });

    } catch (error) {
        console.error('Error registering Lina profile:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
