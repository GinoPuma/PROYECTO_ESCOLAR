const pool = require("../config/db");

const Institution = {
  get: async () => {
    try {
      const [rows] = await pool.execute("SELECT * FROM institucion LIMIT 1");
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error en Institution.get:", error);
      throw error;
    }
  },

  // Actualizar la información de la institución
  update: async (institutionData) => {
    const { id, nombre, direccion, telefono, email, sitio_web } =
      institutionData;
    if (!id) {
      throw new Error("Institution ID is required for update.");
    }
    try {
      await pool.execute(
        "UPDATE institucion SET nombre = ?, direccion = ?, telefono = ?, email = ?,  WHERE id = ?",
        [
          nombre ?? null,
          direccion ?? null,
          telefono ?? null,
          email ?? null,
          id,
        ]
      );
      return { ...institutionData };
    } catch (error) {
      console.error("Error en Institution.update:", error);
      throw error;
    }
  },

  // Crear la información de la institución
  create: async (institutionData) => {
    const { nombre, direccion, telefono, email, sitio_web } = institutionData;

    try {
      const [result] = await pool.execute(
        "INSERT INTO institucion (nombre, direccion, telefono, email) VALUES (?, ?, ?, ?)",
        [
          institutionData.nombre ?? null,
          institutionData.direccion ?? null,
          institutionData.telefono ?? null,
          institutionData.email ?? null,
        ]
      );
      return { id: result.insertId, ...institutionData };
    } catch (error) {
      console.error("Error en Institution.create:", error);
      throw error;
    }
  },
};

module.exports = Institution;
