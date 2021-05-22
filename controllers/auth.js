const crypto = require('crypto'); // remember, crypto is a core node.js module for token generation and hashing
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
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

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private

exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: 'User logged out successfully',
  });
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

// @desc    Update user details(only name and email)
// @route   PUT /api/v1/auth/updatedetails
// @access  Private

exports.updateDetails = asyncHandler(async (req, res, next) => {
  // this is for updating only the user name and email
  // we want to make sure that only the name and email is updated, so we won't just pass 'req.body' to User.findByIdAndUpdate(), instead, we will create our own object which has just name and email as properties
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  // Check that the 'current password' field that the user has entered indeed is his current password, prior to coming to update it
  if (!(await user.matchPassword(req.body.currentPassword))) {
    // when you are using 'await' in an if statement, put the code that has await in it in parenthesis
    return next(new ErrorResponse('Password is incorrect'), 401);
  }

  user.password = req.body.newPassword;
  await user.save(); // remember, the password is being hashed for us before we save the user (thanks to the 'pre' 'save' mongoose hook in the User model)

  sendTokenResponse(user, 200, res);
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

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to : \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res
      .status(200)
      .json({ success: true, data: `An email has been sent to ${user.email}` });
  } catch (err) {
    // now, if something goes wrong with the sending of the email (with nodemailer package), let's clear out the resetPasswordToken and resetPasswordExpire fileds by setting them to undefined
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new ErrorResponse('Email could not be sent, please try again later.'),
      500
    );
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(
      new ErrorResponse('Invalid or Expired token, please try again.'),
      400
    );
  }

  // Set new password
  user.password = req.body.password; // remember, we automatically encrypt the password in a mongoose pre 'save' hook in the User model
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate token and send in a cookie. This way, the user that just reset his/her password will be logged in
  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
// this helper function will be used to log users in after they
// 1. Register, 2. Log in and 3. Reset their password
const sendTokenResponse = (user, statusCode, res) => {
  // Create token (with payload information, which is the user's id)
  const token = user.getSignedJwtToken();

  // options object for the cookie
  const options = {
    expires: new Date( // we could have also used 'maxAge' in place of 'expires'
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
