const express = require("express");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const { listQuestions, createQuestion, bulkCreateQuestions } = require("../controllers/questionController");

const router = express.Router();

router.get("/", listQuestions);
router.post("/", auth, allowRoles("admin"), createQuestion);
router.post("/bulk", auth, allowRoles("admin"), bulkCreateQuestions);

module.exports = router;
