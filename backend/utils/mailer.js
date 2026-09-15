const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

let cachedTransporter = null;

// Configure Transporter with Environment Variables or Fallback Mock Transport
const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  dotenv.config({ path: path.join(__dirname, '../.env') }); // Explicitly load backend/.env
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  // Strip any spaces from Google App Passwords (e.g. 'xslw hizm kvnh pqfu' -> 'xslwhizmkvnhpqfu')
  const pass = rawPass.replace(/\s+/g, '');

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user,
        pass,
      },
    });
    return cachedTransporter;
  }

  // Graceful fallback logger transport when SMTP env is not yet configured
  return {
    sendMail: async (mailOptions) => {
      console.log('\n================ 📧 MOCK EMAIL NOTIFICATION SENT ================');
      console.log(`📩 TO:      ${mailOptions.to}`);
      console.log(`📌 SUBJECT: ${mailOptions.subject}`);
      console.log('📄 BODY:\n', mailOptions.text || (mailOptions.html ? mailOptions.html.replace(/<[^>]*>?/gm, '') : ''));
      console.log('=================================================================\n');
      return { messageId: `mock_email_${Date.now()}` };
    },
  };
};

const getFromEmail = () => process.env.FROM_EMAIL || '"SANEKT Attendance Portal" <no-reply@sanekt.com>';

/**
 * Universal Email Dispatch:
 * 1. If RESEND_API_KEY is configured in .env -> Uses Resend HTTPS API (Port 443, Render Free Tier compatible!)
 * 2. Otherwise -> Uses Nodemailer Gmail SMTP
 */
const sendMailWrapper = async ({ to, subject, html, text }) => {
  dotenv.config({ path: path.join(__dirname, '../.env') });

  // 1. Google Apps Script HTTP Bridge (Sends to ANY email via Gmail account over HTTPS Port 443)
  const scriptUrl = (process.env.GMAIL_SCRIPT_URL || '').trim();
  if (scriptUrl) {
    try {
      console.log(`📨 [Google Apps Script Bridge] Sending email via HTTPS (Port 443) to: ${to}...`);
      const res = await axios.post(
        scriptUrl,
        {
          to,
          subject,
          html,
          text: text || '',
          secret: process.env.GMAIL_SCRIPT_SECRET || 'sanekt_email_secret_2026',
        },
        {
          headers: { 'Content-Type': 'text/plain' }, // Avoid preflight CORS issues
          timeout: 15000,
          maxRedirects: 5,
        }
      );
      console.log(`✅ [Google Apps Script Bridge] Dispatched to ${to}!`);
      return res.data;
    } catch (scriptErr) {
      console.error('⚠️ [Google Apps Script Bridge] Error:', scriptErr.message);
    }
  }

  // 2. Resend API
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      console.log(`📨 [Resend API] Dispatching email via HTTPS (Port 443) to: ${to}...`);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'SANEKT Attendance <onboarding@resend.dev>';
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || '',
        },
        {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log(`✅ [Resend API] Email sent successfully! ID: ${res.data?.id}`);
      return res.data;
    } catch (resendErr) {
      const errMsg = resendErr.response?.data?.message || resendErr.message;
      console.error('⚠️ [Resend API] Failed to send via Resend HTTPS:', errMsg);

      // In Resend free testing mode (onboarding@resend.dev), emails can only be sent to the registered owner email.
      // If an employee email was requested, auto-forward the test OTP to the owner email so testing is seamless!
      if (resendErr.response?.data?.statusCode === 403 && typeof errMsg === 'string' && errMsg.includes('only send testing emails to your own email address')) {
        const ownerEmailMatch = errMsg.match(/\(([^)]+)\)/);
        const ownerEmail = ownerEmailMatch ? ownerEmailMatch[1] : (process.env.SMTP_USER || 'sanekt.sumit@gmail.com');
        console.log(`ℹ️ [Resend Test Mode] Forwarding test OTP email for ${to} to verified owner email: ${ownerEmail}...`);
        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'SANEKT Attendance <onboarding@resend.dev>';
          const fallbackRes = await axios.post(
            'https://api.resend.com/emails',
            {
              from: fromEmail,
              to: [ownerEmail],
              subject: `[Test for ${to}] ${subject}`,
              html: `<div style="background:#1e293b;padding:12px;border-radius:8px;color:#38bdf8;margin-bottom:15px;font-size:13px;border:1px solid #475569;">ℹ️ <strong>Developer Notice:</strong> Resend is in free testing mode. This login OTP was requested for <strong>${to}</strong> and forwarded to your registered email for testing.</div>` + html,
              text: `[Test OTP for ${to}] ` + (text || ''),
            },
            {
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );
          console.log(`✅ [Resend Test Mode] Forwarded successfully to ${ownerEmail}! ID: ${fallbackRes.data?.id}`);
          return fallbackRes.data;
        } catch (fErr) {
          console.error('Failed to forward test email:', fErr.message);
        }
      }
    }
  }

  // Nodemailer SMTP fallback
  const activeTransporter = createTransporter();
  return await activeTransporter.sendMail({
    from: getFromEmail(),
    to,
    subject,
    html,
    text: text || '',
  });
};

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

    await sendMailWrapper({
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

    await sendMailWrapper({
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
    const subject = `🔑 Your SANEKT Login OTP: ${otpCode}`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 36px 28px; border-radius: 20px; border: 1px solid #334155; text-align: center;">
        <div style="margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">SANEKT</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Workforce & Attendance Management Portal</p>
        </div>

        <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 8px; font-weight: 700;">Login OTP Verification Code</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Use the 6-digit one-time password below to securely log into your employee dashboard:</p>
        
        <div style="background: #1e293b; padding: 20px 30px; border-radius: 14px; margin: 24px auto; border: 2px dashed #6366f1; display: inline-block;">
          <span style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #10b981; font-family: 'Courier New', Courier, monospace; display: block;">${otpCode}</span>
        </div>

        <p style="color: #cbd5e1; font-size: 13px; margin-top: 16px;">⏱️ This verification code is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 8px;">If you did not request this login code, you can safely ignore this email.</p>
      </div>
    `;

    const result = await sendMailWrapper({
      to: email,
      subject,
      html: htmlContent,
      text: `Your SANEKT Login OTP is: ${otpCode}. It expires in 10 minutes.`,
    });
    return result;
  } catch (error) {
    console.error('⚠️ [Nodemailer] Failed to deliver OTP email to SMTP server:', error.message);
    // Don't crash so user can still access dev OTP fallback
    return { error: error.message, fallback: true };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPunchNotificationEmail,
  sendOTPEmail,
};
