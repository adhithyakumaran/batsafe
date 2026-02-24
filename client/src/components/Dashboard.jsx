import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, User, Bell, Menu, Search, Battery, Wifi } from 'lucide-react';
import StreamFeed from './StreamFeed';
import StatsPanel from './StatsPanel';
import { getDeviceData, getStreamUrl } from '../api/device';

const DEVICE_ID = 'device001'; // Hardcoded for demo

const Dashboard = () => {
    const [data, setData] = useState({
        lat: "0", lng: "0", current: 0, lastSeen: null, deviceID: DEVICE_ID
    });
    const [voltageHistory, setVoltageHistory] = useState([]);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const result = await getDeviceData(DEVICE_ID);
            if (result) {
                setData(result);

                // Update Voltage History
                setVoltageHistory(prev => {
                    const newHist = [...prev, result.current || 0];
                    if (newHist.length > 20) newHist.shift();
                    return newHist;
                });

                // Check online status (seen in last 10 seconds)
                const lastSeenTime = new Date(result.lastSeen).getTime();
                const now = Date.now();
                setIsOnline((now - lastSeenTime) < 10000);
            }
        };

        fetchData(); // Initial load
        const interval = setInterval(fetchData, 2000); // Poll every 2s

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans overflow-hidden">

            {/* Sidebar - Professional Minimalist */}
            <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-8 z-20 shadow-sm">
                <div className="mb-10 w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">B</span>
                </div>

                <nav className="flex-1 space-y-8">
                    <NavItem icon={LayoutDashboard} active />
                    <NavItem icon={Bell} />
                    <NavItem icon={Settings} />
                </nav>

                <div className="mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm hover:border-black transition-colors cursor-pointer">
                        {/* User Avatar Placeholder */}
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=Admin`} alt="User" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-white/80 backdrop-blur border-b border-gray-200 px-8 flex items-center justify-between z-10 sticky top-0">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">BatSafe <span className="text-gray-400 font-light">Monitor</span></h1>
                        <p className="text-xs text-gray-500">System Status: <span className="text-green-600 font-medium">Active</span></p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-500 space-x-2 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all">
                            <Search size={14} />
                            <input type="text" placeholder="Search devices..." className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 w-48 text-sm" />
                        </div>

                        <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium">Admin User</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Security Lvl 1</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Security Banner */}
                {data.is_secure === false ? (
                    <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-center space-x-3 shadow-md animate-pulse z-20">
                        <AlertCircle size={20} className="text-white" />
                        <span className="font-bold tracking-wider uppercase text-sm">SECURITY ALERT: Device Tampering Detected!</span>
                        <AlertCircle size={20} className="text-white" />
                    </div>
                ) : (
                    <div className="bg-green-500/10 text-green-700 px-8 py-2 flex items-center justify-center space-x-2 border-b border-green-500/20 z-20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-medium text-xs tracking-wide uppercase">System Secure</span>
                    </div>
                )}

                {/* Dashboard Grid */}
                <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[600px]">

                        {/* Left Column: Live Feed (Takes up 2/3 space) */}
                        <div className="lg:col-span-2 flex flex-col space-y-6">
                            <div className="flex-1 min-h-[400px]">
                                <StreamFeed
                                    streamUrl={getStreamUrl(DEVICE_ID)}
                                    isOnline={isOnline}
                                />
                            </div>

                            {/* Quick Actions / Logs Placeholder */}
                            <div className="h-48 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800">System Logs</h3>
                                    <button className="text-xs font-medium text-blue-600 hover:text-blue-800">View All</button>
                                </div>
                                <div className="space-y-3">
                                    <LogItem time="Now" message="Stream connection active" type="info" />
                                    {data.is_secure === false && (
                                        <LogItem time="Just Now" message="CRITICAL: Unauthorized movement detected" type="warning" />
                                    )}
                                    <LogItem time="2m ago" message={`Voltage reading: ${data.voltage || "12.0"}V`} type="info" />
                                    <LogItem time="15m ago" message="GPS position updated" type="info" />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Stats (Takes up 1/3 space) */}
                        <div className="lg:col-span-1 h-full min-h-[600px]">
                            <StatsPanel data={data} voltageHistory={voltageHistory} />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

// Sub-components for cleaner file
const NavItem = ({ icon: Icon, active }) => (
    <button className={`p-3 rounded-xl transition-all duration-200 group ${active ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    </button>
);

const LogItem = ({ time, message, type }) => {
    const color = type === 'warning' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600';
    return (
        <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-400 font-mono text-xs w-16 text-right">{time}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${type === 'warning' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className={`flex-1 ${type === 'warning' ? 'text-red-700 font-medium' : 'text-gray-700'}`}>{message}</span>
        </div>
    )
}

export default Dashboard;
