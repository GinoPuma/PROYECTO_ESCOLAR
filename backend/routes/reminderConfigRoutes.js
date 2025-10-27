const express = require("express");
const controller = require("../controllers/reminderConfigController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const ADMIN = "Administrador";

router.get("/", protect, authorize(ADMIN), controller.getAllRules);
router.post("/", protect, authorize(ADMIN), controller.createRule);
router.put("/:id", protect, authorize(ADMIN), controller.updateRule);
router.delete("/:id", protect, authorize(ADMIN), controller.deleteRule);
router.post("/execute/:id", protect, authorize(ADMIN), controller.executeReminderRule);

module.exports = router;
