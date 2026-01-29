import React, { useState, useEffect } from "react";
import { Phone, Building2, Eye, EyeOff, Check, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import LocationPermission from "../Components/LocationPermission.jsx";
import COLLEGES from "../constants/colleges.js";
import { auth, setupRecaptcha, sendOtp, verifyOtp, clearRecaptcha } from "../config/firebase";

const Login = () => {
  const [isPartner, setIsPartner] = useState(false);
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const navigate = useNavigate();
  const { login, setUser } = useAuth();

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    // Only setup for student login (not partner)
    // Clear reCAPTCHA when switching modes
    return () => {
      clearRecaptcha();
    };
  }, [isPartner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isPartner && otpSent) {
        // Firebase flow - verify OTP and get ID token
        const otpCode = otpValues.join("");
        
        if (!confirmationResult) {
          throw new Error('OTP session expired. Please request a new OTP.');
        }

        // Verify OTP with Firebase and get ID token
        const idToken = await verifyOtp(confirmationResult, otpCode);
        
        // Send Firebase token to backend
        await login({
          type: "firebase",
          idToken: idToken,
          college: college,
        });
        
        showSuccess("Login successful!");
        setLoginSuccess(true);

        localStorage.setItem("userLocation", JSON.stringify(userLocation));
        setShowLocationPermission(true);
      } else if (isPartner) {
        // Use real partner login API
        await login({
          type: "partner",
          email: partnerId,
          password: password,
        });

        showSuccess("Login successful!");
        setLoginSuccess(true);

        localStorage.setItem("userLocation", JSON.stringify(userLocation));
        setShowLocationPermission(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        showError("Invalid OTP. Please try again.");
      } else if (error.code === 'auth/code-expired') {
        showError("OTP expired. Please request a new one.");
        setOtpSent(false);
        setConfirmationResult(null);
      } else {
        showError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setLoginSuccess(false);
      }, 2000);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length === 10 && college) {
      try {
        setIsLoading(true);
        
        // Setup reCAPTCHA attached to the Send OTP button
        setupRecaptcha('send-otp-button');
        
        // Send OTP via Firebase
        const formattedPhone = `+91${phone}`;
        const result = await sendOtp(formattedPhone);
        
        setConfirmationResult(result);
        setOtpSent(true);
        showSuccess("OTP sent to your phone!");
      } catch (error) {
        console.error('Failed to send OTP:', error);
        if (error.code === 'auth/invalid-phone-number') {
          showError("Invalid phone number format.");
        } else if (error.code === 'auth/too-many-requests') {
          showError("Too many attempts. Please try again later.");
        } else {
          showError(error.message || "Failed to send OTP");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = value;
      setOtpValues(newOtpValues);

      // Auto-focus next input (Firebase uses 6-digit OTP)
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
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

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtpValues(newOtp);

      const lastInput = document.getElementById("otp-5");
      lastInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace - move to previous input
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
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
                  setOtpSent(false);
                  setOtpValues(["", "", "", "", "", ""]);
                  setConfirmationResult(null);
                }}
                className="bg-white text-purple-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition text-sm md:text-base"
              >
                {isPartner ? "Login as Student" : "Login as Partner"}
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-white p-6 md:p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {isPartner ? "Partner Login" : "Student Login"}
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                {isPartner
                  ? "Enter your Partner ID and Password to access your dashboard."
                  : "Enter your details to verify and receive OTP."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {!isPartner ? (
                <>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                        }
                        className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        placeholder="Enter your 10-digit phone number"
                        required
                        disabled={otpSent}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="college"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Select College
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="college"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        required
                        disabled={otpSent}
                      >
                        {COLLEGES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      id="send-otp-button"
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phone.length !== 10 || !college || isLoading}
                      className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition text-sm md:text-base ${phone.length === 10 && college && !isLoading
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
                        : "bg-gray-400 cursor-not-allowed"
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
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label
                          htmlFor="otp"
                          className="block text-sm font-semibold text-gray-700 mb-1"
                        >
                          Enter 6-digit OTP
                        </label>
                        <div className="flex space-x-2 md:space-x-3">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={otpValues[index]}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onPaste={handleOtpPaste}
                              className="w-12 h-12 text-center py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                              required
                              autoFocus={index === 0}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isLoading || otpValues.some((value) => value === "")
                        }
                        className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition text-sm md:text-base ${isLoading || loginSuccess
                          ? "bg-green-600 hover:bg-green-700"
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
                            Verifying...
                          </>
                        ) : loginSuccess ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Login Successful!
                          </>
                        ) : (
                          "Login"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpValues(["", "", "", "", "", ""]);
                          setConfirmationResult(null);
                        }}
                        className="w-full text-sm text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        Change phone number
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="partnerId"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Partner Email
                    </label>
                    <input
                      id="partnerId"
                      type="email"
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      className="block w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                      placeholder="Enter Partner Email (e.g., rishi.kumar199550@gmail.com)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Demo emails: rishi.kumar199550@gmail.com, abcde@gmail.com,
                      abcd@gmail.com
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                        placeholder="Enter your password"
                        required
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition text-sm md:text-base ${isLoading || loginSuccess
                      ? "bg-green-600 hover:bg-green-700"
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
                        <Check className="h-4 w-4 mr-1" />
                        Login Successful!
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </>
              )}

              <div className="text-center pt-4">
                <p className="text-gray-600 text-sm">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="text-purple-600 font-semibold hover:text-purple-700 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded px-2 py-1"
                  >
                    Signup
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
