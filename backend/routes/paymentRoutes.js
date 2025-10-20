const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const rolesPermitidos = ["Administrador", "Secretaria"];

// Obtener resumen financiero de una matrícula
router.get(
  "/summary/:matriculaId",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getEnrollmentFinancialSummary
);

// Obtener métodos de pago disponibles
router.get(
  "/methods",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getPaymentMethods
);

// Obtener pagos de una cuota específica (para constancias)
router.get(
  "/cuota/:cuotaId",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getPaymentsByCuota
);

// Obtener un pago específico por ID (para constancia individual)
router.get(
  "/pago/:pagoId",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getPaymentById
);

// Registrar un nuevo pago
router.post(
  "/register",
  protect,
  authorize(...rolesPermitidos),
  paymentController.registerPayment
);

module.exports = router;
