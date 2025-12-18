import PhotoDetailClient from './PhotoDetailClient';
import connectDB from '@/lib/db';
import Photo from '@/models/Photo';

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
