const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const rolesPermitidos = ["Administrador", "Secretaria"];

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
router.get(
  "/cuota/:cuotaId",
  protect,
  authorize(...rolesPermitidos),
  paymentController.getPaymentsByCuota
);

// Registrar pago
router.post(
  "/register",
  protect,
  authorize(...rolesPermitidos),
  paymentController.registerPayment
);

module.exports = router;
