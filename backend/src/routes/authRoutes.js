const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  sendOTP,
  verifyOTP,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Helper middleware to capture express-validator validation results
const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ApiError(400, 'Request input parameters validation failed', formattedErrors));
  }
  next();
};

// 1. Send OTP Route (accepts phone number or email)
router.post(
  '/send-otp',
  [
    body('emailOrPhone')
      .trim()
      .notEmpty()
      .withMessage('Email address or phone number is required'),
  ],
  validateFields,
  sendOTP
);

// 2. Verify OTP Route
router.post(
  '/verify-otp',
  [
    body('emailOrPhone')
      .trim()
      .notEmpty()
      .withMessage('Email address or phone number is required'),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('6-digit OTP code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be exactly 6 digits'),
  ],
  validateFields,
  verifyOTP
);

// 3. Logout Route
router.post('/logout', protect, logoutUser);

// 4. Session Validation Profile Route
router.get('/me', protect, getMe);

module.exports = router;
