import React, { useState } from "react";
import api from "../../api/api";
import moment from "moment";

const ReporteStudent = () => {
  const [dniSearch, setDniSearch] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);

    try {
      // Paso 1: Buscar estudiante por DNI
      const studentRes = await api.get(`/students/dni/${dniSearch}`);
      const studentId = studentRes.data.id;

      // Paso 2: Generar reporte detallado
      const reportRes = await api.get(`/reports/student/${studentId}`);
      setReport(reportRes.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`Estudiante con DNI ${dniSearch} no encontrado.`);
      } else {
        setError(
          err.response?.data?.message ||
            "Error al obtener el historial del estudiante."
        );
      }
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold border-b pb-2">
        Historial Completo por Estudiante
      </h4>

      {/* 🔎 Búsqueda */}
      <form
        onSubmit={handleSearchStudent}
        className="flex space-x-3 items-center"
      >
        <input
          type="text"
          placeholder="DNI del Estudiante"
          value={dniSearch}
          onChange={(e) => setDniSearch(e.target.value)}
          className="p-2 border rounded flex-grow max-w-sm"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          disabled={loading || dniSearch.trim() === ""}
        >
          {loading ? "Buscando..." : "Buscar Historial"}
        </button>
      </form>

      {/* ⚠️ Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* 📊 Resultados */}
      {report?.student && report?.history && (
        <div className="p-4 bg-white border rounded shadow">
          <h5 className="text-xl font-bold mb-4">
            Reporte para: {report.student.nombre} (DNI: {report.student.dni})
          </h5>

          {report.history.length === 0 && (
            <p>No se encontraron matrículas para este estudiante.</p>
          )}

          {report.history.map((mat) => (
            <div
              key={`matricula-${mat.matricula_id}`}
              className="border-l-4 p-4 mb-6 border-indigo-500 bg-gray-50 rounded-lg shadow-sm"
            >
              <h6 className="font-bold text-lg mb-2">
                Matrícula {mat.matricula_id} ({mat.periodo})
              </h6>
              <p className="text-sm">Grado/Sección: {mat.grado_seccion}</p>
              <p className="text-sm mb-3">
                Fecha Matrícula:{" "}
                {moment(mat.fecha_matricula).format("DD/MM/YYYY")}
              </p>

              <h6 className="font-semibold mt-4 mb-2">Detalle de Cuotas:</h6>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-200 text-xs">
                    <tr>
                      <th className="px-3 py-1 text-left">Concepto</th>
                      <th className="px-3 py-1 text-right">Obligación</th>
                      <th className="px-3 py-1 text-right">Pagado</th>
                      <th className="px-3 py-1 text-right">Saldo</th>
                      <th className="px-3 py-1 text-left">F. Límite</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-xs">
                    {mat.cuotas.map((c, i) => (
                      <tr key={`cuota-${mat.matricula_id}-${c.cuota_id || i}`}>
                        <td className="px-3 py-1">{c.cuota_concepto}</td>
                        <td className="px-3 py-1 text-right font-medium">
                          S/ {c.monto_obligatorio.toFixed(2)}
                        </td>
                        <td className="px-3 py-1 text-right text-green-700">
                          S/ {c.total_pagado.toFixed(2)}
                        </td>
                        <td className="px-3 py-1 text-right text-red-700 font-bold">
                          S/ {c.saldo_pendiente.toFixed(2)}
                        </td>
                        <td className="px-3 py-1">
                          {moment(c.fecha_limite).format("DD/MM/YYYY")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReporteStudent;
