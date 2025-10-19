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
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Gestión de Apoderados
      </h2>

      {/* Formulario de búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <form
          onSubmit={handleDniSearch}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            placeholder="Buscar por DNI"
            value={dniSearch}
            onChange={(e) => setDniSearch(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar Apoderado"}
          </button>
          <Link
            to="/responsables/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            + Nuevo
          </Link>
        </form>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">¡Alerta!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {/* Listado de apoderados */}
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

        {loading && !apoderados.length ? (
          <div className="text-center py-4">Cargando listado...</div>
        ) : apoderados.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No hay apoderados registrados.
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
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apoderados.map((apoderado) => {
                  const fullName = `${apoderado.primer_nombre} ${apoderado.primer_apellido}`;
                  return (
                    <tr key={apoderado.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {apoderado.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apoderado.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apoderado.email || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-3">
                        <Link
                          to={`/responsables/edit/${apoderado.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() =>
                            handleDeleteApoderado(
                              apoderado.id,
                              fullName,
                              apoderado.dni
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

export default ApoderadoListPage;
