import React, { useState, useEffect } from "react";
import api from "../api/api";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";

const StudentFormPage = () => {
  const [studentData, setStudentData] = useState({
    numero_identificacion: "",
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    fecha_nacimiento: "",
    genero: "Masculino",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;

  useEffect(() => {
    // Si viene un DNI desde la búsqueda
    const initialDni = searchParams.get("dni");
    if (!isEditing && initialDni) {
      setStudentData((prev) => ({
        ...prev,
        numero_identificacion: initialDni,
      }));
    }

    // Si estamos editando, cargar datos del estudiante
    if (isEditing) {
      const fetchStudent = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await api.get(`/students/${id}`);
          const data = response.data;

          if (data.fecha_nacimiento) {
            data.fecha_nacimiento = data.fecha_nacimiento.split("T")[0];
          }

          setStudentData(data);
        } catch (err) {
          console.error("Error fetching student:", err);
          setError("Error al cargar los datos del estudiante.");
        } finally {
          setLoading(false);
        }
      };
      fetchStudent();
    }
  }, [id, searchParams, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const studentPayload = {
        ...studentData,
        segundo_nombre: studentData.segundo_nombre || null,
        segundo_apellido: studentData.segundo_apellido || null,
      };

      if (isEditing) {
        await api.put(`/students/${id}`, studentPayload);
        alert(`Estudiante ${studentData.primer_nombre} actualizado.`);
      } else {
        await api.post("/students", studentPayload);
        alert(`Estudiante ${studentData.primer_nombre} creado.`);
      }

      navigate("/estudiantes");
    } catch (err) {
      console.error("Error al guardar estudiante:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(" ") ||
        "Error al procesar la solicitud.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="text-center p-8">Cargando datos...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto my-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? "Editar Estudiante" : "Registrar Nuevo Estudiante"}
        </h2>
        <Link
          to="/estudiantes"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              DNI / Identificación (*)
            </label>
            <input
              type="text"
              name="numero_identificacion"
              value={studentData.numero_identificacion}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Fecha Nacimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de Nacimiento (*)
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={studentData.fecha_nacimiento}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Género (*)
            </label>
            <select
              name="genero"
              value={studentData.genero}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
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
              value={studentData.primer_nombre}
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
              value={studentData.segundo_nombre || ""}
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
              value={studentData.primer_apellido}
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
              value={studentData.segundo_apellido || ""}
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
              ? "Actualizar Estudiante"
              : "Registrar Estudiante"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentFormPage;
