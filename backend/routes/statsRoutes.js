const express = require("express");
const statsController = require("../controllers/statsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const rolesPermitidos = ["Administrador", "Secretaria"];

router.get(
  "/stats",
  protect,
  authorize(...rolesPermitidos),
  statsController.getStats
);

module.exports = router;
