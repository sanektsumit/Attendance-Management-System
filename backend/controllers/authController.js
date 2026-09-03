const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/mailer');

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
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.toLowerCase(), { otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });

    // 📧 Send OTP email via Nodemailer
    await sendOTPEmail(email, otpCode);

    res.status(200).json({
      success: true,
      message: `OTP verification code sent to ${email}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP code
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
    }

    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this email' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
    }

    if (record.otpCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP verification code' });
    }

    otpStore.delete(email.toLowerCase());

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully!',
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

module.exports = {
  login,
  registerEmployee,
  getMe,
  updateProfile,
  addDocument,
  deleteDocument,
  impersonateEmployee,
  requestOTP,
  verifyOTP,
};
