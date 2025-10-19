const Payment = require("../models/Payment");
const Enrollment = require("../models/Enrollment");

const rolesPermitidos = ["Administrador", "Secretaria"];

// 🧮 Helper para calcular saldos y estados
const calculateBalances = (summary) => {
  let totalObligation = 0;
  let totalPaid = 0;

  // Agrupar pagos por cuota_id
  const paymentsByCuota = summary.pagos.reduce((acc, pago) => {
    acc[pago.cuota_id] = (acc[pago.cuota_id] || 0) + parseFloat(pago.monto);
    return acc;
  }, {});

  // Calcular estado y saldos de cada cuota
  summary.cuotas = summary.cuotas.map((cuota) => {
    const montoObligatorio = parseFloat(cuota.monto_obligatorio);
    const montoPagado = paymentsByCuota[cuota.cuota_id] || 0;
    const saldoPendiente = montoObligatorio - montoPagado;

    totalObligation += montoObligatorio;
    totalPaid += montoPagado;

    let estadoCuota = "Pendiente";
    if (montoPagado >= montoObligatorio) {
      estadoCuota = "Pagado";
    } else if (montoPagado > 0) {
      estadoCuota = "Parcial";
    }

    return {
      ...cuota,
      montoPagado: parseFloat(montoPagado.toFixed(2)),
      saldoPendiente: parseFloat(saldoPendiente.toFixed(2)),
      estadoCuota,
    };
  });

  summary.totalObligation = parseFloat(totalObligation.toFixed(2));
  summary.totalPaid = parseFloat(totalPaid.toFixed(2));
  summary.totalPending = parseFloat((totalObligation - totalPaid).toFixed(2));

  return summary;
};

// 1️⃣ Obtener resumen financiero de una matrícula
exports.getEnrollmentFinancialSummary = async (req, res) => {
  const { matriculaId } = req.params;

  try {
    const rawSummary = await Payment.getFinancialSummary(matriculaId);

    if (!rawSummary) {
      return res
        .status(404)
        .json({ message: "Matrícula no encontrada o sin datos de período." });
    }

    const calculatedSummary = calculateBalances(rawSummary);
    res.json(calculatedSummary);
  } catch (error) {
    console.error("Error en getEnrollmentFinancialSummary:", error);
    res.status(500).json({
      message: "Error al obtener el estado financiero de la matrícula.",
    });
  }
};

// 2️⃣ Obtener métodos de pago
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await Payment.getPaymentMethods();
    res.json(methods);
  } catch (error) {
    console.error("Error en getPaymentMethods:", error);
    res.status(500).json({ message: "Error al obtener métodos de pago." });
  }
};

// 3️⃣ Registrar un nuevo pago (sin fecha_pago)
exports.registerPayment = async (req, res) => {
  const { matricula_id, cuota_id, metodo_pago_id, monto, referencia_pago } =
    req.body;

  // Validar campos obligatorios
  if (!matricula_id || !cuota_id || !metodo_pago_id || !monto || monto <= 0) {
    return res
      .status(400)
      .json({ message: "Faltan campos obligatorios para registrar el pago." });
  }

  try {
    // Obtener el resumen para validar el saldo
    const rawSummary = await Payment.getFinancialSummary(matricula_id);
    if (!rawSummary) {
      return res.status(404).json({ message: "Matrícula no encontrada." });
    }

    const calculatedSummary = calculateBalances(rawSummary);

    // Buscar la cuota específica
    const targetCuota = calculatedSummary.cuotas.find(
      (c) => c.cuota_id === cuota_id
    );

    if (!targetCuota) {
      return res.status(400).json({
        message:
          "La cuota seleccionada no pertenece a este período o matrícula.",
      });
    }

    const montoFloat = parseFloat(monto);

    // Evitar sobrepago
    if (montoFloat > targetCuota.saldoPendiente) {
      return res.status(400).json({
        message: `El monto (${montoFloat.toFixed(
          2
        )}) excede el saldo pendiente de la cuota (${targetCuota.saldoPendiente.toFixed(
          2
        )}).`,
      });
    }

    // Evitar pagos a cuotas totalmente pagadas
    if (targetCuota.estadoCuota === "Pagado") {
      return res
        .status(400)
        .json({
          message: "La cuota seleccionada ya está completamente pagada.",
        });
    }

    // Registrar el pago
    const newPayment = await Payment.registerPayment({
      matricula_id,
      cuota_id,
      metodo_pago_id,
      monto: montoFloat,
      referencia_pago,
    });

    res
      .status(201)
      .json({ message: "Pago registrado exitosamente.", payment: newPayment });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ message: "Error interno al registrar el pago." });
  }
};
