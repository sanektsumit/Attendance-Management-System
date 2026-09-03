import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Users,
  Search,
  Plus,
  UserPlus,
  Edit3,
  Shield,
  Clock,
  ExternalLink,
  Lock,
  CheckCircle2,
  Copy,
  Key,
  Trash2,
  Sliders,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Edit Shift Modal State
  const [editingEmp, setEditingEmp] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editShiftStart, setEditShiftStart] = useState('21:00');
  const [editShiftEnd, setEditShiftEnd] = useState('05:00');
  const [editLateThreshold, setEditLateThreshold] = useState(15);
  const [updatingShift, setUpdatingShift] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Form State for new employee
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Employee@123');
  const [empDept, setEmpDept] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [shiftStart, setShiftStart] = useState('21:00');
  const [shiftEnd, setShiftEnd] = useState('05:00');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await axiosClient.get(`/admin/employees?search=${search}&department=${department}`);
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department]);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteEmployee = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await axiosClient.delete(`/admin/employees/${deleteTarget.id}`);
      if (res.data.success) {
        toast.success(`Removed ${deleteTarget.name} successfully`);
        setDeleteTarget(null);
        fetchEmployees();
      }
    } catch (error) {
      toast.error('Failed to remove employee');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEditShiftModal = (emp) => {
    setEditingEmp(emp);
    setEditName(emp.name || '');
    setEditDept(emp.department || 'Engineering');
    setEditDesignation(emp.designation || 'Staff');
    setEditShiftStart(emp.shiftStart || '21:00');
    setEditShiftEnd(emp.shiftEnd || '05:00');
    setEditLateThreshold(emp.lateThresholdMinutes || 15);
  };

  const handleSaveShiftTiming = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    setUpdatingShift(true);
    try {
      const res = await axiosClient.put(`/admin/employees/${editingEmp._id}`, {
        name: editName,
        department: editDept,
        designation: editDesignation,
        shiftStart: editShiftStart,
        shiftEnd: editShiftEnd,
        lateThresholdMinutes: Number(editLateThreshold),
      });

      if (res.data.success) {
        toast.success(`Updated shift timings for ${editName} (${editShiftStart} to ${editShiftEnd})`);
        setEditingEmp(null);
        fetchEmployees();
      }
    } catch (error) {
      toast.error('Failed to update shift timings');
    } finally {
      setUpdatingShift(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please enter name, email and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosClient.post('/auth/register-employee', {
        name,
        email,
        password,
        department: empDept,
        designation,
        shiftStart,
        shiftEnd,
      });

      if (res.data.success) {
        toast.success('Employee account created successfully!');
        setCreatedCredentials({ name, email, password });
        setShowModal(false);
        setName('');
        setEmail('');
        setPassword('Employee@123');
        fetchEmployees();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create employee';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `SANIT Employee Portal Access Credentials:\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Login credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleViewEmployeeDashboard = async (emp) => {
    try {
      const res = await axiosClient.post('/auth/impersonate', { userId: emp._id });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success(`Connected live to ${res.data.user.name}'s Employee Portal`);
        navigate('/dashboard');
      }
    } catch (error) {
      setUser({
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: 'employee',
        department: emp.department,
        designation: emp.designation,
        shiftStart: emp.shiftStart,
        shiftEnd: emp.shiftEnd,
      });
      toast.success(`Connected to ${emp.name}'s Employee Portal`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Employee Directory & Shift Timing Controls</h1>
          <p className="text-sm text-slate-400 mt-1">Manage staff accounts, edit working shift hours (e.g. 21:00 to 05:00), and access portals</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Sales & Marketing">Sales & Marketing</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Working Shift</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No employees created yet. Click "Add Employee" to create an employee account with portal password.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{emp.department}</td>
                    <td className="px-6 py-4 text-slate-400">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-mono font-semibold text-indigo-300 border border-slate-800">
                        <Clock className="h-3 w-3 text-indigo-400" />
                        <span>{emp.shiftStart || '21:00'} - {emp.shiftEnd || '05:00'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditShiftModal(emp)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                        title="Edit Working Shift Timings"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Shift</span>
                      </button>

                      <button
                        onClick={() => handleViewEmployeeDashboard(emp)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                        title="View Live Employee Portal"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View Portal</span>
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: emp._id, name: emp.name })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                        title="Remove Employee Account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Shift Timing Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-400" />
                Edit Employee Working Shift
              </h3>
              <button onClick={() => setEditingEmp(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShiftTiming} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Employee Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Shift Hours & Grace Period
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Shift Start Time</label>
                    <input
                      type="time"
                      value={editShiftStart}
                      onChange={(e) => setEditShiftStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Shift End Time</label>
                    <input
                      type="time"
                      value={editShiftEnd}
                      onChange={(e) => setEditShiftEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Late Grace Period (Minutes)</label>
                  <input
                    type="number"
                    value={editLateThreshold}
                    onChange={(e) => setEditLateThreshold(e.target.value)}
                    min="0"
                    max="120"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Check-ins after {editShiftStart} + {editLateThreshold} mins will be automatically marked LATE.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updatingShift}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {updatingShift ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Working Shift Timings</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                Add New Employee Account
              </h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address (Login ID)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.sharma@company.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Portal Login Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set custom password (e.g. Employee@123)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 pl-9 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Shift End</label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Create Account & Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Created Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Employee Created!</h3>
                <p className="text-xs text-slate-400">Share these portal credentials with the employee</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5 font-mono text-sm">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-sans">
                <span>Employee Portal Credentials</span>
                <span className="text-emerald-400 font-semibold">Ready to Login</span>
              </div>
              <div className="border-t border-slate-800/80 pt-2">
                <span className="text-slate-400 text-xs font-sans block">Employee Name:</span>
                <span className="text-white font-semibold">{createdCredentials.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs font-sans block">Login Email ID:</span>
                <span className="text-indigo-400">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs font-sans block">Login Password:</span>
                <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800 inline-block mt-0.5">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
              >
                <Copy className="h-4 w-4" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Employee Removal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Employee Account"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}"? All associated attendance logs will be deleted. This action cannot be undone.`}
        confirmText="Remove Employee"
        onConfirm={confirmDeleteEmployee}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default EmployeeDirectory;
