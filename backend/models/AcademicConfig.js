const pool = require("../config/db");

const AcademicConfig = {
  /* --- Periodos --- */

  getAllPeriodos: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM periodos ORDER BY fecha_inicio DESC"
    );
    return rows;
  },
  createPeriodo: async (data) => {
    const { nombre, fecha_inicio, fecha_fin, activo } = data;
    const [result] = await pool.execute(
      "INSERT INTO periodos (nombre, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?)",
      [nombre, fecha_inicio, fecha_fin, activo]
    );
    return { id: result.insertId, ...data };
  },
  updatePeriodo: async (id, data) => {
    const { nombre, fecha_inicio, fecha_fin, activo } = data;
    const [result] = await pool.execute(
      "UPDATE periodos SET nombre = ?, fecha_inicio = ?, fecha_fin = ?, activo = ? WHERE id = ?",
      [nombre, fecha_inicio, fecha_fin, activo, id]
    );
    return result.affectedRows > 0;
  },
  deletePeriodo: async (id) => {
    const [result] = await pool.execute("DELETE FROM periodos WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  /* --- Tipos de Pago (Cuotas, ej: Matrícula, Mensualidad) --- */

  getAllTiposPago: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM tipos_pago ORDER BY nombre"
    );
    return rows;
  },
  createTipoPago: async (data) => {
    const { nombre, descripcion, precio_fijo } = data;
    const [result] = await pool.execute(
      "INSERT INTO tipos_pago (nombre, descripcion, precio_fijo) VALUES (?, ?, ?)",
      [nombre, descripcion, precio_fijo || null]
    );
    return { id: result.insertId, ...data };
  },
  updateTipoPago: async (id, data) => {
    const { nombre, descripcion, precio_fijo } = data;
    const [result] = await pool.execute(
      "UPDATE tipos_pago SET nombre = ?, descripcion = ?, precio_fijo = ? WHERE id = ?",
      [nombre, descripcion, precio_fijo || null, id]
    );
    return result.affectedRows > 0;
  },
  deleteTipoPago: async (id) => {
    const [result] = await pool.execute("DELETE FROM tipos_pago WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  /* --- Métodos de Pago (Efectivo, Tarjeta, Transferencia) --- */

  getAllMetodosPago: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM metodos_pago ORDER BY nombre"
    );
    return rows;
  },
  createMetodoPago: async (data) => {
    const { nombre, descripcion } = data;
    const [result] = await pool.execute(
      "INSERT INTO metodos_pago (nombre, descripcion) VALUES (?, ?)",
      [nombre, descripcion || null]
    );
    return { id: result.insertId, ...data };
  },
  updateMetodoPago: async (id, data) => {
    const { nombre, descripcion } = data;
    const [result] = await pool.execute(
      "UPDATE metodos_pago SET nombre = ?, descripcion = ? WHERE id = ?",
      [nombre, descripcion || null, id]
    );
    return result.affectedRows > 0;
  },
  deleteMetodoPago: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM metodos_pago WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  /* --- Cuotas --- */

  getCuotasByPeriodo: async (periodo_id) => {
    const [rows] = await pool.execute(
      `
            SELECT c.*, tp.nombre as tipo_pago_nombre
            FROM cuotas c
            JOIN tipos_pago tp ON c.tipo_pago_id = tp.id
            WHERE c.periodo_id = ?
            ORDER BY c.orden, c.fecha_limite
        `,
      [periodo_id]
    );
    return rows;
  },
  createCuota: async (data) => {
    const { periodo_id, tipo_pago_id, concepto, monto, fecha_limite, orden } =
      data;
    const [result] = await pool.execute(
      "INSERT INTO cuotas (periodo_id, tipo_pago_id, concepto, monto, fecha_limite, orden) VALUES (?, ?, ?, ?, ?, ?)",
      [periodo_id, tipo_pago_id, concepto, monto, fecha_limite, orden]
    );
    return { id: result.insertId, ...data };
  },
  updateCuota: async (id, data) => {
    const { tipo_pago_id, concepto, monto, fecha_limite, orden } = data;
    const [result] = await pool.execute(
      "UPDATE cuotas SET tipo_pago_id = ?, concepto = ?, monto = ?, fecha_limite = ?, orden = ? WHERE id = ?",
      [tipo_pago_id, concepto, monto, fecha_limite, orden, id]
    );
    return result.affectedRows > 0;
  },
  deleteCuota: async (id) => {
    const [result] = await pool.execute("DELETE FROM cuotas WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },
};

module.exports = AcademicConfig;
