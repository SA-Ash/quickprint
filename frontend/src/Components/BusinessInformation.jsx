import React, { useState, useEffect } from "react";
import { Save, Building, Mail, Phone, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { shopService } from "../services/shop.service";
import { showSuccess, showError } from "../utils/errorHandler";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const BusinessInformation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Load shop data on mount
  useEffect(() => {
    if (user && !USE_MOCK) {
      loadShopData();
    } else if (USE_MOCK) {
      // Mock data for development
      setBusinessInfo({
        name: "Quick Print Services - Hyderabad",
        phone: "9014773042",
        email: "rishi.kumar199550@gmail.com",
        address: "123 College Road, Near CBIT Campus, Hyderabad",
      });
      setLoading(false);
    }
  }, [user]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const response = await shopService.getMyShop();
      const shop = response.shop || response;
      
      if (shop && shop.id) {
        setShopId(shop.id);
        setBusinessInfo({
          name: shop.name || "",
          phone: shop.phone || user?.phone || "",
          email: shop.email || user?.email || "",
          address: shop.address?.formatted || shop.address?.street || "",
        });
      }
    } catch (error) {
      console.error("Failed to load shop data:", error);
      showError("Failed to load business information");
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessChange = (field, value) => {
    setBusinessInfo({
      ...businessInfo,
      [field]: value,
    });
  };

  const handleSave = async () => {
    if (USE_MOCK) {
      showSuccess("Business information saved! (Mock mode)");
      return;
    }

    if (!shopId) {
      showError("Shop not found. Please try again.");
      return;
    }

    try {
      setSaving(true);
      await shopService.updateShop(shopId, {
        name: businessInfo.name,
        phone: businessInfo.phone,
        email: businessInfo.email,
        address: {
          formatted: businessInfo.address,
        },
      });
      showSuccess("Business information updated successfully!");
    } catch (error) {
      console.error("Failed to update shop:", error);
      showError(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-600">Loading business information...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <Building className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
        Business Information
      </h2>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Print Shop Name
          </label>
          <input
            type="text"
            value={businessInfo.name}
            onChange={(e) => handleBusinessChange("name", e.target.value)}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            placeholder="Enter your shop name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Contact Phone
          </label>
          <div className="flex items-center">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
            <input
              type="tel"
              value={businessInfo.phone}
              onChange={(e) => handleBusinessChange("phone", e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="Enter contact phone"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Contact Email
          </label>
          <div className="flex items-center">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
            <input
              type="email"
              value={businessInfo.email}
              onChange={(e) => handleBusinessChange("email", e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="Enter contact email"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BusinessInformation;
