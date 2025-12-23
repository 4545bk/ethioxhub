import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import LinaProfileView from '@/components/LinaProfileView';

// Generate dynamic metadata for SEO and Telegram sharing
export async function generateMetadata({ params }) {
    try {
        await connectDB();
        const profile = await LinaProfile.findById(params.id);

        if (!profile) {
            return {
                title: 'Profile Not Found - Lina Girls',
                description: 'The requested profile could not be found.'
            };
        }

        // Use blurred image for sharing to maintain privacy/tease
        const blurImage = profile.photoUrl.replace('/upload/', '/upload/e_blur:1000/');

        // Construct description with salary/contact info
        const parts = [];
        if (profile.localSalary) parts.push('Local (5k-10k)');
        if (profile.intlSalary) parts.push('Intl (15k-20k)');
        const salaryInfo = parts.length > 0 ? `💼 ${parts.join(' • ')}` : '';

        const description = `${profile.age} years old from ${profile.city}. ${salaryInfo} 📞 09XXXXXXX... Check her profile on EthioxHub.`;

        return {
            title: `Meet ${profile.name} - Lina Girls`,
            description: description,
            openGraph: {
                title: `Meet ${profile.name} - Lina Girls`,
                description: description,
                images: [
                    {
                        url: blurImage,
                        width: 800,
                        height: 600,
                        alt: `Blurred photo of ${profile.name}`,
                    },
                ],
                type: 'profile',
            },
            twitter: {
                card: 'summary_large_image',
                title: `Meet ${profile.name} - Lina Girls`,
                description: description,
                images: [blurImage],
            },
        };
    } catch (error) {
        return {
            title: 'Lina Girls - EthioxHub',
            description: 'Discover Lina Girls on EthioxHub'
        };
    }
}

export default function Page({ params }) {
    return <LinaProfileView id={params.id} />;
}
