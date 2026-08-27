// api.js or geocodeService.js

// ✅ No API key in frontend! Backend se fetch karega
const locationCache = new Map();

/**
 * Fetch location name from coordinates using backend API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {boolean} detailed - Whether to return detailed location data
 * @returns {Promise<Object>} Location data with success status and locationName
 */
export const getLocationName = async (latitude, longitude, detailed = false) => {
  try {
    // Validate inputs
    if (!latitude || !longitude) {
      return {
        success: false,
        locationName: `${latitude || '?'}, ${longitude || '?'}`,
        error: 'Invalid coordinates'
      };
    }

    const response = await api.get('/geocode/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        detailed: detailed
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Error getting location:', error);
    
    // Return coordinates as fallback
    return {
      success: false,
      locationName: `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`,
      error: error.message || 'Failed to fetch location'
    };
  }
};

/**
 * Get cached location or fetch if not available
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {boolean} detailed - Whether to return detailed location data
 * @returns {Promise<Object>} Location data
 */
export const getCachedLocationName = async (latitude, longitude, detailed = false) => {
  if (!latitude || !longitude) return null;
  
  const cacheKey = `${latitude},${longitude}`;
  
  // Check if we have cached data
  if (locationCache.has(cacheKey)) {
    const cached = locationCache.get(cacheKey);
    // If we already have the location name, return it
    if (cached.locationName) {
      return cached;
    }
  }
  
  // Fetch from API
  const result = await getLocationName(latitude, longitude, detailed);
  
  // Cache the result
  if (result.success) {
    locationCache.set(cacheKey, result);
  }
  
  return result;
};

/**
 * Get the most specific location name (building/street level)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} Specific location name
 */
export const getSpecificLocationName = async (latitude, longitude) => {
  const result = await getCachedLocationName(latitude, longitude, true);
  return result.locationName || `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
};

/**
 * Get locations for multiple coordinates (batch processing)
 * @param {Array<{lat: number, lon: number}>} coordinates - Array of coordinates
 * @returns {Promise<Array>} Array of location data
 */
export const getBatchLocationNames = async (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return [];
  }

  try {
    const response = await api.post('/geocode/batch', {
      coordinates: coordinates.map(coord => ({
        lat: coord.lat || coord.latitude,
        lon: coord.lon || coord.longitude
      }))
    }, {
      timeout: 30000 // 30 second timeout for batch
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error getting batch locations:', error);
    
    // Return coordinates as fallback
    return coordinates.map(coord => ({
      ...coord,
      locationName: `${parseFloat(coord.lat || coord.latitude).toFixed(6)}, ${parseFloat(coord.lon || coord.longitude).toFixed(6)}`
    }));
  }
};

/**
 * Search for location by query
 * @param {string} query - Location search query
 * @returns {Promise<Array>} Search results
 */
export const searchLocation = async (query) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await api.get('/geocode/search', {
      params: {
        query: query.trim()
      },
      timeout: 10000
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
};

/**
 * Clear the location cache
 * @param {string} cacheKey - Optional specific cache key to clear
 */
export const clearLocationCache = (cacheKey = null) => {
  if (cacheKey) {
    locationCache.delete(cacheKey);
  } else {
    locationCache.clear();
  }
};

/**
 * Get location cache stats
 * @returns {Object} Cache statistics
 */
export const getLocationCacheStats = () => {
  return {
    size: locationCache.size,
    keys: Array.from(locationCache.keys())
  };
};

/**
 * Prefetch locations for a list of requests
 * @param {Array} requests - Array of requests with latitude and longitude
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Updated requests with location names
 */
export const prefetchLocationNames = async (requests, onProgress = null) => {
  if (!requests || requests.length === 0) {
    return requests;
  }

  try {
    // Filter requests that have coordinates and not already cached
    const uncachedRequests = requests.filter(req => 
      req.latitude && 
      req.longitude && 
      !locationCache.has(`${req.latitude},${req.longitude}`)
    );

    if (uncachedRequests.length === 0) {
      // All locations are cached
      const cachedRequests = requests.map(req => {
        if (req.latitude && req.longitude) {
          const cached = locationCache.get(`${req.latitude},${req.longitude}`);
          if (cached) {
            return {
              ...req,
              locationName: cached.locationName,
              locationData: cached.data
            };
          }
        }
        return req;
      });
      return cachedRequests;
    }

    // Process in batches for better performance
    const batchSize = 10;
    const results = [...requests];
    let processed = 0;

    for (let i = 0; i < uncachedRequests.length; i += batchSize) {
      const batch = uncachedRequests.slice(i, i + batchSize);
      const coordinates = batch.map(req => ({
        lat: req.latitude,
        lon: req.longitude,
        id: req._id // Keep track of which request this belongs to
      }));

      const locationResults = await getBatchLocationNames(coordinates);

      // Update results with location names
      locationResults.forEach((locResult, index) => {
        const originalReq = batch[index];
        if (originalReq) {
          // Find the request in results and update it
          const resultIndex = results.findIndex(r => r._id === originalReq._id);
          if (resultIndex !== -1) {
            results[resultIndex] = {
              ...results[resultIndex],
              locationName: locResult.locationName || `${locResult.lat}, ${locResult.lon}`,
              locationData: locResult.data || null
            };
          }

          // Also cache the result
          const cacheKey = `${originalReq.latitude},${originalReq.longitude}`;
          if (!locationCache.has(cacheKey)) {
            locationCache.set(cacheKey, {
              locationName: locResult.locationName || `${locResult.lat}, ${locResult.lon}`,
              data: locResult.data || null
            });
          }
        }
      });

      processed += batch.length;
      
      // Progress callback
      if (onProgress) {
        onProgress(processed, uncachedRequests.length);
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < uncachedRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;

  } catch (error) {
    console.error('Error prefetching locations:', error);
    // Return original requests with coordinates as fallback
    return requests.map(req => {
      if (req.latitude && req.longitude) {
        return {
          ...req,
          locationName: `${parseFloat(req.latitude).toFixed(6)}, ${parseFloat(req.longitude).toFixed(6)}`
        };
      }
      return req;
    });
  }
};

// Export the cache for debugging
export { locationCache };