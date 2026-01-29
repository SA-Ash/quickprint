import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Components/Navbar";
import FloatingOrderWidget from "./Components/FloatingOrderWidget";

const Layout = ({ userType = "partner" }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType={userType} />
      <main className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      {userType === "student" && <FloatingOrderWidget />}
    </div>
  );
};

export default Layout;

