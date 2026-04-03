const express = require("express");
const auth = require("../middleware/auth");
const {
	dashboardRecommendation,
	addActivity,
	summarizeNotes,
	generateQuiz,
	explainAnswer,
	recommendWeakTopics,
	generateStudyPlan
} = require("../controllers/aiController");

const router = express.Router();

router.post("/dashboard", auth, dashboardRecommendation);
router.post("/activity", auth, addActivity);
router.post("/summarize", auth, summarizeNotes);
router.post("/quiz", auth, generateQuiz);
router.post("/explain", auth, explainAnswer);
router.post("/recommend", auth, recommendWeakTopics);
router.post("/study-plan", auth, generateStudyPlan);

module.exports = router;
