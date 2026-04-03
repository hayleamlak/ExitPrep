const express = require("express");
const auth = require("../middleware/auth");
const { getMyInsights } = require("../controllers/insightsController");

const router = express.Router();

router.get("/me", auth, getMyInsights);

module.exports = router;