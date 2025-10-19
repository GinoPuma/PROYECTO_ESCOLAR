import React, { useState, useEffect } from "react";
import api from "../../api/api";
import Modal from "../UI/Modal";

const PeriodoForm = ({ isOpen, onClose, periodo, onSave }) => {
  const isEditing = !!periodo;
  const [formData, setFormData] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (periodo) {
      setFormData({
        nombre: periodo.nombre,
        fecha_inicio: periodo.fecha_inicio
          ? periodo.fecha_inicio.split("T")[0]
          : "",
        fecha_fin: periodo.fecha_fin ? periodo.fecha_fin.split("T")[0] : "",
        activo: periodo.activo === 1,
      });
    } else {
      setFormData({
        nombre: "",
        fecha_inicio: "",
        fecha_fin: "",
        activo: false,
      });
    }
    setError("");
  }, [periodo, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !formData.nombre.trim() ||
      !formData.fecha_inicio ||
      !formData.fecha_fin
    ) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        activo: formData.activo ? 1 : 0,
      };

      if (isEditing) {
        await api.put(`/config/periodos/${periodo.id}`, dataToSubmit);
      } else {
        await api.post("/config/periodos", dataToSubmit);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Error al guardar periodo:", err);
      setError(err.response?.data?.message || "Error al guardar el periodo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing ? `Editar Periodo: ${periodo?.nombre}` : "Crear Nuevo Periodo"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha Inicio
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha Fin
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        {/* Activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Periodo Activo (Permite Matrículas)
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 py-2 px-4 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Periodo"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PeriodoForm;
