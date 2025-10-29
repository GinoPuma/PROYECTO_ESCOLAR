const OpenAI = require("openai");
const axios = require("axios");
const PaymentIntelligence = require("../models/PaymentIntelligence");
const PaymentController = require("./paymentController");
const PaymentModel = require("../models/Payment");
const { getAuthToken } = require("../utils/apisPeruAuth");

require("dotenv").config();

// Configuración de la IA y WhatsApp
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper para generar el mensaje con IA
const generateAICustomMessage = async (
  behavior,
  apoderadoNombre,
  studentName,
  pendiente,
  cuotaConcepto,
  fechaLimite,
  isOverdue,
  institutionName,
  countPriorCuotas
) => {
  let tone;
  if (behavior === "Moroso Frecuente") {
    tone =
      "persuasivo, urgente y formal, enfatizando las consecuencias académicas y la persona afectada.";
  } else if (behavior === "Moroso Ocasional") {
    tone =
      "informativo pero firme, con un tono de recordatorio amigable, y mencionando el estudiante.";
  } else {
    tone =
      "amigable y de bajo estrés, y mencionando claramente el estudiante y la cuota.";
  }

  const dateStatusText = isOverdue
    ? `vencida el ${fechaLimite}`
    : `con fecha límite el ${fechaLimite}`;

  let priorDebtContext = "";
  if (countPriorCuotas > 0) {
    priorDebtContext = `ADVERTENCIA: El apoderado tiene ${countPriorCuotas} cuota(s) ANTERIORES (con fecha límite pasada) totalmente pendientes. DEBES incluir una advertencia sobre esta deuda acumulada en el mensaje.`;
  }
  const systemPrompt =
    `Eres un asistente de secretaría escolar. Tu tarea es redactar un mensaje de WhatsApp claro y conciso para el apoderado (${apoderadoNombre}). ` +
    `El mensaje DEBE incluir el nombre del estudiante (${studentName}) y el estado de la cuota (${dateStatusText}). ` +
    priorDebtContext +
    `El tono debe ser ${tone}.`;

  const userPrompt =
    `El concepto a pagar es "${cuotaConcepto}" por S/ ${pendiente.toFixed(
      2
    )}. ` +
    `Redacta el mensaje final de no más de 6 líneas. ` +
    `Sugiere apersonarse o contactar a la dirección para registrar el pago o resolver dudas. ` +
    `Si ya realizó el pago por Transferencia o Yape, por favor envíe el comprobante por este medio para realizar el registro correspondiente. ` +
    `Firma como: "Dirección de la ${institutionName}".`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    // La respuesta de OpenAI viene en 'choices[0].message.content'
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Error generando contenido IA (OpenAI):", e);
    return `Estimado(a) ${apoderadoNombre}, le recordamos el pago pendiente de ${cuotaConcepto} del estudiante ${studentName} por S/ ${pendiente.toFixed(
      2
    )}. Usted tiene ${countPriorCuotas} deudas anteriores totalmente pendientes. Por favor, contacte o apersonarrse a dirección. Direccion de la ${institutionName}.`;
  }
};

