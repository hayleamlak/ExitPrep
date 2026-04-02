const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

router.get("/register", (_req, res) => {
	res.status(405).json({ message: "Use POST /api/auth/register to create an account." });
});

router.post("/register", register);

router.get("/login", (_req, res) => {
	res.status(405).json({ message: "Use POST /api/auth/login to sign in." });
});

router.post("/login", login);

module.exports = router;
