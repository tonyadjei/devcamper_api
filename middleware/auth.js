const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization && // note: we get access to the headers sent in a request with 'req.headers'
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  //   else if(req.cookies.token) {
  //       token = req.cookies.token
  //   }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id); // here, after we have successfully checked that the user is logged in, we find the user that matches the id that was in the payload, then when we find that user, we put it on the req object so that it will be accessible to the subsequent handler function(s)

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  // this syntax(the line above) can be found in java. It is called the 'variable parameter' or so(it is not the spread syntax in this scenario), all the parameters passed to the function will be put in an array called 'roles'.
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
