const pool = require("../config/db");

const Apoderado = {
  // Busca un apoderado por ID
  findById: async (id) => {
    try {
      // Usamos la tabla 'apoderado'
      const [rows] = await pool.execute(
        "SELECT * FROM apoderado WHERE id = ?",
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error en Apoderado.findById:", error);
      throw error;
    }
  },

  // Busca un apoderado por DNI
  findByDNI: async (dni) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM apoderado WHERE dni = ?",
        [dni]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error en Apoderado.findByDNI:", error);
      throw error;
    }
  },

  // Crea un nuevo apoderado
  create: async (apoderadoData) => {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      dni,
      direccion,
      telefono,
      email,
    } = apoderadoData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO apoderado (
                    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
                    dni, direccion, telefono, email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          dni,
          direccion || null,
          telefono,
          email || null,
        ]
      );
      return { id: result.insertId, ...apoderadoData };
    } catch (error) {
      console.error("Error en Apoderado.create:", error);
      throw error;
    }
  },

  // Actualiza un apoderado existente
  update: async (id, apoderadoData) => {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      dni,
      direccion,
      telefono,
      email,
    } = apoderadoData;

    try {
      const [result] = await pool.execute(
        `UPDATE apoderado SET 
                    primer_nombre = ?, segundo_nombre = ?, primer_apellido = ?, 
                    segundo_apellido = ?, dni = ?, direccion = ?, 
                    telefono = ?, email = ?
                WHERE id = ?`,
        [
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          dni,
          direccion || null,
          telefono,
          email || null,  
          id,
        ]
      );

      if (result.affectedRows === 0) return null;
      return { id, ...apoderadoData };
    } catch (error) {
      console.error("Error en Apoderado.update:", error);
      throw error;
    }
  },

  // Obtiene todos los apoderados
  findAll: async () => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
                    id, dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, email
                FROM apoderado 
                ORDER BY primer_apellido, primer_nombre`
      );
      return rows;
    } catch (error) {
      console.error("Error en Apoderado.findAll:", error);
      throw error;
    }
  },
  remove: async (id) => {
    try {
      const [result] = await pool.execute(
        "DELETE FROM apoderado WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en Apoderado.remove:", error);
      // IMPORTANTE: Manejar errores de FOREIGN KEY (matrículas asociadas)
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new Error(
          "No se puede eliminar el apoderado porque tiene matrículas asociadas."
        );
      }
      throw error;
    }
  },

  getAssociatedStudents: async (apoderadoId) => {
    const [rows] = await pool.execute(
      `
            SELECT 
                e.id, e.numero_identificacion AS dni, e.primer_nombre, e.primer_apellido, e.fecha_nacimiento,
                ea.parentesco
            FROM estudiantes e
            JOIN estudiante_apoderado ea ON e.id = ea.estudiante_id
            WHERE ea.apoderado_id = ?
            ORDER BY e.primer_apellido
        `,
      [apoderadoId]
    );
    return rows;
  },

  // La función associateStudent es la misma que associateApoderado, pero la llamamos distinto por claridad
  associateStudent: async (apoderadoId, studentId, parentesco) => {
    try {
      await pool.execute(
        `INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id, parentesco) 
                 VALUES (?, ?, ?)`,
        [studentId, apoderadoId, parentesco]
      );
      return true;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El estudiante ya está asociado a este apoderado.");
      }
      throw error;
    }
  },

  removeStudentAssociation: async (apoderadoId, studentId) => {
    const [result] = await pool.execute(
      `DELETE FROM estudiante_apoderado 
             WHERE estudiante_id = ? AND apoderado_id = ?`,
      [studentId, apoderadoId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Apoderado;
