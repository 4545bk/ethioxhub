import React from 'react';
import { MoreHorizontal, PlayCircle } from 'lucide-react';

const ContentPerformance = ({ videos }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Content Performance</h3>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {videos && videos.length > 0 ? (
                <>
                    {/* Recent */}
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Videos</p>
                        <div className="space-y-4">
                            {videos.slice(0, 5).map((video, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${idx === 0 ? 'bg-orange-100' : 'bg-blue-50'} rounded-full flex items-center justify-center`}>
                                        <PlayCircle className={`w-5 h-5 ${idx === 0 ? 'text-orange-500' : 'text-blue-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate" title={video._id}>
                                            {video._id.replace('/watch/', '')}
                                        </p>
                                        <p className="text-xs text-gray-500">{video.uniqueViewers} unique viewers</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">{video.views}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <PlayCircle className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm">No video analytics yet</p>
                </div>
            )}

            {/* Footer Info */}
            <button className="w-full text-center text-blue-600 text-sm font-medium mt-4 hover:underline">
                VIEW FULL REPORT
            </button>
        </div>
    );
};

export default ContentPerformance;
