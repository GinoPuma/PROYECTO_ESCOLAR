import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth"; // Necesario para actualizar la institución en el Layout

const InstitutionConfig = () => {
  const { updateInstitutionContext } = useAuth();
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchInstitutionData();
  }, []);

  const fetchInstitutionData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/config/institution");
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
          id: response.data.id || null,
        }));
      }
    } catch (err) {
      setError("Error al cargar la información institucional.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!formData.nombre.trim()) {
      setError("El nombre de la institución es obligatorio.");
      setSaving(false);
      return;
    }

    try {
      const endpoint = formData.id
        ? `/config/institution/${formData.id}`
        : "/config/institution";

      const method = formData.id ? api.put : api.post;

      const response = await method(endpoint, formData);

      // Actualizar el ID en caso de ser una nueva creación
      setFormData((prev) => ({ ...prev, id: response.data.institution.id }));

      // Actualizar contexto si existe
      if (updateInstitutionContext) {
        updateInstitutionContext(response.data.institution);
      }

      setSuccess(response.data.message || "Guardado exitosamente.");
    } catch (err) {
      console.error("Error al guardar institución:", err);
      setError(err.response?.data?.message || "Error al guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-4">Cargando datos institucionales...</div>
    );

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-6">Datos de la Institución</h3>

      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID (oculto) */}
        <input type="hidden" name="id" value={formData.id || ""} />

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre Oficial (*)
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

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : formData.id
              ? "Actualizar Datos"
              : "Guardar Datos"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstitutionConfig;
