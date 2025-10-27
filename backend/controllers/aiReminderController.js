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
  institutionName
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
    ? `IMPORTANTE: La cuota venció el ${fechaLimite}.`
    : `La fecha límite de pago es el ${fechaLimite}.`;

  const systemPrompt =
    `Eres un asistente de secretaría escolar. Tu tarea es redactar un mensaje de WhatsApp claro y conciso para el apoderado (${apoderadoNombre}). ` +
    `El mensaje DEBE incluir el nombre del estudiante (${studentName}) y el estado de la cuota (${dateStatusText}). El tono debe ser ${tone}.`;

  const userPrompt =
    `Redacta el mensaje para el apoderado "${apoderadoNombre}" respecto al ${studentName}. El concepto pendiente es "${cuotaConcepto}" y el monto es S/ ${pendiente.toFixed(
      2
    )}. ${dateStatusText} ` +
    `Si el pago fue realizado por transeferncia que mande el comprobante por este medio para registrar el pago correspondiente o sugerir contactar a la dirección para resolver dudas. Termina con la firma: "Dirección del ${institutionName}".`;

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
    return `Estimado(a) ${apoderadoNombre}, le recordamos el pago pendiente de ${cuotaConcepto} (Estudiante: ${studentName}) por S/ ${pendiente.toFixed(
      2
    )}. ${
      isOverdue ? `Vencimiento: ${fechaLimite}.` : `Límite: ${fechaLimite}.`
    } Por favor, contacte o apersoanrse a dirección del ${institutionName}...`;
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

    const message = await generateAICustomMessage(
      status.behavior,
      apoderadoNombre,
      studentName,
      montoPendiente,
      cuotaRecordatorio.concepto,
      formattedDate,
      isOverdue,
      institutionName
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
