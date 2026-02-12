import React, { useState, useEffect, useRef, useCallback } from "react";
<<<<<<< HEAD
import { Plus, Loader2, X, MapPin, Search, Navigation, LocateFixed } from "lucide-react";
=======
import { Plus, Loader2, X, MapPin, Search, Navigation } from "lucide-react";
>>>>>>> ebc7e45 (Fix: Location fix)
import { useAuth } from "../hooks/useAuth";
import { shopService } from "../services/shop.service";
import { showSuccess, showError } from "../utils/errorHandler";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const ServiceAreas = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newServiceArea, setNewServiceArea] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
<<<<<<< HEAD
  const [locationLoading, setLocationLoading] = useState(false);
=======
  const [geoLoading, setGeoLoading] = useState(false);
>>>>>>> ebc7e45 (Fix: Location fix)
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const debouncedSearch = useDebounce(newServiceArea, 400);

  // Load service areas on mount
  useEffect(() => {
    if (user && !USE_MOCK) {
      loadServiceAreas();
    } else if (USE_MOCK) {
      setServiceAreas([
        { id: "1", name: "Chaitanya Bharathi Institute of Technology (CBIT)", active: true },
        { id: "2", name: "Gandhi Institute of Technology and Management (GITAM)", active: true },
        { id: "3", name: "Anurag University", active: true },
      ]);
      setLoading(false);
    }
  }, [user]);

  // Search for places when input changes
  useEffect(() => {
    if (debouncedSearch.length >= 3 && !USE_MOCK) {
      searchPlaces(debouncedSearch);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearch]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadServiceAreas = async () => {
    try {
      setLoading(true);
      const response = await shopService.getMyShop();
      const shop = response.shop || response;

      if (shop && shop.id) {
        setShopId(shop.id);
        // Load service areas from shop data
        const areas = shop.serviceAreas || shop.colleges || [];
        setServiceAreas(areas.map((area, index) => ({
          id: area.id || `area-${index}`,
          name: typeof area === 'string' ? area : area.name,
          active: area.active !== false,
          placeId: area.placeId,
          address: area.address,
          lat: area.lat,
          lng: area.lng,
        })));
      }
    } catch (error) {
      console.error("Failed to load service areas:", error);
      showError("Failed to load service areas");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search for places using Google Places API (if available) or Nominatim (free fallback)
   */
  const searchPlaces = async (query) => {
    try {
      setSearchLoading(true);

      // Try Google Places API first (if Maps JS is loaded with API key)
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: "in" },
            types: ["establishment", "geocode"],
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(
                predictions.map((p) => ({
                  placeId: p.place_id,
                  name: p.structured_formatting.main_text,
                  address: p.description,
                }))
              );
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
            setSearchLoading(false);
          }
        );
        return;
      }

      // Fallback: Use Nominatim (OpenStreetMap) - free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '6',
          countrycodes: 'in',
        }),
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'QuickPrint/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      
      const mapped = results.map((r) => ({
        placeId: `osm-${r.osm_id}`,
        name: r.address?.amenity || r.address?.building || r.address?.road || r.display_name.split(',')[0],
        address: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }));

      setSuggestions(mapped);
      setShowSuggestions(mapped.length > 0);
      setSearchLoading(false);
    } catch (error) {
      console.error("Failed to search places:", error);
      setSuggestions([]);
      setSearchLoading(false);
    }
  };

