import { useState, useEffect } from "react";
import { MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const GeoLocationPrompt = ({ onLocationUpdate, showRefresh = true }) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      try {
        const location = JSON.parse(stored);
        if (location.lat && location.lng) {
          onLocationUpdate(location);
          setStatus("success");
          return;
        }
      } catch (e) {
        localStorage.removeItem("userLocation");
      }
    }
    requestLocation();
  }, []);

  const requestLocation = () => {
    setStatus("loading");
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        localStorage.setItem("userLocation", JSON.stringify(location));
        onLocationUpdate(location);
        setStatus("success");
      },
      (err) => {
        let message = "Unable to get your location";
        if (err.code === 1) message = "Location access denied. Please enable location permissions.";
        if (err.code === 2) message = "Location unavailable. Please try again.";
        if (err.code === 3) message = "Location request timed out.";
        setError(message);
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
        <span className="text-blue-700 text-sm">Getting your location...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700 text-sm font-medium">Location Error</span>
        </div>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <button
          onClick={requestLocation}
          className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Try Again
        </button>
      </div>
    );
  }

  if (status === "success" && showRefresh) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-green-700 text-sm">Using your current location</span>
        </div>
        <button
          onClick={requestLocation}
          className="flex items-center text-green-700 hover:text-green-800 text-sm"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>
    );
  }

  return null;
};

export default GeoLocationPrompt;
