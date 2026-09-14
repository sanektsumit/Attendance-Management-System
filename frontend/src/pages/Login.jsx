import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  RefreshCw,
  Send,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  // Tab selector: 'password' or 'otp'
  const [activeTab, setActiveTab] = useState('password');

  // Password Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
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
      const res = await login(email.trim(), password);
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

  // OTP Send / Submit handler
  const handleOtpAction = async (e) => {
    e.preventDefault();
    if (!otpEmail) {
      toast.error('Please enter your email address');
      return;
    }

    // Step 1: If OTP not sent yet -> Send OTP
    if (!otpSent) {
      setOtpLoading(true);
      try {
        const res = await axiosClient.post('/auth/send-otp', { email: otpEmail.trim() });
        if (res.data.success) {
          toast.success(res.data.message || '6-digit OTP sent to your email!');
          setOtpSent(true);
          setCountdown(60);
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Failed to send OTP. Please check email.';
        toast.error(msg);
      } finally {
        setOtpLoading(false);
      }
      return;
    }

    // Step 2: If OTP already sent -> Submit OTP and Login
    if (!otp || otp.trim().length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await loginWithOtp(otpEmail.trim(), otp.trim());
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
      setOtpLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!otpEmail || countdown > 0) return;
    setOtpLoading(true);
    try {
      const res = await axiosClient.post('/auth/send-otp', { email: otpEmail.trim() });
      if (res.data.success) {
        toast.success('New 6-digit OTP sent to your email!');
        setCountdown(60);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none"></div>

      {/* Main Login Card - Constant dimensions */}
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
          <p className="text-xs text-slate-400 mt-1">Sign in to access your workplace portal</p>
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
            <span>Login with OTP</span>
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white transition p-0.5 rounded-lg focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
        {/* TAB 2: LOGIN WITH OTP (Email -> Send OTP -> Enter OTP -> Submit)          */}
        {/* ========================================================================= */}
        {activeTab === 'otp' && (
          <form onSubmit={handleOtpAction} className="space-y-4 animate-in fade-in duration-200">
            {/* Field 1: Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Change Email
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="name@company.com"
                  readOnly={otpSent}
                  className={`w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    otpSent ? 'opacity-80 cursor-default border-emerald-500/30' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Field 2: Extra field shown ONLY when OTP is sent */}
            {otpSent && (
              <div className="animate-in fade-in duration-200 space-y-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-emerald-400 uppercase">Enter Your OTP</label>
                  {countdown > 0 ? (
                    <span className="text-[11px] text-slate-400 font-mono">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpLoading}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend OTP
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-emerald-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-emerald-500/40 bg-slate-950/90 py-2.5 pl-10 pr-4 text-base font-mono tracking-widest text-emerald-400 placeholder-slate-600 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 pt-0.5">
                  6-digit code sent via Nodemailer. Valid for 10 minutes.
                </p>
              </div>
            )}

            {/* Action Button: 'Send OTP' initially, changes to 'Submit' after sending */}
            <button
              type="submit"
              disabled={otpLoading || (otpSent && otp.length !== 6)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50 mt-2"
            >
              {otpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{otpSent ? 'Verifying & Submitting...' : 'Sending OTP...'}</span>
                </>
              ) : otpSent ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Submit</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send OTP</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
