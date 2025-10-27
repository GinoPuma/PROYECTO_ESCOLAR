const pool = require("../config/db");
const reminderConfigController = require("../controllers/reminderConfigController");

// Función para obtener la hora actual
const getCurrentTimeHHMM = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
};

// Función para verificar si hoy es un día de ejecución válido
const isExecutionDay = (frecuencia) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); 
  const dayOfMonth = now.getDate(); 

  switch (frecuencia) {
    case "DIARIO":
      return true;
    case "SEMANAL":
      return dayOfWeek === 1;
    case "MENSUAL":
      return dayOfMonth === 1;
    case "UNA_VEZ":
      return true; 
    default:
      return false;
  }
};

const runScheduledReminders = async () => {
  const currentTime = getCurrentTimeHHMM();
  const isReadyToRun = isExecutionDay("DIARIO"); 

  // 1. Obtener TODAS las reglas activas que coinciden con la HORA actual
  try {
    const [allActiveRules] = await pool.execute(
      `SELECT id, nombre_regla, frecuencia FROM recordatorio_whatsapp 
             WHERE activo = 1 AND SUBSTRING(hora_envio, 1, 5) = ?`,
      [currentTime]
    );

    if (allActiveRules.length === 0) {
      return;
    }

    // 2. Filtramos las reglas por la frecuencia de hoy
    const rulesToExecute = allActiveRules.filter((rule) =>
      isExecutionDay(rule.frecuencia)
    );

    if (rulesToExecute.length === 0) {
      console.log(
        `[Scheduler] 🤷‍♀️ No hay reglas para ejecutar hoy (${currentTime}) según la frecuencia.`
      );
      return;
    }

    console.log(
      `[Scheduler] ⏰ Se encontraron ${rulesToExecute.length} reglas para ejecutar.`
    );

    // 3. Ejecutar cada regla
    for (const rule of rulesToExecute) {
      console.log(
        `[Scheduler] -> Ejecutando regla ID ${rule.id}: ${rule.nombre_regla}`
      );

      // Llamamos a la lógica central de ejecución
      const result = await reminderConfigController.executeReminderLogic(
        rule.id
      );

      console.log(
        `[Scheduler] -> Regla ${rule.id} finalizada. Enviados: ${result.mensajesEnviados}`
      );
    }
  } catch (error) {
    console.error(
      "[Scheduler ERROR]: Fallo al ejecutar tareas programadas.",
      error
    );
  }
};

module.exports = { runScheduledReminders };
