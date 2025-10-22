import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/api";
import { Link } from 'react-router-dom';

const GradesConfigPage = () => {
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]); // Para el dropdown de niveles
  const [newGrade, setNewGrade] = useState({ name: "", level_id: "" });
  const [editingGrade, setEditingGrade] = useState(null); // { id, name, level_id }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch initial data (levels and grades)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const [gradesRes, levelsRes] = await Promise.all([
        api.get("/config/grades"),
        api.get("/config/levels"),
      ]);
      setGrades(gradesRes.data);
      setLevels(levelsRes.data);
      // Si editamos, necesitamos pre-seleccionar el nivel
      if (editingGrade && levelsRes.data.length > 0) {
        const levelToSelect = levelsRes.data.find(
          (lvl) => lvl.id === editingGrade.level_id
        );
        if (levelToSelect) {
          setNewGrade((prev) => ({ ...prev, level_id: levelToSelect.id }));
        }
      }
    } catch (err) {
      console.error("Error fetching config data:", err);
      setError(
        err.response?.data?.message || "Error al cargar datos de configuración."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = async () => {
    if (!newGrade.name.trim() || !newGrade.level_id) return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/config/grades", newGrade);
      setGrades([...grades, response.data]);
      setNewGrade({ name: "", level_id: "" });
      setSuccessMessage("Grado añadido.");
    } catch (err) {
      console.error("Error adding grade:", err);
      setError(err.response?.data?.message || "Error al añadir el grado.");
    }
  };

  const handleEditGrade = (grade) => {
    setEditingGrade({
      id: grade.id,
      name: grade.nombre,
      level_id: grade.nivel_id,
    });
    setNewGrade({ name: grade.nombre, level_id: grade.nivel_id });
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade || !newGrade.name.trim() || !newGrade.level_id) return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.put(
        `/config/grades/${editingGrade.id}`,
        newGrade
      );
      setGrades(
        grades.map((grd) => (grd.id === editingGrade.id ? response.data : grd))
      );
      setEditingGrade(null);
      setNewGrade({ name: "", level_id: "" });
      setSuccessMessage("Grado actualizado.");
    } catch (err) {
      console.error("Error updating grade:", err);
      setError(err.response?.data?.message || "Error al actualizar el grado.");
    }
  };

  const handleDeleteGrade = async (id) => {
    setError("");
    setSuccessMessage("");
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este grado? Esto también eliminará las secciones asociadas."
      )
    ) {
      try {
        await api.delete(`/config/grades/${id}`);
        setGrades(grades.filter((grd) => grd.id !== id));
        setSuccessMessage("Grado eliminado.");
      } catch (err) {
        console.error("Error deleting grade:", err);
        setError(err.response?.data?.message || "Error al eliminar el grado.");
      }
    }
  };

  // Helper para obtener el nombre del nivel por su ID
  const getLevelName = (levelId) => {
    const level = levels.find((lvl) => lvl.id === levelId);
    return level ? level.nombre : "Desconocido";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Gestión de Grados
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

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Grado (ej: 1er Grado)"
            value={newGrade.name}
            onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <select
            value={newGrade.level_id}
            onChange={(e) =>
              setNewGrade({ ...newGrade, level_id: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Seleccionar Nivel</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.nombre}
              </option>
            ))}
          </select>
        </div>

        {editingGrade ? (
          <button
            onClick={handleUpdateGrade}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Actualizar Grado
          </button>
        ) : (
          <button
            onClick={handleAddGrade}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Añadir Grado
          </button>
        )}
        {editingGrade && (
          <button
            onClick={() => {
              setEditingGrade(null);
              setNewGrade({ name: "", level_id: "" });
            }}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Cancelar Edición
          </button>
        )}
      </div>

      {loading ? (
        <p>Cargando grados...</p>
      ) : grades.length === 0 ? (
        <p>No hay grados configurados aún.</p>
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
                  Grado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nivel
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
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {grade.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.nivel_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                    <button
                      onClick={() => handleEditGrade(grade)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteGrade(grade.id)}
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

export default GradesConfigPage;
