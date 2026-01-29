import React, { useState } from "react";
import {
  Search,
  Star,
  MapPin,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";

const PartnerManagement = ({ detailed = false }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const partners = [
    {
      id: 1,
      name: "Campus Print Center",
      owner: "Rajesh Kumar",
      location: "Engineering Block",
      rating: 4.8,
      totalOrders: 1248,
      activeOrders: 12,
      revenue: "₹2,45,680",
      performance: "excellent",
    },
    {
      id: 2,
      name: "Tech Prints",
      owner: "Priya Singh",
      location: "Business School",
      rating: 4.5,
      totalOrders: 856,
      activeOrders: 8,
      revenue: "₹1,68,420",
      performance: "good",
    },
    {
      id: 3,
      name: "Quick Copy",
      owner: "Amit Sharma",
      location: "Arts College",
      rating: 4.2,
      totalOrders: 642,
      activeOrders: 5,
      revenue: "₹1,24,500",
      performance: "average",
    },
    {
      id: 4,
      name: "Student Print Hub",
      owner: "Neha Patel",
      location: "Medical College",
      rating: 4.9,
      totalOrders: 956,
      activeOrders: 15,
      revenue: "₹1,89,750",
      performance: "excellent",
    },
  ];

  const performanceConfig = {
    excellent: { color: "bg-green-100 text-green-800", label: "Excellent" },
    good: { color: "bg-blue-100 text-blue-800", label: "Good" },
    average: { color: "bg-amber-100 text-amber-800", label: "Average" },
  };

  if (!detailed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Partner Network
            </h3>
            <p className="text-gray-600 text-sm">Active printing partners</p>
          </div>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View All →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {partner.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {partner.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{partner.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium">{partner.rating}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Active</div>
                  <div className="font-semibold text-gray-900">
                    {partner.activeOrders}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="font-semibold text-gray-900">
                    {partner.totalOrders}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Revenue</div>
                  <div className="font-semibold text-gray-900">
                    {partner.revenue}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Partner Management
          </h3>
          <p className="text-gray-600 mt-1">
            Comprehensive partner performance overview
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            Add Partner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-sm text-gray-600 mb-1">Total Partners</div>
          <div className="text-2xl font-bold text-gray-900">
            {partners.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-green-600" />
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-sm text-gray-600 mb-1">Active Today</div>
          <div className="text-2xl font-bold text-gray-900">38</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-yellow-500 fill-current" />
            <span className="text-green-600 text-sm font-medium">+0.2</span>
          </div>
          <div className="text-sm text-gray-600 mb-1">Avg Rating</div>
          <div className="text-2xl font-bold text-gray-900">4.6/5</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-green-600 text-sm font-medium">+12%</span>
          </div>
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">₹7.2L</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">
            Partner Directory
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            Detailed partner information and performance metrics
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Partner Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {partners.map((partner) => (
                <tr
                  key={partner.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {partner.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {partner.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {partner.owner}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {partner.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="font-medium text-gray-900">
                        {partner.rating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {partner.activeOrders} active
                      </div>
                      <div className="text-gray-600">
                        {partner.totalOrders} total
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {partner.revenue}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        performanceConfig[partner.performance].color
                      }`}
                    >
                      {performanceConfig[partner.performance].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerManagement;
