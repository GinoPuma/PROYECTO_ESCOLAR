import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const EstudiantesListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/students");
      setStudents(response.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      let errorMessage = "No se pudieron cargar los estudiantes.";
      if (err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
        if (err.response.status === 403) {
          errorMessage = "No tien es permisos para ver esta sección.";
        }
      }
      setError(errorMessage);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteStudent = async (studentId, studentName) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar a ${studentName}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setError("");
    try {
      await api.delete(`/students/${studentId}`);
      setStudents(students.filter((student) => student.id !== studentId));
      alert(`${studentName} eliminado exitosamente.`);
    } catch (err) {
      console.error("Error deleting student:", err);
      let errorMessage = "Error al eliminar al estudiante.";
      if (err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
    }
  };

  const renderActions = (student) => {
    return (
      <div className="flex space-x-2">
        <Link
          to={`/students/edit/${student.id}`}
          className="text-yellow-600 hover:text-yellow-800 font-medium"
        >
          Editar
        </Link>
        {user?.rol === "Administrador" && (
          <button
            onClick={() =>
              handleDeleteStudent(
                student.id,
                `${student.primer_nombre} ${student.primer_apellido}`
              )
            }
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Eliminar
          </button>
        )}
      </div>
    );
  };

  const columns = [
    {
      Header: "Nombre Completo",
      accessor: (row) =>
        `${row.primer_nombre} ${row.segundo_nombre || ""} ${
          row.primer_apellido
        } ${row.segundo_apellido || ""}`.trim(),
    },
    {
      Header: "DNI",
      accessor: (row) => `${row.numero_identificacion}`,
    },
    {
      Header: "Fecha Nacimiento",
      accessor: (row) => {
        if (!row.fecha_nacimiento) return "";
        try {
          const dateObj = new Date(row.fecha_nacimiento);
          return dateObj.toISOString().split("T")[0];
        } catch (e) {
          console.error("Error formateando fecha:", row.fecha_nacimiento, e);
          return row.fecha_nacimiento;
        }
      },
    },
    { Header: "Género", accessor: "genero" },
    { Header: "Email", accessor: "email" },
    { Header: "Teléfono", accessor: "telefono" },
    { Header: "Nivel", accessor: "nombre_nivel" },
    { Header: "Grado", accessor: "nombre_grado" },
    { Header: "Sección", accessor: "nombre_seccion" },
    { Header: "Estado Matrícula", accessor: "estado_matricula" },
    { Header: "Acciones", accessor: renderActions },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Listado de Estudiantes
        </h2>
        <Link
          to="/students/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nuevo Estudiante
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

      {loading && (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500 text-lg">Cargando estudiantes...</p>
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay estudiantes registrados aún. ¡Agrega el primero!
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.Header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, rowIndex) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        col.accessor === renderActions
                          ? "text-right"
                          : "text-gray-900"
                      }`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(student)
                        : student[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EstudiantesListPage;
