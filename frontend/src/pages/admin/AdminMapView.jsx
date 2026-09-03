import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import MapView from '../../components/MapView';
import {
  MapPin,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Compass,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMapView = () => {
  // Date State defaulting to Today's date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pins, setPins] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([28.57126, 77.21991]);
  const [activeEmpId, setActiveEmpId] = useState(null);

  const fetchMapPins = async (dateStr) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/map-data?date=${dateStr}`);
      if (res.data.success) {
        const rawList = res.data.pins || [];
        setRawRecords(rawList);

        // Process markers for OpenStreetMap component
        const processedMarkers = rawList
          .filter((p) => p.punchInLocation && p.punchInLocation.lat && p.punchInLocation.lng)
          .map((p) => {
            const empName = p.user ? p.user.name : 'Staff Member';
            const dept = p.user ? p.user.department : 'General';
            const inTimeStr = p.punchInTime
              ? new Date(p.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'N/A';

            return {
              id: p._id,
              lat: p.punchInLocation.lat,
              lng: p.punchInLocation.lng,
              isPunchIn: true,
              empName,
              dept,
              status: p.status,
              title: empName,
              subtitle: inTimeStr,
              address: p.punchInLocation.address || 'Location recorded',
            };
          });

        setPins(processedMarkers);

        // If markers exist, center map on first marker
        if (processedMarkers.length > 0) {
          setMapCenter([processedMarkers[0].lat, processedMarkers[0].lng]);
        } else {
          setMapCenter([28.57126, 77.21991]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      toast.error('Could not load map location data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapPins(selectedDate);
  }, [selectedDate]);

  // Quick Date Navigation Handlers
  const handleDateChange = (newDateStr) => {
    setSelectedDate(newDateStr);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleFocusEmployeePin = (record) => {
    if (record?.punchInLocation?.lat && record?.punchInLocation?.lng) {
      setMapCenter([record.punchInLocation.lat, record.punchInLocation.lng]);
      setActiveEmpId(record._id);
      toast.success(`Centered map on ${record.user?.name || 'Employee'}'s location`);
    } else {
      toast.error('No GPS coordinates recorded for this employee');
    }
  };

  // Format display date (e.g., "Monday, August 31, 2026")
  const formatDisplayDate = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="h-6 w-6 text-indigo-400" />
            Live Day-Wise Employee Login Map
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View employee check-in location pins day-by-day with full employee details on OpenStreetMap
          </p>
        </div>

        {/* Day Selector Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <button
            onClick={handlePrevDay}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={handleSetToday}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              isToday
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Today
          </button>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date Header & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg text-xs">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <div>
            <div className="font-semibold text-white text-sm">{formatDisplayDate(selectedDate)}</div>
            <div className="text-slate-400">Day-wise Attendance & Location Mapping</div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="text-slate-300">
              Logins Logged: <strong className="text-white text-sm">{pins.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-emerald-400 font-semibold">🟢 Green Pin = Employee Logged In</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Day-wise Employee Location List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): OpenStreetMap Component */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-[540px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl relative">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></span>
                  <span>Fetching day-wise location pins...</span>
                </div>
              </div>
            )}
            <MapView center={mapCenter} markers={pins} zoom={13} />
          </div>
        </div>

        {/* Right Column (1 Col): Employee Logins Day-Wise List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Navigation className="h-4 w-4 text-indigo-400" />
                Employee Login Locations
              </h2>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                {pins.length} Active
              </span>
            </div>

            {/* List of Employee Pins for Selected Day */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading locations...</div>
              ) : rawRecords.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
                  <div className="text-xs font-medium text-slate-400">No employee logins recorded</div>
                  <div className="text-[11px] text-slate-500">
                    No punch locations logged for {selectedDate}. Try selecting another date.
                  </div>
                </div>
              ) : (
                rawRecords.map((r) => {
                  const empName = r.user ? r.user.name : 'Employee';
                  const dept = r.user ? r.user.department : 'General';
                  const inTimeStr = r.punchInTime
                    ? new Date(r.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                  const addressStr = r.punchInLocation?.address || 'Location recorded';
                  const isSelected = activeEmpId === r._id;

                  return (
                    <div
                      key={r._id}
                      onClick={() => handleFocusEmployeePin(r)}
                      className={`group cursor-pointer rounded-xl border p-3.5 transition text-xs space-y-2 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Top Employee Info Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                            {empName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-indigo-300 transition">
                              {empName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-slate-500" /> {dept}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            r.status === 'LATE'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {r.status || 'PRESENT'}
                        </span>
                      </div>

                      {/* Check-In Time & Address */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1 text-indigo-400 font-medium">
                            <Clock className="h-3 w-3" /> Log In Time: {inTimeStr}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {r.punchInLocation?.lat ? 'GPS Active' : 'No GPS'}
                          </span>
                        </div>

                        <div className="text-slate-400 truncate flex items-center gap-1 text-[11px]">
                          <MapPin className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{addressStr}</span>
                        </div>
                      </div>

                      {/* Focus Map Action Link */}
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusEmployeePin(r);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <span>Focus on Map</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMapView;
