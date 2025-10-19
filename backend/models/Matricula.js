const pool = require("../config/db");

const Matricula = {
  getPrerequisites: async () => {
    try {
      const [periodos] = await pool.execute(
        "SELECT id, nombre, activo FROM periodos ORDER BY fecha_inicio DESC"
      );
      // Filtramos Tipos de Pago que contengan 'Matrícula' o 'Mensualidad' en el nombre
      const [tiposPago] = await pool.execute(
        "SELECT id, nombre, precio_fijo FROM tipos_pago WHERE nombre LIKE '%Matricula%' OR nombre LIKE '%Pension%'"
      );
      const [secciones] = await pool.execute(`
                SELECT 
                    s.id, s.nombre AS seccion_nombre,
                    g.id AS grado_id, g.nombre AS grado_nombre,
                    n.id AS nivel_id, n.nombre AS nivel_nombre
                FROM secciones s
                JOIN grados g ON s.grado_id = g.id
                JOIN niveles_educativos n ON g.nivel_id = n.id
                ORDER BY n.id, g.id, s.nombre
            `);

      return { periodos, tiposPago, secciones };
    } catch (error) {
      console.error("Error en Matricula.getPrerequisites:", error);
      throw error;
    }
  },

  create: async (data) => {
    const {
      estudiante_id,
      apoderado_id,
      seccion_id,
      periodo_id,
      fecha_matricula,
      estado = "Activa",
    } = data;

    try {
      const [result] = await pool.execute(
        `INSERT INTO matriculas (estudiante_id, apoderado_id, seccion_id, periodo_id, fecha_matricula, estado) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          estudiante_id,
          apoderado_id,
          seccion_id,
          periodo_id,
          fecha_matricula,
          estado,
        ]
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      console.error("Error en Matricula.create:", error);
      throw error;
    }
  },

  findAll: async () => {
    const [rows] = await pool.execute(`
            SELECT 
                m.id, m.fecha_matricula, m.estado,
                CONCAT(e.primer_nombre, ' ', e.primer_apellido) AS estudiante_nombre,
                CONCAT(a.primer_nombre, ' ', a.primer_apellido) AS apoderado_nombre,
                p.nombre AS periodo,
                g.nombre AS grado,
                s.nombre AS seccion
            FROM matriculas m
            JOIN estudiantes e ON m.estudiante_id = e.id
            LEFT JOIN apoderado a ON m.apoderado_id = a.id
            JOIN periodos p ON m.periodo_id = p.id
            JOIN secciones s ON m.seccion_id = s.id
            JOIN grados g ON s.grado_id = g.id
            ORDER BY m.fecha_matricula DESC
        `);
    return rows;
  },

  findByStudentAndPeriod: async (estudiante_id, periodo_id) => {
    const [rows] = await pool.execute(
      "SELECT id FROM matriculas WHERE estudiante_id = ? AND periodo_id = ? AND estado = 'Activa'",
      [estudiante_id, periodo_id]
    );
    return rows[0] || null;
  },
};

module.exports = Matricula;
