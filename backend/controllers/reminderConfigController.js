const ReminderConfig = require("../models/ReminderConfig");
const PaymentModel = require("../models/Payment");
const PaymentController = require("./paymentController");
const aiReminderController = require("./aiReminderController");
const PaymentIntelligence = require("../models/PaymentIntelligence");
const { runScheduledReminders } = require("../scheduler/reminderScheduler");

const pool = require("../config/db");

const getTargetDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() - daysOffset);
  return date.toISOString().split("T")[0];
};

exports.getAllRules = async (req, res) => {
  try {
    const rules = await ReminderConfig.getAll();
    res.json(rules);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener reglas de recordatorio." });
  }
};

exports.createRule = async (req, res) => {
  const data = req.body;
  // Validaciones básicas
  if (
    !data.nombre_regla ||
    !data.tipo_objetivo ||
    data.dias_antes_despues === undefined ||
    !data.hora_envio
  ) {
    return res
      .status(400)
      .json({ message: "Faltan campos obligatorios para la regla." });
  }
  data.activo = data.activo ? 1 : 0;
  try {
    const newRule = await ReminderConfig.create(data);
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ message: "Error al crear regla." });
  }
};

exports.updateRule = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  data.activo = data.activo ? 1 : 0;
  try {
    const success = await ReminderConfig.update(id, data);
    if (!success)
      return res.status(404).json({ message: "Regla no encontrada." });
    res.json({ message: "Regla actualizada." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar regla." });
  }
};

exports.deleteRule = async (req, res) => {
  const { id } = req.params;
  try {
    const success = await ReminderConfig.delete(id);
    if (!success)
      return res.status(404).json({ message: "Regla no encontrada." });
    res.json({ message: "Regla eliminada." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar regla." });
  }
};

const executeReminderLogic = async (ruleId) => {
  // Obtener la regla configurada
  const [ruleRows] = await pool.execute(
    "SELECT * FROM recordatorio_whatsapp WHERE id = ?",
    [ruleId]
  );
  const rule = ruleRows[0];

  if (!rule || rule.activo === 0) {
    return res.status(404).json({ message: "Regla no encontrada o inactiva." });
  }

  const daysOffset = rule.dias_antes_despues;
  const targetDate = getTargetDate(daysOffset);

  // Obtener TODAS las matrículas que tienen una cuota con fecha límite en targetDate
  const matriculas = await PaymentModel.getMatriculasByCuotaDueDate(targetDate);

  // Contadores para el Frontend
  let successCount = 0;
  let failCount = 0;

  if (matriculas.length === 0) {
    return res.json({
      message: `Ejecución finalizada: No hay matrículas con cuotas con fecha límite en ${targetDate}.`,
      mensajesEnviados: 0,
      mensajesFallidos: 0,
      targetDate: targetDate,
    });
  }

  // 4. Procesar cada matrícula
  for (const matricula of matriculas) {
    const matriculaId = matricula.matricula_id;

    try {
      const rawSummary = await PaymentModel.getFinancialSummary(matriculaId);
      const summary = PaymentController.calculateBalances(rawSummary);

      // --- IDENTIFICACIÓN DE CUOTA A RECORDAR ---
      let cuotaRecordatorio = null;

      // FILTRAMOS LAS CUOTAS POR FECHA OBJETIVO
      const cuotaObjetivo = summary.cuotas.find((c) => {
        let cuotaFechaLimite = c.fecha_limite;
        if (cuotaFechaLimite instanceof Date) {
          cuotaFechaLimite = cuotaFechaLimite.toISOString().split("T")[0];
        } else if (typeof cuotaFechaLimite === "string") {
          cuotaFechaLimite = cuotaFechaLimite.split("T")[0];
        }
        return cuotaFechaLimite === targetDate;
      });

      if (cuotaObjetivo) {
        console.log(
          `[EXEC DEBUG] Saldo Pendiente: ${cuotaObjetivo.saldoPendiente}, Monto Obligatorio: ${cuotaObjetivo.monto_obligatorio}`
        );
      }

      let cuotaStatus;

      if (
        cuotaObjetivo &&
        cuotaObjetivo.saldoPendiente ===
          parseFloat(cuotaObjetivo.monto_obligatorio)
      ) {
        // Determinar si la cuota encontrada está Vencida o Por Vencer (basado en la fecha actual)
        const cuotaDate = new Date(cuotaObjetivo.fecha_limite);
        const today = new Date();
        const isOverdue = cuotaDate < today;

        if (isOverdue) {
          cuotaStatus = "VENCIDOS";
        } else {
          cuotaStatus = "POR_VENCER";
        }

        // Aplicar el filtro según el TIPO_OBJETIVO de la regla
        if (
          rule.tipo_objetivo === "TODOS" ||
          rule.tipo_objetivo === cuotaStatus
        ) {
          cuotaRecordatorio = cuotaObjetivo;
        } else {
          // La cuota encontrada no coincide con el estado objetivo de la regla
          console.log(
            `[EXEC] Saltando Matrícula ${matriculaId}: Cuota es ${cuotaStatus}, pero la regla busca ${rule.tipo_objetivo}`
          );
        }
      }

      if (cuotaRecordatorio) {
        // 1. Obtener estado de morosidad
        const apoderadoId = summary.apoderado_id;
        if (!apoderadoId || !summary.apoderado_telefono) {
          console.log(
            `[EXEC] Saltando ${matriculaId}: Falta Apoderado o Teléfono.`
          );
          failCount++;
          continue;
        }
        const status = await PaymentIntelligence.getApoderadoPaymentStatus(
          apoderadoId,
          matriculaId
        );
        const isOverdueForAI = cuotaStatus === "VENCIDOS";
        const formattedDate = new Date(
          cuotaRecordatorio.fecha_limite
        ).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // --- CALCULAR CUOTAS ANTERIORES PENDIENTES ---
        const countPriorFullyPending = summary.cuotas.filter((c) => {
          const isFullyPending =
            c.saldoPendiente === parseFloat(c.monto_obligatorio);
          const isOlder =
            new Date(c.fecha_limite) < new Date(cuotaRecordatorio.fecha_limite);
          return isFullyPending && isOlder;
        }).length;
        // ---------------------------------------------
        // 2. Generar mensaje IA
        const montoPendiente = parseFloat(cuotaRecordatorio.monto_obligatorio);
        const apoderadoNombre =
          summary.apoderado_nombre || "Estimado Apoderado(a)";
        const studentName = `${summary.est_nombre} ${summary.est_apellido}`;
        const institutionName = summary.institucion_nombre || "Colegio X";

        const message = await aiReminderController.generateAICustomMessage(
          status.behavior,
          apoderadoNombre,
          studentName,
          montoPendiente,
          cuotaRecordatorio.concepto,
          formattedDate,
          isOverdueForAI,
          institutionName,
          countPriorFullyPending
        );

        // 3. Enviar WhatsApp
        const sent = await aiReminderController.sendWhatsAppMessage(
          summary.apoderado_telefono,
          message
        );

        if (sent) {
          successCount++;
        } else {
          failCount++;
        }
      }
    } catch (e) {
      console.error(`Error procesando Matrícula ${matriculaId}:`, e.message);
      failCount++;
    }
  }

  return {
    message: "Proceso de recordatorio finalizado.",
    mensajesEnviados: successCount,
    mensajesFallidos: failCount,
  };
};

exports.executeReminderRule = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await executeReminderLogic(id);

    res.json({
      ...result,
      totalMatriculasEvaluadas:
        result.mensajesEnviados + result.mensajesFallidos,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Error al ejecutar la regla." });
  }
};

exports.executeReminderLogic = executeReminderLogic;
