// Creating Custom Error class that extends the built-in Error class
// This is the error we will be passing to our next(err) calls, they will then be handled by our custom error handlers

class ErrorResponse extends Error {
  constructor(message, status) {
    super(message);
    this.statusCode = status;
  }
}
module.exports = ErrorResponse;
