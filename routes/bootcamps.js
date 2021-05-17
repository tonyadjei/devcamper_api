const express = require("express");
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps");

// if we don't want to bring in other controllers like the getCourses controller inside our bootcamps route, then we can use the concept of 'resource routers'
// Include other resource routers
const courseRouter = require("./courses");

const router = express.Router();

// Re-route into other resource routers
// What the code below means is that when a route like '/:bootcampId/courses' is hit, it will be forwaded to the courseRouter, and the course Router will be responsible for handling that route
router.use("/:bootcampId/courses", courseRouter); // to use other resource routers, we use the router.use() method.

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

router.route("/").get(getBootcamps).post(createBootcamp);

router.route("/:id/photo").put(bootcampPhotoUpload);

router
  .route("/:id")
  .get(getBootcamp)
  .put(updateBootcamp)
  .delete(deleteBootcamp);

module.exports = router;
