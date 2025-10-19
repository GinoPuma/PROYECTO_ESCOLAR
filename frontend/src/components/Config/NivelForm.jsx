import React, { useState, useEffect } from "react";
import api from "../../api/api";
import Modal from "../UI/Modal";

const NivelForm = ({ isOpen, onClose, nivel, onSave }) => {
  const isEditing = !!nivel;
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNombre(nivel?.nombre || "");
    setError("");
  }, [nivel, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/config/niveles/${nivel.id}`, { nombre: nombre.trim() });
      } else {
        await api.post("/config/niveles", { nombre: nombre.trim() });
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Error al guardar nivel:", err);
      setError(err.response?.data?.message || "Error al guardar el nivel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Nivel: ${nivel?.nombre}` : "Crear Nuevo Nivel"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre del Nivel
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
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
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Nivel"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NivelForm;
