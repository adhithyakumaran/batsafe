import React, { useState, useEffect } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const StreamFeed = ({ streamUrl, isOnline }) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Reset error when URL changes
    useEffect(() => {
        setError(false);
        setLoading(true);
    }, [streamUrl]);

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setError(true);
        setLoading(false);
    };

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <div className={clsx("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-red-500" : "bg-gray-500")}></div>
                <span className="text-xs font-medium text-white tracking-wider">LIVE FEED</span>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-neutral-900 flex items-center justify-center min-h-[400px]">
                {isOnline && !error ? (
                    <img
                        src={streamUrl}
                        alt="Live Stream"
                        className="w-full h-full object-cover"
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <CameraOff size={48} strokeWidth={1.5} />
                        <p className="text-sm font-light">Stream Unavailable / Offline</p>
                    </div>
                )}

                {/* Loading State overlay */}
                {loading && isOnline && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 z-20">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Camera size={16} />
                    <span>Main Camera (ESP32-CAM)</span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                    {isOnline ? "CONNECTED" : "DISCONNECTED"}
                </div>
            </div>
        </div>
    );
};

export default StreamFeed;
