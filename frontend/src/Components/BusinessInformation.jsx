import React, { useState } from "react";
import { Save, Building, MapPin, Clock, Mail, Phone } from "lucide-react";

const BusinessInformation = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: "Quick Print Services - Hyderabad",
    phone: "9014773042",
    address: "123 College Road, Near CBIT Campus, Hyderabad, Telangana 500075",
    email: "rishi.kumar199550@gmail.com",
    hours: "Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 3:00 PM",
  });

  const handleBusinessChange = (field, value) => {
    setBusinessInfo({
      ...businessInfo,
      [field]: value,
    });
  };

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
            />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex justify-end">
        <button className="flex items-center px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
          <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default BusinessInformation;
