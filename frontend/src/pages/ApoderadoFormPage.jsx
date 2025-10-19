import React, { useState, useEffect } from "react";
import api from "../api/api";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";

const ApoderadoFormPage = () => {
  const [apoderadoData, setApoderadoData] = useState({
    dni: "",
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    telefono: "",
    email: "",
    direccion: "",
    parentesco: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;

  useEffect(() => {
    const initialDni = searchParams.get("dni");
    if (!isEditing && initialDni) {
      setApoderadoData((prev) => ({ ...prev, dni: initialDni }));
    }

    if (isEditing) {
      const fetchApoderado = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await api.get(`/apoderados/${id}`);
          setApoderadoData(response.data);
        } catch (err) {
          console.error("Error fetching apoderado:", err);
          setError("Error al cargar los datos del apoderado.");
        } finally {
          setLoading(false);
        }
      };
      fetchApoderado();
    }
  }, [id, searchParams, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setApoderadoData({ ...apoderadoData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...apoderadoData,
        segundo_nombre: apoderadoData.segundo_nombre || null,
        segundo_apellido: apoderadoData.segundo_apellido || null,
        email: apoderadoData.email || null,
        direccion: apoderadoData.direccion || null,
        parentesco: apoderadoData.parentesco || null,
      };

      if (isEditing) {
        await api.put(`/apoderados/${id}`, payload);
        alert(
          `Apoderado ${apoderadoData.primer_nombre} actualizado correctamente.`
        );
      } else {
        await api.post("/apoderados", payload);
        alert(
          `Apoderado ${apoderadoData.primer_nombre} registrado correctamente.`
        );
      }

      navigate("/responsables");
    } catch (err) {
      console.error("Error al guardar apoderado:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(" ") ||
        "Error al procesar la solicitud.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing)
    return <div className="text-center p-8">Cargando datos...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto my-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? "Editar Apoderado" : "Registrar Nuevo Apoderado"}
        </h2>
        <Link
          to="/responsables"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Volver al Listado
        </Link>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">¡Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              DNI (*)
            </label>
            <input
              type="text"
              name="dni"
              value={apoderadoData.dni}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono (*)
            </label>
            <input
              type="tel"
              name="telefono"
              value={apoderadoData.telefono}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primer Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primer Nombre (*)
            </label>
            <input
              type="text"
              name="primer_nombre"
              value={apoderadoData.primer_nombre}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Segundo Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Segundo Nombre
            </label>
            <input
              type="text"
              name="segundo_nombre"
              value={apoderadoData.segundo_nombre || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Primer Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primer Apellido (*)
            </label>
            <input
              type="text"
              name="primer_apellido"
              value={apoderadoData.primer_apellido}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Segundo Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Segundo Apellido
            </label>
            <input
              type="text"
              name="segundo_apellido"
              value={apoderadoData.segundo_apellido || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Dirección y Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={apoderadoData.direccion || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={apoderadoData.email || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="pt-4 text-right">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : isEditing
              ? "Actualizar Apoderado"
              : "Registrar Apoderado"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApoderadoFormPage;
