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
  pendiente,
  cuotaConcepto
) => {
  let tone;
  if (behavior === "Moroso Frecuente") {
    tone =
      "persuasivo, urgente y formal, enfatizando las consecuencias académicas.";
  } else if (behavior === "Moroso Ocasional") {
    tone = "informativo pero firme, con un tono de recordatorio amigable.";
  } else {
    tone =
      "amigable y de bajo estrés, asumiendo un olvido, pero informando claramente.";
  }

  const systemPrompt = `Eres un asistente de secretaría escolar. Tu tarea es redactar un mensaje de WhatsApp claro y conciso para un apoderado sobre un pago pendiente. El tono debe ser ${tone}.`;

  const userPrompt = `Redacta el mensaje para el apoderado "${apoderadoNombre}". El concepto pendiente es "${cuotaConcepto}" y el monto es S/ ${pendiente.toFixed(
    2
  )}. Sugiere contactar a direccion...`;

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
    return `Estimado(a) ${apoderadoNombre}, le recordamos el pago pendiente de ${cuotaConcepto} por S/ ${pendiente.toFixed(
      2
    )}. Por favor, contacte o apersoanrse a dirección...`;
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

    console.log(
      `Generando mensaje IA para ${apoderadoNombre} (Comportamiento: ${status.behavior})`
    );

    const message = await generateAICustomMessage(
      status.behavior,
      apoderadoNombre,
      montoPendiente,
      cuotaRecordatorio.concepto
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
      `Enviando a ${phoneNumber}. Mensaje: ${message.substring(
        0,
        50
      )}...`
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
