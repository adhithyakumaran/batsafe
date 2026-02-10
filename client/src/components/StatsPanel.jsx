import React, { useMemo } from 'react';
import { MapPin, Zap, Bolt, Navigation } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StatCard = ({ title, value, unit, icon: Icon, trend }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-gray-50 rounded-lg">
                <Icon size={20} className="text-gray-900" strokeWidth={2} />
            </div>
            {trend && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div className="mt-2">
            <h3 className="text-sm text-gray-500 font-medium tracking-wide uppercase">{title}</h3>
            <div className="flex items-baseline mt-1 space-x-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{value}</span>
                <span className="text-sm text-gray-400 font-medium">{unit}</span>
            </div>
        </div>
    </div>
);

const StatsPanel = ({ data, voltageHistory }) => {
    const { lat, lng, current, lastSeen } = data;

    // Safe defaults
    const latitude = parseFloat(lat) || 0;
    const longitude = parseFloat(lng) || 0;
    const voltage = parseFloat(current) || 0;

    const chartData = useMemo(() => {
        return voltageHistory.map((val, idx) => ({ time: idx, val }));
    }, [voltageHistory]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    title="Voltage"
                    value={voltage.toFixed(2)}
                    unit="V"
                    icon={Zap}
                />
                <StatCard
                    title="Current"
                    value={(voltage / 10).toFixed(2)} // Mock formula for current
                    unit="A"
                    icon={Bolt}
                />
            </div>

            {/* Chart */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex-1 min-h-[200px] flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Zap size={16} />
                    <span>Power Consumption</span>
                </h3>
                <div className="flex-1 w-full min-h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#000', fontWeight: 'bold' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke="#000000"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorVal)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Map */}
            <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm h-[300px] overflow-hidden relative group">
                <MapContainer center={[latitude, longitude]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <Marker position={[latitude, longitude]}>
                        <Popup>
                            Device Location <br /> {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </Popup>
                    </Marker>
                </MapContainer>

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg z-[400] text-xs font-mono border border-gray-200">
                    <div className="flex items-center space-x-2">
                        <Navigation size={12} className="text-blue-500" />
                        <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                    </div>
                    <div className="text-gray-400 mt-1">Updated: {lastSeen ? new Date(lastSeen).toLocaleTimeString() : 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;
