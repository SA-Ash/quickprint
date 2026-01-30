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
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import AddressAutoFill from "../Components/AddressAutoFill";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import COLLEGES from "../constants/colleges.js";
import emailAuthService from "../services/email-auth.service.js";

const Signup = () => {
  const [isPartner, setIsPartner] = useState(false);
  
  // Signup step: 'form' | 'otp' | 'success'
  const [step, setStep] = useState('form');
  
  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP verification
  const [otp, setOtp] = useState("");
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Student specific
  const [college, setCollege] = useState("");
  
  // Partner specific
  const [shopName, setShopName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [shopLocation, setShopLocation] = useState({ lat: 0, lng: 0 });

  const [signupSuccess, setSignupSuccess] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Validate form before sending OTP
  const validateForm = () => {
    if (!name.trim()) {
      showError("Please enter your name");
      return false;
    }
    
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address");
      return false;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return false;
    }

    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return false;
    }

    if (!isPartner && !college) {
      showError("Please select your college");
      return false;
    }

    if (isPartner) {
      if (!shopName.trim()) {
        showError("Please enter your shop name");
        return false;
      }
      if (!street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        showError("Please fill in the complete address");
        return false;
      }
    }

    return true;
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

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

  // Step 2: Verify OTP and create account
  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      // Verify email OTP first
      await emailAuthService.verifyOTP(email, otp);

      // Create account
      if (!isPartner) {
        // Student signup
        await login({
          type: "email_password",
          step: "signup",
          email: email,
          password: password,
          name: name,
          phone: phone ? `+91${phone}` : undefined,
          emailVerified: true,
          college: college,
        });

        showSuccess("Student account created successfully!");
      } else {
        // Partner signup
        await login({
          type: "partner",
          step: "register",
          email: email,
          password: password,
          name: name,
          phone: phone ? `+91${phone}` : undefined,
          emailVerified: true,
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
      }

      setStep('success');
      setSignupSuccess(true);
      setTimeout(() => {
        navigate(isPartner ? "/partner" : "/student");
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      showError(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

  const handleBackToForm = () => {
    setStep('form');
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100">
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1 max-h-[90vh] overflow-y-auto">
          
          {/* Back Button */}
          {step === 'otp' && (
            <button
              type="button"
              onClick={handleBackToForm}
              className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          )}

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {step === 'otp' 
              ? "Verify Your Email" 
              : step === 'success'
                ? "Account Created!"
                : isPartner ? "Partner Signup" : "Student Signup"}
          </h2>
          
          <p className="text-gray-600 text-sm md:text-base mb-6">
            {step === 'otp'
              ? `Enter the 6-digit code sent to ${email}`
              : step === 'success'
                ? "Redirecting you to your dashboard..."
                : isPartner
                  ? "Create your partner account to start managing print requests"
                  : "Create your account to start ordering prints"}
          </p>

          {/* ===== SUCCESS STATE ===== */}
          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600">
                {isPartner ? "Your partner account is ready!" : "Your student account is ready!"}
              </p>
            </div>
          )}

          {/* ===== STEP 1: FORM ===== */}
          {step === 'form' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
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
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">✉️ You'll receive a verification code here</p>
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              {/* College (Students only) */}
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

              {/* Partner Fields */}
              {isPartner && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter your shop name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Street Address"
                      required
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="City"
                      required
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="State"
                      required
                    />
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Pincode"
                      required
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
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
                      placeholder="Min 8 characters"
                      required
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
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
                    Continue with Email Verification
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 2: EMAIL OTP ===== */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyAndSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Enter Verification Code
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Verify & Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Already have account */}
          {step !== 'success' && (
            <p className="text-center mt-6 text-gray-600 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline font-medium"
              >
                Login
              </button>
            </p>
          )}
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
              {isPartner ? "Become a Partner" : "Join as Student"}
            </h1>

            <ul className="space-y-3 text-blue-100 mb-6">
              {isPartner ? (
                <>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Receive print orders from students
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Grow your printing business
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Easy payment collection
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Dedicated partner dashboard
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Upload documents online
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Skip the queue
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Student-friendly pricing
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-white mr-2" />
                    Collect prints hassle-free
                  </li>
                </>
              )}
            </ul>

            <button
              onClick={() => {
                setIsPartner(!isPartner);
                setStep('form');
                setOtp("");
              }}
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 transition py-2 px-4 rounded-lg"
            >
              {isPartner
                ? "Are you a student? Register here"
                : "Are you a partner? Register here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
