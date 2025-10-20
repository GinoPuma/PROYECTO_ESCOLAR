import React, { useState, useEffect } from "react";
import api from "../api/api";

const AssociationManager = ({
  entityId,
  entityType,
  initialDni = "",
  onUpdate,
}) => {
  // entityType: 'student' o 'apoderado'
  const isStudentContext = entityType === "student";

  const targetEntityPath = isStudentContext ? "apoderados" : "students";
  const associatedEndpoint = isStudentContext
    ? `/students/${entityId}/apoderados`
    : `/apoderados/${entityId}/estudiantes`;

  const [dniSearch, setDniSearch] = useState(initialDni);
  const [targetEntity, setTargetEntity] = useState(null);
  const [parentesco, setParentesco] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const [associatedList, setAssociatedList] = useState([]);

  // --- Búsqueda por DNI ---
  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setSearchMessage("");
    setTargetEntity(null);
    setParentesco("");

    if (!dniSearch.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/${targetEntityPath}/dni/${dniSearch.trim()}`);
      setTargetEntity(res.data);
      setSearchMessage(
        `✅ ${isStudentContext ? "Apoderado" : "Estudiante"} encontrado.`
      );
    } catch (err) {
      setSearchMessage(
        `❌ ${isStudentContext ? "Apoderado" : "Estudiante"} no encontrado.`
      );
      setTargetEntity(null);
      setError(err.response?.data?.message || "Error al buscar.");
    } finally {
      setLoading(false);
    }
  };

  // --- Asociación ---
  const handleAssociate = async (e) => {
    e.preventDefault();
    setError("");

    if (!targetEntity)
      return setError(
        "Primero debe buscar y encontrar una persona para asociar."
      );
    if (!parentesco.trim() && isStudentContext)
      return setError("El parentesco es obligatorio para la asociación.");

    setLoading(true);

    try {
      const payload = isStudentContext
        ? { apoderado_id: targetEntity.id, parentesco: parentesco.trim() }
        : { student_id: targetEntity.id, parentesco: parentesco.trim() };

      await api.post(associatedEndpoint, payload);
      alert("Asociación exitosa.");

      // Limpiar y refrescar
      setDniSearch("");
      setTargetEntity(null);
      setParentesco("");
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Error al intentar asociar.");
    } finally {
      setLoading(false);
    }
  };

  // --- Desasociación ---
  const handleRemoveAssociation = async (targetId, targetName) => {
    if (
      !window.confirm(
        `¿Seguro que desea remover la asociación con ${targetName}?`
      )
    )
      return;

    setLoading(true);
    setError("");
    try {
      await api.delete(`${associatedEndpoint}/${targetId}`);
      onUpdate();
    } catch (err) {
      setError(
        err.response?.data?.message || "Error al remover la asociación."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Obtener lista de asociaciones ---
  useEffect(() => {
    if (entityId) {
      const fetchAssociations = async () => {
        try {
          const res = await api.get(associatedEndpoint);
          setAssociatedList(res.data);
        } catch (e) {
          // Ignorar si la entidad aún no está creada
        }
      };
      fetchAssociations();
    }
  }, [entityId, associatedEndpoint, onUpdate]);

  const getTargetName = (item) =>
    `${item.primer_nombre} ${item.primer_apellido}`;

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-bold border-b pb-2 mb-4">
        {isStudentContext ? "Apoderados Asociados" : "Estudiantes Asociados"}
      </h4>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Formulario de Búsqueda y Asociación */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <form onSubmit={handleSearch} className="flex space-x-2 mb-3">
          <input
            type="text"
            placeholder={`DNI del ${
              isStudentContext ? "Apoderado" : "Estudiante"
            } a asociar`}
            value={dniSearch}
            onChange={(e) => setDniSearch(e.target.value)}
            className="flex-grow p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {searchMessage && (
          <p className="text-sm mb-2 text-gray-600">{searchMessage}</p>
        )}

        {/* Confirmación y Datos */}
        {targetEntity && (
          <div className="p-3 mt-3 border-l-4 border-green-500 bg-green-50 space-y-3">
            <p className="font-semibold text-green-700">
              A asociar: {getTargetName(targetEntity)} (DNI:{" "}
              {targetEntity.dni || targetEntity.numero_identificacion})
            </p>

            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Parentesco (Ej: Padre, Madre, Tutor)"
                value={parentesco}
                onChange={(e) => setParentesco(e.target.value)}
                className="p-2 border rounded w-full"
                required={isStudentContext}
              />
              <button
                onClick={handleAssociate}
                className="bg-green-600 text-white p-2 rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Asociando..." : "Confirmar Asociación"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Asociados */}
      <div className="mt-6">
        <h5 className="font-semibold mb-2">
          Asociaciones Actuales ({associatedList.length})
        </h5>
        {associatedList.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay asociaciones registradas.
          </p>
        ) : (
          <ul className="divide-y border rounded">
            {associatedList.map((item) => (
              <li
                key={item.id}
                className="p-3 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <span className="font-medium">{getTargetName(item)}</span>
                  <span className="ml-3 text-sm text-gray-600">
                    ({item.parentesco || "N/A"})
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleRemoveAssociation(item.id, getTargetName(item))
                  }
                  className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                  disabled={loading}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AssociationManager;
