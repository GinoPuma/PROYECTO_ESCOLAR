import React, { useState } from "react";
import api from "../../api/api";
import moment from "moment";

const ReporteHistoricoPagos = ({ metodosPago }) => {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    methodId: "",
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
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(
        `/reports/history/payments?${params.toString()}`
      );
      setResults(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Error al obtener el historial de pagos."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
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
