import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';

const LocationPermission = ({ onLocationGranted, onLocationDenied }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('requesting');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setPermissionStatus('denied');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setPermissionStatus('granted');
        setLoading(false);
        onLocationGranted({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Location error:', error);
        setError(getLocationErrorMessage(error.code));
        setPermissionStatus('denied');
        setLoading(false);
        onLocationDenied();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const getLocationErrorMessage = (code) => {
    switch (code) {
      case 1:
        return 'Location access denied. Please enable location permissions to find nearby print shops.';
      case 2:
        return 'Location unavailable. Please check your internet connection and try again.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'Unable to get your location. Please try again or enter manually.';
    }
  };

  const handleManualLocation = () => {

    const defaultLocation = { lat: 28.6139, lng: 77.2090 };
    setLocation(defaultLocation);
    setPermissionStatus('granted');
    onLocationGranted(defaultLocation);
  };

  const handleRetry = () => {
    setError(null);
    setPermissionStatus('requesting');
    getCurrentLocation();
  };

  useEffect(() => {

    getCurrentLocation();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Location Access Required
          </h2>
          <p className="text-gray-600 text-sm">
            We need your location to show you nearby print shops and provide the best service.
          </p>
        </div>

        {permissionStatus === 'requesting' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Getting your location...</p>
          </div>
        )}

        {permissionStatus === 'granted' && (
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Location Access Granted!
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              We'll show you the nearest print shops based on your location.
            </p>
            {location && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                <Navigation className="h-4 w-4 inline mr-1" />
                Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
              </div>
            )}
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Location Access Denied
              </h3>
              {error && (
                <p className="text-red-600 text-sm mb-4">{error}</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>

              <button
                onClick={handleManualLocation}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Use Default Location (Hyderabad)
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-xs">
                <strong>Note:</strong> Without location access, you'll see demo shops and may not get the most relevant results.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Accessing your location...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPermission;
