const axios = require("axios");

let currentToken = null;
let tokenExpiry = 0; 

const getAuthToken = async () => {
  const now = Date.now();

  // Verificar si el token actual es válido (damos un margen de 10 minutos)
  if (currentToken && tokenExpiry > now + 10 * 60 * 1000) {
    return currentToken;
  }

  // Si no hay token o ha expirado, obtener uno nuevo
  console.log("[APISPERU] Token expirado o no existe. Obteniendo nuevo JWT...");

  const loginUrl = process.env.APISPERU_LOGIN_URL;
  const username = process.env.APISPERU_USER;
  const password = process.env.APISPERU_PASS;

  if (!loginUrl || !username || !password) {
    throw new Error(
      "Credenciales de APIsPeru (usuario/pass) no configuradas en el .env."
    );
  }

  try {
    const response = await axios.post(loginUrl, { username, password });

    const newToken = response.data.token;
    if (!newToken) {
      throw new Error(
        "Respuesta de login exitosa, pero no se recibió el token."
      );
    }

    currentToken = newToken;
    tokenExpiry = now + 24 * 60 * 60 * 1000;

    console.log("[APISPERU] Nuevo JWT obtenido y almacenado.");
    return currentToken;
  } catch (error) {
    console.error(
      "ERROR AL OBTENER JWT DE APISPERU:",
      error.response?.data || error.message
    );
    throw new Error("Fallo en la autenticación con APIsPeru.");
  }
};

module.exports = { getAuthToken };
