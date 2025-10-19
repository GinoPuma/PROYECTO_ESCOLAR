import React, { useState, useEffect } from "react";
import api from "../../api/api";
import Modal from "../UI/Modal";

const SeccionForm = ({
  isOpen,
  onClose,
  seccion,
  grados,
  initialGradoId,
  onSave,
}) => {
  const isEditing = !!seccion;
  const [formData, setFormData] = useState({
    nombre: "",
    grado_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let defaultGradoId = grados && grados.length > 0 ? grados[0].id : "";

    if (seccion) {
      setFormData({
        nombre: seccion.nombre,
        grado_id: seccion.grado_id,
      });
    } else {
      setFormData({
        nombre: "",
        grado_id: initialGradoId || defaultGradoId,
      });
    }

    setError("");
  }, [seccion, isOpen, grados, initialGradoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "grado_id" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.nombre.trim() || !formData.grado_id) {
      setError("Nombre y Grado Educativo son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        grado_id: formData.grado_id,
      };

      if (isEditing) {
        await api.put(`/config/secciones/${seccion.id}`, payload);
      } else {
        await api.post("/config/secciones", payload);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Error al guardar sección:", err);
      setError(err.response?.data?.message || "Error al guardar la sección.");
    } finally {
      setLoading(false);
    }
  };

  if (grados.length === 0 && isOpen) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Error">
        <p>
          No se pueden crear secciones. Primero debe crear Grados Educativos.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing ? `Editar Sección: ${seccion?.nombre}` : "Crear Nueva Sección"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Grado Educativo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Grado
          </label>
          <select
            name="grado_id"
            value={formData.grado_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            disabled={grados.length === 0}
          >
            {grados.map((grado) => (
              <option key={grado.id} value={grado.id}>
                {grado.nivel_nombre} - {grado.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre de la Sección */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre de la Sección (Ej: A, B, Única)
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
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Sección"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SeccionForm;
