import React, { useState } from "react";
import { Phone, Building2, Eye, EyeOff, Check, Printer, Mail, Lock, Fingerprint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import LocationPermission from "../Components/LocationPermission.jsx";
import COLLEGES from "../constants/colleges.js";
import { passkeyService } from "../services/passkey.service.js";

const Login = () => {
  const [isPartner, setIsPartner] = useState(false);
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported] = useState(() => passkeyService.isSupported());

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isPartner) {
        // Student login with email + password
        if (!email || !email.includes('@')) {
          throw new Error('Please enter a valid email address');
        }
        if (!password) {
          throw new Error('Please enter your password');
        }
        if (!college) {
          throw new Error('Please select your college');
        }

        await login({
          type: "email",
          email: email,
          password: password,
          college: college,
        });
      } else {
        // Partner login with email + password
        if (!partnerId) {
          throw new Error('Please enter your email');
        }
        if (!password) {
          throw new Error('Please enter your password');
        }

        await login({
          type: "partner",
          email: partnerId,
          password: password,
        });
      }

      showSuccess("Login successful!");
      setLoginSuccess(true);

      localStorage.setItem("userLocation", JSON.stringify(userLocation));
      setShowLocationPermission(true);
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setLoginSuccess(false);
      }, 2000);
    }
  };

  const handleLocationGranted = (location) => {
    setUserLocation(location);
    setShowLocationPermission(false);
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "SHOP") {
      navigate("/partner");
    } else {
      navigate("/student");
    }
  };

  const handleLocationDenied = () => {
    setShowLocationPermission(false);
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "SHOP") {
      navigate("/partner");
    } else {
      navigate("/student");
    }
  };

  const handlePasskeyLogin = async () => {
    if (!passkeySupported) {
      showError("Passkeys are not supported on this device");
      return;
    }

    setPasskeyLoading(true);
    try {
      const result = await passkeyService.login();
      showSuccess("Login successful!");
      setLoginSuccess(true);
      setShowLocationPermission(true);
    } catch (error) {
      console.error("Passkey login error:", error);
      if (error.name === "NotAllowedError") {
        showError("Passkey authentication was cancelled");
      } else {
        showError(error.message || "Passkey login failed");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <>
      {showLocationPermission && (
        <LocationPermission
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />
      )}
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-100">
        <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
          <div className="w-full md:w-1/2 bg-gradient-to-br from-purple-700 to-indigo-600 text-white p-6 md:p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute -top-16 -left-16 w-64 h-64 md:-top-20 md:-left-20 md:w-80 md:h-80 rounded-full bg-white bg-opacity-10"></div>
              <div className="absolute -bottom-16 -right-16 w-48 h-48 md:-bottom-20 md:-right-20 md:w-60 md:h-60 rounded-full bg-white bg-opacity-10"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center mb-4 md:mb-6">
                <Printer className="h-6 w-6 md:h-8 md:w-8 mr-2" />
                <span className="text-xl md:text-2xl font-bold">
                  Quick Print
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                {isPartner ? "Partner Access" : "Student Access"}
              </h1>

              <ul className="space-y-2 md:space-y-3 text-purple-100 mb-4 md:mb-6 text-sm md:text-base">
                {isPartner ? (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Manage
                      student print requests
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Track orders
                      and payments
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Streamline
                      your printing business
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Grow with
                      Quick Print network
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Upload and
                      order prints online
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Skip queues,
                      save time
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" /> Collect
                      prints hassle-free
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />{" "}
                      Student-friendly pricing
                    </li>
                  </>
                )}
              </ul>

              <button
                onClick={() => {
                  setIsPartner(!isPartner);
                  setEmail("");
                  setPartnerId("");
                  setPassword("");
                  setCollege("");
                }}
                className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 transition py-2 px-4 rounded-lg"
              >
                {isPartner
                  ? "Are you a student? Login here"
                  : "Are you a partner? Login here"}
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {isPartner ? "Partner Login" : "Student Login"}
            </h2>
            <p className="text-gray-500 mb-6 text-sm md:text-base">
              {isPartner
                ? "Access your partner dashboard"
                : "Login with your email and password"}
            </p>

            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              {!isPartner ? (
                <>
                  {/* Student Login Form */}
                  <div>
                    <label
                      htmlFor="college"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Select College
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        id="college"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none text-sm md:text-base"
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

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Partner Login Form */}
                  <div>
                    <label
                      htmlFor="partnerId"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="partnerId"
                        type="email"
                        value={partnerId}
                        onChange={(e) => setPartnerId(e.target.value)}
                        className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        placeholder="partner@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition text-sm md:text-base ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
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
                    Logging in...
                  </>
                ) : loginSuccess ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Success!
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>

              {/* Passkey Login Option */}
              {passkeySupported && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading}
                    className="mt-4 w-full flex justify-center items-center py-2 md:py-3 px-4 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition text-sm md:text-base"
                  >
                    {passkeyLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600"
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
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-5 w-5 mr-2 text-purple-600" />
                        Sign in with Passkey
                      </>
                    )}
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
