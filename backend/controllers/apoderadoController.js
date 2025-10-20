const Apoderado = require("../models/Apoderado"); // <-- Import corregido

const validateApoderadoData = (data, isUpdate = false) => {
  // <-- Función renombrada
  const errors = [];
  if (!data.primer_nombre) errors.push("El primer nombre es obligatorio.");
  if (!data.primer_apellido) errors.push("El primer apellido es obligatorio.");
  if (!data.dni || data.dni.length < 8)
    errors.push("El DNI es obligatorio y debe ser válido.");
  if (!data.telefono) errors.push("El teléfono es obligatorio.");

  return errors;
};

exports.getAllApoderados = async (req, res) => {
  // <-- Función renombrada
  try {
    const apoderados = await Apoderado.findAll();
    res.json(apoderados);
  } catch (error) {
    console.error("Error en apoderadoController.getAllApoderados:", error);
    res
      .status(500)
      .json({ message: "Error al obtener la lista de apoderados." });
  }
};

exports.getApoderadoById = async (req, res) => {
  // <-- Función renombrada
  try {
    const apoderado = await Apoderado.findById(req.params.id);
    if (!apoderado) {
      return res.status(404).json({ message: "Apoderado no encontrado." });
    }
    res.json(apoderado);
  } catch (error) {
    console.error("Error en apoderadoController.getApoderadoById:", error);
    res
      .status(500)
      .json({ message: "Error al obtener detalles del apoderado." });
  }
};

exports.getApoderadoByDNI = async (req, res) => {
  // <-- Función renombrada
  const { dni } = req.params;
  if (!dni) {
    return res
      .status(400)
      .json({ message: "El DNI es obligatorio para la búsqueda." });
  }
  try {
    const apoderado = await Apoderado.findByDNI(dni);
    if (!apoderado) {
      return res
        .status(404)
        .json({ message: "Apoderado no encontrado con ese DNI." });
    }
    res.json(apoderado);
  } catch (error) {
    console.error("Error en apoderadoController.getApoderadoByDNI:", error);
    res.status(500).json({ message: "Error al buscar apoderado por DNI." });
  }
};

exports.createApoderado = async (req, res) => {
  // <-- Función renombrada
  const apoderadoData = req.body;

  const errors = validateApoderadoData(apoderadoData);
  if (errors.length > 0) {
    return res.status(400).json({ errors: errors });
  }

  try {
    // 1. Verificar unicidad del DNI
    const existingApoderado = await Apoderado.findByDNI(apoderadoData.dni);
    if (existingApoderado) {
      return res
        .status(409)
        .json({ message: "Ya existe un apoderado con ese DNI." });
    }

    const newApoderado = await Apoderado.create(apoderadoData);

    res.status(201).json({
      message: "Apoderado creado exitosamente.",
      apoderado: newApoderado,
    });
  } catch (error) {
    console.error("Error en apoderadoController.createApoderado:", error);
    res.status(500).json({ message: "Error al crear el apoderado." });
  }
};

exports.updateApoderado = async (req, res) => {
  const apoderadoId = req.params.id;
  const apoderadoData = req.body;

  const errors = validateApoderadoData(apoderadoData, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors: errors });
  }

  try {
    // 1. Verificar unicidad del DNI
    const existingApoderadoByDNI = await Apoderado.findByDNI(apoderadoData.dni);
    if (
      existingApoderadoByDNI &&
      existingApoderadoByDNI.id !== parseInt(apoderadoId)
    ) {
      return res
        .status(409)
        .json({ message: "El DNI ya está en uso por otro apoderado." });
    }

    const updatedApoderado = await Apoderado.update(apoderadoId, apoderadoData);

    if (!updatedApoderado) {
      return res
        .status(404)
        .json({ message: "Apoderado no encontrado para actualizar." });
    }

    res.json({
      message: "Apoderado actualizado exitosamente.",
      apoderado: updatedApoderado,
    });
  } catch (error) {
    console.error("Error en apoderadoController.updateApoderado:", error);
    res.status(500).json({ message: "Error al actualizar el apoderado." });
  }
};

exports.deleteApoderado = async (req, res) => {
  const apoderadoId = req.params.id;

  try {
    const success = await Apoderado.remove(apoderadoId);

    if (!success) {
      return res.status(404).json({ message: "Apoderado no encontrado." });
    }

    res.json({ message: "Apoderado eliminado exitosamente." });
  } catch (error) {
    console.error("Error en apoderadoController.deleteApoderado:", error);
    // Capturar el mensaje de error del modelo (si hay FK)
    if (error.message.includes("matrículas asociadas")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al eliminar el apoderado." });
  }
};

exports.getAssociatedStudents = async (req, res) => {
  try {
    const apoderados = await Apoderado.getAssociatedStudents(req.params.id);
    res.json(apoderados);
  } catch (error) {
    console.error("Error al obtener apoderados asociados:", error);
    res
      .status(500)
      .json({ message: "Error al obtener lista de apoderados asociados." });
  }
};

exports.associateStudent = async (req, res) => {
  const apoderadoId = req.params.id;
  const { student_id, parentesco } = req.body;

  if (!student_id || !parentesco) {
    return res
      .status(400)
      .json({ message: "Se requiere student_id y parentesco." });
  }

  try {
    await Apoderado.associateStudent(apoderadoId, student_id, parentesco);
    res.status(201).json({ message: "Estudiante asociado exitosamente." });
  } catch (error) {
    if (error.message.includes("ya está asociado")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al asociar estudiante." });
  }
};

exports.removeStudentAssociation = async (req, res) => {
  const apoderadoId = req.params.id;
  const { studentId } = req.params;

  try {
    const success = await Apoderado.removeStudentAssociation(
      apoderadoId,
      studentId
    );
    if (!success) {
      return res.status(404).json({ message: "Asociación no encontrada." });
    }
    res.json({ message: "Asociación eliminada exitosamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar asociación." });
  }
};
