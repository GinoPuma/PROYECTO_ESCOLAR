const express = require("express");
const enrollmentController = require("../controllers/enrollmentController"); // <-- Controller
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const rolesPermitidos = ["Administrador", "Secretaria"];

// Rutas Generales de Matrícula
router.get(
  "/",
  protect,
  authorize(...rolesPermitidos),
  enrollmentController.getAllEnrollments
);
router.get(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  enrollmentController.getEnrollmentById
);
router.post(
  "/",
  protect,
  authorize(...rolesPermitidos),
  enrollmentController.createEnrollment
);
router.put(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  enrollmentController.updateEnrollment
);
router.delete(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  enrollmentController.deleteEnrollment
);
router.post(
  "/calculate-costs",
  protect,
  authorize(...rolesPermitidos),
  enrollmentController.calculateEnrollmentCosts
);

module.exports = router;
