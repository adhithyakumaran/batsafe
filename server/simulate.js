const axios = require('axios');

const API_URL = 'http://localhost:3000/api/device/update';
const DEVICE_ID = 'device001';

// Mock location (Chennai, roughly)
let lat = 13.0827;
let lng = 80.2707;
let voltage = 12.0;

const simulate = async () => {
    try {
        // Random walk
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;
        voltage += (Math.random() - 0.5) * 0.1;

        const payload = {
            deviceID: DEVICE_ID,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            current: parseFloat(voltage.toFixed(2)),
            espIP: '192.168.1.100' // Mock IP
        };

        console.log(`📡 Sending Update: V=${payload.current}V | Loc=${payload.lat},${payload.lng}`);

        await axios.post(API_URL, payload);

    } catch (error) {
        console.error('Error sending update:', error.message);
    }
};

console.log("🚀 Starting ESP32 Simulation...");
setInterval(simulate, 2000);
