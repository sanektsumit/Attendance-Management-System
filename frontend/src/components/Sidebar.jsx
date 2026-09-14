import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  Users,
  FileSpreadsheet,
  MapPin,
  CheckSquare,
  Briefcase,
  User,
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const employeeLinks = [
    { name: 'Punch Dashboard', path: '/dashboard', icon: Clock },
    { name: 'My Attendance', path: '/my-attendance', icon: CalendarCheck },
    { name: 'Apply Leave', path: '/apply-leave', icon: Briefcase },
    { name: 'My Profile & Docs', path: '/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'HR Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Employee Directory', path: '/admin/employees', icon: Users },
    { name: 'Attendance Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Live Map View', path: '/admin/map-view', icon: MapPin },
    { name: 'Leave Approvals', path: '/admin/leaves', icon: CheckSquare },
    { name: 'My Profile & Docs', path: '/profile', icon: User },
  ];

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {isAdmin ? 'HR Administration' : 'Employee Portal'}
        </div>

        <nav className="space-y-1.5">
          {(isAdmin ? adminLinks : employeeLinks).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/dashboard' || item.path === '/profile'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Brand Footer */}
      <div className="pt-4 border-t border-slate-800/80 mt-6">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/60 p-2.5">
          <img
            src="/image.png"
            alt="SANEKT Logo"
            className="h-8 w-8 rounded-lg object-contain bg-slate-900 border border-slate-800/60 p-0.5"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white tracking-wide truncate">SANEKT</span>
            <span className="text-[10px] font-medium text-slate-400 truncate">Attendance & HR OS</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
