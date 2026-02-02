import React, { useState, useEffect } from "react";
import {
  Star,
  MapPin,
} from "lucide-react";
import adminService from "../../services/admin.service";

const PartnerManagement = ({ detailed = false }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getPartnerStats();
        setPartners(data.partners || []);
      } catch (err) {
        console.error("Failed to fetch partner stats:", err);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Partner Network
            </h3>
            <p className="text-gray-600 text-sm">Active printing partners</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div>
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Partner Network
            </h3>
            <p className="text-gray-600 text-sm">Active printing partners</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          No partners registered yet
        </div>
      </div>
    );
  }

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
        {partners.slice(0, 4).map((partner) => (
          <div
            key={partner.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(partner.name || "P")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {partner.name || "Partner Shop"}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span className={`px-2 py-0.5 rounded-full ${partner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {partner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs font-medium">{partner.rating?.toFixed(1) || "0.0"}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xs text-gray-600">Orders</div>
                <div className="font-semibold text-gray-900">
                  {partner.orderCount || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Revenue</div>
                <div className="font-semibold text-gray-900">
                  ₹{Math.round(partner.revenue || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerManagement;
