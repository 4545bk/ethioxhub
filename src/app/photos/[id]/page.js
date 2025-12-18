import PhotoDetailClient from './PhotoDetailClient';
import connectDB from '../../../lib/db';
import Photo from '../../../models/Photo';

export async function generateMetadata({ params }) {
    try {
        await connectDB();
        const photo = await Photo.findById(params.id);

        if (!photo) {
            return {
                title: 'Photo Not Found - EthioxHub',
            };
        }

        const title = photo.title || 'Photo on EthioxHub';
        const description = photo.description || 'Check out this photo on EthioxHub!';
        // Use thumbnail if available, otherwise first album image or main url
        let imageUrl = photo.thumbnailUrl;
        if (!imageUrl) {
            if (photo.album && photo.album.length > 0) {
                imageUrl = photo.album[0];
            } else {
                imageUrl = photo.url;
            }
        }

        // Apply blur and overlay for separate specific VIP photos (Cloudinary only)
        if (photo.isPaid && imageUrl && imageUrl.includes('cloudinary.com')) {
            const price = (photo.price / 100).toFixed(2);
            const text = `Premium Content - ${price} ETB`;
            const encodedText = encodeURIComponent(text).replace(/%20/g, '%20'); // Ensure spaces are encoded

            // e_blur:1500 -> Heavy blur
            // l_text:... -> Overlay text with price
            const transformation = `e_blur:2000/co_white,l_text:Arial_60_bold:${encodedText},e_outline:outer:2:000000/fl_layer_apply,g_center`;

            imageUrl = imageUrl.replace('/upload/', `/upload/${transformation}/`);
        }

        return {
            title: `${title} - EthioxHub`,
            description: description,
            openGraph: {
                title: title,
                description: description,
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: title,
                    },
                ],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error('Metadata generation error:', error);
        return {
            title: 'EthioxHub Photo',
            description: 'Check out this photo on EthioxHub',
        };
    }
}

export default function Page({ params }) {
    return <PhotoDetailClient id={params.id} />;
}
