/**
 * Calculate Haversine distance in meters between two lat/lng coordinates
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
};

/**
 * Validate if punch coordinates are within allowed office geofence radius
 */
const checkGeofenceCompliance = (userLat, userLng, officeLat = 28.57126, officeLng = 77.21991, radiusMeters = 200) => {
  if (userLat === undefined || userLng === undefined || userLat === null || userLng === null || isNaN(Number(userLat)) || isNaN(Number(userLng))) {
    return { isWithinFence: false, distanceMeters: Infinity, message: 'Valid GPS location coordinates (lat/lng) are required.' };
  }

  const distance = calculateHaversineDistance(
    Number(userLat),
    Number(userLng),
    Number(officeLat),
    Number(officeLng)
  );

  return {
    isWithinFence: distance <= radiusMeters,
    distanceMeters: distance,
    message: distance <= radiusMeters ? 'Location within office geofence boundary' : `Location is ${distance}m away from office (allowed radius: ${radiusMeters}m)`,
  };
};

module.exports = {
  calculateHaversineDistance,
  checkGeofenceCompliance,
};
