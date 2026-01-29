import React, { useState } from "react";
import { Plus } from "lucide-react";

const ServiceAreas = () => {
  const [serviceAreas, setServiceAreas] = useState([
    {
      id: 1,
      name: "Chaitanya Bharathi Institute of Technology (CBIT)",
      active: true,
    },
    {
      id: 2,
      name: "Gandhi Institute of Technology and Management (GITAM)",
      active: true,
    },
    { id: 3, name: "Anurag University", active: true },
    {
      id: 4,
      name: "Malla Reddy College of Engineering and Technology",
      active: true,
    },
    { id: 5, name: "Chaitanya Institute of Networking (CIN)", active: true },
  ]);

  const [newServiceArea, setNewServiceArea] = useState("");

  const toggleServiceArea = (id) => {
    setServiceAreas(
      serviceAreas.map((area) =>
        area.id === id ? { ...area, active: !area.active } : area
      )
    );
  };

  const addServiceArea = () => {
    if (newServiceArea.trim()) {
      setServiceAreas([
        ...serviceAreas,
        { id: Date.now(), name: newServiceArea.trim(), active: true },
      ]);
      setNewServiceArea("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        Service Areas
      </h2>

      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">
          Colleges/Universities
        </h3>

        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    College/University
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceAreas.map((area) => (
                  <tr key={area.id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                      {area.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          area.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {area.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                      <button
                        onClick={() => toggleServiceArea(area.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm"
                      >
                        {area.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">
          Add New Service Area
        </h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            value={newServiceArea}
            onChange={(e) => setNewServiceArea(e.target.value)}
            placeholder="Enter college/university name"
            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          />
          <button
            onClick={addServiceArea}
            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceAreas;
