const pool = require("../config/db");

const PaymentIntelligence = {
  /**
   * Obtiene datos históricos y el estado actual del apoderado.
   * @param {number} apoderadoId - ID del apoderado.
   * @param {number} matriculaId - ID de la matrícula actual.
   * @returns {object} Datos del estado de cuenta y morosidad.
   */
  getApoderadoPaymentStatus: async (apoderadoId, matriculaId) => {
    const [morosityRows] = await pool.execute(
      `
            SELECT COUNT(pa.id) AS pagos_tardios
            FROM pagos pa
            JOIN cuotas c ON pa.cuota_id = c.id
            WHERE pa.matricula_id = ?
              AND pa.estado = 'Completado'
              AND pa.created_at > c.fecha_limite 
              AND pa.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR);
        `,
      [matriculaId]
    );

    const pagosTardios = morosityRows[0].pagos_tardios;

    let paymentBehavior = "Normal";
    if (pagosTardios >= 3) {
      paymentBehavior = "Moroso Frecuente";
    } else if (pagosTardios >= 1) {
      paymentBehavior = "Moroso Ocasional";
    }

    return {
      pagosTardios,
      behavior: paymentBehavior,
    };
  },
};

module.exports = PaymentIntelligence;
