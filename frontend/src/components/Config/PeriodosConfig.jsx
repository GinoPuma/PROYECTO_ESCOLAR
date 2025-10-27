import React, { useState, useEffect } from "react";
import api from "../../api/api";
import moment from "moment";
import PeriodoForm from "./PeriodoForm";
import CuotaForm from "./CuotaForm";

const PeriodosConfig = () => {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [tiposPago, setTiposPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de modales
  const [isPeriodoModalOpen, setIsPeriodoModalOpen] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState(null);
  const [isCuotaModalOpen, setIsCuotaModalOpen] = useState(false);
  const [editingCuota, setEditingCuota] = useState(null);

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/config/periodos");
      setPeriodos(response.data);
      if (response.data.length > 0) {
        const activePeriodo = response.data.find((p) => p.activo === 1);
        const defaultSelection =
          selectedPeriodoId ||
          (activePeriodo ? activePeriodo.id : response.data[0].id);
        setSelectedPeriodoId(defaultSelection);
      } else {
        setSelectedPeriodoId(null);
        setCuotas([]);
        setTiposPago([]);
      }
    } catch (err) {
      setError("Error al cargar la lista de periodos académicos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodoId) {
      fetchCuotas(selectedPeriodoId);
    } else {
      setCuotas([]);
      setTiposPago([]);
    }
  }, [selectedPeriodoId]);

  const fetchCuotas = async (periodoId) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/config/periodos/${periodoId}/cuotas`);
      setCuotas(response.data.cuotas);
      setTiposPago(response.data.tiposPago);
    } catch (err) {
      setError("Error al cargar las cuotas y tipos de pago para el periodo.");
      setCuotas([]);
      setTiposPago([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodoChange = (e) => {
    setSelectedPeriodoId(parseInt(e.target.value));
  };

  // --- CRUD Periodos ---
  const handleAddPeriodo = () => {
    setEditingPeriodo(null);
    setIsPeriodoModalOpen(true);
  };

  const handleEditPeriodo = (periodo) => {
    setEditingPeriodo(periodo);
    setIsPeriodoModalOpen(true);
  };

  const handleDeletePeriodo = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el periodo ${nombre}? Esto también eliminará todas las cuotas asociadas.`
      )
    )
      return;

    setLoading(true);
    setError("");
    try {
      await api.delete(`/config/periodos/${id}`);
      alert(`Periodo ${nombre} eliminado.`);
      fetchPeriodos();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar el periodo. Revise si tiene matrículas asociadas."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Cuotas ---
  const handleAddCuota = () => {
    if (!selectedPeriodoId) {
      setError("Debe seleccionar un periodo para añadir cuotas.");
      return;
    }
    setEditingCuota(null);
    setIsCuotaModalOpen(true);
  };

  const handleEditCuota = (cuota) => {
    setEditingCuota(cuota);
    setIsCuotaModalOpen(true);
  };

  const handleDeleteCuota = async (id, concepto) => {
    if (!window.confirm(`¿Está seguro de eliminar la cuota ${concepto}?`))
      return;

    setLoading(true);
    setError("");
    try {
      await api.delete(`/config/cuotas/${id}`);
      alert(`Cuota ${concepto} eliminada.`);
      fetchCuotas(selectedPeriodoId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar la cuota. Revise si está asociada a pagos."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedPeriodo = periodos.find((p) => p.id === selectedPeriodoId);

  if (loading && periodos.length === 0)
    return <div className="text-center py-4">Cargando configuración...</div>;

  return (
    <div className="overflow-x-auto">
      {/* Modal de Periodos */}
      <PeriodoForm
        isOpen={isPeriodoModalOpen}
        onClose={() => setIsPeriodoModalOpen(false)}
        periodo={editingPeriodo}
        onSave={fetchPeriodos}
      />

      {/* Modal de Cuotas */}
      <CuotaForm
        isOpen={isCuotaModalOpen}
        onClose={() => setIsCuotaModalOpen(false)}
        cuota={editingCuota}
        periodoId={selectedPeriodoId}
        tiposPago={tiposPago}
        onSave={() => fetchCuotas(selectedPeriodoId)}
      />

      {/* Error general */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <h3 className="text-xl font-semibold mb-3">
        Gestión de Periodos Académicos
      </h3>
      <div className="flex space-x-4 mb-6 items-center">
        <select
          value={selectedPeriodoId || ""}
          onChange={handlePeriodoChange}
          className="p-2 border rounded shadow-sm"
          disabled={!periodos.length && !loading}
        >
          {periodos.length === 0 ? (
            <option value="" disabled>
              No hay periodos creados
            </option>
          ) : (
            periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.activo === 1 ? " (ACTIVO)" : ""}
              </option>
            ))
          )}
        </select>

        <button
          onClick={handleAddPeriodo}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md text-sm"
        >
          + Nuevo Periodo
        </button>

        {selectedPeriodo && (
          <>
            <button
              onClick={() => handleEditPeriodo(selectedPeriodo)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-md text-sm"
            >
              Editar Periodo
            </button>
            <button
              onClick={() =>
                handleDeletePeriodo(selectedPeriodo.id, selectedPeriodo.nombre)
              }
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md text-sm"
            >
              Eliminar Periodo
            </button>
          </>
        )}
      </div>

      {selectedPeriodoId && (
        <>
          <h3 className="text-xl font-semibold my-4">
            Cuotas para {selectedPeriodo?.nombre}
          </h3>
          <button
            onClick={handleAddCuota}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md text-sm mb-4"
            disabled={tiposPago.length === 0}
          >
            + Nueva Cuota
          </button>
          {tiposPago.length === 0 && (
            <p className="text-sm text-red-500">
              Advertencia: No hay Tipos de Pago configurados.
            </p>
          )}

          {loading && cuotas.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Cargando cuotas...
            </div>
          ) : cuotas.length === 0 ? (
            <p className="text-gray-500">
              No hay cuotas configuradas para este periodo.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 shadow overflow-hidden sm:rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Límite
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cuotas.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {c.orden || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {c.concepto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {c.tipo_pago_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      S/ {parseFloat(c.monto).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {moment(c.fecha_limite).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleEditCuota(c)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCuota(c.id, c.concepto)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default PeriodosConfig;
