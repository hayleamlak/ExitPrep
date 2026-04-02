const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = auth;
