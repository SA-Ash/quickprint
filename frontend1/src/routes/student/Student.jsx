import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadSection from "../../Components/UploadSection";
import PrintOptions from "../../Components/PrintOptions";
import ShopSelector from "../../Components/ShopSelector";
import Cart from "../../Components/Cart";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useOrders } from "../../hooks/useOrders.jsx";
import { showSuccess, showError } from "../../utils/errorHandler.js";

const Student = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentStep, setCurrentStep] = useState("upload");
  const [showCart, setShowCart] = useState(false);
  const [currentPrintConfig, setCurrentPrintConfig] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 17.385, lng: 78.4867 });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.log("Using default location");
        }
      );
    }
  }, []);

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    if (file) {
      setCurrentStep("shop");
    }
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    setCurrentStep("options");
  };

  const handlePlaceOrder = (printConfig) => {
    if (!uploadedFile) {
      showError("Please upload a file first");
      return;
    }

    if (!selectedShop) {
      showError("Please select a print shop");
      return;
    }

    if (!user) {
      showError("Please login to place an order");
      return;
    }

    setCurrentPrintConfig(printConfig);
    setShowCart(true);
  };

  const handleProceedToPayment = async (pricing, paymentMethod = "cod") => {
    if (!pricing) return;

    try {
      setIsPlacingOrder(true);

      const fileUrl = `https://example.com/uploads/${uploadedFile.name}`;

      const orderData = {
        shopId: selectedShop.id,
        file: {
          url: fileUrl,
          name: uploadedFile.name,
          pages: currentPrintConfig?.pages || 1,
        },
        printConfig: {
          pages: 'all',
          color: currentPrintConfig?.color || false,
          copies: currentPrintConfig?.copies || 1,
          binding: currentPrintConfig?.binding !== 'No Binding',
          sides: currentPrintConfig?.doubleSided ? 'double' : 'single',
        },
        totalCost: pricing.total,
        paymentMethod: paymentMethod,
      };

      // For COD, create order directly
      // For online payments (razorpay, upi), we'd integrate payment gateway here
      // For now, mocking all as direct order creation
      const order = await createOrder(orderData);

      showSuccess(`Order placed successfully at ${selectedShop.businessName || selectedShop.name}!`);
      
      // Reset form
      setUploadedFile(null);
      setSelectedShop(null);
      setShowCart(false);
      setCurrentPrintConfig(null);
      setCurrentStep("upload");

      // Navigate to order tracking
      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error("Order creation failed:", error);
      showError("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen max-w-[85rem] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
      <div className="mb-4 sm:mb-5 md:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Upload & Print
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base md:text-lg">
          Upload your documents and customize your printing preferences
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${
              currentStep === "upload"
                ? "text-blue-600"
                : currentStep === "shop" || currentStep === "options"
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "upload"
                  ? "bg-blue-100 text-blue-600"
                  : currentStep === "shop" || currentStep === "options"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              1
            </div>
            <span className="ml-2 text-sm font-medium">Upload File</span>
          </div>

          <div
            className={`w-8 h-1 ${
              currentStep === "shop" || currentStep === "options"
                ? "bg-green-200"
                : "bg-gray-200"
            }`}
          ></div>

          <div
            className={`flex items-center ${
              currentStep === "shop"
                ? "text-blue-600"
                : currentStep === "options"
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "shop"
                  ? "bg-blue-100 text-blue-600"
                  : currentStep === "options"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              2
            </div>
            <span className="ml-2 text-sm font-medium">Select Shop</span>
          </div>

          <div
            className={`w-8 h-1 ${
              currentStep === "options" ? "bg-green-200" : "bg-gray-200"
            }`}
          ></div>

          <div
            className={`flex items-center ${
              currentStep === "options" ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "options"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              3
            </div>
            <span className="ml-2 text-sm font-medium">Print Options</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-5 md:gap-6">
        {currentStep === "upload" && (
          <UploadSection
            onFileUpload={handleFileUpload}
            uploadedFile={uploadedFile}
          />
        )}

        {currentStep === "shop" && (
          <ShopSelector
            onShopSelect={handleShopSelect}
            selectedShop={selectedShop}
          />
        )}

        {currentStep === "options" && (
          <PrintOptions
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={isPlacingOrder}
            selectedShop={selectedShop}
          />
        )}
      </div>

      {showCart && (
        <Cart
          file={uploadedFile}
          shop={selectedShop}
          printConfig={currentPrintConfig}
          userLocation={userLocation}
          onClose={() => setShowCart(false)}
          onProceedToPayment={handleProceedToPayment}
          isLoading={isPlacingOrder}
        />
      )}
    </div>
  );
};

export default Student;
