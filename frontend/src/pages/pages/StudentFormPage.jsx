import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; 

const EstudianteFormPage = () => {
  const [studentData, setStudentData] = useState({
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    fecha_nacimiento: "",
    genero: "Masculino", 
    numero_identificacion: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams(); 
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      const fetchStudent = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await api.get(`/students/${id}`);
          const formattedData = {
            ...response.data,
            fecha_nacimiento: response.data.fecha_nacimiento.split("T")[0], 
          };
          setStudentData(formattedData);
        } catch (err) {
          console.error("Error fetching student for edit:", err);
          let errorMessage = `Error al cargar datos del estudiante con ID ${id}.`;
          if (err.response) {
            errorMessage =
              err.response.data?.message || `Error ${err.response.status}`;
          }
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchStudent();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData({
      ...studentData,
      [name]: value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); 

    if (
      !studentData.primer_nombre ||
      !studentData.primer_apellido ||
      !studentData.fecha_nacimiento ||
      !studentData.genero ||
      !studentData.numero_identificacion
    ) {
      setError(
        "Los campos obligatorios (Nombre, Apellido, Fecha Nacimiento, Género, Identificación) no pueden estar vacíos."
      );
      setLoading(false);
      return;
    }
    if (studentData.email && !/\S+@\S+\.\S+/.test(studentData.email)) {
      setError("El formato del email no es válido.");
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/students/${id}`, studentData);
        alert(
          `${studentData.primer_nombre} ${studentData.primer_apellido} actualizado exitosamente.`
        );
      } else {
        await api.post("/students", studentData);
        alert(
          `Estudiante ${studentData.primer_nombre} ${studentData.primer_apellido} creado exitosamente.`
        );
      }
      navigate("/estudiantes"); 
    } catch (err) {
      console.error("Error submitting student form:", err);
      let errorMessage = isEditing
        ? "Error al actualizar el estudiante."
        : "Error al crear el estudiante.";
      if (err.response) {
        errorMessage =
          err.response.data?.message ||
          err.response.data?.errors?.[0]?.msg ||
          `Error ${err.response.status}`;
        if (err.response.status === 409) {
          errorMessage =
            err.response.data?.message ||
            "El número de identificación o email ya está registrado.";
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? "Editar Estudiante" : "Agregar Nuevo Estudiante"}
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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
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

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              DNI (*)
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={studentData.email || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="text"
              name="telefono"
              value={studentData.telefono || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <textarea
            name="direccion"
            value={studentData.direccion || ""}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
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
              ? "Actualizar Estudiante"
              : "Agregar Estudiante"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EstudianteFormPage;
