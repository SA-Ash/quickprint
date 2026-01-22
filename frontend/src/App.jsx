import React, { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Adminlogin from "./pages/AdminLogin";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { OrdersProvider } from "./hooks/useOrders.jsx";
import { PartnerOrdersProvider } from "./hooks/usePartnerOrders.jsx";
// ProtectedRoute removed

import Layout from "./Layout";
import PartnerDashboard from "./routes/partner/PartnerDashboard";
import PartnerOrders from "./routes/partner/Orders";
import Reports from "./routes/partner/Reports";
import PartnerOrderDetails from "./routes/partner/OrderDetails.jsx";
import PartnerSettings from "./routes/partner/PartnerSettings";

import StudentDashboard from "./routes/student/Student.jsx";
import StudentOrders from "./routes/student/StudentOrders";
import StudentSettings from "./routes/student/StudentSettings";

import RevenueChart from "./Components/admin/RevenueChart";
import OrderAnalytics from "./Components/admin/OrderAnalytics";
import PartnerManagement from "./Components/admin/PartnerManagement";
import UserInsights from "./Components/admin/UserInsights";

import Admin from "./routes/admin/Admin.jsx";

const App = () => {
  const [timeRange] = useState("month");
  return (
    <AuthProvider>
      <OrdersProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/adminlogin" element={<Adminlogin />} />
            {/* Student routes */}
            <Route
              path="/student"
              element={
                // Removed ProtectedRoute
                <Layout userType="student" />
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="orders" element={<StudentOrders />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>
            {/* Partner routes */}
            <Route
              path="/partner"
              element={
                // Removed ProtectedRoute
                <PartnerOrdersProvider>
                  <Layout userType="partner" />
                </PartnerOrdersProvider>
              }
            >
              <Route index element={<PartnerDashboard />} />
              <Route path="orders">
                <Route index element={<PartnerOrders />} />
                <Route path=":id" element={<PartnerOrderDetails />} />
              </Route>
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<PartnerSettings />} />
            </Route>
            {/* Admin routes */}
            <Route path="/admin" element={<Layout userType="admin" />}>
              <Route path="/admin" element={<Admin />} />
              <Route
                path="/admin/orders"
                element={<OrderAnalytics detailed timeRange={timeRange} />}
              />
              <Route
                path="/admin/partners"
                element={<PartnerManagement detailed />}
              />
              <Route
                path="/admin/users"
                element={<UserInsights timeRange={timeRange} />}
              />
              <Route
                path="/admin/revenue"
                element={<RevenueChart detailed timeRange={timeRange} />}
              />
            </Route>
          </Routes>
        </Router>
      </OrdersProvider>
    </AuthProvider>
  );
};

export default App;
