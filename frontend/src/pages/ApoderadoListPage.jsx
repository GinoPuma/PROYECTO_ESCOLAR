import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

const ApoderadoListPage = () => {
  const [apoderados, setApoderados] = useState([]);
  const [allApoderadosCache, setAllApoderadosCache] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dniSearch, setDniSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchApoderados();
  }, []);

  const fetchApoderados = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/apoderados");
      setApoderados(response.data);
      setAllApoderadosCache(response.data);
    } catch (err) {
      console.error("Error fetching apoderados:", err);
      setError("Error al cargar la lista de apoderados.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setApoderados(allApoderadosCache);
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
      const response = await api.get(`/apoderados/dni/${dniSearch.trim()}`);
      const apoderado = response.data;
      setApoderados([apoderado]);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const confirmRegister = window.confirm(
          `Apoderado con DNI ${dniSearch.trim()} no encontrado. ¿Desea registrarlo ahora?`
        );
        if (confirmRegister) {
          navigate(`/responsables/new?dni=${dniSearch.trim()}`);
        }
      } else {
        console.error("Error during DNI search:", err);
        setError(
          err.response?.data?.message || "Ocurrió un error al buscar por DNI."
        );
      }
      setApoderados(allApoderadosCache);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApoderado = async (apoderadoId, name, dni) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar al apoderado: ${name} (${dni})? Esta acción es permanente.`
      )
    ) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.delete(`/apoderados/${apoderadoId}`);
      alert(`Apoderado ${name} eliminado exitosamente.`);
      fetchApoderados();
    } catch (err) {
      console.error("Error al eliminar apoderado:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Error al eliminar. Revise si el apoderado está asociado a algún estudiante.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFiltered =
    dniSearch.trim() !== "" &&
    apoderados.length === 1 &&
    allApoderadosCache.length > 1;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Título principal */}
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Gestión de Apoderados
          </h2>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Formulario de búsqueda */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">🔍</span> Buscar Apoderado
            </h3>
            {isFiltered && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
              >
                <span>🔄</span> Limpiar
              </button>
            )}
          </div>

          <form
            onSubmit={handleDniSearch}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI del Apoderado
              </label>
              <input
                type="text"
                placeholder="Ingrese DNI..."
                value={dniSearch}
                onChange={(e) => setDniSearch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-md w-full"
                disabled={loading}
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
              <Link
                to="/responsables/new"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition w-full text-center"
              >
                + Nuevo
              </Link>
            </div>
          </form>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            {loading && !apoderados.length ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">
                  Cargando listado de apoderados...
                </p>
              </div>
            ) : apoderados.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👨‍👩‍👧</div>
                <p className="text-gray-500 text-lg">
                  No se encontraron apoderados registrados.
                </p>
              </div>
            ) : (
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
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apoderados.map((a, index) => {
                    const fullName = `${a.primer_nombre} ${a.primer_apellido}`;
                    return (
                      <tr
                        key={a.id}
                        className={`hover:bg-purple-50 transition ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {a.dni}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {a.telefono || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {a.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                          <Link
                            to={`/responsables/edit/${a.id}`}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition shadow-md"
                          >
                            ✏️ Editar
                          </Link>
                          <button
                            onClick={() =>
                              handleDeleteApoderado(a.id, fullName, a.dni)
                            }
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition shadow-md"
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApoderadoListPage;
