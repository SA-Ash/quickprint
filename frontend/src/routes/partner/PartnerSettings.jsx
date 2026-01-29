import React, { useState } from "react";
import BusinessInformation from "../../Components/BusinessInformation";
import ServiceAreas from "../../Components/ServiceAreas";
import PricingSettings from "../../Components/PricingSettings";

const PartnerSettings = () => {
  const [activeTab, setActiveTab] = useState("business");

  return (
    <div className="min-h-screen bg-gray-50 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Configure your print shop preferences and account settings.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: "business", label: "Business Information" },
                { id: "service", label: "Service Areas" },
                { id: "pricing", label: "Pricing Settings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-4 sm:px-6 text-center font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === "business" && <BusinessInformation />}
        {activeTab === "service" && <ServiceAreas />}
        {activeTab === "pricing" && <PricingSettings />}
      </div>
    </div>
  );
};

export default PartnerSettings;
