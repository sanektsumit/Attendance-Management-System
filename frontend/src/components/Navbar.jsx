import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldCheck, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-6 backdrop-blur-md">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">SANIT</span>
          <span className="ml-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            v1.0
          </span>
        </div>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4">

        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 py-1.5 px-3 hover:border-slate-700 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs">
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-white leading-tight">{user?.name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              {user?.role === 'admin' ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3" /> HR Admin
                </span>
              ) : (
                <span>{user?.department || 'Staff Member'}</span>
              )}
            </div>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
