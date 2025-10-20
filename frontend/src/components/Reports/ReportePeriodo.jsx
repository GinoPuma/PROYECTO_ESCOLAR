  import React, { useState } from "react";
  import api from "../../api/api";

  const ReportePeriodo = ({ periodos }) => {
    const [selectedPeriodo, setSelectedPeriodo] = useState("");
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerateReport = async () => {
      if (!selectedPeriodo) {
        setError("Seleccione un período académico.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await api.get(
          `/reports/period/summary/${selectedPeriodo}`
        );
        setSummary(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Error al obtener el resumen del período."
        );
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold border-b pb-2">
          Resumen Financiero y Matrículas por Período
        </h4>

        <div className="flex space-x-3 items-center">
          <select
            value={selectedPeriodo}
            onChange={(e) => setSelectedPeriodo(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Seleccione Periodo (*)</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerateReport}
            className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
            disabled={loading || !selectedPeriodo}
          >
            {loading ? "Generando..." : "Generar Resumen"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{}</div>
        )}

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReportCard
              title="Matriculados"
              value={summary.total_matriculados}
              icon="🧑‍🎓"
              color="bg-indigo-500"
            />
            <ReportCard
              title="Ingresos Recibidos"
              value={`S/ ${summary.total_ingresos}`}
              icon="💰"
              color="bg-green-500"
            />
            <ReportCard
              title="Deuda Pendiente"
              value={`S/ ${summary.total_deuda}`}
              icon="🚨"
              color="bg-red-500"
            />
          </div>
        )}
      </div>
    );
  };

  const ReportCard = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg shadow-lg text-white ${color}`}>
      <p className="text-3xl font-bold">
        {icon} {value}
      </p>
      <p className="mt-1 text-sm">{title}</p>
    </div>
  );

  export default ReportePeriodo;
