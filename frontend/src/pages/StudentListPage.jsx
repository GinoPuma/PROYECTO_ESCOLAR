import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

const StudentListPage = () => {
  // Estado principal
  const [students, setStudents] = useState([]);
  const [allStudentsCache, setAllStudentsCache] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dniSearch, setDniSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/students");
      setStudents(response.data);
      setAllStudentsCache(response.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Error al cargar la lista de estudiantes.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setStudents(allStudentsCache);
    setDniSearch("");
    setError("");
  };

  const handleDniSearch = async (e) => {
    e.preventDefault();

    if (!dniSearch.trim()) {
      handleClearSearch();
      setError("Por favor, ingrese un DNI para buscar.");
      return;
    }

    // Validación opcional de formato de DNI
    if (!/^\d{8}$/.test(dniSearch.trim())) {
      setError("El DNI debe tener 8 dígitos numéricos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.get(`/students/dni/${dniSearch.trim()}`);
      const student = response.data;
      setStudents([student]);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const confirmRegister = window.confirm(
          `Estudiante con DNI ${dniSearch.trim()} no encontrado. ¿Desea registrarlo ahora?`
        );
        if (confirmRegister) {
          navigate(`/estudiantes/new?dni=${dniSearch.trim()}`);
        }
      } else {
        console.error("Error during DNI search:", err);
        setError(
          err.response?.data?.message || "Ocurrió un error al buscar por DNI."
        );
      }
      setStudents(allStudentsCache);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteStudent = async (studentId, name, dni) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar al estudiante: ${name} (${dni})? Esta acción es permanente.`
      )
    ) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.delete(`/students/${studentId}`);
      alert(`Estudiante ${name} eliminado exitosamente.`);

      // Refrescar la lista de estudiantes
      fetchStudents();
    } catch (err) {
      console.error("Error al eliminar estudiante:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Error al eliminar. Revise si el estudiante tiene matrículas activas.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (studentId, name) => {
    alert(
      `Implementación de visualización de historial de matrículas para ${name} (ID: ${studentId})`
    );
  };

  const isFiltered =
    dniSearch.trim() !== "" &&
    students.length === 1 &&
    allStudentsCache.length > 1;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Gestión de Estudiantes
      </h2>

      {/* Formulario de Búsqueda de DNI */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <form
          onSubmit={handleDniSearch}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            placeholder="Buscar por DNI/Identificación"
            value={dniSearch}
            onChange={(e) => setDniSearch(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar Estudiante"}
          </button>
          <Link
            to="/estudiantes/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            + Nuevo
          </Link>
        </form>
      </div>

      {/* Alerta de error o información */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">¡Alerta!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {/* Listado de Estudiantes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 flex justify-between items-center">
          Listado{" "}
          {isFiltered && (
            <span className="text-gray-500 text-sm">
              (Resultado de búsqueda)
            </span>
          )}
          {isFiltered && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Mostrar todos
            </button>
          )}
        </h3>

        {loading && !students.length ? (
          <div className="text-center py-4">Cargando listado...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No hay estudiantes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    F. Nacimiento
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const fullName = `${student.primer_nombre} ${student.primer_apellido}`;
                  return (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.numero_identificacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.fecha_nacimiento
                          ? new Date(
                              student.fecha_nacimiento
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-3">
                        <Link
                          to={`/estudiantes/edit/${student.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Editar
                        </Link>
                        {/* <button
                          onClick={() =>
                            handleViewHistory(student.id, fullName)
                          }
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          Historial
                        </button> */}
                        <button
                          onClick={() =>
                            handleDeleteStudent(
                              student.id,
                              fullName,
                              student.numero_identificacion
                            )
                          }
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentListPage;
