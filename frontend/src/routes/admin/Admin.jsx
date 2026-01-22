import React, { useState } from "react";
import {
  Users,
  ShoppingCart,
  Printer,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";

import DashboardCards from "../../Components/admin/DashboardCards";
import RevenueChart from "../../Components/admin/RevenueChart";
import OrderAnalytics from "../../Components/admin/OrderAnalytics";
import PartnerManagement from "../../Components/admin/PartnerManagement";
import UserInsights from "../../Components/admin/UserInsights";
import RecentActivity from "../../Components/admin/RecentActivity";

const Admin = () => {
  const [timeRange] = useState("month");

  const navigationTabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "partners", label: "Partners", icon: Printer },
    { id: "users", label: "Users", icon: Users },
    { id: "revenue", label: "Revenue", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6">
        <div className="space-y-6">
          <DashboardCards timeRange={timeRange} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart timeRange={timeRange} />
            <OrderAnalytics timeRange={timeRange} />
          </div>

          <div className="flex flex-col gap-4">
            <PartnerManagement />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
