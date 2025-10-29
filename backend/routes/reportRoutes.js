const express = require("express");
const reportController = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const rolesPermitidos = ["Administrador"];

// Obtiene datos necesarios para selectores de reportes
router.get(
  "/selectors",
  protect,
  authorize(...rolesPermitidos),
  reportController.getReportSelectors
);

// 1. Reporte por Estudiante
router.get(
  "/student/:studentId",
  protect,
  authorize(...rolesPermitidos),
  reportController.getStudentReport
);

// 2. Reporte Resumen por Período
router.get(
  "/period/summary/:periodoId",
  protect,
  authorize(...rolesPermitidos),
  reportController.getPeriodSummaryReport
);

// 3. Reporte Histórico de Pagos (filtros por query params)
router.get(
  "/history/payments",
  protect,
  authorize(...rolesPermitidos),
  reportController.getPaymentHistoryReport
);

router.get(
  "/obligations",
  protect,
  authorize(...rolesPermitidos),
  reportController.getObligationReport
);
// (Aquí irían los reportes por Grado/Sección si fueran más complejos)

module.exports = router;
