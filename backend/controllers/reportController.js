const Report = require("../models/Report");
const Student = require("../models/Student");
const Payment = require("../models/Payment"); // Para obtener métodos de pago
const AcademicConfig = require("../models/AcademicConfig");

// Helper para agrupar el reporte detallado del estudiante
const groupStudentReport = (rawReport) => {
  const history = {};

  rawReport.forEach((row) => {
    const matId = row.matricula_id;
    if (!history[matId]) {
      history[matId] = {
        matricula_id: matId,
        periodo: row.periodo_nombre,
        grado_seccion: `${row.grado} ${row.seccion}`,
        fecha_matricula: row.fecha_matricula,
        cuotas: {},
      };
    }

    const cuotaId = row.cuota_id;
    if (cuotaId && !history[matId].cuotas[cuotaId]) {
      history[matId].cuotas[cuotaId] = {
        cuota_concepto: row.cuota_concepto,
        monto_obligatorio: parseFloat(row.cuota_monto_obligatorio),
        fecha_limite: row.cuota_fecha_limite,
        pagos: [],
        total_pagado: 0,
      };
    }

    if (row.pago_id) {
      const pagoMonto = parseFloat(row.pago_monto);
      history[matId].cuotas[cuotaId].pagos.push({
        pago_id: row.pago_id,
        monto: pagoMonto,
        referencia_pago: row.referencia_pago,
        metodo: row.metodo_pago_nombre,
      });
      history[matId].cuotas[cuotaId].total_pagado += pagoMonto;
    }
  });

  return Object.values(history).map((mat) => {
    mat.cuotas = Object.values(mat.cuotas).map((cuota) => {
      cuota.saldo_pendiente = Math.max(
        cuota.monto_obligatorio - cuota.total_pagado,
        0
      );
      return cuota;
    });
    return mat;
  });
};

// 1. Reporte Detallado por Estudiante
exports.getStudentReport = async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Estudiante no encontrado." });
    }

    const rawReport = await Report.getStudentFullReport(studentId);
    const groupedReport = groupStudentReport(rawReport);

    res.json({
      student: {
        id: student.id,
        nombre: `${student.primer_nombre} ${student.primer_apellido}`,
        dni: student.numero_identificacion,
      },
      history: groupedReport,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res
      .status(500)
      .json({ message: "Error al generar el reporte del estudiante." });
  }
};

// 2. Reporte Resumen por Período
exports.getPeriodSummaryReport = async (req, res) => {
  const { periodoId } = req.params;
  try {
    const summary = await Report.getPeriodSummary(periodoId);

    res.json({
      // Los campos ahora vienen ya calculados en Report.js
      total_matriculados: summary.total_matriculados,
      total_ingresos: parseFloat(summary.total_ingresos).toFixed(2),
      total_obligacion: parseFloat(summary.total_obligacion).toFixed(2),
      total_deuda: parseFloat(summary.total_deuda).toFixed(2),
    });
  } catch (error) {
    console.error("Error generating period report:", error);
    res
      .status(500)
      .json({ message: "Error al generar el reporte del período." });
  }
};

// 3. Reporte de Historial de Pagos (sin fechas)
exports.getPaymentHistoryReport = async (req, res) => {
  const { methodId } = req.query;
  try {
    const history = await Report.getPaymentHistory(methodId);
    res.json(history);
  } catch (error) {
    console.error("Error generating payment history report:", error);
    res
      .status(500)
      .json({ message: "Error al generar el historial de pagos." });
  }
};

// 4. Obtener datos de selectores
exports.getReportSelectors = async (req, res) => {
  try {
    const [periodos, metodosPago] = await Promise.all([
      AcademicConfig.getAllPeriodos(),
      Payment.getPaymentMethods(),
    ]);
    res.json({ periodos, metodosPago });
  } catch (error) {
    console.error("Error fetching report selectors:", error);
    res.status(500).json({ message: "Error al cargar datos de selectores." });
  }
};

const calculateCuotaStatus = (obligacion, pagado) => {
  const saldo = obligacion - pagado;
  if (saldo <= 0) return "Pagado";
  if (pagado > 0) return "Parcial";
  return "Pendiente";
};

exports.getObligationReport = async (req, res) => {
  const { status } = req.query; // PENDIENTE, PARCIAL, PAGADO, TODOS

  try {
    const rawObligations = await Report.getObligationReport(status);

    const filteredReport = rawObligations
      .map((item) => {
        const montoPagado = parseFloat(item.monto_pagado) || 0;
        const montoObligatorio = parseFloat(item.monto_obligatorio);
        const saldoPendiente = montoObligatorio - montoPagado;
        const cuotaStatus = calculateCuotaStatus(montoObligatorio, montoPagado);

        return {
          ...item,
          monto_pagado: montoPagado.toFixed(2),
          saldo_pendiente: saldoPendiente.toFixed(2),
          estado_cuota: cuotaStatus,
        };
      })
      // Filtro final basado en el estado solicitado (PENDIENTE, PARCIAL, PAGADO)
      .filter(
        (item) => status === "TODOS" || !status || item.estado_cuota === status
      );

    res.json(filteredReport);
  } catch (error) {
    console.error("Error generating obligation report:", error);
    res
      .status(500)
      .json({ message: "Error al generar el reporte de obligaciones." });
  }
};
