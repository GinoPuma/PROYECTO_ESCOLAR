const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const rolesPermitidos = ["Administrador", "Secretaria"];

// Obtener métodos de pago
router.get(
  "/methods",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getPaymentMethods
);

// Obtener estado de cuenta y cuotas
router.get(
  "/summary/:matriculaId",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getEnrollmentFinancialSummary
);

// Registrar pago
router.post(
  "/register",
  protect,
  authorize(...rolesPermitidos),
  paymentController.registerPayment
);

module.exports = router;
