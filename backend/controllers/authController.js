const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/mailer');
const { createNotification } = require('../utils/notificationService');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Memory cache for OTP verification codes
const otpStore = new Map();

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'supersecretjwtkey_attendancemanagementsystem_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact HR.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        shiftStart: user.shiftStart || '09:00',
        shiftEnd: user.shiftEnd || '18:00',
        lateThresholdMinutes: user.lateThresholdMinutes || 15,
        avatar: user.avatar || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        socialLinks: user.socialLinks || {},
        documents: user.documents || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register new employee & send welcome email
// @route   POST /api/v1/auth/register-employee
// @access  Private/Admin
const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, shiftStart, shiftEnd } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Please provide employee name and email' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists' });
    }

    const initialPassword = password || 'Employee@123';
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: initialPassword,
      role: role || 'employee',
      department: department || 'Engineering',
      designation: designation || 'Staff Member',
      shiftStart: shiftStart || '09:00',
      shiftEnd: shiftEnd || '18:00',
    });

    // 📧 Send Welcome Email via Nodemailer with login credentials
    try {
      await sendWelcomeEmail(newUser, initialPassword);
    } catch (mailErr) {
      console.error('Failed to send welcome email:', mailErr.message);
    }

    // 🔔 Send in-app notification on BOTH sides
    try {
      createNotification({
        recipientRole: 'admin',
        sender: req.user?._id || null,
        senderName: req.user?.name || 'HR Admin',
        type: 'system',
        title: `👤 Employee Account Created: ${newUser.name}`,
        message: `${newUser.name} (${newUser.email}) was added to ${newUser.department || 'General'} as ${newUser.designation || 'Staff'}.`,
        meta: { employeeId: newUser._id, employeeName: newUser.name, email: newUser.email },
      });
      createNotification({
        recipient: newUser._id,
        recipientRole: 'employee',
        type: 'system',
        title: '🎉 Welcome to SANEKT Attendance Portal',
        message: `Your employee profile has been configured. Working shift: ${newUser.shiftStart} to ${newUser.shiftEnd}.`,
        meta: { employeeId: newUser._id },
      });
    } catch (nErr) {}

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully!',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request 6-digit OTP email
// @route   POST /api/v1/auth/send-otp
// @access  Public
const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your employee email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Verify if this is a registered employee account
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered employee account found with this email. Please contact your HR.',
        contactHr: true,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your employee account is deactivated. Please contact your HR.',
        contactHr: true,
      });
    }

    // Generate random 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(user.email, { otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`🔑 [SANEKT OTP SENT] Registered Employee Email: ${user.email} | 6-Digit OTP: ${otpCode}`);

    // 📧 Send OTP email via Nodemailer to their actual mail id
    try {
      await sendOTPEmail(user.email, otpCode);
    } catch (mailErr) {
      console.error('Mail delivery warning:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `A 6-digit OTP verification code has been sent to your registered email (${user.email}).`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP code and authenticate user into dashboard
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and 6-digit OTP code' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    // Verify employee exists in system
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered employee account found with this email. Please contact your HR.',
        contactHr: true,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your employee account is deactivated. Please contact your HR.',
        contactHr: true,
      });
    }

    const record = otpStore.get(user.email);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No OTP requested for this email or it has expired. Please contact your HR.',
        contactHr: true,
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(user.email);
      return res.status(400).json({
        success: false,
        message: 'OTP code has expired. Please contact your HR.',
        contactHr: true,
      });
    }

    if (record.otpCode !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please contact your HR.',
        contactHr: true,
      });
    }

    // Clear OTP after successful verification
    otpStore.delete(user.email);

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! Entering dashboard...',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        shiftStart: user.shiftStart || '09:00',
        shiftEnd: user.shiftEnd || '18:00',
        lateThresholdMinutes: user.lateThresholdMinutes || 15,
        avatar: user.avatar || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        socialLinks: user.socialLinks || {},
        documents: user.documents || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Employee Profile details & avatar image
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, bio, dob, emergencyContact, avatar, socialLinks } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    if (dob !== undefined) user.dob = dob;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (avatar !== undefined) user.avatar = avatar;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add document to employee profile
// @route   POST /api/v1/auth/documents
// @access  Private
const addDocument = async (req, res) => {
  try {
    const { title, category, fileUrl } = req.body;
    if (!title || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Please provide document title and file URL' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const docItem = {
      _id: `doc_${Date.now()}`,
      title,
      category: category || 'General',
      fileUrl,
      uploadedAt: new Date(),
    };

    user.documents.push(docItem);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: docItem,
      documents: user.documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete document from profile
// @route   DELETE /api/v1/auth/documents/:docId
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const docId = req.params.docId;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.documents = user.documents.filter((d) => String(d._id) !== String(docId));
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      documents: user.documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin impersonate / view employee portal token
// @route   POST /api/v1/auth/impersonate
// @access  Private/Admin
const impersonateEmployee = async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const token = generateToken(targetUser._id, targetUser.role || 'employee');

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role || 'employee',
        department: targetUser.department || 'General',
        designation: targetUser.designation || 'Staff Member',
        shiftStart: targetUser.shiftStart || '09:00',
        shiftEnd: targetUser.shiftEnd || '18:00',
        lateThresholdMinutes: targetUser.lateThresholdMinutes || 15,
        avatar: targetUser.avatar || '',
        phone: targetUser.phone || '',
        address: targetUser.address || '',
        bio: targetUser.bio || '',
        socialLinks: targetUser.socialLinks || {},
        documents: targetUser.documents || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload avatar image to Cloudinary and save to user profile
// @route   POST /api/v1/auth/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Please provide an image to upload' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Upload to Cloudinary under folder 'sanekt_avatars', throwing error if configuration or upload fails
    const cloudinaryUrl = await uploadToCloudinary(image, 'sanekt_avatars', true);
    user.avatar = cloudinaryUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully to Cloudinary!',
      avatarUrl: cloudinaryUrl,
      user,
    });
  } catch (error) {
    console.error('Avatar upload error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  registerEmployee,
  getMe,
  updateProfile,
  uploadAvatar,
  addDocument,
  deleteDocument,
  impersonateEmployee,
  requestOTP,
  verifyOTP,
};
