import React from "react";
import AllOrders from "../../Components/AllOrders";
import { Link, useNavigate } from "react-router-dom";

const Orders = () => {
  return (
    <div className="min-h-screen sm:px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Manage Orders
        </h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm">
          View and manage all your print orders in one place.
        </p>
      </div>

      <AllOrders />
    </div>
  );
};

export default Orders;
