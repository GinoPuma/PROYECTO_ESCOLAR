import React, { useState } from "react";
import api from "../../api/api";
import moment from "moment";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ReporteHistoricoPagos = ({ metodosPago }) => {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    methodId: "",
    statusFilter: "COMPLETADO",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError("");
    setResults([]);

    const { statusFilter, ...params } = filters;
    const queryParams = new URLSearchParams(params);

    try {
      let response;

      if (statusFilter === "COMPLETADO") {
        // Si el filtro es COMPLETO, buscamos en la tabla de PAGOS (Transacciones)
        response = await api.get(
          `/reports/history/payments?${queryParams.toString()}`
        );
      } else {
        // Si el filtro es PENDIENTE/PARCIAL/PAGADO, buscamos en la tabla de OBLIGACIONES (Cuotas)
        response = await api.get(`/reports/obligations?status=${statusFilter}`);
      }

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al obtener el historial.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const handleExportPDF = () => {
    if (results.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    let y = 15;

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE HISTÓRICO DE INGRESOS", 15, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${moment().format("DD/MM/YYYY HH:mm")}`, 15, y);
    y += 5;

    // Preparar los datos para autoTable
    const head = [
      [
        "ID Pago",
        "Estudiante",
        "Concepto (Cuota)",
        "Monto",
        "Fecha Pago",
        "Método",
        "Referencia",
      ],
    ];

    const body = results.map((p) => [
      p.id,
      `${p.est_nombre} ${p.est_apellido}`,
      p.cuota_concepto,
      `S/ ${parseFloat(p.monto).toFixed(2)}`,
      moment(p.fecha_pago).format("DD/MM/YYYY"),
      p.metodo,
      p.referencia_pago || "-",
    ]);

    // Generar la tabla
    autoTable(doc, {
      startY: y + 5,
      head: head,
      body: body,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [52, 58, 64] },
      columnStyles: { 3: { halign: "right" } }, // Alinear Monto a la derecha
    });

    // Suma total (Opcional, pero útil)
    const totalMonto = results.reduce((sum, p) => sum + parseFloat(p.monto), 0);

    y = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total de Ingresos Reportados: S/ ${totalMonto.toFixed(2)}`,
      pageWidth - 15,
      y,
      { align: "right" }
    );

    doc.save(`Reporte_Pagos_${moment().format("YYYYMMDD")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold border-b pb-2">
        Historial Detallado de Pagos
      </h4>

      {/* Filtros */}
      <div className="flex space-x-3 items-end p-4 bg-gray-50 rounded-lg border">
        <div>
          <label className="block text-sm">Desde Fecha</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Hasta Fecha</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Método de Pago</label>
          <select
            name="methodId"
            value={filters.methodId}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Todos</option>
            {(metodosPago || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerateReport}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 h-fit"
          disabled={
            loading ||
            (!filters.startDate && !filters.endDate && !filters.methodId)
          }
        >
          {loading ? "Buscando..." : "Buscar Pagos"}
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 h-fit"
          disabled={results.length === 0}
        >
          Exportar PDF
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Resultados */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h5 className="font-medium mb-3">
          Resultados ({results.length} pagos)
        </h5>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs">ID Pago</th>
                <th className="px-3 py-2 text-left text-xs">Estudiante</th>
                <th className="px-3 py-2 text-left text-xs">
                  Concepto (Cuota)
                </th>
                <th className="px-3 py-2 text-left text-xs">Monto</th>
                <th className="px-3 py-2 text-left text-xs">Fecha Pago</th>
                <th className="px-3 py-2 text-left text-xs">Método</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {results.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2">
                    {p.est_nombre} {p.est_apellido}
                  </td>
                  <td className="px-3 py-2">{p.cuota_concepto}</td>
                  <td className="px-3 py-2 font-semibold text-green-700">
                    S/ {parseFloat(p.monto).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {moment(p.fecha_pago).format("DD/MM/YYYY")}
                  </td>
                  <td className="px-3 py-2">{p.metodo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReporteHistoricoPagos;
