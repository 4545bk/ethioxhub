import connectDB from '@/lib/db';
import Video from '@/models/Video';

export default async function sitemap() {
    const baseUrl = 'https://ethioxhub.vercel.app';

    // Get all approved videos
    let videos = [];
    try {
        await connectDB();
        videos = await Video.find({ status: 'approved' }).select('_id updatedAt').sort({ updatedAt: -1 }).limit(5000).lean();
    } catch (error) {
        console.error('Sitemap Error:', error);
    }

    // Static routes
    const routes = [
        '',
        '/login',
        '/register',
        '/explore',
        '/pricing',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
    }));

    // Generic video pages from DB
    const videoRoutes = videos.map((video) => ({
        url: `${baseUrl}/videos/${video._id}`,
        lastModified: video.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    return [...routes, ...videoRoutes];
}