<<<<<<< HEAD
  /**
   * Use browser geolocation to get current location, then reverse geocode
   */
  const handleUseCurrentLocation = () => {
=======
  // Geocode a place ID to get lat/lng using Google Places Details API
  const geocodePlaceId = (placeId) => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        resolve(null);
        return;
      }
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      service.getDetails(
        { placeId, fields: ["geometry"] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            resolve({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // Add service area using browser geolocation ("Use Current Location")
  const addCurrentLocation = async () => {
>>>>>>> ebc7e45 (Fix: Location fix)
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser");
      return;
    }
<<<<<<< HEAD

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            new URLSearchParams({
              lat: latitude.toString(),
              lon: longitude.toString(),
              format: 'json',
              addressdetails: '1',
            }),
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'QuickPrint/1.0',
              },
            }
          );

          if (!response.ok) throw new Error('Reverse geocode failed');

          const result = await response.json();
          const locationName = result.address?.amenity || result.address?.building || 
                               result.address?.road || result.display_name.split(',')[0];
          
          const newArea = {
            placeId: `loc-${Date.now()}`,
            name: `📍 ${locationName}`,
            address: result.display_name,
            lat: latitude,
            lng: longitude,
          };

          // Add directly as a service area
          await addServiceArea(newArea);
          showSuccess("Current location added as service area!");
        } catch (error) {
          console.error("Reverse geocode error:", error);
          // Fallback: use raw coords
          const newArea = {
            placeId: `loc-${Date.now()}`,
            name: `📍 Current Location`,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude,
          };
          await addServiceArea(newArea);
          showSuccess("Current location added!");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          showError("Location access denied. Please enable location permissions in your browser settings.");
        } else if (err.code === 2) {
          showError("Location unavailable. Please try again.");
        } else {
          showError("Location request timed out. Please try again.");
        }
