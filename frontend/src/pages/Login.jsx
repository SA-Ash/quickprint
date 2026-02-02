import React, { useState, useEffect } from "react";
import {
  Phone,
  Building2,
  Eye,
  EyeOff,
  Check,
  Printer,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import COLLEGES from "../constants/colleges.js";
import emailAuthService from "../services/email-auth.service.js";
import phoneAuthService from "../services/phone-auth.service.js";


const Login = () => {
  const [isPartner, setIsPartner] = useState(false);
  
  // Input can be phone or email - auto-detect
  const [identifier, setIdentifier] = useState("");
  const [inputType, setInputType] = useState("unknown"); // "phone" | "email" | "unknown"
  
  // Login step: 'identifier' | 'otp' | 'password'
  const [step, setStep] = useState('identifier');
  
  // OTP/Password
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // College selection for students
  const [college, setCollege] = useState("");
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();
  const { login, replaceUser } = useAuth();

  // Auto-detect if input is phone or email
  useEffect(() => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setInputType("unknown");
      return;
    }
    
    // Check if it looks like a phone number (all digits, 10 digits for India)
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && /^\d+$/.test(trimmed)) {
      setInputType("phone");
    } else if (trimmed.includes('@')) {
      setInputType("email");
    } else {
      setInputType("unknown");
    }
  }, [identifier]);

  // Handle sending OTP (phone or email based on input type)
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (inputType === "unknown") {
      showError("Please enter a valid phone number or email address");
      return;
    }

    setOtpLoading(true);
    try {
      if (inputType === "phone") {
        // Send phone OTP via Firebase
        const formattedPhone = identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`;
        await phoneAuthService.sendPhoneOTP(formattedPhone);
        setStep('otp');
        showSuccess(`OTP sent to ${formattedPhone}`);
      } else {
        // Send email OTP via SendGrid
        await emailAuthService.sendOTP(identifier);
        setStep('otp');
        showSuccess(`Verification code sent to ${identifier}`);
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      showError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showError("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      if (inputType === "phone") {
        // Verify phone OTP with Firebase and login
        const result = await phoneAuthService.loginWithPhone(otp, college, isPartner);
        if (result?.user && result?.accessToken) {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', result.accessToken);
          localStorage.setItem('refreshToken', result.refreshToken);
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // Update React context so navbar shows correct user immediately
          replaceUser(result.user);
          
          showSuccess("Login successful!");
          navigate(isPartner ? "/partner" : "/student");
        }
      } else {
        // Verify email OTP - pass isPartner for role validation
        const result = await emailAuthService.verifyOTP(identifier, otp, isPartner);
        if (result?.user) {
          showSuccess("Login successful!");
          navigate(isPartner ? "/partner" : "/student");
        }
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      // If user doesn't exist, might need password
      if (error.message?.includes("not found") || error.message?.includes("password")) {
        setStep('password');
        showError("Please enter your password");
      } else {
        showError(error.message || "Invalid OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!password) {
      showError("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      if (inputType === "phone") {
        await login({
          type: "phone_password",
          step: "login",
          phone: identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`,
          password: password,
        });
      } else {
        await login({
          type: "email_password",
          step: "login",
          email: identifier,
          password: password,
        });
      }
      
      showSuccess("Login successful!");
      navigate(isPartner ? "/partner" : "/student");
    } catch (error) {
      console.error("Password login error:", error);
      showError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      if (inputType === "phone") {
        const formattedPhone = identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`;
        await phoneAuthService.sendPhoneOTP(formattedPhone);
        showSuccess("New OTP sent!");
      } else {
        await emailAuthService.sendOTP(identifier);
        showSuccess("New verification code sent!");
      }
    } catch (error) {
      showError(error.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackToIdentifier = () => {
    setStep('identifier');
    setOtp("");
    setPassword("");
    phoneAuthService.clearPhoneAuth?.();
  };

  return (
    <>
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100">
        <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-full md:w-1/2 bg-white p-6 md:p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1 max-h-[90vh] overflow-y-auto">
            
            {/* Back Button */}
            {step !== 'identifier' && (
              <button
                type="button"
                onClick={handleBackToIdentifier}
                className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
              >
                ← Back
              </button>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {step === 'otp' 
                ? "Verify OTP" 
                : step === 'password'
                  ? "Enter Password"
                  : isPartner ? "Partner Login" : "Student Login"}
            </h2>
            
            <p className="text-gray-600 text-sm md:text-base mb-6">
              {step === 'otp'
                ? `Enter the 6-digit code sent to ${identifier}`
                : step === 'password'
                  ? "Enter your password to continue"
                  : "Enter your phone number or email to login"}
            </p>

            {/* ===== STEP 1: IDENTIFIER ===== */}
            {step === 'identifier' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Phone/Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone or Email
                  </label>
                  <div className="relative">
                    {inputType === "phone" ? (
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    ) : inputType === "email" ? (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    ) : (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    )}
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Phone number or email address"
                      required
                    />
                  </div>
                  {inputType !== "unknown" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {inputType === "phone" ? "📱 We'll send an OTP to this number" : "✉️ We'll send a code to this email"}
                    </p>
                  )}
                </div>

                {/* College (for students with phone) */}
                {!isPartner && inputType === "phone" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Select College
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
                      >
                        <option value="">Select your college</option>
                        {COLLEGES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpLoading || inputType === "unknown"}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Continue with OTP"
                  )}
                </button>

                {/* Password Login - only for email users */}
                {inputType === "email" && (
                  <button
                    type="button"
                    onClick={() => setStep('password')}
                    disabled={isLoading || !identifier}
                    className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Login with Password
                  </button>
                )}
              </form>
            )}

            {/* ===== STEP 2: OTP ===== */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.5em] text-2xl py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={otpLoading}
                      className="text-blue-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Verify & Login
                    </>
                  )}
                </button>

                {/* Option to use password instead */}
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  Use password instead
                </button>
              </form>
            )}

            {/* ===== STEP 3: PASSWORD ===== */}
            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter your password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>

                {/* Back to OTP option */}
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  Use OTP instead
                </button>
              </form>
            )}

            {/* Sign up link */}
            <p className="text-center mt-6 text-gray-600 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Right Panel - Branding */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-6 md:p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden order-1 md:order-2">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white bg-opacity-10"></div>
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white bg-opacity-10"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <Printer className="h-8 w-8 mr-2" />
                <span className="text-2xl font-bold">Quick Print</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome Back!
              </h1>

              <ul className="space-y-3 text-blue-100 mb-6">
                {isPartner ? (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Manage incoming print orders
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Track your earnings
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Update your shop status
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Quick document printing
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Track your orders
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Student-friendly prices
                    </li>
                  </>
                )}
              </ul>

              <button
                onClick={() => setIsPartner(!isPartner)}
                className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 transition py-2 px-4 rounded-lg"
              >
                {isPartner
                  ? "Are you a student? Login here"
                  : "Are you a partner? Login here"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
