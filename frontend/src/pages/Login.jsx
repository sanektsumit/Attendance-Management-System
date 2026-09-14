import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  // Tab state: 'password' or 'otp'
  const [activeTab, setActiveTab] = useState('password');

  // Password Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState('email'); // 'email' or 'otp'
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Standard Password Login handler
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Request 6-digit OTP via Nodemailer
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!otpEmail) {
      toast.error('Please enter your registered email address');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await axiosClient.post('/auth/send-otp', { email: otpEmail.trim() });
      if (res.data.success) {
        toast.success(res.data.message || '6-digit OTP sent to your email!');
        setOtpStep('otp');
        setCountdown(60); // 60s cooldown for resend
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send OTP. Please verify email.';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and Authenticate into Employee/Admin Dashboard
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await loginWithOtp(otpEmail.trim(), otpCode.trim());
      toast.success(res.message || `Welcome, ${res.user.name}!`);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP code';
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    if (activeTab === 'password') {
      setEmail(userEmail);
      setPassword(userPass);
      toast.success(`Filled credentials (${userEmail})`);
    } else {
      setOtpEmail(userEmail);
      toast.success(`Filled OTP email (${userEmail})`);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-950/90 border border-slate-800 p-2 shadow-xl shadow-indigo-500/20 mb-3 hover:scale-105 transition-transform">
            <img
              src="/image.png"
              alt="SANEKT Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">SANEKT Attendance</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your workforce portal</p>
        </div>

        {/* Tab Switcher: Password Login vs Login with OTP */}
        <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'password'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Password Login</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('otp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'otp'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Login as OTP</span>
          </button>
        </div>

        {/* Quick Fill Preset Buttons */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => fillCredentials('sanekt.sumit@gmail.com', 'SanektAdmin@2026')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 py-2 px-3 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:bg-slate-800 hover:text-white transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Fill Admin (sanekt.sumit@gmail.com)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PASSWORD LOGIN                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LOGIN AS OTP (Nodemailer 6-digit OTP Workflow)                    */}
        {/* ========================================================================= */}
        {activeTab === 'otp' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {otpStep === 'email' ? (
              /* Step 1: Input Email to Request OTP */
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                    Enter Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="employee@company.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    A 6-digit OTP will be sent directly to this email using Nodemailer.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Sending 6-Digit OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send 6-Digit OTP</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter 6-digit OTP sent to Email */
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <span className="text-emerald-400 font-bold block">OTP Sent to Email</span>
                    <span className="text-slate-300 truncate block font-mono">{otpEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('email');
                      setOtpCode('');
                    }}
                    className="text-xs text-indigo-400 hover:underline shrink-0 ml-2"
                  >
                    Change Email
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 text-center">
                    Enter 6-Digit Verification OTP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full rounded-xl border-2 border-emerald-500/40 bg-slate-950 py-3 text-center text-2xl font-mono font-extrabold tracking-[0.5em] text-emerald-400 placeholder-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-slate-500">Valid for 10 mins</span>
                    {countdown > 0 ? (
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={sendingOtp}
                        className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Verifying OTP & Logging In...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Verify & Enter Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
