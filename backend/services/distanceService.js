// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate estimated travel time based on distance
function calculateTravelTime(distanceKm) {
  const averageSpeed = 40; // km/h in city traffic
  const timeMinutes = (distanceKm / averageSpeed) * 60;
  const totalMinutes = timeMinutes + 5; // Add dispatch and loading time
  
  const roundedMinutes = Math.round(totalMinutes);
  
  return {
    minutes: roundedMinutes,
    formatted: formatDuration(roundedMinutes)
  };
}

function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hr ${mins} min`;
  }
}

// Rank hospitals by distance and availability
function rankHospitals(hospitals, ambulanceLocation) {
  return hospitals
    .map(hospital => {
      const distance = calculateDistance(
        ambulanceLocation.lat,
        ambulanceLocation.lng,
        hospital.location.lat,
        hospital.location.lng
      );
      
      const travelTime = calculateTravelTime(distance);
      
      return {
        ...hospital.toObject(),
        distance: distance,
        travelTime: travelTime
      };
    })
    .sort((a, b) => {
      // Sort primarily by distance
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // If distances are equal, prefer hospitals with more available beds
      return b.availableBeds - a.availableBeds;
    });
}

module.exports = { calculateDistance, rankHospitals, calculateTravelTime };