// Helper para enviar mensaje por APIsPeru
const sendWhatsAppMessage = async (rawPhoneNumber, message) => {
  const token = await getAuthToken();
  const senderPhone = process.env.APISPERU_SENDER_PHONE;
  const baseUrl = process.env.APISPERU_WHATSAPP_SEND_URL;

  if (!baseUrl || !senderPhone) {
    console.warn("Faltan URLs o teléfono remitente de APIsPeru.");
    return false;
  }

  // Formato del número DESTINO
  let recipientPhone = rawPhoneNumber.replace(/\D/g, "").slice(-9);
  recipientPhone = `51${recipientPhone}@s.whatsapp.net`;

  // URL completa con el remitente
  const fullUrl = `${baseUrl}${senderPhone}/send/message`;

  try {
    console.log("URL final para WhatsApp:", fullUrl);
    const response = await axios.post(
      fullUrl,
      {
        phone: recipientPhone,
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200 || response.data.status === "success") {
      console.log("WHATSAPP API RESPONSE SUCCESS:", response.data);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al conectar con API WhatsApp:", error.message);
    if (error.response) {
      console.error("--- ERROR API WHATSAPP (AXIOS) ---");
      console.error("Status:", error.response.status);
      console.error("Data Rechazada:", error.response.data);
      console.error("-----------------------------------");
      throw new Error(
        `Error ${
          error.response.status
        } de API externa. Mensaje: ${JSON.stringify(error.response.data)}`
      );
    }
    return false;
  }
};

exports.sendReminder = async (req, res) => {
  const { matriculaId } = req.params;
  console.log(
    `Intentando enviar recordatorio para Matrícula ID: ${matriculaId}`
  );

  try {
    // Obtener estado de cuenta completo
    const rawSummary = await PaymentModel.getFinancialSummary(matriculaId);
    if (!rawSummary)
      return res.status(404).json({ message: "Matrícula no encontrada." });

    console.log("Resumen financiero obtenido.");
    const summary = PaymentController.calculateBalances(rawSummary);

    // Identificar la cuota más antigua totalmente pendiente
    const fullyPendingCuotas = summary.cuotas.filter(
      (c) => c.saldoPendiente === parseFloat(c.monto_obligatorio)
    );

    if (fullyPendingCuotas.length === 0) {
      console.log(" No hay cuotas totalmente pendientes.");
      return res.status(200).json({
        message:
          "No hay cuotas totalmente pendientes que requieran recordatorio.",
      });
    }

    fullyPendingCuotas.sort(
      (a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite)
    );
    const cuotaRecordatorio = fullyPendingCuotas[0];

    // --- 1. Determinar el estado de la cuota ---
    const today = new Date();
    const cuotaDate = new Date(cuotaRecordatorio.fecha_limite);

    const isOverdue = cuotaDate < today;

    const formattedDate = cuotaDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Convertimos el monto
    const montoPendiente = parseFloat(cuotaRecordatorio.monto_obligatorio);
    if (isNaN(montoPendiente)) {
      console.error(
        "[ERROR FATAL] Monto pendiente no es un número.",
        cuotaRecordatorio.monto_obligatorio
      );
      return res
        .status(500)
        .json({ message: "Error interno: Monto de cuota inválido." });
    }

    console.log(
      `Cuota más antigua pendiente: ${
        cuotaRecordatorio.concepto
      } (S/${montoPendiente.toFixed(2)})`
    );

    // Determinar el comportamiento de pago
    const apoderadoId = summary.apoderado_id;
    if (!apoderadoId) {
      console.log("Apoderado ID faltante.");
      return res.status(400).json({
        message: "La matrícula no tiene un apoderado responsable asignado.",
      });
    }

    const status = await PaymentIntelligence.getApoderadoPaymentStatus(
      apoderadoId,
      matriculaId
    );

    // Generar Mensaje Personalizado con IA
    const apoderadoNombre = summary.apoderado_nombre || "Estimado Apoderado(a)";
    const studentName = `${summary.est_nombre} ${summary.est_apellido}`;
    const institutionName = summary.institucion_nombre || "Colegio X";

    console.log(
      `Generando mensaje IA para ${apoderadoNombre} (Comportamiento: ${status.behavior})`
    );

    // --- CONTEO DE MOROSIDAD HISTÓRICA ---
    const countPriorFullyPending = summary.cuotas.filter((c) => {
      const isFullyPending =
        c.saldoPendiente === parseFloat(c.monto_obligatorio);

      const isOlder =
        new Date(c.fecha_limite) < new Date(cuotaRecordatorio.fecha_limite);

      return isFullyPending && isOlder;
    }).length;

    const message = await generateAICustomMessage(
      status.behavior,
      apoderadoNombre,
      studentName,
      montoPendiente,
      cuotaRecordatorio.concepto,
      formattedDate,
      isOverdue,
      institutionName,
      countPriorFullyPending
    );

    // Enviar el mensaje por WhatsApp
    const phoneNumber = rawSummary.apoderado_telefono;

    if (!phoneNumber) {
      console.log("Número de teléfono faltante.");
      return res.status(400).json({
        message: "No se encontró el número de teléfono del apoderado.",
      });
    }

    console.log(
      `Enviando a ${phoneNumber}. Mensaje: ${message.substring(0, 50)}...`
    );

    // LLAMADA AL HELPER DE WHATSAPP
    const sent = await sendWhatsAppMessage(phoneNumber, message);

    console.log(`Resultado de envío: ${sent}`);

    if (sent) {
      res.json({
        message: "Recordatorio enviado con éxito.",
        messageContent: message,
      });
    } else {
      res.status(500).json({
        message:
          "Error al enviar el mensaje de WhatsApp, revisar logs del API externo.",
      });
    }
  } catch (error) {
    console.error("Error en sendReminder (Catch principal):", error);
    res.status(500).json({
      message: "Error interno del servidor al procesar el recordatorio.",
    });
  }
};

exports.generateAICustomMessage = generateAICustomMessage;
exports.sendWhatsAppMessage = sendWhatsAppMessage;
