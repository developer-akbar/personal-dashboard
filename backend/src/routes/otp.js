import { Router } from "express";
import User from "../models/User.js";
import { sendSMSSmart } from "../utils/notifications.js";

const router = Router();

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for MSG91 Widget
router.post("/send", async (req, res, next) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ 
        error: "Mobile number required",
        success: false 
      });
    }

    // Validate Indian mobile number
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ 
        error: "Invalid mobile number format",
        success: false 
      });
    }

    // Check if user exists
    const user = await User.findOne({ phone: mobile });
    if (!user) {
      return res.status(404).json({ 
        error: "User not found with this mobile number",
        success: false 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user record
    user.otpCode = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via SMS
    try {
      await sendSMSSmart({
        to: mobile,
        message: `Your OTP for Personal Dashboard is ${otp}. Valid for 10 minutes.`
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Don't fail the request if SMS fails, just log it
    }

    res.json({ 
      success: true,
      message: "OTP sent successfully",
      // Don't send OTP in response for security
      mobile: mobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3') // Mask mobile number
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    next(error);
  }
});

// Verify OTP for MSG91 Widget
router.post("/verify", async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      return res.status(400).json({ 
        error: "Mobile number and OTP required",
        success: false 
      });
    }

    // Find user
    const user = await User.findOne({ phone: mobile });
    if (!user) {
      return res.status(404).json({ 
        error: "User not found",
        success: false 
      });
    }

    // Verify OTP
    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ 
        error: "Invalid OTP",
        success: false 
      });
    }

    // Check if OTP expired
    if (user.otpExpires < new Date()) {
      return res.status(400).json({ 
        error: "OTP has expired",
        success: false 
      });
    }

    // Clear OTP after successful verification
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ 
      success: true,
      message: "OTP verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    next(error);
  }
});

// Resend OTP
router.post("/resend", async (req, res, next) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ 
        error: "Mobile number required",
        success: false 
      });
    }

    // Find user
    const user = await User.findOne({ phone: mobile });
    if (!user) {
      return res.status(404).json({ 
        error: "User not found",
        success: false 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Update OTP in user record
    user.otpCode = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via SMS
    try {
      await sendSMSSmart({
        to: mobile,
        message: `Your OTP for Personal Dashboard is ${otp}. Valid for 10 minutes.`
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
    }

    res.json({ 
      success: true,
      message: "OTP resent successfully",
      mobile: mobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    next(error);
  }
});

export default router;