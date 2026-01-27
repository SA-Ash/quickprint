import { useState, useCallback } from "react";
import { shopService } from "../services/shop.service";

export const useShops = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getNearbyShops = useCallback(async (lat, lng, radius = 5000) => {
    try {
      setLoading(true);
      setError(null);
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

  const getAllShops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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

  const getShopById = useCallback(async (shopId) => {
    try {
      setLoading(true);
      setError(null);
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

  const calculatePrice = useCallback((shop, printConfig) => {
    if (!shop || !shop.pricing) return 0;

    const { pages = 1, copies = 1, color = false, doubleSided = false, binding = "NONE" } = printConfig;
    const pricing = shop.pricing;

    let pricePerPage;
    if (color) {
      pricePerPage = doubleSided ? (pricing.colorDouble || 8) : (pricing.colorSingle || 10);
    } else {
      pricePerPage = doubleSided ? (pricing.bwDouble || 1.5) : (pricing.bwSingle || 2);
    }

    const effectivePages = doubleSided ? Math.ceil(pages / 2) : pages;
    let totalCost = effectivePages * pricePerPage * copies;

    const bindingPrices = {
      NONE: 0,
      STAPLED: 5,
      SPIRAL: 30,
      HARDBOUND: 100,
    };
    totalCost += (bindingPrices[binding] || 0) * copies;

    return Math.round(totalCost * 100) / 100;
  }, []);

  const selectShop = useCallback((shop) => {
    setSelectedShop(shop);
  }, []);

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

export default useShops;
