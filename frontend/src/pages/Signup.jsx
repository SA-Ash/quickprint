import React, { useState, useEffect } from "react";
import {
  Phone,
  Building2,
  Eye,
  EyeOff,
  Check,
  User,
  Mail,
  Lock,
  MapPin,
  Store,
  Loader2,
  ChevronRight,
  Printer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";
import COLLEGES from "../constants/colleges.js";
import phoneAuthService from "../services/phone-auth.service.js";
import emailAuthService from "../services/email-auth.service.js";

const Signup = () => {
  const [isPartner, setIsPartner] = useState(false);
  
  // Multi-step signup
  // 'form' -> 'phone_otp' -> 'email_otp' -> 'success'
  const [step, setStep] = useState('form');
  
  // Form fields - common
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Student fields
  const [college, setCollege] = useState("");
  
  // Partner fields
  const [shopName, setShopName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [shopLocation, setShopLocation] = useState({ lat: 0, lng: 0 });
  
  // OTP fields
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  
  // Verification states
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  // Location detection
  const [detectingLocation, setDetectingLocation] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Form validation
  const validateForm = () => {
    if (!name || name.length < 2) {
      showError("Please enter your full name");
      return false;
    }
    
    if (!phone || phone.length !== 10) {
      showError("Please enter a valid 10-digit phone number");
      return false;
    }
    
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address");
      return false;
    }
    
    if (!password || password.length < 6) {
      showError("Password must be at least 6 characters");
      return false;
    }
    
    if (!isPartner && !college) {
      showError("Please select your college");
      return false;
    }
    
    if (isPartner) {
      if (!shopName) {
        showError("Please enter your shop name");
        return false;
      }
      if (!street || !city || !state || !pincode) {
        showError("Please fill in your complete address");
        return false;
      }
    }
    
    return true;
  };

  // Handle detecting user location for partners
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser");
      return;
    }
    
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setShopLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setDetectingLocation(false);
        showSuccess("Location detected!");
      },
      (error) => {
        setDetectingLocation(false);
        showError("Could not detect location. Please try again.");
      }
    );
  };

  // Step 1: Validate form and send phone OTP
  const handleSendPhoneOTP = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setPhoneOtpLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      await phoneAuthService.sendPhoneOTP(formattedPhone);
      setStep('phone_otp');
      showSuccess(`OTP sent to ${formattedPhone}`);
    } catch (error) {
      console.error("Send phone OTP error:", error);
      showError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Step 2: Verify phone OTP and send email OTP
  const handleVerifyPhoneOTP = async (e) => {
    e.preventDefault();
    
    if (!phoneOtp || phoneOtp.length !== 6) {
      showError("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      // Verify phone OTP with Firebase
      await phoneAuthService.verifyPhoneOTP(phoneOtp);
      setPhoneVerified(true);
      
      showSuccess("Phone verified! Now let's verify your email.");
      
      // Automatically send email OTP
      await emailAuthService.sendOTP(email);
      setStep('email_otp');
      showSuccess(`Verification code sent to ${email}`);
    } catch (error) {
      console.error("Verify phone OTP error:", error);
      showError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify email OTP and complete signup
  const handleVerifyEmailAndSignup = async (e) => {
    e.preventDefault();
    
    if (!emailOtp || emailOtp.length !== 6) {
      showError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      // First verify the email OTP
      const verifyResult = await emailAuthService.verifyOTP(email, emailOtp);
      
      if (!verifyResult?.success && !verifyResult?.user) {
        // If verifyOTP returns just success, we need to signup separately
      }

      // Now create the account with both verifications complete
      if (!isPartner) {
        // Student signup
        await login({
          type: "email_password",
          step: "signup",
          email: email,
          password: password,
          name: name,
          phone: `+91${phone}`,
          phoneVerified: true,
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
          phone: `+91${phone}`,
          phoneVerified: true,
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

  // Resend OTPs
  const handleResendPhoneOTP = async () => {
    setPhoneOtpLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      phoneAuthService.clearPhoneAuth?.();
      await phoneAuthService.sendPhoneOTP(formattedPhone);
      showSuccess("New OTP sent to your phone!");
    } catch (error) {
      showError(error.message || "Failed to resend OTP");
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleResendEmailOTP = async () => {
    setIsLoading(true);
    try {
      await emailAuthService.sendOTP(email);
      showSuccess("New verification code sent to your email!");
    } catch (error) {
      showError(error.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  // Back navigation
  const handleBackToForm = () => {
    setStep('form');
    setPhoneOtp("");
    setEmailOtp("");
    setPhoneVerified(false);
    phoneAuthService.clearPhoneAuth?.();
  };

  const handleBackToPhoneOTP = () => {
    setStep('phone_otp');
    setEmailOtp("");
  };

  // Progress indicator
  const getProgress = () => {
    switch (step) {
      case 'form': return 25;
      case 'phone_otp': return 50;
      case 'email_otp': return 75;
      case 'success': return 100;
      default: return 0;
    }
  };

  return (
    <>
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100">
        <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-xl bg-white overflow-hidden">
          
          {/* Left Panel - Form */}
          <div className="w-full md:w-1/2 bg-white p-6 md:p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1 max-h-[90vh] overflow-y-auto">
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className={step === 'form' ? 'text-blue-600 font-medium' : ''}>Details</span>
                <span className={step === 'phone_otp' ? 'text-blue-600 font-medium' : ''}>Phone</span>
                <span className={step === 'email_otp' ? 'text-blue-600 font-medium' : ''}>Email</span>
                <span className={step === 'success' ? 'text-green-600 font-medium' : ''}>Done</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>

            {/* Back Button */}
            {step !== 'form' && step !== 'success' && (
              <button
                type="button"
                onClick={step === 'phone_otp' ? handleBackToForm : handleBackToPhoneOTP}
                className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
              >
                ← Back
              </button>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {step === 'form' && (isPartner ? "Partner Registration" : "Student Signup")}
              {step === 'phone_otp' && "Verify Phone Number"}
              {step === 'email_otp' && "Verify Email Address"}
              {step === 'success' && "Account Created! 🎉"}
            </h2>
            
            <p className="text-gray-600 text-sm md:text-base mb-6">
              {step === 'form' && "Fill in your details to create an account"}
              {step === 'phone_otp' && `Enter the 6-digit OTP sent to +91${phone}`}
              {step === 'email_otp' && `Enter the verification code sent to ${email}`}
              {step === 'success' && "Redirecting you to your dashboard..."}
            </p>

            {/* ===== STEP 1: FORM ===== */}
            {step === 'form' && (
              <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                {/* Full Name */}
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

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="10-digit mobile number"
                      maxLength={10}
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
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
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
                      placeholder="Minimum 6 characters"
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

                {/* Student: College Selection */}
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

                {/* Partner: Shop Details */}
                {isPartner && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Shop Name
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Your shop name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Shop Address
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Street address"
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
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
                        </div>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Pincode"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="w-full py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center text-sm"
                    >
                      {detectingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2" />
                      )}
                      {shopLocation.lat !== 0 ? "Location Detected ✓" : "Detect Shop Location"}
                    </button>
                  </>
                )}

                <button
                  type="submit"
                  disabled={phoneOtpLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {phoneOtpLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===== STEP 2: PHONE OTP ===== */}
            {step === 'phone_otp' && (
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Enter Phone OTP
                  </label>
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.5em] text-2xl py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Didn't receive?{" "}
                    <button
                      type="button"
                      onClick={handleResendPhoneOTP}
                      disabled={phoneOtpLoading}
                      className="text-blue-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phoneOtp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Phone
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===== STEP 3: EMAIL OTP ===== */}
            {step === 'email_otp' && (
              <form onSubmit={handleVerifyEmailAndSignup} className="space-y-4">
                <div className="flex items-center text-green-600 text-sm mb-2">
                  <Check className="h-4 w-4 mr-1" />
                  Phone verified
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Enter Email Verification Code
                  </label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.5em] text-2xl py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Didn't receive?{" "}
                    <button
                      type="button"
                      onClick={handleResendEmailOTP}
                      disabled={isLoading}
                      className="text-blue-600 hover:underline"
                    >
                      Resend Code
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || emailOtp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Verify & Create Account
                      <Check className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===== STEP 4: SUCCESS ===== */}
            {step === 'success' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-gray-600">
                  Your {isPartner ? "partner" : "student"} account has been created successfully!
                </p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-blue-600" />
              </div>
            )}

            {/* Login link */}
            {step === 'form' && (
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
                {isPartner ? "Partner With Us" : "Join Quick Print"}
              </h1>

              <ul className="space-y-3 text-blue-100 mb-6">
                {isPartner ? (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Reach more students
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Digital order management
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Secure payments
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Real-time notifications
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Print documents instantly
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-white mr-2" />
                      Find nearby shops
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
                  ? "Are you a student? Sign up here"
                  : "Want to partner with us? Register here"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
