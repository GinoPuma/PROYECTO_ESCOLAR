const User = require("../models/User");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const { hashPassword, comparePassword } = require("../utils/helpers");

exports.register = async (req, res) => {
  const { username, password, email, primer_nombre, primer_apellido, rol } =
    req.body;

  if (
    !username ||
    !password ||
    !email ||
    !primer_nombre ||
    !primer_apellido ||
    !rol
  ) {
    return res.status(400).json({ message: "Todos los campos son requeridos" });
  }

  const allowedRoles = ["Administrador", "Secretaria"];
  if (!allowedRoles.includes(rol)) {
    return res.status(400).json({
      message: `Rol no permitido. Los roles permitidos son: ${allowedRoles.join(
        ", "
      )}`,
    });
  }

  try {
    const userAlreadyExists = await User.exists(username, email);
    if (userAlreadyExists) {
      return res.status(400).json({
        message: "El nombre de usuario o correo electrónico ya está en uso",
      });
    }

    const newUser = await User.create({
      username,
      password,
      email,
      primer_nombre,
      primer_apellido,
      rol,
    });
    res
      .status(201)
      .json({ message: "Usuario registrado exitosamente", user: newUser });
  } catch (error) {
    console.error("Error en authController.register:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al registrar" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Nombre de usuario y contraseña son requeridos" });
  }

  try {
    const user = await User.findByUsername(username);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        primer_nombre: user.primer_nombre,
        primer_apellido: user.primer_apellido,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error en authController.login:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al iniciar sesión" });
  }
};
