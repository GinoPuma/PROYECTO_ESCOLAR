const pool = require("../config/db");
const AcademicConfig = require("./AcademicConfig"); // Necesario para calcular cuotas

const Enrollment = {
    // Obtiene todas las matrículas activas con detalles
    findAll: async () => {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    m.id, m.estado, m.created_at AS fecha_matricula,
                    e.primer_nombre AS estudiante_nombre, e.primer_apellido AS estudiante_apellido,
                    a.primer_nombre AS apoderado_nombre, a.primer_apellido AS apoderado_apellido,
                    p.nombre AS periodo, 
                    g.nombre AS grado, s.nombre AS seccion
                FROM matriculas m
                JOIN estudiantes e ON m.estudiante_id = e.id
                LEFT JOIN apoderado a ON m.apoderado_id = a.id
                JOIN periodos p ON m.periodo_id = p.id
                JOIN secciones s ON m.seccion_id = s.id
                JOIN grados g ON s.grado_id = g.id
                ORDER BY m.created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error("Error en Enrollment.findAll:", error);
            throw error;
        }
    },

    // Obtiene una matrícula por ID
    findById: async (id) => {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    m.*, 
                    e.numero_identificacion AS estudiante_dni,
                    a.dni AS apoderado_dni
                FROM matriculas m
                JOIN estudiantes e ON m.estudiante_id = e.id
                LEFT JOIN apoderado a ON m.apoderado_id = a.id
                WHERE m.id = ?
            `, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error en Enrollment.findById:", error);
            throw error;
        }
    },

    // Calcula el resumen de costos para un periodo
    calculateCosts: async (periodo_id) => {
        const cuotas = await AcademicConfig.getCuotasByPeriodo(periodo_id);

        const total_monto = cuotas.reduce((sum, cuota) => sum + parseFloat(cuota.monto), 0);
        const numero_cuotas = cuotas.length;

        return { cuotas, total_monto, numero_cuotas };
    },

    // Crea una nueva matrícula
    create: async (data) => {
        const { estudiante_id, apoderado_id, seccion_id, periodo_id, estado = 'Activa' } = data;

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
        const { estudiante_id, apoderado_id, seccion_id, periodo_id, estado } = data;

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
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error("No se puede eliminar la matrícula porque tiene pagos asociados. Cámbiela a Inactiva.");
            }
            throw error;
        }
    }
};

module.exports = Enrollment;