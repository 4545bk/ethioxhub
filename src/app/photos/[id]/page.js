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

        // VIP Logic (Cloudinary Blur or S3 Fallback)
        if (photo.isPaid) {
            if (imageUrl && imageUrl.includes('cloudinary.com')) {
                const price = (photo.price / 100).toFixed(2);
                const text = `🔒 Premium Content - ${price} ETB`;
                const encodedText = encodeURIComponent(text).replace(/%20/g, '%20');
                const branding = encodeURIComponent('EthioxHub');

                const transformation = `e_blur:2000` +
                    `/co_rgb:FFD700,l_text:Arial_60_bold:${encodedText},e_outline:outer:4:000000/fl_layer_apply,g_center` +
                    `/co_white,l_text:Arial_30_bold:${branding},e_shadow:50,o_80/fl_layer_apply,g_south,y_20`;

                imageUrl = imageUrl.replace('/upload/', `/upload/${transformation}/`);
            } else {
                // S3 Fallback
                imageUrl = 'https://placehold.co/1200x630/111827/FFD700/png?text=🔒+Premium+Content+Locked&font=roboto';
            }
        }

        return {
            title: `${title} - EthioxHub`,
            description,
            openGraph: {
                title: title,
                description,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description,
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
