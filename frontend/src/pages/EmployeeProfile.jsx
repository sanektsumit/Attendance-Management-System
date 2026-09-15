import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ConfirmModal from '../components/ConfirmModal';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  Upload,
  FileText,
  Trash2,
  Save,
  CheckCircle,
  Shield,
  Clock,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  Camera,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Custom SVG Brand Icons for LinkedIn, GitHub, Twitter
const LinkedInIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const EmployeeProfile = () => {
  const { user, setUser } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');

  // Social Links State
  const [socialLinks, setSocialLinks] = useState({
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
    twitter: user?.socialLinks?.twitter || '',
    portfolio: user?.socialLinks?.portfolio || '',
  });

  // Documents State
  const [documents, setDocuments] = useState(user?.documents || []);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('ID Proof');
  const [docUrl, setDocUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Cloudinary Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Sync profile form states when user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
      setDob(user.dob || '');
      setEmergencyContact(user.emergencyContact || '');
      setSocialLinks({
        linkedin: user.socialLinks?.linkedin || '',
        github: user.socialLinks?.github || '',
        twitter: user.socialLinks?.twitter || '',
        portfolio: user.socialLinks?.portfolio || '',
      });
      setDocuments(user.documents || []);
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setUploadingAvatar(true);
      try {
        const res = await axiosClient.post('/auth/upload-avatar', { image: base64Data });
        if (res.data.success) {
          toast.success('🎉 Profile photo saved to Cloudinary & MongoDB!');
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to upload photo to Cloudinary');
      } finally {
        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const payload = {
        name,
        phone,
        address,
        bio,
        dob,
        emergencyContact,
        socialLinks,
      };

      const res = await axiosClient.put('/auth/profile', payload);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docTitle || !docUrl) {
      toast.error('Please provide document title and file URL');
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await axiosClient.post('/auth/documents', {
        title: docTitle,
        category: docCategory,
        fileUrl: docUrl,
      });

      if (res.data.success) {
        toast.success('Document uploaded successfully!');
        setDocuments(res.data.documents);
        setDocTitle('');
        setDocUrl('');
      }
    } catch (error) {
      toast.error('Failed to add document');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Delete Document Confirmation State
  const [deleteDocTarget, setDeleteDocTarget] = useState(null); // { id, title }
  const [deletingDoc, setDeletingDoc] = useState(false);

  const confirmDeleteDocument = async () => {
    if (!deleteDocTarget) return;
    setDeletingDoc(true);
    try {
      const res = await axiosClient.delete(`/auth/documents/${deleteDocTarget.id}`);
      if (res.data.success) {
        toast.success(`Removed "${deleteDocTarget.title}" document`);
        setDocuments(res.data.documents);
        setDeleteDocTarget(null);
      }
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingDoc(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 p-6 shadow-2xl">
        <div className="flex items-center gap-5">
          {/* User Avatar with Cloudinary Upload Trigger */}
          <div className="relative group">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-200 border-2 border-indigo-500/40 shadow-xl overflow-hidden font-bold text-3xl">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Profile Avatar'}
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
              )}

              {/* Uploading Spinner Overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-10">
                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-indigo-200 font-semibold">Uploading...</span>
                </div>
              )}
            </div>

            {/* Hidden native file picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />

            {/* Cloudinary Camera Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              title="Upload profile photo to Cloudinary"
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border-2 border-slate-900 transition hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {user?.name}
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                {user?.role === 'admin' ? 'HR Administrator' : 'Staff Member'}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-indigo-400" /> {user?.designation || 'Employee'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-indigo-400" /> Shift: {user?.shiftStart || '21:00'} - {user?.shiftEnd || '05:00'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition disabled:opacity-50"
        >
          {savingProfile ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Profile Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Information Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="h-4 w-4 text-indigo-400" /> Personal Details & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-950/50 p-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, City, Postal Code"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Emergency Contact Number</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department & Designation</label>
                <div className="flex items-center gap-2 pt-1 text-sm font-semibold text-slate-300">
                  <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-indigo-400 border border-indigo-500/20">{user?.department || 'General'}</span>
                  <span>{user?.designation}</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">About / Employee Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="3"
                  placeholder="Share a brief overview of your background, experience, or role..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="h-4 w-4 text-emerald-400" /> Social Links & Portfolio Showcase
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                  <LinkedInIcon /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                  <GitHubIcon /> GitHub URL
                </label>
                <input
                  type="url"
                  value={socialLinks.github}
                  onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                  <TwitterIcon /> Twitter / X URL
                </label>
                <input
                  type="url"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="https://twitter.com/username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" /> Personal Portfolio URL
                </label>
                <input
                  type="url"
                  value={socialLinks.portfolio}
                  onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Social Quick Access Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400 hover:bg-indigo-500/20 transition" title="LinkedIn Profile">
                  <LinkedInIcon />
                </a>
              )}
              {socialLinks.github && (
                <a href={socialLinks.github} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white hover:bg-slate-700 transition" title="GitHub Profile">
                  <GitHubIcon />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-400 hover:bg-sky-500/20 transition" title="Twitter Profile">
                  <TwitterIcon />
                </a>
              )}
              {socialLinks.portfolio && (
                <a href={socialLinks.portfolio} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500/20 transition" title="Portfolio Site">
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Documents & Credentials Attachment */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="h-4 w-4 text-purple-400" /> Employee Documents & ID Attachments
            </h2>

            {/* Document Add Form */}
            <form onSubmit={handleAddDocument} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Attach New Document</span>

              <div>
                <input
                  type="text"
                  placeholder="Document Title (e.g. Passport ID)"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ID Proof">ID Proof</option>
                  <option value="Resume">Resume / CV</option>
                  <option value="Certificate">Certificate / Degree</option>
                  <option value="Tax / Bank">Tax / Bank Details</option>
                </select>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="File Document URL (Google Drive / Cloud Link)"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition disabled:opacity-50"
              >
                {uploadingDoc ? 'Uploading...' : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Attach Document
                  </>
                )}
              </button>
            </form>

            {/* Documents List */}
            <div className="space-y-2.5">
              {documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No documents attached yet.</div>
              ) : (
                documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                    <div className="space-y-0.5 truncate">
                      <div className="font-semibold text-white truncate">{doc.title}</div>
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-400 border border-indigo-500/20">
                        {doc.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
                      >
                        View
                      </a>
                      <button
                        onClick={() => setDeleteDocTarget({ id: doc._id, title: doc.title })}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1 text-rose-400 hover:bg-rose-500/20 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Document Deletion */}
      <ConfirmModal
        isOpen={!!deleteDocTarget}
        title="Remove Document Attachment"
        message={`Are you sure you want to permanently delete the document "${deleteDocTarget?.title}" from your profile attachments?`}
        confirmText="Delete Document"
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDeleteDocTarget(null)}
        loading={deletingDoc}
      />
    </div>
  );
};

export default EmployeeProfile;
