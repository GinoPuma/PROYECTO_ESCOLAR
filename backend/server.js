const app = require("./app");
const pool = require("./config/db");
const cron = require('node-cron'); // <-- Nuevo Import
const reminderScheduler = require('./scheduler/reminderScheduler');

const PORT = process.env.PORT || 8080;

pool
  .getConnection()
  .then((connection) => {
    console.log("Conexión a la base de datos MySQL establecida.");
    connection.release();
  })
  .catch((err) => {
    console.error("Error al conectar a la base de datos:", err);
    process.exit(1);
  });


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend escuchando en http://0.0.0.0:${PORT}`);
    cron.schedule('* * * * *', () => {
        reminderScheduler.runScheduledReminders();
    });
});
