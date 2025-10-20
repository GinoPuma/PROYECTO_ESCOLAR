const express = require("express");
const studentController = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const rolesPermitidos = ["Administrador", "Secretaria"];

// Listar todos los estudiantes
router.get(
  "/",
  protect,
  authorize(...rolesPermitidos),
  studentController.getAllStudents
);

// Buscar estudiante por DNI (Flujo de búsqueda)
router.get(
  "/dni/:dni",
  protect,
  authorize(...rolesPermitidos),
  studentController.getStudentByDNI
);

// Obtener un estudiante por ID
router.get(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  studentController.getStudentById
);

// Crear nuevo estudiante
router.post(
  "/",
  protect,
  authorize(...rolesPermitidos),
  studentController.createStudent
);

// Actualizar estudiante
router.put(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  studentController.updateStudent
);

// Obtener historial de matrículas (para el requisito de consulta de historial)
router.get(
  "/:id/history",
  protect,
  authorize(...rolesPermitidos),
  studentController.getStudentMatriculaHistory
);

router.delete(
  "/:id",
  protect,
  authorize(...rolesPermitidos),
  studentController.deleteStudent
);

router.get(
  "/:id/apoderados",
  protect,
  authorize(...rolesPermitidos),
  studentController.getAssociatedApoderados
);
router.post(
  "/:id/apoderados",
  protect,
  authorize(...rolesPermitidos),
  studentController.associateApoderado
);
router.delete(
  "/:id/apoderados/:apoderadoId",
  protect,
  authorize(...rolesPermitidos),
  studentController.removeApoderadoAssociation
);

module.exports = router;
