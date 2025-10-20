import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PaymentFormPage = () => {
  const { matriculaId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentData, setPaymentData] = useState({
    cuota_id: "",
    metodo_pago_id: "",
    monto: "",
    referencia_pago: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Cargar resumen y métodos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, methodsRes] = await Promise.all([
          api.get(`/pagos/summary/${matriculaId}`),
          api.get("/pagos/methods"),
        ]);

        setSummary(summaryRes.data);
        setPaymentMethods(methodsRes.data);

        const firstPendingCuota = summaryRes.data.cuotas.find(
          (c) => c.estadoCuota !== "Pagado"
        );

        if (firstPendingCuota) {
          setPaymentData((prev) => ({
            ...prev,
            cuota_id: firstPendingCuota.cuota_id,
            monto: firstPendingCuota.saldoPendiente.toFixed(2),
          }));
        } else if (summaryRes.data.cuotas.length > 0) {
          setPaymentData((prev) => ({
            ...prev,
            cuota_id:
              summaryRes.data.cuotas[summaryRes.data.cuotas.length - 1]
                .cuota_id,
            monto: "0.00",
          }));
        }
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError(
          err.response?.data?.message || "Error al cargar el estado de cuenta."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [matriculaId]);

  const handlePaymentDataChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));

    if (name === "cuota_id" && summary) {
      const cuotaIdInt = parseInt(value);
      const targetCuota = summary.cuotas.find((c) => c.cuota_id === cuotaIdInt);

      if (targetCuota) {
        setPaymentData((prev) => ({
          ...prev,
          monto:
            targetCuota.saldoPendiente > 0
              ? targetCuota.saldoPendiente.toFixed(2)
              : "0.00",
        }));
      }
    }
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    if (parseFloat(paymentData.monto) <= 0) {
      setError("El monto a pagar debe ser mayor a cero.");
      setSubmitLoading(false);
      return;
    }

    try {
      await api.post("/pagos/register", {
        ...paymentData,
        matricula_id: parseInt(matriculaId),
        cuota_id: parseInt(paymentData.cuota_id),
        metodo_pago_id: parseInt(paymentData.metodo_pago_id),
        monto: parseFloat(paymentData.monto),
      });

      alert("Pago registrado exitosamente. Recargando resumen...");
      navigate(0);
    } catch (err) {
      console.error("Error al registrar pago:", err);
      setError(
        err.response?.data?.message ||
          "Error al procesar el pago. Verifique el saldo."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Generar constancia de pago en PDF
  const generatePaymentReceipt = async (cuota) => {
    if (!cuota.fechaPago || cuota.estadoCuota === "Pendiente") {
      alert("No se puede generar constancia para cuotas sin pagos.");
      return;
    }

    try {
      // Obtener detalles de los pagos de esta cuota
      const response = await api.get(`/pagos/cuota/${cuota.cuota_id}`);
      const pagos = response.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Encabezado
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("CONSTANCIA DE PAGO", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        summary.institucion_nombre || "Institución Educativa",
        pageWidth / 2,
        28,
        { align: "center" }
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (summary.institucion_direccion) {
        doc.text(summary.institucion_direccion, pageWidth / 2, 34, {
          align: "center",
        });
      }
      if (summary.institucion_telefono || summary.institucion_email) {
        doc.text(
          `${summary.institucion_telefono || ""} ${
            summary.institucion_email ? "| " + summary.institucion_email : ""
          }`,
          pageWidth / 2,
          39,
          { align: "center" }
        );
      }

      // Línea divisoria
      doc.setDrawColor(0, 0, 0);
      doc.line(15, 35, pageWidth - 15, 35);

      // Información del estudiante
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL ESTUDIANTE", 15, 45);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Estudiante: ${summary.est_nombre} ${summary.est_apellido}`,
        15,
        52
      );
      doc.text(`DNI: ${summary.est_dni}`, 15, 58);
      doc.text(`Periodo Académico: ${summary.periodo_nombre}`, 15, 64);
      doc.text(
        `Grado/Sección: ${summary.grado_nombre} - ${summary.seccion_nombre}`,
        15,
        70
      );
      doc.text(`Matrícula N°: ${matriculaId}`, 15, 76);

      // Información de la cuota
      doc.setFont("helvetica", "bold");
      doc.text("DETALLE DEL PAGO", 15, 88);

      doc.setFont("helvetica", "normal");
      doc.text(`Concepto: ${cuota.concepto}`, 15, 95);
      doc.text(`Monto Obligatorio: S/ ${cuota.monto_obligatorio}`, 15, 101);
      doc.text(
        `Fecha Límite: ${moment(cuota.fecha_limite).format("DD/MM/YYYY")}`,
        15,
        107
      );

      // Tabla de pagos realizados
      doc.setFont("helvetica", "bold");
      doc.text("PAGOS REALIZADOS", 15, 119);

      const tableData = pagos.map((pago) => [
        moment(pago.fecha_pago).format("DD/MM/YYYY HH:mm"),
        pago.metodo_pago,
        `S/ ${parseFloat(pago.monto).toFixed(2)}`,
        pago.referencia_pago || "-",
      ]);

      autoTable(doc, {
        startY: 123,
        head: [["Fecha de Pago", "Método", "Monto", "Referencia"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        styles: { cellPadding: 3 },
      });

      // Totales - obtener la posición Y final de la tabla
      let finalY = 123 + tableData.length * 10 + 20; // Estimación
      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        finalY = doc.lastAutoTable.finalY + 10;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`Total Pagado: S/ ${cuota.montoPagado.toFixed(2)}`, 15, finalY);
      doc.text(
        `Saldo Pendiente: S/ ${cuota.saldoPendiente.toFixed(2)}`,
        15,
        finalY + 6
      );

      // Estado
      doc.setFontSize(12);
      doc.setTextColor(
        cuota.estadoCuota === "Pagado" ? 34 : 234,
        cuota.estadoCuota === "Pagado" ? 197 : 179,
        cuota.estadoCuota === "Pagado" ? 94 : 8
      );
      doc.text(`Estado: ${cuota.estadoCuota.toUpperCase()}`, 15, finalY + 16);

      // Pie de página
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const footerY = doc.internal.pageSize.height - 20;
      doc.text(
        `Documento generado el: ${moment().format("DD/MM/YYYY HH:mm")}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      doc.text(
        "Este documento es una constancia de pago válida",
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
      );

      // Descargar PDF
      doc.save(
        `Constancia_${cuota.concepto.replace(/\s+/g, "_")}_${
          summary.est_apellido
        }_${moment().format("YYYYMMDD")}.pdf`
      );
    } catch (err) {
      console.error("Error al generar constancia:", err);
      alert("Error al generar la constancia de pago.");
    }
  };

  if (loading || !summary)
    return <div className="p-8 text-center">Cargando estado de cuenta...</div>;

  const targetCuota = summary.cuotas.find(
    (c) => c.cuota_id === parseInt(paymentData.cuota_id)
  );

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">
        Estado de Cuenta - Matrícula #{matriculaId}
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Estudiante:{" "}
        <span className="font-semibold">
          {summary.est_nombre} {summary.est_apellido}
        </span>{" "}
        | Periodo:{" "}
        <span className="font-semibold">{summary.periodo_nombre}</span> | Grado:{" "}
        <span className="font-semibold">
          {summary.grado_nombre} / {summary.seccion_nombre}
        </span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Resumen General */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow-md border-l-4 border-blue-600">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">
              Resumen General
            </h3>
            <div className="flex justify-between text-lg">
              <p>Obligación Total:</p>
              <p className="font-bold">
                S/ {summary.totalObligation.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between text-lg text-green-700">
              <p>Total Pagado:</p>
              <p className="font-bold">S/ {summary.totalPaid.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-xl text-red-600 border-t pt-2 mt-2">
              <p>Saldo Pendiente:</p>
              <p className="font-bold">S/ {summary.totalPending.toFixed(2)}</p>
            </div>
          </div>

          {/* Detalle de Cuotas */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Detalle de Cuotas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs">Concepto</th>
                    <th className="px-3 py-2 text-left text-xs">
                      Monto Oblig.
                    </th>
                    <th className="px-3 py-2 text-left text-xs">Pagado</th>
                    <th className="px-3 py-2 text-left text-xs">Saldo</th>
                    <th className="px-3 py-2 text-left text-xs">F. Límite</th>
                    <th className="px-3 py-2 text-left text-xs">F. Pago</th>
                    <th className="px-3 py-2 text-left text-xs">Referencia</th>
                    <th className="px-3 py-2 text-left text-xs">Estado</th>
                    <th className="px-3 py-2 text-left text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {summary.cuotas.map((c) => (
                    <tr
                      key={c.cuota_id}
                      className={
                        c.cuota_id === parseInt(paymentData.cuota_id)
                          ? "bg-yellow-50 font-medium"
                          : ""
                      }
                    >
                      <td className="px-3 py-2">{c.concepto}</td>
                      <td className="px-3 py-2">S/ {c.monto_obligatorio}</td>
                      <td className="px-3 py-2 text-green-600">
                        S/ {c.montoPagado.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-red-600">
                        S/ {c.saldoPendiente.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {moment(c.fecha_limite).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-3 py-2 text-blue-600">
                        {c.fechaPago
                          ? moment(c.fechaPago).format("DD/MM/YYYY")
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {c.referenciaPago || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 rounded-full ${
                            c.estadoCuota === "Pagado"
                              ? "bg-green-100 text-green-800"
                              : c.estadoCuota === "Parcial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {c.estadoCuota}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {c.montoPagado > 0 && (
                          <button
                            onClick={() => generatePaymentReceipt(c)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 flex items-center gap-1"
                            title="Descargar constancia"
                          >
                            📄 Constancia
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white p-5 rounded-lg shadow-xl border-t-4 border-purple-500">
          <h3 className="text-xl font-bold mb-4 text-purple-700">
            Registrar Pago
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterPayment} className="space-y-4">
            {/* Cuota */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cuota a Pagar (*)
              </label>
              <select
                name="cuota_id"
                value={paymentData.cuota_id}
                onChange={handlePaymentDataChange}
                className="mt-1 block w-full p-2 border rounded"
                required
              >
                <option value="">Seleccione Cuota</option>
                {summary.cuotas.map((c) => (
                  <option key={c.cuota_id} value={c.cuota_id}>
                    {c.concepto} (Saldo: S/ {c.saldoPendiente.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Método de Pago con placeholder fijo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Método de Pago (*)
              </label>
              <select
                name="metodo_pago_id"
                value={paymentData.metodo_pago_id}
                onChange={handlePaymentDataChange}
                className={`mt-1 block w-full p-2 border rounded text-gray-700 ${
                  paymentData.metodo_pago_id === ""
                    ? "text-gray-400"
                    : "text-gray-900"
                }`}
                required
              >
                <option value="" disabled hidden>
                  -- Seleccione Método --
                </option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monto a Pagar (S/) (*)
              </label>
              <input
                type="number"
                name="monto"
                value={paymentData.monto}
                onChange={handlePaymentDataChange}
                step="0.01"
                min="0.01"
                className="mt-1 block w-full p-2 border rounded"
                required
                disabled={targetCuota?.estadoCuota === "Pagado"}
              />
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referencia (Nro. Operación)
              </label>
              <input
                type="text"
                name="referencia_pago"
                value={paymentData.referencia_pago}
                onChange={handlePaymentDataChange}
                className="mt-1 block w-full p-2 border rounded"
                placeholder="Ej: Nro. de Transferencia o Yape"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              disabled={submitLoading || targetCuota?.saldoPendiente <= 0}
            >
              {submitLoading ? "Procesando..." : "Confirmar Registro"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentFormPage;
