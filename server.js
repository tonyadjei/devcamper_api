// IMPORTANT: anytime you make changes to the 'config.env' file, you must restart the server to effect changes
// IMPORTANT (MongoDB): no matter what roles you assign for your User model, you can always assign an 'admin' role in the mongoDB database(via compass or the web platform) and this user will be able to perform all operations
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload'); // a package for handling file uploads in express applications
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express(); // create an express app

// Body parser
app.use(express.json()); // use the built-in json body parser. Parses JSON coming from the request into an object and places it on 'req.body'

// Cookie parser
app.use(cookieParser()); // use the built-in cookie parser middleware

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // use the morgan third party package middleware for logging when in development mode
}

// File uploading
app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Sanitize data against NoSQL injection attacks
app.use(mongoSanitize());

// Set security headers via the helmet package
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100, // max 100 requests
});

// Limit amount of requests to API to 100 requests per 10 mins
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS (Cross-Origin Resource Sharing), thus, we are making our API accessible from other domains, external domains, thus this becomes a public API
app.use(cors());

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);
app.use(errorHandler); // if you have a custom error handler, you have to call/use it at the end of all your routes, so that it will catch the next(err) that is coming. If you don't provide a custom error handler, express already has one by default that will be fired in case there is an error in the program.

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections in other areas of the code such as in the config folder(db.js)
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
