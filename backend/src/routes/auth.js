import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { sendEmail, sendSMS, sendSMSSmart } from "../utils/notifications.js";
import { determineUserType } from "../utils/userType.js";

const router = Router();

async function verifyTurnstile(token) {
  try{
    const secret = process.env.TURNSTILE_SECRET
    if (!secret) return true // if not configured, skip
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token || '' }).toString()
    })
    const json = await r.json()
    return !!json.success
  }catch{ return false }
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, username, phone, avatarUrl, captchaToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const okCaptcha = await verifyTurnstile(captchaToken)
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' })

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    // Check phone uniqueness if provided
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) return res.status(409).json({ error: "Phone number already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Determine user type before creating user
    const { userType, subscription } = determineUserType({ email });
    
    const user = await User.create({ 
      name, 
      email, 
      username, 
      phone, 
      avatarUrl, 
      passwordHash,
      userType,
      subscription
    });

    const access = signAccessToken({ sub: String(user._id), email: user.email, name: user.name });
    const refresh = signRefreshToken({ sub: String(user._id), email: user.email, name: user.name });
    res.json({ 
      accessToken: access, 
      refreshToken: refresh, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        username: user.username, 
        phone: user.phone, 
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        subscription: user.subscription
      } 
    });
  } catch (e) {
    console.error('Registration error:', e);
    
    // Handle specific MongoDB validation errors
    if (e.name === 'ValidationError') {
      const errors = Object.values(e.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.join(', ') 
      });
    }
    
    // Handle duplicate key errors
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern)[0];
      return res.status(409).json({ 
        error: `${field} already exists` 
      });
    }
    
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, captchaToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const okCaptcha = await verifyTurnstile(captchaToken)
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' })
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    
    // Determine user type and update if needed
    const { userType, subscription } = determineUserType(user);
    if (user.userType !== userType || user.subscription !== subscription) {
      user.userType = userType;
      user.subscription = subscription;
      await user.save();
    }
    
    const access = signAccessToken({ sub: String(user._id), email: user.email, name: user.name });
    const refresh = signRefreshToken({ sub: String(user._id), email: user.email, name: user.name });
    res.json({ 
      accessToken: access, 
      refreshToken: refresh, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        username: user.username, 
        phone: user.phone, 
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        subscription: user.subscription
      } 
    });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
    const payload = verifyRefreshToken(refreshToken);
    const access = signAccessToken({ sub: payload.sub, email: payload.email });
    res.json({ accessToken: access });
  } catch (e) {
    next(e);
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot password - send OTP
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email, phone } = req.body || {};
    
    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone number required" });
    }

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via email or SMS
    if (email) {
      await sendEmail({
        to: email,
        subject: "Password Reset Code",
        html: `
          <h2>Password Reset Code</h2>
          <p>Your password reset code is: <strong>${otpCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });
    } else if (phone) {
      await sendSMSSmart({
        to: phone,
        message: `Your password reset code is: ${otpCode}. This code will expire in 10 minutes.`
      });
    }

    res.json({ message: "Reset code sent successfully" });
  } catch (e) {
    next(e);
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res, next) => {
  try {
    const { otp, email, phone } = req.body || {};
    
    if (!otp) {
      return res.status(400).json({ error: "OTP code required" });
    }

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    } else {
      return res.status(400).json({ error: "Email or phone number required" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ error: "OTP code has expired" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (e) {
    next(e);
  }
});

// Reset password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, phone, otp, newPassword } = req.body || {};
    
    if (!otp || !newPassword) {
      return res.status(400).json({ error: "OTP code and new password required" });
    }

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    } else {
      return res.status(400).json({ error: "Email or phone number required" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ error: "OTP code has expired" });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (e) {
    next(e);
  }
});

// Change password (for authenticated users)
router.post("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const userId = req.user?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (e) {
    next(e);
  }
});

// Test SMS endpoint for debugging
router.post("/test-sms", async (req, res, next) => {
  try {
    const { phone, message } = req.body || {};
    
    if (!phone || !message) {
      return res.status(400).json({ error: "Phone number and message required" });
    }

    console.log('🧪 Test SMS endpoint called');
    console.log('📱 Phone number formatting test:');
    console.log('- Input:', phone);
    
    // Test the smart SMS function
    const { sendSMSSmart } = await import('../utils/notifications.js');
    const result = await sendSMSSmart({ to: phone, message });
    
    res.json({ 
      success: true, 
      message: 'SMS test completed',
      inputNumber: phone,
      result 
    });
  } catch (e) {
    console.error('Test SMS failed:', e);
    res.status(500).json({ 
      success: false, 
      error: e.message,
      details: e.toString()
    });
  }
});

// Test Email endpoint for debugging
router.post("/test-email", async (req, res, next) => {
  try {
    const { to, subject, message } = req.body || {};
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: "To, subject, and message required" });
    }

    console.log('🧪 Test Email endpoint called');
    console.log('📧 Email sending test:');
    console.log('- To:', to);
    console.log('- Subject:', subject);
    
    const { sendEmail } = await import('../utils/notifications.js');
    const result = await sendEmail({ 
      to, 
      subject, 
      html: `<p>${message}</p><p><em>This is a test email from Personal Dashboard.</em></p>`,
      text: message
    });
    
    res.json({ 
      success: true, 
      message: 'Email test completed',
      result 
    });
  } catch (e) {
    console.error('Test Email failed:', e);
    res.status(500).json({ 
      success: false, 
      error: e.message,
      details: e.toString()
    });
  }
});

export default router;

