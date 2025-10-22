import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { Link } from 'react-router-dom';

const SectionsConfigPage = () => {
  const [sections, setSections] = useState([]);
  const [grades, setGrades] = useState([]);
  const [newSection, setNewSection] = useState({ name: "", grade_id: "" });
  const [editingSection, setEditingSection] = useState(null); // { id, name, grade_id }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const [sectionsRes, gradesRes] = await Promise.all([
        api.get("/config/sections"),
        api.get("/config/grades"),
      ]);
      setSections(sectionsRes.data);
      setGrades(gradesRes.data);
      // Si editamos, necesitamos pre-seleccionar el grado
      if (editingSection && gradesRes.data.length > 0) {
        const gradeToSelect = gradesRes.data.find(
          (grd) => grd.id === editingSection.grade_id
        );
        if (gradeToSelect) {
          setNewSection((prev) => ({ ...prev, grade_id: gradeToSelect.id }));
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

  const handleAddSection = async () => {
    if (!newSection.name.trim() || !newSection.grade_id) return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/config/sections", newSection);
      setSections([...sections, response.data]);
      setNewSection({ name: "", grade_id: "" });
      setSuccessMessage("Sección añadida.");
    } catch (err) {
      console.error("Error adding section:", err);
      setError(err.response?.data?.message || "Error al añadir la sección.");
    }
  };

  const handleEditSection = (section) => {
    setEditingSection({
      id: section.id,
      name: section.nombre,
      grade_id: section.grado_id,
    });
    setNewSection({ name: section.nombre, grade_id: section.grado_id });
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !newSection.name.trim() || !newSection.grade_id)
      return;
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.put(
        `/config/sections/${editingSection.id}`,
        newSection
      );
      setSections(
        sections.map((sec) =>
          sec.id === editingSection.id ? response.data : sec
        )
      );
      setEditingSection(null);
      setNewSection({ name: "", grade_id: "" });
      setSuccessMessage("Sección actualizada.");
    } catch (err) {
      console.error("Error updating section:", err);
      setError(
        err.response?.data?.message || "Error al actualizar la sección."
      );
    }
  };

  const handleDeleteSection = async (id) => {
    setError("");
    setSuccessMessage("");
    if (window.confirm("¿Estás seguro de que quieres eliminar esta sección?")) {
      try {
        await api.delete(`/config/sections/${id}`);
        setSections(sections.filter((sec) => sec.id !== id));
        setSuccessMessage("Sección eliminada.");
      } catch (err) {
        console.error("Error deleting section:", err);
        setError(
          err.response?.data?.message || "Error al eliminar la sección."
        );
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Gestión de Secciones
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
            placeholder="Nombre de Sección (ej: A)"
            value={newSection.name}
            onChange={(e) =>
              setNewSection({ ...newSection, name: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <select
            value={newSection.grade_id}
            onChange={(e) =>
              setNewSection({ ...newSection, grade_id: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Seleccionar Grado</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.nombre} ({grade.nivel_nombre})
              </option>
            ))}
          </select>
        </div>

        {editingSection ? (
          <button
            onClick={handleUpdateSection}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Actualizar Sección
          </button>
        ) : (
          <button
            onClick={handleAddSection}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Añadir Sección
          </button>
        )}
        {editingSection && (
          <button
            onClick={() => {
              setEditingSection(null);
              setNewSection({ name: "", grade_id: "" });
            }}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md min-w-[150px]"
          >
            Cancelar Edición
          </button>
        )}
      </div>

      {loading ? (
        <p>Cargando secciones...</p>
      ) : sections.length === 0 ? (
        <p>No hay secciones configuradas aún.</p>
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
                  Sección
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
              {sections.map((section) => (
                <tr key={section.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {section.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.grado_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.nivel_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                    <button
                      onClick={() => handleEditSection(section)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
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

export default SectionsConfigPage;
