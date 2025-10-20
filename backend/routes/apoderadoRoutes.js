const express = require("express");
const apoderadoController = require("../controllers/apoderadoController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const rolesPermitidos = ["Administrador", "Secretaria"];

// Listar todos
router.get(
  "/",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.getAllApoderados
);

// Buscar apoderado por DNI
router.get(
  "/dni/:dni",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.getApoderadoByDNI
);

// Obtener un apoderado por ID
router.get(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.getApoderadoById
);

// Crear nuevo apoderado
router.post(
  "/",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.createApoderado
);

// Actualizar apoderado
router.put(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.updateApoderado
);

router.delete(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.deleteApoderado
);
router.get(
  "/:id/estudiantes",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.getAssociatedStudents
);
router.post(
  "/:id/estudiantes",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.associateStudent
);
router.delete(
  "/:id/estudiantes/:studentId",
  protect,
  authorize(...rolesPermitidos),
  apoderadoController.removeStudentAssociation
);

module.exports = router;
