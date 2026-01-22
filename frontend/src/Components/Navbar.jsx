import React, { useState } from "react";
import {
  User,
  ChevronDown,
  Bell,
  Menu,
  X,
  Phone,
  Mail,
  School,
  Users,
  ShoppingCart,
  Printer,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import Notifications from "./Notifications";

const Navbar = ({ userType = "partner" }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (userType === "admin") {
    const navigationTabs = [
      { id: "overview", label: "Overview", path: "/admin", icon: BarChart3 },
      {
        id: "orders",
        label: "Orders",
        path: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        id: "partners",
        label: "Partners",
        path: "/admin/partners",
        icon: Printer,
      },
      { id: "users", label: "Users", path: "/admin/users", icon: Users },
      {
        id: "revenue",
        label: "Revenue",
        path: "/admin/revenue",
        icon: DollarSign,
      },
    ];

    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-1">
              <h1 className="text-black font-bold text-xl sm:text-2xl">
                Quick<span className="text-blue-600">Print</span>
              </h1>
              <span className="text-neutral-500 font-semibold text-sm sm:text-base hidden md:block capitalize">
                CEO dashboard
              </span>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </div>
            </div>
          </div>

          <ul className="flex space-x-1 overflow-x-auto mt-2">
            {navigationTabs.map((tab) => (
              <li key={tab.id}>
                <NavLink
                  to={tab.path}
                  end={tab.id === "overview"}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? "bg-[#141d2f] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`
                  }
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </header>
    );
  }

  const menuItems = {
    partner: [
      { id: "dashboard", label: "Dashboard", path: "/partner", end: true },
      {
        id: "orders",
        label: "Orders",
        path: "/partner/orders",
        notificationCount: 5,
      },
      { id: "reports", label: "Reports", path: "/partner/reports" },
      { id: "settings", label: "Settings", path: "/partner/settings" },
    ],
    student: [
      { id: "dashboard", label: "Upload & Print", path: "/student", end: true },
      {
        id: "orders",
        label: "My Orders",
        path: "/student/orders",
        notificationCount: 2,
      },
      { id: "settings", label: "Profile", path: "/student/settings" },
    ],
  };

  const userData = {
    partner: {
      name: user?.name || "Name Here",
      email: user?.email || "rajesh@quickprint.com",
      userId: "QP-PARTNER-1234",
      role: "Printing Manager",
      contactIcon: Mail,
    },
    student: {
      name: user?.name || "Name Here",
      phone: user?.phone || "+91 9390244436",
      college: user?.college || "CBIT College",
      role: "Student",
      contactIcon: Phone,
    },
  };

  const currentUserData = userData[userType];
  const currentMenuItems = menuItems[userType];
  const ContactIcon = currentUserData.contactIcon;

  const handleSignOut = () => {
    navigate("/login");
    setIsProfileOpen(false);
  };

  return (
    <nav className="h-16 md:h-20 shadow-md flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 bg-white sticky top-0 z-50">
      <div className="flex items-center">
        <div className="md:hidden mr-2 sm:mr-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 sm:p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex items-end gap-1">
          <h1 className="text-black font-bold text-xl sm:text-2xl">
            Quick<span className="text-blue-600">Print</span>
          </h1>
          <span className="text-neutral-500 font-semibold text-sm sm:text-base hidden md:block capitalize">
            {userType}
          </span>
        </div>
      </div>

      <ul className="hidden md:flex items-center gap-2 lg:gap-4">
        {currentMenuItems.map((item) => (
          <li key={item.id} className="relative">
            <NavLink
              to={item.path}
              end={item.end || false}
              className={({ isActive }) =>
                `px-3 py-1.5 lg:px-4 lg:py-2 rounded-full font-medium text-sm lg:text-base transition-all duration-200 relative ${
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-neutral-700 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
              {item.notificationCount && (
                <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 bg-red-500 text-white text-[10px] lg:text-xs flex items-center justify-center rounded-full">
                  {item.notificationCount}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full relative"
          >
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
              {userType === "partner" ? 3 : 2}
            </span>
          </button>
          {isNotificationsOpen && <Notifications userType={userType} />}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <User size={14} />
            </div>
            <span className="hidden lg:inline text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[120px]">
              {userType === "partner"
                ? currentUserData.email
                : currentUserData.phone}
            </span>
            <ChevronDown size={14} className="text-gray-500 hidden md:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUserData.name}
                </p>
                <div className="flex items-center mt-1">
                  <ContactIcon size={10} className="text-gray-400 mr-1" />
                  <p className="text-xs text-gray-500 truncate">
                    {userType === "partner"
                      ? currentUserData.email
                      : currentUserData.phone}
                  </p>
                </div>
                {currentUserData.college && (
                  <div className="flex items-center mt-1">
                    <School size={10} className="text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500 truncate">
                      {currentUserData.college}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {currentUserData.role}
                </p>
              </div>
              <div className="px-2 py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-2 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
