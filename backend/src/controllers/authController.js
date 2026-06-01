const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateAccessToken = require('../utils/generateAccessToken');
const ApiError = require('../utils/ApiError');
const { sendOTPEmail } = require('../services/emailService');

/**
 * @desc    Generate and send OTP via Email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTP = async (req, res, next) => {
  const { emailOrPhone, flow = 'login' } = req.body;
  const email = emailOrPhone;

  if (!email) {
    return next(new ApiError(400, 'Please provide an email address.'));
  }

  try {
    const cleanInput = email.trim().toLowerCase();
    const isEmail = cleanInput.includes('@');

    if (!isEmail) {
      return next(new ApiError(400, 'Please provide a valid email address.'));
    }

    // 1. Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // 2. Locate User
    let user = await User.findOne({ email: cleanInput });
    const userExists = !!(user && user.isVerified);

    // 3. Evaluate Flow Constraints
    if (flow === 'login') {
      if (!userExists) {
        return next(new ApiError(404, 'Account does not exist. Please sign up first.'));
      }
    } else if (flow === 'signup') {
      if (userExists) {
        return next(new ApiError(400, 'Account already exists, please login'));
      }
    }

    // 4. Create or Update document (User is created unverified on Signup, and fully verified only after OTP matches)
    if (!user) {
      user = await User.create({
        email: cleanInput,
        username: `user_${Date.now()}`,
        fullName: 'Spotify Listener',
        role: 'user',
        isVerified: false,
      });
      console.log(`[Auth] Created unverified signup email document: ${cleanInput}`);
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // 5. Send the OTP Email
    let sentSuccessfully = false;
    try {
      await sendOTPEmail(user.email, otp);
      sentSuccessfully = true;
    } catch (mailErr) {
      console.error('SMTP Mail delivery failed:', mailErr);
    }

    // --- DEVELOPMENT FALLBACK FEEDBACK LOGGER ---
    console.log(`=======================================================`);
    console.log(`🔑 SECURE OTP GENERATED (${flow.toUpperCase()} FLOW)`);
    console.log(`👤 Target Email: ${cleanInput}`);
    console.log(`🔥 Code: ${otp}`);
    console.log(`⏳ Expires: 5 minutes (${otpExpires.toLocaleTimeString()})`);
    console.log(`=======================================================`);

    res.status(200).json({
      success: true,
      userExists,
      message: sentSuccessfully 
        ? 'OTP sent successfully to your email.' 
        : 'OTP generated successfully (logged to developer terminal).',
      // Send OTP to client in non-production environments
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and authenticate user session
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  const { emailOrPhone, otp } = req.body;
  const email = emailOrPhone;

  if (!email || !otp) {
    return next(new ApiError(400, 'Please provide both the email and the 6-digit OTP.'));
  }

  try {
    const cleanInput = email.trim().toLowerCase();

    // 1. Locate User
    const user = await User.findOne({ email: cleanInput });

    // Debugging logs (Requirement 2)
    console.log("Saved OTP:", user ? user.otp : "N/A");
    console.log("Received OTP:", otp);
    console.log("User Found:", user);

    // Detailed check logs
    console.log(`[verifyOTP] User Lookup Result:`, user ? `Found User ID: ${user._id}` : 'User Not Found');
    if (user) {
      console.log(`[verifyOTP] Saved OTP in DB: ${user.otp}`);
      console.log(`[verifyOTP] Received OTP from Request: ${otp}`);
      console.log(`[verifyOTP] OTP Expiry time: ${user.otpExpires ? user.otpExpires.toISOString() : 'N/A'}`);
      console.log(`[verifyOTP] Current Server Time: ${new Date().toISOString()}`);
      console.log(`[verifyOTP] Is OTP Expired: ${user.otpExpires ? (new Date() > user.otpExpires) : 'N/A'}`);
    }

    // Precise failure messages
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (!user.otp) {
      return next(new ApiError(401, 'OTP not found'));
    }

    if (user.otp !== otp.trim()) {
      return next(new ApiError(401, 'OTP mismatch'));
    }

    if (new Date() > user.otpExpires) {
      return next(new ApiError(401, 'OTP expired'));
    }

    // 3. Mark account verified & purge OTP credentials
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 4. Issue JWT Access Token
    const accessToken = generateAccessToken(user._id);

    // Set secure Access Token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Login complete.',
      data: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        role: user.role,
        avatar: user.avatar,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke user session and cookies
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res, next) => {
  try {
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({
      success: true,
      message: 'Session successfully closed.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Session missing or unauthorized.'));
    }
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  logoutUser,
  getMe,
};
