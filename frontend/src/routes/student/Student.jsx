import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadSection from "../../Components/UploadSection";
import PrintOptions from "../../Components/PrintOptions";
import ShopSelector from "../../Components/ShopSelector";
import Cart from "../../Components/Cart";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useOrders } from "../../hooks/useOrders.jsx";
import { showSuccess, showError } from "../../utils/errorHandler.js";
import { uploadService } from "../../services/upload.service.js";

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

  // Handle going back to previous step
  const handleGoBack = () => {
    if (currentStep === "shop") {
      setCurrentStep("upload");
    } else if (currentStep === "options") {
      setCurrentStep("shop");
    }
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

      // Upload the file to the server first
      // Note: uploadedFile is {name, size, type, file} wrapper, need to pass .file
      let fileUrl;
      let fileId;
      try {
        const uploadResult = await uploadService.uploadFile(uploadedFile.file);
        fileUrl = uploadResult.url;
        fileId = uploadResult.fileId;
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        showError("Failed to upload file. Please try again.");
        return;
      }

      const orderData = {
        shopId: selectedShop.id,
        file: {
          url: fileUrl,
          name: uploadedFile.name,
          pages: currentPrintConfig?.pages || 1,
          fileId: fileId, // Database file ID for tracking
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

      // Handle different payment methods
      if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
        // For online payments, we need to:
        // 1. Create order first (with pending payment status)
        // 2. Initiate Razorpay payment
        // 3. After payment success, order is automatically updated via webhook
        
        const order = await createOrder(orderData);
        
        try {
          // Dynamically import Razorpay service
          const { default: razorpayService } = await import("../../services/razorpay.service.js");
          
          // Create Razorpay order
          const paymentOrder = await razorpayService.createRazorpayOrder(order.id);
          
          // Open Razorpay checkout
          const paymentResult = await razorpayService.openCheckout({
            amount: paymentOrder.amount,
            razorpayOrderId: paymentOrder.providerOrderId,
            customerName: user?.name || '',
            customerEmail: user?.email || '',
            customerPhone: user?.phone || '',
            description: `Order at ${selectedShop.businessName || selectedShop.name}`,
          });
          
          // Verify payment with backend
          await razorpayService.verifyPayment({
            paymentId: paymentOrder.paymentId,
            razorpayOrderId: paymentResult.razorpayOrderId,
            razorpayPaymentId: paymentResult.razorpayPaymentId,
            razorpaySignature: paymentResult.razorpaySignature,
          });
          
          // Reload orders to get updated status (backend updates status to ACCEPTED on payment success)
          await loadOrders();
          
          showSuccess(`Payment successful! Order placed at ${selectedShop.businessName || selectedShop.name}!`);
        } catch (paymentError) {
          console.error("Payment failed:", paymentError);
          showError(paymentError.message || "Payment failed. Please try again or use Cash on Delivery.");
          // Order is already created, redirect to order page anyway
          setUploadedFile(null);
          setSelectedShop(null);
          setShowCart(false);
          setCurrentPrintConfig(null);
          setCurrentStep("upload");
          navigate(`/student/order/${order.id}`);
          return;
        }
        
        // Reset form and navigate
        setUploadedFile(null);
        setSelectedShop(null);
        setShowCart(false);
        setCurrentPrintConfig(null);
        setCurrentStep("upload");
        navigate(`/student/order/${order.id}`);
      } else {
        // For COD, create order directly
        const order = await createOrder(orderData);
        
        showSuccess(`Order placed successfully at ${selectedShop.businessName || selectedShop.name}!`);
        
        // Reset form
        setUploadedFile(null);
        setSelectedShop(null);
        setShowCart(false);
        setCurrentPrintConfig(null);
        setCurrentStep("upload");

        // Navigate to order tracking
        navigate(`/student/order/${order.id}`);
      }
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
            onBack={handleGoBack}
          />
        )}

        {currentStep === "options" && (
          <PrintOptions
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={isPlacingOrder}
            selectedShop={selectedShop}
            onBack={handleGoBack}
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
