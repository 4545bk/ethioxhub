/**
 * S3 CORS Test Page
 * Open this file in browser: http://localhost:3000/test-s3-cors
 */

'use client';

import { useState } from 'react';

export default function TestS3CORS() {
    const [testUrl, setTestUrl] = useState('https://ethioxhub.s3.eu-north-1.amazonaws.com/');
    const [result, setResult] = useState('');
    const [videoTest, setVideoTest] = useState('');

    const testCORS = async () => {
        setResult('Testing...');

        try {
            // Test 1: Fetch with CORS
            const response = await fetch(testUrl, {
                method: 'HEAD',
                mode: 'cors'
            });

            const headers = {
                status: response.status,
                statusText: response.statusText,
                cors: response.headers.get('access-control-allow-origin'),
                contentType: response.headers.get('content-type')
            };

            setResult(JSON.stringify(headers, null, 2));
        } catch (error) {
            setResult(`❌ Error: ${error.message}`);
        }
    };

    const testVideo = () => {
        setVideoTest('Testing video element...');

        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = testUrl;

        video.onloadedmetadata = () => {
            setVideoTest(`✅ Video loaded! Duration: ${video.duration}s`);
        };

        video.onerror = (e) => {
            setVideoTest(`❌ Video error: ${e.target.error?.message || 'Unknown error'}`);
        };
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">S3 CORS Test</h1>

                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <label className="block text-sm font-medium mb-2">
                        S3 Video URL:
                    </label>
                    <input
                        type="text"
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 text-white"
                        placeholder="https://ethioxhub.s3.eu-north-1.amazonaws.com/your-video.mp4"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        Paste the full URL to your S3 video file
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={testCORS}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
                    >
                        Test CORS (Fetch)
                    </button>

                    <button
                        onClick={testVideo}
                        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold"
                    >
                        Test Video Element
                    </button>
                </div>

                {result && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold mb-2">Fetch Test Result:</h3>
                        <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                            {result}
                        </pre>
                    </div>
                )}

                {videoTest && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold mb-2">Video Element Test:</h3>
                        <p className="text-sm">{videoTest}</p>
                    </div>
                )}

                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6">
                    <h3 className="font-semibold mb-2">Instructions:</h3>
                    <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>Go to AWS S3 Console</li>
                        <li>Open your 'ethioxhub' bucket</li>
                        <li>Click on one of your video files</li>
                        <li>Copy the "Object URL" (should be like: https://ethioxhub.s3.eu-north-1.amazonaws.com/...)</li>
                        <li>Paste it in the input box above</li>
                        <li>Click both test buttons</li>
                        <li>Check the results below</li>
                    </ol>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 mt-6">
                    <h3 className="font-semibold mb-2">Expected Results:</h3>
                    <div className="text-sm space-y-2">
                        <p className="text-green-400">✅ Fetch Test: Should show status 200 with CORS headers</p>
                        <p className="text-green-400">✅ Video Test: Should show "Video loaded!" with duration</p>
                        <p className="text-red-400">❌ If you see CORS errors, your S3 CORS config needs fixing</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
