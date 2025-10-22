import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { Link } from 'react-router-dom';

const LevelsConfigPage = () => {
  const [levels, setLevels] = useState([]);
  const [newLevelName, setNewLevelName] = useState("");
  const [editingLevel, setEditingLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.get("/config/levels");
      setLevels(response.data);
    } catch (err) {
      console.error("Error fetching levels:", err);
      setError(
        err.response?.data?.message || "Error al cargar los niveles educativos."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddLevel = async () => {
    if (!newLevelName.trim()) return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/config/levels", { name: newLevelName });
      setLevels([...levels, response.data]);
      setNewLevelName("");
      setSuccessMessage("Nivel educativo añadido.");
    } catch (err) {
      console.error("Error adding level:", err);
      setError(
        err.response?.data?.message || "Error al añadir el nivel educativo."
      );
    }
  };

  const handleEditLevel = (level) => {
    setEditingLevel({ id: level.id, name: level.nombre });
    setNewLevelName(level.nombre);
  };

  const handleUpdateLevel = async () => {
    if (!editingLevel || !newLevelName.trim()) return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.put(`/config/levels/${editingLevel.id}`, {
        name: newLevelName,
      });
      setLevels(
        levels.map((lvl) => (lvl.id === editingLevel.id ? response.data : lvl))
      );
      setEditingLevel(null);
      setNewLevelName("");
      setSuccessMessage("Nivel educativo actualizado.");
    } catch (err) {
      console.error("Error updating level:", err);
      setError(
        err.response?.data?.message || "Error al actualizar el nivel educativo."
      );
    }
  };

  const handleDeleteLevel = async (id) => {
    setError("");
    setSuccessMessage("");
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este nivel? Esto también eliminará los grados y secciones asociados."
      )
    ) {
      try {
        await api.delete(`/config/levels/${id}`);
        setLevels(levels.filter((lvl) => lvl.id !== id));
        setSuccessMessage("Nivel educativo eliminado.");
      } catch (err) {
        console.error("Error deleting level:", err);
        setError(
          err.response?.data?.message || "Error al eliminar el nivel educativo."
        );
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Gestión de Niveles Educativos
        </h2>
        <Link
          to="/configuracion"
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Volver a Configuración
        </Link>
      </div>

      {error && (
        <p className="bg-red-100 text-red-800 p-3 rounded-md mb-4">{error}</p>
      )}
      {successMessage && (
        <p className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
          {successMessage}
        </p>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Nuevo Nombre de Nivel"
          value={newLevelName}
          onChange={(e) => setNewLevelName(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        {editingLevel ? (
          <button
            onClick={handleUpdateLevel}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
          >
            Actualizar Nivel
          </button>
        ) : (
          <button
            onClick={handleAddLevel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Añadir Nivel
          </button>
        )}
        {editingLevel && (
          <button
            onClick={() => {
              setEditingLevel(null);
              setNewLevelName("");
            }}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Cancelar Edición
          </button>
        )}
      </div>

      {loading ? (
        <p>Cargando niveles...</p>
      ) : levels.length === 0 ? (
        <p>No hay niveles educativos configurados aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {levels.map((level) => (
                <tr key={level.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {level.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {level.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                    <button
                      onClick={() => handleEditLevel(level)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(level.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LevelsConfigPage;
