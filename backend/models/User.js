const pool = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/helpers");

const User = {
  findByUsername: async (username) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM usuarios WHERE username = ? AND activo = TRUE",
        [username]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error en User.findByUsername:", error);
      throw error;
    }
  },

  findById: async (userId) => {
    try {
      const [rows] = await pool.execute(
        "SELECT id, username, email, primer_nombre, primer_apellido, rol, activo FROM usuarios WHERE id = ?",
        [userId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error en User.findById:", error);
      throw error;
    }
  },

  exists: async (username, email) => {
    try {
      const [rows] = await pool.execute(
        "SELECT id FROM usuarios WHERE username = ? OR email = ?",
        [username, email]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error en User.exists:", error);
      throw error;
    }
  },

  create: async (userData) => {
    const { username, password, email, primer_nombre, primer_apellido, rol } =
      userData;
    const hashedPassword = await hashPassword(password);

    try {
      const [result] = await pool.execute(
        "INSERT INTO usuarios (username, password, email, primer_nombre, primer_apellido, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          username,
          hashedPassword,
          email,
          primer_nombre,
          primer_apellido,
          rol,
          true,
        ]
      );
      return {
        id: result.insertId,
        username,
        email,
        primer_nombre,
        primer_apellido,
        rol,
        activo: true,
      };
    } catch (error) {
      console.error("Error en User.create:", error);
      throw error;
    }
  },

  update: async (userId, userData) => {
    const {
      username,
      email,
      primer_nombre,
      primer_apellido,
      rol,
      activo,
      password,
    } = userData;
    let updateFields = [
      username,
      email,
      primer_nombre,
      primer_apellido,
      rol,
      activo,
    ];
    let query = `
      UPDATE usuarios 
      SET username = ?, email = ?, primer_nombre = ?, primer_apellido = ?, rol = ?, activo = ?
    `;

    if (password) {
      const hashedPassword = await hashPassword(password);
      query += ", password = ?";
      updateFields.push(hashedPassword);
    }

    query += " WHERE id = ?";
    updateFields.push(userId);

    try {
      await pool.execute(query, updateFields);
      return {
        id: userId,
        username,
        email,
        primer_nombre,
        primer_apellido,
        rol,
        activo,
      };
    } catch (error) {
      console.error("Error en User.update:", error);
      throw error;
    }
  },

  deactivate: async (userId) => {
    try {
      const [result] = await pool.execute(
        "UPDATE usuarios SET activo = FALSE WHERE id = ?",
        [userId]
      );
      if (result.affectedRows === 0) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error en User.deactivate:", error);
      throw error;
    }
  },

  activate: async (userId) => {
    try {
      const [result] = await pool.execute(
        "UPDATE usuarios SET activo = TRUE WHERE id = ?",
        [userId]
      );
      if (result.affectedRows === 0) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error en User.activate:", error);
      throw error;
    }
  },

  findAll: async () => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, primer_nombre, primer_apellido, rol, activo FROM usuarios WHERE rol IN ("Administrador", "Secretaria") ORDER BY primer_apellido, primer_nombre'
      );
      return rows;
    } catch (error) {
      console.error("Error en User.findAll:", error);
      throw error;
    }
  },
};

module.exports = User;
