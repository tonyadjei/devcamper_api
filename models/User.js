// User model
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
  const salt = await bcrypt.genSalt(10); // the integer passed as an argument to genSalt() is the number of rounds, the higher, the more secure, but also the heavier it is on your system. 10 is the recommended number of rounds in the documentation
  this.password = await bcrypt.hash(this.password, salt);
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

const User = mongoose.model('User', userSchema);

module.exports = User;
