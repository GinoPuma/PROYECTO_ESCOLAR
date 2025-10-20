  const pool = require("../config/db");

  const Report = {
    // 1. Reporte de Historial Detallado del Estudiante
    getStudentFullReport: async (studentId) => {
      const [rows] = await pool.execute(
        `
              SELECT 
                  m.id AS matricula_id, 
                  m.estado AS matricula_estado, 
                  m.created_at AS fecha_matricula,
                  p.nombre AS periodo_nombre, 
                  g.nombre AS grado, 
                  s.nombre AS seccion,
                  c.id AS cuota_id, 
                  c.concepto AS cuota_concepto, 
                  c.monto AS cuota_monto_obligatorio, 
                  c.fecha_limite AS cuota_fecha_limite,
                  pa.id AS pago_id, 
                  pa.monto AS pago_monto, 
                  pa.referencia_pago, 
                  mt.nombre AS metodo_pago_nombre
              FROM matriculas m
              JOIN estudiantes e ON m.estudiante_id = e.id
              LEFT JOIN periodos p ON m.periodo_id = p.id
              LEFT JOIN secciones s ON m.seccion_id = s.id
              LEFT JOIN grados g ON s.grado_id = g.id
              LEFT JOIN cuotas c ON c.periodo_id = m.periodo_id
              LEFT JOIN pagos pa ON pa.matricula_id = m.id AND pa.cuota_id = c.id AND pa.estado = 'Completado'
              LEFT JOIN metodos_pago mt ON pa.metodo_pago_id = mt.id
              WHERE e.id = ?
              ORDER BY m.created_at DESC, c.orden
          `,
        [studentId]
      );
      return rows;
    },

    // 2. Reporte Resumen por Período
    getPeriodSummary: async (periodoId) => {
      // Obtenemos datos de matriculados y total de ingresos
      const [rows] = await pool.execute(
        `
              SELECT 
                  (SELECT COUNT(DISTINCT estudiante_id) FROM matriculas WHERE periodo_id = ?) AS total_matriculados,
                  (SELECT SUM(p.monto) 
                      FROM pagos p 
                      JOIN matriculas m ON p.matricula_id = m.id 
                      WHERE m.periodo_id = ? AND p.estado = 'Completado') AS total_ingresos,
                  (SELECT SUM(c.monto) FROM cuotas c WHERE c.periodo_id = ?) AS total_obligacion
          `,
        [periodoId, periodoId, periodoId]
      );

      const summary = rows[0];

      // Calculamos la deuda pendiente
      summary.total_deuda =
        parseFloat(summary.total_obligacion) -
          parseFloat(summary.total_ingresos) || 0;

      return summary;
    },

    // 3. Histórico de Pagos (Sin fecha_pago)
    getPaymentHistory: async (methodId) => {
      let query = `
              SELECT 
                  pa.id, 
                  pa.monto, 
                  pa.referencia_pago,
                  e.primer_nombre AS est_nombre, 
                  e.primer_apellido AS est_apellido,
                  mt.nombre AS metodo, 
                  c.concepto AS cuota_concepto
              FROM pagos pa
              JOIN matriculas m ON pa.matricula_id = m.id
              JOIN estudiantes e ON m.estudiante_id = e.id
              LEFT JOIN cuotas c ON pa.cuota_id = c.id
              LEFT JOIN metodos_pago mt ON pa.metodo_pago_id = mt.id
              WHERE pa.estado = 'Completado'
          `;
      const params = [];

      if (methodId) {
        query += " AND pa.metodo_pago_id = ?";
        params.push(methodId);
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    },
  };

  module.exports = Report;
