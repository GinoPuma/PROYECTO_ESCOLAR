const pool = require("../config/db");

const Payment = {
  // Obtiene los métodos de pago
  getPaymentMethods: async () => {
    const [rows] = await pool.execute(
      "SELECT id, nombre FROM metodos_pago ORDER BY nombre"
    );
    return rows;
  },

  // Obtiene los pagos registrados para una cuota
  getPaymentsForCuota: async (cuotaId) => {
    const [rows] = await pool.execute(
      `
      SELECT 
        pagos.id AS pago_id, 
        pagos.monto, 
        pagos.referencia_pago, 
        pagos.estado, 
        pagos.created_at AS fecha_pago,
        metodos_pago.nombre AS metodo_pago
      FROM pagos
      LEFT JOIN metodos_pago ON pagos.metodo_pago_id = metodos_pago.id
      WHERE pagos.cuota_id = ?
      ORDER BY pagos.id DESC
      `,
      [cuotaId]
    );
    return rows;
  },

  // Obtiene un pago específico por ID
  getPaymentById: async (pagoId) => {
    const [rows] = await pool.execute(
      `
      SELECT 
        pagos.id AS pago_id,
        pagos.matricula_id,
        pagos.cuota_id,
        pagos.monto,
        pagos.referencia_pago,
        pagos.estado,
        pagos.created_at AS fecha_pago,
        metodos_pago.nombre AS metodo_pago,
        cuotas.concepto AS cuota_concepto,
        cuotas.monto AS cuota_monto,
        cuotas.fecha_limite AS cuota_fecha_limite
      FROM pagos
      LEFT JOIN metodos_pago ON pagos.metodo_pago_id = metodos_pago.id
      LEFT JOIN cuotas ON pagos.cuota_id = cuotas.id
      WHERE pagos.id = ?
      `,
      [pagoId]
    );
    return rows[0] || null;
  },

  // Obtiene el resumen financiero de una matrícula (Cuotas vs Pagos)
  getFinancialSummary: async (matriculaId) => {
    const [matriculaRows] = await pool.execute(
      `
      SELECT 
            m.id AS matricula_id,
            m.periodo_id,
            m.estudiante_id,
            m.apoderado_id,
            m.estado AS matricula_estado,
            e.primer_nombre AS est_nombre,
            e.primer_apellido AS est_apellido,
            e.numero_identificacion AS est_dni,
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
      [matriculaId]
    );

    if (matriculaRows.length === 0) return null;
    const summary = matriculaRows[0];

    // Obtener las cuotas del período
    const [cuotasRows] = await pool.execute(
      `
      SELECT 
        c.id AS cuota_id,
        c.concepto,
        c.monto AS monto_obligatorio,
        c.fecha_limite,
        c.orden,
        tp.nombre AS tipo_pago_nombre
      FROM cuotas c
      JOIN tipos_pago tp ON c.tipo_pago_id = tp.id
      WHERE c.periodo_id = ?
      ORDER BY c.orden, c.fecha_limite
    `,
      [summary.periodo_id]
    );

    summary.cuotas = cuotasRows;

    // Obtener los pagos completados CON fecha de pago (created_at)
    const [pagosRows] = await pool.execute(
      `
      SELECT 
        pagos.id AS pago_id,
        pagos.cuota_id,
        pagos.monto,
        pagos.referencia_pago,
        pagos.estado,
        pagos.created_at AS fecha_pago,
        metodos_pago.nombre AS metodo_pago
      FROM pagos
      LEFT JOIN metodos_pago ON pagos.metodo_pago_id = metodos_pago.id
      WHERE pagos.matricula_id = ? AND pagos.estado = 'Completado'
      ORDER BY pagos.id DESC
    `,
      [matriculaId]
    );

    summary.pagos = pagosRows;

    return summary;
  },

  // 4️⃣ Registra un nuevo pago (sin fecha_pago)
  registerPayment: async (data) => {
    const {
      matricula_id,
      cuota_id,
      metodo_pago_id,
      monto,
      referencia_pago,
      estado = "Completado",
    } = data;

    try {
      const [result] = await pool.execute(
        `
        INSERT INTO pagos 
          (matricula_id, cuota_id, metodo_pago_id, monto, referencia_pago, estado)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          matricula_id,
          cuota_id,
          metodo_pago_id,
          monto,
          referencia_pago || null,
          estado,
        ]
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      console.error("Error en Payment.registerPayment:", error);
      throw error;
    }
  },
  // 5. Encuentra todas las matrículas que tienen cuotas venciendo o vencidas en una fecha específica
  getMatriculasByCuotaDueDate: async (targetDate) => {
    const [rows] = await pool.execute(
      `
            SELECT DISTINCT m.id as matricula_id
            FROM matriculas m
            JOIN cuotas c ON m.periodo_id = c.periodo_id
            WHERE c.fecha_limite = ? AND m.estado = 'Activa'
        `,
      [targetDate]
    );
    return rows;
  },

  
  /**
   * Encuentra matrículas activas que tienen una cuota que cumple la condición de desfase (Ej: 1 día después de su vencimiento).
   * @param {number} daysOffset - Días de diferencia con respecto al vencimiento (Ej: -1 para un día antes, +1 para un día después).
   * @returns {Array} Lista de matrículas activas afectadas.
   */
  getMatriculasAffectedByRule: async (daysOffset) => {
    // La fecha límite de la cuota debe ser: HOY - daysOffset
    // Ejemplo: Si daysOffset = 1 (1 día después), buscamos cuotas cuya fecha límite sea AYER.
    // Ejemplo: Si daysOffset = -1 (1 día antes), buscamos cuotas cuya fecha límite sea MAÑANA.

    const [rows] = await pool.execute(
      `
            SELECT DISTINCT m.id AS matricula_id
            FROM matriculas m
            JOIN cuotas c ON m.periodo_id = c.periodo_id
            WHERE 
                m.estado = 'Activa' AND
                c.fecha_limite = DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `,
      [daysOffset]
    );

    return rows;
  },
};

module.exports = Payment;
