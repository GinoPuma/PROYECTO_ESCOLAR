const pool = require("../config/db");

const Stats = {
  getDashboardStats: async () => {
    try {
      // 1. Total Estudiantes
      const [totalEstudiantesRow] = await pool.execute(
        "SELECT COUNT(id) AS count FROM estudiantes"
      );
      const totalEstudiantes = totalEstudiantesRow[0].count;

      // 2. Matrículas Activas
      const [matriculasActivasRow] = await pool.execute(
        "SELECT COUNT(id) AS count FROM matriculas WHERE estado = 'Activa'"
      );
      const matriculasActivas = matriculasActivasRow[0].count;

      // Alternativa Simplificada: Contar cuántas cuotas con fecha límite vencida han sido totalmente pagadas.
      const [pagosDiaRow] = await pool.execute(`
                SELECT COUNT(DISTINCT t1.cuota_id) as count
                FROM (
                    SELECT 
                        c.id AS cuota_id, 
                        c.monto AS monto_obligatorio, 
                        (SELECT SUM(p.monto) FROM pagos p WHERE p.cuota_id = c.id AND p.estado = 'Completado') AS monto_pagado
                    FROM cuotas c
                    WHERE c.fecha_limite <= CURDATE() -- Cuotas cuya fecha límite ya pasó
                ) AS t1
                WHERE t1.monto_pagado >= t1.monto_obligatorio;
            `);

      const pagosDia = pagosDiaRow[0].count;

      return {
        totalEstudiantes: parseInt(totalEstudiantes),
        matriculasActivas: parseInt(matriculasActivas),
        pagosDia: parseInt(pagosDia),
      };
    } catch (error) {
      console.error("Error en Stats.getDashboardStats:", error);
      throw error;
    }
  },
};

module.exports = Stats;
