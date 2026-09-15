import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import NotificationDropdown from './NotificationDropdown';
import { LogOut, ShieldCheck, Clock, User, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Sidebar Toggle Button + Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition focus:outline-none"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/image.png"
            alt="SANEKT Logo"
            className="h-9 w-9 rounded-xl object-contain shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              SANEKT
            </span>
            <span className="ml-2 hidden sm:inline rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Notifications, User Bar, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Notification Bell with Dropdown & Complaint System */}
        <NotificationDropdown />

        {/* User Profile Pill */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 py-1.5 px-3 hover:border-slate-700 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" />
            ) : (
              <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
            )}
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
          title="Sign out of workplace"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
