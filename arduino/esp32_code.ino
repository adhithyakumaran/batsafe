#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// 🔧 USER CONFIGURATION - EDIT THIS BLOCK
// ==========================================
const char* ssid = "adhee";
const char* password = "12345678";

// REPLACE WITH YOUR PC's IP ADDRESS (Check using ipconfig or ifconfig)
String backendIP = "10.158.176.99"; 

// Device ID (Must match what you want in the app)
String deviceID = "device001"; 
// ==========================================


#define IR_PIN 15
#define ACS_PIN 13
#define R1 10000.0
#define R2 15000.0

WiFiServer server(80);
bool streamingEnabled = true; // Default to true for testing

String latitude = "13.0827";  // Default 0
String longitude = "80.2707"; // Default 0
float currentVoltage = 0.0;

unsigned long lastUpdate = 0;
const int updateInterval = 2000; // Send data every 2 seconds

// ---------------- CAMERA CONFIG ----------------
void startCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sccb_sda = 26;
  config.pin_sccb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12; // Lower = higher quality but bigger size
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
  }
}

// ---------------- SENSORS ----------------
float readCurrentVoltage() {
  int adc = analogRead(ACS_PIN);
  float v = adc * (3.3 / 4095.0);
  return v * ((R1 + R2) / R2);
}

void readGPS() {
  while (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    if (line.startsWith("$GPGGA")) {
      int p1 = line.indexOf(',') + 1;
      int p2 = line.indexOf(',', p1);
      int p3 = line.indexOf(',', p2 + 1);
      int p4 = line.indexOf(',', p3 + 1);
      int p5 = line.indexOf(',', p4 + 1);
      
      // Simple parsing (add more robust parsing if needed)
      String lat = line.substring(p2 + 1, p3);
      String lng = line.substring(p4 + 1, p5);
      
      if (lat.length() > 0 && lng.length() > 0) {
        latitude = lat;
        longitude = lng;
      }
    }
  }
}

// ---------------- SEND DATA TO BACKEND ----------------
void sendDataToBackend() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://" + backendIP + ":3000/api/device/update";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON Payload
    String jsonPayload = "{";
    jsonPayload += "\"deviceID\": \"" + deviceID + "\",";
    jsonPayload += "\"lat\": \"" + latitude + "\",";
    jsonPayload += "\"lng\": \"" + longitude + "\",";
    jsonPayload += "\"current\": " + String(currentVoltage) + ",";
    jsonPayload += "\"espIP\": \"" + WiFi.localIP().toString() + "\"";
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.print("Data Sent. Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error sending data: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

// ---------------- STREAM SERVER ----------------
void handleStream(WiFiClient client) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: multipart/x-mixed-replace; boundary=frame");
  client.println();

  while (client.connected()) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      delay(100);
      continue;
    }

    client.printf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", fb->len);
    client.write(fb->buf, fb->len);
    client.print("\r\n");

    esp_camera_fb_return(fb);
    // Adjust delay to control framerate
    delay(50); 
  }
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(9600); // GPS usually 9600, Debug 115200. Check your GPS module baud rate.
  
  pinMode(IR_PIN, INPUT);
  pinMode(ACS_PIN, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  startCamera();
  server.begin();
}

// ---------------- LOOP ----------------
void loop() {
  // 1. Read Sensors
  readGPS();
  currentVoltage = readCurrentVoltage();
  
  // 2. Send Data Update Periodically
  if (millis() - lastUpdate > updateInterval) {
    sendDataToBackend();
    lastUpdate = millis();
  }

  // 3. Handle Incoming Video Stream Requests
  WiFiClient client = server.available();
  if (client) {
    String request = client.readStringUntil('\r');
    client.flush();
    
    // Only handle /stream requests
    if (request.indexOf("/stream") >= 0) {
      handleStream(client);
    }
    client.stop();
  }
}
