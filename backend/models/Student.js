const pool = require("../config/db");

const Student = {
  // Busca un estudiante por ID
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM estudiantes WHERE id = ?",
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error en Student.findById:", error);
      throw error;
    }
  },

  // Busca un estudiante por DNI (numero_identificacion)
  findByDNI: async (dni) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM estudiantes WHERE numero_identificacion = ?",
        [dni]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error en Student.findByDNI:", error);
      throw error;
    }
  },

  // Crea un nuevo estudiante
  create: async (studentData) => {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      fecha_nacimiento,
      genero,
      numero_identificacion,
    } = studentData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO estudiantes (
                    primer_nombre, 
                    segundo_nombre, 
                    primer_apellido, 
                    segundo_apellido, 
                    fecha_nacimiento, 
                    genero, 
                    numero_identificacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          fecha_nacimiento,
          genero,
          numero_identificacion,
        ]
      );
      return { id: result.insertId, ...studentData };
    } catch (error) {
      console.error("Error en Student.create:", error);
      throw error;
    }
  },

  // Actualiza un estudiante existente
  update: async (id, studentData) => {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      fecha_nacimiento,
      genero,
      numero_identificacion,
    } = studentData;

    try {
      const [result] = await pool.execute(
        `UPDATE estudiantes SET 
                    primer_nombre = ?, 
                    segundo_nombre = ?, 
                    primer_apellido = ?, 
                    segundo_apellido = ?, 
                    fecha_nacimiento = ?, 
                    genero = ?, 
                    numero_identificacion = ?
                WHERE id = ?`,
        [
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          fecha_nacimiento,
          genero,
          numero_identificacion,
          id,
        ]
      );

      if (result.affectedRows === 0) return null;
      return { id, ...studentData };
    } catch (error) {
      console.error("Error en Student.update:", error);
      throw error;
    }
  },

  // Obtiene todos los estudiantes
  findAll: async () => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
                    id, 
                    primer_nombre, 
                    primer_apellido, 
                    numero_identificacion,
                    fecha_nacimiento
                FROM estudiantes 
                ORDER BY primer_apellido, primer_nombre`
      );
      return rows;
    } catch (error) {
      console.error("Error en Student.findAll:", error);
      throw error;
    }
  },

  // Obtiene el historial de matrículas para un estudiante
  getEnrollmentHistory: async (studentId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
                    m.id AS matricula_id,
                    m.fecha_matricula,
                    m.estado,
                    p.nombre AS periodo,
                    n.nombre AS nivel,
                    g.nombre AS grado,
                    s.nombre AS seccion
                FROM matriculas m
                JOIN periodos p ON m.periodo_id = p.id
                JOIN secciones s ON m.seccion_id = s.id
                JOIN grados g ON s.grado_id = g.id
                JOIN niveles_educativos n ON g.nivel_id = n.id
                WHERE m.estudiante_id = ?
                ORDER BY p.fecha_inicio DESC`,
        [studentId]
      );
      return rows;
    } catch (error) {
      console.error("Error en Student.getEnrollmentHistory:", error);
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const [result] = await pool.execute(
        "DELETE FROM estudiantes WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en Student.remove:", error);
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new Error(
          "No se puede eliminar el estudiante porque tiene matrículas asociadas."
        );
      }
      throw error;
    }
  },
};

module.exports = Student;
