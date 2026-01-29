import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader, Check } from 'lucide-react';

/**
 * Google Places Autocomplete Component
 * 
 * Note: Requires VITE_GOOGLE_MAPS_API_KEY environment variable to be set.
 * The Google Maps JavaScript API and Places API must be enabled in Google Cloud Console.
 * 
 * If the API key is not set, falls back to manual address input with browser geolocation.
 */
const GooglePlacesAutocomplete = ({
  onPlaceSelect,
  placeholder = "Search for an address...",
  defaultValue = "",
  className = "",
}) => {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState(null);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      console.warn('[GooglePlacesAutocomplete] No API key found. Using fallback mode.');
      return;
    }

    if (window.google && window.google.maps) {
      initializeServices();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeServices);
      return;
    }

    // Load the Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeServices;
    script.onerror = () => {
      setError('Failed to load Google Maps. Using manual input.');
    };
    document.head.appendChild(script);
  }, [apiKey]);

  const initializeServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService (required by the API)
      const dummyDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
      
      setIsScriptLoaded(true);
      console.log('[GooglePlacesAutocomplete] Services initialized');
    }
  };

  const fetchSuggestions = async (input) => {
    if (!autocompleteService.current || !input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input,
      componentRestrictions: { country: 'in' }, // Restrict to India
      types: ['geocode', 'establishment'],
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);

      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || '',
        })));
      } else {
        setSuggestions([]);
      }
    });
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setSelectedPlace(null);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the API call
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setValue(suggestion.description);
    setSuggestions([]);

    if (!placesService.current) {
      // Fallback: just use the description
      const placeData = {
        address: suggestion.description,
        lat: null,
        lng: null,
        placeId: suggestion.placeId,
      };
      setSelectedPlace(placeData);
      onPlaceSelect?.(placeData);
      return;
    }

    // Get place details including lat/lng
    setIsLoading(true);
    placesService.current.getDetails(
      {
        placeId: suggestion.placeId,
        fields: ['geometry', 'formatted_address', 'address_components'],
      },
      (place, status) => {
        setIsLoading(false);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeData = {
            address: place.formatted_address || suggestion.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: suggestion.placeId,
            addressComponents: parseAddressComponents(place.address_components),
          };

          setSelectedPlace(placeData);
          onPlaceSelect?.(placeData);
          
          console.log('[GooglePlacesAutocomplete] Place selected:', placeData);
        }
      }
    );
  };

  const parseAddressComponents = (components) => {
    if (!components) return {};

    const parsed = {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
    };

    for (const component of components) {
      const types = component.types;

      if (types.includes('street_number') || types.includes('route') || types.includes('sublocality_level_1')) {
        parsed.street += (parsed.street ? ', ' : '') + component.long_name;
      }
      if (types.includes('locality')) {
        parsed.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        parsed.state = component.long_name;
      }
      if (types.includes('postal_code')) {
        parsed.pincode = component.long_name;
      }
      if (types.includes('country')) {
        parsed.country = component.long_name;
      }
    }

    return parsed;
  };

  const clearInput = () => {
    setValue('');
    setSuggestions([]);
    setSelectedPlace(null);
    onPlaceSelect?.(null);
    inputRef.current?.focus();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode if Google Maps is available
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            setIsLoading(false);
            
            if (status === 'OK' && results[0]) {
              const placeData = {
                address: results[0].formatted_address,
                lat: latitude,
                lng: longitude,
                placeId: results[0].place_id,
                addressComponents: parseAddressComponents(results[0].address_components),
              };
              
              setValue(placeData.address);
              setSelectedPlace(placeData);
              onPlaceSelect?.(placeData);
            } else {
              // Fallback: just use coordinates
              const placeData = {
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                lat: latitude,
                lng: longitude,
                placeId: null,
              };
              setValue(placeData.address);
              setSelectedPlace(placeData);
              onPlaceSelect?.(placeData);
            }
          });
        } else {
          setIsLoading(false);
          const placeData = {
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude,
            placeId: null,
          };
          setValue(placeData.address);
          setSelectedPlace(placeData);
          onPlaceSelect?.(placeData);
        }
      },
      (err) => {
        setIsLoading(false);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          ) : selectedPlace ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     text-gray-900 placeholder-gray-500 text-sm"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            title="Use current location"
            className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId || index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3 border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.mainText}
                </p>
                {suggestion.secondaryText && (
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected place info */}
      {selectedPlace && selectedPlace.lat && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            📍 Location: {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* API key warning */}
      {!apiKey && (
        <p className="mt-1 text-xs text-yellow-600">
          ⚠️ Google Maps API key not configured. Using basic location input.
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
