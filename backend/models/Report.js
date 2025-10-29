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
    // --- Paso 1: Contar matrículas activas y sumar sus obligaciones de cuotas ---
    const [obligationRows] = await pool.execute(
      `
            SELECT 
                COUNT(m.id) AS total_matriculados,
                -- Suma de las obligaciones (Monto de la Cuota * Matrículas activas)
                SUM(t_cuotas.monto_cuota) AS total_obligacion_calculada
            FROM matriculas m
            JOIN (
                -- Subconsulta para sumar el monto total de cuotas para el periodo
                SELECT SUM(monto) AS monto_cuota 
                FROM cuotas 
                WHERE periodo_id = ?
            ) t_cuotas
            WHERE m.periodo_id = ? AND m.estado = 'Activa';
        `,
      [periodoId, periodoId]
    );

    const summaryBase = obligationRows[0];

    // --- Paso 2: Calcular el Total de Ingresos (Pagos Completados) ---
    const [ingresosRow] = await pool.execute(
      `
            SELECT SUM(p.monto) AS total_ingresos
            FROM pagos p 
            JOIN matriculas m ON p.matricula_id = m.id 
            WHERE m.periodo_id = ? AND p.estado = 'Completado';
        `,
      [periodoId]
    );

    const totalIngresos = ingresosRow[0].total_ingresos || 0;

    // --- Paso 3: Calcular la Deuda Pendiente ---
    const totalObligacion = parseFloat(
      summaryBase.total_obligacion_calculada || 0
    );
    const totalIngresosFloat = parseFloat(totalIngresos);

    // El total de deuda es la diferencia
    const totalDeuda = totalObligacion - totalIngresosFloat;

    return {
      total_matriculados: parseInt(summaryBase.total_matriculados || 0),
      total_ingresos: totalIngresosFloat,
      total_obligacion: totalObligacion,
      total_deuda: totalDeuda,
    };
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
  getObligationReport: async (statusFilter) => {
    let query = `
            SELECT 
                m.id AS matricula_id,
                e.primer_nombre AS est_nombre, 
                e.primer_apellido AS est_apellido,
                c.concepto,
                c.fecha_limite,
                c.monto AS monto_obligatorio,
                (SELECT SUM(p.monto) FROM pagos p WHERE p.cuota_id = c.id AND p.estado = 'Completado') AS monto_pagado
            FROM cuotas c
            JOIN matriculas m ON c.periodo_id = m.periodo_id
            JOIN estudiantes e ON m.estudiante_id = e.id
            ORDER BY m.id, c.fecha_limite DESC
        `;

    const [rows] = await pool.execute(query);
    return rows;
  },
};

module.exports = Report;
