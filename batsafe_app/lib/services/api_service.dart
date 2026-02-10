import 'dart:convert';
import 'package:http/http.dart' as http;

class DeviceData {
  final String deviceID;
  final String owner;
  final double lat;
  final double lng;
  final double current;
  final String? espIP;
  final DateTime? lastSeen;

  DeviceData({
    required this.deviceID,
    required this.owner,
    required this.lat,
    required this.lng,
    required this.current,
    this.espIP,
    this.lastSeen,
  });

  factory DeviceData.fromJson(Map<String, dynamic> json) {
    return DeviceData(
      deviceID: json['deviceID'] ?? '',
      owner: json['owner'] ?? 'Unknown',
      lat: double.tryParse(json['lat']?.toString() ?? '0') ?? 0.0,
      lng: double.tryParse(json['lng']?.toString() ?? '0') ?? 0.0,
      current: (json['current'] is num) ? (json['current'] as num).toDouble() : 0.0,
      espIP: json['espIP'],
      lastSeen: json['lastSeen'] != null ? DateTime.tryParse(json['lastSeen']) : null,
    );
  }
}

class ApiService {
  // Use 10.0.2.2 for Android Emulator to access localhost
  // Use localhost for Windows/iOS Simulator
  // Or use your machine's LAN IP for physical device
  static const String baseUrl = 'http://10.158.176.99:3000/api'; 
  
  // For Windows development, uncomment this:
  // static const String baseUrl = 'http://localhost:3000/api';

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
