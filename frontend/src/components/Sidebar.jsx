import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
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
  const { collapsed } = useSidebar();

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
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0 border-r border-slate-800/80 bg-slate-900/60 p-3.5 flex flex-col justify-between overflow-y-auto transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        <div
          className={`mb-4 px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-opacity duration-200 ${
            collapsed ? 'text-center opacity-0 h-0 overflow-hidden mb-2' : 'opacity-100'
          }`}
        >
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
                title={collapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl py-2.5 text-sm font-medium transition ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Brand Footer */}
      <div className="pt-3 border-t border-slate-800/80 mt-6">
        <div
          className={`flex items-center rounded-xl border border-slate-800/70 bg-slate-950/60 p-2 transition ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <img
            src="/image.png"
            alt="SANEKT Logo"
            className="h-8 w-8 rounded-lg object-contain bg-slate-900 border border-slate-800/60 p-0.5 shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white tracking-wide truncate">SANEKT</span>
              <span className="text-[10px] font-medium text-slate-400 truncate">Attendance & HR OS</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

