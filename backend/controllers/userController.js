const User = require("../models/User");

const validateUserFields = (userData, isUpdate = false) => {
  const errors = [];
  if (!userData.username || userData.username.length < 3) {
    errors.push(
      "El nombre de usuario es obligatorio y debe tener al menos 3 caracteres."
    );
  }
  if (userData.email && !/\S+@\S+\.\S+/.test(userData.email)) {
    errors.push("El formato del email es inválido.");
  }
  if (!userData.primer_nombre) {
    errors.push("El primer nombre es obligatorio.");
  }
  if (!userData.primer_apellido) {
    errors.push("El primer apellido es obligatorio.");
  }
  if (
    !userData.rol ||
    !["Administrador", "Secretaria"].includes(userData.rol)
  ) {
    errors.push("El rol es obligatorio y debe ser Administrador o Secretaria.");
  }
  if (!isUpdate && (!userData.password || userData.password.length < 6)) {
    errors.push(
      "La contraseña es obligatoria y debe tener al menos 6 caracteres."
    );
  }
  if (isUpdate && userData.password && userData.password.length < 6) {
    errors.push("La nueva contraseña debe tener al menos 6 caracteres.");
  }
  if (isUpdate && userData.password !== userData.confirmar_password) {
    errors.push("Las contraseñas no coinciden.");
  }

  return errors;
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error("Error en userController.getAllUsers:", error);
    res.status(500).json({ message: "Error al obtener la lista de usuarios." });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.json(user);
  } catch (error) {
    console.error("Error en userController.getUserById:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los detalles del usuario." });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const userData = req.body;

  try {
    const errors = validateUserFields(userData, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors: errors });
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (
      existingUser.username !== userData.username ||
      existingUser.email !== userData.email
    ) {
      const isDuplicate = await User.exists(
        userData.username,
        userData.email,
        id
      ); // Excluir nuestro propio usuario
      if (isDuplicate) {
        return res.status(409).json({
          message:
            "El nombre de usuario o email ya está en uso por otro usuario.",
        });
      }
    }

    const userDataToUpdate = {
      username: userData.username,
      email: userData.email,
      primer_nombre: userData.primer_nombre,
      primer_apellido: userData.primer_apellido,
      rol: userData.rol,
      activo:
        typeof userData.activo === "boolean"
          ? userData.activo
          : existingUser.activo,
      password: userData.password || null,
      confirmar_password: userData.confirmar_password,
    };

    const updatedUser = await User.update(id, userDataToUpdate);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error en userController.updateUser:", error);
    res.status(500).json({
      message: "Error al actualizar el usuario.",
      error: error.message,
    });
  }
};

exports.deactivateUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Nos aseguramos de no poder desactivarnos a nosotros mismos
    if (req.user && req.user.id == id) {
      return res.status(403).json({
        message: "No puedes desactivar tu propia cuenta.",
      });
    }

    const success = await User.deactivate(id);
    if (!success) {
      return res
        .status(404)
        .json({ message: "Usuario no encontrado o ya inactivo." });
    }
    res.json({ message: "Usuario desactivado exitosamente." });
  } catch (error) {
    console.error("Error en userController.deactivateUser:", error);
    res.status(500).json({
      message: "Error al desactivar el usuario.",
      error: error.message,
    });
  }
};

exports.activateUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user && req.user.id == id) {
      // Si el usuario está activo, esto no debería ser un error. Si está inactivo, podría serlo.
    }

    const success = await User.activate(id);
    if (!success) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.json({ message: "Usuario activado exitosamente." });
  } catch (error) {
    console.error("Error en userController.activateUser:", error);
    res
      .status(500)
      .json({ message: "Error al activar el usuario.", error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const userData = req.body;

  try {
    const errors = validateUserFields(userData, false);
    if (errors.length > 0) {
      return res.status(400).json({ errors: errors });
    }

    const userAlreadyExists = await User.exists(
      userData.username,
      userData.email
    );
    if (userAlreadyExists) {
      return res
        .status(409)
        .json({ message: "El nombre de usuario o email ya está en uso." });
    }

    const newUser = await User.create(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error en userController.createUser:", error);
    res
      .status(500)
      .json({ message: "Error al crear el usuario.", error: error.message });
  }
};
