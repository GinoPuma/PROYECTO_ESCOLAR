const Student = require("../models/Student");

const validateStudentData = (data) => {
  const errors = [];
  if (!data.primer_nombre) errors.push("El primer nombre es obligatorio.");
  if (!data.primer_apellido) errors.push("El primer apellido es obligatorio.");
  if (!data.fecha_nacimiento)
    errors.push("La fecha de nacimiento es obligatoria.");
  if (data.fecha_nacimiento) {
    const birthDate = new Date(data.fecha_nacimiento);
    const today = new Date();

    // 1. VALIDACIÓN: No puede ser una fecha futura
    if (birthDate > today) {
      errors.push("La fecha de nacimiento no puede ser futura.");
    }

    const maxAge = 18;
    const limitDate = new Date(
      today.getFullYear() - maxAge,
      today.getMonth(),
      today.getDate()
    );

    if (birthDate < limitDate) {
      errors.push(
        `El estudiante no debe ser mayor de ${maxAge} años para ingresar al colegio.`
      );
    }
  }
  if (!data.genero || !["Masculino", "Femenino"].includes(data.genero))
    errors.push("El género debe ser 'Masculino' o 'Femenino'.");
  if (!data.numero_identificacion || data.numero_identificacion.length < 8)
    errors.push(
      "El número de identificación (DNI) es obligatorio y debe ser válido."
    );

  // Convertir fecha a formato SQL si es necesario
  if (data.fecha_nacimiento) {
    data.fecha_nacimiento = new Date(data.fecha_nacimiento)
      .toISOString()
      .split("T")[0];
  }

  return errors;
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (error) {
    console.error("Error en studentController.getAllStudents:", error);
    res
      .status(500)
      .json({ message: "Error al obtener la lista de estudiantes." });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Estudiante no encontrado." });
    }
    res.json(student);
  } catch (error) {
    console.error("Error en studentController.getStudentById:", error);
    res
      .status(500)
      .json({ message: "Error al obtener detalles del estudiante." });
  }
};

exports.getStudentByDNI = async (req, res) => {
  const { dni } = req.params;
  if (!dni) {
    return res
      .status(400)
      .json({ message: "El DNI es obligatorio para la búsqueda." });
  }
  try {
    const student = await Student.findByDNI(dni);
    if (!student) {
      return res
        .status(404)
        .json({ message: "Estudiante no encontrado con ese DNI." });
    }
    res.json(student);
  } catch (error) {
    console.error("Error en studentController.getStudentByDNI:", error);
    res.status(500).json({ message: "Error al buscar estudiante por DNI." });
  }
};

exports.createStudent = async (req, res) => {
  const studentData = req.body;

  const errors = validateStudentData(studentData);
  if (errors.length > 0) {
    return res.status(400).json({ errors: errors });
  }

  try {
    // 1. Verificar unicidad del DNI
    const existingStudent = await Student.findByDNI(
      studentData.numero_identificacion
    );
    if (existingStudent) {
      return res.status(409).json({
        message:
          "Ya existe un estudiante con ese número de identificación (DNI).",
      });
    }

    const newStudent = await Student.create(studentData);
    // Excluir datos sensibles o innecesarios en la respuesta
    delete newStudent.created_at;
    delete newStudent.updated_at;

    res.status(201).json({
      message: "Estudiante creado exitosamente.",
      student: newStudent,
    });
  } catch (error) {
    console.error("Error en studentController.createStudent:", error);
    res.status(500).json({ message: "Error al crear el estudiante." });
  }
};

exports.updateStudent = async (req, res) => {
  const studentId = req.params.id;
  const studentData = req.body;

  const errors = validateStudentData(studentData);
  if (errors.length > 0) {
    return res.status(400).json({ errors: errors });
  }

  try {
    // 1. Verificar unicidad del DNI (si el DNI se cambia)
    const existingStudentByDNI = await Student.findByDNI(
      studentData.numero_identificacion
    );
    if (
      existingStudentByDNI &&
      existingStudentByDNI.id !== parseInt(studentId)
    ) {
      return res.status(409).json({
        message:
          "El número de identificación (DNI) ya está en uso por otro estudiante.",
      });
    }

    const updatedStudent = await Student.update(studentId, studentData);

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ message: "Estudiante no encontrado para actualizar." });
    }

    res.json({
      message: "Estudiante actualizado exitosamente.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error en studentController.updateStudent:", error);
    res.status(500).json({ message: "Error al actualizar el estudiante." });
  }
};

exports.getStudentMatriculaHistory = async (req, res) => {
  const studentId = req.params.id;
  try {
    const history = await Student.getEnrollmentHistory(studentId);
    res.json(history);
  } catch (error) {
    console.error(
      "Error en studentController.getStudentMatriculaHistory:",
      error
    );
    res
      .status(500)
      .json({ message: "Error al obtener el historial de matrículas." });
  }
};

exports.deleteStudent = async (req, res) => {
  const studentId = req.params.id;

  try {
    const success = await Student.remove(studentId);

    if (!success) {
      return res.status(404).json({ message: "Estudiante no encontrado." });
    }

    res.json({ message: "Estudiante eliminado exitosamente." });
  } catch (error) {
    console.error("Error en studentController.deleteStudent:", error);
    if (error.message.includes("matrículas asociadas")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al eliminar el estudiante." });
  }
};

exports.getAssociatedApoderados = async (req, res) => {
  try {
    const apoderados = await Student.getAssociatedApoderados(req.params.id);
    res.json(apoderados);
  } catch (error) {
    console.error("Error al obtener apoderados asociados:", error);
    res
      .status(500)
      .json({ message: "Error al obtener lista de apoderados asociados." });
  }
};

exports.associateApoderado = async (req, res) => {
  const studentId = req.params.id;
  const { apoderado_id, parentesco } = req.body;

  if (!apoderado_id || !parentesco) {
    return res
      .status(400)
      .json({ message: "Se requiere apoderado_id y parentesco." });
  }

  try {
    await Student.associateApoderado(studentId, apoderado_id, parentesco);
    res.status(201).json({ message: "Apoderado asociado exitosamente." });
  } catch (error) {
    if (error.message.includes("ya está asociado")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al asociar apoderado." });
  }
};

exports.removeApoderadoAssociation = async (req, res) => {
  const studentId = req.params.id;
  const { apoderadoId } = req.params;

  try {
    const success = await Student.removeApoderadoAssociation(
      studentId,
      apoderadoId
    );
    if (!success) {
      return res.status(404).json({ message: "Asociación no encontrada." });
    }
    res.json({ message: "Asociación eliminada exitosamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar asociación." });
  }
};
