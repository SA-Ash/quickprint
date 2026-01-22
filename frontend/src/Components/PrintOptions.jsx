import React, { useState } from "react";
import { Settings, MapPin, Phone, MessageCircle } from "lucide-react";

const PrintOptions = ({
  onPlaceOrder,
  isPlacingOrder = false,
  selectedShop,
}) => {
  const [printType, setPrintType] = useState("Black & White - Single Sided");
  const [binding, setBinding] = useState("No Binding");
  const [copies, setCopies] = useState(1);
  const [message, setMessage] = useState("");

  return (
    <div className="w-full lg:flex-1 bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-max mt-6 lg:mt-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Print Options</h2>
          <p className="text-gray-500 text-sm mt-1">
            Customize your printing preferences
          </p>
        </div>
      </div>

      {selectedShop && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {selectedShop.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {selectedShop.address}
              </p>
              {selectedShop.contact && (
                <div className="flex items-center gap-1 mt-2">
                  <Phone className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-700">
                    {selectedShop.contact}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Print Type
          </label>
          <select
            value={printType}
            onChange={(e) => setPrintType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white"
          >
            <option>Black & White - Single Sided</option>
            <option>Black & White - Double Sided</option>
            <option>Color - Single Sided</option>
            <option>Color - Double Sided</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Binding
          </label>
          <select
            value={binding}
            onChange={(e) => setBinding(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white"
          >
            <option>No Binding</option>
            <option>Stapled</option>
            <option>Spiral Binding</option>
            <option>Hard Binding</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Copies
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              Additional Instructions
            </div>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any special instructions for the print shop..."
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
          />
        </div>

        <button
          onClick={() => {
            const printConfig = {
              pages: 1,
              color: printType.includes("Color"),
              doubleSided: printType.includes("Double Sided"),
              copies: parseInt(copies),
              paperSize: "A4",
              paperType: "standard",
              binding: binding,
            };
            if (onPlaceOrder) {
              onPlaceOrder(printConfig);
            }
          }}
          disabled={isPlacingOrder}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors text-sm ${
            isPlacingOrder
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
          }`}
        >
          {isPlacingOrder ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Order...
            </div>
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </div>
  );
};

export default PrintOptions;
