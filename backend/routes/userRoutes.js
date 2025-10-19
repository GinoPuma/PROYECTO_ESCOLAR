const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    primer_nombre: req.user.primer_nombre,
    primer_apellido: req.user.primer_apellido,
    rol: req.user.rol,
    activo: req.user.activo,
  });
});

router.get(
  "/",
  protect,
  authorize("Administrador"),
  userController.getAllUsers
);

router.get(
  "/:id",
  protect,
  authorize("Administrador"),
  userController.getUserById
);

router.put(
  "/:id",
  protect,
  authorize("Administrador"),
  userController.updateUser
);

router.delete(
  "/:id/deactivate",
  protect,
  authorize("Administrador"),
  userController.deactivateUser
);

router.put(
  "/:id/activate",
  protect,
  authorize("Administrador"),
  userController.activateUser
);

router.post(
  "/",
  protect,
  authorize("Administrador"),
  userController.createUser
);

module.exports = router;
