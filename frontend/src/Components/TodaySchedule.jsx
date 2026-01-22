import React from "react";
import { ordersData, statusStyles } from "../data/orders";

const TodaySchedule = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-8">
        Today's Schedule
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-600 text-xs sm:text-sm">
              <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">Date</th>
              <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">
                Order ID
              </th>
              <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0 hidden sm:table-cell">
                Customer
              </th>
              <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">Payment</th>
              <th className="pb-2 sm:pb-3 font-medium px-2 sm:px-0">Status</th>
            </tr>
          </thead>
          <tbody>
            {ordersData.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="py-3 sm:py-4 font-semibold text-gray-800 text-xs sm:text-sm px-2 sm:px-0">
                  {row.date}
                </td>
                <td className="py-3 sm:py-4 text-blue-700 text-xs sm:text-sm font-medium px-2 sm:px-0">
                  {row.id}
                </td>
                <td className="py-3 sm:py-4 text-gray-700 text-xs sm:text-sm px-2 sm:px-0 hidden sm:table-cell">
                  {row.customer}
                </td>
                <td className="py-3 sm:py-4 text-gray-700 text-xs sm:text-sm px-2 sm:px-0">
                  {row.payment}
                </td>
                <td className="py-3 sm:py-4 px-2 sm:px-0">
                  <span
                    className={`${
                      statusStyles[row.status]
                    } px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TodaySchedule;
