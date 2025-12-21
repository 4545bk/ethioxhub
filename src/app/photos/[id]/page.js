import PhotoDetailClient from './PhotoDetailClient';
import connectDB from '../../../lib/db';
import Photo from '../../../models/Photo';

export async function generateMetadata({ params }) {
    try {
        // Simple connection without aggressive timeout
        await connectDB();

        const photo = await Photo.findById(params.id).select('title description url thumbnailUrl album isPaid price');

        if (!photo) {
            return {
                title: 'Photo Not Found - EthioxHub',
                description: 'The requested photo could not be found.',
            };
        }

        const title = photo.title || 'EthioxHub Photo';
        const description = photo.description || 'Exclusive content on EthioxHub';

        let imageUrl = photo.thumbnailUrl;
        if (!imageUrl) {
            if (photo.album && photo.album.length > 0) {
                imageUrl = photo.album[0];
            } else {
                imageUrl = photo.url;
            }
        }

        // Fallback for missing image
        if (!imageUrl) {
            imageUrl = 'https://placehold.co/1200x630/111827/FFD700/png?text=EthioxHub&font=roboto';
        }

        let metaTitle = title;
        let metaDesc = description;

        // VIP Logic
        if (photo.isPaid) {
            const price = (photo.price / 100).toFixed(2);
            metaTitle = `🔒 VIP: ${title} - ${price} ETB`;
            metaDesc = `This is premium content. Unlock to view the full photo. Price: ${price} ETB.`;

            if (imageUrl && imageUrl.includes('cloudinary.com')) {
                // Use simpler, more robust transformation for Telegram compatibility
                // e_pixelate:15 adds a "censored" look, e_blur:1000 ensures it's unreadable
                const transformation = 'e_pixelate:15,e_blur:1000';
                imageUrl = imageUrl.replace('/upload/', `/upload/${transformation}/`);
            } else {
                // S3 Fallback
                imageUrl = 'https://placehold.co/1200x630/111827/FFD700/png?text=Premium+Content+Locked&font=roboto';
            }
        }

        return {
            title: `${metaTitle} - EthioxHub`,
            description: metaDesc,
            openGraph: {
                title: metaTitle,
                description: metaDesc,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: metaTitle,
                description: metaDesc,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error('Metadata error:', error);
        return {
            title: 'EthioxHub Gallery',
            description: 'Check out this photo on EthioxHub',
            openGraph: {
                images: ['https://placehold.co/1200x630/111827/FFD700/png?text=EthioxHub&font=roboto']
            }
        };
    }
}

export default function Page({ params }) {
    return <PhotoDetailClient id={params.id} />;
}
