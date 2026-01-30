import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  MapPin,
  Flame,
  Info,
  X,
  FileText,
  Copy,
  Palette,
  BookOpen,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "cod",
    name: "Pay on Delivery",
    description: "Pay when you collect your prints",
    icon: Banknote,
    color: "green",
  },
  {
    id: "upi",
    name: "UPI",
    description: "GPay, PhonePe, Paytm UPI",
    icon: Smartphone,
    color: "purple",
  },
  {
    id: "paytm",
    name: "Paytm",
    description: "Wallet, Cards, Net Banking",
    icon: Wallet,
    color: "blue",
  },
];

const Cart = ({
  file,
  shop,
  printConfig,
  userLocation,
  onClose,
  onProceedToPayment,
  isLoading = false,
}) => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    const fetchPricing = async () => {
      if (!shop?.id || !userLocation?.lat || !userLocation?.lng) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/pricing/calculate-price`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shopId: shop.id,
              userLat: userLocation.lat,
              userLng: userLocation.lng,
              printConfig: {
                pages: printConfig?.pages || 1,
                copies: printConfig?.copies || 1,
                color: printConfig?.color || false,
                doubleSided: printConfig?.doubleSided || false,
                binding: printConfig?.binding || "No Binding",
              },
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to calculate price");

        const data = await response.json();
        setPricing(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [shop, userLocation, printConfig]);

  if (!shop || !file) return null;

  const handleProceed = () => {
    onProceedToPayment(pricing, paymentMethod);
  };

  const getButtonText = () => {
    if (isLoading) return null;
    if (paymentMethod === "cod") {
      return `Place Order • ₹${pricing?.total?.toFixed(2) || "..."}`;
    }
    return `Pay ₹${pricing?.total?.toFixed(2) || "..."}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Order Summary</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* File Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-200 px-2 py-1 rounded-full">
                    <Copy className="w-3 h-3" />
                    {printConfig?.copies || 1} copies
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-200 px-2 py-1 rounded-full">
                    <FileText className="w-3 h-3" />
                    {printConfig?.pages || 1} pages
                  </span>
                  {printConfig?.color && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      <Palette className="w-3 h-3" />
                      Color
                    </span>
                  )}
                  {printConfig?.doubleSided && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <BookOpen className="w-3 h-3" />
                      Double-sided
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shop Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {shop.businessName || shop.name}
              </span>
            </div>
            {pricing && (
              <p className="text-xs text-gray-500">
                {pricing.distanceKm.toFixed(1)} km away
              </p>
            )}
          </div>

          {/* Pricing Breakdown */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
              {error}
            </div>
          ) : pricing ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Cost</span>
                <span className="font-medium">₹{pricing.baseCost.toFixed(2)}</span>
              </div>

              {pricing.distanceMultiplier > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Distance ({pricing.distanceKm.toFixed(1)} km)
                  </span>
                  <span className="text-orange-600 font-medium">
                    ×{pricing.distanceMultiplier.toFixed(2)}
                  </span>
                </div>
              )}

              {pricing.surgeMultiplier > 1 && (
                <div className="flex justify-between text-sm bg-orange-50 -mx-4 px-4 py-2 rounded-lg">
                  <span className="text-orange-700 flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {pricing.surgeReason || "High Demand"}
                  </span>
                  <span className="text-orange-700 font-bold">
                    ×{pricing.surgeMultiplier.toFixed(1)}
                  </span>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{pricing.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee</span>
                  <span>₹{pricing.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Convenience Fee (5%)</span>
                  <span>₹{pricing.convenienceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (18%)</span>
                  <span>₹{pricing.gst.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ₹{pricing.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Payment Method Selection */}
          {pricing && !loading && !error && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Payment Method</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-indigo-500" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected ? "text-white" : "text-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isSelected ? "text-indigo-700" : "text-gray-900"
                          }`}
                        >
                          {method.name}
                        </p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-indigo-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {paymentMethod === "cod"
                ? "Pay when you collect your prints from the shop."
                : "You will be redirected to complete your payment securely."}
            </span>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-gray-50 border-t sticky bottom-0">
          <button
            onClick={handleProceed}
            disabled={loading || error || isLoading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              loading || error || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : paymentMethod === "cod"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
