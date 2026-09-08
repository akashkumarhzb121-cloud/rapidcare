const axios = require('axios');

// Geocode using multiple services for better accuracy
async function geocodeLocation(locationText) {
  try {
    console.log('Geocoding location:', locationText);
    
    // Try Google Maps Geocoding if API key available
    if (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here') {
      const googleResult = await googleGeocode(locationText);
      if (googleResult) return googleResult;
    }
    
    // Fallback to OpenStreetMap
    const osmResult = await osmGeocode(locationText);
    if (osmResult) return osmResult;
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

async function googleGeocode(locationText) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: locationText,
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        displayName: result.formatted_address,
        address: result.address_components
      };
    }
    return null;
  } catch (error) {
    console.error('Google geocoding error:', error.message);
    return null;
  }
}

async function osmGeocode(locationText) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationText,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'RapidCare/1.0'
      },
      timeout: 5000
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.address || {}
      };
    }
    return null;
  } catch (error) {
    console.error('OSM geocoding error:', error.message);
    return null;
  }
}

// Reverse geocoding (lat/lng to address)
async function reverseGeocode(lat, lng) {
  try {
    console.log('Reverse geocoding:', lat, lng);
    
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'RapidCare/1.0'
      },
      timeout: 5000
    });
    
    if (response.data) {
      return {
        displayName: response.data.display_name,
        address: response.data.address || {}
      };
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
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

// Get real-time traffic ETA using Google Maps
async function getRealTimeETA(origin, destination) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
      return null;
    }
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });
    
    if (response.data.rows?.[0]?.elements?.[0]) {
      const element = response.data.rows[0].elements[0];
      return {
        distance: element.distance?.text,
        distanceValue: element.distance?.value, // meters
        duration: element.duration_in_traffic?.text || element.duration?.text,
        durationValue: element.duration_in_traffic?.value || element.duration?.value // seconds
      };
    }
    return null;
  } catch (error) {
    console.error('ETA calculation error:', error.message);
    return null;
  }
}

module.exports = { 
  geocodeLocation, 
  reverseGeocode, 
  calculateTravelTime, 
  getRealTimeETA 
};
