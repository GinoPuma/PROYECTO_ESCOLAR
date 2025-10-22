const express = require("express");
const aiReminderController = require("../controllers/aiReminderController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const rolesPermitidos = ["Administrador", "Secretaria"];

router.post(
  "/send/:matriculaId",
  protect,
  authorize(...rolesPermitidos),
  aiReminderController.sendReminder
);

module.exports = router;
