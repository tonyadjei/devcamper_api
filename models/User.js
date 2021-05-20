// User model
const crypto = require('crypto'); // this is a core node.js module to generate a token and hash it
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // use the bcryptjs package and not the bcrypt package(has some issues on windows, maybe fixed, who knows?)
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please add an email'],
    match: [/\S+@\S+\.\S+/, 'Please use a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // this means the password filed will not show when we request for user documents from the database. Unless we do for example, query.select('+password'), to include the filed in the outcome
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    // this method 'isModified(<databaseField>)' returns a Boolean value indicating whether or not a field of the document has been modified locally. It could be used to check for changes in database fields before a 'save' operation takes place for instance
    next();
  }

  const salt = await bcrypt.genSalt(10); // the integer passed as an argument to genSalt() is the number of rounds, the higher, the more secure, but also the heavier it is on your system. 10 is the recommended number of rounds in the documentation
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  // so, on the schema object, we can also assign methods and not only static functions. These methods will be called from an instantiated object of the model. Here, the 'this' keyword will refer to the object and not the model.
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password against hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate the token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set the resetPasswordExpire field to 10 minutes(in milliseconds)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
