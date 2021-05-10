const express = require('express');
const { getCourses } = require('../controllers/courses');

const router = express.Router({ mergeParams: true }); // the option here is used when we are merging the URL params(remember in the bootcamps route file, we mounted a particular route(/:bootcampId/courses) on the courses router object. So whenver that route is hit, it should move onto the courses router)

router.route('/').get(getCourses); // the :/bootcampId/courses route will fire here because it was a GET route, even though the course route used on this same line of code is '/'. It will just fire the controller method necessary for the GET method

module.exports = router;
