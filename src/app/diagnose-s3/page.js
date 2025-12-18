'use client';

import { useState, useEffect } from 'react';

export default function DiagnoseS3Videos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchS3Videos();
    }, []);

    const fetchS3Videos = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/videos?provider=s3&limit=10', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const data = await res.json();
                setVideos(data.videos || []);
            } else {
                setError('Failed to fetch videos');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Loading S3 Videos...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">S3 Videos Diagnosis</h1>

                {error && (
                    <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
                        <p className="text-red-400">Error: {error}</p>
                    </div>
                )}

                {videos.length === 0 ? (
                    <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6">
                        <p className="text-yellow-400">No S3 videos found in database.</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Make sure you have videos with provider: "s3"
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
                            <p className="text-blue-400">Found {videos.length} S3 videos</p>
                        </div>

                        {videos.map((video, index) => {
                            const hasVideoUrl = !!video.videoUrl;
                            const hasS3Key = !!video.s3Key;
                            const hasS3Bucket = !!video.s3Bucket;
                            const hasDuration = !!video.duration && video.duration > 0;

                            const canShowPreview = (hasVideoUrl || (hasS3Key && hasS3Bucket));
                            const canShowDuration = hasDuration;

                            return (
                                <div key={video._id} className={`border rounded-lg p-6 ${canShowPreview && canShowDuration ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'
                                    }`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                                            <p className="text-sm text-gray-400">
                                                ID: {video._id}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded text-sm font-semibold ${canShowPreview && canShowDuration
                                                ? 'bg-green-600 text-white'
                                                : 'bg-red-600 text-white'
                                            }`}>
                                            {canShowPreview && canShowDuration ? '✅ WILL WORK' : '❌ WON\'T WORK'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className={`p-3 rounded ${hasVideoUrl ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                                            <div className="text-xs text-gray-400 mb-1">videoUrl</div>
                                            <div className={`text-sm font-medium ${hasVideoUrl ? 'text-green-400' : 'text-red-400'}`}>
                                                {hasVideoUrl ? '✅ Present' : '❌ Missing'}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded ${hasS3Key ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                                            <div className="text-xs text-gray-400 mb-1">s3Key</div>
                                            <div className={`text-sm font-medium ${hasS3Key ? 'text-green-400' : 'text-red-400'}`}>
                                                {hasS3Key ? '✅ Present' : '❌ Missing'}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded ${hasS3Bucket ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                                            <div className="text-xs text-gray-400 mb-1">s3Bucket</div>
                                            <div className={`text-sm font-medium ${hasS3Bucket ? 'text-green-400' : 'text-red-400'}`}>
                                                {hasS3Bucket ? '✅ Present' : '❌ Missing'}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded ${hasDuration ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                                            <div className="text-xs text-gray-400 mb-1">duration</div>
                                            <div className={`text-sm font-medium ${hasDuration ? 'text-green-400' : 'text-red-400'}`}>
                                                {hasDuration ? `✅ ${video.duration}s` : '❌ Missing'}
                                            </div>
                                        </div>
                                    </div>

                                    {!canShowPreview && (
                                        <div className="bg-red-900/30 border border-red-600 rounded p-3 mb-3">
                                            <p className="text-sm text-red-400">
                                                <strong>Preview won't work:</strong> Missing videoUrl or (s3Key + s3Bucket)
                                            </p>
                                        </div>
                                    )}

                                    {!canShowDuration && (
                                        <div className="bg-red-900/30 border border-red-600 rounded p-3 mb-3">
                                            <p className="text-sm text-red-400">
                                                <strong>Duration badge won't show:</strong> Missing duration field
                                            </p>
                                        </div>
                                    )}

                                    <details className="mt-4">
                                        <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                                            View Full Data
                                        </summary>
                                        <pre className="mt-2 p-3 bg-gray-950 rounded text-xs overflow-auto">
                                            {JSON.stringify({
                                                _id: video._id,
                                                title: video.title,
                                                provider: video.provider,
                                                videoUrl: video.videoUrl || null,
                                                s3Key: video.s3Key || null,
                                                s3Bucket: video.s3Bucket || null,
                                                duration: video.duration || null,
                                                thumbnailUrl: video.thumbnailUrl || null
                                            }, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            );
                        })}

                        <div className="bg-gray-800 rounded-lg p-6 mt-8">
                            <h2 className="text-xl font-bold mb-4">How to Fix Missing Fields</h2>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <h3 className="font-semibold text-blue-400 mb-2">Option 1: Use MongoDB Compass/Shell</h3>
                                    <p className="text-gray-400 mb-2">Run this query to add videoUrl from s3Key:</p>
                                    <pre className="bg-gray-950 p-3 rounded overflow-auto">
                                        {`db.videos.updateMany(
  { 
    provider: "s3",
    s3Key: { $exists: true },
    videoUrl: { $exists: false }
  },
  [
    {
      $set: {
        videoUrl: {
          $concat: [
            "https://ethioxhub.s3.eu-north-1.amazonaws.com/",
            "$s3Key"
          ]
        }
      }
    }
  ]
)`}
                                    </pre>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-blue-400 mb-2">Option 2: Add Duration</h3>
                                    <p className="text-gray-400 mb-2">Set placeholder duration (120 seconds):</p>
                                    <pre className="bg-gray-950 p-3 rounded overflow-auto">
                                        {`db.videos.updateMany(
  { provider: "s3", duration: { $exists: false } },
  { $set: { duration: 120 } }
)`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
