import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Phone,
  Shield,
  HelpCircle,
  Lock,
  Save,
  Mail,
  Key,
  CheckCircle,
  Menu,
  X,
  Eye,
  EyeOff,
  Loader2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth.jsx";
import { userService } from "../../services/user.service.js";
import { authService } from "../../services/auth.service.js";
import { orderService } from "../../services/order.service.js";
import COLLEGES from "../../constants/colleges.js";
import { showSuccess, showError } from "../../utils/errorHandler.js";

const StudentSettings = () => {
  const { user, setUser } = useAuth();

  // Original values for change detection
  const [originalData, setOriginalData] = useState({
    fullName: "",
    phone: "",
    college: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    college: "",
  });

  const [otpSettings, setOtpSettings] = useState({
    enabled: true,
    deliveryMethod: "sms",
    email: "",
    backupCodes: [],
    showBackupCodes: false,
  });

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSupportDrawer, setShowSupportDrawer] = useState(false);

  // Account statistics state
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completed: 0,
    pending: 0,
    memberSince: null,
  });


  // Load user data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getProfile();
        const data = {
          fullName: profile.name || "",
          phone: profile.phone || "",
          college: profile.college || "",
        };
        setFormData(data);
        setOriginalData(data);

        setOtpSettings(prev => ({
          ...prev,
          enabled: profile.otpEnabled ?? true,
          deliveryMethod: profile.otpMethod || "sms",
          email: profile.email || "",
        }));
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    if (user) {
      // Use user from context first
      const data = {
        fullName: user.name || "",
        phone: user.phone || "",
        college: user.college || "",
      };
      setFormData(data);
      setOriginalData(data);

      // Then load full profile from API
      loadProfile();
    }
  }, [user]);

  // Load order statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const orders = await orderService.getUserOrders();
        const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const completed = orders.filter(o => o.status === "COMPLETED").length;
        const pending = orders.filter(o => 
          ["PENDING", "ACCEPTED", "PRINTING", "READY"].includes(o.status)
        ).length;
        
        setStats({
          totalOrders: orders.length,
          totalSpent,
          completed,
          pending,
          memberSince: user?.createdAt ? new Date(user.createdAt) : null,
        });
      } catch (error) {
        console.error("Failed to load order stats:", error);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  // Load backup codes when modal opens
  useEffect(() => {
    const loadBackupCodes = async () => {
      if (showOtpModal && otpSettings.showBackupCodes) {
        try {
          const result = await authService.getBackupCodes();
          setOtpSettings(prev => ({ ...prev, backupCodes: result.codes || [] }));
        } catch (error) {
          console.error("Failed to load backup codes:", error);
        }
      }
    };
    loadBackupCodes();
  }, [showOtpModal, otpSettings.showBackupCodes]);

  // Detect if form has changes
  const hasChanges = useMemo(() => {
    return (
      formData.fullName !== originalData.fullName ||
      formData.phone !== originalData.phone ||
      formData.college !== originalData.college
    );
  }, [formData, originalData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e) => {
    const { name, type, checked, value } = e.target;
    setOtpSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: formData.fullName,
        college: formData.college,
      };

      // Only update phone if changed and valid
      if (formData.phone !== originalData.phone) {
        const phoneWithCode = formData.phone.startsWith("+91")
          ? formData.phone
          : `+91${formData.phone.replace(/\D/g, "").slice(-10)}`;
        updateData.phone = phoneWithCode;
      }

      const updatedProfile = await userService.updateProfile(updateData);

      // Update local user context
      const updatedUser = { ...user, ...updatedProfile };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (setUser) setUser(updatedUser);

      // Update original data after successful save
      setOriginalData({
        fullName: formData.fullName,
        phone: formData.phone,
        college: formData.college,
      });

      showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      showError(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpManagement = () => {
    setShowOtpModal(true);
    setIsMobileMenuOpen(false);
  };

  const handleSaveOtpSettings = async () => {
    setIsOtpLoading(true);
    try {
      // If disabling OTP, require password first
      if (!otpSettings.enabled) {
        if (!passwordData.password || passwordData.password.length < 8) {
          showError("Password must be at least 8 characters");
          setIsOtpLoading(false);
          return;
        }
        if (passwordData.password !== passwordData.confirmPassword) {
          showError("Passwords do not match");
          setIsOtpLoading(false);
          return;
        }

        // Set password first
        await authService.setPassword(passwordData.password, passwordData.confirmPassword);
      }

      // Update OTP settings
      await authService.updateOtpSettings({
        enabled: otpSettings.enabled,
        method: otpSettings.deliveryMethod,
        email: otpSettings.deliveryMethod === "email" ? otpSettings.email : undefined,
      });

      showSuccess("OTP settings updated successfully!");
      setShowOtpModal(false);
      setPasswordData({ password: "", confirmPassword: "" });
    } catch (error) {
      console.error("OTP settings update failed:", error);
      showError(error.message || "Failed to update OTP settings");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      const result = await authService.generateBackupCodes();
      setOtpSettings(prev => ({ ...prev, backupCodes: result.codes || [] }));
      showSuccess("New backup codes generated!");
    } catch (error) {
      showError("Failed to generate backup codes");
    }
  };

  // Format phone for display
  const displayPhone = formData.phone?.replace("+91", "") || "";

  // Generate avatar initials
  const initials = formData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen py-4 md:py-8 bg-gray-50">
      <div className="lg:hidden fixed top-4 right-4 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-blue-600 text-white shadow-md"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-16 lg:pt-0">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Manage your account information and communication preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div
            className={`lg:col-span-1 space-y-6 fixed lg:static inset-0 z-30 bg-white lg:bg-transparent p-6 lg:p-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              } lg:translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto lg:overflow-visible`}
          >
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <span className="text-2xl md:text-3xl font-bold text-purple-700">
                    {initials}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 text-center">
                  {formData.fullName || "Student"}
                </h2>
                <p className="text-gray-600 text-xs md:text-sm mt-1 text-center">
                  Computer Science Student
                </p>

                <div className="mt-4 flex items-center text-xs md:text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate max-w-xs">
                    {COLLEGES.find(c => c.value === formData.college)?.label?.split("(")[0].trim() || formData.college || "Select College"}
                  </span>
                </div>
              </div>

              <hr className="my-4 md:my-6 border-gray-200" />

              <div className="space-y-3">
                <div className="flex items-center text-gray-600 text-sm md:text-base">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-blue-500" />
                  <span className="truncate">{displayPhone || "Not set"}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm md:text-base">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-blue-500" />
                  <span>
                    OTP Authentication{" "}
                    {otpSettings.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                Security
              </h3>
              <div className="bg-blue-50 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                <div className="flex items-start">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-xs md:text-sm font-medium text-blue-800">
                      OTP Authentication
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your account uses OTP-based login for enhanced security
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOtpManagement}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 md:py-2.5 rounded-lg transition duration-200 hover:bg-gray-50 flex items-center justify-center text-sm md:text-base"
              >
                <Lock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Manage OTP Settings
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => setShowSupportDrawer(true)}
                  className="w-full text-left py-2 px-4 rounded-lg flex items-center text-blue-600 hover:bg-blue-50 transition text-sm md:text-base"
                >
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Support
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-medium"
            >
              Close Menu
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Personal Information Form */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6 pb-2 md:pb-3 border-b border-gray-200">
                Personal Information
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 py-2.5 px-4 border text-sm md:text-base"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+91</span>
                      <input
                        type="text"
                        name="phone"
                        value={displayPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setFormData(prev => ({ ...prev, phone: val }));
                        }}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 py-2.5 pl-12 pr-4 border text-sm md:text-base"
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College
                    </label>
                    <select
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 py-2.5 px-4 border bg-white text-sm md:text-base"
                    >
                      {COLLEGES.map((college) => (
                        <option key={college.value} value={college.value}>
                          {college.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!hasChanges || isLoading}
                  className={`w-full font-medium py-2.5 md:py-3 rounded-lg transition duration-200 shadow-md flex items-center justify-center text-sm md:text-base ${hasChanges && !isLoading
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Update Profile
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Account Statistics */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6 pb-2 md:pb-3 border-b border-gray-200">
                Account Statistics
              </h2>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-blue-50 text-center py-3 md:py-4 rounded-lg border border-blue-100">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
                  <p className="text-xs md:text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="bg-green-50 text-center py-3 md:py-4 rounded-lg border border-green-100">
                  <p className="text-xl md:text-2xl font-bold text-green-600">₹{stats.totalSpent}</p>
                  <p className="text-xs md:text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="bg-purple-50 text-center py-3 md:py-4 rounded-lg border border-purple-100">
                  <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.completed}</p>
                  <p className="text-xs md:text-sm text-gray-600">Completed</p>
                </div>
                <div className="bg-yellow-50 text-center py-3 md:py-4 rounded-lg border border-yellow-100">
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-xs md:text-sm text-gray-600">Pending</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-gray-600 text-center">
                  <span className="font-medium">
                    {stats.memberSince 
                      ? `Member since ${stats.memberSince.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                      : 'Member'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-4 md:p-6 mx-2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
              <Key className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-500" />
              OTP Authentication Settings
            </h2>

            <div className="mb-4 md:mb-6">
              <label className="flex items-center mb-3 md:mb-4">
                <input
                  type="checkbox"
                  checked={otpSettings.enabled}
                  onChange={(e) => setOtpSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 md:h-5 md:w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 md:ml-3 text-gray-700 font-medium text-sm md:text-base">
                  Enable OTP Authentication
                </span>
              </label>

              {/* OTP Delivery Method */}
              <div className="mb-3 md:mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  OTP Delivery Method
                </p>
                <div className="flex space-x-3 md:space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="sms"
                      checked={otpSettings.deliveryMethod === "sms"}
                      onChange={handleOtpChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 text-sm md:text-base">SMS</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="email"
                      checked={otpSettings.deliveryMethod === "email"}
                      onChange={handleOtpChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 text-sm md:text-base">Email</span>
                  </label>
                </div>
              </div>

              {/* Email field when email is selected */}
              {otpSettings.deliveryMethod === "email" && (
                <div className="mb-3 md:mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      type="email"
                      name="email"
                      value={otpSettings.email}
                      onChange={handleOtpChange}
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 py-2 px-3 md:px-4 border text-sm md:text-base"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              )}

              {/* Password fields when disabling OTP */}
              {!otpSettings.enabled && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium mb-3">
                    Set a password to disable OTP authentication
                  </p>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={passwordData.password}
                        onChange={handlePasswordChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 pr-10 border text-sm"
                        placeholder="New password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 pr-10 border text-sm"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup Codes */}
              <div className="mb-3 md:mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Backup Codes</p>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-600 mb-2">
                    Use these codes to access your account if you can't receive OTPs.
                  </p>
                  {otpSettings.showBackupCodes ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {otpSettings.backupCodes.length > 0 ? (
                        otpSettings.backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="bg-white p-2 rounded text-center font-mono text-xs md:text-sm border"
                          >
                            {code}
                          </div>
                        ))
                      ) : (
                        <p className="col-span-2 text-gray-500 text-sm">No backup codes generated</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setOtpSettings(prev => ({ ...prev, showBackupCodes: true }))}
                      className="text-blue-600 text-xs md:text-sm font-medium flex items-center"
                    >
                      <Key className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Show Backup Codes
                    </button>
                  )}
                  {otpSettings.showBackupCodes && (
                    <button
                      onClick={handleGenerateBackupCodes}
                      className="mt-2 text-blue-600 text-xs md:text-sm font-medium hover:underline"
                    >
                      Generate New Codes
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setPasswordData({ password: "", confirmPassword: "" });
                }}
                className="px-3 md:px-4 py-1.5 md:py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOtpSettings}
                disabled={isOtpLoading}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center text-sm md:text-base disabled:opacity-50"
              >
                {isOtpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {!otpSettings.enabled && (
              <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs md:text-sm text-yellow-800">
                  <strong>Warning:</strong> Disabling OTP authentication reduces your account security.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* Support Drawer */}
      {showSupportDrawer && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSupportDrawer(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Contact Support</h2>
                <button
                  onClick={() => setShowSupportDrawer(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center mb-2">
                    <Mail className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-semibold text-gray-700">Email</span>
                  </div>
                  <a 
                    href="mailto:thequickprint2617@gmail.com"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    thequickprint2617@gmail.com
                  </a>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center mb-2">
                    <Phone className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-semibold text-gray-700">Phone</span>
                  </div>
                  <a 
                    href="tel:+919390244436"
                    className="text-green-600 font-medium hover:underline"
                  >
                    +91 93902 44436
                  </a>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-semibold text-gray-700">Hours</span>
                  </div>
                  <p className="text-purple-700 font-medium">9:00 AM - 9:00 PM IST</p>
                  <p className="text-sm text-gray-500 mt-1">Monday to Saturday</p>
                </div>

                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>We usually respond within 24 hours.</p>
                  <p className="mt-2">For urgent queries, please call us.</p>
                </div>
              </div>

              <button
                onClick={() => setShowSupportDrawer(false)}
                className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSettings;
