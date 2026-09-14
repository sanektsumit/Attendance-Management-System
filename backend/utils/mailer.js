const nodemailer = require('nodemailer');

// Configure Transporter with Environment Variables or Fallback Mock Transport
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Graceful fallback logger transport when SMTP env is not yet configured
  return {
    sendMail: async (mailOptions) => {
      console.log('\n================ 📧 MOCK EMAIL NOTIFICATION SENT ================');
      console.log(`📩 TO:      ${mailOptions.to}`);
      console.log(`📌 SUBJECT: ${mailOptions.subject}`);
      console.log('📄 BODY:\n', mailOptions.text || mailOptions.html.replace(/<[^>]*>?/gm, ''));
      console.log('=================================================================\n');
      return { messageId: `mock_email_${Date.now()}` };
    },
  };
};

const transporter = createTransporter();

const getFromEmail = () => process.env.FROM_EMAIL || '"SANEKT Attendance Portal" <no-reply@sanekt.com>';

/**
 * 1. Send Welcome Email with Account Credentials on New Employee Creation
 */
const sendWelcomeEmail = async (employee, password) => {
  try {
    const subject = '🎉 Welcome to SANEKT Attendance Portal - Your Account Credentials';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #334155;">
        <h2 style="color: #6366f1; font-size: 22px; margin-bottom: 5px;">Welcome to SANEKT Attendance Portal! 👋</h2>
        <p style="color: #94a3b8; font-size: 14px;">Your official employee account has been successfully created by HR Administration.</p>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin: 20px 0;">
          <h3 style="color: #38bdf8; font-size: 14px; text-transform: uppercase; margin-top: 0; letter-spacing: 1px;">Portal Login Details</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Employee Name:</strong> ${employee.name}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Email ID (Login Username):</strong> <span style="color: #818cf8;">${employee.email}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Portal Password:</strong> <span style="background: #0f172a; color: #34d399; font-family: monospace; padding: 4px 8px; border-radius: 6px; border: 1px solid #334155; font-weight: bold;">${password}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Department:</strong> ${employee.department || 'General'}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Assigned Working Shift:</strong> ${employee.shiftStart || '21:00'} - ${employee.shiftEnd || '05:00'}</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px;">You can now log into your employee dashboard to record attendance check-ins, view history, and manage your profile.</p>
        
        <div style="text-align: center; margin-top: 25px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 10px; display: inline-block;">Log In to SANEKT Portal</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: getFromEmail(),
      to: employee.email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
  }
};

/**
 * 2. Send Sign In / Sign Out Email Notification with Actual Location, Date, Time & City
 */
const sendPunchNotificationEmail = async ({
  employee,
  eventType, // 'LOGGED_IN' or 'LOGGED_OUT'
  timestamp = new Date(),
  address = 'Location recorded',
  lat = 28.57126,
  lng = 77.21991,
  totalHours = 0,
  status = 'PRESENT',
}) => {
  try {
    const isLogin = eventType === 'LOGGED_IN';
    const actionTitle = isLogin ? '🟢 Logged In (Check-In) Notification' : '🟡 Logged Out (Check-Out) Notification';
    const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const subject = `[SANEKT Alert] ${actionTitle} - ${formattedTime}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #334155;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-b: 1px solid #334155; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: ${isLogin ? '#34d399' : '#fbbf24'}; font-size: 20px; margin: 0;">${actionTitle}</h2>
          <span style="background: #1e293b; color: #94a3b8; font-size: 11px; padding: 4px 10px; border-radius: 20px;">SANEKT Security</span>
        </div>

        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 15px;">Hello <strong>${employee.name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 13px;">Your attendance activity was recorded on the SANEKT Workforce Portal.</p>

        <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr style="border-b: 1px solid #334155;">
              <td style="padding: 10px 0; color: #94a3b8;">📅 Date:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f1f5f9;">${formattedDate}</td>
            </tr>
            <tr style="border-b: 1px solid #334155;">
              <td style="padding: 10px 0; color: #94a3b8;">⏰ Actual Time:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #818cf8;">${formattedTime}</td>
            </tr>
            <tr style="border-b: 1px solid #334155;">
              <td style="padding: 10px 0; color: #94a3b8;">📍 City & Recorded Location:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #34d399;">${address}</td>
            </tr>
            <tr style="border-b: 1px solid #334155;">
              <td style="padding: 10px 0; color: #94a3b8;">🛰️ GPS Coordinates:</td>
              <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #cbd5e1;">${lat.toFixed(4)}, ${lng.toFixed(4)}</td>
            </tr>
            <tr style="border-b: 1px solid #334155;">
              <td style="padding: 10px 0; color: #94a3b8;">📊 Status:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${status === 'LATE' ? '#f59e0b' : '#10b981'};">${status}</td>
            </tr>
            ${
              !isLogin
                ? `
            <tr>
              <td style="padding: 10px 0; color: #94a3b8;">⏱️ Total Shift Hours Worked:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #a855f7;">${totalHours} hrs</td>
            </tr>
            `
                : ''
            }
          </table>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">This is an automated security notification from SANEKT Attendance System.</p>
      </div>
    `;

    await transporter.sendMail({
      from: getFromEmail(),
      to: employee.email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send punch notification email:', error.message);
  }
};

/**
 * 3. Send OTP Code Email for Secure Verification
 */
const sendOTPEmail = async (email, otpCode) => {
  try {
    const subject = '🔑 Your SANEKT Security Verification OTP Code';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #334155; text-align: center;">
        <h2 style="color: #818cf8; font-size: 20px;">Security OTP Verification</h2>
        <p style="color: #94a3b8; font-size: 13px;">Use the 6-digit OTP code below to verify your account or complete secure authentication.</p>
        
        <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin: 25px 0; border: 1px border-indigo-500;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #34d399; font-family: monospace;">${otpCode}</span>
        </div>

        <p style="color: #64748b; font-size: 12px;">This OTP code is valid for 10 minutes. Do not share this OTP with anyone.</p>
      </div>
    `;

    await transporter.sendMail({
      from: getFromEmail(),
      to: email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPunchNotificationEmail,
  sendOTPEmail,
};
