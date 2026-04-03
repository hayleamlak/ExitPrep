const express = require("express");
const auth = require("../middleware/auth");
const {
  createAttempt,
  createAttemptsBulk,
  listCourses,
  getInsightsByCourse
} = require("../controllers/attemptController");

const router = express.Router();

router.post("/", auth, createAttempt);
router.post("/bulk", auth, createAttemptsBulk);
router.get("/courses", auth, listCourses);
router.get("/insights", auth, getInsightsByCourse);

module.exports = router;