const express = require("express");

const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const {
  getOverview,
  listUsers,
  updateUserRole,
  updateUserSuspension,
  deleteUser
} = require("../controllers/adminController");

const router = express.Router();

router.use(auth, allowRoles("admin"));

router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/suspension", updateUserSuspension);
router.delete("/users/:id", deleteUser);

module.exports = router;
