import VideoPlayerClient from './VideoPlayerClient';
import connectDB from '../../../lib/db';
import Video from '../../../models/Video';

export async function generateMetadata({ params }) {
    try {
        await connectDB();

        const video = await Video.findById(params.id)
            .select('title description thumbnailUrl category isPaid price views')
            .populate('category', 'name');

        if (!video) {
            return {
                title: 'Video Not Found - EthioxHub',
                description: 'The requested video could not be found.',
            };
        }

        const title = video.title || 'EthioxHub Video';
        const description = video.description || 'Watch this exclusive video on EthioxHub';

        // Use video thumbnail
        let imageUrl = video.thumbnailUrl;

        // Fallback to a default image if no thumbnail
        if (!imageUrl) {
            imageUrl = 'https://placehold.co/1200x630/111827/FFD700/png?text=EthioxHub+Video&font=roboto';
        }

        return {
            title: `${title} - EthioxHub`,
            description,
            openGraph: {
                title: title,
                description,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
                type: 'video.other',
                siteName: 'EthioxHub',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error('Video metadata error:', error);
        return {
            title: 'EthioxHub - Exclusive Videos',
            description: 'Watch exclusive content on EthioxHub',
            openGraph: {
                images: ['https://placehold.co/1200x630/111827/FFD700/png?text=EthioxHub&font=roboto']
            }
        };
    }
}

export default function Page({ params }) {
    return <VideoPlayerClient id={params.id} />;
}
