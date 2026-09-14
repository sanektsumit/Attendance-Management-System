import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import MapView from '../components/MapView';
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Calendar,
  Timer,
  Camera,
  CameraOff,
  RefreshCw,
  ShieldCheck,
  Eye,
  CheckCircle2,
  X,
  Sparkles,
  RotateCcw,
  LogOut,
  LogIn,
  Loader2,
  UserCheck,
  Shield,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';

const format12Hour = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 28.57126, lng: 77.21991 });
  const [locationStatus, setLocationStatus] = useState('Resolving Live GPS...');

  // Biometric Camera Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' | 'logout' | 'recapture'
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Enlarged Photo Viewer Modal State
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  // Cover of the card toggle state for completed shift
  const [showCompletedCard, setShowCompletedCard] = useState(false);

  // Refs for Video & Canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Ticking digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Continuous GPS Tracking: Anywhere logging enabled
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setLocationStatus(`Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserCoords(coords);
              setLocationStatus(`Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
            },
            () => {
              setUserCoords({ lat: 28.57126, lng: 77.21991 });
              setLocationStatus('Live GPS (Enable Location in Browser)');
            },
            { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
          );
        },
        { timeout: 6000, maximumAge: 30000, enableHighAccuracy: true }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setLocationStatus(`Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        },
        null,
        { timeout: 15000, maximumAge: 10000, enableHighAccuracy: true }
      );

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setLocationStatus('GPS Ready');
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

  const attendance = todayData?.attendance;
  const isPunchedIn = todayData?.isPunchedIn;
  const isPunchedOut = todayData?.isPunchedOut;

  // Webcam Management: Automatically starts when modal opens
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera stream error:', err.message);
      setCameraError('Camera access required for photo verification. Please allow camera permissions in your browser.');
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Turn camera on when modal opens, shut down when modal closes
  useEffect(() => {
    if (showCameraModal) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCameraModal]);

  // Ensure video element receives stream once both are ready
  useEffect(() => {
    if (showCameraModal && cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [showCameraModal, cameraActive]);

  // Open Biometric Camera Verification Modal
  const openCameraModal = (mode) => {
    setModalMode(mode);
    setCapturedPhoto(null);
    setShowCameraModal(true);
  };

  // Close Modal and stop camera
  const closeCameraModal = () => {
    setShowCameraModal(false);
    setCapturedPhoto(null);
    setCameraError(null);
    stopCamera();
  };

  // Capture frame from webcam to canvas
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Webcam is still initializing. Please wait a moment...');
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(imageData);
    toast.success('📸 Photo captured successfully!');
    return imageData;
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  // Execute Punch-In / Log In
  const executeLoginAPI = async (photoToSubmit) => {
    const photo = photoToSubmit || capturedPhoto;
    if (!photo && cameraActive) {
      toast.error('📸 Photo verification required! Please capture your photo first.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        lat: userCoords ? userCoords.lat : 28.57126,
        lng: userCoords ? userCoords.lng : 77.21991,
        photo: photo || '',
      };
      const res = await axiosClient.post('/attendance/punch-in', payload);
      if (res.data.success) {
        toast.success(`🎉 Logged In successfully! Status: ${res.data.attendance?.status || 'PRESENT'}`);
        closeCameraModal();
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
      setSubmitting(false);
    }
  };

  // Execute Punch-Out / Log Out
  const executeLogoutAPI = async (photoToSubmit) => {
    const photo = photoToSubmit || capturedPhoto;
    if (!photo && cameraActive) {
      toast.error('📸 Photo verification required! Please capture your photo first.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        lat: userCoords ? userCoords.lat : 28.57126,
        lng: userCoords ? userCoords.lng : 77.21991,
        photo: photo || '',
      };
      const res = await axiosClient.put('/attendance/punch-out', payload);
      if (res.data.success) {
        toast.success(`👋 Logged Out successfully! Total Hours: ${res.data.attendance?.totalHours || 0} hrs`);
        closeCameraModal();
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
      setSubmitting(false);
    }
  };

  // Recapture and update image while already logged in
  const handleSaveRecapturedPhoto = async (photoToSubmit) => {
    const photo = photoToSubmit || capturedPhoto;
    if (!photo) {
      toast.error('📸 Please capture a photo before updating.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosClient.put('/attendance/update-photo', { photo });
      if (res.data.success) {
        toast.success('Attendance photo recaptured & updated successfully!');
        closeCameraModal();
        setTodayData((prev) => ({
          ...prev,
          attendance: res.data.attendance,
        }));
        fetchTodayStatus();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update photo';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Elapsed shift hours calculator
  const getElapsedShiftTime = () => {
    if (!attendance?.punchInTime) return '0 hrs 0 mins';
    const start = new Date(attendance.punchInTime);
    const end = attendance.punchOutTime ? new Date(attendance.punchOutTime) : currentTime;
    const diffMs = Math.max(0, end - start);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Hidden Canvas for Webcam Snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Good day, {user?.name}! 👋
          </h1>
          {/* Below the employee name: Mention ONLY the employee shift timing */}
          <p className="text-sm text-slate-300 mt-1">
            Shift Timing: <span className="font-semibold text-white">
              {user?.shiftStart || '09:00'} - {user?.shiftEnd || '18:00'} ({format12Hour(user?.shiftStart || '09:00')} - {format12Hour(user?.shiftEnd || '18:00')})
            </span>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Action Control Card */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          
          {/* STATE 1: ALREADY LOGGED OUT (Shift Completed) */}
          {isPunchedOut ? (
            !showCompletedCard ? (
              /* COVER OF THE CARD: 'Mark Your Attendance' */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mark Your Attendance</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                    <CheckCircle className="h-3.5 w-3.5" /> Shift Completed
                  </span>
                </div>

                {/* Cover Card Visual Banner */}
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 p-6 text-center space-y-3 shadow-inner">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow">
                    <ShieldCheck className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Mark Your Attendance</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Today's attendance has been safely recorded. Click the button below to view your shift summary and verification photos.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                    <span>Total Hours: {attendance?.totalHours || 0} hrs</span>
                  </div>
                </div>

                {/* Cover Trigger Button: 'Mark Your Attendance' */}
                <button
                  type="button"
                  onClick={() => setShowCompletedCard(true)}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] transition"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Mark Your Attendance</span>
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  Click to open your shift completed details and photo verification card.
                </p>
              </div>
            ) : (
              /* REVEALED CARD (Image 2): Shown when 'Mark Your Attendance' button is hit */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">SHIFT COMPLETED</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCompletedCard(false)}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700 bg-slate-800 transition"
                      title="Collapse to cover"
                    >
                      ↩ Back to Cover
                    </button>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                      <CheckCircle className="h-3.5 w-3.5" /> Logged Out
                    </span>
                  </div>
                </div>

                {/* Photos Grid: Check In and Check Out Proofs */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Check In Photo */}
                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner group">
                    {attendance?.punchInPhoto ? (
                      <div className="relative h-36 w-full">
                        <img
                          src={attendance.punchInPhoto}
                          alt="Log In Photo"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-2">
                          <span className="text-[10px] font-bold text-emerald-400">🟢 Log In Photo</span>
                          <button
                            type="button"
                            onClick={() => setEnlargedPhoto(attendance.punchInPhoto)}
                            className="mt-1 text-[10px] text-white hover:underline flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center text-xs text-slate-500 p-2 text-center">
                        No Log In photo
                      </div>
                    )}
                  </div>

                  {/* Check Out Photo */}
                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner group">
                    {attendance?.punchOutPhoto ? (
                      <div className="relative h-36 w-full">
                        <img
                          src={attendance.punchOutPhoto}
                          alt="Log Out Photo"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-2">
                          <span className="text-[10px] font-bold text-amber-400">🟡 Log Out Photo</span>
                          <button
                            type="button"
                            onClick={() => setEnlargedPhoto(attendance.punchOutPhoto)}
                            className="mt-1 text-[10px] text-white hover:underline flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center text-xs text-slate-500 p-2 text-center">
                        No Log Out photo
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-center space-y-1">
                  <p className="text-sm font-semibold text-white">Have a restful evening! 🌙</p>
                  <p className="text-xs text-slate-400">
                    Total Hours: <strong className="text-indigo-400">{attendance?.totalHours || 0} hrs</strong> safely recorded.
                  </p>
                </div>
              </div>
            )
          ) : isPunchedIn ? (
            /* STATE 2: CURRENTLY LOGGED IN (Cover Card with Log Out Trigger) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attendance Controller</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Currently Logged In
                </span>
              </div>

              {/* COVER CARD: Marked Attendance Verified Display */}
              <div className="relative rounded-2xl border border-emerald-500/30 bg-slate-950 overflow-hidden shadow-2xl group">
                {attendance?.punchInPhoto ? (
                  <div className="relative h-52 w-full">
                    <img
                      src={attendance.punchInPhoto}
                      alt="Verified Attendance Photo"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-between p-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                          <ShieldCheck className="h-4 w-4 text-white" /> Photo Verified Check-In
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* RECAPTURE BUTTON */}
                          <button
                            type="button"
                            onClick={() => openCameraModal('recapture')}
                            className="rounded-lg bg-indigo-600/90 hover:bg-indigo-500 px-2.5 py-1 text-white text-xs flex items-center gap-1 shadow backdrop-blur-sm transition"
                            title="Recapture and Update Photo"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Recapture</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEnlargedPhoto(attendance.punchInPhoto)}
                            className="rounded-lg bg-slate-900/80 p-1.5 text-white hover:bg-slate-800 text-xs flex items-center gap-1 shadow"
                            title="Click to Enlarge Photo"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-2.5 border border-slate-700/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-indigo-400" />
                            In: {attendance?.punchInTime ? new Date(attendance.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> Active: {getElapsedShiftTime()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center p-4 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                    <span className="text-sm font-bold text-white">Attendance Marked!</span>
                    <span className="text-xs text-slate-400">Check-in recorded in database</span>
                  </div>
                )}
              </div>

              {/* LOG OUT BUTTON: Automatically opens camera modal to capture and verify photo */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openCameraModal('logout')}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500 active:scale-[0.99] transition"
                >
                  <Camera className="h-4 w-4" />
                  <Square className="h-4 w-4 fill-current" />
                  <span>LOG OUT NOW</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Clicking will automatically turn camera on for photo-verified log out.
                </p>
              </div>
            </div>
          ) : (
            /* STATE 3: READY TO LOG IN - PROMINENT TRIGGER BUTTON */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mark Your Attendance</span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="truncate max-w-[150px]">{locationStatus}</span>
                </span>
              </div>

              {/* Card Preview Banner */}
              <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-slate-950 p-6 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                  <Shield className="h-7 w-7 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Biometric Face Verification</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Clicking the button below will automatically activate the webcam to capture and verify your attendance photo.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  <Radio className="h-3.5 w-3.5 animate-pulse" /> Anywhere Check-In Enabled
                </div>
              </div>

              {/* LOG IN TRIGGER BUTTON: Automatically turns on camera modal with live view */}
              <button
                type="button"
                onClick={() => openCameraModal('login')}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] transition"
              >
                <Camera className="h-5 w-5" />
                <Play className="h-5 w-5 fill-current" />
                <span>LOG IN NOW</span>
              </button>

              <p className="text-[11px] text-center text-slate-500">
                Anywhere check-in supported. Live camera will open automatically to capture your photo.
              </p>
            </div>
          )}
        </div>

        {/* Today's Summary & Details Card */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Today's Summary & Coordinates</h2>
              <span className="text-xs font-medium text-slate-400">
                {currentTime.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                <span className="text-xs text-slate-400 block">Status</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">
                  {attendance?.status || 'NOT LOGGED IN'}
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

            {/* Saved Photo Verification Preview */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Saved Attendance Photo Proof
                </span>
                {isPunchedIn && !isPunchedOut && (
                  <button
                    type="button"
                    onClick={() => openCameraModal('recapture')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Recapture Photo
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Punch In Photo */}
                {attendance?.punchInPhoto ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-emerald-500/40 shadow shrink-0">
                      <img
                        src={attendance.punchInPhoto}
                        alt="Log In Proof"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Log In Photo Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {new Date(attendance.punchInTime).toLocaleTimeString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEnlargedPhoto(attendance.punchInPhoto)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                      >
                        View High-Res
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Punch Out Photo */}
                {attendance?.punchOutPhoto ? (
                  <div className="flex items-center gap-3 flex-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-amber-500/40 shadow shrink-0">
                      <img
                        src={attendance.punchOutPhoto}
                        alt="Log Out Proof"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Log Out Photo Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {new Date(attendance.punchOutTime).toLocaleTimeString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEnlargedPhoto(attendance.punchOutPhoto)}
                        className="text-xs text-amber-400 hover:text-amber-300 underline"
                      >
                        View High-Res
                      </button>
                    </div>
                  </div>
                ) : null}

                {!attendance?.punchInPhoto && !attendance?.punchOutPhoto && (
                  <div className="flex items-center gap-3 text-slate-500 text-xs py-1">
                    <Camera className="h-5 w-5 text-slate-600" />
                    <span>No verification photos stored yet today. Live photo will save upon log in.</span>
                  </div>
                )}
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

      {/* Geolocation OpenStreetMap Section with Pin Legend */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Punch Location Pin Map</h2>
            <p className="text-xs text-slate-400">OpenStreetMap showing Logged In, Logged Out, and Your Exact Current Location pin</p>
          </div>

          {/* Pin Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <span className="h-3 w-3 rounded-full bg-sky-500 border border-white inline-block shadow-sm"></span> Your Current Location (Blue Pin)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span> Logged In (Green Pin)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm"></span> Logged Out (Yellow Pin)
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

      {/* ========================================================================= */}
      {/* AUTOMATIC CAMERA ON & LIVE CAPTURE MODAL FOR LOG IN / LOG OUT / RECAPTURE */}
      {/* ========================================================================= */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  modalMode === 'logout'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {modalMode === 'login' && 'Biometric Face Verification — Log In'}
                    {modalMode === 'logout' && 'Biometric Face Verification — Log Out'}
                    {modalMode === 'recapture' && 'Recapture Check-In Photo'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live camera view & photo capture
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCameraModal}
                disabled={submitting}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live Camera Feed or Captured Photo Viewport */}
            <div className="relative rounded-2xl border-2 border-indigo-500/30 bg-slate-950 overflow-hidden shadow-2xl h-72 sm:h-80 flex items-center justify-center">
              {capturedPhoto ? (
                /* CAPTURED PHOTO PREVIEW */
                <div className="relative h-full w-full">
                  <img
                    src={capturedPhoto}
                    alt="Captured Face Snapshot"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
                      <CheckCircle2 className="h-4 w-4" /> Photo Captured Successfully
                    </span>
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retake
                    </button>
                  </div>
                </div>
              ) : (
                /* LIVE CAMERA VIEW */
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Face Alignment Overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                      {/* Top status tag */}
                      <div className="w-full flex justify-between items-center text-[11px] font-mono bg-slate-950/70 px-3 py-1 rounded-lg backdrop-blur-sm border border-slate-800">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                          LIVE CAMERA STREAM
                        </span>
                        <span className="text-slate-300">AUTO ACTIVE</span>
                      </div>

                      {/* Biometric Center Scanning Frame */}
                      <div className="relative h-36 w-36 sm:h-40 sm:w-40 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center shadow-lg">
                        {/* Scanning beam animation */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-md shadow-emerald-400"></div>
                        <span className="text-[11px] text-emerald-300 font-medium text-center px-2">
                          Align Face Inside Frame
                        </span>
                      </div>

                      {/* Bottom Instruction */}
                      <span className="text-[11px] text-slate-300 bg-slate-950/70 px-3 py-1 rounded-lg backdrop-blur-sm">
                        Look at the camera and click Capture Photo below
                      </span>
                    </div>
                  )}

                  {/* Camera Initializing / Error Fallback */}
                  {!cameraActive && (
                    <div className="p-6 text-center space-y-3">
                      {cameraLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-9 w-9 text-indigo-400 animate-spin" />
                          <span className="text-sm text-slate-300 font-medium">Starting live webcam feed...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <CameraOff className="h-9 w-9 text-slate-500" />
                          <span className="text-xs text-slate-300 max-w-xs leading-relaxed">
                            {cameraError || 'Camera inactive. Please allow browser webcam access.'}
                          </span>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow"
                          >
                            Retry Camera
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons Section */}
            <div className="space-y-2 pt-1">
              {!capturedPhoto ? (
                /* Step 1: Capture live snapshot */
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    disabled={!cameraActive}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                    <span>📸 Capture Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Step 2: Confirm Action with Captured Photo */
                <div className="space-y-2">
                  {modalMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => executeLoginAPI(capturedPhoto)}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying & Logging In...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Confirm & Log In Now</span>
                        </>
                      )}
                    </button>
                  )}

                  {modalMode === 'logout' && (
                    <button
                      type="button"
                      onClick={() => executeLogoutAPI(capturedPhoto)}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500 transition disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Logging Out & Saving Photo...</span>
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 fill-current" />
                          <span>Confirm & Log Out Now</span>
                        </>
                      )}
                    </button>
                  )}

                  {modalMode === 'recapture' && (
                    <button
                      type="button"
                      onClick={() => handleSaveRecapturedPhoto(capturedPhoto)}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving Updated Photo...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Save Updated Photo</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      disabled={submitting}
                      className="hover:text-slate-200 text-slate-400 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={closeCameraModal}
                      disabled={submitting}
                      className="hover:text-red-400 text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Security note */}
            <div className="text-[11px] text-center text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Photo & Live GPS ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}) verified in MongoDB.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Attendance Verification Photo Proof</h3>
              </div>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
              <img
                src={enlargedPhoto}
                alt="Enlarged Attendance Photo"
                className="w-full max-h-[70vh] object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Employee: <strong className="text-white">{user?.name}</strong></span>
              <span className="text-emerald-400 font-semibold">Verified & Stored in Database</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
