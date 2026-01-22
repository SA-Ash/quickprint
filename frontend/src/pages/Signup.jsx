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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";

const Signup = () => {
  const [isPartner, setIsPartner] = useState(false);
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  
  // Address fields for partner
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const navigate = useNavigate();
  const { login, setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isPartner && otpSent) {
        // Student signup - verify OTP
        const otpCode = otpValues.join("");
        await login({
          type: "phone",
          step: "verify",
          phone: `+91${phone}`,
          otp: otpCode,
          college: college,
        });
        
        showSuccess("Signup successful!");
        setSignupSuccess(true);
        setTimeout(() => {
          navigate("/student");
        }, 2000);
      } else if (isPartner) {
        // Partner signup - register via API
        if (password !== confirmPassword) {
          showError("Passwords do not match");
          return;
        }

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
        });
        
        showSuccess("Partner registration successful!");
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

  const handleSendOtp = async () => {
    if (phone.length === 10 && college && name && email) {
      try {
        setIsLoading(true);
        
        // Send OTP via real API
        await login({
          type: "phone",
          step: "initiate",
          phone: `+91${phone}`,
        });
        
        setOtpSent(true);
        showSuccess("OTP sent to your phone! Check backend terminal for mock OTP.");
      } catch (error) {
        console.error("OTP error:", error);
        showError(error.message || "Failed to send OTP");
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

      if (value && index < 3) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
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
            {!isPartner ? (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      placeholder="Enter your full name"
                      required
                      disabled={otpSent}
                    />
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      placeholder="Enter your email address"
                      required
                      disabled={otpSent}
                    />
                  </div>
                </div>

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
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
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
                      className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      required
                      disabled={otpSent}
                    >
                      <option value="">Select Your College</option>
                      <option value="ou">Osmania University</option>
                      <option value="jntu">JNTU Hyderabad</option>
                      <option value="iit">IIT Hyderabad</option>
                      <option value="bits">BITS Pilani, Hyderabad</option>
                    </select>
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={
                      phone.length !== 10 || !college || !name || !email || isLoading
                    }
                    className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition text-sm md:text-base ${
                      phone.length === 10 && college && name && email && !isLoading
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? "Sending OTP..." : "Generate OTP"}
                  </button>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor="otp"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
                        Enter OTP (check backend terminal for mock OTP)
                      </label>
                      <div className="flex space-x-2 md:space-x-3">
                        {[0, 1, 2, 3].map((index) => (
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
                            className="w-1/4 text-center py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
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
                          Signup Successful!
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Partner Signup Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>

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
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Your shop name"
                        required
                      />
                    </div>
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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="10-digit phone number"
                      required
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shop Address
                  </label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Min 8 characters"
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
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Confirm password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
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
                  disabled={isLoading || password !== confirmPassword || !password || !name || !shopName || !email || !phone || !street || !city || !state || !pincode}
                  className={`w-full flex justify-center items-center py-2 md:py-3 px-4 border border-transparent rounded-lg shadow text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition text-sm md:text-base ${
                    isLoading || signupSuccess
                      ? "bg-green-600 hover:bg-green-700"
                      : password === confirmPassword && password && name && shopName && email && phone && street && city && state && pincode
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90"
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
                      Creating Account...
                    </>
                  ) : signupSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Signup Successful!
                    </>
                  ) : (
                    "Create Partner Account"
                  )}
                </button>
              </>
            )}

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
                setOtpSent(false);
                setOtpValues(["", "", "", ""]);
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
