import React, { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MatriculasListPage = () => {
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterAnioAcademico, setFilterAnioAcademico] = useState("");
  const [allStudents, setAllStudents] = useState([]);

  // Obtener matrículas
  const fetchMatriculas = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/enrollments";
      const params = [];
      if (filterStudentId) params.push(`studentId=${filterStudentId}`);
      if (filterAnioAcademico)
        params.push(`anioAcademico=${filterAnioAcademico}`);

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await api.get(url);
      setMatriculas(response.data);
    } catch (err) {
      console.error("Error fetching matriculas:", err);
      let errorMessage = "No se pudieron cargar las matrículas.";
      if (err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
        if (err.response.status === 403) {
          errorMessage = "No tienes permisos para ver esta sección.";
        }
      }
      setError(errorMessage);
      setMatriculas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForFilter = async () => {
    try {
      const response = await api.get("/students");
      setAllStudents(response.data);
    } catch (err) {
      console.error("Error fetching students for filter:", err);
      setError("Error al cargar la lista de estudiantes para filtrar.");
    }
  };

  useEffect(() => {
    fetchMatriculas();
    fetchStudentsForFilter();
  }, [filterStudentId, filterAnioAcademico]);

  const handleDeleteMatricula = async (matriculaId, studentFullName) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar la matrícula de ${studentFullName}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setError("");
    try {
      await api.delete(`/enrollments/${matriculaId}`);
      setMatriculas(matriculas.filter((m) => m.id !== matriculaId));
      alert(`Matrícula de ${studentFullName} eliminada exitosamente.`);
    } catch (err) {
      console.error("Error deleting matricula:", err);
      let errorMessage = "Error al eliminar la matrícula.";
      if (err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
    }
  };

  const renderActions = (matricula) => {
    const studentFullName = `${matricula.estudiante_primer_nombre || ""} ${
      matricula.estudiante_primer_apellido || ""
    }`.trim();
    return (
      <div className="flex space-x-2">
        <Link
          to={`/matriculas/edit/${matricula.id}`}
          className="text-yellow-600 hover:text-yellow-800 font-medium"
        >
          Editar
        </Link>
        {user?.rol === "Administrador" && (
          <button
            onClick={() => handleDeleteMatricula(matricula.id, studentFullName)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Eliminar
          </button>
        )}
      </div>
    );
  };

  const columns = useMemo(
    () => [
      { Header: "ID Matrícula", accessor: "id" },
      {
        Header: "Estudiante",
        accessor: (row) =>
          `${row.estudiante_primer_nombre || ""} ${
            row.estudiante_primer_apellido || ""
          }`.trim(),
      },
      { Header: "Año Académico", accessor: "anio_academico" },
      {
        Header: "Fecha Matrícula",
        accessor: (row) =>
          row.fecha_matricula
            ? new Date(row.fecha_matricula).toLocaleDateString()
            : "",
      },
      { Header: "Nivel", accessor: "nombre_nivel" },
      { Header: "Grado", accessor: "nombre_grado" },
      { Header: "Sección", accessor: "nombre_seccion" },
      { Header: "Estado", accessor: "estado" },
      { Header: "Acciones", accessor: renderActions },
    ],
    [user, matriculas]
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Listado de Matrículas
        </h2>
        <Link
          to="/matriculas/new"
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
          Nueva Matrícula
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

      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-inner">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label
              htmlFor="filterStudentId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Estudiante
            </label>
            <select
              id="filterStudentId"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos los estudiantes</option>
              {allStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.primer_nombre} {student.primer_apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filterAnioAcademico"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Año Académico
            </label>
            <input
              type="text"
              id="filterAnioAcademico"
              value={filterAnioAcademico}
              onChange={(e) => setFilterAnioAcademico(e.target.value)}
              placeholder="Ej: 2024"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStudentId("");
                setFilterAnioAcademico("");
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500 text-lg">Cargando matrículas...</p>
        </div>
      )}

      {!loading && !error && matriculas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay matrículas registradas aún. ¡Crea la primera!
        </div>
      )}

      {!loading && !error && matriculas.length > 0 && (
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
              {matriculas.map((matricula) => (
                <tr
                  key={matricula.id}
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
                        ? col.accessor(matricula)
                        : matricula[col.accessor]}
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

export default MatriculasListPage;
