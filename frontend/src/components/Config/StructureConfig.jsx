import React, { useState, useEffect } from "react";
import api from "../../api/api";
import NivelForm from "./NivelForm";
import GradoForm from "./GradoForm";
import SeccionForm from "./SeccionForm";

const StructureConfig = () => {
  const [structure, setStructure] = useState({
    niveles: [],
    grados: [],
    secciones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de Modales
  const [isNivelModalOpen, setIsNivelModalOpen] = useState(false);
  const [editingNivel, setEditingNivel] = useState(null);

  const [isGradoModalOpen, setIsGradoModalOpen] = useState(false);
  const [editingGrado, setEditingGrado] = useState(null);
  const [targetNivelId, setTargetNivelId] = useState(null);

  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState(null);
  const [targetGradoId, setTargetGradoId] = useState(null);

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/config/estructura");
      setStructure(response.data);
    } catch (err) {
      setError("Error al cargar la estructura educativa.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------
  // Lógica CRUD Nivel
  // ------------------------------------
  const handleAddNivel = () => {
    setEditingNivel(null);
    setIsNivelModalOpen(true);
  };

  const handleEditNivel = (nivel) => {
    setEditingNivel(nivel);
    setIsNivelModalOpen(true);
  };

  const handleDeleteNivel = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el Nivel ${nombre}? Esto eliminará todos los grados y secciones asociados.`
      )
    )
      return;

    try {
      await api.delete(`/config/niveles/${id}`);
      alert(`Nivel ${nombre} eliminado.`);
      fetchStructure();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar el nivel. Revise si tiene grados asociados."
      );
    }
  };

  // ------------------------------------
  // Lógica CRUD Grado
  // ------------------------------------
  const handleAddGrado = (nivelId = null) => {
    setEditingGrado(null);
    setTargetNivelId(nivelId);
    setIsGradoModalOpen(true);
  };

  const handleEditGrado = (grado) => {
    setEditingGrado(grado);
    setIsGradoModalOpen(true);
  };

  const handleDeleteGrado = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el Grado ${nombre}? Esto eliminará todas las secciones asociadas.`
      )
    )
      return;

    try {
      await api.delete(`/config/grados/${id}`);
      alert(`Grado ${nombre} eliminado.`);
      fetchStructure();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar el grado. Revise si tiene secciones o matrículas asociadas."
      );
    }
  };

  // ------------------------------------
  // Lógica CRUD Sección
  // ------------------------------------
  const handleAddSeccion = (gradoId = null) => {
    setEditingSeccion(null);
    setTargetGradoId(gradoId);
    setIsSeccionModalOpen(true);
  };

  const handleEditSeccion = (seccion) => {
    setEditingSeccion(seccion);
    setIsSeccionModalOpen(true);
  };

  const handleDeleteSeccion = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar la Sección ${nombre}?`))
      return;

    try {
      await api.delete(`/config/secciones/${id}`);
      alert(`Sección ${nombre} eliminada.`);
      fetchStructure();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error al eliminar la sección. Revise si tiene matrículas asociadas."
      );
    }
  };

  // Función auxiliar para organizar la vista jerárquica
  const organizeStructure = () => {
    return structure.niveles.map((nivel) => ({
      ...nivel,
      grados: structure.grados
        .filter((grado) => grado.nivel_id === nivel.id)
        .map((grado) => ({
          ...grado,
          secciones: structure.secciones.filter(
            (seccion) => seccion.grado_id === grado.id
          ),
        })),
    }));
  };

  const organizedData = organizeStructure();

  return (
    <div className="">
      {/* MODALES DE FORMULARIO */}
      <NivelForm
        isOpen={isNivelModalOpen}
        onClose={() => setIsNivelModalOpen(false)}
        nivel={editingNivel}
        onSave={fetchStructure}
      />
      <GradoForm
        isOpen={isGradoModalOpen}
        onClose={() => setIsGradoModalOpen(false)}
        grado={editingGrado}
        niveles={structure.niveles}
        initialNivelId={targetNivelId}
        onSave={fetchStructure}
      />
      <SeccionForm
        isOpen={isSeccionModalOpen}
        onClose={() => setIsSeccionModalOpen(false)}
        seccion={editingSeccion}
        grados={structure.grados}
        initialGradoId={targetGradoId}
        onSave={fetchStructure}
      />

      <h3 className="text-xl font-semibold mb-3">
        Administración de Niveles, Grados y Secciones
      </h3>
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleAddNivel}
        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-md mb-6"
        disabled={loading}
      >
        + Añadir Nuevo Nivel
      </button>

      {loading && organizedData.length === 0 ? (
        <div className="text-center py-4">Cargando estructura...</div>
      ) : (
        <div className="space-y-6">
          {organizedData.map((nivel) => (
            <div
              key={nivel.id}
              className="border p-4 rounded shadow-sm bg-gray-50"
            >
              {/* ENCABEZADO DEL NIVEL */}
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h4 className="text-lg font-bold text-gray-800">
                  {nivel.nombre}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({nivel.grados.length} Grados)
                  </span>
                </h4>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditNivel(nivel)}
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    Editar Nivel
                  </button>
                  <button
                    onClick={() => handleDeleteNivel(nivel.id, nivel.nombre)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Eliminar Nivel
                  </button>
                </div>
              </div>

              <div className="ml-4 space-y-4">
                {nivel.grados.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay grados configurados en este nivel.
                  </p>
                ) : (
                  nivel.grados.map((grado) => (
                    <div
                      key={grado.id}
                      className="border-l-4 border-blue-500 pl-4 py-2 bg-white shadow-xs rounded"
                    >
                      {/* ENCABEZADO DEL GRADO */}
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-blue-700">
                          Grado: {grado.nombre}
                        </span>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEditGrado(grado)}
                            className="text-xs text-yellow-600 hover:text-yellow-800"
                          >
                            Editar Grado
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteGrado(grado.id, grado.nombre)
                            }
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Eliminar Grado
                          </button>
                        </div>
                      </div>

                      {/* SECCIONES DENTRO DEL GRADO */}
                      <div className="ml-2 mt-2 border-l pl-3">
                        <h5 className="text-sm font-medium mb-1 text-gray-600">
                          Secciones:
                        </h5>
                        {grado.secciones.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            No hay secciones.
                          </p>
                        ) : (
                          <ul className="list-disc ml-4 text-sm text-gray-700">
                            {grado.secciones.map((seccion) => (
                              <li
                                key={seccion.id}
                                className="flex justify-between items-center"
                              >
                                {seccion.nombre}
                                <div className="text-xs space-x-2">
                                  <button
                                    onClick={() => handleEditSeccion(seccion)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteSeccion(
                                        seccion.id,
                                        seccion.nombre
                                      )
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        <button
                          onClick={() => handleAddSeccion(grado.id)}
                          className="text-xs text-green-600 hover:text-green-800 mt-2 block"
                        >
                          + Añadir Sección a {grado.nombre}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {/* Botón para Añadir Grado a este Nivel */}
                <button
                  onClick={() => handleAddGrado(nivel.id)}
                  className="text-sm text-blue-500 hover:underline mt-2 block"
                >
                  + Añadir Grado a {nivel.nombre}
                </button>
              </div>
            </div>
          ))}
          {organizedData.length === 0 && (
            <div className="text-center p-8 text-gray-500 border border-dashed rounded">
              Comience creando el primer Nivel Educativo (Ej: Primaria,
              Secundaria).
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StructureConfig;
