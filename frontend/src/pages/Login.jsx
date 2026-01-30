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
  Fingerprint,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import COLLEGES from "../constants/colleges.js";
import { passkeyService } from "../services/passkey.service.js";
import emailAuthService from "../services/email-auth.service.js";

const Login = () => {
  const [isPartner, setIsPartner] = useState(false);
  
  // Login step: 'input' | 'otp' | 'password'
  const [step, setStep] = useState('input');
  
  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);

  // Student specific
  const [college, setCollege] = useState("");
  
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Check if passkey is available
  useEffect(() => {
    const checkPasskey = async () => {
      const available = passkeyService.isSupported();
      setPasskeyAvailable(available);
    };
    checkPasskey();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'PARTNER') {
        navigate("/partner");
      } else {
        navigate("/student");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    setOtpLoading(true);
    try {
      await emailAuthService.sendOTP(email);
      setStep('otp');
      showSuccess(`Verification code sent to ${email}`);
    } catch (error) {
      console.error("Send OTP error:", error);
      showError(error.message || "Failed to send verification code");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle verify OTP and login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailAuthService.verifyOTP(email, otp);
      
      if (result?.user) {
        showSuccess("Login successful!");
        if (result.user.role === 'PARTNER') {
          navigate("/partner");
        } else {
          navigate("/student");
        }
      } else {
        // User verified but not found - prompt to signup
        showError("No account found with this email. Please sign up first.");
        navigate("/signup");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      showError(error.message || "Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password login (fallback)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login({
        type: isPartner ? "partner" : "email_password",
        step: "login",
        email: email,
        password: password,
        college: !isPartner ? college : undefined,
      });

      showSuccess("Login successful!");
      navigate(isPartner ? "/partner" : "/student");
    } catch (error) {
      console.error("Password login error:", error);
      showError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle passkey login
  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      const result = await passkeyService.authenticate();
      if (result.success) {
        showSuccess("Logged in with passkey!");
        if (result.user?.role === 'PARTNER') {
          navigate("/partner");
        } else {
          navigate("/student");
        }
      }
    } catch (error) {
      console.error("Passkey login error:", error);
      showError(error.message || "Passkey login failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const resetToInput = () => {
    setStep('input');
    setOtp("");
    setPassword("");
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      await emailAuthService.sendOTP(email);
      showSuccess("New verification code sent!");
    } catch (error) {
      showError(error.message || "Failed to resend code");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100">
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1">
          
          {/* Back Button */}
          {step !== 'input' && (
            <button
              type="button"
              onClick={resetToInput}
              className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          )}

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {step === 'otp' 
              ? "Enter Verification Code" 
              : step === 'password'
                ? "Enter Password"
                : isPartner ? "Partner Login" : "Student Login"}
          </h2>
          
          <p className="text-gray-600 text-sm md:text-base mb-6">
            {step === 'otp'
              ? `We sent a code to ${email}`
              : step === 'password'
                ? "Enter your password to continue"
                : "Sign in to continue to Quick Print"}
          </p>

          {/* ===== STEP 1: EMAIL INPUT ===== */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="your.email@example.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
              </div>

              {/* College Selection (Students only) */}
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

              {/* Send OTP Button */}
              <button
                onClick={handleSendOTP}
                disabled={otpLoading || !email}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Continue with Email OTP
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-gray-500 text-sm">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Password Login */}
              <button
                onClick={() => setStep('password')}
                className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
              >
                <Lock className="h-5 w-5 mr-2" />
                Login with Password
              </button>

              {/* Passkey Login */}
              {passkeyAvailable && (
                <button
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                >
                  {passkeyLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Fingerprint className="h-5 w-5 mr-2" />
                  )}
                  Login with Passkey
                </button>
              )}
            </div>
          )}

          {/* ===== STEP 2: OTP VERIFICATION ===== */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Enter 6-digit Code
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
                    Resend Code
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
            </form>
          )}

          {/* ===== STEP 3: PASSWORD ===== */}
          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="your.email@example.com"
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
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Login
                  </>
                )}
              </button>
            </form>
          )}

          {/* Don't have account */}
          <p className="text-center mt-6 text-gray-600 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up
            </button>
          </p>

          {/* Toggle Partner/Student */}
          <p className="text-center mt-2 text-gray-600 text-sm">
            <button
              onClick={() => setIsPartner(!isPartner)}
              className="text-blue-600 hover:underline"
            >
              {isPartner ? "Login as Student instead" : "Login as Partner instead"}
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
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-2" />
                Fast & secure login with email OTP
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-2" />
                No password to remember
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-2" />
                Access your orders instantly
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-2" />
                Track prints in real-time
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
