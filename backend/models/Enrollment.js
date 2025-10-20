const pool = require("../config/db");
const AcademicConfig = require("./AcademicConfig");

const Enrollment = {
  // Obtiene todas las matrículas activas con detalles
  findAll: async () => {
    try {
      const [rows] = await pool.execute(`
                SELECT 
                    m.id, m.estado, m.created_at AS fecha_matricula, m.seccion_id, 
                    e.primer_nombre AS estudiante_nombre, 
                    e.primer_apellido AS estudiante_apellido,
                    e.numero_identificacion AS estudiante_dni,
                    a.primer_nombre AS apoderado_nombre, 
                    a.primer_apellido AS apoderado_apellido,
                    p.nombre AS periodo, 
                    g.nombre AS grado, g.id AS grado_id,                 
                    s.nombre AS seccion, s.id AS seccion_id_actual,      
                    n.nombre AS nivel, n.id AS nivel_id                 
                FROM matriculas m
                JOIN estudiantes e ON m.estudiante_id = e.id
                LEFT JOIN apoderado a ON m.apoderado_id = a.id
                JOIN periodos p ON m.periodo_id = p.id
                JOIN secciones s ON m.seccion_id = s.id
                JOIN grados g ON s.grado_id = g.id
                JOIN niveles_educativos n ON g.nivel_id = n.id         
                ORDER BY m.created_at DESC
            `);
      return rows;
    } catch (error) {
      console.error("Error en Enrollment.findAll:", error);
      throw error;
    }
  },

  // Obtiene una matrícula por ID CON DATOS DE INSTITUCIÓN
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        `
                SELECT 
                    m.*, 
                    e.primer_nombre AS estudiante_nombre,
                    e.primer_apellido AS estudiante_apellido,
                    e.numero_identificacion AS estudiante_dni,
                    e.fecha_nacimiento AS estudiante_fecha_nacimiento,
                    a.primer_nombre AS apoderado_nombre,
                    a.primer_apellido AS apoderado_apellido,
                    a.dni AS apoderado_dni,
                    a.telefono AS apoderado_telefono,
                    p.nombre AS periodo_nombre,
                    g.nombre AS grado_nombre,
                    s.nombre AS seccion_nombre,
                    n.nombre AS nivel_nombre,
                    i.nombre AS institucion_nombre,
                    i.direccion AS institucion_direccion,
                    i.telefono AS institucion_telefono,
                    i.email AS institucion_email
                FROM matriculas m
                JOIN estudiantes e ON m.estudiante_id = e.id
                LEFT JOIN apoderado a ON m.apoderado_id = a.id
                JOIN periodos p ON m.periodo_id = p.id
                JOIN secciones s ON m.seccion_id = s.id
                JOIN grados g ON s.grado_id = g.id
                JOIN niveles_educativos n ON g.nivel_id = n.id
                LEFT JOIN institucion i ON i.id = 1
                WHERE m.id = ?
            `,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error en Enrollment.findById:", error);
      throw error;
    }
  },

  // Calcula el resumen de costos para un periodo
  calculateCosts: async (periodo_id) => {
    const cuotas = await AcademicConfig.getCuotasByPeriodo(periodo_id);

    const total_monto = cuotas.reduce(
      (sum, cuota) => sum + parseFloat(cuota.monto),
      0
    );
    const numero_cuotas = cuotas.length;

    return { cuotas, total_monto, numero_cuotas };
  },

  // Crea una nueva matrícula
  create: async (data) => {
    const {
      estudiante_id,
      apoderado_id,
      seccion_id,
      periodo_id,
      estado = "Activa",
    } = data;

    try {
      const [result] = await pool.execute(
        `INSERT INTO matriculas (estudiante_id, apoderado_id, seccion_id, periodo_id, estado) 
                 VALUES (?, ?, ?, ?, ?)`,
        [estudiante_id, apoderado_id, seccion_id, periodo_id, estado]
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error("Error en Enrollment.create:", error);
      throw error;
    }
  },

  // Actualiza una matrícula existente
  update: async (id, data) => {
    const { estudiante_id, apoderado_id, seccion_id, periodo_id, estado } =
      data;

    try {
      const [result] = await pool.execute(
        `UPDATE matriculas SET 
                    estudiante_id = ?, apoderado_id = ?, seccion_id = ?, periodo_id = ?, estado = ?
                 WHERE id = ?`,
        [estudiante_id, apoderado_id, seccion_id, periodo_id, estado, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en Enrollment.update:", error);
      throw error;
    }
  },

  // Elimina una matrícula (solo si no tiene pagos asociados)
  remove: async (id) => {
    try {
      const [result] = await pool.execute(
        "DELETE FROM matriculas WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en Enrollment.remove:", error);
      // Manejo de error de clave foránea si hay pagos
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new Error(
          "No se puede eliminar la matrícula porque tiene pagos asociados. Cámbiela a Inactiva."
        );
      }
      throw error;
    }
  },
  existsByStudentAndPeriod: async (
    student_id,
    periodo_id,
    currentEnrollmentId = null
  ) => {
    let query =
      "SELECT id FROM matriculas WHERE estudiante_id = ? AND periodo_id = ?";
    const params = [student_id, periodo_id];

    // Excluir la matrícula actual si estamos en modo edición (UPDATE)
    if (currentEnrollmentId) {
      query += " AND id != ?";
      params.push(currentEnrollmentId);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length > 0; // True si se encuentra una coincidencia
  },
};

module.exports = Enrollment;
