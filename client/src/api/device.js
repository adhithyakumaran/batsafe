import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

export const getDeviceData = async (deviceId) => {
    try {
        const response = await api.get(`/device/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching device data:', error);
        return null;
    }
};

export const getStreamUrl = (deviceId) => {
    return `${API_BASE_URL}/device/${deviceId}/stream`;
};

export default api;
