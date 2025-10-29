import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

const StudentListPage = () => {
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

  if (loading)
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">Cargando estudiantes...</p>
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Título */}
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Gestión de Estudiantes
          </h2>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* BLOQUE DE FILTRO DE DNI */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">🔍</span> Buscar Estudiante por DNI
            </h3>
            <button
              onClick={handleClearSearch}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
            >
              <span>🔄</span> Limpiar
            </button>
          </div>

          <form
            onSubmit={handleDniSearch}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI Estudiante
              </label>
              <input
                type="text"
                placeholder="Ingrese número de DNI (8 dígitos)"
                value={dniSearch}
                onChange={(e) => setDniSearch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition"
              >
                Buscar
              </button>
              <Link
                to="/estudiantes/new"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 px-4 rounded-lg shadow-md text-center transition"
              >
                + Nuevo
              </Link>
            </div>
          </form>
        </div>

        {/* TABLA DE ESTUDIANTES */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Fecha de Nacimiento
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => {
                  const fullName = `${student.primer_nombre} ${student.primer_apellido}`;
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-purple-50 transition ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {student.numero_identificacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-sm">
                              {student.primer_nombre?.charAt(0)}
                              {student.primer_apellido?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {fullName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.fecha_nacimiento
                          ? new Date(
                              student.fecha_nacimiento
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex justify-center gap-2">
                          <Link
                            to={`/matriculas/new?dni=${student.numero_identificacion}`}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition"
                            title="Matricular estudiante"
                          >
                            📝 Matricular
                          </Link>
                          <Link
                            to={`/estudiantes/edit/${student.id}`}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition"
                          >
                            ✏️ Editar
                          </Link>
                          <button
                            onClick={() =>
                              handleDeleteStudent(
                                student.id,
                                fullName,
                                student.numero_identificacion
                              )
                            }
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mensaje cuando no hay estudiantes */}
          {students.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎓</div>
              <p className="text-gray-500 text-lg">
                No hay estudiantes registrados.
              </p>
              <Link
                to="/estudiantes/new"
                className="mt-4 inline-block text-purple-600 hover:text-purple-800 font-medium"
              >
                Registrar nuevo estudiante
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentListPage;
