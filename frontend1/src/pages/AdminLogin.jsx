import React, { useState } from "react";
import {
  Mail,
  Key,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginSuccess(false);

    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl shadow-2xl bg-white overflow-hidden">
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 lg:p-12 flex flex-col justify-center relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5 animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-white/5"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-8 w-8" />
              <span className="text-2xl font-bold tracking-wider">
                QuickPrint ADMIN
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-4">SaaS Dashboard</h1>
            <p className="text-slate-300 mb-6">
              Access the central dashboard to manage and oversee all platform
              operations for your startup.
            </p>

            <ul className="space-y-3 text-slate-200">
              <li className="flex items-center gap-3">
                <Check size={18} className="text-cyan-400 flex-shrink-0" />{" "}
                Manage Users & Partners
              </li>
              <li className="flex items-center gap-3">
                <Check size={18} className="text-cyan-400 flex-shrink-0" /> View
                Platform Analytics
              </li>
              <li className="flex items-center gap-3">
                <Check size={18} className="text-cyan-400 flex-shrink-0" />{" "}
                Oversee All Orders
              </li>
              <li className="flex items-center gap-3">
                <Check size={18} className="text-cyan-400 flex-shrink-0" />{" "}
                System Configurations
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Administrator Login
            </h2>
            <p className="text-slate-600 mt-2">
              Please enter your credentials to proceed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                  placeholder="admin@quickprint.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-10 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-300 ${
                isLoading || loginSuccess
                  ? "bg-green-600 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-900 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />{" "}
                  Accessing...
                </>
              ) : loginSuccess ? (
                <>
                  <Check className="h-5 w-5 mr-2" /> Success!
                </>
              ) : (
                "Access Dashboard"
              )}
            </button>

            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-sm">
                Not an administrator?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-slate-600 font-semibold hover:text-slate-800 hover:underline"
                >
                  Return to User Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
