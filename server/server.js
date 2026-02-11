const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// DEBUG: Log every request
app.use((req, res, next) => {
    console.log(`➡️  INCOMING: ${req.method} ${req.url}`);
    next();
});

// ---------------- IN-MEMORY DB (No MongoDB required) ----------------
const devices = {}; // Store device data here: { "device001": { ... } }

// ---------------- DEVICE DATA UPDATE ----------------
// ESP32 calls this to update its status
app.post("/api/device/update", async (req, res) => {
    try {
        const { deviceID, lat, lng, voltage, current, is_secure, espIP } = req.body;

        if (!deviceID) {
            return res.status(400).json({ error: "deviceID is required" });
        }

        // Update in-memory store
        // Preserve existing data if not provided in new request
        const existing = devices[deviceID] || {};

        devices[deviceID] = {
            deviceID,
            owner: existing.owner || "Unknown",
            lat: lat || existing.lat,
            lng: lng || existing.lng,
            voltage: voltage !== undefined ? voltage : existing.voltage,
            current: current !== undefined ? current : existing.current,
            is_secure: is_secure !== undefined ? is_secure : existing.is_secure,
            espIP: espIP || existing.espIP,
            lastSeen: new Date()
        };

        console.log(`📡 Update from ${deviceID} | V: ${voltage} | A: ${current} | Secure: ${is_secure}`);
        res.json({ status: "updated" });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------------- FETCH DEVICE DATA ----------------
// Frontend calls this to get latest stats
app.get("/api/device/:id", async (req, res) => {
    try {
        const device = devices[req.params.id];

        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }

        res.json(device);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------------- VIDEO STREAM RELAY ----------------
// Frontend <img> src points here
app.get("/api/device/:id/stream", async (req, res) => {
    try {
        const device = devices[req.params.id];

        if (!device || !device.espIP) {
            return res.status(404).send("Device offline or IP unknown");
        }

        const streamUrl = `http://${device.espIP}/stream`;
        console.log(`🎥 Proxying stream from: ${streamUrl}`);

        const response = await axios({
            method: "get",
            url: streamUrl,
            responseType: "stream",
            timeout: 5000 // Cancel if no stream connect within 5s
        });

        // Forward the MJPEG headers
        res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame");

        // Pipe the stream directly to the client
        response.data.pipe(res);

        // Handle stream close to prevent leaks
        response.data.on('error', (err) => {
            console.error("Stream source error:", err.message);
            res.end();
        });

        res.on('close', () => {
            console.log("Stream client disconnected");
            response.data.destroy(); // Close axios stream
        });

    } catch (err) {
        console.error("Stream Proxy Error:", err.message);
        res.status(502).send("Stream unavailable: " + err.message);
    }
});

// ---------------- SERVER START ----------------
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`
🚀 Backend running on port ${PORT}
👉 Stream: http://localhost:${PORT}/api/device/:id/stream
👉 Data:   http://localhost:${PORT}/api/device/:id
  `);
});
