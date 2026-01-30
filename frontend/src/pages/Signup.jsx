import React, { useState } from "react";
import {
  Phone,
  Building2,
  Eye,
  EyeOff,
  Check,
  Printer,
  User,
  Mail,
  MapPin,
  Lock,
  Fingerprint,
} from "lucide-react";
import AddressAutoFill from "../Components/AddressAutoFill";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import COLLEGES from "../constants/colleges.js";
import { passkeyService } from "../services/passkey.service.js";

const Signup = () => {
  const [isPartner, setIsPartner] = useState(false);
  
  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Student specific
  const [college, setCollege] = useState("");
  
  // Partner specific
  const [shopName, setShopName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [shopLocation, setShopLocation] = useState({ lat: 0, lng: 0 });

  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [passkeySupported] = useState(() => passkeyService.isSupported());

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      if (!isPartner) {
        // Student signup - Direct with Password
        await login({
          type: "phone_password",
          step: "signup",
          phone: `+91${phone}`,
          password: password,
          name: name,
          college: college,
        });

        showSuccess("Student account created successfully!");
        setSignupSuccess(true);
        setTimeout(() => {
          navigate("/student");
        }, 2000);
      } else {
        // Partner signup - Direct Registration
        await login({
          type: "partner",
          step: "register",
          email: email,
          password: password,
          name: name,
          phone: `+91${phone}`,
          shopName: shopName,
          address: {
            street: street,
            city: city,
            state: state,
            pincode: pincode,
          },
          location: shopLocation.lat !== 0 ? shopLocation : undefined,
        });

        showSuccess("Partner account created successfully!");
        setSignupSuccess(true);
        setTimeout(() => {
          navigate("/partner");
        }, 2000);
      }
    } catch (error) {
      console.error("Signup error:", error);
      showError(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSignupSuccess(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100">
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1 max-h-[90vh] overflow-y-auto">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {isPartner ? "Partner Signup" : "Student Signup"}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {isPartner
                ? "Create your partner account to start accepting print orders."
                : "Create your student account to start ordering prints."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <div className="absolute inset-y-0 left-8 pl-1 flex items-center pointer-events-none text-gray-400 text-sm">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="block w-full pl-16 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  placeholder="9876543210"
                  required
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            {/* Student Specific */}
            {!isPartner && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Select College
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    required
                  >
                    <option value="">Select your college</option>
                    {COLLEGES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Partner Specific */}
            {isPartner && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Printer className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      placeholder="Your shop name"
                      required
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Shop Address
                    </label>
                    <AddressAutoFill
                      currentAddress={{ street }}
                      onAddressUpdate={(addr) => {
                        if (addr.city) setCity(addr.city);
                        if (addr.state) setState(addr.state);
                        if (addr.pincode) setPincode(addr.pincode);
                        if (addr.lat && addr.lng) setShopLocation({ lat: addr.lat, lng: addr.lng });
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Street address"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="City"
                        required
                      />
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="State"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) =>
                        setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Pincode (6 digits)"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    placeholder="Min 8 chars"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm">Passwords do not match</p>
            )}

            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword}
              className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition text-sm md:text-base ${
                isLoading || signupSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </>
              ) : signupSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Account Created!
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                >
                  Login
                </button>
              </p>
            </div>
          </form>

          {/* Passkey Signup Option */}
          {passkeySupported && !isPartner && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-600 mt-4">
                Create your account first, then add a passkey in settings for faster login.
              </p>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-700 to-cyan-600 text-white p-6 md:p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden order-1 md:order-2">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-16 -left-16 w-64 h-64 md:-top-20 md:-left-20 md:w-80 md:h-80 rounded-full bg-white bg-opacity-10"></div>
            <div className="absolute -bottom-16 -right-16 w-48 h-48 md:-bottom-20 md:-right-20 md:w-60 md:h-60 rounded-full bg-white bg-opacity-10"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center mb-4 md:mb-6">
              <Printer className="h-6 w-6 md:h-8 md:w-8 mr-2" />
              <span className="text-xl md:text-2xl font-bold">Quick Print</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
              {isPartner ? "Partner Registration" : "Student Registration"}
            </h1>

            <ul className="space-y-2 md:space-y-3 text-blue-100 mb-4 md:mb-6 text-sm md:text-base">
              {isPartner ? (
                <>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Reach more
                    students in your area
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Manage orders
                    efficiently
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Grow your
                    printing business
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Secure payment
                    processing
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Upload and
                    order prints from anywhere
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Skip long
                    queues at printing shops
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Track your
                    orders in real-time
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" /> Exclusive
                    student discounts
                  </li>
                </>
              )}
            </ul>

            <button
              onClick={() => {
                setIsPartner(!isPartner);
                setPhone("");
                setEmail("");
                setName("");
                setPassword("");
                setConfirmPassword("");
                setShopName("");
                setStreet("");
                setCity("");
                setState("");
                setPincode("");
                setCollege("");
              }}
              className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition text-sm md:text-base"
            >
              {isPartner ? "Signup as Student" : "Signup as Partner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
