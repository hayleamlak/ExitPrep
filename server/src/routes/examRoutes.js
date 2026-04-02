const express = require("express");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const { listExams, createExam } = require("../controllers/examController");

const router = express.Router();

router.get("/", listExams);
router.post("/", auth, allowRoles("admin"), createExam);

module.exports = router;
