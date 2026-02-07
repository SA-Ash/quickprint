import React, { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Adminlogin from "./pages/AdminLogin";
import VerifyPartnerEmail from "./pages/VerifyPartnerEmail";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { OrdersProvider } from "./hooks/useOrders.jsx";
import { PartnerOrdersProvider } from "./hooks/usePartnerOrders.jsx";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import Layout from "./Layout";
import PartnerDashboard from "./routes/partner/PartnerDashboard";
import PartnerOrders from "./routes/partner/Orders";
import Reports from "./routes/partner/Reports";
import PartnerOrderDetails from "./routes/partner/OrderDetails.jsx";
import PartnerSettings from "./routes/partner/PartnerSettings";

import StudentDashboard from "./routes/student/Student.jsx";
import StudentOrders from "./routes/student/StudentOrders";
import StudentSettings from "./routes/student/StudentSettings";
import OrderTracking from "./routes/student/OrderTracking.jsx";

import RevenueChart from "./Components/admin/RevenueChart";
import OrderAnalytics from "./Components/admin/OrderAnalytics";
import PartnerManagement from "./Components/admin/PartnerManagement";
import UserInsights from "./Components/admin/UserInsights";

import Admin from "./routes/admin/Admin.jsx";
import { Toaster } from "react-hot-toast";

const App = () => {
  const [timeRange] = useState("month");

  return (
    <AuthProvider>
      <Toaster position="bottom-right" reverseOrder={false} />
      <OrdersProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/adminlogin" element={<Adminlogin />} />
            {/* Student routes - protected for STUDENT role only */}
            <Route
              path="/student"
              element={
                <RoleProtectedRoute allowedRoles={['STUDENT']}>
                  <Layout userType="student" />
                </RoleProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="orders" element={<StudentOrders />} />
              <Route path="order/:orderId" element={<OrderTracking />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>
            {/* Legacy order tracking route - redirect to /student/order/:orderId */}
            <Route path="/order/:orderId" element={<OrderTracking />} />
            {/* Partner email verification (magic link landing) */}
            <Route path="/partner/verify-email" element={<VerifyPartnerEmail />} />
            {/* Partner routes - protected for SHOP/PARTNER role only */}
            <Route
              path="/partner"
              element={
                <RoleProtectedRoute allowedRoles={['SHOP', 'PARTNER']}>
                  <PartnerOrdersProvider>
                    <Layout userType="partner" />
                  </PartnerOrdersProvider>
                </RoleProtectedRoute>
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
            {/* Admin routes - protected for ADMIN role only */}
            <Route path="/admin" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout userType="admin" />
              </RoleProtectedRoute>
            }>
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
