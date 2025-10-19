import React, { useState, useEffect } from "react";
import api from "../../api/api";
import Modal from "../UI/Modal";

const GradoForm = ({
  isOpen,
  onClose,
  grado,
  niveles,
  initialNivelId,
  onSave,
}) => {
  const isEditing = !!grado;
  const [formData, setFormData] = useState({
    nombre: "",
    nivel_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let defaultNivelId = niveles && niveles.length > 0 ? niveles[0].id : "";

    if (grado) {
      setFormData({
        nombre: grado.nombre,
        nivel_id: grado.nivel_id,
      });
    } else {
      setFormData({
        nombre: "",
        nivel_id: initialNivelId || defaultNivelId,
      });
    }

    setError("");
  }, [grado, isOpen, niveles, initialNivelId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "nivel_id" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.nombre.trim() || !formData.nivel_id) {
      setError("Nombre y Nivel Educativo son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        nivel_id: formData.nivel_id,
      };

      if (isEditing) {
        await api.put(`/config/grados/${grado.id}`, payload);
      } else {
        await api.post("/config/grados", payload);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Error al guardar grado:", err);
      setError(err.response?.data?.message || "Error al guardar el grado.");
    } finally {
      setLoading(false);
    }
  };

  if (niveles.length === 0 && isOpen) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Error">
        <p>No se pueden crear grados. Primero debe crear Niveles Educativos.</p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Grado: ${grado?.nombre}` : "Crear Nuevo Grado"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Nivel Educativo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nivel Educativo
          </label>
          <select
            name="nivel_id"
            value={formData.nivel_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            disabled={niveles.length === 0}
          >
            {niveles.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>
                {nivel.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre del Grado */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre del Grado (Ej: 1er, 6to)
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
            {loading ? "Guardando..." : "Guardar Grado"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GradoForm;
