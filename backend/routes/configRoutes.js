const express = require("express");
const configController = require("../controllers/configController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const ADMIN = "Administrador";

/* --- Estructura Educativa (Niveles, Grados, Secciones) --- */
router.get(
  "/estructura",
  protect,
  authorize(ADMIN),
  configController.getStructureData
);

// Niveles
router.post(
  "/niveles",
  protect,
  authorize(ADMIN),
  configController.createNivel
);
router.put(
  "/niveles/:id",
  protect,
  authorize(ADMIN),
  configController.updateNivel
);
router.delete(
  "/niveles/:id",
  protect,
  authorize(ADMIN),
  configController.deleteNivel
);

// Grados
router.post("/grados", protect, authorize(ADMIN), configController.createGrado);
router.put(
  "/grados/:id",
  protect,
  authorize(ADMIN),
  configController.updateGrado
);
router.delete(
  "/grados/:id",
  protect,
  authorize(ADMIN),
  configController.deleteGrado
);

// Secciones
router.post(
  "/secciones",
  protect,
  authorize(ADMIN),
  configController.createSeccion
);
router.put(
  "/secciones/:id",
  protect,
  authorize(ADMIN),
  configController.updateSeccion
);
router.delete(
  "/secciones/:id",
  protect,
  authorize(ADMIN),
  configController.deleteSeccion
);

/* --- Periodos --- */
router.get(
  "/periodos",
  protect,
  authorize(ADMIN),
  configController.getAllPeriodos
);
router.post(
  "/periodos",
  protect,
  authorize(ADMIN),
  configController.createPeriodo
);
router.put(
  "/periodos/:id",
  protect,
  authorize(ADMIN),
  configController.updatePeriodo
);
router.delete(
  "/periodos/:id",
  protect,
  authorize(ADMIN),
  configController.deletePeriodo
);

/* --- Cuotas --- */
router.get(
  "/periodos/:periodoId/cuotas",
  protect,
  authorize(ADMIN),
  configController.getPeriodoCuotas
);
router.post("/cuotas", protect, authorize(ADMIN), configController.createCuota);
router.put(
  "/cuotas/:id",
  protect,
  authorize(ADMIN),
  configController.updateCuota
);
router.delete(
  "/cuotas/:id",
  protect,
  authorize(ADMIN),
  configController.deleteCuota
);

/* --- Tipos de Pago --- */
router.get(
  "/tipos-pago",
  protect,
  authorize(ADMIN),
  configController.getAllTiposPago
);
router.post(
  "/tipos-pago",
  protect,
  authorize(ADMIN),
  configController.createTipoPago
);
router.put(
  "/tipos-pago/:id",
  protect,
  authorize(ADMIN),
  configController.updateTipoPago
);
router.delete(
  "/tipos-pago/:id",
  protect,
  authorize(ADMIN),
  configController.deleteTipoPago
);

/* --- Métodos de Pago --- */
router.get(
  "/metodos-pago",
  protect,
  authorize(ADMIN),
  configController.getAllMetodosPago
);
router.post(
  "/metodos-pago",
  protect,
  authorize(ADMIN),
  configController.createMetodoPago
);
router.put(
  "/metodos-pago/:id",
  protect,
  authorize(ADMIN),
  configController.updateMetodoPago
);
router.delete(
  "/metodos-pago/:id",
  protect,
  authorize(ADMIN),
  configController.deleteMetodoPago
);

router.get(
  "/institution",
  protect,
  authorize(ADMIN),
  configController.getInstitution
);
router.post(
  "/institution",
  protect,
  authorize(ADMIN),
  configController.saveInstitution
);
router.put(
  "/institution/:id",
  protect,
  authorize(ADMIN),
  configController.saveInstitution
); 

module.exports = router;
