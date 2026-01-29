import { useState, useEffect } from "react";
import { MapPin, Star, Clock, Phone, CheckCircle } from "lucide-react";
import { useShops } from "../hooks/useShops";
import GeoLocationPrompt from "./GeoLocationPrompt";

const ShopSelector = ({ onShopSelect, selectedShop }) => {
  const { shops, loading, error, getNearbyShops, getAllShops } = useShops();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      getNearbyShops(userLocation.lat, userLocation.lng, 5000);
    }
  }, [userLocation]);

  const handleLocationUpdate = (location) => {
    setUserLocation(location);
  };

  const handleShopSelect = (shop) => {
    onShopSelect(shop);
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-5 md:mb-6">
        Select Print Shop
      </h2>

      <GeoLocationPrompt onLocationUpdate={handleLocationUpdate} showRefresh={true} />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading nearby shops...</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">{error}</p>
          <p className="text-yellow-700 text-xs mt-1">Please check your connection and try again</p>
        </div>
      )}

      {!loading && shops.length > 0 && (
        <div className="space-y-3">
          {shops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => handleShopSelect(shop)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedShop?.id === shop.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {shop.businessName || shop.name}
                    </h3>
                    {selectedShop?.id === shop.id && (
                      <CheckCircle className="ml-2 h-4 w-4 text-blue-600" />
                    )}
                  </div>

                  <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span>
                      {typeof shop.address === "object"
                        ? `${shop.address.street || ""}, ${shop.address.city || ""}`
                        : shop.address}
                    </span>
                  </div>

                  {shop.contact && (
                    <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span>{shop.contact}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {shop.rating && (
                        <div className="flex items-center text-yellow-600 text-xs sm:text-sm">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 fill-current" />
                          <span>{shop.rating}</span>
                        </div>
                      )}

                      {shop.distance !== undefined && (
                        <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>{shop.distance.toFixed(1)} km away</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-medium ${
                          shop.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {shop.isActive ? "Available" : "Busy"}
                      </div>
                    </div>
                  </div>

                  {shop.services && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(shop.services)
                        .filter(([_, enabled]) => enabled)
                        .map(([service], index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {service.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && shops.length === 0 && userLocation && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">No shops found in your area</p>
          <p className="text-xs text-gray-400 mt-1">
            Try expanding your search radius or check back later
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopSelector;
