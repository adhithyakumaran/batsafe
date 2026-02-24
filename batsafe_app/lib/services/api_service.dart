import 'dart:convert';
import 'package:http/http.dart' as http;

class DeviceData {
  final String deviceID;
  final String owner;
  final double lat;
  final double lng;
  final double voltage; 
  final double current; // Amps
  final double altitude;
  final double speedKmph;
  final bool gpsLocked;
  final int satellites;
  final double hdop;
  final String? espIP;
  final DateTime? lastSeen;
  final bool isSecure;

  DeviceData({
    required this.deviceID,
    required this.owner,
    required this.lat,
    required this.lng,
    required this.voltage,
    required this.current,
    this.altitude = 0.0,
    this.speedKmph = 0.0,
    this.gpsLocked = false,
    this.satellites = 0,
    this.hdop = 0.0,
    this.espIP,
    this.lastSeen,
    this.isSecure = true, // Default to secure
  });

  factory DeviceData.fromJson(Map<String, dynamic> json) {
    return DeviceData(
      deviceID: json['deviceID'] ?? '',
      owner: json['owner'] ?? 'Unknown',
      lat: double.tryParse(json['lat']?.toString() ?? '0') ?? 0.0,
      lng: double.tryParse(json['lng']?.toString() ?? '0') ?? 0.0,
      voltage: double.tryParse(json['voltage']?.toString() ?? '0') ?? 0.0,
      current: double.tryParse(json['current']?.toString() ?? '0') ?? 0.0,
      altitude: double.tryParse(json['altitude']?.toString() ?? '0') ?? 0.0,
      speedKmph: double.tryParse(json['speed_kmph']?.toString() ?? '0') ?? 0.0,
      gpsLocked: json['gpsLocked'] == true || json['gpsLocked'] == 'true',
      satellites: int.tryParse(json['satellites']?.toString() ?? '0') ?? 0,
      hdop: double.tryParse(json['hdop']?.toString() ?? '0') ?? 0.0,
      espIP: json['espIP'],
      lastSeen: json['lastSeen'] != null ? DateTime.tryParse(json['lastSeen']) : null,
      isSecure: json['is_secure'] == true || json['is_secure'] == 'true',
    );
  }
}

class ApiService {
  // Configured to point to the live render backend as requested
  static const String baseUrl = 'https://batsafe.onrender.com/api';

  static String getStreamUrl(String deviceId) {
    return '$baseUrl/device/$deviceId/stream';
  }

  static Future<DeviceData?> fetchDeviceData(String deviceId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/device/$deviceId'));

      if (response.statusCode == 200) {
        return DeviceData.fromJson(json.decode(response.body));
      } else {
        print('Failed to load device data: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Error fetching device data: $e');
      return null;
    }
  }
}
