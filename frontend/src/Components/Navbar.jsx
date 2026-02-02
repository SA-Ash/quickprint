import React, { useState, useEffect } from "react";
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
  LogOut
} from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useOrders } from "../hooks/useOrders.jsx";
import Notifications from "./Notifications";
import { orderService } from "../services/order.service";

const Navbar = ({ userType = "partner" }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const { user } = useAuth();
  const { getUnreadCount } = useOrders();
  const navigate = useNavigate();

  // Fetch real-time order count
  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        if (userType === "student") {
          const response = await orderService.getUserOrders();
          // API returns { orders: [...], pagination: {...} }
          const orders = Array.isArray(response) ? response : (response?.orders || []);
          // Count active orders (not completed or cancelled)
          const activeOrders = orders.filter(o => 
            !["COMPLETED", "CANCELLED"].includes(o.status)
          );
          setOrderCount(activeOrders.length);
        } else if (userType === "partner") {
          const response = await orderService.getShopOrders();
          // API returns { orders: [...], pagination: {...} }
          const orders = Array.isArray(response) ? response : (response?.orders || []);
          const activeOrders = orders.filter(o => 
            !["COMPLETED", "CANCELLED"].includes(o.status)
          );
          setOrderCount(activeOrders.length);
        }
      } catch (error) {
        console.error("Failed to fetch order count:", error);
      }
    };

    fetchOrderCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrderCount, 30000);
    return () => clearInterval(interval);
  }, [userType]);

  const menuItems = {
    partner: [
      { id: "dashboard", label: "Dashboard", path: "/partner", icon: BarChart3, end: true },
      { id: "orders", label: "Orders", path: "/partner/orders", icon: ShoppingCart, count: orderCount },
      { id: "reports", label: "Reports", path: "/partner/reports", icon: Printer },
      { id: "settings", label: "Settings", path: "/partner/settings", icon: Settings },
    ],
    student: [
      { id: "dashboard", label: "Upload & Print", path: "/student", icon: Printer, end: true },
      { id: "orders", label: "My Orders", path: "/student/orders", icon: ShoppingCart, count: orderCount },
      { id: "settings", label: "Profile", path: "/student/settings", icon: User },
    ],
  };

  const userData = {
    partner: { name: user?.name || "Partner", sub: user?.email || "partner@quickprint.com", contactIcon: Mail },
    student: { name: user?.name || "Student", sub: user?.phone || "+91 XXXXXXXXXX", contactIcon: Phone },
  };

  const currentMenuItems = menuItems[userType];
  const currentUserData = userData[userType];
  const ContactIcon = currentUserData.contactIcon;

  // Use actual unread notification count from useOrders
  const totalNotifications = getUnreadCount();


  const handleSignOut = () => {
    navigate("/login");
    setIsProfileOpen(false);
  };

  return (
    <nav className="h-16 md:h-20 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="flex items-center">
        <div className="md:hidden mr-2">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="flex items-end gap-1">
          <h1 className="text-black font-bold text-xl sm:text-2xl">Quick<span className="text-blue-600">Print</span></h1>
          <span className="text-neutral-500 font-semibold text-sm hidden md:block capitalize">{userType}</span>
        </div>
      </div>

      <ul className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
        {currentMenuItems.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {item.count}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-gray-600 hover:bg-blue-50 rounded-full relative transition-colors">
            <Bell size={20} className={totalNotifications > 0 ? "animate-bounce" : ""} />
            {totalNotifications > 0 && (
              <>
                {/* Animated pulse ring */}
                <span className="absolute top-1 right-1 h-4 w-4 animate-ping bg-red-400 rounded-full opacity-75"></span>
                <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                  {totalNotifications > 9 ? "9+" : totalNotifications}
                </span>
              </>
            )}
          </button>
          {isNotificationsOpen && <Notifications userType={userType} />}
        </div>

        <div className="relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-all">
            <div className="group flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-[0_-1px_0_0px_#d4d4d8_inset,0_0_0_1px_#f4f4f5_inset,0_0.5px_0_1.5px_#fff_inset] active:translate-y-px transition-transform">
              <User size={16} className="text-zinc-950" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{currentUserData.name}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[100px]">{currentUserData.sub}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 hidden md:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-900">{currentUserData.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUserData.sub}</p>
              </div>
              <div className="p-1">
                <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 space-y-2 md:hidden shadow-xl">
          {currentMenuItems.map((item) => (
            <NavLink key={item.id} to={item.path} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-slate-600 font-medium">
              <item.icon size={20} /> {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;