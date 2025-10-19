const pool = require("../config/db");

const Structure = {
  /* --- Niveles Educativos --- */

  getAllNiveles: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM niveles_educativos ORDER BY id"
    );
    return rows;
  },
  createNivel: async (nombre) => {
    const [result] = await pool.execute(
      "INSERT INTO niveles_educativos (nombre) VALUES (?)",
      [nombre]
    );
    return { id: result.insertId, nombre };
  },
  updateNivel: async (id, nombre) => {
    const [result] = await pool.execute(
      "UPDATE niveles_educativos SET nombre = ? WHERE id = ?",
      [nombre, id]
    );
    return result.affectedRows > 0;
  },
  deleteNivel: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM niveles_educativos WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  /* --- Grados --- */

  getAllGrados: async () => {
    const [rows] = await pool.execute(`
            SELECT g.*, n.nombre as nivel_nombre 
            FROM grados g 
            JOIN niveles_educativos n ON g.nivel_id = n.id 
            ORDER BY n.id, g.nombre
        `);
    return rows;
  },
  createGrado: async (nombre, nivel_id) => {
    const [result] = await pool.execute(
      "INSERT INTO grados (nombre, nivel_id) VALUES (?, ?)",
      [nombre, nivel_id]
    );
    return { id: result.insertId, nombre, nivel_id };
  },
  updateGrado: async (id, nombre, nivel_id) => {
    const [result] = await pool.execute(
      "UPDATE grados SET nombre = ?, nivel_id = ? WHERE id = ?",
      [nombre, nivel_id, id]
    );
    return result.affectedRows > 0;
  },
  deleteGrado: async (id) => {
    const [result] = await pool.execute("DELETE FROM grados WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  /* --- Secciones --- */

  getAllSecciones: async () => {
    const [rows] = await pool.execute(`
            SELECT s.*, g.nombre as grado_nombre, n.nombre as nivel_nombre
            FROM secciones s 
            JOIN grados g ON s.grado_id = g.id
            JOIN niveles_educativos n ON g.nivel_id = n.id
            ORDER BY n.id, g.id, s.nombre
        `);
    return rows;
  },
  createSeccion: async (nombre, grado_id) => {
    const [result] = await pool.execute(
      "INSERT INTO secciones (nombre, grado_id) VALUES (?, ?)",
      [nombre, grado_id]
    );
    return { id: result.insertId, nombre, grado_id };
  },
  updateSeccion: async (id, nombre, grado_id) => {
    const [result] = await pool.execute(
      "UPDATE secciones SET nombre = ?, grado_id = ? WHERE id = ?",
      [nombre, grado_id, id]
    );
    return result.affectedRows > 0;
  },
  deleteSeccion: async (id) => {
    const [result] = await pool.execute("DELETE FROM secciones WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },
  getSeccionById: async (id) => { // <-- Método nuevo
    const [rows] = await pool.execute(`
            SELECT s.*
            FROM secciones s 
            WHERE s.id = ?
        `, [id]);
    return rows[0] || null;
  },
};

module.exports = Structure;
