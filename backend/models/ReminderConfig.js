const pool = require("../config/db");

const ReminderConfig = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM recordatorio_whatsapp ORDER BY id"
    );
    return rows;
  },

  create: async (data) => {
    const {
      nombre_regla,
      tipo_objetivo,
      dias_antes_despues,
      hora_envio,
      activo,
      frecuencia,
    } = data;
    const [result] = await pool.execute(
      `INSERT INTO recordatorio_whatsapp (nombre_regla, tipo_objetivo, dias_antes_despues, hora_envio, activo, frecuencia)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre_regla,
        tipo_objetivo,
        dias_antes_despues,
        hora_envio,
        activo,
        frecuencia,
      ]
    );
    return { id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const {
      nombre_regla,
      tipo_objetivo,
      dias_antes_despues,
      hora_envio,
      activo,
      frecuencia,
    } = data;
    const [result] = await pool.execute(
      `UPDATE recordatorio_whatsapp SET 
             nombre_regla=?, tipo_objetivo=?, dias_antes_despues=?, hora_envio=?, activo=?, frecuencia=?
             WHERE id=?`,
      [
        nombre_regla,
        tipo_objetivo,
        dias_antes_despues,
        hora_envio,
        activo,
        frecuencia,
        id,
      ]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM recordatorio_whatsapp WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = ReminderConfig;
