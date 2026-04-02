const express = require("express");
const auth = require("../middleware/auth");
const { dashboardRecommendation, addActivity } = require("../controllers/aiController");

const router = express.Router();

router.post("/dashboard", auth, dashboardRecommendation);
router.post("/activity", auth, addActivity);

module.exports = router;
