import { useState, useCallback } from "react";
import { shopService } from "../services/shop.service";

// Check if we should use mock mode (for development without backend)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Hook for managing shop discovery and selection
 */
export const useShops = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get shops near a location
   */
  const getNearbyShops = useCallback(async (lat, lng, radius = 5000) => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        const mockShops = getMockShops(lat, lng);
        setShops(mockShops);
        return mockShops;
      }

      const response = await shopService.getNearbyShops(lat, lng, radius);
      const shopsData = response.shops || response.data || response;
      setShops(Array.isArray(shopsData) ? shopsData : []);
      return shopsData;
    } catch (err) {
      console.error("Failed to get nearby shops:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all available shops
   */
  const getAllShops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        const mockShops = getMockShops();
        setShops(mockShops);
        return mockShops;
      }

      const response = await shopService.getAllShops();
      const shopsData = response.shops || response.data || response;
      setShops(Array.isArray(shopsData) ? shopsData : []);
      return shopsData;
    } catch (err) {
      console.error("Failed to get all shops:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a specific shop by ID
   */
  const getShopById = useCallback(async (shopId) => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        const mockShops = getMockShops();
        const shop = mockShops.find(s => s.id === shopId);
        return shop || null;
      }

      const response = await shopService.getShopById(shopId);
      return response.shop || response;
    } catch (err) {
      console.error("Failed to get shop:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate price for a print job at a shop
   */
  const calculatePrice = useCallback((shop, printConfig) => {
    if (!shop || !shop.pricing) return 0;

    const { pages = 1, copies = 1, color = false, doubleSided = false, binding = 'NONE' } = printConfig;
    const pricing = shop.pricing;

    // Base price per page
    let pricePerPage;
    if (color) {
      pricePerPage = doubleSided ? (pricing.colorDouble || 8) : (pricing.colorSingle || 10);
    } else {
      pricePerPage = doubleSided ? (pricing.bwDouble || 1.5) : (pricing.bwSingle || 2);
    }

    // Effective pages (double-sided halves the page count)
    const effectivePages = doubleSided ? Math.ceil(pages / 2) : pages;

    // Base cost
    let totalCost = effectivePages * pricePerPage * copies;

    // Binding cost
    const bindingPrices = {
      NONE: 0,
      STAPLED: 5,
      SPIRAL: 30,
      HARDBOUND: 100,
    };
    totalCost += (bindingPrices[binding] || 0) * copies;

    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }, []);

  /**
   * Select a shop
   */
  const selectShop = useCallback((shop) => {
    setSelectedShop(shop);
  }, []);

  /**
   * Clear selected shop
   */
  const clearSelectedShop = useCallback(() => {
    setSelectedShop(null);
  }, []);

  return {
    shops,
    selectedShop,
    loading,
    error,
    getNearbyShops,
    getAllShops,
    getShopById,
    calculatePrice,
    selectShop,
    clearSelectedShop,
  };
};

// Mock shops data
function getMockShops(lat = 17.4401, lng = 78.3489) {
  return [
    {
      id: "shop_1",
      businessName: "QuickPrint Hub - CBIT",
      address: {
        street: "Near CBIT Gate",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500075"
      },
      location: { lat: lat + 0.001, lng: lng + 0.001 },
      services: {
        colorPrinting: true,
        binding: true,
        lamination: true
      },
      pricing: {
        bwSingle: 2,
        bwDouble: 1.5,
        colorSingle: 10,
        colorDouble: 8
      },
      rating: 4.5,
      isActive: true,
      distance: 150, // meters
    },
    {
      id: "shop_2",
      businessName: "Print Express - JNTU",
      address: {
        street: "JNTU Road",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500072"
      },
      location: { lat: lat + 0.005, lng: lng - 0.003 },
      services: {
        colorPrinting: true,
        binding: true,
        lamination: false
      },
      pricing: {
        bwSingle: 1.5,
        bwDouble: 1,
        colorSingle: 8,
        colorDouble: 6
      },
      rating: 4.2,
      isActive: true,
      distance: 500,
    },
    {
      id: "shop_3",
      businessName: "Campus Prints",
      address: {
        street: "University Road",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500032"
      },
      location: { lat: lat - 0.002, lng: lng + 0.004 },
      services: {
        colorPrinting: true,
        binding: false,
        lamination: true
      },
      pricing: {
        bwSingle: 2.5,
        bwDouble: 2,
        colorSingle: 12,
        colorDouble: 10
      },
      rating: 4.0,
      isActive: true,
      distance: 350,
    },
  ];
}

export default useShops;
