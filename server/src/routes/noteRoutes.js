const express = require("express");
const auth = require("../middleware/auth");
const { listNotes } = require("../controllers/noteController");

const router = express.Router();

router.get("/", auth, listNotes);

module.exports = router;
