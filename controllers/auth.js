const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // Generate token and send in a cookie
  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(
      new ErrorResponse('Please provide an email and/or password', 400)
    );
  }

  // Check if user exists in the database
  const user = await User.findOne({ email }).select('+password'); // in the User model creation, we did not allow the password field to be visible, but we need it to be returned so that we can validate what the user entered against what is in the database.

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401)); // beware that your email verification error message is the same as your password verification message so that people will not be able to see who is registered or not on your site
  }

  // Check if password matches that in the database
  const isMatch = await user.matchPassword(password); // we have to use 'await' because the method we created on the user schema is asynchronous

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Generate token and send in a cookie
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken(); // mind you, the resetPasswordToken and resetPasswordExpire fields of the user model are being set in this user method. But they have only been set locally, and now we must save it to the database

  // we need to save the document again, so that the resetPasswordToken and resetPasswordExpire fields that was set in the method 'getResetPasswordToken()' would be persisted to the database, and wouldn't just be set locally
  await user.save({ validateBeforeSave: false }); // no need to do validation when saving because we are just adding the resetPasswordToken and resetPasswordExpire, we don't want to waste time doing validation which has already been done initially when the user document was being created

  console.log(resetToken);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // options object for the cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};
