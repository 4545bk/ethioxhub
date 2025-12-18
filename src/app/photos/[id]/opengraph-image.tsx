import { ImageResponse } from 'next/og';
import connectDB from '@/lib/db';
import Photo from '@/models/Photo';

export const runtime = 'edge';
export const alt = 'Photo';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
    try {
        await connectDB();
        const photo = await Photo.findById(params.id);

        if (!photo) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            fontSize: 40,
                            background: '#1f2937',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        Photo not found
                    </div>
                ),
                { ...size }
            );
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                    }}
                >
                    {/* Photo Preview */}
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '400px',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            marginBottom: '30px',
                        }}
                    >
                        <img
                            src={photo.url}
                            alt={photo.title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: photo.isPaid ? 'blur(10px)' : 'none',
                            }}
                        />
                    </div>

                    {/* Title and Info */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: 48,
                                fontWeight: 'bold',
                                color: 'white',
                                marginBottom: '10px',
                                textAlign: 'center',
                            }}
                        >
                            {photo.title}
                        </h1>

                        <div style={{ display: 'flex', gap: '30px', fontSize: 24, color: '#9ca3af' }}>
                            {photo.isPaid && (
                                <div style={{ display: 'flex', alignItems: 'center', color: '#fbbf24' }}>
                                    🔒 Premium - {(photo.price / 100).toFixed(2)} ETB
                                </div>
                            )}
                            {photo.album && photo.album.length > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    📸 {photo.album.length} photos
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Branding */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '30px',
                            right: '40px',
                            fontSize: 24,
                            color: '#6b7280',
                            fontWeight: 'bold',
                        }}
                    >
                        EthioxHub
                    </div>
                </div>
            ),
            { ...size }
        );
    } catch (error) {
        console.error('OG Image generation error:', error);
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 40,
                        background: '#1f2937',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    EthioxHub Photos
                </div>
            ),
            { ...size }
        );
    }
}
