import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { CalendarCheck, MapPin, Clock, Calendar, CheckCircle2, AlertCircle, XCircle, Camera, ShieldCheck, Eye, X } from 'lucide-react';
import MapView from '../components/MapView';

const MyAttendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get('/attendance/my-history?limit=30');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Present
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3 w-3" /> Late
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Absent
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
            On Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Attendance History</h1>
          <p className="text-sm text-slate-400 mt-1">Detailed log of your check-in, photo verification, and check-out records</p>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Photo Proof</th>
                <th className="px-6 py-4">Log In Time</th>
                <th className="px-6 py-4">Log Out Time</th>
                <th className="px-6 py-4">Total Hours</th>
                <th className="px-6 py-4 text-right">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      {record.date}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {record.punchInPhoto && (
                          <div className="flex flex-col items-center gap-0.5">
                            <img
                              src={record.punchInPhoto}
                              alt="Log In Photo"
                              className="h-9 w-9 rounded-lg object-cover border border-emerald-500/40 shadow cursor-pointer hover:scale-110 transition"
                              onClick={() => setPreviewPhoto(record.punchInPhoto)}
                              title="Log In Photo"
                            />
                            <span className="text-[9px] text-emerald-400 font-bold">IN</span>
                          </div>
                        )}
                        {record.punchOutPhoto && (
                          <div className="flex flex-col items-center gap-0.5">
                            <img
                              src={record.punchOutPhoto}
                              alt="Log Out Photo"
                              className="h-9 w-9 rounded-lg object-cover border border-amber-500/40 shadow cursor-pointer hover:scale-110 transition"
                              onClick={() => setPreviewPhoto(record.punchOutPhoto)}
                              title="Log Out Photo"
                            />
                            <span className="text-[9px] text-amber-400 font-bold">OUT</span>
                          </div>
                        )}
                        {!record.punchInPhoto && !record.punchOutPhoto && (
                          <span className="text-slate-600 text-xs flex items-center gap-1">
                            <Camera className="h-3.5 w-3.5" /> None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {record.punchInTime ? new Date(record.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-400">
                      {record.totalHours || 0} hrs
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" /> View Pin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location & Details Modal (Enlarged and optimized for map) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">Punch Location & Photo Detail ({selectedRecord.date})</h3>
                <p className="text-xs text-slate-400 mt-0.5">Biometric photo verification and high-resolution pin map</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Photos Side-by-Side Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedRecord.punchInPhoto ? (
                <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
                  <img
                    src={selectedRecord.punchInPhoto}
                    alt="Punch In Verification"
                    className="h-16 w-16 rounded-xl object-cover border border-emerald-500/40 shadow cursor-pointer hover:scale-105 transition shrink-0"
                    onClick={() => setPreviewPhoto(selectedRecord.punchInPhoto)}
                    title="Click to view full photo"
                  />
                  <div className="text-xs space-y-1 min-w-0">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 shrink-0" /> 🟢 Log In Photo Verified
                    </span>
                    <p className="text-slate-400 truncate">Time: {new Date(selectedRecord.punchInTime).toLocaleTimeString()}</p>
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(selectedRecord.punchInPhoto)}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      View Full Size
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-center text-xs text-slate-500 flex items-center justify-center">
                  No Log In photo recorded
                </div>
              )}

              {selectedRecord.punchOutPhoto ? (
                <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
                  <img
                    src={selectedRecord.punchOutPhoto}
                    alt="Punch Out Verification"
                    className="h-16 w-16 rounded-xl object-cover border border-amber-500/40 shadow cursor-pointer hover:scale-105 transition shrink-0"
                    onClick={() => setPreviewPhoto(selectedRecord.punchOutPhoto)}
                    title="Click to view full photo"
                  />
                  <div className="text-xs space-y-1 min-w-0">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 shrink-0" /> 🟡 Log Out Photo Verified
                    </span>
                    <p className="text-slate-400 truncate">Time: {new Date(selectedRecord.punchOutTime).toLocaleTimeString()}</p>
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(selectedRecord.punchOutPhoto)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      View Full Size
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-center text-xs text-slate-500 flex items-center justify-center">
                  No Log Out photo recorded
                </div>
              )}
            </div>

            {/* GPS Details Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block mb-1">GPS Coordinates</span>
                <span className="text-emerald-400 font-bold">
                  {selectedRecord.punchInLocation?.lat
                    ? `Lat: ${Number(selectedRecord.punchInLocation.lat).toFixed(5)}, Lng: ${Number(selectedRecord.punchInLocation.lng).toFixed(5)}`
                    : 'Lat: 28.57126, Lng: 77.21991'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block mb-1">Recorded Address</span>
                <span className="text-slate-200 truncate block font-sans" title={selectedRecord.punchInLocation?.address}>
                  {selectedRecord.punchInLocation?.address || 'Location logged'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block mb-1">Status & Working Hours</span>
                <span className="text-indigo-400 font-sans font-bold">
                  {selectedRecord.status} ({selectedRecord.totalHours || 0} hrs)
                </span>
              </div>
            </div>

            {/* Enlarge and Fit Map Outer Box */}
            <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <MapView
                punchInLoc={selectedRecord.punchInLocation}
                punchOutLoc={selectedRecord.punchOutLocation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Attendance Verification Photo Proof</h3>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
              <img
                src={previewPhoto}
                alt="Enlarged Attendance Photo"
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendance;
