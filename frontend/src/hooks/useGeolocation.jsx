import { useState, useEffect, useCallback } from 'react';

const LOCATION_CACHE_KEY = 'quickprint_location';
const LOCATION_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached location from localStorage
 */
function getCachedLocation() {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (data.timestamp && (now - data.timestamp) < LOCATION_CACHE_EXPIRY_MS) {
      return {
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy,
        timestamp: data.timestamp,
        fromCache: true,
      };
    }

    // Cache expired, remove it
    localStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cached location:', error);
    return null;
  }
}

/**
 * Save location to localStorage cache
 */
function cacheLocation(lat, lng, accuracy) {
  try {
    const data = {
      lat,
      lng,
      accuracy,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching location:', error);
  }
}

/**
 * Enhanced geolocation hook with localStorage caching
 */
export function useGeolocation(options = {}) {
  const {
    enabled = true,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [location, setLocation] = useState(() => getCachedLocation());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt');

  // Check permission state
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionState(result.state);
        result.addEventListener('change', () => {
          setPermissionState(result.state);
        });
      });
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!enabled) return;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now(),
          fromCache: false,
        };

        setLocation(locationData);
        setLoading(false);
        setError(null);

        // Cache the location
        cacheLocation(latitude, longitude, accuracy);

        console.log('[Geolocation] Position obtained:', { lat: latitude, lng: longitude });
      },
      (err) => {
        console.error('[Geolocation] Error:', err.message);
        setError(err.message);
        setLoading(false);

        // Fall back to cached location if available
        const cached = getCachedLocation();
        if (cached && !location) {
          setLocation(cached);
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enabled, enableHighAccuracy, timeout, maximumAge, location]);

  // Initial fetch or use cached
  useEffect(() => {
    if (!enabled) return;

    const cached = getCachedLocation();
    if (cached) {
      setLocation(cached);
      console.log('[Geolocation] Using cached location:', cached);
    }

    // Always try to get fresh location
    requestLocation();
  }, [enabled]);

  // Watch position if enabled
  useEffect(() => {
    if (!enabled || !watch) return;

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now(),
          fromCache: false,
        };

        setLocation(locationData);
        cacheLocation(latitude, longitude, accuracy);
      },
      (err) => {
        console.error('[Geolocation] Watch error:', err.message);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 30000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, watch, enableHighAccuracy, timeout]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(LOCATION_CACHE_KEY);
    setLocation(null);
  }, []);

  const refresh = useCallback(() => {
    clearCache();
    requestLocation();
  }, [clearCache, requestLocation]);

  return {
    location,
    error,
    loading,
    permissionState,
    requestLocation,
    clearCache,
    refresh,
    isGranted: permissionState === 'granted',
    isDenied: permissionState === 'denied',
  };
}

export default useGeolocation;
