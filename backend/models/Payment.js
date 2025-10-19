const pool = require("../config/db");

const Payment = {
  // 1️⃣ Obtiene los métodos de pago
  getPaymentMethods: async () => {
    const [rows] = await pool.execute(
      "SELECT id, nombre FROM metodos_pago ORDER BY nombre"
    );
    return rows;
  },

  // 2️⃣ Obtiene los pagos registrados para una cuota
  getPaymentsForCuota: async (cuotaId) => {
    const [rows] = await pool.execute(
      `
      SELECT 
        id AS pago_id, 
        monto, 
        referencia_pago, 
        estado, 
        metodos_pago.nombre AS metodo_pago
      FROM pagos
      LEFT JOIN metodos_pago ON pagos.metodo_pago_id = metodos_pago.id
      WHERE cuota_id = ?
      ORDER BY pagos.id DESC
      `,
      [cuotaId]
    );
    return rows;
  },

  // 3️⃣ Obtiene el resumen financiero de una matrícula (Cuotas vs Pagos)
  getFinancialSummary: async (matriculaId) => {
    // Obtener la información de matrícula y estudiante
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
        p.nombre AS periodo_nombre,
        g.nombre AS grado_nombre,
        s.nombre AS seccion_nombre
      FROM matriculas m
      JOIN estudiantes e ON m.estudiante_id = e.id
      LEFT JOIN apoderado a ON m.apoderado_id = a.id
      JOIN periodos p ON m.periodo_id = p.id
      JOIN secciones s ON m.seccion_id = s.id
      JOIN grados g ON s.grado_id = g.id
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

    // Obtener los pagos completados
    const [pagosRows] = await pool.execute(
      `
      SELECT 
        pagos.id AS pago_id,
        pagos.cuota_id,
        pagos.monto,
        pagos.referencia_pago,
        pagos.estado,
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
};

module.exports = Payment;
