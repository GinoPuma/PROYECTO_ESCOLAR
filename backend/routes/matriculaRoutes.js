const express = require("express");
const matriculaController = require("../controllers/matriculaController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const rolesPermitidos = ["Administrador", "Secretaria"];

router.get(
  "/prerequisites",
  protect,
  authorize(...rolesPermitidos),
  matriculaController.getMatriculaPrerequisites
);
router.get(
  "/",
  protect,
  authorize(...rolesPermitidos),
  matriculaController.getAllMatriculas
);
router.post(
  "/",
  protect,
  authorize(...rolesPermitidos),
  matriculaController.createMatricula
);

router.get(
  "/period/:periodoId/cuotas-template",
  protect,
  authorize(...rolesPermitidos),
  matriculaController.getPeriodCuotasTemplate
);
module.exports = router;
