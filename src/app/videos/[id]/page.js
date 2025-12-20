import VideoPlayerClient from './VideoPlayerClient';
import connectDB from '@/lib/db';
import Video from '@/models/Video';

// Generate metadata for SEO (Telegram preview, etc.)
export async function generateMetadata({ params }) {
    try {
        await connectDB();
        const video = await Video.findById(params.id).select('title description thumbnailUrl').lean();

        if (!video) {
            return {
                title: 'Video Not Found - EthioxHub',
            };
        }

        return {
            title: video.title,
            description: video.description?.substring(0, 160) || 'Watch this video on EthioxHub',
            openGraph: {
                title: video.title,
                description: video.description?.substring(0, 160) || 'Watch this video on EthioxHub',
                type: 'video.other',
                images: [
                    {
                        url: video.thumbnailUrl || 'https://res.cloudinary.com/dnh0z694o/image/upload/v1/default-thumbnail.jpg', // Fallback image if needed
                        width: 1280,
                        height: 720,
                        alt: video.title,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: video.title,
                description: video.description?.substring(0, 160),
                images: [video.thumbnailUrl],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'EthioxHub Video',
        };
    }
}

// Video JSON-LD for "Great" SEO
export default async function VideoPage({ params }) {
    let video = null;
    try {
        await connectDB();
        video = await Video.findById(params.id).select('title description thumbnailUrl createdAt views duration videoUrl').lean();
    } catch (err) {
        console.error('JSON-LD Fetch Error:', err);
    }

    const jsonLd = video ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.description || 'Watch this video on EthioxHub',
        thumbnailUrl: [video.thumbnailUrl],
        uploadDate: video.createdAt,
        contentUrl: video.videoUrl, // Optional if protected, but good for SEO if public
        interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: { '@type': 'WatchAction' },
            userInteractionCount: video.views || 0,
        },
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <VideoPlayerClient />
        </>
    );
}
