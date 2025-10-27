const Stats = require("../models/Stats");

exports.getStats = async (req, res) => {
  try {
    const stats = await Stats.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Error en statsController.getStats:", error);
    res.status(500).json({ message: "Error al cargar estadísticas." });
  }
};
