import React, { useState, useEffect } from "react";
import api from "../api/api";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";

import AssociationManager from "../components/AssociationManager";

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
  const [refreshAssociations, setRefreshAssociations] = useState(0);

  // Cargar datos al editar o precargar DNI si se envía por URL
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
          setError("Error al cargar los datos del apoderado.");
        } finally {
          setLoading(false);
        }
      };
      fetchApoderado();
    }
  }, [id, searchParams, isEditing]);

  // Manejo de cambios de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setApoderadoData({ ...apoderadoData, [name]: value });
    setError("");
  };

  // Eliminar apoderado
  const handleDelete = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente al apoderado con DNI ${apoderadoData.dni}? Esta acción es irreversible.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.delete(`/apoderados/${id}`);
      alert(`Apoderado ${apoderadoData.primer_nombre} eliminado exitosamente.`);
      navigate("/responsables");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Error al eliminar el apoderado. Revise si está asociado a alguna matrícula.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Crear o actualizar apoderado
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
      };

      if (isEditing) {
        await api.put(`/apoderados/${id}`, payload);
        alert(`Apoderado ${apoderadoData.primer_nombre} actualizado.`);
      } else {
        const response = await api.post("/apoderados", payload);
        const newId = response.data.apoderado.id; 

        alert(
          `Apoderado ${apoderadoData.primer_nombre} registrado. Ahora puede asociar estudiantes.`
        ); 

        navigate(`/responsables/edit/${newId}`);
        return;
      }
      navigate("/responsables");
    } catch (err) {
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
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
              disabled={isEditing}
            />
          </div>
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
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Segundo Nombre
            </label>
            <input
              type="text"
              name="segundo_nombre"
              value={apoderadoData.segundo_nombre || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>
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
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Segundo Apellido
            </label>
            <input
              type="text"
              name="segundo_apellido"
              value={apoderadoData.segundo_apellido || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>
        </div>

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
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
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
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center border-t pt-6">
          <button
            type="submit"
            className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                            bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                            ${isEditing ? "" : "w-full"}`}
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
      {isEditing && (
        <div className="mt-8 border-t pt-6">
          <AssociationManager
            entityId={id}
            entityType="apoderado"
            onUpdate={() => setRefreshAssociations((prev) => prev + 1)}
          />
        </div>
      )}
    </div>
  );
};

export default ApoderadoFormPage;
