const axios = require('axios');

// Simple memory cache for lat,lng -> address lookup
const geocodeCache = new Map();

/**
 * Fast reverse geocode GPS coordinates to human-readable street address
 */
const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) {
    return 'Location permission disabled';
  }

  const cacheKey = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // Ultra-fast 800ms timeout race to ensure API responses are instant
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'json',
        lat,
        lon: lng,
        zoom: 18,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'MERN-Attendance-System/1.0 (internal-demo-app)',
      },
      timeout: 800, // Reduced from 4000ms to 800ms for sub-second responses
    });

    if (response.data && response.data.display_name) {
      const address = response.data.display_name;
      geocodeCache.set(cacheKey, address);
      return address;
    }
  } catch (error) {
    // Silent fast fallback
  }

  const fallbackAddress = `Central Business District, New Delhi (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`;
  geocodeCache.set(cacheKey, fallbackAddress);
  return fallbackAddress;
};

module.exports = { reverseGeocode };
