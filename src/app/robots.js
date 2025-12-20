export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/account/'],
        },
        sitemap: 'https://ethioxhub.vercel.app/sitemap.xml',
    };
}
