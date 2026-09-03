import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import MapView from '../components/MapView';
import { Clock, MapPin, CheckCircle, AlertTriangle, Play, Square, Calendar, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: 28.57126, lng: 77.21991 });
  const [locationStatus, setLocationStatus] = useState('Location Ready');

  // 5-Second Countdown State
  const [countdown, setCountdown] = useState(null); // null, 5, 4, 3, 2, 1
  const [pendingAction, setPendingAction] = useState(null); // 'login' or 'logout'

  // Ticking digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick GPS lock with 1.5s timeout for instant readiness
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setLocationStatus(`Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        },
        (err) => {
          setUserCoords({ lat: 28.57126, lng: 77.21991 });
          setLocationStatus('Office Location Active');
        },
        { timeout: 1500, maximumAge: 300000, enableHighAccuracy: false }
      );
    } else {
      setLocationStatus('Office Location Active');
    }
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await axiosClient.get('/attendance/today');
      if (res.data.success) {
        setTodayData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch today status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // Execute actual API call after 5-second countdown timer completes
  const executeLoginAPI = async () => {
    try {
      const payload = userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : { lat: 28.57126, lng: 77.21991 };
      const res = await axiosClient.post('/attendance/punch-in', payload);
      if (res.data.success) {
        toast.success(`Logged In successfully! Status: ${res.data.attendance?.status || 'PRESENT'}`);
        setTodayData((prev) => ({
          ...prev,
          isPunchedIn: true,
          attendance: res.data.attendance,
        }));
        fetchTodayStatus();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to log in';
      toast.error(msg);
    } finally {
      setPendingAction(null);
      setCountdown(null);
    }
  };

  const executeLogoutAPI = async () => {
    try {
      const payload = userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : { lat: 28.57126, lng: 77.21991 };
      const res = await axiosClient.put('/attendance/punch-out', payload);
      if (res.data.success) {
        toast.success(`Logged Out successfully! Total Hours: ${res.data.attendance?.totalHours || 0} hrs`);
        setTodayData((prev) => ({
          ...prev,
          isPunchedOut: true,
          attendance: res.data.attendance,
        }));
        fetchTodayStatus();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to log out';
      toast.error(msg);
    } finally {
      setPendingAction(null);
      setCountdown(null);
    }
  };

  // Trigger 5-Second Countdown Handler
  const startLoginCountdown = () => {
    setPendingAction('login');
    setCountdown(5);
  };

  const startLogoutCountdown = () => {
    setPendingAction('logout');
    setCountdown(5);
  };

  // Handle countdown tick (5s -> 4s -> 3s -> 2s -> 1s -> API call)
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      if (pendingAction === 'login') {
        executeLoginAPI();
      } else if (pendingAction === 'logout') {
        executeLogoutAPI();
      }
    }
  }, [countdown, pendingAction]);

  const attendance = todayData?.attendance;
  const isPunchedIn = todayData?.isPunchedIn;
  const isPunchedOut = todayData?.isPunchedOut;

  return (
    <div className="space-y-6">
      {/* Top Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Good day, {user?.name}! 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Shift Timing: <span className="font-semibold text-slate-300">21:00 - 05:00 (9:00 PM - 5:00 AM)</span> ({user?.department || 'Staff Member'})
          </p>
        </div>

        {/* Live Digital Clock */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-right">
          <Clock className="h-6 w-6 text-indigo-400 animate-pulse" />
          <div>
            <div className="text-xl font-extrabold tracking-wider text-white font-mono">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Action Control Card */}
        <div className="md:col-span-1 rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attendance Controller</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span className="truncate max-w-[140px]">{locationStatus}</span>
              </span>
            </div>

            {/* Status Display Badge */}
            <div className="my-6 text-center">
              {isPunchedOut ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400">
                  <CheckCircle className="h-4 w-4" /> Shift Logged Out
                </div>
              ) : isPunchedIn ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Currently Logged In
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-400">
                  <AlertTriangle className="h-4 w-4" /> Ready to Log In
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons with 5-Second Countdown Timer */}
          <div className="space-y-3 mt-4">
            {!isPunchedIn && !isPunchedOut && (
              <button
                onClick={startLoginCountdown}
                disabled={countdown !== null}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-80"
              >
                {pendingAction === 'login' && countdown !== null ? (
                  <div className="flex items-center gap-2 text-emerald-100 font-extrabold animate-pulse">
                    <Timer className="h-5 w-5 animate-spin text-white" />
                    <span>Logging In in {countdown}s...</span>
                  </div>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" />
                    <span>LOG IN NOW</span>
                  </>
                )}
              </button>
            )}

            {isPunchedIn && !isPunchedOut && (
              <button
                onClick={startLogoutCountdown}
                disabled={countdown !== null}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-4 text-base font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-yellow-500 transition disabled:opacity-80"
              >
                {pendingAction === 'logout' && countdown !== null ? (
                  <div className="flex items-center gap-2 text-amber-100 font-extrabold animate-pulse">
                    <Timer className="h-5 w-5 animate-spin text-white" />
                    <span>Logging Out in {countdown}s...</span>
                  </div>
                ) : (
                  <>
                    <Square className="h-5 w-5 fill-current" />
                    <span>LOG OUT NOW</span>
                  </>
                )}
              </button>
            )}

            {isPunchedOut && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-400">
                You have completed your shift logged out for today. Have a great day!
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary & Details Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Today's Summary & Coordinates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-xs text-slate-400 block">Status</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">
                  {attendance?.status || 'N/A'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-xs text-slate-400 block">Log In Time</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {attendance?.punchInTime ? new Date(attendance.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-xs text-slate-400 block">Log Out Time</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {attendance?.punchOutTime ? new Date(attendance.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-xs text-slate-400 block">Total Hours</span>
                <span className="text-sm font-bold text-indigo-400 mt-1 block">
                  {attendance?.totalHours || 0} hrs
                </span>
              </div>
            </div>
          </div>

          {/* Location Address Preview */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">Logged Location Address:</span>
            <span className="text-slate-400">
              {attendance?.punchInLocation?.address || 'No location logged yet today.'}
            </span>
          </div>
        </div>
      </div>

      {/* Geolocation OpenStreetMap Section with 3 Colored Pins Legend */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Punch Location Pin Map</h2>
            <p className="text-xs text-slate-400">OpenStreetMap showing Logged In, Logged Out, and Exact Live Location pins</p>
          </div>

          {/* Pin Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span> Logged In (Green)
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block"></span> Logged Out (Yellow)
            </span>
            <span className="flex items-center gap-1 text-slate-100 font-semibold">
              <span className="h-3 w-3 rounded-full bg-slate-950 border border-white inline-block"></span> Exact Live (Black)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <MapView
            punchInLoc={attendance?.punchInLocation}
            punchOutLoc={attendance?.punchOutLocation}
            currentLoc={userCoords}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