=======
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Try to reverse-geocode for a name
          let name = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          let address = name;
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            try {
              const result = await new Promise((resolve, reject) => {
                geocoder.geocode(
                  { location: { lat: latitude, lng: longitude } },
                  (results, status) => {
                    if (status === "OK" && results && results.length > 0) {
                      resolve(results[0]);
                    } else {
                      reject(new Error("Geocode failed"));
                    }
                  }
                );
              });
              name = result.formatted_address?.split(",")[0] || name;
              address = result.formatted_address || address;
            } catch (e) {
              // Use coordinate-based name as fallback
            }
          }

          const newArea = {
            id: `area-${Date.now()}`,
            name,
            address,
            lat: latitude,
            lng: longitude,
            active: true,
          };

          const updatedAreas = [...serviceAreas, newArea];
          setServiceAreas(updatedAreas);

          if (!USE_MOCK && shopId) {
            await shopService.updateServiceAreas(shopId, updatedAreas);
            showSuccess("Location added as service area!");
          }
        } catch (error) {
          console.error("Failed to add current location:", error);
          showError("Failed to add location");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        showError("Could not get your location. Please check permissions.");
        setGeoLoading(false);
>>>>>>> ebc7e45 (Fix: Location fix)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleServiceArea = async (id) => {
    const updatedAreas = serviceAreas.map((area) =>
      area.id === id ? { ...area, active: !area.active } : area
    );
    setServiceAreas(updatedAreas);

    if (!USE_MOCK && shopId) {
      try {
        await shopService.updateServiceAreas(shopId, updatedAreas);
      } catch (error) {
        console.error("Failed to update service area:", error);
        // Revert on error
        setServiceAreas(serviceAreas);
        showError("Failed to update service area");
      }
    }
  };

  const addServiceArea = async (suggestion) => {
    if (!suggestion && !newServiceArea.trim()) return;

    const newArea = suggestion || {
      id: `area-${Date.now()}`,
      name: newServiceArea.trim(),
      address: newServiceArea.trim(),
      active: true,
    };

    // Check for duplicates
    if (serviceAreas.some((area) => area.name.toLowerCase() === newArea.name.toLowerCase())) {
      showError("This service area already exists");
      return;
    }

    // Try to geocode the place for lat/lng if it has a placeId
    let coords = null;
    if (newArea.placeId && !newArea.placeId.startsWith("mock-")) {
      coords = await geocodePlaceId(newArea.placeId);
    }

    const updatedAreas = [
      ...serviceAreas,
      {
        id: newArea.placeId || `area-${Date.now()}`,
        name: newArea.name,
        address: newArea.address,
        placeId: newArea.placeId,
<<<<<<< HEAD
        lat: newArea.lat || null,
        lng: newArea.lng || null,
=======
        ...(coords && { lat: coords.lat, lng: coords.lng }),
        ...(newArea.lat && newArea.lng && { lat: newArea.lat, lng: newArea.lng }),
>>>>>>> ebc7e45 (Fix: Location fix)
        active: true,
      },
    ];

    setServiceAreas(updatedAreas);
    setNewServiceArea("");
    setSuggestions([]);
    setShowSuggestions(false);

    if (!USE_MOCK && shopId) {
      try {
        setSaving(true);
        await shopService.updateServiceAreas(shopId, updatedAreas);
        showSuccess("Service area added successfully!");
      } catch (error) {
        console.error("Failed to add service area:", error);
        setServiceAreas(serviceAreas); // Revert
        showError("Failed to add service area");
      } finally {
        setSaving(false);
      }
    } else {
      showSuccess("Service area added! (Mock mode)");
    }
  };

  const removeServiceArea = async (id) => {
    const updatedAreas = serviceAreas.filter((area) => area.id !== id);
    setServiceAreas(updatedAreas);

    if (!USE_MOCK && shopId) {
      try {
        await shopService.updateServiceAreas(shopId, updatedAreas);
        showSuccess("Service area removed");
      } catch (error) {
        console.error("Failed to remove service area:", error);
        setServiceAreas(serviceAreas); // Revert
        showError("Failed to remove service area");
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-600">Loading service areas...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        Service Areas
      </h2>

      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">
          Colleges/Universities & Locations
        </h3>

        {serviceAreas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No service areas added yet</p>
            <p className="text-sm">Add colleges or areas you serve below</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceAreas.map((area) => (
                    <tr key={area.id}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {area.name}
                            </div>
                            {area.address && area.address !== area.name && (
                              <div className="text-xs text-gray-500 mt-1">
                                {area.address}
                              </div>
                            )}
                            {area.lat && area.lng && (
                              <div className="text-xs text-red-500 mt-1">
                                📍 {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                              </div>
                            )}
                          </div>
<<<<<<< HEAD
                        )}
                        {area.lat && area.lng && (
                          <div className="text-xs text-blue-500 mt-0.5">
                            📍 {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                          </div>
                        )}
=======
                        </div>
>>>>>>> ebc7e45 (Fix: Location fix)
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${area.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {area.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleServiceArea(area.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm"
                          >
                            {area.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => removeServiceArea(area.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">
          Add New Service Area
        </h3>

        {/* Use Current Location button */}
        <button
<<<<<<< HEAD
          onClick={handleUseCurrentLocation}
          disabled={locationLoading}
          className="mb-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {locationLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting your location...
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4" />
              Use Current Location
            </>
          )}
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-medium">OR SEARCH</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

=======
          onClick={addCurrentLocation}
          disabled={geoLoading}
          className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {geoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Navigation className="h-5 w-5" />
          )}
          {geoLoading ? "Getting Location..." : "Use Current Location"}
        </button>

        <div className="text-center text-sm text-gray-500 mb-3">OR SEARCH</div>
>>>>>>> ebc7e45 (Fix: Location fix)
        <div className="relative">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={newServiceArea}
                onChange={(e) => setNewServiceArea(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search for college, university or area..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            <button
              onClick={() => addServiceArea()}
              disabled={saving || !newServiceArea.trim()}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </>
              )}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.placeId || index}
                  onClick={() => addServiceArea(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.address}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">
                  Powered by OpenStreetMap
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
<<<<<<< HEAD
          💡 Search for colleges, universities, or any location. Select from suggestions or type a custom name.
=======
          💡 Search for colleges, universities, or areas. Select from suggestions or type a custom name.
>>>>>>> ebc7e45 (Fix: Location fix)
        </p>
      </div>
    </div>
  );
};

export default ServiceAreas;
