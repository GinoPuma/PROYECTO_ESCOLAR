import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MatriculaFormPage = () => {
  const [matriculaData, setMatriculaData] = useState({
    estudiante_id: "",
    seccion_id: "",
    anio_academico: "",
    fecha_matricula: "",
    estado: "Activo",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [estudiantes, setEstudiantes] = useState([]);
  const [secciones, setSecciones] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError("");
      try {
        const [estudiantesRes, seccionesRes] = await Promise.all([
          api.get("/students"),
          api.get("/config/sections"),
        ]);
        setEstudiantes(estudiantesRes.data);
        setSecciones(seccionesRes.data);

        if (id) {
          setIsEditing(true);
          const response = await api.get(`/enrollments/${id}`);
          const formattedData = {
            ...response.data,
            fecha_matricula: response.data.fecha_matricula
              ? response.data.fecha_matricula.split("T")[0]
              : "",
          };
          console.log("Estado recibido del backend:", response.data.estado);
          setMatriculaData(formattedData);
        }
      } catch (err) {
        console.error("Error fetching initial data for matricula form:", err);
        let errorMessage = id
          ? "Error al cargar datos de la matrícula."
          : "Error al cargar datos para crear matrícula.";
        if (err.response) {
          errorMessage =
            err.response.data?.message || `Error ${err.response.status}`;
        }
        setError(errorMessage);
        if (id && err.response?.status === 404) {
          navigate("/matriculas");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMatriculaData({
      ...matriculaData,
      [name]: value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !matriculaData.estudiante_id ||
      !matriculaData.seccion_id ||
      !matriculaData.anio_academico ||
      !matriculaData.estado
    ) {
      setError(
        "Los campos obligatorios (Estudiante, Sección, Año Académico, Estado) no pueden estar vacíos."
      );
      setLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(matriculaData.anio_academico)) {
      setError("El año académico debe tener 4 dígitos.");
      setLoading(false);
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/enrollments/${id}`, matriculaData);
        alert(
          `Matrícula actualizada exitosamente.`
        );
      } else {
        response = await api.post("/enrollments", matriculaData);
        alert(
          `Matrícula creada exitosamente.`
        );
      }
      navigate("/matriculas");
    } catch (err) {
      console.error("Error submitting matricula form:", err);
      let errorMessage = isEditing
        ? "Error al actualizar la matrícula."
        : "Error al crear la matrícula.";
      if (err.response) {
        errorMessage =
          err.response.data?.message ||
          err.response.data?.errors?.[0]?.msg ||
          `Error ${err.response.status}`;
        if (err.response.status === 409) {
          errorMessage =
            err.response.data?.message ||
            "Error de conflicto: la matrícula ya existe.";
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || "Error de validación.";
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStudentFullName = (student) => {
    return `${student?.primer_nombre || ""} ${
      student?.primer_apellido || ""
    }`.trim();
  };

  const getSectionDetails = (seccion) => {
    return `${seccion?.nombre || ""} (${seccion?.grado_nombre || ""} - ${
      seccion?.nivel_nombre || ""
    })`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? "Editar Matrícula" : "Agregar Nueva Matrícula"}
        </h2>
        <Link
          to="/matriculas"
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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estudiante (*)
          </label>
          <select
            name="estudiante_id"
            value={matriculaData.estudiante_id}
            onChange={handleChange}
            required
            disabled={isEditing}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Seleccionar Estudiante</option>
            {estudiantes.map((estudiante) => (
              <option key={estudiante.id} value={estudiante.id}>
                {getStudentFullName(estudiante)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sección (*)
          </label>
          <select
            name="seccion_id"
            value={matriculaData.seccion_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Seleccionar Sección</option>
            {secciones.map((seccion) => (
              <option key={seccion.id} value={seccion.id}>
                {getSectionDetails(seccion)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Año Académico (*)
          </label>
          <input
            type="text"
            name="anio_academico"
            value={matriculaData.anio_academico}
            onChange={handleChange}
            required
            placeholder="Ej: 2025"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha de Matrícula
          </label>
          <input
            type="date"
            name="fecha_matricula"
            value={matriculaData.fecha_matricula}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estado (*)
          </label>
          <select
            name="estado"
            value={matriculaData.estado}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-2 text-right">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
              bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : isEditing
              ? "Actualizar Matrícula"
              : "Crear Matrícula"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatriculaFormPage;
