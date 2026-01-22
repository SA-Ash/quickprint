import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";

const StudentSettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    college: "",
    smsUpdates: true,
    marketing: false,
  });

  const [otpSettings, setOtpSettings] = useState({
    enabled: true,
    deliveryMethod: "sms",
    email: "example@example.com",
    backupCodes: ["ABCD12", "EFGH34", "IJKL56", "MNOP78"],
    showBackupCodes: false,
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpAction, setOtpAction] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        phone: user.phone || "",
        college: user.college || "",
        fullName: user.name || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleOtpChange = (e) => {
    const { name, type, checked, value } = e.target;
    setOtpSettings({
      ...otpSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Profile updated successfully!");
  };

  const handleOtpManagement = () => {
    setShowOtpModal(true);
    setIsMobileMenuOpen(false);
  };

  const confirmOtpAction = () => {
    if (otpAction === "disable") {
      setOtpSettings({ ...otpSettings, enabled: false });
      alert("OTP authentication has been disabled.");
    } else if (otpAction === "change") {
      alert("OTP delivery method has been changed.");
    }
    setShowOtpModal(false);
    setOtpAction("");
  };

  const getRandomColor = () => {
    const colors = [
      { bg: "bg-red-100", text: "text-red-700" },
      { bg: "bg-blue-100", text: "text-blue-700" },
      { bg: "bg-green-100", text: "text-green-700" },
      { bg: "bg-yellow-100", text: "text-yellow-700" },
      { bg: "bg-purple-100", text: "text-purple-700" },
      { bg: "bg-pink-100", text: "text-pink-700" },
      { bg: "bg-indigo-100", text: "text-indigo-700" },
      { bg: "bg-orange-100", text: "text-orange-700" },
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const randomColor = getRandomColor();
  const initials = formData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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
          <div
            className={`lg:col-span-1 space-y-6 fixed lg:static inset-0 z-30 bg-white lg:bg-transparent p-6 lg:p-0 transform ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto lg:overflow-visible`}
          >
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <div className="flex flex-col items-center">
                <div
                  className={`w-20 h-20 md:w-24 md:h-24 ${randomColor.bg} rounded-full flex items-center justify-center mb-4 shadow-md`}
                >
                  <span
                    className={`text-2xl md:text-3xl font-bold ${randomColor.text}`}
                  >
                    {initials}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 text-center">
                  {formData.fullName}
                </h2>
                <p className="text-gray-600 text-xs md:text-sm mt-1 text-center">
                  Computer Science Student
                </p>

                <div className="mt-4 flex items-center text-xs md:text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate max-w-xs">
                    {formData.college.split("(")[0].trim()}
                  </span>
                </div>
              </div>

              <hr className="my-4 md:my-6 border-gray-200" />

              <div className="space-y-3">
                <div className="flex items-center text-gray-600 text-sm md:text-base">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-blue-500" />
                  <span className="truncate">{formData.phone}</span>
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

            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => alert("Contact support for assistance")}
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

          <div className="lg:col-span-2">
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 py-2.5 px-4 border text-sm md:text-base"
                    />
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
                      <option>
                        Chaitanya Bharathi Institute of Technology (CBIT)
                      </option>
                      <option>Sri Chaitanya College</option>
                      <option>Vasavi College of Engineering</option>
                      <option>Osmania University</option>
                      <option>JNTU College of Engineering</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 md:py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-sm md:text-base"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Update Profile
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6 pb-2 md:pb-3 border-b border-gray-200">
                Account Statistics
              </h2>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-blue-50 text-center py-3 md:py-4 rounded-lg border border-blue-100">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    12
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    Total Orders
                  </p>
                </div>
                <div className="bg-green-50 text-center py-3 md:py-4 rounded-lg border border-green-100">
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    ₹450
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    Total Spent
                  </p>
                </div>
                <div className="bg-purple-50 text-center py-3 md:py-4 rounded-lg border border-purple-100">
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    8
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Completed</p>
                </div>
                <div className="bg-yellow-50 text-center py-3 md:py-4 rounded-lg border border-yellow-100">
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">
                    4
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Pending</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-gray-600 text-center">
                  <span className="font-medium">Member since January 2023</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-4 md:p-6 mx-2">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
              <Key className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-500" />
              OTP Authentication Settings
            </h2>

            <div className="mb-4 md:mb-6">
              <label className="flex items-center mb-3 md:mb-4">
                <input
                  type="checkbox"
                  checked={otpSettings.enabled}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setOtpAction("disable");
                    } else {
                      setOtpSettings({ ...otpSettings, enabled: true });
                    }
                  }}
                  className="h-4 w-4 md:h-5 md:w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 md:ml-3 text-gray-700 font-medium text-sm md:text-base">
                  Enable OTP Authentication
                </span>
              </label>

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
                    <span className="ml-2 text-gray-700 text-sm md:text-base">
                      SMS
                    </span>
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
                    <span className="ml-2 text-gray-700 text-sm md:text-base">
                      Email
                    </span>
                  </label>
                </div>
              </div>

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
                    />
                  </div>
                </div>
              )}

              <div className="mb-3 md:mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Backup Codes
                </p>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-600 mb-2">
                    Use these codes to access your account if you can't receive
                    OTPs. Each code can only be used once.
                  </p>
                  {otpSettings.showBackupCodes ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {otpSettings.backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="bg-white p-2 rounded text-center font-mono text-xs md:text-sm"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setOtpSettings({
                          ...otpSettings,
                          showBackupCodes: true,
                        })
                      }
                      className="text-blue-600 text-xs md:text-sm font-medium flex items-center"
                    >
                      <Key className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Show Backup Codes
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowOtpModal(false)}
                className="px-3 md:px-4 py-1.5 md:py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (otpAction) {
                    confirmOtpAction();
                  } else {
                    setShowOtpModal(false);
                    alert("OTP settings updated successfully!");
                  }
                }}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center text-sm md:text-base"
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                {otpAction ? "Confirm" : "Save Changes"}
              </button>
            </div>

            {otpAction === "disable" && (
              <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs md:text-sm text-yellow-800">
                  <strong>Warning:</strong> Disabling OTP authentication reduces
                  your account security. Are you sure you want to proceed?
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSettings;
