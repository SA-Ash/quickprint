import React, { useState, useEffect } from "react";
import { Phone, Building2, Eye, EyeOff, Check, Printer, Mail, Lock, Fingerprint, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import LocationPermission from "../Components/LocationPermission.jsx";
import COLLEGES from "../constants/colleges.js";
import { passkeyService } from "../services/passkey.service.js";
import phoneAuthService from "../services/phone-auth.service.js";
import emailAuthService from "../services/email-auth.service.js";

const Login = () => {
  const [isPartner, setIsPartner] = useState(false);
  
  // Combined phone/email input
  const [identifier, setIdentifier] = useState("");
  const [inputType, setInputType] = useState(null); // 'phone' | 'email' | null
  
  // Legacy fields for password mode
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Student specific
  const [college, setCollege] = useState("");
  
  // OTP flow state
  const [step, setStep] = useState("input"); // 'input' | 'otp' | 'password'
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Location & passkey
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported] = useState(() => passkeyService.isSupported());
  
  // Auth mode: 'otp' | 'password'
  const [authMode, setAuthMode] = useState("otp");

  const navigate = useNavigate();
  const { login } = useAuth();

  // Auto-detect phone vs email as user types
  useEffect(() => {
    if (!identifier) {
      setInputType(null);
      return;
    }
    
    // Check if it looks like a phone number (starts with digit or +)
    const isPhone = /^[\d+]/.test(identifier.trim());
    const hasAtSymbol = identifier.includes('@');
    
    if (hasAtSymbol) {
      setInputType('email');
    } else if (isPhone) {
      setInputType('phone');
    } else {
      setInputType(null);
    }
  }, [identifier]);

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!identifier) {
      showError("Please enter your phone number or email");
      return;
    }

    setOtpLoading(true);
    try {
      if (inputType === 'phone') {
        // Firebase Phone Auth
        await phoneAuthService.sendPhoneOTP(identifier);
        showSuccess(`OTP sent to ${identifier}`);
      } else if (inputType === 'email') {
        // SendGrid Email OTP
        await emailAuthService.sendOTP(identifier);
        showSuccess(`OTP sent to ${identifier}`);
      } else {
        showError("Please enter a valid phone number or email");
        return;
      }
      
      setOtpSent(true);
      setStep("otp");
    } catch (error) {
      console.error("Send OTP error:", error);
      showError(error.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle verify OTP and login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showError("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      if (inputType === 'phone') {
        // Verify phone OTP with Firebase, then login via backend
        const result = await phoneAuthService.loginWithPhone(otp, {
          college: !isPartner ? college : undefined,
          isPartner,
        });
        
        // Handle login response
        if (result.user && result.token) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
        }
      } else if (inputType === 'email') {
        // Verify email OTP and login
        await login({
          type: isPartner ? "partner" : "email",
          email: identifier,
          otp: otp,
          college: !isPartner ? college : undefined,
        });
      }

      showSuccess("Login successful!");
      setLoginSuccess(true);
      setShowLocationPermission(true);
    } catch (error) {
      console.error("Verify OTP error:", error);
      showError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password login (fallback)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isPartner) {
        // Student login with email + password
        if (!identifier || !identifier.includes('@')) {
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
          email: identifier,
          password: password,
          college: college,
        });
      } else {
        // Partner login with email + password
        if (!identifier) {
          throw new Error('Please enter your email');
        }
        if (!password) {
          throw new Error('Please enter your password');
        }

        await login({
          type: "partner",
          email: identifier,
          password: password,
        });
      }

      showSuccess("Login successful!");
      setLoginSuccess(true);
      setShowLocationPermission(true);
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setLoginSuccess(false), 2000);
    }
  };

  const handleLocationGranted = (location) => {
    setUserLocation(location);
    setShowLocationPermission(false);
    const user = JSON.parse(localStorage.getItem("user"));
    navigate(user?.role === "SHOP" ? "/partner" : "/student");
  };

  const handleLocationDenied = () => {
    setShowLocationPermission(false);
    const user = JSON.parse(localStorage.getItem("user"));
    navigate(user?.role === "SHOP" ? "/partner" : "/student");
  };

  const handlePasskeyLogin = async () => {
    if (!passkeySupported) {
      showError("Passkeys are not supported on this device");
      return;
    }

    setPasskeyLoading(true);
    try {
      await passkeyService.login();
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

  const resetToInput = () => {
    setStep("input");
    setOtp("");
    setOtpSent(false);
    phoneAuthService.clearPhoneAuth?.();
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "otp" ? "password" : "otp");
    setStep("input");
    setOtp("");
    setPassword("");
  };

  const switchUserType = () => {
    setIsPartner(!isPartner);
    setIdentifier("");
    setPassword("");
    setCollege("");
    setOtp("");
    setStep("input");
    setOtpSent(false);
  };

  return (
    <>
      {showLocationPermission && (
        <LocationPermission
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />
      )}
      
      {/* Hidden reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-100">
        <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
          {/* Left Panel - Branding */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-purple-700 to-indigo-600 text-white p-6 md:p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
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
                {isPartner ? "Partner Access" : "Student Access"}
              </h1>

              <ul className="space-y-2 md:space-y-3 text-purple-100 mb-4 md:mb-6 text-sm md:text-base">
                {isPartner ? (
                  <>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Manage student print requests</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Track orders and payments</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Streamline your printing business</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Grow with Quick Print network</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Upload and order prints online</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Skip queues, save time</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Collect prints hassle-free</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Student-friendly pricing</li>
                  </>
                )}
              </ul>

              <button
                onClick={switchUserType}
                className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 transition py-2 px-4 rounded-lg"
              >
                {isPartner ? "Are you a student? Login here" : "Are you a partner? Login here"}
              </button>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {isPartner ? "Partner Login" : "Student Login"}
            </h2>
            <p className="text-gray-500 mb-6 text-sm md:text-base">
              {step === "otp" 
                ? `Enter the OTP sent to ${identifier}` 
                : authMode === "otp" 
                  ? "Login with phone or email OTP" 
                  : "Login with email and password"}
            </p>

            {/* OTP Step */}
            {step === "otp" ? (
              <form onSubmit={handleVerifyOTP} className="space-y-4 md:space-y-6">
                <button
                  type="button"
                  onClick={resetToInput}
                  className="flex items-center text-purple-600 hover:text-purple-700 text-sm mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change {inputType === 'phone' ? 'phone number' : 'email'}
                </button>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.5em] text-2xl py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading}
                      className="text-purple-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </button>
              </form>
            ) : authMode === "otp" ? (
              /* OTP Input Step */
              <div className="space-y-4 md:space-y-6">
                {/* College selector for students */}
                {!isPartner && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Select College
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none text-sm md:text-base"
                      >
                        <option value="">Select your college</option>
                        {COLLEGES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Combined Phone/Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number or Email
                  </label>
                  <div className="relative">
                    {inputType === 'phone' ? (
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    ) : (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    )}
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                      placeholder="Enter phone number or email"
                    />
                  </div>
                  {inputType && (
                    <p className="text-xs text-gray-500 mt-1">
                      {inputType === 'phone' 
                        ? '📱 We\'ll send an SMS OTP to this number' 
                        : '✉️ We\'ll send an OTP to this email'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={otpLoading || !identifier || (!isPartner && !college)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Alternative login methods */}
                <div className="space-y-3">
                  {/* Passkey login */}
                  {passkeySupported && (
                    <button
                      onClick={handlePasskeyLogin}
                      disabled={passkeyLoading}
                      className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center text-gray-700"
                    >
                      {passkeyLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Fingerprint className="h-5 w-5 mr-2" />
                          Login with Passkey
                        </>
                      )}
                    </button>
                  )}

                  {/* Password login toggle */}
                  <button
                    onClick={toggleAuthMode}
                    className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center text-gray-700"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Login with Password
                  </button>
                </div>
              </div>
            ) : (
              /* Password Login Form */
              <form onSubmit={handlePasswordLogin} className="space-y-4 md:space-y-6">
                {!isPartner && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Select College
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none text-sm md:text-base"
                        required
                      >
                        <option value="">Select your college</option>
                        {COLLEGES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
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
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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

                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="w-full text-center text-purple-600 hover:underline text-sm"
                >
                  Login with OTP instead
                </button>
              </form>
            )}

            {/* Sign up link */}
            <p className="text-center mt-6 text-gray-600 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-purple-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
