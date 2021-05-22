const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log to console for dev
  console.log(err);

  // to test for an error, first console log the error to see what kind of error it is. Get the name of the error by saying err.name

  // Mongoose bad ObjectId error
  if (err.name === 'CastError') {
    const message = `Resource not found`; // when there is an error due to a wrong ID, the ID that failed to pass the validation is stored in err.value
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    // sometimes, the error does not have a unique name that identifies it, but a code instead. For example, where there is a duplicate field error, we have an err.code whose value is 11000
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
