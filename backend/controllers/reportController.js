const Report = require("../models/Report");
const Student = require("../models/Student");
const Payment = require("../models/Payment"); // Para obtener métodos de pago
const AcademicConfig = require("../models/AcademicConfig"); // Para obtener periodos

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
        fecha_pago: row.fecha_pago,
        referencia_pago: row.referencia_pago,
        metodo: row.metodo_pago_nombre,
      });
      history[matId].cuotas[cuotaId].total_pagado += pagoMonto;
    }
  });

  return Object.values(history).map((mat) => {
    mat.cuotas = Object.values(mat.cuotas).map((cuota) => {
      cuota.saldo_pendiente = cuota.monto_obligatorio - cuota.total_pagado;
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
      ...summary,
      total_deuda: parseFloat(summary.total_deuda).toFixed(2),
      total_ingresos: parseFloat(summary.total_ingresos).toFixed(2),
      total_obligacion: parseFloat(summary.total_obligacion).toFixed(2),
    });
  } catch (error) {
    console.error("Error generating period report:", error);
    res
      .status(500)
      .json({ message: "Error al generar el reporte del período." });
  }
};

// 3. Reporte de Historial de Pagos
exports.getPaymentHistoryReport = async (req, res) => {
  const { startDate, endDate, methodId } = req.query;
  try {
    const history = await Report.getPaymentHistory(
      startDate,
      endDate,
      methodId
    );
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
