const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const bootcampSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
      trim: true, //remove whitespaces
      maxLength: [50, 'Name can not be more than 50 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxLength: [500, 'Description can not be more than 500 characters'],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS',
      ],
    },
    phone: {
      type: String,
      maxLength: [20, 'Phone number can not be longer than 20 characters'],
    },
    email: {
      type: String,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email'],
    },
    address: {
      type: String,
      required: [true, 'Please add address'],
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        // the enum property specifies the kinds of values that the type of the field can have
        'Web Development',
        'Mobile Development',
        'UI/UX',
        'Data Science',
        'Business',
        'Other',
      ],
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating can not be more than 10'],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: 'no-photo.jpg',
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      // since the value of this field is an ObjectId which references another model, we can use the 'populate' mongoDB functionality on this field to replace the field's value with the data of the document which it referenced
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  // IMPORTANT!!!(COMMENT BELOW THIS LINE)
  // when we add a virtual field to our model, we need to put the code below as a 2nd parameter in our schema function as well.
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Mongoose Hooks: Create bootcamp slug from the name

bootcampSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

// Geocode & create location field

// bootcampSchema.pre('save', async function (next) {
//   const loc = await geocoder.geocode(this.address);
//   this.location = {
//     type: 'Point',
//     coordinates: [loc[0].longitude, loc[0].latitude],
//     formattedAddress: loc[0].formattedAddress,
//     street: loc[0].streetName,
//     city: loc[0].city,
//     state: loc[0].stateCode,
//     zipCode: loc[0].zipcode,
//     country: loc[0].countryCode,
//   };
// Do not save address in DB(we don't need it anymore, we just want to use the location now, plus we get the formattedAddress)
//this.address = undefined; // setting the field to undefined will cause it to not be stored in the database
// next();
// });

// Mongoose hooks: Cascasde Delete courses when a bootcamp is deleted
bootcampSchema.pre('remove', async function (next) {
  // for this hook to be fired, we must perform a 'remove' operation and not a 'delete' operation. So we won't do for example findByIdAndDelete(), we will just find the document with say findById, and then after getting the document, we do 'document.remove()'.
  // there is a method we can use on the (document object and the model itself) called model() which we can use to access another model in our database.
  console.log(`Courses being removed from bootcamp ${this._id}`);
  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
});

// Reverse populate with virtuals
// A virtual is a field which we can create for our model, but it does not exist or is not persisted in our MongoDB collection. So its just a temporary or 'virtual' field we can create to do something
bootcampSchema.virtual('courses', {
  ref: 'Course', // since this virtual has to do with data coming from another model, we specify the
  localField: '_id', // the 'primary key/field of this model that has a connection or relationship with the other model we want to use to create a virtual
  foreignField: 'bootcamp', // the foreign key/field of the other model that has a relationship with this model
  justOne: false,
});

const Bootcamp = mongoose.model('Bootcamp', bootcampSchema); // your model name must be singular

module.exports = Bootcamp;
