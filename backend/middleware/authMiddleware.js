const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const User = require("../models/User"); 

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No autorizado, no hay token" });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userId = decoded.id; 

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Usuario asociado al token no encontrado" });
    }
    req.user = user;
    next(); 
  } catch (error) {
    console.error("Error en el middleware protect:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token inválido" });
    }    res
      .status(500)
      .json({ message: "Error interno del servidor al autenticar" });
  }
};

// Middleware para autorizar acceso basado en roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!roles.includes(req.user.rol)) {
      return res
        .status(403)
        .json({
          message: `Acceso denegado. Se requieren permisos de: ${roles.join(
            ", "
          )}`,
        });
    }
    next(); 
  };
};

module.exports = { protect, authorize };
