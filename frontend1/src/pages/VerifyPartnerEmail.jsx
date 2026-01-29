import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Printer, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { showError, showSuccess } from "../utils/errorHandler.js";

const VerifyPartnerEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      setStatus("loading");
      
      const result = await login({
        type: "partner",
        step: "verify-email",
        token: token,
      });

      if (result.success) {
        setStatus("success");
        setMessage("Email verified! Your partner account is now active.");
        showSuccess("Registration complete! Redirecting to dashboard...");
        
        // Redirect to partner dashboard after 2 seconds
        setTimeout(() => {
          navigate("/partner");
        }, 2500);
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setStatus("error");
      setMessage(error.message || "Verification failed. The link may have expired.");
      showError(error.message || "Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Printer className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Quick Print</span>
        </div>

        {status === "loading" && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to your partner dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                to="/signup"
                className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Try Registering Again
              </Link>
              <Link
                to="/login"
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyPartnerEmail;
