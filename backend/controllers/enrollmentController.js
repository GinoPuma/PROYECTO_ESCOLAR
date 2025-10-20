const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const Apoderado = require("../models/Apoderado");
const Structure = require("../models/EducationalStructure");
const AcademicConfig = require("../models/AcademicConfig");

const rolesPermitidos = ["Administrador", "Secretaria"];

exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll();
    res.json(enrollments);
  } catch (error) {
    console.error("Error en getAllEnrollments:", error);
    res
      .status(500)
      .json({ message: "Error al obtener la lista de matrículas." });
  }
};

exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: "Matrícula no encontrada." });
    }
    res.json(enrollment);
  } catch (error) {
    console.error("Error en getEnrollmentById:", error);
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la matrícula." });
  }
};

exports.calculateEnrollmentCosts = async (req, res) => {
  const { periodo_id } = req.body;

  if (!periodo_id) {
    return res.status(400).json({
      message: "El ID del período es obligatorio para calcular costos.",
    });
  }

  try {
    const costs = await Enrollment.calculateCosts(periodo_id);
    res.json(costs);
  } catch (error) {
    console.error("Error al calcular costos de matrícula:", error);
    res.status(500).json({ message: "Error al calcular costos." });
  }
};

exports.createEnrollment = async (req, res) => {
  const { estudiante_id, apoderado_id, seccion_id, periodo_id } = req.body;

  if (!estudiante_id || !apoderado_id || !seccion_id || !periodo_id) {
    return res.status(400).json({
      message: "Estudiante, período y sección son campos obligatorios.",
    });
  }

  try {
    const isDuplicate = await Enrollment.existsByStudentAndPeriod(
      estudiante_id,
      periodo_id
    );
    if (isDuplicate) {
      return res.status(409).json({
        message:
          "El estudiante ya tiene una matrícula registrada en este período académico.",
      });
    }
    const studentExists = await Student.findById(estudiante_id);
    if (!studentExists)
      return res.status(404).json({ message: "Estudiante no encontrado." });

    const sectionExists = await Structure.getSeccionById(seccion_id);
    if (!sectionExists)
      return res.status(404).json({ message: "Sección no encontrada." });

    if (apoderado_id && !(await Apoderado.findById(apoderado_id))) {
      return res.status(404).json({ message: "Apoderado no encontrado." });
    }

    const newEnrollment = await Enrollment.create({
      estudiante_id,
      apoderado_id: apoderado_id || null,
      seccion_id,
      periodo_id,
    });

    res.status(201).json({
      message: "Matrícula creada exitosamente.",
      enrollment: newEnrollment,
    });
  } catch (error) {
    console.error("Error en createEnrollment:", error);
    res.status(500).json({ message: "Error interno al crear matrícula." });
  }
};

exports.updateEnrollment = async (req, res) => {
  const enrollmentId = req.params.id;
  const { estudiante_id, apoderado_id, seccion_id, periodo_id, estado } =
    req.body;

  if (!estudiante_id || !seccion_id || !periodo_id || !estado) {
    return res.status(400).json({
      message: "Estudiante, período, sección y estado son obligatorios.",
    });
  }

  try {
    const isDuplicate = await Enrollment.existsByStudentAndPeriod(
      estudiante_id,
      periodo_id,
      enrollmentId
    );
    if (isDuplicate) {
      return res.status(409).json({
        message:
          "Ya existe otra matrícula para este estudiante en el período seleccionado. No se permite duplicidad.",
      });
    }
    const success = await Enrollment.update(enrollmentId, {
      estudiante_id,
      apoderado_id: apoderado_id || null,
      seccion_id,
      periodo_id,
      estado,
    });

    if (!success) {
      return res
        .status(404)
        .json({ message: "Matrícula no encontrada para actualizar." });
    }

    res.json({ message: "Matrícula actualizada exitosamente." });
  } catch (error) {
    console.error("Error en updateEnrollment:", error);
    res.status(500).json({ message: "Error interno al actualizar matrícula." });
  }
};

exports.deleteEnrollment = async (req, res) => {
  try {
    const success = await Enrollment.remove(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Matrícula no encontrada." });
    }
    res.json({ message: "Matrícula eliminada exitosamente." });
  } catch (error) {
    console.error("Error en deleteEnrollment:", error);
    if (error.message.includes("pagos asociados")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al eliminar la matrícula." });
  }
};
